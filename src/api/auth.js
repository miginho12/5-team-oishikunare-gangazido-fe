import api from './index';

// 회원가입
export const registerUser = (userData) => {
  console.log('회원가입 요청 데이터:', userData); // 데이터 확인용 로그
  const formData = new FormData();
  
  // 백엔드가 기대하는 필드명으로 변경
  formData.append("user_email", userData.user_email);
  formData.append("user_password", userData.user_password);
  formData.append("user_password_confirm", userData.user_password_confirm); // 다시 원래 필드명으로 변경
  formData.append("user_nickname", userData.user_nickname);
  if (userData.user_profileImage) {
    formData.append("user_profile_image", userData.user_profileImage);
  }
  
  // 디버그를 위해 formData 내용 확인
  console.log('FormData 내용:');
  for (let pair of formData.entries()) {
    console.log(pair[0] + ': ' + (pair[0] === 'user_password' || pair[0] === 'user_password_confirm' ? '(보안상 로그 생략)' : pair[1]));
  }
  
  return api.post("/v1/users/signup", formData, {
    headers: { 
      "Content-Type": "multipart/form-data",
    },
    withCredentials: true
  });
};

// 로그인
export const loginUser = (credentials) => {
  console.log('로그인 요청 데이터:', {
    email: credentials.email,
    password: '(보안상 로그 생략)'
  }); // 데이터 확인용 로그
  return api.post("/v1/users/login", credentials);
};

// 로그아웃
export const logoutUser = () => {
  return api.post("/v1/users/logout");
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