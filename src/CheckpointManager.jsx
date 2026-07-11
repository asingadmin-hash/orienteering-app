import React, { useState } from 'react';
import './CheckpointManager.css';

export default function CheckpointManager({ checkpoints, setCheckpoints, gameInfo, setGameInfo, onClose, onLocate }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [importMode, setImportMode] = useState(false);
  const [importText, setImportText] = useState('');

  const handleExport = () => {
    const exportData = {
      gameInfo: {
        title: gameInfo.title,
        backgroundStory: gameInfo.backgroundStory
      },
      checkpoints: checkpoints.map(cp => ({
        name: cp.name,
        lat: cp.lat,
        lng: cp.lng,
        type: cp.type,
        story: cp.story,
        quiz: cp.quiz,
        answer: cp.answer,
        hints: cp.hints,
        imageUrl: cp.imageUrl || ''
      }))
    };
    const jsonStr = JSON.stringify(exportData, null, 2);
    navigator.clipboard.writeText(jsonStr).then(() => {
      alert('劇本已複製到剪貼簿！');
    }).catch(() => {
      alert('複製失敗，您可能需要在有 HTTPS 的環境下才能使用剪貼簿功能。');
    });
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importText);
      let newCheckpoints = [];
      let newGameInfo = null;

      if (Array.isArray(parsed)) {
        // Old format (just an array of checkpoints)
        newCheckpoints = parsed;
      } else if (parsed && parsed.checkpoints && Array.isArray(parsed.checkpoints)) {
        // New format (object with gameInfo and checkpoints)
        newCheckpoints = parsed.checkpoints;
        if (parsed.gameInfo) newGameInfo = parsed.gameInfo;
      } else {
        throw new Error("格式不正確 (需為陣列或包含 checkpoints 的物件)");
      }
      
      const mappedCheckpoints = newCheckpoints.map((cp, idx) => ({
        id: Date.now() + idx,
        name: cp.name || `點位 ${idx+1}`,
        lat: parseFloat(cp.lat) || 25.0339,
        lng: parseFloat(cp.lng) || 121.5644,
        type: cp.type === 'final' ? 'final' : 'normal',
        story: cp.story || '',
        quiz: cp.quiz || '',
        answer: cp.answer || '',
        hints: Array.isArray(cp.hints) ? cp.hints : [],
        imageUrl: cp.imageUrl || ''
      }));

      if(window.confirm(`即將匯入 ${mappedCheckpoints.length} 個點位並覆蓋目前的設定，確定嗎？`)) {
        setCheckpoints(mappedCheckpoints);
        if (newGameInfo && setGameInfo) {
          setGameInfo(prev => ({
            ...prev,
            title: newGameInfo.title || prev.title,
            backgroundStory: newGameInfo.backgroundStory || prev.backgroundStory
          }));
        }
        setImportMode(false);
        setImportText('');
        alert('劇本匯入成功！');
      }
    } catch (e) {
      alert('JSON 格式錯誤，請檢查您的劇本格式！\n' + e.message);
    }
  };

  const handleEdit = (cp) => {
    setEditingId(cp.id);
    setEditForm({ ...cp, hints: cp.hints ? [...cp.hints] : [] });
  };

  const handleSave = () => {
    setCheckpoints(prev => prev.map(c => c.id === editingId ? editForm : c));
    setEditingId(null);
    setEditForm(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('確定要刪除此點位嗎？')) {
      setCheckpoints(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleAddHint = () => {
    setEditForm({ ...editForm, hints: [...editForm.hints, ''] });
  };

  const handleHintChange = (index, value) => {
    const newHints = [...editForm.hints];
    newHints[index] = value;
    setEditForm({ ...editForm, hints: newHints });
  };

  const handleRemoveHint = (index) => {
    const newHints = editForm.hints.filter((_, i) => i !== index);
    setEditForm({ ...editForm, hints: newHints });
  };

  const handleAddNewCheckpoint = () => {
    const newCP = {
      id: Date.now(),
      name: `新點位 ${checkpoints.length + 1}`,
      lat: 25.0339, 
      lng: 121.5644,
      type: 'normal',
      story: '請輸入劇情...',
      quiz: '請輸入謎題...',
      answer: '解答',
      hints: ['提示一']
    };
    setCheckpoints([...checkpoints, newCP]);
    handleEdit(newCP);
  };

  return (
    <div className="checkpoint-manager-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px dashed #8b4513', paddingBottom: '10px', marginBottom: '10px' }}>
        <h3 style={{ margin: 0, border: 'none', padding: 0 }}>📍 點位管理清單</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#8b4513' }}>&times;</button>
      </div>

      {!editingId && !importMode && gameInfo && (
        <div style={{ marginBottom: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '5px', border: '1px solid #ddd' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>📖 遊戲背景設定</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input 
              type="text" 
              value={gameInfo.title} 
              onChange={e => setGameInfo({...gameInfo, title: e.target.value})} 
              placeholder="遊戲標題"
              style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <textarea 
              value={gameInfo.backgroundStory} 
              onChange={e => setGameInfo({...gameInfo, backgroundStory: e.target.value})} 
              placeholder="前導背景故事..."
              style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', minHeight: '80px', resize: 'vertical' }}
            />
          </div>
        </div>
      )}
      
      <div className="checkpoint-list">
        {checkpoints.map((cp, index) => (
          <div key={cp.id} className="checkpoint-item">
            {editingId === cp.id ? (
              <div className="checkpoint-edit-form">
                <label>點位名稱 (Name)</label>
                <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                
                <div className="form-row">
                  <div>
                    <label>緯度 (Lat)</label>
                    <input type="number" step="0.0001" value={editForm.lat} onChange={e => setEditForm({...editForm, lat: parseFloat(e.target.value)})} />
                  </div>
                  <div>
                    <label>經度 (Lng)</label>
                    <input type="number" step="0.0001" value={editForm.lng} onChange={e => setEditForm({...editForm, lng: parseFloat(e.target.value)})} />
                  </div>
                </div>

                <label>類型 (Type)</label>
                <select value={editForm.type || 'normal'} onChange={e => setEditForm({...editForm, type: e.target.value})}>
                  <option value="normal">一般點位</option>
                  <option value="final">終極寶藏</option>
                </select>

                <label>🖼️ 關卡圖片網址 (Image URL)</label>
                <input value={editForm.imageUrl || ''} placeholder="https://..." onChange={e => setEditForm({...editForm, imageUrl: e.target.value})} />

                <label>劇情提要 (Story)</label>
                <textarea value={editForm.story} onChange={e => setEditForm({...editForm, story: e.target.value})} />

                <label>謎題內容 (Quiz)</label>
                <textarea value={editForm.quiz} onChange={e => setEditForm({...editForm, quiz: e.target.value})} />

                <label>正確解答 (Answer)</label>
                <input value={editForm.answer} onChange={e => setEditForm({...editForm, answer: e.target.value})} />

                <label>提示清單 (Hints)</label>
                {editForm.hints.map((hint, i) => (
                  <div key={i} className="hint-edit-row">
                    <span>{i+1}.</span>
                    <input value={hint} onChange={e => handleHintChange(i, e.target.value)} />
                    <button className="btn-icon btn-danger" onClick={() => handleRemoveHint(i)}>❌</button>
                  </div>
                ))}
                <button className="btn-secondary small mt-5" onClick={handleAddHint}>+ 新增提示</button>

                <div className="form-actions mt-15">
                  <button className="btn-primary" onClick={handleSave}>💾 儲存</button>
                  <button className="btn-secondary" onClick={handleCancel}>取消</button>
                </div>
              </div>
            ) : (
              <div className="checkpoint-summary">
                <div className="checkpoint-info">
                  <strong>{index + 1}. {cp.name}</strong>
                  <span className="cp-type">{cp.type === 'final' ? '👑 終點' : '📍 一般'}</span>
                </div>
                <div className="checkpoint-actions">
                  <button className="btn-secondary small" onClick={() => onLocate && onLocate(cp.lat, cp.lng)}>🎯</button>
                  <button className="btn-secondary small" onClick={() => handleEdit(cp)}>✏️</button>
                  <button className="btn-danger small" onClick={() => handleDelete(cp.id)}>🗑️</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {!editingId && !importMode && (
        <div style={{ marginTop: '15px' }}>
          <button className="btn-primary full-width" onClick={handleAddNewCheckpoint}>
            + 手動新增點位
          </button>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button className="btn-secondary full-width" onClick={handleExport}>📥 匯出</button>
            <button className="btn-secondary full-width" onClick={() => setImportMode(true)}>📤 匯入</button>
          </div>
        </div>
      )}

      {importMode && (
        <div className="checkpoint-edit-form" style={{ marginTop: '15px' }}>
          <label>貼上 JSON 劇本</label>
          <textarea 
            value={importText} 
            onChange={e => setImportText(e.target.value)} 
            placeholder="[ { &quot;name&quot;: &quot;第一關&quot;, ... } ]"
            style={{ minHeight: '150px' }}
          />
          <div className="form-actions mt-10">
            <button className="btn-primary" onClick={handleImport}>確認匯入</button>
            <button className="btn-secondary" onClick={() => setImportMode(false)}>取消</button>
          </div>
        </div>
      )}
    </div>
  );
}
