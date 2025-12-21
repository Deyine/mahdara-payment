import { useState, useEffect } from 'react';
import { resultsAPI } from '../../services/api';

export default function Statistics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const response = await resultsAPI.getStatistics();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border-r-4 rounded-lg p-6 shadow-sm" style={{ borderColor: '#167bff', border: '1px solid #e2e8f0' }}>
          <h3 className="text-sm mb-2" style={{ color: '#64748b' }}>إجمالي المترشحين</h3>
          <p className="text-4xl font-bold" style={{ color: '#1e293b' }}>{stats?.total_candidates || 0}</p>
        </div>

        <div className="bg-white border-r-4 rounded-lg p-6 shadow-sm" style={{ borderColor: '#167bff', border: '1px solid #e2e8f0' }}>
          <h3 className="text-sm mb-2" style={{ color: '#64748b' }}>إجمالي التخصصات</h3>
          <p className="text-4xl font-bold" style={{ color: '#1e293b' }}>{stats?.total_filieres || 0}</p>
        </div>

        <div className="bg-white border-r-4 rounded-lg p-6 shadow-sm" style={{ borderColor: '#167bff', border: '1px solid #e2e8f0' }}>
          <h3 className="text-sm mb-2" style={{ color: '#64748b' }}>إجمالي المشغلين</h3>
          <p className="text-4xl font-bold" style={{ color: '#1e293b' }}>{stats?.total_operators || 0}</p>
        </div>

        <div className="bg-white border-r-4 rounded-lg p-6 shadow-sm" style={{ borderColor: '#167bff', border: '1px solid #e2e8f0' }}>
          <h3 className="text-sm mb-2" style={{ color: '#64748b' }}>النقاط المدخلة</h3>
          <p className="text-4xl font-bold" style={{ color: '#1e293b' }}>{stats?.total_notes_entered || 0}</p>
        </div>

        <div className="bg-white border-r-4 rounded-lg p-6 shadow-sm" style={{ borderColor: '#167bff', border: '1px solid #e2e8f0' }}>
          <h3 className="text-sm mb-2" style={{ color: '#64748b' }}>حالات النزاع</h3>
          <p className="text-4xl font-bold" style={{ color: '#1e293b' }}>{stats?.total_litiges || 0}</p>
        </div>
      </div>

      {/* Progress by Filiere */}
      <div className="bg-white rounded-lg shadow-sm p-6" style={{ border: '1px solid #e2e8f0' }}>
        <h3 className="text-xl font-bold mb-4" style={{ color: '#1e293b' }}>التقدم حسب التخصص</h3>
        <div className="space-y-4">
          {stats?.completion_by_filiere?.map((item) => (
            <div key={item.filiere_id}>
              <div className="flex justify-between mb-1">
                <span className="font-medium" style={{ color: '#1e293b' }}>{item.filiere_name}</span>
                <span style={{ color: '#64748b' }}>
                  {item.notes_entered} / {item.total_candidates} ({item.percentage}%)
                </span>
              </div>
              <div className="w-full rounded-full h-2" style={{ backgroundColor: '#e2e8f0' }}>
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${item.percentage}%`, backgroundColor: '#167bff' }}
                ></div>
              </div>
            </div>
          ))}
          {(!stats?.completion_by_filiere || stats.completion_by_filiere.length === 0) && (
            <div className="text-center py-4" style={{ color: '#64748b' }}>
              لا توجد بيانات متاحة حالياً
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
