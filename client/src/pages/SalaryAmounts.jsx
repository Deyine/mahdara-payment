import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';
import { salaryAmountsAPI } from '../services/api';

export default function SalaryAmounts() {
  const { canWrite } = useAuth();
  const { showAlert, showConfirm } = useDialog();
  const [amounts, setAmounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newAmount, setNewAmount] = useState('');

  useEffect(() => { fetchAmounts(); }, []);

  const fetchAmounts = async () => {
    try {
      setLoading(true);
      const res = await salaryAmountsAPI.getAll();
      setAmounts(res.data);
    } catch {
      await showAlert('خطأ في التحميل', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsed = parseInt(newAmount, 10);
    if (!parsed || parsed <= 0) {
      await showAlert('يرجى إدخال مبلغ صحيح', 'error');
      return;
    }
    try {
      await salaryAmountsAPI.create(parsed);
      setShowForm(false);
      setNewAmount('');
      fetchAmounts();
    } catch (err) {
      await showAlert(err.response?.data?.errors?.[0] || 'خطأ في الحفظ', 'error');
    }
  };

  const handleDelete = async (sa) => {
    const confirmed = await showConfirm(
      `حذف المبلغ "${sa.amount.toLocaleString()} أوقية" ؟`,
      'حذف المبلغ'
    );
    if (!confirmed) return;
    try {
      await salaryAmountsAPI.delete(sa.id);
      fetchAmounts();
    } catch (err) {
      await showAlert(err.response?.data?.error || 'خطأ في الحذف', 'error');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6" style={{ border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', direction: 'rtl' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#1e293b' }}>مبالغ الرواتب</h2>
        {canWrite && !showForm && (
          <button onClick={() => setShowForm(true)} style={{
            backgroundColor: '#167bff', color: 'white', padding: '8px 16px',
            borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold'
          }}>+ إضافة مبلغ</button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{
          display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px',
          direction: 'rtl', padding: '16px', backgroundColor: '#f8fafc',
          borderRadius: '8px', border: '1px solid #e2e8f0'
        }}>
          <input
            type="number"
            value={newAmount}
            onChange={e => setNewAmount(e.target.value)}
            placeholder="أدخل المبلغ..."
            autoFocus
            min="1"
            required
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', width: '180px' }}
          />
          <span style={{ fontSize: '14px', color: '#64748b' }}>أوقية</span>
          <button type="submit" style={{
            padding: '8px 16px', borderRadius: '6px', border: 'none',
            backgroundColor: '#167bff', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px'
          }}>إضافة</button>
          <button type="button" onClick={() => { setShowForm(false); setNewAmount(''); }} style={{
            padding: '8px 16px', borderRadius: '6px', border: '1px solid #ddd',
            backgroundColor: 'white', cursor: 'pointer', fontSize: '14px'
          }}>إلغاء</button>
        </form>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>جارٍ التحميل...</div>
      ) : amounts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>لا يوجد مبلغ مسجل.</div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', direction: 'rtl' }}>
          {amounts.map(sa => (
            <div key={sa.id} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc', fontSize: '14px', fontWeight: '600', color: '#1e293b'
            }}>
              <span>{sa.amount.toLocaleString()} أوقية</span>
              {canWrite && (
                <button onClick={() => handleDelete(sa)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#ef4444', fontSize: '16px', lineHeight: 1, padding: '0 2px'
                }}>×</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
