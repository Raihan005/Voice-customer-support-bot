import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ShoppingBag, ShoppingCart, User, LogOut, Headset, Menu, X } from 'lucide-react';
import { useState } from 'react';
import './Navbar.css';

export default function Navbar() {
  const { user, logout, cartCount } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const navLinks = [
    { path: '/shop', label: 'Shop', icon: <ShoppingBag size={18} /> },
    { path: '/cart', label: 'Cart', icon: <ShoppingCart size={18} />, badge: cartCount },
    { path: '/profile', label: 'Profile', icon: <User size={18} /> },
    { path: '/support', label: 'Support', icon: <Headset size={18} /> },
  ];

  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-inner container">
        <Link to="/shop" className="navbar-logo" id="navbar-logo">
          <ShoppingBag size={24} />
          <span>ShopVault</span>
        </Link>

        {/* Desktop Nav */}
        <div className="navbar-links">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`navbar-link ${location.pathname === link.path ? 'active' : ''}`}
              id={`nav-${link.label.toLowerCase()}`}
            >
              {link.icon}
              <span>{link.label}</span>
              {link.badge > 0 && (
                <span className="navbar-badge">{link.badge}</span>
              )}
            </Link>
          ))}
        </div>

        <div className="navbar-right">
          {user && (
            <div className="navbar-user">
              <div className="navbar-avatar">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="navbar-username">{user.name.split(' ')[0]}</span>
            </div>
          )}
          <button className="btn btn-ghost btn-sm" onClick={handleLogout} id="nav-logout">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
          <button
            className="navbar-menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="navbar-mobile-menu animate-fade-in-down">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`navbar-mobile-link ${location.pathname === link.path ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {link.icon}
              <span>{link.label}</span>
              {link.badge > 0 && (
                <span className="navbar-badge">{link.badge}</span>
              )}
            </Link>
          ))}
          <button className="navbar-mobile-link logout" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </nav>
  );
}
