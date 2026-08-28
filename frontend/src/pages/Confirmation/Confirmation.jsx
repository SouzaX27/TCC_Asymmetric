import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Confirmation() {
    const navigate = useNavigate();
    const [pedidoFinal, setPedidoFinal] = useState(null);

    useEffect(() => {
        const pedidoSalvo = sessionStorage.getItem('checkout_pedido');
        
        if (!pedidoSalvo) {
            navigate('/inicio');
            return;
        }

        const dados = JSON.parse(pedidoSalvo);
        
        // Se por algum motivo o Payment não gerou o código, gera um aqui de fallback
        if (!dados.codigoPedido) {
            dados.codigoPedido = `#ASMM-${Math.floor(10000 + Math.random() * 90000)}`;
        }

        setPedidoFinal(dados);

        // Prepara o objeto do pedido para o histórico do Orders.jsx
        const novoPedidoCompleto = {
            id: dados.codigoPedido,
            data: new Date().toLocaleDateString('pt-BR'),
            status: 'Pagamento Aprovado',
            statusColor: 'bg-success',
            cliente: dados.cliente,
            frete: dados.frete,
            subtotal: dados.subtotal,
            totalGeral: dados.totalGeral,
            itens: dados.itens || ['Itens da Compra']
        };

        // Salva no histórico local
        const historicoAntigo = JSON.parse(localStorage.getItem('meus_pedidos') || '[]');
        
        // Evita duplicar no F5
        const pedidoJaExiste = historicoAntigo.some(p => p.id === dados.codigoPedido);
        if (!pedidoJaExiste) {
            const novoHistorico = [novoPedidoCompleto, ...historicoAntigo];
            localStorage.setItem('meus_pedidos', JSON.stringify(novoHistorico));
        }

        // Limpa apenas o formulário de dados do checkout
        sessionStorage.removeItem('checkout_formData');
    }, [navigate]);

    if (!pedidoFinal) {
        return null;
    }

    const { cliente, frete, subtotal, totalGeral, codigoPedido } = pedidoFinal;

    return (
        <div className="container my-5 pt-5">
            <div className="max-width-700 mx-auto text-center">

                <div className="mb-4">
                    <div className="display-1 text-success mb-2">✓</div>
                    <h1 className="fw-bold text-uppercase">Pagamento Confirmado!</h1>
                    <p className="fs-5 text-muted">
                        Pedido: <strong className="text-black">{codigoPedido}</strong>
                    </p>
                    <span className="badge bg-success rounded-0 fs-6 fw-normal px-3 py-2 text-uppercase">
                        Status: Pagamento Aprovado
                    </span>
                </div>
                
                <div className="border-grey p-4 mb-4 text-start">
                    <h4 className="fs-3 fw-bold mb-3 border-bottom pb-2">Resumo da Compra</h4>
                    
                    <p className="fs-5 mb-1"><strong>Cliente:</strong> {cliente.nome}</p>
                    <p className="fs-5 mb-1"><strong>E-mail:</strong> {cliente.email}</p>
                    <p className="fs-5 mb-3"><strong>Entrega para:</strong> {cliente.logradouro}, Nº {cliente.numero} - {cliente.bairro}, {cliente.cidade}/{cliente.estado}</p>
                    
                    <div className="border-top pt-3">
                        <p className="fs-5 mb-1"><strong>Forma de Pagamento:</strong> {cliente.formaPagamento === 'pix' ? 'PIX' : 'Cartão de Crédito'}</p>
                        <p className="fs-5 mb-1"><strong>Frete Escolhido:</strong> {frete.nome} ({frete.prazo})</p>
                        <p className="fs-5 mb-1"><strong>Subtotal:</strong> R$ {subtotal.toFixed(2)}</p>
                        <p className="fs-4 fw-bold mb-0 mt-2"><strong>Total Pago:</strong> R$ {totalGeral.toFixed(2)}</p>
                    </div>
                </div>

                <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center mt-4">
                    <Link 
                        to="/pedidos" 
                        className="button-1 text-decoration-none px-4 py-3 fw-bold text-uppercase fs-5"
                    >
                        Acompanhar Pedido
                    </Link>

                    <Link 
                        to="/inicio" 
                        className="button-2 px-4 py-3 fw-bold text-uppercase fs-5 border-grey rounded-0"
                    >
                        Voltar para a Loja
                    </Link>
                </div>

            </div>
        </div>
    );
}

export default Confirmation;