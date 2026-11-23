// ประเภทงานในตารางที่รวมงานเจ้าหน้าที่ (Order-IT) กับงานนักศึกษา (intern_tasks)
export const KIND_OPTIONS = [
  { value: "all", label: "ทั้งหมด" },
  { value: "staff", label: "เจ้าหน้าที่" },
  { value: "intern", label: "นักศึกษา" },
];

export const filterByKind = (rows, kind) => (kind === "all" ? rows : rows.filter((row) => row.kind === kind));
