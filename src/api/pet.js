import api from "./index";

// 반려동물 등록
export const registerPet = (petData) => {
  const formData = new FormData();
  formData.append("name", petData.name);
  formData.append("age", petData.age);
  formData.append("gender", petData.gender);
  formData.append("breed", petData.breed);
  formData.append("weight", petData.weight);
  if (petData.profileImage) {
    formData.append("profileImage", petData.profileImage);
  }
  return api.post(`/v1/pets/me`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// 반려동물 조회
export const getPetInfo = () => {
  return api.get(`/v1/pets/me`);
};

// 반려동물 수정
export const updatePetInfo = (formData) => {
  return api.patch(`/v1/pets/me`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// 반려동물 삭제
export const deletePet = () => {
  return api.delete(`/v1/pets/me`);
};
