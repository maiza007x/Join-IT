import { useEffect, useState, useRef } from "react";
import api from '../services/api';
import { Button } from "primereact/button";
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Chart } from 'primereact/chart';
import { Dropdown } from 'primereact/dropdown';
import socket from '../services/socket';

const Dashboard = () => {
    const [tasks, setTasks] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [ranges, setRanges] = useState({
        person: 'today',
        hour: 'today',
        rating: 'today',
        sla: 'today',
        category: 'today'
    });
    const toast = useRef(null);

    const rangeOptions = [
        { label: 'วันนี้', value: 'today' },
        { label: 'สัปดาห์นี้', value: 'week' },
        { label: 'เดือนนี้', value: 'month' },
        { label: 'ปีนี้', value: 'year' }
    ];

    const fetchChartData = async (type, range) => {
        try {
            const response = await api.get(`/tasks/analytics-stats?type=${type}&range=${range}`);
            const newData = response.data.data;
            setAnalytics(prev => ({ ...prev, ...newData }));
        } catch (err) {
            console.error(`Error fetching ${type} stats:`, err);
        }
    };

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

        // ฟัง Socket เพื่อรีเฟรชข้อมูลอัตโนมัติเมื่อมีงานใหม่
        socket.on("new-task", () => {
            console.log("🔄 [Dashboard]: Re-fetching analytics due to new task...");
            fetchData();
        });

        return () => {
            socket.off("new-task");
        };
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
                backgroundColor: '#3b82f6',
                borderRadius: 12,
                hoverBackgroundColor: '#2563eb',
                data: analytics?.personStats?.map(p => p.count) || []
            }
        ]
    };

    // 2. Daily Trend (Line Chart)
    const hourChartData = {
        labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
        datasets: [
            {
                label: 'ปริมาณงาน',
                data: Array.from({ length: 24 }, (_, i) => {
                    const found = analytics?.hourStats?.find(h => h.hour === i);
                    return found ? found.count : 0;
                }),
                fill: true,
                borderColor: '#06b6d4',
                tension: 0.5,
                backgroundColor: 'rgba(6, 182, 212, 0.15)',
                pointBackgroundColor: '#fff',
                pointBorderColor: '#06b6d4',
                pointBorderWidth: 3,
                pointRadius: 4,
                pointHoverRadius: 6
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
                borderRadius: 10,
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
                hoverOffset: 15,
                borderWidth: 0
            }
        ]
    };

    // 5. Problem Category (Doughnut Chart)
    const categoryChartData = {
        labels: analytics?.categoryStats?.map(c => c.category?.length > 25 ? c.category?.substring(0, 25) + '...' : c.category) || [],
        datasets: [
            {
                data: analytics?.categoryStats?.map(c => c.count) || [],
                backgroundColor: ['#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4'],
                hoverOffset: 15,
                borderWidth: 4,
                borderColor: '#ffffff',
                cutout: '75%'
            }
        ]
    };

    const chartOptions = {
        plugins: {
            legend: {
                labels: { color: '#475569', font: { size: 12, weight: '600' } },
                position: 'bottom'
            }
        },
        scales: {
            x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } },
            y: { grid: { color: '#f1f5f9', borderDash: [5, 5] }, ticks: { color: '#94a3b8', font: { size: 10 } } }
        },
        maintainAspectRatio: false,
        animation: { duration: 2000, easing: 'easeOutQuart' }
    };

    const pieOptions = {
        plugins: {
            legend: {
                labels: { color: '#475569', font: { size: 12, weight: '600' } },
                position: 'bottom'
            }
        },
        maintainAspectRatio: false,
        animation: { animateRotate: true, animateScale: true, duration: 2000 }
    };

    const categoryPieOptions = {
        plugins: {
            legend: {
                labels: { 
                    color: '#475569', 
                    font: { size: 12, weight: '700' },
                    padding: 15,
                    usePointStyle: true,
                    pointStyle: 'circle'
                },
                position: 'right',
                align: 'center'
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#1e293b',
                bodyColor: '#475569',
                borderColor: '#e2e8f0',
                borderWidth: 1,
                padding: 12,
                boxPadding: 8,
                usePointStyle: true
            }
        },
        maintainAspectRatio: false,
        layout: { padding: { left: 20, right: 20, top: 20, bottom: 20 } },
        animation: { animateRotate: true, animateScale: true, duration: 2500, easing: 'easeOutQuart' }
    };

    return (
        <div className="bg-[#f8fafc] min-h-screen font-sans text-slate-700 relative overflow-hidden pb-12">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-indigo-100/30 rounded-full blur-[100px] pointer-events-none"></div>
            
            <Toast ref={toast} />

            <div className="max-w-[1440px] mx-auto px-4 md:px-10 relative z-10">
                {/* Header Section */}
                <div className="py-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-blue-600 rounded-[1.5rem] shadow-[0_20px_40px_rgba(37,99,235,0.3)] flex items-center justify-center transform hover:rotate-6 transition-transform">
                            <i className="pi pi-chart-line text-3xl text-white"></i>
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight m-0">ระบบวิเคราะห์ข้อมูล</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 anim-pulse"></span>
                                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Analytics Operation Center • Live Data</p>
                            </div>
                        </div>
                    </div>
                    
                    <Button
                        label="อัปเดตข้อมูลภาพรวม"
                        icon="pi pi-sync"
                        className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl px-8 py-4 font-black transition-all shadow-sm hover:shadow-md active:scale-95"
                        onClick={() => {
                            fetchData();
                            setRanges({ person: 'today', hour: 'today', rating: 'today', sla: 'today', category: 'today' });
                        }}
                        loading={loading}
                    />
                </div>

                {/* Top Statistics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {[
                        { label: 'งานแจ้งซ่อมวันนี้', value: tasks.length, icon: 'pi-briefcase', color: 'blue' },
                        { label: 'งานที่คุณรับผิดชอบ', value: myContributedTasks, icon: 'pi-user-edit', color: 'indigo' },
                        { label: 'รอความช่วยเหลือ', value: pendingHelpTasks, icon: 'pi-exclamation-circle', color: 'amber' },
                        { label: 'ตามเกณฑ์ SLA', value: completedTasks, icon: 'pi-verified', color: 'emerald' }
                    ].map((stat, i) => (
                        <div key={i} className="premium-card p-1">
                            <div className="bg-white/80 backdrop-blur-md rounded-[2rem] p-8 h-full border border-white transition-all group hover:bg-white">
                                <div className="flex items-center justify-between mb-6">
                                    <div className={`p-4 bg-${stat.color}-50 rounded-2xl`}>
                                        <i className={`pi ${stat.icon} text-2xl text-${stat.color}-500 group-hover:scale-110 transition-transform`} />
                                    </div>
                                    <div className="h-1 w-12 bg-slate-100 rounded-full overflow-hidden">
                                        <div className={`h-full bg-${stat.color}-400 w-2/3`}></div>
                                    </div>
                                </div>
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                                <h2 className="text-4xl font-black text-slate-900 mt-1 tracking-tighter">{stat.value}</h2>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                    
                    {/* 1. สรุปยอดการรับงาน */}
                    <div className="lg:col-span-4 glass-card p-1">
                        <div className="bg-white/90 backdrop-blur-md rounded-[2.5rem] p-8 h-full flex flex-col">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                                    <h3 className="text-xl font-black text-slate-900 m-0">ผู้รับงาน</h3>
                                </div>
                                <Dropdown 
                                    value={ranges.person} options={rangeOptions} 
                                    onChange={(e) => { setRanges(prev => ({ ...prev, person: e.value })); fetchChartData('person', e.value); }} 
                                    className="minimal-dropdown"
                                />
                            </div>
                            <div className="flex-grow min-h-[250px]">
                                <Chart type="bar" data={personChartData} options={chartOptions} />
                            </div>
                        </div>
                    </div>

                    {/* 2. แนวโน้มงานรายชั่วโมง */}
                    <div className="lg:col-span-8 glass-card p-1">
                        <div className="bg-white/90 backdrop-blur-md rounded-[2.5rem] p-8 h-full flex flex-col">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-cyan-500 rounded-full"></div>
                                    <h3 className="text-xl font-black text-slate-900 m-0">แนวโน้มช่วงเวลาที่มีงานมาก</h3>
                                </div>
                                <Dropdown 
                                    value={ranges.hour} options={rangeOptions} 
                                    onChange={(e) => { setRanges(prev => ({ ...prev, hour: e.value })); fetchChartData('hour', e.value); }} 
                                    className="minimal-dropdown"
                                />
                            </div>
                            <div className="flex-grow min-h-[250px]">
                                <Chart type="line" data={hourChartData} options={chartOptions} />
                            </div>
                        </div>
                    </div>

                    {/* 3. สรุปความพึงพอใจ */}
                    <div className="lg:col-span-4 glass-card p-1">
                        <div className="bg-white/90 backdrop-blur-md rounded-[2.5rem] p-8 h-full flex flex-col">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-pink-500 rounded-full"></div>
                                    <h3 className="text-xl font-black text-slate-900 m-0">ความพึงพอใจ</h3>
                                </div>
                                <Dropdown 
                                    value={ranges.rating} options={rangeOptions} 
                                    onChange={(e) => { setRanges(prev => ({ ...prev, rating: e.value })); fetchChartData('rating', e.value); }} 
                                    className="minimal-dropdown"
                                />
                            </div>
                            <div className="flex-grow min-h-[250px]">
                                <Chart type="bar" data={satisfactionChartData} options={{ ...chartOptions, indexAxis: 'y' }} />
                            </div>
                        </div>
                    </div>

                    {/* 4. SLA Metrics */}
                    <div className="lg:col-span-4 glass-card p-1">
                        <div className="bg-white/90 backdrop-blur-md rounded-[2.5rem] p-8 h-full flex flex-col">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                                    <h3 className="text-xl font-black text-slate-900 m-0">SLA Accuracy</h3>
                                </div>
                                <Dropdown 
                                    value={ranges.sla} options={rangeOptions} 
                                    onChange={(e) => { setRanges(prev => ({ ...prev, sla: e.value })); fetchChartData('sla', e.value); }} 
                                    className="minimal-dropdown"
                                />
                            </div>
                            <div className="flex-grow min-h-[250px] flex items-center justify-center">
                                <Chart type="pie" data={slaChartData} options={pieOptions} />
                            </div>
                        </div>
                    </div>

                    {/* 5. Problem Categories */}
                    <div className="lg:col-span-12 glass-card p-1">
                        <div className="bg-white/90 backdrop-blur-md rounded-[2.5rem] p-8 h-full flex flex-col">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                                    <h3 className="text-xl font-black text-slate-900 m-0">วิเคราะห์ประเภทปัญหา</h3>
                                </div>
                                <Dropdown 
                                    value={ranges.category} options={rangeOptions} 
                                    onChange={(e) => { setRanges(prev => ({ ...prev, category: e.value })); fetchChartData('category', e.value); }} 
                                    className="minimal-dropdown"
                                />
                            </div>
                            <div className="flex-grow min-h-[480px] flex items-center justify-center relative">
                                <Chart type="doughnut" data={categoryChartData} options={categoryPieOptions} />
                                <div className="absolute top-1/2 left-[31%] -translate-y-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">หมวดหมู่ทั้งหมด</span>
                                    <span className="text-5xl font-black text-slate-900 leading-none drop-shadow-sm">{analytics?.categoryStats?.length || 0}</span>
                                    <div className="w-10 h-1 bg-blue-500 rounded-full mt-4"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 6. Recent Tasks List */}
                    <div className="lg:col-span-12 glass-card p-1">
                        <div className="bg-white/90 backdrop-blur-md rounded-[2.5rem] p-10 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-blue-50 rounded-2xl">
                                        <i className="pi pi-list text-blue-600 text-xl"></i>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 m-0">บันทึกภารกิจตามเวลาจริง</h3>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Live Activity Stream</p>
                                    </div>
                                </div>
                                <Button label="ดูข้อมูลเชิงลึกทั้งหมด" icon="pi pi-arrow-right" iconPos="right" className="p-button-outlined border-slate-200 text-slate-600 font-black rounded-2xl px-6" />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {tasks.slice(0, 3).map((task, idx) => (
                                    <div key={idx} className="group relative bg-slate-50/50 rounded-[2rem] p-8 border border-transparent hover:border-blue-200 hover:bg-white hover:shadow-2xl transition-all duration-500">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center group-hover:rotate-6 transition-transform">
                                                <i className="pi pi-file-edit text-blue-500 text-xl" />
                                            </div>
                                            <Tag 
                                                value={task.interns?.length > 0 ? "ASSISTED" : "PENDING"} 
                                                className={`font-black text-[9px] px-4 py-1.5 rounded-full ${task.interns?.length > 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}
                                            />
                                        </div>
                                        <h4 className="font-black text-slate-800 text-lg m-0 line-clamp-1 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{task.deviceName}</h4>
                                        <p className="text-slate-400 text-sm mt-3 line-clamp-2 leading-relaxed h-10 font-medium">{task.report}</p>
                                        
                                        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <i className="pi pi-building text-blue-400 text-xs"></i>
                                                <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">{task.department}</span>
                                            </div>
                                            <div className="px-3 py-1 bg-blue-50 rounded-lg">
                                                <span className="text-blue-600 font-black text-[10px] tracking-widest">{task.time_report?.substring(0, 5)} น.</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .premium-card:hover {
                    box-shadow: 0 40px 80px -20px rgba(59, 130, 246, 0.15);
                    transform: translateY(-8px);
                }
                .glass-card:hover {
                    box-shadow: 0 50px 100px -20px rgba(0, 0, 0, 0.05);
                    transform: translateY(-5px);
                }
                .premium-card, .glass-card {
                    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .minimal-dropdown {
                    width: 140px;
                    border: 1px solid #f1f5f9;
                    background: #f8fafc;
                    border-radius: 1rem;
                    font-size: 11px;
                    font-weight: 800;
                    height: 40px;
                    align-items: center;
                }
                .minimal-dropdown .p-dropdown-label {
                    padding: 0 1rem;
                }
                .p-dropdown:not(.p-disabled).p-focus {
                    box-shadow: 0 0 0 2px #fff, 0 0 0 4px #dbeafe;
                    border-color: #3b82f6;
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.5; }
                }
                .anim-pulse {
                    animation: pulse 2s ease-in-out infinite;
                }
                .line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
                .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
            `}} />
        </div>
    );
};

export default Dashboard;
