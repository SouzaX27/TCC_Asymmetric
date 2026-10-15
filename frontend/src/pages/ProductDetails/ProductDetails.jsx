import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Alert, Carousel, Spinner } from 'react-bootstrap';
import ProductCard from '../../components/ProductCard/ProductCard';
import Button from '../../components/Button/Button';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import './ProductDetails.css';

function ProductDetails() {
    const { slug } = useParams();
    const { addToCart } = useCart();

    const [produtoData, setProdutoData] = useState(null);
    const [outrosProdutos, setOutrosProdutos] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedSize, setSelectedSize] = useState('');
    const [cartMessage, setCartMessage] = useState(false);

    const getImageUrl = (img) => {
        if (!img) return '';
        if (img.startsWith('http')) return img;
        return `http://localhost:8000${img}`;
    };

    useEffect(() => {
        setCartMessage(false);
        setSelectedSize('');
        window.scrollTo(0, 0);

        setLoading(true);

        api.get(`produtos/${slug}/`)
            .then(response => {
                setProdutoData(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Erro ao carregar detalhes do produto:", error);
                setProdutoData(null);
                setLoading(false);
            });

        api.get('produtos/')
            .then(response => {
                const filtrados = response.data.filter(item => item.slug !== slug);
                setOutrosProdutos(filtrados.slice(0, 6));
            })
            .catch(error => {
                console.error("Erro ao carregar outros produtos:", error);
            });
    }, [slug]);

    if (loading) {
        return (
            <Container className="py-5 text-center my-5">
                <Spinner animation="border" variant="dark" />
                <p className="text-muted mt-3">Carregando produto...</p>
            </Container>
        );
    }

    if (!produtoData) {
        return (
            <Container className="py-5 text-center my-5">
                <h2 className="fw-bold mb-3">PRODUTO NÃO ENCONTRADO</h2>
                <p className="text-muted mb-5">O produto que você está procurando não existe ou foi removido.</p>
                <Link to="/produtos" className="button-1 text-uppercase px-4 py-3 fw-bold">
                    Voltar para a Loja
                </Link>
            </Container>
        );
    }

    const imagensList = produtoData.imagens 
    ? [...produtoData.imagens].sort((a, b) => (a.medidas === b.medidas ? 0 : a.medidas ? 1 : -1))
    : [];

    const handleAddToCart = () => {
        if (!selectedSize && produtoData.variacoes && produtoData.variacoes.length > 0) {
            alert("Por favor, selecione um tamanho antes de adicionar à sacola.");
            return;
        }

        addToCart(produtoData, selectedSize);
        setCartMessage(true);
        setSelectedSize('');
    };

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
                            {imagensList.map((imgObj, index) => (
                                <Carousel.Item key={imgObj.id_imagem || index}>
                                    <img
                                        src={getImageUrl(imgObj.imagem)}
                                        alt={imgObj.medidas ? "Tabela de Medidas" : `${produtoData.nome} Foto ${index + 1}`}
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
                            {Number(produtoData.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </h3>

                        <div className="product-sizes mb-5">
                            <h5 className="fw-bold text-uppercase text-grey fs-5 mb-3">Tamanho</h5>
                            <div className="d-flex flex-wrap gap-2">
                                {produtoData.variacoes && produtoData.variacoes.map((variacao) => {
                                    const isEsgotado = variacao.estoque_atual <= 0;

                                    return (
                                        <button
                                            key={variacao.id_variacao}
                                            type="button"
                                            disabled={isEsgotado}
                                            className={`button-2 fs-5 flex-fill py-1 size-btn fw-semibold 
                                                ${selectedSize === variacao.tamanho ? 'active-size' : ''} 
                                                ${isEsgotado ? 'opacity-50 text-muted bg-light border-0' : ''}`}
                                            onClick={() => !isEsgotado && setSelectedSize(variacao.tamanho)}
                                        >
                                            {variacao.tamanho} {isEsgotado && <span className="small d-block">(Esgotado)</span>}
                                        </button>
                                    );
                                })}
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
                            <Button to="/carrinho" className="w-100 button-2 mt-2 py-3 text-uppercase fw-bold">
                                Ver Carrinho
                            </Button>
                        </div>

                        <hr className="my-5 border-grey"/>

                        <div className="product-description mb-4">
                            <h5 className="fw-bold text-uppercase text-grey fs-5 mb-2">Descrição</h5>
                            <p className="text-grey leading-relaxed">{produtoData.descricao}</p>
                        </div>
                    </div>
                </Col>
            </Row>

            <div className="related-products-section mt-5 pt-5 border-top">
                <h3 className="fw-bold mb-4 tracking-wider fs-4">
                    Outros Produtos
                </h3>

                <div className="swipe-carousel d-flex gap-3 overflow-auto pb-3">
                    {outrosProdutos.map((item) => (
                        <div key={item.id_produto || item.slug} className="swipe-card-wrapper" style={{ minWidth: '250px' }}>
                            <ProductCard produto={item} />
                        </div>
                    ))}
                </div>
            </div>
        </Container>
    );
}

export default ProductDetails;