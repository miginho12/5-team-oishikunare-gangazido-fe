import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginUser } from '../api/auth';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(location.state?.message || null);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 기존 auth API 모듈 사용
      const response = await loginUser({
        user_email: email,
        user_password: password
      });
      
      console.log('로그인 성공:', response.data);
      
      // 성공 시 지도 페이지로 이동
      navigate('/map');
      
    } catch (err) {
      console.error('로그인 오류:', err);
      
      // 오류 메시지 처리
      if (err.response) {
        // 서버에서 응답이 왔지만 에러 상태 코드인 경우
        if (err.response.data && err.response.data.message) {
          setError(err.response.data.message);
        } else if (err.response.status === 401) {
          setError('이메일 또는 비밀번호가 올바르지 않습니다.');
        } else {
          setError('로그인 중 오류가 발생했습니다.');
        }
      } else if (err.request) {
        // 요청은 보냈으나 응답을 받지 못한 경우
        setError('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
      } else {
        // 요청을 보내는 과정에서 오류가 발생한 경우
        setError('로그인 요청 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
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

        {/* 성공 메시지 */}
        {message && (
          <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{message}</span>
            <span 
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={() => setMessage(null)}
            >
              <svg className="fill-current h-6 w-6 text-green-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <title>닫기</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
              </svg>
            </span>
          </div>
        )}

        {/* 오류 메시지 */}
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
              <input
                type="password"
                placeholder="비밀번호를 입력하세요"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-transparent"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-amber-800 text-white p-3 rounded-md text-center font-medium mt-4 disabled:bg-amber-500"
              disabled={loading}
            >
              {loading ? '로그인 중...' : '로그인'}
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