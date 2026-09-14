'use client';

export default function Noti({ open, onClose, status, mes, button }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
      <div
        className="bg-[var(--bg-secondary)] p-4 sm:p-6 w-full max-w-[360px] sm:max-w-[400px] rounded-xl shadow-2xl z-10 relative flex flex-col items-center min-w-0 break-words"
        onClick={e => e.stopPropagation()}
      >
        <h4 className="font-bold text-base sm:text-lg mb-1 text-center" style={{ color: status ? 'var(--green)' : 'var(--red)' }}>
          {status ? 'THÀNH CÔNG' : 'THẤT BẠI'}
        </h4>
        <div className="flex justify-center my-3 shrink-0">
          {status ? <IconSuccess /> : <IconFailure />}
        </div>
        <div className="px-2 pb-3 text-center text-xs sm:text-sm text-[var(--text-primary)] break-words leading-relaxed w-full min-w-0">
          {mes}
        </div>
        <div className="w-full mt-2 flex justify-center min-w-0">{button}</div>
      </div>
    </div>
  );
}

function IconSuccess() {
  return (
    <div className="w-20 h-20 mx-auto mb-2 relative flex items-center justify-center">
      <svg className="w-full h-full" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="25" fill="none" stroke="#28a745" strokeWidth="5" strokeLinecap="round" />
        <path d="M22 32 l7 7 l13 -13" fill="none" stroke="#28a745" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

function IconFailure() {
  return (
    <div className="w-20 h-20 mx-auto mb-2 relative flex items-center justify-center">
      <svg className="w-full h-full" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="25" fill="none" stroke="#dc3545" strokeWidth="5" strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute w-[3px] h-[22px] bg-[#dc3545] rotate-45" />
          <div className="absolute w-[3px] h-[22px] bg-[#dc3545] -rotate-45" />
        </div>
      </div>
    </div>
  );
};
