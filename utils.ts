// --- Formatting Functions ---
export function formatUrlsPlain(selectedTabs: TabItem[]): string {
  return selectedTabs.map((tab) => `${tab.title} - ${tab.url}`).join('\n');
}

export function formatUrlsMarkdown(selectedTabs: TabItem[]): string {
  return selectedTabs.map((tab) => `[${tab.title}](${tab.url})`).join('\n');
}

export function formatUrlsJson(selectedTabs: TabItem[]): string {
  const data = selectedTabs.map((tab) => ({
    title: tab.title,
    url: tab.url,
  }));
  return JSON.stringify(data, null, 2); // Pretty print JSON
}

export function formatUrlsCsv(selectedTabs: TabItem[]): string {
  if (selectedTabs.length === 0) {
    return '';
  }

  const headers = ['title', 'url'];
  const csvRows = [];

  // Add the header row
  csvRows.push(headers.join(','));

  // Add the data rows
  for (const tab of selectedTabs) {
    const values = headers.map((header) => {
      const value = tab[header as keyof Pick<TabItem, 'title' | 'url'>] || '';
      // Escape double quotes by doubling them, per CSV standard
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
  URL.revokeObjectURL(url); // Clean up to avoid memory leaks
}
