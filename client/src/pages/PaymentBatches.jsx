import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';
import { paymentBatchesAPI } from '../services/api';

export default function PaymentBatches() {
  const navigate = useNavigate();
  const { canWrite } = useAuth();
  const { showAlert, showConfirm } = useDialog();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchBatches(); }, []);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const res = await paymentBatchesAPI.getAll();
      setBatches(res.data);
    } catch {
      await showAlert('خطأ في التحميل', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (batch) => {
    const confirmed = await showConfirm(
      `حذف دفعة ${batch.payment_date}؟`,
      'حذف الدفعة'
    );
    if (!confirmed) return;
    try {
      await paymentBatchesAPI.delete(batch.id);
      await showAlert('تم حذف الدفعة', 'success');
      fetchBatches();
    } catch (err) {
      await showAlert(err.response?.data?.error || 'خطأ', 'error');
    }
  };

  const statusBadge = (status) => ({
    draft: { label: 'مسودة', bg: '#fef9c3', color: '#854d0e' },
    confirmed: { label: 'مؤكد', bg: '#dcfce7', color: '#166534' }
  }[status] || { label: status, bg: '#f1f5f9', color: '#64748b' });

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafbfc' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#1e293b' }}>دفعات المرتبات</h1>
            <p style={{ margin: '4px 0 0', color: '#64748b' }}>{batches.length} دفعة</p>
          </div>
          {canWrite && (
            <button onClick={() => navigate('/admin/payments/new')} style={{
              backgroundColor: '#167bff', color: 'white', padding: '10px 20px',
              borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold'
            }}>+ دفعة جديدة</button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm" style={{ border: '1px solid #e2e8f0' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>جارٍ التحميل...</div>
          ) : batches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
              <p style={{ fontSize: '16px', marginBottom: '12px' }}>لا توجد دفعات.</p>
              {canWrite && (
                <button onClick={() => navigate('/admin/payments/new')} style={{
                  backgroundColor: '#167bff', color: 'white', padding: '10px 20px',
                  borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold'
                }}>إنشاء أول دفعة</button>
              )}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>تاريخ الدفع</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>الحالة</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>الموظفون</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>المجموع</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>أُنشئ بواسطة</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {batches.map(batch => {
                  const badge = statusBadge(batch.status);
                  return (
                    <tr key={batch.id} style={{ borderBottom: '1px solid #e2e8f0' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>
                        {batch.payment_date}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '600',
                          backgroundColor: badge.bg, color: badge.color
                        }}>{badge.label}</span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b', textAlign: 'right' }}>
                        {batch.employees_count}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '600', color: '#1e293b', textAlign: 'right' }}>
                        {batch.total.toLocaleString()} MRU
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>
                        {batch.created_by?.name || '—'}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-start' }}>
                          <button onClick={() => navigate(`/admin/payments/${batch.id}`)} style={{
                            padding: '6px 12px', fontSize: '13px', backgroundColor: 'white',
                            border: '1px solid #167bff', color: '#167bff', borderRadius: '4px', cursor: 'pointer'
                          }}>التفاصيل</button>
                          {canWrite && batch.status === 'draft' && (
                            <button onClick={() => handleDelete(batch)} style={{
                              padding: '6px 12px', fontSize: '13px', backgroundColor: 'white',
                              border: '1px solid #ef4444', color: '#ef4444', borderRadius: '4px', cursor: 'pointer'
                            }}>حذف</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
