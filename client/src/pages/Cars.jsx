import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDialog } from '../context/DialogContext';
import { carsAPI, carModelsAPI, sellersAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import BulkPaymentImport from '../components/BulkPaymentImport';

export default function Cars() {
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useDialog();
  const [cars, setCars] = useState([]);
  const [carModels, setCarModels] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [formData, setFormData] = useState({
    vin: '',
    car_model_id: '',
    year: new Date().getFullYear(),
    color: '',
    mileage: '',
    purchase_date: new Date().toISOString().split('T')[0],
    purchase_price: '',
    seller_id: '',
    clearance_cost: '',
    towing_cost: ''
  });

  useEffect(() => {
    fetchCars();
    fetchCarModels();
    fetchSellers();
  }, []);

  useEffect(() => {
    fetchCars();
  }, [showDeleted]);

  const fetchCars = async () => {
    try {
      setLoading(true);
      const response = await carsAPI.getAll(false, showDeleted);
      setCars(response.data);
    } catch (error) {
      await showAlert('Erreur lors du chargement des véhicules', 'error');
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

  const fetchSellers = async () => {
    try {
      const response = await sellersAPI.getActive();
      setSellers(response.data);
    } catch (error) {
      console.error('Error fetching sellers:', error);
    }
  };

  const handleCreate = () => {
    setEditingCar(null);
    setFormData({
      vin: '',
      ref: '',
      car_model_id: '',
      year: new Date().getFullYear(),
      color: '',
      mileage: '',
      purchase_date: new Date().toISOString().split('T')[0],
      purchase_price: '',
      seller_id: '',
      clearance_cost: '',
      towing_cost: ''
    });
    setShowForm(true);
  };

  const handleEdit = (car) => {
    setEditingCar(car);
    setFormData({
      vin: car.vin,
      ref: car.ref || '',
      car_model_id: car.car_model_id || '',
      year: car.year,
      color: car.color || '',
      mileage: car.mileage || '',
      purchase_date: car.purchase_date,
      purchase_price: car.purchase_price,
      seller_id: car.seller_id || '',
      clearance_cost: car.clearance_cost || '',
      towing_cost: car.towing_cost || ''
    });
    setShowForm(true);
  };

  const handleView = (car) => {
    // Navigate to the dedicated detail page
    navigate(`/cars/${car.id}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingCar) {
        await carsAPI.update(editingCar.id, formData);
        resetForm();
        fetchCars();
        await showAlert('Véhicule modifié avec succès', 'success');
      } else {
        await carsAPI.create(formData);
        resetForm();
        fetchCars();
        await showAlert('Véhicule ajouté avec succès', 'success');
      }
    } catch (error) {
      await showAlert(
        error.response?.data?.errors?.[0] || 'Erreur lors de l\'enregistrement',
        'error'
      );
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm(
      'Êtes-vous sûr de vouloir supprimer ce véhicule ?',
      'Supprimer le véhicule'
    );

    if (!confirmed) return;

    try {
      await carsAPI.delete(id);
      await showAlert('Véhicule supprimé avec succès', 'success');
      fetchCars();
    } catch (error) {
      await showAlert(
        error.response?.data?.error || 'Erreur lors de la suppression',
        'error'
      );
    }
  };

  const handleRestore = async (id) => {
    const confirmed = await showConfirm(
      'Êtes-vous sûr de vouloir restaurer ce véhicule ?',
      'Restaurer le véhicule'
    );

    if (!confirmed) return;

    try {
      await carsAPI.restore(id);
      await showAlert('Véhicule restauré avec succès', 'success');
      fetchCars();
    } catch (error) {
      await showAlert(
        error.response?.data?.error || 'Erreur lors de la restauration',
        'error'
      );
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingCar(null);
    setFormData({
      vin: '',
      ref: '',
      car_model_id: '',
      year: new Date().getFullYear(),
      color: '',
      mileage: '',
      purchase_date: new Date().toISOString().split('T')[0],
      purchase_price: '',
      seller_id: '',
      clearance_cost: '',
      towing_cost: ''
    });
  };

  const filteredCars = cars.filter((car) =>
    car.vin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.car_model?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.color?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.seller?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );


  return (
    <div className="page-container" style={{ padding: '20px' }}>
      <style>{`
        .car-photos-swiper::-webkit-scrollbar {
          display: none;
        }
        .car-photos-swiper {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        @media (max-width: 768px) {
          .cars-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <div className="mb-5">
        <h1 className="text-2xl font-bold mb-4" style={{ color: '#1e293b' }}>
          Véhicules
        </h1>
        {/* Action buttons - stack on mobile */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowDeleted(!showDeleted)}
            className="px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base flex-1 sm:flex-none"
            style={{
              backgroundColor: showDeleted ? '#dc2626' : '#f3f4f6',
              color: showDeleted ? 'white' : '#374151',
              border: showDeleted ? 'none' : '1px solid #e5e7eb',
            }}
          >
            {showDeleted ? '🗑️ Supprimés' : '📋 Actifs'}
          </button>
          <button
            onClick={() => navigate('/cars/import')}
            className="px-4 py-2 rounded-lg font-bold transition-colors text-sm sm:text-base flex-1 sm:flex-none"
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none'
            }}
          >
            <span className="hidden sm:inline">📋 Importer Excel</span>
            <span className="sm:hidden">📋 Import</span>
          </button>
          <BulkPaymentImport onImportComplete={fetchCars} />
          <button
            onClick={handleCreate}
            className="px-4 py-2 rounded-lg font-bold transition-colors text-sm sm:text-base flex-1 sm:flex-none"
            style={{
              backgroundColor: '#167bff',
              color: 'white',
              border: 'none'
            }}
          >
            <span className="hidden sm:inline">+ Nouveau Véhicule</span>
            <span className="sm:hidden">+ Nouveau</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Rechercher par VIN, modèle, couleur, vendeur..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid #ddd',
            fontSize: '14px'
          }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto"
            style={{ borderColor: '#167bff', width: '48px', height: '48px' }}
          />
        </div>
      ) : (
        <div className="cars-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))',
          gap: '20px'
        }}>
          {filteredCars.map((car) => (
            <div
              key={car.id}
              style={{
                backgroundColor: car.deleted ? '#fef2f2' : 'white',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: car.deleted ? '2px solid #dc2626' : '1px solid #e5e7eb',
                opacity: car.deleted ? 0.7 : 1
              }}
            >
              {/* Status Badges */}
              <div style={{ marginBottom: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {car.deleted && (
                  <div style={{
                    backgroundColor: '#dc2626',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    display: 'inline-block'
                  }}>
                    🗑️ SUPPRIMÉ
                  </div>
                )}
                {car.status === 'rental' && !car.deleted && (
                  <div style={{
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    display: 'inline-block'
                  }}>
                    🚗 EN LOCATION
                  </div>
                )}
                {car.status === 'sold' && !car.deleted && (
                  <div style={{
                    backgroundColor: car.fully_paid ? '#10b981' : '#167bff',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    display: 'inline-block'
                  }}>
                    {car.fully_paid ? '✓ PAYÉ INTÉGRALEMENT' : '💰 VENDU'}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '15px' }}>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: 'bold' }}>
                  {car.display_name || car.car_model?.name || 'N/A'}
                </h3>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                  VIN: {car.vin}
                </p>
                {car.status === 'sold' && car.sale_price && (
                  <p style={{ margin: '5px 0 0 0', color: '#10b981', fontSize: '14px', fontWeight: '600' }}>
                    Prix de vente: {formatCurrency(car.sale_price)} MRU
                    {car.payment_percentage > 0 && (
                      <span style={{ marginLeft: '8px', fontSize: '12px', color: '#64748b' }}>
                        ({car.payment_percentage}% payé)
                      </span>
                    )}
                  </p>
                )}
                {car.has_rental_history && car.total_rental_income > 0 && (
                  <p style={{ margin: '5px 0 0 0', color: '#10b981', fontSize: '14px', fontWeight: '600' }}>
                    Revenus location: {formatCurrency(car.total_rental_income)} MRU
                  </p>
                )}
              </div>

              {/* Salvage Photos Swiper */}
              {car.salvage_photos && car.salvage_photos.length > 0 && (
                <div style={{ marginBottom: '15px', position: 'relative' }}>
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch',
                    scrollSnapType: 'x mandatory'
                  }}
                  className="car-photos-swiper"
                  >
                    {car.salvage_photos.slice(0, 5).map((photo, index) => (
                      <div
                        key={photo.id || index}
                        style={{
                          minWidth: '100px',
                          height: '100px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          scrollSnapAlign: 'start',
                          cursor: 'pointer',
                          position: 'relative'
                        }}
                        onClick={() => handleView(car)}
                      >
                        <img
                          src={photo.url}
                          alt={`Photo ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                        {index === 4 && car.salvage_photos.length > 5 && (
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '16px'
                          }}>
                            +{car.salvage_photos.length - 5}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '15px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ color: '#6b7280' }}>Année:</span>
                  <span style={{ fontWeight: '500' }}>{car.year}</span>
                </div>
                {car.color && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ color: '#6b7280' }}>Couleur:</span>
                    <span style={{ fontWeight: '500' }}>{car.color}</span>
                  </div>
                )}
                {car.mileage && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ color: '#6b7280' }}>Kilométrage:</span>
                    <span style={{ fontWeight: '500' }}>{car.mileage.toLocaleString()} km</span>
                  </div>
                )}
                <div style={{
                  borderTop: '1px solid #e5e7eb',
                  paddingTop: '8px',
                  marginTop: '8px',
                  marginBottom: '8px'
                }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ color: '#6b7280' }}>Prix d'achat:</span>
                  <span style={{ fontWeight: '500' }}>
                    {formatCurrency(car.purchase_price || 0)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ color: '#6b7280' }}>Dédouanement:</span>
                  <span style={{ fontWeight: '500' }}>
                    {formatCurrency(car.clearance_cost || 0)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ color: '#6b7280' }}>Remorquage:</span>
                  <span style={{ fontWeight: '500' }}>
                    {formatCurrency(car.towing_cost || 0)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ color: '#6b7280' }}>Total dépenses:</span>
                  <span style={{ fontWeight: '500', color: '#f59e0b' }}>
                    {formatCurrency(car.total_expenses || 0)}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '8px',
                  paddingTop: '8px',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <span style={{ color: '#1e293b', fontWeight: 'bold' }}>Coût total:</span>
                  <span style={{ fontWeight: 'bold', color: '#dc2626', fontSize: '16px' }}>
                    {formatCurrency(car.total_cost || 0)}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button
                  onClick={() => handleView(car)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #167bff',
                    backgroundColor: '#167bff',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Voir Détails
                </button>
                {car.deleted ? (
                  <button
                    onClick={() => handleRestore(car.id)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #10b981',
                      backgroundColor: 'white',
                      color: '#10b981',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    ↶ Restaurer
                  </button>
                ) : (
                  <button
                    onClick={() => handleDelete(car.id)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #dc2626',
                      backgroundColor: 'white',
                      color: '#dc2626',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredCars.length === 0 && !loading && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <p style={{ color: '#6b7280', margin: 0 }}>
            {searchTerm ? 'Aucun véhicule trouvé' : 'Aucun véhicule enregistré'}
          </p>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
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
          padding: '0'
        }}
        className="sm:p-5"
        >
          <div
            className="modal-container"
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '20px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '100vh',
              overflowY: 'auto'
            }}
          >
            <h2 className="text-lg sm:text-xl font-bold mb-4" style={{ margin: '0 0 20px 0' }}>
              {editingCar ? 'Modifier le véhicule' : 'Nouveau véhicule'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <select
                    value={formData.seller_id}
                    onChange={(e) => setFormData({ ...formData, seller_id: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">-- Sélectionner un vendeur --</option>
                    {sellers.map((seller) => (
                      <option key={seller.id} value={seller.id}>
                        {seller.name} {seller.location && `(${seller.location})`}
                      </option>
                    ))}
                  </select>
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
                  {editingCar ? 'Modifier' : 'Créer'}
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
                  Fermer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
