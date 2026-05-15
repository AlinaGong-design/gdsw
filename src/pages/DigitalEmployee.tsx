import React, { useState } from 'react';
import {
  Button, Input, Tag, Modal, Select, Badge,
  Drawer, Table, Divider, message, Steps, Switch, Radio, Checkbox,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, EditOutlined, SearchOutlined,
  PlayCircleOutlined, PauseCircleOutlined, RollbackOutlined,
  ApiOutlined, CheckCircleOutlined, StopOutlined,
  CloudUploadOutlined, TeamOutlined, LockOutlined, GlobalOutlined,
  CopyOutlined, SendOutlined, BranchesOutlined, UserOutlined,
  ThunderboltOutlined, SafetyOutlined, DeploymentUnitOutlined,
  ExperimentOutlined, ArrowLeftOutlined,
} from '@ant-design/icons';

// ─── 类型 ─────────────────────────────────────────────────

type EmployeeStatus = 'draft' | 'testing' | 'published' | 'paused' | 'archived';
type DeployScope = 'private' | 'dept' | 'company';

interface EmployeeVersion {
  versionId: string;
  version: string;
  changelog: string;
  publishedAt: string;
  publishedBy: string;
  status: 'active' | 'history';
}

interface DigitalEmployeeItem {
  id: string;
  name: string;
  dept: string;
  description: string;
  status: EmployeeStatus;
  version: string;
  scope: DeployScope;
  updateTime: string;
}

// ─── Mock 数据 ────────────────────────────────────────────

const MOCK_EMPLOYEES: DigitalEmployeeItem[] = [
  { id: 'de-001', name: '法务合规助手', dept: '法务部', description: '合同审查、合规检查、法律风险评估，支持多种合同模板自动识别与条款提取', status: 'published', version: 'v2.1.0', scope: 'company', updateTime: '2026-03-10' },
  { id: 'de-002', name: 'HR 招聘助手', dept: '人力资源', description: '简历智能筛选、面试时间协调、薪酬 benchmark 参考，接入飞书日历', status: 'published', version: 'v1.3.2', scope: 'dept', updateTime: '2026-03-05' },
  { id: 'de-003', name: '财务报表助手', dept: '财务部', description: '定时拉取业务数据，AI 生成分析报告，异常数据预警推送', status: 'testing', version: 'v3.0.0-beta', scope: 'dept', updateTime: '2026-03-14' },
  { id: 'de-004', name: '代码审查助手', dept: '技术部', description: 'PR 触发自动代码审查，安全漏洞扫描，输出审查建议并评论到 GitLab/GitHub', status: 'paused', version: 'v1.1.0', scope: 'dept', updateTime: '2026-02-28' },
  { id: 'de-005', name: '智能客服分发', dept: '客户成功', description: '意图识别、多轮路由分发、自动记录工单，支持人工接管', status: 'draft', version: 'v0.1.0', scope: 'private', updateTime: '2026-03-15' },
];

const MOCK_VERSIONS: EmployeeVersion[] = [
  { versionId: 'v3', version: 'v2.1.0', changelog: '优化合同识别准确率，新增风险等级标注', publishedAt: '2026-03-10 14:30', publishedBy: '张三', status: 'active' },
  { versionId: 'v2', version: 'v2.0.1', changelog: '修复飞书文档权限异常问题', publishedAt: '2026-02-28 09:15', publishedBy: '张三', status: 'history' },
  { versionId: 'v1', version: 'v2.0.0', changelog: '重构 Prompt 结构，支持多类型合同模板', publishedAt: '2026-02-15 16:00', publishedBy: '李四', status: 'history' },
];

const STATUS_CONFIG: Record<EmployeeStatus, { label: string; badgeStatus: 'default' | 'processing' | 'success' | 'warning' | 'error' }> = {
  draft:     { label: '草稿',   badgeStatus: 'default' },
  testing:   { label: '测试中', badgeStatus: 'processing' },
  published: { label: '运行中', badgeStatus: 'success' },
  paused:    { label: '已暂停', badgeStatus: 'warning' },
  archived:  { label: '已归档', badgeStatus: 'error' },
};

const SCOPE_CONFIG: Record<DeployScope, { label: string; icon: React.ReactNode }> = {
  private: { label: '仅创建者', icon: <LockOutlined /> },
  dept:    { label: '部门内',   icon: <TeamOutlined /> },
  company: { label: '全公司',   icon: <GlobalOutlined /> },
};

// ─── 头像自动生成 ─────────────────────────────────────────

const AVATAR_COLORS = [
  'linear-gradient(135deg, #6366F1, #8B5CF6)',
  'linear-gradient(135deg, #3B82F6, #06B6D4)',
  'linear-gradient(135deg, #10B981, #34d399)',
  'linear-gradient(135deg, #F59E0B, #FBBF24)',
  'linear-gradient(135deg, #EF4444, #F87171)',
  'linear-gradient(135deg, #8B5CF6, #EC4899)',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── 向导配置数据 ─────────────────────────────────────────

const DEPARTMENTS = ['法务部', '人力资源', '财务部', '技术部', '产品部', '市场部', '客户成功', '运营部'];

const MODEL_OPTIONS = [
  { id: 'chat-model', name: '通用对话', tag: '均衡推荐', desc: '适合日常问答、任务处理，性价比最优', icon: '💬', color: '#6366F1' },
  { id: 'gpt-4o',     name: '高性能推理', tag: '复杂场景', desc: '强逻辑推理，适合法务、财务等专业分析', icon: '🧠', color: '#8B5CF6' },
  { id: 'qwen-max',   name: '长文本处理', tag: '大文档', desc: '超长上下文，适合合同全文审查、报告生成', icon: '📄', color: '#10B981' },
  { id: 'glm-4',      name: '国产安全', tag: '数据合规', desc: '国产大模型私有化部署，满足数据安全要求', icon: '🛡️', color: '#F59E0B' },
];

const KNOWLEDGE_BASES = [
  { id: 'kb1', name: '法律法规库', desc: '国家法律法规、行业规范文件', icon: '⚖️' },
  { id: 'kb2', name: '公司制度手册', desc: '内部规章制度、标准流程文档', icon: '📋' },
  { id: 'kb3', name: '产品知识库', desc: '产品说明、FAQ、使用手册', icon: '📦' },
  { id: 'kb4', name: '行业研报库', desc: '行业分析报告、市场数据', icon: '📊' },
  { id: 'kb5', name: '技术文档库', desc: 'API 文档、开发规范、架构设计', icon: '💻' },
];

const SKILL_LIST = [
  { id: 'sk1', name: '网络搜索', type: 'Skill', icon: '🔍', desc: '实时搜索互联网信息' },
  { id: 'sk2', name: '飞书文档', type: 'Skill', icon: '📄', desc: '飞书文档读写与管理' },
  { id: 'sk3', name: 'Python 执行', type: 'Skill', icon: '🐍', desc: '执行 Python 代码，处理结构化数据' },
  { id: 'sk4', name: 'PDF 解析', type: 'Skill', icon: '📃', desc: '解析 PDF 文档内容' },
  { id: 'sk5', name: '内容审核流程', type: '工作流', icon: '⚡', desc: '多节点内容合规审查' },
  { id: 'sk6', name: '数据报表流程', type: '工作流', icon: '📊', desc: '数据拉取、清洗、报表自动生成' },
  { id: 'sk7', name: '邮件通知流程', type: '工作流', icon: '📧', desc: '自动化邮件报告与通知' },
];

const INTEGRATIONS = [
  { id: 'int1', name: '飞书', icon: '🪶', desc: '消息推送、文档、日历、审批流' },
  { id: 'int2', name: '钉钉', icon: '📎', desc: '群消息、工作通知、表单填写' },
  { id: 'int3', name: 'GitHub / GitLab', icon: '🐙', desc: 'PR 审查、Issue 管理、代码操作' },
  { id: 'int4', name: 'Jira', icon: '🎯', desc: '工单创建、状态更新、看板联动' },
  { id: 'int5', name: 'Salesforce', icon: '☁️', desc: 'CRM 数据读写、商机与客户跟踪' },
];

const RESPONSE_STYLES = [
  { id: 'formal',   label: '正式严谨', desc: '措辞严谨，引用依据，适合法务/财务场景', icon: '⚖️' },
  { id: 'friendly', label: '专业友好', desc: '专业中带亲和力，适合客服/HR 场景', icon: '🤝' },
  { id: 'concise',  label: '简洁直接', desc: '结论优先，省略铺垫，适合技术/研发场景', icon: '⚡' },
];

const CONTENT_RESTRICTIONS = [
  { id: 'r1', label: '不评价竞品及同类产品' },
  { id: 'r2', label: '不提供具体法律意见（仅供参考）' },
  { id: 'r3', label: '不透露公司内部定��策略' },
  { id: 'r4', label: '不处理超出职责范围的请求' },
  { id: 'r5', label: '不生成可能引发合规风险的内容' },
];

const CHANNELS = [
  { id: 'embed', label: '前台嵌入', desc: '悬浮窗或内嵌部署到万卷前台', icon: '🖥️' },
  { id: 'api',   label: 'REST API', desc: '标准 HTTP 接口，支持外部系统集成', icon: '🔌' },
  { id: 'flow',  label: '工作流节点', desc: '作为节点嵌入万卷工作流', icon: '⚡' },
  { id: 'feishu',label: '飞书机器人', desc: '以飞书群机器人形式提供服务', icon: '🪶' },
  { id: 'ding',  label: '钉钉机器人', desc: '以钉钉群机器人形式提供服务', icon: '📎' },
];

const DEFAULT_PROMPT = `你是「{员工名称}」，{部门}的{角色定位}。

【职责范围】
- 请在此描述该员工的核心职责1
- 请在此描述该员工的核心职责2
- 请在此描述该员工的核心职责3

【工作原则】
1. 所有回答须基于知识库与工具检索结果，不凭空推断
2. 遇到超出职责范围的问题，说明边界并引导至正确渠道
3. 涉及重大决策的建议须附加"建议人工复核"提示

【输出规范】
- 回复语言：简体中文
- 格式：结构化输出，核心结论置前
- 长度：核心答案控制在 500 字内，复杂问题可附详细说明`;

// ─── 向导状态 ─────────────────────────────────────────────

interface WizardData {
  name: string;
  dept: string;
  role: string;
  description: string;
  model: string;
  prompt: string;
  kbEnabled: Record<string, boolean>;
  memoryMode: string;
  skillEnabled: Record<string, boolean>;
  integrations: string[];
  responseStyle: string;
  handoffMode: string;
  restrictions: string[];
  triggerMode: string;
  accessScope: string;
  channels: string[];
}

const initWizardData = (): WizardData => ({
  name: '',
  dept: '',
  role: '',
  description: '',
  model: 'chat-model',
  prompt: DEFAULT_PROMPT,
  kbEnabled: {},
  memoryMode: 'multi',
  skillEnabled: { sk1: true, sk2: true },
  integrations: [],
  responseStyle: 'friendly',
  handoffMode: 'on_request',
  restrictions: ['r1', 'r2', 'r4'],
  triggerMode: 'manual',
  accessScope: 'dept',
  channels: ['embed', 'api'],
});

// ─── 子组件：步骤标题 ─────────────────────────────────────

const SectionTitle: React.FC<{ title: string; desc?: string }> = ({ title, desc }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{title}</div>
    {desc && <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{desc}</div>}
  </div>
);

// ─── 创建 / 编辑向导（4步） ────────────────────────────────

const STEPS = [
  { title: '基础信息', description: '员工身份与职能' },
  { title: 'AI 能力', description: '模型、知识与技能' },
  { title: '部署配置', description: '上线渠道与权限' },
  { title: '测试发布', description: '调试验证并上线' },
];

interface TestMessage { role: 'user' | 'ai'; content: string; }

const CreateWizard: React.FC<{ onClose: () => void; initialData?: Partial<WizardData>; isEdit?: boolean }> = ({ onClose, initialData, isEdit }) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>({ ...initWizardData(), ...initialData });
  const [testInput, setTestInput] = useState('');
  const [testMessages, setTestMessages] = useState<TestMessage[]>([]);
  const [testLoading, setTestLoading] = useState(false);

  const update = (patch: Partial<WizardData>) => setData(prev => ({ ...prev, ...patch }));

  const canNext = (): boolean => {
    if (step === 0) return !!data.name.trim() && !!data.dept && !!data.role.trim();
    if (step === 1) return !!data.prompt.trim();
    return true;
  };

  const handleSendTest = () => {
    if (!testInput.trim() || testLoading) return;
    const userMsg = testInput.trim();
    setTestMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setTestInput('');
    setTestLoading(true);
    setTimeout(() => {
      const name = data.name || '数字员工';
      const role = data.role || '智能助理';
      const replies = [
        `您好！我是「${name}」，${role}。我已收到您的问题，正在基于知识库为您检索相关信息，请稍候…`,
        `根据您的需求，我作为${name}将从以下角度为您分析：\n\n1. 初步判断您的需求属于${role}的职责范围\n2. 建议结合相关知识库内容进行深入处理\n3. 如需人工介入，可随时呼叫`,
        `感谢您的提问。作为${name}，我会严格依据配置的知识库与工作原则来回答，确保信息准确可靠。请问您还有其他需要补充的背景信息吗？`,
      ];
      setTestMessages(prev => [...prev, { role: 'ai', content: replies[Math.floor(Math.random() * replies.length)] }]);
      setTestLoading(false);
    }, 1000);
  };

  // ── 步骤 0：基础信息 ──────────────────────────────────

  const Step0 = () => {
    const avatarBg = data.name.trim() ? getAvatarColor(data.name.trim()) : '#e2e8f0';
    const avatarChar = data.name.trim() ? data.name.trim().charAt(0) : '?';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* 头像 + 名称 — 顶部横排 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: 'linear-gradient(135deg, #f5f4ff 0%, #f0f9ff 100%)', borderRadius: 12, border: '1px solid #e8e8f0' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, flexShrink: 0,
            background: avatarBg, display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#fff', fontSize: 24, fontWeight: 700,
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)', transition: 'background 0.3s',
          }}>
            {avatarChar}
          </div>
          <div style={{ flex: 1 }}>
            <Input
              value={data.name}
              onChange={e => update({ name: e.target.value })}
              placeholder="输入员工名称，如：法务合规助手"
              style={{ fontSize: 15, fontWeight: 600, borderRadius: 8, border: '1px solid #d9d9d9' }}
              bordered
            />
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 5 }}>
              头像根据名称自动生成，创建后可修改
            </div>
          </div>
        </div>

        {/* 部门 + 角色 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, color: '#555', marginBottom: 6, fontWeight: 500 }}>
              所属部门 <span style={{ color: '#ff4d4f' }}>*</span>
            </div>
            <Select
              value={data.dept || undefined}
              onChange={v => update({ dept: v })}
              placeholder="选择部门"
              style={{ width: '100%' }}
              options={DEPARTMENTS.map(d => ({ label: d, value: d }))}
            />
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#555', marginBottom: 6, fontWeight: 500 }}>
              角色定位 <span style={{ color: '#ff4d4f' }}>*</span>
            </div>
            <Input
              value={data.role}
              onChange={e => update({ role: e.target.value })}
              placeholder="如：法务合规顾问、HR 招聘专员"
            />
          </div>
        </div>

        {/* 功能描述 */}
        <div>
          <div style={{ fontSize: 13, color: '#555', marginBottom: 6, fontWeight: 500 }}>
            功能描述 <span style={{ fontSize: 12, color: '#bbb', fontWeight: 400 }}>展示在员工列表中（选填）</span>
          </div>
          <Input.TextArea
            value={data.description}
            onChange={e => update({ description: e.target.value })}
            rows={3}
            placeholder="简要描述该员工的核心能力和适用场景..."
            style={{ borderRadius: 8, resize: 'none' }}
            maxLength={200}
            showCount
          />
        </div>
      </div>
    );
  };

  // ── 步骤 1：AI 能力 ──────────────────────────────────

  const Step1 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* 模型选择 */}
      <div>
        <SectionTitle title="AI 模型" desc="选择驱动该员工的大语言模型" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {MODEL_OPTIONS.map(m => (
            <div
              key={m.id}
              onClick={() => update({ model: m.id })}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                border: data.model === m.id ? `1.5px solid ${m.color}` : '1px solid #e8e8e8',
                background: data.model === m.id ? `${m.color}08` : '#fafafa',
              }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>{m.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: data.model === m.id ? m.color : '#1a1a1a' }}>{m.name}</span>
                  <Tag style={{ fontSize: 10, margin: 0, color: m.color, borderColor: `${m.color}40`, background: `${m.color}10`, borderRadius: 4 }}>{m.tag}</Tag>
                </div>
                <div style={{ fontSize: 11, color: '#999' }}>{m.desc}</div>
              </div>
              {data.model === m.id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.color, flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      </div>

      {/* System Prompt */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
            角色提示词 <span style={{ color: '#ff4d4f', fontSize: 11 }}>*</span>
          </span>
          <Button type="link" size="small" style={{ padding: 0, fontSize: 12, color: '#6366F1' }}
            onClick={() => update({ prompt: DEFAULT_PROMPT })}>
            重置模板
          </Button>
        </div>
        <Input.TextArea
          value={data.prompt}
          onChange={e => update({ prompt: e.target.value })}
          rows={7}
          style={{ borderRadius: 8, fontFamily: 'monospace', fontSize: 12, resize: 'none' }}
        />
        <div style={{ marginTop: 4, fontSize: 11, color: '#bbb' }}>
          System Prompt 定义员工的角色、职责与回复规范，是影响效果最重要的配置
        </div>
      </div>

      {/* 知识库 */}
      <div>
        <SectionTitle title="绑定知识库" desc="员工将优先检索知识库内容后再回答" />
        <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, overflow: 'hidden' }}>
          {KNOWLEDGE_BASES.map((kb, idx) => (
            <div key={kb.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
              borderBottom: idx < KNOWLEDGE_BASES.length - 1 ? '1px solid #f5f5f5' : 'none',
              background: data.kbEnabled[kb.id] ? '#f9f8ff' : '#fff',
            }}>
              <span style={{ fontSize: 16 }}>{kb.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: data.kbEnabled[kb.id] ? '#6366F1' : '#333' }}>{kb.name}</div>
                <div style={{ fontSize: 11, color: '#bbb' }}>{kb.desc}</div>
              </div>
              <Switch size="small" checked={!!data.kbEnabled[kb.id]}
                onChange={v => update({ kbEnabled: { ...data.kbEnabled, [kb.id]: v } })}
                style={{ background: data.kbEnabled[kb.id] ? '#6366F1' : undefined }} />
            </div>
          ))}
        </div>
      </div>

      {/* 技能与工具 */}
      <div>
        <SectionTitle title="平台技能" desc="选择该员工可调用的内置能力" />
        <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, overflow: 'hidden' }}>
          {SKILL_LIST.slice(0, 5).map((sk, idx) => (
            <div key={sk.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
              borderBottom: idx < 4 ? '1px solid #f5f5f5' : 'none',
              background: data.skillEnabled[sk.id] ? '#fff' : '#fafafa',
            }}>
              <span style={{ fontSize: 16 }}>{sk.icon}</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: data.skillEnabled[sk.id] ? '#1a1a1a' : '#aaa', marginRight: 6 }}>{sk.name}</span>
                <Tag style={{ margin: 0, fontSize: 10, borderRadius: 4, color: sk.type === 'Skill' ? '#6366F1' : '#10B981', borderColor: sk.type === 'Skill' ? '#c7d2fe' : '#a7f3d0', background: sk.type === 'Skill' ? '#eef2ff' : '#f0fdf4' }}>{sk.type}</Tag>
              </div>
              <Switch size="small" checked={!!data.skillEnabled[sk.id]}
                onChange={v => update({ skillEnabled: { ...data.skillEnabled, [sk.id]: v } })}
                style={{ background: data.skillEnabled[sk.id] ? '#6366F1' : undefined }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── 步骤 2：部署配置 ──────────────────────────────────

  const Step2 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* 回复风格 */}
      <div>
        <SectionTitle title="回复风格" desc="影响员工与用户沟通时的语气表达" />
        <div style={{ display: 'flex', gap: 8 }}>
          {RESPONSE_STYLES.map(rs => (
            <div
              key={rs.id}
              onClick={() => update({ responseStyle: rs.id })}
              style={{
                flex: 1, padding: '12px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                border: data.responseStyle === rs.id ? '1.5px solid #6366F1' : '1px solid #e8e8e8',
                background: data.responseStyle === rs.id ? '#f5f4ff' : '#fafafa',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 6 }}>{rs.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: data.responseStyle === rs.id ? '#6366F1' : '#1a1a1a', marginBottom: 2 }}>{rs.label}</div>
              <div style={{ fontSize: 11, color: '#999', lineHeight: 1.4 }}>{rs.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 访问权限 */}
      <div>
        <SectionTitle title="访问权限" desc="控制哪些人可以看到和使用该数字员工" />
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { value: 'private', icon: '🔒', label: '仅创建者', desc: '私有，仅自己可用' },
            { value: 'dept',    icon: '👥', label: '部门内',   desc: '部门成员可访问' },
            { value: 'company', icon: '🌐', label: '全公司',   desc: '全员可见可用' },
          ].map(opt => (
            <div
              key={opt.value}
              onClick={() => update({ accessScope: opt.value })}
              style={{
                flex: 1, padding: '12px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                border: data.accessScope === opt.value ? '1.5px solid #6366F1' : '1px solid #e8e8e8',
                background: data.accessScope === opt.value ? '#f5f4ff' : '#fafafa',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 6 }}>{opt.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: data.accessScope === opt.value ? '#6366F1' : '#1a1a1a', marginBottom: 2 }}>{opt.label}</div>
              <div style={{ fontSize: 11, color: '#999' }}>{opt.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 接入渠道 */}
      <div>
        <SectionTitle title="接入渠道" desc="选择该员工对外提供服务的方式，可多选" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {CHANNELS.map(ch => {
            const selected = data.channels.includes(ch.id);
            return (
              <div
                key={ch.id}
                onClick={() => update({
                  channels: selected ? data.channels.filter(c => c !== ch.id) : [...data.channels, ch.id],
                })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                  borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                  border: selected ? '1.5px solid #6366F1' : '1px solid #e8e8e8',
                  background: selected ? '#f5f4ff' : '#fafafa',
                }}
              >
                <span style={{ fontSize: 18 }}>{ch.icon}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: selected ? '#6366F1' : '#333', marginRight: 8 }}>{ch.label}</span>
                  <span style={{ fontSize: 12, color: '#999' }}>{ch.desc}</span>
                </div>
                <div style={{
                  width: 16, height: 16, borderRadius: 3, flexShrink: 0,
                  border: selected ? 'none' : '1.5px solid #d1d5db',
                  background: selected ? '#6366F1' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {selected && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ── 步骤 3：测试发布 ──────────────────────────────────

  const Step3 = () => {
    const enabledKbs = KNOWLEDGE_BASES.filter(kb => data.kbEnabled[kb.id]);
    const enabledSkills = SKILL_LIST.filter(sk => data.skillEnabled[sk.id]);
    const selectedChannels = CHANNELS.filter(ch => data.channels.includes(ch.id));
    const selectedModel = MODEL_OPTIONS.find(m => m.id === data.model);
    const avatarBg = data.name.trim() ? getAvatarColor(data.name.trim()) : '#e2e8f0';
    const avatarChar = data.name.trim() ? data.name.trim().charAt(0) : '?';

    const configItems = [
      { label: '员工身份', ok: !!data.name && !!data.dept && !!data.role, text: data.name ? `${data.name} · ${data.dept} · ${data.role}` : '未配置' },
      { label: 'AI 模型', ok: !!data.model, text: selectedModel?.name || '未选择' },
      { label: '提示词', ok: data.prompt.length > 30, text: data.prompt.length > 30 ? `已配置（${data.prompt.length} 字符）` : '内容过少，建议完善' },
      { label: '知识库', ok: true, text: enabledKbs.length > 0 ? enabledKbs.map(kb => kb.name).join('、') : '未绑定' },
      { label: '技能', ok: true, text: enabledSkills.length > 0 ? `已启用 ${enabledSkills.length} 个` : '未启用' },
      { label: '接入渠道', ok: selectedChannels.length > 0, text: selectedChannels.length > 0 ? selectedChannels.map(c => c.label).join('、') : '未选择接入渠道' },
    ];
    const allOk = configItems.every(item => item.ok);

    return (
      <div style={{ display: 'flex', gap: 16 }}>
        {/* 左：对话测试 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid #e0deff', borderRadius: 10, overflow: 'hidden' }}>
          {/* 聊天头部 */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #e0deff', display: 'flex', alignItems: 'center', gap: 8, background: '#fff' }}>
            <div style={{
              width: 26, height: 26, borderRadius: 7, flexShrink: 0,
              background: avatarBg, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700,
            }}>
              {avatarChar}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#6366F1' }}>{data.name || '数字员工'}</span>
            <Tag color="processing" style={{ marginLeft: 'auto', fontSize: 10 }}>测试模式</Tag>
          </div>

          {/* 消息列表 */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', minHeight: 200, maxHeight: 280, background: '#f8f7ff', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* 欢迎消息 */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                {avatarChar}
              </div>
              <div style={{ background: '#fff', borderRadius: '0 10px 10px 10px', padding: '8px 12px', fontSize: 12, color: '#333', maxWidth: '80%', border: '1px solid #e8e8e8', lineHeight: 1.6 }}>
                你好！我是{data.name || '数字员工'}，{data.role || '你的智能助理'}，请描述您的需求，我将为您提供支持。
              </div>
            </div>
            {/* 历史消息 */}
            {testMessages.map((msg, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                {msg.role === 'ai' && (
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                    {avatarChar}
                  </div>
                )}
                <div style={{
                  background: msg.role === 'user' ? '#6366F1' : '#fff',
                  borderRadius: msg.role === 'user' ? '10px 0 10px 10px' : '0 10px 10px 10px',
                  padding: '8px 12px', fontSize: 12,
                  color: msg.role === 'user' ? '#fff' : '#333',
                  maxWidth: '80%', border: msg.role === 'user' ? 'none' : '1px solid #e8e8e8',
                  lineHeight: 1.6, whiteSpace: 'pre-wrap',
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {testLoading && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                  {avatarChar}
                </div>
                <div style={{ background: '#fff', borderRadius: '0 10px 10px 10px', padding: '8px 14px', border: '1px solid #e8e8e8', display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366F1', opacity: 0.6, animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 输入框 */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid #e0deff', background: '#fff', display: 'flex', gap: 8 }}>
            <Input
              value={testInput}
              onChange={e => setTestInput(e.target.value)}
              placeholder={`向 ${data.name || '数字员工'} 发送测试消息...`}
              style={{ borderRadius: 8, flex: 1, fontSize: 12 }}
              onPressEnter={handleSendTest}
            />
            <Button type="primary" icon={<SendOutlined />}
              disabled={!testInput.trim() || testLoading}
              style={{ background: '#6366F1', borderColor: '#6366F1', borderRadius: 8 }}
              onClick={handleSendTest}
            />
          </div>
        </div>

        {/* 右：配置核查 */}
        <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 2 }}>配置核查</div>
          <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, overflow: 'hidden' }}>
            {configItems.map((item, idx) => (
              <div key={item.label} style={{
                padding: '8px 12px',
                borderBottom: idx < configItems.length - 1 ? '1px solid #f5f5f5' : 'none',
                background: item.ok ? '#fff' : '#fffbeb',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 13, color: item.ok ? '#10b981' : '#f59e0b' }}>{item.ok ? '✅' : '⚠️'}</span>
                  <span style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>{item.label}</span>
                </div>
                <div style={{ fontSize: 11, color: item.ok ? '#555' : '#f59e0b', lineHeight: 1.4, paddingLeft: 20 }}>{item.text}</div>
              </div>
            ))}
          </div>
          {allOk ? (
            <div style={{ padding: '8px 12px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8, fontSize: 11, color: '#52c41a', display: 'flex', gap: 5 }}>
              <CheckCircleOutlined /><span>配置完整，可以发布</span>
            </div>
          ) : (
            <div style={{ padding: '8px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: 11, color: '#d97706' }}>
              ⚠️ 部分配置待完善，可先保存草稿
            </div>
          )}
        </div>
      </div>
    );
  };

  const STEP_CONTENT = [<Step0 key={0} />, <Step1 key={1} />, <Step2 key={2} />, <Step3 key={3} />];

  return (
    <div>
      <Steps
        current={step}
        size="small"
        style={{ marginBottom: 24 }}
        items={STEPS.map(s => ({ title: s.title, description: s.description }))}
      />

      <div style={{ minHeight: 340, maxHeight: 520, overflowY: 'auto', paddingRight: 4 }}>
        {STEP_CONTENT[step]}
      </div>

      {/* 底部操作 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, paddingTop: 14, borderTop: '1px solid #f0f0f0' }}>
        <Button onClick={step === 0 ? onClose : () => setStep(s => s - 1)}>
          {step === 0 ? '取消' : '上一步'}
        </Button>
        <div style={{ display: 'flex', gap: 10 }}>
          {step === STEPS.length - 1 ? (
            <>
              <Button
                icon={<CloudUploadOutlined />}
                onClick={() => { onClose(); message.success('草稿已保存，可在员工列表中继续编辑'); }}
              >
                保存草稿
              </Button>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                style={{ background: '#6366F1', borderColor: '#6366F1' }}
                onClick={() => { onClose(); message.success(`数字员工「${data.name}」已发布上线`); }}
              >
                发布上线
              </Button>
            </>
          ) : (
            <>
              {step > 0 && (
                <Button onClick={() => { onClose(); message.success('草稿已保存'); }}>
                  保存草稿
                </Button>
              )}
              <Button
                type="primary"
                disabled={!canNext()}
                style={{ background: '#6366F1', borderColor: '#6366F1' }}
                onClick={() => setStep(s => s + 1)}
              >
                下一步
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── 版本管理 Drawer ───────────────────────────────────────

const VersionDrawer: React.FC<{ open: boolean; onClose: () => void; employeeName: string }> = ({ open, onClose, employeeName }) => (
  <Drawer title={`版本管理 · ${employeeName}`} open={open} onClose={onClose} width={480}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {MOCK_VERSIONS.map(ver => (
        <div key={ver.versionId} style={{ border: `1px solid ${ver.status === 'active' ? '#6366F1' : '#e8e8e8'}`, borderRadius: 10, padding: '14px 16px', background: ver.status === 'active' ? '#f5f4ff' : '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: ver.status === 'active' ? '#6366F1' : '#1a1a1a' }}>{ver.version}</span>
            {ver.status === 'active' && <Tag color="purple" style={{ fontSize: 10, margin: 0 }}>当前版本</Tag>}
          </div>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>{ver.changelog}</div>
          <div style={{ fontSize: 11, color: '#bbb' }}>{ver.publishedAt} · {ver.publishedBy}</div>
          {ver.status === 'history' && (
            <Button size="small" icon={<RollbackOutlined />}
              style={{ marginTop: 10, borderRadius: 6, fontSize: 12, color: '#6366F1', borderColor: '#6366F1' }}
              onClick={() => message.success(`已回滚到 ${ver.version}`)}>
              回滚到此版本
            </Button>
          )}
        </div>
      ))}
    </div>
  </Drawer>
);

// ─── 主页面 ───────────────────────────────────────────────

const DigitalEmployee: React.FC<{ onBackToAdmin?: () => void }> = ({ onBackToAdmin }) => {
  const [employees, setEmployees] = useState<DigitalEmployeeItem[]>(MOCK_EMPLOYEES);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<DigitalEmployeeItem | null>(null);
  const [versionDrawerOpen, setVersionDrawerOpen] = useState(false);
  const [apiDrawerOpen, setApiDrawerOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<DigitalEmployeeItem | null>(null);

  const filteredEmployees = employees.filter(e => {
    const matchSearch = !searchText || e.name.includes(searchText) || e.description.includes(searchText);
    const matchStatus = !statusFilter || e.status === statusFilter;
    const matchDept = !deptFilter || e.dept === deptFilter;
    return matchSearch && matchStatus && matchDept;
  });

  const handleStatusChange = (id: string, newStatus: EmployeeStatus) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e));
    const labels: Record<string, string> = { published: '已发布上线', paused: '已暂停', archived: '已归档' };
    message.success(labels[newStatus] || '状态已更新');
  };

  const columns: ColumnsType<DigitalEmployeeItem> = [
    {
      title: '数字员工',
      key: 'name',
      width: 280,
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: getAvatarColor(r.name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, fontWeight: 700, flexShrink: 0 }}>{r.name.charAt(0)}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{r.name}</div>
            <div style={{ fontSize: 11, color: '#aaa' }}>{r.dept} · {r.version}</div>
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_, r) => {
        const cfg = STATUS_CONFIG[r.status];
        return <Badge status={cfg.badgeStatus} text={<span style={{ fontSize: 12 }}>{cfg.label}</span>} />;
      },
    },
    {
      title: '访问权限',
      key: 'scope',
      width: 110,
      render: (_, r) => {
        const cfg = SCOPE_CONFIG[r.scope];
        return <span style={{ fontSize: 12, color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}>{cfg.icon} {cfg.label}</span>;
      },
    },
    {
      title: '功能描述',
      key: 'description',
      render: (_, r) => (
        <span style={{ fontSize: 12, color: '#888', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
          {r.description}
        </span>
      ),
    },
    {
      title: '更新时间',
      key: 'updateTime',
      width: 110,
      render: (_, r) => <span style={{ fontSize: 12, color: '#999' }}>{r.updateTime}</span>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 240,
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          <Button size="small" type="text" icon={<EditOutlined />} style={{ color: '#6366F1', fontSize: 12 }}
            onClick={() => { setEditEmployee(r); setEditModalOpen(true); }}>编辑</Button>
          <Button size="small" type="text" icon={<BranchesOutlined />} style={{ color: '#6366F1', fontSize: 12 }}
            onClick={() => { setSelectedEmployee(r); setVersionDrawerOpen(true); }}>版本</Button>
          <Button size="small" type="text" icon={<ApiOutlined />} style={{ color: '#6366F1', fontSize: 12 }}
            onClick={() => { setSelectedEmployee(r); setApiDrawerOpen(true); }}>接入</Button>
          <Divider type="vertical" style={{ margin: '0 2px' }} />
          {(r.status === 'draft' || r.status === 'testing') && (
            <Button size="small" type="text" icon={<CloudUploadOutlined />} style={{ color: '#10b981', fontSize: 12 }}
              onClick={() => handleStatusChange(r.id, 'published')}>发布</Button>
          )}
          {r.status === 'published' && (
            <Button size="small" type="text" icon={<PauseCircleOutlined />} style={{ color: '#f59e0b', fontSize: 12 }}
              onClick={() => handleStatusChange(r.id, 'paused')}>暂停</Button>
          )}
          {r.status === 'paused' && (
            <Button size="small" type="text" icon={<PlayCircleOutlined />} style={{ color: '#10b981', fontSize: 12 }}
              onClick={() => handleStatusChange(r.id, 'published')}>恢复</Button>
          )}
          <Button size="small" type="text" icon={<StopOutlined />} style={{ color: '#ff4d4f', fontSize: 12 }}
            onClick={() => Modal.confirm({
              title: `确认归档「${r.name}」？`, content: '归档后不可再调用，可从归档列表恢复',
              okText: '归档', okButtonProps: { danger: true }, cancelText: '取消',
              onOk: () => handleStatusChange(r.id, 'archived'),
            })}>归档</Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f7f8fc', display: 'flex', flexDirection: 'column' }}>

      {/* ── 顶部导航 ── */}
      <div style={{
        height: 56, background: '#fff', borderBottom: '1px solid #e8e8e8',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={onBackToAdmin}
            style={{ color: '#666', fontSize: 13, padding: '0 8px' }}
          >
            返回后台
          </Button>
          <div style={{ width: 1, height: 16, background: '#e8e8e8' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 7,
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
            }}>🏢</div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>数字员工</span>
            <span style={{ fontSize: 12, color: '#aaa', fontWeight: 400 }}>企业级职能化 AI 资产，全生命周期可管可控</span>
          </div>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalOpen(true)}
          style={{ background: '#6366F1', borderColor: '#6366F1', borderRadius: 8, fontWeight: 600 }}
        >
          创建数字员工
        </Button>
      </div>

      {/* ── 内容区 ── */}
      <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── 员工列表 ── */}
      <div style={{ border: '1px solid #e8e8e8', borderRadius: 12, background: '#fff', overflow: 'hidden' }}>
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <Input
              prefix={<SearchOutlined style={{ color: '#bbb' }} />}
              placeholder="搜索员工名称 / 描述..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 260, borderRadius: 8 }}
              allowClear
            />
            <Select
              placeholder="状态筛选"
              allowClear
              style={{ width: 120 }}
              onChange={v => setStatusFilter(v || '')}
              options={Object.entries(STATUS_CONFIG).map(([k, v]) => ({ label: v.label, value: k }))}
            />
            <Select
              placeholder="部门筛选"
              allowClear
              style={{ width: 130 }}
              onChange={v => setDeptFilter(v || '')}
              options={DEPARTMENTS.map(d => ({ label: d, value: d }))}
            />
            <span style={{ marginLeft: 'auto', fontSize: 13, color: '#999' }}>
              共 <strong style={{ color: '#333' }}>{filteredEmployees.length}</strong> 个数字员工
            </span>
          </div>

          <Table
            dataSource={filteredEmployees}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10, size: 'small' }}
            size="middle"
          />
        </div>
      </div>

      </div>

      {/* ═══ 创建员工 Modal ═══ */}
      <Modal
        title={<span style={{ fontSize: 15, fontWeight: 700 }}>创建数字员工</span>}
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        footer={null}
        width={720}
        destroyOnClose
        styles={{ body: { maxHeight: '80vh', overflowY: 'auto' } }}
      >
        <CreateWizard onClose={() => setCreateModalOpen(false)} />
      </Modal>

      {/* ═══ 编辑员工 Modal ═══ */}
      <Modal
        title={<span style={{ fontSize: 15, fontWeight: 700 }}>编辑数字员工</span>}
        open={editModalOpen}
        onCancel={() => { setEditModalOpen(false); setEditEmployee(null); }}
        footer={null}
        width={720}
        destroyOnClose
        styles={{ body: { maxHeight: '80vh', overflowY: 'auto' } }}
      >
        <CreateWizard
          onClose={() => { setEditModalOpen(false); setEditEmployee(null); }}
          initialData={{
            name: editEmployee?.name ?? '',
            dept: editEmployee?.dept ?? '',
            description: editEmployee?.description ?? '',
          }}
          isEdit
        />
      </Modal>

      {/* ═══ 版本管理 Drawer ═══ */}
      {selectedEmployee && (
        <VersionDrawer
          open={versionDrawerOpen}
          onClose={() => setVersionDrawerOpen(false)}
          employeeName={selectedEmployee.name}
        />
      )}

      {/* ═══ API 接入 Drawer ═══ */}
      <Drawer
        title={`API 接入 · ${selectedEmployee?.name || ''}`}
        open={apiDrawerOpen}
        onClose={() => setApiDrawerOpen(false)}
        width={480}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { mode: '前台嵌入',    icon: '🖥️', desc: '通过悬浮窗或内嵌模式部署到万卷前台', code: `<script src="https://cdn.wanjuan.ai/embed.js"\n  data-agent="${selectedEmployee?.id}"></script>` },
            { mode: '工作流绑定', icon: '⚡',  desc: '在万卷工作流中以节点形式调用',       code: `agent_id: ${selectedEmployee?.id}\ntype: digital_employee\ncall_mode: sync` },
            { mode: 'OpenClaw API', icon: '🔌', desc: '通过 REST API 直接调用，适合系统集成', code: `POST /v1/employees/${selectedEmployee?.id}/chat\nAuthorization: Bearer {YOUR_API_KEY}` },
            { mode: '批量任务',   icon: '📦', desc: '提交批量任务，异步处理大规模请求',    code: `POST /v1/employees/${selectedEmployee?.id}/batch\nContent-Type: application/json` },
          ].map(item => (
            <div key={item.mode} style={{ border: '1px solid #e8e8e8', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', background: '#fafafa', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{item.mode}</div>
                  <div style={{ fontSize: 11, color: '#999' }}>{item.desc}</div>
                </div>
              </div>
              <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <code style={{ flex: 1, fontSize: 11, color: '#555', fontFamily: 'monospace', lineHeight: 1.8, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {item.code}
                </code>
                <Button size="small" type="text" icon={<CopyOutlined />} style={{ color: '#6366F1', flexShrink: 0 }}
                  onClick={() => message.success('已复制')} />
              </div>
            </div>
          ))}
        </div>
      </Drawer>

    </div>
  );
};

export default DigitalEmployee;
