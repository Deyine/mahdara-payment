import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';
import { employeeTypesAPI } from '../services/api';

export default function EmployeeTypes() {
  const { hasPermission } = useAuth();
  const { showAlert, showConfirm } = useDialog();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ name: '', active: true, is_mahdara: false, apply_imf: false });

  useEffect(() => { fetchTypes(); }, []);

  const fetchTypes = async () => {
    try {
      setLoading(true);
      const res = await employeeTypesAPI.getAll();
      setTypes(res.data);
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

  const handleEdit = (type) => {
    setEditing(type);
    setFormData({ name: type.name, active: type.active, is_mahdara: type.is_mahdara, apply_imf: type.apply_imf });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await employeeTypesAPI.update(editing.id, formData);
        await showAlert('تم تعديل النوع بنجاح', 'success');
      } else {
        await employeeTypesAPI.create(formData);
        await showAlert('تم إنشاء النوع بنجاح', 'success');
      }
      resetForm();
      fetchTypes();
    } catch (err) {
      await showAlert(err.response?.data?.errors?.[0] || 'خطأ في الحفظ', 'error');
    }
  };

  const handleDelete = async (type) => {
    const confirmed = await showConfirm(
      `حذف النوع "${type.name}" ؟`,
      'حذف النوع'
    );
    if (!confirmed) return;
    try {
      await employeeTypesAPI.delete(type.id);
      await showAlert('تم حذف النوع', 'success');
      fetchTypes();
    } catch (err) {
      await showAlert(err.response?.data?.error || 'خطأ في الحفظ', 'error');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setFormData({ name: '', active: true, is_mahdara: false, apply_imf: false });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6" style={{ border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', direction: 'rtl' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#1e293b' }}>
          أنواع الموظفين
        </h2>
        {hasPermission('employee_types:create') && (
          <button onClick={handleCreate} style={{
            backgroundColor: '#167bff', color: 'white', padding: '8px 16px',
            borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold'
          }}>
            + نوع جديد
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>جارٍ التحميل...</div>
      ) : types.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>لا يوجد نوع مسجل.</div>
      ) : (
        <table dir="rtl" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#64748b' }}>الاسم</th>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#64748b' }}>محظرة</th>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#64748b' }}>IMF</th>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#64748b' }}>الحالة</th>
              {(hasPermission('employee_types:update') || hasPermission('employee_types:delete')) && <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#64748b' }}>الإجراءات</th>}
            </tr>
          </thead>
          <tbody>
            {types.map(type => (
              <tr key={type.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px', fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>{type.name}</td>
                <td style={{ padding: '12px' }}>
                  {type.is_mahdara && (
                    <span style={{
                      padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '600',
                      backgroundColor: '#eff6ff', color: '#1e40af', border: '1px solid #93c5fd'
                    }}>محظرة</span>
                  )}
                </td>
                <td style={{ padding: '12px' }}>
                  {type.apply_imf && (
                    <span style={{
                      padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '600',
                      backgroundColor: '#fef9c3', color: '#854d0e', border: '1px solid #fde047'
                    }}>IMF 2.5%</span>
                  )}
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '600',
                    backgroundColor: type.active ? '#dcfce7' : '#fee2e2',
                    color: type.active ? '#166534' : '#dc2626'
                  }}>{type.active ? 'نشط' : 'غير نشط'}</span>
                </td>
                {(hasPermission('employee_types:update') || hasPermission('employee_types:delete')) && (
                  <td style={{ padding: '12px', textAlign: 'left' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleEdit(type)} style={{
                        padding: '6px 12px', fontSize: '13px', backgroundColor: 'white',
                        border: '1px solid #167bff', color: '#167bff', borderRadius: '4px', cursor: 'pointer'
                      }}>تعديل</button>
                      <button onClick={() => handleDelete(type)} style={{
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
              {editing ? 'تعديل النوع' : 'نوع موظف جديد'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500', textAlign: 'right' }}>الاسم *</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required placeholder="مثال: رسمي، متعاقد..." style={{
                    width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px'
                  }} />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px' }}>
                  <input type="checkbox" checked={formData.active} onChange={e => setFormData({ ...formData, active: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#167bff' }} />
                  <span style={{ fontWeight: '500' }}>نشط</span>
                </label>
              </div>
              <div style={{ marginBottom: '12px', padding: '12px', borderRadius: '6px', backgroundColor: '#eff6ff', border: '1px solid #93c5fd' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px' }}>
                  <input type="checkbox" checked={formData.is_mahdara} onChange={e => setFormData({ ...formData, is_mahdara: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#167bff' }} />
                  <div>
                    <span style={{ fontWeight: '600', color: '#1e40af' }}>نوع محظرة</span>
                    <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                      الموظفون من هذا النوع يتطلبون بيانات المحظرة عند الإنشاء
                    </div>
                  </div>
                </label>
              </div>
              <div style={{ marginBottom: '20px', padding: '12px', borderRadius: '6px', backgroundColor: '#fefce8', border: '1px solid #fde047' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px' }}>
                  <input type="checkbox" checked={formData.apply_imf} onChange={e => setFormData({ ...formData, apply_imf: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#167bff' }} />
                  <div>
                    <span style={{ fontWeight: '600', color: '#854d0e' }}>تطبيق IMF</span>
                    <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                      خصم 2.5% على الراتب عند تصدير الدفعة
                    </div>
                  </div>
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
