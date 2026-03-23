export interface Task {
  id: number;
  title: string;
  status: 'Planned' | 'Completed';
  is_blocked: number;
}

export interface User {
  id: number;
  name: string;
  role: 'OWNER' | 'MANAGER' | 'CONTRIBUTOR';
  status: 'Online' | 'Offline' | 'Focus';
  tasks: Task[];
  achievement?: { text: string };
}

export interface WidgetConfig {
  id: string;
  type: 'STAT_CARD' | 'CHART' | 'WAR_ROOM' | 'NORTH_STAR';
  label: string;
  metricDataKey?: string;
  color?: string;
  rolesRequired?: string[];
}

export interface CustomWidget {
  id: number;
  tenant_id: number;
  user_id: number;
  label: string;
  type: string;
  current_value: number;
  goal_value: number | null;
  config: string; // JSON string
  created_at: string;
}

export interface Tenant {
  id: number;
  name: string;
  daily_burn: number;
  total_balance: number;
  company_type?: string;
  dashboard_layout?: string; // JSON string of WidgetConfig[]
  primary_color?: string;
  custom_labels?: string; // JSON string
}

export interface DailyGoal {
  goal_text: string;
  category?: string;
}
