import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#fafbfc' }}>
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#1e293b' }}>
            BestCar
          </h1>
          <p style={{ color: '#64748b' }}>Système de Gestion de Véhicules</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-medium mb-2" style={{ color: '#475569' }}>
              Nom d'utilisateur
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
              style={{ borderColor: '#e2e8f0' }}
              onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(22, 123, 255, 0.1)'}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
              required
            />
          </div>

          <div>
            <label className="block font-medium mb-2" style={{ color: '#475569' }}>
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
              style={{ borderColor: '#e2e8f0' }}
              onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(22, 123, 255, 0.1)'}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
              required
            />
          </div>

          {error && (
            <div className="border px-4 py-3 rounded" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#991b1b' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
            style={{ backgroundColor: '#167bff' }}
            onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#0d5dd6')}
            onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#167bff')}
          >
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
