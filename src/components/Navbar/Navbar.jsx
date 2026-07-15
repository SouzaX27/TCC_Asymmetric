import { useState } from 'react';
import { Navbar as BootstrapNavbar, Offcanvas } from 'react-bootstrap';
import { Link } from 'react-router-dom'; 

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
            <BootstrapNavbar bg="white" className="navbar fixed-top py-3">
                <div className="container-fluid d-flex justify-content-between align-items-center px-4">
                    <button
                        className="navbar-toggler border-0 p-0 d-flex align-items-center"
                        type="button"
                        onClick={handleShow}
                        aria-label="Abrir menu"
                    >
                        <img
                            src={menuIcon}
                            alt="Menu"
                            className="nav-icon"
                        />
                    </button>

                    <Link className="nav-logo m-0 p-0 d-flex justify-content-center align-items-center" to="/home">
                        <img 
                            className='logo'
                            src={logoAsymmetric}
                            alt="ASYMMETRIC"
                            style={{ height: '32px', width: 'auto' }}
                        />
                    </Link>

                    <Link className="nav-cart m-0 p-0 d-flex justify-content-end align-items-center" to="/carrinho">
                        <img
                            src={cartIcon}
                            alt="Carrinho"
                            className="cart-icon"
                        />
                    </Link>

                </div>
            </BootstrapNavbar>

            {/* OFFCANVAS */}
            <Offcanvas className='menu' show={showMenu} onHide={handleClose} placement="start">
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title id="menuLabel" className='fs-3'>Menu</Offcanvas.Title>
                </Offcanvas.Header>
                
                <Offcanvas.Body>
                    <ul className="navbar-nav justify-content-end flex-grow-1 pe-3 fs-4">
                        <li className="nav-item">
                            <a className="nav-link" href="#inicio" onClick={handleClose}>Início</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link" href="#produtos" onClick={handleClose}>Produtos</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link" href="#contato" onClick={handleClose}>Contato</a>
                        </li>
                        
                        <li className="nav-item mt-5">
                            <Link className="nav-link" to="/login" onClick={handleClose}>Login</Link>
                        </li>
                    </ul>
                </Offcanvas.Body>
            </Offcanvas>
        </>
    );
}

export default Navbar;