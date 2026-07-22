// src/pages/Cart/Cart.jsx
import { Container, Row, Col, ListGroup, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import Button from '../../components/Button/Button';
// import './Cart.css';

function Cart() {
    const { cart, removeFromCart, cartTotal } = useCart();

    // Se o carrinho estiver vazio, exibe uma tela amigável para o usuário voltar à loja
    if (cart.length === 0) {
        return (
            <Container className="py-5 text-center d-flex flex-column align-items-center justify-content-center mt-5">
                <h2 className="fw-bold text-uppercase mb-3">Seu carrinho está vazio</h2>
                <p className="text-muted mb-4">Que tal dar uma olhada nos nossos produtos?</p>
                {/* <p className="text-muted mb-4">Que tal dar uma olhada nos nossos últimos lançamentos?</p> */}
                <Link to="/produtos" className="button-1 text-uppercase px-4 py-3 fw-bold">
                    Ver Produtos
                </Link>
            </Container>
        );
    }

    return (
        <Container className="py-5 min-vh-100 cart-page">
            <h1 className="fw-bold text-black text-uppercase mb-2 border-bottom pb-3">Seu Carrinho</h1>

            <Col className="w-100">
                {/* COLUNA ESQUERDA: LISTA DE PRODUTOS NO CARRINHO */}
                <Row>
                    <ListGroup variant="flush" className="border-bottom">
                        {cart.map((item) => (
                            <ListGroup.Item key={`${item.id}-${item.tamanho}`} className="py-4 px-0">
                                <Row className="align-items-center gy-3">
                                    {/* Imagem do Produto */}
                                    <Col xs={4} sm={2}>
                                        <img
                                            src={item.imagem?.[0]}
                                            alt={item.nome}
                                            className="img-fluid ms-2"
                                        />
                                    </Col>

                                    {/* Detalhes (Nome e Tamanho) */}
                                    <Col xs={8} sm={4}>
                                        <h5 className="fw-bold text-uppercase mb-1 fs-6">{item.nome}</h5>
                                        <p className="text-muted small mb-0">Tamanho: <span className="fw-semibold text-dark">{item.tamanho}</span></p>
                                        <p className="text-muted small mb-0">Qtd: <span className="fw-semibold text-dark">{item.quantidade}</span></p>
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
                                            onClick={() => removeFromCart(item.id, item.tamanho)}
                                        >
                                            Remover
                                        </button>
                                    </Col>
                                </Row>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                </Row>


            </Col>

            <Col className='w-100 mt-4'>
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

                    {/* Seu componente de botão customizado */}
                    <Button to="/checkout" className="button-1 w-100 py-3 text-uppercase fw-bold tracking-wider">
                        Prosseguir
                    </Button>

                    <Link to="/produtos" className="d-block text-center mt-3 text-muted fs-5 text-decoration-none hover-underline">
                        Continuar Comprando
                    </Link>
                </Card>
            </Col>

        </Container>
    );
}

export default Cart;