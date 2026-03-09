import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';
import { employeesAPI, contractsAPI, employeeTypesAPI, wilayasAPI, moughataaAPI, communesAPI, villagesAPI } from '../services/api';

const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' };
const labelStyle = { display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' };

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canWrite } = useAuth();
  const { showAlert, showConfirm } = useDialog();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showContractForm, setShowContractForm] = useState(false);
  const [editingContract, setEditingContract] = useState(null);

  // Reference data
  const [types, setTypes] = useState([]);
  const [wilayas, setWilayas] = useState([]);
  const [moughataaList, setMoughataaList] = useState([]);
  const [communesList, setCommunesList] = useState([]);
  const [villagesList, setVillagesList] = useState([]);

  const [editData, setEditData] = useState({});
  const [editWilayaId, setEditWilayaId] = useState('');
  const [editMoughataaId, setEditMoughataaId] = useState('');
  const [editCommuneId, setEditCommuneId] = useState('');

  const [contractData, setContractData] = useState({
    contract_type: 'CDI', amount: '', start_date: '', duration_months: '', active: true
  });

  useEffect(() => {
    Promise.all([fetchEmployee(), fetchTypes(), fetchWilayas()]);
  }, [id]);

  useEffect(() => {
    if (editWilayaId) {
      moughataaAPI.getAll({ wilaya_id: editWilayaId }).then(r => setMoughataaList(r.data)).catch(() => {});
    }
  }, [editWilayaId]);

  useEffect(() => {
    if (editMoughataaId) {
      communesAPI.getAll({ moughataa_id: editMoughataaId }).then(r => setCommunesList(r.data)).catch(() => {});
    }
  }, [editMoughataaId]);

  useEffect(() => {
    if (editCommuneId) {
      villagesAPI.getAll({ commune_id: editCommuneId }).then(r => setVillagesList(r.data)).catch(() => {});
    }
  }, [editCommuneId]);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const res = await employeesAPI.getById(id);
      setEmployee(res.data);
    } catch {
      await showAlert('الموظف غير موجود', 'error');
      navigate('/admin/employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchTypes = async () => {
    try { const r = await employeeTypesAPI.getAll(); setTypes(r.data); } catch { /* ignore */ }
  };

  const fetchWilayas = async () => {
    try { const r = await wilayasAPI.getAll(); setWilayas(r.data); } catch { /* ignore */ }
  };

  const openEditForm = () => {
    const wilayaId = employee.wilaya?.id || '';
    const moughataaId = employee.moughataa?.id || '';
    const communeId = employee.commune?.id || '';
    setEditWilayaId(wilayaId);
    setEditMoughataaId(moughataaId);
    setEditCommuneId(communeId);
    setEditData({
      nni: employee.nni,
      first_name: employee.first_name,
      last_name: employee.last_name,
      birth_date: employee.birth_date || '',
      phone: employee.phone || '',
      employee_type_id: employee.employee_type?.id || '',
      wilaya_id: wilayaId,
      moughataa_id: moughataaId,
      commune_id: communeId,
      village_id: employee.village?.id || '',
      active: employee.active
    });
    setShowEditForm(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await employeesAPI.update(id, editData);
      await showAlert('تم تعديل الموظف', 'success');
      setShowEditForm(false);
      fetchEmployee();
    } catch (err) {
      await showAlert(err.response?.data?.errors?.[0] || 'خطأ', 'error');
    }
  };

  const openContractForm = (contract = null) => {
    setEditingContract(contract);
    if (contract) {
      setContractData({
        contract_type: contract.contract_type,
        amount: contract.amount.toString(),
        start_date: contract.start_date,
        duration_months: contract.duration_months?.toString() || '',
        active: contract.active
      });
    } else {
      setContractData({ contract_type: 'CDI', amount: '', start_date: '', duration_months: '', active: true });
    }
    setShowContractForm(true);
  };

  const handleContractSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...contractData, employee_id: id };
      if (editingContract) {
        await contractsAPI.update(editingContract.id, data);
        await showAlert('تم تعديل العقد', 'success');
      } else {
        await contractsAPI.create(data);
        await showAlert('تم إنشاء العقد', 'success');
      }
      setShowContractForm(false);
      fetchEmployee();
    } catch (err) {
      await showAlert(err.response?.data?.errors?.[0] || 'خطأ', 'error');
    }
  };

  const handleDeleteContract = async (contract) => {
    const confirmed = await showConfirm('حذف هذا العقد؟', 'حذف العقد');
    if (!confirmed) return;
    try {
      await contractsAPI.delete(contract.id);
      await showAlert('تم حذف العقد', 'success');
      fetchEmployee();
    } catch (err) {
      await showAlert(err.response?.data?.error || 'خطأ', 'error');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '80px', color: '#64748b' }}>جارٍ التحميل...</div>;
  if (!employee) return null;

  const infoRow = (label, value) => (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>{value || '—'}</div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafbfc' }}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <button onClick={() => navigate('/admin/employees')} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '14px', padding: 0, marginBottom: '12px'
          }}>العودة إلى الموظفين →</button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#1e293b' }}>{employee.full_name}</h1>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontFamily: 'monospace' }}>الرقم الوطني: {employee.nni}</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{
                padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
                backgroundColor: employee.active ? '#dcfce7' : '#fee2e2',
                color: employee.active ? '#166534' : '#dc2626'
              }}>{employee.active ? 'نشط' : 'غير نشط'}</span>
              {canWrite && (
                <button onClick={openEditForm} style={{
                  padding: '8px 16px', borderRadius: '6px', border: '1px solid #167bff',
                  color: '#167bff', backgroundColor: 'white', cursor: 'pointer', fontSize: '14px'
                }}>تعديل</button>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Info Card */}
          <div className="bg-white rounded-lg shadow-sm p-6" style={{ border: '1px solid #e2e8f0' }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>
              المعلومات الشخصية
            </h2>
            {infoRow('الاسم الأول', employee.first_name)}
            {infoRow('اسم العائلة', employee.last_name)}
            {infoRow('تاريخ الميلاد', employee.birth_date)}
            {infoRow('الهاتف', employee.phone)}
            {infoRow('نوع الموظف', employee.employee_type?.name)}
            {infoRow('الولاية', employee.wilaya?.name)}
            {infoRow('المقاطعة', employee.moughataa?.name)}
            {infoRow('البلدية', employee.commune?.name)}
            {infoRow('القرية', employee.village?.name)}
          </div>

          {/* Contracts Card */}
          <div className="bg-white rounded-lg shadow-sm p-6" style={{ border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>العقود</h2>
              {canWrite && (
                <button onClick={() => openContractForm()} style={{
                  padding: '6px 14px', borderRadius: '6px', border: 'none',
                  backgroundColor: '#167bff', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'
                }}>+ إضافة</button>
              )}
            </div>

            {!employee.contracts || employee.contracts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>لا يوجد عقد مسجل</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {employee.contracts.map(c => (
                  <div key={c.id} style={{
                    padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0',
                    backgroundColor: c.active ? '#f0f9ff' : '#f8fafc'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{
                            padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600',
                            backgroundColor: c.contract_type === 'CDI' ? '#167bff20' : '#f59e0b20',
                            color: c.contract_type === 'CDI' ? '#167bff' : '#d97706'
                          }}>{c.contract_type}</span>
                          {c.active && <span style={{
                            padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600',
                            backgroundColor: '#dcfce7', color: '#166534'
                          }}>نشط</span>}
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>
                          {c.amount.toLocaleString()} أوقية/شهر
                        </div>
                        <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                          منذ {c.start_date}
                          {c.duration_months && ` · ${c.duration_months} شهر`}
                        </div>
                      </div>
                      {canWrite && (
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-start' }}>
                          <button onClick={() => openContractForm(c)} style={{
                            padding: '5px 10px', fontSize: '12px', backgroundColor: 'white',
                            border: '1px solid #167bff', color: '#167bff', borderRadius: '4px', cursor: 'pointer'
                          }}>تعديل</button>
                          <button onClick={() => handleDeleteContract(c)} style={{
                            padding: '5px 10px', fontSize: '12px', backgroundColor: 'white',
                            border: '1px solid #ef4444', color: '#ef4444', borderRadius: '4px', cursor: 'pointer'
                          }}>حذف</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Employee Modal */}
      {showEditForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: '20px'
        }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '30px', maxWidth: '560px', width: '100%', margin: 'auto' }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 'bold' }}>تعديل الموظف</h2>
            <form onSubmit={handleEditSubmit}>
              {/* Identity fields from Huwiyeti - read only */}
              <div style={{ marginBottom: '15px', padding: '14px', borderRadius: '6px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px', fontWeight: '500' }}>
                  معلومات الهوية (من هويتي) — غير قابلة للتعديل
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>الرقم الوطني</label>
                    <input type="text" value={editData.nni} readOnly
                      style={{ ...inputStyle, backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'default' }} />
                  </div>
                  <div>
                    <label style={labelStyle}>الاسم الأول</label>
                    <input type="text" value={editData.first_name} readOnly
                      style={{ ...inputStyle, backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'default' }} />
                  </div>
                  <div>
                    <label style={labelStyle}>اسم العائلة</label>
                    <input type="text" value={editData.last_name} readOnly
                      style={{ ...inputStyle, backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'default' }} />
                  </div>
                  <div>
                    <label style={labelStyle}>تاريخ الميلاد</label>
                    <input type="text" value={editData.birth_date} readOnly
                      style={{ ...inputStyle, backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'default' }} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={labelStyle}>الهاتف</label>
                  <input type="text" value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>نوع الموظف *</label>
                  <select value={editData.employee_type_id} onChange={e => setEditData({ ...editData, employee_type_id: e.target.value })} required style={inputStyle}>
                    <option value="">اختر...</option>
                    {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>الولاية</label>
                  <select value={editWilayaId} onChange={e => { setEditWilayaId(e.target.value); setEditData({ ...editData, wilaya_id: e.target.value, moughataa_id: '', commune_id: '', village_id: '' }); }} style={inputStyle}>
                    <option value="">اختر...</option>
                    {wilayas.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>المقاطعة</label>
                  <select value={editMoughataaId} onChange={e => { setEditMoughataaId(e.target.value); setEditData({ ...editData, moughataa_id: e.target.value, commune_id: '', village_id: '' }); }} disabled={!editWilayaId} style={{ ...inputStyle, backgroundColor: !editWilayaId ? '#f1f5f9' : 'white' }}>
                    <option value="">اختر...</option>
                    {moughataaList.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>البلدية</label>
                  <select value={editCommuneId} onChange={e => { setEditCommuneId(e.target.value); setEditData({ ...editData, commune_id: e.target.value, village_id: '' }); }} disabled={!editMoughataaId} style={{ ...inputStyle, backgroundColor: !editMoughataaId ? '#f1f5f9' : 'white' }}>
                    <option value="">اختر...</option>
                    {communesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>القرية</label>
                  <select value={editData.village_id} onChange={e => setEditData({ ...editData, village_id: e.target.value })} disabled={!editCommuneId} style={{ ...inputStyle, backgroundColor: !editCommuneId ? '#f1f5f9' : 'white' }}>
                    <option value="">اختر...</option>
                    {villagesList.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px' }}>
                  <input type="checkbox" checked={editData.active} onChange={e => setEditData({ ...editData, active: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#167bff' }} />
                  <span style={{ fontWeight: '500' }}>الموظف نشط</span>
                </label>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', backgroundColor: '#167bff', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>حفظ</button>
                <button type="button" onClick={() => setShowEditForm(false)} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ddd', backgroundColor: 'white', cursor: 'pointer' }}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contract Modal */}
      {showContractForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '30px', maxWidth: '420px', width: '100%' }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 'bold' }}>
              {editingContract ? 'تعديل العقد' : 'عقد جديد'}
            </h2>
            <form onSubmit={handleContractSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={labelStyle}>نوع العقد *</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {['CDI', 'CDD'].map(type => (
                    <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                      <input type="radio" value={type} checked={contractData.contract_type === type}
                        onChange={e => setContractData({ ...contractData, contract_type: e.target.value })} style={{ accentColor: '#167bff' }} />
                      {type}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={labelStyle}>المبلغ الشهري (أوقية) *</label>
                <input type="number" value={contractData.amount} onChange={e => setContractData({ ...contractData, amount: e.target.value })}
                  required min="0" step="0.01" placeholder="مثال: 50000" style={inputStyle} />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={labelStyle}>تاريخ البدء *</label>
                <input type="date" value={contractData.start_date} onChange={e => setContractData({ ...contractData, start_date: e.target.value })}
                  required style={inputStyle} />
              </div>
              {contractData.contract_type === 'CDD' && (
                <div style={{ marginBottom: '15px' }}>
                  <label style={labelStyle}>المدة (أشهر) *</label>
                  <input type="number" value={contractData.duration_months} onChange={e => setContractData({ ...contractData, duration_months: e.target.value })}
                    required min="1" placeholder="مثال: 12" style={inputStyle} />
                </div>
              )}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px' }}>
                  <input type="checkbox" checked={contractData.active} onChange={e => setContractData({ ...contractData, active: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#167bff' }} />
                  <span style={{ fontWeight: '500' }}>العقد نشط</span>
                </label>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', backgroundColor: '#167bff', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>{editingContract ? 'تعديل' : 'إنشاء'}</button>
                <button type="button" onClick={() => setShowContractForm(false)} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ddd', backgroundColor: 'white', cursor: 'pointer' }}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
