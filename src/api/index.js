import axios from "axios";

const baseURL =
  process.env.NODE_ENV === "development"
    ? process.env.REACT_APP_API_BASE_URL
    : window._env_?.API_BASE_URL;

const apiClient = axios.create({
  baseURL, // ✅ 공통 baseURL 사용
  withCredentials: true,
  headers: {
        // "Content-Type": "application/json", // 레첼 formdata 때매 주석처리 자동 설정 된다함

  },
});

// 요청 인터셉터 추가
apiClient.interceptors.request.use(
  (config) => {
    ////console.log(...)
    ////console.log(...)
    if (config.data) {
      //console.log(...)
    }
    return config;
  },
  (error) => {
    console.error("API 요청 오류:", error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 추가
apiClient.interceptors.response.use(
  (response) => {
    ////console.log(...)
    return response;
  },
  (error) => {
    console.error(
      "API 응답 오류:",
      error.response
        ? `${error.response.status} (${error.response.config.url})`
        : error.message
    );
    if (error.response && error.response.data) {
      console.error("오류 응답 데이터:", error.response.data);
    }
    return Promise.reject(error);
  }
);

export default apiClient;