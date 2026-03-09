import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getStatistics()
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = stats ? [
    {
      title: 'الموظفون النشطون',
      value: stats.employees?.active ?? 0,
      sub: `المجموع: ${stats.employees?.total ?? 0}`,
      color: '#167bff',
      onClick: () => navigate('/admin/employees')
    },
    {
      title: 'دفعات الراتب',
      value: stats.payment_batches?.total ?? 0,
      sub: `${stats.payment_batches?.draft ?? 0} مسودة`,
      color: '#10b981',
      onClick: () => navigate('/admin/payments')
    },
    {
      title: 'أنواع الموظفين',
      value: stats.employee_types ?? 0,
      sub: 'أنواع مُعدّة',
      color: '#8b5cf6',
      onClick: () => navigate('/admin/settings/employee-types')
    },
  ] : [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafbfc' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#1e293b' }}>لوحة التحكم</h1>
          <p style={{ margin: '6px 0 0', color: '#64748b' }}>نظرة عامة على التطبيق</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>جارٍ التحميل...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {cards.map(card => (
              <div key={card.title} onClick={card.onClick} className="bg-white rounded-lg shadow-sm p-6"
                style={{ border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                  {card.title}
                </div>
                <div style={{ fontSize: '42px', fontWeight: 'bold', color: card.color, marginBottom: '4px' }}>
                  {card.value}
                </div>
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>{card.sub}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
