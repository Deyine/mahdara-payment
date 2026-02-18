import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import { formatNumber } from '../utils/formatters';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await dashboardAPI.getStatistics();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#167bff' }}></div>
      </div>
    );
  }

  const current = stats?.cars?.current || {};
  const history = stats?.cars?.history || {};

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafbfc' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: '#1e293b' }}>Tableau de Bord</h1>
          <p style={{ color: '#64748b' }}>Vue d'ensemble de votre activité</p>
        </div>

        {/* Section: Ce que nous avons */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#475569' }}>
            Situation Actuelle
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Total Investi actuel */}
            <div
              className="bg-white rounded-lg p-6 shadow-sm"
              style={{ border: '1px solid #e2e8f0', borderLeft: '4px solid #167bff' }}
            >
              <p className="text-sm font-medium mb-1" style={{ color: '#64748b' }}>
                Total Investi
              </p>
              <p className="text-xs mb-3" style={{ color: '#94a3b8' }}>
                Coût total des véhicules non vendus
              </p>
              <p className="text-3xl font-bold" style={{ color: '#1e293b' }}>
                {formatNumber(current.total_invested || 0)} MRU
              </p>
            </div>

            {/* Total Créance */}
            <div
              className="bg-white rounded-lg p-6 shadow-sm"
              style={{ border: '1px solid #e2e8f0', borderLeft: '4px solid #f59e0b' }}
            >
              <p className="text-sm font-medium mb-1" style={{ color: '#64748b' }}>
                Total Créances
              </p>
              <p className="text-xs mb-3" style={{ color: '#94a3b8' }}>
                Montant restant dû sur les véhicules vendus
              </p>
              <p className="text-3xl font-bold" style={{ color: '#f59e0b' }}>
                {formatNumber(current.total_debt || 0)} MRU
              </p>
            </div>

          </div>
        </div>

        {/* Section: Historique */}
        <div>
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#475569' }}>
            Historique des Ventes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* Voitures vendues (count) */}
            <div
              className="bg-white rounded-lg p-6 shadow-sm"
              style={{ border: '1px solid #e2e8f0', borderLeft: '4px solid #167bff' }}
            >
              <p className="text-sm font-medium mb-1" style={{ color: '#64748b' }}>
                Voitures Vendues
              </p>
              <p className="text-xs mb-3" style={{ color: '#94a3b8' }}>
                Nombre total de ventes
              </p>
              <p className="text-4xl font-bold" style={{ color: '#1e293b' }}>
                {history.cars_sold_count || 0}
              </p>
            </div>

            {/* Total Investi (historique) */}
            <div
              className="bg-white rounded-lg p-6 shadow-sm"
              style={{ border: '1px solid #e2e8f0', borderLeft: '4px solid #8b5cf6' }}
            >
              <p className="text-sm font-medium mb-1" style={{ color: '#64748b' }}>
                Total Investi
              </p>
              <p className="text-xs mb-3" style={{ color: '#94a3b8' }}>
                Coût total des véhicules soldés
              </p>
              <p className="text-2xl font-bold" style={{ color: '#1e293b' }}>
                {formatNumber(history.total_invested || 0)} MRU
              </p>
            </div>

            {/* Total Ventes */}
            <div
              className="bg-white rounded-lg p-6 shadow-sm"
              style={{ border: '1px solid #e2e8f0', borderLeft: '4px solid #10b981' }}
            >
              <p className="text-sm font-medium mb-1" style={{ color: '#64748b' }}>
                Total Ventes
              </p>
              <p className="text-xs mb-3" style={{ color: '#94a3b8' }}>
                Prix de vente des véhicules soldés
              </p>
              <p className="text-2xl font-bold" style={{ color: '#10b981' }}>
                {formatNumber(history.total_sales || 0)} MRU
              </p>
            </div>

            {/* Bénéfice */}
            <div
              className="bg-white rounded-lg p-6 shadow-sm"
              style={{
                border: '1px solid #e2e8f0',
                borderLeft: `4px solid ${(history.benefit || 0) >= 0 ? '#10b981' : '#ef4444'}`
              }}
            >
              <p className="text-sm font-medium mb-1" style={{ color: '#64748b' }}>
                Bénéfice Net
              </p>
              <p className="text-xs mb-3" style={{ color: '#94a3b8' }}>
                Bénéfice total des véhicules soldés
              </p>
              <p
                className="text-2xl font-bold"
                style={{ color: (history.benefit || 0) >= 0 ? '#10b981' : '#ef4444' }}
              >
                {formatNumber(history.benefit || 0)} MRU
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
