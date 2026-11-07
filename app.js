const countries = {
  russia: {
    short: 'Россия', formal: 'Российская Федерация', flag: 'flag-ru', population: '146 млн', inflation: 7.8, gdp: 2.2, budget: 1.4, unemployment: 3.2,
    trust: { people: 64, elites: 52, government: 66, security: 62 }, rate: 16, baseGrowth: 1.4,
    population_millions: 146, monthly_gdp_lcu: 13500, currency: 'млрд ₽', debt_to_gdp_pct: 20, average_coupon_pct: 8.5, loan_spread_pct: 4.5, deposit_spread_pct: 1.5, event_seed: 1701,
    new_debt_term_premium_pct: 1.2, rate_price_impact_pct: 0.6, vat_cpi_pass_through: 0.55, fx_to_import_pass_through: 0.42, fiscal_multiplier_pct: 0.3, tax_demand_multiplier: 0.48, other_revenue_pct: 2.5,
    taxRates: { vat_main_pct: 20, vat_reduced_pct: 10, vat_reduced_share_pct: 22, vat_exempt_share_pct: 8, vat_taxable_share: 0.45, pit_pct: 13, payroll_pct: 30, corporate_pct: 20, resource_pct: 12 },
    capital: [55.7558, 37.6173], capitalName: 'МОСКВА', boundaryNames: ['Russia', 'Russian Federation']
  },
  germany: {
    short: 'Германия', formal: 'Федеративная Республика Германия', flag: 'flag-de', population: '84 млн', inflation: 2.4, gdp: 4.5, budget: -1.8, unemployment: 3.0,
    trust: { people: 58, elites: 61, government: 55, security: 57 }, rate: 3.5, baseGrowth: 0.8,
    population_millions: 84, monthly_gdp_lcu: 355, currency: 'млрд €', debt_to_gdp_pct: 65, average_coupon_pct: 2.6, loan_spread_pct: 2.8, deposit_spread_pct: 0.8, event_seed: 2843,
    new_debt_term_premium_pct: 0.6, rate_price_impact_pct: 0.5, vat_cpi_pass_through: 0.62, fx_to_import_pass_through: 0.3, fiscal_multiplier_pct: 0.34, tax_demand_multiplier: 0.4, other_revenue_pct: 2.2,
    taxRates: { vat_main_pct: 19, vat_reduced_pct: 7, vat_reduced_share_pct: 25, vat_exempt_share_pct: 8, vat_taxable_share: 0.45, pit_pct: 30, payroll_pct: 20, corporate_pct: 30, resource_pct: 2 },
    capital: [52.52, 13.405], capitalName: 'БЕРЛИН', boundaryNames: ['Germany', 'Federal Republic of Germany']
  },
  brazil: {
    short: 'Бразилия', formal: 'Федеративная Республика Бразилия', flag: 'flag-br', population: '203 млн', inflation: 4.6, gdp: 2.2, budget: -2.5, unemployment: 7.9,
    trust: { people: 55, elites: 48, government: 51, security: 57 }, rate: 10.75, baseGrowth: 2.1,
    population_millions: 203, monthly_gdp_lcu: 1120, currency: 'млрд R$', debt_to_gdp_pct: 75, average_coupon_pct: 10, loan_spread_pct: 6.5, deposit_spread_pct: 2.5, event_seed: 3929,
    new_debt_term_premium_pct: 2, rate_price_impact_pct: 0.7, vat_cpi_pass_through: 0.5, fx_to_import_pass_through: 0.58, fiscal_multiplier_pct: 0.32, tax_demand_multiplier: 0.5, other_revenue_pct: 2.4,
    taxRates: { vat_main_pct: 17, vat_reduced_pct: 8, vat_reduced_share_pct: 25, vat_exempt_share_pct: 10, vat_taxable_share: 0.45, pit_pct: 15, payroll_pct: 28, corporate_pct: 34, resource_pct: 8 },
    capital: [-15.7939, -47.8828], capitalName: 'БРАЗИЛИА', boundaryNames: ['Brazil', 'Federative Republic of Brazil']
  }
};

const OPENFREEMAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';
const COUNTRY_SHAPES_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson';
const COUNTRY_FILL_LAYER_ID = 'mandate-country-fill';
const COUNTRY_OUTLINE_LAYER_ID = 'mandate-country-highlight';
const COASTLINE_LAYER_ID = 'mandate-coastlines';
const monthNames = ['ЯНВАРЬ','ФЕВРАЛЬ','МАРТ','АПРЕЛЬ','МАЙ','ИЮНЬ','ИЮЛЬ','АВГУСТ','СЕНТЯБРЬ','ОКТЯБРЬ','НОЯБРЬ','ДЕКАБРЬ'];
const GAME_TICK_MS = 6 * 60 * 60 * 1000;
const CAMPAIGN_STORAGE_PREFIX = 'mandate.campaign.v1.';
const SELECTED_COUNTRY_STORAGE_KEY = 'mandate.selectedCountry';
const SPEED_TICK_INTERVAL_MS = { 1: 2000, 2: 1000, 3: 500, 4: 200, 5: 0 };
const SPEED_BADGES = { 1: '2с / 6ч', 2: '1с / 6ч', 3: '0,5с / 6ч', 4: '0,2с / 6ч', 5: 'МАКС.' };
const SPEED_DESCRIPTIONS = {
  1: 'около 2 секунд на 6 игровых часов',
  2: 'около 1 секунды на 6 игровых часов',
  3: 'около 0,5 секунды на 6 игровых часов',
  4: 'около 0,2 секунды на 6 игровых часов',
  5: 'максимальная скорость, зависит от мощности компьютера'
};
const HISTORY_METRICS = [
  { key: 'real_gdp', label: 'Реальный ВВП', unit: 'индекс', digits: 2, color: 'var(--accent-dark)' },
  { key: 'inflation_yoy_pct', label: 'Инфляция ИПЦ', unit: '% за 12 мес.', digits: 1, color: '#ad6845' },
  { key: 'unemployment_pct', label: 'Безработица', unit: '%', digits: 1, color: '#738b83' },
  { key: 'budget_balance_pct_gdp', label: 'Баланс бюджета', unit: '% ВВП за 12 мес.', digits: 1, color: '#8e7357' },
  { key: 'debt_to_gdp_pct', label: 'Госдолг / ВВП', unit: '%', digits: 1, color: '#a55748' },
  { key: 'tax_burden_pct', label: 'Налоговая нагрузка', unit: '% ВВП за 12 мес.', digits: 1, color: '#657987' },
  { key: 'policy_rate_pct', label: 'Ставка ЦБ', unit: '% годовых', digits: 2, color: '#846e91' }
];
const byId = (id) => document.getElementById(id);
const format = (value, digits = 1) => Number(value).toFixed(digits).replace('.', ',');
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

let selectedCountry = 'russia';
let currentCountry = 'russia';
let state = null;
let currentGameDate = new Date(Date.UTC(2026, 0, 1));
let selectedSpeed = 3;
let toastTimeout;
let simulationTimer = null;
let isPlaying = false;
let worldMap = null;
let capitalMarker = null;
let mapReady = false;
let draftPolicy = null;
let selectedHistoryGranularity = 'month';
const selectedHistoryRanges = { month: 24, day: 90 };
let storageWarningShown = false;
let campaignSaveTimer = null;

function makeState(key) {
  const country = countries[key];
  return EconomyModel.createEconomyState(country);
}

function campaignStorageKey(key) {
  return CAMPAIGN_STORAGE_PREFIX + key;
}

function loadCampaign(key) {
  if (!countries[key]) return null;
  try {
    const campaign = JSON.parse(localStorage.getItem(campaignStorageKey(key)) || 'null');
    if (!campaign || campaign.version !== 1 || campaign.country !== key || !campaign.state || !campaign.state.policy) return null;
    const date = new Date(campaign.gameDate);
    if (!Number.isFinite(date.getTime())) return null;
    return { ...campaign, gameDate: date.toISOString() };
  } catch (error) {
    return null;
  }
}

function saveCampaign(key = currentCountry) {
  if (!state || !countries[key]) return;
  if (campaignSaveTimer) clearTimeout(campaignSaveTimer);
  campaignSaveTimer = null;
  const campaign = {
    version: 1,
    country: key,
    savedAt: new Date().toISOString(),
    gameDate: currentGameDate.toISOString(),
    selectedSpeed,
    state
  };
  try {
    localStorage.setItem(campaignStorageKey(key), JSON.stringify(campaign));
    storageWarningShown = false;
  } catch (error) {
    if (!storageWarningShown) {
      storageWarningShown = true;
      console.warn('Не удалось сохранить кампанию в браузере.', error);
      if (!byId('gameScreen').classList.contains('hidden')) showToast('НЕ УДАЛОСЬ СОХРАНИТЬ КАМПАНИЮ В БРАУЗЕРЕ');
    }
  }
}

function scheduleCampaignSave() {
  if (campaignSaveTimer) clearTimeout(campaignSaveTimer);
  campaignSaveTimer = setTimeout(() => {
    campaignSaveTimer = null;
    saveCampaign();
  }, 500);
}

function campaignDateLabel(campaign) {
  return new Date(campaign.gameDate).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'
  }).replace('.', '').toLocaleUpperCase('ru-RU');
}

function renderCampaignSelection() {
  Object.keys(countries).forEach((key) => {
    const campaign = loadCampaign(key);
    const badge = byId('campaignBadge-' + key);
    badge.classList.toggle('hidden', !campaign);
    badge.textContent = campaign ? 'СОХРАНЕНО · ' + campaignDateLabel(campaign) : '';
    if (campaign) badge.title = 'Кампания за ' + countries[key].short + ', ' + campaignDateLabel(campaign);
  });

  const campaign = loadCampaign(selectedCountry);
  byId('selectionCaption').textContent = campaign
    ? `ВЫБРАНА ${countries[selectedCountry].short.toLocaleUpperCase('ru-RU')} · ПРОГРЕСС СОХРАНЁН НА ${campaignDateLabel(campaign)}`
    : `ВЫБРАНА ${countries[selectedCountry].short.toLocaleUpperCase('ru-RU')}`;
  byId('startButton').firstChild.nodeValue = campaign ? 'Продолжить кампанию ' : 'Начать управление ';
  byId('newCampaignButton').classList.toggle('hidden', !campaign);
}

function setFlag(el, flagClass) {
  el.className = `flag ${flagClass}`;
  if (flagClass === 'flag-br') el.innerHTML = '<span class="flag-diamond"><i></i></span>';
  else el.innerHTML = '<i></i><i></i><i></i>';
}

function init() {
  try {
    const preferredCountry = localStorage.getItem(SELECTED_COUNTRY_STORAGE_KEY);
    if (countries[preferredCountry]) selectedCountry = preferredCountry;
  } catch (error) {
    // Continue with the default country when browser storage is unavailable.
  }
  selectCountry(selectedCountry);
  renderCampaignSelection();
  document.querySelectorAll('.country-card').forEach((card) => {
    card.addEventListener('click', () => selectCountry(card.dataset.country));
  });
  byId('startButton').addEventListener('click', startGame);
  byId('newCampaignButton').addEventListener('click', () => startGame(true));
  byId('countryMenuButton').addEventListener('click', returnToStart);
  document.querySelectorAll('[data-policy-input]').forEach((input) => input.addEventListener('input', updateControls));
  byId('applyDecisionButton').addEventListener('click', applyDecision);
  byId('playToggleButton').addEventListener('click', toggleSimulation);
  byId('managementPlayButton').addEventListener('click', toggleSimulation);
  document.querySelectorAll('[data-game-speed]').forEach((button) => {
    button.addEventListener('click', () => selectGameSpeed(Number(button.dataset.gameSpeed)));
  });
  document.querySelectorAll('[data-history-range]').forEach((button) => {
    button.addEventListener('click', () => {
      const granularity = button.closest('[data-history-range-options]').dataset.historyRangeOptions;
      selectedHistoryRanges[granularity] = button.dataset.historyRange === 'all' ? 'all' : Number(button.dataset.historyRange);
      renderEconomicHistory();
    });
  });
  document.querySelectorAll('[data-history-granularity]').forEach((button) => {
    button.addEventListener('click', () => {
      selectedHistoryGranularity = button.dataset.historyGranularity;
      renderEconomicHistory();
    });
  });
  byId('economyButton').addEventListener('click', () => openManagementScreen('economyScreen'));
  byId('societyButton').addEventListener('click', () => openManagementScreen('societyScreen'));
  byId('cabinetButton').addEventListener('click', () => openManagementScreen('cabinetScreen'));
  document.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', closeManagementScreens));
  document.addEventListener('keydown', (event) => {
    if (byId('gameScreen').classList.contains('hidden')) return;
    if (event.key === 'Escape') {
      closeManagementScreens();
      return;
    }
    if (event.code === 'Space' && !['INPUT','BUTTON'].includes(document.activeElement.tagName) && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault(); toggleSimulation();
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      openManagementScreen('economyScreen');
      document.querySelector('[data-policy-input="vatMain"]').focus();
    }
  });
  window.addEventListener('pagehide', () => saveCampaign());
}

function selectCountry(key) {
  if (!countries[key]) return;
  selectedCountry = key;
  try {
    localStorage.setItem(SELECTED_COUNTRY_STORAGE_KEY, key);
  } catch (error) {
    // The selection still works for this page even if it cannot be persisted.
  }
  document.querySelectorAll('.country-card').forEach((card) => {
    const selected = card.dataset.country === key;
    card.classList.toggle('selected', selected);
    card.setAttribute('aria-selected', String(selected));
  });
  renderCampaignSelection();
}

function startGame(startFresh = false) {
  const savedCampaign = loadCampaign(selectedCountry);
  if (startFresh && savedCampaign && !window.confirm(`Начать новую кампанию за ${countries[selectedCountry].short}? Сохранённый прогресс на ${campaignDateLabel(savedCampaign)} будет заменён.`)) return;

  setSimulationPlaying(false, false);
  currentCountry = selectedCountry;
  const campaign = startFresh ? null : loadCampaign(currentCountry);
  state = campaign ? campaign.state : makeState(currentCountry);
  EconomyModel.prepareEconomyState(state);
  draftPolicy = JSON.parse(JSON.stringify(state.policy));
  currentGameDate = campaign ? new Date(campaign.gameDate) : new Date(Date.UTC(2026, 0, 1));
  selectedSpeed = campaign && SPEED_TICK_INTERVAL_MS.hasOwnProperty(campaign.selectedSpeed) ? campaign.selectedSpeed : 3;
  initializeDailyEconomicHistory();
  const country = countries[currentCountry];
  byId('startScreen').classList.add('hidden');
  byId('gameScreen').classList.remove('hidden');
  closeManagementScreens();
  setFlag(byId('countryMenuFlag'), country.flag);
  byId('policyRateLabel').textContent = currentCountry === 'germany' ? 'Ставка ЕЦБ для еврозоны · учебный рычаг' : 'Ставка центрального банка';
  byId('institutionNote').textContent = currentCountry === 'germany'
    ? 'Для Германии это ставка ЕЦБ для всей еврозоны, не национальная ставка правительства. Прямое управление включено только как игровое упрощение.'
    : 'Упрощённый игровой режим: игрок выбирает ставку напрямую. Коэффициенты условные и различаются по странам.';
  const countryMenuDescription = `Ваше государство: ${country.formal}. Нажмите, чтобы выбрать другую страну`;
  byId('countryMenuButton').dataset.tooltip = countryMenuDescription;
  byId('countryMenuButton').setAttribute('aria-label', countryMenuDescription);
  renderGameDate();
  renderSpeedControls();
  drawMap(country);
  setPolicyControls(draftPolicy);
  renderState();
  updateControls();
  saveCampaign();
  renderCampaignSelection();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function returnToStart() {
  saveCampaign();
  setSimulationPlaying(false, false);
  if (state) selectCountry(currentCountry);
  renderCampaignSelection();
  closeManagementScreens();
  byId('gameScreen').classList.add('hidden');
  byId('startScreen').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openManagementScreen(id) {
  document.querySelectorAll('.management-screen').forEach((screen) => screen.classList.add('hidden'));
  const screen = byId(id);
  if (!screen) return;
  screen.classList.remove('hidden');
  const closeButton = screen.querySelector('[data-close]');
  if (closeButton) closeButton.focus({ preventScroll: true });
}

function closeManagementScreens() {
  document.querySelectorAll('.management-screen').forEach((screen) => screen.classList.add('hidden'));
}

function drawMap(country) {
  if (!window.maplibregl) {
    byId('mapStatus').textContent = 'Не удалось загрузить карту. Проверьте подключение к интернету.';
    return;
  }

  if (!worldMap) {
    worldMap = new maplibregl.Map({
      container: 'worldMap',
      style: OPENFREEMAP_STYLE_URL,
      center: [0, 18],
      zoom: 1,
      minZoom: 0,
      maxZoom: 18,
      // MapLibre 5.x crashes when maxBounds spans exactly 360° longitude.
      maxBounds: [[-179.999, -85], [179.999, 85]],
      renderWorldCopies: false,
      dragRotate: false,
      pitchWithRotate: false,
      attributionControl: { compact: false }
    });
    worldMap.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    worldMap.on('error', () => {
      if (!mapReady) byId('mapStatus').textContent = 'Карта недоступна. Проверьте подключение к интернету.';
    });
    worldMap.once('load', () => {
      mapReady = true;
      simplifyMapStyle();
      addCountryHighlightLayers();
      updateMapCountry(countries[currentCountry]);
      worldMap.fitBounds([[-180, -82], [180, 82]], { padding: 28, duration: 0 });
      byId('mapStatus').classList.add('hidden');
    });
    return;
  }

  if (mapReady) {
    updateMapCountry(country);
    worldMap.resize();
    worldMap.fitBounds([[-180, -82], [180, 82]], { padding: 28, duration: 0 });
  }
}

function simplifyMapStyle() {
  const layers = worldMap.getStyle().layers;
  const countryBoundaries = layers.filter(isCountryBoundaryLayer);
  const countryLabels = layers.filter(isCountryLabelLayer);
  const firstCountryLabel = countryLabels[0];
  const keepLayer = (layer) => layer.id === 'background'
    || layer.id === 'water'
    || isCountryBoundaryLayer(layer)
    || layer.id === 'boundary_disputed'
    || isCountryLabelLayer(layer);

  layers.forEach((layer) => {
    if (!keepLayer(layer)) worldMap.setLayoutProperty(layer.id, 'visibility', 'none');
  });
  if (worldMap.getLayer('background')) worldMap.setPaintProperty('background', 'background-color', '#e8e2d6');
  if (worldMap.getLayer('water')) worldMap.setPaintProperty('water', 'fill-color', '#dce4e3');
  countryBoundaries.forEach((layer) => {
    worldMap.setPaintProperty(layer.id, 'line-color', '#847563');
    worldMap.setPaintProperty(layer.id, 'line-width', ['interpolate', ['linear'], ['zoom'], 0, 0.85, 2, 1.1, 5, 1.5, 12, 2]);
    worldMap.setPaintProperty(layer.id, 'line-opacity', 1);
  });
  countryLabels.forEach((layer) => {
    const minZoom = layer.id.endsWith('_1') ? 0 : layer.id.endsWith('_2') ? 2 : 5;
    worldMap.setLayerZoomRange(layer.id, minZoom, 18);
    worldMap.setLayoutProperty(layer.id, 'text-field', [
      'coalesce', ['get', 'name:ru'], ['get', 'name_ru'], ['get', 'name:en'], ['get', 'name_en'], ['get', 'name']
    ]);
    worldMap.setLayoutProperty(layer.id, 'text-size', ['interpolate', ['linear'], ['zoom'], 0, 7, 2, 8, 5, 11, 10, 15]);
    worldMap.setLayoutProperty(layer.id, 'text-allow-overlap', true);
    worldMap.setLayoutProperty(layer.id, 'text-ignore-placement', true);
    worldMap.setPaintProperty(layer.id, 'text-color', '#40372e');
    worldMap.setPaintProperty(layer.id, 'text-halo-color', '#f4efe5');
    worldMap.setPaintProperty(layer.id, 'text-halo-width', 1.25);
    worldMap.setPaintProperty(layer.id, 'text-halo-blur', 0.2);
  });

  worldMap.addLayer({
    id: COASTLINE_LAYER_ID,
    type: 'line',
    source: 'openmaptiles',
    'source-layer': 'water',
    filter: ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false],
    paint: {
      'line-color': '#9bafae',
      'line-width': ['interpolate', ['linear'], ['zoom'], 0, 0.65, 4, 1, 10, 1.5],
      'line-opacity': 1
    }
  }, firstCountryLabel?.id);

  worldMap.addLayer({
    id: COUNTRY_OUTLINE_LAYER_ID,
    type: 'line',
    source: 'openmaptiles',
    'source-layer': 'boundary',
    filter: ['==', ['get', 'admin_level'], 2],
    paint: {
      'line-color': '#a7553e',
      'line-width': ['interpolate', ['linear'], ['zoom'], 0, 2.8, 5, 4, 10, 5, 16, 6],
      'line-opacity': 1
    }
  }, firstCountryLabel?.id);
}

function isCountryBoundaryLayer(layer) {
  return layer.id === 'boundary_2' || layer.id.startsWith('boundary_country');
}

function isCountryLabelLayer(layer) {
  return layer.id.startsWith('label_country_');
}

function addCountryHighlightLayers() {
  worldMap.addSource('mandate-country-shapes', {
    type: 'geojson',
    data: COUNTRY_SHAPES_URL
  });
  const firstBoundaryLayer = worldMap.getStyle().layers.find(isCountryBoundaryLayer);
  worldMap.addLayer({
    id: COUNTRY_FILL_LAYER_ID,
    type: 'fill',
    source: 'mandate-country-shapes',
    maxzoom: 5,
    filter: ['in', ['get', 'ADMIN'], ['literal', countries[currentCountry].boundaryNames]],
    paint: {
      'fill-color': '#a7553e',
      'fill-opacity': ['interpolate', ['linear'], ['zoom'], 0, 0.28, 4, 0.19, 6, 0.1]
    }
  }, firstBoundaryLayer?.id);
}

function updateMapCountry(country) {
  const nameMatches = country.boundaryNames.flatMap((name) => [
    ['==', ['get', 'adm0_l'], name],
    ['==', ['get', 'adm0_r'], name]
  ]);
  worldMap.setFilter(COUNTRY_OUTLINE_LAYER_ID, [
    'all',
    ['==', ['get', 'admin_level'], 2],
    ['any', ...nameMatches]
  ]);
  worldMap.setFilter(COUNTRY_FILL_LAYER_ID, ['in', ['get', 'ADMIN'], ['literal', country.boundaryNames]]);

  if (!capitalMarker) {
    const markerElement = document.createElement('div');
    markerElement.className = 'capital-pin';
    markerElement.innerHTML = '<span></span><b></b>';
    capitalMarker = new maplibregl.Marker({ element: markerElement, anchor: 'left', offset: [0, -1] });
  }
  capitalMarker.getElement().querySelector('b').textContent = country.capitalName;
  capitalMarker.setLngLat([country.capital[1], country.capital[0]]).addTo(worldMap);
}

function renderState({ updateHistory = true } = {}) {
  byId('trustValue').textContent = Math.round(overallTrust());
  byId('trustBar').style.width = overallTrust() + '%';
  byId('gdpValue').textContent = format(state.gdp);
  byId('inflationValue').textContent = format(state.inflation_yoy_pct);
  byId('inflationMomValue').textContent = (state.inflation_mom_pct >= 0 ? '+' : '') + format(state.inflation_mom_pct) + '%';
  byId('coreInflationValue').textContent = format(state.core_inflation_yoy_pct);
  byId('budgetValue').textContent = (state.budget_balance_pct_gdp >= 0 ? '+' : '') + format(state.budget_balance_pct_gdp);
  byId('debtRatioValue').textContent = format(state.debt_to_gdp_pct);
  byId('taxBurdenValue').textContent = format(state.tax_burden_pct);
  byId('unemploymentValue').textContent = format(state.unemployment_pct);
  byId('unemploymentSummaryValue').textContent = format(state.unemployment_pct);
  byId('realGdpIndexValue').textContent = format(state.real_gdp, 2);
  byId('outputGapValue').textContent = (state.output_gap_pct >= 0 ? '+' : '') + format(state.output_gap_pct) + '%';
  byId('policyRateValue').textContent = format(state.policy_rate_pct, 2);
  byId('policyRateValueReadout').textContent = format(state.policy_rate_pct, 2);
  byId('loanRateValue').textContent = format(state.loan_rate_pct, 2);
  byId('depositRateValue').textContent = format(state.deposit_rate_pct, 2);
  byId('inflationExpectationValue').textContent = format(state.inflation_expectation_pct);
  byId('realWageValue').textContent = format(state.real_wage_index, 2);
  byId('investmentIndexValue').textContent = format(state.private_investment_index, 2);
  byId('nominalGdpValue').textContent = format(state.nominal_gdp_lcu, 0) + ' ' + countries[currentCountry].currency;
  byId('budgetRevenueValue').textContent = money(state.revenue_lcu);
  byId('budgetPrimaryValue').textContent = money(state.primary_spending_lcu);
  byId('budgetPrimaryBalanceValue').textContent = money(state.primary_balance_lcu);
  byId('budgetInterestValue').textContent = money(state.interest_lcu);
  byId('budgetOverallValue').textContent = money(state.overall_balance_lcu);
  byId('netBorrowingValue').textContent = money(state.net_borrowing_lcu);
  byId('debtValue').textContent = money(state.debt_lcu);
  byId('cashValue').textContent = money(state.cash_lcu);
  const decisionCause = state.last_causes.find((cause) => cause.id === 'policy-decision');
  const creditCause = state.last_causes.find((cause) => cause.id === 'credit-output-channel');
  const rateCause = state.last_causes.find((cause) => cause.id === 'monetary-transmission');
  const vatCause = state.last_causes.find((cause) => cause.id === 'vat-price-pass-through');
  const eventCauses = state.last_causes.filter((cause) => cause.effect === 'temporary_external_shock');
  const explanations = [];
  if (decisionCause && Math.abs(decisionCause.rate_change_pp) > 0.001) {
    explanations.push('Ставка ЦБ ' + (decisionCause.rate_change_pp > 0 ? '+' : '−') + format(Math.abs(decisionCause.rate_change_pp)) + ' п.п.; банковские условия меняются быстрее, спрос и инвестиции реагируют с лагом.');
  }
  if (creditCause) explanations.push('Банковские ставки передали импульс; индекс частных инвестиций изменился на ' + (creditCause.investment_change_pct >= 0 ? '+' : '−') + format(Math.abs(creditCause.investment_change_pct)) + '%, затем меняется выпуск.');
  if (rateCause) explanations.push(rateCause.effect === 'disinflationary' ? 'Запаздывающий импульс ставки снижает темп роста уровня цен в модели.' : 'Запаздывающий импульс ставки повышает темп роста уровня цен в модели.');
  if (vatCause) explanations.push('Изменение НДС даёт разовый перенос в уровень цен, распределённый на несколько месяцев.');
  if (decisionCause && decisionCause.tax_change) explanations.push('Налоговые поступления пересчитаны по базам и собираемости, которые реагируют на ставки и администрирование.');
  if (eventCauses.length) explanations.push(eventCauses.map((cause) => 'Событие: ' + cause.source + ' (временный шок).').join(' '));
  explanations.push(state.overall_balance_lcu < 0 ? 'Дефицит отражён в чистом заимствовании и движении денег казначейства.' : 'Профицит сокращает долг или увеличивает остаток казначейства.');
  byId('monthlyCauses').textContent = explanations.join(' ') + ' Это объяснение механики модели, а не доказательство эмпирической причинности.';
  byId('monetaryDelayText').textContent = state.queued_decision
    ? 'Решение вступит в силу на следующем такте. Для простоты всё изменение считается неожиданным; первые ценовые эффекты модели появляются не раньше чем через 3 месяца.'
    : 'Для простоты решение считается неожиданным. Основной расчётный вклад ставки в цены распределён на месяцы 3–24 после каждого изменения.';
  renderTrend(byId('gdpTrend'), state.prev.gdp, '%', true, 2);
  renderTrend(byId('inflationTrend'), state.prev.inflation, ' п.п.', false);
  renderTrend(byId('unemploymentTrend'), state.prev.unemployment, ' п.п.', false);
  const budgetTrend = byId('budgetTrend');
  budgetTrend.textContent = state.budget_balance_pct_gdp >= 0 ? (state.budget_balance_pct_gdp > .1 ? 'ПРОФИЦИТ' : 'БАЛАНС') : 'ДЕФИЦИТ';
  budgetTrend.className = 'trend ' + (state.budget_balance_pct_gdp >= 0 ? 'up' : 'warning');
  const trustMap = { people: 'peopleTrust', elites: 'eliteTrust', government: 'governmentTrust', security: 'securityTrust' };
  Object.entries(trustMap).forEach(([key, id]) => {
    const val = clamp(state.trust[key], 0, 100);
    byId(id).innerHTML = Math.round(val) + '<span>%</span>';
    byId(key + 'Bar').style.width = val + '%';
  });
  const weakest = Math.min(...Object.values(state.trust));
  byId('coalitionSummary').textContent = weakest < 30 ? 'КОАЛИЦИЯ ПОД УГРОЗОЙ' : weakest < 45 ? 'КОАЛИЦИЯ НАПРЯЖЕНА' : 'КОАЛИЦИЯ СТАБИЛЬНА';
  byId('coalitionSummary').style.color = weakest < 30 ? '#d58b78' : weakest < 45 ? '#d4b078' : '#91a79a';
  renderTaxDetails();
  renderSpendingDetails();
  if (updateHistory) renderCauseJournal();
  renderEconomicTiming();
  if (updateHistory) renderEconomicHistory();
}

function historyMonthLabel(monthNumber) {
  return new Date(Date.UTC(2026, monthNumber, 1)).toLocaleDateString('ru-RU', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function historyDayLabel(point) {
  return new Date(point.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function makeDailyEconomicSnapshot(date = currentGameDate) {
  return {
    date: date.toISOString(),
    real_gdp: state.real_gdp,
    inflation_yoy_pct: state.inflation_yoy_pct,
    unemployment_pct: state.unemployment_pct,
    budget_balance_pct_gdp: state.budget_balance_pct_gdp,
    debt_to_gdp_pct: state.debt_to_gdp_pct,
    tax_burden_pct: state.tax_burden_pct,
    policy_rate_pct: state.policy_rate_pct
  };
}

function initializeDailyEconomicHistory() {
  if (!Array.isArray(state.daily_economic_history)) state.daily_economic_history = [];
  if (!state.daily_economic_history.length) state.daily_economic_history.push(makeDailyEconomicSnapshot());
}

function recordDailyEconomicSnapshot() {
  initializeDailyEconomicHistory();
  const snapshot = makeDailyEconomicSnapshot();
  const last = state.daily_economic_history[state.daily_economic_history.length - 1];
  if (last?.date === snapshot.date) state.daily_economic_history[state.daily_economic_history.length - 1] = snapshot;
  else state.daily_economic_history.push(snapshot);
}

function renderEconomicTiming() {
  if (!state) return;
  byId('economyAsOfValue').textContent = currentGameDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  byId('economyNextUpdateValue').textContent = 'каждый такт';
}

function renderEconomicHistory() {
  if (!state) return;
  const isDaily = selectedHistoryGranularity === 'day';
  const fullHistory = isDaily ? (state.daily_economic_history || []) : state.economic_history;
  const selectedRange = selectedHistoryRanges[selectedHistoryGranularity];
  const history = selectedRange === 'all' ? fullHistory : fullHistory.slice(-selectedRange);
  const dateLabel = isDaily ? historyDayLabel : (point) => historyMonthLabel(point.month_number);
  const periodLabel = isDaily ? 'дней' : 'месяцев';
  document.querySelectorAll('[data-history-granularity]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.historyGranularity === selectedHistoryGranularity));
  });
  document.querySelectorAll('[data-history-range-options]').forEach((group) => {
    group.hidden = group.dataset.historyRangeOptions !== selectedHistoryGranularity;
  });
  document.querySelectorAll('[data-history-range]').forEach((button) => {
    const activeGroup = button.closest('[data-history-range-options]');
    button.setAttribute('aria-pressed', String(activeGroup?.dataset.historyRangeOptions === selectedHistoryGranularity
      && button.dataset.historyRange === String(selectedRange)));
  });
  byId('historyDescription').textContent = isDaily
    ? 'Показатели берутся на границе каждого игрового дня; между точками проходят четыре 6-часовых такта.'
    : 'Показатели берутся на границе игрового месяца; оперативные значения обновляются каждый такт.';
  byId('historyGranularityLabel').textContent = isDaily
    ? 'Фактические дневные срезы'
    : 'Фактические месячные срезы';
  const grid = byId('economicHistoryCharts');
  grid.replaceChildren();
  if (!history.length) return;
  const svgNs = 'http://www.w3.org/2000/svg';
  const svgNode = (name, attributes = {}) => {
    const node = document.createElementNS(svgNs, name);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, String(value)));
    return node;
  };
  HISTORY_METRICS.forEach((metric) => {
    const values = history.map((point) => point[metric.key]);
    const current = values[values.length - 1];
    const card = document.createElement('article');
    card.className = 'history-card';
    card.style.setProperty('--history-color', metric.color);
    const heading = document.createElement('div');
    heading.className = 'history-card-heading';
    const title = document.createElement('h4');
    title.textContent = metric.label;
    const value = document.createElement('span');
    value.textContent = format(current, metric.digits) + (metric.unit.startsWith('%') ? '%' : '');
    heading.append(title, value);
    const unit = document.createElement('small');
    unit.textContent = metric.unit;

    const width = 560;
    const left = 48;
    const right = 548;
    const top = 15;
    const bottom = 135;
    let low = Infinity;
    let high = -Infinity;
    values.forEach((point) => { low = Math.min(low, point); high = Math.max(high, point); });
    const padding = Math.max((high - low) * 0.12, metric.key === 'real_gdp' ? 0.2 : 0.15);
    const min = low - padding;
    const max = high + padding;
    const x = (index) => values.length === 1 ? (left + right) / 2 : left + (right - left) * index / (values.length - 1);
    const y = (number) => bottom - (number - min) / (max - min) * (bottom - top);
    const svg = svgNode('svg', { viewBox: `0 0 ${width} 160`, role: 'img', 'aria-label': `${metric.label}: ${history.length} значений по ${periodLabel} от ${dateLabel(history[0])} до ${dateLabel(history[history.length - 1])}` });
    [min, (min + max) / 2, max].forEach((tick) => {
      const line = svgNode('line', { x1: left, x2: right, y1: y(tick), y2: y(tick), class: 'history-gridline' });
      const label = svgNode('text', { x: left - 7, y: y(tick) + 3, 'text-anchor': 'end', class: 'history-axis-label' });
      label.textContent = format(tick, metric.digits);
      svg.append(line, label);
    });
    if (min < 0 && max > 0) svg.append(svgNode('line', { x1: left, x2: right, y1: y(0), y2: y(0), class: 'history-zero-line' }));
    const path = svgNode('path', {
      d: values.map((point, index) => `${index === 0 ? 'M' : 'L'}${x(index).toFixed(2)} ${y(point).toFixed(2)}`).join(' '),
      class: 'history-line'
    });
    svg.append(path);
    values.forEach((point, index) => {
      if (values.length > 120 && index !== values.length - 1 && index % Math.ceil(values.length / 120) !== 0) return;
      const circle = svgNode('circle', { cx: x(index), cy: y(point), r: index === values.length - 1 ? 4 : 2.6, class: 'history-point' });
      const tooltip = svgNode('title');
      tooltip.textContent = `${dateLabel(history[index])} · ${metric.label}: ${format(point, metric.digits)} ${metric.unit}`;
      circle.append(tooltip);
      svg.append(circle);
    });
    const dates = document.createElement('div');
    dates.className = 'history-dates';
    const start = document.createElement('span');
    start.textContent = dateLabel(history[0]);
    const end = document.createElement('span');
    end.textContent = dateLabel(history[history.length - 1]);
    dates.append(start, end);
    card.append(heading, unit, svg, dates);
    grid.append(card);
  });
}

function renderTrend(el, value, suffix, positiveGood, digits = 1) {
  const arrow = value > .015 ? '↗' : value < -.015 ? '↘' : '→';
  const good = positiveGood ? value >= 0 : value <= 0;
  el.textContent = arrow + ' ' + format(Math.abs(value), digits) + suffix;
  el.className = 'trend ' + (Math.abs(value) <= .015 ? 'flat' : good ? 'up' : 'warning');
}

function setPolicyControls(policy) {
  if (!policy) return;
  const values = {
    vatMain: policy.taxes.vat_main_pct, vatReduced: policy.taxes.vat_reduced_pct,
    vatReducedShare: policy.taxes.vat_reduced_share_pct, vatExemptShare: policy.taxes.vat_exempt_share_pct,
    pitRate: policy.taxes.pit_pct, payrollRate: policy.taxes.payroll_pct,
    employerShare: policy.payroll_employer_share_pct, corporateRate: policy.taxes.corporate_pct,
    resourceRate: policy.taxes.resource_pct, adminQuality: policy.admin_quality * 100,
    policyRate: policy.policy_rate_pct, borrowingShare: policy.borrowing_share_pct
  };
  Object.entries(policy.spend_plan_pct_gdp).forEach(([key, value]) => { values['spend-' + key] = value; });
  document.querySelectorAll('[data-policy-input]').forEach((input) => {
    const value = values[input.dataset.policyInput];
    if (value !== undefined) input.value = value;
    updateRange(input);
  });
}

function readDraftPolicy() {
  const policy = JSON.parse(JSON.stringify(draftPolicy || state.policy));
  const val = (key) => Number(document.querySelector('[data-policy-input="' + key + '"]').value);
  policy.taxes.vat_main_pct = val('vatMain');
  policy.taxes.vat_reduced_pct = val('vatReduced');
  policy.taxes.vat_reduced_share_pct = val('vatReducedShare');
  policy.taxes.vat_exempt_share_pct = val('vatExemptShare');
  policy.taxes.pit_pct = val('pitRate');
  policy.taxes.payroll_pct = val('payrollRate');
  policy.payroll_employer_share_pct = val('employerShare');
  policy.taxes.corporate_pct = val('corporateRate');
  policy.taxes.resource_pct = val('resourceRate');
  policy.admin_quality = val('adminQuality') / 100;
  policy.borrowing_share_pct = val('borrowingShare');
  policy.policy_rate_pct = val('policyRate');
  EconomyModel.SPEND_KEYS.forEach((key) => { policy.spend_plan_pct_gdp[key] = val('spend-' + key); });
  return policy;
}

function updateRange(slider) {
  const percent = (Number(slider.value) - Number(slider.min)) / (Number(slider.max) - Number(slider.min)) * 100;
  slider.style.setProperty('--range-progress', percent + '%');
  const out = byId(slider.dataset.policyInput + 'Value');
  if (out) out.textContent = format(Number(slider.value), Number(slider.step) < 1 ? 2 : 0).replace(/,00$/, '').replace(/(,\d)0$/, '$1');
}

function updateControls() {
  if (!state) return;
  document.querySelectorAll('[data-policy-input]').forEach(updateRange);
  draftPolicy = readDraftPolicy();
  const pendingDecision = state.queued_decision;
  const pending = Boolean(pendingDecision);
  const changed = JSON.stringify(draftPolicy) !== JSON.stringify(pendingDecision || state.policy);
  const cancelPending = pending && JSON.stringify(draftPolicy) === JSON.stringify(state.policy);
  document.querySelectorAll('[data-policy-input]').forEach((input) => { input.disabled = false; });
  const apply = byId('applyDecisionButton');
  apply.disabled = !changed && !cancelPending;
  apply.textContent = pending
    ? cancelPending ? 'Отменить ожидающее решение' : changed ? 'Обновить ожидающее решение' : 'Решение уже в очереди'
    : changed ? 'Подтвердить и применить со следующего такта' : 'Измените параметры и подтвердите решение';
  byId('decisionQueueNote').textContent = pending
    ? 'Ожидающее решение вступит в силу на следующем такте. До этого его можно изменить или отменить.'
    : changed ? 'Изменения пока только в проекте. Подтвердите их, чтобы поставить в очередь.' : 'Изменение настроек не меняет состояние до подтверждения и следующего такта.';
  renderForecast(EconomyModel.forecast(state, countries[currentCountry], draftPolicy));
}

function applyDecision() {
  if (!state) return;
  draftPolicy = readDraftPolicy();
  if (state.queued_decision) {
    if (JSON.stringify(draftPolicy) === JSON.stringify(state.queued_decision)) return;
    if (JSON.stringify(draftPolicy) === JSON.stringify(state.policy)) {
      state.queued_decision = null;
      updateControls();
      renderState();
      saveCampaign();
      showToast('ОЖИДАЮЩЕЕ РЕШЕНИЕ ОТМЕНЕНО');
      return;
    }
    EconomyModel.queueDecision(state, draftPolicy);
    updateControls();
    renderState();
    saveCampaign();
    showToast('ОЖИДАЮЩЕЕ РЕШЕНИЕ ОБНОВЛЕНО');
    return;
  }
  if (JSON.stringify(draftPolicy) === JSON.stringify(state.policy)) return;
  EconomyModel.queueDecision(state, draftPolicy);
  updateControls();
  renderState();
  saveCampaign();
  showToast('РЕШЕНИЕ ПОДТВЕРЖДЕНО · ВСТУПИТ В СИЛУ СЛЕДУЮЩЕГО ТАКТА');
}

function renderForecast(forecast) {
  const labels = { 1: '1 мес.', 6: '6 мес.', 12: '12 мес.', 24: '24 мес.' };
  byId('forecastBody').innerHTML = Object.keys(labels).map((key) => {
    const point = forecast.central[key];
    const low = forecast.low[key];
    const high = forecast.high[key];
    return '<tr><th>' + labels[key] + '</th><td>' + format(point.inflation_yoy_pct) + '% <small>' + format(low.inflation_yoy_pct) + '–' + format(high.inflation_yoy_pct) + '%</small></td><td>' + format(point.debt_to_gdp_pct) + '% <small>' + format(low.debt_to_gdp_pct) + '–' + format(high.debt_to_gdp_pct) + '%</small></td><td>' + (point.output_gap_pct >= 0 ? '+' : '') + format(point.output_gap_pct) + '%</td></tr>';
  }).join('');
  byId('forecastAssumptions').textContent = 'Центральный сценарий продолжает проектируемые решения; диапазон показывает чувствительность к умеренным шокам цен энергии и продовольствия. Это условная модельная оценка.';
}

function renderTaxDetails() {
  const labels = { vat_main: 'НДС', pit: 'НДФЛ', payroll: 'Взносы с ФОТ', corporate: 'Прибыль', resource: 'Ресурсные платежи' };
  byId('taxTableBody').innerHTML = Object.entries(state.tax_details).map(([key, item]) => '<tr><th>' + labels[key] + '</th><td>' + format(item.effective_rate_pct) + '%</td><td>' + money(item.base_lcu) + '</td><td>' + format(item.compliance_pct) + '%</td><td>' + money(item.revenue_lcu) + '</td></tr>').join('');
  byId('taxBurdenLabel').textContent = format(state.tax_burden_pct) + '% ВВП · за 12 месяцев';
}

function renderSpendingDetails() {
  byId('spendingTableBody').innerHTML = EconomyModel.SPEND_KEYS.map((key) => {
    const plan = state.spend_plan_lcu[key] || 0;
    const actual = state.spend_actual_lcu[key] || 0;
    return '<tr><th>' + EconomyModel.SPEND_LABELS[key] + '</th><td>' + money(plan) + '</td><td>' + money(actual) + '</td><td>' + format(plan > 0 ? actual / plan * 100 : 0, 0) + '%</td></tr>';
  }).join('');
}

function renderCauseJournal() {
  const entries = state.cause_journal.slice(-6).reverse();
  if (!entries.length) {
    byId('causalJournal').innerHTML = '<li>Записи появятся после первого хода.</li>';
    return;
  }
  byId('causalJournal').innerHTML = entries.map((entry) => {
    const date = new Date(2026, entry.month_number, 1).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
    const explanations = [];
    const decision = entry.causes.find((cause) => cause.id === 'policy-decision');
    const rate = entry.causes.find((cause) => cause.id === 'monetary-transmission');
    const vat = entry.causes.find((cause) => cause.id === 'vat-price-pass-through');
    const events = entry.causes.filter((cause) => cause.effect === 'temporary_external_shock');
    if (decision) explanations.push('применено решение');
    if (rate) explanations.push('запаздывающий импульс ставки');
    if (vat) explanations.push('перенос НДС в цены');
    events.forEach((event) => explanations.push(event.source));
    if (!explanations.length) explanations.push('баланс и заимствования рассчитаны из потоков месяца');
    return '<li><b>' + date + '</b> · ' + explanations.join('; ') + '</li>';
  }).join('');
}

function money(value) {
  return format(value, 0) + ' ' + countries[currentCountry].currency;
}

function renderGameDate() {
  byId('monthValue').textContent = monthNames[currentGameDate.getUTCMonth()];
  byId('yearValue').textContent = currentGameDate.getUTCFullYear();
  byId('dayValue').textContent = currentGameDate.getUTCDate();
  const hours = String(currentGameDate.getUTCHours()).padStart(2, '0');
  byId('gameTimeValue').textContent = hours + ':00';
  renderEconomicTiming();
}

function renderSpeedControls() {
  byId('speedRateValue').textContent = SPEED_BADGES[selectedSpeed];
  document.querySelectorAll('[data-game-speed]').forEach((button) => {
    const speed = Number(button.dataset.gameSpeed);
    const selected = speed === selectedSpeed;
    button.setAttribute('aria-pressed', String(selected));
    button.setAttribute('aria-label', `Скорость ${speed}: ${SPEED_DESCRIPTIONS[speed]}`);
    button.title = SPEED_DESCRIPTIONS[speed];
  });
}

function selectGameSpeed(speed) {
  if (!SPEED_TICK_INTERVAL_MS.hasOwnProperty(speed)) return;
  selectedSpeed = speed;
  renderSpeedControls();
  if (isPlaying) {
    stopSimulationTimer();
    scheduleSimulationTick();
  }
  saveCampaign();
}

function advanceGameTick() {
  if (!state) return;
  const previousDate = currentGameDate;
  const hadQueuedDecision = Boolean(state.queued_decision);
  currentGameDate = new Date(currentGameDate.getTime() + GAME_TICK_MS);
  renderGameDate();
  const dayBoundary = currentGameDate.getUTCDate() !== previousDate.getUTCDate()
    || currentGameDate.getUTCMonth() !== previousDate.getUTCMonth()
    || currentGameDate.getUTCFullYear() !== previousDate.getUTCFullYear();
  const monthBoundary = currentGameDate.getUTCMonth() !== previousDate.getUTCMonth()
    || currentGameDate.getUTCFullYear() !== previousDate.getUTCFullYear();
  const daysInPreviousMonth = new Date(Date.UTC(previousDate.getUTCFullYear(), previousDate.getUTCMonth() + 1, 0)).getUTCDate();
  EconomyModel.advanceTick(state, countries[currentCountry], 1 / (daysInPreviousMonth * 4), monthBoundary);
  if (dayBoundary) recordDailyEconomicSnapshot();
  if (hadQueuedDecision && !state.queued_decision) {
    updateControls();
  }
  renderState({ updateHistory: dayBoundary || monthBoundary });
  scheduleCampaignSave();
}

function toggleSimulation() {
  setSimulationPlaying(!isPlaying);
}

function scheduleSimulationTick() {
  if (!isPlaying || simulationTimer !== null) return;
  simulationTimer = setInterval(advanceGameTick, SPEED_TICK_INTERVAL_MS[selectedSpeed]);
}

function stopSimulationTimer() {
  if (simulationTimer === null) return;
  clearInterval(simulationTimer);
  simulationTimer = null;
}

function setSimulationPlaying(playing, notify = true) {
  stopSimulationTimer();
  isPlaying = playing && Boolean(state);

  byId('playToggleButton').setAttribute('aria-pressed', String(isPlaying));
  byId('playToggleButton').setAttribute('aria-label', isPlaying ? 'Приостановить игру' : 'Начать игру');
  byId('playToggleIcon').textContent = isPlaying ? 'Ⅱ' : '▶';
  byId('playToggleLabel').textContent = isPlaying ? 'Пауза' : 'Играть';
  byId('simulationStatus').textContent = isPlaying ? 'ИГРА ИДЁТ' : 'ПАУЗА';
  byId('simulationStatus').classList.toggle('is-playing', isPlaying);
  byId('managementPlayButton').setAttribute('aria-pressed', String(isPlaying));
  byId('managementPlayButton').setAttribute('aria-label', isPlaying ? 'Приостановить игру' : 'Начать игру');
  byId('managementPlayLabel').textContent = isPlaying ? 'Пауза' : 'Начать игру';
  byId('managementPlayIcon').textContent = isPlaying ? 'Ⅱ' : '▶';

  if (isPlaying) scheduleSimulationTick();
  if (notify && state) showToast(isPlaying ? `ИГРА НАЧАЛАСЬ · СКОРОСТЬ ${selectedSpeed}` : 'ИГРА ПРИОСТАНОВЛЕНА');
}

function overallTrust() {
  if (!state) return 0;
  return Object.values(state.trust).reduce((sum, value) => sum + value, 0) / 4;
}

function showToast(message) {
  const toast = byId('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 2600);
}

init();
