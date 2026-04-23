import React from "react";

const KPICards = ({ data }) => {
  const stats = [
    { title: "ภารกิจทั้งหมด", value: data.totalTasks, icon: "pi-folder-open", color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: "จำนวนงานที่เข้าร่วม", value: data.joinTasks, icon: "pi-users", color: "text-blue-600", bg: "bg-blue-50" },
    { title: "ทักษะหลัก", value: data.topSkill, icon: "pi-star", color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {stats.map((stat, i) => (
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
  );
};

export default KPICards;
