// AI safety law and policy around the world. Written by hand and checked
// against official sources and legal trackers; see REVIEWED below. This is a
// plain-language overview, not legal advice. Update it when the law changes.

export const REVIEWED = '2026-10-06';

export type Status = 'In force' | 'Partly in force' | 'Coming' | 'Proposed' | 'Voluntary' | 'Paused';

export interface Measure { name: string; date: string; status: Status; note: string; url: string }
export interface Jurisdiction {
  slug: string; name: string; code: string; approach: string; regulator: string;
  summary: string; watch: string; measures: Measure[]; match: RegExp;
}

export const JURISDICTIONS: Jurisdiction[] = [
  {
    slug: 'eu', name: 'European Union', code: 'EU',
    approach: 'One comprehensive, risk-based law: the AI Act.',
    regulator: 'European AI Office (European Commission) and national authorities',
    summary: 'The AI Act sorts AI by risk. Some uses are banned outright, “high-risk” systems face strict duties, and general-purpose models (like the big chatbots) must document training and, for the most capable ones, assess and reduce systemic risks. In 2026 the EU passed a “Digital Omnibus” that gives companies more time for the high-risk rules.',
    watch: 'Transparency and labelling duties (including watermarking AI-generated content) still arrive on 2 December 2026; the stand-alone high-risk rules now start on 2 December 2027.',
    measures: [
      { name: 'AI Act (Regulation 2024/1689)', date: '2024-08-01', status: 'Partly in force', note: 'Entered into force August 2024. Bans on prohibited practices since February 2025; general-purpose AI model duties since August 2025.', url: 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj' },
      { name: 'General-Purpose AI Code of Practice', date: '2025-07-10', status: 'Voluntary', note: 'A code model providers can sign to show they meet the AI Act’s rules on transparency, copyright, safety and security.', url: 'https://digital-strategy.ec.europa.eu/en/policies/contents-code-gpai' },
      { name: 'Digital Omnibus (Regulation 2026/1744)', date: '2026-07-27', status: 'In force', note: 'Moves stand-alone high-risk obligations from August 2026 to 2 December 2027 (and AI in regulated products to August 2028). Transparency rules unchanged.', url: 'https://www.orrick.com/en/Insights/2026/07/EU-AI-Act-Update-Digital-Omnibus-Finalizes-8-Compliance-Changes' },
      { name: 'European AI Office', date: '2024-02-21', status: 'In force', note: 'The Commission body that supervises general-purpose AI models and coordinates enforcement.', url: 'https://digital-strategy.ec.europa.eu/en/policies/ai-office' },
    ],
    match: /\b(EU|E\.U\.|European (Union|Commission|Parliament)|Brussels|AI Act|Digital Omnibus|AI Office)\b/,
  },
  {
    slug: 'china', name: 'China', code: 'CN',
    approach: 'Many targeted, binding rules issued by regulators; a single AI law is being drafted.',
    regulator: 'Cyberspace Administration of China (CAC), with NDRC, MIIT and the standards body TC260',
    summary: 'China regulates AI piece by piece, and much of it is binding: rules for recommendation algorithms (2022), deepfakes / “deep synthesis” (2023), generative AI services (2023) and mandatory labelling of AI-generated content (2025). In 2026 it added the first national rules for AI agents, ethics guidelines, and rules for “anthropomorphic” AI such as virtual companions.',
    watch: 'The State Council’s 2026 legislative plan speeds up drafting of a comprehensive AI law, which has been on the agenda since 2023 but is not yet passed.',
    measures: [
      { name: 'Interim Measures for Generative AI Services', date: '2023-08-15', status: 'In force', note: 'Public generative AI services must register, keep content lawful, label outputs and protect users.', url: 'https://www.chinalawtranslate.com/en/generative-ai-interim/' },
      { name: 'Measures for Labeling AI-Generated Content', date: '2025-09-01', status: 'In force', note: 'AI-generated text, images, audio and video must carry visible and/or embedded labels.', url: 'https://www.chinalawtranslate.com/en/ai-labeling/' },
      { name: 'AI agents framework; ethics guidelines; anthropomorphic AI rules', date: '2026-07-15', status: 'In force', note: 'May–July 2026: the first national policy on agentic AI, TC260 ethics-safety guidelines (from 1 July) and rules for AI companions (from 15 July).', url: 'https://iapp.org/news/a/china-s-new-ai-rules-ethics-ai-agents-and-anthropomorphic-ai' },
      { name: 'Comprehensive AI Law', date: '2026-01-01', status: 'Proposed', note: 'On the State Council’s 2026 legislative work plan; drafting accelerated but not yet adopted.', url: 'https://www.cac.gov.cn' },
    ],
    match: /\b(China|Chinese|Beijing|CAC|Cyberspace Administration|DeepSeek|Xi Jinping)\b/,
  },
  {
    slug: 'uk', name: 'United Kingdom', code: 'UK',
    approach: 'No AI-specific law yet; existing regulators apply current law, plus a world-leading testing institute.',
    regulator: 'AI Security Institute (DSIT), with sector regulators such as Ofcom, the ICO, the FCA and the MHRA',
    summary: 'The UK hosted the first global AI Safety Summit at Bletchley Park in 2023 and set up the first government AI safety institute, renamed the AI Security Institute in 2025. It tests frontier models before release under agreements with major labs. AI is otherwise governed by existing law such as data protection and online safety rules.',
    watch: 'The government has promised a frontier AI bill that would put the AI Security Institute on a legal footing and could require pre-release testing, but as of October 2026 no bill has been introduced to Parliament.',
    measures: [
      { name: 'AI Security Institute', date: '2023-11-02', status: 'In force', note: 'Government body that researches and tests advanced AI; renamed from the AI Safety Institute in February 2025.', url: 'https://www.aisi.gov.uk' },
      { name: 'Bletchley Declaration', date: '2023-11-01', status: 'Voluntary', note: '28 countries including the US and China, plus the EU, agreed that frontier AI risks need international cooperation.', url: 'https://www.gov.uk/government/publications/ai-safety-summit-2023-the-bletchley-declaration' },
      { name: 'Pro-innovation approach to AI regulation (white paper)', date: '2023-03-29', status: 'Voluntary', note: 'Five principles applied by existing regulators rather than a new AI regulator.', url: 'https://www.gov.uk/government/publications/ai-regulation-a-pro-innovation-approach' },
      { name: 'Data (Use and Access) Act 2025', date: '2025-06-19', status: 'In force', note: 'Updates UK data protection rules, including for automated decision-making.', url: 'https://www.legislation.gov.uk/ukpga/2025/18' },
      { name: 'Frontier AI bill', date: '2026-01-01', status: 'Proposed', note: 'Promised by the government; not yet introduced.', url: 'https://www.aisi.gov.uk' },
    ],
    match: /\b(UK|U\.K\.|United Kingdom|Britain|British|Westminster|Ofcom|AI Security Institute|AISI|Bletchley)\b/,
  },
  {
    slug: 'un', name: 'United Nations', code: 'UN',
    approach: 'Global coordination: shared science and dialogue, not binding rules.',
    regulator: 'UN General Assembly; Independent International Scientific Panel on AI; Global Dialogue on AI Governance',
    summary: 'In 2024 all UN members agreed a resolution on “safe, secure and trustworthy” AI. In August 2025 the General Assembly created two new bodies: a 40-member Independent International Scientific Panel on AI (like the IPCC for climate) and an annual Global Dialogue where governments discuss AI governance.',
    watch: 'The Scientific Panel published its preliminary report on 1 July 2026, and the first Global Dialogue met in Geneva on 6–7 July 2026. The next steps are the Panel’s full assessment and the 2027 Dialogue.',
    measures: [
      { name: 'Resolution 78/265: safe, secure and trustworthy AI', date: '2024-03-21', status: 'Voluntary', note: 'The first General Assembly resolution on AI, adopted by consensus.', url: 'https://docs.un.org/en/A/RES/78/265' },
      { name: '“Governing AI for Humanity” report', date: '2024-09-19', status: 'Voluntary', note: 'Final report of the Secretary-General’s High-level Advisory Body on AI.', url: 'https://www.un.org/en/ai-advisory-body' },
      { name: 'Independent International Scientific Panel on AI', date: '2026-02-12', status: 'In force', note: '40 experts serving 2026–2029; preliminary report released 1 July 2026.', url: 'https://www.un.org/independent-international-scientific-panel-ai/en' },
      { name: 'Global Dialogue on AI Governance', date: '2026-07-06', status: 'In force', note: 'First annual session held in Geneva, 6–7 July 2026.', url: 'https://www.un.org/global-dialogue-ai-governance/en' },
    ],
    match: /\b(UN|U\.N\.|United Nations|UNESCO|Guterres|General Assembly|Global Dialogue on AI)\b/,
  },
  {
    slug: 'us', name: 'United States', code: 'US',
    approach: 'No comprehensive federal law; federal policy favours speed, while states pass their own safety laws.',
    regulator: 'Center for AI Standards and Innovation (NIST), the FTC and state attorneys general',
    summary: 'Washington has no general AI statute. The 2023 executive order on AI safety was revoked in January 2025, and the July 2025 AI Action Plan focuses on innovation and infrastructure. States have moved instead: California’s SB 53 requires the largest AI developers to publish safety frameworks and report critical incidents, and New York’s RAISE Act follows in 2027.',
    watch: 'A December 2025 executive order directs a federal challenge to state AI laws, but as of autumn 2026 no court or federal law has blocked one. Colorado’s AI Act was delayed again, to 2027.',
    measures: [
      { name: 'California SB 53: Transparency in Frontier AI Act', date: '2026-01-01', status: 'In force', note: 'Large frontier developers must publish risk frameworks, report critical safety incidents within 15 days and protect whistleblowers.', url: 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202520260SB53' },
      { name: 'New York RAISE Act', date: '2027-01-01', status: 'Coming', note: 'Frontier-model safety plans and 72-hour incident reporting; signed, takes effect January 2027.', url: 'https://fpf.org/blog/the-raise-act-vs-sb-53-a-tale-of-two-frontier-ai-laws/' },
      { name: 'Colorado AI Act (SB 24-205)', date: '2027-01-01', status: 'Paused', note: 'Rules against algorithmic discrimination; start date moved twice, now 1 January 2027, with narrower duties.', url: 'https://leg.colorado.gov/bills/sb24-205' },
      { name: 'America’s AI Action Plan', date: '2025-07-23', status: 'Voluntary', note: 'Federal strategy focused on innovation, infrastructure and international leadership.', url: 'https://www.ai.gov/action-plan' },
      { name: 'Executive order on a national AI policy framework', date: '2025-12-11', status: 'In force', note: 'Sets up a federal effort to challenge state AI laws seen as obstructing national policy.', url: 'https://www.whitehouse.gov/presidential-actions/2025/12/eliminating-state-law-obstruction-of-national-artificial-intelligence-policy/' },
      { name: 'Center for AI Standards and Innovation (CAISI)', date: '2025-06-03', status: 'In force', note: 'NIST body (formerly the US AI Safety Institute) that evaluates frontier models.', url: 'https://www.nist.gov/caisi' },
    ],
    match: /\b(US|U\.S\.|United States|Congress|White House|Senate|federal|FTC|California|New York|Colorado|Texas|SB 53|RAISE Act|state law)\b/,
  },
];

// Other countries and international agreements, in brief.
export const OTHERS: { name: string; status: Status; note: string; url: string }[] = [
  { name: 'South Korea — AI Basic Act', status: 'In force', note: 'Since 22 January 2026: the first comprehensive national AI law in Asia, with duties for high-impact and generative AI.', url: 'https://www.stimson.org/2026/south-koreas-ai-basic-act-seeking-balance-between-industry-innovation-and-social-risk/' },
  { name: 'Japan — AI Promotion Act', status: 'In force', note: 'Since June 2025: a pro-innovation framework law with no penalties, relying on guidance and cooperation.', url: 'https://fpf.org/blog/understanding-japans-ai-promotion-act-an-innovation-first-blueprint-for-ai-regulation/' },
  { name: 'Council of Europe — Framework Convention on AI', status: 'Partly in force', note: 'The first binding international treaty on AI and human rights, opened for signature in September 2024.', url: 'https://www.coe.int/en/web/artificial-intelligence/the-framework-convention-on-artificial-intelligence' },
  { name: 'International AI Safety Report', status: 'Voluntary', note: 'A shared scientific assessment of advanced-AI risks by experts nominated by 30+ countries.', url: 'https://internationalaisafetyreport.org' },
  { name: 'OECD AI Principles', status: 'Voluntary', note: 'Intergovernmental principles for trustworthy AI, adopted by dozens of countries and the basis for the G20 AI principles.', url: 'https://oecd.ai/en/ai-principles' },
];
