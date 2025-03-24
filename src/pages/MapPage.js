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
  const [currentZoomLevel, setCurrentZoomLevel] = useState(3);
  // eslint-disable-next-line no-unused-vars
  const [visibleMarkers, setVisibleMarkers] = useState([]);
  const mapBoundsRef = useRef(null);
  const clusterRef = useRef(null);

  // 모달 관련 상태 수정
  const [showModal, setShowModal] = useState(false);
  const [tempMarkerType, setTempMarkerType] = useState('댕플');
  const [tempMarkerSubType, setTempMarkerSubType] = useState(null);

  // 카카오맵 API 스크립트 로딩 상태
  const [kakaoMapLoaded, setKakaoMapLoaded] = useState(false);

  // 마커 필터링 타입 저장 상태 추가
  // eslint-disable-next-line no-unused-vars
  const [filterType, setFilterType] = useState('all');

  // 순환 참조를 막기 위한 removeMarker 함수 ref
  const removeMarkerRef = useRef(null);

  // 구름스퀘어 좌표
  const [centerPosition, setCenterPosition] = useState({
    lat: 33.450701, // 제주도 구름스퀘어 위도
    lng: 126.570667 // 제주도 구름스퀘어 경도
  });

  // 카카오맵 API 스크립트 동적 로드 함수
  const loadKakaoMapScript = useCallback(() => {
    // 이미 로드된 경우 중복 로드 방지
    if (window.kakao && window.kakao.maps) {
      setKakaoMapLoaded(true);
      return;
    }

    // API 키 가져오기
    const apiKey = process.env.REACT_APP_KAKAO_MAP_API_KEY;
    if (!apiKey) {
      console.error("카카오맵 API 키가 환경 변수에 설정되지 않았습니다.");
      return;
    }

    // 스크립트 태그 생성
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services,clusterer&autoload=false`;
    script.async = true;

    // 스크립트 로드 완료 시 처리
    script.onload = () => {
      // autoload=false 옵션을 사용했으므로 수동으로 로드 실행
      window.kakao.maps.load(() => {
        console.log('카카오맵 API 로드 완료');
        setKakaoMapLoaded(true);
      });
    };

    // 스크립트 로드 실패 시 처리
    script.onerror = () => {
      console.error('카카오맵 API 로드 실패');
      setKakaoMapLoaded(false);
    };

    // 스크립트 추가
    document.head.appendChild(script);
  }, []);

  // 컴포넌트 마운트 시 카카오맵 API 스크립트 로드
  useEffect(() => {
    loadKakaoMapScript();
  }, [loadKakaoMapScript]);

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

  // 마커 타입 코드 상수
  const MARKER_TYPES = {
    댕플: 0,
    댕져러스: {
      DEFAULT: 1,
      들개: 1,
      빙판길: 2,
      염화칼슘: 3,
      공사중: 4
    }
  };

  // 마커 이미지 URL 상수
  const MARKER_IMAGES = {
    댕플: "https://cdn-icons-png.flaticon.com/512/1596/1596810.png",
    댕져러스: {
      DEFAULT: "https://cdn-icons-png.flaticon.com/512/4636/4636076.png",
      들개: "https://cdn-icons-png.flaticon.com/512/2171/2171990.png",
      빙판길: "https://cdn-icons-png.flaticon.com/512/5435/5435526.png",
      염화칼슘: "https://cdn-icons-png.flaticon.com/512/9430/9430308.png",
      공사중: "https://cdn-icons-png.flaticon.com/512/2913/2913371.png"
    },
    // 이모티콘 URL 추가
    EMOJI: {
      들개: "🐕",
      빙판길: "🧊",
      염화칼슘: "🧂",
      공사중: "🚧"
    }
  };

  // 마커 타입 코드 가져오기
  const getMarkerTypeCode = (type, subType = null) => {
    if (type === '댕플') return MARKER_TYPES.댕플;
    if (type === '댕져러스') {
      return subType ? MARKER_TYPES.댕져러스[subType] : MARKER_TYPES.댕져러스.DEFAULT;
    }
    return 0; // 기본값
  };

  // 마커 타입 문자열 가져오기
  const getMarkerTypeString = (typeCode) => {
    if (typeCode === MARKER_TYPES.댕플) return '댕플';

    // 댕져러스 서브타입 찾기
    for (const [subType, code] of Object.entries(MARKER_TYPES.댕져러스)) {
      if (code === typeCode) {
        return subType === 'DEFAULT' ? '댕져러스' : `댕져러스:${subType}`;
      }
    }

    return '댕플'; // 기본값
  };

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
      // 댕플 마커 이미지 초기화
      const dangpleMarkerSize = new window.kakao.maps.Size(40, 40);
      const dangpleMarkerOption = { offset: new window.kakao.maps.Point(20, 40) };
      markerImages.current[0].image = new window.kakao.maps.MarkerImage(
        MARKER_IMAGES.댕플,
        dangpleMarkerSize,
        dangpleMarkerOption
      );

      // markerImages.current[1]에 서브타입 이미지 객체 추가 확인
      if (!markerImages.current[1]) {
        markerImages.current[1] = {
          type: '댕져러스',
          subTypes: ['들개', '빙판길', '염화칼슘', '공사중']
        };
      }

      // 댕져러스 서브타입별 마커 이미지 설정
      const subTypes = ['들개', '빙판길', '염화칼슘', '공사중'];
      subTypes.forEach(subType => {
        const size = new window.kakao.maps.Size(40, 40);
        const option = { offset: new window.kakao.maps.Point(20, 40) };

        try {
          // 서브타입 이미지 URL 대신 이모티콘 이미지 사용
          const emojiText = MARKER_IMAGES.EMOJI[subType] || '⚠️';

          // 캔버스를 사용하여 이모티콘 기반 이미지 생성
          const canvas = document.createElement('canvas');
          canvas.width = 40;
          canvas.height = 40;
          const ctx = canvas.getContext('2d');

          // 배경 원 그리기
          ctx.beginPath();
          ctx.arc(20, 20, 18, 0, 2 * Math.PI);
          ctx.fillStyle = '#3b82f6'; // 파란색 배경
          ctx.fill();

          // 이모티콘 텍스트 그리기
          ctx.font = '20px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(emojiText, 20, 18);

          // 캔버스를 데이터 URL로 변환
          const imgUrl = canvas.toDataURL();

          markerImages.current[1][subType] = new window.kakao.maps.MarkerImage(
            imgUrl,
            size,
            option
          );
        } catch (e) {
          console.error(`서브타입 ${subType} 마커 이미지 초기화 오류:`, e);
        }
      });

      // 기본 댕져러스 마커 이미지 설정도 이모티콘 스타일로 변경
      const canvas = document.createElement('canvas');
      canvas.width = 40;
      canvas.height = 40;
      const ctx = canvas.getContext('2d');

      // 배경 원 그리기
      ctx.beginPath();
      ctx.arc(20, 20, 18, 0, 2 * Math.PI);
      ctx.fillStyle = '#3b82f6'; // 파란색 배경
      ctx.fill();

      // 기본 경고 이모티콘
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚠️', 20, 18);

      const defaultImgUrl = canvas.toDataURL();

      markerImages.current[1].image = new window.kakao.maps.MarkerImage(
        defaultImgUrl,
        new window.kakao.maps.Size(40, 40),
        { offset: new window.kakao.maps.Point(20, 40) }
      );

      console.log("마커 이미지 초기화 성공", markerImages.current);
    } catch (error) {
      console.error("마커 이미지 초기화 중 오류 발생:", error);
    }
  }, [MARKER_IMAGES]);

  // addMarker 함수의 ref 추가
  const addMarkerRef = useRef(null);

  // 지도 초기화
  useEffect(() => {
    // 카카오맵 API가 로드되지 않았으면 초기화하지 않음
    if (!kakaoMapLoaded) {
      return;
    }

    // 카카오맵 초기화 함수
    const initializeMap = () => {
      try {
        // 맵 컨테이너 확인
        if (!mapContainer.current) {
          return;
        }

        // 카카오맵 객체 확인
        if (!window.kakao || !window.kakao.maps) {
          setTimeout(initializeMap, 200); // 200ms 후 재시도
          return;
        }

        // 이미 맵이 초기화된 경우 중복 초기화 방지
        if (map) return;

        // 지도 옵션 설정
        const options = {
          center: new window.kakao.maps.LatLng(centerPosition.lat, centerPosition.lng),
          level: currentZoomLevel
        };

        // 지도 생성
        const kakaoMapInstance = new window.kakao.maps.Map(mapContainer.current, options);

        // 상태 업데이트
        setMap(kakaoMapInstance);
        setIsMapLoaded(true);

        // 마커 클러스터러 초기화
        try {
          if (window.kakao.maps.MarkerClusterer) {
            const clusterer = new window.kakao.maps.MarkerClusterer({
              map: kakaoMapInstance,
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
        } catch (error) {
          console.error("마커 클러스터러 초기화 오류");
        }

        // 마커 이미지 초기화
        initMarkerImages();

        // 이벤트 리스너 등록 - 클릭 (중앙 모드가 아닐 때)
        const clickListener = window.kakao.maps.event.addListener(kakaoMapInstance, 'click', (mouseEvent) => {
          // 중앙 모드가 아닐 때만 실행하고, 
          // 직접 지도를 클릭했을 때는 모달과 중앙 모드를 활성화하지 않고 마커를 바로 생성
          if (!isCenterMode && addMarkerRef.current) {
            // 지도 클릭 시에는 마커를 바로 생성하도록 수정된 함수 호출
            createMarkerFromPosition(mouseEvent.latLng);
          }
        });

        // 드래그 종료 이벤트 등록 - 지도 중심 위치 업데이트만 담당
        const dragendListener = window.kakao.maps.event.addListener(kakaoMapInstance, 'dragend', () => {
          if (!kakaoMapInstance) return;

          // 위치 및 줌 레벨 업데이트
          const center = kakaoMapInstance.getCenter();
          const level = kakaoMapInstance.getLevel();

          // 상태 업데이트
          setCurrentZoomLevel(level);
          setCenterPosition({
            lat: center.getLat(),
            lng: center.getLng()
          });

          // 보이는 영역 업데이트
          updateVisibleMarkers(kakaoMapInstance);
        });

        // 줌 변경 이벤트 등록 - 줌 레벨 업데이트만 담당
        const zoomChangedListener = window.kakao.maps.event.addListener(kakaoMapInstance, 'zoom_changed', () => {
          if (!kakaoMapInstance) return;

          // 줌 레벨 업데이트
          const level = kakaoMapInstance.getLevel();
          setCurrentZoomLevel(level);

          // 보이는 영역 업데이트
          updateVisibleMarkers(kakaoMapInstance);
        });

        // 보이는 마커 업데이트 함수
        const updateVisibleMarkers = (mapInstance) => {
          if (!mapInstance) return;

          // 현재 맵 경계 가져오기
          const bounds = mapInstance.getBounds();
          mapBoundsRef.current = bounds;

          // 보이는 영역에 있는 마커만 필터링
          const currentMarkers = markersRef.current;
          if (currentMarkers && currentMarkers.length > 0) {
            // 모든 마커는 지도에 계속 표시되도록 유지
            currentMarkers.forEach(markerInfo => {
              // 이미 지도에 표시되지 않은 마커만 다시 표시 (필터링된 마커는 제외)
              if (markerInfo.marker && !markerInfo.marker.getMap()) {
                markerInfo.marker.setMap(mapInstance);
              }
            });

            // 보이는 영역에 있는 마커만 필터링하여 visibleMarkers 상태와 클러스터러 업데이트
            const visibleMarkersFiltered = currentMarkers.filter(markerInfo => {
              if (!markerInfo.marker) return false;

              const markerPosition = markerInfo.marker.getPosition();
              return bounds.contain(markerPosition);
            });

            // 보이는 마커 업데이트 (배치 업데이트)
            setVisibleMarkers(visibleMarkersFiltered);

            // 클러스터러 업데이트
            if (clusterRef.current) {
              clusterRef.current.clear();

              const kakaoMarkers = visibleMarkersFiltered.map(m => m.marker);
              if (kakaoMarkers.length > 0) {
                clusterRef.current.addMarkers(kakaoMarkers);
              }
            }
          }
        };

        // 초기 지도 영역 설정
        mapBoundsRef.current = kakaoMapInstance.getBounds();

        // 로컬 스토리지에서 저장된 마커 불러오기
        if (loadMarkersFromLocalStorageRef.current) {
          // 약간의 지연을 두어 초기화 문제 방지
          setTimeout(() => {
            loadMarkersFromLocalStorageRef.current(kakaoMapInstance);
          }, 200);
        }

        // 컴포넌트 언마운트 시 이벤트 리스너 제거를 위한 리턴 함수
        return () => {
          try {
            if (window.kakao && window.kakao.maps && window.kakao.maps.event) {
              window.kakao.maps.event.removeListener(clickListener);
              window.kakao.maps.event.removeListener(dragendListener);
              window.kakao.maps.event.removeListener(zoomChangedListener);
            }
          } catch (error) {
            // 오류 발생 시 무시
          }
        };
      } catch (error) {
        console.error("지도 초기화 중 오류 발생");
        setIsMapLoaded(false);
      }
    };

    // 지도 초기화 함수 호출
    initializeMap();

  }, [centerPosition.lat, centerPosition.lng, initMarkerImages, isCenterMode, currentZoomLevel, map, kakaoMapLoaded]);

  // 로컬 스토리지에 마커 저장
  const saveMarkersToLocalStorage = useCallback((markersToSave) => {
    try {
      const markersForStorage = markersToSave.map(markerInfo => {
        if (!markerInfo || !markerInfo.position) return null;

        // 타입을 숫자 코드로 변환
        const typeCode = getMarkerTypeCode(markerInfo.type, markerInfo.subType);

        return {
          id: markerInfo.id,
          position: {
            lat: markerInfo.position.lat,
            lng: markerInfo.position.lng
          },
          typeCode: typeCode
        };
      }).filter(Boolean); // null 값 제거

      // 지도 중심 좌표와 줌 레벨도 함께 저장
      const mapData = {
        markers: markersForStorage,
        mapInfo: {
          center: {
            lat: centerPosition.lat,
            lng: centerPosition.lng
          },
          zoomLevel: currentZoomLevel
        }
      };

      // 로컬 스토리지에 저장하기 전에 일정 시간 지연 (디바운싱)
      if (saveMarkersToLocalStorage.timer) {
        clearTimeout(saveMarkersToLocalStorage.timer);
      }

      saveMarkersToLocalStorage.timer = setTimeout(() => {
        localStorage.setItem('kakaoMapData', JSON.stringify(mapData));
      }, 500); // 500ms 디바운스
    } catch (error) {
      // 저장 실패는 조용히 무시
    }
  }, [centerPosition.lat, centerPosition.lng, currentZoomLevel, getMarkerTypeCode]);

  // 저장 함수의 타이머 속성 초기화
  saveMarkersToLocalStorage.timer = null;

  // 마커 제거 함수
  const removeMarker = useCallback((markerId) => {
    try {
      // 해당 마커 찾기
      const currentMarkers = markersRef.current;
      const markerToRemove = currentMarkers.find(marker => marker.id === markerId);

      if (markerToRemove) {
        // 지도에서 마커 제거
        try {
          markerToRemove.marker.setMap(null);
        } catch (setMapError) {
          console.error("마커 지도에서 제거 중 오류:", setMapError);
        }

        // 인포윈도우가 있다면 닫기
        if (markerToRemove.infowindow) {
          try {
            markerToRemove.infowindow.close();
          } catch (closeError) {
            console.error("인포윈도우 닫기 중 오류:", closeError);
          }
        }

        // 클러스터에서도 제거
        if (clusterRef.current) {
          try {
            clusterRef.current.removeMarker(markerToRemove.marker);
          } catch (clusterError) {
            console.error("클러스터에서 마커 제거 중 오류:", clusterError);
          }
        }

        // 마커 목록에서 제거
        setMarkers(prev => {
          const updatedMarkers = prev.filter(marker => marker.id !== markerId);

          // 로컬 스토리지 업데이트
          try {
            saveMarkersToLocalStorage(updatedMarkers);
          } catch (saveError) {
            console.error("마커 저장 중 오류:", saveError);
          }

          // 보이는 마커 목록도 업데이트
          try {
            setVisibleMarkers(prev => prev.filter(marker => marker.id !== markerId));
          } catch (visibleError) {
            console.error("보이는 마커 업데이트 중 오류:", visibleError);
          }

          return updatedMarkers;
        });

        // 선택된 마커가 삭제되는 경우 선택 해제
        if (selectedMarker && selectedMarker.id === markerId) {
          setSelectedMarker(null);
        }
      }
    } catch (error) {
      console.error("마커 제거 중 예상치 못한 오류:", error);
    }
  }, [selectedMarker, saveMarkersToLocalStorage]);

  // removeMarker 함수를 ref에 저장
  useEffect(() => {
    removeMarkerRef.current = removeMarker;
  }, [removeMarker]);

  // 마커 추가 함수 - 버튼 클릭 시 사용되는 함수(모달 표시)
  const addMarker = useCallback((position, markerType = '댕플', subType = null) => {
    // 모달 표시와 함께 중앙 모드 활성화
    setTempMarkerType(markerType);
    setTempMarkerSubType(subType);
    setShowModal(true);

    // 중앙 모드 강제 활성화
    setIsCenterMode(true);

    return null; // 실제 마커는 모달에서 확인 버튼 클릭 시 생성됨
  }, []);

  // 지도 클릭 시 직접 마커를 생성하는 함수 추가
  const createMarkerFromPosition = useCallback((position) => {
    if (!map) return null;

    try {
      // 기본 마커 타입 설정 (지도 클릭 시 생성되는 마커는 기본적으로 댕플 타입)
      const markerType = '댕플';
      const markerSubType = null;

      // 마커 이미지 가져오기
      let markerImage = markerImages.current[0] && markerImages.current[0].image;

      if (!markerImage) {
        // 마커 이미지가 초기화되지 않은 경우 초기화 시도
        initMarkerImages();
        markerImage = markerImages.current[0] && markerImages.current[0].image;
      }

      // 마커 생성
      let marker;
      try {
        marker = new window.kakao.maps.Marker({
          position: position,
          map, // 항상 지도에 표시
          image: markerImage
        });
      } catch (markerError) {
        console.error("카카오맵 마커 객체 생성 중 오류 발생:", markerError);
        return null;
      }

      // 마커 정보 객체
      const markerInfo = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 10),
        marker,
        position: {
          lat: position.getLat(),
          lng: position.getLng()
        },
        type: markerType,
        subType: markerSubType
      };

      // 클릭 이벤트 등록
      try {
        window.kakao.maps.event.addListener(marker, 'click', () => {
          try {
            // 기존 인포윈도우 모두 닫기 (성능 최적화)
            markersRef.current.forEach(m => {
              if (m.infowindow) {
                m.infowindow.close();
                m.infowindow = null; // 메모리 정리
              }
            });

            // 인포윈도우 생성
            let infoContent = '';

            if (markerType === '댕져러스' && markerSubType) {
              // 댕져러스 마커 클릭 시
              let emoji = '';
              switch (markerSubType) {
                case '들개': emoji = '🐕'; break;
                case '빙판길': emoji = '🧊'; break;
                case '염화칼슘': emoji = '🧂'; break;
                case '공사중': emoji = '🚧'; break;
                default: emoji = '⚠️';
              }

              infoContent = `<div style="padding:5px;font-size:12px;">
                <div style="margin-bottom:4px;">${emoji} ${markerType}${markerSubType ? ` - ${markerSubType}` : ''}</div>
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
                  // removeMarker 함수 ref 사용
                  if (removeMarkerRef.current) {
                    removeMarkerRef.current(markerInfo.id);
                  }
                  infowindow.close();
                };
              }
            }, 100);

            // 선택된 마커 업데이트
            setSelectedMarker(markerInfo);
          } catch (clickError) {
            console.error("마커 클릭 처리 중 오류 발생:", clickError);
          }
        });
      } catch (eventError) {
        console.error("마커 이벤트 등록 중 오류 발생:", eventError);
      }

      // 마커 배열에 추가
      try {
        setMarkers(prev => {
          const updatedMarkers = [...prev, markerInfo];

          // 로컬 스토리지에 저장
          try {
            if (saveMarkersToLocalStorageRef.current) {
              saveMarkersToLocalStorageRef.current(updatedMarkers);
            } else if (typeof saveMarkersToLocalStorage === 'function') {
              saveMarkersToLocalStorage(updatedMarkers);
            } else {
              console.warn("마커 저장 함수가 초기화되지 않았습니다.");
            }
          } catch (saveError) {
            console.error("마커 저장 중 오류 발생:", saveError);
          }

          // 새 마커가 현재 화면에 보이는지 확인하고 클러스터에만 추가
          try {
            if (mapBoundsRef.current && mapBoundsRef.current.contain(position)) {
              // 수정: 개별 상태 업데이트 대신 일괄 업데이트 작업 스케줄링
              setTimeout(() => {
                setVisibleMarkers(current => [...current, markerInfo]);

                // 클러스터에 마커 추가
                if (clusterRef.current) {
                  try {
                    clusterRef.current.addMarker(marker);
                  } catch (clusterError) {
                    console.warn("클러스터에 마커 추가 중 오류:", clusterError);
                  }
                }
              }, 10);
            }
          } catch (visibleError) {
            console.warn("보이는 마커 업데이트 중 오류:", visibleError);
          }

          return updatedMarkers;
        });
      } catch (setMarkersError) {
        console.error("마커 상태 업데이트 중 오류:", setMarkersError);
        // 상태 업데이트에 실패하면 맵에서 마커 제거
        try { marker.setMap(null); } catch (e) { /* 마커 제거 실패는 무시 */ }
        return null;
      }

      // 마커 생성 완료 후 중앙 모드 비활성화
      setIsCenterMode(false);

      console.log("마커가 성공적으로 생성되었습니다.");
      return markerInfo;
    } catch (error) {
      console.error("마커 생성 중 예상치 못한 오류 발생:", error);
      setIsCenterMode(false); // 오류 발생 시에도 중앙 모드 비활성화
      return null;
    }
  }, [map, initMarkerImages, markerImages, mapBoundsRef, saveMarkersToLocalStorage]);

  // 모달에서 확정 버튼 클릭 시 실제 마커 생성 함수
  const createMarkerFromModal = useCallback(() => {
    if (!map) return;

    try {
      // 현재 지도 중앙 위치 가져오기
      const center = map.getCenter();

      // 마커 이미지 결정
      let markerImage;
      if (tempMarkerType === '댕져러스') {
        markerImage = markerImages.current[1] &&
          (tempMarkerSubType ?
            markerImages.current[1][tempMarkerSubType] :
            markerImages.current[1].image);
      } else {
        markerImage = markerImages.current[0] && markerImages.current[0].image;
      }

      if (!markerImage) {
        // 마커 이미지가 초기화되지 않은 경우 초기화 시도
        initMarkerImages();
        // 다시 이미지 가져오기 시도
        if (tempMarkerType === '댕져러스') {
          markerImage = markerImages.current[1] &&
            (tempMarkerSubType ?
              markerImages.current[1][tempMarkerSubType] :
              markerImages.current[1].image);
        } else {
          markerImage = markerImages.current[0] && markerImages.current[0].image;
        }
      }

      let marker;
      try {
        marker = new window.kakao.maps.Marker({
          position: center,
          map, // 항상 지도에 표시
          image: markerImage
        });
      } catch (markerError) {
        console.error("카카오맵 마커 객체 생성 중 오류 발생:", markerError);
        return null;
      }

      // 마커 정보 객체
      const markerInfo = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 10),
        marker,
        position: {
          lat: center.getLat(),
          lng: center.getLng()
        },
        type: tempMarkerType,
        subType: tempMarkerSubType
      };

      // 클릭 이벤트 등록
      try {
        window.kakao.maps.event.addListener(marker, 'click', () => {
          try {
            // 기존 인포윈도우 모두 닫기 (성능 최적화)
            markersRef.current.forEach(m => {
              if (m.infowindow) {
                m.infowindow.close();
                m.infowindow = null; // 메모리 정리
              }
            });

            // 인포윈도우 생성
            let infoContent = '';

            if (tempMarkerType === '댕져러스') {
              const subtypeText = tempMarkerSubType ? ` - ${tempMarkerSubType}` : '';
              const emoji = tempMarkerSubType ? MARKER_IMAGES.EMOJI[tempMarkerSubType] || '⚠️' : '⚠️';

              infoContent = `<div style="padding:5px;font-size:12px;">
                <div style="margin-bottom:4px;">${emoji} ${tempMarkerType}${subtypeText}</div>
                <button id="delete-marker" style="padding:2px 5px;background:#ff5555;color:white;border:none;border-radius:3px;">삭제</button>
              </div>`;
            } else {
              infoContent = `<div style="padding:5px;font-size:12px;">${tempMarkerType}<br><button id="delete-marker" style="padding:2px 5px;margin-top:5px;background:#ff5555;color:white;border:none;border-radius:3px;">삭제</button></div>`;
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
                  // removeMarker 함수 ref 사용
                  if (removeMarkerRef.current) {
                    removeMarkerRef.current(markerInfo.id);
                  }
                  infowindow.close();
                };
              }
            }, 100);

            // 선택된 마커 업데이트
            setSelectedMarker(markerInfo);
          } catch (clickError) {
            console.error("마커 클릭 처리 중 오류 발생:", clickError);
          }
        });
      } catch (eventError) {
        console.error("마커 이벤트 등록 중 오류 발생:", eventError);
      }

      // 마커 배열에 추가
      try {
        setMarkers(prev => {
          const updatedMarkers = [...prev, markerInfo];

          // 로컬 스토리지에 저장
          try {
            if (saveMarkersToLocalStorageRef.current) {
              saveMarkersToLocalStorageRef.current(updatedMarkers);
            } else if (typeof saveMarkersToLocalStorage === 'function') {
              saveMarkersToLocalStorage(updatedMarkers);
            } else {
              console.warn("마커 저장 함수가 초기화되지 않았습니다.");
            }
          } catch (saveError) {
            console.error("마커 저장 중 오류 발생:", saveError);
          }

          // 새 마커가 현재 화면에 보이는지 확인하고 클러스터에만 추가
          try {
            if (mapBoundsRef.current && mapBoundsRef.current.contain(center)) {
              // 수정: 개별 상태 업데이트 대신 일괄 업데이트 작업 스케줄링
              setTimeout(() => {
                setVisibleMarkers(current => [...current, markerInfo]);

                // 클러스터에 마커 추가
                if (clusterRef.current) {
                  try {
                    clusterRef.current.addMarker(marker);
                  } catch (clusterError) {
                    console.warn("클러스터에 마커 추가 중 오류:", clusterError);
                  }
                }
              }, 10);
            }
          } catch (visibleError) {
            console.warn("보이는 마커 업데이트 중 오류:", visibleError);
          }

          return updatedMarkers;
        });
      } catch (setMarkersError) {
        console.error("마커 상태 업데이트 중 오류:", setMarkersError);
        // 상태 업데이트에 실패하면 맵에서 마커 제거
        try { marker.setMap(null); } catch (e) { /* 마커 제거 실패는 무시 */ }
        return null;
      }

      // 마커 생성 완료 후 중앙 모드 비활성화
      setIsCenterMode(false);

      console.log("마커가 성공적으로 생성되었습니다.");
      return markerInfo;
    } catch (error) {
      console.error("마커 생성 중 예상치 못한 오류 발생:", error);
      setIsCenterMode(false); // 오류 발생 시에도 중앙 모드 비활성화
      return null;
    }
  }, [map, tempMarkerType, tempMarkerSubType, saveMarkersToLocalStorage, initMarkerImages, markerImages, mapBoundsRef]);

  // 특정 타입의 마커 추가하기
  // eslint-disable-next-line no-unused-vars
  const addMarkerByType = useCallback((type, subType = null) => {
    if (!map || !addMarkerRef.current) return;

    const center = map.getCenter();
    addMarkerRef.current(center, type, subType);
  }, [map]);

  // 현재 중앙 위치에 마커 추가하기
  const addMarkerAtCenter = useCallback((type = '댕플', subType = null) => {
    if (!map || !addMarkerRef.current) return;

    const center = map.getCenter();
    addMarkerRef.current(center, type, subType);
  }, [map]);

  // 현재 중앙 위치에 댕져러스 서브타입 마커 추가하기
  const addDangerousMarkerWithSubType = useCallback((subType) => {
    if (!map || !addMarkerRef.current) return;

    const center = map.getCenter();
    addMarkerRef.current(center, '댕져러스', subType);
  }, [map]);

  // 로컬 스토리지에서 마커 불러오기
  const loadMarkersFromLocalStorage = useCallback((kakaoMap) => {
    // Kakao Maps API가 준비되지 않았으면 중단
    if (!window.kakao || !window.kakao.maps) {
      return;
    }

    try {
      const savedData = JSON.parse(localStorage.getItem('kakaoMapData') || '{}');

      // 저장된 마커가 없으면 중단
      const savedMarkers = savedData.markers || [];
      if (savedMarkers.length === 0) return;

      // 저장된 지도 정보 복원
      if (savedData.mapInfo) {
        // 중심 위치 설정
        try {
          const center = new window.kakao.maps.LatLng(
            savedData.mapInfo.center.lat,
            savedData.mapInfo.center.lng
          );
          kakaoMap.setCenter(center);

          // 줌 레벨 설정
          if (savedData.mapInfo.zoomLevel) {
            kakaoMap.setLevel(savedData.mapInfo.zoomLevel);
            setCurrentZoomLevel(savedData.mapInfo.zoomLevel);
          }

          setCenterPosition({
            lat: savedData.mapInfo.center.lat,
            lng: savedData.mapInfo.center.lng
          });
        } catch (error) {
          // 지도 정보 복원 오류는 무시
        }
      }

      // 한 번에 최대 100개의 마커만 로드 (성능 최적화)
      const markersToLoad = savedMarkers.slice(0, 100);
      const bounds = kakaoMap.getBounds();
      mapBoundsRef.current = bounds;

      // 성능 최적화: 일괄 처리를 위한 배열
      const newMarkers = [];
      const clusterMarkers = [];

      // 마커 일괄 생성 (DOM 조작 최소화)
      markersToLoad.forEach(markerInfo => {
        try {
          const position = new window.kakao.maps.LatLng(
            markerInfo.position.lat,
            markerInfo.position.lng
          );

          // 타입 결정 - 수정: 타입코드에서 타입 정보 추출을 더 정확하게 처리
          let type, subType;

          if (markerInfo.typeCode !== undefined) {
            // 타입 코드가 있는 경우 (새 형식)
            if (markerInfo.typeCode === MARKER_TYPES.댕플) {
              type = '댕플';
              subType = null;
            } else {
              // 댕져러스 타입인 경우 서브타입 찾기
              type = '댕져러스';

              // 서브타입 결정
              for (const [key, value] of Object.entries(MARKER_TYPES.댕져러스)) {
                if (value === markerInfo.typeCode && key !== 'DEFAULT') {
                  subType = key;
                  break;
                }
              }

              // 서브타입을 찾지 못한 경우 기본값 사용
              if (!subType) {
                subType = null; // 기본 댕져러스
              }
            }
          } else {
            // 기존 형식 지원
            type = markerInfo.originalType || markerInfo.type || '댕플';
            subType = markerInfo.originalSubType || markerInfo.subType || null;
          }

          // 마커 이미지 선택 로직 개선
          let markerImage;
          const currentMarkerImages = markerImages.current;

          if (type === '댕져러스') {
            if (subType && currentMarkerImages[1] && currentMarkerImages[1][subType]) {
              markerImage = currentMarkerImages[1][subType];
            } else if (currentMarkerImages[1] && currentMarkerImages[1].image) {
              markerImage = currentMarkerImages[1].image;
            } else {
              // 마커 이미지가 없는 경우 초기화 시도
              initMarkerImages();
              markerImage = currentMarkerImages[1] && currentMarkerImages[1].image;
            }
          } else {
            // 댕플 마커 이미지
            if (currentMarkerImages[0] && currentMarkerImages[0].image) {
              markerImage = currentMarkerImages[0].image;
            } else {
              // 마커 이미지가 없는 경우 초기화 시도
              initMarkerImages();
              markerImage = currentMarkerImages[0] && currentMarkerImages[0].image;
            }
          }

          // 마커 생성 - 모든 마커를 지도에 바로 추가
          const marker = new window.kakao.maps.Marker({
            position,
            map: kakaoMap, // 모든 마커를 지도에 즉시 표시
            image: markerImage
          });

          // 화면에 보이는 마커만 클러스터에 추가
          if (bounds.contain(position)) {
            clusterMarkers.push(marker);
          }

          // 새 마커 정보 객체
          const newMarkerInfo = {
            id: markerInfo.id || Date.now().toString() + Math.random().toString(36).substring(2, 9),
            marker,
            position: {
              lat: position.getLat(),
              lng: position.getLng()
            },
            type: type,
            subType: subType
          };

          // 클릭 이벤트 등록
          window.kakao.maps.event.addListener(marker, 'click', () => {
            try {
              // 기존 인포윈도우 모두 닫기 (성능 최적화)
              newMarkers.forEach(m => {
                if (m.infowindow) {
                  m.infowindow.close();
                  m.infowindow = null; // 메모리 정리
                }
              });

              // 인포윈도우 생성
              let infoContent = '';

              if (type === '댕져러스') {
                // 댕져러스 마커 클릭 시
                let emoji = '';
                if (subType) {
                  switch (subType) {
                    case '들개': emoji = '🐕'; break;
                    case '빙판길': emoji = '🧊'; break;
                    case '염화칼슘': emoji = '🧂'; break;
                    case '공사중': emoji = '🚧'; break;
                    default: emoji = '⚠️';
                  }
                } else {
                  emoji = '⚠️';
                }

                infoContent = `<div style="padding:5px;font-size:12px;">
                  <div style="margin-bottom:4px;">${emoji} ${type}${subType ? ` - ${subType}` : ''}</div>
                  <button id="delete-marker" style="padding:2px 5px;background:#ff5555;color:white;border:none;border-radius:3px;">삭제</button>
                </div>`;
              } else {
                // 일반 마커 클릭 시
                infoContent = `<div style="padding:5px;font-size:12px;">${type}<br><button id="delete-marker" style="padding:2px 5px;margin-top:5px;background:#ff5555;color:white;border:none;border-radius:3px;">삭제</button></div>`;
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
                    // removeMarker 함수 ref 사용
                    if (removeMarkerRef.current) {
                      removeMarkerRef.current(newMarkerInfo.id);
                    }
                    infowindow.close();
                  };
                }
              }, 100);

              // 선택된 마커 업데이트
              setSelectedMarker(newMarkerInfo);
            } catch (eventError) {
              // 이벤트 처리 오류는 무시
            }
          });

          // 새 마커 배열에 추가
          newMarkers.push(newMarkerInfo);
        } catch (markerError) {
          console.error("마커 생성 오류:", markerError);
          // 개별 마커 생성 오류는 무시하고 계속 진행
        }
      });

      // 클러스터에 마커 일괄 추가 (성능 최적화)
      if (clusterRef.current && clusterMarkers.length > 0) {
        setTimeout(() => {
          try {
            clusterRef.current.addMarkers(clusterMarkers);
          } catch (err) {
            console.warn("클러스터러에 마커 추가 중 오류:", err);
          }
        }, 10);
      }

      // 보이는 마커 설정 - 상태 업데이트를 일괄적으로 처리
      setTimeout(() => {
        const visibleMarkersFiltered = newMarkers.filter(markerInfo =>
          bounds.contain(markerInfo.marker.getPosition())
        );
        setVisibleMarkers(visibleMarkersFiltered);
      }, 10);

      // 모든 마커를 한번에 상태에 추가 (일괄 업데이트)
      setMarkers(newMarkers);

      console.log("로컬 스토리지에서 마커 로드 완료:", newMarkers.length);
    } catch (error) {
      console.error("로컬 스토리지 로드 오류:", error);
      // 오류 발생 시 로컬 스토리지 초기화
      localStorage.removeItem('kakaoMapData');
    }
  }, [initMarkerImages, MARKER_TYPES]);

  // 현재 위치로 이동하기 (경고 제거를 위해 사용되는 함수로 표시)
  // eslint-disable-next-line no-unused-vars
  const moveToCurrentLocation = useCallback(() => {
    // 현재 위치로 이동하는 코드...
  }, [map, markers, removeMarker]);

  // 모든 마커 지우기
  // eslint-disable-next-line no-unused-vars
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
      localStorage.removeItem('kakaoMapData');
    }
  }, [markers]);

  // 현재 지도 범위와 줌 레벨 정보 가져오기
  const getCurrentMapBounds = useCallback(() => {
    if (!map) return null;

    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    return {
      bounds: {
        sw: { lat: sw.getLat(), lng: sw.getLng() },
        ne: { lat: ne.getLat(), lng: ne.getLng() }
      },
      center: {
        lat: map.getCenter().getLat(),
        lng: map.getCenter().getLng()
      },
      zoomLevel: map.getLevel()
    };
  }, [map]);

  // 백엔드에서 마커 정보 가져오기
  const fetchMarkersFromBackend = useCallback(async () => {
    // 백엔드 서버가 준비되지 않아 임시로 비활성화
    return;

    /* 백엔드 서버 준비 후 아래 코드 활성화
    if (!map) return;
    
    try {
      const mapInfo = getCurrentMapBounds();
      if (!mapInfo) {
        return;
      }
      
      // 예시: 백엔드 API 엔드포인트
      const apiUrl = 'https://your-backend-api.com/markers';
      
      try {
        // 백엔드에 지도 정보 전송
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            bounds: mapInfo.bounds,
            center: mapInfo.center,
            zoomLevel: mapInfo.zoomLevel
          })
        });
        
        if (!response.ok) {
          throw new Error(`마커 정보를 가져오는데 실패했습니다. 상태 코드: ${response.status}`);
        }
        
        const data = await response.json();
        
        // 받아온 마커 정보로 마커 생성
        if (data.markers && data.markers.length > 0 && addMarkerRef.current) {
          // 기존 마커 제거
          markers.forEach(markerInfo => {
            markerInfo.marker.setMap(null);
          });
          
          // 새 마커 생성
          const newMarkers = data.markers.map(markerData => {
            try {
              const position = new window.kakao.maps.LatLng(
                markerData.position.lat,
                markerData.position.lng
              );
              
              // 타입 코드를 문자열로 변환
              const typeInfo = getMarkerTypeString(markerData.typeCode).split(':');
              const type = typeInfo[0];
              const subType = typeInfo.length > 1 ? typeInfo[1] : null;
              
              // 마커 추가 (ref를 통해 호출)
              return addMarkerRef.current(position, type, subType);
            } catch (markerError) {
              return null;
            }
          }).filter(Boolean); // null 값 제거
        }
      } catch (networkError) {
        // 네트워크 오류는 콘솔에만 출력
      }
    } catch (error) {
      // 일반 오류는 무시
    }
    */
  }, [map, markers, getCurrentMapBounds, getMarkerTypeString]);

  // 마커 타입 필터링 함수
  const filterMarkersByType = useCallback((type) => {
    // 선택된 필터 타입 저장용 상태 변수가 있다면 업데이트
    if (typeof setFilterType === 'function') {
      setFilterType(type);
    }

    // 마커 맵 표시 상태 일괄 업데이트 (최적화)
    const markersToShow = [];
    setMarkers(prev => {
      // 기존 마커 배열을 수정하되 표시 상태만 변경
      return prev.map(markerInfo => {
        const shouldShow = markerInfo.type === type || type === 'all';

        // 바로 상태를 변경하지 않고 변경할 마커만 컬렉션
        if (shouldShow) {
          markersToShow.push(markerInfo.marker);
          if (!markerInfo.marker.getMap()) {
            // 현재 표시되지 않은 경우만 표시 설정
            markerInfo.marker.setMap(map);
          }
        } else {
          if (markerInfo.marker.getMap()) {
            // 현재 표시된 경우만 숨김 설정
            markerInfo.marker.setMap(null);
          }
        }

        return markerInfo;
      });
    });

    // 클러스터러 업데이트는 약간의 지연 시간을 두고 처리
    setTimeout(() => {
      if (clusterRef.current) {
        // 클러스터 초기화
        clusterRef.current.clear();

        // 필터링된 마커 중 보이는 영역에 있는 마커만 클러스터에 추가
        const currentMarkers = markersRef.current;
        const bounds = map ? map.getBounds() : null;

        if (bounds && currentMarkers) {
          const visibleFilteredMarkers = currentMarkers.filter(markerInfo =>
            (markerInfo.type === type || type === 'all') &&
            bounds.contain(markerInfo.marker.getPosition())
          );

          // 클러스터에 표시될 마커들을 일괄 추가
          if (visibleFilteredMarkers.length > 0) {
            const markersForCluster = visibleFilteredMarkers.map(m => m.marker);
            clusterRef.current.addMarkers(markersForCluster);
          }

          // 보이는 마커 상태 업데이트
          setVisibleMarkers(visibleFilteredMarkers);
        }
      }
    }, 10);
  }, [map]);

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
    navigate('/chat');
  }, [navigate]);

  const goToProfile = useCallback(() => {
    navigate('/profile');
  }, [navigate]);

  const goToPetInfo = useCallback(() => {
    navigate('/pets');
  }, [navigate]);

  // 서브타입 버튼 클릭 방식으로 변경
  const [showSubTypeButtons, setShowSubTypeButtons] = useState(false);

  // 함수 ref 추가
  const loadMarkersFromLocalStorageRef = useRef(null);
  const saveMarkersToLocalStorageRef = useRef(null);
  const getCurrentMapBoundsRef = useRef(null);
  const fetchMarkersFromBackendRef = useRef(null);
  const markerImagesRef = useRef(null);

  // 순환 참조를 방지하기 위한 함수 ref 업데이트
  useEffect(() => {
    removeMarkerRef.current = removeMarker;
    addMarkerRef.current = addMarker;
    loadMarkersFromLocalStorageRef.current = loadMarkersFromLocalStorage;
    saveMarkersToLocalStorageRef.current = saveMarkersToLocalStorage;
    getCurrentMapBoundsRef.current = getCurrentMapBounds;
    fetchMarkersFromBackendRef.current = fetchMarkersFromBackend;
    markerImagesRef.current = markerImages.current;
  }, [
    removeMarker,
    addMarker,
    loadMarkersFromLocalStorage,
    saveMarkersToLocalStorage,
    getCurrentMapBounds,
    fetchMarkersFromBackend
  ]);

  // 지도 클릭 이벤트에 서브타입 옵션 닫기 추가
  useEffect(() => {
    // 지도 컨테이너 클릭 이벤트 리스너 등록
    const handleMapClick = () => {
      if (showSubTypeButtons) {
        setShowSubTypeButtons(false);
      }
    };

    const mapDiv = mapContainer.current;
    if (mapDiv) {
      mapDiv.addEventListener('click', handleMapClick);
    }

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      if (mapDiv) {
        mapDiv.removeEventListener('click', handleMapClick);
      }
    };
  }, [showSubTypeButtons]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white p-4 shadow-md flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">강아지도 🐕</h1>
      </header>

      {/* 마커 생성 안내 */}
      <div className="bg-amber-50 p-3 shadow-sm border-b border-amber-200">
        <p className="text-center text-amber-800 text-sm font-medium">
          {isCenterMode
            ? "지도를 움직여 중앙에 마커를 위치시키고 '확정' 버튼을 누르세요"
            : "우측 버튼을 눌러 마커를 추가하세요"}
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

        {/* 지도 영역 오른쪽 아래에 마커 유형별 추가 버튼 - 세로 정렬 */}
        <div className="absolute top-24 right-4 flex flex-col gap-3 z-20">
          {/* 댕플 마커 추가 버튼 */}
          <button
            onClick={() => {
              addMarkerAtCenter('댕플');
              setShowSubTypeButtons(false); // 서브타입 옵션 닫기
            }}
            className="flex items-center justify-center w-12 h-12 bg-amber-500 hover:bg-amber-600 rounded-full shadow-lg text-white"
            aria-label="댕플 마커 추가"
          >
            <span role="img" aria-label="강아지" className="text-xl">🐶</span>
          </button>

          {/* 댕져러스 마커 추가 버튼 */}
          <div className="relative">
            <button
              onClick={() => setShowSubTypeButtons(!showSubTypeButtons)}
              className="flex items-center justify-center w-12 h-12 bg-blue-500 hover:bg-blue-600 rounded-full shadow-lg text-white"
              aria-label="댕져러스 마커 추가"
            >
              <span role="img" aria-label="위험" className="text-xl">⚠️</span>
            </button>

            {/* 댕져러스 서브타입 선택 버튼 - 아래로 드롭다운 되도록 수정 */}
            {showSubTypeButtons && (
              <div className="absolute top-full right-0 mt-2 z-30">
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      addDangerousMarkerWithSubType('들개');
                      setShowSubTypeButtons(false); // 선택 후 닫기
                    }}
                    className="flex items-center justify-center w-12 h-12 bg-blue-500 hover:bg-blue-600/300 rounded-full shadow-lg"
                    title="들개"
                  >
                    <span role="img" aria-label="들개">🐕</span>
                  </button>
                  <button
                    onClick={() => {
                      addDangerousMarkerWithSubType('빙판길');
                      setShowSubTypeButtons(false); // 선택 후 닫기
                    }}
                    className="flex items-center justify-center w-12 h-12 bg-blue-500 hover:bg-blue-600/90 rounded-full shadow-lg"
                    title="빙판길"
                  >
                    <span role="img" aria-label="빙판길">🧊</span>
                  </button>
                  <button
                    onClick={() => {
                      addDangerousMarkerWithSubType('염화칼슘');
                      setShowSubTypeButtons(false); // 선택 후 닫기
                    }}
                    className="flex items-center justify-center w-12 h-12 bg-blue-500 hover:bg-blue-600/90 rounded-full shadow-lg"
                    title="염화칼슘"
                  >
                    <span role="img" aria-label="염화칼슘">🧂</span>
                  </button>
                  <button
                    onClick={() => {
                      addDangerousMarkerWithSubType('공사중');
                      setShowSubTypeButtons(false); // 선택 후 닫기
                    }}
                    className="flex items-center justify-center w-12 h-12 bg-blue-500 hover:bg-blue-600/90 rounded-full shadow-lg"
                    title="공사중"
                  >
                    <span role="img" aria-label="공사중">🚧</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 좌표 정보 표시 */}
        <div className="absolute bottom-36 left-0 right-0 flex justify-center">
          <div className="bg-white px-4 py-2 rounded-full shadow-md text-sm">
            <span className="font-medium">위도: {centerPosition.lat.toFixed(6)}, 경도: {centerPosition.lng.toFixed(6)}</span>
          </div>
        </div>

        {/* 지도 상단에 마커 타입 필터링 버튼 추가 - 배경 없이 왼쪽 정렬 */}
        <div className="absolute top-4 left-4 z-20 flex gap-2">
          <button
            onClick={() => filterMarkersByType('댕플')}
            className="bg-amber-500 hover:bg-amber-600 py-1 px-3 rounded-full shadow text-xs font-medium text-white"
          >
            댕플
          </button>
          <button
            onClick={() => filterMarkersByType('댕져러스')}
            className="bg-blue-500 hover:bg-blue-600 py-1 px-3 rounded-full shadow text-xs font-medium text-white"
          >
            댕져러스
          </button>
          <button
            onClick={() => filterMarkersByType('all')}
            className="bg-gray-500 hover:bg-gray-600 py-1 px-3 rounded-full shadow text-xs font-medium text-white"
          >
            전체
          </button>
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <nav className="bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-between px-2">
          <button className="flex flex-col items-center py-3 flex-1 text-amber-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs mt-1 font-medium">지도</span>
          </button>
          <button onClick={goToChat} className="flex flex-col items-center py-3 flex-1 text-gray-500 hover:text-amber-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="text-xs mt-1 font-medium">채팅</span>
          </button>
          <button onClick={goToProfile} className="flex flex-col items-center py-3 flex-1 text-gray-500 hover:text-amber-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs mt-1 font-medium">내 정보</span>
          </button>
          <button
            onClick={goToPetInfo}
            className="group flex flex-col items-center py-3 flex-1 text-gray-500 hover:text-amber-800 transition-all duration-300"
          >
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21s-6-4.35-9-8c-3-3.35-3-7.35 0-10 3-3 7.5-2 9 2 1.5-4 6-5 9-2 3 3 3 7 0 10-3 3.65-9 8-9 8z" />
              </svg>
            </div>
            <span className="text-xs mt-1 font-medium">반려견 정보</span>
          </button>
        </div>
      </nav>

      {/* 마커 생성 모달 (간소화된 버전) */}
      {showModal && (
        <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-lg shadow-xl w-[50%] max-w-xs">
          <div className="relative p-4">
            <div className="absolute right-4 top-4">
              <button
                onClick={() => {
                  setShowModal(false);
                  setIsCenterMode(false); // 모달을 닫을 때 중앙 모드도 비활성화
                }}
                className="text-gray-500 font-bold"
              >
                X
              </button>
            </div>
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold">
                {tempMarkerType === '댕플'
                  ? '댕플을 찍어멍!'
                  : `${tempMarkerSubType || '위험 지역'}을 찍어멍!`}
              </h2>
              <p className="text-sm text-gray-500 mt-1">지도를 이동해서 {tempMarkerType === '댕플' ? '댕플' : tempMarkerSubType || '위험 지역'}을 찍을 수 있습니다!</p>
            </div>
            <div className="flex justify-center">
              <button
                onClick={() => {
                  createMarkerFromModal();
                  setShowModal(false);
                }}
                className="bg-black text-white font-bold py-2 px-12 rounded-full"
              >
                확정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MapPage; 