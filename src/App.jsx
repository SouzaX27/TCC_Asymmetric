// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout, SimpleLayout } from './layouts/Layout';

import ScrollToTop from './components/ScrollToTop/ScrollToTop';

import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Products from './pages/Products/Products';
import Contact from './pages/Contact/Contact';
import ProductDetails from './pages/ProductDetails/ProductDetails';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Cart from './pages/Cart/Cart';
import Checkout from './pages/Checkout/Checkout';
import Payment from './pages/Payment/Payment';
import Confirmation from './pages/Confirmation/Confirmation';
import Orders from './pages/Orders/Orders';
import Account from './pages/Account/Account';

function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <BrowserRouter>
                    <ScrollToTop />

                    <Routes>

                        <Route element={<MainLayout />}>
                            <Route path="/" element={<Home />} />
                            <Route path="*" element={<Home />} />
                            <Route path="/inicio" element={<Home />} />
                            <Route path="/minha-conta" element={<Account />} />
                            <Route path="/produtos" element={<Products />} />
                            <Route path="/produtos/:id" element={<ProductDetails />} />
                            <Route path="/contato" element={<Contact />} />
                        </Route>

                        <Route element={<SimpleLayout />}>
                            <Route path="/login" element={<Login />} />
                            <Route path="/cadastro" element={<Register />} />
                            <Route path="/carrinho" element={<Cart />} />
                            <Route path="/checkout" element={<Checkout />} />
                            <Route path="/pagamento" element={<Payment />} />
                            <Route path="/pagamento" element={<Payment />} />
                            <Route path="/confirmacao" element={<Confirmation />} />
                            <Route path="/pedidos" element={<Orders />} />
                        </Route>

                    </Routes>
                </BrowserRouter>
            </CartProvider>
        </AuthProvider>

    );
}

export default App;