
import React, { useState, useMemo } from 'react';
import { Lead, LeadStatus, Platform } from '../types';
import { LEAD_STAGE_GROUPS, PLATFORM_ICONS } from '../constants';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Users, 
  CheckCircle, 
  Filter, 
  Calendar, 
  ChevronDown, 
  XCircle, 
  CheckCheck, 
  Clock, 
  AlertOctagon, 
  Layers,
  ArrowRightLeft,
  Lightbulb,
  Zap,
  Target,
  AlertTriangle
} from 'lucide-react';

interface DashboardProps {
  leads: Lead[];
  onFilterChange: (statuses: LeadStatus[] | null) => void;
}

// Refined Palette
const COLORS = ['#FFD700', '#52525b', '#d4d4d8', '#f59e0b', '#a1a1aa'];

type FilterType = 'ALL' | 'FY' | 'QUARTER' | 'MONTH';

const Dashboard: React.FC<DashboardProps> = ({ leads, onFilterChange }) => {
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  
  // Comparison State
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [comparisonPeriod, setComparisonPeriod] = useState<string>('');

  // --- Helper Functions ---

  const getFinancialYear = (date: Date) => {
    const month = date.getMonth(); 
    const year = date.getFullYear();
    const startYear = month < 3 ? year - 1 : year;
    return `FY ${startYear.toString().slice(-2)}-${(startYear + 1).toString().slice(-2)}`;
  };

  const getQuarter = (date: Date) => {
    const month = date.getMonth();
    const fy = getFinancialYear(date);
    let q = '';
    if (month >= 3 && month <= 5) q = 'Q1';
    else if (month >= 6 && month <= 8) q = 'Q2'; 
    else if (month >= 9 && month <= 11) q = 'Q3'; 
    else q = 'Q4'; 
    return `${q} ${fy}`;
  };

  const getMonthYear = (date: Date) => {
    return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  };

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  // --- Memoized Data for Periods ---

  const availablePeriods = useMemo(() => {
    const periods = new Set<string>();
    leads.forEach(lead => {
      const date = new Date(lead.createdAt);
      if (filterType === 'FY') periods.add(getFinancialYear(date));
      else if (filterType === 'QUARTER') periods.add(getQuarter(date));
      else if (filterType === 'MONTH') periods.add(getMonthYear(date));
    });
    return Array.from(periods).sort((a, b) => {
        // Custom sort for specific formats could be added here, relying on string compare for now
        // For accurate date sorting, we'd need to parse the strings back to dates, but string sort works for FY/Month mostly OK
        return new Date(b).getTime() - new Date(a).getTime() || b.localeCompare(a);
    });
  }, [leads, filterType]);

  // Initialize Selection
  React.useEffect(() => {
    if (filterType !== 'ALL' && availablePeriods.length > 0) {
        if (!selectedPeriod) setSelectedPeriod(availablePeriods[0]);
        if (!comparisonPeriod && availablePeriods.length > 1) setComparisonPeriod(availablePeriods[1]);
    } else {
        setSelectedPeriod('');
        setComparisonPeriod('');
    }
  }, [filterType, availablePeriods]);

  // --- Filter Logic Helper ---
  
  const getFilteredLeads = (period: string) => {
    if (filterType === 'ALL') return leads;
    return leads.filter(lead => {
        const date = new Date(lead.createdAt);
        if (filterType === 'FY') return getFinancialYear(date) === period;
        if (filterType === 'QUARTER') return getQuarter(date) === period;
        if (filterType === 'MONTH') return getMonthYear(date) === period;
        return false;
    });
  };

  // --- Data Sets ---

  const currentLeads = useMemo(() => getFilteredLeads(selectedPeriod), [leads, filterType, selectedPeriod]);
  const previousLeads = useMemo(() => isCompareMode ? getFilteredLeads(comparisonPeriod) : [], [leads, filterType, comparisonPeriod, isCompareMode]);

  // --- Stats Calculation Helper ---

  const calculateStats = (dataSet: Lead[]) => {
      const sumValue = dataSet.reduce((acc, l) => acc + (l.estimatedValue || 0), 0);
      const open = dataSet.filter(l => LEAD_STAGE_GROUPS.OPEN.includes(l.status));
      const active = dataSet.filter(l => LEAD_STAGE_GROUPS.IN_PROGRESS.includes(l.status));
      const completed = dataSet.filter(l => LEAD_STAGE_GROUPS.COMPLETED.includes(l.status));
      const lost = dataSet.filter(l => LEAD_STAGE_GROUPS.LOST.includes(l.status));
      const won = dataSet.filter(l => LEAD_STAGE_GROUPS.WON.includes(l.status));
      const total = dataSet.length;
      const conversionRate = total > 0 ? ((won.length / total) * 100) : 0;

      return { total, sumValue, open, active, completed, lost, won, conversionRate };
  };

  const currentStats = calculateStats(currentLeads);
  const prevStats = calculateStats(previousLeads);

  // --- Trend Calculation ---
  const getTrend = (current: number, previous: number, isPercentage = false) => {
      if (!isCompareMode || previous === 0) return null;
      const diff = current - previous;
      const percent = (diff / previous) * 100;
      
      return {
          value: isPercentage ? diff : percent, // If the metric itself is %, we show absolute diff, else % growth
          direction: (diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral') as 'up' | 'down' | 'neutral',
          display: `${Math.abs(isPercentage ? diff : percent).toFixed(1)}%`
      };
  };

  // --- Response Time Metrics (Current Period Only) ---
  const responseStats = useMemo(() => {
      let onTime = 0;
      let late = 0;
      const ONE_DAY_MS = 24 * 60 * 60 * 1000;
      const now = Date.now();

      currentLeads.forEach(lead => {
          const created = new Date(lead.createdAt).getTime();
          
          if (lead.status === LeadStatus.NEW) {
              if (now - created > ONE_DAY_MS) late++; 
          } else if (lead.respondedAt) {
              const responded = new Date(lead.respondedAt).getTime();
              if (responded - created <= ONE_DAY_MS) onTime++; else late++;
          } else {
              if (lead.lastContacted) {
                   const contacted = new Date(lead.lastContacted).getTime();
                   if (contacted - created <= ONE_DAY_MS) onTime++; else late++;
              }
          }
      });
      return { onTime, late, total: onTime + late };
  }, [currentLeads]);

  // --- Insights Generation ---
  const insights = useMemo(() => {
      const list = [];

      // 1. Top Platform
      const platformCounts = currentLeads.reduce<Record<string, number>>((acc, lead) => {
          acc[lead.platform] = (acc[lead.platform] || 0) + 1;
          return acc;
      }, {});
      
      let topPlatform = '';
      let maxCount = 0;
      Object.entries(platformCounts).forEach(([p, c]) => {
          if((c as number) > maxCount) { maxCount = (c as number); topPlatform = p; }
      });

      if (topPlatform) {
          const icon = PLATFORM_ICONS[topPlatform as Platform] || <Users size={16} />;
          list.push({
              id: 'top-plat',
              type: 'info',
              icon: icon,
              title: 'Top Channel',
              message: `${topPlatform} is driving ${Math.round((maxCount/currentLeads.length)*100)}% of leads.`
          });
      }

      // 2. Average Deal Size (Won Leads)
      const wonLeads = currentStats.won;
      if (wonLeads.length > 0) {
          const avgVal = wonLeads.reduce((a, l) => a + (l.estimatedValue || 0), 0) / wonLeads.length;
          if (avgVal > 0) {
              list.push({
                  id: 'avg-deal',
                  type: 'success',
                  icon: <Zap size={16} className="text-yellow-600"/>,
                  title: 'Avg. Deal Size',
                  message: `Converted leads average at ${formatCurrency(Math.round(avgVal))}.`
              });
          }
      }

      // 3. Bottleneck / Stage Health
      const stageCounts = currentLeads.reduce<Record<string, number>>((acc, l) => {
          // Only count active stages
          if (LEAD_STAGE_GROUPS.IN_PROGRESS.includes(l.status)) {
              acc[l.status] = (acc[l.status] || 0) + 1;
          }
          return acc;
      }, {});
      
      let busyStage = '';
      let busyCount = 0;
      Object.entries(stageCounts).forEach(([s, c]) => {
          if ((c as number) > busyCount) { busyCount = (c as number); busyStage = s; }
      });

      if (busyCount >= 3) {
          list.push({
              id: 'bottleneck',
              type: 'warning',
              icon: <Layers size={16} className="text-amber-600"/>,
              title: 'Possible Bottleneck',
              message: `${busyCount} projects are currently in '${busyStage}'.`
          });
      }

      // 4. High Urgency
      const highUrgencyCount = currentLeads.filter(l => l.urgency === 'High' && !LEAD_STAGE_GROUPS.COMPLETED.includes(l.status) && !LEAD_STAGE_GROUPS.LOST.includes(l.status)).length;
      if (highUrgencyCount > 0) {
          list.push({
            id: 'urgent',
            type: 'danger',
            icon: <AlertTriangle size={16} className="text-red-600"/>,
            title: 'High Urgency',
            message: `${highUrgencyCount} active leads are marked as 'High' urgency.`
          })
      }

      return list.slice(0, 3); // Show max 3 insights
  }, [currentLeads, currentStats]);

  // --- Chart Data Prep ---

  const statusData = Object.values(LeadStatus).map(status => ({
    name: status,
    value: currentLeads.filter(l => l.status === status).length
  })).filter(d => d.value > 0);

  // Comparative Value Data
  const valueData = Object.values(LeadStatus).map(status => {
      const currentVal = currentLeads.filter(l => l.status === status).reduce((acc, l) => acc + (l.estimatedValue || 0), 0);
      const prevVal = previousLeads.filter(l => l.status === status).reduce((acc, l) => acc + (l.estimatedValue || 0), 0);
      
      // Only include if there's data in either period
      if (currentVal === 0 && prevVal === 0) return null;

      return {
          name: status.split(' ')[0], // Short name
          Current: currentVal,
          Previous: isCompareMode ? prevVal : 0
      };
  }).filter(Boolean);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-sans font-bold text-secondary tracking-tight">Studio Overview</h2>
          <p className="text-gray-500 mt-1 font-light">Financial performance and pipeline analysis.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
            {/* Compare Toggle */}
            {filterType !== 'ALL' && (
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-surface-200 shadow-sm">
                    <span className={`text-xs font-bold uppercase tracking-wider ${isCompareMode ? 'text-primary-600' : 'text-gray-400'}`}>Compare</span>
                    <button 
                        onClick={() => setIsCompareMode(!isCompareMode)}
                        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${isCompareMode ? 'bg-primary-500' : 'bg-gray-200'}`}
                    >
                        <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${isCompareMode ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                </div>
            )}

            {/* Time Filter Tabs */}
            <div className="flex bg-white rounded-xl shadow-sm border border-surface-200 p-1.5">
                {(['ALL', 'FY', 'QUARTER', 'MONTH'] as const).map((t) => (
                    <button 
                        key={t}
                        onClick={() => { setFilterType(t); setIsCompareMode(false); }}
                        className={`px-5 py-2 rounded-lg text-xs font-bold tracking-wide uppercase transition-all ${
                            filterType === t 
                            ? 'bg-secondary text-white shadow-md' 
                            : 'text-gray-400 hover:bg-surface-50 hover:text-gray-700'
                        }`}
                    >
                        {t === 'FY' ? 'Fiscal Year' : t}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* Period Selectors */}
      {filterType !== 'ALL' && (
          <div className="flex flex-col md:flex-row justify-end gap-4 animate-slide-up bg-surface-50/50 p-4 rounded-xl border border-surface-100">
              
              {/* Current Period */}
              <div className="relative min-w-[220px]">
                  <span className="absolute -top-2.5 left-3 bg-surface-50 px-1 text-[10px] font-bold text-primary-600 uppercase tracking-wider z-10">Current Period</span>
                  <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select 
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="w-full appearance-none bg-white border-2 border-primary-100 text-gray-800 py-3 pl-10 pr-10 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-200 text-sm font-bold cursor-pointer hover:border-primary-300 transition-colors"
                  >
                      {availablePeriods.map(p => (
                          <option key={p} value={p}>{p}</option>
                      ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* Comparison Period */}
              {isCompareMode && (
                  <>
                    <div className="flex items-center text-gray-400">
                        <ArrowRightLeft size={20} />
                    </div>
                    <div className="relative min-w-[220px] animate-in fade-in slide-in-from-left-4">
                        <span className="absolute -top-2.5 left-3 bg-surface-50 px-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider z-10">Compare Against</span>
                        <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select 
                            value={comparisonPeriod}
                            onChange={(e) => setComparisonPeriod(e.target.value)}
                            className="w-full appearance-none bg-white border border-surface-200 text-gray-600 py-3 pl-10 pr-10 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm font-medium cursor-pointer hover:border-gray-300 transition-colors"
                        >
                            {availablePeriods.filter(p => p !== selectedPeriod).map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </>
              )}
          </div>
      )}

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <MetricCard 
            title="Total Leads" 
            mainValue={currentStats.total.toString()} 
            subValue={formatCurrency(currentStats.sumValue)}
            icon={<Layers size={22} />}
            color="bg-stone-100 text-stone-600"
            onClick={() => onFilterChange(null)}
            trend={getTrend(currentStats.total, prevStats.total)}
        />
        <MetricCard 
            title="Open Inquiries" 
            mainValue={currentStats.open.length.toString()} 
            subValue={formatCurrency(currentStats.open.reduce((a,l)=>a+(l.estimatedValue||0),0))}
            icon={<Users size={22} />}
            color="bg-blue-50 text-blue-600"
            onClick={() => onFilterChange(LEAD_STAGE_GROUPS.OPEN)}
            trend={getTrend(currentStats.open.length, prevStats.open.length)}
        />
        <MetricCard 
            title="In Progress" 
            mainValue={currentStats.active.length.toString()} 
            subValue={formatCurrency(currentStats.active.reduce((a,l)=>a+(l.estimatedValue||0),0))}
            icon={<Clock size={22} />}
            color="bg-amber-50 text-amber-600"
            onClick={() => onFilterChange(LEAD_STAGE_GROUPS.IN_PROGRESS)}
            trend={getTrend(currentStats.active.length, prevStats.active.length)}
        />
        <MetricCard 
            title="Completed" 
            mainValue={currentStats.completed.length.toString()} 
            subValue={formatCurrency(currentStats.completed.reduce((a,l)=>a+(l.estimatedValue||0),0))}
            icon={<CheckCheck size={22} />}
            color="bg-green-50 text-green-600"
            onClick={() => onFilterChange(LEAD_STAGE_GROUPS.COMPLETED)}
            trend={getTrend(currentStats.completed.length, prevStats.completed.length)}
        />
        <MetricCard 
            title="Lost Leads" 
            mainValue={currentStats.lost.length.toString()} 
            subValue={formatCurrency(currentStats.lost.reduce((a,l)=>a+(l.estimatedValue||0),0))}
            icon={<XCircle size={22} />}
            color="bg-red-50 text-red-600"
            onClick={() => onFilterChange(LEAD_STAGE_GROUPS.LOST)}
            trend={getTrend(currentStats.lost.length, prevStats.lost.length)}
            inverseTrend // For lost leads, increase is bad (red)
        />
         <MetricCard 
            title="Conversion Rate" 
            mainValue={`${currentStats.conversionRate.toFixed(1)}%`} 
            subValue={`Won: ${currentStats.won.length}/${currentStats.total}`}
            icon={<TrendingUp size={22} />}
            color="bg-purple-50 text-purple-600"
            onClick={() => onFilterChange(LEAD_STAGE_GROUPS.WON)}
            trend={getTrend(currentStats.conversionRate, prevStats.conversionRate, true)}
        />
      </div>

      {/* Performance Section: Response Efficiency & Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Response Efficiency */}
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-soft border border-surface-100">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h3 className="text-lg font-bold text-secondary">Response Efficiency</h3>
                    <p className="text-xs text-gray-400 mt-1">Leads contacted within 24 hours (Current Period)</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="flex gap-4">
                    <div className="flex-1 bg-green-50 border border-green-100 p-4 rounded-xl">
                        <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">On Time</p>
                        <div className="flex items-center gap-2">
                            <CheckCircle size={24} className="text-green-500"/>
                            <span className="text-2xl font-bold text-gray-800">{responseStats.onTime}</span>
                        </div>
                    </div>
                    <div className="flex-1 bg-red-50 border border-red-100 p-4 rounded-xl">
                        <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">Late / Overdue</p>
                        <div className="flex items-center gap-2">
                            <AlertOctagon size={24} className="text-red-500"/>
                            <span className="text-2xl font-bold text-gray-800">{responseStats.late}</span>
                        </div>
                    </div>
                </div>
                <div className="w-full">
                    <div className="flex justify-between text-xs font-semibold mb-2">
                        <span className="text-gray-500">Compliance Rate</span>
                        <span className="text-primary-700">{responseStats.total > 0 ? Math.round((responseStats.onTime / responseStats.total) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-surface-100 rounded-full h-3 overflow-hidden">
                        <div 
                            className="bg-primary-500 h-full rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${responseStats.total > 0 ? (responseStats.onTime / responseStats.total) * 100 : 0}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>

        {/* Highlights Section */}
        <div className="bg-white p-6 rounded-2xl shadow-soft border border-surface-100 flex flex-col">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                    <Lightbulb size={20} fill="currentColor" className="opacity-80"/>
                </div>
                <h3 className="text-lg font-bold text-secondary">Smart Highlights</h3>
            </div>
            
            <div className="space-y-3 flex-1 overflow-y-auto">
                {insights.length > 0 ? insights.map(insight => (
                    <div key={insight.id} className={`flex gap-3 p-3 rounded-xl border transition-colors ${
                        insight.type === 'success' ? 'bg-green-50/50 border-green-100' :
                        insight.type === 'warning' ? 'bg-amber-50/50 border-amber-100' :
                        insight.type === 'danger' ? 'bg-red-50/50 border-red-100' :
                        'bg-blue-50/50 border-blue-100'
                    }`}>
                        <div className="mt-0.5 flex-shrink-0">{insight.icon}</div>
                        <div>
                            <p className="text-xs font-bold text-gray-800 mb-0.5">{insight.title}</p>
                            <p className="text-[11px] text-gray-600 leading-tight">{insight.message}</p>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-8 text-gray-400 text-xs">
                        No significant highlights for this period.
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Charts */}
      {currentStats.total > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Status Chart (Pie) */}
            <div className="bg-white p-8 rounded-2xl shadow-soft border border-surface-100 h-[450px] flex flex-col">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-secondary">Lead Distribution</h3>
                        <p className="text-xs text-gray-400 mt-1">Breakdown by stage ({selectedPeriod})</p>
                    </div>
                </div>
                <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                        <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={130}
                            paddingAngle={4}
                            dataKey="value"
                        >
                            {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontFamily: 'Parkinsans' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: '#71717a' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Value Chart (Bar) - Comparative if enabled */}
            <div className="bg-white p-8 rounded-2xl shadow-soft border border-surface-100 h-[450px] flex flex-col">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-secondary">Pipeline Value Comparison</h3>
                        <p className="text-xs text-gray-400 mt-1">
                            Estimated revenue by stage
                            {isCompareMode && <span className="text-primary-600 font-medium ml-1">vs {comparisonPeriod}</span>}
                        </p>
                    </div>
                    {isCompareMode && (
                        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider">
                            <div className="flex items-center gap-1"><span className="w-2 h-2 bg-primary-500 rounded-full"></span> Current</div>
                            <div className="flex items-center gap-1"><span className="w-2 h-2 bg-gray-300 rounded-full"></span> Prev</div>
                        </div>
                    )}
                </div>
                <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={valueData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <XAxis dataKey="name" tick={{fontSize: 11, fill: '#a1a1aa'}} axisLine={false} tickLine={false} dy={10} />
                        <YAxis 
                            tickFormatter={(val) => `₹${val/1000}k`} 
                            tick={{fontSize: 11, fill: '#a1a1aa'}} 
                            axisLine={false} 
                            tickLine={false} 
                        />
                        <Tooltip 
                            cursor={{fill: '#fafaf9'}}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontFamily: 'Parkinsans' }}
                            formatter={(value, name) => [`₹${Number(value).toLocaleString('en-IN')}`, name === 'Current' ? selectedPeriod : comparisonPeriod]}
                        />
                        <Bar 
                            dataKey="Current" 
                            fill="#FFD700" 
                            radius={[4, 4, 0, 0]} 
                            barSize={isCompareMode ? 20 : 40}
                            animationDuration={1000}
                        />
                        {isCompareMode && (
                            <Bar 
                                dataKey="Previous" 
                                fill="#d4d4d8" 
                                radius={[4, 4, 0, 0]} 
                                barSize={20}
                                animationDuration={1000}
                            />
                        )}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl border border-dashed border-surface-200">
            <div className="w-16 h-16 bg-surface-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                <Filter size={32} />
            </div>
            <p className="text-gray-500 font-medium">No data found for {selectedPeriod || 'this period'}</p>
            <button onClick={() => setFilterType('ALL')} className="text-primary-600 text-sm mt-2 hover:underline font-medium">
                Clear Filters
            </button>
        </div>
      )}
    </div>
  );
};

// Reusable Metric Component
interface MetricCardProps {
    title: string;
    mainValue: string;
    subValue?: string;
    icon: React.ReactNode;
    color: string;
    onClick: () => void;
    trend?: { value: number, direction: 'up' | 'down' | 'neutral', display: string } | null;
    inverseTrend?: boolean;
}

const MetricCard = ({ title, mainValue, subValue, icon, color, onClick, trend, inverseTrend }: MetricCardProps) => {
    // For "Lost" leads, Up is Bad (Red), Down is Good (Green). Normal is opposite.
    const isUpGood = !inverseTrend;
    const trendColor = !trend ? '' :
        trend.direction === 'neutral' ? 'text-gray-400 bg-gray-50' :
        (trend.direction === 'up' && isUpGood) || (trend.direction === 'down' && !isUpGood) ? 'text-green-600 bg-green-50' :
        'text-red-600 bg-red-50';
    
    const TrendIcon = !trend ? Minus : trend.direction === 'up' ? TrendingUp : TrendingDown;

    return (
    <div 
        onClick={onClick}
        className="bg-white p-6 rounded-2xl shadow-card border border-transparent hover:border-primary-200 hover:shadow-soft transition-all cursor-pointer group active:scale-95 relative overflow-hidden"
    >
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform duration-300`}>
                {icon}
            </div>
            {trend && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${trendColor}`}>
                    <TrendIcon size={12} />
                    {trend.display}
                </div>
            )}
        </div>
        <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 group-hover:text-primary-600 transition-colors">{title}</p>
            <h3 className="text-2xl xl:text-3xl font-bold text-secondary transition-colors truncate" title={mainValue}>{mainValue}</h3>
            {subValue && <p className="text-xs xl:text-sm font-medium text-gray-500 mt-1 truncate" title={subValue}>{subValue}</p>}
        </div>
    </div>
    );
};

export default Dashboard;
