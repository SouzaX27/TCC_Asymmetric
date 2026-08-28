import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

function Payment() {
    const navigate = useNavigate();
    const { clearCart } = useCart();

    const [dadosPedido, setDadosPedido] = useState(null);
    const [pixGerado, setPixGerado] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const [cartaoInfo, setCartaoInfo] = useState({
        numero: '',
        nomeTitular: '',
        validade: '',
        cvv: '',
        parcelas: '1'
    });

    useEffect(() => {
        const pedidoSalvo = sessionStorage.getItem('checkout_pedido');
        if (pedidoSalvo) {
            setDadosPedido(JSON.parse(pedidoSalvo));
        } else {
            navigate('/checkout');
        }
    }, [navigate]);

    if (!dadosPedido) {
        return null;
    }

    const { cliente, frete, subtotal, totalGeral } = dadosPedido;

    const handleCartaoChange = (e) => {
        const { name, value } = e.target;
        setCartaoInfo((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleVoltarEditar = () => {
        navigate('/checkout');
    };

const concluirEIrParaConfirmacao = () => {
    // Recupera o pedido atual do sessionStorage
    const pedidoSalvo = JSON.parse(sessionStorage.getItem('checkout_pedido') || '{}');
    
    // Gera um código NOVO para esta compra específica
    const novoCodigo = `#ASMM-${Math.floor(10000 + Math.random() * 90000)}`;
    
    // Salva o pedido com o seu código único no sessionStorage
    sessionStorage.setItem('checkout_pedido', JSON.stringify({
        ...pedidoSalvo,
        codigoPedido: novoCodigo
    }));

    clearCart();
    navigate('/confirmacao');
};

    const handleFinalizarCompra = (e) => {
        e.preventDefault();

        // -------------------------------------------------------------
        // CAMINHO 1: CARTÃO DE CRÉDITO
        // -------------------------------------------------------------
        if (cliente.formaPagamento === 'cartao') {
            if (!cartaoInfo.numero || !cartaoInfo.nomeTitular || !cartaoInfo.validade || !cartaoInfo.cvv) {
                alert('Por favor, preencha todos os dados do cartão de crédito.');
                return;
            }

            setIsProcessing(true);

            // Simula o tempo do gateway (2 segundos) e vai para /confirmation
            setTimeout(() => {
                setIsProcessing(false);
                concluirEIrParaConfirmacao();
            }, 2000);

        // -------------------------------------------------------------
        // CAMINHO 2: PIX
        // -------------------------------------------------------------
        } else if (cliente.formaPagamento === 'pix') {
            setIsProcessing(true);

            // Simula a geração do QR Code na API do Gateway (1.5 segundos)
            setTimeout(() => {
                setIsProcessing(false);
                setPixGerado(true);
            }, 1500);
        }
    };

    return (
        <div className="container my-2 pt-5">
            <h1 className="fw-bold text-black text-uppercase mb-4 pb-2">Revisão e Pagamento</h1>

            <div className="row g-4">
                <div className="col-lg-7">
                    <div className="border-grey p-4 mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h4 className="fs-3 fw-bold m-0">Dados do Destinatário</h4>
                            <button type="button" onClick={handleVoltarEditar} className="btn btn-link text-black fw-bold text-decoration-underline p-0">
                                Editar
                            </button>
                        </div>
                        <p className="mb-1 fs-5"><strong>Nome:</strong> {cliente.nome}</p>
                        <p className="mb-1 fs-5"><strong>E-mail:</strong> {cliente.email}</p>
                        <p className="mb-3 fs-5"><strong>Telefone:</strong> {cliente.telefone}</p>

                        <hr className="my-3" />

                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h4 className="fs-3 fw-bold m-0">Endereço de Entrega</h4>
                        </div>
                        <p className="mb-1 fs-5">{cliente.logradouro}, Nº {cliente.numero}</p>
                        <p className="mb-1 fs-5">{cliente.bairro} - {cliente.cidade}/{cliente.estado}</p>
                        <p className="mb-1 fs-5"><strong>CEP:</strong> {cliente.cep}</p>
                        <p className="mb-0 fs-5 mt-2"><strong>Frete:</strong> {frete.nome} ({frete.prazo})</p>
                    </div>

                    <div className="border-grey p-4 mb-4">
                        <h4 className="mb-4 fs-3 fw-bold">Pagamento: {cliente.formaPagamento === 'pix' ? 'PIX' : 'Cartão de Crédito'}</h4>

                        {/* ESTADO DE PROCESSAMENTO (LOADING) */}
                        {isProcessing ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-dark mb-3" role="status"></div>
                                <h4>Comunicando com o Gateway de Pagamento...</h4>
                                <p className="text-muted">Aguarde um momento.</p>
                            </div>
                        ) : cliente.formaPagamento === 'pix' ? (
                            /* SE O PIX JÁ FOI GERADO */
                            pixGerado ? (
                                <div className="text-center py-3">
                                    <h4 className="text-success fw-bold mb-3">PIX Gerado com Sucesso!</h4>
                                    <p className="fs-5 mb-3">Escaneie o QR Code ou copie o código abaixo para pagar no app do seu banco:</p>
                                    
                                    <div className="p-3 bg-light border-grey d-inline-block rounded mb-3 w-100 text-break">
                                        <code>00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000520400005303986540510.005802BR</code>
                                    </div>

                                    <button 
                                        type="button"
                                        className="btn btn-outline-dark mb-4 fw-bold text-uppercase"
                                        onClick={() => alert('Código PIX copiado!')}
                                    >
                                        Copiar Código PIX
                                    </button>

                                    <div className="alert alert-warning fs-6">
                                        <span className="spinner-grow spinner-grow-sm me-2" role="status"></span>
                                        Aguardando confirmação do pagamento pelo banco...
                                    </div>

                                    {/* BOTÃO DE SIMULAÇÃO DE APROVAÇÃO PIX DO BANCO */}
                                    <button
                                        type="button"
                                        onClick={concluirEIrParaConfirmacao}
                                        className="btn btn-success btn-sm mt-2 fw-bold"
                                    >
                                        🧪 [DEV TEST]: Simular Pagamento Aprovado no Banco
                                    </button>
                                </div>
                            ) : (
                                /* TELA INICIAL DO PIX ANTES DE GERAR */
                                <div className="text-center py-3">
                                    <p className="fs-5 mb-3">Clique no botão ao lado para gerar o QR Code do PIX. O código terá validade de 30 minutos.</p>
                                    <p className="text-success fw-bold fs-5 mb-0">Aprovação imediata após a transferência!</p>
                                </div>
                            )
                        ) : (
                            /* FORMULÁRIO DO CARTÃO DE CRÉDITO */
                            <div className="row g-3">
                                <div className="col-12">
                                    <label className="form-label fs-5">Número do Cartão</label>
                                    <input
                                        type="text"
                                        className="form-control fs-5 border-grey rounded-0"
                                        name="numero"
                                        placeholder="0000 0000 0000 0000"
                                        maxLength="19"
                                        value={cartaoInfo.numero}
                                        onChange={handleCartaoChange}
                                        required
                                    />
                                </div>
                                <div className="col-12">
                                    <label className="form-label fs-5">Nome impresso no Cartão</label>
                                    <input
                                        type="text"
                                        className="form-control fs-5 border-grey rounded-0 text-uppercase"
                                        name="nomeTitular"
                                        value={cartaoInfo.nomeTitular}
                                        onChange={handleCartaoChange}
                                        required
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fs-5">Validade (MM/AA)</label>
                                    <input
                                        type="text"
                                        className="form-control fs-5 border-grey rounded-0"
                                        name="validade"
                                        placeholder="MM/AA"
                                        maxLength="5"
                                        value={cartaoInfo.validade}
                                        onChange={handleCartaoChange}
                                        required
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fs-5">CVV</label>
                                    <input
                                        type="text"
                                        className="form-control fs-5 border-grey rounded-0"
                                        name="cvv"
                                        placeholder="123"
                                        maxLength="4"
                                        value={cartaoInfo.cvv}
                                        onChange={handleCartaoChange}
                                        required
                                    />
                                </div>
                                <div className="col-12">
                                    <label className="form-label fs-5">Parcelamento</label>
                                    <select
                                        className="form-select fs-5 border-grey rounded-0"
                                        name="parcelas"
                                        value={cartaoInfo.parcelas}
                                        onChange={handleCartaoChange}
                                    >
                                        <option value="1">1x de R$ {totalGeral.toFixed(2)} sem juros</option>
                                        <option value="2">2x de R$ {(totalGeral / 2).toFixed(2)} sem juros</option>
                                        <option value="3">3x de R$ {(totalGeral / 3).toFixed(2)} sem juros</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="col-lg-5">
                    <div className="border-grey p-4 position-sticky" style={{ top: '20px' }}>
                        <h4 className="mb-3 fs-3 fw-bold">Total do Pedido</h4>

                        <div className="border-top pt-3 mb-3 fs-5">
                            <div className="d-flex justify-content-between mb-2">
                                <span>Subtotal:</span>
                                <span>R$ {subtotal.toFixed(2)}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Frete ({frete.nome}):</span>
                                <span>R$ {frete.valor.toFixed(2)}</span>
                            </div>
                            {cliente.cupom && (
                                <div className="d-flex justify-content-between mb-2 text-success">
                                    <span>Cupom aplicado:</span>
                                    <span>{cliente.cupom.toUpperCase()}</span>
                                </div>
                            )}
                        </div>

                        <div className="d-flex justify-content-between fs-3 fw-bold mb-4 border-top pt-3">
                            <span>Total Final:</span>
                            <span>R$ {totalGeral.toFixed(2)}</span>
                        </div>

                        {/* OCULTA O BOTÃO PRINCIPAL CASO O PIX JÁ TENHA SIDO GERADO */}
                        {!pixGerado && (
                            <button
                                type="button"
                                onClick={handleFinalizarCompra}
                                disabled={isProcessing}
                                className="button-1 w-100 py-3 fw-bold text-uppercase"
                            >
                                {cliente.formaPagamento === 'pix' ? 'Gerar PIX e Concluir' : 'Pagar com Cartão'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Payment;