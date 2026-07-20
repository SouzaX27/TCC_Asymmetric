import { useState } from 'react';
import { useParams, Link } from 'react-router-dom'; // 1. Importamos o useParams para ler a URL
import { Container, Row, Col, Alert, Carousel, Card } from 'react-bootstrap';
import ProductCard from '../../components/ProductCard/ProductCard';
import Button from '../../components/Button/Button';
import { productsMock } from '../../mock/productsMock';

import { useCart } from '../../context/CartContext';

import './ProductDetails.css';


function ProductDetails() {

    const { id } = useParams();
    const { addToCart } = useCart();
    const produtoData = productsMock.find(item => (item.id) == id);

    const [selectedSize, setSelectedSize] = useState('');
    const [cartMessage, setCartMessage] = useState(false);
    const [activeImage, setActiveImage] = useState(produtoData?.imagem?.[0] || '');

    if (!produtoData) {
        return (
            <Container className="py-5 text-center">
                <h2 className="fw-bold mb-3">PRODUTO NÃO ENCONTRADO</h2>
                <p className="text-muted mb-4">O produto que você está procurando não existe ou foi removido.</p>
                <Link to="/produtos" className="btn btn-dark rounded-0 button-1 text-uppercase px-4 py-2">
                    Voltar para a Loja
                </Link>
            </Container>
        );
    }

    const handleAddToCart = () => {
        if (!selectedSize) {
            alert("Por favor, selecione um tamanho antes de adicionar à sacola.");
            return;
        }

        addToCart(produtoData, selectedSize);

        setCartMessage(true);

        setSelectedSize('');
    };

    const outrosProdutos = productsMock
        .filter(item => String(item.id) !== String(id))
        .slice(0, 6);

    return (

        <Container className="product-details-page mt-4 py-5">
            <Row className="gy-4 mb-5">
                <Col lg={7} md={12}>
                    <div className="product-gallery">

                        <Carousel
                            variant="dark"
                            indicators={true}
                            interval={null}
                            className="main-image-carousel py-5 px-4 border-grey"
                        >
                            {produtoData.imagem.map((img, index) => (
                                <Carousel.Item key={index}>
                                    <img
                                        src={img}
                                        alt={`${produtoData.nome} - Foto ${index + 1}`}
                                        className="d-block w-100 img-fluid product-carousel-img"
                                    />
                                </Carousel.Item>
                            ))}
                        </Carousel>
                    </div>
                </Col>

                <Col lg={5} md={12} className="ps-lg-5 d-flex flex-column justify-content-between">
                    <div>
                        <h1 className="fw-bold text-black text-uppercase mb-2 fs-2">{produtoData.nome}</h1>
                        <h3 className="fw-semibold text-black mb-3">
                            {produtoData.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </h3>

                        <div className="product-sizes mb-5">
                            <h5 className="fw-bold text-uppercase text-grey fs-5 mb-3">Tamanho</h5>
                            <div className="d-flex flex-wrap gap-2 ">
                                {produtoData.tamanhos.map((size) => (
                                    <button
                                        key={size}
                                        type="button"
                                        className={`button-2 fs-5 flex-fill py-1 size-btn fw-semibold ${selectedSize === size ? 'active-size' : ''}`}
                                        onClick={() => setSelectedSize(size)}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="action-zone mt-auto">
                            {cartMessage && (
                                <Alert variant="success" className='rounded-0' onClose={() => setCartMessage(false)} dismissible>
                                    Adicionado ao carrinho!
                                </Alert>
                            )}

                            <Button onClick={handleAddToCart} className="w-100 button-1 py-3 text-uppercase fw-bold">
                                Adicionar ao Carrinho
                            </Button>
                        </div>

                        <hr className="my-5 border-grey" />

                        <div className="product-description mb-4">
                            <h5 className="fw-bold text-uppercase text-grey fs-5 mb-2">Descrição</h5>
                            <p className="text-grey leading-relaxed ">{produtoData.descricao}</p>
                        </div>

                    </div>


                </Col>

            </Row>

            <div className="related-products-section mt-5 pt-5 border-top">
                <h3 className="fw-bold  mb-4 tracking-wider fs-4">
                    Outros Produtos
                </h3>

                <div className="swipe-carousel d-flex gap-3">
                    {outrosProdutos.map((item) => (
                        <div key={item.id} className="swipe-card-wrapper">
                            <ProductCard produto={item} />
                        </div>
                    ))}
                </div>
            </div>

        </Container>
    );
}

export default ProductDetails;