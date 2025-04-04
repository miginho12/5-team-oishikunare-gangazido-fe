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
  let profileImageKey = null;

  // 🟡 새 파일 업로드 시 presigned URL 사용
  if (petData.profileImage instanceof File) {
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

    profileImageKey = fileKey;
  } else if (typeof petData.profileImage === "string") {
    // 🟡 기존 이미지 키 유지
    profileImageKey = petData.profileImage;
  }

  const formData = new FormData();
  formData.append("name", petData.name);
  formData.append("age", petData.age);
  formData.append("gender", petData.gender);
  formData.append("breed", petData.breed);
  formData.append("weight", petData.weight);

  // ✅ 이미지 관련 조건 처리
  if (petData.profileImage === null) {
    formData.append("profileImage", "");  // 삭제 명시
  } else if (profileImageKey) {
    formData.append("profileImage", profileImageKey);  // 새 이미지 또는 기존 이미지 유지
  }
  // ✅ profileImage가 undefined인 경우에는 아무 것도 append 하지 않음 (변경 없음 의미)

  return api.patch("/v1/pets/me", formData);
};

// 반려동물 삭제
export const deletePet = () => {
  return api.delete(`/v1/pets/me`);
};