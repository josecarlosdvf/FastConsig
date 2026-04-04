import React from "react";
import { z, ZodObject, ZodRawShape } from "zod";
import { Button } from "./button";
import { FormAlert } from "./form";
import { PageHeader } from "./layout";
import { SchemaForm, FieldMap } from "./schema-form";
import { Table, TableColumn } from "./table";

export interface CrudPageProps<
  TSchema extends ZodRawShape,
  TRow extends Record<string, unknown>
> {
  title: string;
  description?: string;
  schema: ZodObject<TSchema>;
  fields: FieldMap<TSchema>;
  rows: TRow[];
  columns: Array<TableColumn<TRow>>;
  rowKey: (row: TRow) => string;
  onCreate: (data: z.infer<ZodObject<TSchema>>) => Promise<void>;
  onDelete?: (row: TRow) => Promise<void>;
  feedback?: string;
  error?: string;
}

export function CrudPage<
  TSchema extends ZodRawShape,
  TRow extends Record<string, unknown>
>({
  title,
  description,
  schema,
  fields,
  rows,
  columns,
  rowKey,
  onCreate,
  onDelete,
  feedback,
  error,
}: CrudPageProps<TSchema, TRow>) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={title} description={description} />
      {feedback ? <FormAlert type="success" message={feedback} /> : null}
      {error ? <FormAlert type="error" message={error} /> : null}

      <SchemaForm
        schema={schema}
        fields={fields}
        onSubmit={onCreate}
        submitLabel="Criar"
        title={`Novo ${title}`}
      />

      <Table
        columns={columns}
        rows={rows}
        rowKey={rowKey}
        actions={onDelete
          ? (row) => (
            <Button variant="danger" size="sm" onClick={() => void onDelete(row)}>
              Excluir
            </Button>
            )
          : undefined}
      />
    </div>
  );
}

