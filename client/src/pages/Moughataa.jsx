import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';
import { moughataaAPI, wilayasAPI } from '../services/api';

export default function Moughataa() {
  const { canWrite } = useAuth();
  const { showAlert, showConfirm } = useDialog();
  const [items, setItems] = useState([]);
  const [wilayas, setWilayas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterWilayaId, setFilterWilayaId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ name: '', wilaya_id: '' });
  const [importing, setImporting] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    Promise.all([fetchItems(), fetchWilayas()]);
  }, []);

  useEffect(() => { fetchItems(); }, [filterWilayaId]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const params = filterWilayaId ? { wilaya_id: filterWilayaId } : {};
      const res = await moughataaAPI.getAll(params);
      setItems(res.data);
    } catch {
      await showAlert('خطأ في التحميل', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchWilayas = async () => {
    try {
      const res = await wilayasAPI.getAll();
      setWilayas(res.data);
    } catch { /* ignore */ }
  };

  const handleCreate = () => {
    setEditing(null);
    setFormData({ name: '', wilaya_id: filterWilayaId || (wilayas[0]?.id || '') });
    setShowForm(true);
  };

  const handleEdit = (item) => {
    setEditing(item);
    setFormData({ name: item.name, wilaya_id: item.wilaya_id });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await moughataaAPI.update(editing.id, formData);
        await showAlert('تم تعديل المقاطعة', 'success');
      } else {
        await moughataaAPI.create(formData);
        await showAlert('تم إنشاء المقاطعة', 'success');
      }
      resetForm(); fetchItems();
    } catch (err) {
      await showAlert(err.response?.data?.errors?.[0] || 'خطأ', 'error');
    }
  };

  const handleDelete = async (item) => {
    const confirmed = await showConfirm(`حذف "${item.name}" ؟`, 'حذف');
    if (!confirmed) return;
    try {
      await moughataaAPI.delete(item.id);
      await showAlert('تم حذف المقاطعة', 'success');
      fetchItems();
    } catch (err) {
      await showAlert(err.response?.data?.error || 'خطأ', 'error');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    try {
      const res = await moughataaAPI.import(file);
      const { imported, skipped, errors } = res.data;
      await showAlert(`تم الاستيراد: ${imported}، تم التجاهل: ${skipped}${errors.length ? '\nأخطاء: ' + errors.join(', ') : ''}`, 'success');
      fetchItems();
    } catch (err) {
      await showAlert(err.response?.data?.error || 'خطأ في الاستيراد', 'error');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const resetForm = () => { setShowForm(false); setEditing(null); setFormData({ name: '', wilaya_id: '' }); };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6" style={{ border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#1e293b' }}>المقاطعات</h2>
        {canWrite && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => fileRef.current.click()} disabled={importing} style={{
              padding: '8px 16px', borderRadius: '6px', border: '1px solid #167bff',
              color: '#167bff', backgroundColor: 'white', cursor: 'pointer', fontSize: '14px'
            }}>{importing ? 'جارٍ الاستيراد...' : 'استيراد CSV'}</button>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleImport} style={{ display: 'none' }} />
            <button onClick={handleCreate} style={{
              backgroundColor: '#167bff', color: 'white', padding: '8px 16px',
              borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold'
            }}>+ مقاطعة جديدة</button>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '16px', direction: 'rtl' }}>
        <select value={filterWilayaId} onChange={e => setFilterWilayaId(e.target.value)} style={{
          padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', minWidth: '200px'
        }}>
          <option value="">جميع الولايات</option>
          {wilayas.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>جارٍ التحميل...</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>لا توجد مقاطعة مسجلة.</div>
      ) : (
        <table dir="rtl" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#64748b' }}>الاسم</th>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#64748b' }}>الولاية</th>
              {canWrite && <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#64748b' }}>الإجراءات</th>}
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px', fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>{item.name}</td>
                <td style={{ padding: '12px', fontSize: '14px', color: '#64748b' }}>{item.wilaya?.name || '—'}</td>
                {canWrite && (
                  <td style={{ padding: '12px', textAlign: 'left' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleEdit(item)} style={{
                        padding: '6px 12px', fontSize: '13px', backgroundColor: 'white',
                        border: '1px solid #167bff', color: '#167bff', borderRadius: '4px', cursor: 'pointer'
                      }}>تعديل</button>
                      <button onClick={() => handleDelete(item)} style={{
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
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '30px', maxWidth: '400px', width: '100%' }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 'bold', textAlign: 'right' }}>
              {editing ? 'تعديل المقاطعة' : 'مقاطعة جديدة'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500', textAlign: 'right' }}>الولاية *</label>
                <select value={formData.wilaya_id} onChange={e => setFormData({ ...formData, wilaya_id: e.target.value })}
                  required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}>
                  <option value="">اختر ولاية</option>
                  {wilayas.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500', textAlign: 'right' }}>الاسم *</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required placeholder="اسم المقاطعة" style={{
                    width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px'
                  }} />
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
