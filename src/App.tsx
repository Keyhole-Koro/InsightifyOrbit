import React from 'react';
import OrbitingCubes from './OrbitingCubes';
import OrbitingRects from './OrbitingRects';

const App: React.FC = () => {
  return (
    <div>
      <h1 style={{ textAlign: 'center' }}>Orbiting Cubes</h1>
      <OrbitingCubes />
      
      <h1 style={{ textAlign: 'center' }}>Orbiting Rects on Sphere Surface</h1>
      <OrbitingRects />
    </div>
  );
}

export default App;
