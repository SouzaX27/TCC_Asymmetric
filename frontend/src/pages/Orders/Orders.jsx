import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Modal from '../../components/Modal/Modal';
import Message from '../../components/Message/Message';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from 'react-bootstrap';

function Orders() {
    const navigate = useNavigate();
    const { signed, loading: authLoading } = useAuth();
    const [pedidos, setPedidos] = useState([]);
    const [pedidoRastreio, setPedidoRastreio] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    useEffect(() => {
        if (authLoading) return undefined;
        if (!signed) {
            navigate('/login', { replace: true });
            return undefined;
        }

        let ativo = true;
        api.get('pedidos/')
            .then((resposta) => {
                if (!ativo) return;
                const lista = Array.isArray(resposta.data) ? resposta.data : resposta.data.results || [];
                setPedidos(lista.map((pedido) => ({
                    id: `#ASMM-${pedido.id_pedido}`,
                    data: new Date(pedido.data_pedido).toLocaleDateString('pt-BR'),
                    status: pedido.status,
                    statusColor: pedido.status.toLowerCase().includes('aprovado') ? 'bg-success' : 'bg-warning text-dark',
                    cliente: {
                        nome: pedido.nome_comprador,
                        email: pedido.email_comprador,
                        cidade: pedido.cidade_entrega,
                        estado: pedido.estado_entrega
                    },
                    frete: { nome: pedido.servico_frete_nome },
                    totalGeral: Number(pedido.valor_final)
                })));
                setErro('');
            })
            .catch((error) => {
                if (!ativo) return;
                if (error.response?.status === 401) {
                    navigate('/login', { replace: true });
                } else {
                    setErro('Não foi possível carregar seus pedidos. Tente novamente.');
                }
            })
            .finally(() => {
                if (ativo) setCarregando(false);
            });

        return () => {
            ativo = false;
        };
    }, [authLoading, navigate, signed]);

    if (authLoading || carregando) {
        return (
            <div className="container py-5 text-center my-5">
                <Spinner animation="border" variant="dark" />
                <p className="text-muted mt-3">Carregando pedidos...</p>
            </div>
        );
    }

    return (
        <div className="container my-5 pt-5">
            <h1 className="fw-bold text-black text-uppercase mb-4 pb-2">Meus Pedidos</h1>
            <Message tipo="erro" texto={erro} className="mb-3" />

            {pedidos.length === 0 ? (
                <div className="border-grey p-5 text-center my-4">
                    <h3 className="fw-bold text-uppercase mb-3">Nenhum pedido encontrado</h3>
                    <p className="fs-5 text-muted mb-4">
                        Você ainda não realizou compras nesta sessão.
                    </p>
                    <Link to="/inicio" className="button-1 text-decoration-none px-5 py-3 fw-bold text-uppercase fs-5 d-inline-block">
                        Ir para a Loja
                    </Link>
                </div>
            ) : (
                <div className="row g-4">
                    {pedidos.map((pedido) => (
                        <div key={pedido.id} className="col-12">
                            <div className="border-grey p-4">
                                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 border-bottom pb-3">
                                    <div>
                                        <h4 className="fw-bold m-0 fs-3">{pedido.id}</h4>
                                        <span className="text-muted fs-6">Realizado em: {pedido.data}</span>
                                    </div>
                                    <div className="mt-2 mt-md-0">
                                        <span className={`badge ${pedido.statusColor || 'bg-success'} rounded-0 fs-6 px-3 py-2 text-uppercase`}>
                                            Status: {pedido.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="row align-items-center fs-5">
                                    <div className="col-md-8">
                                        <p className="mb-1"><strong>Cliente:</strong> {pedido.cliente?.nome}</p>
                                        <p className="mb-1"><strong>Entrega:</strong> {pedido.cliente?.cidade}/{pedido.cliente?.estado} ({pedido.frete?.nome})</p>
                                        <p className="mb-0"><strong>Total Pago:</strong> R$ {pedido.totalGeral?.toFixed(2)}</p>
                                    </div>
                                    <div className="col-md-4 text-md-end mt-3 mt-md-0">
                                        <button 
                                            type="button"
                                            onClick={() => setPedidoRastreio(pedido)}
                                            className="button-2 fw-bold fs-6 text-uppercase border-grey rounded-0 px-4 py-2"
                                        >
                                            Rastrear Envio
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal
                show={Boolean(pedidoRastreio)}
                onClose={() => setPedidoRastreio(null)}
                title="Rastreamento do pedido"
            >
                {pedidoRastreio && (
                    <>
                        <p><strong>Pedido:</strong> {pedidoRastreio.id}</p>
                        <p className="mb-0">O código de rastreio será enviado para {pedidoRastreio.cliente?.email} assim que o pedido for postado.</p>
                    </>
                )}
            </Modal>
        </div>
    );
}

export default Orders;