import React, { useState } from 'react';
import './login.css';
import api from './api'; // Import your axios instance!

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // State to hold error messages


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); 
    
    const credentials = btoa(`${username}:${password}`);
    
    try {
      // 1. Point to the correct, updated path we created earlier
      // Added the cache buster ?t= so the browser doesn't use old login attempts
      const response = await api.get(`/api/v1/dashboard?t=${new Date().getTime()}`, {
        headers: { 'Authorization': `Basic ${credentials}` }
      });

      if (response.status === 200) {
        // ONLY log in if the server says OK
        const role = username === 'shinn' ? 'ROLE_ADMIN' : 'ROLE_USER';
        localStorage.setItem('auth_token', credentials);
        localStorage.setItem('user_role', role);
        onLoginSuccess();
      }
    } catch (err) {
      setError("Invalid username or password.");
    }
  };

  return (
    <div className="login-container">
      <div className="glass-card">
        <h2>Welcome Back 🍞🥑</h2>
        
        {/* Display the error if it exists */}
        {error && <p style={{ color: '#ff4d4d', fontWeight: 'bold' }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input 
              type="text" 
              placeholder="Username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
          </div>
          <div className="input-group">
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <button type="submit" className="login-btn">LOGIN</button>
        </form>
      </div>
    </div>
  );
}

export default Login;