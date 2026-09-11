from rest_framework import serializers
from .models import Produto, VariacaoProduto

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