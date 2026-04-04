import React from "react";

export interface TableColumn<T> {
  key: keyof T & string;
  label: string;
}

export interface TableProps<T extends Record<string, unknown>> {
  columns: Array<TableColumn<T>>;
  rows: T[];
  rowKey: (row: T) => string;
  actions?: (row: T) => React.ReactNode;
}

export function Table<T extends Record<string, unknown>>({
  columns,
  rows,
  rowKey,
  actions,
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
      <table className="min-w-full divide-y divide-neutral-200 text-sm">
        <thead className="bg-neutral-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-3 text-left font-medium text-neutral-700"
              >
                {column.label}
              </th>
            ))}
            {actions ? (
              <th className="px-4 py-3 text-right font-medium text-neutral-700">Ações</th>
            ) : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-3 text-neutral-800">
                  {String(row[column.key] ?? "")}
                </td>
              ))}
              {actions ? <td className="px-4 py-3 text-right">{actions(row)}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

