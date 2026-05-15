import React, { useState, useEffect, useRef } from 'react';
import {
  AlertOutlined, CheckCircleOutlined, FileTextOutlined,
  PauseCircleOutlined, PlusOutlined,
  SafetyCertificateOutlined, SettingOutlined,
  StopOutlined, ThunderboltOutlined,
  TeamOutlined, SearchOutlined, DownOutlined,
  CalendarOutlined,
} from '@ant-design/icons';

// ─── Types ─────────────────────────────────────────────────────────────────────
type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';
type CircuitStatus = 'normal' | 'warning' | 'throttled' | 'stopped';
type FenceTab = 'ip' | 'api' | 'topic' | 'knowledge';
type MainTab = 'overview' | 'logs' | 'behavior' | 'sensitive' | 'fence';
type LogSubTab = 'session' | 'tool' | 'audit';

interface AlertEvent {
  id: string; employeeId: string; employeeName: string;
  type: string; desc: string; severity: AlertSeverity;
  status: 'active' | 'resolved'; count: number;
  firstAt: string; lastAt: string; action?: string;
}
interface BehaviorMetric {
  employeeId: string; employeeName: string; dept: string;
  todayCalls: number; baselineCalls: number;
  todayTokens: number; baselineTokens: number;
  sensitiveHits: number; riskScore: number;
  circuitStatus: CircuitStatus; lastActiveAt: string;
}
interface SensitiveWordGroup {
  id: string; name: string;
  category: '政治敏感' | '竞品保护' | '个人隐私' | '财务数据' | '自定义';
  action: 'block' | 'flag' | 'replace';
  words: string[]; hitCount7d: number; enabled: boolean;
}
interface FenceConfig {
  employeeId: string; employeeName: string;
  ipWhitelist: string[]; ipBlacklist: string[];
  allowedApis: string[]; topicBlacklist: string[]; knowledgeScopes: string[];
}
interface SessionLog {
  id: string; employeeName: string; userId: string; dept: string;
  startAt: string; duration: string; msgCount: number; tokens: number;
  status: 'normal' | 'flagged' | 'blocked'; channel: string;
}
interface ToolCallLog {
  id: string; employeeName: string; tool: string; calledAt: string;
  latencyMs: number; status: 'success' | 'error' | 'timeout';
  params: string; result: string; taskId: string;
}
interface AuditLog {
  id: string; operator: string; role: string; action: string;
  target: string; ip: string; at: string; result: 'success' | 'denied';
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_ALERTS: AlertEvent[] = [
  { id: 'a1', employeeId: 'de-001', employeeName: '法务合规助手', type: '高频调用异常', desc: '过去1小时调用量达基线 8.3x（12次/h → 99次/h）', severity: 'critical', status: 'active', count: 3, firstAt: '02:14', lastAt: '03:01', action: '已自动限流至基线120%' },
  { id: 'a2', employeeId: 'de-009', employeeName: '合同审核助手', type: '敏感数据疑似泄露', desc: '输出层检测到身份证号格式字符串，已拦截并脱敏', severity: 'high', status: 'active', count: 1, firstAt: '09:42', lastAt: '09:42', action: '输出已脱敏，事件推送SOC' },
  { id: 'a3', employeeId: 'de-005', employeeName: '智能客服分发', type: 'Prompt 注入尝试', desc: '检测到输入含 "忽略所有之前的指令" 等系统级前缀', severity: 'high', status: 'resolved', count: 7, firstAt: '14:20', lastAt: '16:55', action: '输入已清洗，用户已限制' },
  { id: 'a4', employeeId: 'de-007', employeeName: '智能巡检助手', type: '异常时间段调用', desc: '凌晨 01:30–03:20 检测到持续调用，与正常时间模式不符', severity: 'medium', status: 'active', count: 1, firstAt: '01:30', lastAt: '03:20' },
  { id: 'a5', employeeId: 'de-002', employeeName: 'HR 招聘助手', type: '话题黑名单触发', desc: '用户尝试询问员工薪资数据，触发财务数据围栏规则', severity: 'low', status: 'resolved', count: 12, firstAt: '10:00', lastAt: '08:30', action: '按围栏规则自动拒绝' },
];
const MOCK_METRICS: BehaviorMetric[] = [
  { employeeId: 'de-001', employeeName: '法务合规助手', dept: '法务部', todayCalls: 142, baselineCalls: 68, todayTokens: 284000, baselineTokens: 136000, sensitiveHits: 3, riskScore: 78, circuitStatus: 'throttled', lastActiveAt: '03:01' },
  { employeeId: 'de-009', employeeName: '合同审核助手', dept: '法务部', todayCalls: 28, baselineCalls: 32, todayTokens: 96000, baselineTokens: 88000, sensitiveHits: 1, riskScore: 62, circuitStatus: 'warning', lastActiveAt: '09:42' },
  { employeeId: 'de-005', employeeName: '智能客服分发', dept: '客户成功', todayCalls: 312, baselineCalls: 298, todayTokens: 421000, baselineTokens: 410000, sensitiveHits: 7, riskScore: 45, circuitStatus: 'normal', lastActiveAt: '10:15' },
  { employeeId: 'de-007', employeeName: '智能巡检助手', dept: '管道运营部', todayCalls: 18, baselineCalls: 22, todayTokens: 42000, baselineTokens: 48000, sensitiveHits: 0, riskScore: 28, circuitStatus: 'normal', lastActiveAt: '03:20' },
  { employeeId: 'de-002', employeeName: 'HR 招聘助手', dept: '人力资源', todayCalls: 56, baselineCalls: 61, todayTokens: 78000, baselineTokens: 82000, sensitiveHits: 12, riskScore: 33, circuitStatus: 'normal', lastActiveAt: '10:08' },
  { employeeId: 'de-006', employeeName: '运营数据助手', dept: '运营部', todayCalls: 43, baselineCalls: 40, todayTokens: 58000, baselineTokens: 55000, sensitiveHits: 0, riskScore: 12, circuitStatus: 'normal', lastActiveAt: '09:55' },
];
const MOCK_WORDS: SensitiveWordGroup[] = [
  { id: 'wg-001', name: '政治敏感词库', category: '政治敏感', action: 'block', words: ['涉政词A', '涉政词B', '特定事件词', '敏感机构名'], hitCount7d: 0, enabled: true },
  { id: 'wg-002', name: '个人隐私识别', category: '个人隐私', action: 'block', words: ['身份证号', '手机号码', '银行卡号', '家庭住址', '护照号'], hitCount7d: 1, enabled: true },
  { id: 'wg-003', name: '竞品保护', category: '竞品保护', action: 'flag', words: ['竞品A', '竞品B', '友商C', '对标产品'], hitCount7d: 8, enabled: true },
  { id: 'wg-004', name: '财务数据防泄漏', category: '财务数据', action: 'block', words: ['内部成本', '未公开营收', '融资金额', '薪酬体系'], hitCount7d: 12, enabled: true },
  { id: 'wg-005', name: '自定义业务词库', category: '自定义', action: 'flag', words: ['内部项目代号', '保密合同编号'], hitCount7d: 3, enabled: false },
];
const MOCK_FENCES: FenceConfig[] = [
  { employeeId: 'de-001', employeeName: '法务合规助手', ipWhitelist: ['10.0.0.0/8', '172.16.0.0/12'], ipBlacklist: [], allowedApis: ['law_db_search', 'pdf_parser', 'feishu_push'], topicBlacklist: ['竞品价格', '员工薪资', '股权结构'], knowledgeScopes: ['法律法规库', '公司制度手册'] },
  { employeeId: 'de-009', employeeName: '合同审核助手', ipWhitelist: ['10.0.0.0/8'], ipBlacklist: [], allowedApis: ['pdf_parser', 'law_db_search', 'contract_risk_check'], topicBlacklist: ['股权', '内部薪酬', '政治'], knowledgeScopes: ['合同模板库', '法律法规库'] },
];
const MOCK_SESSIONS: SessionLog[] = [
  { id: 's-001', employeeName: '合同审核助手', userId: 'usr_zhangsan', dept: '法务部', startAt: '2026-04-22 09:38', duration: '12m 34s', msgCount: 18, tokens: 14280, status: 'flagged', channel: 'H5网页' },
  { id: 's-002', employeeName: '法务合规助手', userId: 'usr_lisi', dept: '法务部', startAt: '2026-04-22 09:20', duration: '8m 02s', msgCount: 11, tokens: 9640, status: 'blocked', channel: 'API' },
  { id: 's-003', employeeName: 'HR 招聘助手', userId: 'usr_wangwu', dept: '人力资源', startAt: '2026-04-22 09:05', duration: '5m 18s', msgCount: 7, tokens: 5120, status: 'normal', channel: '飞书' },
  { id: 's-004', employeeName: '智能客服分发', userId: 'usr_zhaoliu', dept: '客户成功', startAt: '2026-04-22 08:55', duration: '3m 44s', msgCount: 5, tokens: 3280, status: 'normal', channel: 'H5网页' },
  { id: 's-005', employeeName: '运营数据助手', userId: 'usr_sunqi', dept: '运营部', startAt: '2026-04-22 08:40', duration: '18m 22s', msgCount: 24, tokens: 22400, status: 'normal', channel: 'API' },
  { id: 's-006', employeeName: '智能巡检助手', userId: 'usr_zhouba', dept: '管道运营部', startAt: '2026-04-22 08:20', duration: '25m 11s', msgCount: 32, tokens: 28600, status: 'normal', channel: '飞书' },
];
const MOCK_TOOL_CALLS: ToolCallLog[] = [
  { id: 'tc-001', employeeName: '合同审核助手', tool: 'pdf_parser', calledAt: '09:42:18', latencyMs: 1240, status: 'success', params: '{"file_url":"oss://contracts/hw-2026.pdf"}', result: '{"pages":18,"clauses":42}', taskId: 't-902' },
  { id: 'tc-002', employeeName: '合同审核助手', tool: 'legal_rules_search', calledAt: '09:42:31', latencyMs: 890, status: 'success', params: '{"query":"违约赔偿上限","domain":"合同法"}', result: '{"hits":3,"articles":["第107条","第114条"]}', taskId: 't-902' },
  { id: 'tc-003', employeeName: '法务合规助手', tool: 'law_db_search', calledAt: '09:21:05', latencyMs: 450, status: 'error', params: '{"query":"数据归属权"}', result: '{"error":"connection_timeout"}', taskId: 't-891' },
  { id: 'tc-004', employeeName: '运营数据助手', tool: 'data_report_gen', calledAt: '08:44:12', latencyMs: 3280, status: 'success', params: '{"sql":"SELECT * FROM metrics","chart":"line"}', result: '{"chart_url":"oss://reports/2026-04-22.pdf"}', taskId: 't-880' },
  { id: 'tc-005', employeeName: '智能巡检助手', tool: 'feishu_push', calledAt: '08:35:58', latencyMs: 210, status: 'success', params: '{"chat_id":"oc_xxx","type":"card"}', result: '{"message_id":"om_yyy"}', taskId: 't-875' },
  { id: 'tc-006', employeeName: 'HR 招聘助手', tool: 'resume_parser', calledAt: '09:08:33', latencyMs: 5640, status: 'timeout', params: '{"resume_url":"oss://resumes/batch.zip"}', result: '{"error":"execution_timeout","limit":"5000ms"}', taskId: 't-901' },
];
const MOCK_AUDIT: AuditLog[] = [
  { id: 'au-001', operator: '陈主任', role: '安全管理员', action: '强制停止实例', target: '法务合规助手 (de-001)', ip: '10.0.1.88', at: '2026-04-22 03:05', result: 'success' },
  { id: 'au-002', operator: '张三', role: '普通用户', action: '尝试访问管控中心', target: '/security', ip: '192.168.1.102', at: '2026-04-22 02:48', result: 'denied' },
  { id: 'au-003', operator: '李四', role: '员工管理员', action: '修改围栏配置', target: '合同审核助手 IP白名单', ip: '10.0.2.45', at: '2026-04-21 17:52', result: 'success' },
  { id: 'au-004', operator: '王五', role: '员工管理员', action: '发布数字员工', target: '公文处理专员 v1.0.0', ip: '10.0.2.61', at: '2026-04-21 16:30', result: 'success' },
  { id: 'au-005', operator: '赵六', role: '普通用户', action: '导出会话记录', target: '合同审核助手 会话列表', ip: '10.8.5.12', at: '2026-04-21 14:22', result: 'denied' },
];

// ─── Constants ──────────────────────────────────────────────────────────────────
const PRIMARY = '#6366F1';
const PRIMARY_LIGHT = '#f0f0ff';
const SEVERITY_CONFIG = {
  critical: { label: '紧急', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  high:     { label: '高危', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
  medium:   { label: '中危', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  low:      { label: '低危', color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
};
const CIRCUIT_CONFIG: Record<CircuitStatus, { label: string; color: string; bg: string }> = {
  normal:   { label: '正常', color: '#059669', bg: '#ecfdf5' },
  warning:  { label: '预警', color: '#d97706', bg: '#fffbeb' },
  throttled:{ label: '限流中', color: '#dc2626', bg: '#fef2f2' },
  stopped:  { label: '已停止', color: '#7f1d1d', bg: '#fef2f2' },
};
const ACTION_CONFIG = {
  block:   { label: '拦截', color: '#dc2626' },
  flag:    { label: '标记', color: '#d97706' },
  replace: { label: '替换', color: PRIMARY },
};

// ─── Risk Gauge ─────────────────────────────────────────────────────────────────
const RiskGauge: React.FC<{ score: number; size?: number }> = ({ score, size = 40 }) => {
  const color = score >= 70 ? '#dc2626' : score >= 40 ? '#d97706' : '#059669';
  const r = (size / 2) - 4; const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={4} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={`${circ * score / 100} ${circ * (1 - score / 100)}`}
          strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size > 50 ? 14 : 10, fontWeight: 700, color }}>{score}</span>
      </div>
    </div>
  );
};

// ─── Live Feed ──────────────────────────────────────────────────────────────────
const LiveFeed: React.FC = () => {
  const [feed, setFeed] = useState([
    { id: '1', text: '法务合规助手 · 限流策略已激活（超基线 8.3x）', sev: 'critical' as AlertSeverity, time: '03:01' },
    { id: '2', text: '合同审核助手 · 身份证号泄露已拦截并脱敏', sev: 'high' as AlertSeverity, time: '09:42' },
    { id: '3', text: 'HR 招聘助手 · 话题围栏命中"薪资数据"，已拒绝', sev: 'low' as AlertSeverity, time: '10:08' },
  ]);
  const ref = useRef(0);
  const evts = [
    { text: '智能客服分发 · Prompt 注入检测：隐藏字符已剥离', sev: 'high' as AlertSeverity },
    { text: '运营数据助手 · 正常运行，无异常', sev: 'low' as AlertSeverity },
    { text: '合同审核助手 · 输出脱敏触发，财务字段已遮蔽', sev: 'medium' as AlertSeverity },
  ];
  useEffect(() => {
    const t = setInterval(() => {
      const evt = evts[ref.current++ % evts.length];
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      setFeed(p => [{ id: String(Date.now()), text: evt.text, sev: evt.sev, time }, ...p.slice(0, 6)]);
    }, 4500);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ background: '#0f172a', borderRadius: 10, padding: '14px 16px', fontFamily: 'monospace', minHeight: 260 }}>
      <div style={{ fontSize: 10, color: '#64748b', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
        实时安全事件流 · LIVE
      </div>
      {feed.map((item, idx) => {
        const sev = SEVERITY_CONFIG[item.sev];
        return (
          <div key={item.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 9, opacity: 1 - idx * 0.10 }}>
            <span style={{ fontSize: 10, color: '#475569', flexShrink: 0, marginTop: 2 }}>{item.time}</span>
            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, color: sev.color, background: `${sev.color}22`, flexShrink: 0 }}>{sev.label}</span>
            <span style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.6 }}>{item.text}</span>
          </div>
        );
      })}
    </div>
  );
};

// ─── Overview Tab ───────────────────────────────────────────────────────────────

// AI Model Data
const MOCK_MODELS = [
  { name: 'GLM-4-Plus', provider: '智谱AI', calls: 18420, tokens: 24182000, cost: 1209.10, budget: 2000, color: '#6366F1' },
  { name: 'DeepSeek-V3', provider: 'DeepSeek', calls: 8140, tokens: 12284000, cost: 368.52, budget: 800, color: '#10B981' },
  { name: 'Qwen-Max', provider: '阿里云', calls: 4280, tokens: 6421000, cost: 192.63, budget: 400, color: '#F59E0B' },
];

// Model Call Details (for drill-down)
interface ModelCallDetail {
  id: string;
  modelName: string;
  employeeName: string;
  employeeId: string;
  taskType: string;
  calledAt: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  latencyMs: number;
  status: 'success' | 'error';
}

const MOCK_MODEL_CALLS: Record<string, ModelCallDetail[]> = {
  'GLM-4-Plus': [
    { id: 'mc-001', modelName: 'GLM-4-Plus', employeeName: '法务合规助手', employeeId: 'de-001', taskType: '合同条款分析', calledAt: '2026-04-22 10:42:18', inputTokens: 4820, outputTokens: 1240, totalTokens: 6060, cost: 0.30, latencyMs: 2840, status: 'success' },
    { id: 'mc-002', modelName: 'GLM-4-Plus', employeeName: '合同审核助手', employeeId: 'de-009', taskType: '风险识别', calledAt: '2026-04-22 10:38:42', inputTokens: 3210, outputTokens: 890, totalTokens: 4100, cost: 0.21, latencyMs: 1920, status: 'success' },
    { id: 'mc-003', modelName: 'GLM-4-Plus', employeeName: 'HR 招聘助手', employeeId: 'de-002', taskType: '简历评估', calledAt: '2026-04-22 10:35:12', inputTokens: 2840, outputTokens: 720, totalTokens: 3560, cost: 0.18, latencyMs: 1650, status: 'success' },
    { id: 'mc-004', modelName: 'GLM-4-Plus', employeeName: '智能客服分发', employeeId: 'de-005', taskType: '用户咨询回复', calledAt: '2026-04-22 10:32:05', inputTokens: 1820, outputTokens: 420, totalTokens: 2240, cost: 0.11, latencyMs: 980, status: 'success' },
    { id: 'mc-005', modelName: 'GLM-4-Plus', employeeName: '法务合规助手', employeeId: 'de-001', taskType: '法规检索', calledAt: '2026-04-22 10:28:33', inputTokens: 5240, outputTokens: 1580, totalTokens: 6820, cost: 0.34, latencyMs: 3120, status: 'error' },
    { id: 'mc-006', modelName: 'GLM-4-Plus', employeeName: '运营数据助手', employeeId: 'de-006', taskType: '数据分析报告', calledAt: '2026-04-22 10:22:18', inputTokens: 6120, outputTokens: 2840, totalTokens: 8960, cost: 0.45, latencyMs: 4280, status: 'success' },
    { id: 'mc-007', modelName: 'GLM-4-Plus', employeeName: '法务合规助手', employeeId: 'de-001', taskType: '合同起草', calledAt: '2026-04-22 10:18:55', inputTokens: 3580, outputTokens: 2120, totalTokens: 5700, cost: 0.29, latencyMs: 3560, status: 'success' },
    { id: 'mc-008', modelName: 'GLM-4-Plus', employeeName: '合同审核助手', employeeId: 'de-009', taskType: '条款对比', calledAt: '2026-04-22 10:12:40', inputTokens: 4920, outputTokens: 1680, totalTokens: 6600, cost: 0.33, latencyMs: 2940, status: 'success' },
  ],
  'DeepSeek-V3': [
    { id: 'mc-101', modelName: 'DeepSeek-V3', employeeName: '智能客服分发', employeeId: 'de-005', taskType: '实时问答', calledAt: '2026-04-22 10:45:22', inputTokens: 820, outputTokens: 340, totalTokens: 1160, cost: 0.06, latencyMs: 650, status: 'success' },
    { id: 'mc-102', modelName: 'DeepSeek-V3', employeeName: '运营数据助手', employeeId: 'de-006', taskType: '趋势预测', calledAt: '2026-04-22 10:40:15', inputTokens: 1520, outputTokens: 680, totalTokens: 2200, cost: 0.11, latencyMs: 1120, status: 'success' },
    { id: 'mc-103', modelName: 'DeepSeek-V3', employeeName: 'HR 招聘助手', employeeId: 'de-002', taskType: '面试问题生成', calledAt: '2026-04-22 10:35:48', inputTokens: 420, outputTokens: 280, totalTokens: 700, cost: 0.04, latencyMs: 420, status: 'success' },
    { id: 'mc-104', modelName: 'DeepSeek-V3', employeeName: '智能客服分发', employeeId: 'de-005', taskType: '情感分析', calledAt: '2026-04-22 10:30:12', inputTokens: 620, outputTokens: 180, totalTokens: 800, cost: 0.04, latencyMs: 520, status: 'success' },
    { id: 'mc-105', modelName: 'DeepSeek-V3', employeeName: '智能客服分发', employeeId: 'de-005', taskType: '知识问答', calledAt: '2026-04-22 10:25:33', inputTokens: 980, outputTokens: 540, totalTokens: 1520, cost: 0.08, latencyMs: 780, status: 'success' },
    { id: 'mc-106', modelName: 'DeepSeek-V3', employeeName: '运营数据助手', employeeId: 'de-006', taskType: 'SQL生成', calledAt: '2026-04-22 10:18:22', inputTokens: 1240, outputTokens: 420, totalTokens: 1660, cost: 0.08, latencyMs: 890, status: 'success' },
  ],
  'Qwen-Max': [
    { id: 'mc-201', modelName: 'Qwen-Max', employeeName: '智能巡检助手', employeeId: 'de-007', taskType: '异常检测', calledAt: '2026-04-22 10:48:30', inputTokens: 2840, outputTokens: 420, totalTokens: 3260, cost: 0.03, latencyMs: 1850, status: 'success' },
    { id: 'mc-202', modelName: 'Qwen-Max', employeeName: '运营数据助手', employeeId: 'de-006', taskType: '数据清洗', calledAt: '2026-04-22 10:42:18', inputTokens: 1820, outputTokens: 320, totalTokens: 2140, cost: 0.02, latencyMs: 1240, status: 'success' },
    { id: 'mc-203', modelName: 'Qwen-Max', employeeName: '智能巡检助手', employeeId: 'de-007', taskType: '日志分析', calledAt: '2026-04-22 10:35:42', inputTokens: 3420, outputTokens: 580, totalTokens: 4000, cost: 0.04, latencyMs: 2180, status: 'success' },
    { id: 'mc-204', modelName: 'Qwen-Max', employeeName: 'HR 招聘助手', employeeId: 'de-002', taskType: '候选人匹配', calledAt: '2026-04-22 10:28:15', inputTokens: 2140, outputTokens: 680, totalTokens: 2820, cost: 0.03, latencyMs: 1560, status: 'success' },
    { id: 'mc-205', modelName: 'Qwen-Max', employeeName: '智能巡检助手', employeeId: 'de-007', taskType: '报告生成', calledAt: '2026-04-22 10:20:44', inputTokens: 4280, outputTokens: 1120, totalTokens: 5400, cost: 0.05, latencyMs: 2840, status: 'success' },
  ],
};

// P-level Alert Data
const MOCK_P_ALERTS = [
  { id: 'p0-1', level: 'P0', title: '高频调用异常', desc: '法务合规助手调用量超基线 830%，已触发自动限流', time: '03:01', status: 'active' as const },
  { id: 'p1-1', level: 'P1', title: '敏感数据泄露尝试', desc: '合同审核助手输出含身份证号，已自动脱敏', time: '09:42', status: 'resolved' as const },
  { id: 'p1-2', level: 'P1', title: '模型调用失败', desc: 'GLM-4-Plus 在法务合规助手中调用失败，错误码 500', time: '10:28', status: 'active' as const },
  { id: 'p2-1', level: 'P2', title: 'Token 用量预警', desc: 'GLM-4-Plus 本月消耗已达预算 60.5%，预计 5 天超额', time: '10:00', status: 'active' as const },
  { id: 'p2-2', level: 'P2', title: '话题黑名单触发', desc: 'HR 招聘助手 话题围栏命中 12 次，今日用户询问薪资数据', time: '10:08', status: 'resolved' as const },
];

const P_LEVEL_CFG = {
  P0: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'P0 紧急', dot: '#dc2626' },
  P1: { color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', label: 'P1 严重', dot: '#ea580c' },
  P2: { color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'P2 警告', dot: '#d97706' },
};

// Mini sparkline (fake bars)
const Sparkline: React.FC<{ values: number[]; color: string; height?: number }> = ({ values, color, height = 28 }) => {
  const max = Math.max(...values, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height }}>
      {values.map((v, i) => (
        <div key={i} style={{ flex: 1, borderRadius: 2, background: color, opacity: 0.3 + (i / values.length) * 0.7, height: `${Math.max(4, Math.round((v / max) * height))}px` }} />
      ))}
    </div>
  );
};

// ─── Model Detail Drawer ─────────────────────────────────────────────────────────
const ModelDetailDrawer: React.FC<{
  model: typeof MOCK_MODELS[0];
  calls: ModelCallDetail[];
  onClose: () => void;
}> = ({ model, calls, onClose }) => {
  // 使用model对象的数据作为总览统计
  const avgLatency = calls.length > 0 ? Math.round(calls.reduce((a, c) => a + c.latencyMs, 0) / calls.length) : 0;
  const successRate = calls.length > 0 ? Math.round((calls.filter(c => c.status === 'success').length / calls.length) * 100) : 100;

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 299 }} onClick={onClose} />
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, width: 680,
        background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column', zIndex: 300,
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>{model.name} 调用明细</div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>{model.provider} · 本月累计数据</div>
            </div>
            <div onClick={onClose} style={{ cursor: 'pointer', color: '#bbb', fontSize: 20, lineHeight: 1, padding: '2px 4px' }}>✕</div>
          </div>
          {/* Stats row - 使用model数据 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { label: '总成本', value: `¥${model.cost.toFixed(2)}`, color: model.color },
              { label: '调用次数', value: model.calls.toLocaleString(), color: '#6b7280' },
              { label: 'Token消耗', value: `${(model.tokens / 1000000).toFixed(2)}M`, color: '#7c3aed' },
              { label: '成功率', value: `${successRate}%`, color: successRate >= 95 ? '#059669' : '#d97706' },
            ].map(item => (
              <div key={item.label} style={{ textAlign: 'center', background: '#fafafa', borderRadius: 8, padding: '8px 6px' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: item.color }}>{item.value}</div>
                <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent calls header */}
        <div style={{ padding: '14px 24px 0', borderBottom: '1px solid #f5f5f5' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 2 }}>最近调用记录</div>
          <div style={{ fontSize: 11, color: '#9ca3af', paddingBottom: 10 }}>展示最近 {calls.length} 条调用详情</div>
        </div>

        {/* Call list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>
          {calls.map((call, idx) => (
            <div key={call.id} style={{
              padding: '14px 0', borderBottom: idx < calls.length - 1 ? '1px solid #f5f5f5' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 10, padding: '2px 7px', borderRadius: 8, fontWeight: 700,
                    color: call.status === 'success' ? '#059669' : '#dc2626',
                    background: call.status === 'success' ? '#ecfdf5' : '#fef2f2',
                  }}>
                    {call.status === 'success' ? '✓ 成功' : '✗ 失败'}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>{call.employeeName}</span>
                  <span style={{ fontSize: 10, color: '#9ca3af' }}>· {call.taskType}</span>
                </div>
                <span style={{ fontSize: 10, color: '#bbb' }}>{call.calledAt}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                {[
                  { label: '输入 Token', value: call.inputTokens.toLocaleString() },
                  { label: '输出 Token', value: call.outputTokens.toLocaleString() },
                  { label: '总 Token', value: call.totalTokens.toLocaleString() },
                  { label: '成本', value: `¥${call.cost.toFixed(2)}` },
                  { label: '延迟', value: `${call.latencyMs}ms` },
                ].map(item => (
                  <div key={item.label} style={{ background: '#f8f8f8', borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#333' }}>{item.value}</div>
                    <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 1 }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

const OverviewTab: React.FC<{ alerts: AlertEvent[]; metrics: BehaviorMetric[]; onResolve: (id: string) => void; onCircuit: (name: string, act: string) => void; onNavigate: (tab: MainTab) => void }> = ({ alerts, metrics, onResolve, onCircuit, onNavigate }) => {
  const [selectedModel, setSelectedModel] = useState<typeof MOCK_MODELS[0] | null>(null);
  const [dept, setDept] = useState('all');
  const [timeRange, setTimeRange] = useState('7d');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [feedEmployee, setFeedEmployee] = useState('全部');

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');

  // Time-range multipliers for KPI variation
  const timeMultiplier = timeRange === 'today' ? 1 : timeRange === '7d' ? 6.8 : 29.4;
  const blockedMultiplier = timeRange === 'today' ? 1 : timeRange === '7d' ? 7.2 : 30.6;
  const completionRate = timeRange === 'today' ? 94.2 : timeRange === '7d' ? 96.1 : 95.4;
  const failureRate = timeRange === 'today' ? 5.8 : timeRange === '7d' ? 3.9 : 4.6;

  const totalBlocked = Math.round(metrics.reduce((a, m) => a + m.sensitiveHits, 0) * blockedMultiplier);
  const totalTodayTokens = Math.round(metrics.reduce((a, m) => a + m.todayTokens, 0) * timeMultiplier);
  const totalModelCost = Math.round(MOCK_MODELS.reduce((a, m) => a + m.cost, 0) * timeMultiplier * 10) / 10;
  const maxToken = Math.max(...metrics.map(m => Math.max(m.todayTokens, m.baselineTokens))) * timeMultiplier;
  const tokenUnit = totalTodayTokens >= 1000000 ? `${(totalTodayTokens / 1000000).toFixed(1)}M` : `${(totalTodayTokens / 1000).toFixed(0)}k`;

  const sortedAlerts = [...activeAlerts].sort((a, b) => {
    const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.severity] - order[b.severity];
  });

  const DEPTS = ['法务部', '客户成功', '人力资源', '管道运营部', '运营部'];
  const EMPLOYEE_NAMES = ['全部', ...metrics.map(m => m.employeeName)];

  const EXEC_LOGS: Record<string, { time: string; text: string; sev: AlertSeverity }[]> = {
    '法务合规助手': [
      { time: '03:01', text: '法务合规助手 · 限流策略已激活（超基线 8.3x）', sev: 'critical' },
      { time: '02:58', text: '法务合规助手 · 高频调用异常检测触发告警', sev: 'high' },
      { time: '02:14', text: '法务合规助手 · 调用量开始异常攀升，触发预警', sev: 'medium' },
    ],
    '合同审核助手': [
      { time: '09:42', text: '合同审核助手 · 身份证号泄露已拦截并脱敏', sev: 'high' },
      { time: '09:42', text: '合同审核助手 · pdf_parser 调用成功 18页42条款', sev: 'low' },
      { time: '09:38', text: '合同审核助手 · 会话开始 usr_zhangsan 法务部', sev: 'low' },
    ],
    '智能客服分发': [
      { time: '10:15', text: '智能客服分发 · Prompt 注入检测：隐藏字符已剥离', sev: 'high' },
      { time: '10:08', text: '智能客服分发 · 话题围栏命中\"薪资数据\"，已拒绝', sev: 'low' },
      { time: '10:05', text: '智能客服分发 · 正常回复完成 用户满意度标记', sev: 'low' },
    ],
    'HR 招聘助手': [
      { time: '10:08', text: 'HR 招聘助手 · 话题黑名单触发：员工薪资数据', sev: 'low' },
      { time: '09:08', text: 'HR 招聘助手 · resume_parser 超时 5640ms', sev: 'medium' },
    ],
    '运营数据助手': [
      { time: '08:44', text: '运营数据助手 · data_report_gen 成功生成报表', sev: 'low' },
      { time: '08:40', text: '运营数据助手 · SQL 生成并执行，返回 42 行', sev: 'low' },
    ],
    '智能巡检助手': [
      { time: '08:35', text: '智能巡检助手 · feishu_push 推送成功 oc_xxx', sev: 'low' },
      { time: '01:30', text: '智能巡检助手 · 异常时间段调用检测，凌晨持续运行', sev: 'medium' },
    ],
  };

  const selectStyle: React.CSSProperties = {
    height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid #e5e7eb',
    fontSize: 13, color: '#333', background: '#fff', cursor: 'pointer', outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Filter Bar ── */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <select value={dept} onChange={e => setDept(e.target.value)}
          style={{ ...selectStyle, minWidth: 148, color: dept === 'all' ? '#9ca3af' : '#333' }}>
          <option value="all">请选择部门</option>
          {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={timeRange} onChange={e => setTimeRange(e.target.value)}
          style={{ ...selectStyle, minWidth: 100 }}>
          <option value="today">今日</option>
          <option value="7d">近7天</option>
          <option value="30d">近30天</option>
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #e5e7eb', borderRadius: 8, padding: '0 10px', height: 36, background: '#fff', minWidth: 280 }}>
          <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)}
            placeholder="创建开始日期"
            style={{ border: 'none', outline: 'none', fontSize: 12, color: dateStart ? '#333' : '#9ca3af', background: 'transparent', width: 110 }} />
          <span style={{ color: '#bbb', fontSize: 12 }}>→</span>
          <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: 12, color: dateEnd ? '#333' : '#9ca3af', background: 'transparent', width: 110 }} />
          <CalendarOutlined style={{ color: '#bbb', fontSize: 13 }} />
        </div>
        <button
          onClick={() => { setDept('all'); setTimeRange('7d'); setDateStart(''); setDateEnd(''); }}
          style={{ height: 36, padding: '0 20px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>
          重 置
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <ThunderboltOutlined style={{ color: '#6366F1', fontSize: 18 }} />
          <div style={{ fontSize: 28, fontWeight: 800, color: '#6366F1', lineHeight: 1, marginTop: 10 }}>{tokenUnit}</div>
          <div style={{ fontSize: 12, color: '#555', marginTop: 6, fontWeight: 500 }}>Token 消耗</div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>{timeRange === 'today' ? '较昨日 +8.4%' : timeRange === '7d' ? '较上周 +12.1%' : '较上月 +9.7%'}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <CheckCircleOutlined style={{ color: '#059669', fontSize: 18 }} />
          <div style={{ fontSize: 28, fontWeight: 800, color: '#059669', lineHeight: 1, marginTop: 10 }}>{completionRate}%</div>
          <div style={{ fontSize: 12, color: '#555', marginTop: 6, fontWeight: 500 }}>任务完成率</div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>失败率 {failureRate}%</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', border: `1px solid ${criticalAlerts.length > 0 ? '#fecaca' : '#f0f0f0'}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <AlertOutlined style={{ color: '#dc2626', fontSize: 18 }} />
          <div style={{ fontSize: 28, fontWeight: 800, color: '#dc2626', lineHeight: 1, marginTop: 10 }}>{activeAlerts.length}</div>
          <div style={{ fontSize: 12, color: '#555', marginTop: 6, fontWeight: 500 }}>活跃告警</div>
          <div style={{ fontSize: 11, color: criticalAlerts.length > 0 ? '#dc2626' : '#6b7280', marginTop: 3 }}>
            {criticalAlerts.length > 0 ? `${criticalAlerts.length} 条紧急` : '无紧急告警'}
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <StopOutlined style={{ color: '#d97706', fontSize: 18 }} />
          <div style={{ fontSize: 28, fontWeight: 800, color: '#d97706', lineHeight: 1, marginTop: 10 }}>{totalBlocked}</div>
          <div style={{ fontSize: 12, color: '#555', marginTop: 6, fontWeight: 500 }}>拦截次数</div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>{timeRange === 'today' ? '今日敏感词命中' : timeRange === '7d' ? '近7天敏感词命中' : '近30天敏感词命中'}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', cursor: 'pointer' }}
          onClick={() => setSelectedModel(MOCK_MODELS[0])}>
          <SafetyCertificateOutlined style={{ color: '#ea580c', fontSize: 18 }} />
          <div style={{ fontSize: 28, fontWeight: 800, color: '#ea580c', lineHeight: 1, marginTop: 10 }}>¥{totalModelCost.toFixed(0)}</div>
          <div style={{ fontSize: 12, color: '#555', marginTop: 6, fontWeight: 500 }}>AI 模型成本</div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>{timeRange === 'today' ? '今日累计' : timeRange === '7d' ? '近7天累计' : '近30天累计'}</div>
        </div>
      </div>

      {/* ── Token消耗分布 + AI模型成本 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8f0', padding: '18px 22px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 20 }}>
            Token 消耗分布（{timeRange === 'today' ? '今日' : timeRange === '7d' ? '近7天' : '近30天'}）
          </div>
          {[...metrics].sort((a, b) => b.todayTokens - a.todayTokens).map(m => {
            const cs = CIRCUIT_CONFIG[m.circuitStatus];
            const barGradient = m.circuitStatus === 'throttled'
              ? 'linear-gradient(90deg, #ef4444, #dc2626)'
              : m.circuitStatus === 'warning'
              ? 'linear-gradient(90deg, #f59e0b, #d97706)'
              : 'linear-gradient(90deg, #818cf8, #6366F1)';
            const barWidth = (m.todayTokens * timeMultiplier / maxToken * 100).toFixed(1);
            const isOver = m.todayTokens > m.baselineTokens;
            const valueColor = m.circuitStatus === 'throttled' ? '#dc2626' : m.circuitStatus === 'warning' ? '#d97706' : '#333';
            return (
              <div key={m.employeeId} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', minWidth: 96 }}>{m.employeeName}</span>
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, fontWeight: 600, color: cs.color, background: cs.bg }}>{cs.label}</span>
                  </div>
                  <div style={{ fontSize: 12 }}>
                    <strong style={{ color: isOver ? valueColor : '#6b7280', fontWeight: 700 }}>{(m.todayTokens * timeMultiplier / 1000).toFixed(0)}k</strong>
                    <span style={{ color: '#bbb', fontSize: 11, marginLeft: 4 }}>/ 基线 {(m.baselineTokens * timeMultiplier / 1000).toFixed(0)}k</span>
                  </div>
                </div>
                <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, width: `${barWidth}%`, background: barGradient, transition: 'width 0.5s' }} />
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8f0', padding: '18px 22px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 20 }}>AI 模型成本分布</div>
          {MOCK_MODELS.map(model => {
            const budgetPct = Math.round(model.cost / model.budget * 100);
            const overBudget = budgetPct > 80;
            return (
              <div key={model.name} style={{ marginBottom: 18, cursor: 'pointer' }} onClick={() => setSelectedModel(model)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>{model.name}</span>
                    <span style={{ fontSize: 10, color: '#bbb', marginLeft: 5 }}>{model.provider}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: overBudget ? '#d97706' : model.color }}>¥{model.cost.toFixed(0)}</span>
                </div>
                <div style={{ height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, width: `${Math.min(budgetPct, 100)}%`, background: overBudget ? 'linear-gradient(90deg, #f59e0b, #d97706)' : `linear-gradient(90deg, ${model.color}80, ${model.color})`, transition: 'width 0.5s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontSize: 10, color: '#bbb' }}>预算 ¥{model.budget}</span>
                  <span style={{ fontSize: 10, color: overBudget ? '#d97706' : '#bbb', fontWeight: overBudget ? 600 : 400 }}>{overBudget ? `⚠ 已用 ${budgetPct}%` : `${budgetPct}% 已用`}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 实时安全事件流 ── */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>实时安全事件流</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>实时监控 · 默认展示全部，可搜索指定员工的执行日志</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <SearchOutlined style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#bbb', fontSize: 12 }} />
              <input
                value={feedEmployee === '全部' ? '' : feedEmployee}
                onChange={e => setFeedEmployee(e.target.value.trim() === '' ? '全部' : e.target.value)}
                placeholder="搜索员工名称..."
                style={{ height: 30, border: '1px solid #e5e7eb', borderRadius: 7, padding: '0 10px 0 28px', fontSize: 12, outline: 'none', color: '#333', width: 160 }}
              />
            </div>
            <button style={{ height: 30, padding: '0 12px', border: '1px solid #e5e7eb', borderRadius: 7, background: '#fff', cursor: 'pointer', fontSize: 12, color: '#555', display: 'flex', alignItems: 'center', gap: 4 }}>
              <FileTextOutlined style={{ fontSize: 11 }} />导出
            </button>
          </div>
        </div>
        <div style={{ padding: '14px 18px' }}>
          {feedEmployee === '全部' ? (
            <LiveFeed />
          ) : (
            <div style={{ background: '#0f172a', borderRadius: 10, padding: '14px 16px', fontFamily: 'monospace', minHeight: 260 }}>
              <div style={{ fontSize: 10, color: '#64748b', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                {feedEmployee} · 实时执行日志 · LIVE
              </div>
              {(() => {
                const matchKey = Object.keys(EXEC_LOGS).find(k => k.includes(feedEmployee));
                const logs = matchKey ? EXEC_LOGS[matchKey] : [];
                return logs.length === 0 ? (
                  <div style={{ fontSize: 11, color: '#475569', padding: '10px 0' }}>暂无该员工近期安全事件</div>
                ) : logs.map((item, idx) => {
                  const sev = SEVERITY_CONFIG[item.sev];
                  return (
                    <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 9, opacity: 1 - idx * 0.08 }}>
                      <span style={{ fontSize: 10, color: '#475569', flexShrink: 0, marginTop: 2 }}>{item.time}</span>
                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, color: sev.color, background: `${sev.color}22`, flexShrink: 0 }}>{sev.label}</span>
                      <span style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.6 }}>{item.text}</span>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      </div>

      {/* ── 活跃告警 ── */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>活跃告警</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>紧急告警优先展示 · 支持高权限快速介入</div>
          </div>
          <button onClick={() => onNavigate('behavior')}
            style={{ height: 30, padding: '0 14px', border: 'none', borderRadius: 7, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', cursor: 'pointer', fontSize: 12, color: '#fff', fontWeight: 600 }}>
            前往处理 →
          </button>
        </div>
        {sortedAlerts.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <CheckCircleOutlined style={{ fontSize: 28, color: '#059669', marginBottom: 8 }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: '#059669' }}>所有告警已处理</div>
            <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>平台当前运行正常</div>
          </div>
        ) : (
          sortedAlerts.map((alert, idx) => {
            const sev = SEVERITY_CONFIG[alert.severity];
            const isCritical = alert.severity === 'critical';
            const isHigh = alert.severity === 'high';
            return (
              <div key={alert.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12, padding: '13px 18px',
                borderBottom: idx < sortedAlerts.length - 1 ? '1px solid #f5f5f5' : 'none',
                background: isCritical ? '#fffdf4' : '#fff',
              }}>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 8, fontWeight: 700, color: sev.color, background: sev.bg, flexShrink: 0, marginTop: 2, whiteSpace: 'nowrap', border: `1px solid ${sev.border}` }}>{sev.label}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a', marginBottom: 2 }}>{alert.type}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{alert.employeeName} · {alert.desc}</div>
                  {alert.action && (
                    <div style={{ marginTop: 4, fontSize: 10, color: PRIMARY, background: PRIMARY_LIGHT, padding: '1px 7px', borderRadius: 5, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <ThunderboltOutlined style={{ fontSize: 9 }} />已自动：{alert.action}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {(isCritical || isHigh) && (
                    <>
                      <button onClick={() => onCircuit(alert.employeeName, '限流')} style={{ height: 26, padding: '0 9px', border: '1px solid #fde68a', borderRadius: 6, background: '#fffbeb', color: '#d97706', fontSize: 10, cursor: 'pointer', fontWeight: 500 }}>限流</button>
                      <button onClick={() => onCircuit(alert.employeeName, '停止')} style={{ height: 26, padding: '0 9px', border: '1px solid #fecaca', borderRadius: 6, background: '#fef2f2', color: '#dc2626', fontSize: 10, cursor: 'pointer', fontWeight: 500 }}>停止</button>
                    </>
                  )}
                  <button onClick={() => onResolve(alert.id)} style={{ height: 26, padding: '0 9px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', color: '#6b7280', fontSize: 10, cursor: 'pointer' }}>标记解决</button>
                  <button onClick={() => onNavigate('behavior')} style={{ height: 26, padding: '0 9px', border: '1px solid #c7d2fe', borderRadius: 6, background: '#f0f0ff', color: PRIMARY, fontSize: 10, cursor: 'pointer', fontWeight: 500 }}>去处理</button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedModel && (
        <ModelDetailDrawer
          model={selectedModel}
          calls={MOCK_MODEL_CALLS[selectedModel.name] || []}
          onClose={() => setSelectedModel(null)}
        />
      )}
    </div>
  );
};

// ─── Logs Tab ───────────────────────────────────────────────────────────────────
const LogsTab: React.FC = () => {
  const [sub, setSub] = useState<LogSubTab>('session');
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const SESSION_STATUS = {
    normal:  { label: '正常', color: '#059669', bg: '#ecfdf5' },
    flagged: { label: '已标记', color: '#d97706', bg: '#fffbeb' },
    blocked: { label: '已拦截', color: '#dc2626', bg: '#fef2f2' },
  };
  const TOOL_STATUS = {
    success: { label: '成功', color: '#059669', bg: '#ecfdf5' },
    error:   { label: '错误', color: '#dc2626', bg: '#fef2f2' },
    timeout: { label: '超时', color: '#d97706', bg: '#fffbeb' },
  };

  const SUB_TABS: { key: LogSubTab; label: string; count: number }[] = [
    { key: 'session', label: '会话日志', count: MOCK_SESSIONS.length },
    { key: 'tool',    label: '工具调用日志', count: MOCK_TOOL_CALLS.length },
    { key: 'audit',   label: '审计日志', count: MOCK_AUDIT.length },
  ];

  return (
    <div>
      {/* Sub-tab row */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 18, borderBottom: '1px solid #f0f0f0' }}>
        {SUB_TABS.map(t => (
          <div key={t.key} onClick={() => setSub(t.key)} style={{
            padding: '9px 18px', cursor: 'pointer', fontSize: 13, fontWeight: sub === t.key ? 600 : 400,
            color: sub === t.key ? PRIMARY : '#6b7280',
            borderBottom: `2.5px solid ${sub === t.key ? PRIMARY : 'transparent'}`,
            transition: 'all 0.15s', marginBottom: -1, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {t.label}
            <span style={{ fontSize: 10, padding: '0 5px', borderRadius: 8, background: sub === t.key ? PRIMARY_LIGHT : '#f3f4f6', color: sub === t.key ? PRIMARY : '#bbb' }}>{t.count}</span>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 8 }}>
          <div style={{ position: 'relative' }}>
            <SearchOutlined style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#bbb', fontSize: 12 }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索..." style={{ height: 30, border: '1px solid #e5e7eb', borderRadius: 7, padding: '0 10px 0 28px', fontSize: 12, outline: 'none', color: '#333', width: 160 }} />
          </div>
          <button style={{ height: 30, padding: '0 12px', border: '1px solid #e5e7eb', borderRadius: 7, background: '#fff', color: '#666', fontSize: 12, cursor: 'pointer' }}>导出</button>
        </div>
      </div>

      {/* Session logs */}
      {sub === 'session' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8f0', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 0.8fr 0.6fr 0.7fr 0.7fr 0.7fr', padding: '10px 16px', background: '#fafafa', borderBottom: '1px solid #f0f0f0', fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>
            <div>员工 / 用户</div><div>部门</div><div>渠道</div><div>消息数</div><div>Token</div><div>时长</div><div>状态</div>
          </div>
          {MOCK_SESSIONS.filter(s => !search || s.employeeName.includes(search) || s.userId.includes(search)).map((s, idx) => {
            const ss = SESSION_STATUS[s.status];
            return (
              <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 0.8fr 0.6fr 0.7fr 0.7fr 0.7fr', padding: '11px 16px', borderBottom: idx < MOCK_SESSIONS.length - 1 ? '1px solid #f5f5f5' : 'none', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>{s.employeeName}</div>
                  <div style={{ fontSize: 10, color: '#bbb' }}>{s.userId} · {s.startAt}</div>
                </div>
                <div style={{ fontSize: 11, color: '#555' }}>{s.dept}</div>
                <div style={{ fontSize: 11, color: '#555' }}>{s.channel}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#333', textAlign: 'center' }}>{s.msgCount}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: s.tokens > 15000 ? '#d97706' : '#333', textAlign: 'center' }}>{(s.tokens / 1000).toFixed(1)}k</div>
                <div style={{ fontSize: 11, color: '#555', textAlign: 'center' }}>{s.duration}</div>
                <div>
                  <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 8, fontWeight: 600, color: ss.color, background: ss.bg }}>{ss.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tool call logs */}
      {sub === 'tool' && (
        <div>
          {MOCK_TOOL_CALLS.filter(t => !search || t.employeeName.includes(search) || t.tool.includes(search)).map(tc => {
            const ts = TOOL_STATUS[tc.status];
            const expanded = expandedTool === tc.id;
            return (
              <div key={tc.id} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${tc.status !== 'success' ? ts.bg : '#e8e8f0'}`, marginBottom: 8, overflow: 'hidden' }}>
                <div onClick={() => setExpandedTool(expanded ? null : tc.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', cursor: 'pointer' }}>
                  <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 8, fontWeight: 700, color: ts.color, background: ts.bg, flexShrink: 0 }}>{ts.label}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a', fontFamily: 'monospace' }}>{tc.tool}</span>
                    <span style={{ fontSize: 11, color: '#bbb', marginLeft: 10 }}>{tc.employeeName}</span>
                    <span style={{ fontSize: 10, color: '#bbb', marginLeft: 8 }}>任务 {tc.taskId}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: tc.latencyMs > 3000 ? '#d97706' : '#6b7280' }}>{tc.latencyMs}ms</span>
                    <span style={{ fontSize: 10, color: '#bbb' }}>{tc.calledAt}</span>
                    <DownOutlined style={{ fontSize: 10, color: '#bbb', transform: expanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                  </div>
                </div>
                {expanded && (
                  <div style={{ borderTop: '1px solid #f5f5f5', background: '#0f172a', padding: '12px 16px' }}>
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4, fontFamily: 'monospace' }}>▶ 请求参数</div>
                      <div style={{ fontSize: 11, color: '#22d3ee', fontFamily: 'monospace', lineHeight: 1.6 }}>{tc.params}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4, fontFamily: 'monospace' }}>▶ 返回结果</div>
                      <div style={{ fontSize: 11, color: tc.status === 'success' ? '#86efac' : '#fca5a5', fontFamily: 'monospace', lineHeight: 1.6 }}>{tc.result}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Audit logs */}
      {sub === 'audit' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8f0', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1.5fr 1.5fr 0.8fr 0.7fr', padding: '10px 16px', background: '#fafafa', borderBottom: '1px solid #f0f0f0', fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>
            <div>操作人 / 角色</div><div>IP 地址</div><div>操作类型</div><div>操作对象</div><div>时间</div><div>结果</div>
          </div>
          {MOCK_AUDIT.filter(a => !search || a.operator.includes(search) || a.action.includes(search)).map((a, idx) => (
            <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1.5fr 1.5fr 0.8fr 0.7fr', padding: '11px 16px', borderBottom: idx < MOCK_AUDIT.length - 1 ? '1px solid #f5f5f5' : 'none', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>{a.operator}</div>
                <div style={{ fontSize: 10, color: '#bbb' }}>{a.role}</div>
              </div>
              <div style={{ fontSize: 11, color: '#555', fontFamily: 'monospace' }}>{a.ip}</div>
              <div style={{ fontSize: 11, color: '#333' }}>{a.action}</div>
              <div style={{ fontSize: 11, color: '#555' }}>{a.target}</div>
              <div style={{ fontSize: 10, color: '#bbb' }}>{a.at.slice(11)}</div>
              <div>
                <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 8, fontWeight: 600,
                  color: a.result === 'success' ? '#059669' : '#dc2626',
                  background: a.result === 'success' ? '#ecfdf5' : '#fef2f2' }}>
                  {a.result === 'success' ? '成功' : '拒绝'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Behavior Tab ────────────────────────────────────────────────────────────────
const BehaviorTab: React.FC<{ metrics: BehaviorMetric[]; onCircuit: (name: string, act: string) => void }> = ({ metrics, onCircuit }) => (
  <div>
    <div style={{ fontSize: 12, color: '#888', marginBottom: 14, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px' }}>
      ⚡ 超基线 ≥150% 触发预警，≥300% 自动限流，≥500% 强制停止实例，并发送告警至 SOC
    </div>
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8f0', overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.2fr 0.8fr 0.8fr 1fr 1fr', padding: '10px 18px', background: '#fafafa', borderBottom: '1px solid #f0f0f0', fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>
        <div>员工</div><div style={{ textAlign: 'center' }}>今日调用 / 基线</div><div style={{ textAlign: 'center' }}>Token / 基线</div><div style={{ textAlign: 'center' }}>敏感命中</div><div style={{ textAlign: 'center' }}>风险分</div><div style={{ textAlign: 'center' }}>运行状态</div><div style={{ textAlign: 'center' }}>操作</div>
      </div>
      {metrics.map((m, idx) => {
        const cs = CIRCUIT_CONFIG[m.circuitStatus];
        const over = m.todayCalls / m.baselineCalls >= 1.5;
        return (
          <div key={m.employeeId} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.2fr 0.8fr 0.8fr 1fr 1fr', padding: '13px 18px', borderBottom: idx < metrics.length - 1 ? '1px solid #f5f5f5' : 'none', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{m.employeeName}</div>
              <div style={{ fontSize: 10, color: '#bbb' }}>{m.dept} · {m.lastActiveAt} 最近活跃</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: over ? '#dc2626' : '#1a1a1a' }}>{m.todayCalls}</div>
              <div style={{ fontSize: 10, color: '#bbb' }}>/ {m.baselineCalls} {over && <span style={{ color: '#dc2626' }}>��{(((m.todayCalls/m.baselineCalls)-1)*100).toFixed(0)}%</span>}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: m.todayTokens > m.baselineTokens * 1.5 ? '#d97706' : '#555' }}>{(m.todayTokens/1000).toFixed(0)}k</div>
              <div style={{ fontSize: 10, color: '#bbb' }}>/ {(m.baselineTokens/1000).toFixed(0)}k</div>
            </div>
            <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: m.sensitiveHits > 5 ? '#dc2626' : m.sensitiveHits > 0 ? '#d97706' : '#059669' }}>{m.sensitiveHits}</div>
            <div style={{ display: 'flex', justifyContent: 'center' }}><RiskGauge score={m.riskScore} size={38} /></div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 8, fontWeight: 600, color: cs.color, background: cs.bg }}>{cs.label}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 5 }}>
              {m.circuitStatus === 'normal' && <button onClick={() => onCircuit(m.employeeName, '限流')} style={{ fontSize: 10, padding: '2px 8px', border: '1px solid #fde68a', borderRadius: 5, background: '#fffbeb', color: '#d97706', cursor: 'pointer' }}>限流</button>}
              {m.circuitStatus === 'throttled' && <>
                <button onClick={() => onCircuit(m.employeeName, '恢复')} style={{ fontSize: 10, padding: '2px 8px', border: '1px solid #a7f3d0', borderRadius: 5, background: '#ecfdf5', color: '#059669', cursor: 'pointer' }}>恢复</button>
                <button onClick={() => onCircuit(m.employeeName, '停止')} style={{ fontSize: 10, padding: '2px 8px', border: '1px solid #fecaca', borderRadius: 5, background: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}>停止</button>
              </>}
              {m.circuitStatus === 'warning' && <button onClick={() => onCircuit(m.employeeName, '介入限流')} style={{ fontSize: 10, padding: '2px 8px', border: '1px solid #fde68a', borderRadius: 5, background: '#fffbeb', color: '#d97706', cursor: 'pointer' }}>介入</button>}
            </div>
          </div>
        );
      })}
    </div>
    {/* Escalation ladder */}
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8f0', padding: '16px 20px', marginTop: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#333', marginBottom: 14 }}>梯度管控策略</div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {[
          { label: '预警通知', desc: '超基线 150%', color: '#d97706', icon: '⚠️' },
          { label: '自动限流', desc: '超基线 300%', color: '#ea580c', icon: '🚦' },
          { label: '强制停止', desc: '超基线 500%', color: '#dc2626', icon: '🔴' },
          { label: '下架实例', desc: '安全官确认', color: '#7f1d1d', icon: '🔒' },
        ].map((step, idx, arr) => (
          <React.Fragment key={step.label}>
            <div style={{ textAlign: 'center', flex: 1, padding: '10px 8px', background: `${step.color}08`, borderRadius: 8 }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{step.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: step.color }}>{step.label}</div>
              <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{step.desc}</div>
            </div>
            {idx < arr.length - 1 && <div style={{ width: 28, height: 2, background: 'linear-gradient(90deg, #d97706, #dc2626)', flexShrink: 0 }} />}
          </React.Fragment>
        ))}
      </div>
    </div>
  </div>
);

// ─── New Group Modal ──────────────────────────────────────────────────────────────
const CATEGORIES: SensitiveWordGroup['category'][] = ['政治敏感', '竞品保护', '个人隐私', '财务数据', '自定义'];
const NewGroupModal: React.FC<{
  onConfirm: (name: string, category: SensitiveWordGroup['category'], action: SensitiveWordGroup['action']) => void;
  onCancel: () => void;
}> = ({ onConfirm, onCancel }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<SensitiveWordGroup['category']>('自定义');
  const [action, setAction] = useState<SensitiveWordGroup['action']>('flag');
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
      <div style={{ background: '#fff', borderRadius: 14, width: 400, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>新建敏感词库</div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>词库名称 <span style={{ color: '#dc2626' }}>*</span></div>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="如：合规禁用词" style={{ width: '100%', height: 34, border: '1px solid #e5e7eb', borderRadius: 8, padding: '0 10px', fontSize: 13, outline: 'none', color: '#333', boxSizing: 'border-box' }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>词库分类</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {CATEGORIES.map(c => (
                <div key={c} onClick={() => setCategory(c)} style={{ padding: '4px 10px', borderRadius: 7, fontSize: 12, cursor: 'pointer', border: `1px solid ${category === c ? PRIMARY : '#e5e7eb'}`, background: category === c ? PRIMARY_LIGHT : '#f9fafb', color: category === c ? PRIMARY : '#6b7280', fontWeight: category === c ? 600 : 400 }}>{c}</div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>命中动作</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {([['block', '拦截', '#dc2626'], ['flag', '标记', '#d97706'], ['replace', '替换', PRIMARY]] as const).map(([val, label, color]) => (
                <div key={val} onClick={() => setAction(val)} style={{ flex: 1, padding: '7px 0', textAlign: 'center', borderRadius: 8, fontSize: 12, cursor: 'pointer', border: `1px solid ${action === val ? color : '#e5e7eb'}`, background: action === val ? `${color}12` : '#f9fafb', color: action === val ? color : '#6b7280', fontWeight: action === val ? 600 : 400 }}>{label}</div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
              {action === 'block' ? '命中时直接拦截请求，返回拒绝提示' : action === 'flag' ? '命中时放行但记录安全事件，供事后审查' : '命中时将敏感词替换为 *** 后继���输出'}
            </div>
          </div>
        </div>
        <div style={{ padding: '12px 20px 16px', display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid #f0f0f0' }}>
          <button onClick={onCancel} style={{ height: 32, padding: '0 14px', border: '1px solid #e5e7eb', borderRadius: 7, background: '#fff', cursor: 'pointer', fontSize: 12, color: '#666' }}>取消</button>
          <button onClick={() => name.trim() && onConfirm(name.trim(), category, action)} disabled={!name.trim()} style={{ height: 32, padding: '0 16px', border: 'none', borderRadius: 7, cursor: name.trim() ? 'pointer' : 'not-allowed', background: name.trim() ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : '#e5e7eb', color: name.trim() ? '#fff' : '#bbb', fontSize: 12, fontWeight: 600 }}>创建词库</button>
        </div>
      </div>
    </div>
  );
};

// ─── Sensitive Tab ───────────────────────────────────────────────────────────────
const SensitiveTab: React.FC<{ words: SensitiveWordGroup[]; onUpdate: (words: SensitiveWordGroup[]) => void }> = ({ words, onUpdate }) => {
  const [expanded, setExpanded] = useState<string | null>('wg-002');
  // per-group input state — keyed by group id so switching groups clears input
  const [wordInputs, setWordInputs] = useState<Record<string, string>>({});
  const [addedHint, setAddedHint] = useState<string>(''); // groupId of last-added word
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<{ hit: boolean; matches: { word: string; group: string; action: string }[]; cleaned: string } | null>(null);

  const getInput = (id: string) => wordInputs[id] ?? '';
  const setInput = (id: string, val: string) => setWordInputs(prev => ({ ...prev, [id]: val }));

  const addWord = (groupId: string) => {
    const val = getInput(groupId).trim();
    if (!val) return;
    onUpdate(words.map(g => g.id === groupId ? { ...g, words: [...g.words, val] } : g));
    setInput(groupId, '');
    setAddedHint(groupId);
    setTimeout(() => setAddedHint(''), 1500);
  };

  const handleCreateGroup = (name: string, category: SensitiveWordGroup['category'], action: SensitiveWordGroup['action']) => {
    const newGroup: SensitiveWordGroup = {
      id: `wg-${Date.now()}`, name, category, action, words: [], hitCount7d: 0, enabled: true,
    };
    onUpdate([...words, newGroup]);
    setShowNewGroup(false);
    setExpanded(newGroup.id);
  };

  const runTest = () => {
    const matches: { word: string; group: string; action: string }[] = [];
    let cleaned = testInput;
    words.filter(g => g.enabled).forEach(g => {
      g.words.forEach(w => {
        if (testInput.includes(w)) {
          matches.push({ word: w, group: g.name, action: ACTION_CONFIG[g.action].label });
          if (g.action !== 'flag') cleaned = cleaned.replaceAll(w, '***');
        }
      });
    });
    setTestResult({ hit: matches.length > 0, matches, cleaned });
  };

  return (
    <div>
      {showNewGroup && <NewGroupModal onConfirm={handleCreateGroup} onCancel={() => setShowNewGroup(false)} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>敏感词分组管理</div>
        <button onClick={() => setShowNewGroup(true)} style={{ height: 30, padding: '0 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
          <PlusOutlined style={{ fontSize: 10 }} />新建词库
        </button>
      </div>
      {words.map(group => {
        const open = expanded === group.id;
        const ac = ACTION_CONFIG[group.action];
        const inputVal = getInput(group.id);
        return (
          <div key={group.id} style={{ background: '#fff', borderRadius: 10, border: '1px solid #e8e8f0', marginBottom: 8, overflow: 'hidden' }}>
            <div onClick={() => setExpanded(open ? null : group.id)} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', cursor: 'pointer', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{group.name}</div>
                <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, background: PRIMARY_LIGHT, color: PRIMARY }}>{group.category}</span>
                <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, fontWeight: 700, color: ac.color, background: `${ac.color}12` }}>{ac.label}</span>
                <span style={{ fontSize: 11, color: '#bbb' }}>{group.words.length} 个词 · 7日触发 {group.hitCount7d} 次</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div onClick={e => { e.stopPropagation(); onUpdate(words.map(w => w.id === group.id ? { ...w, enabled: !w.enabled } : w)); }} style={{ width: 34, height: 18, borderRadius: 9, position: 'relative', cursor: 'pointer', background: group.enabled ? PRIMARY : '#e5e7eb', transition: 'background 0.2s' }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: group.enabled ? 18 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
                <DownOutlined style={{ fontSize: 10, color: '#bbb', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </div>
            </div>
            {open && (
              <div style={{ borderTop: '1px solid #f5f5f5', padding: '12px 16px' }}>
                {group.words.length === 0 && (
                  <div style={{ fontSize: 11, color: '#bbb', marginBottom: 10, padding: '6px 0' }}>暂无词条，请在下方添加</div>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 10 }}>
                  {group.words.map((word, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 7, fontSize: 11, color: ac.color, background: `${ac.color}12`, border: `1px solid ${ac.color}30` }}>
                      {word}
                      <span onClick={() => onUpdate(words.map(g => g.id === group.id ? { ...g, words: g.words.filter((_, i) => i !== idx) } : g))} style={{ cursor: 'pointer', color: '#bbb', marginLeft: 2 }}>×</span>
                    </div>
                  ))}
                </div>
                {/* 添加新词 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                    <input
                      value={inputVal}
                      onChange={e => setInput(group.id, e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addWord(group.id); }}
                      placeholder="如：内部成本、薪酬体系…"
                      style={{ flex: 1, height: 30, border: '1px solid #e5e7eb', borderRadius: 7, padding: '0 10px', fontSize: 12, outline: 'none', color: '#333' }}
                    />
                    <button
                      onClick={() => addWord(group.id)}
                      disabled={!inputVal.trim()}
                      style={{ height: 30, padding: '0 12px', border: 'none', borderRadius: 7, cursor: inputVal.trim() ? 'pointer' : 'not-allowed', background: inputVal.trim() ? ac.color : '#e5e7eb', color: inputVal.trim() ? '#fff' : '#bbb', fontSize: 12, fontWeight: 600, flexShrink: 0 }}
                    >
                      添加
                    </button>
                  </div>
                  {addedHint === group.id && (
                    <div style={{ fontSize: 11, color: '#059669', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>✓</span> 词条已添加到分组
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
      {/* Test playground */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8f0', padding: '16px 18px', marginTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>🧪 拦截规则测试台</div>
        <textarea value={testInput} onChange={e => setTestInput(e.target.value)} placeholder="粘贴待检测内容（模拟用户输入或模型输出）..." style={{ width: '100%', height: 76, border: '1px solid #e5e7eb', borderRadius: 8, padding: '9px 12px', fontSize: 12, resize: 'none', boxSizing: 'border-box', outline: 'none', lineHeight: 1.6, color: '#333', fontFamily: 'inherit' }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 8, marginBottom: testResult ? 14 : 0 }}>
          <button onClick={runTest} style={{ height: 32, padding: '0 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', fontSize: 12, fontWeight: 600 }}>执行检测</button>
          <button onClick={() => { setTestInput(''); setTestResult(null); }} style={{ height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'pointer', background: '#fff', color: '#666', fontSize: 12 }}>清空</button>
        </div>
        {testResult && (
          <div style={{ background: testResult.hit ? '#fef2f2' : '#ecfdf5', border: `1px solid ${testResult.hit ? '#fecaca' : '#a7f3d0'}`, borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: testResult.hit ? '#dc2626' : '#059669', marginBottom: testResult.hit ? 8 : 0 }}>
              {testResult.hit ? `⚠️ 命中 ${testResult.matches.length} 条规则，内容已处理` : '✅ 未命中任何规则，内容可通过'}
            </div>
            {testResult.hit && <>
              {testResult.matches.map((m, i) => (
                <div key={i} style={{ fontSize: 11, color: '#7f1d1d', display: 'flex', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontWeight: 600 }}>「{m.word}」</span>
                  <span style={{ color: '#9ca3af' }}>{m.group}</span>
                  <span style={{ color: '#dc2626' }}>→ {m.action}</span>
                </div>
              ))}
              <div style={{ fontSize: 11, color: '#555', background: '#fff', padding: '6px 9px', borderRadius: 6, marginTop: 8 }}>
                <span style={{ color: '#888' }}>处理后：</span>{testResult.cleaned}
              </div>
            </>}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Fence Tab ─────────────────────────────────────────���─────────────────────────
const FenceTab: React.FC<{ fences: FenceConfig[] }> = ({ fences }) => {
  const [selected, setSelected]   = useState(fences[0]?.employeeId || '');
  const [activeTab, setActiveTab] = useState<FenceTab>('ip');
  const [inputVal, setInputVal]   = useState('');
  const [configs, setConfigs]     = useState(fences);
  const [addedHint, setAddedHint] = useState(false);

  const fence = configs.find(f => f.employeeId === selected);

  const TABS = [
    { key: 'ip'        as FenceTab, label: 'IP 白名单',  field: 'ipWhitelist'     as keyof FenceConfig, placeholder: '如 10.0.0.0/8',  color: PRIMARY,    tip: '仅允许以下 IP 段访问此员工，网关层直接拒绝未列出的来源' },
    { key: 'api'       as FenceTab, label: 'API 范围',   field: 'allowedApis'     as keyof FenceConfig, placeholder: '如 pdf_parser',  color: '#059669',  tip: '此员工仅能调用以下工具，即使已挂载其他技能也无法执行' },
    { key: 'topic'     as FenceTab, label: '话题黑名单', field: 'topicBlacklist'  as keyof FenceConfig, placeholder: '如 竞品价格',    color: '#dc2626',  tip: '用户输入命中以下话题时，系统拒绝回答并记录安全事件' },
    { key: 'knowledge' as FenceTab, label: '知识边界',   field: 'knowledgeScopes' as keyof FenceConfig, placeholder: '如 法律法规库', color: '#d97706',  tip: '此员工仅能检索以下知识库，其他索引对其不可见' },
  ];
  const cur = TABS.find(t => t.key === activeTab)!;

  const items = fence ? (fence[cur.field] as string[]) : [];

  const addItem = () => {
    const val = inputVal.trim();
    if (!val || !fence) return;
    setConfigs(prev => prev.map(f =>
      f.employeeId === selected
        ? { ...f, [cur.field]: [...(f[cur.field] as string[]), val] }
        : f
    ));
    setInputVal('');
    setAddedHint(true);
    setTimeout(() => setAddedHint(false), 1500);
  };

  const removeItem = (idx: number) => {
    setConfigs(prev => prev.map(f =>
      f.employeeId === selected
        ? { ...f, [cur.field]: (f[cur.field] as string[]).filter((_, i) => i !== idx) }
        : f
    ));
  };

  const isMonospace = ['ip', 'api'].includes(activeTab);

  return (
    <div>
      {/* Employee selector */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        {configs.map(f => (
          <div key={f.employeeId} onClick={() => setSelected(f.employeeId)} style={{
            padding: '7px 14px', borderRadius: 9, cursor: 'pointer', fontSize: 13,
            background: selected === f.employeeId ? PRIMARY_LIGHT : '#f3f4f6',
            color: selected === f.employeeId ? PRIMARY : '#6b7280',
            border: `1.5px solid ${selected === f.employeeId ? PRIMARY : 'transparent'}`,
            fontWeight: selected === f.employeeId ? 600 : 400, transition: 'all 0.15s',
          }}>
            {f.employeeName}
          </div>
        ))}
        <div style={{ padding: '7px 12px', borderRadius: 9, cursor: 'pointer', fontSize: 13, background: '#f3f4f6', color: '#9ca3af', border: '1.5px dashed #e5e7eb', display: 'flex', alignItems: 'center', gap: 4 }}>
          <PlusOutlined style={{ fontSize: 11 }} />添加
        </div>
      </div>

      {fence && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8f0', overflow: 'hidden' }}>

          {/* Sub-tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0', padding: '0 18px' }}>
            {TABS.map(t => {
              const count = (fence[t.field] as string[]).length;
              return (
                <div key={t.key} onClick={() => { setActiveTab(t.key); setInputVal(''); }} style={{
                  padding: '11px 14px', cursor: 'pointer', fontSize: 12,
                  fontWeight: activeTab === t.key ? 600 : 400,
                  color: activeTab === t.key ? t.color : '#9ca3af',
                  borderBottom: `2.5px solid ${activeTab === t.key ? t.color : 'transparent'}`,
                  transition: 'all 0.15s', marginBottom: -1, display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  {t.label}
                  <span style={{ fontSize: 10, padding: '0 4px', borderRadius: 6, background: activeTab === t.key ? `${t.color}18` : '#f3f4f6', color: activeTab === t.key ? t.color : '#bbb' }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 11, color: '#888', background: '#fafafa', borderRadius: 7, padding: '7px 11px', marginBottom: 12, lineHeight: 1.6 }}>{cur.tip}</div>

            {/* Item list */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 12, minHeight: 36 }}>
              {items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 7, fontSize: 11, color: cur.color, background: `${cur.color}12`, border: `1px solid ${cur.color}30` }}>
                  <span style={{ fontFamily: isMonospace ? 'monospace' : 'inherit' }}>{item}</span>
                  <span onClick={() => removeItem(idx)} style={{ cursor: 'pointer', color: '#bbb', marginLeft: 2 }}>×</span>
                </div>
              ))}
              {items.length === 0 && <div style={{ color: '#bbb', fontSize: 11, padding: '6px 0' }}>暂无配置，请添加</div>}
            </div>

            {/* Add input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 7 }}>
                <input
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addItem()}
                  placeholder={cur.placeholder}
                  style={{ flex: 1, height: 32, border: '1px solid #e5e7eb', borderRadius: 7, padding: '0 10px', fontSize: 12, outline: 'none', color: '#333', fontFamily: isMonospace ? 'monospace' : 'inherit' }}
                />
                <button
                  onClick={addItem}
                  disabled={!inputVal.trim()}
                  style={{ height: 32, padding: '0 14px', border: 'none', borderRadius: 7, cursor: inputVal.trim() ? 'pointer' : 'not-allowed', background: inputVal.trim() ? cur.color : '#e5e7eb', color: inputVal.trim() ? '#fff' : '#bbb', fontSize: 12, fontWeight: 600 }}
                >
                  添加
                </button>
              </div>
              {addedHint && (
                <div style={{ fontSize: 11, color: '#059669', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>✓</span> 已添加并生效
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main ────────────────────────────────────────────────────────────────────────
const SecurityCenter: React.FC = () => {
  const [tab, setTab] = useState<MainTab>('overview');
  const [alerts, setAlerts] = useState<AlertEvent[]>(MOCK_ALERTS);
  const [metrics, setMetrics] = useState<BehaviorMetric[]>(MOCK_METRICS);
  const [words, setWords] = useState<SensitiveWordGroup[]>(MOCK_WORDS);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2800); };
  const resolveAlert = (id: string) => { setAlerts(p => p.map(a => a.id === id ? { ...a, status: 'resolved' as const } : a)); showToast('✅ 告警已标记解决'); };
  const handleCircuit = (name: string, act: string) => {
    const nextStatus: CircuitStatus =
      act === '限流' || act === '介入限流' ? 'throttled' :
      act === '恢复' ? 'normal' :
      'stopped'; // 停止 / 强制停止
    setMetrics(prev => prev.map(m =>
      m.employeeName === name ? { ...m, circuitStatus: nextStatus } : m
    ));
    showToast(`⚡ 已对「${name}」执行${act}，管控状态已更新`);
  };

  const activeAlerts = alerts.filter(a => a.status === 'active').length;
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && a.status === 'active').length;

  const TABS: { key: MainTab; label: string; badge?: number }[] = [
    { key: 'overview',   label: '概览',       badge: criticalAlerts > 0 ? criticalAlerts : undefined },
    { key: 'logs',       label: '日志中心' },
    { key: 'behavior',   label: '行为风控' },
    { key: 'sensitive',  label: '敏感词拦截' },
    { key: 'fence',      label: '围栏配置' },
  ];

  return (
    <div style={{ position: 'relative' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#1a1a1a', color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: 13, zIndex: 400, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #dc2626, #9f1239)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SafetyCertificateOutlined style={{ color: '#fff', fontSize: 15 }} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', lineHeight: 1.2 }}>管控中心</div>
            <div style={{ fontSize: 11, color: '#bbb' }}>企业级监控 · 日志 · 行为风控 · 敏感词 · 围栏</div>
          </div>
        </div>
        {criticalAlerts > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626' }}>{criticalAlerts} 条紧急告警待处理</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: '#f3f4f6', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {TABS.map(t => {
          const active = tab === t.key;
          return (
            <div key={t.key} onClick={() => setTab(t.key)} style={{ padding: '7px 16px', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: active ? 600 : 400, color: active ? '#1a1a1a' : '#6b7280', background: active ? '#fff' : 'transparent', boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 5 }}>
              {t.label}
              {t.badge !== undefined && t.badge > 0 && <span style={{ fontSize: 10, padding: '0 5px', borderRadius: 8, background: '#dc2626', color: '#fff', fontWeight: 700 }}>{t.badge}</span>}
            </div>
          );
        })}
      </div>

      {tab === 'overview'  && <OverviewTab alerts={alerts} metrics={metrics} onResolve={resolveAlert} onCircuit={handleCircuit} onNavigate={setTab} />}
      {tab === 'logs'      && <LogsTab />}
      {tab === 'behavior'  && <BehaviorTab metrics={metrics} onCircuit={handleCircuit} />}
      {tab === 'sensitive' && <SensitiveTab words={words} onUpdate={setWords} />}
      {tab === 'fence'     && <FenceTab fences={MOCK_FENCES} />}
    </div>
  );
};

export default SecurityCenter;
