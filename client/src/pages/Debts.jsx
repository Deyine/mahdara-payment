import { useState, useEffect } from 'react';
import { debtsAPI, usersAPI } from '../services/api';
import { useDialog } from '../context/DialogContext';
import { useAuth } from '../context/AuthContext';

export default function Debts() {
  const [debts, setDebts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [summary, setSummary] = useState({
    total_we_lent: 0,
    total_we_borrowed: 0,
    net_balance: 0
  });

  const [formData, setFormData] = useState({
    debtor_type: 'user',
    user_id: '',
    debtor_name: '',
    direction: 'we_lent',
    amount: '',
    debt_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const { showAlert, showConfirm } = useDialog();
  const { canWrite } = useAuth();

  useEffect(() => {
    fetchDebts();
    fetchUsers();
    fetchSummary();
  }, []);

  const fetchDebts = async () => {
    try {
      setLoading(true);
      const response = await debtsAPI.getAll();
      setDebts(response.data);
    } catch (error) {
      console.error('Error fetching debts:', error);
      await showAlert('Erreur lors du chargement des dettes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await debtsAPI.getSummary();
      setSummary(response.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const handleOpenModal = (debt = null) => {
    if (debt) {
      setEditingDebt(debt);
      setFormData({
        debtor_type: debt.user_id ? 'user' : 'custom',
        user_id: debt.user_id || '',
        debtor_name: debt.debtor_name,
        direction: debt.direction,
        amount: debt.amount.toString(),
        debt_date: debt.debt_date,
        notes: debt.notes || ''
      });
    } else {
      setEditingDebt(null);
      setFormData({
        debtor_type: 'user',
        user_id: '',
        debtor_name: '',
        direction: 'we_lent',
        amount: '',
        debt_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDebt(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Build the debt data
    const debtData = {
      direction: formData.direction,
      amount: parseFloat(formData.amount),
      debt_date: formData.debt_date,
      notes: formData.notes
    };

    // Set debtor_name and user_id based on debtor_type
    if (formData.debtor_type === 'user' && formData.user_id) {
      const selectedUser = users.find(u => u.id === parseInt(formData.user_id));
      debtData.debtor_name = selectedUser ? selectedUser.name : '';
      debtData.user_id = parseInt(formData.user_id);
    } else {
      debtData.debtor_name = formData.debtor_name;
      debtData.user_id = null;
    }

    try {
      if (editingDebt) {
        await debtsAPI.update(editingDebt.id, debtData);
        await showAlert('Dette modifiée avec succès', 'success');
      } else {
        await debtsAPI.create(debtData);
        await showAlert('Dette enregistrée avec succès', 'success');
      }
      handleCloseModal();
      fetchDebts();
      fetchSummary();
    } catch (error) {
      console.error('Error saving debt:', error);
      await showAlert(
        error.response?.data?.errors?.[0] || 'Erreur lors de l\'enregistrement',
        'error'
      );
    }
  };

  const handleDelete = async (debtId) => {
    const confirmed = await showConfirm(
      'Supprimer cette dette ?',
      'Cette action est irréversible.'
    );

    if (confirmed) {
      try {
        await debtsAPI.delete(debtId);
        await showAlert('Dette supprimée avec succès', 'success');
        fetchDebts();
        fetchSummary();
      } catch (error) {
        console.error('Error deleting debt:', error);
        await showAlert('Erreur lors de la suppression', 'error');
      }
    }
  };

  const filteredDebts = debts.filter(debt => {
    if (filter === 'all') return true;
    if (filter === 'we_lent') return debt.direction === 'we_lent';
    if (filter === 'we_borrowed') return debt.direction === 'we_borrowed';
    return true;
  });

  const getDirectionLabel = (direction) => {
    return direction === 'we_lent' ? 'Créance' : 'Dette';
  };

  const getDirectionColor = (direction) => {
    return direction === 'we_lent' ? '#10b981' : '#dc2626';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{ borderColor: '#167bff' }}
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold mb-4 sm:mb-0" style={{ color: '#1e293b' }}>
          Gestion des Dettes
        </h1>
        {canWrite && (
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 rounded-lg text-white font-medium transition-colors"
            style={{ backgroundColor: '#167bff' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0d5fd9'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#167bff'}
          >
            + Nouvelle Entrée
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm mb-1" style={{ color: '#64748b' }}>
            Créances (On nous doit)
          </p>
          <p className="text-2xl font-bold" style={{ color: '#10b981' }}>
            {formatCurrency(summary.total_we_lent)} MRU
          </p>
        </div>

        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-sm mb-1" style={{ color: '#64748b' }}>
            Dettes (Nous devons)
          </p>
          <p className="text-2xl font-bold" style={{ color: '#dc2626' }}>
            {formatCurrency(summary.total_we_borrowed)} MRU
          </p>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm mb-1" style={{ color: '#64748b' }}>
            Solde Net
          </p>
          <p
            className="text-2xl font-bold"
            style={{ color: summary.net_balance >= 0 ? '#10b981' : '#dc2626' }}
          >
            {formatCurrency(summary.net_balance)} MRU
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 border-b" style={{ borderColor: '#e2e8f0' }}>
        <button
          onClick={() => setFilter('all')}
          className="px-4 py-2 font-medium transition-colors"
          style={{
            color: filter === 'all' ? '#167bff' : '#64748b',
            borderBottom: filter === 'all' ? '2px solid #167bff' : '2px solid transparent'
          }}
        >
          Tout ({debts.length})
        </button>
        <button
          onClick={() => setFilter('we_lent')}
          className="px-4 py-2 font-medium transition-colors"
          style={{
            color: filter === 'we_lent' ? '#10b981' : '#64748b',
            borderBottom: filter === 'we_lent' ? '2px solid #10b981' : '2px solid transparent'
          }}
        >
          Créances ({debts.filter(d => d.direction === 'we_lent').length})
        </button>
        <button
          onClick={() => setFilter('we_borrowed')}
          className="px-4 py-2 font-medium transition-colors"
          style={{
            color: filter === 'we_borrowed' ? '#dc2626' : '#64748b',
            borderBottom: filter === 'we_borrowed' ? '2px solid #dc2626' : '2px solid transparent'
          }}
        >
          Dettes ({debts.filter(d => d.direction === 'we_borrowed').length})
        </button>
      </div>

      {/* Debts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: '#f8fafc' }}>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#64748b' }}>
                  Nom
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#64748b' }}>
                  Direction
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium" style={{ color: '#64748b' }}>
                  Montant
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium hidden md:table-cell" style={{ color: '#64748b' }}>
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium hidden lg:table-cell" style={{ color: '#64748b' }}>
                  Notes
                </th>
                {canWrite && (
                  <th className="px-4 py-3 text-center text-xs font-medium" style={{ color: '#64748b' }}>
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#e2e8f0' }}>
              {filteredDebts.length === 0 ? (
                <tr>
                  <td colSpan={canWrite ? 6 : 5} className="px-4 py-8 text-center" style={{ color: '#64748b' }}>
                    Aucune dette enregistrée
                  </td>
                </tr>
              ) : (
                filteredDebts.map((debt) => (
                  <tr key={debt.id} style={{ backgroundColor: 'white' }}>
                    <td className="px-4 py-3">
                      <span className="font-medium" style={{ color: '#1e293b' }}>
                        {debt.debtor_name}
                      </span>
                      {debt.user && (
                        <span className="text-xs ml-2" style={{ color: '#64748b' }}>
                          (@{debt.user.username})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{
                          backgroundColor: debt.direction === 'we_lent' ? '#d1fae5' : '#fee2e2',
                          color: getDirectionColor(debt.direction)
                        }}
                      >
                        {getDirectionLabel(debt.direction)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold" style={{ color: getDirectionColor(debt.direction) }}>
                        {formatCurrency(debt.amount)} MRU
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm" style={{ color: '#64748b' }}>
                        {new Date(debt.debt_date).toLocaleDateString('fr-FR')}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm" style={{ color: '#64748b' }}>
                        {debt.notes || '--'}
                      </span>
                    </td>
                    {canWrite && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenModal(debt)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDelete(debt.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4" style={{ color: '#1e293b' }}>
                {editingDebt ? 'Modifier la Dette' : 'Nouvelle Dette'}
              </h2>

              <form onSubmit={handleSubmit}>
                {/* Debtor Type Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2" style={{ color: '#1e293b' }}>
                    Type <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="user"
                        checked={formData.debtor_type === 'user'}
                        onChange={(e) => setFormData({ ...formData, debtor_type: e.target.value, debtor_name: '' })}
                        className="mr-2"
                      />
                      <span className="text-sm" style={{ color: '#1e293b' }}>Utilisateur</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="custom"
                        checked={formData.debtor_type === 'custom'}
                        onChange={(e) => setFormData({ ...formData, debtor_type: e.target.value, user_id: '' })}
                        className="mr-2"
                      />
                      <span className="text-sm" style={{ color: '#1e293b' }}>Autre personne</span>
                    </label>
                  </div>
                </div>

                {/* User Selection or Custom Name */}
                {formData.debtor_type === 'user' ? (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1" style={{ color: '#1e293b' }}>
                      Utilisateur <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.user_id}
                      onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                      className="w-full px-3 py-2 rounded"
                      style={{ border: '1px solid #cbd5e1' }}
                      required
                    >
                      <option value="">-- Sélectionner --</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name} (@{user.username})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1" style={{ color: '#1e293b' }}>
                      Nom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.debtor_name}
                      onChange={(e) => setFormData({ ...formData, debtor_name: e.target.value })}
                      className="w-full px-3 py-2 rounded"
                      style={{ border: '1px solid #cbd5e1' }}
                      placeholder="Ex: Ahmed Mohamed"
                      required
                    />
                  </div>
                )}

                {/* Direction */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2" style={{ color: '#1e293b' }}>
                    Direction <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center p-3 rounded" style={{ border: '1px solid #cbd5e1' }}>
                      <input
                        type="radio"
                        value="we_lent"
                        checked={formData.direction === 'we_lent'}
                        onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium" style={{ color: '#10b981' }}>Nous avons prêté</div>
                        <div className="text-xs" style={{ color: '#64748b' }}>Cette personne nous doit de l'argent</div>
                      </div>
                    </label>
                    <label className="flex items-center p-3 rounded" style={{ border: '1px solid #cbd5e1' }}>
                      <input
                        type="radio"
                        value="we_borrowed"
                        checked={formData.direction === 'we_borrowed'}
                        onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium" style={{ color: '#dc2626' }}>On nous a prêté</div>
                        <div className="text-xs" style={{ color: '#64748b' }}>Nous devons de l'argent à cette personne</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Amount */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1" style={{ color: '#1e293b' }}>
                    Montant (MRU) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 rounded"
                    style={{ border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>

                {/* Date */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1" style={{ color: '#1e293b' }}>
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.debt_date}
                    onChange={(e) => setFormData({ ...formData, debt_date: e.target.value })}
                    className="w-full px-3 py-2 rounded"
                    style={{ border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>

                {/* Notes */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1" style={{ color: '#1e293b' }}>
                    Notes (optionnel)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded"
                    style={{ border: '1px solid #cbd5e1' }}
                    rows="3"
                    placeholder="Ex: Avance sur salaire, Prêt pour achat véhicule..."
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors"
                    style={{ backgroundColor: '#f1f5f9', color: '#1e293b' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 rounded-lg font-medium text-white transition-colors"
                    style={{ backgroundColor: '#167bff' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0d5fd9'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#167bff'}
                  >
                    {editingDebt ? 'Modifier' : 'Créer'}
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
