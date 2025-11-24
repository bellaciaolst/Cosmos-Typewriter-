import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { PlanetData } from '../types';

interface StarfieldBackgroundProps {
  planetData: PlanetData[];
  currentPlanetIndex: number | null;
  onPlanetSelect: (index: number) => void;
}

const StarfieldBackground: React.FC<StarfieldBackgroundProps> = ({ planetData, currentPlanetIndex, onPlanetSelect }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const currentPlanetRef = useRef<number | null>(null);

  useEffect(() => {
    currentPlanetRef.current = currentPlanetIndex;
  }, [currentPlanetIndex]);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050510, 0.002);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
    camera.position.z = 60;
    camera.position.y = 20;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mountRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x666666);
    scene.add(ambientLight);
    const sunLight = new THREE.PointLight(0xffffff, 3, 300);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0xccccff, 0.5);
    rimLight.position.set(50, 50, 50);
    scene.add(rimLight);

    // Stars
    const starGeo = new THREE.BufferGeometry();
    const starCount = 5000;
    const posArray = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 600;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.2,
      color: 0xffffff,
      transparent: true,
      opacity: 0.8
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // Planets
    const solarSystem = new THREE.Group();
    scene.add(solarSystem);
    const planetMeshes: THREE.Mesh[] = [];

    planetData.forEach((p, i) => {
      const geo = new THREE.SphereGeometry(p.size, 64, 64);
      const mat = new THREE.MeshStandardMaterial({
        color: p.color,
        roughness: 0.4,
        metalness: 0.1,
        emissive: p.color,
        emissiveIntensity: 0.1
      });
      const mesh = new THREE.Mesh(geo, mat);

      const angle = Math.random() * Math.PI * 2;
      mesh.position.x = Math.cos(angle) * p.distance;
      mesh.position.z = Math.sin(angle) * p.distance;

      mesh.userData = { id: i, name: p.name };
      solarSystem.add(mesh);
      planetMeshes.push(mesh);

      if (p.ring) {
        const ringGeo = new THREE.RingGeometry(p.size * 1.4, p.size * 2.5, 64);
        const ringMat = new THREE.MeshStandardMaterial({
          color: 0xDDDDDD,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.7,
          emissive: 0x444444
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2.2;
        mesh.add(ring);
      }
    });

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleResize = () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const onMouseDown = (event: MouseEvent) => {
      if ((event.target as HTMLElement).tagName !== 'CANVAS') return;
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(planetMeshes, false);
      if (intersects.length > 0) {
        const hitObj = intersects[0].object;
        if (hitObj.userData && typeof hitObj.userData.id === 'number') {
          onPlanetSelect(hitObj.userData.id);
        }
      }
    };

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      if (stars) stars.rotation.y += 0.0001;
      const activePlanetIndex = currentPlanetRef.current;

      planetMeshes.forEach((mesh, i) => {
        mesh.rotation.y += 0.002;

        if (activePlanetIndex === null) {
          const time = Date.now() * 0.00005;
          const p = planetData[i];
          mesh.position.x = Math.cos(time * (100 / p.distance) + i) * p.distance;
          mesh.position.z = Math.sin(time * (100 / p.distance) + i) * p.distance;
        }
      });

      if (activePlanetIndex !== null && planetMeshes[activePlanetIndex]) {
        const target = planetMeshes[activePlanetIndex];
        const offset = target.geometry.parameters.radius * 4;
        const idealPos = target.position.clone().add(new THREE.Vector3(0, offset * 0.5, offset));
        camera.position.lerp(idealPos, 0.05);
        camera.lookAt(target.position);
        target.rotation.y += 0.005;
      } else {
        const idealPos = new THREE.Vector3(0, 80, 160);
        camera.position.lerp(idealPos, 0.02);
        camera.lookAt(0, 0, 0);
      }
      renderer.render(scene, camera);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousedown', onMouseDown);
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousedown', onMouseDown);
      cancelAnimationFrame(frameId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [planetData, onPlanetSelect]);

  return <div ref={mountRef} className="absolute inset-0 z-0" />;
};

export default StarfieldBackground;
