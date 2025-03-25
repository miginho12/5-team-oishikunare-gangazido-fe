import api from './index';

// 마커 목록 조회
export const getMapMarkers = ({ latitude, longitude, radius }) => {
  return api.get('/v1/markers', {
    params: { latitude, longitude, radius }
  });
};

// 마커 등록
export const registerMarker = (markerData) => {
  return api.post("/v1/markers", markerData);
};

// 마커 상세 조회
export const getMarkerDetail = (markerId) => {
  return api.get(`/v1/markers/${markerId}`);
};

// 마커 삭제
export const deleteMarker = (markerId) => {
  return api.delete(`/v1/markers/${markerId}`);
};