import { useState } from 'react'
import { Link } from 'react-router-dom'
import apt29 from '../data/apt/apt29'
import apt33 from '../data/apt/apt33'
import apt41 from '../data/apt/apt41'
import lazarus from '../data/apt/lazarus'

const allAPTs = [apt29, apt33, apt41, lazarus]

const COUNTRIES = ['All', 'Russia', 'Iran', 'China', 'North Korea']

export default function APTLibrary() {
  const [countryFilter, setCountryFilter] = useState('All')

  const filtered = countryFilter === 'All'
    ? allAPTs
    : allAPTs.filter(apt => apt.origin === countryFilter)

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 font-mono">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-green-400 tracking-widest mb-2">APT LIBRARY</h2>
        <p className="text-gray-500 text-sm">Select a threat actor to explore their campaigns and techniques</p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <span className="text-xs text-gray-600 uppercase tracking-widest mr-2">Origin:</span>
        {COUNTRIES.map(country => (
          <button
            key={country}
            onClick={() => setCountryFilter(country)}
            className={`px-3 py-1.5 text-xs rounded border transition-colors ${
              countryFilter === country
                ? 'border-green-400 bg-green-950 text-green-300'
                : 'border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'
            }`}
          >
            {country}
          </button>
        ))}
        {filtered.length !== allAPTs.length && (
          <span className="text-xs text-gray-600 ml-2">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-gray-600 text-sm py-12 text-center">
          No APT groups found for origin: <span className="text-gray-400">{countryFilter}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(apt => (
            <div key={apt.id} className="border border-gray-800 bg-gray-900 rounded-lg p-6 hover:border-green-400 transition-colors group">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-bold text-green-400 group-hover:text-green-300">{apt.name}</h3>
                <span className="text-xs text-gray-500 border border-gray-700 px-2 py-1 rounded">{apt.origin}</span>
              </div>
              <p className="text-xs text-yellow-500 mb-3">{apt.aliases.join(' · ')}</p>
              <p className="text-gray-400 text-sm mb-4 leading-relaxed">{apt.description.slice(0, 120)}...</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">{apt.campaigns.length} campaign{apt.campaigns.length !== 1 ? 's' : ''}</span>
                <span className="text-xs text-red-400 border border-red-900 px-2 py-1 rounded">{apt.motivation}</span>
              </div>
              <div className="mt-4 space-y-2">
                {apt.campaigns.map(campaign => (
                  <Link
                    key={campaign.id}
                    to={`/apt/${apt.id}/${campaign.id}`}
                    className="block w-full text-left text-xs text-gray-400 border border-gray-700 hover:border-green-400 hover:text-green-400 px-3 py-2 rounded transition-colors"
                  >
                    → {campaign.name} ({campaign.year})
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
