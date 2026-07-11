import { useState } from 'react';
import { Navbar as BootstrapNavbar, Offcanvas } from 'react-bootstrap';

import './Navbar.css';

import menuIcon from '../../assets/images/menu.svg';
import logoAsymmetric from '../../assets/images/logo.svg';
import cartIcon from '../../assets/images/cart.svg';

function Navbar() {
    const [showMenu, setShowMenu] = useState(false);

    const handleClose = () => setShowMenu(false);
    const handleShow = () => setShowMenu(true);

    return (
        <>
            <BootstrapNavbar bg="white" className="navbar py-3">
                {/* Esta DIV é a chave. d-flex e justify-content-between vão forçar os 3 filhos nos extremos/centro */}
                <div className="container-fluid d-flex justify-content-between align-items-center px-4">

                    {/* 1º FILHO: Botão do Menu (ESQUERDA) */}
                    {/* Adicionei 'd-flex align-items-center' para alinhar a imagem internamente */}
                    <button
                        className="navbar-toggler border-0 p-0 d-flex align-items-center"
                        type="button"
                        onClick={handleShow}
                        aria-label="Abrir menu"
                    >
                        <img
                            src={menuIcon}
                            alt="Menu"
                            className="nav-icon" // Usei classe CSS em vez de style inline
                        />
                    </button>

                    {/* 2º FILHO: Logo (CENTRO) */}
                    {/* Adicionei 'd-flex justify-content-center' para forçar a logo no meio do seu próprio bloco */}
                    <a className="nav-logo m-0 p-0 d-flex justify-content-center align-items-center" href="/home">
                        <img 
                            className='logo'
                            src={logoAsymmetric}
                            alt="ASYMMETRIC"
                            // Mantive seu style inline para não mudar o tamanho
                            style={{ height: '32px', width: 'auto' }}
                        />
                    </a>

                    {/* 3º FILHO: Carrinho (DIREITA) */}
                    {/* Adicionei 'd-flex justify-content-end' para garantir que ele fique colado no canto direito */}
                    <a className="nav-cart m-0 p-0 d-flex justify-content-end align-items-center" href="/carrinho">
                        <img
                            src={cartIcon}
                            alt="Carrinho"
                            className="cart-icon" // Usei classe CSS
                        />
                    </a>

                </div>
            </BootstrapNavbar>

            {/* O Offcanvas continua fora para não atrapalhar */}
            <Offcanvas show={showMenu} onHide={handleClose} placement="start">
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title id="meuMenuLateralLabel">Menu</Offcanvas.Title>
                </Offcanvas.Header>
                
                <Offcanvas.Body>
                    <ul className="navbar-nav justify-content-end flex-grow-1 pe-3">
                        <li className="nav-item">
                            <a className="nav-link active" href="#inicio" onClick={handleClose}>Início</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link" href="#produtos" onClick={handleClose}>Produtos</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link" href="#contato" onClick={handleClose}>Contato</a>
                        </li>
                    </ul>
                </Offcanvas.Body>
            </Offcanvas>
        </>
    );
}

export default Navbar;