import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SharedAuditPage from './pages/SharedAuditPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/audit/:id" element={<SharedAuditPage />} />
      </Routes>
    </BrowserRouter>
  );
}