'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { formatDate } from '@/function';
import AddEditStationModal from './AddEditStationModal';
import ScenarioMatrixTable from './ScenarioMatrixTable';
import { EventModal } from '@/app/events/ui/common';
import {
    IconTree,
    IconPlus,
    IconEdit,
    IconTrash,
    IconCheck,
    IconChevronDown,
    IconChevronRight,
    IconClock,
    IconUser,
    IconCalendar,
    IconLayers,
    IconStation,
    IconLocation,
    IconRobot,
    IconSchool,
    IconClose,
    IconDotsVertical,
    IconCamera,
    IconZap,
    IconTable,
} from '@/app/events/ui/icons';

const statusConfig = {
    pending: { label: 'Chưa làm', bg: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300', dot: 'bg-gray-400', next: 'in_progress' },
    in_progress: { label: 'Đang làm', bg: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300', dot: 'bg-blue-500', next: 'completed' },
    completed: { label: 'Hoàn thành', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300', dot: 'bg-emerald-500', next: 'pending' },
    overdue: { label: 'Trễ hạn', bg: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/50 dark:text-amber-300', dot: 'bg-amber-500', next: 'in_progress' },
    blocked: { label: 'Vướng mắc', bg: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/50 dark:text-rose-300', dot: 'bg-rose-500', next: 'in_progress' },
};

const priorityConfig = {
    urgent: { label: 'Khẩn cấp', color: 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900' },
    high: { label: 'Cao', color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900' },
    medium: { label: 'Trung bình', color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-900' },
    low: { label: 'Thấp', color: 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700' },
};

const phaseColorPalette = [
    {
        name: 'blue',
        badge: 'bg-blue-600 text-white',
        cardBorder: 'border-blue-200 dark:border-blue-900/60',
        activeHoldingBorder: 'border-blue-500 dark:border-blue-500 ring-2 ring-blue-400/20',
        headerBg: 'bg-gradient-to-r from-blue-50/90 via-blue-50/40 to-transparent dark:from-blue-950/40 dark:via-blue-950/20 dark:to-transparent',
        treeLine: 'bg-blue-300 dark:bg-blue-800/80',
        hoverBorder: 'hover:border-blue-300 dark:hover:border-blue-700',
        holdingBadge: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-900',
        text: 'text-blue-900 dark:text-blue-200',
    },
    {
        name: 'indigo',
        badge: 'bg-indigo-600 text-white',
        cardBorder: 'border-indigo-200 dark:border-indigo-900/60',
        activeHoldingBorder: 'border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-400/20',
        headerBg: 'bg-gradient-to-r from-indigo-50/90 via-indigo-50/40 to-transparent dark:from-indigo-950/40 dark:via-indigo-950/20 dark:to-transparent',
        treeLine: 'bg-indigo-300 dark:bg-indigo-800/80',
        hoverBorder: 'hover:border-indigo-300 dark:hover:border-indigo-700',
        holdingBadge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900',
        text: 'text-indigo-900 dark:text-indigo-200',
    },
    {
        name: 'purple',
        badge: 'bg-purple-600 text-white',
        cardBorder: 'border-purple-200 dark:border-purple-900/60',
        activeHoldingBorder: 'border-purple-500 dark:border-purple-500 ring-2 ring-purple-400/20',
        headerBg: 'bg-gradient-to-r from-purple-50/90 via-purple-50/40 to-transparent dark:from-purple-950/40 dark:via-purple-950/20 dark:to-transparent',
        treeLine: 'bg-purple-300 dark:bg-purple-800/80',
        hoverBorder: 'hover:border-purple-300 dark:hover:border-purple-700',
        holdingBadge: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-900',
        text: 'text-purple-900 dark:text-purple-200',
    },
    {
        name: 'emerald',
        badge: 'bg-emerald-600 text-white',
        cardBorder: 'border-emerald-200 dark:border-emerald-900/60',
        activeHoldingBorder: 'border-emerald-500 dark:border-emerald-500 ring-2 ring-emerald-400/20',
        headerBg: 'bg-gradient-to-r from-emerald-50/90 via-emerald-50/40 to-transparent dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-transparent',
        treeLine: 'bg-emerald-300 dark:bg-emerald-800/80',
        hoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-700',
        holdingBadge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
        text: 'text-emerald-900 dark:text-emerald-200',
    },
    {
        name: 'amber',
        badge: 'bg-amber-600 text-white',
        cardBorder: 'border-amber-200 dark:border-amber-900/60',
        activeHoldingBorder: 'border-amber-500 dark:border-amber-500 ring-2 ring-amber-400/20',
        headerBg: 'bg-gradient-to-r from-amber-50/90 via-amber-50/40 to-transparent dark:from-amber-950/40 dark:via-amber-950/20 dark:to-transparent',
        treeLine: 'bg-amber-300 dark:bg-amber-800/80',
        hoverBorder: 'hover:border-amber-300 dark:hover:border-amber-700',
        holdingBadge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-900',
        text: 'text-amber-900 dark:text-amber-200',
    },
    {
        name: 'rose',
        badge: 'bg-rose-600 text-white',
        cardBorder: 'border-rose-200 dark:border-rose-900/60',
        activeHoldingBorder: 'border-rose-500 dark:border-rose-500 ring-2 ring-rose-400/20',
        headerBg: 'bg-gradient-to-r from-rose-50/90 via-rose-50/40 to-transparent dark:from-rose-950/40 dark:via-rose-950/20 dark:to-transparent',
        treeLine: 'bg-rose-300 dark:bg-rose-800/80',
        hoverBorder: 'hover:border-rose-300 dark:hover:border-rose-700',
        holdingBadge: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-900',
        text: 'text-rose-900 dark:text-rose-200',
    },
];

const getCategoryMeta = (category) => {
    switch (category) {
        case 'assembly':
            return {
                label: 'Lắp ráp Robotics',
                badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-800',
                stationNum: 'bg-blue-600 text-white',
                columnBorder: 'border-t-4 border-t-blue-500',
                columnHeaderBg: 'bg-blue-50/40 dark:bg-blue-950/20',
            };
        case 'coding':
            return {
                label: 'Lập trình Điều khiển',
                badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-800',
                stationNum: 'bg-purple-600 text-white',
                columnBorder: 'border-t-4 border-t-purple-500',
                columnHeaderBg: 'bg-purple-50/40 dark:bg-purple-950/20',
            };
        case 'control':
            return {
                label: 'Điều khiển & Sa bàn',
                badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800',
                stationNum: 'bg-amber-600 text-white',
                columnBorder: 'border-t-4 border-t-amber-500',
                columnHeaderBg: 'bg-amber-50/40 dark:bg-amber-950/20',
            };
        case 'competition':
            return {
                label: 'Thi đấu & Thử thách',
                badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800',
                stationNum: 'bg-rose-600 text-white',
                columnBorder: 'border-t-4 border-t-rose-500',
                columnHeaderBg: 'bg-rose-50/40 dark:bg-rose-950/20',
            };
        case 'reward':
            return {
                label: 'Check-in & Đổi thưởng',
                badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
                stationNum: 'bg-emerald-600 text-white',
                columnBorder: 'border-t-4 border-t-emerald-500',
                columnHeaderBg: 'bg-emerald-50/40 dark:bg-emerald-950/20',
            };
        default:
            return {
                label: 'Phân khu Trải nghiệm',
                badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
                stationNum: 'bg-indigo-600 text-white',
                columnBorder: 'border-t-4 border-t-indigo-500',
                columnHeaderBg: 'bg-indigo-50/40 dark:bg-indigo-950/20',
            };
    }
};

export default function RoadmapTreeView({
    roadmap = [],
    stations = [],
    onUpdateRoadmap,
    onUpdateStations,
    onUpdateMultiple,
    users = [],
    members = [],
    event = {},
    roadmapMode = 'tree',
    setRoadmapMode,
    readOnly = false,
}) {
    const [collapsedPhases, setCollapsedPhases] = useState({});
    const [showStationBranches, setShowStationBranches] = useState(true);
    const [stationPhaseId, setStationPhaseId] = useState(event?.stationPhaseId ?? 'auto');
    const [editingNode, setEditingNode] = useState(null); // Node object for edit modal
    const [addingParentId, setAddingParentId] = useState(null); // null for new root phase, or phaseId for subtask
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [previewPhoto, setPreviewPhoto] = useState(null);

    const toggleMenu = (e, menuId) => {
        e.stopPropagation();
        setActiveMenuId(prev => prev === menuId ? null : menuId);
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('[data-dropdown-menu]')) {
                setActiveMenuId(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Sync stationPhaseId if event props change
    useEffect(() => {
        if (event?.stationPhaseId !== undefined) {
            setStationPhaseId(event.stationPhaseId ?? 'auto');
        }
    }, [event?.stationPhaseId]);

    // Station Add/Edit Modal state
    const [isStationModalOpen, setIsStationModalOpen] = useState(false);
    const [editingStation, setEditingStation] = useState(null);

    const handleOpenAddStation = () => {
        setEditingStation(null);
        setIsStationModalOpen(true);
    };

    const handleOpenEditStation = (station) => {
        setEditingStation(station);
        setIsStationModalOpen(true);
    };

    const handleSaveStation = (stationData) => {
        if (!onUpdateStations) return;
        let updated;
        if (editingStation) {
            updated = stations.map(s => s.id === editingStation.id ? { ...stationData, order: s.order } : s);
        } else {
            updated = [...stations, { ...stationData, order: stations.length + 1 }];
        }
        onUpdateStations(updated);
        setIsStationModalOpen(false);
        setEditingStation(null);
    };

    const handleDeleteStation = (stationId) => {
        if (!onUpdateStations) return;
        if (!confirm('Bạn có chắc chắn muốn xóa phân khu / trạm này khỏi kịch bản?')) return;
        const updated = stations.filter(s => s.id !== stationId);
        onUpdateStations(updated);
    };

    // Apply Standard 3-Station STEM Day Template
    const handleApplySTEMTemplate = () => {
        if (!onUpdateStations) return;
        if (stations.length > 0 && !confirm('Thao tác này sẽ nạp mẫu kịch bản 3 trạm chuẩn (Lắp ráp, Lập trình, Điều khiển sa bàn). Tiếp tục?')) {
            return;
        }

        const partnerName = event?.location || event?.targetAudience || 'Địa điểm tổ chức';

        const templateStations = [
            {
                id: `station-prep-${Date.now()}`,
                order: 1,
                name: 'Khu vực Check-in & Chuẩn bị',
                category: 'reward',
                location: 'Cổng vào & Quầy trung tâm',
                lead: null,
                staffList: [],
                equipmentList: [
                    'Vé / Thẻ trải nghiệm 3 khu vực',
                    'Con dấu mộc tròn 3 trạm',
                    'Bánh kẹo, sticker quà tặng',
                    'Phiếu giảm giá khóa học AI Robotic',
                ],
                centerContent: {
                    title: 'Vé trải nghiệm 3 khu vực & Đổi thưởng',
                    description: 'Phát vé trải nghiệm cho học sinh. Các bạn tham gia các khu vực để lấy con dấu. Bạn nào tham gia đủ các khu vực sẽ được nhận 1 phần quà ngẫu nhiên (Phiếu giảm giá khóa học AI Robotic, bánh kẹo, quà lưu niệm, sticker...).',
                    models: ['Thẻ Trải nghiệm', 'Con dấu 3 trạm', 'Hộp quà may mắn'],
                },
                partnerContent: {
                    partnerName: partnerName,
                    description: 'Chuẩn bị khu vực sân trường, không gian trải nghiệm, hỗ trợ bàn ghế quầy lễ tân.',
                    studentGroupInfo: 'Toàn bộ học sinh',
                },
                photos: [],
                notes: 'Điểm bắt đầu và kết thúc nhận quà của học sinh.',
            },
            {
                id: `station-assembly-${Date.now() + 1}`,
                order: 2,
                name: 'Khu vực 1: Trải nghiệm Lắp ráp',
                category: 'assembly',
                location: 'Bàn 1-4 Sân trường',
                lead: null,
                staffList: [],
                equipmentList: [
                    '4 Mô hình Robot Cú mèo',
                    '4 Mô hình Robot Chó',
                    'Hộp phân loại linh kiện',
                    'Sách hướng dẫn lắp ráp trực quan',
                ],
                centerContent: {
                    title: 'Lắp ráp Robot Cú mèo & Robot Chó',
                    description: '4 Mô hình dự kiến lắp ráp: Robot cú mèo, Robot chó. Học sinh được chia theo nhóm để trải nghiệm. Sau khi hoàn thành sẽ được hướng dẫn tháo mô hình cho lượt kế tiếp.',
                    models: ['Robot Cú Mèo', 'Robot Chó Thông Minh'],
                },
                partnerContent: {
                    partnerName: partnerName,
                    description: 'Trường điều phối 1 nhóm học sinh đến tập trung thành 1 hàng hoặc vòng tròn để tiện cho các bé ổn định và quan sát các bạn khác làm.',
                    studentGroupInfo: '10 - 15 học sinh / nhóm',
                },
                photos: [],
                notes: 'Thời gian mỗi lượt: 15 - 20 phút.',
            },
            {
                id: `station-coding-${Date.now() + 2}`,
                order: 3,
                name: 'Khu vực 2: Trải nghiệm Lập trình',
                category: 'coding',
                location: 'Bàn 5-8 Sân trường / Sảnh',
                lead: null,
                staffList: [],
                equipmentList: [
                    '4 Mô hình Smart Fan (Cột xoay gió)',
                    '4 Mô hình Smart Lamp (Đèn thông minh)',
                    '4 Máy tính bảng nạp code Scratch/Blockly',
                ],
                centerContent: {
                    title: 'Lập trình Smart Fan & Smart Lamp',
                    description: 'Khi các bạn học sinh tới khu vực trải nghiệm, hướng dẫn viên giới thiệu đôi nét về các mô hình sẽ được lập trình và cách thức thực hiện. 4 Mô hình dự kiến: Smart Fan, Smart Lamp.',
                    models: ['Smart Fan (Quạt gió)', 'Smart Lamp (Đèn RGB cảm biến)'],
                },
                partnerContent: {
                    partnerName: partnerName,
                    description: 'Trường điều phối 1 nhóm học sinh đến tập trung thành 1 hàng hoặc vòng tròn để tiện ổn định và quan sát. Hỗ trợ ổ cắm nguồn điện.',
                    studentGroupInfo: '10 - 15 học sinh / nhóm',
                },
                photos: [],
                notes: 'Thời gian mỗi lượt: 15 - 20 phút.',
            },
            {
                id: `station-control-${Date.now() + 3}`,
                order: 4,
                name: 'Khu vực 3: Trải nghiệm Điều khiển & Sa bàn',
                category: 'control',
                location: 'Khu vực Thảm Sa bàn lớn ngoài trời',
                lead: null,
                staffList: [],
                equipmentList: [
                    '1 Sa bàn bạt thi đấu Mini Robotics Challenge',
                    '4 Xe Robot đua điều khiển tay cầm',
                    'Đồng hồ bấm giờ điện tử & Bảng điểm',
                ],
                centerContent: {
                    title: 'Mini Robotics Challenge - Thi đấu ngoài trời & Điều khiển xe',
                    description: 'Các đội tham gia điều khiển robot vượt thử thách trên sa bàn. Có tiêu chí chấm điểm rõ ràng: Hoàn thành nhiệm vụ, Thời gian, Độ chính xác. Tạo không khí sôi nổi.',
                    models: ['Xe Đua Vượt Chướng Ngại Vật', 'Sa Bàn Thi Đấu'],
                },
                partnerContent: {
                    partnerName: partnerName,
                    description: 'Trường điều phối 1 nhóm học sinh đến tập trung thành 1 hàng hoặc vòng tròn. Bố trí không gian rộng rãi.',
                    studentGroupInfo: '10 - 15 học sinh / nhóm',
                },
                photos: [],
                notes: 'Tạo không khí cổ vũ sôi động.',
            },
        ];

        onUpdateStations(templateStations);
    };

    // Form state for Add/Edit
    const [nodeForm, setNodeForm] = useState({
        name: '',
        description: '',
        assignee: '',
        dueDate: '',
        priority: 'medium',
        status: 'pending',
        attachStations: false,
    });

    const toggleCollapse = (phaseId) => {
        setCollapsedPhases(prev => ({ ...prev, [phaseId]: !prev[phaseId] }));
    };

    // Available Assignees: only people listed in event members (or event lead)
    const eventAssignees = useMemo(() => {
        const list = [];
        const seenIds = new Set();

        // 1. Members in this event
        (members || []).forEach(m => {
            const idStr = String(m.id || m._id);
            if (!seenIds.has(idStr)) {
                seenIds.add(idStr);
                const matchingUser = (users || []).find(u => String(u._id) === idStr || String(u._id) === String(m.userId));
                list.push({
                    id: idStr,
                    name: m.name,
                    role: m.role || (matchingUser ? (Array.isArray(matchingUser.role) ? matchingUser.role.join(', ') : matchingUser.role) : 'Thành viên'),
                    organization: m.organization,
                    type: matchingUser || !m.isExternal ? 'user' : 'member',
                });
            }
        });

        // 2. Event Lead (if assigned and not already in members)
        if (event?.lead) {
            const leadId = typeof event.lead === 'object' ? String(event.lead._id || event.lead.id) : String(event.lead);
            if (leadId && !seenIds.has(leadId)) {
                seenIds.add(leadId);
                const leadUser = typeof event.lead === 'object' ? event.lead : (users || []).find(u => String(u._id) === leadId);
                if (leadUser) {
                    list.unshift({
                        id: leadId,
                        name: leadUser.name,
                        role: 'Trưởng ban tổ chức',
                        type: 'user',
                    });
                }
            }
        }

        return list;
    }, [members, users, event?.lead]);

    // Helper to resolve any assignee (either internal user or external member)
    const getAssigneeInfo = (assigneeId) => {
        if (!assigneeId) return null;
        const idStr = typeof assigneeId === 'object' ? String(assigneeId?._id || assigneeId?.id) : String(assigneeId);

        // Check event members
        const m = members.find(m => String(m.id) === idStr || String(m._id) === idStr || String(m.userId) === idStr);
        if (m) {
            const u = users.find(u => String(u._id) === idStr || String(u._id) === String(m.userId));
            return {
                id: m.id || m._id,
                name: m.name,
                role: m.role || (u ? (Array.isArray(u.role) ? u.role.join(', ') : u.role) : 'Thành viên'),
                organization: m.organization,
                type: u || !m.isExternal ? 'user' : 'member',
                badgeColor: u || !m.isExternal ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
            };
        }

        // Check internal users
        const u = users.find(u => String(u._id) === idStr);
        if (u) {
            return {
                id: u._id,
                name: u.name,
                role: Array.isArray(u.role) ? u.role.join(', ') : u.role || 'Nhân sự',
                type: 'user',
                badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            };
        }

        return null;
    };

    const getPersonInfo = getAssigneeInfo;

    // Separate Root Phases and Child Tasks
    const rootPhases = useMemo(() => roadmap.filter(node => !node.parentId), [roadmap]);
    const getChildrenOf = (phaseId) => roadmap.filter(node => node.parentId === phaseId);

    // Compute which phase actually holds the scenario matrix
    const resolvedStationPhaseId = useMemo(() => {
        if (stationPhaseId === 'none' || !showStationBranches) return null;
        if (stationPhaseId === 'standalone') return 'standalone';
        if (stationPhaseId && stationPhaseId !== 'auto') {
            const exists = rootPhases.some(p => p.id === stationPhaseId);
            if (exists) return stationPhaseId;
        }

        // Auto selection
        if (rootPhases.length === 0) return 'standalone';

        const keywordPhase = rootPhases.find(p => {
            const nameLower = (p.name || '').toLowerCase();
            return nameLower.includes('d-day') ||
                nameLower.includes('ngày hội') ||
                nameLower.includes('thực hiện') ||
                nameLower.includes('trải nghiệm') ||
                nameLower.includes('diễn ra');
        });
        if (keywordPhase) return keywordPhase.id;

        if (rootPhases.length >= 2) return rootPhases[1].id;
        return rootPhases[0].id;
    }, [stationPhaseId, showStationBranches, rootPhases]);

    const handleSelectStationPhase = (newPhaseId) => {
        setStationPhaseId(newPhaseId);
        if (onUpdateMultiple) {
            onUpdateMultiple({ stationPhaseId: newPhaseId });
        }
    };

    // Quick Assign without opening modal
    const handleQuickAssign = (nodeId, newAssigneeId) => {
        const updatedRoadmap = roadmap.map(node => {
            if (node.id === nodeId) {
                return {
                    ...node,
                    assignee: newAssigneeId || null,
                };
            }
            return node;
        });
        onUpdateRoadmap(updatedRoadmap);
    };

    // Fast status advance
    const handleAdvanceStatus = (nodeId, currentStatus) => {
        const nextStatus = statusConfig[currentStatus]?.next || 'in_progress';
        const updatedRoadmap = roadmap.map(node => {
            if (node.id === nodeId) {
                return {
                    ...node,
                    status: nextStatus,
                    completedAt: nextStatus === 'completed' ? new Date() : null,
                };
            }
            return node;
        });
        onUpdateRoadmap(updatedRoadmap);
    };

    const handleOpenAddPhase = () => {
        setAddingParentId(null);
        setNodeForm({
            name: '',
            description: '',
            assignee: '',
            dueDate: '',
            priority: 'medium',
            status: 'pending',
            attachStations: stations.length > 0 && rootPhases.length === 0,
        });
        setIsAddModalOpen(true);
    };

    const handleOpenAddSubTask = (phaseId) => {
        setAddingParentId(phaseId);
        setNodeForm({
            name: '',
            description: '',
            assignee: '',
            dueDate: '',
            priority: 'medium',
            status: 'pending',
            attachStations: false,
        });
        setIsAddModalOpen(true);
    };

    const handleOpenEdit = (node) => {
        setEditingNode(node);
        setNodeForm({
            name: node.name || '',
            description: node.description || '',
            assignee: node.assignee?._id || node.assignee?.id || node.assignee || '',
            dueDate: node.dueDate ? new Date(node.dueDate).toISOString().slice(0, 10) : '',
            priority: node.priority || 'medium',
            status: node.status || 'pending',
            attachStations: resolvedStationPhaseId === node.id,
        });
    };

    const handleSaveAdd = (e) => {
        e.preventDefault();
        if (!nodeForm.name.trim()) return;

        const newNodeId = `node-${Date.now()}`;
        const newNode = {
            id: newNodeId,
            parentId: addingParentId,
            name: nodeForm.name.trim(),
            description: nodeForm.description.trim(),
            assignee: nodeForm.assignee || null,
            dueDate: nodeForm.dueDate ? new Date(nodeForm.dueDate) : null,
            priority: nodeForm.priority || 'medium',
            status: nodeForm.status || 'pending',
            order: roadmap.length + 1,
        };

        onUpdateRoadmap([...roadmap, newNode]);

        if (!addingParentId && nodeForm.attachStations) {
            handleSelectStationPhase(newNodeId);
        }

        setIsAddModalOpen(false);
    };

    const handleSaveEdit = (e) => {
        e.preventDefault();
        if (!editingNode || !nodeForm.name.trim()) return;

        const updatedRoadmap = roadmap.map(node => {
            if (node.id === editingNode.id) {
                return {
                    ...node,
                    name: nodeForm.name.trim(),
                    description: nodeForm.description.trim(),
                    assignee: nodeForm.assignee || null,
                    dueDate: nodeForm.dueDate ? new Date(nodeForm.dueDate) : null,
                    priority: nodeForm.priority,
                    status: nodeForm.status,
                    completedAt: nodeForm.status === 'completed' ? (node.completedAt || new Date()) : null,
                };
            }
            return node;
        });

        onUpdateRoadmap(updatedRoadmap);

        if (!editingNode.parentId) {
            if (nodeForm.attachStations) {
                handleSelectStationPhase(editingNode.id);
            } else if (resolvedStationPhaseId === editingNode.id) {
                handleSelectStationPhase('none');
            }
        }

        setEditingNode(null);
    };

    const handleDeleteNode = (nodeId) => {
        if (!confirm('Bạn có chắc chắn muốn xóa mục này? Nếu là Giai đoạn cha, các nhiệm vụ con cũng sẽ bị xóa.')) return;
        const toDeleteIds = new Set([nodeId]);
        // Also delete children
        roadmap.forEach(n => {
            if (n.parentId === nodeId) toDeleteIds.add(n.id);
        });

        const updatedRoadmap = roadmap.filter(n => !toDeleteIds.has(n.id));
        onUpdateRoadmap(updatedRoadmap);

        // If deleting the phase currently holding stations, reset
        if (resolvedStationPhaseId === nodeId) {
            handleSelectStationPhase('none');
        }
    };

    // Reusable Scenario Matrix Table (Ma trận Kịch bản Điều phối Thực địa)
    const renderScenarioMatrixContent = (isStandalone = false) => {
        const partnerName = event?.location || event?.targetAudience || 'Địa điểm tổ chức';

        if (stations.length === 0) {
            return (
                <div className={`${isStandalone ? 'p-4 sm:p-5' : 'sm:ml-8 mt-2'} flex flex-col gap-3 relative`}>
                    {!isStandalone && (
                        <div className="absolute -left-5 top-4 w-5 h-0.5 bg-blue-300 dark:bg-blue-800 hidden sm:block" />
                    )}
                    <div className="p-6 text-center rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                            <IconTable className="w-5 h-5" />
                        </div>
                        <div>
                            <h5 className="font-bold text-xs text-[var(--text-primary)]">
                                Chưa có phân khu / trạm kịch bản nào
                            </h5>
                            <p className="text-[11px] text-[var(--text-secondary)]">
                                Nạp mẫu chuẩn hoặc thêm trạm mới để xây dựng bảng ma trận kịch bản thực địa
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className={`${isStandalone ? 'p-4 sm:p-5' : 'sm:ml-8 mt-2'} flex flex-col gap-3 relative`}>
                {!isStandalone && (
                    <div className="absolute -left-5 top-4 w-5 h-0.5 bg-blue-300 dark:bg-blue-800 hidden sm:block" />
                )}

                {/* Scenario Matrix Title & Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 shrink-0">
                            <IconTable className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0">
                            <h5 className="font-bold text-sm sm:text-base text-[var(--text-primary)] truncate flex items-center gap-2.5">
                                <span>Bảng Ma trận Kịch bản Điều phối ({stations.length} trạm song song)</span>
                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                                    {isStandalone ? 'Khối độc lập' : 'Thực địa D-Day'}
                                </span>
                            </h5>
                            <p className="text-xs sm:text-sm text-[var(--text-secondary)] truncate mt-0.5">
                                Phân định trách nhiệm hai chiều: AI Robotic vs {partnerName}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                        {!isStandalone && !readOnly && (
                            <button
                                type="button"
                                onClick={() => handleSelectStationPhase('none')}
                                className="px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-xs sm:text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                                title="Bỏ gắn bảng ma trận khỏi giai đoạn này"
                            >
                                <span>Bỏ gắn khỏi giai đoạn</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Scenario Matrix Table (Reusable component) */}
                <ScenarioMatrixTable
                    event={event}
                    stations={stations}
                    users={users}
                    members={members}
                    partnerName={partnerName}
                    onOpenEditStation={(!readOnly && onUpdateStations) ? handleOpenEditStation : null}
                    onDeleteStation={(!readOnly && onUpdateStations) ? handleDeleteStation : null}
                    onPreviewPhoto={setPreviewPhoto}
                    hideTitleBar={true}
                />
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Unified 1-Row Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--bg-primary)] p-3 sm:p-3.5 rounded-2xl border border-[var(--border-color)] shadow-xs">
                {/* Left: View Mode Toggle */}
                <div className="flex items-center gap-1 bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border-color)] self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => setRoadmapMode?.('tree')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-1.5 ${roadmapMode === 'tree'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                    >
                        <IconTree className="w-3.5 h-3.5" />
                        <span>Sơ đồ Cây (Tree View)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setRoadmapMode?.('gantt')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-1.5 ${roadmapMode === 'gantt'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                            <path d="M3 3v18h18" /><rect x="7" y="6" width="6" height="3" rx="1" fill="currentColor" fillOpacity={0.2} /><rect x="11" y="11" width="8" height="3" rx="1" fill="currentColor" fillOpacity={0.2} /><rect x="9" y="16" width="5" height="3" rx="1" fill="currentColor" fillOpacity={0.2} />
                        </svg>
                        <span>Tiến độ Gantt Timeline</span>
                    </button>
                </div>

                {/* Right: Add Phase Button */}
                {!readOnly && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={handleOpenAddPhase}
                            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all shadow-xs border-none cursor-pointer"
                        >
                            <IconPlus className="w-3.5 h-3.5" />
                            <span>Thêm Giai đoạn</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Tree Roadmap Structure */}
            <div className="flex flex-col gap-6">
                {rootPhases.length === 0 ? (
                    <div className="p-12 text-center rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--bg-primary)] flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <IconLayers className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-[var(--text-primary)]">Chưa có giai đoạn nào trong lộ trình</h4>
                        <p className="text-xs text-[var(--text-secondary)] max-w-sm">
                            Hãy thêm các giai đoạn chuẩn bị hoặc chọn mẫu quy trình chuẩn để sinh tự động.
                        </p>
                        {!readOnly && (
                            <button
                                onClick={handleOpenAddPhase}
                                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold border-none cursor-pointer shadow-xs flex items-center gap-1.5"
                            >
                                <IconPlus className="w-3.5 h-3.5" />
                                <span>Thêm Giai đoạn đầu tiên</span>
                            </button>
                        )}
                    </div>
                ) : (
                    rootPhases.map((phase, pIndex) => {
                        const children = getChildrenOf(phase.id);
                        const isCollapsed = collapsedPhases[phase.id];
                        const completedCount = children.filter(c => c.status === 'completed').length;
                        const phasePercent = children.length > 0 ? Math.round((completedCount / children.length) * 100) : 0;
                        const isPhaseHoldingStations = resolvedStationPhaseId === phase.id;
                        const phaseTheme = phaseColorPalette[pIndex % phaseColorPalette.length];

                        return (
                            <div
                                key={phase.id}
                                className={`bg-[var(--bg-primary)] rounded-2xl border ${isPhaseHoldingStations ? phaseTheme.activeHoldingBorder : phaseTheme.cardBorder} shadow-xs transition-all duration-300`}
                            >
                                {/* Phase Header Card (Root Node) */}
                                <div className={`p-4 sm:p-5 ${phaseTheme.headerBg} ${!isCollapsed ? 'border-b border-[var(--border-color)] rounded-t-2xl' : 'rounded-2xl'} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => toggleCollapse(phase.id)}
                                            className="w-7 h-7 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] cursor-pointer shadow-2xs"
                                        >
                                            {isCollapsed ? <IconChevronRight className="w-3.5 h-3.5" /> : <IconChevronDown className="w-3.5 h-3.5" />}
                                        </button>
                                        <div>
                                            <div className="flex items-center gap-2.5 flex-wrap">
                                                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${phaseTheme.badge} uppercase tracking-wider`}>
                                                    Giai đoạn {pIndex + 1}
                                                </span>
                                                <h4 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                                                    {phase.name}
                                                </h4>
                                                {/* Badge if this phase holds the scenario matrix */}
                                                {isPhaseHoldingStations && stations.length > 0 && (
                                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${phaseTheme.holdingBadge} flex items-center gap-1.5 shadow-2xs`}>
                                                        <IconTable className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                                        <span>Chứa Ma trận Kịch bản ({stations.length} Trạm)</span>
                                                    </span>
                                                )}
                                            </div>
                                            {phase.description && (
                                                <p className="text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">
                                                    {phase.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Phase Progress & 3-Dots Action Menu */}
                                    <div className="flex items-center gap-3 self-end sm:self-auto">
                                        <div className="flex items-center gap-2.5 text-sm">
                                            <div className="w-24 h-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                                    style={{ width: `${phasePercent}%` }}
                                                />
                                            </div>
                                            <span className="font-bold text-[var(--text-primary)] text-sm">
                                                {completedCount}/{children.length} ({phasePercent}%)
                                            </span>
                                        </div>

                                        {/* 3-Dots Dropdown for Phase */}
                                        {!readOnly && (
                                            <div className="relative" data-dropdown-menu="true">
                                                <button
                                                    type="button"
                                                    onClick={(e) => toggleMenu(e, `phase-${phase.id}`)}
                                                    className="w-8 h-8 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors shadow-2xs"
                                                    title="Thao tác giai đoạn"
                                                >
                                                    <IconDotsVertical className="w-4 h-4" />
                                                </button>

                                                {activeMenuId === `phase-${phase.id}` && (
                                                    <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[210px] bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-xl py-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => { setActiveMenuId(null); handleOpenAddSubTask(phase.id); }}
                                                            className="w-full text-left px-3 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] flex items-center gap-2.5 transition-colors border-none bg-transparent cursor-pointer"
                                                        >
                                                            <IconPlus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                                            <span>Thêm nhiệm vụ con</span>
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => { setActiveMenuId(null); handleOpenEdit(phase); }}
                                                            className="w-full text-left px-3 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] flex items-center gap-2.5 transition-colors border-none bg-transparent cursor-pointer"
                                                        >
                                                            <IconEdit className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                                            <span>Chỉnh sửa giai đoạn</span>
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setActiveMenuId(null);
                                                                handleSelectStationPhase(isPhaseHoldingStations ? 'none' : phase.id);
                                                            }}
                                                            className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center gap-2.5 transition-colors border-none bg-transparent cursor-pointer ${isPhaseHoldingStations
                                                                    ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 font-semibold'
                                                                    : 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                                                                }`}
                                                        >
                                                            <IconTable className={`w-3.5 h-3.5 ${isPhaseHoldingStations ? 'text-amber-600' : 'text-blue-600 dark:text-blue-400'}`} />
                                                            <span>{isPhaseHoldingStations ? 'Bỏ gắn Ma trận Kịch bản khỏi đây' : 'Gắn Ma trận Kịch bản vào giai đoạn này'}</span>
                                                        </button>

                                                        <div className="my-1 border-t border-[var(--border-color)]" />

                                                        <button
                                                            type="button"
                                                            onClick={() => { setActiveMenuId(null); handleDeleteNode(phase.id); }}
                                                            className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 transition-colors border-none bg-transparent cursor-pointer"
                                                        >
                                                            <IconTrash className="w-3.5 h-3.5 text-rose-600" />
                                                            <span>Xóa giai đoạn</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Child Nodes / Tasks Branches */}
                                {!isCollapsed && (
                                    <div className="p-4 sm:p-5 flex flex-col gap-3 relative">
                                        {/* Tree vertical connector line */}
                                        <div className={`absolute left-7 top-0 bottom-6 w-0.5 ${phaseTheme.treeLine} hidden sm:block`} />

                                        {children.length === 0 ? (
                                            <div className="py-4 text-center text-xs text-[var(--text-secondary)] italic">
                                                {readOnly ? 'Chưa có nhiệm vụ cụ thể cho giai đoạn này.' : 'Chưa có nhiệm vụ con nào. Bấm 3 chấm ⋮ để "+ Thêm việc".'}
                                            </div>
                                        ) : (
                                            children.map((child) => {
                                                const sCfg = statusConfig[child.status] || statusConfig.pending;
                                                const pCfg = priorityConfig[child.priority] || priorityConfig.medium;
                                                const isOverdue = child.dueDate && new Date(child.dueDate) < new Date() && child.status !== 'completed';

                                                return (
                                                    <div
                                                        key={child.id}
                                                        className={`sm:ml-8 relative flex flex-col md:flex-row md:items-center justify-between p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] ${phaseTheme.hoverBorder} transition-all duration-200 gap-3 group`}
                                                    >
                                                        {/* Horizontal connector line on desktop */}
                                                        <div className={`absolute -left-5 top-1/2 w-5 h-0.5 ${phaseTheme.treeLine} hidden sm:block`} />

                                                        {/* Left: Status Pill + Task Details */}
                                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                                            {/* Quick status toggle button / indicator */}
                                                            {readOnly ? (
                                                                <div
                                                                    className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold border shadow-2xs flex items-center gap-1.5 shrink-0 ${sCfg.bg}`}
                                                                >
                                                                    <span className={`w-2.5 h-2.5 rounded-full ${sCfg.dot}`} />
                                                                    <span>{sCfg.label}</span>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleAdvanceStatus(child.id, child.status)}
                                                                    className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold border shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all hover:scale-102 shrink-0 ${sCfg.bg}`}
                                                                    title="Nhấn để chuyển nhanh trạng thái"
                                                                >
                                                                    <span className={`w-2.5 h-2.5 rounded-full ${sCfg.dot}`} />
                                                                    <span>{sCfg.label}</span>
                                                                </button>
                                                            )}

                                                            <div className="flex flex-col gap-1 flex-1 min-w-0">
                                                                <div className="flex items-center gap-2.5 flex-wrap">
                                                                    <span className={`text-sm sm:text-base font-bold text-[var(--text-primary)] ${child.status === 'completed' ? 'line-through opacity-60' : ''}`}>
                                                                        {child.name}
                                                                    </span>
                                                                    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${pCfg.color}`}>
                                                                        {pCfg.label}
                                                                    </span>
                                                                </div>
                                                                {child.description && (
                                                                    <p className="text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                                                                        {child.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Right: Assignee + Due Date + 3-Dots Menu */}
                                                        <div className="flex items-center gap-3 text-sm shrink-0 self-end md:self-center flex-wrap justify-end">
                                                            {/* Quick Assign Select / Badge */}
                                                            {(() => {
                                                                const assInfo = getAssigneeInfo(child.assignee);
                                                                if (readOnly) {
                                                                    return assInfo ? (
                                                                        <span className={`text-xs sm:text-sm font-semibold py-1.5 px-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] max-w-[190px] truncate ${assInfo.type === 'user' ? 'text-blue-700 dark:text-blue-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
                                                                            {assInfo.name}
                                                                        </span>
                                                                    ) : null;
                                                                }
                                                                return (
                                                                    <div className="relative flex items-center">
                                                                        <select
                                                                            value={child.assignee?._id || child.assignee?.id || child.assignee || ''}
                                                                            onChange={(e) => handleQuickAssign(child.id, e.target.value)}
                                                                            className={`text-xs sm:text-sm font-medium py-1.5 px-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[190px] truncate ${assInfo ? (assInfo.type === 'user' ? 'text-blue-700 dark:text-blue-300 font-semibold' : 'text-emerald-700 dark:text-emerald-300 font-semibold') : 'text-[var(--text-secondary)] italic'
                                                                                }`}
                                                                            title="Gán người phụ trách"
                                                                        >
                                                                            <option value="">-- Chưa gán --</option>
                                                                            {eventAssignees.length === 0 ? (
                                                                                <option disabled value="">Chưa có thành viên trong sự kiện</option>
                                                                            ) : (
                                                                                eventAssignees.map(a => (
                                                                                    <option key={a.id} value={a.id}>
                                                                                        {a.name}
                                                                                    </option>
                                                                                ))
                                                                            )}
                                                                        </select>
                                                                    </div>
                                                                );
                                                            })()}

                                                            {/* Due Date */}
                                                            {child.dueDate && (
                                                                <div className={`flex items-center gap-1.5 text-xs sm:text-sm font-medium ${isOverdue ? 'text-rose-600 font-bold' : 'text-[var(--text-secondary)]'}`}>
                                                                    <IconCalendar className="w-4 h-4" />
                                                                    <span>{formatDate(child.dueDate)}</span>
                                                                    {isOverdue && <span className="text-xs px-1.5 py-0.2 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded font-bold">Trễ</span>}
                                                                </div>
                                                            )}

                                                            {/* 3-Dots Dropdown Menu for Task Item */}
                                                            {!readOnly && (
                                                                <div className="relative" data-dropdown-menu="true">
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => toggleMenu(e, `task-${child.id}`)}
                                                                        className="w-7 h-7 rounded-lg text-gray-400 hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] border-none bg-transparent cursor-pointer flex items-center justify-center transition-colors"
                                                                        title="Thao tác nhiệm vụ"
                                                                    >
                                                                        <IconDotsVertical className="w-3.5 h-3.5" />
                                                                    </button>

                                                                    {activeMenuId === `task-${child.id}` && (
                                                                        <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-xl py-1.5">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => { setActiveMenuId(null); handleOpenEdit(child); }}
                                                                                className="w-full text-left px-3 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] flex items-center gap-2 transition-colors border-none bg-transparent cursor-pointer"
                                                                            >
                                                                                <IconEdit className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                                                                <span>Chỉnh sửa chi tiết</span>
                                                                            </button>
                                                                            <div className="my-1 border-t border-[var(--border-color)]" />
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => { setActiveMenuId(null); handleDeleteNode(child.id); }}
                                                                                className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors border-none bg-transparent cursor-pointer"
                                                                            >
                                                                                <IconTrash className="w-3.5 h-3.5 text-rose-600" />
                                                                                <span>Xóa nhiệm vụ</span>
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}

                                        {/* Scenario Matrix Table rendered under this Phase if selected */}
                                        {isPhaseHoldingStations && renderScenarioMatrixContent(false)}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}

                {/* Standalone Scenario Matrix Block (Rendered independently at bottom if user selected 'standalone') */}
                {resolvedStationPhaseId === 'standalone' && (
                    <div className="bg-[var(--bg-primary)] rounded-2xl border border-blue-300 dark:border-blue-800 overflow-hidden shadow-xs">
                        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-transparent dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-transparent border-b border-[var(--border-color)] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                                    <IconTable className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-[var(--text-primary)]">
                                        Khối Ma trận Kịch bản Thực địa ({stations.length} trạm song song)
                                    </h4>
                                    <p className="text-xs text-[var(--text-secondary)]">
                                        Bảng điều phối chi tiết song song với các giai đoạn chuẩn bị
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleSelectStationPhase('none')}
                                    className="px-2.5 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-semibold cursor-pointer transition-colors"
                                >
                                    Ẩn khối ma trận
                                </button>
                            </div>
                        </div>
                        {renderScenarioMatrixContent(true)}
                    </div>
                )}

                {/* Detached Scenario Matrix Banner if stations exist but unattached */}
                {resolvedStationPhaseId === null && stations.length > 0 && (
                    <div className="p-3.5 rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                                <IconTable className="w-4 h-4" />
                            </div>
                            <div>
                                <span className="font-bold text-[var(--text-primary)]">
                                    Ma trận Kịch bản ({stations.length} trạm) đang được tháo rời khỏi các giai đoạn
                                </span>
                                <p className="text-[11px] text-[var(--text-secondary)] m-0">
                                    Bạn có thể gắn lại vào giai đoạn bất kỳ qua menu 3 chấm ⋮ của giai đoạn đó, hoặc mở xem dạng khối độc lập bên dưới.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={() => handleSelectStationPhase('standalone')}
                                className="px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] font-semibold text-xs cursor-pointer shadow-2xs"
                            >
                                Mở dạng khối độc lập
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Unified Add / Edit Node Modal */}
            <EventModal
                isOpen={isAddModalOpen || !!editingNode}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setEditingNode(null);
                }}
                title={
                    editingNode
                        ? (editingNode.parentId ? 'Chỉnh sửa nhiệm vụ' : 'Chỉnh sửa giai đoạn chính')
                        : (addingParentId ? 'Thêm Nhiệm vụ trong Giai đoạn' : 'Thêm Giai đoạn chính (Phase)')
                }
                maxWidth="max-w-md"
                onSubmit={editingNode ? handleSaveEdit : handleSaveAdd}
                submitLabel={editingNode ? 'Lưu thay đổi' : 'Thêm vào lộ trình'}
                cancelLabel="Hủy"
            >
                <div className="flex flex-col gap-3.5">
                    <div>
                        <span className="text-xs font-semibold text-[var(--text-primary)] block mb-1">Tên mục *</span>
                        <input
                            type="text"
                            required
                            value={nodeForm.name}
                            onChange={e => setNodeForm({ ...nodeForm, name: e.target.value })}
                            placeholder={(!editingNode && addingParentId) ? "Ví dụ: Thiết kế poster và banner..." : "Ví dụ: 1. Kế hoạch & Chuẩn bị..."}
                            className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <span className="text-xs font-semibold text-[var(--text-primary)] block mb-1">Mô tả chi tiết</span>
                        <textarea
                            rows={2}
                            value={nodeForm.description}
                            onChange={e => setNodeForm({ ...nodeForm, description: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                    </div>

                    {!(editingNode ? editingNode.parentId : addingParentId) && stations.length > 0 && (
                        <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <IconTable className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                <div>
                                    <span className="text-xs font-bold text-[var(--text-primary)] block">
                                        Gắn Ma trận Kịch bản ({stations.length} trạm)
                                    </span>
                                    <span className="text-[11px] text-[var(--text-secondary)]">
                                        Hiển thị bảng ma trận kịch bản thực địa bên trong giai đoạn này
                                    </span>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={nodeForm.attachStations}
                                onChange={(e) => setNodeForm({ ...nodeForm, attachStations: e.target.checked })}
                                className="w-4 h-4 text-blue-600 rounded cursor-pointer accent-blue-600"
                            />
                        </div>
                    )}

                    {(editingNode ? editingNode.parentId : addingParentId) && (
                        <>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <span className="text-xs font-semibold text-[var(--text-primary)] block mb-1">Người phụ trách</span>
                                    <select
                                        value={nodeForm.assignee}
                                        onChange={e => setNodeForm({ ...nodeForm, assignee: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                    >
                                        <option value="">-- Chưa gán --</option>
                                        {eventAssignees.length === 0 ? (
                                            <option disabled value="">Chưa có thành viên trong sự kiện</option>
                                        ) : (
                                            eventAssignees.map(a => (
                                                <option key={a.id} value={a.id}>
                                                    {a.name}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>

                                <div>
                                    <span className="text-xs font-semibold text-[var(--text-primary)] block mb-1">Hạn hoàn thành</span>
                                    <input
                                        type="date"
                                        value={nodeForm.dueDate}
                                        onChange={e => setNodeForm({ ...nodeForm, dueDate: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <span className="text-xs font-semibold text-[var(--text-primary)] block mb-1">Độ ưu tiên</span>
                                    <select
                                        value={nodeForm.priority}
                                        onChange={e => setNodeForm({ ...nodeForm, priority: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="urgent">Khẩn cấp</option>
                                        <option value="high">Cao</option>
                                        <option value="medium">Trung bình</option>
                                        <option value="low">Thấp</option>
                                    </select>
                                </div>

                                <div>
                                    <span className="text-xs font-semibold text-[var(--text-primary)] block mb-1">Trạng thái</span>
                                    <select
                                        value={nodeForm.status}
                                        onChange={e => setNodeForm({ ...nodeForm, status: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="pending">Chưa làm</option>
                                        <option value="in_progress">Đang làm</option>
                                        <option value="completed">Hoàn thành</option>
                                        {editingNode && <option value="overdue">Trễ hạn</option>}
                                        <option value="blocked">Vướng mắc</option>
                                    </select>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </EventModal>

            {/* Modal: Add/Edit Station */}
            <AddEditStationModal
                isOpen={isStationModalOpen}
                onClose={() => {
                    setIsStationModalOpen(false);
                    setEditingStation(null);
                }}
                onSave={handleSaveStation}
                station={editingStation}
                users={users}
                members={members}
                partnerName={event?.location || event?.targetAudience || 'Địa điểm tổ chức'}
                eventId={event._id}
            />

            {/* Modal: Photo Zoom Preview Lightbox */}
            {previewPhoto && (
                <div
                    onClick={() => setPreviewPhoto(null)}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs cursor-pointer animate-in fade-in duration-150"
                >
                    <div className="max-w-3xl max-h-[85vh] flex flex-col items-center gap-3 bg-[var(--bg-primary)] p-4 rounded-2xl border border-[var(--border-color)] shadow-2xl">
                        <img
                            src={previewPhoto.src}
                            alt={previewPhoto.caption || 'Xem ảnh'}
                            className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain"
                        />
                        {previewPhoto.caption && (
                            <p className="text-sm font-semibold text-[var(--text-primary)] text-center">
                                {previewPhoto.caption}
                            </p>
                        )}
                        <button
                            onClick={() => setPreviewPhoto(null)}
                            className="px-5 py-2 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm font-semibold border border-[var(--border-color)] cursor-pointer"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
