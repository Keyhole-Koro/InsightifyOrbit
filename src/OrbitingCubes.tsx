import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Environment, Html, Edges } from '@react-three/drei';
import * as THREE from 'three';

interface CubeProps {
  index: number;
  isAligned: boolean;
  count: number;
  globalHovered: boolean;
  setGlobalHovered: (hovered: boolean) => void;
  updatePosition: (index: number, pos: THREE.Vector3) => void;
  nodeSize: number;
  nodeColors: string[];
}

const Cube: React.FC<CubeProps> = ({ index, isAligned, count, globalHovered, setGlobalHovered, updatePosition, nodeSize, nodeColors }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  // Assign a random color based on index
  const color = useMemo(() => nodeColors[index % nodeColors.length], [index, nodeColors]);
  
  // Target grid position
  const gridPos = useMemo(() => {
    const cols = 5;
    const spacing = nodeSize * 2.4;
    const row = Math.floor(index / cols);
    const col = index % cols;
    const x = (col - (cols - 1) / 2) * spacing;
    const y = (row - (Math.ceil(count / cols) - 1) / 2) * spacing;
    return new THREE.Vector3(x, y, 3);
  }, [index, count, nodeSize]);

  // Fibonacci sphere distribution for even spacing
  const basePos = useMemo(() => {
    const phi = Math.acos(-1 + (2 * index) / count);
    const theta = Math.sqrt(count * Math.PI) * phi;
    const r = 3.5; // Radius
    return new THREE.Vector3().setFromSphericalCoords(r, phi, theta);
  }, [index, count]);

  // Random offset for floating effect
  const floatParams = useMemo(() => ({
    speed: 1 + Math.random(),
    offset: Math.random() * Math.PI * 2,
    amp: 0.2,
    rotAxis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
    rotSpeed: 0.5 + Math.random() * 0.5
  }), []);

  // Keep track of time manually to slow down
  const timeRef = useRef(0);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Slow down time if any cube is hovered
    const speedMultiplier = globalHovered ? 0.1 : 1.0;
    timeRef.current += delta * speedMultiplier;
    const t = timeRef.current;

    const targetPos = new THREE.Vector3();

    if (isAligned) {
      targetPos.copy(gridPos);
    } else {
      // Rotate the entire constellation
      const rotSpeed = 0.2;
      const currentPos = basePos.clone();
      
      // Apply global rotation (e.g. around Y axis, and maybe slightly tilted)
      const axis = new THREE.Vector3(0.2, 1, 0).normalize();
      currentPos.applyAxisAngle(axis, t * rotSpeed);

      // Add local floating movement (wobble)
      currentPos.x += Math.sin(t * floatParams.speed + floatParams.offset) * floatParams.amp;
      currentPos.y += Math.cos(t * floatParams.speed + floatParams.offset) * floatParams.amp;
      currentPos.z += Math.sin(t * floatParams.speed * 0.5 + floatParams.offset) * floatParams.amp;

      targetPos.copy(currentPos);
    }

    meshRef.current.position.lerp(targetPos, 0.1);
    
    // Update position for lines
    updatePosition(index, meshRef.current.position);

    if (isAligned) {
        meshRef.current.rotation.set(0, 0, 0);
    } else {
        // Rotate cube around its own random axis
        meshRef.current.rotateOnAxis(floatParams.rotAxis, delta * speedMultiplier * floatParams.rotSpeed);
    }
  });

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    setHovered(true);
    setGlobalHovered(true);
  };

  const handlePointerOut = () => {
    setHovered(false);
    setGlobalHovered(false);
  };

  return (
    <mesh 
      ref={meshRef}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <boxGeometry args={[nodeSize, nodeSize, nodeSize]} />
      <meshStandardMaterial color={hovered ? "white" : color} roughness={0.3} />
      <Edges color="white" />
      
      {hovered && (
        <Html distanceFactor={10}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            fontSize: '12px',
            border: `1px solid ${color}`
          }}>
            Cube #{index + 1} Details
          </div>
        </Html>
      )}
    </mesh>
  );
};

// Component to draw curved lines between cubes
const CubeConnections = ({ positions, count, edgeColor, edgeOpacity }: { positions: React.MutableRefObject<THREE.Vector3[]>, count: number, edgeColor: string, edgeOpacity: number }) => {
    const linesRef = useRef<any>(null);
    
    const connectionsPerCube = 2;
    
    const curves = useMemo(() => {
        const allCurves = [];
        for (let i = 0; i < count; i++) {
            for (let j = 1; j <= connectionsPerCube; j++) {
                allCurves.push(new THREE.QuadraticBezierCurve3(
                    new THREE.Vector3(),
                    new THREE.Vector3(),
                    new THREE.Vector3()
                ));
            }
        }
        return allCurves;
    }, [count]);

    useFrame(() => {
        if (!linesRef.current) return;

        const allPoints: THREE.Vector3[] = [];
        let curveIndex = 0;
        
        for (let i = 0; i < count; i++) {
            const start = positions.current[i];
            
            for (let j = 1; j <= connectionsPerCube; j++) {
                const offset = j === 1 ? 1 : 3;
                const end = positions.current[(i + offset) % count];
                
                const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
                const dir = mid.clone().normalize();
                const control = mid.clone().add(dir.multiplyScalar(1.5)); // Curve out

                const curve = curves[curveIndex++];
                curve.v0.copy(start);
                curve.v1.copy(control);
                curve.v2.copy(end);
                
                allPoints.push(...curve.getPoints(20));
            }
        }
        
        linesRef.current.geometry.setFromPoints(allPoints);
    });

    return (
        <lineSegments ref={linesRef}>
            <bufferGeometry />
            <lineBasicMaterial color={edgeColor} transparent opacity={edgeOpacity} linewidth={1} />
        </lineSegments>
    );
};

interface OrbitingCubesProps {
  nodeCount?: number;
  nodeSize?: number;
  nodeColors?: string[];
  edgeColor?: string;
  edgeOpacity?: number;
}

const DEFAULT_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#FF9F43', '#54A0FF', '#5F27CD'];

const OrbitingCubes: React.FC<OrbitingCubesProps> = ({ 
  nodeCount = 15,
  nodeSize = 0.5,
  nodeColors = DEFAULT_COLORS,
  edgeColor = "white",
  edgeOpacity = 0.3
}) => {
  const [isAligned, setIsAligned] = useState(false);
  const [globalHovered, setGlobalHovered] = useState(false);
  
  // Store positions of all cubes to draw lines between them
  // We need to recreate the ref array if nodeCount changes, but useRef doesn't update automatically.
  // However, for this demo, we can just initialize with a large enough array or use a state-based approach if dynamic resizing is needed.
  // For simplicity, we'll assume nodeCount doesn't change drastically at runtime, or we re-render.
  const positionsRef = useRef<THREE.Vector3[]>(Array.from({ length: nodeCount }, () => new THREE.Vector3()));
  
  // If nodeCount changes, we need to resize the array
  useMemo(() => {
      positionsRef.current = Array.from({ length: nodeCount }, () => new THREE.Vector3());
  }, [nodeCount]);

  const updatePosition = (index: number, pos: THREE.Vector3) => {
      if (positionsRef.current[index]) {
          positionsRef.current[index].copy(pos);
      }
  };

  return (
    <div style={{ width: '100%', height: '50vh', position: 'relative', background: '#111' }}>
      <Canvas camera={{ position: [0, 0, 10] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Environment preset="city" />
        
        <Sphere args={[1.5, 32, 32]}>
            <meshStandardMaterial color="lightblue" wireframe />
        </Sphere>

        {Array.from({ length: nodeCount }).map((_, i) => (
          <Cube 
            key={i} 
            index={i} 
            isAligned={isAligned} 
            count={nodeCount} 
            globalHovered={globalHovered}
            setGlobalHovered={setGlobalHovered}
            updatePosition={updatePosition}
            nodeSize={nodeSize}
            nodeColors={nodeColors}
          />
        ))}
        
        {!isAligned && (
            <CubeConnections 
              positions={positionsRef} 
              count={nodeCount} 
              edgeColor={edgeColor}
              edgeOpacity={edgeOpacity}
            />
        )}
        
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

export default OrbitingCubes;
