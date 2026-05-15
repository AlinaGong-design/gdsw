import React, { useState, useEffect } from 'react';
import {
  CheckCircleOutlined, ClockCircleOutlined,
  FilterOutlined, SearchOutlined, WarningOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { approvalStore, ApprovalItem, ApprovalType, ApprovalStatus } from '../store/approvalStore';
import { employeeStore } from '../store/employeeStore';

// ─── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_APPROVALS: ApprovalItem[] = [
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
    id: 'ap-008', type: 'employee_publish',
    title: '数字员工上岗：财务报表助手 v2.0.0',
    requester: '赵六', requesterRole: '员工管理员', dept: '财务部',
    reason: '新增自动化报表生成功能，已在测试环境运行2周，申请正式上岗并全公司可见',
    status: 'pending', createdAt: '2026-04-21 14:30',
    riskLevel: 'medium',
    meta: { '版本': 'v2.0.0', '可见范围': '全公司', '业务域': '财务域' },
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
];

// ─── Constants ─────────────────────────────────────────────────────────────────
const PRIMARY = '#6366F1';
const PRIMARY_LIGHT = '#f0f0ff';

const TYPE_CONFIG: Record<ApprovalType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  employee_publish: { label: '员工上岗', color: '#6366F1', bg: '#f0f0ff', icon: <UserOutlined /> },
};

const RISK_CONFIG: Record<'high' | 'medium' | 'low', { label: string; color: string; bg: string }> = {
  high:   { label: '高风险', color: '#dc2626', bg: '#fef2f2' },
  medium: { label: '中风险', color: '#d97706', bg: '#fffbeb' },
  low:    { label: '低风险', color: '#059669', bg: '#ecfdf5' },
};

const STATUS_CONFIG: Record<ApprovalStatus, { label: string; color: string; bg: string }> = {
  pending:  { label: '待审批', color: '#d97706', bg: '#fffbeb' },
  approved: { label: '已通过', color: '#059669', bg: '#ecfdf5' },
  rejected: { label: '已驳回', color: '#dc2626', bg: '#fef2f2' },
};

// ─── Reject Modal ───────────────────────────────────────────────────────────────
const RejectModal: React.FC<{
  item: ApprovalItem;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}> = ({ item, onConfirm, onCancel }) => {
  const [reason, setReason] = useState('');
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
      <div style={{ background: '#fff', borderRadius: 14, width: 420, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>驳回申请</div>
          <div style={{ fontSize: 12, color: '#888' }}>「{item.title}」</div>
        </div>
        <div style={{ padding: '16px 22px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 8 }}>驳回原因 <span style={{ color: '#dc2626' }}>*</span></div>
          <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="请填写驳回原因，申请人将收到通知..." style={{ width: '100%', height: 90, border: '1px solid #e5e7eb', borderRadius: 8, padding: '9px 12px', fontSize: 12, resize: 'none', boxSizing: 'border-box', outline: 'none', lineHeight: 1.6, color: '#333', fontFamily: 'inherit' }} />
        </div>
        <div style={{ padding: '12px 22px 16px', display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid #f0f0f0' }}>
          <button onClick={onCancel} style={{ height: 32, padding: '0 14px', border: '1px solid #e5e7eb', borderRadius: 7, background: '#fff', cursor: 'pointer', fontSize: 12 }}>取消</button>
          <button onClick={() => reason.trim() && onConfirm(reason)} disabled={!reason.trim()} style={{ height: 32, padding: '0 14px', border: 'none', borderRadius: 7, cursor: reason.trim() ? 'pointer' : 'not-allowed', background: reason.trim() ? '#dc2626' : '#e5e7eb', color: reason.trim() ? '#fff' : '#bbb', fontSize: 12, fontWeight: 600 }}>确认驳回</button>
        </div>
      </div>
    </div>
  );
};

// ─── Approval Card ─────────────────────────────────────────────────────────────
const ApprovalCard: React.FC<{
  item: ApprovalItem;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  expanded: boolean;
  onToggle: () => void;
}> = ({ item, onApprove, onReject, expanded, onToggle }) => {
  const tc = TYPE_CONFIG[item.type];
  const risk = item.riskLevel ? RISK_CONFIG[item.riskLevel] : null;
  const isPending = item.status === 'pending';
  const sc = STATUS_CONFIG[item.status];

  return (
    <div style={{
      background: '#fff', borderRadius: 12, border: `1px solid ${isPending && item.riskLevel === 'high' ? '#fecaca' : '#e8e8f0'}`,
      marginBottom: 10, overflow: 'hidden',
      boxShadow: isPending ? '0 2px 10px rgba(0,0,0,0.06)' : 'none',
    }}>
      {/* Header row */}
      <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', cursor: 'pointer', gap: 12 }}>
        {/* Type badge */}
        <div style={{ width: 32, height: 32, borderRadius: 8, background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: tc.color, fontSize: 14 }}>
          {tc.icon}
        </div>
        {/* Main info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 7, fontWeight: 700, color: tc.color, background: tc.bg }}>{tc.label}</span>
            {risk && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 7, fontWeight: 600, color: risk.color, background: risk.bg }}>{risk.label}</span>}
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{item.title}</span>
          </div>
          <div style={{ fontSize: 11, color: '#bbb' }}>
            {item.requester}（{item.requesterRole}）· {item.dept} · {item.createdAt} · {item.id}
          </div>
        </div>
        {/* Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 9, fontWeight: 600, color: sc.color, background: sc.bg }}>{sc.label}</span>
          <span style={{ fontSize: 11, color: '#bbb', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>▼</span>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: '1px solid #f5f5f5', padding: '14px 18px' }}>
          {/* Meta grid */}
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
          <div style={{ fontSize: 12, color: '#555', background: '#fafafa', padding: '10px 12px', borderRadius: 8, marginBottom: item.riskNote ? 10 : 14, lineHeight: 1.7 }}>
            <span style={{ color: '#888', fontSize: 11 }}>申请理由：</span>{item.reason}
          </div>

          {/* Risk note */}
          {item.riskNote && (
            <div style={{ fontSize: 11, color: '#92400e', background: '#fffbeb', padding: '9px 12px', borderRadius: 8, marginBottom: 14, border: '1px solid #fde68a', display: 'flex', gap: 7, alignItems: 'flex-start', lineHeight: 1.7 }}>
              <WarningOutlined style={{ flexShrink: 0, marginTop: 2 }} />
              {item.riskNote}
            </div>
          )}

          {/* Rejected reason */}
          {item.status === 'rejected' && item.rejectReason && (
            <div style={{ fontSize: 11, color: '#7f1d1d', background: '#fef2f2', padding: '9px 12px', borderRadius: 8, marginBottom: 14, border: '1px solid #fecaca', lineHeight: 1.7 }}>
              <span style={{ fontWeight: 700 }}>驳回原因：</span>{item.rejectReason}
            </div>
          )}

          {/* Review info for done items */}
          {item.status !== 'pending' && (
            <div style={{ fontSize: 11, color: '#bbb', display: 'flex', gap: 12 }}>
              <span>审批人：{item.reviewer}</span>
              <span>审批时间：{item.reviewedAt}</span>
            </div>
          )}

          {/* Action buttons */}
          {isPending && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14, paddingTop: 12, borderTop: '1px solid #f5f5f5' }}>
              <button onClick={() => onReject(item.id)} style={{ height: 32, padding: '0 16px', border: '1px solid #fecaca', borderRadius: 8, background: '#fff', color: '#dc2626', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                驳回
              </button>
              <button onClick={() => onApprove(item.id)} style={{ height: 32, padding: '0 18px', border: 'none', borderRadius: 8, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                批准通过
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main ──────────────────────────────────────────────────────────────────────
const ApprovalCenter: React.FC = () => {
  const [approvals, setApprovals] = useState<ApprovalItem[]>(() => [
    ...approvalStore.getAll(),
    ...MOCK_APPROVALS.filter(m => !approvalStore.getAll().find(a => a.id === m.id)),
  ]);
  const [filter, setFilter] = useState<'all' | ApprovalType | ApprovalStatus>('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>('ap-001');
  const [rejectTarget, setRejectTarget] = useState<ApprovalItem | null>(null);
  const [toast, setToast] = useState('');

  // Subscribe to approvalStore so new skill_mount submissions appear instantly
  useEffect(() => {
    const refresh = () => {
      setApprovals([
        ...approvalStore.getAll(),
        ...MOCK_APPROVALS.filter(m => !approvalStore.getAll().find(a => a.id === m.id)),
      ]);
    };
    return approvalStore.subscribe(refresh);
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2800); };

  const pending = approvals.filter(a => a.status === 'pending');
  const done    = approvals.filter(a => a.status !== 'pending');

  const handleApprove = (id: string) => {
    approvalStore.updateStatus(id, 'approved', '当前审批人');
    // If it's an employee_publish approval, automatically publish the employee
    const item = approvalStore.getAll().find(a => a.id === id);
    if (item?.type === 'employee_publish' && item.employeeId) {
      employeeStore.updateEmployee(item.employeeId, { status: 'published' });
    }
    setExpanded(null);
    showToast('✅ 审批通过，相关变更已生效');
  };

  const handleReject = (id: string, reason: string) => {
    approvalStore.updateStatus(id, 'rejected', '当前审批人', reason);
    setRejectTarget(null);
    setExpanded(null);
    showToast('❌ 已驳回申请，申请人将收到通知');
  };

  const filtered = (list: ApprovalItem[]) => list.filter(a => {
    if (filter !== 'all' && a.type !== filter && a.status !== filter) return false;
    if (search && !a.title.includes(search) && !a.requester.includes(search) && !a.dept.includes(search)) return false;
    return true;
  });

  const TYPE_FILTERS: { key: string; label: string; count: number }[] = [
    { key: 'all', label: '全部', count: approvals.length },
    { key: 'pending', label: '待审批', count: pending.length },
    { key: 'employee_publish', label: '员工上岗', count: approvals.filter(a => a.type === 'employee_publish').length },
  ];

  return (
    <div style={{ position: 'relative' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#1a1a1a', color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: 13, zIndex: 400, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>{toast}</div>
      )}
      {rejectTarget && (
        <RejectModal item={rejectTarget} onConfirm={r => handleReject(rejectTarget.id, r)} onCancel={() => setRejectTarget(null)} />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircleOutlined style={{ color: '#fff', fontSize: 15 }} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', lineHeight: 1.2 }}>审批中心</div>
            <div style={{ fontSize: 11, color: '#bbb' }}>员工上岗审批</div>
          </div>
        </div>
        {pending.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 9 }}>
            <ClockCircleOutlined style={{ color: '#d97706', fontSize: 13 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#d97706' }}>{pending.length} 条申请待审批</span>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {[
          { label: '待审批', value: pending.length, color: '#d97706', bg: '#fffbeb' },
          { label: '本月已通过', value: approvals.filter(a => a.status === 'approved').length, color: '#059669', bg: '#ecfdf5' },
          { label: '本月已驳回', value: approvals.filter(a => a.status === 'rejected').length, color: '#dc2626', bg: '#fef2f2' },
          { label: '高风险申请', value: pending.filter(a => a.riskLevel === 'high').length, color: '#ea580c', bg: '#fff7ed' },
        ].map(item => (
          <div key={item.label} style={{ flex: 1, background: '#fff', borderRadius: 10, padding: '12px 16px', border: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: item.color }}>{item.value}</div>
            <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Filter row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {TYPE_FILTERS.map(f => (
            <div
              key={f.key}
              onClick={() => setFilter(f.key as any)}
              style={{
                padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500,
                background: filter === f.key ? PRIMARY_LIGHT : '#f3f4f6',
                color: filter === f.key ? PRIMARY : '#6b7280',
                border: `1px solid ${filter === f.key ? PRIMARY : 'transparent'}`,
                transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              {f.label}
              <span style={{ fontSize: 10, padding: '0 4px', borderRadius: 6, background: filter === f.key ? `${PRIMARY}20` : '#e5e7eb', color: filter === f.key ? PRIMARY : '#9ca3af' }}>
                {f.count}
              </span>
            </div>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', position: 'relative' }}>
          <SearchOutlined style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#bbb', fontSize: 12 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索申请人、部门..." style={{ height: 32, border: '1px solid #e5e7eb', borderRadius: 8, padding: '0 10px 0 28px', fontSize: 12, outline: 'none', color: '#333', width: 180 }} />
        </div>
      </div>

      {/* Pending section */}
      {filtered(pending).length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>待审批</div>
            <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 8, background: '#fef3c7', color: '#d97706', fontWeight: 600 }}>{filtered(pending).length} 条</span>
            {pending.filter(a => a.riskLevel === 'high').length > 0 && (
              <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 8, background: '#fef2f2', color: '#dc2626', fontWeight: 600 }}>
                其中 {pending.filter(a => a.riskLevel === 'high').length} 条高风险
              </span>
            )}
          </div>
          {filtered(pending).map(item => (
            <ApprovalCard
              key={item.id}
              item={item}
              expanded={expanded === item.id}
              onToggle={() => setExpanded(expanded === item.id ? null : item.id)}
              onApprove={handleApprove}
              onReject={id => setRejectTarget(approvals.find(a => a.id === id) || null)}
            />
          ))}
        </div>
      )}

      {/* Done section */}
      {filtered(done).length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>审批历史</div>
          {filtered(done).map(item => (
            <ApprovalCard
              key={item.id}
              item={item}
              expanded={expanded === item.id}
              onToggle={() => setExpanded(expanded === item.id ? null : item.id)}
              onApprove={handleApprove}
              onReject={id => setRejectTarget(approvals.find(a => a.id === id) || null)}
            />
          ))}
        </div>
      )}

      {filtered(pending).length === 0 && filtered(done).length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#bbb' }}>
          <FilterOutlined style={{ fontSize: 28, display: 'block', marginBottom: 10 }} />
          <div style={{ fontSize: 13 }}>没有符合条件的审批记录</div>
        </div>
      )}
    </div>
  );
};

export default ApprovalCenter;
