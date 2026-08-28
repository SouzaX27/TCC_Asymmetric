import { useState } from 'react';
import { Container, Row, Col, Form } from 'react-bootstrap';
import Button from '../../components/Button/Button';

function Contact() {
    // Estados para gerenciar o envio da API
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(null);
    console.log("Minha chave:", import.meta.env.VITE_WEB3FORMS_KEY);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitSuccess(null);
        
        // Captura os dados do formulário automaticamente
        const formData = new FormData(e.target);
        
        // 🛠️ COLE AQUI A SUA ACCESS KEY QUE O SITE GEROU:
        formData.append("access_key", import.meta.env.VITE_WEB3FORMS_KEY);

        try {
            const response = await fetch("https://api.web3forms.com/submit", {
                method: "POST",
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                setSubmitSuccess(true);
                e.target.reset(); // Limpa os campos após enviar
            } else {
                setSubmitSuccess(false);
            }
        } catch (error) {
            console.error("Erro ao enviar formulário:", error);
            setSubmitSuccess(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="contact-page animate-fade-in">
            <h2 className="fs-1 fw-bold my-4 text-center text-black tracking-wide">Contato</h2>

            <Container className="mb-5">
                <Row className="g-5">
                    
                    {/* COLUNA 1: Formulário de Contato */}
                    <Col xs={12} lg={7}>
                        {submitSuccess === true && (
                            <div className="alert alert-success rounded-0 text-uppercase small mb-4">
                                Mensagem enviada com sucesso! Responderemos em breve.
                            </div>
                        )}
                        {submitSuccess === false && (
                            <div className="alert alert-danger rounded-0 text-uppercase small mb-4">
                                Ops! Algo deu errado. Tente novamente mais tarde.
                            </div>
                        )}

                        <Form onSubmit={handleSubmit}>
                            <Row>
                                <Col xs={12} md={6} className="mb-3">
                                    <Form.Label className=" text-uppercase fw-semibold text-black fs-4">Nome</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        name="name" 
                                        required 
                                        className="fs-5 rounded-0 border-grey py-2"
                                    />
                                </Col>
                                <Col xs={12} md={6} className="mb-3">
                                    <Form.Label className="text-uppercase fw-semibold text-black fs-4">E-mail</Form.Label>
                                    <Form.Control 
                                        type="email" 
                                        name="email" 
                                        required 
                                        className="fs-5 rounded-0 border-grey py-2"
                                    />
                                </Col>
                            </Row>

                            <Form.Group className="mb-3">
                                <Form.Label className="text-uppercase fw-semibold text-black fs-4">Assunto</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    name="subject" 
                                    required 
                                    className="fs-5 rounded-0 border-grey py-2"
                                />
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label className="text-uppercase fw-semibold text-black fs-4">Mensagem</Form.Label>
                                <Form.Control 
                                    as="textarea" 
                                    rows={5} 
                                    name="message" 
                                    required 
                                    className="fs-5 rounded-0 border-grey"
                                />
                            </Form.Group>

                            <Button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="button-enviar rounded-0 text-uppercase w-100 py-2 fw-bold" 
                            >
                                {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
                            </Button>
                        </Form>
                    </Col>

                    {/* COLUNA 2: Informações de Atendimento (Garante que a linha não fique vazia) */}
                    <Col xs={12} lg={5} className="ps-lg-5 d-flex flex-column justify-content-center">
                        <div className="mb-2">
                            <p className="fs-5 text-black text-uppercase fw-bold text-dark mb-1" style={{ letterSpacing: '1px' }}>Atendimento Direto</p>
                            <p className="fs-6 text-grey mb-0">suporte.asymmetric@gmail.com</p>
                            <p className="fs-6 text-grey">+55 (67) 99999-9999</p>
                        </div>

                        <hr className="border-grey my-2" />

                        <div className="mt-2">
                            <p className="fs-5 text-black text-uppercase fw-bold text-dark mb-1" style={{ letterSpacing: '1px' }}>Redes Sociais</p>
                            <p className="fs-6 text-grey">@asymmetric_gang</p>
                        </div>
                    </Col>

                </Row>
            </Container>
        </div>
    );
}

export default Contact;
