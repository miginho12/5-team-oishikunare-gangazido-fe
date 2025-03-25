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
export const changePassword = async (passwordData) => {
  try {

    console.log('비밀번호 변경 요청 데이터:', passwordData);

    const data = {
      current_password: passwordData.currentPassword,
      new_password: passwordData.newPassword,
      confirm_password: passwordData.newPasswordConfirm
    };
    
    console.log('서버에 전송되는 데이터:', data);
    
    const response = await api.patch('/v1/users/me/password', data);
    console.log('서버 응답:', response);
    return response.data;
  } catch (error) {
    console.error('비밀번호 변경 API 오류:', error);
    if (error.response) {
      console.error('오류 상태:', error.response.status);
      console.error('오류 데이터:', error.response.data);
    }
    throw error;
  }
};