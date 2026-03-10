import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'

const Library = lazy(() => import('./pages/Library'))
const MediaPlayer = lazy(() => import('./pages/MediaPlayer'))
const Actors = lazy(() => import('./pages/Actors'))
const ActorDetail = lazy(() => import('./pages/ActorDetail'))
const Queue = lazy(() => import('./pages/Queue'))
const Settings = lazy(() => import('./pages/Settings'))
const SeriesDetail = lazy(() => import('./pages/SeriesDetail'))
const AnimeDetail = lazy(() => import('./pages/AnimeDetail'))
const DocumentaryDetail = lazy(() => import('./pages/DocumentaryDetail'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function App() {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/library" element={<Library />} />
          <Route path="/media/:id" element={<MediaPlayer />} />
          <Route path="/series/:tmdbId" element={<SeriesDetail />} />
          <Route path="/anime/:tmdbId" element={<AnimeDetail />} />
          <Route path="/documentary/:tmdbId" element={<DocumentaryDetail />} />
          <Route path="/actors" element={<Actors />} />
          <Route path="/actors/:id" element={<ActorDetail />} />
          <Route path="/queue" element={<Queue />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}

export default App
