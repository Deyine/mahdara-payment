import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { timeTrackingAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showAlert, showConfirm } = useDialog();

  const [task, setTask] = useState(null);
  const [timeEntries, setTimeEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningEntry, setRunningEntry] = useState(null);

  useEffect(() => {
    fetchTask();
    fetchTimeEntries();
  }, [id]);

  const fetchTask = async () => {
    try {
      const response = await timeTrackingAPI.tasks.getOne(id);
      setTask(response.data);
    } catch (error) {
      console.error('Error fetching task:', error);
      await showAlert('Erreur lors du chargement de la tâche', 'error');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeEntries = async () => {
    try {
      const response = await timeTrackingAPI.timeEntries.getAll({ taskId: id });
      setTimeEntries(response.data);

      // Find running entry
      const running = response.data.find(entry => entry.running);
      setRunningEntry(running || null);
    } catch (error) {
      console.error('Error fetching time entries:', error);
    }
  };

  const handleStartTimer = async () => {
    try {
      const data = {
        task_id: id,
        title: 'Session de travail',
        start_time: new Date().toISOString()
      };

      await timeTrackingAPI.timeEntries.create(data);
      await showAlert('Chronomètre démarré', 'success');
      fetchTimeEntries();
      fetchTask();
    } catch (error) {
      console.error('Error starting timer:', error);
      const message = error.response?.data?.errors?.[0] || error.response?.data?.error || 'Erreur lors du démarrage';
      await showAlert(message, 'error');
    }
  };

  const handleStopTimer = async (entry) => {
    try {
      await timeTrackingAPI.timeEntries.stop(entry.id);
      await showAlert('Chronomètre arrêté', 'success');
      fetchTimeEntries();
      fetchTask();
    } catch (error) {
      console.error('Error stopping timer:', error);
      const message = error.response?.data?.error || 'Erreur lors de l\'arrêt';
      await showAlert(message, 'error');
    }
  };

  const handleDeleteEntry = async (entry) => {
    const confirmed = await showConfirm(
      'Êtes-vous sûr de vouloir supprimer cette entrée ?',
      'Supprimer l\'entrée'
    );

    if (!confirmed) return;

    try {
      await timeTrackingAPI.timeEntries.delete(entry.id);
      await showAlert('Entrée supprimée avec succès', 'success');
      fetchTimeEntries();
      fetchTask();
    } catch (error) {
      console.error('Error deleting entry:', error);
      const message = error.response?.data?.error || 'Erreur lors de la suppression';
      await showAlert(message, 'error');
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getElapsedTime = (startTime) => {
    const start = new Date(startTime);
    const now = new Date();
    const seconds = Math.floor((now - start) / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const canEditEntry = (entry) => {
    return user?.id === entry.user_id || user?.role === 'admin' || user?.role === 'super_admin';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#167bff' }}></div>
      </div>
    );
  }

  if (!task) return null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(`/projects/${task.project_id}`)}
          className="mb-4 flex items-center gap-2 text-sm font-medium"
          style={{ color: '#167bff' }}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour au projet
        </button>

        <div className="flex justify-between items-start">
          <div>
            <div className="text-sm mb-2" style={{ color: '#64748b' }}>
              {task.project?.label}
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#1e293b' }}>{task.title}</h1>
            {task.description && (
              <p className="text-sm" style={{ color: '#64748b' }}>{task.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats and Timer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm" style={{ border: '1px solid #e2e8f0' }}>
          <div className="text-sm mb-1" style={{ color: '#64748b' }}>Temps Total</div>
          <div className="text-2xl font-bold" style={{ color: '#1e293b' }}>{task.total_time_formatted}</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm" style={{ border: '1px solid #e2e8f0' }}>
          <div className="text-sm mb-1" style={{ color: '#64748b' }}>Entrées</div>
          <div className="text-2xl font-bold" style={{ color: '#1e293b' }}>{task.entries_count}</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm" style={{ border: '1px solid #e2e8f0' }}>
          {runningEntry ? (
            <div>
              <div className="text-sm mb-2" style={{ color: '#10b981' }}>⏱️ Chronomètre en cours</div>
              <div className="text-xl font-bold mb-2" style={{ color: '#1e293b' }}>
                {getElapsedTime(runningEntry.start_time)}
              </div>
              {runningEntry.user_id === user?.id && (
                <button
                  onClick={() => handleStopTimer(runningEntry)}
                  className="px-3 py-1 rounded text-sm font-medium transition-colors text-white"
                  style={{ backgroundColor: '#ef4444' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
                >
                  Arrêter
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={handleStartTimer}
              className="w-full py-3 rounded-lg font-medium transition-colors text-white"
              style={{ backgroundColor: '#10b981' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
            >
              ▶️ Démarrer le Chronomètre
            </button>
          )}
        </div>
      </div>

      {/* Time Entries List */}
      <div className="bg-white rounded-lg shadow-sm" style={{ border: '1px solid #e2e8f0' }}>
        <div className="p-4 border-b" style={{ borderColor: '#e2e8f0' }}>
          <h2 className="text-lg font-bold" style={{ color: '#1e293b' }}>Entrées de Temps</h2>
        </div>

        {timeEntries.length === 0 ? (
          <div className="p-8 text-center" style={{ color: '#64748b' }}>
            <p>Aucune entrée de temps trouvée</p>
            <p className="text-sm mt-2">Démarrez le chronomètre pour commencer</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: '#e2e8f0' }}>
            {timeEntries.map((entry) => (
              <div key={entry.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium" style={{ color: '#1e293b' }}>{entry.title}</h3>
                      {entry.running && (
                        <span
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{ backgroundColor: '#dcfce7', color: '#166534' }}
                        >
                          En cours
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm mb-2" style={{ color: '#64748b' }}>
                      <span>👤 {entry.user?.name}</span>
                      <span>📅 {formatDateTime(entry.start_time)}</span>
                      {entry.end_time && (
                        <span>→ {formatDateTime(entry.end_time)}</span>
                      )}
                    </div>

                    <div className="text-lg font-bold" style={{ color: entry.running ? '#10b981' : '#1e293b' }}>
                      {entry.duration_formatted}
                    </div>

                    {entry.notes && (
                      <p className="text-sm mt-2" style={{ color: '#64748b' }}>{entry.notes}</p>
                    )}
                  </div>

                  {canEditEntry(entry) && (
                    <div className="flex gap-2">
                      {entry.running && entry.user_id === user?.id && (
                        <button
                          onClick={() => handleStopTimer(entry)}
                          className="p-2 hover:bg-gray-100 rounded"
                          style={{ color: '#ef4444' }}
                          title="Arrêter"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteEntry(entry)}
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
    </div>
  );
}
