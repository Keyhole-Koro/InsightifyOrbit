import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Environment, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

interface RectProps {
  index: number;
  isAligned: boolean;
  count: number;
  color: string;
  speedMultiplier: number;
  sphereRadius: number;
  rectSize: [number, number];
}

const Rect: React.FC<RectProps> = ({ index, isAligned, count, color, speedMultiplier, sphereRadius, rectSize }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const gridPos = useMemo(() => {
    const cols = 6;
    const spacing = Math.max(rectSize[0], rectSize[1]) * 1.5;
    const row = Math.floor(index / cols);
    const col = index % cols;
    const x = (col - (cols - 1) / 2) * spacing;
    const y = (row - (Math.ceil(count / cols) - 1) / 2) * spacing;
    return new THREE.Vector3(x, y, sphereRadius + 1.5);
  }, [index, count, sphereRadius, rectSize]);

  const orbitParams = useMemo(() => {
    const phi = Math.acos(-1 + (2 * index) / count);
    const theta = Math.sqrt(count * Math.PI) * phi;
    
    const axis = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize();
    
    return {
      radius: sphereRadius + 0.05, // Slightly above surface
      phi,
      theta,
      baseSpeed: 0.2 + Math.random() * 0.2,
      axis
    };
  }, [index, count, sphereRadius]);

  useFrame((state) => {
    if (!meshRef.current) return;

    const t = state.clock.getElapsedTime();
    const targetPos = new THREE.Vector3();
    const targetRot = new THREE.Euler();

    if (isAligned) {
      targetPos.copy(gridPos);
      targetRot.set(0, 0, 0);
    } else {
      // 1. Calculate current position on sphere
      const initialPos = new THREE.Vector3().setFromSphericalCoords(
        orbitParams.radius,
        orbitParams.phi,
        orbitParams.theta
      );
      const angle = t * orbitParams.baseSpeed * speedMultiplier;
      initialPos.applyAxisAngle(orbitParams.axis, angle);
      targetPos.copy(initialPos);
      
      // 2. Calculate movement direction (tangent)
      const tangent = new THREE.Vector3().crossVectors(orbitParams.axis, targetPos).normalize();
      
      // 3. Orient the rectangle
      const dummy = new THREE.Object3D();
      dummy.position.copy(targetPos);
      
      const normal = targetPos.clone().normalize();
      
      // Align X with tangent and Z with normal
      const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();
      
      dummy.up.copy(bitangent);
      dummy.lookAt(targetPos.clone().add(normal));

      targetRot.copy(dummy.rotation);
    }

    meshRef.current.position.lerp(targetPos, 0.1);
    const targetQuat = new THREE.Quaternion().setFromEuler(targetRot);
    meshRef.current.quaternion.slerp(targetQuat, 0.1);
  });

  // Using RoundedBox from drei for rounded corners
  // It uses a custom geometry which is slightly heavier than PlaneGeometry but for 40 instances it's negligible.
  // args: [width, height, depth]
  // radius: corner radius
  // smoothness: number of segments for corners
  return (
    <RoundedBox 
      ref={meshRef} 
      args={[rectSize[0], rectSize[1], 0.02]} // Small depth to make it 3D-ish
      radius={0.05}
      smoothness={4}
    >
      <meshStandardMaterial 
        color={color} 
        transparent 
        opacity={0.9} 
        depthWrite={false} // Prevents z-fighting/transparency issues
      />
    </RoundedBox>
  );
};

interface OrbitingRectsProps {
  rectColor?: string;
  speed?: number;
  sphereRadius?: number;
  rectWidth?: number;
  rectHeight?: number;
}

const OrbitingRects: React.FC<OrbitingRectsProps> = ({ 
  rectColor = "cyan", 
  speed = 1.0,
  sphereRadius = 2,
  rectWidth = 0.6,
  rectHeight = 0.3
}) => {
  const [isAligned, setIsAligned] = useState(false);
  const count = 40;

  return (
    <div style={{ width: '100%', height: '50vh', position: 'relative', background: '#111' }}>
      <Canvas camera={{ position: [0, 0, sphereRadius * 4] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Environment preset="city" />
        
        {/* Grid Sphere */}
        <Sphere args={[sphereRadius, 32, 32]}>
            <meshStandardMaterial 
                color="#444" 
                wireframe 
                transparent 
                opacity={0.3}
            />
        </Sphere>

        {Array.from({ length: count }).map((_, i) => (
          <Rect 
            key={i} 
            index={i} 
            isAligned={isAligned} 
            count={count} 
            color={rectColor}
            speedMultiplier={speed}
            sphereRadius={sphereRadius}
            rectSize={[rectWidth, rectHeight]}
          />
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
