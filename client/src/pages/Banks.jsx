import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';
import { banksAPI } from '../services/api';

export default function Banks() {
  const { canWrite } = useAuth();
  const { showAlert, showConfirm } = useDialog();
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ name: '', active: true });

  useEffect(() => { fetchBanks(); }, []);

  const fetchBanks = async () => {
    try {
      setLoading(true);
      const res = await banksAPI.getAll();
      setBanks(res.data);
    } catch {
      await showAlert('خطأ في التحميل', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditing(null);
    setFormData({ name: '', active: true });
    setShowForm(true);
  };

  const handleEdit = (bank) => {
    setEditing(bank);
    setFormData({ name: bank.name, active: bank.active });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await banksAPI.update(editing.id, formData);
        await showAlert('تم تعديل البنك بنجاح', 'success');
      } else {
        await banksAPI.create(formData);
        await showAlert('تم إنشاء البنك بنجاح', 'success');
      }
      resetForm();
      fetchBanks();
    } catch (err) {
      await showAlert(err.response?.data?.errors?.[0] || 'خطأ في الحفظ', 'error');
    }
  };

  const handleDelete = async (bank) => {
    const confirmed = await showConfirm(
      `حذف البنك "${bank.name}" ؟`,
      'حذف البنك'
    );
    if (!confirmed) return;
    try {
      await banksAPI.delete(bank.id);
      await showAlert('تم حذف البنك', 'success');
      fetchBanks();
    } catch (err) {
      await showAlert(err.response?.data?.error || 'خطأ في الحذف', 'error');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setFormData({ name: '', active: true });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6" style={{ border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', direction: 'rtl' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#1e293b' }}>البنوك</h2>
        {canWrite && (
          <button onClick={handleCreate} style={{
            backgroundColor: '#167bff', color: 'white', padding: '8px 16px',
            borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold'
          }}>+ بنك جديد</button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>جارٍ التحميل...</div>
      ) : banks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>لا يوجد بنك مسجل.</div>
      ) : (
        <table dir="rtl" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#64748b' }}>الاسم</th>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#64748b' }}>الحالة</th>
              {canWrite && <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#64748b' }}>الإجراءات</th>}
            </tr>
          </thead>
          <tbody>
            {banks.map(bank => (
              <tr key={bank.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px', fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>{bank.name}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '600',
                    backgroundColor: bank.active ? '#dcfce7' : '#fee2e2',
                    color: bank.active ? '#166534' : '#dc2626'
                  }}>{bank.active ? 'نشط' : 'غير نشط'}</span>
                </td>
                {canWrite && (
                  <td style={{ padding: '12px', textAlign: 'left' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleEdit(bank)} style={{
                        padding: '6px 12px', fontSize: '13px', backgroundColor: 'white',
                        border: '1px solid #167bff', color: '#167bff', borderRadius: '4px', cursor: 'pointer'
                      }}>تعديل</button>
                      <button onClick={() => handleDelete(bank)} style={{
                        padding: '6px 12px', fontSize: '13px', backgroundColor: 'white',
                        border: '1px solid #ef4444', color: '#ef4444', borderRadius: '4px', cursor: 'pointer'
                      }}>حذف</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '30px', maxWidth: '400px', width: '100%', direction: 'rtl' }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 'bold', textAlign: 'right' }}>
              {editing ? 'تعديل البنك' : 'بنك جديد'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500', textAlign: 'right' }}>الاسم *</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required placeholder="مثال: بنك موريتانيا" style={{
                    width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px'
                  }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px' }}>
                  <input type="checkbox" checked={formData.active} onChange={e => setFormData({ ...formData, active: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#167bff' }} />
                  <span style={{ fontWeight: '500' }}>نشط</span>
                </label>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{
                  flex: 1, padding: '10px', borderRadius: '6px', border: 'none',
                  backgroundColor: '#167bff', color: 'white', cursor: 'pointer', fontWeight: 'bold'
                }}>{editing ? 'تعديل' : 'إنشاء'}</button>
                <button type="button" onClick={resetForm} style={{
                  flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ddd',
                  backgroundColor: 'white', cursor: 'pointer'
                }}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
