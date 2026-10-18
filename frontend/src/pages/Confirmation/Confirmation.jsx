import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Message from '../../components/Message/Message';

function Confirmation() {
    const navigate = useNavigate();
    const [rascunho] = useState(() => {
        const pedidoSalvo = sessionStorage.getItem('checkout_pedido');
        const dadosPedido = sessionStorage.getItem('checkout_order_payload');
        if (!pedidoSalvo || !dadosPedido) return null;

        try {
            return {
                pedido: JSON.parse(pedidoSalvo),
                dadosPedido: JSON.parse(dadosPedido)
            };
        } catch {
            return null;
        }
    });
    const [enviando, setEnviando] = useState(false);
    const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

    useEffect(() => {
        if (!rascunho) navigate('/checkout', { replace: true });
    }, [navigate, rascunho]);

    const confirmarPedido = async () => {
        setEnviando(true);
        setMensagem({ tipo: '', texto: '' });

        try {
            const response = await api.post('/pagamentos-demo/', rascunho.dadosPedido);
            const pedidoAtualizado = {
                ...rascunho.pedido,
                subtotal: Number(response.data.subtotal),
                desconto: Number(response.data.desconto),
                totalGeral: Number(response.data.valor_total),
                urlCheckout: response.data.url_checkout,
                gatewayDisponivel: response.data.gateway_disponivel,
                frete: {
                    ...rascunho.pedido.frete,
                    valor: Number(response.data.frete)
                }
            };

            sessionStorage.setItem('checkout_pedido', JSON.stringify(pedidoAtualizado));
            sessionStorage.setItem('checkout_payment_token', response.data.token);
            sessionStorage.removeItem('checkout_order_payload');
            navigate('/pagamento');
        } catch (error) {
            const erros = error.response?.data;
            const mensagemErro = typeof erros === 'string'
                ? erros
                : Object.values(erros || {}).flat().join(' ');
            setMensagem({
                tipo: 'erro',
                texto: mensagemErro || 'Não foi possível confirmar o pedido. Revise os dados e tente novamente.'
            });
        } finally {
            setEnviando(false);
        }
    };

    if (!rascunho) return null;

    const { pedido } = rascunho;
    const { cliente, frete, itens, subtotal, desconto, totalGeral } = pedido;

    return (
        <main className="container my-5 pt-4">
            <h1 className="fw-bold text-uppercase mb-4">Confirme seu pedido</h1>

            <div className="row g-4">
                <section className="col-lg-7">
                    <div className="border-grey p-4 mb-4">
                        <h2 className="fs-4 fw-bold mb-3">Comprador</h2>
                        <p className="mb-1"><strong>Nome:</strong> {cliente.nome}</p>
                        <p className="mb-1"><strong>E-mail:</strong> {cliente.email}</p>
                        <p className="mb-0"><strong>Telefone:</strong> {cliente.telefone}</p>

                        <h2 className="fs-4 fw-bold mt-4 mb-3">Entrega</h2>
                        <p className="mb-1">{cliente.logradouro}, nº {cliente.numero}</p>
                        <p className="mb-1">{cliente.bairro}, {cliente.cidade}/{cliente.estado}</p>
                        <p className="mb-3">CEP: {cliente.cep}</p>
                        <p className="mb-0"><strong>{frete.nome}</strong> ({frete.prazo})</p>
                    </div>

                    <div className="border-grey p-4">
                        <h2 className="fs-4 fw-bold mb-3">Itens</h2>
                        {itens.map((item, index) => (
                            <div key={`${item.nome}-${item.tamanho}-${index}`} className="d-flex justify-content-between gap-3 mb-2">
                                <span>{item.nome}, tam. {item.tamanho} × {item.quantidade}</span>
                                <span>{(item.preco * item.quantidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <aside className="col-lg-5">
                    <div className="border-grey p-4">
                        <h2 className="fs-4 fw-bold mb-3">Resumo</h2>
                        <div className="d-flex justify-content-between mb-2">
                            <span>Subtotal</span>
                            <span>{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                        {desconto > 0 && (
                            <div className="d-flex justify-content-between mb-2 text-success">
                                <span>Desconto</span>
                                <span>- {desconto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                        )}
                        <div className="d-flex justify-content-between mb-3">
                            <span>Frete</span>
                            <span>{Number(frete.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                        <div className="d-flex justify-content-between border-top pt-3 mb-4 fs-5 fw-bold">
                            <span>Total</span>
                            <span>{totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>

                        {/* <p className="text-muted">O pagamento é demonstrativo. Nenhuma cobrança real será feita.</p> */}
                        <Message tipo={mensagem.tipo} texto={mensagem.texto} />
                        <button
                            type="button"
                            className="button-1 w-100 py-3 fw-bold text-uppercase"
                            onClick={confirmarPedido}
                            disabled={enviando}
                        >
                            {enviando ? 'Preparando pagamento...' : 'Confirmar pedido e continuar'}
                        </button>
                        <Link to="/checkout" className="d-block text-center mt-3 text-muted">
                            Voltar e editar dados
                        </Link>
                    </div>
                </aside>
            </div>
        </main>
    );
}

export default Confirmation;