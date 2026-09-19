import type { ReactNode } from "react";

type NoticeProps = { children: ReactNode; variant?: "brass" | "bad" };

export function Notice({ children, variant = "brass" }: NoticeProps) {
  // wrapped in a span so `.notice`'s flex layout always sees one item — passing multiple
  // top-level children (e.g. text mixed with a <strong>) would otherwise turn each into its
  // own flex item and break wrapping.
  return (
    <div className={`notice notice-${variant}`}>
      <span>{children}</span>
    </div>
  );
}
