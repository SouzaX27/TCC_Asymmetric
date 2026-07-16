import { Container, Row, Col, Nav } from 'react-bootstrap';
import './Footer.css';

import instagramIcon from '../../assets/images/instagram.svg';
import tiktokIcon from '../../assets/images/tiktok.svg';
import logoIcon from '../../assets/images/logo.svg';

function Footer() {
    return (
        <footer className="bg-black text-light mt-4 py-5">
            <Container>
                
                <Row className="gy-4 mb-4">

                    <Col xs={12} md={6}>
                        <h5 className="text-white mb-3 fs-3 fw-bold">Central de Atendimento</h5>
                        <Nav className="flex-column">
                            <Nav.Item className="mb-2">
                                <Nav.Link href="#" className="p-0 fs-5 text-secondary hover-light">Trocas e Devoluções</Nav.Link>
                            </Nav.Item>
                            <Nav.Item className="mb-2">
                                <Nav.Link href="#" className="p-0 fs-5 text-secondary hover-light">Entre em Contato</Nav.Link>
                            </Nav.Item>
                            <Nav.Item className="mb-2">
                                <Nav.Link href="#" className="p-0 fs-5 text-secondary hover-light">Termos de Uso e Política de Privacidade</Nav.Link>
                            </Nav.Item>
                        </Nav>
                    </Col>

                    <Col xs={12} md={6}>
                        <h5 className="text-white mb-3 fs-3 fw-bold">Siga-nos em nossas redes</h5>
                        <Nav className="flex-column">
                            <Nav.Item className="mb-3">
                                <Nav.Link href="https://instagram.com/asymmetric_gang" className="p-0 fs-5 text-secondary hover-light d-flex align-items-center">
                                    <img src={instagramIcon} className="rede-social me-2" alt="Instagram" style={{ height: '1.75rem' }} /> 
                                    asymmetric_gang
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item className="mb-2">
                                <Nav.Link href="#" className="p-0 fs-5 text-secondary hover-light d-flex align-items-center">
                                    <img src={tiktokIcon} className="rede-social me-2" alt="TikTok" style={{ height: '1.75rem' }} /> 
                                    asymmetric_gang
                                </Nav.Link>
                            </Nav.Item>
                        </Nav>
                    </Col>

                </Row>

                <hr className="border-secondary my-4" />

                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3">
                    <p className="text-secondary small mb-0 d-flex align-items-center gap-2">
                        &copy; 2026 AsymmetricGang 
                        <img src={logoIcon} alt="Logo" style={{ height: '0.75rem', filter: 'invert(45%)' }} /> 
                        Todos os direitos reservados.
                    </p>
                </div>

            </Container>
        </footer>
    );
}

export default Footer;