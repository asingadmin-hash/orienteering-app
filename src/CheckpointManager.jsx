import React, { useState } from 'react';
import './CheckpointManager.css';

export default function CheckpointManager({ checkpoints, setCheckpoints, onClose }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);

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
                  <button className="btn-secondary small" onClick={() => handleEdit(cp)}>✏️ 編輯</button>
                  <button className="btn-danger small" onClick={() => handleDelete(cp.id)}>🗑️</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {!editingId && (
        <button className="btn-primary full-width mt-15" onClick={handleAddNewCheckpoint}>
          + 手動新增點位
        </button>
      )}
    </div>
  );
}
