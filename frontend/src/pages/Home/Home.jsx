import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import api from '../../services/api';
import { productsMock } from "../../mock/productsMock";
import ProductCard from '../../components/ProductCard/ProductCard';
import Button from '../../components/Button/Button'
import homeVideo from '../../assets/video/video.mp4';

function Home() {
    const [produtos, setProdutos] = useState([]);
    const limitProducts = 4;

    useEffect(() => {
        api.get('produtos/')
            .then(response => {
                setProdutos(response.data);
            })
            .catch(error => {
                console.error("Erro ao carregar produtos da home:", error);
            });
    }, []);

    return (
        <div className="home-page animate-fade-in">
            <h2 className="fs-1 fw-bold my-4 text-center text-black tracking-wide">Bem-Vindo</h2>

            <section className="hero-section bg-black py-4 mb-5 d-flex align-items-center justify-content-center">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{ width: '60vw', height: 'auto', zIndex: 1 }}
                >
                    <source src={homeVideo} type="video/mp4" />
                </video>
            </section>

            <Container className="mb-5">
                <Row className="g-4 justify-content-center">
                    {produtos.slice(0, limitProducts).map((item) => (
                        <Col key={item.id_produto || item.slug} xs={12} md={6} className="d-flex justify-content-center">
                            <ProductCard produto={item} />
                        </Col>
                    ))}
                </Row>
            </Container>

            <div className="text-center">
                <Button to="/produtos" className="button-vermais mb-5">
                    Ver Mais
                </Button>
            </div>
        </div>
    );
}

export default Home;