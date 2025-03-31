import axios from "axios";

const apiClient = axios.create({
  // 배포환경
  // baseURL: window._env_?.API_BASE_URL || "http://localhost:8080",

  //개발환경
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080',

  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// 요청 인터셉터 추가
apiClient.interceptors.request.use(
  (config) => {
    console.log("API 요청 시작:", config.method.toUpperCase(), config.url);
    console.log("요청 헤더:", config.headers);
    if (config.data) {
      console.log(
        "요청 데이터:",
        config.data instanceof FormData ? "(FormData 객체)" : config.data
      );
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
    console.log("API 응답 성공:", response.status, response.config.url);
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
