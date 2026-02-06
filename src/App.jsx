import React from 'react';
import OrbitingCubes from './OrbitingCubes';
import OrbitingRects from './OrbitingRects';

function App() {
  return (
    <div>
      <h1>Orbiting Cubes</h1>
      <OrbitingCubes />
      
      <h1>Orbiting Rects on Sphere Surface</h1>
      <OrbitingRects />
    </div>
  );
}

export default App;
