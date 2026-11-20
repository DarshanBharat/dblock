<script lang="ts">
  import { ArrowLeft, ChevronRight, ChevronLeft, Search, Info, SlidersHorizontal, RotateCcw, Filter, X, ArrowUpDown } from '@lucide/svelte';
  import { V3_DOMAINS, V3_STUDY_META, V3_SUBJECT_ROWS } from '../data/v3Data';
  import {
    v3DomainWeights,
    resetV3Weights,
    applyV3WeightPreset,
    normalizeV3Weights,
    computeCompositeReadiness,
  } from '../lib/v3Weights';
  import SubjectDrawerV3 from './SubjectDrawerV3.svelte';

  export let selectedDomainId: string = 'edc';
  export let onSelectTab: (tab: string) => void;
  export let onSelectSite: (siteId: string) => void;

  let subTab: 'site' | 'subject' | 'details' = 'site';
  let searchQuery = '';
  let statusFilter = 'all';
  let criticalityFilter = 'all';
  let countryFilter = 'all';
  let siteFilter = 'all';
  let ownerFilter = 'all';
  let classificationFilter = 'all';
  let agingFilter: 'all' | 'overdue' | 'escalated' | 'recent' = 'all';
  let onlyCriticalSites = false;
  let siteSort: 'pct_asc' | 'incomplete_desc' | 'critical_desc' | 'country_asc' = 'pct_asc';
  let subjectSort: 'pct_asc' | 'days_desc' | 'id_asc' = 'pct_asc';
  let pendingSort: 'crit_desc' | 'days_desc' | 'site_asc' | 'subject_asc' = 'crit_desc';
  let drawerSubjectId: string | null = null;
  let showWeightConfig = false;
  let subjectPage = 1;
  let subjectPageSize = 15;
  let pendingPage = 1;
  let pendingPageSize = 15;
  let hoveredTrendIdx: number | null = null;
  let hoveredDonutIdx: number | null = null;

  function resetTableFilters() {
    searchQuery = '';
    statusFilter = 'all';
    criticalityFilter = 'all';
    countryFilter = 'all';
    siteFilter = 'all';
    ownerFilter = 'all';
    classificationFilter = 'all';
    agingFilter = 'all';
    onlyCriticalSites = false;
    subjectPage = 1;
    pendingPage = 1;
    hoveredTrendIdx = null;
    hoveredDonutIdx = null;
  }

  const DOMAIN_CATEGORY_MAP: Record<string, string[]> = {
    edc: ['edc data cleaning', 'edc'],
    queries: ['query resolution', 'query management'],
    external_data: ['external data reconciliation', 'external data'],
    safety: ['safety reconciliation'],
    coding: ['medical coding'],
    pi_signatures: ['pi signatures', 'pi signature'],
    deviations: ['protocol deviations'],
    sdv: ['sdv / sdr', 'sdv'],
  };

  interface DomainTemplateConfig {
    prefix: string;
    visits: string[];
    forms: string[];
    issues: string[];
    owners: string[];
  }

  const DOMAIN_PENDING_TEMPLATES: Record<string, DomainTemplateConfig> = {
    edc: {
      prefix: 'EDC',
      visits: ['Week 12', 'Week 24', 'Week 36', 'End of Study', 'Screening'],
      forms: ['Tumor Assessment', 'Vital Signs', 'Concomitant Meds', 'Adverse Events', 'Labs', 'ePRO', 'ECG', 'Physical Exam'],
      issues: ['Missing form entry', 'Incomplete fields (2)', 'Pending verification', 'Data entry not started', 'Collection date missing'],
      owners: ['Site', 'Site / CRA', 'DM'],
    },
    queries: {
      prefix: 'QRY',
      visits: ['Week 12', 'Week 24', 'Week 36', 'End of Study'],
      forms: ['Tumor Assessment / Assess Date', 'Labs / ALT', 'ePRO / Q3', 'Con Meds / Drug Start Date', 'Adverse Events', 'Vital Signs'],
      issues: ['Value out of expected range, please verify', 'Source document date mismatch', 'Missing mandatory response', 'Relationship to study drug blank'],
      owners: ['Site / CRA', 'DM', 'Site', 'CRA'],
    },
    external_data: {
      prefix: 'EXT',
      visits: ['Central Lab', 'Imaging', 'eCOA / ePRO', 'IRT / Drug Supply', 'Biomarkers'],
      forms: ['Lab Result', 'CT Scan Read', 'ePRO Assessment', 'Drug Dispensation', 'ctDNA Panel'],
      issues: ['Result not received from vendor', 'Value mismatch vs EDC (ALT/AST)', 'Image quality review pending', 'Missing ePRO sync record', 'Batch checksum reconciliation pending'],
      owners: ['Lab Vendor', 'Vendor', 'Site', 'DM', 'Vendor Manager'],
    },
    safety: {
      prefix: 'SAF',
      visits: ['Seriousness', 'Outcome', 'Follow-up', 'Start Date', 'Causality'],
      forms: ['Argus vs EDC (AE)', 'SAE Narrative', 'Concomitant Meds', 'Medical History', 'Safety Follow-up'],
      issues: ['AE start date mismatch (Argus vs EDC)', 'Severity grade discrepancy', 'Outcome pending confirmation', 'Missing follow-up report', 'Causality assessment mismatch'],
      owners: ['Safety Lead', 'DM', 'Site'],
    },
    coding: {
      prefix: 'COD',
      visits: ['AE', 'CM', 'MH', 'Procedures', 'Other'],
      forms: ['MedDRA Verbatim Term', 'WHODrug Medication', 'Medical History Term', 'Procedure Term', 'Adverse Event Term'],
      issues: ['Pending Coding (MedDRA)', 'Pending Review (WHODrug)', 'Low Confidence Auto-Code (<0.75)', 'Clarification query pending for coding'],
      owners: ['Coder', 'Coding Lead', 'DM'],
    },
    pi_signatures: {
      prefix: 'SIG',
      visits: ['Week 24', 'Week 36', 'End of Study', 'Casebook'],
      forms: ['Investigator Signature (Casebook)', 'Key Efficacy Forms', 'Safety Forms', 'End of Study Forms', 'Adverse Events'],
      issues: ['Investigator signature pending', 'Investigator signature overdue (Completed)', 'Re-signature required post-query closure'],
      owners: ['Site / CRA', 'Site', 'PI'],
    },
    deviations: {
      prefix: 'PD',
      visits: ['Visit Window', 'Eligibility', 'Concomitant Med', 'Procedure', 'Dosing'],
      forms: ['Visit outside allowed window', 'Missed ECG / Lab assessment', 'Concomitant medication review', 'Study drug compliance check'],
      issues: ['Important · Under CRA review', 'Minor · Awaiting classification', 'Major · Pending medical monitor review'],
      owners: ['Clinical Ops', 'Medical Monitor', 'DM', 'CRA'],
    },
    sdv: {
      prefix: 'SDV',
      visits: ['Week 12', 'Week 24', 'Week 36', 'End of Study', 'Day 1'],
      forms: ['Tumor Assessment', 'Adverse Events', 'Concomitant Meds', 'Labs', 'Vital Signs', 'Safety Follow-up'],
      issues: ['SDV pending (On-site)', 'SDR pending (Remote)', 'Critical field SDV pending', 'Pending CRA verification'],
      owners: ['CRA', 'DM', 'Site / CRA'],
    },
  };

  $: readinessMetrics = computeCompositeReadiness(
    $v3DomainWeights,
    V3_DOMAINS,
    V3_STUDY_META.overallReadiness
  );
  $: totalWeight = readinessMetrics.totalWeight;
  $: computedReadiness = readinessMetrics.composite;
  $: isCustomWeights = readinessMetrics.isCustom;

  $: drawerSubjectIdx = drawerSubjectId
    ? V3_SUBJECT_ROWS.findIndex((s) => s.id === drawerSubjectId)
    : -1;
  $: drawerSubject = drawerSubjectIdx >= 0 ? V3_SUBJECT_ROWS[drawerSubjectIdx] : null;

  $: currentDomain = V3_DOMAINS.find((d) => d.id === selectedDomainId) || V3_DOMAINS[0];

  $: breakdownCountries = Array.from(new Set(currentDomain.breakdownRows.map((r) => r.country))).sort();
  $: siteStatusCounts = {
    all: currentDomain.breakdownRows.length,
    'High risk': currentDomain.breakdownRows.filter((r) => r.status === 'High risk').length,
    'At risk': currentDomain.breakdownRows.filter((r) => r.status === 'At risk').length,
    'On track': currentDomain.breakdownRows.filter((r) => r.status === 'On track').length,
  };

  $: filteredBreakdown = currentDomain.breakdownRows
    .filter((r) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        r.country.toLowerCase().includes(q) ||
        r.siteId.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchesCountry = countryFilter === 'all' || r.country === countryFilter;
      const matchesCritical = !onlyCriticalSites || r.criticalItems > 0;
      return matchesSearch && matchesStatus && matchesCountry && matchesCritical;
    })
    .sort((a, b) => {
      if (siteSort === 'incomplete_desc') return b.incomplete - a.incomplete || a.pctComplete - b.pctComplete;
      if (siteSort === 'critical_desc') return b.criticalItems - a.criticalItems || a.pctComplete - b.pctComplete;
      if (siteSort === 'country_asc') return a.country.localeCompare(b.country) || a.siteId.localeCompare(b.siteId);
      return a.pctComplete - b.pctComplete || b.incomplete - a.incomplete;
    });

  $: allDomainSubjects = V3_SUBJECT_ROWS.map((subj) => {
    const domEntry =
      subj.domainBreakdown.find(
        (b) => b.domain.toLowerCase() === currentDomain.name.toLowerCase()
      ) || subj.domainBreakdown[0];
    const completion = domEntry?.completion ?? subj.readiness;
    const domainStatus: 'On track' | 'At risk' | 'High risk' =
      completion >= 90 ? 'On track' : completion >= 70 ? 'At risk' : 'High risk';
    return {
      subj,
      domEntry,
      completion,
      domainStatus,
    };
  });

  $: subjectCountries = Array.from(new Set(V3_SUBJECT_ROWS.map((s) => s.country))).sort();
  $: subjectOwners = Array.from(new Set(V3_SUBJECT_ROWS.map((s) => s.owner).filter((o) => o && o !== '—'))).sort();
  $: subjectStatusCounts = {
    all: allDomainSubjects.length,
    'High risk': allDomainSubjects.filter((s) => s.domainStatus === 'High risk').length,
    'At risk': allDomainSubjects.filter((s) => s.domainStatus === 'At risk').length,
    'On track': allDomainSubjects.filter((s) => s.domainStatus === 'On track').length,
  };

  $: filteredSubjects = allDomainSubjects
    .filter(({ subj, domEntry, domainStatus }) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        subj.id.toLowerCase().includes(q) ||
        subj.siteId.toLowerCase().includes(q) ||
        subj.country.toLowerCase().includes(q) ||
        subj.owner.toLowerCase().includes(q) ||
        (domEntry?.details || '').toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || domainStatus === statusFilter;
      const matchesCountry = countryFilter === 'all' || subj.country === countryFilter;
      const matchesClass = classificationFilter === 'all' || subj.classification === classificationFilter;
      const matchesOwner = ownerFilter === 'all' || subj.owner === ownerFilter;
      return matchesSearch && matchesStatus && matchesCountry && matchesClass && matchesOwner;
    })
    .sort((a, b) => {
      if (subjectSort === 'days_desc') return b.subj.daysOpen - a.subj.daysOpen || a.completion - b.completion;
      if (subjectSort === 'id_asc') return a.subj.id.localeCompare(b.subj.id);
      return a.completion - b.completion || b.subj.daysOpen - a.subj.daysOpen;
    });

  $: totalSubjectPages = Math.max(1, Math.ceil(filteredSubjects.length / subjectPageSize));
  $: if (subjectPage > totalSubjectPages) subjectPage = 1;
  $: visibleSubjects = filteredSubjects.slice(
    (subjectPage - 1) * subjectPageSize,
    subjectPage * subjectPageSize
  );
  $: visibleSubjectPageNumbers = (() => {
    const pages: number[] = [];
    const start = Math.max(1, subjectPage - 2);
    const end = Math.min(totalSubjectPages, start + 4);
    for (let p = Math.max(1, end - 4); p <= end; p++) pages.push(p);
    return pages;
  })();

  $: allDomainPendingRecords = (() => {
    const targetCount = parseInt(currentDomain.kpi2Value.replace(/[^0-9]/g, ''), 10) || 0;
    const cats = DOMAIN_CATEGORY_MAP[currentDomain.id] || [currentDomain.name.toLowerCase()];
    const curated = currentDomain.topPendingRows.map((r) => ({ ...r }));
    const curatedIds = new Set(curated.map((r) => r.id));
    const seen = new Set(curated.map((r) => `${r.subjectId}::${r.issue.toLowerCase()}`));
    const extra: typeof curated = [];

    // Order subjects by urgency so highest-risk subjects appear first
    const classRank: Record<string, number> = {
      'Hard Blocked': 4,
      'Action Required': 3,
      'Conditionally Ready': 2,
      'Lock Ready': 1,
    };
    const orderedSubjects = [...V3_SUBJECT_ROWS].sort(
      (a, b) => (classRank[b.classification] || 0) - (classRank[a.classification] || 0) || b.daysOpen - a.daysOpen
    );

    for (const subj of orderedSubjects) {
      for (const oi of subj.openItems) {
        if (cats.some((c) => oi.category.toLowerCase().includes(c))) {
          const key = `${subj.id}::${oi.issue.toLowerCase()}`;
          if (!seen.has(key)) {
            seen.add(key);
            extra.push({
              id: oi.id,
              subjectId: subj.id,
              siteId: subj.siteId,
              visit: subj.timeline.find((t) => t.state === 'missed' || t.state === 'in_progress')?.label || 'Ongoing Visit',
              form: oi.id,
              issue: oi.issue,
              daysOpen: oi.daysOpen,
              criticality: oi.severity === 'Critical' ? 'Critical' : 'Medium',
              owner: subj.owner === '—' ? 'Site / CRA' : subj.owner,
              status: oi.daysOpen >= 10 ? 'Escalated' : 'Open',
              actionLabel: 'Inspect',
            });
          }
        }
      }

      const domEntry = subj.domainBreakdown.find(
        (b) => b.domain.toLowerCase() === currentDomain.name.toLowerCase()
      );
      if (domEntry && domEntry.status === 'Action Required') {
        const key = `${subj.id}::${domEntry.details.toLowerCase()}`;
        const hasAnyForSubj =
          curated.some((r) => r.subjectId === subj.id) ||
          extra.some((r) => r.subjectId === subj.id);
        if (!hasAnyForSubj && !seen.has(key)) {
          seen.add(key);
          extra.push({
            id: `${currentDomain.id.toUpperCase()}-${subj.id}`,
            subjectId: subj.id,
            siteId: subj.siteId,
            visit: subj.timeline.find((t) => t.state === 'missed' || t.state === 'in_progress')?.label || 'Study Visit',
            form: currentDomain.name,
            issue: domEntry.details,
            daysOpen: Math.max(2, subj.daysOpen),
            criticality: domEntry.completion < 65 ? 'Critical' : domEntry.completion < 80 ? 'High' : 'Medium',
            owner: subj.owner === '—' ? 'Site / CRA' : subj.owner,
            status: subj.daysOpen >= 10 ? 'Escalated' : 'Open',
            actionLabel: 'Inspect',
          });
        }
      }
    }

    const critRank: Record<string, number> = { Critical: 3, High: 2, Medium: 1 };
    extra.sort((a, b) => (critRank[b.criticality] || 0) - (critRank[a.criticality] || 0) || b.daysOpen - a.daysOpen);

    let records = [...curated, ...extra];

    // Reconcile count with top KPI card (currentDomain.kpi2Value)
    if (targetCount > 0 && records.length > targetCount) {
      records = records.slice(0, targetCount);
    } else if (targetCount > 0 && records.length < targetCount) {
      const tpl = DOMAIN_PENDING_TEMPLATES[currentDomain.id] || {
        prefix: currentDomain.id.toUpperCase().slice(0, 3),
        visits: ['Week 12', 'Week 24', 'Week 36', 'End of Study'],
        forms: [currentDomain.name],
        issues: ['Pending review'],
        owners: ['Site / CRA', 'DM'],
      };
      const segments = currentDomain.donutSegments;
      const needed = targetCount - records.length;

      for (let i = 0; i < needed; i++) {
        const subj = orderedSubjects[i % orderedSubjects.length];
        const seg = segments.length ? segments[i % segments.length] : null;
        const visit = tpl.visits[i % tpl.visits.length];
        const form = tpl.forms[(i + Math.floor(i / tpl.visits.length)) % tpl.forms.length];
        const baseIssue = tpl.issues[i % tpl.issues.length];
        const issue = seg ? `${baseIssue} · ${seg.label}` : baseIssue;
        const owner = tpl.owners[i % tpl.owners.length];
        const daysOpen = Math.max(1, ((i * 7 + Number(subj.siteId)) % 14) + 1);
        const criticality: 'Critical' | 'High' | 'Medium' =
          i < Math.max(2, Math.round(needed * 0.1))
            ? 'Critical'
            : i < Math.round(needed * 0.4)
            ? 'High'
            : 'Medium';

        records.push({
          id: `${tpl.prefix}-${String(curated.length + extra.length + i + 1).padStart(4, '0')}`,
          subjectId: subj.id,
          siteId: subj.siteId,
          visit,
          form,
          issue,
          daysOpen,
          criticality,
          owner,
          status: daysOpen >= 10 ? 'Escalated' : daysOpen >= 6 ? 'In Progress' : 'Open',
          actionLabel: 'Inspect',
        });
      }
    }

    return records.sort((a, b) => {
      const aCurated = curatedIds.has(a.id) ? 1 : 0;
      const bCurated = curatedIds.has(b.id) ? 1 : 0;
      if (aCurated !== bCurated) return bCurated - aCurated;
      return (critRank[b.criticality] || 0) - (critRank[a.criticality] || 0) || b.daysOpen - a.daysOpen;
    });
  })();

  $: pendingSites = Array.from(new Set(allDomainPendingRecords.map((r) => r.siteId))).sort();
  $: pendingOwners = Array.from(new Set(allDomainPendingRecords.map((r) => r.owner).filter(Boolean))).sort();
  $: pendingCritCounts = {
    all: allDomainPendingRecords.length,
    Critical: allDomainPendingRecords.filter((r) => r.criticality === 'Critical').length,
    High: allDomainPendingRecords.filter((r) => r.criticality === 'High').length,
    Medium: allDomainPendingRecords.filter((r) => r.criticality === 'Medium').length,
  };

  $: filteredPendingRecords = allDomainPendingRecords
    .filter((r) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        r.subjectId.toLowerCase().includes(q) ||
        r.siteId.toLowerCase().includes(q) ||
        r.visit.toLowerCase().includes(q) ||
        r.form.toLowerCase().includes(q) ||
        r.issue.toLowerCase().includes(q) ||
        r.owner.toLowerCase().includes(q);
      const matchesCrit = criticalityFilter === 'all' || r.criticality === criticalityFilter;
      const matchesSite = siteFilter === 'all' || r.siteId === siteFilter;
      const matchesOwner = ownerFilter === 'all' || r.owner === ownerFilter;
      const matchesAging =
        agingFilter === 'all' ||
        (agingFilter === 'escalated' && r.daysOpen >= 10) ||
        (agingFilter === 'overdue' && r.daysOpen > 7) ||
        (agingFilter === 'recent' && r.daysOpen <= 7);
      return matchesSearch && matchesCrit && matchesSite && matchesOwner && matchesAging;
    })
    .sort((a, b) => {
      if (pendingSort === 'days_desc') return b.daysOpen - a.daysOpen;
      if (pendingSort === 'site_asc') return a.siteId.localeCompare(b.siteId) || b.daysOpen - a.daysOpen;
      if (pendingSort === 'subject_asc') return a.subjectId.localeCompare(b.subjectId);
      const rank: Record<string, number> = { Critical: 3, High: 2, Medium: 1 };
      return (rank[b.criticality] || 0) - (rank[a.criticality] || 0) || b.daysOpen - a.daysOpen;
    });

  $: activeFilterCount = (() => {
    let n = 0;
    if (searchQuery.trim()) n++;
    if (subTab === 'site') {
      if (statusFilter !== 'all') n++;
      if (countryFilter !== 'all') n++;
      if (onlyCriticalSites) n++;
    } else if (subTab === 'subject') {
      if (statusFilter !== 'all') n++;
      if (countryFilter !== 'all') n++;
      if (classificationFilter !== 'all') n++;
      if (ownerFilter !== 'all') n++;
    } else {
      if (criticalityFilter !== 'all') n++;
      if (siteFilter !== 'all') n++;
      if (ownerFilter !== 'all') n++;
      if (agingFilter !== 'all') n++;
    }
    return n;
  })();

  $: totalPendingPages = Math.max(1, Math.ceil(filteredPendingRecords.length / pendingPageSize));
  $: if (pendingPage > totalPendingPages) pendingPage = 1;
  $: pagedPendingRecords = filteredPendingRecords.slice(
    (pendingPage - 1) * pendingPageSize,
    pendingPage * pendingPageSize
  );
  $: visiblePendingPageNumbers = (() => {
    const pages: number[] = [];
    const start = Math.max(1, pendingPage - 2);
    const end = Math.min(totalPendingPages, start + 4);
    for (let p = Math.max(1, end - 4); p <= end; p++) pages.push(p);
    return pages;
  })();

  function statusPill(status: string): string {
    if (status === 'On track') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'High risk') return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }

  function dotColor(status: string): string {
    if (status === 'On track') return 'bg-emerald-500';
    if (status === 'High risk') return 'bg-rose-500';
    return 'bg-amber-500';
  }

  // Trend chart geometry
  const W = 320;
  const H = 166;
  const PAD_L = 32;
  const PAD_R = 14;
  const PAD_T = 16;
  const PAD_B = 26;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  $: trendYBounds = (() => {
    const vals: number[] = [];
    for (const p of currentDomain.trendSeries) {
      if (p.actual !== null) vals.push(p.actual);
      vals.push(p.expected);
      if (p.forecast !== null) vals.push(p.forecast);
    }
    const minVal = vals.length ? Math.min(...vals) : 0;
    const yMax = 100;
    let yMin = minVal >= 75 ? 75 : Math.max(0, Math.floor((minVal - 2) / 10) * 10);
    if (yMax - yMin === 70) yMin = 20;
    const span = Math.max(10, yMax - yMin);
    const step = span <= 25 ? 5 : span <= 50 ? 10 : span <= 60 ? 15 : 20;
    const ticks: number[] = [];
    for (let t = yMin; t <= yMax; t += step) ticks.push(t);
    if (ticks[ticks.length - 1] !== yMax) ticks.push(yMax);
    return { yMin, yMax, ticks };
  })();

  $: xPos = (i: number) => PAD_L + (i / Math.max(1, currentDomain.trendSeries.length - 1)) * plotW;
  $: yPos = (val: number) =>
    PAD_T + ((trendYBounds.yMax - val) / Math.max(1, trendYBounds.yMax - trendYBounds.yMin)) * plotH;

  $: actualPoints = currentDomain.trendSeries
    .map((p, i) => (p.actual !== null ? `${xPos(i)},${yPos(p.actual)}` : null))
    .filter(Boolean)
    .join(' ');
  $: expectedPoints = currentDomain.trendSeries
    .map((p, i) => `${xPos(i)},${yPos(p.expected)}`)
    .join(' ');
  $: forecastPoints = currentDomain.trendSeries
    .map((p, i) => (p.forecast !== null ? `${xPos(i)},${yPos(p.forecast)}` : null))
    .filter(Boolean)
    .join(' ');

  // Donut chart geometry
  const R = 42;
  const CIRC = 2 * Math.PI * R;
  $: donutArcs = (() => {
    let offset = 0;
    return currentDomain.donutSegments.map((seg) => {
      const len = (seg.pct / 100) * CIRC;
      const arc = { ...seg, dasharray: `${len} ${CIRC - len}`, dashoffset: -offset };
      offset += len;
      return arc;
    });
  })();
</script>

<div class="space-y-4">
  <!-- Top Header -->
  <div class="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
    <div>
      <button
        type="button"
        on:click={() => onSelectTab('command_centre')}
        class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 mb-1 cursor-pointer"
      >
        <ArrowLeft size={13} /> Back to Study Overview
      </button>
      <div class="flex flex-wrap items-center gap-2.5">
        <h1 class="text-lg font-bold text-slate-900">
          {V3_STUDY_META.protocol} <span class="text-slate-300 font-normal">|</span> Clinical Domain Drill-down
        </h1>
        <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border {statusPill(currentDomain.status)}">
          <span class="w-1.5 h-1.5 rounded-full {dotColor(currentDomain.status)}"></span>
          {currentDomain.status}
        </span>
      </div>
      <p class="text-xs text-slate-500 mt-0.5">{V3_STUDY_META.title}</p>
    </div>
    <div class="flex flex-col items-end gap-1.5 text-right text-xs">
      <div class="flex flex-wrap items-center justify-end gap-2">
        <span class="px-2.5 py-1 rounded-full text-[11px] font-bold {totalWeight === 100 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}">
          Composite Readiness: {computedReadiness}% · {totalWeight}% wt
        </span>
        <button
          type="button"
          on:click={() => (showWeightConfig = !showWeightConfig)}
          class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-semibold cursor-pointer transition-colors {showWeightConfig || isCustomWeights ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'}"
        >
          <SlidersHorizontal size={13} />
          <span>{showWeightConfig ? 'Hide Weightage Config' : 'Configure Weights'}</span>
          {#if isCustomWeights}
            <span class="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-bold">Custom</span>
          {/if}
        </button>
      </div>
      <div>
        Target DBL: <span class="font-semibold text-slate-800">{V3_STUDY_META.targetDbl}</span>
        <span class="mx-1.5 text-slate-300">|</span>
        Predicted DBL: <span class="font-bold text-rose-600">{V3_STUDY_META.predictedDbl} (+{V3_STUDY_META.delayDays}d)</span>
        <span class="mx-1.5 text-slate-300">|</span>
        <span class="text-[11px] text-slate-400">Last refreshed: {V3_STUDY_META.lastRefreshed}</span>
      </div>
    </div>
  </div>

  {#if showWeightConfig}
    <div class="bg-white rounded-xl border border-blue-200/90 p-4 shadow-xs space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-sm font-bold text-slate-900">Readiness Score Weightage Configuration</h2>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold {totalWeight === 100 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}">
              Total: {totalWeight}% {totalWeight === 100 ? '✓' : '(recommend 100%)'}
            </span>
          </div>
          <p class="text-[11px] text-slate-500">Adjust domain weights to recalculate Composite Study Readiness (synced with Study Overview)</p>
        </div>
        <div class="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span class="font-semibold text-slate-500 mr-0.5">Presets:</span>
          <button
            type="button"
            on:click={() => applyV3WeightPreset('balanced')}
            class="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 font-semibold text-slate-700 cursor-pointer"
          >
            Balanced
          </button>
          <button
            type="button"
            on:click={() => applyV3WeightPreset('safety_ext')}
            class="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 font-semibold text-slate-700 cursor-pointer"
          >
            Safety &amp; External
          </button>
          <button
            type="button"
            on:click={() => applyV3WeightPreset('edc_query')}
            class="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 font-semibold text-slate-700 cursor-pointer"
          >
            EDC &amp; Query
          </button>
          {#if totalWeight !== 100}
            <button
              type="button"
              on:click={() => normalizeV3Weights($v3DomainWeights, V3_DOMAINS)}
              class="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
            >
              Normalize 100%
            </button>
          {/if}
          <button
            type="button"
            on:click={resetV3Weights}
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
          >
            <RotateCcw size={11} /> Reset
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {#each V3_DOMAINS as dom}
          {@const active = dom.id === currentDomain.id}
          {@const w = $v3DomainWeights[dom.id] ?? 0}
          <div class="rounded-lg border p-2.5 transition-colors {active ? 'border-blue-300 bg-blue-50/40' : 'border-slate-200/80 bg-slate-50/50'}">
            <div class="flex items-center justify-between gap-1 text-xs">
              <button
                type="button"
                on:click={() => { selectedDomainId = dom.id; resetTableFilters(); }}
                class="font-semibold text-slate-800 hover:text-blue-700 truncate text-left cursor-pointer"
              >
                {dom.name}
              </button>
              <span class="font-mono font-bold text-blue-700 shrink-0">{w}%</span>
            </div>
            <div class="flex items-center gap-2 mt-2">
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                bind:value={$v3DomainWeights[dom.id]}
                class="w-full accent-blue-600 cursor-pointer"
                aria-label="{dom.name} weightage"
              />
              <span class="text-[10px] font-semibold text-slate-500 w-8 text-right shrink-0">{dom.readiness}%</span>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Sidebar + Main Drilldown -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
    <!-- Left Domain Selector -->
    <aside class="lg:col-span-3 bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs space-y-1">
      <div class="px-2 py-1.5 flex items-center justify-between">
        <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">Clinical Domains</span>
        <span class="text-[10px] font-semibold text-slate-400">Weight</span>
      </div>
      {#each V3_DOMAINS as dom}
        {@const active = dom.id === currentDomain.id}
        {@const w = $v3DomainWeights[dom.id] ?? 0}
        <button
          type="button"
          on:click={() => { selectedDomainId = dom.id; resetTableFilters(); }}
          class="w-full text-left px-3 py-2.5 rounded-lg border transition-colors flex items-center justify-between cursor-pointer {active ? 'bg-blue-50/90 border-blue-300 shadow-2xs' : 'bg-white border-transparent hover:bg-slate-50'}"
        >
          <div>
            <div class="text-xs font-semibold {active ? 'text-blue-900' : 'text-slate-800'}">{dom.name}</div>
            <div class="flex items-center gap-1.5 mt-1 text-[11px] text-slate-600">
              <span class="font-bold text-slate-900">{dom.readiness}%</span>
              <span class="w-1.5 h-1.5 rounded-full {dotColor(dom.status)}"></span>
              <span>{dom.status}</span>
            </div>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            <span class="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-mono font-semibold text-slate-600">{w}%</span>
            <ChevronRight size={14} class={active ? 'text-blue-600' : 'text-slate-400'} />
          </div>
        </button>
      {/each}
    </aside>

    <!-- Main Domain Content -->
    <div class="lg:col-span-9 space-y-4">
      <!-- Domain Header & 4 KPI Cards -->
      <div class="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 class="text-base font-bold text-slate-900">{currentDomain.name}</h2>
            <p class="text-xs text-slate-500">{currentDomain.subtitle}</p>
          </div>
          <span class="inline-flex items-center gap-1 text-[11px] text-slate-500 border border-slate-200 rounded-lg px-2.5 py-1">
            <Info size={12} /> View Domain Definition
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <div class="rounded-lg border border-slate-200/80 p-3 bg-slate-50/50">
            <div class="text-[11px] font-medium text-slate-500">Domain Readiness</div>
            <div class="mt-1 flex items-baseline gap-2">
              <span class="text-2xl font-bold text-slate-900">{currentDomain.readiness}%</span>
              <span class="text-[11px] font-semibold {currentDomain.variance <= -10 ? 'text-rose-600' : 'text-amber-600'}">
                {currentDomain.variance}% vs expected
              </span>
            </div>
            <div class="mt-2 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                class="h-full rounded-full {currentDomain.status === 'On track' ? 'bg-emerald-500' : currentDomain.status === 'High risk' ? 'bg-rose-500' : 'bg-amber-500'}"
                style="width: {currentDomain.readiness}%"
              ></div>
            </div>
            <div class="mt-1.5 text-[11px] text-slate-400">Expected today: {currentDomain.expected}%</div>
          </div>

          <div class="rounded-lg border border-slate-200/80 p-3 bg-slate-50/50">
            <div class="text-[11px] font-medium text-slate-500">{currentDomain.kpi2Label}</div>
            <div class="mt-1 flex items-baseline gap-2">
              <span class="text-2xl font-bold text-slate-900">{currentDomain.kpi2Value}</span>
              <span class="text-[11px] font-semibold text-rose-600">{currentDomain.kpi2Delta}</span>
            </div>
            <div class="mt-3 text-[11px] text-slate-500">{currentDomain.kpi2Sub}</div>
          </div>

          <div class="rounded-lg border border-slate-200/80 p-3 bg-slate-50/50">
            <div class="text-[11px] font-medium text-slate-500">{currentDomain.kpi3Label}</div>
            <div class="mt-1 text-2xl font-bold text-slate-900">{currentDomain.kpi3Value}</div>
            <div class="mt-3 text-[11px] text-slate-500">{currentDomain.kpi3Sub}</div>
          </div>

          <div class="rounded-lg border border-slate-200/80 p-3 bg-slate-50/50">
            <div class="text-[11px] font-medium text-slate-500">Predicted Completion Date</div>
            <div class="mt-1 flex items-center gap-2">
              <span class="text-xl font-bold text-slate-900">{currentDomain.predictedCompletion}</span>
              <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded border {statusPill(currentDomain.status)}">
                {currentDomain.status}
              </span>
            </div>
            <div class="mt-3 text-[11px] font-semibold {currentDomain.dblImpactDays > 0 ? 'text-rose-600' : 'text-emerald-600'}">
              Contribution to DBL delay: {currentDomain.dblImpactDays > 0 ? `+${currentDomain.dblImpactDays} day${currentDomain.dblImpactDays > 1 ? 's' : ''}` : '0 days'}
            </div>
          </div>
        </div>
      </div>

      <!-- Charts & Key Insights Row (3 Balanced Cards) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <!-- Trend Chart -->
        <div class="lg:col-span-4 bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-slate-100">
            <h3 class="text-xs font-bold text-slate-900 truncate">{currentDomain.trendLabel}</h3>
            <div class="flex items-center gap-2 text-[10px] text-slate-500 shrink-0">
              <span class="inline-flex items-center gap-1"><span class="w-2 h-0.5 bg-blue-600 inline-block"></span> Act</span>
              <span class="inline-flex items-center gap-1"><span class="w-2 h-0.5 border-t border-dashed border-slate-400 inline-block"></span> Exp</span>
              <span class="inline-flex items-center gap-1"><span class="w-2 h-0.5 border-t border-dashed border-emerald-500 inline-block"></span> Fcst</span>
            </div>
          </div>
          <div
            class="flex-1 flex items-center relative"
            role="presentation"
            on:mouseleave={() => (hoveredTrendIdx = null)}
          >
            <svg viewBox="0 0 {W} {H}" class="w-full h-auto overflow-visible">
              {#each trendYBounds.ticks as tick}
                <line x1={PAD_L} y1={yPos(tick)} x2={W - PAD_R} y2={yPos(tick)} stroke="#e2e8f0" stroke-width="1" />
                <text x={PAD_L - 5} y={yPos(tick) + 3} text-anchor="end" font-size="8" fill="#94a3b8">{tick}%</text>
              {/each}

              <!-- Vertical hover crosshair -->
              {#if hoveredTrendIdx !== null && currentDomain.trendSeries[hoveredTrendIdx]}
                <line
                  x1={xPos(hoveredTrendIdx)}
                  y1={PAD_T}
                  x2={xPos(hoveredTrendIdx)}
                  y2={H - PAD_B}
                  stroke="#94a3b8"
                  stroke-width="1"
                  stroke-dasharray="2 2"
                />
              {/if}

              <polyline fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3 3" points={expectedPoints} />
              <polyline fill="none" stroke="#10b981" stroke-width="1.8" stroke-dasharray="3 2" points={forecastPoints} />
              <polyline fill="none" stroke="#2563eb" stroke-width="2.2" points={actualPoints} />

              {#each currentDomain.trendSeries as p, i}
                {@const isHovered = hoveredTrendIdx === i}
                {@const colW = plotW / Math.max(1, currentDomain.trendSeries.length - 1)}

                <!-- Expected point -->
                <circle
                  cx={xPos(i)}
                  cy={yPos(p.expected)}
                  r={isHovered ? 3.5 : 2}
                  fill={isHovered ? '#475569' : '#94a3b8'}
                  class="transition-all duration-150"
                />

                <!-- Forecast point -->
                {#if p.forecast !== null}
                  <circle
                    cx={xPos(i)}
                    cy={yPos(p.forecast)}
                    r={isHovered ? 3.8 : 2.2}
                    fill="#10b981"
                    class="transition-all duration-150"
                  />
                {/if}

                <!-- Actual point + value label -->
                {#if p.actual !== null}
                  {@const labelBelow = p.expected >= p.actual}
                  {#if isHovered}
                    <circle cx={xPos(i)} cy={yPos(p.actual)} r="7" fill="#2563eb" opacity="0.18" />
                  {/if}
                  <circle
                    cx={xPos(i)}
                    cy={yPos(p.actual)}
                    r={isHovered ? 4.2 : 3}
                    fill="#2563eb"
                    stroke="#ffffff"
                    stroke-width={isHovered ? 1.5 : 0}
                    class="transition-all duration-150"
                  />
                  <text
                    x={xPos(i)}
                    y={labelBelow ? yPos(p.actual) + 12 : yPos(p.actual) - 6}
                    text-anchor="middle"
                    font-size={isHovered ? 8.5 : 8}
                    font-weight="700"
                    fill={isHovered ? '#1d4ed8' : '#1e293b'}
                  >{p.actual}%</text>
                {/if}

                <!-- X-axis milestone label -->
                <text
                  x={xPos(i)}
                  y={H - 8}
                  text-anchor="middle"
                  font-size="8"
                  font-weight={isHovered ? '700' : '400'}
                  fill={isHovered ? '#0f172a' : '#64748b'}
                >{p.label}</text>

                <!-- Invisible full-height hover column -->
                <rect
                  x={Math.max(PAD_L - 6, xPos(i) - colW / 2)}
                  y={PAD_T - 4}
                  width={colW}
                  height={plotH + 14}
                  fill="transparent"
                  class="cursor-crosshair"
                  role="presentation"
                  on:mouseenter={() => (hoveredTrendIdx = i)}
                />
              {/each}
            </svg>

            <!-- Floating Interactive Tooltip -->
            {#if hoveredTrendIdx !== null && currentDomain.trendSeries[hoveredTrendIdx]}
              {@const pt = currentDomain.trendSeries[hoveredTrendIdx]}
              {@const variance = pt.actual !== null ? pt.actual - pt.expected : null}
              {@const flipLeft = hoveredTrendIdx >= Math.ceil(currentDomain.trendSeries.length / 2)}
              <div
                class="pointer-events-none absolute top-1 z-20 rounded-lg bg-slate-900/95 text-white px-2.5 py-2 shadow-lg border border-slate-700/80 text-[11px] min-w-[132px] transition-all duration-100 {flipLeft ? 'left-8' : 'right-2'}"
              >
                <div class="flex items-center justify-between gap-2 pb-1 mb-1 border-b border-slate-700/80">
                  <span class="font-bold text-slate-100">{pt.label}</span>
                  {#if variance !== null}
                    <span class="px-1.5 py-0.2 rounded text-[9px] font-bold {variance >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}">
                      {variance >= 0 ? `+${variance}%` : `${variance}%`} vs Exp
                    </span>
                  {/if}
                </div>
                <div class="space-y-0.5">
                  {#if pt.actual !== null}
                    <div class="flex items-center justify-between gap-3">
                      <span class="inline-flex items-center gap-1.5 text-slate-300"><span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span>Actual</span>
                      <span class="font-mono font-bold text-white">{pt.actual}%</span>
                    </div>
                  {/if}
                  <div class="flex items-center justify-between gap-3">
                    <span class="inline-flex items-center gap-1.5 text-slate-300"><span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>Expected</span>
                    <span class="font-mono font-semibold text-slate-200">{pt.expected}%</span>
                  </div>
                  {#if pt.forecast !== null}
                    <div class="flex items-center justify-between gap-3">
                      <span class="inline-flex items-center gap-1.5 text-slate-300"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>Forecast</span>
                      <span class="font-mono font-bold text-emerald-300">{pt.forecast}%</span>
                    </div>
                  {/if}
                </div>
              </div>
            {/if}
          </div>
        </div>

        <!-- Donut Chart -->
        <div
          class="lg:col-span-4 bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between"
          role="presentation"
          on:mouseleave={() => (hoveredDonutIdx = null)}
        >
          <div class="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-slate-100">
            <h3 class="text-xs font-bold text-slate-900 truncate">{currentDomain.donutTitle}</h3>
            {#if hoveredDonutIdx !== null && currentDomain.donutSegments[hoveredDonutIdx]}
              {@const activeSeg = currentDomain.donutSegments[hoveredDonutIdx]}
              <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-semibold text-slate-700 shrink-0 max-w-[130px] truncate">
                <span class="w-1.5 h-1.5 rounded-full shrink-0" style="background:{activeSeg.color}"></span>
                <span class="truncate">{activeSeg.label}</span>
              </span>
            {:else}
              <span class="text-[10px] font-semibold text-slate-400 shrink-0">Distribution</span>
            {/if}
          </div>
          <div class="flex-1 flex items-center gap-4">
            <svg viewBox="0 0 110 110" class="w-24 h-24 shrink-0 overflow-visible">
              <circle cx="55" cy="55" r={R} fill="none" stroke="#f1f5f9" stroke-width="14" />
              {#each donutArcs as arc, idx}
                {@const isHovered = hoveredDonutIdx === idx}
                {@const isDimmed = hoveredDonutIdx !== null && !isHovered}
                <circle
                  cx="55"
                  cy="55"
                  r={R}
                  fill="none"
                  stroke={arc.color}
                  stroke-width={isHovered ? 17 : 14}
                  stroke-dasharray={arc.dasharray}
                  stroke-dashoffset={arc.dashoffset}
                  opacity={isDimmed ? 0.35 : 1}
                  transform="rotate(-90 55 55)"
                  class="cursor-pointer transition-all duration-150"
                  role="presentation"
                  on:mouseenter={() => (hoveredDonutIdx = idx)}
                />
              {/each}
              {#if hoveredDonutIdx !== null && currentDomain.donutSegments[hoveredDonutIdx]}
                {@const activeSeg = currentDomain.donutSegments[hoveredDonutIdx]}
                <text x="55" y="52" text-anchor="middle" font-size="13" font-weight="800" fill={activeSeg.color}>{activeSeg.count}</text>
                <text x="55" y="64" text-anchor="middle" font-size="8" font-weight="700" fill="#475569">{activeSeg.pct}% share</text>
              {:else}
                <text x="55" y="53" text-anchor="middle" font-size="13" font-weight="800" fill="#0f172a">{currentDomain.donutCenterValue}</text>
                <text x="55" y="65" text-anchor="middle" font-size="8" fill="#64748b">{currentDomain.donutCenterLabel}</text>
              {/if}
            </svg>
            <div class="space-y-1 flex-1 min-w-0">
              {#each currentDomain.donutSegments as seg, idx}
                {@const isHovered = hoveredDonutIdx === idx}
                {@const isDimmed = hoveredDonutIdx !== null && !isHovered}
                <div
                  role="presentation"
                  on:mouseenter={() => (hoveredDonutIdx = idx)}
                  class="flex items-center justify-between text-[11px] gap-2 px-1.5 py-1 rounded-md cursor-pointer transition-all duration-150 {isHovered ? 'bg-slate-100/90 ring-1 ring-slate-200/80' : 'hover:bg-slate-50'} {isDimmed ? 'opacity-50' : 'opacity-100'}"
                >
                  <span class="inline-flex items-center gap-1.5 truncate {isHovered ? 'text-slate-900 font-semibold' : 'text-slate-700'}">
                    <span class="w-2 h-2 rounded-full shrink-0 transition-transform duration-150 {isHovered ? 'scale-125' : ''}" style="background:{seg.color}"></span>
                    <span class="truncate">{seg.label}</span>
                  </span>
                  <span class="font-semibold text-slate-900 shrink-0">{seg.count} <span class="text-slate-400 font-normal">({seg.pct}%)</span></span>
                </div>
              {/each}
            </div>
          </div>
        </div>

        <!-- Key Insights -->
        <div class="lg:col-span-4 bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-slate-100">
            <h3 class="text-xs font-bold text-slate-900">Key Insights</h3>
            <span class="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-semibold text-slate-600">{Math.min(3, currentDomain.insights.length)} signals</span>
          </div>
          <ol class="flex-1 flex flex-col justify-center space-y-2">
            {#each currentDomain.insights.slice(0, 3) as ins, idx}
              <li class="flex items-start gap-2 text-[11px] text-slate-700 leading-snug rounded-lg bg-slate-50/80 border border-slate-100 px-2.5 py-2">
                <span class="w-4 h-4 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
                <span>{ins}</span>
              </li>
            {/each}
          </ol>
        </div>
      </div>

      <!-- Breakdown Section -->
      <div class="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <!-- Sub-tabs & Sort Header -->
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div class="flex items-center gap-4 text-xs font-semibold">
            <button
              type="button"
              on:click={() => { subTab = 'site'; countryFilter = 'all'; }}
              class="pb-1 border-b-2 cursor-pointer inline-flex items-center gap-1.5 transition-colors {subTab === 'site' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}"
            >
              <span>{currentDomain.breakdownTitle}</span>
              <span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold {subTab === 'site' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}">{filteredBreakdown.length}</span>
            </button>
            <button
              type="button"
              on:click={() => { subTab = 'subject'; countryFilter = 'all'; ownerFilter = 'all'; subjectPage = 1; }}
              class="pb-1 border-b-2 cursor-pointer inline-flex items-center gap-1.5 transition-colors {subTab === 'subject' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}"
            >
              <span>Subject Breakdown</span>
              <span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold {subTab === 'subject' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}">{filteredSubjects.length}</span>
            </button>
            <button
              type="button"
              on:click={() => { subTab = 'details'; ownerFilter = 'all'; pendingPage = 1; }}
              class="pb-1 border-b-2 cursor-pointer inline-flex items-center gap-1.5 transition-colors {subTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}"
            >
              <span>Pending Records</span>
              <span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold {subTab === 'details' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}">{filteredPendingRecords.length}</span>
            </button>
          </div>

          <div class="flex items-center gap-2">
            {#if activeFilterCount > 0}
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[10px] font-bold text-blue-700">
                <Filter size={10} /> {activeFilterCount} active
              </span>
              <button
                type="button"
                on:click={resetTableFilters}
                class="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
              >
                <RotateCcw size={11} /> Reset
              </button>
            {/if}
            <div class="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-slate-200 bg-slate-50/80 text-[11px] text-slate-600">
              <ArrowUpDown size={11} class="text-slate-400 shrink-0" />
              {#if subTab === 'site'}
                <select bind:value={siteSort} class="bg-transparent text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer">
                  <option value="pct_asc">Sort: Lowest % Complete</option>
                  <option value="incomplete_desc">Sort: Most Incomplete</option>
                  <option value="critical_desc">Sort: Most Critical</option>
                  <option value="country_asc">Sort: Country / Source</option>
                </select>
              {:else if subTab === 'subject'}
                <select bind:value={subjectSort} on:change={() => (subjectPage = 1)} class="bg-transparent text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer">
                  <option value="pct_asc">Sort: Lowest Domain %</option>
                  <option value="days_desc">Sort: Most Days Open</option>
                  <option value="id_asc">Sort: Subject ID</option>
                </select>
              {:else}
                <select bind:value={pendingSort} on:change={() => (pendingPage = 1)} class="bg-transparent text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer">
                  <option value="crit_desc">Sort: Highest Criticality</option>
                  <option value="days_desc">Sort: Oldest First</option>
                  <option value="site_asc">Sort: Site ID</option>
                  <option value="subject_asc">Sort: Subject ID</option>
                </select>
              {/if}
            </div>
          </div>
        </div>

        <!-- Polished Top Filter Bar -->
        <div class="rounded-xl bg-slate-50/90 border border-slate-200/80 p-3 space-y-2.5">
          <!-- Row 1: Quick Status / Criticality Segmented Pills -->
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                <Filter size={11} />
                {subTab === 'details' ? 'Criticality' : 'Status'}
              </span>

              {#if subTab === 'details'}
                {#each [
                  { key: 'all', label: 'All', count: pendingCritCounts.all, dot: '' },
                  { key: 'Critical', label: 'Critical', count: pendingCritCounts.Critical, dot: 'bg-rose-500' },
                  { key: 'High', label: 'High', count: pendingCritCounts.High, dot: 'bg-amber-500' },
                  { key: 'Medium', label: 'Medium', count: pendingCritCounts.Medium, dot: 'bg-slate-400' },
                ] as pill}
                  <button
                    type="button"
                    on:click={() => { criticalityFilter = pill.key; pendingPage = 1; }}
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer {criticalityFilter === pill.key ? 'bg-slate-900 text-white border-slate-900 shadow-2xs' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}"
                  >
                    {#if pill.dot}
                      <span class="w-1.5 h-1.5 rounded-full {pill.dot}"></span>
                    {/if}
                    <span>{pill.label}</span>
                    <span class="px-1.5 py-0.2 rounded-full text-[10px] font-bold {criticalityFilter === pill.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}">{pill.count}</span>
                  </button>
                {/each}
              {:else}
                {@const counts = subTab === 'site' ? siteStatusCounts : subjectStatusCounts}
                {#each [
                  { key: 'all', label: 'All', count: counts.all, dot: '' },
                  { key: 'High risk', label: 'High risk', count: counts['High risk'], dot: 'bg-rose-500' },
                  { key: 'At risk', label: 'At risk', count: counts['At risk'], dot: 'bg-amber-500' },
                  { key: 'On track', label: 'On track', count: counts['On track'], dot: 'bg-emerald-500' },
                ] as pill}
                  <button
                    type="button"
                    on:click={() => { statusFilter = pill.key; subjectPage = 1; }}
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer {statusFilter === pill.key ? 'bg-slate-900 text-white border-slate-900 shadow-2xs' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}"
                  >
                    {#if pill.dot}
                      <span class="w-1.5 h-1.5 rounded-full {pill.dot}"></span>
                    {/if}
                    <span>{pill.label}</span>
                    <span class="px-1.5 py-0.2 rounded-full text-[10px] font-bold {statusFilter === pill.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}">{pill.count}</span>
                  </button>
                {/each}
              {/if}
            </div>

            {#if subTab === 'site'}
              <button
                type="button"
                on:click={() => (onlyCriticalSites = !onlyCriticalSites)}
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer {onlyCriticalSites ? 'bg-rose-600 text-white border-rose-600 shadow-2xs' : 'bg-white text-slate-600 border-slate-200 hover:border-rose-300 hover:text-rose-700'}"
              >
                <span class="w-1.5 h-1.5 rounded-full {onlyCriticalSites ? 'bg-white' : 'bg-rose-500'}"></span>
                Critical Items Only
              </button>
            {/if}
          </div>

          <!-- Row 2: Search + Context-Aware Dropdown Filters -->
          <div class="flex flex-wrap items-center gap-2">
            <div class="relative flex-1 min-w-[200px]">
              <Search size={13} class="absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                bind:value={searchQuery}
                on:input={() => { subjectPage = 1; pendingPage = 1; }}
                placeholder={subTab === 'subject' ? 'Search subject ID, site, country, owner...' : subTab === 'details' ? 'Search subject, site, form, issue, owner...' : 'Search site ID or country / source...'}
                class="w-full pl-8 pr-7 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              {#if searchQuery}
                <button
                  type="button"
                  on:click={() => { searchQuery = ''; subjectPage = 1; pendingPage = 1; }}
                  class="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label="Clear search"
                >
                  <X size={13} />
                </button>
              {/if}
            </div>

            {#if subTab === 'site'}
              <select
                bind:value={countryFilter}
                class="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-medium focus:outline-hidden focus:border-blue-500 cursor-pointer"
              >
                <option value="all">{currentDomain.id === 'external_data' ? 'All Sources' : 'All Countries'} ({breakdownCountries.length})</option>
                {#each breakdownCountries as c}
                  <option value={c}>{c}</option>
                {/each}
              </select>
            {:else if subTab === 'subject'}
              <select
                bind:value={countryFilter}
                on:change={() => (subjectPage = 1)}
                class="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-medium focus:outline-hidden focus:border-blue-500 cursor-pointer"
              >
                <option value="all">All Countries ({subjectCountries.length})</option>
                {#each subjectCountries as c}
                  <option value={c}>{c}</option>
                {/each}
              </select>
              <select
                bind:value={classificationFilter}
                on:change={() => (subjectPage = 1)}
                class="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-medium focus:outline-hidden focus:border-blue-500 cursor-pointer"
              >
                <option value="all">All Classifications</option>
                <option value="Hard Blocked">Hard Blocked</option>
                <option value="Action Required">Action Required</option>
                <option value="Conditionally Ready">Conditionally Ready</option>
                <option value="Lock Ready">Lock Ready</option>
              </select>
              <select
                bind:value={ownerFilter}
                on:change={() => (subjectPage = 1)}
                class="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-medium focus:outline-hidden focus:border-blue-500 cursor-pointer"
              >
                <option value="all">All Owners</option>
                {#each subjectOwners as owner}
                  <option value={owner}>{owner}</option>
                {/each}
              </select>
            {:else}
              <select
                bind:value={siteFilter}
                on:change={() => (pendingPage = 1)}
                class="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-medium focus:outline-hidden focus:border-blue-500 cursor-pointer"
              >
                <option value="all">All Sites ({pendingSites.length})</option>
                {#each pendingSites as s}
                  <option value={s}>Site {s}</option>
                {/each}
              </select>
              <select
                bind:value={ownerFilter}
                on:change={() => (pendingPage = 1)}
                class="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-medium focus:outline-hidden focus:border-blue-500 cursor-pointer"
              >
                <option value="all">All Owners ({pendingOwners.length})</option>
                {#each pendingOwners as owner}
                  <option value={owner}>{owner}</option>
                {/each}
              </select>
              <select
                bind:value={agingFilter}
                on:change={() => (pendingPage = 1)}
                class="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-medium focus:outline-hidden focus:border-blue-500 cursor-pointer"
              >
                <option value="all">All Aging</option>
                <option value="escalated">Escalated (≥ 10d)</option>
                <option value="overdue">Overdue (&gt; 7d)</option>
                <option value="recent">Recent (≤ 7d)</option>
              </select>
            {/if}
          </div>
        </div>

        {#if subTab === 'site'}
          <div class="rounded-lg border border-slate-200/80 overflow-x-auto">
            <table class="w-full text-xs">
              <thead class="bg-slate-50/90 border-b border-slate-200/80">
                <tr class="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th class="px-3 py-2.5">Country / Source</th>
                  <th class="px-3 py-2.5">Site ID</th>
                  <th class="px-3 py-2.5 text-right">Subjects</th>
                  <th class="px-3 py-2.5 text-right">Complete / Exp</th>
                  <th class="px-3 py-2.5 text-right">Incomplete</th>
                  <th class="px-3 py-2.5 text-right">% Complete</th>
                  <th class="px-3 py-2.5 text-right">7d Trend</th>
                  <th class="px-3 py-2.5 text-right">Critical</th>
                  <th class="px-3 py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white">
                {#each filteredBreakdown as row}
                  <tr
                    class="hover:bg-blue-50/50 transition-colors cursor-pointer"
                    on:click={() => { if (/^\d+$/.test(row.siteId)) onSelectSite(row.siteId); }}
                  >
                    <td class="px-3 py-2.5 font-semibold text-slate-800">{row.country}</td>
                    <td class="px-3 py-2.5">
                      <span class="px-2 py-0.5 rounded bg-slate-100 font-mono font-semibold text-slate-700 text-[11px]">{row.siteId}</span>
                    </td>
                    <td class="px-3 py-2.5 text-right font-medium text-slate-700">{row.subjects}</td>
                    <td class="px-3 py-2.5 text-right text-slate-600">
                      <span class="font-semibold text-slate-800">{row.complete}</span>
                      <span class="text-slate-400"> / {row.expected}</span>
                    </td>
                    <td class="px-3 py-2.5 text-right">
                      <span class="px-1.5 py-0.5 rounded font-semibold {row.incomplete > 0 ? 'bg-rose-50 text-rose-700' : 'text-slate-400'}">{row.incomplete}</span>
                    </td>
                    <td class="px-3 py-2.5 text-right">
                      <div class="inline-flex items-center gap-2">
                        <div class="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden hidden sm:block">
                          <div
                            class="h-full rounded-full {row.status === 'On track' ? 'bg-emerald-500' : row.status === 'High risk' ? 'bg-rose-500' : 'bg-amber-500'}"
                            style="width: {row.pctComplete}%"
                          ></div>
                        </div>
                        <span class="font-bold text-slate-900 w-9 text-right">{row.pctComplete}%</span>
                      </div>
                    </td>
                    <td class="px-3 py-2.5 text-right">
                      <span class="px-1.5 py-0.5 rounded text-[11px] font-semibold {row.trend7d.startsWith('-') ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}">
                        {row.trend7d}
                      </span>
                    </td>
                    <td class="px-3 py-2.5 text-right">
                      <span class="px-1.5 py-0.5 rounded font-bold {row.criticalItems > 0 ? 'bg-rose-50 text-rose-700' : 'text-slate-400 font-medium'}">
                        {row.criticalItems}
                      </span>
                    </td>
                    <td class="px-3 py-2.5 text-right">
                      <span class="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border {statusPill(row.status)}">
                        <span class="w-1.5 h-1.5 rounded-full {dotColor(row.status)}"></span>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                {:else}
                  <tr>
                    <td colspan="9" class="py-8 text-center text-xs text-slate-400">
                      No rows match the current filters.
                      <button type="button" on:click={resetTableFilters} class="ml-1.5 text-blue-600 font-semibold hover:underline cursor-pointer">Reset filters</button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else if subTab === 'subject'}
          <div class="rounded-lg border border-slate-200/80 overflow-x-auto">
            <table class="w-full text-xs">
              <thead class="bg-slate-50/90 border-b border-slate-200/80">
                <tr class="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th class="px-3 py-2.5">Subject ID</th>
                  <th class="px-3 py-2.5">Site / Country</th>
                  <th class="px-3 py-2.5">Domain Details</th>
                  <th class="px-3 py-2.5 text-right">Domain %</th>
                  <th class="px-3 py-2.5">Classification</th>
                  <th class="px-3 py-2.5 text-right">Days Open</th>
                  <th class="px-3 py-2.5">Owner</th>
                  <th class="px-3 py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white">
                {#each visibleSubjects as item}
                  <tr
                    class="hover:bg-blue-50/50 transition-colors cursor-pointer"
                    on:click={() => (drawerSubjectId = item.subj.id)}
                  >
                    <td class="px-3 py-2.5 font-mono font-bold text-blue-700 whitespace-nowrap">{item.subj.id}</td>
                    <td class="px-3 py-2.5 text-slate-700 whitespace-nowrap">
                      <span class="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[11px] font-semibold text-slate-700 mr-1">{item.subj.siteId}</span>
                      <span class="text-slate-500">{item.subj.country}</span>
                    </td>
                    <td class="px-3 py-2.5 text-slate-600 max-w-[260px] truncate" title={item.domEntry?.details || item.subj.keyOpenItems}>
                      {item.domEntry?.details || item.subj.keyOpenItems}
                    </td>
                    <td class="px-3 py-2.5 text-right">
                      <div class="inline-flex items-center gap-2">
                        <div class="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden hidden sm:block">
                          <div
                            class="h-full rounded-full {item.domainStatus === 'On track' ? 'bg-emerald-500' : item.domainStatus === 'High risk' ? 'bg-rose-500' : 'bg-amber-500'}"
                            style="width: {item.completion}%"
                          ></div>
                        </div>
                        <span class="font-bold text-slate-900 w-9 text-right">{item.completion}%</span>
                      </div>
                    </td>
                    <td class="px-3 py-2.5">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold border {item.subj.classification === 'Hard Blocked' ? 'bg-rose-50 text-rose-700 border-rose-200' : item.subj.classification === 'Action Required' ? 'bg-amber-50 text-amber-700 border-amber-200' : item.subj.classification === 'Conditionally Ready' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}">
                        {item.subj.classification}
                      </span>
                    </td>
                    <td class="px-3 py-2.5 text-right font-semibold text-slate-700">{item.subj.daysOpen}d</td>
                    <td class="px-3 py-2.5 text-slate-600">{item.subj.owner}</td>
                    <td class="px-3 py-2.5 text-right">
                      <span class="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border {statusPill(item.domainStatus)}">
                        <span class="w-1.5 h-1.5 rounded-full {dotColor(item.domainStatus)}"></span>
                        {item.domainStatus}
                      </span>
                    </td>
                  </tr>
                {:else}
                  <tr>
                    <td colspan="8" class="py-8 text-center text-xs text-slate-400">
                      No subjects match the current filters.
                      <button type="button" on:click={resetTableFilters} class="ml-1.5 text-blue-600 font-semibold hover:underline cursor-pointer">Reset filters</button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
          <div class="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs">
            <div class="flex items-center gap-2 text-slate-500">
              <span>
                Showing {filteredSubjects.length === 0 ? 0 : (subjectPage - 1) * subjectPageSize + 1}–{Math.min(subjectPage * subjectPageSize, filteredSubjects.length)} of {filteredSubjects.length} subjects · Page {subjectPage} of {totalSubjectPages}
              </span>
              <select
                bind:value={subjectPageSize}
                on:change={() => (subjectPage = 1)}
                class="border border-slate-200 rounded-md px-1.5 py-0.5 bg-white text-xs text-slate-700"
              >
                <option value={15}>15 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={220}>All (220)</option>
              </select>
            </div>
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                disabled={subjectPage === 1}
                on:click={() => (subjectPage = Math.max(1, subjectPage - 1))}
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft size={13} /> Previous
              </button>
              {#each visibleSubjectPageNumbers as p}
                <button
                  type="button"
                  on:click={() => (subjectPage = p)}
                  class="w-7 h-7 rounded-md text-xs font-semibold border cursor-pointer {subjectPage === p ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}"
                >
                  {p}
                </button>
              {/each}
              <button
                type="button"
                disabled={subjectPage === totalSubjectPages}
                on:click={() => (subjectPage = Math.min(totalSubjectPages, subjectPage + 1))}
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Next <ChevronRight size={13} />
              </button>
            </div>
          </div>
        {/if}

        <!-- Pending Items: Preview on Site/Subject tabs, Full Paginated List on Pending Records tab -->
        <div class="{subTab === 'details' ? '' : 'pt-3 border-t border-slate-100'}">
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-xs font-bold text-slate-900">
              {subTab === 'details' ? `All Pending Records · ${filteredPendingRecords.length} items` : currentDomain.topPendingTitle}
            </h4>
            {#if subTab !== 'details'}
              <button
                type="button"
                on:click={() => (subTab = 'details')}
                class="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                View All {allDomainPendingRecords.length} Pending Records →
              </button>
            {:else}
              <button type="button" on:click={() => onSelectTab('subjects')} class="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer">
                Open Subjects Workspace →
              </button>
            {/if}
          </div>
          <div class="rounded-lg border border-slate-200/80 overflow-x-auto">
            <table class="w-full text-xs">
              <thead class="bg-slate-50/90 border-b border-slate-200/80">
                <tr class="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th class="px-3 py-2">Subject ID</th>
                  <th class="px-3 py-2">Site</th>
                  <th class="px-3 py-2">Visit / Scope</th>
                  <th class="px-3 py-2">Form / Item</th>
                  <th class="px-3 py-2">Issue</th>
                  <th class="px-3 py-2 text-right">Days Open</th>
                  <th class="px-3 py-2">Criticality</th>
                  <th class="px-3 py-2">Owner</th>
                  <th class="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white">
                {#each (subTab === 'details' ? pagedPendingRecords : allDomainPendingRecords.slice(0, 10)) as item}
                  <tr class="hover:bg-blue-50/50 transition-colors cursor-pointer" on:click={() => (drawerSubjectId = item.subjectId)}>
                    <td class="px-3 py-2 font-mono font-bold text-blue-700 whitespace-nowrap">{item.subjectId}</td>
                    <td class="px-3 py-2 text-slate-600 whitespace-nowrap">{item.siteId}</td>
                    <td class="px-3 py-2 text-slate-600 whitespace-nowrap">{item.visit}</td>
                    <td class="px-3 py-2 font-medium text-slate-800 whitespace-nowrap">{item.form}</td>
                    <td class="px-3 py-2 text-slate-600">{item.issue}</td>
                    <td class="px-3 py-2 text-right font-semibold text-slate-800">{item.daysOpen}d</td>
                    <td class="px-3 py-2">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold border {item.criticality === 'Critical' ? 'bg-rose-50 text-rose-700 border-rose-200' : item.criticality === 'High' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200'}">
                        {item.criticality}
                      </span>
                    </td>
                    <td class="px-3 py-2 text-slate-600 whitespace-nowrap">{item.owner}</td>
                    <td class="px-3 py-2 text-right whitespace-nowrap">
                      <span class="text-blue-600 hover:text-blue-800 font-semibold">
                        {item.actionLabel} →
                      </span>
                    </td>
                  </tr>
                {:else}
                  <tr>
                    <td colspan="9" class="py-8 text-center text-xs text-slate-400">
                      No pending records match the current filters.
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>

          {#if subTab === 'details'}
            <div class="flex flex-wrap items-center justify-between gap-2 pt-3 mt-1 text-xs">
              <div class="flex items-center gap-2 text-slate-500">
                <span>
                  Showing {filteredPendingRecords.length === 0 ? 0 : (pendingPage - 1) * pendingPageSize + 1}–{Math.min(pendingPage * pendingPageSize, filteredPendingRecords.length)} of {filteredPendingRecords.length} records · Page {pendingPage} of {totalPendingPages}
                </span>
                <select
                  bind:value={pendingPageSize}
                  on:change={() => (pendingPage = 1)}
                  class="border border-slate-200 rounded-md px-1.5 py-0.5 bg-white text-xs text-slate-700"
                >
                  <option value={15}>15 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={Math.max(1000, filteredPendingRecords.length)}>All ({filteredPendingRecords.length})</option>
                </select>
              </div>
              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={pendingPage === 1}
                  on:click={() => (pendingPage = Math.max(1, pendingPage - 1))}
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft size={13} /> Previous
                </button>
                {#each visiblePendingPageNumbers as p}
                  <button
                    type="button"
                    on:click={() => (pendingPage = p)}
                    class="w-7 h-7 rounded-md text-xs font-semibold border cursor-pointer {pendingPage === p ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}"
                  >
                    {p}
                  </button>
                {/each}
                <button
                  type="button"
                  disabled={pendingPage === totalPendingPages}
                  on:click={() => (pendingPage = Math.min(totalPendingPages, pendingPage + 1))}
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next <ChevronRight size={13} />
                </button>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>

{#if drawerSubject}
  <SubjectDrawerV3
    subject={drawerSubject}
    subjectIndex={drawerSubjectIdx}
    totalSubjects={V3_SUBJECT_ROWS.length}
    onClose={() => (drawerSubjectId = null)}
    onPrev={() => {
      const prevIdx = (drawerSubjectIdx - 1 + V3_SUBJECT_ROWS.length) % V3_SUBJECT_ROWS.length;
      drawerSubjectId = V3_SUBJECT_ROWS[prevIdx].id;
    }}
    onNext={() => {
      const nextIdx = (drawerSubjectIdx + 1) % V3_SUBJECT_ROWS.length;
      drawerSubjectId = V3_SUBJECT_ROWS[nextIdx].id;
    }}
    onOpenActions={() => { drawerSubjectId = null; onSelectTab('actions_sim'); }}
  />
{/if}
