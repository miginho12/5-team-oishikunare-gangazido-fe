

[LEO]
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

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
