import { useState, useEffect } from 'react';
import { useDialog } from '../context/DialogContext';
import { paymentMethodsAPI, carsAPI, paymentsAPI } from '../services/api';
import { formatCurrency, formatNumber } from '../utils/formatters';

export default function BulkPaymentImport({ onImportComplete }) {
  const { showAlert, showConfirm } = useDialog();
  const [showModal, setShowModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [parsedData, setParsedData] = useState([]);
  const [importError, setImportError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [cars, setCars] = useState([]);

  useEffect(() => {
    fetchPaymentMethods();
    fetchCars();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await paymentMethodsAPI.getActive();
      setPaymentMethods(response.data);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const fetchCars = async () => {
    try {
      const response = await carsAPI.getAll();
      setCars(response.data);
    } catch (error) {
      console.error('Error fetching cars:', error);
    }
  };

  const parseAmountMRO = (amountStr) => {
    const cleanedAmount = amountStr.replace(/\s/g, '').replace(/,/g, '.');
    const mroAmount = parseFloat(cleanedAmount);
    if (isNaN(mroAmount)) return null;
    return mroAmount / 10; // Convert MRO to MRU
  };

  const parseDate = (dateStr) => {
    const parts = dateStr.trim().split('/');
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    if (day < 1 || day > 31 || month < 1 || month > 12) return null;

    const monthStr = month.toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    return `${year}-${monthStr}-${dayStr}`;
  };

  const parseImportText = (text) => {
    setImportError('');
    const lines = text.split('\n');
    const parsed = [];
    const errors = [];

    let currentCarRef = null;
    let currentCar = null;
    let currentSalePrice = null;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Skip empty lines
      if (!trimmedLine) return;

      // Check if this is a "Versement #X SALE_PRICE" line
      const versementMatch = trimmedLine.match(/^Versement\s+#(\d+)(?:\s+([\d\s]+))?/i);
      if (versementMatch) {
        currentCarRef = versementMatch[1];
        const salePriceStr = versementMatch[2];

        // Parse sale price if provided (in MRO)
        currentSalePrice = null;
        if (salePriceStr) {
          const salePriceMRU = parseAmountMRO(salePriceStr);
          if (salePriceMRU && salePriceMRU > 0) {
            currentSalePrice = salePriceMRU;
          } else {
            errors.push(`Ligne ${index + 1}: Prix de vente invalide "${salePriceStr}"`);
          }
        }

        // Find the car by ref
        currentCar = cars.find(car => car.ref && car.ref.toString() === currentCarRef);

        if (!currentCar) {
          errors.push(`Ligne ${index + 1}: Voiture #${currentCarRef} non trouvée`);
          currentCar = null;
        }
        return;
      }

      // Try to parse as date + amount
      const parts = trimmedLine.split(/\t+|\s{2,}/).map(p => p.trim()).filter(p => p);

      if (parts.length < 2) {
        // Skip lines that don't have date + amount format
        return;
      }

      const dateStr = parts[0];
      const amountStr = parts[1];

      const parsedDate = parseDate(dateStr);
      const parsedAmount = parseAmountMRO(amountStr);

      if (!parsedDate) {
        errors.push(`Ligne ${index + 1}: Date invalide "${dateStr}"`);
        return;
      }

      if (parsedAmount === null || parsedAmount <= 0) {
        errors.push(`Ligne ${index + 1}: Montant invalide "${amountStr}"`);
        return;
      }

      if (!currentCar) {
        errors.push(`Ligne ${index + 1}: Aucune voiture définie pour ce paiement`);
        return;
      }

      // Find or create entry for this car
      let carEntry = parsed.find(p => p.carRef === currentCarRef);
      if (!carEntry) {
        carEntry = {
          carRef: currentCarRef,
          carId: currentCar.id,
          carName: currentCar.display_name,
          carStatus: currentCar.status,
          salePrice: currentSalePrice,
          payments: []
        };
        parsed.push(carEntry);
      }

      carEntry.payments.push({
        payment_date: parsedDate,
        amount_mro: parseFloat(amountStr.replace(/\s/g, '').replace(/,/g, '.')),
        amount_mru: parsedAmount
      });

      // Set sale date to the first payment date if we have a sale price
      if (currentSalePrice && !carEntry.saleDate) {
        carEntry.saleDate = parsedDate;
      }
    });

    if (errors.length > 0) {
      setImportError(errors.join('\n'));
    }

    setParsedData(parsed);
  };

  const handleImportTextChange = (e) => {
    const text = e.target.value;
    setImportText(text);
    if (text.trim()) {
      parseImportText(text);
    } else {
      setParsedData([]);
      setImportError('');
    }
  };

  const handleOpenModal = () => {
    setImportText('');
    setParsedData([]);
    setImportError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setImportText('');
    setParsedData([]);
    setImportError('');
  };

  const getTotalPayments = () => {
    return parsedData.reduce((sum, car) => sum + car.payments.length, 0);
  };

  const getTotalAmountMRU = () => {
    return parsedData.reduce((sum, car) => {
      return sum + car.payments.reduce((s, p) => s + p.amount_mru, 0);
    }, 0);
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;

    const totalPayments = getTotalPayments();
    const confirmed = await showConfirm(
      `Importer ${totalPayments} paiement${totalPayments > 1 ? 's' : ''} pour ${parsedData.length} voiture${parsedData.length > 1 ? 's' : ''} ?\n\nTotal: ${formatCurrency(getTotalAmountMRU())}`,
      'Confirmer l\'import'
    );

    if (!confirmed) return;

    setIsImporting(true);

    try {
      const defaultPaymentMethodId = paymentMethods.length > 0 ? paymentMethods[0].id : null;
      let successCount = 0;
      let soldCount = 0;

      for (const carEntry of parsedData) {
        // Sell the car first if it's not sold and we have a sale price
        if (carEntry.carStatus !== 'sold' && carEntry.salePrice && carEntry.saleDate) {
          try {
            await carsAPI.sell(carEntry.carId, carEntry.salePrice, carEntry.saleDate);
            soldCount++;
          } catch (error) {
            console.error(`Error selling car #${carEntry.carRef}:`, error);
            // Continue with payments even if selling fails
          }
        }

        // Import payments
        for (const payment of carEntry.payments) {
          const paymentData = {
            car_id: carEntry.carId,
            amount: payment.amount_mru,
            payment_date: payment.payment_date,
            payment_method_id: defaultPaymentMethodId,
            notes: `Import: ${formatNumber(payment.amount_mro, 0)} MRO`
          };

          await paymentsAPI.create(paymentData);
          successCount++;
        }
      }

      let message = `${successCount} paiement${successCount > 1 ? 's' : ''} importé${successCount > 1 ? 's' : ''} avec succès`;
      if (soldCount > 0) {
        message += `\n${soldCount} voiture${soldCount > 1 ? 's' : ''} marquée${soldCount > 1 ? 's' : ''} comme vendue${soldCount > 1 ? 's' : ''}`;
      }

      await showAlert(message, 'success');
      handleCloseModal();
      if (onImportComplete) onImportComplete();
    } catch (error) {
      await showAlert(
        error.response?.data?.errors?.[0] || 'Erreur lors de l\'import',
        'error'
      );
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
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
        📥 Importer Paiements en Masse
      </button>

      {/* Import Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b">
                <div>
                  <h3 className="text-xl font-bold" style={{ color: '#1e293b' }}>
                    Import de Paiements en Masse
                  </h3>
                  <p className="text-sm mt-1" style={{ color: '#64748b' }}>
                    Importez des paiements pour plusieurs voitures
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
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
              <div className="p-6 space-y-4 overflow-y-auto">
                {/* Info Box */}
                <div className="rounded-lg p-4" style={{ backgroundColor: '#eff6ff', border: '1px solid #167bff' }}>
                  <p className="text-sm font-medium mb-2" style={{ color: '#1e40af' }}>
                    📋 Format attendu:
                  </p>
                  <pre className="text-xs font-mono" style={{ color: '#64748b' }}>
{`Versement #17  3 800 000

20/05/2024	1 700 000
20/05/2024	3 650 000

Versement #19  4 600 000

13/08/2024	3 000 000
21/04/2025	1 600 000`}
                  </pre>
                  <p className="text-xs mt-2" style={{ color: '#64748b' }}>
                    • Le montant après "Versement #X" est le prix de vente en MRO (optionnel)
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                    • Si fourni, la voiture sera marquée comme vendue à la date du premier paiement
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                    • Les montants en MRO seront automatiquement convertis en MRU (÷10)
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
                    rows={10}
                    className="w-full px-4 py-3 rounded-lg transition-colors font-mono text-sm"
                    style={{ border: '1px solid #e2e8f0', color: '#1e293b' }}
                    onFocus={(e) => e.target.style.borderColor = '#167bff'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    placeholder="Collez vos données ici..."
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

                {/* Preview */}
                {parsedData.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3" style={{ color: '#1e293b' }}>
                      Aperçu: {parsedData.length} voiture{parsedData.length > 1 ? 's' : ''}, {getTotalPayments()} paiement{getTotalPayments() > 1 ? 's' : ''}
                    </h4>

                    <div className="space-y-4">
                      {parsedData.map((carEntry, carIndex) => (
                        <div
                          key={carIndex}
                          className="rounded-lg overflow-hidden"
                          style={{ border: '1px solid #e2e8f0' }}
                        >
                          {/* Car Header */}
                          <div className="px-4 py-3" style={{ backgroundColor: '#f8fafc' }}>
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-bold" style={{ color: '#1e293b' }}>
                                #{carEntry.carRef} - {carEntry.carName}
                              </span>
                              <span className="text-sm font-medium" style={{ color: '#64748b' }}>
                                {carEntry.payments.length} paiement{carEntry.payments.length > 1 ? 's' : ''}
                              </span>
                            </div>
                            {carEntry.salePrice && (
                              <div className="flex items-center gap-2 text-sm">
                                {carEntry.carStatus !== 'sold' && (
                                  <span className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
                                    ✓ Sera marqué comme vendu
                                  </span>
                                )}
                                <span style={{ color: '#64748b' }}>
                                  Prix de vente: <strong style={{ color: '#10b981' }}>{formatCurrency(carEntry.salePrice)}</strong>
                                </span>
                                {carEntry.saleDate && (
                                  <span style={{ color: '#64748b' }}>
                                    • {new Date(carEntry.saleDate).toLocaleDateString('fr-FR')}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Payments Table */}
                          <table className="w-full text-sm">
                            <thead>
                              <tr style={{ backgroundColor: '#fafbfc' }}>
                                <th className="px-4 py-2 text-left font-medium" style={{ color: '#64748b' }}>Date</th>
                                <th className="px-4 py-2 text-right font-medium" style={{ color: '#64748b' }}>MRO</th>
                                <th className="px-4 py-2 text-right font-medium" style={{ color: '#64748b' }}>→ MRU</th>
                              </tr>
                            </thead>
                            <tbody>
                              {carEntry.payments.map((payment, paymentIndex) => (
                                <tr
                                  key={paymentIndex}
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
                              <tr style={{ borderTop: '2px solid #e2e8f0', backgroundColor: '#fafbfc' }}>
                                <td className="px-4 py-2 font-bold" style={{ color: '#1e293b' }}>
                                  Total
                                </td>
                                <td className="px-4 py-2 text-right font-medium" style={{ color: '#64748b' }}>
                                  {formatNumber(carEntry.payments.reduce((s, p) => s + p.amount_mro, 0), 0)}
                                </td>
                                <td className="px-4 py-2 text-right font-bold" style={{ color: '#10b981' }}>
                                  {formatCurrency(carEntry.payments.reduce((s, p) => s + p.amount_mru, 0))}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      ))}

                      {/* Grand Total */}
                      <div className="rounded-lg p-4" style={{ backgroundColor: '#f0fdf4', border: '2px solid #10b981' }}>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold" style={{ color: '#166534' }}>
                            Total Général
                          </span>
                          <span className="text-2xl font-bold" style={{ color: '#10b981' }}>
                            {formatCurrency(getTotalAmountMRU())}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 p-6 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-6 py-3 rounded-lg font-medium transition-colors"
                  style={{ backgroundColor: '#fafbfc', border: '1px solid #e2e8f0', color: '#475569' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#fafbfc'}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={parsedData.length === 0 || isImporting}
                  className="flex-1 px-6 py-3 rounded-lg font-medium transition-colors text-white"
                  style={{
                    backgroundColor: parsedData.length === 0 || isImporting ? '#94a3b8' : '#167bff',
                    cursor: parsedData.length === 0 || isImporting ? 'not-allowed' : 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (parsedData.length > 0 && !isImporting) {
                      e.target.style.backgroundColor = '#0d5dd6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (parsedData.length > 0 && !isImporting) {
                      e.target.style.backgroundColor = '#167bff';
                    }
                  }}
                >
                  {isImporting ? 'Import en cours...' : `Importer ${getTotalPayments() > 0 ? `(${getTotalPayments()})` : ''}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
