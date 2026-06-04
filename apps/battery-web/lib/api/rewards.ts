import api from "../api";

export interface RewardBalance {
  email: string;
  total_points: number;
  loyalty_level: string;
  stats: {
    installations: number;
    recycles: number;
    returns: number;
  };
  last_activity: string;
}

export interface RewardHistoryItem {
  id: string;
  recipient_email: string;
  passport_uuid?: string;
  action_type: string;
  points_earned: number;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  email: string;
  total_points: number;
  loyalty_level: string;
  stats: {
    installations: number;
    recycles: number;
    returns: number;
  };
}

export interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  count: number;
}

export const getRewardBalance = async (): Promise<RewardBalance> => {
  const response = await api.get<RewardBalance>("/rewards/balance");
  return response.data;
};

export const getRewardHistory = async (limit = 20): Promise<RewardHistoryItem[]> => {
  const response = await api.get<{ email: string; history: RewardHistoryItem[]; count: number }>(
    `/rewards/history?limit=${limit}`
  );
  return response.data.history || [];
};

export const getLeaderboard = async (limit = 20): Promise<LeaderboardData> => {
  const response = await api.get<LeaderboardData>("/rewards/leaderboard", {
    params: { limit },
  });
  return response.data;
};

export interface RewardConfig {
  points: Record<string, number>;
  actions: Array<{ key: string; label: string }>;
}

export const getRewardConfig = async (): Promise<RewardConfig> => {
  const response = await api.get<RewardConfig>("/rewards/config");
  return response.data;
};
