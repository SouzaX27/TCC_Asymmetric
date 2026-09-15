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
    usuario = serializers.CharField(source='username', write_only=True)
    senha = serializers.CharField(source='password', write_only=True)
    nome = serializers.CharField(write_only=True)
    telefone = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['usuario', 'email', 'senha', 'nome', 'telefone']

    def validate_usuario(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Este nome de usuário já está em uso.")
        return value

    def validate_senha(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def create(self, validated_data):
        nome = validated_data.pop('nome')
        telefone = validated_data.pop('telefone', '')

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )

        Cliente.objects.create(
            user=user,
            nome=nome,
            telefone=telefone
        )

        return user