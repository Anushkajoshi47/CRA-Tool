import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import Compliance from './pages/Compliance';
import Requirements from './pages/Requirements';

function AppShell({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main className="app-shell" style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <AppShell>{children}</AppShell>;
}

function PublicRoute({ children }) {
  const token = localStorage.getItem('token');
  if (token) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                     element={<Home />} />
        <Route path="/login"                element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup"               element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/dashboard"            element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/products"             element={<ProtectedRoute><Products /></ProtectedRoute>} />
        <Route path="/product/new"          element={<ProtectedRoute><ProductForm /></ProtectedRoute>} />
        <Route path="/compliance"           element={<ProtectedRoute><Compliance /></ProtectedRoute>} />
        <Route path="/compliance/:productId" element={<ProtectedRoute><Compliance /></ProtectedRoute>} />
        <Route path="/requirements"         element={<ProtectedRoute><Requirements /></ProtectedRoute>} />
        <Route path="*"                     element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
