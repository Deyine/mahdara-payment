import { useState, useEffect } from 'react';
import { useDialog } from '../context/DialogContext';
import { paymentMethodsAPI } from '../services/api';

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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
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
                  {formatCurrency(car.sale_price)} MRU
                </p>
              </div>
              <div>
                <p className="text-sm mb-1" style={{ color: '#64748b' }}>Total payé</p>
                <p className="text-lg font-bold" style={{ color: '#10b981' }}>
                  {formatCurrency(car.total_paid)} MRU
                </p>
              </div>
              <div>
                <p className="text-sm mb-1" style={{ color: '#64748b' }}>Reste à payer</p>
                <p className="text-lg font-bold" style={{ color: car.remaining_balance > 0 ? '#ef4444' : '#10b981' }}>
                  {formatCurrency(car.remaining_balance)} MRU
                </p>
              </div>
            </div>
          </div>

          {!car.fully_paid && (
            <button
              onClick={handleAddPayment}
              className="px-4 py-2 rounded-lg font-medium transition-colors text-white"
              style={{ backgroundColor: '#10b981' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
            >
              + Enregistrer un Paiement
            </button>
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
                {car.profit >= 0 ? '+' : ''}{formatCurrency(car.profit)} MRU
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
                        {formatCurrency(payment.amount)} MRU
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
                      Maximum: {formatCurrency(car.remaining_balance)} MRU
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
    </div>
  );
}
