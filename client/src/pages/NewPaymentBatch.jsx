import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDialog } from '../context/DialogContext';
import { employeesAPI, paymentBatchesAPI } from '../services/api';

export default function NewPaymentBatch() {
  const navigate = useNavigate();
  const { showAlert } = useDialog();
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  // Batch metadata
  const [paymentDate, setPaymentDate] = useState('');
  const [notes, setNotes] = useState('');

  // Selected employees: { [employee_id]: { months_count, amount } }
  const [selected, setSelected] = useState({});
  const [globalMonths, setGlobalMonths] = useState(1);

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await employeesAPI.getAll();
      // Only active employees with active contracts
      setAllEmployees(res.data.employees.filter(e => e.active && e.active_contract));
    } catch {
      await showAlert('خطأ في تحميل الموظفين', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() =>
    allEmployees.filter(e =>
      !search || e.full_name.toLowerCase().includes(search.toLowerCase()) || e.nni.includes(search)
    ), [allEmployees, search]);

  const allFilteredSelected = filtered.length > 0 && filtered.every(e => !!selected[e.id]);
  const someFilteredSelected = filtered.some(e => !!selected[e.id]);

  const toggleAll = () => {
    if (allFilteredSelected) {
      setSelected(prev => {
        const next = { ...prev };
        filtered.forEach(e => delete next[e.id]);
        return next;
      });
    } else {
      setSelected(prev => {
        const next = { ...prev };
        filtered.forEach(e => {
          if (!next[e.id]) next[e.id] = { months_count: globalMonths, amount: e.active_contract.amount };
        });
        return next;
      });
    }
  };

  const toggleEmployee = (emp) => {
    setSelected(prev => {
      if (prev[emp.id]) {
        const next = { ...prev };
        delete next[emp.id];
        return next;
      }
      return { ...prev, [emp.id]: { months_count: globalMonths, amount: emp.active_contract.amount } };
    });
  };

  const updateMonths = (empId, value) => {
    const months = Math.max(1, parseInt(value) || 1);
    setSelected(prev => ({ ...prev, [empId]: { ...prev[empId], months_count: months } }));
  };

  const applyGlobalMonths = () => {
    const months = parseInt(globalMonths);
    if (!months || months < 1) {
      showAlert('عدد الأشهر يجب أن يكون رقماً صحيحاً أكبر من 0', 'error');
      return;
    }
    setSelected(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(id => { next[id] = { ...next[id], months_count: months }; });
      return next;
    });
  };

  const total = useMemo(() =>
    Object.entries(selected).reduce((sum, [empId, data]) => {
      return sum + (parseFloat(data.amount) || 0) * data.months_count;
    }, 0),
    [selected]
  );

  const selectedCount = Object.keys(selected).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!paymentDate) { await showAlert('تاريخ الدفع مطلوب', 'error'); return; }
    if (selectedCount === 0) { await showAlert('اختر موظفاً على الأقل', 'error'); return; }

    setSubmitting(true);
    try {
      const employees = Object.entries(selected).map(([employee_id, data]) => ({
        employee_id,
        months_count: data.months_count,
        amount: parseFloat(data.amount)
      }));

      await paymentBatchesAPI.create({ payment_date: paymentDate, notes }, employees);
      await showAlert('تم إنشاء الدفعة بنجاح', 'success');
      navigate('/admin/payments');
    } catch (err) {
      await showAlert(err.response?.data?.errors?.[0] || 'خطأ في الإنشاء', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafbfc' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div style={{ marginBottom: '24px', direction: 'rtl', textAlign: 'right' }}>
          <button onClick={() => navigate('/admin/payments')} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '14px', padding: 0, marginBottom: '12px'
          }}>← العودة إلى الدفعات</button>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#1e293b' }}>دفعة مرتبات جديدة</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start', direction: 'ltr' }}>
            {/* Left: Employee Selection */}
            <div>
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6" style={{ border: '1px solid #e2e8f0' }}>
                <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold', color: '#1e293b', textAlign: 'right' }}>
                  اختر الموظفين
                </h2>
                <input type="text" dir="rtl" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="البحث بالاسم أو الرقم الوطني..." style={{
                    width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd',
                    fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box'
                  }} />

                {/* Global controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px', padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', direction: 'rtl' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>
                    <input type="checkbox"
                      checked={allFilteredSelected}
                      ref={el => { if (el) el.indeterminate = someFilteredSelected && !allFilteredSelected; }}
                      onChange={toggleAll}
                      style={{ width: '16px', height: '16px', accentColor: '#167bff', cursor: 'pointer' }} />
                    تحديد الكل
                  </label>
                  <div style={{ width: '1px', height: '20px', backgroundColor: '#e2e8f0' }} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#475569' }}>
                    عدد الأشهر للجميع:
                    <input type="number" value={globalMonths} min="1"
                      onChange={e => setGlobalMonths(e.target.value)}
                      style={{ width: '60px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #167bff', fontSize: '14px', fontWeight: '600', textAlign: 'center' }} />
                    <button type="button" onClick={applyGlobalMonths} style={{
                      padding: '4px 12px', borderRadius: '4px', border: 'none', cursor: 'pointer',
                      backgroundColor: '#167bff', color: 'white', fontSize: '13px', fontWeight: '500'
                    }}>تطبيق على الجميع</button>
                  </label>
                </div>

                {loading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>جارٍ التحميل...</div>
                ) : filtered.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    لا يوجد موظف نشط بعقد نشط.
                  </div>
                ) : (
                  <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    <table dir="rtl" style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                        <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                          <th style={{ padding: '10px', width: '40px', textAlign: 'center' }}>
                          </th>
                          <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>الموظف</th>
                          <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>المبلغ/شهر</th>
                          <th style={{ padding: '10px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#64748b', width: '100px' }}>عدد الأشهر</th>
                          <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>المجموع الجزئي</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map(emp => {
                          const isSelected = !!selected[emp.id];
                          const data = selected[emp.id];
                          const subtotal = isSelected ? (parseFloat(data.amount) * data.months_count) : 0;
                          return (
                            <tr key={emp.id} onClick={() => toggleEmployee(emp)} style={{
                              borderBottom: '1px solid #e2e8f0', cursor: 'pointer',
                              backgroundColor: isSelected ? '#f0f9ff' : 'white'
                            }}
                              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'white'; }}>
                              <td style={{ padding: '12px 10px' }} onClick={e => e.stopPropagation()}>
                                <input type="checkbox" checked={isSelected} onChange={() => toggleEmployee(emp)}
                                  style={{ width: '16px', height: '16px', accentColor: '#167bff', cursor: 'pointer' }} />
                              </td>
                              <td style={{ padding: '12px 10px' }}>
                                <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>{emp.full_name}</div>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>
                                  {emp.nni} · {emp.employee_type?.name}
                                </div>
                              </td>
                              <td style={{ padding: '12px 10px', textAlign: 'right', fontSize: '14px', color: '#1e293b' }}>
                                {emp.active_contract.amount.toLocaleString()} MRU
                              </td>
                              <td style={{ padding: '12px 10px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                                {isSelected ? (
                                  <input type="number" value={data.months_count} min="1"
                                    onChange={e => updateMonths(emp.id, e.target.value)}
                                    onClick={e => e.stopPropagation()}
                                    style={{
                                      width: '70px', padding: '6px', textAlign: 'center', borderRadius: '4px',
                                      border: '1px solid #167bff', fontSize: '14px', fontWeight: '600'
                                    }} />
                                ) : (
                                  <span style={{ color: '#94a3b8', fontSize: '13px' }}>—</span>
                                )}
                              </td>
                              <td style={{ padding: '12px 10px', textAlign: 'right', fontSize: '14px', fontWeight: isSelected ? '600' : '400', color: isSelected ? '#167bff' : '#94a3b8' }}>
                                {isSelected ? `${subtotal.toLocaleString()} MRU` : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Summary & Batch Info */}
            <div style={{ position: 'sticky', top: '20px', direction: 'rtl' }}>
              {/* Batch Metadata */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6" style={{ border: '1px solid #e2e8f0' }}>
                <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold', color: '#1e293b', textAlign: 'right' }}>
                  معلومات الدفعة
                </h2>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500', textAlign: 'right' }}>تاريخ الدفع *</label>
                  <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} required style={{
                    width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box'
                  }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500', textAlign: 'right' }}>ملاحظات (اختياري)</label>
                  <textarea dir="rtl" value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{
                    width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box'
                  }} placeholder="مثال: مرتبات يناير 2026..." />
                </div>

                <button type="submit" disabled={submitting || selectedCount === 0 || !paymentDate} style={{
                  width: '100%', padding: '12px', borderRadius: '6px', border: 'none', fontSize: '15px', fontWeight: 'bold',
                  cursor: (submitting || selectedCount === 0 || !paymentDate) ? 'not-allowed' : 'pointer',
                  backgroundColor: (submitting || selectedCount === 0 || !paymentDate) ? '#94a3b8' : '#167bff',
                  color: 'white'
                }}>
                  {submitting ? 'جارٍ الإنشاء...' : `إنشاء الدفعة (${selectedCount} موظف)`}
                </button>
                <button type="button" onClick={() => navigate('/admin/payments')} style={{
                  width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd',
                  backgroundColor: 'white', cursor: 'pointer', marginTop: '8px', fontSize: '14px'
                }}>إلغاء</button>
              </div>

              {/* Live Total Block */}
              <div className="bg-white rounded-lg shadow-sm p-6" style={{ border: '2px solid #167bff' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px', letterSpacing: '0.05em' }}>
                    إجمالي الدفعة
                  </div>
                  <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#167bff', marginBottom: '8px' }}>
                    {total.toLocaleString()}
                    <span style={{ fontSize: '16px', fontWeight: '500', marginRight: '6px' }}>أوقية</span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>
                    {selectedCount} موظف مختار
                  </div>
                </div>

                {selectedCount > 0 && (
                  <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                    {Object.entries(selected).map(([empId, data]) => {
                      const emp = allEmployees.find(e => e.id === empId);
                      if (!emp) return null;
                      return (
                        <div key={empId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                          <span style={{ color: '#64748b' }}>{emp.full_name}</span>
                          <span style={{ color: '#1e293b', fontWeight: '500' }}>
                            ×{data.months_count} = {(data.amount * data.months_count).toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
