import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

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
    setDrawerOpen(false);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafbfc' }}>
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40" style={{ borderBottom: '1px solid #e2e8f0' }}>
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            {/* Mobile: Hamburger + Logo */}
            <div className="flex items-center gap-3">
              {/* Hamburger Menu Button - Mobile Only */}
              <button
                onClick={() => setDrawerOpen(true)}
                className="md:hidden p-2 rounded-lg transition-colors"
                style={{ color: '#1e293b' }}
                aria-label="Ouvrir le menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

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
            </div>

            {/* Desktop: User Info & Logout */}
            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium text-sm" style={{ color: '#1e293b' }}>{user?.name}</p>
                <p className="text-xs" style={{ color: '#64748b' }}>
                  {user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'admin' ? 'Administrateur' : user?.role === 'manager' ? 'Manager' : 'Opérateur'}
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

            {/* Mobile: User Icon (optional - shows current user) */}
            <div className="md:hidden">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ backgroundColor: '#167bff' }}
              >
                {user?.name?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Navigation */}
      <nav className="hidden md:block bg-white shadow-sm" style={{ borderBottom: '1px solid #e2e8f0' }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {navItems.map((item) => {
              if (item.adminOnly && !isAdmin) return null;

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

      {/* Mobile Navigation Drawer */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setDrawerOpen(false)}
            style={{ transition: 'opacity 0.3s ease-in-out' }}
          />

          {/* Drawer */}
          <div
            className="fixed top-0 left-0 bottom-0 w-64 bg-white z-50 md:hidden shadow-2xl"
            style={{
              animation: 'slideInFromLeft 0.3s ease-out',
              borderRight: '1px solid #e2e8f0'
            }}
          >
            {/* Drawer Header */}
            <div className="p-4 border-b" style={{ borderColor: '#e2e8f0' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold text-white"
                    style={{ backgroundColor: '#167bff' }}
                  >
                    B
                  </div>
                  <div>
                    <h2 className="font-bold text-lg" style={{ color: '#1e293b' }}>BestCar</h2>
                  </div>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Fermer le menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* User Info */}
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: '#f8fafc' }}>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white"
                  style={{ backgroundColor: '#167bff' }}
                >
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm" style={{ color: '#1e293b' }}>{user?.name}</p>
                  <p className="text-xs" style={{ color: '#64748b' }}>
                    {user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'admin' ? 'Administrateur' : user?.role === 'manager' ? 'Manager' : 'Opérateur'}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Items */}
            <nav className="p-4">
              {navItems.map((item) => {
                if (item.adminOnly && !isAdmin) return null;

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
            </nav>

            {/* Logout Button at Bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t" style={{ borderColor: '#e2e8f0' }}>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Déconnexion
              </button>
            </div>
          </div>
        </>
      )}

      {/* Slide-in Animation */}
      <style>{`
        @keyframes slideInFromLeft {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>

      {/* Main Content */}
      <main className="pb-8">{children}</main>
    </div>
  );
}
