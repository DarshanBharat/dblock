import snapshot from './dblock_data.json';

const formTemplates = [
  { name: 'Screening and Eligibility', flag: 'Routine' },
  { name: 'Baseline Medical History', flag: 'Medical coding' },
  { name: 'Treatment Administration', flag: 'Routine' },
  { name: 'Tumor Assessment', flag: 'Primary Endpoint' },
  { name: 'Adverse Events', flag: 'Safety reconciliation' },
  { name: 'Concomitant Medications', flag: 'Medical coding' },
  { name: 'Central Laboratory', flag: 'External Lab' },
  { name: 'End of Visit', flag: 'Routine' }
];

type CleaningProgress = {
  total: number;
  entered: number;
  sdv: number;
  sdr: number;
  safetyOpen: number;
  vendorOpen: number;
  codingOpen: number;
  piSigned: boolean;
  frozen: boolean;
};

type SnapshotSubject = (typeof snapshot.subjects)[number];

// Supplement the original demo rows with progress for their listed eCRFs.
// The original form statuses, query counts, and audit evidence remain the source of record for the demo.
const snapshotProgress: Record<string, CleaningProgress> = {
  'SUBJ-104-003': { total: 4, entered: 4, sdv: 2, sdr: 2, safetyOpen: 1, vendorOpen: 0, codingOpen: 0, piSigned: false, frozen: false },
  'SUBJ-104-012': { total: 3, entered: 2, sdv: 1, sdr: 1, safetyOpen: 1, vendorOpen: 0, codingOpen: 1, piSigned: false, frozen: false },
  'SUBJ-104-019': { total: 2, entered: 2, sdv: 1, sdr: 1, safetyOpen: 0, vendorOpen: 1, codingOpen: 0, piSigned: false, frozen: false },
  'SUBJ-104-021': { total: 2, entered: 2, sdv: 2, sdr: 1, safetyOpen: 0, vendorOpen: 0, codingOpen: 1, piSigned: false, frozen: false },
  'SUBJ-317-005': { total: 1, entered: 1, sdv: 0, sdr: 0, safetyOpen: 0, vendorOpen: 0, codingOpen: 0, piSigned: false, frozen: false },
  'SUBJ-208-014': { total: 1, entered: 1, sdv: 1, sdr: 1, safetyOpen: 0, vendorOpen: 0, codingOpen: 1, piSigned: false, frozen: false }
};

export function supplementSnapshotSubject(subject: SnapshotSubject) {
  return { ...subject, cleaning: snapshotProgress[subject.id], syntheticSubject: false };
}

export const demoSubjects = snapshot.sites.flatMap((site, siteIndex) => {
  const existingIds = new Set(snapshot.subjects.filter(subject => subject.siteId === site.id).map(subject => subject.id));
  return Array.from({ length: site.enrolledSubjects }, (_, index) => {
    const id = `SUBJ-${site.id}-${String(index + 1).padStart(3, '0')}`;
    const stage = (index + siteIndex * 3) % 12;
    const total = formTemplates.length;
    const entered = stage < 3 ? total - 2 : total;
    const sdv = stage < 5 ? entered - 2 : entered;
    const sdr = stage < 6 ? entered - 3 : entered;
    const endpointQueries = stage === 3 || stage === 4 ? 1 : 0;
    const openQueries = endpointQueries + (stage < 6 ? 1 : 0);
    const safetyOpen = stage === 4 ? 1 : 0;
    const vendorOpen = stage === 5 ? 1 : 0;
    const codingOpen = stage === 6 || stage === 7 ? 1 : 0;
    const piSigned = stage >= 9;
    const frozen = stage >= 10;
    const forms = formTemplates.map((form, formIndex) => {
      const entry = formIndex < entered;
      const openQuery = (endpointQueries > 0 && formIndex === 3) || (stage < 6 && formIndex === 1);
      const issues = [
        !entry && 'Entry pending',
        openQuery && 'Query open',
        formIndex === 4 && safetyOpen > 0 && 'Safety reconciliation pending',
        formIndex === 6 && vendorOpen > 0 && 'Vendor reconciliation pending',
        formIndex === 5 && codingOpen > 0 && 'Coding pending',
        entry && formIndex >= sdv && 'SDV pending',
        entry && formIndex >= sdr && 'SDR pending'
      ].filter(Boolean);
      return { ...form, status: issues.join(' · ') || 'Verified' };
    });
    forms.push({ name: 'Investigator Sign-off', flag: 'PI signature', status: piSigned ? 'Signed' : 'Pending PI signature' });

    const dispositions = [
      'On-Treatment (Cycle 6)',
      'On-Treatment (Cycle 5)',
      'Survival Follow-Up',
      'Completed Treatment',
      'Discontinued (AE)',
      'On-Treatment (Cycle 4)'
    ];
    const disposition = dispositions[(index + siteIndex) % dispositions.length];
    const cutOffScope = index % 9 === 0 ? 'Post-Cut-Off (Safety Only)' : 'In 30 Nov Cut-Off';
    const ballInCourtOptions = [
      'Site Coordinator',
      'Sponsor CDM',
      'Medical Monitor / PV',
      'Central Imaging (ICR)',
      'Principal Investigator'
    ];
    const ballInCourt = openQueries > 0 || !piSigned
      ? ballInCourtOptions[(index + siteIndex) % ballInCourtOptions.length]
      : 'Clean · Ready for Freeze';

    const queries = [
      ...(endpointQueries ? [{ form: 'Form TU-01 (RECIST 1.1)', domainCode: 'SDTM.TU', field: 'ASSESSMENT_DATE', queryText: 'Confirm RECIST 1.1 target lesion assessment date against radiology DICOM header.', isPrimaryEndpoint: true, ballInCourt: 'Site Coordinator' }] : []),
      ...(stage < 6 ? [{ form: 'Form MH-01 (Medical History)', domainCode: 'SDTM.MH', field: 'ONSET_DATE', queryText: 'Confirm prior therapy completion date or document as unknown per eCRF guidelines.', isPrimaryEndpoint: false, ballInCourt: index % 2 === 0 ? 'Sponsor CDM' : 'Site Coordinator' }] : [])
    ].map((query, queryIndex) => ({
      ...query,
      id: `QRY-${id.slice(5)}-${queryIndex + 1}`,
      subjectId: id,
      siteId: site.id,
      ageDays: 2 + stage * 3,
      isCriticalPath: query.isPrimaryEndpoint,
      status: query.ballInCourt === 'Sponsor CDM' ? 'Site Answered · CDM Review' : 'Awaiting Site Entry',
      actionRequired: query.ballInCourt === 'Sponsor CDM' ? 'Sponsor CDM verification & query closure' : 'Site source verification & eCRF update'
    }));

    return {
      id,
      siteId: site.id,
      syntheticSubject: true,
      cohort: index % 2 === 0 ? 'Arm A (Pembrolizumab + Investigational)' : 'Arm B (Control Chemotherapy)',
      status: disposition,
      disposition,
      cutOffScope,
      ballInCourt,
      initials: `${String.fromCharCode(65 + (index % 20))}.${String.fromCharCode(67 + ((index * 3) % 20))}.`,
      riskLevel: endpointQueries || safetyOpen ? 'Critical' : openQueries ? 'High' : 'Low',
      openQueries,
      criticalQueries: endpointQueries,
      hasSaeDiscrepancy: safetyOpen > 0,
      forms,
      queries,
      cleaning: { total, entered, sdv, sdr, safetyOpen, vendorOpen, codingOpen, piSigned, frozen }
    };
  }).filter(subject => !existingIds.has(subject.id));
});

export const demoQueries = demoSubjects.flatMap(subject => subject.queries);

export const additionalSnapshotQueries = [
  {
    id: 'QRY-104-118',
    siteId: '104',
    subjectId: 'SUBJ-104-021',
    form: 'CM-02 (Concomitant Meds)',
    domainCode: 'SDTM.CM',
    field: 'CM_DOSE_UNIT',
    queryText: 'Clarify concomitant dexamethasone prophylaxis dose unit (mg vs mL) for Cycle 3.',
    ageDays: 7,
    isCriticalPath: false,
    isPrimaryEndpoint: false,
    status: 'Site Answered · CDM Review',
    ballInCourt: 'Sponsor CDM',
    actionRequired: 'Sponsor CDM dose unit verification'
  },
  {
    id: 'QRY-104-124',
    siteId: '104',
    subjectId: 'SUBJ-104-019',
    form: 'VS-01 (Vital Signs)',
    domainCode: 'SDTM.VS',
    field: 'SYS_BP_VAL',
    queryText: 'Cycle 5 pre-infusion blood pressure reading missing timestamp.',
    ageDays: 5,
    isCriticalPath: false,
    isPrimaryEndpoint: false,
    status: 'Awaiting Site Entry',
    ballInCourt: 'Site Coordinator',
    actionRequired: 'Verify nursing flowsheet timestamp'
  }
];
