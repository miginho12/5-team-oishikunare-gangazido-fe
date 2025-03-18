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
  const [isCenterMode, setIsCenterMode] = useState(false);
  
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
    if (!window.kakao || !window.kakao.maps) return;
    
    // 댕플 마커 이미지 - 기본 제공되는 이미지 대신 커스텀 이미지를 사용
    // 실제 강아지 이모티콘 이미지로 대체 (URL로는 이모티콘을 직접 사용할 수 없어서 마커 이미지를 사용)
    const dangpleMarkerImg = "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png";
    const dangpleMarkerSize = new window.kakao.maps.Size(35, 35);
    const dangpleMarkerOption = { offset: new window.kakao.maps.Point(17, 35) };
    markerImages.current[0].image = new window.kakao.maps.MarkerImage(dangpleMarkerImg, dangpleMarkerSize, dangpleMarkerOption);
    
    // 댕져러스 마커 이미지
    const dangerousMarkerImg = "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png";
    const dangerousMarkerSize = new window.kakao.maps.Size(35, 35);
    const dangerousMarkerOption = { offset: new window.kakao.maps.Point(17, 35) };
    markerImages.current[1].image = new window.kakao.maps.MarkerImage(dangerousMarkerImg, dangerousMarkerSize, dangerousMarkerOption);
  }, []);

  // 지도 초기화 함수
  const initMap = useCallback(() => {
    if (!mapContainer.current || !window.kakao || !window.kakao.maps) return;
    
    const options = {
      center: new window.kakao.maps.LatLng(centerPosition.lat, centerPosition.lng),
      level: 3
    };
    
    const kakaoMap = new window.kakao.maps.Map(mapContainer.current, options);
    setMap(kakaoMap);
    setIsMapLoaded(true);
    
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
      setCenterPosition({
        lat: center.getLat(),
        lng: center.getLng()
      });
    });
    
    // 줌 변경 이벤트 등록 (줌 레벨이 변경되어도 마커가 보이도록)
    window.kakao.maps.event.addListener(kakaoMap, 'zoom_changed', () => {
      // ref를 사용하여 현재 마커 배열에 접근
      const currentMarkers = markersRef.current;
      if (currentMarkers && currentMarkers.length > 0) {
        currentMarkers.forEach(markerInfo => {
          if (markerInfo.marker) {
            markerInfo.marker.setMap(kakaoMap);
          }
        });
      }
    });
    
    // 로컬 스토리지에서 저장된 마커 불러오기
    loadMarkersFromLocalStorage(kakaoMap);
    
  }, [centerPosition.lat, centerPosition.lng, initMarkerImages, isCenterMode]);
  
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
      
      // 마커 목록에서 제거
      setMarkers(prev => {
        const updatedMarkers = prev.filter(marker => marker.id !== markerId);
        // 로컬 스토리지 업데이트
        saveMarkersToLocalStorage(updatedMarkers);
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
    
    // 마커 타입에 따른 이미지 선택
    let markerImage;
    switch (markerType) {
      case '댕져러스':
        markerImage = markerImages.current[1].image;
        break;
      default:
        markerImage = markerImages.current[0].image;
    }
    
    // 마커 생성
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
    
    // 클릭 이벤트 등록
    window.kakao.maps.event.addListener(marker, 'click', () => {
      const remove = removeMarkerRef.current;
      if (!remove) return;
      
      if (markerType === '댕져러스' && subType) {
        // 댕져러스 마커 클릭 시 선택 옵션 표시
        setSelectedMarker(markerInfo);
        
        // 인포윈도우 생성
        let emoji = '';
        switch(subType) {
          case '들개': emoji = '🐕'; break;
          case '빙판길': emoji = '🧊'; break;
          case '염화칼슘': emoji = '🧂'; break;
          case '공사중': emoji = '🚧'; break;
          default: emoji = '⚠️';
        }
        
        const iwContent = `<div style="padding:5px;font-size:12px;">
          <div style="margin-bottom:4px;">${emoji} ${subType}</div>
          <button id="delete-marker" style="padding:2px 5px;background:#ff5555;color:white;border:none;border-radius:3px;">삭제</button>
        </div>`;
        const infowindow = new window.kakao.maps.InfoWindow({
          content: iwContent,
          removable: true
        });
        
        // 기존 인포윈도우 모두 닫기
        const currentMarkers = markersRef.current;
        if (currentMarkers) {
          currentMarkers.forEach(m => {
            if (m.infowindow) {
              m.infowindow.close();
            }
          });
        }
        
        // 새 인포윈도우 열기
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
      } else {
        // 일반 마커 클릭 시 삭제 옵션
        if (selectedMarker && selectedMarker.id === markerInfo.id) {
          if (window.confirm('이 마커를 삭제하시겠습니까?')) {
            remove(markerInfo.id);
          }
        } else {
          setSelectedMarker(markerInfo);
          
          // 인포윈도우 생성
          const iwContent = `<div style="padding:5px;font-size:12px;">${markerType}<br><button id="delete-marker" style="padding:2px 5px;margin-top:5px;background:#ff5555;color:white;border:none;border-radius:3px;">삭제</button></div>`;
          const infowindow = new window.kakao.maps.InfoWindow({
            content: iwContent,
            removable: true
          });
          
          // 기존 인포윈도우 모두 닫기
          const currentMarkers = markersRef.current;
          if (currentMarkers) {
            currentMarkers.forEach(m => {
              if (m.infowindow) {
                m.infowindow.close();
              }
            });
          }
          
          // 새 인포윈도우 열기
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
        }
      }
    });
    
    // 마커 배열에 추가
    setMarkers(prev => {
      const updatedMarkers = [...prev, markerInfo];
      // 로컬 스토리지에 저장
      saveMarkersToLocalStorage(updatedMarkers);
      return updatedMarkers;
    });
    
    return markerInfo;
  }, [map, selectedMarker, markerImages, saveMarkersToLocalStorage]);
  
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
    try {
      const savedMarkers = JSON.parse(localStorage.getItem('kakaoMapMarkers') || '[]');
      
      if (savedMarkers.length > 0) {
        const newMarkers = [];
        
        savedMarkers.forEach(markerInfo => {
          const position = new window.kakao.maps.LatLng(
            markerInfo.position.lat, 
            markerInfo.position.lng
          );
          
          // 마커 이미지 선택
          let markerImage;
          if (markerInfo.type === '댕져러스') {
            markerImage = markerImages.current[1].image;
          } else {
            markerImage = markerImages.current[0].image;
          }
          
          // 마커 생성
          const marker = new window.kakao.maps.Marker({
            position,
            map: kakaoMap,
            image: markerImage
          });
          
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
            if (markerInfo.type === '댕져러스' && markerInfo.subType) {
              // 댕져러스 마커 클릭 시
              setSelectedMarker(newMarkerInfo);
              
              // 인포윈도우 생성
              let emoji = '';
              switch(markerInfo.subType) {
                case '들개': emoji = '🐕'; break;
                case '빙판길': emoji = '🧊'; break;
                case '염화칼슘': emoji = '🧂'; break;
                case '공사중': emoji = '🚧'; break;
                default: emoji = '⚠️';
              }
              
              const iwContent = `<div style="padding:5px;font-size:12px;">
                <div style="margin-bottom:4px;">${emoji} ${markerInfo.subType}</div>
                <button id="delete-marker" style="padding:2px 5px;background:#ff5555;color:white;border:none;border-radius:3px;">삭제</button>
              </div>`;
              const infowindow = new window.kakao.maps.InfoWindow({
                content: iwContent,
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
            } else {
              // 일반 마커 클릭 시
              if (selectedMarker && selectedMarker.id === newMarkerInfo.id) {
                if (window.confirm('이 마커를 삭제하시겠습니까?')) {
                  removeMarker(newMarkerInfo.id);
                }
              } else {
                setSelectedMarker(newMarkerInfo);
                
                // 인포윈도우 생성
                const iwContent = `<div style="padding:5px;font-size:12px;">${markerInfo.type}<br><button id="delete-marker" style="padding:2px 5px;margin-top:5px;background:#ff5555;color:white;border:none;border-radius:3px;">삭제</button></div>`;
                const infowindow = new window.kakao.maps.InfoWindow({
                  content: iwContent,
                  removable: true
                });
                
                // 기존 인포윈도우 모두 닫기
                const currentMarkers = markersRef.current;
                if (currentMarkers) {
                  currentMarkers.forEach(m => {
                    if (m.infowindow) {
                      m.infowindow.close();
                    }
                  });
                }
                
                // 새 인포윈도우 열기
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
              }
            }
          });
          
          // 새 마커 배열에 추가
          newMarkers.push(newMarkerInfo);
        });
        
        // 모든 마커를 한번에 상태에 추가
        setMarkers(prev => [...prev, ...newMarkers]);
      }
    } catch (error) {
      console.error('저장된 마커를 불러오는 중 오류 발생:', error);
      localStorage.removeItem('kakaoMapMarkers');
    }
  }, [markerImages, removeMarker]);
  
  // 현재 위치로 이동하기
  const moveToCurrentLocation = useCallback(() => {
    if (!map) return;
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const locPosition = new window.kakao.maps.LatLng(lat, lng);
          
          // 현재 위치 마커 생성
          const imageSrc = "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png";
          const imageSize = new window.kakao.maps.Size(24, 35);
          const markerImage = new window.kakao.maps.MarkerImage(imageSrc, imageSize);
          
          // 기존 현재 위치 마커 제거
          const currentLocationMarker = markers.find(marker => marker.type === 'currentLocation');
          if (currentLocationMarker) {
            removeMarker(currentLocationMarker.id);
          }
          
          // 새 마커 생성
          const marker = new window.kakao.maps.Marker({
            map: map,
            position: locPosition,
            image: markerImage
          });
          
          // 마커 정보 객체
          const markerInfo = {
            id: 'currentLocation-' + Date.now().toString(),
            marker,
            position: {
              lat,
              lng
            },
            type: 'currentLocation'
          };
          
          // 마커 배열에 추가
          setMarkers(prev => [...prev, markerInfo]);
          
          // 지도 이동
          map.setCenter(locPosition);
          
          // 중심 좌표 업데이트
          setCenterPosition({ lat, lng });
        },
        (error) => {
          let errorMessage = "현재 위치를 가져오는데 실패했습니다.";
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "위치 정보 접근 권한이 거부되었습니다.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "위치 정보를 사용할 수 없습니다.";
              break;
            case error.TIMEOUT:
              errorMessage = "위치 정보 요청 시간이 초과되었습니다.";
              break;
            case error.UNKNOWN_ERROR:
              errorMessage = "알 수 없는 오류가 발생했습니다.";
              break;
          }
          
          // HTTPS 연결이 필요한 경우 안내
          if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
            errorMessage += " HTTPS 연결이 필요합니다.";
          }
          
          alert(errorMessage);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      alert("이 브라우저에서는 위치 정보를 지원하지 않습니다.");
    }
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
      
      // 마커 배열 초기화
      setMarkers([]);
      
      // 선택된 마커 초기화
      setSelectedMarker(null);
      
      // 로컬 스토리지 초기화
      localStorage.removeItem('kakaoMapMarkers');
    }
  }, [markers]);

  // 지도 초기화
  useEffect(() => {
    const loadKakaoMap = () => {
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
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.REACT_APP_KAKAO_MAP_API_KEY}&autoload=false`;
      
      script.onload = () => {
        loadKakaoMap();
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
                <span>중앙에 댕플 추가</span>
              </button>
              <div className="relative group">
                <button 
                  className="bg-blue-100 hover:bg-blue-200 py-2 px-4 rounded-md shadow text-sm font-medium text-blue-800 flex items-center"
                >
                  <span className="mr-1 text-xl">⚠️</span>
                  <span>중앙에 댕져러스 추가</span>
                </button>
                <div className="absolute left-0 -bottom-24 hidden group-hover:block bg-white rounded-lg shadow-lg p-2 z-30 w-full">
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
                <div className="absolute left-0 -bottom-24 hidden group-hover:block bg-white rounded-lg shadow-lg p-2 z-30 w-full">
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
        
        {/* 현재 위치 버튼 */}
        <button 
          onClick={moveToCurrentLocation}
          className="absolute bottom-24 right-4 bg-white p-3 rounded-full shadow-lg flex items-center justify-center"
          aria-label="현재 위치로 이동"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
        </button>

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