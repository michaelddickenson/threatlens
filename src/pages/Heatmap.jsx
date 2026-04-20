import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ALL_APTS, getTacticCoverage, getAllCountries, MITRE_TACTICS_ORDER } from '../data/index'

const MITRE_TACTICS = MITRE_TACTICS_ORDER

const ORIGIN_COLORS = {
  'Russia':      'text-red-400',
  'China':       'text-yellow-400',
  'Iran':        'text-orange-400',
  'North Korea': 'text-blue-400',
  'Western':     'text-pink-400',
  'Vietnam':     'text-teal-400',
  'Pakistan':    'text-emerald-400',
  'India':       'text-amber-400',
}

const MOTIVATION_LABELS = ['All', 'Espionage', 'Financial', 'Destructive']

function cellBg(count) {
  if (!count) return 'bg-gray-900 text-gray-700'
  if (count === 1) return 'bg-green-950 text-green-600'
  if (count === 2) return 'bg-green-900 text-green-400'
  return 'bg-green-800 text-green-200'
}

export default function Heatmap() {
  const [countryFilter, setCountryFilter] = useState('All')
  const [motivFilter, setMotivFilter] = useState('All')
  const [tacticFilter, setTacticFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [popover, setPopover] = useState(null) // { aptId, tactic, ttps, rect }
  const popoverRef = useRef(null)

  const coverage = getTacticCoverage()
  const countries = ['All', ...getAllCountries()]

  const filteredTactics = tacticFilter === 'All'
    ? MITRE_TACTICS
    : MITRE_TACTICS.filter(t => t === tacticFilter)

  const filteredAPTs = ALL_APTS.filter(apt => {
    if (countryFilter !== 'All' && apt.origin !== countryFilter) return false
    if (motivFilter !== 'All' && apt.motivation !== motivFilter) return false
    if (search && !apt.name.toLowerCase().includes(search.toLowerCase()) &&
        !apt.aliases.some(a => a.toLowerCase().includes(search.toLowerCase()))) return false
    return true
  })

  function openPopover(e, apt, tactic) {
    const tacticData = coverage[tactic]
    const aptEntry = tacticData?.apts.find(a => a.aptId === apt.id)
    if (!aptEntry || !aptEntry.count) return
    const rect = e.currentTarget.getBoundingClientRect()
    setPopover({ aptId: apt.id, aptName: apt.name, tactic, ttps: aptEntry.ttps, rect })
  }

  function closePopover() {
    setPopover(null)
  }

  // Summary totals per tactic across filtered APTs
  const tacticTotals = {}
  for (const tactic of filteredTactics) {
    tacticTotals[tactic] = coverage[tactic]?.apts
      .filter(a => filteredAPTs.find(apt => apt.id === a.aptId))
      .reduce((sum, a) => sum + a.count, 0) ?? 0
  }

  return (
    <div className="font-mono min-h-screen bg-gray-950" onClick={closePopover}>
      <div className="max-w-full px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs text-gray-600 uppercase tracking-widest mb-1">// mitre att&amp;ck</p>
          <h2 className="text-3xl font-bold text-green-400 tracking-widest mb-2">TACTIC COVERAGE HEATMAP</h2>
          <p className="text-gray-500 text-sm">Technique count per actor per tactic. Click any cell to see specific TTPs.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-6 mb-8">
          {/* Country */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-600 uppercase tracking-widest">Origin:</span>
            {countries.map(c => (
              <button key={c} onClick={e => { e.stopPropagation(); setCountryFilter(c) }}
                className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                  countryFilter === c ? 'border-green-400 bg-green-950 text-green-300' : 'border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'
                }`}>{c}</button>
            ))}
          </div>
          {/* Motivation */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-600 uppercase tracking-widest">Motivation:</span>
            {MOTIVATION_LABELS.map(m => (
              <button key={m} onClick={e => { e.stopPropagation(); setMotivFilter(m) }}
                className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                  motivFilter === m ? 'border-green-400 bg-green-950 text-green-300' : 'border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'
                }`}>{m}</button>
            ))}
          </div>
          {/* Tactic */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-600 uppercase tracking-widest">Tactic:</span>
            <button onClick={e => { e.stopPropagation(); setTacticFilter('All') }}
              className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                tacticFilter === 'All' ? 'border-green-400 bg-green-950 text-green-300' : 'border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'
              }`}>All</button>
            {MITRE_TACTICS.map(t => (
              <button key={t} onClick={e => { e.stopPropagation(); setTacticFilter(t) }}
                className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                  tacticFilter === t ? 'border-green-400 bg-green-950 text-green-300' : 'border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'
                }`}>{t}</button>
            ))}
          </div>
          {/* Search */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 uppercase tracking-widest">Search:</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
              placeholder="APT name or alias…"
              className="bg-gray-900 border border-gray-700 text-gray-300 text-xs px-3 py-1.5 rounded placeholder-gray-600 focus:outline-none focus:border-green-600 w-48"
            />
          </div>
        </div>

        {/* Heatmap table */}
        <div className="overflow-x-auto">
          <table className="border-collapse min-w-max">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-gray-950 text-left text-xs text-gray-500 uppercase tracking-widest pr-4 pb-3 pl-1 min-w-[160px]">
                  Actor ({filteredAPTs.length})
                </th>
                {filteredTactics.map(tactic => (
                  <th key={tactic} className="text-center pb-3 px-1 min-w-[80px]">
                    <div className="text-xs text-gray-500 leading-tight" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: '100px', whiteSpace: 'nowrap' }}>
                      {tactic}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAPTs.length === 0 ? (
                <tr>
                  <td colSpan={filteredTactics.length + 1} className="text-center text-gray-600 text-sm py-12">
                    No actors match the current filters.
                  </td>
                </tr>
              ) : (
                filteredAPTs.map(apt => {
                  const isHighlighted = search && (
                    apt.name.toLowerCase().includes(search.toLowerCase()) ||
                    apt.aliases.some(a => a.toLowerCase().includes(search.toLowerCase()))
                  )
                  return (
                    <tr key={apt.id} className={`border-t border-gray-800/50 ${isHighlighted ? 'bg-green-950/20' : 'hover:bg-gray-900/50'}`}>
                      <td className="sticky left-0 z-10 bg-gray-950 pr-4 py-1.5 pl-1">
                        <Link
                          to={`/apt`}
                          onClick={e => e.stopPropagation()}
                          className={`text-xs font-bold hover:underline ${ORIGIN_COLORS[apt.origin] ?? 'text-gray-400'}`}
                        >
                          {apt.name}
                        </Link>
                        <div className="text-xs text-gray-700">{apt.origin}</div>
                      </td>
                      {filteredTactics.map(tactic => {
                        const tacticData = coverage[tactic]
                        const aptEntry = tacticData?.apts.find(a => a.aptId === apt.id)
                        const count = aptEntry?.count ?? 0
                        return (
                          <td key={tactic} className="px-1 py-1 text-center">
                            <button
                              onClick={e => { e.stopPropagation(); openPopover(e, apt, tactic) }}
                              className={`w-12 h-8 rounded text-xs font-bold transition-opacity ${cellBg(count)} ${count ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                              title={count ? `${apt.name} · ${tactic}: ${count} technique${count !== 1 ? 's' : ''}` : undefined}
                            >
                              {count || '·'}
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })
              )}
              {/* Summary row */}
              {filteredAPTs.length > 0 && (
                <tr className="border-t-2 border-gray-700">
                  <td className="sticky left-0 z-10 bg-gray-950 pr-4 py-2 pl-1 text-xs text-gray-400 uppercase tracking-widest font-bold">
                    Total
                  </td>
                  {filteredTactics.map(tactic => (
                    <td key={tactic} className="px-1 py-2 text-center">
                      <span className={`text-xs font-bold ${tacticTotals[tactic] ? 'text-green-400' : 'text-gray-700'}`}>
                        {tacticTotals[tactic] || '·'}
                      </span>
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center gap-6 text-xs text-gray-500">
          <span className="uppercase tracking-widest">Coverage:</span>
          <span className="flex items-center gap-1.5"><span className="w-5 h-4 rounded bg-gray-900 border border-gray-700 inline-block" /> None</span>
          <span className="flex items-center gap-1.5"><span className="w-5 h-4 rounded bg-green-950 inline-block" /> 1 technique</span>
          <span className="flex items-center gap-1.5"><span className="w-5 h-4 rounded bg-green-900 inline-block" /> 2 techniques</span>
          <span className="flex items-center gap-1.5"><span className="w-5 h-4 rounded bg-green-800 inline-block" /> 3+ techniques</span>
        </div>

      </div>

      {/* Popover */}
      {popover && (
        <div
          className="fixed z-50 bg-gray-900 border border-green-800 rounded-lg shadow-xl p-4 min-w-[260px] max-w-xs"
          style={{ top: Math.min(popover.rect.bottom + 8, window.innerHeight - 200), left: Math.min(popover.rect.left, window.innerWidth - 280) }}
          onClick={e => e.stopPropagation()}
          ref={popoverRef}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-widest">{popover.aptName}</div>
              <div className="text-sm font-bold text-green-400">{popover.tactic}</div>
            </div>
            <button onClick={closePopover} className="text-gray-600 hover:text-gray-300 text-lg leading-none ml-4">×</button>
          </div>
          <div className="space-y-2">
            {popover.ttps.map(t => (
              <div key={t.ttp} className="border border-gray-800 rounded p-2">
                <div className="flex items-center justify-between gap-2">
                  <a
                    href={`https://attack.mitre.org/techniques/${t.ttp.replace('.', '/')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-400 hover:underline font-mono"
                    onClick={e => e.stopPropagation()}
                  >
                    {t.ttp}
                  </a>
                  <Link
                    to={`/apt/${popover.aptId}/${t.campaignId}`}
                    onClick={closePopover}
                    className="text-xs text-gray-500 hover:text-gray-300"
                  >
                    → view
                  </Link>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{t.ttpName}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
