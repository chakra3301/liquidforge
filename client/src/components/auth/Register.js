import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../../api';
import { useAuth } from '../../contexts/AuthContext';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await register(email, password);
      console.log('Register - API response:', data);
      authLogin(data.token, data.user);
      console.log('Register - AuthContext updated, navigating to dashboard');
      navigate('/dashboard');
    } catch (err) {
      setError('Registration failed. Please try a different email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#1f2937',
      color: 'white'
    }}>
      <form onSubmit={handleSubmit} style={{
        backgroundColor: '#374151',
        padding: '2rem',
        borderRadius: '0.5rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '1.5rem',
          color: '#06b6d4',
          textAlign: 'center'
        }}>Register</h2>
        
        {error && (
          <div style={{
            color: '#ef4444',
            marginBottom: '1rem',
            padding: '0.5rem',
            backgroundColor: '#991b1b',
            borderRadius: '0.25rem'
          }}>
            {error}
          </div>
        )}
        
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{
            width: '100%',
            padding: '0.5rem 0.75rem',
            marginBottom: '1rem',
            backgroundColor: '#1f2937',
            border: '1px solid #06b6d4',
            color: '#a5f3fc',
            borderRadius: '0.375rem',
            outline: 'none'
          }}
          required
        />
        
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{
            width: '100%',
            padding: '0.5rem 0.75rem',
            marginBottom: '1.5rem',
            backgroundColor: '#1f2937',
            border: '1px solid #06b6d4',
            color: '#a5f3fc',
            borderRadius: '0.375rem',
            outline: 'none'
          }}
          required
        />
        
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            backgroundColor: '#0891b2',
            color: 'white',
            fontWeight: '500',
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1
          }}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
        
        <div style={{
          marginTop: '1rem',
          textAlign: 'center',
          color: '#67e8f9',
          fontSize: '0.875rem'
        }}>
          Already have an account? <a href="/login" style={{ color: '#06b6d4', textDecoration: 'underline' }}>Login</a>
        </div>
      </form>
    </div>
  );
} 