import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";

export type SplatMaterialType = {
  alphaTest?: number;
  alphaHash?: boolean;
  centerAndScaleTexture?: THREE.DataTexture;
  covAndColorTexture?: THREE.DataTexture;
  viewport?: THREE.Vector2;
  focal?: number;
  clipX?: number;
  clipSide?: number;
  maskMode?: number;
} & JSX.IntrinsicElements["shaderMaterial"];

declare global {
  namespace JSX {
    interface IntrinsicElements {
      splatMaterial: SplatMaterialType;
    }
  }
}

export const SplatMaterial = shaderMaterial(
  {
    alphaTest: 0,
    viewport: new THREE.Vector2(1980, 1080),
    focal: 1000.0,
    centerAndScaleTexture: new THREE.DataTexture(new Uint8Array(4), 1, 1),
    covAndColorTexture: new THREE.DataTexture(new Uint8Array(4), 1, 1),
    clipX: 0.0,
    clipSide: 0.0,
    maskMode: 0.0,
  },

  // Vertex Shader
  `  
  precision highp float;
  precision highp int;
  precision highp sampler2D;
  precision highp usampler2D;

  out vec4 vColor;
  out vec3 vPosition;

  uniform vec2 viewport;
  uniform float focal;
  attribute uint splatIndex;
  uniform sampler2D centerAndScaleTexture;
  uniform usampler2D covAndColorTexture;

  vec2 unpackInt16(in uint value) {
    int v = int(value);
    int v0 = v >> 16;
    int v1 = (v & 0xFFFF);
    if ((v & 0x8000) != 0) v1 |= 0xFFFF0000;
    return vec2(float(v1), float(v0));
  }

  void main() {
    ivec2 texSize = textureSize(centerAndScaleTexture, 0);
    ivec2 texPos = ivec2(splatIndex % uint(texSize.x), splatIndex / uint(texSize.x));
    
    vec4 centerAndScaleData = texelFetch(centerAndScaleTexture, texPos, 0);
    vec4 center = vec4(centerAndScaleData.xyz, 1.0);
    vec4 camspace = modelViewMatrix * center;
    vec4 pos2d = projectionMatrix * camspace;

    float bounds = 1.2 * pos2d.w;
    if (pos2d.z < -pos2d.w || pos2d.x < -bounds || pos2d.x > bounds || pos2d.y < -bounds || pos2d.y > bounds) {
      gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
      return;
    }

    uvec4 covAndColorData = texelFetch(covAndColorTexture, texPos, 0);
    vec2 cov3D_M11_M12 = unpackInt16(covAndColorData.x) * centerAndScaleData.w;
    vec2 cov3D_M13_M22 = unpackInt16(covAndColorData.y) * centerAndScaleData.w;
    vec2 cov3D_M23_M33 = unpackInt16(covAndColorData.z) * centerAndScaleData.w;

    mat3 Vrk = mat3(
      cov3D_M11_M12.x, cov3D_M11_M12.y, cov3D_M13_M22.x,
      cov3D_M11_M12.y, cov3D_M13_M22.y, cov3D_M23_M33.x,
      cov3D_M13_M22.x, cov3D_M23_M33.x, cov3D_M23_M33.y
    );

    mat3 J = mat3(
      focal / camspace.z, 0., -(focal * camspace.x) / (camspace.z * camspace.z),
      0., focal / camspace.z, -(focal * camspace.y) / (camspace.z * camspace.z),
      0., 0., 0.
    );

    mat3 W = transpose(mat3(modelViewMatrix));
    mat3 T = W * J;
    mat3 cov = transpose(T) * Vrk * T;

    vec2 vCenter = vec2(pos2d) / pos2d.w;
    float diagonal1 = cov[0][0] + 0.3;
    float offDiagonal = cov[0][1];
    float diagonal2 = cov[1][1] + 0.3;
    float mid = 0.5 * (diagonal1 + diagonal2);
    float radius = length(vec2((diagonal1 - diagonal2) / 2.0, offDiagonal));
    float lambda1 = mid + radius;
    float lambda2 = max(mid - radius, 0.1);

    vec2 diagonalVector = normalize(vec2(offDiagonal, lambda1 - diagonal1));
    vec2 v1 = min(sqrt(2.0 * lambda1), 1024.0) * diagonalVector;
    vec2 v2 = min(sqrt(2.0 * lambda2), 1024.0) * vec2(diagonalVector.y, -diagonalVector.x);

    uint colorUint = covAndColorData.w;
    vColor = vec4(
      float(colorUint & uint(0xFF)) / 255.0,
      float((colorUint >> uint(8)) & uint(0xFF)) / 255.0,
      float((colorUint >> uint(16)) & uint(0xFF)) / 255.0,
      float(colorUint >> uint(24)) / 255.0
    );
    vPosition = position.xyz;

    gl_Position = vec4(
      vCenter + position.x * v2 / viewport * 2.0 + position.y * v1 / viewport * 2.0,
      pos2d.z / pos2d.w,
      1.0
    );
  }
  `,

  // Fragment Shader
  `
  precision highp float;
  #include <alphatest_pars_fragment>
  #include <alphahash_pars_fragment>
  
  in vec4 vColor;
  in vec3 vPosition;

  uniform float clipX;
  uniform float clipSide;
  uniform float maskMode;

  void main() {
    float A = -dot(vPosition.xy, vPosition.xy);
    if (A < -4.0) discard;
    float B = exp(A) * vColor.a;
    vec4 diffuseColor = vec4(vColor.rgb, B);

    bool mask = (clipSide > 0.0 && vPosition.x < clipX) || (clipSide < 0.0 && vPosition.x > clipX);

    if (maskMode < 0.5) {
      if (mask) discard;
    } else {
      if (mask) diffuseColor.a = 0.0;
    }

    #include <alphatest_fragment>
    #include <alphahash_fragment>
    
    gl_FragColor = diffuseColor;
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
  `
);
