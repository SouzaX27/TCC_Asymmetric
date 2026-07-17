import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';

export function MainLayout() {
    return (
        <div className="d-flex flex-column min-vh-100">
            <Navbar />
            
            <main className="flex-grow-1 mt-5"> 
                
                <Outlet /> 
                
            </main>
            
            <Footer />
        </div>
    );
}

export function SimpleLayout() {
    return (
        <div className="d-flex flex-column min-vh-100">
            <Navbar />
            
            <main className="flex-grow-1 mt-5"> 
                
                <Outlet /> 
                
            </main>
            
        </div>
    );
}

