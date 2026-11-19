import {
  computePortfolioPriorityScore,
  type SimulationScenarioInput,
  type SubjectClassification,
} from '../lib/dblEngine';

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

export interface V3SiteSpec {
  id: string;
  name: string;
  country: string;
  piName: string;
  enrolled: number;
  completed: number;
  discontinued: number;
  readiness: number;
  expectedReadiness: number;
  trend7d: number;
  riskLevel: 'On track' | 'At risk' | 'High risk';
  criticalSubjects: number;
  hardGateBlockers: number;
  dblImpactDays: number;
  primaryDriver: string;
  lastVisitDate: string;
  dataCutoffDate: string;
  lastActivity: string;
  plannedFreezeDate: string;
  estReadyDate: string;
  requiredReadyDate: string;
  riskDrivers: { title: string; detail: string; impactDays: number; hardGate: boolean }[];
}

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

export interface V3ActionRow {
  id: string;
  priority: number;
  title: string;
  domain: string;
  studySite: string;
  siteId?: string;
  subjectId?: string;
  owner: string;
  dueDate: string;
  estDblImpactDays: number;
  status: 'Open' | 'In Progress' | 'Overdue';
  actionLabel: string;
}

export interface V3PortfolioStudy {
  id: string;
  title: string;
  indication: string;
  phase: string;
  therapeuticArea: string;
  sitesCount: number;
  subjectsCount: number;
  cleanSubjects: number;
  readiness: number;
  expected: number;
  trend7d: number;
  lslvDate: string;
  targetDbl: string;
  predictedDbl: string;
  delayDays: number;
  probDelay: number;
  riskTier: 'Critical' | 'High' | 'Medium' | 'Low';
  hardGates: number;
  criticalSites: number;
  criticalDomain: string;
  criticalDriver: string;
  recoverableDays: number;
  owner: string;
  actionStatus: 'Escalated' | 'In Progress' | 'Assigned' | 'On Track';
  countries: string[];
  milestones: string[];
  priorityScore: number;
}

export const V3_STUDY_META = {
  protocol: 'CA-209-301',
  title: 'A Phase 3, Randomized Study of Dual Immunotherapy in Advanced NSCLC',
  therapeuticArea: 'Oncology',
  phase: 'Phase III',
  regions: 'US, DE, FR, KR, CA, ES',
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

export const V3_SITES: V3SiteSpec[] = [
  {
    id: '317',
    name: 'Charité Comprehensive Cancer Center',
    country: 'Germany',
    piName: 'Prof. Dr. H. Weber',
    enrolled: 20,
    completed: 16,
    discontinued: 2,
    readiness: 48,
    expectedReadiness: 78,
    trend7d: -4,
    riskLevel: 'High risk',
    criticalSubjects: 10,
    hardGateBlockers: 3,
    dblImpactDays: 3,
    primaryDriver: 'Pending lab data, 10 critical queries, SAE outcome mismatch',
    lastVisitDate: '22 Oct 2026',
    dataCutoffDate: '05 Dec 2026',
    lastActivity: '25 Oct 2026',
    plannedFreezeDate: '08 Dec 2026',
    estReadyDate: '15 Dec 2026',
    requiredReadyDate: '08 Dec 2026',
    riskDrivers: [
      { title: '10 critical EDC queries open > 10 days', detail: '6 RECIST endpoint queries & 4 lab range queries', impactDays: 1.5, hardGate: true },
      { title: '1 unresolved SAE outcome mismatch', detail: 'Subject CA209-301-317-006 (Recovered vs Fatal)', impactDays: 1.0, hardGate: true },
      { title: '16 PI signatures overdue', detail: 'Oldest overdue by 14 days', impactDays: 0.5, hardGate: true },
    ],
  },
  {
    id: '405',
    name: 'Seoul National University Hospital',
    country: 'South Korea',
    piName: 'Dr. Min-Jun Park',
    enrolled: 16,
    completed: 13,
    discontinued: 1,
    readiness: 55,
    expectedReadiness: 80,
    trend7d: -2,
    riskLevel: 'High risk',
    criticalSubjects: 8,
    hardGateBlockers: 2,
    dblImpactDays: 2,
    primaryDriver: 'Imaging data pending, eCOA sync & SAE seriousness mismatch',
    lastVisitDate: '24 Oct 2026',
    dataCutoffDate: '06 Dec 2026',
    lastActivity: '24 Oct 2026',
    plannedFreezeDate: '09 Dec 2026',
    estReadyDate: '14 Dec 2026',
    requiredReadyDate: '09 Dec 2026',
    riskDrivers: [
      { title: 'SAE seriousness mismatch (Non-Serious vs Serious)', detail: 'Subject CA209-301-405-014 blocking safety freeze', impactDays: 1.0, hardGate: true },
      { title: 'eCOA / ePRO sync backlog (136 assessments)', detail: 'Missing Day 180 & EOS assessments', impactDays: 1.0, hardGate: true },
    ],
  },
  {
    id: '104',
    name: 'Memorial Hospital (Boston)',
    country: 'United States',
    piName: 'Dr. Alan Smith',
    enrolled: 22,
    completed: 18,
    discontinued: 2,
    readiness: 62,
    expectedReadiness: 82,
    trend7d: -4,
    riskLevel: 'High risk',
    criticalSubjects: 6,
    hardGateBlockers: 2,
    dblImpactDays: 2,
    primaryDriver: 'Central lab transfer delayed, 14 ageing queries, 3 PI signatures',
    lastVisitDate: '28 Oct 2026',
    dataCutoffDate: '05 Dec 2026',
    lastActivity: '30 Oct 2026',
    plannedFreezeDate: '07 Dec 2026',
    estReadyDate: '12 Dec 2026',
    requiredReadyDate: '07 Dec 2026',
    riskDrivers: [
      { title: '14 ageing EDC queries (6 endpoint-critical)', detail: '4 open > 10 days; tumor assessment date conflict', impactDays: 1.5, hardGate: true },
      { title: 'Central laboratory data transfer delayed', detail: 'Expected 29 Oct, not received as of 31 Oct (22 subjects affected)', impactDays: 2.0, hardGate: true },
      { title: 'Three PI signatures overdue', detail: 'Oldest overdue by 9 days; 2 subjects otherwise clean', impactDays: 0.5, hardGate: false },
    ],
  },
  {
    id: '208',
    name: 'Centre Hospitalier (Paris)',
    country: 'France',
    piName: 'Dr. Claire Moreau',
    enrolled: 16,
    completed: 13,
    discontinued: 1,
    readiness: 68,
    expectedReadiness: 80,
    trend7d: 3,
    riskLevel: 'At risk',
    criticalSubjects: 6,
    hardGateBlockers: 1,
    dblImpactDays: 1,
    primaryDriver: '6 PI signatures, 4 data entry forms, SDV for 3 subjects',
    lastVisitDate: '26 Oct 2026',
    dataCutoffDate: '06 Dec 2026',
    lastActivity: '30 Oct 2026',
    plannedFreezeDate: '10 Dec 2026',
    estReadyDate: '12 Dec 2026',
    requiredReadyDate: '10 Dec 2026',
    riskDrivers: [
      { title: 'SDV pending for 3 critical subjects', detail: 'On-site CRA visit scheduled 04 Nov', impactDays: 0.5, hardGate: false },
      { title: 'ALT central lab value mismatch', detail: 'Subject CA209-301-208-003 unit conversion check', impactDays: 0.5, hardGate: false },
    ],
  },
  {
    id: '344',
    name: 'University Hospital Heidelberg',
    country: 'Germany',
    piName: 'Dr. K. Becker',
    enrolled: 12,
    completed: 10,
    discontinued: 1,
    readiness: 71,
    expectedReadiness: 80,
    trend7d: 2,
    riskLevel: 'At risk',
    criticalSubjects: 3,
    hardGateBlockers: 0,
    dblImpactDays: 1,
    primaryDriver: '8 open queries, 14 uncoded AE terms',
    lastVisitDate: '25 Oct 2026',
    dataCutoffDate: '07 Dec 2026',
    lastActivity: '29 Oct 2026',
    plannedFreezeDate: '10 Dec 2026',
    estReadyDate: '11 Dec 2026',
    requiredReadyDate: '10 Dec 2026',
    riskDrivers: [
      { title: '8 open EDC queries', detail: '2 endpoint-adjacent lab queries', impactDays: 1.0, hardGate: false },
    ],
  },
  {
    id: '455',
    name: 'Asan Medical Center',
    country: 'South Korea',
    piName: 'Dr. S. H. Kim',
    enrolled: 12,
    completed: 9,
    discontinued: 1,
    readiness: 74,
    expectedReadiness: 80,
    trend7d: 1,
    riskLevel: 'At risk',
    criticalSubjects: 3,
    hardGateBlockers: 0,
    dblImpactDays: 1,
    primaryDriver: 'Imaging central read pending for 4 subjects',
    lastVisitDate: '23 Oct 2026',
    dataCutoffDate: '07 Dec 2026',
    lastActivity: '28 Oct 2026',
    plannedFreezeDate: '10 Dec 2026',
    estReadyDate: '11 Dec 2026',
    requiredReadyDate: '10 Dec 2026',
    riskDrivers: [
      { title: 'Central imaging read turnaround', detail: '4 Week-24 scans awaiting central radiologist sign-off', impactDays: 1.0, hardGate: false },
    ],
  },
  {
    id: '788',
    name: 'Centre Léon Bérard',
    country: 'France',
    piName: 'Dr. M. Laurent',
    enrolled: 10,
    completed: 9,
    discontinued: 0,
    readiness: 77,
    expectedReadiness: 80,
    trend7d: 4,
    riskLevel: 'At risk',
    criticalSubjects: 2,
    hardGateBlockers: 0,
    dblImpactDays: 0,
    primaryDriver: '4 PI signatures & 6 SDV items',
    lastVisitDate: '26 Oct 2026',
    dataCutoffDate: '08 Dec 2026',
    lastActivity: '30 Oct 2026',
    plannedFreezeDate: '10 Dec 2026',
    estReadyDate: '09 Dec 2026',
    requiredReadyDate: '10 Dec 2026',
    riskDrivers: [
      { title: '4 routine PI signatures', detail: 'Scheduled for PI sign-off 03 Nov', impactDays: 0, hardGate: false },
    ],
  },
  {
    id: '511',
    name: 'Madrid Research Institute',
    country: 'Spain',
    piName: 'Dr. C. Ruiz',
    enrolled: 12,
    completed: 10,
    discontinued: 1,
    readiness: 80,
    expectedReadiness: 82,
    trend7d: 3,
    riskLevel: 'At risk',
    criticalSubjects: 2,
    hardGateBlockers: 0,
    dblImpactDays: 0,
    primaryDriver: '1 routine query & 2 protocol deviations under review',
    lastVisitDate: '27 Oct 2026',
    dataCutoffDate: '08 Dec 2026',
    lastActivity: '29 Oct 2026',
    plannedFreezeDate: '10 Dec 2026',
    estReadyDate: '09 Dec 2026',
    requiredReadyDate: '10 Dec 2026',
    riskDrivers: [],
  },
  {
    id: '120',
    name: 'Toronto General Hospital',
    country: 'Canada',
    piName: 'Dr. Liam Vance',
    enrolled: 12,
    completed: 11,
    discontinued: 0,
    readiness: 90,
    expectedReadiness: 85,
    trend7d: 2,
    riskLevel: 'On track',
    criticalSubjects: 1,
    hardGateBlockers: 0,
    dblImpactDays: 0,
    primaryDriver: '2 minor deviations',
    lastVisitDate: '29 Oct 2026',
    dataCutoffDate: '08 Dec 2026',
    lastActivity: '30 Oct 2026',
    plannedFreezeDate: '09 Dec 2026',
    estReadyDate: '06 Dec 2026',
    requiredReadyDate: '09 Dec 2026',
    riskDrivers: [],
  },
  {
    id: '901',
    name: 'MD Anderson Cancer Center',
    country: 'United States',
    piName: 'Dr. R. Patel',
    enrolled: 12,
    completed: 11,
    discontinued: 1,
    readiness: 93,
    expectedReadiness: 85,
    trend7d: 4,
    riskLevel: 'On track',
    criticalSubjects: 0,
    hardGateBlockers: 0,
    dblImpactDays: 0,
    primaryDriver: 'On track for early freeze',
    lastVisitDate: '29 Oct 2026',
    dataCutoffDate: '08 Dec 2026',
    lastActivity: '30 Oct 2026',
    plannedFreezeDate: '08 Dec 2026',
    estReadyDate: '05 Dec 2026',
    requiredReadyDate: '08 Dec 2026',
    riskDrivers: [],
  },
  {
    id: '112',
    name: 'Memorial Sloan Kettering',
    country: 'United States',
    piName: 'Dr. E. Chen',
    enrolled: 12,
    completed: 11,
    discontinued: 0,
    readiness: 91,
    expectedReadiness: 85,
    trend7d: 3,
    riskLevel: 'On track',
    criticalSubjects: 0,
    hardGateBlockers: 0,
    dblImpactDays: 0,
    primaryDriver: '2 routine Con Med queries',
    lastVisitDate: '28 Oct 2026',
    dataCutoffDate: '08 Dec 2026',
    lastActivity: '30 Oct 2026',
    plannedFreezeDate: '08 Dec 2026',
    estReadyDate: '06 Dec 2026',
    requiredReadyDate: '08 Dec 2026',
    riskDrivers: [],
  },
  {
    id: '233',
    name: 'UCSF Medical Center',
    country: 'United States',
    piName: 'Dr. J. Alvarez',
    enrolled: 10,
    completed: 9,
    discontinued: 1,
    readiness: 94,
    expectedReadiness: 85,
    trend7d: 2,
    riskLevel: 'On track',
    criticalSubjects: 0,
    hardGateBlockers: 0,
    dblImpactDays: 0,
    primaryDriver: '1 routine SDV check',
    lastVisitDate: '29 Oct 2026',
    dataCutoffDate: '08 Dec 2026',
    lastActivity: '30 Oct 2026',
    plannedFreezeDate: '08 Dec 2026',
    estReadyDate: '05 Dec 2026',
    requiredReadyDate: '08 Dec 2026',
    riskDrivers: [],
  },
  {
    id: '990',
    name: 'Johns Hopkins Hospital',
    country: 'United States',
    piName: 'Dr. S. Brooks',
    enrolled: 10,
    completed: 10,
    discontinued: 0,
    readiness: 96,
    expectedReadiness: 85,
    trend7d: 1,
    riskLevel: 'On track',
    criticalSubjects: 0,
    hardGateBlockers: 0,
    dblImpactDays: 0,
    primaryDriver: 'Ready for freeze',
    lastVisitDate: '30 Oct 2026',
    dataCutoffDate: '08 Dec 2026',
    lastActivity: '31 Oct 2026',
    plannedFreezeDate: '08 Dec 2026',
    estReadyDate: '04 Dec 2026',
    requiredReadyDate: '08 Dec 2026',
    riskDrivers: [],
  },
  {
    id: '677',
    name: 'McGill University Health',
    country: 'Canada',
    piName: 'Dr. A. Tremblay',
    enrolled: 10,
    completed: 9,
    discontinued: 0,
    readiness: 88,
    expectedReadiness: 82,
    trend7d: 2,
    riskLevel: 'On track',
    criticalSubjects: 1,
    hardGateBlockers: 0,
    dblImpactDays: 0,
    primaryDriver: '3 routine coding reviews',
    lastVisitDate: '27 Oct 2026',
    dataCutoffDate: '08 Dec 2026',
    lastActivity: '29 Oct 2026',
    plannedFreezeDate: '09 Dec 2026',
    estReadyDate: '07 Dec 2026',
    requiredReadyDate: '09 Dec 2026',
    riskDrivers: [],
  },
  {
    id: '722',
    name: 'Institut Gustave Roussy',
    country: 'France',
    piName: 'Dr. P. Girard',
    enrolled: 10,
    completed: 9,
    discontinued: 1,
    readiness: 89,
    expectedReadiness: 82,
    trend7d: 3,
    riskLevel: 'On track',
    criticalSubjects: 0,
    hardGateBlockers: 0,
    dblImpactDays: 0,
    primaryDriver: '2 minor queries',
    lastVisitDate: '28 Oct 2026',
    dataCutoffDate: '08 Dec 2026',
    lastActivity: '30 Oct 2026',
    plannedFreezeDate: '09 Dec 2026',
    estReadyDate: '07 Dec 2026',
    requiredReadyDate: '09 Dec 2026',
    riskDrivers: [],
  },
  {
    id: '502',
    name: 'Royal Melbourne Hospital',
    country: 'Australia',
    piName: 'Dr. M. Hughes',
    enrolled: 8,
    completed: 7,
    discontinued: 1,
    readiness: 92,
    expectedReadiness: 85,
    trend7d: 2,
    riskLevel: 'On track',
    criticalSubjects: 0,
    hardGateBlockers: 0,
    dblImpactDays: 0,
    primaryDriver: 'All critical items closed',
    lastVisitDate: '29 Oct 2026',
    dataCutoffDate: '08 Dec 2026',
    lastActivity: '30 Oct 2026',
    plannedFreezeDate: '08 Dec 2026',
    estReadyDate: '05 Dec 2026',
    requiredReadyDate: '08 Dec 2026',
    riskDrivers: [],
  },
  {
    id: '566',
    name: 'Sydney Cancer Hospital',
    country: 'Australia',
    piName: 'Dr. L. Nguyen',
    enrolled: 8,
    completed: 8,
    discontinued: 0,
    readiness: 95,
    expectedReadiness: 85,
    trend7d: 1,
    riskLevel: 'On track',
    criticalSubjects: 0,
    hardGateBlockers: 0,
    dblImpactDays: 0,
    primaryDriver: 'Ready for freeze',
    lastVisitDate: '30 Oct 2026',
    dataCutoffDate: '08 Dec 2026',
    lastActivity: '31 Oct 2026',
    plannedFreezeDate: '08 Dec 2026',
    estReadyDate: '04 Dec 2026',
    requiredReadyDate: '08 Dec 2026',
    riskDrivers: [],
  },
  {
    id: '899',
    name: 'Hospital Clínic de Barcelona',
    country: 'Spain',
    piName: 'Dr. J. Soler',
    enrolled: 8,
    completed: 7,
    discontinued: 0,
    readiness: 86,
    expectedReadiness: 82,
    trend7d: 2,
    riskLevel: 'On track',
    criticalSubjects: 0,
    hardGateBlockers: 0,
    dblImpactDays: 0,
    primaryDriver: '1 routine PI signature',
    lastVisitDate: '28 Oct 2026',
    dataCutoffDate: '08 Dec 2026',
    lastActivity: '29 Oct 2026',
    plannedFreezeDate: '09 Dec 2026',
    estReadyDate: '07 Dec 2026',
    requiredReadyDate: '09 Dec 2026',
    riskDrivers: [],
  },
];

export const V3_COUNTRY_SUMMARY = [
  { country: 'United States', flag: '🇺🇸', sites: 5, readiness: 90, highRiskSites: 1, atRiskSites: 0, onTrackSites: 4, subjectsNotReady: 8, criticalBlockers: 2, forecastDays: 0, driver: 'Site 104 lab & query ageing', worstSite: 'Site 104', lat: 39.8, lon: -98.5 },
  { country: 'Germany', flag: '🇩🇪', sites: 2, readiness: 60, highRiskSites: 1, atRiskSites: 1, onTrackSites: 0, subjectsNotReady: 18, criticalBlockers: 4, forecastDays: 3, driver: 'Pending lab & critical queries', worstSite: 'Site 317', lat: 51.1, lon: 10.4 },
  { country: 'France', flag: '🇫🇷', sites: 3, readiness: 78, highRiskSites: 0, atRiskSites: 2, onTrackSites: 1, subjectsNotReady: 8, criticalBlockers: 1, forecastDays: 1, driver: 'PI signatures & SDV backlog', worstSite: 'Site 208', lat: 46.2, lon: 2.2 },
  { country: 'South Korea', flag: '🇰🇷', sites: 2, readiness: 64, highRiskSites: 1, atRiskSites: 1, onTrackSites: 0, subjectsNotReady: 12, criticalBlockers: 3, forecastDays: 2, driver: 'Imaging data & eCOA sync', worstSite: 'Site 405', lat: 35.9, lon: 127.7 },
  { country: 'Canada', flag: '🇨🇦', sites: 2, readiness: 89, highRiskSites: 0, atRiskSites: 0, onTrackSites: 2, subjectsNotReady: 3, criticalBlockers: 0, forecastDays: 0, driver: 'Minor protocol deviations', worstSite: 'Site 677', lat: 56.1, lon: -106.3 },
  { country: 'Spain', flag: '🇪🇸', sites: 2, readiness: 83, highRiskSites: 0, atRiskSites: 1, onTrackSites: 1, subjectsNotReady: 3, criticalBlockers: 0, forecastDays: 0, driver: '1 routine query', worstSite: 'Site 511', lat: 40.4, lon: -3.7 },
  { country: 'Australia', flag: '🇦🇺', sites: 2, readiness: 93, highRiskSites: 0, atRiskSites: 0, onTrackSites: 2, subjectsNotReady: 1, criticalBlockers: 0, forecastDays: 0, driver: 'On track', worstSite: 'Site 502', lat: -25.2, lon: 133.7 },
];

// Generate all 220 subjects deterministically with exact classification totals:
// 158 Lock Ready, 32 Conditionally Ready, 20 Action Required, 10 Hard Blocked
const HERO_SUBJECTS: Record<string, V3SubjectRow> = {
  'CA209-301-104-012': {
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
  'CA209-301-317-006': {
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
  'CA209-301-405-014': {
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
};

function buildAllSubjects(): V3SubjectRow[] {
  const rows: V3SubjectRow[] = [];
  let globalIdx = 0;

  for (const site of V3_SITES) {
    for (let i = 1; i <= site.enrolled; i++) {
      const num = String(i).padStart(3, '0');
      const id = `CA209-301-${site.id}-${num}`;
      if (HERO_SUBJECTS[id]) {
        rows.push(HERO_SUBJECTS[id]);
        globalIdx++;
        continue;
      }

      // Distribute remaining subjects to hit exact study totals:
      // 158 Lock Ready, 32 Conditionally Ready, 20 Action Required, 10 Hard Blocked
      let classification: SubjectClassification;
      if (globalIdx < 10) {
        classification = 'Hard Blocked';
      } else if (globalIdx < 30) {
        classification = 'Action Required';
      } else if (globalIdx < 62) {
        classification = 'Conditionally Ready';
      } else {
        classification = 'Lock Ready';
      }

      // Override high-risk sites so they have realistic non-ready concentration
      if (site.id === '317' && i <= 3) classification = 'Hard Blocked';
      else if (site.id === '317' && i <= 10) classification = 'Action Required';
      else if (site.id === '405' && i <= 2) classification = 'Hard Blocked';
      else if (site.id === '405' && i <= 8) classification = 'Action Required';
      else if (site.id === '104' && i <= 2) classification = 'Hard Blocked';
      else if (site.id === '104' && i <= 6) classification = 'Action Required';

      const readiness =
        classification === 'Lock Ready'
          ? 91 + ((i + Number(site.id)) % 9)
          : classification === 'Conditionally Ready'
          ? 78 + ((i + Number(site.id)) % 11)
          : classification === 'Action Required'
          ? 60 + ((i + Number(site.id)) % 17)
          : 40 + ((i + Number(site.id)) % 18);

      const criticality: V3SubjectRow['criticality'] =
        classification === 'Hard Blocked'
          ? 'Critical'
          : classification === 'Action Required'
          ? 'High'
          : classification === 'Conditionally Ready'
          ? 'Medium'
          : 'Low';

      const daysOpen =
        classification === 'Lock Ready'
          ? 0
          : classification === 'Conditionally Ready'
          ? 3 + (i % 5)
          : classification === 'Action Required'
          ? 7 + (i % 7)
          : 10 + (i % 8);

      const hasSae = classification === 'Hard Blocked' && i % 2 === 0;
      const hasEndpointIssue = classification === 'Hard Blocked' || (classification === 'Action Required' && i % 2 === 1);
      const lockPopulation = globalIdx % 11 !== 0;

      const keyOpenItems =
        classification === 'Lock Ready'
          ? 'None · Ready for casebook freeze'
          : classification === 'Conditionally Ready'
          ? '1 routine query · 1 coding review'
          : classification === 'Action Required'
          ? '1 endpoint query · PI signature pending'
          : hasSae
          ? 'SAE discrepancy · Central lab pending'
          : 'Hard-gate lab transfer & critical query';

      const openItems: V3SubjectRow['openItems'] =
        classification === 'Lock Ready'
          ? []
          : classification === 'Conditionally Ready'
          ? [
              { category: 'Query Management', id: `QRY-${site.id}-${num}`, issue: 'Con Med start date confirmation', severity: 'Routine', daysOpen },
            ]
          : [
              { category: 'Query Management', id: `QRY-${site.id}-${num}`, issue: 'Primary endpoint assessment verification', severity: 'Critical', daysOpen },
              ...(hasSae
                ? [{ category: 'Safety Reconciliation', id: `SAE-${site.id}-${num}`, issue: 'Argus vs EDC SAE date mismatch', severity: 'Critical' as const, daysOpen: daysOpen - 1 }]
                : [{ category: 'External Data', id: `LAB-${site.id}-${num}`, issue: 'Central lab panel result pending', severity: 'Critical' as const, daysOpen: daysOpen - 2 }]),
            ];

      rows.push({
        id,
        siteId: site.id,
        country: site.country,
        status: i % 10 === 0 ? 'Discontinued' : i % 4 === 0 ? 'Ongoing' : 'Completed',
        readiness,
        classification,
        keyOpenItems,
        criticality,
        daysOpen,
        lastActivity: classification === 'Lock Ready' ? '30 Oct 2026' : '26 Oct 2026',
        owner:
          classification === 'Lock Ready'
            ? '—'
            : hasSae
            ? 'Safety Lead'
            : classification === 'Hard Blocked'
            ? 'Vendor / DM'
            : 'Site / CRA',
        lockPopulation,
        hasSae,
        hasEndpointIssue,
        timeline: [
          { label: 'Screening', date: '08 Jan 2026', state: 'completed' },
          { label: 'Day 1', date: '22 Jan 2026', state: 'completed' },
          { label: 'Week 12', date: '18 Apr 2026', state: 'completed' },
          { label: 'Week 24', date: '12 Jul 2026', state: classification === 'Lock Ready' ? 'completed' : 'in_progress' },
          { label: 'Week 36', date: '04 Oct 2026', state: classification === 'Hard Blocked' ? 'missed' : 'completed' },
          { label: 'End of Study', date: '24 Oct 2026', state: classification === 'Lock Ready' ? 'completed' : 'in_progress' },
        ],
        keyInfo: {
          ageSex: `${52 + (i % 20)} / ${i % 2 === 0 ? 'Female' : 'Male'}`,
          investigator: site.piName,
          enrolmentDate: '08 Jan 2026',
          lastVisitDate: '24 Oct 2026',
          analysisSet: lockPopulation ? 'mITT' : 'Safety',
          arm: i % 2 === 0 ? 'Treatment Arm A' : 'Treatment Arm B',
          randomization: `# ${site.id}0-${num}`,
        },
        domainBreakdown: [
          { domain: 'EDC Data Cleaning', status: readiness >= 80 ? 'Complete' : 'Action Required', details: readiness >= 80 ? 'All forms entered' : '1 form incomplete', completion: Math.min(100, readiness + 8) },
          { domain: 'Query Resolution', status: classification === 'Lock Ready' ? 'Complete' : 'Action Required', details: classification === 'Lock Ready' ? '0 open queries' : 'Open query pending', completion: readiness },
          { domain: 'External Data Reconciliation', status: classification === 'Hard Blocked' ? 'Action Required' : 'Complete', details: classification === 'Hard Blocked' ? 'Lab transfer pending' : 'Reconciled', completion: classification === 'Hard Blocked' ? 50 : 100 },
          { domain: 'Safety Reconciliation', status: hasSae ? 'Action Required' : 'Complete', details: hasSae ? 'SAE discrepancy open' : 'No discrepancies', completion: hasSae ? 45 : 100 },
          { domain: 'Medical Coding', status: 'Complete', details: 'All terms coded', completion: 100 },
          { domain: 'PI Signatures', status: classification === 'Lock Ready' ? 'Complete' : 'Action Required', details: classification === 'Lock Ready' ? 'Signed' : 'Signature pending', completion: classification === 'Lock Ready' ? 100 : 75 },
          { domain: 'Protocol Deviations', status: 'Complete', details: 'Reviewed', completion: 100 },
          { domain: 'SDV / SDR', status: readiness >= 85 ? 'Complete' : 'Action Required', details: readiness >= 85 ? 'Verified' : 'SDV pending', completion: Math.min(100, readiness + 5) },
        ],
        openItems,
        risksAndImpact:
          openItems.length > 0
            ? [{ level: criticality === 'Critical' ? 'Critical' : 'Medium', text: `${keyOpenItems} at Site ${site.id}.` }]
            : [],
        nextBestActions:
          openItems.length > 0
            ? [{ action: `Resolve ${openItems[0].id} (${openItems[0].category})`, owner: 'CRA / DM', targetDate: '05 Nov 2026', status: 'Open' }]
            : [],
      });
      globalIdx++;
    }
  }
  return rows;
}

export const V3_SUBJECT_ROWS: V3SubjectRow[] = buildAllSubjects();

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
    breakdownRows: V3_SITES.map((s) => ({
      country: s.country,
      siteId: s.id,
      subjects: s.enrolled,
      expected: s.enrolled * 16,
      complete: Math.round(s.enrolled * 16 * (Math.min(99, s.readiness + 12) / 100)),
      incomplete: Math.max(1, s.enrolled * 16 - Math.round(s.enrolled * 16 * (Math.min(99, s.readiness + 12) / 100))),
      pctComplete: Math.min(99, s.readiness + 12),
      trend7d: `${s.trend7d >= 0 ? '+' : ''}${s.trend7d}%`,
      criticalItems: s.criticalSubjects,
      lastActivity: s.lastActivity,
      status: s.riskLevel,
    })),
    topPendingTitle: 'Recent Incomplete Forms (Top 10)',
    topPendingRows: [
      { id: 'EDC-101', subjectId: 'CA209-301-317-001', siteId: '317', visit: 'Week 24', form: 'Tumor Assessment', issue: 'Missing complete date', daysOpen: 12, criticality: 'Critical', owner: 'Site / CRA', status: 'Open', actionLabel: 'Inspect' },
      { id: 'EDC-102', subjectId: 'CA209-301-405-014', siteId: '405', visit: 'End of Study', form: 'ePRO', issue: 'Not started', daysOpen: 10, criticality: 'High', owner: 'Site', status: 'Open', actionLabel: 'Inspect' },
      { id: 'EDC-103', subjectId: 'CA209-301-317-006', siteId: '317', visit: 'Week 12', form: 'Concomitant Meds', issue: 'Incomplete fields (3)', daysOpen: 9, criticality: 'High', owner: 'Site', status: 'Open', actionLabel: 'Inspect' },
      { id: 'EDC-104', subjectId: 'CA209-301-104-012', siteId: '104', visit: 'Week 36', form: 'Adverse Events', issue: 'Pending verification', daysOpen: 7, criticality: 'Medium', owner: 'DM', status: 'In Progress', actionLabel: 'Inspect' },
      { id: 'EDC-105', subjectId: 'CA209-301-208-003', siteId: '208', visit: 'Week 24', form: 'Vital Signs', issue: 'Missing weight measurement', daysOpen: 6, criticality: 'Medium', owner: 'Site', status: 'Open', actionLabel: 'Inspect' },
      { id: 'EDC-106', subjectId: 'CA209-301-344-002', siteId: '344', visit: 'Week 12', form: 'Labs', issue: 'Collection time missing', daysOpen: 5, criticality: 'Medium', owner: 'Site', status: 'Open', actionLabel: 'Inspect' },
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
    breakdownRows: V3_SITES.map((s) => ({
      country: s.country,
      siteId: s.id,
      subjects: s.enrolled,
      expected: s.enrolled * 4,
      complete: Math.round(s.enrolled * 4 * (Math.min(98, s.readiness + 10) / 100)),
      incomplete: Math.max(0, s.enrolled * 4 - Math.round(s.enrolled * 4 * (Math.min(98, s.readiness + 10) / 100))),
      pctComplete: Math.min(98, s.readiness + 10),
      trend7d: `${s.trend7d >= 0 ? '+' : ''}${s.trend7d}%`,
      criticalItems: s.criticalSubjects,
      lastActivity: s.lastActivity,
      status: s.riskLevel,
    })),
    topPendingTitle: 'Top Open Queries (10)',
    topPendingRows: [
      { id: 'QRY-104-2026-001', subjectId: 'CA209-301-104-012', siteId: '104', visit: 'Week 24', form: 'Tumor Assessment / Assess Date', issue: 'Please confirm assessment date (source mismatch)', daysOpen: 16, criticality: 'Critical', owner: 'Site / CRA', status: 'Open', actionLabel: 'Inspect' },
      { id: 'QRY-317-2026-042', subjectId: 'CA209-301-317-006', siteId: '317', visit: 'Week 12', form: 'Labs / ALT', issue: 'ALT value out of expected range, please verify', daysOpen: 12, criticality: 'High', owner: 'DM', status: 'Open', actionLabel: 'Inspect' },
      { id: 'QRY-405-2026-018', subjectId: 'CA209-301-405-014', siteId: '405', visit: 'End of Study', form: 'ePRO / Q3', issue: 'Missing ePRO entry, please provide', daysOpen: 10, criticality: 'High', owner: 'Site', status: 'Open', actionLabel: 'Inspect' },
      { id: 'QRY-208-2026-037', subjectId: 'CA209-301-208-003', siteId: '208', visit: 'Week 36', form: 'Con Meds / Drug Start Date', issue: 'Invalid start date, please confirm', daysOpen: 8, criticality: 'Medium', owner: 'Site', status: 'In Progress', actionLabel: 'Inspect' },
      { id: 'QRY-317-2026-019', subjectId: 'CA209-301-317-002', siteId: '317', visit: 'Week 24', form: 'Target Lesion', issue: 'Sum of diameters discrepancy vs central read', daysOpen: 14, criticality: 'Critical', owner: 'CRA', status: 'Escalated', actionLabel: 'Inspect' },
      { id: 'QRY-104-2026-008', subjectId: 'CA209-301-104-003', siteId: '104', visit: 'Week 12', form: 'Adverse Events', issue: 'Relationship to study drug blank', daysOpen: 9, criticality: 'High', owner: 'Site', status: 'Open', actionLabel: 'Inspect' },
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
      { id: 'EXT-001', subjectId: 'CA209-301-104-012', siteId: '104', visit: 'Central Lab', form: 'Lab Result', issue: 'Result not received (Visit W24)', daysOpen: 12, criticality: 'Critical', owner: 'Lab Vendor', status: 'Open', actionLabel: 'Inspect' },
      { id: 'EXT-002', subjectId: 'CA209-301-405-014', siteId: '405', visit: 'eCOA', form: 'ePRO Assessment', issue: 'Missing assessment (Day 180)', daysOpen: 10, criticality: 'High', owner: 'Site', status: 'Open', actionLabel: 'Inspect' },
      { id: 'EXT-003', subjectId: 'CA209-301-317-006', siteId: '317', visit: 'Imaging', form: 'Image File', issue: 'Image quality issue – unreadable', daysOpen: 9, criticality: 'High', owner: 'Vendor', status: 'Open', actionLabel: 'Inspect' },
      { id: 'EXT-004', subjectId: 'CA209-301-208-003', siteId: '208', visit: 'Central Lab', form: 'Lab Result', issue: 'Value mismatch (ALT)', daysOpen: 8, criticality: 'High', owner: 'DM', status: 'In Progress', actionLabel: 'Inspect' },
      { id: 'EXT-005', subjectId: 'CA209-301-104-004', siteId: '104', visit: 'Central Lab', form: 'ctDNA Panel', issue: 'Batch #LXB-8921 checksum mismatch', daysOpen: 11, criticality: 'Critical', owner: 'Vendor Manager', status: 'Escalated', actionLabel: 'Inspect' },
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
    breakdownRows: V3_SITES.map((s) => ({
      country: s.country,
      siteId: s.id,
      subjects: s.enrolled,
      expected: s.enrolled * 2,
      complete: Math.round(s.enrolled * 2 * (Math.min(98, s.readiness + 8) / 100)),
      incomplete: Math.max(0, s.enrolled * 2 - Math.round(s.enrolled * 2 * (Math.min(98, s.readiness + 8) / 100))),
      pctComplete: Math.min(98, s.readiness + 8),
      trend7d: `${s.trend7d >= 0 ? '+' : ''}${s.trend7d}%`,
      criticalItems: s.hardGateBlockers,
      lastActivity: s.lastActivity,
      status: s.riskLevel,
    })),
    topPendingTitle: 'Top Open Safety Discrepancies (10)',
    topPendingRows: [
      { id: 'SAE-2026-001', subjectId: 'CA209-301-405-014', siteId: '405', visit: 'Seriousness', form: 'Non-Serious vs Serious', issue: 'SAE Seriousness Mismatch', daysOpen: 12, criticality: 'Critical', owner: 'Safety Lead', status: 'Open', actionLabel: 'Inspect' },
      { id: 'SAE-2026-017', subjectId: 'CA209-301-317-006', siteId: '317', visit: 'Outcome', form: 'Recovered vs Fatal', issue: 'SAE Outcome Mismatch', daysOpen: 10, criticality: 'Critical', owner: 'Safety Lead', status: 'Open', actionLabel: 'Inspect' },
      { id: 'SAE-2026-021', subjectId: 'CA209-301-317-002', siteId: '317', visit: 'Follow-up', form: 'Missing vs Available', issue: 'Missing Follow-up Info', daysOpen: 8, criticality: 'High', owner: 'DM', status: 'Open', actionLabel: 'Inspect' },
      { id: 'AE-2026-145', subjectId: 'CA209-301-104-010', siteId: '104', visit: 'Start Date', form: '12 Aug vs 14 Aug', issue: 'AE Date Mismatch', daysOpen: 6, criticality: 'Medium', owner: 'Site', status: 'In Progress', actionLabel: 'Inspect' },
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
    breakdownRows: V3_SITES.map((s) => ({
      country: s.country,
      siteId: s.id,
      subjects: s.enrolled,
      expected: s.enrolled * 14,
      complete: Math.round(s.enrolled * 14 * (Math.min(99, s.readiness + 14) / 100)),
      incomplete: Math.max(0, s.enrolled * 14 - Math.round(s.enrolled * 14 * (Math.min(99, s.readiness + 14) / 100))),
      pctComplete: Math.min(99, s.readiness + 14),
      trend7d: `${s.trend7d >= 0 ? '+' : ''}${s.trend7d}%`,
      criticalItems: Math.max(0, s.criticalSubjects - 1),
      lastActivity: s.lastActivity,
      status: s.riskLevel,
    })),
    topPendingTitle: 'Top Pending Coding Terms (10)',
    topPendingRows: [
      { id: 'COD-001', subjectId: 'CA209-301-317-006', siteId: '317', visit: 'AE', form: 'Pneumonitis', issue: 'Low Confidence (0.65 MedDRA)', daysOpen: 12, criticality: 'Critical', owner: 'Coder', status: 'Open', actionLabel: 'Inspect' },
      { id: 'COD-002', subjectId: 'CA209-301-405-014', siteId: '405', visit: 'CM', form: 'Paracetamol', issue: 'Pending Review (0.72 WHODrug)', daysOpen: 10, criticality: 'High', owner: 'Coder', status: 'Open', actionLabel: 'Inspect' },
      { id: 'COD-003', subjectId: 'CA209-301-317-004', siteId: '317', visit: 'AE', form: 'Rash maculopapular', issue: 'Pending Coding (0.88)', daysOpen: 9, criticality: 'High', owner: 'Coder', status: 'Open', actionLabel: 'Inspect' },
      { id: 'COD-004', subjectId: 'CA209-301-208-003', siteId: '208', visit: 'MH', form: 'Type 2 diabetes mellitus', issue: 'Pending Review (0.90)', daysOpen: 8, criticality: 'Medium', owner: 'Coder', status: 'Open', actionLabel: 'Inspect' },
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
    breakdownRows: V3_SITES.map((s) => ({
      country: s.country,
      siteId: s.id,
      subjects: s.enrolled,
      expected: s.enrolled,
      complete: Math.round(s.enrolled * (s.readiness / 100)),
      incomplete: Math.max(0, s.enrolled - Math.round(s.enrolled * (s.readiness / 100))),
      pctComplete: s.readiness,
      trend7d: `${s.trend7d >= 0 ? '+' : ''}${s.trend7d}%`,
      criticalItems: s.criticalSubjects,
      lastActivity: s.lastActivity,
      status: s.riskLevel,
    })),
    topPendingTitle: 'Pending PI Signatures (Top 10)',
    topPendingRows: [
      { id: 'SIG-001', subjectId: 'CA209-301-317-006', siteId: '317', visit: 'Week 24', form: 'Tumor Assessment', issue: 'Investigator signature overdue (Completed)', daysOpen: 14, criticality: 'Critical', owner: 'Site / CRA', status: 'Open', actionLabel: 'Inspect' },
      { id: 'SIG-002', subjectId: 'CA209-301-405-014', siteId: '405', visit: 'End of Study', form: 'eCRF Casebook', issue: 'Investigator signature overdue (Completed)', daysOpen: 12, criticality: 'High', owner: 'Site / CRA', status: 'Open', actionLabel: 'Inspect' },
      { id: 'SIG-003', subjectId: 'CA209-301-104-012', siteId: '104', visit: 'Week 36', form: 'Safety Follow-up', issue: 'Investigator signature pending', daysOpen: 8, criticality: 'High', owner: 'Site / CRA', status: 'Open', actionLabel: 'Inspect' },
      { id: 'SIG-004', subjectId: 'CA209-301-317-005', siteId: '317', visit: 'Week 12', form: 'Efficacy Endpoint', issue: 'Investigator signature pending', daysOpen: 7, criticality: 'Medium', owner: 'Site', status: 'Open', actionLabel: 'Inspect' },
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
    breakdownRows: V3_SITES.map((s) => ({
      country: s.country,
      siteId: s.id,
      subjects: s.enrolled,
      expected: s.enrolled + 8,
      complete: Math.round((s.enrolled + 8) * (Math.min(98, s.readiness + 12) / 100)),
      incomplete: Math.max(0, s.enrolled + 8 - Math.round((s.enrolled + 8) * (Math.min(98, s.readiness + 12) / 100))),
      pctComplete: Math.min(98, s.readiness + 12),
      trend7d: `${s.trend7d >= 0 ? '+' : ''}${s.trend7d}%`,
      criticalItems: Math.max(0, s.hardGateBlockers),
      lastActivity: s.lastActivity,
      status: s.riskLevel,
    })),
    topPendingTitle: 'Open Protocol Deviations (Top 10)',
    topPendingRows: [
      { id: 'PD-2026-104-012', subjectId: 'CA209-301-104-012', siteId: '104', visit: 'Visit Window', form: 'Week 24 visit outside allowed window', issue: 'Major · Impact on Analysis Set: Yes', daysOpen: 12, criticality: 'Critical', owner: 'Clinical Ops', status: 'Open', actionLabel: 'Inspect' },
      { id: 'PD-2026-317-006', subjectId: 'CA209-301-317-006', siteId: '317', visit: 'Eligibility', form: 'Inclusion criterion not met at screening', issue: 'Major · Impact on Analysis Set: Yes', daysOpen: 10, criticality: 'Critical', owner: 'Medical Monitor', status: 'Open', actionLabel: 'Inspect' },
      { id: 'PD-2026-405-014', subjectId: 'CA209-301-405-014', siteId: '405', visit: 'Concomitant Med', form: 'Prohibited medication used', issue: 'Important · Impact on Analysis Set: No', daysOpen: 9, criticality: 'High', owner: 'DM', status: 'In Progress', actionLabel: 'Inspect' },
      { id: 'PD-2026-208-003', subjectId: 'CA209-301-208-003', siteId: '208', visit: 'Procedure', form: 'Missed ECG at Week 12', issue: 'Important · Impact on Analysis Set: No', daysOpen: 8, criticality: 'Medium', owner: 'Site', status: 'Open', actionLabel: 'Inspect' },
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
    breakdownRows: V3_SITES.map((s) => ({
      country: s.country,
      siteId: s.id,
      subjects: s.enrolled,
      expected: s.enrolled * 24,
      complete: Math.round(s.enrolled * 24 * (Math.min(98, s.readiness + 10) / 100)),
      incomplete: Math.max(0, s.enrolled * 24 - Math.round(s.enrolled * 24 * (Math.min(98, s.readiness + 10) / 100))),
      pctComplete: Math.min(98, s.readiness + 10),
      trend7d: `${s.trend7d >= 0 ? '+' : ''}${s.trend7d}%`,
      criticalItems: s.criticalSubjects,
      lastActivity: s.lastActivity,
      status: s.riskLevel,
    })),
    topPendingTitle: 'Top Pending SDV / SDR Items (10)',
    topPendingRows: [
      { id: 'SDV-001', subjectId: 'CA209-301-317-006', siteId: '317', visit: 'Week 24', form: 'Tumor Assessment', issue: 'SDV pending on primary endpoint lesion', daysOpen: 16, criticality: 'Critical', owner: 'CRA', status: 'Open', actionLabel: 'Inspect' },
      { id: 'SDV-002', subjectId: 'CA209-301-405-014', siteId: '405', visit: 'Week 12', form: 'Safety Follow-up', issue: 'SDR pending on AE severity', daysOpen: 12, criticality: 'High', owner: 'DM', status: 'Open', actionLabel: 'Inspect' },
      { id: 'SDV-003', subjectId: 'CA209-301-104-012', siteId: '104', visit: 'End of Study', form: 'Concomitant Meds', issue: 'SDV pending', daysOpen: 10, criticality: 'High', owner: 'CRA', status: 'In Progress', actionLabel: 'Inspect' },
      { id: 'SDV-004', subjectId: 'CA209-301-317-002', siteId: '317', visit: 'Week 36', form: 'Labs', issue: 'SDR pending', daysOpen: 8, criticality: 'Medium', owner: 'DM', status: 'Open', actionLabel: 'Inspect' },
    ],
  },
];

export const V3_ACTIONS: V3ActionRow[] = [
  { id: 'ACT-1', priority: 1, title: 'Obtain final lab data transfer from vendor (#LXB-8921)', domain: 'External Data', studySite: 'Site 104 / Study', siteId: '104', subjectId: 'CA209-301-104-012', owner: 'Vendor Manager', dueDate: '10 Dec 2026', estDblImpactDays: -4, status: 'Open', actionLabel: 'Escalate' },
  { id: 'ACT-2', priority: 1, title: 'Resolve 12 endpoint-critical queries', domain: 'Query Resolution', studySite: 'Site 317 (DE)', siteId: '317', subjectId: 'CA209-301-317-006', owner: 'Data Management', dueDate: '04 Nov 2026', estDblImpactDays: -2, status: 'Open', actionLabel: 'Inspect' },
  { id: 'ACT-3', priority: 1, title: 'Resolve 2 SAE discrepancies (Argus vs EDC)', domain: 'Safety Reconciliation', studySite: 'Site 405 (KR)', siteId: '405', subjectId: 'CA209-301-405-014', owner: 'Safety Lead', dueDate: '05 Nov 2026', estDblImpactDays: -1, status: 'In Progress', actionLabel: 'Inspect' },
  { id: 'ACT-4', priority: 2, title: 'Obtain 18 outstanding PI signatures', domain: 'PI Signatures', studySite: 'Sites 104 / 317 / 405', siteId: '317', owner: 'Clinical Operations', dueDate: '07 Nov 2026', estDblImpactDays: -1, status: 'Open', actionLabel: 'Follow up' },
  { id: 'ACT-5', priority: 2, title: 'Complete SDV for 3 critical subjects', domain: 'SDV / SDR', studySite: 'Site 208 (FR)', siteId: '208', subjectId: 'CA209-301-208-003', owner: 'CRA', dueDate: '06 Nov 2026', estDblImpactDays: -0.5, status: 'Open', actionLabel: 'Inspect' },
  { id: 'ACT-6', priority: 2, title: 'Review and close 6 major protocol deviations', domain: 'Protocol Deviations', studySite: 'Site 104 (US)', siteId: '104', subjectId: 'CA209-301-104-012', owner: 'Clinical Ops', dueDate: '10 Nov 2026', estDblImpactDays: -0.5, status: 'Open', actionLabel: 'Inspect' },
  { id: 'ACT-7', priority: 3, title: 'Complete coding for 25 pending MedDRA/WHODrug terms', domain: 'Medical Coding', studySite: 'Site 317 (DE)', siteId: '317', owner: 'Coding Lead', dueDate: '12 Nov 2026', estDblImpactDays: 0, status: 'In Progress', actionLabel: 'Track' },
  { id: 'ACT-8', priority: 3, title: 'Follow up eCOA missing assessments (Day 180)', domain: 'External Data', studySite: 'Site 405 (KR)', siteId: '405', subjectId: 'CA209-301-405-014', owner: 'Site / CRA', dueDate: '08 Nov 2026', estDblImpactDays: -0.5, status: 'Overdue', actionLabel: 'Escalate' },
  { id: 'ACT-9', priority: 2, title: 'Reconcile central imaging unreadable scan (W24)', domain: 'External Data', studySite: 'Site 317 (DE)', siteId: '317', owner: 'Vendor Manager', dueDate: '06 Nov 2026', estDblImpactDays: -0.5, status: 'Overdue', actionLabel: 'Escalate' },
  { id: 'ACT-10', priority: 2, title: 'Close 4 overdue lab range queries', domain: 'Query Resolution', studySite: 'Site 104 (US)', siteId: '104', owner: 'Data Management', dueDate: '05 Nov 2026', estDblImpactDays: -0.5, status: 'Overdue', actionLabel: 'Inspect' },
  { id: 'ACT-11', priority: 3, title: 'Verify ALT unit conversion in central lab feed', domain: 'External Data', studySite: 'Site 208 (FR)', siteId: '208', subjectId: 'CA209-301-208-003', owner: 'Data Management', dueDate: '09 Nov 2026', estDblImpactDays: 0, status: 'In Progress', actionLabel: 'Track' },
  { id: 'ACT-12', priority: 3, title: 'Complete on-site SDV for Heidelberg cohort', domain: 'SDV / SDR', studySite: 'Site 344 (DE)', siteId: '344', owner: 'CRA', dueDate: '11 Nov 2026', estDblImpactDays: 0, status: 'Open', actionLabel: 'Assign' },
];

export const V3_SIMULATION_SCENARIOS: SimulationScenarioInput[] = [
  { id: 'sim-lab', label: 'Lab data transfer received by 10 Dec 2026', daysSaved: 4, readinessGainPts: 14, probGainPts: 24, enabled: true },
  { id: 'sim-queries', label: 'All critical queries closed by 04 Nov 2026', daysSaved: 2, readinessGainPts: 7, probGainPts: 10, enabled: true },
  { id: 'sim-pi', label: 'All PI signatures completed by 07 Nov 2026', daysSaved: 1, readinessGainPts: 5, probGainPts: 6, enabled: true },
];

const RAW_PORTFOLIO = [
  { id: 'CA-209-301', title: 'Dual Immunotherapy in Advanced NSCLC', indication: 'NSCLC (Stage IIIB/IV)', phase: 'Phase III', therapeuticArea: 'Oncology', sitesCount: 18, subjectsCount: 220, cleanSubjects: 158, readiness: 72, expected: 80, trend7d: -3, lslvDate: '01 Dec 2026', targetDbl: '15 Dec 2026', predictedDbl: '21 Dec 2026', delayDays: 6, probDelay: 72, riskTier: 'Critical' as const, hardGates: 8, criticalSites: 3, criticalDomain: 'External Data', criticalDriver: 'External lab reconciliation (#LXB-8921)', recoverableDays: 4, owner: 'Vendor Manager', actionStatus: 'Escalated' as const, countries: ['US', 'DE', 'KR', 'FR', 'JP', 'UK', 'CA', 'ES'], milestones: ['dbl', 'lslv', 'submissions'] },
  { id: 'CV-301-201', title: 'Oral Factor XIa Inhibitor in AFib', indication: 'Atrial Fibrillation', phase: 'Phase III', therapeuticArea: 'Cardiology', sitesCount: 24, subjectsCount: 340, cleanSubjects: 231, readiness: 68, expected: 82, trend7d: -4, lslvDate: '22 Nov 2026', targetDbl: '05 Dec 2026', predictedDbl: '12 Dec 2026', delayDays: 7, probDelay: 88, riskTier: 'Critical' as const, hardGates: 10, criticalSites: 6, criticalDomain: 'Safety Reconciliation', criticalDriver: 'Unreconciled SAEs (Argus vs EDC)', recoverableDays: 3, owner: 'Safety Lead', actionStatus: 'Escalated' as const, countries: ['US', 'DE', 'UK', 'FR', 'IT', 'BR', 'CA'], milestones: ['dbl', 'safety_milestones', 'submissions'] },
  { id: 'ONC-777-101', title: 'ADC Monotherapy in Gastric Cancer', indication: 'HER2+ Gastric Cancer', phase: 'Phase II', therapeuticArea: 'Oncology', sitesCount: 14, subjectsCount: 145, cleanSubjects: 113, readiness: 78, expected: 80, trend7d: 2, lslvDate: '05 Dec 2026', targetDbl: '20 Dec 2026', predictedDbl: '24 Dec 2026', delayDays: 4, probDelay: 67, riskTier: 'High' as const, hardGates: 4, criticalSites: 2, criticalDomain: 'External Data', criticalDriver: 'Central lab ctDNA batch overdue', recoverableDays: 4, owner: 'Study Data Lead', actionStatus: 'In Progress' as const, countries: ['US', 'JP', 'KR', 'DE', 'TW'], milestones: ['dbl', 'lslv', 'protocol_amendments'] },
  { id: 'NEU-501-007', title: 'Tau Antisense in Early Alzheimer’s', indication: 'Early Alzheimer’s', phase: 'Phase II', therapeuticArea: 'Neurology', sitesCount: 16, subjectsCount: 180, cleanSubjects: 142, readiness: 79, expected: 84, trend7d: -1, lslvDate: '04 Dec 2026', targetDbl: '18 Dec 2026', predictedDbl: '21 Dec 2026', delayDays: 3, probDelay: 55, riskTier: 'High' as const, hardGates: 3, criticalSites: 2, criticalDomain: 'Query Resolution', criticalDriver: 'Endpoint-critical ADAS-Cog queries', recoverableDays: 2, owner: 'Clinical Ops Lead', actionStatus: 'Assigned' as const, countries: ['US', 'UK', 'CA', 'AU', 'DE'], milestones: ['dbl', 'lslv'] },
  { id: 'IM-102-015', title: 'IL-23 Biologic in Ulcerative Colitis', indication: 'Moderate-Severe UC', phase: 'Phase III', therapeuticArea: 'Immunology', sitesCount: 20, subjectsCount: 260, cleanSubjects: 224, readiness: 86, expected: 88, trend7d: 3, lslvDate: '08 Dec 2026', targetDbl: '22 Dec 2026', predictedDbl: '24 Dec 2026', delayDays: 2, probDelay: 38, riskTier: 'Medium' as const, hardGates: 2, criticalSites: 1, criticalDomain: 'PI Signatures', criticalDriver: 'Pending PI e-signatures (Sites 104/405)', recoverableDays: 2, owner: 'Clinical Ops Lead', actionStatus: 'In Progress' as const, countries: ['US', 'FR', 'ES', 'IT', 'PL', 'UK'], milestones: ['dbl', 'submissions', 'protocol_amendments'] },
  { id: 'HEM-109-005', title: 'BTK Degrader in Relapsed CLL', indication: 'Relapsed/Refractory CLL', phase: 'Phase I/II', therapeuticArea: 'Hematology', sitesCount: 12, subjectsCount: 110, cleanSubjects: 98, readiness: 89, expected: 90, trend7d: 4, lslvDate: '12 Dec 2026', targetDbl: '28 Dec 2026', predictedDbl: '29 Dec 2026', delayDays: 1, probDelay: 25, riskTier: 'Medium' as const, hardGates: 1, criticalSites: 1, criticalDomain: 'Medical Coding', criticalDriver: 'MedDRA / WHODrug coding review', recoverableDays: 1, owner: 'Coding Lead', actionStatus: 'Assigned' as const, countries: ['US', 'DE', 'FR', 'UK'], milestones: ['dbl', 'safety_milestones'] },
  { id: 'GI-401-014', title: 'FXR Agonist in MASH F2/F3', indication: 'MASH Fibrosis F2/F3', phase: 'Phase III', therapeuticArea: 'Hepatology', sitesCount: 18, subjectsCount: 210, cleanSubjects: 191, readiness: 91, expected: 90, trend7d: 5, lslvDate: '26 Nov 2026', targetDbl: '10 Dec 2026', predictedDbl: '10 Dec 2026', delayDays: 0, probDelay: 18, riskTier: 'Low' as const, hardGates: 0, criticalSites: 0, criticalDomain: 'None', criticalDriver: 'No critical-path blockers', recoverableDays: 0, owner: 'Study Data Lead', actionStatus: 'On Track' as const, countries: ['US', 'UK', 'DE', 'ES', 'CA'], milestones: ['dbl', 'lslv', 'submissions'] },
  { id: 'RA-101-002', title: 'TYK2 Inhibitor in Rheumatoid Arthritis', indication: 'Rheumatoid Arthritis', phase: 'Phase III', therapeuticArea: 'Immunology', sitesCount: 15, subjectsCount: 190, cleanSubjects: 177, readiness: 93, expected: 91, trend7d: 4, lslvDate: '30 Nov 2026', targetDbl: '14 Dec 2026', predictedDbl: '13 Dec 2026', delayDays: 0, probDelay: 12, riskTier: 'Low' as const, hardGates: 0, criticalSites: 0, criticalDomain: 'None', criticalDriver: 'No critical-path blockers', recoverableDays: 0, owner: 'Study Data Lead', actionStatus: 'On Track' as const, countries: ['US', 'JP', 'DE', 'PL'], milestones: ['dbl', 'lslv'] },
  { id: 'VAX-201-003', title: 'mRNA RSV Booster in Older Adults', indication: 'RSV Prophylaxis (>=60y)', phase: 'Phase III', therapeuticArea: 'Vaccines', sitesCount: 22, subjectsCount: 410, cleanSubjects: 385, readiness: 94, expected: 92, trend7d: 3, lslvDate: '28 Nov 2026', targetDbl: '12 Dec 2026', predictedDbl: '11 Dec 2026', delayDays: 0, probDelay: 10, riskTier: 'Low' as const, hardGates: 0, criticalSites: 0, criticalDomain: 'None', criticalDriver: 'No critical-path blockers', recoverableDays: 0, owner: 'Study Data Lead', actionStatus: 'On Track' as const, countries: ['US', 'CA', 'UK', 'AU', 'DE'], milestones: ['dbl', 'safety_milestones', 'submissions'] },
  { id: 'MET-302-008', title: 'GLP-1/GIP Dual Agonist in T2D', indication: 'Type 2 Diabetes', phase: 'Phase III', therapeuticArea: 'Metabolic', sitesCount: 19, subjectsCount: 280, cleanSubjects: 252, readiness: 90, expected: 89, trend7d: 2, lslvDate: '04 Dec 2026', targetDbl: '19 Dec 2026', predictedDbl: '19 Dec 2026', delayDays: 0, probDelay: 15, riskTier: 'Low' as const, hardGates: 0, criticalSites: 0, criticalDomain: 'None', criticalDriver: 'No critical-path blockers', recoverableDays: 0, owner: 'Study Data Lead', actionStatus: 'On Track' as const, countries: ['US', 'BR', 'MX', 'ES', 'IT'], milestones: ['dbl', 'lslv'] },
  { id: 'RESP-204-011', title: 'TSLP Mab in Severe Asthma', indication: 'Severe Eosinophilic Asthma', phase: 'Phase III', therapeuticArea: 'Respiratory', sitesCount: 14, subjectsCount: 175, cleanSubjects: 161, readiness: 92, expected: 90, trend7d: 3, lslvDate: '12 Dec 2026', targetDbl: '27 Dec 2026', predictedDbl: '26 Dec 2026', delayDays: 0, probDelay: 14, riskTier: 'Low' as const, hardGates: 0, criticalSites: 0, criticalDomain: 'None', criticalDriver: 'No critical-path blockers', recoverableDays: 0, owner: 'Study Data Lead', actionStatus: 'On Track' as const, countries: ['US', 'UK', 'FR', 'KR'], milestones: ['dbl', 'protocol_amendments'] },
  { id: 'ONC-901-303', title: 'KRAS G12C Inhibitor in CRC', indication: 'KRAS G12C Colorectal', phase: 'Phase II', therapeuticArea: 'Oncology', sitesCount: 11, subjectsCount: 95, cleanSubjects: 84, readiness: 88, expected: 87, trend7d: 1, lslvDate: '15 Dec 2026', targetDbl: '30 Dec 2026', predictedDbl: '30 Dec 2026', delayDays: 0, probDelay: 19, riskTier: 'Low' as const, hardGates: 0, criticalSites: 0, criticalDomain: 'None', criticalDriver: 'No critical-path blockers', recoverableDays: 0, owner: 'Study Data Lead', actionStatus: 'On Track' as const, countries: ['US', 'JP', 'KR', 'FR'], milestones: ['dbl', 'lslv', 'safety_milestones'] },
];

export const V3_PORTFOLIO_STUDIES: V3PortfolioStudy[] = RAW_PORTFOLIO.map((s) => ({
  ...s,
  priorityScore: computePortfolioPriorityScore({
    probMissingDblPct: s.probDelay,
    predictedDelayDays: s.delayDays,
    hardGateSeverity: Math.min(100, s.hardGates * 10),
    readinessGapPts: Math.max(0, s.expected - s.readiness),
    criticalSitesPct: Math.round((s.criticalSites / s.sitesCount) * 100),
    uncertaintyScore: s.delayDays > 0 ? 45 : 15,
  }),
})).sort((a, b) => b.priorityScore - a.priorityScore);
