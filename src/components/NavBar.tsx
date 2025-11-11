import React from 'react';
import { Link } from 'react-router';
export const Navbar: React.FC = () => {
return (
<nav >
<Link to="/">Home</Link>
<Link to="/about">About</Link>
</nav>
);
};