import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Message from '../../components/Message/Message';

function Register() {
    const navigate = useNavigate();
    const { register, signed } = useAuth();

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [aceitaTermos, setAceitaTermos] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (signed) {
            navigate('/minha-conta', { replace: true });
        }
    }, [signed, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!aceitaTermos) {
            setError('Leia e aceite os Termos de Uso e a Política de Privacidade para continuar.');
            return;
        }

        if (password.length < 8) {
            setError('A senha deve ter pelo menos 8 caracteres.');
            return;
        }

        const res = await register(name, phone, email, password, aceitaTermos);

        if (res.success) {
            navigate('/login', {
                replace: true,
                state: { mensagem: 'Conta criada. Entre com seu e-mail e senha.' }
            });
        } else {
            setError(res.message);
        }
    };

    return (
        <div className="container my-5 pt-5">
            <div className="max-width-500 mx-auto border-grey p-4">
                <h2 className="fw-bold text-uppercase mb-4 text-black">Criar Conta</h2>

                <Message tipo="erro" texto={error} className="mb-3" />

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
                        <label className="form-label fs-5 fw-bold">Telefone</label>
                        <input
                            type="text"
                            className="form-control fs-5 border-grey rounded-0"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="11 99123-4567"
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
                            placeholder="Mínimo 8 caracteres"
                            minLength={8}
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <div className="form-check">
                            <input
                                id="aceita-termos"
                                type="checkbox"
                                className="form-check-input"
                                checked={aceitaTermos}
                                required
                                onChange={(e) => {
                                    setAceitaTermos(e.target.checked);
                                    setError('');
                                }}
                                aria-describedby="texto-aceite-termos"
                            />
                            <label id="texto-aceite-termos" htmlFor="aceita-termos" className="form-check-label">
                                Li e aceito os <Link to="/termos-de-uso" target="_blank" rel="noreferrer">Termos de Uso</Link> e a <Link to="/politica-de-privacidade" target="_blank" rel="noreferrer">Política de Privacidade</Link>.
                            </label>
                        </div>
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