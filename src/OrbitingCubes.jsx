import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere } from '@react-three/drei';
import * as THREE from 'three';

function Cube({ index, isAligned, count }) {
  const meshRef = useRef();
  
  // Target grid position
  const gridPos = useMemo(() => {
    const cols = 5;
    const spacing = 1.2;
    const row = Math.floor(index / cols);
    const col = index % cols;
    // Center the grid
    const x = (col - (cols - 1) / 2) * spacing;
    const y = (row - (Math.ceil(count / cols) - 1) / 2) * spacing;
    return new THREE.Vector3(x, y, 0);
  }, [index, count]);

  // Random orbit parameters
  const orbitParams = useMemo(() => {
    return {
      radius: 3 + Math.random() * 1,
      speed: 0.5 + Math.random() * 0.5,
      offset: Math.random() * Math.PI * 2,
      axis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize()
    };
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const t = state.clock.getElapsedTime();
    let targetPos = new THREE.Vector3();

    if (isAligned) {
      targetPos.copy(gridPos);
    } else {
      // Calculate orbit position
      const baseVec = new THREE.Vector3(orbitParams.radius, 0, 0);
      baseVec.applyAxisAngle(orbitParams.axis, orbitParams.speed * t + orbitParams.offset);
      targetPos.copy(baseVec);
    }

    // Smooth lerp
    meshRef.current.position.lerp(targetPos, 0.1);
    
    // Rotation
    if (isAligned) {
        meshRef.current.rotation.set(0, 0, 0);
    } else {
        meshRef.current.rotation.x += delta;
        meshRef.current.rotation.y += delta;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color={"hotpink"} />
    </mesh>
  );
}

export default function OrbitingCubes() {
  const [isAligned, setIsAligned] = useState(false);
  const count = 25;

  return (
    <div style={{ width: '100%', height: '50vh', position: 'relative', background: '#111' }}>
      <Canvas camera={{ position: [0, 0, 10] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        
        {/* Central Sphere */}
        <Sphere args={[1.5, 32, 32]}>
            <meshStandardMaterial color="lightblue" wireframe />
        </Sphere>

        {Array.from({ length: count }).map((_, i) => (
          <Cube key={i} index={i} isAligned={isAligned} count={count} />
        ))}
        
        <OrbitControls />
      </Canvas>
      <button 
        onClick={() => setIsAligned(!isAligned)}
        style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, padding: '8px 16px', cursor: 'pointer' }}
      >
        {isAligned ? 'Orbit' : 'Align'}
      </button>
    </div>
  );
}
