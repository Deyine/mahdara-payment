import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDialog } from '../context/DialogContext';
import { carsAPI, carModelsAPI, expenseCategoriesAPI, sellersAPI } from '../services/api';

export default function ImportCars() {
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useDialog();

  const [pasteData, setPasteData] = useState('');
  const [parsedCars, setParsedCars] = useState([]);
  const [carModels, setCarModels] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchCarModels();
    fetchExpenseCategories();
    fetchSellers();
  }, []);

  const fetchCarModels = async () => {
    try {
      const response = await carModelsAPI.getActive();
      setCarModels(response.data);
    } catch (error) {
      console.error('Error fetching car models:', error);
    }
  };

  const fetchExpenseCategories = async () => {
    try {
      const response = await expenseCategoriesAPI.getActive();
      setExpenseCategories(response.data);
    } catch (error) {
      console.error('Error fetching expense categories:', error);
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

  // Parse pasted data into structured car objects
  const handleParse = () => {
    if (!pasteData.trim()) {
      showAlert('Veuillez coller des données à importer', 'error');
      return;
    }

    setLoading(true);

    try {
      const lines = pasteData.split('\n').map(line => line.trim()).filter(line => line);
      const cars = [];
      let currentCar = null;

      lines.forEach((line) => {
        // Check if line starts with # (new car entry)
        if (line.startsWith('#')) {
          // Save previous car if exists
          if (currentCar) {
            cars.push(currentCar);
          }

          // Parse new car header
          currentCar = parseCarHeader(line);
        } else if (currentCar) {
          // Parse expense/cost line
          parseExpenseLine(line, currentCar);
        }
      });

      // Add last car
      if (currentCar) {
        cars.push(currentCar);
      }

      if (cars.length === 0) {
        showAlert('Aucun véhicule détecté. Format attendu: #1 : Model Year Color', 'error');
        setLoading(false);
        return;
      }

      // Validate and enrich parsed cars
      const enrichedCars = cars.map((car, index) => enrichCarData(car, index));

      setParsedCars(enrichedCars);
      showAlert(`${cars.length} véhicule(s) détecté(s)`, 'success');
    } catch (error) {
      console.error('Parse error:', error);
      showAlert('Erreur lors de l\'analyse des données', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Parse car header line
  // Format 1: #1 : Toyota Corolla SE 2018 Marron
  // Format 2: #6 : LE 2015 - 377014 - Brown
  const parseCarHeader = (line) => {
    // Remove # and split by :
    const content = line.substring(line.indexOf(':') + 1).trim();

    // Check for format with VIN (contains multiple -)
    const parts = content.split('-').map(p => p.trim());

    let model = '';
    let year = null;
    let vin = null;
    let color = '';

    if (parts.length >= 3) {
      // Format 2: Model - VIN - Color
      model = parts[0];
      vin = parts[1];
      color = parts[2];

      // Extract year from model if present
      const yearMatch = model.match(/\b(19|20)\d{2}\b/);
      if (yearMatch) {
        year = parseInt(yearMatch[0]);
        model = model.replace(yearMatch[0], '').trim();
      }
    } else {
      // Format 1: Model Year Color (space separated)
      const tokens = content.split(/\s+/);

      // Extract year (4-digit number starting with 19 or 20)
      const yearIndex = tokens.findIndex(token => /^(19|20)\d{2}$/.test(token));

      if (yearIndex !== -1) {
        year = parseInt(tokens[yearIndex]);

        // Model is everything before year
        model = tokens.slice(0, yearIndex).join(' ');

        // Color is everything after year
        color = tokens.slice(yearIndex + 1).join(' ');
      } else {
        // No year found, assume last token is color
        model = tokens.slice(0, -1).join(' ');
        color = tokens[tokens.length - 1];
      }
    }

    return {
      originalLine: line,
      model: model.trim(),
      year: year,
      vin: vin,
      color: color.trim(),
      purchase_price: null,
      clearance_cost: null,
      towing_cost: null,
      expenses: [],
      errors: [],
    };
  };

  // Parse expense line (tab or space separated: category amount)
  const parseExpenseLine = (line, car) => {
    // Split by tab or multiple spaces
    const parts = line.split(/\t+|\s{2,}/).map(p => p.trim()).filter(p => p);

    if (parts.length < 2) return;

    const category = parts[0];
    const amountStr = parts[1].replace(/\s+/g, ''); // Remove spaces from number
    const amount = parseFloat(amountStr);

    if (isNaN(amount)) return;

    // Map known categories to car fields
    const categoryLower = category.toLowerCase();

    if (categoryLower.includes('achat') || categoryLower === 'purchase') {
      car.purchase_price = amount;
    } else if (categoryLower.includes('dedouane') || categoryLower.includes('douane') || categoryLower === 'clearance') {
      car.clearance_cost = amount;
    } else if (categoryLower.includes('remorquage') || categoryLower.includes('transport') || categoryLower === 'towing') {
      car.towing_cost = amount;
    } else {
      // Add as expense
      car.expenses.push({
        category: category,
        amount: amount,
        description: '',
      });
    }
  };

  // Enrich car data with validation and defaults
  const enrichCarData = (car, index) => {
    const errors = [];
    const today = new Date().toISOString().split('T')[0];

    // Validate required fields
    if (!car.purchase_price) {
      errors.push('Prix d\'achat manquant');
    }

    if (!car.year) {
      errors.push('Année manquante');
    }

    // Try to match car model
    let matchedModel = null;
    if (car.model) {
      matchedModel = carModels.find(m =>
        m.name.toLowerCase().includes(car.model.toLowerCase()) ||
        car.model.toLowerCase().includes(m.name.toLowerCase())
      );
    }

    if (!matchedModel) {
      errors.push(`Modèle "${car.model}" non trouvé`);
    }

    // Generate VIN if not present
    const generatedVin = car.vin || `NO-VIN-${Date.now()}-${index}`;

    return {
      ...car,
      car_model_id: matchedModel?.id || '',
      matched_model_name: matchedModel?.name || '',
      vin: generatedVin,
      purchase_date: today,
      seller_id: '',
      mileage: null,
      errors: errors,
      isValid: errors.length === 0,
    };
  };

  // Update a specific field in a parsed car
  const updateCarField = (index, field, value) => {
    setParsedCars(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // Re-validate if car_model_id changed
      if (field === 'car_model_id') {
        const model = carModels.find(m => m.id === value);
        updated[index].matched_model_name = model?.name || '';

        // Update errors
        const errors = [...updated[index].errors.filter(e => !e.includes('Modèle'))];
        if (!value) {
          errors.push('Modèle requis');
        }
        updated[index].errors = errors;
        updated[index].isValid = errors.length === 0;
      }

      return updated;
    });
  };

  // Remove a parsed car from the list
  const removeCarFromList = (index) => {
    setParsedCars(prev => prev.filter((_, i) => i !== index));
  };

  // Import all valid cars
  const handleImportAll = async () => {
    const validCars = parsedCars.filter(car => car.isValid);
    const invalidCount = parsedCars.length - validCars.length;

    if (validCars.length === 0) {
      await showAlert('Aucun véhicule valide à importer', 'error');
      return;
    }

    const message = invalidCount > 0
      ? `Importer ${validCars.length} véhicule(s) valide(s)?\n${invalidCount} véhicule(s) invalide(s) seront ignorés.`
      : `Importer ${validCars.length} véhicule(s)?`;

    const confirmed = await showConfirm(message, 'Confirmer l\'importation');
    if (!confirmed) return;

    setImporting(true);

    let successCount = 0;
    let failCount = 0;
    const errors = [];

    for (const car of validCars) {
      try {
        // Create car
        const carData = {
          vin: car.vin,
          car_model_id: car.car_model_id,
          year: car.year,
          color: car.color,
          purchase_date: car.purchase_date,
          purchase_price: car.purchase_price,
          seller_id: car.seller_id || null,
          mileage: car.mileage,
          clearance_cost: car.clearance_cost,
          towing_cost: car.towing_cost,
        };

        const response = await carsAPI.create(carData);
        const createdCar = response.data;

        // Create expenses if any
        for (const expense of car.expenses) {
          // Try to match expense category
          const matchedCategory = expenseCategories.find(ec =>
            ec.name.toLowerCase().includes(expense.category.toLowerCase()) ||
            expense.category.toLowerCase().includes(ec.name.toLowerCase())
          );

          if (matchedCategory) {
            await carsAPI.createExpense({
              car_id: createdCar.id,
              expense_category_id: matchedCategory.id,
              amount: expense.amount,
              description: expense.description || `Import: ${expense.category}`,
              expense_date: car.purchase_date,
            });
          }
        }

        successCount++;
      } catch (error) {
        failCount++;
        errors.push(`${car.model} ${car.year}: ${error.response?.data?.errors?.[0] || error.message}`);
      }
    }

    setImporting(false);

    // Show results
    if (successCount > 0) {
      await showAlert(
        `✅ ${successCount} véhicule(s) importé(s) avec succès${failCount > 0 ? `\n❌ ${failCount} échec(s)` : ''}`,
        successCount > 0 && failCount === 0 ? 'success' : 'warning'
      );

      if (failCount === 0) {
        navigate('/cars');
      } else {
        // Remove successful imports from list
        setParsedCars(prev => prev.filter(car => !car.isValid || errors.some(e => e.includes(car.model))));
      }
    } else {
      await showAlert(`❌ Échec de l'importation: ${errors.join('\n')}`, 'error');
    }
  };

  // Clear all parsed data
  const handleClear = () => {
    setPasteData('');
    setParsedCars([]);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafbfc' }}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#1e293b' }}>
              📋 Importer des Véhicules
            </h1>
            <p style={{ color: '#64748b' }}>
              Collez vos données Excel pour importer plusieurs véhicules en une fois
            </p>
          </div>
          <button
            onClick={() => navigate('/cars')}
            className="px-4 py-2 rounded-lg font-medium transition-colors"
            style={{ backgroundColor: '#fafbfc', border: '1px solid #e2e8f0', color: '#475569' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#fafbfc'}
          >
            ← Retour
          </button>
        </div>

        {/* Format Instructions */}
        <div
          className="rounded-lg p-4 mb-6"
          style={{ backgroundColor: '#eff6ff', border: '1px solid #93c5fd' }}
        >
          <h3 className="font-bold mb-2" style={{ color: '#1e40af' }}>
            📝 Format Attendu
          </h3>
          <pre className="text-sm" style={{ color: '#1e40af' }}>
{`#1 : Toyota Corolla SE 2018 Marron
Achat	2 600 000
Dedouannement	755 000

#2 : LE 2015 - 377014 - Brown
Achat	1 500 000
Remorquage	50 000`}
          </pre>
          <p className="text-sm mt-2" style={{ color: '#1e40af' }}>
            <strong>Note:</strong> Chaque véhicule commence par #. Le VIN est optionnel (format: Modèle - VIN - Couleur).
          </p>
        </div>

        {/* Paste Area */}
        {parsedCars.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="font-bold mb-4" style={{ color: '#1e293b' }}>
              Collez vos données ici
            </h3>
            <textarea
              value={pasteData}
              onChange={(e) => setPasteData(e.target.value)}
              className="w-full p-4 rounded-lg font-mono text-sm transition-colors"
              style={{
                border: '1px solid #e2e8f0',
                color: '#1e293b',
                minHeight: '300px',
                backgroundColor: '#fafbfc'
              }}
              onFocus={(e) => e.target.style.borderColor = '#167bff'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              placeholder="Collez vos données Excel ici..."
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleParse}
                disabled={loading || !pasteData.trim()}
                className="px-6 py-3 rounded-lg font-medium transition-colors text-white"
                style={{
                  backgroundColor: loading || !pasteData.trim() ? '#cbd5e1' : '#167bff',
                  cursor: loading || !pasteData.trim() ? 'not-allowed' : 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (!loading && pasteData.trim()) e.target.style.backgroundColor = '#0d5dd6';
                }}
                onMouseLeave={(e) => {
                  if (!loading && pasteData.trim()) e.target.style.backgroundColor = '#167bff';
                }}
              >
                {loading ? 'Analyse en cours...' : '🔍 Analyser les données'}
              </button>
              <button
                onClick={handleClear}
                className="px-6 py-3 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: '#fafbfc', border: '1px solid #e2e8f0', color: '#475569' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#fafbfc'}
              >
                Effacer
              </button>
            </div>
          </div>
        )}

        {/* Parsed Cars List */}
        {parsedCars.length > 0 && (
          <div className="space-y-4">
            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-xl" style={{ color: '#1e293b' }}>
                {parsedCars.length} Véhicule(s) Détecté(s)
              </h3>
              <div className="flex gap-3">
                <button
                  onClick={handleClear}
                  className="px-4 py-2 rounded-lg font-medium transition-colors"
                  style={{ backgroundColor: '#fafbfc', border: '1px solid #e2e8f0', color: '#475569' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#fafbfc'}
                >
                  ← Recommencer
                </button>
                <button
                  onClick={handleImportAll}
                  disabled={importing || parsedCars.filter(c => c.isValid).length === 0}
                  className="px-6 py-3 rounded-lg font-medium transition-colors text-white"
                  style={{
                    backgroundColor: importing || parsedCars.filter(c => c.isValid).length === 0 ? '#cbd5e1' : '#10b981',
                    cursor: importing || parsedCars.filter(c => c.isValid).length === 0 ? 'not-allowed' : 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (!importing && parsedCars.filter(c => c.isValid).length > 0) {
                      e.target.style.backgroundColor = '#059669';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!importing && parsedCars.filter(c => c.isValid).length > 0) {
                      e.target.style.backgroundColor = '#10b981';
                    }
                  }}
                >
                  {importing ? 'Importation...' : `✅ Importer ${parsedCars.filter(c => c.isValid).length} Véhicule(s)`}
                </button>
              </div>
            </div>

            {/* Car Cards */}
            {parsedCars.map((car, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm border p-6"
                style={{
                  borderColor: car.isValid ? '#10b981' : '#ef4444',
                  borderWidth: '2px'
                }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {car.isValid ? '✅' : '❌'}
                    </span>
                    <div>
                      <h4 className="font-bold text-lg" style={{ color: '#1e293b' }}>
                        {car.model} {car.year}
                      </h4>
                      <p className="text-sm" style={{ color: '#64748b' }}>
                        {car.originalLine}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeCarFromList(index)}
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: '#ef4444' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#fef2f2'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    title="Retirer de la liste"
                  >
                    🗑️
                  </button>
                </div>

                {/* Errors */}
                {car.errors.length > 0 && (
                  <div
                    className="rounded-lg p-3 mb-4"
                    style={{ backgroundColor: '#fef2f2', border: '1px solid #ef4444' }}
                  >
                    <p className="font-medium mb-1" style={{ color: '#991b1b' }}>
                      Erreurs:
                    </p>
                    <ul className="list-disc list-inside text-sm" style={{ color: '#991b1b' }}>
                      {car.errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Car Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#64748b' }}>
                      Modèle *
                    </label>
                    <select
                      value={car.car_model_id}
                      onChange={(e) => updateCarField(index, 'car_model_id', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg transition-colors"
                      style={{
                        border: `1px solid ${!car.car_model_id ? '#ef4444' : '#e2e8f0'}`,
                        color: '#1e293b'
                      }}
                    >
                      <option value="">-- Sélectionner --</option>
                      {carModels.map(model => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </select>
                    {car.matched_model_name && (
                      <p className="text-xs mt-1" style={{ color: '#10b981' }}>
                        ✓ Détecté: {car.matched_model_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#64748b' }}>
                      VIN
                    </label>
                    <input
                      type="text"
                      value={car.vin}
                      onChange={(e) => updateCarField(index, 'vin', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg transition-colors"
                      style={{ border: '1px solid #e2e8f0', color: '#1e293b' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#64748b' }}>
                      Année *
                    </label>
                    <input
                      type="number"
                      value={car.year || ''}
                      onChange={(e) => updateCarField(index, 'year', parseInt(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg transition-colors"
                      style={{ border: '1px solid #e2e8f0', color: '#1e293b' }}
                      min="1900"
                      max={new Date().getFullYear() + 1}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#64748b' }}>
                      Couleur
                    </label>
                    <input
                      type="text"
                      value={car.color}
                      onChange={(e) => updateCarField(index, 'color', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg transition-colors"
                      style={{ border: '1px solid #e2e8f0', color: '#1e293b' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#64748b' }}>
                      Date d'achat
                    </label>
                    <input
                      type="date"
                      value={car.purchase_date}
                      onChange={(e) => updateCarField(index, 'purchase_date', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg transition-colors"
                      style={{ border: '1px solid #e2e8f0', color: '#1e293b' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#64748b' }}>
                      Vendeur
                    </label>
                    <select
                      value={car.seller_id}
                      onChange={(e) => updateCarField(index, 'seller_id', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg transition-colors"
                      style={{ border: '1px solid #e2e8f0', color: '#1e293b' }}
                    >
                      <option value="">-- Sélectionner un vendeur --</option>
                      {sellers.map((seller) => (
                        <option key={seller.id} value={seller.id}>
                          {seller.name} {seller.location && `(${seller.location})`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Cost Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-lg p-3" style={{ backgroundColor: '#f0fdf4', border: '1px solid #10b981' }}>
                    <p className="text-xs mb-1" style={{ color: '#166534' }}>Prix d'achat</p>
                    <p className="font-bold" style={{ color: '#166534' }}>
                      {car.purchase_price?.toLocaleString('fr-FR') || '—'} MRU
                    </p>
                  </div>

                  {car.clearance_cost && (
                    <div className="rounded-lg p-3" style={{ backgroundColor: '#eff6ff', border: '1px solid #3b82f6' }}>
                      <p className="text-xs mb-1" style={{ color: '#1e40af' }}>Dédouanement</p>
                      <p className="font-bold" style={{ color: '#1e40af' }}>
                        {car.clearance_cost.toLocaleString('fr-FR')} MRU
                      </p>
                    </div>
                  )}

                  {car.towing_cost && (
                    <div className="rounded-lg p-3" style={{ backgroundColor: '#eff6ff', border: '1px solid #3b82f6' }}>
                      <p className="text-xs mb-1" style={{ color: '#1e40af' }}>Remorquage</p>
                      <p className="font-bold" style={{ color: '#1e40af' }}>
                        {car.towing_cost.toLocaleString('fr-FR')} MRU
                      </p>
                    </div>
                  )}

                  {car.expenses.length > 0 && (
                    <div className="rounded-lg p-3" style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b' }}>
                      <p className="text-xs mb-1" style={{ color: '#92400e' }}>Autres dépenses</p>
                      <p className="font-bold" style={{ color: '#92400e' }}>
                        {car.expenses.reduce((sum, exp) => sum + exp.amount, 0).toLocaleString('fr-FR')} MRU
                      </p>
                    </div>
                  )}
                </div>

                {/* Expenses List */}
                {car.expenses.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2" style={{ color: '#64748b' }}>
                      Dépenses détectées ({car.expenses.length}):
                    </p>
                    <div className="space-y-1">
                      {car.expenses.map((expense, i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center px-3 py-2 rounded text-sm"
                          style={{ backgroundColor: '#f1f5f9' }}
                        >
                          <span style={{ color: '#475569' }}>{expense.category}</span>
                          <span className="font-medium" style={{ color: '#1e293b' }}>
                            {expense.amount.toLocaleString('fr-FR')} MRU
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
