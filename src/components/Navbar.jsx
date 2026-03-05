import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="border-b border-gray-800 bg-gray-950 px-6 py-4 flex items-center justify-between">
      <Link to="/" className="text-green-400 font-mono font-bold text-xl tracking-widest">
        THREATLENS
      </Link>
      <div className="flex gap-6 text-sm font-mono">
        <Link to="/" className="text-gray-400 hover:text-green-400 transition-colors">HOME</Link>
        <Link to="/apt" className="text-gray-400 hover:text-green-400 transition-colors">APT LIBRARY</Link>
        <Link to="/compare" className="text-gray-400 hover:text-purple-400 transition-colors">COMPARE</Link>
        <Link to="/search" className="text-gray-400 hover:text-green-400 transition-colors">SEARCH</Link>
      </div>
    </nav>
  )
}