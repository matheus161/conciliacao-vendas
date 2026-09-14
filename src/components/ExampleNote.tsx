import type { ReactNode } from "react";

export function ExampleNote({ children }: { children: ReactNode }) {
  return (
    <p className="example-note">
      <span className="pill example">Dado de exemplo</span>
      {children}
    </p>
  );
}
