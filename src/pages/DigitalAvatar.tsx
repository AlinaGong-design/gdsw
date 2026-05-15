import React, { useState } from 'react';
import {
  Button, Input, Tag, Modal, Select, Tabs, Badge,
  Switch, Drawer, Form, Progress, Divider, message,
} from 'antd';
import {
  PlusOutlined, UserOutlined, EditOutlined, DeleteOutlined,
  SearchOutlined, TagOutlined, MessageOutlined, BarChartOutlined,
  ClockCircleOutlined, CheckCircleOutlined, SyncOutlined,
  BranchesOutlined, PlayCircleOutlined, InfoCircleOutlined,
  LockOutlined, SettingOutlined, SendOutlined,
} from '@ant-design/icons';

// ─── 类型 ────────────────────────────────────────────────

type AvatarStyle = '专业严谨' | '亲切友好' | '简洁高效' | '创意发散';
type MemoryTag = '工作偏好' | '项目背景' | '沟通风格' | '专业知识' | '个人习惯';

interface MemoryItem {
  id: string;
  content: string;
  tags: MemoryTag[];
  createTime: string;
  source: 'auto' | 'manual';
}

interface ToolBinding {
  id: string;
  name: string;
  type: 'skill' | 'workflow' | 'agent';
  icon: string;
  enabled: boolean;
}

interface AvatarConfig {
  name: string;
  role: string;
  style: AvatarStyle;
  systemPrompt: string;
  tools: ToolBinding[];
  callCount: number;
  successRate: number;
  avgLatency: number;
  todayCalls: number;
}

// ─── Mock 数据 ──────────────────────────────────────────

const MOCK_AVATAR: AvatarConfig = {
  name: '我的助手',
  role: '产品经理',
  style: '专业严谨',
  systemPrompt: '你是我的专属 AI 助手，熟悉产品设计、需求分析和项目管理，能高效完成日常工作任务。',
  tools: [
    { id: 't1', name: 'web-search', type: 'skill', icon: '🔍', enabled: true },
    { id: 't2', name: '内容审核流程', type: 'workflow', icon: '⚡', enabled: true },
    { id: 't3', name: '数据分析师', type: 'agent', icon: '🤖', enabled: false },
    { id: 't4', name: 'feishu-doc', type: 'skill', icon: '📄', enabled: true },
  ],
  callCount: 1284,
  successRate: 97.3,
  avgLatency: 1.2,
  todayCalls: 23,
};

const MOCK_MEMORIES: MemoryItem[] = [
  { id: 'm1', content: '偏好使用飞书文档协作，不喜欢邮件沟通', tags: ['沟通风格', '工作偏好'], createTime: '2026-03-15', source: 'auto' },
  { id: 'm2', content: '当前负责"万卷 3.0"产品迭代，Q1 目标用户增长 30%', tags: ['项目背景'], createTime: '2026-03-14', source: 'manual' },
  { id: 'm3', content: '熟悉 JTBD 需求框架和 OKR 管理方法论', tags: ['专业知识'], createTime: '2026-03-12', source: 'auto' },
  { id: 'm4', content: '每天早上 9 点需要一份当日工作摘要', tags: ['个人习惯', '工作偏好'], createTime: '2026-03-10', source: 'manual' },
  { id: 'm5', content: '回复消息风格：简洁、要点化，避免长段落', tags: ['沟通风格'], createTime: '2026-03-08', source: 'auto' },
];

const ALL_TOOLS: ToolBinding[] = [
  { id: 't1', name: 'web-search', type: 'skill', icon: '🔍', enabled: true },
  { id: 't2', name: '内容审核流程', type: 'workflow', icon: '⚡', enabled: true },
  { id: 't3', name: '数据分析师', type: 'agent', icon: '🤖', enabled: false },
  { id: 't4', name: 'feishu-doc', type: 'skill', icon: '📄', enabled: true },
  { id: 't5', name: 'code-interpreter', type: 'skill', icon: '💻', enabled: false },
  { id: 't6', name: '智能客服分发', type: 'workflow', icon: '🎯', enabled: false },
  { id: 't7', name: '写作助手', type: 'agent', icon: '✍️', enabled: false },
];

const ENTERPRISE_EMPLOYEES = [
  { id: 'e1', name: '法务合规助手', dept: '法务��', desc: '合同审查、合规检查、法律风险评估', hot: true },
  { id: 'e2', name: 'HR 招聘助手', dept: '人力资源', desc: '简历筛选、面试安排、薪酬参考', hot: false },
  { id: 'e3', name: '财务报表助手', dept: '财务部', desc: '报表生成、数据核对、异常预警', hot: true },
  { id: 'e4', name: '代码审查助手', dept: '技术部', desc: '代码质量检查、安全漏洞扫描', hot: false },
];

const TAG_COLORS: Record<MemoryTag, string> = {
  '工作偏好': 'blue', '项目背景': 'purple',
  '沟通风格': 'green', '专业知识': 'orange', '个人习惯': 'cyan',
};

// ─── 通用样式常量 ────────────────────────────────────────

const CARD_STYLE: React.CSSProperties = {
  border: '1px solid #e8e8e8',
  borderRadius: 12,
  background: '#fff',
};

const SECTION_TITLE: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#1a1a1a',
  marginBottom: 4,
};

const SECTION_DESC: React.CSSProperties = {
  fontSize: 12,
  color: '#999',
  marginBottom: 14,
};

// ─── 主页面 ──────────────────────────────────────────────

// 企业员工卡片（独立组件避免在 map 中调用 hook）
const EmployeeCard: React.FC<{ emp: typeof ENTERPRISE_EMPLOYEES[0] }> = ({ emp }) => {
  const [called, setCalled] = useState(false);
  return (
    <div style={{ border: '1px solid #e8e8e8', borderRadius: 12, padding: '16px 18px', background: '#fff', transition: 'box-shadow 0.2s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(99,102,241,0.1)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🏢</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{emp.name}</span>
            {emp.hot && <Tag color="red" style={{ fontSize: 10, margin: 0, padding: '0 5px', lineHeight: '18px' }}>热门</Tag>}
          </div>
          <div style={{ fontSize: 11, color: '#aaa' }}>{emp.dept}</div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: '#666', lineHeight: 1.6, marginBottom: 14 }}>{emp.desc}</div>
      <Button
        size="small"
        type={called ? 'default' : 'primary'}
        icon={called ? <CheckCircleOutlined /> : <PlayCircleOutlined />}
        onClick={() => { setCalled(true); message.success(`已通过分身调用「${emp.name}」`); }}
        style={{ width: '100%', borderRadius: 6, fontSize: 12, ...(called ? {} : { background: '#6366F1', borderColor: '#6366F1' }) }}
      >
        {called ? '已调用' : '一键调用'}
      </Button>
    </div>
  );
};

const EmployeeCallTab: React.FC = () => (
  <div>
    <div style={{ background: '#fff7ed', border: '1px solid #fcd34d', borderRadius: 8, padding: '10px 16px', marginBottom: 18, fontSize: 12, color: '#92400e', display: 'flex', alignItems: 'center', gap: 8 }}>
      <BranchesOutlined />
      <span>企业数字员工由管理员在企业管理端配置和授权，你的分身可一键调用其专业能力，对话内容数据隔离、按岗授权</span>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
      {ENTERPRISE_EMPLOYEES.map(emp => <EmployeeCard key={emp.id} emp={emp} />)}
    </div>
  </div>
);

const DigitalAvatar: React.FC = () => {
  const [avatar, setAvatar] = useState<AvatarConfig>(MOCK_AVATAR);
  const [memories, setMemories] = useState<MemoryItem[]>(MOCK_MEMORIES);
  const [activeTab, setActiveTab] = useState('config');
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [addMemoryOpen, setAddMemoryOpen] = useState(false);
  const [toolModalOpen, setToolModalOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [memorySearch, setMemorySearch] = useState('');
  const [memoryTagFilter, setMemoryTagFilter] = useState<string>('');
  const [editingMemory, setEditingMemory] = useState<MemoryItem | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: `你好！我是你的专属助手「${MOCK_AVATAR.name}」，有什么可以帮你？` },
  ]);
  const [form] = Form.useForm();
  const [memForm] = Form.useForm();

  const filteredMemories = memories.filter(m => {
    const matchSearch = !memorySearch || m.content.includes(memorySearch);
    const matchTag = !memoryTagFilter || m.tags.includes(memoryTagFilter as MemoryTag);
    return matchSearch && matchTag;
  });

  const handleSaveAvatar = () => {
    form.validateFields().then(values => {
      setAvatar(prev => ({ ...prev, ...values }));
      setEditDrawerOpen(false);
      message.success('分身配置已保存');
    });
  };

  const handleDeleteMemory = (id: string) => {
    setMemories(prev => prev.filter(m => m.id !== id));
    message.success('记忆已删除');
  };

  const handleSaveMemory = () => {
    memForm.validateFields().then(values => {
      if (editingMemory) {
        setMemories(prev => prev.map(m => m.id === editingMemory.id ? { ...m, ...values } : m));
        message.success('记忆已更新');
      } else {
        setMemories(prev => [{
          id: `m${Date.now()}`, content: values.content,
          tags: values.tags || [], createTime: new Date().toISOString().split('T')[0], source: 'manual',
        }, ...prev]);
        message.success('记忆已添加');
      }
      setAddMemoryOpen(false);
      setEditingMemory(null);
      memForm.resetFields();
    });
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setTimeout(() => {
      setChatMessages(prev => [...prev, { role: 'assistant', text: `收到你的问题：「${userMsg}」，我正在处理...（OpenClaw 内核响应中）` }]);
    }, 800);
  };

  const toggleTool = (toolId: string) => {
    setAvatar(prev => ({
      ...prev,
      tools: prev.tools.map(t => t.id === toolId ? { ...t, enabled: !t.enabled } : t),
    }));
  };

  // ── 数据指标卡 ──
  const StatCard: React.FC<{ label: string; value: string | number; sub: string; color: string; icon: React.ReactNode }> = ({ label, value, sub, color, icon }) => (
    <div style={{ ...CARD_STYLE, padding: '18px 20px', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <span style={{ color, fontSize: 15 }}>{icon}</span>
        <span style={{ fontSize: 12, color: '#999' }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: '#bbb', marginTop: 6 }}>{sub}</div>
    </div>
  );

  return (
    <div style={{ background: '#f7f8fc', margin: -24, padding: 24, minHeight: 'calc(100vh - 64px)' }}>

      {/* ── 顶部信息栏 ── */}
      <div style={{ ...CARD_STYLE, padding: '20px 24px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 20 }}>
        {/* 头像区 */}
        <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0, boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}>
          🤖
        </div>

        {/* 名称 + 标签 */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>{avatar.name}</span>
            <Tag color="purple" style={{ borderRadius: 6, fontSize: 12 }}>{avatar.role}</Tag>
            <Tag style={{ borderRadius: 6, fontSize: 12, color: '#6366F1', borderColor: '#c4c6ff', background: '#f0f0ff' }}>{avatar.style}</Tag>
            <Badge status="success" text={<span style={{ fontSize: 12, color: '#10b981' }}>运行中</span>} style={{ marginLeft: 4 }} />
          </div>
          <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6, maxWidth: 560 }}>{avatar.systemPrompt}</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#999' }}>已绑定工具：</span>
            {avatar.tools.filter(t => t.enabled).map(t => (
              <Tag key={t.id} style={{ fontSize: 11, borderRadius: 4, margin: 0, background: '#f5f4ff', borderColor: '#d4d4ff', color: '#6366F1' }}>{t.icon} {t.name}</Tag>
            ))}
          </div>
        </div>

        {/* 操作按钮 */}
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <Button
            type="primary"
            icon={<MessageOutlined />}
            onClick={() => setChatOpen(true)}
            style={{ background: '#6366F1', borderColor: '#6366F1', borderRadius: 8, height: 38, fontWeight: 500 }}
          >
            唤起对话
          </Button>
          <Button
            icon={<EditOutlined />}
            onClick={() => { form.setFieldsValue(avatar); setEditDrawerOpen(true); }}
            style={{ borderRadius: 8, height: 38 }}
          >
            编辑配置
          </Button>
        </div>
      </div>

      {/* ── 数据指标行 ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <StatCard label="累计调用" value={avatar.callCount.toLocaleString()} sub="较上月 +12%" color="#6366F1" icon={<BarChartOutlined />} />
        <StatCard label="调用成功率" value={`${avatar.successRate}%`} sub="今日 98.1%" color="#10b981" icon={<CheckCircleOutlined />} />
        <StatCard label="平均响应" value={`${avatar.avgLatency}s`} sub="较上周 -0.3s" color="#f59e0b" icon={<ClockCircleOutlined />} />
        <StatCard label="今日调用" value={avatar.todayCalls} sub="消耗 Token ~28,400" color="#8B5CF6" icon={<SyncOutlined />} />
      </div>

      {/* ── 主体 Tab 区域 ── */}
      <div style={{ ...CARD_STYLE, overflow: 'hidden' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ padding: '0 24px' }}
          tabBarStyle={{ marginBottom: 0, borderBottom: '1px solid #f0f0f0' }}
          items={[
            {
              key: 'config',
              label: <span><SettingOutlined style={{ marginRight: 5 }} />分身配置</span>,
            },
            {
              key: 'memory',
              label: (
                <span>
                  <TagOutlined style={{ marginRight: 5 }} />记忆管理
                  <Badge count={memories.length} size="small" style={{ marginLeft: 6, background: '#6366F1' }} />
                </span>
              ),
            },
            {
              key: 'employee',
              label: <span><BranchesOutlined style={{ marginRight: 5 }} />企业员工能力</span>,
            },
            {
              key: 'stats',
              label: <span><BarChartOutlined style={{ marginRight: 5 }} />使用数据</span>,
            },
          ]}
        />

        <div style={{ padding: 24 }}>

          {/* ══ 分身配置 ══ */}
          {activeTab === 'config' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* 工具绑定 */}
              <div>
                <div style={SECTION_TITLE}>工具绑定</div>
                <div style={SECTION_DESC}>管理分身可调用的 Skill / 工作流 / 智能体，来自万卷平台</div>
                <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, overflow: 'hidden' }}>
                  {avatar.tools.map((tool, idx) => (
                    <div key={tool.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: idx < avatar.tools.length - 1 ? '1px solid #f5f5f5' : 'none', background: tool.enabled ? '#fff' : '#fafafa' }}>
                      <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{tool.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: tool.enabled ? '#1a1a1a' : '#aaa' }}>{tool.name}</div>
                        <Tag style={{ fontSize: 10, margin: '2px 0 0', padding: '0 6px', borderRadius: 4 }}
                          color={tool.type === 'skill' ? 'blue' : tool.type === 'workflow' ? 'purple' : 'green'}>
                          {tool.type === 'skill' ? 'Skill' : tool.type === 'workflow' ? '工作流' : '智能体'}
                        </Tag>
                      </div>
                      <Switch
                        checked={tool.enabled}
                        onChange={() => toggleTool(tool.id)}
                        size="small"
                        style={{ background: tool.enabled ? '#6366F1' : undefined }}
                      />
                    </div>
                  ))}
                  <div style={{ padding: '10px 16px', borderTop: '1px solid #f5f5f5' }}>
                    <Button size="small" icon={<PlusOutlined />} onClick={() => setToolModalOpen(true)} style={{ color: '#6366F1', borderColor: '#6366F1', borderRadius: 6 }}>
                      添加工具
                    </Button>
                  </div>
                </div>
              </div>

              {/* 右侧：唤起方式 + 数据隔离 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* 唤起方式选择 */}
                <div>
                  <div style={SECTION_TITLE}>前台唤起方式</div>
                  <div style={SECTION_DESC}>选择分身在万卷前台的呈现形式</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {[
                      { mode: '悬浮球', desc: '右下角常驻，一键展开', icon: '⭕', active: true },
                      { mode: '嵌入式', desc: '内嵌于页面侧边栏', icon: '🪟', active: false },
                      { mode: 'Sidebar', desc: '全屏侧边抽屉', icon: '📐', active: false },
                    ].map(item => (
                      <div key={item.mode} style={{ flex: 1, border: `2px solid ${item.active ? '#6366F1' : '#e8e8e8'}`, borderRadius: 10, padding: '12px', textAlign: 'center', cursor: 'pointer', background: item.active ? '#f5f4ff' : '#fff', transition: 'all 0.15s' }}>
                        <div style={{ fontSize: 22, marginBottom: 4 }}>{item.icon}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: item.active ? '#6366F1' : '#333', marginBottom: 2 }}>{item.mode}</div>
                        <div style={{ fontSize: 11, color: '#aaa' }}>{item.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 个人数据隔离说明 */}
                <div style={{ background: '#f8f7ff', border: '1px solid #e0deff', borderRadius: 10, padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <LockOutlined style={{ color: '#6366F1' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#6366F1' }}>个人数据隔离保障</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#555', lineHeight: 2 }}>
                    <div>• 记忆数据加密存储于个人独立命名空间</div>
                    <div>• 企业管理端无权访问个人对话内容与记忆明细</div>
                    <div>• 工具调用日志仅个人可见</div>
                    <div>• 基于万卷 RBAC 权限体系严格隔离</div>
                    <div>• OpenClaw 内核层级隔离，数据不跨租户</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ 记忆管理 ══ */}
          {activeTab === 'memory' && (
            <div>
              {/* 操作栏 */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <Input
                  prefix={<SearchOutlined style={{ color: '#bbb' }} />}
                  placeholder="搜索记忆内容..."
                  value={memorySearch}
                  onChange={e => setMemorySearch(e.target.value)}
                  style={{ width: 240, borderRadius: 8 }}
                  allowClear
                />
                <Select
                  placeholder="标签筛选" allowClear style={{ width: 130 }}
                  onChange={v => setMemoryTagFilter(v || '')}
                  options={Object.keys(TAG_COLORS).map(t => ({ label: t, value: t }))}
                />
                <Button type="primary" icon={<PlusOutlined />}
                  style={{ marginLeft: 'auto', background: '#6366F1', borderColor: '#6366F1', borderRadius: 8 }}
                  onClick={() => { setEditingMemory(null); memForm.resetFields(); setAddMemoryOpen(true); }}
                >
                  手动添加记忆
                </Button>
              </div>

              {/* 记忆说明 */}
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#92400e' }}>
                <InfoCircleOutlined style={{ marginRight: 6 }} />
                记忆由 OpenClaw 记忆模块自动沉淀（对话中提取），或由你手动添加，均仅个人可见。分身对话时会自动引用相关记忆。
              </div>

              {/* 记忆列表 */}
              {filteredMemories.length === 0 ? (
                <div style={{ padding: '60px 0', textAlign: 'center', color: '#bbb', fontSize: 14 }}>暂无匹配的记忆</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {filteredMemories.map(mem => (
                    <div key={mem.id} style={{ border: '1px solid #f0f0f0', borderRadius: 10, padding: '14px 16px', background: '#fff', transition: 'box-shadow 0.2s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, color: '#1a1a1a', lineHeight: 1.7, marginBottom: 8 }}>{mem.content}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            {mem.tags.map(tag => (
                              <Tag key={tag} color={TAG_COLORS[tag]} style={{ fontSize: 11, margin: 0, borderRadius: 6, padding: '1px 8px' }}>{tag}</Tag>
                            ))}
                            <span style={{ fontSize: 11, color: '#ccc' }}>
                              {mem.source === 'auto' ? '🤖 自动沉淀' : '✍️ 手动添加'} · {mem.createTime}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                          <Button size="small" type="text" icon={<EditOutlined />} style={{ color: '#aaa' }}
                            onClick={() => { setEditingMemory(mem); memForm.setFieldsValue({ content: mem.content, tags: mem.tags }); setAddMemoryOpen(true); }} />
                          <Button size="small" type="text" icon={<DeleteOutlined />} style={{ color: '#ff4d4f' }}
                            onClick={() => Modal.confirm({
                              title: '确认删除此记忆？', content: '删除后无法恢复',
                              okText: '删除', okButtonProps: { danger: true }, cancelText: '取消',
                              onOk: () => handleDeleteMemory(mem.id),
                            })} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ 企业员工能力 ══ */}
          {activeTab === 'employee' && (
            <EmployeeCallTab />
          )}

          {/* ══ 使用数据 ══ */}
          {activeTab === 'stats' && (
            <div>
              {/* 工具调用分布 */}
              <div style={{ ...CARD_STYLE, padding: '20px 24px', marginBottom: 16 }}>
                <div style={{ ...SECTION_TITLE, marginBottom: 16 }}>工具调用分布</div>
                {[
                  { name: 'web-search', pct: 42, count: 539, icon: '🔍' },
                  { name: 'feishu-doc', pct: 31, count: 398, icon: '📄' },
                  { name: '内容审核流程', pct: 18, count: 231, icon: '⚡' },
                  { name: '数据分析师', pct: 9, count: 116, icon: '🤖' },
                ].map(item => (
                  <div key={item.name} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, color: '#333' }}>{item.icon} {item.name}</span>
                      <span style={{ fontSize: 12, color: '#999' }}>{item.count} 次 · {item.pct}%</span>
                    </div>
                    <Progress percent={item.pct} strokeColor="#6366F1" showInfo={false} size="small" />
                  </div>
                ))}
              </div>

              {/* 最近调用记录 */}
              <div style={{ ...CARD_STYLE, padding: '20px 24px' }}>
                <div style={{ ...SECTION_TITLE, marginBottom: 16 }}>最近调用记录（仅本人可见）</div>
                {[
                  { time: '10:32', tool: 'web-search', input: '查询最新 AI 产品趋势报告', status: 'success', ms: 1240 },
                  { time: '10:18', tool: 'feishu-doc', input: '读取《需求文档 v3.2》', status: 'success', ms: 890 },
                  { time: '09:55', tool: '内容审核流程', input: '检测运营文案合规性', status: 'success', ms: 2100 },
                  { time: '09:30', tool: '数据分析师', input: '分析上周 DAU 数据波动', status: 'failed', ms: 5000 },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 0', borderBottom: i < 3 ? '1px solid #f5f5f5' : 'none' }}>
                    <span style={{ fontSize: 12, color: '#bbb', width: 36, flexShrink: 0 }}>{item.time}</span>
                    <Tag style={{ fontSize: 11, margin: 0, flexShrink: 0 }}>{item.tool}</Tag>
                    <span style={{ fontSize: 13, color: '#555', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.input}</span>
                    <span style={{ fontSize: 12, color: '#bbb', flexShrink: 0 }}>{item.ms}ms</span>
                    <Tag color={item.status === 'success' ? 'success' : 'error'} style={{ fontSize: 10, margin: 0, flexShrink: 0 }}>
                      {item.status === 'success' ? '成功' : '失败'}
                    </Tag>
                  </div>
                ))}
                <div style={{ marginTop: 12, fontSize: 12, color: '#ccc', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <InfoCircleOutlined />
                  企业端仅获取汇总指标，无个人明细访问权限
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ═══ 编辑分身 Drawer ═══ */}
      <Drawer
        title="编辑分身配置"
        open={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        width={480}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button onClick={() => setEditDrawerOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleSaveAvatar} style={{ background: '#6366F1', borderColor: '#6366F1' }}>保存</Button>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item label="分身名称" name="name" rules={[{ required: true, message: '请输入分身名称' }]}>
            <Input prefix={<UserOutlined style={{ color: '#bbb' }} />} placeholder="给你的 AI 分身起个名字" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item label="岗位 / 角色" name="role">
            <Input placeholder="如：产品经理、研发工程师、销售顾问..." style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item label="对话风格偏好" name="style">
            <Select style={{ borderRadius: 8 }} options={['专业严谨', '亲切友好', '简洁高效', '创意发散'].map(s => ({ label: s, value: s }))} />
          </Form.Item>
          <Form.Item label="角色设定（System Prompt）" name="systemPrompt">
            <Input.TextArea rows={5} placeholder="描述分身的专业背景、行为偏好和注意事项..." style={{ borderRadius: 8 }} />
          </Form.Item>
        </Form>
      </Drawer>

      {/* ═══ 添加/编辑记忆 Modal ═══ */}
      <Modal
        title={editingMemory ? '编辑记忆' : '添加记忆'}
        open={addMemoryOpen}
        onOk={handleSaveMemory}
        onCancel={() => { setAddMemoryOpen(false); setEditingMemory(null); memForm.resetFields(); }}
        okText={editingMemory ? '保存更新' : '添加'}
        cancelText="取消"
        okButtonProps={{ style: { background: '#6366F1', borderColor: '#6366F1' } }}
        destroyOnClose
      >
        <Form form={memForm} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item label="记忆内容" name="content" rules={[{ required: true, message: '请输入记忆内容' }]}>
            <Input.TextArea rows={3} placeholder="记录对 AI 分身有帮助的偏好、背景或习惯..." style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item label="标签" name="tags">
            <Select mode="multiple" placeholder="选择标签分类" style={{ borderRadius: 8 }}
              options={Object.keys(TAG_COLORS).map(t => ({ label: t, value: t }))} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ═══ 工具选择 Modal ═══ */}
      <Modal
        title="添加工具"
        open={toolModalOpen}
        onOk={() => { setToolModalOpen(false); message.success('工具配置已更新'); }}
        onCancel={() => setToolModalOpen(false)}
        okText="确定" cancelText="取消"
        okButtonProps={{ style: { background: '#6366F1', borderColor: '#6366F1' } }}
        width={500}
      >
        <div style={{ maxHeight: 360, overflowY: 'auto', marginTop: 12 }}>
          {ALL_TOOLS.map(tool => {
            const bound = avatar.tools.some(t => t.id === tool.id);
            return (
              <div key={tool.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 4px', borderBottom: '1px solid #f5f5f5' }}>
                <span style={{ fontSize: 20 }}>{tool.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{tool.name}</div>
                  <Tag color={tool.type === 'skill' ? 'blue' : tool.type === 'workflow' ? 'purple' : 'green'} style={{ fontSize: 10, margin: 0 }}>
                    {tool.type === 'skill' ? 'Skill' : tool.type === 'workflow' ? '工作流' : '智能体'}
                  </Tag>
                </div>
                <Button size="small"
                  type={bound ? 'default' : 'primary'}
                  style={{ borderRadius: 6, ...(bound ? { color: '#ff4d4f', borderColor: '#ff4d4f' } : { background: '#6366F1', borderColor: '#6366F1' }) }}
                  onClick={() => {
                    if (bound) {
                      setAvatar(prev => ({ ...prev, tools: prev.tools.filter(t => t.id !== tool.id) }));
                    } else {
                      setAvatar(prev => ({ ...prev, tools: [...prev.tools, { ...tool, enabled: true }] }));
                    }
                  }}
                >
                  {bound ? '移除' : '添加'}
                </Button>
              </div>
            );
          })}
        </div>
      </Modal>

      {/* ═══ 对话悬浮窗 Drawer ═══ */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🤖</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{avatar.name}</div>
              <div style={{ fontSize: 11, color: '#999', fontWeight: 400 }}>OpenClaw AI 内核 · {avatar.role}</div>
            </div>
          </div>
        }
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        width={440}
        footer={
          <div style={{ display: 'flex', gap: 8 }}>
            <Input
              placeholder="向分身发送消息..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onPressEnter={handleSendChat}
              style={{ borderRadius: 8, flex: 1 }}
            />
            <Button type="primary" icon={<SendOutlined />} onClick={handleSendChat}
              style={{ background: '#6366F1', borderColor: '#6366F1', borderRadius: 8 }} />
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 8 }}>
          {chatMessages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', gap: 10, alignItems: 'flex-start' }}>
              {msg.role === 'assistant' && (
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🤖</div>
              )}
              <div style={{
                maxWidth: '78%', padding: '10px 14px', borderRadius: msg.role === 'user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                background: msg.role === 'user' ? '#6366F1' : '#f5f5f5',
                color: msg.role === 'user' ? '#fff' : '#1a1a1a',
                fontSize: 13, lineHeight: 1.6,
              }}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
      </Drawer>

    </div>
  );
};

export default DigitalAvatar;
