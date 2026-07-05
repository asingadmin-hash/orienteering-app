import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 修正 Leaflet 預設圖示
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const teammateIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

function MapClickHandler({ onMapClick, isAdmin }) {
    useMapEvents({
        click: (e) => {
            if (isAdmin) onMapClick(e.latlng);
        },
    });
    return null;
}

import { useEffect } from 'react';

function ChangeView({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView([center.lat, center.lng], map.getZoom());
    }, [center, map]);
    return null;
}

const MapViewer = ({ 
    checkpoints, 
    userLocation, 
    foundCheckpoints, 
    nextCheckpointIndex, 
    userPath, 
    teammateLocation,
    isAdmin,
    onAddCheckpoint,
    onDeleteCheckpoint 
}) => {
    const defaultCenter = [25.0339, 121.5644];
    const [viewTrigger, setViewTrigger] = React.useState(null);
    const targetCp = checkpoints[nextCheckpointIndex];

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <MapContainer 
                center={defaultCenter} 
                zoom={15} 
                style={{ height: '100%', width: '100%' }}
            >
                <ChangeView center={viewTrigger} />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
            
            <MapClickHandler isAdmin={isAdmin} onMapClick={onAddCheckpoint} />
            
            {userPath.length > 1 && (
                <Polyline positions={userPath} color="blue" weight={3} opacity={0.5} dashArray="5, 10" />
            )}

            {userLocation && (
                <>
                    <Marker position={[userLocation.lat, userLocation.lng]}>
                        <Popup>您的位置</Popup>
                    </Marker>
                    <Circle center={[userLocation.lat, userLocation.lng]} radius={30} pathOptions={{ color: 'blue', fillOpacity: 0.1 }} />
                </>
            )}

            {teammateLocation && (
                <Marker position={[teammateLocation.lat, teammateLocation.lng]} icon={teammateIcon}>
                    <Popup>隊友：小明 (模擬)</Popup>
                </Marker>
            )}

            {checkpoints.map((cp, index) => {
                const foundData = foundCheckpoints.find(f => f.id === cp.id);
                const isFound = !!foundData;
                const isActive = index === nextCheckpointIndex;
                const isLocked = index > nextCheckpointIndex;

                let color = '#f44336'; 
                if (isFound) color = '#4caf50';
                else if (isActive) color = cp.type === 'final' ? '#ffd700' : '#ffeb3b'; // 終極寶藏用金色
                else if (isLocked) color = '#9e9e9e';

                return (
                    <Marker 
                        key={cp.id} 
                        position={[cp.lat, cp.lng]}
                        icon={L.divIcon({
                            className: 'custom-div-icon',
                            html: `<div style="background-color: ${color}; width: ${cp.type === 'final' ? '32px' : '24px'}; height: ${cp.type === 'final' ? '32px' : '24px'}; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 12px rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; color: ${isActive ? 'black' : 'white'}; font-weight: bold; font-size: ${cp.type === 'final' ? '18px' : '12px'}; animate: ${cp.type === 'final' ? 'pulse 2s infinite' : 'none'};">${cp.type === 'final' ? '💎' : index + 1}</div>`,
                            iconSize: [cp.type === 'final' ? 32 : 24, cp.type === 'final' ? 32 : 24],
                            iconAnchor: [cp.type === 'final' ? 16 : 12, cp.type === 'final' ? 16 : 12]
                        })}
                    >
                        <Popup>
                            <strong>點位 {index + 1}: {cp.name}</strong><br/>
                            狀態: {isFound ? '✅ 已尋獲' : (isActive ? '🎯 目前目標' : '🔒 尚未開啟')}
                            {isFound && foundData.photoUrl && (
                                <div style={{ marginTop: '10px' }}>
                                    <strong>佐證照片：</strong><br/>
                                    <img src={foundData.photoUrl} alt="佐證" style={{ width: '100%', borderRadius: '5px', marginTop: '5px' }} />
                                </div>
                            )}
                            {isAdmin && (
                                <div style={{ marginTop: '10px', textAlign: 'center' }}>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteCheckpoint(cp.id);
                                        }}
                                        style={{ background: '#d32f2f', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer', width: '100%' }}
                                    >
                                        🗑️ 刪除此點位
                                    </button>
                                </div>
                            )}
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
        
        <div style={{ position: 'absolute', bottom: '20px', left: '20px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {targetCp && (
                <button 
                    onClick={() => setViewTrigger({ lat: targetCp.lat, lng: targetCp.lng, t: Date.now() })} 
                    style={{ padding: '10px 15px', background: 'white', border: '2px solid #8b4513', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', color: '#8b4513' }}
                >
                    🎯 回到目標點位
                </button>
            )}
            {userLocation && (
                <button 
                    onClick={() => setViewTrigger({ lat: userLocation.lat, lng: userLocation.lng, t: Date.now() })} 
                    style={{ padding: '10px 15px', background: '#2196f3', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', color: 'white' }}
                >
                    📍 定位我的位置
                </button>
            )}
        </div>
      </div>
    );
};

export default MapViewer;
