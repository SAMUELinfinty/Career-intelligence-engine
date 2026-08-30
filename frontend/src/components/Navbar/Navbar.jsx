import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Briefcase, UserCheck, Lightbulb, Menu, X, Cpu } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={18} /> },
    { label: 'Jobs', path: '/jobs', icon: <Briefcase size={18} /> },
    { label: 'My Profile', path: '/profile', icon: <UserCheck size={18} /> },
    { label: 'Recommendations', path: '/recommendations', icon: <Lightbulb size={18} /> },
  ];

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        <NavLink to="/" className="navbar-brand">
          <div className="brand-icon">
            <Cpu size={22} />
          </div>
          <div className="brand-text">
            <span className="brand-title">CAREER INTELLIGENCE</span>
            <span className="brand-subtitle">ENGINE</span>
          </div>
        </NavLink>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'nav-link-active' : ''}`
              }
              end={item.path === '/'}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Mobile menu toggle */}
        <button
          className="mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <nav className="mobile-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `mobile-nav-link ${isActive ? 'mobile-nav-link-active' : ''}`
              }
              end={item.path === '/'}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
