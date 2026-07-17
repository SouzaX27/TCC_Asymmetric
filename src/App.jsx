// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout, SimpleLayout } from './layouts/Layout';

import Home from './pages/Home/Home';
import Products from './pages/Products/Products';
import Contact from './pages/Contact/Contact';

import ScrollToTop from './components/ScrollToTop/ScrollToTop';

function App() {
    return (
        <BrowserRouter>
            <ScrollToTop />

            <Routes>

                <Route element={<MainLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/inicio" element={<Home />} />
                    <Route path="/produtos" element={<Products />} />
                    <Route path="/contato" element={<Contact />} />
                </Route>

                <Route element={<SimpleLayout />}>
                    {/* <Route path="/login" element={<Login />} />
                    <Route path="/carrinho" element={<Carrinho />} /> */}
                </Route>

            </Routes>
        </BrowserRouter>
    );
}

export default App;