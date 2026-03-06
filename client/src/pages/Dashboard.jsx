import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { dashboardAPI } from '../services/api';
import { formatNumber } from '../utils/formatters';

const formatMonth = (monthStr) => {
  const [year, month] = monthStr.split('-');
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
};

const CAR_COLORS = ['#167bff', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#f97316'];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg shadow-lg px-4 py-3" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
      <p className="text-xs font-semibold mb-2 capitalize" style={{ color: '#94a3b8' }}>{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-xs mb-1">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
          <span style={{ color: '#e2e8f0' }}>{entry.name}:</span>
          <span className="font-semibold" style={{ color: '#fff' }}>
            {formatNumber(entry.value)} MRU
          </span>
        </div>
      ))}
    </div>
  );
}

function PaymentTracker({ cars }) {
  const [view, setView] = useState('chart');

  const carKey = (car) => {
    let k = car.car_label;
    if (car.ref) k += ` #${car.ref}`;
    if (car.first_tag) k += ` · ${car.first_tag.name}`;
    return k;
  };

  // Build recharts data: one object per month with car keys
  const chartData = cars[0].monthly_payments.map((mp, mIdx) => {
    const point = { month: formatMonth(mp.month) };
    cars.forEach((car) => {
      point[carKey(car)] = car.monthly_payments[mIdx].total;
    });
    return point;
  });

  return (
    <div className="mb-10">
      {/* Header + toggle */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold mb-1" style={{ color: '#475569' }}>
            Suivi des Paiements
          </h2>
          <p className="text-sm" style={{ color: '#94a3b8' }}>
            Véhicules vendus non entièrement payés — 6 derniers mois
          </p>
        </div>

        {/* Pill toggle */}
        <div className="flex rounded-full p-0.5" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 2px 8px rgba(102,126,234,0.4)' }}>
          <button
            onClick={() => setView('chart')}
            className="text-xs font-semibold px-4 py-1.5 rounded-full transition-all duration-200"
            style={view === 'chart'
              ? { backgroundColor: '#fff', color: '#667eea' }
              : { backgroundColor: 'transparent', color: 'rgba(255,255,255,0.8)' }
            }
          >
            Graphique
          </button>
          <button
            onClick={() => setView('table')}
            className="text-xs font-semibold px-4 py-1.5 rounded-full transition-all duration-200"
            style={view === 'table'
              ? { backgroundColor: '#fff', color: '#667eea' }
              : { backgroundColor: 'transparent', color: 'rgba(255,255,255,0.8)' }
            }
          >
            Tableau
          </button>
        </div>
      </div>

      {view === 'chart' ? (
        <div className="bg-white rounded-lg shadow-sm p-4 overflow-x-auto" style={{ border: '1px solid #e2e8f0' }}>
          <div style={{ minWidth: 520 }}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatNumber(v, 0)}
                  width={70}
                />
                <Tooltip content={<CustomTooltip />} />
                {cars.map((car, idx) => (
                  <Line
                    key={car.car_id}
                    type="monotone"
                    dataKey={carKey(car)}
                    stroke={CAR_COLORS[idx % CAR_COLORS.length]}
                    strokeWidth={2.5}
                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-x-auto" style={{ border: '1px solid #e2e8f0' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th className="text-left px-4 py-3 font-medium" style={{ color: '#475569', minWidth: '160px' }}>
                  Véhicule
                </th>
                {cars[0].monthly_payments.map((mp) => (
                  <th key={mp.month} className="text-center px-3 py-3 font-medium capitalize" style={{ color: '#475569', minWidth: '90px' }}>
                    {formatMonth(mp.month)}
                  </th>
                ))}
                <th className="text-right px-4 py-3 font-medium" style={{ color: '#f59e0b', minWidth: '120px' }}>
                  Reste dû
                </th>
              </tr>
            </thead>
            <tbody>
              {cars.map((car, idx) => (
                <tr
                  key={car.car_id}
                  style={{ borderBottom: idx < cars.length - 1 ? '1px solid #f1f5f9' : 'none' }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CAR_COLORS[idx % CAR_COLORS.length] }} />
                      <span className="font-medium" style={{ color: '#1e293b' }}>{car.car_label}</span>
                      {car.ref && (
                        <span className="text-xs" style={{ color: '#94a3b8' }}>#{car.ref}</span>
                      )}
                      {car.first_tag && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: car.first_tag.color ? `${car.first_tag.color}22` : '#f1f5f9',
                            color: car.first_tag.color || '#64748b',
                            border: `1px solid ${car.first_tag.color ? `${car.first_tag.color}55` : '#e2e8f0'}`,
                          }}
                        >
                          {car.first_tag.name}
                        </span>
                      )}
                    </div>
                  </td>
                  {car.monthly_payments.map((mp) => (
                    <td key={mp.month} className="text-center px-3 py-3">
                      {mp.total > 0 ? (
                        <span
                          className="inline-block px-2 py-1 rounded text-xs font-medium"
                          style={{ backgroundColor: '#d1fae5', color: '#065f46' }}
                        >
                          {formatNumber(mp.total)}
                        </span>
                      ) : (
                        <span
                          className="inline-block px-2 py-1 rounded text-xs font-medium"
                          style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}
                        >
                          —
                        </span>
                      )}
                    </td>
                  ))}
                  <td className="text-right px-4 py-3 font-semibold" style={{ color: '#f59e0b' }}>
                    {formatNumber(car.remaining)} MRU
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

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

        {/* Section: Suivi des paiements */}
        {stats?.unpaid_cars_payments?.length > 0 && (
          <PaymentTracker cars={stats.unpaid_cars_payments} />
        )}

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
