import { useState, useEffect } from 'react';
import api from './api';
import './Admin.css';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

function Admin({ onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    kissWeek: 0, kissTotal: 0, punchWeek: 0, punchTotal: 0
  });
  const [userImage, setUserImage] = useState(10);
  const [isOnline, setIsOnline] = useState(false);
  const [moodStats, setMoodStats] = useState({});
  const [moodHistory, setMoodHistory] = useState([]);
  const [showDetails, setShowDetails] = useState(false);

  // Filter States[cite: 16]
  const [filterType, setFilterType] = useState('all');
  const [filterValue, setFilterValue] = useState(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showMoodList, setShowMoodList] = useState(false);

  // Response Page States[cite: 16]
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [responseMessage, setResponseMessage] = useState("");

  const moods = ["HAPPY", "SAD", "BORED", "ENERGETIC", "ANXIOUS", "CALM", "MAD", "MISSING"];

  const [isGridExpanded, setIsGridExpanded] = useState(false);

  const formatMoodDate = (item) => {
    const ts = item.moodTime; 
    if (!ts) return "No Date Found";
    try {
      if (Array.isArray(ts)) {
        const [year, month, day, hour, minute, second] = ts;
        return new Date(year, month - 1, day, hour, minute, second || 0).toLocaleString();
      }
      const dateObj = new Date(ts);
      return isNaN(dateObj.getTime()) ? "Invalid Format" : dateObj.toLocaleString();
    } catch (err) {
      return "Format Error";
    }
  };

  useEffect(() => {
    fetchAllData(); 
    const interval = setInterval(fetchAllData, 3000); 
    return () => clearInterval(interval); 
  }, [filterType, filterValue]);

  const fetchAllData = async () => {
    if (!localStorage.getItem('auth_token')) {
      setIsOnline(false);
      return;
    }

    try {
      let historyUrl = '/get-all-moods';
      if (filterType === 'mood' && filterValue) {
        historyUrl = `/get-moods-type/${filterValue}`;
      } else if (filterType === 'date' && filterValue) {
        historyUrl = `/get-moods-date/${filterValue}`;
      }

      const [kW, kT, pW, pT, status, stats30, history] = await Promise.all([
        api.get('/get-total-kiss-week'),
        api.get('/get-total-kiss'),
        api.get('/get-total-punch-week'),
        api.get('/get-total-punch'),
        api.get('/status'),
        api.get('/stats-30-days'),
        api.get(historyUrl)
      ]);

      setStats({
        kissWeek: kW.data, kissTotal: kT.data,
        punchWeek: pW.data, punchTotal: pT.data
      });
      setUserImage(status.data);
      setMoodStats(stats30.data);
      setMoodHistory(history.data);
      setIsOnline(true); 
    } catch (err) {
      setIsOnline(false); 
      
      // MOVE THIS INSIDE THE CATCH BLOCK[cite: 19]
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_role');
        onLogout(); // Optionally trigger a logout if the session is dead
      }
    }
  };

  const handleResetStats = async () => {
    if (!window.confirm("Are you sure you want to reset ALL stats?")) return;
    try {
      await api.post('/response/reset-all-stats'); 
      alert("All stats have been successfully reset.");
      fetchAllData();
    } catch (err) { alert("Failed to reset stats."); }
  };

  const handleResetResponse = async () => {
    try {
      await api.delete('response/delete');
      alert("Response reset successfully!");
    } catch (err) {
      alert("Failed to reset response.");
    }
  };

  const handleUpdateResponse = async (index, message) => {
    try {
      await api.post('/response/update', {
        responsePhotoIndex: index,
        responseMessage: message
      });
      alert("Response updated!");
    } catch (err) {
      alert("Update failed.");
    }
  };

  // Fixed toggleFilter: Submenu and Main menu now close on selection[cite: 16]
  const toggleFilter = (type, value) => {
    if (type === 'all') {
      setFilterType('all');
      setFilterValue(null);
      setShowFilterMenu(false);
      setShowMoodList(false);
    } else {
      setFilterType(type);
      setFilterValue(value);
      setShowFilterMenu(false); // Closes main menu
      setShowMoodList(false);   // Closes mood submenu
    }
  };

  const pieData = {
    labels: Object.keys(moodStats),
    datasets: [{
      data: Object.values(moodStats),
      backgroundColor: ['#36A2EB', '#FF6384', '#4BC0C0', '#FFCE56', '#9966FF', '#FF9F40'],
    }]
  };

  return (
    <div className="admin-body">
      <nav className="admin-nav">
        <div className="nav-logo">🍞YOUR PUNCHBREAD</div>
        <div className="nav-tabs">
          <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>DASHBOARD</button>
          <button className={activeTab === 'response' ? 'active' : ''} onClick={() => setActiveTab('response')}>RESPONSE</button>
          <button className="logout-btn" onClick={onLogout}>LOGOUT</button>
        </div>
      </nav>

      {activeTab === 'dashboard' ? (
        <div className="dashboard-content">
          <div className="top-row">
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-info"><p>Weekly Kisses</p><h3>{stats.kissWeek}</h3></div><div className="stat-icon blue">🩷</div></div>
              <div className="stat-card"><div className="stat-info"><p>Weekly Punches</p><h3>{stats.punchWeek}</h3></div><div className="stat-icon blue-light">👊</div></div>
              <div className="stat-card"><div className="stat-info"><p>Total Kisses</p><h3>{stats.kissTotal}</h3></div><div className="stat-icon clock">💕</div></div>
              <div className="stat-card"><div className="stat-info"><p>Total Punches</p><h3>{stats.punchTotal}</h3></div><div className="stat-icon check">😵‍💫</div></div>
            </div>

            <div className="preview-card">
              <p className="card-label">CURRENT VIEW</p>
              <div className="image-container">
                <img src={`/character/${userImage}.png`} alt="Character" />
              </div>
            </div>

            <div className="side-column">
              <div className="status-card">
                <div className="online-indicator">
                  <p>Status</p>
                  <span className={isOnline ? 'status-tag online' : 'status-tag offline'}>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                </div>
              </div>
              <button className="reset-stats-btn" onClick={handleResetStats}>RESET ALL STATS</button>
            </div>
          </div>

          <div className="chart-section">
            <h3>Mood Demographics</h3>
            <div className="admin-pie-container">
              <Pie data={pieData} options={{ maintainAspectRatio: false }} />
            </div>
            <button className="view-details-btn" onClick={() => setShowDetails(true)}>View Details</button>
          </div>
        </div>
      ) : (
        <div className="response-content">
          <div className="response-layout">
          <div className="grid-wrapper">
            <div className={`image-selection-grid ${isGridExpanded ? 'expanded' : 'collapsed'}`}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((idx) => (
                <div 
                  key={idx} 
                  className={`selectable-img-box ${selectedPhotoIndex === idx ? 'selected' : ''}`} 
                  onClick={() => setSelectedPhotoIndex(idx)}
                >
                  <img src={`/admin/${idx}.png`} alt={`Option ${idx}`} />
                </div>
              ))}
            </div>
              <button 
                className="expand-toggle-btn" 
                onClick={() => setIsGridExpanded(!isGridExpanded)}
              >
                {isGridExpanded ? '▲ Show Less' : '▼ Show More Images'}
              </button>
            </div>
            
            <div className="message-container">
              <div className="message-card">
                <textarea placeholder="Message" value={responseMessage} onChange={(e) => setResponseMessage(e.target.value)} />
                <button className="send-btn" onClick={() => handleUpdateResponse(selectedPhotoIndex, responseMessage)}>Send</button>
              </div>
            </div>

            <div className="response-sidebar">
              <div className="status-card-v2">
                <p>User Status</p>
                <span className={isOnline ? 'status-tag online' : 'status-tag offline'}>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
              </div>
              <div className="quick-actions">
                <button className="action-btn" onClick={() => handleUpdateResponse(6, "Kissed you!")}>Kiss</button>
                <button className="action-btn missing" onClick={() => handleUpdateResponse(7, "Missing you!")}>Missing</button>
                <button className="action-btn reset" onClick={handleResetResponse}>Reset</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDetails && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content">
            <div className="modal-header">
              <div className="header-left">
                <h2>Mood Activity History</h2>
                {filterValue && <span className="active-filter-badge">Filtering: {filterValue}</span>}
              </div>
              
              <div className="filter-section">
                {/* Clear Filter button only appears when a filter is chosen[cite: 16] */}
                {filterType !== 'all' && (
                  <button className="clear-btn-persistent" onClick={() => toggleFilter('all', null)}>
                    Clear Filter ✕
                  </button>
                )}

                <button className="filter-toggle-btn" onClick={() => setShowFilterMenu(!showFilterMenu)}>Filter ▽</button>
                
                {showFilterMenu && (
                  <div className="filter-dropdown">
                    <button onClick={() => setShowMoodList(!showMoodList)}>Mood Type ▸</button>
                    <div className="date-filter-input">
                      <span>Date:</span>
                      <input 
                        type="date" 
                        value={filterType === 'date' ? filterValue : ''}
                        onChange={(e) => toggleFilter('date', e.target.value)} 
                      />
                    </div>
                    {showMoodList && (
                      <div className="mood-submenu">
                        {moods.map(m => <button key={m} onClick={() => toggleFilter('mood', m)}>{m}</button>)}
                      </div>
                    )}
                  </div>
                )}
                <button className="close-modal" onClick={() => setShowDetails(false)}>×</button>
              </div>
            </div>
            
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Mood Type</th><th>Reason</th><th>Timestamp</th></tr>
                </thead>
                <tbody>
                  {moodHistory.map((item, idx) => (
                    <tr key={idx}>
                      <td><span className={`mood-badge ${item.mood.toLowerCase()}`}>{item.mood}</span></td>
                      <td>{item.reasonMessage || "No reason provided"}</td>
                      <td>{formatMoodDate(item)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;