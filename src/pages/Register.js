import React, { useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { registerUser, checkEmailDuplicate, checkNicknameDuplicate } from '../api/auth';

function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [nickname, setNickname] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [emailError, setEmailError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [nicknameError, setNicknameError] = useState(null);
  const [removeProfileImage, setRemoveProfileImage] = useState(false);

  // 이메일 변경 핸들러
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setEmailError(null);
  };

  // 이메일 중복 체크
  const handleEmailBlur = async () => {
    if (!email || !email.match(/^[\w-]+@([\w-]+\.)+[\w-]{2,4}$/)) {
      setEmailError('유효한 이메일 형식이 아닙니다.');
      return;
    }
    
    try {
      const response = await checkEmailDuplicate(email);
      console.log('이메일 중복 체크 응답:', response);
      
      // API 응답 구조 확인
      if (response.data && response.data.data) {
        const { isDuplicate } = response.data.data;
        if (isDuplicate) {
          setEmailError('이미 사용 중인 이메일입니다.');
        } else {
          setEmailError(null);
        }
      } else {
        console.error('예상치 못한 응답 구조:', response.data);
        setEmailError(null); // 일단 진행 가능하도록 함
      }
    } catch (err) {
      console.error('이메일 중복 체크 오류:', err);
      // 오류 발생 시 사용자 경험을 위해 일단 진행 가능하도록 허용
      setEmailError(null);
    }
  };

  // 비밀번호 변경 핸들러
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    
    if (e.target.value.length < 8) {
      setPasswordError('비밀번호는 8자 이상이어야 합니다.');
    } else {
      setPasswordError(null);
      
      // 비밀번호 확인과 일치 여부 체크
      if (passwordConfirm && e.target.value !== passwordConfirm) {
        setPasswordError('비밀번호가 일치하지 않습니다.');
      }
    }
  };

  // 비밀번호 확인 변경 핸들러
  const handlePasswordConfirmChange = (e) => {
    setPasswordConfirm(e.target.value);
    
    if (password && e.target.value && password !== e.target.value) {
      setPasswordError('비밀번호가 일치하지 않습니다.');
    } else {
      setPasswordError(null);
    }
  };

  // 닉네임 변경 핸들러
  const handleNicknameChange = (e) => {
    setNickname(e.target.value);
    setNicknameError(null);
  };

  // 닉네임 중복 체크
  const handleNicknameBlur = async () => {
    if (!nickname) {
      setNicknameError('닉네임을 입력해주세요.');
      return;
    }
    
    if (nickname.length < 2 || nickname.length > 20) {
      setNicknameError('닉네임은 2~20자 사이여야 합니다.');
      return;
    }
    
    try {
      const response = await checkNicknameDuplicate(nickname);
      console.log('닉네임 중복 체크 응답:', response);
      
      // API 응답 구조 확인
      if (response.data && response.data.data) {
        const { isDuplicate } = response.data.data;
        if (isDuplicate) {
          setNicknameError('이미 사용 중인 닉네임입니다.');
        } else {
          setNicknameError(null);
        }
      } else {
        console.error('예상치 못한 응답 구조:', response.data);
        setNicknameError(null); // 일단 진행 가능하도록 함
      }
    } catch (err) {
      console.error('닉네임 중복 체크 오류:', err);
      // 오류 발생 시 사용자 경험을 위해 일단 진행 가능하도록 허용
      setNicknameError(null);
    }
  };

  // 프로필 이미지 변경 핸들러 수정
  const handleProfileImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      // 파일 크기 체크 (5MB)
      if (e.target.files[0].size > 5 * 1024 * 1024) {
        setError('프로필 이미지 크기는 5MB 이하여야 합니다.');
        return;
      }
      
      setProfileImage(e.target.files[0]);
      setProfileImagePreview(URL.createObjectURL(e.target.files[0]));
      setRemoveProfileImage(false);
    } else {
      // 파일 선택 취소한 경우 - 기본 이미지로 설정
      setProfileImage(null);
      setProfileImagePreview(null);
      setRemoveProfileImage(true);
    }
  };

  // 파일 입력 요소 클릭 시 값 초기화 함수
  const handleProfileImageClick = (e) => {
    e.target.value = null;
  };


  // 추가: 컴포넌트 상태 추가
  const [profileImagePreview, setProfileImagePreview] = useState(null);

  // 파일 선택 취소 감지 함수
  useEffect(() => {
    let fileInputClicked = false;
    
    const handleFileInputClick = () => {
      fileInputClicked = true;
      
      // 짧은 지연 후 클릭 상태 초기화
      setTimeout(() => {
        fileInputClicked = false;
      }, 100);
    };
  
  const handleWindowFocus = () => {
    // 파일 입력을 클릭한 후 포커스가 돌아오면 다이얼로그가 닫힌 것으로 간주
    if (fileInputClicked) {
      setTimeout(() => {
        // 파일이 없으면 취소한 것으로 간주
        const fileInput = document.getElementById('profile-upload');
        if (fileInput && fileInput.files.length === 0) {
          setProfileImage(null);
          setProfileImagePreview(null);
          setRemoveProfileImage(true);
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

  // 회원가입 폼 제출 핸들러
  const handleRegister = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('회원가입 요청 시작 ============================');
      console.log('- 이메일:', email);
      console.log('- 닉네임:', nickname);
      console.log('- 프로필 이미지:', profileImage ? profileImage.name : '없음');
      
      const userData = {
        user_email: email,
        user_password: password,
        user_password_confirm: passwordConfirm,
        user_nickname: nickname,
        user_profileImage: profileImage,
        removeProfileImage: removeProfileImage
      };
      
      console.log('회원가입 FormData가 생성되기 전 userData:', 
        JSON.stringify({
          ...userData,
          user_password: '(보안상 로그 생략)',
          user_password_confirm: '(보안상 로그 생략)',
          user_profileImage: profileImage ? '(파일 객체)' : null
        })
      );
      
      // auth API 모듈 활용
      const response = await registerUser(userData);
      
      console.log('회원가입 성공 응답:', response.data);
      
      // 로그인 페이지로 이동하면서 성공 메시지 전달
      navigate('/login', { 
        state: { message: '회원가입이 완료되었습니다! 로그인해주세요.' } 
      });
      
    } catch (err) {
      console.error('회원가입 오류 발생:', err);
      
      // 오류 메시지 처리 - 상세 정보 추가
      if (err.response) {
        console.error('회원가입 오류 응답 상태:', err.response.status);
        console.error('회원가입 오류 응답 헤더:', err.response.headers);
        console.error('회원가입 오류 응답 데이터:', err.response.data);
        
        if (err.response.data && err.response.data.message) {
          // 개별 에러 코드에 따른 세부적인 메시지 처리
          const errorCode = err.response.data.message;
          
          if (errorCode === 'password_mismatch') {
            setError('비밀번호가 일치하지 않습니다.');
          } else if (errorCode === 'required_email') {
            setError('이메일은 필수 입력 항목입니다.');
          } else if (errorCode === 'invalid_email_format') {
            setError('유효한 이메일 형식이 아닙니다.');
          } else if (errorCode === 'required_password') {
            setError('비밀번호는 필수 입력 항목입니다.');
          } else if (errorCode === 'invalid_password_length') {
            setError('비밀번호는 8자 이상 20자 이하여야 합니다.');
          } else if (errorCode === 'invalid_password_format') {
            setError('비밀번호는 대문자, 소문자, 숫자, 특수문자를 포함해야 합니다.');
          } else if (errorCode === 'required_nickname') {
            setError('닉네임은 필수 입력 항목입니다.');
          } else if (errorCode === 'invalid_nickname_length') {
            setError('닉네임은 2자 이상 20자 이하여야 합니다.');
          } else if (errorCode === 'duplicate_email') {
            setError('이미 사용 중인 이메일입니다.');
          } else if (errorCode === 'duplicate_nickname') {
            setError('이미 사용 중인 닉네임입니다.');
          } else if (errorCode === 'image_not_found') {
            setError('업로드된 이미지를 찾을 수 없습니다.');
          } else if (errorCode === 'invalid_file_extension') {
            setError('지원하지 않는 파일 형식입니다. (jpg, jpeg, png, gif만 가능)');
          } else if (errorCode === 'invalid_content_type') {
            setError('지원하지 않는 콘텐츠 타입입니다.');
          } else if (errorCode === 'internal_server_error') {
            setError('서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
          } else {
            // 정의되지 않은 에러 코드는 코드와 함께 표시
            setError(`오류가 발생했습니다: ${errorCode}`);
          }
        } else if (err.response.status === 400) {
          setError('입력 정보가 유효하지 않습니다. 다시 확인해주세요.');
        } else if (err.response.status === 409) {
          setError('이미 등록된 이메일 또는 닉네임입니다.');
        } else if (err.response.status === 500) {
          setError('서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } else {
          setError(`회원가입 중 오류가 발생했습니다. (상태 코드: ${err.response.status})`);
        }
      } else if (err.request) {
        console.error('회원가입 요청만 전송되고 응답 없음:', err.request);
        setError('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
      } else {
        console.error('회원가입 요청 생성 중 오류:', err.message);
        setError('회원가입 요청 중 오류가 발생했습니다: ' + err.message);
      }
      
      console.log('회원가입 오류 처리 완료 ============================');
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    navigate('/login');
  };

  const goToMap = () => {
    navigate('/map');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 헤더 - 뒤로가기 버튼 추가 */}
      <header className="bg-white pt-2 pb-0 px-4 shadow-md flex items-center relative">
        <button onClick={goToMap} className="absolute left-4">
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

      <div className="flex-1 p-4 flex flex-col overflow-auto">
        <h1 className="text-xl font-bold text-center my-8 text-gray-800">회원가입</h1>
        
        {/* 오류 메시지 */}
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {/* 입력 폼 */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-4">
          <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mb-3 overflow-hidden">
            {profileImagePreview ? (
              <img
                src={URL.createObjectURL(profileImage)}
                alt="프로필 미리보기"
                className="w-full h-full object-cover"
              />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            )}
          </div>
            <label htmlFor="profile-upload" className="text-sm text-amber-800 font-medium cursor-pointer">
              프로필 사진 추가
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

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              <input
                type="email"
                placeholder="이메일을 입력하세요"
                className={`w-full p-3 border ${emailError ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-transparent`}
                required
                value={email}
                onChange={handleEmailChange}
                onBlur={handleEmailBlur}
              />
              {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
              <input
                type="password"
                placeholder="비밀번호를 입력하세요 (8자 이상)"
                className={`w-full p-3 border ${passwordError ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-transparent`}
                required
                value={password}
                onChange={handlePasswordChange}
              />
              {passwordError && <p className="text-xs text-red-500 mt-1">{passwordError}</p>}
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인</label>
              <input
                type="password"
                placeholder="비밀번호를 다시 입력하세요"
                className={`w-full p-3 border ${passwordError ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-transparent`}
                required
                value={passwordConfirm}
                onChange={handlePasswordConfirmChange}
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">닉네임</label>
              <input
                type="text"
                placeholder="닉네임을 입력하세요 (2~20자)"
                className={`w-full p-3 border ${nicknameError ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-transparent`}
                required
                value={nickname}
                onChange={handleNicknameChange}
                onBlur={handleNicknameBlur}
              />
              {nicknameError && <p className="text-xs text-red-500 mt-1">{nicknameError}</p>}
            </div>

            <button
              type="submit"
              className="w-full bg-amber-800 text-white p-3 rounded-md text-center font-medium mt-4 disabled:bg-amber-500"
              disabled={loading}
            >
              {loading ? '가입 처리 중...' : '등록 완료'}
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