import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

function MapPage() {
  const navigate = useNavigate();
  const mapContainer = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [centerPosition, setCenterPosition] = useState({
    lat: 37.5665, // 서울 시청 위도
    lng: 126.9780 // 서울 시청 경도
  });
  
  // 디바운스 타이머 참조 저장
  const debounceTimerRef = useRef(null);

  // 디바운스된 위치 업데이트 함수
  const updatePositionWithDebounce = useCallback((lat, lng) => {
    // 이전 타이머가 있으면 취소
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // 새 타이머 설정 (100ms 지연)
    debounceTimerRef.current = setTimeout(() => {
      setCenterPosition({ lat, lng });
    }, 100);
  }, []);

  // 지도 초기화 함수를 useCallback으로 메모이제이션
  const initMap = useCallback(() => {
    try {
      if (!mapContainer.current) {
        console.error("지도 컨테이너가 존재하지 않습니다.");
        return;
      }
      
      if (!window.kakao || !window.kakao.maps) {
        console.error("Kakao Maps API가 아직 로드되지 않았습니다.");
        return;
      }
      
      const options = {
        center: new window.kakao.maps.LatLng(centerPosition.lat, centerPosition.lng),
        level: 3
      };

      const kakaoMap = new window.kakao.maps.Map(mapContainer.current, options);
      setMap(kakaoMap);

      // 중앙에 마커 생성
      const markerPosition = new window.kakao.maps.LatLng(centerPosition.lat, centerPosition.lng);
      const newMarker = new window.kakao.maps.Marker({
        position: markerPosition,
        draggable: true // 마커 드래그 가능하도록 설정
      });
      
      newMarker.setMap(kakaoMap);
      setMarker(newMarker);

      // 지도 중심 위치가 변경될 때마다 마커 위치 업데이트 (디바운싱 적용)
      let isDragging = false;
      
      // 드래그 시작 이벤트
      window.kakao.maps.event.addListener(kakaoMap, "dragstart", () => {
        isDragging = true;
      });
      
      // 드래그 종료 이벤트
      window.kakao.maps.event.addListener(kakaoMap, "dragend", () => {
        isDragging = false;
        const center = kakaoMap.getCenter();
        newMarker.setPosition(center);
        updatePositionWithDebounce(center.getLat(), center.getLng());
      });
      
      // 중심 변경 이벤트 (드래그 중에는 마커 위치만 업데이트하고 상태는 업데이트하지 않음)
      window.kakao.maps.event.addListener(kakaoMap, "center_changed", () => {
        const center = kakaoMap.getCenter();
        newMarker.setPosition(center);
        
        // 드래그 중이 아닐 때만 상태 업데이트
        if (!isDragging) {
          updatePositionWithDebounce(center.getLat(), center.getLng());
        }
      });

      // 마커 드래그 이벤트 처리
      window.kakao.maps.event.addListener(newMarker, "dragend", () => {
        const position = newMarker.getPosition();
        kakaoMap.setCenter(position); // 지도 중심을 마커 위치로 이동
        updatePositionWithDebounce(position.getLat(), position.getLng());
      });
      
    } catch (error) {
      console.error("지도 초기화 중 오류 발생:", error);
      alert("지도를 초기화하는 중 오류가 발생했습니다: " + error.message);
    }
  }, [centerPosition.lat, centerPosition.lng, updatePositionWithDebounce]);

  // 지도 초기화
  useEffect(() => {
    const loadKakaoMap = () => {
      window.kakao.maps.load(() => {
        initMap();
      });
    };
    
    if (window.kakao && window.kakao.maps) {
      loadKakaoMap();
    } else {
      const script = document.createElement("script");
      script.id = "kakao-map-script";
      script.async = true;
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.REACT_APP_KAKAO_MAP_API_KEY}&autoload=false`;
      
      script.onload = () => {
        loadKakaoMap();
      };
      
      script.onerror = (error) => {
        console.error("Kakao Maps API 스크립트 로드 실패:", error);
        alert("지도를 불러오는데 실패했습니다. API 키를 확인하거나 API 호출 제한을 확인해 주세요.");
      };
      
      document.head.appendChild(script);
    }

    return () => {
      // 컴포넌트 언마운트 시 정리 작업
      if (marker) {
        marker.setMap(null);
      }
      
      // 디바운스 타이머 정리
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [initMap]);

  // 현재 위치로 이동하는 함수
  const moveToCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          if (map && window.kakao && window.kakao.maps) {
            const moveLatLng = new window.kakao.maps.LatLng(lat, lng);
            map.setCenter(moveLatLng);
            setCenterPosition({ lat, lng });
          }
        },
        (error) => {
          console.error("현재 위치를 가져오는데 실패했습니다:", error);
          alert("현재 위치를 가져오는데 실패했습니다: " + error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      alert("이 브라우저에서는 위치 정보를 지원하지 않습니다.");
    }
  }, [map]);

  // 마커 위치 정보 저장
  const saveMarkerPosition = () => {
    if (centerPosition) {
      alert(`마커 위치가 저장되었습니다: 위도 ${centerPosition.lat.toFixed(6)}, 경도 ${centerPosition.lng.toFixed(6)}`);
      // 여기에 위치 정보를 저장하는 API 호출 등의 로직 추가
    }
  };

  const goToChat = () => {
    navigate("/chat-main");
  };

  const goToProfile = () => {
    navigate("/profile");
  };

  const goToPetInfo = () => {
    navigate("/pet-info");
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white p-4 shadow-md flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">지도</h1>
        <div className="flex items-center">
          <button className="ml-2 p-2 rounded-full hover:bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* 검색 바 */}
      <div className="p-4 bg-white shadow-sm">
        <div className="relative">
          <input
            type="text"
            placeholder="장소 검색"
            className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* 지도 영역 */}
      <div className="flex-1 bg-gray-200 relative">
        <div 
          ref={mapContainer} 
          className="absolute inset-0"
          style={{ width: "100%", height: "100%" }}
        ></div>
        
        {/* 카테고리 버튼 */}
        <div className="absolute top-4 left-4 right-4 flex space-x-2 overflow-x-auto">
          <button className="bg-white py-2 px-4 rounded-full shadow-md text-sm font-medium text-amber-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            공원
          </button>
          <button className="bg-white py-2 px-4 rounded-full shadow-md text-sm font-medium text-gray-600 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            동물병원
          </button>
          <button className="bg-white py-2 px-4 rounded-full shadow-md text-sm font-medium text-gray-600 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            애견카페
          </button>
        </div>
        
        {/* 현재 위치 버튼 */}
        <button 
          onClick={moveToCurrentLocation}
          className="absolute bottom-24 right-4 bg-white p-3 rounded-full shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
        </button>

        {/* 마커 위치 저장 버튼 */}
        <button 
          onClick={saveMarkerPosition}
          className="absolute bottom-24 left-4 bg-amber-800 text-white py-2 px-4 rounded-full shadow-lg"
        >
          위치 저장
        </button>

        {/* 위치 정보 표시 */}
        <div className="absolute bottom-36 left-0 right-0 flex justify-center">
          <div className="bg-white px-4 py-2 rounded-full shadow-md text-sm">
            <span className="font-medium">위도: {centerPosition.lat.toFixed(6)}, 경도: {centerPosition.lng.toFixed(6)}</span>
          </div>
        </div>

        {/* 안내 메시지 */}
        <div className="absolute top-1/2 left-0 right-0 flex justify-center pointer-events-none">
          <div className="bg-black bg-opacity-70 px-4 py-2 rounded-lg text-white text-sm">
            지도를 움직여 원하는 위치에 마커를 놓으세요
          </div>
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <nav className="bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-around">
          <button className="flex flex-col items-center py-3 px-4 text-amber-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs mt-1 font-medium">지도</span>
          </button>
          <button onClick={goToChat} className="flex flex-col items-center py-3 px-4 text-gray-500 hover:text-amber-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="text-xs mt-1 font-medium">채팅</span>
          </button>
          <button onClick={goToProfile} className="flex flex-col items-center py-3 px-4 text-gray-500 hover:text-amber-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs mt-1 font-medium">내 정보</span>
          </button>
          <button onClick={goToPetInfo} className="flex flex-col items-center py-3 px-4 text-gray-500 hover:text-amber-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs mt-1 font-medium">반려견 정보</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default MapPage; 