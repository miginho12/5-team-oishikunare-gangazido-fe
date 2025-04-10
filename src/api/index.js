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

// 인증 에러 발생 시 리다이렉트 여부를 결정하는 변수
let isRedirecting = false;

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
    
    // 401 Unauthorized 에러 처리
    if (error.response && error.response.status === 401) {
      if (!isRedirecting) {
        isRedirecting = true;
        console.log('인증이 필요합니다. 로그인 페이지로 이동합니다.');
        
        // localStorage에서 로그인 관련 데이터 삭제
        localStorage.removeItem('user');
        
        // 로그인 페이지로 리다이렉트
        window.location.href = '/login';
        
        // 잠시 후 리다이렉트 상태 초기화 (다중 리다이렉트 방지)
        setTimeout(() => {
          isRedirecting = false;
        }, 3000);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;