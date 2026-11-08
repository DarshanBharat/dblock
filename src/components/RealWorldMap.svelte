<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import {
    MapPin,
    Layers,
    Maximize2,
    Minimize2,
    ZoomIn,
    ZoomOut,
    Crosshair,
    RotateCcw,
    Sparkles,
    ShieldAlert,
    AlertTriangle,
    CheckCircle2
  } from '@lucide/svelte';

  export let sites: any[] = [];
  export let activeSiteId: string | null = null;
  export let onSelectSite: (site: any) => void;

  let mapContainer: HTMLElement;
  let map: any = null;
  let L: any = null;
  let currentLayer: any = null;
  let markersLayer: any = null;
  let resizeObserver: ResizeObserver | null = null;
  let isFullscreen = false;
  let selectedTile: 'positron' | 'osm' | 'voyager' = 'positron';
  let showLayerMenu = false;

  const tileProviders = {
    positron: {
      name: 'Clean Light (Carto)',
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    },
    osm: {
      name: 'OpenStreetMap (Standard)',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: 'abc',
      maxZoom: 19
    },
    voyager: {
      name: 'Voyager Detailed',
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }
  };

  // Quick stats
  $: criticalCount = sites.filter(s => s.riskLevel === 'Critical').length;
  $: highCount = sites.filter(s => s.riskLevel === 'High').length;
  $: mediumCount = sites.filter(s => s.riskLevel === 'Medium').length;
  $: lowCount = sites.filter(s => s.riskLevel === 'Low').length;
  $: countryCount = new Set(sites.map(s => s.countryCode || s.country)).size;

  onMount(async () => {
    try {
      // Dynamic import ensures browser-only execution
      const leafletModule = await import('leaflet');
      L = leafletModule.default || leafletModule;

      if (!mapContainer) return;

      // Initialize real interactive world map
      map = L.map(mapContainer, {
        center: [30, 10],
        zoom: 2,
        minZoom: 1.5,
        maxZoom: 18,
        zoomControl: false, // Using styled custom zoom controls
        attributionControl: false
      });

      // Add attribution control in bottom right
      L.control.attribution({ position: 'bottomright', prefix: false })
        .addAttribution('&copy; <a href="https://openstreetmap.org" class="text-blue-600 hover:underline" target="_blank">OSM</a> | <a href="https://carto.com" class="text-blue-600 hover:underline" target="_blank">CARTO</a>')
        .addTo(map);

      // Set initial tile layer
      applyTileLayer(selectedTile);

      // Initialize markers layer group
      markersLayer = L.layerGroup().addTo(map);

      // Render markers
      renderMarkers();

      // Fit all markers in view
      if (sites.length > 0) {
        fitAllSites(false);
      }

      // Auto-invalidate size on container resizing (e.g. drawer toggle, layout change)
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          if (map) {
            map.invalidateSize();
          }
        });
        resizeObserver.observe(mapContainer);
      }

      // Ensure crisp render after initial DOM paint
      setTimeout(() => {
        if (map) map.invalidateSize();
      }, 250);

    } catch (err) {
      console.error('Failed to initialize Leaflet real map:', err);
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

  function applyTileLayer(providerKey: 'positron' | 'osm' | 'voyager') {
    if (!map || !L) return;
    if (currentLayer) {
      map.removeLayer(currentLayer);
    }

    const conf = tileProviders[providerKey];
    currentLayer = L.tileLayer(conf.url, {
      attribution: conf.attribution,
      subdomains: conf.subdomains,
      maxZoom: conf.maxZoom
    }).addTo(map);

    selectedTile = providerKey;
    showLayerMenu = false;
  }

  function getRiskColors(riskLevel: string) {
    switch (riskLevel) {
      case 'Critical':
        return { bg: '#e11d48', ring: '#f43f5e', text: '#ffffff', badgeBg: 'bg-rose-600' };
      case 'High':
        return { bg: '#d97706', ring: '#f59e0b', text: '#ffffff', badgeBg: 'bg-amber-600' };
      case 'Medium':
        return { bg: '#ea580c', ring: '#fb923c', text: '#ffffff', badgeBg: 'bg-orange-500' };
      default:
        return { bg: '#059669', ring: '#10b981', text: '#ffffff', badgeBg: 'bg-emerald-600' };
    }
  }

  function createMarkerIcon(site: any) {
    if (!L) return null;
    const colors = getRiskColors(site.riskLevel);
    const isCritical = site.riskLevel === 'Critical';
    const isSelected = activeSiteId === site.id;

    const html = `
      <div class="site-marker-container ${isCritical ? 'is-critical' : ''} ${isSelected ? 'is-selected' : ''}">
        ${isCritical ? `<div class="pulse-ring" style="border-color: ${colors.ring};"></div>` : ''}
        <div class="marker-core shadow-md transition-transform" style="background-color: ${colors.bg}; color: ${colors.text};">
          <span class="marker-label">${site.id}</span>
        </div>
        ${isSelected ? '<div class="marker-active-ring"></div>' : ''}
      </div>
    `;

    return L.divIcon({
      html,
      className: 'custom-real-map-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -18]
    });
  }

  function createPopupContent(site: any) {
    const isCritical = site.riskLevel === 'Critical';
    const riskBadgeClass = isCritical
      ? 'bg-rose-100 text-rose-800 border-rose-300'
      : site.riskLevel === 'High'
      ? 'bg-amber-100 text-amber-800 border-amber-300'
      : site.riskLevel === 'Medium'
      ? 'bg-orange-100 text-orange-800 border-orange-300'
      : 'bg-emerald-100 text-emerald-800 border-emerald-300';

    const delayColor = isCritical ? 'text-rose-600' : site.riskLevel === 'High' ? 'text-amber-600' : 'text-slate-900';

    return `
      <div class="p-3 text-slate-800 font-sans" style="min-width: 230px; max-width: 270px;">
        <div class="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
          <div class="flex items-center space-x-1.5">
            <span class="w-2.5 h-2.5 rounded-full ${site.riskLevel === 'Critical' ? 'bg-rose-600 animate-ping' : site.riskLevel === 'High' ? 'bg-amber-500' : site.riskLevel === 'Medium' ? 'bg-orange-400' : 'bg-emerald-500'}"></span>
            <strong class="text-sm font-bold text-slate-900">Site ${site.id}</strong>
          </div>
          <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${riskBadgeClass}">
            ${site.riskLevel}
          </span>
        </div>

        <div class="text-xs font-semibold text-slate-900 truncate mb-0.5">${site.name}</div>
        <div class="text-[11px] text-slate-500 mb-3">${site.city}, ${site.country}</div>

        <div class="grid grid-cols-3 gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-200/80 mb-3 text-center">
          <div>
            <span class="text-[9px] uppercase font-bold text-slate-400 block">DBL Delay</span>
            <strong class="text-xs font-extrabold ${delayColor} font-mono">${site.forecastImpactDays || site.maxDelayDays + 'd'}</strong>
          </div>
          <div>
            <span class="text-[9px] uppercase font-bold text-slate-400 block">Open Items</span>
            <strong class="text-xs font-extrabold text-slate-800">${site.openItems}</strong>
          </div>
          <div>
            <span class="text-[9px] uppercase font-bold text-slate-400 block">Risk Prob</span>
            <strong class="text-xs font-extrabold ${site.riskProbability >= 70 ? 'text-rose-600' : 'text-slate-800'}">${site.riskProbability}%</strong>
          </div>
        </div>

        <div class="text-[11px] text-slate-600 mb-3">
          <span class="font-bold text-slate-700">Key Driver:</span> ${site.keyRiskDrivers || 'Ageing queries'}
        </div>

        <button
          type="button"
          class="popup-inspect-btn w-full py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center space-x-1 cursor-pointer transition-all shadow-xs"
          data-site-id="${site.id}"
        >
          <span>Inspect Site &amp; Risks</span>
          <span>&rarr;</span>
        </button>
      </div>
    `;
  }

  function renderMarkers() {
    if (!map || !L || !markersLayer) return;

    markersLayer.clearLayers();

    sites.forEach(site => {
      if (typeof site.lat !== 'number' || typeof site.lng !== 'number') return;

      const icon = createMarkerIcon(site);
      if (!icon) return;

      const marker = L.marker([site.lat, site.lng], { icon });

      // Clean tooltip on hover
      marker.bindTooltip(`Site ${site.id} · ${site.city} (${site.forecastImpactDays} delay)`, {
        direction: 'top',
        offset: [0, -10],
        className: 'real-map-tooltip'
      });

      // Interactive popup
      marker.bindPopup(createPopupContent(site), {
        maxWidth: 300,
        className: 'real-map-popup-window'
      });

      // Click handler
      marker.on('click', () => {
        onSelectSite(site);
      });

      marker.addTo(markersLayer);
    });

    // Wire popup button click delegation
    map.on('popupopen', (e: any) => {
      const popupEl = e.popup.getElement();
      if (!popupEl) return;
      const btn = popupEl.querySelector('.popup-inspect-btn');
      if (btn) {
        btn.addEventListener('click', (ev: MouseEvent) => {
          ev.preventDefault();
          ev.stopPropagation();
          const siteId = btn.getAttribute('data-site-id');
          const siteObj = sites.find(s => s.id === siteId);
          if (siteObj) {
            onSelectSite(siteObj);
            map.closePopup();
          }
        });
      }
    });
  }

  // Reactive updates when sites prop changes (e.g. filter/search)
  $: if (map && L && sites) {
    renderMarkers();
  }

  // Fit all sites within bounds
  export function fitAllSites(animate = true) {
    if (!map || !L || sites.length === 0) return;
    const validCoords = sites
      .filter(s => typeof s.lat === 'number' && typeof s.lng === 'number')
      .map(s => [s.lat, s.lng] as [number, number]);

    if (validCoords.length === 0) return;

    const bounds = L.latLngBounds(validCoords);
    map.fitBounds(bounds, {
      padding: [45, 45],
      maxZoom: 6,
      animate
    });
  }

  // Focus on Critical and High risk sites (e.g. Boston, Berlin, Seoul, Houston)
  export function focusCriticalSites() {
    if (!map || !L) return;
    const criticalSites = sites.filter(s => s.riskLevel === 'Critical' || s.riskLevel === 'High');
    const coords = (criticalSites.length > 0 ? criticalSites : sites)
      .filter(s => typeof s.lat === 'number' && typeof s.lng === 'number')
      .map(s => [s.lat, s.lng] as [number, number]);

    if (coords.length === 0) return;

    const bounds = L.latLngBounds(coords);
    map.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 5,
      animate: true
    });
  }

  export function panToSite(siteId: string) {
    if (!map || !L) return;
    const s = sites.find(x => x.id === siteId);
    if (s && typeof s.lat === 'number' && typeof s.lng === 'number') {
      map.flyTo([s.lat, s.lng], 7, { duration: 1.2 });
    }
  }

  function handleZoomIn() {
    if (map) map.zoomIn();
  }

  function handleZoomOut() {
    if (map) map.zoomOut();
  }

  function toggleFullscreen() {
    isFullscreen = !isFullscreen;
    tick().then(() => {
      if (map) {
        setTimeout(() => map.invalidateSize(), 150);
      }
    });
  }
</script>

<div
  class="relative w-full rounded-xl overflow-hidden border border-slate-200/90 shadow-xs bg-slate-100 flex flex-col transition-all {isFullscreen ? 'fixed inset-4 z-50 h-[calc(100vh-2rem)] shadow-2xl' : 'h-[380px] sm:h-[420px]'}"
>
  <!-- Floating Top Bar Overlay -->
  <div class="absolute top-3 left-3 right-3 z-[400] flex items-center justify-between pointer-events-none gap-2">
    
    <!-- Top-Left: Live Map Badge -->
    <div class="pointer-events-auto flex items-center space-x-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs text-xs text-slate-700">
      <div class="flex items-center space-x-1.5 font-bold text-slate-900">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>Real Geographic Map</span>
      </div>
      <span class="text-slate-300">|</span>
      <span class="text-[11px] text-slate-600 font-medium">
        <strong>{sites.length}</strong> sites across <strong>{countryCount}</strong> countries
      </span>
    </div>

    <!-- Top-Right: Map Action Toolbar -->
    <div class="pointer-events-auto flex items-center space-x-1.5 bg-white/95 backdrop-blur-md p-1 rounded-lg border border-slate-200 shadow-xs">
      
      <!-- Fit All Sites -->
      <button
        type="button"
        on:click={() => fitAllSites(true)}
        class="px-2 py-1 text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-slate-100 rounded flex items-center space-x-1 transition-colors"
        title="Fit all sites worldwide into view"
      >
        <RotateCcw size={13} />
        <span class="hidden sm:inline">Fit All</span>
      </button>

      <!-- Focus Critical Sites -->
      <button
        type="button"
        on:click={focusCriticalSites}
        class="px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded flex items-center space-x-1 transition-colors"
        title="Focus directly on Critical & High risk sites"
      >
        <Crosshair size={13} />
        <span class="hidden sm:inline">Focus Critical</span>
      </button>

      <span class="text-slate-200">|</span>

      <!-- Layer Switcher Dropdown -->
      <div class="relative">
        <button
          type="button"
          on:click={() => showLayerMenu = !showLayerMenu}
          class="px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded flex items-center space-x-1 transition-colors {showLayerMenu ? 'bg-slate-100 text-blue-700' : ''}"
          title="Change map style / tile layer"
        >
          <Layers size={13} />
          <span class="hidden md:inline">Layers</span>
        </button>

        {#if showLayerMenu}
          <div class="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 text-xs">
            <div class="px-3 py-1 font-bold text-slate-400 text-[10px] uppercase tracking-wider">
              Map Style
            </div>
            <button
              type="button"
              on:click={() => applyTileLayer('positron')}
              class="w-full text-left px-3 py-1.5 hover:bg-blue-50 font-medium flex items-center justify-between {selectedTile === 'positron' ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-700'}"
            >
              <span>Clean Light (Carto)</span>
              {#if selectedTile === 'positron'}&#10003;{/if}
            </button>
            <button
              type="button"
              on:click={() => applyTileLayer('osm')}
              class="w-full text-left px-3 py-1.5 hover:bg-blue-50 font-medium flex items-center justify-between {selectedTile === 'osm' ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-700'}"
            >
              <span>OpenStreetMap</span>
              {#if selectedTile === 'osm'}&#10003;{/if}
            </button>
            <button
              type="button"
              on:click={() => applyTileLayer('voyager')}
              class="w-full text-left px-3 py-1.5 hover:bg-blue-50 font-medium flex items-center justify-between {selectedTile === 'voyager' ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-700'}"
            >
              <span>Voyager Detailed</span>
              {#if selectedTile === 'voyager'}&#10003;{/if}
            </button>
          </div>
        {/if}
      </div>

      <span class="text-slate-200">|</span>

      <!-- Fullscreen Toggle -->
      <button
        type="button"
        on:click={toggleFullscreen}
        class="p-1 text-slate-700 hover:text-blue-700 hover:bg-slate-100 rounded transition-colors"
        title={isFullscreen ? 'Exit full screen' : 'Expand map full screen'}
      >
        {#if isFullscreen}
          <Minimize2 size={14} />
        {:else}
          <Maximize2 size={14} />
        {/if}
      </button>

    </div>

  </div>

  <!-- Real Leaflet Map Container -->
  <div
    bind:this={mapContainer}
    class="w-full h-full z-0 cursor-grab active:cursor-grabbing bg-slate-100"
  ></div>

  <!-- Bottom-Left Floating Legend -->
  <div class="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-200 shadow-xs text-[11px] pointer-events-auto flex items-center space-x-3">
    <span class="font-bold text-slate-800">Risk Level:</span>
    <div class="flex items-center space-x-1">
      <span class="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
      <span class="text-slate-700 font-medium">Critical ({criticalCount})</span>
    </div>
    <div class="flex items-center space-x-1">
      <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
      <span class="text-slate-700 font-medium">High ({highCount})</span>
    </div>
    <div class="flex items-center space-x-1">
      <span class="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
      <span class="text-slate-700 font-medium">Med ({mediumCount})</span>
    </div>
    <div class="flex items-center space-x-1">
      <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
      <span class="text-slate-700 font-medium">Low ({lowCount})</span>
    </div>
  </div>

  <!-- Bottom-Right Floating Zoom Buttons -->
  <div class="absolute bottom-3 right-3 z-[400] flex flex-col bg-white/95 backdrop-blur-md rounded-lg border border-slate-200 shadow-xs overflow-hidden pointer-events-auto">
    <button
      type="button"
      on:click={handleZoomIn}
      class="p-2 text-slate-700 hover:text-blue-700 hover:bg-slate-100 border-b border-slate-200 transition-colors"
      title="Zoom in"
    >
      <ZoomIn size={14} />
    </button>
    <button
      type="button"
      on:click={handleZoomOut}
      class="p-2 text-slate-700 hover:text-blue-700 hover:bg-slate-100 transition-colors"
      title="Zoom out"
    >
      <ZoomOut size={14} />
    </button>
  </div>

</div>

<style>
  :global(.custom-real-map-marker) {
    background: transparent;
    border: none;
  }

  :global(.site-marker-container) {
    position: relative;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  :global(.marker-core) {
    width: 26px;
    height: 26px;
    border-radius: 9999px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 800;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
    transition: transform 0.15s ease-out;
  }

  :global(.site-marker-container:hover .marker-core) {
    transform: scale(1.22);
  }

  :global(.pulse-ring) {
    position: absolute;
    top: -4px;
    left: -4px;
    width: 40px;
    height: 40px;
    border-radius: 9999px;
    border-width: 2.5px;
    border-style: solid;
    animation: marker-ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
    pointer-events: none;
  }

  @keyframes marker-ping {
    0% {
      transform: scale(0.65);
      opacity: 0.9;
    }
    80%, 100% {
      transform: scale(1.6);
      opacity: 0;
    }
  }

  :global(.real-map-tooltip) {
    background-color: #0f172a !important;
    color: #ffffff !important;
    border: none !important;
    border-radius: 6px !important;
    padding: 4px 8px !important;
    font-size: 11px !important;
    font-weight: 600 !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25) !important;
  }

  :global(.real-map-tooltip::before) {
    border-top-color: #0f172a !important;
  }

  :global(.real-map-popup-window .leaflet-popup-content-wrapper) {
    padding: 0 !important;
    border-radius: 12px !important;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
    border: 1px solid #e2e8f0 !important;
  }

  :global(.real-map-popup-window .leaflet-popup-content) {
    margin: 0 !important;
    line-height: normal !important;
  }

  :global(.real-map-popup-window .leaflet-popup-tip) {
    background: #ffffff !important;
    border: 1px solid #e2e8f0 !important;
    box-shadow: none !important;
  }
</style>
