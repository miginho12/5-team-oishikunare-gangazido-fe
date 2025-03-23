import api from './index';

// 현재 위치 조회
export const getLocation = () => {
  return api.post("/v1/locations");
};
