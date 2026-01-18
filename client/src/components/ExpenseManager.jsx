import { useState, useEffect } from 'react';
import { expenseCategoriesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';
import { formatCurrency } from '../utils/formatters';

export default function ExpenseManager({ expenses, carId, onExpenseChange }) {
  const { canWrite } = useAuth();
  const { showAlert, showConfirm } = useDialog();
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState({
    expense_category_id: '',
    amount: '',
    description: '',
    expense_date: new Date().toISOString().split('T')[0]
  });
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

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
    setCategorySearch('');
    setShowCategoryDropdown(false);
  };

  const handleAddExpense = () => {
    setEditingExpense(null);
    setFormData({
      expense_category_id: '',
      amount: '',
      description: '',
      expense_date: new Date().toISOString().split('T')[0]
    });
    setCategorySearch('');
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
    setCategorySearch(expense.expense_category?.name || '');
    setShowForm(true);
  };

  const getSelectedCategory = () => {
    return expenseCategories.find(cat => cat.id === formData.expense_category_id);
  };

  const getFilteredCategories = () => {
    if (!categorySearch) return expenseCategories;
    const searchLower = categorySearch.toLowerCase();
    return expenseCategories.filter(category =>
      category.name.toLowerCase().includes(searchLower)
    );
  };

  const handleCategorySelect = (category) => {
    setFormData({ ...formData, expense_category_id: category.id });
    setCategorySearch(category.name);
    setShowCategoryDropdown(false);
  };

  const handleCategorySearchChange = (e) => {
    setCategorySearch(e.target.value);
    setShowCategoryDropdown(true);
    // Clear selection if user modifies search
    if (formData.expense_category_id) {
      const selectedCat = getSelectedCategory();
      if (selectedCat && e.target.value !== selectedCat.name) {
        setFormData({ ...formData, expense_category_id: '' });
      }
    }
  };

  const parseAmount = (amountStr) => {
    if (!amountStr) return 0;

    // Convert to string and trim
    let cleaned = String(amountStr).trim();

    // Remove all spaces
    cleaned = cleaned.replace(/\s/g, '');

    // Determine decimal separator: the last comma or period is the decimal separator
    const lastComma = cleaned.lastIndexOf(',');
    const lastPeriod = cleaned.lastIndexOf('.');

    // Special case: if there's only one separator followed by exactly 3 digits, it's a thousand separator
    // Examples: 15.000 or 15,000 should be 15000, not 15.0
    const afterLastSeparator = Math.max(lastComma, lastPeriod);
    if (afterLastSeparator !== -1) {
      const digitsAfter = cleaned.length - afterLastSeparator - 1;
      if (digitsAfter === 3 && (cleaned.match(/[.,]/g) || []).length === 1) {
        // Single separator with exactly 3 digits after = thousand separator
        cleaned = cleaned.replace(/[.,]/g, '');
        return parseFloat(cleaned) || 0;
      }
    }

    if (lastComma > lastPeriod) {
      // Comma is decimal separator (European format: 15.000,50)
      cleaned = cleaned.replace(/\./g, ''); // Remove thousand separators (periods)
      cleaned = cleaned.replace(',', '.'); // Replace decimal comma with period
    } else if (lastPeriod > lastComma) {
      // Period is decimal separator (US format: 15,000.50)
      cleaned = cleaned.replace(/,/g, ''); // Remove thousand separators (commas)
    } else if (lastComma !== -1) {
      // Only comma exists, treat as decimal
      cleaned = cleaned.replace(',', '.');
    }
    // If only period exists, it's already in the correct format

    return parseFloat(cleaned) || 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const expenseData = {
      ...formData,
      car_id: carId,
      amount: parseAmount(formData.amount)
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

  const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6" style={{ border: '1px solid #e2e8f0' }}>
      {/* Header with toggle */}
      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-lg sm:text-xl font-bold" style={{ color: '#1e293b' }}>
              Dépenses ({expenses.length})
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {canWrite && (
              <button
                onClick={handleAddExpense}
                className="px-3 py-2 sm:px-4 rounded-lg font-medium transition-colors text-white text-sm sm:text-base"
                style={{ backgroundColor: '#10b981' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
              >
                <span className="hidden sm:inline">+ Ajouter</span>
                <span className="sm:hidden">+</span>
              </button>
            )}
            {expenses.length > 0 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 rounded-lg transition-colors"
                style={{ color: '#64748b' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <svg
                  className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Summary - Always visible */}
        {expenses.length === 0 ? (
          <div
            className="rounded-lg p-6 sm:p-8 text-center"
            style={{ backgroundColor: '#f1f5f9', border: '2px dashed #cbd5e1' }}
          >
            <p style={{ color: '#64748b' }}>
              Aucune dépense enregistrée pour ce véhicule
            </p>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '8px' }}>
              Cliquez sur "Ajouter" pour commencer
            </p>
          </div>
        ) : (
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm mb-1" style={{ color: '#64748b' }}>
              Total des Dépenses
            </p>
            <p className="text-xl sm:text-2xl font-bold" style={{ color: '#167bff' }}>
              {formatCurrency(totalExpenses)} MRU
            </p>
          </div>
        )}
      </div>

      {/* Expandable expense list */}
      {isExpanded && expenses.length > 0 && (
        <div className="border-t" style={{ borderColor: '#e2e8f0' }}>
          <div className="p-4 sm:p-6 space-y-2">
            {expenses.map((expense) => {
            const badge = getExpenseTypeBadge(expense.expense_category?.expense_type);
            return (
              <div
                key={expense.id}
                className="p-3 sm:p-4 rounded-lg transition-colors"
                style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
              >
                {/* Mobile Layout */}
                <div className="flex sm:hidden flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs" style={{ color: '#64748b' }}>
                        {new Date(expense.expense_date).toLocaleDateString('fr-FR')}
                      </p>
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium inline-block mt-1"
                        style={{
                          backgroundColor: badge.backgroundColor,
                          color: badge.color
                        }}
                      >
                        {expense.expense_category?.name}
                      </span>
                    </div>
                    <p className="text-base font-bold" style={{ color: '#167bff' }}>
                      {formatCurrency(expense.amount)}
                    </p>
                  </div>
                  {expense.description && (
                    <p className="text-xs" style={{ color: '#64748b' }}>
                      {expense.description}
                    </p>
                  )}
                  {canWrite && (
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() => handleEditExpense(expense)}
                        className="flex-1 py-1.5 rounded text-xs font-medium transition-colors"
                        style={{ backgroundColor: 'white', border: '1px solid #167bff', color: '#167bff' }}
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="flex-1 py-1.5 rounded text-xs font-medium transition-colors"
                        style={{ backgroundColor: 'white', border: '1px solid #ef4444', color: '#ef4444' }}
                      >
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>

                {/* Desktop Layout */}
                <div className="hidden sm:flex items-center justify-between">
                  <div className="flex-1 grid grid-cols-4 gap-4 items-center">
                    <div>
                      <p className="text-sm" style={{ color: '#64748b' }}>Date</p>
                      <p className="font-medium text-sm" style={{ color: '#1e293b' }}>
                        {new Date(expense.expense_date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm mb-1" style={{ color: '#64748b' }}>Catégorie</p>
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-medium inline-block"
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
                      <p className="font-medium text-sm" style={{ color: '#1e293b' }}>
                        {expense.description || '-'}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm" style={{ color: '#64748b' }}>Montant</p>
                      <p className="text-lg font-bold" style={{ color: '#167bff' }}>
                        {formatCurrency(expense.amount)}
                      </p>
                    </div>
                  </div>

                  {canWrite && (
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
                  )}
                </div>
              </div>
            );
          })}
          </div>
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
                <div className="relative">
                  <label className="block text-sm font-medium mb-2" style={{ color: '#475569' }}>
                    Catégorie de Dépense *
                  </label>
                  <input
                    type="text"
                    value={categorySearch}
                    onChange={handleCategorySearchChange}
                    onFocus={() => setShowCategoryDropdown(true)}
                    onBlur={() => {
                      // Delay to allow click on dropdown item
                      setTimeout(() => setShowCategoryDropdown(false), 200);
                    }}
                    required
                    className="w-full px-4 py-3 rounded-lg transition-colors"
                    style={{ border: '1px solid #e2e8f0', color: '#1e293b' }}
                    placeholder="Rechercher une catégorie..."
                    autoComplete="off"
                  />

                  {/* Dropdown list */}
                  {showCategoryDropdown && getFilteredCategories().length > 0 && (
                    <div
                      className="absolute z-10 w-full mt-1 rounded-lg shadow-lg overflow-hidden"
                      style={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        maxHeight: '240px',
                        overflowY: 'auto'
                      }}
                    >
                      {getFilteredCategories().map((category) => {
                        const badge = getExpenseTypeBadge(category.expense_type);
                        const isSelected = category.id === formData.expense_category_id;
                        return (
                          <div
                            key={category.id}
                            onClick={() => handleCategorySelect(category)}
                            className="px-4 py-3 cursor-pointer transition-colors"
                            style={{
                              backgroundColor: isSelected ? '#eff6ff' : 'white',
                              borderBottom: '1px solid #f1f5f9'
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) e.target.style.backgroundColor = '#f8fafc';
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) e.target.style.backgroundColor = 'white';
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="px-2 py-1 rounded text-xs font-medium"
                                style={{
                                  backgroundColor: badge.backgroundColor,
                                  color: badge.color
                                }}
                              >
                                {badge.label}
                              </span>
                              <span style={{ color: '#1e293b' }}>{category.name}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* No results message */}
                  {showCategoryDropdown && categorySearch && getFilteredCategories().length === 0 && (
                    <div
                      className="absolute z-10 w-full mt-1 rounded-lg shadow-lg p-4 text-center"
                      style={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        color: '#64748b'
                      }}
                    >
                      Aucune catégorie trouvée
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#475569' }}>
                    Montant (MRU) *
                  </label>
                  <input
                    type="text"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-lg transition-colors"
                    style={{ border: '1px solid #e2e8f0', color: '#1e293b' }}
                    placeholder="15000 ou 15.000 ou 15,000 ou 15 000"
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
