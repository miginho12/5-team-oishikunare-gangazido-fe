import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePassword } from '../api/user';

function PasswordChange() {
  const navigate = useNavigate();
  
  // 상태 관리
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('비밀번호 변경을 완료하였습니다.');

  const goToMap = () => {
    navigate('/map');
  };

  const goToChat = () => {
    navigate('/chat');
  };

  const goToProfile = () => {
    navigate('/profile');
  };

  const goToPetInfo = () => {
    navigate('/pets');
  };

  // 새 비밀번호 유효성 검사
  const validateNewPassword = (password) => {
    // 영문, 숫자, 특수문자 조합 8~20자 검증
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,20}$/;
    
    if (!password) {
      return '새 비밀번호를 입력해주세요.';
    }
    
    if (password.length < 8 || password.length > 20) {
      return '비밀번호는 8~20자 이내로 입력해주세요.';
    }
    
    if (!passwordRegex.test(password)) {
      return '비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다.';
    }
    
    return null;
  };

  // 비밀번호 변경 핸들러
  const handleNewPasswordChange = (e) => {
    const value = e.target.value;
    setNewPassword(value);
    
    // 빈 값이 아닐 때만 유효성 검사 수행
    if (value) {
      const error = validateNewPassword(value);
      setPasswordError(error);
    } else {
      setPasswordError(null);
    }
    
    // 비밀번호 확인란이 비어있지 않고, 값이 다를 경우
    if (confirmPassword && value !== confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.');
    }
  };

  // 비밀번호 확인 변경 핸들러
  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    
    if (newPassword && value && newPassword !== value) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.');
    } else {
      // 새 비밀번호가 유효하지 않다면 그 오류 메시지 유지
      if (newPassword) {
        const error = validateNewPassword(newPassword);
        setPasswordError(error);
      } else {
        setPasswordError(null);
      }
    }
  };

  const handleUpdatePassword = async () => {
    // 입력값 확인
    if (!currentPassword) {
      setError('현재 비밀번호를 입력해주세요.');
      return;
    }
    
    if (!newPassword) {
      setError('새 비밀번호를 입력해주세요.');
      return;
    }
    
    if (!confirmPassword) {
      setError('새 비밀번호 확인을 입력해주세요.');
      return;
    }
    
    // 새 비밀번호 유효성 확인 - 즉시 검사 추가
    const newPasswordError = validateNewPassword(newPassword);
    if (newPasswordError) {
      setPasswordError(newPasswordError);
      setError('입력한 새 비밀번호가 유효하지 않습니다.');
      return;
    }
    
    // 패스워드 일치 확인
    if (newPassword !== confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    
    // 오류가 있는지 확인
    if (passwordError) {
      setError('입력 정보를 확인해주세요.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await changePassword({
        currentPassword,
        newPassword,
        newPasswordConfirm: confirmPassword
      });
      
      setToastMessage('비밀번호 변경을 완료하였습니다.');
      setShowToast(true);
      
      // 토스트 메시지 표시 후 2초 후에 profile 페이지로 이동
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } catch (err) {
      console.error('비밀번호 변경 실패:', err);
      
      // 오류 메시지 처리
      if (err.response) {
        if (err.response.status === 401) {
          setError('현재 비밀번호가 일치하지 않습니다.');
        } else if (err.response.data && err.response.data.message) {
          if (err.response.data.message === "invalid_current_password") {
            setError('현재 비밀번호가 일치하지 않습니다.');
          } else if(err.response.data.message === "invalid_password_format") {
            setError('새 비밀번호는 대문자, 소문자, 숫자, 특수문자를 모두 포함한 8~20자여야 합니다.');
          }
        } else {
          setError('비밀번호 변경 중 오류가 발생했습니다.');
        }
      } else {
        setError('서버에 연결할 수 없습니다. 나중에 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 토스트 메시지가 표시되면 3초 후에 자동으로 사라지도록 설정
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  return (
    <div className="flex flex-col h-full bg-amber-50">
      {/* 헤더 */}
      <header className="bg-white pt-2 pb-0 px-4 shadow-md flex items-center relative">
        <button onClick={() => navigate('/profile')} className="absolute left-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-grow flex justify-center">
          <img
            src="/gangazido-logo-header.png"
            alt="Gangazido Logo Header"
            className="h-14 w-28 object-cover"
          />
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* 오류 메시지 */}
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        <div className="bg-white rounded-xl shadow-md p-4 mb-4">
          <div className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">현재 비밀번호</label>
              <input
                type="password"
                placeholder="현재 비밀번호를 입력하세요"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-transparent"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">현재 사용 중인 비밀번호를 입력해주세요</p>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호</label>
              <input
                type="password"
                placeholder="새 비밀번호를 입력하세요"
                className={`w-full p-3 border ${passwordError ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-transparent`}
                required
                value={newPassword}
                onChange={handleNewPasswordChange}
              />
              <p className="text-xs text-gray-500 mt-1">영문, 숫자, 특수문자 조합 8~20자</p>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호 확인</label>
              <input
                type="password"
                placeholder="새 비밀번호를 다시 입력하세요"
                className={`w-full p-3 border ${passwordError ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-transparent`}
                required
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
              />
              <p className="text-xs text-gray-500 mt-1">새 비밀번호를 한번 더 입력해주세요</p>
              {passwordError && <p className="text-xs text-red-500 mt-1">{passwordError}</p>}
            </div>

            <button 
              onClick={handleUpdatePassword}
              className="w-full bg-amber-800 text-white p-3 rounded-md text-center font-medium mt-4"
              disabled={loading}
            >
              {loading ? '처리 중...' : '변경 완료'}
            </button>
          </div>
        </div>
      </div>

      {/* 토스트 메시지 */}
      {showToast && (
        <div className="fixed bottom-24 left-0 right-0 mx-auto w-3/5 max-w-xs bg-white bg-opacity-80 border border-amber-800 text-amber-800 p-3 rounded-md shadow-lg text-center z-50 animate-fade-in-up">
          {toastMessage}
        </div>
      )}

      {/* 하단 네비게이션 */}
      <nav className="bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-between px-2">
          <button onClick={goToMap} className="flex flex-col items-center py-3 flex-1 text-gray-500 hover:text-amber-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs mt-1 font-medium">지도</span>
          </button>
          <button onClick={goToChat} className="flex flex-col items-center py-3 flex-1 text-gray-500 hover:text-amber-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="text-xs mt-1 font-medium">채팅</span>
          </button>
          <button onClick={goToProfile} className="flex flex-col items-center py-3 flex-1 text-amber-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs mt-1 font-medium">내 정보</span>
          </button>
          <button onClick={goToPetInfo} className="flex flex-col items-center py-3 flex-1 text-gray-500 hover:text-amber-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21s-6-4.35-9-8c-3-3.35-3-7.35 0-10 3-3 7.5-2 9 2 1.5-4 6-5 9-2 3 3 3 7 0 10-3 3.65-9 8-9 8z" />
            </svg>
            <span className="text-xs mt-1 font-medium">반려견 정보</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default PasswordChange;