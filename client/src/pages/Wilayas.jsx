import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';
import { wilayasAPI } from '../services/api';

export default function Wilayas() {
  const { hasPermission } = useAuth();
  const { showAlert, showConfirm } = useDialog();
  const [wilayas, setWilayas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '' });
  const [importing, setImporting] = useState(false);
  const [showCsvHelp, setShowCsvHelp] = useState(false);
  const fileRef = useRef();

  useEffect(() => { fetchWilayas(); }, []);

  const fetchWilayas = async () => {
    try {
      setLoading(true);
      const res = await wilayasAPI.getAll();
      setWilayas(res.data);
    } catch {
      await showAlert('خطأ في التحميل', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => { setEditing(null); setFormData({ name: '', code: '' }); setShowForm(true); };
  const handleEdit = (w) => { setEditing(w); setFormData({ name: w.name, code: w.code || '' }); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await wilayasAPI.update(editing.id, formData);
        await showAlert('تم تعديل الولاية', 'success');
      } else {
        await wilayasAPI.create(formData);
        await showAlert('تم إنشاء الولاية', 'success');
      }
      resetForm(); fetchWilayas();
    } catch (err) {
      await showAlert(err.response?.data?.errors?.[0] || 'خطأ', 'error');
    }
  };

  const handleDelete = async (w) => {
    const confirmed = await showConfirm(`حذف الولاية "${w.name}" ؟`, 'حذف');
    if (!confirmed) return;
    try {
      await wilayasAPI.delete(w.id);
      await showAlert('تم حذف الولاية', 'success');
      fetchWilayas();
    } catch (err) {
      await showAlert(err.response?.data?.error || 'خطأ', 'error');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    try {
      const res = await wilayasAPI.import(file);
      const { imported, skipped, errors } = res.data;
      await showAlert(`تم الاستيراد: ${imported}، تم التجاهل: ${skipped}${errors.length ? '\nأخطاء: ' + errors.join(', ') : ''}`, 'success');
      fetchWilayas();
    } catch (err) {
      await showAlert(err.response?.data?.error || 'خطأ في الاستيراد', 'error');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const resetForm = () => { setShowForm(false); setEditing(null); setFormData({ name: '', code: '' }); };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6" style={{ border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', direction: 'rtl' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#1e293b' }}>الولايات</h2>
        {(hasPermission('wilayas:create') || hasPermission('wilayas:import')) && (
          <div style={{ display: 'flex', gap: '8px' }}>
            {hasPermission('wilayas:import') && (
              <>
                <button onClick={() => setShowCsvHelp(true)} disabled={importing} style={{
                  padding: '8px 16px', borderRadius: '6px', border: '1px solid #167bff',
                  color: '#167bff', backgroundColor: 'white', cursor: 'pointer', fontSize: '14px'
                }}>
                  {importing ? 'جارٍ الاستيراد...' : 'استيراد CSV'}
                </button>
                <input ref={fileRef} type="file" accept=".csv" onChange={handleImport} style={{ display: 'none' }} />
              </>
            )}
            {hasPermission('wilayas:create') && (
              <button onClick={handleCreate} style={{
                backgroundColor: '#167bff', color: 'white', padding: '8px 16px',
                borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold'
              }}>+ ولاية جديدة</button>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>جارٍ التحميل...</div>
      ) : wilayas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>لا توجد ولاية مسجلة.</div>
      ) : (
        <table dir="rtl" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#64748b' }}>الاسم</th>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#64748b' }}>الرمز</th>
              {(hasPermission('wilayas:update') || hasPermission('wilayas:delete')) && <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#64748b' }}>الإجراءات</th>}
            </tr>
          </thead>
          <tbody>
            {wilayas.map(w => (
              <tr key={w.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px', fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>{w.name}</td>
                <td style={{ padding: '12px', fontSize: '14px', color: '#64748b' }}>{w.code || '—'}</td>
                {(hasPermission('wilayas:update') || hasPermission('wilayas:delete')) && (
                  <td style={{ padding: '12px', textAlign: 'left' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      {hasPermission('wilayas:update') && (
                        <button onClick={() => handleEdit(w)} style={{
                          padding: '6px 12px', fontSize: '13px', backgroundColor: 'white',
                          border: '1px solid #167bff', color: '#167bff', borderRadius: '4px', cursor: 'pointer'
                        }}>تعديل</button>
                      )}
                      {hasPermission('wilayas:delete') && (
                        <button onClick={() => handleDelete(w)} style={{
                          padding: '6px 12px', fontSize: '13px', backgroundColor: 'white',
                          border: '1px solid #ef4444', color: '#ef4444', borderRadius: '4px', cursor: 'pointer'
                        }}>حذف</button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showCsvHelp && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '30px', maxWidth: '480px', width: '100%', direction: 'rtl' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold', textAlign: 'right' }}>تنسيق ملف CSV للولايات</h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px', textAlign: 'right' }}>
              يجب أن يحتوي الملف على الأعمدة التالية (الفاصل: فاصلة أو فاصلة منقوطة):
            </p>
            <div style={{ backgroundColor: '#f8fafc', borderRadius: '6px', padding: '16px', marginBottom: '16px', border: '1px solid #e2e8f0', direction: 'ltr', fontFamily: 'monospace', fontSize: '13px' }}>
              <div style={{ color: '#64748b', marginBottom: '8px' }}>name,code</div>
              <div style={{ color: '#1e293b' }}>نواكشوط الشمالية,NKN</div>
              <div style={{ color: '#1e293b' }}>آدرار,ADR</div>
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', textAlign: 'right', lineHeight: '1.6' }}>
              <div>• <strong>name</strong>: اسم الولاية (مطلوب)</div>
              <div>• <strong>code</strong>: رمز الولاية (اختياري)</div>
              <div style={{ marginTop: '8px', color: '#94a3b8' }}>الصفوف المكررة يتم تجاهلها تلقائياً</div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setShowCsvHelp(false); fileRef.current.click(); }} style={{
                flex: 1, padding: '10px', borderRadius: '6px', border: 'none',
                backgroundColor: '#167bff', color: 'white', cursor: 'pointer', fontWeight: 'bold'
              }}>اختر الملف</button>
              <button onClick={() => setShowCsvHelp(false)} style={{
                flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ddd',
                backgroundColor: 'white', cursor: 'pointer'
              }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '30px', maxWidth: '400px', width: '100%', direction: 'rtl' }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 'bold', textAlign: 'right' }}>
              {editing ? 'تعديل الولاية' : 'ولاية جديدة'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500', textAlign: 'right' }}>الاسم *</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required placeholder="مثال: نواكشوط الشمالية" style={{
                    width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px'
                  }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500', textAlign: 'right' }}>الرمز</label>
                <input type="text" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })}
                  placeholder="مثال: NKN" style={{
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
