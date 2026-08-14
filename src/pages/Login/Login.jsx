import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function Login() {
    const navigate = useNavigate();
    const { login, signed } = useAuth(); // 'signed' indica se já está logado (true/false)

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Se JÁ estiver logado, redireciona direto para meus pedidos (ou início)
    useEffect(() => {
        if (signed) {
            navigate('/pedidos');
        }
    }, [signed, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const res = await login(email, password);

        if (res.success) {
            navigate('/pedidos');
        } else {
            setError(res.message);
        }
    };

    return (
        <div className="container my-5 pt-5">
            <div className="max-width-500 mx-auto border-grey p-4">
                <h2 className="fw-bold text-uppercase mb-4 text-black">Entrar na Conta</h2>

                {error && <div className="alert alert-danger rounded-0 fw-bold">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label fs-5 fw-bold">E-mail</label>
                        <input
                            type="email"
                            className="form-control fs-5 border-grey rounded-0"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
                            required
                        />
                    </div>

                    <button type="submit" className="button-1 w-100 py-3 fw-bold text-uppercase fs-5 border-0">
                        Entrar
                    </button>
                </form>

                <div className="mt-4 pt-3 border-top text-center">
                    <p className="mb-2">
                        Não tem uma conta?{' '}
                        <Link to="/cadastro" className="fw-bold text-black">
                            Criar Conta
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;