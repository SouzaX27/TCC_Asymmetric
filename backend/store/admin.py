from django.contrib import admin
from .models import (
    Admin,
    Cliente,
    Cupom,
    Produto,
    VariacaoProduto,
    Pedido,
    ItemPedido,
    Possui,
    ReciboPagamento,
    Estoque
)





class VariacaoProdutoInline(admin.TabularInline):
    model = VariacaoProduto
    extra = 1  # Número de linhas em branco exibidas para adição rápida


class PossuiInline(admin.TabularInline):
    model = Possui
    extra = 1




@admin.register(Produto)
class ProdutoAdmin(admin.ModelAdmin):
    list_display = ('id_produto', 'nome', 'preco', 'imagem',  'admin')
    search_fields = ('nome', 'descricao')
    list_filter = ('admin',)
    inlines = [VariacaoProdutoInline]  # Gerencia os tamanhos na mesma página do Produto


@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ('id_pedido', 'cliente', 'status', 'valor_final', 'data_pedido')
    list_filter = ('status', 'data_pedido')
    search_fields = ('cliente__nome', 'cliente__email')
    readonly_fields = ('data_pedido',)
    inlines = [PossuiInline]  # Gerencia os itens vinculados na mesma página do Pedido


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ('id_cliente', 'nome', 'email', 'telefone', 'pontos')
    search_fields = ('nome', 'email', 'telefone')


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




admin.site.register(Admin)
admin.site.register(VariacaoProduto)
admin.site.register(ItemPedido)