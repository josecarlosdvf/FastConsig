/**
 * SchemaForm — Zod-driven form component.
 *
 * Renders a form entirely from a Zod schema + a field configuration map.
 * This guarantees:
 *  - Field types match the Zod schema (type-safe).
 *  - Validation runs client-side before submit (same rules as the backend).
 *  - Error messages are derived from Zod — never duplicated.
 *  - Adding a new field = only change the schema. The form updates automatically.
 *
 * Usage:
 * ```tsx
 * const schema = z.object({
 *   name: z.string().min(2),
 *   email: z.string().email(),
 *   role: z.enum(["ADMIN", "MEMBER"]),
 * });
 *
 * <SchemaForm
 *   schema={schema}
 *   fields={{
 *     name:  { label: "Nome",  type: "text" },
 *     email: { label: "Email", type: "email" },
 *     role:  { label: "Papel", type: "select", options: [
 *       { value: "ADMIN",  label: "Administrador" },
 *       { value: "MEMBER", label: "Membro" },
 *     ]},
 *   }}
 *   onSubmit={async (data) => { await api.post("/users", data); }}
 *   submitLabel="Criar usuário"
 * />
 * ```
 */

import React, { useState } from "react";
import { ZodObject, ZodRawShape, ZodError, z } from "zod";
import { Form, FormAlert } from "./form";
import { Input } from "./input";
import { Button } from "./button";

// ─── Field configuration ──────────────────────────────────────────────────────

export type TextInputType = "text" | "email" | "password" | "number" | "tel" | "url";

export interface TextField {
  label: string;
  type: TextInputType;
  placeholder?: string;
  autoComplete?: string;
}

export interface SelectField {
  label: string;
  type: "select";
  options: Array<{ value: string; label: string }>;
}

export interface TextareaField {
  label: string;
  type: "textarea";
  placeholder?: string;
  rows?: number;
}

export interface CheckboxField {
  label: string;
  type: "checkbox";
}

export type FieldConfig = TextField | SelectField | TextareaField | CheckboxField;

/**
 * `FieldMap<T>` maps each key in a Zod schema shape to a `FieldConfig`.
 * This provides a compile-time guarantee that every schema field has a
 * corresponding UI configuration (and no extra fields are configured).
 */
export type FieldMap<Shape extends ZodRawShape> = {
  [K in keyof Shape]: FieldConfig;
};

// ─── Component props ──────────────────────────────────────────────────────────

export interface SchemaFormProps<Shape extends ZodRawShape> {
  /** Zod schema that defines the shape and validation rules */
  schema: ZodObject<Shape>;
  /** Field UI configuration — one entry per schema key */
  fields: FieldMap<Shape>;
  /** Called with validated data only if all fields pass schema validation */
  onSubmit: (data: z.infer<ZodObject<Shape>>) => Promise<void> | void;
  /** Initial values (optional — useful for edit forms) */
  defaultValues?: Partial<Record<keyof Shape, unknown>>;
  /** Text for the submit button */
  submitLabel?: string;
  /** Form title passed to the underlying Form component */
  title?: string;
  /** Form description passed to the underlying Form component */
  description?: string;
}

// ─── SchemaForm ───────────────────────────────────────────────────────────────

export function SchemaForm<Shape extends ZodRawShape>({
  schema,
  fields,
  onSubmit,
  defaultValues = {},
  submitLabel = "Salvar",
  title,
  description,
}: SchemaFormProps<Shape>): React.ReactElement {
  const fieldKeys = Object.keys(fields) as Array<keyof Shape & string>;

  const initValues = (): Record<string, unknown> => {
    const init: Record<string, unknown> = {};
    for (const key of fieldKeys) {
      const field = fields[key];
      if (field.type === "checkbox") {
        init[key] = (defaultValues as Record<string, unknown>)[key] ?? false;
      } else {
        init[key] = (defaultValues as Record<string, unknown>)[key] ?? "";
      }
    }
    return init;
  };

  const [values, setValues] = useState<Record<string, unknown>>(initValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const handleChange = (key: string, value: unknown): void => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setSucceeded(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    const result = schema.safeParse(values);

    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of (result.error as ZodError).issues) {
        const key = issue.path[0] as string;
        if (key && !errors[key]) {
          errors[key] = issue.message;
        }
      }
      setFieldErrors(errors);
      setIsSubmitting(false);
      return;
    }

    try {
      await onSubmit(result.data);
      setSucceeded(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Ocorreu um erro inesperado.";
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto">
      {submitLabel}
    </Button>
  );

  return (
    <Form
      title={title}
      description={description}
      onSubmit={(e) => void handleSubmit(e)}
      footer={footer}
      noValidate
    >
      {formError ? <FormAlert type="error" message={formError} /> : null}
      {succeeded ? <FormAlert type="success" message="Salvo com sucesso!" /> : null}

      {fieldKeys.map((key) => {
        const field = fields[key];
        const value = values[key];
        const error = fieldErrors[key];
        const inputId = `field-${key}`;

        if (field.type === "select") {
          return (
            <div key={key} className="flex flex-col gap-1">
              <label htmlFor={inputId} className="text-sm font-medium text-neutral-700">
                {field.label}
              </label>
              <select
                id={inputId}
                value={value as string}
                onChange={(e) => handleChange(key, e.target.value)}
                className={[
                  "block w-full rounded-md border px-3 py-2 text-sm shadow-sm",
                  "focus:outline-none focus:ring-2 focus:ring-primary-500",
                  error ? "border-danger-500" : "border-neutral-300",
                ].join(" ")}
              >
                <option value="">Selecione…</option>
                {field.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {error ? <p className="text-xs text-danger-600">{error}</p> : null}
            </div>
          );
        }

        if (field.type === "textarea") {
          return (
            <div key={key} className="flex flex-col gap-1">
              <label htmlFor={inputId} className="text-sm font-medium text-neutral-700">
                {field.label}
              </label>
              <textarea
                id={inputId}
                value={value as string}
                rows={field.rows ?? 3}
                placeholder={field.placeholder}
                onChange={(e) => handleChange(key, e.target.value)}
                className={[
                  "block w-full rounded-md border px-3 py-2 text-sm shadow-sm",
                  "focus:outline-none focus:ring-2 focus:ring-primary-500",
                  error ? "border-danger-500" : "border-neutral-300",
                ].join(" ")}
              />
              {error ? <p className="text-xs text-danger-600">{error}</p> : null}
            </div>
          );
        }

        if (field.type === "checkbox") {
          return (
            <div key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                id={inputId}
                checked={Boolean(value)}
                onChange={(e) => handleChange(key, e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor={inputId} className="text-sm font-medium text-neutral-700">
                {field.label}
              </label>
              {error ? <p className="text-xs text-danger-600">{error}</p> : null}
            </div>
          );
        }

        // Default: text / email / password / number
        return (
          <Input
            key={key}
            id={inputId}
            type={field.type}
            label={field.label}
            placeholder={(field as TextField).placeholder}
            autoComplete={(field as TextField).autoComplete}
            value={value as string}
            onChange={(e) => handleChange(key, e.target.value)}
            error={error}
          />
        );
      })}
    </Form>
  );
}
