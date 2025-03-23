import api from './index';

// 내 정보 조회
export const getUserInfo = () => {
  return api.get("/v1/users/me");
};

// 내 정보 수정
export const updateUserInfo = (userData) => {
  const formData = new FormData();
  formData.append("user_nickname", userData.user_nickname);
  if (userData.user_profile_image) {
    formData.append("user_profile_image", userData.user_profile_image);
  }
  return api.patch("/v1/users/me", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// 회원 탈퇴
export const deleteUser = () => {
  return api.delete("/v1/users/me");
};

// 비밀번호 변경
export const changePassword = (passwordData) => {
  return api.patch("/v1/users/me/password", passwordData);
};