import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { timeTrackingAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    label: '',
    description: '',
    status: 'active'
  });

  const navigate = useNavigate();
  const { canManageProjects: canWrite } = useAuth();
  const { showAlert, showConfirm } = useDialog();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await timeTrackingAPI.projects.getAll();
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      await showAlert('Erreur lors du chargement des projets', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingProject(null);
    setFormData({ label: '', description: '', status: 'active' });
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      label: project.label,
      description: project.description || '',
      status: project.status
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingProject) {
        await timeTrackingAPI.projects.update(editingProject.id, formData);
        await showAlert('Projet modifié avec succès', 'success');
      } else {
        await timeTrackingAPI.projects.create(formData);
        await showAlert('Projet créé avec succès', 'success');
      }
      resetForm();
      fetchProjects();
    } catch (error) {
      console.error('Error saving project:', error);
      const message = error.response?.data?.errors?.[0] || error.response?.data?.error || 'Erreur lors de l\'enregistrement';
      await showAlert(message, 'error');
    }
  };

  const handleDelete = async (project) => {
    const confirmed = await showConfirm(
      `Êtes-vous sûr de vouloir supprimer le projet "${project.label}" ?`,
      'Supprimer le projet'
    );

    if (!confirmed) return;

    try {
      await timeTrackingAPI.projects.delete(project.id);
      await showAlert('Projet supprimé avec succès', 'success');
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      const message = error.response?.data?.error || 'Erreur lors de la suppression';
      await showAlert(message, 'error');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      draft: { bg: '#f3f4f6', color: '#6b7280', label: 'Brouillon' },
      active: { bg: '#dbeafe', color: '#1e40af', label: 'Actif' },
      completed: { bg: '#dcfce7', color: '#166534', label: 'Terminé' },
      archived: { bg: '#f3f4f6', color: '#6b7280', label: 'Archivé' }
    };
    const style = styles[status] || styles.active;

    return (
      <span
        className="px-2 py-1 rounded text-xs font-medium"
        style={{ backgroundColor: style.bg, color: style.color }}
      >
        {style.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#167bff' }}></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#1e293b' }}>Suivi du Temps</h1>
        {canWrite && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-lg font-medium transition-colors text-white"
            style={{ backgroundColor: '#167bff' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#0d5dd6'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#167bff'}
          >
            + Nouveau Projet
          </button>
        )}
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-lg shadow-sm" style={{ border: '1px solid #e2e8f0' }}>
        {projects.length === 0 ? (
          <div className="p-8 text-center" style={{ color: '#64748b' }}>
            <p>Aucun projet trouvé</p>
            {canWrite && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 px-4 py-2 rounded-lg font-medium transition-colors text-white"
                style={{ backgroundColor: '#167bff' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#0d5dd6'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#167bff'}
              >
                Créer le premier projet
              </button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead style={{ backgroundColor: '#fafbfc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#64748b' }}>
                  Projet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#64748b' }}>
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#64748b' }}>
                  Tâches
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#64748b' }}>
                  Temps
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#64748b' }}>
                  Créé par
                </th>
                {canWrite && (
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#64748b' }}>
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#e2e8f0' }}>
              {projects.map((project) => (
                <tr
                  key={project.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium" style={{ color: '#1e293b' }}>{project.label}</div>
                      {project.description && (
                        <div className="text-sm" style={{ color: '#64748b' }}>{project.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(project.status)}
                  </td>
                  <td className="px-6 py-4" style={{ color: '#475569' }}>
                    {project.completed_tasks_count} / {project.tasks_count}
                  </td>
                  <td className="px-6 py-4 font-medium" style={{ color: '#1e293b' }}>
                    {project.total_time_formatted}
                    {project.total_estimated_minutes > 0 && (
                      <span style={{ color: '#64748b', fontWeight: 'normal' }}> / {project.total_estimated_formatted}</span>
                    )}
                  </td>
                  <td className="px-6 py-4" style={{ color: '#475569' }}>
                    {project.user?.name}
                  </td>
                  {canWrite && (
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleEdit(project)}
                        className="mr-2 p-2 hover:bg-gray-100 rounded"
                        style={{ color: '#167bff' }}
                        title="Modifier"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(project)}
                        className="p-2 hover:bg-gray-100 rounded"
                        style={{ color: '#64748b' }}
                        onMouseEnter={(e) => e.target.style.color = '#ef4444'}
                        onMouseLeave={(e) => e.target.style.color = '#64748b'}
                        title="Supprimer"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: '#e2e8f0' }}>
                <h3 className="text-xl font-bold" style={{ color: '#1e293b' }}>
                  {editingProject ? 'Modifier le Projet' : 'Nouveau Projet'}
                </h3>
                <button onClick={resetForm} style={{ color: '#64748b' }}>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#1e293b' }}>
                    Nom du Projet *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg transition-colors"
                    style={{ border: '1px solid #e2e8f0', color: '#1e293b' }}
                    onFocus={(e) => e.target.style.borderColor = '#167bff'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    placeholder="Ex: Développement Application Mobile"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#1e293b' }}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg transition-colors"
                    style={{ border: '1px solid #e2e8f0', color: '#1e293b' }}
                    onFocus={(e) => e.target.style.borderColor = '#167bff'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    placeholder="Description du projet..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#1e293b' }}>
                    Statut *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg transition-colors"
                    style={{ border: '1px solid #e2e8f0', color: '#1e293b' }}
                    onFocus={(e) => e.target.style.borderColor = '#167bff'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    required
                  >
                    <option value="draft">Brouillon</option>
                    <option value="active">Actif</option>
                    <option value="completed">Terminé</option>
                    <option value="archived">Archivé</option>
                  </select>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 rounded-lg font-medium transition-colors"
                    style={{ backgroundColor: '#fafbfc', border: '1px solid #e2e8f0', color: '#475569' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#fafbfc'}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg font-medium transition-colors text-white"
                    style={{ backgroundColor: '#167bff' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#0d5dd6'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#167bff'}
                  >
                    {editingProject ? 'Enregistrer' : 'Créer'}
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
