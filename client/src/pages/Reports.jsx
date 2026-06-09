import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportsAPI } from '../services/api';

// Neutral framing on purpose — these are "cases needing review", not accusations.
const SECTIONS = [
  { key: 'youngest',              id: 'sec-youngest',  title: 'أصغر الموظفين سناً',        color: '#ef4444', type: 'list' },
  { key: 'same_mahdara_name',     id: 'sec-mname',     title: 'محاظر بنفس الاسم',          color: '#f59e0b', type: 'groups' },
  { key: 'same_mahdara_location', id: 'sec-mloc',      title: 'محاظر بنفس الموقع',         color: '#f59e0b', type: 'groups' },
  { key: 'same_father',           id: 'sec-father',    title: 'موظفون بنفس الأب (إخوة محتملون)', color: '#8b5cf6', type: 'groups' },
  { key: 'same_bank_account',     id: 'sec-bank',      title: 'موظفون بنفس الحساب البنكي', color: '#167bff', type: 'groups' },
];

function EmployeeLink({ id, name }) {
  return (
    <Link to={`/admin/employees/${id}`} style={{ color: '#167bff', fontWeight: 600 }}>
      {name || '—'}
    </Link>
  );
}

function CountBadge({ count, color }) {
  return (
    <span style={{
      backgroundColor: `${color}1a`, color, fontSize: '13px', fontWeight: 700,
      padding: '2px 10px', borderRadius: '999px', whiteSpace: 'nowrap'
    }}>
      {count}
    </span>
  );
}

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    reportsAPI.getReview()
      .then(res => setData(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const countFor = (key) => (data?.[key]?.length ?? 0);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafbfc' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div style={{ marginBottom: '32px', direction: 'rtl' }}>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#1e293b' }}>التقارير</h1>
          <p style={{ margin: '6px 0 0', color: '#64748b' }}>حالات تحتاج إلى مراجعة عبر جميع الموظفين</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>جارٍ التحميل...</div>
        ) : error ? (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #ef4444', color: '#991b1b', padding: '16px', borderRadius: '8px', textAlign: 'right', direction: 'rtl' }}>
            تعذّر تحميل التقرير. حاول مرة أخرى.
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', direction: 'rtl', marginBottom: '32px' }}>
              {SECTIONS.map(s => (
                <div key={s.key} onClick={() => scrollTo(s.id)} className="bg-white rounded-lg shadow-sm p-5"
                  style={{ border: '1px solid #e2e8f0', borderRight: `4px solid ${s.color}`, cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                  <div style={{ fontSize: '36px', fontWeight: 'bold', color: s.color, textAlign: 'right' }}>{countFor(s.key)}</div>
                  <div style={{ fontSize: '13px', color: '#64748b', textAlign: 'right', marginTop: '4px' }}>{s.title}</div>
                </div>
              ))}
            </div>

            {/* Sections */}
            {SECTIONS.map(s => (
              <Section key={s.key} meta={s} items={data?.[s.key] || []} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function Section({ meta, items }) {
  return (
    <div id={meta.id} className="bg-white rounded-lg shadow-sm" style={{ border: '1px solid #e2e8f0', marginBottom: '24px', direction: 'rtl' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: meta.color, display: 'inline-block' }} />
        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#1e293b', flex: 1 }}>{meta.title}</h2>
        <CountBadge count={items.length} color={meta.color} />
      </div>

      {items.length === 0 ? (
        <div style={{ padding: '24px 20px', color: '#94a3b8', textAlign: 'center' }}>لا توجد حالات</div>
      ) : meta.type === 'list' ? (
        <YoungestTable rows={items} />
      ) : (
        <div style={{ padding: '12px 20px' }}>
          {items.map((g, i) => <Group key={i} group={g} color={meta.color} />)}
        </div>
      )}
    </div>
  );
}

function YoungestTable({ rows }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table dir="rtl" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <thead>
          <tr style={{ color: '#64748b', fontSize: '13px' }}>
            <th style={th}>الاسم</th>
            <th style={th}>الرقم الوطني</th>
            <th style={th}>تاريخ الميلاد</th>
            <th style={th}>العمر</th>
            <th style={th}>النوع</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.employee_id} style={{ borderTop: '1px solid #f1f5f9' }}>
              <td style={td}><EmployeeLink id={r.employee_id} name={r.full_name} /></td>
              <td style={td}>{r.nni}</td>
              <td style={td}>{r.birth_date}</td>
              <td style={{ ...td, fontWeight: 700, color: '#ef4444' }}>{r.age}</td>
              <td style={td}>{r.employee_type || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Group({ group, color }) {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '12px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', backgroundColor: '#f8fafc' }}>
        <span style={{ fontWeight: 700, color: '#1e293b', flex: 1 }}>{group.label || '—'}</span>
        <CountBadge count={group.count} color={color} />
      </div>
      <table dir="rtl" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <tbody>
          {group.employees.map(e => (
            <tr key={e.employee_id} style={{ borderTop: '1px solid #f1f5f9' }}>
              <td style={td}><EmployeeLink id={e.employee_id} name={e.full_name} /></td>
              <td style={td}>{e.nni}</td>
              <td style={td}>{e.employee_type || '—'}</td>
              <td style={td}>{e.mahdara_name || e.location || e.bank || e.account_number || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th = { textAlign: 'right', padding: '10px 20px', fontWeight: 600 };
const td = { padding: '10px 20px', color: '#475569' };
