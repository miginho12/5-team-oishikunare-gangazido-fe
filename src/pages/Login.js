import React from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    navigate('/main');
  };

  const goToRegister = () => {
    navigate('/register');
  };

  const goToMain = () => {
    navigate('/main');
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 헤더 */}
      <header className="bg-gray-200 p-4 flex items-center justify-center">
        <h1 className="text-xl font-bold">강아지도</h1>
        <div className="w-8 h-8 ml-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
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
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16">
              <circle cx="12" cy="8" r="4" />
              <path d="M10 16H14" />
              <path d="M12 12V20" />
              <path d="M18 12C18 12 19 15 19 16C19 17.6569 17.6569 19 16 19C14.3431 19 13 17.6569 13 16" />
              <path d="M6 12C6 12 5 15 5 16C5 17.6569 6.34315 19 8 19C9.65685 19 11 17.6569 11 16" />
            </svg>
          </div>
        </div>

        {/* 입력 폼 */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative border border-gray-300 rounded-md">
            <input
              type="email"
              placeholder="이메일"
              className="w-full p-3 rounded-md"
              required
            />
            <p className="text-xs text-gray-500 mt-1 ml-1">*helper text</p>
          </div>

          <div className="relative border border-gray-300 rounded-md">
            <input
              type="password"
              placeholder="비밀번호"
              className="w-full p-3 rounded-md"
              required
            />
            <p className="text-xs text-gray-500 mt-1 ml-1">*helper text</p>
          </div>

          <button
            type="submit"
            className="w-full bg-gray-200 text-gray-700 p-3 rounded-md mt-4"
          >
            로그인
          </button>
        </form>

        <div className="mt-4">
          <button
            onClick={goToRegister}
            className="w-full bg-red-500 text-white p-3 rounded-md"
          >
            회원가입하러 가기
          </button>
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <nav className="bg-white border-t border-gray-200">
        <div className="flex justify-around">
          <button onClick={goToMain} className="flex flex-col items-center py-2 px-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs mt-1">지도</span>
          </button>
          <button onClick={() => navigate('/chat')} className="flex flex-col items-center py-2 px-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="text-xs mt-1">채팅</span>
          </button>
          <button onClick={() => navigate('/chat')} className="flex flex-col items-center py-2 px-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs mt-1">내 정보</span>
          </button>
          <button onClick={goToMain} className="flex flex-col items-center py-2 px-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs mt-1">내 반려견 정보</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default Login; 