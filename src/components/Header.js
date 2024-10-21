import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/components.css';

const Header = () => {
  return (
    <header className="header">
      <div className="logo">College Portal</div>
      <nav className="nav">
        <Link to="/">Home</Link>
        <Link to="/profile">Profile</Link>
      </nav>
    </header>
  );
};

export default Header;
