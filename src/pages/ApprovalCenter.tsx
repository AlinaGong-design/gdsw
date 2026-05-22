import React, { useState, useEffect } from 'react';
import {
  CheckCircleOutlined, ClockCircleOutlined,
  UserOutlined, TeamOutlined, WarningOutlined,
  CloseCircleOutlined, SearchOutlined, FileTextOutlined,
} from '@ant-design/icons';
import { approvalStore, ApprovalItem, ApprovalStatus } from '../store/approvalStore';
import { employeeStore } from '../store/employeeStore';

// ─── Constants ─────────────────────────────────────────────────────────────────
const PRIMARY       = '#6366F1';
const PRIMARY_LIGHT = '#f0f0ff';
const CURRENT_USER  = '张三';
const CURRENT_ROLE  = '员工管理员';
const CURRENT_DEPT  = '综合部';

// ─── Mock Data ──────────────────────────────────────────────────────────────────

// 我的申请（当前用户提交）
const MOCK_MINE: ApprovalItem[] = [
  {
    id: 'ap-001', type: 'employee_publish',
    title: '数字员工上岗：公文处理专员 v1.0.0',
    requester: '张三', requesterRole: '员工管理员', dept: '综合部',
    reason: '已完成7项配置，调试验证通过，开场白、Prompt、知识库均已确认，申请正式上岗并全公司可见',
    status: 'pending', createdAt: '2026-04-22 09:00',
    riskLevel: 'low',
    meta: { '版本': 'v1.0.0', '可见范围': '全公司', '业务域': '综合管理域' },
  },
  {
    id: 'ap-003', type: 'employee_publish',
    title: '数字员工上岗：合同审查助手 v1.2.0',
    requester: '张三', requesterRole: '员工管理员', dept: '综合部',
    reason: '新增合同条款智能比对功能，已完成测试并通过法务确认，申请正式上岗',
    status: 'approved', createdAt: '2026-04-15 10:30',
    reviewedAt: '2026-04-15 16:45', reviewer: '安全官 陈主任',
    riskLevel: 'low',
    meta: { '版本': 'v1.2.0', '可见范围': '全公司', '业务域': '法务域' },
  },
  {
    id: 'ap-004', type: 'employee_publish',
    title: '数字员工上岗：会议纪要助手 v0.8.0',
    requester: '张三', requesterRole: '员工管理员', dept: '综合部',
    reason: '申请发布会议纪要自动生成工具至全公司使用',
    status: 'rejected', createdAt: '2026-04-10 14:00',
    reviewedAt: '2026-04-11 09:20', reviewer: '安全官 陈主任',
    rejectReason: '该版本尚未完成数据脱敏功能，请补充数据安全评估后重新申请',
    riskLevel: 'medium',
    meta: { '版本': 'v0.8.0', '可见范围': '全公司', '业务域': '综合管理域' },
  },
];

// 待审批（其他人提交，需管理员处理）
const MOCK_PENDING_OTHERS: ApprovalItem[] = [
  {
    id: 'ap-010', type: 'employee_publish',
    title: '数字员工上岗：安全生产预警 v3.0.0',
    requester: '王五', requesterRole: '员工管理员', dept: '安全生产部',
    reason: '升级预警算法，支持多源数据融合分析，申请全公司上岗',
    status: 'pending', createdAt: '2026-04-22 11:15',
    riskLevel: 'high',
    riskNote: '该数字员工涉及安全生产预警，数据敏感性高，建议重点审查数据访问权限边界',
    meta: { '版本': 'v3.0.0', '可见范围': '全公司', '业务域': '安全生产域' },
  },
  {
    id: 'ap-008', type: 'employee_publish',
    title: '数字员工上岗：财务报表助手 v2.0.0',
    requester: '赵六', requesterRole: '员工管理员', dept: '财务部',
    reason: '新增自动化报表生成功能，已在测试环境运行2周，申请正式上岗并全公司可见',
    status: 'pending', createdAt: '2026-04-21 14:30',
    riskLevel: 'medium',
    meta: { '版本': 'v2.0.0', '可见范围': '全公司', '业务域': '财务域' },
  },
  {
    id: 'ap-005', type: 'employee_publish',
    title: '数字员工上岗：HR 面试助手 v0.9.0',
    requester: '孙七', requesterRole: '员工管理员', dept: '人力资源',
    reason: '测试阶段已覆盖主要面试场景，申请发布至部门内可见',
    status: 'approved', createdAt: '2026-04-20 14:00',
    reviewedAt: '2026-04-20 18:22', reviewer: '安全官 陈主任',
    riskLevel: 'low',
    meta: { '版本': 'v0.9.0', '可见范围': '仅部门', '业务域': '人力域' },
  },
  {
    id: 'ap-009', type: 'employee_publish',
    title: '数字员工上岗：智能巡检助手 v1.1.0',
    requester: '李四', requesterRole: '员工管理员', dept: '管道运营部',
    reason: '优化管道巡检预警算法，提升识别准确率15%，申请正式上岗',
    status: 'approved', createdAt: '2026-04-19 11:00',
    reviewedAt: '2026-04-19 15:45', reviewer: '安全官 陈主任',
    riskLevel: 'low',
    meta: { '版本': 'v1.1.0', '可见范围': '部门内', '业务域': '管道安全域' },
  },
  {
    id: 'ap-011', type: 'employee_publish',
    title: '数字员工上岗：采购询价助手 v1.0.0',
    requester: '陈八', requesterRole: '员工管理员', dept: '采购部',
    reason: '整合供应商报价数据，支持多轮比价，申请上岗全公司可见',
    status: 'rejected', createdAt: '2026-04-18 09:30',
    reviewedAt: '2026-04-18 15:00', reviewer: '安全官 陈主任',
    rejectReason: '系统权限范围过宽，请收窄至采购部门可见，并补充数据访问说明',
    riskLevel: 'medium',
    meta: { '版本': 'v1.0.0', '可见范围': '全公司', '业务域': '采购域' },
  },
];

const ALL_MOCK: ApprovalItem[] = [...MOCK_MINE, ...MOCK_PENDING_OTHERS];

// ─── Style Configs ──────────────────────────────────────────────────────────────
const RISK_CONFIG: Record<'high' | 'medium' | 'low', { label: string; color: string; bg: string; border: string }> = {
  high:   { label: '高风险', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  medium: { label: '中风险', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  low:    { label: '低风险', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
};

const STATUS_CONFIG: Record<ApprovalStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending:  { label: '审批中', color: '#d97706', bg: '#fffbeb', icon: <ClockCircleOutlined /> },
  approved: { label: '已通过', color: '#059669', bg: '#ecfdf5', icon: <CheckCircleOutlined /> },
  rejected: { label: '已驳回', color: '#dc2626', bg: '#fef2f2', icon: <CloseCircleOutlined /> },
};

// ─── RejectModal ────────────────────────────────────────────────────────────────
const RejectModal: React.FC<{
  item: ApprovalItem;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}> = ({ item, onConfirm, onCancel }) => {
  const [reason, setReason] = useState('');
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
      <div style={{ background: '#fff', borderRadius: 14, width: 440, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>驳回申请</div>
          <div style={{ fontSize: 12, color: '#888' }}>「{item.title}」</div>
        </div>
        <div style={{ padding: '16px 22px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 8 }}>驳回原因 <span style={{ color: '#dc2626' }}>*</span></div>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="请说明驳回原因，申请人将收到通知并可修改后重新申请..."
            style={{ width: '100%', height: 90, border: '1px solid #e5e7eb', borderRadius: 8, padding: '9px 12px', fontSize: 12, resize: 'none', boxSizing: 'border-box', outline: 'none', lineHeight: 1.7, color: '#333', fontFamily: 'inherit' }}
          />
        </div>
        <div style={{ padding: '12px 22px 16px', display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid #f0f0f0' }}>
          <button onClick={onCancel} style={{ height: 32, padding: '0 16px', border: '1px solid #e5e7eb', borderRadius: 7, background: '#fff', cursor: 'pointer', fontSize: 12, color: '#666' }}>取消</button>
          <button
            onClick={() => reason.trim() && onConfirm(reason)}
            disabled={!reason.trim()}
            style={{ height: 32, padding: '0 16px', border: 'none', borderRadius: 7, cursor: reason.trim() ? 'pointer' : 'not-allowed', background: reason.trim() ? '#dc2626' : '#e5e7eb', color: reason.trim() ? '#fff' : '#bbb', fontSize: 12, fontWeight: 600 }}
          >
            确认驳回
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── ApprovalCard ────────────────────────────────────────────────────────────────
// isMine: 是否为"我的申请"视图中的卡片（不显示审批操作按钮）
const ApprovalCard: React.FC<{
  item: ApprovalItem;
  isMine?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (item: ApprovalItem) => void;
  expanded: boolean;
  onToggle: () => void;
}> = ({ item, isMine = false, onApprove, onReject, expanded, onToggle }) => {
  const risk = item.riskLevel ? RISK_CONFIG[item.riskLevel] : null;
  const sc = STATUS_CONFIG[item.status];
  const isPending = item.status === 'pending';
  const isHighRisk = item.riskLevel === 'high';

  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      border: `1px solid ${isPending && isHighRisk ? '#fecaca' : isPending ? '#e0e7ff' : '#f0f0f0'}`,
      marginBottom: 10,
      overflow: 'hidden',
      boxShadow: isPending ? '0 2px 10px rgba(99,102,241,0.07)' : 'none',
      transition: 'box-shadow 0.15s',
    }}>
      {/* High-risk stripe */}
      {isPending && isHighRisk && (
        <div style={{ height: 3, background: 'linear-gradient(90deg, #dc2626, #f87171)' }} />
      )}

      {/* Header row */}
      <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', padding: '13px 18px', cursor: 'pointer', gap: 12 }}>
        {/* Avatar */}
        <div style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: isMine
            ? 'linear-gradient(135deg, #6366F1, #8B5CF6)'
            : 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700,
          color: isMine ? '#fff' : PRIMARY,
        }}>
          {item.requester[0]}
        </div>

        {/* Main info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 7, fontWeight: 600, color: PRIMARY, background: PRIMARY_LIGHT, border: `1px solid #c7d2fe` }}>员工上岗</span>
            {risk && (
              <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 7, fontWeight: 600, color: risk.color, background: risk.bg, border: `1px solid ${risk.border}` }}>
                {risk.label}
              </span>
            )}
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{item.title}</span>
          </div>
          <div style={{ fontSize: 11, color: '#aaa' }}>
            {item.requester}（{item.requesterRole}）· {item.dept} · {item.createdAt}
          </div>
        </div>

        {/* Status + chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{
            fontSize: 11, padding: '3px 10px', borderRadius: 9, fontWeight: 600,
            color: sc.color, background: sc.bg, whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {sc.icon}<span style={{ marginLeft: 3 }}>{sc.label}</span>
          </span>
          <span style={{ fontSize: 10, color: '#bbb', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>▼</span>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ borderTop: '1px solid #f5f5f5', padding: '14px 18px' }}>

          {/* Meta tags */}
          {item.meta && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {Object.entries(item.meta).map(([k, v]) => (
                <div key={k} style={{ padding: '4px 10px', background: '#f8f8ff', borderRadius: 7, border: '1px solid #e8e8f0' }}>
                  <span style={{ fontSize: 10, color: '#bbb' }}>{k}：</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#333' }}>{v}</span>
                </div>
              ))}
            </div>
          )}

          {/* Reason */}
          <div style={{ fontSize: 12, color: '#555', background: '#fafafa', padding: '10px 14px', borderRadius: 8, marginBottom: 12, lineHeight: 1.75 }}>
            <span style={{ color: '#aaa', fontSize: 11 }}>申请理由：</span>{item.reason}
          </div>

          {/* Risk note */}
          {item.riskNote && (
            <div style={{ fontSize: 11, color: '#92400e', background: '#fffbeb', padding: '9px 12px', borderRadius: 8, marginBottom: 12, border: '1px solid #fde68a', display: 'flex', gap: 8, alignItems: 'flex-start', lineHeight: 1.7 }}>
              <WarningOutlined style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{item.riskNote}</span>
            </div>
          )}

          {/* Reject reason */}
          {item.status === 'rejected' && item.rejectReason && (
            <div style={{ fontSize: 11, color: '#7f1d1d', background: '#fef2f2', padding: '9px 12px', borderRadius: 8, marginBottom: 12, border: '1px solid #fecaca', lineHeight: 1.7 }}>
              <div style={{ fontWeight: 700, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                <CloseCircleOutlined />驳回原因
              </div>
              <div>{item.rejectReason}</div>
            </div>
          )}

          {/* Reviewer info (done items) */}
          {item.status !== 'pending' && (
            <div style={{ fontSize: 11, color: '#bbb', display: 'flex', gap: 16, marginBottom: (!isMine) ? 0 : 0 }}>
              {item.reviewer && <span>审批人：{item.reviewer}</span>}
              {item.reviewedAt && <span>审批时间：{item.reviewedAt}</span>}
            </div>
          )}

          {/* 审批操作（仅待审批 & 非自己的申请卡片） */}
          {!isMine && isPending && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14, paddingTop: 12, borderTop: '1px solid #f5f5f5' }}>
              <button
                onClick={() => onReject && onReject(item)}
                style={{ height: 32, padding: '0 18px', border: '1px solid #fecaca', borderRadius: 8, background: '#fff', color: '#dc2626', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
              >
                驳回
              </button>
              <button
                onClick={() => onApprove && onApprove(item.id)}
                style={{ height: 32, padding: '0 22px', border: 'none', borderRadius: 8, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                批准通过
              </button>
            </div>
          )}

          {/* 我的申请 + 审批中：显示等待提示 */}
          {isMine && isPending && (
            <div style={{ fontSize: 11, color: PRIMARY, background: PRIMARY_LIGHT, padding: '9px 12px', borderRadius: 8, border: '1px solid #c7d2fe', lineHeight: 1.6, display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <ClockCircleOutlined />
              申请已提交，等待审批中，审批完成后您将收到通知
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── MyApprovals Tab ────────────────────────────────────────────────────────────
const MyApprovalsTab: React.FC<{ approvals: ApprovalItem[] }> = ({ approvals }) => {
  const [statusFilter, setStatusFilter] = useState<'all' | ApprovalStatus>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const mine = approvals.filter(a => a.requester === CURRENT_USER && a.type === 'employee_publish');

  const pendingCount  = mine.filter(a => a.status === 'pending').length;
  const approvedCount = mine.filter(a => a.status === 'approved').length;
  const rejectedCount = mine.filter(a => a.status === 'rejected').length;

  const filtered = mine.filter(a => statusFilter === 'all' || a.status === statusFilter);

  const FILTERS: { key: 'all' | ApprovalStatus; label: string; count: number }[] = [
    { key: 'all',      label: '全部',   count: mine.length },
    { key: 'pending',  label: '审批中', count: pendingCount },
    { key: 'approved', label: '已通过', count: approvedCount },
    { key: 'rejected', label: '已驳回', count: rejectedCount },
  ];

  return (
    <div>
      {/* Identity + stat strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, padding: '14px 18px', background: '#fafafe', borderRadius: 12, border: '1px solid #e0e7ff' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
          {CURRENT_USER[0]}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{CURRENT_USER}</div>
          <div style={{ fontSize: 11, color: '#888' }}>{CURRENT_ROLE} · {CURRENT_DEPT}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 24 }}>
          {[
            { label: '审批中', value: pendingCount, color: '#d97706' },
            { label: '已通过', value: approvedCount, color: '#059669' },
            { label: '已驳回', value: rejectedCount, color: '#dc2626' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: '#aaa', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {FILTERS.map(f => (
          <div
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            style={{
              padding: '5px 13px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 500,
              background: statusFilter === f.key ? PRIMARY_LIGHT : '#f3f4f6',
              color: statusFilter === f.key ? PRIMARY : '#6b7280',
              border: `1px solid ${statusFilter === f.key ? PRIMARY : 'transparent'}`,
              transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            {f.label}
            <span style={{ fontSize: 10, padding: '0 4px', borderRadius: 6, background: statusFilter === f.key ? `${PRIMARY}20` : '#e5e7eb', color: statusFilter === f.key ? PRIMARY : '#9ca3af' }}>
              {f.count}
            </span>
          </div>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#bbb' }}>
          <FileTextOutlined style={{ fontSize: 28, display: 'block', marginBottom: 10 }} />
          <div style={{ fontSize: 13 }}>暂无相关审批记录</div>
        </div>
      ) : (
        filtered.map(item => (
          <ApprovalCard
            key={item.id}
            item={item}
            isMine
            expanded={expanded === item.id}
            onToggle={() => setExpanded(expanded === item.id ? null : item.id)}
          />
        ))
      )}
    </div>
  );
};

// ─── PendingApprovals Tab ────────────────────────────────────────────────────────
const PendingApprovalsTab: React.FC<{
  approvals: ApprovalItem[];
  onApprove: (id: string) => void;
  onRejectClick: (item: ApprovalItem) => void;
}> = ({ approvals, onApprove, onRejectClick }) => {
  const [statusFilter, setStatusFilter] = useState<'all' | ApprovalStatus>('pending');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  // 全部非自己提交的申请
  const others = approvals.filter(a => a.requester !== CURRENT_USER && a.type === 'employee_publish');

  const pendingCount  = others.filter(a => a.status === 'pending').length;
  const approvedCount = others.filter(a => a.status === 'approved').length;
  const rejectedCount = others.filter(a => a.status === 'rejected').length;
  const highRiskCount = others.filter(a => a.status === 'pending' && a.riskLevel === 'high').length;

  const filtered = others.filter(a => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (search && !a.title.includes(search) && !a.requester.includes(search) && !a.dept.includes(search)) return false;
    return true;
  });

  const pendingList = filtered.filter(a => a.status === 'pending');
  const doneList    = filtered.filter(a => a.status !== 'pending');

  const FILTERS: { key: 'all' | ApprovalStatus; label: string; count: number }[] = [
    { key: 'pending',  label: '待审批', count: pendingCount },
    { key: 'all',      label: '全部',   count: others.length },
    { key: 'approved', label: '已通过', count: approvedCount },
    { key: 'rejected', label: '已驳回', count: rejectedCount },
  ];

  return (
    <div>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: '待审批', value: pendingCount, color: '#d97706', bg: '#fffbeb', icon: <ClockCircleOutlined /> },
          { label: '高风险待审', value: highRiskCount, color: '#dc2626', bg: '#fef2f2', icon: <WarningOutlined /> },
          { label: '本期已通过', value: approvedCount, color: '#059669', bg: '#ecfdf5', icon: <CheckCircleOutlined /> },
          { label: '本期已驳回', value: rejectedCount, color: '#6b7280', bg: '#f9fafb', icon: <CloseCircleOutlined /> },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 10, padding: '14px 16px', border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
            <div style={{ color: s.color, fontSize: 16, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter + search */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {FILTERS.map(f => (
            <div
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              style={{
                padding: '5px 13px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 500,
                background: statusFilter === f.key ? PRIMARY_LIGHT : '#f3f4f6',
                color: statusFilter === f.key ? PRIMARY : '#6b7280',
                border: `1px solid ${statusFilter === f.key ? PRIMARY : 'transparent'}`,
                transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              {f.label}
              <span style={{ fontSize: 10, padding: '0 4px', borderRadius: 6, background: statusFilter === f.key ? `${PRIMARY}20` : '#e5e7eb', color: statusFilter === f.key ? PRIMARY : '#9ca3af' }}>
                {f.count}
              </span>
            </div>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', position: 'relative' }}>
          <SearchOutlined style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#bbb', fontSize: 12 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索申请人、部门、名称..."
            style={{ height: 32, border: '1px solid #e5e7eb', borderRadius: 8, padding: '0 10px 0 28px', fontSize: 12, outline: 'none', color: '#333', width: 200 }}
          />
        </div>
      </div>

      {/* Pending section */}
      {pendingList.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>待审批</span>
            <span style={{ fontSize: 10, padding: '1px 8px', borderRadius: 8, background: '#fef3c7', color: '#d97706', fontWeight: 600 }}>{pendingList.length} 条</span>
            {highRiskCount > 0 && (
              <span style={{ fontSize: 10, padding: '1px 8px', borderRadius: 8, background: '#fef2f2', color: '#dc2626', fontWeight: 600 }}>
                其中 {highRiskCount} 条高风险
              </span>
            )}
          </div>
          {pendingList.map(item => (
            <ApprovalCard
              key={item.id}
              item={item}
              expanded={expanded === item.id}
              onToggle={() => setExpanded(expanded === item.id ? null : item.id)}
              onApprove={onApprove}
              onReject={onRejectClick}
            />
          ))}
        </div>
      )}

      {/* History section */}
      {doneList.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>审批历史</div>
          {doneList.map(item => (
            <ApprovalCard
              key={item.id}
              item={item}
              expanded={expanded === item.id}
              onToggle={() => setExpanded(expanded === item.id ? null : item.id)}
              onApprove={onApprove}
              onReject={onRejectClick}
            />
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#bbb' }}>
          <TeamOutlined style={{ fontSize: 28, display: 'block', marginBottom: 10 }} />
          <div style={{ fontSize: 13 }}>没有符合条件的审批记录</div>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────────
type MainTab = 'mine' | 'pending';

const ApprovalCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MainTab>('pending');
  const [approvals, setApprovals] = useState<ApprovalItem[]>(() => {
    const storeItems = approvalStore.getAll();
    return [
      ...storeItems,
      ...ALL_MOCK.filter(m => !storeItems.find(a => a.id === m.id)),
    ];
  });
  const [rejectTarget, setRejectTarget] = useState<ApprovalItem | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const refresh = () => {
      const storeItems = approvalStore.getAll();
      setApprovals([
        ...storeItems,
        ...ALL_MOCK.filter(m => !storeItems.find(a => a.id === m.id)),
      ]);
    };
    return approvalStore.subscribe(refresh);
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2800); };

  const handleApprove = (id: string) => {
    approvalStore.updateStatus(id, 'approved', '安全官 陈主任');
    const item = approvalStore.getAll().find(a => a.id === id);
    if (item?.type === 'employee_publish' && item.employeeId) {
      employeeStore.updateEmployee(item.employeeId, { status: 'published' });
    }
    showToast('✅ 审批已通过，数字员工正式上岗');
  };

  const handleReject = (id: string, reason: string) => {
    approvalStore.updateStatus(id, 'rejected', '安全官 陈主任', reason);
    setRejectTarget(null);
    showToast('已驳回申请，申请人将收到通知');
  };

  const pendingOthersCount = approvals.filter(
    a => a.requester !== CURRENT_USER && a.type === 'employee_publish' && a.status === 'pending'
  ).length;

  const myPendingCount = approvals.filter(
    a => a.requester === CURRENT_USER && a.type === 'employee_publish' && a.status === 'pending'
  ).length;

  const TABS: { key: MainTab; label: string; badge?: number; icon: React.ReactNode }[] = [
    { key: 'pending', label: '待审批',  icon: <TeamOutlined />,  badge: pendingOthersCount },
    { key: 'mine',    label: '我的申请', icon: <UserOutlined />,  badge: myPendingCount > 0 ? myPendingCount : undefined },
  ];

  return (
    <div style={{ position: 'relative' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#1a1a1a', color: '#fff', padding: '10px 22px', borderRadius: 10, fontSize: 13, zIndex: 400, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          {toast}
        </div>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <RejectModal
          item={rejectTarget}
          onConfirm={r => handleReject(rejectTarget.id, r)}
          onCancel={() => setRejectTarget(null)}
        />
      )}

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircleOutlined style={{ color: '#fff', fontSize: 15 }} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', lineHeight: 1.2 }}>审批中心</div>
            <div style={{ fontSize: 11, color: '#bbb' }}>员工上岗审批 · 查看自己的申请 & 处理他人申请</div>
          </div>
        </div>
        {pendingOthersCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 9 }}>
            <ClockCircleOutlined style={{ color: '#d97706', fontSize: 13 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#d97706' }}>{pendingOthersCount} 条申请等待您的审批</span>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #f0f0f0', paddingBottom: 0 }}>
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          return (
            <div
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 20px', cursor: 'pointer', fontSize: 13,
                fontWeight: active ? 700 : 400,
                color: active ? PRIMARY : '#6b7280',
                borderBottom: `2.5px solid ${active ? PRIMARY : 'transparent'}`,
                marginBottom: -1,
                transition: 'all 0.15s',
              }}
            >
              {tab.icon}
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10,
                  background: tab.key === 'pending' ? '#dc2626' : '#d97706',
                  color: '#fff', lineHeight: 1.4,
                }}>
                  {tab.badge}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === 'pending' ? (
        <PendingApprovalsTab
          approvals={approvals}
          onApprove={handleApprove}
          onRejectClick={item => setRejectTarget(item)}
        />
      ) : (
        <MyApprovalsTab approvals={approvals} />
      )}
    </div>
  );
};

export default ApprovalCenter;
