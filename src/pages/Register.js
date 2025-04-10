import React, { useEffect, useState, useRef } from 'react';

import { useNavigate } from 'react-router-dom';
import { registerUser, checkEmailDuplicate, checkNicknameDuplicate, sendEmailVerificationCode, verifyEmailCode } from '../api/auth';

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
  const [profileImageKey, setProfileImageKey] = useState(null);
  //이메일 인증 관련
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [serverVerificationCode, setServerVerificationCode] = useState('');

  // 파일 입력 요소에 대한 ref 추가 (component 시작 부분에)
  const fileInputRef = useRef(null);

  // 이메일 변경 핸들러
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setEmailError(null);
  };

  // 이메일 중복 체크
  const handleEmailBlur = async () => {
    // 이메일 형식 검사 - 사용자 이름@도메인.최상위도메인 형식 확인
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    
    if (!email) {
      setEmailError('이메일을 입력해 주세요.');
      return;
    }
    
    if (!emailRegex.test(email)) {
      setEmailError('example@email.com 형식의 올바른 이메일 주소를 입력해 주세요.');
      return;
    }
    
    // 흔한 오류 패턴 체크 (예: .com 뒤에 추가 문자)
    if (/\.com[a-zA-Z]+$/.test(email)) {
      setEmailError('올바르지 않은 최상위 도메인입니다. (.com, .net 등 확인)');
      return;
    }
    
    try {
      const response = await checkEmailDuplicate(email);
      ////console.log(...)
      
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

      // 429 에러(요청 제한) 처리 추가
      if (err.response && err.response.status === 429) {
        setEmailError('요청 횟수가 제한을 초과했습니다. 잠시 후 다시 시도해주세요.');
        return;
      }
      // 오류 발생 시 사용자 경험을 위해 일단 진행 가능하도록 허용
      setEmailError(null);
    }
  };

  const verifyCode = async () => {
    try {
      const response = await verifyEmailCode(email, verificationCode); // 백엔드에 인증 요청
      if (response.data && response.data.message === 'verify_email_success') {
        setIsEmailVerified(true);
        setShowVerificationModal(false);
        alert('이메일 인증이 완료되었습니다.');
      } else {
        alert('인증에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (err) {
      console.error("이메일 인증 오류:", err);
      alert('인증 코드가 일치하지 않습니다.');
    }
  };

  const handleSendVerificationCode = async () => {
    if (emailError || !email) {
      setEmailError('먼저 유효한 이메일을 입력해 주세요.');
      return;
    }
  
    try {
      const response = await sendEmailVerificationCode(email); // 이건 axios 요청으로 되어 있어야 함
      const data = response.data;
      if (data && data.code) {
        setServerVerificationCode(data.code);
        setShowVerificationModal(true);
      } else {
        setError('인증 메일 전송에 실패했습니다.');
      }
    } catch (err) {
      console.error('이메일 인증 오류:', err);
      setError('이메일 인증 요청 중 오류가 발생했습니다.');
    }
  };
  

  // 비밀번호 변경 핸들러
  // 비밀번호 변경 핸들러
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    
    // 비밀번호 유효성 검사 - 길이 및 포맷 체크
    const password = e.target.value;
    
    // 비밀번호 유효성 검사 정규식
    const validPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,20}$/;
    
    if (!validPasswordRegex.test(password)) {
      setPasswordError('8~20자의 영문 대/소문자, 숫자, 특수문자를 모두 사용해 주세요.');
    } else {
      setPasswordError(null);
      
      // 비밀번호 확인과 일치 여부 체크
      if (passwordConfirm && password !== passwordConfirm) {
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
    
    if (nickname.length > 10) {
      setNicknameError('닉네임은 10자 이내여야 합니다.');
      return;
    }
    
    try {
      const response = await checkNicknameDuplicate(nickname);
      ////console.log(...)
      
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

      // 429 에러(요청 제한) 처리 추가
      if (err.response && err.response.status === 429) {
        setNicknameError('요청 횟수가 제한을 초과했습니다. 잠시 후 다시 시도해주세요.');
        return;
      }
      // 오류 발생 시 사용자 경험을 위해 일단 진행 가능하도록 허용
      setNicknameError(null);
    }
  };

  // 프로필 이미지 변경 핸들러 수정
  const handleProfileImageChange = (e) => {
    const file = e.target.files?.[0];
  
    if (file) {
      // ✅ 새 파일 선택 시
      // 파일 크기 체크 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('프로필 이미지 크기는 5MB 이하여야 합니다.');
        return;
      }
      
      // 파일 타입 체크 (필요하다면 추가)
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        setError("지원하지 않는 파일 형식입니다. (jpg, jpeg, png, gif만 가능)");
        return;
      }
      
      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
    } else {
      // ✅ 파일 선택 취소 시
      setProfileImage(null);
      setProfileImagePreview(null);
    }
  
    // ✅ 항상 초기화해서 onChange가 다시 작동하도록
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  

  // 파일 입력 요소 클릭 시 처리 - 단순화
  const handleProfileImageClick = (e) => {
    // 이미 input의 value는 빈 값으로 재설정됨 (onChange 핸들러에서)
    ////console.log(...)
  };


  // 추가: 컴포넌트 상태 추가
  const [profileImagePreview, setProfileImagePreview] = useState(null);

  // 상태 로깅용 useEffect만 유지 (디버깅용)
  useEffect(() => {
  }, [profileImage, profileImagePreview]);

    // 회원가입 폼 제출 핸들러
    const handleRegister = async (e) => {
      e.preventDefault();

      // 🔐 이메일 인증 여부 확인
      if (!isEmailVerified) {
        setError('이메일 인증을 먼저 완료해주세요.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
    
    try {
      const userData = {
        user_email: email,
        user_password: password,
        user_password_confirm: passwordConfirm,
        user_nickname: nickname,
        user_profileImage: profileImage // null이면 서버에서 이미지 없음으로 처리
      };
      
      // auth API 모듈 활용
      const response = await registerUser(userData);

      console.log(response);
      
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
            setError('닉네임은 10자 이내여야 합니다.');
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
        } else if (err.response.status === 429) {
          setError('요청 횟수가 제한을 초과했습니다. 잠시 후 다시 시도해주세요.');
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
      
      ////console.log(...)
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

  // 프로필 이미지 삭제를 위한 함수 추가
  const handleRemoveProfileImage = () => {
    setProfileImage(null);  // null로 설정하여 제거 요청
    setProfileImagePreview(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col h-full bg-amber-50">
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
            className="h-14 w-28 object-cover cursor-pointer"
            onClick={() => navigate('/map')}
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

        {showVerificationModal && (
          
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-80">
              <h2 className="text-lg font-bold mb-4 text-center text-amber-800">이메일 인증</h2>
              <p className="text-sm mb-3">이메일로 전송된 인증 코드를 입력해 주세요.</p>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="인증 코드 입력"
                className="w-full p-2 border border-gray-300 rounded-md mb-4"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    verifyCode();
                  }
                }}
              />
              <button onClick={handleSendVerificationCode}>인증</button>
              <div className="flex justify-between">
                <button
                  onClick={() => setShowVerificationModal(false)}
                  className="text-gray-600 px-3 py-1 hover:underline"
                >
                  닫기
                </button>
                <button
                  onClick={verifyCode}
                  className="bg-amber-800 text-white px-4 py-1 rounded-md"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}
                
        {/* 입력 폼 */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-4">
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              {profileImagePreview && (
                <button 
                  type="button"
                  onClick={handleRemoveProfileImage}
                  className="absolute -top-2 -right-2 text-gray-700 z-10"
                  aria-label="프로필 이미지 삭제"
                >
                  <span className="text-xl font-medium">×</span>
                </button>
              )}
              <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center mb-3 overflow-hidden">
                {profileImagePreview ? (
                  <img
                    src={profileImagePreview}
                    alt="프로필 미리보기"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-amber-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                )}
              </div>
            </div>
            <label htmlFor="profile-upload" className="text-sm text-amber-800 font-medium cursor-pointer">
              프로필 사진 추가
              <input
                id="profile-upload"
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                onClick={handleProfileImageClick}
                ref={fileInputRef}
                className="hidden"
              />
            </label>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
          <div className="relative">
  <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="이메일을 입력하세요"
                  className={`flex-1 p-3 border ${emailError ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-transparent`}
                  required
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={handleEmailBlur}
                  disabled={isEmailVerified}
                />
                {!isEmailVerified && (
                  <button
                    type="button"
                    onClick={handleSendVerificationCode}
                    className="whitespace-nowrap bg-amber-800 text-white px-3 py-2 rounded-md text-sm"
                  >
                    인증
                  </button>
                )}
              </div>
              {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
              {isEmailVerified && <p className="text-xs text-green-600 mt-1">✔ 이메일 인증 완료</p>}
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
                placeholder="닉네임을 입력하세요 (10자 이내)"
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