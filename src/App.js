import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import SearchPage from './pages/SearchPage';
import BrowsePage from './pages/BrowsePage';
import SetDetailPage from './pages/SetDetailPage';
import CollectionPage from './pages/CollectionPage';
import './styles/App.css';

function App() {
  return (
    <Router>
      <Header />
      <main className="main-container">
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/set/:setNum" element={<SetDetailPage />} />
          <Route path="/collection" element={<CollectionPage />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
