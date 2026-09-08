from rest_framework import serializers
from .models import Produto, VariacaoProduto

class VariacaoProdutoSerializer(serializers.ModelSerializer):
    class Meta:
        model = VariacaoProduto
        fields = ['id_variacao', 'tamanho']

class ProdutoSerializer(serializers.ModelSerializer):
    variacoes = VariacaoProdutoSerializer(many=True, read_only=True)

    class Meta:
        model = Produto
        fields = ['id_produto', 'nome', 'descricao', 'preco', 'imagem', 'variacoes']