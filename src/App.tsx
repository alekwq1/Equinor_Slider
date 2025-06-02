import * as THREE from "three";
import { Canvas, extend, useFrame } from "@react-three/fiber";
import { CameraControls, StatsGl, Html } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { Splat } from "./lib/Splat";
import { SplatMaterial } from "./lib/SplatMaterial";

extend({ SplatMaterial });

const degToRad = (deg: number) => (deg * Math.PI) / 180;

const splatFiles = [
  {
    label: "04.06.2024",
    url: "/models/Equinor_04_06_2024.splat",
    position: new THREE.Vector3(96.9, 54.9, 0.5),
    rotation: new THREE.Euler(degToRad(0), degToRad(-101), degToRad(1)),
    scale: new THREE.Vector3(1.34, 1.34, 1.34),
  },
  {
    label: "29.01.2025",
    url: "/models/Equinor_29_01_2025.splat",
    position: new THREE.Vector3(-12, 0, -25.4),
    rotation: new THREE.Euler(0, degToRad(-29.8), degToRad(-1.5)),
    scale: new THREE.Vector3(1, 1, 1),
  },
  {
    label: "03.02.2025",
    url: "/models/Equinor_03_02_2025.splat",
    position: new THREE.Vector3(-3.6, 1.5, -12.8),
    rotation: new THREE.Euler(0, degToRad(176), 0),
    scale: new THREE.Vector3(0.983, 0.983, 0.983),
  },
  {
    label: "28.04.2025",
    url: "/models/Equinor_28_04_2025.splat",
    position: new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Euler(0, 0, 0),
    scale: new THREE.Vector3(1, 1, 1),
  },
  {
    label: "08.05.2025",
    url: "/models/Equinor_08_05_2025.splat",
    position: new THREE.Vector3(-14.5, 0, -20.5),
    rotation: new THREE.Euler(0, degToRad(-24.5), 0),
    scale: new THREE.Vector3(1, 1, 1),
  },
  {
    label: "02.06.2025",
    url: "/models/Equinor_02_06_2025.splat",
    position: new THREE.Vector3(8.2, 2, -12),
    rotation: new THREE.Euler(degToRad(4), degToRad(-76.2), degToRad(5)),
    scale: new THREE.Vector3(1, 1, 1),
  },
];

const infoPoints = [
  {
    id: "biuro-budowy",
    position: new THREE.Vector3(-40, 5, -65),
    label: "Biuro Budowy",
    icon: "🏠",
    content: `Godziny dostępności:ᅠᅠᅠᅠᅠᅠ ᅠᅠ     🕒Poniedziałek – Piątek: 7:00 – 17:00ᅠ
🚫 Po godzinach dostęp wyłącznie dla osób upoważnionych.`,
  },
  {
    id: "glowna-droga",
    position: new THREE.Vector3(35, 5, -5),
    label: "Magazyn",
    icon: "🏗️",
    content: "Stan budowy: 10% ukończoności",
  },
];

export default function App() {
  const [clipX, setClipX] = useState(2);
  const [dpr, setDpr] = useState(1); // New state for DPR
  const [isLoading, setIsLoading] = useState(true);
  const [blobs, setBlobs] = useState<(string | null)[]>(
    splatFiles.map(() => null)
  );
  const [backgroundBlob, setBackgroundBlob] = useState<string | null>(null);
  const [leftIndex, setLeftIndex] = useState(splatFiles.length - 2);
  const [rightIndex, setRightIndex] = useState(splatFiles.length - 1);
  const [showAllInfoPoints, setShowAllInfoPoints] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeInfoPoint, setActiveInfoPoint] = useState<string | null>(null);
  const controlsRef = useRef<CameraControls | null>(null);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.setLookAt(0, 150, 85, 10, 0, -10, true);
    }
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const resetCamera = () => {
    controlsRef.current?.setLookAt(0, 150, 85, 10, 0, -10, true);
  };

  const handleFocusPoint = (position: THREE.Vector3) => {
    if (controlsRef.current) {
      const cameraPosition = new THREE.Vector3(
        position.x - 10,
        position.y + 120,
        position.z + 80
      );

      controlsRef.current.setLookAt(
        cameraPosition.x,
        cameraPosition.y,
        cameraPosition.z,
        position.x,
        position.y,
        position.z,
        true
      );
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const last = splatFiles.length - 1;
    const loadInitial = async () => {
      try {
        const res = await fetch(splatFiles[last].url);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setBlobs((prev) => {
          const next = [...prev];
          next[last] = url;
          return next;
        });
      } catch (e) {
        console.error("Błąd ładowania pierwszego modelu:", e);
      } finally {
        setIsLoading(false);
      }
    };

    const loadBackground = async () => {
      try {
        const res = await fetch("/models/Equinor_Back.splat");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setBackgroundBlob(url);
      } catch (e) {
        console.error("Błąd ładowania tła:", e);
      }
    };

    loadInitial();
    loadBackground();

    return () => {
      blobs.forEach((url) => url && URL.revokeObjectURL(url));
      backgroundBlob && URL.revokeObjectURL(backgroundBlob);
    };
  }, []);

  useEffect(() => {
    const loadOthers = async () => {
      await Promise.all(
        splatFiles.map(async (file, i) => {
          if (blobs[i]) return;
          try {
            const res = await fetch(file.url);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            setBlobs((prev) => {
              const next = [...prev];
              next[i] = url;
              return next;
            });
          } catch (e) {
            console.error(`Błąd ładowania ${file.label}:`, e);
          }
        })
      );
    };

    !isLoading && loadOthers();
  }, [isLoading]);

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      {isLoading && <LoadingOverlay />}

      {!isLoading && (
        <ButtonInfo
          leftLabel={splatFiles[leftIndex].label}
          rightLabel={splatFiles[rightIndex].label}
          onShow={() => setShowAllInfoPoints(false)}
          onHide={() => setShowAllInfoPoints(true)}
        />
      )}

      <Canvas
        dpr={dpr}
        camera={{ position: [40, 90, 210], fov: 40 }}
        gl={{
          antialias: false,
          powerPreference: "high-performance",
          alpha: false,
        }}
      >
        <color attach="background" args={["#dce2e8"]} />

        <CameraControls
          ref={controlsRef}
          makeDefault
          minDistance={110}
          maxDistance={500}
          minPolarAngle={Math.PI / 90}
          maxPolarAngle={Math.PI / 2.5}
          dollySpeed={0.2}
        />
        <CameraLogger controlsRef={controlsRef} />
        <StatsGl />
        <ScreenFog />

        {backgroundBlob && (
          <Splat
            src={backgroundBlob}
            position={new THREE.Vector3(0, 0, 0)}
            rotation={new THREE.Euler(0, 0, 0)}
            scale={new THREE.Vector3(1, 1, 1)}
            maxSplats={1000000}
          />
        )}

        {!isLoading && blobs[leftIndex] && blobs[rightIndex] && (
          <>
            <Splat
              src={blobs[leftIndex]!}
              clipX={clipX}
              clipSide={1}
              maskMode={1}
              position={splatFiles[leftIndex].position}
              rotation={splatFiles[leftIndex].rotation}
              scale={splatFiles[leftIndex].scale}
            />
            <Splat
              src={blobs[rightIndex]!}
              clipX={clipX}
              clipSide={-1}
              maskMode={1}
              position={splatFiles[rightIndex].position}
              rotation={splatFiles[rightIndex].rotation}
              scale={splatFiles[rightIndex].scale}
            />
          </>
        )}

        {!isLoading &&
          showAllInfoPoints &&
          infoPoints.map((point) => (
            <InfoPoint
              key={point.id}
              icon={point.icon}
              position={point.position}
              label={point.label}
              content={point.content}
              onFocus={handleFocusPoint}
              isActive={activeInfoPoint === point.id}
              onToggle={() => {
                setActiveInfoPoint((prev) =>
                  prev === point.id ? null : point.id
                );
              }}
            />
          ))}
      </Canvas>
      {!isLoading && (
        <div style={dprControlsStyle}>
          <label style={{ color: "white", marginRight: "8px" }}>
            DPR: {dpr.toFixed(1)}
          </label>
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.1"
            value={dpr}
            onChange={(e) => setDpr(Number(e.target.value))}
            style={{ width: "100px" }}
          />
        </div>
      )}
      {!isLoading && (
        <div style={navStyle}>
          <select
            value={leftIndex}
            onChange={(e) => setLeftIndex(Number(e.target.value))}
            style={{
              background: "#ffebee",
              border: "2px solid #d32f2f",
              borderRadius: "8px",
              padding: "8px 12px",
              color: "#b71c1c",
              fontWeight: "bold",
              cursor: "pointer",
              marginRight: "10px",
            }}
          >
            {splatFiles.map((f, i) => (
              <option
                key={f.label}
                value={i}
                style={{
                  backgroundColor: i === leftIndex ? "#ffcdd2" : "#ffebee",
                }}
              >
                Left: {f.label}
              </option>
            ))}
          </select>

          <div
            style={{ flex: 1, minWidth: 75, maxWidth: 200, margin: "0 10px" }}
          >
            <input
              type="range"
              min={-2}
              max={2}
              step={0.1}
              value={clipX}
              onChange={(e) => setClipX(Number(e.target.value))}
              style={{ width: "100%", transform: "translateY(2px)" }}
            />
          </div>

          <select
            value={rightIndex}
            onChange={(e) => setRightIndex(Number(e.target.value))}
            style={{
              background: "#e3f2fd",
              border: "2px solid #2196f3",
              borderRadius: "8px",
              padding: "8px 12px",
              color: "#0d47a1",
              fontWeight: "bold",
              cursor: "pointer",
              marginLeft: "10px",
            }}
          >
            {splatFiles.map((f, i) => (
              <option
                key={f.label}
                value={i}
                style={{
                  backgroundColor: i === rightIndex ? "#bbdefb" : "#e3f2fd",
                }}
              >
                Right: {f.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {!isLoading && (
        <div style={controlsStyle}>
          <button style={controlButtonStyle} onClick={toggleFullscreen}>
            {isFullscreen ? "⤡" : "⤢"}
          </button>
          <button style={controlButtonStyle} onClick={resetCamera}>
            🎥
          </button>
        </div>
      )}
    </div>
  );
}

function ScreenFog() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(() => {
    ref.current!.rotation.y += 0.0001;
  });

  return (
    <mesh ref={ref} position={[0, 100, 0]} rotation={[degToRad(265), 0, 0]}>
      <planeGeometry args={[150000, 150000]} />
      <meshBasicMaterial
        color="#dce2e8"
        transparent
        opacity={0.8}
        depthWrite={true}
      />
    </mesh>
  );
}

function InfoPoint({
  position,
  label,
  content,
  icon = "🚩",
  onFocus,
  isActive,
  onToggle,
}: {
  position: THREE.Vector3;
  label: string;
  content: string;
  icon?: string;
  onFocus?: (position: THREE.Vector3) => void;
  isActive: boolean;
  onToggle: () => void;
}) {
  const markerRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        markerRef.current &&
        !markerRef.current.contains(e.target as Node) &&
        infoRef.current &&
        !infoRef.current.contains(e.target as Node)
      ) {
        onToggle();
      }
    };

    if (isActive) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isActive, onToggle]);

  return (
    <Html position={position} center>
      <div
        ref={markerRef}
        style={{
          background: "rgba(33, 140, 227, 0.9)",
          borderRadius: "50%",
          width: "32px",
          height: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "white",
          fontSize: "24px",
          transition: "all 0.2s",
          transform: isActive ? "scale(1.2)" : "scale(1)",
        }}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
          onFocus?.(position);
        }}
      >
        {icon}
      </div>
      {isActive && (
        <div
          ref={infoRef}
          style={{
            position: "absolute",
            bottom: "40px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "white",
            padding: "1.5rem",
            borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            width: "320px",
            zIndex: 1000,
          }}
        >
          <h3 style={{ margin: "0 0 1rem 0", color: "#2261c5" }}>{label}</h3>
          <p style={{ margin: 0, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
            {content}
          </p>
          <button
            style={{
              position: "absolute",
              top: "0.5rem",
              right: "0.5rem",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "1.2rem",
              color: "#666",
            }}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          >
            ×
          </button>
        </div>
      )}
    </Html>
  );
}

function ButtonInfo({
  leftLabel,
  rightLabel,
  onShow,
  onHide,
}: {
  leftLabel: string;
  rightLabel: string;
  onShow: () => void;
  onHide: () => void;
}) {
  const [showInfo, setShowInfo] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isCloseHovered, setIsCloseHovered] = useState(false);

  const handleToggle = (show: boolean) => {
    setShowInfo(show);
    show ? onShow() : onHide();
  };

  return (
    <>
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: 20,
          zIndex: 1000,
          background: isHovered
            ? "rgba(33, 140, 227, 0.8)"
            : "rgba(33, 140, 227, 0.42)",
          borderRadius: "8px",
          padding: "8px 16px",
          cursor: "pointer",
          transition: "all 0.2s",
          color: "white",
          display: "flex",
          gap: "8px",
          alignItems: "center",
          transform: isHovered ? "scale(1.05)" : "scale(1)",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => handleToggle(true)}
      >
        ℹ️ Jak korzystać?
      </div>

      {showInfo && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 1001,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(2px)",
          }}
          onClick={() => handleToggle(false)}
        >
          <div
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: "12px",
              maxWidth: "500px",
              position: "relative",
              boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, color: "#2261c5" }}>
              Instrukcja obsługi
            </h2>
            <div style={{ lineHeight: 1.6 }}>
              <p>
                <strong>Aktualne porównanie:</strong>
                <br />
                🟥 {leftLabel}
                <br />
                🟦 {rightLabel}
              </p>
              <p>
                <strong>Sterowanie:</strong>
                <ul>
                  <li>Lewy przycisk myszy - obracanie widoku</li>
                  <li>Prawy przycisk myszy - przesuwanie widoku</li>
                  <li>Kółko myszy - zoom</li>
                  <li>Suwak - regulacja płaszczyzny porównania</li>
                  <li>Kliknij znaczniki 🚩 by przejść do lokalizacji</li>
                </ul>
              </p>
            </div>
            <button
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                background: "none",
                border: "none",
                fontSize: "1.5rem",
                cursor: "pointer",
                color: isCloseHovered ? "#2261c5" : "#666",
              }}
              onMouseEnter={() => setIsCloseHovered(true)}
              onMouseLeave={() => setIsCloseHovered(false)}
              onClick={() => handleToggle(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const navStyle: React.CSSProperties = {
  position: "absolute",
  bottom: 20,
  left: "50%",
  transform: "translateX(-50%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0.5rem 1rem",
  background: "rgba(33, 140, 227, 0.15)",
  borderRadius: "1rem",
  zIndex: 10,
  width: "90%",
  maxWidth: "500px",
  backdropFilter: "blur(5px)",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
};

const controlsStyle: React.CSSProperties = {
  position: "absolute",
  bottom: 20,
  right: 20,
  display: "flex",
  gap: "1rem",
  zIndex: 10,
};

const controlButtonStyle: React.CSSProperties = {
  background: "rgba(33, 140, 227, 0.42)",
  border: "none",
  borderRadius: "8px",
  padding: "8px 16px",
  cursor: "pointer",
  color: "white",
  fontSize: "24px",
  transition: "all 0.2s",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "48px",
  height: "48px",
};
const dprControlsStyle: React.CSSProperties = {
  position: "absolute",
  top: 20,
  right: 20,
  display: "flex",
  alignItems: "center",
  background: "rgba(33, 140, 227, 0.42)",
  borderRadius: "8px",
  padding: "8px 16px",
  zIndex: 10,
  backdropFilter: "blur(5px)",
};
function LoadingOverlay() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(255,255,255,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
        fontSize: "1.5rem",
        fontWeight: "bold",
        color: "#2261c5",
      }}
    >
      ⏳ Ładowanie modeli...
    </div>
  );
}

function CameraLogger({
  controlsRef,
}: {
  controlsRef: React.RefObject<CameraControls>;
}) {
  useFrame(() => {
    if (controlsRef.current) {
      const pos = controlsRef.current.camera.position;
      console.log(
        `📷 Kamera: x=${pos.x.toFixed(2)} y=${pos.y.toFixed(
          2
        )} z=${pos.z.toFixed(2)}`
      );
    }
  });
  return null;
}
