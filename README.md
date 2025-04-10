# LEO(25.04.10.)
## Routing
### Main Routes
- /map: 메인 지도 페이지
- /lgoin, /register: 인증 관련 페이지
- /profile, /profile/edit, /profile/password: 프로필 관련 페이지
- /pets, /pets/edit, /pets/register: 반려견 관련 페이지
- /chat: 채팅 페이지
### ProtectedRoute
- 인증이 필요한 경로를 그룹화하여 관리하는 방식 사용
- Outlet 컴포넌트를 활용하여 중첩 라우팅 구현
- 인증 상태에 따라 로그인 페이지로 리다이렉트하는 로직 포함



## AuthProvider
### Context API
- AuthContext를 생성하고 AuthProvider 컴포넌트를 사용하여 전역적으로 공유
- useAuth 훅을 통해 어디서든 인증 상태에 쉽게 접근 가능
### State
- user: 현재 로그인한 사용자 정보
- loading: 인증 상태 확인 중인지 여부
- isAuthenticated: 사용자가 인증되었는지 여부
### Function
- login: 사용자 로그인 처리
- logout: 사용자 로그아웃 처리
- checkAuthStatus: 서버에 API 요청을 통해 인증 상태 확인(5분마다 자동으로 인증 상태 확인하여 세션 유지)
- refreshAuthStatus: 인증 상태 갱신



## Viewport Height Adjustment for Mobile Devices
### useEffect Hook for Handling Mobile Viewport Issues
- CSS 변수(--vh)를 사용하여 실제 뷰포트 높이 계산
- 리사이즈 이벤트 처리
- 방향 전환 처리



## Sentry Integration
### Conditional Initialization
- 프로덕션 환경에서만 Sentry를 활성화하여 불필요한 오류 로깅 방지
- user의 ID와 닉네임을 수집하여 특정 사용자의 오류 추적


## Initial Page Flow & Entry Point
### Conditional Rendering
- 인증된 사용자: 모든 페이지 접근 가증
- 미인증 사용자: 로그인/회원가입 페이지 및 메인 지도 페이지만 접근 가능


==============================================================================


# LEO(25.03.24.)
### 📂 /deprecated 폴더
- 현재 사용되지 않지만, 향후 참조할 가능성이 있는 파일을 보관하는 공간입니다.
- 일정 기간 동안 필요하지 않으면 삭제될 수 있습니다.

### 📂 /pages 폴더
- 페이지 단위 컴포넌트 폴더입니다.
- 각 페이지별로 컴포넌트를 구성하여 관리합니다.

## 📄 페이지 설명

각 페이지는 다음과 같은 경로(Route)를 가지고 있으며, 사용자 인터페이스와 기능별로 분리되어 있습니다:

- `/login` : 사용자 로그인 페이지  
  사용자가 계정 정보를 입력해 로그인할 수 있는 페이지입니다.

- `/register` : 회원가입 페이지  
  신규 사용자가 계정을 생성할 수 있는 폼을 제공합니다.

- `/profile` : 사용자 프로필 페이지  
  로그인한 사용자의 기본 정보(이름, 이메일 등)를 조회할 수 있습니다.

- `/profile/edit` : 프로필 수정 페이지  
  사용자가 자신의 정보를 수정할 수 있는 폼 페이지입니다.

- `/profile/password` : 비밀번호 변경 페이지  
  현재 비밀번호를 확인하고 새 비밀번호로 변경할 수 있습니다.

- `/map` : 메인 지도 페이지  
  반려동물 산책 위치를 확인하거나, 주변 정보를 탐색할 수 있는 중심 기능 페이지입니다.

- `/chat` : 실시간 채팅 페이지  
  LLM을 활용하여 사용자에게 산책 관련 날씨 정보 등을 추천하는 페이지입니다.

- `/pets` : 반려동물 정보 조회 페이지  
  사용자가 등록한 반려동물의 정보를 확인할 수 있습니다.

- `/pets/edit` : 반려동물 정보 수정 페이지  
  반려동물의 기본 정보를 수정할 수 있는 페이지입니다.

- `/pets/register` : 반려동물 등록 페이지  
  새 반려동물을 시스템에 등록할 수 있는 폼을 제공합니다.

- `/` : 루트 경로  
  기본 진입 경로로, 자동으로 `/map` 페이지로 리다이렉트됩니다.



### 🔗 프론트엔드와 백엔드의 상호작용
- API 호출은 `src/api/` 디렉토리에서 관리할 예정이며 `fetch` 또는 `axios`를 사용하여 백엔드와 데이터를 주고받습니다.
- 카카오맵의 API 키는 `.env` 파일에 `REACT_APP_KAKAO_MAP_API_KEY`로 저장됩니다.
- 백엔드 API의 기본 URL은 `.env` 파일에 `REACT_APP_API_BASE_URL`로 저장됩니다.
- 로그인 및 인증이 필요한 경우, 토큰은 `localStorage` 또는 `sessionStorage`에서 관리됩니다.

### 🛠️ DevOps 및 배포 정보
- 프론트엔드는 `npm run build` 명령어를 실행하면 `build/` 폴더가 생성됩니다.
- 배포 환경에서는 `.env` 파일의 `REACT_APP_API_BASE_URL` 값이 올바르게 설정되어 있어야 합니다.
- 배포 플랫폼: Nginx, Vercel, Netlify, Docker 기반 인프라 등 다양한 옵션을 활용할 수 있습니다.


==============================================================================


