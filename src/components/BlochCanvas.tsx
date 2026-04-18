import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

function Scene() {
  const sphereRef = useRef<THREE.Mesh>(null);
  const arrowRef = useRef<THREE.Group>(null);
  
  // Quantum state references
  const currentStateRef = useRef<{x: number, y: number, z: number}>({x: 0, y: 1, z: 0});
  const isCollapsedRef = useRef(false);
  const collapseTargetRef = useRef<{x: number, y: number, z: number} | null>(null);
  const scrollProgressRef = useRef(0);
  
  // Decoherence tracking
  const lastActiveTimeRef = useRef(Date.now());
  const isDecoherentRef = useRef(false);
  const decoherenceJitterRef = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    let wasmModule: any = null;

    import('../wasm/quantum_flex/quantum_flex.js').then((wasm) => {
        wasm.default().then(() => {
            wasmModule = wasm;
            
            // Poll Telemetry every 100ms
            setInterval(() => {
                const start = performance.now();
                const telemetry = wasmModule.get_telemetry();
                const latency = performance.now() - start;
                
                document.dispatchEvent(new CustomEvent('quantum:telemetry', {
                    detail: {
                        alloc: telemetry.alloc,
                        drop: telemetry.drop,
                        safety: telemetry.safety,
                        latency: latency
                    }
                }));
            }, 100);

            // Re-bind global with measurement capabilities
            (window as any).updateQuantumState = (progress: number) => {
                scrollProgressRef.current = progress;
                lastActiveTimeRef.current = Date.now();
                
                if (isDecoherentRef.current) {
                    isDecoherentRef.current = false;
                    document.dispatchEvent(new CustomEvent('quantum:log', { 
                        detail: { message: "ERROR CORRECTION APPLIED. STATE PURIFIED.", warning: false } 
                    }));
                }
                
                // If it was collapsed, start interpolating back (handled in useFrame)
                isCollapsedRef.current = false;

                if (!arrowRef.current) return;
                
                try {
                    const nextState = wasmModule.VectorState.compute_rotation(progress);
                    currentStateRef.current = { x: nextState.x, y: nextState.y, z: nextState.z };
                    nextState.free();
                } catch (e) {
                    console.error("WASM calculation exception:", e);
                }
            };
            
            // Initial render
            (window as any).updateQuantumState(0);
        });
    });

    const handleActivity = () => {
        lastActiveTimeRef.current = Date.now();
        if (isDecoherentRef.current) {
            isDecoherentRef.current = false;
            document.dispatchEvent(new CustomEvent('quantum:log', { 
                detail: { message: "ERROR CORRECTION APPLIED. STATE PURIFIED.", warning: false } 
            }));
        }
    };

    const handleMeasurement = () => {
        if (!wasmModule) return;
        lastActiveTimeRef.current = Date.now();
        isCollapsedRef.current = true;

        try {
            const start = performance.now();
            const collapsed = wasmModule.VectorState.measure(currentStateRef.current.y, Math.random());
            collapseTargetRef.current = { x: collapsed.x, y: collapsed.y, z: collapsed.z };
            collapsed.free();
            
            document.dispatchEvent(new CustomEvent('quantum:log', { 
                detail: { message: `MEASUREMENT COLLAPSE: STATE |${collapseTargetRef.current.y > 0 ? '0' : '1'}> OBSERVED.`, warning: false } 
            }));
        } catch (e) {}
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('click', handleMeasurement);

    return () => {
      // @ts-ignore
      delete window.updateQuantumState;
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('click', handleMeasurement);
    }
  }, []);

  useFrame((state) => {
    // 1. Check Decoherence
    if (Date.now() - lastActiveTimeRef.current > 5000 && !isDecoherentRef.current) {
        isDecoherentRef.current = true;
        document.dispatchEvent(new CustomEvent('quantum:log', { 
            detail: { message: "WARNING: QUBIT DECOHERENCE DETECTED. NOISE RATIO INCREASING.", warning: true } 
        }));
    }

    if (sphereRef.current) {
        sphereRef.current.rotation.y += 0.001;
        sphereRef.current.rotation.x += 0.0005;
    }

    if (arrowRef.current) {
        let targetX = currentStateRef.current.x;
        let targetY = currentStateRef.current.y;
        let targetZ = currentStateRef.current.z;

        if (isCollapsedRef.current && collapseTargetRef.current) {
            targetX = collapseTargetRef.current.x;
            targetY = collapseTargetRef.current.y;
            targetZ = collapseTargetRef.current.z;
        }

        // Apply smooth interpolation (Option B) natively 
        arrowRef.current.rotation.x += (targetX - arrowRef.current.rotation.x) * 0.1;
        arrowRef.current.rotation.y += (targetY - arrowRef.current.rotation.y) * 0.1;
        arrowRef.current.rotation.z += (targetZ - arrowRef.current.rotation.z) * 0.1;

        // Apply Decoherence scale & jitter
        const arrowMesh = arrowRef.current.children[0] as any; // The helper
        if (isDecoherentRef.current) {
            // Shrink
            if (arrowRef.current.scale.x > 0.4) {
                arrowRef.current.scale.lerp(new THREE.Vector3(0.4, 0.4, 0.4), 0.01);
            }
            // Jitter
            arrowRef.current.position.set(
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2
            );
        } else {
            // Recover purity
            arrowRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
            arrowRef.current.position.lerp(new THREE.Vector3(0, 0, 0), 0.1);
        }
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={1} color="#00F0FF" />
      <directionalLight position={[-10, -10, -10]} intensity={0.5} color="#A855F7" />

      {/* Wireframe Sphere */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[3, 32, 32]} />
        <meshBasicMaterial 
            color="#00F0FF" 
            wireframe 
            transparent 
            opacity={0.15} 
        />

        {/* Axes */}
        <axesHelper args={[4]} />

        {/* The State Vector Arrow */}
        <group ref={arrowRef}>
            <arrowHelper 
                args={[
                    new THREE.Vector3(0, 1, 0),
                    new THREE.Vector3(0, 0, 0),
                    3.5,
                    0xA855F7,
                    0.5, 0.2
                ]} 
            />
        </group>
      </mesh>
    </>
  );
}

export default function BlochCanvas() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none" style={{ background: 'transparent' }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <Scene />
        <Stars radius={50} depth={50} count={3000} factor={4} saturation={1} fade speed={1.5} />
        <EffectComposer disableNormalPass>
            <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
