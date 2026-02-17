import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children }) {
  const { user, loading, hasPermission } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#167bff' }}></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!hasPermission('time_tracking')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <p style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>Accès refusé</p>
          <p>Vous n'avez pas la permission d'accéder au suivi du temps.</p>
        </div>
      </div>
    );
  }

  return children;
}
