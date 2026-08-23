import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const Rotating3DMedicalModel: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 18;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    currentMount.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const coralLight = new THREE.PointLight(0xe5573f, 4, 50);
    coralLight.position.set(10, 10, 10);
    scene.add(coralLight);

    const blueLight = new THREE.PointLight(0x4a90e2, 3, 50);
    blueLight.position.set(-10, -10, -10);
    scene.add(blueLight);

    // 3. Main 3D Medical Model Group (DNA Helix + Holographic Core + Orbital Rings)
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    // 3A. Central Holographic Core (Wireframe Icosahedron + Inner Glowing Sphere)
    const coreGeometry = new THREE.IcosahedronGeometry(2.6, 1);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0xe5573f,
      wireframe: true,
      emissive: 0xe5573f,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.75
    });
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    modelGroup.add(coreMesh);

    const innerSphereGeo = new THREE.SphereGeometry(1.4, 24, 24);
    const innerSphereMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xe5573f,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8
    });
    const innerSphere = new THREE.Mesh(innerSphereGeo, innerSphereMat);
    modelGroup.add(innerSphere);

    // 3B. 3D Rotating DNA Double-Helix Structure
    const dnaGroup = new THREE.Group();
    const strandRadius = 4.2;
    const strandHeight = 14;
    const turns = 2.5;
    const rungsCount = 38;

    const baseSphereGeo = new THREE.SphereGeometry(0.18, 12, 12);
    const mat1 = new THREE.MeshStandardMaterial({ color: 0xe5573f, emissive: 0xe5573f, emissiveIntensity: 0.6 });
    const mat2 = new THREE.MeshStandardMaterial({ color: 0x60a5fa, emissive: 0x60a5fa, emissiveIntensity: 0.6 });

    for (let i = 0; i < rungsCount; i++) {
      const progress = i / rungsCount;
      const angle = progress * Math.PI * 2 * turns;
      const y = (progress - 0.5) * strandHeight;

      const x1 = Math.cos(angle) * strandRadius;
      const z1 = Math.sin(angle) * strandRadius;

      const x2 = Math.cos(angle + Math.PI) * strandRadius;
      const z2 = Math.sin(angle + Math.PI) * strandRadius;

      // Strand 1 node
      const node1 = new THREE.Mesh(baseSphereGeo, mat1);
      node1.position.set(x1, y, z1);
      dnaGroup.add(node1);

      // Strand 2 node
      const node2 = new THREE.Mesh(baseSphereGeo, mat2);
      node2.position.set(x2, y, z2);
      dnaGroup.add(node2);

      // Base-pair connecting bridge (cylinder)
      const p1 = new THREE.Vector3(x1, y, z1);
      const p2 = new THREE.Vector3(x2, y, z2);
      const bridgeLength = p1.distanceTo(p2);
      const bridgeGeo = new THREE.CylinderGeometry(0.04, 0.04, bridgeLength, 6);
      const bridgeMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.4 });
      const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);

      bridge.position.copy(p1).lerp(p2, 0.5);
      bridge.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p2.clone().sub(p1).normalize());
      dnaGroup.add(bridge);
    }

    modelGroup.add(dnaGroup);

    // 3C. Orbital Gyroscopic Rings
    const ring1Geo = new THREE.TorusGeometry(5.2, 0.04, 16, 100);
    const ring1Mat = new THREE.MeshBasicMaterial({ color: 0xe5573f, transparent: true, opacity: 0.35 });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 3;
    modelGroup.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(6.0, 0.04, 16, 100);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.3 });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.y = Math.PI / 4;
    modelGroup.add(ring2);

    // 4. Floating Ambient Starfield Particles
    const particlesCount = 200;
    const positions = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 35;
      positions[i + 1] = (Math.random() - 0.5) * 35;
      positions[i + 2] = (Math.random() - 0.5) * 25;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.12,
      transparent: true,
      opacity: 0.6
    });
    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    // 5. Mouse Parallax Reaction
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const windowHalfX = window.innerWidth / 2;
      const windowHalfY = window.innerHeight / 2;
      mouseX = (e.clientX - windowHalfX) * 0.0005;
      mouseY = (e.clientY - windowHalfY) * 0.0005;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 6. Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth continuous 3D rotation
      modelGroup.rotation.y = elapsedTime * 0.45 + mouseX * 2;
      modelGroup.rotation.x = Math.sin(elapsedTime * 0.3) * 0.2 + mouseY * 2;
      modelGroup.rotation.z = Math.cos(elapsedTime * 0.2) * 0.15;

      // Individual component counter-rotations
      coreMesh.rotation.x = -elapsedTime * 0.6;
      coreMesh.rotation.y = -elapsedTime * 0.8;

      ring1.rotation.z = elapsedTime * 0.5;
      ring2.rotation.z = -elapsedTime * 0.4;

      particleSystem.rotation.y = elapsedTime * 0.04;

      renderer.render(scene, camera);
    };

    animate();

    // 7. Handle Resize
    const handleResize = () => {
      if (!currentMount) return;
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden opacity-85"
      style={{ filter: 'drop-shadow(0 0 40px rgba(229, 87, 63, 0.25))' }}
    />
  );
};
