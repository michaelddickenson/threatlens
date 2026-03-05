import { useState } from 'react'
import { Link } from 'react-router-dom'
import apt29 from '../data/apt/apt29'
import apt33 from '../data/apt/apt33'
import apt41 from '../data/apt/apt41'
import lazarus from '../data/apt/lazarus'

const allAPTs = [apt29, apt33, apt41, lazarus]

// Build flat searchable index at module level (runs once)
const INDEX = []
for (const apt of allAPTs) {
  INDEX.push({
    type: 'apt',
    aptId: apt.id,
    text: [apt.name, ...apt.aliases, apt.origin, apt.motivation, apt.description].join(' ').toLowerCase(),
    apt,
  })
  for (const campaign of apt.campaigns) {
    INDEX.push({
      type: 'campaign',
      aptId: apt.id,
      campaignId: campaign.id,
      text: [campaign.name, campaign.summary, campaign.target, campaign.year].join(' ').toLowerCase(),
      campaign,
      apt,
    })
    for (const stage of campaign.stages) {
      INDEX.push({
        type: 'technique',
        aptId: apt.id,
        campaignId: campaign.id,
        text: [stage.name, stage.ttp, stage.ttpName, stage.phase, stage.attacker.summary].join(' ').toLowerCase(),
        stage,
        campaign,
        apt,
      })
    }
  }
}

const SUGGESTIONS = ['APT29', 'Lazarus', 'supply chain', 'T1055', 'SUNBURST', 'crypto', 'FALLCHILL', 'Golden SAML']

export default function Search() {
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const results = q.length >= 2 ? INDEX.filter(item => item.text.includes(q)) : []

  const aptResults = results.filter(r => r.type === 'apt')
  const campaignResults = results.filter(r => r.type === 'campaign')
  const techniqueResults = results.filter(r => r.type === 'technique')

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 font-mono">

      <div className="mb-8">
        <p className="text-xs text-gray-600 uppercase tracking-widest mb-2">// search</p>
        <h2 className="text-2xl font-bold text-green-400 tracking-widest mb-6">THREAT SEARCH</h2>

        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500 text-sm select-none">$</span>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="search APTs, campaigns, TTPs, techniques..."
            autoFocus
            className="w-full bg-gray-900 border border-gray-700 focus:border-green-400 rounded px-10 py-3 text-sm text-gray-300 placeholder-gray-600 outline-none transition-colors font-mono"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Empty state with suggestions */}
      {q.length === 0 && (
        <div>
          <p className="text-xs text-gray-600 mb-4">Try searching for:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map(term => (
              <button
                key={term}
                onClick={() => setQuery(term)}
                className="text-xs border border-gray-800 text-gray-500 px-3 py-1.5 rounded hover:border-green-400 hover:text-green-400 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Min length hint */}
      {q.length > 0 && q.length < 2 && (
        <p className="text-xs text-gray-600">Type at least 2 characters...</p>
      )}

      {/* No results */}
      {q.length >= 2 && results.length === 0 && (
        <p className="text-gray-600 text-sm">
          No results for <span className="text-gray-400">"{query}"</span>
        </p>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-10">
          <p className="text-xs text-gray-600">
            {results.length} result{results.length !== 1 ? 's' : ''} for <span className="text-gray-400">"{query}"</span>
          </p>

          {/* APT Groups */}
          {aptResults.length > 0 && (
            <section>
              <p className="text-xs text-green-400 uppercase tracking-widest mb-3">
                APT Groups <span className="text-gray-600 ml-1">({aptResults.length})</span>
              </p>
              <div className="space-y-2">
                {aptResults.map((r, i) => (
                  <Link
                    key={i}
                    to="/apt"
                    className="block border border-gray-800 hover:border-green-400 bg-gray-900 rounded-lg p-4 transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-green-400 group-hover:text-green-300">{r.apt.name}</span>
                      <span className="text-xs text-gray-600 border border-gray-700 px-2 py-0.5 rounded">{r.apt.origin}</span>
                    </div>
                    <p className="text-xs text-yellow-500 mb-1">{r.apt.aliases.join(' · ')}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{r.apt.description.slice(0, 120)}...</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Campaigns */}
          {campaignResults.length > 0 && (
            <section>
              <p className="text-xs text-yellow-400 uppercase tracking-widest mb-3">
                Campaigns <span className="text-gray-600 ml-1">({campaignResults.length})</span>
              </p>
              <div className="space-y-2">
                {campaignResults.map((r, i) => (
                  <Link
                    key={i}
                    to={`/apt/${r.aptId}/${r.campaignId}`}
                    className="block border border-gray-800 hover:border-yellow-400 bg-gray-900 rounded-lg p-4 transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white group-hover:text-yellow-300">{r.campaign.name}</span>
                      <span className="text-xs text-green-400">{r.apt.name} · {r.campaign.year}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">{r.campaign.target}</p>
                    <p className="text-xs text-gray-600 leading-relaxed">{r.campaign.summary.slice(0, 110)}...</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Techniques */}
          {techniqueResults.length > 0 && (
            <section>
              <p className="text-xs text-orange-400 uppercase tracking-widest mb-3">
                Techniques & TTPs <span className="text-gray-600 ml-1">({techniqueResults.length})</span>
              </p>
              <div className="space-y-2">
                {techniqueResults.map((r, i) => (
                  <Link
                    key={i}
                    to={`/apt/${r.aptId}/${r.campaignId}`}
                    className="block border border-gray-800 hover:border-orange-400 bg-gray-900 rounded-lg p-4 transition-colors group"
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs bg-gray-800 border border-yellow-700 text-yellow-400 px-2 py-0.5 rounded font-bold shrink-0">
                        {r.stage.ttp}
                      </span>
                      <span className="font-bold text-white text-sm group-hover:text-orange-300">{r.stage.name}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">
                      {r.stage.ttpName}
                      <span className="text-gray-700 mx-2">·</span>
                      <span className="text-gray-600">{r.stage.phase}</span>
                    </p>
                    <p className="text-xs text-gray-600">
                      <span className="text-green-400">{r.apt.name}</span>
                      <span className="mx-1">→</span>
                      {r.campaign.name}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
