const sandworm = {
  id: "sandworm",
  name: "Sandworm",
  aliases: ["Voodoo Bear", "Iron Viking", "TeleBots", "Iridium", "Seashell Blizzard"],
  origin: "Russia",
  motivation: "Destructive / Espionage",
  description:
    "Sandworm (GRU Unit 74455) is Russia's most destructive cyber threat actor, responsible for the NotPetya wiper ($10B+ in damages), BlackEnergy attacks on Ukraine's power grid, and Olympic Destroyer. Unlike espionage-focused groups, Sandworm prioritizes destruction over stealth.",
  campaigns: [
    {
      id: "notpetya-2017",
      name: "NotPetya Attack (2017)",
      year: "2017",
      target: "Global Enterprises & Ukrainian Government",
      summary:
        "Sandworm distributed a destructive wiper disguised as Petya ransomware through Ukraine's M.E.Doc accounting software update pipeline. NotPetya spread globally via EternalBlue, destroying 49,000+ systems at Maersk, Merck, FedEx/TNT, and Mondelez — causing $10B+ in damages in the most destructive cyberattack in history. No decryption was possible; ransom payment was designed to fail.",
      sources: [
        { title: "US-CERT Alert TA17-181A — Petya Variant Ransomware", publisher: "CISA / US-CERT", url: "https://www.cisa.gov/news-events/alerts/2017/06/30/petya-variant-ransomware" },
        { title: "CISA Advisory AA20-239A — GRU Destructive Malware Targeting Ukraine", publisher: "CISA / FBI / NSA", url: "https://www.cisa.gov/news-events/cybersecurity-advisories/aa20-239a" },
        { title: "New Ransomware Attack Hits Ukraine — NotPetya Analysis", publisher: "ESET WeLiveSecurity", url: "https://www.welivesecurity.com/2017/06/27/new-ransomware-attack-hits-ukraine/" },
        { title: "From BlackEnergy to ExPetr — Sandworm Malware Timeline", publisher: "Cisco Talos Intelligence", url: "https://blog.talosintelligence.com/from-blackenergy-to-expetrpetya/" },
      ],
      diamondModel: {
        adversary: {
          name: "Sandworm (GRU Unit 74455 / Seashell Blizzard)",
          sponsor: "Russian GRU — Main Intelligence Directorate, Unit 74455 (Sandworm Team)",
          aliases: ["Voodoo Bear", "Iron Viking", "TeleBots", "Iridium", "Seashell Blizzard"],
          motivation: "Geopolitical coercion and disruption of Ukraine; strategic demonstration of destructive capability as deterrence to NATO-aligned entities",
        },
        capability: {
          malware: ["NotPetya wiper", "EternalBlue (NSA exploit)", "Mimikatz credential harvester", "Petya MBR overwriter", "Custom M.E.Doc backdoor"],
          ttps: ["T1566.001 — Supply chain spearphishing (M.E.Doc)", "T1059.001 — PowerShell staging", "T1210 — EternalBlue SMB exploit", "T1543.003 — Windows Service install", "T1485 — MBR/MFT destruction"],
          sophistication: "Nation-State — weaponized NSA tooling, software supply chain compromise, autonomous self-spreading wiper with zero recovery capability",
        },
        infrastructure: {
          domains: ["upd.me-doc[.]com.ua (hijacked M.E.Doc update server)", "download.me-doc[.]com.ua (hijacked)"],
          ips: ["10.0.0[.]0/8 (LAN auto-spread via EternalBlue)", "84.32.188[.]238 (actor C2 — pre-campaign)"],
          hosting: "Hijacked M.E.Doc software update servers (Intellect Service, Kyiv, Ukraine); autonomous LAN propagation via SMB broadcast — no external C2 needed after detonation",
        },
        victim: {
          sectors: "Shipping/logistics (Maersk — $300M), pharmaceutical (Merck — $870M), courier (FedEx/TNT — $400M), food & beverage (Mondelez — $188M), Ukrainian government, banks, energy companies",
          geography: "Ukraine (primary target — M.E.Doc customers), United States, Germany, France, United Kingdom — global supply chain collateral damage across 65+ countries",
          targeting: "~49,000 individual systems permanently destroyed; 80+ companies directly impacted; Maersk: 45,000 PCs and 4,000 servers replaced in 10 days",
        },
      },
      stages: [
        {
          id: "supply-chain",
          name: "M.E.Doc Supply Chain Compromise",
          ttp: "T1566.001",
          ttpName: "Phishing: Spearphishing Attachment",
          phase: "Initial Access",
          attacker: {
            summary:
              "Sandworm gained access to Intellect Service — developer of M.E.Doc, Ukraine's dominant accounting software — through targeted spearphishing of company employees. Once inside, they inserted a backdoor into the M.E.Doc update DLL (ZvitPublishedObjects.dll). The update mechanism distributed the NotPetya dropper to approximately 400,000 organizations that used M.E.Doc to file VAT returns with the Ukrainian government. The backdoor exfiltrated EDRPOU tax codes to C2 before activating the wiper on a date-triggered timer (June 27, 2017).",
            tools: ["Spearphishing email", "VBA macro dropper", "Custom backdoor DLL injection", "M.E.Doc update server hijack"],
            commands: [
              "// Backdoor injected into M.E.Doc ZvitPublishedObjects.dll",
              "// DLL loaded automatically on every M.E.Doc software launch and update",
              "// Backdoor exfiltrated EDRPOU codes and Windows proxy config to C2",
              "// C2 response: download and execute NotPetya dropper (perfc.dat)",
              "// Activation trigger: date check — fired June 27, 2017 at 21:07 local time",
            ],
          },
          defender: {
            logs: [
              "M.E.Doc software update installed — new DLL version loaded (Windows Installer Event ID 1033)",
              "ZvitPublishedObjects.dll loaded by accounting process with unexpected hash (Sysmon Event ID 7)",
              "Outbound HTTP to upd.me-doc[.]com.ua from accounting workstations (proxy log)",
              "Abnormal network beacon from M.E.Doc process to unknown external IP (EDR network monitor)",
            ],
            detection:
              "Software supply chain attacks are nearly impossible to detect at delivery — the update is vendor-signed. Post-incident: monitor critical business software for unexpected outbound connections. Validate DLL hashes against vendor-published manifests before deployment. Treat accounting/ERP software update events as high-risk and validate hash integrity. Consider application allowlisting for accounting software directories.",
            siemQuery:
              'index=endpoint Sysmon EventCode=7 ImageLoaded="*ZvitPublishedObjects*" | eval hash=coalesce(MD5,SHA256) | search NOT hash IN (known_good_hashes) | stats count by host, ImageLoaded, hash',
            ifMissed:
              "NotPetya dropper executes on the accounting workstation. Within seconds, it begins harvesting credentials with an embedded Mimikatz module and scanning the local network for SMB-reachable hosts. The wiper will execute at the scheduled trigger, permanently destroying all drives on infected systems and spreading to every reachable Windows host.",
          },
          iocs: [
            { type: "SHA-256", indicator: "027cc450ef5f8c5f653329641ec1fed91f694e0d229928963b30f6b0d7d3a745", description: "NotPetya dropper SHA-256 — distributed via trojanized M.E.Doc ZvitPublishedObjects.dll software update" },
            { type: "Domain", indicator: "upd.me-doc[.]com.ua", description: "Hijacked M.E.Doc software update domain used as Sandworm C2 and NotPetya distribution server" },
            { type: "File", indicator: "ZvitPublishedObjects.dll (backdoored version)", description: "M.E.Doc DLL backdoored by Sandworm — legitimate-looking file delivered via official accounting software update" },
          ],
        },
        {
          id: "execution",
          name: "Credential Harvesting via PowerShell",
          ttp: "T1059.001",
          ttpName: "Command and Scripting Interpreter: PowerShell",
          phase: "Execution",
          attacker: {
            summary:
              "After dropping via the M.E.Doc update, NotPetya's embedded credential module — a Mimikatz derivative — extracted plaintext credentials from LSASS memory. PowerShell executed secondary staging payloads and collected network topology information. Harvested credentials enabled NotPetya to spread laterally via WMIC and PsExec before the destructive payload detonated. The entire execution chain was designed to maximize infection radius before the MBR wipe rendered systems unbootable.",
            tools: ["NotPetya embedded Mimikatz", "PowerShell", "WMIC (lateral spread)", "PsExec (renamed)"],
            commands: [
              "// NotPetya embedded credential harvester (Mimikatz-style LSASS dump)",
              "powershell.exe -ExecutionPolicy Bypass -NoProfile -EncodedCommand <base64_payload>",
              "// Lateral spread with harvested credentials via WMIC",
              "wmic /node:<target_ip> /user:<domain\\user> /password:<harvested> process call create \"C:\\Windows\\perfc.dat\"",
              "// PsExec spread (renamed binary)",
              "dllhost.dat \\\\<target_ip> -accepteula -s -d C:\\Windows\\perfc.dat",
            ],
          },
          defender: {
            logs: [
              "LSASS memory access by non-system process (Sysmon Event ID 10 — ProcessAccess GrantedAccess 0x1010)",
              "PowerShell execution with -ExecutionPolicy Bypass or EncodedCommand (Event ID 4104 ScriptBlock)",
              "WMIC remote process creation on multiple hosts in rapid succession (Event ID 4688 on targets)",
              "PsExec-named service installed on remote host (Event ID 7045 — new service creation)",
            ],
            detection:
              "Enable LSASS Protected Process Light (PPL) via Credential Guard — this blocks Mimikatz-style LSASS access. Alert on any process accessing LSASS that is not antivirus or OS services (Sysmon EventCode=10). WMIC with /node remote execution from non-administrative workstations is a high-fidelity alert. PsExec service installation (Event ID 7045) should page SOC immediately — it is almost never legitimate in production.",
            siemQuery:
              'index=endpoint EventCode=10 TargetImage="*\\lsass.exe" NOT SourceImage IN ("*MsMpEng.exe","*CrowdStrikeSensor*","*svchost.exe","*AV*") | stats count by host, SourceImage, GrantedAccess',
            ifMissed:
              "Sandworm now has harvested domain credentials and can execute code on any Windows host reachable on the network. WMIC and PsExec spread NotPetya to file servers, domain controllers, and backup systems before the 21:07 detonation trigger. Entire enterprise networks can be destroyed in under 45 minutes — faster than IR teams can mobilize.",
          },
          iocs: [
            { type: "File", indicator: "C:\\Windows\\perfc.dat", description: "NotPetya primary wiper executable — dropped to Windows directory disguised as performance counter file (perfc.ini is legitimate, perfc.dat is not)" },
            { type: "Command", indicator: "wmic /node:<ip> process call create \"perfc.dat\"", description: "NotPetya WMIC lateral movement command — spreads wiper to remote hosts using Mimikatz-harvested domain credentials" },
            { type: "Memory IOA", indicator: "LSASS ProcessAccess GrantedAccess 0x1010 from perfc.dat", description: "NotPetya Mimikatz credential harvest IOA — LSASS memory read by wiper process to extract domain credentials for lateral spread" },
          ],
        },
        {
          id: "lateral-movement",
          name: "EternalBlue Network Propagation",
          ttp: "T1210",
          ttpName: "Exploitation of Remote Services",
          phase: "Lateral Movement",
          attacker: {
            summary:
              "NotPetya incorporated the NSA's EternalBlue (MS17-010) SMB exploit — the same tool used by WannaCry one month earlier — enabling autonomous spread to all reachable Windows machines on the LAN without credentials or user interaction. Machines on the same broadcast domain were targeted automatically via DHCP-discovered subnet ranges. This autonomous propagation was responsible for NotPetya jumping from Ukrainian accounting workstations to global shipping, pharmaceutical, and logistics networks within hours.",
            tools: ["EternalBlue exploit (NSA MS17-010)", "DoublePulsar kernel backdoor (NSA)", "SMB subnet broadcast scanner"],
            commands: [
              "// EternalBlue exploit targeting SMBv1 on TCP/445 — no authentication required",
              "// NotPetya scanned 10.0.0.0/8 and local /24 subnet for open port 445",
              "// MS17-010 heap spray triggers DoublePulsar kernel shellcode injection",
              "// Kernel shellcode: inject NotPetya DLL into SYSTEM-privileged process",
              "// Maersk: 45,000 PCs infected within approximately 7 minutes of initial detonation",
              "// Merck: spread from single US site to all global locations in < 1 hour",
            ],
          },
          defender: {
            logs: [
              "High-volume SMB connection attempts to port 445 from single host (netflow — rate anomaly)",
              "SMBv1 protocol negotiation detected on Windows Server 2012+ (network IDS)",
              "DoublePulsar kernel implant signature detected in network traffic (IDS: ET:2024218)",
              "Remote thread creation at SYSTEM level from unusual parent process (Sysmon Event ID 8)",
            ],
            detection:
              "Disable SMBv1 immediately — it has no legitimate use in modern environments (requires explicit enablement after Windows 10 1709). Apply MS17-010 patch (KB4012212, released March 2017). Network segmentation: OT/ICS networks must be isolated from corporate LANs with no SMB traversal. Alert on any host scanning internal port 445 (>20 unique destinations in 60 seconds). EternalBlue has well-known IDS signatures — ensure Suricata/Snort rules are current.",
            siemQuery:
              'index=network dest_port=445 | stats dc(dest_ip) as targets count as attempts by src_ip _time span=60s | where targets > 20 | sort -targets',
            ifMissed:
              "NotPetya propagates at LAN speed — infecting all unpatched Windows systems in minutes. Maersk lost 49,000 machines and 1,000 servers globally in approximately 7 minutes. OT/ICS networks connected to corporate LANs are destroyed. The spread is fully autonomous; there is no C2 to disrupt and no kill switch to activate after detonation begins.",
          },
          iocs: [
            { type: "Event", indicator: "SMBv1 MS17-010 exploit attempt (Suricata ET:2024217 / ET:2024218)", description: "EternalBlue exploit detection rule — fires on any MS17-010 exploit packet, high-fidelity indicator for NotPetya lateral spread" },
            { type: "Driver", indicator: "DoublePulsar kernel implant (memory — no file on disk)", description: "NSA kernel backdoor loaded by EternalBlue — injects NotPetya DLL at SYSTEM level, fileless execution from kernel memory" },
            { type: "IP", indicator: "10.0.0[.]0/8 internal LAN broadcast (automated scan)", description: "NotPetya EternalBlue target range — automatically scans full RFC1918 space and local /24 subnet without C2 direction" },
          ],
        },
        {
          id: "persistence",
          name: "Windows Service Installation",
          ttp: "T1543.003",
          ttpName: "Create or Modify System Process: Windows Service",
          phase: "Persistence",
          attacker: {
            summary:
              "NotPetya registered itself as a Windows service using rundll32 to ensure execution survives reboots and establishes a detonation timer before the MBR wipe fires. The service was installed under benign-sounding names to blend with legitimate Windows services. A scheduled task provided a backup execution path. Once installed, the service guaranteed the wiper payload would execute at the scheduled time — approximately 1 hour post-infection — even if the initial dropper process was killed.",
            tools: ["sc.exe (Windows Service Control)", "schtasks.exe (Task Scheduler)", "rundll32.exe"],
            commands: [
              "// NotPetya service registration via sc.exe",
              "sc create <service_name> binPath= \"C:\\Windows\\System32\\rundll32.exe C:\\Windows\\perfc.dat,#1\" start= auto",
              "sc start <service_name>",
              "// Backup: scheduled task for detonation at fixed time",
              "schtasks /create /tn \"\\Microsoft\\Windows\\DiskCleanup\\SilentCleanup\" /tr \"C:\\Windows\\perfc.dat\" /sc once /st 21:07",
              "// Service timer: ~1 hour delay before MBR overwrite fires",
            ],
          },
          defender: {
            logs: [
              "New Windows service created with rundll32.exe loading non-system DLL (Event ID 7045)",
              "Service binary path contains unexpected DLL path outside System32 (Event ID 7045)",
              "Scheduled task created with one-time future execution time (Event ID 4698 — Task Registered)",
              "Service start event for newly-created service within seconds of creation (Event ID 7036)",
            ],
            detection:
              "Alert on Event ID 7045 (service creation) where binary path contains rundll32.exe loading a DLL from non-system paths. Hunt for services created by user-context processes rather than SCM/SYSTEM. Scheduled task creation (4698) with DLL paths in C:\\Windows temp areas or user-writable locations is a high-priority alert. Baseline all Windows services in your environment; any new service creation outside a change window should alert the SOC.",
            siemQuery:
              'index=endpoint EventCode=7045 ServiceFileName="*rundll32*" NOT ServiceFileName IN ("*shell32*","*ieframe*","*shdocvw*","*msiexec*") | stats count by host, ServiceName, ServiceFileName, AccountName',
            ifMissed:
              "NotPetya is now guaranteed to execute at the scheduled time regardless of network disruption. At T+1 hour, the wiper fires: MBR and MFT are overwritten, the machine reboots to a fake Petya ransom screen, and the system is permanently destroyed. No decryption key exists — Sandworm designed NotPetya as a pure wiper with a ransomware disguise to delay incident response.",
          },
          iocs: [
            { type: "Service Principal", indicator: "Windows service: rundll32.exe loading C:\\Windows\\perfc.dat,#1", description: "NotPetya service persistence — rundll32 loading wiper DLL registered as autostart Windows service for detonation timer" },
            { type: "Scheduled Task", indicator: "\\Microsoft\\Windows\\DiskCleanup\\SilentCleanup — executes perfc.dat", description: "NotPetya detonation timer — scheduled task disguised as Windows DiskCleanup utility to fire wiper at precise time" },
            { type: "Registry", indicator: "HKLM\\SYSTEM\\CurrentControlSet\\Services\\<name>\\ImagePath: rundll32 perfc.dat,#1", description: "NotPetya autostart service registry entry — wiper DLL loaded via rundll32 on every system boot" },
          ],
        },
        {
          id: "impact",
          name: "NotPetya MBR/MFT Destruction",
          ttp: "T1485",
          ttpName: "Data Destruction",
          phase: "Impact",
          attacker: {
            summary:
              "NotPetya's wiper payload permanently destroyed the Master Boot Record (MBR) and Master File Table (MFT) of all infected drives, making systems unbootable and filesystems unrecoverable. Unlike real ransomware, NotPetya generated a random victim ID with no stored decryption key — making recovery impossible regardless of payment. The wiper also encrypted individual files matching a hardcoded extension list. A fake Petya-style ransom note disguised the wiper's true nature and delayed incident response recognition.",
            tools: ["NotPetya MBR overwriter", "MFT/Salsa20 encryptor", "Fake Petya ransom screen"],
            commands: [
              "// NotPetya MBR overwrite — opens raw device handle",
              "// CreateFile(\"\\\\.\\PhysicalDrive0\", GENERIC_WRITE, ...)",
              "// WriteFile: 512-byte custom bootloader overwrites original MBR sectors 0-9",
              "// Bootloader displays: 'Ooops, your files have been encrypted... send $300 Bitcoin'",
              "// MFT encryption: custom Salsa20 implementation with random key (key not stored — unrecoverable)",
              "// File extension targeting: .doc .docx .xls .xlsx .ppt .pdf .mdf .edb .sql .mdb .ost .pst",
              "// Network share enumeration: destroys all reachable SMB shares before reboot",
            ],
          },
          defender: {
            logs: [
              "Direct disk write to \\\\.\\PhysicalDrive0 by non-SYSTEM process (EDR disk I/O behavior)",
              "Mass file modification/rename across all drives within seconds (EDR bulk operation alert)",
              "System reboot initiated by non-standard process (Event ID 1074 — shutdown source: perfc.dat)",
              "Physical disk handle opened with GENERIC_WRITE by non-backup process (EDR API hook)",
            ],
            detection:
              "By the time the wiper fires, real-time detection is too late — the goal is prevention. Controls: (1) Disable SMBv1 and patch MS17-010. (2) Segment OT networks. (3) Offline backups on non-network-connected media — NotPetya wiped all network shares. (4) EDR with raw disk write protection ('shield MBR' capability) can block the overwrite. Test backup restoration quarterly. Assume any system not patched for MS17-010 is fully compromised if NotPetya reaches the network.",
            siemQuery:
              'index=endpoint EventCode=4663 ObjectName="\\\\.\\PhysicalDrive*" AccessMask="0x40000000" NOT SubjectUserName IN ("SYSTEM","NT AUTHORITY\\SYSTEM") | stats count by host, SubjectUserName, ProcessName, ObjectName',
            ifMissed:
              "All infected systems are permanently destroyed. No decryption is possible — NotPetya was built to destroy, not extort. Maersk required 10 days and $300M to recover: 45,000 PCs and 4,000 servers rebuilt from scratch. Merck spent $870M. Total global damages exceeded $10 billion, making NotPetya the costliest cyberattack in history. Recovery required replacing all hardware on affected segments.",
          },
          iocs: [
            { type: "SHA-256", indicator: "064c04e861a83eed257ede4872d74de94b7c5e5a818a5968e354c97b97bc9a7d", description: "NotPetya wiper binary (perfc.dat) SHA-256 — master DLL embedding EternalBlue, Mimikatz, MBR overwriter, and fake ransom screen" },
            { type: "Event", indicator: "Raw write to \\\\.\\PhysicalDrive0 by userspace process (not VSS/backup)", description: "NotPetya MBR destruction IOA — direct physical disk access from non-system process is a wiper signature, detectable by EDR with disk API monitoring" },
            { type: "Path", indicator: "C:\\Windows\\perfc.dat", description: "NotPetya primary wiper DLL path — note: C:\\Windows\\perfc.ini is a legitimate Windows file; perfc.dat is malicious" },
          ],
        },
      ],
    },
  ],
}

export default sandworm
