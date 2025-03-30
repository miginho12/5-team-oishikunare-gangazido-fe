import api from "./index";

// 배포환경
const apiURL = window._env_?.API_BASE_URL;

// 개발환경
//const apiURL = process.env.REACT_APP_API_BASE_URL;

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
  return api.post(`${apiURL}/v1/pets/me`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// 반려동물 조회
export const getPetInfo = () => {
  return api.get(`${apiURL}/v1/pets/me`);
};

// 반려동물 수정
export const updatePetInfo = (formData) => {
  return api.patch(`${apiURL}/v1/pets/me`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// 반려동물 삭제
export const deletePet = () => {
  return api.delete(`${apiURL}/v1/pets/me`);
};
