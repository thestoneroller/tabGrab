import { CHANGELOGS } from "@/constants";
import { formatDate, highlightActiveLink } from "@/utils";

document.addEventListener("DOMContentLoaded", () => {
  const changelogContainer = document.getElementById("changelog-container");
  if (!changelogContainer) return;

  const mainTitle = document.createElement("h1");
  mainTitle.className =
    "text-3xl font-bold pb-4 mb-8 border-b border-neutral-700";
  mainTitle.textContent = "TabGrab Changelog";
  changelogContainer.appendChild(mainTitle);

  CHANGELOGS.forEach((log, index) => {
    const versionDiv = document.createElement("div");
    versionDiv.className = "mb-8";

    const headerContainer = document.createElement("div");
    headerContainer.className =
      "flex items-center gap-2 mb-4 border-b border-neutral-800 pb-2";

    const versionHeader = document.createElement("h2");
    versionHeader.className = "text-2xl font-semibold";
    versionHeader.textContent = `v${log.version}`;
    headerContainer.appendChild(versionHeader);

    if (index === 0) {
      const latestBadge = document.createElement("span");
      latestBadge.className =
        "bg-emerald-600 text-white text-xs px-2.5 py-0.5 rounded-full";
      latestBadge.textContent = "Latest";
      headerContainer.appendChild(latestBadge);
    }

    const dateElement = document.createElement("span");
    dateElement.className = "ml-auto text-sm text-neutral-400";
    dateElement.textContent = formatDate(log.date);
    headerContainer.appendChild(dateElement);

    versionDiv.appendChild(headerContainer);

    const changesList = document.createElement("ul");
    changesList.className = "list-disc list-inside";

    const createChangeItem = (text: string) => {
      const listItem = document.createElement("li");
      listItem.className = "mb-2 text-lg";
      listItem.textContent = text;

      return listItem;
    };

    if (log.changes.features) {
      log.changes.features.forEach((feature) => {
        changesList.appendChild(createChangeItem(feature));
      });
    }

    if (log.changes.fixes) {
      log.changes.fixes.forEach((fix) => {
        changesList.appendChild(createChangeItem(fix));
      });
    }

    versionDiv.appendChild(changesList);
    changelogContainer.appendChild(versionDiv);
  });

  highlightActiveLink();
});
