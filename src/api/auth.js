import api from "./index";

// 배포환경
const apiURL = window._env_?.API_BASE_URL;

// 개발환경
// const apiURL = process.env.REACT_APP_API_BASE_URL;

// 회원가입
export const registerUser = (userData) => {
  console.log("회원가입 요청 데이터:", userData); // 데이터 확인용 로그
  const formData = new FormData();

  // 백엔드가 기대하는 필드명으로 변경
  formData.append("user_email", userData.user_email);
  formData.append("user_password", userData.user_password);
  formData.append("user_password_confirm", userData.user_password_confirm); // 다시 원래 필드명으로 변경
  formData.append("user_nickname", userData.user_nickname);
  if (userData.user_profileImage) {
    formData.append("user_profileImage", userData.user_profileImage);
  }

  // 디버그를 위해 formData 내용 확인
  console.log("FormData 내용:");
  for (let pair of formData.entries()) {
    console.log(
      pair[0] +
        ": " +
        (pair[0] === "user_password" || pair[0] === "user_password_confirm"
          ? "(보안상 로그 생략)"
          : pair[1])
    );
  }

  return api.post(`${apiURL}v1/users/signup`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    withCredentials: true,
  });
};

// 로그인
export const loginUser = (credentials) => {
  console.log("로그인 API 호출 시작");

  // 백엔드 API가 예상하는 필드명으로 변환
  const requestData = {
    user_email: credentials.email,
    user_password: credentials.password,
  };

  console.log("로그인 요청 데이터 구조:", {
    user_email: requestData.user_email,
    user_password: "(보안상 로그 생략)",
  });

  return api
    .post(`${apiURL}v1/users/login`, requestData)
    .then((response) => {
      console.log("로그인 API 응답 성공 상태코드:", response.status);

      // 헤더 정보 상세 로깅
      const headers = response.headers;
      console.log("로그인 API 응답 헤더:");
      for (let key in headers) {
        if (typeof headers[key] === "string") {
          console.log(`  ${key}: ${headers[key]}`);
        }
      }

      // 쿠키 헤더 확인
      console.log("Set-Cookie 헤더:", headers["set-cookie"]);

      console.log(
        "로그인 API 응답 데이터 구조:",
        JSON.stringify(response.data, null, 2)
      );

      // 사용자 정보 추출 시도
      let userData = null;
      if (response.data) {
        if (response.data.data) {
          userData = response.data.data;
        } else if (response.data.user) {
          userData = response.data.user;
        }
        console.log("추출된 사용자 데이터:", userData);
      }

      // 쿠키 확인
      console.log("로그인 후 document.cookie:", document.cookie);
      return response;
    })
    .catch((error) => {
      console.error("로그인 API 오류:", error);
      console.error("로그인 API 오류 응답:", error.response?.data);
      throw error;
    });
};

// 로그아웃
export const logoutUser = () => {
  console.log("로그아웃 API 호출 시작");
  return api
    .post(`${apiURL}v1/users/logout`)
    .then((response) => {
      console.log("로그아웃 API 응답 성공:", response.data);
      return response;
    })
    .catch((error) => {
      console.error("로그아웃 API 오류:", error);
      throw error;
    });
};

// 이메일 중복 확인
export const checkEmailDuplicate = (email) => {
  console.log("이메일 중복 확인 요청:", email);
  return api.get(
    `${apiURL}v1/users/check-email?email=${encodeURIComponent(email)}`
  );
};

// 닉네임 중복 확인
export const checkNicknameDuplicate = (nickname) => {
  console.log("닉네임 중복 확인 요청:", nickname);
  return api.get(
    `${apiURL}v1/users/check-nickname?nickname=${encodeURIComponent(nickname)}`
  );
};
