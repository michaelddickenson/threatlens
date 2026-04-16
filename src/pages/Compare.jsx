import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import apt29 from '../data/apt/apt29'
import apt33 from '../data/apt/apt33'
import apt41 from '../data/apt/apt41'
import lazarus from '../data/apt/lazarus'
import sandworm from '../data/apt/sandworm'
import volttyphoon from '../data/apt/volttyphoon'
import scatteredspider from '../data/apt/scatteredspider'

const allAPTs = { apt29, apt33, apt41, lazarus, sandworm, volttyphoon, scatteredspider }

const MITRE_TACTICS = [
  'Reconnaissance', 'Resource Development', 'Initial Access', 'Execution',
  'Persistence', 'Privilege Escalation', 'Defense Evasion', 'Credential Access',
  'Discovery', 'Lateral Movement', 'Collection', 'Command & Control',
  'Exfiltration', 'Impact',
]


function getAllStages(apt) {
  return apt.campaigns.flatMap(c => c.stages)
}

function getTTPMap(apt) {
  const map = new Map()
  for (const campaign of apt.campaigns) {
    for (const stage of campaign.stages) {
      if (!map.has(stage.ttp)) {
        map.set(stage.ttp, { ttp: stage.ttp, ttpName: stage.ttpName, phase: stage.phase })
      }
    }
  }
  return map
}

function getTopPhases(apt, n = 3) {
  const counts = {}
  for (const stage of getAllStages(apt)) {
    counts[stage.phase] = (counts[stage.phase] || 0) + 1
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([phase, count]) => ({ phase, count }))
}

const ORIGIN_COLORS = {
  'Russia':      'border-red-800 text-red-400',
  'China':       'border-yellow-800 text-yellow-400',
  'Iran':        'border-orange-800 text-orange-400',
  'North Korea': 'border-blue-800 text-blue-400',
  'Western':     'border-pink-800 text-pink-400',
}

export default function Compare() {
  const { aptId1, aptId2 } = useParams()
  const apt1 = aptId1 ? allAPTs[aptId1] : null
  const apt2 = aptId2 ? allAPTs[aptId2] : null
  const [copied, setCopied] = useState(false)

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (!apt1 || !apt2) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 font-mono text-center">
        <p className="text-xs text-gray-600 uppercase tracking-widest mb-4">// compare mode</p>
        <h2 className="text-3xl font-bold text-purple-400 tracking-widest mb-4">THREAT ACTOR COMPARISON</h2>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          Select two APT groups from the library to compare their kill chain coverage,
          techniques, targets, and infrastructure side by side.
        </p>
        <Link
          to="/apt"
          className="inline-block px-6 py-3 border border-purple-600 text-purple-400 hover:bg-purple-950 hover:text-purple-300 transition-colors text-sm tracking-widest"
        >
          → SELECT APTs FROM LIBRARY
        </Link>
        <p className="text-xs text-gray-700 mt-6">
          Tip: click the <span className="text-purple-500">Compare</span> button on two APT cards, then hit "Compare Selected"
        </p>
      </div>
    )
  }

  const stages1 = getAllStages(apt1)
  const stages2 = getAllStages(apt2)
  const tactics1 = new Set(stages1.map(s => s.phase))
  const tactics2 = new Set(stages2.map(s => s.phase))

  const ttpMap1 = getTTPMap(apt1)
  const ttpMap2 = getTTPMap(apt2)
  const allTTPIds = [...new Set([...ttpMap1.keys(), ...ttpMap2.keys()])]
  const sharedTTPs  = allTTPIds.filter(id => ttpMap1.has(id) && ttpMap2.has(id))
  const only1TTPs   = allTTPIds.filter(id => ttpMap1.has(id) && !ttpMap2.has(id))
  const only2TTPs   = allTTPIds.filter(id => !ttpMap1.has(id) && ttpMap2.has(id))

  // Ordered TTP rows: shared first, then APT1-only, then APT2-only
  const ttpRows = [
    ...sharedTTPs.map(id => ({ id, in1: true, in2: true, data: ttpMap1.get(id) })),
    ...only1TTPs.map(id => ({ id, in1: true, in2: false, data: ttpMap1.get(id) })),
    ...only2TTPs.map(id => ({ id, in1: false, in2: true, data: ttpMap2.get(id) })),
  ]

  // Diamond model: first campaign each
  const dm1 = apt1.campaigns[0]?.diamondModel
  const dm2 = apt2.campaigns[0]?.diamondModel

  const topPhases1 = getTopPhases(apt1)
  const topPhases2 = getTopPhases(apt2)

  const unionTactics = new Set([...tactics1, ...tactics2])

  const originColor1 = ORIGIN_COLORS[apt1.origin] ?? 'border-gray-700 text-gray-400'
  const originColor2 = ORIGIN_COLORS[apt2.origin] ?? 'border-gray-700 text-gray-400'

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8 font-mono">

      {/* Breadcrumb + Share */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs text-gray-600">
          <Link to="/apt" className="hover:text-green-400 transition-colors">APT LIBRARY</Link>
          <span className="mx-2">›</span>
          <span className="text-purple-400">COMPARE</span>
          <span className="mx-2">›</span>
          <span className="text-gray-400">{apt1.name} vs {apt2.name}</span>
        </div>
        <button
          onClick={handleShare}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded border transition-colors font-mono ${
            copied
              ? 'border-green-600 bg-green-950/40 text-green-400'
              : 'border-gray-700 text-gray-500 hover:border-purple-600 hover:text-purple-400'
          }`}
        >
          {copied ? '✓ Link Copied!' : '⎘ Share Comparison'}
        </button>
      </div>

      {/* ── Header ── */}
      <div className="border border-gray-800 bg-gray-900 rounded-lg px-5 py-5 mb-4">
        <p className="text-xs text-gray-600 uppercase tracking-widest mb-4">// threat actor comparison</p>
        <div className="flex flex-wrap items-center gap-4">

          {/* APT 1 block */}
          <div className="flex-1 min-w-[180px]">
            <div className="text-2xl font-bold text-green-400 mb-2">{apt1.name}</div>
            <div className="flex flex-wrap gap-2 text-xs mb-1">
              <span className={`border px-2 py-0.5 rounded ${originColor1}`}>{apt1.origin}</span>
              <span className="border border-red-900 text-red-400 px-2 py-0.5 rounded">{apt1.motivation}</span>
            </div>
            <p className="text-xs text-yellow-500">{apt1.aliases.slice(0, 3).join(' · ')}</p>
          </div>

          {/* VS */}
          <div className="shrink-0 text-center px-4">
            <div className="text-2xl font-bold text-purple-500 tracking-widest">VS</div>
            <div className="text-xs text-gray-700 mt-1">{sharedTTPs.length} shared TTPs</div>
          </div>

          {/* APT 2 block */}
          <div className="flex-1 min-w-[180px] text-right">
            <div className="text-2xl font-bold text-blue-400 mb-2">{apt2.name}</div>
            <div className="flex flex-wrap gap-2 text-xs mb-1 justify-end">
              <span className="border border-red-900 text-red-400 px-2 py-0.5 rounded">{apt2.motivation}</span>
              <span className={`border px-2 py-0.5 rounded ${originColor2}`}>{apt2.origin}</span>
            </div>
            <p className="text-xs text-yellow-500">{apt2.aliases.slice(0, 3).join(' · ')}</p>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="mt-4 pt-4 border-t border-gray-800 grid grid-cols-2 gap-4 text-xs text-gray-500">
          <div className="flex gap-6">
            <span><span className="text-green-400 font-bold">{apt1.campaigns.length}</span> campaigns</span>
            <span><span className="text-green-400 font-bold">{stages1.length}</span> techniques</span>
            <span><span className="text-green-400 font-bold">{tactics1.size}</span> tactics</span>
          </div>
          <div className="flex gap-6 justify-end">
            <span><span className="text-blue-400 font-bold">{tactics2.size}</span> tactics</span>
            <span><span className="text-blue-400 font-bold">{stages2.length}</span> techniques</span>
            <span><span className="text-blue-400 font-bold">{apt2.campaigns.length}</span> campaigns</span>
          </div>
        </div>
      </div>

      {/* ── Kill Chain Heatmap ── */}
      <div className="border border-gray-800 rounded-lg overflow-hidden mb-4">
        <div className="px-4 py-2 border-b border-gray-800 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-gray-600 uppercase tracking-widest">Kill Chain Coverage — All 14 MITRE Tactics</p>
          <div className="flex flex-wrap gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-green-500 opacity-80" />
              <span className="text-gray-500">{apt1.name} only</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 opacity-80" />
              <span className="text-gray-500">{apt2.name} only</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-yellow-500 opacity-80" />
              <span className="text-gray-500">Both</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-gray-800" />
              <span className="text-gray-500">Neither</span>
            </span>
          </div>
        </div>

        <div className="flex overflow-x-auto">
          {MITRE_TACTICS.map((tactic, idx) => {
            const in1 = tactics1.has(tactic)
            const in2 = tactics2.has(tactic)
            const c1 = stages1.filter(s => s.phase === tactic).length
            const c2 = stages2.filter(s => s.phase === tactic).length

            let stripe, bg, numColor, labelColor
            if (in1 && in2) {
              stripe = 'bg-yellow-500'; bg = 'bg-yellow-900/10'
              numColor = 'text-yellow-400'; labelColor = 'text-yellow-300'
            } else if (in1) {
              stripe = 'bg-green-500'; bg = 'bg-green-900/10'
              numColor = 'text-green-400'; labelColor = 'text-green-300'
            } else if (in2) {
              stripe = 'bg-blue-500'; bg = 'bg-blue-900/10'
              numColor = 'text-blue-400'; labelColor = 'text-blue-300'
            } else {
              stripe = 'bg-gray-800'; bg = ''
              numColor = 'text-gray-700'; labelColor = 'text-gray-700'
            }

            return (
              <div
                key={tactic}
                className={`relative flex-1 min-w-[80px] flex flex-col items-center px-2 pt-4 pb-3 text-center ${
                  idx < MITRE_TACTICS.length - 1 ? 'border-r border-gray-800' : ''
                } ${bg}`}
              >
                <div className={`absolute top-0 inset-x-0 h-[3px] ${stripe}`} />
                <div className={`text-[11px] font-bold mb-2 leading-none ${numColor}`}>
                  {in1 || in2
                    ? <span>{in1 ? c1 : '—'}<span className="opacity-30 mx-px">/</span>{in2 ? c2 : '—'}</span>
                    : <span>—</span>
                  }
                </div>
                <div className={`text-xs leading-tight ${labelColor}`}>
                  {tactic}
                </div>
              </div>
            )
          })}
        </div>

        <div className="px-4 py-1.5 border-t border-gray-800 flex items-center justify-between text-[10px] text-gray-700">
          <span>counts shown as {apt1.name} / {apt2.name} per tactic</span>
          <span>{unionTactics.size} of 14 tactics covered between both actors · {sharedTTPs.length} shared TTPs</span>
        </div>
      </div>

      {/* ── Campaigns side by side ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {[{ apt: apt1, color: 'green', border: 'border-green-900', label: 'text-green-400', dim: 'text-green-600' },
          { apt: apt2, color: 'blue',  border: 'border-blue-900',  label: 'text-blue-400',  dim: 'text-blue-600'  }
        ].map(({ apt, border, label, dim }) => (
          <div key={apt.id} className={`border ${border} bg-gray-900 rounded-lg p-4`}>
            <p className={`text-xs ${label} uppercase tracking-widest mb-3`}>// {apt.name} — campaigns</p>
            <div className="space-y-2">
              {apt.campaigns.map(c => (
                <Link
                  key={c.id}
                  to={`/apt/${apt.id}/${c.id}`}
                  className={`block border border-gray-800 hover:${border} rounded p-3 transition-colors group`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold text-white group-hover:${label} transition-colors leading-snug`}>{c.name}</span>
                    <span className={`text-xs ${dim} shrink-0 ml-2`}>{c.year}</span>
                  </div>
                  <div className="text-xs text-gray-600 mb-1">{c.target}</div>
                  <div className="flex flex-wrap gap-1">
                    {c.stages.map(s => (
                      <span key={s.id} className="text-[9px] text-gray-700 border border-gray-800 px-1.5 py-0.5 rounded font-mono">{s.ttp}</span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Diamond Model Summary ── */}
      <div className="border border-gray-800 bg-gray-900 rounded-lg p-5 mb-4">
        <p className="text-xs text-gray-600 uppercase tracking-widest mb-4">// diamond intrusion model — summary comparison</p>

        {[{ apt: apt1, dm: dm1, label: 'text-green-400', tagBg: 'bg-green-950/50 border-green-900/60 text-green-300' },
          { apt: apt2, dm: dm2, label: 'text-blue-400',  tagBg: 'bg-blue-950/50 border-blue-900/60 text-blue-300'  }
        ].map(({ apt, dm, label, tagBg }) => (
          <div key={apt.id} className="mb-4 last:mb-0">
            <div className={`text-xs font-bold ${label} mb-2`}>{apt.name} — {apt.campaigns[0]?.name}</div>
            {dm ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">

                {/* Adversary */}
                <div className="border border-red-900/50 rounded p-3">
                  <div className="text-[10px] text-red-400 uppercase tracking-widest mb-1.5">◆ Adversary</div>
                  <div className="text-xs text-white font-bold mb-1 leading-snug">{dm.adversary.name}</div>
                  <div className="text-[10px] text-gray-500 leading-relaxed">{dm.adversary.sponsor}</div>
                </div>

                {/* Capability */}
                <div className="border border-orange-900/50 rounded p-3">
                  <div className="text-[10px] text-orange-400 uppercase tracking-widest mb-1.5">◆ Capability</div>
                  <div className="flex flex-wrap gap-1 mb-1">
                    {dm.capability.malware.slice(0, 3).map(m => (
                      <span key={m} className={`text-[10px] border px-1.5 py-0.5 rounded ${tagBg}`}>{m}</span>
                    ))}
                  </div>
                  <div className="text-[10px] text-gray-600 leading-tight line-clamp-2">{dm.capability.sophistication}</div>
                </div>

                {/* Infrastructure */}
                <div className="border border-yellow-900/50 rounded p-3">
                  <div className="text-[10px] text-yellow-400 uppercase tracking-widest mb-1.5">◆ Infrastructure</div>
                  <div className="space-y-0.5 mb-1">
                    {dm.infrastructure.domains.slice(0, 2).map(d => (
                      <div key={d} className="text-[10px] text-green-300 font-mono truncate">{d}</div>
                    ))}
                  </div>
                  <div className="text-[10px] text-gray-600 leading-tight line-clamp-2">{dm.infrastructure.hosting}</div>
                </div>

                {/* Victim */}
                <div className="border border-blue-900/50 rounded p-3">
                  <div className="text-[10px] text-blue-400 uppercase tracking-widest mb-1.5">◆ Victim</div>
                  <div className="text-[10px] text-gray-300 leading-relaxed line-clamp-2 mb-1">{dm.victim.sectors}</div>
                  <div className="text-[10px] text-gray-600 leading-tight">{dm.victim.geography}</div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-700">No diamond model data available.</p>
            )}
          </div>
        ))}
      </div>

      {/* ── Key Differences ── */}
      <div className="border border-purple-900/50 bg-gray-900 rounded-lg p-5 mb-4">
        <p className="text-xs text-purple-400 uppercase tracking-widest mb-4">// auto-generated key differences</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {[{ apt: apt1, top: topPhases1, dm: dm1, accent: 'text-green-400', dimAccent: 'text-green-700', tagCls: 'bg-green-950/40 border-green-900/60 text-green-300' },
            { apt: apt2, top: topPhases2, dm: dm2, accent: 'text-blue-400',  dimAccent: 'text-blue-700',  tagCls: 'bg-blue-950/40 border-blue-900/60 text-blue-300' }
          ].map(({ apt, top, dm, accent, dimAccent, tagCls }) => (
            <div key={apt.id}>
              <div className={`text-sm font-bold ${accent} mb-3`}>{apt.name}</div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-gray-600 uppercase tracking-wider text-[10px] mb-1">Favored Phases</div>
                  <div className="flex flex-wrap gap-1.5">
                    {top.map(({ phase, count }) => (
                      <span key={phase} className={`border px-2 py-0.5 rounded ${tagCls}`}>
                        {phase} <span className={`${dimAccent} ml-1`}>×{count}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {dm && (
                  <>
                    <div>
                      <div className="text-gray-600 uppercase tracking-wider text-[10px] mb-1">Target Sectors</div>
                      <p className="text-gray-400 leading-relaxed line-clamp-3">{dm.victim.sectors}</p>
                    </div>
                    <div>
                      <div className="text-gray-600 uppercase tracking-wider text-[10px] mb-1">Infrastructure Style</div>
                      <p className="text-gray-400 leading-relaxed line-clamp-2">{dm.infrastructure.hosting}</p>
                    </div>
                    <div>
                      <div className="text-gray-600 uppercase tracking-wider text-[10px] mb-1">Primary Tools</div>
                      <div className="flex flex-wrap gap-1.5">
                        {dm.capability.malware.slice(0, 4).map(m => (
                          <span key={m} className={`border px-2 py-0.5 rounded text-[10px] ${tagCls}`}>{m}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600 uppercase tracking-wider text-[10px] mb-1">Geography</div>
                      <p className="text-gray-400 leading-relaxed line-clamp-2">{dm.victim.geography}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TTP Overlap Table ── */}
      <div className="border border-gray-800 bg-gray-900 rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-widest mb-1">// technique overlap analysis</p>
            <h3 className="text-sm font-bold text-white tracking-widest">TTP COMPARISON TABLE</h3>
          </div>
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-yellow-400">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              {sharedTTPs.length} shared
            </span>
            <span className="flex items-center gap-1.5 text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              {only1TTPs.length} {apt1.name} only
            </span>
            <span className="flex items-center gap-1.5 text-blue-400">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {only2TTPs.length} {apt2.name} only
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="pb-2 pr-3 text-left text-gray-600 font-normal uppercase tracking-wider">TTP</th>
                <th className="pb-2 pr-3 text-left text-gray-600 font-normal uppercase tracking-wider">Name</th>
                <th className="pb-2 pr-4 text-left text-gray-600 font-normal uppercase tracking-wider">Phase</th>
                <th className="pb-2 pr-3 text-center text-green-600 font-normal uppercase tracking-wider">{apt1.name}</th>
                <th className="pb-2 text-center text-blue-600 font-normal uppercase tracking-wider">{apt2.name}</th>
              </tr>
            </thead>
            <tbody>
              {ttpRows.map(({ id, in1, in2, data }) => {
                const isShared = in1 && in2
                return (
                  <tr
                    key={id}
                    className={`border-b border-gray-800/40 transition-colors ${
                      isShared
                        ? 'bg-yellow-950/10 hover:bg-yellow-950/20'
                        : 'hover:bg-gray-800/20'
                    }`}
                  >
                    <td className="py-2.5 pr-3 whitespace-nowrap">
                      <a
                        href={`https://attack.mitre.org/techniques/${id.replace('.', '/')}`}
                        target="_blank"
                        rel="noreferrer"
                        className={`font-mono font-bold hover:underline ${
                          isShared ? 'text-yellow-400' : in1 ? 'text-green-400' : 'text-blue-400'
                        }`}
                      >
                        {id}
                      </a>
                    </td>
                    <td className="py-2.5 pr-3 text-gray-300">{data.ttpName}</td>
                    <td className="py-2.5 pr-4 text-gray-600">{data.phase}</td>
                    <td className="py-2.5 pr-3 text-center">
                      {in1 ? <span className="text-green-400 font-bold">✓</span> : <span className="text-gray-800">—</span>}
                    </td>
                    <td className="py-2.5 text-center">
                      {in2 ? <span className="text-blue-400 font-bold">✓</span> : <span className="text-gray-800">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
