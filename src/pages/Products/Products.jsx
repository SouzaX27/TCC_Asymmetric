import { Container, Row, Col } from 'react-bootstrap';
import { productsMock } from "../../mock/productsMock";
import ProductCard from '../../components/ProductCard/ProductCard';
import Button from '../../components/Button/Button'

function Products() {
    return (
        <div className="products-page animate-fade-in">

            <h2 className="fs-1 fw-bold my-4 text-center tracking-wide">Produtos</h2>

            <Container className="mb-5">
                <Row className="g-4">
                    {productsMock.map((item) => (
                        <Col key={item.id} xs={12} md={6} className="d-flex justify-content-center">
                            <ProductCard produto={item} />
                        </Col>
                    ))}
                </Row>
            </Container>

        </div>
    );
}

export default Products;