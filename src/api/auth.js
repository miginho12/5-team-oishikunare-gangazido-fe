import api from './index';

// 회원가입
export const registerUser = (userData) => {
  const formData = new FormData();
  formData.append("user_email", userData.user_email);
  formData.append("user_password", userData.user_password);
  formData.append("user_nickname", userData.user_nickname);
  if (userData.user_profile_image) {
    formData.append("user_profile_image", userData.user_profile_image);
  }
  return api.post("/v1/users/signup", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// 로그인
export const loginUser = (credentials) => {
  return api.post("/v1/users/login", credentials);
};

// 로그아웃
export const logoutUser = () => {
  return api.post("/v1/users/logout");
};