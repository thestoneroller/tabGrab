import { FORMAT_PREFERENCE_KEY, THEME_PREFERENCE_KEY } from '@/constants';
import { SETTINGS_STORAGE_KEY } from '@/constants';
import { formatUrlsPlain, formatUrlsMarkdown, formatUrlsJson } from '@/utils';
// State management
let tabs: TabItem[] = [];
let filteredTabs: TabItem[] = [];
let isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
let selectedCopyFormat: 'plain' | 'markdown' | 'json' = 'plain'; // Default format
let lastClickedTabId: number | null = null; // Add this line
let shiftNotificationShown = false; // Add this flag
let activeFilter: 'all' | 'pinned' = 'all'; // Removed 'active' from filter types
let isGroupingEnabled = false; // New state for grouping
let isHidePinnedEnabled = false; // New state for hiding pinned tabs
let formatPreference: 'plain' | 'markdown' | 'json' = 'plain';

// DOM Elements
const searchInput = document.getElementById('search-input') as HTMLInputElement;
const tabsContainer = document.getElementById(
  'tabs-container'
) as HTMLDivElement;
const themeToggleButton = document.getElementById(
  'theme-toggle-button'
) as HTMLButtonElement;
const selectAllCheckbox = document.getElementById(
  'select-all-checkbox'
) as HTMLInputElement;
const selectAllVisual = document.getElementById(
  'select-all-visual'
) as HTMLDivElement;
const selectionCount = document.getElementById(
  'selection-count'
) as HTMLSpanElement;
const headerTabCountBadge = document.getElementById(
  'tab-count-badge'
) as HTMLSpanElement;

// Hide Pinned Elements
const hidePinnedSection = document.getElementById(
  'hide-pinned-section'
) as HTMLDivElement;
const hidePinnedToggle = document.getElementById(
  'hide-pinned-toggle'
) as HTMLButtonElement;

const groupDomainToggle = document.getElementById(
  'group-domain-toggle'
) as HTMLButtonElement;

// Reverted Copy Button Elements
const copySelectedBtn = document.getElementById(
  'copy-selected'
) as HTMLButtonElement; // Main action button
const copyFormatToggle = document.getElementById(
  'copy-format-toggle'
) as HTMLButtonElement; // Dropdown toggle
const copyFormatMenu = document.getElementById(
  'copy-format-menu'
) as HTMLDivElement; // Dropdown menu
const copyButtonText = document.getElementById(
  'copy-button-text'
) as HTMLSpanElement; // Text inside main button

// Filter Buttons & Counts
const filterButtonAll = document.getElementById(
  'filter-all'
) as HTMLButtonElement;
const filterButtonPinned = document.getElementById(
  'filter-pinned'
) as HTMLButtonElement;
const countAll = document.getElementById('count-all') as HTMLSpanElement;
const countPinned = document.getElementById('count-pinned') as HTMLSpanElement;
const filterButtons = [filterButtonAll, filterButtonPinned];

// Filter Dropdown Elements
const filterButton = document.getElementById(
  'filter-button'
) as HTMLButtonElement;
const filterMenu = document.getElementById('filter-menu') as HTMLDivElement;
const hidePinnedSettingContainer = document.getElementById(
  'hide-pinned-setting'
) as HTMLDivElement;
const hidePinnedLabel = document.getElementById(
  'hide-pinned-label'
) as HTMLLabelElement;
const feedbackButton = document.getElementById(
  'feedback-button'
) as HTMLAnchorElement;

async function init() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  isDarkMode = prefersDark;

  // Load theme preference first
  await loadThemePreference();
  // If isDarkMode is still its default (system preference), and a theme preference was loaded, use that.
  // Otherwise, setTheme will use the system preference or the loaded preference.
  setTheme(isDarkMode);

  // Load settings first
  await loadFilterSettings();
  await loadFormatPreference(); // Load format preference

  // Load tabs
  await loadTabs();

  // Update counts initially
  updateFilterCounts();
  updateHeaderCount();
  applyFilterStyles();
  updateFormatMenuVisuals(); // Restore dropdown visual update

  // Apply initial state to toggles based on loaded settings
  updateToggleVisuals(groupDomainToggle, isGroupingEnabled);
  updateToggleVisuals(hidePinnedToggle, isHidePinnedEnabled);

  // Set up event listeners
  setupEventListeners();

  // Check if browser is Firefox and update feedback link
  if (navigator.userAgent.includes('Firefox')) {
    if (feedbackButton) {
      feedbackButton.href =
        'https://addons.mozilla.org/en-US/firefox/addon/tab-grab/';
    }
  }
}

// Load all tabs from the browser
async function loadTabs() {
  const allTabs = await browser.tabs.query({});

  tabs = allTabs.map((tab) => ({
    id: tab.id || 0,
    title: tab.title || 'Untitled',
    url: tab.url || '',
    favIconUrl: tab.favIconUrl || '',
    selected: false,
    pinned: tab.pinned,
    active: tab.active,
  }));

  // Apply current filters and render
  applyFiltersAndRender();

  // Update counts based on the *full* tab list
  updateFilterCounts();
  updateHeaderCount();

  // Update selection states based on potentially filtered view
  updateSelectionCount();
  updateSelectAllCheckbox();
  // Initial visibility update for hide-pinned section
  updateHidePinnedVisibility();
}

// New function to update the main header tab count
function updateHeaderCount() {
  if (headerTabCountBadge) {
    headerTabCountBadge.textContent = tabs.length.toString();
  }
}

// New function to update counts on filter buttons
function updateFilterCounts() {
  if (countAll) countAll.textContent = tabs.length.toString();
  if (countPinned)
    countPinned.textContent = tabs.filter((t) => t.pinned).length.toString();
}

// New function to apply visual styles to filter buttons
function applyFilterStyles() {
  const activeClasses = [
    'bg-indigo-100',
    'dark:bg-indigo-900/50',
    'text-indigo-700',
    'dark:text-indigo-300',
  ];
  const inactiveClasses = [
    'text-neutral-700',
    'dark:text-neutral-300',
    'hover:bg-neutral-100',
    'dark:hover:bg-neutral-800',
  ];
  const activeCountClasses = [
    'bg-indigo-200',
    'dark:bg-indigo-700/60',
    'text-indigo-800',
    'dark:text-indigo-200',
  ];
  const inactiveCountClasses = [
    'bg-neutral-200',
    'dark:bg-neutral-700',
    'text-neutral-800',
    'dark:text-neutral-200',
  ];

  filterButtons.forEach((button) => {
    const countBadge = button.querySelector('span');
    const filterType = button.id.replace('filter-', '');

    if (filterType === activeFilter) {
      button.classList.add(...activeClasses);
      button.classList.remove(...inactiveClasses);
      if (countBadge) {
        countBadge.classList.add(...activeCountClasses);
        countBadge.classList.remove(...inactiveCountClasses);
      }
    } else {
      button.classList.add(...inactiveClasses);
      button.classList.remove(...activeClasses);
      if (countBadge) {
        countBadge.classList.add(...inactiveCountClasses);
        countBadge.classList.remove(...activeCountClasses);
      }
    }
  });
}

// Central function to handle filtering and rendering
function applyFiltersAndRender() {
  const query = searchInput.value.toLowerCase();

  // Update visibility of the hide pinned section first
  updateHidePinnedVisibility();

  // Ensure toggle visuals match the current state after visibility update
  updateToggleVisuals(hidePinnedToggle, isHidePinnedEnabled);

  let baseFiltered = tabs;
  if (activeFilter === 'pinned') {
    baseFiltered = tabs.filter((tab) => tab.pinned);
  } else if (activeFilter === 'all' && isHidePinnedEnabled) {
    // Apply 'Hide Pinned' only when 'All' is active and checkbox is checked
    baseFiltered = tabs.filter((tab) => !tab.pinned);
  }

  if (query) {
    filteredTabs = baseFiltered.filter(
      (tab) =>
        tab.title.toLowerCase().includes(query) ||
        tab.url.toLowerCase().includes(query)
    );
  } else {
    filteredTabs = [...baseFiltered];
  }

  renderTabs();

  updateSelectAllCheckbox();
}

// Render tabs to the DOM
function renderTabs() {
  tabsContainer.innerHTML = '';

  if (filteredTabs.length === 0) {
    const noTabsContainer = document.createElement('div');
    noTabsContainer.className =
      'flex flex-col items-center justify-center py-8 text-neutral-500 dark:text-neutral-400';

    const warningIcon = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'svg'
    );
    warningIcon.setAttribute('class', 'w-10 h-10 mb-2 opacity-70');
    warningIcon.setAttribute('viewBox', '0 0 24 24');
    warningIcon.setAttribute('fill', 'none');
    warningIcon.setAttribute('stroke', 'currentColor');
    warningIcon.setAttribute('stroke-width', '1.5');
    warningIcon.setAttribute('stroke-linecap', 'round');
    warningIcon.setAttribute('stroke-linejoin', 'round');

    const trianglePath = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'path'
    );
    trianglePath.setAttribute(
      'd',
      'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'
    );

    const line1 = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'line'
    );
    line1.setAttribute('x1', '12');
    line1.setAttribute('y1', '9');
    line1.setAttribute('x2', '12');
    line1.setAttribute('y2', '13');

    const line2 = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'line'
    );
    line2.setAttribute('x1', '12');
    line2.setAttribute('y1', '17');
    line2.setAttribute('x2', '12.01');
    line2.setAttribute('y2', '17');

    warningIcon.appendChild(trianglePath);
    warningIcon.appendChild(line1);
    warningIcon.appendChild(line2);

    const messageText = document.createTextNode(
      'No tabs found matching your search'
    );

    noTabsContainer.appendChild(warningIcon);
    noTabsContainer.appendChild(messageText);

    tabsContainer.appendChild(noTabsContainer);
    return;
  }

  if (isGroupingEnabled) {
    const groupedTabs: { [domain: string]: TabItem[] } = {};

    // 1. Group tabs by domain
    filteredTabs.forEach((tab) => {
      let domain = 'Other'; // Default group
      try {
        const url = new URL(tab.url);
        if (url.hostname) {
          domain = url.hostname.replace(/^www\./i, ''); // Clean domain
        }
      } catch (e) {
        console.warn(`Could not parse URL for grouping: ${tab.url}`);
      }
      if (!groupedTabs[domain]) {
        groupedTabs[domain] = [];
      }
      groupedTabs[domain].push(tab);
    });

    // 2. Sort domains alphabetically
    const sortedDomains = Object.keys(groupedTabs).sort();

    // 3. Render grouped tabs
    sortedDomains.forEach((domain) => {
      const tabsInGroup = groupedTabs[domain];
      const selectedInGroup = tabsInGroup.filter((t) => t.selected).length;
      const allSelectedInGroup = selectedInGroup === tabsInGroup.length;
      const someSelectedInGroup = selectedInGroup > 0 && !allSelectedInGroup;

      // Create Group Header Div (now flex)
      const groupHeader = document.createElement('div');
      groupHeader.className =
        'flex items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 pt-1 pb-2 px-2 sticky top-0 bg-white dark:bg-neutral-900 z-10';

      // --- Create Group Checkbox ---
      const groupCheckbox = document.createElement('input');
      groupCheckbox.type = 'checkbox';
      groupCheckbox.className = 'sr-only group-checkbox-input peer'; // Added class for listener targeting
      groupCheckbox.checked = allSelectedInGroup;
      groupCheckbox.indeterminate = someSelectedInGroup;
      groupCheckbox.dataset.domain = domain; // Store domain

      const groupCheckboxVisual = document.createElement('div');
      // Base classes similar to other checkboxes, add group-specific class
      groupCheckboxVisual.className =
        "group-checkbox-visual w-3.5 h-3.5 border-2 border-neutral-300 dark:border-neutral-600 rounded peer-checked:bg-indigo-500 peer-checked:border-indigo-500 relative peer-checked:after:content-[''] peer-checked:after:absolute peer-checked:after:left-[3px] peer-checked:after:top-[-1px] peer-checked:after:w-[4px] peer-checked:after:h-[8px] peer-checked:after:border-white peer-checked:after:border-r-2 peer-checked:after:border-b-2 peer-checked:after:rotate-45 cursor-pointer flex-shrink-0"; // Adjusted size/position slightly
      groupCheckboxVisual.dataset.domain = domain; // Store domain for click listener
      // Apply indeterminate style if necessary
      if (someSelectedInGroup) {
        groupCheckboxVisual.classList.add('indeterminate');

        groupCheckboxVisual.style.borderColor = 'var(--indigo-500)';
      }

      // Create Domain Text Span
      const domainText = document.createElement('span');
      domainText.textContent = domain;
      domainText.className = 'truncate'; // Allow truncation if needed

      // Append Checkbox and Text to Header
      groupHeader.appendChild(groupCheckbox); // Hidden input
      groupHeader.appendChild(groupCheckboxVisual); // Visual part
      groupHeader.appendChild(domainText); // Domain name

      tabsContainer.appendChild(groupHeader);

      // Render tabs within the group
      tabsInGroup.forEach((tab) => {
        const tabElement = createTabElement(tab); // Use helper function
        tabsContainer.appendChild(tabElement);
      });
    });
  } else {
    // --- Render Ungrouped Tabs ---
    filteredTabs.forEach((tab) => {
      const tabElement = createTabElement(tab); // Use helper function
      tabsContainer.appendChild(tabElement);
    });
  }

  updateActionButtons();
}

// Helper function to create a single tab element (used by renderTabs)
function createTabElement(tab: TabItem): HTMLDivElement {
  const tabElement = document.createElement('div');
  const active: boolean = tab.active ? true : false;
  const baseClasses =
    `flex items-center p-2 rounded-lg border transition-colors duration-200`;
  const selectedClasses =
    `bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-100 dark:hover:bg-indigo-800/50`;
  const defaultClasses =
    `bg-white dark:bg-neutral-800/50 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800`;
  tabElement.className = `${baseClasses} ${
    tab.selected ? selectedClasses : defaultClasses
  }`;
  tabElement.dataset.tabId = tab.id.toString();

  // Favicon placeholder logic (remains the same)
  let faviconHtml = '';
  if (tab.favIconUrl) {
    // ... (favicon img creation) ...
    const faviconImg = document.createElement('img');
    faviconImg.className = 'w-4 h-4 mx-2 rounded object-contain flex-shrink-0'; // Adjusted margin
    faviconImg.src = tab.favIconUrl;
    faviconImg.alt = '';
    faviconHtml = faviconImg.outerHTML;
  } else {
    // ... (placeholder creation, using indigo) ...
    let firstLetter = 'T';
    try {
      const url = new URL(tab.url);
      if (url.hostname && url.hostname.length > 0) {
        firstLetter = url.hostname.charAt(0).toUpperCase();
      }
    } catch (e) {
      console.warn(`Could not parse URL for favicon placeholder: ${tab.url}`);
    }
    const faviconPlaceholder = document.createElement('div');
    faviconPlaceholder.className =
      'w-4 h-4 ml-1 mr-2 rounded flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex-shrink-0'; // Adjusted margin
    faviconPlaceholder.textContent = firstLetter;
    faviconHtml = faviconPlaceholder.outerHTML;
  }

  // Checkbox (remains the same)
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'sr-only peer';
  checkbox.checked = tab.selected;

  // Checkbox visual element (remains the same, ensure class matches HTML)
  const checkboxVisual = document.createElement('div');
  checkboxVisual.className =
    "w-4 h-4 border-2 border-neutral-300 dark:border-neutral-700 rounded peer-checked:bg-indigo-500 peer-checked:border-indigo-500 relative peer-checked:after:content-[''] peer-checked:after:absolute peer-checked:after:left-[4px] peer-checked:after:top-[0px] peer-checked:after:w-[5px] peer-checked:after:h-[9px] peer-checked:after:border-white peer-checked:after:border-r-2 peer-checked:after:border-b-2 peer-checked:after:rotate-45 cursor-pointer flex-shrink-0";

  // Title container (remains the same)
  const titleContainer = document.createElement('div');
  titleContainer.className = 'flex-1 min-w-0 mr-2';

  // Title element (remains the same, maybe adjust font size if needed)
  const titleElement = document.createElement('div');
  titleElement.className =
    'text-sm truncate text-neutral-900 dark:text-neutral-100 flex gap-2 items-center';
  titleElement.title = tab.title;
  titleElement.textContent = tab.title;

  // URL element (remains the same)
  const urlElement = document.createElement('div');
  urlElement.className =
    'text-xs text-neutral-500 dark:text-neutral-400/60 truncate';
  urlElement.title = tab.url;
  urlElement.textContent = tab.url
    .replace(/^https?:\/\/(www\.)?/i, '')
    .replace(/\/$/, '');

  titleContainer.appendChild(titleElement);
  titleContainer.appendChild(urlElement);

  // Copy button (remains the same)
  const copyButton = document.createElement('button');
  copyButton.className =
    'p-1 text-neutral-500 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-colors duration-200 cursor-pointer flex-shrink-0';
  copyButton.title = 'Copy URL';
  // ... (SVG creation for copy button) ...
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', 'w-4 h-4');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', '9');
  rect.setAttribute('y', '9');
  rect.setAttribute('width', '13');
  rect.setAttribute('height', '13');
  rect.setAttribute('rx', '2');
  rect.setAttribute('ry', '2');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute(
    'd',
    'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'
  );
  svg.appendChild(rect);
  svg.appendChild(path);
  copyButton.appendChild(svg);

  // --- Assemble Tab Element --- Order matters for layout
  tabElement.appendChild(checkbox);
  tabElement.appendChild(checkboxVisual);

  if (faviconHtml) {
    const tempFaviconDiv = document.createElement('div');
    tempFaviconDiv.innerHTML = faviconHtml;
    if (tempFaviconDiv.firstChild)
      tabElement.appendChild(tempFaviconDiv.firstChild);
  }

  tabElement.appendChild(titleContainer);

  if (active) {
    const eyeIcon = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'svg'
    );
    eyeIcon.setAttribute('viewBox', '0 0 24 24');
    eyeIcon.setAttribute('fill', 'none');
    eyeIcon.setAttribute('stroke', 'currentColor');
    eyeIcon.setAttribute('stroke-width', '2');
    eyeIcon.setAttribute('stroke-linecap', 'round');
    eyeIcon.setAttribute('stroke-linejoin', 'round');

    const eyePath = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'path'
    );
    eyePath.setAttribute(
      'd',
      'M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0'
    );
    eyeIcon.appendChild(eyePath);

    const eyeCircle = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'circle'
    );
    eyeCircle.setAttribute('cx', '12');
    eyeCircle.setAttribute('cy', '12');
    eyeCircle.setAttribute('r', '3');
    eyeIcon.appendChild(eyeCircle);

    const tempEyeDiv = document.createElement('div');
    tempEyeDiv.className = 'ml-auto flex items-center w-fit h-fit';
    tempEyeDiv.appendChild(eyeIcon);
    tempEyeDiv.title = 'You are here';
    const svgElement = tempEyeDiv.querySelector('svg');
    svgElement?.setAttribute(
      'class',
      'w-4 h-4 mr-2 text-indigo-400 dark:text-indigo-400 flex-shrink-0'
    );

    if (tempEyeDiv.firstChild) tabElement.appendChild(tempEyeDiv.firstChild);
  }


  if (tab.pinned) {
    const pinIcon = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'svg'
    );
    pinIcon.setAttribute('viewBox', '0 0 24 24');
    pinIcon.setAttribute('fill', 'currentColor');
    const pinPath = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'path'
    );
    pinPath.setAttribute(
      'd',
      'M16 12V4h1V2H7v2h1v8l-2 3v2h6v4h2v-4h6v-2l-2-3z'
    );
    pinIcon.appendChild(pinPath);
    const tempPinDiv = document.createElement('div');
    tempPinDiv.className = 'ml-auto flex items-center';
    tempPinDiv.appendChild(pinIcon);
    const svgElement = tempPinDiv.querySelector('svg');
    svgElement?.setAttribute(
      'class',
      'w-4 h-4 mr-2 text-neutral-500 dark:text-neutral-400 flex-shrink-0'
    );
    if (tempPinDiv.firstChild) tabElement.appendChild(tempPinDiv.firstChild);
  }
  
  tabElement.appendChild(copyButton);

  return tabElement;
}

// Update selection count
function updateSelectionCount() {
  const selectedCount = tabs.filter((tab) => tab.selected).length;
  selectionCount.textContent = `${selectedCount}`;
  updateActionButtons();
}

// Update select all checkbox state (including visual representation)
function updateSelectAllCheckbox() {
  if (!selectAllCheckbox || !selectAllVisual) {
    console.error('Select All checkbox or visual element not found');
    return;
  }

  selectAllVisual.classList.remove('indeterminate');

  if (filteredTabs.length === 0) {
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = false;
    return;
  }

  // Count selected tabs within the *currently filtered* list
  const selectedInFiltered = filteredTabs.filter((tab) => tab.selected).length;

  // --- Set state ---
  if (selectedInFiltered === 0) {
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = false;
  } else if (selectedInFiltered === filteredTabs.length) {
    selectAllCheckbox.checked = true;
    selectAllCheckbox.indeterminate = false;
  } else {
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = true;

    selectAllVisual.classList.add('indeterminate');
  }
}

// Toggle select all tabs
function toggleSelectAll() {
  // State is determined *after* the click changes selectAllCheckbox.checked
  const shouldSelect = selectAllCheckbox.checked;

  // Apply the new state to all *currently filtered* tabs
  filteredTabs.forEach((filteredTab) => {
    const tabIndex = tabs.findIndex((t) => t.id === filteredTab.id);
    if (tabIndex !== -1) {
      // Update the main tabs array
      tabs[tabIndex].selected = shouldSelect;
    }
    // Update the filteredTabs array directly for render consistency
    filteredTab.selected = shouldSelect;
  });

  renderTabs();
  updateSelectionCount();
  updateSelectAllCheckbox();
}

// Helper for single tab toggle logic (extracted for clarity)
function performSingleToggle(mainIndex: number, filteredIndex: number) {
  const currentSelectedCount = tabs.filter((tab) => tab.selected).length;
  const isSelecting = !tabs[mainIndex].selected; // Are we trying to select this tab?

  // Check if selecting the 4th+ tab AND notification hasn't been shown yet
  if (isSelecting && currentSelectedCount >= 3 && !shiftNotificationShown) {
    showNotification(
      'Tip: Use Shift+Click to select a range of tabs quickly.' // Changed message slightly
    );
    shiftNotificationShown = true;
  }

  // Toggle selection in the main array
  tabs[mainIndex].selected = !tabs[mainIndex].selected;

  // Update the corresponding tab in filteredTabs if it exists
  if (filteredIndex !== -1) {
    filteredTabs[filteredIndex].selected = tabs[mainIndex].selected;
  }

  // Update only the specific item's visuals
  const tabElement = tabsContainer.querySelector(
    `[data-tab-id="${tabs[mainIndex].id}"]`
  );
  const checkboxInput = tabElement?.querySelector(
    'input[type="checkbox"]'
  ) as HTMLInputElement | null;
  if (tabElement && checkboxInput) {
    const isSelected = tabs[mainIndex].selected;
    checkboxInput.checked = isSelected; // Update hidden input state

    // Update visual classes on the tab element
    const baseClasses =
      'flex items-center p-2 rounded-xl border transition-colors duration-200';
    const selectedClasses =
      'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-500/30';
    const defaultClasses =
      'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700/60';
    tabElement.className = `${baseClasses} ${
      isSelected ? selectedClasses : defaultClasses
    }`;
  } else {
    console.warn(
      'Could not find tab element for single toggle visual update, falling back to full render.'
    );
    renderTabs();
  }
}

// Toggle individual tab selection or range selection with Shift
function toggleTabSelection(tabId: number, shiftKey: boolean) {
  const currentTabIndexInFiltered = filteredTabs.findIndex(
    (t) => t.id === tabId
  );
  if (currentTabIndexInFiltered === -1) return; // Clicked tab not in filtered list

  const mainTabIndex = tabs.findIndex((t) => t.id === tabId);
  if (mainTabIndex === -1) return;

  if (shiftKey && lastClickedTabId !== null && lastClickedTabId !== tabId) {
    const lastClickedIndexInFiltered = filteredTabs.findIndex(
      (t) => t.id === lastClickedTabId
    );

    if (lastClickedIndexInFiltered !== -1) {
      const start = Math.min(
        currentTabIndexInFiltered,
        lastClickedIndexInFiltered
      );
      const end = Math.max(
        currentTabIndexInFiltered,
        lastClickedIndexInFiltered
      );
      const shouldSelect = true;

      for (let i = start; i <= end; i++) {
        const tabInRange = filteredTabs[i];
        const mainIndexInRange = tabs.findIndex((t) => t.id === tabInRange.id);
        if (mainIndexInRange !== -1) {
          tabs[mainIndexInRange].selected = shouldSelect;
          filteredTabs[i].selected = shouldSelect;
        }
      }
      renderTabs();
    } else {
      // Last clicked tab not in filter, treat as single click
      performSingleToggle(mainTabIndex, currentTabIndexInFiltered);

      lastClickedTabId = tabId;
    }
  } else {
    // --- Normal Click ---
    const wasSelectingInitially = !tabs[mainTabIndex].selected;
    performSingleToggle(mainTabIndex, currentTabIndexInFiltered);
    if (tabs[mainTabIndex].selected || !wasSelectingInitially) {
      lastClickedTabId = tabId;
    }
  }

  updateSelectionCount();
  updateSelectAllCheckbox();
}

// Switch to a tab
async function switchToTab(tabId: number) {
  await browser.tabs.update(tabId, { active: true });
  const tabWindow = await browser.tabs.get(tabId);
  if (tabWindow.windowId) {
    await browser.windows.update(tabWindow.windowId, { focused: true });
  }
}

// Copy text to clipboard
async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true; // Indicate success
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false; // Indicate failure
  }
}

// Show notification
function showNotification(message: string) {
  let notification = document.querySelector('.notification') as HTMLDivElement;

  // Remove existing notification immediately if present
  if (notification) {
    notification.remove();
  }

  notification = document.createElement('div');
  // Use neutral-800 for dark background, indigo-500 for light background
  notification.className =
    'notification fixed bottom-16 border-2 border-indigo-500 w-full max-w-[356px] left-1/2 transform -translate-x-1/2 backdrop-blur-sm bg-indigo-500 dark:bg-indigo-800/50 text-white dark:text-neutral-100 px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 opacity-0 transition-all duration-300 ease-out z-50 text-sm';

  const checkIcon = document.createElement('span');
  // Ensure icon stroke contrasts with background
  // Create SVG element programmatically
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');

  // Create polyline element
  const polyline = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'polyline'
  );
  polyline.setAttribute('points', '20 6 9 17 4 12');

  // Append polyline to SVG
  svg.appendChild(polyline);

  // Append SVG to checkIcon
  checkIcon.appendChild(svg);

  notification.appendChild(checkIcon);
  notification.appendChild(document.createTextNode(message));
  document.body.appendChild(notification);

  // Trigger reflow to apply initial state for transition
  void notification.offsetWidth;

  // Show notification with animation
  requestAnimationFrame(() => {
    notification.classList.remove('opacity-0');
    notification.classList.add('opacity-100', 'translate-y-[-10px]'); // Adjust translate Y if needed
  });

  // Hide notification after 2 seconds
  setTimeout(() => {
    notification.classList.remove('opacity-100', 'translate-y-[-10px]');
    notification.classList.add('opacity-0');
    notification.addEventListener(
      'transitionend',
      () => notification.remove(),
      { once: true }
    );
  }, 2000);
}

// Update action buttons state
function updateActionButtons() {
  const hasSelectedTabs = tabs.some((tab) => tab.selected);
  copySelectedBtn.disabled = !hasSelectedTabs;
  copyFormatToggle.disabled = !hasSelectedTabs;
}

// Set theme
function setTheme(dark: boolean) {
  const htmlElement = document.documentElement;
  // Get icons within the specific button
  const sunIconElement = themeToggleButton?.querySelector('.sun-icon');
  const moonIconElement = themeToggleButton?.querySelector('.moon-icon');

  if (dark) {
    htmlElement.classList.add('dark');
    sunIconElement?.classList.remove('hidden');
    moonIconElement?.classList.add('hidden');
  } else {
    htmlElement.classList.remove('dark');
    sunIconElement?.classList.add('hidden');
    moonIconElement?.classList.remove('hidden');
  }
  isDarkMode = dark;
}

function updateFormatMenuVisuals() {
  if (!copyFormatMenu || !copyButtonText) return;

  const allFormatItems = copyFormatMenu.querySelectorAll('.copy-format-item');
  allFormatItems.forEach((item) => {
    const checkmark = item.querySelector(
      '.format-checkmark'
    ) as HTMLElement | null;
    const itemFormat = item.getAttribute('data-format');

    // Define selected background classes (matching neutral hover state from HTML)
    const selectedBgClasses = ['bg-neutral-100', 'dark:bg-neutral-700/50'];

    if (checkmark) {
      if (itemFormat === selectedCopyFormat) {
        checkmark.classList.remove('hidden');
        item.classList.add(...selectedBgClasses);
      } else {
        checkmark.classList.add('hidden');
        item.classList.remove(...selectedBgClasses);
      }
    }
  });

  // Update main button text
  let buttonText = 'Copy URLs'; // Default
  switch (selectedCopyFormat) {
    case 'markdown':
      buttonText = 'Copy Markdown';
      break;
    case 'json':
      buttonText = 'Copy JSON';
      break;
  }
  copyButtonText.textContent = buttonText;
}

// Set up all event listeners
function setupEventListeners() {
  // Search input
  searchInput.addEventListener('input', () => {
    applyFiltersAndRender();
  });

  // Settings/Theme toggle
  themeToggleButton.addEventListener('click', async () => {
    isDarkMode = !isDarkMode;
    setTheme(isDarkMode);
    await saveThemePreference();
  });

  selectAllCheckbox.addEventListener('change', toggleSelectAll);

  if (selectAllVisual) {
    selectAllVisual.addEventListener('click', () => {
      selectAllCheckbox.checked = !selectAllCheckbox.checked;
      toggleSelectAll();
    });
  } else {
    console.error(
      'Could not find visual div #select-all-visual for click listener'
    );
  }

  // Filter Button Clicks
  filterButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      const newFilter = button.id.replace('filter-', '') as typeof activeFilter;
      if (newFilter !== activeFilter) {
        activeFilter = newFilter;
        applyFilterStyles();
        await saveFilterSettings();
        applyFiltersAndRender();
      }
    });
  });

  // Group by Domain Toggle
  groupDomainToggle.addEventListener('click', async () => {
    isGroupingEnabled = !isGroupingEnabled;
    updateToggleVisuals(groupDomainToggle, isGroupingEnabled);
    await saveFilterSettings();
    applyFiltersAndRender();
  });

  // --- Copy Format Dropdown Logic --- (Restored)
  copyFormatToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isExpanded =
      copyFormatToggle.getAttribute('aria-expanded') === 'true';
    copyFormatMenu.classList.toggle('hidden', isExpanded);
    copyFormatToggle.setAttribute('aria-expanded', String(!isExpanded));
  });

  copyFormatMenu.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;
    const formatItem = target.closest('.copy-format-item');
    if (formatItem && formatItem.hasAttribute('data-format')) {
      e.preventDefault();
      const format = formatItem.getAttribute(
        'data-format'
      ) as typeof selectedCopyFormat;

      if (format !== selectedCopyFormat) {
        selectedCopyFormat = format;
        updateFormatMenuVisuals(); // Update visuals (checkmark, highlight, button text)
        await saveFormatPreference(); // Save the newly selected format
      }

      // Hide menu
      copyFormatMenu.classList.add('hidden');
      copyFormatToggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Close dropdown if clicking outside
  document.addEventListener('click', (e) => {
    if (
      copyFormatToggle && // Check if toggle exists
      copyFormatMenu && // Check if menu exists
      !copyFormatToggle.contains(e.target as Node) &&
      !copyFormatMenu.contains(e.target as Node)
    ) {
      copyFormatMenu.classList.add('hidden');
      copyFormatToggle.setAttribute('aria-expanded', 'false');
    }
  });
  // --- End Copy Format Dropdown Logic ---

  // --- Filter Dropdown Logic ---
  if (filterButton && filterMenu) {
    filterButton.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent click from immediately closing the menu
      filterMenu.classList.toggle('hidden');
      const isExpanded = !filterMenu.classList.contains('hidden');
      filterButton.setAttribute('aria-expanded', String(isExpanded));
    });
  } else {
    console.error('Filter button or menu not found');
  }

  // Main Copy Button Click (Restored, targets #copy-selected)
  copySelectedBtn.addEventListener('click', async () => {
    const selectedTabs = tabs.filter((tab) => tab.selected);
    if (selectedTabs.length === 0) return;

    let textToCopy = '';
    let formatDesc = '';

    switch (selectedCopyFormat) {
      case 'markdown':
        textToCopy = formatUrlsMarkdown(selectedTabs);
        formatDesc = 'Markdown';
        break;
      case 'json':
        textToCopy = formatUrlsJson(selectedTabs);
        formatDesc = 'JSON';
        break;
      case 'plain':
      default:
        textToCopy = formatUrlsPlain(selectedTabs);
        formatDesc = 'URLs';
        break;
    }

    const success = await copyToClipboard(textToCopy);

    if (success) {
      showNotification(`Selected ${formatDesc} copied`);
    } else {
      showNotification(`Failed to copy ${formatDesc}`);
    }

    // Hide dropdown after copying
    copyFormatMenu.classList.add('hidden');
    copyFormatToggle.setAttribute('aria-expanded', 'false');
  });

  // Tab container delegation (Clicking on tabs, copy icons)
  tabsContainer.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;

    // --- Handle Group Checkbox Click ---
    const groupVisualCheckbox = target.closest('.group-checkbox-visual');
    if (
      groupVisualCheckbox &&
      groupVisualCheckbox.hasAttribute('data-domain')
    ) {
      const domain = groupVisualCheckbox.getAttribute('data-domain')!;
      const groupInputElement = tabsContainer.querySelector(
        `input.group-checkbox-input[data-domain="${domain}"]`
      ) as HTMLInputElement | null;

      if (groupInputElement) {
        // Determine if we should select all (true) or deselect all (false)
        // If it's currently checked, we deselect. Otherwise (unchecked or indeterminate), we select.
        const shouldSelect =
          !groupInputElement.checked || groupInputElement.indeterminate;

        let changed = false;
        tabs.forEach((tab) => {
          let tabDomain = 'Other';
          try {
            const url = new URL(tab.url);
            if (url.hostname) {
              tabDomain = url.hostname.replace(/^www\./i, '');
            }
          } catch {}

          if (tabDomain === domain) {
            if (tab.selected !== shouldSelect) {
              tab.selected = shouldSelect;
              changed = true;
            }
          }
        });

        if (changed) {
          applyFiltersAndRender(); // Re-render everything to update states
          updateSelectionCount();
          updateSelectAllCheckbox();
        }
      }
      return; // Don't process further tab clicks
    }

    // --- Existing Tab Item Click Logic ---
    const tabItem = target.closest('[data-tab-id]') as HTMLElement;
    if (!tabItem) return;

    const tabId = parseInt(tabItem.dataset.tabId || '0', 10);
    if (!tabId) return;

    // Handle individual tab checkbox click
    if (
      target.matches('input[type="checkbox"]:not(.group-checkbox-input)') || // Exclude group inputs
      target.matches('.w-4.h-4.border-2') // Target the visual checkbox div for individual tabs
    ) {
      toggleTabSelection(tabId, e.shiftKey);
      return; // Prevent any further action like switching
    }

    // Handle copy button click
    const copyButton = target.closest(
      'button[title="Copy URL"]'
    ) as HTMLButtonElement | null;

    if (copyButton) {
      // Check if the clicked element is the copy button or inside it
      const tab = tabs.find((t) => t.id === tabId);
      if (tab) {
        try {
          await copyToClipboard(tab.url);
          // --- Icon Swap Logic ---
          const originalIconHTML = copyButton.innerHTML; // Store original SVG
          // Create SVG element programmatically
          const checkmarkSVG = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'svg'
          );
          checkmarkSVG.setAttribute('viewBox', '0 0 24 24');
          checkmarkSVG.setAttribute('class', 'w-4 h-4 text-green-500');
          checkmarkSVG.setAttribute('fill', 'none');
          checkmarkSVG.setAttribute('stroke', 'currentColor');
          checkmarkSVG.setAttribute('stroke-width', '2');
          checkmarkSVG.setAttribute('stroke-linecap', 'round');
          checkmarkSVG.setAttribute('stroke-linejoin', 'round');

          // Create polyline element
          const polyline = document.createElementNS(
            'http://www.w3.org/2000/svg',

            'polyline'
          );
          polyline.setAttribute('points', '20 6 9 17 4 12');

          // Append polyline to SVG
          checkmarkSVG.appendChild(polyline);
          copyButton.innerHTML = checkmarkSVG.outerHTML; // Show checkmark
          copyButton.disabled = true; // Briefly disable button

          // Restore the icon after a delay
          setTimeout(() => {
            if (copyButton) {
              // Check if button still exists
              copyButton.innerHTML = originalIconHTML; // Restore original SVG
              copyButton.disabled = false; // Re-enable button
            }
          }, 1500); // 1.5 seconds delay
        } catch (err) {
          console.error('Failed to copy URL:', err);
          showNotification('Failed to copy URL'); // Show error notification
        }
      }
      return; // Prevent any further action like switching
    }
  });

  // Add context menu listener for switching tabs
  tabsContainer.addEventListener('contextmenu', (e) => {
    const target = e.target as HTMLElement;
    const tabItem = target.closest('[data-tab-id]') as HTMLElement;

    if (tabItem && tabItem.dataset.tabId) {
      e.preventDefault(); // Prevent default context menu
      const tabId = parseInt(tabItem.dataset.tabId, 10);
      if (!isNaN(tabId)) {
        switchToTab(tabId);
      }
    }
    // If not clicking on a tab item, the default context menu will show as usual
  });

  // Hide Pinned Toggle Listener
  if (hidePinnedToggle) {
    hidePinnedToggle.addEventListener('click', async () => {
      isHidePinnedEnabled = !isHidePinnedEnabled;
      updateToggleVisuals(hidePinnedToggle, isHidePinnedEnabled);
      await saveFilterSettings();
      applyFiltersAndRender();
    });
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Close dropdowns if clicking outside
document.addEventListener('click', (e) => {
  // Close Filter Menu
  if (
    filterMenu &&
    filterButton &&
    !filterMenu.classList.contains('hidden') &&
    !filterButton.contains(e.target as Node) &&
    !filterMenu.contains(e.target as Node)
  ) {
    filterMenu.classList.add('hidden');
    filterButton.setAttribute('aria-expanded', 'false');
  }

  // Close Copy Format Menu (Existing logic)
  if (
    copyFormatMenu &&
    copyFormatToggle &&
    !copyFormatMenu.classList.contains('hidden') &&
    !copyFormatToggle.contains(e.target as Node) &&
    !copyFormatMenu.contains(e.target as Node)
  ) {
    copyFormatMenu.classList.add('hidden');
    copyFormatToggle.setAttribute('aria-expanded', 'false');
  }
});

// Function to control the enabled/disabled state of the Hide Pinned setting within the dropdown
function updateHidePinnedVisibility() {
  if (hidePinnedSettingContainer && hidePinnedToggle && hidePinnedLabel) {
    if (activeFilter === 'all') {
      // Enable the setting
      hidePinnedSettingContainer.classList.remove(
        'opacity-50',
        'pointer-events-none'
      );
      hidePinnedToggle.disabled = false;
      hidePinnedToggle.classList.remove('dark:bg-neutral-700');
      hidePinnedToggle.classList.add('bg-indigo-600');
      hidePinnedToggle
        .querySelector('span[aria-hidden="true"]')
        ?.classList.replace('translate-x-0', 'translate-x-4');
      hidePinnedLabel.classList.remove('cursor-not-allowed');
      hidePinnedLabel.classList.remove('opacity-30');
      hidePinnedToggle.classList.remove('opacity-30');
      hidePinnedLabel.classList.add('cursor-pointer');
    } else {
      // Disable the setting
      hidePinnedSettingContainer.classList.add(
        'opacity-50',
        'pointer-events-none'
      );
      hidePinnedToggle.disabled = true;
      hidePinnedToggle.setAttribute('aria-checked', 'false');
      hidePinnedToggle.classList.replace('bg-indigo-600', 'bg-neutral-200');
      hidePinnedToggle.classList.add('dark:bg-neutral-700');
      hidePinnedToggle
        .querySelector('span[aria-hidden="true"]')
        ?.classList.replace('translate-x-4', 'translate-x-0');

      hidePinnedLabel.classList.add('cursor-not-allowed');
      hidePinnedLabel.classList.add('opacity-30');
      hidePinnedToggle.classList.add('opacity-30');
      hidePinnedLabel.classList.remove('cursor-pointer');
    }
  }
}

// --- Settings Persistence ---
async function loadFilterSettings() {
  try {
    const result = await browser.storage.local.get(SETTINGS_STORAGE_KEY);
    const savedSettings = result[SETTINGS_STORAGE_KEY];
    if (savedSettings) {
      activeFilter = savedSettings.activeFilter ?? 'all';
      isGroupingEnabled = savedSettings.isGroupingEnabled ?? false;
      isHidePinnedEnabled = savedSettings.isHidePinnedEnabled ?? false;
    }
    // If no settings saved or keys are missing, defaults are already set
  } catch (error) {
    console.error('Error loading filter settings:', error);
    // Keep default settings if loading fails
  }
}

async function saveFilterSettings() {
  const settings = {
    activeFilter,
    isGroupingEnabled,
    isHidePinnedEnabled,
  };
  try {
    await browser.storage.local.set({ [SETTINGS_STORAGE_KEY]: settings });
  } catch (error) {
    console.error('Error saving filter settings:', error);
  }
}

// New function to load format preference
async function loadFormatPreference() {
  const storedPreference = await browser.storage.local.get(
    FORMAT_PREFERENCE_KEY
  );
  if (storedPreference[FORMAT_PREFERENCE_KEY]) {
    selectedCopyFormat = storedPreference[FORMAT_PREFERENCE_KEY];
  }
}

// New function to save format preference
async function saveFormatPreference() {
  await browser.storage.local.set({
    [FORMAT_PREFERENCE_KEY]: selectedCopyFormat,
  });
}

// Helper to update toggle visuals based on state
function updateToggleVisuals(
  toggleButton: HTMLButtonElement | null,
  isEnabled: boolean
) {
  if (!toggleButton) return;
  const toggleSpan = toggleButton.querySelector('span[aria-hidden="true"]');
  toggleButton.setAttribute('aria-checked', String(isEnabled));
  if (isEnabled) {
    toggleButton.classList.replace('bg-neutral-200', 'bg-indigo-600');
    toggleButton.classList.replace('dark:bg-neutral-700', 'bg-indigo-600');
    toggleSpan?.classList.replace('translate-x-0', 'translate-x-4');
  } else {
    toggleButton.classList.replace('bg-indigo-600', 'bg-neutral-200');
    toggleButton.classList.add('dark:bg-neutral-700');
    toggleSpan?.classList.replace('translate-x-4', 'translate-x-0');
  }
}

// Tooltip
const archiveRestoreIcon = document.getElementById('archive-restore-icon');
const archiveRestoreTooltip = document.getElementById(
  'archive-restore-tooltip'
);

if (archiveRestoreIcon && archiveRestoreTooltip) {
  archiveRestoreIcon.addEventListener('mouseenter', () => {
    archiveRestoreTooltip.classList.remove('invisible');
    archiveRestoreTooltip.classList.add('visible');
    archiveRestoreTooltip.classList.remove('opacity-0');
    archiveRestoreTooltip.classList.add('opacity-100');
  });

  archiveRestoreIcon.addEventListener('mouseleave', () => {
    archiveRestoreTooltip.classList.add('invisible');
    archiveRestoreTooltip.classList.remove('visible');
    archiveRestoreTooltip.classList.add('opacity-0');
    archiveRestoreTooltip.classList.remove('opacity-100');
  });
}

// --- Load Theme Preference ---
async function loadThemePreference() {
  try {
    const result = await browser.storage.local.get(THEME_PREFERENCE_KEY);
    const savedTheme = result[THEME_PREFERENCE_KEY];
    if (savedTheme !== undefined) {
      // Check if a theme was explicitly saved
      isDarkMode = savedTheme;
    }
    // If no theme saved, isDarkMode retains its system-preference-based value set in init()
  } catch (error) {
    console.error('Error loading theme preference:', error);
    // Keep default (system preference) if loading fails
  }
}

// --- Save Theme Preference ---
async function saveThemePreference() {
  try {
    await browser.storage.local.set({ [THEME_PREFERENCE_KEY]: isDarkMode });
  } catch (error) {
    console.error('Error saving theme preference:', error);
  }
}
