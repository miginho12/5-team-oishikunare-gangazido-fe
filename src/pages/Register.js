import React from 'react';
import { useNavigate } from 'react-router-dom';

function Register() {
  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();
    navigate('/login');
  };

  const goToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white p-4 shadow-md flex items-center justify-center">
        <h1 className="text-xl font-bold text-gray-800">강아지도</h1>
        <div className="w-8 h-8 ml-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-amber-800">
            <circle cx="12" cy="8" r="4" />
            <path d="M10 16H14" />
            <path d="M12 12V20" />
            <path d="M18 12C18 12 19 15 19 16C19 17.6569 17.6569 19 16 19C14.3431 19 13 17.6569 13 16" />
            <path d="M6 12C6 12 5 15 5 16C5 17.6569 6.34315 19 8 19C9.65685 19 11 17.6569 11 16" />
          </svg>
        </div>
      </header>

      <div className="flex-1 p-4 flex flex-col">
        {/* 로고 */}
        <div className="flex justify-center my-8">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-gray-400">
              <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        
        <h1 className="text-xl font-bold text-center mb-4 text-gray-800">회원가입</h1>
        
        {/* 입력 폼 */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-4">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              <input
                type="email"
                placeholder="이메일을 입력하세요"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">*helper text</p>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
              <input
                type="password"
                placeholder="비밀번호를 입력하세요"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">*helper text</p>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인</label>
              <input
                type="password"
                placeholder="비밀번호를 다시 입력하세요"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">*helper text</p>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">닉네임</label>
              <input
                type="text"
                placeholder="닉네임을 입력하세요"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">*helper text</p>
            </div>

            <button
              type="submit"
              className="w-full bg-amber-800 text-white p-3 rounded-md text-center font-medium mt-4"
            >
              등록 완료
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              이미 계정이 있으신가요?{' '}
              <button
                onClick={goToLogin}
                className="text-amber-800 hover:underline focus:outline-none font-medium"
              >
                로그인하기
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register; 