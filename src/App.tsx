import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './components/Home';
import { CounterGroup } from './components/CounterGroup';
import { DarkModeToggle } from './components/DarkModeToggle';

function App() {
    return (
        <BrowserRouter>
            <DarkModeToggle />
            <Routes>
                <Route path='/' element={<Home />} />
                <Route path='/:groupName' element={<CounterGroup />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
