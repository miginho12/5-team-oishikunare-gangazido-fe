import api from './index';

// 추가할 함수: 회원가입용 presigned URL 획득
export const getSignupProfileImageUploadUrl = (fileInfo) => {
  return api.post("/v1/users/signup/profile-image-upload-url", fileInfo);
};

// S3에 이미지 직접 업로드 함수
export const uploadImageToS3 = async (presignedUrl, file, contentType) => {
  try {
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType
      },
      body: file,
      credentials: 'omit' // S3 업로드 시 쿠키 제외
    });
    
    if (!response.ok) {
      throw new Error(`이미지 업로드 실패: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error('S3 업로드 실패:', error);
    throw error;
  }
};

// registerUser 함수 수정
export const registerUser = async (userData) => {
  console.log('회원가입 요청 데이터:', userData);
  
  try {
    // 이미지가 있으면 S3에 업로드
    let profileImageKey = null;
    
    if (userData.user_profileImage) {
      const file = userData.user_profileImage;
      const fileExtension = `.${file.name.split('.').pop().toLowerCase()}`;
      const contentType = file.type;
      
      // 1. presigned URL 획득
      const presignedResponse = await getSignupProfileImageUploadUrl({
        fileExtension,
        contentType
      });
      
      const { presignedUrl, fileKey } = presignedResponse.data.data;
      console.log('획득한 presigned URL:', presignedUrl);
      console.log('파일 키:', fileKey);
      
      // 2. S3에 직접 업로드
      await uploadImageToS3(presignedUrl, file, contentType);
      console.log('S3 업로드 완료');
      
      profileImageKey = fileKey;
    }
    
    // 회원가입 데이터 준비
    const signupData = {
      user_email: userData.user_email,
      user_password: userData.user_password,
      user_password_confirm: userData.user_password_confirm,
      user_nickname: userData.user_nickname
    };
    
    // 이미지 키가 있으면 추가
    if (profileImageKey) {
      signupData.profile_image_key = profileImageKey;
    }
    
    console.log('회원가입 요청 데이터:', {
      ...signupData,
      user_password: '(보안상 로그 생략)',
      user_password_confirm: '(보안상 로그 생략)'
    });
    
    // 회원가입 API 호출 - Content-Type이 application/json으로 변경됨
    return api.post("/v1/users/signup", signupData);
  } catch (error) {
    console.error('회원가입 처리 중 오류:', error);
    throw error;
  }
};

// 로그인
export const loginUser = (credentials) => {
  console.log('로그인 API 호출 시작');
  
  // 백엔드 API가 예상하는 필드명으로 변환
  const requestData = {
    user_email: credentials.email,
    user_password: credentials.password
  };
  
  console.log('로그인 요청 데이터 구조:', {
    user_email: requestData.user_email,
    user_password: '(보안상 로그 생략)'
  });
  
  return api.post("/v1/users/login", requestData)
    .then(response => {
      console.log('로그인 API 응답 성공 상태코드:', response.status);
      
      // 헤더 정보 상세 로깅
      const headers = response.headers;
      console.log('로그인 API 응답 헤더:');
      for (let key in headers) {
        if (typeof headers[key] === 'string') {
          console.log(`  ${key}: ${headers[key]}`);
        }
      }
      
      // 쿠키 헤더 확인 
      console.log('Set-Cookie 헤더:', headers['set-cookie']);
      
      console.log('로그인 API 응답 데이터 구조:', JSON.stringify(response.data, null, 2));
      
      // 사용자 정보 추출 시도
      let userData = null;
      if (response.data) {
        if (response.data.data) {
          userData = response.data.data;
        } else if (response.data.user) {
          userData = response.data.user;
        }
        console.log('추출된 사용자 데이터:', userData);
      }
      
      // 쿠키 확인
      console.log('로그인 후 document.cookie:', document.cookie);
      return response;
    })
    .catch(error => {
      console.error('로그인 API 오류:', error);
      console.error('로그인 API 오류 응답:', error.response?.data);
      throw error;
    });
};

// 로그아웃
export const logoutUser = () => {
  console.log('로그아웃 API 호출 시작');
  return api.post("/v1/users/logout")
    .then(response => {
      console.log('로그아웃 API 응답 성공:', response.data);
      return response;
    })
    .catch(error => {
      console.error('로그아웃 API 오류:', error);
      throw error;
    });
};

// 이메일 중복 확인
export const checkEmailDuplicate = (email) => {
  console.log('이메일 중복 확인 요청:', email);
  return api.get(`/v1/users/check-email?email=${encodeURIComponent(email)}`);
};

// 닉네임 중복 확인
export const checkNicknameDuplicate = (nickname) => {
  console.log('닉네임 중복 확인 요청:', nickname);
  return api.get(`/v1/users/check-nickname?nickname=${encodeURIComponent(nickname)}`);
};