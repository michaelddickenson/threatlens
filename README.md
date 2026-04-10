# ThreatLens

An interactive cybersecurity threat intelligence platform for exploring real-world APT (Advanced Persistent Threat) campaigns from both attacker and defender perspectives. Built as a portfolio project and personal CTI research tool.

**Live Site:** https://michaelddickenson.github.io/threatlens

---

## What It Does

ThreatLens lets you walk through documented nation-state cyber attacks stage by stage, toggling between the attacker's perspective and the blue team's view. Every technique is mapped to the MITRE ATT&CK framework.

**For each campaign you can explore:**
- **Attacker View** — what the threat actor did, tools used, real commands and indicators
- **Defender View** — logs generated, SIEM detection queries, detection guidance
- **IOC Table** — all indicators of compromise across every stage (domains, hashes, IPs, registry keys)
- **Intelligence Tab** — Diamond Intrusion Model with Adversary, Capability, Infrastructure, and Victim vertices populated with real campaign data
- **Kill Chain Timeline** — horizontal progression through all attack stages with phase color coding
- **Kill Chain Heatmap** — visual fingerprint showing which of the 14 MITRE ATT&CK tactics were used

---

## Features

- **APT Library** — browse all threat actors, filter by origin country
- **Campaign Explorer** — stage-by-stage attack walkthrough with attacker/defender toggle
- **Threat Actor Comparison Mode** — select any two APTs for side-by-side analysis including shared kill chain heatmap, TTP overlap table, Diamond Model comparison, and auto-generated key differences
- **Real-time Search** — search across all APTs, campaigns, stage names, and TTP IDs
- **MITRE ATT&CK Integration** — every TTP badge links directly to the official MITRE ATT&CK page
- **Diamond Intrusion Model** — rendered as a proper diamond layout with SVG connecting lines and real campaign data at each vertex
- **IOC Tables** — 15+ indicators per campaign including file hashes, C2 domains, IPs, tools, and event IDs

---

## Tech Stack

- **React + Vite** — component-based UI with fast dev/build pipeline
- **Tailwind CSS v3** — utility-first styling with dark terminal aesthetic
- **React Router** — client-side routing between APT library, campaigns, compare, and search
- **GitHub Pages** — free static hosting via gh-pages

---

## Project Structure

src/
├── components/
│   └── Navbar.jsx
├── data/apt/
│   ├── apt29.js        # APT29 — Russia
│   ├── apt33.js        # APT33 — Iran
│   ├── apt41.js        # APT41 — China
│   └── lazarus.js      # Lazarus Group — North Korea
├── pages/
│   ├── Home.jsx
│   ├── APTLibrary.jsx
│   ├── Campaign.jsx
│   ├── Compare.jsx
│   └── Search.jsx

---

## Running Locally

git clone https://github.com/michaelddickenson/threatlens.git
cd threatlens
npm install
npm run dev

Open http://localhost:5173

---

## Roadmap

- [ ] PDF export for campaign reports
- [ ] Additional APT groups (Sandworm, Volt Typhoon, Scattered Spider)
- [ ] About / methodology page
- [ ] Detection scoring per campaign
- [ ] Mobile layout optimization

---

## Disclaimer

All data in ThreatLens is sourced from publicly available threat intelligence reports and MITRE ATT&CK documentation. This tool is for educational and research purposes only. IOCs and commands are presented in defanged format where applicable.

---

*Built with React + Vite + Tailwind CSS. Deployed on GitHub Pages.*
