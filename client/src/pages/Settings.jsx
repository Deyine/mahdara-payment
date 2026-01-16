import { Link, Outlet, useLocation } from 'react-router-dom';

export default function Settings() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const settingsMenuItems = [
    { path: '/settings/car-models', label: 'Modèles de Véhicules', icon: '🚗' },
    { path: '/settings/expense-categories', label: 'Catégories de Dépenses', icon: '💰' },
    { path: '/settings/sellers', label: 'Vendeurs', icon: '🏢' },
    { path: '/settings/payment-methods', label: 'Modes de Paiement', icon: '💳' },
    { path: '/settings/tags', label: 'Tags', icon: '🏷️' },
    { path: '/settings/users', label: 'Utilisateurs', icon: '👤' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafbfc' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: '#1e293b' }}>Paramètres</h1>
          <p style={{ color: '#64748b' }}>Gérer les paramètres de l'application</p>
        </div>

        {/* Sub Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6" style={{ border: '1px solid #e2e8f0' }}>
          <div className="flex border-b" style={{ borderColor: '#e2e8f0' }}>
            {settingsMenuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="px-6 py-4 font-medium transition-colors"
                style={{
                  color: isActive(item.path) ? '#167bff' : '#64748b',
                  borderBottom: isActive(item.path) ? '2px solid #167bff' : '2px solid transparent',
                  marginBottom: '-1px'
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
            ))}
          </div>
        </div>

        {/* Content */}
        <Outlet />
      </div>
    </div>
  );
}
