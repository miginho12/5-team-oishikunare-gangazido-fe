import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getMapMarkers, registerMarker, deleteMarker } from '../api/map'; // axios 인스턴스로 정의된 API 제리 추가
import { useAuth } from '../contexts/AuthContext'; // 기존 getUserInfo 대신 useAuth 훅 사용
import { ToastContainer, toast } from 'react-toastify'; // 토스트 메시지 
import 'react-toastify/dist/ReactToastify.css';

function MapPage() {
  const currentFilterTypeRef = useRef("all"); // 필터 유지 위해
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

  // AuthContext에서 인증 상태 가져오기
  const { isAuthenticated, user } = useAuth();
  // console.log("어쓰", user);

  const userRef = useRef(null);

  // user를 useRef에 저장함으로써 최신 값 참조하도록
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // 모달 관련 상태 수정
  const [showModal, setShowModal] = useState(false);
  const [tempMarkerType, setTempMarkerType] = useState("댕플");
  const [tempMarkerSubType, setTempMarkerSubType] = useState(null);

  // 카카오맵 API 스크립트 로딩 상태
  const [kakaoMapLoaded, setKakaoMapLoaded] = useState(false);

  // 마커 필터링 타입 저장 상태 추가
  // eslint-disable-next-line no-unused-vars
  const [filterType, setFilterType] = useState("all");

  // 순환 참조를 막기 위한 removeMarker 함수 ref
  const removeMarkerRef = useRef(null);

  // 구름스퀘어 좌표
  const [centerPosition, setCenterPosition] = useState({
    lat: 33.48717138746649, // 제주도 구름스퀘어 위도
    lng: 126.53171329989748, // 제주도 구름스퀘어 경도
  });

  // 페이지 진입 시 지도 초기화 후 내 위치로 이동
  useEffect(() => {
    if (map) {
      moveToCurrentLocation();
    }
  }, [map]);

  // 카카오맵 API 스크립트 동적 로드 함수
  const loadKakaoMapScript = useCallback(() => {
    // 이미 로드된 경우 중복 로드 방지
    if (window.kakao && window.kakao.maps) {
      setKakaoMapLoaded(true);
      return;
    }

    // API 키 가져오기 
    const apiKey =
      process.env.NODE_ENV === "development"
        ? process.env.REACT_APP_KAKAO_MAP_API_KEY
        : window._env_?.KAKAO_MAP_API_KEY;

    if (!apiKey) {
      console.error("카카오맵 API 키가 환경 변수에 설정되지 않았습니다.");
      return;
    }

    // 스크립트 태그 생성
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services,clusterer&autoload=false`;
    script.async = true;

    // 스크립트 로드 완료 시 처리
    script.onload = () => {
      // autoload=false 옵션을 사용했으므로 수동으로 로드 실행
      window.kakao.maps.load(() => {
        console.log("카카오맵 API 로드 완료");
        setKakaoMapLoaded(true);
      });
    };

    // 스크립트 로드 실패 시 처리
    script.onerror = () => {
      console.error("카카오맵 API 로드 실패");
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
      type: "댕플",
      image: null,
      imageSize: null,
      imageOption: null,
    },
    {
      type: "댕져러스",
      image: null,
      imageSize: null,
      imageOption: null,
      subTypes: ["들개", "빙판길", "염화칼슘", "공사중"],
    },
  ]);

  // 마커 타입 코드 상수
  const MARKER_TYPES = {
    댕플: 0,
    댕져러스: {
      DEFAULT: 1,
      들개: 1,
      빙판길: 2,
      염화칼슘: 3,
      공사중: 4,
    },
  };

  // 마커 이미지 URL 상수
  const MARKER_IMAGES = {
    댕플: "/images/dangple_square.png",
    댕져러스: {
      DEFAULT: "https://cdn-icons-png.flaticon.com/512/4636/4636076.png",
      들개: "/images/beware_dog_square.png",
      빙판길: "/images/icy_road_square.png",
      염화칼슘: "/images/beware_foot_square.png",
      공사중: "/images/construction_square.png",
    },
    // 이모티콘 URL 추가
    EMOJI: {
      들개: "🐕",
      빙판길: "🧊",
      염화칼슘: "🧂",
      공사중: "🚧",
    },
  };

  // 마커 타입 코드 가져오기
  const getMarkerTypeCode = (type, subType = null) => {
    if (type === "댕플") return MARKER_TYPES.댕플;
    if (type === "댕져러스") {
      return subType
        ? MARKER_TYPES.댕져러스[subType]
        : MARKER_TYPES.댕져러스.DEFAULT;
    }
    return 0; // 기본값
  };

  // markers 상태가 변경될 때마다 ref 업데이트
  useEffect(() => {
    markersRef.current = markers;
  }, [markers]);

  // 마커 이미지 설정 함수
  const initMarkerImages = useCallback(() => {
    if (!window.kakao || !window.kakao.maps) {
      console.log("Kakao Maps API가 아직 준비되지 않았습니다.");
      return;
    }

    try {
      const size = new window.kakao.maps.Size(40, 40);
      const option = { offset: new window.kakao.maps.Point(20, 20) };

      // 1. 댕플 마커
      markerImages.current[0].image = new window.kakao.maps.MarkerImage(
        MARKER_IMAGES.댕플,
        size,
        option
      );

      // 2. 댕져러스 마커 객체 준비
      if (!markerImages.current[1]) {
        markerImages.current[1] = {
          type: "댕져러스",
          subTypes: ["들개", "빙판길", "염화칼슘", "공사중"],
        };
      }

      const subTypes = ["들개", "빙판길", "염화칼슘", "공사중"];

      // 3. 각 서브타입별 PNG 이미지로 마커 생성
      subTypes.forEach((subType) => {
        const imageSrc =
          MARKER_IMAGES.댕져러스[subType] || MARKER_IMAGES.댕져러스.DEFAULT;

        markerImages.current[1][subType] = new window.kakao.maps.MarkerImage(
          imageSrc,
          size,
          option
        );
      });

      // 4. 댕져러스 DEFAULT 마커도 생성
      const defaultImageSrc = MARKER_IMAGES.댕져러스.DEFAULT;
      markerImages.current[1].image = new window.kakao.maps.MarkerImage(
        defaultImageSrc,
        size,
        option
      );

      console.log(
        "✅ 마커 이미지 모두 PNG로 초기화 완료",
        markerImages.current
      );
    } catch (error) {
      console.error("마커 이미지 초기화 중 오류 발생:", error);
    }
  }, []);

  // addMarker 함수의 ref 추가
  const addMarkerRef = useRef(null);

  // 클러스터 스타일 정의
  const CLUSTER_STYLES = {
    댕플: {
      background: "rgba(251, 191, 36, 0.8)", // amber-300
      text: "#fff",
    },
    댕져러스: {
      background: "rgba(248, 113, 113, 0.8)", // red-400
      text: "#fff",
    },
    all: {
      background: "rgba(156, 163, 175, 0.8)", // gray-400
      text: "#fff",
    },
  };

  // 필터 타입에 따라 클러스터러 생성 함수
  const createClustererWithStyle = (mapInstance, styleKey = "all") => {
    const style = CLUSTER_STYLES[styleKey] || CLUSTER_STYLES.all;

    return new window.kakao.maps.MarkerClusterer({
      map: mapInstance,
      averageCenter: true,
      minLevel: 5,
      disableClickZoom: false,
      styles: [
        {
          width: "50px",
          height: "50px",
          background: style.background,
          color: style.text,
          textAlign: "center",
          lineHeight: "50px",
          borderRadius: "25px",
          fontSize: "14px",
          fontWeight: "bold",
        },
      ],
    });
  };
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
          center: new window.kakao.maps.LatLng(
            centerPosition.lat,
            centerPosition.lng
          ),
          level: currentZoomLevel,
        };

        // 지도 생성
        const kakaoMapInstance = new window.kakao.maps.Map(
          mapContainer.current,
          options
        );

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
              styles: [
                {
                  width: "50px",
                  height: "50px",
                  background: "rgba(255, 165, 0, 0.7)",
                  color: "#fff",
                  textAlign: "center",
                  lineHeight: "50px",
                  borderRadius: "25px",
                  fontSize: "14px",
                  fontWeight: "bold",
                },
              ],
            });
            clusterRef.current = clusterer;
          }
        } catch (error) {
          console.error("마커 클러스터러 초기화 오류");
        }

        // 마커 이미지 초기화
        initMarkerImages();

        // 이벤트 리스너 등록 - 클릭 (중앙 모드가 아닐 때)
        const clickListener = window.kakao.maps.event.addListener(
          kakaoMapInstance,
          "click",
          (mouseEvent) => {
            // 중앙 모드가 아닐 때만 실행하고,
            // 직접 지도를 클릭했을 때는 모달과 중앙 모드를 활성화하지 않고 마커를 바로 생성
            if (!isCenterMode && addMarkerRef.current) {
              // 지도 클릭 시에는 마커를 바로 생성하도록 수정된 함수 호출
              createMarkerFromPosition(mouseEvent.latLng);
            }
          }
        );

        // 드래그 종료 이벤트 등록 - 지도 중심 위치 업데이트만 담당
        const dragendListener = window.kakao.maps.event.addListener(
          kakaoMapInstance,
          "dragend",
          () => {
            if (!kakaoMapInstance) return;

            // 위치 및 줌 레벨 업데이트
            const center = kakaoMapInstance.getCenter();
            const level = kakaoMapInstance.getLevel();

            // 상태 업데이트
            setCurrentZoomLevel(level);
            setCenterPosition({
              lat: center.getLat(),
              lng: center.getLng(),
            });

            // 보이는 영역 업데이트
            updateVisibleMarkers(kakaoMapInstance);
          }
        );

        // 줌 변경 이벤트 등록 - 줌 레벨 업데이트만 담당
        const zoomChangedListener = window.kakao.maps.event.addListener(
          kakaoMapInstance,
          "zoom_changed",
          () => {
            if (!kakaoMapInstance) return;

            // 줌 레벨 업데이트
            const level = kakaoMapInstance.getLevel();
            setCurrentZoomLevel(level);

            // 보이는 영역 업데이트
            updateVisibleMarkers(kakaoMapInstance);
          }
        );

        // 보이는 마커 업데이트 함수 (필터 적용 버전)
        const updateVisibleMarkers = (mapInstance) => {
          if (!mapInstance) return;

          const bounds = mapInstance.getBounds();
          mapBoundsRef.current = bounds;

          const currentMarkers = markersRef.current;
          const filterType = currentFilterTypeRef.current;

          if (currentMarkers && currentMarkers.length > 0) {
            const visibleMarkersFiltered = currentMarkers.filter(
              (markerInfo) => {
                if (!markerInfo.marker) return false;

                const inBounds = bounds.contain(
                  markerInfo.marker.getPosition()
                );
                const matchesFilter =
                  filterType === "all" || markerInfo.type === filterType;

                // 👉 필터와 영역 조건 모두 만족하는 경우만 지도에 표시
                if (inBounds && matchesFilter) {
                  markerInfo.marker.setMap(mapInstance);
                  return true;
                } else {
                  markerInfo.marker.setMap(null); // 조건 안 맞으면 숨기기
                  return false;
                }
              }
            );

            // 상태 업데이트
            setVisibleMarkers(visibleMarkersFiltered);

            // 클러스터러 업데이트
            if (clusterRef.current) {
              clusterRef.current.clear();

              const kakaoMarkers = visibleMarkersFiltered.map((m) => m.marker);
              if (kakaoMarkers.length > 0) {
                clusterRef.current.addMarkers(kakaoMarkers);
              }
            }
          }
        };

        // 초기 지도 영역 설정
        mapBoundsRef.current = kakaoMapInstance.getBounds();

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
  }, [
    centerPosition.lat,
    centerPosition.lng,
    initMarkerImages,
    isCenterMode,
    currentZoomLevel,
    map,
    kakaoMapLoaded,
  ]);

  // 마커 제거 함수
  const removeMarker = useCallback(
    (markerId) => {
      try {
        // 해당 마커 찾기
        const currentMarkers = markersRef.current;
        const markerToRemove = currentMarkers.find(
          (marker) => marker.id === markerId
        );

        if (markerToRemove) {
          // 지도에서 마커 제거
          try {
            markerToRemove.marker.setMap(null);
          } catch (setMapError) {
            console.error("마커 지도에서 제거 중 오류:", setMapError);
          }

          // 인포윈도우가 있다면 닫기
          if (markerToRemove.overlay) {
            try {
              markerToRemove.overlay.setMap(null); // ✅ 커스텀 오버레이 닫기
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
          setMarkers((prev) => {
            const updatedMarkers = prev.filter(
              (marker) => marker.id !== markerId
            );

            // 보이는 마커 목록도 업데이트
            try {
              setVisibleMarkers((prev) =>
                prev.filter((marker) => marker.id !== markerId)
              );
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
    },
    [selectedMarker]
  );


  // 마커 추가 함수 - 버튼 클릭 시 사용되는 함수(모달 표시)
  const addMarker = (position, markerType = "댕플", subType = null) => {
    setTempMarkerType(markerType);
    setTempMarkerSubType(subType);
    setShowModal(true);
    setIsCenterMode(true);
  };

  // 지도 클릭 시 직접 마커를 생성하는 함수 추가
  const createMarkerFromPosition = useCallback(
    (position) => {
      if (!map) return null;

      try {
        // 기본 마커 타입 설정 (지도 클릭 시 생성되는 마커는 기본적으로 댕플 타입)
        const markerType = "댕플";
        const markerSubType = null;

        // 마커 이미지 가져오기
        let markerImage =
          markerImages.current[0] && markerImages.current[0].image;

        if (!markerImage) {
          // 마커 이미지가 초기화되지 않은 경우 초기화 시도
          initMarkerImages();
          markerImage =
            markerImages.current[0] && markerImages.current[0].image;
        }

        // 마커 생성
        let marker;
        try {
          marker = new window.kakao.maps.Marker({
            position: position,
            map, // 항상 지도에 표시
            image: markerImage,
          });
        } catch (markerError) {
          console.error("카카오맵 마커 객체 생성 중 오류 발생:", markerError);
          return null;
        }

        // 마커 정보 객체
        const markerInfo = {
          id:
            Date.now().toString() + Math.random().toString(36).substring(2, 10),
          marker,
          position: {
            lat: position.getLat(),
            lng: position.getLng(),
          },
          type: markerType,
          subType: markerSubType,
        };

        // 클릭 이벤트 등록
        try {
          window.kakao.maps.event.addListener(mapMarkers, 'click', () => {
            try {
              // 기존 인포윈도우 모두 닫기 (성능 최적화)
              markersRef.current.forEach(m => {
                if (m.overlay) {
                  try {
                    if (typeof m.overlay.setMap(null) === "function") {
                      m.overlay.close(); // InfoWindow일 경우
                    } else if (typeof m.overlay.setMap === "function") {
                      m.overlay.setMap(null); // CustomOverlay일 경우
                    }
                    m.overlay = null;
                  } catch (err) {
                    console.warn("🔍 overlay 닫기 실패:", err);
                  }
                }
              });

              // 인포윈도우 생성
              let infoContent = "";

              if (markerType === "댕져러스" && markerSubType) {
                // 댕져러스 마커 클릭 시
                let emoji = "";
                switch (markerSubType) {
                  case "들개":
                    emoji = "🐕";
                    break;
                  case "빙판길":
                    emoji = "🧊";
                    break;
                  case "염화칼슘":
                    emoji = "🧂";
                    break;
                  case "공사중":
                    emoji = "🚧";
                    break;
                  default:
                    emoji = "⚠️";
                }

                infoContent = `<div style="padding:5px;font-size:12px;">
                <div class="custom-overlay-animate" style="margin-bottom:4px;">${emoji} ${markerType}${markerSubType ? ` - ${markerSubType}` : ""
                  }</div>
                <button id="delete-marker-${markerInfo.id}" style="padding:2px 5px;background:#ff5555;color:white;border:none;border-radius:3px;">삭제</button>
              </div>`;
              } else {
                // 일반 마커 클릭 시
                infoContent = `<div class="custom-overlay-animate" style="padding:5px;font-size:12px;">${markerType}<br><button id="delete-marker-${markerInfo.id}" style="padding:2px 5px;margin-top:5px;background:#ff5555;color:white;border:none;border-radius:3px;">삭제</button></div>`;
              }

              const overlay = new window.kakao.maps.CustomOverlay({
                content: infoContent, // 너가 만든 HTML
                position: marker.getPosition(),
                xAnchor: 0.5,
                yAnchor: 1.3, // 창뜨는 위치
                removable: true,
                zIndex: 9999 // ✅ 마커보다 높은 z-index 설정
              });

              // 인포윈도우 열기
              // overlay.open(map, marker);
              overlay.setMap(map);

              // 마커 정보에 인포윈도우 추가
              markerInfo.overlay = overlay;

              // 인포윈도우 내부의 삭제 버튼에 이벤트 리스너 추가
              setTimeout(() => {
                const deleteBtn = document.getElementById(`delete-marker-${markerInfo.id}`);
                if (deleteBtn) {
                  deleteBtn.onclick = () => {
                    // removeMarker 함수 ref 사용
                    if (removeMarkerRef.current) {
                      removeMarkerRef.current(markerInfo.id);
                    }
                    overlay.setMap(null); // ✅ 커스텀 오버레이 닫기
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
          setMarkers((prev) => {
            const updatedMarkers = [...prev, markerInfo];

            // 새 마커가 현재 화면에 보이는지 확인하고 클러스터에만 추가
            try {
              if (
                mapBoundsRef.current &&
                mapBoundsRef.current.contain(position)
              ) {
                // 수정: 개별 상태 업데이트 대신 일괄 업데이트 작업 스케줄링
                setTimeout(() => {
                  setVisibleMarkers((current) => [...current, markerInfo]);

                  // 클러스터에 마커 추가
                  if (clusterRef.current) {
                    try {
                      clusterRef.current.addMarker(marker);
                    } catch (clusterError) {
                      console.warn(
                        "클러스터에 마커 추가 중 오류:",
                        clusterError
                      );
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
          try {
            marker.setMap(null);
          } catch (e) {
            /* 마커 제거 실패는 무시 */
          }
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
    },
    [
      map,
      initMarkerImages,
      markerImages,
      mapBoundsRef,
      // saveMarkersToLocalStorage,
    ]
  );

  // 모달에서 확정 버튼 클릭 시 실제 마커 생성 함수 제리 수정
  const createMarkerFromModal = useCallback(async () => {
    if (!map) return;

    try {
      // 인증 상태 확인
      if (!isAuthenticated) {
        toast.error("로그인 후 이용해주세요!", {
          position: "bottom-center",
          autoClose: 2000,
          style: {
            background: "#fff5f5",
            color: "#a94442",
            border: "1px solid #f5c6cb",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            fontWeight: "bold",
          },
          icon: "🔐",
        });
        setShowModal(false);
        setIsCenterMode(false);
        return;
      }

      const center = map.getCenter();

      // 서버에 등록 요청
      const markerData = {
        type: getMarkerTypeCode(tempMarkerType, tempMarkerSubType),
        latitude: center.getLat(),
        longitude: center.getLng(),
      };

      const res = await registerMarker(markerData);
      const serverMarker = res.data.data;

      if (res.data.message !== "marker_registered_success") {
        toast.error("마커 등록 중 오류가 발생했습니다!", {
          position: "bottom-center",
          autoClose: 2000,
          style: {
            background: "#fff5f5",
            color: "#a94442",
            border: "1px solid #f5c6cb",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            fontWeight: "bold",
          },
          icon: "❌",
        });
        return;
      }

      // 이미지 처리
      const markerImage =
        tempMarkerType === "댕플"
          ? markerImages.current[0].image
          : markerImages.current[1][tempMarkerSubType] ||
          markerImages.current[1].image;

      const marker = new window.kakao.maps.Marker({
        position: center,
        map,
        image: markerImage,
      });

      const markerInfo = {
        id: serverMarker.id, // 서버에서 받은 ID
        user_id: user.userId, // 사용자 ID
        marker,
        position: {
          lat: serverMarker.latitude,
          lng: serverMarker.longitude,
        },
        type: tempMarkerType,
        subType: tempMarkerSubType,
      };

      // 클릭 이벤트 (인포윈도우 + 삭제)
      window.kakao.maps.event.addListener(marker, "click", () => {
        markersRef.current.forEach((m) => {
          if (m.overlay) m.overlay.setMap(null);
        });

        const emoji =
          tempMarkerType === "댕플"
            ? "🐶"
            : tempMarkerSubType
              ? MARKER_IMAGES.EMOJI[tempMarkerSubType] || "⚠️"
              : "⚠️";

        const deleteBtnId = `delete-marker-${markerInfo.id}`;
        const closeBtnId = `close-overlay-${markerInfo.id}`;

        const infoContent = `
          <div class="custom-overlay-animate"
            class="custom-overlay-animate" style="
            position: relative;
            padding: 16px 12px 12px;
            font-size: 14px;
            text-align: center;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            width: 200px;
            border: 1px solid #eee;
          ">
            <div style="
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
              position: relative;
              font-weight: bold;
              font-size: 15px;
              margin-bottom: 12px;
            ">
              <span style="font-size: 18px;">${emoji}</span>
              <span>${tempMarkerType}${tempMarkerSubType ? ` - ${tempMarkerSubType}` : ""}</span>
              <button id="close-overlay-${markerInfo.id}" style="
                position: absolute;
                top: -23px;
                right: -7px;
                background: transparent;
                border: none;
                font-size: 25px;
                color: #888;
                cursor: pointer;
              ">&times;</button>
            </div>
            <button id="${deleteBtnId}" style="
              padding: 8px 12px;
              width: 70px;
              background: #ef4444;
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
              font-weight: bold;
              box-shadow: 0 2px 4px rgba(0,0,0,0.15);
            ">삭제</button>
          </div>
        `;

        const overlay = new window.kakao.maps.CustomOverlay({
          content: infoContent, // 너가 만든 HTML
          position: marker.getPosition(),
          xAnchor: 0.5,
          yAnchor: 1.3, // 창뜨는 위치
          removable: true,
          zIndex: 9999 // ✅ 마커보다 높은 z-index 설정
        });

        overlay.setMap(map);
        markerInfo.overlay = overlay;

        setTimeout(() => {
          const deleteBtn = document.getElementById(deleteBtnId);
          if (deleteBtn) {
            deleteBtn.onclick = async () => {
              try {
                await deleteMarker(markerInfo.id);
                overlay.setMap(null); // ✅ 커스텀 오버레이 닫기

                // 👇 클러스터도 비우고 다시 마커를 불러와 강제 동기화
                if (clusterRef.current) {
                  clusterRef.current.clear();
                }
                
                fetchMarkersFromBackend(); // 🔁 최신 데이터로 다시 로드
                // ✅ 토스트 메시지 추가
                toast.success("마커가 삭제되었습니다!", {
                  position: "bottom-center",
                  autoClose: 2000,
                  style: {
                    background: "#fffaf0",         // 밝은 베이지
                    color: "#4b2f1c",              // 부드러운 갈색 텍스트
                    border: "1px solid #f3e5ab",   // 연한 베이지 테두리
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    fontWeight: "bold",
                  },
                  icon: "🗑", 
                });
              } catch (err) {
                console.error("삭제 실패:", err);
                alert("삭제 권한이 없거나 로그인되지 않았습니다.");
              }
            };
          }

          const closeBtn = document.getElementById(closeBtnId);
          if (closeBtn) {
            closeBtn.onclick = () => {
              overlay.setMap(null);
            };
          }
        }, 100);

        setSelectedMarker(markerInfo);
      });

      // 상태 업데이트
      setMarkers((prev) => [...prev, markerInfo]);
      setMapMarkers((prev) => [...prev, marker]);

      // 클러스터에 추가
      if (
        mapBoundsRef.current &&
        mapBoundsRef.current.contain(center) &&
        clusterRef.current
      ) {
        setTimeout(() => {
          setVisibleMarkers((prev) => [...prev, markerInfo]);
          try {
            clusterRef.current.addMarker(marker);
          } catch (e) {
            console.warn("클러스터 추가 실패:", e);
          }
        }, 10);
      }

      setIsCenterMode(false);
      console.log("✅ 마커 등록 완료:", serverMarker.id);
      toast.success("마커가 등록되었습니다!", {
        position: "bottom-center",
        autoClose: 2000,
        style: {
          background: "#e8f5e9", // 연한 초록
          color: "#2e7d32",      // 진한 초록 텍스트
          border: "1px solid #c8e6c9",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          fontWeight: "bold",
        },
        icon: "📍",
      });
      return markerInfo;
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message;

      if (status === 401 || message === "required_authorization") {
        alert("로그인 후 이용해주세요");
      } else {
        console.error("❌ 마커 등록 중 오류:", error);
        setIsCenterMode(false);
        return null;
      }
    }
  }, [
    map,
    tempMarkerType,
    tempMarkerSubType,
    markerImages,
    getMarkerTypeCode,
    isAuthenticated,
  ]);

  // 특정 타입의 마커 추가하기
  // eslint-disable-next-line no-unused-vars
  const addMarkerByType = useCallback(
    (type, subType = null) => {
      if (!map || !addMarkerRef.current) return;

      const center = map.getCenter();
      addMarkerRef.current(center, type, subType);
    },
    [map]
  );

  // 현재 중앙 위치에 마커 추가하기
  const addMarkerAtCenter = useCallback(
    (type = "댕플", subType = null) => {
      if (!map || !addMarkerRef.current) return;

      const center = map.getCenter();
      addMarkerRef.current(center, type, subType);
    },
    [map]
  );

  // 현재 중앙 위치에 댕져러스 서브타입 마커 추가하기
  const addDangerousMarkerWithSubType = useCallback(
    (subType) => {
      if (!map || !addMarkerRef.current) return;

      const center = map.getCenter();
      addMarkerRef.current(center, "댕져러스", subType);
    },
    [map]
  );

  const triedLocationRef = useRef(false); // ✅ 한 번만 알림 띄우기 위한 ref

  // 현재 위치로 이동하기 (경고 제거를 위해 사용되는 함수로 표시)
  // eslint-disable-next-line no-unused-vars
  // 일단 주석처리 제리.. HTTPS 이후 ..?
  const moveToCurrentLocation = useCallback(() => { 
    if (!map) {
      alert("지도가 아직 초기화되지 않았습니다.");
      return;
    }

    if (!navigator.geolocation) {
      alert("이 브라우저는 위치 정보를 지원하지 않아요.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const moveLatLng = new window.kakao.maps.LatLng(latitude, longitude);

        map.panTo(moveLatLng);
        if (map.getLevel() > 5) {
          map.setLevel(4);
        }
        setCenterPosition({ lat: latitude, lng: longitude });
        
        // 이동한 위치 기준으로 마커 다시 불러오기!
        fetchMarkersFromBackendRef.current?.();
        console.log("📍 현재 위치로 이동 완료:", latitude, longitude);
      },
      (error) => {
        if (!triedLocationRef.current) {
          triedLocationRef.current = true;

          switch (error.code) {
            case error.PERMISSION_DENIED:
              alert("⛔ 위치 접근이 차단되었습니다.\n브라우저 설정에서 위치 권한을 허용해주세요.");
              break;
            case error.POSITION_UNAVAILABLE:
              alert("현재 위치 정보를 사용할 수 없습니다.");
              break;
            case error.TIMEOUT:
              alert("위치 정보를 가져오는 데 시간이 초과되었습니다.");
              break;
          }
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [map]);

  // 모든 마커 지우기
  // eslint-disable-next-line no-unused-vars
  const clearAllMarkers = useCallback(() => {
    if (window.confirm("모든 마커를 삭제하시겠습니까?")) {
      // 지도에서 모든 마커 제거
      markers.forEach((markerInfo) => {
        markerInfo.marker.setMap(null);
        if (markerInfo.overlay) {
          markerInfo.overlay.setMap(null); // ✅ 커스텀 오버레이 닫기
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
      localStorage.removeItem("kakaoMapData");
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
        ne: { lat: ne.getLat(), lng: ne.getLng() },
      },
      center: {
        lat: map.getCenter().getLat(),
        lng: map.getCenter().getLng(),
      },
      zoomLevel: map.getLevel(),
    };
  }, [map]);

  // useState 선언 추가 제리추가
  const [mapMarkers, setMapMarkers] = useState([]);

  // 제리 추가 마커 관련 요청
  const fetchMarkersFromBackend = useCallback(async () => {
    if (!map) return;

    try {
      const center = map.getCenter();
      const params = {
        latitude: center.getLat(),
        longitude: center.getLng(),
        radius: 10000,
      };

      const res = await getMapMarkers(params);
      console.log("📡 마커 응답:", res.data);

      const markersData = res.data.data.markers;

      // 기존 마커 제거
      mapMarkers.forEach((m) => m.setMap(null));
      setMapMarkers([]);

      const newMarkers = [];

      markersData.forEach((mData) => {
        const position = new window.kakao.maps.LatLng(
          mData.latitude,
          mData.longitude
        );

        let type = "댕플";
        let subType = null;
        switch (mData.type) {
          case 1:
            type = "댕져러스";
            subType = "들개";
            break;
          case 2:
            type = "댕져러스";
            subType = "빙판길";
            break;
          case 3:
            type = "댕져러스";
            subType = "염화칼슘";
            break;
          case 4:
            type = "댕져러스";
            subType = "공사중";
            break;
        }

        const markerImage =
          type === "댕플"
            ? markerImages.current[0].image
            : markerImages.current[1][subType] || markerImages.current[1].image;

        const marker = new window.kakao.maps.Marker({
          position,
          map,
          image: markerImage,
        });

        const markerInfo = {
          id: mData.id, // ✅ 서버에서 내려준 진짜 마커 ID 사용
          user_id: mData.user_id, // ✅ 마커주인의 userId 저장
          marker,
          position: {
            lat: mData.latitude,
            lng: mData.longitude,
          },
          type,
          subType,
        };

        // ✅ 클릭 이벤트 + 삭제 API 연동 제리추가
        window.kakao.maps.event.addListener(marker, 'click', () => {
          markersRef.current.forEach((m) => {
            if (m.overlay) m.overlay.setMap(null);
          });
        
          const emoji =
            type === "댕플"
              ? "🐶"
              : MARKER_IMAGES.EMOJI[subType] || "⚠️";
              console.log("user.userId:", user?.userId, typeof user?.userId);
              console.log("markerInfo.user_id:", markerInfo.user_id, typeof markerInfo.user_id);
          const infoContent = `
            <div class="custom-overlay-animate"
              style="
              position: relative;
              padding: 16px 12px 12px;
              font-size: 14px;
              text-align: center;
              background: #ffffff;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.2);
              width: 200px;
              border: 1px solid #eee;
            ">
              <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                position: relative;
                font-weight: bold;
                font-size: 15px;
                margin-bottom: 12px;
              ">
                <span style="font-size: 18px;">${emoji}</span>
                <span>${type}${subType ? ` - ${subType}` : ''}</span>
                <button id="close-overlay-${markerInfo.id}" style="
                  position: absolute;
                  top: -23px;
                  right: -7px;
                  background: transparent;
                  border: none;
                  font-size: 25px;
                  color: #888;
                  cursor: pointer;
                ">&times;</button>
              </div>
              ${user?.userId == markerInfo.user_id // 마커 권한 문제뜨는 것 수정
                ? `<button id="delete-marker-${markerInfo.id}" style="
                padding: 8px 12px;
                width: 70px;
                background: #ef4444;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                box-shadow: 0 2px 4px rgba(0,0,0,0.15);
              ">삭제</button>`
                : ""
              }
            </div>
          `;
        
          const overlay = new window.kakao.maps.CustomOverlay({
            content: infoContent,
            position: marker.getPosition(),
            xAnchor: 0.5,
            yAnchor: 1.3,
            removable: true,
            zIndex: 9999,
          });
        
          overlay.setMap(map);
          markerInfo.overlay = overlay;
        
          // ✅ delete 버튼이 나타날 때까지 기다려서 이벤트 등록
          const tryAttachDeleteHandler = () => {
            const deleteBtn = document.getElementById(`delete-marker-${markerInfo.id}`);
            if (deleteBtn) {
              deleteBtn.onclick = async () => {
                try {
                  await deleteMarker(markerInfo.id);
                  overlay.setMap(null);
                  fetchMarkersFromBackend();
        
                  toast.success("마커가 삭제되었습니다!", {
                    position: "bottom-center",
                    autoClose: 2000,
                    style: {
                      background: "#fffaf0",
                      color: "#4b2f1c",
                      border: "1px solid #f3e5ab",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      fontWeight: "bold",
                    },
                    icon: "🐾",
                  });
                } catch (err) {
                  const message = err.response?.data?.message || "";
        
                  if (message === "required_authorization") {
                    toast.error("로그인 후 이용해주세요!", {
                      position: "bottom-center",
                      autoClose: 2000,
                      style: {
                        background: "#fff5f5",
                        color: "#a94442",
                        border: "1px solid #f5c6cb",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        fontWeight: "bold",
                      },
                      icon: "🔐",
                    });
                  } else if (message === "required_permission") {
                    toast.error("다른 유저의 마커를 삭제할 수 없습니다", {
                      position: "bottom-center",
                      autoClose: 2000,
                      style: {
                        background: "#fff5f5",
                        color: "#a94442",
                        border: "1px solid #f5c6cb",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        fontWeight: "bold",
                      },
                      icon: "⛔",
                    });
                  } else {
                    console.error("❌ 마커 삭제 실패:", err);
                    toast.error("마커 삭제 중 오류가 발생했습니다!", {
                      position: "bottom-center",
                      autoClose: 2000,
                      style: {
                        background: "#fff5f5",
                        color: "#a94442",
                        border: "1px solid #f5c6cb",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        fontWeight: "bold",
                      },
                      icon: "❌",
                    });
                  }
                }
              };
            } else {
              // 아직 버튼이 렌더링되지 않았다면 재시도
              setTimeout(tryAttachDeleteHandler, 50);
            }
          };
        
          tryAttachDeleteHandler();
        
          // 닫기 버튼도 추가
          const tryAttachCloseHandler = () => {
            const closeBtn = document.getElementById(`close-overlay-${markerInfo.id}`);
            if (closeBtn) {
              closeBtn.onclick = () => {
                overlay.setMap(null);
              };
            } else {
              setTimeout(tryAttachCloseHandler, 50);
            }
          };
        
          tryAttachCloseHandler();
        
          setSelectedMarker(markerInfo);
        });

        newMarkers.push(markerInfo);
      });

      setMarkers(newMarkers);
      setMapMarkers(newMarkers.map((m) => m.marker));

      // ⭐️ 현재 필터 다시 적용
      filterMarkersByType(currentFilterTypeRef.current);
    } catch (error) {
      const message = error.response?.data?.message; // 응답 메시지
      const status = error.response?.status; // 응답 코드
      if (status === 401 || message === "required_authorization") {
        alert("로그인 후 이용해주세요!");
      } else {
        console.error("📛 마커 불러오기 실패:", error);
        alert("마커를 불러오는 중 오류가 발생했습니다.");
      }
    }
  }, [map, markerImages, mapMarkers]);

  const hasFetchedMarkers = useRef(false); // 딱 한 번만 실행되게 플래그

  useEffect(() => { // user 정보가 로딩되지 않은 상태에서 마커 불러오는 것 방지
    if (map && user?.userId !== undefined && !hasFetchedMarkers.current) {
      console.log("🛰 마커 요청 딱 한 번 보내기!");
      fetchMarkersFromBackend();
      hasFetchedMarkers.current = true;
    } else {
      // 재로그인 이후 user 정보가 생기면 다시 마커를 불러오기
      console.log("🔁 사용자 정보 업데이트 감지, 마커 다시 불러오기!");
      fetchMarkersFromBackend();
    }
  }, [map, user]);

  // 마커 타입 필터링 함수
  const filterMarkersByType = useCallback(
    (type) => {
      currentFilterTypeRef.current = type;
      setFilterType(type);
  
      const markersToShow = [];
  
      setMarkers((prev) => {
        return prev.map((markerInfo) => {
          let shouldShow = false;
  
          // 👇 내 마커 필터링
          if (type === "mine") {
            shouldShow =
              isAuthenticated && markerInfo.user_id === user?.userId;
          } else {
            // 기존 방식
            shouldShow = markerInfo.type === type || type === "all";
          }
  
          if (shouldShow) {
            markersToShow.push(markerInfo.marker);
            if (!markerInfo.marker.getMap()) {
              markerInfo.marker.setMap(map);
            }
          } else {
            if (markerInfo.marker.getMap()) {
              markerInfo.marker.setMap(null);
            }
          }
  
          return markerInfo;
        });
      });
  
      // 클러스터 새로 만들기 (생략 가능하긴 함)
      if (clusterRef.current) {
        clusterRef.current.clear();
        clusterRef.current.setMap(null);
      }
      clusterRef.current = createClustererWithStyle(map, type);
  
      setTimeout(() => {
        if (clusterRef.current) {
          const currentMarkers = markersRef.current;
          const bounds = map?.getBounds();
          if (bounds && currentMarkers) {
            const visibleFilteredMarkers = currentMarkers.filter(
              (markerInfo) => {
                const inBounds = bounds.contain(
                  markerInfo.marker.getPosition()
                );
                const isMine =
                  isAuthenticated && markerInfo.user_id === user?.userId;
  
                const matchesFilter =
                  type === "mine"
                    ? isMine
                    : type === "all" || markerInfo.type === type;
  
                return matchesFilter && inBounds;
              }
            );
  
            clusterRef.current.addMarkers(
              visibleFilteredMarkers.map((m) => m.marker)
            );
            setVisibleMarkers(visibleFilteredMarkers);
          }
        }
      }, 10);
    },
    [map, user, isAuthenticated]
  );

  // 컴포넌트 언마운트 시 마커 정리
  useEffect(() => {
    return () => {
      // 모든 마커 제거
      markers.forEach((markerInfo) => {
        if (markerInfo.marker) {
          markerInfo.marker.setMap(null);
        }
        if (markerInfo.overlay) {
          markerInfo.overlay.setMap(null); // ✅ 커스텀 오버레이 닫기
        }
      });
    };
  }, [markers]);

  // 네비게이션 함수 - AuthContext 사용하도록 수정
  const goToChat = useCallback(() => {
    // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    // 로그인한 사용자는 채팅 페이지로 이동
    navigate("/chat");
  }, [navigate, isAuthenticated]);

  const goToProfile = useCallback(() => {
    // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    // 로그인한 사용자는 프로필 페이지로 이동
    navigate("/profile");
  }, [navigate, isAuthenticated]);

  const goToPetInfo = useCallback(() => {
    // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    // 로그인한 사용자는 반려견 정보 페이지로 이동
    navigate("/pets");
  }, [navigate, isAuthenticated]);

  // 서브타입 버튼 클릭 방식으로 변경
  const [showSubTypeButtons, setShowSubTypeButtons] = useState(false);

  // 함수 ref 추가
  // const loadMarkersFromLocalStorageRef = useRef(null);
  // const saveMarkersToLocalStorageRef = useRef(null);
  const getCurrentMapBoundsRef = useRef(null);
  const fetchMarkersFromBackendRef = useRef(null);
  const markerImagesRef = useRef(null);

  // 순환 참조를 방지하기 위한 함수 ref 업데이트
  useEffect(() => {
    removeMarkerRef.current = removeMarker;
    addMarkerRef.current = addMarker;
    // loadMarkersFromLocalStorageRef.current = loadMarkersFromLocalStorage;
    // saveMarkersToLocalStorageRef.current = saveMarkersToLocalStorage;
    getCurrentMapBoundsRef.current = getCurrentMapBounds;
    fetchMarkersFromBackendRef.current = fetchMarkersFromBackend;
    markerImagesRef.current = markerImages.current;
  }, [
    removeMarker,
    addMarker,
    // loadMarkersFromLocalStorage,
    // saveMarkersToLocalStorage,
    getCurrentMapBounds,
    // fetchMarkersFromBackend
  ]);

  // 모달 뜰 때 모든 오버레이 닫기
  useEffect(() => {
    if (showModal) {
      markersRef.current.forEach((m) => {
        if (m.overlay) {
          try {
            m.overlay.setMap(null);
            m.overlay = null;
          } catch (e) {
            console.warn("모달 열릴 때 overlay 닫기 실패:", e);
          }
        }
      });
    }
  }, [showModal]);

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
      mapDiv.addEventListener("click", handleMapClick);
    }

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      if (mapDiv) {
        mapDiv.removeEventListener("click", handleMapClick);
      }
    };
  }, [showSubTypeButtons]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white pt-2 pb-0 px-4 shadow-md flex items-center justify-center">
        <div className="flex items-center h-full gap-2">
          <img
            src="/gangazido-logo-header.png"
            alt="Gangazido Logo Header"
            className="h-14 w-28 object-cover self-center"
          />
        </div>
      </header>

      {/* 마커 생성 안내 */}
      <div className="bg-amber-50 p-3 shadow-sm border-b border-amber-200">
        <p className="text-center text-amber-800 text-sm font-medium">
          {isCenterMode
            ? "지도를 움직여 중앙에 마커를 위치시키고 '확정' 버튼을 누르세요"
            : "우측 버튼을 눌러 마커를 추가하세요"}
        </p>
      </div>
      
      <ToastContainer
          position="bottom-center"
          autoClose={2000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
          style={{ marginBottom: "65px" }} // 👈 여기
        />

      {/* 지도 영역 */}
      <div className="flex-1 bg-gray-200 relative">
        {!isMapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200 z-10">
            <div className="text-lg font-medium text-gray-600">
              지도를 불러오는 중...
            </div>
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
              <img
                src="/images/cross-mark.png"
                alt="중앙 마커"
                className="w-4 h-4" // tailwind 기준 크기 변경 10 : 40px?
              />
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-black bg-opacity-70 px-2 py-1 rounded text-white text-xs">
                지도를 움직여 위치 조정
              </div>
            </div>
          </div>
        )}

        {/* 현재 위치 이동 버튼 */}
        <div className="absolute bottom-3 right-3 z-30">
          <button
            onClick={moveToCurrentLocation}
            className="w-11 h-11 bg-white rounded-lg shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
            aria-label="내 위치로 이동"
          >
            <img
              src="/images/my-location.png" // 또는 퍼블릭 폴더 위치로 조정
              alt="내 위치 아이콘"
              className="w-6 h-6"
            />
          </button>
        </div>

        {/* 지도 영역 오른쪽 아래에 마커 유형별 추가 버튼 - 세로 정렬 */}
        {/* 댕플 & 댕져러스 버튼 */}
        <div className="absolute top-3 right-2 flex flex-col gap-4 z-20">
        <button
          onClick={() => {
            addMarkerAtCenter("댕플");
            setShowSubTypeButtons(false);
          }}
          className="flex flex-col items-center justify-center w-16 h-16 bg-yellow-100 border border-yellow-300 rounded-full shadow hover:scale-105 transition"
          aria-label="댕플 마커 추가"
        >
          <img
            src="/images/dangple_square.png"
            alt="댕플"
            className="w-7 h-7 object-contain"
          />
          <span className="text-[12px] font-semibold text-yellow-700 mt-1">댕플</span>
        </button>

        {/* 댕져러스 드롭다운 트리거 버튼 */}
        <div className="relative">
          <button
            onClick={() => setShowSubTypeButtons(!showSubTypeButtons)}
            className="flex flex-col items-center justify-center w-16 h-16 bg-red-100 border border-red-300 rounded-full shadow hover:scale-105 transition"
            aria-label="댕져러스 마커 추가"
          >
            <span className="text-xl">⚠️</span>
            <span className="text-[12px] font-bold text-red-700 mt-1">댕져러스</span>
          </button>

          {/* 드롭다운 메뉴 */}
          {showSubTypeButtons && (
            <div className="absolute top-full right-0 mt-2 flex flex-col gap-3 animate-fade-slide-down">
              {[
                { label: "들개", icon: "/images/beware_dog_square.png", bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-300" },
                { label: "빙판길", icon: "/images/icy_road_square.png", bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" },
                { label: "염화칼슘", icon: "/images/beware_foot_square.png", bg: "bg-green-100", text: "text-green-700", border: "border-green-300" },
                { label: "공사중", icon: "/images/construction_square.png", bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" },
              ].map(({ label, icon, bg, text, border }) => (
                <button
                  key={label}
                  onClick={() => {
                    addDangerousMarkerWithSubType(label);
                    setShowSubTypeButtons(false);
                  }}
                  className={`flex flex-col items-center justify-center w-16 h-16 ${bg} ${border} ${text} border rounded-full shadow hover:scale-105 transition`}
                  title={label}
                >
                  <img src={icon} alt={label} className="w-7 h-7 object-contain" />
                  <span className="text-[12px] font-semibold mt-1">{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

        {/* 좌표 정보 표시 제리 주석 처리*/}
        {/* <div className="absolute bottom-36 left-0 right-0 flex justify-center">
          <div className="bg-white px-4 py-2 rounded-full shadow-md text-sm">
            <span className="font-medium">
              위도: {centerPosition.lat.toFixed(6)}, 경도:{" "}
              {centerPosition.lng.toFixed(6)}
            </span>
          </div>
        </div> */}

        {/* 지도 상단에 마커 타입 필터링 버튼 추가 - 배경 없이 왼쪽 정렬 */}
        <div className="absolute top-4 left-4 z-20 flex gap-2">
          {[
            { label: "내 마커", value: "mine", color: "bg-green-500" },
            { label: "댕플", value: "댕플", color: "bg-amber-300" },
            { label: "댕져러스", value: "댕져러스", color: "bg-red-400" },
            { label: "전체", value: "all", color: "bg-gray-400" },
          ].map(({ label, value, color }) => (
            <button
              key={value}
              onClick={() => {
                if (value === "mine" && !isAuthenticated) {
                  toast.error("로그인 후 이용해주세요!", {
                    position: "bottom-center",
                    autoClose: 2000,
                    style: {
                      background: "#fff5f5",
                      color: "#a94442",
                      border: "1px solid #f5c6cb",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      fontWeight: "bold",
                    },
                    icon: "🔐",
                  });
                  return;
                }
                filterMarkersByType(value);
              }}
              className={`text-xs font-semibold py-3 px-5 rounded-full shadow transition ${
                filterType === value
                  ? `${color} text-white`
                  : "bg-white text-gray-600 border border-gray-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <nav className="bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-between px-2">
          <button className="flex flex-col items-center py-3 flex-1 text-amber-800">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="text-xs mt-1 font-medium">지도</span>
          </button>
          <button
            onClick={goToChat}
            className="flex flex-col items-center py-3 flex-1 text-gray-500 hover:text-amber-800 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            <span className="text-xs mt-1 font-medium">채팅</span>
          </button>
          <button
            onClick={goToProfile}
            className="flex flex-col items-center py-3 flex-1 text-gray-500 hover:text-amber-800 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="text-xs mt-1 font-medium">내 정보</span>
          </button>
          <button
            onClick={goToPetInfo}
            className="group flex flex-col items-center py-3 flex-1 text-gray-500 hover:text-amber-800 transition-all duration-300"
          >
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 21s-6-4.35-9-8c-3-3.35-3-7.35 0-10 3-3 7.5-2 9 2 1.5-4 6-5 9-2 3 3 3 7 0 10-3 3.65-9 8-9 8z"
                />
              </svg>
            </div>
            <span className="text-xs mt-1 font-medium">반려견 정보</span>
          </button>
        </div>
      </nav>

      {/* 마커 생성 버튼 클릭 시 모달 (찍어멍) */}
      {showModal && (
      <div className="fixed bottom-24 inset-x-0 z-50 w-[90%] max-w-sm mx-auto animate-fade-up transition">
        <div className="bg-white/90 rounded-2xl shadow-xl border border-gray-200 px-5 py-4 text-center relative">
      {/* 닫기 버튼 */}
      <button
        onClick={() => {
          setShowModal(false);
          setIsCenterMode(false);
        }}
        className="absolute top-2.5 right-3 text-gray-500 hover:text-red-500 text-2xl font-bold"
        aria-label="모달 닫기"
      >
        ×
      </button>

      {/* 이모지 + 타이틀 */}
      <div className="mb-2 flex items-center justify-center gap-2">
        <span className="text-2xl">
          {tempMarkerType === "댕플"
            ? "🐶"
            : tempMarkerSubType
              ? MARKER_IMAGES.EMOJI[tempMarkerSubType] || "⚠️"
              : "⚠️"}
        </span>
        <h2 className="text-lg font-bold text-gray-800">
          {tempMarkerType === "댕플"
            ? "댕플을 찍어멍!"
            : tempMarkerSubType
              ? `${tempMarkerSubType}을 찍어멍!`
              : "댕져러스를 찍어멍!"}
        </h2>
      </div>

      {/* 설명 텍스트 */}
      <p className="text-sm text-gray-600 mb-4 leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
        지도를 움직여 위치를 정하고 아래 버튼을 눌러주세요
      </p>

      {/* 확정 버튼 */}
      <button
        onClick={() => {
          createMarkerFromModal();
          setShowModal(false);
        }}
        className="w-32 bg-black text-white py-2 rounded-full hover:bg-gray-900 font-semibold text-sm shadow-md transition"
      >
        확정
      </button>
    </div>
  </div>
)}
    </div>
  );
}

export default MapPage;
