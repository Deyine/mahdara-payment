import { useState, useRef, useEffect } from 'react';

/**
 * InfoTooltip - A component that shows an info icon with a detailed popover on hover/click
 *
 * @param {Object} props
 * @param {Array} props.items - Array of {label, value, color?} objects to display
 * @param {string} props.title - Optional title for the tooltip
 */
export default function InfoTooltip({ items, title }) {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef(null);
  const buttonRef = useRef(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '2px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
          transition: 'color 0.2s'
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={tooltipRef}
          style={{
            position: 'absolute',
            left: 'calc(100% + 8px)',
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            border: '1px solid #e2e8f0',
            padding: '12px',
            minWidth: '200px',
            zIndex: 100,
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          {/* Arrow pointing left */}
          <div
            style={{
              position: 'absolute',
              left: '-6px',
              top: '50%',
              transform: 'translateY(-50%) rotate(45deg)',
              width: '12px',
              height: '12px',
              backgroundColor: 'white',
              borderLeft: '1px solid #e2e8f0',
              borderBottom: '1px solid #e2e8f0'
            }}
          />

          {title && (
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#64748b',
              marginBottom: '8px',
              paddingBottom: '6px',
              borderBottom: '1px solid #e2e8f0',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {title}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {items.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px',
                  fontSize: '13px'
                }}
              >
                <span style={{ color: '#64748b' }}>{item.label}</span>
                <span style={{
                  fontWeight: '600',
                  color: item.color || '#1e293b'
                }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
