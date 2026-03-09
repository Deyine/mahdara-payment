import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';
import { employeesAPI, employeeTypesAPI, wilayasAPI } from '../services/api';

export default function Employees() {
  const navigate = useNavigate();
  const { canWrite } = useAuth();
  const { showAlert, showConfirm } = useDialog();
  const [employees, setEmployees] = useState([]);
  const [types, setTypes] = useState([]);
  const [wilayas, setWilayas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTypeId, setFilterTypeId] = useState('');
  const [filterWilayaId, setFilterWilayaId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [nniInput, setNniInput] = useState('');
  const [nniLoading, setNniLoading] = useState(false);
  const [formData, setFormData] = useState({
    nni: '', first_name: '', last_name: '', birth_date: '',
    phone: '', employee_type_id: '', wilaya_id: '', active: true
  });

  useEffect(() => {
    Promise.all([fetchEmployees(), fetchTypes(), fetchWilayas()]);
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await employeesAPI.getAll();
      setEmployees(res.data);
    } catch {
      await showAlert('خطأ في التحميل', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTypes = async () => {
    try { const res = await employeeTypesAPI.getAll(); setTypes(res.data); } catch { /* ignore */ }
  };

  const fetchWilayas = async () => {
    try { const res = await wilayasAPI.getAll(); setWilayas(res.data); } catch { /* ignore */ }
  };

  const handleLookupNni = async () => {
    if (!nniInput.trim()) return;
    setNniLoading(true);
    try {
      const res = await employeesAPI.lookupNni(nniInput.trim());
      const data = res.data;
      setFormData(prev => ({
        ...prev,
        nni: data.nni || nniInput,
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        birth_date: data.birth_date || ''
      }));
      if (data.first_name || data.last_name) {
        await showAlert(`تم العثور على: ${data.first_name} ${data.last_name}`, 'success');
      }
    } catch (err) {
      await showAlert(err.response?.data?.error || 'الرقم الوطني غير موجود', 'error');
    } finally {
      setNniLoading(false);
    }
  };

  const handleCreate = () => {
    setNniInput('');
    setFormData({ nni: '', first_name: '', last_name: '', birth_date: '', phone: '', employee_type_id: '', wilaya_id: '', active: true });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await employeesAPI.create(formData);
      await showAlert('تم إنشاء الموظف بنجاح', 'success');
      setShowForm(false);
      fetchEmployees();
    } catch (err) {
      await showAlert(err.response?.data?.errors?.[0] || 'خطأ', 'error');
    }
  };

  const handleDelete = async (emp) => {
    const confirmed = await showConfirm(`حذف "${emp.full_name}" ؟`, 'حذف الموظف');
    if (!confirmed) return;
    try {
      await employeesAPI.delete(emp.id);
      await showAlert('تم حذف الموظف', 'success');
      fetchEmployees();
    } catch (err) {
      await showAlert(err.response?.data?.error || 'خطأ', 'error');
    }
  };

  const filtered = employees.filter(e => {
    const matchSearch = !search || e.full_name.toLowerCase().includes(search.toLowerCase()) || e.nni.includes(search);
    const matchType = !filterTypeId || e.employee_type?.id === filterTypeId;
    const matchWilaya = !filterWilayaId || e.wilaya?.id === filterWilayaId;
    return matchSearch && matchType && matchWilaya;
  });

  const inputStyle = {
    width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box'
  };
  const labelStyle = { display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafbfc' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#1e293b' }}>الموظفون</h1>
            <p style={{ margin: '4px 0 0', color: '#64748b' }}>{employees.length} موظف مسجل</p>
          </div>
          {canWrite && (
            <button onClick={handleCreate} style={{
              backgroundColor: '#167bff', color: 'white', padding: '10px 20px',
              borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold'
            }}>+ موظف جديد</button>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="البحث بالاسم أو الرقم الوطني..." style={{
              padding: '10px 14px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', minWidth: '260px'
            }} />
          <select value={filterTypeId} onChange={e => setFilterTypeId(e.target.value)} style={{
            padding: '10px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px'
          }}>
            <option value="">جميع الأنواع</option>
            {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select value={filterWilayaId} onChange={e => setFilterWilayaId(e.target.value)} style={{
            padding: '10px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px'
          }}>
            <option value="">جميع الولايات</option>
            {wilayas.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm" style={{ border: '1px solid #e2e8f0' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>جارٍ التحميل...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>لا يوجد موظف.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>الرقم الوطني</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>الاسم الكامل</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>النوع</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>الولاية</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>العقد النشط</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>الحالة</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(emp => (
                  <tr key={emp.id} style={{ borderBottom: '1px solid #e2e8f0' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b', fontFamily: 'monospace' }}>{emp.nni}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>
                      <button onClick={() => navigate(`/admin/employees/${emp.id}`)} style={{
                        background: 'none', border: 'none', cursor: 'pointer', color: '#167bff',
                        fontSize: '14px', fontWeight: '500', padding: 0, textAlign: 'right'
                      }}>{emp.full_name}</button>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>
                      {emp.employee_type?.name || '—'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>
                      {emp.wilaya?.name || '—'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '14px' }}>
                      {emp.active_contract ? (
                        <div>
                          <span style={{ fontWeight: '500', color: '#1e293b' }}>
                            {emp.active_contract.contract_type}
                          </span>
                          <span style={{ marginRight: '8px', color: '#64748b' }}>
                            {emp.active_contract.amount.toLocaleString()} MRU
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '13px' }}>لا يوجد عقد نشط</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '600',
                        backgroundColor: emp.active ? '#dcfce7' : '#fee2e2',
                        color: emp.active ? '#166534' : '#dc2626'
                      }}>{emp.active ? 'نشط' : 'غير نشط'}</span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'left' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-start' }}>
                        <button onClick={() => navigate(`/admin/employees/${emp.id}`)} style={{
                          padding: '6px 12px', fontSize: '13px', backgroundColor: 'white',
                          border: '1px solid #167bff', color: '#167bff', borderRadius: '4px', cursor: 'pointer'
                        }}>التفاصيل</button>
                        {canWrite && (
                          <button onClick={() => handleDelete(emp)} style={{
                            padding: '6px 12px', fontSize: '13px', backgroundColor: 'white',
                            border: '1px solid #ef4444', color: '#ef4444', borderRadius: '4px', cursor: 'pointer'
                          }}>حذف</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: '20px'
        }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '30px', maxWidth: '500px', width: '100%', margin: 'auto' }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 'bold' }}>موظف جديد</h2>

            {/* NNI Lookup */}
            <div style={{ marginBottom: '20px', padding: '16px', borderRadius: '6px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>
                البحث بالرقم الوطني (API الحكومي)
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="text" value={nniInput} onChange={e => setNniInput(e.target.value)}
                  placeholder="أدخل الرقم الوطني..." style={{ ...inputStyle, flex: 1 }} />
                <button type="button" onClick={handleLookupNni} disabled={nniLoading || !nniInput.trim()} style={{
                  padding: '10px 16px', borderRadius: '6px', border: 'none', whiteSpace: 'nowrap',
                  backgroundColor: nniLoading ? '#94a3b8' : '#167bff', color: 'white', cursor: 'pointer', fontSize: '14px'
                }}>{nniLoading ? '...' : 'بحث'}</button>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Identity fields from Huwiyeti - read only */}
              <div style={{ marginBottom: '15px', padding: '14px', borderRadius: '6px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px', fontWeight: '500' }}>
                  معلومات الهوية (من هويتي) — غير قابلة للتعديل
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>الرقم الوطني</label>
                    <input type="text" value={formData.nni} readOnly required
                      style={{ ...inputStyle, backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'default' }} />
                  </div>
                  <div>
                    <label style={labelStyle}>الاسم الأول</label>
                    <input type="text" value={formData.first_name} readOnly required
                      style={{ ...inputStyle, backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'default' }} />
                  </div>
                  <div>
                    <label style={labelStyle}>اسم العائلة</label>
                    <input type="text" value={formData.last_name} readOnly required
                      style={{ ...inputStyle, backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'default' }} />
                  </div>
                  <div>
                    <label style={labelStyle}>تاريخ الميلاد</label>
                    <input type="text" value={formData.birth_date} readOnly
                      style={{ ...inputStyle, backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'default' }} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={labelStyle}>الهاتف</label>
                  <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    style={inputStyle} placeholder="مثال: 22000000" />
                </div>
                <div>
                  <label style={labelStyle}>نوع الموظف *</label>
                  <select value={formData.employee_type_id} onChange={e => setFormData({ ...formData, employee_type_id: e.target.value })}
                    required style={inputStyle}>
                    <option value="">اختر...</option>
                    {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>الولاية</label>
                  <select value={formData.wilaya_id} onChange={e => setFormData({ ...formData, wilaya_id: e.target.value })}
                    style={inputStyle}>
                    <option value="">اختر...</option>
                    {wilayas.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={{
                  flex: 1, padding: '10px', borderRadius: '6px', border: 'none',
                  backgroundColor: '#167bff', color: 'white', cursor: 'pointer', fontWeight: 'bold'
                }}>إنشاء الموظف</button>
                <button type="button" onClick={() => setShowForm(false)} style={{
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
