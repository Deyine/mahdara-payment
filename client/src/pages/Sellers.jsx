import { useState, useEffect } from 'react';
import { useDialog } from '../context/DialogContext';
import { sellersAPI } from '../services/api';

export default function Sellers() {
  const { showAlert, showConfirm } = useDialog();
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSeller, setEditingSeller] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    active: true
  });

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const response = await sellersAPI.getAll();
      setSellers(response.data);
    } catch (error) {
      await showAlert('Erreur lors du chargement des vendeurs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSeller(null);
    setFormData({ name: '', location: '', active: true });
    setShowForm(true);
  };

  const handleEdit = (seller) => {
    setEditingSeller(seller);
    setFormData({
      name: seller.name,
      location: seller.location || '',
      active: seller.active
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingSeller) {
        await sellersAPI.update(editingSeller.id, formData);
        await showAlert('Vendeur modifié avec succès', 'success');
      } else {
        await sellersAPI.create(formData);
        await showAlert('Vendeur créé avec succès', 'success');
      }
      resetForm();
      fetchSellers();
    } catch (error) {
      await showAlert(
        error.response?.data?.errors?.[0] || 'Erreur lors de l\'enregistrement',
        'error'
      );
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm(
      'Êtes-vous sûr de vouloir supprimer ce vendeur ?',
      'Supprimer le vendeur'
    );

    if (!confirmed) return;

    try {
      await sellersAPI.delete(id);
      await showAlert('Vendeur supprimé avec succès', 'success');
      fetchSellers();
    } catch (error) {
      await showAlert(
        error.response?.data?.error || 'Erreur lors de la suppression',
        'error'
      );
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingSeller(null);
    setFormData({ name: '', location: '', active: true });
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
          Vendeurs
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
          + Nouveau Vendeur
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
                  Localisation
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
              {sellers.map((seller) => (
                <tr key={seller.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px', fontSize: '14px' }}>
                    {seller.name}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>
                    {seller.location || '-'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: seller.active ? '#dcfce7' : '#f3f4f6',
                      color: seller.active ? '#166534' : '#6b7280'
                    }}>
                      {seller.active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleEdit(seller)}
                        style={{
                          backgroundColor: '#f3f4f6',
                          color: '#374151',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(seller.id)}
                        style={{
                          backgroundColor: '#fef2f2',
                          color: '#dc2626',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {sellers.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
              Aucun vendeur trouvé
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div
          style={{
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
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '500px',
              padding: '24px'
            }}
          >
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold' }}>
              {editingSeller ? 'Modifier le Vendeur' : 'Nouveau Vendeur'}
            </h3>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                  Nom *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px'
                  }}
                  placeholder="Ex: Copart Auto Auction"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                  Localisation
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px'
                  }}
                  placeholder="Ex: Dallas, TX"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    style={{ marginRight: '8px' }}
                  />
                  Actif
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '4px',
                    border: '1px solid #d1d5db',
                    backgroundColor: 'white',
                    color: '#374151',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: '#167bff',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  {editingSeller ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
