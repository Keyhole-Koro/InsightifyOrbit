import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Environment } from '@react-three/drei';
import * as THREE from 'three';

interface RectProps {
  index: number;
  isAligned: boolean;
  count: number;
}

const Rect: React.FC<RectProps> = ({ index, isAligned, count }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const gridPos = useMemo(() => {
    const cols = 6;
    const spacing = 1.0;
    const row = Math.floor(index / cols);
    const col = index % cols;
    const x = (col - (cols - 1) / 2) * spacing;
    const y = (row - (Math.ceil(count / cols) - 1) / 2) * spacing;
    return new THREE.Vector3(x, y, 3.5);
  }, [index, count]);

  const orbitParams = useMemo(() => {
    const phi = Math.acos(-1 + (2 * index) / count);
    const theta = Math.sqrt(count * Math.PI) * phi;
    return {
      radius: 2.05,
      phi,
      theta,
      speed: 0.2 + Math.random() * 0.2,
      axis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize()
    };
  }, [index, count]);

  useFrame((state) => {
    if (!meshRef.current) return;

    const t = state.clock.getElapsedTime();
    const targetPos = new THREE.Vector3();
    const targetRot = new THREE.Euler();

    if (isAligned) {
      targetPos.copy(gridPos);
      targetRot.set(0, 0, 0);
    } else {
      const initialPos = new THREE.Vector3().setFromSphericalCoords(
        orbitParams.radius,
        orbitParams.phi,
        orbitParams.theta
      );
      initialPos.applyAxisAngle(orbitParams.axis, t * orbitParams.speed);
      targetPos.copy(initialPos);
      
      const lookAtTarget = targetPos.clone().multiplyScalar(2);
      const dummy = new THREE.Object3D();
      dummy.position.copy(targetPos);
      dummy.lookAt(lookAtTarget); 
      targetRot.copy(dummy.rotation);
    }

    meshRef.current.position.lerp(targetPos, 0.1);
    const targetQuat = new THREE.Quaternion().setFromEuler(targetRot);
    meshRef.current.quaternion.slerp(targetQuat, 0.1);
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[0.6, 0.3]} />
      <meshStandardMaterial color={"cyan"} side={THREE.DoubleSide} />
    </mesh>
  );
};

const OrbitingRects: React.FC = () => {
  const [isAligned, setIsAligned] = useState(false);
  const count = 40;

  return (
    <div style={{ width: '100%', height: '50vh', position: 'relative', background: '#222' }}>
      <Canvas camera={{ position: [0, 0, 8] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Environment preset="city" />
        
        <Sphere args={[2, 64, 64]}>
            <meshPhysicalMaterial 
                color="white" 
                transmission={0.9} 
                opacity={1} 
                roughness={0}
                thickness={2}
                ior={1.5}
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
};

export default OrbitingRects;
