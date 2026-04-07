import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Header';
import SearchPage from './pages/SearchPage';
import BrowsePage from './pages/BrowsePage';
import SetDetailPage from './pages/SetDetailPage';
import CollectionPage from './pages/CollectionPage';
import PartsSearchPage from './pages/PartsSearchPage';
import PartDetailPage from './pages/PartDetailPage';
import NewProductsPage from './pages/NewProductsPage';
import FundingPage from './pages/FundingPage';
import MocsPage from './pages/MocsPage';
import MocDetailPage from './pages/MocDetailPage';
import ScarcityPage from './pages/ScarcityPage';
import './styles/App.css';
import './styles/theme-dark.css';

function App() {
  return (
    <ThemeProvider>
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
              <Route path="/new" element={<NewProductsPage />} />
              <Route path="/funding" element={<FundingPage />} />
              <Route path="/mocs" element={<MocsPage />} />
              <Route path="/moc/:mocNum" element={<MocDetailPage />} />
              <Route path="/scarcity" element={<ScarcityPage />} />
            </Routes>
          </main>
        </Router>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
