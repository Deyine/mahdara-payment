import { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function DropdownGroup({ label, icon, items, isActive }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="px-6 py-4 font-medium transition-colors flex items-center gap-1"
        style={{
          color: isActive ? '#167bff' : '#64748b',
          borderBottom: isActive ? '2px solid #167bff' : '2px solid transparent',
          marginBottom: '-1px',
          background: 'none',
          border: 'none',
          borderBottom: isActive ? '2px solid #167bff' : '2px solid transparent',
          cursor: 'pointer',
          fontSize: '14px',
          fontFamily: 'inherit'
        }}
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#1e293b'; }}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '#64748b'; }}
      >
        <span className="ml-1">{icon}</span>
        {label}
        <span style={{ fontSize: '10px', marginRight: '4px', opacity: 0.7 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, zIndex: 100,
          backgroundColor: 'white', border: '1px solid #e2e8f0',
          borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          minWidth: '180px', overflow: 'hidden'
        }}>
          {items.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 16px', fontSize: '14px', textDecoration: 'none',
                color: item.active ? '#167bff' : '#374151',
                backgroundColor: item.active ? '#eff6ff' : 'white',
                fontWeight: item.active ? '600' : '400'
              }}
              onMouseEnter={e => { if (!item.active) e.currentTarget.style.backgroundColor = '#f8fafc'; }}
              onMouseLeave={e => { if (!item.active) e.currentTarget.style.backgroundColor = 'white'; }}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Settings() {
  const location = useLocation();
  const { isSuperAdmin } = useAuth();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path);

  const groups = [
    {
      label: 'الموظفون',
      icon: '👥',
      items: [
        { path: '/admin/settings/employee-types', label: 'أنواع الموظفين', icon: '🏷️' },
        { path: '/admin/settings/banks', label: 'البنوك', icon: '🏦' },
        { path: '/admin/settings/salary-amounts', label: 'مبالغ الرواتب', icon: '💰' },
      ],
    },
    {
      label: 'المواقع',
      icon: '🗺️',
      items: [
        { path: '/admin/settings/wilayas', label: 'الولايات', icon: '🗺️' },
        { path: '/admin/settings/moughataa', label: 'المقاطعات', icon: '📍' },
        { path: '/admin/settings/communes', label: 'البلديات', icon: '🏘️' },
        { path: '/admin/settings/villages', label: 'القرى', icon: '🏡' },
      ],
    },
    {
      label: 'المستخدمون',
      icon: '👤',
      items: [
        { path: '/admin/settings/users', label: 'المستخدمون', icon: '👤' },
        ...(isSuperAdmin ? [{ path: '/admin/settings/roles', label: 'الأدوار', icon: '🔐' }] : []),
      ],
    },
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
            {groups.map(group => {
              const groupActive = group.items.some(i => isActive(i.path));
              return (
                <DropdownGroup
                  key={group.label}
                  label={group.label}
                  icon={group.icon}
                  isActive={groupActive}
                  items={group.items.map(i => ({ ...i, active: isActive(i.path) }))}
                />
              );
            })}
          </div>
        </div>

        <Outlet />
      </div>
    </div>
  );
}
