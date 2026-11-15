import { useNavigate } from 'react-router-dom';
import Button from '../Button/Button';

function BackButton({ fallbackTo = '/inicio' }) {
    const navigate = useNavigate();

    const handleClick = () => {
        if (window.history.length > 1) {
            navigate(-1);
            return;
        }

        navigate(fallbackTo);
    };

    return (
        <Button
            type="button"
            onClick={handleClick}
            className="button-2 d-inline-block px-4 py-2 fw-bold text-uppercase text-decoration-none"
        >
            Voltar
        </Button>
    );
}

export default BackButton;
