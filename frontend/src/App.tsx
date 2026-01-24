import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Library from './pages/Library'
import MediaPlayer from './pages/MediaPlayer'
import Actors from './pages/Actors'
import ActorDetail from './pages/ActorDetail'
import Genres from './pages/Genres'
import Queue from './pages/Queue'
import Settings from './pages/Settings'
import SeriesDetail from './pages/SeriesDetail'
import AnimeDetail from './pages/AnimeDetail'
import DocumentaryDetail from './pages/DocumentaryDetail'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/library" element={<Library />} />
        <Route path="/media/:id" element={<MediaPlayer />} />
        <Route path="/series/:tmdbId" element={<SeriesDetail />} />
        <Route path="/anime/:tmdbId" element={<AnimeDetail />} />
        <Route path="/documentary/:tmdbId" element={<DocumentaryDetail />} />
        <Route path="/actors" element={<Actors />} />
        <Route path="/actors/:id" element={<ActorDetail />} />
        <Route path="/genres" element={<Genres />} />
        <Route path="/queue" element={<Queue />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  )
}

export default App
