import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

export default function ManagerProfits() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profitsData, setProfitsData] = useState([]);
  const [expandedManagers, setExpandedManagers] = useState(new Set());
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfits();
  }, []);

  const fetchProfits = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await usersAPI.getProfits();
      setProfitsData(response.data.profits);
    } catch (err) {
      console.error('Error fetching profits:', err);
      setError('Erreur lors du chargement des données de profit');
    } finally {
      setLoading(false);
    }
  };

  const toggleManagerExpansion = (managerId) => {
    const newExpanded = new Set(expandedManagers);
    if (newExpanded.has(managerId)) {
      newExpanded.delete(managerId);
    } else {
      newExpanded.add(managerId);
    }
    setExpandedManagers(newExpanded);
  };

  const handleCarClick = (carId) => {
    navigate(`/cars/${carId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#167bff' }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#1e293b' }}>
          Profits des Managers
        </h1>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>
          {user?.role === 'manager'
            ? 'Vos bénéfices issus du partage de profits'
            : 'Aperçu des bénéfices partagés avec les managers'
          }
        </p>
      </div>

      {/* Empty State */}
      {profitsData.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="text-6xl mb-4">💰</div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: '#1e293b' }}>
            Aucun profit partagé
          </h3>
          <p style={{ color: '#64748b' }}>
            {user?.role === 'manager'
              ? 'Vous n\'avez pas encore de partage de profits sur des véhicules.'
              : 'Aucun manager n\'a de partage de profits pour le moment.'
            }
          </p>
        </div>
      )}

      {/* Manager Profit Cards */}
      <div className="space-y-4">
        {profitsData.map((managerProfit) => {
          const isExpanded = expandedManagers.has(managerProfit.user.id);
          const hasCars = managerProfit.cars && managerProfit.cars.length > 0;

          return (
            <div key={managerProfit.user.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Manager Summary Header */}
              <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white"
                        style={{ backgroundColor: '#167bff' }}
                      >
                        {managerProfit.user.name.charAt(0)}
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold" style={{ color: '#1e293b' }}>
                          {managerProfit.user.name}
                        </h2>
                        <p className="text-sm" style={{ color: '#64748b' }}>
                          @{managerProfit.user.username}
                        </p>
                      </div>
                    </div>
                  </div>
                  {hasCars && (
                    <button
                      onClick={() => toggleManagerExpansion(managerProfit.user.id)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: '#64748b' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <svg
                        className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Profit Summary Grid */}
                <div className="space-y-4">
                  {/* Car Sales Profits */}
                  <div>
                    <h3 className="text-sm font-semibold mb-2" style={{ color: '#1e293b' }}>
                      Profits Vente de Véhicules
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Total Profit */}
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm mb-1" style={{ color: '#64748b' }}>
                          Bénéfice Total
                        </p>
                        <p
                          className="text-xl sm:text-2xl font-bold"
                          style={{ color: managerProfit.total_profit >= 0 ? '#10b981' : '#dc2626' }}
                        >
                          {managerProfit.total_profit >= 0 ? '+' : ''}
                          {formatCurrency(managerProfit.total_profit)} MRU
                        </p>
                      </div>

                      {/* User Share */}
                      <div className="bg-amber-50 rounded-lg p-4">
                        <p className="text-sm mb-1" style={{ color: '#64748b' }}>
                          Part du Manager
                        </p>
                        <p className="text-xl sm:text-2xl font-bold" style={{ color: '#f59e0b' }}>
                          {formatCurrency(managerProfit.total_user_profit)} MRU
                        </p>
                      </div>

                      {/* Company Share */}
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm mb-1" style={{ color: '#64748b' }}>
                          Part de l'Entreprise
                        </p>
                        <p className="text-xl sm:text-2xl font-bold" style={{ color: '#10b981' }}>
                          {formatCurrency(managerProfit.total_company_profit)} MRU
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Rental Profits */}
                  {managerProfit.rentals && managerProfit.rentals.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2" style={{ color: '#1e293b' }}>
                        Profits Locations de Véhicules
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Total Rental Amount */}
                        <div className="bg-purple-50 rounded-lg p-4">
                          <p className="text-sm mb-1" style={{ color: '#64748b' }}>
                            Revenus Location Total
                          </p>
                          <p className="text-xl sm:text-2xl font-bold" style={{ color: '#9333ea' }}>
                            {formatCurrency(managerProfit.total_rental_amount)} MRU
                          </p>
                        </div>

                        {/* Rental User Share */}
                        <div className="bg-amber-50 rounded-lg p-4">
                          <p className="text-sm mb-1" style={{ color: '#64748b' }}>
                            Part du Manager
                          </p>
                          <p className="text-xl sm:text-2xl font-bold" style={{ color: '#f59e0b' }}>
                            {formatCurrency(managerProfit.total_rental_user_profit)} MRU
                          </p>
                        </div>

                        {/* Rental Company Share */}
                        <div className="bg-green-50 rounded-lg p-4">
                          <p className="text-sm mb-1" style={{ color: '#64748b' }}>
                            Part de l'Entreprise
                          </p>
                          <p className="text-xl sm:text-2xl font-bold" style={{ color: '#10b981' }}>
                            {formatCurrency(managerProfit.total_rental_company_profit)} MRU
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Car Count Badge */}
                {hasCars && (
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-sm" style={{ color: '#64748b' }}>
                      {managerProfit.cars.length} véhicule{managerProfit.cars.length > 1 ? 's' : ''} avec partage de profit
                    </span>
                  </div>
                )}
              </div>

              {/* Expandable Cars Table */}
              {isExpanded && hasCars && (
                <div className="border-t" style={{ borderColor: '#e2e8f0' }}>
                  <div className="px-4 sm:px-6 py-4" style={{ backgroundColor: '#f8fafc' }}>
                    <h4 className="font-semibold text-sm" style={{ color: '#1e293b' }}>
                      Ventes de Véhicules
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead style={{ backgroundColor: '#f8fafc' }}>
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#64748b' }}>
                            Référence
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium hidden md:table-cell" style={{ color: '#64748b' }}>
                            Modèle
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium hidden sm:table-cell" style={{ color: '#64748b' }}>
                            Statut
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium" style={{ color: '#64748b' }}>
                            Bénéfice Total
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium hidden lg:table-cell" style={{ color: '#64748b' }}>
                            Part (%)
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium" style={{ color: '#64748b' }}>
                            Part Manager
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium hidden xl:table-cell" style={{ color: '#64748b' }}>
                            Part Entreprise
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ borderColor: '#e2e8f0' }}>
                        {managerProfit.cars.map((car) => (
                          <tr
                            key={car.id}
                            onClick={() => handleCarClick(car.id)}
                            className="cursor-pointer transition-colors"
                            style={{ backgroundColor: 'white' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                          >
                            <td className="px-4 py-3">
                              <span className="font-medium" style={{ color: '#1e293b' }}>
                                {car.ref}
                              </span>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                              <span className="text-sm" style={{ color: '#64748b' }}>
                                {car.model_name}
                              </span>
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell">
                              <span
                                className="inline-flex px-2 py-1 rounded text-xs font-medium"
                                style={{
                                  backgroundColor: car.status === 'sold' && !car.fully_paid ? '#fef2f2' : car.status === 'sold' ? '#dcfce7' : '#dbeafe',
                                  color: car.status === 'sold' && !car.fully_paid ? '#dc2626' : car.status === 'sold' ? '#166534' : '#1e40af'
                                }}
                              >
                                {car.status === 'sold' && !car.fully_paid ? 'Non payé' : car.status === 'sold' ? 'Vendu' : car.status === 'rental' ? 'En location' : 'Actif'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {car.fully_paid ? (
                                <span
                                  className="font-semibold"
                                  style={{ color: car.profit >= 0 ? '#10b981' : '#dc2626' }}
                                >
                                  {car.profit >= 0 ? '+' : ''}
                                  {formatCurrency(car.profit)}
                                </span>
                              ) : (
                                <span className="font-semibold" style={{ color: '#94a3b8' }}>--</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right hidden lg:table-cell">
                              {car.fully_paid ? (
                                <span className="text-sm font-medium" style={{ color: '#f59e0b' }}>
                                  {car.profit_share_percentage}%
                                </span>
                              ) : (
                                <span className="text-sm font-medium" style={{ color: '#94a3b8' }}>--</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {car.fully_paid ? (
                                <span className="font-semibold" style={{ color: '#f59e0b' }}>
                                  {formatCurrency(car.user_profit_amount)}
                                </span>
                              ) : (
                                <span className="font-semibold" style={{ color: '#94a3b8' }}>--</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right hidden xl:table-cell">
                              {car.fully_paid ? (
                                <span className="font-semibold" style={{ color: '#10b981' }}>
                                  {formatCurrency(car.company_net_profit)}
                                </span>
                              ) : (
                                <span className="font-semibold" style={{ color: '#94a3b8' }}>--</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Expandable Rentals Table */}
              {isExpanded && managerProfit.rentals && managerProfit.rentals.length > 0 && (
                <div className="border-t" style={{ borderColor: '#e2e8f0' }}>
                  <div className="px-4 sm:px-6 py-4" style={{ backgroundColor: '#faf5ff' }}>
                    <h4 className="font-semibold text-sm" style={{ color: '#1e293b' }}>
                      Locations de Véhicules
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead style={{ backgroundColor: '#faf5ff' }}>
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#64748b' }}>
                            Référence
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium hidden md:table-cell" style={{ color: '#64748b' }}>
                            Locataire
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium hidden sm:table-cell" style={{ color: '#64748b' }}>
                            Date
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium" style={{ color: '#64748b' }}>
                            Jours
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium hidden lg:table-cell" style={{ color: '#64748b' }}>
                            Profit/Jour
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium" style={{ color: '#64748b' }}>
                            Revenu Total
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium" style={{ color: '#64748b' }}>
                            Part Manager
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium hidden xl:table-cell" style={{ color: '#64748b' }}>
                            Part Entreprise
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ borderColor: '#e2e8f0' }}>
                        {managerProfit.rentals.map((rental) => (
                          <tr
                            key={rental.id}
                            onClick={() => handleCarClick(rental.car_id)}
                            className="cursor-pointer transition-colors"
                            style={{ backgroundColor: 'white' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#faf5ff'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                          >
                            <td className="px-4 py-3">
                              <span className="font-medium" style={{ color: '#1e293b' }}>
                                {rental.car_ref || rental.car_vin}
                              </span>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                              <span className="text-sm" style={{ color: '#64748b' }}>
                                {rental.locataire}
                              </span>
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell">
                              <span className="text-sm" style={{ color: '#64748b' }}>
                                {new Date(rental.rental_date).toLocaleDateString('fr-FR')}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="font-medium" style={{ color: '#1e293b' }}>
                                {rental.days}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right hidden lg:table-cell">
                              <span className="text-sm font-medium" style={{ color: '#9333ea' }}>
                                {formatCurrency(rental.profit_per_day)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="font-semibold" style={{ color: '#9333ea' }}>
                                {formatCurrency(rental.amount)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="font-semibold" style={{ color: '#f59e0b' }}>
                                {formatCurrency(rental.user_profit_amount)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right hidden xl:table-cell">
                              <span className="font-semibold" style={{ color: '#10b981' }}>
                                {formatCurrency(rental.company_net_profit)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
