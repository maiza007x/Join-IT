import React, { useState, useRef, useEffect, useCallback } from "react";
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

  // --- 🌟 Helpers ---
  const getDefaultTerm = () => {
    const month = new Date().getMonth() + 1; // 1-12
    if (month >= 3 && month <= 5) return "ภาคฤดูร้อน";
    if (month >= 6 && month <= 9) return "1";
    if (month >= 10 || month <= 2) return "2";
    return "1";
  };

  // --- 🌟 Global Filters State ---
  const [globalFilter, setGlobalFilter] = useState(() => {
    const saved = localStorage.getItem("dashboardGlobalFilter");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing dashboardGlobalFilter", e);
      }
    }
    return {
      year: "2569",
      term: getDefaultTerm(),
      university: "all",
      person: "all",
      timeRange: "today",
      customDates: null,
    };
  });

  useEffect(() => {
    localStorage.setItem("dashboardGlobalFilter", JSON.stringify(globalFilter));
  }, [globalFilter]);

  // --- 📊 Charts Data State ---
  const [kpiData, setKpiData] = useState({ totalTasks: 0, joinTasks: 0, selfTasks: 0, topSkill: "-" });

  // --- 🔍 Card-level Filters State ---
  const [cardFilter, setCardFilter] = useState({
    workTypeDept: "all",
    heatmapStaff: "all",
    collabType: "all",
  });

  const [globalOptions, setGlobalOptions] = useState({
    year: [{ label: "ทุกปีการศึกษา", value: "all" }, { label: "ปีการศึกษา 2566", value: "2566" }, { label: "ปีการศึกษา 2567", value: "2567" }, { label: "ปีการศึกษา 2568", value: "2568" }, { label: "ปีการศึกษา 2569", value: "2569" }],
    term: [{ label: "ทุกเทอม", value: "all" }, { label: "เทอม 1", value: "1" }, { label: "เทอม 2", value: "2" }, { label: "ภาคฤดูร้อน", value: "ภาคฤดูร้อน" }],
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
    department: [{ label: "ทุกแผนก", value: "all" }],
    staff: [{ label: "พี่เลี้ยงทุกคน", value: "all" }],
    workType: [{ label: "ทุกประเภทงาน", value: "all" }],
  };

  // --- 🚀 Fetch Options (Cascading) ---
  const prevYearTerm = useRef({ year: globalFilter.year, term: globalFilter.term });

  const fetchCascadingOptions = async (filters) => {
    try {
      const response = await api.get("/tasks/workload-filters", {
        params: {
          academicYear: filters.year,
          term: filters.term,
          university: filters.university
        }
      });

      if (response.data.success) {
        const { universities, students } = response.data.filters;

        setGlobalOptions(prev => ({
          ...prev,
          university: [{ label: "ทุกมหาวิทยาลัย", value: "all" }, ...universities],
          person: [{ label: "นักศึกษาทุกคน", value: "all" }, ...students]
        }));

        // Auto-select top university ONLY if year or term changed, or if current selection is invalid
        const yearTermChanged = prevYearTerm.current.year !== filters.year || prevYearTerm.current.term !== filters.term;

        if (yearTermChanged && universities.length > 0) {
          setGlobalFilter(prev => ({ ...prev, university: universities[0].value }));
        } else if (filters.university !== "all" && !universities.find(u => u.value === filters.university)) {
          // If current uni is not in the new list, reset to 'all' or top
          setGlobalFilter(prev => ({ ...prev, university: universities.length > 0 ? universities[0].value : "all" }));
        }

        prevYearTerm.current = { year: filters.year, term: filters.term };
      }
    } catch (err) {
      console.error("Failed to fetch cascading options", err);
    }
  };

  // Trigger cascading fetch when dependencies change
  useEffect(() => {
    fetchCascadingOptions(globalFilter);
  }, [globalFilter.year, globalFilter.term, globalFilter.university]);

  // --- 🚀 Fetch Data Functions ---
  const fetchDashboardData = useCallback(async (filters) => {
    setLoading(true);
    try {
      const response = await api.get('/tasks/analytics-stats', {
        params: {
          range: filters.timeRange,
          year: filters.year,
          term: filters.term,
          university: filters.university,
          person: filters.person
        }
      });

      if (response.data.success) {
        setKpiData(response.data.kpi);
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Initial Load & Watch Global Filters ---
  useEffect(() => {
    fetchDashboardData(globalFilter);
  }, [globalFilter, fetchDashboardData]);

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
            <WorkTypeChart globalFilter={globalFilter} />
          </div>

          <ActivityHeatmap globalFilter={globalFilter} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CollaborationChart globalFilter={globalFilter} />
            <LearningKeywordsChart globalFilter={globalFilter} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
