# from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets, status, permissions
from .models import Produto, Colecao, Pedido, Cupom
from .serializers import ProdutoSerializer, RegistrarClienteSerializer, ClientePerfilSerializer, ColecaoSerializer, PedidoSerializer

class ColecaoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Colecao.objects.filter(ativa=True)
    serializer_class = ColecaoSerializer

class ProdutoViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ProdutoSerializer

    def get_queryset(self):
        queryset = Produto.objects.all()
        colecao_id = self.request.query_params.get('colecao')
        
        if colecao_id:
            queryset = queryset.filter(colecao_id=colecao_id)
            
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

class PedidoViewSet(viewsets.ModelViewSet):
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
        # Permite que convidados criem pedidos (POST), mas exige login para listar/detalhar
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]


class CupomViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Cupom.objects.filter(status__iexact='Ativo')
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

        return Response({
            "valido": True,
            "mensagem": "Cupom aplicado com sucesso!",
            "id_cupom": cupom.id_cupom,
            "codigo": cupom.codigo,
            "tipo_desconto": cupom.tipo_desconto,
            "valor_desconto_calculado": round(valor_desconto, 2),
            "novo_subtotal": round(subtotal - valor_desconto, 2)
        }, status=status.HTTP_200_OK)