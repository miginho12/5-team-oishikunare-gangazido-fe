import axios from "axios";
import api from "./index";

// 반려동물 등록
export const registerPet = async (formData) => {
  const file = formData.get('profileImage');
  let fileKey = null;

  if (file && file instanceof File) {
    const presignedRes = await axios.post(
      `${process.env.REACT_APP_API_URL}/v1/pets/me/presigned`,
      { fileName: file.name },
      { withCredentials: true }
    );
    fileKey = presignedRes.data.data.key;

    await axios.put(presignedRes.data.data.presignedUrl, file, {
      headers: { 'Content-Type': file.type },
    });

    formData.set('profileImage', fileKey);
  }

  await axios.post(
    `${process.env.REACT_APP_API_URL}/v1/pets/me`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true,
    }
  );

  return fileKey;
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

