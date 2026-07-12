import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const navigate        = useNavigate();
  const token           = localStorage.getItem('token');
  const email           = localStorage.getItem('email') || '';
  const name            = localStorage.getItem('name') || (email ? email.split('@')[0] : 'User');
  const isAuthenticated = !!token;

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('name');
    navigate('/login');
  }

  return { token, email, name, isAuthenticated, logout };
}
