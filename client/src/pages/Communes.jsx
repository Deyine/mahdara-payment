import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';
import { communesAPI, moughataaAPI, wilayasAPI } from '../services/api';

export default function Communes() {
  const { canWrite } = useAuth();
  const { showAlert, showConfirm } = useDialog();
  const [items, setItems] = useState([]);
  const [wilayas, setWilayas] = useState([]);
  const [moughataaList, setMoughataaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMoughataaId, setFilterMoughataaId] = useState('');
  const [filterWilayaId, setFilterWilayaId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ name: '', moughataa_id: '' });
  const [formMoughataa, setFormMoughataa] = useState([]);
  const [formWilayaId, setFormWilayaId] = useState('');
  const [importing, setImporting] = useState(false);
  const [showCsvHelp, setShowCsvHelp] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    Promise.all([fetchItems(), fetchWilayas()]);
  }, []);

  useEffect(() => { fetchItems(); }, [filterMoughataaId]);

  useEffect(() => {
    if (filterWilayaId) {
      moughataaAPI.getAll({ wilaya_id: filterWilayaId }).then(res => setMoughataaList(res.data)).catch(() => {});
      setFilterMoughataaId('');
    } else {
      setMoughataaList([]);
      setFilterMoughataaId('');
    }
  }, [filterWilayaId]);

  useEffect(() => {
    if (formWilayaId) {
      moughataaAPI.getAll({ wilaya_id: formWilayaId }).then(res => setFormMoughataa(res.data)).catch(() => {});
    } else {
      setFormMoughataa([]);
    }
  }, [formWilayaId]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const params = filterMoughataaId ? { moughataa_id: filterMoughataaId } : {};
      const res = await communesAPI.getAll(params);
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
    setFormWilayaId('');
    setFormData({ name: '', moughataa_id: '' });
    setShowForm(true);
  };

  const handleEdit = (item) => {
    setEditing(item);
    const wilayaId = item.moughataa?.wilaya_id || '';
    setFormWilayaId(wilayaId);
    setFormData({ name: item.name, moughataa_id: item.moughataa_id });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await communesAPI.update(editing.id, formData);
        await showAlert('تم تعديل البلدية', 'success');
      } else {
        await communesAPI.create(formData);
        await showAlert('تم إنشاء البلدية', 'success');
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
      await communesAPI.delete(item.id);
      await showAlert('تم حذف البلدية', 'success');
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
      const res = await communesAPI.import(file);
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

  const resetForm = () => {
    setShowForm(false); setEditing(null);
    setFormData({ name: '', moughataa_id: '' }); setFormWilayaId('');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6" style={{ border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', direction: 'rtl' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#1e293b' }}>البلديات</h2>
        {canWrite && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowCsvHelp(true)} disabled={importing} style={{
              padding: '8px 16px', borderRadius: '6px', border: '1px solid #167bff',
              color: '#167bff', backgroundColor: 'white', cursor: 'pointer', fontSize: '14px'
            }}>{importing ? 'جارٍ الاستيراد...' : 'استيراد CSV'}</button>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleImport} style={{ display: 'none' }} />
            <button onClick={handleCreate} style={{
              backgroundColor: '#167bff', color: 'white', padding: '8px 16px',
              borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold'
            }}>+ بلدية جديدة</button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', direction: 'rtl' }}>
        <select value={filterWilayaId} onChange={e => setFilterWilayaId(e.target.value)} style={{
          padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px'
        }}>
          <option value="">جميع الولايات</option>
          {wilayas.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        {filterWilayaId && (
          <select value={filterMoughataaId} onChange={e => setFilterMoughataaId(e.target.value)} style={{
            padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px'
          }}>
            <option value="">جميع المقاطعات</option>
            {moughataaList.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>جارٍ التحميل...</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>لا توجد بلدية مسجلة.</div>
      ) : (
        <table dir="rtl" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#64748b' }}>الاسم</th>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#64748b' }}>المقاطعة</th>
              {canWrite && <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#64748b' }}>الإجراءات</th>}
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px', fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>{item.name}</td>
                <td style={{ padding: '12px', fontSize: '14px', color: '#64748b' }}>{item.moughataa?.name || '—'}</td>
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

      {showCsvHelp && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '30px', maxWidth: '480px', width: '100%', direction: 'rtl' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold', textAlign: 'right' }}>تنسيق ملف CSV للبلديات</h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px', textAlign: 'right' }}>
              يجب أن يحتوي الملف على الأعمدة التالية (الفاصل: فاصلة أو فاصلة منقوطة):
            </p>
            <div style={{ backgroundColor: '#f8fafc', borderRadius: '6px', padding: '16px', marginBottom: '16px', border: '1px solid #e2e8f0', direction: 'ltr', fontFamily: 'monospace', fontSize: '13px' }}>
              <div style={{ color: '#64748b', marginBottom: '8px' }}>name,moughataa</div>
              <div style={{ color: '#1e293b' }}>اطوار,تيارت</div>
              <div style={{ color: '#1e293b' }}>السبخة,ذراع أفريطس</div>
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', textAlign: 'right', lineHeight: '1.6' }}>
              <div>• <strong>name</strong>: اسم البلدية (مطلوب)</div>
              <div>• <strong>moughataa</strong>: اسم المقاطعة كما هو مسجل في النظام (مطلوب)</div>
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
              {editing ? 'تعديل البلدية' : 'بلدية جديدة'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500', textAlign: 'right' }}>الولاية *</label>
                <select value={formWilayaId} onChange={e => { setFormWilayaId(e.target.value); setFormData({ ...formData, moughataa_id: '' }); }}
                  required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}>
                  <option value="">اختر ولاية</option>
                  {wilayas.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500', textAlign: 'right' }}>المقاطعة *</label>
                <select value={formData.moughataa_id} onChange={e => setFormData({ ...formData, moughataa_id: e.target.value })}
                  required disabled={!formWilayaId} style={{
                    width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px',
                    backgroundColor: !formWilayaId ? '#f1f5f9' : 'white'
                  }}>
                  <option value="">اختر مقاطعة</option>
                  {formMoughataa.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500', textAlign: 'right' }}>الاسم *</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required placeholder="اسم البلدية" style={{
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
