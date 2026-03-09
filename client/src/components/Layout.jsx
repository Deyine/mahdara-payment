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
    navigate('/admin/login');
  };

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navItems = [
    { path: '/admin', label: 'لوحة التحكم', icon: '📊', adminOnly: false },
    { path: '/admin/employees', label: 'الموظفون', icon: '👥', adminOnly: false },
    { path: '/admin/payments', label: 'المدفوعات', icon: '💰', adminOnly: false },
    { path: '/admin/settings', label: 'الإعدادات', icon: '⚙️', adminOnly: true },
  ];

  const handleNavClick = () => {
    setDrawerOpen(false);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafbfc' }}>
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40" style={{ borderBottom: '1px solid #e2e8f0' }}>
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex justify-between items-center" style={{ direction: 'rtl' }}>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDrawerOpen(true)}
                className="md:hidden p-2 rounded-lg transition-colors"
                style={{ color: '#1e293b' }}
                aria-label="فتح القائمة"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-lg sm:text-xl font-bold text-white"
                  style={{ backgroundColor: '#167bff' }}
                >
                  م
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold" style={{ color: '#1e293b' }}>
                    Mahdara
                  </h1>
                  <p className="text-xs" style={{ color: '#64748b' }}>إدارة المدفوعات</p>
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <div>
                <p className="font-medium text-sm" style={{ color: '#1e293b' }}>{user?.name}</p>
                <p className="text-xs" style={{ color: '#64748b' }}>
                  {user?.role === 'super_admin' ? 'مشرف عام' : user?.role === 'admin' ? 'مشرف' : 'مدير'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#fee2e2'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#fef2f2'}
              >
                تسجيل الخروج
              </button>
            </div>

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
          <div className="flex gap-1" style={{ direction: 'rtl' }}>
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
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setDrawerOpen(false)}
          />
          <div
            className="fixed top-0 right-0 bottom-0 w-64 bg-white z-50 md:hidden shadow-2xl"
            style={{ animation: 'slideInFromRight 0.3s ease-out', borderLeft: '1px solid #e2e8f0' }}
          >
            <div className="p-4 border-b" style={{ borderColor: '#e2e8f0' }}>
              <div className="flex items-center justify-between mb-4" style={{ direction: 'rtl' }}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold text-white"
                    style={{ backgroundColor: '#167bff' }}
                  >
                    م
                  </div>
                  <h2 className="font-bold text-lg" style={{ color: '#1e293b' }}>Mahdara</h2>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="إغلاق القائمة"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: '#f8fafc', direction: 'rtl' }}>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white"
                  style={{ backgroundColor: '#167bff' }}
                >
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm" style={{ color: '#1e293b' }}>{user?.name}</p>
                  <p className="text-xs" style={{ color: '#64748b' }}>
                    {user?.role === 'super_admin' ? 'مشرف عام' : user?.role === 'admin' ? 'مشرف' : 'مدير'}
                  </p>
                </div>
              </div>
            </div>

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

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t" style={{ borderColor: '#e2e8f0' }}>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                تسجيل الخروج
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slideInFromRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>

      <main className="pb-8">{children}</main>
    </div>
  );
}
