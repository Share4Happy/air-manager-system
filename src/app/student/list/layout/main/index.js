'use client'

import { Li_l } from '../../ui/itemStudent';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Loading from '@/components/(ui)/(loading)/loading';
import { Svg_Reload } from '@/components/(icon)/svg';
import { reloadStudent } from '@/data/actions/reload';
import Create from '../../ui/create';

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

  return (
    <div className="flex gap-4 h-[calc(100%-16px)] w-full p-2 pr-0 pt-2">
        <div className="flex-1 rounded-lg border border-[var(--border-color)] flex flex-col overflow-auto">
        <div className="border-b-2 border-[var(--border-color)] px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-[var(--text-primary)] whitespace-nowrap">Tổng: {data_student.length} học sinh</span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="hidden md:flex items-center gap-2 flex-wrap">
                <input
                  className="px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 w-[200px]"
                  placeholder="Nhập tên hoặc ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                  className="px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 w-[140px]"
                  value={filterArea}
                  onChange={(e) => setFilterArea(e.target.value)}
                >
                  <option value="Tất cả">Tất cả khu vực</option>
                  {uniqueAreas.map((areaName) => (
                    <option key={areaName} value={areaName}>{areaName}</option>
                  ))}
                </select>
                <select
                  className="px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 w-[120px]"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="Tất cả">Tất cả</option>
                  <option value="Đang học">Đang học</option>
                  <option value="Chờ lên khóa">Chờ lên khóa</option>
                  <option value="Đã nghỉ">Đã nghỉ</option>
                </select>
                <select
                  className="px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 w-[140px]"
                  value={filterRank}
                  onChange={(e) => setFilterRank(e.target.value === "Tất cả" ? "Tất cả" : Number(e.target.value))}
                >
                  {RANK_LEVELS.map(([label, val]) => (
                    <option key={label} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <button
                className="px-3 py-2 bg-[var(--main_d)] text-white text-sm font-medium rounded cursor-pointer border-none flex items-center gap-1.5 whitespace-nowrap transition-colors hover:brightness-110"
                onClick={ReLoadData}
              >
                <Svg_Reload w={16} h={16} c='white' />
                <span className="hidden md:inline">Tải lại</span>
              </button>
              <Create data_area={data_area} />
            </div>
          </div>
          <div className={`${showFilters ? 'flex' : 'hidden'} md:hidden flex-col gap-2 mt-2 border-t border-[var(--border-color)] pt-2`}>
            <input
              className="px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 w-full"
              placeholder="Nhập tên hoặc ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex gap-2">
              <select
                className="px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 flex-1"
                value={filterArea}
                onChange={(e) => setFilterArea(e.target.value)}
              >
                <option value="Tất cả">Khu vực</option>
                {uniqueAreas.map((areaName) => (
                  <option key={areaName} value={areaName}>{areaName}</option>
                ))}
              </select>
              <select
                className="px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 flex-1"
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
              className="px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 w-full"
              value={filterRank}
              onChange={(e) => setFilterRank(e.target.value === "Tất cả" ? "Tất cả" : Number(e.target.value))}
            >
              {RANK_LEVELS.map(([label, val]) => (
                <option key={label} value={val}>{label}</option>
              ))}
            </select>
          </div>
          <button className="md:hidden flex items-center justify-end w-full mt-2 pb-0 border-none cursor-pointer bg-transparent" onClick={() => setShowFilters(!showFilters)}>
            <div className="w-7 h-7 rounded-full border border-[var(--border-color)] flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={14} height={14} fill="var(--text-secondary)">
                <path d="M3.9 54.9C10.5 40.9 24.5 32 40 32l432 0c15.5 0 29.5 8.9 36.1 22.9s4.6 30.5-5.2 42.5L320 320.9 320 448c0 12.1-6.8 23.2-17.7 28.6s-23.8 4.3-33.5-3l-64-48c-8.1-6-12.8-15.5-12.8-25.6l0-79.1L9 97.5C-.7 85.4-2.8 68.8 3.9 54.9z"/>
              </svg>
            </div>
          </button>
        </div>

        <div className="flex-1" style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 700 }}>
            {filteredStudents.map((t, index) => (
              <Li_l key={t.ID || index} data={t} dataArea={data_area} />
            ))}
          </div>
        </div>
      </div>

      {load && (<div className="fixed inset-0 bg-black/80 flex justify-center items-center z-[9999]">  <Loading content={<p className='text-sm font-normal text-white'>Đang tải dữ liệu...</p>} /></div>)}
    </div>
  );
}
