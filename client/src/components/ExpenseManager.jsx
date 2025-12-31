import { useState, useEffect } from 'react';
import { expenseCategoriesAPI } from '../services/api';
import { useDialog } from '../context/DialogContext';
import { formatCurrency } from '../utils/formatters';

export default function ExpenseManager({ expenses, carId, onExpenseChange }) {
  const { showAlert, showConfirm } = useDialog();
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formData, setFormData] = useState({
    expense_category_id: '',
    amount: '',
    description: '',
    expense_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchExpenseCategories();
  }, []);

  const fetchExpenseCategories = async () => {
    try {
      const response = await expenseCategoriesAPI.getActive();
      setExpenseCategories(response.data);
    } catch (error) {
      console.error('Error fetching expense categories:', error);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingExpense(null);
    setFormData({
      expense_category_id: '',
      amount: '',
      description: '',
      expense_date: new Date().toISOString().split('T')[0]
    });
  };

  const handleAddExpense = () => {
    setEditingExpense(null);
    setFormData({
      expense_category_id: '',
      amount: '',
      description: '',
      expense_date: new Date().toISOString().split('T')[0]
    });
    setShowForm(true);
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setFormData({
      expense_category_id: expense.expense_category_id,
      amount: expense.amount,
      description: expense.description || '',
      expense_date: expense.expense_date
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const expenseData = {
      ...formData,
      car_id: carId,
      amount: parseFloat(formData.amount)
    };

    try {
      if (editingExpense) {
        // Update existing expense
        await onExpenseChange('update', editingExpense.id, expenseData);
        await showAlert('Dépense modifiée avec succès', 'success');
      } else {
        // Create new expense
        await onExpenseChange('create', null, expenseData);
        await showAlert('Dépense ajoutée avec succès', 'success');
      }
      resetForm();
    } catch (error) {
      await showAlert(
        error.response?.data?.errors?.[0] || 'Erreur lors de l\'enregistrement',
        'error'
      );
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    const confirmed = await showConfirm(
      'Êtes-vous sûr de vouloir supprimer cette dépense ?',
      'Supprimer la dépense'
    );

    if (!confirmed) return;

    try {
      await onExpenseChange('delete', expenseId);
      await showAlert('Dépense supprimée avec succès', 'success');
    } catch (error) {
      await showAlert(
        error.response?.data?.error || 'Erreur lors de la suppression',
        'error'
      );
    }
  };


  const getExpenseTypeBadge = (expenseType) => {
    if (expenseType === 'reparation') {
      return {
        label: 'Réparation',
        backgroundColor: '#fef3c7',
        color: '#92400e'
      };
    } else {
      return {
        label: 'Achat',
        backgroundColor: '#dbeafe',
        color: '#1e40af'
      };
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6" style={{ border: '1px solid #e2e8f0' }}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold" style={{ color: '#1e293b' }}>
          Dépenses ({expenses.length})
        </h2>
        <button
          onClick={handleAddExpense}
          className="px-4 py-2 rounded-lg font-medium transition-colors text-white"
          style={{ backgroundColor: '#10b981' }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
        >
          + Ajouter une Dépense
        </button>
      </div>

      {expenses.length === 0 ? (
        <div
          className="rounded-lg p-8 text-center"
          style={{ backgroundColor: '#f1f5f9', border: '2px dashed #cbd5e1' }}
        >
          <p style={{ color: '#64748b' }}>
            Aucune dépense enregistrée pour ce véhicule
          </p>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '8px' }}>
            Cliquez sur "Ajouter une Dépense" pour commencer
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map((expense) => {
            const badge = getExpenseTypeBadge(expense.expense_category?.expense_type);
            return (
              <div
                key={expense.id}
                className="flex items-center justify-between p-4 rounded-lg transition-colors"
                style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
              >
                <div className="flex-1 grid grid-cols-4 gap-4 items-center">
                  <div>
                    <p className="text-sm" style={{ color: '#64748b' }}>Date</p>
                    <p className="font-medium" style={{ color: '#1e293b' }}>
                      {new Date(expense.expense_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm mb-1" style={{ color: '#64748b' }}>Catégorie</p>
                    <span
                      className="px-3 py-1 rounded-full text-sm font-medium inline-block"
                      style={{
                        backgroundColor: badge.backgroundColor,
                        color: badge.color
                      }}
                    >
                      {expense.expense_category?.name}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm" style={{ color: '#64748b' }}>Description</p>
                    <p className="font-medium" style={{ color: '#1e293b' }}>
                      {expense.description || '-'}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm" style={{ color: '#64748b' }}>Montant</p>
                    <p className="text-xl font-bold" style={{ color: '#167bff' }}>
                      {formatCurrency(expense.amount)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEditExpense(expense)}
                    className="p-2 rounded-lg transition-colors"
                    style={{ backgroundColor: 'white', border: '1px solid #167bff', color: '#167bff' }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#167bff';
                      e.target.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'white';
                      e.target.style.color = '#167bff';
                    }}
                    title="Modifier"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteExpense(expense.id)}
                    className="p-2 rounded-lg transition-colors"
                    style={{ backgroundColor: 'white', border: '1px solid #ef4444', color: '#ef4444' }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#ef4444';
                      e.target.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'white';
                      e.target.style.color = '#ef4444';
                    }}
                    title="Supprimer"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Expense Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="bg-white rounded-lg shadow-xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: '#e2e8f0' }}>
                <h3 className="text-xl font-bold" style={{ color: '#1e293b' }}>
                  {editingExpense ? 'Modifier la Dépense' : 'Nouvelle Dépense'}
                </h3>
                <button onClick={resetForm} className="p-1 rounded-lg transition-colors hover:bg-gray-100">
                  <svg className="h-6 w-6" style={{ color: '#64748b' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#475569' }}>
                    Catégorie de Dépense *
                  </label>
                  <select
                    value={formData.expense_category_id}
                    onChange={(e) => setFormData({ ...formData, expense_category_id: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-lg transition-colors"
                    style={{ border: '1px solid #e2e8f0', color: '#1e293b' }}
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {expenseCategories.map((category) => {
                      const badge = getExpenseTypeBadge(category.expense_type);
                      return (
                        <option key={category.id} value={category.id}>
                          [{badge.label}] {category.name}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#475569' }}>
                    Montant (MRU) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-lg transition-colors"
                    style={{ border: '1px solid #e2e8f0', color: '#1e293b' }}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#475569' }}>
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-lg transition-colors"
                    style={{ border: '1px solid #e2e8f0', color: '#1e293b' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#475569' }}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-3 rounded-lg transition-colors"
                    style={{ border: '1px solid #e2e8f0', color: '#1e293b' }}
                    placeholder="Détails de la dépense (optionnel)"
                  />
                </div>

                {/* Form actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
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
                    style={{ backgroundColor: '#167bff' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#0d5dd6'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#167bff'}
                  >
                    {editingExpense ? 'Modifier' : 'Créer'}
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
