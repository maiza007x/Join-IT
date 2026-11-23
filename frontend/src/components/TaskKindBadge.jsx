// ป้ายประเภทงาน: เจ้าหน้าที่ / ★ นักศึกษา
const TaskKindBadge = ({ kind }) =>
    kind === "intern" ? (
        <span className="inline-block whitespace-nowrap px-2 py-1 rounded-md bg-orange-50 text-orange-600 text-[11px] font-bold">
            ★ นักศึกษา
        </span>
    ) : (
        <span className="inline-block whitespace-nowrap px-2 py-1 rounded-md bg-slate-100 text-slate-500 text-[11px] font-bold">
            เจ้าหน้าที่
        </span>
    );

export default TaskKindBadge;
