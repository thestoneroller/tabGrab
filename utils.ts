// --- Formatting Functions ---
export function formatUrlsPlain(
  selectedTabs: TabItem[],
  clipboardSettings: ClipboardSettings
): string { 

  return clipboardSettings?.copyTitleEnabled ? selectedTabs.map((tab) => `${tab.title} - ${tab.url}`).join('\n') : selectedTabs.map((tab) => `${tab.url}`).join('\n');
}

export function formatUrlsMarkdown(selectedTabs: TabItem[]): string {
  return selectedTabs.map((tab) => `[${tab.title}](${tab.url})`).join('\n');
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
    return '';
  }

  const headers = ['title', 'url'];
  const csvRows = [];

  csvRows.push(headers.join(','));

  for (const tab of selectedTabs) {
    const values = headers.map((header) => {
      const value = tab[header as keyof Pick<TabItem, 'title' | 'url'>] || '';
      const escaped = ('' + value).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

export function downloadFile(
  content: string,
  fileName: string,
  mimeType: string
) {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
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