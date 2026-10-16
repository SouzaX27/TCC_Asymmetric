// src/context/CartContext.jsx
import { createContext, useState, useContext, useEffect, useCallback } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cart, setCart] = useState(() => {
        try {
            const savedCart = localStorage.getItem('asymmetric_cart');
            return savedCart ? JSON.parse(savedCart) : [];
        } catch (error) {
            console.error("Erro ao carregar carrinho do localStorage:", error);
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('asymmetric_cart', JSON.stringify(cart));
        } catch (error) {
            console.error("Erro ao salvar carrinho no localStorage:", error);
        }
    }, [cart]);

    const totalItems = cart.reduce((total, item) => total + (item.quantidade || 1), 0);
    
    const addToCart = (produto, variacao) => {
        const produtoId = produto.id || produto.id_produto;
        const variacaoId = variacao?.id_variacao;
        const tamanho = variacao?.tamanho || '';
        const imagemUrl = produto.imagens?.[0]?.imagem || produto.imagem?.[0] || '';

        setCart((prevCart) => {
            const itemExiste = prevCart.find(
                (item) => item.id_variacao === variacaoId && (variacaoId || item.id === produtoId) && item.tamanho === tamanho
            );

            if (itemExiste) {
                return prevCart.map((item) =>
                    item.id_variacao === variacaoId && (variacaoId || item.id === produtoId) && item.tamanho === tamanho
                        ? { ...item, quantidade: item.quantidade + 1 }
                        : item
                );
            }

            return [...prevCart, { ...produto, id: produtoId, id_variacao: variacaoId, imagem: imagemUrl, tamanho, quantidade: 1 }];
        });
    };

    const increaseQuantity = (produtoId, tamanho) => {
        setCart((prevCart) =>
            prevCart.map((item) =>
                (item.id_variacao || item.id) === produtoId && item.tamanho === tamanho
                    ? { ...item, quantidade: item.quantidade + 1 }
                    : item
            )
        );
    };

    const decreaseQuantity = (produtoId, tamanho) => {
        setCart((prevCart) =>
            prevCart
                .map((item) =>
                    (item.id_variacao || item.id) === produtoId && item.tamanho === tamanho
                        ? { ...item, quantidade: item.quantidade - 1 }
                        : item
                )
                .filter((item) => item.quantidade > 0)
        );
    };

    const removeFromCart = (produtoId, tamanho) => {
        setCart((prevCart) =>
            prevCart.filter((item) => !((item.id_variacao || item.id) === produtoId && item.tamanho === tamanho))
        );
    };

    const clearCart = useCallback(() => setCart([]), []);

    const cartTotal = cart.reduce((total, item) => total + (item.preco * item.quantidade), 0);

    const cartCount = cart.reduce((total, item) => total + item.quantidade, 0);

    return (
        <CartContext.Provider value={{ 
            cart, 
            addToCart, 
            increaseQuantity, 
            decreaseQuantity, 
            removeFromCart, 
            clearCart, 
            cartTotal, 
            cartCount, 
            totalItems 
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    return useContext(CartContext);
}