import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from './components/ui/LoginPage'
import { AuthenticatedLayout } from './components/layout/AuthenticatedLayout'
import { CatalogUI } from './components/ui/CatalogUI'
import { LiveUI } from './components/ui/LiveUI'
import { SeriesUI } from './components/ui/SeriesUI'
import { VideoPlayer } from './components/ui/VideoPlayer'
import { SpatialNavProvider } from './components/layout/SpatialNavProvider'
import { AppInitializer } from './components/layout/AppInitializer'
import './index.css'

function App() {
  return (
    <HashRouter>
      <AppInitializer>
        <SpatialNavProvider>
          <Routes>
            {/* Ruta Pública */}
            <Route path="/" element={<LoginPage />} />

            {/* Rutas Privadas Protegidas */}
            <Route path="/catalog" element={
              <AuthenticatedLayout>
                <CatalogUI />
              </AuthenticatedLayout>
            } />
            <Route path="/live" element={
              <AuthenticatedLayout>
                <LiveUI />
              </AuthenticatedLayout>
            } />
            <Route path="/series" element={
              <AuthenticatedLayout>
                <SeriesUI />
              </AuthenticatedLayout>
            } />
            <Route path="/player" element={
              <AuthenticatedLayout>
                <VideoPlayer />
              </AuthenticatedLayout>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SpatialNavProvider>
      </AppInitializer>
    </HashRouter>
  )
}

export default App
