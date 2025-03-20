import React from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    navigate('/map');
  };

  const goToRegister = () => {
    navigate('/register');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white p-4 shadow-md flex items-center justify-center">
        <h1 className="text-xl font-bold text-gray-800">강아지도</h1>
      </header>

      <div className="flex-1 p-4 flex flex-col">
        <h1 className="text-xl font-bold text-center my-8 text-gray-800">로그인</h1>

        {/* 입력 폼 */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-4">
          <form onSubmit={handleLogin} className="space-y-4">
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

            <button
              type="submit"
              className="w-full bg-amber-800 text-white p-3 rounded-md text-center font-medium mt-4"
            >
              로그인
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              계정이 없으신가요?{' '}
              <button
                onClick={goToRegister}
                className="text-amber-800 hover:underline focus:outline-none font-medium"
              >
                회원가입하기
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login; 