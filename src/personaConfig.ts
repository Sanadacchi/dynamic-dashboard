import { Settings, Briefcase, Zap, UserCircle, Users, Activity, ShieldCheck, DollarSign, Bot, Rss, CalendarCheck, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const PERSONA_DATA = {
  'Tech': {
    id: 'Tech',
    label: 'Tech Startup',
    icon: Zap,
    color: 'indigo',
    primaryChartType: 'Area',
    defaultChips: { chip_1: '99.9% Uptime', chip_2: 'System Secure' },
    actionButton: 'View Full Report',
    chartLabel: 'API Requests / min',
    chartType: 'area' as const,
    chartData: [
      { name: 'Mon', value: 4200 }, { name: 'Tue', value: 5800 }, { name: 'Wed', value: 7200 },
      { name: 'Thu', value: 6100 }, { name: 'Fri', value: 8900 }, { name: 'Sat', value: 3400 }, { name: 'Sun', value: 2100 },
    ],
    stat1: { label: 'Uptime', value: '99.9%', sub: 'Last 30 days', icon: Activity, iconColor: 'text-emerald-500', iconBg: 'bg-emerald-500/10' },
    stat2: { label: 'Status', value: 'Secure', sub: 'No threats detected', icon: ShieldCheck, iconColor: 'text-indigo-500', iconBg: 'bg-indigo-500/10' },
    sidePanel: {
      title: 'Sprint Highlights',
      items: [
        { label: 'Open PRs', value: '14', trend: 'up' as const, trendLabel: '+3 today' },
        { label: 'Bugs Resolved', value: '27', trend: 'up' as const, trendLabel: 'This sprint' },
        { label: 'Deploy Freq.', value: '2×/day', trend: 'neutral' as const, trendLabel: 'Stable' },
      ]
    },
  },
  'Sales': {
    id: 'Sales',
    label: 'Sales Team',
    icon: Briefcase,
    color: 'emerald',
    primaryChartType: 'Bar',
    defaultChips: { chip_1: 'Monthly Revenue', chip_2: 'Avg. Deal Size' },
    actionButton: 'Export CRM',
    chartLabel: 'Deals Closed per Rep',
    chartType: 'bar' as const,
    chartData: [
      { name: 'Alex', value: 12 }, { name: 'Jordan', value: 9 }, { name: 'Sam', value: 15 },
      { name: 'Taylor', value: 7 }, { name: 'Morgan', value: 11 }, { name: 'Riley', value: 14 },
    ],
    stat1: { label: 'Monthly Revenue', value: '$42k', sub: 'This month', icon: DollarSign, iconColor: 'text-emerald-500', iconBg: 'bg-emerald-500/10' },
    stat2: { label: 'Deals Closed', value: '8', sub: 'This week', icon: Briefcase, iconColor: 'text-indigo-500', iconBg: 'bg-indigo-500/10' },
    sidePanel: {
      title: 'Pipeline Pulse',
      items: [
        { label: 'Avg. Deal Size', value: '$5.2k', trend: 'up' as const, trendLabel: '+12% vs last month' },
        { label: 'Win Rate', value: '64%', trend: 'up' as const, trendLabel: 'Above target' },
        { label: 'Leads in Funnel', value: '38', trend: 'down' as const, trendLabel: '-4 this week' },
      ]
    },
  },
  'Robotics/Hardware': {
    id: 'Robotics/Hardware',
    label: 'Robotics',
    icon: Settings,
    color: 'amber',
    primaryChartType: 'Line',
    defaultChips: { chip_1: 'Sensor Calibration', chip_2: 'Part Lead Times' },
    actionButton: 'Run Diagnostics',
    chartLabel: 'Motor RPM Telemetry',
    chartType: 'line' as const,
    chartData: [
      { name: '00:00', value: 1400 }, { name: '04:00', value: 1380 }, { name: '08:00', value: 1650 },
      { name: '12:00', value: 1720 }, { name: '16:00', value: 1580 }, { name: '20:00', value: 1410 }, { name: '23:59', value: 1390 },
    ],
    stat1: { label: 'Sensors Calibrated', value: '3 / 5', sub: 'Today', icon: Bot, iconColor: 'text-amber-500', iconBg: 'bg-amber-500/10' },
    stat2: { label: 'Parts on Order', value: '2', sub: 'Awaiting delivery', icon: Settings, iconColor: 'text-indigo-500', iconBg: 'bg-indigo-500/10' },
    sidePanel: {
      title: 'Build Status',
      items: [
        { label: 'Sub-assemblies Done', value: '7 / 10', trend: 'up' as const, trendLabel: '+2 today' },
        { label: 'Battery Level', value: '84%', trend: 'neutral' as const, trendLabel: 'Nominal' },
        { label: 'Code Coverage', value: '91%', trend: 'up' as const, trendLabel: '+3% this week' },
      ]
    },
  },
  'Influencers': {
    id: 'Influencers',
    label: 'Influencer',
    icon: UserCircle,
    color: 'purple',
    primaryChartType: 'Area',
    defaultChips: { chip_1: 'Reach/Impressions', chip_2: 'Collab Requests' },
    actionButton: 'View Media Kit',
    chartLabel: 'Follower Growth',
    chartType: 'area' as const,
    chartData: [
      { name: 'Jan', value: 620000 }, { name: 'Feb', value: 680000 }, { name: 'Mar', value: 715000 },
      { name: 'Apr', value: 740000 }, { name: 'May', value: 790000 }, { name: 'Jun', value: 849000 },
    ],
    stat1: { label: 'Reach', value: '849k', sub: 'This month', icon: Rss, iconColor: 'text-purple-500', iconBg: 'bg-purple-500/10' },
    stat2: { label: 'Collab Requests', value: '12', sub: 'Open requests', icon: UserCircle, iconColor: 'text-indigo-500', iconBg: 'bg-indigo-500/10' },
    sidePanel: {
      title: 'Content Overview',
      items: [
        { label: 'Avg. Eng. Rate', value: '6.4%', trend: 'up' as const, trendLabel: '+0.8% vs last week' },
        { label: 'Posts Scheduled', value: '9', trend: 'neutral' as const, trendLabel: 'Next 14 days' },
        { label: 'Saved / Shares', value: '18.2k', trend: 'up' as const, trendLabel: 'All time high' },
      ]
    },
  },
  'Events': {
    id: 'Events',
    label: 'Event Organizers',
    icon: Users,
    color: 'rose',
    primaryChartType: 'Pie',
    defaultChips: { chip_1: 'Registered Guests', chip_2: 'Vendor Status' },
    actionButton: 'Manage Check-ins',
    chartLabel: 'Ticket Sales by Tier',
    chartType: 'bar' as const,
    chartData: [
      { name: 'VIP', value: 48 }, { name: 'Early Bird', value: 185 }, { name: 'General', value: 279 },
      { name: 'Student', value: 94 }, { name: 'Online', value: 120 },
    ],
    stat1: { label: 'Guests Registered', value: '412', sub: 'As of today', icon: CalendarCheck, iconColor: 'text-rose-500', iconBg: 'bg-rose-500/10' },
    stat2: { label: 'Vendors Confirmed', value: '5', sub: 'All on schedule', icon: Users, iconColor: 'text-indigo-500', iconBg: 'bg-indigo-500/10' },
    sidePanel: {
      title: 'Event Countdown',
      items: [
        { label: 'Days to Event', value: '12', trend: 'down' as const, trendLabel: 'Getting close!' },
        { label: 'Capacity', value: '82%', trend: 'up' as const, trendLabel: '+15% this week' },
        { label: 'Sponsors Secured', value: '7', trend: 'neutral' as const, trendLabel: 'Target: 8' },
      ]
    },
  },
};

export const TREND_ICON = { up: TrendingUp, down: TrendingDown, neutral: Minus };
export const TREND_COLOR = { up: 'text-emerald-500', down: 'text-rose-500', neutral: 'text-zinc-500' };

export type PersonaType = keyof typeof PERSONA_DATA;
