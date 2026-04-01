import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DialogProvider } from './context/DialogContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import EmployeeDetail from './pages/EmployeeDetail';
import PaymentBatches from './pages/PaymentBatches';
import NewPaymentBatch from './pages/NewPaymentBatch';
import PaymentBatchDetail from './pages/PaymentBatchDetail';
import Settings from './pages/Settings';
import EmployeeTypes from './pages/EmployeeTypes';
import Wilayas from './pages/Wilayas';
import Moughataa from './pages/Moughataa';
import Communes from './pages/Communes';
import Villages from './pages/Villages';
import Users from './pages/Users';
import Banks from './pages/Banks';
import SalaryAmounts from './pages/SalaryAmounts';

function PrivateRoute({ children, requireAdmin = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#167bff' }}></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" />;
  }

  if (requireAdmin && user.role !== 'admin' && user.role !== 'super_admin') {
    return <Navigate to="/admin" />;
  }

  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public landing page */}
      <Route path="/" element={<Landing />} />

      {/* Admin login */}
      <Route
        path="/admin/login"
        element={user ? <Navigate to="/admin" /> : <Login />}
      />

      {/* Dashboard */}
      <Route
        path="/admin"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />

      {/* Employees */}
      <Route
        path="/admin/employees"
        element={
          <PrivateRoute>
            <Employees />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/employees/:id"
        element={
          <PrivateRoute>
            <EmployeeDetail />
          </PrivateRoute>
        }
      />

      {/* Payment Batches */}
      <Route
        path="/admin/payments"
        element={
          <PrivateRoute>
            <PaymentBatches />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/payments/new"
        element={
          <PrivateRoute requireAdmin>
            <NewPaymentBatch />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/payments/:id"
        element={
          <PrivateRoute>
            <PaymentBatchDetail />
          </PrivateRoute>
        }
      />

      {/* Settings */}
      <Route
        path="/admin/settings"
        element={
          <PrivateRoute requireAdmin>
            <Settings />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/admin/settings/employee-types" replace />} />
        <Route path="employee-types" element={<EmployeeTypes />} />
        <Route path="wilayas" element={<Wilayas />} />
        <Route path="moughataa" element={<Moughataa />} />
        <Route path="communes" element={<Communes />} />
        <Route path="villages" element={<Villages />} />
        <Route path="banks" element={<Banks />} />
        <Route path="salary-amounts" element={<SalaryAmounts />} />
        <Route path="users" element={<Users />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <DialogProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </DialogProvider>
    </AuthProvider>
  );
}

export default App;
