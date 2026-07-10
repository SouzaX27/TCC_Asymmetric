// src/components/Navbar/Navbar.jsx
import './Navbar.css';

// Importando as imagens corretamente para o React
import menuIcon from '../../assets/images/menu.svg';
import logoAsymmetric from '../../assets/images/logo.svg';
import cartIcon from '../../assets/images/cart.svg';

function Navbar() {
    return (
        // Removido o 'navbar-expand-lg' para travar o comportamento em qualquer resolução
        <nav className="navbar navbar-light bg-white  py-3">
            <div className="container-fluid d-flex justify-content-between align-items-center px-4">

                <button
                    className="navbar-toggler border-0 p-0"
                    type="button"
                    aria-label="Abrir menu"
                >

                    <img
                        src={menuIcon}
                        alt="Menu"
                        style={{ height: '24px', width: 'auto' }} // Ajuste o tamanho para casar com o carrinho
                    />
                </button>

                <a className="navbar-brand m-0 p-0" href="/home">
                    <img className='logo'
                        src={logoAsymmetric}
                        alt="ASYMMETRIC"
                        style={{ height: '32px', width: 'auto' }}
                    />
                </a>

                <a className="nav-link p-0" href="/carrinho">
                    <img
                        src={cartIcon}
                        alt="Carrinho"
                        style={{ height: '28px', width: 'auto' }}
                    />
                </a>

            </div>
        </nav>
    );
}

export default Navbar;