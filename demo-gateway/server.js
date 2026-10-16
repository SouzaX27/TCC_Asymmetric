import { timingSafeEqual, randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const DURACAO_COBRANCA_MS = 20 * 60 * 1000;
const LIMITE_CORPO_BYTES = 16 * 1024;
const BUNDLE_AXIOS = await readFile(new URL('./node_modules/axios/dist/axios.min.js', import.meta.url));

function responderJson(resposta, codigoStatus, dados) {
    resposta.writeHead(codigoStatus, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'no-referrer',
    });
    resposta.end(JSON.stringify(dados));
}

function autorizacaoValida(requisicao, segredo) {
    const recebido = Buffer.from(requisicao.headers.authorization || '');
    const esperado = Buffer.from(`Bearer ${segredo}`);
    return recebido.length === esperado.length && timingSafeEqual(recebido, esperado);
}

async function lerJson(requisicao) {
    let corpo = '';
    for await (const trecho of requisicao) {
        corpo += trecho;
        if (Buffer.byteLength(corpo) > LIMITE_CORPO_BYTES) {
            throw new Error('Conteudo excede o limite permitido.');
        }
    }
    return JSON.parse(corpo || '{}');
}

function atualizarStatusPagamento(pagamento) {
    if (pagamento.status === 'pendente' && pagamento.expiraEm <= Date.now()) {
        pagamento.status = 'expirado';
    }
    return pagamento.status;
}

function paginaPagamento(idPagamento) {
    const idSeguro = JSON.stringify(idPagamento);
    return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Pagamento demonstrativo | Asymmetric</title>
<style>
:root{font-family:system-ui,sans-serif;color:#171717;background:#f4f5f3}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:20px;box-sizing:border-box}.painel{width:min(100%,420px);background:#fff;border:1px solid #d4d7d2;padding:28px;box-sizing:border-box}h1{font-size:1.5rem;margin:0 0 8px}.texto-secundario{color:#666}.valor{font-size:2rem;font-weight:700;margin:24px 0}button{width:100%;border:0;background:#182b24;color:#fff;padding:15px;font-size:1rem;font-weight:700;cursor:pointer}button:disabled{opacity:.55;cursor:wait}.aviso{margin-top:18px;padding:12px;background:#f2f4f1}.erro{color:#9d2525}
</style>
</head>
<body>
<main class="painel">
<h1>Pagamento demonstrativo</h1>
<p class="texto-secundario">Esta simulacao nao movimenta dinheiro real.</p>
<div id="valor" class="valor" aria-live="polite">Carregando...</div>
<div id="estado" class="aviso" role="status">Consultando cobranca...</div>
<button id="aprovar" type="button" disabled>Confirmar pagamento ficticio</button>
</main>
<script src="/assets/axios.min.js"></script>
<script>
const idPagamento = ${idSeguro};
const elementoValor = document.querySelector('#valor');
const elementoEstado = document.querySelector('#estado');
const botaoAprovar = document.querySelector('#aprovar');
const formatarMoeda = valor => Number(valor).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
async function atualizarPagamento(){
  try {
        const resposta = await axios.get('/api/pagamentos-publicos/' + idPagamento, {
            headers: {'Cache-Control': 'no-cache'}
        });
        const pagamento = resposta.data;
    elementoValor.textContent = formatarMoeda(pagamento.valor);
    if (pagamento.status === 'aprovado') {
      elementoEstado.textContent = 'Pagamento ficticio confirmado. Voce ja pode fechar esta pagina.';
      botaoAprovar.hidden = true;
    } else if (pagamento.status === 'expirado') {
      elementoEstado.textContent = 'Esta cobranca expirou. Solicite um novo QR Code ao apresentador.';
      botaoAprovar.hidden = true;
    } else {
      elementoEstado.textContent = 'Confira o valor e confirme a simulacao.';
      botaoAprovar.disabled = false;
    }
  } catch (erro) {
        elementoEstado.textContent = erro.response?.data?.erro || erro.message;
    elementoEstado.classList.add('erro');
  }
}
botaoAprovar.addEventListener('click', async () => {
  botaoAprovar.disabled = true;
  elementoEstado.textContent = 'Confirmando...';
  try {
        await axios.post('/api/pagamentos-publicos/' + idPagamento + '/aprovar');
    await atualizarPagamento();
  } catch (erro) {
        elementoEstado.textContent = erro.response?.data?.erro || erro.message;
    elementoEstado.classList.add('erro');
    botaoAprovar.disabled = false;
  }
});
atualizarPagamento();
</script>
</body>
</html>`;
}

export function criarServidorGateway({ segredo, urlPublica = '', pagamentos = new Map() }) {
    if (!segredo) throw new Error('SEGREDO_COMPARTILHADO e obrigatorio.');

    return createServer(async (requisicao, resposta) => {
        const url = new URL(requisicao.url, 'http://gateway.local');
        const cabecalhosSaude = {
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'Referrer-Policy': 'no-referrer',
        };

        if (requisicao.method === 'GET' && url.pathname === '/saude') {
            resposta.writeHead(200, cabecalhosSaude);
            resposta.end('ok');
            return;
        }

        if (requisicao.method === 'POST' && url.pathname === '/api/pagamentos') {
            if (!autorizacaoValida(requisicao, segredo)) {
                return responderJson(resposta, 401, { erro: 'Nao autorizado.' });
            }

            let entrada;
            try {
                entrada = await lerJson(requisicao);
            } catch {
                return responderJson(resposta, 400, { erro: 'Dados JSON invalidos.' });
            }

            const valor = Number(entrada.valor);
            if (!Number.isFinite(valor) || valor <= 0 || valor > 99999999) {
                return responderJson(resposta, 400, { erro: 'Valor invalido.' });
            }
            if (typeof entrada.referencia !== 'string' || entrada.referencia.length > 100) {
                return responderJson(resposta, 400, { erro: 'Referencia invalida.' });
            }

            const idPagamento = randomUUID();
            const pagamento = {
                idPagamento,
                referencia: entrada.referencia,
                valor: Math.round(valor * 100) / 100,
                status: 'pendente',
                criadoEm: Date.now(),
                expiraEm: Date.now() + DURACAO_COBRANCA_MS,
            };
            pagamentos.set(idPagamento, pagamento);

            const urlBase = (urlPublica || process.env.URL_PUBLICA || `http://${requisicao.headers.host}`).replace(/\/$/, '');
            return responderJson(resposta, 201, {
                id_pagamento: idPagamento,
                url_checkout: `${urlBase}/pagar/${idPagamento}`,
                status: pagamento.status,
                expira_em: new Date(pagamento.expiraEm).toISOString(),
            });
        }

        const correspondenciaPrivada = url.pathname.match(/^\/api\/pagamentos\/([0-9a-f-]+)$/i);
        if (requisicao.method === 'GET' && correspondenciaPrivada) {
            if (!autorizacaoValida(requisicao, segredo)) {
                return responderJson(resposta, 401, { erro: 'Nao autorizado.' });
            }
            const pagamento = pagamentos.get(correspondenciaPrivada[1]);
            if (!pagamento) {
                return responderJson(resposta, 404, { erro: 'Pagamento nao encontrado.' });
            }
            return responderJson(resposta, 200, {
                id_pagamento: pagamento.idPagamento,
                referencia: pagamento.referencia,
                valor: pagamento.valor,
                status: atualizarStatusPagamento(pagamento),
                expira_em: new Date(pagamento.expiraEm).toISOString(),
            });
        }

        const correspondenciaPublica = url.pathname.match(/^\/api\/pagamentos-publicos\/([0-9a-f-]+)(\/aprovar)?$/i);
        if (correspondenciaPublica) {
            const pagamento = pagamentos.get(correspondenciaPublica[1]);
            if (!pagamento) {
                return responderJson(resposta, 404, { erro: 'Cobranca nao encontrada.' });
            }

            const statusAtual = atualizarStatusPagamento(pagamento);
            if (requisicao.method === 'GET' && !correspondenciaPublica[2]) {
                return responderJson(resposta, 200, {
                    valor: pagamento.valor,
                    status: statusAtual,
                    expira_em: new Date(pagamento.expiraEm).toISOString(),
                });
            }
            if (requisicao.method === 'POST' && correspondenciaPublica[2]) {
                if (statusAtual === 'expirado') {
                    return responderJson(resposta, 410, { erro: 'Esta cobranca expirou.' });
                }
                pagamento.status = 'aprovado';
                return responderJson(resposta, 200, { valor: pagamento.valor, status: pagamento.status });
            }
        }

        const correspondenciaCheckout = url.pathname.match(/^\/pagar\/([0-9a-f-]+)$/i);
        if (requisicao.method === 'GET' && correspondenciaCheckout) {
            const pagamento = pagamentos.get(correspondenciaCheckout[1]);
            if (!pagamento) {
                resposta.writeHead(404, { ...cabecalhosSaude, 'Content-Type': 'text/plain; charset=utf-8' });
                resposta.end('Cobranca nao encontrada.');
                return;
            }

            atualizarStatusPagamento(pagamento);
            resposta.writeHead(200, {
                ...cabecalhosSaude,
                'Content-Type': 'text/html; charset=utf-8',
                'Content-Security-Policy': "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'",
            });
            resposta.end(paginaPagamento(pagamento.idPagamento));
            return;
        }

        if (requisicao.method === 'GET' && url.pathname === '/assets/axios.min.js') {
            resposta.writeHead(200, {
                ...cabecalhosSaude,
                'Content-Type': 'text/javascript; charset=utf-8',
                'Cache-Control': 'public, max-age=31536000, immutable',
            });
            resposta.end(BUNDLE_AXIOS);
            return;
        }

        responderJson(resposta, 404, { erro: 'Pagina nao encontrada.' });
    });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const segredo = process.env.SEGREDO_COMPARTILHADO;
    const servidor = criarServidorGateway({ segredo, urlPublica: process.env.URL_PUBLICA || '' });
    const porta = Number(process.env.PORT || 4179);
    servidor.listen(porta, '0.0.0.0', () => console.log(`Gateway demonstrativo ativo na porta ${porta}`));
}