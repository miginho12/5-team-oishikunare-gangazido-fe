import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginUser } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(location.state?.message || null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/map');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('로그인 시도 - 이메일:', email);
    
    try {
      const response = await loginUser({ email, password });
      console.log('로그인 API 응답:', JSON.stringify(response.data, null, 2));
      
      // 응답 구조 확인
      let userData = null;
      
      // response.data 구조 확인
      if (response.data) {
        // data 필드가 있으면 사용
        if (response.data.data) {
          userData = response.data.data;
          console.log('API 응답에서 user 데이터 추출:', userData);
        } 
        // user 필드가 있으면 사용
        else if (response.data.user) {
          userData = response.data.user;
          console.log('API 응답에서 user 필드 추출:', userData);
        }
        // 응답 자체를 사용
        else {
          userData = {
            email: email,
            id: 'user-' + Date.now()
          };
          console.log('API 응답에서 사용자 데이터를 찾을 수 없어 기본값 사용:', userData);
        }
      } else {
        userData = {
          email: email,
          id: 'user-' + Date.now()
        };
        console.log('API 응답에 data가 없어 기본값 사용:', userData);
      }
      
      console.log('로그인 처리 - 사용자 데이터 준비됨:', userData);
      
      login(userData);
      console.log('AuthContext login 함수 호출 완료');
      
      // 로그인 성공 후 리디렉션
      console.log('로그인 성공 - 리디렉션 시작');
      navigate('/map');
    } catch (err) {
      console.error('로그인 오류:', err);
      console.error('오류 응답:', err.response?.data);
      err.response?.data?.message
      // 특정 에러 코드에 대한 맞춤 메시지 설정
      if (err.response?.data?.message === 'invalid_email') {
        setError('이메일을 다시 입력해주세요');
      } else if (err.response?.data?.message === 'invalid_password') {
        setError('비밀번호를 다시 입력해주세요');
      } else {
        setError(err.response?.data?.message || '로그인 중 오류가 발생했습니다');
      }
    } finally {
      setLoading(false);
    }
  };

  const goToRegister = () => {
    navigate('/register');
  };

  const goToMap = () => {
    navigate('/map');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 헤더 - 뒤로가기 버튼 추가 */}
      <header className="bg-white p-4 shadow-md flex items-center">
        <button onClick={goToMap} className="mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
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
          <form onSubmit={handleSubmit} className="space-y-4">
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