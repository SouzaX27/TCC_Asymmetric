# from django.shortcuts import render
from decimal import Decimal
from datetime import timedelta
from django.conf import settings
from django.core import signing
from django.db import transaction
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets, status, permissions
from .serializers import ProdutoSerializer, RegistrarClienteSerializer, ClientePerfilSerializer, ColecaoSerializer, PedidoSerializer, CalcularFreteInputSerializer, CupomSerializer
from .services import calcular_frete_melhor_envio, criar_pagamento_gateway_demo, consultar_pagamento_gateway_demo
from .models import Produto, VariacaoProduto, Colecao, Pedido, Cupom, PagamentoDemonstracao

class ColecaoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Colecao.objects.filter(ativa=True)
    serializer_class = ColecaoSerializer
    lookup_field = 'slug'

class ProdutoViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ProdutoSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        queryset = Produto.objects.all()
        colecao_slug = self.request.query_params.get('colecao')
        
        if colecao_slug:
            queryset = queryset.filter(colecao__id=colecao_slug)
            
        return queryset

class RegistrarClienteView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegistrarClienteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"mensagem": "Cliente cadastrado com sucesso!"}, 
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # request.user vem do token JWT enviado no Header
        cliente = request.user.cliente
        serializer = ClientePerfilSerializer(cliente)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        cliente = request.user.cliente
        serializer = ClientePerfilSerializer(cliente, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PedidoViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PedidoSerializer
    
    def get_queryset(self):
        user = self.request.user
        # Se for admin, pode ver todos os pedidos
        if user.is_staff:
            return Pedido.objects.all()
        # Se for cliente autenticado, vê apenas os seus próprios pedidos
        if hasattr(user, 'cliente'):
            return Pedido.objects.filter(cliente=user.cliente)
        # Se convidado, não lista históricos
        return Pedido.objects.none()

    def get_permissions(self):
        return [permissions.IsAuthenticated()]


class CriarPagamentoDemonstracaoView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        if not getattr(settings, 'PAGAMENTOS_DEMO_ATIVOS', settings.DEBUG):
            return Response(status=status.HTTP_404_NOT_FOUND)

        serializer = PedidoSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        pagamento = PagamentoDemonstracao.objects.create(
            dados_pedido=request.data,
            valor_total=serializer.validated_data['_valor_total'],
            expira_em=timezone.now() + timedelta(minutes=20)
        )
        gateway_disponivel = False
        if settings.URL_GATEWAY_DEMO and settings.SEGREDO_GATEWAY_DEMO:
            gateway, erro = criar_pagamento_gateway_demo(pagamento.valor_total, str(pagamento.token))
            if gateway:
                pagamento.id_pagamento_gateway = gateway['id_pagamento']
                pagamento.url_checkout = gateway['url_checkout']
                pagamento.save(update_fields=['id_pagamento_gateway', 'url_checkout'])
                gateway_disponivel = True

        return Response({
            'token': str(pagamento.token),
            'status': pagamento.status,
            'url_checkout': pagamento.url_checkout or None,
            'gateway_disponivel': gateway_disponivel,
            'valor_total': str(pagamento.valor_total),
            'subtotal': str(serializer.validated_data['_subtotal']),
            'desconto': str(serializer.validated_data['_desconto']),
            'frete': str(serializer.validated_data['_frete']),
            'expira_em': pagamento.expira_em,
        }, status=status.HTTP_201_CREATED)


class PagamentoDemonstracaoView(APIView):
    permission_classes = [permissions.AllowAny]

    def obter_pagamento(self, token, lock=False):
        queryset = PagamentoDemonstracao.objects
        if lock:
            queryset = queryset.select_for_update()
        return queryset.get(token=token)

    def montar_resposta(self, pagamento):
        return {
            'token': str(pagamento.token),
            'status': pagamento.status,
            'valor_total': str(pagamento.valor_total),
            'expira_em': pagamento.expira_em,
            'id_pedido': pagamento.pedido_id,
            'url_checkout': pagamento.url_checkout or None,
            'gateway_configurado': bool(pagamento.id_pagamento_gateway),
        }

    def finalizar_pedido(self, pagamento, request):
        with transaction.atomic():
            pagamento = self.obter_pagamento(pagamento.token, lock=True)
            if pagamento.status == 'aprovado':
                return pagamento
            if pagamento.status != 'pendente' or pagamento.expira_em <= timezone.now():
                pagamento.status = 'expirado'
                pagamento.save(update_fields=['status'])
                return pagamento

            serializer = PedidoSerializer(
                data=pagamento.dados_pedido,
                context={'request': request}
            )
            serializer.is_valid(raise_exception=True)
            pedido = serializer.save(status='Pagamento Aprovado (Demo)')
            pagamento.pedido = pedido
            pagamento.status = 'aprovado'
            pagamento.save(update_fields=['pedido', 'status'])
            return pagamento

    def sincronizar_pagamento_remoto(self, pagamento, request):
        if not pagamento.id_pagamento_gateway or pagamento.status != 'pendente':
            return False

        gateway, erro = consultar_pagamento_gateway_demo(pagamento.id_pagamento_gateway)
        if erro:
            return False
        try:
            valor_gateway = Decimal(str(gateway['valor'])).quantize(Decimal('0.01'))
        except (KeyError, TypeError, ValueError, ArithmeticError):
            return False
        if gateway.get('referencia') != str(pagamento.token) or valor_gateway != pagamento.valor_total:
            return False
        if gateway.get('status') == 'aprovado':
            self.finalizar_pedido(pagamento, request)
        elif gateway.get('status') == 'expirado':
            pagamento.status = 'expirado'
            pagamento.save(update_fields=['status'])
        return True

    def get(self, request, token):
        try:
            pagamento = self.obter_pagamento(token)
        except PagamentoDemonstracao.DoesNotExist:
            return Response({'erro': 'Cobrança não encontrada.'}, status=status.HTTP_404_NOT_FOUND)
        if pagamento.status == 'pendente' and pagamento.expira_em <= timezone.now():
            pagamento.status = 'expirado'
            pagamento.save(update_fields=['status'])
        gateway_disponivel = self.sincronizar_pagamento_remoto(pagamento, request)
        pagamento.refresh_from_db()
        return Response({**self.montar_resposta(pagamento), 'gateway_disponivel': gateway_disponivel})

    def post(self, request, token):
        if not getattr(settings, 'PAGAMENTOS_DEMO_ATIVOS', settings.DEBUG):
            return Response(status=status.HTTP_404_NOT_FOUND)

        try:
            pagamento = self.obter_pagamento(token)
            if pagamento.status == 'aprovado':
                return Response(self.montar_resposta(pagamento))
            if pagamento.status != 'pendente' or pagamento.expira_em <= timezone.now():
                pagamento.status = 'expirado'
                pagamento.save(update_fields=['status'])
                return Response({'erro': 'Esta cobrança expirou.'}, status=status.HTTP_410_GONE)
            pagamento = self.finalizar_pedido(pagamento, request)
        except PagamentoDemonstracao.DoesNotExist:
            return Response({'erro': 'Cobrança não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        return Response(self.montar_resposta(pagamento))


class CupomViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Cupom.objects.filter(status__iexact='Ativo')
    serializer_class = CupomSerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['post'], url_path='validar')
    def validar_cupom(self, request):
        codigo = request.data.get('codigo', '').strip()
        subtotal = request.data.get('subtotal', 0)

        try:
            subtotal = float(subtotal)
        except (ValueError, TypeError):
            return Response({"error": "Subtotal inválido."}, status=status.HTTP_400_BAD_REQUEST)

        if not codigo:
            return Response({"error": "Informe o código do cupom."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            cupom = Cupom.objects.get(codigo__iexact=codigo)
        except Cupom.DoesNotExist:
            return Response({"error": "Cupom não encontrado."}, status=status.HTTP_404_NOT_FOUND)

        valido, mensagem = cupom.e_valido(subtotal)
        if not valido:
            return Response({"error": mensagem}, status=status.HTTP_400_BAD_REQUEST)

        valor_desconto = cupom.calcular_desconto(subtotal)
        
        # Converte subtotal para Decimal para evitar o erro de tipos incompatíveis com o Decimal do banco
        subtotal_decimal = Decimal(str(subtotal))
        novo_subtotal = subtotal_decimal - Decimal(str(valor_desconto))

        return Response({
            "valido": True,
            "mensagem": "Cupom aplicado com sucesso!",
            "id_cupom": cupom.id_cupom,
            "codigo": cupom.codigo,
            "tipo_desconto": cupom.tipo_desconto,
            "valor_desconto_calculado": round(float(valor_desconto), 2),
            "novo_subtotal": round(float(novo_subtotal), 2)
        }, status=status.HTTP_200_OK)


class CalcularFreteView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = CalcularFreteInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        cep_destino = serializer.validated_data['cep_destino']
        itens_raw = serializer.validated_data['itens']

        # Extrai os IDs das variações solicitadas
        ids_variacoes = [item['variacao_produto'] for item in itens_raw]

        # Consulta SQL única trazendo variação + produto
        variacoes_db = VariacaoProduto.objects.filter(id_variacao__in=ids_variacoes).select_related('produto')
        mapa_variacoes = {v.id_variacao: v for v in variacoes_db}

        # Valida existência de todos os itens no banco
        itens_com_objetos = []
        for item in itens_raw:
            var_id = item['variacao_produto']
            if var_id not in mapa_variacoes:
                return Response(
                    {"erro": f"Variação de produto #{var_id} não encontrada."},
                    status=status.HTTP_404_NOT_FOUND
                )
            itens_com_objetos.append({
                'variacao_obj': mapa_variacoes[var_id],
                'quantidade': item['quantidade']
            })

        # Executa a cotação no serviço externo
        opcoes_frete, erro = calcular_frete_melhor_envio(cep_destino, itens_com_objetos)

        if erro and settings.PAGAMENTOS_DEMO_ATIVOS and not settings.MELHOR_ENVIO_TOKEN:
            opcoes_frete = [
                {'id_servico': 0, 'nome': 'PAC demonstrativo', 'preco': '14.30', 'prazo_dias': 5},
                {'id_servico': 1, 'nome': 'SEDEX demonstrativo', 'preco': '26.30', 'prazo_dias': 2},
            ]
            erro = None

        if erro:
            return Response({"mensagem": erro}, status=status.HTTP_502_BAD_GATEWAY)

        itens_cotados = sorted(
            [[item['variacao_produto'], item['quantidade']] for item in itens_raw],
            key=lambda item: item[0]
        )
        opcoes_assinadas = []
        for opcao in opcoes_frete:
            opcao = dict(opcao)
            opcao['cotacao_token'] = signing.dumps({
                'cep_destino': cep_destino,
                'itens': itens_cotados,
                'servico_id': opcao.get('id_servico', 0),
                'servico_nome': opcao.get('nome') or 'Entrega',
                'preco': str(opcao.get('preco', '0.00')),
                'prazo_dias': opcao.get('prazo_dias') or 0,
            }, salt='store.freight-quote')
            opcoes_assinadas.append(opcao)

        return Response({
            "cep_destino": cep_destino,
            "opcoes": opcoes_assinadas
        }, status=status.HTTP_200_OK)