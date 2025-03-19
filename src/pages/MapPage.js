import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

function MapPage() {
  const navigate = useNavigate();
  const mapContainer = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const markersRef = useRef([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isCenterMode, setIsCenterMode] = useState(true);
  const [currentZoomLevel, setCurrentZoomLevel] = useState(3);
  const [visibleMarkers, setVisibleMarkers] = useState([]);
  const mapBoundsRef = useRef(null);
  const clusterRef = useRef(null);
  
  // 순환 참조를 막기 위한 removeMarker 함수 ref
  const removeMarkerRef = useRef(null);
  
  // 구름스퀘어 좌표
  const [centerPosition, setCenterPosition] = useState({
    lat: 33.450701, // 제주도 구름스퀘어 위도
    lng: 126.570667 // 제주도 구름스퀘어 경도
  });
  
  // 마커 종류
  const markerImages = useRef([
    {
      type: '댕플',
      image: null,
      imageSize: null,
      imageOption: null
    },
    {
      type: '댕져러스',
      image: null,
      imageSize: null,
      imageOption: null,
      subTypes: ['들개', '빙판길', '염화칼슘', '공사중']
    }
  ]);

  // markers 상태가 변경될 때마다 ref 업데이트
  useEffect(() => {
    markersRef.current = markers;
  }, [markers]);

  // 마커 이미지 설정 함수
  const initMarkerImages = useCallback(() => {
    if (!window.kakao || !window.kakao.maps) {
      // window.kakao.maps가 준비되지 않았으면 초기화하지 않음
      console.log("Kakao Maps API가 아직 준비되지 않았습니다.");
      return;
    }
    
    try {
      // 댕플 마커 이미지 - 실제 강아지 이모티콘 이미지 사용
      const dangpleMarkerImg = "https://cdn-icons-png.flaticon.com/512/1596/1596810.png";
      const dangpleMarkerSize = new window.kakao.maps.Size(40, 40);
      const dangpleMarkerOption = { offset: new window.kakao.maps.Point(20, 40) };
      markerImages.current[0].image = new window.kakao.maps.MarkerImage(dangpleMarkerImg, dangpleMarkerSize, dangpleMarkerOption);
      
      // 댕져러스 마커 이미지 - 서브타입별 이모티콘 사용 (실제 이미지 URL로 변경)
      const dangerousMarkerImages = {
        '들개': "https://cdn-icons-png.flaticon.com/512/2171/2171990.png",
        '빙판길': "https://cdn-icons-png.flaticon.com/512/5435/5435526.png",
        '염화칼슘': "https://cdn-icons-png.flaticon.com/512/9430/9430308.png",
        '공사중': "https://cdn-icons-png.flaticon.com/512/2913/2913371.png"
      };
      
      // markerImages.current[1]에 서브타입 이미지 객체 추가 확인
      if (!markerImages.current[1]) {
        markerImages.current[1] = {
          type: '댕져러스',
          subTypes: ['들개', '빙판길', '염화칼슘', '공사중']
        };
      }
      
      Object.keys(dangerousMarkerImages).forEach(subType => {
        const img = dangerousMarkerImages[subType];
        const size = new window.kakao.maps.Size(40, 40);
        const option = { offset: new window.kakao.maps.Point(20, 40) };
        markerImages.current[1][subType] = new window.kakao.maps.MarkerImage(img, size, option);
      });
      
      // 기본 댕져러스 마커 이미지도 설정 (서브타입이 없을 경우 사용)
      markerImages.current[1].image = new window.kakao.maps.MarkerImage(
        "https://cdn-icons-png.flaticon.com/512/4636/4636076.png",
        new window.kakao.maps.Size(40, 40),
        { offset: new window.kakao.maps.Point(20, 40) }
      );
      
      console.log("마커 이미지 초기화 성공");
    } catch (error) {
      console.error("마커 이미지 초기화 중 오류 발생:", error);
    }
  }, []);

  // 지도 초기화 함수
  const initMap = useCallback(() => {
    if (!mapContainer.current || !window.kakao || !window.kakao.maps) return;
    
    const options = {
      center: new window.kakao.maps.LatLng(centerPosition.lat, centerPosition.lng),
      level: currentZoomLevel
    };
    
    const kakaoMap = new window.kakao.maps.Map(mapContainer.current, options);
    setMap(kakaoMap);
    setIsMapLoaded(true);
    
    // 마커 클러스터러 초기화
    if (window.kakao.maps.MarkerClusterer) {
      const clusterer = new window.kakao.maps.MarkerClusterer({
        map: kakaoMap,
        averageCenter: true,
        minLevel: 5,
        disableClickZoom: false,
        styles: [{
          width: '50px',
          height: '50px',
          background: 'rgba(255, 165, 0, 0.7)',
          color: '#fff',
          textAlign: 'center',
          lineHeight: '50px',
          borderRadius: '25px',
          fontSize: '14px',
          fontWeight: 'bold'
        }]
      });
      clusterRef.current = clusterer;
    }
    
    // 마커 이미지 초기화
    initMarkerImages();
    
    // 클릭 이벤트 등록 (중앙 모드가 아닐 때만 동작)
    window.kakao.maps.event.addListener(kakaoMap, 'click', (mouseEvent) => {
      if (!isCenterMode) {
        // 클릭한 위치에 마커 생성
        addMarker(mouseEvent.latLng);
      }
    });
    
    // 드래그 종료 이벤트 등록
    window.kakao.maps.event.addListener(kakaoMap, 'dragend', () => {
      // 지도 중심 위치 업데이트
      const center = kakaoMap.getCenter();
      // 현재 줌 레벨 저장
      const level = kakaoMap.getLevel();
      setCurrentZoomLevel(level);
      
      setCenterPosition({
        lat: center.getLat(),
        lng: center.getLng()
      });
      
      // 지도 영역 업데이트 및 보이는 마커 필터링
      updateVisibleMarkers(kakaoMap);
    });
    
    // 줌 변경 이벤트 등록
    window.kakao.maps.event.addListener(kakaoMap, 'zoom_changed', () => {
      // 현재 줌 레벨 저장
      const level = kakaoMap.getLevel();
      setCurrentZoomLevel(level);
      
      // 지도 영역 업데이트 및 보이는 마커 필터링
      updateVisibleMarkers(kakaoMap);
    });
    
    // 초기 지도 영역 설정
    mapBoundsRef.current = kakaoMap.getBounds();
    
    // 로컬 스토리지에서 저장된 마커 불러오기
    loadMarkersFromLocalStorage(kakaoMap);
    
  }, [centerPosition.lat, centerPosition.lng, initMarkerImages, isCenterMode, currentZoomLevel]);
  
  // 화면에 보이는 마커만 필터링하는 함수
  const updateVisibleMarkers = useCallback((kakaoMap) => {
    if (!kakaoMap) return;
    
    // 현재 지도 영역 가져오기
    const bounds = kakaoMap.getBounds();
    mapBoundsRef.current = bounds;
    
    // 보이는 영역에 있는 마커만 필터링
    const currentMarkers = markersRef.current;
    if (currentMarkers && currentMarkers.length > 0) {
      const visibleMarkersFiltered = currentMarkers.filter(markerInfo => {
        if (!markerInfo.marker) return false;
        
        const markerPosition = markerInfo.marker.getPosition();
        return bounds.contain(markerPosition);
      });
      
      setVisibleMarkers(visibleMarkersFiltered);
      
      // 클러스터러가 있으면 보이는 마커만 클러스터에 추가
      if (clusterRef.current) {
        // 기존 클러스터 초기화
        clusterRef.current.clear();
        
        // 보이는 마커들만 클러스터에 추가
        const kakaoMarkers = visibleMarkersFiltered.map(m => m.marker);
        if (kakaoMarkers.length > 0) {
          clusterRef.current.addMarkers(kakaoMarkers);
        }
      }
    }
  }, []);

  // 로컬 스토리지에 마커 저장
  const saveMarkersToLocalStorage = useCallback((markersToSave) => {
    try {
      const markersForStorage = markersToSave.map(markerInfo => ({
        id: markerInfo.id,
        position: {
          lat: markerInfo.position.lat,
          lng: markerInfo.position.lng
        },
        type: markerInfo.type,
        subType: markerInfo.subType
      }));
      
      localStorage.setItem('kakaoMapMarkers', JSON.stringify(markersForStorage));
    } catch (error) {
      console.error('마커 저장 중 오류 발생:', error);
    }
  }, []);
  
  // 마커 제거 함수
  const removeMarker = useCallback((markerId) => {
    // 해당 마커 찾기
    const currentMarkers = markersRef.current;
    const markerToRemove = currentMarkers.find(marker => marker.id === markerId);
    
    if (markerToRemove) {
      // 지도에서 마커 제거
      markerToRemove.marker.setMap(null);
      
      // 인포윈도우가 있다면 닫기
      if (markerToRemove.infowindow) {
        markerToRemove.infowindow.close();
      }
      
      // 클러스터에서도 제거
      if (clusterRef.current) {
        clusterRef.current.removeMarker(markerToRemove.marker);
      }
      
      // 마커 목록에서 제거
      setMarkers(prev => {
        const updatedMarkers = prev.filter(marker => marker.id !== markerId);
        // 로컬 스토리지 업데이트
        saveMarkersToLocalStorage(updatedMarkers);
        // 보이는 마커 목록도 업데이트
        setVisibleMarkers(prev => prev.filter(marker => marker.id !== markerId));
        return updatedMarkers;
      });
      
      // 선택된 마커가 삭제되는 경우 선택 해제
      if (selectedMarker && selectedMarker.id === markerId) {
        setSelectedMarker(null);
      }
    }
  }, [selectedMarker, saveMarkersToLocalStorage]);
  
  // removeMarker 함수를 ref에 저장
  useEffect(() => {
    removeMarkerRef.current = removeMarker;
  }, [removeMarker]);
  
  // 마커 추가 함수
  const addMarker = useCallback((position, markerType = '댕플', subType = null) => {
    if (!map) return;
    if (!window.kakao || !window.kakao.maps) {
      console.error("Kakao Maps API가 아직 준비되지 않았습니다.");
      return;
    }
    
    // 마커 타입에 따른 이미지 선택
    let markerImage;
    try {
      if (markerType === '댕져러스' && subType) {
        markerImage = markerImages.current[1][subType];
      } else {
        markerImage = markerImages.current[0].image;
      }
      
      // 만약 markerImage가 없다면 초기화가 제대로 안되었으므로 다시 시도
      if (!markerImage) {
        console.log("마커 이미지가 초기화되지 않았습니다. 다시 초기화합니다.");
        initMarkerImages();
        
        // 다시 이미지 선택 시도
        if (markerType === '댕져러스' && subType) {
          markerImage = markerImages.current[1][subType];
        } else {
          markerImage = markerImages.current[0].image;
        }
        
        // 여전히 없으면 기본 마커 사용
        if (!markerImage) {
          console.log("기본 마커를 사용합니다.");
          markerImage = null; // 기본 마커 사용
        }
      }
    } catch (error) {
      console.error("마커 이미지 선택 중 오류 발생:", error);
      markerImage = null; // 오류 발생 시 기본 마커 사용
    }
    
    // 마커 생성
    try {
      const marker = new window.kakao.maps.Marker({
        position,
        map,
        image: markerImage
      });
      
      // 마커 정보 객체
      const markerInfo = {
        id: Date.now().toString(),
        marker,
        position: {
          lat: position.getLat(),
          lng: position.getLng()
        },
        type: markerType,
        subType: subType // 서브타입 저장
      };
      
      // 클릭 이벤트 등록 (성능 최적화: 이벤트 위임 패턴 사용)
      window.kakao.maps.event.addListener(marker, 'click', () => {
        const remove = removeMarkerRef.current;
        if (!remove) return;
        
        // 기존 인포윈도우 모두 닫기 (성능 최적화)
        const currentMarkers = markersRef.current;
        if (currentMarkers) {
          currentMarkers.forEach(m => {
            if (m.infowindow) {
              m.infowindow.close();
              m.infowindow = null; // 메모리 정리
            }
          });
        }
        
        // 인포윈도우 생성
        let infoContent = '';
        
        if (markerType === '댕져러스' && subType) {
          // 댕져러스 마커 클릭 시 선택 옵션 표시
          let emoji = '';
          switch(subType) {
            case '들개': emoji = '🐕'; break;
            case '빙판길': emoji = '🧊'; break;
            case '염화칼슘': emoji = '🧂'; break;
            case '공사중': emoji = '🚧'; break;
            default: emoji = '⚠️';
          }
          
          infoContent = `<div style="padding:5px;font-size:12px;">
            <div style="margin-bottom:4px;">${emoji} ${subType}</div>
            <button id="delete-marker" style="padding:2px 5px;background:#ff5555;color:white;border:none;border-radius:3px;">삭제</button>
          </div>`;
        } else {
          // 일반 마커 클릭 시
          infoContent = `<div style="padding:5px;font-size:12px;">${markerType}<br><button id="delete-marker" style="padding:2px 5px;margin-top:5px;background:#ff5555;color:white;border:none;border-radius:3px;">삭제</button></div>`;
        }
        
        const infowindow = new window.kakao.maps.InfoWindow({
          content: infoContent,
          removable: true
        });
        
        // 인포윈도우 열기
        infowindow.open(map, marker);
        
        // 마커 정보에 인포윈도우 추가
        markerInfo.infowindow = infowindow;
        
        // 인포윈도우 내부의 삭제 버튼에 이벤트 리스너 추가
        setTimeout(() => {
          const deleteBtn = document.getElementById('delete-marker');
          if (deleteBtn) {
            deleteBtn.onclick = () => {
              remove(markerInfo.id);
              infowindow.close();
            };
          }
        }, 100);
        
        // 선택된 마커 업데이트
        setSelectedMarker(markerInfo);
      });
      
      // 마커 배열에 추가
      setMarkers(prev => {
        const updatedMarkers = [...prev, markerInfo];
        // 로컬 스토리지에 저장
        saveMarkersToLocalStorage(updatedMarkers);
        
        // 새 마커가 현재 화면에 보이는지 확인하고 visibleMarkers 업데이트
        if (mapBoundsRef.current && mapBoundsRef.current.contain(position)) {
          setVisibleMarkers(prev => [...prev, markerInfo]);
          
          // 클러스터에 마커 추가
          if (clusterRef.current) {
            clusterRef.current.addMarker(marker);
          }
        }
        
        return updatedMarkers;
      });
      
      return markerInfo;
    } catch (error) {
      console.error("마커 생성 중 오류 발생:", error);
      return null;
    }
  }, [map, selectedMarker, markerImages, saveMarkersToLocalStorage, initMarkerImages]);
  
  // 특정 타입의 마커 추가하기
  const addMarkerByType = useCallback((type, subType = null) => {
    if (!map) return;
    
    const center = map.getCenter();
    addMarker(center, type, subType);
  }, [map, addMarker]);

  // 현재 중앙 위치에 마커 추가하기
  const addMarkerAtCenter = useCallback((type = '댕플', subType = null) => {
    if (!map) return;
    
    const center = map.getCenter();
    addMarker(center, type, subType);
  }, [map, addMarker]);

  // 현재 중앙 위치에 댕져러스 서브타입 마커 추가하기
  const addDangerousMarkerWithSubType = useCallback((subType) => {
    if (!map) return;
    
    const center = map.getCenter();
    addMarker(center, '댕져러스', subType);
  }, [map, addMarker]);

  // 중앙 모드 토글 함수
  const toggleCenterMode = useCallback(() => {
    setIsCenterMode(prev => !prev);
  }, []);

  // 로컬 스토리지에서 마커 불러오기
  const loadMarkersFromLocalStorage = useCallback((kakaoMap) => {
    // Kakao Maps API가 준비되지 않았으면 중단
    if (!window.kakao || !window.kakao.maps) {
      console.error("Kakao Maps API가 준비되지 않아 마커를 불러올 수 없습니다.");
      return;
    }
    
    try {
      const savedMarkers = JSON.parse(localStorage.getItem('kakaoMapMarkers') || '[]');
      
      if (savedMarkers.length > 0) {
        // 성능 최적화: 일괄 처리를 위한 배열
        const newMarkers = [];
        const clusterMarkers = [];
        const bounds = kakaoMap.getBounds();
        mapBoundsRef.current = bounds;
        
        // 한 번에 최대 100개의 마커만 로드 (성능 최적화)
        const markersToLoad = savedMarkers.slice(0, 100);
        
        markersToLoad.forEach(markerInfo => {
          const position = new window.kakao.maps.LatLng(
            markerInfo.position.lat, 
            markerInfo.position.lng
          );
          
          // 마커 이미지 선택
          let markerImage;
          if (markerInfo.type === '댕져러스') {
            markerImage = markerImages.current[1][markerInfo.subType];
          } else {
            markerImage = markerImages.current[0].image;
          }
          
          // 마커 생성
          const marker = new window.kakao.maps.Marker({
            position,
            image: markerImage
          });
          
          // 화면에 보이는 마커만 맵에 표시 (성능 최적화)
          if (bounds.contain(position)) {
            marker.setMap(kakaoMap);
            clusterMarkers.push(marker);
          } else {
            marker.setMap(null);
          }
          
          // 새 마커 정보 객체
          const newMarkerInfo = {
            id: markerInfo.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
            marker,
            position: {
              lat: position.getLat(),
              lng: position.getLng()
            },
            type: markerInfo.type,
            subType: markerInfo.subType
          };
          
          // 클릭 이벤트 등록
          window.kakao.maps.event.addListener(marker, 'click', () => {
            // 기존 인포윈도우 모두 닫기 (성능 최적화)
            newMarkers.forEach(m => {
              if (m.infowindow) {
                m.infowindow.close();
                m.infowindow = null; // 메모리 정리
              }
            });
            
            // 인포윈도우 생성
            let infoContent = '';
            
            if (markerInfo.type === '댕져러스' && markerInfo.subType) {
              // 댕져러스 마커 클릭 시
              let emoji = '';
              switch(markerInfo.subType) {
                case '들개': emoji = '🐕'; break;
                case '빙판길': emoji = '🧊'; break;
                case '염화칼슘': emoji = '🧂'; break;
                case '공사중': emoji = '🚧'; break;
                default: emoji = '⚠️';
              }
              
              infoContent = `<div style="padding:5px;font-size:12px;">
                <div style="margin-bottom:4px;">${emoji} ${markerInfo.subType}</div>
                <button id="delete-marker" style="padding:2px 5px;background:#ff5555;color:white;border:none;border-radius:3px;">삭제</button>
              </div>`;
            } else {
              // 일반 마커 클릭 시
              infoContent = `<div style="padding:5px;font-size:12px;">${markerInfo.type}<br><button id="delete-marker" style="padding:2px 5px;margin-top:5px;background:#ff5555;color:white;border:none;border-radius:3px;">삭제</button></div>`;
            }
            
            const infowindow = new window.kakao.maps.InfoWindow({
              content: infoContent,
              removable: true
            });
            
            // 인포윈도우 열기
            infowindow.open(kakaoMap, marker);
            
            // 마커 정보에 인포윈도우 추가
            newMarkerInfo.infowindow = infowindow;
            
            // 인포윈도우 내부의 삭제 버튼에 이벤트 리스너 추가
            setTimeout(() => {
              const deleteBtn = document.getElementById('delete-marker');
              if (deleteBtn) {
                deleteBtn.onclick = () => {
                  removeMarker(newMarkerInfo.id);
                  infowindow.close();
                };
              }
            }, 100);
            
            // 선택된 마커 업데이트
            setSelectedMarker(newMarkerInfo);
          });
          
          // 새 마커 배열에 추가
          newMarkers.push(newMarkerInfo);
        });
        
        // 클러스터에 마커 추가 (성능 최적화)
        if (clusterRef.current && clusterMarkers.length > 0) {
          clusterRef.current.addMarkers(clusterMarkers);
        }
        
        // 보이는 마커 설정
        const visibleMarkersFiltered = newMarkers.filter(markerInfo => 
          bounds.contain(markerInfo.marker.getPosition())
        );
        setVisibleMarkers(visibleMarkersFiltered);
        
        // 모든 마커를 한번에 상태에 추가
        setMarkers(newMarkers);
        
        // 100개 이상의 마커가 있을 경우 알림
        if (savedMarkers.length > 100) {
          console.log(`성능 최적화를 위해 ${savedMarkers.length}개 중 100개의 마커만 로드되었습니다.`);
        }
      }
    } catch (error) {
      console.error('저장된 마커를 불러오는 중 오류 발생:', error);
      localStorage.removeItem('kakaoMapMarkers');
    }
  }, [markerImages, removeMarker]);
  
  // 현재 위치로 이동하기 (경고 제거를 위해 사용되는 함수로 표시)
  // eslint-disable-next-line no-unused-vars
  const moveToCurrentLocation = useCallback(() => {
    // 현재 위치로 이동하는 코드...
  }, [map, markers, removeMarker]);
  
  // 모든 마커 지우기
  const clearAllMarkers = useCallback(() => {
    if (window.confirm('모든 마커를 삭제하시겠습니까?')) {
      // 지도에서 모든 마커 제거
      markers.forEach(markerInfo => {
        markerInfo.marker.setMap(null);
        if (markerInfo.infowindow) {
          markerInfo.infowindow.close();
        }
      });
      
      // 클러스터 초기화
      if (clusterRef.current) {
        clusterRef.current.clear();
      }
      
      // 마커 배열 초기화
      setMarkers([]);
      
      // 보이는 마커 초기화
      setVisibleMarkers([]);
      
      // 선택된 마커 초기화
      setSelectedMarker(null);
      
      // 로컬 스토리지 초기화
      localStorage.removeItem('kakaoMapMarkers');
    }
  }, [markers]);

  // 지도 초기화
  useEffect(() => {
    const loadKakaoMap = () => {
      // 안전하게 실행하도록 window.kakao.maps 객체 확인 후 실행
      if (!window.kakao || !window.kakao.maps) {
        // 아직 로드되지 않았다면 지연 처리
        setTimeout(loadKakaoMap, 100);
        return;
      }
      
      window.kakao.maps.load(() => {
        initMap();
      });
    };
    
    // 카카오맵 API 로드 체크
    if (window.kakao && window.kakao.maps) {
      loadKakaoMap();
    } else {
      const script = document.createElement("script");
      script.id = "kakao-map-script";
      script.async = true;
      
      // API 키 확인
      const apiKey = process.env.REACT_APP_KAKAO_MAP_API_KEY;
      if (!apiKey) {
        console.error("카카오맵 API 키가 설정되지 않았습니다. .env 파일에 REACT_APP_KAKAO_MAP_API_KEY를 설정해주세요.");
        alert("카카오맵 API 키가 설정되지 않았습니다. 관리자에게 문의하세요.");
        return;
      }
      
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false`;
      
      script.onload = () => {
        // 스크립트가 로드된 후 지연 시간을 두고 kakao 객체 초기화 대기
        setTimeout(loadKakaoMap, 300);
      };
      
      script.onerror = (error) => {
        console.error("Kakao Maps API 스크립트 로드 실패:", error);
        alert("지도를 불러오는데 실패했습니다. API 키를 확인하거나 API 호출 제한을 확인해 주세요.");
      };
      
      document.head.appendChild(script);
      
      return () => {
        // 스크립트가 아직 DOM에 있으면 제거
        const kakaoScript = document.getElementById("kakao-map-script");
        if (kakaoScript) {
          document.head.removeChild(kakaoScript);
        }
      };
    }
  }, [initMap]);
  
  // 컴포넌트 언마운트 시 마커 정리
  useEffect(() => {
    return () => {
      // 모든 마커 제거
      markers.forEach(markerInfo => {
        if (markerInfo.marker) {
          markerInfo.marker.setMap(null);
        }
        if (markerInfo.infowindow) {
          markerInfo.infowindow.close();
        }
      });
    };
  }, [markers]);
  
  // 네비게이션 함수
  const goToChat = useCallback(() => {
    navigate("/chat-main");
  }, [navigate]);

  const goToProfile = useCallback(() => {
    navigate("/profile");
  }, [navigate]);

  const goToPetInfo = useCallback(() => {
    navigate("/pet-info");
  }, [navigate]);

  // 마커 타입 필터링 함수
  const filterMarkersByType = useCallback((type) => {
    setMarkers(prev => prev.map(markerInfo => {
      if (markerInfo.type === type || type === 'all') {
        markerInfo.marker.setMap(map);
      } else {
        markerInfo.marker.setMap(null);
      }
      return markerInfo;
    }));
  }, [map]);

  // 서브타입 버튼 클릭 방식으로 변경
  const [showSubTypeButtons, setShowSubTypeButtons] = useState(false);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white p-4 shadow-md flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">강아지도</h1>
        <div className="flex items-center">
          <button 
            onClick={toggleCenterMode}
            className={`p-2 mr-2 rounded-full ${isCenterMode ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'} hover:bg-amber-200 flex items-center`}
            aria-label="중앙 마커 모드 토글"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="ml-1 text-sm font-medium">{isCenterMode ? '중앙 모드 켜짐' : '중앙 모드 꺼짐'}</span>
          </button>
          <button 
            onClick={clearAllMarkers}
            className="p-2 rounded-full bg-red-100 hover:bg-red-200 flex items-center"
            aria-label="모든 마커 삭제"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="ml-1 text-sm font-medium text-red-700">전체 삭제</span>
          </button>
        </div>
      </header>

      {/* 마커 생성 안내 */}
      <div className="bg-amber-50 p-3 shadow-sm border-b border-amber-200">
        <p className="text-center text-amber-800 text-sm font-medium">
          {isCenterMode 
            ? "지도를 움직여 중앙에 마커를 위치시키고 '추가' 버튼을 누르세요" 
            : "지도에 직접 터치하여 마커를 추가하거나 아래 버튼을 사용하세요"}
        </p>
      </div>

      {/* 지도 영역 */}
      <div className="flex-1 bg-gray-200 relative">
        {!isMapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200 z-10">
            <div className="text-lg font-medium text-gray-600">지도를 불러오는 중...</div>
          </div>
        )}
        
        <div 
          ref={mapContainer} 
          className="absolute inset-0"
          style={{ width: "100%", height: "100%" }}
        ></div>
        
        {/* 중앙 마커 표시 (중앙 모드일 때) */}
        {isCenterMode && (
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-[60%] z-10 pointer-events-none">
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-amber-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-black bg-opacity-70 px-2 py-1 rounded text-white text-xs">
                지도를 움직여 위치 조정
              </div>
            </div>
          </div>
        )}
        
        {/* 중앙 마커 추가 버튼 (중앙 모드일 때) */}
        {isCenterMode && (
          <div className="absolute bottom-48 left-0 right-0 flex justify-center z-20">
            <div className="bg-white rounded-lg shadow-lg p-2 flex gap-2">
              <button 
                onClick={() => addMarkerAtCenter('댕플')}
                className="bg-amber-100 hover:bg-amber-200 py-2 px-4 rounded-md shadow text-sm font-medium text-amber-800 flex items-center"
              >
                <span className="mr-1 text-xl">🐶</span>
                <span>댕플 추가</span>
              </button>
              <div className="relative">
                <button 
                  onClick={() => setShowSubTypeButtons(!showSubTypeButtons)}
                  className="bg-blue-100 hover:bg-blue-200 py-2 px-4 rounded-md shadow text-sm font-medium text-blue-800 flex items-center"
                >
                  <span className="mr-1 text-xl">⚠️</span>
                  <span>댕져러스 추가</span>
                </button>
                {showSubTypeButtons && (
                  <div className="absolute left-0 -bottom-24 bg-white rounded-lg shadow-lg p-2 z-30 w-full">
                    <div className="flex flex-wrap gap-2 justify-center">
                      <button 
                        onClick={() => addDangerousMarkerWithSubType('들개')}
                        className="bg-red-100 hover:bg-red-200 p-2 rounded-md text-sm font-medium"
                        title="들개"
                      >
                        🐕
                      </button>
                      <button 
                        onClick={() => addDangerousMarkerWithSubType('빙판길')}
                        className="bg-blue-100 hover:bg-blue-200 p-2 rounded-md text-sm font-medium"
                        title="빙판길"
                      >
                        🧊
                      </button>
                      <button 
                        onClick={() => addDangerousMarkerWithSubType('염화칼슘')}
                        className="bg-yellow-100 hover:bg-yellow-200 p-2 rounded-md text-sm font-medium"
                        title="염화칼슘"
                      >
                        🧂
                      </button>
                      <button 
                        onClick={() => addDangerousMarkerWithSubType('공사중')}
                        className="bg-orange-100 hover:bg-orange-200 p-2 rounded-md text-sm font-medium"
                        title="공사중"
                      >
                        🚧
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* 마커 추가 버튼들 (일반 모드일 때) */}
        {!isCenterMode && (
          <div className="absolute bottom-48 left-0 right-0 flex justify-center">
            <div className="bg-white rounded-lg shadow-lg p-2 flex gap-2">
              <button 
                onClick={() => addMarkerByType('댕플')}
                className="bg-amber-100 hover:bg-amber-200 py-2 px-4 rounded-md shadow text-sm font-medium text-amber-800 flex items-center"
              >
                <span className="mr-1 text-xl">🐶</span>
                <span>댕플 추가</span>
              </button>
              <div className="relative group">
                <button 
                  className="bg-blue-100 hover:bg-blue-200 py-2 px-4 rounded-md shadow text-sm font-medium text-blue-800 flex items-center"
                >
                  <span className="mr-1 text-xl">⚠️</span>
                  <span>댕져러스 추가</span>
                </button>
                <div className="absolute left-0 -bottom-24 group-hover:block bg-white rounded-lg shadow-lg p-2 z-30 w-full">
                  <div className="flex flex-wrap gap-2 justify-center">
                    <button 
                      onClick={() => addMarkerByType('댕져러스', '들개')}
                      className="bg-red-100 hover:bg-red-200 p-2 rounded-md text-sm font-medium"
                      title="들개"
                    >
                      🐕
                    </button>
                    <button 
                      onClick={() => addMarkerByType('댕져러스', '빙판길')}
                      className="bg-blue-100 hover:bg-blue-200 p-2 rounded-md text-sm font-medium"
                      title="빙판길"
                    >
                      🧊
                    </button>
                    <button 
                      onClick={() => addMarkerByType('댕져러스', '염화칼슘')}
                      className="bg-yellow-100 hover:bg-yellow-200 p-2 rounded-md text-sm font-medium"
                      title="염화칼슘"
                    >
                      🧂
                    </button>
                    <button 
                      onClick={() => addMarkerByType('댕져러스', '공사중')}
                      className="bg-orange-100 hover:bg-orange-200 p-2 rounded-md text-sm font-medium"
                      title="공사중"
                    >
                      🚧
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 지도 영역 오른쪽 아래에 '마커 찍기' 버튼 추가 */}
        <div className="absolute bottom-24 right-4 bg-white p-3 rounded-full shadow-lg flex items-center justify-center">
          <button 
            onClick={() => addMarkerAtCenter('댕플')}
            className="flex items-center justify-center w-12 h-12 bg-amber-100 hover:bg-amber-200 rounded-full shadow-lg"
            aria-label="마커 찍기"
          >
            <span className="text-2xl">📍</span>
          </button>
        </div>
        
        {/* 마커 사용법 안내 */}
        <div className="absolute top-4 left-4 right-4 bg-black bg-opacity-70 px-4 py-3 rounded-lg text-white text-sm shadow-lg">
          <p className="font-medium mb-1">📍 마커 사용 방법:</p>
          <ul className="list-disc pl-5 space-y-1">
            {isCenterMode ? (
              <>
                <li>지도를 <strong>움직여서</strong> 중앙에 마커를 위치시키기</li>
                <li>화면 하단 버튼으로 중앙 위치에 마커 추가</li>
                <li>오른쪽 상단 버튼으로 모드 변경 가능</li>
              </>
            ) : (
              <>
                <li>지도를 <strong>터치</strong>하여 기본 마커 추가</li>
                <li>하단 버튼으로 특정 종류의 마커 추가</li>
                <li>마커를 <strong>터치</strong>하여 삭제 옵션 표시</li>
              </>
            )}
          </ul>
        </div>

        {/* 좌표 정보 표시 */}
        <div className="absolute bottom-36 left-0 right-0 flex justify-center">
          <div className="bg-white px-4 py-2 rounded-full shadow-md text-sm">
            <span className="font-medium">위도: {centerPosition.lat.toFixed(6)}, 경도: {centerPosition.lng.toFixed(6)}</span>
          </div>
        </div>

        {/* 지도 상단에 마커 타입 필터링 버튼 추가 */}
        <div className="absolute top-16 left-0 right-0 flex justify-center z-20">
          <div className="bg-white rounded-lg shadow-lg p-2 flex gap-2">
            <button 
              onClick={() => filterMarkersByType('댕플')}
              className="bg-amber-100 hover:bg-amber-200 py-2 px-4 rounded-md shadow text-sm font-medium text-amber-800"
            >
              댕플
            </button>
            <button 
              onClick={() => filterMarkersByType('댕져러스')}
              className="bg-blue-100 hover:bg-blue-200 py-2 px-4 rounded-md shadow text-sm font-medium text-blue-800"
            >
              댕져러스
            </button>
            <button 
              onClick={() => filterMarkersByType('all')}
              className="bg-gray-100 hover:bg-gray-200 py-2 px-4 rounded-md shadow text-sm font-medium text-gray-800"
            >
              전체
            </button>
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