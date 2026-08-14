import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {        
        const savedUser = localStorage.getItem('current_user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);
    
    const register = async (name, email, password) => {
        const registeredUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
        
        const emailExists = registeredUsers.some(
            (u) => u.email.toLowerCase() === email.toLowerCase()
        );

        if (emailExists) {
            return { success: false, message: 'Este e-mail já está cadastrado!' };
        }
        
        const newUser = {
            id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
            name,
            email,
            password
        };
        
        registeredUsers.push(newUser);
        localStorage.setItem('registered_users', JSON.stringify(registeredUsers));
        
        const userData = { id: newUser.id, name: newUser.name, email: newUser.email };
        setUser(userData);
        localStorage.setItem('current_user', JSON.stringify(userData));

        return { success: true };
    };
    
    const login = async (email, password) => {
        const registeredUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
        
        const foundUser = registeredUsers.find(
            (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );
        
        const isDefaultTest = email === 'cliente@gmail.com' && password === '123456';

        if (foundUser || isDefaultTest) {
            const userData = {
                id: foundUser ? foundUser.id : 'USR-01',
                name: foundUser ? foundUser.name : 'Cliente asymmetric',
                email: email
            };

            setUser(userData);
            localStorage.setItem('current_user', JSON.stringify(userData));
            return { success: true };
        } else {
            return { success: false, message: 'E-mail ou senha incorretos (ou conta não existente)!' };
        }
    };
    
    const logout = () => {
        setUser(null);
        localStorage.removeItem('current_user');
    };

    return (
        <AuthContext.Provider value={{ user, signed: Boolean(user), login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);