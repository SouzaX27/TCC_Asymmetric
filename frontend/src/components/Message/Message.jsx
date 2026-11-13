import { CloseButton } from 'react-bootstrap';
import './Message.css';

function Message({ tipo = 'sucesso', texto, className = '', onClose }) {
    if (!texto) return null;

    const variantes = {
        sucesso: 'message-success',
        aviso: 'message-warning',
        erro: 'message-error'
    };
    const role = tipo === 'erro' ? 'alert' : 'status';

    return (
        <div className={`message-inline ${variantes[tipo] || variantes.erro} ${className}`} role={role} aria-live="polite">
            <span>{texto}</span>
            {onClose && <CloseButton aria-label="Fechar mensagem" onClick={onClose} />}
        </div>
    );
}

export default Message;