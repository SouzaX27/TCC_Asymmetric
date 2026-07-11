// Importando os componentes de Card da biblioteca
import { Card } from 'react-bootstrap';
import './ProductCard.css';

function ProductCard({ produto }) {

    const formatarPreco = (valor) => {
        return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    return (
        <Card className="card-produto" style={{ width: '100%' }} > 
            <Card.Img variant="top" src={produto.imagem} alt={produto.nome} />
            
            <Card.Body className="px-0 mx-3"> 
                <Card.Title className="fw-bold fs-4 m-0">{produto.nome}</Card.Title>
                <Card.Text className="fs-4 mt-2">{formatarPreco(produto.preco)}</Card.Text>
            </Card.Body>
        </Card>
    );
};

export default ProductCard;