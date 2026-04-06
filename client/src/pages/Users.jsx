import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';
import { usersAPI, rolesAPI } from '../services/api';

export default function Users() {
  const { user: currentUser, hasPermission, isSuperAdmin } = useAuth();
  const { showAlert, showConfirm } = useDialog();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'user',
    role_id: null
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll();
      setUsers(response.data);
    } catch {
      await showAlert('خطأ في تحميل المستخدمين', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await rolesAPI.getAll();
      setRoles(res.data.roles || []);
    } catch {
      // non-critical, silently ignore
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    setFormData({ name: '', username: '', password: '', role: 'user', role_id: null });
    setShowForm(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      password: '',
      role: user.role,
      role_id: user.role_id || null
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const dataToSend = { ...formData };

      if (editingUser && !dataToSend.password) {
        delete dataToSend.password;
      }

      if (editingUser) {
        await usersAPI.update(editingUser.id, dataToSend);
        resetForm();
        fetchUsers();
        await showAlert('تم تعديل المستخدم بنجاح', 'success');
      } else {
        if (!formData.password) {
          await showAlert('كلمة المرور مطلوبة', 'error');
          return;
        }
        await usersAPI.create(dataToSend);
        resetForm();
        fetchUsers();
        await showAlert('تم إنشاء المستخدم بنجاح', 'success');
      }
    } catch (error) {
      await showAlert(
        error.response?.data?.errors?.[0] || error.response?.data?.error || 'خطأ في الحفظ',
        'error'
      );
    }
  };

  const handleDelete = async (id) => {
    const userToDelete = users.find(u => u.id === id);

    if (userToDelete.id === currentUser.id) {
      await showAlert('لا يمكنك حذف حسابك الخاص', 'error');
      return;
    }

    const confirmed = await showConfirm(
      `هل تريد حذف المستخدم "${userToDelete.name}" ؟`,
      'حذف المستخدم'
    );

    if (!confirmed) return;

    try {
      await usersAPI.delete(id);
      await showAlert('تم حذف المستخدم بنجاح', 'success');
      fetchUsers();
    } catch (error) {
      await showAlert(
        error.response?.data?.error || 'خطأ في الحذف',
        'error'
      );
    }
  };

  const handleToggleActive = async (user) => {
    const action = user.active ? 'تعطيل' : 'تفعيل';
    const confirmed = await showConfirm(
      `هل تريد ${action} المستخدم "${user.name}" ؟`,
      `${action} المستخدم`
    );

    if (!confirmed) return;

    try {
      await usersAPI.update(user.id, { active: !user.active });
      await showAlert(`تم ${user.active ? 'تعطيل' : 'تفعيل'} المستخدم بنجاح`, 'success');
      fetchUsers();
    } catch (error) {
      await showAlert(
        error.response?.data?.errors?.join(', ') || 'خطأ في التعديل',
        'error'
      );
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormData({ name: '', username: '', password: '', role: 'user', role_id: null });
  };

  const getRoleBadge = (user) => {
    if (user.role === 'super_admin') return { label: 'مشرف عام', color: '#8b5cf6' };
    if (user.role_name) return { label: user.role_name, color: '#167bff' };
    return { label: 'مستخدم', color: '#10b981' };
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6" style={{ border: '1px solid #e2e8f0' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        direction: 'rtl'
      }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#1e293b' }}>
          المستخدمون
        </h2>
        {hasPermission('users:create') && (
          <button
            onClick={handleCreate}
            style={{
              backgroundColor: '#167bff',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            + مستخدم جديد
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>جارٍ التحميل...</div>
      ) : users.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          لا يوجد مستخدم مسجل.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table dir="rtl" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#64748b' }}>
                  الاسم
                </th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#64748b' }}>
                  اسم المستخدم
                </th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#64748b' }}>
                  الدور
                </th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#64748b' }}>
                  الحالة
                </th>
                {(hasPermission('users:update') || hasPermission('users:delete')) && (
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#64748b' }}>
                    الإجراءات
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const badge = getRoleBadge(user);
                const isCurrentUser = user.id === currentUser?.id;
                const canEditUser = hasPermission('users:update') && (isSuperAdmin || user.role !== 'super_admin');
                const canDeleteUser = hasPermission('users:delete') && !isCurrentUser && (isSuperAdmin || user.role !== 'super_admin');

                return (
                  <tr key={user.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#1e293b' }}>
                      {user.name}
                      {isCurrentUser && (
                        <span style={{
                          marginRight: '8px',
                          fontSize: '11px',
                          backgroundColor: '#f1f5f9',
                          color: '#64748b',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          (أنت)
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#64748b' }}>
                      {user.username}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: `${badge.color}15`,
                        color: badge.color
                      }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: user.active ? '#dcfce7' : '#fee2e2',
                        color: user.active ? '#166534' : '#dc2626'
                      }}>
                        {user.active ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                    {(hasPermission('users:update') || hasPermission('users:delete')) && (
                      <td style={{ padding: '12px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          {canEditUser && (
                            <button
                              onClick={() => handleEdit(user)}
                              style={{
                                padding: '6px 12px',
                                fontSize: '13px',
                                backgroundColor: 'white',
                                border: '1px solid #167bff',
                                color: '#167bff',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              تعديل
                            </button>
                          )}
                          {canEditUser && !isCurrentUser && (
                            <button
                              onClick={() => handleToggleActive(user)}
                              style={{
                                padding: '6px 12px',
                                fontSize: '13px',
                                backgroundColor: 'white',
                                border: `1px solid ${user.active ? '#f59e0b' : '#10b981'}`,
                                color: user.active ? '#f59e0b' : '#10b981',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              {user.active ? 'تعطيل' : 'تفعيل'}
                            </button>
                          )}
                          {canDeleteUser && (
                            <button
                              onClick={() => handleDelete(user.id)}
                              style={{
                                padding: '6px 12px',
                                fontSize: '13px',
                                backgroundColor: 'white',
                                border: '1px solid #ef4444',
                                color: '#ef4444',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              حذف
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '30px',
            maxWidth: '450px',
            width: '100%',
            direction: 'rtl'
          }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 'bold', textAlign: 'right' }}>
              {editingUser ? 'تعديل المستخدم' : 'مستخدم جديد'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500', textAlign: 'right' }}>
                  الاسم الكامل *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="مثال: أحمد محمد"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500', textAlign: 'right' }}>
                  اسم المستخدم *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  placeholder="مثال: ahmed.mohamed"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500', textAlign: 'right' }}>
                  كلمة المرور {editingUser ? '(اتركه فارغاً للإبقاء)' : '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                  placeholder={editingUser ? '••••••••' : 'أدخل كلمة مرور'}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: formData.role === 'user' ? '10px' : '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500', textAlign: 'right' }}>
                  نوع الحساب *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value, role_id: null })}
                  required
                  disabled={editingUser && editingUser.id === currentUser?.id}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    backgroundColor: (editingUser && editingUser.id === currentUser?.id) ? '#f1f5f9' : 'white'
                  }}
                >
                  <option value="user">مستخدم عادي</option>
                  {isSuperAdmin && <option value="super_admin">مشرف عام</option>}
                </select>
                {editingUser && editingUser.id === currentUser?.id && (
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '5px' }}>
                    لا يمكنك تعديل دورك الخاص
                  </p>
                )}
              </div>

              {formData.role === 'user' && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500', textAlign: 'right' }}>
                    الدور (الصلاحيات)
                  </label>
                  <select
                    value={formData.role_id || ''}
                    onChange={(e) => setFormData({ ...formData, role_id: e.target.value || null })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">بدون دور (قراءة فقط)</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name}{r.description ? ` — ${r.description}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#167bff',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {editingUser ? 'تعديل' : 'إنشاء'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
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
