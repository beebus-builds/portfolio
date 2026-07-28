"use client";

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars, Float, Text } from '@react-three/drei';
import * as THREE from 'three';
import { GAME, PLANETS } from '@/lib/config';

interface PlanetData {
  id: string;
  position: THREE.Vector3;
  label: string;
  color: string;
}

interface UniverseProps {
  gameState: 'menu' | 'playing' | 'orbit' | 'gameover';
  shipPos: React.MutableRefObject<THREE.Vector3>;
  onCollect: () => void;
  onHit: () => void;
  activeZone: string | null;
  planets?: PlanetData[];
}

function Starfield() {
  return <Stars radius={100} depth={50} count={GAME.STAR_COUNT} factor={4} saturation={0} fade speed={1} />;
}

function Nebula({ color, position }: { color: string; position: [number, number, number] }) {
  return (
    <Float speed={1} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh position={position}>
        <sphereGeometry args={[15, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.05} blending={THREE.AdditiveBlending} />
      </mesh>
    </Float>
  );
}

function Planet({ data }: { data: PlanetData }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.3 + data.position.x) * 0.5;
      ref.current.rotation.y += 0.002;
    }
  });

  return (
    <group ref={ref} position={data.position}>
      <mesh>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshStandardMaterial color={data.color} emissive={data.color} emissiveIntensity={0.3} roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.6, 32, 32]} />
        <meshBasicMaterial color={data.color} transparent opacity={0.1} />
      </mesh>
      <mesh rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[1.8, 0.04, 8, 48]} />
        <meshBasicMaterial color={data.color} transparent opacity={0.4} />
      </mesh>
      <Text position={[0, -2.2, 0]} color={data.color} fontSize={0.25} anchorX="center" anchorY="top" fillOpacity={0.8}>
        {data.label}
      </Text>
    </group>
  );
}

export default function Universe({ gameState, shipPos, onCollect, onHit, activeZone, planets }: UniverseProps) {
  const obstaclesRef = useRef<THREE.Group>(null);
  const itemsRef = useRef<THREE.Group>(null);
  
  const objects = useRef<{ mesh: THREE.Mesh; type: 'asteroid' | 'core' }[]>([]);
  const spawnTimer = useRef(0);

  useFrame((state, delta) => {
    if (gameState !== 'playing') return;

    spawnTimer.current += delta;
    if (spawnTimer.current > GAME.UNIVERSE_SPAWN_INTERVAL) {
      spawnObject();
      spawnTimer.current = 0;
    }

    const currentObjects = [...objects.current];
    currentObjects.forEach((obj) => {
      obj.mesh.position.z += GAME.UNIVERSE_OBJECT_SPEED * delta;

      const dist = new THREE.Vector2(obj.mesh.position.x - shipPos.current.x, obj.mesh.position.z - 0).length();
      if (dist < GAME.UNIVERSE_COLLISION_DISTANCE) {
        if (obj.type === 'asteroid') {
          onHit();
        } else {
          onCollect();
        }
        sceneCleanup(obj.mesh);
      }

      if (obj.mesh.position.z > GAME.UNIVERSE_DESPAWN_Z) {
        sceneCleanup(obj.mesh);
      }
    });
  });

  const sceneCleanup = (mesh: THREE.Mesh) => {
    mesh.removeFromParent();
    mesh.geometry.dispose();
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach(m => m.dispose());
    } else {
      mesh.material.dispose();
    }
    objects.current = objects.current.filter(o => o.mesh !== mesh);
  };

  const spawnObject = () => {
    const isAsteroid = Math.random() > GAME.UNIVERSE_ASTEROID_CHANCE;
    const xPos = (Math.random() - 0.5) * GAME.UNIVERSE_SPAWN_RANGE_X * 2;
    const zPos = GAME.UNIVERSE_SPAWN_Z;
    const color = isAsteroid ? '#444444' : '#6366f1';
    
    const mesh = new THREE.Mesh(
      isAsteroid ? new THREE.IcosahedronGeometry(0.5, 0) : new THREE.SphereGeometry(0.3, 16, 16),
      new THREE.MeshStandardMaterial({ 
        color: color, 
        emissive: isAsteroid ? '#000000' : color,
        emissiveIntensity: isAsteroid ? 0 : 2,
        roughness: 0.1,
        metalness: 1
      })
    );
    
    mesh.position.set(xPos, 0, zPos);
    
    if (isAsteroid) {
      obstaclesRef.current?.add(mesh);
    } else {
      itemsRef.current?.add(mesh);
    }
    
    objects.current.push({ mesh, type: isAsteroid ? 'asteroid' : 'core' });
  };

  return (
    <group>
      <Starfield />
      <Nebula color="#4f46e5" position={[-30, 0, -40]} />
      <Nebula color="#8b5cf6" position={[30, 10, -30]} />
      <Nebula color="#ec4899" position={[0, -10, 30]} />
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#020203" roughness={0.1} metalness={1} />
      </mesh>

      <group ref={obstaclesRef} />
      <group ref={itemsRef} />

      {planets?.map(p => <Planet key={p.id} data={p} />)}
    </group>
  );
}
