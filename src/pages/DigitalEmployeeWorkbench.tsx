import React, { useState, useEffect } from 'react';
import { employeeStore } from '../store/employeeStore';
import { Button, Drawer, Switch, Badge } from 'antd';
import {
  ThunderboltOutlined, TeamOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  BarChartOutlined, ArrowUpOutlined, ArrowDownOutlined,
  RiseOutlined, FallOutlined, SettingOutlined,
  ClockCircleOutlined, FireOutlined, AlertOutlined,
  DashboardOutlined, UserOutlined,
} from '@ant-design/icons';

// ─── 时间维度 ──────────────────────────────────────────────
type PeriodKey = 'day' | 'week' | 'month' | 'quarter';
const PERIOD_OPTIONS: { key: PeriodKey; label: string; comp: string }[] = [
  { key: 'day',     label: '今日', comp: '同比昨日' },
  { key: 'week',    label: '本周', comp: '同比上周' },
  { key: 'month',   label: '本月', comp: '同比上月' },
  { key: 'quarter', label: '本季', comp: '同比上季' },
];

// ─── 统计数据（分时段） ───────────────────────────────────
const STAT_META = [
  { label: '总调用量',    icon: ThunderboltOutlined,      color: '#6366F1', bgGrad: 'linear-gradient(135deg,#6366F115,#8B5CF615)' },
  { label: '在线员工数',  icon: TeamOutlined,              color: '#10B981', bgGrad: 'linear-gradient(135deg,#10B98115,#34D39915)' },
  { label: '待处理问题',  icon: ExclamationCircleOutlined, color: '#F59E0B', bgGrad: 'linear-gradient(135deg,#F59E0B15,#FBBF2415)' },
  { label: '任务完成率',  icon: CheckCircleOutlined,       color: '#3B82F6', bgGrad: 'linear-gradient(135deg,#3B82F615,#60A5FA15)' },
];
const STATS_DATA: Record<PeriodKey, Array<{ value: string; change: string; up: boolean }>> = {
  day:     [{ value: '1,247',  change: '+12.3%', up: true }, { value: '12', change: '+2',   up: true  }, { value: '3',  change: '-1',   up: false }, { value: '94.5%', change: '+2.1%', up: true  }],
  week:    [{ value: '8,432',  change: '+8.7%',  up: true }, { value: '12', change: '持平', up: true  }, { value: '7',  change: '+2',   up: false }, { value: '92.3%', change: '+0.8%', up: true  }],
  month:   [{ value: '32.8k',  change: '+15.2%', up: true }, { value: '14', change: '+3',   up: true  }, { value: '15', change: '-3',   up: false }, { value: '93.1%', change: '+1.5%', up: true  }],
  quarter: [{ value: '98.2k',  change: '+23.1%', up: true }, { value: '14', change: '+5',   up: true  }, { value: '12', change: '+1',   up: false }, { value: '91.8%', change: '+3.2%', up: true  }],
};

// 趋势图数据（7个数据点）
const TREND_DATA: Record<PeriodKey, { labels: string[]; calls: number[]; rate: number[] }> = {
  day:     { labels: ['0时','4时','8时','12时','16时','20时','24时'], calls: [42,18,95,188,210,156,87],  rate: [91,93,95,94,96,93,94] },
  week:    { labels: ['周一','周二','周三','周四','周五','周六','周日'], calls: [980,1240,890,1580,1432,620,314], rate: [90,93,88,96,94,91,89] },
  month:   { labels: ['第1周','第2周','第3周','第4周','第5周','第6周','第7周'], calls: [5200,6800,4900,8100,6300,5800,6100], rate: [88,92,90,95,93,91,94] },
  quarter: { labels: ['1月','2月','3月','4月','5月','6月','7月'], calls: [28000,22000,31000,35000,38000,29000,42000], rate: [87,85,90,92,94,91,95] },
};

// ─── 员工运行状态数据 ──────────────────────────────────────
const EMPLOYEE_STATUS_DATA = [
  { name: '公文处理专员',   dept: '综合部',     calls: 312, rate: 97.2, status: 'online',  trend: 'up'   },
  { name: '合同审查助手',   dept: '法务部',     calls: 287, rate: 95.8, status: 'online',  trend: 'up'   },
  { name: '财务报表助手',   dept: '财务部',     calls: 145, rate: 91.3, status: 'warning', trend: 'down' },
  { name: 'HR 招聘助手',   dept: '人力资源部', calls: 132, rate: 93.6, status: 'online',  trend: 'flat' },
  { name: '运营数据助手',   dept: '运营部',     calls:  98, rate: 90.2, status: 'online',  trend: 'up'   },
  { name: '采购询价助手',   dept: '采购部',     calls:  89, rate: 88.4, status: 'offline', trend: 'down' },
];

// ─── 近期事件 ─────────────────────────────────────────────
const RECENT_EVENTS = [
  { time: '09:42', type: 'success', text: '「合同审查助手」成功完成合同比对任务（38条款）' },
  { time: '09:15', type: 'warning', text: '「财务报表助手」调用超时 3 次，响应 P95 劣化至 4.2s' },
  { time: '08:57', text: '「公文处理专员」接入飞书群，完成12条消息回复', type: 'info' },
  { time: '08:30', type: 'success', text: '「HR 招聘助手」完成本周简历筛选，入围候选人 8 名' },
  { time: '昨日', type: 'error',   text: '「采购询价助手」因权限不足下线，等待修复' },
];

// ─── 模块配置 ─────────────────────────────────────────────
interface ModuleConfig { id: string; label: string; desc: string; visible: boolean; }
const DEFAULT_MODULES: ModuleConfig[] = [
  { id: 'stats',     label: '核心指标看板',   desc: '调用量、运行状态等核心指标，支持多时段同比',  visible: true },
  { id: 'trends',    label: '数据趋势分析',   desc: '调用趋势图 + 同比 / 环比对比表',              visible: true },
  { id: 'employees', label: '员工运行状态',   desc: '各数字员工实时在线情况与调用表现',             visible: true },
  { id: 'events',    label: '近期事件动态',   desc: '异常告警、任务完成、状态变化等实时动态',       visible: true },
];

const ORG_LEVELS   = ['集团总部', '子公司', '部门', '市局', '区县'];
const ROLE_OPTIONS = ['管理层', '一线员工', '运维人员'];

// ─── 主组件 ───────────────────────────────────────────────
const DigitalEmployeeWorkbench: React.FC = () => {
  const [period, setPeriod]         = useState<PeriodKey>('week');
  const [configOpen, setConfigOpen] = useState(false);
  const [modules, setModules]       = useState<ModuleConfig[]>(DEFAULT_MODULES);
  const [orgLevel, setOrgLevel]     = useState('集团总部');
  const [roleOption, setRoleOption] = useState('管理层');

  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const unsub = employeeStore.subscribe(() => forceUpdate(n => n + 1));
    return () => { unsub(); };
  }, []);

  const storeStats = employeeStore.getStats();

  const periodComp   = PERIOD_OPTIONS.find(p => p.key === period)!.comp;
  const currentStats = STATS_DATA[period];
  const currentTrend = TREND_DATA[period];
  const isVisible    = (id: string) => modules.find(m => m.id === id)?.visible !== false;

  const toggleModule = (id: string) =>
    setModules(prev => prev.map(m => m.id === id ? { ...m, visible: !m.visible } : m));
  const moveModule = (id: string, dir: -1 | 1) =>
    setModules(prev => {
      const idx  = prev.findIndex(m => m.id === id);
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[next]] = [copy[next], copy[idx]];
      return copy;
    });

  const trendMax = Math.max(...currentTrend.calls);

  const statusColor = (s: string) => s === 'online' ? '#10B981' : s === 'warning' ? '#F59E0B' : '#9ca3af';
  const statusLabel = (s: string) => s === 'online' ? '在线' : s === 'warning' ? '异常' : '离线';
  const eventColor  = (t: string) => t === 'success' ? '#10B981' : t === 'warning' ? '#F59E0B' : t === 'error' ? '#EF4444' : '#6366F1';
  const eventIcon   = (t: string) => t === 'success' ? <CheckCircleOutlined /> : t === 'warning' ? <AlertOutlined /> : t === 'error' ? <ExclamationCircleOutlined /> : <ClockCircleOutlined />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── 页面顶栏 ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DashboardOutlined style={{ color: '#fff', fontSize: 16 }} />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#1a1a1a', lineHeight: 1.2 }}>数字员工驾驶舱</div>
            <div style={{ fontSize: 11, color: '#bbb' }}>实时监控 · 数据分析 · 运营洞察</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* 时段选择 */}
          <div style={{ display: 'flex', gap: 4, background: '#f5f5f5', borderRadius: 10, padding: 3 }}>
            {PERIOD_OPTIONS.map(p => (
              <div
                key={p.key}
                onClick={() => setPeriod(p.key)}
                style={{ padding: '4px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s', background: period === p.key ? '#6366F1' : 'transparent', color: period === p.key ? '#fff' : '#666', fontWeight: period === p.key ? 600 : 400 }}
              >{p.label}</div>
            ))}
          </div>
          <Button
            icon={<SettingOutlined />}
            size="small"
            style={{ borderRadius: 8 }}
            onClick={() => setConfigOpen(true)}
          >
            配置
          </Button>
        </div>
      </div>

      {/* ── 核心指标看板（4卡）── */}
      {isVisible('stats') && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
          {STAT_META.map((meta, i) => {
            const d    = currentStats[i];
            const Icon = meta.icon;
            const liveValue = i === 0
              ? (storeStats.totalCalls >= 1000 ? (storeStats.totalCalls / 1000).toFixed(1) + 'k' : String(storeStats.totalCalls))
              : i === 1 ? String(storeStats.activeCount)
              : d.value;
            return (
              <div key={meta.label} style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden' }}>
                {/* 背景装饰 */}
                <div style={{ position: 'absolute', right: -8, top: -8, width: 60, height: 60, borderRadius: '50%', background: meta.bgGrad }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: '#888', fontWeight: 500 }}>{meta.label}</span>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: `${meta.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                    <Icon style={{ color: meta.color, fontSize: 15 }} />
                  </div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#1a1a1a', marginBottom: 8, letterSpacing: -0.5 }}>{liveValue}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                  {d.up
                    ? <ArrowUpOutlined style={{ color: '#10B981', fontSize: 10 }} />
                    : <ArrowDownOutlined style={{ color: '#F59E0B', fontSize: 10 }} />}
                  <span style={{ color: d.up ? '#10B981' : '#F59E0B', fontWeight: 600 }}>{d.change}</span>
                  <span style={{ color: '#bbb' }}>{periodComp}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 中间两栏：趋势分析 + 员工状态 ── */}
      {(isVisible('trends') || isVisible('employees')) && (
        <div style={{ display: 'grid', gridTemplateColumns: isVisible('trends') && isVisible('employees') ? '1fr 340px' : '1fr', gap: 16, marginBottom: 18 }}>

          {/* 数据趋势分析 */}
          {isVisible('trends') && (
            <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BarChartOutlined style={{ color: '#6366F1', fontSize: 15 }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>数据趋势分析</span>
                </div>
                <span style={{ fontSize: 11, color: '#bbb', background: '#f5f5f5', padding: '3px 10px', borderRadius: 20 }}>
                  调用量 · {PERIOD_OPTIONS.find(p => p.key === period)?.label}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {/* 柱状图 */}
                <div>
                  <div style={{ fontSize: 11, color: '#aaa', marginBottom: 12, fontWeight: 500 }}>调用量分布</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 100 }}>
                    {currentTrend.calls.map((v, i) => (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: '100%', background: `linear-gradient(180deg, #6366F1, #8B5CF6)`, borderRadius: '4px 4px 0 0', height: Math.max((v / trendMax) * 82, 4), transition: 'height 0.3s ease', opacity: 0.6 + (i / currentTrend.calls.length) * 0.4 }} />
                        <div style={{ fontSize: 9, color: '#bbb', textAlign: 'center', lineHeight: 1.2 }}>{currentTrend.labels[i]}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* 同比/环比 表格 */}
                <div>
                  <div style={{ fontSize: 11, color: '#aaa', marginBottom: 12, fontWeight: 500 }}>同比 / 环比对比</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {STAT_META.map((meta, i) => {
                      const d = currentStats[i];
                      return (
                        <div key={meta.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 8, background: '#f9fafb' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: '#555' }}>{meta.label}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>{d.value}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 11, color: d.up ? '#10B981' : '#F59E0B', fontWeight: 600, minWidth: 48 }}>
                              {d.up ? <RiseOutlined style={{ fontSize: 10 }} /> : <FallOutlined style={{ fontSize: 10 }} />}
                              {d.change}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div style={{ padding: '6px 10px', background: '#eef2ff', borderRadius: 8, fontSize: 11, color: '#6366F1', textAlign: 'center', fontWeight: 500 }}>
                      {periodComp} · 数据截至今日
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 员工运行状态 */}
          {isVisible('employees') && (
            <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <UserOutlined style={{ color: '#10B981', fontSize: 14 }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>员工运行状态</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 0 2px #10B98130' }} />
                  <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>
                    {EMPLOYEE_STATUS_DATA.filter(e => e.status === 'online').length} 在线
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                {EMPLOYEE_STATUS_DATA.map(emp => (
                  <div key={emp.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 9, background: emp.status === 'warning' ? '#fffbeb' : emp.status === 'offline' ? '#fafafa' : '#f9fffe', border: `1px solid ${emp.status === 'warning' ? '#fde68a' : emp.status === 'offline' ? '#f0f0f0' : '#d1fae5'}` }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor(emp.status), flexShrink: 0, boxShadow: emp.status === 'online' ? `0 0 0 2px ${statusColor(emp.status)}30` : 'none' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: emp.status === 'offline' ? '#bbb' : '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.name}</div>
                      <div style={{ fontSize: 10, color: '#bbb' }}>{emp.dept}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: emp.status === 'offline' ? '#ddd' : '#333' }}>{emp.calls}</div>
                      <div style={{ fontSize: 9, color: emp.rate >= 95 ? '#10B981' : emp.rate >= 90 ? '#F59E0B' : '#EF4444', fontWeight: 600 }}>{emp.rate}%</div>
                    </div>
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 6, background: `${statusColor(emp.status)}18`, color: statusColor(emp.status), fontWeight: 600, flexShrink: 0 }}>
                      {statusLabel(emp.status)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 近期事件动态 ── */}
      {isVisible('events') && (
        <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <FireOutlined style={{ color: '#F59E0B', fontSize: 14 }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>近期事件动态</span>
            <span style={{ fontSize: 11, color: '#bbb', marginLeft: 4 }}>异常告警 · 任务完成 · 状态变化</span>
            {RECENT_EVENTS.filter(e => e.type === 'error' || e.type === 'warning').length > 0 && (
              <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 8, background: '#fef2f2', color: '#EF4444', fontWeight: 700, border: '1px solid #fecaca' }}>
                {RECENT_EVENTS.filter(e => e.type === 'error' || e.type === 'warning').length} 条需关注
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {RECENT_EVENTS.map((ev, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: idx < RECENT_EVENTS.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: 1 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: `${eventColor(ev.type)}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: eventColor(ev.type), fontSize: 12 }}>
                    {eventIcon(ev.type)}
                  </div>
                  {idx < RECENT_EVENTS.length - 1 && (
                    <div style={{ width: 1, height: '100%', minHeight: 8, background: '#f0f0f0', marginTop: 4 }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: '#333', lineHeight: 1.6 }}>{ev.text}</div>
                </div>
                <div style={{ fontSize: 11, color: '#bbb', flexShrink: 0, paddingTop: 3 }}>{ev.time}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ 驾驶舱配置 Drawer ══ */}
      <Drawer
        title={<span style={{ fontSize: 15, fontWeight: 700 }}>驾驶舱配置</span>}
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        width={420}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button onClick={() => setConfigOpen(false)}>取消</Button>
            <Button type="primary" style={{ background: '#6366F1', borderColor: '#6366F1' }} onClick={() => setConfigOpen(false)}>保存配置</Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* 组织层级 + 岗位角色 */}
          <div style={{ padding: 14, background: '#f9f8ff', borderRadius: 10, border: '1px solid #e0deff' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#6366F1', marginBottom: 12 }}>身份配置</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: '#555', marginBottom: 6 }}>组织层级</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {ORG_LEVELS.map(opt => (
                    <div key={opt} onClick={() => setOrgLevel(opt)} style={{ padding: '6px 10px', borderRadius: 7, fontSize: 12, cursor: 'pointer', background: orgLevel === opt ? '#6366F1' : '#fff', color: orgLevel === opt ? '#fff' : '#666', border: orgLevel === opt ? 'none' : '1px solid #e8e8e8' }}>{opt}</div>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#555', marginBottom: 6 }}>岗位角色</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {ROLE_OPTIONS.map(opt => (
                    <div key={opt} onClick={() => setRoleOption(opt)} style={{ padding: '6px 10px', borderRadius: 7, fontSize: 12, cursor: 'pointer', background: roleOption === opt ? '#6366F1' : '#fff', color: roleOption === opt ? '#fff' : '#666', border: roleOption === opt ? 'none' : '1px solid #e8e8e8' }}>{opt}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* 模块配置 */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 10 }}>模块显示配置</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {modules.map((m, idx) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 9, border: '1px solid #e8e8f0', background: m.visible ? '#fff' : '#fafafa' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: m.visible ? '#1a1a1a' : '#aaa' }}>{m.label}</div>
                    <div style={{ fontSize: 11, color: '#bbb', marginTop: 1 }}>{m.desc}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button size="small" type="text" disabled={idx === 0} onClick={() => moveModule(m.id, -1)} style={{ padding: '0 4px', height: 16, fontSize: 10, color: '#bbb', lineHeight: 1 }}>▲</Button>
                    <Button size="small" type="text" disabled={idx === modules.length - 1} onClick={() => moveModule(m.id, 1)} style={{ padding: '0 4px', height: 16, fontSize: 10, color: '#bbb', lineHeight: 1 }}>▼</Button>
                  </div>
                  <Switch size="small" checked={m.visible} onChange={() => toggleModule(m.id)} style={{ background: m.visible ? '#6366F1' : undefined }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default DigitalEmployeeWorkbench;
