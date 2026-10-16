import { useState, useEffect } from 'react';
import { Navbar as BootstrapNavbar, Offcanvas, Collapse } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom'; 
import api from '../../services/api'

import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

import './Navbar.css';

import menuIcon from '../../assets/images/menu.svg';
import logoAsymmetric from '../../assets/images/logo.svg';
import cartIcon from '../../assets/images/cart.svg';

function Navbar() {
    const [showMenu, setShowMenu] = useState(false);
    const [colecoes, setColecoes] = useState([]); 
    const { totalItems } = useCart();
    const { signed, user, logout } = useAuth();
    const navigate = useNavigate();

    const [openColecoes, setOpenColecoes] = useState(false);

    useEffect(() => {
        api.get('colecoes/')
            .then(response => {
                setColecoes(response.data);
            })
            .catch(error => {
                console.error("Erro ao carregar coleções:", error);
            });
    }, []);

    const handleClose = () => setShowMenu(false);
    const handleShow = () => setShowMenu(true);

    const handleLogout = () => {
        logout();
        handleClose();
        navigate('/inicio', { replace: true });
    };

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

                    <Link className="nav-logo m-0 p-0 d-flex justify-content-center align-items-center" to="/inicio">
                        <img 
                            className='logo'
                            src={logoAsymmetric}
                            alt="ASYMMETRIC"
                            style={{ height: '32px', width: 'auto' }}
                        />
                    </Link>

                    <Link to="/carrinho" className="nav-cart m-0 p-0 d-flex justify-content-end align-items-center">
                        <img
                            src={cartIcon}
                            alt="Carrinho"
                            className="cart-icon"
                        />
                        {totalItems > 0 && (
                            <span className="cart-badge">
                                {totalItems}
                            </span>
                        )}
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
                            <Link to="/inicio" className="nav-link" onClick={handleClose}>Início</Link>
                        </li>
                        <li className="nav-item">
                            <Link to="/produtos" className="nav-link" onClick={handleClose}>Todos os Produtos</Link>
                        </li>

                        <li className="nav-item">
                            <div 
                                className="nav-link d-flex justify-content-between align-items-center" 
                                onClick={() => setOpenColecoes(!openColecoes)}
                                style={{ cursor: 'pointer' }}
                            >
                                <span>Coleções</span>

                                <span className='fs-5' style={{ transform: openColecoes ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.4s' }}>
                                    ▼
                                </span>
                            </div>

                            <Collapse in={openColecoes}>
                                <div>
                                    {colecoes.length > 0 && (
                                        <ul className="list-unstyled ms-1 my-1 ps-3">
                                            {colecoes.map((colecao) => (
                                                <li className="nav-item" key={colecao.id_colecao || colecao.slug}>
                                                    <Link 
                                                        to={`/colecoes/${colecao.slug}`}
                                                        className="nav-link fs-5 py-1" 
                                                        onClick={handleClose}
                                                    >
                                                        {colecao.nome}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </Collapse>
                        </li>

                        <li className="nav-item">
                            <Link to="/contato" className="nav-link" onClick={handleClose}>Contato</Link>
                        </li>
                        
                        {signed ? (
                            <>
                                <li className="nav-item">
                                    <Link to="/pedidos" className="nav-link" onClick={handleClose}>Pedidos</Link>
                                </li>
                                <li className="nav-item">
                                    <Link to="/minha-conta" className="nav-link" onClick={handleClose}>
                                        Minha Conta ({user?.name?.split(' ')[0] || 'Cliente'})
                                    </Link>
                                </li>
                                <li className="nav-item mt-4">
                                    <button 
                                        type="button" 
                                        className="btn btn-link nav-link text-danger p-0 border-0 fs-4" 
                                        onClick={handleLogout}
                                    >
                                        Sair
                                    </button>
                                </li>
                            </>
                        ) : (

                            <li className="nav-item mt-5">
                                <Link className="nav-link" to="/login" onClick={handleClose}>Login</Link>
                            </li>
                        )}
                    </ul>
                </Offcanvas.Body>
            </Offcanvas>
        </>
    );
}

export default Navbar;