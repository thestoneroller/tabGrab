// --- Formatting Functions ---
export function formatUrlsPlain(selectedTabs: TabItem[]): string {
  return selectedTabs.map((tab) => tab.url).join('\n');
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
