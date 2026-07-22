import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
// import './Checkout.css';

function Checkout() {
    const navigate = useNavigate();
    const { cart, cartTotal, clearCart } = useCart();

    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        telefone: '',
        cep: '',
        logradouro: '',
        numero: '',
        bairro: '',
        cidade: '',
        estado: '',
        cupom: '',
        formaPagamento: 'pix'
    });

    // ESTADOS DO FRETE
    const [opcoesFrete, setOpcoesFrete] = useState([]);
    const [freteSelecionado, setFreteSelecionado] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    // FUNÇÃO QUE SIMULA O CÁLCULO DE FRETE
    const calcularFreteSimulado = (uf) => {
        let baseValor = 18.50;
        if (['SP', 'RJ', 'MG', 'PR'].includes(uf)) {
            baseValor = 14.30;
        } else if (['RS', 'SC', 'GO', 'DF', 'ES'].includes(uf)) {
            baseValor = 22.80;
        } else {
            baseValor = 34.90;
        }

        const opcoes = [
            { id: 'pac', nome: 'Padrão (PAC)', valor: Number((baseValor).toFixed(2)), prazo: '5 a 8 dias úteis' },
            { id: 'sedex', nome: 'Expresso (SEDEX)', valor: Number((baseValor + 11.45).toFixed(2)), prazo: '1 a 3 dias úteis' }
        ];

        setOpcoesFrete(opcoes);
        setFreteSelecionado(opcoes[0]); // Seleciona o PAC automaticamente
    };

    // FUNÇÃO API CEP
    const handleCepBlur = async (e) => {
        const cepLimpo = e.target.value.replace(/\D/g, '');

        if (cepLimpo.length === 8) {
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

                    // Chama a simulação de frete com base no estado retornado
                    calcularFreteSimulado(data.uf);
                } else {
                    alert('CEP não encontrado. Por favor, verifique o número digitado.');
                    setOpcoesFrete([]);
                    setFreteSelecionado(null);
                }
            } catch (error) {
                console.error('Erro ao buscar o CEP:', error);
            }
        }
    };

    const valorFrete = freteSelecionado ? freteSelecionado.valor : 0;
    const totalComFrete = cartTotal + valorFrete;

    const handleSubmit = (e) => {
        e.preventDefault();

        if (cart.length === 0) {
            alert('Seu carrinho está vazio!');
            return;
        }

        if (!freteSelecionado) {
            alert('Por favor, informe um CEP válido para calcular o frete.');
            return;
        }

        // Simulação de finalização do pedido
        console.log('Dados do Pedido:', {
            cliente: formData,
            itens: cart,
            frete: freteSelecionado,
            subtotal: cartTotal,
            totalGeral: totalComFrete
        });

        clearCart();
        alert('Pedido realizado com sucesso!');
        navigate('/inicio');
    };

    return (
        <div className="container my-2 pt-5">
            <h1 className="fw-bold text-black text-uppercase mb-2 pb-3">Finalizar Pedido</h1>

            <form onSubmit={handleSubmit} className="row g-4">
                {/* COLUNA DA ESQUERDA: DADOS E ENDEREÇO */}
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

                        {/* SEÇÃO DE OPÇÕES DE FRETE */}
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
                                        <span className="fw-bold fs-5">R$ {opcao.valor.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* COLUNA DA DIREITA: RESUMO E PAGAMENTO */}
                <div className="col-lg-5">
                    <div className="border-grey p-4">
                        <h4 className="mb-3 fs-3 fw-bold">Resumo do Pedido</h4>
                        <div className="mb-3 border-bottom pb-2">
                            {cart.map((item, index) => (
                                <div key={`${item.id}-${item.tamanho}-${index}`} className="d-flex justify-content-between align-items-center mb-2">
                                    <div>
                                        <span className="fw-semibold">{item.nome}</span>
                                        <br />
                                        <small className="text-muted">Tam: {item.tamanho} | Qtd: {item.quantidade}</small>
                                    </div>
                                    <span>R$ {((item.preco || 0) * item.quantidade).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        {/* CUPOM DE DESCONTO */}
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
                            </div>
                        </div>

                        {/* DETALHAMENTO DE VALORES (SUBTOTAL + FRETE) */}
                        <div className="border-top pt-3 mb-3 fs-5">
                            <div className="d-flex justify-content-between mb-2">
                                <span>Subtotal:</span>
                                <span>R$ {cartTotal.toFixed(2)}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Frete:</span>
                                <span>{freteSelecionado ? `R$ ${valorFrete.toFixed(2)}` : 'Digite o CEP'}</span>
                            </div>
                        </div>

                        {/* FORMA DE PAGAMENTO */}
                        <h4 className="mt-3 mb-3 fs-3 fw-bold">Forma de Pagamento</h4>
                        <div className="mb-4">
                            <div className="form-check mb-2">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    name="formaPagamento"
                                    id="pix"
                                    value="pix"
                                    checked={formData.formaPagamento === 'pix'}
                                    onChange={handleChange}
                                />
                                <label className="form-check-label fs-5" htmlFor="pix">PIX (Aprovação imediata)</label>
                            </div>
                            <div className="form-check mb-2">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    name="formaPagamento"
                                    id="cartao"
                                    value="cartao"
                                    checked={formData.formaPagamento === 'cartao'}
                                    onChange={handleChange}
                                />
                                <label className="form-check-label fs-5" htmlFor="cartao">Cartão de Crédito</label>
                            </div>
                        </div>

                        <div className="d-flex justify-content-between fs-3 fw-bold mb-4 border-top pt-3">
                            <span>Total:</span>
                            <span>R$ {totalComFrete.toFixed(2)}</span>
                        </div>

                        <button type="submit" className="button-1 w-100 py-3 fw-bold text-uppercase">
                            Concluir Pedido
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default Checkout;