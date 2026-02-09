import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DialogProvider } from './context/DialogContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cars from './pages/Cars';
import CarDetail from './pages/CarDetail';
import ImportCars from './pages/ImportCars';
import ManagerProfits from './pages/ManagerProfits';
import Settings from './pages/Settings';
import CarModels from './pages/CarModels';
import ExpenseCategories from './pages/ExpenseCategories';
import Sellers from './pages/Sellers';
import PaymentMethods from './pages/PaymentMethods';
import Tags from './pages/Tags';
import Users from './pages/Users';
import Debts from './pages/Debts';
import Projects from './pages/Projects';
import ProjectExpenseCategories from './pages/ProjectExpenseCategories';
import SharedCar from './pages/SharedCar';
import TimeTrackingProjects from './pages/TimeTracking/Projects';
import TimeTrackingProjectDetail from './pages/TimeTracking/ProjectDetail';
import TimeTrackingTaskDetail from './pages/TimeTracking/TaskDetail';

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
    return <Navigate to="/login" />;
  }

  if (requireAdmin && user.role !== 'admin' && user.role !== 'super_admin') {
    return <Navigate to="/" />;
  }

  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" /> : <Login />}
      />
      {/* Public route - no authentication required */}
      <Route path="/share/:token" element={<SharedCar />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/cars"
        element={
          <PrivateRoute>
            <Cars />
          </PrivateRoute>
        }
      />
      <Route
        path="/cars/import"
        element={
          <PrivateRoute requireAdmin>
            <ImportCars />
          </PrivateRoute>
        }
      />
      <Route
        path="/cars/:id"
        element={
          <PrivateRoute>
            <CarDetail />
          </PrivateRoute>
        }
      />
      <Route
        path="/profits"
        element={
          <PrivateRoute>
            <ManagerProfits />
          </PrivateRoute>
        }
      />
      <Route
        path="/time-tracking"
        element={
          <PrivateRoute>
            <TimeTrackingProjects />
          </PrivateRoute>
        }
      />
      <Route
        path="/time-tracking/projects/:id"
        element={
          <PrivateRoute>
            <TimeTrackingProjectDetail />
          </PrivateRoute>
        }
      />
      <Route
        path="/time-tracking/tasks/:id"
        element={
          <PrivateRoute>
            <TimeTrackingTaskDetail />
          </PrivateRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <PrivateRoute requireAdmin>
            <Projects />
          </PrivateRoute>
        }
      />
      <Route
        path="/debts"
        element={
          <PrivateRoute requireAdmin>
            <Debts />
          </PrivateRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <PrivateRoute requireAdmin>
            <Settings />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/settings/car-models" replace />} />
        <Route path="car-models" element={<CarModels />} />
        <Route path="expense-categories" element={<ExpenseCategories />} />
        <Route path="sellers" element={<Sellers />} />
        <Route path="payment-methods" element={<PaymentMethods />} />
        <Route path="tags" element={<Tags />} />
        <Route path="users" element={<Users />} />
        <Route path="project-expense-categories" element={<ProjectExpenseCategories />} />
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
