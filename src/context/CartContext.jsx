// src/context/CartContext.jsx
import { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  // Função para adicionar produto ao carrinho
  const addToCart = (product, size) => {
    setCart((prevCart) => {
      // No streetwear, um mesmo produto com tamanhos diferentes são itens separados no carrinho!
      const itemExists = prevCart.find(
        (item) => item.id === product.id && item.size === size
      );

      if (itemExists) {
        // Se já existe o mesmo produto E o mesmo tamanho, aumenta a quantidade
        return prevCart.map((item) =>
          item.id === product.id && item.size === size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      // Se for um item novo ou tamanho diferente, adiciona à lista
      return [...prevCart, { ...product, size, quantity: 1 }];
    });
  };

  // Função para remover item
  const removeFromCart = (productId, size) => {
    setCart((prevCart) =>
      prevCart.filter((item) => !(item.id === productId && item.size === size))
    );
  };

  // Função para limpar o carrinho (útil pós-compra)
  const clearCart = () => setCart([]);

  // Calcula o valor total do carrinho
  const cartTotal = cart.reduce((total, item) => total + item.preco * item.quantity, 0);

  // Calcula o total de itens (para mostrar uma bolinha com número na navbar no futuro)
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, cartTotal, cartCount }}>
      {children}
    </CartContext.Provider>
  );
}

// Hook customizado para facilitar o uso nas páginas
export function useCart() {
  return useContext(CartContext);
}