import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';
import { employeesAPI, employeeTypesAPI, wilayasAPI, banksAPI, moughataaAPI, communesAPI, villagesAPI, mahdarasAPI } from '../services/api';
import SearchableSelect from '../components/SearchableSelect';

export default function Employees() {
  const navigate = useNavigate();
  const { canWrite } = useAuth();
  const { showAlert, showConfirm } = useDialog();
  const [employees, setEmployees] = useState([]);
  const [types, setTypes] = useState([]);
  const [wilayas, setWilayas] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterTypeId, setFilterTypeId] = useState('');
  const [filterWilayaId, setFilterWilayaId] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [queryPage, setQueryPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [nniInput, setNniInput] = useState('');
  const [nniLoading, setNniLoading] = useState(false);
  const [formData, setFormData] = useState({
    nni: '', first_name: '', last_name: '', first_name_fr: '', last_name_fr: '',
    pere_prenom_ar: '', pere_prenom_fr: '', photo: '',
    birth_date: '', phone: '', employee_type_id: '', wilaya_id: '', active: true,
    bank_id: '', account_number: ''
  });
  // Mahdara-specific state for create form
  const [isMahdaraType, setIsMahdaraType] = useState(false);
  const [mahdaraForm, setMahdaraForm] = useState({ nom: '', numero_releve: '', mahdara_type: '', nombre_etudiants: '' });
  const [mahdaraFile, setMahdaraFile] = useState(null);
  const [mahdaraWilayaId, setMahdaraWilayaId] = useState('');
  const [mahdaraMoughataaId, setMahdaraMoughataaId] = useState('');
  const [mahdaraCommuneId, setMahdaraCommuneId] = useState('');
  const [mahdaraVillageId, setMahdaraVillageId] = useState('');
  const [mahdaraMoughataaList, setMahdaraMoughataaList] = useState([]);
  const [mahdaraCommunesList, setMahdaraCommunesList] = useState([]);
  const [mahdaraVillagesList, setMahdaraVillagesList] = useState([]);

  // Debounce search — 300ms per convention
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setQueryPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Server-side fetch whenever any query param changes
  useEffect(() => {
    let cancelled = false;
    const doFetch = async () => {
      setLoading(true);
      try {
        const params = { page: queryPage, sort_by: sortBy, sort_dir: sortDir };
        if (debouncedSearch) params.search = debouncedSearch;
        if (filterTypeId)    params.employee_type_id = filterTypeId;
        if (filterWilayaId)  params.wilaya_id = filterWilayaId;
        const res = await employeesAPI.getAll(params);
        if (!cancelled) {
          setEmployees(res.data.employees);
          setTotalCount(res.data.meta.total);
          setTotalPages(res.data.meta.total_pages);
        }
      } catch {
        if (!cancelled) await showAlert('خطأ في التحميل', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    doFetch();
    return () => { cancelled = true; };
  }, [queryPage, debouncedSearch, filterTypeId, filterWilayaId, sortBy, sortDir, refreshKey]);

  useEffect(() => {
    Promise.all([fetchTypes(), fetchWilayas(), fetchBanks()]);
  }, []);

  useEffect(() => {
    const selectedType = types.find(t => t.id === formData.employee_type_id);
    setIsMahdaraType(selectedType?.is_mahdara || false);
  }, [formData.employee_type_id, types]);

  useEffect(() => {
    setMahdaraMoughataaId(''); setMahdaraCommuneId(''); setMahdaraVillageId('');
    setMahdaraCommunesList([]); setMahdaraVillagesList([]);
    if (mahdaraWilayaId) {
      moughataaAPI.getAll({ wilaya_id: mahdaraWilayaId }).then(r => setMahdaraMoughataaList(r.data)).catch(() => {});
    } else {
      setMahdaraMoughataaList([]);
    }
  }, [mahdaraWilayaId]);

  useEffect(() => {
    setMahdaraCommuneId(''); setMahdaraVillageId(''); setMahdaraVillagesList([]);
    if (mahdaraMoughataaId) {
      communesAPI.getAll({ moughataa_id: mahdaraMoughataaId }).then(r => setMahdaraCommunesList(r.data)).catch(() => {});
    } else {
      setMahdaraCommunesList([]);
    }
  }, [mahdaraMoughataaId]);

  useEffect(() => {
    setMahdaraVillageId('');
    if (mahdaraCommuneId) {
      villagesAPI.getAll({ commune_id: mahdaraCommuneId }).then(r => setMahdaraVillagesList(r.data)).catch(() => {});
    } else {
      setMahdaraVillagesList([]);
    }
  }, [mahdaraCommuneId]);

  const fetchTypes = async () => {
    try { const res = await employeeTypesAPI.getAll(); setTypes(res.data); } catch { /* ignore */ }
  };

  const fetchWilayas = async () => {
    try { const res = await wilayasAPI.getAll(); setWilayas(res.data); } catch { /* ignore */ }
  };

  const fetchBanks = async () => {
    try { const res = await banksAPI.getAll(); setBanks(res.data); } catch { /* ignore */ }
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
        first_name_fr: data.first_name_fr || '',
        last_name_fr: data.last_name_fr || '',
        pere_prenom_ar: data.pere_prenom_ar || '',
        pere_prenom_fr: data.pere_prenom_fr || '',
        photo: data.photo || '',
        birth_date: data.birth_date || ''
      }));
      if (data.first_name || data.first_name_fr) {
        await showAlert(`تم العثور على: ${data.first_name || ''} ${data.last_name || ''}`, 'success');
      }
    } catch (err) {
      await showAlert(err.response?.data?.error || 'الرقم الوطني غير موجود', 'error');
    } finally {
      setNniLoading(false);
    }
  };

  const handleCreate = () => {
    setNniInput('');
    setFormData({ nni: '', first_name: '', last_name: '', first_name_fr: '', last_name_fr: '', pere_prenom_ar: '', pere_prenom_fr: '', photo: '', birth_date: '', phone: '', employee_type_id: '', wilaya_id: '', active: true, bank_id: '', account_number: '' });
    setMahdaraForm({ nom: '', numero_releve: '', mahdara_type: '', nombre_etudiants: '' });
    setMahdaraFile(null);
    setMahdaraWilayaId(''); setMahdaraMoughataaId(''); setMahdaraCommuneId(''); setMahdaraVillageId('');
    setMahdaraMoughataaList([]); setMahdaraCommunesList([]); setMahdaraVillagesList([]);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { photo: _photo, ...empData } = formData;
      if (isMahdaraType) {
        empData.wilaya_id = mahdaraWilayaId;
        empData.moughataa_id = mahdaraMoughataaId;
        empData.commune_id = mahdaraCommuneId;
        empData.village_id = mahdaraVillageId;
      }
      const res = await employeesAPI.create(empData);
      const newEmployee = res.data;

      if (isMahdaraType) {
        await mahdarasAPI.create({
          employee_id: newEmployee.id,
          ...mahdaraForm,
          wilaya_id: mahdaraWilayaId,
          moughataa_id: mahdaraMoughataaId,
          commune_id: mahdaraCommuneId,
          village_id: mahdaraVillageId,
        }, mahdaraFile);
      }

      navigate(`/admin/employees/${newEmployee.id}`);
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
      setRefreshKey(k => k + 1);
    } catch (err) {
      await showAlert(err.response?.data?.error || 'خطأ', 'error');
    }
  };

  const handleSort = (col) => {
    if (sortBy === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir('asc');
    }
    setQueryPage(1);
  };

  const handleExport = async () => {
    try {
      const params = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (filterTypeId) params.employee_type_id = filterTypeId;
      if (filterWilayaId) params.wilaya_id = filterWilayaId;
      const res = await employeesAPI.export(params);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `employes-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      await showAlert('خطأ في التصدير', 'error');
    }
  };

  const sortIcon = (col) => {
    if (sortBy !== col) return <span style={{ color: '#cbd5e1', marginRight: '4px' }}>↕</span>;
    return <span style={{ color: '#167bff', marginRight: '4px' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const thStyle = (col) => ({
    padding: '14px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600',
    color: sortBy === col ? '#167bff' : '#64748b',
    cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap'
  });

  const typeOptions = types.map(t => ({ value: t.id, label: t.name }));
  const wilayaOptions = wilayas.map(w => ({ value: w.id, label: w.name }));
  const selectedType = typeOptions.find(o => o.value === filterTypeId) || null;
  const selectedWilaya = wilayaOptions.find(o => o.value === filterWilayaId) || null;

  const inputStyle = {
    width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box'
  };
  const labelStyle = { display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500', textAlign: 'right' };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafbfc' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', direction: 'rtl' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#1e293b' }}>الموظفون</h1>
            <p style={{ margin: '4px 0 0', color: '#64748b' }}>{totalCount} موظف مسجل</p>
          </div>
          {canWrite && (
            <button onClick={handleCreate} style={{
              backgroundColor: '#167bff', color: 'white', padding: '10px 20px',
              borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold'
            }}>+ موظف جديد</button>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center', direction: 'rtl' }}>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="البحث بالاسم أو الرقم الوطني..." style={{
              padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0',
              fontSize: '14px', minWidth: '260px', outline: 'none', color: '#1e293b',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }} />
          <div style={{ minWidth: '200px' }}>
            <SearchableSelect
              options={typeOptions}
              value={selectedType}
              onChange={opt => { setFilterTypeId(opt?.value || ''); setQueryPage(1); }}
              placeholder="جميع الأنواع"
              isClearable={true}
            />
          </div>
          <div style={{ minWidth: '200px' }}>
            <SearchableSelect
              options={wilayaOptions}
              value={selectedWilaya}
              onChange={opt => { setFilterWilayaId(opt?.value || ''); setQueryPage(1); }}
              placeholder="جميع الولايات"
              isClearable={true}
            />
          </div>
          <button onClick={handleExport} style={{
            padding: '10px 16px', borderRadius: '8px', border: '1px solid #10b981',
            backgroundColor: 'white', color: '#10b981', cursor: 'pointer', fontSize: '14px',
            fontWeight: '500', whiteSpace: 'nowrap', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}>↓ تصدير Excel</button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm" style={{ border: '1px solid #e2e8f0' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px', gap: '12px', color: '#64748b' }}>
              <div className="animate-spin rounded-full" style={{ width: '24px', height: '24px', border: '2px solid #e2e8f0', borderTopColor: '#167bff' }} />
              جارٍ التحميل...
            </div>
          ) : employees.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>لا يوجد موظف.</div>
          ) : (
            <table dir="rtl" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                  <th onClick={() => handleSort('nni')} style={thStyle('nni')}>{sortIcon('nni')}الرقم الوطني</th>
                  <th onClick={() => handleSort('name')} style={thStyle('name')}>{sortIcon('name')}الاسم الكامل</th>
                  <th onClick={() => handleSort('employee_type')} style={thStyle('employee_type')}>{sortIcon('employee_type')}النوع</th>
                  <th onClick={() => handleSort('wilaya')} style={thStyle('wilaya')}>{sortIcon('wilaya')}الولاية</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>العقد النشط</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>الحالة</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
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
                            {Number(emp.active_contract.amount).toLocaleString()} MRU
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
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
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

          {/* Pagination */}
          {!loading && totalPages > 0 && (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 20px', borderTop: '1px solid #e2e8f0', direction: 'rtl'
            }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                {totalCount} نتيجة — صفحة {queryPage} من {totalPages}
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  disabled={queryPage <= 1}
                  onClick={() => setQueryPage(p => p - 1)}
                  style={{
                    padding: '6px 14px', borderRadius: '6px', fontSize: '13px', cursor: queryPage <= 1 ? 'default' : 'pointer',
                    border: '1px solid #e2e8f0', backgroundColor: queryPage <= 1 ? '#f8fafc' : 'white',
                    color: queryPage <= 1 ? '#94a3b8' : '#1e293b'
                  }}>السابق</button>
                <button
                  disabled={queryPage >= totalPages}
                  onClick={() => setQueryPage(p => p + 1)}
                  style={{
                    padding: '6px 14px', borderRadius: '6px', fontSize: '13px', cursor: queryPage >= totalPages ? 'default' : 'pointer',
                    border: '1px solid #e2e8f0', backgroundColor: queryPage >= totalPages ? '#f8fafc' : 'white',
                    color: queryPage >= totalPages ? '#94a3b8' : '#1e293b'
                  }}>التالي</button>
              </div>
            </div>
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
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '30px', maxWidth: '500px', width: '100%', margin: 'auto', direction: 'rtl' }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 'bold', textAlign: 'right' }}>موظف جديد</h2>

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
                    <label style={labelStyle}>تاريخ الميلاد</label>
                    <input type="text" value={formData.birth_date} readOnly
                      style={{ ...inputStyle, backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'default' }} />
                  </div>
                  <div>
                    <label style={labelStyle}>الاسم الأول (عربي)</label>
                    <input type="text" value={formData.first_name} readOnly required
                      style={{ ...inputStyle, backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'default' }} />
                  </div>
                  <div>
                    <label style={labelStyle}>اسم العائلة (عربي)</label>
                    <input type="text" value={formData.last_name} readOnly required
                      style={{ ...inputStyle, backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'default' }} />
                  </div>
                  <div>
                    <label style={labelStyle}>الاسم الأول (فرنسي)</label>
                    <input type="text" value={formData.first_name_fr} readOnly
                      style={{ ...inputStyle, backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'default' }} />
                  </div>
                  <div>
                    <label style={labelStyle}>اسم العائلة (فرنسي)</label>
                    <input type="text" value={formData.last_name_fr} readOnly
                      style={{ ...inputStyle, backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'default' }} />
                  </div>
                  <div>
                    <label style={labelStyle}>اسم الأب (عربي)</label>
                    <input type="text" value={formData.pere_prenom_ar} readOnly
                      style={{ ...inputStyle, backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'default' }} />
                  </div>
                  <div>
                    <label style={labelStyle}>اسم الأب (فرنسي)</label>
                    <input type="text" value={formData.pere_prenom_fr} readOnly
                      style={{ ...inputStyle, backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'default' }} />
                  </div>
                </div>
                {formData.photo && (
                  <div style={{ marginTop: '12px', textAlign: 'center' }}>
                    <img src={`data:image/jpeg;base64,${formData.photo}`}
                      alt="صورة الموظف"
                      style={{ width: '80px', height: '100px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                  </div>
                )}
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
                <div>
                  <label style={labelStyle}>البنك</label>
                  <select value={formData.bank_id} onChange={e => setFormData({ ...formData, bank_id: e.target.value })}
                    style={inputStyle}>
                    <option value="">اختر...</option>
                    {banks.filter(b => b.active).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>رقم الحساب</label>
                  <input type="text" value={formData.account_number} onChange={e => setFormData({ ...formData, account_number: e.target.value })}
                    style={inputStyle} placeholder="مثال: MR13..." />
                </div>
              </div>

              {isMahdaraType && (
                <div style={{ marginTop: '20px', padding: '16px', borderRadius: '8px', backgroundColor: '#eff6ff', border: '1px solid #93c5fd' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e40af', marginBottom: '14px', textAlign: 'right' }}>
                    بيانات المحظرة
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={labelStyle}>اسم المحظرة *</label>
                      <input type="text" value={mahdaraForm.nom} onChange={e => setMahdaraForm({ ...mahdaraForm, nom: e.target.value })}
                        required style={inputStyle} placeholder="اسم المحظرة" />
                    </div>
                    <div>
                      <label style={labelStyle}>رقم الإفادة</label>
                      <input type="text" value={mahdaraForm.numero_releve} onChange={e => setMahdaraForm({ ...mahdaraForm, numero_releve: e.target.value })}
                        style={inputStyle} placeholder="رقم الإفادة" />
                    </div>
                    <div>
                      <label style={labelStyle}>نوع المحظرة</label>
                      <select value={mahdaraForm.mahdara_type} onChange={e => setMahdaraForm({ ...mahdaraForm, mahdara_type: e.target.value })} style={inputStyle}>
                        <option value="">اختر...</option>
                        <option value="jamia">محظرة جامعة</option>
                        <option value="mutakhassisa">محظرة متخصصة</option>
                        <option value="quraniya">محظرة قرآنية</option>
                        <option value="awwaliya">محظرة أولية</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>عدد الطلاب</label>
                      <input type="number" value={mahdaraForm.nombre_etudiants} onChange={e => setMahdaraForm({ ...mahdaraForm, nombre_etudiants: e.target.value })}
                        min="0" style={inputStyle} placeholder="عدد الطلاب" />
                    </div>
                    <div>
                      <label style={labelStyle}>الولاية</label>
                      <select value={mahdaraWilayaId} onChange={e => setMahdaraWilayaId(e.target.value)} style={inputStyle}>
                        <option value="">اختر...</option>
                        {wilayas.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>المقاطعة</label>
                      <select value={mahdaraMoughataaId} onChange={e => setMahdaraMoughataaId(e.target.value)} disabled={!mahdaraWilayaId} style={{ ...inputStyle, backgroundColor: !mahdaraWilayaId ? '#f1f5f9' : 'white' }}>
                        <option value="">اختر...</option>
                        {mahdaraMoughataaList.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>البلدية</label>
                      <select value={mahdaraCommuneId} onChange={e => setMahdaraCommuneId(e.target.value)} disabled={!mahdaraMoughataaId} style={{ ...inputStyle, backgroundColor: !mahdaraMoughataaId ? '#f1f5f9' : 'white' }}>
                        <option value="">اختر...</option>
                        {mahdaraCommunesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>القرية</label>
                      <select value={mahdaraVillageId} onChange={e => setMahdaraVillageId(e.target.value)} disabled={!mahdaraCommuneId} style={{ ...inputStyle, backgroundColor: !mahdaraCommuneId ? '#f1f5f9' : 'white' }}>
                        <option value="">اختر...</option>
                        {mahdaraVillagesList.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>المأهل العلمي (وثيقة)</label>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setMahdaraFile(e.target.files[0] || null)}
                      style={{ ...inputStyle, padding: '6px' }} />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
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
