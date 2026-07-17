// key: 1d076ca9-b260-4364-95e2-b5d567ae3eb2

// import { Container, Row, Col } from 'react-bootstrap';
// import Button from '../../components/Button/Button'

// function Contact() {
//     return (
//         <div className="contact-page animate-fade-in">

//             <h2 className="fs-1 fw-bold my-4 text-center tracking-wide">Contato</h2>

//             <Container className="mb-5">
//                 <Row className="g-4">
                    
//                 </Row>
//             </Container>

//         </div>
//     );
// }

// export default Contact;

////////////////////////////////////////////

import { useState } from 'react';
import { Container, Row, Col, Form } from 'react-bootstrap';
import Button from '../../components/Button/Button';

function Contact() {
    // Estados para gerenciar o envio da API
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitSuccess(null);
        
        // Captura os dados do formulário automaticamente
        const formData = new FormData(e.target);
        
        // 🛠️ COLE AQUI A SUA ACCESS KEY QUE O SITE GEROU:
        formData.append("access_key", "SUA_CHAVE_WEB3FORMS_AQUI");

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
            <h2 className="fs-1 fw-bold my-4 text-center tracking-wide " >
                Contato
            </h2>

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
                                    <Form.Label className="text-uppercase fw-semibold text-secondary small">Nome</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        name="name" 
                                        required 
                                        className="rounded-0 border-dark py-2"
                                    />
                                </Col>
                                <Col xs={12} md={6} className="mb-3">
                                    <Form.Label className="text-uppercase fw-semibold text-secondary small">E-mail</Form.Label>
                                    <Form.Control 
                                        type="email" 
                                        name="email" 
                                        required 
                                        className="rounded-0 border-dark py-2"
                                    />
                                </Col>
                            </Row>

                            <Form.Group className="mb-3">
                                <Form.Label className="text-uppercase fw-semibold text-secondary small">Assunto</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    name="subject" 
                                    required 
                                    className="rounded-0 border-dark py-2"
                                />
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label className="text-uppercase fw-semibold text-secondary small">Mensagem</Form.Label>
                                <Form.Control 
                                    as="textarea" 
                                    rows={5} 
                                    name="message" 
                                    required 
                                    className="rounded-0 border-dark"
                                />
                            </Form.Group>

                            {/* Usando o seu componente de botão customizado */}
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="btn btn-dark rounded-0 text-uppercase w-100 py-2 fw-bold" 
                                style={{ letterSpacing: '2px' }}
                            >
                                {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
                            </button>
                        </Form>
                    </Col>

                    {/* COLUNA 2: Informações de Atendimento (Garante que a linha não fique vazia) */}
                    <Col xs={12} lg={5} className="ps-lg-5 d-flex flex-column justify-content-center">
                        <div className="mb-4">
                            <h4 className="h6 text-uppercase fw-bold text-dark mb-1" style={{ letterSpacing: '1px' }}>Atendimento Direto</h4>
                            <p className="text-secondary mb-0">suporte.asymmetric@gmail.com</p>
                            <p className="text-secondary">+55 (67) 99999-9999</p>
                        </div>

                        <div className="mb-4">
                            <h4 className="h6 text-uppercase fw-bold text-dark mb-1" style={{ letterSpacing: '1px' }}>Horário</h4>
                            <p className="text-secondary mb-0">Segunda a Sexta: 09h às 18h</p>
                        </div>

                        <hr className="border-dark my-2" />

                        <div className="mt-2">
                            <h4 className="h6 text-uppercase fw-bold text-dark mb-1" style={{ letterSpacing: '1px' }}>Redes Sociais</h4>
                            <p className="text-secondary">@asymmetric_gang</p>
                        </div>
                    </Col>

                </Row>
            </Container>
        </div>
    );
}

export default Contact;
