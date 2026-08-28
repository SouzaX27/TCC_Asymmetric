import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function Orders() {
    const [pedidos, setPedidos] = useState([]);

    useEffect(() => {
        // Carrega os pedidos salvos no localStorage (ordenados do mais recente ao mais antigo)
        const historico = JSON.parse(localStorage.getItem('meus_pedidos') || '[]');
        setPedidos(historico);
    }, []);

    return (
        <div className="container my-5 pt-5">
            <h1 className="fw-bold text-black text-uppercase mb-4 pb-2">Meus Pedidos</h1>

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
                                            onClick={() => alert(`Rastreio do pedido ${pedido.id}: O código será enviado por e-mail (${pedido.cliente?.email}) assim que postado!`)}
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
        </div>
    );
}

export default Orders;