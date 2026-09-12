import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  block?: boolean;
  variant?: "primary" | "ghost";
  size?: "sm";
};

export function Button({ block, variant = "primary", size, className, ...props }: ButtonProps) {
  const classes = ["btn", `btn-${variant}`, block && "btn-block", size === "sm" && "btn-sm", className]
    .filter(Boolean)
    .join(" ");
  return <button className={classes} {...props} />;
}
