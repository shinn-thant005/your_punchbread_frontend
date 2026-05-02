import { useState, useEffect, useRef } from 'react';
import api from './api';
import './App.css';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

function App({ onLogout }) {
  const [photoIndex, setPhotoIndex] = useState(10); 
  const [adminResponse, setAdminResponse] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [randomMessage, setRandomMessage] = useState(""); 
  const [showMoodMenu, setShowMoodMenu] = useState(false);
  const [reason, setReason] = useState(""); 
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState({ kiss: 0, punch: 0, moodStats: {} });
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  const moods = ["HAPPY", "SAD", "BORED", "ENERGETIC", "ANXIOUS", "CALM"];
  const bgMusicRef = useRef(new Audio('/bg-music.mp3'));

  useEffect(() => {
    const music = bgMusicRef.current;
    music.loop = true;
    music.volume = 0.4;

    return () => {
      music.pause();
    };
  }, []);

  const toggleMusic = () => {
    if (isMusicPlaying) {
      bgMusicRef.current.pause();
    } else {
      bgMusicRef.current.play().catch(err => console.log("Autoplay blocked:", err));
    }
    setIsMusicPlaying(!isMusicPlaying);
  };

  /* --- Sound Effect Helpers --- */
  const playPunchSound = () => {
    const sfx = new Audio('/punch.mp3');
    sfx.volume = 0.6;
    sfx.play();
  };

  const playKissSound = () => {
    const sfx = new Audio('/kiss.mp3');
    sfx.volume = 0.6;
    sfx.play();
  };

  // NEW: Dead/Special sound for 0 or 20
  const playDeadSound = () => {
    const sfx = new Audio('/dead.mp3');
    sfx.volume = 0.7;
    sfx.play();
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchAdminResponse, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (adminResponse && adminResponse.responseMessage !== "No active message") {
      setShowAdmin(true);
    }
  }, [adminResponse?.responseDate, adminResponse?.responseMessage]);

  // Check for dead sound whenever photoIndex changes
  useEffect(() => {
    if (photoIndex === 0 || photoIndex === 20) {
      playDeadSound();
    }
  }, [photoIndex]);

  const fetchHistory = async () => {
    try {
      const [kissRes, punchRes, moodRes] = await Promise.all([
        api.get('/get-total-kiss-week'),
        api.get('/get-total-punch-week'),
        api.get('/stats-30-days')
      ]);
      setHistoryData({
        kiss: kissRes.data,
        punch: punchRes.data,
        moodStats: moodRes.data
      });
      setShowHistory(true);
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  };

  const pieData = {
    labels: Object.keys(historyData.moodStats),
    datasets: [{
      data: Object.values(historyData.moodStats),
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#8BC34A'
      ],
    }]
  };

  const fetchStatus = async () => {
    // Exit immediately if there is no token in local storage
    if (!localStorage.getItem('auth_token')) return;

    try {
      const res = await api.get('/status');
      setPhotoIndex(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchAdminResponse = async () => {
    // Exit immediately if there is no token
    if (!localStorage.getItem('auth_token')) return;

    try {
      const res = await api.get('/response/current');
      setAdminResponse(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchRandomMessage = async () => {
    try {
      const res = await api.get('/get-random-message');
      if (res.data && res.data.message) {
        setRandomMessage(res.data.message);
      }
    } catch (err) { console.error(err); }
  };

  const handleMoodSelect = async (selectedMood) => {
    try {
      await api.post('/add-mood', { 
        mood: selectedMood,
        reasonMessage: reason 
      }); 
      setShowMoodMenu(false);
      setReason(""); 
      alert(`Mood recorded!`);
    } catch (err) {
      console.error("Error recording mood:", err);
    }
  };

  const handlePunch = async () => {
    playPunchSound();
    try {
      await api.post('/punch');
      fetchStatus();
      fetchRandomMessage();
    } catch (err) { console.error(err); }
  };

  const handleKiss = async () => {
    playKissSound();
    try {
      await api.post('/kiss');
      fetchStatus();
      fetchRandomMessage();
    } catch (err) { console.error(err); }
  };

  const handleMadClick = async () => {
    try {
      await api.post('/add-mood', { 
        mood: "MAD",
        reasonMessage: "Su Su is being mad at you" 
      }); 
      alert(`Message sent: I'm mad!`);
    } catch (err) {
      console.error("Error recording MAD mood:", err);
    }
  };

  const handleMissingClick = async () => {
    try {
      await api.post('/add-mood', { 
        mood: "MISSING",
        reasonMessage: "Su Su is missing you" 
      }); 
      alert(`Message sent: I miss you!`);
    } catch (err) {
      console.error("Error recording MISSING mood:", err);
    }
  };

  return (
    <div className="app-container">
      <div className="top-left-controls">
        <button className="history-trigger-btn" onClick={fetchHistory}>
          See Your History
        </button>
        <button className={`music-toggle-btn ${isMusicPlaying ? 'playing' : ''}`} onClick={toggleMusic}>
          {isMusicPlaying ? '🎵 On' : '🔇 Off'}
        </button>
        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>

      <div className="mood-selector-container">
        <button className="mood-icon-btn" onClick={() => setShowMoodMenu(!showMoodMenu)}>
          😊
        </button>

        <button className="mad-btn" onClick={handleMadClick}>MAD 😤</button>
        <button className="missing-btn" onClick={handleMissingClick}>MISSING 🥺</button>
        
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
                <button key={m} onClick={() => handleMoodSelect(m)}>
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <h1>🍞Your Punchbread </h1>
      
      <div className="character-stage">
        {randomMessage && !showAdmin && (
          <div className="random-message-cloud">{randomMessage}</div>
        )}

        {showAdmin && adminResponse && adminResponse.responseMessage !== "No active message" && (
          <div className="admin-floating-box">
            <button className="close-overlay" onClick={() => setShowAdmin(false)}>×</button>
            <img src={`/admin/${adminResponse.responsePhotoIndex}.png`} alt="Admin" />
            <div className="speech-bubble">{adminResponse.responseMessage}</div>
          </div>
        )}

        <div className="main-character-wrapper">
          <img src={`/character/${photoIndex}.png`} alt="Character Status" className="main-character" />
        </div>
      </div>

      {showHistory && (
        <div className="history-overlay">
          <div className="history-content">
            <button className="close-history" onClick={() => setShowHistory(false)}>×</button>
            
            <section className="history-text-section">
              <h2>Weekly Interaction Stats</h2>
              <p>You have punched Shinn Thant <strong>{historyData.punch}</strong> times this week.</p>
              <p>You have kissed Shinn Thant <strong>{historyData.kiss}</strong> times this week.</p>
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
        <button className="punch-btn" onClick={handlePunch}>PUNCH</button>
        <button className="kiss-btn" onClick={handleKiss}>KISS</button>
      </div>
    </div>
  );
}

export default App;