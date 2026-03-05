import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import apt29 from '../data/apt/apt29'
import apt33 from '../data/apt/apt33'
import apt41 from '../data/apt/apt41'
import lazarus from '../data/apt/lazarus'

const allAPTs = [apt29, apt33, apt41, lazarus]

const COUNTRIES = ['All', 'Russia', 'Iran', 'China', 'North Korea']

export default function APTLibrary() {
  const [countryFilter, setCountryFilter] = useState('All')
  const [selected, setSelected] = useState([])  // array of up to 2 apt IDs
  const navigate = useNavigate()

  const filtered = countryFilter === 'All'
    ? allAPTs
    : allAPTs.filter(apt => apt.origin === countryFilter)

  function toggleCompare(aptId) {
    setSelected(prev => {
      if (prev.includes(aptId)) return prev.filter(id => id !== aptId)
      if (prev.length >= 2) return prev
      return [...prev, aptId]
    })
  }

  function launchCompare() {
    if (selected.length === 2) {
      navigate(`/compare/${selected[0]}/${selected[1]}`)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 font-mono">

      {/* Compare banner — shown when 1 or 2 selected */}
      {selected.length > 0 && (
        <div className="mb-6 border border-purple-800 bg-purple-950/30 rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-purple-400 font-bold uppercase tracking-widest text-xs">Compare Mode</span>
            <span className="text-gray-600">·</span>
            <div className="flex gap-2">
              {selected.map(id => {
                const apt = allAPTs.find(a => a.id === id)
                return (
                  <span key={id} className="flex items-center gap-1.5 text-xs bg-purple-900/40 border border-purple-700 text-purple-300 px-2.5 py-1 rounded">
                    {apt?.name}
                    <button
                      onClick={() => toggleCompare(id)}
                      className="text-purple-600 hover:text-purple-300 transition-colors ml-0.5 leading-none"
                      aria-label={`Remove ${apt?.name}`}
                    >
                      ✕
                    </button>
                  </span>
                )
              })}
              {selected.length === 1 && (
                <span className="text-xs text-gray-600 italic self-center">select one more…</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelected([])}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              Clear
            </button>
            {selected.length === 2 && (
              <button
                onClick={launchCompare}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded tracking-widest transition-colors"
              >
                → COMPARE SELECTED
              </button>
            )}
          </div>
        </div>
      )}

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
          {filtered.map(apt => {
            const isSelected = selected.includes(apt.id)
            const isDisabled = !isSelected && selected.length >= 2

            return (
              <div
                key={apt.id}
                className={`border bg-gray-900 rounded-lg p-6 transition-colors group ${
                  isSelected
                    ? 'border-purple-500 ring-1 ring-purple-500/30'
                    : isDisabled
                    ? 'border-gray-800 opacity-50'
                    : 'border-gray-800 hover:border-green-400'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className={`text-xl font-bold ${isSelected ? 'text-purple-300' : 'text-green-400 group-hover:text-green-300'}`}>
                    {apt.name}
                  </h3>
                  <span className="text-xs text-gray-500 border border-gray-700 px-2 py-1 rounded">{apt.origin}</span>
                </div>
                <p className="text-xs text-yellow-500 mb-3">{apt.aliases.join(' · ')}</p>
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">{apt.description.slice(0, 120)}...</p>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-600">{apt.campaigns.length} campaign{apt.campaigns.length !== 1 ? 's' : ''}</span>
                  <span className="text-xs text-red-400 border border-red-900 px-2 py-1 rounded">{apt.motivation}</span>
                </div>

                {/* Campaign links */}
                <div className="space-y-2 mb-3">
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

                {/* Compare button */}
                <button
                  onClick={() => !isDisabled && toggleCompare(apt.id)}
                  disabled={isDisabled}
                  className={`w-full text-xs py-2 rounded border transition-colors ${
                    isSelected
                      ? 'border-purple-500 bg-purple-950/60 text-purple-300 hover:bg-purple-900/60'
                      : isDisabled
                      ? 'border-gray-800 text-gray-700 cursor-not-allowed'
                      : 'border-purple-800 text-purple-500 hover:border-purple-500 hover:bg-purple-950/30 hover:text-purple-300'
                  }`}
                >
                  {isSelected ? '✓ Selected for Compare' : '⊕ Compare'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
