import React from 'react';
import Game from './components/Game';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="App">
      <h1>마리오의 전설의 무기 제작</h1>
      <Game />
    </div>
  );
};

export default App;