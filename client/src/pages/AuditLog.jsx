import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';
import { auditLogsAPI } from '../services/api';
import SearchableSelect from '../components/SearchableSelect';
import DateRangePicker from '../components/DateRangePicker';
import { ENTITY_TYPE_LABELS, EVENT_LABELS, EVENT_COLORS } from '../constants/auditLog';

const entityOptions = Object.entries(ENTITY_TYPE_LABELS).map(([value, label]) => ({ value, label }));

export default function AuditLog() {
  const { isSuperAdmin } = useAuth();
  const { showAlert } = useDialog();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterItemType, setFilterItemType] = useState('');
  const [filterEvent, setFilterEvent] = useState('');
  const [filterCreatedFrom, setFilterCreatedFrom] = useState('');
  const [filterCreatedTo, setFilterCreatedTo] = useState('');
  const [queryPage, setQueryPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    if (!isSuperAdmin) return;
    let cancelled = false;
    const doFetch = async () => {
      setLoading(true);
      try {
        const params = { page: queryPage };
        if (filterItemType) params.item_type = filterItemType;
        if (filterEvent) params.event = filterEvent;
        if (filterCreatedFrom) params.created_from = filterCreatedFrom;
        if (filterCreatedTo) params.created_to = filterCreatedTo;
        const res = await auditLogsAPI.getAll(params);
        if (!cancelled) {
          setLogs(res.data.audit_logs);
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
  }, [isSuperAdmin, filterItemType, filterEvent, filterCreatedFrom, filterCreatedTo, queryPage]);

  if (!isSuperAdmin) return <Navigate to="/admin" replace />;

  const selectedEntity = entityOptions.find(o => o.value === filterItemType) || null;

  const eventPill = (event) => {
    const colors = EVENT_COLORS[event] || { bg: '#f1f5f9', fg: '#475569' };
    return (
      <span style={{
        padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '600',
        backgroundColor: colors.bg, color: colors.fg
      }}>{EVENT_LABELS[event] || event}</span>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafbfc' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', direction: 'rtl' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#1e293b' }}>سجل التغييرات</h1>
            <p style={{ margin: '4px 0 0', color: '#64748b' }}>{totalCount} تغيير مسجل</p>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center', direction: 'rtl' }}>
          <div style={{ minWidth: '200px' }}>
            <SearchableSelect
              options={entityOptions}
              value={selectedEntity}
              onChange={opt => { setFilterItemType(opt?.value || ''); setQueryPage(1); }}
              placeholder="جميع الكيانات"
              isClearable={true}
            />
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { label: 'الكل', value: '' },
              { label: 'إنشاء', value: 'create' },
              { label: 'تعديل', value: 'update' },
              { label: 'حذف', value: 'destroy' }
            ].map(pill => (
              <button key={pill.value} onClick={() => { setFilterEvent(pill.value); setQueryPage(1); }} style={{
                padding: '8px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '500',
                cursor: 'pointer', whiteSpace: 'nowrap', border: '1px solid',
                backgroundColor: filterEvent === pill.value ? '#167bff' : 'white',
                color: filterEvent === pill.value ? 'white' : '#475569',
                borderColor: filterEvent === pill.value ? '#167bff' : '#e2e8f0'
              }}>{pill.label}</button>
            ))}
          </div>
          <DateRangePicker
            from={filterCreatedFrom}
            to={filterCreatedTo}
            placeholder="تاريخ التغيير"
            onChange={({ from, to }) => { setFilterCreatedFrom(from); setFilterCreatedTo(to); setQueryPage(1); }}
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm" style={{ border: '1px solid #e2e8f0' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px', gap: '12px', color: '#64748b' }}>
              <div className="animate-spin rounded-full" style={{ width: '24px', height: '24px', border: '2px solid #e2e8f0', borderTopColor: '#167bff' }} />
              جارٍ التحميل...
            </div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>لا توجد تغييرات.</div>
          ) : (
            <table dir="rtl" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>التاريخ والوقت</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>المستخدم</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>الكيان</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>السجل</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>الإجراء</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>ملخص التغييرات</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>عنوان IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #e2e8f0', cursor: 'pointer' }}
                    onClick={() => setSelectedLog(log)}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#1e293b' }}>
                      {new Date(log.created_at).toLocaleString('fr-FR')}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>
                      {log.whodunnit?.name || 'نظام'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>
                      {ENTITY_TYPE_LABELS[log.item_type] || log.item_type}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#94a3b8', fontFamily: 'monospace' }}>
                      {log.item_id?.slice(0, 8)}…
                    </td>
                    <td style={{ padding: '14px 16px' }}>{eventPill(log.event)}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>
                      {Object.keys(log.changes || {}).length} حقول
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#94a3b8', fontFamily: 'monospace' }}>
                      {log.ip_address || '—'}
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

      {/* Diff Modal */}
      {selectedLog && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: '20px'
        }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '30px', maxWidth: '600px', width: '100%', margin: 'auto', direction: 'rtl' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', textAlign: 'right' }}>
                  {ENTITY_TYPE_LABELS[selectedLog.item_type] || selectedLog.item_type} — {EVENT_LABELS[selectedLog.event] || selectedLog.event}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                  {new Date(selectedLog.created_at).toLocaleString('fr-FR')} — {selectedLog.whodunnit?.name || 'نظام'}
                </p>
              </div>
              {eventPill(selectedLog.event)}
            </div>

            <div style={{ maxHeight: '360px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600', color: '#64748b' }}>الحقل</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600', color: '#64748b' }}>القيمة السابقة</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600', color: '#64748b' }}>القيمة الجديدة</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(selectedLog.changes || {}).map(([field, [oldVal, newVal]]) => (
                    <tr key={field} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#1e293b' }}>{field}</td>
                      <td style={{ padding: '10px 12px', color: '#dc2626' }}>{oldVal === null || oldVal === undefined ? '—' : String(oldVal)}</td>
                      <td style={{ padding: '10px 12px', color: '#166534' }}>{newVal === null || newVal === undefined ? '—' : String(newVal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedLog.user_agent && (
              <p style={{ margin: '12px 0 0', fontSize: '12px', color: '#94a3b8', wordBreak: 'break-all' }}>
                {selectedLog.user_agent}
              </p>
            )}

            <div style={{ marginTop: '20px' }}>
              <button type="button" onClick={() => setSelectedLog(null)} style={{
                width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd',
                backgroundColor: 'white', cursor: 'pointer'
              }}>إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
