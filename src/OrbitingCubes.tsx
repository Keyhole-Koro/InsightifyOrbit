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
    speed: 0.5 + Math.random() * 0.5,
    offset: Math.random() * Math.PI * 2,
    amp: 0.3,
    rotAxis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
    rotSpeed: 1.0 + Math.random()
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
      // "Intelligent" movement: Pulse and breathe
      const pulse = Math.sin(t * 2) * 0.1 + 1;
      
      // Rotate the entire constellation
      const rotSpeed = 0.3;
      const currentPos = basePos.clone();
      
      // Apply global rotation
      const axis = new THREE.Vector3(0.2, 1, 0).normalize();
      currentPos.applyAxisAngle(axis, t * rotSpeed);

      // Add "breathing" effect
      const breathe = Math.sin(t * 1.5 + floatParams.offset) * 0.2;
      currentPos.multiplyScalar(1 + breathe * 0.1);

      // Add local floating movement (wobble)
      currentPos.x += Math.sin(t * floatParams.speed + floatParams.offset) * floatParams.amp;
      currentPos.y += Math.cos(t * floatParams.speed + floatParams.offset) * floatParams.amp;
      currentPos.z += Math.sin(t * floatParams.speed * 0.5 + floatParams.offset) * floatParams.amp;

      targetPos.copy(currentPos);
    }

    // Smoother lerp for organic feel
    meshRef.current.position.lerp(targetPos, 0.05);
    
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
      <meshPhysicalMaterial 
        color={hovered ? "white" : color} 
        roughness={0.2}
        metalness={0.8}
        emissive={color}
        emissiveIntensity={0.5}
      />
      <Edges color="white" threshold={15} />
      
      {hovered && (
        <Html distanceFactor={10} position={[0, 0, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            fontSize: '12px',
            border: `1px solid ${color}`,
            transform: 'translate3d(-50%, -50%, 0)'
          }}>
            Node #{index + 1}
          </div>
        </Html>
      )}
    </mesh>
  );
};

// Component to draw curved lines between cubes
const CubeConnections = ({ positions, count, edgeColor, edgeOpacity }: { positions: React.MutableRefObject<THREE.Vector3[]>, count: number, edgeColor: string, edgeOpacity: number }) => {
    const linesRef = useRef<any>(null);
    
    const connectionsPerCube = 3;
    
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

    useFrame((state) => {
        if (!linesRef.current) return;
        
        const t = state.clock.getElapsedTime();
        const allPoints: THREE.Vector3[] = [];
        let curveIndex = 0;
        
        for (let i = 0; i < count; i++) {
            const start = positions.current[i];
            
            for (let j = 1; j <= connectionsPerCube; j++) {
                const offset = (j * 3 + 1); 
                const end = positions.current[(i + offset) % count];
                
                const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
                
                const pulse = Math.sin(t * 2 + i) * 0.5 + 1;
                const dir = mid.clone().normalize();
                const control = mid.clone().add(dir.multiplyScalar(1.5 * pulse)); 

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

// Custom shader material for the core sphere
const CoreShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uWaveSpeed: { value: 1.0 },
    uWaveAmp: { value: 0.15 },
    uMinAmp: { value: 0.05 },
    uMaxAmp: { value: 0.25 },
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform float uTime;
    uniform float uWaveSpeed;
    uniform float uWaveAmp;
    uniform float uMinAmp;
    uniform float uMaxAmp;
    
    // Simplex noise function (simplified)
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    float snoise(vec3 v) {
      const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy) );
      vec3 x0 = v - i + dot(i, C.xxx) ;
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute( permute( permute(
                 i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
               + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
      float n_ = 0.142857142857;
      vec3  ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                    dot(p2,x2), dot(p3,x3) ) );
    }

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      
      vec3 pos = position;
      
      // Dynamic wave using noise
      float noiseVal = snoise(vec3(pos.x * 2.0 + uTime * uWaveSpeed, pos.y * 2.0 + uTime * uWaveSpeed, pos.z * 2.0));
      
      // Modulate amplitude over time to make it "breathe" between min and max
      float dynamicAmp = mix(uMinAmp, uMaxAmp, 0.5 + 0.5 * sin(uTime * 0.5));
      
      float wave = noiseVal * dynamicAmp; 
      
      pos += normal * wave;
      
      vPosition = pos;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform float uTime;
    uniform float uWaveSpeed;
    
    void main() {
      // Distorted UVs for wavy grid lines
      vec2 distortedUv = vUv;
      distortedUv.x += sin(vUv.y * 10.0 + uTime * uWaveSpeed) * 0.05;
      distortedUv.y += cos(vUv.x * 10.0 + uTime * uWaveSpeed) * 0.05;

      // Grid pattern
      float gridX = step(0.95, fract(distortedUv.x * 20.0 + uTime * 0.2 * uWaveSpeed));
      float gridY = step(0.95, fract(distortedUv.y * 20.0 + uTime * 0.2 * uWaveSpeed));
      float grid = max(gridX, gridY);
      
      // Rainbow color
      vec3 rainbow = 0.5 + 0.5 * cos(uTime * uWaveSpeed * 0.5 + vPosition.xyx + vec3(0, 2, 4));
      
      // Glow effect
      float glow = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
      
      // Only show grid lines and glow, transparent elsewhere
      vec3 finalColor = rainbow * (grid + 0.5) + vec3(glow);
      float alpha = max(grid, glow * 0.3);
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `
};

// Colorful Core Component
const ColorfulCore = ({ waveSpeed, minAmp, maxAmp }: { waveSpeed: number, minAmp: number, maxAmp: number }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const materialRef = useRef<THREE.ShaderMaterial>(null);
    
    // Clone the material so each instance has its own uniforms
    const material = useMemo(() => {
        const mat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uWaveSpeed: { value: 1.0 },
                uWaveAmp: { value: 0.15 },
                uMinAmp: { value: 0.05 },
                uMaxAmp: { value: 0.25 }
            },
            vertexShader: CoreShaderMaterial.vertexShader,
            fragmentShader: CoreShaderMaterial.fragmentShader,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        return mat;
    }, []);
    
    useFrame((state) => {
        if (!meshRef.current) return;
        const t = state.clock.getElapsedTime();
        
        material.uniforms.uTime.value = t;
        material.uniforms.uWaveSpeed.value = waveSpeed;
        material.uniforms.uMinAmp.value = minAmp;
        material.uniforms.uMaxAmp.value = maxAmp;
        
        // Wobbly rotation
        meshRef.current.rotation.x = Math.sin(t * 0.5 * waveSpeed) * 0.2;
        meshRef.current.rotation.y += 0.01 * waveSpeed;
    });

    return (
        <Sphere args={[1.0, 128, 128]} ref={meshRef} material={material} />
    );
};

interface OrbitingCubesProps {
  nodeCount?: number;
  nodeSize?: number;
  nodeColors?: string[];
  edgeColor?: string;
  edgeOpacity?: number;
  coreWaveSpeed?: number;
  coreMinAmp?: number;
  coreMaxAmp?: number;
}

const DEFAULT_COLORS = ['#00FFFF', '#00AAFF', '#0088FF', '#0066FF', '#0044FF'];

const OrbitingCubes: React.FC<OrbitingCubesProps> = ({ 
  nodeCount = 20,
  nodeSize = 0.4,
  nodeColors = DEFAULT_COLORS,
  edgeColor = "#00FFFF",
  edgeOpacity = 0.2,
  coreWaveSpeed = 1.0,
  coreMinAmp = 0.05,
  coreMaxAmp = 0.25
}) => {
  const [isAligned, setIsAligned] = useState(false);
  const [globalHovered, setGlobalHovered] = useState(false);
  
  const positionsRef = useRef<THREE.Vector3[]>(Array.from({ length: nodeCount }, () => new THREE.Vector3()));
  
  useMemo(() => {
      positionsRef.current = Array.from({ length: nodeCount }, () => new THREE.Vector3());
  }, [nodeCount]);

  const updatePosition = (index: number, pos: THREE.Vector3) => {
      if (positionsRef.current[index]) {
          positionsRef.current[index].copy(pos);
      }
  };

  return (
    <div style={{ width: '100%', height: '50vh', position: 'relative', background: '#050510' }}>
      <Canvas camera={{ position: [0, 0, 12] }}>
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="blue" />
        <Environment preset="city" />
        
        {/* Colorful Core */}
        <ColorfulCore waveSpeed={coreWaveSpeed} minAmp={coreMinAmp} maxAmp={coreMaxAmp} />
        
        {/* Inner Glow Sphere (Static) */}
        <Sphere args={[0.6, 32, 32]}>
             <meshBasicMaterial color="white" transparent opacity={0.2} />
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
        
        <OrbitControls enableDamping dampingFactor={0.05} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
      
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}>
        <button 
            onClick={() => setIsAligned(!isAligned)}
            style={{ 
                padding: '8px 16px', 
                cursor: 'pointer',
                background: 'rgba(0, 255, 255, 0.1)',
                border: '1px solid rgba(0, 255, 255, 0.3)',
                color: '#00FFFF',
                borderRadius: '4px',
                backdropFilter: 'blur(4px)',
                fontFamily: 'monospace',
                letterSpacing: '1px'
            }}
        >
            {isAligned ? 'ALIGN DATA' : 'NEURAL ORBIT'}
        </button>
      </div>
    </div>
  );
};

export default OrbitingCubes;
