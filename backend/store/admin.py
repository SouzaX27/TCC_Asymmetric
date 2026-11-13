from django.contrib import admin
from .models import (
    Admin,
    Cliente,
    Cupom,
    Produto,
    ImagemProduto,
    VariacaoProduto,
    Pedido,
    ItemPedido,
    ReciboPagamento,
    Estoque,
    Colecao
)


admin.site.site_header = 'Painel Adminstrativo da Asymmetric'

admin.site.site_title = 'Adminstração Asymmetric'

admin.site.index_title = 'Adminstração Asymmetric'

class VariacaoProdutoInline(admin.TabularInline):
    model = VariacaoProduto
    extra = 1
    readonly_fields = ('estoque_atual',)


class ItemPedidoInline(admin.TabularInline):
    model = ItemPedido
    extra = 1

class ImagemProdutoInline(admin.TabularInline):
    model = ImagemProduto
    extra = 3


@admin.register(Produto)
class ProdutoAdmin(admin.ModelAdmin):
    list_display = ('id_produto', 'nome', 'preco', 'slug', 'admin', 'colecao')
    search_fields = ('nome', 'descricao')
    list_filter = ('admin',)
    prepopulated_fields = {'slug': ('nome',)}
    inlines = [VariacaoProdutoInline, ImagemProdutoInline]


@admin.register(VariacaoProduto)
class VariacaoProdutoAdmin(admin.ModelAdmin):
    list_display = ('produto', 'tamanho', 'estoque_atual')
    list_filter = ('produto__colecao', 'tamanho')
    search_fields = ('produto__nome',)
    readonly_fields = ('estoque_atual',)


@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ('id_pedido', 'cliente', 'status', 'valor_final', 'data_pedido')
    list_filter = ('status', 'data_pedido')
    search_fields = ('cliente__nome', 'cliente__email')
    readonly_fields = ('data_pedido',)
    inlines = [ItemPedidoInline]


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ('id_cliente', 'nome', 'get_email', 'telefone', 'pontos')
    search_fields = ('nome', 'email', 'telefone')

    @admin.display(description='E-mail')
    def get_email(self, obj):
        return obj.user.email


@admin.register(Cupom)
class CupomAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'desconto', 'tipo_desconto', 'quantidade_disponivel', 'status', 'data_expiracao')
    list_filter = ('status', 'tipo_desconto')
    search_fields = ('codigo',)


@admin.register(Estoque)
class EstoqueAdmin(admin.ModelAdmin):
    list_display = ('id_estoque', 'variacao_produto', 'quantidade', 'tipo', 'motivo', 'data_movimentacao')
    list_filter = ('tipo', 'data_movimentacao')
    search_fields = ('variacao_produto__produto__nome',)


@admin.register(ReciboPagamento)
class ReciboPagamentoAdmin(admin.ModelAdmin):
    list_display = ('recibo_id', 'id_pagamento', 'cliente', 'valor_total', 'metodo', 'status', 'data_pagamento')
    list_filter = ('metodo', 'status')
    search_fields = ('cliente__nome', 'recibo_id')

@admin.register(Colecao)
class ColecaoAdmin(admin.ModelAdmin):
    list_display = ('id_colecao', 'nome', 'ativa', 'criada_em')
    search_fields = ('nome',)



admin.site.register(Admin)
# admin.site.register(VariacaoProduto)
admin.site.register(ItemPedido)