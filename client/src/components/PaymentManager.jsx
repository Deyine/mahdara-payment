import { useState, useEffect } from 'react';
import { useDialog } from '../context/DialogContext';
import { paymentMethodsAPI } from '../services/api';
import { formatCurrency, formatNumber } from '../utils/formatters';

export default function PaymentManager({ car, payments, onPaymentChange }) {
  const { showAlert, showConfirm } = useDialog();
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [formData, setFormData] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method_id: '',
    notes: ''
  });

  // Import feature state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [parsedPayments, setParsedPayments] = useState([]);
  const [importError, setImportError] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await paymentMethodsAPI.getActive();
      setPaymentMethods(response.data);
      // Set default payment method if available
      if (response.data.length > 0 && !formData.payment_method_id) {
        setFormData(prev => ({ ...prev, payment_method_id: response.data[0].id }));
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingPayment(null);
    setFormData({
      amount: '',
      payment_date: new Date().toISOString().split('T')[0],
      payment_method_id: paymentMethods.length > 0 ? paymentMethods[0].id : '',
      notes: ''
    });
  };

  const handleAddPayment = () => {
    setEditingPayment(null);
    const maxPayment = car.remaining_balance;
    setFormData({
      amount: maxPayment > 0 ? maxPayment.toString() : '',
      payment_date: new Date().toISOString().split('T')[0],
      payment_method_id: paymentMethods.length > 0 ? paymentMethods[0].id : '',
      notes: ''
    });
    setShowForm(true);
  };

  const handleEditPayment = (payment) => {
    setEditingPayment(payment);
    setFormData({
      amount: payment.amount.toString(),
      payment_date: payment.payment_date,
      payment_method_id: payment.payment_method_id || (paymentMethods.length > 0 ? paymentMethods[0].id : ''),
      notes: payment.notes || ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const paymentData = {
      ...formData,
      car_id: car.id,
      amount: parseFloat(formData.amount)
    };

    try {
      if (editingPayment) {
        await onPaymentChange('update', editingPayment.id, paymentData);
        await showAlert('Paiement modifié avec succès', 'success');
      } else {
        await onPaymentChange('create', null, paymentData);
        await showAlert('Paiement enregistré avec succès', 'success');
      }
      resetForm();
    } catch (error) {
      await showAlert(
        error.response?.data?.errors?.[0] || 'Erreur lors de l\'enregistrement',
        'error'
      );
    }
  };

  const handleDeletePayment = async (paymentId) => {
    const confirmed = await showConfirm(
      'Êtes-vous sûr de vouloir supprimer ce paiement ?',
      'Supprimer le paiement'
    );

    if (!confirmed) return;

    try {
      await onPaymentChange('delete', paymentId);
      await showAlert('Paiement supprimé avec succès', 'success');
    } catch (error) {
      await showAlert(
        error.response?.data?.error || 'Erreur lors de la suppression',
        'error'
      );
    }
  };

  // Import feature functions
  const parseAmountMRO = (amountStr) => {
    // Remove spaces and parse as number (amount is in MRO)
    const cleanedAmount = amountStr.replace(/\s/g, '').replace(/,/g, '.');
    const mroAmount = parseFloat(cleanedAmount);
    if (isNaN(mroAmount)) return null;
    // Convert MRO to MRU (divide by 10)
    return mroAmount / 10;
  };

  const parseDate = (dateStr) => {
    // Parse DD/MM/YYYY format
    const parts = dateStr.trim().split('/');
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    if (day < 1 || day > 31 || month < 1 || month > 12) return null;

    // Return ISO format YYYY-MM-DD
    const monthStr = month.toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    return `${year}-${monthStr}-${dayStr}`;
  };

  const parseImportText = (text) => {
    setImportError('');
    const lines = text.trim().split('\n').filter(line => line.trim());
    const parsed = [];
    const errors = [];

    lines.forEach((line, index) => {
      // Split by tab or multiple spaces
      const parts = line.split(/\t+|\s{2,}/).map(p => p.trim()).filter(p => p);

      if (parts.length < 2) {
        errors.push(`Ligne ${index + 1}: Format invalide (date + montant requis)`);
        return;
      }

      const dateStr = parts[0];
      const amountStr = parts[1];

      const parsedDate = parseDate(dateStr);
      const parsedAmount = parseAmountMRO(amountStr);

      if (!parsedDate) {
        errors.push(`Ligne ${index + 1}: Date invalide "${dateStr}" (format attendu: JJ/MM/AAAA)`);
        return;
      }

      if (parsedAmount === null || parsedAmount <= 0) {
        errors.push(`Ligne ${index + 1}: Montant invalide "${amountStr}"`);
        return;
      }

      parsed.push({
        payment_date: parsedDate,
        amount_mro: parseFloat(amountStr.replace(/\s/g, '').replace(/,/g, '.')),
        amount_mru: parsedAmount,
        original_line: line.trim()
      });
    });

    if (errors.length > 0) {
      setImportError(errors.join('\n'));
    }

    setParsedPayments(parsed);
  };

  const handleImportTextChange = (e) => {
    const text = e.target.value;
    setImportText(text);
    if (text.trim()) {
      parseImportText(text);
    } else {
      setParsedPayments([]);
      setImportError('');
    }
  };

  const handleOpenImportModal = () => {
    setImportText('');
    setParsedPayments([]);
    setImportError('');
    setShowImportModal(true);
  };

  const handleCloseImportModal = () => {
    setShowImportModal(false);
    setImportText('');
    setParsedPayments([]);
    setImportError('');
  };

  const handleImportPayments = async () => {
    if (parsedPayments.length === 0) return;

    const confirmed = await showConfirm(
      `Importer ${parsedPayments.length} paiement${parsedPayments.length > 1 ? 's' : ''} ?\n\nTotal: ${formatCurrency(parsedPayments.reduce((sum, p) => sum + p.amount_mru, 0))}`,
      'Confirmer l\'import'
    );

    if (!confirmed) return;

    setIsImporting(true);

    try {
      const defaultPaymentMethodId = paymentMethods.length > 0 ? paymentMethods[0].id : null;

      for (const payment of parsedPayments) {
        const paymentData = {
          car_id: car.id,
          amount: payment.amount_mru,
          payment_date: payment.payment_date,
          payment_method_id: defaultPaymentMethodId,
          notes: `Import: ${formatNumber(payment.amount_mro, 0)} MRO`
        };

        await onPaymentChange('create', null, paymentData);
      }

      await showAlert(
        `${parsedPayments.length} paiement${parsedPayments.length > 1 ? 's' : ''} importé${parsedPayments.length > 1 ? 's' : ''} avec succès`,
        'success'
      );
      handleCloseImportModal();
    } catch (error) {
      await showAlert(
        error.response?.data?.errors?.[0] || 'Erreur lors de l\'import',
        'error'
      );
    } finally {
      setIsImporting(false);
    }
  };

  const getTotalImportMRU = () => {
    return parsedPayments.reduce((sum, p) => sum + p.amount_mru, 0);
  };

  const getTotalImportMRO = () => {
    return parsedPayments.reduce((sum, p) => sum + p.amount_mro, 0);
  };

  const getProgressColor = () => {
    const percentage = car.payment_percentage;
    if (percentage >= 100) return '#10b981'; // Green - fully paid
    if (percentage >= 50) return '#3b82f6'; // Blue - half paid
    if (percentage >= 25) return '#f59e0b'; // Orange - quarter paid
    return '#ef4444'; // Red - just started
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6" style={{ border: '1px solid #e2e8f0' }}>
      {/* Payment Progress Section */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#1e293b' }}>
              Suivi des Paiements
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm mb-1" style={{ color: '#64748b' }}>Prix de vente</p>
                <p className="text-lg font-bold" style={{ color: '#167bff' }}>
                  {formatCurrency(car.sale_price)}
                </p>
              </div>
              <div>
                <p className="text-sm mb-1" style={{ color: '#64748b' }}>Total payé</p>
                <p className="text-lg font-bold" style={{ color: '#10b981' }}>
                  {formatCurrency(car.total_paid)}
                </p>
              </div>
              <div>
                <p className="text-sm mb-1" style={{ color: '#64748b' }}>Reste à payer</p>
                <p className="text-lg font-bold" style={{ color: car.remaining_balance > 0 ? '#ef4444' : '#10b981' }}>
                  {formatCurrency(car.remaining_balance)}
                </p>
              </div>
            </div>
          </div>

          {!car.fully_paid && (
            <div className="flex gap-2">
              <button
                onClick={handleOpenImportModal}
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
                📥 Importer
              </button>
              <button
                onClick={handleAddPayment}
                className="px-4 py-2 rounded-lg font-medium transition-colors text-white"
                style={{ backgroundColor: '#10b981' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
              >
                + Enregistrer un Paiement
              </button>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium" style={{ color: '#64748b' }}>Progression</span>
            <span className="text-sm font-bold" style={{ color: getProgressColor() }}>
              {car.payment_percentage}%
            </span>
          </div>
          <div className="w-full rounded-full h-3" style={{ backgroundColor: '#e2e8f0' }}>
            <div
              className="h-3 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(car.payment_percentage, 100)}%`,
                backgroundColor: getProgressColor()
              }}
            />
          </div>
        </div>

        {/* Fully Paid Badge */}
        {car.fully_paid && (
          <div
            className="rounded-lg p-3 flex items-center gap-2 mt-3"
            style={{ backgroundColor: '#f0fdf4', border: '1px solid #10b981' }}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="#10b981">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold" style={{ color: '#166534' }}>
              ✓ Véhicule payé intégralement
            </span>
          </div>
        )}

        {/* Profit Display */}
        {car.profit !== null && (
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid #e2e8f0' }}>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium" style={{ color: '#64748b' }}>
                Bénéfice estimé:
              </span>
              <span
                className="text-lg font-bold"
                style={{ color: car.profit >= 0 ? '#10b981' : '#ef4444' }}
              >
                {car.profit >= 0 ? '+' : ''}{formatCurrency(car.profit)}
              </span>
            </div>
            <p className="text-xs mt-1" style={{ color: '#64748b' }}>
              Prix de vente ({formatCurrency(car.sale_price)}) - Coût total ({formatCurrency(car.total_cost)})
            </p>
          </div>
        )}
      </div>

      {/* Payments List */}
      <div>
        <h3 className="text-lg font-bold mb-3" style={{ color: '#1e293b' }}>
          Historique des Paiements ({payments.length})
        </h3>

        {payments.length === 0 ? (
          <div className="rounded-lg p-8 text-center" style={{ backgroundColor: '#f1f5f9' }}>
            <p style={{ color: '#64748b' }}>Aucun paiement enregistré pour ce véhicule</p>
            <p className="text-sm mt-2" style={{ color: '#94a3b8' }}>
              Cliquez sur "Enregistrer un Paiement" pour commencer
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="rounded-lg p-4"
                style={{ backgroundColor: '#fafbfc', border: '1px solid #e2e8f0' }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl font-bold" style={{ color: '#10b981' }}>
                        {formatCurrency(payment.amount)}
                      </span>
                      <span
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{ backgroundColor: '#eff6ff', color: '#1e40af' }}
                      >
                        {payment.payment_method?.name || 'N/A'}
                      </span>
                    </div>
                    <p className="text-sm mb-1" style={{ color: '#64748b' }}>
                      📅 {new Date(payment.payment_date).toLocaleDateString('fr-FR')}
                    </p>
                    {payment.notes && (
                      <p className="text-sm" style={{ color: '#64748b' }}>
                        💬 {payment.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditPayment(payment)}
                      className="p-2 rounded transition-colors"
                      style={{ color: '#167bff' }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#eff6ff'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      title="Modifier"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeletePayment(payment.id)}
                      className="p-2 rounded transition-colors"
                      style={{ color: '#64748b' }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#fef2f2';
                        e.target.style.color = '#ef4444';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = '#64748b';
                      }}
                      title="Supprimer"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Form Modal */}
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
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-xl font-bold" style={{ color: '#1e293b' }}>
                  {editingPayment ? 'Modifier le Paiement' : 'Nouveau Paiement'}
                </h3>
                <button
                  onClick={resetForm}
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
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#1e293b' }}>
                    Montant <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={editingPayment ? car.sale_price : car.remaining_balance}
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-lg transition-colors text-lg font-medium"
                    style={{ border: '1px solid #e2e8f0', color: '#1e293b' }}
                    onFocus={(e) => e.target.style.borderColor = '#167bff'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    placeholder="0.00"
                  />
                  {!editingPayment && (
                    <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                      Maximum: {formatCurrency(car.remaining_balance)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#1e293b' }}>
                    Date du paiement <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-lg transition-colors"
                    style={{ border: '1px solid #e2e8f0', color: '#1e293b' }}
                    onFocus={(e) => e.target.style.borderColor = '#167bff'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#1e293b' }}>
                    Mode de paiement
                  </label>
                  <select
                    value={formData.payment_method_id}
                    onChange={(e) => setFormData({ ...formData, payment_method_id: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg transition-colors"
                    style={{ border: '1px solid #e2e8f0', color: '#1e293b' }}
                    onFocus={(e) => e.target.style.borderColor = '#167bff'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  >
                    {paymentMethods.map(method => (
                      <option key={method.id} value={method.id}>
                        {method.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#1e293b' }}>
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg transition-colors"
                    style={{ border: '1px solid #e2e8f0', color: '#1e293b' }}
                    onFocus={(e) => e.target.style.borderColor = '#167bff'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    placeholder="Notes optionnelles..."
                  />
                </div>

                {/* Modal Footer */}
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
                    {editingPayment ? 'Modifier' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="bg-white rounded-lg shadow-xl w-full max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b">
                <div>
                  <h3 className="text-xl font-bold" style={{ color: '#1e293b' }}>
                    Importer des Paiements
                  </h3>
                  <p className="text-sm mt-1" style={{ color: '#64748b' }}>
                    Collez les données depuis Excel (Date + Montant en MRO)
                  </p>
                </div>
                <button
                  onClick={handleCloseImportModal}
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
              <div className="p-6 space-y-4">
                {/* Info Box */}
                <div className="rounded-lg p-4" style={{ backgroundColor: '#eff6ff', border: '1px solid #167bff' }}>
                  <p className="text-sm" style={{ color: '#1e40af' }}>
                    📋 Format attendu: <strong>JJ/MM/AAAA</strong> [Tab] <strong>Montant MRO</strong>
                  </p>
                  <p className="text-xs mt-2" style={{ color: '#64748b' }}>
                    Exemple: 12/01/2024	115 000
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                    Les montants en MRO seront automatiquement convertis en MRU (÷10)
                  </p>
                </div>

                {/* Textarea */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#1e293b' }}>
                    Données à importer
                  </label>
                  <textarea
                    value={importText}
                    onChange={handleImportTextChange}
                    rows={6}
                    className="w-full px-4 py-3 rounded-lg transition-colors font-mono text-sm"
                    style={{ border: '1px solid #e2e8f0', color: '#1e293b' }}
                    onFocus={(e) => e.target.style.borderColor = '#167bff'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    placeholder="12/01/2024	115 000&#10;14/01/2024	2 200 000&#10;14/01/2024	100 000"
                  />
                </div>

                {/* Error Display */}
                {importError && (
                  <div className="rounded-lg p-4" style={{ backgroundColor: '#fef2f2', border: '1px solid #ef4444' }}>
                    <p className="text-sm font-medium mb-1" style={{ color: '#dc2626' }}>
                      Erreurs détectées:
                    </p>
                    <pre className="text-xs whitespace-pre-wrap" style={{ color: '#7f1d1d' }}>
                      {importError}
                    </pre>
                  </div>
                )}

                {/* Preview Table */}
                {parsedPayments.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2" style={{ color: '#1e293b' }}>
                      Aperçu ({parsedPayments.length} paiement{parsedPayments.length > 1 ? 's' : ''})
                    </h4>
                    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={{ backgroundColor: '#f8fafc' }}>
                            <th className="px-4 py-2 text-left font-medium" style={{ color: '#64748b' }}>Date</th>
                            <th className="px-4 py-2 text-right font-medium" style={{ color: '#64748b' }}>MRO</th>
                            <th className="px-4 py-2 text-right font-medium" style={{ color: '#64748b' }}>→ MRU</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedPayments.map((payment, index) => (
                            <tr
                              key={index}
                              style={{ borderTop: '1px solid #e2e8f0' }}
                            >
                              <td className="px-4 py-2" style={{ color: '#1e293b' }}>
                                {new Date(payment.payment_date).toLocaleDateString('fr-FR')}
                              </td>
                              <td className="px-4 py-2 text-right" style={{ color: '#64748b' }}>
                                {formatNumber(payment.amount_mro, 0)}
                              </td>
                              <td className="px-4 py-2 text-right font-medium" style={{ color: '#10b981' }}>
                                {formatCurrency(payment.amount_mru)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr style={{ borderTop: '2px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                            <td className="px-4 py-2 font-bold" style={{ color: '#1e293b' }}>Total</td>
                            <td className="px-4 py-2 text-right font-medium" style={{ color: '#64748b' }}>
                              {formatNumber(getTotalImportMRO(), 0)}
                            </td>
                            <td className="px-4 py-2 text-right font-bold" style={{ color: '#10b981' }}>
                              {formatCurrency(getTotalImportMRU())}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {/* Modal Footer */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseImportModal}
                    className="flex-1 px-6 py-3 rounded-lg font-medium transition-colors"
                    style={{ backgroundColor: '#fafbfc', border: '1px solid #e2e8f0', color: '#475569' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#fafbfc'}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleImportPayments}
                    disabled={parsedPayments.length === 0 || isImporting}
                    className="flex-1 px-6 py-3 rounded-lg font-medium transition-colors text-white"
                    style={{
                      backgroundColor: parsedPayments.length === 0 || isImporting ? '#94a3b8' : '#167bff',
                      cursor: parsedPayments.length === 0 || isImporting ? 'not-allowed' : 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      if (parsedPayments.length > 0 && !isImporting) {
                        e.target.style.backgroundColor = '#0d5dd6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (parsedPayments.length > 0 && !isImporting) {
                        e.target.style.backgroundColor = '#167bff';
                      }
                    }}
                  >
                    {isImporting ? 'Import en cours...' : `Importer ${parsedPayments.length > 0 ? `(${parsedPayments.length})` : ''}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
