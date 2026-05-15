import React, { useState, useMemo } from 'react';
import { Input, Button, Tag, Badge, Modal, message, Checkbox, Divider } from 'antd';
import {
  SearchOutlined,
  SyncOutlined,
  MessageOutlined,
  BarChartOutlined,
  WifiOutlined,
  CommentOutlined,
  ThunderboltOutlined,
  DesktopOutlined,
  SettingOutlined,
  BugOutlined,
  FileTextOutlined,
  TeamOutlined,
  RightOutlined,
  DownOutlined,
  PlusOutlined,
  BookOutlined,
  ApiOutlined,
  ClusterOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';

// ═══════════════════════════════════════════════════════════════
// 技能页数据
// ═══════════════════════════════════════════════════════════════

interface SkillEntry {
  name: string;
  description: string;
  tags: string[];
  eligible?: boolean;
  enabled: boolean;
  builtin?: boolean;
}

const BUILTIN_SKILLS: SkillEntry[] = [
  { name: 'web-search', description: 'Search the web for real-time information and current events.', tags: ['builtin'], enabled: true, builtin: true },
  { name: 'code-interpreter', description: 'Execute Python code in a sandboxed environment for data analysis and computation.', tags: ['builtin'], enabled: true, builtin: true },
  { name: 'image-generation', description: 'Generate images from text descriptions using AI models.', tags: ['builtin'], enabled: true, builtin: true },
  { name: 'file-reader', description: 'Read and parse various file formats including PDF, Excel, Word documents.', tags: ['builtin'], enabled: true, builtin: true },
  { name: 'calculator', description: 'Perform mathematical calculations and solve equations.', tags: ['builtin'], enabled: true, builtin: true },
];

const EXTRA_SKILLS: SkillEntry[] = [
  { name: 'feishu-doc', description: 'Feishu document read/write operations. Activate when user mentions Feishu docs, cloud docs, or docx links.', tags: ['openclaw-extra'], eligible: true, enabled: true },
  { name: 'feishu-drive', description: 'Feishu cloud storage file management. Activate when user mentions cloud space, folders, drive.', tags: ['openclaw-extra'], eligible: true, enabled: true },
  { name: 'feishu-perm', description: 'Feishu permission management for documents and files. Activate when user mentions sharing, permissions, collaborators.', tags: ['openclaw-extra'], eligible: true, enabled: true },
  { name: 'financial-data-standardizer', description: 'Convert CSV/Excel financial data to standardized JSON format. Activate when user mentions financial data processing.', tags: ['openclaw-extra'], eligible: true, enabled: false },
];

// ═══════════════════════════════════════════════════════════════
// 侧边栏导航
// ═══════════════════════════════════════════════════════════════

interface NavItem {
  key: string;
  icon: React.ReactNode;
  label: string;
}

const NAV_GROUPS: { label?: string; items: NavItem[] }[] = [
  {
    items: [
      { key: 'chat', icon: <CommentOutlined />, label: '聊天' },
    ],
  },
  {
    label: '控制',
    items: [
      { key: 'overview', icon: <BarChartOutlined />, label: '概览' },
      { key: 'channels', icon: <WifiOutlined />, label: '频道' },
      { key: 'instances', icon: <WifiOutlined style={{ fontSize: 12 }} />, label: '实例' },
      { key: 'sessions', icon: <MessageOutlined />, label: '会话' },
      { key: 'usage', icon: <BarChartOutlined />, label: '使用情况' },
      { key: 'cron', icon: <SettingOutlined />, label: '定时任务' },
    ],
  },
  {
    label: '代理',
    items: [
      { key: 'agents', icon: <TeamOutlined />, label: '代理' },
      { key: 'skills', icon: <ThunderboltOutlined />, label: '技能' },
      { key: 'nodes', icon: <DesktopOutlined />, label: '节点' },
      { key: 'wanjuan', icon: <BookOutlined />, label: '万卷' },
    ],
  },
  {
    label: '设置',
    items: [
      { key: 'config', icon: <SettingOutlined />, label: '配置' },
      { key: 'debug', icon: <BugOutlined />, label: '调试' },
      { key: 'logs', icon: <FileTextOutlined />, label: '日志' },
    ],
  },
  {
    label: '资源',
    items: [
      { key: 'docs', icon: <FileTextOutlined />, label: '文档' },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// 通用：技能行
// ═══════════════════════════════════════════════════════════════

const SkillRow: React.FC<{ skill: SkillEntry; onToggle: () => void }> = ({ skill, onToggle }) => (
  <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>{skill.name}</div>
      <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5, marginBottom: 8 }}>{skill.description}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {skill.tags.map(tag => (
          <Tag key={tag} style={{ fontSize: 11, borderRadius: 4, margin: 0 }}>{tag}</Tag>
        ))}
        {skill.eligible && (
          <Tag style={{ fontSize: 11, borderRadius: 4, margin: 0, color: '#16a34a', borderColor: '#16a34a', background: 'transparent' }}>
            eligible
          </Tag>
        )}
      </div>
    </div>
    <Button
      size="small"
      onClick={onToggle}
      style={{ flexShrink: 0, borderRadius: 6, fontSize: 13, height: 30, padding: '0 14px', color: skill.enabled ? '#555' : '#6366F1', borderColor: skill.enabled ? '#d9d9d9' : '#6366F1' }}
    >
      {skill.enabled ? 'Disable' : 'Enable'}
    </Button>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// 通用：折叠分组（技能页用）
// ═══════════════════════════════════════════════════════════════

const SkillGroup: React.FC<{ title: string; count: number; skills: SkillEntry[]; onToggle: (name: string) => void; defaultOpen?: boolean }> = ({ title, count, skills, onToggle, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <div onClick={() => setOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', cursor: 'pointer', background: '#fafafa', borderBottom: '1px solid #f0f0f0', userSelect: 'none' }}>
        {open ? <DownOutlined style={{ fontSize: 11, color: '#888' }} /> : <RightOutlined style={{ fontSize: 11, color: '#888' }} />}
        <span style={{ fontSize: 12, fontWeight: 600, color: '#555', letterSpacing: 0.5, textTransform: 'uppercase' }}>{title}</span>
        <span style={{ fontSize: 12, color: '#999', marginLeft: 4 }}>{count}</span>
      </div>
      {open && skills.map(skill => <SkillRow key={skill.name} skill={skill} onToggle={() => onToggle(skill.name)} />)}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// 万卷配置页
// ═══════════════════════════════════════════════════════════════

// ── 类型 ──

interface WjAgent { id: string; name: string; model: string; description: string; }
interface WjApi   { id: string; name: string; endpoint: string; method: string; description: string; }
interface WjMcp   { id: string; name: string; transport: string; command: string; description: string; }
interface WjSkill { id: string; name: string; description: string; tags: string[]; }

// ── 万卷后台现有数据（可选项来源）──

const ALL_AGENTS: WjAgent[] = [
  { id: 'a1', name: '写作助手', model: 'claude-sonnet-4-5', description: '帮助完成各类写作任务，支持多种文体和风格' },
  { id: 'a2', name: '数据分析师', model: 'claude-opus-4-5', description: '分析数据、生成报表、提供数据洞察' },
  { id: 'a3', name: 'Python 编程助手', model: 'claude-sonnet-4-5', description: '协助编写、调试和优化 Python 代码' },
  { id: 'a4', name: '翻译助手', model: 'claude-haiku-4-5', description: '多语言互译，支持中英日韩等主流语言' },
  { id: 'a5', name: '设计顾问', model: 'claude-sonnet-4-5', description: '提供 UI/UX 设计建议与配色方案' },
];

const ALL_APIS: WjApi[] = [
  { id: 'p1', name: 'Anthropic API', endpoint: 'https://api.anthropic.com', method: 'POST', description: 'Claude 系列模型调用接口' },
  { id: 'p2', name: '内部知识库 API', endpoint: 'https://kb.internal.example.com/api', method: 'GET', description: '企业内部知识库检索接口' },
  { id: 'p3', name: '飞书 Open API', endpoint: 'https://open.feishu.cn/open-apis', method: 'POST', description: '飞书文档、日历、消息等服务接口' },
  { id: 'p4', name: '数据报表 API', endpoint: 'https://report.example.com/v2', method: 'GET', description: '业务数据报表查询接口' },
];

const ALL_MCPS: WjMcp[] = [
  { id: 'm1', name: 'filesystem', transport: 'stdio', command: 'npx @modelcontextprotocol/server-filesystem', description: '本地文件系统读写' },
  { id: 'm2', name: 'fetch', transport: 'stdio', command: 'npx @modelcontextprotocol/server-fetch', description: '网络请求与内容抓取' },
  { id: 'm3', name: 'memory', transport: 'stdio', command: 'npx @modelcontextprotocol/server-memory', description: '对话记忆与上下文持久化' },
  { id: 'm4', name: 'sqlite', transport: 'stdio', command: 'npx @modelcontextprotocol/server-sqlite', description: 'SQLite 数据库读写操作' },
  { id: 'm5', name: 'brave-search', transport: 'stdio', command: 'npx @modelcontextprotocol/server-brave-search', description: 'Brave 搜索引擎接入' },
];

const ALL_SKILLS: WjSkill[] = [
  { id: 's1', name: 'web-search', description: 'Search the web for real-time information and current events.', tags: ['builtin'] },
  { id: 's2', name: 'code-interpreter', description: 'Execute Python code in a sandboxed environment.', tags: ['builtin'] },
  { id: 's3', name: 'feishu-doc', description: 'Feishu document read/write operations.', tags: ['openclaw-extra'] },
  { id: 's4', name: 'feishu-drive', description: 'Feishu cloud storage file management.', tags: ['openclaw-extra'] },
  { id: 's5', name: 'financial-data-standardizer', description: 'Convert CSV/Excel financial data to standardized JSON.', tags: ['openclaw-extra'] },
];

// ── 选择弹窗 ──

interface WjWorkflow { id: string; name: string; description: string; steps: number; status: string; }

const ALL_WORKFLOWS: WjWorkflow[] = [
  { id: 'w1', name: '内容审核流程', description: '对用户提交内容进行自动审核，包含敏感词过滤与人工复核节点', steps: 4, status: '已发布' },
  { id: 'w2', name: '数据处理流水线', description: '从数据源拉取、清洗、转换并写入目标数据库的完整流程', steps: 6, status: '已发布' },
  { id: 'w3', name: '智能客服分发', description: '根据用户意图自动路由到对应智能体或人工坐席', steps: 3, status: '已发布' },
  { id: 'w4', name: '报告自动生成', description: '定时拉取业务数据，调用 AI 生成分析报告并发送给订阅者', steps: 5, status: '草稿' },
  { id: 'w5', name: '代码审查助手', description: '触发 PR 时自动调用代码审查技能，输出审查建议并评论到 PR', steps: 3, status: '已发布' },
];

type ModalType = 'agent' | 'api' | 'mcp' | 'skill' | 'workflow';

const MODAL_META: Record<ModalType, { title: string; hashTarget: string; hashLabel: string }> = {
  agent:    { title: '选择智能体',  hashTarget: 'agent',    hashLabel: '前往万卷后台 · 智能体列表' },
  api:      { title: '选择 API',    hashTarget: 'api',      hashLabel: '前往万卷后台 · API 管理' },
  mcp:      { title: '选择 MCP',    hashTarget: 'mcp',      hashLabel: '前往万卷后台 · MCP 管理' },
  skill:    { title: '选择 Skills', hashTarget: 'skill',    hashLabel: '前往万卷后台 · 技能列表' },
  workflow: { title: '选择工作流',  hashTarget: 'workflow',  hashLabel: '前往万卷后台 · 工作流' },
};

function SelectModal<T extends { id: string; name: string; description: string }>({
  type, open, allItems, selectedIds, onConfirm, onCancel, renderMeta,
}: {
  type: ModalType;
  open: boolean;
  allItems: T[];
  selectedIds: string[];
  onConfirm: (ids: string[]) => void;
  onCancel: () => void;
  renderMeta: (item: T) => React.ReactNode;
}) {
  const [search, setSearch] = useState('');
  const [checked, setChecked] = useState<string[]>(selectedIds);
  const meta = MODAL_META[type];

  const filtered = useMemo(
    () => allItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase())),
    [allItems, search]
  );

  const toggle = (id: string) => setChecked(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <Modal
      title={<span style={{ fontSize: 15, fontWeight: 600 }}>{meta.title}</span>}
      open={open}
      onOk={() => onConfirm(checked)}
      onCancel={onCancel}
      okText="确定添加"
      cancelText="取消"
      width={520}
      okButtonProps={{ style: { background: '#ef4444', borderColor: '#ef4444' } }}
      destroyOnClose
    >
      {/* 搜索框 */}
      <Input
        prefix={<SearchOutlined style={{ color: '#bbb' }} />}
        placeholder="搜索..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ margin: '12px 0 4px', borderRadius: 6 }}
        allowClear
      />

      {/* 列表 */}
      <div style={{ maxHeight: 340, overflowY: 'auto', margin: '8px 0' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: '#bbb', fontSize: 13 }}>无匹配项</div>
        ) : filtered.map(item => (
          <div
            key={item.id}
            onClick={() => toggle(item.id)}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
              background: checked.includes(item.id) ? '#fff5f5' : 'transparent',
              border: checked.includes(item.id) ? '1px solid #fca5a5' : '1px solid transparent',
              marginBottom: 6, transition: 'all 0.15s',
            }}
          >
            <Checkbox checked={checked.includes(item.id)} style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 2 }}>{item.name}</div>
              <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5 }}>{item.description}</div>
              {renderMeta(item)}
            </div>
          </div>
        ))}
      </div>

      <Divider style={{ margin: '8px 0' }} />

      {/* 跳转万卷后台 */}
      <div
        onClick={() => { window.location.hash = meta.hashTarget; }}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 13, color: '#ef4444', cursor: 'pointer',
          padding: '4px 0',
        }}
      >
        <ArrowRightOutlined />
        <span style={{ textDecoration: 'underline' }}>{meta.hashLabel}</span>
        <span style={{ fontSize: 12, color: '#bbb', marginLeft: 2 }}>（新增后返回此处再选择）</span>
      </div>
    </Modal>
  );
}

// ── 万卷折叠分组组件 ──

function WjSection<T extends { id: string; name: string; description: string }>({
  icon, title, subtitle, items, onAdd, onRemove, renderItem, defaultOpen = false,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  items: T[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  renderItem: (item: T) => React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: '1px solid #e8e8e8', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
      <div
        onClick={() => setOpen(v => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', cursor: 'pointer', background: '#fafafa', borderBottom: open ? '1px solid #f0f0f0' : 'none', userSelect: 'none' }}
      >
        {open ? <DownOutlined style={{ fontSize: 11, color: '#888' }} /> : <RightOutlined style={{ fontSize: 11, color: '#888' }} />}
        <span style={{ fontSize: 15, color: '#555' }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{title}</span>
          <span style={{ fontSize: 12, color: '#999', marginLeft: 10 }}>{subtitle}</span>
        </div>
        <Tag style={{ fontSize: 11, margin: 0, borderRadius: 10 }}>{items.length}</Tag>
        <Button
          size="small"
          type="primary"
          icon={<PlusOutlined />}
          onClick={e => { e.stopPropagation(); onAdd(); }}
          style={{ borderRadius: 6, fontSize: 12, height: 28, padding: '0 10px', background: '#ef4444', borderColor: '#ef4444' }}
        >
          添加
        </Button>
      </div>
      {open && (
        <div>
          {items.length === 0 ? (
            <div style={{ padding: '28px 20px', textAlign: 'center', color: '#bbb', fontSize: 13 }}>
              暂无配置，点击「添加」从现有列表中选择
            </div>
          ) : items.map(item => (
            <div key={item.id} style={{
              padding: '14px 20px',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}>
              {/* 左侧：名称 + 描述 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 3 }}>{item.name}</div>
                <div style={{ fontSize: 12, color: '#999', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</div>
              </div>
              {/* 右侧：元信息 */}
              {renderItem(item)}
              {/* 移除按钮 */}
              <Button
                size="small"
                type="text"
                onClick={() => onRemove(item.id)}
                style={{ fontSize: 12, flexShrink: 0, color: '#ccc', padding: '0 6px' }}
              >
                移除
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 万卷配置主体 ──

const WanjuanConfig: React.FC = () => {
  const [agents,    setAgents]    = useState<WjAgent[]>([ALL_AGENTS[0], ALL_AGENTS[1]]);
  const [apis,      setApis]      = useState<WjApi[]>([ALL_APIS[0]]);
  const [mcps,      setMcps]      = useState<WjMcp[]>([ALL_MCPS[0]]);
  const [wjSkills,  setWjSkills]  = useState<WjSkill[]>([ALL_SKILLS[0], ALL_SKILLS[2]]);
  const [workflows, setWorkflows] = useState<WjWorkflow[]>([ALL_WORKFLOWS[0], ALL_WORKFLOWS[2]]);

  const [modal, setModal] = useState<ModalType | null>(null);

  const selectedIds = {
    agent:    agents.map(a => a.id),
    api:      apis.map(a => a.id),
    mcp:      mcps.map(a => a.id),
    skill:    wjSkills.map(a => a.id),
    workflow: workflows.map(a => a.id),
  };

  const handleConfirm = (type: ModalType, ids: string[]) => {
    if (type === 'agent')    setAgents(ALL_AGENTS.filter(i => ids.includes(i.id)));
    else if (type === 'api')      setApis(ALL_APIS.filter(i => ids.includes(i.id)));
    else if (type === 'mcp')      setMcps(ALL_MCPS.filter(i => ids.includes(i.id)));
    else if (type === 'skill')    setWjSkills(ALL_SKILLS.filter(i => ids.includes(i.id)));
    else if (type === 'workflow') setWorkflows(ALL_WORKFLOWS.filter(i => ids.includes(i.id)));
    message.success('配置已更新');
    setModal(null);
  };

  return (
    <div style={{ padding: '28px 40px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>万卷配置</h1>
        <p style={{ margin: 0, fontSize: 13, color: '#888' }}>从万卷后台选择智能体、API、MCP 与 Skill，绑定到当前工作区。</p>
      </div>

      {/* 智能体 */}
      <WjSection<WjAgent>
        icon={<TeamOutlined />} title="智能体" subtitle="Agents"
        items={agents} onAdd={() => setModal('agent')} onRemove={id => setAgents(p => p.filter(x => x.id !== id))}
        defaultOpen={true}
        renderItem={item => (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, minWidth: 200 }}>
            <Tag style={{ fontSize: 12, margin: 0, padding: '2px 10px', borderRadius: 12 }}>{item.model}</Tag>
          </div>
        )}
      />

      {/* 工作流 */}
      <WjSection<WjWorkflow>
        icon={<span>⚡</span>} title="工作流" subtitle="Workflows"
        items={workflows} onAdd={() => setModal('workflow')} onRemove={id => setWorkflows(p => p.filter(x => x.id !== id))}
        defaultOpen={true}
        renderItem={item => (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, minWidth: 200 }}>
            <Tag style={{ fontSize: 12, margin: 0, padding: '2px 10px', borderRadius: 12 }}>{item.steps} 个节点</Tag>
            <Tag color={item.status === '已发布' ? 'success' : 'warning'} style={{ fontSize: 12, margin: 0, padding: '2px 10px', borderRadius: 12 }}>{item.status}</Tag>
          </div>
        )}
      />

      {/* API */}
      <WjSection<WjApi>
        icon={<ApiOutlined />} title="API" subtitle="接口配置"
        items={apis} onAdd={() => setModal('api')} onRemove={id => setApis(p => p.filter(x => x.id !== id))}
        defaultOpen={true}
        renderItem={item => (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, minWidth: 200 }}>
            <Tag color="blue" style={{ fontSize: 12, margin: 0, padding: '2px 10px', borderRadius: 12, flexShrink: 0 }}>{item.method}</Tag>
            <code style={{ fontSize: 12, color: '#888', background: '#f5f5f5', padding: '3px 10px', borderRadius: 6, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.endpoint}</code>
          </div>
        )}
      />

      {/* MCP */}
      <WjSection<WjMcp>
        icon={<ClusterOutlined />} title="MCP" subtitle="Model Context Protocol"
        items={mcps} onAdd={() => setModal('mcp')} onRemove={id => setMcps(p => p.filter(x => x.id !== id))}
        defaultOpen={true}
        renderItem={item => (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, minWidth: 200 }}>
            <Tag style={{ fontSize: 12, margin: 0, padding: '2px 10px', borderRadius: 12, flexShrink: 0 }}>{item.transport}</Tag>
            <code style={{ fontSize: 12, color: '#6366F1', background: '#f5f4ff', padding: '3px 10px', borderRadius: 6, maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.command}</code>
          </div>
        )}
      />

      {/* Skills */}
      <WjSection<WjSkill>
        icon={<ThunderboltOutlined />} title="Skills" subtitle="技能绑定"
        items={wjSkills} onAdd={() => setModal('skill')} onRemove={id => setWjSkills(p => p.filter(x => x.id !== id))}
        defaultOpen={true}
        renderItem={item => (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, flexWrap: 'wrap', minWidth: 200 }}>
            {item.tags.map(t => <Tag key={t} style={{ fontSize: 12, margin: 0, padding: '2px 10px', borderRadius: 12 }}>{t}</Tag>)}
          </div>
        )}
      />

      {/* 智能体选择弹窗 */}
      {modal === 'agent' && (
        <SelectModal<WjAgent>
          type="agent" open allItems={ALL_AGENTS} selectedIds={selectedIds.agent}
          onConfirm={ids => handleConfirm('agent', ids)} onCancel={() => setModal(null)}
          renderMeta={item => <Tag style={{ fontSize: 10, margin: '4px 0 0', borderRadius: 4 }}>{item.model}</Tag>}
        />
      )}
      {/* API 选择弹窗 */}
      {modal === 'api' && (
        <SelectModal<WjApi>
          type="api" open allItems={ALL_APIS} selectedIds={selectedIds.api}
          onConfirm={ids => handleConfirm('api', ids)} onCancel={() => setModal(null)}
          renderMeta={item => (
            <div style={{ marginTop: 4, display: 'flex', gap: 5 }}>
              <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>{item.method}</Tag>
              <code style={{ fontSize: 10, color: '#888' }}>{item.endpoint}</code>
            </div>
          )}
        />
      )}
      {/* MCP 选择弹窗 */}
      {modal === 'mcp' && (
        <SelectModal<WjMcp>
          type="mcp" open allItems={ALL_MCPS} selectedIds={selectedIds.mcp}
          onConfirm={ids => handleConfirm('mcp', ids)} onCancel={() => setModal(null)}
          renderMeta={item => (
            <div style={{ marginTop: 4, display: 'flex', gap: 5, alignItems: 'center' }}>
              <Tag style={{ fontSize: 10, margin: 0 }}>{item.transport}</Tag>
              <code style={{ fontSize: 10, color: '#6366F1' }}>{item.command}</code>
            </div>
          )}
        />
      )}
      {/* Skill 选择弹窗 */}
      {modal === 'skill' && (
        <SelectModal<WjSkill>
          type="skill" open allItems={ALL_SKILLS} selectedIds={selectedIds.skill}
          onConfirm={ids => handleConfirm('skill', ids)} onCancel={() => setModal(null)}
          renderMeta={item => (
            <div style={{ marginTop: 4, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {item.tags.map(t => <Tag key={t} style={{ fontSize: 10, margin: 0 }}>{t}</Tag>)}
            </div>
          )}
        />
      )}
      {/* 工作流选择弹窗 */}
      {modal === 'workflow' && (
        <SelectModal<WjWorkflow>
          type="workflow" open allItems={ALL_WORKFLOWS} selectedIds={selectedIds.workflow}
          onConfirm={ids => handleConfirm('workflow', ids)} onCancel={() => setModal(null)}
          renderMeta={item => (
            <div style={{ marginTop: 4, display: 'flex', gap: 5, alignItems: 'center' }}>
              <Tag style={{ fontSize: 10, margin: 0 }}>{item.steps} 个节点</Tag>
              <Tag color={item.status === '已发布' ? 'success' : 'warning'} style={{ fontSize: 10, margin: 0 }}>{item.status}</Tag>
            </div>
          )}
        />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// 技能页
// ═══════════════════════════════════════════════════════════════

const SkillsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [builtinSkills, setBuiltinSkills] = useState(BUILTIN_SKILLS);
  const [extraSkills, setExtraSkills] = useState(EXTRA_SKILLS);

  const toggleBuiltin = (name: string) => setBuiltinSkills(prev => prev.map(s => s.name === name ? { ...s, enabled: !s.enabled } : s));
  const toggleExtra = (name: string) => setExtraSkills(prev => prev.map(s => s.name === name ? { ...s, enabled: !s.enabled } : s));

  const filterFn = (s: SkillEntry) => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase());
  const filteredBuiltin = builtinSkills.filter(filterFn);
  const filteredExtra = extraSkills.filter(filterFn);
  const totalShown = filteredBuiltin.length + filteredExtra.length;

  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>技能</h1>
        <p style={{ margin: 0, fontSize: 13, color: '#888' }}>管理技能可用性和 API 密钥注入。</p>
      </div>
      <div style={{ border: '1px solid #e8e8e8', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>Skills</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Bundled, managed, and workspace skills.</div>
          </div>
          <Button icon={<SyncOutlined />} onClick={() => setSearch('')} style={{ borderRadius: 6, fontSize: 13 }}>Refresh</Button>
        </div>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa' }}>
          <span style={{ fontSize: 13, color: '#555', fontWeight: 500 }}>Filter</span>
          <span style={{ fontSize: 12, color: '#999' }}>{totalShown} shown</span>
        </div>
        <div style={{ padding: '10px 20px', borderBottom: '1px solid #f0f0f0' }}>
          <Input prefix={<SearchOutlined style={{ color: '#bbb' }} />} placeholder="Search skills" value={search} onChange={e => setSearch(e.target.value)} style={{ borderRadius: 6, fontSize: 13 }} allowClear />
        </div>
        <SkillGroup title="BUILT-IN SKILLS" count={filteredBuiltin.length} skills={filteredBuiltin} onToggle={toggleBuiltin} defaultOpen={false} />
        <SkillGroup title="EXTRA SKILLS" count={filteredExtra.length} skills={filteredExtra} onToggle={toggleExtra} defaultOpen={true} />
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════════════════════

const OpenClawDashboard: React.FC = () => {
  const [activeNav, setActiveNav] = useState('skills');

  const renderContent = () => {
    if (activeNav === 'wanjuan') return <WanjuanConfig />;
    if (activeNav === 'skills') return <SkillsPage />;
    return (
      <div style={{ padding: '28px 32px' }}>
        <div style={{ padding: '80px 20px', textAlign: 'center', color: '#bbb', fontSize: 14 }}>
          「{NAV_GROUPS.flatMap(g => g.items).find(i => i.key === activeNav)?.label ?? activeNav}」页面建设中
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#fff', overflow: 'hidden' }}>

      {/* ── 左侧导航 ── */}
      <div style={{ width: 200, flexShrink: 0, borderRight: '1px solid #e8e8e8', display: 'flex', flexDirection: 'column', background: '#fff', overflowY: 'auto' }}>
        {/* Logo */}
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🦞</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.2 }}>OPENCLAW</div>
            <div style={{ fontSize: 10, color: '#999', lineHeight: 1.2 }}>GATEWAY DASHBOARD</div>
          </div>
        </div>

        {/* 菜单 */}
        <div style={{ flex: 1, padding: '8px 0' }}>
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <div style={{ padding: '12px 16px 4px', fontSize: 11, fontWeight: 600, color: '#aaa', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                  {group.label}
                </div>
              )}
              {group.items.map(item => (
                <div
                  key={item.key}
                  onClick={() => setActiveNav(item.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '7px 16px', cursor: 'pointer', borderRadius: 6, margin: '1px 6px',
                    background: activeNav === item.key ? '#fef2f2' : 'transparent',
                    color: activeNav === item.key ? '#ef4444' : '#555',
                    fontWeight: activeNav === item.key ? 600 : 400,
                    fontSize: 13, transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (activeNav !== item.key) e.currentTarget.style.background = '#f5f5f5'; }}
                  onMouseLeave={e => { if (activeNav !== item.key) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ fontSize: 14 }}>{item.icon}</span>
                  {item.label}
                  {/* 万卷 badge */}
                  {item.key === 'wanjuan' && (
                    <span style={{ marginLeft: 'auto', fontSize: 10, background: '#ef4444', color: '#fff', borderRadius: 8, padding: '1px 6px', fontWeight: 500 }}>
                      NEW
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── 右侧区域 ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* 顶部状态栏 */}
        <div style={{ height: 48, padding: '0 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 20, flexShrink: 0, background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#555' }}>
            <Badge status="processing" color="green" />
            版本 <span style={{ color: '#888' }}>dev</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#555' }}>
            <Badge status="success" />
            健康状态 正常
          </div>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, cursor: 'pointer' }}>
            🖥
          </div>
          <SettingOutlined style={{ fontSize: 16, color: '#888', cursor: 'pointer' }} />
        </div>

        {/* 页面内容 */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default OpenClawDashboard;
