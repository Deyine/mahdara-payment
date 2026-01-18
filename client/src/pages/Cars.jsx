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
  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all', 'fully_paid', 'in_progress', 'not_sold', 'rental'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
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
      if (paymentFilter === 'not_sold' && (car.status === 'sold' || car.status === 'rental')) return false;
      if (paymentFilter === 'rental' && car.status !== 'rental') return false;
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
    <div className="page-container" style={{ padding: '20px', overflowX: 'hidden' }}>
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
          .page-container {
            padding: 12px !important;
          }
        }
      `}</style>
      <div className="mb-5">
        <h1 className="text-2xl font-bold mb-4" style={{ color: '#1e293b' }}>
          Véhicules
        </h1>
        {/* Action buttons - stack on mobile */}
        <div className="flex flex-wrap gap-2">
          {canWrite && (
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
          )}
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

      {/* Search Bar and View Toggle */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Rechercher par VIN, modèle, couleur, vendeur..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid #ddd',
            fontSize: '14px'
          }}
        />
        {/* View Toggle */}
        <div style={{
          display: 'flex',
          backgroundColor: '#f1f5f9',
          borderRadius: '8px',
          padding: '4px'
        }}>
          <button
            onClick={() => setViewMode('grid')}
            title="Vue grille"
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: viewMode === 'grid' ? 'white' : 'transparent',
              color: viewMode === 'grid' ? '#167bff' : '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: viewMode === 'grid' ? '600' : '400',
              boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            <span className="hidden sm:inline">Grille</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            title="Vue liste paiements"
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: viewMode === 'list' ? 'white' : 'transparent',
              color: viewMode === 'list' ? '#167bff' : '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: viewMode === 'list' ? '600' : '400',
              boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <circle cx="4" cy="6" r="1.5" fill="currentColor" />
              <circle cx="4" cy="12" r="1.5" fill="currentColor" />
              <circle cx="4" cy="18" r="1.5" fill="currentColor" />
            </svg>
            <span className="hidden sm:inline">Paiements</span>
          </button>
        </div>
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
          onClick={() => setPaymentFilter('rental')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: paymentFilter === 'rental' ? 'none' : '1px solid #e5e7eb',
            backgroundColor: paymentFilter === 'rental' ? '#f59e0b' : 'white',
            color: paymentFilter === 'rental' ? 'white' : '#475569',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s'
          }}
        >
          En Location
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
      ) : viewMode === 'list' ? (
        /* Payment-Focused List View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* List Header */}
          <div
            className="hidden sm:flex"
            style={{
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            <div style={{ flex: 2 }}>Véhicule</div>
            <div style={{ width: '110px', textAlign: 'right' }}>Prix de vente</div>
            <div style={{ width: '110px', textAlign: 'right' }}>Payé</div>
            <div style={{ width: '130px', textAlign: 'right' }}>Reste</div>
            <div style={{ width: '80px', textAlign: 'center' }}>Actions</div>
          </div>

          {/* List Items */}
          {filteredCars.map((car) => {
            const paymentPercent = car.status === 'sold' && car.sale_price > 0
              ? Math.min(100, Math.round((car.total_paid / car.sale_price) * 100))
              : 0;

            return (
              <div
                key={car.id}
                onClick={(e) => {
                  // Only trigger on mobile and if not clicking on action buttons
                  if (window.innerWidth < 640 && !e.target.closest('button')) {
                    handleView(car);
                  }
                }}
                className="sm:cursor-default"
                style={{
                  backgroundColor: car.deleted ? '#fef2f2' : 'white',
                  borderRadius: '8px',
                  padding: '16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  border: car.deleted ? '2px solid #dc2626' : '1px solid #e5e7eb',
                  opacity: car.deleted ? 0.7 : 1,
                  position: 'relative',
                  cursor: window.innerWidth < 640 ? 'pointer' : 'default',
                  transition: 'transform 0.15s ease'
                }}
                onTouchStart={(e) => {
                  if (window.innerWidth < 640 && !e.target.closest('button')) {
                    e.currentTarget.style.transform = 'scale(0.98)';
                  }
                }}
                onTouchEnd={(e) => {
                  if (window.innerWidth < 640) {
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                {/* Mobile: Chevron indicator */}
                <div
                  className="flex sm:hidden"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    right: '12px',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                    pointerEvents: 'none',
                    zIndex: 0
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  {/* Vehicle Info */}
                  <div style={{ flex: 2, paddingRight: '60px' }} className="sm:pr-0">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {/* Small thumbnail */}
                      {car.salvage_photos && car.salvage_photos.length > 0 ? (
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          flexShrink: 0
                        }}>
                          <img
                            src={car.salvage_photos[0].url}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      ) : (
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '6px',
                          backgroundColor: '#f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          color: '#94a3b8',
                          fontSize: '18px'
                        }}>
                          🚗
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {car.display_name || car.car_model?.name || 'N/A'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {car.vin}
                        </div>
                        {/* Status badge and tags - inline */}
                        <div style={{ marginTop: '2px', display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
                          {car.deleted && (
                            <span style={{
                              backgroundColor: '#dc2626',
                              color: 'white',
                              padding: '1px 5px',
                              borderRadius: '3px',
                              fontSize: '9px',
                              fontWeight: 'bold'
                            }}>
                              SUPPRIMÉ
                            </span>
                          )}
                          {car.status === 'sold' && !car.deleted && (
                            <span style={{
                              backgroundColor: car.fully_paid ? '#dcfce7' : '#fef3c7',
                              color: car.fully_paid ? '#166534' : '#92400e',
                              padding: '1px 5px',
                              borderRadius: '3px',
                              fontSize: '9px',
                              fontWeight: '600'
                            }}>
                              {car.fully_paid ? '✓ PAYÉ' : '⏳ EN COURS'}
                            </span>
                          )}
                          {car.status === 'rental' && !car.deleted && (
                            <span style={{
                              backgroundColor: '#fef3c7',
                              color: '#92400e',
                              padding: '1px 5px',
                              borderRadius: '3px',
                              fontSize: '9px',
                              fontWeight: '600'
                            }}>
                              LOCATION
                            </span>
                          )}
                          {car.status !== 'sold' && car.status !== 'rental' && !car.deleted && (
                            <span style={{
                              backgroundColor: '#f1f5f9',
                              color: '#64748b',
                              padding: '1px 5px',
                              borderRadius: '3px',
                              fontSize: '9px',
                              fontWeight: '600'
                            }}>
                              EN STOCK
                            </span>
                          )}
                          {/* Tags */}
                          {car.tags && car.tags.length > 0 && car.tags.map((tag) => (
                            <span
                              key={tag.id}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '1px 5px',
                                borderRadius: '3px',
                                fontSize: '9px',
                                fontWeight: '500',
                                backgroundColor: `${tag.color}20`,
                                color: tag.color,
                                border: `1px solid ${tag.color}40`
                              }}
                            >
                              <div style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: tag.color
                              }} />
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mobile: Financial summary in a row */}
                  <div className="flex sm:hidden" style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '6px',
                    padding: '10px',
                    gap: '8px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>Vente</div>
                      <div style={{ fontWeight: '600', fontSize: '13px', color: car.status === 'sold' ? '#1e293b' : '#94a3b8' }}>
                        {car.status === 'sold' ? formatCurrency(car.sale_price) : '-'}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>Payé</div>
                      <div style={{ fontWeight: '600', fontSize: '13px', color: car.total_paid > 0 ? '#10b981' : '#94a3b8' }}>
                        {car.status === 'sold' ? formatCurrency(car.total_paid || 0) : '-'}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>Reste</div>
                      <div style={{ fontWeight: '600', fontSize: '13px', color: car.remaining_balance > 0 ? '#dc2626' : '#10b981' }}>
                        {car.status === 'sold' ? (
                          <span>
                            {car.fully_paid ? '0' : formatCurrency(car.remaining_balance)}
                            <span style={{
                              marginLeft: '4px',
                              fontSize: '11px',
                              color: paymentPercent === 100 ? '#10b981' : '#f59e0b',
                              fontWeight: '500'
                            }}>
                              ({paymentPercent}%)
                            </span>
                          </span>
                        ) : '-'}
                      </div>
                    </div>
                  </div>

                  {/* Desktop: Sale Price */}
                  <div className="hidden sm:block" style={{ width: '110px', textAlign: 'right' }}>
                    {car.status === 'sold' ? (
                      <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>
                        {formatCurrency(car.sale_price)}
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '13px' }}>-</span>
                    )}
                  </div>

                  {/* Desktop: Total Paid */}
                  <div className="hidden sm:block" style={{ width: '110px', textAlign: 'right' }}>
                    {car.status === 'sold' ? (
                      <span style={{ fontWeight: '600', color: '#10b981', fontSize: '14px' }}>
                        {formatCurrency(car.total_paid || 0)}
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '13px' }}>-</span>
                    )}
                  </div>

                  {/* Desktop: Remaining with mini progress bar */}
                  <div className="hidden sm:block" style={{ width: '130px', textAlign: 'right' }}>
                    {car.status === 'sold' ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          <span style={{
                            fontWeight: '600',
                            color: car.fully_paid ? '#10b981' : '#dc2626',
                            fontSize: '14px'
                          }}>
                            {car.fully_paid ? '0' : formatCurrency(car.remaining_balance)}
                          </span>
                          <span style={{
                            fontSize: '11px',
                            color: paymentPercent === 100 ? '#10b981' : '#f59e0b',
                            fontWeight: '500'
                          }}>
                            {paymentPercent}%
                          </span>
                        </div>
                        {/* Mini progress bar */}
                        <div style={{
                          marginTop: '4px',
                          height: '4px',
                          backgroundColor: '#e5e7eb',
                          borderRadius: '2px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${paymentPercent}%`,
                            backgroundColor: paymentPercent === 100 ? '#10b981' : '#f59e0b',
                            borderRadius: '2px',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>
                    ) : (
                      <span style={{
                        fontSize: '11px',
                        color: '#94a3b8',
                        backgroundColor: '#f1f5f9',
                        padding: '2px 6px',
                        borderRadius: '3px'
                      }}>
                        {car.status === 'rental' ? 'Location' : 'Non vendu'}
                      </span>
                    )}
                  </div>

                  {/* Desktop Actions */}
                  <div className="hidden sm:flex" style={{ width: '80px', justifyContent: 'center', gap: '6px' }}>
                    <button
                      onClick={() => handleView(car)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '5px',
                        border: 'none',
                        backgroundColor: '#167bff',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                    >
                      Voir
                    </button>
                    {canWrite && !car.deleted && (
                      <button
                        onClick={() => handleDelete(car.id)}
                        style={{
                          padding: '6px 8px',
                          borderRadius: '5px',
                          border: '1px solid #e5e7eb',
                          backgroundColor: 'white',
                          color: '#dc2626',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        🗑️
                      </button>
                    )}
                    {canWrite && car.deleted && (
                      <button
                        onClick={() => handleRestore(car.id)}
                        style={{
                          padding: '6px 8px',
                          borderRadius: '5px',
                          border: '1px solid #10b981',
                          backgroundColor: 'white',
                          color: '#10b981',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ↶
                      </button>
                    )}
                  </div>

                  {/* Mobile: Delete/Restore button (smaller, icon-only in corner near Voir) */}
                  {canWrite && (
                    <button
                      onClick={() => car.deleted ? handleRestore(car.id) : handleDelete(car.id)}
                      className="flex sm:hidden"
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '80px',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: `1px solid ${car.deleted ? '#10b981' : '#e5e7eb'}`,
                        backgroundColor: 'white',
                        color: car.deleted ? '#10b981' : '#dc2626',
                        cursor: 'pointer',
                        fontSize: '14px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        zIndex: 1
                      }}
                    >
                      {car.deleted ? '↶' : '🗑️'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Grid View (Original) */
        <div className="cars-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))',
          gap: '16px'
        }}>
          {filteredCars.map((car) => (
            <div
              key={car.id}
              style={{
                backgroundColor: car.deleted ? '#fef2f2' : 'white',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: car.deleted ? '2px solid #dc2626' : '1px solid #e5e7eb',
                opacity: car.deleted ? 0.7 : 1,
                overflow: 'visible'
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
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', fontSize: '13px', color: '#64748b', flexWrap: 'wrap' }}>
                  <span>{car.year}</span>
                  {car.color && <span>• {car.color}</span>}
                  {car.mileage && <span>• {car.mileage.toLocaleString()} km</span>}
                </div>

                {/* Financial summary with tooltips */}
                <div style={{
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  {/* Prix de revient with tooltip */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: '#64748b', fontSize: '12px' }}>Prix de revient</span>
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
                    <span style={{ fontWeight: '700', color: '#dc2626', fontSize: '14px' }}>
                      {formatCurrency(car.total_cost || 0)}
                    </span>
                  </div>

                  {/* Prix de vente (only for sold cars) */}
                  {car.status === 'sold' && car.sale_price && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                      <span style={{ color: '#64748b', fontSize: '12px' }}>Prix de vente</span>
                      <span style={{ fontWeight: '700', color: '#10b981', fontSize: '14px' }}>
                        {formatCurrency(car.sale_price)}
                      </span>
                    </div>
                  )}

                  {/* Total versé (only for sold cars) */}
                  {car.status === 'sold' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: '#64748b', fontSize: '12px' }}>Total versé</span>
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
                        fontSize: '14px'
                      }}>
                        {formatCurrency(car.total_paid || 0)}
                        {!car.fully_paid && car.sale_price && (
                          <span style={{ fontSize: '10px', color: '#64748b', marginLeft: '4px' }}>
                            ({car.payment_percentage || 0}%)
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  {/* Reste à payer (only for sold cars not fully paid) */}
                  {car.status === 'sold' && !car.fully_paid && car.remaining_balance > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                      <span style={{ color: '#64748b', fontSize: '12px' }}>Reste à payer</span>
                      <span style={{
                        fontWeight: '700',
                        color: '#dc2626',
                        fontSize: '14px'
                      }}>
                        {formatCurrency(car.remaining_balance)}
                      </span>
                    </div>
                  )}

                  {/* Profit (only for sold cars) */}
                  {car.status === 'sold' && car.profit !== null && car.profit !== undefined && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '4px',
                      paddingTop: '6px',
                      marginTop: '4px',
                      borderTop: '1px dashed #e2e8f0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: '#1e293b', fontSize: '12px', fontWeight: '600' }}>Profit</span>
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
                        fontSize: '14px',
                        color: parseFloat(car.profit) >= 0 ? '#10b981' : '#dc2626'
                      }}>
                        {parseFloat(car.profit) >= 0 ? '+' : ''}{formatCurrency(car.profit)}
                      </span>
                    </div>
                  )}

                  {/* Rental income (for cars with rental history) */}
                  {car.has_rental_history && car.total_rental_income > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                      <span style={{ color: '#64748b', fontSize: '12px' }}>Revenus location</span>
                      <span style={{ fontWeight: '700', color: '#8b5cf6', fontSize: '14px' }}>
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
