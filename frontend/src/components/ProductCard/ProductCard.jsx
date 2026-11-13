import React from 'react';
import { Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getMediaUrl } from '../../services/api';
import './ProductCard.css';

function ProductCard({ produto }) {
    const formatarPreco = (valor) => {
        return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const imagemPrincipal = produto.imagens && produto.imagens.length > 0 ? produto.imagens.find(img => !img.medidas) || produto.imagens[0] : null;
    const imagemSrc = imagemPrincipal && imagemPrincipal.imagem ? imagemPrincipal.imagem : '';

    return (
        <Link to={`/produtos/${produto.slug}`} className="text-decoration-none text-dark card-link-container">
            <Card className="product-card" style={{ width: '100%' }}>
                <Card.Img 
                    className="product-image" 
                    variant="top" 
                    src={getMediaUrl(imagemSrc)}
                    alt={produto.nome} 
                />
                <Card.Body className="px-0 mx-3">
                    <Card.Title className="fw-bold fs-4 m-0">{produto.nome}</Card.Title>
                    <Card.Text className="fs-4 mt-2">{formatarPreco(produto.preco)}</Card.Text>
                </Card.Body>
            </Card>
        </Link>
    );
}

export default ProductCard;