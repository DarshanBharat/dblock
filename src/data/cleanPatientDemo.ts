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

    const queries = [
      ...(endpointQueries ? [{ form: 'Tumor Assessment', field: 'ASSESSMENT_DATE', queryText: 'Confirm the assessment date against the source record.', isPrimaryEndpoint: true }] : []),
      ...(stage < 6 ? [{ form: 'Baseline Medical History', field: 'ONSET_DATE', queryText: 'Confirm the onset date or document that it is unknown.', isPrimaryEndpoint: false }] : [])
    ].map((query, queryIndex) => ({
      ...query,
      id: `DEMO-Q-${id.slice(5)}-${queryIndex + 1}`,
      subjectId: id,
      siteId: site.id,
      ageDays: 2 + stage * 4,
      isCriticalPath: query.isPrimaryEndpoint,
      status: 'Awaiting Site Response',
      actionRequired: 'Review source record and respond in EDC'
    }));

    return {
      id, siteId: site.id, cohort: 'Demo cohort', status: 'Synthetic subject', initials: '',
      riskLevel: endpointQueries || safetyOpen ? 'Critical' : openQueries ? 'High' : 'Low',
      openQueries, criticalQueries: endpointQueries, hasSaeDiscrepancy: safetyOpen > 0,
      forms, queries,
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
    field: 'CM_DOSE_UNIT',
    queryText: 'Clarify concomitant dexamethasone prophylaxis dose unit (mg vs mL) for Cycle 3.',
    ageDays: 7,
    isCriticalPath: false,
    isPrimaryEndpoint: false,
    status: 'Open (Routine)',
    actionRequired: 'Site coordinator data entry clarification'
  },
  {
    id: 'QRY-104-124',
    siteId: '104',
    subjectId: 'SUBJ-104-019',
    form: 'VS-01 (Vital Signs)',
    field: 'SYS_BP_VAL',
    queryText: 'Cycle 5 pre-infusion blood pressure reading missing timestamp.',
    ageDays: 5,
    isCriticalPath: false,
    isPrimaryEndpoint: false,
    status: 'Open (Routine)',
    actionRequired: 'Verify nursing flowsheet timestamp'
  }
];
