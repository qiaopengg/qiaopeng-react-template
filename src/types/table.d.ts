import "@tanstack/react-table";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    width?: number;
    minWidth?: number;
    maxWidth?: number;
  }
}
