import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// 개발 모드에서 레시피 자체 테스트 실행
if (process.env.NODE_ENV === 'development') {
  import('./dev/recipeSelfTest').then(({ recipeSelfTest }) => {
    recipeSelfTest();
  });
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

if (process.env.NODE_ENV === 'development') {
  // 개발 모드에서는 StrictMode의 이중 호출로 인해 게임 루프/점수 증가가
  // 두 번 실행되는 혼란을 방지하기 위해 StrictMode를 비활성화한다.
  root.render(<App />);
} else {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}