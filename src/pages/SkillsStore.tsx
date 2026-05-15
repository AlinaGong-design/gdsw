import React, { useState, useEffect } from 'react';
import {
  AppstoreOutlined, CheckCircleOutlined,
  DeleteOutlined, DownloadOutlined, ExclamationCircleOutlined,
  FilterOutlined, PlusOutlined, SafetyCertificateOutlined,
  SearchOutlined, SyncOutlined,
  ThunderboltOutlined, ToolOutlined, UserOutlined, WarningOutlined,
  ClockCircleOutlined, SendOutlined,
} from '@ant-design/icons';
import { approvalStore } from '../store/approvalStore';

// ─── Types ────────────────────────────────────────────────────────────────────

type SkillStatus = 'dev' | 'review' | 'published' | 'archived';
type SkillTier = 'free' | 'restricted' | 'secret';
type SkillCategory = '文档处理' | '数据分析' | '通信集成' | '法务合规' | '人力资源' | '安全审计' | '代码工具' | '搜索检索';

export interface Skill {
  id: string;
  name: string;
  desc: string;
  category: SkillCategory;
  status: SkillStatus;
  tier: SkillTier;             // free=无需审批 restricted=需审批 secret=涉密
  version: string;
  author: string;
  protocol: string;            // MCP / REST / gRPC
  mountCount: number;          // 已挂载数字员工数
  callCount7d: number;
  lastUpdated: string;
  tags: string[];
  inputs: string[];
  outputs: string[];
  dependencies: string[];
}

interface MountRecord {
  skillId: string;
  employeeId: string;
  employeeName: string;
  dept: string;
  mountedAt: string;
  mountedBy: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

export const MOCK_SKILLS: Skill[] = [
  {
    id: 'sk-001', name: 'PDF 文档解析', category: '文档处理',
    desc: '支持 PDF、Word、Excel 文件解析，提取结构化文本、表格与图片内容，输出标准 JSON 格式',
    status: 'published', tier: 'free', version: 'v2.3.1', author: '平台团队',
    protocol: 'MCP', mountCount: 23, callCount7d: 4821, lastUpdated: '2026-04-10',
    tags: ['文档', 'OCR', '解析'], inputs: ['file_url', 'file_type'], outputs: ['text', 'tables', 'metadata'],
    dependencies: ['ocr-engine', 'pdf-lib'],
  },
  {
    id: 'sk-002', name: '法律法规检索', category: '法务合规',
    desc: '接入国家法规数据库，支持全文检索、条款匹配与合规性判断，返回相关法条及风险等级',
    status: 'published', tier: 'restricted', version: 'v1.5.0', author: '法务部',
    protocol: 'MCP', mountCount: 8, callCount7d: 1203, lastUpdated: '2026-03-28',
    tags: ['法规', '合规', '检索'], inputs: ['query', 'domain', 'jurisdiction'], outputs: ['articles', 'risk_level', 'references'],
    dependencies: ['law-db-connector'],
  },
  {
    id: 'sk-003', name: '飞书消息推送', category: '通信集成',
    desc: '向飞书群组或个人推送富文本消息、卡片消息，支持 @成员、附件发送',
    status: 'published', tier: 'free', version: 'v3.0.2', author: '平台团队',
    protocol: 'REST', mountCount: 31, callCount7d: 9342, lastUpdated: '2026-04-08',
    tags: ['飞书', '消息', '通知'], inputs: ['chat_id', 'message_type', 'content'], outputs: ['message_id', 'status'],
    dependencies: ['feishu-sdk'],
  },
  {
    id: 'sk-004', name: '合同风险识别', category: '法务合规',
    desc: '基于大模型对合同条款进行逐段风险评估，识别违约责任、数据归属、知识产权等高风险条款',
    status: 'published', tier: 'secret', version: 'v1.2.0', author: '法务部 × AI 中台',
    protocol: 'MCP', mountCount: 4, callCount7d: 328, lastUpdated: '2026-04-01',
    tags: ['合同', '风险', 'NLP'], inputs: ['contract_text', 'contract_type'], outputs: ['risk_clauses', 'risk_score', 'suggestions'],
    dependencies: ['sk-001', 'sk-002', 'llm-judge'],
  },
  {
    id: 'sk-005', name: '网络实时搜索', category: '搜索检索',
    desc: '接入 Bing / 博查等搜索引擎，支持实时网页检索、摘要提取，适用于需要获取最新信息的场景',
    status: 'published', tier: 'free', version: 'v2.0.0', author: '平台团队',
    protocol: 'MCP', mountCount: 18, callCount7d: 6720, lastUpdated: '2026-04-12',
    tags: ['搜索', '实时', 'Web'], inputs: ['query', 'language', 'max_results'], outputs: ['results', 'snippets'],
    dependencies: ['search-proxy'],
  },
  {
    id: 'sk-006', name: '简历智能解析', category: '人力资源',
    desc: '解析 PDF / Word 格式简历，提取姓名、教育经历、工作经历、技能标签等结构化信息',
    status: 'published', tier: 'restricted', version: 'v1.1.0', author: '人力资源部',
    protocol: 'MCP', mountCount: 6, callCount7d: 892, lastUpdated: '2026-03-20',
    tags: ['HR', '简历', '结构化'], inputs: ['resume_url', 'fields'], outputs: ['profile', 'skills', 'experience'],
    dependencies: ['sk-001'],
  },
  {
    id: 'sk-007', name: '代码安全扫描', category: '代码工具',
    desc: '静态代码分析，检测 OWASP Top 10 漏洞、敏感信息泄露、SQL 注入等安全问题，输出风险报告',
    status: 'review', tier: 'restricted', version: 'v0.9.0-beta', author: '安全部',
    protocol: 'gRPC', mountCount: 0, callCount7d: 0, lastUpdated: '2026-04-15',
    tags: ['安全', '代码', 'SAST'], inputs: ['repo_url', 'branch', 'language'], outputs: ['vulnerabilities', 'severity', 'fix_suggestions'],
    dependencies: ['semgrep', 'bandit'],
  },
  {
    id: 'sk-008', name: '数据报表生成', category: '数据分析',
    desc: '基于 SQL 查询结果自动生成可视化报表（折线图、柱状图、饼图），支持导出 PDF 与飞书推送',
    status: 'published', tier: 'free', version: 'v2.1.0', author: '数据中台',
    protocol: 'REST', mountCount: 14, callCount7d: 3104, lastUpdated: '2026-03-30',
    tags: ['报表', '可视化', '数据'], inputs: ['sql', 'chart_type', 'title'], outputs: ['chart_url', 'pdf_url'],
    dependencies: ['echarts-renderer', 'db-connector'],
  },
  {
    id: 'sk-009', name: '操作日志审计', category: '安全审计',
    desc: '记录并检索数字员工的操作日志，支持按时间、员工、操作类型过滤，输出合规审计报告',
    status: 'dev', tier: 'secret', version: 'v0.1.0-wip', author: '安全部',
    protocol: 'MCP', mountCount: 0, callCount7d: 0, lastUpdated: '2026-04-18',
    tags: ['审计', '日志', '合规'], inputs: ['employee_id', 'date_range', 'action_type'], outputs: ['audit_log', 'report_pdf'],
    dependencies: ['log-aggregator'],
  },
  {
    id: 'sk-010', name: '邮件智能回复', category: '通信集成',
    desc: '读取收件箱邮件，结合员工知识库自动草拟回复草稿，人工确认后发送，支持附件处理',
    status: 'archived', tier: 'free', version: 'v1.0.3', author: '平台团队',
    protocol: 'REST', mountCount: 0, callCount7d: 0, lastUpdated: '2026-02-01',
    tags: ['邮件', '自动回复', '已归档'], inputs: ['email_id', 'context'], outputs: ['draft_reply'],
    dependencies: ['mail-sdk'],
  },
];

const MOCK_MOUNTS: MountRecord[] = [
  { skillId: 'sk-001', employeeId: 'de-001', employeeName: '法务合规助手', dept: '法务部', mountedAt: '2026-03-01', mountedBy: '管理员' },
  { skillId: 'sk-001', employeeId: 'de-009', employeeName: '合同审核助手', dept: '法务部', mountedAt: '2026-04-15', mountedBy: '张三' },
  { skillId: 'sk-001', employeeId: 'de-002', employeeName: 'HR 招聘助手', dept: '人力资源', mountedAt: '2026-03-15', mountedBy: '管理员' },
  { skillId: 'sk-003', employeeId: 'de-007', employeeName: '智能巡检助手', dept: '管道运营部', mountedAt: '2026-03-20', mountedBy: '管理员' },
  { skillId: 'sk-002', employeeId: 'de-001', employeeName: '法务合规助手', dept: '法务部', mountedAt: '2026-03-01', mountedBy: '管理员' },
];

// ─── Style Constants ───────────────────────────────────────────────────────────

const PRIMARY = '#6366F1';
const PRIMARY_LIGHT = '#f0f0ff';

const STATUS_CONFIG: Record<SkillStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  dev:      { label: '开发中', color: '#9ca3af', bg: '#f3f4f6', icon: <SyncOutlined /> },
  review:   { label: '审核中', color: '#d97706', bg: '#fffbeb', icon: <SyncOutlined spin /> },
  published:{ label: '已发布', color: '#059669', bg: '#ecfdf5', icon: <CheckCircleOutlined /> },
  archived: { label: '已归档', color: '#6b7280', bg: '#f9fafb', icon: <DeleteOutlined /> },
};

const TIER_CONFIG: Record<SkillTier, { label: string; color: string; bg: string; border: string }> = {
  free:       { label: '免审', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  restricted: { label: '需审批', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  secret:     { label: '涉密', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
};

const CATEGORIES: SkillCategory[] = ['文档处理','数据分析','通信集成','法务合规','人力资源','安全审计','代码工具','搜索检索'];

// ─── Sub-components ────────────────────────────────────────────────────────────

const TierBadge: React.FC<{ tier: SkillTier }> = ({ tier }) => {
  const cfg = TIER_CONFIG[tier];
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 10,
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
      display: 'inline-flex', alignItems: 'center', gap: 3,
    }}>
      {tier === 'secret' && <SafetyCertificateOutlined style={{ fontSize: 9 }} />}
      {tier === 'restricted' && <ExclamationCircleOutlined style={{ fontSize: 9 }} />}
      {cfg.label}
    </span>
  );
};

const StatusBadge: React.FC<{ status: SkillStatus }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 10,
      color: cfg.color, background: cfg.bg,
      display: 'inline-flex', alignItems: 'center', gap: 3,
    }}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
};

// ─── Approval Submit Modal ─────────────────────────────────────────────────────

const ApprovalSubmitModal: React.FC<{
  skill: Skill;
  selectedEmpIds: string[];
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}> = ({ skill, selectedEmpIds, onConfirm, onCancel }) => {
  const [reason, setReason] = useState('');
  const isSecret = skill.tier === 'secret';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400 }}>
      <div style={{ background: '#fff', borderRadius: 14, width: 480, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: isSecret ? '#fef2f2' : '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SafetyCertificateOutlined style={{ color: isSecret ? '#dc2626' : '#d97706', fontSize: 17 }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>提交技能挂载申请</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>
                {isSecret ? '涉密技能 · 需安全官审批' : '受限技能 · 需申请使用权限'}
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 24px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Skill + employees info */}
          <div style={{ background: '#f8f8ff', borderRadius: 10, padding: '12px 14px', border: '1px solid #e8e8f0' }}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>申请内容</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>
              「{skill.name}」→ {selectedEmpIds.length} 个数字员工
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {selectedEmpIds.map(id => {
                const emp = DIGITAL_EMPLOYEES.find(e => e.id === id);
                return emp ? (
                  <span key={id} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: PRIMARY_LIGHT, color: PRIMARY, border: `1px solid ${PRIMARY}30` }}>
                    {emp.name}
                  </span>
                ) : null;
              })}
            </div>
          </div>

          {/* Risk notice */}
          {isSecret && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <WarningOutlined style={{ color: '#dc2626', fontSize: 13, flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 11, color: '#7f1d1d', lineHeight: 1.7 }}>
                该技能为<strong>涉密级别</strong>，挂载后数字员工将可访问高算力模型及敏感数据，申请将提交安全官进行审核。
              </div>
            </div>
          )}

          {/* Reason input */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>
              申请理由 <span style={{ color: '#dc2626' }}>*</span>
            </div>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="请说明挂载该技能的业务必要性，审批人将依据此理由进行审核..."
              style={{
                width: '100%', height: 90, border: '1px solid #e5e7eb', borderRadius: 9,
                padding: '10px 12px', fontSize: 12, resize: 'none', boxSizing: 'border-box',
                outline: 'none', lineHeight: 1.7, color: '#333', fontFamily: 'inherit',
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 24px 18px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ height: 34, padding: '0 18px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13 }}>取消</button>
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim()}
            style={{
              height: 34, padding: '0 20px', borderRadius: 8, border: 'none',
              background: reason.trim() ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : '#e5e7eb',
              color: reason.trim() ? '#fff' : '#bbb', fontSize: 13, fontWeight: 600,
              cursor: reason.trim() ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <SendOutlined style={{ fontSize: 12 }} />提交申请
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Skill Detail Drawer ───────────────────────────────────────────────────────

const SkillDetailPanel: React.FC<{
  skill: Skill;
  mounts: MountRecord[];
  onClose: () => void;
  onMount: (skill: Skill) => void;
  onUnmount: (skillId: string, empId: string) => void;
  onArchive: (skillId: string) => void;
  approvedMount: boolean;   // skill_mount approved for current user
  pendingApproval: boolean; // skill_mount pending approval
  onRequestApproval: (skill: Skill) => void; // open approval modal
  isAdmin: boolean;
}> = ({ skill, mounts, onClose, onMount, onArchive, approvedMount, pendingApproval, onRequestApproval, isAdmin }) => {
  const myMounts = mounts.filter(m => m.skillId === skill.id);
  const s = STATUS_CONFIG[skill.status];

  return (
    <div style={{
      position: 'fixed', right: 0, top: 0, bottom: 0, width: 480,
      background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
      display: 'flex', flexDirection: 'column', zIndex: 200,
    }}>
      {/* Header */}
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <ToolOutlined style={{ color: '#fff', fontSize: 16 }} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>{skill.name}</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>{skill.id} · {skill.protocol} · {skill.version}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <StatusBadge status={skill.status} />
              <TierBadge tier={skill.tier} />
              <span style={{ fontSize: 10, color: '#6366F1', background: '#f0f0ff', padding: '1px 6px', borderRadius: 10 }}>
                {skill.category}
              </span>
            </div>
          </div>
          <div
            onClick={onClose}
            style={{ cursor: 'pointer', color: '#bbb', fontSize: 18, lineHeight: 1, padding: '2px 4px', flexShrink: 0 }}
          >✕</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>

        {/* Description */}
        <div style={{ padding: '16px 0 12px', borderBottom: '1px solid #f5f5f5' }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>功能描述</div>
          <div style={{ fontSize: 13, color: '#333', lineHeight: 1.7 }}>{skill.desc}</div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 16, padding: '14px 0 12px', borderBottom: '1px solid #f5f5f5' }}>
          {[
            { label: '已挂载员工', value: skill.mountCount },
            { label: '7日调用量', value: skill.callCount7d.toLocaleString() },
            { label: '开发者', value: skill.author },
          ].map(item => (
            <div key={item.label} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: PRIMARY }}>{item.value}</div>
              <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>{item.label}</div>
            </div>
          ))}
        </div>

        {/* IO Spec */}
        <div style={{ padding: '14px 0 12px', borderBottom: '1px solid #f5f5f5' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#333', marginBottom: 10 }}>接口规格</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>入参 (Inputs)</div>
              {skill.inputs.map(i => (
                <div key={i} style={{ fontSize: 11, padding: '3px 8px', background: '#f5f5f5', borderRadius: 6, marginBottom: 4, color: '#555', fontFamily: 'monospace' }}>{i}</div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>出参 (Outputs)</div>
              {skill.outputs.map(o => (
                <div key={o} style={{ fontSize: 11, padding: '3px 8px', background: '#f0f0ff', borderRadius: 6, marginBottom: 4, color: '#555', fontFamily: 'monospace' }}>{o}</div>
              ))}
            </div>
          </div>
          {skill.dependencies.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>依赖项</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {skill.dependencies.map(d => (
                  <span key={d} style={{ fontSize: 10, padding: '2px 7px', background: '#fff7ed', color: '#d97706', borderRadius: 8, border: '1px solid #fde68a' }}>{d}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mounted employees */}
        {myMounts.length > 0 && (
          <div style={{ padding: '14px 0 12px', borderBottom: '1px solid #f5f5f5' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#333', marginBottom: 10 }}>
              已挂载员工 <span style={{ color: PRIMARY, fontWeight: 700 }}>({myMounts.length})</span>
            </div>
            {myMounts.map(m => (
              <div key={m.employeeId} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '7px 10px', background: '#fafafa', borderRadius: 8, marginBottom: 6,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 7, background: PRIMARY_LIGHT,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <UserOutlined style={{ fontSize: 12, color: PRIMARY }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#1a1a1a' }}>{m.employeeName}</div>
                    <div style={{ fontSize: 10, color: '#bbb' }}>{m.dept} · 挂载于 {m.mountedAt}</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#bbb' }}>by {m.mountedBy}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tags */}
        <div style={{ padding: '14px 0 8px' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {skill.tags.map(t => (
              <span key={t} style={{ fontSize: 10, padding: '2px 8px', background: '#f0f0ff', color: PRIMARY, borderRadius: 12 }}>#{t}</span>
            ))}
          </div>
          <div style={{ fontSize: 10, color: '#bbb', marginTop: 10 }}>最后更新：{skill.lastUpdated}</div>
        </div>
      </div>

      {/* Footer Actions */}
      {skill.status === 'published' && (
        <div style={{ padding: '14px 24px', borderTop: '1px solid #f0f0f0', flexShrink: 0, display: 'flex', gap: 10 }}>
          {skill.tier === 'free' ? (
            // Free — direct mount
            <button
              onClick={() => onMount(skill)}
              style={{
                flex: 1, height: 38, borderRadius: 9, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                color: '#fff', fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <DownloadOutlined />挂载到员工
            </button>
          ) : approvedMount ? (
            // Approval passed — allow mounting
            <button
              onClick={() => onMount(skill)}
              style={{
                flex: 1, height: 38, borderRadius: 9, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #059669, #10b981)',
                color: '#fff', fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <CheckCircleOutlined />审批已通过 · 挂载到员工
            </button>
          ) : pendingApproval ? (
            // Approval pending
            <div style={{
              flex: 1, padding: '10px 14px', borderRadius: 9,
              background: '#fffbeb', border: '1px solid #fde68a',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <ClockCircleOutlined style={{ color: '#d97706', fontSize: 14, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#92400e' }}>申请已提交 · 等待审批</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>审批通过后可直接挂载，请前往「审批中心」查看进度</div>
              </div>
            </div>
          ) : (
            // Not yet applied — show apply button (+ secret badge if secret tier)
            <>
              <button
                onClick={() => onRequestApproval(skill)}
                style={{
                  flex: 1, height: 44, borderRadius: 10,
                  border: '1.5px solid #d97706',
                  background: '#fffbeb', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  color: '#d97706',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <SendOutlined style={{ fontSize: 13 }} />申请使用权限
              </button>
              {skill.tier === 'secret' && (
                <div style={{
                  flex: 1, height: 44, borderRadius: 10,
                  border: '1.5px solid #fecaca',
                  background: '#fef2f2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  <SafetyCertificateOutlined style={{ color: '#dc2626', fontSize: 13 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#dc2626' }}>涉密 — 需安全官审批</span>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {skill.status === 'published' && skill.tier === 'free' && isAdmin && (
        <div style={{ padding: '0 24px 14px', flexShrink: 0 }}>
          <button
            onClick={() => onArchive(skill.id)}
            style={{
              width: '100%', height: 32, borderRadius: 8, border: '1px solid #fecaca', cursor: 'pointer',
              background: 'transparent', color: '#dc2626', fontSize: 12,
            }}
          >
            <WarningOutlined style={{ marginRight: 4 }} />下架（强制归档）
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Mount Modal ───────────────────────────────────────────────────────────────

const DIGITAL_EMPLOYEES = [
  { id: 'de-001', name: '法务合规助手', dept: '法务部' },
  { id: 'de-002', name: 'HR 招聘助手', dept: '人力资源' },
  { id: 'de-006', name: '运营数据助手', dept: '运营部' },
  { id: 'de-007', name: '智能巡检助手', dept: '管道运营部' },
  { id: 'de-008', name: '智能巡检demo', dept: '管道运营部' },
  { id: 'de-009', name: '合同审核助手', dept: '法务部' },
];

const MountModal: React.FC<{
  skill: Skill;
  onConfirm: (empIds: string[]) => void;
  onCancel: () => void;
}> = ({ skill, onConfirm, onCancel }) => {
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300,
    }}>
      <div style={{ background: '#fff', borderRadius: 14, width: 420, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>挂载技能</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
            将「{skill.name}」挂载到指定数字员工
          </div>
        </div>
        <div style={{ padding: '16px 24px', maxHeight: 300, overflowY: 'auto' }}>
          {DIGITAL_EMPLOYEES.map(emp => {
            const active = selected.includes(emp.id);
            return (
              <div
                key={emp.id}
                onClick={() => toggle(emp.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                  borderRadius: 8, marginBottom: 6, cursor: 'pointer',
                  background: active ? PRIMARY_LIGHT : '#fafafa',
                  border: `1.5px solid ${active ? PRIMARY : 'transparent'}`,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                  border: `2px solid ${active ? PRIMARY : '#d1d5db'}`,
                  background: active ? PRIMARY : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {active && <span style={{ color: '#fff', fontSize: 11, lineHeight: 1 }}>✓</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{emp.name}</div>
                  <div style={{ fontSize: 10, color: '#bbb' }}>{emp.dept} · {emp.id}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ height: 34, padding: '0 18px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13 }}>取消</button>
          <button
            onClick={() => selected.length > 0 && onConfirm(selected)}
            disabled={selected.length === 0}
            style={{
              height: 34, padding: '0 18px', borderRadius: 8, border: 'none', cursor: selected.length > 0 ? 'pointer' : 'not-allowed',
              background: selected.length > 0 ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : '#e5e7eb',
              color: selected.length > 0 ? '#fff' : '#bbb', fontSize: 13, fontWeight: 600,
            }}
          >
            确认挂载 {selected.length > 0 ? `(${selected.length})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Archive Warning Modal ─────────────────────────────────────────────────────

const ArchiveModal: React.FC<{
  skill: Skill;
  mounts: MountRecord[];
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ skill, mounts, onConfirm, onCancel }) => {
  const myMounts = mounts.filter(m => m.skillId === skill.id);
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300,
    }}>
      <div style={{ background: '#fff', borderRadius: 14, width: 440, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <WarningOutlined style={{ color: '#dc2626', fontSize: 20 }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>确认下架技能</div>
          </div>
        </div>
        <div style={{ padding: '16px 24px' }}>
          {myMounts.length > 0 ? (
            <>
              <div style={{ padding: '12px 14px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca', marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#dc2626', marginBottom: 6 }}>
                  ⚠️ 下架前请注意：{myMounts.length} 个员工正在使用此技能
                </div>
                <div style={{ fontSize: 11, color: '#7f1d1d', lineHeight: 1.6 }}>
                  下架后这些员工将自动解绑该技能。系统将发送通知至相关 Owner，请提前协调好迁移方案。
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>受影响员工清单：</div>
                {myMounts.map(m => (
                  <div key={m.employeeId} style={{
                    fontSize: 12, padding: '6px 10px', background: '#fff7ed', borderRadius: 6, marginBottom: 4,
                    color: '#92400e', display: 'flex', justifyContent: 'space-between',
                  }}>
                    <span>{m.employeeName}</span>
                    <span style={{ color: '#bbb' }}>{m.dept}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 13, color: '#555', padding: '8px 0', lineHeight: 1.7 }}>
              「{skill.name}」当前没有员工挂载，可以安全下架归档。此操作<strong>不可逆</strong>，下架后技能进入归档状态，无法再被挂载。
            </div>
          )}
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ height: 34, padding: '0 18px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13 }}>取消</button>
          <button onClick={onConfirm} style={{ height: 34, padding: '0 18px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 600 }}>
            确认下架
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── HR Linkage Panel ──────────────────────────────────────────────────────────

const HR_EVENTS = [
  { id: 'hr-001', type: 'transfer', employee: '王晓明', from: '法务部', to: '市场部', date: '2026-04-20', status: 'processing', affectedEmp: '法务合规助手', skills: 2, kb: 1 },
  { id: 'hr-002', type: 'leave', employee: '赵云飞', dept: '技术部', date: '2026-04-18', status: 'done', affectedEmp: '代码审查助手', skills: 3, kb: 2 },
  { id: 'hr-003', type: 'transfer', employee: '李梅', from: '运营部', to: '产品部', date: '2026-04-15', status: 'done', affectedEmp: '运营数据助手', skills: 1, kb: 0 },
];

const HRLinkagePanel: React.FC = () => {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>HR 系统联动事件</div>
        <span style={{ fontSize: 11, color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: 10 }}>
          订阅：调岗 / 离职 事件流
        </span>
      </div>

      {/* Process steps explanation */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
        {[
          { title: '调岗处理流程', color: '#d97706', bg: '#fffbeb', border: '#fde68a',
            steps: ['① 冻结个人龙虾实例', '② 卸载原岗位专属 Skills', '③ 回收原部门知识库权限', '④ 更新基础身份信息', '⑤ 解冻并恢复运行'] },
          { title: '离职处理流程', color: '#dc2626', bg: '#fef2f2', border: '#fecaca',
            steps: ['① 立即停用实例（不可恢复）', '② 私有知识库按策略转交/销毁', '③ Skills 绑定解除并回收配额', '④ 算力配额释放', '⑤ 会话记录归档封存'] },
        ].map(item => (
          <div key={item.title} style={{ background: item.bg, border: `1px solid ${item.border}`, borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: item.color, marginBottom: 10 }}>{item.title}</div>
            {item.steps.map((s, i) => (
              <div key={i} style={{ fontSize: 11, color: '#555', lineHeight: 1.8, display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                <span>{s}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Events list */}
      <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 12 }}>近期联动事件</div>
      {HR_EVENTS.map(evt => {
        const isTransfer = evt.type === 'transfer';
        const done = evt.status === 'done';
        return (
          <div key={evt.id} style={{
            background: '#fff', borderRadius: 12, border: '1px solid #e8e8f0',
            padding: '14px 18px', marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: isTransfer ? '#fffbeb' : '#fef2f2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 16 }}>{isTransfer ? '🔄' : '🚪'}</span>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
                    {isTransfer ? `员工调岗：${evt.employee}（${(evt as any).from} → ${(evt as any).to}）` : `员工离职：${evt.employee}（${(evt as any).dept}）`}
                  </div>
                  <div style={{ fontSize: 10, color: '#bbb' }}>HR 事件 · {evt.date} · {evt.id}</div>
                </div>
              </div>
              <span style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600,
                color: done ? '#059669' : '#d97706', background: done ? '#ecfdf5' : '#fffbeb',
              }}>
                {done ? '处理完成' : '处理中...'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { icon: '🤖', label: '关联数字员工', value: evt.affectedEmp },
                { icon: '🔧', label: '受影响 Skills', value: `${evt.skills} 个` },
                { icon: '📚', label: '知识库变更', value: `${evt.kb} 个` },
              ].map(item => (
                <div key={item.label} style={{ flex: 1, background: '#fafafa', borderRadius: 8, padding: '7px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#333', fontWeight: 500 }}>{item.icon} {item.value}</div>
                  <div style={{ fontSize: 10, color: '#bbb', marginTop: 2 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Main SkillsStore Page ─────────────────────────────────────────────────────

type TabKey = 'store' | 'hr';

const SkillsStore: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('store');
  const [skills, setSkills] = useState<Skill[]>(MOCK_SKILLS);
  const [mounts, setMounts] = useState<MountRecord[]>(MOCK_MOUNTS);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<SkillCategory | '全部'>('全部');
  const [statusFilter, setStatusFilter] = useState<SkillStatus | '全部'>('全部');
  const [tierFilter, setTierFilter] = useState<SkillTier | '全部'>('全部');
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [mountModal, setMountModal] = useState<Skill | null>(null);
  const [archiveModal, setArchiveModal] = useState<Skill | null>(null);
  const [toast, setToast] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Publish new skill state
  const [publishSkillOpen, setPublishSkillOpen] = useState(false);
  const [publishSkillName, setPublishSkillName] = useState('');
  const [publishSkillReason, setPublishSkillReason] = useState('');

  // Approval flow state
  const [approvalModal, setApprovalModal] = useState<{ skill: Skill; empIds: string[] } | null>(null);
  const [pendingMountSkillIds, setPendingMountSkillIds] = useState<Set<string>>(new Set());
  const [approvedMountSkillIds, setApprovedMountSkillIds] = useState<Set<string>>(new Set());

  // Subscribe to approvalStore changes
  useEffect(() => {
    const refresh = () => {
      // Removed skill_mount approval support
      setPendingMountSkillIds(new Set());
      setApprovedMountSkillIds(new Set());
    };
    refresh();
    return approvalStore.subscribe(refresh);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2800);
  };

  const handlePublishSkillSubmit = () => {
    if (!publishSkillName.trim() || !publishSkillReason.trim()) return;
    // Skill publishing approval removed - skills module deprecated
    setPublishSkillOpen(false);
    setPublishSkillName('');
    setPublishSkillReason('');
    showToast('📋 技能发布功能已下线');
  };

  // Open employee selector first, then approval form (for restricted/secret)
  const handleRequestApproval = (skill: Skill) => {
    // Reuse MountModal to pick employees, then open approval form
    setApprovalModal({ skill, empIds: [] });
  };

  const handleApprovalSubmit = (reason: string) => {
    if (!approvalModal) return;
    // Skill mount approval removed - skills module deprecated
    setApprovalModal(null);
    setSelectedSkill(null);
    showToast(`📋 技能挂载功能已下线`);
  };

  const filtered = skills.filter(s => {
    if (search && !s.name.includes(search) && !s.desc.includes(search) && !s.tags.some(t => t.includes(search))) return false;
    if (catFilter !== '全部' && s.category !== catFilter) return false;
    if (statusFilter !== '全部' && s.status !== statusFilter) return false;
    if (tierFilter !== '全部' && s.tier !== tierFilter) return false;
    return true;
  });

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'store', label: '技能商店' },
    { key: 'hr', label: 'HR 联动' },
  ];

  const handleMountConfirm = (empIds: string[]) => {
    if (!mountModal) return;
    const now = new Date().toISOString().slice(0, 10);
    const newMounts = empIds.map(empId => ({
      skillId: mountModal.id,
      employeeId: empId,
      employeeName: DIGITAL_EMPLOYEES.find(e => e.id === empId)?.name || empId,
      dept: DIGITAL_EMPLOYEES.find(e => e.id === empId)?.dept || '',
      mountedAt: now, mountedBy: '当前用户',
    }));
    setMounts(prev => [...prev, ...newMounts]);
    setSkills(prev => prev.map(s => s.id === mountModal.id ? { ...s, mountCount: s.mountCount + empIds.length } : s));
    setMountModal(null);
    setSelectedSkill(null);
    showToast(`✅ 已成功将「${mountModal.name}」挂载到 ${empIds.length} 个员工`);
  };

  const handleArchiveConfirm = () => {
    if (!archiveModal) return;
    setSkills(prev => prev.map(s => s.id === archiveModal.id ? { ...s, status: 'archived', mountCount: 0 } : s));
    setMounts(prev => prev.filter(m => m.skillId !== archiveModal.id));
    setArchiveModal(null);
    setSelectedSkill(null);
    showToast(`⬇️ 技能「${archiveModal.name}」已下架归档，相关员工已收到解绑通知`);
  };

  return (
    <div style={{ position: 'relative', minHeight: 0 }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          background: '#1a1a1a', color: '#fff', padding: '10px 20px', borderRadius: 10,
          fontSize: 13, zIndex: 400, boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          animation: 'fadeIn 0.2s ease',
        }}>
          {toast}
        </div>
      )}

      {/* Page Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <AppstoreOutlined style={{ color: '#fff', fontSize: 15 }} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', lineHeight: 1.2 }}>技能商店</div>
                <div style={{ fontSize: 11, color: '#bbb', lineHeight: 1.3 }}>企业 Skills 资产库 · 装配 · 挂载管理</div>
              </div>
            </div>
          </div>
          <button
            onClick={() => setPublishSkillOpen(true)}
            style={{
            height: 36, padding: '0 16px', borderRadius: 9, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            color: '#fff', fontSize: 13, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <PlusOutlined />发布新技能
          </button>
          {/* 管理员模式切换（演示用） */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, background: isAdmin ? '#fef2f2' : '#f5f5f5', border: `1px solid ${isAdmin ? '#fecaca' : '#e8e8e8'}`, marginLeft: 8 }}>
            <span
              onClick={() => setIsAdmin(v => !v)}
              style={{ width: 28, height: 16, borderRadius: 8, background: isAdmin ? '#dc2626' : '#d1d5db', display: 'inline-flex', alignItems: 'center', cursor: 'pointer', padding: '0 2px', boxSizing: 'border-box', transition: 'background 0.2s', flexShrink: 0 }}
            >
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#fff', display: 'block', marginLeft: isAdmin ? 12 : 0, transition: 'margin-left 0.2s' }} />
            </span>
            <span style={{ fontSize: 12, color: isAdmin ? '#dc2626' : '#888', fontWeight: isAdmin ? 600 : 400, userSelect: 'none' }}>{isAdmin ? '管理员模式' : '普通用户'}</span>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {[
          { label: '技能总数', value: skills.length, color: PRIMARY },
          { label: '已发布', value: skills.filter(s => s.status === 'published').length, color: '#059669' },
          { label: '7日总调用', value: skills.reduce((a, s) => a + s.callCount7d, 0).toLocaleString(), color: '#7c3aed' },
        ].map(item => (
          <div key={item.label} style={{
            flex: 1, background: '#fff', borderRadius: 10, padding: '12px 16px',
            border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: item.color }}>{item.value}</div>
            <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: 20,
        background: '#f3f4f6', borderRadius: 10, padding: 4,
        alignSelf: 'flex-start', width: 'fit-content',
      }}>
        {TABS.map(t => {
          const active = tab === t.key;
          return (
            <div
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '7px 16px', borderRadius: 7, cursor: 'pointer', fontSize: 13,
                fontWeight: active ? 600 : 400, color: active ? '#1a1a1a' : '#6b7280',
                background: active ? '#fff' : 'transparent',
                boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {t.label}
            </div>
          );
        })}
      </div>

      {/* ── Tab: Store ── */}
      {tab === 'store' && (
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '0 0 220px' }}>
              <SearchOutlined style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#bbb', fontSize: 13 }} />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="搜索技能名称、标签..."
                style={{ width: '100%', height: 34, border: '1px solid #e5e7eb', borderRadius: 8, padding: '0 10px 0 30px', fontSize: 12, outline: 'none', boxSizing: 'border-box', color: '#333' }}
              />
            </div>
            {/* Category */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(['全部', ...CATEGORIES] as const).map(c => (
                <div
                  key={c} onClick={() => setCatFilter(c as any)}
                  style={{
                    padding: '4px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 500,
                    background: catFilter === c ? PRIMARY_LIGHT : '#f3f4f6',
                    color: catFilter === c ? PRIMARY : '#6b7280',
                    border: `1px solid ${catFilter === c ? PRIMARY : 'transparent'}`,
                    transition: 'all 0.15s',
                  }}
                >{c}</div>
              ))}
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <select
                value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
                style={{ height: 34, border: '1px solid #e5e7eb', borderRadius: 8, padding: '0 10px', fontSize: 12, color: '#555', background: '#fff' }}
              >
                <option value="全部">全部状态</option>
                <option value="published">已发布</option>
                <option value="review">审核中</option>
                <option value="dev">开发中</option>
                <option value="archived">已归档</option>
              </select>
              <select
                value={tierFilter} onChange={e => setTierFilter(e.target.value as any)}
                style={{ height: 34, border: '1px solid #e5e7eb', borderRadius: 8, padding: '0 10px', fontSize: 12, color: '#555', background: '#fff' }}
              >
                <option value="全部">全部权限</option>
                <option value="free">免审</option>
                <option value="restricted">需审批</option>
                <option value="secret">涉密</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {filtered.map(skill => {
              const s = STATUS_CONFIG[skill.status];
              const t = TIER_CONFIG[skill.tier];
              return (
                <div
                  key={skill.id}
                  onClick={() => setSelectedSkill(skill)}
                  style={{
                    background: '#fff', borderRadius: 12, border: '1px solid #e8e8f0',
                    padding: '16px 18px', cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    transition: 'all 0.18s',
                    opacity: skill.status === 'archived' ? 0.6 : 1,
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 24px rgba(99,102,241,0.12)';
                    (e.currentTarget as HTMLDivElement).style.borderColor = PRIMARY;
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                    (e.currentTarget as HTMLDivElement).style.borderColor = '#e8e8f0';
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  }}
                >
                  {/* Card Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                        background: skill.status === 'archived' ? '#f3f4f6' : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <ToolOutlined style={{ color: skill.status === 'archived' ? '#9ca3af' : '#fff', fontSize: 16 }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.3 }}>{skill.name}</div>
                        <div style={{ fontSize: 10, color: '#bbb' }}>{skill.protocol} · {skill.version}</div>
                      </div>
                    </div>
                    <StatusBadge status={skill.status} />
                  </div>

                  {/* Desc */}
                  <div style={{ fontSize: 11, color: '#666', lineHeight: 1.6, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {skill.desc}
                  </div>

                  {/* Badges */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                    <TierBadge tier={skill.tier} />
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: '#f0f0ff', color: PRIMARY }}>{skill.category}</span>
                  </div>

                  {/* Footer */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#bbb' }}>
                      <ThunderboltOutlined style={{ marginRight: 3 }} />{skill.mountCount} 个员工挂载
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#bbb', fontSize: 13 }}>
              <FilterOutlined style={{ fontSize: 28, display: 'block', marginBottom: 10 }} />
              没有符合条件的技能
            </div>
          )}
        </div>
      )}

      {/* ── Tab: HR ── */}
      {tab === 'hr' && <HRLinkagePanel />}

      {/* ── Detail Panel ── */}
      {selectedSkill && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 199 }}
            onClick={() => setSelectedSkill(null)}
          />
          <SkillDetailPanel
            skill={selectedSkill}
            mounts={mounts}
            onClose={() => setSelectedSkill(null)}
            onMount={s => { setMountModal(s); }}
            onUnmount={() => {}}
            onArchive={id => {
              const s = skills.find(sk => sk.id === id);
              if (s) setArchiveModal(s);
            }}
            approvedMount={approvedMountSkillIds.has(selectedSkill.id)}
            pendingApproval={pendingMountSkillIds.has(selectedSkill.id)}
            onRequestApproval={skill => {
              // For restricted/secret, first pick employees, then show approval form
              setApprovalModal({ skill, empIds: [] });
              setSelectedSkill(null);
            }}
            isAdmin={isAdmin}
          />
        </>
      )}

      {/* ── Mount Modal ── */}
      {mountModal && (
        <MountModal skill={mountModal} onConfirm={handleMountConfirm} onCancel={() => setMountModal(null)} />
      )}

      {/* ── Archive Modal ── */}
      {archiveModal && (
        <ArchiveModal skill={archiveModal} mounts={mounts} onConfirm={handleArchiveConfirm} onCancel={() => setArchiveModal(null)} />
      )}

      {/* ── Approval Flow: Step 1 pick employees ── */}
      {approvalModal && approvalModal.empIds.length === 0 && (
        <MountModal
          skill={approvalModal.skill}
          onConfirm={empIds => setApprovalModal({ ...approvalModal, empIds })}
          onCancel={() => setApprovalModal(null)}
        />
      )}

      {/* ── Approval Flow: Step 2 fill reason ── */}
      {approvalModal && approvalModal.empIds.length > 0 && (
        <ApprovalSubmitModal
          skill={approvalModal.skill}
          selectedEmpIds={approvalModal.empIds}
          onConfirm={handleApprovalSubmit}
          onCancel={() => setApprovalModal(null)}
        />
      )}
      {/* ── Publish Skill Approval Modal ── */}
      {publishSkillOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400 }}>
          <div style={{ background: '#fff', borderRadius: 14, width: 480, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#e8e7ff,#d4d3ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PlusOutlined style={{ color: '#6366F1', fontSize: 16 }} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>申请发布新技能</div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>提交后将进入「审批中心」等待管理员审批</div>
                </div>
              </div>
            </div>
            <div style={{ padding: '16px 24px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>技能名称 <span style={{ color: '#dc2626' }}>*</span></div>
                <input
                  value={publishSkillName}
                  onChange={e => setPublishSkillName(e.target.value)}
                  placeholder="如：合同关键词提取、简历解析..."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', color: '#1a1a1a', boxSizing: 'border-box' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#6366F1')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
                />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>发布理由 <span style={{ color: '#dc2626' }}>*</span></div>
                <textarea
                  value={publishSkillReason}
                  onChange={e => setPublishSkillReason(e.target.value)}
                  placeholder="请说明该技能的业务场景、适用范围及预期效果..."
                  rows={4}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', color: '#1a1a1a', resize: 'none', lineHeight: 1.6, boxSizing: 'border-box', fontFamily: 'inherit' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#6366F1')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
                />
              </div>
            </div>
            <div style={{ padding: '14px 24px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => { setPublishSkillOpen(false); setPublishSkillName(''); setPublishSkillReason(''); }}
                style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}
              >取消</button>
              <button
                onClick={handlePublishSkillSubmit}
                disabled={!publishSkillName.trim() || !publishSkillReason.trim()}
                style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: (publishSkillName.trim() && publishSkillReason.trim()) ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : '#e5e7eb', color: (publishSkillName.trim() && publishSkillReason.trim()) ? '#fff' : '#9ca3af', fontSize: 13, cursor: (publishSkillName.trim() && publishSkillReason.trim()) ? 'pointer' : 'not-allowed', fontWeight: 600 }}
              >提交申请</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillsStore;
