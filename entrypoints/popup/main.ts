interface TabItem {
  id: number;
  title: string;
  url: string;
  favIconUrl?: string;
  selected: boolean;
  active: boolean;
}

// State management
let tabs: TabItem[] = [];
let filteredTabs: TabItem[] = [];
let isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
let selectedCopyFormat: 'plain' | 'markdown' | 'json' = 'plain'; // Default format
let lastClickedTabId: number | null = null; // Add this line
let shiftNotificationShown = false; // Add this flag

// DOM Elements
const searchInput = document.getElementById('search-input') as HTMLInputElement;
const tabsContainer = document.getElementById(
  'tabs-container'
) as HTMLDivElement;
const themeToggle = document.getElementById(
  'theme-toggle'
) as HTMLButtonElement;
const copySelectedBtn = document.getElementById(
  'copy-selected'
) as HTMLButtonElement;
const selectAllCheckbox = document.getElementById(
  'select-all-checkbox'
) as HTMLInputElement;
const selectionCount = document.getElementById(
  'selection-count'
) as HTMLSpanElement;
const sunIcon = document.querySelector('.sun-icon') as SVGElement;
const moonIcon = document.querySelector('.moon-icon') as SVGElement;
const copyFormatToggle = document.getElementById(
  'copy-format-toggle'
) as HTMLButtonElement;
const copyFormatMenu = document.getElementById(
  'copy-format-menu'
) as HTMLDivElement;
const copyButtonText = document.getElementById(
  'copy-button-text'
) as HTMLSpanElement; // Get span for button text

// Initialize the app
async function init() {
  // Set initial theme based on system preference or saved preference
  // You might want to save the theme preference in storage
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  // Example: const savedTheme = await browser.storage.local.get('theme');
  // isDarkMode = savedTheme.theme === 'dark' || (!savedTheme.theme && prefersDark);
  isDarkMode = prefersDark; // Simplified for now
  setTheme(isDarkMode);

  // Load tabs
  await loadTabs();

  // Set initial visual state for the dropdown
  updateFormatMenuVisuals();

  // Set up event listeners
  setupEventListeners();
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
    active: tab.active,
  }));

  filteredTabs = [...tabs];
  renderTabs();
  updateSelectionCount();
  updateSelectAllCheckbox();
}

// Render tabs to the DOM
function renderTabs() {
  tabsContainer.innerHTML = '';

  if (filteredTabs.length === 0) {
    tabsContainer.innerHTML = `
      <div class="flex flex-col items-center justify-center py-8 text-neutral-500 dark:text-neutral-400">
        <svg class="w-10 h-10 mb-2 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        No tabs found matching your search
      </div>
    `;
    return;
  }

  filteredTabs.forEach((tab) => {
    const tabElement = document.createElement('div');
    // Apply base classes and conditional classes for selection
    const baseClasses =
      'flex items-center p-2 rounded-xl border transition-colors duration-200';
    const selectedClasses =
      'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-500/30';
    const defaultClasses =
      'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700/60';
    tabElement.className = `${baseClasses} ${
      tab.selected ? selectedClasses : defaultClasses
    }`;
    tabElement.dataset.tabId = tab.id.toString();

    // Create a favicon placeholder with the first letter of the domain if no favicon
    let faviconHtml = '';
    if (tab.favIconUrl) {
      faviconHtml = `<img class="w-4 h-4 mx-2 rounded object-contain flex-shrink-0" src="${tab.favIconUrl}" alt="">`;
    } else {
      // Extract domain first letter for the placeholder
      let firstLetter = 'T';
      try {
        const url = new URL(tab.url);
        // Ensure hostname exists and is not empty before getting the first letter
        if (url.hostname && url.hostname.length > 0) {
          firstLetter = url.hostname.charAt(0).toUpperCase();
        }
      } catch (e) {
        // Use default 'T' if URL parsing fails or hostname is invalid
        console.warn(`Could not parse URL for favicon placeholder: ${tab.url}`);
      }
      // Use amber for the placeholder background/text
      faviconHtml = `<div class="w-4 h-4 mx-2 rounded flex items-center justify-center bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 text-xs font-bold flex-shrink-0">${firstLetter}</div>`;
    }

    tabElement.innerHTML = `
      <input type="checkbox" class="sr-only peer" ${
        tab.selected ? 'checked' : ''
      }>
      <div class="w-4 h-4 border-2 border-neutral-300 dark:border-neutral-700 rounded peer-checked:bg-amber-500 peer-checked:border-amber-500 relative peer-checked:after:content-[''] peer-checked:after:absolute peer-checked:after:left-[4px] peer-checked:after:top-[0px] peer-checked:after:w-[5px] peer-checked:after:h-[9px] peer-checked:after:border-white peer-checked:after:border-r-2 peer-checked:after:border-b-2 peer-checked:after:rotate-45 cursor-pointer flex-shrink-0"></div>
      ${faviconHtml}
      <div class="flex-1 min-w-0 mr-2">
        <div class="text-sm  truncate text-neutral-900 dark:text-neutral-100" title="${escapeHtml(
          tab.title
        )}">${escapeHtml(tab.title)}</div>
        <div class="text-xs text-neutral-500 dark:text-neutral-400/80 truncate" title="${escapeHtml(
          tab.url
        )}">${escapeHtml(
      tab.url.replace(/^https?:\/\//i, '').replace(/\/$/, '')
    )}</div>
      </div>
      <button class="p-1 text-neutral-500 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400  rounded transition-colors duration-200 cursor-pointer flex-shrink-0" title="Copy URL">
        <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </button>
    `;

    tabsContainer.appendChild(tabElement);
  });

  updateActionButtons();
}

// Filter tabs based on search input
function filterTabs(query: string) {
  if (!query) {
    filteredTabs = [...tabs];
  } else {
    const lowerQuery = query.toLowerCase();
    filteredTabs = tabs.filter(
      (tab) =>
        tab.title.toLowerCase().includes(lowerQuery) ||
        tab.url.toLowerCase().includes(lowerQuery)
    );
  }
  renderTabs();
}

// Update selection count
function updateSelectionCount() {
  // Count selected tabs from the main 'tabs' array for the global count
  const selectedCount = tabs.filter((tab) => tab.selected).length;
  selectionCount.textContent = `${selectedCount}`;
  // Also update the main copy button state
  updateActionButtons();
}

// Update select all checkbox state (including visual representation)
function updateSelectAllCheckbox() {
  const visualCheckbox = document.getElementById('select-all-visual');
  // Ensure both the actual checkbox and the visual div exist
  if (!selectAllCheckbox || !visualCheckbox) {
    console.error('Select All checkbox or visual element not found');
    return;
  }

  // --- Reset visual state first ---
  visualCheckbox.classList.remove('indeterminate');
  // REMOVE the explicit style removals via JS - CSS will handle overrides
  // visualCheckbox.classList.remove('bg-amber-500', 'border-amber-500');

  // --- Determine state based on *filtered* tabs ---
  if (filteredTabs.length === 0) {
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = false;
    return; // Visual state is handled by resetting above
  }

  // Count selected tabs within the *currently filtered* list
  const selectedInFiltered = filteredTabs.filter((tab) => tab.selected).length;

  // --- Set state ---
  if (selectedInFiltered === 0) {
    // None selected in the filtered list
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = false;
  } else if (selectedInFiltered === filteredTabs.length) {
    // All selected in the filtered list
    selectAllCheckbox.checked = true;
    selectAllCheckbox.indeterminate = false;
    // Visual state is handled by peer-checked
  } else {
    // Some (but not all) selected in the filtered list
    selectAllCheckbox.checked = false; // Input is not checked when indeterminate
    selectAllCheckbox.indeterminate = true;

    // --- Apply indeterminate visual style ---
    visualCheckbox.classList.add('indeterminate');
    // REMOVE the explicit style additions via JS - CSS handles this now
    // visualCheckbox.classList.add('bg-amber-500', 'border-amber-500');
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

  renderTabs(); // Re-render the list based on updated states
  updateSelectionCount(); // Update counter and button state
  updateSelectAllCheckbox(); // Ensure checkbox state (incl. indeterminate) is correct
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
    shiftNotificationShown = true; // Set flag so it doesn't show again
    // REMOVED: return; // Allow the selection to proceed
  }

  // --- Proceed with toggle regardless of the notification ---
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
      'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-500/30';
    const defaultClasses =
      'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700/60';
    tabElement.className = `${baseClasses} ${
      isSelected ? selectedClasses : defaultClasses
    }`;
  } else {
    // Fallback to full render if element not found (less efficient)
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
  if (mainTabIndex === -1) return; // Should not happen if filteredTabs is correct

  if (shiftKey && lastClickedTabId !== null && lastClickedTabId !== tabId) {
    // --- Shift-Click Range Selection ---
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
      // Update last clicked only if toggle happened (check state *after*)
      // Need isSelecting from the context where this is called
      // Re-evaluate how to update lastClickedTabId correctly here if needed,
      // but for now, let's assume the logic below handles it.
      lastClickedTabId = tabId;
    }
  } else {
    // --- Normal Click ---
    const wasSelectingInitially = !tabs[mainTabIndex].selected; // Check intent *before* toggle
    performSingleToggle(mainTabIndex, currentTabIndexInFiltered);
    // Update lastClickedTabId if it was a successful selection or any deselection
    if (tabs[mainTabIndex].selected || !wasSelectingInitially) {
      lastClickedTabId = tabId;
    }
  }

  // Update counts and master checkbox after any selection change attempt
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

// --- Formatting Functions ---
function formatUrlsPlain(selectedTabs: TabItem[]): string {
  return selectedTabs.map((tab) => tab.url).join('\n');
}

function formatUrlsMarkdown(selectedTabs: TabItem[]): string {
  return selectedTabs.map((tab) => `[${tab.title}](${tab.url})`).join('\n');
}

function formatUrlsJson(selectedTabs: TabItem[]): string {
  const data = selectedTabs.map((tab) => ({ title: tab.title, url: tab.url }));
  return JSON.stringify(data, null, 2); // Pretty print JSON
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
  // Use neutral-800 for dark background, amber-500 for light background
  notification.className =
    'notification fixed bottom-5 left-1/2 transform -translate-x-1/2 bg-amber-500 dark:bg-neutral-800 text-white dark:text-neutral-100 px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 opacity-0 transition-all duration-300 ease-out z-50 text-sm';

  const checkIcon = document.createElement('span');
  // Ensure icon stroke contrasts with background
  checkIcon.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;

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
    // Remove the element after the transition completes
    notification.addEventListener(
      'transitionend',
      () => notification.remove(),
      { once: true }
    );
  }, 2000);
}

// Update action buttons state (including dropdown toggle)
function updateActionButtons() {
  const hasSelectedTabs = tabs.some((tab) => tab.selected);
  copySelectedBtn.disabled = !hasSelectedTabs;
  copyFormatToggle.disabled = !hasSelectedTabs; // Also disable dropdown toggle
}

// Set theme
function setTheme(dark: boolean) {
  const htmlElement = document.documentElement;
  const themeToggleButton = document.getElementById('theme-toggle');
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
  // Update global variable
  isDarkMode = dark;
}

// Helper function to escape HTML
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// --- Helper function to update dropdown visuals ---
function updateFormatMenuVisuals() {
  const allFormatItems = copyFormatMenu.querySelectorAll('.copy-format-item');
  allFormatItems.forEach((item) => {
    const checkmark = item.querySelector(
      '.format-checkmark'
    ) as HTMLElement | null;
    const itemFormat = item.getAttribute('data-format');

    // Define selected background classes (matching hover state)
    const selectedBgClasses = ['bg-amber-100', 'dark:bg-amber-900/50'];

    if (checkmark) {
      if (itemFormat === selectedCopyFormat) {
        checkmark.classList.remove('hidden'); // Show checkmark for selected
        item.classList.add(...selectedBgClasses); // Add selected background
      } else {
        checkmark.classList.add('hidden'); // Hide checkmark for others
        item.classList.remove(...selectedBgClasses); // Remove selected background
      }
    }
  });

  // Update main button text
  let buttonText = 'Copy Selected';
  switch (selectedCopyFormat) {
    case 'markdown':
      buttonText = 'Copy Markdown';
      break;
    case 'json':
      buttonText = 'Copy JSON';
      break;
    case 'plain':
      buttonText = 'Copy URLs';
      break;
  }
  copyButtonText.textContent = buttonText;
}

// Set up all event listeners
function setupEventListeners() {
  // Search input
  searchInput.addEventListener('input', () => {
    filterTabs(searchInput.value);
    // Also update select all checkbox state when filtering
    updateSelectAllCheckbox();
  });

  // Theme toggle
  themeToggle.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    setTheme(isDarkMode);
    // Persist theme preference if desired
    // browser.storage.local.set({ theme: isDarkMode ? 'dark' : 'light' });
  });

  // Listener for the actual checkbox (e.g., triggered by label click, accessibility tools)
  // This handles cases where the input's state changes directly.
  selectAllCheckbox.addEventListener('change', toggleSelectAll);

  // Listener for clicking the visual representation (#select-all-visual)
  const visualCheckbox = document.getElementById('select-all-visual');
  if (visualCheckbox) {
    visualCheckbox.addEventListener('click', () => {
      // 1. Manually toggle the hidden checkbox's state since clicking the div doesn't do it automatically.
      selectAllCheckbox.checked = !selectAllCheckbox.checked;
      // 2. Manually call the handler function. Programmatically changing .checked
      //    does NOT fire the 'change' event, so we need to call our logic directly.
      toggleSelectAll();
    });
  } else {
    console.error(
      'Could not find visual div #select-all-visual for click listener'
    );
  }

  // --- Copy Format Dropdown Logic ---
  copyFormatToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isExpanded =
      copyFormatToggle.getAttribute('aria-expanded') === 'true';
    copyFormatMenu.classList.toggle('hidden', isExpanded);
    copyFormatToggle.setAttribute('aria-expanded', String(!isExpanded));
  });

  copyFormatMenu.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const formatItem = target.closest('.copy-format-item');
    if (formatItem && formatItem.hasAttribute('data-format')) {
      e.preventDefault();
      const format = formatItem.getAttribute(
        'data-format'
      ) as typeof selectedCopyFormat;

      // Update state only if format changed
      if (format !== selectedCopyFormat) {
        selectedCopyFormat = format;
        // Update visuals (checkmark, highlight, button text)
        updateFormatMenuVisuals();
      }

      // Hide menu
      copyFormatMenu.classList.add('hidden');
      copyFormatToggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Close dropdown if clicking outside
  document.addEventListener('click', (e) => {
    if (
      !copyFormatToggle.contains(e.target as Node) &&
      !copyFormatMenu.contains(e.target as Node)
    ) {
      copyFormatMenu.classList.add('hidden');
      copyFormatToggle.setAttribute('aria-expanded', 'false');
    }
  });
  // --- End Copy Format Dropdown Logic ---

  // Add filter button functionality
  const filterButtons = document.querySelectorAll('.filter-button');
  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      // Remove active classes from all buttons and reset default style
      filterButtons.forEach((btn) => {
        btn.classList.remove(
          'active',
          'bg-amber-100',
          'dark:bg-amber-900/50',
          'text-amber-600',
          'dark:text-amber-400',
          'hover:bg-amber-200',
          'dark:hover:bg-amber-800/60'
        );
        btn.classList.add(
          'bg-neutral-200',
          'dark:bg-neutral-800',
          'text-neutral-900',
          'dark:text-neutral-100',
          'hover:bg-amber-100',
          'dark:hover:bg-amber-900/50',
          'hover:text-amber-600',
          'dark:hover:text-amber-400'
        );
      });

      // Add active classes to the clicked button and remove default style
      button.classList.remove(
        'bg-neutral-200',
        'dark:bg-neutral-800',
        'text-neutral-900',
        'dark:text-neutral-100',
        'hover:bg-amber-100',
        'dark:hover:bg-amber-900/50',
        'hover:text-amber-600',
        'dark:hover:text-amber-400'
      );
      button.classList.add(
        'active',
        'bg-amber-100',
        'dark:bg-amber-900/50',
        'text-amber-600',
        'dark:text-amber-400',
        'hover:bg-amber-200',
        'dark:hover:bg-amber-800/60'
      );

      // Filter tabs based on button text
      const filterType = button.textContent?.trim().toLowerCase();
      const currentSearch = searchInput.value; // Keep current search query

      if (filterType === 'all') {
        filteredTabs = [...tabs];
      } else if (filterType === 'active') {
        filteredTabs = tabs.filter((tab) => tab.active);
      }

      // Re-apply search filter on top of type filter
      if (currentSearch) {
        const lowerQuery = currentSearch.toLowerCase();
        filteredTabs = filteredTabs.filter(
          (tab) =>
            tab.title.toLowerCase().includes(lowerQuery) ||
            tab.url.toLowerCase().includes(lowerQuery)
        );
      }

      renderTabs();
      updateSelectAllCheckbox(); // Update checkbox based on new filtered list
    });
  });

  // Tab container delegation
  tabsContainer.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;
    const tabItem = target.closest('[data-tab-id]') as HTMLElement;

    if (!tabItem) return;

    const tabId = parseInt(tabItem.dataset.tabId || '0', 10);
    if (!tabId) return;

    // Handle checkbox click (visual or hidden input)
    if (
      target.matches('input[type="checkbox"]') ||
      target.matches('.w-4.h-4.border-2') // Target the visual checkbox div
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
          const checkmarkSVG = `
            <svg viewBox="0 0 24 24" class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          `;
          copyButton.innerHTML = checkmarkSVG; // Show checkmark
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

    // --- REMOVED THE SWITCH TO TAB LOGIC ---
    // If the click was not on the checkbox or copy button, DO NOTHING by default.
    // Users can select/deselect using the checkbox and copy using the button.
    // Switching tabs is handled by the browser's native UI.

    /* --- OLD CODE THAT WAS REMOVED ---
    // If the click was not on the checkbox or copy button, switch to the tab
    try {
      await switchToTab(tabId);
      // Optionally close the popup after switching
      // window.close();
    } catch (err) {
      console.error(`Failed to switch to tab ${tabId}:`, err);
      // Maybe the tab was closed - reload list?
      await loadTabs();
    }
    */
    // --- END OF REMOVED CODE ---
  }); // End of tabsContainer listener

  // Copy selected URLs (Main Button)
  copySelectedBtn.addEventListener('click', async () => {
    const selectedTabs = tabs.filter((tab) => tab.selected);
    if (selectedTabs.length === 0) return;

    let textToCopy = '';
    let formatDesc = ''; // Description for notification

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
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
