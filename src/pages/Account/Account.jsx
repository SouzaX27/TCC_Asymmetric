import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Account.css'

function Account() {
    const navigate = useNavigate();
    const { user, signed, logout } = useAuth();

    useEffect(() => {
        if (!signed) {
            navigate('/login', { replace: true });
        }
    }, [signed, navigate]);

    const handleLogout = () => {
        logout();
        navigate('/inicio', { replace: true });
    };

    if (!user) return null;

    return (
        <div className="container mt-3 mb-5 pt-5">
            <div className="max-width-700 mx-auto">
                <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-dark">
                    <h2 className="fw-bold text-uppercase m-0 text-black">Minha Conta</h2>
                    <button 
                        onClick={handleLogout}
                        className="btn btn-outline-danger btn-sm fw-bold text-uppercase rounded-0"
                    >
                        Sair da Conta
                    </button>
                </div>

                <div className="row g-4">
                    <div className="col-md-6">
                        <div className="border-grey p-4 h-100 d-flex">
                            <div className="col-md-6">
                                <h4 className="fw-bold text-uppercase fs-5 mb-3 text-black">Dados Cadastrais</h4>
                                
                                <p className="mb-1 text-muted fs-6">Nome Completo</p>
                                <p className="fw-bold text-black fs-5 mb-3">{user.name}</p>

                                <p className="mb-1 text-muted fs-6">E-mail</p>
                                <p className="fw-bold text-black fs-5 mb-0">{user.email}</p>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-6">
                        <div className="border-grey p-4 h-100">
                            <div className="row g-3 ">
                                <div className="col-12 col-md-6">
                                    <h4 className="fw-bold text-uppercase fs-5 mb-3 text-black">Pontuação da Conta</h4>
                                    <p className="mb-1 text-muted fs-6">* Cada produto comprado equivale a um ponto.</p>
                                </div>

                                <div className="col-12 col-md-6 d-flex justify-content-center">
                                    <div className="counter-points d-flex justify-content-center align-items-center">
                                        <span className="font-my-account text-white">7</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-6">
                        <div className="border-grey p-4 h-100 d-flex flex-column justify-content-between">
                            <div>
                                <h4 className="fw-bold text-uppercase fs-5 mb-3 text-black">Meus Pedidos</h4>
                                <p className="text-muted fs-6">
                                    Consulte o histórico e o status de entrega das suas compras.
                                </p>
                            </div>
                            <Link 
                                to="/pedidos" 
                                className="button-1 text-decoration-none text-center py-2 fw-bold text-uppercase fs-6 d-block mt-3"
                            >
                                Ver Pedidos
                            </Link>
                        </div>
                    </div>


                </div>

                <div className="mt-5 text-center">
                    <Link to="/produtos" className="button-2 py-2 px-3 text-decoration-none  fw-bold text-uppercase fs-6">
                        Continuar Comprando
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Account;