import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function Register() {
    const navigate = useNavigate();
    const { register, signed } = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    
    useEffect(() => {
        if (signed) {
            navigate('/pedidos');
        }
    }, [signed, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }
        
        const res = await register(name, email, password);

        if (res.success) {            
            navigate('/pedidos');
        } else {
            setError(res.message);
        }
    };

    return (
        <div className="container my-5 pt-5">
            <div className="max-width-500 mx-auto border-grey p-4">
                <h2 className="fw-bold text-uppercase mb-4 text-black">Criar Conta</h2>

                {error && <div className="alert alert-danger rounded-0 fw-bold">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label fs-5 fw-bold">Nome Completo</label>
                        <input
                            type="text"
                            className="form-control fs-5 border-grey rounded-0"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Seu nome"
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label fs-5 fw-bold">E-mail</label>
                        <input
                            type="email"
                            className="form-control fs-5 border-grey rounded-0"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="exemplo@email.com"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="form-label fs-5 fw-bold">Senha</label>
                        <input
                            type="password"
                            className="form-control fs-5 border-grey rounded-0"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            required
                        />
                    </div>

                    <button type="submit" className="button-1 w-100 py-3 fw-bold text-uppercase fs-5 border-0">
                        Cadastrar
                    </button>
                </form>

                <div className="mt-4 pt-3 border-top text-center">
                    <p className="mb-0">
                        Já tem uma conta?{' '}
                        <Link to="/login" className="fw-bold text-black">
                            Fazer Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Register;