import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import Admin from './Admin';
import Login from './login';

function RootRoutes() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('auth_token'));
  const userRole = localStorage.getItem('user_role'); // Get the role string

  const handleLoginSuccess = () => setIsAuthenticated(true);
  
  const handleLogout = () => {
    localStorage.clear(); // Wipe token and role
    setIsAuthenticated(false);
    window.location.href = "/"; // Force redirect to login
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* ROOT PATH LOGIC */}
        <Route path="/" element={
          !isAuthenticated ? (
            <Login onLoginSuccess={handleLoginSuccess} />
          ) : userRole === 'ROLE_ADMIN' ? (
            <Navigate to="/admin" /> // Admins go straight to admin panel
          ) : (
            <App onLogout={handleLogout} /> // GF goes to GF module
          )
        } />

        {/* ADMIN MODULE LOGIC */}
        <Route path="/admin" element={
          isAuthenticated && userRole === 'ROLE_ADMIN' ? (
            <Admin onLogout={handleLogout} /> // Pass logout prop
          ) : (
            <Navigate to="/" /> // Everyone else is kicked back to root
          )
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default RootRoutes;