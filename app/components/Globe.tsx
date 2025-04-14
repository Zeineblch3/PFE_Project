import React, { useRef, useState, useEffect } from 'react';
import { Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import TourPopup from './TourPopup';
import { fetchTours } from '../Services/tourService';
import { useTourRecommendations } from './useTourRecommendations';

const toCartesian = (lat: number, lon: number, radius: number) => {
  const latRad = THREE.MathUtils.degToRad(lat);
  const lonRad = THREE.MathUtils.degToRad(lon);

  const x = radius * Math.cos(latRad) * Math.cos(lonRad);
  const y = radius * Math.sin(latRad);
  const z = radius * Math.cos(latRad) * Math.sin(lonRad);

  return new THREE.Vector3(x, y, z);
};

interface GlobeProps {
  scale?: number;
  position?: [number, number, number];
  rotate?: boolean;
  openAIModel: (recs: any[]) => void;
}

const Globe: React.FC<GlobeProps> = ({
  scale = 1,
  position = [0, 0, 0],
  rotate = true,
  openAIModel,
}) => {
  const { scene } = useGLTF('/models/scene.gltf');
  const globeRef = useRef<THREE.Group>(null);
  const pinsRef = useRef<THREE.Mesh[]>([]);
  const popupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  const [tours, setTours] = useState<any[]>([]);
  const [selectedTour, setSelectedTour] = useState<any>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const getTours = async () => {
      try {
        const { data } = await fetchTours();
        setTours(data ?? []);
      } catch (error) {
        console.error('Error fetching tours:', error);
        setTours([]);
      }
    };

    getTours();
  }, []);

  const { recommendations, setShowRecommendations } = useTourRecommendations(
    selectedTour?.id
  );

  const handleNextImage = () => {
    if (selectedTour?.photo_urls) {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % selectedTour.photo_urls.length);
    }
  };

  const handlePrevImage = () => {
    if (selectedTour?.photo_urls) {
      setCurrentImageIndex(
        (prevIndex) => (prevIndex - 1 + selectedTour.photo_urls.length) % selectedTour.photo_urls.length
      );
    }
  };

  const handleClosePopup = () => {
    setSelectedTour(null);
    setShowRecommendations(false);
  };

  useFrame(() => {
    if (popupRef.current && selectedTour) {
      const popupPosition = new THREE.Vector3(selectedTour.x, selectedTour.y + 0.05, selectedTour.z);
      popupRef.current.position.lerp(popupPosition, 0.1);
      popupRef.current.lookAt(camera.position);
    }

    if (rotate && globeRef.current) {
      globeRef.current.rotation.y += 0.003;
    }

    if (pinsRef.current.length) {
      const distance = camera.position.length();
      const baseSize = 0.1;
      const scaleFactor = Math.max(0.02, baseSize * (distance / 5));
      pinsRef.current.forEach((pin) => pin?.scale.set(scaleFactor, scaleFactor, scaleFactor));
    }
  });

  const handlePinClick = (tour: any, x: number, y: number, z: number) => {
    setSelectedTour({ ...tour, x, y, z });
    setCurrentImageIndex(0);
    setShowRecommendations(false);
  };

  const triggerAIRecommendations = () => {
    if (recommendations.length > 0) {
      openAIModel(recommendations);
    }
  };

  return (
    <>
      <group ref={globeRef}>
        <primitive object={scene} scale={scale} position={position} rotation={[0, 1.2, 0]} />

        {tours.map((tour, index) => {
          const radius = 2.5;
          const { x, y, z } = toCartesian(tour.latitude, tour.longitude, radius);

          return (
            <mesh
              key={tour.id}
              position={[x, y, z]}
              ref={(el) => {
                if (el) pinsRef.current[index] = el;
              }}
              rotation={[-Math.PI, 0, 0]}
              onPointerDown={(event) => {
                event.stopPropagation();
                handlePinClick(tour, x, y, z);
              }}
            >
              <coneGeometry args={[0.2, 1.5, 32]} />
              <meshStandardMaterial color={selectedTour?.id === tour.id ? 'yellow' : 'red'} />
            </mesh>
          );
        })}
      </group>

      {selectedTour && (
        <group ref={popupRef}>
          <Html center distanceFactor={2} transform>
            <TourPopup
              tour={selectedTour}
              currentImageIndex={currentImageIndex}
              onNextImage={handleNextImage}
              onPrevImage={handlePrevImage}
              onClose={handleClosePopup}
              openAIModel={triggerAIRecommendations}
            />
          </Html>
        </group>
      )}
    </>
  );
};

useGLTF.preload('/models/scene.gltf');
export default Globe;
