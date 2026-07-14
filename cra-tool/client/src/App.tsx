import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import VmSidebar from './shared/layout/Sidebar';
import VmDashboard from './vm/pages/VmDashboard';
import NewTicketForm from './vm/pages/NewTicketForm';
import TicketQueue from './vm/pages/TicketQueue';
import TicketDetail from './vm/pages/TicketDetail';
import AdvisoryList from './vm/pages/AdvisoryList';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AppHub from './pages/AppHub';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import Compliance from './pages/Compliance';
import Requirements from './pages/Requirements';
import Settings from './pages/Settings';
import TitleManager from './shared/TitleManager';
import AppFooter from './shared/AppFooter';

function AppShell({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main className="app-shell" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1 }}>{children}</div>
        <AppFooter />
      </main>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <AppShell>{children}</AppShell>;
}

function HubRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const token = localStorage.getItem('token');
  if (token) return <Navigate to="/dashboard" replace />;
  return children;
}

function VmShell({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <VmSidebar />
      <main className="app-shell" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1 }}>{children}</div>
        <AppFooter />
      </main>
    </div>
  );
}

function VmRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <VmShell>{children}</VmShell>;
}

export default function App() {
  return (
    <BrowserRouter>
      <TitleManager />
      <Routes>
        <Route path="/"                     element={<Home />} />
        <Route path="/login"                element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup"               element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/dashboard"            element={<HubRoute><AppHub /></HubRoute>} />
        <Route path="/cra/dashboard"        element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/products"             element={<ProtectedRoute><Products /></ProtectedRoute>} />
        <Route path="/product/new"          element={<ProtectedRoute><ProductForm /></ProtectedRoute>} />
        <Route path="/compliance"           element={<ProtectedRoute><Compliance /></ProtectedRoute>} />
        <Route path="/compliance/:productId" element={<ProtectedRoute><Compliance /></ProtectedRoute>} />
        <Route path="/requirements"         element={<ProtectedRoute><Requirements /></ProtectedRoute>} />
        <Route path="/settings"             element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/vm"                   element={<VmRoute><VmDashboard /></VmRoute>} />
        <Route path="/vm/tickets"           element={<VmRoute><TicketQueue /></VmRoute>} />
        <Route path="/vm/tickets/new"       element={<VmRoute><NewTicketForm /></VmRoute>} />
        <Route path="/vm/tickets/:id"       element={<VmRoute><TicketDetail /></VmRoute>} />
        <Route path="/vm/advisories"        element={<VmRoute><AdvisoryList /></VmRoute>} />
        <Route path="*"                     element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
