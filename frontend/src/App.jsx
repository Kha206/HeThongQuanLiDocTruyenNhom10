import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/Reader/HomePage';
import StoryDetailPage from './pages/Reader/StoryDetailPage';
import ChapterReaderPage from './pages/Reader/ChapterReaderPage';
import SubscriptionsPage from './pages/Reader/SubscriptionsPage';
import PurchasedStoriesPage from './pages/Reader/PurchasedStoriesPage';
import ReadingHistoryPage from './pages/Reader/ReadingHistoryPage';
import TransactionHistoryPage from './pages/Reader/TransactionHistoryPage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import AdminStoriesPage from './pages/Admin/AdminStoriesPage';
import AdminChaptersPage from './pages/Admin/AdminChaptersPage';
import AdminPlansPage from './pages/Admin/AdminPlansPage';
import AdminCommentsPage from './pages/Admin/AdminCommentsPage';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <div className="flex flex-col min-h-screen bg-[#0F0F14] text-white">
          <Navbar />
          
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/stories" element={<HomePage />} />
              <Route path="/stories/:id" element={<StoryDetailPage />} />
              <Route path="/stories/:storyId/chapters/:chapterId" element={<ChapterReaderPage />} />
              <Route path="/chapters/:chapterId" element={<ChapterReaderPage />} />
              <Route path="/subscriptions" element={<SubscriptionsPage />} />
              <Route
                path="/purchased-stories"
                element={
                  <ProtectedRoute>
                    <PurchasedStoriesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reading-history"
                element={
                  <ProtectedRoute>
                    <ReadingHistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/transactions"
                element={
                  <ProtectedRoute>
                    <TransactionHistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Admin Protected Routes */}
              <Route
                path="/admin/stories"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminStoriesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/chapters"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminChaptersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/plans"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminPlansPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/comments"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminCommentsPage />
                  </ProtectedRoute>
                }
              />


              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
