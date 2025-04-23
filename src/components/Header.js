import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-gray-950 shadow-lg border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="text-white text-2xl font-bold">🎓 College Portal</div>
        <nav className="space-x-4 text-gray-300">
          <Link to="/" className="hover:text-white transition">Home</Link>
          <Link to="/profile" className="hover:text-white transition">Profile</Link>
          <Link to="/resources" className="hover:text-white transition">Study Resources</Link>
          <Link to="/assignments" className="hover:text-white transition">Assignments</Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
