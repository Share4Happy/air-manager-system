'use client';

import React, { useState, useCallback } from 'react';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import { Svg_Bill, Svg_Check, Svg_Pay } from "@/components/(icon)/svg";
import TextNoti from '@/components/(features)/(noti)/textnoti';
import { formatCurrencyVN, formatDate } from '@/function';
import WrapIcon from '@/components/(ui)/(button)/hoveIcon';
import CenterPopup from '@/components/(features)/(popup)/popup_center';
import Title from '@/components/(features)/(popup)/title';
import Menu from '@/components/(ui)/(button)/menu';
import Noti from '@/components/(features)/(noti)/noti';
import { getBankInfo } from '@/data/banks';
import { useRouter } from 'next/navigation';
import { student_data, invoices_data } from '@/data/actions/get';

const COMPANY = {
    name: 'CÔNG TY TNHH GIÁO DỤC AI ROBOTIC',
    taxCode: '3603893101',
    address: '1256/7, Phạm Văn Thuận, Tổ 95, Khu phố 22, Phường Tam Hiệp, Thành phố Đồng Nai, Việt Nam',
    hotline: '0943325065',
}

const PAYMENT_METHODS = { 0: 'Tiền mặt', 1: 'Chuyển khoản' }

function numberToWords(n) {
    if (!n || n === 0) return 'Không đồng'
    const ones = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín']
    const tens = ['', 'mười', 'hai mươi', 'ba mươi', 'bốn mươi', 'năm mươi', 'sáu mươi', 'bảy mươi', 'tám mươi', 'chín mươi']
    function readBlock(num) {
        const h = Math.floor(num / 100), t = Math.floor((num % 100) / 10), o = num % 10
        let s = ''
        if (h) s += ones[h] + ' trăm '
        if (t === 0 && h && o) s += 'lẻ '
        else if (t) s += tens[t] + ' '
        if (o) {
            if (t > 1 && o === 1) s += 'mốt '
            else if (t > 0 && o === 5) s += 'lăm '
            else s += ones[o] + ' '
        }
        return s.trim()
    }
    const billion = Math.floor(n / 1e9)
    const million = Math.floor((n % 1e9) / 1e6)
    const thousand = Math.floor((n % 1e6) / 1e3)
    const remainder = n % 1e3
    let result = ''
    if (billion) result += readBlock(billion) + ' tỷ '
    if (million) result += readBlock(million) + ' triệu '
    if (thousand) result += readBlock(thousand) + ' nghìn '
    if (remainder) result += readBlock(remainder)
    const text = (result.trim() || 'không') + ' đồng'
    return text.charAt(0).toUpperCase() + text.slice(1)
}

const promotionsData = [
    { description: "Không áp dụng", value: 0 },
    { description: "Giảm giá khai trương", value: 10 },
    { description: "Học sinh cũ", value: 15 },
    { description: "Hè 2025", value: 25 },
]

const PopupContent = React.memo(({ data, onStartInvoice, onDetailClick }) => {
    const tuition = data?.Course?.filter(course => course.tuition === null) || [];
    const tuitiondone = data?.Course?.filter(course => course.tuition !== null) || [];
    const debts = data?.debts || [];
    return (
        <div className="flex flex-col gap-3 p-3 sm:p-4">
            <TextNoti title={'Học phí'} mes='Phần xác nhận học phí và xem lịch sử học phí của 1 học sinh liên quan tới các khóa học mà học sinh đã tham gia.' color={'blue'} />
            
            <div className="border border-[var(--main_d)] rounded-md overflow-hidden bg-white">
                <p className='text-sm sm:text-base font-semibold text-white px-3 py-2 bg-[var(--main_d)]'>Thông tin nợ học phí</p>
                {tuition.length > 0 || debts.length > 0 ? (
                    <div className="divide-y divide-[var(--border-color)]">
                        {tuition.map((course, index) => (
                            <div key={index} className='text-xs sm:text-sm text-[var(--text-primary)] px-3 py-2.5 flex items-center justify-between gap-2'>
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium truncate">Khóa học: {course.ID}</p>
                                    <p className="text-[var(--text-secondary)] text-xs">{formatCurrencyVN(course.Book?.Price || 0)}</p>
                                </div>
                                <WrapIcon icon={<Svg_Check w={16} h={16} c={'white'} />} content={'Tạo hóa đơn'} placement={'left'} style={{ background: 'var(--main_d)', color: 'white', cursor: 'pointer', flexShrink: 0 }} click={() => onStartInvoice(course)} />
                            </div>
                        ))}
                        {debts.map((d, index) => (
                            <div key={'debt-' + index} className='text-xs sm:text-sm text-[var(--text-primary)] px-3 py-2.5 flex items-center justify-between gap-2'>
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium truncate">{d.courseName || 'Khoản nợ'} {d.note ? `(${d.note})` : ''}</p>
                                    <p className="text-[var(--text-secondary)] text-xs">{formatCurrencyVN(d.amount || 0)}</p>
                                </div>
                                <WrapIcon icon={<Svg_Check w={16} h={16} c={'white'} />} content={'Tạo hóa đơn'} placement={'left'} style={{ background: 'var(--main_d)', color: 'white', cursor: 'pointer', flexShrink: 0 }} click={() => onStartInvoice({ _id: d._id, ID: d.courseName || 'Khoản nợ', Book: { Price: d.amount || 0 }, tuition: null })} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className='text-xs sm:text-sm text-[var(--text-secondary)] p-3 text-center italic'>Không có thông tin nợ học phí</p>
                )}
            </div>

            <TextNoti title={'Lịch sử'} mes='Lịch sử giao dịch sẽ được phép xem lại các hóa đơn đã thanh toán trước đó.' color={'blue'} />
            
            <div className="border border-[var(--main_d)] rounded-md overflow-hidden bg-white">
                <p className='text-sm sm:text-base font-semibold text-white px-3 py-2 bg-[var(--main_d)]'>Lịch sử đóng học phí</p>
                {tuitiondone.length > 0 ? (
                    <div className="divide-y divide-[var(--border-color)]">
                        {tuitiondone.map((course, index) => (
                            <div key={index} className='text-xs sm:text-sm text-[var(--text-primary)] px-3 py-2.5 flex items-center justify-between gap-2'>
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium truncate">Khóa học: {course.ID}</p>
                                    <p className="text-[var(--text-secondary)] text-xs">{formatCurrencyVN(course.Book?.Price || 0)}</p>
                                </div>
                                <WrapIcon icon={<Svg_Bill w={16} h={16} c={'white'} />} content={'Chi tiết giao dịch'} placement={'left'} style={{ background: 'var(--main_d)', color: 'white', cursor: 'pointer', flexShrink: 0 }} click={() => onDetailClick(course)} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className='text-xs sm:text-sm text-[var(--text-secondary)] p-3 text-center italic'>Không có lịch sử đóng học phí</p>
                )}
            </div>
        </div>
    );
});
PopupContent.displayName = 'PopupContent';

export default function Pay({ _id, courseId = null, status = false }) {
    const router = useRouter();
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [isConfirmOpen, setConfirmOpen] = useState(false);
    const [isQrOpen, setQrOpen] = useState(false);
    const [isDetailOpen, setDetailOpen] = useState(false);
    const [studentData, setStudentData] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [amount, setAmount] = useState(0);
    const [promotion, setPromotion] = useState(promotionsData[0]);
    const [qrInfo, setQrInfo] = useState(null);
    const [invoiceState, setInvoiceState] = useState({ isLoading: false, data: null, error: null });
    const [noti, setNoti] = useState({ open: false, status: false, mes: '' });
    const [isPaymentConfirmOpen, setPaymentConfirmOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [banks, setBanks] = useState([]);
    const [selectedBankId, setSelectedBankId] = useState(null);

    const handleFetchStudentData = useCallback(async () => {
        if (!_id) throw new Error("ID học sinh không hợp lệ.");
        const data = await student_data(_id);
        let finalData = (Array.isArray(data) && data.length > 0) ? data[0] : data;
        if (courseId && finalData?.Course) {
            finalData.Course = finalData.Course.filter(c => c._id === courseId);
        }
        try {
            const res = await fetch('/api/debt');
            const json = await res.json();
            if (json.data) {
                finalData.debts = json.data.filter(d => String(d.studentId) === String(_id));
            }
        } catch {
            finalData.debts = [];
        }
        setStudentData(finalData);
        return finalData;
    }, [_id, courseId]);

    const handleOpenPopup = () => setIsPopupOpen(true);
    const handleClosePopup = useCallback(() => {
        setIsPopupOpen(false);
        setStudentData(null);
    }, []);

    const handleStartInvoice = useCallback((course) => {
        setSelectedCourse(course);
        setAmount(course.Book?.Price || 0);
        setPromotion(promotionsData[0]);
        setConfirmOpen(true);
    }, []);

    const handleCloseConfirm = useCallback(() => {
        setConfirmOpen(false);
        setSelectedCourse(null);
    }, []);

    const finalAmount = Math.round(amount - amount * promotion.value / 100)

    const handlePayCash = useCallback(async () => {
        if (!studentData || !selectedCourse) return;
        setPendingAction('cash');
        setPaymentConfirmOpen(true);
    }, [studentData, selectedCourse]);

    const executePayCash = useCallback(async () => {
        if (!studentData || !selectedCourse) return;
        setPaymentConfirmOpen(false);
        try {
            const response = await fetch('/api/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: studentData._id,
                    courseId: selectedCourse._id,
                    amountInitial: amount,
                    amountPaid: finalAmount,
                    paymentMethod: 0,
                    discount: promotion.value,
                }),
            });
            const result = await response.json();
            if (result.status === 2) {
                handleCloseConfirm();
                handleClosePopup();
                setNoti({ open: true, status: true, mes: result.mes });
                router.refresh();
            } else {
                setNoti({ open: true, status: false, mes: result.mes || 'Tạo hóa đơn thất bại' });
            }
        } catch {
            setNoti({ open: true, status: false, mes: 'Không thể kết nối đến máy chủ.' });
        }
    }, [studentData, selectedCourse, amount, finalAmount, promotion, router, handleCloseConfirm, handleClosePopup]);

    const handlePayQr = useCallback(async () => {
        if (!studentData || !selectedCourse) return;
        try {
            const bankRes = await fetch('/api/bank');
            const bankJson = await bankRes.json();
            const bankList = bankJson.status ? (bankJson.data || []) : [];
            const defaultBank = bankList.find(b => b.isDefault === true);
            if (!defaultBank) {
                setNoti({ 
                    open: true, 
                    status: false, 
                    mes: 'Chưa có tài khoản ngân hàng nào được thiết lập mặc định. Vui lòng cài đặt tài khoản ngân hàng mặc định trong phần Quản lý ngân hàng trước khi thanh toán chuyển khoản.' 
                });
                return;
            }
            setBanks(bankList);
            setSelectedBankId(defaultBank._id);
            const response = await fetch('/api/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: studentData._id,
                    courseId: selectedCourse._id,
                    amountInitial: amount,
                    amountPaid: finalAmount,
                    paymentMethod: 1,
                    discount: promotion.value,
                }),
            });
            const result = await response.json();
            if (result.status === 2) {
                const invoice = result.data?.[0];
                const invoiceIdShort = invoice?._id ? invoice._id.slice(-8).toUpperCase() : '';
                const content = `Hoc phi ${studentData.ID} ${selectedCourse.ID} HD${invoiceIdShort}`;
                setQrInfo({
                    amount: finalAmount,
                    content,
                    studentId: studentData.ID,
                    studentName: studentData.Name,
                    studentPhone: studentData.Phone || '',
                    courseName: selectedCourse.ID,
                    courseBook: selectedCourse.Book?.Name || '',
                    invoiceId: invoice?._id || '',
                });
                handleCloseConfirm();
                handleClosePopup();
                setQrOpen(true);
                router.refresh();
            } else {
                setNoti({ open: true, status: false, mes: result.mes || 'Tạo hóa đơn thất bại' });
            }
        } catch {
            setNoti({ open: true, status: false, mes: 'Không thể kết nối đến máy chủ.' });
        }
    }, [studentData, selectedCourse, amount, finalAmount, promotion, router, handleCloseConfirm, handleClosePopup]);

    const handleOpenDetail = useCallback(async (courseData) => {
        const invoiceId = courseData?.tuition;
        setDetailOpen(true);
        if (!invoiceId) {
            setInvoiceState({ isLoading: false, data: null, error: "Dữ liệu hóa đơn không hợp lệ." });
            return;
        }
        setInvoiceState({ isLoading: true, data: null, error: null });
        try {
            const response = await invoices_data(invoiceId);
            setInvoiceState({ isLoading: false, data: response, error: null });
        } catch {
            setInvoiceState({ isLoading: false, data: null, error: "Lỗi kết nối máy chủ." });
        }
    }, []);

    const handleCloseDetail = () => setDetailOpen(false);
    const [popupFlag, setPopupFlag] = useState(0);

    const handleConfirmPayment = useCallback(async () => {
        setPendingAction('confirm');
        setQrOpen(false);
        setPaymentConfirmOpen(true);
    }, []);

    const executeConfirmPayment = useCallback(async () => {
        setPaymentConfirmOpen(false);
        handleCloseQr();
        handleClosePopup();
        setNoti({ open: true, status: true, mes: 'Đã xác nhận thanh toán thành công.' });
        setTimeout(() => {
            setIsPopupOpen(true);
            setPopupFlag(f => f + 1);
        }, 350);
        router.refresh();
    }, [router, handleClosePopup]);

    const handleCloseQr = useCallback(() => { setQrOpen(false); setQrInfo(null); }, []);
    const handleCloseNoti = useCallback(() => setNoti(prev => ({ ...prev, open: false })), []);

    const promotionItems = (
        <div className="bg-[var(--bg-primary)] overflow-hidden shadow-[var(--boxshaw2)] rounded-lg">
            {promotionsData.map((p, i) => (
                <div key={i} className="px-[15px] py-2.5 cursor-pointer border-b border-[var(--border-color)] bg-white flex items-center gap-2 hover:bg-[var(--hover)] last:border-b-0" onClick={() => setPromotion(p)}>
                    <p className='text-sm font-normal text-[var(--text-primary)]'>{p.description}</p>
                    <p className='text-sm font-normal text-[var(--text-primary)]'>Giảm: {p.value}%</p>
                </div>
            ))}
        </div>
    );

    const customPromotionBtn = (
        <div className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-full rounded text-white text-xs sm:text-sm font-medium cursor-pointer border-none transition-all duration-100 justify-center whitespace-nowrap hover:bg-[var(--main_d)]' style={{ background: 'var(--hover)', margin: 0 }}>
            <p className='text-xs sm:text-sm font-normal text-[var(--text-primary)] truncate'>{promotion.description} ({promotion.value}%)</p>
        </div>
    );

    return (
        <>
            <div onClick={handleOpenPopup} className="p-1.5 rounded flex items-center justify-center transition-all duration-100 hover:-translate-y-0.5" style={{ background: status ? 'var(--green)' : 'var(--red)', cursor: 'pointer', display: 'inline-flex' }} role="button">
                <Svg_Pay w={16} h={16} c={'white'} />
            </div>

            <FlexiblePopup key={popupFlag} open={isPopupOpen} onClose={handleClosePopup} title="Học phí" width={500} fetchData={handleFetchStudentData} renderItemList={(data) => (data ? <PopupContent data={data} onStartInvoice={handleStartInvoice} onDetailClick={handleOpenDetail} /> : null)} />

            <CenterPopup open={isConfirmOpen} onClose={handleCloseConfirm} size="md">
                {selectedCourse && studentData && (
                    <>
                        <Title content='Tạo hóa đơn' click={handleCloseConfirm} />
                        <div className="flex flex-col gap-3 p-3 sm:p-4 max-h-[calc(90vh-120px)] overflow-y-auto">
                            <div>
                                <p className='text-xs sm:text-sm font-semibold text-white px-2.5 py-1.5 bg-[var(--main_b)] rounded'>Thông tin học sinh</p>
                                <div className="flex flex-col gap-1 p-2 text-xs sm:text-sm break-words">
                                    <p><span className='font-semibold'>ID:</span> {studentData.ID}</p>
                                    <p><span className='font-semibold'>Họ tên:</span> {studentData.Name}</p>
                                    <p><span className='font-semibold'>Liên hệ:</span> {studentData.Phone || '—'}</p>
                                </div>
                            </div>

                            <div>
                                <p className='text-xs sm:text-sm font-semibold text-white px-2.5 py-1.5 bg-[var(--main_b)] rounded'>Thông tin khóa học</p>
                                <div className="flex flex-col gap-1 p-2 text-xs sm:text-sm break-words">
                                    <p><span className='font-semibold'>Khóa học:</span> {selectedCourse.ID}</p>
                                    <p><span className='font-semibold'>Chương trình:</span> {selectedCourse.Book?.Name || '—'}</p>
                                </div>
                            </div>

                            <div>
                                <p className='text-xs sm:text-sm font-semibold text-white px-2.5 py-1.5 bg-[var(--main_b)] rounded'>Thông tin thanh toán</p>
                                <div className="flex flex-col gap-2.5 p-2 text-xs sm:text-sm">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                        <span className='font-semibold sm:w-24 shrink-0'>Số tiền:</span>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={e => setAmount(Number(e.target.value) || 0)}
                                            className="w-full sm:flex-1 px-3 py-1.5 border border-gray-200 rounded text-xs sm:text-sm outline-none text-gray-700 bg-white"
                                        />
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                        <span className='font-semibold sm:w-24 shrink-0'>Giảm giá:</span>
                                        <div className="w-full sm:flex-1 min-w-0">
                                            <Menu menuItems={promotionItems} customButton={customPromotionBtn} menuPosition="top" />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-start gap-2 pt-1 border-t border-gray-100">
                                        <span className='font-semibold sm:w-24 shrink-0'>Thành tiền:</span>
                                        <span className="text-base sm:text-lg font-bold text-[var(--red)]">{formatCurrencyVN(finalAmount)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 p-3 sm:p-4 border-t border-[var(--border-color)] bg-[var(--bg-primary)]">
                            <button className='flex-1 px-3 py-2 bg-[var(--main_b)] flex items-center justify-center gap-2 rounded text-white text-xs sm:text-sm font-medium cursor-pointer hover:bg-[var(--main_d)] border-none' onClick={handlePayCash}>
                                💵 Tiền mặt
                            </button>
                            <button className='flex-1 px-3 py-2 bg-[var(--main_b)] flex items-center justify-center gap-2 rounded text-white text-xs sm:text-sm font-medium cursor-pointer hover:bg-[var(--main_d)] border-none' onClick={handlePayQr}>
                                📱 QR Chuyển khoản
                            </button>
                        </div>
                    </>
                )}
            </CenterPopup>

            <CenterPopup open={isPaymentConfirmOpen} onClose={() => setPaymentConfirmOpen(false)} size="sm">
                <div className="p-5 sm:p-8 text-center break-words">
                    <p className="text-base font-semibold mb-4 text-[var(--text-primary)]">Xác nhận thanh toán</p>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-6">
                        {pendingAction === 'cash'
                            ? `Thu ${formatCurrencyVN(finalAmount)} của học sinh ${studentData?.Name || ''}?`
                            : 'Xác nhận đã nhận được tiền chuyển khoản?'}
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button
                            className='px-4 py-2 border border-[var(--border-color)] rounded text-xs sm:text-sm font-medium cursor-pointer hover:bg-gray-50 bg-white'
                            onClick={() => setPaymentConfirmOpen(false)}
                        >
                            Hủy
                        </button>
                        <button
                            className='px-4 py-2 bg-[var(--main_b)] rounded text-xs sm:text-sm font-medium text-white cursor-pointer hover:bg-[var(--main_d)] border-none'
                            onClick={() => {
                                if (pendingAction === 'cash') executePayCash()
                                else if (pendingAction === 'confirm') executeConfirmPayment()
                            }}
                        >
                            Xác nhận
                        </button>
                    </div>
                </div>
            </CenterPopup>

            <CenterPopup open={isQrOpen} onClose={handleCloseQr} size="md">
                {qrInfo && (() => {
                    const selectedBank = banks.find(b => b._id === selectedBankId) || banks[0]
                    const qrUrl = selectedBank
                        ? `https://img.vietqr.io/image/${selectedBank.bankName}-${selectedBank.accountNumber}-compact2.png?${new URLSearchParams({ amount: String(qrInfo.amount), addInfo: qrInfo.content, accountName: selectedBank.accountName }).toString()}`
                        : ''
                    return (
                        <>
                            <Title content='Quét mã QR để thanh toán' click={handleCloseQr} />
                            <div className="flex flex-col gap-3 sm:gap-4 p-3 sm:p-5 items-center max-h-[calc(90vh-80px)] overflow-y-auto w-full">
                                {banks.length > 0 && (
                                    <div className="w-full flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                                        <span className='text-xs sm:text-sm text-[var(--text-secondary)] shrink-0'>Tài khoản:</span>
                                        <select
                                            className="w-full sm:flex-1 p-2 border border-[var(--border-color)] rounded-md text-xs sm:text-sm outline-none bg-white text-[var(--text-primary)]"
                                            value={selectedBankId || ''}
                                            onChange={e => setSelectedBankId(e.target.value)}
                                        >
                                            {banks.map(b => {
                                                const info = getBankInfo(b.bankName)
                                                return (
                                                    <option key={b._id} value={b._id}>{info.name} - {b.accountNumber} {b.isDefault ? '(Mặc định)' : ''}</option>
                                                )
                                            })}
                                        </select>
                                    </div>
                                )}
                                {qrUrl && (
                                    <div className="w-[200px] h-[200px] sm:w-[240px] sm:h-[240px] bg-white rounded-lg border border-[var(--border-color)] p-2 shadow-sm shrink-0">
                                        <img
                                            src={qrUrl}
                                            alt="Mã QR chuyển khoản"
                                            className="w-full h-full object-contain block"
                                        />
                                    </div>
                                )}
                                {selectedBank && (
                                    <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 text-xs sm:text-sm leading-relaxed text-blue-900 break-words">
                                        <p>Ngân hàng: <span className="font-semibold">{getBankInfo(selectedBank.bankName).name}</span></p>
                                        <p>Số TK: <span className="font-semibold">{selectedBank.accountNumber}</span></p>
                                        <p>Chủ TK: <span className="font-semibold">{selectedBank.accountName}</span></p>
                                        <div className="border-t border-blue-200 mt-2 pt-2 text-center">
                                            <p className="text-[11px] sm:text-xs text-blue-700 mb-1">Nội dung chuyển khoản</p>
                                            <p className="font-bold text-xs sm:text-sm tracking-wide break-all text-blue-950 bg-blue-100/70 p-1.5 rounded select-all">{qrInfo.content}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="w-full bg-gray-50 border border-gray-100 rounded-lg p-3 text-xs sm:text-sm leading-relaxed text-gray-700 break-words">
                                    <p className='font-semibold text-sm sm:text-base text-gray-900'>{qrInfo.studentName}</p>
                                    <p className='text-[var(--text-secondary)]'>Mã HS: <span className='font-medium text-[var(--text-primary)]'>{qrInfo.studentId}</span></p>
                                    <p className='text-[var(--text-secondary)]'>Khóa học: <span className='font-medium text-[var(--text-primary)]'>{qrInfo.courseName}</span></p>
                                    <p className='text-[var(--text-secondary)]'>Mã HĐ: <span className='font-medium text-[var(--text-primary)]'>{qrInfo.invoiceId.slice(-8).toUpperCase()}</span></p>
                                </div>
                                <div className="text-center w-full">
                                    <p className='text-xs text-[var(--text-secondary)] mb-0.5'>Thành tiền</p>
                                    <p className="text-lg sm:text-2xl font-extrabold text-[var(--red)]">{formatCurrencyVN(qrInfo.amount)}</p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
                                    <button
                                        className='flex-1 px-3 py-2.5 bg-[var(--green)] flex items-center justify-center gap-2 rounded-lg text-white text-xs sm:text-sm font-medium cursor-pointer hover:opacity-90 border-none'
                                        onClick={handleConfirmPayment}
                                    >
                                        Xác nhận đã thanh toán
                                    </button>
                                    <button
                                        className='px-4 py-2.5 bg-[var(--hover)] flex items-center justify-center gap-2 rounded-lg text-[var(--text-primary)] text-xs sm:text-sm font-medium cursor-pointer hover:opacity-90 border-none'
                                        onClick={handleCloseQr}
                                    >
                                        Đóng
                                    </button>
                                </div>
                            </div>
                        </>
                    )
                })()}
            </CenterPopup>

            <CenterPopup open={isDetailOpen} onClose={handleCloseDetail} size="lg">
                {invoiceState.isLoading ? (
                    <div className="h-64 sm:h-96 flex items-center justify-center">
                        <p className='text-xs sm:text-sm text-[var(--text-secondary)]'>Đang tải...</p>
                    </div>
                ) : invoiceState.error ? (
                    <>
                        <Title content='Lỗi' click={handleCloseDetail} />
                        <div className="p-6 sm:p-8 text-center">
                            <p className='text-xs sm:text-sm font-medium text-[var(--red)]'>{invoiceState.error}</p>
                        </div>
                    </>
                ) : invoiceState.data ? (
                    (() => {
                        const inv = invoiceState.data
                        const date = inv.createdAt ? formatDate(new Date(inv.createdAt)) : '—'
                        const sessions = inv.courseId?.Detail?.length || 0
                        const discountAmount = Math.round((inv.amountInitial || 0) * (inv.discount || 0) / 100)
                        return (
                            <>
                                <Title content='Hóa đơn thanh toán' click={handleCloseDetail} />
                                <div className="p-3 sm:p-6 md:p-8 text-xs sm:text-sm leading-relaxed max-h-[calc(90vh-80px)] overflow-y-auto">
                                    {/* Header */}
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pb-3 sm:pb-4 border-b-2 border-[var(--main_d)]">
                                        <div className="flex items-center gap-3">
                                            <div className="text-2xl sm:text-3xl font-extrabold tracking-wider shrink-0">
                                                <span className="text-black">AI</span>
                                                <span className="text-blue-600"> ROBOTIC</span>
                                            </div>
                                            <div className="border-l-2 border-[var(--border-color)] pl-3 min-w-0">
                                                <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] font-medium leading-tight">CÔNG TY TNHH GIÁO DỤC AI ROBOTIC</p>
                                                <p className="text-[11px] sm:text-xs text-blue-600 italic font-medium mt-0.5">"Learn AI - Grasp your future"</p>
                                            </div>
                                        </div>
                                        <div className="text-left sm:text-right text-xs text-[var(--text-secondary)] shrink-0">
                                            <p>MST: <span className='font-semibold text-[var(--text-primary)]'>{COMPANY.taxCode}</span></p>
                                        </div>
                                    </div>

                                    {/* Address */}
                                    <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] pt-2 pb-3 sm:pb-4 break-words">Địa chỉ: {COMPANY.address}</p>

                                    {/* Title */}
                                    <h2 className="text-center text-xl sm:text-2xl md:text-3xl font-extrabold my-3 sm:my-4 text-[var(--text-primary)] tracking-wide">HÓA ĐƠN THANH TOÁN</h2>
                                    <p className="text-center text-xs text-[var(--text-secondary)] mb-4 sm:mb-6 break-words">Mã HĐ: {inv._id.slice(-12).toUpperCase()}  |  Ngày: {date}</p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                                        {/* Student & Course Info */}
                                        <div className="border border-[var(--border-color)] rounded-lg overflow-hidden flex flex-col bg-white">
                                            <div className="px-3.5 py-2 bg-[var(--main_d)] text-white font-semibold text-xs sm:text-sm">
                                                📋 THÔNG TIN HỌC SINH & KHÓA HỌC
                                            </div>
                                            <div className="p-3.5 sm:p-4 text-xs sm:text-sm space-y-2 flex-1 break-words">
                                                <p className="flex justify-between gap-2"><span className="text-[var(--text-secondary)] shrink-0">Họ tên:</span> <span className="font-semibold text-right">{inv.studentId?.Name || '—'}</span></p>
                                                <p className="flex justify-between gap-2"><span className="text-[var(--text-secondary)] shrink-0">Mã HS:</span> <span className="font-semibold text-right">{inv.studentId?.ID || '—'}</span></p>
                                                <p className="flex justify-between gap-2"><span className="text-[var(--text-secondary)] shrink-0">Khóa học:</span> <span className="font-semibold text-right">{inv.courseId?.ID || '—'}</span></p>
                                                <p className="flex justify-between gap-2"><span className="text-[var(--text-secondary)] shrink-0">Chương trình:</span> <span className="font-semibold text-right">{inv.courseId?.Book?.Name || '—'}</span></p>
                                                <p className="flex justify-between gap-2"><span className="text-[var(--text-secondary)] shrink-0">Số buổi học:</span> <span className="font-semibold text-right">{sessions} buổi</span></p>
                                            </div>
                                        </div>

                                        {/* Payment Content */}
                                        <div className="border border-[var(--border-color)] rounded-lg overflow-hidden flex flex-col bg-white">
                                            <div className="px-3.5 py-2 bg-[var(--main_d)] text-white font-semibold text-xs sm:text-sm">
                                                💳 NỘI DUNG THANH TOÁN
                                            </div>
                                            <div className="flex flex-col flex-1">
                                                <div className="p-3.5 sm:p-4 space-y-2 text-xs sm:text-sm">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <span className="text-gray-700 break-words flex-1">Học phí khóa học {inv.courseId?.ID || ''}</span>
                                                        <span className="font-medium text-right shrink-0 whitespace-nowrap">{formatCurrencyVN(inv.amountInitial || 0)}</span>
                                                    </div>
                                                    {inv.discount > 0 && (
                                                        <div className="flex justify-between items-center gap-2 text-green-600">
                                                            <span>Giảm giá ({inv.discount}%)</span>
                                                            <span className="font-medium text-right shrink-0 whitespace-nowrap">-{formatCurrencyVN(discountAmount)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mt-auto">
                                                    <div className="px-3.5 py-2.5 border-t-2 border-[var(--main_d)] bg-gray-50 flex justify-between items-center font-bold text-sm sm:text-base">
                                                        <span>TỔNG CỘNG</span>
                                                        <span className="text-[var(--red)] text-base sm:text-lg">{formatCurrencyVN(inv.amountPaid || 0)}</span>
                                                    </div>
                                                    <div className="px-3.5 py-2 border-t border-[var(--border-color)] text-xs text-[var(--text-secondary)] italic break-words">
                                                        Bằng chữ: <span className="font-medium text-[var(--text-primary)] not-italic">{numberToWords(inv.amountPaid || 0)}</span>
                                                    </div>
                                                    <div className="px-3.5 py-2 border-t border-[var(--border-color)] text-xs sm:text-sm bg-blue-50/60 flex justify-between items-center">
                                                        <span>💳 Hình thức:</span>
                                                        <span className="font-semibold text-blue-900">{PAYMENT_METHODS[inv.paymentMethod] || '—'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="border-t border-[var(--border-color)] pt-3 sm:pt-4 text-center text-xs text-[var(--text-secondary)] space-y-1">
                                        <p className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">CÔNG TY TNHH GIÁO DỤC AI ROBOTIC</p>
                                        <p>Hotline: <span className="font-semibold text-[var(--main_d)]">{COMPANY.hotline}</span></p>
                                        <p className="font-medium italic text-blue-600 pt-1">Trân trọng cảm ơn Quý phụ huynh đã tin tưởng đồng hành cùng AI ROBOTIC!</p>
                                    </div>
                                </div>
                            </>
                        )
                    })()
                ) : (
                    <>
                        <Title content='Thông báo' click={handleCloseDetail} />
                        <div className="p-6 sm:p-8 text-center">
                            <p className='text-xs sm:text-sm text-[var(--text-secondary)]'>Không có dữ liệu.</p>
                        </div>
                    </>
                )}
            </CenterPopup>

            <Noti open={noti.open} onClose={handleCloseNoti} status={noti.status} mes={noti.mes} button={
                <div className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-xs sm:text-sm font-medium cursor-pointer justify-center hover:bg-[var(--main_d)]' onClick={handleCloseNoti} style={{ width: 'calc(100% - 24px)', justifyContent: 'center' }}>
                    <p className='text-xs sm:text-sm font-normal text-white'>Tắt thông báo</p>
                </div>
            } />
        </>
    );
}
