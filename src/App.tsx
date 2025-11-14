import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { Navbar } from './components/NavBar';
import LoginPage from './pages/LoginPage';
import CompleteProfile from './pages/CompleteProfile';

const App: React.FC = () => {
    return (
        <BrowserRouter>
            <Navbar />
            <main>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/complete-profile" element={<CompleteProfile />} />
                </Routes>
            </main>
        </BrowserRouter>
    );
};
export default App;