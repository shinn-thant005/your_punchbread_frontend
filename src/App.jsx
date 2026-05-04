import { useState, useEffect, useRef } from 'react';
import api from './api';
import './App.css';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

function App({ onLogout }) {
  /* --- Unified State[cite: 27] --- */
  const [photoIndex, setPhotoIndex] = useState(10); 
  const [adminResponse, setAdminResponse] = useState(null);
  const [historyData, setHistoryData] = useState({ kiss: 0, punch: 0, moodStats: {} });

  /* --- UI Toggle States[cite: 27] --- */
  const [showAdmin, setShowAdmin] = useState(false);
  const [showMoodMenu, setShowMoodMenu] = useState(false);
  const [reason, setReason] = useState(""); 
  const [showHistory, setShowHistory] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  const moods = ["HAPPY", "SAD", "BORED", "ENERGETIC", "ANXIOUS", "CALM", "MAD", "MISSING"];
  const bgMusicRef = useRef(new Audio('/bg-music.mp3'));

  /* --- 1. The "Power Fetcher"[cite: 11, 27] --- */
  const fetchDashboard = async () => {
    if (!localStorage.getItem('auth_token')) return;

    try {
      // Fetch fresh data with a cache buster[cite: 17, 27]
      const res = await api.get(`/api/v1/dashboard?t=${new Date().getTime()}`);
      const data = res.data;

      // Update character state from DB[cite: 4, 10, 27]
      setPhotoIndex(data.appStatus?.currentPhotoIndex ?? 10);
      
      // Update stats based on DashboardDTO field names[cite: 25, 27]
      setHistoryData({
        kiss: data.weekKisses || 0,
        punch: data.weekPunches || 0,
        moodStats: data.moodStatistics || {}
      });

      // Admin pop-up logic with memory check[cite: 8, 17, 27]
      if (data.adminResponse) {
        const lastSeenDate = localStorage.getItem('lastClearedResponseDate');
        const hasMsg = data.adminResponse.responseMessage !== "No active message";
        const isNew = data.adminResponse.responseDate !== lastSeenDate;

        if (hasMsg && isNew) {
          setAdminResponse(data.adminResponse);
          setShowAdmin(true);
        } else if (!hasMsg) {
          setShowAdmin(false);
        }
      }
    } catch (err) {
      console.error("Dashboard Error:", err);
    }
  };

  /* --- 2. Lifecycle & Sounds[cite: 27] --- */
  useEffect(() => {
    fetchDashboard();
    // Poll for changes every 5 seconds[cite: 27]
    const interval = setInterval(fetchDashboard, 5000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const music = bgMusicRef.current;
    music.loop = true;
    music.volume = 0.4;
    return () => music.pause();
  }, []);

  // Play special sound at thresholds[cite: 4, 27]
  useEffect(() => {
    if (photoIndex === 0 || photoIndex === 20) {
      const sfx = new Audio('/dead.mp3');
      sfx.volume = 0.7;
      sfx.play().catch(() => {});
    }
  }, [photoIndex]);

  /* --- 3. Interaction Handlers[cite: 27] --- */
  const handleInteraction = async (type) => {
    const sfx = new Audio(type === 'punch' ? '/punch.mp3' : '/kiss.mp3');
    sfx.volume = 0.6;
    sfx.play().catch(() => {});

    try {
      // Update interaction on backend[cite: 15, 16, 27]
      await api.post(`/api/v1/${type}`);
      // Refresh UI instantly[cite: 22, 27]
      await fetchDashboard(); 
    } catch (err) {
      console.error(`${type} failed:`, err);
    }
  };

  const handleMoodSelect = async (selectedMood) => {
    try {
      // POST the mood data directly[cite: 5, 27]
      await api.post('/api/v1/add-mood', { mood: selectedMood, reasonMessage: reason });
      setShowMoodMenu(false);
      setReason("");
      await fetchDashboard();
      // Simple success popup as requested
      alert("Mood added!");
    } catch (err) {
      console.error("Mood error:", err);
    }
  };

  const handleClearAdminResponse = () => {
    if (adminResponse) {
      localStorage.setItem('lastClearedResponseDate', adminResponse.responseDate);
    }
    setShowAdmin(false);
  };

  const toggleMusic = () => {
    if (isMusicPlaying) { 
      bgMusicRef.current.pause(); 
    } else { 
      bgMusicRef.current.play().catch(e => console.log(e)); 
    }
    setIsMusicPlaying(!isMusicPlaying);
  };

  /* --- 4. Chart Data[cite: 27] --- */
  const pieData = {
    labels: Object.keys(historyData.moodStats || {}),
    datasets: [{
      data: Object.values(historyData.moodStats || {}),
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#8BC34A'],
    }]
  };

  return (
    <div className="app-container">
      <div className="top-left-controls">
        <button className="history-trigger-btn" onClick={() => setShowHistory(true)}>See Your History</button>
        <button className={`music-toggle-btn ${isMusicPlaying ? 'playing' : ''}`} onClick={toggleMusic}>
          {isMusicPlaying ? '🎵 On' : '🔇 Off'}
        </button>
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </div>

      <div className="mood-selector-container">
        <button className="mood-icon-btn" onClick={() => setShowMoodMenu(!showMoodMenu)}>😊</button>
        <button className="mad-btn" onClick={() => handleMoodSelect("MAD")}>MAD 😤</button>
        <button className="missing-btn" onClick={() => handleMoodSelect("MISSING")}>MISSING 🥺</button>
        
        {showMoodMenu && (
          <div className="mood-dropdown">
            <input 
              type="text" 
              placeholder="Why? (Optional)" 
              value={reason} 
              onChange={(e) => setReason(e.target.value)} 
              className="mood-input" 
            />
            <div className="mood-options">
              {moods.map((m) => (
                <button key={m} onClick={() => handleMoodSelect(m)}>{m}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      <h1>🍞Your Punchbread</h1>
      
      <div className="character-stage">
        {showAdmin && adminResponse && (
          <div className="admin-floating-box">
            <button className="close-overlay" onClick={handleClearAdminResponse}>×</button>
            <img src={`/admin/${adminResponse.responsePhotoIndex}.webp`} alt="Admin" />
            <div className="speech-bubble">{adminResponse.responseMessage}</div>
          </div>
        )}

        <div className="main-character-wrapper">
          <img src={`/character/${photoIndex}.webp`} alt="Character Status" className="main-character" />
        </div>
      </div>

      {showHistory && (
        <div className="history-overlay">
          <div className="history-content">
            <button className="close-history" onClick={() => setShowHistory(false)}>×</button>
            <section className="history-text-section">
              <h2>Weekly Interaction Stats</h2>
              <p>You have punched Shinn Thant <strong>{historyData.punch}</strong> times this week</p>
              <p>You have kissed Shinn Thant <strong>{historyData.kiss}</strong> times this week</p>
            </section>
            <hr />
            <section className="history-chart-section">
              <h2>Mood Distribution (Last 30 Days)</h2>
              <div className="chart-container">
                <Pie data={pieData} options={{ maintainAspectRatio: false }} />
              </div>
            </section>
          </div>
        </div>
      )}

      <div className="actions">
        <button className="punch-btn" onClick={() => handleInteraction('punch')}>PUNCH</button>
        <button className="kiss-btn" onClick={() => handleInteraction('kiss')}>KISS</button>
      </div>
    </div>
  );
}

export default App;