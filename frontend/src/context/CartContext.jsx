// src/context/CartContext.jsx
import { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cart, setCart] = useState([]);

    
    const totalItems = cart.reduce((total, item) => total + (item.quantidade || 1), 0);
    
    const addToCart = (produto, tamanho) => {
        setCart((prevCart) => {
            const itemExiste = prevCart.find(
                (item) => item.id === produto.id && item.tamanho === tamanho
            );

            if (itemExiste) {
                return prevCart.map((item) =>
                    item.id === produto.id && item.tamanho === tamanho
                        ? { ...item, quantidade: item.quantidade + 1 }
                        : item
                );
            }

            return [...prevCart, { ...produto, tamanho, quantidade: 1 }];
        });
    };

    const removeFromCart = (produtoId, tamanho) => {
        setCart((prevCart) =>
            prevCart.filter((item) => !(item.id === produtoId && item.tamanho === tamanho))
        );
    };

    const clearCart = () => setCart([]);

    const cartTotal = cart.reduce((total, item) => total + (item.preco * item.quantidade), 0);

    const cartCount = cart.reduce((total, item) => total + item.quantidade, 0);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, cartTotal, cartCount, totalItems }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    return useContext(CartContext);
}