import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import apt29 from '../data/apt/apt29'
import apt33 from '../data/apt/apt33'
import apt41 from '../data/apt/apt41'
import lazarus from '../data/apt/lazarus'
import sandworm from '../data/apt/sandworm'
import volttyphoon from '../data/apt/volttyphoon'
import scatteredspider from '../data/apt/scatteredspider'

const allAPTs = [apt29, apt33, apt41, lazarus, sandworm, volttyphoon, scatteredspider]

const totalCampaigns = allAPTs.reduce((sum, apt) => sum + apt.campaigns.length, 0)
const totalTechniques = allAPTs.reduce((sum, apt) =>
  apt.campaigns.reduce((s, c) => s + c.stages.length, sum), 0)

const THREAT_ACTORS = [
  'APT29 · Cozy Bear',
  'APT41 · Winnti',
  'Lazarus Group',
  'APT28 · Fancy Bear',
  'Sandworm Team',
  'Equation Group',
]

function useTypewriter(words, typingSpeed = 80, deletingSpeed = 40, pauseTime = 2000) {
  const [displayText, setDisplayText] = useState('')
  const [wordIndex, setWordIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const word = words[wordIndex]

    if (!isDeleting && displayText === word) {
      const timeout = setTimeout(() => setIsDeleting(true), pauseTime)
      return () => clearTimeout(timeout)
    }

    if (isDeleting && displayText === '') {
      setIsDeleting(false)
      setWordIndex(i => (i + 1) % words.length)
      return
    }

    const timeout = setTimeout(() => {
      setDisplayText(isDeleting
        ? word.slice(0, displayText.length - 1)
        : word.slice(0, displayText.length + 1)
      )
    }, isDeleting ? deletingSpeed : typingSpeed)

    return () => clearTimeout(timeout)
  }, [displayText, isDeleting, wordIndex, words, typingSpeed, deletingSpeed, pauseTime])

  return displayText
}

// Hardcoded order: 6 most recently added campaigns, newest first
const FEATURED_ORDER = [
  { aptId: 'scatteredspider', campaignId: 'mgm-ransomware-2023' },
  { aptId: 'volttyphoon',     campaignId: 'us-critical-infrastructure-2021' },
  { aptId: 'sandworm',        campaignId: 'notpetya-2017' },
  { aptId: 'apt29',           campaignId: 'usaid-phishing-2021' },
  { aptId: 'apt33',           campaignId: 'aviation-defense-2017' },
  { aptId: 'apt41',           campaignId: 'cuckoo-bees-2022' },
]

const aptById = Object.fromEntries(allAPTs.map(a => [a.id, a]))

const featuredCampaigns = FEATURED_ORDER.flatMap(({ aptId, campaignId }) => {
  const apt = aptById[aptId]
  if (!apt) return []
  const campaign = apt.campaigns.find(c => c.id === campaignId)
  if (!campaign) return []
  return [{ ...campaign, aptId: apt.id, aptName: apt.name }]
})

export default function Home() {
  const displayText = useTypewriter(THREAT_ACTORS)

  return (
    <div className="font-mono">

      {/* Hero */}
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 border-b border-gray-800">
        <div className="text-xs text-gray-600 uppercase tracking-widest mb-6">// threat intelligence platform</div>
        <h1 className="text-5xl font-bold text-green-400 mb-3 tracking-widest">THREATLENS</h1>
        <p className="text-gray-400 text-lg mb-1">Interactive APT Attack Simulator</p>
        <p className="text-gray-600 text-sm mb-10">Attacker view. Defender view. Real TTPs.</p>

        <div className="text-base text-gray-300 mb-10 h-7 flex items-center gap-2">
          <span className="text-green-500">$</span>
          <span className="text-gray-500">simulating:</span>
          <span className="text-yellow-400">{displayText}</span>
          <span className="animate-pulse text-green-400">█</span>
        </div>

        <Link
          to="/apt"
          className="px-6 py-3 border border-green-400 text-green-400 hover:bg-green-400 hover:text-gray-950 transition-colors text-sm tracking-widest"
        >
          → ENTER APT LIBRARY
        </Link>
      </div>

      {/* Stats Bar */}
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-4xl mx-auto px-6 py-6 grid grid-cols-3 text-center">
          <div>
            <div className="text-3xl font-bold text-green-400">{allAPTs.length}</div>
            <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">APT Groups</div>
          </div>
          <div className="border-x border-gray-800">
            <div className="text-3xl font-bold text-green-400">{totalCampaigns}</div>
            <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Campaigns</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-400">{totalTechniques}</div>
            <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Techniques Mapped</div>
          </div>
        </div>
      </div>

      {/* Featured Campaigns */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <p className="text-xs text-gray-600 uppercase tracking-widest mb-1">// featured</p>
          <h2 className="text-2xl font-bold text-white tracking-widest">CAMPAIGNS</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredCampaigns.map(campaign => (
            <Link
              key={campaign.id}
              to={`/apt/${campaign.aptId}/${campaign.id}`}
              className="block border border-gray-800 bg-gray-900 rounded-lg p-6 hover:border-green-400 transition-colors group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-green-400 border border-green-900 px-2 py-1 rounded">{campaign.aptName}</span>
                <span className="text-xs text-gray-600">{campaign.year}</span>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-green-300 mb-2 leading-snug">{campaign.name}</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">{campaign.summary.slice(0, 100)}...</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">{campaign.target}</span>
                <span className="text-green-400 group-hover:translate-x-1 transition-transform inline-block">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="border-t border-gray-800 bg-gray-900">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="mb-10 text-center">
            <p className="text-xs text-gray-600 uppercase tracking-widest mb-1">// methodology</p>
            <h2 className="text-2xl font-bold text-white tracking-widest">HOW IT WORKS</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="border border-red-900 bg-red-950/20 rounded-lg p-6">
              <div className="text-red-400 font-bold mb-3">⚔ ATTACKER VIEW</div>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                See each campaign through the threat actor's eyes. Every attack stage reveals the tools,
                commands, indicators of compromise, and the adversary's objective.
              </p>
              <ul className="space-y-2 text-xs text-gray-500">
                <li><span className="text-red-400 mr-2">›</span>MITRE ATT&CK TTP mapping</li>
                <li><span className="text-red-400 mr-2">›</span>Real tools and malware families</li>
                <li><span className="text-red-400 mr-2">›</span>Actual commands and IoCs</li>
              </ul>
            </div>
            <div className="border border-blue-900 bg-blue-950/20 rounded-lg p-6">
              <div className="text-blue-400 font-bold mb-3">🛡 DEFENDER VIEW</div>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Switch perspectives to see what logs are generated, how to detect each technique,
                and what happens if your defenses fail to catch it in time.
              </p>
              <ul className="space-y-2 text-xs text-gray-500">
                <li><span className="text-blue-400 mr-2">›</span>Log sources and event IDs</li>
                <li><span className="text-blue-400 mr-2">›</span>SIEM detection queries</li>
                <li><span className="text-blue-400 mr-2">›</span>Breach impact if missed</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
