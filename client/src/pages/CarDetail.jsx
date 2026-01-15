import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { carsAPI, expensesAPI, paymentsAPI, carModelsAPI, rentalTransactionsAPI, tagsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';
import PhotoGallery from '../components/PhotoGallery';
import InvoiceManager from '../components/InvoiceManager';
import ExpenseManager from '../components/ExpenseManager';
import PaymentManager from '../components/PaymentManager';
import RentalManager from '../components/RentalManager';
import ProfitShareManager from '../components/ProfitShareManager';
import { formatCurrency, formatNumber } from '../utils/formatters';

export default function CarDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canWrite } = useAuth();
  const { showAlert, showConfirm } = useDialog();

  const [car, setCar] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [carModels, setCarModels] = useState([]);
  const [tags, setTags] = useState([]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showSellForm, setShowSellForm] = useState(false);
  const [saleFormData, setSaleFormData] = useState({
    sale_price: '',
    sale_date: new Date().toISOString().split('T')[0]
  });
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
    towing_cost: '',
    tag_ids: []
  });

  useEffect(() => {
    fetchCarDetails();
    fetchCarModels();
    fetchTags();
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

      // Payments are already included in the car data from the serializer
      setPayments(carResponse.data.payments || []);
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

  const fetchTags = async () => {
    try {
      const response = await tagsAPI.getAll();
      setTags(response.data);
    } catch (error) {
      console.error('Error fetching tags:', error);
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

  // Sale handlers
  const handleSellCar = () => {
    setSaleFormData({
      sale_price: car.total_cost.toString(),
      sale_date: new Date().toISOString().split('T')[0]
    });
    setShowSellForm(true);
  };

  const handleSellSubmit = async (e) => {
    e.preventDefault();

    try {
      await carsAPI.sell(id, saleFormData.sale_price, saleFormData.sale_date);
      await showAlert('Véhicule marqué comme vendu', 'success');
      setShowSellForm(false);
      await fetchCarDetails();
    } catch (error) {
      await showAlert(
        error.response?.data?.error || 'Erreur lors de l\'enregistrement',
        'error'
      );
    }
  };

  const handleUnsellCar = async () => {
    const confirmed = await showConfirm(
      'Êtes-vous sûr de vouloir annuler la vente de ce véhicule ?',
      'Annuler la vente'
    );

    if (!confirmed) return;

    try {
      await carsAPI.unsell(id);
      await showAlert('Vente annulée avec succès', 'success');
      await fetchCarDetails();
    } catch (error) {
      await showAlert(
        error.response?.data?.error || 'Erreur lors de l\'annulation',
        'error'
      );
    }
  };

  // Payment handlers
  const handlePaymentChange = async (action, paymentId, paymentData) => {
    if (action === 'create') {
      await paymentsAPI.create(paymentData);
    } else if (action === 'update') {
      await paymentsAPI.update(paymentId, paymentData);
    } else if (action === 'delete') {
      await paymentsAPI.delete(paymentId);
    }
    await fetchCarDetails();
  };

  // Rental handlers
  const handleMarkAsRental = async () => {
    const confirmed = await showConfirm(
      'Marquer ce véhicule comme loué ?',
      'Marquer comme Loué'
    );
    if (!confirmed) return;

    try {
      await carsAPI.rent(id);
      await showAlert('Véhicule marqué comme loué', 'success');
      await fetchCarDetails();
    } catch (error) {
      await showAlert(error.response?.data?.error || 'Erreur', 'error');
    }
  };

  const handleReturnFromRental = async () => {
    const confirmed = await showConfirm(
      'Retourner ce véhicule de la location ?',
      'Retour de Location'
    );
    if (!confirmed) return;

    try {
      await carsAPI.returnRental(id, { complete_rental: true });
      await showAlert('Véhicule retourné avec succès', 'success');
      await fetchCarDetails();
    } catch (error) {
      await showAlert(error.response?.data?.error || 'Erreur', 'error');
    }
  };

  const handleRentalTransactionChange = async (action, rentalId, rentalData) => {
    if (action === 'create') {
      await rentalTransactionsAPI.create(rentalData);
    } else if (action === 'update') {
      await rentalTransactionsAPI.update(rentalId, rentalData);
    } else if (action === 'delete') {
      await rentalTransactionsAPI.delete(rentalId);
    } else if (action === 'complete') {
      await rentalTransactionsAPI.complete(rentalId);
    }
    await fetchCarDetails();
  };

  // Edit car
  const handleEdit = () => {
    setFormData({
      vin: car.vin,
      ref: car.ref || '',
      car_model_id: car.car_model_id || '',
      year: car.year,
      color: car.color || '',
      mileage: car.mileage || '',
      purchase_date: car.purchase_date,
      purchase_price: car.purchase_price,
      seller: car.seller?.name || '',
      location: car.location || '',
      clearance_cost: car.clearance_cost || '',
      towing_cost: car.towing_cost || '',
      tag_ids: car.tags ? car.tags.map(tag => tag.id) : []
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
      ref: '',
      car_model_id: '',
      year: new Date().getFullYear(),
      color: '',
      mileage: '',
      purchase_date: new Date().toISOString().split('T')[0],
      purchase_price: '',
      seller: '',
      location: '',
      clearance_cost: '',
      towing_cost: '',
      tag_ids: []
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
                {car.display_name || `${car.car_model?.name} ${car.year}`}
              </h1>
              <p className="text-lg" style={{ color: '#64748b' }}>
                VIN: {car.vin}
              </p>
              {car.tags && car.tags.length > 0 && (
                <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {car.tags.map((tag) => (
                    <span
                      key={tag.id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '600',
                        backgroundColor: `${tag.color}20`,
                        color: tag.color,
                        border: `1px solid ${tag.color}40`
                      }}
                    >
                      <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: tag.color
                      }} />
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            {canWrite && car.status === 'active' && (
              <>
                <button
                  onClick={handleMarkAsRental}
                  className="px-4 py-2 rounded-lg font-medium transition-colors text-white"
                  style={{ backgroundColor: '#f59e0b' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#d97706'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#f59e0b'}
                >
                  🚗 Marquer comme Loué
                </button>
                <button
                  onClick={handleSellCar}
                  className="px-4 py-2 rounded-lg font-medium transition-colors text-white"
                  style={{ backgroundColor: '#10b981' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
                >
                  💰 Marquer comme Vendu
                </button>
              </>
            )}

            {canWrite && car.status === 'rental' && (
              <button
                onClick={handleReturnFromRental}
                className="px-4 py-2 rounded-lg font-medium transition-colors text-white"
                style={{ backgroundColor: '#f59e0b' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#d97706'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#f59e0b'}
              >
                ↶ Retour de Location
              </button>
            )}

            {canWrite && car.status === 'sold' && (
              <button
                onClick={handleUnsellCar}
                className="px-4 py-2 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: '#fafbfc', border: '1px solid #e2e8f0', color: '#475569' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#fafbfc'}
                disabled={payments.length > 0}
                title={payments.length > 0 ? 'Impossible: des paiements ont été enregistrés' : ''}
              >
                ↶ Annuler la Vente
              </button>
            )}
            {canWrite && (
              <button
                onClick={handleEdit}
                className="px-4 py-2 rounded-lg font-medium transition-colors text-white"
                style={{ backgroundColor: '#167bff' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#0d5dd6'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#167bff'}
              >
                ✏️ Modifier
              </button>
            )}
            {canWrite && expenses.length === 0 && payments.length === 0 && (
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
                  {formatNumber(car.mileage, 0)} km
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
                {formatCurrency(car.purchase_price)}
              </span>
            </div>

            {car.clearance_cost > 0 && (
              <div className="flex justify-between items-center pb-3" style={{ borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#475569' }}>Dédouanement</span>
                <span className="font-semibold" style={{ color: '#1e293b' }}>
                  {formatCurrency(car.clearance_cost)}
                </span>
              </div>
            )}

            {car.towing_cost > 0 && (
              <div className="flex justify-between items-center pb-3" style={{ borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#475569' }}>Remorquage</span>
                <span className="font-semibold" style={{ color: '#1e293b' }}>
                  {formatCurrency(car.towing_cost)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center pb-3" style={{ borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ color: '#475569' }}>Dépenses totales ({expenses.length})</span>
              <span className="font-semibold" style={{ color: '#1e293b' }}>
                {formatCurrency(car.total_expenses || 0)}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-lg font-bold" style={{ color: '#1e293b' }}>Coût Total</span>
              <span className="text-2xl font-bold" style={{ color: '#167bff' }}>
                {formatCurrency(car.total_cost || 0)}
              </span>
            </div>

            {/* Rental Income */}
            {car.has_rental_history && (
              <div className="flex justify-between items-center pt-3" style={{ borderTop: '1px solid #e2e8f0' }}>
                <span style={{ color: '#475569' }}>Revenus de location</span>
                <span className="font-semibold" style={{ color: '#10b981' }}>
                  +{formatCurrency(car.total_rental_income || 0)}
                </span>
              </div>
            )}

            {/* Profit/Loss */}
            {car.profit !== null && car.profit !== undefined && (
              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-bold" style={{ color: '#1e293b' }}>
                  {car.status === 'sold' ? 'Bénéfice Total' : 'Bénéfice Actuel'}
                </span>
                <span className="text-2xl font-bold" style={{ color: car.profit >= 0 ? '#10b981' : '#ef4444' }}>
                  {car.profit >= 0 ? '+' : ''}{formatCurrency(car.profit)}
                </span>
              </div>
            )}

            {/* Break-even Badge */}
            {car.rental_break_even && car.status !== 'sold' && (
              <div className="rounded-lg p-3 mt-3" style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac' }}>
                <p className="text-sm font-medium" style={{ color: '#166534' }}>
                  ✓ Location rentable (revenus ≥ coûts totaux)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Tracking Section - Only shown for sold cars */}
        {car.status === 'sold' && (
          <PaymentManager
            car={car}
            payments={payments}
            onPaymentChange={handlePaymentChange}
          />
        )}

        {/* Profit Share Section - Only shown for sold cars with profit */}
        {car.status === 'sold' && car.profit !== null && (
          <ProfitShareManager
            car={car}
            onCarUpdate={fetchCarDetails}
          />
        )}

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

        {/* Rental Section - Show for rental cars OR cars with rental history */}
        {(car.status === 'rental' || car.has_rental_history) && (
          <RentalManager
            car={car}
            rentalTransactions={car.rental_transactions || []}
            onRentalTransactionChange={handleRentalTransactionChange}
          />
        )}
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

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                    Référence
                  </label>
                  <input
                    type="number"
                    value={formData.ref || ''}
                    onChange={(e) => setFormData({ ...formData, ref: e.target.value })}
                    placeholder="Ex: 12"
                    min="1"
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

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                    Tags
                  </label>
                  <div style={{
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    padding: '8px',
                    minHeight: '40px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px'
                  }}>
                    {tags.map((tag) => {
                      const isSelected = formData.tag_ids.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setFormData({
                                ...formData,
                                tag_ids: formData.tag_ids.filter(id => id !== tag.id)
                              });
                            } else {
                              setFormData({
                                ...formData,
                                tag_ids: [...formData.tag_ids, tag.id]
                              });
                            }
                          }}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '4px',
                            border: isSelected ? `2px solid ${tag.color}` : '1px solid #e2e8f0',
                            backgroundColor: isSelected ? `${tag.color}20` : 'white',
                            color: isSelected ? tag.color : '#64748b',
                            fontSize: '13px',
                            fontWeight: isSelected ? '600' : '400',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          {isSelected && (
                            <div style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              backgroundColor: tag.color
                            }} />
                          )}
                          {tag.name}
                        </button>
                      );
                    })}
                    {tags.length === 0 && (
                      <span style={{ fontSize: '13px', color: '#94a3b8', padding: '4px' }}>
                        Aucun tag disponible. Créez-en dans Paramètres.
                      </span>
                    )}
                  </div>
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

      {/* Sell Form Modal */}
      {showSellForm && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="bg-white rounded-lg shadow-xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b">
                <div>
                  <h3 className="text-xl font-bold" style={{ color: '#1e293b' }}>
                    Marquer comme Vendu
                  </h3>
                  <p className="text-sm mt-1" style={{ color: '#64748b' }}>
                    Définissez le prix de vente du véhicule
                  </p>
                </div>
                <button
                  onClick={() => setShowSellForm(false)}
                  className="rounded transition-colors p-1"
                  style={{ color: '#64748b' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSellSubmit} className="p-6 space-y-4">
                {/* Cost Summary */}
                <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                  <p className="text-sm mb-2" style={{ color: '#64748b' }}>Coût total du véhicule</p>
                  <p className="text-2xl font-bold" style={{ color: '#167bff' }}>
                    {formatCurrency(car.total_cost)}
                  </p>
                  <p className="text-xs mt-2" style={{ color: '#64748b' }}>
                    Prix d'achat + Dédouanement + Remorquage + Dépenses
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#1e293b' }}>
                    Prix de vente <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={saleFormData.sale_price}
                    onChange={(e) => setSaleFormData({ ...saleFormData, sale_price: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-lg transition-colors text-lg font-medium"
                    style={{ border: '1px solid #e2e8f0', color: '#1e293b' }}
                    onFocus={(e) => e.target.style.borderColor = '#167bff'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    placeholder="0.00"
                  />
                  {saleFormData.sale_price && (
                    <div className="mt-2">
                      {parseFloat(saleFormData.sale_price) > car.total_cost ? (
                        <p className="text-sm" style={{ color: '#10b981' }}>
                          ✓ Bénéfice: +{formatCurrency(parseFloat(saleFormData.sale_price) - car.total_cost)}
                        </p>
                      ) : parseFloat(saleFormData.sale_price) < car.total_cost ? (
                        <p className="text-sm" style={{ color: '#ef4444' }}>
                          ⚠ Perte: {formatCurrency(parseFloat(saleFormData.sale_price) - car.total_cost)}
                        </p>
                      ) : (
                        <p className="text-sm" style={{ color: '#64748b' }}>
                          = Prix au coût (pas de bénéfice ni perte)
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#1e293b' }}>
                    Date de vente <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={saleFormData.sale_date}
                    onChange={(e) => setSaleFormData({ ...saleFormData, sale_date: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-lg transition-colors"
                    style={{ border: '1px solid #e2e8f0', color: '#1e293b' }}
                    onFocus={(e) => e.target.style.borderColor = '#167bff'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>

                {/* Info Box */}
                <div className="rounded-lg p-4" style={{ backgroundColor: '#eff6ff', border: '1px solid #167bff' }}>
                  <p className="text-sm" style={{ color: '#1e40af' }}>
                    💡 Après avoir marqué le véhicule comme vendu, vous pourrez enregistrer les paiements reçus jusqu'au paiement complet.
                  </p>
                </div>

                {/* Modal Footer */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowSellForm(false)}
                    className="flex-1 px-6 py-3 rounded-lg font-medium transition-colors"
                    style={{ backgroundColor: '#fafbfc', border: '1px solid #e2e8f0', color: '#475569' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#fafbfc'}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 rounded-lg font-medium transition-colors text-white"
                    style={{ backgroundColor: '#10b981' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
                  >
                    Marquer comme Vendu
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
