import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { Navbar } from './components/NavBar';

const App: React.FC = () => {
return (
<BrowserRouter>
<Navbar />
<main>
<Routes>
<Route path="/" element={<HomePage />} />
<Route path="/about" element={<AboutPage />} />
</Routes>
</main>
</BrowserRouter>
);
};
export default App;