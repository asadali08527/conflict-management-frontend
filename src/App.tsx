import { Suspense, lazy } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';
import { PanelistAuthProvider } from '@/contexts/PanelistAuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { ProtectedAdminRoute } from '@/components/admin/ProtectedAdminRoute';
import { ProtectedPanelistRoute } from '@/components/panelist/ProtectedPanelistRoute';
import { ProtectedClientRoute } from '@/components/client/ProtectedClientRoute';
import ErrorBoundary from '@/components/ErrorBoundary';

// Lazy load pages for code splitting
const Index = lazy(() => import('./pages/Index'));
const NotFound = lazy(() => import('./pages/NotFound'));
const CaseSubmission = lazy(() => import('./pages/CaseSubmission'));

// Admin pages
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminCaseDetail = lazy(() => import('./pages/admin/AdminCaseDetail'));
const PanelistList = lazy(() => import('./pages/admin/PanelistList'));
const PanelistDetail = lazy(() => import('./pages/admin/PanelistDetail'));
const PanelistForm = lazy(() => import('./pages/admin/PanelistForm'));

// Panelist pages
const PanelistLogin = lazy(() => import('./pages/panelist/PanelistLogin'));
const PanelistDashboard = lazy(() => import('./pages/panelist/PanelistDashboard'));
const PanelistCases = lazy(() => import('./pages/panelist/PanelistCases'));
const PanelistCaseDetail = lazy(() => import('./pages/panelist/PanelistCaseDetail'));
const PanelistMeetings = lazy(() => import('./pages/panelist/PanelistMeetings'));
const PanelistMessages = lazy(() => import('./pages/panelist/PanelistMessages'));
const PanelistProfile = lazy(() => import('./pages/panelist/PanelistProfile'));

// Client pages
const ClientDashboard = lazy(() => import('./pages/client/ClientDashboard'));
const ClientCaseDetail = lazy(() => import('./pages/client/ClientCaseDetail'));
const ClientMeetings = lazy(() => import('./pages/client/ClientMeetings'));
const ClientMeetingDetail = lazy(() => import('./pages/client/ClientMeetingDetail'));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

// Configure React Query with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000, // 30 seconds
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
      refetchIntervalInBackground: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AdminAuthProvider>
          <PanelistAuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/submit-case" element={<CaseSubmission />} />

                  {/* Client Portal Routes */}
                  <Route
                    path="/client/dashboard"
                    element={
                      <ProtectedClientRoute>
                        <ClientDashboard />
                      </ProtectedClientRoute>
                    }
                  />
                  <Route
                    path="/client/cases/:caseId"
                    element={
                      <ProtectedClientRoute>
                        <ClientCaseDetail />
                      </ProtectedClientRoute>
                    }
                  />
                  <Route
                    path="/client/meetings"
                    element={
                      <ProtectedClientRoute>
                        <ClientMeetings />
                      </ProtectedClientRoute>
                    }
                  />
                  <Route
                    path="/client/meetings/:meetingId"
                    element={
                      <ProtectedClientRoute>
                        <ClientMeetingDetail />
                      </ProtectedClientRoute>
                    }
                  />

                  {/* Admin Routes */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route
                    path="/admin/dashboard"
                    element={
                      <ProtectedAdminRoute>
                        <AdminDashboard />
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/admin/cases/:id"
                    element={
                      <ProtectedAdminRoute>
                        <AdminCaseDetail />
                      </ProtectedAdminRoute>
                    }
                  />

                  {/* Admin Panelist Management Routes */}
                  <Route
                    path="/admin/panelists"
                    element={
                      <ProtectedAdminRoute>
                        <PanelistList />
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/admin/panelists/new"
                    element={
                      <ProtectedAdminRoute>
                        <PanelistForm />
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/admin/panelists/:id"
                    element={
                      <ProtectedAdminRoute>
                        <PanelistDetail />
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/admin/panelists/:id/edit"
                    element={
                      <ProtectedAdminRoute>
                        <PanelistForm />
                      </ProtectedAdminRoute>
                    }
                  />

                  {/* Panelist Portal Routes */}
                  <Route path="/panelist/login" element={<PanelistLogin />} />
                  <Route
                    path="/panelist/dashboard"
                    element={
                      <ProtectedPanelistRoute>
                        <PanelistDashboard />
                      </ProtectedPanelistRoute>
                    }
                  />
                  <Route
                    path="/panelist/cases"
                    element={
                      <ProtectedPanelistRoute>
                        <PanelistCases />
                      </ProtectedPanelistRoute>
                    }
                  />
                  <Route
                    path="/panelist/cases/:caseId"
                    element={
                      <ProtectedPanelistRoute>
                        <PanelistCaseDetail />
                      </ProtectedPanelistRoute>
                    }
                  />
                  <Route
                    path="/panelist/meetings"
                    element={
                      <ProtectedPanelistRoute>
                        <PanelistMeetings />
                      </ProtectedPanelistRoute>
                    }
                  />
                  <Route
                    path="/panelist/messages"
                    element={
                      <ProtectedPanelistRoute>
                        <PanelistMessages />
                      </ProtectedPanelistRoute>
                    }
                  />
                  <Route
                    path="/panelist/profile"
                    element={
                      <ProtectedPanelistRoute>
                        <PanelistProfile />
                      </ProtectedPanelistRoute>
                    }
                  />

                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
                </Suspense>
              </BrowserRouter>
              <AuthModal />
            </TooltipProvider>
          </PanelistAuthProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
