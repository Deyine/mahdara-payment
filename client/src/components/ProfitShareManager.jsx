import { useState, useEffect } from 'react';
import { useDialog } from '../context/DialogContext';
import { usersAPI, carsAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';

export default function ProfitShareManager({ car, onCarUpdate }) {
  const { showAlert, showConfirm } = useDialog();
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    profit_share_user_id: '',
    profit_share_percentage: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (car.profit_share_user_id) {
      setFormData({
        profit_share_user_id: car.profit_share_user_id.toString(),
        profit_share_percentage: car.profit_share_percentage?.toString() || ''
      });
    }
  }, [car]);

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updateData = {
        profit_share_user_id: formData.profit_share_user_id || null,
        profit_share_percentage: formData.profit_share_percentage ? parseFloat(formData.profit_share_percentage) : 0
      };

      await carsAPI.update(car.id, updateData);
      await showAlert('Partage de bénéfice mis à jour', 'success');
      setShowForm(false);
      onCarUpdate();
    } catch (error) {
      await showAlert(
        error.response?.data?.errors?.[0] || 'Erreur lors de la mise à jour',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveShare = async () => {
    const confirmed = await showConfirm(
      'Supprimer le partage de bénéfice ?',
      'Confirmer la suppression'
    );

    if (!confirmed) return;

    setSaving(true);
    try {
      await carsAPI.update(car.id, {
        profit_share_user_id: null,
        profit_share_percentage: 0
      });
      await showAlert('Partage de bénéfice supprimé', 'success');
      setFormData({ profit_share_user_id: '', profit_share_percentage: '' });
      onCarUpdate();
    } catch (error) {
      await showAlert(
        error.response?.data?.errors?.[0] || 'Erreur lors de la suppression',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    if (car.profit_share_user_id) {
      setFormData({
        profit_share_user_id: car.profit_share_user_id.toString(),
        profit_share_percentage: car.profit_share_percentage?.toString() || ''
      });
    } else {
      setFormData({ profit_share_user_id: '', profit_share_percentage: '' });
    }
  };

  // Only show if there's a profit to share
  if (car.profit === null || car.profit === undefined) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6" style={{ border: '1px solid #e2e8f0' }}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: '#1e293b' }}>
            Partage de Bénéfice
          </h2>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>
            Définir le pourcentage de bénéfice attribué à un utilisateur
          </p>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-lg font-medium transition-colors"
            style={{ backgroundColor: '#eff6ff', color: '#167bff', border: '1px solid #167bff' }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#167bff';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#eff6ff';
              e.target.style.color = '#167bff';
            }}
          >
            {car.has_profit_share ? '✏️ Modifier' : '+ Configurer'}
          </button>
        )}
      </div>

      {/* Current Profit Share Display */}
      {car.has_profit_share && !showForm && (
        <div className="space-y-4">
          {/* User Share Card */}
          <div className="rounded-lg p-4" style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b' }}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium" style={{ color: '#92400e' }}>
                Part de {car.profit_share_user?.name || 'Utilisateur'}
              </span>
              <span className="text-lg font-bold" style={{ color: '#92400e' }}>
                {car.profit_share_percentage}%
              </span>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#d97706' }}>
              {formatCurrency(car.user_profit_amount)}
            </p>
          </div>

          {/* Company Share Card */}
          <div className="rounded-lg p-4" style={{ backgroundColor: '#f0fdf4', border: '1px solid #10b981' }}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium" style={{ color: '#166534' }}>
                Bénéfice Net Entreprise
              </span>
              <span className="text-lg font-bold" style={{ color: '#166534' }}>
                {(100 - car.profit_share_percentage).toFixed(0)}%
              </span>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#10b981' }}>
              {formatCurrency(car.company_net_profit)}
            </p>
          </div>

          {/* Total Profit Reference */}
          <div className="flex justify-between items-center pt-3" style={{ borderTop: '1px solid #e2e8f0' }}>
            <span className="text-sm" style={{ color: '#64748b' }}>
              Bénéfice Total
            </span>
            <span className="font-bold" style={{ color: car.profit >= 0 ? '#10b981' : '#ef4444' }}>
              {car.profit >= 0 ? '+' : ''}{formatCurrency(car.profit)}
            </span>
          </div>
        </div>
      )}

      {/* No Share Configured */}
      {!car.has_profit_share && !showForm && (
        <div className="rounded-lg p-6 text-center" style={{ backgroundColor: '#f1f5f9' }}>
          <p style={{ color: '#64748b' }}>Aucun partage de bénéfice configuré</p>
          <p className="text-sm mt-2" style={{ color: '#94a3b8' }}>
            Le bénéfice total de {formatCurrency(car.profit)} revient entièrement à l'entreprise
          </p>
        </div>
      )}

      {/* Configuration Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#1e293b' }}>
              Utilisateur bénéficiaire
            </label>
            <select
              value={formData.profit_share_user_id}
              onChange={(e) => setFormData({ ...formData, profit_share_user_id: e.target.value })}
              className="w-full px-4 py-3 rounded-lg transition-colors"
              style={{ border: '1px solid #e2e8f0', color: '#1e293b' }}
              onFocus={(e) => e.target.style.borderColor = '#167bff'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            >
              <option value="">Aucun (bénéfice 100% entreprise)</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.username})
                </option>
              ))}
            </select>
          </div>

          {formData.profit_share_user_id && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#1e293b' }}>
                Pourcentage du bénéfice <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.profit_share_percentage}
                  onChange={(e) => setFormData({ ...formData, profit_share_percentage: e.target.value })}
                  required={!!formData.profit_share_user_id}
                  className="flex-1 px-4 py-3 rounded-lg transition-colors text-lg font-medium"
                  style={{ border: '1px solid #e2e8f0', color: '#1e293b' }}
                  onFocus={(e) => e.target.style.borderColor = '#167bff'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  placeholder="0"
                />
                <span className="text-2xl font-bold" style={{ color: '#64748b' }}>%</span>
              </div>

              {/* Preview */}
              {formData.profit_share_percentage && car.profit && (
                <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <p className="text-sm font-medium mb-2" style={{ color: '#64748b' }}>
                    Aperçu du partage
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs" style={{ color: '#94a3b8' }}>Part utilisateur</p>
                      <p className="text-lg font-bold" style={{ color: '#d97706' }}>
                        {formatCurrency((car.profit * parseFloat(formData.profit_share_percentage) / 100))}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: '#94a3b8' }}>Part entreprise</p>
                      <p className="text-lg font-bold" style={{ color: '#10b981' }}>
                        {formatCurrency((car.profit * (100 - parseFloat(formData.profit_share_percentage)) / 100))}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              className="flex-1 px-6 py-3 rounded-lg font-medium transition-colors"
              style={{ backgroundColor: '#fafbfc', border: '1px solid #e2e8f0', color: '#475569' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#fafbfc'}
            >
              Annuler
            </button>
            {car.has_profit_share && (
              <button
                type="button"
                onClick={handleRemoveShare}
                disabled={saving}
                className="px-6 py-3 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: '#fef2f2', border: '1px solid #ef4444', color: '#ef4444' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#ef4444'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#fef2f2'}
              >
                Supprimer
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 rounded-lg font-medium transition-colors text-white"
              style={{ backgroundColor: saving ? '#94a3b8' : '#167bff' }}
              onMouseEnter={(e) => {
                if (!saving) e.target.style.backgroundColor = '#0d5dd6';
              }}
              onMouseLeave={(e) => {
                if (!saving) e.target.style.backgroundColor = '#167bff';
              }}
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
