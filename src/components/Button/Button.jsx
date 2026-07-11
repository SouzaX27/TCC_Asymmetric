import { Button as BootstrapButton } from 'react-bootstrap';
import './Button.css';

// Usamos as propriedades (props) para receber o texto (children) e ações (onClick)
function Button({ children, onClick, className = '', ...props }) {
    return (
        <BootstrapButton 
            // Mistura as classes padrão do seu botão com as classes utilitárias que você passar no futuro
            className={`d-block mx-auto px-5 py-2 mt-5 ${className}`}
            style={{ 
                borderRadius: '0px',
            }}
            onClick={onClick}
            {...props} // Caso precise passar disabled, type, etc.
        >
            <span className="fw-semibold fs-5">
                {children}
            </span>
        </BootstrapButton>
    );
}

export default Button;