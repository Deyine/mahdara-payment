import { useState, useEffect } from 'react';

const PLAY_STORE_URL = '#'; // TODO: replace with Google Play Store URL
const APP_STORE_URL = '#';  // TODO: replace with App Store URL

const APP_SCREENS = [
  '/app-screen-1.jpg',
  '/app-screen-2.jpg',
  '/app-screen-3.jpg',
];

function StoreBadges({ justify = 'center' }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: justify }}>
      <a
        href={PLAY_STORE_URL}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          backgroundColor: '#000', color: '#fff',
          padding: '10px 20px', borderRadius: '12px',
          textDecoration: 'none', border: '1px solid #333',
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        <svg style={{ width: '22px', height: '22px', flexShrink: 0 }} viewBox="0 0 24 24" fill="white">
          <path d="M3.18 23.76a2 2 0 0 0 2.17-.22l12.18-7.04-2.73-2.73-11.62 10zm16.14-10.81L16.4 11.1 13.5 14l2.82 2.82 2.99-1.72a1.65 1.65 0 0 0 .01-2.87zM2.06.34A1.65 1.65 0 0 0 1.5 1.67v20.66a1.65 1.65 0 0 0 .56 1.33l.07.06L13.08 14v-.27L2.13.28zm10.01 10.72L3.18.22A2 2 0 0 0 1.01 0l11.56 11.06z"/>
        </svg>
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontSize: '10px', opacity: 0.7, letterSpacing: '0.05em' }}>GET IT ON</div>
          <div style={{ fontSize: '15px', fontWeight: 700 }}>Google Play</div>
        </div>
      </a>
      <a
        href={APP_STORE_URL}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          backgroundColor: '#000', color: '#fff',
          padding: '10px 20px', borderRadius: '12px',
          textDecoration: 'none', border: '1px solid #333',
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        <svg style={{ width: '22px', height: '22px', flexShrink: 0 }} viewBox="0 0 24 24" fill="white">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.15-2.22 1.3-2.2 3.88.03 3.07 2.69 4.1 2.72 4.11l-.07.14zM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
        </svg>
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontSize: '10px', opacity: 0.7, letterSpacing: '0.05em' }}>DOWNLOAD ON THE</div>
          <div style={{ fontSize: '15px', fontWeight: 700 }}>App Store</div>
        </div>
      </a>
    </div>
  );
}

function PhoneMockup() {
  const [current, setCurrent] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % APP_SCREENS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const goTo = (index) => setCurrent(index);

  const handlePointerDown = (e) => {
    setDragging(true);
    setDragStartX(e.clientX ?? e.touches?.[0]?.clientX);
  };

  const handlePointerUp = (e) => {
    if (!dragging || dragStartX === null) return;
    const endX = e.clientX ?? e.changedTouches?.[0]?.clientX;
    const delta = (dragStartX ?? 0) - (endX ?? 0);
    if (delta > 40) setCurrent((prev) => (prev + 1) % APP_SCREENS.length);
    else if (delta < -40) setCurrent((prev) => (prev - 1 + APP_SCREENS.length) % APP_SCREENS.length);
    setDragging(false);
    setDragStartX(null);
  };

  return (
    <div className="flex-shrink-0">
      {/* Phone frame */}
      <div
        style={{
          width: '240px',
          height: '490px',
          background: '#111827',
          borderRadius: '40px',
          padding: '12px',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 2px #374151',
          position: 'relative',
          userSelect: 'none',
        }}
        onMouseDown={handlePointerDown}
        onMouseUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchEnd={handlePointerUp}
      >
        {/* Notch */}
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '72px',
          height: '20px',
          background: '#111827',
          borderRadius: '0 0 14px 14px',
          zIndex: 10,
        }} />

        {/* Screen */}
        <div style={{
          width: '100%',
          height: '100%',
          borderRadius: '30px',
          overflow: 'hidden',
          position: 'relative',
          background: '#000',
          cursor: 'grab',
        }}>
          {APP_SCREENS.map((src, i) => (
            <img
              key={src}
              src={src}
              alt={`App screen ${i + 1}`}
              draggable={false}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'top',
                transition: 'opacity 0.5s ease, transform 0.5s ease',
                opacity: i === current ? 1 : 0,
                transform: i === current ? 'scale(1)' : 'scale(1.03)',
                pointerEvents: 'none',
              }}
            />
          ))}

        </div>

        {/* Side button */}
        <div style={{
          position: 'absolute',
          right: '-3px',
          top: '100px',
          width: '3px',
          height: '60px',
          background: '#374151',
          borderRadius: '0 2px 2px 0',
        }} />
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '14px' }}>
        {APP_SCREENS.map((_, i) => (
          <div
            key={i}
            onClick={() => goTo(i)}
            role="button"
            aria-label={`Screen ${i + 1}`}
            style={{
              width: i === current ? '20px' : '8px',
              height: '8px',
              borderRadius: '4px',
              background: i === current ? '#e61536' : 'rgba(255,255,255,0.35)',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'width 0.3s ease, background 0.3s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Navbar */}
      <nav className="flex items-center px-6 py-4 bg-white shadow-sm">
        <img src="/bestcar-logo.png" alt="BestCar" style={{ height: '32px', width: 'auto' }} />
      </nav>

      {/* Hero */}
      <section
        className="flex-1 flex items-center"
        style={{
          minHeight: '520px',
          backgroundImage: 'url(/hero-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
        }}
      >
        {/* Dark overlay so text stays readable */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(15,23,42,0.82) 0%, rgba(15,23,42,0.65) 60%, rgba(15,23,42,0.50) 100%)',
        }} />
        <div className="max-w-6xl mx-auto px-6 py-16 w-full flex flex-col md:flex-row items-center gap-12" style={{ position: 'relative', zIndex: 1 }}>
          {/* Left: Text + Badges */}
          <div className="flex-1 text-center md:text-left">
<h1 className="text-4xl md:text-5xl font-black leading-tight mb-4" style={{ color: '#ffffff' }}>
              La meilleure façon d'acheter votre prochaine voiture
            </h1>
            <p className="text-lg mb-8" style={{ color: '#94a3b8' }}>
              Parcourez notre catalogue de véhicules importés, consultez les photos avant et après réparation, et contactez-nous directement.
            </p>
            {/* Download Badges */}
            <StoreBadges justify="center" />
          </div>

          {/* Right: Phone Mockup with real screenshots */}
          <PhoneMockup />
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6" style={{ backgroundColor: '#ffffff' }}>
        <div className="max-w-4xl mx-auto">
          <p className="text-sm font-semibold tracking-widest uppercase mb-4 text-center" style={{ color: '#e61536' }}>
            Pourquoi BestCar
          </p>
          <h2 className="text-3xl font-black text-center mb-16" style={{ color: '#0f172a' }}>
            Tout ce qu'il faut pour bien acheter
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                label: 'Catalogue',
                title: 'Tous les véhicules disponibles',
                desc: 'Vente et location, avec prix en MRU, photos et fiche complète pour chaque modèle.',
              },
              {
                label: 'Transparence',
                title: 'Photos avant et après réparation',
                desc: 'Chaque voiture est documentée à l\'arrivée et après remise en état. Vous voyez exactement ce que vous achetez.',
              },
              {
                label: 'Contact',
                title: 'Appelez en un tap',
                desc: 'Depuis la fiche du véhicule, contactez notre équipe directement sans quitter l\'application.',
              },
            ].map((item) => (
              <div key={item.label}>
                <div className="w-8 h-0.5 mb-5" style={{ backgroundColor: '#e61536' }} />
                <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#94a3b8' }}>
                  {item.label}
                </p>
                <h3 className="text-lg font-bold mb-3" style={{ color: '#0f172a' }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Download CTA */}
      <section className="py-20 px-6" style={{ backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
        <div className="max-w-xl mx-auto text-center">
          <img src="/bestcar-logo.png" alt="BestCar" style={{ height: '36px', width: 'auto', margin: '0 auto 24px' }} />
          <h2 className="text-2xl font-black mb-2" style={{ color: '#0f172a' }}>
            Disponible sur iOS et Android
          </h2>
          <p className="text-sm mb-8" style={{ color: '#64748b' }}>
            Téléchargez l'application gratuitement et accédez à tout le catalogue BestCar.
          </p>
          <StoreBadges />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-5 px-6 text-center text-xs" style={{ backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', color: '#94a3b8' }}>
        © 2026 BestCar · Importation, Vente et Location de Voitures
      </footer>
    </div>
  );
}
