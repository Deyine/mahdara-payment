import { useState, useEffect } from 'react';
import { operatorsAPI, filieresAPI } from '../../services/api';

export default function OperatorManagement() {
  const [operators, setOperators] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', username: '', password: '', filiere_id: '' });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [operatorsRes, filieresRes] = await Promise.all([
        operatorsAPI.getAll(),
        filieresAPI.getAll()
      ]);
      setOperators(operatorsRes.data);
      setFilieres(filieresRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await operatorsAPI.update(editingId, formData);
        setMessage({ type: 'success', text: 'تم تحديث المشغل بنجاح' });
      } else {
        await operatorsAPI.create(formData);
        setMessage({ type: 'success', text: 'تم إضافة المشغل بنجاح' });
      }
      loadData();
      resetForm();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'خطأ في العملية' });
    }
  };

  const handleEdit = (operator) => {
    setEditingId(operator.id);
    setFormData({
      name: operator.name,
      username: operator.username,
      password: '',
      filiere_id: operator.filiere_id || ''
    });
    setShowForm(true);
    setMessage(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا المشغل؟')) return;
    try {
      await operatorsAPI.delete(id);
      setMessage({ type: 'success', text: 'تم حذف المشغل بنجاح' });
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: 'خطأ في حذف المشغل' });
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', username: '', password: '', filiere_id: '' });
    setTimeout(() => setMessage(null), 3000);
  };

  if (loading) {
    return <div className="text-center py-12">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold" style={{ color: '#384959' }}>إدارة المشغلين</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-white px-4 py-2 rounded-lg transition-colors"
          style={{ backgroundColor: '#384959' }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#6a89a7'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#384959'}
        >
          {showForm ? 'إلغاء' : '+ إضافة مشغل'}
        </button>
      </div>

      {message && (
        <div className="p-4 rounded border" style={{ backgroundColor: '#f0f9ff', borderColor: '#167bff', color: '#1e293b' }}>
          {message.text}
        </div>
      )}

      {showForm && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={resetForm}
        >
          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="bg-white rounded-lg shadow-xl w-full max-w-lg"
              style={{ border: '1px solid #e2e8f0' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: '#e2e8f0' }}>
                <h3 className="text-xl font-bold" style={{ color: '#1e293b' }}>
                  {editingId ? 'تعديل المشغل' : 'إضافة مشغل جديد'}
                </h3>
                <button
                  onClick={resetForm}
                  className="p-1 rounded-lg transition-colors"
                  style={{ color: '#64748b' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                    e.currentTarget.style.color = '#1e293b';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#64748b';
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium mb-2" style={{ color: '#475569' }}>الاسم الكامل</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none"
                      style={{ borderColor: '#e2e8f0' }}
                      onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(22, 123, 255, 0.1)'}
                      onBlur={(e) => e.target.style.boxShadow = 'none'}
                      required
                      placeholder="الاسم الكامل"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-2" style={{ color: '#475569' }}>اسم المستخدم</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none"
                      style={{ borderColor: '#e2e8f0' }}
                      onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(22, 123, 255, 0.1)'}
                      onBlur={(e) => e.target.style.boxShadow = 'none'}
                      required
                      placeholder="اسم المستخدم"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium mb-2" style={{ color: '#475569' }}>
                    كلمة المرور {editingId && <span className="text-sm" style={{ color: '#64748b' }}>(اتركه فارغاً للحفاظ على القديم)</span>}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none"
                    style={{ borderColor: '#e2e8f0' }}
                    onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(22, 123, 255, 0.1)'}
                    onBlur={(e) => e.target.style.boxShadow = 'none'}
                    required={!editingId}
                    placeholder="كلمة المرور"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-2" style={{ color: '#475569' }}>التخصص المسند</label>
                  <select
                    value={formData.filiere_id}
                    onChange={(e) => setFormData({ ...formData, filiere_id: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none"
                    style={{ borderColor: '#e2e8f0' }}
                    onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(22, 123, 255, 0.1)'}
                    onBlur={(e) => e.target.style.boxShadow = 'none'}
                    required
                  >
                    <option value="">اختر التخصص</option>
                    {filieres.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 text-white px-6 py-2 rounded-lg transition-colors"
                    style={{ backgroundColor: '#167bff' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#0d5dd6'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#167bff'}
                  >
                    حفظ
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-2 rounded-lg transition-colors"
                    style={{ backgroundColor: '#f1f5f9', color: '#475569' }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#e2e8f0';
                      e.target.style.color = '#1e293b';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#f1f5f9';
                      e.target.style.color = '#475569';
                    }}
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الاسم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">اسم المستخدم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التخصص</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {operators.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    لا يوجد مشغلون مضافون
                  </td>
                </tr>
              ) : (
                operators.map((operator, index) => (
                  <tr key={operator.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{operator.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{operator.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{operator.filiere_name || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleEdit(operator)}
                          className="p-1 rounded transition-colors"
                          style={{ color: '#167bff' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#0d5dd6';
                            e.currentTarget.style.backgroundColor = '#f1f5f9';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#167bff';
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          title="تعديل"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(operator.id)}
                          className="p-1 rounded transition-colors"
                          style={{ color: '#64748b' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#ef4444';
                            e.currentTarget.style.backgroundColor = '#fef2f2';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#64748b';
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          title="حذف"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
