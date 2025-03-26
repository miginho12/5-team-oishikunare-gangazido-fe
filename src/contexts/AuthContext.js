import React, { createContext, useState, useContext, useEffect } from 'react';
import { getUserInfo } from '../api/user';

// 인증 컨텍스트 생성
const AuthContext = createContext();

// 인증 컨텍스트 사용을 위한 훅 생성
export const useAuth = () => useContext(AuthContext);

// 인증 상태 제공자 컴포넌트
export const AuthProvider = ({ children }) => {
  // 사용자 정보 상태
  const [user, setUser] = useState(null);
  // 로딩 상태
  const [loading, setLoading] = useState(true);

  // 컴포넌트 마운트 시 사용자 인증 상태 확인
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log('인증 상태 확인 시작');
        // 사용자 정보 요청
        const response = await getUserInfo();
        console.log('사용자 정보 응답:', response.data);
        setUser(response.data.data); // 인증된 사용자 정보 설정
        console.log('사용자 정보 설정 완료, 인증됨');
      } catch (err) {
        // 인증되지 않은 상태
        console.error('사용자 정보 요청 실패:', err);
        console.log('오류 상태 코드:', err.response?.status);
        console.log('오류 메시지:', err.response?.data?.message);
        setUser(null);
        console.log('사용자 정보 초기화, 인증되지 않음');
      } finally {
        setLoading(false); // 로딩 완료
        console.log('인증 상태 확인 완료, 로딩 상태 변경:', false);
      }
    };

    checkAuthStatus();
  }, []);

  // 로그인 함수
  const login = (userData) => {
    console.log('로그인 함수 호출, 사용자 데이터:', userData);
    if (!userData) {
      console.error('로그인 함수가 유효하지 않은 사용자 데이터로 호출됨:', userData);
      return;
    }
    setUser(userData);
    console.log('사용자 상태 업데이트됨');
  };

  // 로그아웃 함수
  const logout = () => {
    console.log('로그아웃 함수 호출');
    setUser(null);
    console.log('사용자 상태가 null로 설정됨');
  };

  // 인증 상태 새로고침 함수
  const refreshAuthStatus = async () => {
    console.log('인증 상태 새로고침 시작');
    setLoading(true);
    try {
      const response = await getUserInfo();
      console.log('인증 상태 새로고침 응답:', response.data);
      setUser(response.data.data);
      console.log('사용자 정보 업데이트 완료');
    } catch (err) {
      console.error('인증 상태 새로고침 실패:', err);
      setUser(null);
      console.log('사용자 정보 초기화');
    } finally {
      setLoading(false);
      console.log('인증 상태 새로고침 완료, 로딩 상태 변경:', false);
    }
  };

  // user 상태 변경 모니터링
  useEffect(() => {
    console.log('사용자 상태 변경 감지:', user);
    console.log('현재 인증 상태:', !!user);
  }, [user]);

  // 현재 인증 상태 로깅
  console.log('현재 인증 상태:', !!user, '사용자 정보:', user);
  console.log('현재 로딩 상태:', loading);

  // 컨텍스트 값
  const value = {
    user,
    isAuthenticated: !!user, // 사용자가 있으면 true, 없으면 false
    loading,
    login,
    logout,
    refreshAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 