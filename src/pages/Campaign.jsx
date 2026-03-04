import { useParams, Link } from 'react-router-dom'
import { useState, useRef } from 'react'
import apt29 from '../data/apt/apt29'
import apt41 from '../data/apt/apt41'
import lazarus from '../data/apt/lazarus'

const allAPTs = { apt29, apt41, lazarus }

const PHASE_STYLES = {
  'Initial Access':       { idle: 'border-yellow-800 text-yellow-400 bg-yellow-950/30 hover:bg-yellow-900/40',     active: 'border-yellow-400 text-yellow-200 bg-yellow-900/50' },
  'Execution':            { idle: 'border-orange-800 text-orange-400 bg-orange-950/30 hover:bg-orange-900/40',     active: 'border-orange-400 text-orange-200 bg-orange-900/50' },
  'Command & Control':    { idle: 'border-orange-800 text-orange-400 bg-orange-950/30 hover:bg-orange-900/40',     active: 'border-orange-400 text-orange-200 bg-orange-900/50' },
  'Privilege Escalation': { idle: 'border-red-800 text-red-400 bg-red-950/30 hover:bg-red-900/40',                 active: 'border-red-400 text-red-200 bg-red-900/50' },
  'Lateral Movement':     { idle: 'border-purple-800 text-purple-400 bg-purple-950/30 hover:bg-purple-900/40',     active: 'border-purple-400 text-purple-200 bg-purple-900/50' },
  'Persistence':          { idle: 'border-blue-800 text-blue-400 bg-blue-950/30 hover:bg-blue-900/40',             active: 'border-blue-400 text-blue-200 bg-blue-900/50' },
  'Defense Evasion':      { idle: 'border-emerald-800 text-emerald-400 bg-emerald-950/30 hover:bg-emerald-900/40', active: 'border-emerald-400 text-emerald-200 bg-emerald-900/50' },
  'Exfiltration':         { idle: 'border-teal-800 text-teal-400 bg-teal-950/30 hover:bg-teal-900/40',             active: 'border-teal-400 text-teal-200 bg-teal-900/50' },
}
const FALLBACK_STYLE = { idle: 'border-gray-700 text-gray-400 bg-gray-800/30 hover:bg-gray-700/40', active: 'border-green-400 text-green-200 bg-green-900/50' }

const LEGEND = [
  { phase: 'Initial Access',       dot: 'bg-yellow-400' },
  { phase: 'Execution / C2',       dot: 'bg-orange-400' },
  { phase: 'Privilege Escalation', dot: 'bg-red-400' },
  { phase: 'Lateral Movement',     dot: 'bg-purple-400' },
  { phase: 'Persistence',          dot: 'bg-blue-400' },
  { phase: 'Defense Evasion',      dot: 'bg-emerald-400' },
  { phase: 'Exfiltration',         dot: 'bg-teal-400' },
]

const IOC_TYPE_COLORS = {
  'Domain':            'border-blue-800 text-blue-300 bg-blue-950/40',
  'IP':                'border-red-800 text-red-300 bg-red-950/40',
  'SHA-256':           'border-orange-800 text-orange-300 bg-orange-950/40',
  'File':              'border-yellow-800 text-yellow-300 bg-yellow-950/40',
  'Registry':          'border-purple-800 text-purple-300 bg-purple-950/40',
  'URL':               'border-teal-800 text-teal-300 bg-teal-950/40',
  'URL Pattern':       'border-teal-800 text-teal-300 bg-teal-950/40',
  'Tool':              'border-pink-800 text-pink-300 bg-pink-950/40',
  'Command':           'border-green-800 text-green-300 bg-green-950/40',
  'Event':             'border-indigo-800 text-indigo-300 bg-indigo-950/40',
  'Path':              'border-yellow-800 text-yellow-300 bg-yellow-950/40',
  'User-Agent':        'border-gray-700 text-gray-300 bg-gray-800/40',
  'Scheduled Task':    'border-orange-800 text-orange-300 bg-orange-950/40',
  'Driver':            'border-red-800 text-red-300 bg-red-950/40',
  'Access Rights':     'border-red-800 text-red-300 bg-red-950/40',
  'Memory IOA':        'border-rose-800 text-rose-300 bg-rose-950/40',
  'Service Principal': 'border-indigo-800 text-indigo-300 bg-indigo-950/40',
  'Operation':         'border-indigo-800 text-indigo-300 bg-indigo-950/40',
  'Target Pattern':    'border-amber-800 text-amber-300 bg-amber-950/40',
}

// All 14 MITRE ATT&CK tactics in kill chain order
const MITRE_TACTICS = [
  'Reconnaissance', 'Resource Development', 'Initial Access', 'Execution',
  'Persistence', 'Privilege Escalation', 'Defense Evasion', 'Credential Access',
  'Discovery', 'Lateral Movement', 'Collection', 'Command & Control',
  'Exfiltration', 'Impact',
]
const TACTIC_ABBREV = {
  'Reconnaissance':     'Recon',
  'Resource Development': 'Res Dev',
  'Initial Access':     'Init Acc',
  'Execution':          'Exec',
  'Persistence':        'Persist',
  'Privilege Escalation': 'Priv Esc',
  'Defense Evasion':    'Def Eva',
  'Credential Access':  'Cred Acc',
  'Discovery':          'Discov',
  'Lateral Movement':   'Lat Mov',
  'Collection':         'Collect',
  'Command & Control':  'C2',
  'Exfiltration':       'Exfil',
  'Impact':             'Impact',
}

export default function Campaign() {
  const { aptId, campaignId } = useParams()
  const [view, setView] = useState('attacker')
  const [activeStage, setActiveStage] = useState(0)
  const stageDetailRef = useRef(null)

  const apt = allAPTs[aptId]
  const campaign = apt?.campaigns.find(c => c.id === campaignId)

  if (!apt || !campaign) {
    return (
      <div className="p-8 font-mono text-red-400">
        Campaign not found. <Link to="/apt" className="underline text-green-400">Back to library</Link>
      </div>
    )
  }

  const stage = campaign.stages[activeStage]
  const allIOCs = campaign.stages.flatMap(s =>
    (s.iocs || []).map(ioc => ({ ...ioc, stageName: s.name }))
  )

  // Count techniques per MITRE tactic
  const tacticCounts = {}
  for (const s of campaign.stages) {
    const tactic = s.phase
    tacticCounts[tactic] = (tacticCounts[tactic] || 0) + 1
  }

  function jumpToStage(i) {
    setActiveStage(i)
    if (view === 'ioc' || view === 'intelligence') setView('attacker')
    stageDetailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const tabBtn = (value, label, activeClass, idleClass) => (
    <button
      onClick={() => setView(value)}
      className={`px-4 py-2 text-xs rounded border transition-colors ${view === value ? activeClass : idleClass}`}
    >
      {label}
    </button>
  )

  const dm = campaign.diamondModel

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 font-mono">

      {/* Breadcrumb */}
      <div className="text-xs text-gray-600 mb-6">
        <Link to="/apt" className="hover:text-green-400 transition-colors">APT LIBRARY</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-400">{apt.name}</span>
        <span className="mx-2">›</span>
        <span className="text-green-400">{campaign.name}</span>
      </div>

      {/* Campaign Header */}
      <div className="border border-gray-800 bg-gray-900 rounded-lg p-6 mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{campaign.name}</h2>
            <p className="text-gray-400 text-sm max-w-2xl">{campaign.summary}</p>
          </div>
          <div className="text-right text-xs text-gray-500 space-y-1">
            <div className="text-green-400">{apt.name} · {campaign.year}</div>
            <div>{campaign.target}</div>
            <div className="text-gray-600">{campaign.sources[0]}</div>
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-xs text-gray-500 mr-2">VIEW MODE:</span>
        {tabBtn('attacker',     '⚔ ATTACKER',    'bg-red-900 border-red-500 text-red-300',         'border-gray-700 text-gray-500 hover:border-red-700 hover:text-red-400')}
        {tabBtn('defender',     '🛡 DEFENDER',    'bg-blue-900 border-blue-500 text-blue-300',       'border-gray-700 text-gray-500 hover:border-blue-700 hover:text-blue-400')}
        {tabBtn('ioc',          '🔍 IOCs',         'bg-purple-900 border-purple-500 text-purple-300', 'border-gray-700 text-gray-500 hover:border-purple-700 hover:text-purple-400')}
        {tabBtn('intelligence', '◆ INTELLIGENCE', 'bg-green-900 border-green-500 text-green-300',   'border-gray-700 text-gray-500 hover:border-green-700 hover:text-green-400')}
      </div>

      {/* ── ATTACKER / DEFENDER views ── */}
      {(view === 'attacker' || view === 'defender') && (
        <>
          {/* Kill Chain Timeline */}
          <div className="border border-gray-800 bg-gray-900/50 rounded-lg px-6 py-4 mb-4">
            <p className="text-xs text-gray-600 uppercase tracking-widest mb-4">Kill Chain Progression</p>
            <div className="overflow-x-auto pb-1">
              <div className="flex items-center min-w-max">
                {campaign.stages.map((s, i) => {
                  const styles = PHASE_STYLES[s.phase] ?? FALLBACK_STYLE
                  const isActive = activeStage === i
                  return (
                    <div key={s.id} className="flex items-center">
                      <button
                        onClick={() => jumpToStage(i)}
                        className={`flex flex-col items-center text-center px-4 py-3 rounded border transition-all w-32 ${
                          isActive ? 'border-green-400 bg-green-950' : styles.idle
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-2 border transition-colors ${
                          isActive ? 'bg-green-400 border-green-400 text-gray-950' : 'bg-gray-800 border-gray-700 text-gray-400'
                        }`}>
                          {i + 1}
                        </div>
                        <div className={`text-xs font-bold leading-tight mb-1 ${isActive ? 'text-green-300' : ''}`}>{s.name}</div>
                        <div className="text-xs font-mono opacity-50">{s.ttp}</div>
                      </button>
                      {i < campaign.stages.length - 1 && (
                        <div className="flex items-center mx-2 shrink-0">
                          <div className="w-6 h-px bg-gray-700" />
                          <span className="text-gray-600 text-sm">›</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Kill Chain Heatmap */}
          <div className="border border-gray-800 bg-gray-900/50 rounded-lg px-6 py-4 mb-6">
            <p className="text-xs text-gray-600 uppercase tracking-widest mb-4">Kill Chain Coverage Heatmap</p>
            <div className="overflow-x-auto pb-1">
              <div className="flex items-stretch gap-1 min-w-max">
                {MITRE_TACTICS.map(tactic => {
                  const count = tacticCounts[tactic] || 0
                  const active = count > 0
                  return (
                    <div
                      key={tactic}
                      className={`flex flex-col items-center justify-between px-2 pt-3 pb-2 rounded border text-center w-[62px] transition-colors ${
                        active
                          ? 'border-green-600 bg-green-900/40'
                          : 'border-gray-800 bg-gray-800/20'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-2 shrink-0 ${
                        active ? 'bg-green-400 text-gray-950' : 'bg-gray-800 text-gray-700'
                      }`}>
                        {active ? count : '·'}
                      </div>
                      <div className={`text-xs leading-tight ${active ? 'text-green-300' : 'text-gray-700'}`}>
                        {TACTIC_ABBREV[tactic]}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <p className="text-xs text-gray-700 mt-3">
              {Object.keys(tacticCounts).length} of {MITRE_TACTICS.length} tactics covered ·
              <span className="text-green-700 ml-1">{campaign.stages.length} techniques mapped</span>
            </p>
          </div>

          {/* Stage Navigator + Stage Detail */}
          <div ref={stageDetailRef} className="grid grid-cols-1 lg:grid-cols-4 gap-6">

            {/* Stage Navigator */}
            <div className="lg:col-span-1 space-y-2">
              <p className="text-xs text-gray-600 mb-3 uppercase tracking-widest">Attack Stages</p>
              {campaign.stages.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setActiveStage(i)}
                  className={`w-full text-left px-3 py-3 rounded border text-xs transition-colors ${
                    activeStage === i
                      ? 'border-green-400 bg-green-950 text-green-300'
                      : 'border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300'
                  }`}
                >
                  <div className="text-gray-600 mb-1">0{i + 1}</div>
                  <div className="font-bold">{s.name}</div>
                  <div className="text-gray-600 mt-1">{s.ttp}</div>
                </button>
              ))}
            </div>

            {/* Stage Detail */}
            <div className="lg:col-span-3 border border-gray-800 bg-gray-900 rounded-lg p-6">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <a
                  href={`https://attack.mitre.org/techniques/${stage.ttp.replace('.', '/')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs bg-gray-800 border border-yellow-700 text-yellow-400 px-3 py-1 rounded font-bold hover:bg-yellow-900 transition-colors"
                >
                  ↗ {stage.ttp}
                </a>
                <span className="text-xs text-gray-400">{stage.ttpName}</span>
                <span className="text-xs text-gray-600 border border-gray-800 px-2 py-1 rounded">{stage.phase}</span>
              </div>

              <h3 className="text-lg font-bold text-white mb-4">{stage.name}</h3>

              {view === 'attacker' ? (
                <div className="space-y-5">
                  <div>
                    <p className="text-xs text-red-400 uppercase tracking-widest mb-2">What the attacker did</p>
                    <p className="text-gray-300 text-sm leading-relaxed">{stage.attacker.summary}</p>
                  </div>
                  <div>
                    <p className="text-xs text-red-400 uppercase tracking-widest mb-2">Tools Used</p>
                    <div className="flex flex-wrap gap-2">
                      {stage.attacker.tools.map(tool => (
                        <span key={tool} className="text-xs bg-red-950 border border-red-900 text-red-300 px-2 py-1 rounded">{tool}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-red-400 uppercase tracking-widest mb-2">Commands / Indicators</p>
                    <div className="bg-gray-950 border border-gray-800 rounded p-4 space-y-1">
                      {stage.attacker.commands.map((cmd, i) => (
                        <div key={i} className="text-xs text-green-300 font-mono">{cmd}</div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <p className="text-xs text-blue-400 uppercase tracking-widest mb-2">Logs Generated</p>
                    <div className="bg-gray-950 border border-gray-800 rounded p-4 space-y-2">
                      {stage.defender.logs.map((log, i) => (
                        <div key={i} className="text-xs text-gray-300 flex items-start gap-2">
                          <span className="text-blue-600 mt-0.5">▸</span>{log}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-blue-400 uppercase tracking-widest mb-2">Detection Guidance</p>
                    <p className="text-gray-300 text-sm leading-relaxed">{stage.defender.detection}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-400 uppercase tracking-widest mb-2">SIEM Query</p>
                    <div className="bg-gray-950 border border-gray-800 rounded p-4">
                      <code className="text-xs text-yellow-300">{stage.defender.siemQuery}</code>
                    </div>
                  </div>
                  <div className="border border-orange-900 bg-orange-950 rounded p-4">
                    <p className="text-xs text-orange-400 uppercase tracking-widest mb-2">⚠ If Detection Fails</p>
                    <p className="text-orange-300 text-sm leading-relaxed">{stage.defender.ifMissed}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── IOC view ── */}
      {view === 'ioc' && (
        <div className="border border-gray-800 bg-gray-900 rounded-lg p-6">
          <div className="mb-5">
            <p className="text-xs text-gray-600 uppercase tracking-widest mb-1">// indicators of compromise</p>
            <h3 className="text-sm font-bold text-white tracking-widest">
              IOC TABLE <span className="text-gray-600 font-normal ml-2">{allIOCs.length} indicators across {campaign.stages.length} stages</span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[700px]">
              <thead>
                <tr className="text-left border-b border-gray-800">
                  <th className="pb-3 pr-4 text-gray-500 font-normal uppercase tracking-wider">Type</th>
                  <th className="pb-3 pr-4 text-gray-500 font-normal uppercase tracking-wider">Indicator</th>
                  <th className="pb-3 pr-6 text-gray-500 font-normal uppercase tracking-wider">Description</th>
                  <th className="pb-3 text-gray-500 font-normal uppercase tracking-wider">Stage</th>
                </tr>
              </thead>
              <tbody>
                {allIOCs.map((ioc, i) => {
                  const typeClass = IOC_TYPE_COLORS[ioc.type] ?? 'border-gray-700 text-gray-400 bg-gray-800/30'
                  return (
                    <tr key={i} className="border-b border-gray-800/40 hover:bg-gray-800/20 transition-colors">
                      <td className="py-3 pr-4 whitespace-nowrap">
                        <span className={`text-xs px-2 py-0.5 rounded border ${typeClass}`}>{ioc.type}</span>
                      </td>
                      <td className="py-3 pr-4 max-w-xs">
                        <span className="font-mono text-green-300 text-xs break-all">{ioc.indicator}</span>
                      </td>
                      <td className="py-3 pr-6 text-gray-400 leading-relaxed">{ioc.description}</td>
                      <td className="py-3 text-gray-600 whitespace-nowrap">{ioc.stageName}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── INTELLIGENCE view — Diamond Intrusion Model ── */}
      {view === 'intelligence' && (
        <div className="border border-gray-800 bg-gray-900 rounded-lg p-6">
          <div className="mb-8">
            <p className="text-xs text-gray-600 uppercase tracking-widest mb-1">// intelligence analysis</p>
            <h3 className="text-sm font-bold text-white tracking-widest">DIAMOND INTRUSION MODEL</h3>
            <p className="text-xs text-gray-600 mt-1">Adversary · Capability · Infrastructure · Victim</p>
          </div>

          {dm ? (
            /* Diamond layout: absolute cards over a full-width SVG */
            <div className="relative min-h-[660px]">

              {/* Background SVG — lines connecting the 4 vertex card centers */}
              <svg
                className="absolute inset-0 w-full h-full z-0 pointer-events-none"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {/* Diamond outline sides */}
                <line x1="50" y1="14" x2="10" y2="50" stroke="#22c55e" strokeOpacity="0.30" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                <line x1="10" y1="50" x2="50" y2="86" stroke="#22c55e" strokeOpacity="0.30" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                <line x1="50" y1="86" x2="90" y2="50" stroke="#22c55e" strokeOpacity="0.30" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                <line x1="90" y1="50" x2="50" y2="14" stroke="#22c55e" strokeOpacity="0.30" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                {/* Diagonal cross-axes (dashed) */}
                <line x1="50" y1="14" x2="50" y2="86" stroke="#22c55e" strokeOpacity="0.12" strokeWidth="1" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
                <line x1="10" y1="50" x2="90" y2="50" stroke="#22c55e" strokeOpacity="0.12" strokeWidth="1" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
                {/* Vertex glow dots */}
                <circle cx="50" cy="14" r="2" fill="#22c55e" fillOpacity="0.5" vectorEffect="non-scaling-stroke" />
                <circle cx="10" cy="50" r="2" fill="#22c55e" fillOpacity="0.5" vectorEffect="non-scaling-stroke" />
                <circle cx="90" cy="50" r="2" fill="#22c55e" fillOpacity="0.5" vectorEffect="non-scaling-stroke" />
                <circle cx="50" cy="86" r="2" fill="#22c55e" fillOpacity="0.5" vectorEffect="non-scaling-stroke" />
              </svg>

              {/* ── Adversary — top center ── */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-56 z-10">
                <div className="border border-red-800 bg-gray-900 rounded-lg p-4 shadow-lg">
                  <div className="text-xs text-red-400 font-bold uppercase tracking-wider mb-3">◆ Adversary</div>
                  <div className="text-sm text-white font-bold mb-1">{dm.adversary.name}</div>
                  <div className="text-xs text-gray-400 mb-2 leading-relaxed">{dm.adversary.sponsor}</div>
                  <div className="text-xs text-gray-600 mb-2 leading-relaxed">{dm.adversary.aliases.join(' · ')}</div>
                  <div className="text-xs text-red-400/70 italic">{dm.adversary.motivation}</div>
                </div>
              </div>

              {/* ── Capability — middle left ── */}
              <div className="absolute top-1/2 left-0 -translate-y-1/2 w-56 z-10">
                <div className="border border-orange-800 bg-gray-900 rounded-lg p-4 shadow-lg">
                  <div className="text-xs text-orange-400 font-bold uppercase tracking-wider mb-3">◆ Capability</div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {dm.capability.malware.map(m => (
                      <span key={m} className="text-xs bg-orange-950/60 border border-orange-900/60 text-orange-300 px-2 py-0.5 rounded">{m}</span>
                    ))}
                  </div>
                  <div className="text-xs text-gray-600 leading-relaxed">{dm.capability.sophistication}</div>
                </div>
              </div>

              {/* ── Infrastructure — middle right ── */}
              <div className="absolute top-1/2 right-0 -translate-y-1/2 w-56 z-10">
                <div className="border border-yellow-800 bg-gray-900 rounded-lg p-4 shadow-lg">
                  <div className="text-xs text-yellow-400 font-bold uppercase tracking-wider mb-3">◆ Infrastructure</div>
                  <div className="space-y-1 mb-3">
                    {dm.infrastructure.domains.slice(0, 3).map(d => (
                      <div key={d} className="text-xs text-green-300 font-mono truncate">{d}</div>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 mb-1 font-mono">{dm.infrastructure.ips.slice(0, 2).join(' · ')}</div>
                  <div className="text-xs text-gray-600 leading-relaxed">{dm.infrastructure.hosting}</div>
                </div>
              </div>

              {/* ── Victim — bottom center ── */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-56 z-10">
                <div className="border border-blue-800 bg-gray-900 rounded-lg p-4 shadow-lg">
                  <div className="text-xs text-blue-400 font-bold uppercase tracking-wider mb-3">◆ Victim</div>
                  <div className="text-xs text-gray-300 mb-2 leading-relaxed">{dm.victim.sectors}</div>
                  <div className="text-xs text-gray-500 mb-2">{dm.victim.geography}</div>
                  <div className="text-xs text-gray-600 italic leading-relaxed">{dm.victim.targeting}</div>
                </div>
              </div>

            </div>
          ) : (
            <p className="text-gray-600 text-sm">Diamond model data not available for this campaign.</p>
          )}
        </div>
      )}

      {/* MITRE ATT&CK TTP Navigator Panel */}
      <div className="mt-8 border border-gray-800 bg-gray-900 rounded-lg p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-widest mb-1">// mitre att&ck coverage</p>
            <h3 className="text-sm font-bold text-white tracking-widest">TECHNIQUES USED IN THIS CAMPAIGN</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {LEGEND.map(({ phase, dot }) => (
              <div key={phase} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className={`w-2 h-2 rounded-full ${dot}`} />
                {phase}
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {campaign.stages.map((s, i) => {
            const styles = PHASE_STYLES[s.phase] ?? FALLBACK_STYLE
            const isActive = activeStage === i && (view === 'attacker' || view === 'defender')
            return (
              <button
                key={s.id}
                onClick={() => jumpToStage(i)}
                className={`text-left px-4 py-3 rounded border text-xs transition-colors ${isActive ? styles.active : styles.idle}`}
              >
                <div className="font-bold tracking-wide">{s.ttp}</div>
                <div className="mt-0.5 opacity-80">{s.ttpName}</div>
                <div className="mt-1 opacity-50">{s.phase}</div>
              </button>
            )
          })}
        </div>
      </div>

    </div>
  )
}
