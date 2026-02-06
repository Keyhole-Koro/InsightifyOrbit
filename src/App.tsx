import React, { useState } from 'react';
import OrbitingCubes from './OrbitingCubes';
import OrbitingRects from './OrbitingRects';

const App: React.FC = () => {
  const [rectColor, setRectColor] = useState("#00ffff");
  const [speed, setSpeed] = useState(1.0);

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ textAlign: 'center' }}>Orbiting Cubes</h1>
      <OrbitingCubes />
      
      <h1 style={{ textAlign: 'center' }}>Orbiting Rects on Sphere Surface</h1>
      
      {/* Controls for OrbitingRects */}
      <div style={{ 
        background: '#333', 
        padding: '15px', 
        borderRadius: '8px',
        marginBottom: '10px',
        display: 'flex',
        gap: '20px',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <label>
          Rect Color: 
          <input 
            type="color" 
            value={rectColor} 
            onChange={(e) => setRectColor(e.target.value)} 
            style={{ marginLeft: '10px' }}
          />
        </label>
        <label>
          Speed Multiplier: 
          <input 
            type="range" 
            min="0.1" 
            max="5.0" 
            step="0.1" 
            value={speed} 
            onChange={(e) => setSpeed(parseFloat(e.target.value))} 
            style={{ marginLeft: '10px' }}
          />
          <span style={{ marginLeft: '5px' }}>{speed.toFixed(1)}x</span>
        </label>
      </div>

      <OrbitingRects rectColor={rectColor} speed={speed} />
    </div>
  );
}

export default App;
