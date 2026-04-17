import { Link } from 'react-router-dom'

const DIAMOND_SVG_SIZE = 220

function DiamondDiagram() {
  return (
    <div className="relative mx-auto my-8" style={{ width: DIAMOND_SVG_SIZE, height: DIAMOND_SVG_SIZE }}>
      <svg
        width={DIAMOND_SVG_SIZE}
        height={DIAMOND_SVG_SIZE}
        viewBox="0 0 220 220"
        className="absolute inset-0"
      >
        {/* Diamond outline */}
        <polygon
          points="110,10 200,110 110,210 20,110"
          fill="none"
          stroke="#22c55e"
          strokeOpacity="0.4"
          strokeWidth="1.5"
        />
        {/* Cross lines */}
        <line x1="110" y1="10" x2="110" y2="210" stroke="#22c55e" strokeOpacity="0.15" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="20" y1="110" x2="200" y2="110" stroke="#22c55e" strokeOpacity="0.15" strokeWidth="1" strokeDasharray="4 4" />
        {/* Vertex dots */}
        <circle cx="110" cy="10"  r="4" fill="#ef4444" fillOpacity="0.8" />
        <circle cx="20"  cy="110" r="4" fill="#f97316" fillOpacity="0.8" />
        <circle cx="200" cy="110" r="4" fill="#eab308" fillOpacity="0.8" />
        <circle cx="110" cy="210" r="4" fill="#3b82f6" fillOpacity="0.8" />
      </svg>
      {/* Labels */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 text-center">
        <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider block">Adversary</span>
      </div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 text-center">
        <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block">Victim</span>
      </div>
      <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-2 text-right">
        <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider block whitespace-nowrap">Capability</span>
      </div>
      <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-2 text-left">
        <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider block whitespace-nowrap">Infrastructure</span>
      </div>
    </div>
  )
}

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 font-mono">

      {/* Page Header */}
      <div className="mb-12">
        <p className="text-xs text-gray-600 uppercase tracking-widest mb-2">// about this platform</p>
        <h2 className="text-3xl font-bold text-green-400 tracking-widest mb-4">ABOUT THREATLENS</h2>
        <div className="border-t border-gray-800 pt-6">
          <p className="text-gray-300 text-sm leading-relaxed mb-4">
            ThreatLens is an interactive APT (Advanced Persistent Threat) intelligence platform built to make
            real-world cyberattack campaigns accessible to security practitioners, students, and defenders.
            Every campaign is sourced from published intelligence reports and mapped to three industry-standard
            frameworks: MITRE ATT&CK, the Diamond Intrusion Model, and the Cyber Kill Chain.
          </p>
          <p className="text-gray-400 text-sm leading-relaxed">
            The platform is built around a core belief: defenders learn best when they can see attacks from
            both perspectives simultaneously. The attacker view shows exactly what was done and with which
            tools. The defender view shows what logs were generated, how to detect each technique, and what
            happens if detection fails. Every technique is linked to real MITRE ATT&CK entries and real
            published threat intelligence.
          </p>
        </div>
      </div>

      <div className="w-full h-px bg-gray-800 mb-12" />

      {/* Frameworks Section */}
      <div className="mb-12">
        <p className="text-xs text-gray-600 uppercase tracking-widest mb-2">// analytical frameworks</p>
        <h3 className="text-xl font-bold text-white tracking-widest mb-8">THREE FRAMEWORKS, ONE VIEW</h3>

        {/* MITRE ATT&CK */}
        <div className="border border-gray-800 bg-gray-900 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="shrink-0 w-8 h-8 bg-yellow-900/40 border border-yellow-800 rounded flex items-center justify-center">
              <span className="text-yellow-400 text-xs font-bold">①</span>
            </div>
            <div>
              <h4 className="text-base font-bold text-yellow-400 mb-1">MITRE ATT&CK Framework</h4>
              <p className="text-xs text-gray-500">Adversarial Tactics, Techniques, and Common Knowledge</p>
            </div>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed mb-4">
            MITRE ATT&CK is a globally-accessible knowledge base of adversary tactics and techniques based on
            real-world observations. It organizes attacker behavior into 14 tactical categories — from
            Reconnaissance through Impact — with hundreds of sub-techniques, each documented with examples,
            mitigations, and detection guidance.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-gray-800/40 rounded p-3">
              <div className="text-yellow-400 font-bold mb-1">Tactics</div>
              <p className="text-gray-500">The adversary's goal at each stage — e.g., "Initial Access" describes their objective of getting a foothold.</p>
            </div>
            <div className="bg-gray-800/40 rounded p-3">
              <div className="text-yellow-400 font-bold mb-1">Techniques</div>
              <p className="text-gray-500">How they achieve that goal — e.g., T1566.001 (Spearphishing Attachment) is one way to gain initial access.</p>
            </div>
            <div className="bg-gray-800/40 rounded p-3">
              <div className="text-yellow-400 font-bold mb-1">TTPs</div>
              <p className="text-gray-500">Tactics, Techniques, and Procedures collectively. Every stage on ThreatLens links to the authoritative MITRE ATT&CK entry.</p>
            </div>
          </div>
          <div className="mt-4 text-xs">
            <a href="https://attack.mitre.org" target="_blank" rel="noreferrer" className="text-yellow-500 hover:text-yellow-400 transition-colors">
              ↗ attack.mitre.org — official MITRE ATT&CK knowledge base
            </a>
          </div>
        </div>

        {/* Diamond Intrusion Model */}
        <div className="border border-gray-800 bg-gray-900 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="shrink-0 w-8 h-8 bg-green-900/40 border border-green-800 rounded flex items-center justify-center">
              <span className="text-green-400 text-xs font-bold">②</span>
            </div>
            <div>
              <h4 className="text-base font-bold text-green-400 mb-1">Diamond Intrusion Model</h4>
              <p className="text-xs text-gray-500">Caltagirone, Pendergast & Betz (2013)</p>
            </div>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed mb-4">
            The Diamond Model provides a structured way to analyze intrusion events using four core features:
            Adversary, Capability, Infrastructure, and Victim. These four vertices form a diamond, with
            relationships between them expressing how a threat actor operated. It excels at attribution and
            understanding the "who" and "why" behind an attack — complementing MITRE's focus on the "how."
          </p>

          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="shrink-0">
              <DiamondDiagram />
            </div>
            <div className="grid grid-cols-1 gap-3 text-xs flex-1">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-red-400 shrink-0 mt-1" />
                <div>
                  <span className="text-red-400 font-bold">Adversary</span>
                  <span className="text-gray-400 ml-2">— The threat actor: who they are, who sponsors them, and their strategic motivation. For APT29, this is the Russian SVR and its intelligence objectives.</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-400 shrink-0 mt-1" />
                <div>
                  <span className="text-orange-400 font-bold">Capability</span>
                  <span className="text-gray-400 ml-2">— The tools and techniques used: malware families, TTPs, and sophistication level. What did they build or borrow to execute the attack?</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-yellow-400 shrink-0 mt-1" />
                <div>
                  <span className="text-yellow-400 font-bold">Infrastructure</span>
                  <span className="text-gray-400 ml-2">— The systems the adversary uses to deliver and operate: C2 domains, IPs, hosting. What does the operational backend look like?</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0 mt-1" />
                <div>
                  <span className="text-blue-400 font-bold">Victim</span>
                  <span className="text-gray-400 ml-2">— Who was targeted: sectors, geography, and targeting scope. Why were these organizations selected by this adversary?</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cyber Kill Chain */}
        <div className="border border-gray-800 bg-gray-900 rounded-lg p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="shrink-0 w-8 h-8 bg-blue-900/40 border border-blue-800 rounded flex items-center justify-center">
              <span className="text-blue-400 text-xs font-bold">③</span>
            </div>
            <div>
              <h4 className="text-base font-bold text-blue-400 mb-1">Cyber Kill Chain</h4>
              <p className="text-xs text-gray-500">Lockheed Martin (2011) — mapped to MITRE ATT&CK phases</p>
            </div>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed mb-4">
            The Cyber Kill Chain models an intrusion as a sequential progression of stages — from initial
            reconnaissance through final impact. Understanding the kill chain helps defenders identify which
            stage an attack is in and prioritize containment. ThreatLens maps every campaign stage to one of
            the 14 MITRE ATT&CK tactical phases, visualized in the Kill Chain Coverage heatmap on each
            campaign page.
          </p>
          <div className="overflow-x-auto">
            <div className="flex gap-1 min-w-max">
              {[
                { phase: 'Recon', color: 'text-gray-400 border-gray-700' },
                { phase: 'Initial Access', color: 'text-yellow-400 border-yellow-800' },
                { phase: 'Execution', color: 'text-orange-400 border-orange-800' },
                { phase: 'Persistence', color: 'text-blue-400 border-blue-800' },
                { phase: 'Priv Esc', color: 'text-red-400 border-red-800' },
                { phase: 'Defense Evasion', color: 'text-emerald-400 border-emerald-800' },
                { phase: 'Credential Access', color: 'text-gray-300 border-gray-600' },
                { phase: 'Lateral Movement', color: 'text-purple-400 border-purple-800' },
                { phase: 'C2', color: 'text-orange-300 border-orange-700' },
                { phase: 'Exfiltration', color: 'text-teal-400 border-teal-800' },
                { phase: 'Impact', color: 'text-gray-400 border-gray-700' },
              ].map((s, i, arr) => (
                <div key={s.phase} className="flex items-center">
                  <span className={`text-[10px] border px-2 py-1 rounded ${s.color}`}>{s.phase}</span>
                  {i < arr.length - 1 && <span className="text-gray-700 text-xs mx-0.5">→</span>}
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-3">
            Defenders can break the kill chain at any stage — disrupting initial access, detecting lateral movement,
            or blocking C2 are all valid strategies. Earlier detection = less damage.
          </p>
        </div>
      </div>

      <div className="w-full h-px bg-gray-800 mb-12" />

      {/* Data Sourcing */}
      <div className="mb-12">
        <p className="text-xs text-gray-600 uppercase tracking-widest mb-2">// data methodology</p>
        <h3 className="text-xl font-bold text-white tracking-widest mb-6">DATA SOURCING & METHODOLOGY</h3>

        <div className="border border-gray-800 bg-gray-900 rounded-lg p-6 mb-4">
          <p className="text-gray-300 text-sm leading-relaxed mb-4">
            All campaign data on ThreatLens is derived from published threat intelligence reports from
            reputable organizations. Primary sources include:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mb-4">
            {[
              { org: 'CISA / US-CERT', desc: 'US Government advisories (AA##-###A format)', color: 'text-green-400' },
              { org: 'NSA / FBI', desc: 'Joint cybersecurity advisories and technical alerts', color: 'text-green-400' },
              { org: 'Mandiant (Google)', desc: 'APT group profiles and campaign analysis reports', color: 'text-blue-400' },
              { org: 'Microsoft MSTIC', desc: 'Microsoft Threat Intelligence Center adversary profiles', color: 'text-blue-400' },
              { org: 'CrowdStrike Intelligence', desc: 'Adversary intelligence and intrusion analysis', color: 'text-orange-400' },
              { org: 'ESET / Kaspersky', desc: 'Malware analysis and campaign technical reports', color: 'text-orange-400' },
              { org: 'Cisco Talos', desc: 'Threat intelligence and malware reverse engineering', color: 'text-purple-400' },
              { org: 'Volexity / Cybereason', desc: 'Incident response and campaign attribution reports', color: 'text-purple-400' },
            ].map(({ org, desc, color }) => (
              <div key={org} className="flex items-start gap-2 bg-gray-800/40 rounded p-3">
                <span className={`${color} font-bold shrink-0`}>›</span>
                <div>
                  <span className={`${color} font-bold`}>{org}</span>
                  <span className="text-gray-500 ml-2">{desc}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-gray-500 text-xs leading-relaxed">
            Each campaign page displays its sources in the Intelligence Sources panel below the campaign header.
            Sources are linked directly to the original published report where available. Data accuracy reflects
            public knowledge at time of publication — attributions and technical details may be updated as new
            intelligence emerges.
          </p>
        </div>

        {/* Defanged IOCs */}
        <div className="border border-yellow-900/50 bg-yellow-950/20 rounded-lg p-5">
          <div className="text-yellow-400 font-bold text-sm mb-2">⚠ Defanged IOCs & Responsible Disclosure</div>
          <p className="text-gray-400 text-sm leading-relaxed mb-2">
            All IP addresses and domain indicators of compromise (IOCs) on ThreatLens use the defanging
            convention: dots are replaced with <code className="text-green-300 bg-gray-800 px-1 rounded">[.]</code> (e.g., <code className="text-green-300 bg-gray-800 px-1 rounded">avsvmcloud[.]com</code>).
            This prevents accidental live resolution, clickable hyperlinks, or automated system interaction with
            potentially malicious infrastructure.
          </p>
          <p className="text-gray-400 text-sm leading-relaxed">
            All IOCs presented are from publicly disclosed intelligence reports and are widely known in the
            security community. They are provided for detection and hunting purposes only. ThreatLens does not
            publish unreleased or zero-day vulnerability information.
          </p>
        </div>
      </div>

      <div className="w-full h-px bg-gray-800 mb-12" />

      {/* Attribution Disclaimer */}
      <div className="mb-12">
        <p className="text-xs text-gray-600 uppercase tracking-widest mb-2">// attribution</p>
        <h3 className="text-xl font-bold text-white tracking-widest mb-6">A NOTE ON ATTRIBUTION</h3>

        <div className="border border-orange-900/60 bg-orange-950/20 rounded-lg p-6 mb-6">
          <div className="text-orange-400 font-bold text-sm mb-3">Attribution is probabilistic, not certain</div>
          <p className="text-gray-300 text-sm leading-relaxed mb-4">
            Cyberattack attribution is inherently difficult. Unlike physical attacks, digital operations can be
            staged through third-party infrastructure, techniques can be copied across groups, and adversaries
            actively work to mislead investigators through false-flag operations and plausible deniability.
            When ThreatLens states that a threat actor "is attributed to" a nation-state, this reflects the
            published assessments of multiple independent intelligence organizations — it does not represent
            legal proof of state responsibility, and reasonable analysts sometimes disagree.
          </p>
          <p className="text-gray-400 text-sm leading-relaxed">
            Attribution confidence varies significantly across groups. Some actors have been formally named in
            government indictments with specific individuals charged; others are identified only through
            overlapping TTPs, infrastructure reuse, and victimology patterns that suggest a common origin.
            ThreatLens uses three confidence tiers to reflect this spectrum:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="border border-green-800 bg-green-950/20 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs border border-green-800 text-green-400 bg-green-950/30 px-2 py-1 rounded font-bold">
                Formally Attributed
              </span>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              A government has publicly attributed the activity to a specific nation-state actor — typically
              via formal indictment, official advisory, or diplomatic statement. Examples: the US DOJ
              indictment of APT29 / SVR officers; formal Five Eyes attribution of Sandworm to GRU Unit 74455;
              DOJ charges against APT41 members by name.
            </p>
          </div>
          <div className="border border-yellow-800 bg-yellow-950/20 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs border border-yellow-800 text-yellow-400 bg-yellow-950/30 px-2 py-1 rounded font-bold">
                Community Consensus
              </span>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              Multiple independent threat intelligence vendors and government bodies have independently
              reached the same attribution conclusion based on overlapping technical indicators, TTPs,
              infrastructure patterns, and targeting. No formal government indictment exists, but the
              attribution is widely accepted across the security community. Examples: APT33 to IRGC; Volt
              Typhoon to PRC MSS; Transparent Tribe to Pakistan-linked actors.
            </p>
          </div>
          <div className="border border-orange-800 bg-orange-950/20 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs border border-orange-800 text-orange-400 bg-orange-950/30 px-2 py-1 rounded font-bold">
                Assessed
              </span>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              Attribution is based on circumstantial technical evidence and victimology alignment, but
              significant uncertainty remains. The origin is an informed assessment, not a consensus
              conclusion. This may reflect a newer group with limited operational history, conflicting
              vendor assessments, or evidence that could support alternative interpretations. Example:
              SideWinder's India attribution is widely assumed but not formally confirmed by any government.
            </p>
          </div>
        </div>

        <div className="border border-gray-800 bg-gray-900/50 rounded-lg p-4 text-xs text-gray-500 leading-relaxed">
          Attribution labels on ThreatLens reflect the state of public knowledge at time of writing.
          Attribution confidence can increase (e.g., formal indictment) or be revised as new technical
          evidence emerges. Users should consult primary source reports linked on each campaign page for
          the most current assessments from the organizations that conducted the original investigation.
        </div>
      </div>

      <div className="w-full h-px bg-gray-800 mb-12" />

      {/* Tech Stack */}
      <div className="mb-12">
        <p className="text-xs text-gray-600 uppercase tracking-widest mb-2">// built with</p>
        <h3 className="text-xl font-bold text-white tracking-widest mb-6">TECH STACK</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: 'React 19.2', desc: 'UI framework', color: 'text-blue-400 border-blue-900' },
            { name: 'Vite 7.3', desc: 'Build tool', color: 'text-purple-400 border-purple-900' },
            { name: 'Tailwind CSS 3.4', desc: 'Utility styling', color: 'text-teal-400 border-teal-900' },
            { name: 'React Router 7.13', desc: 'SPA routing', color: 'text-orange-400 border-orange-900' },
            { name: 'GitHub Pages', desc: 'Deployment', color: 'text-green-400 border-green-900' },
            { name: 'BrowserRouter', desc: 'basename=/threatlens', color: 'text-yellow-400 border-yellow-900' },
            { name: 'MITRE ATT&CK', desc: 'TTP taxonomy', color: 'text-red-400 border-red-900' },
            { name: 'Open Source', desc: 'MIT licensed', color: 'text-gray-400 border-gray-700' },
          ].map(({ name, desc, color }) => (
            <div key={name} className={`border bg-gray-900 rounded p-3 ${color}`}>
              <div className="font-bold text-sm mb-1">{name}</div>
              <div className="text-xs text-gray-500">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full h-px bg-gray-800 mb-12" />

      {/* Links */}
      <div className="mb-8">
        <p className="text-xs text-gray-600 uppercase tracking-widest mb-4">// links</p>
        <div className="flex flex-wrap gap-3">
          <a
            href="https://github.com/michaelddickenson/threatlens"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 border border-gray-700 text-gray-400 hover:border-green-400 hover:text-green-400 transition-colors rounded text-sm"
          >
            ↗ GitHub Repository
          </a>
          <Link
            to="/apt"
            className="flex items-center gap-2 px-4 py-2 border border-green-800 text-green-400 hover:bg-green-950 transition-colors rounded text-sm"
          >
            → Enter APT Library
          </Link>
          <Link
            to="/compare"
            className="flex items-center gap-2 px-4 py-2 border border-purple-800 text-purple-400 hover:bg-purple-950 transition-colors rounded text-sm"
          >
            → Compare Threat Actors
          </Link>
        </div>
      </div>

      <div className="text-xs text-gray-700 leading-relaxed">
        ThreatLens is an educational platform. All data is sourced from publicly available threat intelligence reports.
        IOCs are defanged per responsible disclosure conventions.
      </div>

    </div>
  )
}
