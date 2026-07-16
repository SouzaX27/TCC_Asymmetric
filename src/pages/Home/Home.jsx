import { Container, Row, Col } from 'react-bootstrap';
import { productsMock } from "../../mock/productsMock";
import ProductCard from '../../components/ProductCard/ProductCard';
import Button from '../../components/Button/Button'
import homeVideo from '../../assets/video/video.mp4';

function Home() {

    const limitProducts = 4;

    return (
        <div className="home-page animate-fade-in">

            <h2 className="fs-1 fw-bold my-4 text-center tracking-wide">Bem-Vindo</h2>


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
                    {productsMock.slice(0, limitProducts).map((item) => (
                        <Col key={item.id} xs={12} md={6} className="d-flex justify-content-center">
                            <ProductCard produto={item} />
                        </Col>
                    ))}
                </Row>
            </Container>
            
            <div className="text-center">
            <Button to="/produtos" className='button-vermais mb-5'>
                Ver Mais
            </Button>
            </div>

        </div>
    );
}

export default Home;