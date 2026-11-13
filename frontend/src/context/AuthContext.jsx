import { createContext, useContext, useState, useEffect } from 'react';
import api, { definirTokenAcesso } from '../services/api';

const AuthContext = createContext(null);

function getApiErrorMessage(error, fallback) {
    if (!error.response) {
        return error.request
            ? 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'
            : fallback;
    }

    const mensagens = [];
    const coletarMensagens = (valor) => {
        if (typeof valor === 'string') {
            mensagens.push(valor);
        } else if (Array.isArray(valor)) {
            valor.forEach(coletarMensagens);
        } else if (valor && typeof valor === 'object') {
            Object.values(valor).forEach(coletarMensagens);
        }
    };

    coletarMensagens(error.response.data);
    return mensagens.join(' ') || fallback;
}

function mapearPerfil(perfil) {
    return {
        id: perfil.id_cliente,
        name: perfil.nome,
        email: perfil.email,
        phone: perfil.telefone,
        points: perfil.pontos
    };
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState('');

    useEffect(() => {        
        let ativo = true;
        const encerrarSessao = () => {
            setUser(null);
            setAuthError('Sua sessão expirou. Entre novamente para continuar.');
        };
        window.addEventListener('asymmetric:session-expired', encerrarSessao);

        const restaurarSessao = async () => {
            try {
                const respostaToken = await api.post('usuarios/token/refresh/', {});
                if (!respostaToken.data?.access) {
                    throw new Error('A resposta de atualização não contém um token de acesso.');
                }
                definirTokenAcesso(respostaToken.data.access);
                const respostaPerfil = await api.get('usuarios/me/');
                if (ativo) {
                    setUser(mapearPerfil(respostaPerfil.data));
                    setAuthError('');
                }
            } catch (error) {
                if (ativo) {
                    definirTokenAcesso(null);
                    setUser(null);
                    if (error.response?.status !== 401) {
                        setAuthError(getApiErrorMessage(
                            error,
                            'Não foi possível verificar sua sessão. Tente novamente.'
                        ));
                    }
                }
            } finally {
                if (ativo) setLoading(false);
            }
        };

        restaurarSessao();
        return () => {
            ativo = false;
            window.removeEventListener('asymmetric:session-expired', encerrarSessao);
        };
    }, []);

    const register = async (name, phone, email, password, aceitaTermos) => {
        setAuthError('');
        try {
            await api.post('usuarios/registrar/', {
                nome: name,
                telefone: phone,
                email,
                password,
                aceita_termos: aceitaTermos
            });
            return { success: true };
        } catch (error) {
            const message = getApiErrorMessage(error, 'Não foi possível criar a conta.');
            setAuthError(message);
            return { success: false, message };
        }
    };
    
    const login = async (email, password) => {
        setAuthError('');
        try {
            const respostaLogin = await api.post('usuarios/login/', {
                username: String(email ?? '').trim().toLowerCase(),
                password
            });
            if (!respostaLogin.data?.access) {
                throw new Error('A resposta de login não contém um token de acesso.');
            }
            definirTokenAcesso(respostaLogin.data.access);
            const respostaPerfil = await api.get('usuarios/me/');
            setUser(mapearPerfil(respostaPerfil.data));
            return { success: true };
        } catch (error) {
            definirTokenAcesso(null);
            const fallback = error.response?.status === 401
                ? 'E-mail ou senha incorretos.'
                : 'Não foi possível entrar na conta.';
            const message = getApiErrorMessage(error, fallback);
            setAuthError(message);
            return { success: false, message };
        }
    };
    
    const logout = async () => {
        setAuthError('');
        let resultado = { success: true };
        try {
            await api.post('usuarios/logout/', {});
        } catch (error) {
            const message = getApiErrorMessage(error, 'Não foi possível encerrar a sessão no servidor.');
            console.error('Erro ao encerrar a sessão no servidor:', error);
            setAuthError(message);
            resultado = { success: false, message };
        } finally {
            definirTokenAcesso(null);
            setUser(null);
        }
        return resultado;
    };

    return (
        <AuthContext.Provider value={{ user, signed: Boolean(user), login, register, logout, loading, authError }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider.');
    }
    return context;
};