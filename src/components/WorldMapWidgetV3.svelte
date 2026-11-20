<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { ZoomIn, ZoomOut, RotateCcw } from '@lucide/svelte';
  import { V3_SITES, V3_COUNTRY_SUMMARY } from '../data/v3Data';

  export let onSelectCountry: (country: string) => void = () => {};
  export let onSelectSite: ((siteId: string) => void) | null = null;
  export let selectedCountry: string = 'all';
  export let heightClass: string = 'h-[310px]';

  let mapContainer: HTMLElement;
  let map: any = null;
  let L: any = null;
  let clusterGroup: any = null;
  let resizeObserver: ResizeObserver | null = null;

  const SITE_COORDS: Record<string, [number, number]> = {
    '317': [52.52, 13.40],   // Charité, Berlin
    '344': [49.41, 8.67],    // Heidelberg
    '405': [37.58, 127.00],  // Seoul National Univ
    '455': [37.53, 127.11],  // Asan Medical Center
    '104': [42.36, -71.06],  // Boston
    '901': [29.71, -95.40],  // Houston
    '112': [40.76, -73.96],  // New York
    '233': [37.76, -122.46], // San Francisco
    '990': [39.30, -76.59],  // Baltimore
    '208': [48.86, 2.35],    // Paris
    '788': [45.74, 4.88],    // Lyon
    '722': [48.79, 2.35],    // Villejuif / Paris
    '511': [40.42, -3.70],   // Madrid
    '899': [41.39, 2.15],    // Barcelona
    '120': [43.66, -79.39],  // Toronto
    '677': [45.50, -73.58],  // Montreal
    '502': [-37.80, 144.96], // Melbourne
    '566': [-33.87, 151.21], // Sydney
  };

  function getColors(riskLevel: string) {
    if (riskLevel === 'High risk') return { bg: '#e11d48', ring: '#f43f5e' };
    if (riskLevel === 'At risk') return { bg: '#d97706', ring: '#f59e0b' };
    return { bg: '#059669', ring: '#10b981' };
  }

  function fitSites(country = 'all', animate = true) {
    if (!map || !L) return;
    const targets = country === 'all' ? V3_SITES : V3_SITES.filter((s) => s.country === country);
    const pts = targets.map((s) => SITE_COORDS[s.id]).filter(Boolean);
    if (pts.length > 0) {
      const bounds = L.latLngBounds(pts);
      map.fitBounds(bounds, { padding: [32, 32], maxZoom: country === 'all' ? 4 : 6, animate });
    }
  }

  $: if (map && L) {
    fitSites(selectedCountry, true);
  }

  onMount(async () => {
    try {
      const leafletModule = await import('leaflet');
      L = leafletModule.default || leafletModule;
      (window as any).L = L;
      await import('leaflet.markercluster');

      if (!mapContainer) return;

      map = L.map(mapContainer, {
        center: [28, 12],
        zoom: 2,
        minZoom: 1.5,
        maxZoom: 16,
        zoomControl: false,
        attributionControl: true,
        worldCopyJump: true,
      });

      if (map.attributionControl) {
        map.attributionControl.setPrefix(false);
      }

      // 100% Free, NO API Key required Esri Light Gray basemap + Reference labels
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; <a href="https://www.esri.com/" target="_blank">Esri</a>',
          maxZoom: 16,
        }
      ).addTo(map);

      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 16,
        }
      ).addTo(map);

      clusterGroup = L.markerClusterGroup({
        maxClusterRadius: 36,
        spiderfyOnMaxZoom: true,
        zoomToBoundsOnClick: true,
        showCoverageOnHover: false,
        iconCreateFunction: (cluster: any) => {
          const markers = cluster.getAllChildMarkers();
          const count = markers.length;
          let hasHighRisk = false;
          let hasAtRisk = false;

          for (const m of markers) {
            const r = m.options?.siteData?.riskLevel;
            if (r === 'High risk') hasHighRisk = true;
            else if (r === 'At risk') hasAtRisk = true;
          }

          const color = hasHighRisk ? '#e11d48' : hasAtRisk ? '#d97706' : '#059669';
          const ring = hasHighRisk ? '#f43f5e' : hasAtRisk ? '#f59e0b' : '#10b981';

          return L.divIcon({
            html: `
              <div class="v3-cluster-dot" style="background:${color};">
                ${hasHighRisk ? `<span class="v3-cluster-pulse" style="border-color:${ring};"></span>` : ''}
                <span>${count}</span>
              </div>
            `,
            className: 'v3-cluster-wrapper',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });
        },
      });

      V3_SITES.forEach((site) => {
        const coords = SITE_COORDS[site.id];
        if (!coords) return;
        const colors = getColors(site.riskLevel);
        const isHighRisk = site.riskLevel === 'High risk';

        const icon = L.divIcon({
          html: `
            <div class="v3-site-pin" style="background:${colors.bg};">
              ${isHighRisk ? `<span class="v3-pin-pulse" style="border-color:${colors.ring};"></span>` : ''}
              <span>${site.id}</span>
            </div>
          `,
          className: 'v3-pin-wrapper',
          iconSize: [30, 30],
          iconAnchor: [15, 15],
          popupAnchor: [0, -16],
        });

        const marker = L.marker(coords, { icon, siteData: site });

        const badgeClass =
          site.riskLevel === 'High risk'
            ? 'background:#fff1f2;color:#be123c;border:1px solid #fecdd3;'
            : site.riskLevel === 'At risk'
            ? 'background:#fffbeb;color:#b45309;border:1px solid #fde68a;'
            : 'background:#ecfdf5;color:#047857;border:1px solid #a7f3d0;';

        const popupHtml = `
          <div style="min-width:210px;font-family:Inter,system-ui,sans-serif;font-size:11px;line-height:1.4;color:#1e293b;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding-bottom:6px;border-bottom:1px solid #f1f5f9;">
              <strong style="font-size:12px;color:#0f172a;">Site ${site.id} · ${site.country}</strong>
              <span style="padding:1px 6px;border-radius:999px;font-size:10px;font-weight:700;${badgeClass}">${site.riskLevel}</span>
            </div>
            <div style="margin-top:5px;font-weight:600;color:#334155;">${site.name}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:6px;color:#475569;">
              <div>Readiness: <strong style="color:#0f172a;">${site.readiness}%</strong></div>
              <div>Impact: <strong style="color:${site.dblImpactDays > 0 ? '#e11d48' : '#059669'};">${site.dblImpactDays > 0 ? `+${site.dblImpactDays}d` : '0d'}</strong></div>
              <div>Blockers: <strong style="color:#0f172a;">${site.hardGateBlockers}</strong></div>
              <div>Subjects: <strong style="color:#0f172a;">${site.enrolled}</strong></div>
            </div>
            <div style="margin-top:5px;font-size:10px;color:#64748b;">Driver: ${site.primaryDriver}</div>
            <div style="display:flex;gap:6px;margin-top:7px;">
              <button type="button" data-country="${site.country}" class="v3-popup-filter-btn" style="flex:1;padding:4px 8px;border-radius:6px;background:#f1f5f9;color:#1e293b;font-weight:600;font-size:10.5px;border:1px solid #cbd5e1;cursor:pointer;">
                Filter ${site.country}
              </button>
              ${onSelectSite ? `<button type="button" data-site="${site.id}" class="v3-popup-site-btn" style="flex:1;padding:4px 8px;border-radius:6px;background:#2563eb;color:#ffffff;font-weight:600;font-size:10.5px;border:none;cursor:pointer;">Inspect Site →</button>` : ''}
            </div>
          </div>
        `;

        marker.bindPopup(popupHtml, { closeButton: true, className: 'v3-leaflet-popup' });
        marker.on('popupopen', (e: any) => {
          const el = e.popup.getElement();
          const btn = el?.querySelector('.v3-popup-filter-btn');
          if (btn) {
            btn.addEventListener('click', () => onSelectCountry(site.country));
          }
          const siteBtn = el?.querySelector('.v3-popup-site-btn');
          if (siteBtn && onSelectSite) {
            siteBtn.addEventListener('click', () => onSelectSite!(site.id));
          }
        });

        clusterGroup.addLayer(marker);
      });

      map.addLayer(clusterGroup);
      fitSites(selectedCountry, false);

      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          if (map) map.invalidateSize();
        });
        resizeObserver.observe(mapContainer);
      }

      setTimeout(() => {
        if (map) map.invalidateSize();
      }, 150);
    } catch (err) {
      console.error('Failed to initialize WorldMapWidgetV3:', err);
    }
  });

  onDestroy(() => {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    if (map) {
      map.remove();
      map = null;
    }
  });
</script>

<div class="relative w-full {heightClass} rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
  <div bind:this={mapContainer} class="w-full h-full z-0"></div>

  <!-- Top-left Summary Pill -->
  <div class="absolute top-2.5 left-2.5 z-[400] inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/95 backdrop-blur-xs border border-slate-200/90 shadow-xs text-[11px] font-semibold text-slate-700 pointer-events-none">
    <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
    <span>{selectedCountry === 'all' ? `${V3_COUNTRY_SUMMARY.length} Countries · ${V3_SITES.length} Sites` : `${selectedCountry} · ${V3_SITES.filter((s) => s.country === selectedCountry).length} Sites`}</span>
  </div>

  <!-- Top-right Clean Zoom Controls -->
  <div class="absolute top-2.5 right-2.5 z-[400] flex items-center bg-white/95 backdrop-blur-xs rounded-md border border-slate-200/90 shadow-xs overflow-hidden">
    <button
      type="button"
      on:click={() => map?.zoomIn()}
      title="Zoom in"
      class="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer border-r border-slate-200/80"
    >
      <ZoomIn size={13} />
    </button>
    <button
      type="button"
      on:click={() => map?.zoomOut()}
      title="Zoom out"
      class="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer border-r border-slate-200/80"
    >
      <ZoomOut size={13} />
    </button>
    <button
      type="button"
      on:click={() => fitSites('all', true)}
      title="Reset view"
      class="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
    >
      <RotateCcw size={13} />
    </button>
  </div>

  <!-- Bottom-left Legend -->
  <div class="absolute bottom-2 left-2.5 z-[400] flex items-center gap-3 px-2.5 py-1 rounded-md bg-white/95 backdrop-blur-xs border border-slate-200/90 shadow-xs text-[10px] font-medium text-slate-600 pointer-events-none">
    <span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-600"></span> On track</span>
    <span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-amber-600"></span> At risk</span>
    <span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-rose-600"></span> High risk</span>
  </div>
</div>

<style>
  :global(.v3-pin-wrapper),
  :global(.v3-cluster-wrapper) {
    background: transparent !important;
    border: none !important;
  }

  :global(.v3-site-pin) {
    position: relative;
    width: 28px;
    height: 28px;
    border-radius: 9999px;
    border: 2px solid #ffffff;
    color: #ffffff;
    font-size: 9.5px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.28);
    transition: transform 0.15s ease;
  }

  :global(.v3-site-pin:hover) {
    transform: scale(1.12);
  }

  :global(.v3-cluster-dot) {
    position: relative;
    width: 32px;
    height: 32px;
    border-radius: 9999px;
    border: 2px solid #ffffff;
    color: #ffffff;
    font-size: 11px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.3);
  }

  :global(.v3-pin-pulse),
  :global(.v3-cluster-pulse) {
    position: absolute;
    inset: -5px;
    border-radius: 9999px;
    border: 2px solid;
    animation: v3-map-pulse 2s infinite ease-out;
    pointer-events: none;
  }

  @keyframes v3-map-pulse {
    0% {
      transform: scale(0.9);
      opacity: 0.85;
    }
    100% {
      transform: scale(1.45);
      opacity: 0;
    }
  }

  :global(.v3-leaflet-popup .leaflet-popup-content-wrapper) {
    border-radius: 10px;
    padding: 2px;
    box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.18);
  }

  :global(.v3-leaflet-popup .leaflet-popup-content) {
    margin: 10px 12px;
  }
</style>
