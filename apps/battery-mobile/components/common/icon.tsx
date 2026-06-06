import type { LucideProps } from "lucide-react-native";
import type { ComponentType } from "react";

// Wrapper to bypass React 19 type incompatibility with lucide-react-native
export function Icon({
  component: Component,
  ...props
}: LucideProps & { component: ComponentType<LucideProps> }) {
  // @ts-expect-error lucide-react-native types are incompatible with React 19
  return <Component {...props} />;
}
