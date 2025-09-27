import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html, Sparkles } from '@react-three/drei';
import { Group } from 'three';
import { getMaterialIcon } from '../utils/iconUtils';
import { MATERIALS_MAP } from '../data/materials';

interface CraftingAltarProps {
  craftingSlots: (string | null)[];
  selectedMaterial: string | null;
  onSlotClick: (slot: number) => void;
  isShaking: boolean;
  lastRejectedSlot: number | null;
  successTick: number;
}

// 3D 모델 컴포넌트
function LuckyBoxModel({ 
  craftingSlots, 
  onSlotClick, 
  isShaking, 
  lastRejectedSlot,
  successTick
}: CraftingAltarProps) {
  let scene;
  try {
    const gltf = useGLTF('/assets/models/lucky_box.glb');
    scene = gltf.scene;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[CraftingAltar] 럭키박스 모델 로드 실패:', error);
    }
    // 더미 모델로 대체
    scene = null;
  }
  
  const groupRef = useRef<Group>(null);
  const shakeRef = useRef(0);
  const [celebrate, setCelebrate] = useState(false);

  // 성공 축포 효과
  useEffect(() => {
    if (successTick > 0) {
      setCelebrate(true);
      const timer = setTimeout(() => setCelebrate(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [successTick]);

  // 흔들림 애니메이션
  useFrame((state) => {
    if (isShaking && groupRef.current) {
      shakeRef.current += 0.3;
      const intensity = Math.max(0, 0.6 - state.clock.elapsedTime % 0.6);
      groupRef.current.rotation.z = Math.sin(shakeRef.current) * intensity * 0.1;
      groupRef.current.position.x = Math.sin(shakeRef.current * 1.5) * intensity * 0.05;
    } else if (groupRef.current) {
      // 부드럽게 원래 위치로 복귀
      groupRef.current.rotation.z *= 0.9;
      groupRef.current.position.x *= 0.9;
    }
  });

  // 슬롯 위치 (모델 높이에 맞게 조정)
  const slotPositions: [number, number, number][] = [
    [-0.6, 0.9, 0], // 왼쪽 슬롯
    [0, 0.9, 0],    // 중앙 슬롯
    [0.6, 0.9, 0]   // 오른쪽 슬롯
  ];

  return (
    <group ref={groupRef}>
      {scene ? (
        <primitive object={scene} scale={[1, 1, 1]} />
      ) : (
        // 더미 모델 (큐브)
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
      )}
      
      {/* 클릭 가능한 슬롯들 */}
      {slotPositions.map((position, index) => (
        <group key={index} position={position}>
          {/* 투명한 클릭 영역 */}
          <mesh
            onPointerDown={() => onSlotClick(index)}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'auto';
            }}
          >
            <boxGeometry args={[0.5, 0.2, 0.5]} />
            <meshStandardMaterial transparent opacity={0.01} />
          </mesh>
          
          {/* 배치된 재료 아이콘 오버레이 */}
          {craftingSlots[index] && (
            <Html
              center
              distanceFactor={8}
              style={{
                pointerEvents: 'none',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: '2px solid #e63946',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}
              >
                <img
                  src={getMaterialIcon(craftingSlots[index] as keyof typeof MATERIALS_MAP)}
                  alt={MATERIALS_MAP[craftingSlots[index] as keyof typeof MATERIALS_MAP]?.name || ''}
                  style={{
                    width: '24px',
                    height: '24px',
                    objectFit: 'contain',
                  }}
                />
              </div>
            </Html>
          )}
          
          {/* 거부된 슬롯 표시 */}
          {lastRejectedSlot === index && (
            <Html
              center
              distanceFactor={8}
              style={{
                pointerEvents: 'none',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(220, 53, 69, 0.8)',
                  border: '3px solid #dc3545',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'pulse 0.6s ease-in-out',
                }}
              >
                <span style={{ color: 'white', fontSize: '20px' }}>✕</span>
              </div>
            </Html>
           )}
         </group>
       ))}
       
       {/* 성공 축포 효과 */}
       {celebrate && (
         <Sparkles 
           count={60} 
           scale={2.6} 
           speed={2} 
           position={[0, 1, 0]} 
         />
       )}
     </group>
   );
 }

// 로딩 컴포넌트
function LoadingFallback() {
  return (
    <Html center>
      <div
        style={{
          color: '#e63946',
          fontSize: '18px',
          fontWeight: 'bold',
          textAlign: 'center',
        }}
      >
        럭키박스 로딩 중...
      </div>
    </Html>
  );
}

// 메인 컴포넌트
const CraftingAltar: React.FC<CraftingAltarProps> = (props) => {
  // 모델 미리 로드
  useEffect(() => {
    try {
      useGLTF.preload('/assets/models/lucky_box.glb');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[CraftingAltar] 럭키박스 모델을 미리 로드할 수 없습니다:', error);
      }
    }
  }, []);

  return (
    <div style={{ height: '380px', width: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 1, 3], fov: 50 }}
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        
        <Suspense fallback={<LoadingFallback />}>
          <LuckyBoxModel {...props} />
        </Suspense>
        
        <OrbitControls
          enablePan={false}
          minDistance={1.8}
          maxDistance={5}
          enableZoom={true}
          enableRotate={true}
        />
      </Canvas>
      
      {/* CSS 애니메이션 */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.1); opacity: 1; }
          }
        `}
      </style>
    </div>
  );
};

export default CraftingAltar;
