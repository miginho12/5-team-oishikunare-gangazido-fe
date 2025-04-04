import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getPetInfo } from "../api/pet";
import { useAuth } from "../contexts/AuthContext";

function PetInfo() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const goToMap = () => navigate("/map");
  const goToChat = () => navigate("/chat");
  const goToProfile = () => navigate("/profile");
  const goToPetEdit = () => navigate("/pets/edit");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // 반려견 기본 정보 가져오기
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const fetchPetInfo = async () => {
        try {
          const response = await getPetInfo();
          const data = response.data.data;

          setPet(data);
          setLoading(false);
        } catch (error) {
          console.error("반려견 정보 가져오기 실패:", error);
          const message = error?.response?.data?.message;
          if (message === "not_found_pet") {
            navigate("/pets/register");
          } else {
            setError("반려견 정보를 불러오는 중 문제가 발생했습니다.");
            setLoading(false);
          }
        }
      };

      fetchPetInfo();
    }
  }, [authLoading, isAuthenticated, navigate]);

  // 로딩 중이면 로딩 표시
  if (loading || !pet) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-800"></div>
        <p className="mt-4 text-gray-600">반려견 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <p>{error}</p>
        </div>
        <button 
          onClick={() => navigate('/map')} 
          className="px-4 py-2 bg-amber-800 text-white rounded-md"
        >
          지도로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white pt-2 pb-0 px-4 shadow-md flex items-center relative">
        <button onClick={() => navigate('/map')} className="absolute left-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-grow flex justify-center">
          <img
            src="/gangazido-logo-header.png"
            alt="Gangazido Logo Header"
            className="h-14 w-28 object-cover"
          />
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-md p-4 mb-4">
          <div className="flex flex-col items-center mb-6">
            {/* 프로필 이미지 */}
            <div className="w-32 h-32 bg-amber-100 rounded-full overflow-hidden flex items-center justify-center mb-4">
              {pet.profileImage ? (
                <img
                  src={pet.profileImage}
                  alt="반려견 프로필"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    setPet((prev) => ({ ...prev, profileImage: null }));
                  }}
                />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 text-amber-800"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              )}
            </div>
            
            {/* 반려견 이름 */}
            <h2 className="text-xl font-bold text-gray-800 mb-2">{pet.name}</h2>
            
            {/* 태그 정보 */}
            <div className="flex justify-center space-x-2 mb-4">
              {pet.neutered && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  중성화 완료
                </span>
              )}
              {pet.vaccinated && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  예방접종 완료
                </span>
              )}
            </div>
          </div>

          {/* 반려견 정보 리스트 */}
          <div className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">몸무게</label>
              <div className="w-full p-3 border border-gray-300 rounded-md bg-gray-100 flex justify-between items-center">
                <span className="text-gray-800">{pet.weight} kg</span>
              </div>
            </div>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">나이</label>
              <div className="w-full p-3 border border-gray-300 rounded-md bg-gray-100 flex justify-between items-center">
                <span className="text-gray-800">{pet.age}살</span>
              </div>
            </div>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">품종</label>
              <div className="w-full p-3 border border-gray-300 rounded-md bg-gray-100 flex justify-between items-center">
                <span className="text-gray-800">{pet.breed || '믹스견'}</span>
              </div>
            </div>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">성별</label>
              <div className="w-full p-3 border border-gray-300 rounded-md bg-gray-100 flex justify-between items-center">
                <span className="text-gray-800">{pet.gender ? "수컷" : "암컷"}</span>
              </div>
            </div>
            
            <button 
              onClick={goToPetEdit}
              className="w-full bg-amber-800 text-white p-3 rounded-md text-center font-medium mt-6"
            >
              반려견 정보 수정
            </button>
          </div>
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <nav className="bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-between px-2">
          <button
            onClick={goToMap}
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
                d="M12 21s-6-4.35-9-8c-3-3.35-3-7.35 0-10 3-3 7.5-2 9 2 1.5-4 6-5 9-2 3 3 3 7 0 10-3 3.65-9 8-9 8z"
              />
            </svg>
            <span className="text-xs mt-1 font-medium">반려견 정보</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default PetInfo;