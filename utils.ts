// --- Formatting Functions ---
function formatWithTemplate(selectedTabs: TabItem[], template: string): string {
  return selectedTabs
    .map((tab) => {
      return template.replace(/{TITLE}/g, tab.title).replace(/{URL}/g, tab.url);
    })
    .join("\n");
}

export function formatUrlsPlain(
  selectedTabs: TabItem[],
  clipboardSettings: ClipboardSettings,
  customTemplate?: string
): string {
  if (customTemplate) {
    const hasTitle = customTemplate.includes("{TITLE}");

    if (clipboardSettings?.copyTitleEnabled && !hasTitle) {
      return selectedTabs.map((tab) => `${tab.title} - ${tab.url}`).join("\n");
    }

    let effectiveTemplate = customTemplate;
    if (!clipboardSettings?.copyTitleEnabled) {
      effectiveTemplate = customTemplate
        .replace(/{TITLE}\s*[-–—:]\s*/g, "") // Remove title with common separators
        .replace(/[-–—:]\s*{TITLE}/g, "") // Remove title with preceding separators
        .replace(/{TITLE}\s*/g, "") // Remove title with trailing whitespace
        .replace(/\s*{TITLE}/g, "") // Remove title with leading whitespace
        .replace(/{TITLE}/g, ""); // Remove any remaining title placeholders
    }
    return formatWithTemplate(selectedTabs, effectiveTemplate);
  }
  return clipboardSettings?.copyTitleEnabled
    ? selectedTabs.map((tab) => `${tab.title} - ${tab.url}`).join("\n")
    : selectedTabs.map((tab) => `${tab.url}`).join("\n");
}

export function formatUrlsMarkdown(selectedTabs: TabItem[]): string {
  return selectedTabs.map((tab) => `[${tab.title}](${tab.url})`).join("\n");
}

export function formatUrlsJson(selectedTabs: TabItem[]): string {
  const data = selectedTabs.map((tab) => ({
    title: tab.title,
    url: tab.url,
  }));
  return JSON.stringify(data, null, 2);
}

export function formatUrlsCsv(selectedTabs: TabItem[]): string {
  if (selectedTabs.length === 0) {
    return "";
  }

  const headers = ["title", "url"];
  const csvRows = [];

  csvRows.push(headers.join(","));

  for (const tab of selectedTabs) {
    const values = headers.map((header) => {
      const value = tab[header as keyof Pick<TabItem, "title" | "url">] || "";
      const escaped = ("" + value).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
}

export function downloadFile(
  content: string,
  fileName: string,
  mimeType: string
) {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function updateToggleVisuals(
  toggleButton: HTMLButtonElement | null,
  isEnabled: boolean
) {
  if (!toggleButton) return;
  const toggleSpan = toggleButton.querySelector('span[aria-hidden="true"]');
  toggleButton.setAttribute("aria-checked", String(isEnabled));
  if (isEnabled) {
    toggleButton.classList.remove("bg-neutral-200", "dark:bg-neutral-700");
    toggleButton.classList.add("bg-indigo-600");
    toggleSpan?.classList.replace("translate-x-0", "translate-x-4");
  } else {
    toggleButton.classList.remove("bg-indigo-600");
    toggleButton.classList.add("bg-neutral-200", "dark:bg-neutral-700");
    toggleSpan?.classList.replace("translate-x-4", "translate-x-0");
  }
}

export function highlightActiveLink() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll(
    "header > div:nth-child(2) > a"
  ) as NodeListOf<HTMLAnchorElement>;

  navLinks.forEach((link) => {
    const linkPath = link.getAttribute("href");
    if (linkPath === currentPath) {
      link.classList.remove("text-neutral-400");
      link.classList.add("text-white");
    } else {
      link.classList.remove("text-white");
      link.classList.add("text-neutral-400");
    }
  });
}

export function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + 1);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
