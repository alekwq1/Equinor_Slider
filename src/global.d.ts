import type { SplatMaterialType } from "./lib/types";
import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      splatMaterial: DetailedHTMLProps<
        HTMLAttributes<HTMLElement>,
        HTMLElement
      > &
        SplatMaterialType &
        JSX.IntrinsicElements["shaderMaterial"];
    }
  }
}
