import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { timeTrackingAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canWrite } = useAuth();
  const { showAlert, showConfirm } = useDialog();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    status: 'active'
  });

  useEffect(() => {
    fetchProject();
    fetchTasks();
  }, [id]);

  const fetchProject = async () => {
    try {
      const response = await timeTrackingAPI.projects.getOne(id);
      setProject(response.data);
    } catch (error) {
      console.error('Error fetching project:', error);
      await showAlert('Erreur lors du chargement du projet', 'error');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await timeTrackingAPI.tasks.getAll({ projectId: id });
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const resetTaskForm = () => {
    setShowTaskForm(false);
    setEditingTask(null);
    setTaskFormData({ title: '', description: '', status: 'active' });
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setTaskFormData({
      title: task.title,
      description: task.description || '',
      status: task.status
    });
    setShowTaskForm(true);
  };

  const handleSubmitTask = async (e) => {
    e.preventDefault();

    try {
      const data = { ...taskFormData, project_id: id };

      if (editingTask) {
        await timeTrackingAPI.tasks.update(editingTask.id, data);
        await showAlert('Tâche modifiée avec succès', 'success');
      } else {
        await timeTrackingAPI.tasks.create(data);
        await showAlert('Tâche créée avec succès', 'success');
      }
      resetTaskForm();
      fetchTasks();
      fetchProject(); // Update project stats
    } catch (error) {
      console.error('Error saving task:', error);
      const message = error.response?.data?.errors?.[0] || error.response?.data?.error || 'Erreur lors de l\'enregistrement';
      await showAlert(message, 'error');
    }
  };

  const handleDeleteTask = async (task) => {
    const confirmed = await showConfirm(
      `Êtes-vous sûr de vouloir supprimer la tâche "${task.title}" ?`,
      'Supprimer la tâche'
    );

    if (!confirmed) return;

    try {
      await timeTrackingAPI.tasks.delete(task.id);
      await showAlert('Tâche supprimée avec succès', 'success');
      fetchTasks();
      fetchProject();
    } catch (error) {
      console.error('Error deleting task:', error);
      const message = error.response?.data?.error || 'Erreur lors de la suppression';
      await showAlert(message, 'error');
    }
  };

  const handleCompleteTask = async (task) => {
    try {
      await timeTrackingAPI.tasks.complete(task.id);
      await showAlert('Tâche marquée comme terminée', 'success');
      fetchTasks();
      fetchProject();
    } catch (error) {
      console.error('Error completing task:', error);
      const message = error.response?.data?.error || 'Erreur lors de la mise à jour';
      await showAlert(message, 'error');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
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

  if (!project) return null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="mb-4 flex items-center gap-2 text-sm font-medium"
          style={{ color: '#167bff' }}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour aux projets
        </button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#1e293b' }}>{project.label}</h1>
            {project.description && (
              <p className="text-sm" style={{ color: '#64748b' }}>{project.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2">
              {getStatusBadge(project.status)}
              <span className="text-sm" style={{ color: '#64748b' }}>
                Créé par {project.user?.name}
              </span>
            </div>
          </div>
          {canWrite && (
            <button
              onClick={() => setShowTaskForm(true)}
              className="px-4 py-2 rounded-lg font-medium transition-colors text-white"
              style={{ backgroundColor: '#167bff' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#0d5dd6'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#167bff'}
            >
              + Nouvelle Tâche
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm" style={{ border: '1px solid #e2e8f0' }}>
          <div className="text-sm mb-1" style={{ color: '#64748b' }}>Temps Total</div>
          <div className="text-2xl font-bold" style={{ color: '#1e293b' }}>{project.total_time_formatted}</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm" style={{ border: '1px solid #e2e8f0' }}>
          <div className="text-sm mb-1" style={{ color: '#64748b' }}>Tâches</div>
          <div className="text-2xl font-bold" style={{ color: '#1e293b' }}>{project.tasks_count}</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm" style={{ border: '1px solid #e2e8f0' }}>
          <div className="text-sm mb-1" style={{ color: '#64748b' }}>Tâches Terminées</div>
          <div className="text-2xl font-bold" style={{ color: '#1e293b' }}>{project.completed_tasks_count}</div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-lg shadow-sm" style={{ border: '1px solid #e2e8f0' }}>
        <div className="p-4 border-b" style={{ borderColor: '#e2e8f0' }}>
          <h2 className="text-lg font-bold" style={{ color: '#1e293b' }}>Tâches</h2>
        </div>

        {tasks.length === 0 ? (
          <div className="p-8 text-center" style={{ color: '#64748b' }}>
            <p>Aucune tâche trouvée</p>
            {canWrite && (
              <button
                onClick={() => setShowTaskForm(true)}
                className="mt-4 px-4 py-2 rounded-lg font-medium transition-colors text-white"
                style={{ backgroundColor: '#167bff' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#0d5dd6'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#167bff'}
              >
                Créer la première tâche
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: '#e2e8f0' }}>
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => navigate(`/tasks/${task.id}`)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium" style={{ color: '#1e293b' }}>{task.title}</h3>
                      {getStatusBadge(task.status)}
                    </div>
                    {task.description && (
                      <p className="text-sm mb-2" style={{ color: '#64748b' }}>{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm" style={{ color: '#64748b' }}>
                      <span>⏱️ {task.total_time_formatted}</span>
                      <span>📝 {task.entries_count} entrées</span>
                    </div>
                  </div>

                  {canWrite && (
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      {task.status === 'active' && (
                        <button
                          onClick={() => handleCompleteTask(task)}
                          className="p-2 hover:bg-gray-100 rounded"
                          style={{ color: '#10b981' }}
                          title="Marquer comme terminée"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleEditTask(task)}
                        className="p-2 hover:bg-gray-100 rounded"
                        style={{ color: '#167bff' }}
                        title="Modifier"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task)}
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
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: '#e2e8f0' }}>
                <h3 className="text-xl font-bold" style={{ color: '#1e293b' }}>
                  {editingTask ? 'Modifier la Tâche' : 'Nouvelle Tâche'}
                </h3>
                <button onClick={resetTaskForm} style={{ color: '#64748b' }}>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmitTask} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#1e293b' }}>
                    Titre de la Tâche *
                  </label>
                  <input
                    type="text"
                    required
                    value={taskFormData.title}
                    onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg transition-colors"
                    style={{ border: '1px solid #e2e8f0', color: '#1e293b' }}
                    onFocus={(e) => e.target.style.borderColor = '#167bff'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    placeholder="Ex: Développer l'interface utilisateur"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#1e293b' }}>
                    Description
                  </label>
                  <textarea
                    value={taskFormData.description}
                    onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg transition-colors"
                    style={{ border: '1px solid #e2e8f0', color: '#1e293b' }}
                    onFocus={(e) => e.target.style.borderColor = '#167bff'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    placeholder="Description de la tâche..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#1e293b' }}>
                    Statut *
                  </label>
                  <select
                    value={taskFormData.status}
                    onChange={(e) => setTaskFormData({ ...taskFormData, status: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg transition-colors"
                    style={{ border: '1px solid #e2e8f0', color: '#1e293b' }}
                    onFocus={(e) => e.target.style.borderColor = '#167bff'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    required
                  >
                    <option value="active">Actif</option>
                    <option value="completed">Terminé</option>
                    <option value="archived">Archivé</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetTaskForm}
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
                    {editingTask ? 'Enregistrer' : 'Créer'}
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
