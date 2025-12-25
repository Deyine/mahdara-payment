import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navItems = [
    { path: '/', label: 'Tableau de Bord', icon: '📊', adminOnly: false },
    { path: '/cars', label: 'Véhicules', icon: '🚗', adminOnly: false },
    { path: '/settings', label: 'Paramètres', icon: '⚙️', adminOnly: true },
  ];

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafbfc' }}>
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40" style={{ borderBottom: '1px solid #e2e8f0' }}>
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            {/* Logo/Brand */}
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-lg sm:text-xl font-bold text-white"
                style={{ backgroundColor: '#167bff' }}
              >
                B
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold" style={{ color: '#1e293b' }}>
                  BestCar
                </h1>
                <p className="text-xs" style={{ color: '#64748b' }}>Gestion de Véhicules</p>
              </div>
            </div>

            {/* Desktop: User Info & Logout */}
            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium text-sm" style={{ color: '#1e293b' }}>{user?.name}</p>
                <p className="text-xs" style={{ color: '#64748b' }}>
                  {user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'admin' ? 'Administrateur' : 'Opérateur'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#fee2e2'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#fef2f2'}
              >
                Déconnexion
              </button>
            </div>

            {/* Mobile: Hamburger Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg transition-colors"
              style={{
                backgroundColor: mobileMenuOpen ? '#eff6ff' : 'transparent',
                color: '#1e293b'
              }}
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div
            className="md:hidden bg-white"
            style={{ borderTop: '1px solid #e2e8f0' }}
          >
            {/* Mobile Navigation */}
            <div className="px-4 py-2">
              {navItems.map((item) => {
                if (item.adminOnly && user?.role !== 'admin') return null;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={handleNavClick}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors mb-1"
                    style={{
                      backgroundColor: isActive(item.path) ? '#eff6ff' : 'transparent',
                      color: isActive(item.path) ? '#167bff' : '#64748b',
                    }}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Mobile User Info & Logout */}
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{
                borderTop: '1px solid #e2e8f0',
                backgroundColor: '#fafbfc'
              }}
            >
              <div>
                <p className="font-medium text-sm" style={{ color: '#1e293b' }}>{user?.name}</p>
                <p className="text-xs" style={{ color: '#64748b' }}>
                  {user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'admin' ? 'Administrateur' : 'Opérateur'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}
              >
                Déconnexion
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Desktop Navigation */}
      <nav className="hidden md:block bg-white shadow-sm" style={{ borderBottom: '1px solid #e2e8f0' }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {navItems.map((item) => {
              if (item.adminOnly && user?.role !== 'admin') return null;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="px-4 py-3 font-medium transition-colors"
                  style={{
                    color: isActive(item.path) ? '#167bff' : '#64748b',
                    borderBottom: isActive(item.path) ? '2px solid #167bff' : '2px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive(item.path)) e.target.style.color = '#1e293b';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive(item.path)) e.target.style.color = '#64748b';
                  }}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pb-8">{children}</main>
    </div>
  );
}
