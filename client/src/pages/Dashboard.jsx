import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import { Link } from 'react-router-dom';
import { formatNumber, formatCurrency } from '../utils/formatters';

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

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafbfc' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: '#1e293b' }}>
            Tableau de Bord
          </h1>
          <p style={{ color: '#64748b' }}>Bienvenue dans BestCar - Gestion de Véhicules</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Cars */}
          <div
            className="bg-white border-l-4 rounded-lg p-6 shadow-sm"
            style={{ borderLeftColor: '#167bff', border: '1px solid #e2e8f0' }}
          >
            <h3 className="text-sm mb-2" style={{ color: '#64748b' }}>Total Véhicules</h3>
            <p className="text-4xl font-bold" style={{ color: '#1e293b' }}>
              {stats?.cars?.total || 0}
            </p>
          </div>

          {/* Total Investment */}
          <div
            className="bg-white border-l-4 rounded-lg p-6 shadow-sm"
            style={{ borderLeftColor: '#10b981', border: '1px solid #e2e8f0' }}
          >
            <h3 className="text-sm mb-2" style={{ color: '#64748b' }}>Valeur Totale</h3>
            <p className="text-2xl font-bold" style={{ color: '#10b981' }}>
              {formatCurrency(stats?.summary?.total_cars_value || 0)}
            </p>
            <p className="text-xs mt-1" style={{ color: '#64748b' }}>
              Prix d'achat total
            </p>
          </div>

          {/* Total Investment (with expenses) */}
          <div
            className="bg-white border-l-4 rounded-lg p-6 shadow-sm"
            style={{ borderLeftColor: '#ef4444', border: '1px solid #e2e8f0' }}
          >
            <h3 className="text-sm mb-2" style={{ color: '#64748b' }}>Investissement Total</h3>
            <p className="text-2xl font-bold" style={{ color: '#ef4444' }}>
              {formatCurrency(stats?.summary?.total_investment || 0)}
            </p>
            <p className="text-xs mt-1" style={{ color: '#64748b' }}>
              Avec dépenses
            </p>
          </div>
        </div>

        {/* Expenses Statistics */}
        <div className="mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm" style={{ border: '1px solid #e2e8f0' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#1e293b' }}>Statistiques de Dépenses</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm mb-2" style={{ color: '#64748b' }}>Total Dépenses</h3>
                <p className="text-3xl font-bold" style={{ color: '#1e293b' }}>
                  {stats?.expenses?.total || 0}
                </p>
              </div>
              <div>
                <h3 className="text-sm mb-2" style={{ color: '#64748b' }}>Ce Mois</h3>
                <p className="text-3xl font-bold" style={{ color: '#f59e0b' }}>
                  {formatCurrency(stats?.expenses?.this_month || 0)}
                </p>
              </div>
              <div>
                <h3 className="text-sm mb-2" style={{ color: '#64748b' }}>Total</h3>
                <p className="text-3xl font-bold" style={{ color: '#ef4444' }}>
                  {formatCurrency(stats?.expenses?.total_amount || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Cars */}
          <div className="bg-white rounded-lg p-6 shadow-sm" style={{ border: '1px solid #e2e8f0' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold" style={{ color: '#1e293b' }}>Véhicules Récents</h2>
              <Link to="/cars" className="text-sm" style={{ color: '#167bff' }}>
                Voir Tout →
              </Link>
            </div>
            <div className="space-y-3">
              {stats?.cars?.recent?.length > 0 ? (
                stats.cars.recent.map((car) => (
                  <div
                    key={car.id}
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: '#f1f5f9' }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold" style={{ color: '#1e293b' }}>
                          {car.display_name || car.car_model?.name || 'N/A'}
                        </p>
                        <p className="text-sm" style={{ color: '#64748b' }}>
                          VIN: {car.vin}
                        </p>
                        <p className="text-xs" style={{ color: '#64748b' }}>
                          {new Date(car.purchase_date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm" style={{ color: '#167bff' }}>
                          {formatCurrency(car.purchase_price)}
                        </p>
                        {car.total_cost && (
                          <p className="text-xs" style={{ color: '#ef4444' }}>
                            Total: {formatCurrency(car.total_cost)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-4" style={{ color: '#64748b' }}>
                  Aucun véhicule récent
                </p>
              )}
            </div>
          </div>

          {/* Recent Expenses */}
          <div className="bg-white rounded-lg p-6 shadow-sm" style={{ border: '1px solid #e2e8f0' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold" style={{ color: '#1e293b' }}>Dépenses Récentes</h2>
              <Link to="/cars" className="text-sm" style={{ color: '#167bff' }}>
                Voir Tout →
              </Link>
            </div>
            <div className="space-y-3">
              {stats?.expenses?.recent?.length > 0 ? (
                stats.expenses.recent.map((expense) => (
                  <div
                    key={expense.id}
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: '#f1f5f9' }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold" style={{ color: '#1e293b' }}>
                          {expense.expense_category?.name || 'N/A'}
                        </p>
                        <p className="text-sm" style={{ color: '#64748b' }}>
                          {expense.car?.car_model?.name || 'N/A'} - {expense.car?.vin}
                        </p>
                        <p className="text-xs" style={{ color: '#64748b' }}>
                          {new Date(expense.expense_date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <span className="font-bold" style={{ color: '#ef4444' }}>
                        {formatCurrency(expense.amount)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-4" style={{ color: '#64748b' }}>
                  Aucune dépense récente
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
