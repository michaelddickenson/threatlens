const kimsuky = {
  id: "kimsuky",
  name: "Kimsuky",
  aliases: ["Thallium", "Black Banshee", "Velvet Chollima", "APT43"],
  origin: "North Korea",
  motivation: "Espionage",
  attribution: "Community Consensus",
  description:
    "Kimsuky (APT43) is a North Korean RGB-linked threat actor specializing in low-and-slow intelligence collection against Korea policy experts, academics, journalists, and think tank researchers. Unlike Lazarus Group's financially-motivated heists, Kimsuky's mission is to steal foreign policy intelligence — particularly on denuclearization, US-ROK alliance dynamics, and sanctions — for Kim regime decision-making.",
  campaigns: [
    {
      id: "academic-targeting-2021",
      name: "Academic and Policy Researcher Targeting (2021–2023)",
      year: "2021–2023",
      target: "Korea Policy Academics, Think Tanks & Journalists",
      summary:
        "Kimsuky systematically targeted Korea policy experts, academics, journalists, and think tank researchers using Gmail-based spearphishing and the SHARPEXT browser extension implant to silently steal foreign policy intelligence. The campaign prioritized non-destructive, persistent access over immediate data theft — SHARPEXT read researchers' Gmail in real time across authenticated sessions, bypassing 2FA entirely.",
      sources: [
        { title: "CISA Advisory AA23-109A — North Korea's Kimsuky APT Uses Social Engineering Tactics", publisher: "CISA / FBI / NSA", url: "https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-109a" },
        { title: "APT43: North Korean Group Uses Cybercrime to Fund Espionage Operations", publisher: "Mandiant", url: "https://www.mandiant.com/resources/blog/apt43-north-korea-cybercrime-espionage" },
        { title: "SHARPEXT: North Korean Threat Actor Installs Browser Extension to Steal Email", publisher: "Volexity", url: "https://www.volexity.com/blog/2022/07/28/north-korean-threat-actor-installs-browser-extension-to-steal-emails/" },
      ],
      diamondModel: {
        adversary: {
          name: "Kimsuky (APT43 / Thallium)",
          sponsor: "North Korean RGB — Reconnaissance General Bureau, intelligence collection tasking",
          aliases: ["Thallium", "Black Banshee", "Velvet Chollima", "APT43", "Emerald Sleet"],
          motivation: "Collect foreign policy intelligence on Korean peninsula affairs, US-ROK alliance policy, and denuclearization negotiations for Kim regime strategic decision-making",
        },
        capability: {
          malware: ["SHARPEXT browser extension", "AppleSeed RAT", "RandomQuery reconnaissance tool", "BabyShark dropper", "Custom PowerShell implants"],
          ttps: ["T1566.002 — Spearphishing Link (Gmail-based)", "T1176 — Browser Extension (SHARPEXT)", "T1539 — Steal Web Session Cookie", "T1114.002 — Remote Email Collection", "T1041 — Exfiltration over C2"],
          sophistication: "Nation-State — browser-level email theft bypasses 2FA, highly personalized OSINT-driven social engineering, targets specific policy community",
        },
        infrastructure: {
          domains: ["c-research[.]org", "mail-kr-service[.]com", "korea-policy[.]net", "academic-exchange[.]org"],
          ips: ["45.33.2[.]79", "104.200.67[.]150", "185.234.218[.]211"],
          hosting: "NameCheap-registered domains impersonating academic institutions and South Korean government portals; actor-operated VPS in US and European cloud providers for C2",
        },
        victim: {
          sectors: "Academic Korea studies programs, think tanks (CSIS, RAND, Heritage Foundation-affiliated), investigative journalists, former South Korean government officials, US/ROK policy staff",
          geography: "United States, South Korea, Japan, Europe — the global Korea policy community",
          targeting: "Individual researchers and policy experts selected for knowledge of Korean peninsula affairs, nuclear policy, US-DPRK negotiations, and US-ROK alliance dynamics",
        },
      },
      stages: [
        {
          id: "spearphishing",
          name: "Gmail Spearphishing Lure",
          ttp: "T1566.002",
          ttpName: "Phishing: Spearphishing Link",
          phase: "Initial Access",
          attacker: {
            summary:
              "Kimsuky sent highly personalized spearphishing emails from Gmail accounts impersonating academics, journalists, or think tank staff. Emails referenced targets' real published work by title and journal, creating high credibility. Links directed targets to credential phishing pages or document lures prompting browser extension installation. The actor conducted extensive OSINT beforehand — researching the target's published papers, institutional affiliation, and professional network from LinkedIn and Google Scholar.",
            tools: ["Gmail-based phishing kit", "Custom credential harvesting portal", "OSINT research (LinkedIn, Google Scholar, university websites)"],
            commands: [
              "// Phishing email from Gmail: korean.policy.review2022@gmail[.]com",
              "// Subject: 'RE: Your recent article on DPRK sanctions — commentary request'",
              "// Body references target's real work: '[Article title], [Journal name], [Year]'",
              "// Link: https://korea-policy[.]net/conference-docs/review.html",
              "// Page: Google Docs lookalike requesting account re-authentication",
              "// Alternate: link to document requiring extension for 'encrypted access'",
            ],
          },
          defender: {
            logs: [
              "Inbound email from Gmail account with link to newly-registered Korean-themed domain (email gateway log)",
              "User clicks link to uncategorized domain from corporate mail client (proxy/DNS log)",
              "Browser navigates to credential phishing page impersonating Google login (CASB / proxy content category)",
              "Google Workspace: new account login from previously-unseen IP immediately after email click (Workspace audit)",
            ],
            detection:
              "Kimsuky's phishing is highly convincing due to OSINT-driven personalization. Defense: (1) Email gateway — flag Gmail sender accounts <30 days old. (2) Domain age: block links to domains registered <30 days. (3) Google Workspace alerts: new device login immediately following email link click. (4) Security awareness training specific to Korea policy researchers — a known targeted community.",
            siemQuery:
              'index=email sender_domain="gmail.com" | eval url_domain=mvindex(split(url,"/"),2) | lookup domain_age url_domain OUTPUT age_days | where age_days < 30 | stats count by sender, recipient, url_domain | join recipient [ search index=google_workspace event="login" new_device=true ]',
            ifMissed:
              "Kimsuky harvests Google account credentials. More critically, they proceed to install SHARPEXT on the target's next browser session — creating persistent email access that survives future password resets and 2FA changes. All policy-relevant correspondence with government officials and foreign diplomats becomes accessible.",
          },
          iocs: [
            { type: "Domain", indicator: "korea-policy[.]net", description: "Kimsuky phishing domain impersonating Korean policy research institute — credential harvester and SHARPEXT delivery site" },
            { type: "Domain", indicator: "c-research[.]org", description: "Kimsuky fake academic research portal used in spearphishing campaign targeting Korea studies academics" },
            { type: "URL", indicator: "https://korea-policy[.]net/conference-docs/review.html", description: "Kimsuky phishing landing page — Google Docs lookalike requesting credential re-authentication for 'encrypted conference document'" },
          ],
        },
        {
          id: "browser-extension",
          name: "SHARPEXT Browser Extension Implant",
          ttp: "T1176",
          ttpName: "Browser Extensions",
          phase: "Persistence",
          attacker: {
            summary:
              "Kimsuky deployed SHARPEXT — a malicious Chrome/Edge extension that silently reads and exfiltrates emails from Gmail, AOL Mail, and Yahoo Mail as the victim browses. The extension was installed by directly modifying the browser's Preferences and Secure Preferences files (bypassing Web Store review) after gaining system access via the phishing stage. SHARPEXT persists across browser restarts and operates within the victim's authenticated webmail session — making 2FA entirely irrelevant.",
            tools: ["SHARPEXT Chrome/Edge extension", "Custom Python C2 server", "Browser Preferences file modifier"],
            commands: [
              "// SHARPEXT install: modify Chrome Preferences to load extension from arbitrary path",
              "// Target: C:\\Users\\<user>\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Preferences",
              "// Add 'extension_settings' JSON entry pointing to SHARPEXT directory on disk",
              "// Extension auto-loads on browser restart without user permission prompt",
              "// manifest.json permissions: ['tabs','storage','webRequest','*://*.google.com/*','*://*.yahoo.com/*']",
              "// Background script: intercepts XHR responses from mail.google.com in real time",
            ],
          },
          defender: {
            logs: [
              "Chrome Preferences file modified by non-browser process (Sysmon Event ID 11 — file modification)",
              "New browser extension loaded from non-standard path outside Chrome Web Store (EDR browser telemetry)",
              "Extension with webRequest permissions for mail domains installed outside approved list (EDR extension monitor)",
              "Browser process making unexpected outbound POST requests to newly-registered domain during Gmail session (proxy)",
            ],
            detection:
              "Chrome Group Policy: restrict extension installation to allowlisted extensions only — SHARPEXT is not on the Web Store. EDR browser extension monitoring: alert on any new extension with webRequest permissions for webmail domains (*.google.com, *.yahoo.com). Alert on Chrome Preferences file modification by any non-browser process. Chrome 127+ App-Bound Encryption defeats the Preferences-file installation vector.",
            siemQuery:
              'index=endpoint (EventCode=11 OR EventCode=2) TargetFilename="*\\Chrome\\User Data\\*Preferences" Image NOT IN ("*\\chrome.exe","*\\msedge.exe","*\\GoogleUpdate.exe") | stats count by host, user, Image, TargetFilename',
            ifMissed:
              "SHARPEXT silently reads all incoming and outgoing email in the researcher's Gmail account on every browser session. The extension operates within the authenticated session — no password or 2FA token needed after initial install. Kimsuky receives real-time copies of all policy-relevant communications with government officials, intelligence contacts, and foreign diplomats.",
          },
          iocs: [
            { type: "File", indicator: "SHARPEXT (extension_settings entry in Chrome Preferences)", description: "Kimsuky browser implant — loaded via Preferences modification bypassing Chrome Web Store, steals Gmail/Yahoo/AOL email" },
            { type: "Domain", indicator: "mail-kr-service[.]com", description: "SHARPEXT C2 server — receives exfiltrated email content via HTTPS POST from Chrome extension in victim's browser" },
            { type: "Path", indicator: "C:\\Users\\<user>\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Preferences (modified)", description: "SHARPEXT installation artifact — Preferences JSON modified to sideload malicious browser extension without user prompt" },
          ],
        },
        {
          id: "credential-theft",
          name: "Web Session Cookie Theft",
          ttp: "T1539",
          ttpName: "Steal Web Session Cookie",
          phase: "Credential Access",
          attacker: {
            summary:
              "Kimsuky used AppleSeed RAT to harvest browser session cookies from Chrome's SQLite cookie database, including Gmail, Google Drive, Microsoft 365, and South Korean government portal sessions. These cookies were exfiltrated to actor C2, enabling Kimsuky to authenticate to victim accounts from their own infrastructure without triggering password-based MFA. Cookie-based session replay bypasses SMS 2FA and TOTP codes entirely — the session is already authenticated.",
            tools: ["AppleSeed RAT (cookie harvester module)", "Chrome SQLite cookie reader", "Windows DPAPI decryptor"],
            commands: [
              "// AppleSeed targets Chrome cookie SQLite database",
              "// Path: C:\\Users\\<user>\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Network\\Cookies",
              "// SQLite query:",
              "SELECT host_key, name, value, path FROM cookies WHERE host_key LIKE '%google.com%' OR host_key LIKE '%microsoft.com%'",
              "// DPAPI decrypt: AppleSeed runs in user context — CryptUnprotectData called automatically",
              "// Cookies imported into actor browser → authenticated session without password/2FA",
            ],
          },
          defender: {
            logs: [
              "Non-browser process accessing Chrome Cookies SQLite file (Sysmon EventID 10 — file/process access)",
              "DPAPI CryptUnprotectData called by non-browser process reading Chrome cookie data (EDR API monitoring)",
              "Google Workspace: new login from previously-unseen geolocation using existing session token (Workspace audit)",
              "Outbound HTTPS upload containing compressed SQLite data from researcher workstation (proxy log)",
            ],
            detection:
              "Google Advanced Protection Program for high-risk users detects session cookie replay from new devices. EDR: alert on any non-browser process accessing Chrome's Cookies file. Chrome 127+ App-Bound Encryption re-encrypts cookies with app-specific keys, defeating DPAPI harvest. Workspace alert: session reuse from new ASN or country within 60 minutes of prior activity from different geography.",
            siemQuery:
              'index=endpoint (EventCode=10 OR EventCode=11) TargetFilename="*\\Chrome\\User Data\\*\\Cookies" NOT SourceImage IN ("*\\chrome.exe","*\\msedge.exe","*\\GoogleCrashHandler*") | stats count by host, user, SourceImage, TargetFilename',
            ifMissed:
              "Kimsuky authenticates to the researcher's Google and Microsoft 365 accounts from actor infrastructure using harvested session cookies. 2FA is bypassed entirely. All Gmail, Google Drive, Outlook, and SharePoint content is accessible. South Korean government portal sessions (e.g., e-government portals requiring smartcard) may also be replayable during active session windows.",
          },
          iocs: [
            { type: "Path", indicator: "C:\\Users\\<user>\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Network\\Cookies", description: "AppleSeed RAT target — Chrome SQLite cookie DB containing DPAPI-encrypted session tokens for Gmail and Microsoft 365" },
            { type: "Tool", indicator: "AppleSeed RAT (cookie harvester module)", description: "Kimsuky RAT with built-in browser credential harvesting — reads and decrypts Chrome DPAPI-protected session cookies" },
            { type: "IP", indicator: "45.33.2[.]79", description: "Kimsuky AppleSeed C2 server — receives exfiltrated browser session cookies and SHARPEXT email content" },
          ],
        },
        {
          id: "email-collection",
          name: "Remote Email Collection via SHARPEXT",
          ttp: "T1114.002",
          ttpName: "Email Collection: Remote Email Collection",
          phase: "Collection",
          attacker: {
            summary:
              "SHARPEXT collected emails from victim Gmail accounts in real time as the researcher browsed their inbox. The extension used Gmail's web interface APIs (available to extensions with tabs and webRequest permissions) to read message content, extract attachments, and flag high-interest correspondence. Emails containing policy keywords were immediately exfiltrated to Kimsuky C2. The collection was selective and subtle — targeting only policy-relevant communications to minimize data volume and detection risk.",
            tools: ["SHARPEXT Chrome/Edge extension", "Gmail DOM/XHR scraper", "Keyword-based email filter", "AppleSeed document collector"],
            commands: [
              "// SHARPEXT background.js hooks XHR responses from mail.google.com",
              "// Intercepts: message list and individual message fetch responses",
              "// Extracts: sender, recipient, subject, body, attachment metadata",
              "// Keyword filter (collected in real-time): ['DPRK','denuclearization','sanctions','ROK alliance','classified','embassy','nuclear']",
              "// Upload POST to C2: https://mail-kr-service[.]com/api/v1/report/{session_id}",
              "// Format: JSON with base64-encoded message body + metadata",
            ],
          },
          defender: {
            logs: [
              "Chrome extension making POST requests to non-Google/non-CDN domain while Gmail tab is active (proxy / browser network log)",
              "Sustained outbound data from Chrome browser process to Korean-policy-themed domain during work hours (NetFlow)",
              "Google Workspace: anomalously high message read rate from browser session (Workspace security alert)",
              "SHARPEXT upload events correlate with user Gmail activity timing (behavioral analysis)",
            ],
            detection:
              "Google Workspace alert policies: configure alerts for high message read rates (>100 messages/hour) from a single session. Browser enterprise policy: whitelist extensions; block extensions with webRequest permissions for mail domains unless explicitly approved. Proxy/CASB: POST requests from Chrome to newly-registered domains during active mail sessions are anomalous — legitimate browser extensions use known vendor APIs only.",
            siemQuery:
              'index=proxy process_name="chrome.exe" action=POST bytes_out > 500 dest_domain NOT IN ("google.com","googleapis.com","gstatic.com","accounts.google.com") | stats count sum(bytes_out) as total by src_ip, dest_domain | where count > 5 | sort -total',
            ifMissed:
              "Kimsuky maintains ongoing real-time access to all policy-relevant email correspondence. Policy researchers routinely communicate with government officials, intelligence contacts, and foreign diplomats via Gmail. SHARPEXT survives password resets since it authenticates via existing browser session. The Kim regime receives regular intelligence on US-ROK policy discussions and denuclearization negotiation positions.",
          },
          iocs: [
            { type: "URL Pattern", indicator: "POST /api/v1/report/{session_id} → mail-kr-service[.]com from Chrome process", description: "SHARPEXT exfiltration pattern — extension uploads intercepted Gmail content to Kimsuky C2 during active mail session" },
            { type: "Domain", indicator: "academic-exchange[.]org", description: "Alternate Kimsuky C2 domain used by SHARPEXT for email exfiltration — registered to impersonate academic exchange program" },
            { type: "Tool", indicator: "SHARPEXT v3 (background.js + content.js browser extension)", description: "Kimsuky email implant files — sideloaded into Chrome via Preferences modification, intercepts Gmail web interface API responses" },
          ],
        },
        {
          id: "exfiltration",
          name: "Document Exfiltration via AppleSeed C2",
          ttp: "T1041",
          ttpName: "Exfiltration Over C2 Channel",
          phase: "Exfiltration",
          attacker: {
            summary:
              "AppleSeed RAT exfiltrated collected policy documents, HWP files (Hangul Word Processor — common in South Korean government), and browser-cached content through its HTTPS C2 channel. RandomQuery performed targeted file discovery searching for policy-relevant documents by extension and keyword. Transfers were kept small (<5 MB per session) and rate-limited to avoid DLP thresholds, with randomized intervals to evade behavioral detection.",
            tools: ["AppleSeed RAT (C2 exfil module)", "RandomQuery (file discovery)", "PowerShell Compress-Archive", "Custom AES-256 encryptor"],
            commands: [
              "// RandomQuery: targeted policy document discovery",
              "cmd.exe /c dir /s /b C:\\Users\\%USERNAME%\\Documents 2>nul | findstr /i \".pdf .docx .pptx .hwp .zip\" > C:\\ProgramData\\Temp\\list.dat",
              "// HWP = Hangul Word Processor — common in South Korean government and academic papers",
              "powershell -c Compress-Archive (Get-Content C:\\ProgramData\\Temp\\list.dat) C:\\ProgramData\\Temp\\out.zip",
              "// HTTPS C2 upload via AppleSeed built-in module",
              "// POST https://c-research[.]org/api/files/{uid} — rate: 2 MB/upload, 15-60 min random intervals",
            ],
          },
          defender: {
            logs: [
              "AppleSeed HTTPS beacon at consistent interval from researcher workstation (NetFlow beaconing detection)",
              "PowerShell Compress-Archive targeting Documents folder with policy document extensions (Sysmon Event ID 1)",
              "findstr searching for .hwp files (Hangul Word Processor — rare outside Korean organizations) (Event ID 4688)",
              "HTTPS upload to Korean-policy-themed domain with age <180 days from workstation (proxy log)",
            ],
            detection:
              "Behavioral analytics: model baseline communication patterns per workstation — academic systems should not beacon at consistent intervals to newly-registered Korean-themed domains. Alert on PowerShell searches for .hwp files (extremely rare outside Korean academic/government environments — a reliable Kimsuky hunting signal). CISA AA23-109A provides YARA and Sigma rules for both SHARPEXT and AppleSeed.",
            siemQuery:
              'index=endpoint EventCode=4688 process_name="powershell.exe" (cmdline="*Compress-Archive*" OR cmdline="*.hwp*" OR cmdline="*findstr*\.docx*") | stats count by host, user, cmdline | join host [ search index=network dest_domain_age < 180 action=POST bytes_out > 50000 | stats count by src_ip, dest_domain ] | where count > 0',
            ifMissed:
              "Kimsuky systematically collects all policy research documents from the researcher's workstation — unpublished papers, private policy analysis, correspondence with government officials, and briefing materials. This intelligence directly informs Kim regime decisions on nuclear negotiations, sanctions evasion strategies, and assessment of US-ROK alliance cohesion. The campaign typically runs for months before detection.",
          },
          iocs: [
            { type: "Domain", indicator: "c-research[.]org", description: "Kimsuky AppleSeed RAT C2 domain — HTTPS exfil channel for policy documents and browser credential data" },
            { type: "IP", indicator: "104.200.67[.]150", description: "Kimsuky C2 server IP — receives AppleSeed compressed document archives from targeted researcher workstations" },
            { type: "File", indicator: "C:\\ProgramData\\Temp\\out.zip", description: "AppleSeed staging archive — compressed collection of policy documents including HWP files, staged before exfiltration" },
          ],
        },
      ],
    },
  ],
}

export default kimsuky
