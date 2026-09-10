import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { block?: boolean };

export function Button({ block, className, ...props }: ButtonProps) {
  const classes = ["btn", "btn-primary", block && "btn-block", className].filter(Boolean).join(" ");
  return <button className={classes} {...props} />;
}
