
export interface Telemetry {
  totalViews: number;
  aiRequests: number;
  guestViews: number;
  memberViews: number;
  lastActive: string;
}

export interface Financials {
  revenue: number;
  estimatedCost: number;
  profit: number;
  margin: string;
}

const STATS_KEY = 'cathedra_admin_telemetry';
const ASSIGNMENT_PRICE = 9.90;
const AVG_COST_PER_AI_REQ = 0.09; // Estimativa ponderada em Reais (tokens)

export const trackAccess = (isMember: boolean = false, isAI: boolean = false) => {
  const stats: Telemetry = JSON.parse(localStorage.getItem(STATS_KEY) || JSON.stringify({
    totalViews: 0,
    aiRequests: 0,
    guestViews: 0,
    memberViews: 0,
    lastActive: new Date().toISOString()
  }));

  stats.totalViews += 1;
  stats.lastActive = new Date().toISOString();
  if (isAI) stats.aiRequests += 1;
  if (isMember) stats.memberViews += 1;
  else stats.guestViews += 1;

  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
};

export const getAdminStats = (): Telemetry => {
  return JSON.parse(localStorage.getItem(STATS_KEY) || '{}');
};

export const getFinancialPreview = (memberCount: number, aiReqs: number): Financials => {
  const revenue = memberCount * ASSIGNMENT_PRICE;
  const estimatedCost = aiReqs * AVG_COST_PER_AI_REQ;
  const profit = revenue - estimatedCost;
  const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) + '%' : '0%';

  return { revenue, estimatedCost, profit, margin };
};

export const getRegisteredUsers = () => {
  const user = localStorage.getItem('cathedra_user');
  return user ? [JSON.parse(user)] : [];
};
