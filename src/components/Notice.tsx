import type { ReactNode } from "react";

type NoticeProps = { children: ReactNode; variant?: "brass" | "bad" };

export function Notice({ children, variant = "brass" }: NoticeProps) {
  return <div className={`notice notice-${variant}`}>{children}</div>;
}
