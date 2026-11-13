import { createContext, useContext, useState, useEffect } from 'react';
import api, { definirTokenAcesso } from '../services/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {        
        localStorage.removeItem('current_user');
        localStorage.removeItem('registered_users');
        localStorage.removeItem('meus_pedidos');

        let ativo = true;
        const encerrarSessao = () => setUser(null);
        window.addEventListener('asymmetric:session-expired', encerrarSessao);
        const restaurarSessao = async () => {
            try {
                const respostaToken = await api.post('usuarios/token/refresh/', {});
                definirTokenAcesso(respostaToken.data.access);
                const respostaPerfil = await api.get('usuarios/me/');
                if (ativo) {
                    setUser({
                        id: respostaPerfil.data.id_cliente,
                        name: respostaPerfil.data.nome,
                        email: respostaPerfil.data.email,
                        phone: respostaPerfil.data.telefone,
                        points: respostaPerfil.data.pontos
                    });
                }
            } catch {
                definirTokenAcesso(null);
                if (ativo) setUser(null);
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
            const erros = error.response?.data;
            const mensagem = Object.values(erros || {}).flat().join(' ');
            return { success: false, message: mensagem || 'Não foi possível criar a conta.' };
        }
    };
    
    const login = async (email, password) => {
        try {
            const respostaLogin = await api.post('usuarios/login/', {
                username: email.trim().toLowerCase(),
                password
            });
            definirTokenAcesso(respostaLogin.data.access);
            const respostaPerfil = await api.get('usuarios/me/');
            setUser({
                id: respostaPerfil.data.id_cliente,
                name: respostaPerfil.data.nome,
                email: respostaPerfil.data.email,
                phone: respostaPerfil.data.telefone,
                points: respostaPerfil.data.pontos
            });
            return { success: true };
        } catch (error) {
            definirTokenAcesso(null);
            const detalhe = error.response?.data?.detail;
            return { success: false, message: detalhe || 'E-mail ou senha incorretos.' };
        }
    };
    
    const logout = async () => {
        try {
            await api.post('usuarios/logout/', {});
        } catch {
            // A sessão local é encerrada mesmo se a API estiver indisponível.
        } finally {
            definirTokenAcesso(null);
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, signed: Boolean(user), login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);