import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import Header from './components/Header';
import SearchPage from './pages/SearchPage';
import BrowsePage from './pages/BrowsePage';
import SetDetailPage from './pages/SetDetailPage';
import CollectionPage from './pages/CollectionPage';
import PartsSearchPage from './pages/PartsSearchPage';
import PartDetailPage from './pages/PartDetailPage';
import './styles/App.css';

function App() {
  return (
    <LanguageProvider>
      <Router>
        <Header />
        <main className="main-container">
          <Routes>
            <Route path="/" element={<SearchPage />} />
            <Route path="/browse" element={<BrowsePage />} />
            <Route path="/parts" element={<PartsSearchPage />} />
            <Route path="/part/:partNum" element={<PartDetailPage />} />
            <Route path="/set/:setNum" element={<SetDetailPage />} />
            <Route path="/collection" element={<CollectionPage />} />
          </Routes>
        </main>
      </Router>
    </LanguageProvider>
  );
}

export default App;
