import React, { useState, useEffect } from 'react';
import { employeeStore } from '../store/employeeStore';
import { Badge, Button, Input, Progress, Tag, Drawer, Switch, Modal } from 'antd';
import {
  SearchOutlined, StarFilled, StarOutlined, ThunderboltOutlined, TeamOutlined,
  CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined,
  AppstoreOutlined, PlusOutlined, ArrowRightOutlined, SettingOutlined,
  RiseOutlined, FallOutlined, BarChartOutlined, ArrowUpOutlined, ArrowDownOutlined,
  BlockOutlined, DatabaseOutlined, ApiOutlined,
} from '@ant-design/icons';

// ─── 工具函数 ──────────────────────────────────────────────
const AVATAR_COLORS = [
  'linear-gradient(135deg, #6366F1, #8B5CF6)', 'linear-gradient(135deg, #3B82F6, #06B6D4)',
  'linear-gradient(135deg, #10B981, #34d399)', 'linear-gradient(135deg, #F59E0B, #FBBF24)',
  'linear-gradient(135deg, #EF4444, #F87171)', 'linear-gradient(135deg, #8B5CF6, #EC4899)',
];
function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

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
  { label: '调用量',    icon: ThunderboltOutlined,      color: '#6366F1' },
  { label: '运行中员工', icon: TeamOutlined,              color: '#10B981' },
  { label: '待处理问题', icon: ExclamationCircleOutlined, color: '#F59E0B' },
  { label: '完成率',    icon: CheckCircleOutlined,       color: '#3B82F6' },
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

// ─── 我的收藏（含全部可用员工） ────────────────────────────
const ALL_EMPLOYEES = [
  { id: 'de-008', name: '智能巡检助手', dept: '管道运营部', domain: '管道安全域', status: 'published', callCount: 2156 },
  { id: 'de-001', name: '法务合规助手', dept: '法务部',   domain: '法务域', status: 'published', callCount: 328 },
  { id: 'de-002', name: 'HR 招聘助手',  dept: '人力资源', domain: '人力域', status: 'published', callCount: 215 },
  { id: 'de-003', name: '财务报表助手', dept: '财务部',   domain: '财务域', status: 'testing',   callCount: 89  },
  { id: 'de-004', name: '代码审查助手', dept: '技术部',   domain: '技术域', status: 'paused',    callCount: 142 },
  { id: 'de-005', name: '智能客服分发', dept: '客户成功', domain: '客服域', status: 'draft',     callCount: 0   },
  { id: 'de-006', name: '智能客服助手', dept: '客户成功', domain: '客服域', status: 'published', callCount: 512 },
  { id: 'de-007', name: '运营数据助手', dept: '运营部',   domain: '运营域', status: 'published', callCount: 173 },
];
const INIT_FAV_IDS = ['de-008', 'de-001', 'de-002', 'de-006', 'de-003', 'de-007'];

// ─── 业务域 ───────────────────────────────────────────────
const DOMAIN_LIST = [
  { id: 'all',     name: '全部', color: '#6366F1', employees: [
    { id: 'de-008', name: '智能巡检助手', dept: '管道安全域', score: 4.7, heat: 83, type: '定制款' },
    { id: 'de-001', name: '法务合规助手', dept: '法务域',  score: 4.8, heat: 95, type: '通用款' },
    { id: 'de-002', name: 'HR 招聘助手',  dept: '人力域',  score: 4.6, heat: 78, type: '定制款' },
    { id: 'de-003', name: '财务报表助手', dept: '财务域',  score: 4.9, heat: 88, type: '通用款' },
    { id: 'de-004', name: '代码审查助手', dept: '技术域',  score: 4.5, heat: 62, type: '升级款' },
    { id: 'de-006', name: '智能客服助手', dept: '客服域',  score: 4.7, heat: 91, type: '通用款' },
    { id: 'de-007', name: '运营数据助手', dept: '运营域',  score: 4.3, heat: 55, type: '定制款' },
  ]},
  { id: 'legal',   name: '法务域', color: '#6366F1', employees: [{ id: 'de-001', name: '法务合规助手', dept: '法务域', score: 4.8, heat: 95, type: '通用款' }] },
  { id: 'hr',      name: '人力域', color: '#10B981', employees: [{ id: 'de-002', name: 'HR 招聘助手',  dept: '人力域', score: 4.6, heat: 78, type: '定制款' }] },
  { id: 'finance', name: '财务域', color: '#F59E0B', employees: [{ id: 'de-003', name: '财务报表助手', dept: '财务域', score: 4.9, heat: 88, type: '通用款' }] },
  { id: 'tech',    name: '技术域', color: '#3B82F6', employees: [{ id: 'de-004', name: '代码审查助手', dept: '技术域', score: 4.5, heat: 62, type: '升级款' }] },
  { id: 'pipeline', name: '管道安全域', color: '#EF4444', employees: [{ id: 'de-008', name: '智能巡检助手', dept: '管道安全域', score: 4.7, heat: 83, type: '定制款' }] },
];

// ─── 待处理事项（含跳转目标） ─────────────────────────────
const TODOS = [
  { id: 1, priority: 'high',   text: '财务报表助手 v3.0 待审核发布',  tag: '待发布',  time: '2小时前',  targetHash: 'digital-employee-library', action: '去发布' },
  { id: 2, priority: 'high',   text: '智能客服分发 API 调用异常告警',  tag: '运维告警', time: '30分钟前', targetHash: 'digital-employee-library', action: '查看' },
  { id: 3, priority: 'medium', text: '代码审查助手收到 3 条问题反馈',  tag: '问题反馈', time: '4小时前',  targetHash: 'digital-employee-library', action: '处理' },
  { id: 4, priority: 'low',    text: 'HR 招聘助手有新版本可更新',      tag: '版本更新', time: '1天前',    targetHash: 'digital-employee-library', action: '更新' },
];

const PRIORITY_CONFIG: Record<string, { color: string }> = {
  high:   { color: '#ff4d4f' },
  medium: { color: '#f59e0b' },
  low:    { color: '#52c41a' },
};

const TYPE_CONFIG: Record<string, { color: string; bg: string }> = {
  '通用款': { color: '#6366F1', bg: '#eef2ff' },
  '定制款': { color: '#10B981', bg: '#f0fdf4' },
  '升级款': { color: '#F59E0B', bg: '#fefce8' },
};

// ─── 模块配置 ─────────────────────────────────────────────
interface ModuleConfig { id: string; label: string; desc: string; visible: boolean; }
const DEFAULT_MODULES: ModuleConfig[] = [
  { id: 'stats',     label: '统计数据看板', desc: '调用量、运行状态等核心指标，支持多时段同比',   visible: true },
  { id: 'favorites', label: '我的收藏',     desc: '常用数字员工快速访问入口',                     visible: true },
  { id: 'domain',    label: '业务域员工',   desc: '按业务域分类展示员工分布与热度',               visible: true },
  { id: 'todo',      label: '待处理事项',   desc: '待发布、问题反馈、运维告警，支持一键跳转',     visible: true },
  { id: 'shortcuts', label: '快捷入口',     desc: '常用功能一键直达',                             visible: true },
  { id: 'trends',    label: '数据趋势分析', desc: '调用趋势图 + 同比 / 环比对比表',               visible: true },
];

const ORG_LEVELS   = ['集团总部', '子公司', '部门', '市局', '区县'];
const ROLE_OPTIONS = ['管理层', '一线员工', '运维人员'];

// ─── 主组件 ───────────────────────────────────────────────
const DigitalEmployeeWorkbench: React.FC = () => {
  const [period, setPeriod]               = useState<PeriodKey>('week');
  const [activeDomain, setActiveDomain]   = useState('all');
  const [searchText, setSearchText]       = useState('');
  const [favIds, setFavIds]               = useState<string[]>(INIT_FAV_IDS);
  const [configOpen, setConfigOpen]       = useState(false);
  const [favModalOpen, setFavModalOpen]   = useState(false);
  const [modules, setModules]             = useState<ModuleConfig[]>(DEFAULT_MODULES);
  const [orgLevel, setOrgLevel]           = useState('集团总部');
  const [roleOption, setRoleOption]       = useState('管理层');
  const [favSearch, setFavSearch]         = useState('');

  // 订阅 Store 变化，员工评分/调用量更新后自动刷新工作台
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const unsub = employeeStore.subscribe(() => forceUpdate(n => n + 1));
    return () => { unsub(); };
  }, []);

  // 从 Store 获取实时统计，覆盖静态 STATS_DATA 中的调用量和运行数
  const storeStats = employeeStore.getStats();

  const periodComp     = PERIOD_OPTIONS.find(p => p.key === period)!.comp;
  const currentStats   = STATS_DATA[period];
  const currentTrend   = TREND_DATA[period];
  const currentDomain  = DOMAIN_LIST.find(d => d.id === activeDomain) || DOMAIN_LIST[0];
  const visibleFavs    = ALL_EMPLOYEES.filter(e => favIds.includes(e.id));
  const filteredEmps   = currentDomain.employees.filter(e =>
    !searchText || e.name.includes(searchText) || e.dept.includes(searchText)
  );
  const isVisible      = (id: string) => modules.find(m => m.id === id)?.visible !== false;

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── 欢迎横幅 ── */}
      <div style={{
        background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 55%, #EC4899 100%)',
        borderRadius: 14,
        padding: '28px 36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: '#fff',
      }}>
        {/* 左侧：标题 / 副标题 / 标签行 */}
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            👋🏻 欢迎回到数字员工工作台
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 14 }}>
            今天是 2026年3月29日，您的数字员工团队运转良好
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[orgLevel, roleOption, `${storeStats.activeCount} 个员工运行中`].map(t => (
              <span key={t} style={{ fontSize: 12, padding: '3px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 500 }}>{t}</span>
            ))}
          </div>
        </div>

        {/* 右侧：操作按钮 */}
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <Button
            icon={<SettingOutlined />}
            size="small"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.35)', color: '#fff', borderRadius: 8 }}
            onClick={() => setConfigOpen(true)}
          >
            配置工作台
          </Button>
          <Button
            icon={<PlusOutlined />}
            size="small"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.35)', color: '#fff', borderRadius: 8 }}
            onClick={() => { window.location.hash = 'digital-employee-library'; }}
          >
            创建员工
          </Button>
          <Button
            size="small"
            style={{ background: '#fff', border: 'none', color: '#6366F1', fontWeight: 600, borderRadius: 8 }}
            onClick={() => { window.location.hash = 'digital-employee-library'; }}
          >
            员工库 →
          </Button>
        </div>
      </div>

      {/* ── 时段选择 + 统计卡 ── */}
      {isVisible('stats') && (
        <div>
          {/* 时段 Tab */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#aaa', marginRight: 4 }}>数据维度：</span>
            {PERIOD_OPTIONS.map(p => (
              <div
                key={p.key}
                onClick={() => setPeriod(p.key)}
                style={{ padding: '4px 14px', borderRadius: 16, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s', background: period === p.key ? '#6366F1' : '#f5f5f5', color: period === p.key ? '#fff' : '#666', fontWeight: period === p.key ? 600 : 400 }}
              >{p.label}</div>
            ))}
            <span style={{ marginLeft: 6, fontSize: 12, color: '#bbb' }}>· {periodComp}</span>
          </div>
          {/* 4卡 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {STAT_META.map((meta, i) => {
              const d    = currentStats[i];
              const Icon = meta.icon;
              // 调用量(i=0) 和 运行中员工(i=1) 使用 Store 实时值
              const liveValue = i === 0
                ? (storeStats.totalCalls >= 1000 ? (storeStats.totalCalls / 1000).toFixed(1) + 'k' : String(storeStats.totalCalls))
                : i === 1 ? String(storeStats.activeCount)
                : d.value;
              return (
                <div key={meta.label} style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: '#999' }}>{meta.label}</span>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: `${meta.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon style={{ color: meta.color, fontSize: 15 }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: '#1a1a1a', marginBottom: 6 }}>{liveValue}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                    {d.up
                      ? <ArrowUpOutlined style={{ color: '#10B981', fontSize: 11 }} />
                      : <ArrowDownOutlined style={{ color: '#F59E0B', fontSize: 11 }} />}
                    <span style={{ color: d.up ? '#10B981' : '#F59E0B', fontWeight: 500 }}>{d.change}</span>
                    <span style={{ color: '#bbb' }}>{periodComp}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 主内容：双列 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 296px', gap: 18, alignItems: 'start' }}>

        {/* 左列 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* 我的收藏 */}
          {isVisible('favorites') && (
            <div style={{ background: '#fff', borderRadius: 12, padding: 18, border: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <StarFilled style={{ color: '#F59E0B', fontSize: 15 }} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>我的收藏</span>
                  <Tag color="gold" style={{ fontSize: 11, margin: 0 }}>{visibleFavs.length}</Tag>
                </div>
                <Button type="link" size="small" style={{ color: '#6366F1', padding: 0, fontSize: 12 }} onClick={() => setFavModalOpen(true)}>管理收藏</Button>
              </div>
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                {visibleFavs.map(fav => (
                  <div
                    key={fav.id}
                    style={{ flexShrink: 0, width: 150, padding: 12, borderRadius: 10, border: '1px solid #e8e8f0', cursor: 'pointer', transition: 'all 0.15s', background: '#fafbff', position: 'relative' }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#6366F1'; el.style.boxShadow = '0 2px 8px rgba(99,102,241,0.15)'; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#e8e8f0'; el.style.boxShadow = 'none'; }}
                  >
                    {/* 取消收藏 */}
                    <div
                      title="取消收藏"
                      onClick={e => { e.stopPropagation(); setFavIds(prev => prev.filter(id => id !== fav.id)); }}
                      style={{ position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 10, color: '#aaa', zIndex: 1 }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#fde8e8'; (e.currentTarget as HTMLDivElement).style.color = '#ff4d4f'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = '#f0f0f0'; (e.currentTarget as HTMLDivElement).style.color = '#aaa'; }}
                    >✕</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: getAvatarColor(fav.name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{fav.name.charAt(0)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fav.name}</div>
                        <div style={{ fontSize: 10, color: '#aaa' }}>{fav.dept}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Badge status={fav.status === 'published' ? 'success' : fav.status === 'testing' ? 'processing' : 'default'} text={<span style={{ fontSize: 10, color: '#666' }}>{fav.status === 'published' ? '运行中' : fav.status === 'testing' ? '测试中' : fav.status === 'paused' ? '已暂停' : '草稿'}</span>} />
                      <span style={{ fontSize: 10, color: '#bbb' }}>{fav.callCount}次</span>
                    </div>
                  </div>
                ))}
                {/* 添加收藏 */}
                <div
                  onClick={() => setFavModalOpen(true)}
                  style={{ flexShrink: 0, width: 150, padding: 12, borderRadius: 10, border: '1.5px dashed #d9d9d9', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#fafafa', transition: 'all 0.15s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#6366F1'; el.style.background = '#f5f4ff'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#d9d9d9'; el.style.background = '#fafafa'; }}
                >
                  <PlusOutlined style={{ color: '#bbb', fontSize: 18 }} />
                  <span style={{ fontSize: 11, color: '#aaa' }}>添加收藏</span>
                </div>
              </div>
            </div>
          )}

          {/* 业务域员工 */}
          {isVisible('domain') && (
            <div style={{ background: '#fff', borderRadius: 12, padding: 18, border: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AppstoreOutlined style={{ color: '#6366F1', fontSize: 15 }} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>业务域员工</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Input prefix={<SearchOutlined style={{ color: '#bbb' }} />} placeholder="搜索员工..." value={searchText} onChange={e => setSearchText(e.target.value)} style={{ width: 160, borderRadius: 8, fontSize: 12 }} size="small" allowClear />
                  <Button type="link" size="small" style={{ color: '#6366F1', padding: 0, fontSize: 12 }} onClick={() => { window.location.hash = 'digital-employee-domain'; }}>域管理 →</Button>
                </div>
              </div>
              {/* 域 Tab */}
              <div style={{ display: 'flex', gap: 7, marginBottom: 14, flexWrap: 'wrap' }}>
                {DOMAIN_LIST.map(d => (
                  <div key={d.id} onClick={() => setActiveDomain(d.id)} style={{ padding: '4px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s', background: activeDomain === d.id ? d.color : '#f5f5f5', color: activeDomain === d.id ? '#fff' : '#666', fontWeight: activeDomain === d.id ? 600 : 400 }}>
                    {d.name}<span style={{ marginLeft: 4, fontSize: 10, opacity: 0.8 }}>{d.employees.length}</span>
                  </div>
                ))}
              </div>
              {/* 员工网格 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {filteredEmps.map(emp => (
                  <div
                    key={emp.id}
                    onClick={() => { window.location.hash = 'digital-employee-library'; }}
                    style={{ padding: 12, borderRadius: 10, border: '1px solid #e8e8f0', cursor: 'pointer', transition: 'all 0.2s', background: '#fafbff' }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#6366F1'; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 4px 12px rgba(99,102,241,0.12)'; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#e8e8f0'; el.style.transform = ''; el.style.boxShadow = 'none'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: getAvatarColor(emp.name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{emp.name.charAt(0)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.name}</div>
                        <div style={{ fontSize: 10, color: '#aaa' }}>{emp.dept}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: TYPE_CONFIG[emp.type].bg, color: TYPE_CONFIG[emp.type].color, fontWeight: 500 }}>{emp.type}</span>
                      <span style={{ fontSize: 11, color: '#F59E0B', fontWeight: 600 }}>⭐{emp.score}</span>
                    </div>
                    <Progress percent={emp.heat} size="small" showInfo={false} strokeColor={emp.heat > 80 ? '#6366F1' : emp.heat > 60 ? '#10B981' : '#F59E0B'} />
                  </div>
                ))}
                {filteredEmps.length === 0 && <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 20, color: '#aaa', fontSize: 12 }}>暂无员工</div>}
              </div>
            </div>
          )}

          {/* 数据趋势分析 */}
          {isVisible('trends') && (
            <div style={{ background: '#fff', borderRadius: 12, padding: 18, border: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BarChartOutlined style={{ color: '#6366F1', fontSize: 15 }} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>数据趋势分析</span>
                </div>
                <span style={{ fontSize: 12, color: '#bbb' }}>调用量趋势 · {PERIOD_OPTIONS.find(p => p.key === period)?.label}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* 柱状图 */}
                <div>
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 10 }}>调用量分布</div>
                  <div style={{ display: 'flex', gap: 5, alignItems: 'flex-end', height: 90 }}>
                    {currentTrend.calls.map((v, i) => (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: '100%', background: `linear-gradient(180deg, #6366F1, #8B5CF6)`, borderRadius: '3px 3px 0 0', height: Math.max((v / trendMax) * 72, 4), transition: 'height 0.3s', opacity: 0.65 + i * 0.05 }} />
                        <div style={{ fontSize: 9, color: '#bbb', textAlign: 'center' }}>{currentTrend.labels[i]}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* 同比/环比 表格 */}
                <div>
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 10 }}>同比 / 环比对比</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {STAT_META.map((meta, i) => {
                      const d = currentStats[i];
                      return (
                        <div key={meta.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 8, background: '#f9fafb' }}>
                          <span style={{ fontSize: 12, color: '#666' }}>{meta.label}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>{d.value}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 11, color: d.up ? '#10B981' : '#F59E0B', fontWeight: 500 }}>
                              {d.up ? <RiseOutlined style={{ fontSize: 10 }} /> : <FallOutlined style={{ fontSize: 10 }} />}
                              {d.change}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div style={{ padding: '6px 10px', background: '#eef2ff', borderRadius: 8, fontSize: 11, color: '#6366F1', textAlign: 'center' }}>
                      {periodComp} · 数据截至今日
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 右列 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* 待处理事项 */}
          {isVisible('todo') && (
            <div style={{ background: '#fff', borderRadius: 12, padding: 18, border: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ClockCircleOutlined style={{ color: '#6366F1', fontSize: 14 }} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>待处理事项</span>
                  <Tag color="red" style={{ fontSize: 10, margin: 0, borderRadius: 10 }}>{TODOS.filter(t => t.priority === 'high').length} 紧急</Tag>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {TODOS.map(todo => {
                  const pCfg = PRIORITY_CONFIG[todo.priority];
                  return (
                    <div key={todo.id} style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${pCfg.color}22`, background: `${pCfg.color}05` }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 7 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: pCfg.color, flexShrink: 0, marginTop: 5 }} />
                        <span style={{ fontSize: 12, color: '#333', lineHeight: 1.5, flex: 1 }}>{todo.text}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 13 }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <Tag style={{ fontSize: 10, margin: 0, color: pCfg.color, borderColor: `${pCfg.color}40`, background: `${pCfg.color}10`, borderRadius: 4 }}>{todo.tag}</Tag>
                          <span style={{ fontSize: 10, color: '#bbb' }}>{todo.time}</span>
                        </div>
                        {/* 上下文跳转按钮 */}
                        <Button
                          size="small" type="link"
                          style={{ fontSize: 11, color: pCfg.color, padding: 0, height: 'auto' }}
                          onClick={() => { window.location.hash = todo.targetHash; }}
                        >{todo.action} →</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 快捷入口 */}
          {isVisible('shortcuts') && (
            <div style={{ background: '#fff', borderRadius: 12, padding: 18, border: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 12 }}>快捷入口</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {[
                  { icon: '🤖', label: '创建数字员工', desc: '4步完成配置',          action: 'digital-employee-library'  },
                  { icon: '🗂️', label: '业务域管理',   desc: '配置域与权限隔离',     action: 'digital-employee-domain'   },
                  { icon: '📦', label: '数字员工库',   desc: '查看所有员工状态',     action: 'digital-employee-library'  },
                  { icon: '⚡',  label: '工作流资源',  desc: '调用平台已有工作流',   action: 'workflow'                  },
                  { icon: '🔌', label: 'MCP 接入',     desc: '连接企业内部系统',     action: 'mcp'                       },
                  { icon: '📊', label: 'Skills 库',    desc: '查看可用技能资源',     action: 'skill'                     },
                ].map(item => (
                  <div
                    key={item.label}
                    onClick={() => { window.location.hash = item.action; }}
                    style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px', borderRadius: 8, border: '1px solid #e8e8f0', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#6366F1'; el.style.background = '#fafbff'; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#e8e8f0'; el.style.background = '#fff'; }}
                  >
                    <span style={{ fontSize: 18 }}>{item.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#1a1a1a' }}>{item.label}</div>
                      <div style={{ fontSize: 10, color: '#aaa' }}>{item.desc}</div>
                    </div>
                    <ArrowRightOutlined style={{ color: '#d1d5db', fontSize: 11 }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ 工作台配置 Drawer ══ */}
      <Drawer
        title={<span style={{ fontSize: 15, fontWeight: 700 }}>工作台配置</span>}
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
                  {/* 上下移动 */}
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

      {/* ══ 管理收藏 Modal ══ */}
      <Modal
        title={<span style={{ fontSize: 15, fontWeight: 700 }}>管理收藏</span>}
        open={favModalOpen}
        onCancel={() => setFavModalOpen(false)}
        onOk={() => setFavModalOpen(false)}
        okText="完成"
        okButtonProps={{ style: { background: '#6366F1', borderColor: '#6366F1' } }}
        width={480}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input prefix={<SearchOutlined style={{ color: '#bbb' }} />} placeholder="搜索员工..." value={favSearch} onChange={e => setFavSearch(e.target.value)} style={{ borderRadius: 8 }} allowClear />
          <div style={{ fontSize: 12, color: '#aaa' }}>已选 {favIds.length} 个 · 点击星标添加/移除收藏</div>
          <div style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 7 }}>
            {ALL_EMPLOYEES.filter(e => !favSearch || e.name.includes(favSearch) || e.dept.includes(favSearch)).map(emp => {
              const isFav = favIds.includes(emp.id);
              return (
                <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 9, border: `1px solid ${isFav ? '#6366F140' : '#e8e8e8'}`, background: isFav ? '#f5f4ff' : '#fff', cursor: 'pointer' }}
                  onClick={() => setFavIds(prev => isFav ? prev.filter(id => id !== emp.id) : [...prev, emp.id])}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: getAvatarColor(emp.name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 700 }}>{emp.name.charAt(0)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{emp.name}</div>
                    <div style={{ fontSize: 11, color: '#aaa' }}>{emp.dept} · {emp.domain}</div>
                  </div>
                  <Badge status={emp.status === 'published' ? 'success' : emp.status === 'testing' ? 'processing' : 'default'} />
                  {isFav
                    ? <StarFilled style={{ color: '#F59E0B', fontSize: 18 }} />
                    : <StarOutlined style={{ color: '#d9d9d9', fontSize: 18 }} />}
                </div>
              );
            })}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DigitalEmployeeWorkbench;
