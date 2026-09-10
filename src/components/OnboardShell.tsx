import type { ReactNode } from "react";

export function OnboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="onboard">
      <div className="onboard-wrap">
        <div className="onboard-brand">
          <div className="onboard-brand-mark">K</div>
          <div className="onboard-brand-name">Katalagge</div>
        </div>
        {children}
      </div>
    </div>
  );
}
