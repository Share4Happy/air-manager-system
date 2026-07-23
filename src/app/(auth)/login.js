'use client';

import Login_form from "@/components/(layout)/login";
import Image from "next/image";

export default function Layout_Login() {
  return (
    <div className="w-full h-screen flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: '#E0E8F0' }}>
      {/* Decorative circles */}
      <div aria-hidden="true" className="absolute w-[180px] h-[180px] rounded-full border-[30px] border-[#08A9DF]/20 top-[8%] left-[12%] pointer-events-none" />
      <div aria-hidden="true" className="absolute w-[320px] h-[320px] rounded-full border-[40px] border-[#08A9DF]/15 bottom-[5%] right-[8%] pointer-events-none" />
      <div aria-hidden="true" className="absolute top-[15%] right-[18%] w-[120px] h-[120px] pointer-events-none">
        <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 60 Q30 20 60 40 Q90 60 110 30" stroke="#08A9DF" strokeWidth="2" strokeDasharray="6 4" fill="none" opacity="0.2" />
        </svg>
      </div>

      {/* Login card */}
      <div className="flex bg-white rounded-[16px] shadow-[0_8px_50px_rgba(0,0,0,0.15)] overflow-hidden relative z-10"
        style={{ width: 'min(92vw, 1400px)', height: '780px', maxHeight: '94vh' }}>
        
        {/* Left column — image */}
        <div className="hidden md:flex w-1/2 h-full relative shrink-0">
          <Image
            src="/images/banner_wellcome.png"
            alt="Welcome banner"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-transparent" />
        </div>

        {/* Right column — form */}
        <div className="w-full md:w-1/2 h-full flex flex-col">
          <Login_form />
        </div>
      </div>
    </div>
  )
}
