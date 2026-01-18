import { useState } from 'react';
import { useDialog } from '../context/DialogContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';

export default function RentalManager({ car, rentalTransactions, onRentalTransactionChange }) {
  const { canWrite } = useAuth();
  const { showAlert, showConfirm } = useDialog();
  const [showForm, setShowForm] = useState(false);
  const [editingRental, setEditingRental] = useState(null);
  const [formData, setFormData] = useState({
    locataire: '',
    rental_date: new Date().toISOString().split('T')[0],
    days: '',
    daily_rate: car.daily_rental_rate || '',
    notes: ''
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingRental(null);
    setFormData({
      locataire: '',
      rental_date: new Date().toISOString().split('T')[0],
      days: '',
      daily_rate: car.daily_rental_rate || '',
      notes: ''
    });
  };

  const handleAddRental = () => {
    setEditingRental(null);
    setFormData({
      locataire: '',
      rental_date: new Date().toISOString().split('T')[0],
      days: '',
      daily_rate: car.daily_rental_rate || '',
      notes: ''
    });
    setShowForm(true);
  };

  const handleEditRental = (rental) => {
    setEditingRental(rental);
    setFormData({
      locataire: rental.locataire || '',
      rental_date: rental.rental_date,
      days: rental.days,
      daily_rate: rental.daily_rate,
      notes: rental.notes || ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const rentalData = {
      car_id: car.id,
      locataire: formData.locataire,
      rental_date: formData.rental_date,
      days: parseInt(formData.days),
      daily_rate: parseFloat(formData.daily_rate),
      notes: formData.notes
    };

    try {
      if (editingRental) {
        await onRentalTransactionChange('update', editingRental.id, rentalData);
        await showAlert('Location modifiée avec succès', 'success');
      } else {
        await onRentalTransactionChange('create', null, rentalData);
        await showAlert('Location ajoutée avec succès', 'success');
      }
      resetForm();
    } catch (error) {
      await showAlert(
        error.response?.data?.errors?.[0] || 'Erreur lors de l\'enregistrement',
        'error'
      );
    }
  };

  const handleDeleteRental = async (rentalId) => {
    const confirmed = await showConfirm(
      'Êtes-vous sûr de vouloir supprimer cette location ?',
      'Supprimer la location'
    );

    if (!confirmed) return;

    try {
      await onRentalTransactionChange('delete', rentalId);
      await showAlert('Location supprimée avec succès', 'success');
    } catch (error) {
      await showAlert(
        error.response?.data?.error || 'Erreur lors de la suppression',
        'error'
      );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  const calculatedAmount = formData.days && formData.daily_rate
    ? parseFloat(formData.days) * parseFloat(formData.daily_rate)
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <h2 className="text-lg sm:text-2xl font-bold" style={{ color: '#1e293b' }}>
          Gestion des Locations
        </h2>
        {car.status === 'rental' && canWrite && (
          <button
            onClick={handleAddRental}
            className="w-full sm:w-auto px-4 py-2 rounded text-sm sm:text-base font-medium"
            style={{ backgroundColor: '#167bff', color: 'white' }}
          >
            📝 Enregistrer une Location
          </button>
        )}
      </div>

      {/* Rental Summary */}
      <div className="rounded-lg p-3 sm:p-4 mb-6" style={{ backgroundColor: '#f8fafc' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <p className="text-xs sm:text-sm mb-1" style={{ color: '#64748b' }}>Revenus totaux</p>
            <p className="text-lg sm:text-2xl font-bold" style={{ color: '#10b981' }}>
              {formatCurrency(car.total_rental_income || 0)}
            </p>
          </div>
          <div>
            <p className="text-xs sm:text-sm mb-1" style={{ color: '#64748b' }}>Nombre de locations</p>
            <p className="text-lg sm:text-2xl font-bold" style={{ color: '#1e293b' }}>
              {rentalTransactions.length}
            </p>
          </div>
          <div>
            <p className="text-xs sm:text-sm mb-1" style={{ color: '#64748b' }}>Profit actuel</p>
            <p className="text-lg sm:text-2xl font-bold" style={{ color: car.profit >= 0 ? '#10b981' : '#ef4444' }}>
              {car.profit !== null ? `${car.profit >= 0 ? '+' : ''}${formatCurrency(car.profit)}` : '-'}
            </p>
          </div>
        </div>

        {car.rental_break_even && car.status !== 'sold' && (
          <div className="mt-4 rounded-lg p-3" style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac' }}>
            <p className="text-sm font-medium" style={{ color: '#166534' }}>
              ✓ Location rentable (revenus ≥ coûts totaux)
            </p>
          </div>
        )}
      </div>

      {/* Rental History */}
      <div>
        <h3 className="text-base sm:text-lg font-bold mb-3" style={{ color: '#1e293b' }}>Historique des Locations</h3>

        {rentalTransactions.length === 0 ? (
          <div className="rounded-lg p-6 sm:p-8 text-center" style={{ backgroundColor: '#f1f5f9' }}>
            <p className="text-sm sm:text-base" style={{ color: '#64748b' }}>Aucune location enregistrée pour ce véhicule</p>
            {car.status === 'rental' && (
              <p className="text-xs sm:text-sm mt-2" style={{ color: '#64748b' }}>
                Cliquez sur "Enregistrer une Location" pour ajouter
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {rentalTransactions.map((rental) => (
              <div
                key={rental.id}
                className="rounded-lg p-3 sm:p-4"
                style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start mb-2 gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm sm:text-base font-bold" style={{ color: '#1e293b' }}>
                      {rental.locataire}
                    </span>
                    <span
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{ backgroundColor: '#dcfce7', color: '#166534' }}
                    >
                      Terminée
                    </span>
                  </div>
                  {canWrite && (
                    <div className="flex gap-1.5 sm:gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleEditRental(rental)}
                        className="flex-1 sm:flex-none px-2 py-1 rounded text-xs"
                        style={{ backgroundColor: '#167bff', color: 'white' }}
                      >
                        ✏️ <span className="hidden sm:inline">Modifier</span>
                      </button>
                      <button
                        onClick={() => handleDeleteRental(rental.id)}
                        className="flex-1 sm:flex-none px-2 py-1 rounded text-xs"
                        style={{ backgroundColor: '#ef4444', color: 'white' }}
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs sm:text-sm">
                  <div>
                    <span style={{ color: '#64748b' }}>Date:</span>
                    <span className="ml-1 font-medium">{formatDate(rental.rental_date)}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Durée:</span>
                    <span className="ml-1 font-medium">{rental.days} jours</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Tarif/jour:</span>
                    <span className="ml-1 font-medium">{formatCurrency(rental.daily_rate)}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Montant:</span>
                    <span className="ml-1 font-bold" style={{ color: '#10b981' }}>
                      {formatCurrency(rental.amount)}
                    </span>
                  </div>
                </div>

                {rental.notes && (
                  <p className="mt-2 text-xs sm:text-sm" style={{ color: '#64748b' }}>
                    Note: {rental.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Rental Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={resetForm}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#1e293b' }}>
                {editingRental ? 'Modifier la Location' : 'Enregistrer une Location'}
              </h2>

              <form onSubmit={handleSubmit}>
                {/* Locataire */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1" style={{ color: '#1e293b' }}>
                    Locataire *
                  </label>
                  <input
                    type="text"
                    value={formData.locataire}
                    onChange={(e) => setFormData({ ...formData, locataire: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded"
                    style={{ border: '1px solid #cbd5e1' }}
                    placeholder="Nom du locataire"
                  />
                </div>

                {/* Date */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1" style={{ color: '#1e293b' }}>
                    Date de location *
                  </label>
                  <input
                    type="date"
                    value={formData.rental_date}
                    onChange={(e) => setFormData({ ...formData, rental_date: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded"
                    style={{ border: '1px solid #cbd5e1' }}
                  />
                </div>

                {/* Days and Daily Rate */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#1e293b' }}>
                      Nombre de jours *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.days}
                      onChange={(e) => setFormData({ ...formData, days: e.target.value })}
                      required
                      className="w-full px-3 py-2 rounded"
                      style={{ border: '1px solid #cbd5e1' }}
                      placeholder="Ex: 15"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#1e293b' }}>
                      Prix/jour (MRU) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.daily_rate}
                      onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })}
                      required
                      className="w-full px-3 py-2 rounded"
                      style={{ border: '1px solid #cbd5e1' }}
                      placeholder="Ex: 150.00"
                    />
                  </div>
                </div>

                {/* Calculated Amount Display */}
                {formData.days && formData.daily_rate && (
                  <div className="mb-4 rounded-lg p-3" style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac' }}>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium" style={{ color: '#166534' }}>
                        Montant total:
                      </span>
                      <span className="text-lg font-bold" style={{ color: '#166534' }}>
                        {formatCurrency(calculatedAmount)}
                      </span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: '#166534' }}>
                      {formData.days} jours × {formatCurrency(formData.daily_rate)}/jour
                    </p>
                  </div>
                )}

                {/* Notes */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1" style={{ color: '#1e293b' }}>
                    Notes (optionnel)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 rounded"
                    style={{ border: '1px solid #cbd5e1' }}
                    placeholder="Remarques supplémentaires..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-2 rounded font-medium"
                    style={{ backgroundColor: '#167bff', color: 'white' }}
                  >
                    {editingRental ? 'Modifier' : 'Enregistrer'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-2 rounded font-medium"
                    style={{ backgroundColor: '#e2e8f0', color: '#1e293b' }}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
