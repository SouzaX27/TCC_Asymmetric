import requests
from django.conf import settings

def calcular_frete_melhor_envio(cep_destino, itens_com_objetos):
    """Consome a API do Melhor Envio e retorna as opções de frete disponíveis."""
    token = settings.MELHOR_ENVIO_TOKEN
    url = settings.MELHOR_ENVIO_URL
    cep_origem = settings.CEP_ORIGEM

    if not token:
        return None, "Serviço de frete não configurado no servidor (Token ausente)."

    headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}',
        'User-Agent': 'ASYMMETRIC (suporteasymmetric@gmail.com)'
    }

    products_payload = []
    for item in itens_com_objetos:
        variacao = item['variacao_obj']
        quantidade = item['quantidade']
        
        # Atributos do produto com fallbacks seguros para camisetas e calças
        peso = float(getattr(variacao.produto, 'peso', 0.350))
        altura = float(getattr(variacao.produto, 'altura', 5))
        largura = float(getattr(variacao.produto, 'largura', 20))
        comprimento = float(getattr(variacao.produto, 'comprimento', 25))
        preco_unitario = float(variacao.produto.preco)

        products_payload.append({
            "id": str(variacao.id_variacao if hasattr(variacao, 'id_variacao') else variacao.id),
            "width": largura,
            "height": altura,
            "length": comprimento,
            "weight": peso,
            "insurance_value": preco_unitario,
            "quantity": quantidade
        })

    payload = {
        "from": {
            "postal_code": cep_origem
        },
        "to": {
            "postal_code": cep_destino
        },
        "products": products_payload
    }

    try:
        # Timeout de 5s para não prender threads da aplicação
        response = requests.post(url, json=payload, headers=headers, timeout=5)
        
        if response.status_code != 200:
            return None, f"Erro na consulta de frete no serviço externo (HTTP {response.status_code})."

        dados_frete = response.json()
        opcoes_frete = []

        for servico in dados_frete:
            # Filtra apenas cotações válidas e sem erros
            if 'error' not in servico and 'price' in servico:
                opcoes_frete.append({
                    "id_servico": servico.get('id'),
                    "nome": servico.get('name'), # Ex: PAC, SEDEX
                    "transportadora": servico.get('company', {}).get('name'), # Ex: Correios, Jadlog
                    "preco": str(servico.get('price')),
                    "prazo_dias": servico.get('delivery_time'),
                    "desconto": str(servico.get('discount', '0.00'))
                })

        return opcoes_frete, None

    except requests.exceptions.Timeout:
        return None, "Tempo limite excedido ao consultar o serviço de frete."
    except requests.exceptions.RequestException as e:
        return None, f"Falha na comunicação com o serviço de frete: {str(e)}"