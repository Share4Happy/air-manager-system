'use client'

import { Li_l } from '../../ui/itemStudent';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Loading from '@/components/(ui)/(loading)/loading';
import { Svg_Reload } from '@/components/(icon)/svg';
import { reloadStudent } from '@/data/actions/reload';
import Create from '../../ui/create';
import ImportStudent from '../../ui/import';

const STATUS_MAP = { "Đang học": 2, "Chờ lên khóa": 1, "Đã nghỉ": 0 };

export default function Main({ data_student, data_area }) {
  const [load, setLoad] = useState(false);
  const [filterArea, setFilterArea] = useState("Tất cả");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Tất cả");
  const [filterRank, setFilterRank] = useState("Tất cả");
  const route = useRouter();

  const [showFilters, setShowFilters] = useState(false);
  const ReLoadData = async () => { setLoad(true); await reloadStudent(); route.refresh(); setLoad(false); };

  const uniqueAreas = [...new Set(data_student.map(s => s.Area?.name).filter(Boolean))];
  const RANK_LEVELS = [["Xếp hạng", "Tất cả"], ["Mới", 0], ["Member", 1], ["Bạc", 2], ["Vàng", 3], ["Bạch Kim", 4], ["Kim Cương", 5]];

  const filteredStudents = data_student.filter(student => {
    const search = searchTerm.trim().toLowerCase();
    const latestStatus = student.Status?.[student.Status.length - 1]?.status;

    const matchSearch = !search ||
      student.Name?.toLowerCase().includes(search) ||
      student.ID?.toLowerCase().includes(search);

    const matchArea = filterArea === "Tất cả" || student.Area?.name === filterArea;
    const matchStatus = filterStatus === "Tất cả" || latestStatus === STATUS_MAP[filterStatus];
    const matchRank = filterRank === "Tất cả" || student.rank?.level === filterRank;

    return matchArea && matchSearch && matchStatus && matchRank;
  });

  const hasActiveFilters = Boolean(filterArea !== "Tất cả" || filterStatus !== "Tất cả" || filterRank !== "Tất cả");

  return (
    <div className="flex flex-col gap-2 h-full w-full p-0 min-h-0">
      {/* 1. Thanh công cụ riêng biệt */}
      <div className="flex flex-col gap-2 p-2 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)] shrink-0">
        {/* Main Toolbar Row */}
        <div className="flex items-center gap-2 md:gap-3 w-full">
          {/* Search Input */}
          <input
            className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm outline-none resize-none text-[var(--text-primary)] flex-1 min-w-0"
            placeholder="Nhập tên hoặc ID học sinh..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* Mobile Top Row: Create Button (Element 2) */}
          <div className="md:hidden shrink-0">
            <Create data_area={data_area} />
          </div>

          {/* Mobile Funnel Button (Element 3) */}
          <button
            type="button"
            className={`md:hidden flex items-center justify-center w-8 h-8 rounded-full border cursor-pointer transition-colors shrink-0 ${
              showFilters || hasActiveFilters
                ? 'bg-blue-50 border-blue-300 text-blue-600'
                : 'border-[var(--border-color)] bg-white text-[var(--text-secondary)]'
            }`}
            onClick={() => setShowFilters(s => !s)}
            title="Bộ lọc"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={14} height={14} fill="currentColor">
              <path d="M3.9 54.9C10.5 40.9 24.5 32 40 32l432 0c15.5 0 29.5 8.9 36.1 22.9s4.6 30.5-5.2 42.5L320 320.9 320 448c0 12.1-6.8 23.2-17.7 28.6s-23.8 4.3-33.5-3l-64-48c-8.1-6-12.8-15.5-12.8-25.6l0-79.1L9 97.5C-.7 85.4-2.8 68.8 3.9 54.9z"/>
            </svg>
          </button>

          {/* Desktop Inline Controls */}
          <div className="hidden md:flex items-center gap-2 md:gap-3 shrink-0">
            <div className="p-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium border border-gray-200 whitespace-nowrap flex items-center gap-1.5 shrink-0">
              <span>Tổng:</span>
              <span className="font-semibold text-[var(--text-primary)]">{filteredStudents.length}</span>
            </div>
            <select
              className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm outline-none text-gray-700 w-auto cursor-pointer"
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
            >
              <option value="Tất cả">Tất cả khu vực</option>
              {uniqueAreas.map((areaName) => (
                <option key={areaName} value={areaName}>{areaName}</option>
              ))}
            </select>
            <select
              className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm outline-none text-gray-700 w-auto cursor-pointer"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="Tất cả">Tất cả trạng thái</option>
              <option value="Đang học">Đang học</option>
              <option value="Chờ lên khóa">Chờ lên khóa</option>
              <option value="Đã nghỉ">Đã nghỉ</option>
            </select>
            <select
              className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm outline-none text-gray-700 w-auto cursor-pointer"
              value={filterRank}
              onChange={(e) => setFilterRank(e.target.value === "Tất cả" ? "Tất cả" : Number(e.target.value))}
            >
              {RANK_LEVELS.map(([label, val]) => (
                <option key={label} value={val}>{label}</option>
              ))}
            </select>
            <button
              className="px-3 py-2 bg-[var(--main_d)] text-white text-sm font-medium rounded-lg cursor-pointer border-none flex items-center gap-1.5 whitespace-nowrap transition-colors hover:brightness-110"
              onClick={ReLoadData}
            >
              <Svg_Reload w={16} h={16} c='white' />
              <span>Tải lại</span>
            </button>
            <ImportStudent />
            <Create data_area={data_area} />
          </div>
        </div>

        {/* Mobile Collapsible Filters & Actions */}
        <div className={`${showFilters ? 'flex' : 'hidden'} md:hidden flex-col gap-2 pt-2 border-t border-[var(--border-color)]`}>
          <div className="grid grid-cols-2 gap-2 w-full">
            <select
              className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm outline-none text-gray-700 w-full"
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
            >
              <option value="Tất cả">Khu vực</option>
              {uniqueAreas.map((areaName) => (
                <option key={areaName} value={areaName}>{areaName}</option>
              ))}
            </select>
            <select
              className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm outline-none text-gray-700 w-full"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="Tất cả">Trạng thái</option>
              <option value="Đang học">Đang học</option>
              <option value="Chờ lên khóa">Chờ lên khóa</option>
              <option value="Đã nghỉ">Đã nghỉ</option>
            </select>
          </div>
          <select
            className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm outline-none text-gray-700 w-full"
            value={filterRank}
            onChange={(e) => setFilterRank(e.target.value === "Tất cả" ? "Tất cả" : Number(e.target.value))}
          >
            {RANK_LEVELS.map(([label, val]) => (
              <option key={label} value={val}>{label}</option>
            ))}
          </select>
          <div className="flex items-center gap-2 w-full pt-1">
            <div className="px-2.5 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold border border-gray-200 shrink-0">
              Tổng: {filteredStudents.length}
            </div>
            <button
              className="flex-1 px-3 py-2 bg-[var(--main_d)] text-white text-xs font-medium rounded-lg cursor-pointer border-none flex items-center justify-center gap-1.5 transition-colors hover:brightness-110"
              onClick={ReLoadData}
            >
              <Svg_Reload w={14} h={14} c='white' />
              <span>Tải lại</span>
            </button>
            <ImportStudent />
          </div>
        </div>
      </div>

      {/* 2. Khung bảng dữ liệu riêng biệt */}
      <div className="flex-1 rounded-lg border border-[var(--border-color)] bg-white flex flex-col overflow-auto min-h-0">
        <div className="flex-1 overflow-auto">
          {filteredStudents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white text-left">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-[var(--border-color)] sticky top-0 z-10 backdrop-blur-xs">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[220px]">Học sinh</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[130px]">Khu vực</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[120px]">Liên hệ</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[110px]">Ngày tạo</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center min-w-[110px]">Xếp hạng</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center min-w-[130px]">Đã hoàn thành</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center min-w-[160px]">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStudents.map((t, index) => (
                    <Li_l key={t._id || t.ID || index} data={t} dataArea={data_area} ReLoadData={ReLoadData} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-[var(--text-secondary)] italic">
              Không tìm thấy học sinh nào phù hợp.
            </div>
          )}
        </div>
      </div>

      {load && (<div className="fixed inset-0 bg-black/80 flex justify-center items-center z-[9999]">  <Loading content={<p className='text-sm font-normal text-white'>Đang tải dữ liệu...</p>} /></div>)}
    </div>
  );
}
