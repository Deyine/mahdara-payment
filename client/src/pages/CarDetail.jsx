import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { carsAPI, expensesAPI, carModelsAPI } from '../services/api';
import { useDialog } from '../context/DialogContext';
import PhotoGallery from '../components/PhotoGallery';
import InvoiceManager from '../components/InvoiceManager';
import ExpenseManager from '../components/ExpenseManager';

export default function CarDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useDialog();

  const [car, setCar] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [carModels, setCarModels] = useState([]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [formData, setFormData] = useState({
    vin: '',
    car_model_id: '',
    year: new Date().getFullYear(),
    color: '',
    mileage: '',
    purchase_date: new Date().toISOString().split('T')[0],
    purchase_price: '',
    seller: '',
    location: '',
    clearance_cost: '',
    towing_cost: ''
  });

  useEffect(() => {
    fetchCarDetails();
    fetchCarModels();
  }, [id]);

  const fetchCarDetails = async () => {
    try {
      setLoading(true);
      const [carResponse, expensesResponse] = await Promise.all([
        carsAPI.getOne(id),
        expensesAPI.getAll(id)
      ]);

      setCar(carResponse.data);
      setExpenses(expensesResponse.data);
    } catch (error) {
      await showAlert('Erreur lors du chargement des détails', 'error');
      navigate('/cars');
    } finally {
      setLoading(false);
    }
  };

  const fetchCarModels = async () => {
    try {
      const response = await carModelsAPI.getActive();
      setCarModels(response.data);
    } catch (error) {
      console.error('Error fetching car models:', error);
    }
  };

  // Photo upload handlers
  const handleUploadSalvagePhotos = async (files) => {
    await carsAPI.addSalvagePhotos(id, files);
    await fetchCarDetails();
  };

  const handleDeleteSalvagePhoto = async (photoId) => {
    await carsAPI.deleteSalvagePhoto(id, photoId);
    await fetchCarDetails();
  };

  const handleUploadAfterRepairPhotos = async (files) => {
    await carsAPI.addAfterRepairPhotos(id, files);
    await fetchCarDetails();
  };

  const handleDeleteAfterRepairPhoto = async (photoId) => {
    await carsAPI.deleteAfterRepairPhoto(id, photoId);
    await fetchCarDetails();
  };

  // Invoice upload handlers
  const handleUploadInvoices = async (files) => {
    try {
      await carsAPI.addInvoices(id, files);
      await showAlert('Facture(s) téléchargée(s) avec succès', 'success');
      await fetchCarDetails();
    } catch (error) {
      await showAlert(
        error.response?.data?.errors?.[0] || 'Erreur lors du téléchargement',
        'error'
      );
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    const confirmed = await showConfirm(
      'Êtes-vous sûr de vouloir supprimer cette facture ?',
      'Supprimer la facture'
    );

    if (!confirmed) return;

    try {
      await carsAPI.deleteInvoice(id, invoiceId);
      await showAlert('Facture supprimée avec succès', 'success');
      await fetchCarDetails();
    } catch (error) {
      await showAlert(
        error.response?.data?.error || 'Erreur lors de la suppression',
        'error'
      );
    }
  };

  // Expense handlers
  const handleExpenseChange = async (action, expenseId, expenseData) => {
    if (action === 'create') {
      await expensesAPI.create(expenseData);
    } else if (action === 'update') {
      await expensesAPI.update(expenseId, expenseData);
    } else if (action === 'delete') {
      await expensesAPI.delete(expenseId);
    }
    await fetchCarDetails();
  };

  // Edit car
  const handleEdit = () => {
    setFormData({
      vin: car.vin,
      car_model_id: car.car_model_id || '',
      year: car.year,
      color: car.color || '',
      mileage: car.mileage || '',
      purchase_date: car.purchase_date,
      purchase_price: car.purchase_price,
      seller: car.seller?.name || '',
      location: car.location || '',
      clearance_cost: car.clearance_cost || '',
      towing_cost: car.towing_cost || ''
    });
    setShowEditForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await carsAPI.update(id, formData);
      resetForm();
      fetchCarDetails();
      await showAlert('Véhicule modifié avec succès', 'success');
    } catch (error) {
      await showAlert(
        error.response?.data?.errors?.[0] || 'Erreur lors de l\'enregistrement',
        'error'
      );
    }
  };

  const resetForm = () => {
    setShowEditForm(false);
    setFormData({
      vin: '',
      car_model_id: '',
      year: new Date().getFullYear(),
      color: '',
      mileage: '',
      purchase_date: new Date().toISOString().split('T')[0],
      purchase_price: '',
      seller: '',
      location: '',
      clearance_cost: '',
      towing_cost: ''
    });
  };

  // Delete car
  const handleDeleteCar = async () => {
    const confirmed = await showConfirm(
      'Êtes-vous sûr de vouloir supprimer ce véhicule ? Cette action est irréversible.',
      'Supprimer le véhicule'
    );

    if (!confirmed) return;

    try {
      await carsAPI.delete(id);
      await showAlert('Véhicule supprimé avec succès', 'success');
      navigate('/cars');
    } catch (error) {
      await showAlert(
        error.response?.data?.error || 'Erreur lors de la suppression',
        'error'
      );
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{ borderColor: '#167bff' }}
        ></div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="p-6">
        <p style={{ color: '#ef4444' }}>Véhicule non trouvé</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafbfc' }}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/cars')}
              className="p-2 rounded-lg transition-colors"
              style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#ffffff'}
            >
              <svg className="h-6 w-6" style={{ color: '#475569' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: '#1e293b' }}>
                {car.car_model?.name} {car.year}
              </h1>
              <p className="text-lg" style={{ color: '#64748b' }}>
                VIN: {car.vin}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleEdit}
              className="px-4 py-2 rounded-lg font-medium transition-colors text-white"
              style={{ backgroundColor: '#167bff' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#0d5dd6'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#167bff'}
            >
              ✏️ Modifier
            </button>
            {expenses.length === 0 && (
              <button
                onClick={handleDeleteCar}
                className="px-4 py-2 rounded-lg font-medium transition-colors text-white"
                style={{ backgroundColor: '#ef4444' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
              >
                🗑️ Supprimer
              </button>
            )}
          </div>
        </div>

        {/* Vehicle Information Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6" style={{ border: '1px solid #e2e8f0' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#1e293b' }}>
            Informations du Véhicule
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm mb-1" style={{ color: '#64748b' }}>Modèle</p>
              <p className="font-semibold" style={{ color: '#1e293b' }}>{car.car_model?.name}</p>
            </div>
            <div>
              <p className="text-sm mb-1" style={{ color: '#64748b' }}>Année</p>
              <p className="font-semibold" style={{ color: '#1e293b' }}>{car.year}</p>
            </div>
            {car.color && (
              <div>
                <p className="text-sm mb-1" style={{ color: '#64748b' }}>Couleur</p>
                <p className="font-semibold" style={{ color: '#1e293b' }}>{car.color}</p>
              </div>
            )}
            {car.mileage && (
              <div>
                <p className="text-sm mb-1" style={{ color: '#64748b' }}>Kilométrage</p>
                <p className="font-semibold" style={{ color: '#1e293b' }}>
                  {formatCurrency(car.mileage)} km
                </p>
              </div>
            )}
            <div>
              <p className="text-sm mb-1" style={{ color: '#64748b' }}>Date d'achat</p>
              <p className="font-semibold" style={{ color: '#1e293b' }}>
                {new Date(car.purchase_date).toLocaleDateString('fr-FR')}
              </p>
            </div>
            {car.seller && (
              <div>
                <p className="text-sm mb-1" style={{ color: '#64748b' }}>Vendeur</p>
                <p className="font-semibold" style={{ color: '#1e293b' }}>{car.seller.name}</p>
              </div>
            )}
            {car.location && (
              <div>
                <p className="text-sm mb-1" style={{ color: '#64748b' }}>Localisation</p>
                <p className="font-semibold" style={{ color: '#1e293b' }}>{car.location}</p>
              </div>
            )}
          </div>
        </div>

        {/* Cost Breakdown Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6" style={{ border: '1px solid #e2e8f0' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#1e293b' }}>
            Détail des Coûts
          </h2>

          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3" style={{ borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ color: '#475569' }}>Prix d'achat</span>
              <span className="font-semibold" style={{ color: '#1e293b' }}>
                {formatCurrency(car.purchase_price)} MRU
              </span>
            </div>

            {car.clearance_cost > 0 && (
              <div className="flex justify-between items-center pb-3" style={{ borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#475569' }}>Dédouanement</span>
                <span className="font-semibold" style={{ color: '#1e293b' }}>
                  {formatCurrency(car.clearance_cost)} MRU
                </span>
              </div>
            )}

            {car.towing_cost > 0 && (
              <div className="flex justify-between items-center pb-3" style={{ borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#475569' }}>Remorquage</span>
                <span className="font-semibold" style={{ color: '#1e293b' }}>
                  {formatCurrency(car.towing_cost)} MRU
                </span>
              </div>
            )}

            <div className="flex justify-between items-center pb-3" style={{ borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ color: '#475569' }}>Dépenses totales ({expenses.length})</span>
              <span className="font-semibold" style={{ color: '#1e293b' }}>
                {formatCurrency(car.total_expenses || 0)} MRU
              </span>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-lg font-bold" style={{ color: '#1e293b' }}>Coût Total</span>
              <span className="text-2xl font-bold" style={{ color: '#167bff' }}>
                {formatCurrency(car.total_cost || 0)} MRU
              </span>
            </div>
          </div>
        </div>

        {/* Salvage Photos Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6" style={{ border: '1px solid #e2e8f0' }}>
          <PhotoGallery
            photos={car.salvage_photos || []}
            onUpload={handleUploadSalvagePhotos}
            onDelete={handleDeleteSalvagePhoto}
            title="Photos d'État Initial (Salvage)"
            emptyMessage="Aucune photo d'état initial. Téléchargez des photos montrant l'état du véhicule à l'achat."
          />
        </div>

        {/* After Repair Photos Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6" style={{ border: '1px solid #e2e8f0' }}>
          <PhotoGallery
            photos={car.after_repair_photos || []}
            onUpload={handleUploadAfterRepairPhotos}
            onDelete={handleDeleteAfterRepairPhoto}
            title="Photos Après Réparations"
            emptyMessage="Aucune photo après réparations. Téléchargez des photos montrant le véhicule après les travaux."
          />
        </div>

        {/* Invoices Section */}
        <InvoiceManager
          invoices={car.invoices || []}
          onUpload={handleUploadInvoices}
          onDelete={handleDeleteInvoice}
        />

        {/* Expenses Section */}
        <ExpenseManager
          expenses={expenses}
          carId={id}
          onExpenseChange={handleExpenseChange}
        />
      </div>

      {/* Edit Form Modal */}
      {showEditForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '30px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 'bold' }}>
              Modifier le véhicule
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                    VIN *
                  </label>
                  <input
                    type="text"
                    value={formData.vin}
                    onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                    Modèle *
                  </label>
                  <select
                    value={formData.car_model_id}
                    onChange={(e) => setFormData({ ...formData, car_model_id: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Sélectionner un modèle</option>
                    {carModels.map((model) => (
                      <option key={model.id} value={model.id}>{model.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                    Année *
                  </label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    required
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                    Couleur
                  </label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                    Kilométrage (km)
                  </label>
                  <input
                    type="number"
                    value={formData.mileage}
                    onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                    min="0"
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                    Date d'achat *
                  </label>
                  <input
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                    Prix d'achat (MRU) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                    required
                    min="0"
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                    Frais de dédouanement (MRU)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.clearance_cost}
                    onChange={(e) => setFormData({ ...formData, clearance_cost: e.target.value })}
                    min="0"
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                    Frais de remorquage (MRU)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.towing_cost}
                    onChange={(e) => setFormData({ ...formData, towing_cost: e.target.value })}
                    min="0"
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                    Vendeur
                  </label>
                  <input
                    type="text"
                    value={formData.seller}
                    onChange={(e) => setFormData({ ...formData, seller: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                    Localisation
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#167bff',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
