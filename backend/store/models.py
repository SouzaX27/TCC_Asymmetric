from decimal import Decimal
from django.db import models
from django.db.models import Sum
from django.utils import timezone
from django.contrib.auth.models import User

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
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cliente')
    telefone = models.CharField(max_length=255)
    nome = models.CharField(max_length=255)
    pontos = models.IntegerField(default=0)

    def __str__(self):
        return self.nome


class Cupom(models.Model):
    TIPO_DESCONTO_CHOICES = [
        ('fixo', 'Valor Fixo (R$)'),
        ('porcentagem', 'Porcentagem (%)'),
    ]

    STATUS_CHOICES = [
        ('Ativo', 'Ativo'),
        ('Inativo', 'Inativo'),
    ]

    id_cupom = models.AutoField(primary_key=True)
    admin = models.ForeignKey('Admin', on_delete=models.CASCADE, db_column='fk_admin_id')
    codigo = models.CharField(max_length=50, unique=True)
    desconto = models.DecimalField(max_digits=8, decimal_places=2)
    tipo_desconto = models.CharField(
        max_length=20, 
        choices=TIPO_DESCONTO_CHOICES, 
        default='fixo'
    )
    valor_minimo = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    data_inicio = models.DateTimeField()
    data_expiracao = models.DateTimeField()
    quantidade_disponivel = models.IntegerField(default=0)
    status = models.CharField(
        max_length=30, 
        choices=STATUS_CHOICES, 
        default='Ativo'
    )

    class Meta:
        verbose_name = 'Cupom'
        verbose_name_plural = 'Cupons'

    def __str__(self):
        return self.codigo

    def e_valido(self, subtotal_pedido):
        """Valida se o cupom atende a todas as regras de negócio."""
        agora = timezone.now()

        # verifica se já está Inativo
        if self.status != 'Ativo':
            return False, "Este cupom não está ativo."

        # verifica se expirou por data
        if agora > self.data_expiracao:
            if self.status != 'Inativo':
                self.status = 'Inativo'
                self.save(update_fields=['status']) # Atualiza automaticamente no banco
            return False, "Este cupom já expirou."

        # verifica se ainda não começou
        if agora < self.data_inicio:
            return False, "Este cupom ainda não está válido."

        # verifica se esgotou a quantidade
        if self.quantidade_disponivel <= 0:
            if self.status != 'Inativo':
                self.status = 'Inativo'
                self.save(update_fields=['status']) # atualiza automaticamente no banco
            return False, "Esgotou o limite de usos deste cupom."

        # verifica valor minimo do carrinho
        if subtotal_pedido < self.valor_minimo:
            return False, f"O valor mínimo do pedido para este cupom é R$ {self.valor_minimo:.2f}."

        return True, "Cupom válido."

    def calcular_desconto(self, subtotal_pedido):
        """Calcula o valor do desconto mantendo a precisão monetária em Decimal."""
        subtotal = Decimal(str(subtotal_pedido))
        desconto_cadastrado = Decimal(str(self.desconto))

        if self.tipo_desconto == 'porcentagem':
            valor_desconto = (subtotal * desconto_cadastrado) / Decimal('100.0')
        else:
            valor_desconto = desconto_cadastrado

        return min(valor_desconto, subtotal)

class Colecao(models.Model):
    id_colecao = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=100)
    descricao = models.TextField(blank=True, null=True)
    ativa = models.BooleanField(default=True)
    criada_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Coleção'
        verbose_name_plural = 'Coleções'

    def __str__(self):
        return self.nome

class Produto(models.Model):
    id_produto = models.AutoField(primary_key=True)
    admin = models.ForeignKey(Admin, on_delete=models.CASCADE, db_column='fk_admin_id')
    nome = models.CharField(max_length=255)
    cor = models.CharField(max_length=30, blank=True, null=True, help_text="Ex: Branco, Preto ou etc")
    descricao = models.CharField(max_length=255, blank=True, null=True)
    preco = models.DecimalField(max_digits=8, decimal_places=2)
    imagem = models.ImageField(upload_to='produtos/', null=True, blank=True)
    colecao = models.ForeignKey(
        Colecao, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='produtos'
    )
    
    # Campos necessários para cotação de frete (Melhor Envio)
    peso = models.DecimalField(
        max_digits=5, 
        decimal_places=3, 
        default=Decimal('0.350'),
        help_text="Peso em kg (ex: 0.350 para 350g)"
    )
    altura = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=Decimal('5.00'),
        help_text="Altura em cm"
    )
    largura = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=Decimal('25.00'),
        help_text="Largura em cm"
    )
    comprimento = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=Decimal('35.00'),
        help_text="Comprimento em cm"
    )

    def __str__(self):
        if self.cor:
            return f"{self.nome} - {self.cor}"
        return f"self.nome"

class VariacaoProduto(models.Model):
    id_variacao = models.AutoField(primary_key=True)
    produto = models.ForeignKey(Produto, on_delete=models.CASCADE, db_column='fk_produto_id', related_name='variacoes')
    tamanho = models.CharField(max_length=10)

    def __str__(self):
        return f"{self.produto.nome} {self.produto.cor} - Tam: {self.tamanho}"

    @property
    def estoque_atual(self):
        # soma as entradas
        entradas = self.estoques.filter(tipo='Entrada').aggregate(models.Sum('quantidade'))['quantidade__sum'] or 0
        # soma as saídas
        saidas = self.estoques.filter(tipo='Saida').aggregate(models.Sum('quantidade'))['quantidade__sum'] or 0
        
        # retorna o saldo
        return entradas - saidas


class Pedido(models.Model):
    id_pedido = models.AutoField(primary_key=True)
    cliente = models.ForeignKey(Cliente, on_delete=models.SET_NULL, null=True, blank=True, db_column='fk_cliente_id')
    cupom = models.ForeignKey(Cupom, on_delete=models.SET_NULL, null=True, blank=True, db_column='fk_cupom_id')
    
    nome_comprador = models.CharField(max_length=150, blank=True, null=True)
    email_comprador = models.EmailField(blank=True, null=True)
    telefone_comprador = models.CharField(max_length=20, blank=True, null=True)

    # campos de entrega
    cep_entrega = models.CharField(max_length=9, null=True, blank=True) # retirar o null=true, blank=true
    endereco_entrega = models.CharField(max_length=255, null=True, blank=True) # retirar o null=true, blank=true
    numero_entrega = models.CharField(max_length=20, null=True, blank=True) # retirar o null=true, blank=true
    complemento_entrega = models.CharField(max_length=100, blank=True, null=True)
    bairro_entrega = models.CharField(max_length=100, null=True, blank=True) # retirar o null=true, blank=true
    cidade_entrega = models.CharField(max_length=100, null=True, blank=True) # retirar o null=true, blank=true
    estado_entrega = models.CharField(max_length=2, null=True, blank=True)  # retirar o null=true, blank=true

    # campos do frete
    servico_frete_id = models.IntegerField(help_text="ID da transportadora/serviço no Melhor Envio", null=True, blank=True) # retirar o null=true, blank=true
    servico_frete_nome = models.CharField(max_length=50, help_text="Ex: PAC, SEDEX", null=True, blank=True) # retirar o null=true, blank=true
    prazo_frete_dias = models.IntegerField(null=True, blank=True) # retirar o null=true, blank=true

    #  infos do pedido
    data_pedido = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=30, default='Pendente')
    sub_total = models.DecimalField(max_digits=8, decimal_places=2)
    frete = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    desconto = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    valor_final = models.DecimalField(max_digits=8, decimal_places=2)


    # futura integração de pagamento - Mercado Pago
    metodo_pagamento = models.CharField(max_length=50, blank=True, null=True)
    id_transacao_gateway = models.CharField(max_length=100, blank=True, null=True)
    qr_code_pix = models.TextField(blank=True, null=True)
    qr_code_base64 = models.TextField(blank=True, null=True)
    ticket_url = models.URLField(max_length=500, blank=True, null=True)

    def __str__(self):
        comprador = self.cliente.nome if self.cliente else (self.nome_comprador or self.email_comprador or "Convidado")
        return f"Pedido #{self.id_pedido} - {comprador}"


class ItemPedido(models.Model):
    id_item = models.AutoField(primary_key=True)
    pedido = models.ForeignKey(
        Pedido, 
        on_delete=models.CASCADE, 
        related_name='itens', 
        db_column='fk_pedido_id'
    )
    variacao_produto = models.ForeignKey(
        VariacaoProduto, 
        on_delete=models.CASCADE, 
        db_column='fk_variacao_produto_id'
    )
    quantidade = models.IntegerField(default=1)
    preco_unitario = models.DecimalField(max_digits=8, decimal_places=2)

    def __str__(self):
        return f"Item #{self.id_item} - Pedido #{self.pedido.id_pedido if self.pedido else 'S/N'}"



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
    TIPO_CHOICES = [
        ('Entrada', 'Entrada'),
        ('Saida', 'Saída'),
    ]

    id_estoque = models.AutoField(primary_key=True)
    admin = models.ForeignKey(Admin, on_delete=models.SET_NULL, null=True, blank=True, db_column='fk_admin_id')
    variacao_produto = models.ForeignKey(
        VariacaoProduto, 
        on_delete=models.CASCADE, 
        related_name='estoques',
        db_column='fk_variacao_produto_id'
    )
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, null=True, blank=True, db_column='fk_pedido_id')
    quantidade = models.PositiveIntegerField()
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES, default='Entrada')
    motivo = models.CharField(max_length=255)
    data_movimentacao = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Movimentação #{self.id_estoque} - {self.tipo} ({self.quantidade}x {self.variacao_produto})"