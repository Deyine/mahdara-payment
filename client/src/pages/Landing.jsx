import { Link } from 'react-router-dom';

const PLAY_STORE_URL = '#'; // TODO: replace with Google Play Store URL
const APP_STORE_URL = '#';  // TODO: replace with App Store URL

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white shadow-sm">
        <span className="text-2xl font-black tracking-tight" style={{ color: '#e61536' }}>
          BESTCAR
        </span>
        <Link
          to="/admin/login"
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ backgroundColor: '#f1f5f9', color: '#1e293b' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
        >
          Espace Admin →
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex items-center" style={{ backgroundColor: '#0f172a', minHeight: '520px' }}>
        <div className="max-w-6xl mx-auto px-6 py-16 w-full flex flex-col md:flex-row items-center gap-12">
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

          {/* Right: Phone Mockup */}
          <div className="flex-shrink-0 flex justify-center">
            <div
              className="relative rounded-3xl overflow-hidden shadow-2xl"
              style={{
                width: '220px',
                height: '460px',
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                border: '2px solid #334155',
              }}
            >
              {/* Phone notch */}
              <div className="absolute top-0 left-0 right-0 flex justify-center pt-3 z-10">
                <div className="w-20 h-5 rounded-full" style={{ backgroundColor: '#0f172a' }} />
              </div>
              {/* Screen content preview */}
              <div className="absolute inset-0 flex flex-col pt-12 px-3 pb-4">
                {/* App header */}
                <div className="text-center py-3">
                  <span className="text-xl font-black" style={{ color: '#e61536' }}>BESTCAR</span>
                </div>
                {/* Search bar */}
                <div className="rounded-full px-3 py-2 mb-3 text-xs" style={{ backgroundColor: '#1e293b', color: '#64748b' }}>
                  Rechercher un véhicule...
                </div>
                {/* Car cards grid */}
                <div className="grid grid-cols-2 gap-2 flex-1 overflow-hidden">
                  {[
                    { color: '#334155', label: 'Toyota\nCamry' },
                    { color: '#1e3a5f', label: 'Honda\nCivic' },
                    { color: '#1e293b', label: 'BMW\nSérie 3' },
                    { color: '#292524', label: 'Mercedes\nC-Class' },
                  ].map((card, i) => (
                    <div
                      key={i}
                      className="rounded-lg flex flex-col justify-between p-2"
                      style={{ backgroundColor: card.color, minHeight: '80px' }}
                    >
                      <div className="w-full rounded flex-1" style={{ backgroundColor: '#475569', minHeight: '44px' }} />
                      <div className="mt-1">
                        <div className="text-white font-semibold whitespace-pre-line" style={{ fontSize: '8px', lineHeight: '1.2' }}>
                          {card.label}
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '7px' }}>xxx MRU</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
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
