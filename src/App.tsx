import React, { useState } from 'react';
import OrbitingCubes from './OrbitingCubes';
import OrbitingRects from './OrbitingRects';

const App: React.FC = () => {
  const [rectColor, setRectColor] = useState("#00ffff");
  const [speed, setSpeed] = useState(1.0);
  
  // Controls for OrbitingCubes
  const [coreWaveSpeed, setCoreWaveSpeed] = useState(1.0);
  const [coreMinAmp, setCoreMinAmp] = useState(0.05);
  const [coreMaxAmp, setCoreMaxAmp] = useState(0.25);

  return (
    <div style={{ padding: '20px', color: 'white', background: '#111', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center' }}>Orbiting Cubes</h1>
      
      {/* Controls for OrbitingCubes */}
      <div style={{ 
        background: '#222', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '10px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '20px',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <label>
          Wave Speed: 
          <input 
            type="range" 
            min="0.1" 
            max="15.0"
            step="0.1" 
            value={coreWaveSpeed} 
            onChange={(e) => setCoreWaveSpeed(parseFloat(e.target.value))} 
            style={{ marginLeft: '10px' }}
          />
          <span style={{ marginLeft: '5px' }}>{coreWaveSpeed.toFixed(1)}</span>
        </label>
        <label>
          Min Amp: 
          <input 
            type="range" 
            min="0.0" 
            max="0.5" 
            step="0.01" 
            value={coreMinAmp} 
            onChange={(e) => setCoreMinAmp(parseFloat(e.target.value))} 
            style={{ marginLeft: '10px' }}
          />
          <span style={{ marginLeft: '5px' }}>{coreMinAmp.toFixed(2)}</span>
        </label>
        <label>
          Max Amp: 
          <input 
            type="range" 
            min="0.0" 
            max="1.0" 
            step="0.01" 
            value={coreMaxAmp} 
            onChange={(e) => setCoreMaxAmp(parseFloat(e.target.value))} 
            style={{ marginLeft: '10px' }}
          />
          <span style={{ marginLeft: '5px' }}>{coreMaxAmp.toFixed(2)}</span>
        </label>
      </div>

      <OrbitingCubes 
        coreWaveSpeed={coreWaveSpeed} 
        coreMinAmp={coreMinAmp}
        coreMaxAmp={coreMaxAmp}
      />
      
      <h1 style={{ textAlign: 'center', marginTop: '40px' }}>Orbiting Rects on Sphere Surface</h1>
      
      {/* Controls for OrbitingRects */}
      <div style={{ 
        background: '#222', 
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
