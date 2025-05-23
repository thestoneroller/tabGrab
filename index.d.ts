interface TabItem {
  id: number;
  title: string;
  url: string;
  favIconUrl?: string;
  selected: boolean;
  pinned: boolean;
  active?: boolean;
}
