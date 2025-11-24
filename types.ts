export interface Draft {
  id: number;
  title: string;
  date: string;
  content: string;
  planet: string;
}

export interface PlanetData {
  name: string;
  color: number;
  size: number;
  distance: number;
  ring?: boolean;
}
