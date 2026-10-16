import { Modal as BootstrapModal } from 'react-bootstrap';
import './Modal.css';

function Modal({
    show,
    onClose,
    title,
    children,
    closeLabel = 'Fechar',
    size = 'md'
}) {
    return (
        <BootstrapModal
            show={show}
            onHide={onClose}
            centered
            size={size}
            className="site-modal"
            aria-labelledby="site-modal-title"
        >
            <BootstrapModal.Header closeButton>
                <BootstrapModal.Title id="site-modal-title" className="fw-bold text-uppercase">
                    {title}
                </BootstrapModal.Title>
            </BootstrapModal.Header>
            <BootstrapModal.Body>{children}</BootstrapModal.Body>
            <BootstrapModal.Footer>
                <button type="button" className="button-2 px-4 py-2 fw-bold text-uppercase" onClick={onClose}>
                    {closeLabel}
                </button>
            </BootstrapModal.Footer>
        </BootstrapModal>
    );
}

export default Modal;