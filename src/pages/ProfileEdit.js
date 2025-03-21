import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function ProfileEdit() {
  const navigate = useNavigate();
  const [showToast, setShowToast] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

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

  const handleWithdrawal = () => {
    // 실제로는 API 호출 등으로 회원 탈퇴 처리
    setShowWithdrawalModal(false);
    setToastMessage("회원 탈퇴가 완료되었습니다.");
    setShowToast(true);
    
    // 토스트 메시지 표시 후 2초 후에 로그인 페이지로 이동
    setTimeout(() => {
      navigate('/login');
    }, 2000);
  };

  const handleUpdateProfile = () => {
    // 실제로는 API 호출 등으로 회원 정보 수정 처리
    setShowProfileModal(true);
  };

  const confirmProfileUpdate = () => {
    setShowProfileModal(false);
    setToastMessage("수정을 완료하였습니다.");
    setShowToast(true);
    
    // 토스트 메시지 표시 후 2초 후에 profile 페이지로 이동
    setTimeout(() => {
      navigate('/profile');
    }, 2000);
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
    <div className="flex flex-col h-full bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white p-4 shadow-md flex items-center">
        <button onClick={() => navigate('/profile')} className="mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-800">회원정보 수정</h1>
      </header>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-md p-4 mb-4">
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mb-3 overflow-hidden">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-gray-400">
                <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
              </svg>
            </div>
            <button className="text-sm text-amber-800 font-medium">프로필 사진 변경</button>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              <input
                type="email"
                value="hong@example.com"
                className="w-full p-3 border border-gray-300 rounded-md bg-gray-100"
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">이메일은 변경할 수 없습니다</p>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">닉네임</label>
              <input
                type="text"
                placeholder="닉네임을 입력하세요"
                defaultValue="홍길동"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">2~10자 이내로 입력해주세요</p>
            </div>

            <button 
              onClick={handleUpdateProfile}
              className="w-full bg-amber-800 text-white p-3 rounded-md text-center font-medium mt-4"
            >
              변경 완료
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

      {/* 회원 탈퇴 버튼 */}
      <div className="flex justify-center py-3">
        <button 
          onClick={() => setShowWithdrawalModal(true)}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          회원 탈퇴
        </button>
      </div>

      {/* 회원 탈퇴 모달 */}
      {showWithdrawalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-4/5 max-w-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-3">회원 탈퇴</h3>
            <div className="text-center mb-4">
              <p className="text-md font-medium mb-2">정말로 탈퇴하시겠습니까?</p>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              회원 탈퇴시 아래 데이터가 모두 삭제됩니다:
            </p>
            <ul className="text-sm text-gray-600 mb-6 list-disc pl-5">
              <li>회원 정보</li>
              <li>반려견 정보</li>
              <li>지도에 등록한 장소</li>
            </ul>
            <p className="text-sm text-red-500 mb-6 font-medium">
              삭제된 데이터는 복구할 수 없습니다.
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShowWithdrawalModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                취소
              </button>
              <button 
                onClick={handleWithdrawal}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600"
              >
                탈퇴하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 프로필 수정 확인 모달 */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-4/5 max-w-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">프로필 수정</h3>
            <p className="text-sm text-gray-600 mb-6">
              입력하신 정보로 프로필을 수정하시겠습니까?
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                취소
              </button>
              <button 
                onClick={confirmProfileUpdate}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600"
              >
                수정하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 하단 네비게이션 */}
      <nav className="bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-around">
          <button onClick={goToMap} className="flex flex-col items-center py-3 px-4 text-gray-500 hover:text-amber-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs mt-1 font-medium">지도</span>
          </button>
          <button onClick={goToChat} className="flex flex-col items-center py-3 px-4 text-gray-500 hover:text-amber-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="text-xs mt-1 font-medium">채팅</span>
          </button>
          <button onClick={goToProfile} className="flex flex-col items-center py-3 px-4 text-amber-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs mt-1 font-medium">내 정보</span>
          </button>
          <button onClick={goToPetInfo} className="flex flex-col items-center py-3 px-4 text-gray-500 hover:text-amber-800 transition-colors">
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

export default ProfileEdit; 