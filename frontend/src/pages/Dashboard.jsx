import React, { useState, useRef, useEffect } from "react";
import { Toast } from "primereact/toast";

// Components
import DashboardFilter from "./Dashboard/components/DashboardFilter";
import KPICards from "./Dashboard/components/KPICards";
import WorkloadChart from "./Dashboard/components/WorkloadChart";
import WorkTypeChart from "./Dashboard/components/WorkTypeChart";
import ActivityHeatmap from "./Dashboard/components/ActivityHeatmap";
import CollaborationChart from "./Dashboard/components/CollaborationChart";
import LearningKeywordsChart from "./Dashboard/components/LearningKeywordsChart";
import api from "../services/api";

const Dashboard = () => {
  const toast = useRef(null);
  const [loading, setLoading] = useState(false);

  // --- 🌟 Global Filters State ---
  const [globalFilter, setGlobalFilter] = useState({
    year: "2569",
    term: "1",
    university: "all",
    person: "all",
    timeRange: "week",
    customDates: null,
  });

  // --- 📊 Charts Data State ---
  const [kpiData, setKpiData] = useState({ totalTasks: 0, joinTasks: 0, selfTasks: 0, topSkill: "-" });
  const [workloadBarData, setWorkloadBarData] = useState({ labels: [], datasets: [] });
  const [workloadGanttData, setWorkloadGanttData] = useState([]);
  const [workTypeData, setWorkTypeData] = useState({ labels: [], datasets: [] });
  const [heatmapData, setHeatmapData] = useState([]);
  const [collabData, setCollabData] = useState({ labels: [], datasets: [] });
  const [keywordData, setKeywordData] = useState({ labels: [], datasets: [] });

  // --- 🔍 Card-level Filters State ---
  const [cardFilter, setCardFilter] = useState({
    workTypeDept: "all",
    heatmapStaff: "all",
    collabType: "all",
  });

  const [globalOptions, setGlobalOptions] = useState({
    year: [{ label: "ทุกปีการศึกษา", value: "all" }, { label: "ปีการศึกษา 2566", value: "2566" }, { label: "ปีการศึกษา 2567", value: "2567" }, { label: "ปีการศึกษา 2568", value: "2568" }, { label: "ปีการศึกษา 2569", value: "2569" }],
    term: [{ label: "ทุกเทอม", value: "all" }, { label: "เทอม 1", value: "1" }, { label: "เทอม 2", value: "2" }, { label: "ฤดูร้อน", value: "summer" }],
    university: [{ label: "ทุกมหาวิทยาลัย", value: "all" }],
    person: [{ label: "นักศึกษาทุกคน", value: "all" }],
    timeRange: [
      { label: "วันนี้", value: "today" },
      { label: "สัปดาห์นี้", value: "week" },
      { label: "เดือนนี้", value: "month" },
      { label: "ทั้งหมด", value: "all" },
      { label: "เลือกช่วงเวลาเอง...", value: "custom" },
    ],
  });

  const cardOptions = {
    department: [{ label: "ทุกแผนก", value: "all" }, { label: "ฝ่ายบุคคล (HR)", value: "hr" }, { label: "ฝ่ายไอที (IT)", value: "it" }],
    staff: [{ label: "พี่เลี้ยงทุกคน", value: "all" }, { label: "พี่สมชาย", value: "s1" }, { label: "พี่วิชัย", value: "s2" }],
    workType: [{ label: "ทุกประเภทงาน", value: "all" }, { label: "Hardware", value: "hw" }, { label: "Network", value: "nw" }],
  };

  // --- 🚀 Fetch Options ---
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [studentRes, filterRes] = await Promise.all([
          api.get("/users/students"),
          api.get("/tasks/workload-filters")
        ]);

        if (studentRes.data.success) {
          setGlobalOptions(prev => ({
            ...prev,
            person: [{ label: "นักศึกษาทุกคน", value: "all" }, ...studentRes.data.data]
          }));
        }

        if (filterRes.data.success) {
          const universities = filterRes.data.filters.universities;
          setGlobalOptions(prev => ({
            ...prev,
            university: [{ label: "ทุกมหาวิทยาลัย", value: "all" }, ...universities]
          }));

          // Set default university to the first one available in the list
          if (universities && universities.length > 0) {
            setGlobalFilter(prev => ({
              ...prev,
              university: universities[0].value
            }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch dashboard options", err);
      }
    };
    fetchOptions();
  }, []);

  // --- 🚀 Fetch Data Functions ---
  const fetchDashboardData = async (filters) => {
    setLoading(true);
    try {
      // TODO: Replace with real API call
      // const response = await api.get('/dashboard', { params: filters });
      // const data = response.data;

      // Simulated API Response Delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Mock Data Update
      setKpiData({ totalTasks: 45, joinTasks: 32, selfTasks: 13, topSkill: "Network" });

      setWorkloadBarData({
        labels: ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์"],
        datasets: [
          { type: "bar", label: "งานที่ช่วยพี่ (Join)", backgroundColor: "#38bdf8", borderRadius: { topLeft: 0, topRight: 0, bottomLeft: 4, bottomRight: 4 }, data: [6, 5, 8, 4, 9] },
          { type: "bar", label: "งานที่ทำเอง (Self)", backgroundColor: "#fb7185", borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 }, data: [2, 4, 1, 5, 1] },
        ],
      });

      setWorkloadGanttData([
        { id: 1, day: "จันทร์", title: "ซ่อม Printer", type: "join", start: 8.5, duration: 1.5 },
        { id: 2, day: "จันทร์", title: "เดินสาย LAN", type: "self", start: 13.0, duration: 3.0 },
        { id: 3, day: "อังคาร", title: "Config Router", type: "join", start: 9.0, duration: 2.0 },
        { id: 4, day: "พุธ", title: "Support User", type: "join", start: 10.0, duration: 2.5 },
        { id: 5, day: "พฤหัสบดี", title: "Meeting", type: "join", start: 13.5, duration: 1.5 },
        { id: 6, day: "ศุกร์", title: "เช็คกล้องวงจรปิด", type: "self", start: 9.5, duration: 2.0 },
      ]);

      setWorkTypeData({
        labels: ["Hardware", "Software", "Network", "Document"],
        datasets: [{ data: [40, 30, 20, 10], backgroundColor: ["#38bdf8", "#fb7185", "#a78bfa", "#fbbf24"], hoverOffset: 4, borderWidth: 2, borderColor: "#ffffff", cutout: "70%" }],
      });

      setHeatmapData([
        [0, 2, 4, 5, 1, 0, 3, 2, 1], [1, 3, 2, 1, 0, 4, 6, 3, 0], [0, 5, 3, 2, 2, 1, 2, 4, 1], [2, 1, 1, 3, 0, 5, 4, 2, 2], [1, 4, 6, 3, 1, 2, 1, 1, 0]
      ]);

      setCollabData({
        labels: ["พี่สมชาย", "พี่สมหญิง", "พี่วิชัย"],
        datasets: [{ label: "จำนวนงาน", backgroundColor: ["#6366f1", "#818cf8", "#a5b4fc"], borderRadius: 4, barPercentage: 0.6, data: [18, 10, 4] }],
      });

      setKeywordData({
        labels: ["เปลี่ยน RAM", "Config LAN", "Printer Setup", "ซ่อม UPS", "ลง Windows", "Active Directory"],
        datasets: [
          {
            label: "จำนวนครั้งที่บันทึก",
            data: [28, 22, 18, 15, 12, 8],
            backgroundColor: ["#a78bfa", "#38bdf8", "#fbbf24", "#e879f9", "#fb7185", "#34d399"],
            hoverBackgroundColor: ["#8b5cf6", "#0ea5e9", "#f59e0b", "#d946ef", "#f43f5e", "#10b981"],
            borderRadius: 8,
            borderSkipped: false,
            barPercentage: 0.6,
          },
        ],
      });

      toast.current?.show({ severity: "success", summary: "Data Updated", detail: "ข้อมูลแดชบอร์ดอัปเดตเรียบร้อยแล้ว" });
    } catch (error) {
      toast.current?.show({ severity: "error", summary: "Error", detail: "ไม่สามารถโหลดข้อมูลได้" });
    } finally {
      setLoading(false);
    }
  };

  // --- Initial Load ---
  useEffect(() => {
    fetchDashboardData(globalFilter);
  }, []);

  // --- Handlers ---
  const handleFilterChange = (key, value) => {
    setGlobalFilter(prev => ({ ...prev, [key]: value }));
  };

  const handleCardFilterChange = (key, value) => {
    setCardFilter(prev => ({ ...prev, [key]: value }));
    // Ideally fetch specific chart data here or filter locally
    console.log(`Filtering ${key} by ${value}`);
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-800 pb-12">
      <Toast ref={toast} />

      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 pt-6 flex flex-col xl:flex-row gap-6">
        {/* Sidebar Filter */}
        <div className="w-full xl:w-72 shrink-0">
          <DashboardFilter
            filters={globalFilter}
            options={globalOptions}
            onChange={handleFilterChange}
            onApply={() => fetchDashboardData(globalFilter)}
            loading={loading}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          <KPICards data={kpiData} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <WorkloadChart globalFilter={globalFilter} />
            <WorkTypeChart
              data={workTypeData}
              filter={cardFilter.workTypeDept}
              onFilterChange={(val) => handleCardFilterChange("workTypeDept", val)}
              filterOptions={cardOptions.department}
            />
          </div>

          <ActivityHeatmap
            data={heatmapData}
            filter={cardFilter.heatmapStaff}
            onFilterChange={(val) => handleCardFilterChange("heatmapStaff", val)}
            filterOptions={cardOptions.staff}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CollaborationChart
              data={collabData}
              filter={cardFilter.collabType}
              onFilterChange={(val) => handleCardFilterChange("collabType", val)}
              filterOptions={cardOptions.workType}
            />
            <LearningKeywordsChart data={keywordData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
