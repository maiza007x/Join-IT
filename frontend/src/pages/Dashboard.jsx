import React, { useState, useRef } from "react";
import { Button } from "primereact/button";
import { Toast } from 'primereact/toast';
import { Chart } from 'primereact/chart';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';

const Dashboard = () => {
    const [loading, setLoading] = useState(false);
    const toast = useRef(null);

    // --- 🌟 State สำหรับ Global Filters ---
    const [globalFilter, setGlobalFilter] = useState({
        year: '2566',
        term: '1',
        university: 'all',
        person: 'all',
        timeRange: 'month',
        customDates: null
    });

    // --- State สำหรับ Card-level Filters ---
    const [cardFilter, setCardFilter] = useState({
        workloadView: 'gantt',
        workTypeDept: 'all',
        heatmapStaff: 'all',
        collabType: 'all',
    });

    // --- 📌 Options สำหรับ Dropdowns ---
    const globalOptions = {
        year: [{ label: 'ปีการศึกษา 2566', value: '2566' }, { label: 'ปีการศึกษา 2567', value: '2567' }],
        term: [{ label: 'เทอม 1', value: '1' }, { label: 'เทอม 2', value: '2' }, { label: 'ฤดูร้อน', value: 'summer' }],
        university: [{ label: 'ทุกมหาวิทยาลัย', value: 'all' }, { label: 'ม.เทคโนโลยีพระจอมเกล้าฯ', value: 'kmutt' }, { label: 'ม.เชียงใหม่', value: 'cmu' }],
        person: [
            { label: 'นักศึกษาทุกคน', value: 'all' },
            { label: 'นายสมชาย (เดฟ)', value: 'p1' },
            { label: 'น.ส.สมหญิง (เน็ตเวิร์ก)', value: 'p2' }
        ],
        timeRange: [
            { label: 'วันนี้', value: 'today' },
            { label: 'สัปดาห์นี้', value: 'week' },
            { label: 'เดือนนี้', value: 'month' },
            { label: 'ทั้งหมด', value: 'all' },
            { label: 'เลือกช่วงเวลาเอง...', value: 'custom' }
        ]
    };

    const filterOptions = {
        department: [{ label: 'ทุกแผนก', value: 'all' }, { label: 'ฝ่ายบุคคล (HR)', value: 'hr' }, { label: 'ฝ่ายไอที (IT)', value: 'it' }],
        staff: [{ label: 'พี่เลี้ยงทุกคน', value: 'all' }, { label: 'พี่สมชาย', value: 's1' }, { label: 'พี่วิชัย', value: 's2' }],
        workType: [{ label: 'ทุกประเภทงาน', value: 'all' }, { label: 'Hardware', value: 'hw' }, { label: 'Network', value: 'nw' }]
    };

    // --- 📌 Mock Data ---
    const summaryData = { totalTasks: 45, joinTasks: 32, selfTasks: 13, topSkill: 'Network' };

    const workloadChartData = {
        labels: ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์'],
        datasets: [
            { type: 'bar', label: 'งานที่ช่วยพี่ (Join)', backgroundColor: '#38bdf8', borderRadius: { topLeft: 0, topRight: 0, bottomLeft: 4, bottomRight: 4 }, data: [6, 5, 8, 4, 9] },
            { type: 'bar', label: 'งานที่ทำเอง (Self)', backgroundColor: '#fb7185', borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 }, data: [2, 4, 1, 5, 1] }
        ]
    };

    const ganttHours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    const ganttTasks = [
        { id: 1, day: 'จันทร์', title: 'ซ่อม Printer', type: 'join', start: 8.5, duration: 1.5 },
        { id: 2, day: 'จันทร์', title: 'เดินสาย LAN', type: 'self', start: 13.0, duration: 3.0 },
        { id: 3, day: 'อังคาร', title: 'Config Router', type: 'join', start: 9.0, duration: 2.0 },
        { id: 4, day: 'พุธ', title: 'Support User', type: 'join', start: 10.0, duration: 2.5 },
        { id: 5, day: 'พฤหัสบดี', title: 'Meeting', type: 'join', start: 13.5, duration: 1.5 },
        { id: 6, day: 'ศุกร์', title: 'เช็คกล้องวงจรปิด', type: 'self', start: 9.5, duration: 2.0 }
    ];

    const getGanttStyle = (start, duration) => {
        const totalHours = 9;
        const leftPercent = ((start - 8) / totalHours) * 100;
        const widthPercent = (duration / totalHours) * 100;
        return { left: `${leftPercent}%`, width: `${widthPercent}%` };
    };

    const workTypeChartData = {
        labels: ['Hardware', 'Software', 'Network', 'Document'],
        datasets: [{ data: [40, 30, 20, 10], backgroundColor: ['#38bdf8', '#fb7185', '#a78bfa', '#fbbf24'], hoverOffset: 4, borderWidth: 2, borderColor: '#ffffff', cutout: '70%' }]
    };

    const collabChartData = {
        labels: ['พี่สมชาย', 'พี่สมหญิง', 'พี่วิชัย'],
        datasets: [{ label: 'จำนวนงาน', backgroundColor: ['#6366f1', '#818cf8', '#a5b4fc'], borderRadius: 4, barPercentage: 0.6, data: [18, 10, 4] }]
    };

    const heatmapDays = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์'];
    const heatmapHours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
    const heatmapData = [
        [0, 2, 4, 5, 1, 0, 3, 2, 1], [1, 3, 2, 1, 0, 4, 6, 3, 0], [0, 5, 3, 2, 2, 1, 2, 4, 1], [2, 1, 1, 3, 0, 5, 4, 2, 2], [1, 4, 6, 3, 1, 2, 1, 1, 0]
    ];
    const getHeatmapColor = (val) => {
        if (val === 0) return 'bg-slate-50 border border-slate-100';
        if (val <= 2) return 'bg-indigo-200';
        if (val <= 4) return 'bg-indigo-400';
        return 'bg-indigo-600';
    };

    // 5. Keyword Chart Data (แทนที่ Word Cloud เดิม)
    const keywordChartData = {
        labels: ['เปลี่ยน RAM', 'Config LAN', 'Printer Setup', 'ซ่อม UPS', 'ลง Windows', 'Active Directory'],
        datasets: [
            {
                label: 'จำนวนครั้งที่บันทึก',
                data: [28, 22, 18, 15, 12, 8], // จำนวนความถี่ของแต่ละ Keyword
                backgroundColor: [
                    '#a78bfa', // Violet-400
                    '#38bdf8', // Sky-400
                    '#fbbf24', // Amber-400
                    '#e879f9', // Fuchsia-400
                    '#fb7185', // Rose-400
                    '#34d399'  // Emerald-400
                ],
                hoverBackgroundColor: [
                    '#8b5cf6', '#0ea5e9', '#f59e0b', '#d946ef', '#f43f5e', '#10b981' // สีเข้มขึ้นตอน Hover
                ],
                borderRadius: 8, // ขอบมนน่ารักๆ
                borderSkipped: false,
                barPercentage: 0.6, // ความหนาของแท่งกราฟ
            }
        ]
    };

    const keywordChartOptions = {
        indexAxis: 'y', // ทำให้กราฟเป็นแนวนอน
        plugins: {
            legend: { display: false }, // ซ่อน Legend เพราะเราใช้สีแยกแท่งแล้ว
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                titleColor: '#1e293b',
                bodyColor: '#475569',
                borderColor: '#e2e8f0',
                borderWidth: 1,
                padding: 10,
                callbacks: {
                    label: function (context) {
                        return ` เรียนรู้ไปแล้ว ${context.raw} ครั้ง`;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: { color: '#f8fafc', drawBorder: false },
                ticks: { color: '#94a3b8', font: { family: 'inherit', size: 11 } }
            },
            y: {
                grid: { display: false },
                ticks: { color: '#475569', font: { family: 'inherit', weight: '700', size: 12 } }
            }
        },
        maintainAspectRatio: true,
        // 👇 เปลี่ยนตรงนี้เป็น easeOutQuart และลดเวลาลงนิดหน่อยให้สมูทขึ้น
        animation: { duration: 1500, easing: 'easeOutQuart' }
    };

    const chartConfig = { plugins: { legend: { labels: { color: '#64748b', font: { family: 'inherit', size: 12 } }, position: 'bottom' } }, scales: { x: { stacked: true, grid: { display: false }, ticks: { color: '#94a3b8', font: { family: 'inherit', size: 11 } } }, y: { stacked: true, grid: { color: '#f1f5f9' }, border: { dash: [4, 4] }, ticks: { color: '#94a3b8', font: { family: 'inherit', size: 11 } } } }, maintainAspectRatio: true };
    const donutConfig = { plugins: { legend: { position: 'right', labels: { usePointStyle: true, color: '#64748b', padding: 20, font: { family: 'inherit', size: 12 } } } }, maintainAspectRatio: true, layout: { padding: 10 } };
    const horizontalBarConfig = { indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { grid: { color: '#f1f5f9', drawBorder: false }, ticks: { color: '#94a3b8' } }, y: { grid: { display: false }, ticks: { color: '#475569', font: { family: 'inherit', weight: '500' } } } }, maintainAspectRatio: true };

    const handleApplyFilters = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            toast.current?.show({ severity: 'success', summary: 'Filter Applied', detail: 'อัปเดตข้อมูลตามเงื่อนไขเรียบร้อยแล้ว' });
        }, 800);
    };

    return (
        <div className="bg-slate-50 min-h-screen font-sans text-slate-800 pb-12">
            <Toast ref={toast} />

            {/* Top Navigation / Header */}
            {/* Main Layout Wrapper: 2 Columns */}
            <div className="max-w-[90rem] mx-auto px-4 sm:px-6 pt-6 flex flex-col xl:flex-row gap-6">
                {/* --- 🌟 LEFT COLUMN: GLOBAL FILTER SIDEBAR --- */}
                <div className="w-full xl:w-72 shrink-0">
                    {/* ใช้ sticky เพื่อให้ sidebar ลอยอยู่กับที่เวลาเลื่อนจอ (คำนวณจากความสูง header + padding) */}
                    <div className="xl:sticky xl:top-22">
                        <div className="w-full flex items-center bg-white px-5 py-3 rounded-xl shadow-sm border border-white gap-4 mb-4">
                            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm shrink-0">
                                <i className="pi pi-book text-white text-lg"></i>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 m-0 leading-tight">Intern Dashboard</h1>
                                <p className="text-xs font-medium text-slate-500 m-0">แดชบอร์ดสรุปผลการปฏิบัติงาน</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm ">
                            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 m-0">
                                    <i className="pi pi-filter text-indigo-500"></i> ตัวกรองข้อมูลหลัก
                                </h2>
                            </div>

                            <div className="p-5 flex flex-col gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ปีการศึกษา</label>
                                    <Dropdown value={globalFilter.year} options={globalOptions.year} onChange={(e) => setGlobalFilter({ ...globalFilter, year: e.value })}
                                        className="w-full border-slate-200 shadow-none text-sm h-10 flex items-center bg-white hover:border-indigo-300 rounded-lg transition-colors" />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ภาคเรียน</label>
                                    <Dropdown value={globalFilter.term} options={globalOptions.term} onChange={(e) => setGlobalFilter({ ...globalFilter, term: e.value })}
                                        className="w-full border-slate-200 shadow-none text-sm h-10 flex items-center bg-white hover:border-indigo-300 rounded-lg transition-colors" />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">สถาบัน</label>
                                    <Dropdown value={globalFilter.university} options={globalOptions.university} onChange={(e) => setGlobalFilter({ ...globalFilter, university: e.value })}
                                        className="w-full border-slate-200 shadow-none text-sm h-10 flex items-center bg-white hover:border-indigo-300 rounded-lg transition-colors" />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-black text-indigo-600 uppercase tracking-wider">เป้าหมายข้อมูล (บุคคล)</label>
                                    <Dropdown value={globalFilter.person} options={globalOptions.person} onChange={(e) => setGlobalFilter({ ...globalFilter, person: e.value })}
                                        className="w-full border-indigo-200 shadow-none text-sm h-10 flex items-center bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 rounded-lg transition-colors font-medium"
                                        panelClassName="text-sm" />
                                </div>

                                <div className="w-full h-px bg-slate-100 my-1"></div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ช่วงเวลา</label>
                                    <Dropdown value={globalFilter.timeRange} options={globalOptions.timeRange} onChange={(e) => setGlobalFilter({ ...globalFilter, timeRange: e.value })}
                                        className="w-full border-slate-200 shadow-none text-sm h-10 flex items-center bg-white hover:border-indigo-300 rounded-lg transition-colors" />
                                </div>

                                {globalFilter.timeRange === 'custom' && (
                                    <div className="flex flex-col gap-1.5 animate-fadein">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ระบุวันที่</label>
                                        <Calendar
                                            value={globalFilter.customDates}
                                            onChange={(e) => setGlobalFilter({ ...globalFilter, customDates: e.value })}
                                            selectionMode="range"
                                            readOnlyInput
                                            placeholder="เริ่ม - สิ้นสุด"
                                            className="w-full h-10"
                                            inputClassName="text-sm border-slate-200 bg-white hover:border-indigo-300 focus:border-indigo-500 rounded-lg transition-colors"
                                        />
                                    </div>
                                )}

                                {/* Action Buttons (Stacked Vertically) */}
                                <div className="mt-2 flex flex-col gap-2">
                                    <Button label="อัปเดตข้อมูล" icon="pi pi-search" loading={loading} onClick={handleApplyFilters}
                                        className="w-full justify-center bg-indigo-600 hover:bg-indigo-700 text-white border-none text-sm py-2.5 rounded-lg font-bold shadow-sm hover:shadow transition-all focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" />
                                    <Button label="รีเซ็ตกลับค่าเริ่มต้น" icon="pi pi-refresh"
                                        className="w-full justify-center text-slate-500 bg-transparent hover:bg-slate-100 border-none text-xs py-2.5 rounded-lg font-bold transition-all focus:ring-2 focus:ring-slate-100" />
                                </div>
                            </div>
                        </div>


                    </div>
                </div>

                {/* --- 📊 RIGHT COLUMN: MAIN DASHBOARD CONTENT --- */}
                <div className="flex-1 min-w-0 flex flex-col gap-6">

                    {/* --- Row 1: KPI Scorecards --- */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { title: 'ภารกิจทั้งหมด', value: summaryData.totalTasks, icon: 'pi-folder-open', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                            { title: 'งานที่ช่วยพี่ (Join)', value: summaryData.joinTasks, icon: 'pi-users', color: 'text-blue-600', bg: 'bg-blue-50' },
                            { title: 'งานที่ลุยเอง (Self)', value: summaryData.selfTasks, icon: 'pi-user', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            { title: 'ทักษะหลัก', value: summaryData.topSkill, icon: 'pi-star', color: 'text-amber-600', bg: 'bg-amber-50' }
                        ].map((stat, i) => (
                            <div key={i} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.bg} ${stat.color} shrink-0`}>
                                    <i className={`pi ${stat.icon} text-xl`} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-500 mb-1 truncate">{stat.title}</p>
                                    <h3 className="text-2xl font-bold text-slate-900 truncate">{stat.value}</h3>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* --- Row 2: Workload & Work Types --- */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Workload Section (Bar/Gantt) */}
                        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/30">
                                <h3 className="text-base font-bold text-slate-800 m-0 shrink-0">ปริมาณภาระงานรายวัน</h3>
                                <div className="flex bg-slate-200/50 p-1 rounded-lg">
                                    <button onClick={() => setCardFilter({ ...cardFilter, workloadView: 'gantt' })}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${cardFilter.workloadView === 'gantt' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                        <i className="pi pi-align-left mr-1.5"></i>ไทม์ไลน์
                                    </button>
                                    <button onClick={() => setCardFilter({ ...cardFilter, workloadView: 'bar' })}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${cardFilter.workloadView === 'bar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                        <i className="pi pi-chart-bar mr-1.5"></i>สรุปจำนวน
                                    </button>
                                </div>
                            </div>

                            <div className="p-5 grow min-h-[300px] relative">
                                {cardFilter.workloadView === 'bar' ? (
                                    <Chart type="bar" data={workloadChartData} options={chartConfig} />
                                ) : (
                                    <div className="w-full h-full flex flex-col">
                                        <div className="flex w-full mb-2 ml-16 border-b border-slate-200 pb-2">
                                            {ganttHours.map((hour, i) => (<div key={i} className="flex-1 text-xs font-semibold text-slate-400 text-left -ml-3">{hour}</div>))}
                                        </div>
                                        <div className="flex-1 flex flex-col gap-3 relative mt-2">
                                            <div className="absolute inset-0 ml-16 flex pointer-events-none">
                                                {Array.from({ length: 9 }).map((_, i) => (<div key={i} className="flex-1 border-l border-slate-100 border-dashed h-full"></div>))}
                                            </div>
                                            {['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์'].map((day, dIdx) => (
                                                <div key={dIdx} className="flex items-center h-10 relative">
                                                    <div className="w-16 text-sm font-medium text-slate-600 shrink-0">{day}</div>
                                                    <div className="flex-1 h-full relative">
                                                        {ganttTasks.filter(t => t.day === day).map(task => (
                                                            <div key={task.id}
                                                                className={`absolute h-8 top-1 rounded-md shadow-sm border px-2 flex items-center overflow-hidden cursor-pointer hover:brightness-95 transition-all
                                                                    ${task.type === 'join' ? 'bg-indigo-500 border-indigo-600 text-white' : 'bg-emerald-500 border-emerald-600 text-white'}`}
                                                                style={getGanttStyle(task.start, task.duration)}
                                                                title={`${task.title} (${task.start.toFixed(2)} - ${(task.start + task.duration).toFixed(2)})`}
                                                            >
                                                                <span className="text-[10px] font-semibold truncate leading-none">{task.title}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-center gap-4 mt-6">
                                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-indigo-500"></div><span className="text-xs text-slate-500 font-medium">งานที่ช่วยพี่ (Join)</span></div>
                                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-emerald-500"></div><span className="text-xs text-slate-500 font-medium">งานที่ทำเอง (Self)</span></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Donut Chart */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                                <h3 className="text-base font-bold text-slate-800 m-0 shrink-0">สัดส่วนประเภทงาน</h3>
                                <Dropdown value={cardFilter.workTypeDept} options={filterOptions.department} onChange={(e) => setCardFilter({ ...cardFilter, workTypeDept: e.value })}
                                    className="w-28 border-slate-200 shadow-none text-xs h-8 flex items-center" />
                            </div>
                            <div className="p-5 grow min-h-[300px] flex items-center justify-center">
                                <Chart type="doughnut" data={workTypeChartData} options={donutConfig} />
                            </div>
                        </div>
                    </div>

                    {/* --- Row 3: Heatmap (Full Width) --- */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/30">
                            <div className="flex items-center gap-4">
                                <h3 className="text-base font-bold text-slate-800 m-0">ความหนาแน่นของงานตามช่วงเวลา</h3>
                                <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500 border-l border-slate-200 pl-4">
                                    <span>น้อย</span>
                                    <div className="flex gap-1">
                                        <div className="w-3 h-3 rounded-sm bg-slate-50 border border-slate-200"></div>
                                        <div className="w-3 h-3 rounded-sm bg-indigo-400"></div>
                                        <div className="w-3 h-3 rounded-sm bg-indigo-600"></div>
                                    </div>
                                    <span>มาก</span>
                                </div>
                            </div>
                            <Dropdown value={cardFilter.heatmapStaff} options={filterOptions.staff} onChange={(e) => setCardFilter({ ...cardFilter, heatmapStaff: e.value })}
                                className="w-36 border-slate-200 shadow-none text-xs h-8 flex items-center" />
                        </div>

                        <div className="p-6 overflow-x-auto">
                            <div className="min-w-[600px]">
                                <div className="flex ml-16 mb-2">
                                    {heatmapHours.map((h, i) => (<div key={i} className="flex-1 text-center text-xs font-semibold text-slate-500">{h}</div>))}
                                </div>
                                <div className="flex flex-col gap-2">
                                    {heatmapData.map((row, rIdx) => (
                                        <div key={rIdx} className="flex items-center gap-2 h-10">
                                            <div className="w-14 text-right pr-2 text-sm font-medium text-slate-600">{heatmapDays[rIdx]}</div>
                                            <div className="flex-1 flex gap-2 h-full">
                                                {row.map((val, cIdx) => (
                                                    <div key={cIdx} className={`flex-1 rounded-md transition-opacity hover:opacity-75 cursor-pointer ${getHeatmapColor(val)}`}
                                                        title={`${heatmapDays[rIdx]} ${heatmapHours[cIdx]} น. | ${val} ภารกิจ`}></div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- Row 4: Collaboration & Word Cloud --- */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Horizontal Bar */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                                <h3 className="text-base font-bold text-slate-800 m-0">เจ้าหน้าที่ที่ร่วมงานด้วย</h3>
                                <Dropdown value={cardFilter.collabType} options={filterOptions.workType} onChange={(e) => setCardFilter({ ...cardFilter, collabType: e.value })}
                                    className="w-32 border-slate-200 shadow-none text-xs h-8 flex items-center" />
                            </div>
                            <div className="p-5 grow min-h-[250px]">
                                <Chart type="bar" data={collabChartData} options={horizontalBarConfig} />
                            </div>
                        </div>

                        {/* Word Cloud */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                                <h3 className="text-base font-bold text-slate-800 m-0">สิ่งที่ได้เรียนรู้ (Keywords)</h3>
                                {/* Option: สามารถเพิ่ม Dropdown ตัวกรองตรงนี้ได้ถ้าต้องการในอนาคต */}
                                <div className="px-3 py-1 bg-violet-50 text-violet-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                    Top Skills
                                </div>
                            </div>

                            <div className="p-6 grow min-h-[250px] relative">
                                {/* เรียกใช้กราฟแท่งแนวนอน */}
                                <Chart type="bar" data={keywordChartData} options={keywordChartOptions} />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Dashboard;