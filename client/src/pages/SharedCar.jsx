import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { publicAPI } from '../services/api';
import FullscreenPhotoViewer from '../components/FullscreenPhotoViewer';

// Simple number formatter for public page (self-contained)
const formatNumber = (value, decimals = 2) => {
  const num = Number(value);
  if (isNaN(num)) return '0';

  const fixed = num.toFixed(decimals);
  const [integerPart, decimalPart] = fixed.split('.');

  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const hasDecimals = decimalPart && decimalPart !== '00';
  return hasDecimals ? `${formattedInteger}.${decimalPart}` : formattedInteger;
};

export default function SharedCar() {
  const { token } = useParams();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fullscreenIndex, setFullscreenIndex] = useState(null);

  // Combine all photos (salvage + after repair) into a single array
  const allPhotos = useMemo(() => {
    if (!car) return [];
    const photos = [];

    // Add salvage photos with a type marker
    if (car.salvage_photos) {
      photos.push(...car.salvage_photos.map(photo => ({
        ...photo,
        type: 'salvage'
      })));
    }

    // Add after repair photos with a type marker
    if (car.after_repair_photos) {
      photos.push(...car.after_repair_photos.map(photo => ({
        ...photo,
        type: 'after_repair'
      })));
    }

    return photos;
  }, [car]);

  useEffect(() => {
    fetchSharedCar();
  }, [token]);

  const fetchSharedCar = async () => {
    try {
      setLoading(true);
      const response = await publicAPI.getSharedCar(token);
      setCar(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Ce lien de partage n\'existe pas ou a expire');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fafbfc' }}>
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{ borderColor: '#167bff' }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fafbfc' }}>
        <div className="text-center p-8">
          <div className="text-6xl mb-4" style={{ color: '#e2e8f0' }}>404</div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#1e293b' }}>Lien invalide</h1>
          <p style={{ color: '#64748b' }}>{error}</p>
        </div>
      </div>
    );
  }

  // Helper function to get photo index in the combined array
  const getPhotoIndex = (photo, type) => {
    return allPhotos.findIndex(p => p.id === photo.id && p.type === type);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafbfc' }}>
      {/* Fullscreen Photo Viewer */}
      {fullscreenIndex !== null && (
        <FullscreenPhotoViewer
          photos={allPhotos}
          initialIndex={fullscreenIndex}
          onClose={() => setFullscreenIndex(null)}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: '#1e293b' }}>
            {car.display_name}
          </h1>
          <p className="text-sm" style={{ color: '#64748b' }}>VIN: {car.vin}</p>
        </div>

        {/* Vehicle Information - Always visible */}
        <div
          className="rounded-lg p-6 mb-6"
          style={{ backgroundColor: 'white', border: '1px solid #e2e8f0' }}
        >
          <h2 className="text-lg font-bold mb-4" style={{ color: '#1e293b' }}>
            Informations du Vehicule
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm" style={{ color: '#64748b' }}>Modele</p>
              <p className="font-semibold" style={{ color: '#1e293b' }}>{car.car_model?.name || '-'}</p>
            </div>
            <div>
              <p className="text-sm" style={{ color: '#64748b' }}>Annee</p>
              <p className="font-semibold" style={{ color: '#1e293b' }}>{car.year}</p>
            </div>
            {car.color && (
              <div>
                <p className="text-sm" style={{ color: '#64748b' }}>Couleur</p>
                <p className="font-semibold" style={{ color: '#1e293b' }}>{car.color}</p>
              </div>
            )}
            {car.mileage && (
              <div>
                <p className="text-sm" style={{ color: '#64748b' }}>Kilometrage</p>
                <p className="font-semibold" style={{ color: '#1e293b' }}>{formatNumber(car.mileage, 0)} km</p>
              </div>
            )}
            <div>
              <p className="text-sm" style={{ color: '#64748b' }}>Date d'achat</p>
              <p className="font-semibold" style={{ color: '#1e293b' }}>{formatDate(car.purchase_date)}</p>
            </div>
            {car.seller && (
              <div>
                <p className="text-sm" style={{ color: '#64748b' }}>Vendeur</p>
                <p className="font-semibold" style={{ color: '#1e293b' }}>{car.seller.name}</p>
              </div>
            )}
          </div>
        </div>

        {/* Cost Details - Optional */}
        {car.share_settings.show_costs && car.costs && (
          <div
            className="rounded-lg p-6 mb-6"
            style={{ backgroundColor: 'white', border: '1px solid #e2e8f0' }}
          >
            <h2 className="text-lg font-bold mb-4" style={{ color: '#1e293b' }}>
              Detail des Couts
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between pb-3" style={{ borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#475569' }}>Prix d'achat</span>
                <span className="font-semibold" style={{ color: '#1e293b' }}>{formatNumber(car.costs.purchase_price)} MRU</span>
              </div>
              {car.costs.clearance_cost > 0 && (
                <div className="flex justify-between pb-3" style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#475569' }}>Dedouanement</span>
                  <span className="font-semibold" style={{ color: '#1e293b' }}>{formatNumber(car.costs.clearance_cost)} MRU</span>
                </div>
              )}
              {car.costs.towing_cost > 0 && (
                <div className="flex justify-between pb-3" style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#475569' }}>Remorquage</span>
                  <span className="font-semibold" style={{ color: '#1e293b' }}>{formatNumber(car.costs.towing_cost)} MRU</span>
                </div>
              )}
              <div className="flex justify-between pb-3" style={{ borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#475569' }}>Depenses totales</span>
                <span className="font-semibold" style={{ color: '#1e293b' }}>{formatNumber(car.costs.total_expenses)} MRU</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-lg font-bold" style={{ color: '#1e293b' }}>Cout Total</span>
                <span className="text-2xl font-bold" style={{ color: '#167bff' }}>{formatNumber(car.costs.total_cost)} MRU</span>
              </div>
            </div>
          </div>
        )}

        {/* Salvage Photos - Always visible */}
        {car.salvage_photos && car.salvage_photos.length > 0 && (
          <div
            className="rounded-lg p-6 mb-6"
            style={{ backgroundColor: 'white', border: '1px solid #e2e8f0' }}
          >
            <h2 className="text-lg font-bold mb-4" style={{ color: '#1e293b' }}>
              Photos d'Etat Initial ({car.salvage_photos.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {car.salvage_photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative cursor-pointer overflow-hidden rounded-lg"
                  style={{ aspectRatio: '4/3' }}
                  onClick={() => setFullscreenIndex(getPhotoIndex(photo, 'salvage'))}
                  title="Cliquez pour voir en plein écran"
                >
                  <img
                    src={photo.url}
                    alt={photo.filename}
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* After Repair Photos - Always visible */}
        {car.after_repair_photos && car.after_repair_photos.length > 0 && (
          <div
            className="rounded-lg p-6 mb-6"
            style={{ backgroundColor: 'white', border: '1px solid #e2e8f0' }}
          >
            <h2 className="text-lg font-bold mb-4" style={{ color: '#1e293b' }}>
              Photos Apres Reparations ({car.after_repair_photos.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {car.after_repair_photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative cursor-pointer overflow-hidden rounded-lg"
                  style={{ aspectRatio: '4/3' }}
                  onClick={() => setFullscreenIndex(getPhotoIndex(photo, 'after_repair'))}
                  title="Cliquez pour voir en plein écran"
                >
                  <img
                    src={photo.url}
                    alt={photo.filename}
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expenses List - Optional */}
        {car.share_settings.show_expenses && car.expenses && car.expenses.length > 0 && (
          <div
            className="rounded-lg p-6 mb-6"
            style={{ backgroundColor: 'white', border: '1px solid #e2e8f0' }}
          >
            <h2 className="text-lg font-bold mb-4" style={{ color: '#1e293b' }}>
              Depenses ({car.expenses.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th className="text-left p-3 text-sm font-semibold" style={{ color: '#64748b' }}>Date</th>
                    <th className="text-left p-3 text-sm font-semibold" style={{ color: '#64748b' }}>Categorie</th>
                    <th className="text-left p-3 text-sm font-semibold hidden sm:table-cell" style={{ color: '#64748b' }}>Description</th>
                    <th className="text-right p-3 text-sm font-semibold" style={{ color: '#64748b' }}>Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {car.expenses.map((expense) => (
                    <tr key={expense.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td className="p-3" style={{ color: '#1e293b' }}>{formatDate(expense.expense_date)}</td>
                      <td className="p-3" style={{ color: '#1e293b' }}>{expense.category || '-'}</td>
                      <td className="p-3 hidden sm:table-cell" style={{ color: '#1e293b' }}>{expense.description || '-'}</td>
                      <td className="p-3 text-right font-semibold" style={{ color: '#1e293b' }}>{formatNumber(expense.amount)} MRU</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    <td colSpan={3} className="p-3 font-bold hidden sm:table-cell" style={{ color: '#1e293b' }}>Total</td>
                    <td colSpan={2} className="p-3 font-bold sm:hidden" style={{ color: '#1e293b' }}>Total</td>
                    <td className="p-3 text-right font-bold" style={{ color: '#167bff' }}>
                      {formatNumber(car.expenses.reduce((sum, e) => sum + e.amount, 0))} MRU
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-8" style={{ color: '#94a3b8' }}>
          <p className="text-sm">Partage via BestCar</p>
        </div>
      </div>
    </div>
  );
}
