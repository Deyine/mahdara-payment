import { useState, useEffect } from 'react';
import { useDialog } from '../context/DialogContext';
import { projectsAPI, projectExpensesAPI, projectExpenseCategoriesAPI } from '../services/api';
import { formatNumber } from '../utils/formatters';

export default function Projects() {
  const { showAlert, showConfirm } = useDialog();
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [currentProject, setCurrentProject] = useState(null);
  const [expandedProjects, setExpandedProjects] = useState({});
  const [projectExpenses, setProjectExpenses] = useState({});

  const [projectFormData, setProjectFormData] = useState({
    name: '',
    description: '',
    active: true
  });

  const [expenseFormData, setExpenseFormData] = useState({
    project_id: '',
    project_expense_category_id: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    description: ''
  });

  useEffect(() => {
    fetchProjects();
    fetchCategories();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.getAll();
      setProjects(response.data);
    } catch (error) {
      await showAlert('Erreur lors du chargement des projets', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await projectExpenseCategoriesAPI.getActive();
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const fetchProjectExpenses = async (projectId) => {
    try {
      const response = await projectExpensesAPI.getAll(projectId);
      setProjectExpenses(prev => ({
        ...prev,
        [projectId]: response.data
      }));
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  };

  const toggleProjectExpand = async (projectId) => {
    const isExpanded = expandedProjects[projectId];

    if (!isExpanded) {
      await fetchProjectExpenses(projectId);
    }

    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !isExpanded
    }));
  };

  const handleCreateProject = () => {
    setEditingProject(null);
    setProjectFormData({ name: '', description: '', active: true });
    setShowProjectForm(true);
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setProjectFormData({
      name: project.name,
      description: project.description || '',
      active: project.active
    });
    setShowProjectForm(true);
  };

  const handleSubmitProject = async (e) => {
    e.preventDefault();

    try {
      if (editingProject) {
        await projectsAPI.update(editingProject.id, projectFormData);
        resetProjectForm();
        fetchProjects();
        await showAlert('Projet modifié avec succès', 'success');
      } else {
        await projectsAPI.create(projectFormData);
        resetProjectForm();
        fetchProjects();
        await showAlert('Projet créé avec succès', 'success');
      }
    } catch (error) {
      await showAlert(
        error.response?.data?.errors?.[0] || 'Erreur lors de l\'enregistrement',
        'error'
      );
    }
  };

  const handleDeleteProject = async (id) => {
    const confirmed = await showConfirm(
      'Êtes-vous sûr de vouloir supprimer ce projet ?',
      'Supprimer le projet'
    );

    if (!confirmed) return;

    try {
      await projectsAPI.delete(id);
      await showAlert('Projet supprimé avec succès', 'success');
      fetchProjects();
    } catch (error) {
      await showAlert(
        error.response?.data?.error || 'Erreur lors de la suppression',
        'error'
      );
    }
  };

  const handleCreateExpense = (project) => {
    setCurrentProject(project);
    setEditingExpense(null);
    setExpenseFormData({
      project_id: project.id,
      project_expense_category_id: '',
      amount: '',
      expense_date: new Date().toISOString().split('T')[0],
      description: ''
    });
    setShowExpenseForm(true);
  };

  const handleEditExpense = (expense, project) => {
    setCurrentProject(project);
    setEditingExpense(expense);
    setExpenseFormData({
      project_id: expense.project.id,
      project_expense_category_id: expense.project_expense_category.id.toString(),
      amount: expense.amount,
      expense_date: expense.expense_date,
      description: expense.description || ''
    });
    setShowExpenseForm(true);
  };

  const handleSubmitExpense = async (e) => {
    e.preventDefault();

    try {
      if (editingExpense) {
        await projectExpensesAPI.update(editingExpense.id, expenseFormData);
        resetExpenseForm();
        fetchProjects();
        await fetchProjectExpenses(currentProject.id);
        await showAlert('Dépense modifiée avec succès', 'success');
      } else {
        await projectExpensesAPI.create(expenseFormData);
        resetExpenseForm();
        fetchProjects();
        await fetchProjectExpenses(currentProject.id);
        await showAlert('Dépense ajoutée avec succès', 'success');
      }
    } catch (error) {
      await showAlert(
        error.response?.data?.errors?.[0] || 'Erreur lors de l\'enregistrement',
        'error'
      );
    }
  };

  const handleDeleteExpense = async (expenseId, projectId) => {
    const confirmed = await showConfirm(
      'Êtes-vous sûr de vouloir supprimer cette dépense ?',
      'Supprimer la dépense'
    );

    if (!confirmed) return;

    try {
      await projectExpensesAPI.delete(expenseId);
      await showAlert('Dépense supprimée avec succès', 'success');
      fetchProjects();
      await fetchProjectExpenses(projectId);
    } catch (error) {
      await showAlert('Erreur lors de la suppression', 'error');
    }
  };

  const resetProjectForm = () => {
    setShowProjectForm(false);
    setEditingProject(null);
    setProjectFormData({ name: '', description: '', active: true });
  };

  const resetExpenseForm = () => {
    setShowExpenseForm(false);
    setEditingExpense(null);
    setCurrentProject(null);
    setExpenseFormData({
      project_id: '',
      project_expense_category_id: '',
      amount: '',
      expense_date: new Date().toISOString().split('T')[0],
      description: ''
    });
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>
          🏗️ Projets
        </h2>
        <button
          onClick={handleCreateProject}
          style={{
            backgroundColor: '#167bff',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          + Nouveau Projet
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
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', width: '30px' }}>

                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600' }}>
                  Nom
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600' }}>
                  Description
                </th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600' }}>
                  Nb Dépenses
                </th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600' }}>
                  Total Dépenses
                </th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                    Aucun projet trouvé
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <>
                    <tr key={project.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px' }}>
                        <button
                          onClick={() => toggleProjectExpand(project.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '18px',
                            padding: 0
                          }}
                        >
                          {expandedProjects[project.id] ? '▼' : '▶'}
                        </button>
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500' }}>
                        {project.name}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#64748b' }}>
                        {project.description || '-'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px' }}>
                        {project.expense_count}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600' }}>
                        {formatNumber(project.total_expenses)} MRU
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleEditProject(project)}
                          style={{
                            marginRight: '8px',
                            color: '#167bff',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '18px'
                          }}
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          style={{
                            color: '#64748b',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '18px'
                          }}
                          title="Supprimer"
                          onMouseEnter={(e) => e.target.style.color = '#ef4444'}
                          onMouseLeave={(e) => e.target.style.color = '#64748b'}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>

                    {/* Expanded expenses section */}
                    {expandedProjects[project.id] && (
                      <tr>
                        <td colSpan="6" style={{ padding: 0, backgroundColor: '#fafbfc' }}>
                          <div style={{ padding: '20px' }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '15px'
                            }}>
                              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                                Dépenses du projet
                              </h4>
                              <button
                                onClick={() => handleCreateExpense(project)}
                                style={{
                                  backgroundColor: '#10b981',
                                  color: 'white',
                                  padding: '6px 12px',
                                  borderRadius: '4px',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  fontWeight: '500'
                                }}
                              >
                                + Ajouter Dépense
                              </button>
                            </div>

                            {!projectExpenses[project.id] || projectExpenses[project.id].length === 0 ? (
                              <div style={{
                                textAlign: 'center',
                                padding: '20px',
                                color: '#64748b',
                                fontSize: '14px'
                              }}>
                                Aucune dépense pour ce projet
                              </div>
                            ) : (
                              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr style={{
                                    backgroundColor: '#f1f5f9',
                                    borderBottom: '1px solid #e5e7eb'
                                  }}>
                                    <th style={{
                                      padding: '10px',
                                      textAlign: 'left',
                                      fontSize: '13px',
                                      fontWeight: '600'
                                    }}>
                                      Date
                                    </th>
                                    <th style={{
                                      padding: '10px',
                                      textAlign: 'left',
                                      fontSize: '13px',
                                      fontWeight: '600'
                                    }}>
                                      Catégorie
                                    </th>
                                    <th style={{
                                      padding: '10px',
                                      textAlign: 'left',
                                      fontSize: '13px',
                                      fontWeight: '600'
                                    }}>
                                      Description
                                    </th>
                                    <th style={{
                                      padding: '10px',
                                      textAlign: 'right',
                                      fontSize: '13px',
                                      fontWeight: '600'
                                    }}>
                                      Montant
                                    </th>
                                    <th style={{
                                      padding: '10px',
                                      textAlign: 'right',
                                      fontSize: '13px',
                                      fontWeight: '600'
                                    }}>
                                      Actions
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {projectExpenses[project.id].map((expense) => (
                                    <tr key={expense.id} style={{
                                      borderBottom: '1px solid #e5e7eb'
                                    }}>
                                      <td style={{ padding: '10px', fontSize: '13px' }}>
                                        {new Date(expense.expense_date).toLocaleDateString('fr-FR')}
                                      </td>
                                      <td style={{ padding: '10px', fontSize: '13px' }}>
                                        {expense.project_expense_category.name}
                                      </td>
                                      <td style={{ padding: '10px', fontSize: '13px', color: '#64748b' }}>
                                        {expense.description || '-'}
                                      </td>
                                      <td style={{
                                        padding: '10px',
                                        textAlign: 'right',
                                        fontSize: '13px',
                                        fontWeight: '600'
                                      }}>
                                        {formatNumber(expense.amount)} MRU
                                      </td>
                                      <td style={{ padding: '10px', textAlign: 'right' }}>
                                        <button
                                          onClick={() => handleEditExpense(expense, project)}
                                          style={{
                                            marginRight: '8px',
                                            color: '#167bff',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '16px'
                                          }}
                                          title="Modifier"
                                        >
                                          ✏️
                                        </button>
                                        <button
                                          onClick={() => handleDeleteExpense(expense.id, project.id)}
                                          style={{
                                            color: '#64748b',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '16px'
                                          }}
                                          title="Supprimer"
                                          onMouseEnter={(e) => e.target.style.color = '#ef4444'}
                                          onMouseLeave={(e) => e.target.style.color = '#64748b'}
                                        >
                                          🗑️
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Project Form Modal */}
      {showProjectForm && (
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
            maxWidth: '500px',
            width: '100%'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' }}>
              {editingProject ? 'Modifier le projet' : 'Nouveau projet'}
            </h3>

            <form onSubmit={handleSubmitProject}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Nom *
                </label>
                <input
                  type="text"
                  value={projectFormData.name}
                  onChange={(e) => setProjectFormData({ ...projectFormData, name: e.target.value })}
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

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Description
                </label>
                <textarea
                  value={projectFormData.description}
                  onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={projectFormData.active}
                    onChange={(e) => setProjectFormData({ ...projectFormData, active: e.target.checked })}
                    style={{ marginRight: '8px' }}
                  />
                  Actif
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={resetProjectForm}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    backgroundColor: 'white',
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
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#167bff',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  {editingProject ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Form Modal */}
      {showExpenseForm && (
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
          zIndex: 1001
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '30px',
            maxWidth: '500px',
            width: '100%'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' }}>
              {editingExpense ? 'Modifier la dépense' : 'Nouvelle dépense'}
            </h3>

            <form onSubmit={handleSubmitExpense}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Catégorie *
                </label>
                <select
                  value={expenseFormData.project_expense_category_id}
                  onChange={(e) => setExpenseFormData({
                    ...expenseFormData,
                    project_expense_category_id: e.target.value
                  })}
                  required
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}
                >
                  <option value="">-- Sélectionner --</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Montant (MRU) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={expenseFormData.amount}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: e.target.value })}
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

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Date *
                </label>
                <input
                  type="date"
                  value={expenseFormData.expense_date}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, expense_date: e.target.value })}
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
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Description
                </label>
                <textarea
                  value={expenseFormData.description}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, description: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={resetExpenseForm}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    backgroundColor: 'white',
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
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#167bff',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  {editingExpense ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
