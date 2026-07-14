// src/App.jsx
// import MainLayout from './layouts/Layout';
// import Home from './pages/Home/Home';

// function App() {
//   return (
//     <MainLayout>
//       <Home />
//     </MainLayout>
//   );
// }

// export default App;

///////////////////////////

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/Layout'; // O seu Mainlayout atual (que tem a Navbar)
import Home from './pages/Home/Home';

function App() {
    return (
        <BrowserRouter>
            <Routes>

                {/* O MainLayout engloba a Home, aplicando a Navbar (e o Link) dentro do contexto correto */}
                <Route element={<MainLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/home" element={<Home />} />
                </Route>

            </Routes>
        </BrowserRouter>
    );
}

export default App;