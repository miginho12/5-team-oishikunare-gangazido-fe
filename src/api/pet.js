import api from "./index";

// presigned URL 받아오기
const getPetPresignedUrl = async (file) => {
  const ext = file.name.split('.').pop() || 'png';
  const res = await api.post("/v1/pets/me/presigned", {
    fileExtension: `.${ext}`,
    contentType: file.type,
  });
  return res.data;
};

// 반려동물 등록
export const registerPet = async (petData) => {
  let profileImageKey = null;

  if (petData.profileImage instanceof File) {
    const { presignedUrl, fileKey } = await getPetPresignedUrl(petData.profileImage);
    await fetch(presignedUrl, {
      method: "PUT",
      headers: { "Content-Type": petData.profileImage.type },
      body: petData.profileImage,
    });
    profileImageKey = fileKey;
  } else if (typeof petData.profileImage === "string") {
    profileImageKey = petData.profileImage;
  }

  const formData = new FormData();
  formData.append("name", petData.name);
  formData.append("age", petData.age);
  formData.append("gender", petData.gender);
  formData.append("breed", petData.breed);
  formData.append("weight", petData.weight);
  if (profileImageKey) {
    formData.append("profileImage", profileImageKey);
  }

  await api.post("/v1/pets/me", formData);
  return profileImageKey;
};

// 반려동물 조회
export const getPetInfo = () => {
  return api.get(`/v1/pets/me`);
};

// 반려동물 수정
export const updatePetInfo = async(petData) => {
  let profileImageKey = null;

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
    profileImageKey = petData.profileImage;
  }

  const formData = new FormData();
  formData.append("name", petData.name);
  formData.append("age", petData.age);
  formData.append("gender", petData.gender);
  formData.append("breed", petData.breed);
  formData.append("weight", petData.weight);
  if (profileImageKey) {
    formData.append("profileImage", profileImageKey); // 문자열로 전달
  }

  return api.patch("/v1/pets/me", formData);
};

// 반려동물 삭제
export const deletePet = () => {
  return api.delete(`/v1/pets/me`);
};