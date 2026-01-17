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
    renter_name: '',
    renter_phone: '',
    renter_id_number: '',
    amount: '',
    start_date: new Date().toISOString().split('T')[0],
    billing_frequency: 'weekly',
    rate_per_period: '',
    notes: ''
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingRental(null);
    setFormData({
      renter_name: '',
      renter_phone: '',
      renter_id_number: '',
      amount: '',
      start_date: new Date().toISOString().split('T')[0],
      billing_frequency: 'weekly',
      rate_per_period: '',
      notes: ''
    });
  };

  const handleAddRental = () => {
    setEditingRental(null);
    setFormData({
      renter_name: '',
      renter_phone: '',
      renter_id_number: '',
      amount: '',
      start_date: new Date().toISOString().split('T')[0],
      billing_frequency: 'weekly',
      rate_per_period: '',
      notes: ''
    });
    setShowForm(true);
  };

  const handleEditRental = (rental) => {
    setEditingRental(rental);
    setFormData({
      renter_name: rental.renter_name || '',
      renter_phone: rental.renter_phone || '',
      renter_id_number: rental.renter_id_number || '',
      amount: rental.amount,
      start_date: rental.start_date,
      billing_frequency: rental.billing_frequency || 'weekly',
      rate_per_period: rental.rate_per_period || '',
      notes: rental.notes || ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const rentalData = {
      ...formData,
      car_id: car.id,
      amount: parseFloat(formData.amount)
    };

    if (formData.rate_per_period) {
      rentalData.rate_per_period = parseFloat(formData.rate_per_period);
    }

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
      'Êtes-vous sûr de vouloir supprimer cette transaction de location ?',
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

  const handleCompleteRental = async (rentalId) => {
    const confirmed = await showConfirm(
      'Marquer cette location comme terminée ?',
      'Terminer la location'
    );

    if (!confirmed) return;

    try {
      await onRentalTransactionChange('complete', rentalId);
      await showAlert('Location terminée avec succès', 'success');
    } catch (error) {
      await showAlert(
        error.response?.data?.error || 'Erreur',
        'error'
      );
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      active: { label: 'En cours', bg: '#fef3c7', color: '#92400e' },
      completed: { label: 'Terminée', bg: '#dcfce7', color: '#166534' },
      cancelled: { label: 'Annulée', bg: '#fee2e2', color: '#991b1b' }
    };

    const badge = config[status] || config.active;

    return (
      <span
        className="px-2 py-1 rounded text-xs font-medium"
        style={{ backgroundColor: badge.bg, color: badge.color }}
      >
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  const calculateDuration = (startDate, endDate) => {
    if (!endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.floor((end - start) / (1000 * 60 * 60 * 24));
    return days;
  };

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
            📝 Nouvelle Transaction
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

      {/* Current Active Rental */}
      {car.active_rental && (
        <div className="rounded-lg p-4 mb-6" style={{ backgroundColor: '#fef3c7', border: '1px solid #fbbf24' }}>
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold" style={{ color: '#92400e' }}>📍 Location en cours</h3>
            {canWrite && (
              <button
                onClick={() => handleCompleteRental(car.active_rental.id)}
                className="px-3 py-1 rounded text-sm font-medium"
                style={{ backgroundColor: '#10b981', color: 'white' }}
              >
                Terminer
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium" style={{ color: '#92400e' }}>Locataire:</span>
              <span className="ml-2">{car.active_rental.renter_name}</span>
            </div>
            <div>
              <span className="font-medium" style={{ color: '#92400e' }}>Téléphone:</span>
              <span className="ml-2">{car.active_rental.renter_phone || '-'}</span>
            </div>
            <div>
              <span className="font-medium" style={{ color: '#92400e' }}>Début:</span>
              <span className="ml-2">{formatDate(car.active_rental.start_date)}</span>
            </div>
            <div>
              <span className="font-medium" style={{ color: '#92400e' }}>Montant:</span>
              <span className="ml-2">{formatCurrency(car.active_rental.amount)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Rental History */}
      <div>
        <h3 className="text-base sm:text-lg font-bold mb-3" style={{ color: '#1e293b' }}>Historique des Locations</h3>

        {rentalTransactions.length === 0 ? (
          <div className="rounded-lg p-6 sm:p-8 text-center" style={{ backgroundColor: '#f1f5f9' }}>
            <p className="text-sm sm:text-base" style={{ color: '#64748b' }}>Aucune location enregistrée pour ce véhicule</p>
            {car.status === 'rental' && (
              <p className="text-xs sm:text-sm mt-2" style={{ color: '#64748b' }}>
                Cliquez sur "Nouvelle Transaction" pour ajouter une location
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
                      {rental.renter_name}
                    </span>
                    {getStatusBadge(rental.status)}
                  </div>
                  {canWrite && (
                    <div className="flex gap-1.5 sm:gap-2 w-full sm:w-auto">
                      {rental.status === 'active' && (
                        <button
                          onClick={() => handleCompleteRental(rental.id)}
                          className="flex-1 sm:flex-none px-2 py-1 rounded text-xs"
                          style={{ backgroundColor: '#10b981', color: 'white' }}
                        >
                          ✓ Terminer
                        </button>
                      )}
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
                    <span style={{ color: '#64748b' }}>Début:</span>
                    <span className="ml-1 font-medium">{formatDate(rental.start_date)}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Fin:</span>
                    <span className="ml-1 font-medium">{formatDate(rental.end_date)}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Durée:</span>
                    <span className="ml-1 font-medium">
                      {rental.duration_days !== null ? `${rental.duration_days} jours` : 'En cours'}
                    </span>
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
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#1e293b' }}>
                {editingRental ? 'Modifier la Location' : 'Nouvelle Location'}
              </h2>

              <form onSubmit={handleSubmit}>
                {/* Renter Information */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1" style={{ color: '#1e293b' }}>
                    Nom du Locataire *
                  </label>
                  <input
                    type="text"
                    value={formData.renter_name}
                    onChange={(e) => setFormData({ ...formData, renter_name: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded"
                    style={{ border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#1e293b' }}>
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={formData.renter_phone}
                      onChange={(e) => setFormData({ ...formData, renter_phone: e.target.value })}
                      className="w-full px-3 py-2 rounded"
                      style={{ border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#1e293b' }}>
                      N° Pièce d'identité
                    </label>
                    <input
                      type="text"
                      value={formData.renter_id_number}
                      onChange={(e) => setFormData({ ...formData, renter_id_number: e.target.value })}
                      className="w-full px-3 py-2 rounded"
                      style={{ border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>

                {/* Rental Details */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#1e293b' }}>
                      Date de début *
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                      className="w-full px-3 py-2 rounded"
                      style={{ border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#1e293b' }}>
                      Fréquence
                    </label>
                    <select
                      value={formData.billing_frequency}
                      onChange={(e) => setFormData({ ...formData, billing_frequency: e.target.value })}
                      className="w-full px-3 py-2 rounded"
                      style={{ border: '1px solid #cbd5e1' }}
                    >
                      <option value="daily">Journalier</option>
                      <option value="weekly">Hebdomadaire</option>
                      <option value="monthly">Mensuel</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#1e293b' }}>
                      Montant Total (MRU) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                      className="w-full px-3 py-2 rounded"
                      style={{ border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#1e293b' }}>
                      Tarif par période (optionnel)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.rate_per_period}
                      onChange={(e) => setFormData({ ...formData, rate_per_period: e.target.value })}
                      className="w-full px-3 py-2 rounded"
                      style={{ border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1" style={{ color: '#1e293b' }}>
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 rounded"
                    style={{ border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="px-6 py-2 rounded font-medium"
                    style={{ backgroundColor: '#167bff', color: 'white' }}
                  >
                    {editingRental ? 'Modifier' : 'Créer'}
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
