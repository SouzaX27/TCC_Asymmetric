import re
from decimal import Decimal
from django.contrib.auth.models import User
from rest_framework import serializers
from django.contrib.auth.models import User
from django.db import transaction
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core import signing
from .models import Produto, VariacaoProduto, Cliente, Colecao, Pedido, ItemPedido, Estoque, Cupom, ImagemProduto

class VariacaoProdutoSerializer(serializers.ModelSerializer):
    estoque_atual = serializers.IntegerField(read_only=True)

    class Meta:
        model = VariacaoProduto
        fields = ['id_variacao', 'tamanho', 'estoque_atual']

class ColecaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Colecao
        fields = ['id_colecao', 'nome', 'slug', 'descricao', 'ativa']


class ImagemProdutoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImagemProduto
        fields = ['id_imagem', 'imagem', 'medidas']        

class ProdutoSerializer(serializers.ModelSerializer):
    imagens = ImagemProdutoSerializer(many=True, read_only=True)
    variacoes = VariacaoProdutoSerializer(many=True, read_only=True)
    colecao_nome = serializers.ReadOnlyField(source='colecao.nome')

    class Meta:
        model = Produto
        fields = ['id_produto', 'nome', 'slug', 'cor', 'descricao', 'preco', 'imagens', 'variacoes', 'colecao', 'colecao_nome']


class RegistrarClienteSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True, required=True)
    password = serializers.CharField(write_only=True, required=True, min_length=6)

    class Meta:
        model = Cliente
        fields = ['email', 'password', 'nome', 'telefone']

    # valida se o email já existe
    def validate_email(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Este e-mail já está cadastrado.")
        return value

    # validação do telefone
    def validate_telefone(self, value):
        if not value:
            raise serializers.ValidationError("O telefone é obrigatório.")

        # retira o q não é numero
        apenas_numeros = re.sub(r'\D', '', value)

        # verifica se possui exatos 11 dígitos (DDD + 9 dígitos)
        if len(apenas_numeros) != 11:
            raise serializers.ValidationError("O telefone deve conter exatos 11 dígitos (Ex: 11991234567).")

        # verifica se o número já está sendo utilizado
        if Cliente.objects.filter(telefone=apenas_numeros).exists():
            raise serializers.ValidationError("Este número de telefone já está cadastrado.")

        return apenas_numeros

    def create(self, validated_data):
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        nome = validated_data.pop('nome')
        telefone = validated_data.pop('telefone')

        usuario = User.objects.create_user(
            username=email,
            email=email,
            password=password
        )

        cliente = Cliente.objects.create(
            user=usuario,
            nome=nome,
            telefone=telefone
        )

        return cliente


class ClientePerfilSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Cliente
        fields = ['id_cliente', 'email', 'nome', 'telefone']

    def validate_telefone(self, value):
        if not value:
            raise serializers.ValidationError("O telefone é obrigatório.")

        apenas_numeros = re.sub(r'\D', '', value)

        if len(apenas_numeros) != 11:
            raise serializers.ValidationError("O telefone deve conter exatos 11 dígitos (Ex: 11991234567).")

        # Verifica se o número já pertence a OUTRO cliente
        cliente_atual = self.instance
        if Cliente.objects.filter(telefone=apenas_numeros).exclude(pk=cliente_atual.pk).exists():
            raise serializers.ValidationError("Este número de telefone já está em uso por outra conta.")

        return apenas_numeros



class ItemPedidoSerializer(serializers.ModelSerializer):
    quantidade = serializers.IntegerField(min_value=1)
    # Expõe os detalhes da variação para leitura
    variacao_nome = serializers.ReadOnlyField(source='variacao_produto.produto.nome')
    tamanho = serializers.ReadOnlyField(source='variacao_produto.tamanho')

    class Meta:
        model = ItemPedido
        fields = ['id_item', 'variacao_produto', 'variacao_nome', 'tamanho', 'quantidade', 'preco_unitario']
        # preco_unitario será definido automaticamente com base no preço do produto no momento do checkout
        extra_kwargs = {'preco_unitario': {'required': False}}


class PedidoSerializer(serializers.ModelSerializer):
    itens = ItemPedidoSerializer(many=True, min_length=1)
    frete_cotacao = serializers.CharField(write_only=True)

    # garante a obrigatoriedade na enttrada da api (Checkout)
    cep_entrega = serializers.CharField(max_length=9, required=True, allow_blank=False)
    endereco_entrega = serializers.CharField(max_length=255, required=True, allow_blank=False)
    numero_entrega = serializers.CharField(max_length=20, required=True, allow_blank=False)
    bairro_entrega = serializers.CharField(max_length=100, required=True, allow_blank=False)
    cidade_entrega = serializers.CharField(max_length=100, required=True, allow_blank=False)
    estado_entrega = serializers.CharField(max_length=2, required=True, allow_blank=False)
    
    servico_frete_id = serializers.IntegerField(required=False)
    servico_frete_nome = serializers.CharField(max_length=50, required=False, allow_blank=False)
    prazo_frete_dias = serializers.IntegerField(required=False)

    class Meta:
            model = Pedido
            fields = [
                'id_pedido',
                'cliente',
                'cupom',
                'nome_comprador',
                'email_comprador',
                'telefone_comprador',
                'cep_entrega',
                'endereco_entrega',
                'numero_entrega',
                'complemento_entrega',
                'bairro_entrega',
                'cidade_entrega',
                'estado_entrega',
                'servico_frete_id',
                'servico_frete_nome',
                'prazo_frete_dias',
                'metodo_pagamento',
                'data_pedido',
                'status',
                'sub_total',
                'frete',
                'desconto',
                'valor_final',
                'itens',
                'frete_cotacao'
            ]
            read_only_fields = [
                'id_pedido', 
                'cliente',
                'data_pedido', 
                'status',
                'sub_total', 
                'desconto', 
                'valor_final',
                'frete',
                'metodo_pagamento',
                'servico_frete_id',
                'servico_frete_nome',
                'prazo_frete_dias',
                'id_transacao_gateway',
                'qr_code_pix',
                'qr_code_base64',
                'ticket_url'
            ]

    def validate(self, attrs):
        try:
            cotacao = signing.loads(attrs['frete_cotacao'], salt='store.freight-quote', max_age=3600)
        except (signing.BadSignature, signing.SignatureExpired, KeyError, TypeError):
            raise serializers.ValidationError({'frete_cotacao': 'Cotação de frete inválida ou expirada.'})

        cep = attrs['cep_entrega'].replace('-', '').replace(' ', '')
        itens = sorted(
            [[item['variacao_produto'].id_variacao, item['quantidade']] for item in attrs['itens']],
            key=lambda item: item[0]
        )
        if cotacao.get('cep_destino') != cep or cotacao.get('itens') != itens:
            raise serializers.ValidationError({'frete_cotacao': 'A cotação não corresponde ao CEP e aos itens do pedido.'})

        try:
            frete = Decimal(cotacao['preco'])
            servico_id = int(cotacao['servico_id'])
            servico_nome = str(cotacao['servico_nome'])[:50]
            prazo = int(cotacao['prazo_dias'])
        except (KeyError, TypeError, ValueError, ArithmeticError):
            raise serializers.ValidationError({'frete_cotacao': 'Dados da cotação inválidos.'})
        if frete < 0 or prazo < 0:
            raise serializers.ValidationError({'frete_cotacao': 'Dados da cotação inválidos.'})

        subtotal = sum(
            (item['variacao_produto'].produto.preco * item['quantidade'] for item in attrs['itens']),
            Decimal('0.00')
        )
        cupom = attrs.get('cupom')
        desconto = Decimal('0.00')
        if cupom:
            valido, mensagem = cupom.e_valido(subtotal)
            if not valido:
                raise serializers.ValidationError({'cupom': mensagem})
            desconto = Decimal(str(cupom.calcular_desconto(subtotal))).quantize(Decimal('0.01'))

        attrs['frete'] = frete
        attrs['servico_frete_id'] = servico_id
        attrs['servico_frete_nome'] = servico_nome
        attrs['prazo_frete_dias'] = prazo
        attrs['_subtotal'] = subtotal
        attrs['_desconto'] = desconto
        attrs['_frete'] = frete
        attrs['_valor_total'] = max(Decimal('0.00'), subtotal + frete - desconto)
        return attrs

    def create(self, validated_data):
        itens_data = validated_data.pop('itens')
        validated_data.pop('frete_cotacao', None)
        validated_data.pop('_subtotal', None)
        validated_data.pop('_desconto', None)
        validated_data.pop('_frete', None)
        validated_data.pop('_valor_total', None)
        status_pedido = validated_data.pop('status', 'Pagamento Aprovado (Demo)')
        validated_data['metodo_pagamento'] = 'demonstracao'
        cupom = validated_data.pop('cupom', None)
        
        with transaction.atomic():
            request = self.context.get('request')
            if request and hasattr(request.user, 'cliente'):
                validated_data['cliente'] = request.user.cliente

            quantidades = {}
            for item in itens_data:
                variacao_id = item['variacao_produto'].id_variacao
                quantidades[variacao_id] = quantidades.get(variacao_id, 0) + item['quantidade']

            variacoes = VariacaoProduto.objects.select_for_update().filter(
                id_variacao__in=quantidades
            ).select_related('produto')
            variacoes_por_id = {variacao.id_variacao: variacao for variacao in variacoes}
            if len(variacoes_por_id) != len(quantidades):
                raise serializers.ValidationError({'itens': 'Um ou mais produtos não estão mais disponíveis.'})

            for variacao_id, quantidade in quantidades.items():
                variacao = variacoes_por_id[variacao_id]
                if variacao.estoque_atual < quantidade:
                    raise serializers.ValidationError(
                        {'itens': f'Estoque insuficiente para {variacao.produto.nome} ({variacao.tamanho}).'}
                    )

            if cupom:
                cupom = Cupom.objects.select_for_update().get(pk=cupom.pk)

            pedido = Pedido.objects.create(
                sub_total=Decimal('0.00'),
                desconto=Decimal('0.00'),
                valor_final=Decimal('0.00'),
                status=status_pedido,
                frete=validated_data.pop('frete'),
                **validated_data
            )

            sub_total = Decimal('0.00')
            for variacao_id, quantidade in quantidades.items():
                variacao = variacoes_por_id[variacao_id]
                preco_unitario = variacao.produto.preco
                ItemPedido.objects.create(
                    pedido=pedido,
                    variacao_produto=variacao,
                    quantidade=quantidade,
                    preco_unitario=preco_unitario
                )

                Estoque.objects.create(
                    variacao_produto=variacao,
                    pedido=pedido,
                    quantidade=quantidade,
                    tipo='Saida',
                    motivo=f"Venda - Pedido #{pedido.id_pedido}"
                )

                sub_total += Decimal(str(preco_unitario)) * quantidade

            valor_desconto = Decimal('0.00')
            if cupom:
                valido, mensagem = cupom.e_valido(sub_total)
                if not valido:
                    raise serializers.ValidationError({"cupom": mensagem})

                valor_desconto = Decimal(str(cupom.calcular_desconto(sub_total))).quantize(Decimal('0.01'))
                cupom.quantidade_disponivel -= 1
                if cupom.quantidade_disponivel <= 0:
                    cupom.status = 'Inativo'

                cupom.save()

            pedido.sub_total = sub_total
            pedido.desconto = valor_desconto
            pedido.valor_final = max(Decimal('0.00'), sub_total + pedido.frete - valor_desconto)
            pedido.save()

            return pedido


class ValidarCupomInputSerializer(serializers.Serializer):
    codigo = serializers.CharField(max_length=50, required=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0, required=True)

class CupomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cupom
        fields = [
            'id_cupom',
            'codigo',
            'desconto',
            'tipo_desconto',
            'valor_minimo',
            'data_inicio',
            'data_expiracao',
            'quantidade_disponivel',
            'status'
        ]


class FreteItemInputSerializer(serializers.Serializer):
    variacao_produto = serializers.IntegerField(min_value=1)
    quantidade = serializers.IntegerField(min_value=1)

class CalcularFreteInputSerializer(serializers.Serializer):
    cep_destino = serializers.CharField(max_length=9, min_length=8)
    itens = FreteItemInputSerializer(many=True)

    def validate_cep_destino(self, value):
        cep_limpo = value.replace('-', '').replace(' ', '')
        if not cep_limpo.isdigit() or len(cep_limpo) != 8:
            raise serializers.ValidationError("CEP inválido. Forneça exatamente 8 dígitos numéricos.")
        return cep_limpo