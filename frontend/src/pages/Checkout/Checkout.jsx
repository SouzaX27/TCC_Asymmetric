import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import api from '../../services/api';
import Message from '../../components/Message/Message';

function Checkout() {
    const navigate = useNavigate();
    const { cart, cartTotal } = useCart();

    const [formData, setFormData] = useState(() => {
        const dadosSalvos = sessionStorage.getItem('checkout_formData');
        return dadosSalvos ? JSON.parse(dadosSalvos) : {
            nome: '',
            email: '',
            telefone: '',
            cep: '',
            logradouro: '',
            numero: '',
            bairro: '',
            cidade: '',
            estado: '',
            cupom: ''
        };
    });

    const [opcoesFrete, setOpcoesFrete] = useState([]);
    const [freteSelecionado, setFreteSelecionado] = useState(null);

    const [desconto, setDesconto] = useState(0);
    const [cupomAplicado, setCupomAplicado] = useState(null);
    const [mensagemCupom, setMensagemCupom] = useState({ tipo: '', texto: '' });
    const [mensagemCep, setMensagemCep] = useState({ tipo: '', texto: '' });
    const [mensagemGeral, setMensagemGeral] = useState({ tipo: '', texto: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));

        if (name === 'cupom') {
            setDesconto(0);
            setCupomAplicado(null);
            setMensagemCupom({ tipo: '', texto: '' });
        }
        if (name === 'cep') {
            setOpcoesFrete([]);
            setFreteSelecionado(null);
            setMensagemCep({ tipo: '', texto: '' });
        }
    };

    const calcularFrete = async (cepDestino) => {
        const itens = cart.map((item) => ({
            variacao_produto: item.id_variacao || item.variacoes?.find((variacao) => variacao.tamanho === item.tamanho)?.id_variacao,
            quantidade: item.quantidade
        }));

        if (itens.some((item) => !item.variacao_produto)) {
            setOpcoesFrete([]);
            setFreteSelecionado(null);
            setMensagemCep({ tipo: 'erro', texto: 'Remova e adicione novamente os itens antigos do carrinho para atualizar as variações.' });
            return;
        }

        try {
            const response = await api.post('/frete/calcular/', {
                cep_destino: cepDestino,
                itens
            });

            const opcoes = (response.data.opcoes || []).map((op, idx) => {
                const dias = op.prazo_dias || op.prazo || 0;
                const textoPrazo = dias === 1 ? '1 dia útil' : `${dias} dias úteis`;

                return {
                    id: String(op.id_servico ?? `opcao-${idx}`),
                    servicoId: Number(op.id_servico ?? 0),
                    nome: op.nome || 'Entrega',
                    valor: Number(op.preco),
                    prazo: textoPrazo,
                    cotacaoToken: op.cotacao_token
                };
            });

            if (opcoes.length === 0 || opcoes.some((opcao) => !opcao.cotacaoToken || !Number.isFinite(opcao.valor))) {
                throw new Error('Nenhuma opção de frete válida retornada pela API.');
            }

            setOpcoesFrete(opcoes);
            setFreteSelecionado(opcoes[0]);
            setMensagemCep({ tipo: '', texto: '' });
        } catch (error) {
            console.error('Erro ao calcular o frete via API:', error.response?.data || error.message);
            setOpcoesFrete([]);
            setFreteSelecionado(null);
            setMensagemCep({ tipo: 'erro', texto: 'Não foi possível cotar o frete. Tente novamente em instantes.' });
        }
    };

    const handleCepBlur = async (e) => {
        const cepLimpo = e.target.value.replace(/\D/g, '');

        if (cepLimpo.length === 8) {
            setMensagemCep({ tipo: '', texto: '' });
            setOpcoesFrete([]);
            setFreteSelecionado(null);
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
                const data = await response.json();

                if (!data.erro) {
                    setFormData((prev) => ({
                        ...prev,
                        logradouro: data.logradouro,
                        bairro: data.bairro,
                        cidade: data.localidade,
                        estado: data.uf
                    }));

                    await calcularFrete(cepLimpo);
                } else {
                    setMensagemCep({ tipo: 'erro', texto: 'CEP não encontrado. Verifique o número digitado.' });
                    setOpcoesFrete([]);
                    setFreteSelecionado(null);
                }
            } catch (error) {
                console.error('Erro ao buscar o CEP:', error);
                setMensagemCep({ tipo: 'erro', texto: 'Erro ao consultar o CEP. Tente novamente.' });
            }
        } else {
            setOpcoesFrete([]);
            setFreteSelecionado(null);
            setMensagemCep({ tipo: 'erro', texto: 'Informe um CEP com oito dígitos.' });
        }
    };

    const handleAplicarCupom = async () => {
        if (!formData.cupom) {
            setMensagemCupom({ tipo: 'erro', texto: 'Informe o código do cupom.' });
            return;
        }

        try {
            const response = await api.post('/cupons/validar/', {
                codigo: formData.cupom.trim(),
                subtotal: cartTotal
            });

            const data = response.data;
            if (data.valido) {
                setDesconto(data.valor_desconto_calculado);
                setCupomAplicado(data);
                setMensagemCupom({ tipo: 'sucesso', texto: `Cupom "${data.codigo}" aplicado com sucesso! (-R$ ${data.valor_desconto_calculado.toFixed(2)})` });
            }
        } catch (error) {
            console.error('Erro ao validar cupom:', error.response?.data || error.message);
            const erroMsg = error.response?.data?.error || 'Cupom inválido ou expirado.';
            setDesconto(0);
            setCupomAplicado(null);
            setMensagemCupom({ tipo: 'erro', texto: erroMsg });
        }
    };

    const valorFrete = freteSelecionado ? Number(freteSelecionado.valor || 0) : 0;
    const totalComFrete = Math.max(0, cartTotal - desconto) + valorFrete;

    const handleSubmit = (e) => {
        e.preventDefault();

        if (cart.length === 0) {
            setMensagemGeral({ tipo: 'erro', texto: 'Seu carrinho está vazio!' });
            return;
        }

        if (!freteSelecionado) {
            setMensagemGeral({ tipo: 'erro', texto: 'Por favor, informe um CEP válido para calcular o frete.' });
            return;
        }

        const itens = cart.map((item) => ({
            variacao_produto: item.id_variacao || item.variacoes?.find((variacao) => variacao.tamanho === item.tamanho)?.id_variacao,
            quantidade: item.quantidade
        }));
        if (itens.some((item) => !item.variacao_produto)) {
            setMensagemGeral({ tipo: 'erro', texto: 'Um item do carrinho não possui uma variação válida. Remova-o e adicione o produto novamente.' });
            return;
        }

        const dadosPedido = {
            nome_comprador: formData.nome,
            email_comprador: formData.email,
            telefone_comprador: formData.telefone,
            cep_entrega: formData.cep,
            endereco_entrega: formData.logradouro,
            numero_entrega: formData.numero,
            bairro_entrega: formData.bairro,
            cidade_entrega: formData.cidade,
            estado_entrega: formData.estado.toUpperCase(),
            cupom: cupomAplicado?.id_cupom || null,
            frete_cotacao: freteSelecionado.cotacaoToken,
            itens
        };

        const pedidoRascunho = {
            cliente: formData,
            frete: freteSelecionado,
            subtotal: cartTotal,
            desconto,
            totalGeral: totalComFrete,
            itens: cart.map((item) => ({
                nome: item.nome,
                tamanho: item.tamanho,
                quantidade: item.quantidade,
                preco: item.preco
            }))
        };

        sessionStorage.setItem('checkout_formData', JSON.stringify(formData));
        sessionStorage.setItem('checkout_order_payload', JSON.stringify(dadosPedido));
        sessionStorage.setItem('checkout_pedido', JSON.stringify(pedidoRascunho));
        sessionStorage.removeItem('checkout_payment_token');
        navigate('/confirmacao');
    };

    if (cart.length === 0) {
        return (
            <div className="container mt-5 pt-5 text-center">
                <div className="max-width-600 mx-auto">
                    <h2 className="fw-bold text-uppercase mb-3">Seu carrinho está vazio</h2>
                    <p className="text-muted mb-4">Adicione alguns produtos para continuar com o checkout.</p>
                    <Link to="/inicio" className="button-1 text-decoration-none d-inline-block px-4 py-3 fw-bold text-uppercase">
                        Voltar para a Loja
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container my-2 pt-5">
            <h1 className="fw-bold text-black text-uppercase mb-2 pb-3">Finalizar Pedido</h1>

            <form onSubmit={handleSubmit} className="row g-4">
                <div className="col-lg-7">
                    <div className="border-grey p-4 mb-4">
                        <h4 className="mb-3 fs-3 fw-bold">Dados Pessoais</h4>
                        <div className="row g-3">
                            <div className="col-12">
                                <label className="form-label fs-5">Nome Completo</label>
                                <input
                                    type="text"
                                    className="form-control fs-5 border-grey rounded-0"
                                    name="nome"
                                    value={formData.nome}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fs-5">E-mail</label>
                                <input
                                    type="email"
                                    className="form-control fs-5 border-grey rounded-0"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fs-5">Telefone / WhatsApp</label>
                                <input
                                    type="tel"
                                    className="form-control fs-5 border-grey rounded-0"
                                    name="telefone"
                                    value={formData.telefone}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <h4 className="mt-4 mb-3 fs-3 fw-bold">Endereço de Entrega</h4>
                        <div className="row g-3">
                            <div className="col-md-4">
                                <label className="form-label fs-5">CEP</label>
                                <input
                                    type="text"
                                    className="form-control fs-5 border-grey rounded-0"
                                    name="cep"
                                    value={formData.cep}
                                    onChange={handleChange}
                                    onBlur={handleCepBlur}
                                    maxLength="9"
                                    placeholder="00000-000"
                                    required
                                />
                                <Message tipo={mensagemCep.tipo} texto={mensagemCep.texto} />
                            </div>
                            <div className="col-md-8">
                                <label className="form-label fs-5">Rua / Logradouro</label>
                                <input
                                    type="text"
                                    className="form-control fs-5 border-grey rounded-0"
                                    name="logradouro"
                                    value={formData.logradouro}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label fs-5">Número</label>
                                <input
                                    type="text"
                                    className="form-control fs-5 border-grey rounded-0"
                                    name="numero"
                                    value={formData.numero}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="col-md-8">
                                <label className="form-label fs-5">Bairro</label>
                                <input
                                    type="text"
                                    className="form-control fs-5 border-grey rounded-0"
                                    name="bairro"
                                    value={formData.bairro}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="col-md-8">
                                <label className="form-label fs-5">Cidade</label>
                                <input
                                    type="text"
                                    className="form-control fs-5 border-grey rounded-0"
                                    name="cidade"
                                    value={formData.cidade}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label fs-5">UF / Estado</label>
                                <input
                                    type="text"
                                    className="form-control fs-5 border-grey rounded-0"
                                    name="estado"
                                    value={formData.estado}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        {opcoesFrete.length > 0 && (
                            <div className="mt-4 border-top pt-3">
                                <h4 className="mb-3 fs-3 fw-bold">Opções de Entrega</h4>
                                {opcoesFrete.map((opcao) => (
                                    <div key={opcao.id} className="form-check p-3 border-grey mb-2 d-flex justify-content-between align-items-center">
                                        <div>
                                            <input
                                                className="form-check-input me-2"
                                                type="radio"
                                                name="opcaoFrete"
                                                id={opcao.id}
                                                checked={freteSelecionado?.id === opcao.id}
                                                onChange={() => setFreteSelecionado(opcao)}
                                            />
                                            <label className="form-check-label fw-semibold fs-5" htmlFor={opcao.id}>
                                                {opcao.nome} <small className="text-muted fs-6">({opcao.prazo})</small>
                                            </label>
                                        </div>
                                        <span className="fw-bold fs-5">
                                            R$ {Number(opcao.valor || 0).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="col-lg-5">
                    <div className="border-grey p-4">
                        <h4 className="mb-3 fs-3 fw-bold">Resumo do Pedido</h4>
                        <div className="mb-3 border-bottom pb-2">
                            {cart.map((item, index) => (
                                <div key={`${item.id_variacao || item.id}-${item.tamanho}-${index}`} className="d-flex justify-content-between align-items-center mb-2">
                                    <div>
                                        <span className="fw-semibold">{item.nome}</span>
                                        <br />
                                        <small className="text-muted">Tam: {item.tamanho} | Qtd: {item.quantidade}</small>
                                    </div>
                                    <span>R$ {((item.preco || 0) * item.quantidade).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mb-3">
                            <label className="form-label fs-5">Cupom de Desconto</label>
                            <div className="d-flex gap-2">
                                <input
                                    type="text"
                                    className="form-control fs-5 border-grey rounded-0 text-uppercase"
                                    name="cupom"
                                    value={formData.cupom}
                                    onChange={handleChange}
                                    placeholder="Ex: PR1M31R4C0MPR4"
                                />
                                <button
                                    type="button"
                                    className="button-1 px-4 text-uppercase fw-bold"
                                    onClick={handleAplicarCupom}
                                >
                                    Aplicar
                                </button>
                            </div>
                            <Message tipo={mensagemCupom.tipo} texto={mensagemCupom.texto} />
                        </div>

                        <div className="border-top pt-3 mb-3 fs-5">
                            <div className="d-flex justify-content-between mb-2">
                                <span>Subtotal:</span>
                                <span>R$ {cartTotal.toFixed(2)}</span>
                            </div>
                            {desconto > 0 && (
                                <div className="d-flex justify-content-between mb-2 text-success">
                                    <span>Desconto:</span>
                                    <span>- R$ {desconto.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="d-flex justify-content-between mb-2">
                                <span>Frete:</span>
                                <span>{freteSelecionado ? `R$ ${valorFrete.toFixed(2)}` : 'Digite o CEP'}</span>
                            </div>
                        </div>

                        <h4 className="mt-3 mb-2 fs-3 fw-bold">Revisão do pedido</h4>
                        <p className="text-muted">Você poderá revisar os dados antes de gerar o pagamento demonstrativo.</p>

                        <div className="d-flex justify-content-between fs-3 fw-bold mb-4 border-top pt-3">
                            <span>Total:</span>
                            <span>R$ {totalComFrete.toFixed(2)}</span>
                        </div>

                        <Message tipo={mensagemGeral.tipo} texto={mensagemGeral.texto} />

                        <button type="submit" className="button-1 w-100 py-3 fw-bold text-uppercase mt-2">
                            Revisar pedido
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default Checkout;