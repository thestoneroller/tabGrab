interface TabItem {
  id: number;
  title: string;
  url: string;
  favIconUrl?: string;
  selected: boolean;
  pinned: boolean;
  active?: boolean;
}

interface PopupSettings {
  activeFilter: 'all' | 'pinned';
  isGroupingEnabled: boolean;
  isHidePinnedEnabled: boolean;
}

interface OptionsSettings {
  clipboardSettings: ClipboardSettings;
}

interface ClipboardSettings {
  copyTitleEnabled: boolean;
}