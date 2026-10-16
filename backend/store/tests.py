from datetime import timedelta
from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from .models import Admin, Cupom, Estoque, ItemPedido, PagamentoDemonstracao, Pedido, Produto, VariacaoProduto


@override_settings(DEBUG=True, PAGAMENTOS_DEMO_ATIVOS=True, MELHOR_ENVIO_TOKEN='')
class PagamentoDemonstracaoTests(TestCase):
	def setUp(self):
		self.client = APIClient()
		admin = Admin.objects.create(nome='Loja', email='loja@example.com', senha='unused')
		produto = Produto.objects.create(admin=admin, nome='Camiseta', preco=Decimal('50.00'))
		self.variacao = VariacaoProduto.objects.create(produto=produto, tamanho='M')
		Estoque.objects.create(
			variacao_produto=self.variacao,
			quantidade=5,
			tipo='Entrada',
			motivo='Estoque inicial'
		)
		agora = timezone.now()
		self.cupom = Cupom.objects.create(
			admin=admin,
			codigo='DEMO10',
			desconto=Decimal('10.00'),
			tipo_desconto='fixo',
			valor_minimo=Decimal('0.00'),
			data_inicio=agora - timedelta(days=1),
			data_expiracao=agora + timedelta(days=1),
			quantidade_disponivel=1,
			status='Ativo'
		)

	def criar_intencao(self):
		dados_frete = {
			'cep_destino': '01001000',
			'itens': [{'variacao_produto': self.variacao.id_variacao, 'quantidade': 2}],
		}
		with patch('store.views.calcular_frete_melhor_envio') as calcular_frete:
			calcular_frete.return_value = ([{
				'id_servico': 7,
				'nome': 'PAC teste',
				'preco': '12.50',
				'prazo_dias': 5,
			}], None)
			resposta_cotacao = self.client.post('/api/frete/calcular/', dados_frete, format='json')

		self.assertEqual(resposta_cotacao.status_code, 200)
		cotacao = resposta_cotacao.data['opcoes'][0]
		dados_pedido = {
			'nome_comprador': 'Pessoa Teste',
			'email_comprador': 'pessoa@example.com',
			'telefone_comprador': '11999999999',
			'cep_entrega': '01001000',
			'endereco_entrega': 'Rua Teste',
			'numero_entrega': '10',
			'bairro_entrega': 'Centro',
			'cidade_entrega': 'São Paulo',
			'estado_entrega': 'SP',
			'cupom': self.cupom.id_cupom,
			'frete_cotacao': cotacao['cotacao_token'],
			'frete': '0.01',
			'status': 'Pago',
			'valor_final': '0.01',
			'itens': [{'variacao_produto': self.variacao.id_variacao, 'quantidade': 2}],
		}
		return self.client.post('/api/pagamentos-demo/', dados_pedido, format='json')

	def test_confirmacao_do_qr_debita_estoque_e_cupom_uma_unica_vez(self):
		intencao_response = self.criar_intencao()

		self.assertEqual(intencao_response.status_code, 201)
		self.assertEqual(intencao_response.data['status'], 'pendente')
		self.assertEqual(self.variacao.estoque_atual, 5)
		self.cupom.refresh_from_db()
		self.assertEqual(self.cupom.quantidade_disponivel, 1)

		token = intencao_response.data['token']
		url = f'/api/pagamentos-demo/{token}/confirmar/'
		primeira_confirmacao = self.client.post(url, {}, format='json')
		segunda_confirmacao = self.client.post(url, {}, format='json')

		self.assertEqual(primeira_confirmacao.status_code, 200)
		self.assertEqual(segunda_confirmacao.status_code, 200)
		self.assertEqual(primeira_confirmacao.data['status'], 'aprovado')
		self.assertEqual(primeira_confirmacao.data['id_pedido'], segunda_confirmacao.data['id_pedido'])
		self.assertEqual(Pedido.objects.count(), 1)
		self.assertEqual(ItemPedido.objects.count(), 1)
		self.assertEqual(self.variacao.estoque_atual, 3)
		self.cupom.refresh_from_db()
		self.assertEqual(self.cupom.quantidade_disponivel, 0)
		pedido = Pedido.objects.get()
		self.assertEqual(pedido.frete, Decimal('12.50'))
		self.assertEqual(pedido.valor_final, Decimal('102.50'))

	def test_pedido_nao_pode_ser_criado_diretamente_por_visitante(self):
		response = self.client.post('/api/pedidos/', {}, format='json')

		self.assertNotEqual(response.status_code, 201)
		self.assertEqual(PagamentoDemonstracao.objects.count(), 0)

	def test_cobranca_expirada_nao_cria_pedido_nem_debita_recursos(self):
		intencao_response = self.criar_intencao()
		pagamento = PagamentoDemonstracao.objects.get(token=intencao_response.data['token'])
		pagamento.expira_em = timezone.now() - timedelta(seconds=1)
		pagamento.save(update_fields=['expira_em'])

		response = self.client.post(
			f'/api/pagamentos-demo/{pagamento.token}/confirmar/',
			{},
			format='json'
		)

		self.assertEqual(response.status_code, 410)
		self.assertEqual(Pedido.objects.count(), 0)
		self.assertEqual(self.variacao.estoque_atual, 5)
		self.cupom.refresh_from_db()
		self.assertEqual(self.cupom.quantidade_disponivel, 1)

	def test_cotacao_nao_pode_ser_reutilizada_com_outro_cep(self):
		intencao_response = self.criar_intencao()
		pagamento = PagamentoDemonstracao.objects.get(token=intencao_response.data['token'])
		pagamento.dados_pedido['cep_entrega'] = '02002000'
		pagamento.save(update_fields=['dados_pedido'])

		response = self.client.post(
			f'/api/pagamentos-demo/{pagamento.token}/confirmar/',
			{},
			format='json'
		)

		self.assertEqual(response.status_code, 400)
		self.assertEqual(Pedido.objects.count(), 0)
		self.assertEqual(self.variacao.estoque_atual, 5)

	@override_settings(URL_GATEWAY_DEMO='https://gateway.example.test', SEGREDO_GATEWAY_DEMO='server-secret')
	def test_aprovacao_remota_validada_cria_pedido_e_debita_recursos(self):
		gateway_id = '2fba5536-30fb-49d6-a06a-31b0da8fcd20'
		with patch('store.views.criar_pagamento_gateway_demo') as criar_gateway:
			criar_gateway.return_value = ({
				'id_pagamento': gateway_id,
				'url_checkout': f'https://gateway.example.test/pay/{gateway_id}',
			}, None)
			intencao_response = self.criar_intencao()

		self.assertEqual(intencao_response.status_code, 201)
		self.assertTrue(intencao_response.data['gateway_disponivel'])
		self.assertEqual(intencao_response.data['url_checkout'], f'https://gateway.example.test/pay/{gateway_id}')
		self.assertEqual(self.variacao.estoque_atual, 5)

		with patch('store.views.consultar_pagamento_gateway_demo') as consultar_gateway:
			consultar_gateway.return_value = ({
				'id_pagamento': gateway_id,
				'referencia': intencao_response.data['token'],
				'valor': '102.50',
				'status': 'aprovado',
			}, None)
			status_response = self.client.get(f"/api/pagamentos-demo/{intencao_response.data['token']}/")

		self.assertEqual(status_response.status_code, 200)
		self.assertEqual(status_response.data['status'], 'aprovado')
		self.assertEqual(Pedido.objects.count(), 1)
		self.assertEqual(self.variacao.estoque_atual, 3)
		self.cupom.refresh_from_db()
		self.assertEqual(self.cupom.quantidade_disponivel, 0)

	@override_settings(URL_GATEWAY_DEMO='https://gateway.example.test', SEGREDO_GATEWAY_DEMO='server-secret')
	def test_gateway_com_valor_divergente_nao_aprova_pedido(self):
		gateway_id = '2fba5536-30fb-49d6-a06a-31b0da8fcd21'
		with patch('store.views.criar_pagamento_gateway_demo') as criar_gateway:
			criar_gateway.return_value = ({
				'id_pagamento': gateway_id,
				'url_checkout': f'https://gateway.example.test/pay/{gateway_id}',
			}, None)
			intencao_response = self.criar_intencao()

		with patch('store.views.consultar_pagamento_gateway_demo') as consultar_gateway:
			consultar_gateway.return_value = ({
				'id_pagamento': gateway_id,
				'referencia': intencao_response.data['token'],
				'valor': '1.00',
				'status': 'aprovado',
			}, None)
			status_response = self.client.get(f"/api/pagamentos-demo/{intencao_response.data['token']}/")

		self.assertEqual(status_response.status_code, 200)
		self.assertEqual(status_response.data['status'], 'pendente')
		self.assertEqual(Pedido.objects.count(), 0)
		self.assertEqual(self.variacao.estoque_atual, 5)
