import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/Layout';
import Home from './pages/Home/Home';

function App() {
    return (
        <BrowserRouter>
            <Routes>

                <Route element={<MainLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/home" element={<Home />} />
                </Route>

            </Routes>
        </BrowserRouter>
    );
}

export default App;