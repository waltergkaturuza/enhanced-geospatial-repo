/** LASAC local archive satellite catalog — mirrors server/frontend/src/App.jsx */

export interface LasacSatellite {
  id: string;
  label: string;
  sensor: string;
  resolution: string;
  swath: string;
  color: string;
}

export interface LasacSatelliteGroup {
  id: string;
  name: string;
  description: string;
  satellites: LasacSatellite[];
}

export const LASAC_SATELLITE_GROUPS: LasacSatelliteGroup[] = [
  {
    id: 'gaofen',
    name: 'GaoFen Series',
    description: 'High-resolution Chinese civil observation satellites',
    satellites: [
      { id: 'GF1A', label: 'GaoFen-1A', sensor: 'WFV', resolution: '16 m', swath: '800 km', color: '#60a5fa' },
      { id: 'GF1B', label: 'GaoFen-1B', sensor: 'PMS', resolution: '2 m / 8 m', swath: '60 km', color: '#3b82f6' },
      { id: 'GF1C', label: 'GaoFen-1C', sensor: 'PMS', resolution: '2 m / 8 m', swath: '60 km', color: '#06b6d4' },
      { id: 'GF1D', label: 'GaoFen-1D', sensor: 'PMS', resolution: '2 m / 8 m', swath: '60 km', color: '#8b5cf6' },
      { id: 'GF1E', label: 'GaoFen-1E', sensor: 'PMS', resolution: '2 m / 8 m', swath: '60 km', color: '#a78bfa' },
      { id: 'GF2', label: 'GaoFen-2', sensor: 'PMS', resolution: '0.8 m / 3.2 m', swath: '45 km', color: '#818cf8' },
      { id: 'GF3', label: 'GaoFen-3', sensor: 'SAR', resolution: '1–500 m', swath: '10–650 km', color: '#38bdf8' },
      { id: 'GF6', label: 'GaoFen-6', sensor: 'PMS/WFV', resolution: '2 m / 16 m', swath: '90 km', color: '#22d3ee' },
      { id: 'GF7', label: 'GaoFen-7', sensor: 'BWD/TLC', resolution: '0.65 m', swath: '20 km', color: '#2dd4bf' },
    ],
  },
  {
    id: 'ziyuan',
    name: 'ZiYuan Series',
    description: 'Resource survey, mapping and hyperspectral satellites',
    satellites: [
      { id: 'ZY1C', label: 'ZiYuan-1C', sensor: 'PMS', resolution: '2.3 m', swath: '54 km', color: '#34d399' },
      { id: 'ZY1E', label: 'ZiYuan-1E', sensor: 'AHSI', resolution: '30 m', swath: '60 km', color: '#10b981' },
      { id: 'ZY1F', label: 'ZiYuan-1F', sensor: 'VNIC', resolution: '10 m', swath: '115 km', color: '#f59e0b' },
      { id: 'ZY3-1', label: 'ZiYuan-3 01', sensor: 'NAD/TLC', resolution: '2.1 m', swath: '51 km', color: '#f97316' },
      { id: 'ZY3-2', label: 'ZiYuan-3 02', sensor: 'MUX', resolution: '5.8 m', swath: '51 km', color: '#ef4444' },
      { id: 'ZY3-3', label: 'ZiYuan-3 03', sensor: 'NAD', resolution: '2.1 m', swath: '51 km', color: '#fb923c' },
    ],
  },
];

export const LASAC_SATELLITE_IDS = LASAC_SATELLITE_GROUPS.flatMap((g) => g.satellites.map((s) => s.id));

export const LASAC_SATELLITE_MAP = Object.fromEntries(
  LASAC_SATELLITE_GROUPS.flatMap((g) => g.satellites.map((s) => [s.id, s]))
);

export function formatStorageSize(mb: number): string {
  if (!mb || mb <= 0) return '0 MB';
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return `${mb.toFixed(1)} MB`;
}
