import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import Message from '../../components/Message/Message';

function lerPedidoSalvo() {
    try {
        return JSON.parse(sessionStorage.getItem('checkout_pedido') || 'null');
    } catch {
        return null;
    }
}

function registrarPedidoAprovado(idPedido) {
    const pedido = lerPedidoSalvo() || {};
    pedido.idPedido = idPedido;
    pedido.codigoPedido = `#ASMM-${idPedido}`;
    pedido.pagamentoAprovado = true;
    sessionStorage.setItem('checkout_pedido', JSON.stringify(pedido));
    sessionStorage.removeItem('checkout_payment_token');
    sessionStorage.removeItem('checkout_order_payload');
    sessionStorage.removeItem('checkout_formData');
    return pedido;
}

function Payment() {
    const navigate = useNavigate();
    const { clearCart } = useCart();
    const token = sessionStorage.getItem('checkout_payment_token');
    const [pedidoAprovado, setPedidoAprovado] = useState(() => {
        const pedido = lerPedidoSalvo();
        return pedido?.pagamentoAprovado ? pedido : null;
    });
    const [cobrancaExpirada, setCobrancaExpirada] = useState(false);
    const [mensagem, setMensagem] = useState('Escaneie o QR Code com o celular e confirme o pagamento demonstrativo.');
    const [confirmandoLocal, setConfirmandoLocal] = useState(false);

    useEffect(() => {
        if (!token || pedidoAprovado) return undefined;

        let ativo = true;
        let consultando = false;

        const consultarStatus = async () => {
            if (consultando || !ativo) return;
            consultando = true;
            try {
                const response = await api.get(`/pagamentos-demo/${token}/`);
                if (!ativo) return;

                if (response.data.status === 'aprovado') {
                    setPedidoAprovado(registrarPedidoAprovado(response.data.id_pedido));
                    clearCart();
                } else if (response.data.status === 'expirado') {
                    setCobrancaExpirada(true);
                    setMensagem('Esta cobrança expirou. Volte ao checkout para gerar outra.');
                } else if (response.data.gateway_disponivel === false) {
                    setMensagem('Gateway hospedado indisponível. O apresentador pode confirmar neste computador.');
                }
            } catch (error) {
                if (ativo) {
                    setMensagem(error.response?.data?.erro || 'Não foi possível consultar o pagamento.');
                }
            } finally {
                consultando = false;
            }
        };

        consultarStatus();
        const intervalo = window.setInterval(consultarStatus, 2000);
        return () => {
            ativo = false;
            window.clearInterval(intervalo);
        };
    }, [clearCart, pedidoAprovado, token]);

    useEffect(() => {
        if (!token && !pedidoAprovado) navigate('/checkout', { replace: true });
    }, [navigate, pedidoAprovado, token]);

    const confirmarLocalmente = async () => {
        setConfirmandoLocal(true);
        setMensagem('Confirmando pelo backend local...');
        try {
            const response = await api.post(`/pagamentos-demo/${token}/confirmar/`, {});
            setPedidoAprovado(registrarPedidoAprovado(response.data.id_pedido));
            clearCart();
        } catch (error) {
            setMensagem(error.response?.data?.erro || 'Não foi possível confirmar pelo backend local.');
        } finally {
            setConfirmandoLocal(false);
        }
    };

    if (!token && !pedidoAprovado) return null;

    if (pedidoAprovado) {
        const { cliente, frete, subtotal, desconto, totalGeral, codigoPedido } = pedidoAprovado;
        return (
            <main className="container my-5 pt-4">
                <div className="mx-auto text-center" style={{ maxWidth: '700px' }}>
                    <div className="display-1 text-success mb-2">✓</div>
                    <h1 className="fw-bold text-uppercase">Pedido confirmado</h1>
                    <p className="fs-5 text-muted mb-4">Pedido {codigoPedido}. Pagamento demonstrativo aprovado.</p>

                    <section className="border-grey p-4 mb-4 text-start">
                        <h2 className="fs-4 fw-bold mb-3">Resumo da compra</h2>
                        <p className="mb-1"><strong>Cliente:</strong> {cliente.nome}</p>
                        <p className="mb-1"><strong>E-mail:</strong> {cliente.email}</p>
                        <p className="mb-3"><strong>Entrega:</strong> {cliente.logradouro}, nº {cliente.numero}, {cliente.bairro}, {cliente.cidade}/{cliente.estado}</p>
                        <p className="mb-1"><strong>Subtotal:</strong> {subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        <p className="mb-1"><strong>Frete:</strong> {frete.nome} ({frete.prazo}): {frete.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        {desconto > 0 && <p className="mb-1 text-success"><strong>Desconto:</strong> - {desconto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>}
                        <p className="fs-5 fw-bold mb-0"><strong>Total:</strong> {totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </section>

                    <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
                        <Link to="/pedidos" className="button-1 text-decoration-none px-4 py-3 fw-bold text-uppercase">Acompanhar pedido</Link>
                        <Link to="/inicio" className="button-2 px-4 py-3 fw-bold text-uppercase border-grey">Voltar à loja</Link>
                    </div>
                </div>
            </main>
        );
    }

    const pedidoSalvo = lerPedidoSalvo() || {};
    const urlConfirmacao = pedidoSalvo.urlCheckout;

    return (
        <main className="container my-5 pt-4">
            <div className="mx-auto text-center" style={{ maxWidth: '680px' }}>
                <h1 className="fw-bold text-uppercase mb-2">Pagamento demonstrativo</h1>
                <p className="text-muted fs-5 mb-4">Nenhuma cobrança real será feita.</p>

                {cobrancaExpirada ? (
                    <div className="border-grey p-4">
                        <p className="mb-4">{mensagem}</p>
                        <Link to="/checkout" className="button-1 px-4 py-3 fw-bold text-uppercase text-decoration-none">Voltar ao checkout</Link>
                    </div>
                ) : (
                    <div className="border-grey p-4">
                        {urlConfirmacao ? (
                            <>
                                <div className="d-flex justify-content-center mb-4">
                                    <QRCodeSVG value={urlConfirmacao} size={240} level="M" includeMargin />
                                </div>
                                <p className="fs-5 fw-semibold mb-2">Aguardando confirmação pelo celular</p>
                            </>
                        ) : (
                            <Message tipo="aviso" texto="QR remoto indisponível. Conclua a simulação neste computador." />
                        )}
                        <p className="text-muted mb-0">{mensagem}</p>
                        <p className="small text-muted mt-3 mb-0">A cobrança expira em 20 minutos.</p>
                        <button
                            type="button"
                            className="button-2 mt-4 px-4 py-2 fw-bold text-uppercase"
                            onClick={confirmarLocalmente}
                            disabled={confirmandoLocal}
                        >
                            {confirmandoLocal ? 'Confirmando...' : 'Confirmar no computador (contingência)'}
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}

export default Payment;