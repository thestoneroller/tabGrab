import { CLIPBOARD_SETTINGS_STORAGE_KEY } from '../../constants';
import { updateToggleVisuals } from '../../utils';

const copyTitleToggle = document.getElementById(
  'copy-title-toggle'
) as HTMLButtonElement;

let clipboardSettings: ClipboardSettings = {
  copyTitleEnabled: false,
};

document.addEventListener('DOMContentLoaded', init);

async function init() {

  await loadOptionsSettings();
  setupEventListeners();
}

function setupEventListeners() {
  copyTitleToggle.addEventListener('click', saveOptionsSettings);
}

async function loadOptionsSettings() {
  try {
    const result = await browser.storage.local.get(CLIPBOARD_SETTINGS_STORAGE_KEY);
    const savedSettings = result[CLIPBOARD_SETTINGS_STORAGE_KEY];
    if (savedSettings) {
      clipboardSettings = savedSettings;
      updateToggleVisuals(copyTitleToggle, clipboardSettings.copyTitleEnabled);
    }
   
  } catch (error) {
    console.error('Error loading clipboard settings:', error);
  }
}

async function saveOptionsSettings() {
  try {
    clipboardSettings.copyTitleEnabled = !clipboardSettings.copyTitleEnabled;
    updateToggleVisuals(copyTitleToggle, clipboardSettings.copyTitleEnabled);
    await browser.storage.local.set({ [CLIPBOARD_SETTINGS_STORAGE_KEY]: clipboardSettings });
  } catch (error) {
    console.error('Error saving clipboard settings:', error);
  }
}