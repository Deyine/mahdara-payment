import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafbfc' }}>
      {/* Header */}
      <header className="bg-white shadow-sm" style={{ borderBottom: '1px solid #e2e8f0' }}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo/Brand */}
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold text-white"
                style={{ backgroundColor: '#167bff' }}
              >
                B
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ color: '#1e293b' }}>
                  BestCar
                </h1>
                <p className="text-xs" style={{ color: '#64748b' }}>Gestion de Véhicules</p>
              </div>
            </div>

            {/* User Info & Logout */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium" style={{ color: '#1e293b' }}>{user?.name}</p>
                <p className="text-xs" style={{ color: '#64748b' }}>
                  {user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'admin' ? 'Administrateur' : 'Opérateur'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#fee2e2'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#fef2f2'}
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm" style={{ borderBottom: '1px solid #e2e8f0' }}>
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
      <main>{children}</main>
    </div>
  );
}
