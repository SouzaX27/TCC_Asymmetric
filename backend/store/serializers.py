import re
from decimal import Decimal
from django.contrib.auth.models import User
from rest_framework import serializers
from django.contrib.auth.models import User
from django.db import transaction
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import Produto, VariacaoProduto, Cliente, Colecao, Pedido, ItemPedido, Estoque, Cupom

class VariacaoProdutoSerializer(serializers.ModelSerializer):
    estoque_atual = serializers.IntegerField(read_only=True)

    class Meta:
        model = VariacaoProduto
        fields = ['id_variacao', 'tamanho', 'estoque_atual']

class ColecaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Colecao
        fields = ['id_colecao', 'nome', 'descricao', 'ativa']

class ProdutoSerializer(serializers.ModelSerializer):
    variacoes = VariacaoProdutoSerializer(many=True, read_only=True)
    colecao_nome = serializers.ReadOnlyField(source='colecao.nome')

    class Meta:
        model = Produto
        fields = ['id_produto', 'nome', 'cor', 'descricao', 'preco', 'imagem', 'variacoes', 'colecao', 'colecao_nome']


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
    # Expõe os detalhes da variação para leitura
    variacao_nome = serializers.ReadOnlyField(source='variacao_produto.produto.nome')
    tamanho = serializers.ReadOnlyField(source='variacao_produto.tamanho')

    class Meta:
        model = ItemPedido
        fields = ['id_item', 'variacao_produto', 'variacao_nome', 'tamanho', 'quantidade', 'preco_unitario']
        # preco_unitario será definido automaticamente com base no preço do produto no momento do checkout
        extra_kwargs = {'preco_unitario': {'required': False}}


class PedidoSerializer(serializers.ModelSerializer):
    itens = ItemPedidoSerializer(many=True)

    class Meta:
        model = Pedido
        fields = [
            'id_pedido',
            'cliente',
            'cupom',
            'nome_comprador',
            'email_comprador',
            'telefone_comprador',
            'data_pedido',
            'status',
            'sub_total',
            'frete',
            'desconto',
            'valor_final',
            'itens'
        ]
        read_only_fields = ['id_pedido', 'data_pedido', 'sub_total', 'desconto', 'valor_final']

    def create(self, validated_data):
        itens_data = validated_data.pop('itens')
        cupom = validated_data.get('cupom', None)
        
        # Garante que todas as operações (Pedido, Itens, Estoque e Cupom) ocorram dentro de uma transação SQL
        with transaction.atomic():
            # Associa o cliente se estiver autenticado
            request = self.context.get('request')
            if request and hasattr(request.user, 'cliente'):
                validated_data['cliente'] = request.user.cliente

            # Converte o frete para Decimal
            frete = Decimal(str(validated_data.get('frete', 0)))

            # Cria o Pedido inicial zerado para obter o id_pedido
            pedido = Pedido.objects.create(
                sub_total=Decimal('0.00'),
                desconto=Decimal('0.00'),
                valor_final=Decimal('0.00'),
                **validated_data
            )

            sub_total = Decimal('0.00')

            # Processa cada item do pedido, valida estoque e calcula o subtotal
            for item_data in itens_data:
                variacao = item_data['variacao_produto']
                quantidade = item_data['quantidade']
                preco_unitario = variacao.produto.preco

                # Verifica estoque suficiente
                if variacao.estoque_atual < quantidade:
                    raise serializers.ValidationError(
                        f"Estoque insuficiente para {variacao.produto.nome} ({variacao.tamanho}). Disponível: {variacao.estoque_atual}"
                    )

                # Cria o ItemPedido
                ItemPedido.objects.create(
                    pedido=pedido,
                    variacao_produto=variacao,
                    quantidade=quantidade,
                    preco_unitario=preco_unitario
                )

                # Dá baixa no Estoque registando a 'Saida'
                Estoque.objects.create(
                    variacao_produto=variacao,
                    pedido=pedido,
                    quantidade=quantidade,
                    tipo='Saida',
                    motivo=f"Venda - Pedido #{pedido.id_pedido}"
                )

                sub_total += Decimal(str(preco_unitario)) * quantidade

            # Processa e valida o Cupom se tiver sido enviado
            valor_desconto = Decimal('0.00')
            if cupom:
                valido, mensagem = cupom.e_valido(sub_total)
                if not valido:
                    raise serializers.ValidationError({"cupom": mensagem})

                # Garante que o retorno do cálculo do desconto é do tipo Decimal
                valor_desconto = Decimal(str(cupom.calcular_desconto(sub_total)))

                # Retira 1 na quantidade disponível do cupom
                cupom.quantidade_disponivel -= 1
                
                # Se zerar a quantidade, altera o status para 'Inativo'
                if cupom.quantidade_disponivel <= 0:
                    cupom.status = 'Inativo'

                cupom.save()

            # Atualiza os totais calculados no Pedido sem misturar tipos
            pedido.sub_total = sub_total
            pedido.desconto = valor_desconto
            pedido.valor_final = max(Decimal('0.00'), sub_total + frete - valor_desconto)
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