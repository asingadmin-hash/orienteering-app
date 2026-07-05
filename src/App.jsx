import React, { useState, useEffect } from 'react';
import MapViewer from './MapViewer';
import './App.css';
import CheckpointManager from './CheckpointManager';

// 城市尋寶風格的檢查點數據
const INITIAL_CHECKPOINTS = [
  { 
    id: 1, 
    name: '時空的裂縫 (101門口)', 
    lat: 25.0336, 
    lng: 121.5648, 
    story: '你來到這座摩天大樓前，空氣中似乎迴盪著奇怪的頻率。根據傳說，這裡隱藏著一把通往過去的鑰匙...',
    quiz: '觀察大樓門口的銘牌，找出那個被刻意隱藏的「三個數字」代碼是多少？', 
    answer: '101',
    hints: [
        '提示一：看看這座大樓的名字。 (扣10分)',
        '提示二：這座大樓總共有幾層？ (再扣20分)',
        '正確答案是 101。 (放棄此題，扣50分)'
    ]
  },
  { 
    id: 2, 
    name: '黑色的守護者 (微風南山)', 
    lat: 25.0332, 
    lng: 121.5668, 
    story: '越過街道，你被一股神祕的力量引導至一座巨大的黑色建築前。這裡的空氣異常冰冷，彷彿有守護者在此沉睡。',
    quiz: '在這座建築的某個角落，有一個神祕的黑色標誌。請問這個標誌的形狀是由幾個字母組成的？', 
    answer: '2', 
    hints: [
        '提示一：標誌是某個品牌的縮寫。 (扣10分)',
        '提示二：算算 B 和 S 兩個字母。 (再扣20分)',
        '正確答案是 2。 (放棄此題，扣50分)'
    ]
  },
  { 
    id: 3, 
    name: '終極寶藏的線索 (市議會)', 
    lat: 25.0375, 
    lng: 121.5625, 
    story: '這是最後的試煉。在這座莊嚴的建築前，所有的線索即將拼湊完成。只有最聰明的冒險者能看到真正的寶藏。',
    quiz: '正對著這座建築的方向，隱藏著一個守護這座城市的機構。請問那個機構的名字縮寫是什麼？(提示：位於台北市的政府)', 
    answer: '台北市政府', 
    hints: [
        '提示一：遠眺正前方的宏偉建築。 (扣10分)',
        '提示二：這是這座城市的行政中心。 (再扣20分)',
        '正確答案是 台北市政府。 (放棄此題，扣50分)'
    ]
  },
  {
    id: 999,
    name: '🏆 傳說中的終極寶藏',
    lat: 25.0345,
    lng: 121.5655,
    type: 'final',
    story: '天哪！你真的找到了！金色的光芒在地面閃爍，這就是傳說中的終極寶藏！',
    quiz: '恭喜你！點擊下方按鈕進行最後的挖掘！',
    answer: 'DIG',
    hints: []
  }
];

function App() {
  const [appState, setAppState] = useState('login'); 
  const [passwordInput, setPasswordInput] = useState('');
  const [validPasswords, setValidPasswords] = useState(() => {
    const saved = localStorage.getItem('gamePasswords');
    return saved ? JSON.parse(saved) : ['1234', 'VIP'];
  });
  const [newPass, setNewPass] = useState('');
  const [isListOpen, setIsListOpen] = useState(false);
  const [isPasswordPanelOpen, setIsPasswordPanelOpen] = useState(false);

  const [checkpoints, setCheckpoints] = useState(() => {
    const saved = localStorage.getItem('gameCheckpoints');
    return saved ? JSON.parse(saved) : INITIAL_CHECKPOINTS;
  });

  useEffect(() => {
    localStorage.setItem('gameCheckpoints', JSON.stringify(checkpoints));
  }, [checkpoints]);
  const [userLocation, setUserLocation] = useState(null);
  const [userPath, setUserPath] = useState([]);
  const [foundCheckpoints, setFoundCheckpoints] = useState([]); 
  const [nextCheckpointIndex, setNextCheckpointIndex] = useState(0);
  const [score, setScore] = useState(1000); // 初始給較高分供提示扣除
  const [timeLeft, setTimeLeft] = useState(3600); // 1小時
  const [teammateLocation, setTeammateLocation] = useState({ lat: 25.035, lng: 121.565 });
  
  // 城市尋寶專用狀態
  const [activeTask, setActiveTask] = useState(null); // { data, stage: 'story' | 'puzzle' | 'photo' }
  const [puzzleInput, setPuzzleInput] = useState('');
  const [unlockedHints, setUnlockedHints] = useState({}); // { checkpointId: count }
  const [tempPhoto, setTempPhoto] = useState(null);
  const [status, setStatus] = useState('等待定位...');

  useEffect(() => {
    localStorage.setItem('gamePasswords', JSON.stringify(validPasswords));
  }, [validPasswords]);

  const handleLogin = () => {
    if (validPasswords.includes(passwordInput)) setAppState('play');
    else alert('密碼錯誤！');
  };

  const addPassword = () => {
    if (newPass && !validPasswords.includes(newPass)) {
      setValidPasswords([...validPasswords, newPass]);
      setNewPass('');
    }
  };

  useEffect(() => {
    if (appState !== 'login' && timeLeft > 0 && foundCheckpoints.length < checkpoints.length) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, foundCheckpoints, checkpoints, appState]);

  useEffect(() => {
    if (appState === 'login' || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newPos = { lat: latitude, lng: longitude };
        setUserLocation(newPos);
        setUserPath(prev => [...prev, [latitude, longitude]]);
        checkArrival(newPos);
      },
      (err) => setStatus(`定位失敗: ${err.message}`),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [appState, nextCheckpointIndex, checkpoints]);

  useEffect(() => {
    const moveTeammate = setInterval(() => {
      setTeammateLocation(prev => ({
        lat: prev.lat + (Math.random() - 0.5) * 0.0005,
        lng: prev.lng + (Math.random() - 0.5) * 0.0005
      }));
    }, 5000);
    return () => clearInterval(moveTeammate);
  }, []);

  const getDistance = (l1, l2) => {
    const R = 6371e3;
    const φ1 = l1.lat * Math.PI / 180, φ2 = l2.lat * Math.PI / 180;
    const Δφ = (l2.lat - l1.lat) * Math.PI / 180, Δλ = (l2.lng - l1.lng) * Math.PI / 180;
    const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
  };

  const checkArrival = (location) => {
    if (nextCheckpointIndex >= checkpoints.length || activeTask) return;
    const target = checkpoints[nextCheckpointIndex];
    if (getDistance(location, target) < 50) {
      setActiveTask({ data: target, stage: 'story' });
    }
  };

  // 解密與提示邏輯
  const handlePuzzleSubmit = () => {
    if (puzzleInput.trim() === activeTask.data.answer || activeTask.data.type === 'final') {
      setScore(prev => prev + 200);
      setActiveTask({ ...activeTask, stage: 'photo' });
      setPuzzleInput('');
    } else {
      alert('解密失敗！密碼不正確，請再觀察看看。');
      setScore(prev => Math.max(0, prev - 10));
    }
  };

  const unlockNextHint = () => {
    const currentCount = unlockedHints[activeTask.data.id] || 0;
    if (currentCount >= activeTask.data.hints.length) return;
    
    const costs = [10, 20, 50];
    const cost = costs[currentCount] || 50;
    
    if (confirm(`解鎖提示將扣除 ${cost} 分，確定嗎？`)) {
      setScore(prev => Math.max(0, prev - cost));
      setUnlockedHints({ ...unlockedHints, [activeTask.data.id]: currentCount + 1 });
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) setTempPhoto(URL.createObjectURL(file));
  };

  const completeCheckpoint = () => {
    if (!tempPhoto && activeTask.data.type !== 'final') {
      alert('請拍照上傳作為冒險佐證！');
      return;
    }
    setFoundCheckpoints(prev => [...prev, { id: activeTask.data.id, photoUrl: tempPhoto }]);
    setNextCheckpointIndex(prev => prev + 1);
    setActiveTask(null);
    setTempPhoto(null);
    alert(activeTask.data.type === 'final' ? '恭喜！你獲得了終極寶藏！' : '解謎完成！下一章節已開啟。');
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (appState === 'login') {
    return (
      <div className="login-screen">
        <div className="login-card">
          <h2>🗺️ 城市尋寶：冒險者加入</h2>
          <p>請輸入探險隊密碼以開始尋寶</p>
          <input type="password" placeholder="密碼" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} />
          <button onClick={handleLogin}>開始探險</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-container ${appState === 'admin' ? 'admin-mode' : ''}`}>
      <header className="app-header">
        <div className="header-main">
          <h1>城市尋寶：失落的記憶</h1>
          <button className="mode-toggle" onClick={() => setAppState(appState === 'play' ? 'admin' : 'play')}>
            {appState === 'play' ? '管理模式' : '返回冒險'}
          </button>
        </div>
        <div className="status-bar-treasure">
          <div className="stat">⏳ {formatTime(timeLeft)}</div>
          <div className="stat">💰 {score} pt</div>
          <div className="stat">📖 章節: {nextCheckpointIndex + 1}/{checkpoints.length}</div>
        </div>
      </header>

      <main className="map-wrapper">
        {appState === 'admin' && !isListOpen && (
          <button 
            onClick={() => setIsListOpen(true)}
            style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 1000, padding: '10px', background: '#8b4513', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.3)', fontWeight: 'bold' }}
          >
            📋 管理點位清單
          </button>
        )}
        {appState === 'admin' && isListOpen && (
          <CheckpointManager 
            checkpoints={checkpoints} 
            setCheckpoints={setCheckpoints} 
            onClose={() => setIsListOpen(false)}
          />
        )}
        <MapViewer 
          checkpoints={checkpoints.filter((cp, idx) => cp.type !== 'final' || idx === nextCheckpointIndex)} 
          userLocation={userLocation}
          foundCheckpoints={foundCheckpoints}
          nextCheckpointIndex={nextCheckpointIndex}
          userPath={userPath}
          teammateLocation={teammateLocation}
          isAdmin={appState === 'admin'}
          onAddCheckpoint={(latlng) => {
            const newCP = {
              id: Date.now(),
              name: `新傳說 ${checkpoints.length + 1}`,
              lat: latlng.lat, lng: latlng.lng,
              type: 'normal',
              story: '在此處寫下你的故事...',
              quiz: '在這裡設定你的謎題。',
              answer: '123', hints: ['這是提示。']
            };
            setCheckpoints([...checkpoints, newCP]);
            setIsListOpen(true);
          }}
          onDeleteCheckpoint={(id) => {
            if (window.confirm('確定要刪除這個點位嗎？')) {
               const indexToDelete = checkpoints.findIndex(cp => cp.id === id);
               if (indexToDelete < nextCheckpointIndex) {
                   setNextCheckpointIndex(prev => Math.max(0, prev - 1));
               } else if (indexToDelete === nextCheckpointIndex && nextCheckpointIndex >= checkpoints.length - 1) {
                   setNextCheckpointIndex(prev => Math.max(0, prev - 1));
               }
               setCheckpoints(checkpoints.filter(cp => cp.id !== id));
            }
          }}
        />

        {/* 尋寶任務彈窗 (城市尋寶風格) */}
        {activeTask && (
          <div className="quiz-overlay">
            <div className="treasure-journal">
              <div className="journal-header">
                <h3>{activeTask.stage === 'story' ? '📜 劇情發展' : '🧩 現場謎題'}</h3>
                <button className="close-btn" onClick={() => setActiveTask(null)}>×</button>
              </div>
              
              <div className="journal-content">
                {activeTask.stage === 'story' ? (
                  <div className="story-phase">
                    <p className="story-text">{activeTask.data.story}</p>
                    <button className="btn-next" onClick={() => setActiveTask({...activeTask, stage: 'puzzle'})}>接受挑戰</button>
                  </div>
                ) : activeTask.stage === 'puzzle' ? (
                  <div className="puzzle-phase">
                    <p className="quiz-text">{activeTask.data.quiz}</p>
                    <input 
                      type="text" 
                      className="puzzle-input" 
                      placeholder="輸入解密答案..." 
                      value={puzzleInput}
                      onChange={(e) => setPuzzleInput(e.target.value)}
                    />
                    
                    <div className="hint-section">
                      {Array.from({ length: unlockedHints[activeTask.data.id] || 0 }).map((_, i) => (
                        <p key={i} className="hint-text">💡 {activeTask.data.hints[i]}</p>
                      ))}
                      {(unlockedHints[activeTask.data.id] || 0) < activeTask.data.hints.length && (
                        <button className="btn-hint" onClick={unlockNextHint}>取得提示 ({[10, 20, 50][unlockedHints[activeTask.data.id] || 0]}pt)</button>
                      )}
                    </div>
                    
                    <button className="btn-submit" onClick={handlePuzzleSubmit}>提交解答</button>
                  </div>
                ) : (
                  <div className="photo-phase">
                    <p>✅ 謎題已解開！請拍攝現場特徵作為成功佐證。</p>
                    <div className="photo-upload-area">
                        <label className="photo-label">
                            📷 拍攝/選擇照片
                            <input type="file" accept="image/*" capture="environment" className="photo-input" onChange={handlePhotoUpload} />
                        </label>
                        {tempPhoto && <img src={tempPhoto} className="photo-preview" alt="佐證" />}
                    </div>
                    <button className="btn-complete" onClick={completeCheckpoint}>完成本章</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {appState === 'admin' && (
          <>
            {!isPasswordPanelOpen && (
              <button 
                onClick={() => setIsPasswordPanelOpen(true)}
                style={{ position: 'absolute', top: '10px', right: '20px', zIndex: 1000, padding: '10px', background: 'white', color: '#8b4513', border: '2px solid #8b4513', borderRadius: '5px', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.3)', fontWeight: 'bold' }}
              >
                🔑 密碼管理
              </button>
            )}
            {isPasswordPanelOpen && (
              <div className="admin-password-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h4 style={{ margin: 0 }}>🔑 冒險密碼管理</h4>
                  <button onClick={() => setIsPasswordPanelOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#8b4513' }}>&times;</button>
                </div>
            {validPasswords.map(p => (
              <div key={p} className="password-item">
                <span>{p}</span>
                <button onClick={() => setValidPasswords(validPasswords.filter(i => i !== p))}>×</button>
              </div>
            ))}
            <div className="add-password">
              <input value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="新密碼" />
              <button onClick={addPassword}>+</button>
            </div>
          </div>
          )}
          </>
        )}
      </main>

      {foundCheckpoints.length === checkpoints.length && (
        <div className="congrats-overlay treasure-win">
          <h2>🏴‍☠️ 傳說終結 🏴‍☠️</h2>
          <p>恭喜探險隊！你已收集所有寶藏。</p>
          <p>最終得分：{score} pt</p>
          <button onClick={() => window.location.reload()}>重新開始傳說</button>
        </div>
      )}
    </div>
  );
}

export default App;
