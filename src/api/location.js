import api from './index';
const apiURL = window.env?.API_BASE_URL;

// 현재 위치 조회
export const getLocation = () => {
  return api.post(`${apiURL}/v1/locations`);
};
