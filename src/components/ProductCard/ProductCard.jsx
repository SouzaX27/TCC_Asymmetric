// Importando os componentes de Card da biblioteca
import { Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './ProductCard.css';

function ProductCard({ produto }) {

    const formatarPreco = (valor) => {
        return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    return (
        <Link to={`/produto/${produto.id}`} className="text-decoration-none text-dark card-link-container">
        <Card className="product-card" style={{ width: '100%' }} > 
            <Card.Img className='product-image' variant="top" src={produto.imagem} alt={produto.nome} />
            
            <Card.Body className="px-0 mx-3"> 
                <Card.Title className="fw-bold fs-4 m-0">{produto.nome}</Card.Title>
                <Card.Text className="fs-4 mt-2">{formatarPreco(produto.preco)}</Card.Text>
            </Card.Body>
        </Card>
        </Link>
    );
};

export default ProductCard;