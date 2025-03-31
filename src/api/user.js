import api from './index';

// S3 URL을 CloudFront URL로 변환하는 함수
const convertToCloudFrontUrl = (url) => {
  if (!url) return url;
  
  // S3 URL 패턴 확인 (https://bucket-name.s3.region.amazonaws.com/path)
  const s3Pattern = /https:\/\/(.+?)\.s3\.(.+?)\.amazonaws\.com\/(.+)/;
  
  if (s3Pattern.test(url)) {
    // S3 URL에서 키(경로) 부분만 추출
    const key = url.match(s3Pattern)[3];
    // CloudFront 도메인으로 URL 생성
    return `https://dxxxxxxxx.cloudfront.net/${key}`;
  }
  
  return url; // S3 URL이 아닌 경우 원래 URL 반환
};

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
  return api.get(`/v1/users/me`)
    .then(response => {
      // 응답에 프로필 이미지 URL이 있으면 CloudFront URL로 변환
      if (response.data && response.data.data && response.data.data.profileImage) {
        response.data.data.profileImage = convertToCloudFrontUrl(response.data.data.profileImage);
      }
      return response;
    });
};

// updateUserInfo 함수 수정
export const updateUserInfo = async (userData) => {
  try {
    // 이미지가 있으면 S3에 업로드
    let profileImageKey = null;
    
    if (userData.user_profile_image) {
      const file = userData.user_profile_image;
      const fileExtension = `.${file.name.split('.').pop().toLowerCase()}`;
      const contentType = file.type;
      
      // 1. presigned URL 획득
      const presignedResponse = await getProfileImageUploadUrl({
        fileExtension,
        contentType
      });
      
      const { presignedUrl, fileKey } = presignedResponse.data.data;
      
      // 2. S3에 직접 업로드
      await uploadImageToS3(presignedUrl, file, contentType);
      
      profileImageKey = fileKey;
    }
    
    // 업데이트 데이터 준비
    const updateData = {
      user_nickname: userData.user_nickname
    };
    
    // 이미지 키가 있으면 추가
    if (profileImageKey) {
      updateData.profile_image_key = profileImageKey;
    }
    
    // Content-Type이 application/json으로 변경됨
    const response = await api.patch("/v1/users/me", updateData);
    
    // 응답에 프로필 이미지 URL이 있으면 CloudFront URL로 변환
    if (response.data && response.data.data && response.data.data.profileImage) {
      response.data.data.profileImage = convertToCloudFrontUrl(response.data.data.profileImage);
    }
    
    return response;
  } catch (error) {
    console.error('사용자 정보 업데이트 실패:', error);
    throw error;
  }
};

// 회원 탈퇴
export const deleteUser = async () => {
  try {
    console.log("회원탈퇴 API 요청 시작");
    const response = await api.delete(`/v1/users/me`);
    console.log("회원탈퇴 API 응답:", response);

    // 응답 데이터 확인 - 응답에 사용자 정보 삭제 확인 필드가 있는지 검증
    if (response.data && response.data.message) {
      console.log("회원탈퇴 메시지:", response.data.message);
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
    console.log("비밀번호 변경 요청 데이터:", passwordData);

    const data = {
      current_password: passwordData.currentPassword,
      new_password: passwordData.newPassword,
      confirm_password: passwordData.newPasswordConfirm,
    };

    console.log("서버에 전송되는 데이터:", data);

    const response = await api.patch(`/v1/users/me/password`, data);
    console.log("서버 응답:", response);
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
