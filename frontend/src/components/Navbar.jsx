import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, Globe, Menu, X, ShieldCheck, HeartPulse, Stethoscope } from 'lucide-react';
import { getHealthStatus } from '../services/api';

export default function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isServerHealthy, setIsServerHealthy] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('EN');
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  // Check backend server status
  useEffect(() => {
    getHealthStatus()
      .then((data) => {
        setIsServerHealthy(data.status === 'healthy' && data.model_loaded);
      })
      .catch(() => {
        setIsServerHealthy(false);
      });
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setLangDropdownOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Murmur Screening', path: '/analyze' },
    { label: 'How It Works', path: '/#how-it-works' },
    { label: 'Clinical Responsibility', path: '/#clinical' },
    { label: 'About', path: '/#about' },
    { label: 'Contact', path: '/#contact' },
  ];

  const languages = [
    { code: 'EN', name: 'English (US)' },
    { code: 'HI', name: 'हिंदी (Hindi)' },
    { code: 'ES', name: 'Español' },
  ];

  return (
    <header className="sticky top-0 z-50 glass-header transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo & Wordmark */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#E85B3F] to-[#D9432B] flex items-center justify-center text-white shadow-md shadow-coral-500/20 group-hover:scale-105 transition-transform">
              <HeartPulse className="w-6 h-6 animate-heart-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-[#E85B3F] transition-colors">
                  Cardio<span className="text-[#E85B3F]">Lens</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-coral-50 text-[#E85B3F] border border-coral-200">
                  CNN v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium tracking-wide">
                AI Heart Murmur Screening Platform
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path && !link.path.includes('#');
              return (
                <a
                  key={link.label}
                  href={link.path}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-[#E85B3F] bg-coral-50/70 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          {/* Right Action Toolbar */}
          <div className="hidden sm:flex items-center space-x-3">
            
            {/* System Status Pill */}
            <div 
              className={`flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                isServerHealthy 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
              title={isServerHealthy ? "PyTorch CNN Model Loaded & Ready" : "Backend connecting..."}
            >
              <span className={`w-2 h-2 rounded-full mr-1.5 ${isServerHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-[11px] font-semibold">
                {isServerHealthy ? 'AI Model Online' : 'Connecting'}
              </span>
            </div>

            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100/80 border border-slate-200/80 transition-colors"
                aria-expanded={langDropdownOpen}
              >
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span>{selectedLanguage}</span>
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-lg border border-slate-200/80 py-1 z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setSelectedLanguage(lang.code);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-coral-50 hover:text-[#E85B3F] ${
                        selectedLanguage === lang.code ? 'text-[#E85B3F] font-bold bg-coral-50/40' : 'text-slate-700'
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Primary Action Button */}
            <Link
              to="/analyze"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold btn-coral-primary transition-all"
            >
              <Stethoscope className="w-4 h-4 mr-1.5" />
              <span>Analyze Heart Sound</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center sm:hidden space-x-2">
            <Link
              to="/analyze"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold btn-coral-primary"
            >
              Analyze
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 bg-white/95 backdrop-blur-xl px-4 pt-2 pb-6 space-y-2">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.path}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#E85B3F]"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center text-xs text-slate-500 font-medium">
              <span className={`w-2 h-2 rounded-full mr-2 ${isServerHealthy ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {isServerHealthy ? 'CardioLens AI Model Online' : 'Connecting to Server'}
            </div>
            <Link
              to="/analyze"
              className="px-4 py-2 rounded-lg text-xs font-bold btn-coral-primary"
            >
              Launch Screening
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
