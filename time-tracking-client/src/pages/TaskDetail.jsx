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
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [entryFormData, setEntryFormData] = useState({
    title: '',
    hours: '',
    minutes: '',
    entry_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

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
    } catch (error) {
      console.error('Error fetching time entries:', error);
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    const hours = parseInt(entryFormData.hours) || 0;
    const minutes = parseInt(entryFormData.minutes) || 0;
    const totalMinutes = hours * 60 + minutes;

    if (totalMinutes <= 0) {
      await showAlert('Veuillez saisir une durée valide', 'error');
      return;
    }

    try {
      await timeTrackingAPI.timeEntries.create({
        task_id: id,
        title: entryFormData.title || 'Session de travail',
        duration_minutes: totalMinutes,
        entry_date: entryFormData.entry_date,
        notes: entryFormData.notes || null
      });
      await showAlert('Temps enregistré', 'success');
      setShowEntryForm(false);
      setEntryFormData({
        title: '',
        hours: '',
        minutes: '',
        entry_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      fetchTimeEntries();
      fetchTask();
    } catch (error) {
      const message = error.response?.data?.errors?.[0] || 'Erreur lors de l\'enregistrement';
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
      const message = error.response?.data?.error || 'Erreur lors de la suppression';
      await showAlert(message, 'error');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatMinutes = (totalMinutes) => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h ${m}m`;
  };

  const canEditEntry = (entry) => {
    return user?.id === entry.user_id || user?.role === 'admin' || user?.role === 'super_admin';
  };

  const progressPercent = task?.estimated_minutes
    ? Math.min(100, Math.round((task.total_time_minutes / task.estimated_minutes) * 100))
    : null;

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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm" style={{ border: '1px solid #e2e8f0' }}>
          <div className="text-sm mb-1" style={{ color: '#64748b' }}>Temps Consommé</div>
          <div className="text-2xl font-bold" style={{ color: '#1e293b' }}>{task.total_time_formatted}</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm" style={{ border: '1px solid #e2e8f0' }}>
          <div className="text-sm mb-1" style={{ color: '#64748b' }}>Temps Estimé</div>
          <div className="text-2xl font-bold" style={{ color: '#1e293b' }}>
            {task.estimated_time_formatted || '—'}
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm" style={{ border: '1px solid #e2e8f0' }}>
          <div className="text-sm mb-1" style={{ color: '#64748b' }}>Entrées</div>
          <div className="text-2xl font-bold" style={{ color: '#1e293b' }}>{task.entries_count}</div>
        </div>
      </div>

      {/* Progress bar */}
      {progressPercent !== null && (
        <div className="bg-white rounded-lg p-4 shadow-sm mb-6" style={{ border: '1px solid #e2e8f0' }}>
          <div className="flex justify-between text-sm mb-2">
            <span style={{ color: '#64748b' }}>Progression</span>
            <span style={{ color: progressPercent > 100 ? '#ef4444' : '#1e293b', fontWeight: '600' }}>
              {progressPercent}%
            </span>
          </div>
          <div style={{ height: '8px', borderRadius: '4px', backgroundColor: '#e2e8f0' }}>
            <div style={{
              height: '100%',
              borderRadius: '4px',
              width: `${Math.min(progressPercent, 100)}%`,
              backgroundColor: progressPercent > 100 ? '#ef4444' : progressPercent > 80 ? '#f59e0b' : '#10b981',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      )}

      {/* Log time button / form */}
      <div className="mb-6">
        {!showEntryForm ? (
          <button
            onClick={() => setShowEntryForm(true)}
            className="px-4 py-2 rounded-lg font-medium text-white transition-colors"
            style={{ backgroundColor: '#167bff' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#1266d9'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#167bff'}
          >
            + Enregistrer du temps
          </button>
        ) : (
          <div className="bg-white rounded-lg p-5 shadow-sm" style={{ border: '1px solid #e2e8f0' }}>
            <h3 className="text-base font-bold mb-4" style={{ color: '#1e293b' }}>Enregistrer du temps</h3>
            <form onSubmit={handleAddEntry}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Titre
                </label>
                <input
                  type="text"
                  value={entryFormData.title}
                  onChange={(e) => setEntryFormData({ ...entryFormData, title: e.target.value })}
                  placeholder="Session de travail"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                    Heures
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={entryFormData.hours}
                    onChange={(e) => setEntryFormData({ ...entryFormData, hours: e.target.value })}
                    placeholder="0"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                    Minutes
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={entryFormData.minutes}
                    onChange={(e) => setEntryFormData({ ...entryFormData, minutes: e.target.value })}
                    placeholder="0"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                    Date
                  </label>
                  <input
                    type="date"
                    value={entryFormData.entry_date}
                    onChange={(e) => setEntryFormData({ ...entryFormData, entry_date: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Notes
                </label>
                <textarea
                  value={entryFormData.notes}
                  onChange={(e) => setEntryFormData({ ...entryFormData, notes: e.target.value })}
                  placeholder="Notes optionnelles..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-medium text-white"
                  style={{ backgroundColor: '#167bff' }}
                >
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={() => setShowEntryForm(false)}
                  className="px-4 py-2 rounded-lg font-medium"
                  style={{ border: '1px solid #ddd', backgroundColor: 'white' }}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Time Entries List */}
      <div className="bg-white rounded-lg shadow-sm" style={{ border: '1px solid #e2e8f0' }}>
        <div className="p-4 border-b" style={{ borderColor: '#e2e8f0' }}>
          <h2 className="text-lg font-bold" style={{ color: '#1e293b' }}>Entrées de Temps</h2>
        </div>

        {timeEntries.length === 0 ? (
          <div className="p-8 text-center" style={{ color: '#64748b' }}>
            <p>Aucune entrée de temps enregistrée</p>
            <p className="text-sm mt-2">Cliquez sur "Enregistrer du temps" pour commencer</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: '#e2e8f0' }}>
            {timeEntries.map((entry) => (
              <div key={entry.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium mb-1" style={{ color: '#1e293b' }}>{entry.title}</h3>

                    <div className="flex items-center gap-4 text-sm mb-1" style={{ color: '#64748b' }}>
                      <span>{entry.user?.name}</span>
                      <span>{formatDate(entry.entry_date)}</span>
                    </div>

                    <div className="text-lg font-bold" style={{ color: '#1e293b' }}>
                      {entry.duration_formatted}
                    </div>

                    {entry.notes && (
                      <p className="text-sm mt-2" style={{ color: '#64748b' }}>{entry.notes}</p>
                    )}
                  </div>

                  {canEditEntry(entry) && (
                    <button
                      onClick={() => handleDeleteEntry(entry)}
                      className="p-2 hover:bg-gray-100 rounded"
                      style={{ color: '#64748b' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
                      title="Supprimer"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
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
