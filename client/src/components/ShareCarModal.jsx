import { useState, useEffect } from 'react';
import { carSharesAPI } from '../services/api';
import { useDialog } from '../context/DialogContext';

export default function ShareCarModal({ car, isOpen, onClose }) {
  const { showAlert, showConfirm } = useDialog();
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    show_costs: false,
    show_expenses: false,
    expires_at: ''
  });

  useEffect(() => {
    if (isOpen && car) {
      fetchShares();
    }
  }, [isOpen, car]);

  const fetchShares = async () => {
    try {
      setLoading(true);
      const response = await carSharesAPI.getAll(car.id);
      setShares(response.data);
    } catch (error) {
      console.error('Error fetching shares:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShare = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      const data = {
        car_id: car.id,
        show_costs: formData.show_costs,
        show_expenses: formData.show_expenses,
        expires_at: formData.expires_at || null
      };

      await carSharesAPI.create(data);
      await showAlert('Lien de partage cree avec succes', 'success');
      fetchShares();
      setFormData({ show_costs: false, show_expenses: false, expires_at: '' });
    } catch (error) {
      await showAlert(
        error.response?.data?.errors?.[0] || 'Erreur lors de la creation',
        'error'
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteShare = async (shareId) => {
    const confirmed = await showConfirm(
      'Supprimer ce lien de partage ?',
      'Supprimer le lien'
    );
    if (!confirmed) return;

    try {
      await carSharesAPI.delete(shareId);
      await showAlert('Lien supprime', 'success');
      fetchShares();
    } catch (error) {
      await showAlert('Erreur lors de la suppression', 'error');
    }
  };

  const copyToClipboard = async (token) => {
    const url = `${window.location.origin}/share/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      await showAlert('Lien copie dans le presse-papiers', 'success');
    } catch (error) {
      await showAlert('Erreur lors de la copie', 'error');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div className="flex items-center justify-center min-h-screen p-4">
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-2xl"
          style={{ maxHeight: '90vh', overflowY: 'auto' }}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-xl font-bold" style={{ color: '#1e293b' }}>
              Partager le vehicule
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors"
              style={{ color: '#64748b' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6">
            {/* Create new share form */}
            <form onSubmit={handleCreateShare} className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <h4 className="font-semibold mb-4" style={{ color: '#1e293b' }}>Creer un nouveau lien</h4>

              <div className="mb-4">
                <p className="text-sm mb-2" style={{ color: '#64748b' }}>
                  Sections toujours visibles : Informations du Vehicule, Photos d'Etat Initial, Photos Apres Reparations
                </p>
              </div>

              <div className="space-y-3 mb-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.show_costs}
                    onChange={(e) => setFormData({ ...formData, show_costs: e.target.checked })}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: '#167bff' }}
                  />
                  <span style={{ color: '#1e293b' }}>Afficher le Detail des Couts</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.show_expenses}
                    onChange={(e) => setFormData({ ...formData, show_expenses: e.target.checked })}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: '#167bff' }}
                  />
                  <span style={{ color: '#1e293b' }}>Afficher les Depenses</span>
                </label>
              </div>

              <div className="mb-4">
                <label className="block text-sm mb-2" style={{ color: '#475569' }}>
                  Date d'expiration (optionnel)
                </label>
                <input
                  type="datetime-local"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg transition-colors"
                  style={{ border: '1px solid #e2e8f0', color: '#1e293b' }}
                  onFocus={(e) => e.target.style.borderColor = '#167bff'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full px-4 py-3 rounded-lg font-medium transition-colors text-white"
                style={{ backgroundColor: creating ? '#94a3b8' : '#167bff' }}
                onMouseEnter={(e) => !creating && (e.target.style.backgroundColor = '#0d5dd6')}
                onMouseLeave={(e) => !creating && (e.target.style.backgroundColor = '#167bff')}
              >
                {creating ? 'Creation...' : 'Creer le lien de partage'}
              </button>
            </form>

            {/* Existing shares */}
            <div>
              <h4 className="font-semibold mb-3" style={{ color: '#1e293b' }}>
                Liens existants ({shares.length})
              </h4>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#167bff' }}></div>
                </div>
              ) : shares.length === 0 ? (
                <p className="text-center py-4" style={{ color: '#64748b' }}>Aucun lien de partage</p>
              ) : (
                <div className="space-y-3">
                  {shares.map((share) => (
                    <div
                      key={share.id}
                      className="p-4 rounded-lg"
                      style={{
                        border: '1px solid #e2e8f0',
                        backgroundColor: share.expired ? '#fef2f2' : 'white'
                      }}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs mb-1" style={{ color: '#64748b' }}>
                            Cree le {formatDate(share.created_at)} par {share.created_by.name}
                          </div>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {share.show_costs && (
                              <span className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: '#eff6ff', color: '#1e40af' }}>
                                Couts
                              </span>
                            )}
                            {share.show_expenses && (
                              <span className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: '#eff6ff', color: '#1e40af' }}>
                                Depenses
                              </span>
                            )}
                            {!share.show_costs && !share.show_expenses && (
                              <span className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}>
                                Basique
                              </span>
                            )}
                          </div>
                          <div className="text-xs" style={{ color: '#64748b' }}>
                            <span>{share.view_count} vue(s)</span>
                            {share.expires_at && (
                              <span className="ml-2" style={{ color: share.expired ? '#ef4444' : '#64748b' }}>
                                {share.expired ? 'Expire' : `Expire le ${formatDate(share.expires_at)}`}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => copyToClipboard(share.token)}
                            disabled={share.expired}
                            className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                            style={{
                              backgroundColor: share.expired ? '#e2e8f0' : '#167bff',
                              color: share.expired ? '#94a3b8' : 'white',
                              cursor: share.expired ? 'not-allowed' : 'pointer'
                            }}
                            onMouseEnter={(e) => !share.expired && (e.target.style.backgroundColor = '#0d5dd6')}
                            onMouseLeave={(e) => !share.expired && (e.target.style.backgroundColor = '#167bff')}
                          >
                            Copier
                          </button>
                          <button
                            onClick={() => handleDeleteShare(share.id)}
                            className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                            style={{ backgroundColor: 'white', border: '1px solid #ef4444', color: '#ef4444' }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = '#fef2f2';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = 'white';
                            }}
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
