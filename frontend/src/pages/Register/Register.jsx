import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Message from '../../components/Message/Message';

function formatarCpf(valor) {
    const digitos = valor.replace(/\D/g, '').slice(0, 11);
    if (digitos.length <= 3) return digitos;
    if (digitos.length <= 6) return `${digitos.slice(0, 3)}.${digitos.slice(3)}`;
    if (digitos.length <= 9) return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`;
    return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`;
}

function cpfValido(valor) {
    const cpf = valor.replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

    const calcularDigito = (base, pesos) => {
        const soma = [...base].reduce((total, digito, indice) => total + Number(digito) * pesos[indice], 0);
        return (soma * 10 % 11) % 10;
    };
    const primeiroDigito = calcularDigito(cpf.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
    const segundoDigito = calcularDigito(cpf.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
    return cpf.endsWith(`${primeiroDigito}${segundoDigito}`);
}

function Register() {
    const navigate = useNavigate();
    const { solicitarCodigo, verificarCodigo, signed } = useAuth();

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [cpf, setCpf] = useState('');
    const [password, setPassword] = useState('');
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [aceitaTermos, setAceitaTermos] = useState(false);
    const [error, setError] = useState('');
    const [mensagem, setMensagem] = useState('');
    const [codigoEnviado, setCodigoEnviado] = useState(false);
    const [codigo, setCodigo] = useState('');
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

        if (!codigoEnviado && !cpfValido(cpf)) {
            setError('Informe um CPF válido com 11 dígitos.');
            return;
        }

        if (!codigoEnviado && !aceitaTermos) {
            setError('Leia e aceite os Termos de Uso e a Política de Privacidade para continuar.');
            return;
        }

        if (!codigoEnviado && password.length < 8) {
            setError('A senha deve ter pelo menos 8 caracteres.');
            return;
        }

        setIsSubmitting(true);
        const dados = {
            nome: name,
            telefone: phone,
            email,
            cpf,
            password,
            aceita_termos: aceitaTermos
        };
        try {
            if (!codigoEnviado) {
                const res = await solicitarCodigo('cadastro', email, dados);
                if (res.success) {
                    setCodigoEnviado(true);
                    setMensagem(res.message || 'Código enviado. Confira seu e-mail.');
                } else {
                    setError(res.message);
                }
                return;
            }

            const res = await verificarCodigo('cadastro', email, codigo, dados);
            if (res.success) {
                navigate('/minha-conta', { replace: true });
            } else {
                setError(res.message);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const reenviarCodigo = async () => {
        setError('');
        setMensagem('');
        setIsSubmitting(true);
        try {
            const res = await solicitarCodigo('cadastro', email, {
                nome: name,
                telefone: phone,
                email,
                cpf,
                password,
                aceita_termos: aceitaTermos
            });
            if (res.success) setMensagem(res.message || 'Código enviado. Confira seu e-mail.');
            else setError(res.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container my-5 pt-5">
            <div className="max-width-500 mx-auto border-grey p-4">
                <h2 className="fw-bold text-uppercase mb-4 text-black">Criar Conta</h2>

                <Message tipo="sucesso" texto={mensagem} className="mb-3" />
                <Message tipo="erro" texto={error} className="mb-3" />

                <form onSubmit={handleSubmit}>
                    {!codigoEnviado && <><div className="mb-3">
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

                    <div className="mb-3">
                        <label className="form-label fs-5 fw-bold" htmlFor="cpf">CPF</label>
                        <input
                            id="cpf"
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            className="form-control fs-5 border-grey rounded-0"
                            value={cpf}
                            onChange={(e) => setCpf(formatarCpf(e.target.value))}
                            placeholder="000.000.000-00"
                            maxLength={14}
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="form-label fs-5 fw-bold" htmlFor="register-password">Senha</label>
                        <div className="input-group">
                            <input
                                id="register-password"
                                type={mostrarSenha ? 'text' : 'password'}
                                className="form-control fs-5 border-grey rounded-0"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Mínimo 8 caracteres"
                                minLength={8}
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
                    </div></>}

                    {codigoEnviado && (
                        <div className="mb-4">
                            <p className="mb-3">Informe o código de 6 dígitos enviado para <strong>{email}</strong>.</p>
                            <label className="form-label fs-5 fw-bold" htmlFor="codigo-verificacao">Código de verificação</label>
                            <input
                                id="codigo-verificacao"
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                className="form-control fs-5 border-grey rounded-0"
                                value={codigo}
                                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                pattern="[0-9]{6}"
                                maxLength={6}
                                required
                            />
                            <div className="d-flex justify-content-between mt-2">
                                <button type="button" className="btn btn-link p-0 text-black" onClick={reenviarCodigo} disabled={isSubmitting}>
                                    Reenviar código
                                </button>
                                <button type="button" className="btn btn-link p-0 text-black" onClick={() => {
                                    setCodigoEnviado(false);
                                    setCodigo('');
                                    setMensagem('');
                                }}>
                                    Alterar dados
                                </button>
                            </div>
                        </div>
                    )}

                    <button type="submit" className="button-1 w-100 py-3 fw-bold text-uppercase fs-5 border-0" disabled={isSubmitting}>
                        {isSubmitting ? 'Aguarde...' : codigoEnviado ? 'Verificar código e cadastrar' : 'Enviar código'}
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