import type { SimulationScenarioInput, SubjectClassification } from '../lib/dblEngine';

export interface DomainSpec {
  id: string;
  name: string;
  subtitle: string;
  readiness: number;
  expected: number;
  variance: number;
  status: 'On track' | 'At risk' | 'High risk';
  predictedCompletion: string;
  dblImpactDays: number;
  kpi2Label: string;
  kpi2Value: string;
  kpi2Delta: string;
  kpi2Sub: string;
  kpi3Label: string;
  kpi3Value: string;
  kpi3Sub: string;
  trendLabel: string;
  trendSeries: { label: string; actual: number | null; expected: number; forecast: number | null }[];
  donutTitle: string;
  donutCenterLabel: string;
  donutCenterValue: string;
  donutSegments: { label: string; count: number; pct: number; color: string }[];
  insights: string[];
  breakdownTitle: string;
  breakdownRows: {
    country: string;
    siteId: string;
    subjects: number;
    expected: number;
    complete: number;
    incomplete: number;
    pctComplete: number;
    trend7d: string;
    criticalItems: number;
    lastActivity: string;
    status: 'On track' | 'At risk' | 'High risk';
  }[];
  topPendingTitle: string;
  topPendingRows: {
    id: string;
    subjectId: string;
    siteId: string;
    visit: string;
    form: string;
    issue: string;
    daysOpen: number;
    criticality: 'Critical' | 'High' | 'Medium';
    owner: string;
    status: 'Open' | 'In Progress' | 'Escalated';
    actionLabel: string;
  }[];
}

export const V3_STUDY_META = {
  protocol: 'CA-209-301',
  title: 'A Phase 3, Randomized Study of Dual Immunotherapy in Advanced NSCLC',
  therapeuticArea: 'Oncology',
  phase: 'Phase III',
  regions: 'US, DE, FR, KR +2',
  enrolledSubjects: 220,
  lslvDate: '30 Nov 2026',
  targetDbl: '15 Dec 2026',
  targetDblIso: '2026-12-15',
  predictedDbl: '21 Dec 2026',
  predictedDblIso: '2026-12-21',
  delayDays: 6,
  probMeetingDbl: 28,
  overallReadiness: 72,
  expectedReadiness: 80,
  readinessGap: -8,
  lockReadySubjects: 158,
  hardGateBlockers: 8,
  highRiskSites: 3,
  totalSites: 18,
  lastRefreshed: '31 Oct 2026, 08:00 UTC',
  confidence: 'Medium',
  currentVelocity: '+3 pts/wk',
  requiredVelocity: '+6 pts/wk',
};

export const V3_OVERVIEW_TREND = [
  { label: 'D-60\n1 Oct', actual: 55, expected: 55, forecast: null },
  { label: 'D-45\n15 Oct', actual: 62, expected: 65, forecast: null },
  { label: 'D-30\n29 Oct', actual: 72, expected: 80, forecast: 72 },
  { label: 'D-15\n13 Nov', actual: null, expected: 88, forecast: 82 },
  { label: 'LSLV\n30 Nov', actual: null, expected: 93, forecast: 90 },
  { label: 'D+5\n5 Dec', actual: null, expected: 96, forecast: 95 },
  { label: 'Target DBL\n15 Dec', actual: null, expected: 100, forecast: 97 },
  { label: 'Predicted\n21 Dec', actual: null, expected: 100, forecast: 100 },
];

export const V3_OVERVIEW_INSIGHTS = [
  {
    type: 'critical' as const,
    title: 'External laboratory data reconciliation is the primary driver for the 6-day delay.',
    detail: 'Final vendor file expected by 10 Dec 2026. Historical delay risk: +2 days.',
  },
  {
    type: 'warning' as const,
    title: 'PI signatures pending for 18 subjects across 3 sites.',
    detail: 'If cleared by 5 Dec, potential to recover 2 days.',
  },
  {
    type: 'info' as const,
    title: 'Query closure velocity has improved by 25% in the last 2 weeks.',
    detail: 'Current forecast assumes sustained velocity.',
  },
  {
    type: 'success' as const,
    title: 'US region is on track with 90% site readiness.',
    detail: 'Focus on DE and KR to mitigate overall delay.',
  },
];

export const V3_COUNTRY_SUMMARY = [
  { country: 'United States', flag: '🇺🇸', sites: 5, readiness: 90, highRiskSites: 0, atRiskSites: 1, onTrackSites: 4, subjectsNotReady: 8, criticalBlockers: 2, forecastDays: 0, driver: 'Routine query ageing', worstSite: 'Site 104', lat: 39.8, lon: -98.5 },
  { country: 'Germany', flag: '🇩🇪', sites: 4, readiness: 68, highRiskSites: 2, atRiskSites: 1, onTrackSites: 1, subjectsNotReady: 18, criticalBlockers: 4, forecastDays: 3, driver: 'Pending lab & critical queries', worstSite: 'Site 317', lat: 51.1, lon: 10.4 },
  { country: 'France', flag: '🇫🇷', sites: 3, readiness: 78, highRiskSites: 0, atRiskSites: 1, onTrackSites: 2, subjectsNotReady: 6, criticalBlockers: 1, forecastDays: 1, driver: 'PI signatures & data entry', worstSite: 'Site 208', lat: 46.2, lon: 2.2 },
  { country: 'South Korea', flag: '🇰🇷', sites: 3, readiness: 62, highRiskSites: 1, atRiskSites: 2, onTrackSites: 0, subjectsNotReady: 12, criticalBlockers: 3, forecastDays: 2, driver: 'Imaging data & eCOA sync', worstSite: 'Site 405', lat: 35.9, lon: 127.7 },
  { country: 'Canada', flag: '🇨🇦', sites: 2, readiness: 85, highRiskSites: 0, atRiskSites: 0, onTrackSites: 2, subjectsNotReady: 2, criticalBlockers: 0, forecastDays: 0, driver: 'Minor protocol deviations', worstSite: 'Site 120', lat: 56.1, lon: -106.3 },
  { country: 'Others', flag: '🇪🇸', sites: 1, readiness: 80, highRiskSites: 0, atRiskSites: 0, onTrackSites: 1, subjectsNotReady: 2, criticalBlockers: 0, forecastDays: 0, driver: '1 routine query', worstSite: 'Site 511', lat: 40.4, lon: -3.7 },
];

export const V3_DOMAINS: DomainSpec[] = [
  {
    id: 'edc',
    name: 'EDC Data Cleaning',
    subtitle: 'Review form completion and data entry status across sites and subjects.',
    readiness: 92,
    expected: 95,
    variance: -3,
    status: 'On track',
    predictedCompletion: '11 Dec 2026',
    dblImpactDays: 0,
    kpi2Label: 'Missing / Incomplete Forms',
    kpi2Value: '156',
    kpi2Delta: '+28 vs last week',
    kpi2Sub: 'Across 48 subjects (12 critical)',
    kpi3Label: 'Sites with >10% Incomplete',
    kpi3Value: '2 / 18',
    kpi3Sub: 'Site 317 (DE), Site 405 (KR)',
    trendLabel: 'Form Completion Trend',
    trendSeries: [
      { label: 'D-60', actual: 68, expected: 70, forecast: null },
      { label: 'D-45', actual: 76, expected: 78, forecast: null },
      { label: 'D-30', actual: 84, expected: 86, forecast: null },
      { label: 'D-15', actual: 90, expected: 92, forecast: 90 },
      { label: 'LSLV', actual: 94, expected: 96, forecast: 94 },
      { label: 'D+5', actual: null, expected: 98, forecast: 98 },
    ],
    donutTitle: 'Incomplete Forms by Category',
    donutCenterLabel: 'forms',
    donutCenterValue: '156',
    donutSegments: [
      { label: 'Missing Forms', count: 59, pct: 38, color: '#2563eb' },
      { label: 'Incomplete Fields', count: 41, pct: 26, color: '#f59e0b' },
      { label: 'Pending Verification', count: 28, pct: 18, color: '#10b981' },
      { label: 'Data Entry Not Started', count: 16, pct: 10, color: '#ef4444' },
      { label: 'Others', count: 12, pct: 8, color: '#94a3b8' },
    ],
    insights: [
      '156 forms incomplete, of which 12 are endpoint-critical (8 subjects).',
      'Site 317 (DE) has 28% forms pending entry. No site activity in last 5 days.',
      'Data entry velocity improved by 30% in the last 2 weeks.',
      'If current velocity sustains, domain is expected to complete by 11 Dec 2026 with no impact on DBL.',
    ],
    breakdownTitle: 'Site Breakdown',
    breakdownRows: [
      { country: 'United States', siteId: '104', subjects: 34, expected: 520, complete: 508, incomplete: 12, pctComplete: 98, trend7d: '+2%', criticalItems: 1, lastActivity: '30 Oct 2026', status: 'On track' },
      { country: 'Germany', siteId: '317', subjects: 28, expected: 430, complete: 310, incomplete: 120, pctComplete: 72, trend7d: '-4%', criticalItems: 8, lastActivity: '25 Oct 2026', status: 'At risk' },
      { country: 'France', siteId: '208', subjects: 26, expected: 410, complete: 392, incomplete: 18, pctComplete: 96, trend7d: '+3%', criticalItems: 2, lastActivity: '30 Oct 2026', status: 'On track' },
      { country: 'South Korea', siteId: '405', subjects: 24, expected: 360, complete: 280, incomplete: 80, pctComplete: 78, trend7d: '-2%', criticalItems: 6, lastActivity: '24 Oct 2026', status: 'At risk' },
      { country: 'Canada', siteId: '120', subjects: 18, expected: 300, complete: 296, incomplete: 4, pctComplete: 99, trend7d: '+1%', criticalItems: 0, lastActivity: '30 Oct 2026', status: 'On track' },
    ],
    topPendingTitle: 'Recent Incomplete Forms (Top 10)',
    topPendingRows: [
      { id: 'EDC-101', subjectId: 'CA209-301-317-001', siteId: '317', visit: 'Week 24', form: 'Tumor Assessment', issue: 'Missing complete date', daysOpen: 12, criticality: 'Critical', owner: 'Site / CRA', status: 'Open', actionLabel: 'View' },
      { id: 'EDC-102', subjectId: 'CA209-301-405-014', siteId: '405', visit: 'End of Study', form: 'ePRO', issue: 'Not started', daysOpen: 10, criticality: 'High', owner: 'Site', status: 'Open', actionLabel: 'View' },
      { id: 'EDC-103', subjectId: 'CA209-301-317-006', siteId: '317', visit: 'Week 12', form: 'Concomitant Meds', issue: 'Incomplete fields (3)', daysOpen: 9, criticality: 'High', owner: 'Site', status: 'Open', actionLabel: 'View' },
      { id: 'EDC-104', subjectId: 'CA209-301-104-021', siteId: '104', visit: 'Week 36', form: 'Adverse Events', issue: 'Pending verification', daysOpen: 7, criticality: 'Medium', owner: 'DM', status: 'In Progress', actionLabel: 'View' },
    ],
  },
  {
    id: 'queries',
    name: 'Query Resolution',
    subtitle: 'Track, prioritise and resolve data queries to achieve clean data for database lock.',
    readiness: 85,
    expected: 90,
    variance: -5,
    status: 'At risk',
    predictedCompletion: '14 Dec 2026',
    dblImpactDays: 1,
    kpi2Label: 'Open Queries',
    kpi2Value: '68',
    kpi2Delta: '+12 vs last week',
    kpi2Sub: '14 endpoint-critical · 28 overdue',
    kpi3Label: 'Sites with High Query Volume',
    kpi3Value: '3 / 18',
    kpi3Sub: 'Site 104 (US), Site 317 (DE), Site 405 (KR)',
    trendLabel: 'Query Closure Trend',
    trendSeries: [
      { label: 'D-60', actual: 58, expected: 60, forecast: null },
      { label: 'D-45', actual: 68, expected: 72, forecast: null },
      { label: 'D-30', actual: 78, expected: 82, forecast: null },
      { label: 'D-15', actual: 85, expected: 90, forecast: 85 },
      { label: 'LSLV', actual: null, expected: 95, forecast: 92 },
      { label: 'D+5', actual: null, expected: 99, forecast: 98 },
    ],
    donutTitle: 'Open Queries by Priority',
    donutCenterLabel: 'open queries',
    donutCenterValue: '68',
    donutSegments: [
      { label: 'Critical (Endpoint/Safety)', count: 14, pct: 21, color: '#ef4444' },
      { label: 'High', count: 28, pct: 41, color: '#f59e0b' },
      { label: 'Medium', count: 18, pct: 26, color: '#3b82f6' },
      { label: 'Low', count: 8, pct: 12, color: '#10b981' },
    ],
    insights: [
      '14 endpoint-critical queries remain open (8 subjects). Oldest is 16 days.',
      '28 queries are overdue (> 7 days).',
      'Query closure velocity has improved by 25% in the last 2 weeks, but needs to be sustained to meet target.',
      'If all overdue queries are resolved by 5 Dec 2026, potential to recover 1 day from predicted DBL.',
    ],
    breakdownTitle: 'Site Breakdown',
    breakdownRows: [
      { country: 'United States', siteId: '104', subjects: 34, expected: 120, complete: 102, incomplete: 18, pctComplete: 85, trend7d: '+8%', criticalItems: 6, lastActivity: '30 Oct 2026', status: 'At risk' },
      { country: 'Germany', siteId: '317', subjects: 28, expected: 98, complete: 72, incomplete: 26, pctComplete: 73, trend7d: '-4%', criticalItems: 14, lastActivity: '27 Oct 2026', status: 'At risk' },
      { country: 'France', siteId: '208', subjects: 26, expected: 85, complete: 77, incomplete: 8, pctComplete: 91, trend7d: '+6%', criticalItems: 4, lastActivity: '30 Oct 2026', status: 'On track' },
      { country: 'South Korea', siteId: '405', subjects: 24, expected: 72, complete: 56, incomplete: 16, pctComplete: 78, trend7d: '-2%', criticalItems: 10, lastActivity: '25 Oct 2026', status: 'At risk' },
      { country: 'Canada', siteId: '120', subjects: 18, expected: 48, complete: 46, incomplete: 2, pctComplete: 96, trend7d: '+4%', criticalItems: 0, lastActivity: '30 Oct 2026', status: 'On track' },
    ],
    topPendingTitle: 'Top Open Queries (10)',
    topPendingRows: [
      { id: 'QRY-104-2026-001', subjectId: 'CA209-301-104-012', siteId: '104', visit: 'Week 24', form: 'Tumor Assessment / Assess Date', issue: 'Please confirm assessment date (source mismatch)', daysOpen: 16, criticality: 'Critical', owner: 'Site / CRA', status: 'Open', actionLabel: 'Resolve' },
      { id: 'QRY-317-2026-042', subjectId: 'CA209-301-317-006', siteId: '317', visit: 'Week 12', form: 'Labs / ALT', issue: 'ALT value out of expected range, please verify', daysOpen: 12, criticality: 'High', owner: 'DM', status: 'Open', actionLabel: 'Follow up' },
      { id: 'QRY-405-2026-018', subjectId: 'CA209-301-405-014', siteId: '405', visit: 'End of Study', form: 'ePRO / Q3', issue: 'Missing ePRO entry, please provide', daysOpen: 10, criticality: 'High', owner: 'Site', status: 'Open', actionLabel: 'Follow up' },
      { id: 'QRY-208-2026-037', subjectId: 'CA209-301-208-003', siteId: '208', visit: 'Week 36', form: 'Con Meds / Drug Start Date', issue: 'Invalid start date, please confirm', daysOpen: 8, criticality: 'Medium', owner: 'Site', status: 'In Progress', actionLabel: 'Review' },
    ],
  },
  {
    id: 'external_data',
    name: 'External Data Reconciliation',
    subtitle: 'Track and reconcile data from labs, imaging, eCOA/ePRO, IRT and other external vendors.',
    readiness: 65,
    expected: 80,
    variance: -15,
    status: 'High risk',
    predictedCompletion: '16 Dec 2026',
    dblImpactDays: 4,
    kpi2Label: 'Pending Records',
    kpi2Value: '770',
    kpi2Delta: '+120 vs last week',
    kpi2Sub: 'Across 132 subjects (48 critical)',
    kpi3Label: 'Sources with Open Issues',
    kpi3Value: '3 / 5',
    kpi3Sub: 'Labs, Imaging, eCOA',
    trendLabel: 'Reconciliation Trend',
    trendSeries: [
      { label: 'D-60', actual: 32, expected: 40, forecast: null },
      { label: 'D-45', actual: 46, expected: 55, forecast: null },
      { label: 'D-30', actual: 65, expected: 80, forecast: 65 },
      { label: 'D-15', actual: null, expected: 86, forecast: 72 },
      { label: 'LSLV', actual: null, expected: 92, forecast: 85 },
      { label: 'D+5', actual: null, expected: 98, forecast: 92 },
    ],
    donutTitle: 'Pending Records by Source',
    donutCenterLabel: 'pending',
    donutCenterValue: '770',
    donutSegments: [
      { label: 'Central Lab', count: 323, pct: 42, color: '#ef4444' },
      { label: 'Imaging', count: 200, pct: 26, color: '#f59e0b' },
      { label: 'eCOA / ePRO', count: 136, pct: 18, color: '#3b82f6' },
      { label: 'IRT / Drug Supply', count: 80, pct: 10, color: '#10b981' },
      { label: 'Other Vendors', count: 31, pct: 4, color: '#94a3b8' },
    ],
    insights: [
      'Central lab data transfer is pending (expected 10 Dec 2026). 323 records affected (24 critical subjects).',
      '48 subject records have unresolved laboratory or imaging discrepancies.',
      'eCOA data sync issues at Site 405 (KR) – 136 assessments pending.',
      'If lab file is received by 10 Dec and all critical discrepancies resolved by 14 Dec, potential to recover up to 4 days.',
    ],
    breakdownTitle: 'Source Breakdown',
    breakdownRows: [
      { country: 'Central Laboratory', siteId: 'LAB', subjects: 86, expected: 860, complete: 537, incomplete: 323, pctComplete: 62, trend7d: '-4%', criticalItems: 24, lastActivity: '10 Dec 2026', status: 'High risk' },
      { country: 'Imaging (Central Read)', siteId: 'IMG', subjects: 54, expected: 540, complete: 340, incomplete: 200, pctComplete: 63, trend7d: '-2%', criticalItems: 14, lastActivity: '14 Dec 2026', status: 'At risk' },
      { country: 'eCOA / ePRO', siteId: 'ECOA', subjects: 42, expected: 420, complete: 284, incomplete: 136, pctComplete: 68, trend7d: '+1%', criticalItems: 6, lastActivity: '12 Dec 2026', status: 'At risk' },
      { country: 'IRT / Drug Supply', siteId: 'IRT', subjects: 30, expected: 300, complete: 220, incomplete: 80, pctComplete: 73, trend7d: '+4%', criticalItems: 4, lastActivity: '11 Dec 2026', status: 'At risk' },
      { country: 'Biomarkers / Genomics', siteId: 'BIO', subjects: 12, expected: 60, complete: 29, incomplete: 31, pctComplete: 48, trend7d: '-3%', criticalItems: 0, lastActivity: '15 Dec 2026', status: 'High risk' },
    ],
    topPendingTitle: 'Top Pending Records (10)',
    topPendingRows: [
      { id: 'EXT-001', subjectId: 'CA209-301-104-012', siteId: '104', visit: 'Central Lab', form: 'Lab Result', issue: 'Result not received (Visit W24)', daysOpen: 12, criticality: 'Critical', owner: 'Lab Vendor', status: 'Open', actionLabel: 'Track' },
      { id: 'EXT-002', subjectId: 'CA209-301-405-014', siteId: '405', visit: 'eCOA', form: 'ePRO Assessment', issue: 'Missing assessment (Day 180)', daysOpen: 10, criticality: 'High', owner: 'Site', status: 'Open', actionLabel: 'Follow up' },
      { id: 'EXT-003', subjectId: 'CA209-301-317-008', siteId: '317', visit: 'Imaging', form: 'Image File', issue: 'Image quality issue – unreadable', daysOpen: 9, criticality: 'High', owner: 'Vendor', status: 'Open', actionLabel: 'Resolve' },
      { id: 'EXT-004', subjectId: 'CA209-301-208-003', siteId: '208', visit: 'Central Lab', form: 'Lab Result', issue: 'Value mismatch (ALT)', daysOpen: 8, criticality: 'High', owner: 'DM', status: 'In Progress', actionLabel: 'Review' },
    ],
  },
  {
    id: 'safety',
    name: 'Safety Reconciliation',
    subtitle: 'Reconcile safety data between EDC and Safety system (e.g., Argus) to ensure consistency and completeness.',
    readiness: 80,
    expected: 88,
    variance: -8,
    status: 'At risk',
    predictedCompletion: '13 Dec 2026',
    dblImpactDays: 1,
    kpi2Label: 'Unresolved Discrepancies',
    kpi2Value: '44',
    kpi2Delta: '+10 vs last week',
    kpi2Sub: 'Across 32 subjects (6 critical)',
    kpi3Label: 'SAE Discrepancies (Open)',
    kpi3Value: '6',
    kpi3Sub: '2 seriousness · 2 outcome · 1 date · 1 missing',
    trendLabel: 'Safety Reconciliation Trend',
    trendSeries: [
      { label: 'D-60', actual: 46, expected: 50, forecast: null },
      { label: 'D-45', actual: 60, expected: 66, forecast: null },
      { label: 'D-30', actual: 75, expected: 82, forecast: null },
      { label: 'D-15', actual: 80, expected: 88, forecast: 80 },
      { label: 'LSLV', actual: null, expected: 93, forecast: 90 },
      { label: 'D+5', actual: null, expected: 98, forecast: 96 },
    ],
    donutTitle: 'Open Discrepancies by Type',
    donutCenterLabel: 'open',
    donutCenterValue: '44',
    donutSegments: [
      { label: 'AEs (non-serious)', count: 16, pct: 36, color: '#3b82f6' },
      { label: 'SAEs', count: 11, pct: 25, color: '#ef4444' },
      { label: 'Concomitant Meds', count: 8, pct: 18, color: '#f59e0b' },
      { label: 'Medical History', count: 6, pct: 14, color: '#10b981' },
      { label: 'Others', count: 3, pct: 7, color: '#94a3b8' },
    ],
    insights: [
      '6 open SAE discrepancies remain, including 2 seriousness mismatches and 1 missing follow-up.',
      'Site 405 (KR) and Site 317 (DE) contribute to 60% of open safety discrepancies.',
      'No new critical discrepancies in the last 7 days.',
      'If all SAE discrepancies are resolved by 5 Dec 2026, potential to recover 1 day from predicted DBL.',
    ],
    breakdownTitle: 'Site Breakdown',
    breakdownRows: [
      { country: 'United States', siteId: '104', subjects: 34, expected: 60, complete: 56, incomplete: 4, pctComplete: 93, trend7d: '+5%', criticalItems: 0, lastActivity: '30 Oct 2026', status: 'On track' },
      { country: 'Germany', siteId: '317', subjects: 28, expected: 50, complete: 36, incomplete: 14, pctComplete: 72, trend7d: '-4%', criticalItems: 2, lastActivity: '28 Oct 2026', status: 'At risk' },
      { country: 'France', siteId: '208', subjects: 26, expected: 44, complete: 40, incomplete: 4, pctComplete: 91, trend7d: '+6%', criticalItems: 1, lastActivity: '30 Oct 2026', status: 'On track' },
      { country: 'South Korea', siteId: '405', subjects: 24, expected: 40, complete: 28, incomplete: 12, pctComplete: 70, trend7d: '-1%', criticalItems: 3, lastActivity: '26 Oct 2026', status: 'At risk' },
      { country: 'Canada', siteId: '120', subjects: 18, expected: 26, complete: 24, incomplete: 2, pctComplete: 92, trend7d: '+4%', criticalItems: 0, lastActivity: '30 Oct 2026', status: 'On track' },
    ],
    topPendingTitle: 'Top Open Safety Discrepancies (10)',
    topPendingRows: [
      { id: 'SAE-2026-001', subjectId: 'CA209-301-405-014', siteId: '405', visit: 'Seriousness', form: 'Non-Serious vs Serious', issue: 'SAE Seriousness Mismatch', daysOpen: 12, criticality: 'Critical', owner: 'Safety Lead', status: 'Open', actionLabel: 'Resolve' },
      { id: 'SAE-2026-017', subjectId: 'CA209-301-317-006', siteId: '317', visit: 'Outcome', form: 'Recovered vs Fatal', issue: 'SAE Outcome Mismatch', daysOpen: 10, criticality: 'Critical', owner: 'Safety Lead', status: 'Open', actionLabel: 'Resolve' },
      { id: 'SAE-2026-021', subjectId: 'CA209-301-317-021', siteId: '317', visit: 'Follow-up', form: 'Missing vs Available', issue: 'Missing Follow-up Info', daysOpen: 8, criticality: 'High', owner: 'DM', status: 'Open', actionLabel: 'Follow up' },
      { id: 'AE-2026-145', subjectId: 'CA209-301-104-010', siteId: '104', visit: 'Start Date', form: '12 Aug vs 14 Aug', issue: 'AE Date Mismatch', daysOpen: 6, criticality: 'Medium', owner: 'Site', status: 'In Progress', actionLabel: 'Review' },
    ],
  },
  {
    id: 'coding',
    name: 'Medical Coding',
    subtitle: 'Monitor coding status for AEs, Med His, Con Meds and other coded terms to ensure completeness and quality.',
    readiness: 90,
    expected: 92,
    variance: -2,
    status: 'On track',
    predictedCompletion: '12 Dec 2026',
    dblImpactDays: 0,
    kpi2Label: 'Uncoded / Pending Review',
    kpi2Value: '210',
    kpi2Delta: '+30 vs last week',
    kpi2Sub: '160 pending coding | 50 pending review',
    kpi3Label: 'Low Confidence Codes',
    kpi3Value: '32',
    kpi3Sub: 'Require manual review',
    trendLabel: 'Coding Completion Trend',
    trendSeries: [
      { label: 'D-60', actual: 78, expected: 80, forecast: null },
      { label: 'D-45', actual: 86, expected: 88, forecast: null },
      { label: 'D-30', actual: 90, expected: 92, forecast: 90 },
      { label: 'D-15', actual: null, expected: 95, forecast: 95 },
      { label: 'LSLV', actual: null, expected: 98, forecast: 98 },
      { label: 'D+5', actual: null, expected: 99, forecast: 99 },
    ],
    donutTitle: 'Pending Terms by Domain',
    donutCenterLabel: 'pending',
    donutCenterValue: '210',
    donutSegments: [
      { label: 'Adverse Events (AE)', count: 80, pct: 38, color: '#ef4444' },
      { label: 'Concomitant Medications', count: 55, pct: 26, color: '#3b82f6' },
      { label: 'Medical History', count: 38, pct: 18, color: '#f59e0b' },
      { label: 'Procedures', count: 25, pct: 12, color: '#10b981' },
      { label: 'Other', count: 12, pct: 6, color: '#94a3b8' },
    ],
    insights: [
      '210 terms pending coding; 32 low-confidence auto-codes require manual review.',
      'AE terms contribute to 38% of the pending workload, mainly from Site 317 (DE) and 405 (KR).',
      'Coding turnaround time has improved by 20% in the last 2 weeks.',
      'No critical coding backend issues. Domain expected to complete by 12 Dec 2026 with no impact on DBL.',
    ],
    breakdownTitle: 'Site Breakdown',
    breakdownRows: [
      { country: 'United States', siteId: '104', subjects: 34, expected: 420, complete: 402, incomplete: 18, pctComplete: 96, trend7d: '+4%', criticalItems: 2, lastActivity: '30 Oct 2026', status: 'On track' },
      { country: 'Germany', siteId: '317', subjects: 28, expected: 380, complete: 310, incomplete: 70, pctComplete: 82, trend7d: '-2%', criticalItems: 14, lastActivity: '28 Oct 2026', status: 'At risk' },
      { country: 'France', siteId: '208', subjects: 26, expected: 320, complete: 304, incomplete: 16, pctComplete: 95, trend7d: '+4%', criticalItems: 4, lastActivity: '30 Oct 2026', status: 'On track' },
      { country: 'South Korea', siteId: '405', subjects: 24, expected: 280, complete: 230, incomplete: 50, pctComplete: 82, trend7d: '-1%', criticalItems: 8, lastActivity: '27 Oct 2026', status: 'At risk' },
      { country: 'Canada', siteId: '120', subjects: 18, expected: 200, complete: 196, incomplete: 4, pctComplete: 98, trend7d: '+3%', criticalItems: 2, lastActivity: '30 Oct 2026', status: 'On track' },
    ],
    topPendingTitle: 'Top Pending Coding Terms (10)',
    topPendingRows: [
      { id: 'COD-001', subjectId: 'CA209-301-317-006', siteId: '317', visit: 'AE', form: 'Pneumonitis', issue: 'Low Confidence (0.65 MedDRA)', daysOpen: 12, criticality: 'Critical', owner: 'Coder', status: 'Open', actionLabel: 'Review' },
      { id: 'COD-002', subjectId: 'CA209-301-405-014', siteId: '405', visit: 'CM', form: 'Paracetamol', issue: 'Pending Review (0.72 WHODrug)', daysOpen: 10, criticality: 'High', owner: 'Coder', status: 'Open', actionLabel: 'Review' },
      { id: 'COD-003', subjectId: 'CA209-301-317-021', siteId: '317', visit: 'AE', form: 'Rash maculopapular', issue: 'Pending Coding (0.88)', daysOpen: 9, criticality: 'High', owner: 'Coder', status: 'Open', actionLabel: 'Assign' },
      { id: 'COD-004', subjectId: 'CA209-301-208-003', siteId: '208', visit: 'MH', form: 'Type 2 diabetes mellitus', issue: 'Pending Review (0.90)', daysOpen: 8, criticality: 'Medium', owner: 'Coder', status: 'Open', actionLabel: 'Review' },
    ],
  },
  {
    id: 'pi_signatures',
    name: 'PI Signatures',
    subtitle: 'Track investigator signatures on eCRFs and site sign-off status to enable subject and site lock.',
    readiness: 75,
    expected: 90,
    variance: -15,
    status: 'At risk',
    predictedCompletion: '12 Dec 2026',
    dblImpactDays: 2,
    kpi2Label: 'Subjects Pending Signature',
    kpi2Value: '55',
    kpi2Delta: '+8 vs last week',
    kpi2Sub: 'Across 12 sites (18 are otherwise clean)',
    kpi3Label: 'Sites with Outstanding Signatures',
    kpi3Value: '3 / 18',
    kpi3Sub: 'Site 104 (US), Site 317 (DE), Site 405 (KR)',
    trendLabel: 'Signature Completion Trend',
    trendSeries: [
      { label: 'D-60', actual: 50, expected: 60, forecast: null },
      { label: 'D-45', actual: 65, expected: 72, forecast: null },
      { label: 'D-30', actual: 75, expected: 88, forecast: 75 },
      { label: 'D-15', actual: null, expected: 92, forecast: 86 },
      { label: 'LSLV', actual: null, expected: 96, forecast: 92 },
      { label: 'D+5', actual: null, expected: 99, forecast: 97 },
    ],
    donutTitle: 'Pending Signatures by Form Type',
    donutCenterLabel: 'pending',
    donutCenterValue: '55',
    donutSegments: [
      { label: 'Investigator Signature (Casebook)', count: 25, pct: 45, color: '#3b82f6' },
      { label: 'Key Efficacy Forms', count: 14, pct: 25, color: '#f59e0b' },
      { label: 'Safety Forms', count: 8, pct: 15, color: '#ef4444' },
      { label: 'End of Study Forms', count: 5, pct: 9, color: '#10b981' },
      { label: 'Others', count: 3, pct: 6, color: '#94a3b8' },
    ],
    insights: [
      '55 subjects are pending investigator signature, of which 18 are otherwise clean.',
      'Site 317 (DE) has the highest pending signatures (16 subjects) with oldest pending 14 days.',
      '12 subjects pending signature are in the lock population.',
      'If all pending signatures are obtained by 5 Dec 2026, potential to recover 2 days from predicted DBL.',
    ],
    breakdownTitle: 'Site Breakdown',
    breakdownRows: [
      { country: 'United States', siteId: '104', subjects: 34, expected: 30, complete: 26, incomplete: 4, pctComplete: 87, trend7d: '+3%', criticalItems: 7, lastActivity: '30 Oct 2026', status: 'On track' },
      { country: 'Germany', siteId: '317', subjects: 28, expected: 26, complete: 10, incomplete: 16, pctComplete: 38, trend7d: '-4%', criticalItems: 14, lastActivity: '25 Oct 2026', status: 'At risk' },
      { country: 'France', siteId: '208', subjects: 26, expected: 24, complete: 20, incomplete: 4, pctComplete: 83, trend7d: '+2%', criticalItems: 8, lastActivity: '30 Oct 2026', status: 'On track' },
      { country: 'South Korea', siteId: '405', subjects: 24, expected: 22, complete: 14, incomplete: 8, pctComplete: 64, trend7d: '-2%', criticalItems: 10, lastActivity: '24 Oct 2026', status: 'At risk' },
      { country: 'Canada', siteId: '120', subjects: 18, expected: 18, complete: 16, incomplete: 2, pctComplete: 88, trend7d: '+1%', criticalItems: 6, lastActivity: '30 Oct 2026', status: 'On track' },
    ],
    topPendingTitle: 'Pending PI Signatures (Top 10)',
    topPendingRows: [
      { id: 'SIG-001', subjectId: 'CA209-301-317-006', siteId: '317', visit: 'Week 24', form: 'Tumor Assessment', issue: 'Investigator signature overdue (Completed)', daysOpen: 14, criticality: 'Critical', owner: 'Site / CRA', status: 'Open', actionLabel: 'Follow up' },
      { id: 'SIG-002', subjectId: 'CA209-301-405-014', siteId: '405', visit: 'End of Study', form: 'eCRF Casebook', issue: 'Investigator signature overdue (Completed)', daysOpen: 12, criticality: 'High', owner: 'Site / CRA', status: 'Open', actionLabel: 'Follow up' },
      { id: 'SIG-003', subjectId: 'CA209-301-104-021', siteId: '104', visit: 'Week 36', form: 'Safety Follow-up', issue: 'Investigator signature pending', daysOpen: 8, criticality: 'High', owner: 'Site / CRA', status: 'Open', actionLabel: 'Follow up' },
      { id: 'SIG-004', subjectId: 'CA209-301-317-018', siteId: '317', visit: 'Week 12', form: 'Efficacy Endpoint', issue: 'Investigator signature pending', daysOpen: 7, criticality: 'Medium', owner: 'Site', status: 'Open', actionLabel: 'Follow up' },
    ],
  },
  {
    id: 'deviations',
    name: 'Protocol Deviations',
    subtitle: 'Track protocol deviations, review status and impact on analysis sets and database lock.',
    readiness: 88,
    expected: 90,
    variance: -2,
    status: 'On track',
    predictedCompletion: '12 Dec 2026',
    dblImpactDays: 0,
    kpi2Label: 'Open Protocol Deviations',
    kpi2Value: '30',
    kpi2Delta: '-8 vs last week',
    kpi2Sub: '6 major | 12 important | 12 minor',
    kpi3Label: 'Sites with Open Deviations',
    kpi3Value: '4 / 18',
    kpi3Sub: 'Site 104 (US), Site 317 (DE), Site 405 (KR), Site 208 (FR)',
    trendLabel: 'Deviation Closure Trend',
    trendSeries: [
      { label: 'D-60', actual: 70, expected: 72, forecast: null },
      { label: 'D-45', actual: 78, expected: 80, forecast: null },
      { label: 'D-30', actual: 84, expected: 86, forecast: null },
      { label: 'D-15', actual: 88, expected: 90, forecast: 88 },
      { label: 'LSLV', actual: null, expected: 94, forecast: 93 },
      { label: 'D+5', actual: null, expected: 98, forecast: 98 },
    ],
    donutTitle: 'Open Deviations by Severity',
    donutCenterLabel: 'open',
    donutCenterValue: '30',
    donutSegments: [
      { label: 'Major', count: 6, pct: 20, color: '#ef4444' },
      { label: 'Important', count: 12, pct: 40, color: '#f59e0b' },
      { label: 'Minor', count: 9, pct: 30, color: '#3b82f6' },
      { label: 'Not yet classified', count: 3, pct: 10, color: '#94a3b8' },
    ],
    insights: [
      '6 major deviations are open, of which 2 may impact analysis population.',
      'Site 317 (DE) has the highest number of open deviations (8), mainly visit window and eligibility related.',
      '80% of open deviations are under review and expected to close within 2 weeks.',
      'No significant impact on DBL currently, provided open major deviations are resolved by 12 Dec 2026.',
    ],
    breakdownTitle: 'Site Breakdown',
    breakdownRows: [
      { country: 'United States', siteId: '104', subjects: 34, expected: 40, complete: 38, incomplete: 2, pctComplete: 95, trend7d: '+5%', criticalItems: 0, lastActivity: '30 Oct 2026', status: 'On track' },
      { country: 'Germany', siteId: '317', subjects: 28, expected: 36, complete: 28, incomplete: 8, pctComplete: 78, trend7d: '-3%', criticalItems: 2, lastActivity: '27 Oct 2026', status: 'At risk' },
      { country: 'France', siteId: '208', subjects: 26, expected: 30, complete: 28, incomplete: 2, pctComplete: 92, trend7d: '+4%', criticalItems: 0, lastActivity: '30 Oct 2026', status: 'On track' },
      { country: 'South Korea', siteId: '405', subjects: 24, expected: 28, complete: 22, incomplete: 6, pctComplete: 79, trend7d: '-2%', criticalItems: 2, lastActivity: '26 Oct 2026', status: 'At risk' },
      { country: 'Canada', siteId: '120', subjects: 18, expected: 22, complete: 20, incomplete: 2, pctComplete: 91, trend7d: '+3%', criticalItems: 0, lastActivity: '30 Oct 2026', status: 'On track' },
    ],
    topPendingTitle: 'Open Protocol Deviations (Top 10)',
    topPendingRows: [
      { id: 'PD-2026-104-012', subjectId: 'CA209-301-104-012', siteId: '104', visit: 'Visit Window', form: 'Week 24 visit outside allowed window', issue: 'Major · Impact on Analysis Set: Yes', daysOpen: 12, criticality: 'Critical', owner: 'Clinical Ops', status: 'Open', actionLabel: 'Review' },
      { id: 'PD-2026-317-006', subjectId: 'CA209-301-317-006', siteId: '317', visit: 'Eligibility', form: 'Inclusion criterion not met at screening', issue: 'Major · Impact on Analysis Set: Yes', daysOpen: 10, criticality: 'Critical', owner: 'Medical Monitor', status: 'Open', actionLabel: 'Review' },
      { id: 'PD-2026-405-014', subjectId: 'CA209-301-405-014', siteId: '405', visit: 'Concomitant Med', form: 'Prohibited medication used', issue: 'Important · Impact on Analysis Set: No', daysOpen: 9, criticality: 'High', owner: 'DM', status: 'In Progress', actionLabel: 'Track' },
      { id: 'PD-2026-208-021', subjectId: 'CA209-301-208-021', siteId: '208', visit: 'Procedure', form: 'Missed ECG at Week 12', issue: 'Important · Impact on Analysis Set: No', daysOpen: 8, criticality: 'Medium', owner: 'Site', status: 'Open', actionLabel: 'Follow up' },
    ],
  },
  {
    id: 'sdv',
    name: 'SDV / SDR',
    subtitle: 'Track monitoring verification and data review status to ensure data quality and regulatory compliance.',
    readiness: 87,
    expected: 90,
    variance: -3,
    status: 'On track',
    predictedCompletion: '14 Dec 2026',
    dblImpactDays: 1,
    kpi2Label: 'Pending SDV / SDR Items',
    kpi2Value: '520',
    kpi2Delta: '+60 vs last week',
    kpi2Sub: 'Across 98 subjects (22 critical)',
    kpi3Label: 'Sites with >20% Pending',
    kpi3Value: '4 / 18',
    kpi3Sub: 'Site 104 (US), Site 317 (DE), Site 405 (KR), Site 208 (FR)',
    trendLabel: 'SDV/SDR Completion Trend',
    trendSeries: [
      { label: 'D-60', actual: 62, expected: 65, forecast: null },
      { label: 'D-45', actual: 70, expected: 74, forecast: null },
      { label: 'D-30', actual: 81, expected: 85, forecast: null },
      { label: 'D-15', actual: 87, expected: 90, forecast: 87 },
      { label: 'LSLV', actual: null, expected: 95, forecast: 93 },
      { label: 'D+5', actual: null, expected: 99, forecast: 97 },
    ],
    donutTitle: 'Pending Items by Activity',
    donutCenterLabel: 'pending',
    donutCenterValue: '520',
    donutSegments: [
      { label: 'SDV (On-site)', count: 208, pct: 40, color: '#3b82f6' },
      { label: 'SDR (Remote)', count: 130, pct: 25, color: '#f59e0b' },
      { label: 'Critical Fields SDV', count: 104, pct: 20, color: '#ef4444' },
      { label: 'Pending CRA Review', count: 52, pct: 10, color: '#10b981' },
      { label: 'Others', count: 26, pct: 5, color: '#94a3b8' },
    ],
    insights: [
      '520 source data items pending verification/review, including 22 critical items (endpoint and safety related).',
      'Site 317 (DE) and Site 405 (KR) have highest pending SDV items.',
      'SDR closure velocity has improved by 18% in the last 2 weeks.',
      'If pending critical SDV items are completed by 5 Dec 2026, potential to recover 1 day from predicted DBL.',
    ],
    breakdownTitle: 'Site Breakdown',
    breakdownRows: [
      { country: 'United States', siteId: '104', subjects: 34, expected: 800, complete: 720, incomplete: 80, pctComplete: 90, trend7d: '+5%', criticalItems: 6, lastActivity: '30 Oct 2026', status: 'At risk' },
      { country: 'Germany', siteId: '317', subjects: 28, expected: 760, complete: 520, incomplete: 240, pctComplete: 68, trend7d: '-4%', criticalItems: 10, lastActivity: '25 Oct 2026', status: 'High risk' },
      { country: 'France', siteId: '208', subjects: 26, expected: 680, complete: 612, incomplete: 68, pctComplete: 90, trend7d: '+3%', criticalItems: 4, lastActivity: '30 Oct 2026', status: 'On track' },
      { country: 'South Korea', siteId: '405', subjects: 24, expected: 600, complete: 450, incomplete: 150, pctComplete: 75, trend7d: '-2%', criticalItems: 8, lastActivity: '26 Oct 2026', status: 'At risk' },
      { country: 'Canada', siteId: '120', subjects: 18, expected: 360, complete: 342, incomplete: 18, pctComplete: 95, trend7d: '+4%', criticalItems: 2, lastActivity: '30 Oct 2026', status: 'On track' },
    ],
    topPendingTitle: 'Top Pending SDV / SDR Items (10)',
    topPendingRows: [
      { id: 'SDV-001', subjectId: 'CA209-301-317-006', siteId: '317', visit: 'Week 24', form: 'Tumor Assessment', issue: 'SDV pending on primary endpoint lesion', daysOpen: 16, criticality: 'Critical', owner: 'CRA', status: 'Open', actionLabel: 'Follow up' },
      { id: 'SDV-002', subjectId: 'CA209-301-405-014', siteId: '405', visit: 'Week 12', form: 'Safety Follow-up', issue: 'SDR pending on AE severity', daysOpen: 12, criticality: 'High', owner: 'DM', status: 'Open', actionLabel: 'Review' },
      { id: 'SDV-003', subjectId: 'CA209-301-104-021', siteId: '104', visit: 'End of Study', form: 'Concomitant Meds', issue: 'SDV pending', daysOpen: 10, criticality: 'High', owner: 'CRA', status: 'In Progress', actionLabel: 'Track' },
      { id: 'SDV-004', subjectId: 'CA209-301-317-012', siteId: '317', visit: 'Week 36', form: 'Labs', issue: 'SDR pending', daysOpen: 8, criticality: 'Medium', owner: 'DM', status: 'Open', actionLabel: 'Review' },
    ],
  },
];

export interface V3SubjectRow {
  id: string;
  siteId: string;
  country: string;
  status: 'Completed' | 'Ongoing' | 'Discontinued';
  readiness: number;
  classification: SubjectClassification;
  keyOpenItems: string;
  criticality: 'Critical' | 'High' | 'Medium' | 'Low';
  daysOpen: number;
  lastActivity: string;
  owner: string;
  lockPopulation: boolean;
  hasSae: boolean;
  hasEndpointIssue: boolean;
  timeline: { label: string; date: string; state: 'completed' | 'in_progress' | 'missed' | 'na' }[];
  keyInfo: {
    ageSex: string;
    investigator: string;
    enrolmentDate: string;
    lastVisitDate: string;
    analysisSet: string;
    arm: string;
    randomization: string;
  };
  domainBreakdown: {
    domain: string;
    status: 'Complete' | 'Action Required';
    details: string;
    completion: number;
  }[];
  openItems: {
    category: string;
    id: string;
    issue: string;
    severity: 'Critical' | 'Routine';
    daysOpen: number;
  }[];
  risksAndImpact: {
    level: 'Critical' | 'Medium';
    text: string;
  }[];
  nextBestActions: {
    action: string;
    owner: string;
    targetDate: string;
    status: 'Open' | 'In Progress';
  }[];
}

export const V3_SUBJECT_ROWS: V3SubjectRow[] = [
  {
    id: 'CA209-301-104-012',
    siteId: '104',
    country: 'United States',
    status: 'Completed',
    readiness: 68,
    classification: 'Action Required',
    keyOpenItems: '2 critical · 3 routine (1 endpoint query, 1 lab pending)',
    criticality: 'Critical',
    daysOpen: 11,
    lastActivity: '25 Oct 2026',
    owner: 'CRA / Vendor',
    lockPopulation: true,
    hasSae: false,
    hasEndpointIssue: true,
    timeline: [
      { label: 'Screening', date: '12 Jan 2026', state: 'completed' },
      { label: 'Day 1', date: '25 Jan 2026', state: 'completed' },
      { label: 'Week 12', date: '28 Apr 2026', state: 'completed' },
      { label: 'Week 24', date: '15 Jul 2026', state: 'in_progress' },
      { label: 'Week 36', date: '10 Oct 2026', state: 'missed' },
      { label: 'End of Study', date: '28 Sep 2026', state: 'completed' },
    ],
    keyInfo: {
      ageSex: '62 / Male',
      investigator: 'Dr. Alan Smith',
      enrolmentDate: '12 Jan 2026',
      lastVisitDate: '28 Sep 2026',
      analysisSet: 'mITT',
      arm: 'Treatment Arm A (Investigational)',
      randomization: '# 1001-012',
    },
    domainBreakdown: [
      { domain: 'EDC Data Cleaning', status: 'Complete', details: 'All forms entered', completion: 100 },
      { domain: 'Query Resolution', status: 'Action Required', details: '2 open queries (1 critical)', completion: 75 },
      { domain: 'External Data Reconciliation', status: 'Action Required', details: 'Lab result pending (Week 24)', completion: 60 },
      { domain: 'Safety Reconciliation', status: 'Complete', details: 'No discrepancies', completion: 100 },
      { domain: 'Medical Coding', status: 'Complete', details: 'All applicable terms coded', completion: 100 },
      { domain: 'PI Signatures', status: 'Action Required', details: '1 signature pending (EOS)', completion: 88 },
      { domain: 'Protocol Deviations', status: 'Complete', details: 'No open deviations', completion: 100 },
      { domain: 'SDV / SDR', status: 'Action Required', details: '3 forms pending SDV', completion: 70 },
    ],
    openItems: [
      { category: 'Query Management', id: 'QRY-104-2026-001', issue: 'Endpoint date mismatch (Tumor Assessment)', severity: 'Critical', daysOpen: 12 },
      { category: 'External Data', id: 'LAB-104-024', issue: 'Lab result not received (Week 24)', severity: 'Critical', daysOpen: 10 },
      { category: 'PI Signature', id: 'SIG-104-012', issue: 'Investigator signature pending (EOS)', severity: 'Routine', daysOpen: 8 },
      { category: 'SDV / SDR', id: 'SDV-104-012A', issue: 'SDV pending – Tumor Assessment', severity: 'Routine', daysOpen: 7 },
      { category: 'SDV / SDR', id: 'SDV-104-012B', issue: 'SDV pending – Safety Follow-up', severity: 'Routine', daysOpen: 6 },
    ],
    risksAndImpact: [
      { level: 'Critical', text: 'Endpoint-critical query open on Tumor Assessment. Needs site response; may impact analysis dataset if not resolved.' },
      { level: 'Medium', text: 'Lab result pending from central lab (Week 24). Expected by 05 Nov 2026.' },
    ],
    nextBestActions: [
      { action: 'Follow up on endpoint-critical query', owner: 'CRA', targetDate: '02 Nov 2026', status: 'Open' },
      { action: 'Obtain lab result from vendor', owner: 'Vendor Manager', targetDate: '05 Nov 2026', status: 'In Progress' },
      { action: 'Obtain PI signature (EOS)', owner: 'Site', targetDate: '07 Nov 2026', status: 'Open' },
      { action: 'Complete SDV for 3 forms', owner: 'CRA', targetDate: '07 Nov 2026', status: 'Open' },
    ],
  },
  {
    id: 'CA209-301-317-006',
    siteId: '317',
    country: 'Germany',
    status: 'Completed',
    readiness: 45,
    classification: 'Hard Blocked',
    keyOpenItems: 'Lab result pending, 2 critical queries, SAE outcome mismatch',
    criticality: 'Critical',
    daysOpen: 14,
    lastActivity: '25 Oct 2026',
    owner: 'DM / Safety',
    lockPopulation: true,
    hasSae: true,
    hasEndpointIssue: true,
    timeline: [
      { label: 'Screening', date: '04 Jan 2026', state: 'completed' },
      { label: 'Day 1', date: '18 Jan 2026', state: 'completed' },
      { label: 'Week 12', date: '14 Apr 2026', state: 'completed' },
      { label: 'Week 24', date: '06 Jul 2026', state: 'in_progress' },
      { label: 'Week 36', date: '28 Sep 2026', state: 'in_progress' },
      { label: 'End of Study', date: '18 Oct 2026', state: 'completed' },
    ],
    keyInfo: {
      ageSex: '58 / Female',
      investigator: 'Prof. Dr. H. Weber',
      enrolmentDate: '04 Jan 2026',
      lastVisitDate: '18 Oct 2026',
      analysisSet: 'mITT',
      arm: 'Treatment Arm B (Standard)',
      randomization: '# 3170-006',
    },
    domainBreakdown: [
      { domain: 'EDC Data Cleaning', status: 'Action Required', details: '2 incomplete forms', completion: 72 },
      { domain: 'Query Resolution', status: 'Action Required', details: '2 critical queries open', completion: 50 },
      { domain: 'External Data Reconciliation', status: 'Action Required', details: 'Central lab batch pending', completion: 40 },
      { domain: 'Safety Reconciliation', status: 'Action Required', details: '1 SAE outcome mismatch', completion: 45 },
      { domain: 'Medical Coding', status: 'Action Required', details: '1 low confidence term', completion: 80 },
      { domain: 'PI Signatures', status: 'Action Required', details: 'Week 24 signature overdue', completion: 50 },
      { domain: 'Protocol Deviations', status: 'Action Required', details: '1 major eligibility deviation', completion: 60 },
      { domain: 'SDV / SDR', status: 'Action Required', details: 'SDV pending on lesion', completion: 55 },
    ],
    openItems: [
      { category: 'Safety Reconciliation', id: 'SAE-2026-017', issue: 'SAE outcome mismatch (Recovered vs Fatal)', severity: 'Critical', daysOpen: 10 },
      { category: 'Query Management', id: 'QRY-317-2026-042', issue: 'ALT value out of expected range', severity: 'Critical', daysOpen: 12 },
      { category: 'PI Signature', id: 'SIG-317-006', issue: 'Tumor Assessment signature overdue', severity: 'Critical', daysOpen: 14 },
    ],
    risksAndImpact: [
      { level: 'Critical', text: 'Hard-blocked by unresolved SAE outcome mismatch between Rave and Argus.' },
      { level: 'Critical', text: 'Site 317 has no monitoring activity in the last 5 days.' },
    ],
    nextBestActions: [
      { action: 'Resolve SAE outcome mismatch in Argus', owner: 'Safety Lead', targetDate: '02 Nov 2026', status: 'Open' },
      { action: 'Escalate Site 317 PI signature & query backlog', owner: 'CRA', targetDate: '03 Nov 2026', status: 'Open' },
    ],
  },
  {
    id: 'CA209-301-405-014',
    siteId: '405',
    country: 'South Korea',
    status: 'Completed',
    readiness: 52,
    classification: 'Hard Blocked',
    keyOpenItems: 'Imaging data pending, SAE seriousness mismatch, PI signature',
    criticality: 'Critical',
    daysOpen: 12,
    lastActivity: '24 Oct 2026',
    owner: 'Site / Vendor',
    lockPopulation: true,
    hasSae: true,
    hasEndpointIssue: true,
    timeline: [
      { label: 'Screening', date: '10 Jan 2026', state: 'completed' },
      { label: 'Day 1', date: '22 Jan 2026', state: 'completed' },
      { label: 'Week 12', date: '20 Apr 2026', state: 'completed' },
      { label: 'Week 24', date: '12 Jul 2026', state: 'completed' },
      { label: 'Week 36', date: '04 Oct 2026', state: 'in_progress' },
      { label: 'End of Study', date: '22 Oct 2026', state: 'completed' },
    ],
    keyInfo: {
      ageSex: '65 / Male',
      investigator: 'Dr. Min-Jun Park',
      enrolmentDate: '10 Jan 2026',
      lastVisitDate: '22 Oct 2026',
      analysisSet: 'mITT',
      arm: 'Treatment Arm A (Investigational)',
      randomization: '# 4050-014',
    },
    domainBreakdown: [
      { domain: 'EDC Data Cleaning', status: 'Action Required', details: 'ePRO EOS not started', completion: 78 },
      { domain: 'Query Resolution', status: 'Action Required', details: '1 high priority query', completion: 80 },
      { domain: 'External Data Reconciliation', status: 'Action Required', details: 'eCOA Day 180 missing', completion: 50 },
      { domain: 'Safety Reconciliation', status: 'Action Required', details: '1 SAE seriousness mismatch', completion: 40 },
      { domain: 'Medical Coding', status: 'Action Required', details: '1 WHODrug term pending', completion: 85 },
      { domain: 'PI Signatures', status: 'Action Required', details: 'EOS casebook unsigned', completion: 60 },
      { domain: 'Protocol Deviations', status: 'Complete', details: '1 important deviation tracked', completion: 90 },
      { domain: 'SDV / SDR', status: 'Action Required', details: 'SDR pending on AE', completion: 70 },
    ],
    openItems: [
      { category: 'Safety Reconciliation', id: 'SAE-2026-001', issue: 'SAE seriousness mismatch (Non-Serious vs Serious)', severity: 'Critical', daysOpen: 12 },
      { category: 'External Data', id: 'EXT-405-014', issue: 'Missing ePRO Day 180 assessment', severity: 'Critical', daysOpen: 10 },
    ],
    risksAndImpact: [
      { level: 'Critical', text: 'Hard-blocked by SAE seriousness mismatch blocking safety freeze.' },
    ],
    nextBestActions: [
      { action: 'Reconcile SAE seriousness with Seoul site', owner: 'Safety Lead', targetDate: '02 Nov 2026', status: 'Open' },
      { action: 'Follow up eCOA sync at Site 405', owner: 'CRA', targetDate: '04 Nov 2026', status: 'Open' },
    ],
  },
  {
    id: 'CA209-301-208-003',
    siteId: '208',
    country: 'France',
    status: 'Completed',
    readiness: 82,
    classification: 'Conditionally Ready',
    keyOpenItems: 'Lab value mismatch (ALT), 1 routine Con Med query',
    criticality: 'Medium',
    daysOpen: 8,
    lastActivity: '28 Oct 2026',
    owner: 'DM',
    lockPopulation: true,
    hasSae: false,
    hasEndpointIssue: false,
    timeline: [
      { label: 'Screening', date: '15 Jan 2026', state: 'completed' },
      { label: 'Day 1', date: '29 Jan 2026', state: 'completed' },
      { label: 'Week 12', date: '24 Apr 2026', state: 'completed' },
      { label: 'Week 24', date: '18 Jul 2026', state: 'completed' },
      { label: 'Week 36', date: '11 Oct 2026', state: 'completed' },
      { label: 'End of Study', date: '26 Oct 2026', state: 'completed' },
    ],
    keyInfo: {
      ageSex: '54 / Female',
      investigator: 'Dr. Claire Moreau',
      enrolmentDate: '15 Jan 2026',
      lastVisitDate: '26 Oct 2026',
      analysisSet: 'PP',
      arm: 'Treatment Arm A (Investigational)',
      randomization: '# 2080-003',
    },
    domainBreakdown: [
      { domain: 'EDC Data Cleaning', status: 'Complete', details: 'All forms complete', completion: 100 },
      { domain: 'Query Resolution', status: 'Action Required', details: '1 medium Con Med query', completion: 90 },
      { domain: 'External Data Reconciliation', status: 'Action Required', details: 'ALT value mismatch', completion: 80 },
      { domain: 'Safety Reconciliation', status: 'Complete', details: 'No discrepancies', completion: 100 },
      { domain: 'Medical Coding', status: 'Complete', details: 'All coded', completion: 100 },
      { domain: 'PI Signatures', status: 'Complete', details: 'Signed', completion: 100 },
      { domain: 'Protocol Deviations', status: 'Complete', details: 'None', completion: 100 },
      { domain: 'SDV / SDR', status: 'Complete', details: 'Verified', completion: 100 },
    ],
    openItems: [
      { category: 'External Data', id: 'EXT-004', issue: 'ALT value mismatch between EDC and Central Lab', severity: 'Routine', daysOpen: 8 },
    ],
    risksAndImpact: [
      { level: 'Medium', text: 'Routine lab value reconciliation in progress; no DBL delay expected.' },
    ],
    nextBestActions: [
      { action: 'Confirm ALT unit conversion with DM', owner: 'DM', targetDate: '04 Nov 2026', status: 'In Progress' },
    ],
  },
  {
    id: 'CA209-301-120-011',
    siteId: '120',
    country: 'Canada',
    status: 'Completed',
    readiness: 96,
    classification: 'Lock Ready',
    keyOpenItems: 'None',
    criticality: 'Low',
    daysOpen: 0,
    lastActivity: '30 Oct 2026',
    owner: '—',
    lockPopulation: true,
    hasSae: false,
    hasEndpointIssue: false,
    timeline: [
      { label: 'Screening', date: '05 Jan 2026', state: 'completed' },
      { label: 'Day 1', date: '19 Jan 2026', state: 'completed' },
      { label: 'Week 12', date: '12 Apr 2026', state: 'completed' },
      { label: 'Week 24', date: '05 Jul 2026', state: 'completed' },
      { label: 'Week 36', date: '27 Sep 2026', state: 'completed' },
      { label: 'End of Study', date: '20 Oct 2026', state: 'completed' },
    ],
    keyInfo: {
      ageSex: '60 / Male',
      investigator: 'Dr. Liam Vance',
      enrolmentDate: '05 Jan 2026',
      lastVisitDate: '20 Oct 2026',
      analysisSet: 'mITT',
      arm: 'Treatment Arm B (Standard)',
      randomization: '# 1200-011',
    },
    domainBreakdown: [
      { domain: 'EDC Data Cleaning', status: 'Complete', details: '100% verified', completion: 100 },
      { domain: 'Query Resolution', status: 'Complete', details: '0 open queries', completion: 100 },
      { domain: 'External Data Reconciliation', status: 'Complete', details: 'Reconciled', completion: 100 },
      { domain: 'Safety Reconciliation', status: 'Complete', details: 'Reconciled', completion: 100 },
      { domain: 'Medical Coding', status: 'Complete', details: 'Coded', completion: 100 },
      { domain: 'PI Signatures', status: 'Complete', details: 'Signed', completion: 100 },
      { domain: 'Protocol Deviations', status: 'Complete', details: 'None', completion: 100 },
      { domain: 'SDV / SDR', status: 'Complete', details: '100% verified', completion: 100 },
    ],
    openItems: [],
    risksAndImpact: [],
    nextBestActions: [],
  },
];

export interface V3ActionRow {
  id: string;
  priority: number;
  title: string;
  domain: string;
  studySite: string;
  owner: string;
  dueDate: string;
  estDblImpactDays: number;
  status: 'Open' | 'In Progress' | 'Overdue';
  actionLabel: string;
}

export const V3_ACTIONS: V3ActionRow[] = [
  { id: 'ACT-1', priority: 1, title: 'Obtain final lab data transfer from vendor', domain: 'External Data', studySite: 'Study', owner: 'Vendor Manager', dueDate: '10 Dec 2026', estDblImpactDays: -4, status: 'Open', actionLabel: 'Escalate' },
  { id: 'ACT-2', priority: 1, title: 'Resolve 12 endpoint-critical queries', domain: 'Query Resolution', studySite: 'Site 317 (DE)', owner: 'Data Management', dueDate: '04 Nov 2026', estDblImpactDays: -2, status: 'Open', actionLabel: 'Assign' },
  { id: 'ACT-3', priority: 1, title: 'Resolve 2 SAE discrepancies', domain: 'Safety Reconciliation', studySite: 'Site 405 (KR)', owner: 'Safety Lead', dueDate: '05 Nov 2026', estDblImpactDays: -1, status: 'In Progress', actionLabel: 'Review' },
  { id: 'ACT-4', priority: 2, title: 'Obtain 18 outstanding PI signatures', domain: 'PI Signatures', studySite: '3 sites', owner: 'Clinical Operations', dueDate: '07 Nov 2026', estDblImpactDays: -1, status: 'Open', actionLabel: 'Follow up' },
  { id: 'ACT-5', priority: 2, title: 'Complete SDV for 3 critical subjects', domain: 'SDV / SDR', studySite: 'Site 208 (FR)', owner: 'CRA', dueDate: '06 Nov 2026', estDblImpactDays: -0.5, status: 'Open', actionLabel: 'Assign' },
  { id: 'ACT-6', priority: 2, title: 'Review and close 6 protocol deviations', domain: 'Protocol Deviations', studySite: 'Study', owner: 'Clinical Ops', dueDate: '10 Nov 2026', estDblImpactDays: -0.5, status: 'Open', actionLabel: 'Review' },
  { id: 'ACT-7', priority: 3, title: 'Complete coding for 25 pending terms', domain: 'Medical Coding', studySite: 'Study', owner: 'Coding Lead', dueDate: '12 Nov 2026', estDblImpactDays: 0, status: 'In Progress', actionLabel: 'Track' },
  { id: 'ACT-8', priority: 3, title: 'Follow up eCOA missing assessments', domain: 'External Data', studySite: 'Site 405 (KR)', owner: 'Site / CRA', dueDate: '08 Nov 2026', estDblImpactDays: -0.5, status: 'Overdue', actionLabel: 'Escalate' },
];

export const V3_SIMULATION_SCENARIOS: SimulationScenarioInput[] = [
  { id: 'sim-lab', label: 'Lab data transfer received by 10 Dec 2026', daysSaved: 4, readinessGainPts: 14, probGainPts: 24, enabled: true },
  { id: 'sim-queries', label: 'All critical queries closed by 04 Nov 2026', daysSaved: 2, readinessGainPts: 7, probGainPts: 10, enabled: true },
  { id: 'sim-pi', label: 'All PI signatures completed by 07 Nov 2026', daysSaved: 1, readinessGainPts: 5, probGainPts: 6, enabled: true },
];
