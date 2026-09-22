"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

export function IconBtn({
  active,
  variant,
  children,
  tooltip,
  disabled,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  variant?: "default" | "primary" | "danger";
  tooltip?: string;
}) {
  let classes =
    "relative h-8 px-2 flex items-center gap-1 text-sm font-medium rounded-md transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ";

  if (disabled) {
    classes += "text-slate-300 cursor-not-allowed";
  } else if (variant === "primary") {
    classes += "bg-slate-700 text-white hover:bg-slate-600 shadow-sm";
  } else if (variant === "danger") {
    classes += "text-slate-500 hover:text-red-600 hover:bg-red-50";
  } else if (active) {
    classes += "bg-slate-200 text-slate-900 ring-1 ring-slate-300";
  } else {
    classes += "text-slate-500 hover:text-slate-700 hover:bg-slate-100";
  }

  const button = (
    <button
      className={classes + (className || "")}
      disabled={disabled}
      aria-label={tooltip}
      aria-pressed={active !== undefined ? active : undefined}
      {...props}
    >
      {children}
    </button>
  );

  if (tooltip && !disabled) {
    return (
      <div className="relative group/tooltip">
        {button}
        <div className="pointer-events-none absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2 opacity-0 transition-opacity duration-150 group-hover/tooltip:opacity-100">
          <div className="whitespace-nowrap rounded-md bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg">
            {tooltip}
            <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-slate-800" />
          </div>
        </div>
      </div>
    );
  }

  return button;
}

export function Separator() {
  return <div className="w-px h-6 bg-slate-200 mx-1" />;
}

export function ToolbarGroup({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center space-x-1 bg-slate-50 rounded-lg p-0.5">
      {children}
    </div>
  );
}
