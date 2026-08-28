import { Button as BootstrapButton } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './Button.css';

function Button({ children, onClick, className = '', to, ...props }) {
    return (
        <BootstrapButton 
            as={to ? Link : 'button'}
            to={to}
            className={`d-inline-block px-5 py-2 ${className}`}
            style={{ 
                borderRadius: '0px',
            }}
            onClick={onClick}
            {...props}
        >
            <span className="fw-semibold fs-5">
                {children}
            </span>
        </BootstrapButton>
    );
}

export default Button;