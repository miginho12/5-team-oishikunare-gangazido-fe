import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPetInfo } from '../api/pet';

function PetInfo() {
  const navigate = useNavigate();
  const [pet, setPet] = useState(null);

  const goToMap = () => navigate('/map');
  const goToChat = () => navigate('/chat');
  const goToProfile = () => navigate('/profile');
  const goToPetEdit = () => navigate('/pets/edit');


  useEffect(() => {
    const fetchPetInfo = async () => {
      try {
        const response = await getPetInfo();
        console.log('🐶 응답 데이터:', response.data); // 이거 추가
        if (response?.data?.message === 'get_pet_success') {
          setPet(response.data.data); // 백엔드 응답 구조에 따라 데이터 추출
        }
      } catch (error) {
        console.error('반려견 정보 가져오기 실패:', error);
      }
    };
  
    fetchPetInfo();
  }, []);

  if (!pet) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500 text-sm">반려견 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white p-4 shadow-md flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">반려견 정보</h1>
        <button className="p-2 rounded-full hover:bg-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
          </svg>
        </button>
      </header>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* 반려견 프로필 카드 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-4">
          <div className="flex items-center mb-6">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-amber-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{pet.name}</h2>
              <p className="text-gray-600">{pet.breed} · {pet.age}세 · {pet.gender ? '수컷' : '암컷'}</p>
              <div className="flex mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                  건강
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  중성화 완료
                </span>
              </div>
            </div>
            <button
              onClick={goToPetEdit}
              className="ml-auto p-2 rounded-full bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-gray-500 text-sm">몸무게</p>
              <p className="font-bold text-gray-800">{pet?.weight}kg</p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 text-sm">생일</p>
              <p className="font-bold text-gray-800">2020.05.15</p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 text-sm">입양일</p>
              <p className="font-bold text-gray-800">2020.07.10</p>
            </div>
          </div>

          <div className="flex justify-between">
            <button className="flex flex-col items-center justify-center w-1/4 p-3 rounded-md hover:bg-gray-50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-800 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-xs text-gray-700">건강수첩</span>
            </button>
            <button className="flex flex-col items-center justify-center w-1/4 p-3 rounded-md hover:bg-gray-50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-800 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs text-gray-700">일정</span>
            </button>
            <button className="flex flex-col items-center justify-center w-1/4 p-3 rounded-md hover:bg-gray-50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-800 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs text-gray-700">사진첩</span>
            </button>
            <button className="flex flex-col items-center justify-center w-1/4 p-3 rounded-md hover:bg-gray-50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-800 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs text-gray-700">메모</span>
            </button>
          </div>
        </div>

        {/* 건강 정보 카드 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-semibold text-gray-700">건강 정보</h3>
            <button className="text-sm text-amber-800 font-medium flex items-center">
              더보기
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-800">종합 예방접종</h4>
                <p className="text-xs text-gray-500">2023.05.15</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                완료
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-800">심장사상충 예방</h4>
                <p className="text-xs text-gray-500">2023.06.10</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                완료
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-800">건강검진</h4>
                <p className="text-xs text-gray-500">2023.07.20</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                완료
              </span>
            </div>
          </div>
        </div>

        {/* 산책 기록 카드 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-semibold text-gray-700">이번 주 산책 기록</h3>
            <button className="text-sm text-amber-800 font-medium flex items-center">
              더보기
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="flex justify-between mb-4">
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-1 rounded-full flex items-center justify-center bg-amber-800 text-white text-xs">
                월
              </div>
              <div className="w-2 h-2 mx-auto rounded-full bg-amber-800"></div>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-1 rounded-full flex items-center justify-center bg-amber-800 text-white text-xs">
                화
              </div>
              <div className="w-2 h-2 mx-auto rounded-full bg-amber-800"></div>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-1 rounded-full flex items-center justify-center bg-gray-200 text-gray-500 text-xs">
                수
              </div>
              <div className="w-2 h-2 mx-auto rounded-full bg-gray-200"></div>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-1 rounded-full flex items-center justify-center bg-amber-800 text-white text-xs">
                목
              </div>
              <div className="w-2 h-2 mx-auto rounded-full bg-amber-800"></div>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-1 rounded-full flex items-center justify-center bg-gray-200 text-gray-500 text-xs">
                금
              </div>
              <div className="w-2 h-2 mx-auto rounded-full bg-gray-200"></div>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-1 rounded-full flex items-center justify-center bg-amber-800 text-white text-xs">
                토
              </div>
              <div className="w-2 h-2 mx-auto rounded-full bg-amber-800"></div>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-1 rounded-full flex items-center justify-center bg-gray-200 text-gray-500 text-xs">
                일
              </div>
              <div className="w-2 h-2 mx-auto rounded-full bg-gray-200"></div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-gray-800">이번 주 산책 요약</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-sm">총 산책 횟수</p>
                <p className="font-bold text-gray-800">4회</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">총 산책 시간</p>
                <p className="font-bold text-gray-800">2시간 30분</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">총 산책 거리</p>
                <p className="font-bold text-gray-800">5.2km</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">평균 산책 시간</p>
                <p className="font-bold text-gray-800">37분</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <nav className="bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-between px-2">
          <button onClick={goToMap} className="flex flex-col items-center py-3 flex-1 text-gray-500 hover:text-amber-800 transition-colors">
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
          <button className="flex flex-col items-center py-3 flex-1 text-amber-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21s-6-4.35-9-8c-3-3.35-3-7.35 0-10 3-3 7.5-2 9 2 1.5-4 6-5 9-2 3 3 3 7 0 10-3 3.65-9 8-9 8z" />
            </svg>
            <span className="text-xs mt-1 font-medium">반려견 정보</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default PetInfo; 