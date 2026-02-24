import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { expenseCategoriesAPI } from '../services/api';
import { useDialog } from '../context/DialogContext';

const TYPE_LABELS = { reparation: 'Réparation', purchase: 'Achat' };
const TYPE_COLORS = {
  reparation: { bg: '#fef3c7', color: '#92400e' },
  purchase: { bg: '#dbeafe', color: '#1e40af' },
};

export default function ExpenseCategoryStats() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useDialog();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await expenseCategoriesAPI.stats(id);
        setData(response.data);
      } catch (error) {
        await showAlert('Erreur lors du chargement des statistiques', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [id]);

  const formatAmount = (amount) =>
    new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount) + ' MRU';

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
        Chargement...
      </div>
    );
  }

  const category = data?.category;
  const stats = data?.stats || [];
  const typeStyle = TYPE_COLORS[category?.expense_type] || {};

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button
          onClick={() => navigate('/settings/expense-categories')}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
            backgroundColor: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#374151',
          }}
        >
          ← Retour
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
            Prix moyens — {category?.name}
          </h2>
          <div style={{ marginTop: '4px' }}>
            <span style={{
              display: 'inline-block',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '500',
              backgroundColor: typeStyle.bg,
              color: typeStyle.color,
            }}>
              {TYPE_LABELS[category?.expense_type]}
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
      }}>
        {stats.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
            Aucune dépense enregistrée pour cette catégorie.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                  Modèle / Année
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                  Occurrences
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                  Moyenne
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                  Min
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                  Max
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                  Total dépensé
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.map((row, index) => (
                <tr
                  key={row.car_model.id}
                  style={{ borderBottom: index < stats.length - 1 ? '1px solid #e5e7eb' : 'none' }}
                >
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '500' }}>
                    {row.car_model.name} <span style={{ color: '#6b7280', fontWeight: '400' }}>{row.car_model.year}</span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', color: '#6b7280' }}>
                    {row.count}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    {formatAmount(row.average_amount)}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', color: '#059669' }}>
                    {formatAmount(row.min_amount)}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', color: '#dc2626' }}>
                    {formatAmount(row.max_amount)}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', color: '#6b7280' }}>
                    {formatAmount(row.total_amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary */}
      {stats.length > 0 && (
        <p style={{ marginTop: '12px', fontSize: '13px', color: '#9ca3af' }}>
          {stats.length} modèle{stats.length > 1 ? 's' : ''} · trié par moyenne décroissante
        </p>
      )}
    </div>
  );
}
