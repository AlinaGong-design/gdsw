import React, { useState } from 'react';
import {
  AlertOutlined, CheckCircleOutlined, SettingOutlined,
  ThunderboltOutlined, StopOutlined, TeamOutlined,
  SearchOutlined, PlusOutlined, EditOutlined,
  LockOutlined, WarningOutlined, ClockCircleOutlined,
  HistoryOutlined, SafetyCertificateOutlined,
} from '@ant-design/icons';

// ─── Types ──────────────────────────────────────────────────────────────────────
type AlertLevel = 'P0' | 'P1' | 'P2' | 'P3';
type MetricType = 'calls_per_hour' | 'tokens_per_hour' | 'error_rate' | 'sensitive_hits';
type ActionType = 'notify' | 'throttle' | 'stop' | 'archive';
type OperatorRole = 'operator' | 'admin' | 'security_officer';
type EventStatus = 'active' | 'handling' | 'resolved' | 'false_positive';
type MainTab = 'baseline' | 'rules' | 'events' | 'history';

interface BaselineConfig {
  id: string;
  employeeId: string;
  employeeName: string;
  dept: string;
  callsPerHour: number;
  tokensPerHour: number;
  errorRateThreshold: number;
  sensitiveHitsPerDay: number;
  windowMinutes: number;
  enabled: boolean;
  updatedAt: string;
  updatedBy: string;
}

interface AlertRule {
  id: string;
  name: string;
  desc: string;
  metric: MetricType;
  thresholdPct: number;        // 超基线百分比，如 150 表示超出150%
  level: AlertLevel;
  action: ActionType;
  autoExecute: boolean;
  requiresRole: OperatorRole;
  notifyChannels: string[];
  cooldownMinutes: number;
  enabled: boolean;
}

interface AlertAction {
  id: string;
  alertId?: string;
  operator: string;
  operatorRole: string;
  action: string;
  detail: string;
  at: string;
  result: 'success' | 'denied';
}

interface AlertEvent {
  id: string;
  level: AlertLevel;
  ruleName: string;
  employeeId: string;
  employeeName: string;
  dept: string;
  metric: MetricType;
  currentValue: number;
  baselineValue: number;
  ratio: number;
  triggeredAt: string;
  status: EventStatus;
  autoAction?: string;
  handlers: AlertAction[];
}

// ─── Constants ──────────────────────────────────────────────────────────────────
const PRIMARY = '#6366F1';
const PRIMARY_LIGHT = '#f0f0ff';

const LEVEL_CFG: Record<AlertLevel, { label: string; color: string; bg: string; border: string; dot: string }> = {
  P0: { label: 'P0 紧急', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', dot: '#dc2626' },
  P1: { label: 'P1 高危', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', dot: '#ea580c' },
  P2: { label: 'P2 预警', color: '#d97706', bg: '#fffbeb', border: '#fde68a', dot: '#d97706' },
  P3: { label: 'P3 低危', color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', dot: '#9ca3af' },
};

const METRIC_LABEL: Record<MetricType, string> = {
  calls_per_hour: '每小时调用量',
  tokens_per_hour: '每小时 Token',
  error_rate: '错误率',
  sensitive_hits: '敏感词命中',
};

const STATUS_CFG: Record<EventStatus, { label: string; color: string; bg: string }> = {
  active:         { label: '待处置', color: '#dc2626', bg: '#fef2f2' },
  handling:       { label: '处置中', color: '#d97706', bg: '#fffbeb' },
  resolved:       { label: '已解决', color: '#059669', bg: '#ecfdf5' },
  false_positive: { label: '误报', color: '#6b7280', bg: '#f3f4f6' },
};

const ROLE_CFG: Record<OperatorRole, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  operator:         { label: '运维人员', color: '#6b7280', bg: '#f3f4f6', icon: <TeamOutlined /> },
  admin:            { label: '管理员', color: '#d97706', bg: '#fffbeb', icon: <SettingOutlined /> },
  security_officer: { label: '安全官', color: '#dc2626', bg: '#fef2f2', icon: <LockOutlined /> },
};

const ACTION_CFG: Record<ActionType, { label: string; color: string; desc: string }> = {
  notify:   { label: '告警通知', color: '#6b7280', desc: '推送飞书/邮件/短信通知，记录安全事件' },
  throttle: { label: '自动限流', color: '#d97706', desc: '系统自动将调用量限制至基线120%，发送SOC告警' },
  stop:     { label: '强制停止', color: '#ea580c', desc: '立即停止实例，中断所有调用，需人工恢复，推送值班群' },
  archive:  { label: '下架归档', color: '#dc2626', desc: '强制下架并归档实例，不可自动恢复，需安全官确认' },
};

// ─── Mock Data ──────────────────────────────────────────────────────────────────
const MOCK_BASELINES: BaselineConfig[] = [
  { id: 'bl-001', employeeId: 'de-001', employeeName: '法务合规助手', dept: '法务部', callsPerHour: 68, tokensPerHour: 136000, errorRateThreshold: 5, sensitiveHitsPerDay: 3, windowMinutes: 60, enabled: true, updatedAt: '2026-04-20 10:00', updatedBy: '陈主任' },
  { id: 'bl-002', employeeId: 'de-009', employeeName: '合同审核助手', dept: '法务部', callsPerHour: 32, tokensPerHour: 88000, errorRateThreshold: 3, sensitiveHitsPerDay: 2, windowMinutes: 60, enabled: true, updatedAt: '2026-04-18 14:30', updatedBy: '李四' },
  { id: 'bl-003', employeeId: 'de-005', employeeName: '智能客服分发', dept: '客户成功', callsPerHour: 298, tokensPerHour: 410000, errorRateThreshold: 8, sensitiveHitsPerDay: 10, windowMinutes: 30, enabled: true, updatedAt: '2026-04-15 09:00', updatedBy: '管理员' },
  { id: 'bl-004', employeeId: 'de-007', employeeName: '智能巡检助手', dept: '管道运营部', callsPerHour: 22, tokensPerHour: 48000, errorRateThreshold: 5, sensitiveHitsPerDay: 1, windowMinutes: 60, enabled: true, updatedAt: '2026-04-10 11:00', updatedBy: '管理员' },
  { id: 'bl-005', employeeId: 'de-002', employeeName: 'HR 招聘助手', dept: '人力资源', callsPerHour: 61, tokensPerHour: 82000, errorRateThreshold: 5, sensitiveHitsPerDay: 5, windowMinutes: 60, enabled: true, updatedAt: '2026-04-12 16:00', updatedBy: '孙七' },
  { id: 'bl-006', employeeId: 'de-006', employeeName: '运营数据助手', dept: '运营部', callsPerHour: 40, tokensPerHour: 55000, errorRateThreshold: 5, sensitiveHitsPerDay: 2, windowMinutes: 60, enabled: true, updatedAt: '2026-04-14 10:30', updatedBy: '管理员' },
];

const MOCK_RULES: AlertRule[] = [
  {
    id: 'rule-001', name: '调用量预警通知', level: 'P2',
    desc: '调用量超过基线150%时，向值班运维推送告警通知',
    metric: 'calls_per_hour', thresholdPct: 150, action: 'notify',
    autoExecute: true, requiresRole: 'operator', cooldownMinutes: 30,
    notifyChannels: ['飞书值班群', '邮件'], enabled: true,
  },
  {
    id: 'rule-002', name: '调用量自动限流', level: 'P1',
    desc: '调用量超过基线300%时，系统自动限流至基线120%并推送SOC',
    metric: 'calls_per_hour', thresholdPct: 300, action: 'throttle',
    autoExecute: true, requiresRole: 'admin', cooldownMinutes: 10,
    notifyChannels: ['飞书值班群', '飞书SOC群', '短信'], enabled: true,
  },
  {
    id: 'rule-003', name: '调用量强制停止', level: 'P0',
    desc: '调用量超过基线500%时，立即停止实例并推送紧急通知，需管理员人工恢复',
    metric: 'calls_per_hour', thresholdPct: 500, action: 'stop',
    autoExecute: true, requiresRole: 'admin', cooldownMinutes: 0,
    notifyChannels: ['飞书值班群', '飞书SOC群', '短信', '电话'], enabled: true,
  },
  {
    id: 'rule-004', name: '敏感词命中预警', level: 'P2',
    desc: '单日敏感词命中次数超过基线200%时，发送预警并记录安全事件',
    metric: 'sensitive_hits', thresholdPct: 200, action: 'notify',
    autoExecute: true, requiresRole: 'operator', cooldownMinutes: 60,
    notifyChannels: ['飞书安全群', '邮件'], enabled: true,
  },
  {
    id: 'rule-005', name: 'Token 消耗预警', level: 'P2',
    desc: 'Token 消耗超过基线200%时，推送预警防止超额费用',
    metric: 'tokens_per_hour', thresholdPct: 200, action: 'notify',
    autoExecute: true, requiresRole: 'operator', cooldownMinutes: 30,
    notifyChannels: ['飞书值班群', '邮件'], enabled: true,
  },
  {
    id: 'rule-006', name: '强制下架归档', level: 'P0',
    desc: '发现严重违规或长期异常时，安全官确认后强制下架并归档实例，不可自动恢复',
    metric: 'calls_per_hour', thresholdPct: 0, action: 'archive',
    autoExecute: false, requiresRole: 'security_officer', cooldownMinutes: 0,
    notifyChannels: ['飞书SOC群', '邮件', '短信'], enabled: true,
  },
];

const MOCK_EVENTS: AlertEvent[] = [
  {
    id: 'evt-001', level: 'P0', ruleName: '调用量强制停止',
    employeeId: 'de-001', employeeName: '法务合规助手', dept: '法务部',
    metric: 'calls_per_hour', currentValue: 571, baselineValue: 68, ratio: 839,
    triggeredAt: '2026-04-22 03:01', status: 'handling',
    autoAction: '已自动限流至基线120%（82次/h），等待人工确认强制停止',
    handlers: [
      { id: 'h-001', operator: '系统自动', operatorRole: 'system', action: '自动限流', detail: '调用量限制至 82次/h', at: '03:01', result: 'success' },
      { id: 'h-002', operator: '值班运维 王工', operatorRole: 'operator', action: '查看告警', detail: '已确认异常，联系管理员', at: '03:08', result: 'success' },
    ],
  },
  {
    id: 'evt-002', level: 'P1', ruleName: '调用量自动限流',
    employeeId: 'de-009', employeeName: '合同审核助手', dept: '法务部',
    metric: 'calls_per_hour', currentValue: 98, baselineValue: 32, ratio: 306,
    triggeredAt: '2026-04-22 09:42', status: 'active',
    autoAction: '敏感数据拦截（身份证号检测并脱敏），推送SOC',
    handlers: [],
  },
  {
    id: 'evt-003', level: 'P2', ruleName: '调用量预警通知',
    employeeId: 'de-005', employeeName: '智能客服分发', dept: '客户成功',
    metric: 'calls_per_hour', currentValue: 445, baselineValue: 298, ratio: 149,
    triggeredAt: '2026-04-22 10:15', status: 'active',
    handlers: [],
  },
  {
    id: 'evt-004', level: 'P2', ruleName: '敏感词命中预警',
    employeeId: 'de-002', employeeName: 'HR 招聘助手', dept: '人力资源',
    metric: 'sensitive_hits', currentValue: 12, baselineValue: 5, ratio: 240,
    triggeredAt: '2026-04-22 10:08', status: 'resolved',
    autoAction: '按围栏规则自动拒绝，事件已推送安全群',
    handlers: [
      { id: 'h-003', operator: '运维 张工', operatorRole: 'operator', action: '标记解决', detail: '已确认为用户误操作，非恶意行为', at: '10:30', result: 'success' },
    ],
  },
  {
    id: 'evt-005', level: 'P3', ruleName: 'Token 消耗预警',
    employeeId: 'de-007', employeeName: '智能巡检助手', dept: '管道运营部',
    metric: 'tokens_per_hour', currentValue: 88000, baselineValue: 48000, ratio: 183,
    triggeredAt: '2026-04-22 01:30', status: 'resolved',
    handlers: [
      { id: 'h-004', operator: '运维 李工', operatorRole: 'operator', action: '标记解决', detail: '凌晨例行巡检任务导致，属正常峰值', at: '08:00', result: 'success' },
    ],
  },
];

const MOCK_HISTORY: AlertAction[] = [
  { id: 'hist-001', alertId: 'evt-001', operator: '系统自动', operatorRole: 'system', action: '自动限流', detail: '法务合规助手：调用量限制至 82次/h（基线120%）', at: '2026-04-22 03:01', result: 'success' },
  { id: 'hist-002', alertId: 'evt-001', operator: '陈主任', operatorRole: 'security_officer', action: '强制停止实例', detail: '法务合规助手：确认恶意调用，强制停止实例', at: '2026-04-22 03:05', result: 'success' },
  { id: 'hist-003', alertId: 'evt-004', operator: '张三', operatorRole: 'operator', action: '尝试人工限流', detail: '合同审核助手：权限不足，操作已拒绝', at: '2026-04-22 09:50', result: 'denied' },
  { id: 'hist-004', alertId: 'evt-004', operator: '运维 张工', operatorRole: 'operator', action: '标记解决', detail: 'HR 招聘助手：确认为误操作，事件关闭', at: '2026-04-22 10:30', result: 'success' },
  { id: 'hist-005', alertId: 'evt-005', operator: '运维 李工', operatorRole: 'operator', action: '标记解决', detail: '智能巡检助手：例行任务峰值，关闭告警', at: '2026-04-22 08:00', result: 'success' },
];

// ─── Baseline Edit Modal ─────────────────────────────────────────────────────────
const BaselineEditModal: React.FC<{
  item: BaselineConfig;
  onConfirm: (updated: BaselineConfig) => void;
  onCancel: () => void;
}> = ({ item, onConfirm, onCancel }) => {
  const [form, setForm] = useState({ ...item });
  const set = (k: keyof BaselineConfig, v: any) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400 }}>
      <div style={{ background: '#fff', borderRadius: 14, width: 480, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>编辑基线配置</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>{form.employeeName} · {form.dept}</div>
        </div>
        <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: '调用基线（次/小时）', key: 'callsPerHour', unit: '次/h' },
              { label: 'Token 基线（/小时）', key: 'tokensPerHour', unit: 'tokens/h' },
              { label: '错误率阈值（%）', key: 'errorRateThreshold', unit: '%' },
              { label: '敏感词上限（次/日）', key: 'sensitiveHitsPerDay', unit: '次/d' },
            ].map(f => (
              <div key={f.key}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 5 }}>{f.label}</div>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    value={(form as any)[f.key]}
                    onChange={e => set(f.key as keyof BaselineConfig, Number(e.target.value))}
                    style={{ width: '100%', height: 32, border: '1px solid #e5e7eb', borderRadius: 7, padding: '0 32px 0 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#333' }}
                  />
                  <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: '#bbb' }}>{f.unit}</span>
                </div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 5 }}>检测窗���（分钟）</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[15, 30, 60, 120].map(v => (
                <div key={v} onClick={() => set('windowMinutes', v)} style={{
                  flex: 1, padding: '6px 0', textAlign: 'center', borderRadius: 7, fontSize: 12, cursor: 'pointer',
                  border: `1px solid ${form.windowMinutes === v ? PRIMARY : '#e5e7eb'}`,
                  background: form.windowMinutes === v ? PRIMARY_LIGHT : '#f9fafb',
                  color: form.windowMinutes === v ? PRIMARY : '#6b7280',
                  fontWeight: form.windowMinutes === v ? 600 : 400,
                }}>
                  {v}min
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 12px', fontSize: 11, color: '#92400e', lineHeight: 1.7 }}>
            <WarningOutlined style={{ marginRight: 4 }} />
            基线修改后将立即生效，超基线阈值将按新基线重新计算。建议参考近30天平均数据设置。
          </div>
        </div>
        <div style={{ padding: '12px 22px 16px', display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid #f0f0f0' }}>
          <button onClick={onCancel} style={{ height: 32, padding: '0 16px', border: '1px solid #e5e7eb', borderRadius: 7, background: '#fff', cursor: 'pointer', fontSize: 12 }}>取消</button>
          <button onClick={() => onConfirm({ ...form, updatedAt: new Date().toLocaleString('zh-CN').slice(0, 16), updatedBy: '当前用户' })}
            style={{ height: 32, padding: '0 18px', border: 'none', borderRadius: 7, cursor: 'pointer', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', fontSize: 12, fontWeight: 600 }}>
            保存基线
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Baseline Tab ─────────────────────────────────────────────────────────────────
const BaselineTab: React.FC = () => {
  const [baselines, setBaselines] = useState(MOCK_BASELINES);
  const [editing, setEditing] = useState<BaselineConfig | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#1a1a1a', color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: 13, zIndex: 500, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>{toast}</div>
      )}
      {editing && (
        <BaselineEditModal
          item={editing}
          onConfirm={updated => {
            setBaselines(p => p.map(b => b.id === updated.id ? updated : b));
            setEditing(null);
            showToast('✅ 基线配置已保存并生效');
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      {/* 说明 */}
      <div style={{ background: '#f0f0ff', border: '1px solid #c7d2fe', borderRadius: 10, padding: '12px 16px', marginBottom: 18, display: 'flex', gap: 10 }}>
        <SafetyCertificateOutlined style={{ color: PRIMARY, fontSize: 16, flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 12, color: '#3730a3', lineHeight: 1.8 }}>
          <strong>基线含义：</strong>每个数字员工在正常业务状态下的调用量、Token消耗、错误率等指标的参考值。
          告警规则将根据此基线判断是否触发预警。建议参考近30天平均数据设置，并定期复盘更新。
        </div>
      </div>

      {/* 表格 */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8f0', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr 1fr 1fr 0.8fr 0.8fr', padding: '10px 18px', background: '#fafafa', borderBottom: '1px solid #f0f0f0', fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>
          <div>数字员工</div>
          <div style={{ textAlign: 'center' }}>调用基线（/h）</div>
          <div style={{ textAlign: 'center' }}>Token 基线（/h）</div>
          <div style={{ textAlign: 'center' }}>错误率阈值</div>
          <div style={{ textAlign: 'center' }}>检测窗口</div>
          <div style={{ textAlign: 'center' }}>状态</div>
          <div style={{ textAlign: 'center' }}>操作</div>
        </div>
        {baselines.map((b, idx) => (
          <div key={b.id} style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr 1fr 1fr 0.8fr 0.8fr', padding: '13px 18px', borderBottom: idx < baselines.length - 1 ? '1px solid #f5f5f5' : 'none', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{b.employeeName}</div>
              <div style={{ fontSize: 10, color: '#bbb' }}>{b.dept} · 更新于 {b.updatedAt.slice(5)} by {b.updatedBy}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: PRIMARY }}>{b.callsPerHour}</div>
              <div style={{ fontSize: 9, color: '#bbb' }}>次/小时</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#7c3aed' }}>{(b.tokensPerHour / 1000).toFixed(0)}k</div>
              <div style={{ fontSize: 9, color: '#bbb' }}>tokens/小时</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#d97706' }}>{b.errorRateThreshold}%</div>
              <div style={{ fontSize: 9, color: '#bbb' }}>触发预警</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: '#f0f0ff', color: PRIMARY }}>{b.windowMinutes}min</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div
                onClick={() => setBaselines(p => p.map(x => x.id === b.id ? { ...x, enabled: !x.enabled } : x))}
                style={{ width: 34, height: 18, borderRadius: 9, background: b.enabled ? PRIMARY : '#e5e7eb', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', margin: '0 auto' }}
              >
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: b.enabled ? 18 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <button onClick={() => setEditing(b)} style={{ fontSize: 11, height: 26, padding: '0 10px', border: `1px solid ${PRIMARY}30`, borderRadius: 6, background: PRIMARY_LIGHT, color: PRIMARY, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <EditOutlined style={{ fontSize: 10 }} />编辑
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Rules Tab ────────────────────────────────────────────────────────────────────
const RulesTab: React.FC = () => {
  const [rules, setRules] = useState(MOCK_RULES);

  // 梯度可视化
  const LADDER = [
    { pct: 150, level: 'P2', action: '告警通知', color: '#d97706', bg: '#fffbeb' },
    { pct: 300, level: 'P1', action: '自动限流', color: '#ea580c', bg: '#fff7ed' },
    { pct: 500, level: 'P0', action: '强制停止', color: '#dc2626', bg: '#fef2f2' },
    { pct: null, level: 'P0', action: '下架归档', color: '#7f1d1d', bg: '#fef2f2' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 梯度策略可视化 */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8f0', padding: '18px 20px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>梯度告警策略</div>
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
          {LADDER.map((step, idx) => (
            <React.Fragment key={step.action}>
              <div style={{ flex: 1, background: step.bg, borderRadius: 10, padding: '14px 12px', border: `1px solid ${step.color}30` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 8, fontWeight: 700, color: LEVEL_CFG[step.level as AlertLevel].color, background: '#fff', border: `1px solid ${step.color}` }}>
                    {LEVEL_CFG[step.level as AlertLevel].label}
                  </span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: step.color, marginBottom: 4 }}>
                  {step.pct ? `超基线 ${step.pct}%` : '安全官确认'}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: step.color, marginBottom: 6 }}>→ {step.action}</div>
                <div style={{ fontSize: 10, color: '#888', lineHeight: 1.6 }}>
                  {ACTION_CFG[MOCK_RULES.find(r => r.action === (step.action === '告警通知' ? 'notify' : step.action === '自动限流' ? 'throttle' : step.action === '强制停止' ? 'stop' : 'archive'))?.action || 'notify'].desc}
                </div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {step.action === '下架归档' ? (
                    <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 6, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 2 }}>
                      <LockOutlined style={{ fontSize: 9 }} /> 需安全官确认
                    </span>
                  ) : step.action === '强制停止' ? (
                    <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 6, background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', display: 'flex', alignItems: 'center', gap: 2 }}>
                      <LockOutlined style={{ fontSize: 9 }} /> 自��执行，管理员恢复
                    </span>
                  ) : (
                    <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 6, background: '#ecfdf5', color: '#059669' }}>
                      ⚡ 自动执行
                    </span>
                  )}
                </div>
              </div>
              {idx < LADDER.length - 1 && (
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px', flexShrink: 0 }}>
                  <div style={{ width: 24, height: 2, background: `linear-gradient(90deg, ${LADDER[idx].color}, ${LADDER[idx + 1].color})` }} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 规则列表 */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>告警规则配置</div>
          <button style={{ height: 30, padding: '0 12px', border: 'none', borderRadius: 8, cursor: 'pointer', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <PlusOutlined style={{ fontSize: 10 }} />新增规则
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.8fr 1.2fr 1fr 1.2fr 0.8fr 0.7fr', padding: '9px 18px', background: '#fafafa', borderBottom: '1px solid #f0f0f0', fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>
          <div>规则名称</div>
          <div style={{ textAlign: 'center' }}>级别</div>
          <div style={{ textAlign: 'center' }}>触发指标</div>
          <div style={{ textAlign: 'center' }}>触发阈值</div>
          <div style={{ textAlign: 'center' }}>所需权限</div>
          <div style={{ textAlign: 'center' }}>执行方式</div>
          <div style={{ textAlign: 'center' }}>启用</div>
        </div>
        {rules.map((rule, idx) => {
          const lc = LEVEL_CFG[rule.level];
          const rc = ROLE_CFG[rule.requiresRole];
          const ac = ACTION_CFG[rule.action];
          return (
            <div key={rule.id} style={{ display: 'grid', gridTemplateColumns: '2fr 0.8fr 1.2fr 1fr 1.2fr 0.8fr 0.7fr', padding: '13px 18px', borderBottom: idx < rules.length - 1 ? '1px solid #f5f5f5' : 'none', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', marginBottom: 2 }}>{rule.name}</div>
                <div style={{ fontSize: 10, color: '#bbb', lineHeight: 1.5 }}>{rule.desc}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 8, fontWeight: 700, color: lc.color, background: lc.bg, border: `1px solid ${lc.border}` }}>{lc.label}</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 11, color: '#555' }}>{METRIC_LABEL[rule.metric]}</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                {rule.thresholdPct > 0 ? (
                  <span style={{ fontSize: 12, fontWeight: 700, color: lc.color }}>超基线 {rule.thresholdPct}%</span>
                ) : (
                  <span style={{ fontSize: 11, color: '#888' }}>人工触发</span>
                )}
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 8, color: rc.color, background: rc.bg, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  {rc.icon}{rc.label}
                </span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 8, color: rule.autoExecute ? '#059669' : '#d97706', background: rule.autoExecute ? '#ecfdf5' : '#fffbeb' }}>
                  {rule.autoExecute ? '⚡ 自动' : '👤 人工'}
                </span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div onClick={() => setRules(p => p.map(r => r.id === rule.id ? { ...r, enabled: !r.enabled } : r))}
                  style={{ width: 34, height: 18, borderRadius: 9, background: rule.enabled ? PRIMARY : '#e5e7eb', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', margin: '0 auto' }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: rule.enabled ? 18 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Handle Confirm Dialog ────────────────────────────────────────────────────────
const ConfirmDialog: React.FC<{
  title: string;
  desc: string;
  danger?: boolean;
  requiresRole?: OperatorRole;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ title, desc, danger, requiresRole, onConfirm, onCancel }) => {
  const [confirm, setConfirm] = useState('');
  const needsConfirm = danger && requiresRole === 'security_officer';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400 }}>
      <div style={{ background: '#fff', borderRadius: 14, width: 440, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 10 }}>
          {danger ? <WarningOutlined style={{ color: '#dc2626', fontSize: 20 }} /> : <AlertOutlined style={{ color: '#d97706', fontSize: 18 }} />}
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{title}</div>
        </div>
        <div style={{ padding: '16px 22px' }}>
          <div style={{ fontSize: 13, color: '#555', lineHeight: 1.7, marginBottom: 12 }}>{desc}</div>
          {requiresRole && (
            <div style={{ background: requiresRole === 'security_officer' ? '#fef2f2' : '#fffbeb', border: `1px solid ${requiresRole === 'security_officer' ? '#fecaca' : '#fde68a'}`, borderRadius: 8, padding: '8px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <LockOutlined style={{ color: requiresRole === 'security_officer' ? '#dc2626' : '#d97706', fontSize: 13 }} />
              <div style={{ fontSize: 12, color: requiresRole === 'security_officer' ? '#7f1d1d' : '#92400e' }}>
                此操作需要 <strong>{ROLE_CFG[requiresRole].label}</strong> 权限才可执行
              </div>
            </div>
          )}
          {needsConfirm && (
            <div>
              <div style={{ fontSize: 12, color: '#555', marginBottom: 6 }}>请输入 <code style={{ background: '#f3f4f6', padding: '1px 5px', borderRadius: 4 }}>CONFIRM</code> 以确认高危操作</div>
              <input value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="输入 CONFIRM" style={{ width: '100%', height: 34, border: `1px solid ${confirm === 'CONFIRM' ? '#059669' : '#e5e7eb'}`, borderRadius: 8, padding: '0 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#333' }} />
            </div>
          )}
        </div>
        <div style={{ padding: '12px 22px 16px', display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid #f0f0f0' }}>
          <button onClick={onCancel} style={{ height: 32, padding: '0 16px', border: '1px solid #e5e7eb', borderRadius: 7, background: '#fff', cursor: 'pointer', fontSize: 12 }}>取消</button>
          <button
            onClick={onConfirm}
            disabled={needsConfirm && confirm !== 'CONFIRM'}
            style={{ height: 32, padding: '0 18px', border: 'none', borderRadius: 7, cursor: needsConfirm && confirm !== 'CONFIRM' ? 'not-allowed' : 'pointer', background: needsConfirm && confirm !== 'CONFIRM' ? '#e5e7eb' : danger ? '#dc2626' : PRIMARY, color: needsConfirm && confirm !== 'CONFIRM' ? '#bbb' : '#fff', fontSize: 12, fontWeight: 600 }}>
            确认执行
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Events Tab ───────────────────────────────────────────────────────────────────
const EventsTab: React.FC = () => {
  const [events, setEvents] = useState(MOCK_EVENTS);
  const [filterLevel, setFilterLevel] = useState<AlertLevel | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<EventStatus | 'all'>('all');
  const [expanded, setExpanded] = useState<string | null>('evt-001');
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; desc: string; danger?: boolean; requiresRole?: OperatorRole; onConfirm: () => void } | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const activeEvents = events.filter(e => e.status === 'active' || e.status === 'handling');
  const resolvedEvents = events.filter(e => e.status === 'resolved' || e.status === 'false_positive');

  const handleAction = (evtId: string, action: string, requiresRole: OperatorRole, nextStatus?: EventStatus) => {
    const isDanger = requiresRole === 'security_officer' || action === '强制停止' || action === '下架归档';
    setConfirmDialog({
      title: `确认执行：${action}`,
      desc: `该操作将对告警事件 ${evtId} 执行「${action}」。${isDanger ? '此为高危操作，执行后不可自动恢复。' : ''}`,
      danger: isDanger,
      requiresRole,
      onConfirm: () => {
        if (nextStatus) {
          setEvents(p => p.map(e => e.id === evtId ? {
            ...e, status: nextStatus,
            handlers: [...e.handlers, { id: `h-${Date.now()}`, operator: '当前用户', operatorRole: requiresRole, action, detail: `手动执行：${action}`, at: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), result: 'success' as const }],
          } : e));
        }
        setConfirmDialog(null);
        showToast(`✅ 已执行「${action}」`);
      },
    });
  };

  const renderEvent = (evt: AlertEvent) => {
    const lc = LEVEL_CFG[evt.level];
    const sc = STATUS_CFG[evt.status];
    const isOpen = expanded === evt.id;
    const overPct = ((evt.ratio - 100)).toFixed(0);

    return (
      <div key={evt.id} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${evt.status === 'active' && evt.level === 'P0' ? '#fecaca' : '#e8e8f0'}`, marginBottom: 8, overflow: 'hidden' }}>
        {/* Header */}
        <div onClick={() => setExpanded(isOpen ? null : evt.id)} style={{ display: 'flex', alignItems: 'center', padding: '13px 18px', cursor: 'pointer', gap: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: lc.dot, flexShrink: 0 }} />
          <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 8, fontWeight: 700, color: lc.color, background: lc.bg, border: `1px solid ${lc.border}`, flexShrink: 0 }}>{lc.label}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>{evt.ruleName}</span>
              <span style={{ fontSize: 11, color: '#555' }}>· {evt.employeeName}</span>
              <span style={{ fontSize: 10, color: '#bbb' }}>/ {evt.dept}</span>
            </div>
            <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
              {METRIC_LABEL[evt.metric]}：当前 {evt.currentValue.toLocaleString()} / 基线 {evt.baselineValue.toLocaleString()}
              <span style={{ color: lc.color, fontWeight: 700, marginLeft: 6 }}>↑ {overPct}%</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 8, fontWeight: 600, color: sc.color, background: sc.bg }}>{sc.label}</span>
            <span style={{ fontSize: 10, color: '#bbb' }}>{evt.triggeredAt.slice(11)}</span>
            <span style={{ fontSize: 10, color: '#bbb', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>▼</span>
          </div>
        </div>

        {/* Expanded */}
        {isOpen && (
          <div style={{ borderTop: '1px solid #f5f5f5', padding: '14px 18px' }}>
            {/* Auto action */}
            {evt.autoAction && (
              <div style={{ fontSize: 11, color: PRIMARY, background: PRIMARY_LIGHT, border: `1px solid ${PRIMARY}30`, borderRadius: 8, padding: '8px 12px', marginBottom: 12, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <ThunderboltOutlined style={{ fontSize: 11, marginTop: 1, flexShrink: 0 }} />
                <span><strong>自动处置：</strong>{evt.autoAction}</span>
              </div>
            )}

            {/* Handler records */}
            {evt.handlers.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>处置记录</div>
                {evt.handlers.map(h => (
                  <div key={h.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '7px 10px', background: h.result === 'denied' ? '#fef2f2' : '#fafafa', borderRadius: 8, marginBottom: 5 }}>
                    <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 5, flexShrink: 0, marginTop: 1, fontWeight: 600, color: h.result === 'success' ? '#059669' : '#dc2626', background: h.result === 'success' ? '#ecfdf5' : '#fef2f2' }}>
                      {h.result === 'success' ? '成功' : '拒绝'}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#333' }}>{h.action}</div>
                      <div style={{ fontSize: 10, color: '#888' }}>{h.detail}</div>
                    </div>
                    <div style={{ fontSize: 10, color: '#bbb', flexShrink: 0 }}>
                      <div>{h.operator}</div>
                      <div>{h.at}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            {(evt.status === 'active' || evt.status === 'handling') && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid #f5f5f5' }}>
                <button onClick={() => handleAction(evt.id, '标记解决', 'operator', 'resolved')}
                  style={{ height: 30, padding: '0 12px', border: '1px solid #a7f3d0', borderRadius: 7, background: '#ecfdf5', color: '#059669', fontSize: 11, cursor: 'pointer' }}>
                  ✓ 标记解决
                </button>
                <button onClick={() => handleAction(evt.id, '标记误报', 'operator', 'false_positive')}
                  style={{ height: 30, padding: '0 12px', border: '1px solid #e5e7eb', borderRadius: 7, background: '#fff', color: '#6b7280', fontSize: 11, cursor: 'pointer' }}>
                  误报
                </button>
                {(evt.level === 'P0' || evt.level === 'P1') && (
                  <button onClick={() => handleAction(evt.id, '强制停止实例', 'admin')}
                    style={{ height: 30, padding: '0 12px', border: '1px solid #fed7aa', borderRadius: 7, background: '#fff7ed', color: '#ea580c', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <StopOutlined style={{ fontSize: 10 }} />强制停止
                    <span style={{ fontSize: 9, color: '#bbb' }}>（需管理员）</span>
                  </button>
                )}
                {evt.level === 'P0' && (
                  <button onClick={() => handleAction(evt.id, '下架归档实例', 'security_officer')}
                    style={{ height: 30, padding: '0 14px', border: '1px solid #fecaca', borderRadius: 7, background: '#fef2f2', color: '#dc2626', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <LockOutlined style={{ fontSize: 10 }} />下架归档
                    <span style={{ fontSize: 9, color: '#bbb' }}>（需安全官）</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const filteredActive = activeEvents.filter(e =>
    (filterLevel === 'all' || e.level === filterLevel) &&
    (filterStatus === 'all' || e.status === filterStatus)
  );
  const filteredResolved = resolvedEvents.filter(e =>
    (filterLevel === 'all' || e.level === filterLevel)
  );

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#1a1a1a', color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: 13, zIndex: 500 }}>{toast}</div>
      )}
      {confirmDialog && (
        <ConfirmDialog {...confirmDialog} onCancel={() => setConfirmDialog(null)} />
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'P0', 'P1', 'P2', 'P3'] as const).map(l => (
            <div key={l} onClick={() => setFilterLevel(l)} style={{
              padding: '4px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 500,
              background: filterLevel === l ? (l === 'all' ? PRIMARY_LIGHT : LEVEL_CFG[l as AlertLevel]?.bg || PRIMARY_LIGHT) : '#f3f4f6',
              color: filterLevel === l ? (l === 'all' ? PRIMARY : LEVEL_CFG[l as AlertLevel]?.color || PRIMARY) : '#6b7280',
              border: `1px solid ${filterLevel === l ? (l === 'all' ? PRIMARY : LEVEL_CFG[l as AlertLevel]?.border || PRIMARY) : 'transparent'}`,
              transition: 'all 0.15s',
            }}>
              {l === 'all' ? '全部级别' : LEVEL_CFG[l as AlertLevel].label}
            </div>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {(['all', 'active', 'handling'] as const).map(s => (
            <div key={s} onClick={() => setFilterStatus(s)} style={{
              padding: '4px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 11,
              background: filterStatus === s ? '#f0f0ff' : '#f3f4f6',
              color: filterStatus === s ? PRIMARY : '#6b7280',
              border: `1px solid ${filterStatus === s ? PRIMARY : 'transparent'}`,
            }}>
              {s === 'all' ? '全部' : STATUS_CFG[s].label}
            </div>
          ))}
        </div>
      </div>

      {/* Active */}
      {filteredActive.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>待处置告警</div>
            <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 8, background: '#fef2f2', color: '#dc2626', fontWeight: 600 }}>{filteredActive.length} 条</span>
          </div>
          {filteredActive.map(renderEvent)}
        </div>
      )}

      {/* Resolved */}
      {filteredResolved.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 10 }}>已处置</div>
          {filteredResolved.map(renderEvent)}
        </div>
      )}

      {filteredActive.length === 0 && filteredResolved.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#bbb' }}>
          <CheckCircleOutlined style={{ fontSize: 32, display: 'block', marginBottom: 10, color: '#059669' }} />
          <div style={{ fontSize: 13 }}>没有匹配的告警事件</div>
        </div>
      )}
    </div>
  );
};

// ─── History Tab ──────────────────────────────────────────────────────────────────
const HistoryTab: React.FC = () => {
  const [search, setSearch] = useState('');
  const filtered = MOCK_HISTORY.filter(h =>
    !search || h.operator.includes(search) || h.action.includes(search) || h.detail.includes(search)
  );

  return (
    <div>
      {/* Search */}
      <div style={{ position: 'relative', width: 240, marginBottom: 16 }}>
        <SearchOutlined style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#bbb', fontSize: 12 }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索操作人、操作类型..." style={{ width: '100%', height: 32, border: '1px solid #e5e7eb', borderRadius: 8, padding: '0 10px 0 28px', fontSize: 12, outline: 'none', boxSizing: 'border-box', color: '#333' }} />
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8f0', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.8fr 1.5fr 2fr 0.8fr 0.7fr', padding: '9px 18px', background: '#fafafa', borderBottom: '1px solid #f0f0f0', fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>
          <div>操作人 / 角色</div>
          <div>关联告警</div>
          <div>操作类型</div>
          <div>操作详情</div>
          <div style={{ textAlign: 'center' }}>时间</div>
          <div style={{ textAlign: 'center' }}>结果</div>
        </div>
        {filtered.map((h, idx) => {
          const rc = ROLE_CFG[(h.operatorRole as OperatorRole) || 'operator'];
          return (
            <div key={h.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.8fr 1.5fr 2fr 0.8fr 0.7fr', padding: '12px 18px', borderBottom: idx < filtered.length - 1 ? '1px solid #f5f5f5' : 'none', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>{h.operator}</div>
                <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 5, color: (rc || ROLE_CFG.operator).color, background: (rc || ROLE_CFG.operator).bg }}>{(rc || ROLE_CFG.operator).label}</span>
              </div>
              <div style={{ fontSize: 11, color: '#555', fontFamily: 'monospace' }}>{h.alertId}</div>
              <div style={{ fontSize: 11, fontWeight: 500, color: '#333' }}>{h.action}</div>
              <div style={{ fontSize: 11, color: '#666' }}>{h.detail}</div>
              <div style={{ fontSize: 10, color: '#bbb', textAlign: 'center' }}>{h.at.slice(11) || h.at}</div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 8, fontWeight: 600, color: h.result === 'success' ? '#059669' : '#dc2626', background: h.result === 'success' ? '#ecfdf5' : '#fef2f2' }}>
                  {h.result === 'success' ? '成功' : '拒绝'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Main AlertCenter ─────────────────────────────────────────────────────────────
const AlertCenter: React.FC = () => {
  const [tab, setTab] = useState<MainTab>('events');

  const activeCount = MOCK_EVENTS.filter(e => e.status === 'active' || e.status === 'handling').length;
  const p0Count = MOCK_EVENTS.filter(e => e.level === 'P0' && (e.status === 'active' || e.status === 'handling')).length;

  const TABS: { key: MainTab; label: string; badge?: number; badgeColor?: string }[] = [
    { key: 'events', label: '告警事件', badge: activeCount, badgeColor: '#dc2626' },
    { key: 'baseline', label: '基线配置' },
    { key: 'rules', label: '告警规则' },
    { key: 'history', label: '处置历史' },
  ];

  return (
    <div style={{ position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #dc2626, #9f1239)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertOutlined style={{ color: '#fff', fontSize: 15 }} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', lineHeight: 1.2 }}>告警管理</div>
            <div style={{ fontSize: 11, color: '#bbb' }}>基线配置 · 告警规则 · 分级处置 · 操作记录</div>
          </div>
        </div>
        {p0Count > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626' }}>{p0Count} 条 P0 紧急告警待处置</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {[
          { label: '活跃告警', value: MOCK_EVENTS.filter(e => e.status === 'active').length, color: '#dc2626', bg: '#fef2f2' },
          { label: '处置中', value: MOCK_EVENTS.filter(e => e.status === 'handling').length, color: '#d97706', bg: '#fffbeb' },
          { label: 'P0 紧急', value: p0Count, color: '#7f1d1d', bg: '#fef2f2' },
          { label: '今日已解决', value: MOCK_EVENTS.filter(e => e.status === 'resolved').length, color: '#059669', bg: '#ecfdf5' },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: '#fff', borderRadius: 10, padding: '12px 16px', border: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: '#f3f4f6', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {TABS.map(t => {
          const active = tab === t.key;
          return (
            <div key={t.key} onClick={() => setTab(t.key)} style={{ padding: '7px 16px', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: active ? 600 : 400, color: active ? '#1a1a1a' : '#6b7280', background: active ? '#fff' : 'transparent', boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 5 }}>
              {t.label}
              {t.badge !== undefined && t.badge > 0 && (
                <span style={{ fontSize: 10, padding: '0 5px', borderRadius: 8, background: t.badgeColor || '#dc2626', color: '#fff', fontWeight: 700 }}>{t.badge}</span>
              )}
            </div>
          );
        })}
      </div>

      {tab === 'events'   && <EventsTab />}
      {tab === 'baseline' && <BaselineTab />}
      {tab === 'rules'    && <RulesTab />}
      {tab === 'history'  && <HistoryTab />}
    </div>
  );
};

export default AlertCenter;
