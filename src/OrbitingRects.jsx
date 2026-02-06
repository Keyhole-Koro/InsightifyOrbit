import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere } from '@react-three/drei';
import * as THREE from 'three';

function Rect({ index, isAligned, count }) {
  const meshRef = useRef();
  
  // Target grid position
  const gridPos = useMemo(() => {
    const cols = 5;
    const spacing = 1.2;
    const row = Math.floor(index / cols);
    const col = index % cols;
    const x = (col - (cols - 1) / 2) * spacing;
    const y = (row - (Math.ceil(count / cols) - 1) / 2) * spacing;
    return new THREE.Vector3(x, y, 0);
  }, [index, count]);

  // Orbit parameters on sphere surface
  const orbitParams = useMemo(() => {
    const phi = Math.acos(-1 + (2 * index) / count);
    const theta = Math.sqrt(count * Math.PI) * phi;
    return {
      radius: 2.1, // Slightly larger than sphere radius
      phi,
      theta,
      speed: 0.2 + Math.random() * 0.2
    };
  }, [index, count]);

  useFrame((state) => {
    if (!meshRef.current) return;

    const t = state.clock.getElapsedTime();
    let targetPos = new THREE.Vector3();
    let targetRot = new THREE.Euler();

    if (isAligned) {
      targetPos.copy(gridPos);
      targetRot.set(0, 0, 0);
    } else {
      // Calculate position on sphere surface
      // Rotate theta over time
      const currentTheta = orbitParams.theta + t * orbitParams.speed;
      
      targetPos.setFromSphericalCoords(
        orbitParams.radius,
        orbitParams.phi,
        currentTheta
      );
      
      // Look at center to align with surface
      const dummy = new THREE.Object3D();
      dummy.position.copy(targetPos);
      dummy.lookAt(0, 0, 0);
      targetRot.copy(dummy.rotation);
    }

    // Smooth lerp
    meshRef.current.position.lerp(targetPos, 0.1);
    
    // Slerp rotation (using quaternions for smoothness)
    const currentQuat = meshRef.current.quaternion.clone();
    const targetQuat = new THREE.Quaternion().setFromEuler(targetRot);
    meshRef.current.quaternion.slerp(targetQuat, 0.1);
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[0.8, 0.4]} />
      <meshStandardMaterial color={"cyan"} side={THREE.DoubleSide} />
    </mesh>
  );
}

export default function OrbitingRects() {
  const [isAligned, setIsAligned] = useState(false);
  const count = 30;

  return (
    <div style={{ width: '100%', height: '50vh', position: 'relative', background: '#222' }}>
      <Canvas camera={{ position: [0, 0, 8] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        
        {/* Transparent Sphere with Masking effect (simulated by render order or just transparency) */}
        <Sphere args={[2, 32, 32]}>
            <meshPhysicalMaterial 
                color="white" 
                transmission={0.5} 
                opacity={0.3} 
                transparent 
                roughness={0.1}
                thickness={1}
            />
        </Sphere>

        {Array.from({ length: count }).map((_, i) => (
          <Rect key={i} index={i} isAligned={isAligned} count={count} />
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
