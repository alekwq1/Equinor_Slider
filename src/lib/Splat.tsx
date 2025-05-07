import * as THREE from "three";
import * as React from "react";
import { extend, useThree, useFrame, useLoader } from "@react-three/fiber";
import { SplatMaterial } from "./SplatMaterial";
import { SplatLoader } from "./SplatLoader";
import type { TargetMesh, SharedState } from "./types";

type SplatProps = {
  src: string;
  toneMapped?: boolean;
  alphaTest?: number;
  alphaHash?: boolean;
  chunkSize?: number;
  clipX?: number;
  clipSide?: number;
  maskMode?: number;
  maxSplats?: number;
} & JSX.IntrinsicElements["mesh"];

interface SplatShaderMaterial extends THREE.ShaderMaterial {
  uniforms: {
    clipX: { value: number };
    clipSide: { value: number };
    maskMode: { value: number };
  };
}

export function Splat({
  src,
  toneMapped = false,
  alphaTest = 0,
  alphaHash = false,
  chunkSize = 25000,
  clipX = 0,
  clipSide = 0,
  maskMode = 0,
  maxSplats = 1000000,
  ...props
}: SplatProps) {
  extend({ SplatMaterial });

  const ref = React.useRef<TargetMesh>(null!);
  const gl = useThree((state) => state.gl);
  const camera = useThree((state) => state.camera);

  const shared = useLoader(SplatLoader, src, (loader: SplatLoader) => {
    loader.gl = gl;
    loader.chunkSize = chunkSize;
  }) as SharedState;

  React.useLayoutEffect(() => {
    if (ref.current) shared.connect(ref.current);
  }, [shared, src]);

  useFrame(() => {
    shared.update(ref.current, camera, alphaHash);

    const mat = ref.current?.material as SplatShaderMaterial;
    if (mat?.uniforms) {
      mat.uniforms.clipX.value = clipX;
      mat.uniforms.clipSide.value = clipSide;
      mat.uniforms.maskMode.value = maskMode;
    }
  });

  return (
    <mesh
      ref={ref}
      frustumCulled={false}
      renderOrder={maskMode > 0 ? 1 : 0}
      {...props}
    >
      <splatMaterial
        key={`${src}/${alphaTest}/${alphaHash}/${SplatMaterial.key}`}
        transparent={!alphaHash || maskMode > 0}
        depthWrite={maskMode === 0}
        depthTest={maskMode === 0}
        alphaTest={alphaHash ? 0 : alphaTest}
        centerAndScaleTexture={shared.centerAndScaleTexture}
        covAndColorTexture={shared.covAndColorTexture}
        blending={
          alphaHash || maskMode > 0
            ? THREE.NormalBlending
            : THREE.CustomBlending
        }
        blendSrcAlpha={THREE.OneFactor}
        alphaHash={!!alphaHash}
        toneMapped={toneMapped}
      />
    </mesh>
  );
}
