import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';
import { rolesAPI } from '../services/api';
import { PERMISSION_LABELS, ENTITY_LABELS } from '../constants/permissions';

export default function Roles() {
  const { isSuperAdmin } = useAuth();
  const { showAlert, showConfirm } = useDialog();

  if (!isSuperAdmin) return <Navigate to="/admin" replace />;
  const [roles, setRoles] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', permissions: [] });

  useEffect(() => { fetchRoles(); }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await rolesAPI.getAll();
      setRoles(res.data.roles || []);
      setAvailablePermissions(res.data.available_permissions || {});
    } catch {
      await showAlert('خطأ في التحميل', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingRole(null);
    setFormData({ name: '', description: '', permissions: [] });
    setShowForm(true);
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setFormData({ name: role.name, description: role.description || '', permissions: [...(role.permissions || [])] });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await rolesAPI.update(editingRole.id, formData);
        await showAlert('تم تعديل الدور بنجاح', 'success');
      } else {
        await rolesAPI.create(formData);
        await showAlert('تم إنشاء الدور بنجاح', 'success');
      }
      setShowForm(false);
      fetchRoles();
    } catch (err) {
      await showAlert(err.response?.data?.errors?.[0] || 'خطأ في الحفظ', 'error');
    }
  };

  const handleDelete = async (role) => {
    const confirmed = await showConfirm(
      `هل تريد حذف الدور "${role.name}"؟`,
      'حذف الدور'
    );
    if (!confirmed) return;
    try {
      await rolesAPI.delete(role.id);
      await showAlert('تم حذف الدور', 'success');
      fetchRoles();
    } catch (err) {
      await showAlert(err.response?.data?.error || 'خطأ في الحذف', 'error');
    }
  };

  const togglePermission = (perm) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm]
    }));
  };

  const toggleEntity = (entity, perms) => {
    const allSelected = perms.every(p => formData.permissions.includes(p));
    setFormData(prev => ({
      ...prev,
      permissions: allSelected
        ? prev.permissions.filter(p => !perms.includes(p))
        : [...new Set([...prev.permissions, ...perms])]
    }));
  };

  const toggleAll = () => {
    const all = Object.values(availablePermissions).flat();
    const allSelected = all.every(p => formData.permissions.includes(p));
    setFormData(prev => ({ ...prev, permissions: allSelected ? [] : all }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6" style={{ border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', direction: 'rtl' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#1e293b' }}>الأدوار</h2>
        <button onClick={handleCreate} style={{
          backgroundColor: '#167bff', color: 'white', padding: '8px 16px',
          borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold'
        }}>+ دور جديد</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>جارٍ التحميل...</div>
      ) : roles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>لا يوجد دور مسجل.</div>
      ) : (
        <table dir="rtl" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>الاسم</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>الوصف</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>الصلاحيات</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>المستخدمون</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {roles.map(role => (
              <tr key={role.id} style={{ borderBottom: '1px solid #e2e8f0' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}>
                <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{role.name}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>{role.description || '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>{(role.permissions || []).length} صلاحية</td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>{role.users_count}</td>
                <td style={{ padding: '12px 16px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button onClick={() => handleEdit(role)} style={{
                      padding: '6px 12px', fontSize: '13px', backgroundColor: 'white',
                      border: '1px solid #167bff', color: '#167bff', borderRadius: '4px', cursor: 'pointer'
                    }}>تعديل</button>
                    <button onClick={() => handleDelete(role)} style={{
                      padding: '6px 12px', fontSize: '13px', backgroundColor: 'white',
                      border: '1px solid #ef4444', color: '#ef4444', borderRadius: '4px', cursor: 'pointer'
                    }}>حذف</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '8px', padding: '30px',
            maxWidth: '720px', width: '100%', direction: 'rtl',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 'bold' }}>
              {editingRole ? 'تعديل الدور' : 'دور جديد'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>الاسم *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="مثال: محاسب"
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>الوصف</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="وصف مختصر للدور"
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                    الصلاحيات ({formData.permissions.length})
                  </span>
                  <button type="button" onClick={toggleAll} style={{
                    fontSize: '13px', color: '#167bff', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500'
                  }}>
                    {Object.values(availablePermissions).flat().every(p => formData.permissions.includes(p)) ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {Object.entries(availablePermissions).map(([entity, perms]) => {
                    const allSelected = perms.every(p => formData.permissions.includes(p));
                    const someSelected = perms.some(p => formData.permissions.includes(p));
                    return (
                      <div key={entity} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                        <div style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '10px 14px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0'
                        }}>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                            {ENTITY_LABELS[entity] || entity}
                          </span>
                          <button type="button" onClick={() => toggleEntity(entity, perms)} style={{
                            fontSize: '12px', color: allSelected ? '#ef4444' : '#167bff',
                            background: 'none', border: 'none', cursor: 'pointer'
                          }}>
                            {allSelected ? 'إلغاء الكل' : someSelected ? 'تحديد الكل' : 'تحديد الكل'}
                          </button>
                        </div>
                        <div style={{ padding: '10px 14px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {perms.map(perm => {
                            const checked = formData.permissions.includes(perm);
                            return (
                              <label key={perm} style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                padding: '5px 12px', borderRadius: '20px', cursor: 'pointer',
                                fontSize: '13px', fontWeight: '500',
                                border: `1px solid ${checked ? '#167bff' : '#e2e8f0'}`,
                                backgroundColor: checked ? '#eff6ff' : 'white',
                                color: checked ? '#167bff' : '#64748b',
                                transition: 'all 0.15s'
                              }}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => togglePermission(perm)}
                                  style={{ display: 'none' }}
                                />
                                {PERMISSION_LABELS[perm] || perm}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{
                  flex: 1, padding: '10px', borderRadius: '6px', border: 'none',
                  backgroundColor: '#167bff', color: 'white', cursor: 'pointer', fontWeight: 'bold'
                }}>
                  {editingRole ? 'تعديل' : 'إنشاء'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{
                  flex: 1, padding: '10px', borderRadius: '6px',
                  border: '1px solid #ddd', backgroundColor: 'white', cursor: 'pointer'
                }}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
