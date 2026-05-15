import React, { useState } from 'react';
import {
  Button,
  Input,
  Space,
  Tag,
  DatePicker,
  Tabs,
  Modal,
  message,
  Select,
  Drawer,
  Timeline,
  Divider,
  Dropdown,
  Avatar,
  Tooltip,
  Badge,
  Table,
  Row,
  Col,
} from 'antd';
import type { MenuProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  CloudUploadOutlined,
  HistoryOutlined,
  TagOutlined,
  RollbackOutlined,
  EyeOutlined,
  FileTextOutlined,
  GlobalOutlined,
  LockOutlined,
  TeamOutlined,
  CloseOutlined,
  EllipsisOutlined,
  RobotOutlined,
  DatabaseOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  ThunderboltOutlined,
  CopyOutlined,
  LikeOutlined,
  DislikeOutlined,
  MessageOutlined,
  ExportOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import './AgentList.css';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

// ─── 类型定义 ────────────────────────────────────────────────────────────────

type AgentHistoryEventKind = 'save' | 'publish';
type VisibilityScope = 'private' | 'team' | 'public';
type SavedStatus = 'saved' | 'draft' | 'published';

interface AgentVersion {
  versionId: string;
  version: string;
  changelog: string;
  publishedAt: string;
  publishedBy: string;
  scope: VisibilityScope;
  snapshot: {
    name: string;
    description: string;
    type: 'autonomous' | 'collaborative' | 'rag';
  };
}

interface AgentHistoryEvent {
  id: string;
  kind: AgentHistoryEventKind;
  time: string;
  user: string;
  desc: string;
  version?: AgentVersion;
}

interface AgentData {
  key: string;
  id: number;
  name: string;
  description: string;
  creator: string;
  department: string;
  createTime: string;
  status: string[];
  type: 'autonomous' | 'collaborative' | 'rag';
  skillCount?: number;
  skills?: string[];
  currentVersion?: string;
  savedStatus?: SavedStatus;
  agentHistory?: AgentHistoryEvent[];
}

interface AgentListProps {
  onCreateAgent?: (type: 'rag' | 'autonomous' | 'collaborative') => void;
  onEditAgent?: (agentId: string) => void;
  onDeleteAgent?: (agentId: string) => void;
  onPublishAgent?: (agentId: string) => void;
}

// ─── 工具函数 ────────────────────────────────────────────────────────────────

const now = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

const SCOPE_LABELS: Record<VisibilityScope, { label: string; icon: React.ReactNode }> = {
  private: { label: '仅自己', icon: <LockOutlined /> },
  team:    { label: '团队内', icon: <TeamOutlined /> },
  public:  { label: '公开',   icon: <GlobalOutlined /> },
};

function getLatestVersion(agent: AgentData): string {
  const hist = agent.agentHistory || [];
  const last = [...hist].reverse().find(h => h.kind === 'publish');
  return last?.desc || 'v1.0.0';
}

// 根据名称生成头像颜色
const AVATAR_COLORS = [
  'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
  'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)',
  'linear-gradient(135deg, #10B981 0%, #34d399 100%)',
  'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
  'linear-gradient(135deg, #EF4444 0%, #F87171 100%)',
  'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const TYPE_CONFIG = {
  autonomous:    { label: '自主规划', color: '#6366F1', bg: '#EEF2FF' },
  collaborative: { label: '多应用协同', color: '#3B82F6', bg: '#EFF6FF' },
  rag:           { label: 'RAG',      color: '#10B981', bg: '#ECFDF5' },
};

const STATUS_CONFIG: Record<SavedStatus, { label: string; color: string; dotColor: string }> = {
  published: { label: '已发布', color: '#16a34a', dotColor: '#22c55e' },
  draft:     { label: '草稿',   color: '#d97706', dotColor: '#f59e0b' },
  saved:     { label: '已下架', color: '#64748b', dotColor: '#94a3b8' },
};

// ─── 初始数据 ─────────────────────────────────────────────────────────────────

const INIT_DATA: AgentData[] = [
  {
    key: '1', id: 1, name: '竞品调研', description: '基于网页搜索与数据分析，自动完成竞品信息收集、对比分析并生成结构化报告',
    creator: '巩娜', department: '研发部门', createTime: '2026-01-25 01:45:38',
    status: ['广场', '共享', 'API', 'MCP'], type: 'autonomous',
    skillCount: 3, skills: ['网页搜索', '数据分析', 'PDF解析'],
    currentVersion: 'v1.1.0', savedStatus: 'published',
    agentHistory: [
      { id: 'h1', kind: 'publish', time: '2026-01-20 09:00:00', user: '巩娜', desc: 'v1.0.0',
        version: { versionId: 'v1.0.0', version: 'v1.0.0', changelog: '首次发布', publishedAt: '2026-01-20 09:00', publishedBy: '巩娜', scope: 'team', snapshot: { name: '竞品调研', description: '竞品调研初版', type: 'autonomous' } } },
      { id: 'h2', kind: 'save', time: '2026-01-22 14:00:00', user: '巩娜', desc: '优化提示词与工具配置' },
      { id: 'h3', kind: 'publish', time: '2026-01-25 01:45:38', user: '巩娜', desc: 'v1.1.0',
        version: { versionId: 'v1.1.0', version: 'v1.1.0', changelog: '新增数据分析技能，优化搜索策略', publishedAt: '2026-01-25 01:45', publishedBy: '巩娜', scope: 'team', snapshot: { name: '竞品调研', description: '11', type: 'autonomous' } } },
    ],
  },
  {
    key: '2', id: 2, name: '知识问答助手', description: '企业内部知识库精准检索与问答，支持多格式文档解析，提供有据可查的准确回答',
    creator: '巩娜', department: '研发部门', createTime: '2026-01-25 01:44:22',
    status: ['广场', '共享', 'API', 'MCP'], type: 'autonomous',
    skillCount: 2, skills: ['Python执行器', '文档分析'],
    currentVersion: 'v1.0.0', savedStatus: 'published',
    agentHistory: [
      { id: 'h1', kind: 'publish', time: '2026-01-25 01:44:22', user: '巩娜', desc: 'v1.0.0',
        version: { versionId: 'v1.0.0', version: 'v1.0.0', changelog: '首次发布', publishedAt: '2026-01-25 01:44', publishedBy: '巩娜', scope: 'team', snapshot: { name: '知识问答助手', description: '知识问答', type: 'autonomous' } } },
    ],
  },
  {
    key: '3', id: 3, name: '石油化工异常处置', description: '石油化工设备异常识别与处置方案生成，结合行业知识库提供专业处置建议',
    creator: '巩娜', department: '研发部门', createTime: '2026-01-23 18:57:27',
    status: ['广场', '共享', 'API', 'MCP'], type: 'collaborative',
    skillCount: 5, skills: ['网页搜索', 'PDF解析', 'Python执行器', '数据分析', '知识库检索'],
    currentVersion: 'v2.0.0', savedStatus: 'published',
    agentHistory: [
      { id: 'h1', kind: 'publish', time: '2026-01-10 10:00:00', user: '巩娜', desc: 'v1.0.0',
        version: { versionId: 'v1.0.0', version: 'v1.0.0', changelog: '首次发布', publishedAt: '2026-01-10 10:00', publishedBy: '巩娜', scope: 'team', snapshot: { name: '石油化工异常处置', description: '初版', type: 'collaborative' } } },
      { id: 'h2', kind: 'save', time: '2026-01-18 11:00:00', user: '巩娜', desc: '增加多个子智能体节点' },
      { id: 'h3', kind: 'publish', time: '2026-01-23 18:57:27', user: '巩娜', desc: 'v2.0.0',
        version: { versionId: 'v2.0.0', version: 'v2.0.0', changelog: '重构多智能体协作流程，新增异常处置专项模块', publishedAt: '2026-01-23 18:57', publishedBy: '巩娜', scope: 'public', snapshot: { name: '石油化工异常处置', description: '石油化工异常处置小助手', type: 'collaborative' } } },
    ],
  },
  {
    key: '4', id: 4, name: '客服智能助手', description: '7×24小时智能客服对话，自动分流、意图识别、常见问题解答与人工转接',
    creator: '张三', department: '客服部门', createTime: '2026-01-24 10:30:00',
    status: ['广场', '共享'], type: 'autonomous',
    skillCount: 0, skills: [],
    savedStatus: 'draft', agentHistory: [],
  },
  {
    key: '5', id: 5, name: '营销策划团队', description: '多智能体协同完成营销策划，涵盖市场调研、方案撰写、文案生成与效果预估全流程',
    creator: '李四', department: '市场部门', createTime: '2026-01-22 14:20:15',
    status: ['广场', '共享', 'API'], type: 'collaborative',
    skillCount: 0, skills: [],
    currentVersion: 'v1.0.0', savedStatus: 'published',
    agentHistory: [
      { id: 'h1', kind: 'publish', time: '2026-01-22 14:20:15', user: '李四', desc: 'v1.0.0',
        version: { versionId: 'v1.0.0', version: 'v1.0.0', changelog: '首次发布', publishedAt: '2026-01-22 14:20', publishedBy: '李四', scope: 'team', snapshot: { name: '营销策划团队', description: '多智能体协作的营销策划方案生成', type: 'collaborative' } } },
    ],
  },
  {
    key: '6', id: 6, name: '代码审查助手', description: '自动代码审查、安全漏洞扫描与重构建议，支持多语言，集成 Git 操作',
    creator: '王五', department: '研发部门', createTime: '2026-01-21 16:45:30',
    status: ['共享', 'API'], type: 'autonomous',
    skillCount: 4, skills: ['代码执行', '代码分析', 'Git操作', '文档生成'],
    currentVersion: 'v1.2.0', savedStatus: 'saved',
    agentHistory: [
      { id: 'h1', kind: 'publish', time: '2026-01-15 10:00:00', user: '王五', desc: 'v1.0.0',
        version: { versionId: 'v1.0.0', version: 'v1.0.0', changelog: '首次发布', publishedAt: '2026-01-15 10:00', publishedBy: '王五', scope: 'team', snapshot: { name: '代码审查助手', description: '自动代码审查', type: 'autonomous' } } },
      { id: 'h2', kind: 'save', time: '2026-01-18 15:00:00', user: '王五', desc: '增加代码安全检测逻辑' },
      { id: 'h3', kind: 'publish', time: '2026-01-21 16:45:30', user: '王五', desc: 'v1.2.0',
        version: { versionId: 'v1.2.0', version: 'v1.2.0', changelog: '新增安全漏洞检测与Git操作技能', publishedAt: '2026-01-21 16:45', publishedBy: '王五', scope: 'team', snapshot: { name: '代码审查助手', description: '自动代码审查和建议', type: 'autonomous' } } },
    ],
  },
];

// ─── 历史版本抽屉 ─────────────────────────────────────────────────────────────

const AgentHistoryDrawer: React.FC<{
  agent: AgentData | null;
  open: boolean;
  onClose: () => void;
  onRollback: (agent: AgentData, ver: AgentVersion) => void;
  previewVersion: AgentVersion | null;
  onPreviewVersion: (ver: AgentVersion) => void;
  onExitPreview: () => void;
}> = ({ agent, open, onClose, onRollback, previewVersion, onPreviewVersion, onExitPreview }) => {
  const [rollbackTarget, setRollbackTarget] = useState<AgentVersion | null>(null);

  if (!agent) return null;
  const history = agent.agentHistory || [];
  const isPreview = !!previewVersion;

  const handleRollbackConfirm = () => {
    if (!rollbackTarget) return;
    onRollback(agent, rollbackTarget);
    setRollbackTarget(null);
    onClose();
  };

  return (
    <>
      <Drawer
        title={
          <Space>
            <HistoryOutlined />
            <span>历史版本</span>
            <Tag style={{ fontSize: 11, margin: 0 }}>{history.length} 条记录</Tag>
          </Space>
        }
        placement="right"
        width={440}
        open={open}
        onClose={onClose}
        styles={{ body: { padding: '16px 20px' } }}
      >
        <div
          onClick={isPreview ? () => { onExitPreview(); onClose(); } : undefined}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 8, padding: '10px 14px', marginBottom: 4, borderRadius: 8,
            cursor: isPreview ? 'pointer' : 'default',
            background: !isPreview ? '#f0fdf4' : '#f0f9ff',
            border: !isPreview ? '1.5px solid #86efac' : '1px solid #bae6fd',
          }}
        >
          <Space size={6}>
            <FileTextOutlined style={{ color: isPreview ? '#0ea5e9' : '#16a34a' }} />
            <span style={{ fontSize: 13, color: isPreview ? '#0369a1' : '#15803d', fontWeight: 500 }}>
              草稿（当前编辑版本）
            </span>
          </Space>
          {!isPreview
            ? <Tag color="green" style={{ fontSize: 11, margin: 0 }}>当前</Tag>
            : <span style={{ fontSize: 12, color: '#0369a1' }}>点击返回草稿</span>
          }
        </div>

        <Divider style={{ margin: '12px 0 16px', fontSize: 12, color: '#94a3b8' }}>
          {history.length} 条历史记录
        </Divider>

        <Timeline
          items={[...history].reverse().map(ev => ({
            dot: ev.kind === 'publish'
              ? <TagOutlined style={{ color: '#6366F1', fontSize: 14 }} />
              : <SaveOutlined style={{ color: '#94a3b8', fontSize: 12 }} />,
            color: ev.kind === 'publish' ? '#6366F1' : '#cbd5e1',
            children: (
              <div style={{ marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                  {ev.kind === 'publish' ? (
                    <>
                      <Tag color="purple" style={{ margin: 0, fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>
                        {ev.desc}
                      </Tag>
                      <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>正式发布</Tag>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{ev.desc}</span>
                      <Tag style={{ margin: 0, fontSize: 11, color: '#64748b', borderColor: '#cbd5e1', background: '#f8fafc' }}>草稿保存</Tag>
                    </>
                  )}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{ev.user} · {ev.time}</div>
                {ev.kind === 'publish' && ev.version && (
                  <>
                    {ev.version.changelog && (
                      <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic', marginBottom: 4, paddingLeft: 8, borderLeft: '2px solid #e2e8f0', lineHeight: 1.5 }}>
                        {ev.version.changelog}
                      </div>
                    )}
                    <Space size={6}>
                      <Button
                        size="small" icon={<EyeOutlined />}
                        type={isPreview && previewVersion?.versionId === ev.version.versionId ? 'primary' : 'default'}
                        onClick={() => onPreviewVersion(ev.version!)}
                      >查看版本</Button>
                      <Button size="small" icon={<RollbackOutlined />} onClick={() => setRollbackTarget(ev.version!)}>
                        回滚
                      </Button>
                    </Space>
                  </>
                )}
              </div>
            ),
          }))}
        />
      </Drawer>

      <Modal
        title={`回滚至 ${rollbackTarget?.version} 版本`}
        open={!!rollbackTarget}
        onCancel={() => setRollbackTarget(null)}
        footer={
          <Space>
            <Button onClick={() => setRollbackTarget(null)}>取消</Button>
            <Button type="primary" onClick={handleRollbackConfirm}
              style={{ background: '#1a1a1a', borderColor: '#1a1a1a', borderRadius: 8 }}>
              回滚
            </Button>
          </Space>
        }
        width={520}
      >
        {rollbackTarget && (
          <div style={{ padding: '4px 0 8px' }}>
            <div style={{ border: '1px solid #e8e8e8', borderRadius: 8, padding: '14px 16px', marginBottom: 20, background: '#fafafa' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>回滚版本 {rollbackTarget.version}</span>
                <span style={{ fontSize: 13, color: '#999' }}>{rollbackTarget.publishedBy} · {rollbackTarget.publishedAt}</span>
              </div>
              <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
                {rollbackTarget.changelog || `将智能体「${agent?.name}」恢复至 ${rollbackTarget.version} 版本配置。`}
              </div>
            </div>
            <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>智能体配置恢复至选中的 {rollbackTarget.version} 版本状态</li>
              <li style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>撤销该版本之后的所有未发布更改</li>
              <li style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>历史记录会保留，可随时回滚到其他版本</li>
            </ul>
          </div>
        )}
      </Modal>
    </>
  );
};

// ─── 发布版本 Modal ───────────────────────────────────────────────────────────

const PublishAgentModal: React.FC<{
  open: boolean;
  latestVersion: string;
  onClose: () => void;
  onPublish: (version: string, changelog: string, scope: VisibilityScope, channels: string[]) => void;
}> = ({ open, latestVersion, onClose, onPublish }) => {
  const [version, setVersion] = useState('');
  const [changelog, setChangelog] = useState('');
  const [channels, setChannels] = useState<string[]>(['广场', '共享']);
  const [shopScope, setShopScope] = useState('全��司可见');
  const [shopCategory, setShopCategory] = useState<string[]>(['开发']);

  React.useEffect(() => {
    if (open) {
      setVersion(latestVersion);
      setChangelog('');
      setChannels(['广场', '共享']);
      setShopScope('全公司可见');
      setShopCategory(['开发']);
    }
  }, [open, latestVersion]);

  const toggleChannel = (ch: string) => {
    setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  };

  const handleConfirm = () => {
    if (!/^v\d+\.\d+\.\d+$/.test(version)) { message.error('版本号格式不正确，需为 vX.Y.Z'); return; }
    if (channels.length === 0) { message.warning('请至少选择一个发布渠道'); return; }
    const scope: VisibilityScope = channels.includes('广场') ? 'public' : channels.includes('共享') ? 'team' : 'private';
    onPublish(version, changelog, scope, channels);
    onClose();
  };

  const CHANNEL_CONFIG = [
    { key: '广场', icon: '🏪', label: '智能体广场', desc: '上架到智能体广场，供全员发现和使用', color: '#6366F1' },
    { key: '共享', icon: '👥', label: '团队共享', desc: '共享到「智能体中心」，允许成员查看和复用', color: '#10B981' },
    { key: 'API', icon: '🔗', label: 'API 调用', desc: '通过 API 接口对外提供服务（需审批）', color: '#F59E0B' },
    { key: 'MCP', icon: '🔌', label: 'MCP 协议', desc: '以 MCP 协议对外暴露能力（需审批）', color: '#8B5CF6' },
  ];

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #e8e7ff 0%, #d4d3ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CloudUploadOutlined style={{ color: '#6366F1', fontSize: 20 }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1a1a1a' }}>发布智能体</div>
            <div style={{ fontWeight: 400, fontSize: 13, color: '#888', marginTop: 2 }}>选择发布渠道并填写版本信息</div>
          </div>
        </div>
      }
      open={open} onCancel={onClose}
      footer={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" icon={<CloudUploadOutlined />} onClick={handleConfirm}
            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', border: 'none' }}>
            确认发布
          </Button>
        </Space>
      }
      width={560}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '12px 0 4px' }}>

        {/* STEP 1: 发布渠道 */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#6366F1', color: '#fff', fontSize: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>1</span>
            选择发布渠道
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CHANNEL_CONFIG.map(ch => {
              const selected = channels.includes(ch.key);
              return (
                <div key={ch.key}>
                  <div
                    onClick={() => toggleChannel(ch.key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                      borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                      border: selected ? `1.5px solid ${ch.color}` : '1px solid #e8e8e8',
                      background: selected ? `${ch.color}08` : '#fafafa',
                    }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: selected ? `${ch.color}18` : '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                      {ch.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: selected ? ch.color : '#333' }}>{ch.label}</div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 1 }}>{ch.desc}</div>
                    </div>
                    <div style={{
                      width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                      border: selected ? 'none' : '1.5px solid #d1d5db',
                      background: selected ? ch.color : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {selected && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
                    </div>
                  </div>
                  {/* 广场额外配置 */}
                  {ch.key === '广场' && selected && (
                    <div style={{ margin: '4px 0 0 60px', display: 'flex', gap: 10 }}>
                      <Select size="small" mode="multiple" value={shopCategory} onChange={setShopCategory}
                        style={{ flex: 1 }} placeholder="应用分类"
                        options={[
                          { value: '开发', label: '开发' }, { value: '数据分析', label: '数据分析' },
                          { value: '内容创作', label: '内容创作' }, { value: '客服', label: '客服' },
                          { value: '营销', label: '营销' }, { value: '研究', label: '研究' },
                        ]}
                      />
                      <Select size="small" value={shopScope} onChange={setShopScope} style={{ width: 120 }}
                        options={[
                          { value: '全公司可见', label: '全公司可见' },
                          { value: '仅本部门', label: '仅本部门' },
                        ]}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ borderTop: '1px solid #f0f0f0' }} />

        {/* STEP 2: 版本信息 */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#6366F1', color: '#fff', fontSize: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>2</span>
            版本信息
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* 版本号 */}
            <div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>
                版本号 <span style={{ color: '#ff4d4f' }}>*</span>
                <span style={{ marginLeft: 8 }}>上次：<Tag style={{ fontFamily: 'monospace', margin: 0, fontSize: 11 }}>{latestVersion}</Tag></span>
              </div>
              <Input value={version} onChange={e => setVersion(e.target.value)} placeholder="vX.Y.Z"
                style={{ fontFamily: 'monospace', fontSize: 14 }} prefix={<TagOutlined style={{ color: '#6366F1' }} />} />
            </div>
            {/* 版本说明 */}
            <div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>版本说明 <span style={{ color: '#94a3b8' }}>（可选）</span></div>
              <TextArea value={changelog} onChange={e => setChangelog(e.target.value)} rows={2}
                placeholder="描述本次版本的变更内容…" maxLength={500} showCount />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ─── 智能体卡片 ───────────────────────────────────────────────────────────────

const AgentCard: React.FC<{
  agent: AgentData;
  onEdit: (key: string) => void;
  onPublish: (key: string) => void;
  onUnpublish: (key: string) => void;
  onDelete: (key: string, name: string) => void;
  onHistory: (agent: AgentData) => void;
}> = ({ agent, onEdit, onPublish, onUnpublish, onDelete, onHistory }) => {
  const typeConf = TYPE_CONFIG[agent.type];
  const statusConf = STATUS_CONFIG[agent.savedStatus || 'draft'];
  const avatarBg = getAvatarColor(agent.name);
  const version = agent.currentVersion || getLatestVersion(agent);

  const moreMenuItems: MenuProps['items'] = [
    {
      key: 'publish',
      icon: <CloudUploadOutlined />,
      label: agent.savedStatus === 'published' ? '下架' : '发布',
      onClick: () => agent.savedStatus === 'published' ? onUnpublish(agent.key) : onPublish(agent.key),
    },
    {
      key: 'history',
      icon: <HistoryOutlined />,
      label: '历史版本',
      onClick: () => onHistory(agent),
    },
    { type: 'divider' },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除',
      danger: true,
      onClick: () => onDelete(agent.key, agent.name),
    },
  ];

  return (
    <div
      onClick={() => onEdit(agent.key)}
      style={{
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #f0f0f0',
        overflow: 'hidden',
        transition: 'all 0.2s',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLElement).style.borderColor = '#c4b5fd';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
        (e.currentTarget as HTMLElement).style.transform = 'none';
        (e.currentTarget as HTMLElement).style.borderColor = '#f0f0f0';
      }}
    >
      {/* 顶部类型色带 */}
      <div style={{ height: 4, background: typeConf.color, flexShrink: 0 }} />

      {/* 卡片主体 */}
      <div style={{ padding: '16px 16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* 头部：头像 + 名称 + 类型 + 状态 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div
            style={{
              width: 44, height: 44, borderRadius: 10, flexShrink: 0,
              background: avatarBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 18, fontWeight: 700,
            }}
          >
            {agent.name.charAt(0)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
              <div style={{
                fontSize: 15, fontWeight: 700, color: '#1a1a1a',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                maxWidth: 140,
              }}>
                {agent.name}
              </div>
              {/* 状态指示 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: statusConf.dotColor,
                }} />
                <span style={{ fontSize: 11, color: statusConf.color, fontWeight: 500 }}>
                  {statusConf.label}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Tag
                style={{
                  margin: 0, fontSize: 11, fontWeight: 500,
                  background: typeConf.bg, color: typeConf.color,
                  border: `1px solid ${typeConf.color}30`,
                  borderRadius: 4, padding: '0 6px',
                }}
              >
                {agent.type === 'collaborative' ? (
                  <><TeamOutlined style={{ marginRight: 3 }} />{typeConf.label}</>
                ) : agent.type === 'rag' ? (
                  <><DatabaseOutlined style={{ marginRight: 3 }} />{typeConf.label}</>
                ) : (
                  <><RobotOutlined style={{ marginRight: 3 }} />{typeConf.label}</>
                )}
              </Tag>
              {agent.currentVersion && (
                <Tag style={{ margin: 0, fontSize: 11, background: '#fafafa', color: '#888', borderColor: '#e8e8e8', fontFamily: 'monospace', padding: '0 5px' }}>
                  {version}
                </Tag>
              )}
            </div>
          </div>
        </div>

        {/* 描述 */}
        <p style={{
          margin: 0, fontSize: 13, color: '#666', lineHeight: 1.6,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
          overflow: 'hidden',
        }}>
          {agent.description || '暂无描述'}
        </p>

        {/* 技能 */}
        {agent.skills && agent.skills.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            <ThunderboltOutlined style={{ fontSize: 11, color: '#94a3b8' }} />
            {agent.skills.slice(0, 3).map(skill => (
              <Tag key={skill} style={{
                margin: 0, fontSize: 11, padding: '0 5px',
                background: '#f8f9ff', color: '#6366F1', borderColor: '#e0e7ff',
              }}>
                {skill}
              </Tag>
            ))}
            {agent.skills.length > 3 && (
              <Tooltip title={agent.skills.slice(3).join('、')}>
                <Tag style={{ margin: 0, fontSize: 11, padding: '0 5px', cursor: 'pointer', color: '#94a3b8', borderColor: '#e8e8e8' }}>
                  +{agent.skills.length - 3}
                </Tag>
              </Tooltip>
            )}
          </div>
        )}
      </div>

      {/* 卡片底部 */}
      <div style={{
        padding: '10px 16px',
        borderTop: '1px solid #f5f5f5',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#fafafa',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Avatar size={18} style={{ background: avatarBg, fontSize: 10 }}>{agent.creator.charAt(0)}</Avatar>
          <span style={{ fontSize: 12, color: '#888' }}>{agent.creator}</span>
          <span style={{ fontSize: 12, color: '#ccc' }}>·</span>
          <span style={{ fontSize: 12, color: '#bbb' }}>{agent.department}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Dropdown menu={{ items: moreMenuItems }} trigger={['click']} placement="bottomRight">
            <Button
              size="small"
              icon={<EllipsisOutlined />}
              onClick={e => e.stopPropagation()}
              style={{ borderRadius: 6, height: 26, width: 26, padding: 0 }}
            />
          </Dropdown>
        </div>
      </div>
    </div>
  );
};

// ─── 数据中心：对话记录 Mock ──────────────────────────────────────────────────

interface ConvRecord {
  id: string;
  agentName: string;
  user: string;
  channel: string;
  msgCount: number;
  duration: string;
  startTime: string;
  status: 'completed' | 'interrupted';
}

const MOCK_CONV_RECORDS: ConvRecord[] = [
  { id: 'cv-001', agentName: '竞品调研', user: 'user_8821', channel: 'Web', msgCount: 12, duration: '4分32秒', startTime: '2026-03-24 10:32', status: 'completed' },
  { id: 'cv-002', agentName: '知识问答助手', user: 'user_3341', channel: 'API', msgCount: 6, duration: '1分18秒', startTime: '2026-03-24 10:15', status: 'completed' },
  { id: 'cv-003', agentName: '法务合同审查', user: 'user_5521', channel: 'Web', msgCount: 21, duration: '8分45秒', startTime: '2026-03-24 09:58', status: 'completed' },
  { id: 'cv-004', agentName: '客服智能助手', user: 'user_7712', channel: 'Feishu', msgCount: 3, duration: '0分52秒', startTime: '2026-03-24 09:44', status: 'interrupted' },
  { id: 'cv-005', agentName: '竞品调研', user: 'user_2293', channel: 'Web', msgCount: 9, duration: '3分11秒', startTime: '2026-03-24 09:30', status: 'completed' },
  { id: 'cv-006', agentName: '数据报表生成', user: 'user_6618', channel: 'API', msgCount: 15, duration: '5分20秒', startTime: '2026-03-24 09:15', status: 'completed' },
  { id: 'cv-007', agentName: '知识问答助手', user: 'user_1190', channel: 'Web', msgCount: 8, duration: '2分05秒', startTime: '2026-03-24 09:02', status: 'completed' },
];

// ─── 数据中心：用户反馈 Mock ──────────────────────────────────────────────────

interface FeedbackRecord {
  id: string;
  content: string;
  status: '待解决' | '已解决' | '处理中';
  type: string;
  contact: string;
  phone: string;
  wechatId: string;
  agentId: string;
  createTime: string;
}

const MOCK_FEEDBACK: FeedbackRecord[] = [
  { id: 'fb-001', content: '用不了', status: '待解决', type: '使用故障', contact: 'alina', phone: '13520689985', wechatId: 'h5', agentId: '3', createTime: '2026-03-04 01:45:27' },
  { id: 'fb-002', content: '回答不准确，经常答非所问', status: '处理中', type: '回答质量', contact: 'bob', phone: '13812345678', wechatId: 'wx_bob', agentId: '1', createTime: '2026-03-10 09:22:14' },
  { id: 'fb-003', content: '响应速度太慢，等了很久', status: '已解决', type: '性能问题', contact: 'carol', phone: '15988887777', wechatId: 'carol_wx', agentId: '2', createTime: '2026-03-15 16:40:03' },
];

// ─── 数据中心：点赞点踩记录 Mock ─────────────────────────────────────────────

interface ReactionRecord {
  id: string;
  agentName: string;
  user: string;
  type: 'like' | 'dislike';
  msgContent: string;
  aiReply: string;
  channel: string;
  createTime: string;
}

interface ReactionMessage {
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

const MOCK_REACTIONS: (ReactionRecord & { conversation: ReactionMessage[] })[] = [
  {
    id: 'rc-001', agentName: '竞品调研', user: 'user_8821', type: 'like',
    msgContent: '帮我分析Kimi的竞争优势', aiReply: 'Kimi 在长文本处理和中文理解方面具有领先优势……',
    channel: 'H5', createTime: '2026-03-24 10:35',
    conversation: [
      { role: 'user', content: '帮我分析Kimi的竞争优势', time: '10:33' },
      { role: 'assistant', content: `Kimi 在长文本处理和中文理解方面具有领先优势。

**核心优势：**
1. **超长上下文**：支持最高 200 万 token 输入，适合长文档处理
2. **中文理解**：深度优化中文语义，回答准确流畅
3. **文件解析**：支持 PDF、Word、Excel 等多种格式直接上传分析
4. **搜索增强**：内置联网搜索，信息时效性强

整体来看，Kimi 在知识工作者场景下用户满意度较高。`, time: '10:35' },
    ],
  },
  {
    id: 'rc-002', agentName: '知识问答助手', user: 'user_3341', type: 'dislike',
    msgContent: '万卷支持哪些文件格式？', aiReply: '万卷平台支持多种格式，包括……',
    channel: 'API', createTime: '2026-03-24 10:17',
    conversation: [
      { role: 'user', content: '万卷支持哪些文件格式？', time: '10:16' },
      { role: 'assistant', content: '万卷平台支持多种格式，包括 PDF、Word、Excel……', time: '10:17' },
    ],
  },
  {
    id: 'rc-003', agentName: '法务合同审查', user: 'user_5521', type: 'like',
    msgContent: '审查这份合同的违约条款', aiReply: '该合同第12条违约责任存在以下风险……',
    channel: 'MCP', createTime: '2026-03-24 10:02',
    conversation: [
      { role: 'user', content: '请帮我审查这份合同的违约条款，看看有什么风险', time: '10:00' },
      { role: 'assistant', content: `该合同第12条违约责任存在以下风险：

**主要风险点：**
1. **违约金上限不明确**：合同未约定违约金最高比例，可能导致争议
2. **不可抗力条款范围过窄**：仅列举了自然灾害，未涵盖政策变化、疫情等情形
3. **争议解决条款模糊**：仲裁机构选择不明确

**建议修改：**
- 明确违约金不超过合同总价的 20%
- 扩展不可抗力范围至政府行为、流行病等
- 指定具体仲裁委员会`, time: '10:02' },
    ],
  },
  {
    id: 'rc-004', agentName: '客服智能助手', user: 'user_7712', type: 'dislike',
    msgContent: '我的订单什么时候到', aiReply: '您的订单预计今天下午送达……',
    channel: 'H5', createTime: '2026-03-24 09:48',
    conversation: [
      { role: 'user', content: '我的订单什么时候到', time: '09:47' },
      { role: 'assistant', content: '您的订单预计今天下午送达……', time: '09:48' },
    ],
  },
  {
    id: 'rc-005', agentName: '竞品调研', user: 'user_2293', type: 'like',
    msgContent: '分析文心一言的市场表现', aiReply: '百度文心一言在企业市场具备独特优势……',
    channel: 'API', createTime: '2026-03-24 09:33',
    conversation: [
      { role: 'user', content: '分析文心一言的市场表现', time: '09:31' },
      { role: 'assistant', content: `百度文心一言在企业市场具备独特优势。

**市场表现：**
- 企业客户超过 6 万家，覆盖金融、政务、医疗等核心行业
- 与百度搜索、地图、文库深度整合，流量入口优势明显
- 文心大模型 4.0 在多项中文基准测试上位居前列

**劣势：**
- 国际化进展缓慢，海外用户认知度低
- 部分通用能力仍落后于 GPT-4`, time: '09:33' },
    ],
  },
  {
    id: 'rc-006', agentName: '数据报表生成', user: 'user_6618', type: 'like',
    msgContent: '生成本月销售数据报表', aiReply: '根据数据库查询结果，本月销售总额为……',
    channel: 'MCP', createTime: '2026-03-24 09:20',
    conversation: [
      { role: 'user', content: '生成本月销售数据报表', time: '09:15' },
      { role: 'assistant', content: `根据数据库查询结果，本月销售总额为 **¥3,284,500**。

**分品类汇总：**
| 品类 | 销售额 | 环比 |
|------|--------|------|
| 电子产品 | ¥1,120,000 | +8.3% |
| 服装 | ¥856,000 | -2.1% |
| 食品 | ¥673,500 | +15.6% |
| 其他 | ¥635,000 | +3.2% |

报表已生成，可点击下方链接下载 Excel 版本。`, time: '09:20' },
    ],
  },
  {
    id: 'rc-007', agentName: '知识问答助手', user: 'user_1190', type: 'dislike',
    msgContent: 'API的调用限制是多少？', aiReply: '默认情况下，API调用频率限制为……',
    channel: 'H5', createTime: '2026-03-24 09:05',
    conversation: [
      { role: 'user', content: 'API的调用限制是多少？', time: '09:04' },
      { role: 'assistant', content: '默认情况下，API调用频率限制为……', time: '09:05' },
    ],
  },
  {
    id: 'rc-008', agentName: '法务合同审查', user: 'user_9912', type: 'like',
    msgContent: '知识产权条款有什么风险？', aiReply: '合同第15条知识产权归属条款存在背景技术保护缺失……',
    channel: 'API', createTime: '2026-03-23 17:22',
    conversation: [
      { role: 'user', content: '知识产权条款有什么风险？', time: '17:20' },
      { role: 'assistant', content: `合同第15条知识产权归属条款存在背景技术保护缺失的问题。

**风险分析：**
1. **背景技术界定不清**：未明确哪些是合作前已有技术，可能被合作方主张所有权
2. **派生作品归属模糊**：AI 生成内容的知识产权归属未作约定
3. **保密期限过短**：仅约定 2 年保密期，对于核心技术明显不足

**建议：** 在签署前增设知识产权附录，逐一列明背景技术清单。`, time: '17:22' },
    ],
  },
];

// ─── 数据中心子组件：对话记录 ─────────────────────────────────────────────────

const ConvRecordsTab: React.FC = () => {
  const [search, setSearch] = useState('');
  const [agentFilter, setAgentFilter] = useState('all');

  const filtered = MOCK_CONV_RECORDS.filter(r => {
    const matchSearch = !search || r.agentName.includes(search) || r.user.includes(search);
    const matchAgent = agentFilter === 'all' || r.agentName === agentFilter;
    return matchSearch && matchAgent;
  });

  const agentNames = Array.from(new Set(MOCK_CONV_RECORDS.map(r => r.agentName)));

  const columns: ColumnsType<ConvRecord> = [
    { title: '对话ID', dataIndex: 'id', width: 110, render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#6366F1' }}>{v}</span> },
    { title: '智能体', dataIndex: 'agentName', width: 140, render: (v: string) => <span style={{ fontWeight: 600, fontSize: 13 }}>{v}</span> },
    { title: '用户', dataIndex: 'user', width: 110, render: (v: string) => <span style={{ fontSize: 12, color: '#666' }}>{v}</span> },
    { title: '渠道', dataIndex: 'channel', width: 80, render: (v: string) => <Tag style={{ fontSize: 11 }}>{v}</Tag> },
    { title: '消息数', dataIndex: 'msgCount', width: 80, sorter: (a, b) => a.msgCount - b.msgCount, render: (v: number) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{v}</span> },
    { title: '时长', dataIndex: 'duration', width: 100, render: (v: string) => <span style={{ fontSize: 12, color: '#888' }}>{v}</span> },
    { title: '状态', dataIndex: 'status', width: 90, render: (v: string) => (
      v === 'completed'
        ? <Badge status="success" text={<span style={{ fontSize: 12 }}>已完成</span>} />
        : <Badge status="warning" text={<span style={{ fontSize: 12 }}>已中断</span>} />
    ) },
    { title: '开始时间', dataIndex: 'startTime', width: 150, render: (v: string) => <span style={{ fontSize: 12, color: '#999' }}>{v}</span> },
    { title: '操作', width: 70, fixed: 'right' as const, render: () => (
      <Button type="link" size="small" style={{ color: '#6366F1', padding: 0, fontSize: 12 }}>查看</Button>
    ) },
  ];

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={12} style={{ marginBottom: 20 }}>
        {[
          { label: '总对话数', value: MOCK_CONV_RECORDS.length, icon: <MessageOutlined />, color: '#6366F1', bg: '#EEF2FF' },
          { label: '已完成', value: MOCK_CONV_RECORDS.filter(r => r.status === 'completed').length, icon: <CheckCircleOutlined />, color: '#10B981', bg: '#D1FAE5' },
          { label: '平均消息数', value: Math.round(MOCK_CONV_RECORDS.reduce((s, r) => s + r.msgCount, 0) / MOCK_CONV_RECORDS.length), icon: <BarChartOutlined />, color: '#3B82F6', bg: '#DBEAFE' },
          { label: '今日对话', value: MOCK_CONV_RECORDS.length, icon: <ClockCircleOutlined />, color: '#F59E0B', bg: '#FEF3C7' },
        ].map((item, idx) => (
          <Col span={6} key={idx}>
            <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color, fontSize: 16, flexShrink: 0 }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: item.color, fontFamily: 'monospace', lineHeight: 1 }}>{item.value}</div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* 过滤栏 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#bbb' }} />}
          placeholder="搜索智能体或用户"
          value={search}
          onChange={e => setSearch(e.target.value)}
          allowClear
          style={{ width: 220 }}
        />
        <Select value={agentFilter} onChange={setAgentFilter} style={{ width: 160 }}>
          <Select.Option value="all">全部智能体</Select.Option>
          {agentNames.map(n => <Select.Option key={n} value={n}>{n}</Select.Option>)}
        </Select>
        <Button onClick={() => { setSearch(''); setAgentFilter('all'); }}>重置</Button>
        <Button icon={<ExportOutlined />} style={{ marginLeft: 'auto' }}>导出</Button>
      </div>

      <Table<ConvRecord>
        rowKey="id"
        dataSource={filtered}
        columns={columns}
        size="middle"
        scroll={{ x: 'max-content' }}
        pagination={{ pageSize: 10, showTotal: total => `共 ${total} 条`, showSizeChanger: true }}
        locale={{ emptyText: '暂无对话记录' }}
      />
    </div>
  );
};

// ─── 数据中心子组件：用户反馈 ─────────────────────────────────────────────────

const FeedbackTab: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = MOCK_FEEDBACK.filter(r => {
    const matchSearch = !search || r.content.includes(search);
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusColor: Record<string, string> = { '待解决': 'orange', '处理中': 'blue', '已解决': 'green' };

  const columns: ColumnsType<FeedbackRecord> = [
    { title: '序号', width: 60, render: (_, __, idx) => idx + 1 },
    { title: '反馈内容', dataIndex: 'content', render: (v: string) => <span style={{ fontSize: 13 }}>{v}</span> },
    { title: '状态', dataIndex: 'status', width: 90, render: (v: string) => <Tag color={statusColor[v]} style={{ fontSize: 11 }}>{v}</Tag> },
    { title: '类型', dataIndex: 'type', width: 100, render: (v: string) => <Tag color="red" style={{ fontSize: 11 }}>{v}</Tag> },
    { title: '联系人', dataIndex: 'contact', width: 90, render: (v: string) => <span style={{ fontSize: 13 }}>{v}</span> },
    { title: '联系方式', dataIndex: 'phone', width: 130, render: (v: string) => <span style={{ fontSize: 12, color: '#666' }}>{v}</span> },
    { title: '微信ID', dataIndex: 'wechatId', width: 90, render: (v: string) => <span style={{ fontSize: 12, color: '#666' }}>{v}</span> },
    { title: '机器人ID', dataIndex: 'agentId', width: 90, render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span> },
    { title: '创建时间', dataIndex: 'createTime', width: 160, render: (v: string) => <span style={{ fontSize: 12, color: '#999' }}>{v}</span> },
    { title: '操作', width: 130, fixed: 'right' as const, render: (_, r) => (
      <Space size={4}>
        <Button type="link" size="small" style={{ color: '#6366F1', padding: 0, fontSize: 12 }}
          onClick={() => message.success(`已解决反馈 ${r.id}`)}>解决</Button>
        <Button type="link" size="small" style={{ color: '#6366F1', padding: 0, fontSize: 12 }}>搁置</Button>
        <Button type="link" size="small" danger style={{ padding: 0, fontSize: 12 }}
          onClick={() => message.success('已删除')}>删除</Button>
      </Space>
    ) },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#bbb' }} />}
          placeholder="请输入反馈内容"
          value={search}
          onChange={e => setSearch(e.target.value)}
          allowClear
          style={{ width: 300 }}
        />
        <Select value={statusFilter} onChange={setStatusFilter} placeholder="请选择状态" style={{ width: 180 }}>
          <Select.Option value="all">全部状态</Select.Option>
          <Select.Option value="待解决">待解决</Select.Option>
          <Select.Option value="处理中">处理中</Select.Option>
          <Select.Option value="已解决">已解决</Select.Option>
        </Select>
        <Button onClick={() => { setSearch(''); setStatusFilter('all'); }}>重置</Button>
        <Button type="primary" style={{ background: '#6366F1', borderColor: '#6366F1' }}
          onClick={() => message.success('查询完成')}>查询</Button>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#bbb' }}>展开 ∨</span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <Button icon={<ExportOutlined />}>导出</Button>
        <Button danger disabled={selected.length === 0} onClick={() => { setSelected([]); message.success('已删除'); }}>删除</Button>
      </div>
      <Table<FeedbackRecord>
        rowKey="id"
        dataSource={filtered}
        columns={columns}
        size="middle"
        scroll={{ x: 'max-content' }}
        rowSelection={{ selectedRowKeys: selected, onChange: keys => setSelected(keys as string[]) }}
        pagination={{ pageSize: 10, showTotal: total => `共 ${total} 条记录`, showSizeChanger: true }}
        locale={{ emptyText: '暂无反馈数据' }}
      />
    </div>
  );
};

// ─── 数据中心子组件：点赞点踩记录 ────────────────────────────────────────────

const ReactionTab: React.FC = () => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'like' | 'dislike'>('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [viewRecord, setViewRecord] = useState<(ReactionRecord & { conversation: ReactionMessage[] }) | null>(null);

  const filtered = MOCK_REACTIONS.filter(r => {
    const matchSearch = !search || r.agentName.includes(search) || r.user.includes(search) || r.msgContent.includes(search);
    const matchType = typeFilter === 'all' || r.type === typeFilter;
    const matchAgent = agentFilter === 'all' || r.agentName === agentFilter;
    return matchSearch && matchType && matchAgent;
  });

  const likeCount = MOCK_REACTIONS.filter(r => r.type === 'like').length;
  const dislikeCount = MOCK_REACTIONS.filter(r => r.type === 'dislike').length;
  const likeRate = Math.round((likeCount / MOCK_REACTIONS.length) * 100);

  const agentNames = Array.from(new Set(MOCK_REACTIONS.map(r => r.agentName)));

  const columns: ColumnsType<ReactionRecord & { conversation: ReactionMessage[] }> = [
    { title: '类型', dataIndex: 'type', width: 80, render: (v: 'like' | 'dislike') => (
      v === 'like'
        ? <span style={{ color: '#6366F1', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 500 }}><LikeOutlined /> 点赞</span>
        : <span style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 500 }}><DislikeOutlined /> 点踩</span>
    ) },
    { title: '智能体', dataIndex: 'agentName', width: 130, render: (v: string) => <span style={{ fontWeight: 600, fontSize: 13 }}>{v}</span> },
    { title: '用户', dataIndex: 'user', width: 110, render: (v: string) => <span style={{ fontSize: 12, color: '#666' }}>{v}</span> },
    { title: '用户消息', dataIndex: 'msgContent', render: (v: string) => (
      <Tooltip title={v}>
        <span style={{ fontSize: 12, color: '#333', display: 'block', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span>
      </Tooltip>
    ) },
    { title: 'AI 回复摘要', dataIndex: 'aiReply', render: (v: string) => (
      <Tooltip title={v}>
        <span style={{ fontSize: 12, color: '#666', display: 'block', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span>
      </Tooltip>
    ) },
    { title: '渠道', dataIndex: 'channel', width: 80, render: (v: string) => <Tag style={{ fontSize: 11 }}>{v}</Tag> },
    { title: '时间', dataIndex: 'createTime', width: 140, render: (v: string) => <span style={{ fontSize: 12, color: '#999' }}>{v}</span> },
    { title: '操作', width: 80, fixed: 'right' as const, render: (_: unknown, r: ReactionRecord & { conversation: ReactionMessage[] }) => (
      <Button type="link" size="small" style={{ color: '#6366F1', padding: 0, fontSize: 12 }} onClick={() => setViewRecord(r)}>查看对话</Button>
    ) },
  ];

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={12} style={{ marginBottom: 20 }}>
        {[
          { label: '总反馈数', value: MOCK_REACTIONS.length, icon: <MessageOutlined />, color: '#6366F1', bg: '#EEF2FF' },
          { label: '点赞数', value: likeCount, icon: <LikeOutlined />, color: '#10B981', bg: '#D1FAE5' },
          { label: '点踩数', value: dislikeCount, icon: <DislikeOutlined />, color: '#EF4444', bg: '#FEE2E2' },
          { label: '好评率', value: `${likeRate}%`, icon: <BarChartOutlined />, color: '#3B82F6', bg: '#DBEAFE' },
        ].map((item, idx) => (
          <Col span={6} key={idx}>
            <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color, fontSize: 16, flexShrink: 0 }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: item.color, fontFamily: 'monospace', lineHeight: 1 }}>{item.value}</div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* 类型快捷筛选 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        {([
          { key: 'all', label: '全部', count: MOCK_REACTIONS.length },
          { key: 'like', label: '点赞', count: likeCount },
          { key: 'dislike', label: '点踩', count: dislikeCount },
        ] as { key: 'all' | 'like' | 'dislike'; label: string; count: number }[]).map(item => (
          <button
            key={item.key}
            onClick={() => setTypeFilter(item.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 14px', borderRadius: 20, cursor: 'pointer',
              fontSize: 13, fontWeight: typeFilter === item.key ? 600 : 400,
              border: typeFilter === item.key ? '1px solid #6366F1' : '1px solid #e8e8e8',
              background: typeFilter === item.key ? '#EEF2FF' : '#fff',
              color: typeFilter === item.key ? '#6366F1' : '#555',
              transition: 'all 0.15s',
            }}
          >
            {item.key === 'like' && <LikeOutlined style={{ fontSize: 12 }} />}
            {item.key === 'dislike' && <DislikeOutlined style={{ fontSize: 12 }} />}
            {item.label}
            <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 10, fontWeight: 600, background: typeFilter === item.key ? '#6366F1' : '#f0f0f0', color: typeFilter === item.key ? '#fff' : '#888' }}>
              {item.count}
            </span>
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Input
            prefix={<SearchOutlined style={{ color: '#bbb' }} />}
            placeholder="搜索智能体、用户或内容"
            value={search}
            onChange={e => setSearch(e.target.value)}
            allowClear
            style={{ width: 240 }}
          />
          <Select value={agentFilter} onChange={setAgentFilter} style={{ width: 150 }}>
            <Select.Option value="all">全部智能体</Select.Option>
            {agentNames.map(n => <Select.Option key={n} value={n}>{n}</Select.Option>)}
          </Select>
          <Button onClick={() => { setSearch(''); setTypeFilter('all'); setAgentFilter('all'); }}>重置</Button>
          <Button icon={<ExportOutlined />}>导出</Button>
        </div>
      </div>

      <Table<ReactionRecord & { conversation: ReactionMessage[] }>
        rowKey="id"
        dataSource={filtered}
        columns={columns}
        size="middle"
        scroll={{ x: 'max-content' }}
        pagination={{ pageSize: 10, showTotal: total => `共 ${total} 条`, showSizeChanger: true }}
        locale={{ emptyText: '暂无点赞点踩记录' }}
        rowClassName={(r) => r.type === 'dislike' ? 'reaction-dislike-row' : ''}
      />

      <style>{`
        .reaction-dislike-row > td { background: #fffaf9 !important; }
        .reaction-dislike-row:hover > td { background: #fff5f5 !important; }
      `}</style>

      <Drawer
        title={
          <Space>
            <MessageOutlined />
            <span>对话详情</span>
            {viewRecord && (
              <Tag style={{ margin: 0, fontSize: 11 }}>{viewRecord.agentName}</Tag>
            )}
          </Space>
        }
        placement="right"
        width={520}
        open={!!viewRecord}
        onClose={() => setViewRecord(null)}
        styles={{ body: { padding: '20px', background: '#f5f5f5' } }}
      >
        {viewRecord && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 基本信息 */}
            <div style={{ background: '#fff', borderRadius: 10, padding: '14px 16px', border: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <div><div style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>用户</div><div style={{ fontSize: 13, fontWeight: 500 }}>{viewRecord.user}</div></div>
                <div><div style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>渠道</div><Tag style={{ fontSize: 11 }}>{viewRecord.channel}</Tag></div>
                <div><div style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>时间</div><div style={{ fontSize: 13 }}>{viewRecord.createTime}</div></div>
                <div><div style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>反馈</div>
                  {viewRecord.type === 'like'
                    ? <span style={{ color: '#6366F1', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}><LikeOutlined /> 点赞</span>
                    : <span style={{ color: '#EF4444', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}><DislikeOutlined /> 点踩</span>}
                </div>
              </div>
            </div>
            {/* 对话内容 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {viewRecord.conversation.map((msg, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: msg.role === 'user' ? '#6366F1' : 'linear-gradient(135deg, #10B981 0%, #34d399 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700,
                  }}>
                    {msg.role === 'user' ? 'U' : 'A'}
                  </div>
                  <div style={{ maxWidth: '80%' }}>
                    <div style={{
                      background: msg.role === 'user' ? '#6366F1' : '#fff',
                      color: msg.role === 'user' ? '#fff' : '#333',
                      borderRadius: msg.role === 'user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                      padding: '10px 14px', fontSize: 13, lineHeight: 1.7,
                      border: msg.role === 'assistant' ? '1px solid #f0f0f0' : 'none',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {msg.content}
                    </div>
                    <div style={{ fontSize: 11, color: '#bbb', marginTop: 4, textAlign: msg.role === 'user' ? 'right' : 'left' }}>{msg.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

// ─── 数据中心组件 ─────────────────────────────────────────────────────────────

const DataCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState('conv');

  return (
    <div>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'conv', label: <span><MessageOutlined style={{ marginRight: 4 }} />对话记录</span>, children: <ConvRecordsTab /> },
          { key: 'feedback', label: <span><CheckCircleOutlined style={{ marginRight: 4 }} />用户反馈</span>, children: <FeedbackTab /> },
          { key: 'reaction', label: <span><LikeOutlined style={{ marginRight: 4 }} />点赞点踩记录</span>, children: <ReactionTab /> },
        ]}
        style={{ marginTop: -8 }}
      />
    </div>
  );
};

// ─── 主组件 ───────────────────────────────────────────────────────────────────

const AgentList: React.FC<AgentListProps> = ({
  onCreateAgent,
  onEditAgent,
  onDeleteAgent,
}) => {
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('mine');
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  // 筛选条件
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');

  // 数据
  const [dataSource, setDataSource] = useState<AgentData[]>(INIT_DATA);

  // 版本控制状态
  const [historyAgent, setHistoryAgent] = useState<AgentData | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [previewState, setPreviewState] = useState<{ agentKey: string; version: AgentVersion } | null>(null);
  const [publishAgentKey, setPublishAgentKey] = useState<string | null>(null);

  // 发布版本
  const handlePublishVersion = (key: string, version: string, changelog: string, scope: VisibilityScope, channels: string[]) => {
    const agent = dataSource.find(a => a.key === key);
    if (!agent) return;
    const ver: AgentVersion = {
      versionId: version, version, changelog, publishedAt: now(), publishedBy: '当前用户', scope,
      snapshot: { name: agent.name, description: agent.description, type: agent.type },
    };
    const ev: AgentHistoryEvent = {
      id: `h${Date.now()}`, kind: 'publish', time: now(), user: '当前用户',
      desc: version, version: ver,
    };
    setDataSource(prev => prev.map(a => a.key === key
      ? { ...a, currentVersion: version, savedStatus: 'published' as const, status: channels, agentHistory: [...(a.agentHistory || []), ev] }
      : a
    ));
    message.success(`版本 ${version} 已发布至：${channels.join('、')}`);
    setPublishAgentKey(null);
  };

  // 回滚
  const handleRollback = (agent: AgentData, ver: AgentVersion) => {
    setDataSource(prev => prev.map(a => a.key === agent.key
      ? { ...a, name: ver.snapshot.name, description: ver.snapshot.description, savedStatus: 'draft' as const, currentVersion: ver.version }
      : a
    ));
    setPreviewState(null);
    message.success(`已回滚至 ${ver.version}`);
  };

  // 下架
  const handleUnpublish = (key: string) => {
    setDataSource(prev => prev.map(a => a.key === key ? { ...a, savedStatus: 'saved' as const } : a));
    message.success('已下架');
  };

  // 删除
  const handleDelete = (key: string, name: string) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除「${name}」吗？此操作不可撤销。`,
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        setDataSource(prev => prev.filter(a => a.key !== key));
        onDeleteAgent?.(key);
        message.success('删除成功');
      },
    });
  };

  const handleTypeSelect = (type: 'rag' | 'autonomous' | 'collaborative') => {
    setShowTypeModal(false);
    onCreateAgent?.(type);
  };

  // 筛选逻辑
  const filteredDataSource = dataSource.filter(agent => {
    const matchesSearch = searchText === '' || agent.name.toLowerCase().includes(searchText.toLowerCase()) || agent.description.toLowerCase().includes(searchText.toLowerCase());
    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'autonomous' && agent.type === 'autonomous') ||
      (typeFilter === 'collaborative' && agent.type === 'collaborative') ||
      (typeFilter === 'rag' && agent.type === 'rag');
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'published' && agent.savedStatus === 'published') ||
      (statusFilter === 'draft' && agent.savedStatus === 'draft') ||
      (statusFilter === 'saved' && agent.savedStatus === 'saved');
    const matchesChannel =
      channelFilter === 'all' || agent.status.includes(channelFilter);
    return matchesSearch && matchesType && matchesStatus && matchesChannel;
  });

  const handleResetFilters = () => {
    setSearchText('');
    setTypeFilter('all');
    setStatusFilter('all');
    setChannelFilter('all');
  };

  // 复用智能体（从智能体中心复制一份草稿到我的智能体）
  const handleReuseAgent = (agent: AgentData) => {
    const newKey = `reuse-${Date.now()}`;
    const newAgent: AgentData = {
      ...agent,
      key: newKey,
      id: Date.now(),
      name: `${agent.name}（复用）`,
      creator: '当前用户',
      department: '我的',
      createTime: now(),
      savedStatus: 'draft',
      currentVersion: undefined,
      agentHistory: [],
    };
    setDataSource(prev => [newAgent, ...prev]);
    message.success(`已复用「${agent.name}」，已添加到我的智能体（草稿）`);
    setActiveTab('mine');
  };

  // 智能体中心数据（已发布到共享渠道的智能体，用于展示，只读）
  const sharedAgents: AgentData[] = [
    ...dataSource.filter(a => a.savedStatus === 'published' && (a.status.includes('共享') || a.status.includes('广场'))),
    {
      key: 'center-1', id: 101, name: '法务合同审查', description: '智能审查合同条款，识别风险条款、不平等条款，提供修改建议，支持多类型合同',
      creator: '陈磊', department: '法务部门', createTime: '2026-01-10 10:00:00',
      status: ['广场', '共享'], type: 'autonomous',
      skillCount: 3, skills: ['PDF解析', '文本分析', '知识库检索'],
      currentVersion: 'v1.3.0', savedStatus: 'published',
      agentHistory: [{ id: 'h1', kind: 'publish', time: '2026-01-10 10:00:00', user: '陈磊', desc: 'v1.3.0', version: { versionId: 'v1.3.0', version: 'v1.3.0', changelog: '支持更多合同类型', publishedAt: '2026-01-10 10:00', publishedBy: '陈磊', scope: 'public', snapshot: { name: '法务合同审查', description: '智能合同审查', type: 'autonomous' } } }],
    },
    {
      key: 'center-2', id: 102, name: '数据报表生成', description: '自动连接数据源，生成可视化报表和趋势分析，支持 Excel/PDF 导出',
      creator: '刘洋', department: '数据部门', createTime: '2026-01-15 14:00:00',
      status: ['广场', '共享', 'API'], type: 'autonomous',
      skillCount: 4, skills: ['Python执行器', '数据分析', '图表生成', 'API调用'],
      currentVersion: 'v2.1.0', savedStatus: 'published',
      agentHistory: [{ id: 'h1', kind: 'publish', time: '2026-01-15 14:00:00', user: '刘洋', desc: 'v2.1.0', version: { versionId: 'v2.1.0', version: 'v2.1.0', changelog: '新增趋势预测功能', publishedAt: '2026-01-15 14:00', publishedBy: '刘洋', scope: 'public', snapshot: { name: '数据报表生成', description: '自动数据报表', type: 'autonomous' } } }],
    },
    {
      key: 'center-3', id: 103, name: '跨部门项目协作', description: '协调多部门资源，自动分解任务并分配给各智能体，实时同步进度',
      creator: '王芳', department: '项目管理', createTime: '2026-01-18 09:00:00',
      status: ['共享'], type: 'collaborative',
      skillCount: 6, skills: ['任务调度', '进度追踪', '消息通知', '文档生成', 'API调用', '数据分析'],
      currentVersion: 'v1.0.0', savedStatus: 'published',
      agentHistory: [{ id: 'h1', kind: 'publish', time: '2026-01-18 09:00:00', user: '王芳', desc: 'v1.0.0', version: { versionId: 'v1.0.0', version: 'v1.0.0', changelog: '首次发布', publishedAt: '2026-01-18 09:00', publishedBy: '王芳', scope: 'team', snapshot: { name: '跨部门项目协作', description: '多部门协同', type: 'collaborative' } } }],
    },
  ];

  const filteredSharedAgents = sharedAgents.filter(a =>
    searchText === '' || a.name.toLowerCase().includes(searchText.toLowerCase()) || a.description.toLowerCase().includes(searchText.toLowerCase())
  );

  const publishAgent = dataSource.find(a => a.key === publishAgentKey);

  // 统计数据
  const statsData = {
    all: dataSource.length,
    published: dataSource.filter(a => a.savedStatus === 'published').length,
    draft: dataSource.filter(a => a.savedStatus === 'draft').length,
    saved: dataSource.filter(a => a.savedStatus === 'saved').length,
  };

  // 智能体管理内容（作为外层tab的子页面）
  const agentManagementContent = (
    <div className="agent-list-container">
      {/* 历史版本预览 Banner */}
      {previewState && (() => {
        const previewAgent = dataSource.find(a => a.key === previewState.agentKey);
        const ver = previewState.version;
        return (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 20px', background: '#fef3c7', border: '1px solid #fcd34d',
            borderRadius: 8, marginBottom: 16, fontSize: 13,
          }}>
            <Space>
              <EyeOutlined style={{ color: '#d97706' }} />
              <span style={{ color: '#92400e', fontWeight: 500 }}>
                当前预览「{previewAgent?.name}」历史版本{' '}
                <Tag color="orange" style={{ fontFamily: 'monospace' }}>{ver.version}</Tag>
                发布于 {ver.publishedAt}，由 {ver.publishedBy} 提交
              </span>
            </Space>
            <Button icon={<CloseOutlined />} onClick={() => setPreviewState(null)} size="small">退出预览</Button>
          </div>
        );
      })()}

      {/* 标签页 */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'mine', label: '我的智能体' },
          { key: 'shared', label: '智能体中心' },
        ]}
        style={{ marginBottom: 4 }}
      />

      {/* ── 我的智能体 Tab ── */}
      {activeTab === 'mine' && (<>
      {/* 状态筛选 + 统计 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { key: 'all', label: '全部', count: statsData.all },
            { key: 'published', label: '已发布', count: statsData.published },
            { key: 'draft', label: '草稿', count: statsData.draft },
            { key: 'saved', label: '已下架', count: statsData.saved },
          ].map(item => (
            <button
              key={item.key}
              onClick={() => setStatusFilter(item.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 14px', borderRadius: 20, cursor: 'pointer',
                fontSize: 13, fontWeight: statusFilter === item.key ? 600 : 400,
                border: statusFilter === item.key ? '1px solid #6366F1' : '1px solid #e8e8e8',
                background: statusFilter === item.key ? '#EEF2FF' : '#fff',
                color: statusFilter === item.key ? '#6366F1' : '#555',
                transition: 'all 0.15s',
              }}
            >
              {item.label}
              <span style={{
                fontSize: 11, padding: '1px 6px', borderRadius: 10, fontWeight: 600,
                background: statusFilter === item.key ? '#6366F1' : '#f0f0f0',
                color: statusFilter === item.key ? '#fff' : '#888',
              }}>
                {item.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 搜索和筛选区域 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <Space size={8} style={{ flexWrap: 'wrap' }}>
          <Input
            placeholder="搜索智能体名称或描述"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined style={{ color: '#bbb' }} />}
            style={{ width: 220, borderRadius: 8 }}
            allowClear
          />
          <Select value={typeFilter} onChange={setTypeFilter} style={{ width: 150 }}>
            <Select.Option value="all">全部类型</Select.Option>
            <Select.Option value="autonomous">自主规划</Select.Option>
            <Select.Option value="collaborative">多应用协同</Select.Option>
            <Select.Option value="rag">RAG 智能体</Select.Option>
          </Select>
          <Select value={channelFilter} onChange={setChannelFilter} style={{ width: 140 }}>
            <Select.Option value="all">全部渠道</Select.Option>
            <Select.Option value="广场">智能体广场</Select.Option>
            <Select.Option value="共享">团队共享</Select.Option>
            <Select.Option value="API">API 调用</Select.Option>
            <Select.Option value="MCP">MCP 协议</Select.Option>
          </Select>
          <RangePicker placeholder={['创建开始', '创建结束']} style={{ width: 240 }} />
          <Button onClick={handleResetFilters}>重置</Button>
        </Space>

        <Space>
          {/* 视图切换 */}
          <div style={{ display: 'flex', border: '1px solid #e8e8e8', borderRadius: 8, overflow: 'hidden' }}>
            <button
              onClick={() => setViewMode('card')}
              style={{
                padding: '5px 10px', cursor: 'pointer', border: 'none',
                background: viewMode === 'card' ? '#EEF2FF' : '#fff',
                color: viewMode === 'card' ? '#6366F1' : '#888',
              }}
            >
              <AppstoreOutlined />
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '5px 10px', cursor: 'pointer', border: 'none', borderLeft: '1px solid #e8e8e8',
                background: viewMode === 'list' ? '#EEF2FF' : '#fff',
                color: viewMode === 'list' ? '#6366F1' : '#888',
              }}
            >
              <UnorderedListOutlined />
            </button>
          </div>

          <span style={{ fontSize: 13, color: '#999' }}>
            共 <strong style={{ color: '#333' }}>{filteredDataSource.length}</strong> 个智能体
          </span>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setShowTypeModal(true)}
            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', border: 'none', borderRadius: 8 }}
          >
            创建智能体
          </Button>
        </Space>
      </div>

      {/* 卡片网格 */}
      {filteredDataSource.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#bbb' }}>
          <RobotOutlined style={{ fontSize: 48, marginBottom: 16 }} />
          <div style={{ fontSize: 14 }}>暂无符合条件的智能体</div>
          <div style={{ fontSize: 12, marginTop: 6 }}>
            <span style={{ color: '#6366F1', cursor: 'pointer' }} onClick={handleResetFilters}>清除筛选条件</span>
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: viewMode === 'card'
            ? 'repeat(auto-fill, minmax(296px, 1fr))'
            : '1fr',
          gap: 16,
        }}>
          {filteredDataSource.map(agent => (
            viewMode === 'card' ? (
              <AgentCard
                key={agent.key}
                agent={agent}
                onEdit={(key) => onEditAgent?.(key)}
                onPublish={(key) => setPublishAgentKey(key)}
                onUnpublish={handleUnpublish}
                onDelete={handleDelete}
                onHistory={(a) => { setHistoryAgent(a); setHistoryOpen(true); }}
              />
            ) : (
              // 列表视图（紧凑行）
              <div
                key={agent.key}
                onClick={() => onEditAgent?.(agent.key)}
                style={{
                  background: '#fff', border: '1px solid #f0f0f0', borderRadius: 10,
                  padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 16,
                  transition: 'all 0.15s', cursor: 'pointer',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLElement).style.borderColor = '#c4b5fd'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.borderColor = '#f0f0f0'; }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                  background: getAvatarColor(agent.name),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 16, fontWeight: 700,
                }}>
                  {agent.name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{agent.name}</span>
                    <Tag style={{ margin: 0, fontSize: 11, background: TYPE_CONFIG[agent.type].bg, color: TYPE_CONFIG[agent.type].color, borderColor: `${TYPE_CONFIG[agent.type].color}30`, padding: '0 5px' }}>
                      {TYPE_CONFIG[agent.type].label}
                    </Tag>
                    {agent.currentVersion && (
                      <Tag style={{ margin: 0, fontSize: 11, color: '#888', fontFamily: 'monospace', padding: '0 5px' }}>{agent.currentVersion}</Tag>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {agent.description}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_CONFIG[agent.savedStatus || 'draft'].dotColor }} />
                  <span style={{ fontSize: 12, color: STATUS_CONFIG[agent.savedStatus || 'draft'].color }}>{STATUS_CONFIG[agent.savedStatus || 'draft'].label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <span style={{ fontSize: 12, color: '#bbb' }}>{agent.creator}</span>
                  <span style={{ fontSize: 12, color: '#ddd' }}>·</span>
                  <span style={{ fontSize: 12, color: '#bbb' }}>{agent.createTime.slice(0, 10)}</span>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <Dropdown menu={{ items: [
                    { key: 'publish', icon: <CloudUploadOutlined />, label: agent.savedStatus === 'published' ? '下架' : '发布', onClick: () => agent.savedStatus === 'published' ? handleUnpublish(agent.key) : setPublishAgentKey(agent.key) },
                    { key: 'history', icon: <HistoryOutlined />, label: '历史版本', onClick: () => { setHistoryAgent(agent); setHistoryOpen(true); } },
                    { type: 'divider' },
                    { key: 'delete', icon: <DeleteOutlined />, label: '删除', danger: true, onClick: () => handleDelete(agent.key, agent.name) },
                  ] }} trigger={['click']} placement="bottomRight">
                    <Button size="small" icon={<EllipsisOutlined />} onClick={e => e.stopPropagation()} style={{ borderRadius: 6 }} />
                  </Dropdown>
                </div>
              </div>
            )
          ))}
        </div>
      )}
      </>)} {/* end mine tab */}

      {/* ── 智能体中心 Tab ── */}
      {activeTab === 'shared' && (
        <div>
          {/* 说明栏 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: '10px 16px', background: '#f0f9ff', borderRadius: 10, border: '1px solid #bae6fd' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>👀</span>
              <span style={{ fontSize: 13, color: '#0369a1' }}>智能体中心仅支持查看和复用，复用后将在「我的智能体」中生成草稿副本，可自由编辑。</span>
            </div>
            <Space>
              <Input
                placeholder="搜索智能体"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                prefix={<SearchOutlined style={{ color: '#bbb' }} />}
                style={{ width: 200, borderRadius: 8 }}
                allowClear
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setShowTypeModal(true)}
                style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', border: 'none', borderRadius: 8 }}
              >
                新建智能体
              </Button>
            </Space>
          </div>

          {filteredSharedAgents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#bbb' }}>
              <RobotOutlined style={{ fontSize: 48, marginBottom: 16 }} />
              <div style={{ fontSize: 14 }}>暂无共享的智能体</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(296px, 1fr))', gap: 16 }}>
              {filteredSharedAgents.map(agent => {
                const typeConf = TYPE_CONFIG[agent.type];
                const avatarBg = getAvatarColor(agent.name);
                return (
                  <div
                    key={agent.key}
                    onClick={() => onEditAgent?.(agent.key)}
                    style={{
                      background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0',
                      overflow: 'hidden', display: 'flex', flexDirection: 'column',
                      transition: 'all 0.2s', opacity: 1, cursor: 'pointer',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.borderColor = '#c4b5fd'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.borderColor = '#f0f0f0'; }}
                  >
                    {/* 类型色带 */}
                    <div style={{ height: 4, background: typeConf.color, flexShrink: 0 }} />
                    <div style={{ padding: '16px 16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {/* 头部 */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 700 }}>
                          {agent.name.charAt(0)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{agent.name}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Tag style={{ margin: 0, fontSize: 11, fontWeight: 500, background: typeConf.bg, color: typeConf.color, border: `1px solid ${typeConf.color}30`, borderRadius: 4, padding: '0 6px' }}>
                              {agent.type === 'collaborative' ? <><TeamOutlined style={{ marginRight: 3 }} />{typeConf.label}</> : agent.type === 'rag' ? <><DatabaseOutlined style={{ marginRight: 3 }} />{typeConf.label}</> : <><RobotOutlined style={{ marginRight: 3 }} />{typeConf.label}</>}
                            </Tag>
                            {agent.currentVersion && (
                              <Tag style={{ margin: 0, fontSize: 11, background: '#fafafa', color: '#888', borderColor: '#e8e8e8', fontFamily: 'monospace', padding: '0 5px' }}>{agent.currentVersion}</Tag>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* 描述 */}
                      <p style={{ margin: 0, fontSize: 13, color: '#666', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                        {agent.description || '暂无描述'}
                      </p>
                      {/* 技能 */}
                      {agent.skills && agent.skills.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                          <ThunderboltOutlined style={{ fontSize: 11, color: '#94a3b8' }} />
                          {agent.skills.slice(0, 3).map(skill => (
                            <Tag key={skill} style={{ margin: 0, fontSize: 11, padding: '0 5px', background: '#f8f9ff', color: '#6366F1', borderColor: '#e0e7ff' }}>{skill}</Tag>
                          ))}
                          {agent.skills.length > 3 && <Tag style={{ margin: 0, fontSize: 11, padding: '0 5px', color: '#94a3b8', borderColor: '#e8e8e8' }}>+{agent.skills.length - 3}</Tag>}
                        </div>
                      )}
                    </div>
                    {/* 底部操作栏 */}
                    <div style={{ padding: '10px 16px', borderTop: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Avatar size={18} style={{ background: avatarBg, fontSize: 10 }}>{agent.creator.charAt(0)}</Avatar>
                        <span style={{ fontSize: 12, color: '#888' }}>{agent.creator}</span>
                        <span style={{ fontSize: 12, color: '#ccc' }}>·</span>
                        <span style={{ fontSize: 12, color: '#bbb' }}>{agent.department}</span>
                      </div>
                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={(e) => { e.stopPropagation(); handleReuseAgent(agent); }}
                        style={{ borderRadius: 6, fontSize: 12, height: 26, borderColor: '#6366F1', color: '#6366F1' }}
                      >
                        复用
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 创建智能体类型弹窗 */}
      <Modal
        title="新建智能体"
        open={showTypeModal}
        onCancel={() => setShowTypeModal(false)}
        footer={null}
        width={560}
        centered
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '12px 0' }}>
          {[
            {
              type: 'rag' as const,
              title: 'RAG 智能体',
              desc: '基于 RAG 配置智能体，可自主进行私域知识库精准检索 + 大模型生成，企业知识问答优选。',
              tags: ['知识库', '精准检索', '私域问答'],
              bg: 'linear-gradient(135deg, #fde8e8 0%, #fce4d0 100%)',
              color: '#ef4444',
            },
            {
              type: 'autonomous' as const,
              title: '自主规划智能体',
              desc: '具备自主规划、知识库调用、工具调用、Skills 调用 + 大模型生成，适合独立完成的任务场景。',
              tags: ['Skills', '自主规划', '独立执行'],
              bg: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
              color: '#6366F1',
            },
            {
              type: 'collaborative' as const,
              title: '多应用协同智能体',
              desc: '多个应用协同工作，通过调度智能体分配任务，适合复杂的多领域协作场景。',
              tags: ['多应用协同', '任务协同', '分工合作'],
              bg: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
              color: '#3B82F6',
            },
          ].map(item => (
            <div
              key={item.type}
              onClick={() => handleTypeSelect(item.type)}
              style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
                border: '1px solid #f0f0f0', borderRadius: 12, cursor: 'pointer',
                background: '#fafafa', transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = item.color;
                e.currentTarget.style.background = '#fafafa';
                e.currentTarget.style.boxShadow = `0 4px 12px ${item.color}20`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#f0f0f0';
                e.currentTarget.style.background = '#fafafa';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                width: 56, height: 56, borderRadius: 10, flexShrink: 0,
                background: item.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, color: item.color, fontWeight: 700,
              }}>
                {item.type === 'rag' ? '📚' : item.type === 'autonomous' ? '🤖' : '🧩'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, color: '#1a1a1a' }}>{item.title}</div>
                <div style={{ color: '#888', fontSize: 13, lineHeight: 1.5, marginBottom: 8 }}>{item.desc}</div>
                <Space size={6}>
                  {item.tags.map(tag => (
                    <Tag key={tag} style={{ margin: 0, fontSize: 12, background: `${item.color}12`, color: item.color, borderColor: `${item.color}30` }}>
                      {tag}
                    </Tag>
                  ))}
                </Space>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* 历史版本抽屉 */}
      <AgentHistoryDrawer
        agent={historyAgent}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onRollback={handleRollback}
        previewVersion={previewState?.agentKey === historyAgent?.key ? previewState?.version || null : null}
        onPreviewVersion={(ver) => { if (historyAgent) { setPreviewState({ agentKey: historyAgent.key, version: ver }); setHistoryOpen(false); } }}
        onExitPreview={() => setPreviewState(null)}
      />

      {/* 发布版本 Modal */}
      {publishAgent && (
        <PublishAgentModal
          open={!!publishAgentKey}
          latestVersion={getLatestVersion(publishAgent)}
          onClose={() => setPublishAgentKey(null)}
          onPublish={(version, changelog, scope, channels) => handlePublishVersion(publishAgentKey!, version, changelog, scope, channels)}
        />
      )}
    </div>
  );

  return (
    <div>
      <Tabs
        defaultActiveKey="management"
        items={[
          {
            key: 'management',
            label: <span><RobotOutlined style={{ marginRight: 4 }} />智能体管理</span>,
            children: agentManagementContent,
          },
          {
            key: 'datacenter',
            label: <span><DatabaseOutlined style={{ marginRight: 4 }} />数据中心</span>,
            children: <DataCenter />,
          },
        ]}
      />
    </div>
  );
};

export default AgentList;
