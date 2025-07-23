import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../../api';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Registration failed. Please try a different email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">NFT</span>
          </div>
          <h1 className="modern-heading-lg">Create account</h1>
          <p className="modern-text-secondary">Get started with Liquid Forge</p>
        </div>

        <div className="modern-card p-8">
          <form onSubmit={handleSubmit} className="modern-space-y">
            {error && (
              <div className="bg-red-900/20 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label className="block modern-text-sm mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="modern-input"
                placeholder="Enter your email"
                required
              />
            </div>
            
            <div>
              <label className="block modern-text-sm mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="modern-input"
                placeholder="Create a password"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="modern-button-primary w-full"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="modern-text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-accent hover:text-accent-hover transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 