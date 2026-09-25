import re
from django.contrib.auth.models import User
from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import Produto, VariacaoProduto, Cliente

class VariacaoProdutoSerializer(serializers.ModelSerializer):
    estoque_atual = serializers.IntegerField(read_only=True)

    class Meta:
        model = VariacaoProduto
        fields = ['id_variacao', 'tamanho', 'estoque_atual']

class ProdutoSerializer(serializers.ModelSerializer):
    variacoes = VariacaoProdutoSerializer(many=True, read_only=True)

    class Meta:
        model = Produto
        fields = ['id_produto', 'nome', 'cor', 'descricao', 'preco', 'imagem', 'variacoes']


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