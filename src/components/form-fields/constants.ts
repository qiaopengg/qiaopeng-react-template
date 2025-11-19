export const selectDefaults = {
  searchable: true,
  clearable: true,
  size: "default" as const
};

export type SelectSize = typeof selectDefaults.size;
