import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserInfo, updateUserInfo, deleteUser } from '../api/user';

// 서버 에러 코드를 한글 메시지로 변환하는 객체
const ERROR_MESSAGES = {
  // 닉네임 관련 에러
  'required_nickname': '닉네임은 필수 입력 항목입니다.',
  'invalid_nickname_length': '닉네임은 2~20자 이내로 입력해주세요.',
  'duplicate_nickname': '이미 사용 중인 닉네임입니다.',
  
  // 프로필 이미지 관련 에러
  'image_not_found': '업로드된 이미지를 찾을 수 없습니다.',
  'invalid_file_extension': '지원하지 않는 파일 형식입니다. (jpg, jpeg, png, gif만 가능)',
  'invalid_content_type': '지원하지 않는 콘텐츠 타입입니다.',
  
  // 인증 관련 에러
  'unauthorized': '로그인이 필요한 서비스입니다.',
  'missing_user': '사용자 정보를 찾을 수 없습니다.',
  
  // 기타 에러
  'internal_server_error': '서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  'required_profile_update_data': '변경할 정보를 입력해주세요.',
  'update_user_data_failed': '프로필 수정에 실패했습니다.',
};

// 에러 코드를 한글 메시지로 변환하는 함수
const getErrorMessage = (errorCode) => {
  return ERROR_MESSAGES[errorCode] || `오류가 발생했습니다. (${errorCode})`;
};

function ProfileEdit() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nickname, setNickname] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [defaultProfileImage, setDefaultProfileImage] = useState(null);
  const [isDefaultSvg, setIsDefaultSvg] = useState(false);
  const [removeProfileImage, setRemoveProfileImage] = useState(false);

  // 컴포넌트 마운트 시 사용자 정보 로드
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setLoading(true);
        const response = await getUserInfo();
        const userData = response.data.data;
        setUserInfo(userData);
        setNickname(userData.nickname || '');
        if (userData.profileImage) {
          setProfileImagePreview(userData.profileImage);
          // 기본 프로필 이미지 저장
          setDefaultProfileImage(userData.profileImage);
          setIsDefaultSvg(false);
        } else {
          // 프로필 이미지가 없는 경우 SVG 사용을 표시
          setIsDefaultSvg(true);
        }
      } catch (err) {
        console.error('사용자 정보 로드 실패:', err);
        if (err.response && err.response.status === 401) {
          // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
          navigate('/login');
        } else {
          // 에러 메시지 처리 개선
          if (err.response?.data?.message) {
            setError(getErrorMessage(err.response.data.message));
          } else if (err.response?.data?.errorCode) {
            setError(getErrorMessage(err.response.data.errorCode));
          } else {
            setError('사용자 정보를 불러오는데 실패했습니다.');
          }
        }
      } finally {
        setLoading(false);
      }
    };
  
    fetchUserInfo();
  }, [navigate]);

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

  // 프로필 이미지 변경 핸들러
  const handleProfileImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // 파일 크기 체크 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setToastMessage("프로필 이미지 크기는 5MB 이하여야 합니다.");
        setShowToast(true);
        return;
      }
      
      // 파일 타입 체크
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        setToastMessage("지원하지 않는 파일 형식입니다. (jpg, jpeg, png, gif만 가능)");
        setShowToast(true);
        return;
      }
      
      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
      setRemoveProfileImage(false);
    } else {
      // 파일 선택 취소했을 때 이미지 제거하고 기본 이미지로 설정
      setProfileImage(null);
      setProfileImagePreview(null);
      setRemoveProfileImage(true);
    }
  };


  const handleWithdrawal = async () => {
    try {
      console.log('회원탈퇴 API 호출 시작');
      await deleteUser();
      console.log('회원탈퇴 API 호출 성공');
      
      setShowWithdrawalModal(false);
      setToastMessage("회원 탈퇴가 완료되었습니다.");
      setShowToast(true);
      
      // 토스트 메시지 표시 후 2초 후에 로그인 페이지로 이동
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      console.error('회원탈퇴 API 오류:', error);
      if (error.response) {
        console.error('오류 상태:', error.response.status);
        console.error('오류 데이터:', error.response.data);
        
        // 에러 메시지 처리 개선
        if (error.response.data?.message) {
          setToastMessage(getErrorMessage(error.response.data.message));
        } else if (error.response.data?.errorCode) {
          setToastMessage(getErrorMessage(error.response.data.errorCode));
        } else if (error.response.status === 401) {
          setToastMessage("로그인이 필요한 서비스입니다.");
        } else {
          setToastMessage("회원 탈퇴 처리 중 오류가 발생했습니다.");
        }
      } else {
        setToastMessage("서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.");
      }

      setShowWithdrawalModal(false);
      setShowToast(true);
    }
  };

  const handleUpdateProfile = () => {
    // 폼 유효성 검사
    if (!nickname.trim()) {
      setToastMessage("닉네임을 입력해주세요.");
      setShowToast(true);
      return;
    }
    
    // 닉네임 길이 체크
    if (nickname.length < 2 || nickname.length > 20) {
      setToastMessage("닉네임은 2~20자 이내로 입력해주세요.");
      setShowToast(true);
      return;
    }
    
    setShowProfileModal(true);
  };

  const confirmProfileUpdate = async () => {
    try {
      const userData = {
        user_nickname: nickname,
        user_profile_image: profileImage,
        removeProfileImage: removeProfileImage
      };
      
      await updateUserInfo(userData);
      
      setShowProfileModal(false);
      setToastMessage("수정을 완료하였습니다.");
      setShowToast(true);
      
      // 토스트 메시지 표시 후 2초 후에 profile 페이지로 이동
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } catch (err) {
      console.error('프로필 수정 실패:', err);
      setShowProfileModal(false);
      
      // 에러 응답에 따른 구체적인 메시지 표시
      if (err.response) {
        console.error('오류 응답:', err.response.data);
        
        if (err.response.data?.message) {
          const errorCode = err.response.data.message;
          
          if (errorCode === 'duplicate_nickname') {
            setToastMessage("이미 사용 중인 닉네임입니다.");
          } else if (errorCode === 'invalid_nickname_length') {
            setToastMessage("닉네임은 2~20자 이내로 입력해주세요.");
          } else if (errorCode === 'image_not_found') {
            setToastMessage("업로드된 이미지를 찾을 수 없습니다.");
          } else if (errorCode === 'invalid_file_extension') {
            setToastMessage("지원하지 않는 파일 형식입니다. (jpg, jpeg, png, gif만 가능)");
          } else if (errorCode === 'required_profile_update_data') {
            setToastMessage("변경할 정보를 입력해주세요.");
          } else if (errorCode === 'unauthorized') {
            setToastMessage("로그인이 필요한 서비스입니다.");
            // 로그인 페이지로 리다이렉트
            setTimeout(() => {
              navigate('/login');
            }, 2000);
          } else {
            setToastMessage(getErrorMessage(errorCode));
          }
        } else if (err.response.data?.errorCode) {
          setToastMessage(getErrorMessage(err.response.data.errorCode));
        } else if (err.response.status === 401) {
          setToastMessage("로그인이 필요한 서비스입니다.");
          // 로그인 페이지로 리다이렉트
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } else if (err.response.status === 400) {
          setToastMessage("입력한 정보가 유효하지 않습니다.");
        } else if (err.response.status === 409) {
          setToastMessage("이미 사용 중인 닉네임입니다.");
        } else {
          setToastMessage("프로필 수정에 실패했습니다.");
        }
      } else if (err.request) {
        setToastMessage("서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.");
      } else {
        setToastMessage("프로필 수정 중 오류가 발생했습니다.");
      }
      
      setShowToast(true);
    }
  };

  // 파일 입력 요소 클릭 시 값 초기화
const handleProfileImageClick = (e) => {
  e.target.value = null;
};

// 파일 선택 취소 감지 함수
useEffect(() => {
  let fileInputClicked = false;
  
  const handleFileInputClick = () => {
    fileInputClicked = true;
    setTimeout(() => {
      fileInputClicked = false;
    }, 100);
  };
  
  const handleWindowFocus = () => {
    if (fileInputClicked) {
      setTimeout(() => {
        const fileInput = document.getElementById('profile-upload');
        if (fileInput && fileInput.files.length === 0) {
          // 파일 선택 취소 시 이미지 제거 플래그 설정
          setProfileImage(null);
          setProfileImagePreview(null);
          setRemoveProfileImage(true);
          console.log('파일 선택 취소: removeProfileImage = true');
        }
        fileInputClicked = false;
      }, 300);
    }
  };
  
  // 이벤트 리스너 등록
  const fileInput = document.getElementById('profile-upload');
  if (fileInput) {
    fileInput.addEventListener('click', handleFileInputClick);
  }
  
  window.addEventListener('focus', handleWindowFocus);
  
  // 컴포넌트 언마운트 시 이벤트 리스너 제거
  return () => {
    if (fileInput) {
      fileInput.removeEventListener('click', handleFileInputClick);
    }
    window.removeEventListener('focus', handleWindowFocus);
  };
}, []);

  // 토스트 메시지가 표시되면 3초 후에 자동으로 사라지도록 설정
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // 로딩 중이면 로딩 표시
  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-800"></div>
        <p className="mt-4 text-gray-600">사용자 정보를 불러오는 중...</p>
      </div>
    );
  }

  // 에러가 있으면 에러 메시지 표시
  if (error) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-gray-50">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-md">
          <span className="block sm:inline">{error}</span>
        </div>
        <button 
          onClick={() => navigate('/profile')}
          className="mt-4 px-4 py-2 bg-amber-800 text-white rounded hover:bg-amber-700"
        >
          프로필 페이지로 이동
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
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
        <div className="bg-white rounded-xl shadow-md p-4 mb-4">
          <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center mb-3 overflow-hidden">
            {profileImagePreview && profileImagePreview !== "null" ? (
              <img 
                src={profileImagePreview} 
                alt="프로필 이미지"
                className="w-full h-full object-cover"
                onError={() => {
                  // 이미지 로드 실패 시 상태 업데이트
                  setProfileImagePreview(null);
                }}
              />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-amber-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            )}
          </div>
            <label htmlFor="profile-upload" className="text-sm text-amber-800 font-medium cursor-pointer">
              프로필 사진 변경
              <input
                id="profile-upload"
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                onClick={handleProfileImageClick}
                className="hidden"
              />
            </label>
        </div>

          <div className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              <input
                type="email"
                value={userInfo?.email || ''}
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
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">2~20자 이내로 입력해주세요</p>
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
                className="px-4 py-2 text-sm font-medium text-white bg-amber-800 rounded-md hover:bg-amber-700"
              >
                수정하기
              </button>
            </div>
          </div>
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

export default ProfileEdit; 