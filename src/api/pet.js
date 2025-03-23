import api from './index';

// 반려동물 등록
export const registerPet = (petData) => {
  const formData = new FormData();
  formData.append("pet_name", petData.pet_name);
  formData.append("pet_age", petData.pet_age);
  formData.append("pet_gender", petData.pet_gender);
  formData.append("pet_breed", petData.pet_breed);
  formData.append("pet_weight", petData.pet_weight);
  if (petData.pet_profile_image) {
    formData.append("pet_profile_image", petData.pet_profile_image);
  }
  return api.post("/v1/pets/me", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// 반려동물 조회
export const getPetInfo = () => {
  return api.get("/v1/pets/me");
};

// 반려동물 수정
export const updatePetInfo = (petData) => {
  const formData = new FormData();
  formData.append("pet_name", petData.pet_name);
  formData.append("pet_age", petData.pet_age);
  formData.append("pet_gender", petData.pet_gender);
  formData.append("pet_breed", petData.pet_breed);
  formData.append("pet_weight", petData.pet_weight);
  if (petData.pet_profile_image) {
    formData.append("pet_profile_image", petData.pet_profile_image);
  }
  return api.patch("/v1/pets/me", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// 반려동물 삭제
export const deletePet = () => {
  return api.delete("/v1/pets/me");
};