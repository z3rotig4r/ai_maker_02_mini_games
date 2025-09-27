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

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);