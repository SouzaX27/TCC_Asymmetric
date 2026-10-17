import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { criarServidorGateway } from './server.js';

const segredo = 'segredo-de-teste';
const pagamentosAtivos = new Map();
const servidor = criarServidorGateway({ segredo, urlPublica: 'https://gateway.example.test', pagamentos: pagamentosAtivos });
let urlBase;

before(async () => {
    await new Promise((resolver) => servidor.listen(0, '127.0.0.1', resolver));
    urlBase = `http://127.0.0.1:${servidor.address().port}`;
});

after(async () => {
    await new Promise((resolver, rejeitar) => servidor.close((erro) => erro ? rejeitar(erro) : resolver()));
});

test('criar pagamento exige autenticação do servidor e a aprovação pública é consultável', async () => {
    const idAntigo = 'ddc124f1-90f7-46f6-a429-a625f1ff7222';
    pagamentosAtivos.set(idAntigo, {
        idPagamento: idAntigo,
        referencia: 'pagamento-antigo',
        valor: 1,
        status: 'expirado',
        criadoEm: Date.now() - 45 * 60 * 1000,
        expiraEm: Date.now() - 25 * 60 * 1000,
    });

    const paginaInicial = await fetch(`${urlBase}/`);
    assert.equal(paginaInicial.status, 200);
    assert.match(await paginaInicial.text(), /Gateway demonstrativo ativo/);

    const dados = { valor: '102.50', referencia: 'pedido-demo-1' };
    const naoAutorizada = await fetch(`${urlBase}/api/pagamentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
    });
    assert.equal(naoAutorizada.status, 401);

    const criada = await fetch(`${urlBase}/api/pagamentos`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${segredo}`,
        },
        body: JSON.stringify(dados),
    });
    assert.equal(criada.status, 201);
    assert.equal(pagamentosAtivos.has(idAntigo), false);
    const pagamento = await criada.json();
    assert.match(pagamento.url_checkout, /^https:\/\/gateway\.example\.test\/pagar\//);

    const pagina = await fetch(`${urlBase}/pagar/${pagamento.id_pagamento}`);
    const html = await pagina.text();
    assert.match(html, /\/assets\/axios\.min\.js/);
    assert.match(html, /axios\.get\(/);
    assert.match(html, /axios\.post\(/);
    assert.doesNotMatch(html, /fetch\(/);
    assert.match(html, /Esta simulação não movimenta dinheiro real/);
    assert.match(html, /confirme a simulação/);

    const biblioteca = await fetch(`${urlBase}/assets/axios.min.js`);
    assert.equal(biblioteca.status, 200);
    assert.match(biblioteca.headers.get('content-type'), /javascript/);

    const aprovacao = await fetch(`${urlBase}/api/pagamentos-publicos/${pagamento.id_pagamento}/aprovar`, { method: 'POST' });
    assert.equal(aprovacao.status, 200);
    assert.equal((await aprovacao.json()).status, 'aprovado');

    const consultaInterna = await fetch(`${urlBase}/api/pagamentos/${pagamento.id_pagamento}`, {
        headers: { Authorization: `Bearer ${segredo}` },
    });
    const pagamentoConsultado = await consultaInterna.json();
    assert.equal(pagamentoConsultado.status, 'aprovado');
    assert.equal(pagamentoConsultado.id_pagamento, pagamento.id_pagamento);
    assert.equal(pagamentoConsultado.valor, 102.5);
    assert.equal(pagamentoConsultado.referencia, 'pedido-demo-1');

    const referenciaVazia = await fetch(`${urlBase}/api/pagamentos`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${segredo}`,
        },
        body: JSON.stringify({ valor: 1, referencia: '   ' }),
    });
    assert.equal(referenciaVazia.status, 400);
    assert.match((await referenciaVazia.json()).erro, /referência válida/);
});

test('pagamentos expirados não podem ser aprovados', async () => {
    const idPagamento = '2fba5536-30fb-49d6-a06a-31b0da8fcd20';
    const pagamentos = new Map([[idPagamento, {
        idPagamento,
        referencia: 'demo-expirado',
        valor: 20,
        status: 'pendente',
        criadoEm: Date.now() - 1000,
        expiraEm: Date.now() - 1,
    }]]);
    const servidorExpirado = criarServidorGateway({ segredo, pagamentos });
    await new Promise((resolver) => servidorExpirado.listen(0, '127.0.0.1', resolver));
    const urlExpirada = `http://127.0.0.1:${servidorExpirado.address().port}`;

    try {
        const consulta = await fetch(`${urlExpirada}/api/pagamentos-publicos/${idPagamento}`);
        assert.equal((await consulta.json()).status, 'expirado');

        const aprovacao = await fetch(`${urlExpirada}/api/pagamentos-publicos/${idPagamento}/aprovar`, { method: 'POST' });
        assert.equal(aprovacao.status, 410);
    } finally {
        await new Promise((resolver, rejeitar) => servidorExpirado.close((erro) => erro ? rejeitar(erro) : resolver()));
    }
});
