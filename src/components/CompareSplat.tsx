import { useState } from "react";
import { Splat } from "../lib/Splat";

const splatFiles = [
  {
    label: "EQUINOR_1",
    url: "https://huggingface.co/datasets/Alekso/Equinor_Base_20240604/resolve/main/EQUINOR_20240604.splat",
  },
  {
    label: "EQUINOR_2",
    url: "https://huggingface.co/datasets/Alekso/Equinor_Base_20240604/resolve/main/EQUINOR_2.splat",
  },
  { label: "EQUINOR_3", url: "https://example.com/equinor3.splat" },
  { label: "EQUINOR_4", url: "https://example.com/equinor4.splat" },
];

export function CompareSplat() {
  const [leftIndex, setLeftIndex] = useState(0);
  const [rightIndex, setRightIndex] = useState(1);
  const [clipX, setClipX] = useState(0.0);

  return (
    <>
      <Splat
        src={splatFiles[leftIndex].url}
        position={[0, 0, 0]}
        material-clipX={clipX}
        material-clipSide={-1}
      />
      <Splat
        src={splatFiles[rightIndex].url}
        position={[0, 0, 0]}
        material-clipX={clipX}
        material-clipSide={1}
      />

      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "1rem",
          padding: "0.5rem 1rem",
          background: "rgba(255,255,255,0.9)",
          borderRadius: "1rem",
          zIndex: 10,
        }}
      >
        <select
          value={leftIndex}
          onChange={(e) => setLeftIndex(Number(e.target.value))}
        >
          {splatFiles.map((f, i) => (
            <option key={f.label} value={i}>
              Left: {f.label}
            </option>
          ))}
        </select>

        <input
          type="range"
          min={-2}
          max={2}
          step={0.01}
          value={clipX}
          onChange={(e) => setClipX(Number(e.target.value))}
        />

        <select
          value={rightIndex}
          onChange={(e) => setRightIndex(Number(e.target.value))}
        >
          {splatFiles.map((f, i) => (
            <option key={f.label} value={i}>
              Right: {f.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
