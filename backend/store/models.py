from django.db import models

class Admin(models.Model):
    id_admin = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=255)
    email = models.EmailField(max_length=255, unique=True)
    senha = models.CharField(max_length=128)
    data_criacao = models.DateField(auto_now_add=True)

    def __str__(self):
        return self.nome


class Cliente(models.Model):
    id_cliente = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=255)
    email = models.EmailField(max_length=255, unique=True)
    senha = models.CharField(max_length=128)
    telefone = models.CharField(max_length=255, blank=True, null=True)
    pontos = models.IntegerField(default=0)

    def __str__(self):
        return self.nome


class Cupom(models.Model):
    id_cupom = models.AutoField(primary_key=True)
    admin = models.ForeignKey(Admin, on_delete=models.CASCADE, db_column='fk_admin_id')
    codigo = models.CharField(max_length=50, unique=True)
    desconto = models.DecimalField(max_digits=8, decimal_places=2)
    tipo_desconto = models.CharField(max_length=50)
    valor_minimo = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    data_inicio = models.DateTimeField()
    data_expiracao = models.DateTimeField()
    quantidade_disponivel = models.IntegerField(default=0)
    status = models.CharField(max_length=30)

    def __str__(self):
        return self.codigo


class Produto(models.Model):
    id_produto = models.AutoField(primary_key=True)
    admin = models.ForeignKey(Admin, on_delete=models.CASCADE, db_column='fk_admin_id')
    nome = models.CharField(max_length=255)
    descricao = models.CharField(max_length=255, blank=True, null=True)
    preco = models.DecimalField(max_digits=8, decimal_places=2)
    imagem = models.ImageField(upload_to='produtos/', null=True, blank=True)

    def __str__(self):
        return self.nome


class VariacaoProduto(models.Model):
    id_variacao = models.AutoField(primary_key=True)
    produto = models.ForeignKey(Produto, on_delete=models.CASCADE, db_column='fk_produto_id', related_name='variacoes')
    tamanho = models.CharField(max_length=10)

    def __str__(self):
        return f"{self.produto.nome} - Tam: {self.tamanho}"


class Pedido(models.Model):
    id_pedido = models.AutoField(primary_key=True)
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, db_column='fk_cliente_id')
    cupom = models.ForeignKey(Cupom, on_delete=models.SET_NULL, null=True, blank=True, db_column='fk_cupom_id')
    admin = models.ForeignKey(Admin, on_delete=models.CASCADE, db_column='fk_admin_id')
    data_pedido = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=30)
    sub_total = models.DecimalField(max_digits=8, decimal_places=2)
    frete = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    desconto = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    valor_final = models.DecimalField(max_digits=8, decimal_places=2)

    def __str__(self):
        return f"Pedido #{self.id_pedido} - {self.cliente.nome}"


class ItemPedido(models.Model):
    id_item = models.AutoField(primary_key=True)
    variacao_produto = models.ForeignKey(VariacaoProduto, on_delete=models.CASCADE, db_column='fk_variacao_produto_id')
    quantidade = models.IntegerField(default=1)
    preco_unitario = models.DecimalField(max_digits=8, decimal_places=2)

    def __str__(self):
        return f"Item {self.id_item} (Qtd: {self.quantidade})"


class Possui(models.Model):
    """
    Tabela intermediária ligando Pedido ao ItemPedido (Relacionamento N:N)
    """
    pedido = models.ForeignKey(Pedido, on_delete=models.SET_NULL, null=True, db_column='fk_pedido_id')
    item_pedido = models.ForeignKey(ItemPedido, on_delete=models.SET_NULL, null=True, db_column='fk_item_pedido_id')


class ReciboPagamento(models.Model):
    recibo_id = models.IntegerField()
    id_pagamento = models.IntegerField()
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, db_column='fk_cliente_id')
    data_emissao = models.DateTimeField(auto_now_add=True)
    valor_total = models.DecimalField(max_digits=8, decimal_places=2)
    metodo = models.CharField(max_length=50)
    status = models.CharField(max_length=50)
    data_pagamento = models.DateTimeField()

    class Meta:
        unique_together = (('recibo_id', 'id_pagamento'),)

    def __str__(self):
        return f"Recibo #{self.recibo_id} - Pagamento #{self.id_pagamento}"


class Estoque(models.Model):
    id_estoque = models.AutoField(primary_key=True)
    admin = models.ForeignKey(Admin, on_delete=models.CASCADE, db_column='fk_admin_id')
    variacao_produto = models.ForeignKey(VariacaoProduto, on_delete=models.CASCADE, db_column='fk_variacao_produto_id')
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, null=True, blank=True, db_column='fk_pedido_id')
    quantidade = models.IntegerField()
    tipo = models.CharField(max_length=50)  
    motivo = models.CharField(max_length=50)
    data_movimentacao = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Movimentação #{self.id_estoque} - Qtd: {self.quantidade}"