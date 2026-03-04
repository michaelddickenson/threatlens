import { useParams, Link } from 'react-router-dom'
import { useState, useRef } from 'react'
import apt29 from '../data/apt/apt29'
import apt41 from '../data/apt/apt41'
import lazarus from '../data/apt/lazarus'

const allAPTs = { apt29, apt41, lazarus }

const PHASE_STYLES = {
  'Initial Access':       { idle: 'border-yellow-800 text-yellow-400 bg-yellow-950/30 hover:bg-yellow-900/40',   active: 'border-yellow-400 text-yellow-200 bg-yellow-900/50' },
  'Execution':            { idle: 'border-orange-800 text-orange-400 bg-orange-950/30 hover:bg-orange-900/40',   active: 'border-orange-400 text-orange-200 bg-orange-900/50' },
  'Command & Control':    { idle: 'border-orange-800 text-orange-400 bg-orange-950/30 hover:bg-orange-900/40',   active: 'border-orange-400 text-orange-200 bg-orange-900/50' },
  'Privilege Escalation': { idle: 'border-red-800 text-red-400 bg-red-950/30 hover:bg-red-900/40',               active: 'border-red-400 text-red-200 bg-red-900/50' },
  'Lateral Movement':     { idle: 'border-purple-800 text-purple-400 bg-purple-950/30 hover:bg-purple-900/40',   active: 'border-purple-400 text-purple-200 bg-purple-900/50' },
  'Persistence':          { idle: 'border-blue-800 text-blue-400 bg-blue-950/30 hover:bg-blue-900/40',           active: 'border-blue-400 text-blue-200 bg-blue-900/50' },
  'Defense Evasion':      { idle: 'border-emerald-800 text-emerald-400 bg-emerald-950/30 hover:bg-emerald-900/40', active: 'border-emerald-400 text-emerald-200 bg-emerald-900/50' },
  'Exfiltration':         { idle: 'border-teal-800 text-teal-400 bg-teal-950/30 hover:bg-teal-900/40',           active: 'border-teal-400 text-teal-200 bg-teal-900/50' },
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

  function jumpToStage(i) {
    setActiveStage(i)
    stageDetailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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

      {/* Attacker / Defender Toggle */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs text-gray-500 mr-2">VIEW MODE:</span>
        <button
          onClick={() => setView('attacker')}
          className={`px-4 py-2 text-xs rounded border transition-colors ${
            view === 'attacker'
              ? 'bg-red-900 border-red-500 text-red-300'
              : 'border-gray-700 text-gray-500 hover:border-red-700 hover:text-red-400'
          }`}
        >
          ⚔ ATTACKER
        </button>
        <button
          onClick={() => setView('defender')}
          className={`px-4 py-2 text-xs rounded border transition-colors ${
            view === 'defender'
              ? 'bg-blue-900 border-blue-500 text-blue-300'
              : 'border-gray-700 text-gray-500 hover:border-blue-700 hover:text-blue-400'
          }`}
        >
          🛡 DEFENDER
        </button>
      </div>

      {/* Kill Chain Timeline */}
      <div className="border border-gray-800 bg-gray-900/50 rounded-lg px-6 py-4 mb-6">
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
                      isActive
                        ? 'border-green-400 bg-green-950'
                        : styles.idle
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-2 border transition-colors ${
                      isActive
                        ? 'bg-green-400 border-green-400 text-gray-950'
                        : 'bg-gray-800 border-gray-700 text-gray-400'
                    }`}>
                      {i + 1}
                    </div>
                    <div className={`text-xs font-bold leading-tight mb-1 ${isActive ? 'text-green-300' : ''}`}>
                      {s.name}
                    </div>
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

      {/* Stage Navigator + Detail */}
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

          {/* TTP Badge */}
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
            const isActive = activeStage === i
            return (
              <button
                key={s.id}
                onClick={() => jumpToStage(i)}
                className={`text-left px-4 py-3 rounded border text-xs transition-colors ${isActive ? styles.active : styles.idle}`}
              >
                <div className="font-bold tracking-wide">{s.ttp}</div>
                <div className="mt-0.5 opacity-80">{s.ttpName}</div>
                <div className="mt-1 opacity-50 text-xs">{s.phase}</div>
              </button>
            )
          })}
        </div>
      </div>

    </div>
  )
}
