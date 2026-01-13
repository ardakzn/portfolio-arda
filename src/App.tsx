import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ProjectDetail from './pages/ProjectDetail';
import Projects from './pages/Projects';
import { isAdminEnabled } from './lib/admin';
import { SiteRuntimeProvider } from './lib/siteRuntime';

function App() {
  const AdminPage = isAdminEnabled() ? lazy(() => import('./pages/Admin')) : null;

  return (
    <SiteRuntimeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/project/:slug" element={<ProjectDetail />} />
          {AdminPage && (
            <Route
              path="/__admin"
              element={
                <Suspense
                  fallback={<div className="min-h-screen flex items-center justify-center text-slate-200 bg-[#060b16]">Loading admin…</div>}
                >
                  <AdminPage />
                </Suspense>
              }
            />
          )}
        </Routes>
      </BrowserRouter>
    </SiteRuntimeProvider>
  );
}

export default App;

