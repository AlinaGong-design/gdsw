import React, { useState, useRef, useEffect } from 'react';
import {
  Card, Button, Tag, Space, Tooltip, Row, Col, Input, Select,
  Modal, message, Drawer, Timeline, Badge, Divider, Tabs, Upload, Spin
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
  SearchOutlined,
  DeleteOutlined,
  HistoryOutlined,
  RollbackOutlined,
  TagOutlined,
  SaveOutlined,
  FileTextOutlined,
  CloseOutlined,
  GlobalOutlined,
  LockOutlined,
  TeamOutlined,
  SettingOutlined,
  UploadOutlined,
  CodeOutlined,
  ReadOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';

const { TextArea } = Input;

// ─── 类型定义 ────────────────────────────────────────────────────────────────

type HistoryEventKind = 'save' | 'publish';
type VisibilityScope = 'private' | 'team' | 'public';

export interface SkillVersion {
  versionId: string;
  version: string;
  changelog: string;
  publishedAt: string;
  publishedBy: string;
  scope: VisibilityScope;
  snapshot: {
    name: string;
    description: string;
    icon: string;
    category: string;
    status: 'published' | 'draft' | 'offline';
  };
}

interface SkillHistoryEvent {
  id: string;
  kind: HistoryEventKind;
  time: string;
  user: string;
  desc: string;
  version?: SkillVersion;
}

export interface SkillItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'published' | 'draft' | 'offline';
  category: string;
  createTime: string;
  updateTime: string;
  agentCount?: number;
  agents?: string[];
  currentVersion?: string;
  versions?: SkillVersion[];
  history?: SkillHistoryEvent[];
  savedStatus?: 'saved' | 'draft' | 'published';
  tags?: string[];
}

// ─── 标签选择下拉 ─────────────────────────────────────────────────────────────

interface TagDropdownProps {
  allTags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onCreateTag: (tag: string) => void;
  onManageTags: () => void;
  onClose: () => void;
}

const TagDropdown: React.FC<TagDropdownProps> = ({
  allTags, selectedTags, onToggleTag, onCreateTag, onManageTags, onClose,
}) => {
  const [search, setSearch] = useState('');
  const inputRef = useRef<any>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const filtered = allTags.filter(t => t.toLowerCase().includes(search.toLowerCase()));
  const canCreate = search.trim() && !allTags.some(t => t === search.trim());

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canCreate) {
      onCreateTag(search.trim());
      setSearch('');
    }
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      style={{
        position: 'absolute', zIndex: 1000, top: '100%', left: 0, marginTop: 4,
        background: '#fff', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        width: 240, padding: '8px 0',
      }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{ padding: '8px 12px 6px' }}>
        <Input
          ref={inputRef}
          prefix={<SearchOutlined style={{ color: '#bbb' }} />}
          placeholder="搜索或创建标签"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ borderRadius: 8, fontSize: 13 }}
          size="small"
        />
      </div>
      <div style={{ maxHeight: 200, overflowY: 'auto' }}>
        {filtered.map(tag => {
          const checked = selectedTags.includes(tag);
          return (
            <div
              key={tag}
              onClick={() => onToggleTag(tag)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 14px', cursor: 'pointer',
                background: 'transparent',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                background: checked ? '#6366F1' : '#fff',
                border: checked ? '2px solid #6366F1' : '2px solid #d0d0d0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}>
                {checked && <svg width="12" height="9" viewBox="0 0 12 9" fill="none"><path d="M1 4L4.5 7.5L11 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <span style={{ fontSize: 14, color: '#222' }}>{tag}</span>
            </div>
          );
        })}
        {canCreate && (
          <div
            onClick={() => { onCreateTag(search.trim()); setSearch(''); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 14px', cursor: 'pointer', color: '#6366F1',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <PlusOutlined />
            <span style={{ fontSize: 13 }}>创建 "{search.trim()}"</span>
          </div>
        )}
        {filtered.length === 0 && !canCreate && (
          <div style={{ padding: '10px 14px', color: '#999', fontSize: 13 }}>无匹配标签</div>
        )}
      </div>
      <Divider style={{ margin: '4px 0' }} />
      <div
        onClick={onManageTags}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 14px', cursor: 'pointer', color: '#555', fontSize: 14,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <SettingOutlined />
        <span>管理标签</span>
      </div>
    </div>
  );
};

// ─── 管理标签 Modal ───────────────────────────────────────────────────────────

interface ManageTagsModalProps {
  open: boolean;
  allTags: string[];
  onClose: () => void;
  onConfirm: (tags: string[]) => void;
}

const ManageTagsModal: React.FC<ManageTagsModalProps> = ({ open, allTags, onClose, onConfirm }) => {
  const [tags, setTags] = useState<string[]>([]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [adding, setAdding] = useState(false);
  const [newTagValue, setNewTagValue] = useState('');

  useEffect(() => {
    if (open) {
      setTags([...allTags]);
      setEditingIdx(null);
      setAdding(false);
      setNewTagValue('');
    }
  }, [open, allTags]);

  const handleEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditValue(tags[idx]);
  };

  const handleEditConfirm = (idx: number) => {
    const val = editValue.trim();
    if (val && val !== tags[idx]) {
      const next = [...tags];
      next[idx] = val;
      setTags(next);
    }
    setEditingIdx(null);
  };

  const handleDelete = (idx: number) => {
    setTags(tags.filter((_, i) => i !== idx));
  };

  const handleAddConfirm = () => {
    const val = newTagValue.trim();
    if (val && !tags.includes(val)) {
      setTags([...tags, val]);
    }
    setAdding(false);
    setNewTagValue('');
  };

  return (
    <Modal
      title={<span style={{ fontSize: 18, fontWeight: 700 }}>管理标签</span>}
      open={open}
      onCancel={onClose}
      footer={
        <Space>
          <Button onClick={onClose} style={{ minWidth: 72, borderRadius: 8 }}>取 消</Button>
          <Button
            type="primary"
            onClick={() => onConfirm(tags)}
            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', border: 'none', minWidth: 72, borderRadius: 8 }}
          >
            确 定
          </Button>
        </Space>
      }
      width={560}
    >
      <div style={{ padding: '16px 0 4px' }}>
        {/* 添加关键词 */}
        <div style={{ marginBottom: 20 }}>
          {adding ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Input
                autoFocus
                value={newTagValue}
                onChange={e => setNewTagValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddConfirm(); if (e.key === 'Escape') { setAdding(false); setNewTagValue(''); } }}
                placeholder="输入标签名称"
                style={{ width: 160, borderRadius: 8 }}
                size="small"
              />
              <Button size="small" type="primary" onClick={handleAddConfirm} style={{ borderRadius: 6 }}>确定</Button>
              <Button size="small" onClick={() => { setAdding(false); setNewTagValue(''); }} style={{ borderRadius: 6 }}>取消</Button>
            </div>
          ) : (
            <div
              onClick={() => setAdding(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#666', fontSize: 14 }}
            >
              <PlusOutlined />
              <span>添加关键词</span>
            </div>
          )}
        </div>

        {/* 标签列表 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {tags.map((tag, idx) => (
            <div
              key={idx}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', border: '1px solid #e0e0e0',
                borderRadius: 8, background: '#fafafa',
              }}
            >
              {editingIdx === idx ? (
                <Input
                  autoFocus
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onBlur={() => handleEditConfirm(idx)}
                  onKeyDown={e => { if (e.key === 'Enter') handleEditConfirm(idx); if (e.key === 'Escape') setEditingIdx(null); }}
                  style={{ width: 100, padding: '0 4px', height: 22, fontSize: 13 }}
                  size="small"
                />
              ) : (
                <span style={{ fontSize: 14, color: '#333' }}>{tag}</span>
              )}
              <EditOutlined
                onClick={() => handleEdit(idx)}
                style={{ fontSize: 13, color: '#aaa', cursor: 'pointer' }}
              />
              <CloseOutlined
                onClick={() => handleDelete(idx)}
                style={{ fontSize: 12, color: '#aaa', cursor: 'pointer' }}
              />
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

interface SkillProps {
  onPreviewSkill?: (skill: SkillItem) => void;
  onCreateSkill?: () => void;
  onEditSkill?: (skillId: string) => void;
  onImportSkill?: (fileName: string) => void;
}

// ─── 工具函数 ────────────────────────────────────────────────────────────────

const now = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

function nextVersion(last: string, bump: 'patch' | 'minor' | 'major'): string {
  const m = last.match(/^v?(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return 'v1.0.0';
  let [, maj, min, pat] = m.map(Number);
  if (bump === 'major') { maj++; min = 0; pat = 0; }
  else if (bump === 'minor') { min++; pat = 0; }
  else { pat++; }
  return `v${maj}.${min}.${pat}`;
}

const SCOPE_LABELS: Record<VisibilityScope, { label: string; icon: React.ReactNode }> = {
  private: { label: '仅自己', icon: <LockOutlined /> },
  team:    { label: '团队内', icon: <TeamOutlined /> },
  public:  { label: '公开',   icon: <GlobalOutlined /> },
};

// ─── 版本历史抽屉 ─────────────────────────────────────────────────────────────

const SkillHistoryDrawer: React.FC<{
  skill: SkillItem | null;
  open: boolean;
  onClose: () => void;
  onRollback: (skill: SkillItem, ver: SkillVersion) => void;
  previewVersion: SkillVersion | null;
  onPreviewVersion: (ver: SkillVersion) => void;
  onExitPreview: () => void;
}> = ({ skill, open, onClose, onRollback, previewVersion, onPreviewVersion, onExitPreview }) => {
  const [rollbackTarget, setRollbackTarget] = useState<SkillVersion | null>(null);

  if (!skill) return null;
  const history = skill.history || [];
  const isPreview = !!previewVersion;

  const handleRollbackConfirm = () => {
    if (!rollbackTarget) return;
    onRollback(skill, rollbackTarget);
    setRollbackTarget(null);
    onClose();
  };

  return (
    <>
      <Drawer
        title={
          <Space>
            <HistoryOutlined />
            <span>版本控制</span>
            <Tag style={{ fontSize: 11, margin: 0 }}>{history.length} 条记录</Tag>
          </Space>
        }
        placement="right"
        width={440}
        open={open}
        onClose={onClose}
        styles={{ body: { padding: '16px 20px' } }}
      >
        {/* 草稿入口 */}
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
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
                  {ev.user} · {ev.time}
                </div>
                {ev.kind === 'publish' && ev.version && (
                  <>
                    {ev.version.changelog && (
                      <div style={{
                        fontSize: 12, color: '#64748b', fontStyle: 'italic',
                        marginBottom: 4, paddingLeft: 8,
                        borderLeft: '2px solid #e2e8f0', lineHeight: 1.5,
                      }}>
                        {ev.version.changelog}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>公开范围：</span>
                      <Tag style={{ fontSize: 11, margin: 0 }}>{SCOPE_LABELS[ev.version.scope].label}</Tag>
                    </div>
                    <Space size={6}>
                      <Button
                        size="small"
                        icon={<EyeOutlined />}
                        type={isPreview && previewVersion?.versionId === ev.version.versionId ? 'primary' : 'default'}
                        onClick={() => onPreviewVersion(ev.version!)}
                      >
                        查看版本
                      </Button>
                      <Button
                        size="small"
                        icon={<RollbackOutlined />}
                        onClick={() => setRollbackTarget(ev.version!)}
                      >
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

      {/* 回滚确认弹窗 */}
      <Modal
        title={<span style={{ fontSize: 16, fontWeight: 600 }}>确认回滚</span>}
        open={!!rollbackTarget}
        onCancel={() => setRollbackTarget(null)}
        footer={
          <Space>
            <Button onClick={() => setRollbackTarget(null)}>取消</Button>
            <Button
              type="primary"
              onClick={handleRollbackConfirm}
              style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', borderColor: 'transparent', borderRadius: 8 }}
            >
              确定
            </Button>
          </Space>
        }
        width={520}
      >
        {rollbackTarget && (
          <div style={{ padding: '4px 0 8px' }}>
            <div style={{ fontSize: 14, color: '#333', marginBottom: 16, lineHeight: 1.6 }}>
              确定要将内容回滚到版本 <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#6366F1' }}>{rollbackTarget.version}</span> 吗？
            </div>
            <div style={{ marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#111' }}>此操作会：</div>
            <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>
                技能配置恢复至选中的 {rollbackTarget.version} 版本状态
              </li>
              <li style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>
                撤销该版本之后的所有未发布更改
              </li>
              <li style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>
                历史记录会保留，可随时回滚到其他版本
              </li>
            </ul>
          </div>
        )}
      </Modal>
    </>
  );
};

// ─── 发布版本 Modal ───────────────────────────────────────────────────────────

const PublishSkillModal: React.FC<{
  open: boolean;
  latestVersion: string;
  isNew: boolean;
  onClose: () => void;
  onPublish: (version: string, changelog: string, scope: VisibilityScope) => void;
}> = ({ open, latestVersion, isNew, onClose, onPublish }) => {
  const [version, setVersion] = useState('');
  const [changelog, setChangelog] = useState('');
  const [scope, setScope] = useState<VisibilityScope | ''>('');

  React.useEffect(() => {
    if (open) {
      setVersion(nextVersion(latestVersion, 'patch'));
      setChangelog('');
      setScope('');
    }
  }, [open, latestVersion]);

  const handleConfirm = () => {
    if (!/^v\d+\.\d+\.\d+$/.test(version)) {
      message.error('版本号格式不正确，需为 vX.Y.Z');
      return;
    }
    onPublish(version, changelog, (scope || 'private') as VisibilityScope);
    onClose();
  };

  const subtitle = isNew
    ? '生成后可在智能体中配置。发布后将生成不可变的快照。'
    : '发布后将生成不可变的快照。请确保代码已通过调试验证。';

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
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1a1a1a' }}>发布新版本</div>
            <div style={{ fontWeight: 400, fontSize: 13, color: '#888', marginTop: 2 }}>{subtitle}</div>
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
            onClick={handleConfirm}
            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', border: 'none', minWidth: 96 }}
          >
            确认发布
          </Button>
        </Space>
      }
      width={520}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '16px 0 4px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>
              版本号 <span style={{ color: '#ff4d4f' }}>*</span>
            </span>
            {!isNew && (
              <span style={{ fontSize: 13, color: '#888', display: 'flex', alignItems: 'center', gap: 5 }}>
                上次版本：
                <span style={{
                  padding: '1px 10px', borderRadius: 6,
                  background: '#f0f0f0', color: '#555',
                  fontSize: 13, fontFamily: 'monospace',
                }}>
                  {latestVersion}
                </span>
              </span>
            )}
          </div>
          <Input
            value={version}
            onChange={e => setVersion(e.target.value)}
            placeholder="v1.0.0"
            prefix={<TagOutlined style={{ color: '#6366F1', fontSize: 14 }} />}
            style={{ fontSize: 14, borderRadius: 8 }}
          />
          <div style={{ fontSize: 12, color: '#bbb', marginTop: 6 }}>
            {isNew
              ? '请填写初始版本号，格式须为 vX.Y.Z'
              : '已根据上次版本自动生成建议版本号，可手动修改，格式须为 vX.Y.Z'
            }
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>版本说明 / 变更日志</div>
          <TextArea value={changelog} onChange={e => setChangelog(e.target.value)} rows={4}
            placeholder="简要描述本次更新的内容..." maxLength={500}
            style={{ borderRadius: 8, resize: 'none' }} />
        </div>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
            公开范围 <span style={{ color: '#888', fontWeight: 400, fontSize: 13 }}>（为空则仅本人可见）</span>
          </div>
          <Select
            value={scope || undefined}
            onChange={v => setScope(v)}
            placeholder="请选择公开范围"
            style={{ width: '100%' }}
            allowClear
            options={[
              { value: 'private', label: '仅自己' },
              { value: 'team', label: '团队内' },
              { value: 'public', label: '公开' },
            ]}
          />
        </div>
      </div>
    </Modal>
  );
};

// ─── 上传技能包 Modal ──────────────────────────────────────────────────────────

type ImportStep = {
  id: number;
  kind: 'cmd' | 'file' | 'plan';
  text: string;
  done: boolean;
};

const IMPORT_STEPS: Omit<ImportStep, 'done'>[] = [
  { id: 1,  kind: 'cmd',  text: 'cd /workspace/projects && wget -O "财务数据抓取.zip" "https://coze-codi..."' },
  { id: 2,  kind: 'file', text: '/workspace/projects/financial-data-standardizer/scripts/financial_data_co...' },
  { id: 3,  kind: 'file', text: '/workspace/projects/financial-data-standardizer/assets/templates/standar...' },
  { id: 4,  kind: 'file', text: '/workspace/projects/financial-data-standardizer/references/financial_metr...' },
  { id: 5,  kind: 'file', text: '/workspace/projects/financial-data-standardizer/SKILL.md' },
  { id: 6,  kind: 'file', text: '/workspace/projects/financial-data-standardizer/requirements.txt' },
  { id: 7,  kind: 'plan', text: '更新计划' },
  { id: 8,  kind: 'plan', text: '更新计划' },
  { id: 9,  kind: 'plan', text: '更新计划' },
  { id: 10, kind: 'plan', text: '更新计划' },
  { id: 11, kind: 'cmd',  text: 'cd /workspace/projects/financial-data-standardizer && rm -rf .git .coze re...' },
  { id: 12, kind: 'file', text: '/workspace/projects/financial-data-standardizer/SKILL.md' },
  { id: 13, kind: 'cmd',  text: 'cd /workspace/projects/financial-data-standardizer && rm -f "财务数据抓取.zip" && ls -la financial-dat...' },
  { id: 14, kind: 'cmd',  text: 'ls -lh financial-data-standardizer.skill' },
  { id: 15, kind: 'plan', text: '更新计划' },
];

const KIND_ICON: Record<ImportStep['kind'], React.ReactNode> = {
  cmd:  <CodeOutlined style={{ fontSize: 12, color: '#6366F1' }} />,
  file: <ReadOutlined style={{ fontSize: 12, color: '#64748b' }} />,
  plan: <SyncOutlined style={{ fontSize: 12, color: '#0ea5e9' }} />,
};
const KIND_LABEL: Record<ImportStep['kind'], string> = {
  cmd:  '执行命令',
  file: '阅读文件',
  plan: '更新计划',
};

const SKILL_RESULT_MD = `**转换完成**

已成功将上传的财务数据抓取 Skill 适配为标准格式。

**源 Skill 分析报告**

- 类型：Claude Skill 结构
- 目录名：\`financial-data-standardizer\`
- 核心功能：将 CSV/Excel 等格式的财务数据转换为标准化 JSON 格式
- 实现方式：使用 Python 脚本处理文件格式转换（符合选型指南）

**适配操作清单**

1. **前言区补全**：在 SKILL.md 中添加了 dependency 字段，包含 pandas>=1.5.0 和 openpyxl>=3.0.0
2. **目录规范化**：保留符合固定结构的文件（SKILL.md、scripts/、references/、assets/）
3. **冗余清理**：删除了不符合固定结构的文件（.git、.coze、requirements.txt、.gitignore、测试数据、输出目录）
4. **路径验证**：所有路径引用已符合规范
5. **内容保留**：完整保留了原始脚本、参考文档和资产文件，未进行任何重构

**交付产物**

- **Skill 名称**：\`financial-data-standardizer\`
- **打包文件**：\`financial-data-standardizer.skill\`（5.9KB）
- **实现方式**：
  - 脚本实现：文件格式处理（CSV 解析、时间格式转换、数据类型转换）
  - 自然语言指导：无（技术性任务由脚本完成）
- **智能体作用**：在 Skill 执行时调用脚本处理用户提供的财务数据文件

**校验报告**

- [命名规范] 目录名无 –skill 后缀，打包文件名与目录名一致：**通过**
- [前言�� – name] 符合命名规范（小写字母 + 连字符）：**通过**
- [前言区 – description] 包含〈能力价值〉与自然语言描述的〈触发场景〉，长度 100–150 字符：**通过**
- [前言区 – dependency] 格式正确：**通过**
- [正文体量] ≤ 500 行：**通过**
- [链接层级] 参考均为一层链接：**通过**
- [目录结构] 无多余文档：**通过**
- [内容纯净] 已清理 Skill 目录及工作区下的所有临时文件与测试数据：**通过**
- [实现方式合理性] 脚本和自然语言指导的使用符合选型指南：**通过**
- [脚本必要性] 每个脚本都有技术性理由：**通过**
- [参考格式完整性] 被依赖的参考文件提供完整的格式定义、示例和验证规则：**通过**
- [打包一致性] 路径与相对引用正确：**通过**
- [打包完成性] .skill 文件已生成；文件大小合理：**通过**
- [依赖元数据] 格式正确且内容全面：**通过**
- [路径适配] 所有路径引用已适配为符合「工作环境」定义的标准路径：**通过**
- [目录规范化] 目录名符合命名规范，已删除不符合固定结构的文件：**通过**
- [冗余清理] 已移除不符合规范的文件：**通过**`;

// Simple markdown renderer
function renderMd(md: string): React.ReactNode {
  const lines = md.split('\n');
  const nodes: React.ReactNode[] = [];
  let key = 0;

  const renderInline = (text: string): React.ReactNode => {
    // bold **text**
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((p, i) => {
      if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>;
      if (p.startsWith('`') && p.endsWith('`')) return <code key={i} style={{ background: '#f3f4f6', padding: '1px 5px', borderRadius: 4, fontFamily: 'monospace', fontSize: 13 }}>{p.slice(1, -1)}</code>;
      return p;
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) { nodes.push(<div key={key++} style={{ height: 8 }} />); continue; }
    if (line.startsWith('**') && line.endsWith('**')) {
      nodes.push(<div key={key++} style={{ fontWeight: 700, fontSize: 15, color: '#111', margin: '14px 0 6px' }}>{line.slice(2, -2)}</div>);
    } else if (/^\d+\.\s/.test(line)) {
      const m = line.match(/^(\d+)\.\s(.*)$/);
      if (m) nodes.push(<div key={key++} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 14, color: '#333' }}><span style={{ flexShrink: 0, color: '#6366F1', fontWeight: 600 }}>{m[1]}.</span><span>{renderInline(m[2])}</span></div>);
    } else if (line.startsWith('- ')) {
      nodes.push(<div key={key++} style={{ display: 'flex', gap: 8, marginBottom: 5, fontSize: 14, color: '#333', paddingLeft: 4 }}><span style={{ flexShrink: 0, marginTop: 2 }}>•</span><span>{renderInline(line.slice(2))}</span></div>);
    } else {
      nodes.push(<div key={key++} style={{ fontSize: 14, color: '#333', lineHeight: 1.7 }}>{renderInline(line)}</div>);
    }
  }
  return nodes;
}

export const SkillImportModal: React.FC<{
  open: boolean;
  fileName: string;
  onClose: () => void;
  onImported: (skillName: string) => void;
}> = ({ open, fileName, onClose, onImported }) => {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width="90vw"
      style={{ top: 20, maxWidth: 1200 }}
      styles={{ body: { padding: 0 } }}
      bodyStyle={{ borderRadius: 12, overflow: 'hidden' }}
      closable={false}
    >
      <div style={{ display: 'flex', height: '85vh' }}>
        <SkillImportContent fileName={fileName} onClose={onClose} onImported={onImported} />
      </div>
    </Modal>
  );
};

export const SkillImportContent: React.FC<{
  fileName: string;
  onClose?: () => void;
  onImported: (skillName: string) => void;
}> = ({ fileName, onClose, onImported }) => {
  const [steps, setSteps] = useState<ImportStep[]>([]);
  const [done, setDone] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    setSteps([]);
    setDone(false);
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];
    let delay = 400;
    IMPORT_STEPS.forEach((step, idx) => {
      const t = setTimeout(() => {
        setSteps(prev => [...prev, { ...step, done: true }]);
        if (idx === IMPORT_STEPS.length - 1) {
          setTimeout(() => {
            setDone(true);
            onImported('financial-data-standardizer');
          }, 600);
        }
      }, delay);
      timerRef.current.push(t);
      delay += Math.random() * 300 + 150;
    });
    return () => timerRef.current.forEach(clearTimeout);
  }, [fileName]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [steps]);

  const skillBaseName = fileName.replace(/\.(zip|skill|tar\.gz)$/i, '');

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%' }}>
        {/* ── 左侧：聊天日志 ── */}
        <div style={{ width: 360, flexShrink: 0, borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', background: '#fafafa' }}>
          {/* 顶部标题栏 */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 10, background: '#fff' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📦</div>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>{skillBaseName}</div>
            <Button type="text" icon={<CloseOutlined />} size="small" onClick={onClose} style={{ marginLeft: 'auto', color: '#999' }} />
          </div>

          {/* 用户消息气泡 */}
          <div style={{ padding: '16px 14px 8px' }}>
            <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#333', lineHeight: 1.6 }}>
              📦 {fileName} 请按照标准流程帮我适配这个 skill，这个技能文件名是{fileName}
            </div>
          </div>

          {/* 助手回复 */}
          <div style={{ padding: '4px 14px 8px', fontSize: 13, color: '#555', lineHeight: 1.7 }}>
            我将帮你适配这个 Skill。让我先解压并分析源 Skill 的结构。
          </div>

          {/* 步骤日志 */}
          <div ref={logRef} style={{ flex: 1, overflowY: 'auto', padding: '0 14px 14px' }}>
            {steps.map(step => (
              <div
                key={step.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  padding: '6px 10px', marginBottom: 4, borderRadius: 8,
                  background: step.kind === 'file' && step.text.includes('SKILL.md') ? '#f0f0f5' : '#fff',
                  border: '1px solid #f0f0f0', fontSize: 12,
                }}
              >
                <span style={{ marginTop: 2, flexShrink: 0 }}>{KIND_ICON[step.kind]}</span>
                <div style={{ color: '#555', overflow: 'hidden' }}>
                  <span style={{ color: '#888', marginRight: 4 }}>{KIND_LABEL[step.kind]}</span>
                  <span style={{ color: step.kind === 'cmd' ? '#6366F1' : '#64748b', fontFamily: step.kind !== 'plan' ? 'monospace' : undefined, wordBreak: 'break-all' }}>
                    {step.text}
                  </span>
                </div>
              </div>
            ))}
            {!done && steps.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', fontSize: 12, color: '#94a3b8' }}>
                <LoadingOutlined spin style={{ fontSize: 12 }} />
                <span>处理中…</span>
              </div>
            )}
            {done && (
              <>
                <div style={{ padding: '10px 10px 4px', fontSize: 13, color: '#111', lineHeight: 1.8, fontWeight: 500 }}>
                  现在开始执行转换操作。
                </div>
                <div style={{ marginTop: 8, padding: '14px 12px', background: '#fff', border: '1px solid #f0f0f0', borderRadius: 10, fontSize: 12 }}>
                  {renderMd(SKILL_RESULT_MD)}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── 右侧：预览区 ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* 顶部 tab 栏 */}
          <div style={{ padding: '12px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 12, background: '#fff' }}>
            <div style={{
              padding: '5px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff',
            }}>预览</div>
            {done && (
              <Tag color="success" icon={<CheckCircleOutlined />} style={{ fontSize: 12 }}>适配成功</Tag>
            )}
            <Button type="text" icon={<CloseOutlined />} size="small" onClick={onClose} style={{ marginLeft: 'auto', color: '#999' }} />
          </div>

          {/* 内容区 */}
          {!done ? (
            /* 生成中状态 */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
              <Spin indicator={<LoadingOutlined style={{ fontSize: 40, color: '#6366F1' }} spin />} />
              <div style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>技能生成中</div>
              <div style={{ fontSize: 13, color: '#999', textAlign: 'center', maxWidth: 300, lineHeight: 1.8 }}>
                正在解析技能包结构，适配标准格式，<br />请稍候…
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 8, height: 8, borderRadius: '50%', background: '#6366F1',
                    animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
              <style>{`@keyframes pulse{0%,80%,100%{opacity:.2;transform:scale(.8)}40%{opacity:1;transform:scale(1)}}`}</style>
            </div>
          ) : (
            /* 完成后：技能预览界面 */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fafafa' }}>
              {/* 预览头部 */}
              <div style={{ padding: '20px 32px', background: '#fff', borderBottom: '1px solid #e8e8e8' }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>预览</div>
              </div>

              {/* 技能标题区 */}
              <div style={{ padding: '28px 32px 20px', background: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0,
                  }}>📦</div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', marginBottom: 6 }}>
                      financial-data-standardizer
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Tag color="warning" style={{ fontSize: 11, margin: 0 }}>草稿</Tag>
                      <Tag style={{ fontSize: 11, margin: 0 }}>仅自己</Tag>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: '#555', lineHeight: 1.7, paddingLeft: 62 }}>
                  将 CSV/Excel 等格式的财务数据转换为标准化 JSON 格式，支持多种财务数据源，适用于数据清洗与标准化场景。
                </div>
              </div>

              {/* 消息列表 */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', background: '#fff' }}>
                {/* 用户问题气泡 */}
                <div style={{ marginBottom: 28 }}>
                  <div style={{ background: '#f5f5f5', padding: '12px 16px', borderRadius: 8, fontSize: 14, lineHeight: 1.6, color: '#333' }}>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 6, fontWeight: 500 }}>financial-data-standardizer</div>
                    「financial-data-standardizer」这个技能能做什么，怎么触发它?
                  </div>
                </div>

                {/* AI 回复 */}
                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#1a1a1a' }}>技能功能与触发方式</div>
                  <div style={{ fontSize: 14, lineHeight: 1.8, color: '#333' }}>
                    该技能用于将 CSV/Excel 等格式的财务数据转换为标准化 JSON 格式。你可以上传财务数据文件，技能会自动完成格式转换、时间格式标准化和数据类型转换。
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <Button type="text" size="small" style={{ color: '#666', padding: '4px 8px' }}>
                      <span style={{ marginRight: 4 }}>✓</span>已完成
                    </Button>
                    <Button type="text" size="small" icon={<span style={{ fontSize: 14 }}>👍</span>} style={{ color: '#666', padding: '4px 8px' }} />
                    <Button type="text" size="small" icon={<span style={{ fontSize: 14 }}>👎</span>} style={{ color: '#666', padding: '4px 8px' }} />
                    <Button type="text" size="small" icon={<span style={{ fontSize: 14 }}>📋</span>} style={{ color: '#666', padding: '4px 8px' }} />
                  </div>
                </div>

                {/* 你可能想问 */}
                <div style={{ marginTop: 24 }}>
                  <div style={{ fontSize: 13, color: '#999', marginBottom: 12, fontWeight: 500 }}>你可能想问</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { icon: '📊', text: '支持哪些财务数据格式的输入文件？' },
                      { icon: '⚙️', text: '转换后的 JSON 格式有哪些字段规范？' },
                      { icon: '🔄', text: '如何处理格式异常或缺失字段的数据？' },
                    ].map((q, i) => (
                      <div key={i} style={{
                        padding: '12px', border: '1px solid #e8e8e8', borderRadius: 8,
                        fontSize: 14, color: '#333', background: '#fafafa', cursor: 'pointer',
                      }}>
                        <span style={{ marginRight: 8 }}>{q.icon}</span>{q.text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 输入框 */}
              <div style={{ padding: '16px 24px', background: '#fff', borderTop: '1px solid #e8e8e8' }}>
                <div style={{ border: '1px solid #e0e0e0', borderRadius: 12, padding: '10px 14px', background: '#fafafa' }}>
                  <div style={{ fontSize: 14, color: '#bbb', marginBottom: 8 }}>发送消息...</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button type="text" size="small" style={{ color: '#999', fontSize: 13 }}>📎</Button>
                      <Button type="text" size="small" style={{ color: '#999', fontSize: 13 }}>💡</Button>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Button
                        type="primary"
                        size="small"
                        icon={<CloudUploadOutlined />}
                        onClick={() => { message.success('技能已导入到草稿箱'); onClose && onClose(); }}
                        style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', border: 'none', borderRadius: 6, fontSize: 12 }}
                      >
                        导入到草稿箱
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
    </div>
  );
};

// ─── 主组件 ───────────────────────────────────────────────────────────────────

// 判断skill是否为共享（scope为team或public）
function isSharedSkill(skill: SkillItem): boolean {
  const history = skill.history || [];
  const lastPublish = [...history].reverse().find(h => h.kind === 'publish');
  if (!lastPublish?.version) return false;
  return lastPublish.version.scope === 'team' || lastPublish.version.scope === 'public';
}

const Skill: React.FC<SkillProps> = ({ onPreviewSkill, onCreateSkill, onEditSkill, onImportSkill }) => {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'mine' | 'shared'>('mine');

  // 全局标签列表
  const [allTags, setAllTags] = useState<string[]>([
    '文本生成', '多风格输出', '长文本处理',
    '幻灯片', '模板生成', '结构化输出',
    '脚本创作', '短视频', '创意策划',
    'UI设计', '配色方案', '排版指导',
    '静态分析', '安全检测', '性能优化',
    '可视化图表', '报表生成', '数据洞察',
    '实时搜索', '新闻聚合', '联网工具',
    'PDF解析', '文本提取', '文档处理',
    '代码执行', '科学计算', '沙箱运行',
  ]);
  // 管理标签 Modal
  const [manageTagsOpen, setManageTagsOpen] = useState(false);
  // 当前打开标签下拉的 skill id
  const [tagDropdownSkillId, setTagDropdownSkillId] = useState<string | null>(null);
  const tagDropdownRef = useRef<HTMLDivElement | null>(null);

  // 点击外部关闭标签下拉
  useEffect(() => {
    if (!tagDropdownSkillId) return;
    const handleClick = (e: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
        setTagDropdownSkillId(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [tagDropdownSkillId]);

  const initSkills: SkillItem[] = [
    {
      id: '1', name: '写作助手', description: '帮助用户完成各类文章、报告、邮件等写作任务，支持多种文体和风格',
      icon: '✏️', status: 'published', category: '内容创作', createTime: '2024-01-15', updateTime: '2024-01-20',
      agentCount: 5, agents: ['文案写作助手', '翻译助手', 'Python编程助手', '数据分析师', 'JavaScript专家'],
      currentVersion: 'v2.1.0', savedStatus: 'published', tags: ['文本生成', '多风格输出', '长文本处理'],
      history: [
        { id: 'h1', kind: 'publish', time: '2024-01-15 09:00:00', user: 'Admin', desc: 'v1.0.0', version: { versionId: 'v1.0.0', version: 'v1.0.0', changelog: '首次发布', publishedAt: '2024-01-15 09:00', publishedBy: 'Admin', scope: 'team', snapshot: { name: '写作助手', description: '写作助手初版', icon: '✏️', category: '内容创作', status: 'published' } } },
        { id: 'h2', kind: 'save', time: '2024-01-17 11:00:00', user: 'Admin', desc: '优化提示词结构' },
        { id: 'h3', kind: 'publish', time: '2024-01-18 14:00:00', user: 'Admin', desc: 'v2.0.0', version: { versionId: 'v2.0.0', version: 'v2.0.0', changelog: '重构提示词结构，优化输出质量', publishedAt: '2024-01-18 14:00', publishedBy: 'Admin', scope: 'team', snapshot: { name: '写作助手', description: '帮助用户完成写作任务', icon: '✏️', category: '内容创作', status: 'published' } } },
        { id: 'h4', kind: 'publish', time: '2024-01-20 10:30:00', user: 'Admin', desc: 'v2.1.0', version: { versionId: 'v2.1.0', version: 'v2.1.0', changelog: '修复长文本截断问题', publishedAt: '2024-01-20 10:30', publishedBy: 'Admin', scope: 'team', snapshot: { name: '写作助手', description: '帮助用户完成各类文章、报告、邮件等写作任务，支持多种文体和风格', icon: '✏️', category: '内容创作', status: 'published' } } },
      ],
    },
    {
      id: '2', name: 'PPT制作', description: '根据用户需求自动生成PPT大纲和内容，支持多种主题模板',
      icon: '📊', status: 'published', category: '文档处理', createTime: '2024-01-10', updateTime: '2024-01-18',
      agentCount: 3, agents: ['文案写作助手', '设计助手', '数据分析师'],
      currentVersion: 'v1.2.0', savedStatus: 'published', tags: ['幻灯片', '模板生成', '结构化输出'],
      history: [
        { id: 'h1', kind: 'publish', time: '2024-01-10 10:00:00', user: 'Admin', desc: 'v1.0.0', version: { versionId: 'v1.0.0', version: 'v1.0.0', changelog: '首次发布', publishedAt: '2024-01-10 10:00', publishedBy: 'Admin', scope: 'team', snapshot: { name: 'PPT制作', description: '自动生成PPT', icon: '📊', category: '文档处理', status: 'published' } } },
        { id: 'h2', kind: 'publish', time: '2024-01-18 16:00:00', user: 'Admin', desc: 'v1.2.0', version: { versionId: 'v1.2.0', version: 'v1.2.0', changelog: '新增暗色主题模板', publishedAt: '2024-01-18 16:00', publishedBy: 'Admin', scope: 'team', snapshot: { name: 'PPT制作', description: '根据用户需求自动生成PPT大纲和内容，支持多种主题模板', icon: '📊', category: '文档处理', status: 'published' } } },
      ],
    },
    {
      id: '3', name: '视频脚本', description: '为短视频、Vlog等创作提供脚本策划和文案撰写服务',
      icon: '🎬', status: 'draft', category: '内容创作', createTime: '2024-01-12', updateTime: '2024-01-19',
      agentCount: 2, agents: ['文案写作助手', '翻译助手'],
      savedStatus: 'draft', tags: ['脚本创作', '短视频', '创意策划'], history: [],
    },
    {
      id: '4', name: '设计助手', description: '提供设计建议、配色方案、排版指导等设计相关服务',
      icon: '🎨', status: 'published', category: '内容创作', createTime: '2024-01-08', updateTime: '2024-01-16',
      agentCount: 1, agents: ['设计助手'],
      currentVersion: 'v1.0.0', savedStatus: 'published', tags: ['UI设计', '配色方案', '排版指导'],
      history: [
        { id: 'h1', kind: 'publish', time: '2024-01-16 11:00:00', user: 'Admin', desc: 'v1.0.0', version: { versionId: 'v1.0.0', version: 'v1.0.0', changelog: '首次发布', publishedAt: '2024-01-16 11:00', publishedBy: 'Admin', scope: 'team', snapshot: { name: '设计助手', description: '提供设计建议、配色方案、排版指导等设计相关服务', icon: '🎨', category: '内容创作', status: 'published' } } },
      ],
    },
    {
      id: '5', name: '代码审查', description: '对代码进行质量检查、性能优化建议、安全漏洞检测',
      icon: '💻', status: 'offline', category: '代码执行', createTime: '2024-01-05', updateTime: '2024-01-14',
      agentCount: 0, agents: [],
      currentVersion: 'v1.1.0', savedStatus: 'saved', tags: ['静态分析', '安全检测', '性能优化'],
      history: [
        { id: 'h1', kind: 'publish', time: '2024-01-05 10:00:00', user: 'Admin', desc: 'v1.0.0', version: { versionId: 'v1.0.0', version: 'v1.0.0', changelog: '首次发布', publishedAt: '2024-01-05 10:00', publishedBy: 'Admin', scope: 'team', snapshot: { name: '代码审查', description: '代码质量检查', icon: '💻', category: '代码执行', status: 'published' } } },
        { id: 'h2', kind: 'publish', time: '2024-01-14 09:00:00', user: 'Admin', desc: 'v1.1.0', version: { versionId: 'v1.1.0', version: 'v1.1.0', changelog: '新增安全漏洞检测', publishedAt: '2024-01-14 09:00', publishedBy: 'Admin', scope: 'public', snapshot: { name: '代码审查', description: '对代码进行质量检查、性能优化建议、安全漏洞检测', icon: '💻', category: '代码执行', status: 'offline' } } },
      ],
    },
    {
      id: '6', name: '数据分析', description: '帮助用户分析数据、生成报表、提供数据洞察',
      icon: '📈', status: 'published', category: '数据分析', createTime: '2024-01-03', updateTime: '2024-01-17',
      agentCount: 4, agents: ['数据分析师', 'SQL优化专家', 'Python编程助手', 'JavaScript专家'],
      currentVersion: 'v3.0.0', savedStatus: 'published', tags: ['可视化图表', '报表生成', '数据洞察'],
      history: [
        { id: 'h1', kind: 'publish', time: '2024-01-03 09:00:00', user: 'Admin', desc: 'v1.0.0', version: { versionId: 'v1.0.0', version: 'v1.0.0', changelog: '首次发布', publishedAt: '2024-01-03 09:00', publishedBy: 'Admin', scope: 'team', snapshot: { name: '数据分析', description: '数据分析初版', icon: '📈', category: '数据分析', status: 'published' } } },
        { id: 'h2', kind: 'save', time: '2024-01-08 10:00:00', user: 'Admin', desc: '调整分析逻辑' },
        { id: 'h3', kind: 'publish', time: '2024-01-10 10:00:00', user: 'Admin', desc: 'v2.0.0', version: { versionId: 'v2.0.0', version: 'v2.0.0', changelog: '新增可视化图表输出', publishedAt: '2024-01-10 10:00', publishedBy: 'Admin', scope: 'team', snapshot: { name: '数据分析', description: '分析数据、生成报表', icon: '📈', category: '数据分析', status: 'published' } } },
        { id: 'h4', kind: 'publish', time: '2024-01-17 15:00:00', user: 'Admin', desc: 'v3.0.0', version: { versionId: 'v3.0.0', version: 'v3.0.0', changelog: '支持实时数据流分析', publishedAt: '2024-01-17 15:00', publishedBy: 'Admin', scope: 'public', snapshot: { name: '数据分析', description: '帮助用户分析数据、生成报表、提供数据洞察', icon: '📈', category: '数据分析', status: 'published' } } },
      ],
    },
    {
      id: '7', name: '网页搜索', description: '搜索互联网上的实时信息，支持关键词搜索、新闻搜索等多种模式',
      icon: '🌐', status: 'published', category: '信息获取', createTime: '2024-01-20', updateTime: '2024-01-22',
      agentCount: 6, agents: ['互联网行业洞察', '石油行业知识问答小助手', 'Python编程助手', '数据分析师', 'JavaScript专家', '文案写作助手'],
      currentVersion: 'v1.0.0', savedStatus: 'published', tags: ['实时搜索', '新闻聚合', '联网工具'],
      history: [
        { id: 'h1', kind: 'publish', time: '2024-01-22 09:00:00', user: 'Admin', desc: 'v1.0.0', version: { versionId: 'v1.0.0', version: 'v1.0.0', changelog: '首次发布', publishedAt: '2024-01-22 09:00', publishedBy: 'Admin', scope: 'team', snapshot: { name: '网页搜索', description: '搜索互联网上的实时信息', icon: '🌐', category: '信息获取', status: 'published' } } },
      ],
    },
    {
      id: '8', name: 'PDF解析', description: '解析PDF文档内容，提取文本、图片等信息',
      icon: '📄', status: 'draft', category: '文档处理', createTime: '2024-01-18', updateTime: '2024-01-21',
      agentCount: 2, agents: ['数据分析师', 'Python编程助手'],
      savedStatus: 'draft', tags: ['PDF解析', '文本提取', '文档处理'], history: [],
    },
    {
      id: '9', name: 'Python执行器', description: '安全地执行Python代码，支持数据处理、科学计算等任务',
      icon: '🐍', status: 'published', category: '代码执行', createTime: '2024-01-16', updateTime: '2024-01-19',
      agentCount: 3, agents: ['Python编程助手', '数据分析师', 'SQL优化专家'],
      currentVersion: 'v1.1.0', savedStatus: 'published', tags: ['代码执行', '科学计算', '沙箱运行'],
      history: [
        { id: 'h1', kind: 'publish', time: '2024-01-16 10:00:00', user: 'Admin', desc: 'v1.0.0', version: { versionId: 'v1.0.0', version: 'v1.0.0', changelog: '首次发布', publishedAt: '2024-01-16 10:00', publishedBy: 'Admin', scope: 'team', snapshot: { name: 'Python执行器', description: 'Python代码执行器', icon: '🐍', category: '代码执行', status: 'published' } } },
        { id: 'h2', kind: 'publish', time: '2024-01-19 14:00:00', user: 'Admin', desc: 'v1.1.0', version: { versionId: 'v1.1.0', version: 'v1.1.0', changelog: '新增科学计算库支持', publishedAt: '2024-01-19 14:00', publishedBy: 'Admin', scope: 'team', snapshot: { name: 'Python执行器', description: '安全地执行Python代码，支持数据处理、科学计算等任务', icon: '🐍', category: '代码执行', status: 'published' } } },
      ],
    },
  ];
  const [skills, setSkills] = useState(initSkills);

  // 历史版本抽屉状态
  const [historySkill, setHistorySkill] = useState<SkillItem | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  // 预览版本（每个技能独立）
  const [previewState, setPreviewState] = useState<{ skillId: string; version: SkillVersion } | null>(null);

  // 发布弹窗
  const [publishSkillId, setPublishSkillId] = useState<string | null>(null);

  const filteredSkills = skills.filter(skill => {
    const matchesSearch = skill.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === 'all' || skill.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || skill.category === categoryFilter;
    const shared = isSharedSkill(skill);
    const matchesTab = activeTab === 'mine' ? !shared : shared;
    return matchesSearch && matchesStatus && matchesCategory && matchesTab;
  });

  const getStatusTag = (status: string) => {
    const statusConfig = {
      published: { color: 'success', text: '已发布' },
      draft: { color: 'default', text: '草稿' },
      offline: { color: 'error', text: '已下架' }
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getLatestVersion = (skill: SkillItem): string => {
    const history = skill.history || [];
    const last = [...history].reverse().find(h => h.kind === 'publish');
    return last?.desc || 'v1.0.0';
  };

  const handleEdit = (id: string) => {
    if (onEditSkill) onEditSkill(id);
  };

  const handleOffline = (id: string) => {
    setSkills(skills.map(skill =>
      skill.id === id ? { ...skill, status: 'offline' as const } : skill
    ));
    message.success('下架成功');
  };

  const handleDelete = (id: string, name: string) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除 "${name}" 吗？删除后无法恢复。`,
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        setSkills(skills.filter(skill => skill.id !== id));
        message.success('删除成功');
      },
    });
  };

  // 发布版本
  const handlePublishVersion = (id: string, version: string, changelog: string, scope: VisibilityScope) => {
    const skill = skills.find(s => s.id === id);
    if (!skill) return;
    const ver: SkillVersion = {
      versionId: version, version,
      changelog, publishedAt: now(), publishedBy: '当前用户', scope,
      snapshot: { name: skill.name, description: skill.description, icon: skill.icon, category: skill.category, status: skill.status },
    };
    const ev: SkillHistoryEvent = {
      id: `h${Date.now()}`, kind: 'publish', time: now(), user: '当前用户',
      desc: version, version: ver,
    };
    setSkills(skills.map(s => s.id === id
      ? { ...s, currentVersion: version, status: 'published', savedStatus: 'published' as const, history: [...(s.history || []), ev], updateTime: now().slice(0, 10) }
      : s
    ));
    message.success({ content: `版本 ${version} 发布成功`, icon: <CheckCircleOutlined style={{ color: '#52c41a' }} /> });
    setPublishSkillId(null);
  };

  // 回滚
  const handleRollback = (skill: SkillItem, ver: SkillVersion) => {
    setSkills(skills.map(s => s.id === skill.id
      ? {
          ...s,
          name: ver.snapshot.name,
          description: ver.snapshot.description,
          icon: ver.snapshot.icon,
          category: ver.snapshot.category,
          savedStatus: 'draft' as const,
          currentVersion: ver.version,
          updateTime: now().slice(0, 10),
        }
      : s
    ));
    setPreviewState(null);
    message.success(`已回滚至 ${ver.version}`);
  };

  const handlePreview = (skill: SkillItem) => {
    if (onPreviewSkill) onPreviewSkill(skill);
  };

  const handleAddSkill = () => {
    if (onCreateSkill) onCreateSkill();
  };

  // 上传技能包
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFileName, setImportFileName] = useState('');

  const handleUploadClick = () => {
    uploadInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (onImportSkill) {
      onImportSkill(file.name);
    }
    e.target.value = '';
  };

  // 标签相关处理
  const handleToggleTag = (skillId: string, tag: string) => {
    setSkills(skills.map(s => {
      if (s.id !== skillId) return s;
      const tags = s.tags || [];
      return {
        ...s,
        tags: tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag],
      };
    }));
  };

  const handleCreateTag = (skillId: string, tag: string) => {
    if (!allTags.includes(tag)) {
      setAllTags(prev => [...prev, tag]);
    }
    handleToggleTag(skillId, tag);
  };

  const handleManageTagsConfirm = (newTags: string[]) => {
    // 删除的标签要从所有skill中移除
    const removed = allTags.filter(t => !newTags.includes(t));
    setAllTags(newTags);
    if (removed.length > 0) {
      setSkills(skills.map(s => ({
        ...s,
        tags: (s.tags || []).filter(t => !removed.includes(t)),
      })));
    }
    setManageTagsOpen(false);
    message.success('标签管理已保存');
  };

  const publishSkill = skills.find(s => s.id === publishSkillId);
  const previewVersion = previewState ? (
    historySkill?.history?.find(h => h.kind === 'publish' && h.version?.versionId === previewState.version.versionId)?.version || null
  ) : null;

  return (
    <div>
      {/* 隐藏的文件选择器，放在顶层避免 Space 干扰 ref */}
      <input
        ref={uploadInputRef}
        id="skill-upload-input"
        type="file"
        accept=".zip,.skill,.tar.gz"
        style={{ position: 'fixed', top: -9999, left: -9999, opacity: 0, pointerEvents: 'none' }}
        onChange={handleFileChange}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>技能列表</h1>
          <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
            管理您的Agent技能，包括创���、编辑、发布和下架
          </p>
        </div>
        <Space size="middle">
          <Tooltip title="上传Skill 文件包(格式为.zip 或.skill)" placement="bottom">
            <label htmlFor="skill-upload-input" style={{ display: 'inline-block', cursor: 'pointer' }}>
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                height: 44, padding: '0 20px', borderRadius: 8,
                border: '1px solid #6366F1', color: '#6366F1',
                fontSize: 14, fontWeight: 500, background: '#fff',
                cursor: 'pointer', userSelect: 'none',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f5f4ff')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
            >
              <UploadOutlined />
              导入技能
            </span>
          </label>
          </Tooltip>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={handleAddSkill}
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              border: 'none', borderRadius: '8px', height: '44px', padding: '0 24px', fontWeight: 500
            }}
          >
            新增技能
          </Button>
        </Space>
      </div>

      {/* 我的Skill / 共享Skill 标签页 */}
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as 'mine' | 'shared')}
        style={{ marginBottom: 8 }}
        items={[
          { key: 'mine', label: '我的技能' },
          { key: 'shared', label: '技能中心' },
        ]}
      />

      {/* 搜索和筛选 */}
      <div style={{ marginBottom: '24px' }}>
        <Space size="middle" style={{ marginBottom: 16 }}>
          <Input
            placeholder="请输入Skill名称"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            allowClear
          />
          <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 150 }}>
            <Select.Option value="all">全部状态</Select.Option>
            <Select.Option value="published">已发布</Select.Option>
            <Select.Option value="draft">草稿</Select.Option>
            <Select.Option value="offline">已下架</Select.Option>
          </Select>
          <Select value={categoryFilter} onChange={setCategoryFilter} style={{ width: 150 }}>
            <Select.Option value="all">全部分类</Select.Option>
            <Select.Option value="信息获取">信息获取</Select.Option>
            <Select.Option value="文档处理">文档处理</Select.Option>
            <Select.Option value="代码执行">代码执行</Select.Option>
            <Select.Option value="数据分析">数据分析</Select.Option>
            <Select.Option value="内容创作">内容创作</Select.Option>
          </Select>
          <Button onClick={() => { setSearchText(''); setStatusFilter('all'); setCategoryFilter('all'); }}>重置</Button>
        </Space>
        <div style={{ color: '#666', fontSize: '14px' }}>共找到 {filteredSkills.length} 个Skill</div>
      </div>

      <Row gutter={[16, 16]}>
        {filteredSkills.map((skill) => {
          const isThisPreview = previewState?.skillId === skill.id;
          const previewVer = isThisPreview ? previewState!.version : null;
          const displaySkill = previewVer ? {
            ...skill,
            name: previewVer.snapshot.name,
            description: previewVer.snapshot.description,
            icon: previewVer.snapshot.icon,
            category: previewVer.snapshot.category,
          } : skill;

          return (
            <Col xs={24} sm={12} lg={8} xl={6} key={skill.id}>
              <Card
                hoverable
                onClick={() => handleEdit(skill.id)}
                styles={{ body: { padding: '20px' } }}
                style={{ borderRadius: '12px', border: `1px solid ${isThisPreview ? '#fcd34d' : '#f0f0f0'}`, height: '100%', transition: 'all 0.3s', cursor: 'pointer' }}
              >
                {/* 历史版本预览 Banner */}
                {isThisPreview && (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 10px', background: '#fef3c7', border: '1px solid #fcd34d',
                    borderRadius: 6, marginBottom: 12, fontSize: 12,
                  }}>
                    <Space size={4}>
                      <EyeOutlined style={{ color: '#d97706' }} />
                      <span style={{ color: '#92400e' }}>
                        预览版本 <Tag color="orange" style={{ fontFamily: 'monospace', fontSize: 11, margin: '0 2px' }}>{previewVer!.version}</Tag>
                      </span>
                    </Space>
                    <Button
                      size="small"
                      icon={<CloseOutlined />}
                      onClick={(e) => { e.stopPropagation(); setPreviewState(null); }}
                      style={{ fontSize: 11, height: 22, padding: '0 6px' }}
                    >退出</Button>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  {/* 图标和状态 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{
                      width: '56px', height: '56px', borderRadius: '12px',
                      background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px'
                    }}>
                      {displaySkill.icon}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      {/* 保存/发布状态 */}
                      {!isThisPreview && (() => {
                        const s = skill.savedStatus;
                        if (s === 'published') return <Tag color="success" style={{ fontSize: 11, margin: 0 }}>已发布</Tag>;
                        if (s === 'saved') return <Tag color="processing" style={{ fontSize: 11, margin: 0 }}>已保存</Tag>;
                        return <Tag color="warning" style={{ fontSize: 11, margin: 0 }}>草稿</Tag>;
                      })()}
                    </div>
                  </div>

                  {/* 名称 */}
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, color: '#333' }}>
                    {displaySkill.name}
                  </h3>

                  {/* 描述 */}
                  <p style={{
                    margin: '0 0 16px 0', fontSize: '14px', color: '#666', lineHeight: '1.6', flex: 1,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>
                    {displaySkill.description}
                  </p>

                  {/* 标签区域 */}
                  {!isThisPreview && (
                    <div
                      style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 12 }}
                      onClick={e => e.stopPropagation()}
                    >
                      {(skill.tags || []).map(tag => (
                        <span
                          key={tag}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '3px 10px', borderRadius: 20,
                            border: '1px dashed #c0bfff', fontSize: 12, color: '#6366F1',
                            background: 'transparent', cursor: 'default',
                          }}
                        >
                          <TagOutlined style={{ fontSize: 11 }} />
                          {tag}
                        </span>
                      ))}
                      {/* 添加标签按钮 */}
                      <div style={{ position: 'relative' }} ref={tagDropdownSkillId === skill.id ? tagDropdownRef : undefined}>
                        <span
                          onClick={() => setTagDropdownSkillId(tagDropdownSkillId === skill.id ? null : skill.id)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '3px 10px', borderRadius: 20,
                            border: '1px dashed #d0d0d0', fontSize: 12, color: '#999',
                            cursor: 'pointer', background: 'transparent',
                          }}
                        >
                          <PlusOutlined style={{ fontSize: 11 }} />
                          添加标签
                        </span>
                        {tagDropdownSkillId === skill.id && (
                          <TagDropdown
                            allTags={allTags}
                            selectedTags={skill.tags || []}
                            onToggleTag={tag => handleToggleTag(skill.id, tag)}
                            onCreateTag={tag => handleCreateTag(skill.id, tag)}
                            onManageTags={() => { setTagDropdownSkillId(null); setManageTagsOpen(true); }}
                            onClose={() => setTagDropdownSkillId(null)}
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* 时间信息 */}
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '16px', paddingTop: '12px', borderTop: '1px solid #f0f0f0' }}>
                    <div>最后修改: {skill.updateTime}</div>
                    {skill.agentCount !== undefined && skill.agentCount > 0 && (
                      <Tooltip
                        title={
                          <div>
                            <div style={{ marginBottom: '4px', fontWeight: 500 }}>关联的智能体：</div>
                            {skill.agents?.map((agent, idx) => (
                              <div key={idx} style={{ padding: '2px 0' }}>• {agent}</div>
                            ))}
                          </div>
                        }
                        placement="top"
                      >
                        <div style={{
                          marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '4px 8px', background: '#F0F0FF', borderRadius: '4px', cursor: 'pointer',
                        }}>
                          <span style={{ fontSize: '12px', color: '#6366F1' }}>👥</span>
                          <span style={{ fontSize: '12px', color: '#6366F1', fontWeight: 500 }}>{skill.agentCount} 个智能体</span>
                        </div>
                      </Tooltip>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  {!isThisPreview && (
                    <>
                      <Space size="small" style={{ width: '100%', justifyContent: 'center' }}>
                        {skill.status === 'published' ? (
                          <Tooltip title="下架">
                            <Button type="text" icon={<CloudDownloadOutlined />} onClick={(e) => { e.stopPropagation(); handleOffline(skill.id); }} style={{ color: '#F59E0B' }} />
                          </Tooltip>
                        ) : (
                          <Tooltip title="发布">
                            <Button type="text" icon={<CloudUploadOutlined />} onClick={(e) => { e.stopPropagation(); setPublishSkillId(skill.id); }} style={{ color: '#10B981' }} />
                          </Tooltip>
                        )}
                        {activeTab === 'mine' && (skill.history && skill.history.length > 0) && (
                          <Tooltip title="版本控制">
                            <Button
                              type="text"
                              icon={<HistoryOutlined />}
                              style={{ color: '#6366F1' }}
                              onClick={(e) => { e.stopPropagation(); setHistorySkill(skills.find(s => s.id === skill.id) || null); setHistoryOpen(true); }}
                            />
                          </Tooltip>
                        )}
                        <Tooltip title="删除">
                          <Button type="text" icon={<DeleteOutlined />} onClick={(e) => { e.stopPropagation(); handleDelete(skill.id, skill.name); }} style={{ color: '#EF4444' }} />
                        </Tooltip>
                      </Space>
                    </>
                  )}
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* 空状态 */}
      {filteredSkills.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fafafa', borderRadius: '12px', marginTop: '20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>{skills.length === 0 ? '📦' : '🔍'}</div>
          <h3 style={{ color: '#666', marginBottom: '8px' }}>{skills.length === 0 ? '暂无技能' : '未找到相关Skill'}</h3>
          <p style={{ color: '#999', marginBottom: '24px' }}>
            {skills.length === 0 ? '点击右上角"新增技能"按钮创建您的第一个技能' : '尝试修改搜索关键词或筛选条件'}
          </p>
          {skills.length === 0 && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSkill}
              style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', border: 'none', borderRadius: '8px' }}>
              新增技能
            </Button>
          )}
        </div>
      )}

      {/* 历史版本抽屉 */}
      <SkillHistoryDrawer
        skill={historySkill}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onRollback={handleRollback}
        previewVersion={previewState?.skillId === historySkill?.id ? previewState?.version || null : null}
        onPreviewVersion={(ver) => {
          if (historySkill) {
            setPreviewState({ skillId: historySkill.id, version: ver });
            setHistoryOpen(false);
          }
        }}
        onExitPreview={() => setPreviewState(null)}
      />

      {/* 发布版本 Modal */}
      {publishSkill && (
        <PublishSkillModal
          open={!!publishSkillId}
          latestVersion={getLatestVersion(publishSkill)}
          isNew={!publishSkill.history || publishSkill.history.filter(h => h.kind === 'publish').length === 0}
          onClose={() => setPublishSkillId(null)}
          onPublish={(version, changelog, scope) => handlePublishVersion(publishSkillId!, version, changelog, scope)}
        />
      )}

      {/* 管理标签 Modal */}
      <ManageTagsModal
        open={manageTagsOpen}
        allTags={allTags}
        onClose={() => setManageTagsOpen(false)}
        onConfirm={handleManageTagsConfirm}
      />

      {/* 上传技能包 Modal */}
      <SkillImportModal
        open={importModalOpen}
        fileName={importFileName}
        onClose={() => setImportModalOpen(false)}
        onImported={(skillName) => {
          message.success(`「${skillName}」已导入草稿箱`);
        }}
      />
    </div>
  );
};

export default Skill;
