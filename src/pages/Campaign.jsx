import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import apt29 from '../data/apt/apt29'

const allAPTs = { apt29 }

export default function Campaign() {
  const { aptId, campaignId } = useParams()
  const [view, setView] = useState('attacker')
  const [activeStage, setActiveStage] = useState(0)

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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

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
    </div>
  )
}