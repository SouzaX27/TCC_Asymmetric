import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';

// 'children' ==== qualquer página que entrar, ou seja, seu conteudo 
function MainLayout({ children }) {
  return (
    <div>

      <Navbar />

      <main>
        {children}
      </main>

      <Footer />

    </div>
  );
}

export default MainLayout;