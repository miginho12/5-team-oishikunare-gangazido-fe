import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { uploadPetImage, updatePetInfo, deletePet, getPetInfo } from '../api/pet';
import Select from 'react-select';

function PetEdit() {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [weight, setWeight] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [isImageRemoved, setIsImageRemoved] = useState(false);

  const [nameError, setNameError] = useState('');
  const [ageError, setAgeError] = useState('');
  const [weightError, setWeightError] = useState('');
  const [genderError, setGenderError] = useState('');
  const [breedError, setBreedError] = useState('');
  const [touched, setTouched] = useState({
    name: false,
    breed: false,
    age: false,
    gender: false,
    weight: false,
  });

  const breedOptions = [
    { value: '푸들', label: '푸들' },
    { value: '비숑 프리제', label: '비숑 프리제' },
    { value: '포메라니안', label: '포메라니안' },
    { value: '말티즈', label: '말티즈' },
    { value: '웰시코기', label: '웰시코기' },
    { value: '골든 리트리버', label: '골든 리트리버' },
    { value: '래브라도 리트리버', label: '래브라도 리트리버' },
    { value: '보더 콜리', label: '보더 콜리' },
    { value: '시베리안 허스키', label: '시베리안 허스키' },
    { value: '진돗개', label: '진돗개' },
    { value: '믹스견', label: '믹스견' },
    { value: '기타', label: '기타' },
  ];

  const genderOptions = [
    { value: 'male', label: '수컷' },
    { value: 'female', label: '암컷' },
  ];
  
  const fileInputRef = useRef(null);
  const location = useLocation();

  // 최초 로딩 시 기존 반려견 정보 불러오기
  useEffect(() => {
    const fetchPet = async () => {
      try {
        const res = await getPetInfo();
        if (res?.data?.message === 'get_pet_success') {
          const data = res.data.data;
          setName(data.name);
          setBreed(data.breed);
          setAge(data.age);
          setGender(data.gender ? 'male' : 'female');
          setWeight(data.weight);

          // ✅ CloudFront 전체 URL로 온 경우 → key 추출
          if (data.profileImage && typeof data.profileImage === 'string') {
            const isFullUrl = data.profileImage.includes('cloudfront.net');
            const s3Key = isFullUrl
              ? data.profileImage.split('.net/')[1].split('?')[0] // 키만 추출
              : data.profileImage;
            setProfileImage(s3Key); // 🔄 key만 저장
            setProfileImagePreview(data.profileImage); // 🔄 전체 URL은 preview 용도
            setIsImageRemoved(false);

            console.log('✅ 기존 이미지 로드됨:', s3Key);
          }
        }
      } catch (err) {
        console.error('반려견 정보 조회 실패:', err);
      }
    };
    fetchPet();
  }, []);

  const goToMap = () => navigate('/map');
  const goToChat = () => navigate('/chat');
  const goToProfile = () => navigate('/profile');
  const goToPetInfo = () => navigate('/pets');

  const handleDeletePet = () => {
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await deletePet();
      navigate('/pets/register');
    } catch (error) {
      console.error('반려견 삭제 실패:', error);
    }
  };

  const cancelDelete = () => {
    setShowConfirm(false);
  };

  const handleProfileImageChange = (e) => {
    // ✅ 새 이미지 선택한 경우
    const file = e.target.files[0];
    const tempUrl = URL.createObjectURL(file);
    setProfileImage(file);
    setProfileImagePreview(tempUrl);
    setIsImageRemoved(false);
    console.log('✅ 새 이미지 선택됨');

    // ✅ 동일 파일 재선택 위해 input 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 이미지 X 버튼 클릭 시 삭제 처리 함수
  const handleRemoveImage = () => {
    setProfileImage(null);
    setProfileImagePreview(null);
    setIsImageRemoved(true);
  };

  const handleUpdatePet = async () => {
    const isValid = validateFields(); // 1. 프론트 유효성 검사 먼저
    if (!isValid) {
      // 🔥 유효성 실패 시 첫 번째 에러 필드에 shake 적용
      const firstErrorInput = document.querySelector('input.border-red-500, select.border-red-500');
      if (firstErrorInput) {
        firstErrorInput.classList.add('shake');
        setTimeout(() => {
          firstErrorInput.classList.remove('shake');
        }, 500);
      }

      setToastMessage('모든 항목을 올바르게 입력해주세요.');
      setShowToast(true);
      return;
    }

    let profileImageKeyToSend;
    if (isImageRemoved) {
      profileImageKeyToSend = null; // 삭제
    } else if (profileImage instanceof File) {
      profileImageKeyToSend = await uploadPetImage(profileImage); // 새로 업로드
    } else if (typeof profileImage === 'string') {
      profileImageKeyToSend = profileImage; // 기존 유지
    } 

    try {
      await updatePetInfo({
        name,
        age,
        gender: gender === 'male',
        breed,
        weight,
        profileImage: profileImageKeyToSend,
      });
      setToastMessage('수정을 완료하였습니다.');
      setShowToast(true);
    } catch (error) {
      const errorMsg = error.response?.data?.message;
      handleRegisterError(errorMsg); // 3. 백엔드 에러 메시지 처리
    }
  };

  // 프론트 자체 유효성 검사
  const validateFields = (field) => {
    let isValid = true;
    const fieldsToCheck = field ? [field] : ['name', 'age', 'weight', 'gender', 'breed'];
  
    if (fieldsToCheck.includes('name')) {
      setNameError('');
      const nameRegex = /^[가-힣a-zA-Z]+$/;
      if (!name) {
        setNameError('반려견의 이름을 입력하세요.');
        isValid = false;
      } else if (!nameRegex.test(name)) {
        setNameError('반려견의 이름은 공백없이 한글 또는 영문만 입력 가능합니다.');
        isValid = false;
      } else if (name.length > 10) {
        setNameError('반려견의 이름은 최대 10자까지 입력 가능합니다.');
        isValid = false;
      }
    }
  
    if (fieldsToCheck.includes('age')) {
      setAgeError('');
      const ageNum = parseInt(age);
      if (!age) {
        setAgeError('반려견의 나이를 입력하세요.');
        isValid = false;
      } else if (isNaN(ageNum) || ageNum < 1 || ageNum > 50) {
        setAgeError('반려견 나이는 1부터 50사이의 숫자만 입력 가능합니다.');
        isValid = false;
      }
    }
  
    if (fieldsToCheck.includes('weight')) {
      setWeightError('');
      const trimmed = String(weight).trim();
      const weightNum = parseFloat(trimmed);
      if (trimmed === '') {
        setWeightError('반려견의 몸무게를 입력하세요.');
        isValid = false;
      } else if (isNaN(weightNum) || weightNum <= 0 || weightNum >= 200) {
        setWeightError('반려견 몸무게는 1부터 200사이의 숫자만 입력 가능합니다.');
        isValid = false;
      }
    }
  
    if (fieldsToCheck.includes('gender')) {
      setGenderError('');
      if (!gender) {
        setGenderError('반려견의 성별을 선택하세요.');
        isValid = false;
      }
    }
  
    if (fieldsToCheck.includes('breed')) {
      setBreedError('');
      if (!breed) {
        setBreedError('반려견의 품종을 입력하세요.');
        isValid = false;
      }
    }
  
    return isValid;
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateFields(field); // 💡 이렇게 분리해서 바로 호출
  };

  // 백엔드 응답 처리
  const handleRegisterError = (message) => {
    setNameError('');
    setAgeError('');
    setWeightError('');
    setGenderError('');
    setBreedError('');

    switch (message) {
      case 'required_pet_name':
        setNameError('반려견의 이름을 입력하세요.');
        break;
      case 'invalid_pet_name_format':
        setNameError('반려견의 이름은 공백없이 한글 또는 영문만 입력 가능합니다.');
        break;
      case 'invalid_pet_name_length':
        setNameError('반려견의 이름은 최대 10자까지 입력 가능합니다.');
        break;

      case 'required_pet_age':
        setAgeError('반려견의 나이를 입력하세요.');
        break;
      case 'invalid_pet_age_format':
        setAgeError('반려견의 나이는 숫자로 입력해주세요.');
        break;
      case 'invalid_pet_age_value':
        setAgeError('반려견 나이는 1부터 50사이의 숫자만 입력 가능합니다.');
        break;

      case 'required_pet_weight':
        setWeightError('반려견의 몸무게를 입력하세요.');
        break;
      case 'invalid_pet_weight':
        setWeightError('올바른 몸무게 형식을 입력해주세요. (예: 5 또는 5.2)');
        break;

      case 'required_pet_gender':
        setGenderError('반려견의 성별을 선택하세요.');
        break;

      case 'required_pet_breed':
        setBreedError('반려견의 품종을 입력하세요.');
        break;

      case 'already_exits_pet':
        setNameError('이미 등록된 반려견이 있어요.');
        break;

      case 'required_authorization':
        alert('로그인이 필요합니다.');
        navigate('/login');
        break;

      case 'not_found_user':
        alert('사용자를 찾을 수 없습니다.');
        break;

      case 'not_found_pet':
        alert('반려견 정보를 찾을 수 없습니다.');
        break;

      case 'internal_server_error':
        alert('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        break;

      default:
        alert('알 수 없는 오류가 발생했습니다.');
    }
  };

  // 수정 완료 시, 여전히 수정 페이지에 있는 경우 1초 뒤에 /pets로 이동
  useEffect(() => {
    if (showToast && toastMessage === '수정을 완료하였습니다.') {
      const timer = setTimeout(() => {
        if (location.pathname === '/pets/edit') {
          navigate('/pets');
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [showToast, toastMessage, location.pathname, navigate]);

  // 드롭박스 커스텀 스타일
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: '3rem',
      borderRadius: '0.375rem',
      borderColor: state.isFocused ? '#92400e' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(146, 64, 14, 0.4)' : 'none',
      '&:hover': {
        borderColor: '#92400e',
      },
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 50,
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? 'rgba(146, 64, 14, 0.2)'  // ✅ 선택된 항목 (파란 배경 방지)
        : state.isFocused
        ? 'rgba(146, 64, 14, 0.1)'  // ✅ 마우스 올렸을 때
        : 'white',
      color: '#1f2937',
      cursor: 'pointer',
      ':active': {
        backgroundColor: 'rgba(146, 64, 14, 0.3)',
      },
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#1f2937',
    }),
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white pt-2 pb-0 px-4 shadow-md flex items-center relative">
        <button onClick={() => navigate('/pets')} className="absolute left-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-grow flex justify-center">
          <img
            src="/gangazido-logo-header.png"
            alt="Gangazido Logo Header"
            className="h-14 w-28 object-cover cursor-pointer"
            onClick={() => navigate('/map')}
          />
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-md p-4 mb-4">
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center mb-3 overflow-visible">
              {profileImagePreview && !isImageRemoved ? (
                <>
                  <img
                    src={profileImagePreview}
                    alt="프로필 미리보기"
                    className="w-full h-full object-cover rounded-full"
                    onError={handleRemoveImage}
                  />
                  {/* ✅ 이미지 위 오른쪽 상단에 X 버튼 */}
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-white bg-opacity-100 text-red-600 text-xl font-bold rounded-full w-8 h-8 flex items-center justify-center shadow hover:bg-opacity-100 z-50"
                    aria-label="이미지 삭제"
                  >
                    x
                  </button>
                </>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-amber-800"
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
            <label htmlFor="pet-profile-upload" className="text-sm text-amber-800 font-medium cursor-pointer">
              프로필 사진 변경
              <input
                id="pet-profile-upload"
                type="file"
                accept="image/*"
                ref={fileInputRef} // 👈 연결
                onChange={handleProfileImageChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="space-y-4"> 
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">반려견 이름</label>
              {/* 이름 */}
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => handleBlur('name')}
                placeholder="이름"
                className={`w-full p-3 border ${nameError ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-transparent`}                required
              />
              {touched.name && nameError && (
                <p className="text-sm text-red-500 mt-1">{nameError}</p>
              )}
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">품종</label>
              <Select
                options={breedOptions}
                value={breedOptions.find((option) => option.value === breed)}
                onChange={(selectedOption) => setBreed(selectedOption.value)}
                placeholder="품종 선택"
                className="react-select-container"
                classNamePrefix="react-select"
                styles={customSelectStyles}
                isSearchable={false}
              />
              {touched.breed && breedError && (
                <p className="text-sm text-red-500 mt-1">{breedError}</p>
              )}
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">나이</label>
              <input
                type="number"
                value={age}
                onChange={(e) => {
                  const value = e.target.value;
              
                  // 정수만 입력 허용 + 2자리까지만
                  if (/^\d{0,2}$/.test(value)) {
                    setAge(value);
                  }
                }}
                onBlur={() => handleBlur('age')}
                placeholder="나이"
                className={`w-full p-3 border ${ageError ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-transparent`}                required
                min="1"
              />
              {touched.age && ageError && (
                <p className="text-sm text-red-500 mt-1">{ageError}</p>
              )}
            </div>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">몸무게</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => {
                  const value = e.target.value;
                
                  // 정수 1~3자리 + 선택적으로 소숫점 1자리까지 허용
                  if (/^\d{0,3}(\.\d{0,1})?$/.test(value)) {
                    setWeight(value);
                  }
                }}
                onBlur={() => handleBlur('weight')}
                placeholder="kg 단위로 입력해주세요"
                className={`w-full p-3 border ${weightError ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-transparent`}                required
                step="0.1"
                min="0.1"
              />
              {touched.weight && weightError && (
                <p className="text-sm text-red-500 mt-1">{weightError}</p>
              )}
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">성별</label>
              <Select
                options={genderOptions}
                value={genderOptions.find((option) => option.value === gender)}
                onChange={(selectedOption) => setGender(selectedOption.value)}
                placeholder="성별 선택"
                styles={customSelectStyles}
                isSearchable={false}
              />
              {touched.gender && genderError && (
                <p className="text-sm text-red-500 mt-1">{genderError}</p>
              )}
            </div>








            {/* 생일, 입양일, 중성화, 특이사항 등 추후 사용 예정 */}
            {/*}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">중성화 여부</label>
                <select
                  defaultValue="yes"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-transparent"
                  required
                >
                  <option value="yes">완료</option>
                  <option value="no">미완료</option>
                </select>
              </div>
              */}
          </div>
          {/* 생일, 입양일, 중성화, 특이사항 등 추후 사용 예정 */}
          {/*}
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">생일</label>
                <input
                  type="date"
                  defaultValue="2020-05-15"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-transparent"
                  required
                />
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">입양일</label>
                <input
                  type="date"
                  defaultValue="2020-07-10"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">특이사항</label>
              <textarea
                defaultValue="알러지 없음, 활발한 성격"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-transparent h-24"
              ></textarea>
            </div>
            */}
          <button
            onClick={handleUpdatePet}
            className="w-full bg-amber-800 text-white p-3 rounded-md text-center font-medium mt-4"
          >
            수정 완료
          </button>

          <button
            onClick={handleDeletePet}
            className="w-full bg-white border border-red-500 text-red-500 p-3 rounded-md text-center font-medium mt-2"
          >
            반려견 정보 삭제
          </button>
        </div>
      </div>

      {/* 확인 모달 */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-4/5 max-w-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">반려견 정보 삭제</h3>
            <p className="text-sm text-gray-600 mb-6">
              정말로 반려견 정보를 삭제하시겠습니까? 삭제된 정보는 복구할 수 없습니다.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                취소
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 토스트 메시지 */}
      {showToast && (
        <div
          className="fixed bottom-24 inset-x-0 flex justify-center z-50"
        >
          <div
            className="w-full max-w-sm bg-white bg-opacity-80 border border-amber-800 
                      text-amber-800 p-3 rounded-md shadow-lg text-center animate-fade-in-up mx-4"
          >
            {toastMessage}
          </div>
        </div>
      )}

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
          <button onClick={goToPetInfo} className="flex flex-col items-center py-3 flex-1 text-amber-800">
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

export default PetEdit; 