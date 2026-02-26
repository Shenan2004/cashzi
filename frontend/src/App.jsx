import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';

function PrivateRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();
  if (loading) {
    return (
      <div className="page-center">
        <div className="spinner" />
      </div>
    );
  }
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

function AppRoutes() {
  const { isLoggedIn } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={isLoggedIn ? <Navigate to="/dashboard" /> : <Register />} />
      <Route path="/dashboard" element={
        <PrivateRoute><AppLayout><Dashboard /></AppLayout></PrivateRoute>
      } />
      <Route path="/transactions" element={
        <PrivateRoute><AppLayout><Transactions /></AppLayout></PrivateRoute>
      } />
      <Route path="/budgets" element={
        <PrivateRoute><AppLayout><Budgets /></AppLayout></PrivateRoute>
      } />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  );
}
