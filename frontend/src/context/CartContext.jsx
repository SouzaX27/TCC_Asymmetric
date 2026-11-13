// src/context/CartContext.jsx
import { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

const CartContext = createContext(null);

function getItemKey(item) {
    const produtoId = item.id ?? item.id_produto ?? item.produto_id;
    const variacaoId = item.id_variacao ?? item.variacao_id;
    const identificador = variacaoId == null ? `produto:${produtoId}` : `variacao:${variacaoId}`;
    return `${identificador}|${item.tamanho ?? ''}`;
}

function matchesCartItem(item, produtoId, tamanho) {
    return String(item.id_variacao ?? item.id ?? item.id_produto ?? item.produto_id) === String(produtoId)
        && (item.tamanho ?? '') === (tamanho ?? '');
}

function mergeCartItems(firstCart, secondCart) {
    const itensPorChave = new Map();

    [...firstCart, ...secondCart].forEach((item) => {
        const chave = getItemKey(item);
        const itemExistente = itensPorChave.get(chave);
        itensPorChave.set(chave, itemExistente
            ? { ...itemExistente, quantidade: itemExistente.quantidade + item.quantidade }
            : item);
    });

    return [...itensPorChave.values()];
}

function getProducts(response) {
    const products = Array.isArray(response.data) ? response.data : response.data?.results;
    if (!Array.isArray(products)) {
        throw new Error('A resposta da API não contém uma lista de produtos.');
    }
    return products;
}

function getProductVariation(product, item) {
    return product?.variacoes?.find((variation) => (
        item.id_variacao
            ? Number(variation.id_variacao) === Number(item.id_variacao)
            : variation.tamanho === item.tamanho
    ));
}

export function CartProvider({ children }) {
    const [cart, setCart] = useState([]);
    const [cartLoading, setCartLoading] = useState(true);
    const [cartError, setCartError] = useState('');
    const [cartReadyToPersist, setCartReadyToPersist] = useState(false);
    const itensSalvosPendentes = useRef([]);
    const carrinhoLimpoDuranteRestauracao = useRef(false);
    const cartRef = useRef([]);

    const updateCart = useCallback((updater) => {
        const nextCart = typeof updater === 'function' ? updater(cartRef.current) : updater;
        cartRef.current = nextCart;
        setCart(nextCart);
        return nextCart;
    }, []);

    useEffect(() => {
        let ativo = true;

        const restaurarCarrinho = async () => {
            let itensSalvos = [];
            try {
                const dadosSalvos = JSON.parse(localStorage.getItem('asymmetric_cart') || '[]');
                itensSalvos = Array.isArray(dadosSalvos) ? dadosSalvos
                    .filter((item) => item && typeof item === 'object')
                    .map((item) => ({
                        produtoId: Number(item.produto_id ?? item.id_produto ?? item.id),
                        variacaoId: Number(item.variacao_id ?? item.id_variacao) || null,
                        tamanho: item.tamanho ?? item.size ?? '',
                        quantidade: Math.max(1, Math.floor(Number(item.quantidade) || 1))
                    }))
                    .filter((item) => Number.isInteger(item.produtoId) && item.produtoId > 0) : [];
            } catch (error) {
                console.error('Erro ao ler os identificadores do carrinho:', error);
                if (ativo) {
                    setCartError('Não foi possível acessar o carrinho salvo neste navegador.');
                    setCartLoading(false);
                }
                return;
            }

            itensSalvosPendentes.current = itensSalvos.map((item) => ({
                produto_id: item.produtoId,
                variacao_id: item.variacaoId,
                tamanho: item.tamanho,
                quantidade: item.quantidade
            }));

            if (itensSalvos.length === 0) {
                if (ativo) {
                    updateCart([]);
                    setCartLoading(false);
                    setCartReadyToPersist(true);
                }
                return;
            }

            try {
                const resposta = await api.get('produtos/');
                if (!ativo) return;

                const produtos = getProducts(resposta);

                let estoqueInsuficiente = false;
                const carrinhoRestaurado = itensSalvos.map((item) => {
                    const produto = produtos.find((entrada) => entrada.id_produto === Number(item.produtoId));
                    if (!produto) return null;

                    const variacao = getProductVariation(produto, {
                        id_variacao: item.variacaoId,
                        tamanho: item.tamanho
                    });
                    const imagem = produto.imagens?.find((entrada) => !entrada.medidas) || produto.imagens?.[0];
                    const estoqueAtual = Number(variacao?.estoque_atual);
                    if (Number.isFinite(estoqueAtual) && item.quantidade > estoqueAtual) {
                        estoqueInsuficiente = true;
                    }

                    return {
                        ...produto,
                        id: produto.id_produto,
                        id_variacao: variacao?.id_variacao || Number(item.variacaoId) || null,
                        imagem: imagem?.imagem || '',
                        tamanho: variacao?.tamanho || item.tamanho,
                        estoque_atual: Number.isFinite(estoqueAtual) ? estoqueAtual : null,
                        quantidade: Number.isFinite(estoqueAtual) && estoqueAtual > 0
                            ? Math.min(item.quantidade, estoqueAtual)
                            : item.quantidade
                    };
                }).filter(Boolean);

                const carrinhoFoiLimpo = carrinhoLimpoDuranteRestauracao.current;
                carrinhoLimpoDuranteRestauracao.current = false;
                itensSalvosPendentes.current = [];
                updateCart((carrinhoAtual) => {
                    if (carrinhoFoiLimpo) return carrinhoAtual;

                    return mergeCartItems(carrinhoRestaurado, carrinhoAtual).map((item) => {
                        if (!Number.isFinite(item.estoque_atual)) return item;
                        if (item.quantidade > item.estoque_atual) estoqueInsuficiente = true;
                        return item.estoque_atual > 0
                            ? { ...item, quantidade: Math.min(item.quantidade, item.estoque_atual) }
                            : item;
                    });
                });
                setCartError(estoqueInsuficiente && !carrinhoFoiLimpo
                    ? 'A disponibilidade de alguns itens mudou. Confira as quantidades no carrinho.'
                    : '');
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
    }, [updateCart]);

    useEffect(() => {
        if (!cartReadyToPersist) return;

        try {
            const itensAtuais = cart.map((item) => ({
                produto_id: item.id || item.id_produto,
                variacao_id: item.id_variacao || null,
                tamanho: item.tamanho,
                quantidade: item.quantidade
            }));
            const itensPublicos = mergeCartItems(itensSalvosPendentes.current, itensAtuais);
            localStorage.setItem('asymmetric_cart', JSON.stringify(itensPublicos));
            setCartError((erroAtual) => (
                erroAtual === 'Não foi possível salvar o carrinho neste navegador.' ? '' : erroAtual
            ));
        } catch (error) {
            console.error('Erro ao salvar os identificadores do carrinho:', error);
            setCartError('Não foi possível salvar o carrinho neste navegador.');
        }
    }, [cart, cartReadyToPersist]);

    const totalItems = cart.reduce((total, item) => total + (item.quantidade || 1), 0);
    
    const addToCart = (produto, variacao) => {
        const produtoId = produto?.id ?? produto?.id_produto;
        if (!produtoId) {
            const message = 'Não foi possível adicionar um produto sem identificador ao carrinho.';
            setCartError(message);
            return { success: false, message };
        }

        const variacaoSelecionada = variacao || produto.variacoes?.[0];
        const estoqueAtual = Number(variacaoSelecionada?.estoque_atual);
        if (!variacaoSelecionada || !Number.isFinite(estoqueAtual)) {
            const message = 'Não foi possível confirmar o estoque deste produto. Atualize a página e tente novamente.';
            setCartError(message);
            return { success: false, message };
        }

        const variacaoId = variacaoSelecionada.id_variacao;
        const tamanho = variacaoSelecionada.tamanho || '';
        const imagemUrl = produto.imagens?.[0]?.imagem || produto.imagem?.[0] || '';

        const novaChave = getItemKey({ id: produtoId, id_variacao: variacaoId, tamanho });
        const itemExistente = cartRef.current.find((item) => getItemKey(item) === novaChave);
        const quantidadeAtual = itemExistente?.quantidade || 0;
        if (estoqueAtual <= 0 || quantidadeAtual >= estoqueAtual) {
            const message = estoqueAtual <= 0
                ? 'Este tamanho está sem estoque disponível.'
                : `Você já adicionou ao carrinho todas as unidades disponíveis.`;
            setCartError(message);
            return { success: false, message };
        }

        setCartReadyToPersist(true);
        setCartError('');
        updateCart((prevCart) => {
            if (itemExistente) {
                return prevCart.map((item) => (
                    getItemKey(item) === novaChave
                        ? { ...item, estoque_atual: estoqueAtual, quantidade: item.quantidade + 1 }
                        : item
                ));
            }

            return [...prevCart, {
                ...produto,
                id: produtoId,
                id_variacao: variacaoId,
                imagem: imagemUrl,
                tamanho,
                estoque_atual: estoqueAtual,
                quantidade: 1
            }];
        });
        return { success: true };
    };

    const increaseQuantity = (produtoId, tamanho) => {
        const item = cartRef.current.find((cartItem) => matchesCartItem(cartItem, produtoId, tamanho));
        if (!item) return;

        if (!Number.isFinite(item.estoque_atual)) {
            setCartError('Não foi possível confirmar o estoque deste produto. Atualize a página e tente novamente.');
            return;
        }
        if (item.quantidade >= item.estoque_atual) {
            setCartError(`Você já adicionou ao carrinho todas as unidades disponíveis (${item.estoque_atual}).`);
            return;
        }

        setCartError('');
        updateCart((prevCart) => prevCart.map((cartItem) => (
            matchesCartItem(cartItem, produtoId, tamanho)
                ? { ...cartItem, quantidade: cartItem.quantidade + 1 }
                : cartItem
        )));
    };

    const decreaseQuantity = (produtoId, tamanho) => {
        updateCart((prevCart) => prevCart
            .map((item) => (
                matchesCartItem(item, produtoId, tamanho)
                    ? { ...item, quantidade: item.quantidade - 1 }
                    : item
            ))
            .filter((item) => item.quantidade > 0));
    };

    const removeFromCart = (produtoId, tamanho) => {
        updateCart((prevCart) => prevCart.filter((item) => !matchesCartItem(item, produtoId, tamanho)));
    };

    const clearCart = useCallback(() => {
        carrinhoLimpoDuranteRestauracao.current = true;
        itensSalvosPendentes.current = [];
        updateCart([]);
        setCartReadyToPersist(true);
    }, [updateCart]);

    const validateCartStock = useCallback(async () => {
        try {
            const resposta = await api.get('produtos/');
            const produtos = getProducts(resposta);
            let estoqueInsuficiente = false;
            let estoqueNaoEncontrado = false;

            const carrinhoAtualizado = cartRef.current.map((item) => {
                const produto = produtos.find((entrada) => Number(entrada.id_produto) === Number(item.id));
                const variacaoAtual = getProductVariation(produto, item);
                const estoqueAtual = Number(variacaoAtual?.estoque_atual);
                if (!Number.isFinite(estoqueAtual)) {
                    estoqueNaoEncontrado = true;
                    return { ...item, estoque_atual: null };
                }

                if (estoqueAtual < item.quantidade) estoqueInsuficiente = true;
                return {
                    ...item,
                    estoque_atual: estoqueAtual,
                    quantidade: estoqueAtual > 0 ? Math.min(item.quantidade, estoqueAtual) : item.quantidade
                };
            });

            updateCart(carrinhoAtualizado);
            if (estoqueNaoEncontrado) {
                const message = 'Não foi possível confirmar o estoque de um ou mais itens. Atualize o carrinho e tente novamente.';
                setCartError(message);
                return { valid: false, message };
            }
            if (estoqueInsuficiente) {
                const message = 'O estoque de alguns itens mudou. Confira as quantidades e tente novamente.';
                setCartError(message);
                return { valid: false, message };
            }

            setCartError('');
            return { valid: true };
        } catch (error) {
            console.error('Erro ao validar o estoque do carrinho:', error);
            const message = 'Não foi possível verificar o estoque. Verifique sua conexão e tente novamente.';
            setCartError(message);
            return { valid: false, message };
        }
    }, [updateCart]);

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
            validateCartStock,
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
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart deve ser usado dentro de um CartProvider.');
    }
    return context;
}