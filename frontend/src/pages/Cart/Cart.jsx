// src/pages/Cart/Cart.jsx
import { Container, Row, Col, ListGroup, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import Button from '../../components/Button/Button';
import { getMediaUrl } from '../../services/api';

function Cart() {
    const { cart, removeFromCart, increaseQuantity, decreaseQuantity, cartTotal } = useCart();

    // Se o carrinho estiver vazio, exibe uma tela amigável para o usuário voltar à loja
    if (cart.length === 0) {
        return (
            <Container className="py-5 text-center d-flex flex-column align-items-center justify-content-center mt-5">
                <h2 className="fw-bold text-uppercase mb-3">Seu carrinho está vazio</h2>
                <p className="text-muted mb-4">Que tal dar uma olhada nos nossos produtos?</p>
                <Link to="/produtos" className="button-1 text-uppercase px-4 py-3 fw-bold">
                    Ver Produtos
                </Link>
            </Container>
        );
    }

    return (
        <Container className="py-5 min-vh-100 cart-page">
            <h1 className="fw-bold text-black text-uppercase mb-4 border-bottom pb-3">Seu Carrinho</h1>

            <Row className="g-4">
                {/* COLUNA ESQUERDA: LISTA DE PRODUTOS NO CARRINHO */}
                <Col lg={8}>
                    <ListGroup variant="flush" className="border-bottom border-top">
                        {cart.map((item) => (
                            <ListGroup.Item key={`${item.id_variacao || item.id}-${item.tamanho}`} className="py-4 px-0">
                                <Row className="align-items-center gy-3">
                                    {/* Imagem do Produto */}
                                    <Col xs={4} sm={2}>
                                        <img
                                            src={getMediaUrl(item.imagem || item.imagens?.[0]?.imagem || item.imagens?.[0]?.url || item.imagens?.[0] || '')}
                                            alt={item.nome}
                                            className="img-fluid ms-2 rounded"
                                            style={{ objectFit: 'cover', maxHeight: '90px', width: '70px' }}
                                        />
                                    </Col>

                                    {/* Detalhes (Nome, Tamanho e Controles de Qtd - e +) */}
                                    <Col xs={8} sm={4}>
                                        <h5 className="fw-bold text-uppercase mb-1 fs-6">{item.nome}</h5>
                                        <p className="text-muted small mb-2">
                                            Tamanho: <span className="fw-semibold text-dark">{item.tamanho}</span>
                                        </p>
                                        
                                        {/* Botões de Aumentar e Diminuir Quantidade */}
                                        <div className="d-flex align-items-center">
                                            <span className="text-muted small me-2">Qtd:</span>
                                            <div className="d-flex align-items-center border overflow-hidden">
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-light px-2 py-0 border-0 rounded-0"
                                                    onClick={() => decreaseQuantity(item.id_variacao || item.id, item.tamanho)}
                                                >
                                                    -
                                                </button>
                                                <span className="px-3 small fw-semibold">{item.quantidade}</span>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-light px-2 py-0 border-0 rounded-0"
                                                    onClick={() => increaseQuantity(item.id_variacao || item.id, item.tamanho)}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    </Col>

                                    {/* Preço total do item (Preço x Quantidade) */}
                                    <Col xs={6} sm={3} className="text-sm-center">
                                        <span className="fw-semibold ms-3">
                                            {(item.preco * item.quantidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </span>
                                    </Col>

                                    {/* Ação de Remover */}
                                    <Col xs={6} sm={3} className="text-end">
                                        <button
                                            type="button"
                                            className="button-2 me-3 text-uppercase small fw-bold tracking-wider"
                                            onClick={() => removeFromCart(item.id_variacao || item.id, item.tamanho)}
                                        >
                                            Remover
                                        </button>
                                    </Col>
                                </Row>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                </Col>

                {/* COLUNA DIREITA: RESUMO DO PEDIDO */}
                <Col lg={4}>
                    <Card className="border-grey p-4 bg-light shadow-sm summary-card">
                        <h3 className="fw-bold text-uppercase mb-4 fs-5">Resumo do Pedido</h3>

                        <div className="d-flex justify-content-between mb-2 text-muted">
                            <span>Subtotal</span>
                            <span>{cartTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>

                        <div className="d-flex justify-content-between mb-3 text-muted">
                            <span>Entrega</span>
                            <span className="small text-uppercase fw-semibold text-success">Calculado no checkout</span>
                        </div>

                        <hr className="my-3" />

                        <div className="d-flex justify-content-between mb-4 fs-5 fw-bold text-uppercase">
                            <span>Total</span>
                            <span>{cartTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>

                        <Button to="/checkout" className="button-1 w-100 py-3 text-uppercase fw-bold tracking-wider text-center">
                            Prosseguir
                        </Button>

                        <Link to="/produtos" className="d-block text-center mt-3 text-muted fs-5 text-decoration-none hover-underline">
                            Continuar Comprando
                        </Link>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default Cart;