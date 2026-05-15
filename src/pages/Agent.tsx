import React, { useState } from 'react';
import {
  Button,
  Input,
  Select,
  Switch,
  Collapse,
  Avatar,
  Space,
  Divider,
  Drawer,
  Tag,
  Checkbox,
  Empty,
  Dropdown,
  MenuProps,
  Modal,
  Timeline,
  message,
  Tabs,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  FileTextOutlined,
  PlusOutlined,
  RightOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  FileAddOutlined,
  DownloadOutlined,
  UploadOutlined,
  CloudUploadOutlined,
  HistoryOutlined,
  TagOutlined,
  SaveOutlined,
  RollbackOutlined,
  EyeOutlined,
  FileTextOutlined as FileTextIcon,
  CloseOutlined,
  CheckCircleOutlined,
  ToolOutlined,
  DatabaseOutlined,
  ThunderboltOutlined,
  SendOutlined,
  CopyOutlined,
  DownOutlined,
} from '@ant-design/icons';
import './Agent.css';
import { AgentSettingsDrawer } from '../components/AgentSettingsDrawer';
import { PromptTemplateModal, PromptTemplate } from '../components/PromptTemplateModal';
import { SaveTemplateModal } from '../components/SaveTemplateModal';
import type { ModeConfigFormData } from '../types/agent-config.types';

const { TextArea } = Input;
const { Panel } = Collapse;

// ─── 类型定义 ────────────────────────────────────────────────────────────────

type VisibilityScope = 'private' | 'team' | 'public';

interface AgentVersion {
  versionId: string;
  version: string;
  changelog: string;
  publishedAt: string;
  publishedBy: string;
  scope: VisibilityScope;
  snapshot: {
    name: string;
    prompt: string;
    model: string;
  };
}

interface AgentHistoryEvent {
  id: string;
  kind: 'save' | 'publish';
  time: string;
  user: string;
  desc: string;
  version?: AgentVersion;
}

interface Tool {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: string;
}

// ─── 工具函数 ────────────────────────────────────────────────────────────────

const nowStr = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

const SCOPE_LABELS: Record<VisibilityScope, string> = {
  private: '仅自己',
  team: '团队内',
  public: '公开',
};

// ─── API 密钥管理组件 ──────────────────────────────────────────────────────────

interface ApiToken {
  id: string;
  tokenShort: string;
  created: string;
  validity: string;
  expired: boolean;
  active: boolean;
}

const ApiTokenManager: React.FC<{
  tokens: ApiToken[];
  setTokens: React.Dispatch<React.SetStateAction<ApiToken[]>>;
}> = ({ tokens, setTokens }) => {
  const createToken = (validity: string) => {
    const validityLabel = validity === 'permanent' ? '永久有效' : validity === '7d' ? '7天有效' : '1天有效';
    const newTok: ApiToken = {
      id: `${Date.now()}`,
      tokenShort: `sk-${Math.random().toString(36).slice(2, 18)}...`,
      created: new Date().toISOString().slice(0, 19).replace('T', ' '),
      validity: validityLabel,
      expired: false,
      active: true,
    };
    setTokens(prev => [...prev, newTok]);
    message.success('密钥创建成功，请妥善保管');
  };

  const newKeyMenuItems: MenuProps['items'] = [
    { key: '1d', label: '1天有效', onClick: () => createToken('1d') },
    { key: '7d', label: '7天有效', onClick: () => createToken('7d') },
    { key: 'permanent', label: '永久有效', onClick: () => createToken('permanent') },
  ];

  return (
    <div>
      <div style={{ paddingTop: 16, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>访问凭证管理</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>密钥为全局通用凭证，同时用于 API 接口鉴权和 H5 网页访问验证，请定期轮换密钥</div>
        </div>
        <Dropdown menu={{ items: newKeyMenuItems }} placement="bottomRight">
          <Button
            type="primary"
            size="small"
            style={{ background: '#6366F1', border: 'none', borderRadius: 6 }}
          >
            新建密钥 <DownOutlined style={{ fontSize: 10 }} />
          </Button>
        </Dropdown>
      </div>
      <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#fafafa' }}>
              {['Token', '创建时间', '有效期', '是否过期', '状态', '操作'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 500, color: '#555', borderBottom: '1px solid #f0f0f0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tokens.map(tok => (
              <tr key={tok.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'monospace', color: '#555' }}>
                    {tok.tokenShort}
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      style={{ color: '#bbb', padding: '0 4px', height: 'auto' }}
                      onClick={() => message.success('已复制')}
                    />
                  </div>
                </td>
                <td style={{ padding: '12px 14px', color: '#666' }}>{tok.created}</td>
                <td style={{ padding: '12px 14px' }}>
                  <Tag color={tok.validity === '永久有效' ? 'purple' : 'orange'} style={{ margin: 0 }}>
                    {tok.validity}
                  </Tag>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <Tag color={tok.expired ? 'red' : 'orange'} style={{ margin: 0 }}>
                    {tok.expired ? '已过期' : '未过期'}
                  </Tag>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: tok.active ? '#22c55e' : '#d1d5db' }} />
                    <span style={{ color: tok.active ? '#16a34a' : '#6b7280' }}>正常</span>
                  </div>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <Space size={8}>
                    <Switch
                      checked={tok.active}
                      size="small"
                      onChange={(checked) => setTokens(prev => prev.map(t => t.id === tok.id ? { ...t, active: checked } : t))}
                      style={{ background: tok.active ? '#6366F1' : undefined }}
                    />
                    <Button
                      type="link"
                      danger
                      size="small"
                      style={{ padding: 0 }}
                      onClick={() => {
                        Modal.confirm({
                          title: '确认删除密钥',
                          content: '删除后该密钥立即失效，相关接口调用将中断。',
                          okButtonProps: { danger: true },
                          onOk: () => setTokens(prev => prev.filter(t => t.id !== tok.id)),
                        });
                      }}
                    >
                      删除
                    </Button>
                  </Space>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── 发布弹窗 ─────────────────────────────────────────────────────────────────

const PublishAgentModal: React.FC<{
  open: boolean;
  latestVersion: string;
  shopEnabled: boolean; setShopEnabled: (v: boolean) => void;
  shopCategory: string[]; setShopCategory: (v: string[]) => void;
  shopScope: string; setShopScope: (v: string) => void;
  shareEnabled: boolean; setShareEnabled: (v: boolean) => void;
  apiEnabled: boolean; setApiEnabled: (v: boolean) => void;
  apiTokens: ApiToken[]; setApiTokens: React.Dispatch<React.SetStateAction<ApiToken[]>>;
  onClose: () => void;
  onPublish: (version: string, changelog: string, channels: string[]) => void;
}> = ({
  open, latestVersion,
  shopEnabled, setShopEnabled,
  shopCategory, setShopCategory,
  shopScope, setShopScope,
  shareEnabled, setShareEnabled,
  apiEnabled, setApiEnabled,
  apiTokens, setApiTokens,
  onClose, onPublish,
}) => {
  const [version, setVersion] = useState('');
  const [changelog, setChangelog] = useState('');

  React.useEffect(() => {
    if (open) {
      setVersion(latestVersion);
      setChangelog('');
    }
  }, [open, latestVersion]);

  const handleConfirm = () => {
    if (!/^v\d+\.\d+\.\d+$/.test(version)) {
      message.error('版本号格式不正确，需为 vX.Y.Z');
      return;
    }
    const channels: string[] = [
      ...(shopEnabled ? ['广场'] : []),
      ...(shareEnabled ? ['共享'] : []),
      ...(apiEnabled ? ['API'] : []),
    ];
    if (channels.length === 0) {
      message.warning('请至少开启一个发布渠道');
      return;
    }
    onPublish(version, changelog, channels);
    onClose();
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'linear-gradient(135deg, #e8e7ff 0%, #d4d3ff 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <CloudUploadOutlined style={{ color: '#6366F1', fontSize: 20 }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1a1a1a' }}>发布智能体</div>
            <div style={{ fontWeight: 400, fontSize: 13, color: '#888', marginTop: 2 }}>
              选择发布渠道并填写版本信息
            </div>
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={
        <Space>
          <Button onClick={onClose} style={{ minWidth: 72 }}>取消</Button>
          <Button
            type="primary"
            icon={<CloudUploadOutlined />}
            onClick={handleConfirm}
            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', border: 'none', minWidth: 96 }}
          >
            确认发布
          </Button>
        </Space>
      }
      width={600}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: '8px 0 4px' }}>

        {/* ── 发布渠道（与发布 Tab 完全一致） ── */}
        <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#6366F1', color: '#fff', fontSize: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>1</span>
          发布渠道
        </div>

        {/* 内部发布 */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>内部发布</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

            {/* 智能体广场 */}
            <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e8e8e8', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏪</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>智能体广场</div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 1 }}>将智能体上架到智能体广场，供全员发现和使用</div>
                  </div>
                </div>
                <Switch checked={shopEnabled} onChange={setShopEnabled} style={{ background: shopEnabled ? '#6366F1' : undefined }} />
              </div>
              {shopEnabled && (
                <div style={{ padding: '0 16px 14px', borderTop: '1px solid #f5f5f5', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ paddingTop: 12 }}>
                    <div style={{ fontSize: 12, color: '#555', fontWeight: 500, marginBottom: 6 }}>应用分类</div>
                    <Select
                      mode="multiple"
                      value={shopCategory}
                      onChange={setShopCategory}
                      style={{ width: '100%' }}
                      placeholder="选择分类标签"
                      options={[
                        { value: '开发', label: '开发' },
                        { value: '数据分析', label: '数据分析' },
                        { value: '内容创作', label: '内容创作' },
                        { value: '客服', label: '客服' },
                        { value: '营销', label: '营销' },
                        { value: '法务', label: '法务' },
                        { value: '财务', label: '财务' },
                        { value: '研究', label: '研究' },
                      ]}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#555', fontWeight: 500, marginBottom: 6 }}>可见范围</div>
                    <Select
                      value={shopScope}
                      onChange={setShopScope}
                      style={{ width: '100%' }}
                      options={[
                        { value: '全公司可见', label: '全公司可见' },
                        { value: '仅本部门', label: '仅本部门' },
                        { value: '指定成员', label: '指定成员' },
                      ]}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 团队共享 */}
            <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e8e8e8', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👥</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>团队共享</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 1 }}>共享到「智能体中心」列表，允许成员查看和复用配置</div>
                </div>
              </div>
              <Switch checked={shareEnabled} onChange={setShareEnabled} style={{ background: shareEnabled ? '#10B981' : undefined }} />
            </div>
          </div>
        </div>

        {/* 外部调用 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>外部调用</div>
            <span style={{ fontSize: 11, background: '#FEF3C7', color: '#D97706', padding: '1px 6px', borderRadius: 8, fontWeight: 500 }}>需审批</span>
          </div>
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e8e8e8', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🔗</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>API 调用</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 1 }}>通过 API 接口对外提供服务，支持外部系统集成</div>
              </div>
            </div>
            <Switch checked={apiEnabled} onChange={setApiEnabled} style={{ background: apiEnabled ? '#F59E0B' : undefined }} />
          </div>
          {apiEnabled && (
            <div style={{ padding: '0 16px 14px', borderTop: '1px solid #f5f5f5' }}>
              <ApiTokenManager tokens={apiTokens} setTokens={setApiTokens} />
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px solid #f0f0f0', marginBottom: 16 }} />

        {/* ── 版本信息 ── */}
        <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#6366F1', color: '#fff', fontSize: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>2</span>
          版本信息
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 版本号 */}
          <div>
            <div style={{ fontWeight: 500, marginBottom: 8, fontSize: 13, color: '#555' }}>
              版本号 <span style={{ color: '#ff4d4f' }}>*</span>
              <span style={{ color: '#999', fontSize: 12, fontWeight: 400, marginLeft: 8 }}>
                上次版本：<span style={{ fontFamily: 'monospace', color: '#6366F1' }}>{latestVersion}</span>
              </span>
            </div>
            <Input
              value={version}
              onChange={e => setVersion(e.target.value)}
              placeholder="vX.Y.Z"
              style={{ fontSize: 14, borderRadius: 8, fontFamily: 'monospace' }}
              prefix={<TagOutlined style={{ color: '#6366F1' }} />}
            />
          </div>
          {/* 版本说明 */}
          <div>
            <div style={{ fontWeight: 500, marginBottom: 8, fontSize: 13, color: '#555' }}>
              版本说明 <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: 13 }}>（可选）</span>
            </div>
            <TextArea
              value={changelog}
              onChange={e => setChangelog(e.target.value)}
              rows={3}
              placeholder="简要描述本次版本的变更内容…"
              maxLength={500}
              showCount
              style={{ borderRadius: 8, resize: 'none' }}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ─── 历史版本抽屉 ─────────────────────────────────────────────────────────────

const AgentVersionDrawer: React.FC<{
  open: boolean;
  onClose: () => void;
  history: AgentHistoryEvent[];
  previewVersion: AgentVersion | null;
  onPreviewVersion: (ver: AgentVersion) => void;
  onExitPreview: () => void;
  onRollback: (ver: AgentVersion) => void;
}> = ({ open, onClose, history, previewVersion, onPreviewVersion, onExitPreview, onRollback }) => {
  const isPreview = !!previewVersion;

  const handleRollback = (ver: AgentVersion) => {
    Modal.confirm({
      title: `回滚至 ${ver.version} 版本`,
      content: (
        <div style={{ paddingTop: 8 }}>
          <div style={{ border: '1px solid #e8e8e8', borderRadius: 8, padding: '14px 16px', marginBottom: 16, background: '#fafafa' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>回滚版本 {ver.version}</span>
              <span style={{ fontSize: 13, color: '#999' }}>{ver.publishedBy} · {ver.publishedAt}</span>
            </div>
            <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
              {ver.changelog || `将智能体恢复至 ${ver.version} 版本配置。`}
            </div>
          </div>
          <div style={{ fontWeight: 600, fontSize: 14, color: '#111', marginBottom: 10 }}>此操作会：</div>
          <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>编辑器内容替换为 {ver.version} 版本的配置快照</li>
            <li style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>草稿更新为目标版本内容，覆盖当前编辑内容</li>
            <li style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>历史记录保留，可随时回滚到其他版本</li>
          </ul>
        </div>
      ),
      okText: '确认回滚',
      cancelText: '取消',
      okButtonProps: { style: { background: '#1a1a1a', borderColor: '#1a1a1a', borderRadius: 8 } },
      width: 520,
      onOk: () => { onRollback(ver); onClose(); },
    });
  };

  return (
    <Drawer
      title={
        <Space>
          <HistoryOutlined />
          <span>历史版本</span>
          <Tag style={{ fontSize: 11, margin: 0 }}>{history.length} 条记录</Tag>
        </Space>
      }
      placement="right"
      width={480}
      open={open}
      onClose={onClose}
      styles={{ body: { padding: '20px 24px' } }}
    >
      {/* 草稿入口 */}
      <div
        onClick={isPreview ? () => { onExitPreview(); onClose(); } : undefined}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', marginBottom: 16, borderRadius: 10,
          cursor: isPreview ? 'pointer' : 'default',
          background: !isPreview ? '#f0fdf4' : '#f0f9ff',
          border: !isPreview ? '1.5px solid #86efac' : '1px solid #bae6fd',
        }}
      >
        <Space size={8}>
          <FileTextIcon style={{ color: isPreview ? '#0ea5e9' : '#16a34a', fontSize: 16 }} />
          <span style={{ fontSize: 14, color: isPreview ? '#0369a1' : '#15803d', fontWeight: 500 }}>
            草稿（当前编辑版本）
          </span>
        </Space>
        {!isPreview
          ? <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 500 }}>当前</span>
          : <span style={{ fontSize: 12, color: '#0369a1' }}>点击返回草稿</span>
        }
      </div>

      <Divider style={{ margin: '0 0 20px', fontSize: 12, color: '#94a3b8' }}>
        {history.length} 条历史记录
      </Divider>

      <Timeline
        items={[...history].reverse().map(ev => ({
          dot: ev.kind === 'publish'
            ? <TagOutlined style={{ color: '#6366F1', fontSize: 15 }} />
            : <SaveOutlined style={{ color: '#94a3b8', fontSize: 13 }} />,
          color: ev.kind === 'publish' ? '#6366F1' : '#cbd5e1',
          children: ev.kind === 'publish' && ev.version ? (
            <div style={{
              border: '1px solid #e8e8e8', borderRadius: 10,
              padding: '16px', background: '#fff', marginBottom: 8,
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 15, color: '#6366F1' }}>
                  {ev.version.version}
                </span>
                <Tag color="blue" style={{ margin: 0, fontSize: 12, borderRadius: 4 }}>正式发布</Tag>
                {isPreview && previewVersion?.versionId === ev.version.versionId && (
                  <Tag color="orange" style={{ margin: 0, fontSize: 11 }}>预览中</Tag>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr', rowGap: 8, fontSize: 13, marginBottom: 12 }}>
                <span style={{ color: '#94a3b8' }}>提交人</span>
                <span style={{ color: '#1f2937', fontWeight: 500 }}>{ev.version.publishedBy}</span>
                <span style={{ color: '#94a3b8' }}>发布时间</span>
                <span style={{ color: '#1f2937' }}>{ev.version.publishedAt}</span>
                <span style={{ color: '#94a3b8' }}>权限范围</span>
                <span>
                  <Tag style={{ margin: 0, fontSize: 12, borderRadius: 4 }}>{SCOPE_LABELS[ev.version.scope]}</Tag>
                </span>
              </div>
              {ev.version.changelog && (
                <div style={{
                  fontSize: 13, color: '#6366F1', background: '#f5f3ff',
                  borderRadius: 6, padding: '8px 12px', marginBottom: 14,
                }}>
                  <span style={{ color: '#94a3b8', marginRight: 6 }}>版本说明</span>
                  {ev.version.changelog}
                </div>
              )}
              <Space size={8}>
                <Button
                  icon={<EyeOutlined />}
                  onClick={() => { onPreviewVersion(ev.version!); onClose(); }}
                  style={{ borderRadius: 6 }}
                >
                  查看版本
                </Button>
                <Button
                  icon={<RollbackOutlined />}
                  onClick={() => handleRollback(ev.version!)}
                  style={{ borderRadius: 6 }}
                >
                  回滚
                </Button>
              </Space>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '2px 0', marginBottom: 4 }}>
              <Space size={6}>
                <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{ev.desc}</span>
                <Tag style={{ margin: 0, fontSize: 11, color: '#64748b', borderColor: '#cbd5e1', background: '#f8fafc', borderRadius: 4 }}>草稿保存</Tag>
              </Space>
              <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap', flexShrink: 0 }}>{ev.user} · {ev.time}</span>
            </div>
          ),
        }))}
      />
    </Drawer>
  );
};

// 技能接口
interface Skill {
  id: string;
  name: string;
  icon: string;
  color: string;
  category: string;
  published: boolean;
}

const Agent: React.FC = () => {
  // 从 URL hash 读取智能体类型
  const agentType = (() => {
    const hash = window.location.hash.slice(1);
    const params = hash.split('?')[1] || '';
    return new URLSearchParams(params).get('type') || 'autonomous';
  })();
  const isRag = agentType === 'rag';

  const [agentName, setAgentName] = useState('竞品调研');
  const [activeTab, setActiveTab] = useState('config');
  const [modelType, setModelType] = useState('chat-model');
  const [promptText, setPromptText] = useState(`思考与回答逻辑
请气要求
你是一个严谨、专业的知识库问答助手。你的唯一任务是依据资料库中的内容来回答用户的问题。

1. 优先检索：当用户提问时，请务必先检索关联的知识内容。
2. 依据事实：请严格基于检索到的信息进行回答，不要发散，不要编造知识库中不存在的事实。
3. 无果处理：如果知识库中没有相关信息，请直接回答：\"抱歉，当前知识库中暂无相关内容。\"`);
  const [fileUploadEnabled, setFileUploadEnabled] = useState(false);
  const [isPublished, setIsPublished] = useState(true);

  // Skills相关状态
  const [showSkillDrawer, setShowSkillDrawer] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [skillSearchKeyword, setSkillSearchKeyword] = useState('');

  // 工具调用相关状态
  const [showToolModal, setShowToolModal] = useState(false);
  const [selectedTools, setSelectedTools] = useState<Tool[]>([]);
  const [toolSearchKeyword, setToolSearchKeyword] = useState('');

  // 模式配置抽屉
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

  // 模板管理相关状态
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);

  // 调试预览输入
  const [previewInput, setPreviewInput] = useState('');

  // 版本控制状态
  const [agentHistory, setAgentHistory] = useState<AgentHistoryEvent[]>([
    {
      id: 'h1', kind: 'publish', time: '2026-01-20 09:00:00', user: '巩娜', desc: 'v1.0.0',
      version: { versionId: 'v1.0.0', version: 'v1.0.0', changelog: '首次发布', publishedAt: '2026-01-20 09:00', publishedBy: '巩娜', scope: 'team', snapshot: { name: '竞品调研', prompt: '', model: 'chat-model' } },
    },
    { id: 'h2', kind: 'save', time: '2026-01-22 14:00:00', user: '巩娜', desc: '优化提示词与工具配置' },
    {
      id: 'h3', kind: 'publish', time: '2026-01-25 01:45:38', user: '巩娜', desc: 'v1.1.0',
      version: { versionId: 'v1.1.0', version: 'v1.1.0', changelog: '新增数据分析技能，优化搜索策略', publishedAt: '2026-01-25 01:45', publishedBy: '巩娜', scope: 'team', snapshot: { name: '竞品调研', prompt: '', model: 'chat-model' } },
    },
  ]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<AgentVersion | null>(null);
  const [currentVersion, setCurrentVersion] = useState('v1.1.0');

  // 发布渠道配置（在「发布」Tab 中持久化配置）
  const [shopEnabled, setShopEnabled] = useState(true);
  const [shopCategory, setShopCategory] = useState<string[]>(['开发']);
  const [shopScope, setShopScope] = useState('全公司可见');
  const [shareEnabled, setShareEnabled] = useState(true);
  const [apiEnabled, setApiEnabled] = useState(false);
  const [apiTokens, setApiTokens] = useState<ApiToken[]>([
    { id: '1', tokenShort: 'sk-Z0FBQUFBQnB3QlRRRGx...', created: '2026-03-23 00:12:01', validity: '永久有效', expired: false, active: true },
    { id: '2', tokenShort: 'sk-Z0FBQUFBQnB3QlRRRIZ0w...', created: '2026-03-23 00:11:52', validity: '1天有效', expired: false, active: true },
  ]);

  const getLatestVersion = (): string => {
    const last = [...agentHistory].reverse().find(h => h.kind === 'publish');
    return last?.desc || 'v1.0.0';
  };

  const handlePublish = (version: string, changelog: string, channels: string[]) => {
    const scope: VisibilityScope = channels.includes('广场') ? 'public' : channels.includes('共享') ? 'team' : 'private';
    const ver: AgentVersion = {
      versionId: version, version, changelog,
      publishedAt: nowStr(), publishedBy: '当前用户', scope,
      snapshot: { name: agentName, prompt: promptText, model: modelType },
    };
    const ev: AgentHistoryEvent = {
      id: `h${Date.now()}`, kind: 'publish', time: nowStr(), user: '当前用户',
      desc: version, version: ver,
    };
    setAgentHistory(prev => [...prev, ev]);
    setCurrentVersion(version);
    setIsPublished(true);
    message.success(`版本 ${version} 发布成功`);
  };

  const handleRollback = (ver: AgentVersion) => {
    setAgentName(ver.snapshot.name);
    setPromptText(ver.snapshot.prompt);
    setModelType(ver.snapshot.model);
    setCurrentVersion(ver.version);
    setPreviewVersion(null);
    message.success(`已回滚至 ${ver.version}`);
  };

  // 所有已发布的技能列表（模拟数据）
  const allPublishedSkills: Skill[] = [
    { id: '1', name: '写作', icon: '✏️', color: '#F59E0B', category: '内容创作', published: true },
    { id: '2', name: 'PPT制作', icon: '📊', color: '#EF4444', category: '办公工具', published: true },
    { id: '3', name: '视频编辑', icon: '🎬', color: '#F97316', category: '多媒体', published: true },
    { id: '4', name: '设计', icon: '🎨', color: '#EC4899', category: '创意设计', published: true },
    { id: '5', name: '数据分析', icon: '📈', color: '#10B981', category: '数据处理', published: true },
    { id: '6', name: '编程辅助', icon: '💻', color: '#3B82F6', category: '开发工具', published: true },
    { id: '7', name: '翻译', icon: '🌍', color: '#8B5CF6', category: '语言工具', published: true },
    { id: '8', name: '思维导图', icon: '🧠', color: '#06B6D4', category: '思维工具', published: true },
  ];

  // 所有工具列表
  const allTools: Tool[] = [
    { id: 't1', name: '网页搜索', icon: '🔍', description: '实时搜索互联网信息', category: '搜索工具' },
    { id: 't2', name: 'Python执行器', icon: '🐍', description: '执行Python代码并返回结果', category: '代码工具' },
    { id: 't3', name: 'PDF解析', icon: '📄', description: '解析PDF文件内容', category: '文档工具' },
    { id: 't4', name: '数据分析', icon: '📊', description: '分析结构化数据并生成图表', category: '数据工具' },
    { id: 't5', name: '图片生成', icon: '🎨', description: '根据描述生成图片', category: '多媒体工具' },
    { id: 't6', name: 'API调用', icon: '🔗', description: '调用外部API获取数据', category: '接口工具' },
    { id: 't7', name: '文件读写', icon: '📁', description: '读写本地或云端文件', category: '文件工具' },
    { id: 't8', name: '数据库查询', icon: '🗄️', description: '查询SQL/NoSQL数据库', category: '数据工具' },
  ];

  const filteredTools = allTools.filter(tool =>
    tool.name.toLowerCase().includes(toolSearchKeyword.toLowerCase()) ||
    tool.description.toLowerCase().includes(toolSearchKeyword.toLowerCase())
  );

  // 过滤后的技能列表
  const filteredSkills = allPublishedSkills.filter(skill =>
    skill.name.toLowerCase().includes(skillSearchKeyword.toLowerCase()) ||
    skill.category.toLowerCase().includes(skillSearchKeyword.toLowerCase())
  );

  // 添加技能
  const handleAddSkill = (skill: Skill) => {
    if (!selectedSkills.find(s => s.id === skill.id)) {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  // 移除技能
  const handleRemoveSkill = (skillId: string) => {
    setSelectedSkills(selectedSkills.filter(s => s.id !== skillId));
  };

  // 切换技能选择
  const handleToggleSkill = (skill: Skill) => {
    if (selectedSkills.find(s => s.id === skill.id)) {
      handleRemoveSkill(skill.id);
    } else {
      handleAddSkill(skill);
    }
  };

  // 工具操作
  const handleToggleTool = (tool: Tool) => {
    if (selectedTools.find(t => t.id === tool.id)) {
      setSelectedTools(selectedTools.filter(t => t.id !== tool.id));
    } else {
      setSelectedTools([...selectedTools, tool]);
    }
  };

  const handleRemoveTool = (toolId: string) => {
    setSelectedTools(selectedTools.filter(t => t.id !== toolId));
  };

  // 处理模式配置变化（实时保存）
  const handleModeConfigChange = (config: ModeConfigFormData) => {
    console.log('模式配置变化:', config);
  };

  // 模板菜单项
  const templateMenuItems: MenuProps['items'] = [
    {
      key: 'import',
      label: '导入模板',
      icon: <DownloadOutlined />,
      onClick: () => setShowTemplateModal(true),
    },
    {
      key: 'save',
      label: '保存为模板',
      icon: <UploadOutlined />,
      onClick: () => setShowSaveTemplateModal(true),
    },
  ];

  // 使用模板
  const handleSelectTemplate = (template: PromptTemplate) => {
    setPromptText(template.content);
  };

  // 保存模板
  const handleSaveTemplate = (name: string, content: string) => {
    console.log('保存模板:', { name, content });
  };

  // 创建新模板
  const handleCreateNewTemplate = () => {
    setShowTemplateModal(false);
    setShowSaveTemplateModal(true);
  };

  const isReadOnly = !!previewVersion;

  const agentTypeLabel = isRag ? 'RAG' : '自主规划';
  const agentTypeColor = isRag ? '#10B981' : '#6366F1';

  // 建议的提示词
  const suggestedPrompts = [
    '帮我分析竞品的市场定位',
    '对比主要竞争对手的功能差异',
    '总结行业最新动态和趋势',
  ];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
      {/* 顶部栏 */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #e8e8e8',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '56px',
        flexShrink: 0,
      }}>
        {/* 左侧：返回 + 名称 + 类型标签 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => window.location.hash = 'agent'}
            style={{ padding: '4px 8px' }}
          />
          <Avatar
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              flexShrink: 0,
            }}
            size={32}
          >
            竞
          </Avatar>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Input
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              bordered={false}
              disabled={isReadOnly}
              style={{
                fontSize: '16px',
                fontWeight: 'bold',
                width: 'auto',
                maxWidth: '200px',
                padding: '0 4px',
              }}
            />
            {!isReadOnly && <Button type="text" icon={<EditOutlined />} size="small" />}
          </div>
          <Tag
            style={{
              background: `${agentTypeColor}15`,
              border: `1px solid ${agentTypeColor}40`,
              color: agentTypeColor,
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              padding: '0 8px',
            }}
          >
            {agentTypeLabel}
          </Tag>
        </div>

        {/* 中间：Tab */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'config', label: '配置' },
            { key: 'publish', label: '发布' },
            { key: 'evaluate', label: '评测' },
          ]}
          style={{ marginBottom: 0, height: '56px' }}
          tabBarStyle={{ borderBottom: 'none', margin: 0, height: '56px' }}
        />

        {/* 右侧：历史版本 + 发布 */}
        <Space size="small">
          {agentHistory.length > 0 && (
            <Button icon={<HistoryOutlined />} onClick={() => setHistoryOpen(true)}>
              历史版本
            </Button>
          )}
          {isPublished && (
            <Button
              onClick={() => { setIsPublished(false); message.success('已下架'); }}
              style={{ borderColor: '#d1d5db', color: '#6b7280' }}
            >
              下架
            </Button>
          )}
          <Button
            type="primary"
            icon={<CloudUploadOutlined />}
            onClick={() => setPublishOpen(true)}
            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', border: 'none' }}
          >
            发布
          </Button>
        </Space>
      </div>

      {/* 已发布提示 Banner */}
      {isPublished && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '8px', padding: '8px 20px',
          background: '#f0fdf4', borderBottom: '1px solid #86efac',
          fontSize: 13, color: '#15803d', flexShrink: 0,
        }}>
          <Space size={6}>
            <CheckCircleOutlined style={{ color: '#22c55e' }} />
            <span>当前版本 <strong>{currentVersion}</strong> 已发布 · 修改配置后可再次点击「发布」生成新版本</span>
          </Space>
        </div>
      )}

      {/* 历史版本预览 Banner */}
      {previewVersion && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 20px', background: '#fef3c7', borderBottom: '1px solid #fcd34d',
          fontSize: 13, flexShrink: 0,
        }}>
          <Space>
            <EyeOutlined style={{ color: '#d97706' }} />
            <span style={{ color: '#92400e', fontWeight: 500 }}>
              当前浏览的是历史版本{' '}
              <Tag color="orange" style={{ fontFamily: 'monospace', margin: '0 4px' }}>{previewVersion.version}</Tag>
              发布于 {previewVersion.publishedAt}，由 {previewVersion.publishedBy} 提交
            </span>
          </Space>
          <Button icon={<CloseOutlined />} size="small" onClick={() => setPreviewVersion(null)}>
            退出预览
          </Button>
        </div>
      )}

      {/* 主体：根据 Tab 切换内容 */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* ── 配置 Tab ── */}
      {activeTab === 'config' && (
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 左侧：配置区 */}
        <div style={{
          width: '360px',
          flexShrink: 0,
          background: '#fff',
          borderRight: '1px solid #e8e8e8',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a' }}>智能体配置</div>
          </div>

          <div style={{ padding: '0 0 80px' }}>
            {/* AI模型配置 */}
            <div style={{ borderBottom: '1px solid #f0f0f0' }}>
              <Collapse
                defaultActiveKey={['ai-config']}
                bordered={false}
                expandIconPosition="end"
                style={{ background: 'transparent' }}
              >
                <Panel
                  header={
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>AI模型配置</span>
                  }
                  key="ai-config"
                  style={{ padding: 0 }}
                >
                  <div style={{ padding: '0 20px 16px' }}>
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                        模型选择 <span style={{ color: '#ff4d4f' }}>*</span>
                      </div>
                      <Select
                        value={modelType}
                        onChange={setModelType}
                        style={{ width: '100%' }}
                        disabled={isReadOnly}
                      >
                        <Select.Option value="chat-model">chat-model</Select.Option>
                        <Select.Option value="gpt-4">GPT-4</Select.Option>
                        <Select.Option value="gpt-3.5">GPT-3.5</Select.Option>
                        <Select.Option value="glm-4">GLM-4</Select.Option>
                      </Select>
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>提示词</span>
                        {!isReadOnly && (
                          <Dropdown menu={{ items: templateMenuItems }} placement="bottomLeft">
                            <Button type="link" size="small" icon={<FileAddOutlined />} style={{ padding: 0, height: 'auto' }}>
                              模板
                            </Button>
                          </Dropdown>
                        )}
                      </div>
                      <TextArea
                        value={promptText}
                        onChange={(e) => setPromptText(e.target.value)}
                        placeholder="输入系统提示词..."
                        autoSize={{ minRows: 6, maxRows: 12 }}
                        style={{ resize: 'none', fontSize: '13px' }}
                        disabled={isReadOnly}
                      />
                    </div>
                  </div>
                </Panel>
              </Collapse>
            </div>

            {/* Skills — RAG智能体不显示 */}
            {!isRag && (
              <div style={{ borderBottom: '1px solid #f0f0f0' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 20px', cursor: 'pointer',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ThunderboltOutlined style={{ color: '#6366F1', fontSize: '14px' }} />
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>Skills</span>
                    {selectedSkills.length > 0 && (
                      <Tag color="purple" style={{ margin: 0, fontSize: '12px' }}>{selectedSkills.length}</Tag>
                    )}
                  </div>
                  {!isReadOnly && (
                    <Button
                      type="text"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => setShowSkillDrawer(true)}
                      style={{ color: '#6366F1' }}
                    />
                  )}
                </div>
                {selectedSkills.length > 0 && (
                  <div style={{ padding: '0 20px 14px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedSkills.map(skill => (
                      <Tag
                        key={skill.id}
                        closable={!isReadOnly}
                        onClose={() => handleRemoveSkill(skill.id)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: `${skill.color}15`,
                          border: `1px solid ${skill.color}40`,
                          color: skill.color,
                          fontSize: '12px',
                        }}
                      >
                        <span style={{ marginRight: '4px' }}>{skill.icon}</span>
                        {skill.name}
                      </Tag>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 知识库 */}
            <div
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 20px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DatabaseOutlined style={{ color: '#10B981', fontSize: '14px' }} />
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>知识库</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {!isReadOnly && <PlusOutlined style={{ color: '#666', fontSize: '13px' }} />}
                <RightOutlined style={{ fontSize: '12px', color: '#bbb' }} />
              </div>
            </div>

            {/* 工具调用 */}
            <div style={{ borderBottom: '1px solid #f0f0f0' }}>
              <div
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 20px', cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ToolOutlined style={{ color: '#F59E0B', fontSize: '14px' }} />
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>工具调用</span>
                  {selectedTools.length > 0 && (
                    <Tag color="orange" style={{ margin: 0, fontSize: '12px' }}>{selectedTools.length}</Tag>
                  )}
                </div>
                {!isReadOnly && (
                  <Button
                    type="text"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => setShowToolModal(true)}
                    style={{ color: '#F59E0B' }}
                  />
                )}
              </div>
              {selectedTools.length > 0 && (
                <div style={{ padding: '0 20px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedTools.map(tool => (
                    <div
                      key={tool.id}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: '#FFF7E6',
                        borderRadius: '8px',
                        border: '1px solid #FFD591',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px' }}>{tool.icon}</span>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 500, color: '#1a1a1a' }}>{tool.name}</div>
                          <div style={{ fontSize: '11px', color: '#999' }}>{tool.description}</div>
                        </div>
                      </div>
                      {!isReadOnly && (
                        <Button
                          type="text"
                          size="small"
                          icon={<CloseOutlined />}
                          onClick={() => handleRemoveTool(tool.id)}
                          style={{ color: '#bbb', padding: '2px' }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 文件上传 */}
            <div
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 20px', borderBottom: '1px solid #f0f0f0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>📎</span>
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>文件上传</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <QuestionCircleOutlined style={{ fontSize: '13px', color: '#bbb' }} />
                <Switch
                  checked={fileUploadEnabled}
                  onChange={isReadOnly ? undefined : setFileUploadEnabled}
                  size="small"
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：调试预览区 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: '#fafafa',
          overflow: 'hidden',
        }}>
          {/* 预览区头部 */}
          <div style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e8e8e8',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a' }}>调试预览</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#999' }}>
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
              <span>已自动保存</span>
            </div>
          </div>

          {/* 预览聊天区 */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column' }}>
            {/* 智能体信息卡片 */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: '32px',
              textAlign: 'center',
            }}>
              <Avatar
                size={64}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  fontSize: '28px',
                  marginBottom: '12px',
                }}
              >
                竞
              </Avatar>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a1a', marginBottom: '4px' }}>
                {agentName}
              </div>
              <div style={{ fontSize: '13px', color: '#999', marginBottom: '4px' }}>
                作者：巩娜 · 版本 {currentVersion}
              </div>
              <Tag
                style={{
                  background: `${agentTypeColor}15`,
                  border: `1px solid ${agentTypeColor}40`,
                  color: agentTypeColor,
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
              >
                {agentTypeLabel}
              </Tag>
            </div>

            {/* 建议提示词 */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '13px', color: '#999', marginBottom: '12px', textAlign: 'center' }}>
                试试这些问题
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {suggestedPrompts.map((prompt, idx) => (
                  <div
                    key={idx}
                    onClick={() => setPreviewInput(prompt)}
                    style={{
                      padding: '10px 16px',
                      background: '#fff',
                      border: '1px solid #e8e8e8',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: '#555',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = '#6366F1';
                      e.currentTarget.style.color = '#6366F1';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = '#e8e8e8';
                      e.currentTarget.style.color = '#555';
                    }}
                  >
                    {prompt}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 输入框 */}
          <div style={{
            padding: '16px 24px',
            background: '#fff',
            borderTop: '1px solid #e8e8e8',
          }}>
            <div style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-end',
              background: '#f5f5f5',
              borderRadius: '10px',
              padding: '10px 12px',
              border: '1px solid #e8e8e8',
            }}>
              <Input.TextArea
                value={previewInput}
                onChange={e => setPreviewInput(e.target.value)}
                placeholder="输入消息测试智能体..."
                bordered={false}
                autoSize={{ minRows: 1, maxRows: 4 }}
                style={{ background: 'transparent', resize: 'none', flex: 1, fontSize: '14px', padding: 0 }}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                disabled={!previewInput.trim()}
                style={{
                  background: previewInput.trim()
                    ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
                    : '#e0e0e0',
                  border: 'none',
                  borderRadius: '6px',
                  flexShrink: 0,
                }}
                onClick={() => {
                  message.info('调试模式下暂不支持实际发送');
                  setPreviewInput('');
                }}
              />
            </div>
          </div>
        </div>
      </div>
      )} {/* end config tab */}

      {/* ── 发布 Tab ── */}
      {activeTab === 'publish' && (
        <div style={{ flex: 1, overflowY: 'auto', background: '#f5f7fa', padding: '32px 40px' }}>
          <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* 内部发布 */}
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 16 }}>内部发布</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* 智能体广场 */}
                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏪</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>智能体广场</div>
                        <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>将智能体上架到智能体广场，供全员发现和使用</div>
                      </div>
                    </div>
                    <Switch checked={shopEnabled} onChange={setShopEnabled} style={{ background: shopEnabled ? '#6366F1' : undefined }} />
                  </div>
                  {shopEnabled && (
                    <div style={{ padding: '0 20px 20px', borderTop: '1px solid #f5f5f5', display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ paddingTop: 16 }}>
                        <div style={{ fontSize: 13, color: '#555', fontWeight: 500, marginBottom: 8 }}>应用分类</div>
                        <Select
                          mode="multiple"
                          value={shopCategory}
                          onChange={setShopCategory}
                          style={{ width: '100%' }}
                          placeholder="选择分类标签"
                          options={[
                            { value: '开发', label: '开发' },
                            { value: '数据分析', label: '数据分析' },
                            { value: '内容创作', label: '内容创作' },
                            { value: '客服', label: '客服' },
                            { value: '营销', label: '营销' },
                            { value: '法务', label: '法务' },
                            { value: '财务', label: '财务' },
                            { value: '研究', label: '研究' },
                          ]}
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, color: '#555', fontWeight: 500, marginBottom: 8 }}>可见范围</div>
                        <Select
                          value={shopScope}
                          onChange={setShopScope}
                          style={{ width: '100%' }}
                          options={[
                            { value: '全公司可见', label: '全公司可见' },
                            { value: '仅本部门', label: '仅本部门' },
                            { value: '指定成员', label: '指定成员' },
                          ]}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 团队共享 */}
                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>👥</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>团队共享</div>
                      <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>共享到「智能体中心」列表，允许成员查看和复用配置</div>
                    </div>
                  </div>
                  <Switch checked={shareEnabled} onChange={setShareEnabled} style={{ background: shareEnabled ? '#10B981' : undefined }} />
                </div>
              </div>
            </div>

            {/* 外部调用 */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>外部调用</span>
                <span style={{ fontSize: 12, background: '#FEF3C7', color: '#D97706', padding: '2px 8px', borderRadius: 10, fontWeight: 500 }}>需审批</span>
              </div>

              {/* API */}
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🔗</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>API 调用</div>
                      <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>通过 API 接口对外提供服务，支持外部系统集成</div>
                    </div>
                  </div>
                  <Switch checked={apiEnabled} onChange={setApiEnabled} style={{ background: apiEnabled ? '#F59E0B' : undefined }} />
                </div>

                {apiEnabled && (
                  <div style={{ padding: '0 20px 20px', borderTop: '1px solid #f5f5f5' }}>
                    <ApiTokenManager tokens={apiTokens} setTokens={setApiTokens} />
                  </div>
                )}
              </div>
            </div>

            {/* 发布提示 */}
            <div style={{ background: '#f0f9ff', borderRadius: 10, padding: '14px 18px', border: '1px solid #bae6fd', display: 'flex', gap: 10 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
              <div style={{ fontSize: 13, color: '#0369a1', lineHeight: 1.7 }}>
                配置好发布渠道后，点击右上角「发布」按钮填写版本号即可完成发布。渠道配置实时保存，无需重新发布即可生效范围变更。
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 评测 Tab ── */}
      {activeTab === 'evaluate' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa' }}>
          <div style={{ textAlign: 'center', color: '#bbb' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
            <div style={{ fontSize: 16, color: '#999', fontWeight: 500 }}>评测功能即将上线</div>
            <div style={{ fontSize: 13, color: '#bbb', marginTop: 6 }}>支持多维度自动化评测，持续优化智能体效果</div>
          </div>
        </div>
      )}

      </div> {/* end main content wrapper */}

      {/* Skills选择侧边栏 */}
      <Drawer
        title="选择Skills"
        placement="right"
        width={480}
        open={showSkillDrawer}
        onClose={() => setShowSkillDrawer(false)}
      >
        <div style={{ marginBottom: '20px' }}>
          <Input
            placeholder="搜索Skills..."
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            value={skillSearchKeyword}
            onChange={(e) => setSkillSearchKeyword(e.target.value)}
            allowClear
            style={{ borderRadius: '8px' }}
          />
        </div>
        {selectedSkills.length > 0 && (
          <div style={{
            padding: '12px',
            background: '#f0f5ff',
            borderRadius: '8px',
            marginBottom: '20px',
            color: '#1890ff',
            fontSize: '14px'
          }}>
            已选择 {selectedSkills.length} 个技能
          </div>
        )}
        <div>
          {filteredSkills.length > 0 ? (
            filteredSkills.map(skill => {
              const isSelected = selectedSkills.find(s => s.id === skill.id);
              return (
                <div
                  key={skill.id}
                  onClick={() => handleToggleSkill(skill)}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px solid ${isSelected ? skill.color : '#e8e8e8'}`,
                    background: isSelected ? `${skill.color}11` : '#fff',
                    marginBottom: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <div style={{
                      width: '40px', height: '40px',
                      background: `${skill.color}22`,
                      borderRadius: '8px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '20px',
                    }}>
                      {skill.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: '#262626', marginBottom: '4px' }}>
                        {skill.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{skill.category}</div>
                    </div>
                  </div>
                  <Checkbox checked={!!isSelected} onClick={(e) => { e.stopPropagation(); handleToggleSkill(skill); }} />
                </div>
              );
            })
          ) : (
            <Empty description="暂无匹配的技能" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </div>
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '16px 24px', background: '#fff', borderTop: '1px solid #e8e8e8',
          display: 'flex', gap: '12px',
        }}>
          <Button block onClick={() => { setShowSkillDrawer(false); setSkillSearchKeyword(''); }}>
            取消
          </Button>
          <Button type="primary" block onClick={() => { setShowSkillDrawer(false); setSkillSearchKeyword(''); }}>
            确定
          </Button>
        </div>
      </Drawer>

      {/* 工具选择 Modal */}
      <Modal
        title="添加工具"
        open={showToolModal}
        onCancel={() => { setShowToolModal(false); setToolSearchKeyword(''); }}
        onOk={() => { setShowToolModal(false); setToolSearchKeyword(''); message.success('工具配置已自动保存'); }}
        okText="确定"
        cancelText="取消"
        width={560}
      >
        <div style={{ marginBottom: '16px' }}>
          <Input
            placeholder="搜索工具..."
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            value={toolSearchKeyword}
            onChange={e => setToolSearchKeyword(e.target.value)}
            allowClear
            style={{ borderRadius: '8px' }}
          />
        </div>
        {selectedTools.length > 0 && (
          <div style={{
            padding: '8px 12px', background: '#FFF7E6', border: '1px solid #FFD591',
            borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: '#875b00',
          }}>
            已选择 {selectedTools.length} 个工具
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredTools.map(tool => {
            const isSelected = selectedTools.find(t => t.id === tool.id);
            return (
              <div
                key={tool.id}
                onClick={() => handleToggleTool(tool)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: `1px solid ${isSelected ? '#F59E0B' : '#e8e8e8'}`,
                  background: isSelected ? '#FFF7E6' : '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '20px' }}>{tool.icon}</span>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#1a1a1a' }}>{tool.name}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>{tool.description}</div>
                  </div>
                </div>
                <Checkbox checked={!!isSelected} onClick={e => { e.stopPropagation(); handleToggleTool(tool); }} />
              </div>
            );
          })}
        </div>
      </Modal>

      {/* Agent设置抽屉 */}
      <AgentSettingsDrawer
        visible={showSettingsDrawer}
        onClose={() => setShowSettingsDrawer(false)}
        onChange={handleModeConfigChange}
      />

      {/* Prompt模板导入Modal */}
      <PromptTemplateModal
        visible={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onSelect={handleSelectTemplate}
        onCreateNew={handleCreateNewTemplate}
      />

      {/* 保存为模板Modal */}
      <SaveTemplateModal
        visible={showSaveTemplateModal}
        initialPrompt={promptText}
        onClose={() => setShowSaveTemplateModal(false)}
        onSave={handleSaveTemplate}
      />

      {/* 发布弹窗 */}
      <PublishAgentModal
        open={publishOpen}
        latestVersion={getLatestVersion()}
        shopEnabled={shopEnabled} setShopEnabled={setShopEnabled}
        shopCategory={shopCategory} setShopCategory={setShopCategory}
        shopScope={shopScope} setShopScope={setShopScope}
        shareEnabled={shareEnabled} setShareEnabled={setShareEnabled}
        apiEnabled={apiEnabled} setApiEnabled={setApiEnabled}
        apiTokens={apiTokens} setApiTokens={setApiTokens}
        onClose={() => setPublishOpen(false)}
        onPublish={handlePublish}
      />

      {/* 历史版本抽屉 */}
      <AgentVersionDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={agentHistory}
        previewVersion={previewVersion}
        onPreviewVersion={(ver) => {
          setPreviewVersion(ver);
          setHistoryOpen(false);
          setAgentName(ver.snapshot.name);
          setPromptText(ver.snapshot.prompt);
          setModelType(ver.snapshot.model);
        }}
        onExitPreview={() => {
          setPreviewVersion(null);
        }}
        onRollback={handleRollback}
      />
    </div>
  );
};

export default Agent;
