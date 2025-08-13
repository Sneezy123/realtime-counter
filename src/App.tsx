import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './components/Home';
import { CounterGroup } from './components/CounterGroup';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:groupName" element={<CounterGroup />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;