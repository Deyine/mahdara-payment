import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';
import { carsAPI, carModelsAPI, sellersAPI, tagsAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import BulkPaymentImport from '../components/BulkPaymentImport';
import InfoTooltip from '../components/InfoTooltip';

export default function Cars() {
  const navigate = useNavigate();
  const { canWrite } = useAuth();
  const { showAlert, showConfirm } = useDialog();
  const [cars, setCars] = useState([]);
  const [carModels, setCarModels] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all', 'fully_paid', 'in_progress', 'not_sold'
  const [selectedTagFilter, setSelectedTagFilter] = useState(null); // null means no tag filter
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
    towing_cost: '',
    tag_ids: []
  });

  useEffect(() => {
    fetchCars();
    fetchCarModels();
    fetchSellers();
    fetchTags();
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

  const fetchTags = async () => {
    try {
      const response = await tagsAPI.getAll();
      setTags(response.data);
    } catch (error) {
      console.error('Error fetching tags:', error);
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
      towing_cost: '',
      tag_ids: []
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
      towing_cost: car.towing_cost || '',
      tag_ids: car.tags ? car.tags.map(tag => tag.id) : []
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
      towing_cost: '',
      tag_ids: []
    });
  };

  const filteredCars = cars.filter((car) => {
    // Text search filter
    const matchesSearch = car.vin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.car_model?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.color?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.seller?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Payment status filter
    if (paymentFilter !== 'all') {
      if (paymentFilter === 'not_sold' && car.status === 'sold') return false;
      if (paymentFilter === 'fully_paid' && !(car.status === 'sold' && car.fully_paid)) return false;
      if (paymentFilter === 'in_progress' && !(car.status === 'sold' && !car.fully_paid)) return false;
    }

    // Tag filter
    if (selectedTagFilter) {
      const hasTag = car.tags && car.tags.some(tag => tag.id === selectedTagFilter);
      if (!hasTag) return false;
    }

    return true;
  });


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
          {canWrite && (
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
          )}
          {canWrite && <BulkPaymentImport onImportComplete={fetchCars} />}
          {canWrite && (
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
          )}
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

      {/* Payment Status Filters */}
      <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        <button
          onClick={() => setPaymentFilter('all')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: paymentFilter === 'all' ? 'none' : '1px solid #e5e7eb',
            backgroundColor: paymentFilter === 'all' ? '#167bff' : 'white',
            color: paymentFilter === 'all' ? 'white' : '#475569',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s'
          }}
        >
          Tous
        </button>
        <button
          onClick={() => setPaymentFilter('not_sold')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: paymentFilter === 'not_sold' ? 'none' : '1px solid #e5e7eb',
            backgroundColor: paymentFilter === 'not_sold' ? '#167bff' : 'white',
            color: paymentFilter === 'not_sold' ? 'white' : '#475569',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s'
          }}
        >
          Non Vendus
        </button>
        <button
          onClick={() => setPaymentFilter('in_progress')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: paymentFilter === 'in_progress' ? 'none' : '1px solid #e5e7eb',
            backgroundColor: paymentFilter === 'in_progress' ? '#167bff' : 'white',
            color: paymentFilter === 'in_progress' ? 'white' : '#475569',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s'
          }}
        >
          En Cours de Paiement
        </button>
        <button
          onClick={() => setPaymentFilter('fully_paid')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: paymentFilter === 'fully_paid' ? 'none' : '1px solid #e5e7eb',
            backgroundColor: paymentFilter === 'fully_paid' ? '#167bff' : 'white',
            color: paymentFilter === 'fully_paid' ? 'white' : '#475569',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s'
          }}
        >
          Payés Intégralement
        </button>
      </div>

      {/* Tag Filter */}
      {tags.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#475569' }}>
            Filtrer par tag
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <button
              onClick={() => setSelectedTagFilter(null)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: selectedTagFilter === null ? 'none' : '1px solid #e5e7eb',
                backgroundColor: selectedTagFilter === null ? '#167bff' : 'white',
                color: selectedTagFilter === null ? 'white' : '#475569',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              Tous les tags
            </button>
            {tags.map((tag) => {
              const isSelected = selectedTagFilter === tag.id;
              return (
                <button
                  key={tag.id}
                  onClick={() => setSelectedTagFilter(isSelected ? null : tag.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: isSelected ? `2px solid ${tag.color}` : '1px solid #e5e7eb',
                    backgroundColor: isSelected ? `${tag.color}20` : 'white',
                    color: isSelected ? tag.color : '#475569',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: isSelected ? '600' : '500',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: tag.color
                  }} />
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

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
                    backgroundColor: car.fully_paid ? '#10b981' : '#f59e0b',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    display: 'inline-block'
                  }}>
                    {car.fully_paid ? '✓ PAYÉ INTÉGRALEMENT' : '⏳ EN COURS DE PAIEMENT'}
                  </div>
                )}
                {car.status === 'sold' && !car.deleted && car.total_paid > car.sale_price && (
                  <div style={{
                    backgroundColor: '#dc2626',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    display: 'inline-block'
                  }}>
                    ⚠️ TROP-PERÇU
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
                {car.tags && car.tags.length > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {car.tags.map((tag) => (
                      <span
                        key={tag.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '500',
                          backgroundColor: `${tag.color}20`,
                          color: tag.color,
                          border: `1px solid ${tag.color}40`
                        }}
                      >
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: tag.color
                        }} />
                        {tag.name}
                      </span>
                    ))}
                  </div>
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

              {/* Compact Financial Summary */}
              <div style={{ marginBottom: '15px', fontSize: '14px' }}>
                {/* Basic info row */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '10px', fontSize: '13px', color: '#64748b' }}>
                  <span>{car.year}</span>
                  {car.color && <span>• {car.color}</span>}
                  {car.mileage && <span>• {car.mileage.toLocaleString()} km</span>}
                </div>

                {/* Financial summary with tooltips */}
                <div style={{
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {/* Prix de revient with tooltip */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: '#64748b', fontSize: '13px' }}>Prix de revient</span>
                      <InfoTooltip
                        title="Détail des coûts"
                        items={[
                          { label: "Prix d'achat", value: formatCurrency(car.purchase_price || 0) },
                          { label: 'Dédouanement', value: formatCurrency(car.clearance_cost || 0) },
                          { label: 'Remorquage', value: formatCurrency(car.towing_cost || 0) },
                          { label: 'Dépenses', value: formatCurrency(car.total_expenses || 0), color: '#f59e0b' }
                        ]}
                      />
                    </div>
                    <span style={{ fontWeight: '700', color: '#dc2626', fontSize: '15px' }}>
                      {formatCurrency(car.total_cost || 0)}
                    </span>
                  </div>

                  {/* Prix de vente (only for sold cars) */}
                  {car.status === 'sold' && car.sale_price && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontSize: '13px' }}>Prix de vente</span>
                      <span style={{ fontWeight: '700', color: '#10b981', fontSize: '15px' }}>
                        {formatCurrency(car.sale_price)}
                      </span>
                    </div>
                  )}

                  {/* Total versé (only for sold cars) */}
                  {car.status === 'sold' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: '#64748b', fontSize: '13px' }}>Total versé</span>
                        {car.payments && car.payments.length > 0 && (
                          <InfoTooltip
                            title={`${car.payments.length} paiement${car.payments.length > 1 ? 's' : ''}`}
                            items={car.payments.slice(0, 5).map(p => ({
                              label: new Date(p.payment_date).toLocaleDateString('fr-FR'),
                              value: formatCurrency(p.amount)
                            })).concat(
                              car.payments.length > 5 ? [{ label: '...et plus', value: '' }] : []
                            )}
                          />
                        )}
                      </div>
                      <span style={{
                        fontWeight: '700',
                        color: car.fully_paid ? '#10b981' : '#f59e0b',
                        fontSize: '15px'
                      }}>
                        {formatCurrency(car.total_paid || 0)}
                        {!car.fully_paid && car.sale_price && (
                          <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '4px' }}>
                            ({car.payment_percentage || 0}%)
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  {/* Profit (only for sold cars) */}
                  {car.status === 'sold' && car.profit !== null && car.profit !== undefined && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '8px',
                      marginTop: '4px',
                      borderTop: '1px dashed #e2e8f0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: '#1e293b', fontSize: '13px', fontWeight: '600' }}>Profit</span>
                        {car.has_profit_share && (
                          <InfoTooltip
                            title="Répartition du profit"
                            items={[
                              { label: 'Profit total', value: formatCurrency(car.profit), color: car.profit >= 0 ? '#10b981' : '#dc2626' },
                              { label: `Part ${car.profit_share_user?.name || 'associé'} (${car.profit_share_percentage}%)`, value: formatCurrency(car.user_profit_amount || 0), color: '#167bff' },
                              { label: 'Part entreprise', value: formatCurrency(car.company_net_profit || 0), color: '#10b981' }
                            ]}
                          />
                        )}
                      </div>
                      <span style={{
                        fontWeight: '700',
                        fontSize: '15px',
                        color: parseFloat(car.profit) >= 0 ? '#10b981' : '#dc2626'
                      }}>
                        {parseFloat(car.profit) >= 0 ? '+' : ''}{formatCurrency(car.profit)}
                      </span>
                    </div>
                  )}

                  {/* Rental income (for cars with rental history) */}
                  {car.has_rental_history && car.total_rental_income > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontSize: '13px' }}>Revenus location</span>
                      <span style={{ fontWeight: '700', color: '#8b5cf6', fontSize: '15px' }}>
                        {formatCurrency(car.total_rental_income)}
                      </span>
                    </div>
                  )}
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
                {canWrite && (
                  car.deleted ? (
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
                  )
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
