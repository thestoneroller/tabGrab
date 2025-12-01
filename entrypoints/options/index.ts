import {
  CLIPBOARD_SETTINGS_STORAGE_KEY,
  FORMAT_TEMPLATES_STORAGE_KEY,
  DEFAULT_FORMAT_TEMPLATES,
} from "../../constants";
import { updateToggleVisuals } from "../../utils";
import { highlightActiveLink } from "../../utils";

const copyTitleToggle = document.getElementById(
  "copy-title-toggle"
) as HTMLButtonElement;

const plainTemplateTextarea = document.getElementById(
  "plain-template"
) as HTMLTextAreaElement;

const resetTemplatesButton = document.getElementById(
  "reset-templates-button"
) as HTMLButtonElement;

const titleWarning = document.getElementById("title-warning") as HTMLDivElement;
const typoWarning = document.getElementById("typo-warning") as HTMLDivElement;

let clipboardSettings: ClipboardSettings = {
  copyTitleEnabled: false,
};

let formatTemplates = { ...DEFAULT_FORMAT_TEMPLATES };

document.addEventListener("DOMContentLoaded", init);

async function init() {
  await loadOptionsSettings();
  setupEventListeners();
  highlightActiveLink();
  updatePlaceholders();
  checkTitleWarning();
  checkTemplateTypos();
}

function setupEventListeners() {
  copyTitleToggle.addEventListener("click", async () => {
    await saveOptionsSettings();
    updatePlaceholders(true);
    checkTitleWarning();
  });
  plainTemplateTextarea.addEventListener("input", () => {
    saveFormatTemplates();
    checkTitleWarning();
    checkTemplateTypos();
  });
  resetTemplatesButton.addEventListener("click", resetToDefaults);
}

function updatePlaceholders(updateValue = false) {
  const onTemplate = "{TITLE} - {URL}";
  const offTemplate = "{URL}";

  if (clipboardSettings.copyTitleEnabled) {
    plainTemplateTextarea.placeholder = onTemplate;
    if (updateValue && plainTemplateTextarea.value === offTemplate) {
      plainTemplateTextarea.value = onTemplate;
      saveFormatTemplates();
    }
  } else {
    plainTemplateTextarea.placeholder = offTemplate;
    if (updateValue && plainTemplateTextarea.value === onTemplate) {
      plainTemplateTextarea.value = offTemplate;
      saveFormatTemplates();
    }
  }
}

function checkTitleWarning() {
  const templateHasTitle = plainTemplateTextarea.value.includes("{TITLE}");
  const toggleIsOff = !clipboardSettings.copyTitleEnabled;

  if (templateHasTitle && toggleIsOff && titleWarning) {
    titleWarning.classList.remove("hidden");
  } else if (titleWarning) {
    titleWarning.classList.add("hidden");
  }
}

function checkTemplateTypos() {
  const val = plainTemplateTextarea.value;

  // 1. Check for double braces {{TITLE}} or {{URL}}
  const hasDoubleBraces = /\{\{(?:TITLE|URL)\}\}/i.test(val);

  // 2. Check for malformed single braces (wrong case or spaces)
  // Find all matches that look like {title} or {url} with any casing/spacing
  const matches = val.match(/\{\s*(?:title|url)\s*\}/gi) || [];
  const hasMalformedSingleBraces = matches.some(
    (m) => m !== "{TITLE}" && m !== "{URL}"
  );

  if ((hasDoubleBraces || hasMalformedSingleBraces) && typoWarning) {
    typoWarning.classList.remove("hidden");
  } else if (typoWarning) {
    typoWarning.classList.add("hidden");
  }
}

async function loadOptionsSettings() {
  try {
    const result = await browser.storage.local.get([
      CLIPBOARD_SETTINGS_STORAGE_KEY,
      FORMAT_TEMPLATES_STORAGE_KEY,
    ]);
    const savedSettings = result[CLIPBOARD_SETTINGS_STORAGE_KEY];
    const savedTemplates = result[FORMAT_TEMPLATES_STORAGE_KEY];

    if (savedSettings) {
      clipboardSettings = savedSettings;
      updateToggleVisuals(copyTitleToggle, clipboardSettings.copyTitleEnabled);
    }

    if (savedTemplates) {
      formatTemplates = { ...DEFAULT_FORMAT_TEMPLATES, ...savedTemplates };
    }

    plainTemplateTextarea.value = formatTemplates.plain;
  } catch (error) {
    console.error("Error loading clipboard settings:", error);
  }
}

async function saveOptionsSettings() {
  try {
    clipboardSettings.copyTitleEnabled = !clipboardSettings.copyTitleEnabled;
    updateToggleVisuals(copyTitleToggle, clipboardSettings.copyTitleEnabled);
    await browser.storage.local.set({
      [CLIPBOARD_SETTINGS_STORAGE_KEY]: clipboardSettings,
    });
  } catch (error) {
    console.error("Error saving clipboard settings:", error);
  }
}

async function saveFormatTemplates() {
  try {
    formatTemplates = {
      plain: plainTemplateTextarea.value,
    };
    await browser.storage.local.set({
      [FORMAT_TEMPLATES_STORAGE_KEY]: formatTemplates,
    });
  } catch (error) {
    console.error("Error saving format templates:", error);
  }
}

async function resetToDefaults() {
  formatTemplates = { ...DEFAULT_FORMAT_TEMPLATES };
  plainTemplateTextarea.value = formatTemplates.plain;
  await saveFormatTemplates();
}
