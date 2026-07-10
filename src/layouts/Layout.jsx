import Navbar from '../components/Navbar/Navbar';

// Ele recebe 'children', que representa qualquer página que entrar aqui dentro
function Layout({ children }) {
  return (
    <div>
      {/* A Navbar fica fixa aqui no topo para sempre */}
      <Navbar />

      {/* As páginas (Home, Cart, etc.) vão se encaixar automaticamente aqui embaixo */}
      <main>
        {children}
      </main>
    </div>
  );
}

export default Layout;