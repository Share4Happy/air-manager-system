'use client'
import { useState } from 'react';
import { Svg_Eye, Svg_unEye, Svg_Facebook, Svg_Website, Svg_Envelope, Svg_Lock, Svg_CitySkyline } from '@/components/(icon)/svg';

const isValidEmail = (email) => { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); };

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setloading] = useState(false)
  const [error, setError] = useState('')
  const emailIsValid = isValidEmail(username);
  const passwordIsNotEmpty = password.trim() !== '';
  const isFormValid = emailIsValid && passwordIsNotEmpty;
  const handleSubmit = async () => {
    setloading(true)
    setError('')
    try {
      const data = { email: username, password, re: rememberMe };
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.mes || 'Đăng nhập thất bại');
      }
      const result = await response.json();
      window.location.reload()
    } catch (err) {
      setError(err.message)
    }
    setloading(false)
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && isFormValid && !loading) handleSubmit();
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-[48px] md:px-[56px] relative">
      <div className="w-full max-w-[440px]">
        {/* Title */}
        <div className="text-center mb-8 overflow-hidden">
          <p style={{ fontSize: '42px', fontWeight: 900, lineHeight: 1.2, letterSpacing: '0.05em' }}>
            <span className="text-[#111827]">AI</span>{' '}
            <span style={{ color: '#08A9DF' }}>ROBOTIC</span>{' '}
            <span className="text-[#111827]">SYSTEM</span>
          </p>
        </div>

        {/* Email */}
        <div className="mb-[22px]">
          <label className="block text-[14px] font-medium text-[#08A9DF] mb-1.5">Email</label>
          <div className="flex items-center border border-[#67CFF2] rounded-[8px] bg-white px-4"
            style={{ height: '52px' }}>
            <Svg_Envelope w={20} h={20} c={'#9CA3AF'} />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="travel@gmail.com"
              className="flex-1 border-none outline-none text-[15px] text-[#111827] bg-transparent ml-3 h-full"
            />
          </div>
        </div>

        {/* Password */}
        <div className="mb-[8px]">
          <label className="block text-[14px] font-medium text-[#08A9DF] mb-1.5">Password</label>
          <div className="flex items-center border border-[#67CFF2] rounded-[8px] bg-white px-4"
            style={{ height: '52px' }}>
            <Svg_Lock w={20} h={20} c={'#9CA3AF'} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="••••••••"
              className="flex-1 border-none outline-none text-[15px] text-[#111827] bg-transparent ml-3 h-full"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-2"
              tabIndex={-1}
            >
              {showPassword ? <Svg_unEye w={20} h={20} c={'#9CA3AF'} /> : <Svg_Eye w={20} h={20} c={'#9CA3AF'} />}
            </button>
          </div>
        </div>

        {/* Forgot password */}
        <div className="flex items-center justify-between mb-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 border border-gray-300 rounded cursor-pointer accent-[#08A9DF]"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span className="text-[13px] text-[#6B7280]">Ghi nhớ tôi</span>
          </label>
          <button
            type="button"
            className="text-[13px] text-[#6B7280] bg-transparent border-none cursor-pointer hover:text-[#08A9DF] hover:underline p-0"
          >
            Forgot your password?
          </button>
        </div>

        {/* Error */}
        {error && (
          <p className="text-[13px] text-[#DC2626] mb-4 text-center">{error}</p>
        )}

        {/* LOGIN button */}
        <button
          onClick={handleSubmit}
          disabled={!isFormValid || loading}
          className={`w-full h-[52px] rounded-[8px] border-none text-[15px] font-semibold tracking-wider cursor-pointer flex items-center justify-center transition-colors
            ${!isFormValid || loading ? 'bg-[#08A9DF]/50 text-white/70 cursor-not-allowed' : 'bg-[#08A9DF] text-white hover:bg-[#078DBB]'}`}
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : 'ĐĂNG NHẬP'}
        </button>

        {/* Theo dõi tại */}
        <div className="mt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-[1px] bg-[#D9E1E5]" />
            <span className="text-[13px] text-[#6B7280] shrink-0">Theo dõi tại</span>
            <div className="flex-1 h-[1px] bg-[#D9E1E5]" />
          </div>
          <div className="flex gap-3">
            <a href="https://www.facebook.com/airobotic.edu.vn" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-[8px] bg-[#08A9DF] no-underline hover:bg-[#078DBB] transition-colors shadow-sm flex-1 text-[14px] font-semibold"
              style={{ color: 'white' }}>
              <Svg_Facebook w={20} h={20} c={'white'} />
              Facebook
            </a>
            <a href="https://s4h.edu.vn/" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-[8px] bg-[#08A9DF] no-underline hover:bg-[#078DBB] transition-colors shadow-sm flex-1 text-[14px] font-semibold"
              style={{ color: 'white' }}>
              <Svg_Website w={20} h={20} c={'white'} />
              Website
            </a>
          </div>
        </div>
      </div>

      {/* Skyline decoration */}
      <div aria-hidden="true" className="absolute bottom-0 left-0 right-0 pointer-events-none leading-none">
        <Svg_CitySkyline w={'100%'} h={'auto'} />
      </div>
    </div>
  );
};

export default LoginPage;
