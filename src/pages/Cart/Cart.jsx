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
      <Container className="py-5 text-center d-flex flex-column align-items-center justify-content-center min-vh-100">
        <h2 className="fw-bold text-uppercase mb-3">Seu carrinho está vazio</h2>
        <p className="text-muted mb-4">Que tal dar uma olhada nos nossos últimos lançamentos?</p>
        <Link to="/produtos" className="btn btn-dark text-uppercase px-4 py-3 fw-bold">
          Ver Produtos
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-5 min-vh-100 cart-page">
      <h1 className="fw-bold text-uppercase mb-5 border-bottom pb-3">Seu Carrinho</h1>

      <Row className="gy-4">
        {/* COLUNA ESQUERDA: LISTA DE PRODUTOS NO CARRINHO */}
        <Col lg={8} md={12}>
          <ListGroup variant="flush" className="border-top border-bottom">
            {cart.map((item) => (
              <ListGroup.Item key={`${item.id}-${item.size}`} className="py-4 px-0">
                <Row className="align-items-center gy-3">
                  {/* Imagem do Produto */}
                  <Col xs={4} sm={2}>
                    <img 
                      src={item.imagem?.[0]} 
                      alt={item.nome} 
                      className="img-fluid border-grey" 
                    />
                  </Col>

                  {/* Detalhes (Nome e Tamanho) */}
                  <Col xs={8} sm={4}>
                    <h5 className="fw-bold text-uppercase mb-1 fs-6">{item.nome}</h5>
                    <p className="text-muted small mb-0">Tamanho: <span className="fw-semibold text-dark">{item.size}</span></p>
                    <p className="text-muted small mb-0">Qtd: {item.quantity}</p>
                  </Col>

                  {/* Preço total do item (Preço x Quantidade) */}
                  <Col xs={6} sm={3} className="text-sm-center">
                    <span className="fw-semibold">
                      {(item.preco * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </Col>

                  {/* Ação de Remover */}
                  <Col xs={6} sm={3} className="text-end">
                    <button 
                      type="button" 
                      className="remove-btn text-uppercase small fw-bold tracking-wider"
                      onClick={() => removeFromCart(item.id, item.size)}
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
        <Col lg={4} md={12}>
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
            <Button className="w-100 py-3 text-uppercase fw-bold tracking-wider">
              Fechar Pedido
            </Button>
            
            <Link to="/produtos" className="d-block text-center mt-3 text-muted small text-decoration-none hover-underline">
              Continuar Comprando
            </Link>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Cart;