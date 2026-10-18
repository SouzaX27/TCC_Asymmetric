// src/context/CartContext.jsx
import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../services/api';

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cart, setCart] = useState([]);
    const [cartLoading, setCartLoading] = useState(true);
    const [cartError, setCartError] = useState('');
    const [cartReadyToPersist, setCartReadyToPersist] = useState(false);

    useEffect(() => {
        let ativo = true;

        const restaurarCarrinho = async () => {
            let itensSalvos = [];
            try {
                const dadosSalvos = JSON.parse(localStorage.getItem('asymmetric_cart') || '[]');
                itensSalvos = Array.isArray(dadosSalvos) ? dadosSalvos.map((item) => ({
                    produtoId: item.produto_id ?? item.id_produto ?? item.id,
                    variacaoId: item.variacao_id ?? item.id_variacao ?? null,
                    tamanho: item.tamanho ?? item.size ?? '',
                    quantidade: Math.max(1, Number(item.quantidade) || 1)
                })).filter((item) => item.produtoId) : [];
            } catch (error) {
                console.error('Erro ao ler os identificadores do carrinho:', error);
            }

            if (itensSalvos.length === 0) {
                if (ativo) {
                    setCart([]);
                    setCartLoading(false);
                    setCartReadyToPersist(true);
                }
                return;
            }

            try {
                const resposta = await api.get('produtos/');
                if (!ativo) return;

                const produtos = resposta.data;
                const carrinhoRestaurado = itensSalvos.map((item) => {
                    const produto = produtos.find((entrada) => entrada.id_produto === Number(item.produtoId));
                    if (!produto) return null;

                    const variacao = produto.variacoes?.find((entrada) => (
                        item.variacaoId
                            ? entrada.id_variacao === Number(item.variacaoId)
                            : entrada.tamanho === item.tamanho
                    ));
                    const imagem = produto.imagens?.find((entrada) => !entrada.medidas) || produto.imagens?.[0];

                    return {
                        ...produto,
                        id: produto.id_produto,
                        id_variacao: variacao?.id_variacao || Number(item.variacaoId) || null,
                        imagem: imagem?.imagem || '',
                        tamanho: variacao?.tamanho || item.tamanho,
                        quantidade: item.quantidade
                    };
                }).filter(Boolean);

                setCart(carrinhoRestaurado);
                setCartError('');
                setCartReadyToPersist(true);
            } catch (error) {
                console.error('Erro ao atualizar o carrinho pela API:', error);
                if (ativo) {
                    setCartError('Não foi possível atualizar o carrinho. Verifique a conexão e recarregue a página.');
                }
            } finally {
                if (ativo) setCartLoading(false);
            }
        };

        restaurarCarrinho();
        return () => {
            ativo = false;
        };
    }, []);

    useEffect(() => {
        if (!cartReadyToPersist) return;

        try {
            const itensPublicos = cart.map((item) => ({
                produto_id: item.id || item.id_produto,
                variacao_id: item.id_variacao || null,
                tamanho: item.tamanho,
                quantidade: item.quantidade
            }));
            localStorage.setItem('asymmetric_cart', JSON.stringify(itensPublicos));
        } catch (error) {
            console.error('Erro ao salvar os identificadores do carrinho:', error);
        }
    }, [cart, cartReadyToPersist]);

    const totalItems = cart.reduce((total, item) => total + (item.quantidade || 1), 0);
    
    const addToCart = (produto, variacao) => {
        const produtoId = produto.id || produto.id_produto;
        const variacaoId = variacao?.id_variacao;
        const tamanho = variacao?.tamanho || '';
        const imagemUrl = produto.imagens?.[0]?.imagem || produto.imagem?.[0] || '';

        setCartError('');
        setCartReadyToPersist(true);
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
            totalItems,
            cartLoading,
            cartError
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    return useContext(CartContext);
}