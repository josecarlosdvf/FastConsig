import React from "react";

/** Wraps a group of form fields with a submit button and title */
export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  title?: string;
  description?: string;
  footer?: React.ReactNode;
}

export function Form({ title, description, footer, children, className = "", ...props }: FormProps) {
  return (
    <form
      {...props}
      className={["flex flex-col gap-5", className].join(" ")}
    >
      {title ? (
        <div className="mb-1">
          <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-neutral-500">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
      {footer ? <div className="pt-2">{footer}</div> : null}
    </form>
  );
}

/** Visual section inside a form */
export interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <fieldset className="flex flex-col gap-4 rounded-lg border border-neutral-200 p-4">
      {title ? (
        <legend className="-mt-7 mb-1 bg-white px-2 text-sm font-medium text-neutral-700">
          {title}
        </legend>
      ) : null}
      {description ? (
        <p className="text-xs text-neutral-500">{description}</p>
      ) : null}
      {children}
    </fieldset>
  );
}

/** Alert/feedback message inside a form */
export interface FormAlertProps {
  type: "error" | "success" | "warning";
  message: string;
}

const alertClasses: Record<FormAlertProps["type"], string> = {
  error: "bg-red-50 text-red-700 border-red-200",
  success: "bg-green-50 text-green-700 border-green-200",
  warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
};

export function FormAlert({ type, message }: FormAlertProps) {
  return (
    <div
      role="alert"
      className={[
        "rounded-md border px-4 py-3 text-sm",
        alertClasses[type],
      ].join(" ")}
    >
      {message}
    </div>
  );
}
