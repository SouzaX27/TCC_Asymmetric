import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import ProductCard from '../../components/ProductCard/ProductCard';
import Button from '../../components/Button/Button';
import api from '../../services/api';

function Products() {
    const [produtos, setProdutos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('produtos/')
            .then(response => {
                setProdutos(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Erro ao carregar produtos:", error);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <Container className="py-5 text-center my-5">
                <Spinner animation="border" variant="dark" />
                <p className="text-muted mt-3">Carregando catálogo...</p>
            </Container>
        );
    }

    return (
        <div className="products-page animate-fade-in">
            <h2 className="fs-1 fw-bold my-4 text-center text-black tracking-wide">Produtos</h2>
            
            <Container className="mb-5">
                <Row className="g-4">
                    {produtos.length > 0 ? (
                        produtos.map((item) => (
                            <Col key={item.id_produto} xs={12} md={6} className="d-flex justify-content-center">
                                <ProductCard produto={item} />
                            </Col>
                        ))
                    ) : (
                        <Col className="text-center py-5">
                            <p className="text-muted">Nenhum produto cadastrado no momento.</p>
                        </Col>
                    )}
                </Row>
            </Container>
        </div>
    );
}

export default Products;