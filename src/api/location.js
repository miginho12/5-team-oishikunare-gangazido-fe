import api from "./index";

// 배포환경
// const apiURL = window._env_?.API_BASE_URL;

// 개발환경
const apiURL = process.env.REACT_APP_API_BASE_URL;

// 현재 위치 조회
export const getLocation = () => {
  return api.post(`${apiURL}/v1/locations`);
};
