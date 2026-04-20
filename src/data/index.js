import apt29 from './apt/apt29'
import apt33 from './apt/apt33'
import apt41 from './apt/apt41'
import lazarus from './apt/lazarus'
import sandworm from './apt/sandworm'
import volttyphoon from './apt/volttyphoon'
import scatteredspider from './apt/scatteredspider'
import kimsuky from './apt/kimsuky'
import blackcat from './apt/blackcat'
import apt32 from './apt/apt32'
import transparenttribe from './apt/transparenttribe'
import sidewinder from './apt/sidewinder'

// ─── Registry ────────────────────────────────────────────────────────────────
// To add a new APT: import the file above and add it to this array. Nothing else.
export const ALL_APTS = [
  apt29,
  apt33,
  apt41,
  lazarus,
  sandworm,
  volttyphoon,
  scatteredspider,
  kimsuky,
  blackcat,
  apt32,
  transparenttribe,
  sidewinder,
]

// ─── Lookup helpers ───────────────────────────────────────────────────────────

export function getAPTById(id) {
  return ALL_APTS.find(a => a.id === id) ?? null
}

export function getCampaignById(aptId, campaignId) {
  const apt = getAPTById(aptId)
  if (!apt) return null
  return apt.campaigns.find(c => c.id === campaignId) ?? null
}

/** Flat array of every campaign, with aptId and aptName attached. */
export function getAllCampaigns() {
  return ALL_APTS.flatMap(apt =>
    apt.campaigns.map(c => ({ ...c, aptId: apt.id, aptName: apt.name }))
  )
}

/** All unique TTPs for one actor, keyed by TTP id. */
export function getTTPsForAPT(aptId) {
  const apt = getAPTById(aptId)
  if (!apt) return []
  const seen = new Map()
  for (const campaign of apt.campaigns) {
    for (const stage of campaign.stages) {
      if (!seen.has(stage.ttp)) {
        seen.set(stage.ttp, { ttp: stage.ttp, ttpName: stage.ttpName, phase: stage.phase })
      }
    }
  }
  return [...seen.values()]
}

/** All TTPs across every actor, with usage counts. */
export function getAllTTPs() {
  const map = new Map()
  for (const apt of ALL_APTS) {
    for (const campaign of apt.campaigns) {
      for (const stage of campaign.stages) {
        const entry = map.get(stage.ttp) ?? { ttp: stage.ttp, ttpName: stage.ttpName, phase: stage.phase, count: 0, apts: [] }
        entry.count++
        if (!entry.apts.includes(apt.id)) entry.apts.push(apt.id)
        map.set(stage.ttp, entry)
      }
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count)
}

export function getAPTsByCountry(country) {
  return ALL_APTS.filter(a => a.origin === country)
}

/** Unique, sorted list of all origin countries. */
export function getAllCountries() {
  return [...new Set(ALL_APTS.map(a => a.origin))].sort()
}

const MITRE_TACTICS_ORDER = [
  'Reconnaissance', 'Resource Development', 'Initial Access', 'Execution',
  'Persistence', 'Privilege Escalation', 'Defense Evasion', 'Credential Access',
  'Discovery', 'Lateral Movement', 'Collection', 'Command & Control',
  'Exfiltration', 'Impact',
]

/**
 * Returns an object mapping each of the 14 MITRE tactics to:
 *   { tactic, apts: [{ aptId, aptName, count, ttps: [...] }], total }
 */
export function getTacticCoverage() {
  const result = {}
  for (const tactic of MITRE_TACTICS_ORDER) {
    result[tactic] = { tactic, apts: [], total: 0 }
  }

  for (const apt of ALL_APTS) {
    const tacticMap = new Map()
    for (const campaign of apt.campaigns) {
      for (const stage of campaign.stages) {
        const t = stage.phase
        if (!result[t]) continue
        if (!tacticMap.has(t)) tacticMap.set(t, { count: 0, ttps: [] })
        const entry = tacticMap.get(t)
        entry.count++
        if (!entry.ttps.find(x => x.ttp === stage.ttp)) {
          entry.ttps.push({ ttp: stage.ttp, ttpName: stage.ttpName, campaignId: campaign.id })
        }
      }
    }
    for (const [tactic, data] of tacticMap) {
      result[tactic].apts.push({ aptId: apt.id, aptName: apt.name, ...data })
      result[tactic].total += data.count
    }
  }

  return result
}

export { MITRE_TACTICS_ORDER }
