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
  const [isPositioned, setIsPositioned] = useState(false);
  const [position, setPosition] = useState({ left: '50%', transform: 'translateX(-50%)' });
  const [arrowPosition, setArrowPosition] = useState({ left: '50%', transform: 'translateX(-50%) rotate(45deg)' });
  const tooltipRef = useRef(null);
  const buttonRef = useRef(null);

  // Adjust tooltip position to prevent overflow
  useEffect(() => {
    if (isOpen && tooltipRef.current && buttonRef.current) {
      setIsPositioned(false);

      // Small delay to ensure tooltip is fully rendered in DOM
      const timer = setTimeout(() => {
        if (!tooltipRef.current || !buttonRef.current) return;

        const tooltip = tooltipRef.current;
        const button = buttonRef.current;
        const tooltipRect = tooltip.getBoundingClientRect();
        const buttonRect = button.getBoundingClientRect();

        const viewportWidth = window.innerWidth;
        const margin = 16; // Minimum margin from screen edge

        // Calculate if tooltip would overflow left or right
        const overflowLeft = tooltipRect.left < margin;
        const overflowRight = tooltipRect.right > (viewportWidth - margin);

        if (overflowLeft) {
          // Align tooltip to left edge with margin
          const buttonCenter = buttonRect.left + (buttonRect.width / 2);
          setPosition({ left: '0', transform: 'none' });
          setArrowPosition({
            left: `${buttonCenter - tooltipRect.left}px`,
            transform: 'translateX(-50%) rotate(45deg)'
          });
        } else if (overflowRight) {
          // Align tooltip to right edge with margin
          const buttonCenter = buttonRect.left + (buttonRect.width / 2);
          const tooltipWidth = tooltipRect.width;
          setPosition({ right: '0', left: 'auto', transform: 'none' });
          setArrowPosition({
            left: `${tooltipWidth - (viewportWidth - buttonCenter)}px`,
            transform: 'translateX(-50%) rotate(45deg)'
          });
        } else {
          // Center position (default)
          setPosition({ left: '50%', transform: 'translateX(-50%)' });
          setArrowPosition({ left: '50%', transform: 'translateX(-50%) rotate(45deg)' });
        }

        setIsPositioned(true);
      }, 10);

      return () => clearTimeout(timer);
    } else {
      setIsPositioned(false);
    }
  }, [isOpen]);

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
            bottom: '100%',
            ...position,
            marginBottom: '8px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            border: '1px solid #e2e8f0',
            padding: '12px',
            minWidth: '200px',
            zIndex: 100,
            whiteSpace: 'nowrap',
            opacity: isPositioned ? 1 : 0,
            transition: 'opacity 0.15s ease-in-out'
          }}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          {/* Arrow */}
          <div
            style={{
              position: 'absolute',
              bottom: '-6px',
              ...arrowPosition,
              width: '12px',
              height: '12px',
              backgroundColor: 'white',
              borderRight: '1px solid #e2e8f0',
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
