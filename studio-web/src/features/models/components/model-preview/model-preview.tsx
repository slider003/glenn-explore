import { OrbitControls, useGLTF, Grid, Environment, Text, Box } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";


interface ModelPreviewProps {
  url: string;
  scale?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  position?: { x: number; y: number; z: number };
}

const defaultScale = { x: 1, y: 1, z: 1 };
const defaultRotation = { x: 0, y: 0, z: 0 };
const defaultPosition = { x: 0, y: 0, z: 0 };

function ReferenceObjects() {
  // Car reference (roughly 4.5m x 1.8m x 1.5m)
  return (
    <group position={[3, 0, 3]}>
      <Box args={[4.5, 1.5, 1.8]} position={[0, 0.75, 0]}>
        <meshStandardMaterial wireframe color="#666666" opacity={0.5} transparent />
      </Box>
      <Text
        position={[0, 2, 0]}
        fontSize={0.3}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        Reference Car Size
      </Text>
    </group>
  );
}

function DirectionIndicators() {
  return (
    <group>
      {/* X-axis (red) */}
      <group position={[2, 0, 0]}>
        <Box args={[4, 0.1, 0.1]} position={[0, 0, 0]} material-color="#ff0000" />
        <Text position={[2.2, 0.3, 0]} fontSize={0.3} color="#ff0000">
          X (Forward)
        </Text>
      </group>

      {/* Y-axis (green) */}
      <group position={[0, 2, 0]}>
        <Box args={[0.1, 4, 0.1]} position={[0, 0, 0]} material-color="#00ff00" />
        <Text position={[0.3, 2.2, 0]} fontSize={0.3} color="#00ff00">
          Y (Up)
        </Text>
      </group>

      {/* Z-axis (blue) */}
      <group position={[0, 0, 2]}>
        <Box args={[0.1, 0.1, 4]} position={[0, 0, 0]} material-color="#0000ff" />
        <Text position={[0, 0.3, 2.2]} fontSize={0.3} color="#0000ff">
          Z (Right)
        </Text>
      </group>
    </group>
  );
}

function Model({ url, scale = defaultScale, rotation = defaultRotation, position = defaultPosition }: ModelPreviewProps) {
  const { scene } = useGLTF(url);

  // Convert rotation from degrees to radians and adjust for coordinate system differences
  const rotationInRadians = {
    // Subtract 90 degrees from X rotation to match Threebox orientation
    x: (((rotation?.x ?? 0) - 90) * Math.PI) / 180,
    // Negate Y rotation to match Threebox rotation direction
    y: (((rotation?.y ?? 0) + 90) * Math.PI) / 180,
    z: (((rotation?.z ?? 0)) * Math.PI) / 180
  };

  return (
    <group>
      <primitive
        object={scene}
        scale={[scale?.x ?? 1, scale?.y ?? 1, scale?.z ?? 1]}
        rotation={[rotationInRadians.x, rotationInRadians.y, rotationInRadians.z]}
        position={[position?.x ?? 0, position?.y ?? 0, position?.z ?? 0]}
        castShadow
        receiveShadow
      />
      <Grid
        position={[0, -0.5, 0]}
        args={[10, 10]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#6e6e6e"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#9d4b4b"
        fadeDistance={30}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid
      />
      <ReferenceObjects />
      <DirectionIndicators />
    </group>
  );
}

export function ModelPreview({ url, scale, rotation, position }: ModelPreviewProps) {
  if (!url) return null;
  console.log(url, rotation, position, scale)
  return (
    <div className="w-full h-[600px] bg-background border rounded-md">
      <Canvas
        camera={{ position: [10, 10, 10], fov: 50 }}
        style={{ width: "100%", height: "100%" }}
        gl={{ antialias: true }}
        shadows
      >
        <color attach="background" args={["#1a1a1a"]} />
        <ambientLight intensity={1.0} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
        <directionalLight position={[-10, 10, -5]} intensity={1.0} castShadow />
        <hemisphereLight intensity={0.5} groundColor="#666666" />
        <Suspense fallback={null}>
          <Model url={url} scale={scale} rotation={rotation} position={position} />
          <Environment preset="sunset" />
        </Suspense>
        <OrbitControls
          makeDefault
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 1.75}
        />
      </Canvas>
    </div>
  );
}
