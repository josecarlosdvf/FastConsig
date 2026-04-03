import React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, id, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label ? (
        <label htmlFor={id} className="text-sm font-medium text-neutral-700">
          {label}
        </label>
      ) : null}
      <input
        id={id}
        {...props}
        className={[
          "block w-full rounded-md border px-3 py-2 text-sm shadow-sm",
          "focus:outline-none focus:ring-2 focus:ring-primary-500",
          error ? "border-danger-500" : "border-neutral-300",
          className,
        ].join(" ")}
      />
      {error ? <p className="text-xs text-danger-600">{error}</p> : null}
    </div>
  );
}
