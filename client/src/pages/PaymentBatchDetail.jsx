import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';
import { paymentBatchesAPI } from '../services/api';

export default function PaymentBatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { showAlert, showConfirm } = useDialog();
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchBatch(); }, [id]);

  const fetchBatch = async () => {
    try {
      setLoading(true);
      const res = await paymentBatchesAPI.getById(id);
      setBatch(res.data);
    } catch {
      await showAlert('خطأ في تحميل الدفعة', 'error');
      navigate('/admin/payments');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    const ok = await showConfirm(
      'بعد التأكيد لن يمكن تعديل أو حذف هذه الدفعة. هل تريد المتابعة؟',
      'تأكيد الدفعة'
    );
    if (!ok) return;
    try {
      const res = await paymentBatchesAPI.confirm(batch.id);
      setBatch(res.data);
      await showAlert('تم تأكيد الدفعة بنجاح', 'success');
    } catch (err) {
      await showAlert(err.response?.data?.error || 'خطأ في التأكيد', 'error');
    }
  };

  const handleExport = async () => {
    try {
      const res = await paymentBatchesAPI.export(batch.id);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `paiement-${batch.payment_date}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      await showAlert('خطأ في تصدير الملف', 'error');
    }
  };

  const handleRevert = async () => {
    const ok = await showConfirm(
      'سيتم إعادة الدفعة إلى حالة المسودة. هل تريد المتابعة؟',
      'إعادة إلى مسودة'
    );
    if (!ok) return;
    try {
      const res = await paymentBatchesAPI.revert(batch.id);
      setBatch(res.data);
      await showAlert('تمت إعادة الدفعة إلى المسودة', 'success');
    } catch (err) {
      await showAlert(err.response?.data?.error || 'خطأ في الإعادة', 'error');
    }
  };

  const handleDelete = async () => {
    const confirmed = await showConfirm(
      `هل تريد حذف دفعة ${batch.payment_date}؟`,
      'حذف الدفعة'
    );
    if (!confirmed) return;
    try {
      await paymentBatchesAPI.delete(batch.id);
      await showAlert('تم حذف الدفعة', 'success');
      navigate('/admin/payments');
    } catch (err) {
      await showAlert(err.response?.data?.error || 'خطأ في الحذف', 'error');
    }
  };

  const statusBadge = (status) => ({
    draft: { label: 'مسودة', bg: '#fef9c3', color: '#854d0e' },
    confirmed: { label: 'مؤكد', bg: '#dcfce7', color: '#166534' }
  }[status] || { label: status, bg: '#f1f5f9', color: '#64748b' });

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#fafbfc' }}>
        <div style={{ textAlign: 'center', padding: '80px', color: '#64748b' }}>جارٍ التحميل...</div>
      </div>
    );
  }

  if (!batch) return null;

  const badge = statusBadge(batch.status);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafbfc' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div style={{ marginBottom: '24px', direction: 'rtl' }}>
          <button onClick={() => navigate('/admin/payments')} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '14px', padding: 0, marginBottom: '12px'
          }}>← العودة إلى الدفعات</button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', direction: 'rtl' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#1e293b' }}>
                دفعة {batch.payment_date}
              </h1>
              <p style={{ margin: '4px 0 0', color: '#64748b' }}>
                أُنشئت بواسطة {batch.created_by?.name || '—'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{
                padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
                backgroundColor: badge.bg, color: badge.color
              }}>{badge.label}</span>
              {batch.status === 'confirmed' && (
                <button onClick={handleExport} style={{
                  padding: '8px 16px', borderRadius: '6px', border: '1px solid #10b981',
                  color: '#10b981', backgroundColor: 'white', cursor: 'pointer', fontSize: '14px'
                }}>⬇ تصدير Excel</button>
              )}
              {hasPermission('payment_batches:confirm') && batch.status === 'confirmed' && (
                <button onClick={handleRevert} style={{
                  padding: '8px 16px', borderRadius: '6px', border: '1px solid #f59e0b',
                  color: '#f59e0b', backgroundColor: 'white', cursor: 'pointer', fontSize: '14px'
                }}>إعادة إلى مسودة</button>
              )}
              {hasPermission('payment_batches:create') && batch.status === 'draft' && (
                <button onClick={() => navigate(`/admin/payments/new?edit=${batch.id}`)} style={{
                  padding: '8px 16px', borderRadius: '6px', border: '1px solid #167bff',
                  color: '#167bff', backgroundColor: 'white', cursor: 'pointer', fontSize: '14px'
                }}>تعديل</button>
              )}
              {hasPermission('payment_batches:confirm') && batch.status === 'draft' && (
                <button onClick={handleConfirm} style={{
                  padding: '8px 16px', borderRadius: '6px', border: 'none',
                  color: 'white', backgroundColor: '#167bff', cursor: 'pointer', fontSize: '14px', fontWeight: '600'
                }}>تأكيد الدفعة</button>
              )}
              {hasPermission('payment_batches:delete') && batch.status === 'draft' && (
                <button onClick={handleDelete} style={{
                  padding: '8px 16px', borderRadius: '6px', border: '1px solid #ef4444',
                  color: '#ef4444', backgroundColor: 'white', cursor: 'pointer', fontSize: '14px'
                }}>حذف الدفعة</button>
              )}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px', direction: 'rtl' }}>
          <div className="bg-white rounded-lg shadow-sm p-5" style={{ border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>عدد الموظفين</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e293b' }}>{batch.employees_count}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-5" style={{ border: '2px solid #167bff', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>إجمالي الدفعة</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#167bff' }}>
              {Number(batch.total).toLocaleString()} <span style={{ fontSize: '14px' }}>MRU</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-5" style={{ border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>تاريخ الدفع</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e293b' }}>{batch.payment_date}</div>
          </div>
        </div>

        {/* Notes */}
        {batch.notes && (
          <div className="bg-white rounded-lg shadow-sm p-5 mb-6" style={{ border: '1px solid #e2e8f0', direction: 'rtl' }}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>ملاحظات</div>
            <div style={{ fontSize: '14px', color: '#1e293b' }}>{batch.notes}</div>
          </div>
        )}

        {/* Employees Table */}
        <div className="bg-white rounded-lg shadow-sm" style={{ border: '1px solid #e2e8f0' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', direction: 'rtl' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>الموظفون</h2>
          </div>
          <table dir="rtl" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>الموظف</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>المبلغ / شهر</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>عدد الأشهر</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>المجموع</th>
              </tr>
            </thead>
            <tbody>
              {(batch.employees || []).map(emp => (
                <tr key={emp.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>
                    {emp.employee_name}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>
                    {Number(emp.amount).toLocaleString()} MRU
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>
                    {emp.months_count}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                    {(Number(emp.amount) * emp.months_count).toLocaleString()} MRU
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                <td colSpan={3} style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>المجموع الكلي</td>
                <td style={{ padding: '12px 16px', fontSize: '16px', fontWeight: 'bold', color: '#167bff' }}>
                  {Number(batch.total).toLocaleString()} MRU
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

      </div>
    </div>
  );
}
