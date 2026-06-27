import api from '../api';

export interface SoHBand {
  band: string;
  count: number;
}

export interface FleetStats {
  total_in_service: number;
  avg_soh: number | null;
  below_80_count: number;
  open_recalls: number;
  thermal_events_30d: number;
  soh_distribution: SoHBand[];
}

export interface FleetPassportHealth {
  uuid: string;
  serial_number: string;
  batch_name: string;
  state_of_health: number | null;
  last_reading_at: string | null;
}

export interface FleetLifecycleEvent {
  id: string;
  passport_id: string;
  serial_number: string;
  batch_name: string;
  event_type: string;
  created_at: string;
}

export interface FleetGeoLocation {
  passport_id: string;
  serial_number: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  scanned_at: string;
}

export interface FleetThermalEvent {
  id: string;
  passport_id: string;
  serial_number: string;
  batch_id: string;
  batch_name: string;
  thermal_type: string;
  temperature: number | null;
  recorded_at: string;
}

export const getFleetStats = async (): Promise<FleetStats> => {
  const response = await api.get('/fleet/stats');
  return response.data;
};

export const getFleetWorstHealth = async (limit = 20): Promise<FleetPassportHealth[]> => {
  const response = await api.get('/fleet/worst-health', { params: { limit } });
  return response.data.passports || [];
};

export const getFleetEvents = async (days = 30): Promise<FleetLifecycleEvent[]> => {
  const response = await api.get('/fleet/events', { params: { days } });
  return response.data.events || [];
};

export const getFleetGeo = async (): Promise<FleetGeoLocation[]> => {
  const response = await api.get('/fleet/geo');
  return response.data.locations || [];
};

export const getFleetThermalEvents = async (days = 30, limit = 20): Promise<FleetThermalEvent[]> => {
  const response = await api.get('/fleet/thermal-events', { params: { days, limit } });
  return response.data.events || [];
};
