import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const location = useLocation();
  const { isSuperAdmin } = useAuth();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const settingsMenuItems = [
    { path: '/admin/settings/employee-types', label: 'أنواع الموظفين', icon: '👥' },
    { path: '/admin/settings/wilayas', label: 'الولايات', icon: '🗺️' },
    { path: '/admin/settings/moughataa', label: 'المقاطعات', icon: '📍' },
    { path: '/admin/settings/communes', label: 'البلديات', icon: '🏘️' },
    { path: '/admin/settings/villages', label: 'القرى', icon: '🏡' },
    { path: '/admin/settings/banks', label: 'البنوك', icon: '🏦' },
    { path: '/admin/settings/salary-amounts', label: 'مبالغ الرواتب', icon: '💰' },
    { path: '/admin/settings/users', label: 'المستخدمون', icon: '👤' },
    ...(isSuperAdmin ? [{ path: '/admin/settings/roles', label: 'الأدوار', icon: '🔐' }] : []),
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafbfc' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8" style={{ direction: 'rtl' }}>
          <h1 className="text-3xl font-bold" style={{ color: '#1e293b' }}>الإعدادات</h1>
          <p style={{ color: '#64748b' }}>إدارة إعدادات التطبيق</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm mb-6" style={{ border: '1px solid #e2e8f0' }}>
          <div className="flex flex-wrap border-b" style={{ borderColor: '#e2e8f0', direction: 'rtl' }}>
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
                <span className="ml-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <Outlet />
      </div>
    </div>
  );
}
