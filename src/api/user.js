import api from './index';

// 추가할 함수: 프로필 이미지 업로드 URL 획득
export const getProfileImageUploadUrl = (fileInfo) => {
  return api.post("/v1/users/profile-image-upload-url", fileInfo);
};

// S3에 이미지 직접 업로드 함수 (auth.js와 중복될 수 있으므로 별도 파일로 분리하는 것이 좋음)
export const uploadImageToS3 = async (presignedUrl, file, contentType) => {
  try {
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType
      },
      body: file,
      credentials: 'omit'
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


// 내 정보 조회
export const getUserInfo = () => {
  return api.get(`/v1/users/me`);
};

export const updateUserInfo = async (userData) => {
  try {
    // 업데이트 데이터 준비
    const updateData = {
      user_nickname: userData.user_nickname
    };
    
    // 프로필 이미지 처리 로직
    if (userData.user_profile_image) {
      // 새 이미지가 있으면 업로드
      const file = userData.user_profile_image;
      const fileExtension = `.${file.name.split('.').pop().toLowerCase()}`;
      const contentType = file.type;
      
      // 1. presigned URL 획득
      const presignedResponse = await getProfileImageUploadUrl({
        fileExtension,
        contentType
      });
      
      const { presignedUrl, fileKey } = presignedResponse.data.data;
      
      console.log('S3 업로드 전 파일 정보:', file);
      console.log('presigned URL 응답:', presignedResponse.data);

      // 2. S3에 직접 업로드
      await uploadImageToS3(presignedUrl, file, contentType);
      
      // 새 이미지 키 설정
      updateData.profile_image_key = fileKey;
    } else if (userData.removeProfileImage === true) {
      // 이미지 제거 요청 - 명시적으로 null 설정
      updateData.profile_image_key = null;
    }
    
    console.log('서버로 보내는 최종 데이터:', updateData);
    
    // API 호출
    const response = await api.patch("/v1/users/me", updateData);
    
    return response;
  } catch (error) {
    console.error('사용자 정보 업데이트 실패:', error);
    throw error;
  }
};

// 회원 탈퇴
export const deleteUser = async () => {
  try {
    ////console.log(...)
    const response = await api.delete(`/v1/users/me`);
    ////console.log(...)

    // 응답 데이터 확인 - 응답에 사용자 정보 삭제 확인 필드가 있는지 검증
    if (response.data && response.data.message) {
      ////console.log(...)
    }

    return response.data;
  } catch (error) {
    console.error("회원탈퇴 API 오류:", error);
    if (error.response) {
      console.error("오류 상태:", error.response.status);
      console.error("오류 데이터:", error.response.data);
    }
    throw error;
  }
};

// 비밀번호 변경
export const changePassword = async (passwordData) => {
  try {
    ////console.log(...)

    const data = {
      current_password: passwordData.currentPassword,
      new_password: passwordData.newPassword,
      confirm_password: passwordData.newPasswordConfirm,
    };

    ////console.log(...)

    const response = await api.patch(`/v1/users/me/password`, data);
    ////console.log(...)
    return response.data;
  } catch (error) {
    console.error("비밀번호 변경 API 오류:", error);
    if (error.response) {
      console.error("오류 상태:", error.response.status);
      console.error("오류 데이터:", error.response.data);
    }
    throw error;
  }
};

// userId로 닉네임 가져오는 API 제리추가
export const getNicknameByUserId = (userId) => {
  return api.get(`/v1/users/${userId}/nickname`);
};