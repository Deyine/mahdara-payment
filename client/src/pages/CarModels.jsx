import { useState, useEffect } from 'react';
import { useDialog } from '../context/DialogContext';
import { carModelsAPI } from '../services/api';

export default function CarModels() {
  const { showAlert, showConfirm } = useDialog();
  const [carModels, setCarModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingModel, setEditingModel] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    active: true
  });

  useEffect(() => {
    fetchCarModels();
  }, []);

  const fetchCarModels = async () => {
    try {
      setLoading(true);
      const response = await carModelsAPI.getAll();
      setCarModels(response.data);
    } catch (error) {
      await showAlert('Erreur lors du chargement des modèles', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingModel(null);
    setFormData({ name: '', active: true });
    setShowForm(true);
  };

  const handleEdit = (model) => {
    setEditingModel(model);
    setFormData({ name: model.name, active: model.active });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingModel) {
        await carModelsAPI.update(editingModel.id, formData);
        await showAlert('Modèle modifié avec succès', 'success');
      } else {
        await carModelsAPI.create(formData);
        await showAlert('Modèle créé avec succès', 'success');
      }
      resetForm();
      fetchCarModels();
    } catch (error) {
      await showAlert(
        error.response?.data?.errors?.[0] || 'Erreur lors de l\'enregistrement',
        'error'
      );
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm(
      'Êtes-vous sûr de vouloir supprimer ce modèle ?',
      'Supprimer le modèle'
    );

    if (!confirmed) return;

    try {
      await carModelsAPI.delete(id);
      await showAlert('Modèle supprimé avec succès', 'success');
      fetchCarModels();
    } catch (error) {
      await showAlert(
        error.response?.data?.error || 'Erreur lors de la suppression',
        'error'
      );
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingModel(null);
    setFormData({ name: '', active: true });
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
          Modèles de Véhicules
        </h2>
        <button
          onClick={handleCreate}
          style={{
            backgroundColor: '#167bff',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          + Nouveau Modèle
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Chargement...</div>
      ) : (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600' }}>
                  Nom
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600' }}>
                  Statut
                </th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {carModels.map((model) => (
                <tr key={model.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px', fontSize: '14px' }}>{model.name}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: model.active ? '#d1fae5' : '#fee2e2',
                      color: model.active ? '#065f46' : '#991b1b'
                    }}>
                      {model.active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleEdit(model)}
                      style={{
                        marginRight: '8px',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: '1px solid #167bff',
                        backgroundColor: 'white',
                        color: '#167bff',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(model.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: '1px solid #dc2626',
                        backgroundColor: 'white',
                        color: '#dc2626',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {carModels.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
              Aucun modèle enregistré
            </div>
          )}
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
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '30px',
            maxWidth: '400px',
            width: '100%'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold' }}>
              {editingModel ? 'Modifier le modèle' : 'Nouveau modèle'}
            </h3>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                  Nom *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    style={{ marginRight: '8px' }}
                  />
                  <span style={{ fontSize: '14px' }}>Actif</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
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
                  {editingModel ? 'Modifier' : 'Créer'}
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
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
