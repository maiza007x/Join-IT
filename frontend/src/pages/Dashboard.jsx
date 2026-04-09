import { useEffect, useState, useRef } from "react";
import api from '../services/api';
import { Button } from "primereact/button";
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Chart } from 'primereact/chart';

const Dashboard = () => {
    const [tasks, setTasks] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(false);
    const toast = useRef(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [tasksRes, statsRes] = await Promise.all([
                api.get(`/tasks/tasks_collab`),
                api.get(`/tasks/analytics-stats`)
            ]);
            setTasks(tasksRes.data.tasks || []);
            setAnalytics(statsRes.data.data);
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            toast.current?.show({ severity: 'error', summary: 'ผิดพลาด', detail: 'ไม่สามารถโหลดข้อมูลแดชบอร์ดได้' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const myContributedTasks = tasks.filter(t => t.isContributedByMe).length;
    const pendingHelpTasks = tasks.filter(t => !t.interns || t.interns.length === 0).length;
    const completedTasks = analytics?.slaStats?.within_sla + analytics?.slaStats?.over_sla || 0;

    // --- Chart Data Formatting ---

    // 1. Reception Summary (Bar Chart)
    const personChartData = {
        labels: analytics?.personStats?.map(p => p.name) || [],
        datasets: [
            {
                label: 'จำนวนการรับงาน',
                backgroundColor: '#3b82f6', // Blue 500
                borderRadius: 8,
                data: analytics?.personStats?.map(p => p.count) || []
            }
        ]
    };

    // 2. Daily Trend (Line Chart)
    const hourChartData = {
        labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
        datasets: [
            {
                label: 'จำนวนงาน',
                data: Array.from({ length: 24 }, (_, i) => {
                    const found = analytics?.hourStats?.find(h => h.hour === i);
                    return found ? found.count : 0;
                }),
                fill: true,
                borderColor: '#0ea5e9', // Sky 500
                tension: 0.4,
                backgroundColor: 'rgba(14, 165, 233, 0.1)',
                pointBackgroundColor: '#fff',
                pointBorderColor: '#0ea5e9',
                pointBorderWidth: 2
            }
        ]
    };

    // 3. Satisfaction Summary (Horizontal Bar)
    const satisfactionChartData = {
        labels: ['ความรวดเร็ว', 'การแก้ปัญหา', 'การให้บริการ'],
        datasets: [
            {
                label: 'คะแนนเฉลี่ย',
                backgroundColor: ['#60a5fa', '#34d399', '#f472b6'],
                borderRadius: 6,
                data: [
                    analytics?.ratingStats?.speed || 0,
                    analytics?.ratingStats?.problem || 0,
                    analytics?.ratingStats?.service || 0
                ]
            }
        ]
    };

    // 4. SLA % (Pie Chart)
    const slaChartData = {
        labels: ['ในเวลา', 'เกินเวลา'],
        datasets: [
            {
                data: [analytics?.slaStats?.within_sla || 0, analytics?.slaStats?.over_sla || 0],
                backgroundColor: ['#10b981', '#f43f5e'],
                hoverOffset: 10
            }
        ]
    };

    // 5. Problem Category (Doughnut Chart)
    const categoryChartData = {
        labels: analytics?.categoryStats?.map(c => c.category?.substring(0, 15) + '...') || [],
        datasets: [
            {
                data: analytics?.categoryStats?.map(c => c.count) || [],
                backgroundColor: ['#60a5fa', '#818cf8', '#a78bfa', '#f472b6', '#fb7185', '#fb923c', '#fbbf24', '#34d399'],
                borderWidth: 0
            }
        ]
    };

    const chartOptions = {
        plugins: {
            legend: {
                labels: { color: '#64748b', font: { size: 11, weight: 'bold' } },
                position: 'bottom'
            }
        },
        scales: {
            x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
            y: { grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8' } }
        },
        maintainAspectRatio: false
    };

    const pieOptions = {
        plugins: {
            legend: {
                labels: { color: '#64748b', font: { size: 11, weight: 'bold' } },
                position: 'bottom'
            }
        },
        maintainAspectRatio: false
    };

    return (
        <div className="bg-[#f0f9ff] min-h-screen font-sans text-slate-700 p-4 md:p-8">
            <Toast ref={toast} />

            <div className="max-w-[1400px] mx-auto">
                {/* Header */}
                <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-white rounded-3xl shadow-lg border border-blue-100">
                            <i className="pi pi-chart-bar text-3xl text-blue-600"></i>
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-blue-900 m-0">ระบบส่งเสริมการวิเคราะห์และสรุปผล</h1>
                            <p className="text-blue-500 mt-1 font-bold uppercase tracking-widest text-xs"></p>
                        </div>
                    </div>
                    <Button
                        label="อัปเดตข้อมูล"
                        icon="pi pi-sync"
                        className="bg-blue-600 hover:bg-blue-700 border-none text-white rounded-2xl px-8 py-4 font-black transition-all shadow-lg shadow-blue-200"
                        onClick={fetchData}
                        loading={loading}
                    />
                </div>

                {/* Top Stat Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    {[
                        { label: 'งานทั้งหมดวันนี้', value: tasks.length, icon: 'pi-briefcase', color: 'blue' },
                        { label: 'งานที่คุณผูก', value: myContributedTasks, icon: 'pi-user-plus', color: 'indigo' },
                        { label: 'งานที่รอคนช่วย', value: pendingHelpTasks, icon: 'pi-clock', color: 'orange' },
                        { label: 'งานประกอบ SLA', value: completedTasks, icon: 'pi-check-circle', color: 'emerald' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-blue-50 group hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-4 bg-${stat.color}-50 rounded-2xl`}>
                                    <i className={`pi ${stat.icon} text-2xl text-${stat.color}-500 transition-all group-hover:scale-110`} />
                                </div>
                                <span className="flex h-2 w-2 rounded-full bg-blue-500 anim-ping"></span>
                            </div>
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                            <h2 className="text-4xl font-black text-slate-900 mt-2">{stat.value}</h2>
                        </div>
                    ))}
                </div>

                {/* Main Analytics Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                    {/* 1. สรุปยอดการรับงาน */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-blue-50 lg:col-span-1">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-50 pb-4">
                            <h3 className="text-lg font-black text-slate-800 m-0">สรุปยอดการรับงาน</h3>
                            <i className="pi pi-users text-blue-200"></i>
                        </div>
                        <div className="h-[250px]">
                            <Chart type="bar" data={personChartData} options={chartOptions} />
                        </div>
                    </div>

                    {/* 2. แนวโน้มงานรายชั่วโมง */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-blue-50 lg:col-span-2">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-50 pb-4">
                            <h3 className="text-lg font-black text-slate-800 m-0">แนวโน้มงานรายชั่วโมง</h3>
                            <div className="flex gap-2">
                                <Tag value="Today" className="bg-blue-600 text-[10px]" />
                            </div>
                        </div>
                        <div className="h-[250px]">
                            <Chart type="line" data={hourChartData} options={chartOptions} />
                        </div>
                    </div>

                    {/* 3. สรุปความพึงพอใจ */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-blue-50 lg:col-span-1">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-50 pb-4">
                            <h3 className="text-lg font-black text-slate-800 m-0">สรุปความพึงพอใจ</h3>
                            <i className="pi pi-star-fill text-yellow-400"></i>
                        </div>
                        <div className="h-[250px]">
                            <Chart type="bar" data={satisfactionChartData} options={{ ...chartOptions, indexAxis: 'y' }} />
                        </div>
                    </div>

                    {/* 4. SLA Metrics */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-blue-50 lg:col-span-1">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-50 pb-4">
                            <h3 className="text-lg font-black text-slate-800 m-0">เป้าหมายเวลา (SLA)</h3>
                            <Tag value="30 MIN" className="bg-slate-100 text-slate-600 font-bold" />
                        </div>
                        <div className="h-[250px] flex justify-center">
                            <Chart type="pie" data={slaChartData} options={pieOptions} />
                        </div>
                    </div>

                    {/* 5. Problem Categories */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-blue-50 lg:col-span-1">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-50 pb-4">
                            <h3 className="text-lg font-black text-slate-800 m-0">ประเภทปัญหา</h3>
                        </div>
                        <div className="h-[250px] flex justify-center">
                            <Chart type="doughnut" data={categoryChartData} options={pieOptions} />
                        </div>
                    </div>

                    {/* 6. Recent Tasks List */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-blue-100 lg:col-span-3">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-blue-900 m-0">บันทึกงานล่าสุด</h3>
                            <Button label="ดูทั้งหมด" icon="pi pi-chevron-right" iconPos="right" className="p-button-text p-button-sm font-black text-blue-600" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {tasks.slice(0, 3).map((task, idx) => (
                                <div key={idx} className="bg-slate-50/50 border border-slate-100 p-6 rounded-3xl hover:border-blue-200 transition-all hover:bg-white hover:shadow-lg">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                                            <i className="pi pi-file text-blue-500 text-xl" />
                                        </div>
                                        <Tag
                                            value={task.interns?.length > 0 ? "มีผู้ช่วย" : "รอคนช่วย"}
                                            severity={task.interns?.length > 0 ? "success" : "warning"}
                                            className="font-black text-[10px] px-3 py-1 rounded-full"
                                        />
                                    </div>
                                    <h4 className="font-black text-slate-800 text-base m-0 line-clamp-1">{task.deviceName}</h4>
                                    <p className="text-slate-400 text-xs mt-2 line-clamp-2 leading-relaxed h-8">{task.report}</p>
                                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <i className="pi pi-map-marker text-blue-400 text-xs"></i>
                                            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">{task.department}</span>
                                        </div>
                                        <span className="text-blue-600 font-black text-xs">{task.time_report?.substring(0, 5)} น.</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes ping {
                    0% { transform: scale(1); opacity: 1; }
                    75%, 100% { transform: scale(2); opacity: 0; }
                }
                .anim-ping {
                    animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                }
                .line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
                .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
            `}} />
        </div>
    );
};

export default Dashboard;
