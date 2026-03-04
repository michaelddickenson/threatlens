import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import APTLibrary from './pages/APTLibrary'
import Campaign from './pages/Campaign'
import Search from './pages/Search'
import Navbar from './components/Navbar'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/apt" element={<APTLibrary />} />
        <Route path="/apt/:aptId/:campaignId" element={<Campaign />} />
        <Route path="/search" element={<Search />} />
      </Routes>
    </div>
  )
}