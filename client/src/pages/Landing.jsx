import { useState, useEffect } from 'react';
import { FaGooglePlay, FaApple, FaFacebook, FaGlobe } from 'react-icons/fa';

const PLAY_STORE_URL = '#'; // TODO: replace with Google Play Store URL
const APP_STORE_URL = '#';  // TODO: replace with App Store URL

const APP_SCREENS = [
  '/app-screen-1.jpg',
  '/app-screen-2.jpg',
  '/app-screen-3.jpg',
];

const T = {
  fr: {
    heroTitle: 'La meilleure façon d\'acheter votre prochaine voiture',
    heroSubtitle: 'Parcourez notre catalogue de véhicules importés, consultez les photos avant et après réparation, et contactez-nous directement.',
    whyLabel: 'Pourquoi BestCar',
    whyTitle: 'Tout ce qu\'il faut pour bien acheter',
    features: [
      { label: 'Catalogue', title: 'Tous les véhicules disponibles', desc: 'Vente et location, avec prix en MRU, photos et fiche complète pour chaque modèle.' },
      { label: 'Transparence', title: 'Photos avant et après réparation', desc: 'Chaque voiture est documentée à l\'arrivée et après remise en état. Vous voyez exactement ce que vous achetez.' },
      { label: 'Contact', title: 'Appelez en un tap', desc: 'Depuis la fiche du véhicule, contactez notre équipe directement sans quitter l\'application.' },
    ],
    ctaTitle: 'Disponible sur iOS et Android',
    ctaSubtitle: 'Téléchargez l\'application gratuitement et accédez à tout le catalogue BestCar.',
    footer: '© 2026 BestCar · Importation, Vente et Location de Voitures',
    facebook: 'Suivez-nous sur Facebook',
    getItOn: 'DISPONIBLE SUR',
    downloadOn: 'TÉLÉCHARGER SUR',
  },
  ar: {
    heroTitle: 'أفضل طريقة لشراء سيارتك القادمة',
    heroSubtitle: 'تصفح كتالوج سياراتنا المستوردة، شاهد صور ما قبل وما بعد الإصلاح، وتواصل معنا مباشرة.',
    whyLabel: 'لماذا بيست كار',
    whyTitle: 'كل ما تحتاجه للشراء بثقة',
    features: [
      { label: 'الكتالوج', title: 'جميع السيارات المتاحة', desc: 'للبيع والإيجار، مع الأسعار بالأوقية وصور كاملة وبطاقة تفصيلية لكل موديل.' },
      { label: 'الشفافية', title: 'صور قبل وبعد الإصلاح', desc: 'كل سيارة موثقة عند الوصول وبعد الإصلاح. ترى بالضبط ما تشتريه.' },
      { label: 'التواصل', title: 'اتصل بضغطة واحدة', desc: 'من صفحة السيارة، تواصل مع فريقنا مباشرة دون مغادرة التطبيق.' },
    ],
    ctaTitle: 'متاح على iOS و Android',
    ctaSubtitle: 'حمّل التطبيق مجاناً وتصفح كامل كتالوج BestCar.',
    footer: '© 2026 BestCar · استيراد وبيع وتأجير السيارات',
    facebook: 'تابعنا على فيسبوك',
    getItOn: 'احصل عليه من',
    downloadOn: 'حمّل من',
  },
};

function StoreBadges({ justify = 'center', t }) {
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
        <FaGooglePlay style={{ width: '22px', height: '22px', flexShrink: 0 }} />
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontSize: '10px', opacity: 0.7, letterSpacing: '0.05em' }}>{t.getItOn}</div>
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
        <FaApple style={{ width: '22px', height: '22px', flexShrink: 0 }} />
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontSize: '10px', opacity: 0.7, letterSpacing: '0.05em' }}>{t.downloadOn}</div>
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
          position: 'absolute', top: '12px', left: '50%',
          transform: 'translateX(-50%)', width: '72px', height: '20px',
          background: '#111827', borderRadius: '0 0 14px 14px', zIndex: 10,
        }} />

        {/* Screen */}
        <div style={{
          width: '100%', height: '100%', borderRadius: '30px',
          overflow: 'hidden', position: 'relative', background: '#000', cursor: 'grab',
        }}>
          {APP_SCREENS.map((src, i) => (
            <img
              key={src}
              src={src}
              alt={`App screen ${i + 1}`}
              draggable={false}
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'top',
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
          position: 'absolute', right: '-3px', top: '100px',
          width: '3px', height: '60px', background: '#374151',
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
              width: i === current ? '20px' : '8px', height: '8px',
              borderRadius: '4px',
              background: i === current ? '#e61536' : 'rgba(255,255,255,0.35)',
              cursor: 'pointer', flexShrink: 0,
              transition: 'width 0.3s ease, background 0.3s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Landing() {
  const [lang, setLang] = useState('fr');
  const t = T[lang];
  const isAr = lang === 'ar';

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ fontFamily: isAr ? '"Segoe UI", Tahoma, Arial, sans-serif' : 'system-ui, sans-serif' }}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white shadow-sm">
        <img src="/bestcar-logo.png" alt="BestCar" style={{ height: '32px', width: 'auto' }} />
        <button
          onClick={() => setLang(isAr ? 'fr' : 'ar')}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'none', border: '1px solid #e2e8f0',
            borderRadius: '8px', padding: '6px 12px',
            cursor: 'pointer', color: '#64748b', fontSize: '13px', fontWeight: 600,
          }}
        >
          <FaGlobe size={14} />
          {isAr ? 'Français' : 'عربي'}
        </button>
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
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(15,23,42,0.82) 0%, rgba(15,23,42,0.65) 60%, rgba(15,23,42,0.50) 100%)',
        }} />
        <div
          className="max-w-6xl mx-auto px-6 py-16 w-full flex flex-col md:flex-row items-center gap-12"
          style={{ position: 'relative', zIndex: 1 }}
        >
          <div className="flex-1 text-center md:text-left" style={{ textAlign: isAr ? 'right' : undefined }}>
            <h1
              className="text-4xl md:text-5xl font-black leading-tight mb-4"
              style={{ color: '#ffffff', lineHeight: isAr ? 1.5 : undefined }}
            >
              {t.heroTitle}
            </h1>
            <p className="text-lg mb-8" style={{ color: '#94a3b8' }}>
              {t.heroSubtitle}
            </p>
            <StoreBadges justify={isAr ? 'flex-end' : 'center'} t={t} />
          </div>
          <PhoneMockup />
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6" style={{ backgroundColor: '#ffffff' }}>
        <div className="max-w-4xl mx-auto">
          {/* Facebook Page Widget */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
            <iframe
              src={`https://www.facebook.com/plugins/page.php?href=${encodeURIComponent('https://www.facebook.com/profile.php?id=61556019583684')}&tabs&width=280&height=80&small_header=true&adapt_container_width=false&hide_cover=true&show_facepile=true`}
              width="280"
              height="80"
              style={{ border: 'none', overflow: 'hidden', borderRadius: '10px', display: 'block' }}
              scrolling="no"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            />
          </div>

          <p
            className="text-sm font-semibold tracking-widest uppercase mb-4 text-center"
            style={{ color: '#e61536' }}
          >
            {t.whyLabel}
          </p>
          <h2 className="text-3xl font-black text-center mb-16" style={{ color: '#0f172a' }}>
            {t.whyTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {t.features.map((item) => (
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
            {t.ctaTitle}
          </h2>
          <p className="text-sm mb-8" style={{ color: '#64748b' }}>
            {t.ctaSubtitle}
          </p>
          <StoreBadges t={t} />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-5 px-6 text-xs" style={{ backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', color: '#94a3b8' }}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>{t.footer}</span>
          <a
            href="https://www.facebook.com/profile.php?id=61556019583684"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
            style={{ color: '#94a3b8', textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.color = '#1877f2'}
            onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
          >
            <FaFacebook size={16} />
            <span>{t.facebook}</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
