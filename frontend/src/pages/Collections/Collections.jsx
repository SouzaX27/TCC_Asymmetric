import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import ProductCard from '../../components/ProductCard/ProductCard';
import api from '../../services/api';

function Collection() {
    const { slug } = useParams();

    const [produtos, setProdutos] = useState([]);
    const [nomeColecao, setNomeColecao] = useState('');
    const [descricaoColecao, setDescricaoColecao] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        window.scrollTo(0, 0);

        Promise.all([
            api.get('produtos/'),
            api.get('colecoes/')
        ])
            .then(([produtosRes, colecoesRes]) => {
                const produtosList = produtosRes.data || [];
                const colecoesList = colecoesRes.data || [];

                // 1. Encontra a coleção correspondente ao slug da URL
                const colecaoAtual = colecoesList.find(c => c.slug === slug);

                if (colecaoAtual) {
                    setNomeColecao(colecaoAtual.nome);
                    // Guarda a descrição da coleção (se houver)
                    setDescricaoColecao(colecaoAtual.descricao || '');

                    // 2. Filtra os produtos comparando o ID da coleção
                    const produtosFiltrados = produtosList.filter(item => {
                        if (item.colecao === colecaoAtual.id_colecao || item.colecao_id === colecaoAtual.id_colecao) {
                            return true;
                        }
                        if (item.colecao && typeof item.colecao === 'object') {
                            return item.colecao.id_colecao === colecaoAtual.id_colecao || item.colecao.slug === slug;
                        }
                        if (typeof item.colecao === 'string') {
                            return item.colecao === slug;
                        }
                        return false;
                    });

                    setProdutos(produtosFiltrados);
                } else {
                    setNomeColecao(slug.replace(/-/g, ' ').toUpperCase());
                    setDescricaoColecao('');
                    setProdutos([]);
                }

                setLoading(false);
            })
            .catch(error => {
                console.error("Erro ao carregar dados da coleção:", error);
                setLoading(false);
            });
    }, [slug]);

    if (loading) {
        return (
            <Container className="py-5 text-center my-5">
                <Spinner animation="border" variant="dark" />
                <p className="text-muted mt-3">Carregando coleção...</p>
            </Container>
        );
    }

    return (
        <div className="collection-page animate-fade-in">
            <div className="text-center my-4">
                <h2 className="fs-1 fw-bold text-black tracking-wide mb-2">
                    {nomeColecao}
                </h2>
                
                {descricaoColecao && (
                    <p className="text-muted fs-5 mx-auto" style={{ maxWidth: '600px' }}>
                        {descricaoColecao}
                    </p>
                )}
            </div>
            
            <Container className="mb-5">
                <Row className="g-4">
                    {produtos.length > 0 ? (
                        produtos.map((item) => (
                            <Col key={item.id_produto} xs={12} md={6} className="d-flex justify-content-center">
                                <ProductCard produto={item} />
                            </Col>
                        ))
                    ) : (
                        <Col className="text-center py-5 my-4">
                            <p className="text-muted fs-5 mb-4">Nenhum produto cadastrado nesta coleção no momento.</p>
                            <Link to="/produtos" className="button-1 text-uppercase px-4 py-3 fw-bold">
                                Ver Todos os Produtos
                            </Link>
                        </Col>
                    )}
                </Row>
            </Container>
        </div>
    );
}

export default Collection;