import React, { useEffect, useState, useRef } from 'react';
// MarkerManager 컴포넌트는 사용하지 않으므로 import 제거

const KakaoMap = () => {
  const mapContainer = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [centerMarker, setCenterMarker] = useState(null);
  const [mapMode, setMapMode] = useState('drag'); // 'drag' 또는 'center'
  const [markerPosition, setMarkerPosition] = useState(null);
  const [savedMarkers, setSavedMarkers] = useState([]);
  const [mapMarkers, setMapMarkers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  // error 변수는 사용하지만 경고를 피하기 위해 주석 처리
  // eslint-disable-next-line no-unused-vars
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMarkerType, setSelectedMarkerType] = useState(null);
  const [activeTab, setActiveTab] = useState('map');
  const [showMarkerTypeModal, setShowMarkerTypeModal] = useState(false);

  // 카카오맵 스크립트 로드
  useEffect(() => {
    console.log("카카오맵 초기화 시작");
    // HTML에 직접 포함된 카카오맵 API를 사용
    if (window.kakao && window.kakao.maps) {
      initializeMap();
    } else {
      console.error("카카오맵 API가 로드되지 않았습니다.");
    }
  }, []);

  // 지도 초기화
  const initializeMap = () => {
    try {
      console.log("지도 초기화 함수 실행");
      const kakao = window.kakao;
      const options = {
        center: new kakao.maps.LatLng(33.450701, 126.570667),
        level: 3
      };

      console.log("지도 컨테이너:", mapContainer.current);
      const mapInstance = new kakao.maps.Map(mapContainer.current, options);
      console.log("지도 인스턴스 생성 완료");
      setMap(mapInstance);

      // 드래그 가능한 마커 생성
      const markerInstance = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(33.450701, 126.570667),
        draggable: true
      });
      markerInstance.setMap(mapInstance);
      setMarker(markerInstance);
      setMarkerPosition(markerInstance.getPosition());

      // 마커 드래그 이벤트 등록
      kakao.maps.event.addListener(markerInstance, 'dragend', function() {
        setMarkerPosition(markerInstance.getPosition());
      });

      // 지도 중앙 마커 (보이지 않음)
      const centerMarkerInstance = new kakao.maps.Marker({
        position: mapInstance.getCenter(),
        visible: false
      });
      centerMarkerInstance.setMap(mapInstance);
      setCenterMarker(centerMarkerInstance);

      // 지도 이동 이벤트 등록
      kakao.maps.event.addListener(mapInstance, 'center_changed', function() {
        centerMarkerInstance.setPosition(mapInstance.getCenter());
      });
      
      // 샘플 마커 추가
      addSampleMarkers(mapInstance);
      
      console.log("지도 초기화 완료");
    } catch (error) {
      console.error("지도 초기화 중 오류 발생:", error);
    }
  };

  // 샘플 마커 추가
  const addSampleMarkers = (mapInstance) => {
    const kakao = window.kakao;
    
    // 샘플 위치 데이터
    const positions = [
      {
        title: '빙판길',
        latlng: new kakao.maps.LatLng(33.450701, 126.570667),
        type: 'danger',
        number: 7
      },
      {
        title: '댕풀',
        latlng: new kakao.maps.LatLng(33.450401, 126.570667),
        type: 'normal',
        number: 7
      },
      {
        title: '댕지러스',
        latlng: new kakao.maps.LatLng(33.450101, 126.571667),
        type: 'warning',
        number: '1-2'
      },
      {
        title: '댕풀',
        latlng: new kakao.maps.LatLng(33.449801, 126.571667),
        type: 'normal',
        number: '1-1'
      },
      {
        title: '마커찍기',
        latlng: new kakao.maps.LatLng(33.449501, 126.571667),
        type: 'action',
        number: 1
      }
    ];

    // 마커 이미지 생성 함수
    const createMarkerImage = (type, number) => {
      let bgColor = '#FF6B6B'; // 기본 빨간색
      
      if (type === 'normal') {
        bgColor = '#FF9E7D'; // 연한 빨간색
      } else if (type === 'warning') {
        bgColor = '#FF5252'; // 진한 빨간색
      } else if (type === 'action') {
        bgColor = '#FFFFFF'; // 흰색
      }
      
      // SVG 마커 생성
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50">
          <rect x="0" y="0" width="50" height="50" rx="10" fill="${bgColor}" />
          <text x="25" y="30" font-family="Arial" font-size="16" font-weight="bold" text-anchor="middle" fill="white">${number}</text>
        </svg>
      `;
      
      const markerSize = new kakao.maps.Size(50, 50);
      const markerOption = { offset: new kakao.maps.Point(25, 25) };
      
      return {
        src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg),
        size: markerSize,
        options: markerOption
      };
    };

    // 마커 생성 및 추가
    positions.forEach((position) => {
      const markerImage = createMarkerImage(position.type, position.number);
      
      const markerImg = new kakao.maps.MarkerImage(
        markerImage.src,
        markerImage.size,
        markerImage.options
      );
      
      const marker = new kakao.maps.Marker({
        map: mapInstance,
        position: position.latlng,
        title: position.title,
        image: markerImg
      });
      
      // 마커 정보 저장
      const newMarker = {
        lat: position.latlng.getLat(),
        lng: position.latlng.getLng(),
        type: position.type,
        title: position.title,
        number: position.number
      };
      
      setSavedMarkers(prev => [...prev, newMarker]);
      setMapMarkers(prev => [...prev, marker]);
    });
  };

  // 현재 위치 가져오기
  const getCurrentLocation = () => {
    setIsLoading(true);
    setError(null);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          if (map && marker) {
            const kakao = window.kakao;
            const currentPosition = new kakao.maps.LatLng(lat, lng);
            
            // 지도 중심 이동
            map.setCenter(currentPosition);
            
            // 마커 위치 이동
            marker.setPosition(currentPosition);
            marker.setVisible(true);
            
            // 마커 위치 상태 업데이트
            setMarkerPosition(currentPosition);
          }
          
          setIsLoading(false);
        },
        (error) => {
          console.error('위치 정보를 가져오는데 실패했습니다:', error);
          setError('위치 정보를 가져오는데 실패했습니다. 위치 접근 권한을 확인해주세요.');
          setIsLoading(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setError('이 브라우저에서는 위치 정보를 지원하지 않습니다.');
      setIsLoading(false);
    }
  };

  // 모드 변경 함수
  const changeMode = (mode) => {
    setMapMode(mode);
    if (marker) {
      marker.setDraggable(mode === 'drag');
      marker.setVisible(mode === 'drag');
    }
  };

  // 중앙 마커 찍기
  const placeCenterMarker = () => {
    if (map && centerMarker) {
      const position = map.getCenter();
      if (marker) {
        marker.setPosition(position);
        marker.setVisible(true);
        setMarkerPosition(position);
      }
      setShowMarkerTypeModal(true);
    }
  };

  // 마커 타입 선택 후 저장
  const saveMarkerWithType = (type) => {
    setSelectedMarkerType(type);
    setShowMarkerTypeModal(false);
    setShowDeleteModal(true);
  };

  // 현재 마커 저장
  const saveCurrentMarker = () => {
    if (markerPosition) {
      const newMarker = {
        lat: markerPosition.getLat(),
        lng: markerPosition.getLng(),
        type: selectedMarkerType || '일반',
        title: '사용자 마커',
        number: savedMarkers.length + 1
      };
      
      // 저장된 마커 목록에 추가
      setSavedMarkers([...savedMarkers, newMarker]);
      
      // 지도에 마커 추가
      if (map) {
        const kakao = window.kakao;
        
        // 마커 이미지 생성
        const svg = `
          <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50">
            <rect x="0" y="0" width="50" height="50" rx="10" fill="#FF6B6B" />
            <text x="25" y="30" font-family="Arial" font-size="16" font-weight="bold" text-anchor="middle" fill="white">${savedMarkers.length + 1}</text>
          </svg>
        `;
        
        const markerSize = new kakao.maps.Size(50, 50);
        const markerOption = { offset: new kakao.maps.Point(25, 25) };
        
        const markerImg = new kakao.maps.MarkerImage(
          'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg),
          markerSize,
          markerOption
        );
        
        const markerInstance = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(newMarker.lat, newMarker.lng),
          map: map,
          image: markerImg
        });
        
        setMapMarkers([...mapMarkers, markerInstance]);
      }
      
      setShowDeleteModal(false);
      setSelectedMarkerType(null);
    }
  };

  // 마커 삭제 - 사용하지 않지만 나중에 사용할 수 있으므로 유지
  // eslint-disable-next-line no-unused-vars
  const deleteMarker = (index) => {
    // 지도에서 마커 제거
    if (mapMarkers[index]) {
      mapMarkers[index].setMap(null);
    }
    
    // 배열에서 마커 제거
    const updatedMapMarkers = [...mapMarkers];
    updatedMapMarkers.splice(index, 1);
    setMapMarkers(updatedMapMarkers);
    
    const updatedSavedMarkers = [...savedMarkers];
    updatedSavedMarkers.splice(index, 1);
    setSavedMarkers(updatedSavedMarkers);
  };

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* 헤더 */}
      <div className="bg-white p-3 shadow-sm flex items-center justify-center">
        <div className="flex items-center">
          <h1 className="text-xl font-bold">강아지도</h1>
          <svg className="w-6 h-6 ml-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 4c0 1.1-0.9 2-2 2s-2-0.9-2-2 0.9-2 2-2 2 0.9 2 2zM13 7c-2.8 0-5 2.2-5 5v7h2v-4h6v4h2v-7c0-2.8-2.2-5-5-5zM4 8c-1.1 0-2 0.9-2 2s0.9 2 2 2 2-0.9 2-2-0.9-2-2-2zM7 14c-1.7 0-3 1.3-3 3v3h2v-3c0-0.6 0.4-1 1-1h2c0.6 0 1 0.4 1 1v3h2v-3c0-1.7-1.3-3-3-3H7z" fill="currentColor"/>
          </svg>
        </div>
      </div>
      
      {/* 지도 컨테이너 */}
      <div className="flex-1 relative">
        <div 
          id="map" 
          ref={mapContainer} 
          className="w-full h-full"
        ></div>
        
        {/* 현재 위치 버튼 */}
        <div className="absolute left-4 bottom-20">
          <button
            className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center"
            onClick={getCurrentLocation}
            disabled={isLoading}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
            )}
          </button>
        </div>
        
        {/* 중앙 에임 (mapMode가 'center'일 때만 표시) */}
        {mapMode === 'center' && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="w-6 h-6">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="red" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
          </div>
        )}
        
        {/* 모드 전환 버튼 */}
        <div className="absolute right-4 top-4 bg-white rounded-md shadow-md overflow-hidden">
          <button
            className={`px-3 py-2 ${mapMode === 'drag' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}
            onClick={() => changeMode('drag')}
          >
            드래그
          </button>
          <button
            className={`px-3 py-2 ${mapMode === 'center' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}
            onClick={() => changeMode('center')}
          >
            에임
          </button>
        </div>
        
        {/* 마커 찍기 버튼 (mapMode가 'center'일 때만 표시) */}
        {mapMode === 'center' && (
          <div className="absolute bottom-20 right-4">
            <button
              className="px-4 py-2 bg-red-500 text-white rounded-md shadow-md"
              onClick={placeCenterMarker}
            >
              마커찍기
            </button>
          </div>
        )}
        
        {/* 마커 타입 선택 모달 */}
        {showMarkerTypeModal && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-purple-500 rounded-lg p-6 max-w-sm w-full mx-4">
              <h3 className="text-lg font-bold mb-4 text-white">주의 표시를 남길 항목을 선택해세요. (3일 유지)</h3>
              <div className="grid grid-cols-4 gap-4">
                <button
                  className="bg-white rounded-full p-3 flex flex-col items-center"
                  onClick={() => saveMarkerWithType('danger')}
                >
                  <span className="text-sm">들개</span>
                </button>
                <button
                  className="bg-white rounded-full p-3 flex flex-col items-center"
                  onClick={() => saveMarkerWithType('warning')}
                >
                  <span className="text-sm">빙판길</span>
                </button>
                <button
                  className="bg-white rounded-full p-3 flex flex-col items-center"
                  onClick={() => saveMarkerWithType('normal')}
                >
                  <span className="text-sm">염화칼슘</span>
                </button>
                <button
                  className="bg-white rounded-full p-3 flex flex-col items-center"
                  onClick={() => saveMarkerWithType('action')}
                >
                  <span className="text-sm">공사중</span>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* 마커 삭제 모달 */}
        {showDeleteModal && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
              <h3 className="text-lg font-bold mb-4">해당 마커를 삭제하시겠습니까?</h3>
              <div className="flex justify-center space-x-4">
                <button
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-full"
                  onClick={() => setShowDeleteModal(false)}
                >
                  취소
                </button>
                <button
                  className="px-4 py-2 bg-indigo-600 text-white rounded-full"
                  onClick={saveCurrentMarker}
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 하단 탭 메뉴 */}
      <div className="bg-white shadow-md grid grid-cols-4 py-2">
        <div 
          className={`flex flex-col items-center ${activeTab === 'map' ? 'text-red-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('map')}
        >
          <div className="w-10 h-10 flex items-center justify-center">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <span className="text-xs">지도</span>
        </div>
        <div 
          className={`flex flex-col items-center ${activeTab === 'chat' ? 'text-red-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('chat')}
        >
          <div className="w-10 h-10 flex items-center justify-center">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
            </svg>
          </div>
          <span className="text-xs">채팅</span>
        </div>
        <div 
          className={`flex flex-col items-center ${activeTab === 'profile' ? 'text-red-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('profile')}
        >
          <div className="w-10 h-10 flex items-center justify-center">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          <span className="text-xs">내 정보</span>
        </div>
        <div 
          className={`flex flex-col items-center ${activeTab === 'pet' ? 'text-red-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('pet')}
        >
          <div className="w-10 h-10 flex items-center justify-center">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.5 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6.5-2c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2z"/>
            </svg>
          </div>
          <span className="text-xs">내 반려견 정보</span>
        </div>
      </div>
    </div>
  );
};

export default KakaoMap; 