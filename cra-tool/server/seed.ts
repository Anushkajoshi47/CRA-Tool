import 'dotenv/config';
import mongoose from 'mongoose';
import Requirement from './models/Requirement';

const requirements = [
  // ─── Annex I Part I — Security Properties (13) ───────────────────────────
  {
    annex: 'Annex I, Part I',
    articleRef: 'Annex I, Part I(1)',
    pillar: 'Security Properties',
    title: 'No Default Passwords',
    legalText:
      'Products with digital elements shall be designed, developed and produced in such a way that they are delivered without known exploitable vulnerabilities and with a secure by default configuration, including the possibility to reset the product to its original state, and, where such a product may not contain any data that existed before reset, no use of common weak or default passwords.',
    plainEnglish:
      'Your product must not ship with well-known default passwords like "admin/admin". Each unit must have a unique credential or force the user to set one on first use.',
    appliesToClass: ['default', 'class_i', 'class_ii', 'critical'],
    urgent: false,
    evidenceRequired: [
      'Password policy documentation',
      'Proof of unique per-device credentials or forced change on first login',
      'Test report showing no default credentials accepted',
    ],
    sortOrder: 1,
  },
  {
    annex: 'Annex I, Part I',
    articleRef: 'Annex I, Part I(2)(a)',
    pillar: 'Security Properties',
    title: 'Encrypted Communications',
    legalText:
      'Products with digital elements shall protect the confidentiality and integrity of stored, transmitted or otherwise processed data, personal or other, such as by encrypting relevant data at rest or in transit using state of the art mechanisms.',
    plainEnglish:
      'All data the drive sends or stores — including configuration parameters, logs, and user credentials — must be encrypted using current best-practice algorithms (e.g., TLS 1.2+, AES-256).',
    appliesToClass: ['default', 'class_i', 'class_ii', 'critical'],
    urgent: false,
    evidenceRequired: [
      'List of all communication interfaces and encryption protocols used',
      'TLS/cipher suite configuration evidence',
      'Penetration test or protocol analysis report',
    ],
    sortOrder: 2,
  },
  {
    annex: 'Annex I, Part I',
    articleRef: 'Annex I, Part I(2)(b)',
    pillar: 'Security Properties',
    title: 'Access Control',
    legalText:
      'Products with digital elements shall protect the confidentiality and integrity of stored, transmitted or otherwise processed data, personal or other, such as by encrypting relevant data at rest or in transit using state of the art mechanisms, including where applicable controlling access to and protecting from unauthorised access.',
    plainEnglish:
      'The drive must enforce proper authentication and role-based access controls. Only authorised users or systems should be able to read sensitive data or issue control commands.',
    appliesToClass: ['default', 'class_i', 'class_ii', 'critical'],
    urgent: false,
    evidenceRequired: [
      'Access control matrix / RBAC documentation',
      'Authentication mechanism specification',
      'Evidence of least-privilege enforcement',
    ],
    sortOrder: 3,
  },
  {
    annex: 'Annex I, Part I',
    articleRef: 'Annex I, Part I(3)',
    pillar: 'Security Properties',
    title: 'Secure Configuration',
    legalText:
      'Products with digital elements shall be designed, developed and produced in such a way that they are delivered with a secure by default configuration, including the possibility to reset the product to its original state, where applicable in a way that does not compromise the security of the device.',
    plainEnglish:
      'The GH180 must ship with the most restrictive settings enabled by default. Unnecessary services, ports, and features must be disabled out of the box. A secure factory reset must be possible.',
    appliesToClass: ['default', 'class_i', 'class_ii', 'critical'],
    urgent: false,
    evidenceRequired: [
      'Default configuration hardening guide',
      'List of services/ports disabled by default',
      'Factory reset procedure documentation',
    ],
    sortOrder: 4,
  },
  {
    annex: 'Annex I, Part I',
    articleRef: 'Annex I, Part I(4)',
    pillar: 'Security Properties',
    title: 'Data Minimisation',
    legalText:
      'Products with digital elements shall process only data, personal or other, that are adequate, relevant and limited to what is necessary in relation to the intended use of the product (data minimisation).',
    plainEnglish:
      'The drive should only collect and process data strictly necessary for its operation. Avoid logging excessive personal or operational data that is not needed for the drive\'s function.',
    appliesToClass: ['default', 'class_i', 'class_ii', 'critical'],
    urgent: false,
    evidenceRequired: [
      'Data flow diagram showing what data is collected',
      'Justification for each data element collected',
      'Data retention policy',
    ],
    sortOrder: 5,
  },
  {
    annex: 'Annex I, Part I',
    articleRef: 'Annex I, Part I(5)',
    pillar: 'Security Properties',
    title: 'Availability Protection',
    legalText:
      'Products with digital elements shall protect the availability of essential functions, including the resilience against and mitigation of denial of service attacks.',
    plainEnglish:
      'The drive\'s core motor control functions must remain available even under network attack. Implement protections against flooding, resource exhaustion, and denial-of-service conditions on any network interface.',
    appliesToClass: ['default', 'class_i', 'class_ii', 'critical'],
    urgent: false,
    evidenceRequired: [
      'DoS resilience test results',
      'Network rate-limiting or watchdog configuration',
      'Fail-safe behaviour specification for network unavailability',
    ],
    sortOrder: 6,
  },
  {
    annex: 'Annex I, Part I',
    articleRef: 'Annex I, Part I(6)',
    pillar: 'Security Properties',
    title: 'Attack Surface Reduction',
    legalText:
      'Products with digital elements shall minimise their own attack surface, including external interfaces.',
    plainEnglish:
      'Disable or remove every feature, port, protocol, and interface not needed for the product\'s intended use. The fewer entry points, the lower the risk.',
    appliesToClass: ['default', 'class_i', 'class_ii', 'critical'],
    urgent: false,
    evidenceRequired: [
      'Port/service inventory with justification for each open port',
      'Attack surface analysis report',
      'Evidence of unused interface disablement',
    ],
    sortOrder: 7,
  },
  {
    annex: 'Annex I, Part I',
    articleRef: 'Annex I, Part I(7)',
    pillar: 'Security Properties',
    title: 'Exploitation Mitigation',
    legalText:
      'Products with digital elements shall be designed, developed and produced to limit the impact of exploitation, by providing security related update mechanisms and by ensuring that a product with digital elements is protected by mitigations against exploitation of known vulnerabilities.',
    plainEnglish:
      'Use modern software hardening techniques (ASLR, stack canaries, code signing) to make exploitation harder, and ensure the update mechanism itself cannot be weaponised.',
    appliesToClass: ['default', 'class_i', 'class_ii', 'critical'],
    urgent: false,
    evidenceRequired: [
      'Compiler/build hardening flags documentation',
      'Code signing certificate and verification procedure',
      'Binary hardening analysis (e.g., checksec output)',
    ],
    sortOrder: 8,
  },
  {
    annex: 'Annex I, Part I',
    articleRef: 'Annex I, Part I(8)',
    pillar: 'Security Properties',
    title: 'Data & System Integrity',
    legalText:
      'Products with digital elements shall ensure the integrity of data, software and configuration, by suitable mechanisms, such as cryptographic methods or trusted execution.',
    plainEnglish:
      'The firmware, configuration files, and operational data must be protected against unauthorised modification. Use cryptographic signatures to verify integrity at boot and during updates.',
    appliesToClass: ['default', 'class_i', 'class_ii', 'critical'],
    urgent: false,
    evidenceRequired: [
      'Secure boot implementation evidence',
      'Firmware signature verification procedure',
      'Configuration integrity check mechanism',
    ],
    sortOrder: 9,
  },
  {
    annex: 'Annex I, Part I',
    articleRef: 'Annex I, Part I(9)',
    pillar: 'Security Properties',
    title: 'Security Logging',
    legalText:
      'Products with digital elements shall record and/or monitor relevant security data, without compromising the security of the data, giving the user the option to delete this data, and protect the data from abuse.',
    plainEnglish:
      'Log security-relevant events (login attempts, configuration changes, firmware updates, errors). Protect logs from tampering, and allow authorised users to delete logs when needed.',
    appliesToClass: ['default', 'class_i', 'class_ii', 'critical'],
    urgent: false,
    evidenceRequired: [
      'List of security events that are logged',
      'Log integrity protection mechanism',
      'Log retention and deletion procedure',
    ],
    sortOrder: 10,
  },
  {
    annex: 'Annex I, Part I',
    articleRef: 'Annex I, Part I(10)',
    pillar: 'Security Properties',
    title: 'Secure Erasure',
    legalText:
      'Products with digital elements shall ensure that personal data and sensitive security data can be erased when the product reaches end of life or is sold or returned.',
    plainEnglish:
      'Provide a secure factory reset or data wipe function so that when the drive is decommissioned, resold, or returned, all sensitive data (credentials, logs, configuration) is irreversibly removed.',
    appliesToClass: ['default', 'class_i', 'class_ii', 'critical'],
    urgent: false,
    evidenceRequired: [
      'Secure erase / factory reset procedure',
      'Evidence that erase is cryptographically sound (not just file deletion)',
      'End-of-life data handling policy',
    ],
    sortOrder: 11,
  },
  {
    annex: 'Annex I, Part I',
    articleRef: 'Annex I, Part I(11)',
    pillar: 'Security Properties',
    title: 'Risk-Based Security Design',
    legalText:
      'Products with digital elements shall be designed, developed and produced with a view to minimising their cybersecurity risks, which includes mapping and assessing the risks that the product may pose to third parties, assessing the severity of the vulnerabilities discovered and deciding the measures needed to address them.',
    plainEnglish:
      'A formal security risk assessment must be conducted for the GH180, covering threats from its network interfaces and remote access capabilities. Document identified risks and mitigations.',
    appliesToClass: ['default', 'class_i', 'class_ii', 'critical'],
    urgent: false,
    evidenceRequired: [
      'Cybersecurity risk assessment document (threat model)',
      'Risk register with severity ratings',
      'Documented mitigations for each identified risk',
    ],
    sortOrder: 12,
  },
  {
    annex: 'Annex I, Part I',
    articleRef: 'Annex I, Part I(12)',
    pillar: 'Security Properties',
    title: 'Secure Update Mechanism',
    legalText:
      'Products with digital elements shall provide security related updates for a defined support period determined by the manufacturer, ensuring these updates are installed with minimal friction for the end user and ensuring the update mechanism itself is secure and protected.',
    plainEnglish:
      'Provide a secure, authenticated firmware update process. Updates must be cryptographically signed. The update channel itself must not be exploitable. Users should be notified of available updates.',
    appliesToClass: ['default', 'class_i', 'class_ii', 'critical'],
    urgent: false,
    evidenceRequired: [
      'Firmware update architecture description',
      'Update signature verification procedure',
      'User notification mechanism for updates',
    ],
    sortOrder: 13,
  },

  // ─── Annex I Part II — Vulnerability Handling (8) ────────────────────────
  {
    annex: 'Annex I, Part II',
    articleRef: 'Annex I, Part II(1)',
    pillar: 'Vulnerability Handling',
    title: 'Software Bill of Materials (SBOM)',
    legalText:
      'Manufacturers shall identify and document vulnerabilities and components contained in products with digital elements, including by drawing up a software bill of materials in a commonly used and machine-readable format covering at a minimum the top-level dependencies of the products.',
    plainEnglish:
      'Create and maintain a machine-readable list (SBOM) of every software component, library, and dependency in the GH180\'s firmware. This must be kept updated throughout the product\'s lifecycle.',
    appliesToClass: ['default', 'class_i', 'class_ii', 'critical'],
    urgent: false,
    evidenceRequired: [
      'SBOM file in CycloneDX or SPDX format',
      'Process for updating SBOM when components change',
      'Tool or process used to generate SBOM',
    ],
    sortOrder: 14,
  },
  {
    annex: 'Annex I, Part II',
    articleRef: 'Annex I, Part II(2)',
    pillar: 'Vulnerability Handling',
    title: 'Vulnerability Remediation',
    legalText:
      'Manufacturers shall, without delay, address and remediate vulnerabilities, including by providing security updates, and shall take appropriate measures as regards components obtained from third parties.',
    plainEnglish:
      'When a vulnerability is discovered in the GH180 or any of its third-party components, Innomotics must fix it promptly and release a security update. Have a process for monitoring third-party component vulnerabilities.',
    appliesToClass: ['default', 'class_i', 'class_ii', 'critical'],
    urgent: false,
    evidenceRequired: [
      'Vulnerability management SOP',
      'SLA for critical vulnerability patching',
      'Evidence of third-party component monitoring (e.g., NVD feed subscription)',
    ],
    sortOrder: 15,
  },
  {
    annex: 'Annex I, Part II',
    articleRef: 'Annex I, Part II(3)',
    pillar: 'Vulnerability Handling',
    title: 'Security Testing',
    legalText:
      'Manufacturers shall apply effective and regular testing and reviews of the security of products with digital elements.',
    plainEnglish:
      'Conduct regular security testing — including penetration testing, fuzz testing, and code reviews — on the GH180 firmware and interfaces. Tests should be repeated when significant changes are made.',
    appliesToClass: ['default', 'class_i', 'class_ii', 'critical'],
    urgent: false,
    evidenceRequired: [
      'Penetration test reports',
      'Fuzz testing results',
      'Security code review records',
      'Testing frequency policy',
    ],
    sortOrder: 16,
  },
  {
    annex: 'Annex I, Part II',
    articleRef: 'Annex I, Part II(4)',
    pillar: 'Vulnerability Handling',
    title: 'Public Vulnerability Disclosure',
    legalText:
      'Manufacturers shall, once a security update has been made available, publicly disclose information on fixed vulnerabilities, including a description of the vulnerabilities, information allowing users to identify the affected products with digital elements, the impacts of the vulnerabilities, and information helping users to remediate the vulnerabilities.',
    plainEnglish:
      'After releasing a fix, publicly disclose details of the vulnerability — what it was, which product versions were affected, its impact, and how users can apply the fix.',
    appliesToClass: ['default', 'class_i', 'class_ii', 'critical'],
    urgent: false,
    evidenceRequired: [
      'Public security advisory template',
      'Published security advisories (examples)',
      'Disclosure timeline process',
    ],
    sortOrder: 17,
  },
  {
    annex: 'Annex I, Part II',
    articleRef: 'Annex I, Part II(5)',
    pillar: 'Vulnerability Handling',
    title: 'Coordinated Vulnerability Disclosure (CVD) Policy',
    legalText:
      'Manufacturers shall put in place and enforce a policy on coordinated vulnerability disclosure and take the necessary measures to enable the reporting of vulnerabilities.',
    plainEnglish:
      'Publish a clear Coordinated Vulnerability Disclosure (CVD) policy explaining how external researchers can responsibly report security issues to Innomotics, and commit to acknowledging and responding to reports.',
    appliesToClass: ['default', 'class_i', 'class_ii', 'critical'],
    urgent: false,
    evidenceRequired: [
      'Published CVD policy (URL or document)',
      'security.txt file at product/company website',
      'Internal SOP for handling received vulnerability reports',
    ],
    sortOrder: 18,
  },
  {
    annex: 'Annex I, Part II',
    articleRef: 'Annex I, Part II(6)',
    pillar: 'Vulnerability Handling',
    title: 'Reporting Contact Point',
    legalText:
      'Manufacturers shall designate a single point of contact to allow third parties to report vulnerabilities discovered in their products, and make that contact information easily accessible.',
    plainEnglish:
      'Provide a clearly published contact (e.g., security@innomotics.com or a web form) that anyone can use to report a security vulnerability in the GH180. This contact must be actively monitored.',
    appliesToClass: ['default', 'class_i', 'class_ii', 'critical'],
    urgent: false,
    evidenceRequired: [
      'Published security contact details',
      'Monitoring SLA for the contact inbox',
      'Acknowledgement response template',
    ],
    sortOrder: 19,
  },
  {
    annex: 'Annex I, Part II',
    articleRef: 'Annex I, Part II(7)',
    pillar: 'Vulnerability Handling',
    title: 'Secure Software Updates',
    legalText:
      'Manufacturers shall ensure that, where security updates are available to address identified vulnerabilities, they are disseminated without delay and, where technically feasible, automatically, and that a notice is published.',
    plainEnglish:
      'Security patches must be distributed quickly and, where possible, automatically to devices in the field. Users must be notified when an update is available and what it fixes.',
    appliesToClass: ['default', 'class_i', 'class_ii', 'critical'],
    urgent: false,
    evidenceRequired: [
      'Update distribution mechanism description',
      'Automatic update capability evidence (or justification if not feasible)',
      'User notification process for security updates',
    ],
    sortOrder: 20,
  },
  {
    annex: 'Annex I, Part II',
    articleRef: 'Annex I, Part II(8)',
    pillar: 'Vulnerability Handling',
    title: 'Free Security Updates',
    legalText:
      'Manufacturers shall ensure that security updates are provided free of charge during the defined support period, unless the manufacturer can demonstrate that the separate charging for such updates is justified.',
    plainEnglish:
      'Security updates must be provided to GH180 customers at no additional cost for the entire declared support period. Do not charge for patches that fix security vulnerabilities.',
    appliesToClass: ['default', 'class_i', 'class_ii', 'critical'],
    urgent: false,
    evidenceRequired: [
      'Commercial terms confirming free security updates',
      'Support period declaration in product documentation',
      'Customer communication confirming free update policy',
    ],
    sortOrder: 21,
  },

  // ─── Article 14 — Incident Reporting (4, all urgent) ─────────────────────
  {
    annex: 'Article 14',
    articleRef: 'Article 14(1)',
    pillar: 'Incident Reporting',
    title: '24-Hour Early Warning — Actively Exploited Vulnerability',
    legalText:
      'Manufacturers shall notify ENISA and, where applicable, the relevant national CSIRTs, without undue delay and in any event within 24 hours of becoming aware of an actively exploited vulnerability contained in the product with digital elements, that early warning.',
    plainEnglish:
      'If you discover that a vulnerability in the GH180 is being actively exploited in the wild, you must send an early warning to ENISA (and your national CSIRT) within 24 hours of finding out — even before you have a fix.',
    appliesToClass: ['default', 'class_i', 'class_ii', 'critical'],
    urgent: true,
    evidenceRequired: [
      'Incident response plan with 24-hour notification procedure',
      'ENISA and national CSIRT contact details on file',
      'Notification template for early warning',
      'Internal escalation procedure for detected exploitation',
    ],
    sortOrder: 22,
  },
  {
    annex: 'Article 14',
    articleRef: 'Article 14(2)',
    pillar: 'Incident Reporting',
    title: '72-Hour Vulnerability Notification',
    legalText:
      'Manufacturers shall notify ENISA and, where applicable, the relevant national CSIRTs, without undue delay and in any event within 72 hours of becoming aware of an actively exploited vulnerability contained in the product with digital elements, a vulnerability notification.',
    plainEnglish:
      'Within 72 hours of learning about an actively exploited vulnerability, submit a fuller notification to ENISA and your national CSIRT with more detail on the vulnerability, affected versions, and any interim mitigations.',
    appliesToClass: ['default', 'class_i', 'class_ii', 'critical'],
    urgent: true,
    evidenceRequired: [
      '72-hour notification procedure in incident response plan',
      'Notification form/template with required fields',
      'Evidence of process drill or tabletop exercise',
    ],
    sortOrder: 23,
  },
  {
    annex: 'Article 14',
    articleRef: 'Article 14(3)',
    pillar: 'Incident Reporting',
    title: '14-Day Final Vulnerability Report',
    legalText:
      'Manufacturers shall submit a final report to ENISA and, where applicable, to the relevant national CSIRTs, no later than 14 days after a security update or other corrective measures have been made available, with information on the vulnerability including its severity, the impact and, where available, information attributing the vulnerability to a particular party.',
    plainEnglish:
      'After releasing a fix for an actively exploited vulnerability, submit a final detailed report to ENISA within 14 days. This should include CVE details, severity score, impact, and root cause if known.',
    appliesToClass: ['default', 'class_i', 'class_ii', 'critical'],
    urgent: true,
    evidenceRequired: [
      'Final report template with all required fields',
      '14-day SLA in incident response plan',
      'CVE registration process',
    ],
    sortOrder: 24,
  },
  {
    annex: 'Article 14',
    articleRef: 'Article 14(4)',
    pillar: 'Incident Reporting',
    title: '24-Hour Early Warning — Security Incident',
    legalText:
      'Manufacturers shall notify ENISA and, where applicable, the relevant national CSIRTs, without undue delay and in any event within 24 hours of becoming aware of a severe security incident having an impact on the security of the product with digital elements.',
    plainEnglish:
      'If a serious security incident affects the GH180 (e.g., a major breach, system compromise, or safety-impacting attack), you must notify ENISA and your national CSIRT within 24 hours of becoming aware.',
    appliesToClass: ['default', 'class_i', 'class_ii', 'critical'],
    urgent: true,
    evidenceRequired: [
      'Security incident definition and severity classification',
      '24-hour CSIRT/ENISA notification procedure for incidents',
      'On-call contact list for incident response team',
    ],
    sortOrder: 25,
  },

  // ─── Annex VII — Documentation (6) ───────────────────────────────────────
  {
    annex: 'Annex VII',
    articleRef: 'Annex VII(1)',
    pillar: 'Documentation',
    title: 'Product Description',
    legalText:
      'The technical documentation shall contain at least the following information: a general description of the product with digital elements including its intended use, the product category and any other general information relevant for understanding the cybersecurity of the product.',
    plainEnglish:
      'Prepare a technical document describing what the GH180 is, what it does, who uses it, and its general cybersecurity characteristics. This forms the foundation of your technical file.',
    appliesToClass: ['default', 'class_i', 'class_ii', 'critical'],
    urgent: false,
    evidenceRequired: [
      'Product description document',
      'Intended use statement',
      'Product category classification document',
    ],
    sortOrder: 26,
  },
  {
    annex: 'Annex VII',
    articleRef: 'Annex VII(2)',
    pillar: 'Documentation',
    title: 'Design & Development Description',
    legalText:
      'The technical documentation shall include: a description of the design and development of the product with digital elements, including, where applicable, drawings and schematics and a description of the system architecture explaining how software components interact with each other and with the hardware.',
    plainEnglish:
      'Document the GH180\'s software and hardware architecture, including component diagrams, data flow between modules, and how the firmware interfaces with the drive hardware and any network interface.',
    appliesToClass: ['default', 'class_i', 'class_ii', 'critical'],
    urgent: false,
    evidenceRequired: [
      'Software architecture diagram',
      'Hardware/software interface description',
      'Data flow diagrams',
      'Component interaction documentation',
    ],
    sortOrder: 27,
  },
  {
    annex: 'Annex VII',
    articleRef: 'Annex VII(3)',
    pillar: 'Documentation',
    title: 'Cybersecurity Risk Assessment',
    legalText:
      'The technical documentation shall include: a cybersecurity risk assessment of the product with digital elements, covering the security risks associated with the intended use and foreseeable misuse, the severity of these risks, and the measures taken to address them.',
    plainEnglish:
      'Produce a formal cybersecurity risk assessment document for the GH180 that identifies threats, assesses likelihood and impact, and maps each risk to a specific mitigation. This must be kept current throughout the product lifecycle.',
    appliesToClass: ['default', 'class_i', 'class_ii', 'critical'],
    urgent: false,
    evidenceRequired: [
      'Cybersecurity risk assessment report (current version)',
      'Threat model (STRIDE or similar)',
      'Risk register with mitigation mapping',
      'Review/update schedule for the risk assessment',
    ],
    sortOrder: 28,
  },
  {
    annex: 'Annex VII',
    articleRef: 'Annex VII(4)',
    pillar: 'Documentation',
    title: 'Support Period Justification',
    legalText:
      'The technical documentation shall include: a description of the support period of the product with digital elements and the rationale for the duration of the support period, taking into account the expected lifetime of the product, the reasonable expectations of users, and the purpose of the product.',
    plainEnglish:
      'Document how long you will provide security support for the GH180 and explain why that period is appropriate given the product\'s expected operational lifetime in industrial environments.',
    appliesToClass: ['default', 'class_i', 'class_ii', 'critical'],
    urgent: false,
    evidenceRequired: [
      'Support period declaration (number of years)',
      'Rationale document explaining why that period is appropriate',
      'Customer-facing support commitment statement',
    ],
    sortOrder: 29,
  },
  {
    annex: 'Annex VII',
    articleRef: 'Annex VII(5)',
    pillar: 'Documentation',
    title: 'Standards Applied',
    legalText:
      'The technical documentation shall include: a list of the harmonised standards applied in full or in part, and, where those harmonised standards have not been applied, descriptions of the solutions adopted to meet the essential requirements set out in Annex I, including a list of other relevant technical standards and specifications applied.',
    plainEnglish:
      'List all cybersecurity standards and norms used during development (e.g., IEC 62443, EN 303 645, ETSI EN 17927) and explain how they help meet CRA requirements. If no harmonised standard exists yet, describe your equivalent approach.',
    appliesToClass: ['default', 'class_i', 'class_ii', 'critical'],
    urgent: false,
    evidenceRequired: [
      'List of applicable harmonised standards with version numbers',
      'Standards gap analysis or compliance matrix',
      'Where no harmonised standard: description of equivalent measures',
    ],
    sortOrder: 30,
  },
  {
    annex: 'Annex VII',
    articleRef: 'Annex VII(6)',
    pillar: 'Documentation',
    title: 'Test Reports',
    legalText:
      'The technical documentation shall include: the results of tests carried out for the purpose of conformity assessment, including results of security testing, and the test protocols used.',
    plainEnglish:
      'Include actual test results (penetration tests, vulnerability scans, functional security tests) in the technical file. These results demonstrate that the GH180 meets the security requirements in practice, not just on paper.',
    appliesToClass: ['default', 'class_i', 'class_ii', 'critical'],
    urgent: false,
    evidenceRequired: [
      'Penetration test reports (current)',
      'Vulnerability scan results',
      'Security functional test protocols and results',
      'Third-party audit reports (if applicable)',
    ],
    sortOrder: 31,
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    await Requirement.deleteMany({});
    console.log('Cleared existing requirements');

    await Requirement.insertMany(requirements);
    console.log(`Seeded ${requirements.length} requirements`);

    await mongoose.disconnect();
    console.log('Done. Database disconnected.');
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
}

seed();
