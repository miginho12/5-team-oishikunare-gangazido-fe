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
        // 사용자 정보 요청
        const response = await getUserInfo();
        // 사용자 정보가 있으면 인증 상태로 설정
        if (response.data?.data) {
          setUser(response.data.data);
        } else {
          setUser(null);
        }
      } catch (err) {
        // 오류 발생 시 인증되지 않은 상태로 설정
        setUser(null);
      } finally {
        setLoading(false); // 로딩 완료
      }
    };

    checkAuthStatus();
  }, []);

  // 로그인 함수
  const login = (userData) => {
    if (!userData) {
      return;
    }
    setUser(userData);
  };

  // 로그아웃 함수
  const logout = () => {
    setUser(null);
  };

  // 인증 상태 새로고침 함수
  const refreshAuthStatus = async () => {
    setLoading(true);
    try {
      const response = await getUserInfo();
      setUser(response.data.data);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // user 상태 변경 모니터링
  useEffect(() => {
    // User 상태 변경 시 실행되는 효과
  }, [user]);

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