import { useState, useEffect } from 'react';

const PLAY_STORE_URL = '#'; // TODO: replace with Google Play Store URL
const APP_STORE_URL = '#';  // TODO: replace with App Store URL

const APP_SCREENS = [
  '/app-screen-1.jpg',
  '/app-screen-2.jpg',
  '/app-screen-3.jpg',
];

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
    <div className="flex-shrink-0 flex flex-col items-center gap-4">
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
      <div className="flex gap-2">
        {APP_SCREENS.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Screen ${i + 1}`}
            style={{
              width: i === current ? '20px' : '8px',
              height: '8px',
              borderRadius: '4px',
              background: i === current ? '#e61536' : 'rgba(255,255,255,0.35)',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
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
        <span className="text-2xl font-black tracking-tight" style={{ color: '#e61536' }}>
          BESTCAR
        </span>
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
          background: 'linear-gradient(135deg, rgba(15,23,42,0.93) 0%, rgba(15,23,42,0.80) 60%, rgba(15,23,42,0.70) 100%)',
        }} />
        <div className="max-w-6xl mx-auto px-6 py-16 w-full flex flex-col md:flex-row items-center gap-12" style={{ position: 'relative', zIndex: 1 }}>
          {/* Left: Text + Badges */}
          <div className="flex-1 text-center md:text-left">
            <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-6" style={{ backgroundColor: '#1e293b', color: '#e61536' }}>
              Mauritanie · Import · Vente · Location
            </div>
            <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4" style={{ color: '#ffffff' }}>
              La meilleure façon d'acheter votre prochaine voiture
            </h1>
            <p className="text-lg mb-8" style={{ color: '#94a3b8' }}>
              Parcourez notre catalogue de véhicules importés, consultez les photos avant et après réparation, et contactez-nous directement.
            </p>
            {/* Download Badges */}
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <a
                href={PLAY_STORE_URL}
                className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.18 23.76a2 2 0 0 0 2.17-.22l12.18-7.04-2.73-2.73-11.62 10zm16.14-10.81L16.4 11.1 13.5 14l2.82 2.82 2.99-1.72a1.65 1.65 0 0 0 .01-2.87zM2.06.34A1.65 1.65 0 0 0 1.5 1.67v20.66a1.65 1.65 0 0 0 .56 1.33l.07.06L13.08 14v-.27L2.13.28zm10.01 10.72L3.18.22A2 2 0 0 0 1.01 0l11.56 11.06z"/>
                </svg>
                Google Play
              </a>
              <a
                href={APP_STORE_URL}
                className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.15-2.22 1.3-2.2 3.88.03 3.07 2.69 4.1 2.72 4.11l-.07.14zM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                App Store
              </a>
            </div>
          </div>

          {/* Right: Phone Mockup with real screenshots */}
          <PhoneMockup />
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6" style={{ backgroundColor: '#f8fafc' }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ color: '#1e293b' }}>
            Tout ce dont vous avez besoin
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: '🚗',
                title: 'Catalogue de véhicules',
                desc: 'Parcourez tous nos véhicules importés disponibles à la vente ou à la location, avec photos et détails complets.',
              },
              {
                icon: '📸',
                title: 'Photos avant/après',
                desc: "Consultez l'état réel de chaque véhicule avec des photos avant et après réparation pour acheter en toute confiance.",
              },
              {
                icon: '📞',
                title: 'Contact direct',
                desc: 'Appelez-nous en un seul tap directement depuis la fiche du véhicule. Notre équipe est disponible pour vous accompagner.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl p-6 shadow-sm"
                style={{ border: '1px solid #e2e8f0' }}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#1e293b' }}>{feature.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Download CTA */}
      <section className="py-16 px-6 text-center" style={{ backgroundColor: '#e61536' }}>
        <h2 className="text-3xl font-black mb-3" style={{ color: '#ffffff' }}>
          Téléchargez l'application
        </h2>
        <p className="mb-8 text-lg" style={{ color: 'rgba(255,255,255,0.85)' }}>
          Disponible gratuitement sur iOS et Android
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <a
            href={PLAY_STORE_URL}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#ffffff', color: '#e61536' }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.18 23.76a2 2 0 0 0 2.17-.22l12.18-7.04-2.73-2.73-11.62 10zm16.14-10.81L16.4 11.1 13.5 14l2.82 2.82 2.99-1.72a1.65 1.65 0 0 0 .01-2.87zM2.06.34A1.65 1.65 0 0 0 1.5 1.67v20.66a1.65 1.65 0 0 0 .56 1.33l.07.06L13.08 14v-.27L2.13.28zm10.01 10.72L3.18.22A2 2 0 0 0 1.01 0l11.56 11.06z"/>
            </svg>
            Google Play
          </a>
          <a
            href={APP_STORE_URL}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#ffffff', color: '#e61536' }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.15-2.22 1.3-2.2 3.88.03 3.07 2.69 4.1 2.72 4.11l-.07.14zM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            App Store
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-6 text-center text-sm" style={{ backgroundColor: '#0f172a', color: '#64748b' }}>
        © 2026 BestCar · Importation, Vente et Location de Voitures
      </footer>
    </div>
  );
}
