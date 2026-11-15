import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Message from '../../components/Message/Message';

function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, signed } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [error, setError] = useState('');
    const [mensagem, setMensagem] = useState(location.state?.mensagem || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (signed) {
            navigate('/minha-conta', { replace: true });
        }
    }, [signed, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMensagem('');

        setIsSubmitting(true);
        try {
            const res = await login(email, password);
            if (res.success) navigate('/minha-conta', { replace: true });
            else setError(res.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container my-5 pt-5">
            <div className="max-width-500 mx-auto border-grey p-4">
                <h2 className="fw-bold text-uppercase mb-4 text-black">Entrar na Conta</h2>

                <Message tipo="sucesso" texto={mensagem} className="mb-3" />
                <Message tipo="erro" texto={error} className="mb-3" />

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
                        <label className="form-label fs-5 fw-bold" htmlFor="login-password">Senha</label>
                        <div className="input-group">
                            <input
                                id="login-password"
                                type={mostrarSenha ? 'text' : 'password'}
                                className="form-control fs-5 border-grey rounded-0"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="btn btn-outline-secondary rounded-0"
                                onClick={() => setMostrarSenha(!mostrarSenha)}
                                aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                                aria-pressed={mostrarSenha}
                            >
                                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    {mostrarSenha
                                        ? <><path d="M3 3l18 18" /><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 9 5 9 7a10.7 10.7 0 0 1-3 3.8M6.2 6.2C4.2 7.5 3 9.4 3 12c0 2 4 7 9 7 1.1 0 2.1-.2 3-.6" /></>
                                        : <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>}
                                </svg>
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="button-1 w-100 py-3 fw-bold text-uppercase fs-5 border-0" disabled={isSubmitting}>
                        {isSubmitting ? 'Aguarde...' : 'Entrar'}
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