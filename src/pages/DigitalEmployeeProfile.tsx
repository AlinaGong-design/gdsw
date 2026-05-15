import React, { useState } from 'react';
import { Select, Drawer, Tag, Progress } from 'antd';
import {
  ClockCircleOutlined, CheckCircleOutlined, ThunderboltOutlined,
  StarOutlined, RobotOutlined, DatabaseOutlined, BulbOutlined,
  ArrowUpOutlined, ArrowDownOutlined, AimOutlined,
  SafetyCertificateOutlined, RiseOutlined, UserOutlined,
} from '@ant-design/icons';

// ─── Types ────────────────────────────────────────────────────────

type PeriodKey = 'today' | 'week' | 'month' | 'quarter';

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'today',   label: '今日' },
  { key: 'week',    label: '本周' },
  { key: 'month',   label: '本月' },
  { key: 'quarter', label: '本季' },
];

const EMPLOYEES = [
  { id: 'de-001', name: '法务合规助手', dept: '法务合规部', version: 'v2.1.0', avatar: '法', color: '#6366F1' },
  { id: 'de-002', name: 'HR 招聘助手',  dept: '人力资源部', version: 'v1.8.2', avatar: 'HR', color: '#10B981' },
  { id: 'de-003', name: '财务报表助手', dept: '财务中心',   version: 'v3.0.1', avatar: '财', color: '#F59E0B' },
  { id: 'de-004', name: '代码审查助手', dept: '技术部',     version: 'v2.5.0', avatar: '码', color: '#3B82F6' },
  { id: 'de-008', name: '智能巡检助手', dept: '运维部',     version: 'v1.2.3', avatar: '巡', color: '#8B5CF6' },
];

// ─── Dimension Config ─────────────────────────────────────────────

const DIMENSIONS = [
  { key: 'accuracy',     label: '响应准确率', icon: <AimOutlined />,              color: '#6366F1' },
  { key: 'efficiency',   label: '执行效率',   icon: <ThunderboltOutlined />,       color: '#10B981' },
  { key: 'knowledge',    label: '知识掌握度', icon: <DatabaseOutlined />,          color: '#F59E0B' },
  { key: 'satisfaction', label: '用户满意度', icon: <StarOutlined />,              color: '#8B5CF6' },
  { key: 'decision',     label: '自主决策力', icon: <BulbOutlined />,              color: '#3B82F6' },
  { key: 'exception',    label: '异常处理力', icon: <SafetyCertificateOutlined />, color: '#EF4444' },
];

const LEVEL_CFG: Record<string, { label: string; color: string; bg: string }> = {
  excellent: { label: '优秀',  color: '#10b981', bg: '#f0fdf4' },
  good:      { label: '良好',  color: '#6366F1', bg: '#f5f4ff' },
  average:   { label: '待提升', color: '#F59E0B', bg: '#fefce8' },
};

const STATUS_CFG: Record<string, { bg: string; color: string; label: string }> = {
  done:    { bg: '#eff6ff', color: '#2563eb', label: '已完成' },
  running: { bg: '#f0fdf4', color: '#16a34a', label: '执行中' },
  waiting: { bg: '#fafafa', color: '#9ca3af', label: '等待中' },
  failed:  { bg: '#fff1f2', color: '#e11d48', label: '失败'   },
};

// ─── SVG Radar Chart ─────────────────────────────────────────────

function radarPoint(idx: number, value: number, total: number, cx: number, cy: number, r: number) {
  const angle = (Math.PI * 2 * idx / total) - Math.PI / 2;
  return { x: cx + r * value * Math.cos(angle), y: cy + r * value * Math.sin(angle) };
}

function polyStr(values: number[], cx: number, cy: number, r: number): string {
  return values.map((v, i) => {
    const pt = radarPoint(i, v, values.length, cx, cy, r);
    return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
  }).join(' ');
}

const RadarChart: React.FC<{ values: number[]; teamValues?: number[]; size?: number }> = ({
  values, teamValues, size = 240,
}) => {
  const cx = size / 2, cy = size / 2, maxR = size / 2 - 32, n = values.length;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      {[0.2, 0.4, 0.6, 0.8, 1.0].map(lv => (
        <polygon key={lv}
          points={polyStr(Array(n).fill(lv), cx, cy, maxR)}
          fill={lv === 0.4 || lv === 0.8 ? '#f7f8fc' : 'none'}
          stroke={lv === 1.0 ? '#e8e8e8' : '#ebebeb'}
          strokeWidth={lv === 1.0 ? 1.5 : 1}
        />
      ))}
      {DIMENSIONS.map((_, i) => {
        const pt = radarPoint(i, 1, n, cx, cy, maxR);
        return <line key={i} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke="#e8e8e8" strokeWidth={1} />;
      })}
      {teamValues && (
        <polygon
          points={polyStr(teamValues.map(v => v / 100), cx, cy, maxR)}
          fill="rgba(0,0,0,0.03)" stroke="#d1d5db"
          strokeWidth={1.5} strokeDasharray="4 3" strokeLinejoin="round"
        />
      )}
      <polygon
        points={polyStr(values.map(v => v / 100), cx, cy, maxR)}
        fill="rgba(99,102,241,0.1)" stroke="#6366F1"
        strokeWidth={2} strokeLinejoin="round"
      />
      {values.map((v, i) => {
        const pt = radarPoint(i, v / 100, n, cx, cy, maxR);
        return <circle key={i} cx={pt.x} cy={pt.y} r={3.5} fill="#6366F1" stroke="#fff" strokeWidth={2} />;
      })}
      {DIMENSIONS.map((dim, i) => {
        const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
        const lx = cx + (maxR + 20) * Math.cos(angle);
        const ly = cy + (maxR + 20) * Math.sin(angle);
        const anchor = Math.cos(angle) > 0.3 ? 'start' : Math.cos(angle) < -0.3 ? 'end' : 'middle';
        return (
          <text key={i} x={lx} y={ly} textAnchor={anchor as any}
            dominantBaseline="middle" fontSize={11} fill="#666" fontFamily="system-ui">
            {dim.label}
          </text>
        );
      })}
    </svg>
  );
};

// ─── Score Ring ───────────────────────────────────────────────────

const ScoreRing: React.FC<{ score: number; size?: number; color?: string }> = ({
  score, size = 120, color = '#6366F1',
}) => {
  const r = size / 2 - 10, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f0f0f0" strokeWidth={9} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={9}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cy - 7} textAnchor="middle" dominantBaseline="middle"
        fontSize={24} fontWeight={700} fill={color} fontFamily="system-ui">{score}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" dominantBaseline="middle"
        fontSize={11} fill="#aaa" fontFamily="system-ui">综合评分</text>
    </svg>
  );
};

// ─── Mock Data ────────────────────────────────────────────────────

const MOCK: Record<string, any> = {
  'de-001': {
    overallScore: 92, prevScore: 89, teamAvg: 87, ranking: '前 7%',
    evaluation: { cycle: '2026 Q1', status: '已完成', completedAt: '2026-04-01' },
    badges: ['准确达人', '效率之星', '零故障', '用户首选'],
    dimensions:     { accuracy: 95, efficiency: 88, knowledge: 87, satisfaction: 92, decision: 85, exception: 90 },
    teamDimensions: { accuracy: 88, efficiency: 84, knowledge: 80, satisfaction: 85, decision: 79, exception: 82 },
    usage: {
      today:   { callCount: 128,   tokens: 312400,  cost: 15.62,  score: 4.8, heat: 95 },
      week:    { callCount: 843,   tokens: 2184600, cost: 109.23, score: 4.8, heat: 95 },
      month:   { callCount: 4821,  tokens: 9842300, cost: 492.12, score: 4.8, heat: 95 },
      quarter: { callCount: 14218, tokens: 29162000, cost: 1458.1, score: 4.8, heat: 95 },
    },
    evaluatorGroups: [
      { label: '系统监控', sublabel: '自动采集任务执行质量', score: 94, prevScore: 91, color: '#6366F1', icon: <RobotOutlined />,       weight: '40%' },
      { label: '用户评价', sublabel: '实际用户满意度打分',   score: 91, prevScore: 89, color: '#10B981', icon: <StarOutlined />,         weight: '35%' },
      { label: '任务指标', sublabel: '基于完成率与准时率',   score: 92, prevScore: 88, color: '#F59E0B', icon: <CheckCircleOutlined />,  weight: '25%' },
    ],
    kpis: {
      today:   { workHours: '6.2h',  tasks: 12,  completionRate: 97.2, changes: ['+0.8h', '+2',  '+1.4%'], ups: [true, true, true] },
      week:    { workHours: '38.4h', tasks: 67,  completionRate: 95.5, changes: ['+3.1h', '+8',  '+0.8%'], ups: [true, true, true] },
      month:   { workHours: '152h',  tasks: 284, completionRate: 94.7, changes: ['+12h',  '+31', '+1.2%'], ups: [true, true, true] },
      quarter: { workHours: '447h',  tasks: 821, completionRate: 93.8, changes: ['+28h',  '+94', '+2.1%'], ups: [true, true, true] },
    },
    dimensionDetail: [
      {
        key: 'accuracy', score: 95, prevScore: 93, up: true,
        indicators: [
          { label: '合同条款识别准确率', score: 97, level: 'excellent' },
          { label: '法规引用准确率',     score: 94, level: 'good'      },
          { label: '风险判断精准度',     score: 93, level: 'good'      },
        ],
        insight: '本月识别准确率持续提升，合同审查错误率下降至 0.3%，高于行业基准 15 个百分点。',
      },
      {
        key: 'efficiency', score: 88, prevScore: 87, up: true,
        indicators: [
          { label: '平均响应时长',     score: 91, level: 'good'    },
          { label: '批量任务处理速度', score: 86, level: 'good'    },
          { label: '峰值负载表现',     score: 84, level: 'average' },
        ],
        insight: '高峰期并发处理能力有待优化，建议将任务配额从 5 调整至 8。',
      },
      {
        key: 'knowledge', score: 87, prevScore: 84, up: true,
        indicators: [
          { label: '法律法规覆盖度', score: 90, level: 'good'    },
          { label: '行业案例储备量', score: 85, level: 'good'    },
          { label: '知识更新及时性', score: 82, level: 'average' },
        ],
        insight: '知识库上次更新距今 18 天，建议同步《2026 年企业合规新规》等最新法规。',
      },
      {
        key: 'satisfaction', score: 92, prevScore: 91, up: true,
        indicators: [
          { label: '回复质量评分', score: 94, level: 'excellent' },
          { label: '沟通清晰度',   score: 92, level: 'good'      },
          { label: '问题解决率',   score: 89, level: 'good'      },
        ],
        insight: '用户好评率 94.7%，连续 3 个月在团队中排名第一，无差评记录。',
      },
      {
        key: 'decision', score: 85, prevScore: 81, up: true,
        indicators: [
          { label: '复杂情境判断力', score: 88, level: 'good'    },
          { label: '风险预警敏感度', score: 86, level: 'good'    },
          { label: '多方案评估能力', score: 80, level: 'average' },
        ],
        insight: '本季度自主处理率提升 12%，减少人工审批 67 次，节约法务团队约 34 小时。',
      },
      {
        key: 'exception', score: 90, prevScore: 90, up: false,
        indicators: [
          { label: '异常识别率',   score: 93, level: 'excellent' },
          { label: '故障自愈能力', score: 88, level: 'good'      },
          { label: '降级预案执行', score: 90, level: 'good'      },
        ],
        insight: '本月零故障运行 30 天，所有异常事件均在 SLA 时限内完成处置。',
      },
    ],
    recentTasks: [
      { id: 't1', name: '供应商合同风险审查',   status: 'done',    time: '11:32', duration: '2m14s', trigger: '对话触发', score: 5    },
      { id: 't2', name: '本周合规事项周报',     status: 'done',    time: '10:05', duration: '1m47s', trigger: '定时触发', score: 5    },
      { id: 't3', name: '数据安全协议条款提取', status: 'running', time: '11:48', duration: '—',     trigger: '事件触发', score: null },
      { id: 't4', name: '劳动合同模板合规校验', status: 'done',    time: '09:18', duration: '1m05s', trigger: '对话触发', score: 4    },
      { id: 't5', name: '月度绩效数据汇总',     status: 'waiting', time: '—',     duration: '—',     trigger: '定时触发', score: null },
    ],
    reviews: [
      { user: '张总监', dept: '法务部', score: 5, comment: '非常高效，合规审查准确率大幅提升，节省了法务团队大量时间，强烈推荐！', time: '2026-04-01' },
      { user: '李经理', dept: '合规部', score: 4, comment: '响应速度快，偶有需要人工复核的情况，但整体使用体验非常好。',         time: '2026-03-28' },
      { user: '王主任', dept: '法务部', score: 5, comment: '周报自动生成节省了大量时间，格式规范，内容准确，已全面推广使用。',   time: '2026-03-25' },
    ],
    insights: [
      { type: 'good',    text: '本月任务成功率 94.7%，超越团队均值 91.2%，综合表现优秀' },
      { type: 'good',    text: '用户好评率持续提升，满意度连续 3 个月环比增长' },
      { type: 'warn',    text: '合同审查平均耗时较上月增加 12%，建议检查知识库更新情况' },
      { type: 'suggest', text: '建议开启「周报自动摘要」技能，预计可减少 20% 人工整理时间' },
    ],
  },

  'de-002': {
    overallScore: 85, prevScore: 82, teamAvg: 87, ranking: '前 28%',
    evaluation: { cycle: '2026 Q1', status: '已完成', completedAt: '2026-04-01' },
    badges: ['招聘达人', '响应迅速', '零漏筛'],
    dimensions:     { accuracy: 88, efficiency: 91, knowledge: 82, satisfaction: 87, decision: 78, exception: 84 },
    teamDimensions: { accuracy: 88, efficiency: 84, knowledge: 80, satisfaction: 85, decision: 79, exception: 82 },
    usage: {
      today:   { callCount: 94,   tokens: 218600,  cost: 10.93, score: 4.4, heat: 78 },
      week:    { callCount: 612,  tokens: 1524800, cost: 76.24, score: 4.4, heat: 78 },
      month:   { callCount: 3284, tokens: 6891200, cost: 344.56, score: 4.4, heat: 78 },
      quarter: { callCount: 9821, tokens: 20184600, cost: 1009.23, score: 4.4, heat: 78 },
    },
    evaluatorGroups: [
      { label: '系统监控', sublabel: '自动采集任务执行质量', score: 87, prevScore: 84, color: '#6366F1', icon: <RobotOutlined />,      weight: '40%' },
      { label: '用户评价', sublabel: '实际用户满意度打分',   score: 84, prevScore: 81, color: '#10B981', icon: <StarOutlined />,        weight: '35%' },
      { label: '任务指标', sublabel: '基于完成率与准时率',   score: 85, prevScore: 82, color: '#F59E0B', icon: <CheckCircleOutlined />, weight: '25%' },
    ],
    kpis: {
      today:   { workHours: '5.8h',  tasks: 9,   completionRate: 94.4, changes: ['+0.3h', '+1',  '+0.6%'], ups: [true, true, true] },
      week:    { workHours: '34.2h', tasks: 51,  completionRate: 93.1, changes: ['+1.8h', '+5',  '-0.4%'], ups: [true, true, false] },
      month:   { workHours: '138h',  tasks: 216, completionRate: 92.8, changes: ['+8h',   '+22', '+0.9%'], ups: [true, true, true]  },
      quarter: { workHours: '412h',  tasks: 634, completionRate: 91.5, changes: ['+18h',  '+67', '+1.4%'], ups: [true, true, true]  },
    },
    dimensionDetail: [
      {
        key: 'accuracy', score: 88, prevScore: 85, up: true,
        indicators: [
          { label: '简历匹配精准度', score: 90, level: 'good'    },
          { label: '岗位需求理解度', score: 87, level: 'good'    },
          { label: '人才画像准确率', score: 85, level: 'good'    },
        ],
        insight: '本季度简历筛选准确率提升 3%，误筛率降低至 8.2%，节省 HR 团队约 41 小时人工复核时间。',
      },
      {
        key: 'efficiency', score: 91, prevScore: 88, up: true,
        indicators: [
          { label: '简历批量处理速度', score: 94, level: 'excellent' },
          { label: '面试安排响应时长', score: 90, level: 'good'      },
          { label: '候选人跟进及时率', score: 87, level: 'good'      },
        ],
        insight: '平均每份简历处理时长 38 秒，较上季度提升 22%，面试安排平均在 2 小时内完成通知。',
      },
      {
        key: 'knowledge', score: 82, prevScore: 80, up: true,
        indicators: [
          { label: '职位知识库覆盖度', score: 85, level: 'good'    },
          { label: '行业人才市场洞察', score: 80, level: 'average' },
          { label: '薪资基准数据更新', score: 78, level: 'average' },
        ],
        insight: '薪资基准数据上次更新距今 22 天，建议同步 2026 年 Q1 市场薪酬报告，提升匹配精度。',
      },
      {
        key: 'satisfaction', score: 87, prevScore: 86, up: true,
        indicators: [
          { label: '候选人反馈评分', score: 89, level: 'good' },
          { label: '用人部门满意度', score: 87, level: 'good' },
          { label: '沟通专业度评分', score: 84, level: 'good' },
        ],
        insight: '候选人体验评分 4.4/5，用人部门满意度环比上升 2 个百分点，无投诉记录。',
      },
      {
        key: 'decision', score: 78, prevScore: 75, up: true,
        indicators: [
          { label: '多维度综合评估', score: 81, level: 'average' },
          { label: '复杂岗位推荐准确', score: 77, level: 'average' },
          { label: '紧急需求应对能力', score: 75, level: 'average' },
        ],
        insight: '自主决策力是本员工重点提升方向，建议增加复杂招聘场景训练数据，目标 Q2 提升至 85 分。',
      },
      {
        key: 'exception', score: 84, prevScore: 83, up: true,
        indicators: [
          { label: '异常简历识别率', score: 88, level: 'good'    },
          { label: '重复候选人去重', score: 85, level: 'good'    },
          { label: '数据异常预警',   score: 78, level: 'average' },
        ],
        insight: '本月成功拦截 3 份虚假简历，重复候选人识别准确率 98.6%，无重大数据异常事件。',
      },
    ],
    recentTasks: [
      { id: 't1', name: '研发岗位简历批量筛选',   status: 'done',    time: '10:45', duration: '3m21s', trigger: '定时触发', score: 5    },
      { id: 't2', name: '面试安排通知发送',        status: 'done',    time: '09:30', duration: '0m52s', trigger: '对话触发', score: 4    },
      { id: 't3', name: '候选人背景调查汇总',      status: 'running', time: '11:52', duration: '—',     trigger: '事件触发', score: null },
      { id: 't4', name: '招聘渠道效果周报',        status: 'done',    time: '08:00', duration: '2m08s', trigger: '定时触发', score: 5    },
      { id: 't5', name: '人才库定期清洗与更新',    status: 'waiting', time: '—',     duration: '—',     trigger: '定时触发', score: null },
    ],
    reviews: [
      { user: '陈 HR', dept: '人力资源部', score: 5, comment: '筛简历速度超快，初筛质量非常高，大大减轻了我们的工作压力，非常满意！', time: '2026-04-01' },
      { user: '刘总监', dept: '技术部',    score: 4, comment: '推荐的候选人质量不错，偶尔有一两个不太匹配，整体表现良好。',           time: '2026-03-27' },
    ],
    insights: [
      { type: 'good',    text: '本季度简历处理量较上季度增长 12%，效率持续提升' },
      { type: 'good',    text: '候选人满意度评分 4.4 分，在 HR 工具中排名前列' },
      { type: 'warn',    text: '自主决策力维度得分 78 分，低于团队均值，需重点关注' },
      { type: 'suggest', text: '建议接入猎聘、Boss 直聘等更多渠道 API，提升候选人覆盖面' },
    ],
  },

  'de-003': {
    overallScore: 88, prevScore: 84, teamAvg: 87, ranking: '前 18%',
    evaluation: { cycle: '2026 Q1', status: '已完成', completedAt: '2026-04-01' },
    badges: ['数据精英', '报表达人', '准时交付'],
    dimensions:     { accuracy: 93, efficiency: 86, knowledge: 90, satisfaction: 88, decision: 82, exception: 86 },
    teamDimensions: { accuracy: 88, efficiency: 84, knowledge: 80, satisfaction: 85, decision: 79, exception: 82 },
    usage: {
      today:   { callCount: 47,   tokens: 284100,  cost: 14.21, score: 4.5, heat: 82 },
      week:    { callCount: 312,  tokens: 1982400, cost: 99.12, score: 4.5, heat: 82 },
      month:   { callCount: 1421, tokens: 8941200, cost: 447.06, score: 4.5, heat: 82 },
      quarter: { callCount: 4284, tokens: 26184300, cost: 1309.22, score: 4.5, heat: 82 },
    },
    evaluatorGroups: [
      { label: '系统监控', sublabel: '自动采集任务执行质量', score: 90, prevScore: 86, color: '#6366F1', icon: <RobotOutlined />,      weight: '40%' },
      { label: '用户评价', sublabel: '实际用户满意度打分',   score: 87, prevScore: 83, color: '#10B981', icon: <StarOutlined />,        weight: '35%' },
      { label: '任务指标', sublabel: '基于完成率与准时率',   score: 88, prevScore: 85, color: '#F59E0B', icon: <CheckCircleOutlined />, weight: '25%' },
    ],
    kpis: {
      today:   { workHours: '6.8h',  tasks: 8,   completionRate: 100,  changes: ['+1.2h', '+3',  '+2.1%'], ups: [true, true, true] },
      week:    { workHours: '41.3h', tasks: 43,  completionRate: 97.7, changes: ['+4.2h', '+7',  '+1.2%'], ups: [true, true, true] },
      month:   { workHours: '168h',  tasks: 178, completionRate: 96.1, changes: ['+15h',  '+24', '+1.8%'], ups: [true, true, true] },
      quarter: { workHours: '501h',  tasks: 524, completionRate: 95.4, changes: ['+38h',  '+72', '+2.6%'], ups: [true, true, true] },
    },
    dimensionDetail: [
      {
        key: 'accuracy', score: 93, prevScore: 89, up: true,
        indicators: [
          { label: '财务数据计算准确率', score: 96, level: 'excellent' },
          { label: '报表格式合规度',     score: 93, level: 'good'      },
          { label: '数据交叉校验通过率', score: 90, level: 'good'      },
        ],
        insight: '本季度财务报表零错误率 96.3%，较上季度提升 4.2 个百分点，已连续两个月达到优秀标准。',
      },
      {
        key: 'efficiency', score: 86, prevScore: 83, up: true,
        indicators: [
          { label: '月报生成耗时',   score: 89, level: 'good'    },
          { label: '数据拉取响应速度', score: 86, level: 'good'  },
          { label: '多表合并处理速度', score: 82, level: 'average' },
        ],
        insight: '月度财务报告生成时长从 47 分钟缩短至 31 分钟，效率提升 34%，但多表合并场景仍有优化空间。',
      },
      {
        key: 'knowledge', score: 90, prevScore: 87, up: true,
        indicators: [
          { label: '会计准则覆盖度',   score: 93, level: 'excellent' },
          { label: '税务法规熟悉程度', score: 91, level: 'good'      },
          { label: '行业财务指标库',   score: 86, level: 'good'      },
        ],
        insight: '知识库涵盖 2024—2026 年主要会计准则变动，本季度主动推送了 3 条税收政策变更预警。',
      },
      {
        key: 'satisfaction', score: 88, prevScore: 86, up: true,
        indicators: [
          { label: '报告可读性评分', score: 91, level: 'good' },
          { label: '数据解读清晰度', score: 88, level: 'good' },
          { label: '定制需求响应率', score: 84, level: 'good' },
        ],
        insight: '财务团队满意度 4.5/5，CFO 评价「数据准确、格式规范」，自定义报表需求满足率 94%。',
      },
      {
        key: 'decision', score: 82, prevScore: 78, up: true,
        indicators: [
          { label: '异常数据判断力',   score: 85, level: 'good'    },
          { label: '预算偏差预警精度', score: 83, level: 'good'    },
          { label: '复杂财务情境处理', score: 77, level: 'average' },
        ],
        insight: '本季度自主识别预算偏差预警 12 次，准确率 91.7%，减少人工审核约 28 小时。',
      },
      {
        key: 'exception', score: 86, prevScore: 85, up: true,
        indicators: [
          { label: '数据异常捕获率', score: 90, level: 'good'    },
          { label: '报表差错自动修复', score: 86, level: 'good'  },
          { label: '系统对接故障处理', score: 82, level: 'average' },
        ],
        insight: '本月拦截数据异常 8 次，自动修复成功率 87.5%，ERP 对接偶发超时，建议优化重试机制。',
      },
    ],
    recentTasks: [
      { id: 't1', name: '3 月份财务汇总报表',     status: 'done',    time: '09:00', duration: '31m', trigger: '定时触发', score: 5    },
      { id: 't2', name: 'Q1 季度财务分析报告',    status: 'done',    time: '10:30', duration: '48m', trigger: '对话触发', score: 5    },
      { id: 't3', name: '成本中心费用明细导出',   status: 'running', time: '11:55', duration: '—',   trigger: '对话触发', score: null },
      { id: 't4', name: '税务申报数据核验',       status: 'done',    time: '08:30', duration: '12m', trigger: '定时触发', score: 4    },
      { id: 't5', name: '4 月预算执行追踪报告',   status: 'waiting', time: '—',     duration: '—',   trigger: '定时触发', score: null },
    ],
    reviews: [
      { user: '赵 CFO',  dept: '财务中心', score: 5, comment: '数据准确，格式规范，月报和季报生成效率极高，我们财务部门已完全依赖它！', time: '2026-04-01' },
      { user: '孙经理',  dept: '财务部',   score: 4, comment: '整体很好，有时候对定制报表格式的理解需要多沟通几次，但问题不大。',       time: '2026-03-30' },
      { user: '周主计',  dept: '财务中心', score: 5, comment: '税务数据核验非常靠谱，从没出过错，省了我大量时间，继续保持！',           time: '2026-03-22' },
    ],
    insights: [
      { type: 'good',    text: '本季度报表生成效率提升 34%，零错误率再创新高达 96.3%' },
      { type: 'good',    text: '自主识别预算偏差预警准确率 91.7%，远超同类工具' },
      { type: 'warn',    text: '多表合并处理场景效率评分 82 分，建议优化数据流水线' },
      { type: 'suggest', text: '建议接入集团 ERP 实时数据流，可将月报生成时长再缩短 40%' },
    ],
  },

  'de-004': {
    overallScore: 79, prevScore: 76, teamAvg: 87, ranking: '前 45%',
    evaluation: { cycle: '2026 Q1', status: '已完成', completedAt: '2026-04-01' },
    badges: ['Bug 猎手', '代码卫士'],
    dimensions:     { accuracy: 84, efficiency: 80, knowledge: 86, satisfaction: 75, decision: 72, exception: 78 },
    teamDimensions: { accuracy: 88, efficiency: 84, knowledge: 80, satisfaction: 85, decision: 79, exception: 82 },
    usage: {
      today:   { callCount: 63,   tokens: 189200,  cost: 9.46,  score: 3.8, heat: 61 },
      week:    { callCount: 418,  tokens: 1241600, cost: 62.08, score: 3.8, heat: 61 },
      month:   { callCount: 1842, tokens: 5384100, cost: 269.21, score: 3.8, heat: 61 },
      quarter: { callCount: 5284, tokens: 15682400, cost: 784.12, score: 3.8, heat: 61 },
    },
    evaluatorGroups: [
      { label: '系统监控', sublabel: '自动采集任务执行质量', score: 81, prevScore: 78, color: '#6366F1', icon: <RobotOutlined />,      weight: '40%' },
      { label: '用户评价', sublabel: '实际用户满意度打分',   score: 76, prevScore: 74, color: '#10B981', icon: <StarOutlined />,        weight: '35%' },
      { label: '任务指标', sublabel: '基于完成率与准时率',   score: 80, prevScore: 77, color: '#F59E0B', icon: <CheckCircleOutlined />, weight: '25%' },
    ],
    kpis: {
      today:   { workHours: '4.5h',  tasks: 6,   completionRate: 83.3, changes: ['-0.5h', '-1',  '-2.1%'], ups: [false, false, false] },
      week:    { workHours: '28.7h', tasks: 38,  completionRate: 86.8, changes: ['-2.1h', '-4',  '-1.3%'], ups: [false, false, false] },
      month:   { workHours: '118h',  tasks: 152, completionRate: 87.5, changes: ['-6h',   '-12', '-0.8%'], ups: [false, false, false] },
      quarter: { workHours: '356h',  tasks: 448, completionRate: 88.2, changes: ['+11h',  '+28', '+1.1%'], ups: [true,  true,  true]  },
    },
    dimensionDetail: [
      {
        key: 'accuracy', score: 84, prevScore: 81, up: true,
        indicators: [
          { label: 'Bug 识别准确率',   score: 88, level: 'good'    },
          { label: '代码规范检查精度', score: 84, level: 'good'    },
          { label: '安全漏洞检测率',   score: 79, level: 'average' },
        ],
        insight: '本月 Bug 识别率提升至 88%，但安全漏洞检测覆盖面不足，建议补充 OWASP Top 10 专项规则库。',
      },
      {
        key: 'efficiency', score: 80, prevScore: 78, up: true,
        indicators: [
          { label: 'PR 审查平均耗时', score: 83, level: 'good'    },
          { label: '大型文件处理速度', score: 78, level: 'average' },
          { label: '并发 PR 处理能力', score: 75, level: 'average' },
        ],
        insight: '单 PR 审查平均耗时 4.2 分钟，但并发超过 5 个 PR 时性能明显下降，建议增加处理配额。',
      },
      {
        key: 'knowledge', score: 86, prevScore: 83, up: true,
        indicators: [
          { label: '编程语言覆盖度',   score: 90, level: 'good'    },
          { label: '设计模式识别能力', score: 87, level: 'good'    },
          { label: '安全编码规范',     score: 80, level: 'average' },
        ],
        insight: '支持 12 种主流编程语言，本季度新增 Rust 和 Go 的审查能力，安全编码规范库需扩充。',
      },
      {
        key: 'satisfaction', score: 75, prevScore: 73, up: true,
        indicators: [
          { label: '审查意见清晰度', score: 78, level: 'average' },
          { label: '开发者采纳率',   score: 74, level: 'average' },
          { label: '沟通响应及时性', score: 72, level: 'average' },
        ],
        insight: '开发团队反馈审查意见有时过于简略，建议优化输出模板，增加问题描述和修复建议的详细度。',
      },
      {
        key: 'decision', score: 72, prevScore: 70, up: true,
        indicators: [
          { label: '代码架构合理性判断', score: 75, level: 'average' },
          { label: '技术债务识别能力',   score: 72, level: 'average' },
          { label: '复杂逻辑审查',       score: 68, level: 'average' },
        ],
        insight: '自主决策力是本员工最薄弱维度，建议引入架构图分析能力，并增加复杂业务逻辑的训练样本。',
      },
      {
        key: 'exception', score: 78, prevScore: 76, up: true,
        indicators: [
          { label: '审查中断恢复能力', score: 82, level: 'average' },
          { label: '异常代码识别率',   score: 79, level: 'average' },
          { label: '超时任务处理',     score: 72, level: 'average' },
        ],
        insight: '本月出现 2 次审查超时未完成情况，建议设置超时自动降级机制并推送人工介入提醒。',
      },
    ],
    recentTasks: [
      { id: 't1', name: 'feat/payment-refactor PR 审查', status: 'done',    time: '10:18', duration: '4m32s', trigger: '事件触发', score: 4    },
      { id: 't2', name: 'fix/auth-bug PR 审查',          status: 'done',    time: '09:05', duration: '2m18s', trigger: '事件触发', score: 5    },
      { id: 't3', name: 'main 分支代码质量周报',         status: 'running', time: '11:50', duration: '—',     trigger: '定时触发', score: null },
      { id: 't4', name: 'chore/deps-update PR 审查',     status: 'failed',  time: '08:44', duration: '—',     trigger: '事件触发', score: null },
      { id: 't5', name: '安全漏洞扫描报告',              status: 'waiting', time: '—',     duration: '—',     trigger: '定时触发', score: null },
    ],
    reviews: [
      { user: '吴工',   dept: '技术部', score: 4, comment: '审查速度很快，发现了不少隐藏 Bug，就是有时候建议太简略，希望能更详细些。', time: '2026-04-01' },
      { user: '郑架构', dept: '技术部', score: 3, comment: '基础规范检查不错，但对复杂业务逻辑的理解还有差距，需要继续优化。',         time: '2026-03-25' },
    ],
    insights: [
      { type: 'good',    text: '本季度 PR 审查量提升 28%，Bug 识别率逐月稳步增长' },
      { type: 'warn',    text: '本月完成率 87.5%，低于团队均值，出现 2 次审查超时' },
      { type: 'warn',    text: '用户满意度 75 分，低于团队均值 10 分，输出质量需提升' },
      { type: 'suggest', text: '建议补充安全编码规范库和架构分析能力，重点提升自主决策力维度' },
    ],
  },

  'de-008': {
    overallScore: 94, prevScore: 91, teamAvg: 87, ranking: '前 3%',
    evaluation: { cycle: '2026 Q1', status: '已完成', completedAt: '2026-04-01' },
    badges: ['安全卫士', '零故障王', '预警先锋', '响应冠军'],
    dimensions:     { accuracy: 96, efficiency: 93, knowledge: 91, satisfaction: 94, decision: 92, exception: 97 },
    teamDimensions: { accuracy: 88, efficiency: 84, knowledge: 80, satisfaction: 85, decision: 79, exception: 82 },
    usage: {
      today:   { callCount: 847,   tokens: 1284100, cost: 64.21, score: 4.9, heat: 99 },
      week:    { callCount: 5932,  tokens: 8984200, cost: 449.21, score: 4.9, heat: 99 },
      month:   { callCount: 24156, tokens: 38421600, cost: 1921.08, score: 4.9, heat: 99 },
      quarter: { callCount: 72314, tokens: 114821800, cost: 5741.09, score: 4.9, heat: 99 },
    },
    evaluatorGroups: [
      { label: '系统监控', sublabel: '自动采集任务执行质量', score: 96, prevScore: 93, color: '#6366F1', icon: <RobotOutlined />,      weight: '40%' },
      { label: '用户评价', sublabel: '实际用户满意度打分',   score: 93, prevScore: 90, color: '#10B981', icon: <StarOutlined />,        weight: '35%' },
      { label: '任务指标', sublabel: '基于完成率与准时率',   score: 94, prevScore: 91, color: '#F59E0B', icon: <CheckCircleOutlined />, weight: '25%' },
    ],
    kpis: {
      today:   { workHours: '24h',   tasks: 847, completionRate: 99.8, changes: ['+0h',  '+31',  '+0.1%'], ups: [false, true, true] },
      week:    { workHours: '168h',  tasks: 5932, completionRate: 99.6, changes: ['+0h',  '+218', '+0.2%'], ups: [false, true, true] },
      month:   { workHours: '720h',  tasks: 24156, completionRate: 99.3, changes: ['+0h', '+890', '+0.3%'], ups: [false, true, true] },
      quarter: { workHours: '2160h', tasks: 72314, completionRate: 99.1, changes: ['+0h', '+2841', '+0.5%'], ups: [false, true, true] },
    },
    dimensionDetail: [
      {
        key: 'accuracy', score: 96, prevScore: 93, up: true,
        indicators: [
          { label: '管道压力异常识别率', score: 98, level: 'excellent' },
          { label: '设备状态判断准确率', score: 96, level: 'excellent' },
          { label: '预警误报率控制',     score: 94, level: 'excellent' },
        ],
        insight: '本季度压力异常识别准确率 98.2%，误报率仅 1.8%，达到行业最优水平，已成为团队基准标杆。',
      },
      {
        key: 'efficiency', score: 93, prevScore: 90, up: true,
        indicators: [
          { label: '实时监控响应延迟', score: 95, level: 'excellent' },
          { label: '告警推送及时率',   score: 93, level: 'excellent' },
          { label: '批量设备巡检速度', score: 90, level: 'good'      },
        ],
        insight: '平均告警响应时延 0.8 秒，巡检任务平均完成时长从 18 分钟缩短至 11 分钟，效率显著提升。',
      },
      {
        key: 'knowledge', score: 91, prevScore: 88, up: true,
        indicators: [
          { label: '管道工艺知识覆盖度', score: 94, level: 'excellent' },
          { label: '设备故障案例库',     score: 91, level: 'good'      },
          { label: '行业安全标准更新',   score: 87, level: 'good'      },
        ],
        insight: '知识库已涵盖 GB 50028、SY/T 5922 等 47 项行业标准，本季度新增 231 条历史故障案例。',
      },
      {
        key: 'satisfaction', score: 94, prevScore: 92, up: true,
        indicators: [
          { label: '运维团队满意度',   score: 96, level: 'excellent' },
          { label: '告警可读性评分',   score: 93, level: 'excellent' },
          { label: '应急处置引导质量', score: 92, level: 'good'      },
        ],
        insight: '运维团队满意度 4.8/5，连续 6 个月在全公司数字员工评分中排名第一，零差评记录。',
      },
      {
        key: 'decision', score: 92, prevScore: 89, up: true,
        indicators: [
          { label: '多因素综合研判',   score: 94, level: 'excellent' },
          { label: '风险等级自主评估', score: 93, level: 'excellent' },
          { label: '应急方案自动生成', score: 88, level: 'good'      },
        ],
        insight: '本季度自主研判并处置高风险预警 38 次，准确率 97.4%，自动生成应急预案被采纳率 91%。',
      },
      {
        key: 'exception', score: 97, prevScore: 95, up: true,
        indicators: [
          { label: '异常事件识别率', score: 99, level: 'excellent' },
          { label: '故障自愈成功率', score: 97, level: 'excellent' },
          { label: '级联故障阻断率', score: 94, level: 'excellent' },
        ],
        insight: '本季度零重大安全事故，成功阻断 3 次潜在级联故障，异常处理力维度位居全公司第一。',
      },
    ],
    recentTasks: [
      { id: 't1', name: '3 号干线压力异常告警处置', status: 'done',    time: '03:22', duration: '0m47s', trigger: '系统触发', score: 5    },
      { id: 't2', name: '全线设备凌晨例行巡检',     status: 'done',    time: '02:00', duration: '11m',   trigger: '定时触发', score: 5    },
      { id: 't3', name: '阀门组 A12 温度异常分析',  status: 'running', time: '11:58', duration: '—',     trigger: '系统触发', score: null },
      { id: 't4', name: '本周安全巡检汇总报告',     status: 'done',    time: '08:00', duration: '6m',    trigger: '定时触发', score: 5    },
      { id: 't5', name: 'Q2 设备维保计划生成',      status: 'waiting', time: '—',     duration: '—',     trigger: '对话触发', score: null },
    ],
    reviews: [
      { user: '何站长',  dept: '管道运营部', score: 5, comment: '24 小时不间断监控，比人工值守靠谱多了，这个季度让我睡了不少安稳觉！',   time: '2026-04-01' },
      { user: '余总工',  dept: '安全管理部', score: 5, comment: '告警精准，误报极少，应急处置引导非常专业，已成为我们安全体系的核心。', time: '2026-03-29' },
      { user: '冯队长',  dept: '运维部',     score: 5, comment: '巡检报告质量很高，发现了好几个人工容易忽略的隐患，强烈推荐！',         time: '2026-03-20' },
    ],
    insights: [
      { type: 'good',    text: '本季度零重大安全事故，异常处理力 97 分排名全公司数字员工第一' },
      { type: 'good',    text: '告警准确率 98.2%，误报率控制在 1.8%，达到行业最优水平' },
      { type: 'good',    text: '运维满意度连续 6 个月第一，自主研判准确率 97.4%' },
      { type: 'suggest', text: '建议扩展至 5 号、6 号干线的实时监控覆盖，预计可再减少 30% 人工巡查' },
    ],
  },
};

// ─── Main Component ───────────────────────────────────────────────

interface DigitalEmployeeProfileProps { embedded?: boolean; }

const DigitalEmployeeProfile: React.FC<DigitalEmployeeProfileProps> = ({ embedded }) => {
  const [period, setPeriod]           = useState<PeriodKey>('month');
  const [selectedEmp, setSelectedEmp] = useState('de-001');
  const [reviewOpen, setReviewOpen]   = useState(false);
  const [activeDim, setActiveDim]     = useState<string | null>(null);

  const emp  = EMPLOYEES.find(e => e.id === selectedEmp) || EMPLOYEES[0];
  const data = MOCK[selectedEmp] || MOCK['de-001'];
  const kpi   = data.kpis[period];
  const usage = data.usage?.[period];

  const dimValues     = DIMENSIONS.map(d => data.dimensions[d.key] as number);
  const teamDimValues = DIMENSIONS.map(d => data.teamDimensions[d.key] as number);
  const satisfactionScore = data.reviews.reduce((s: number, r: any) => s + r.score, 0) / data.reviews.length;

  const CARD = {
    background: '#fff',
    borderRadius: 12,
    border: '1px solid #e8e8e8',
  } as const;

  const periodLabel = period === 'today' ? '今日' : period === 'week' ? '本周' : period === 'month' ? '本月' : '本季';

  return (
    <div style={{ padding: 24, background: '#f7f8fc', minHeight: '100%' }}>

      {/* ══ 01 · 页头 ════════════════════════════════════════════ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Avatar */}
          <div style={{
            width: 48, height: 48, borderRadius: 12, flexShrink: 0,
            background: `linear-gradient(135deg, ${emp.color}, ${emp.color}bb)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 17, fontWeight: 700,
            boxShadow: `0 3px 10px ${emp.color}40`,
          }}>
            {emp.avatar}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>{emp.name}</span>
              <Tag style={{ background: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0', fontSize: 11, borderRadius: 8, margin: 0 }}>
                ● 运行中
              </Tag>
              {data.badges.slice(0, 3).map((b: string) => (
                <Tag key={b} style={{ background: '#f5f4ff', color: '#6366F1', borderColor: '#e0deff', borderRadius: 8, fontSize: 11, margin: 0 }}>
                  🏅 {b}
                </Tag>
              ))}
            </div>
            <div style={{ fontSize: 12, color: '#999', display: 'flex', gap: 14 }}>
              <span>{emp.dept}</span>
              <span>{selectedEmp}</span>
              <span>{emp.version}</span>
              <span>评估周期：{data.evaluation.cycle}</span>
              <span style={{ color: '#10b981' }}>✓ 评估{data.evaluation.status}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Select
            value={selectedEmp}
            onChange={setSelectedEmp}
            style={{ width: 150 }}
            options={EMPLOYEES.map(e => ({ label: e.name, value: e.id }))}
          />
          {/* Period toggle — matches ScheduledTasks filter style */}
          <div style={{ display: 'flex', background: '#fff', borderRadius: 8, border: '1px solid #e8e8e8', overflow: 'hidden' }}>
            {PERIODS.map(p => (
              <div key={p.key} onClick={() => setPeriod(p.key)} style={{
                padding: '5px 14px', cursor: 'pointer', fontSize: 13,
                fontWeight: period === p.key ? 600 : 400,
                color:      period === p.key ? '#fff' : '#555',
                background: period === p.key ? '#6366F1' : 'transparent',
                transition: 'all 0.15s',
              }}>
                {p.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ 02 · 综合评分 + 雷达图 + 多方评估 ═════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '210px 1fr 268px', gap: 14, marginBottom: 14 }}>

        {/* 综合评分 */}
        <div style={{ ...CARD, padding: '20px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ width: '100%', fontSize: 13, fontWeight: 700, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 6 }}>
            <RiseOutlined style={{ color: '#6366F1' }} /> 综合评分
          </div>
          <ScoreRing score={data.overallScore} size={116} />

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: '上季度',  value: data.prevScore,    color: '#e5e7eb', text: '#9ca3af' },
              { label: '团队均��', value: data.teamAvg,      color: '#93c5fd', text: '#3b82f6' },
              { label: '本季度',  value: data.overallScore, color: '#6366F1', text: '#6366F1' },
            ].map(item => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}>
                  <span style={{ color: '#888' }}>{item.label}</span>
                  <span style={{ fontWeight: 700, color: item.text }}>{item.value}</span>
                </div>
                <div style={{ height: 4, borderRadius: 3, background: '#f5f5f5', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: item.color, width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ width: '100%', padding: '9px 12px', borderRadius: 8,
            background: '#f5f4ff', border: '1px solid #e0deff', textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6366F1' }}>🏆 优秀等级</div>
            <div style={{ fontSize: 11, color: '#a5b4fc', marginTop: 2 }}>超越 {data.ranking} 的数字员工</div>
          </div>
        </div>

        {/* 六维能力雷达 */}
        <div style={{ ...CARD, padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 6 }}>
              <RobotOutlined style={{ color: '#6366F1' }} /> 六维能力画像
            </div>
            <div style={{ display: 'flex', gap: 14, fontSize: 11, color: '#bbb' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 16, height: 2, background: '#6366F1', display: 'inline-block', borderRadius: 1 }} />
                本员工
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 14, height: 0, border: '1px dashed #d1d5db', display: 'inline-block' }} />
                团队均值
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <RadarChart values={dimValues} teamValues={teamDimValues} size={240} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, minWidth: 144 }}>
              {DIMENSIONS.map((dim, i) => {
                const score = dimValues[i];
                const diff  = score - teamDimValues[i];
                return (
                  <div key={dim.key} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 13, color: dim.color, width: 16, flexShrink: 0 }}>{dim.icon}</span>
                    <span style={{ fontSize: 11, color: '#555', flex: 1 }}>{dim.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: dim.color }}>{score}</span>
                    <span style={{ fontSize: 10, color: diff >= 0 ? '#10b981' : '#ef4444',
                      display: 'flex', alignItems: 'center', gap: 1, width: 24, justifyContent: 'flex-end' }}>
                      {diff >= 0 ? <ArrowUpOutlined style={{ fontSize: 8 }} /> : <ArrowDownOutlined style={{ fontSize: 8 }} />}
                      {Math.abs(diff)}
                    </span>
                  </div>
                );
              })}
              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 6, fontSize: 10, color: '#bbb' }}>
                ↑↓ 相较团队均值
              </div>
            </div>
          </div>
        </div>

        {/* 多方评估来源 */}
        <div style={{ ...CARD, padding: '20px 18px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircleOutlined style={{ color: '#10B981' }} /> 多方评估来源
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
            {data.evaluatorGroups.map((grp: any) => (
              <div key={grp.label} style={{
                padding: '12px 14px', borderRadius: 10,
                background: `${grp.color}08`, border: `1px solid ${grp.color}1a`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: `${grp.color}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: grp.color, fontSize: 13 }}>
                      {grp.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>{grp.label}</div>
                      <div style={{ fontSize: 10, color: '#bbb' }}>权重 {grp.weight}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: grp.color, lineHeight: 1 }}>{grp.score}</div>
                    <div style={{ fontSize: 10, color: '#10b981', display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end', marginTop: 2 }}>
                      <ArrowUpOutlined style={{ fontSize: 8 }} /> {grp.score - grp.prevScore} vs 上季
                    </div>
                  </div>
                </div>
                <div style={{ height: 3, borderRadius: 2, background: '#f0f0f0', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 2, background: grp.color, width: `${grp.score}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* KPI 快览 */}
          <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 8, background: '#f7f8fc', border: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 8 }}>周期快览 · {periodLabel}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {[
                { label: '工时',  value: kpi.workHours,          change: kpi.changes[0], up: kpi.ups[0] },
                { label: '任务量', value: String(kpi.tasks),     change: kpi.changes[1], up: kpi.ups[1] },
                { label: '完成率', value: `${kpi.completionRate}%`, change: kpi.changes[2], up: kpi.ups[2] },
              ].map(item => (
                <div key={item.label} style={{ textAlign: 'center', padding: '7px 4px',
                  borderRadius: 8, background: '#fff', border: '1px solid #f0f0f0' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{item.value}</div>
                  <div style={{ fontSize: 10, color: '#bbb', marginTop: 1 }}>{item.label}</div>
                  <div style={{ fontSize: 10, color: item.up ? '#10b981' : '#ef4444', marginTop: 2 }}>
                    {item.up ? '↑' : '↓'} {item.change}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══ 03 · 使用概览 ══════════════════════════════════════════ */}
      {usage && (
        <div style={{ ...CARD, padding: '16px 22px', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 6 }}>
              <DatabaseOutlined style={{ color: '#6366F1' }} /> 使用概览
              <span style={{ fontSize: 11, color: '#bbb', fontWeight: 400 }}>· {periodLabel}</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {[
              {
                label: '调用量', icon: <ClockCircleOutlined />, color: '#6366F1',
                value: usage.callCount >= 10000
                  ? (usage.callCount / 10000).toFixed(1) + '万'
                  : usage.callCount >= 1000
                  ? (usage.callCount / 1000).toFixed(1) + 'k'
                  : String(usage.callCount),
                sub: '次请求',
              },
              {
                label: 'Token 消耗', icon: <ThunderboltOutlined />, color: '#8B5CF6',
                value: usage.tokens >= 1000000
                  ? (usage.tokens / 1000000).toFixed(2) + 'M'
                  : (usage.tokens / 1000).toFixed(1) + 'K',
                sub: 'tokens',
              },
              {
                label: '估算费用', icon: <RiseOutlined />, color: '#10B981',
                value: `¥${usage.cost >= 1000 ? (usage.cost / 1000).toFixed(2) + 'k' : usage.cost.toFixed(2)}`,
                sub: '按量计费',
              },
              {
                label: '用户评分', icon: <StarOutlined />, color: '#F59E0B',
                value: `${usage.score.toFixed(1)} ⭐`,
                sub: '满分 5.0',
              },
              {
                label: '近期热度', icon: <RiseOutlined />, color: '#EF4444',
                value: `${usage.heat}%`,
                sub: '峰值占比',
              },
            ].map(item => (
              <div key={item.label} style={{
                padding: '12px 14px', borderRadius: 10,
                background: `${item.color}06`, border: `1px solid ${item.color}18`,
                display: 'flex', flexDirection: 'column', gap: 4,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#888' }}>
                  <span style={{ color: item.color, fontSize: 12 }}>{item.icon}</span>
                  {item.label}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: item.color, lineHeight: 1.2 }}>{item.value}</div>
                <div style={{ fontSize: 10, color: '#bbb' }}>{item.sub}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ 04 · 维度能力详情 ══════════════════════════════════════ */}
      <div style={{ ...CARD, padding: '20px 22px', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ThunderboltOutlined style={{ color: '#F59E0B' }} /> 维度能力详情
          </div>
          <span style={{ fontSize: 12, color: '#bbb' }}>点击卡片展开 AI 洞察</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {data.dimensionDetail.map((dim: any) => {
            const cfg      = DIMENSIONS.find(d => d.key === dim.key)!;
            const isActive = activeDim === dim.key;
            return (
              <div key={dim.key} onClick={() => setActiveDim(isActive ? null : dim.key)} style={{
                borderRadius: 10, padding: '14px 16px', cursor: 'pointer',
                border: `1px solid ${isActive ? cfg.color + '44' : '#f0f0f0'}`,
                background: isActive ? `${cfg.color}06` : '#fafafa',
                transition: 'all 0.18s',
                boxShadow: isActive ? `0 0 0 2px ${cfg.color}18` : 'none',
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8,
                      background: `${cfg.color}14`, color: cfg.color, fontSize: 14,
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {cfg.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>{cfg.label}</div>
                      <div style={{ fontSize: 10, color: dim.up ? '#10b981' : '#ef4444',
                        display: 'flex', alignItems: 'center', gap: 2, marginTop: 1 }}>
                        {dim.up ? <ArrowUpOutlined style={{ fontSize: 8 }} /> : <ArrowDownOutlined style={{ fontSize: 8 }} />}
                        {Math.abs(dim.score - dim.prevScore)} vs 上季度
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 26, fontWeight: 700, color: cfg.color, lineHeight: 1 }}>{dim.score}</div>
                    <div style={{ fontSize: 10, color: '#bbb', marginTop: 2 }}>/ 100</div>
                  </div>
                </div>

                {/* Score bar */}
                <div style={{ height: 5, borderRadius: 3, background: '#ebebeb', marginBottom: 12, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3,
                    background: `linear-gradient(90deg, ${cfg.color}bb, ${cfg.color})`,
                    width: `${dim.score}%` }} />
                </div>

                {/* Sub-indicators */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {dim.indicators.map((ind: any) => {
                    const lvl = LEVEL_CFG[ind.level];
                    return (
                      <div key={ind.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: 11, color: '#555' }}>{ind.label}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: lvl.color }}>{ind.score}</span>
                            <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: lvl.bg, color: lvl.color }}>
                              {lvl.label}
                            </span>
                          </div>
                        </div>
                        <div style={{ height: 3, borderRadius: 2, background: '#ebebeb', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 2, background: lvl.color, width: `${ind.score}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Insight panel */}
                {isActive && (
                  <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 8,
                    background: `${cfg.color}0c`, border: `1px solid ${cfg.color}22`,
                    fontSize: 11, color: '#444', lineHeight: 1.7 }}>
                    💡 {dim.insight}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ══ 05 · AI 洞察 + 近期任务 + 用户评价 ════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>

        {/* AI 智能洞察 */}
        <div style={{ ...CARD, padding: '20px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <BulbOutlined style={{ color: '#F59E0B' }} /> AI 智能洞察
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.insights.map((item: any, i: number) => {
              const cfg = item.type === 'good'
                ? { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', icon: '✅' }
                : item.type === 'warn'
                ? { bg: '#fefce8', color: '#ca8a04', border: '#fde68a', icon: '⚠️' }
                : { bg: '#f5f4ff', color: '#6366F1', border: '#e0deff', icon: '💡' };
              return (
                <div key={i} style={{ padding: '9px 11px', borderRadius: 8,
                  background: cfg.bg, border: `1px solid ${cfg.border}`,
                  fontSize: 12, color: cfg.color, lineHeight: 1.65 }}>
                  {cfg.icon} {item.text}
                </div>
              );
            })}
          </div>
        </div>

        {/* 近期任务执行 */}
        <div style={{ ...CARD, padding: '20px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ClockCircleOutlined style={{ color: '#3B82F6' }} /> 近期任务执行
          </div>
          {data.recentTasks.map((task: any, idx: number) => {
            const sc = STATUS_CFG[task.status] ?? STATUS_CFG.waiting;
            return (
              <div key={task.id} style={{
                padding: '9px 0',
                borderBottom: idx < data.recentTasks.length - 1 ? '1px solid #f5f5f5' : 'none',
                display: 'flex', alignItems: 'flex-start', gap: 9,
              }}>
                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 5,
                  background: sc.bg, color: sc.color, fontWeight: 600, flexShrink: 0, marginTop: 1 }}>
                  {sc.label}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: '#222', fontWeight: 500,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {task.name}
                  </div>
                  <div style={{ fontSize: 10, color: '#bbb', marginTop: 3, display: 'flex', gap: 8 }}>
                    {task.time !== '—' && <span>🕐 {task.time}</span>}
                    {task.duration !== '—' && <span>⏱ {task.duration}</span>}
                    <span style={{ color: '#c7d2fe' }}>{task.trigger}</span>
                  </div>
                </div>
                {task.score && (
                  <span style={{ fontSize: 11, color: '#F59E0B', flexShrink: 0 }}>
                    {'★'.repeat(task.score)}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* 用户评价 */}
        <div style={{ ...CARD, padding: '20px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <StarOutlined style={{ color: '#F59E0B' }} /> 用户评价
            </span>
            <span onClick={() => setReviewOpen(true)} style={{
              fontSize: 11, color: '#6366F1', cursor: 'pointer',
              padding: '2px 8px', borderRadius: 6, border: '1px solid #e0deff', background: '#f5f4ff',
            }}>
              查看全部 {data.reviews.length} 条
            </span>
          </div>

          {/* Score bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px',
            borderRadius: 10, background: '#fffbf0', border: '1px solid #fde68a', marginBottom: 14 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#F59E0B', lineHeight: 1 }}>
                {satisfactionScore.toFixed(1)}
              </div>
              <div style={{ fontSize: 12, color: '#F59E0B', marginTop: 3 }}>
                {'★'.repeat(Math.round(satisfactionScore))}
              </div>
              <div style={{ fontSize: 10, color: '#bbb', marginTop: 2 }}>{data.reviews.length} 条评价</div>
            </div>
            <div style={{ flex: 1 }}>
              {[5, 4, 3, 2, 1].map(star => {
                const cnt = data.reviews.filter((r: any) => r.score === star).length;
                return (
                  <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: '#888', width: 10 }}>{star}</span>
                    <div style={{ flex: 1, height: 4, borderRadius: 2, background: '#fde68a40', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 2, background: '#F59E0B',
                        width: data.reviews.length ? `${Math.round(cnt / data.reviews.length * 100)}%` : '0%' }} />
                    </div>
                    <span style={{ fontSize: 10, color: '#bbb', width: 10 }}>{cnt}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Review cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.reviews.slice(0, 2).map((r: any, i: number) => (
              <div key={i} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #f0f0f0', background: '#fafafa' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 11, fontWeight: 700 }}>
                    {r.user.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>{r.user}</span>
                    <span style={{ fontSize: 10, color: '#bbb', marginLeft: 6 }}>{r.dept} · {r.time}</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#F59E0B' }}>{'★'.repeat(r.score)}</span>
                </div>
                <div style={{ fontSize: 11, color: '#555', lineHeight: 1.6 }}>{r.comment}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 评价详情 Drawer ── */}
      <Drawer
        title={<span style={{ fontSize: 14, fontWeight: 700 }}>用户评价 · {emp.name}</span>}
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        width={440}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
          borderRadius: 10, background: '#fffbf0', border: '1px solid #fde68a', marginBottom: 18 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#F59E0B', lineHeight: 1 }}>{satisfactionScore.toFixed(1)}</div>
            <div style={{ fontSize: 13, color: '#F59E0B' }}>
              {'★'.repeat(Math.round(satisfactionScore))}{'☆'.repeat(5 - Math.round(satisfactionScore))}
            </div>
            <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>{data.reviews.length} 条评价</div>
          </div>
          <div style={{ flex: 1 }}>
            {[5, 4, 3, 2, 1].map(star => {
              const cnt = data.reviews.filter((r: any) => r.score === star).length;
              return (
                <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <span style={{ fontSize: 11, color: '#888', width: 12 }}>{star}</span>
                  <div style={{ flex: 1, height: 5, borderRadius: 3, background: '#fde68a40', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, background: '#F59E0B',
                      width: data.reviews.length ? `${Math.round(cnt / data.reviews.length * 100)}%` : '0%' }} />
                  </div>
                  <span style={{ fontSize: 11, color: '#888', width: 12 }}>{cnt}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.reviews.map((r: any, i: number) => (
            <div key={i} style={{ padding: '14px 16px', borderRadius: 10, border: '1px solid #f0f0f0', background: '#fafafa' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 13, fontWeight: 700 }}>
                    {r.user.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{r.user}</div>
                    <div style={{ fontSize: 11, color: '#bbb' }}>{r.dept} · {r.time}</div>
                  </div>
                </div>
                <span style={{ fontSize: 15, color: '#F59E0B' }}>
                  {'★'.repeat(r.score)}{'☆'.repeat(5 - r.score)}
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#555', lineHeight: 1.7 }}>{r.comment}</div>
            </div>
          ))}
        </div>
      </Drawer>
    </div>
  );
};

export default DigitalEmployeeProfile;
