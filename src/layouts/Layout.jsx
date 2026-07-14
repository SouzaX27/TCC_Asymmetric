import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';

function MainLayout() {
    return (
        <div className="d-flex flex-column min-vh-100">
            <Navbar />
            
            <main className="flex-grow-1s mt-5"> 
                
                <Outlet /> 
                
            </main>
            
            <Footer />
        </div>
    );
}

export default MainLayout;