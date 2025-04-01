import api from "./index";

// 반려동물 등록
export const registerPet = async (petData) => {
  let profileImageKey = null;

  // 이미지가 새로 업로드된 파일이면 S3에 업로드
  if (petData.profileImage instanceof File) {
    const extension = petData.profileImage?.name?.split('.')?.pop() || 'png';
    const res = await api.post("/v1/pets/me/presigned", {
      fileExtension: `.${extension}`,
      contentType: petData.profileImage.type,
    });
    const { presignedUrl, fileKey } = res.data;

    console.log("🚀 S3 업로드 URL:", presignedUrl);
    
    try {
      const uploadRes = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": petData.profileImage.type },
        body: petData.profileImage,
      });

      if (!uploadRes.ok) {
        throw new Error(`S3 업로드 실패: ${uploadRes.statusText}`);
      }

      profileImageKey = fileKey;
    } catch (err) {
      console.error("❌ S3 이미지 업로드 실패:", err);
      throw new Error("이미지 업로드에 실패했습니다.");
    }
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
    formData.append("profileImage", profileImageKey); // 문자열로 key 전달
  }
  await api.post("/v1/pets/me", formData);

  // ✅ key를 리턴해줌
  return profileImageKey;
};

// // 반려동물 조회
// export const getPetInfo = () => {
//   return api.get(`/v1/pets/me`);
// };

// // 반려동물 수정
// export const updatePetInfo = async(petData) => {
//   let profileImageKey = null;

//   if (petData.profileImage instanceof File) {
//     const extension = petData.profileImage?.name?.split('.')?.pop() || 'png';
//     const res = await api.post("/v1/pets/me/presigned", {
//       fileExtension: `.${extension}`,
//       contentType: petData.profileImage.type,
//     });
//     const { presignedUrl, fileKey } = res.data;

//     await fetch(presignedUrl, {
//       method: "PUT",
//       headers: { "Content-Type": petData.profileImage.type },
//       body: petData.profileImage,
//     });

//     profileImageKey = fileKey;
//   } else if (typeof petData.profileImage === "string") {
//     profileImageKey = petData.profileImage;
//   }

//   const formData = new FormData();
//   formData.append("name", petData.name);
//   formData.append("age", petData.age);
//   formData.append("gender", petData.gender);
//   formData.append("breed", petData.breed);
//   formData.append("weight", petData.weight);
//   if (profileImageKey) {
//     formData.append("profileImage", profileImageKey); // 문자열로 전달
//   }

//   return api.patch("/v1/pets/me", formData);
// };

// 반려동물 삭제
export const deletePet = () => {
  return api.delete(`/v1/pets/me`);
};