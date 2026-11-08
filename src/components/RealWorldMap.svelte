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
    Globe
  } from '@lucide/svelte';

  export let sites: any[] = [];
  export let activeSiteId: string | null = null;
  export let onSelectSite: (site: any) => void;

  let mapContainer: HTMLElement;
  let map: any = null;
  let L: any = null;
  let currentTileLayer: any = null;
  let clusterGroup: any = null;
  let resizeObserver: ResizeObserver | null = null;
  let isFullscreen = false;
  let selectedTile: 'osm' | 'esriLight' | 'esriStreet' = 'osm';
  let showLayerMenu = false;

  // 100% Free, NO API Key required tile providers with zero watermarks
  const tileProviders = {
    osm: {
      name: 'OpenStreetMap (Standard)',
      type: 'single',
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" class="hover:underline">OpenStreetMap</a> contributors',
      maxZoom: 19
    },
    esriLight: {
      name: 'Clean Light Gray (Esri)',
      type: 'composite',
      baseUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      refUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; <a href="https://www.esri.com/" target="_blank" class="hover:underline">Esri</a>',
      maxZoom: 16
    },
    esriStreet: {
      name: 'World Street Map (Esri)',
      type: 'single',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; <a href="https://www.esri.com/" target="_blank" class="hover:underline">Esri</a>',
      maxZoom: 18
    }
  };

  // Dynamic metrics
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
      (window as any).L = L;

      // Import markercluster plugin
      await import('leaflet.markercluster');

      if (!mapContainer) return;

      // Initialize Leaflet map
      map = L.map(mapContainer, {
        center: [32, 10],
        zoom: 2.2,
        minZoom: 1.5,
        maxZoom: 18,
        zoomControl: false,
        attributionControl: true
      });

      // Clean single attribution prefix
      if (map.attributionControl) {
        map.attributionControl.setPrefix(false);
      }

      // Apply initial tile layer (OpenStreetMap - 100% free, zero watermark)
      applyTileLayer(selectedTile);

      // Create marker cluster group
      createClusterGroup();

      // Render markers
      renderMarkers();

      // Fit bounds to show all active sites nicely
      if (sites.length > 0) {
        fitAllSites(false);
      }

      // Responsive resize observer
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          if (map) {
            map.invalidateSize();
          }
        });
        resizeObserver.observe(mapContainer);
      }

      // Invalidate size once DOM stabilizes
      setTimeout(() => {
        if (map) map.invalidateSize();
      }, 200);

    } catch (err) {
      console.error('Failed to initialize RealWorldMap:', err);
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

  function applyTileLayer(providerKey: 'osm' | 'esriLight' | 'esriStreet') {
    if (!map || !L) return;

    if (currentTileLayer) {
      map.removeLayer(currentTileLayer);
      currentTileLayer = null;
    }

    const conf = tileProviders[providerKey];

    if (conf.type === 'composite') {
      // Base canvas + Labels reference overlay
      const base = L.tileLayer(conf.baseUrl, {
        attribution: conf.attribution,
        maxZoom: conf.maxZoom
      });
      const ref = L.tileLayer(conf.refUrl, {
        maxZoom: conf.maxZoom
      });
      currentTileLayer = L.layerGroup([base, ref]).addTo(map);
    } else {
      currentTileLayer = L.tileLayer(conf.url, {
        attribution: conf.attribution,
        maxZoom: conf.maxZoom
      }).addTo(map);
    }

    selectedTile = providerKey;
    showLayerMenu = false;
  }

  function getRiskColors(riskLevel: string) {
    switch (riskLevel) {
      case 'Critical':
        return { bg: '#e11d48', ring: '#f43f5e', text: '#ffffff' };
      case 'High':
        return { bg: '#d97706', ring: '#f59e0b', text: '#ffffff' };
      case 'Medium':
        return { bg: '#ea580c', ring: '#fb923c', text: '#ffffff' };
      default:
        return { bg: '#059669', ring: '#10b981', text: '#ffffff' };
    }
  }

  function createClusterGroup() {
    if (!map || !L) return;

    clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 40,
      spiderfyOnMaxZoom: true,
      zoomToBoundsOnClick: true,
      showCoverageOnHover: false,
      iconCreateFunction: (cluster: any) => {
        const markers = cluster.getAllChildMarkers();
        const count = markers.length;

        let hasCritical = false;
        let hasHigh = false;
        let hasMedium = false;

        for (const m of markers) {
          const r = m.options?.siteData?.riskLevel;
          if (r === 'Critical') hasCritical = true;
          else if (r === 'High') hasHigh = true;
          else if (r === 'Medium') hasMedium = true;
        }

        const color = hasCritical ? '#e11d48' : hasHigh ? '#d97706' : hasMedium ? '#ea580c' : '#059669';
        const ring = hasCritical ? '#f43f5e' : hasHigh ? '#f59e0b' : hasMedium ? '#fb923c' : '#10b981';

        return L.divIcon({
          html: `
            <div class="custom-cluster-marker ${hasCritical ? 'is-critical-cluster' : ''}" style="background-color: ${color};">
              ${hasCritical ? `<div class="cluster-pulse-ring" style="border-color: ${ring};"></div>` : ''}
              <span class="cluster-count">${count}</span>
            </div>
          `,
          className: 'custom-cluster-wrapper',
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });
      }
    });

    map.addLayer(clusterGroup);
  }

  function createMarkerIcon(site: any) {
    if (!L) return null;
    const colors = getRiskColors(site.riskLevel);
    const isCritical = site.riskLevel === 'Critical';
    const isSelected = activeSiteId === site.id;

    const html = `
      <div class="site-marker-container ${isCritical ? 'is-critical' : ''} ${isSelected ? 'is-selected' : ''}">
        ${isCritical ? `<div class="pulse-ring" style="border-color: ${colors.ring};"></div>` : ''}
        <div class="marker-core shadow-md" style="background-color: ${colors.bg}; color: ${colors.text};">
          <span class="marker-label">${site.id}</span>
        </div>
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
    if (!map || !L || !clusterGroup) return;

    clusterGroup.clearLayers();

    sites.forEach(site => {
      if (typeof site.lat !== 'number' || typeof site.lng !== 'number') return;

      const icon = createMarkerIcon(site);
      if (!icon) return;

      const marker = L.marker([site.lat, site.lng], {
        icon,
        zIndexOffset: site.riskLevel === 'Critical' ? 1000 : site.riskLevel === 'High' ? 500 : 0,
        siteData: site
      });

      marker.bindTooltip(`Site ${site.id} · ${site.city} (${site.forecastImpactDays} delay)`, {
        direction: 'top',
        offset: [0, -10],
        className: 'real-map-tooltip'
      });

      marker.bindPopup(createPopupContent(site), {
        maxWidth: 300,
        className: 'real-map-popup-window'
      });

      marker.on('click', () => {
        onSelectSite(site);
      });

      clusterGroup.addLayer(marker);
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

  $: if (map && L && clusterGroup && sites) {
    renderMarkers();
  }

  export function fitAllSites(animate = true) {
    if (!map || !L || sites.length === 0) return;
    const validCoords = sites
      .filter(s => typeof s.lat === 'number' && typeof s.lng === 'number')
      .map(s => [s.lat, s.lng] as [number, number]);

    if (validCoords.length === 0) return;

    const bounds = L.latLngBounds(validCoords);
    map.fitBounds(bounds, {
      padding: [45, 45],
      maxZoom: 5,
      animate
    });
  }

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

  export function focusRegion(region: 'na' | 'eu' | 'apac') {
    if (!map) return;
    if (region === 'na') {
      map.flyTo([39.8, -98.5], 4, { duration: 1 });
    } else if (region === 'eu') {
      map.flyTo([48.8, 10.0], 4.5, { duration: 1 });
    } else {
      map.flyTo([10.0, 130.0], 3.5, { duration: 1 });
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
  class="relative w-full rounded-xl overflow-hidden border border-slate-200/90 shadow-xs bg-slate-50 flex flex-col transition-all {isFullscreen ? 'fixed inset-4 z-50 h-[calc(100vh-2rem)] shadow-2xl' : 'h-[390px] sm:h-[430px]'}"
>
  <!-- Floating Top Bar Overlay -->
  <div class="absolute top-3 left-3 right-3 z-[400] flex items-center justify-between pointer-events-none gap-2">
    
    <!-- Top-Left: Live Map Badge & Region Shortcuts -->
    <div class="pointer-events-auto flex items-center space-x-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs text-xs text-slate-700">
      <div class="flex items-center space-x-1.5 font-bold text-slate-900">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>Real Geographic Map</span>
      </div>
      <span class="text-slate-300">|</span>
      <span class="text-[11px] text-slate-600 font-medium hidden sm:inline">
        <strong>{sites.length}</strong> sites &middot; <strong>{countryCount}</strong> countries
      </span>

      <!-- Region quick jumps -->
      <div class="hidden md:flex items-center space-x-1 pl-1 border-l border-slate-200 text-[10px] font-semibold text-slate-600">
        <button
          type="button"
          on:click={() => focusRegion('na')}
          class="px-1.5 py-0.5 rounded hover:bg-slate-100 hover:text-blue-700 cursor-pointer transition-colors"
        >
          US / CA
        </button>
        <button
          type="button"
          on:click={() => focusRegion('eu')}
          class="px-1.5 py-0.5 rounded hover:bg-slate-100 hover:text-blue-700 cursor-pointer transition-colors"
        >
          Europe
        </button>
        <button
          type="button"
          on:click={() => focusRegion('apac')}
          class="px-1.5 py-0.5 rounded hover:bg-slate-100 hover:text-blue-700 cursor-pointer transition-colors"
        >
          APAC
        </button>
      </div>
    </div>

    <!-- Top-Right: Map Action Toolbar -->
    <div class="pointer-events-auto flex items-center space-x-1.5 bg-white/95 backdrop-blur-md p-1 rounded-lg border border-slate-200 shadow-xs">
      
      <!-- Fit All Sites -->
      <button
        type="button"
        on:click={() => fitAllSites(true)}
        class="px-2 py-1 text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-slate-100 rounded flex items-center space-x-1 transition-colors cursor-pointer"
        title="Fit all sites worldwide into view"
      >
        <RotateCcw size={13} />
        <span class="hidden sm:inline">Fit All</span>
      </button>

      <!-- Focus Critical Sites -->
      <button
        type="button"
        on:click={focusCriticalSites}
        class="px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded flex items-center space-x-1 transition-colors cursor-pointer"
        title="Focus directly on Critical & High risk sites"
      >
        <Crosshair size={13} />
        <span class="hidden sm:inline">Focus Critical</span>
      </button>

      <span class="text-slate-200">|</span>

      <!-- Free Layer Switcher Dropdown (No API Key Required) -->
      <div class="relative">
        <button
          type="button"
          on:click={() => showLayerMenu = !showLayerMenu}
          class="px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded flex items-center space-x-1 transition-colors cursor-pointer {showLayerMenu ? 'bg-slate-100 text-blue-700' : ''}"
          title="Change map style (all free, zero API key)"
        >
          <Layers size={13} />
          <span class="hidden md:inline">Layers</span>
        </button>

        {#if showLayerMenu}
          <div class="absolute right-0 mt-1 w-52 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 text-xs">
            <div class="px-3 py-1 font-bold text-slate-400 text-[10px] uppercase tracking-wider">
              Basemap Style (Free &amp; Verified)
            </div>
            <button
              type="button"
              on:click={() => applyTileLayer('osm')}
              class="w-full text-left px-3 py-1.5 hover:bg-blue-50 font-medium flex items-center justify-between {selectedTile === 'osm' ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-700'}"
            >
              <span>OpenStreetMap (Standard)</span>
              {#if selectedTile === 'osm'}&#10003;{/if}
            </button>
            <button
              type="button"
              on:click={() => applyTileLayer('esriLight')}
              class="w-full text-left px-3 py-1.5 hover:bg-blue-50 font-medium flex items-center justify-between {selectedTile === 'esriLight' ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-700'}"
            >
              <span>Clean Light Gray (Esri)</span>
              {#if selectedTile === 'esriLight'}&#10003;{/if}
            </button>
            <button
              type="button"
              on:click={() => applyTileLayer('esriStreet')}
              class="w-full text-left px-3 py-1.5 hover:bg-blue-50 font-medium flex items-center justify-between {selectedTile === 'esriStreet' ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-700'}"
            >
              <span>World Street Map (Esri)</span>
              {#if selectedTile === 'esriStreet'}&#10003;{/if}
            </button>
          </div>
        {/if}
      </div>

      <span class="text-slate-200">|</span>

      <!-- Fullscreen Toggle -->
      <button
        type="button"
        on:click={toggleFullscreen}
        class="p-1 text-slate-700 hover:text-blue-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
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
      class="p-2 text-slate-700 hover:text-blue-700 hover:bg-slate-100 border-b border-slate-200 transition-colors cursor-pointer"
      title="Zoom in"
    >
      <ZoomIn size={14} />
    </button>
    <button
      type="button"
      on:click={handleZoomOut}
      class="p-2 text-slate-700 hover:text-blue-700 hover:bg-slate-100 transition-colors cursor-pointer"
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
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    transition: transform 0.15s ease-out;
  }

  :global(.site-marker-container:hover .marker-core) {
    transform: scale(1.25);
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

  /* Custom MarkerCluster styling */
  :global(.custom-cluster-wrapper) {
    background: transparent;
    border: none;
  }

  :global(.custom-cluster-marker) {
    position: relative;
    width: 36px;
    height: 36px;
    border-radius: 9999px;
    border: 2.5px solid #ffffff;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-weight: 800;
    font-size: 13px;
    cursor: pointer;
    transition: transform 0.15s ease-out;
  }

  :global(.custom-cluster-marker:hover) {
    transform: scale(1.2);
  }

  :global(.cluster-pulse-ring) {
    position: absolute;
    top: -5px;
    left: -5px;
    width: 46px;
    height: 46px;
    border-radius: 9999px;
    border-width: 2.5px;
    border-style: solid;
    animation: marker-ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
    pointer-events: none;
  }

  @keyframes marker-ping {
    0% {
      transform: scale(0.65);
      opacity: 0.95;
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
