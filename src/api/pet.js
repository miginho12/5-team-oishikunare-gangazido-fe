import api from "./index";

// 🟢 이미지 업로드 전용 함수
export const uploadPetImage = async (file) => {
  const ext = file.name.split('.').pop() || 'png';
  const res = await api.post("/v1/pets/me/presigned", {
    fileExtension: `.${ext}`,
    contentType: file.type,
  });

  const { presignedUrl, fileKey } = res.data;

  await fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  return fileKey; // S3 키 반환
};

// 🟢 이미지 키를 받아 반려견 등록
export const registerPet = async (petData) => {
  const formData = new FormData();
  formData.append("name", petData.name);
  formData.append("age", petData.age);
  formData.append("gender", petData.gender);
  formData.append("breed", petData.breed);
  formData.append("weight", petData.weight);
  if (petData.profileImage) {
    formData.append("profileImage", petData.profileImage); // 문자열 키
  }

  await api.post("/v1/pets/me", formData);
};

// 반려동물 조회
export const getPetInfo = () => {
  return api.get(`/v1/pets/me`);
};

// 반려동물 수정
export const updatePetInfo = async(petData) => {
  const formData = new FormData();
  formData.append("name", petData.name);
  formData.append("age", petData.age);
  formData.append("gender", petData.gender);
  formData.append("breed", petData.breed);
  formData.append("weight", petData.weight);

  // 상황 1: 이미지 완전 삭제 요청 (파일창 열고 '취소' 누른 케이스)
  if (petData.profileImage === null) {
    formData.append("profileImage", ""); // 백엔드에 이미지 삭제 요청
  }

  // 상황 2: 새 이미지 선택한 경우 -> presigned URL 업로드 후 key 전달
  else if (petData.profileImage instanceof File) {
    const extension = petData.profileImage?.name?.split('.')?.pop() || 'png';
    const res = await api.post("/v1/pets/me/presigned", {
      fileExtension: `.${extension}`,
      contentType: petData.profileImage.type,
    });
    const { presignedUrl, fileKey } = res.data;

    await fetch(presignedUrl, {
      method: "PUT",
      headers: { "Content-Type": petData.profileImage.type },
      body: petData.profileImage,
    });

    formData.append("profileImage", fileKey); // 업로드한 키 전송
  }

  // 상황 3. 기존 S3 키 그대로 유지 (수정 안 했을 경우)
  else if (typeof petData.profileImage === "string") {
    formData.append("profileImage", petData.profileImage);
  }

  // 상황 4. undefined면 아무 것도 안 보냄 (기존 백엔드 유지 전략)

  return api.patch("/v1/pets/me", formData);
};

// 반려동물 삭제
export const deletePet = () => {
  return api.delete(`/v1/pets/me`);
};

export const getPetInfoByUserId = async (userId) => {
  return api.get(`/v1/pets/me/public/${userId}`);
};

// // 반려동물 건강 정보 조회
// export const getPetHealthInfo = () => {
//   return api.get(`/v1/pets/me/health`);
// };

// // 반려동물 산책 기록 조회
// export const getPetWalkRecords = (period = 'week') => {
//   return api.get(`/v1/pets/me/walks?period=${period}`);
// };

// // 반려동물 특정 날짜의 산책 기록 조회
// export const getPetWalkRecordsByDate = (date) => {
//   return api.get(`/v1/pets/me/walks/daily?date=${date}`);
// };

// // 반려동물 산책 기록 추가
// export const addPetWalkRecord = (walkData) => {
//   return api.post('/v1/pets/me/walks', walkData);
// };