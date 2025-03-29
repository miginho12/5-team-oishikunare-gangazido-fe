import api from './index';

// 배포환경
// const apiURL = window._env_?.API_BASE_URL;

// 개발환경
const apiURL = process.env.REACT_APP_API_BASE_URL;

// 내 정보 조회
export const getUserInfo = () => {
  return api.get(`${apiURL}v1/users/me`);
};

// 내 정보 수정
export const updateUserInfo = (userData) => {
  const formData = new FormData();
  formData.append("user_nickname", userData.user_nickname);
  if (userData.user_profile_image) {
    formData.append("user_profile_image", userData.user_profile_image);
  }
  return api.patch(`${apiURL}v1/users/me`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// 회원 탈퇴
export const deleteUser = async () => {
  try {
    console.log('회원탈퇴 API 요청 시작');
    const response = await api.delete(`${apiURL}v1/users/me`);
    console.log('회원탈퇴 API 응답:', response);
    
    // 응답 데이터 확인 - 응답에 사용자 정보 삭제 확인 필드가 있는지 검증
    if (response.data && response.data.message) {
      console.log('회원탈퇴 메시지:', response.data.message);
    }
    
    return response.data;
  } catch (error) {
    console.error('회원탈퇴 API 오류:', error);
    if (error.response) {
      console.error('오류 상태:', error.response.status);
      console.error('오류 데이터:', error.response.data);
    }
    throw error;
  }
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
    
    const response = await api.patch(`${apiURL}v1/users/me/password`, data);
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