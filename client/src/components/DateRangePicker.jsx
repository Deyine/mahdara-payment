import { useState, useRef, useEffect } from 'react';

const toISO = (d) => d.toISOString().slice(0, 10);

const PRESETS = [
  { label: 'اليوم', range: () => { const t = new Date(); return [toISO(t), toISO(t)]; } },
  { label: 'آخر 7 أيام', range: () => { const t = new Date(); const s = new Date(); s.setDate(s.getDate() - 6); return [toISO(s), toISO(t)]; } },
  { label: 'هذا الشهر', range: () => { const t = new Date(); const s = new Date(t.getFullYear(), t.getMonth(), 1); return [toISO(s), toISO(t)]; } },
];

export default function DateRangePicker({ from, to, onChange, placeholder = 'اختر الفترة' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasValue = !!(from || to);
  const label = hasValue ? `${from || '...'} → ${to || '...'}` : placeholder;

  const applyPreset = (range) => {
    const [s, e] = range();
    onChange({ from: s, to: e });
  };

  const clear = () => onChange({ from: '', to: '' });

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '9px 14px', borderRadius: '8px',
        border: `1px solid ${hasValue ? '#167bff' : '#e2e8f0'}`,
        backgroundColor: 'white', cursor: 'pointer', fontSize: '14px',
        color: hasValue ? '#167bff' : '#64748b', whiteSpace: 'nowrap',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
      }}>
        <span>📅</span>
        <span>{label}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 20,
          backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          padding: '16px', minWidth: '260px', direction: 'rtl'
        }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
            {PRESETS.map(p => (
              <button key={p.label} type="button" onClick={() => applyPreset(p.range)} style={{
                padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500',
                border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#475569', cursor: 'pointer'
              }}>{p.label}</button>
            ))}
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#64748b' }}>من</label>
            <input type="date" value={from} max={to || undefined}
              onChange={e => onChange({ from: e.target.value, to })}
              style={{
                width: '100%', padding: '8px 10px', borderRadius: '6px',
                border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box', color: '#1e293b'
              }} />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#64748b' }}>إلى</label>
            <input type="date" value={to} min={from || undefined}
              onChange={e => onChange({ from, to: e.target.value })}
              style={{
                width: '100%', padding: '8px 10px', borderRadius: '6px',
                border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box', color: '#1e293b'
              }} />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={clear} disabled={!hasValue} style={{
              flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0',
              backgroundColor: 'white', color: hasValue ? '#ef4444' : '#cbd5e1',
              cursor: hasValue ? 'pointer' : 'default', fontSize: '13px'
            }}>مسح</button>
            <button type="button" onClick={() => setOpen(false)} style={{
              flex: 1, padding: '8px', borderRadius: '6px', border: 'none',
              backgroundColor: '#167bff', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '500'
            }}>تم</button>
          </div>
        </div>
      )}
    </div>
  );
}
