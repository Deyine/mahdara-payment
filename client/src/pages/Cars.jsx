import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDialog } from '../context/DialogContext';
import { carsAPI, carModelsAPI, sellersAPI } from '../services/api';

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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MRU'
    }).format(amount);
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
          Véhicules
        </h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => setShowDeleted(!showDeleted)}
            style={{
              backgroundColor: showDeleted ? '#dc2626' : '#f3f4f6',
              color: showDeleted ? 'white' : '#374151',
              padding: '10px 20px',
              borderRadius: '6px',
              border: showDeleted ? 'none' : '1px solid #e5e7eb',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            {showDeleted ? '🗑️ Véhicules supprimés' : '📋 Véhicules actifs'}
          </button>
          <button
            onClick={() => navigate('/cars/import')}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            📋 Importer Excel
          </button>
          <button
            onClick={handleCreate}
            style={{
              backgroundColor: '#167bff',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            + Nouveau Véhicule
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
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
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
              {car.deleted && (
                <div style={{
                  backgroundColor: '#dc2626',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  marginBottom: '10px',
                  display: 'inline-block'
                }}>
                  🗑️ SUPPRIMÉ
                </div>
              )}
              <div style={{ marginBottom: '15px' }}>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: 'bold' }}>
                  {car.car_model?.name || 'N/A'}
                </h3>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                  VIN: {car.vin}
                </p>
              </div>

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
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ color: '#6b7280' }}>Prix d'achat:</span>
                  <span style={{ fontWeight: '500', color: '#167bff' }}>
                    {formatCurrency(car.purchase_price)}
                  </span>
                </div>
                {car.total_cost && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ color: '#6b7280' }}>Coût total:</span>
                    <span style={{ fontWeight: 'bold', color: '#dc2626' }}>
                      {formatCurrency(car.total_cost)}
                    </span>
                  </div>
                )}
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
              {editingCar ? 'Modifier le véhicule' : 'Nouveau véhicule'}
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
