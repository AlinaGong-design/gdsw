import React, { useState, useEffect } from 'react';
import { employeeStore, EmployeeRecord } from '../store/employeeStore';
import { approvalStore } from '../store/approvalStore';
import { Button, Input, Tag, Modal, Select, Badge, Drawer, Table, Divider, message, Steps, Switch, Checkbox, Tooltip, Timeline, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, EditOutlined, SearchOutlined,
  PlayCircleOutlined, PauseCircleOutlined, RollbackOutlined,
  ApiOutlined, CheckCircleOutlined, StopOutlined,
  CloudUploadOutlined, TeamOutlined, LockOutlined, GlobalOutlined, UserOutlined,
  CopyOutlined, SendOutlined, BranchesOutlined,
  ThunderboltOutlined, AppstoreOutlined, UnorderedListOutlined,
  MobileOutlined, LinkOutlined, DesktopOutlined,
  HistoryOutlined, FileTextOutlined, TagOutlined, SaveOutlined, EyeOutlined,
  RadarChartOutlined,
} from '@ant-design/icons';
import DigitalEmployeeProfile from './DigitalEmployeeProfile';

// ─── 类型 ─────────────────────────────────────────────────
type EmployeeStatus = 'draft' | 'stationed' | 'approving' | 'published' | 'paused' | 'archived';
type DeployScope    = 'private' | 'dept' | 'company';

type VisibilityScope = 'private' | 'team' | 'company';

interface EmployeeVersion {
  versionId: string; version: string; changelog: string;
  publishedAt: string; publishedBy: string;
}
interface EmployeeHistoryEvent {
  id: string; kind: 'save' | 'publish';
  time: string; user: string; desc: string;
  version?: EmployeeVersion;
}

interface DigitalEmployeeItem {
  id: string; name: string; dept: string; domain: string; description: string;
  status: EmployeeStatus; version: string; scope: DeployScope;
  updateTime: string; callCount: number; score: number; heat: number; type: '通用款' | '定制款' | '升级款';
}

// ─── Mock 数据 ────────────────────────────────────────────

// ─── 360度画像 mini 数据 ────────────────────────────────────
const EMP_360_MINI: Record<string, { score: number; calls: number }> = {
  'de-001': { score: 4.8, calls: 328 },
  'de-002': { score: 4.6, calls: 215 },
  'de-003': { score: 4.9, calls: 89 },
  'de-004': { score: 4.5, calls: 142 },
  'de-006': { score: 4.7, calls: 512 },
  'de-007': { score: 4.3, calls: 173 },
  'de-008': { score: 4.7, calls: 2156 },
};
const MOCK_EMPLOYEES: DigitalEmployeeItem[] = [
  { id: 'de-001', name: '法务合规助手', dept: '法务部',   domain: '法务域', description: '合同审查、合规检查、法律风险评估，支持多种合同模板自动识别与条款提取', status: 'published', version: 'v2.1.0',      scope: 'company', updateTime: '2026-03-10', callCount: 4821, score: 4.8, heat: 95, type: '通用款' },
  { id: 'de-002', name: 'HR 招聘助手',  dept: '人力资源', domain: '人力域', description: '简历智能筛选、面试时间协调、薪酬 benchmark 参考，接入飞书日历',           status: 'published', version: 'v1.3.2',      scope: 'dept',    updateTime: '2026-03-05', callCount: 3256, score: 4.6, heat: 78, type: '定制款' },
  { id: 'de-003', name: '财务报表助手', dept: '财务部',   domain: '财务域', description: '定时拉取业务数据，AI 生成分析报告，异常数据预警推送',                     status: 'stationed',   version: 'v3.0.0-beta', scope: 'dept',    updateTime: '2026-03-14', callCount: 2890, score: 4.9, heat: 88, type: '通用款' },
  { id: 'de-004', name: '代码审查助手', dept: '技术部',   domain: '技术域', description: 'PR 触发自动代码审查，安全漏洞扫描，输出审查建议并评论到 GitLab/GitHub',   status: 'paused',    version: 'v1.1.0',      scope: 'dept',    updateTime: '2026-02-28', callCount: 1654, score: 4.5, heat: 62, type: '升级款' },
  { id: 'de-005', name: '智能客服分发', dept: '客户成功', domain: '客服域', description: '意图识别、多轮路由分发、自动记录工单，支持人工接管',                       status: 'draft',     version: 'v0.1.0',      scope: 'private', updateTime: '2026-03-15', callCount: 8923, score: 4.7, heat: 91, type: '通用款' },
  { id: 'de-006', name: '运营数据助手', dept: '运营部',   domain: '运营域', description: '自动汇总运营核心指标，生成日/周/月报告，支持钉钉/飞书推送',               status: 'published', version: 'v1.2.0',      scope: 'company', updateTime: '2026-03-12', callCount: 1243, score: 4.3, heat: 55, type: '定制款' },
];

const MOCK_EMPLOYEE_HISTORY: EmployeeHistoryEvent[] = [
  { id: 'h1', kind: 'publish', time: '2026-02-15 16:00', user: '李四', desc: 'v2.0.0', version: { versionId: 'v2.0.0', version: 'v2.0.0', changelog: '重构 Prompt 结构，支持多类型合同模板', publishedAt: '2026-02-15 16:00', publishedBy: '李四' } },
  { id: 'h2', kind: 'save',    time: '2026-02-20 10:30', user: '张三', desc: '优化风险识别提示词' },
  { id: 'h3', kind: 'publish', time: '2026-02-28 09:15', user: '张三', desc: 'v2.0.1', version: { versionId: 'v2.0.1', version: 'v2.0.1', changelog: '修复飞书文档权限异常问题', publishedAt: '2026-02-28 09:15', publishedBy: '张三' } },
  { id: 'h4', kind: 'save',    time: '2026-03-05 14:00', user: '张三', desc: '新增风险等级标注逻辑' },
  { id: 'h5', kind: 'publish', time: '2026-03-10 14:30', user: '张三', desc: 'v2.1.0', version: { versionId: 'v2.1.0', version: 'v2.1.0', changelog: '优化合同识别准确率，新增风险等级标注', publishedAt: '2026-03-10 14:30', publishedBy: '张三' } },
];

const SCOPE_LABELS: Record<VisibilityScope, { label: string }> = {
  private: { label: '仅自己' },
  team:    { label: '团队内' },
  company: { label: '全公司' },
};

function nextVersion(ver: string, type: 'patch' | 'minor' | 'major' = 'patch'): string {
  const match = ver.match(/^v(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return 'v1.0.0';
  let [, major, minor, patch] = match.map(Number);
  if (type === 'patch') patch++;
  else if (type === 'minor') { minor++; patch = 0; }
  else { major++; minor = 0; patch = 0; }
  return `v${major}.${minor}.${patch}`;
}

const STATUS_CONFIG: Record<EmployeeStatus, { label: string; badgeStatus: 'default' | 'processing' | 'success' | 'warning' | 'error' }> = {
  draft:     { label: '草稿',   badgeStatus: 'default'    },
  stationed: { label: '待上岗', badgeStatus: 'warning'    },
  approving: { label: '审批中', badgeStatus: 'processing' },
  published: { label: '运行中', badgeStatus: 'success'    },
  paused:    { label: '已暂停', badgeStatus: 'warning'    },
  archived:  { label: '已归档', badgeStatus: 'error'      },
};

const SCOPE_CONFIG: Record<DeployScope, { label: string; icon: React.ReactNode }> = {
  private: { label: '仅创建者', icon: <LockOutlined />  },
  dept:    { label: '部门内',   icon: <TeamOutlined />  },
  company: { label: '全公司',   icon: <GlobalOutlined /> },
};

const TYPE_CONFIG: Record<string, { color: string; bg: string }> = {
  '通用款': { color: '#6366F1', bg: '#eef2ff' },
  '定制款': { color: '#10B981', bg: '#f0fdf4' },
  '升级款': { color: '#F59E0B', bg: '#fefce8' },
};

const DOMAIN_LIST = ['全部', '法务域', '人力域', '财务域', '技术域', '客服域', '运营域'];
const DOMAIN_COLORS: Record<string, string> = {
  '全部': '#6366F1', '法务域': '#6366F1', '人力域': '#10B981',
  '财务域': '#F59E0B', '技术域': '#3B82F6', '客服域': '#EC4899', '运营域': '#8B5CF6',
};

const ORG_TREE = [
  { id: 'root',    name: '集团总公司',  path: '集团总公司' },
  { id: 'lead',    name: '集团领导',    path: '集团总公司 > 集团领导' },
  { id: 'digital', name: '数字智能部',  path: '集团总公司 > 数字智能部' },
  { id: 'infra',   name: '基础设施部',  path: '集团总公司 > 数字智能部 > 基础设施部' },
  { id: 'sys',     name: '系统建设部',  path: '集团总公司 > 数字智能部 > 系统建设部' },
  { id: 'data',    name: '数据治理部',  path: '集团总公司 > 数字智能部 > 数据治理部' },
  { id: 'legal',   name: '法务部',      path: '集团总公司 > 法务部' },
  { id: 'hr',      name: '人力资源部',  path: '集团总公司 > 人力资源部' },
  { id: 'finance', name: '财务部',      path: '集团总公司 > 财务部' },
  { id: 'tech',    name: '技术部',      path: '集团总公司 > 技术部' },
  { id: 'ops',     name: '运营部',      path: '集团总公司 > 运营部' },
  { id: 'pipe',    name: '管道运营部',  path: '集团总公司 > 管道运营部' },
];

const PERSON_LIST = [
  { id: 'p-001', name: '张三', dept: '法务部',     deptId: 'legal',   path: '集团总公司 > 法务部 > 张三' },
  { id: 'p-002', name: '李四', dept: '法务部',     deptId: 'legal',   path: '集团总公司 > 法务部 > 李四' },
  { id: 'p-003', name: '王五', dept: '人力资源部', deptId: 'hr',      path: '集团总公司 > 人力资源部 > 王五' },
  { id: 'p-004', name: '赵六', dept: '技术部',     deptId: 'tech',    path: '集团总公司 > 技术部 > 赵六' },
  { id: 'p-005', name: '孙七', dept: '运营部',     deptId: 'ops',     path: '集团总公司 > 运营部 > 孙七' },
  { id: 'p-006', name: '陈主任', dept: '数字智能部', deptId: 'digital', path: '集团总公司 > 数字智能部 > 陈主任' },
  { id: 'p-007', name: '王晓明', dept: '基础设施部', deptId: 'infra',   path: '集团总公司 > 数字智能部 > 基础设施部 > 王晓明' },
  { id: 'p-008', name: '刘总', dept: '集团领导',   deptId: 'lead',    path: '集团总公司 > 集团领导 > 刘总' },
];

// ─── 工具函数 ──────────────────────────────────────────────
const AVATAR_COLORS = [
  'linear-gradient(135deg, #6366F1, #8B5CF6)', 'linear-gradient(135deg, #3B82F6, #06B6D4)',
  'linear-gradient(135deg, #10B981, #34d399)', 'linear-gradient(135deg, #F59E0B, #FBBF24)',
  'linear-gradient(135deg, #EF4444, #F87171)', 'linear-gradient(135deg, #8B5CF6, #EC4899)',
];
function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// 根据员工姓名生成渐变头像色（与前台对话头像保持一致，使用相同的 AVATAR_COLORS + 名称哈希）
function getContentGradient(name: string, _dept = '', _domain = '', _desc = ''): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── 向导配置 ─────────────────────────────────────────────
const DEPARTMENTS = ['法务部', '人力资源', '财务部', '技术部', '产品部', '市场部', '客户成功', '运营部'];
const MODEL_OPTIONS = [
  { id: 'chat-model', name: '通用对话',   tag: '均衡推荐', desc: '适合日常问答、任务处理，性价比最优',            icon: '💬', color: '#6366F1' },
  { id: 'gpt-4o',     name: '高性能推理', tag: '复杂场景', desc: '强逻辑推理，适合法务、财务等专业分析',          icon: '🧠', color: '#8B5CF6' },
  { id: 'qwen-max',   name: '长文本处理', tag: '大文档',   desc: '超长上下文，适合合同全文审查、报告生成',        icon: '📄', color: '#10B981' },
  { id: 'glm-4',      name: '国产安全',   tag: '数据合规', desc: '国产大模型私有化部署，满足数据安全要求',        icon: '🛡️', color: '#F59E0B' },
];
const KNOWLEDGE_BASES = [
  { id: 'kb1', name: '法律法规库',   desc: '国家法律法规、行业规范文件', icon: '⚖️' },
  { id: 'kb2', name: '公司制度手册', desc: '内部规章制度、标准流程文档', icon: '📋' },
  { id: 'kb3', name: '产品知识库',   desc: '产品说明、FAQ、使用手册',   icon: '📦' },
  { id: 'kb4', name: '行业研报库',   desc: '行业分析报告、市场数据',    icon: '📊' },
  { id: 'kb5', name: '技术文档库',   desc: 'API 文档、开发规范、架构设计', icon: '💻' },
];
// ─── Vibe Coding 技能 ─────────────────────────────────────
const VIBE_CODING_SKILLS = [
  { id: 'vc1', name: 'Claude Code',       icon: '⚡', desc: 'AI 原生编程助手，多语言代码生成、调试与全链路重构', tag: 'Code Agent',  tagColor: '#7C3AED', tagBg: '#F5F3FF', tagBorder: '#DDD6FE' },
  { id: 'vc2', name: 'Superpowers',       icon: '🦸', desc: '多模型 AI 超能力增强包，提升推理、规划与代码质量',  tag: 'Enhancement', tagColor: '#2563EB', tagBg: '#EFF6FF', tagBorder: '#BFDBFE' },
  { id: 'vc3', name: 'Everything Claude', icon: '🔮', desc: '全功能 Claude 套件，覆盖代码库分析与全栈研发场景',  tag: 'Full Suite',  tagColor: '#0891B2', tagBg: '#ECFEFF', tagBorder: '#A5F3FC' },
  { id: 'vc4', name: 'Browser Use',       icon: '🌐', desc: 'AI 自主操控浏览器，网页交互、表单填写与自动化测试', tag: 'Automation',  tagColor: '#059669', tagBg: '#ECFDF5', tagBorder: '#A7F3D0' },
  { id: 'vc5', name: 'Computer Use',      icon: '🖥️', desc: 'AI 直接操作桌面应用，跨软件全流程自动化工作',       tag: 'Automation',  tagColor: '#059669', tagBg: '#ECFDF5', tagBorder: '#A7F3D0' },
  { id: 'vc6', name: 'Code Sandbox',      icon: '🧪', desc: '沙箱环境安全执行代码，支持 Python / JS / Shell',    tag: 'Runtime',     tagColor: '#D97706', tagBg: '#FFFBEB', tagBorder: '#FDE68A' },
];

const SKILL_LIST = [
  // 基础技能
  { id: 'sk1',    name: '网络搜索',      type: 'Skill',  icon: '🔍', desc: '实时搜索互联网信息，获取最新资讯与数据' },
  { id: 'sk2',    name: '飞书文档',      type: 'Skill',  icon: '📄', desc: '飞书文档读写与管理，支持多维表格操作' },
  { id: 'sk3',    name: 'Python 执行',   type: 'Skill',  icon: '🐍', desc: '执行 Python 代码，处理结构化数据与自动化任务' },
  { id: 'sk4',    name: 'PDF 解析',      type: 'Skill',  icon: '📃', desc: '解析 PDF 文档内容，提取文字、表格与结构化信息' },
  { id: 'sk-d1',  name: '图表生成',      type: 'Skill',  icon: '📈', desc: '将结构化数据转换为可视化图表（柱/折/饼/散点图）' },
  { id: 'sk-d2',  name: 'SQL 查询',      type: 'Skill',  icon: '🗃️', desc: '自然语言转 SQL，查询并汇总关系型数据库数据' },
  { id: 'sk-d3',  name: '图片文字提取',  type: 'Skill',  icon: '✂️', desc: '从图片与扫描件中提取文字（OCR 识别）' },
  // Office 三件套
  { id: 'sk-of1', name: 'Word 文档',     type: 'Office', icon: '📝', desc: '智能生成、编辑、格式化 Word 文档，支持模板与样式' },
  { id: 'sk-of2', name: 'Excel 数据',    type: 'Office', icon: '📊', desc: '读写 Excel，执行数据分析、透视表与图表生成' },
  { id: 'sk-of3', name: 'PowerPoint',    type: 'Office', icon: '📑', desc: 'AI 生成与编辑 PPT，支持主题、排版与动效配置' },
  { id: 'sk-of4', name: 'Outlook 邮件',  type: 'Office', icon: '📧', desc: '收发邮件、日历管理、邮件模板智能填充与自动回复' },
  // 工作流
  { id: 'sk5',    name: '内容审核流程',  type: '工作流', icon: '⚡', desc: '多节点内容合规审查工作流' },
  { id: 'sk-w2',  name: '审批流程',      type: '工作流', icon: '✅', desc: '触发并跟踪企业内部审批流，支持多级审核与抄送' },
  { id: 'sk-w3',  name: '定时任务',      type: '工作流', icon: '⏰', desc: '设置定时触发任务，自动执行报告生成与消息推送' },
];
const MCP_SERVERS = [
  // 搜索与信息
  { id: 'mcp-s1', name: 'Brave Search MCP',  desc: '隐私友好的实时联网搜索，支持网页与新闻全文检索',       icon: '🔍' },
  { id: 'mcp-s2', name: 'Google Search MCP', desc: 'Google 实时搜索，覆盖全球网页内容与知识图谱',           icon: '🌐' },
  // 多模态
  { id: 'mcp-v1', name: '视觉理解 MCP',      desc: '图片、截图、文档图像的 AI 多模态视觉识别与内容分析',   icon: '👁️' },
  { id: 'mcp-v2', name: '语音识别 MCP',      desc: '音频与视频转录为文本，支持中英文多语种实时识别',       icon: '🎙️' },
  // 文件与系统
  { id: 'mcp-f1', name: '文件系统 MCP',      desc: '读写本地与云端文件，支持批量处理与目录管理',           icon: '📁' },
  { id: 'mcp-f2', name: 'Everything MCP',    desc: '集成搜索、文件、浏览器等全功能 MCP 超级套件',          icon: '🔮' },
  // 协作与业务
  { id: 'mcp1',   name: '数据库连接器',      desc: '连接企业内部 MySQL / Oracle / PostgreSQL',             icon: '🗄️' },
  { id: 'mcp2',   name: '飞书 MCP',          desc: '读写飞书文档、日历、审批、多维表格',                   icon: '📋' },
  { id: 'mcp3',   name: 'GitHub MCP',        desc: 'PR 管理、Issue 操作、代码仓库读写',                    icon: '🐙' },
  { id: 'mcp-b1', name: 'Slack MCP',         desc: '发送消息、管理频道、搜索历史对话记录',                 icon: '💬' },
  { id: 'mcp-b2', name: 'Notion MCP',        desc: '读写 Notion 数据库、页面与看板内容',                   icon: '📓' },
  { id: 'mcp4',   name: 'CRM 连接器',        desc: '客户数据读写、商机跟踪、销售漏斗分析',                 icon: '📊' },
  { id: 'mcp5',   name: 'ERP 连接器',        desc: '供应链、库存、财务数据实时同步',                       icon: '🏭' },
];

const RESPONSE_STYLES = [
  { id: 'formal',   label: '正式严谨', desc: '措辞严谨，引用依据，适合法务/财务场景', icon: '⚖️' },
  { id: 'friendly', label: '专业友好', desc: '专业中带亲和力，适合客服/HR 场景',       icon: '🤝' },
  { id: 'concise',  label: '简洁直接', desc: '结论优先，省略铺垫，适合技术/研发场景', icon: '⚡' },
];
const CHANNELS = [
  { id: 'api',    label: 'REST API',   desc: '标准 HTTP 接口，支持外部系统集成', icon: '🔌' },
  { id: 'flow',   label: '工作流节点', desc: '作为节点嵌入工作流',               icon: '⚡' },
  { id: 'feishu', label: '飞书机器人', desc: '以飞书群机器人形式提供服务',       icon: '🪶' },
  { id: 'ding',   label: '钉钉机器人', desc: '以钉钉群机器人形式提供服务',       icon: '📎' },
];
const DEFAULT_PROMPT = `你是「{员工名称}」，{部门}的{角色定位}。

【职责范围】
- 请在此描述该员工的核心职责1
- 请在此描述该员工的核心职责2

【工作原则】
1. 所有回答须基于知识库与工具检索结果，不凭空推断
2. 遇到超出职责范围的问题，说明边界并引导至正确渠道

【输出规范】
- 回复语言：简体中文
- 格式：结构化输出，核心结论置前`;

interface WizardData {
  name: string; dept: string; role: string; description: string; domain: string;
  model: string; prompt: string; kbEnabled: Record<string, boolean>;
  skillEnabled: Record<string, boolean>; mcpEnabled: Record<string, boolean>;
  responseStyle: string; restrictions: string[]; accessScope: string;
  accessTargets: string[];
  channels: string[];
  feishuAppId: string;
  feishuAppSecret: string;
}
const initWizardData = (): WizardData => ({
  name: '', dept: '', role: '', description: '', domain: '',
  model: 'chat-model', prompt: DEFAULT_PROMPT,
  kbEnabled: {}, skillEnabled: { sk1: true, sk2: true }, mcpEnabled: {},
  responseStyle: 'friendly', restrictions: ['r1', 'r2'],
  accessScope: 'company', accessTargets: [], channels: ['api'],
  feishuAppId: '', feishuAppSecret: '',
});

const STEPS = [
  { title: '基础信息', description: '员工身份与职能' },
  { title: 'AI 能力',  description: '模型、知识与技能' },
  { title: '部署配置', description: '上线渠道与权限'  },
  { title: '测试上岗', description: '调试验证并上线'  },
];

// ─── 步骤标题组件 ──────────────────────────────────────────
const SectionTitle: React.FC<{ title: string; desc?: string }> = ({ title, desc }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{title}</div>
    {desc && <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{desc}</div>}
  </div>
);

// ─── PromptFilesEditor ────────────────────────────────────────

interface PromptFileDef {
  name: string;
  desc: string;
  defaultContent: string;
  isMemory?: boolean;
}

const MOCK_MEMORIES = `# 运行时记忆

> 以下内容由员工在实际运行过程中自动积累，可手动编辑或清理。

## 用户偏好
- 用户「张总监」偏好结构化输出，喜欢分条列举而非长段落
- 用户「李经理」经常在下午14:00-16:00发起合同审查请求
- 多位用户反馈：风险等级标注使用「高/中/低」比数字评分更直观

## 常见问题记录
- 「劳动合同试用期条款」是询问频率最高的问题（本月28次）
- 「保密协议模板」请求量较上月增长40%，已建议补充知识库

## 修正记录
- 2026-03-15：用户纠正「竞业限制期限」表述，最长不超过2年而非1年，已更新认知
- 2026-03-22：用户指出某供应商合同缺少「争议解决条款」，已加入审查清单`;

const PROMPT_FILES_DEF: PromptFileDef[] = [
  {
    name: 'AGENTS.md',
    desc: '核心角色设定',
    defaultContent: DEFAULT_PROMPT,
  },
  {
    name: 'SOUL.md',
    desc: '性格与价值观',
    defaultContent: `# 性格与价值观

## 性格特征
- 专业严谨，注重细节
- 主动积极，响应及时
- 以用户需求为导向

## 核心价值观
1. 准确性优先：所有信息须基于可靠数据源，不凭空推断
2. 保护隐私：严格遵守数据安全与保密规定
3. 持续学习：主动更新知识库，保持专业能力领先`,
  },
  {
    name: 'MEMORY.md',
    desc: '运行时记忆',
    defaultContent: MOCK_MEMORIES,
    isMemory: true,
  },
];

const PromptFilesEditor: React.FC<{
  initialPrompt: string;
  onChange: (prompt: string) => void;
}> = ({ initialPrompt, onChange }) => {
  const initContents = (): Record<string, string> => {
    const map: Record<string, string> = {};
    PROMPT_FILES_DEF.forEach(f => {
      map[f.name] = f.name === 'AGENTS.md' ? initialPrompt : f.defaultContent;
    });
    return map;
  };

  const [fileContents, setFileContents] = React.useState<Record<string, string>>(initContents);
  const [selectedFile, setSelectedFile] = React.useState('AGENTS.md');
  const [editingContent, setEditingContent] = React.useState(initialPrompt);

  // 弹窗状态
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalContent, setModalContent] = React.useState('');
  const [modalPreview, setModalPreview] = React.useState(false);

  const autoCommit = (fileName: string, content: string) => {
    const newContents = { ...fileContents, [fileName]: content };
    setFileContents(newContents);
    onChange(newContents['AGENTS.md'] || '');
  };

  const handleSelectFile = (fileName: string) => {
    autoCommit(selectedFile, editingContent);
    setSelectedFile(fileName);
    setEditingContent(fileContents[fileName] ?? PROMPT_FILES_DEF.find(f => f.name === fileName)?.defaultContent ?? '');
  };

  const handleReset = () => {
    const def = PROMPT_FILES_DEF.find(f => f.name === selectedFile);
    if (def) {
      setEditingContent(def.defaultContent);
      autoCommit(selectedFile, def.defaultContent);
    }
  };

  // 打开弹窗预览/编辑
  const openModal = () => {
    setModalContent(editingContent);
    setModalPreview(false);
    setModalOpen(true);
  };

  // 弹窗关闭时自动同步内容
  const handleModalClose = () => {
    setEditingContent(modalContent);
    autoCommit(selectedFile, modalContent);
    setModalOpen(false);
  };

  const byteSize = (s: string) => new Blob([s]).size;
  const currentFileDef = PROMPT_FILES_DEF.find(f => f.name === selectedFile);

  return (
    <>
      <div style={{ border: '1px solid #e8e8e8', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
        <div style={{ display: 'flex', height: 342 }}>

          {/* ── 左侧文件列表 ── */}
          <div style={{ width: 176, borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', background: '#fafafa', flexShrink: 0 }}>
            <div style={{ padding: '9px 12px', fontSize: 10, fontWeight: 700, color: '#9CA3AF', borderBottom: '1px solid #f0f0f0', letterSpacing: 0.8 }}>
              配置文件
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {PROMPT_FILES_DEF.map(f => {
                const isSelected = selectedFile === f.name;
                const content = fileContents[f.name] ?? f.defaultContent;
                const size = byteSize(content);
                return (
                  <div
                    key={f.name}
                    onClick={() => handleSelectFile(f.name)}
                    style={{
                      padding: '9px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f3f4f6',
                      background: isSelected ? '#eff6ff' : 'transparent',
                      borderLeft: `2px solid ${isSelected ? '#6366F1' : 'transparent'}`,
                      transition: 'all 0.12s',
                    }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = '#f5f5fa'; }}
                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: isSelected ? 600 : 400, color: isSelected ? '#4338CA' : '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                      {f.isMemory && (
                        <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: '#fef3c7', color: '#D97706', border: '1px solid #fde68a', flexShrink: 0, fontWeight: 600 }}>动态</span>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: '#9CA3AF' }}>{f.desc} · {size} B</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 右侧编辑器 ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

            {/* 路径栏 + 操作按钮 */}
            <div style={{ padding: '7px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 6, background: '#fff', flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                /prompt/{selectedFile}
              </span>
              {currentFileDef?.isMemory && (
                <span style={{ fontSize: 10, color: '#10B981', padding: '1px 6px', borderRadius: 4, background: '#f0fdf4', border: '1px solid #a7f3d0', flexShrink: 0 }}>运行时更新</span>
              )}
              <button
                onClick={openModal}
                style={{ padding: '3px 9px', borderRadius: 5, border: '1px solid #e8e8e8', background: '#fff', color: '#6B7280', fontSize: 11, cursor: 'pointer', flexShrink: 0 }}
              >预览</button>
              <button
                onClick={handleReset}
                style={{ padding: '3px 9px', borderRadius: 5, border: '1px solid #e8e8e8', background: '#fff', color: '#6B7280', fontSize: 11, cursor: 'pointer', flexShrink: 0 }}
              >重置</button>
            </div>

            {/* Content 标签 */}
            <div style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, color: '#6B7280', background: '#f9fafb', borderBottom: '1px solid #f0f0f0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Content</span>
              {currentFileDef?.isMemory && (
                <span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 400 }}>员工运行中自动积累，可手动编辑或清理</span>
              )}
            </div>

            {/* 编辑区 */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <textarea
                value={editingContent}
                onChange={e => { setEditingContent(e.target.value); autoCommit(selectedFile, e.target.value); }}
                style={{ width: '100%', height: '100%', border: 'none', outline: 'none', padding: '10px 14px', fontSize: 12, fontFamily: 'monospace', lineHeight: 1.75, resize: 'none', color: '#374151', background: '#fff', boxSizing: 'border-box' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── 预览/编辑 弹窗 ── */}
      <Modal
        open={modalOpen}
        onCancel={handleModalClose}
        footer={null}
        width="76vw"
        centered
        styles={{ body: { padding: 0 } }}
        closable={false}
      >
        {/* 弹窗头部 */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#fff', gap: 10 }}>
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{selectedFile}</span>
            <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace' }}>/prompt/{selectedFile}</span>
            {currentFileDef?.isMemory && (
              <span style={{ fontSize: 10, color: '#10B981', padding: '1px 6px', borderRadius: 4, background: '#f0fdf4', border: '1px solid #a7f3d0', fontWeight: 600 }}>运行时更新</span>
            )}
          </div>
          {/* 编辑/预览 切换 */}
          <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 7, padding: 3, gap: 0 }}>
            {([{ key: false, label: '编辑' }, { key: true, label: '预览' }] as const).map(tab => (
              <div
                key={String(tab.key)}
                onClick={() => setModalPreview(tab.key)}
                style={{
                  padding: '4px 14px', borderRadius: 5, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
                  fontWeight: modalPreview === tab.key ? 600 : 400,
                  color: modalPreview === tab.key ? '#111' : '#6B7280',
                  background: modalPreview === tab.key ? '#fff' : 'transparent',
                  boxShadow: modalPreview === tab.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >{tab.label}</div>
            ))}
          </div>
          <div
            onClick={handleModalClose}
            style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, cursor: 'pointer', color: '#9CA3AF', fontSize: 16 }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#F3F4F6'}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
          >✕</div>
        </div>

        {/* 弹窗内容区 */}
        <div style={{ height: '66vh', display: 'flex', flexDirection: 'column' }}>
          {modalPreview ? (
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', fontSize: 13, color: '#374151', lineHeight: 2, whiteSpace: 'pre-wrap', fontFamily: 'inherit', background: '#fafafa' }}>
              {modalContent || <span style={{ color: '#bbb' }}>（空文件）</span>}
            </div>
          ) : (
            <textarea
              value={modalContent}
              onChange={e => { setModalContent(e.target.value); setEditingContent(e.target.value); autoCommit(selectedFile, e.target.value); }}
              autoFocus
              style={{ flex: 1, border: 'none', outline: 'none', padding: '20px 28px', fontSize: 13, fontFamily: 'monospace', lineHeight: 1.85, resize: 'none', color: '#374151', background: '#fff', boxSizing: 'border-box' }}
            />
          )}
        </div>
      </Modal>
    </>
  );
};

// ─── 通用资源选择器组件 ───────────────────────────────────

interface PickerItem {
  id: string;
  icon: React.ReactNode | string;
  name: string;
  desc: string;
  tag?: string;
  tagColor?: string;
  tagBg?: string;
  tagBorder?: string;
}

// ─── 技能文件树数据 ────────────────────────────────────────────────────────────
interface SkillFileNode {
  name: string;
  type: 'file' | 'folder';
  children?: SkillFileNode[];
  content?: string;
}
interface SkillFileData { rootName: string; nodes: SkillFileNode[]; }

const SKILL_FILE_DATA: Record<string, SkillFileData> = {
  sk1: {
    rootName: 'web-search-skill',
    nodes: [
      { name: 'evals', type: 'folder', children: [{ name: 'evals.json', type: 'file', content: `[\n  { "query": "最新 AI 发展", "expected_contains": ["2025", "模型"] },\n  { "query": "人民币汇率", "expected_contains": ["中国人民银行"] }\n]` }] },
      { name: 'references', type: 'folder', children: [
        { name: 'AGENTS.md', type: 'file', content: `# Agents 配置\n\n本技能使用搜索 Agent，调用外部搜索 API 获取实时数据。\n\n## 工具列表\n- web_search: 互联网全文搜索\n- news_search: 新闻实时搜索` },
        { name: 'SOUL.md', type: 'file', content: `# 网络搜索助手 Soul\n\n你是一个精准的信息检索专家，擅长从海量互联网内容中提炼核心事实。\n\n## 行为准则\n1. 优先引用权威来源\n2. 注明信息时效性\n3. 对不确定信息标注"待核实"` },
      ]},
      { name: 'SKILL.md', type: 'file', content: `**name: web-search-skill description:** > 实时搜索互联网信息，获取最新资讯与数据。\n\n# 网络搜索技能\n\n你是一个专业的网络搜索助手，能够实时获取互联网信息，为用户提供准确、及时的数据支持。\n\n## 触发条件\n\n当用户询问以下内容时触发此技能：\n\n1. **实时信息**（★ 高优先级）\n   - 最新新闻与时事动态\n   - 股票、汇率、天气等实时数据\n   - 最新政策法规\n\n2. **专业知识查询**（# 参考依据）\n   - 技术文档与标准\n   - 行业报告与白皮书\n   - 学术研究成果\n\n## 输出规范\n\n- 每条结果注明来源 URL\n- 标注信息采集时间\n- 对不确定内容进行说明` },
    ],
  },
  sk2: {
    rootName: 'feishu-doc-skill',
    nodes: [
      { name: 'evals', type: 'folder', children: [{ name: 'evals.json', type: 'file', content: `[\n  { "action": "读取多维表格", "table_id": "mock-001" },\n  { "action": "写入文档", "doc_id": "mock-002", "content": "测试内容" }\n]` }] },
      { name: 'SKILL.md', type: 'file', content: `**name: feishu-doc-skill description:** > 飞书文档读写与管理，支持多维表格操作。\n\n# 飞书文档技能\n\n你是飞书生态的文档管理专家，能够读取、写入和管理飞书云文档及多维表格。\n\n## 核心能力\n\n1. **文档管理**\n   - 创建、编辑飞书文档\n   - 格式化文本与表格\n   - 管理文档权限\n\n2. **多维表格**\n   - 读写多维表格数据\n   - 执行数据筛选与统计\n   - 批量数据操作\n\n## 权限要求\n\n- 需要飞书 OAuth 授权\n- 读取权限：docs:read\n- 写入权限：docs:write` },
      { name: 'SOUL.md', type: 'file', content: `# 飞书文档助手 Soul\n\n你是飞书生态的熟练使用者，了解飞书文档的所有功能与限制。\n\n## 工作原则\n1. 操��前确认权限\n2. 批量操作前进行小样本测试\n3. 写入操作必须获得用户确认` },
    ],
  },
  sk3: {
    rootName: 'python-exec-skill',
    nodes: [
      { name: 'sandbox', type: 'folder', children: [
        { name: 'runner.py', type: 'file', content: `import subprocess, sys\n\ndef run_safe(code: str, timeout: int = 30) -> dict:\n    """在沙箱中安全执行 Python 代码"""\n    result = subprocess.run(\n        [sys.executable, '-c', code],\n        capture_output=True, text=True, timeout=timeout\n    )\n    return {'stdout': result.stdout, 'stderr': result.stderr, 'returncode': result.returncode}` },
        { name: 'requirements.txt', type: 'file', content: `pandas==2.0.3\nnumpy==1.24.3\nmatplotlib==3.7.1\nscikit-learn==1.3.0` },
      ]},
      { name: 'SKILL.md', type: 'file', content: `**name: python-exec-skill description:** > 执行 Python 代码，处理结构化数据与自动化任务。\n\n# Python 执行技能\n\n你是一名专业的 Python 数据工程师，能够在安全沙箱中执行 Python 代码。\n\n## 支持场景\n\n1. **数据处理与分析**\n   - Pandas 数据清洗与转换\n   - NumPy 数值计算\n   - 统计分析与可视化\n\n2. **自动化任务**\n   - 文件批处理\n   - 数据格式转换（CSV/JSON/Excel）\n   - 定时报告生成\n\n## 安全限制\n\n- 禁止网络访问（除白名单域名）\n- 禁止文件系统写入（/tmp 除外）\n- 最大执行时间：30 秒\n- 最大内存占用：512 MB` },
      { name: 'SOUL.md', type: 'file', content: `# Python 执行助手 Soul\n\n你是严谨的数据工程师，代码质量第一。\n\n## 编码规范\n1. 添加必要注释\n2. 异常处理完整\n3. 执行前分析潜在风险` },
    ],
  },
  sk4: {
    rootName: 'pdf-parser-skill',
    nodes: [
      { name: 'templates', type: 'folder', children: [
        { name: 'extract_prompt.md', type: 'file', content: `# PDF 提取提示词模板\n\n请从以下 PDF 内容中提取：\n1. 文档标题与作者\n2. 核心章节结构\n3. 关键数据与表格\n4. 重要结论` },
      ]},
      { name: 'SKILL.md', type: 'file', content: `**name: pdf-parser-skill description:** > 解析 PDF 文档内容，提取文字、表格与结构化信息。\n\n# PDF 解析技能\n\n你是专业的文档解析专家，能够准确提取 PDF 中的文字、表格和结构化信息。\n\n## 解析能力\n\n1. **文字提取**（★ 核心能力）\n   - 多语言文字识别\n   - 跨页内容合并\n   - 保留原始格式\n\n2. **表格识别**（# 结构化输出）\n   - 自动识别表格边界\n   - 输出为 Markdown / JSON 格式\n   - 处理合并单元格\n\n## 支持格式\n\n- PDF 1.0 - 2.0\n- 扫描件（需 OCR 支持）\n- 加密 PDF（需密码）` },
    ],
  },
  'sk-d1': {
    rootName: 'chart-gen-skill',
    nodes: [
      { name: 'chart_types', type: 'folder', children: [
        { name: 'bar.md', type: 'file', content: `# 柱状图\n\n适用场景：分类数据对比\n\n参数：\n- x: 分类字段名\n- y: 数值字段名\n- title: 图表标题` },
        { name: 'line.md', type: 'file', content: `# 折线图\n\n适用场景：时序数据趋势\n\n参数：\n- x: 时间字段（支持日期格式）\n- y: 数值字段（支持多系列）` },
      ]},
      { name: 'SKILL.md', type: 'file', content: `**name: chart-gen-skill description:** > 将结构化数据转换为可视化图表（柱/折/饼/散点图）。\n\n# 图表生成技能\n\n你是数据可视化专家，能够将原始数据转换为清晰直观的图表。\n\n## 支持图表类型\n\n1. **基础图表**\n   - 柱状图（分类对比）\n   - 折线图（时序趋势）\n   - 饼图（占比分布）\n   - 散点图（相关性分析）\n\n2. **高级图表**\n   - 热力图\n   - 瀑布图\n   - 桑基图\n\n## 输入格式\n\n支持 JSON、CSV、Markdown 表格格式的数据输入。` },
    ],
  },
  'sk-d2': {
    rootName: 'sql-query-skill',
    nodes: [
      { name: 'dialects', type: 'folder', children: [
        { name: 'mysql.md', type: 'file', content: `# MySQL 方言支持\n\n支持版本：5.7, 8.0\n\n特殊语法：\n- GROUP_CONCAT\n- JSON_EXTRACT\n- 窗口函数（8.0+）` },
        { name: 'postgresql.md', type: 'file', content: `# PostgreSQL 方言支持\n\n支持版本：12+\n\n特殊语法：\n- JSONB 操作\n- CTE (WITH)\n- 窗口函数` },
      ]},
      { name: 'SKILL.md', type: 'file', content: `**name: sql-query-skill description:** > 自然语言转 SQL，查询并汇总关系型数据库数据。\n\n# SQL 查询技能\n\n你是数据库查询专家，能够将自然语言需求转换为精确的 SQL 查询语句。\n\n## 核心能力\n\n1. **NL2SQL 转换**（★ 高优先级）\n   - 理解业务语义\n   - 生成高效 SQL\n   - 支持复杂多表关联\n\n2. **查询优化**\n   - 索引使用建议\n   - 执行计划分析\n   - 大数据量分页处理\n\n## 支持数据库\n\n- MySQL 5.7 / 8.0\n- PostgreSQL 12+\n- SQLite\n- Hive / Spark SQL` },
    ],
  },
  'sk-of2': {
    rootName: 'excel-skill',
    nodes: [
      { name: 'templates', type: 'folder', children: [
        { name: 'financial_report.xlsx.md', type: 'file', content: `# 财务报表模板\n\n## 工作表结构\n- Sheet1: 损益表\n- Sheet2: 资产负债表\n- Sheet3: 现金流量表\n\n## 关键公式\n- 净利润 = 营收 - 成本 - 费用\n- 流动比率 = 流动资产 / 流动负债` },
      ]},
      { name: 'SKILL.md', type: 'file', content: `**name: excel-skill description:** > 读写 Excel，执行数据分析、透视表与图表生成。\n\n# Excel 数据技能\n\n你是 Excel 数据处理专家，能够读写 Excel 文件并执行复杂数据分析。\n\n## 核心功能\n\n1. **数据读写**\n   - 读取多工作表数据\n   - 写入格式化报表\n   - 处理大型数据集（10万行+）\n\n2. **数据分析**\n   - 数据透视表创建\n   - 公式与函数计算\n   - 条件格式化\n\n3. **图表生成**\n   - 内嵌图表创建\n   - 自动更新数据图表` },
    ],
  },
  sk5: {
    rootName: 'content-review-workflow',
    nodes: [
      { name: 'nodes', type: 'folder', children: [
        { name: 'sensitivity_check.md', type: 'file', content: `# 敏感词检测节点\n\n## 功能\n对输入内容进行敏感词扫描。\n\n## 输入\n- content: string (待检测文本)\n\n## 输出\n- passed: boolean\n- hits: string[] (命中词列表)` },
        { name: 'human_review.md', type: 'file', content: `# 人工审核节点\n\n## 触发条件\n敏感词检测未通过时进入人工审核。\n\n## 审核人\n- 一审：内容运营\n- 二审：合规专员（高风险内容）` },
      ]},
      { name: 'SKILL.md', type: 'file', content: `**name: content-review-workflow description:** > 多节点内容合规审查工作流。\n\n# 内容审核流程\n\n你负责执行标准化的内容合规审查流程，确保所有输出内容符合合规要求。\n\n## 流程节点\n\n1. **自动检测**（★ 自动执行）\n   - 敏感词过滤\n   - 违规图片检测\n   - 合规性预判\n\n2. **人工复核**（# 条件触发）\n   - 高风险内容人工审核\n   - 边界案例专项处理\n   - 申诉处理机制\n\n3. **结果输出**\n   - 通过：直接发布\n   - 拒绝：返回修改意见\n   - 待审：进入人工队列\n\n## SLA 要求\n\n- 自动审核：< 3 秒\n- 人工审核：< 4 小时` },
    ],
  },
};

// 默认文件树（技能无特定文件时显示）
const DEFAULT_SKILL_FILES = (skillName: string): SkillFileData => ({
  rootName: skillName.toLowerCase().replace(/\s+/g, '-') + '-skill',
  nodes: [
    { name: 'evals', type: 'folder', children: [{ name: 'evals.json', type: 'file', content: `[\n  { "case": "基础功能测试", "status": "passed" },\n  { "case": "边界条件测试", "status": "passed" }\n]` }] },
    { name: 'SKILL.md', type: 'file', content: `**name: ${skillName.toLowerCase().replace(/\s+/g, '-')}-skill**\n\n# ${skillName}\n\n本技能提供 ${skillName} 相关功能支持。\n\n## 核心能力\n\n1. 自动识别相关任务\n2. 智能处理与执行\n3. 结果验证与输出\n\n## 使用说明\n\n- 在对话中直接描述需求即可触发\n- 支持批量处理模式` },
    { name: 'SOUL.md', type: 'file', content: `# ${skillName} Soul\n\n专注、高效、准确是本技能的核心理念。` },
  ],
});

// ─── 简易 Markdown 渲染器 ─────────────────────────────────────────────────────
function renderMarkdown(md: string): React.ReactNode {
  const lines = md.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('# ')) {
      elements.push(<div key={i} style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginBottom: 12, marginTop: i > 0 ? 20 : 0, lineHeight: 1.3 }}>{renderInline(line.slice(2))}</div>);
    } else if (line.startsWith('## ')) {
      elements.push(<div key={i} style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 8, marginTop: 18, lineHeight: 1.4, borderBottom: '1px solid #f0f0f0', paddingBottom: 6 }}>{renderInline(line.slice(3))}</div>);
    } else if (line.startsWith('### ')) {
      elements.push(<div key={i} style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 6, marginTop: 14 }}>{renderInline(line.slice(4))}</div>);
    } else if (/^\d+\.\s/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(<li key={i} style={{ marginBottom: 4 }}>{renderInline(lines[i].replace(/^\d+\.\s/, ''))}</li>);
        i++;
      }
      elements.push(<ol key={`ol-${i}`} style={{ paddingLeft: 20, margin: '6px 0', fontSize: 14, color: '#333', lineHeight: 1.7 }}>{items}</ol>);
      continue;
    } else if (line.startsWith('   - ') || line.startsWith('  - ')) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && (lines[i].startsWith('   - ') || lines[i].startsWith('  - '))) {
        const txt = lines[i].replace(/^\s+- /, '');
        items.push(<li key={i} style={{ marginBottom: 3 }}>{renderInline(txt)}</li>);
        i++;
      }
      elements.push(<ul key={`ul-sub-${i}`} style={{ paddingLeft: 28, margin: '3px 0', fontSize: 13, color: '#555', lineHeight: 1.7, listStyleType: 'circle' }}>{items}</ul>);
      continue;
    } else if (line.startsWith('- ')) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(<li key={i} style={{ marginBottom: 4 }}>{renderInline(lines[i].slice(2))}</li>);
        i++;
      }
      elements.push(<ul key={`ul-${i}`} style={{ paddingLeft: 20, margin: '6px 0', fontSize: 14, color: '#333', lineHeight: 1.7 }}>{items}</ul>);
      continue;
    } else if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={i} style={{ background: '#f6f8fa', borderRadius: 6, padding: '10px 14px', fontSize: 12, color: '#24292e', overflowX: 'auto', margin: '8px 0', fontFamily: 'monospace', lineHeight: 1.6, border: '1px solid #e8e8e8' }}>
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
    } else if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: 6 }} />);
    } else {
      elements.push(<p key={i} style={{ fontSize: 14, color: '#333', lineHeight: 1.8, margin: '4px 0' }}>{renderInline(line)}</p>);
    }
    i++;
  }
  return <>{elements}</>;
}

function renderInline(text: string): React.ReactNode {
  // bold **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return <>{parts.map((p, i) => p.startsWith('**') && p.endsWith('**')
    ? <strong key={i} style={{ fontWeight: 700 }}>{p.slice(2, -2)}</strong>
    : <span key={i}>{p}</span>
  )}</>;
}

// ─── 技能文件查看器 ────────────────────────────────────────────────────────────
const SkillFileViewer: React.FC<{
  skillId: string;
  skillName: string;
  skillIcon: string;
  open: boolean;
  onClose: () => void;
}> = ({ skillId, skillName, skillIcon, open, onClose }) => {
  const fileData = SKILL_FILE_DATA[skillId] ?? DEFAULT_SKILL_FILES(skillName);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root', fileData.rootName]));
  const [activeFile, setActiveFile] = useState<{ name: string; content: string } | null>(null);
  const [previewMode, setPreviewMode] = useState<'preview' | 'source'>('preview');

  // 自动展开第一个文件
  React.useEffect(() => {
    if (!open) return;
    setExpandedFolders(new Set(['root', fileData.rootName]));
    // 找第一个 SKILL.md
    const findFirst = (nodes: SkillFileNode[]): { name: string; content: string } | null => {
      for (const n of nodes) {
        if (n.type === 'file' && n.name === 'SKILL.md') return { name: n.name, content: n.content || '' };
      }
      for (const n of nodes) {
        if (n.type === 'file') return { name: n.name, content: n.content || '' };
      }
      return null;
    };
    setActiveFile(findFirst(fileData.nodes));
    setPreviewMode('preview');
  }, [open, skillId]);

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  };

  const renderTree = (nodes: SkillFileNode[], depth = 0, parentPath = 'root'): React.ReactNode => (
    <>
      {nodes.map((node) => {
        const path = `${parentPath}/${node.name}`;
        const isExpanded = expandedFolders.has(path);
        const isActive = activeFile?.name === node.name;
        if (node.type === 'folder') {
          return (
            <div key={path}>
              <div
                onClick={() => toggleFolder(path)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', paddingLeft: 8 + depth * 14, cursor: 'pointer', borderRadius: 4, fontSize: 12, color: '#374151', userSelect: 'none' }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f3f4f6'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
              >
                <span style={{ fontSize: 10, color: '#9ca3af', width: 10, flexShrink: 0 }}>{isExpanded ? '▼' : '▶'}</span>
                <span style={{ fontSize: 13 }}>📁</span>
                <span style={{ fontWeight: 500 }}>{node.name}</span>
              </div>
              {isExpanded && node.children && renderTree(node.children, depth + 1, path)}
            </div>
          );
        }
        const isJson = node.name.endsWith('.json');
        const isPy   = node.name.endsWith('.py');
        const isMd   = node.name.endsWith('.md');
        const fileIcon = isJson ? '🔧' : isPy ? '🐍' : isMd ? '📄' : '📃';
        return (
          <div
            key={path}
            onClick={() => { setActiveFile({ name: node.name, content: node.content || '' }); setPreviewMode('preview'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', paddingLeft: 8 + depth * 14, cursor: 'pointer', borderRadius: 4, fontSize: 12, color: '#374151', background: isActive ? '#EEF2FF' : 'transparent', fontWeight: isActive ? 500 : 400, userSelect: 'none' }}
            onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = '#f3f4f6'; }}
            onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
          >
            <span style={{ width: 10, flexShrink: 0 }} />
            <span style={{ fontSize: 13 }}>{fileIcon}</span>
            <span style={{ color: isActive ? '#6366F1' : '#374151' }}>{node.name}</span>
          </div>
        );
      })}
    </>
  );

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={1000}
      centered
      title={null}
      styles={{ body: { padding: 0 } }}
      style={{ borderRadius: 12, overflow: 'hidden', padding: 0 }}
    >
      {/* ── 顶部工具栏 ── */}
      <div style={{ height: 48, background: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>{skillIcon}</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{skillName}</span>
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#EEF2FF', color: '#6366F1', border: '1px solid #c7d2fe' }}>只读</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280', fontSize: 13 }} title="文件目录">📁</div>
          <div style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280', fontSize: 13 }} title="函数">ƒx</div>
        </div>
      </div>

      {/* ── 主体：左树 + 右内容 ── */}
      <div style={{ display: 'flex', height: 600 }}>

        {/* 左侧：文件目录 */}
        <div style={{ width: 260, flexShrink: 0, borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', background: '#fafafa' }}>
          <div style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>文件目录</span>
            <span style={{ fontSize: 14, color: '#9ca3af', cursor: 'pointer' }} title="下载">⬇</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 4px' }}>
            {/* 根目录 */}
            <div>
              <div
                onClick={() => toggleFolder(fileData.rootName)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', cursor: 'pointer', borderRadius: 4, fontSize: 12, color: '#374151', userSelect: 'none' }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f3f4f6'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
              >
                <span style={{ fontSize: 10, color: '#9ca3af', width: 10 }}>{expandedFolders.has(fileData.rootName) ? '▼' : '▶'}</span>
                <span style={{ fontSize: 13 }}>📁</span>
                <span style={{ fontWeight: 600, color: '#374151' }}>{fileData.rootName}</span>
              </div>
              {expandedFolders.has(fileData.rootName) && renderTree(fileData.nodes, 1, fileData.rootName)}
            </div>
          </div>
        </div>

        {/* 右侧：内容区 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Tab 栏 */}
          <div style={{ height: 40, display: 'flex', alignItems: 'center', borderBottom: '1px solid #e5e7eb', background: '#fff', flexShrink: 0, padding: '0 4px' }}>
            <div
              onClick={() => setPreviewMode('preview')}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 14px', height: '100%', cursor: 'pointer', fontSize: 12, color: previewMode === 'preview' ? '#6366F1' : '#6b7280', borderBottom: previewMode === 'preview' ? '2px solid #6366F1' : '2px solid transparent', fontWeight: previewMode === 'preview' ? 600 : 400 }}
            >
              <span>▤</span> 预览
            </div>
            {activeFile && (
              <div
                onClick={() => setPreviewMode('source')}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 14px', height: '100%', cursor: 'pointer', fontSize: 12, color: previewMode === 'source' ? '#6366F1' : '#6b7280', borderBottom: previewMode === 'source' ? '2px solid #6366F1' : '2px solid transparent', fontWeight: previewMode === 'source' ? 600 : 400 }}
              >
                <span style={{ fontSize: 11 }}>&lt;/&gt;</span> {activeFile.name}
              </div>
            )}
          </div>

          {/* 文件头 */}
          {activeFile && (
            <div style={{ height: 38, display: 'flex', alignItems: 'center', padding: '0 16px', borderBottom: '1px solid #f3f4f6', background: '#fff', flexShrink: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{activeFile.name}</span>
            </div>
          )}

          {/* 内容 */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', background: '#fff' }}>
            {!activeFile ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#bbb', fontSize: 13 }}>
                点击左侧文件查看内容
              </div>
            ) : previewMode === 'source' ? (
              <pre style={{ fontSize: 12, color: '#374151', fontFamily: 'monospace', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
                {activeFile.content}
              </pre>
            ) : (
              <div style={{ maxWidth: 700 }}>
                {renderMarkdown(activeFile.content)}
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

const PickerSection: React.FC<{
  title: string;
  desc?: string;
  modalTitle: string;
  items: PickerItem[];
  selectedIds: string[];
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  accentColor?: string;
  linkText?: string;
  onLink?: () => void;
}> = ({ title, desc, modalTitle, items, selectedIds, onAdd, onRemove, accentColor = '#6366F1', linkText, onLink }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch]       = useState('');
  const [viewingSkill, setViewingSkill] = useState<{ id: string; name: string; icon: string } | null>(null);

  const selectedItems   = items.filter(i => selectedIds.includes(i.id));
  const availableItems  = items.filter(i => !selectedIds.includes(i.id)).filter(i =>
    !search.trim() || i.name.includes(search.trim()) || i.desc.includes(search.trim())
  );

  return (
    <div>
      {/* 表头行 */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{title}</span>
          <button
            onClick={() => { setSearch(''); setModalOpen(true); }}
            style={{ width: 24, height: 24, borderRadius: 6, border: `1px solid ${accentColor}40`, background: `${accentColor}08`, color: accentColor, fontSize: 16, lineHeight: '22px', textAlign: 'center', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
          >＋</button>
        </div>
        {desc && <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{desc}</div>}
      </div>

      {/* 已添加列表 */}
      {selectedItems.length === 0 ? (
        <div style={{ padding: '11px 14px', border: '1px dashed #e8e8e8', borderRadius: 8, fontSize: 12, color: '#bbb', textAlign: 'center' }}>
          暂未添加，点击 ＋ 从列表中选择
        </div>
      ) : (
        <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, overflow: 'hidden' }}>
          {selectedItems.map((item, idx) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: idx < selectedItems.length - 1 ? '1px solid #f5f5f5' : 'none', background: '#fff' }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{ fontSize: 12, fontWeight: 500, color: '#6366F1', cursor: 'pointer' }}
                    title="点击查看技能文件"
                    onClick={() => setViewingSkill({ id: item.id, name: item.name, icon: String(item.icon) })}
                    onMouseEnter={e => (e.currentTarget as HTMLSpanElement).style.textDecoration = 'underline'}
                    onMouseLeave={e => (e.currentTarget as HTMLSpanElement).style.textDecoration = 'none'}
                  >{item.name}</span>
                  {item.tag && (
                    <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, color: item.tagColor ?? accentColor, background: item.tagBg ?? `${accentColor}10`, border: `1px solid ${item.tagBorder ?? `${accentColor}30`}` }}>{item.tag}</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: '#bbb', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.desc}</div>
              </div>
              <button
                onClick={() => onRemove(item.id)}
                style={{ width: 22, height: 22, borderRadius: 5, border: '1px solid #f0f0f0', background: '#fafafa', color: '#aaa', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0, lineHeight: 1 }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#ff4d4f'; (e.currentTarget as HTMLButtonElement).style.color = '#ff4d4f'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#f0f0f0'; (e.currentTarget as HTMLButtonElement).style.color = '#aaa'; }}
              >×</button>
            </div>
          ))}
        </div>
      )}


      {/* 选择弹窗 */}
      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        title={<span style={{ fontSize: 14, fontWeight: 700 }}>{modalTitle}</span>}
        width={520}
        centered
        styles={{ body: { padding: '12px 20px 20px' } }}
      >
        {/* 搜索框 */}
        <Input
          prefix={<SearchOutlined style={{ color: '#bbb' }} />}
          placeholder="搜索名称或描述..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: 12, borderRadius: 8 }}
          allowClear
        />

        {/* 可选列表 */}
        {availableItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#bbb', fontSize: 13 }}>
            {search.trim() ? '未找到匹配项' : '全部已添加 ✓'}
          </div>
        ) : (
          <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, overflow: 'hidden', maxHeight: 360, overflowY: 'auto' }}>
            {availableItems.map((item, idx) => (
              <div key={item.id}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderBottom: idx < availableItems.length - 1 ? '1px solid #f5f5f5' : 'none', transition: 'background 0.12s' }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = `${accentColor}06`}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                    <span
                      style={{ fontSize: 13, fontWeight: 500, color: '#6366F1', cursor: 'pointer' }}
                      title="点击查看技能文件"
                      onClick={e => { e.stopPropagation(); setViewingSkill({ id: item.id, name: item.name, icon: String(item.icon) }); }}
                      onMouseEnter={e => (e.currentTarget as HTMLSpanElement).style.textDecoration = 'underline'}
                      onMouseLeave={e => (e.currentTarget as HTMLSpanElement).style.textDecoration = 'none'}
                    >{item.name}</span>
                    {item.tag && (
                      <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, color: item.tagColor ?? accentColor, background: item.tagBg ?? `${accentColor}10`, border: `1px solid ${item.tagBorder ?? `${accentColor}30`}` }}>{item.tag}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#999' }}>{item.desc}</div>
                </div>
                <span
                  onClick={() => onAdd(item.id)}
                  style={{ fontSize: 20, color: accentColor, fontWeight: 300, flexShrink: 0, cursor: 'pointer', padding: '4px 6px', borderRadius: 6 }}
                  onMouseEnter={e => (e.currentTarget as HTMLSpanElement).style.background = `${accentColor}12`}
                  onMouseLeave={e => (e.currentTarget as HTMLSpanElement).style.background = 'transparent'}
                  title="添加"
                >＋</span>
              </div>
            ))}
          </div>
        )}

        {/* 底部：已添加数量 + 跳转新建 */}
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {onLink ? (
            <span
              onClick={() => { setModalOpen(false); onLink(); }}
              style={{ fontSize: 12, color: accentColor, cursor: 'pointer', fontWeight: 500 }}
              onMouseEnter={e => (e.currentTarget as HTMLSpanElement).style.textDecoration = 'underline'}
              onMouseLeave={e => (e.currentTarget as HTMLSpanElement).style.textDecoration = 'none'}
            >{linkText}</span>
          ) : <span />}
          {selectedItems.length > 0 && (
            <span style={{ fontSize: 11, color: '#bbb' }}>已添加 {selectedItems.length} 项</span>
          )}
        </div>
      </Modal>
      {viewingSkill && (
        <SkillFileViewer
          skillId={viewingSkill.id}
          skillName={viewingSkill.name}
          skillIcon={viewingSkill.icon}
          open={!!viewingSkill}
          onClose={() => setViewingSkill(null)}
        />
      )}
    </div>
  );
};

// ─── 历史版本浏览 Banner（图4风格：橙色顶栏） ──────────────
const VersionViewBanner: React.FC<{
  version: string;
  publishedAt?: string;
  publishedBy?: string;
  onClose: () => void;
}> = ({ version, publishedAt, publishedBy, onClose }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 20px',
    background: 'linear-gradient(90deg, #fff7ed 0%, #ffedd5 100%)',
    borderBottom: '1px solid #fed7aa',
    fontSize: 13, color: '#92400e', flexShrink: 0,
  }}>
    <EyeOutlined style={{ fontSize: 13, color: '#d97706' }} />
    <span>
      当前浏览的是历史版本&nbsp;
      <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#b45309' }}>{version}</span>
      {publishedAt && <>，备岗于&nbsp;<span style={{ fontWeight: 600 }}>{publishedAt}</span></>}
      {publishedBy && <>，由&nbsp;<span style={{ fontWeight: 600 }}>{publishedBy}</span>&nbsp;提交</>}
    </span>
    <span
      onClick={onClose}
      style={{ marginLeft: 'auto', cursor: 'pointer', color: '#d97706', fontSize: 15, lineHeight: 1, padding: '0 2px' }}
      title="关闭"
    >×</span>
  </div>
);

// ─── 全页向导（创建 / 编辑） ──────────────────────────────
interface TestMessage { role: 'user' | 'ai'; content: string; }

const EmployeeConfigPage: React.FC<{
  onClose: () => void;
  onBack?: () => void;
  onPublish?: (name: string) => void;
  initialData?: Partial<WizardData>;
  isEdit?: boolean;
  readOnly?: boolean;
  readOnlyVersion?: string;
  readOnlyPublishedAt?: string;
  readOnlyPublishedBy?: string;
  onViewVersion?: (version: EmployeeVersion) => void;
}> = ({ onClose, onBack, onPublish, initialData, isEdit, readOnly, readOnlyVersion, readOnlyPublishedAt, readOnlyPublishedBy, onViewVersion }) => {
  const [data, setData] = useState<WizardData>({ ...initWizardData(), ...initialData });
  const [stepAvatarUrl, setStepAvatarUrl] = useState<string | null>(null);
  const [stepAiDescLoading, setStepAiDescLoading] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const [empPublishOpen, setEmpPublishOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [inlineRollbackTarget, setInlineRollbackTarget] = useState<EmployeeVersion | null>(null);
  const stepAvatarRef = React.useRef<HTMLInputElement>(null);
  const update = (patch: Partial<WizardData>) => setData(prev => ({ ...prev, ...patch }));

  // 对话式配置状态
  interface ChatMsg { role: 'user' | 'ai'; content: string; }
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([
    { role: 'ai', content: '你好！你可以直接告诉我需要调整的内容，例如「把名字改为法务助手」、「描述改为负责合同审查」、「切换到国产安全模型」，我会同步更新左侧配置。' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // 任务列表：记录右侧调试时发送的任务，实时同步到左侧
  interface DebugTaskStep {
    id: string; name: string; desc: string;
    status: 'done' | 'running' | 'waiting';
    time?: string; output?: string;
  }
  interface DebugPipeStage {
    id: string; label: string; icon: string; type?: 'auto' | 'human';
    desc: string; logs: Array<{ text: string; kind: 'ok' | 'warn' | 'data' | 'info' }>;
  }
  interface DebugTask {
    id: number; title: string; content: string; time: string;
    status: 'running' | 'done' | 'human_pending';
    pipeStages: DebugPipeStage[];
    doneCount: number;
    steps: DebugTaskStep[];
    logs: Array<{ text: string; kind: string; ts: string }>;
    expanded: boolean;
    humanOk?: boolean;
    clarifyInput?: string;
    clarifyMode?: boolean;
    aiReply?: string;
  }
  const [tasks, setTasks] = useState<DebugTask[]>([]);
  const [taskStepView, setTaskStepView] = useState<Record<number, 'json' | 'form'>>({});
  const [taskJsonEdits, setTaskJsonEdits] = useState<Record<number, string>>({});
  const [taskJsonModal, setTaskJsonModal] = useState<{ taskId: number; content: string; preview: boolean } | null>(null);
  const [taskStageEdits, setTaskStageEdits] = useState<Record<number, DebugPipeStage[]>>({});
  const [taskStageDrag, setTaskStageDrag] = useState<{ taskId: number; fromIdx: number } | null>(null);
  const [editingStageKey, setEditingStageKey] = useState<string | null>(null);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  const syntaxHighlightJson = (src: object | string): string => {
    const json = typeof src === 'string' ? src : JSON.stringify(src, null, 2);
    return json
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
        let cls = 'color:#a6e3a1';
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? 'color:#89dceb' : 'color:#a6e3a1';
        } else if (/true|false/.test(match)) cls = 'color:#cba6f7';
        else if (/null/.test(match)) cls = 'color:#f38ba8';
        else cls = 'color:#fab387';
        return `<span style="${cls}">${match}</span>`;
      });
  };

  const getTaskStages = (task: DebugTask): DebugPipeStage[] => taskStageEdits[task.id] ?? task.pipeStages;
  const getTaskJson = (task: DebugTask): string => {
    if (taskJsonEdits[task.id] !== undefined) return taskJsonEdits[task.id];
    const stages = taskStageEdits[task.id] ?? task.pipeStages;
    return JSON.stringify(stages.map((s: DebugPipeStage) => ({ id: s.id, label: s.label, type: s.type ?? 'auto', desc: s.desc ?? '', icon: s.icon })), null, 2);
  };
  const chatFileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMsgs]);

  // 判断输入是否在员工职责范围内
  const isInScope = (text: string): boolean => {
    const scopeSources = [data.domain, data.dept, data.role, data.description, data.name]
      .filter(Boolean).join('');

    // 员工尚未配置职责信息，放行所有输入
    if (!scopeSources.trim()) return true;

    // 提取所有相邻2字双元组（bigram），覆盖「合同」「审查」「法务」等短词
    const bigrams = new Set<string>();
    for (let i = 0; i < scopeSources.length - 1; i++) {
      const a = scopeSources[i], b = scopeSources[i + 1];
      if (/[\u4e00-\u9fa5]/.test(a) && /[\u4e00-\u9fa5]/.test(b)) {
        bigrams.add(a + b);
      }
    }

    // 命中任意双元组即视为在职责范围内
    return Array.from(bigrams).some(bg => text.includes(bg));
  };

  const handleChatSend = () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setChatInput('');
    setChatMsgs(prev => [...prev, { role: 'user', content: text }]);
    setChatLoading(true);

    // 职责范围过滤：不在范围内只回复，不创建任务
    if (!isInScope(text)) {
      const empName = data.name || '当前员工';
      const scopeDesc = [data.domain, data.dept, data.role].filter(Boolean).join('、') || '已配置职责范围';
      setTimeout(() => {
        setChatMsgs(prev => [...prev, {
          role: 'ai',
          content: `您好，您的指令「${text.slice(0, 20)}${text.length > 20 ? '…' : ''}」超出了「${empName}」的职责范围。\n\n我的服务范围：${scopeDesc}。\n\n如需处理此类事项，建议联系对应的专职员工或人工团队。`,
        }]);
        setChatLoading(false);
      }, 600);
      return;
    }

    const taskId = Date.now();
    const getTs = () => new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const taskTime = getTs();

    // 根据业务域生成真实任务配置
    const domain = data.domain || '';
    const isLaw     = /法务/.test(domain);
    const isHR      = /人力/.test(domain);
    const isFinance  = /财务/.test(domain);
    const isTech    = /技术/.test(domain);
    const isCS      = /客服/.test(domain);
    const isPipe    = /管道|安全/.test(domain);

    type LogKind = 'ok' | 'warn' | 'data' | 'info';
    interface DomainTaskConfig {
      planDesc: string; execDesc: string;
      planLogs: Array<{ text: string; kind: LogKind }>;
      execLogs: Array<{ text: string; kind: LogKind }>;
      verifyLogs: Array<{ text: string; kind: LogKind }>;
      steps: Array<{ name: string; desc: string }>;
      advanceLogs: [string, string, string];
      aiReply: string;
    }

    const taskConfig: DomainTaskConfig = isLaw ? {
      planDesc: '解析合同文本，制定审查清单与风险检测策略',
      execDesc: '调用 PDF 解析引擎提取条款，匹配合规规则库',
      planLogs: [
        { text: '提取任务关键词：合同审查 / 风险识别 / 条款分析', kind: 'data' },
        { text: '加载法务合规规则库 v3.2.1', kind: 'info' },
        { text: '执行计划生成完毕，共 4 个子步骤', kind: 'ok' },
      ],
      execLogs: [
        { text: 'PDF 解析引擎启动，提取全文结构...', kind: 'info' },
        { text: '共识别 23 个条款段落，12,340 字', kind: 'data' },
        { text: '命中合规规则 47 条，完成条款交叉映射', kind: 'data' },
        { text: '识别到 2 处高风险条款：违约责任上限 / 单方解约权', kind: 'warn' },
        { text: '风险等级标注完成，结构化审查报告已生成', kind: 'ok' },
      ],
      verifyLogs: [
        { text: '法律条文引用校验通过（民法典第 502 条）', kind: 'ok' },
        { text: '风险等级评定符合内部法务标准', kind: 'ok' },
      ],
      steps: [
        { name: '文档解析', desc: '调用 PDF 解析引擎提取全文结构与条款段落' },
        { name: '合规规则匹配', desc: '逐条检索法律法规库，完成条款交叉映射' },
        { name: '风险识别', desc: 'AI 分析高风险语义模式，标注异常条款' },
        { name: '报告生成', desc: '生成结构化审查报告，推送至飞书文档' },
      ],
      advanceLogs: ['✓ 文档解析完成，提取 23 个条款段落', '✓ 合规规则匹配完成，发现 2 处高风险', '✓ 审查报告已生成，含风险标注与修改建议'],
      aiReply: `合同审查完成，发现以下风险：\n\n**高风险（2项）**\n• 第8条「违约责任上限」：赔偿上限过低，建议参考合同总金额的 30%\n• 第12条「单方解约权」：乙方可无条件解约，建议增加限制条件\n\n报告已推送至飞书文档，请法务负责人确认后签署。`,
    } : isHR ? {
      planDesc: '解析岗位需求，制定简历筛选与候选人评估策略',
      execDesc: '调用简历解析模型，匹配岗位要求，生成候选人评分',
      planLogs: [
        { text: '提取任务关键词：简历筛选 / 岗位匹配 / 候选人评估', kind: 'data' },
        { text: '加载岗位 JD 与历史录用数据模型', kind: 'info' },
        { text: '执行计划生成完毕，共 4 个子步���', kind: 'ok' },
      ],
      execLogs: [
        { text: '解析本批次简历，共 38 份...', kind: 'info' },
        { text: '提取候选人技能标签：Python / 数据分析 / 3年以上经验', kind: 'data' },
        { text: '与岗位 JD 匹配打分，TOP5 候选人已筛出', kind: 'ok' },
        { text: '匹配度最高：候选人张**（92分）/ 李**（88分）', kind: 'data' },
      ],
      verifyLogs: [
        { text: '筛选结果符合岗位要求，无明显异常项', kind: 'ok' },
        { text: '已去除重复投递候选人 3 名', kind: 'info' },
      ],
      steps: [
        { name: '简历解析', desc: '批量解析简历文件，提取结构化信息' },
        { name: '岗位匹配', desc: '与 JD 要求交叉比对，生成匹配评分' },
        { name: '候选人排序', desc: '综合打分排序，筛出 TOP 候选名单' },
        { name: '面试通知', desc: '自动发送面试邀请并协调飞书日历时间' },
      ],
      advanceLogs: ['✓ 简历解析完成，共处理 38 份', '✓ 岗位匹配完成，TOP5 候选人已筛出', '✓ 面试邀请已生成，等待确认后发送'],
      aiReply: `简历筛选完成，共处理 38 份，推荐以下候选人：\n\n**TOP 候选人**\n• 张**（92分）：5年数据分析经验，Python/SQL 熟练\n• 李**（88分）：3年相关经验，有大厂背景\n• 王**（85分）：应届硕士，项目经验丰富\n\n面试邀请草稿已生成，确认后可一键发送并同步飞书日历。`,
    } : isFinance ? {
      planDesc: '拉取业务数据，制定财务报表分析与异常检测策略',
      execDesc: '连接 ERP 数据源，执行多维度财务指标计算与异常检测',
      planLogs: [
        { text: '提取任务关键词：财务报表 / 数据分析 / 异常预警', kind: 'data' },
        { text: '连接企业 ERP 数据源，验证权限...', kind: 'info' },
        { text: '执行计划生成完毕，共 4 个子步骤', kind: 'ok' },
      ],
      execLogs: [
        { text: '拉取本月业务数据，共 12 个业务线...', kind: 'info' },
        { text: '营收同比增长 18.3%，环比增长 5.1%', kind: 'data' },
        { text: '⚠️ 异常检测：研发成本超预算 23%', kind: 'warn' },
        { text: '毛利率 42.1%，同比下降 2.3 个百分点', kind: 'data' },
        { text: '财务分析报告生成完毕', kind: 'ok' },
      ],
      verifyLogs: [
        { text: '数据口径与上期保持一致，无异常', kind: 'ok' },
        { text: '⚠️ 预算超支项已标注，需人工复核确认', kind: 'warn' },
      ],
      steps: [
        { name: '数据拉取', desc: '从 ERP / 数据仓库同步最新财务数据' },
        { name: '指标计算', desc: '计算营收、成本、利润等核心财务指标' },
        { name: '异常检测', desc: 'AI 识别预算偏差与异常波动项' },
        { name: '报告生成', desc: '生成图文报告并推送至钉钉 / 飞书' },
      ],
      advanceLogs: ['✓ 数据拉取完成，12 个业务线已同步', '✓ 指标计算完成，发现 1 项预算异常', '✓ 财务分析报告已生成，含异常预警标注'],
      aiReply: `本月财务报表分析完成：\n\n**核心指标**\n• 营收：¥3,842万（同比+18.3%，环比+5.1%）\n• 毛利率：42.1%（同比↓2.3pp）\n\n**⚠️ 异常预警**：研发成本超预算 23%，建议控制本月新增采购\n\n报告已推送至财务负责人飞书，超预算项已触发审批流程。`,
    } : isTech ? {
      planDesc: '获取代码变更内容，制定审查规则与安全扫描策略',
      execDesc: '调用静态分析引擎，执行代码质量与安全漏洞扫描',
      planLogs: [
        { text: '提取任务关键词：代码审查 / 安全扫描 / PR 分析', kind: 'data' },
        { text: '拉取 GitLab PR #1024 变更文件列表...', kind: 'info' },
        { text: '执行计划生成完毕，共 4 个子步骤', kind: 'ok' },
      ],
      execLogs: [
        { text: '解析 PR 差异：8 个文件，+342/-87 行', kind: 'data' },
        { text: '执行静态代码分析...', kind: 'info' },
        { text: '⚠️ 发现潜在 SQL 注入风险：auth/login.py L89', kind: 'warn' },
        { text: '代码规范：3 处命名不规范，2 处注释缺失', kind: 'data' },
        { text: '安全扫描完成，审查建议已生成', kind: 'ok' },
      ],
      verifyLogs: [
        { text: 'SQL 注入风险已确认，严重等级：高', kind: 'warn' },
        { text: '审查建议格式符合团队规范', kind: 'ok' },
      ],
      steps: [
        { name: '代码获取', desc: '拉取 GitLab/GitHub PR 变更文件内容' },
        { name: '静态分析', desc: '执行代码质量与规范性检查' },
        { name: '安全扫描', desc: 'AI 识别 SQL 注入、XSS 等安全漏洞' },
        { name: '评论写入', desc: '将审查建议以评论形式写回 PR' },
      ],
      advanceLogs: ['✓ PR 代码获取完成，8 个文件已解析', '✓ 静态分析完成，发现 1 个高风险安全问题', '✓ 审查评论已写入 PR，等待开发者响应'],
      aiReply: `PR #1024 代码审查完成：\n\n**安全问题（高优先级）**\n• ⚠️ auth/login.py L89：SQL 注入风险，建议使用参数化查询\n\n**代码规范**\n• 3 处变量命名不符合 snake_case 规范\n• utils/helper.py 缺少函数注释\n\n审查评论已写入 PR，请开发者优先修复 SQL 注入问题后重新提交。`,
    } : isCS ? {
      planDesc: '识别用户意图，匹配知识库解决方案，制定服务策略',
      execDesc: '多轮对话意图理解，检索产品知识库，生成回复方案',
      planLogs: [
        { text: '提取任务关键词：客户服务 / 意图识别 / 问题解决', kind: 'data' },
        { text: '加载产品知识库（FAQ v2.3，共 1,240 条）', kind: 'info' },
        { text: '执行计划生成完毕，共 4 个子步骤', kind: 'ok' },
      ],
      execLogs: [
        { text: '用户意图识别：产品功能咨询', kind: 'data' },
        { text: '检索知识库，命中相关条目 3 条', kind: 'info' },
        { text: '生成回复方案，置信度 94%', kind: 'ok' },
        { text: '创建服务工单 #TK-20240315-001', kind: 'data' },
      ],
      verifyLogs: [
        { text: '回复内容符合服务话术规范', kind: 'ok' },
        { text: '工单信息完整，已关联用户账号', kind: 'ok' },
      ],
      steps: [
        { name: '意图识别', desc: '多轮理解用户问题，提取核心诉求' },
        { name: '知识库检索', desc: '匹配 FAQ 与产品手册，生成解决方案' },
        { name: '回复生成', desc: '按服务话术规范生成结构化回复' },
        { name: '工单创建', desc: '自动创建服务工单并推送至责任团队' },
      ],
      advanceLogs: ['✓ 意图识别完成：产品功能咨询', '✓ 知识库检索命中 3 条相关内容', '✓ 回复方案已生成，工单 #TK-001 已创建'],
      aiReply: `客户问题已处理：\n\n**问题类型**：产品功能咨询\n**解决方案**：已提供操作指引，附帮助文档链接\n\n**工单**：#TK-20240315-001（已解决，等待用户确认）\n满意度回访将在 24h 后自动触发。`,
    } : isPipe ? {
      planDesc: '接收多源告警信号，制定预警研判与巡检处置策略',
      execDesc: '整合光纤预警、机器视觉、无人机数据，执行异常综合研判',
      planLogs: [
        { text: '提取任务关键词：管道巡检 / 预警研判 / 工单派发', kind: 'data' },
        { text: '接入光纤预警、机器视觉平台、无人机数据流', kind: 'info' },
        { text: '执行计划生成完毕，共 4 个子步骤', kind: 'ok' },
      ],
      execLogs: [
        { text: '光纤预警：桩号 K125+300 振动异常，持续 4.2s', kind: 'warn' },
        { text: '机器视觉：对应位置图像分析中...', kind: 'info' },
        { text: '图像确认：施工车辆进入管道保护区', kind: 'warn' },
        { text: '无人机数据：管道外观未见明显损伤', kind: 'data' },
        { text: '综合研判：二级预警，需派员现场确认', kind: 'ok' },
      ],
      verifyLogs: [
        { text: '预警等级研判：二级（较高风险），触发人工复核', kind: 'warn' },
        { text: '工单信息完整，责任班组已匹配', kind: 'ok' },
      ],
      steps: [
        { name: '告警接收', desc: '汇聚光纤预警、机器视觉、无人机多源数据' },
        { name: '预警研判', desc: 'AI 综合研判告警等级与风险类型' },
        { name: '工单派发', desc: '生成巡检工单，自动派发给就近班组' },
        { name: '闭环跟踪', desc: '实时跟踪处置进度，确认隐患消除' },
      ],
      advanceLogs: ['✓ 多源告警数据接收完成，发现 1 处异常', '✓ 预警研判完成：二级预警，施工车辆侵入保护区', '✓ 巡检工单 #WO-0315-042 已派发至管道班组'],
      aiReply: `管道巡检预警已处理：\n\n**预警信息**\n• 位置：K125+300\n• 类型：第三方施工侵入保护区\n• 等级：⚠️ 二级预警\n\n**已执行**：工单 #WO-0315-042 已派发，班组预计 20 分钟到达，实时监控已开启。\n\n请确认处置情况后完成工单闭环。`,
    } : {
      planDesc: '采集运营数据，制定报告生成与推送策略',
      execDesc: '聚合多维运营指标，AI 生成可视化分析报告',
      planLogs: [
        { text: '提取任务关键词：运营数据 / 报告生成 / 指标分析', kind: 'data' },
        { text: '连接数据仓库，加载运营指标模型', kind: 'info' },
        { text: '执行计划生成完毕，共 4 个子步骤', kind: 'ok' },
      ],
      execLogs: [
        { text: '拉取本周运营核心指标...', kind: 'info' },
        { text: 'DAU: 12.4万（环比+8.2%），留存率 62%', kind: 'data' },
        { text: '转化率：3.7%（较上周+0.5pp）', kind: 'data' },
        { text: '运营周报生成完毕', kind: 'ok' },
      ],
      verifyLogs: [
        { text: '数据与数据仓库一致，无异常', kind: 'ok' },
        { text: '报告格式符合运营规范', kind: 'ok' },
      ],
      steps: [
        { name: '数据采集', desc: '从数据仓库同步 DAU、转化率等核心指标' },
        { name: '指标汇总', desc: '多维度聚合，计算同比环比变化' },
        { name: '趋势分析', desc: 'AI 识别异常波动与增长机会' },
        { name: '报告推送', desc: '生成周报并推送至钉钉 / 飞书群' },
      ],
      advanceLogs: ['✓ 数据采集完成，覆盖 8 个核心指标', '✓ 指标汇总完成，转化率明显提升', '✓ 运营周报已生成，等待确认后推送'],
      aiReply: `本周运营数据分析完成：\n\n**核心指标**\n• DAU：12.4万（环比+8.2%）✅\n• 留存率：62%（持平）\n• 转化率：3.7%（+0.5pp）✅\n\n转化率连续 3 周提升，与上周活动推送相关。\n运营周报已就绪，确认后一键推送至运营群。`,
    };

    // 业务流程管道节点
    const pipeStages: DebugPipeStage[] = [
      { id: 'recv', label: '接收任务', icon: '📥', desc: '员工接收用户指令，解析意图',
        logs: [
          { text: `[用户] 下达任务：「${text.slice(0, 30)}${text.length > 30 ? '…' : ''}」`, kind: 'info' },
          { text: `员工「${data.name || '数字员工'}」已接单，初始化任务上下文`, kind: 'ok' },
          { text: `任务 ID: TASK-${taskId.toString().slice(-6)} 已创建`, kind: 'data' },
        ],
      },
      { id: 'plan', label: '规划拆解', icon: '🧠', desc: taskConfig.planDesc,
        logs: taskConfig.planLogs,
      },
      { id: 'exec', label: '执行处理', icon: '⚙️', desc: taskConfig.execDesc,
        logs: taskConfig.execLogs,
      },
      { id: 'verify', label: '结果验证', icon: '✅', desc: '校验执行结果，确认符合业务逻辑',
        logs: taskConfig.verifyLogs,
      },
      { id: 'human', label: '人工复核', icon: '👤', type: 'human' as const, desc: '等待人工确认执行结果，确认后继续推进',
        logs: [
          { text: '⚠️ 执行结果已就绪，等待人工复核', kind: 'warn' },
          { text: '已暂停自动推进，等待用户确认或澄清', kind: 'info' },
        ],
      },
      { id: 'reply', label: '反馈输出', icon: '💬', desc: '将执行结果反馈给用户',
        logs: [
          { text: '生成结构化回复内容', kind: 'info' },
          { text: '任务执行完成，结果已推送', kind: 'ok' },
        ],
      },
    ];

    // 业务域步骤时间线
    const initSteps: DebugTaskStep[] = taskConfig.steps.map((s, i) => ({
      id: `s${i + 1}`, name: s.name, desc: s.desc,
      status: (i === 0 ? 'running' : 'waiting') as 'running' | 'waiting',
      time: i === 0 ? taskTime : undefined,
    }));

    const newTask: DebugTask = {
      id: taskId, title: text.length > 24 ? text.slice(0, 24) + '…' : text,
      content: text, time: taskTime, status: 'running',
      pipeStages, doneCount: 0,
      steps: initSteps,
      logs: [{ text: `[${taskTime}] 任务已接收，开始处理...`, kind: 'info', ts: taskTime }],
      expanded: true,
      aiReply: taskConfig.aiReply,
    };
    setTasks(prev => [...prev, newTask]);

    // 逐步推进管道和步骤（每阶段间隔）
    const advance = (delay: number, doneCount: number, stepIdx: number, extraLog: string, logKind: string, stepUpdates?: Partial<DebugTaskStep>[]) => {
      setTimeout(() => {
        setTasks(prev => prev.map(t => {
          if (t.id !== taskId) return t;
          const ts = getTs();
          const newSteps = t.steps.map((s, i) => {
            if (stepUpdates && stepUpdates[i]) return { ...s, ...stepUpdates[i], time: stepUpdates[i].status === 'running' || stepUpdates[i].status === 'done' ? ts : s.time };
            return s;
          });
          return {
            ...t, doneCount,
            steps: newSteps,
            logs: [...t.logs, { text: extraLog, kind: logKind, ts }],
          };
        }));
      }, delay);
    };

    advance(250, 1, 0, taskConfig.advanceLogs[0], 'ok',
      [{ status: 'done' }, { status: 'running' }, { status: 'waiting' }, { status: 'waiting' }]);
    advance(550, 2, 1, taskConfig.advanceLogs[1], 'data',
      [{ status: 'done' }, { status: 'done' }, { status: 'running' }, { status: 'waiting' }]);
    advance(900, 3, 2, taskConfig.advanceLogs[2], 'ok',
      [{ status: 'done' }, { status: 'done' }, { status: 'done' }, { status: 'running' }]);

    // 到达人工复核节点：停住，等待用户操作
    setTimeout(() => {
      const ts = getTs();
      setTasks(prev => prev.map(t => t.id !== taskId ? t : {
        ...t,
        status: 'human_pending',
        doneCount: 4, // verify 完成，停在 human 节点
        steps: t.steps.map(s => ({ ...s, status: 'done' as const, time: s.time || ts })),
        logs: [...t.logs,
          { text: '⚠️ 执行结果已就绪，等待人工复核确认', kind: 'warn', ts },
          { text: '● 任务已暂停，请在左侧点击「确认通过」或发送澄清意见', kind: 'info', ts },
        ],
        humanOk: false,
        clarifyMode: false,
        clarifyInput: '',
      }));
      setChatLoading(false);
    }, 1000);
  };

  // 人工确认通过或澄清后继续执行
  const handleHumanApprove = (taskId: number, clarifyText?: string) => {
    const ts = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      // 用任务预设的业务回复，若有澄清意见则追加
      const replyText = t.aiReply || `收到确认！「${t.title}」任务已完成。`;
      setChatMsgs(prev => [...prev, {
        role: 'ai',
        content: clarifyText ? `收到澄清意见：「${clarifyText}」\n\n${replyText}` : replyText,
      }]);
      return {
        ...t, status: 'done' as const, doneCount: t.pipeStages.length,
        humanOk: true, clarifyMode: false, clarifyInput: '',
        logs: [...t.logs,
          ...(clarifyText ? [{ text: `💬 澄清意见：「${clarifyText}」已记录`, kind: 'data', ts }] : []),
          { text: '✅ 人工复核通过，继续执行', kind: 'ok', ts },
          { text: '✓ 任务执行完成，结果已反馈给用户', kind: 'ok', ts },
        ],
      };
    }));
  };
  // 自动保存
  useEffect(() => {
    setAutoSaved(false);
    const t = setTimeout(() => setAutoSaved(true), 800);
    return () => clearTimeout(t);
  }, [data]);

  const avatarBg   = data.name.trim() ? getAvatarColor(data.name.trim()) : '#e2e8f0';
  const avatarChar = data.name.trim() ? data.name.trim().charAt(0) : '?';

  const enabledKbs       = KNOWLEDGE_BASES.filter(kb => data.kbEnabled[kb.id]);
  const enabledSkills    = SKILL_LIST.filter(sk => data.skillEnabled[sk.id]);
  const enabledMcps      = MCP_SERVERS.filter(m => data.mcpEnabled[m.id]);
  const selectedChannels = CHANNELS.filter(ch => data.channels.includes(ch.id));
  const selectedModel    = MODEL_OPTIONS.find(m => m.id === data.model);
  const configItems = [
    { label: '员工身份', ok: !!data.name && !!data.dept, text: data.name ? `${data.name} · ${data.dept}` : '未配置' },
    { label: 'AI 模型',  ok: !!data.model, text: selectedModel?.name || '未选择' },
    { label: '提示词',   ok: data.prompt.length > 30, text: data.prompt.length > 30 ? `已配置（${data.prompt.length} 字符）` : '内容过少' },
    { label: '知识库',   ok: true, text: enabledKbs.length > 0 ? enabledKbs.map(kb => kb.name).join('、') : '未绑定' },
    { label: '接入渠道', ok: selectedChannels.length > 0, text: selectedChannels.length > 0 ? selectedChannels.map(c => c.label).join('、') : '未选择' },
  ];
  const allOk = configItems.every(i => i.ok);

  // ── 全页布局 ──
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#f5f6fa', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* 顶部栏 */}
      <div style={{ height: 56, background: '#fff', borderBottom: '1px solid #e8e8f0', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, flexShrink: 0, boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
        {/* 左：返回 + 标题 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div onClick={onBack ?? onClose} style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#666', fontSize: 16, transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f5f5f5'}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
          >
            ←
          </div>
          <div style={{ width: 1, height: 18, background: '#e8e8e8' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 700 }}>{avatarChar}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.2 }}>{data.name || (isEdit ? '编辑数字员工' : '新建数字员工')}</div>
              <div style={{ fontSize: 11, color: '#aaa', lineHeight: 1.2 }}>{data.dept || '未选择部门'}</div>
            </div>
          </div>
          {readOnly && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 6, background: '#fff7ed', border: '1px solid #fed7aa' }}>
              <EyeOutlined style={{ color: '#ea580c', fontSize: 12 }} />
              <span style={{ fontSize: 12, color: '#ea580c', fontWeight: 500 }}>只读 · {readOnlyVersion}</span>
            </div>
          )}
        </div>

        {/* 右：自动保存 + 历史版本 + 上岗 */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {!readOnly && autoSaved && (
            <span style={{ fontSize: 11, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircleOutlined style={{ fontSize: 11 }} /> 已自动保存
            </span>
          )}
          {(isEdit || readOnly) && (
            <Tooltip title="历史版本">
              <Button icon={<HistoryOutlined />} onClick={() => setHistoryOpen(true)} style={{ borderRadius: 8 }} />
            </Tooltip>
          )}
          {!readOnly && (
            <Button type="primary" icon={<TagOutlined />}
              style={{ background: '#6366F1', borderColor: '#6366F1', borderRadius: 8, fontWeight: 600 }}
              onClick={() => setEmpPublishOpen(true)}>
              备岗
            </Button>
          )}
        </div>
      </div>

      {/* 历史版本浏览 Banner（图4风格） */}
      {readOnly && readOnlyVersion && (
        <VersionViewBanner
          version={readOnlyVersion}
          publishedAt={readOnlyPublishedAt}
          publishedBy={readOnlyPublishedBy}
          onClose={onClose}
        />
      )}

      {/* 主体：左配置 + 右预览 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* 左：配置面板（AI能力 + 部署配置，一页完成） */}
        <div style={{ width: '55%', display: 'flex', flexDirection: 'column', borderRight: '1px solid #e8e8f0', background: '#fff', overflow: 'hidden' }}>
          {/* 只读模式遮罩：阻止左侧配置区所有交互 */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', position: 'relative' }}>
            {readOnly && (
              <div style={{ position: 'absolute', inset: 0, zIndex: 10, cursor: 'not-allowed' }} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* ── AI 模型 ── */}
              <div>
                <SectionTitle title="AI 模型" desc="选择驱动该员工的大语言模型" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {MODEL_OPTIONS.map(m => (
                    <div key={m.id} onClick={() => update({ model: m.id })} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s', border: data.model === m.id ? `1.5px solid ${m.color}` : '1px solid #e8e8e8', background: data.model === m.id ? `${m.color}08` : '#fafafa' }}>
                      <span style={{ fontSize: 20 }}>{m.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: data.model === m.id ? m.color : '#1a1a1a' }}>{m.name}</span>
                          <Tag style={{ fontSize: 10, margin: 0, color: m.color, borderColor: `${m.color}40`, background: `${m.color}10`, borderRadius: 4 }}>{m.tag}</Tag>
                        </div>
                        <div style={{ fontSize: 11, color: '#999' }}>{m.desc}</div>
                      </div>
                      {data.model === m.id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.color }} />}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── 核心文件 ── */}
              <div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>核心文件 <span style={{ color: '#ff4d4f', fontSize: 11 }}>*</span></span>
                  </div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>定义该员工的角色身份、行为规范与回复风格</div>
                </div>
                <PromptFilesEditor
                  initialPrompt={data.prompt}
                  onChange={prompt => update({ prompt })}
                />
              </div>

              {/* ── 知识库 ── */}
              <PickerSection
                title="知识库"
                desc="员工将优先检索知识库内容后再回答"
                modalTitle="添加知识库"
                items={KNOWLEDGE_BASES.map(kb => ({ id: kb.id, icon: kb.icon, name: kb.name, desc: kb.desc }))}
                selectedIds={Object.keys(data.kbEnabled).filter(id => data.kbEnabled[id])}
                onAdd={id => update({ kbEnabled: { ...data.kbEnabled, [id]: true } })}
                onRemove={id => update({ kbEnabled: { ...data.kbEnabled, [id]: false } })}
                accentColor="#6366F1"
                linkText="＋ 去万卷新建知识库"
                onLink={() => { window.open('/#knowledge-base', '_blank'); }}
              />

              {/* ── 技能 ── */}
              <PickerSection
                title="技能"
                desc="选择该员工可调用的 Skills / 工作流"
                modalTitle="添加技能 / 工作流"
                items={SKILL_LIST.map(sk => ({
                  id: sk.id, icon: sk.icon, name: sk.name, desc: sk.desc,
                  tag: sk.type,
                  tagColor:  sk.type === 'Office' ? '#0EA5E9' : sk.type === 'Skill' ? '#6366F1' : '#10B981',
                  tagBg:     sk.type === 'Office' ? '#f0f9ff' : sk.type === 'Skill' ? '#eef2ff'  : '#f0fdf4',
                  tagBorder: sk.type === 'Office' ? '#bae6fd' : sk.type === 'Skill' ? '#c7d2fe'  : '#a7f3d0',
                }))}
                selectedIds={Object.keys(data.skillEnabled).filter(id => data.skillEnabled[id])}
                onAdd={id => update({ skillEnabled: { ...data.skillEnabled, [id]: true } })}
                onRemove={id => update({ skillEnabled: { ...data.skillEnabled, [id]: false } })}
                accentColor="#6366F1"
                linkText="＋ 去万卷新建技能"
                onLink={() => { window.open('/#skill-center', '_blank'); }}
              />

              {/* ── MCP Server ── */}
              <PickerSection
                title="MCP Server"
                desc="绑定后员工可直接读写企业内部系统数据"
                modalTitle="添加 MCP Server"
                items={MCP_SERVERS.map(m => ({ id: m.id, icon: m.icon, name: m.name, desc: m.desc }))}
                selectedIds={Object.keys(data.mcpEnabled).filter(id => data.mcpEnabled[id])}
                onAdd={id => update({ mcpEnabled: { ...data.mcpEnabled, [id]: true } })}
                onRemove={id => update({ mcpEnabled: { ...data.mcpEnabled, [id]: false } })}
                accentColor="#10B981"
                linkText="＋ 去万卷新建 MCP Server"
                onLink={() => { window.open('/#mcp-server', '_blank'); }}
              />

              {/* ── 任务 ── */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>任务</div>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>展示对应任务的执行流程</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      onClick={() => {
                        const newTaskId = Date.now();
                        const newTask: DebugTask = {
                          id: newTaskId,
                          title: '新任务',
                          content: '请输入任务描述',
                          time: new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                          status: 'running',
                          pipeStages: [
                            { id: 'step1', label: '接收任务', icon: '📥', desc: '处理用户输入', logs: [{ text: '任务已创建，等待配置', kind: 'info' }] },
                          ],
                          doneCount: 0,
                          steps: [
                            { id: '1', name: '初始化', desc: '任务初始化中', status: 'waiting' },
                          ],
                          logs: [{ text: '新任务已创建', kind: 'info', ts: new Date().toISOString() }],
                          expanded: true,
                        };
                        setTasks(prev => [...prev, newTask]);
                        message.success('新任务已创建');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: '1px solid #6366F1',
                        background: '#EEF2FF',
                        color: '#6366F1',
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        userSelect: 'none',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLDivElement).style.background = '#DDD6FE';
                        (e.currentTarget as HTMLDivElement).style.borderColor = '#8B5CF6';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLDivElement).style.background = '#EEF2FF';
                        (e.currentTarget as HTMLDivElement).style.borderColor = '#6366F1';
                      }}
                    >
                      <PlusOutlined style={{ fontSize: 11 }} />
                    </div>
                    {tasks.length > 0 && (
                      <span onClick={() => setTasks([])} style={{ fontSize: 11, color: '#bbb', cursor: 'pointer', userSelect: 'none' }}>清空</span>
                    )}
                  </div>
                </div>
                {tasks.length === 0 ? (
                  <div style={{ padding: '20px 0', textAlign: 'center', color: '#d1d5db', fontSize: 12, border: '1px dashed #e8e8e8', borderRadius: 8 }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>📋</div>
                    在右侧调试区发送任务后将在此展示
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {tasks.slice().reverse().map((task, ridx) => {
                      const taskNo = tasks.length - ridx;
                      return (
                        <div key={task.id} style={{ borderRadius: 10, border: '1px solid #e8e8f0', background: '#fff', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                          {/* 任务头部 */}
                          <div
                            onClick={() => setTasks(prev => prev.map(t => t.id === task.id ? { ...t, expanded: !t.expanded } : t))}
                            style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #f0f0f0', background: '#fafafa', cursor: 'pointer' }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                任务 #{taskNo}：{task.title}
                              </div>
                              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{task.time}</div>
                            </div>
                            <span style={{ fontSize: 10, color: '#bbb' }}>{task.expanded ? '▲' : '▼'}</span>
                          </div>

                          {task.expanded && (() => {
                            const STAGE_GRADIENTS = [
                              'linear-gradient(135deg,#6366F1,#8B5CF6)',
                              'linear-gradient(135deg,#3B82F6,#06B6D4)',
                              'linear-gradient(135deg,#10B981,#34d399)',
                              'linear-gradient(135deg,#F59E0B,#FBBF24)',
                              'linear-gradient(135deg,#8B5CF6,#EC4899)',
                              'linear-gradient(135deg,#EF4444,#F87171)',
                            ];
                            const stages = getTaskStages(task);
                            const jsonText = getTaskJson(task);
                            const viewMode = taskStepView[task.id] ?? 'form';
                            return (
                              <div style={{ padding: '16px 18px 16px' }}>

                                {/* ── 执行流程 ── */}
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <span>⚡</span> 执行流程
                                </div>
                                <div style={{ display: 'flex', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 10, gap: 0 }}>
                                  {stages.map((stage, idx) => {
                                    const isHuman = stage.type === 'human';
                                    const bg = isHuman ? 'linear-gradient(135deg,#8B5CF6,#EC4899)' : STAGE_GRADIENTS[idx % STAGE_GRADIENTS.length];
                                    return (
                                      <React.Fragment key={stage.id}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 72 }}>
                                          <div style={{ width: 52, height: 52, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, boxShadow: '0 3px 10px rgba(99,102,241,0.22)' }}>
                                            {stage.icon}
                                          </div>
                                          <div style={{ fontSize: 11, color: '#4338CA', marginTop: 6, fontWeight: 500, textAlign: 'center', lineHeight: 1.3, width: 68 }}>{stage.label}</div>
                                          {isHuman && <div style={{ fontSize: 9, color: '#8B5CF6', marginTop: 2 }}>人工</div>}
                                        </div>
                                        {idx < stages.length - 1 && (
                                          <div style={{ flex: 1, minWidth: 10, height: 2.5, background: 'linear-gradient(90deg,#c7d2fe,#ddd6fe)', marginTop: 24, flexShrink: 0 }} />
                                        )}
                                      </React.Fragment>
                                    );
                                  })}
                                </div>

                                {/* ── 任务步骤 ── */}
                                <div style={{ marginTop: 16 }}>
                                  {/* Header */}
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>任务步骤</span>
                                      <span style={{ fontSize: 11, color: '#9ca3af' }}>与上方流程图一一对应</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <button
                                        onClick={() => {
                                          const newStage: DebugPipeStage = {
                                            id: `s${Date.now()}`, label: '新步骤', icon: '⚙️', type: 'auto',
                                            desc: '请填写步骤描述', logs: [],
                                          };
                                          const updated = [...stages, newStage];
                                          setTaskStageEdits(prev => ({ ...prev, [task.id]: updated }));
                                          setEditingStageKey(`${task.id}-${newStage.id}`);
                                          setTaskStepView(prev => ({ ...prev, [task.id]: 'form' }));
                                        }}
                                        style={{ fontSize: 12, padding: '4px 12px', borderRadius: 6, border: '1px solid #c7d2fe', background: '#f5f3ff', color: '#6366F1', cursor: 'pointer', fontWeight: 500 }}
                                      >＋ 添加步骤</button>
                                      {/* 表单 / JSON toggle */}
                                      <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 7, padding: 3, border: '1px solid #e5e7eb' }}>
                                        {(['表单', 'JSON'] as const).map(v => {
                                          const k = v === '表单' ? 'form' : 'json';
                                          const active = viewMode === k;
                                          return (
                                            <div key={v}
                                              onClick={() => setTaskStepView(prev => ({ ...prev, [task.id]: k }))}
                                              style={{ padding: '3px 14px', borderRadius: 5, fontSize: 12, cursor: 'pointer', fontWeight: active ? 600 : 400, color: active ? '#111' : '#6b7280', background: active ? '#fff' : 'transparent', boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.12s' }}
                                            >{v}</div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>

                                  {/* ── JSON 编辑器（与 PromptFilesEditor 交互一致） ── */}
                                  {viewMode === 'json' ? (
                                    <div style={{ border: '1px solid #e8e8e8', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                                      {/* 路径栏 + 操作按钮 */}
                                      <div style={{ padding: '7px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 6, background: '#fff', flexShrink: 0 }}>
                                        <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace', flex: 1 }}>stages.json</span>
                                        <button
                                          onClick={() => setTaskJsonModal({ taskId: task.id, content: jsonText, preview: false })}
                                          style={{ padding: '3px 9px', borderRadius: 5, border: '1px solid #e8e8e8', background: '#fff', color: '#6B7280', fontSize: 11, cursor: 'pointer' }}
                                        >预览</button>
                                        <button
                                          onClick={() => setTaskJsonEdits(prev => { const n = { ...prev }; delete n[task.id]; return n; })}
                                          style={{ padding: '3px 9px', borderRadius: 5, border: '1px solid #e8e8e8', background: '#fff', color: '#6B7280', fontSize: 11, cursor: 'pointer' }}
                                        >重置</button>
                                      </div>
                                      {/* Content 标签 */}
                                      <div style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, color: '#6B7280', background: '#f9fafb', borderBottom: '1px solid #f0f0f0' }}>Content</div>
                                      {/* 编辑区 */}
                                      <textarea
                                        value={jsonText}
                                        onChange={e => setTaskJsonEdits(prev => ({ ...prev, [task.id]: e.target.value }))}
                                        style={{ width: '100%', height: 200, border: 'none', outline: 'none', padding: '10px 14px', fontSize: 12, fontFamily: 'monospace', lineHeight: 1.75, resize: 'none', color: '#374151', background: '#fff', boxSizing: 'border-box' }}
                                      />
                                    </div>
                                  ) : (
                                    /* ── 表单视图（可编辑 + 拖拽排序） ── */
                                    <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, overflow: 'hidden' }}>
                                      {stages.map((stage, idx) => {
                                        const eKey = `${task.id}-${stage.id}`;
                                        const isEditing = editingStageKey === eKey;
                                        const isDragging = taskStageDrag?.taskId === task.id && taskStageDrag.fromIdx === idx;
                                        const bg = stage.type === 'human' ? 'linear-gradient(135deg,#8B5CF6,#EC4899)' : STAGE_GRADIENTS[idx % STAGE_GRADIENTS.length];
                                        return (
                                          <div
                                            key={stage.id}
                                            draggable
                                            onDragStart={() => setTaskStageDrag({ taskId: task.id, fromIdx: idx })}
                                            onDragOver={e => e.preventDefault()}
                                            onDrop={() => {
                                              if (!taskStageDrag || taskStageDrag.taskId !== task.id || taskStageDrag.fromIdx === idx) return;
                                              const arr = [...stages];
                                              const [moved] = arr.splice(taskStageDrag.fromIdx, 1);
                                              arr.splice(idx, 0, moved);
                                              setTaskStageEdits(prev => ({ ...prev, [task.id]: arr }));
                                              setTaskStageDrag(null);
                                            }}
                                            onDragEnd={() => setTaskStageDrag(null)}
                                            style={{ display: 'flex', alignItems: isEditing ? 'flex-start' : 'center', gap: 10, padding: '10px 14px', borderBottom: idx < stages.length - 1 ? '1px solid #f5f5f5' : 'none', background: isDragging ? '#f0f0ff' : '#fff', opacity: isDragging ? 0.5 : 1, transition: 'background 0.15s', cursor: 'grab' }}
                                          >
                                            {/* 拖拽手柄 */}
                                            <span style={{ fontSize: 16, color: '#d1d5db', flexShrink: 0, cursor: 'grab', userSelect: 'none', lineHeight: 1 }}>⠿</span>
                                            {/* 头像 */}
                                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{stage.icon}</div>
                                            {/* 内容 */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                              {isEditing ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                  <input
                                                    autoFocus
                                                    value={stage.label}
                                                    onChange={e => {
                                                      const arr = stages.map((s, i) => i === idx ? { ...s, label: e.target.value } : s);
                                                      setTaskStageEdits(prev => ({ ...prev, [task.id]: arr }));
                                                    }}
                                                    placeholder="步骤名称"
                                                    style={{ border: '1px solid #c7d2fe', borderRadius: 6, padding: '4px 8px', fontSize: 12, fontWeight: 500, outline: 'none', color: '#1a1a1a' }}
                                                  />
                                                  <input
                                                    value={stage.desc ?? ''}
                                                    onChange={e => {
                                                      const arr = stages.map((s, i) => i === idx ? { ...s, desc: e.target.value } : s);
                                                      setTaskStageEdits(prev => ({ ...prev, [task.id]: arr }));
                                                    }}
                                                    placeholder="步骤描述"
                                                    style={{ border: '1px solid #e8e8e8', borderRadius: 6, padding: '4px 8px', fontSize: 11, color: '#6b7280', outline: 'none' }}
                                                  />
                                                  <div style={{ display: 'flex', gap: 4 }}>
                                                    {(['auto', 'human'] as const).map(t => (
                                                      <div key={t}
                                                        onClick={() => {
                                                          const arr = stages.map((s, i) => i === idx ? { ...s, type: t } : s);
                                                          setTaskStageEdits(prev => ({ ...prev, [task.id]: arr }));
                                                        }}
                                                        style={{ padding: '2px 10px', borderRadius: 4, fontSize: 11, cursor: 'pointer', border: stage.type === t ? '1px solid #6366F1' : '1px solid #e8e8e8', background: stage.type === t ? '#eef2ff' : '#f9fafb', color: stage.type === t ? '#6366F1' : '#6b7280', fontWeight: stage.type === t ? 600 : 400 }}
                                                      >{t === 'auto' ? '自动' : '人工'}</div>
                                                    ))}
                                                  </div>
                                                </div>
                                              ) : (
                                                <>
                                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{stage.label}</span>
                                                    {stage.type === 'human' && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#f5f3ff', color: '#8B5CF6', border: '1px solid #ddd6fe', fontWeight: 500 }}>人工</span>}
                                                  </div>
                                                  {stage.desc && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{stage.desc}</div>}
                                                </>
                                              )}
                                            </div>
                                            {/* 操作区 */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                              <span
                                                onClick={() => setEditingStageKey(isEditing ? null : eKey)}
                                                style={{ fontSize: 13, color: isEditing ? '#6366F1' : '#d1d5db', cursor: 'pointer', padding: '2px 4px', borderRadius: 4, transition: 'color 0.12s' }}
                                                title={isEditing ? '完成' : '编辑'}
                                              >{isEditing ? '✓' : '✏'}</span>
                                              <span
                                                onClick={() => {
                                                  const arr = stages.filter((_, i) => i !== idx);
                                                  setTaskStageEdits(prev => ({ ...prev, [task.id]: arr }));
                                                  if (isEditing) setEditingStageKey(null);
                                                }}
                                                style={{ fontSize: 15, color: '#d1d5db', cursor: 'pointer', padding: '2px 4px', borderRadius: 4, lineHeight: 1, transition: 'color 0.12s' }}
                                                onMouseEnter={e => (e.currentTarget as HTMLSpanElement).style.color = '#ff4d4f'}
                                                onMouseLeave={e => (e.currentTarget as HTMLSpanElement).style.color = '#d1d5db'}
                                                title="删除"
                                              >×</span>
                                              <span style={{ fontSize: 11, color: '#d1d5db', minWidth: 22, textAlign: 'right' }}>#{idx + 1}</span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── 接入渠道 ── */}
              <div>
                <SectionTitle title="接入渠道" desc="本期支持 API / H5 / 飞书 三种接入方式，可多选" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { id: 'api',    label: 'REST API',  desc: '标准 HTTP 接口，支持外部系统程序化调用', icon: <ApiOutlined /> },
                    { id: 'h5',     label: 'H5 网页',   desc: '适配电脑/移动端，浏览器直接访问，无需安装', icon: <DesktopOutlined /> },
                    { id: 'feishu', label: '飞书机器人',  desc: '以飞书机器人形式在群组/会话中提供服务', icon: <span style={{ fontSize: 15 }}>🪶</span> },
                  ].map(ch => {
                    const selected = data.channels.includes(ch.id);
                    return (
                      <div key={ch.id}>
                        <div
                          onClick={() => update({ channels: selected ? data.channels.filter(c => c !== ch.id) : [...data.channels, ch.id] })}
                          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s', border: selected ? '1.5px solid #6366F1' : '1px solid #e8e8e8', background: selected ? '#f5f4ff' : '#fafafa' }}
                        >
                          <span style={{ fontSize: 16, color: selected ? '#6366F1' : '#bbb', display: 'flex', alignItems: 'center' }}>{ch.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 13, fontWeight: 500, color: selected ? '#6366F1' : '#333' }}>{ch.label}</span>
                              {ch.id === 'feishu' && (
                                <Tooltip title="查看飞书接入文档">
                                  <span
                                    onClick={e => { e.stopPropagation(); window.open('/#feishu-integration-docs', '_blank'); }}
                                    style={{ display: 'inline-flex', alignItems: 'center', color: '#9ca3af', cursor: 'pointer', fontSize: 13, lineHeight: 1, transition: 'color 0.15s' }}
                                    onMouseEnter={e => (e.currentTarget as HTMLSpanElement).style.color = '#6366F1'}
                                    onMouseLeave={e => (e.currentTarget as HTMLSpanElement).style.color = '#9ca3af'}
                                  >
                                    <FileTextOutlined />
                                  </span>
                                </Tooltip>
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{ch.desc}</div>
                          </div>
                          <div style={{ width: 16, height: 16, borderRadius: 3, border: selected ? 'none' : '1.5px solid #d1d5db', background: selected ? '#6366F1' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {selected && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>}
                          </div>
                        </div>

                        {/* 飞书接入：展开 APP ID / App Secret 填写区 */}
                        {ch.id === 'feishu' && selected && (
                          <div style={{ marginTop: 8, padding: '14px 16px', borderRadius: 8, border: '1px solid #e0deff', background: '#fafafe', display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ fontSize: 12, color: '#6366F1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                              <span>🪶</span> 飞书应用凭证配置
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                              <div>
                                <div style={{ fontSize: 12, color: '#555', fontWeight: 500, marginBottom: 6 }}>
                                  APP ID <span style={{ color: '#ff4d4f' }}>*</span>
                                </div>
                                <input
                                  value={data.feishuAppId}
                                  onChange={e => update({ feishuAppId: e.target.value })}
                                  placeholder="cli_xxxxxxxxxxxxxxxx"
                                  style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid #d1d5db', fontSize: 12, color: '#374151', outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box', background: '#fff', transition: 'border-color 0.15s' }}
                                  onFocus={e => (e.currentTarget as HTMLInputElement).style.borderColor = '#6366F1'}
                                  onBlur={e => (e.currentTarget as HTMLInputElement).style.borderColor = '#d1d5db'}
                                />
                              </div>
                              <div>
                                <div style={{ fontSize: 12, color: '#555', fontWeight: 500, marginBottom: 6 }}>
                                  App Secret <span style={{ color: '#ff4d4f' }}>*</span>
                                </div>
                                <input
                                  type="password"
                                  value={data.feishuAppSecret}
                                  onChange={e => update({ feishuAppSecret: e.target.value })}
                                  placeholder="输入 App Secret"
                                  style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid #d1d5db', fontSize: 12, color: '#374151', outline: 'none', boxSizing: 'border-box', background: '#fff', transition: 'border-color 0.15s' }}
                                  onFocus={e => (e.currentTarget as HTMLInputElement).style.borderColor = '#6366F1'}
                                  onBlur={e => (e.currentTarget as HTMLInputElement).style.borderColor = '#d1d5db'}
                                />
                              </div>
                            </div>
                            <div style={{ fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span>ℹ️</span> 在飞书开放平台创建应用后获取，凭证加密存储
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

          {/* 底部导航 */}
          <div style={{ padding: '14px 32px', borderTop: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', flexShrink: 0, background: '#fff' }}>
            <Button onClick={onBack ?? onClose}>{readOnly ? '关闭' : '上一步'}</Button>
          </div>
        </div>

        {/* 右：配置预览面板 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f7f8fc', overflow: 'hidden' }}>
          {/* 调试预览 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '8px 20px', borderBottom: '1px solid #f0f0f0', background: '#fafafa', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>配置预览</span>
              <span style={{ fontSize: 11, color: '#bbb' }}>· 管理员工工作区、工具和身份</span>
            </div>
            {/* 对话消息区 */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '16px 16px 8px', gap: 10, background: '#f5f6fa' }}>
              {chatMsgs.map((msg, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8 }}>
                  {msg.role === 'ai' && (
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: getContentGradient(data.name, data.dept, data.domain, data.description), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                      {data.name.trim().charAt(0) || '✦'}
                    </div>
                  )}
                  <div style={{ maxWidth: '78%', padding: '9px 13px', borderRadius: msg.role === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px', background: msg.role === 'user' ? '#6366F1' : '#fff', color: msg.role === 'user' ? '#fff' : '#1a1a1a', fontSize: 13, lineHeight: 1.6, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: getContentGradient(data.name, data.dept, data.domain, data.description), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                    {data.name.trim().charAt(0) || '✦'}
                  </div>
                  <div style={{ padding: '9px 13px', borderRadius: '4px 14px 14px 14px', background: '#fff', fontSize: 13, color: '#bbb', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>···</div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            {/* 底部输入栏 */}
            <div style={{ borderTop: '1px solid #e8e8f0', background: '#fff', flexShrink: 0, padding: '10px 14px' }}>
              <input ref={chatFileRef} type="file" accept="*/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) { setChatMsgs(prev => [...prev, { role: 'user', content: `📎 ${e.target.files![0].name}` }]); e.target.value = ''; } }} />
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e8e8e8', borderRadius: 10, background: '#fff', padding: '6px 8px 6px 10px', gap: 8 }}>
                <div
                  onClick={() => chatFileRef.current?.click()}
                  title="上传文件或图片"
                  style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#555', fontSize: 15, background: '#fafafa', flexShrink: 0 }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#6366F1'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#e8e8e8'}
                >📎</div>
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }}
                  placeholder='例如：把名字改为法务助手、切换到国产安全模型...'
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: 12, color: '#333', background: 'transparent', minWidth: 0 }}
                />
                <div
                  onClick={handleChatSend}
                  style={{ width: 34, height: 34, borderRadius: 9, background: chatInput.trim() ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: chatInput.trim() ? 'pointer' : 'default', color: chatInput.trim() ? '#fff' : '#ccc', fontSize: 15, flexShrink: 0, transition: 'all 0.15s' }}
                >▶</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* ── 任务步骤 JSON 全屏预览 / 编辑 Modal ── */}
      {taskJsonModal && (
        <Modal
          open={!!taskJsonModal}
          onCancel={() => {
            setTaskJsonEdits(prev => ({ ...prev, [taskJsonModal.taskId]: taskJsonModal.content }));
            setTaskJsonModal(null);
          }}
          footer={null}
          width="76vw"
          centered
          styles={{ body: { padding: 0 } }}
          closable={false}
        >
          {/* 弹窗头部 */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#fff', gap: 10 }}>
            <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>stages.json</span>
              <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace' }}>/ 任务步骤配置</span>
            </div>
            <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 7, padding: 3, gap: 0 }}>
              {([{ key: false, label: '编辑' }, { key: true, label: '预览' }] as const).map(tab => (
                <div
                  key={String(tab.key)}
                  onClick={() => setTaskJsonModal(prev => prev ? { ...prev, preview: tab.key } : null)}
                  style={{ padding: '4px 14px', borderRadius: 5, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s', fontWeight: taskJsonModal.preview === tab.key ? 600 : 400, color: taskJsonModal.preview === tab.key ? '#111' : '#6B7280', background: taskJsonModal.preview === tab.key ? '#fff' : 'transparent', boxShadow: taskJsonModal.preview === tab.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}
                >{tab.label}</div>
              ))}
            </div>
            <div
              onClick={() => {
                setTaskJsonEdits(prev => ({ ...prev, [taskJsonModal.taskId]: taskJsonModal.content }));
                setTaskJsonModal(null);
              }}
              style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, cursor: 'pointer', color: '#9CA3AF', fontSize: 16 }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#F3F4F6'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
            >✕</div>
          </div>
          <div style={{ height: '66vh', display: 'flex', flexDirection: 'column' }}>
            {taskJsonModal.preview ? (
              <div
                style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', fontSize: 12, lineHeight: 1.8, whiteSpace: 'pre', fontFamily: 'monospace', background: '#1e1e2e', color: '#cdd6f4' }}
                dangerouslySetInnerHTML={{ __html: syntaxHighlightJson(taskJsonModal.content) }}
              />
            ) : (
              <textarea
                value={taskJsonModal.content}
                onChange={e => setTaskJsonModal(prev => prev ? { ...prev, content: e.target.value } : null)}
                autoFocus
                style={{ flex: 1, border: 'none', outline: 'none', padding: '20px 28px', fontSize: 13, fontFamily: 'monospace', lineHeight: 1.85, resize: 'none', color: '#374151', background: '#fff', boxSizing: 'border-box' }}
              />
            )}
          </div>
        </Modal>
      )}
      <PublishVersionModal
        open={empPublishOpen}
        latestVersion=""
        onClose={() => setEmpPublishOpen(false)}
        onConfirm={(version, _changelog) => {
          setEmpPublishOpen(false);
          if (onPublish) {
            onPublish(data.name || '新员工');
          } else {
            onClose();
          }
          message.success(`数字员工「${data.name || '新员工'}」已备岗，版本 ${version}`);
        }}
      />

      {/* 历史版本 Drawer */}
      <Drawer
        title={
          <Space>
            <HistoryOutlined />
            <span>历史版本</span>
            <Tag style={{ fontSize: 11, margin: 0 }}>{MOCK_EMPLOYEE_HISTORY.length} 条记录</Tag>
          </Space>
        }
        placement="right"
        width={420}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        styles={{ body: { padding: '28px 24px 24px' } }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>

          {/* ── 草稿行 ── */}
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28, flexShrink: 0 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#10B981', flexShrink: 0, marginTop: 2 }} />
              <div style={{ width: 2, flex: 1, minHeight: 20, background: '#E5E7EB', marginTop: 5 }} />
            </div>
            <div style={{ flex: 1, paddingLeft: 14, paddingBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 10, background: '#F3F4F6' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#15803D' }}>草稿（当前编辑版本）</span>
                <span style={{ fontSize: 12, padding: '2px 12px', borderRadius: 12, border: '1.5px solid #10B981', color: '#10B981', fontWeight: 600, background: '#fff' }}>正在编辑</span>
              </div>
            </div>
          </div>

          {/* ── 历史版本列表（仅备岗版本） ── */}
          {[...MOCK_EMPLOYEE_HISTORY].filter(ev => ev.kind === 'publish' && ev.version).reverse().map((ev, idx, arr) => {
            const ver = ev.version!;
            const isLast = idx === arr.length - 1;
            return (
              <div key={ev.id} style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28, flexShrink: 0 }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', border: '2px solid #9CA3AF', flexShrink: 0, marginTop: 2 }} />
                  {!isLast && <div style={{ width: 2, flex: 1, minHeight: 20, background: '#E5E7EB', marginTop: 5 }} />}
                </div>
                <div style={{ flex: 1, paddingLeft: 14, paddingBottom: isLast ? 0 : 28 }}>
                  <div
                    style={{ background: '#F9FAFB', borderRadius: 10, padding: '14px 16px', cursor: 'pointer', transition: 'background 0.15s' }}
                    onClick={() => {
                      setHistoryOpen(false);
                      if (onViewVersion) onViewVersion(ver);
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#F1F3F9'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = '#F9FAFB'}
                  >
                    {/* 版本号 + 正式备岗 + 时间 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: ver.changelog ? 10 : 12 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#111', fontFamily: 'monospace' }}>{ver.version}</span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: '#EDE9FE', color: '#6D28D9', fontWeight: 600 }}>正式备岗</span>
                      <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{ver.publishedAt}</span>
                    </div>
                    {/* 变更日志 */}
                    {ver.changelog && (
                      <div style={{ fontSize: 13, color: '#374151', paddingLeft: 10, borderLeft: '2px solid #D1D5DB', marginBottom: 12, lineHeight: 1.6 }}>
                        {ver.changelog}
                      </div>
                    )}
                    {/* 发布者 + 回滚 */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0, marginRight: 8 }}>
                        {ver.publishedBy.charAt(0)}
                      </div>
                      <span style={{ fontSize: 13, color: '#374151' }}>{ver.publishedBy}</span>
                      {!readOnly && (
                        <span
                          onClick={e => { e.stopPropagation(); setInlineRollbackTarget(ver); }}
                          style={{ marginLeft: 'auto', fontSize: 13, color: '#6B7280', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                          onMouseEnter={e => (e.currentTarget as HTMLSpanElement).style.color = '#374151'}
                          onMouseLeave={e => (e.currentTarget as HTMLSpanElement).style.color = '#6B7280'}
                        >
                          <RollbackOutlined style={{ fontSize: 13 }} /> 回滚
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Drawer>

      {/* 内联回滚确认 Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fffbe6', border: '1px solid #ffe58f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 16 }}>!</span>
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>提示</span>
          </div>
        }
        open={!!inlineRollbackTarget}
        onCancel={() => setInlineRollbackTarget(null)}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button style={{ minWidth: 80, borderRadius: 8, height: 40 }} onClick={() => setInlineRollbackTarget(null)}>取 消</Button>
            <Button
              type="primary"
              style={{ minWidth: 80, borderRadius: 8, height: 40, background: '#4F46E5', borderColor: '#4F46E5', fontWeight: 600 }}
              onClick={() => {
                if (!inlineRollbackTarget) return;
                setInlineRollbackTarget(null);
                setHistoryOpen(false);
                message.success(`已回滚至 ${inlineRollbackTarget.version}，成为新草稿，请重新备岗上岗`);
              }}
            >确 定</Button>
          </div>
        }
        width={440}
      >
        {inlineRollbackTarget && (
          <div style={{ padding: '8px 0 4px', fontSize: 15, color: '#333', lineHeight: 1.8 }}>
            确定要将 <span style={{ fontWeight: 600 }}>「{data.name || '该员工'}」</span> 回滚到版本&nbsp;
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#d97706' }}>{inlineRollbackTarget.version}</span> 吗？当前未保存的更改将会丢失！
          </div>
        )}
      </Modal>
    </div>
  );
};


// ─── 备岗 Modal ─────────────────────────────────────────────
const PublishVersionModal: React.FC<{
  open: boolean;
  latestVersion: string;
  onClose: () => void;
  onConfirm: (version: string, changelog: string) => void;
}> = ({ open, latestVersion, onClose, onConfirm }) => {
  const [version, setVersion] = useState('');
  const [changelog, setChangelog] = useState('');

  React.useEffect(() => {
    if (open) {
      setVersion(nextVersion(latestVersion, 'patch'));
      setChangelog('');
    }
  }, [open, latestVersion]);

  const handleConfirm = () => {
    if (!/^v\d+\.\d+\.\d+$/.test(version)) {
      message.error('版本号格式不正确，需为 vX.Y.Z');
      return;
    }
    onConfirm(version, changelog);
    onClose();
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #e8e7ff 0%, #d4d3ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <TagOutlined style={{ color: '#6366F1', fontSize: 20 }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1a1a1a' }}>备岗</div>
            <div style={{ fontWeight: 400, fontSize: 13, color: '#888', marginTop: 2 }}>备岗后员工进入待上岗状态，可进一步申请上岗审批。</div>
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={
        <Space>
          <Button type="primary" onClick={handleConfirm} style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', border: 'none', minWidth: 96 }}>确认备岗</Button>
        </Space>
      }
      width={520}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '16px 0 4px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>版本号 <span style={{ color: '#ff4d4f' }}>*</span></span>
            {latestVersion && (
              <span style={{ fontSize: 13, color: '#888', display: 'flex', alignItems: 'center', gap: 5 }}>
                上次版本：<span style={{ padding: '1px 10px', borderRadius: 6, background: '#f0f0f0', color: '#555', fontSize: 13, fontFamily: 'monospace' }}>{latestVersion}</span>
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
          <div style={{ fontSize: 12, color: '#bbb', marginTop: 6 }}>已根据上次版本自动生成建议版本号，可手动修改，格式须为 vX.Y.Z</div>
        </div>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>版本说明 / 变更日志</div>
          <Input.TextArea
            value={changelog}
            onChange={e => setChangelog(e.target.value)}
            rows={4}
            placeholder="简要描述本次更新的内容..."
            maxLength={500}
            style={{ borderRadius: 8, resize: 'none' }}
          />
        </div>
      </div>
    </Modal>
  );
};

// ─── 上岗 Modal ─────────────────────────────────────────────
const GoLiveModal: React.FC<{
  open: boolean;
  empName: string;
  empVersion: string;
  onClose: () => void;
  onSubmit: (adminIds: string[], scopeIds: string[], applyReason: string) => void;
}> = ({ open, empName, empVersion, onClose, onSubmit }) => {
  const [adminSearch, setAdminSearch] = useState('');
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>([]);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const adminDropdownRef = React.useRef<HTMLDivElement>(null);

  const [orgSearch, setOrgSearch] = useState('');
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [applyReason, setApplyReason] = useState('');

  React.useEffect(() => {
    if (open) {
      setAdminSearch(''); setSelectedAdmins([]);
      setOrgSearch(''); setSelectedOrgs([]);
      setAdminDropdownOpen(false); setDropdownOpen(false);
      setApplyReason('');
    }
  }, [open]);

  React.useEffect(() => {
    if (!adminDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(e.target as Node)) setAdminDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [adminDropdownOpen]);

  React.useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  const handleSubmit = () => {
    if (selectedAdmins.length === 0) { message.warning('请选择至少一位管理员'); return; }
    onSubmit(selectedAdmins, selectedOrgs, applyReason);
    onClose();
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #e8e7ff 0%, #d4d3ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CloudUploadOutlined style={{ color: '#6366F1', fontSize: 20 }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1a1a1a' }}>上岗</div>
            <div style={{ fontWeight: 400, fontSize: 13, color: '#888', marginTop: 2 }}>{empName} · {empVersion} · 上岗后员工进入运行中状态</div>
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={handleSubmit} style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', border: 'none', minWidth: 96 }}>提交审批</Button>
        </Space>
      }
      width={520}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '16px 0 4px' }}>
        {/* ── 管理员 ── */}
        <div>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
            <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>管理员
          </div>
          <div ref={adminDropdownRef} style={{ position: 'relative' }}>
            <div
              style={{
                border: `1px solid ${adminDropdownOpen ? '#6366F1' : '#e5e7eb'}`,
                borderRadius: 8, padding: '6px 10px', background: '#fff',
                display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, minHeight: 40,
                boxShadow: adminDropdownOpen ? '0 0 0 2px #e0e0ff' : 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s', cursor: 'text',
              }}
              onClick={() => setAdminDropdownOpen(true)}
            >
              {selectedAdmins.map(id => {
                const person = PERSON_LIST.find(p => p.id === id);
                if (!person) return null;
                return (
                  <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px 2px 6px', borderRadius: 6, background: '#f3f4f6', border: '1px solid #e5e7eb', fontSize: 12, color: '#374151', lineHeight: '20px' }}>
                    <span style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, background: '#9ca3af', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <UserOutlined style={{ color: '#fff', fontSize: 10 }} />
                    </span>
                    {person.name}
                    <span onClick={e => { e.stopPropagation(); setSelectedAdmins(prev => prev.filter(x => x !== id)); }} style={{ cursor: 'pointer', color: '#9ca3af', fontSize: 13, lineHeight: 1, marginLeft: 1 }}>×</span>
                  </span>
                );
              })}
              <input value={adminSearch} onChange={e => setAdminSearch(e.target.value)} onFocus={() => setAdminDropdownOpen(true)} placeholder={selectedAdmins.length === 0 ? '请选择管理员' : ''} style={{ border: 'none', outline: 'none', fontSize: 13, color: '#333', background: 'transparent', flex: '1 1 80px', minWidth: 80, lineHeight: '24px', padding: 0 }} />
            </div>
            {adminDropdownOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 999, background: '#fff', borderRadius: 10, boxShadow: '0 4px 24px rgba(0,0,0,0.13)', overflow: 'hidden' }}>
                <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                  {(() => {
                    const q = adminSearch.trim();
                    const matches = PERSON_LIST.filter(p => !q || p.name.includes(q) || p.dept.includes(q));
                    if (matches.length === 0) return <div style={{ padding: '20px', textAlign: 'center', fontSize: 12, color: '#bbb' }}>无匹配人员</div>;
                    return matches.map((p, idx) => {
                      const selected = selectedAdmins.includes(p.id);
                      return (
                        <div key={p.id} onClick={() => { setSelectedAdmins(prev => selected ? prev.filter(x => x !== p.id) : [...prev, p.id]); setAdminSearch(''); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: selected ? '#f0f0ff' : idx === 0 ? '#f8f8fa' : '#fff', cursor: 'pointer', transition: 'background 0.1s' }}
                          onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLDivElement).style.background = '#f5f5f8'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = selected ? '#f0f0ff' : idx === 0 ? '#f8f8fa' : '#fff'; }}
                        >
                          <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #3B82F6, #06B6D4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <UserOutlined style={{ color: '#fff', fontSize: 15 }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: selected ? 700 : 500, color: selected ? '#4338ca' : '#1a1a1a' }}>{p.name}</div>
                            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>{p.dept}</div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
        {/* ── 公开范围 ── */}
        <div>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>公开范围</div>
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <div
              style={{ border: `1px solid ${dropdownOpen ? '#6366F1' : '#e5e7eb'}`, borderRadius: 8, padding: '6px 10px', background: '#fff', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, minHeight: 40, boxShadow: dropdownOpen ? '0 0 0 2px #e0e0ff' : 'none', transition: 'border-color 0.15s, box-shadow 0.15s', cursor: 'text' }}
              onClick={() => setDropdownOpen(true)}
            >
              {selectedOrgs.map(id => {
                const org = ORG_TREE.find(o => o.id === id);
                const person = PERSON_LIST.find(p => p.id === id);
                const item = org || person;
                const isPerson = !!person;
                if (!item) return null;
                return (
                  <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px 2px 6px', borderRadius: 6, background: '#f0f0ff', border: '1px solid #c7d2fe', fontSize: 12, color: '#4338ca', lineHeight: '20px' }}>
                    <span style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isPerson ? <UserOutlined style={{ color: '#fff', fontSize: 9 }} /> : <TeamOutlined style={{ color: '#fff', fontSize: 9 }} />}
                    </span>
                    {item.name}
                    <span onClick={e => { e.stopPropagation(); setSelectedOrgs(prev => prev.filter(x => x !== id)); }} style={{ cursor: 'pointer', color: '#a5b4fc', fontSize: 13, lineHeight: 1, marginLeft: 1 }}>×</span>
                  </span>
                );
              })}
              <input value={orgSearch} onChange={e => setOrgSearch(e.target.value)} onFocus={() => setDropdownOpen(true)} placeholder={selectedOrgs.length === 0 ? '请选择公开范围' : ''} style={{ border: 'none', outline: 'none', fontSize: 13, color: '#333', background: 'transparent', flex: '1 1 80px', minWidth: 80, lineHeight: '24px', padding: 0 }} />
            </div>
            {dropdownOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 999, background: '#fff', borderRadius: 10, boxShadow: '0 4px 24px rgba(0,0,0,0.13)', overflow: 'hidden' }}>
                <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                  {(() => {
                    const q = orgSearch.trim();
                    const matchOrgs = ORG_TREE.filter(o => !q || o.name.includes(q) || o.path.includes(q));
                    const matchPersons = PERSON_LIST.filter(p => !q || p.name.includes(q) || p.dept.includes(q) || p.path.includes(q));
                    const allItems: Array<{ id: string; name: string; path: string; isPerson: boolean; dept?: string }> = [
                      ...matchOrgs.map(o => ({ ...o, isPerson: false })),
                      ...matchPersons.map(p => ({ id: p.id, name: p.name, path: p.path, isPerson: true, dept: p.dept })),
                    ];
                    if (allItems.length === 0) return <div style={{ padding: '24px', textAlign: 'center', fontSize: 12, color: '#bbb' }}>无匹配的部门或人员</div>;
                    return allItems.map((item, idx) => {
                      const selected = selectedOrgs.includes(item.id);
                      const pathLabel = item.path !== item.name ? `(${item.path})` : '';
                      return (
                        <div key={item.id} onClick={() => { setSelectedOrgs(prev => selected ? prev.filter(id => id !== item.id) : [...prev, item.id]); setOrgSearch(''); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 16px', background: selected ? '#f0f0ff' : idx === 0 ? '#f8f8fa' : '#fff', cursor: 'pointer', transition: 'background 0.1s' }}
                          onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLDivElement).style.background = '#f5f5f8'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = selected ? '#f0f0ff' : idx === 0 ? '#f8f8fa' : '#fff'; }}
                        >
                          <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: item.isPerson ? 'linear-gradient(135deg, #3B82F6, #06B6D4)' : 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {item.isPerson ? <UserOutlined style={{ color: '#fff', fontSize: 16 }} /> : <TeamOutlined style={{ color: '#fff', fontSize: 16 }} />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 15, fontWeight: selected ? 700 : 500, color: selected ? '#4338ca' : '#1a1a1a', lineHeight: 1.3 }}>{item.name}</div>
                            {pathLabel && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{pathLabel}</div>}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
        {/* ── 申请说明 ── */}
        <div>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>申请说明 <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 400 }}>（选填）</span></div>
          <Input.TextArea
            value={applyReason}
            onChange={e => setApplyReason(e.target.value)}
            rows={3}
            placeholder="请描述上岗原因、使用场景或其他补充说明..."
            maxLength={300}
            style={{ borderRadius: 8, resize: 'none' }}
          />
        </div>
      </div>
    </Modal>
  );
};

// ─── 版本管理 Drawer ───────────────────────────────────────

const VersionDrawer: React.FC<{
  open: boolean;
  onClose: () => void;
  employee: DigitalEmployeeItem | null;
  onViewVersion: (version: EmployeeVersion, employee: DigitalEmployeeItem) => void;
  onRollback: (version: EmployeeVersion, employee: DigitalEmployeeItem) => void;
}> = ({ open, onClose, employee, onViewVersion, onRollback }) => {
  const [rollbackTarget, setRollbackTarget] = useState<EmployeeVersion | null>(null);
  const history = MOCK_EMPLOYEE_HISTORY;

  if (!employee) return null;

  const publishEvents = [...history].filter(ev => ev.kind === 'publish' && ev.version).reverse();

  const handleRollbackConfirm = () => {
    if (!rollbackTarget) return;
    setRollbackTarget(null);
    onClose();
    onRollback(rollbackTarget, employee);
  };

  return (
    <>
      <Drawer
        title={<span style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>历史版本</span>}
        placement="right"
        width={460}
        open={open}
        onClose={onClose}
        styles={{ body: { padding: '28px 24px 24px' } }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>

          {/* ── 草稿行 ── */}
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28, flexShrink: 0 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#10B981', flexShrink: 0, marginTop: 2 }} />
              <div style={{ width: 2, flex: 1, minHeight: 20, background: '#E5E7EB', marginTop: 5 }} />
            </div>
            <div style={{ flex: 1, paddingLeft: 14, paddingBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 10, background: '#F3F4F6' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#15803D' }}>草稿（当前编辑版本）</span>
                <span style={{ fontSize: 12, padding: '2px 12px', borderRadius: 12, border: '1.5px solid #10B981', color: '#10B981', fontWeight: 600, background: '#fff' }}>正在编辑</span>
              </div>
            </div>
          </div>

          {/* ── 历史版本列表 ── */}
          {publishEvents.map((ev, idx) => {
            const ver = ev.version!;
            const isLast = idx === publishEvents.length - 1;
            return (
              <div key={ev.id} style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
                {/* 左轴 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28, flexShrink: 0 }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', border: '2px solid #9CA3AF', flexShrink: 0, marginTop: 2 }} />
                  {!isLast && <div style={{ width: 2, flex: 1, minHeight: 20, background: '#E5E7EB', marginTop: 5 }} />}
                </div>
                {/* 内容区 — 点击整块进入只读查看 */}
                <div
                  style={{ flex: 1, paddingLeft: 14, paddingBottom: isLast ? 0 : 28 }}
                >
                  <div
                    style={{ background: '#F9FAFB', borderRadius: 10, padding: '14px 16px', cursor: 'pointer', transition: 'background 0.15s' }}
                    onClick={() => { onClose(); onViewVersion(ver, employee); }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#F1F3F9'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = '#F9FAFB'}
                  >
                    {/* 版本号 + 正式备岗 + 时间 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: ver.changelog ? 10 : 12 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#111', fontFamily: 'monospace' }}>{ver.version}</span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: '#EDE9FE', color: '#6D28D9', fontWeight: 600 }}>正式备岗</span>
                      <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{ver.publishedAt}</span>
                    </div>

                    {/* 变更日志 */}
                    {ver.changelog && (
                      <div style={{ fontSize: 13, color: '#374151', paddingLeft: 10, borderLeft: '2px solid #D1D5DB', marginBottom: 12, lineHeight: 1.6 }}>
                        {ver.changelog}
                      </div>
                    )}

                    {/* 发布者 + 回滚 */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0, marginRight: 8 }}>
                        {ver.publishedBy.charAt(0)}
                      </div>
                      <span style={{ fontSize: 13, color: '#374151' }}>{ver.publishedBy}</span>
                      <span
                        onClick={e => { e.stopPropagation(); setRollbackTarget(ver); }}
                        style={{ marginLeft: 'auto', fontSize: 13, color: '#6B7280', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                        onMouseEnter={e => (e.currentTarget as HTMLSpanElement).style.color = '#374151'}
                        onMouseLeave={e => (e.currentTarget as HTMLSpanElement).style.color = '#6B7280'}
                      >
                        <RollbackOutlined style={{ fontSize: 13 }} /> 回滚
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Drawer>

      {/* 回滚确认弹窗 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fffbe6', border: '1px solid #ffe58f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 16 }}>!</span>
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>提示</span>
          </div>
        }
        open={!!rollbackTarget}
        onCancel={() => setRollbackTarget(null)}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button style={{ minWidth: 80, borderRadius: 8, height: 40 }} onClick={() => setRollbackTarget(null)}>取 消</Button>
            <Button
              type="primary"
              style={{ minWidth: 80, borderRadius: 8, height: 40, background: '#4F46E5', borderColor: '#4F46E5', fontWeight: 600 }}
              onClick={handleRollbackConfirm}
            >确 定</Button>
          </div>
        }
        width={440}
      >
        {rollbackTarget && (
          <div style={{ padding: '8px 0 4px', fontSize: 15, color: '#333', lineHeight: 1.8 }}>
            确定要将 <span style={{ fontWeight: 600 }}>「{employee.name}」</span> 回滚到版本&nbsp;
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#d97706' }}>{rollbackTarget.version}</span> 吗？当前未保存的更改将会丢失！
          </div>
        )}
      </Modal>
    </>
  );
};

// ─── API Key 管理组件 ─────────────────────────────────────
interface ApiKeyRecord {
  id: string; token: string; createdAt: string;
  validity: '永久有效' | '7天有效' | '1天有效' | '30天有效';
  expired: boolean; enabled: boolean;
}
const INIT_API_KEYS: ApiKeyRecord[] = [
  { id: 'k1', token: 'sk-Z0FBQUF...', createdAt: '2026-04-28 14:59:51', validity: '永久有效', expired: false, enabled: true },
  { id: 'k2', token: 'sk-Z0FBQUF...', createdAt: '2026-04-28 14:59:50', validity: '7天有效',  expired: false, enabled: true },
  { id: 'k3', token: 'sk-Z0FBQUF...', createdAt: '2026-04-28 14:59:49', validity: '1天有效',  expired: false, enabled: true },
];
const VALIDITY_CFG: Record<string, { color: string; bg: string }> = {
  '永久有效': { color: '#7C3AED', bg: '#F5F3FF' },
  '7天有效':  { color: '#D97706', bg: '#FFFBEB' },
  '1天有效':  { color: '#B45309', bg: '#FEF3C7' },
  '30天有效': { color: '#2563EB', bg: '#EFF6FF' },
};

const ApiKeySection: React.FC = () => {
  const [keys, setKeys] = useState<ApiKeyRecord[]>(INIT_API_KEYS);
  const [page, setPage] = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pageSize = 5;
  const pageKeys = keys.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(keys.length / pageSize);

  const toggleKey = (id: string) =>
    setKeys(prev => prev.map(k => k.id === id ? { ...k, enabled: !k.enabled } : k));

  const deleteKey = (id: string) => {
    Modal.confirm({
      title: '确认删除该 API Key？',
      content: '删除后不可恢复，使用该 Key 的接口将立即失效。',
      okText: '删除', okButtonProps: { danger: true }, cancelText: '取消',
      onOk: () => { setKeys(prev => prev.filter(k => k.id !== id)); message.success('已删除'); },
    });
  };

  const addKey = (validity: ApiKeyRecord['validity']) => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const ts = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const newKey: ApiKeyRecord = {
      id: `k${Date.now()}`,
      token: `sk-${Math.random().toString(36).slice(2, 10).toUpperCase()}...`,
      createdAt: ts, validity, expired: false, enabled: true,
    };
    setKeys(prev => [newKey, ...prev]);
    setPage(1);
    setDropdownOpen(false);
    message.success(`新 API Key 已生成（${validity}）`);
  };

  return (
    <div>
      {/* 头部 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#111827', flex: 1 }}>API Key 管理</span>
        <div style={{ padding: '5px 14px', borderRadius: 8, background: '#EFF6FF', border: '1px solid #BFDBFE', fontSize: 12, color: '#2563EB', whiteSpace: 'nowrap' }}>
          请妥善保管您的密钥，避免泄露
        </div>
        {/* 新建密钥下拉按钮 */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 16px', borderRadius: 8, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            新建密钥 ∨
          </button>
          {dropdownOpen && (
            <>
              {/* 遮罩层，点击任意处关闭 */}
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 999 }}
                onClick={() => setDropdownOpen(false)}
              />
              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 1000, background: '#fff', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', border: '1px solid #e5e7eb', minWidth: 130, overflow: 'hidden' }}>
                {(['1天有效', '7天有效', '永久有效'] as const).map((opt, idx, arr) => (
                  <div
                    key={opt}
                    onClick={() => addKey(opt)}
                    style={{ padding: '11px 20px', fontSize: 14, color: '#374151', cursor: 'pointer', borderBottom: idx < arr.length - 1 ? '1px solid #f3f4f6' : 'none', transition: 'background 0.12s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#F9FAFB'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = '#fff'}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 表格 */}
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
        {/* 表头 */}
        <div style={{ display: 'grid', gridTemplateColumns: '220px 180px 100px 100px 90px 120px', background: '#F9FAFB', borderBottom: '1px solid #e5e7eb' }}>
          {['Token', '创建时间', '有效期', '是否过期', '状态', '操作'].map(col => (
            <div key={col} style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#374151' }}>{col}</div>
          ))}
        </div>
        {/* 数据行 */}
        {pageKeys.map((k, idx) => {
          const vcfg = VALIDITY_CFG[k.validity] ?? { color: '#6B7280', bg: '#F3F4F6' };
          return (
            <div key={k.id} style={{ display: 'grid', gridTemplateColumns: '220px 180px 100px 100px 90px 120px', borderBottom: idx < pageKeys.length - 1 ? '1px solid #f0f0f0' : 'none', background: '#fff', alignItems: 'center' }}>
              <div style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#374151' }}>{k.token}</span>
                <CopyOutlined style={{ fontSize: 12, color: '#9ca3af', cursor: 'pointer', flexShrink: 0 }} onClick={() => message.success('已复制')} />
              </div>
              <div style={{ padding: '11px 14px', fontSize: 12, color: '#6B7280' }}>{k.createdAt}</div>
              <div style={{ padding: '11px 14px' }}>
                <span style={{ padding: '2px 9px', borderRadius: 6, fontSize: 12, fontWeight: 500, color: vcfg.color, background: vcfg.bg }}>{k.validity}</span>
              </div>
              <div style={{ padding: '11px 14px' }}>
                <span style={{ padding: '2px 9px', borderRadius: 6, fontSize: 12, fontWeight: 500, color: k.expired ? '#DC2626' : '#D97706', background: k.expired ? '#FEF2F2' : '#FFFBEB' }}>
                  {k.expired ? '已过期' : '未过期'}
                </span>
              </div>
              <div style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: k.enabled ? '#10B981' : '#9ca3af', display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#374151' }}>{k.enabled ? '正常' : '停用'}</span>
              </div>
              <div style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Switch
                  checked={k.enabled}
                  onChange={() => toggleKey(k.id)}
                  size="small"
                  style={{ background: k.enabled ? '#6366F1' : undefined }}
                />
                <span onClick={() => deleteKey(k.id)} style={{ fontSize: 12, color: '#EF4444', cursor: 'pointer', fontWeight: 500 }}>删除</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 分页 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
        <span style={{ fontSize: 13, color: '#6B7280' }}>共 {keys.length} 条记录</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? '#d1d5db' : '#374151', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >‹</button>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: '#6366F1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600 }}>{page}</div>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: page >= totalPages ? 'not-allowed' : 'pointer', color: page >= totalPages ? '#d1d5db' : '#374151', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >›</button>
        </div>
      </div>
    </div>
  );
};

// ─── 主组件：数字员工库 ────────────────────────────────────
const DigitalEmployeeLibrary: React.FC = () => {
  // 从共享 Store 读取员工数据，订阅变化实现实时更新
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const unsub = employeeStore.subscribe(() => forceUpdate(n => n + 1));
    return () => { unsub(); };
  }, []);

  // 管理员模式（固定为管理员）
  const isAdmin = true;

  // 360画像弹窗
  const [profile360Open, setProfile360Open] = useState(false);

  // 将 Store 数据映射到本页面的 DigitalEmployeeItem 格式
  const storeEmployees = employeeStore.getEmployees();
  const [localOverrides, setLocalOverrides] = useState<Record<string, Partial<DigitalEmployeeItem>>>({});

  const employees: DigitalEmployeeItem[] = storeEmployees.map(e => ({
    id: e.id, name: e.name, dept: e.dept, domain: e.domain,
    description: e.description, status: e.status as EmployeeStatus,
    version: e.version, scope: e.scope as DeployScope,
    updateTime: e.updateTime, callCount: e.callCount,
    score: e.score, heat: e.heat, type: e.type,
    ...(localOverrides[e.id] || {}),
  }));
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [searchText, setSearchText]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [domainFilter, setDomainFilter] = useState('全部');
  const [createWizardOpen, setCreateWizardOpen]   = useState(false);
  const [createTab, setCreateTab]                 = useState<'blank'>('blank');
  // 空白创建表单
  const [newEmpName, setNewEmpName]               = useState('');
  const [newEmpDesc, setNewEmpDesc]               = useState('');
  const [newEmpAvatarType, setNewEmpAvatarType]   = useState<'auto' | 'ai' | 'upload'>('auto');
  const [newEmpAvatarUrl, setNewEmpAvatarUrl]     = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate]   = useState<string | null>(null);
  const [aiDescLoading, setAiDescLoading]         = useState(false);
  const [aiAvatarLoading, setAiAvatarLoading]     = useState(false);
  // AI 创建 tab (removed)
  const avatarFileRef = React.useRef<HTMLInputElement>(null);
  const [newEmpDept, setNewEmpDept]     = useState('');
  const [newEmpDomain, setNewEmpDomain] = useState('');
  const [newEmpRole, setNewEmpRole]     = useState('');

  const resetCreateWizard = () => {
    setCreateTab('blank'); setNewEmpName(''); setNewEmpDesc('');
    setNewEmpAvatarType('auto'); setNewEmpAvatarUrl(null);
    setSelectedTemplate(null);
    setAiDescLoading(false); setAiAvatarLoading(false);
    setNewEmpDept(''); setNewEmpDomain(''); setNewEmpRole('');
  };

  const AGENT_TEMPLATES = [
    { id: 't1', name: '法务合规助手', desc: '合同审查·法规咨询', color: 'linear-gradient(135deg,#6366F1,#8B5CF6)', dept: '法务部',   role: '法务合规顾问', domain: '法务域'   },
    { id: 't2', name: '智能客服助手', desc: '7×24小时客户服务',  color: 'linear-gradient(135deg,#10B981,#34D399)', dept: '客户成功',  role: '智能客服专员', domain: '客服域'   },
    { id: 't3', name: '数据分析专家', desc: '数据洞察·可视化报告', color: 'linear-gradient(135deg,#3B82F6,#06B6D4)', dept: '技术部',   role: '数据分析师',  domain: '技术域'   },
    { id: 't4', name: '工作汇报助手', desc: '周报·会议纪要生成', color: 'linear-gradient(135deg,#F59E0B,#FBBF24)', dept: '运营部',   role: '文档生产专员', domain: '运营域'   }
  ];

  const handleConfirmCreate = () => {
    if (!newEmpName.trim()) { message.warning('请填写员工名称'); return; }
    if (!newEmpDept)        { message.warning('请选择所属部门'); return; }
    setCreateWizardOpen(false);
    setCreateInitialData({ name: newEmpName.trim(), description: newEmpDesc.trim(), dept: newEmpDept, domain: newEmpDomain, role: '' });
    setCreateModalOpen(true);
  };

  const [createModalOpen, setCreateModalOpen]   = useState(false);
  const [createInitialData, setCreateInitialData] = useState<{name:string;description:string;dept:string;domain:string;role:string}>({name:'',description:'',dept:'',domain:'',role:''});
  const [editModalOpen, setEditModalOpen]       = useState(false);
  const [editEmployee, setEditEmployee]         = useState<DigitalEmployeeItem | null>(null);
  const [versionDrawerOpen, setVersionDrawerOpen] = useState(false);
  const [apiDrawerOpen, setApiDrawerOpen]       = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<DigitalEmployeeItem | null>(null);
  // 查看版本（只读配置页）
  const [viewVersionOpen, setViewVersionOpen]   = useState(false);
  const [viewVersionData, setViewVersionData]   = useState<{ employee: DigitalEmployeeItem; version: EmployeeVersion } | null>(null);
  // 回滚（草稿编辑配置页）
  const [rollbackDraftOpen, setRollbackDraftOpen] = useState(false);
  const [rollbackDraftData, setRollbackDraftData] = useState<{ employee: DigitalEmployeeItem; version: EmployeeVersion } | null>(null);

  const filteredEmployees = employees.filter(e => {
    const matchSearch = !searchText || e.name.includes(searchText) || e.description.includes(searchText);
    const matchStatus = !statusFilter || e.status === statusFilter;
    const matchDomain = domainFilter === '全部' || e.domain === domainFilter;
    return matchSearch && matchStatus && matchDomain;
  });

  // ── 备岗 Modal ────────────────────────────────────────────
  const [publishVersionOpen, setPublishVersionOpen] = useState(false);
  const [publishEmpId, setPublishEmpId]   = useState<string | null>(null);
  const [publishEmpName, setPublishEmpName] = useState('');

  // ── 上岗 Modal ────────────────────────────────────────────
  const [goLiveOpen, setGoLiveOpen] = useState(false);
  const [goLiveEmpId, setGoLiveEmpId] = useState<string | null>(null);
  const [goLiveEmpName, setGoLiveEmpName] = useState('');
  const [goLiveEmpVersion, setGoLiveEmpVersion] = useState('');

  const openStationModal = (id: string) => {
    const emp = employees.find(e => e.id === id);
    if (!emp) return;
    setPublishEmpId(id);
    setPublishEmpName(emp.name);
    setPublishVersionOpen(true);
  };

  const openGoLiveModal = (id: string) => {
    const emp = employees.find(e => e.id === id);
    if (!emp) return;
    setGoLiveEmpId(id);
    setGoLiveEmpName(emp.name);
    setGoLiveEmpVersion(emp.version);
    setGoLiveOpen(true);
  };

  const handleGoLiveSubmit = (adminIds: string[], scopeIds: string[], applyReason: string) => {
    if (!goLiveEmpId) return;
    const emp = employees.find(e => e.id === goLiveEmpId);
    if (!emp) return;

    // 状态变为"审批中"
    employeeStore.updateEmployee(goLiveEmpId, { status: 'approving' as any });
    setLocalOverrides(prev => ({ ...prev, [goLiveEmpId]: { ...prev[goLiveEmpId], status: 'approving' as EmployeeStatus } }));

    // 提交上岗审批申请到审批中心
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const ts = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    approvalStore.addItem({
      id: `ap-emp-${goLiveEmpId}-${Date.now()}`,
      type: 'employee_publish',
      title: `数字员工上岗：${emp.name} ${emp.version}`,
      requester: '当前用户',
      requesterRole: '员工管理员',
      dept: emp.dept,
      reason: applyReason.trim() || `「${emp.name}」已完成配置与调试验证，申请正式上岗。`,
      status: 'pending',
      createdAt: ts,
      riskLevel: 'low',
      employeeId: goLiveEmpId,
      meta: { '版本': emp.version, '业务域': emp.domain, '部门': emp.dept },
    });

    message.info(`「${emp.name}」申请已提交，请前往「审批中心」查看进度`);
  };

  const handleStatusChange = (id: string, newStatus: EmployeeStatus, silent = false) => {
    employeeStore.updateEmployee(id, { status: newStatus as any });
    setLocalOverrides(prev => ({ ...prev, [id]: { ...prev[id], status: newStatus } }));
    if (!silent) {
      const labels: Record<string, string> = { published: '已恢复运行', paused: '已暂停' };
      message.success(labels[newStatus] || '状态已更新');
    }
  };

  const handleArchive = (id: string, name: string) => {
    Modal.confirm({
      title: `确认归档「${name}」？`,
      content: '归档后员工将停止服务，管理员可随时重新上岗。',
      okText: '确认归档',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        employeeStore.updateEmployee(id, { status: 'archived' as any });
        setLocalOverrides(prev => ({ ...prev, [id]: { ...prev[id], status: 'archived' as EmployeeStatus } }));
        message.success(`「${name}」已归档`);
      },
    });
  };

  // ── 卡片视图 ────────────────────────────────────────────
  const CardView = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
      {filteredEmployees.map(r => {
        const statusCfg = STATUS_CONFIG[r.status];
        const typeCfg   = TYPE_CONFIG[r.type];
        return (
          <div
            key={r.id}
            style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8e8f0', overflow: 'hidden', transition: 'all 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', cursor: 'pointer' }}
            onClick={() => { setEditEmployee(r); setEditModalOpen(true); }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = '0 4px 16px rgba(99,102,241,0.12)'; el.style.transform = 'translateY(-2px)'; el.style.borderColor = '#6366F1'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; el.style.transform = ''; el.style.borderColor = '#e8e8f0'; }}
          >
            <div style={{ height: 4, background: getAvatarColor(r.name) }} />
            <div style={{ padding: '16px 18px' }}>
              {/* 头部 */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: getAvatarColor(r.name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 700 }}>{r.name.charAt(0)}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 3 }}>{r.name}</div>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 4, background: typeCfg.bg, color: typeCfg.color, fontWeight: 500 }}>{r.type}</span>
                      <span style={{ fontSize: 11, color: '#aaa' }}>{r.domain}</span>
                    </div>
                  </div>
                </div>
                <Badge status={statusCfg.badgeStatus} text={<span style={{ fontSize: 11, color: '#666' }}>{statusCfg.label}</span>} />
              </div>
              {/* 描述 */}
              <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                {r.description}
              </div>
              {/* 版本 + 部门 */}
              <div style={{ fontSize: 11, color: '#bbb', marginBottom: 8 }}>{r.dept} · {r.version} · {r.updateTime}</div>
              {/* 操作 */}
              <div style={{ display: 'flex', gap: 6, borderTop: '1px solid #f5f5f5', paddingTop: 10 }} onClick={e => e.stopPropagation()}>
                <Button size="small" type="text" icon={<ApiOutlined />} style={{ color: '#6366F1', fontSize: 12 }} onClick={() => { setSelectedEmployee(r); setApiDrawerOpen(true); }}>接入</Button>
                <Tooltip title="360画像">
                  <Button size="small" type="text" icon={<RadarChartOutlined />} style={{ color: '#8B5CF6', fontSize: 12 }} onClick={() => setProfile360Open(true)}>360画像</Button>
                </Tooltip>
                <div style={{ flex: 1 }} />
                {r.status === 'draft' && <Button size="small" type="text" icon={<TagOutlined />} style={{ color: '#10b981', fontSize: 12 }} onClick={() => openStationModal(r.id)}>备岗</Button>}
                {r.status === 'stationed' && <Button size="small" type="text" icon={<CloudUploadOutlined />} style={{ color: '#6366F1', fontSize: 12 }} onClick={() => openGoLiveModal(r.id)}>上岗</Button>}
                {r.status === 'published' && <Button size="small" type="text" icon={<PauseCircleOutlined />} style={{ color: '#f59e0b', fontSize: 12 }} onClick={() => handleStatusChange(r.id, 'paused')}>暂停</Button>}
                {r.status === 'paused' && <Button size="small" type="text" icon={<PlayCircleOutlined />} style={{ color: '#10b981', fontSize: 12 }} onClick={() => handleStatusChange(r.id, 'published')}>恢复</Button>}
                {r.status === 'archived' && isAdmin && <Button size="small" type="text" icon={<CloudUploadOutlined />} style={{ color: '#6366F1', fontSize: 12 }} onClick={() => openGoLiveModal(r.id)}>上岗</Button>}
                {(r.status === 'draft' || r.status === 'stationed') && <Button size="small" type="text" icon={<StopOutlined />} style={{ color: '#ff4d4f', fontSize: 12 }} onClick={() => Modal.confirm({ title: `确认删除「${r.name}」？`, content: '删除后不可恢复', okText: '删除', okButtonProps: { danger: true }, cancelText: '取消', onOk: () => { employeeStore.deleteEmployee(r.id); setLocalOverrides(prev => { const n = { ...prev }; delete n[r.id]; return n; }); message.success('已删除'); } })}>删除</Button>}
                {(r.status === 'published' || r.status === 'paused') && isAdmin && <Button size="small" type="text" icon={<StopOutlined />} style={{ color: '#ff4d4f', fontSize: 12 }} onClick={() => handleArchive(r.id, r.name)}>归档</Button>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── 表格视图 ────────────────────────────────────────────
  const columns: ColumnsType<DigitalEmployeeItem> = [
    {
      title: '数字员工', key: 'name', width: 260,
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: getAvatarColor(r.name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, fontWeight: 700 }}>{r.name.charAt(0)}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{r.name}</div>
            <div style={{ fontSize: 11, color: '#aaa' }}>{r.dept} · {r.domain} · {r.version}</div>
          </div>
        </div>
      ),
    },
    { title: '类型', key: 'type', width: 80, render: (_, r) => <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: TYPE_CONFIG[r.type].bg, color: TYPE_CONFIG[r.type].color, fontWeight: 500 }}>{r.type}</span> },
    { title: '状态', key: 'status', width: 100, render: (_, r) => { const cfg = STATUS_CONFIG[r.status]; return <Badge status={cfg.badgeStatus} text={<span style={{ fontSize: 12 }}>{cfg.label}</span>} />; } },
    { title: '上岗范围', key: 'scope', width: 110, render: (_, r) => { const cfg = SCOPE_CONFIG[r.scope]; return <span style={{ fontSize: 12, color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}>{cfg.icon} {cfg.label}</span>; } },
    { title: '更新时间', key: 'updateTime', width: 110, render: (_, r) => <span style={{ fontSize: 12, color: '#999' }}>{r.updateTime}</span> },
    {
      title: '操作', key: 'actions', width: 230,
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
          <Button size="small" type="text" icon={<ApiOutlined />} style={{ color: '#6366F1', fontSize: 12 }} onClick={() => { setSelectedEmployee(r); setApiDrawerOpen(true); }}>接入</Button>
          <Button size="small" type="text" icon={<RadarChartOutlined />} style={{ color: '#8B5CF6', fontSize: 12 }} onClick={() => setProfile360Open(true)}>360画像</Button>
          <Divider type="vertical" style={{ margin: '0 2px' }} />
          {r.status === 'draft' && <Button size="small" type="text" icon={<TagOutlined />} style={{ color: '#10b981', fontSize: 12 }} onClick={() => openStationModal(r.id)}>备岗</Button>}
          {r.status === 'stationed' && <Button size="small" type="text" icon={<CloudUploadOutlined />} style={{ color: '#6366F1', fontSize: 12 }} onClick={() => openGoLiveModal(r.id)}>上岗</Button>}
          {r.status === 'published' && <Button size="small" type="text" icon={<PauseCircleOutlined />} style={{ color: '#f59e0b', fontSize: 12 }} onClick={() => handleStatusChange(r.id, 'paused')}>暂停</Button>}
          {r.status === 'paused' && <Button size="small" type="text" icon={<PlayCircleOutlined />} style={{ color: '#10b981', fontSize: 12 }} onClick={() => handleStatusChange(r.id, 'published')}>恢复</Button>}
          {r.status === 'archived' && isAdmin && <Button size="small" type="text" icon={<CloudUploadOutlined />} style={{ color: '#6366F1', fontSize: 12 }} onClick={() => openGoLiveModal(r.id)}>上岗</Button>}
          {(r.status === 'draft' || r.status === 'stationed') && <Button size="small" type="text" icon={<StopOutlined />} style={{ color: '#ff4d4f', fontSize: 12 }} onClick={() => Modal.confirm({ title: `确认删除「${r.name}」？`, content: '删除后不可恢复', okText: '删除', okButtonProps: { danger: true }, cancelText: '取消', onOk: () => { employeeStore.deleteEmployee(r.id); setLocalOverrides(prev => { const n = { ...prev }; delete n[r.id]; return n; }); message.success('已删除'); } })}>删除</Button>}
          {(r.status === 'published' || r.status === 'paused') && isAdmin && <Button size="small" type="text" icon={<StopOutlined />} style={{ color: '#ff4d4f', fontSize: 12 }} onClick={() => handleArchive(r.id, r.name)}>归档</Button>}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* 工具栏 */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <Input prefix={<SearchOutlined style={{ color: '#bbb' }} />} placeholder="搜索员工名称 / 描述 / 业务域..." value={searchText} onChange={e => setSearchText(e.target.value)} style={{ width: 280, borderRadius: 8 }} allowClear />
        <Select placeholder="状态筛选" allowClear style={{ width: 120 }} onChange={v => setStatusFilter(v || '')} options={Object.entries(STATUS_CONFIG).map(([k, v]) => ({ label: v.label, value: k }))} />
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#999' }}>共 <strong style={{ color: '#333' }}>{filteredEmployees.length}</strong> 个</span>
        <div style={{ display: 'flex', border: '1px solid #e8e8e8', borderRadius: 8, overflow: 'hidden' }}>
          <Button type={viewMode === 'card' ? 'primary' : 'text'} icon={<AppstoreOutlined />} size="small" style={{ borderRadius: 0, background: viewMode === 'card' ? '#6366F1' : 'transparent', border: 'none', height: 32, padding: '0 12px', color: viewMode === 'card' ? '#fff' : '#666' }} onClick={() => setViewMode('card')}>卡片</Button>
          <Button type={viewMode === 'list' ? 'primary' : 'text'} icon={<UnorderedListOutlined />} size="small" style={{ borderRadius: 0, background: viewMode === 'list' ? '#6366F1' : 'transparent', border: 'none', height: 32, padding: '0 12px', color: viewMode === 'list' ? '#fff' : '#666' }} onClick={() => setViewMode('list')}>列表</Button>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateWizardOpen(true)} style={{ background: '#6366F1', borderColor: '#6366F1', borderRadius: 8, fontWeight: 600 }}>创建数字员工</Button>
      </div>

      {/* 域分类 Tab */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {DOMAIN_LIST.map(d => (
          <div
            key={d}
            onClick={() => setDomainFilter(d)}
            style={{ padding: '5px 16px', borderRadius: 20, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s', background: domainFilter === d ? DOMAIN_COLORS[d] : '#f5f5f5', color: domainFilter === d ? '#fff' : '#666', fontWeight: domainFilter === d ? 600 : 400 }}
          >{d}</div>
        ))}
      </div>

      {/* 内容区 */}
      {viewMode === 'card' ? <CardView /> : (
        <div style={{ border: '1px solid #e8e8e8', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
          <Table dataSource={filteredEmployees} columns={columns} rowKey="id" pagination={{ pageSize: 10, size: 'small' }} size="middle"
            onRow={r => ({ onClick: () => { setEditEmployee(r); setEditModalOpen(true); }, style: { cursor: 'pointer' } })} />
        </div>
      )}

      {/* ── 统一创建弹窗 ── */}
      <Modal
        open={createWizardOpen}
        onCancel={() => { setCreateWizardOpen(false); resetCreateWizard(); }}
        footer={null}
        width={860}
        centered
        closable={false}
        styles={{ body: { padding: 0 } }}
      >
        {/* 隐藏文件 input */}
        <input type="file" accept="image/*" ref={avatarFileRef} style={{ display: 'none' }}
          onChange={e => {
            const file = e.target.files?.[0];
            if (!file) return;
            const url = URL.createObjectURL(file);
            setNewEmpAvatarUrl(url);
            setNewEmpAvatarType('upload');
            (e.target as HTMLInputElement).value = '';
          }}
        />

        {/* 头部：标题 + 关闭 */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '22px 28px 14px', borderBottom: '1px solid #F3F4F6' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>创建数字员工</div>
          <div style={{ flex: 1 }} />
          <div onClick={() => { setCreateWizardOpen(false); resetCreateWizard(); }}
            style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 7, cursor: 'pointer', color: '#9CA3AF', fontSize: 18, transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#F3F4F6'}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
          >✕</div>
        </div>

        {/* ── 空白创建内容 ── */}
        {createTab === 'blank' && (
          <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '72vh', overflow: 'hidden' }}>

            {/* 可滚动内容区 */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 0' }}>

              {/* 模板卡片横向滚动 */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 10, fontWeight: 500, letterSpacing: 0.3 }}>从模板快速开始</div>
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                  {/* 空白 */}
                  <div
                    onClick={() => { setSelectedTemplate('blank'); setNewEmpName(''); setNewEmpDesc(''); setNewEmpDept(''); setNewEmpDomain(''); setNewEmpRole(''); setNewEmpAvatarType('auto'); setNewEmpAvatarUrl(null); }}
                    style={{ minWidth: 120, padding: '14px 16px', borderRadius: 12, border: `1.5px solid ${selectedTemplate === 'blank' ? '#6366F1' : '#E5E7EB'}`, background: selectedTemplate === 'blank' ? '#EEF2FF' : '#fff', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 8 }}>📄</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: selectedTemplate === 'blank' ? '#4338CA' : '#374151' }}>空白员工</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>自定义配置</div>
                  </div>
                  {/* 模板列表 */}
                  {AGENT_TEMPLATES.map(tpl => (
                    <div key={tpl.id}
                      onClick={() => { setSelectedTemplate(tpl.id); setNewEmpName(tpl.name); setNewEmpDesc(`${tpl.name}专注于${tpl.domain}，可高效完成${tpl.desc}等任务。`); setNewEmpDept(tpl.dept); setNewEmpDomain(tpl.domain); setNewEmpRole(tpl.role); setNewEmpAvatarType('auto'); setNewEmpAvatarUrl(null); }}
                      style={{ minWidth: 150, padding: '14px 16px', borderRadius: 12, border: `1.5px solid ${selectedTemplate === tpl.id ? '#6366F1' : '#E5E7EB'}`, background: selectedTemplate === tpl.id ? '#EEF2FF' : '#fff', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: tpl.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{tpl.name.charAt(0)}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: selectedTemplate === tpl.id ? '#4338CA' : '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tpl.name}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tpl.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 头像 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div
                    onClick={() => avatarFileRef.current?.click()}
                    style={{ width: 80, height: 80, borderRadius: 20, cursor: 'pointer', overflow: 'hidden', border: '2px solid #e8e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {newEmpAvatarType === 'upload' && newEmpAvatarUrl ? (
                      <img src={newEmpAvatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: getContentGradient(newEmpName, newEmpDept, newEmpDomain, newEmpDesc), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 30, fontWeight: 700 }}>
                        {newEmpName.trim().charAt(0) || '✦'}
                      </div>
                    )}
                  </div>
                  <div
                    onClick={() => avatarFileRef.current?.click()}
                    style={{ position: 'absolute', bottom: -4, right: -4, width: 22, height: 22, borderRadius: '50%', background: '#fff', border: '1.5px solid #e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 11, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}
                  >
                    📷
                  </div>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 20, background: '#f0f0ff', border: '1px solid #e0deff', fontSize: 11, color: '#6366F1', fontWeight: 500 }}>
                  <span style={{ fontSize: 10 }}>✦</span> AI生成
                </div>
              </div>

              {/* 3列：员工名称 | 所属部门 | 业务域 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 13, color: '#555', marginBottom: 6, fontWeight: 500 }}>员工名称 <span style={{ color: '#ff4d4f' }}>*</span></div>
                  <Input
                    value={newEmpName}
                    onChange={e => setNewEmpName(e.target.value.slice(0, 50))}
                    placeholder="如：法务合规助手"
                    style={{ borderRadius: 8 }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 13, color: '#555', marginBottom: 6, fontWeight: 500 }}>所属部门 <span style={{ color: '#ff4d4f' }}>*</span></div>
                  <Select
                    value={newEmpDept || undefined}
                    onChange={v => setNewEmpDept(v)}
                    placeholder="选择部门"
                    style={{ width: '100%' }}
                    options={DEPARTMENTS.map(d => ({ label: d, value: d }))}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 13, color: '#555', marginBottom: 6, fontWeight: 500 }}>业务域 <span style={{ color: '#ff4d4f' }}>*</span></div>
                  <Select
                    value={newEmpDomain || undefined}
                    onChange={v => setNewEmpDomain(v)}
                    placeholder="选择业务域"
                    style={{ width: '100%' }}
                    options={DOMAIN_LIST.filter(d => d !== '全部').map(d => ({ label: d, value: d }))}
                  />
                </div>
              </div>

              {/* 员工职责 */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontSize: 13, color: '#555', fontWeight: 500 }}>
                    员工职责 <span style={{ fontSize: 12, color: '#bbb', fontWeight: 400 }}>（选填）</span>
                  </div>
                  <div
                    onClick={() => {
                      if (!newEmpName.trim()) { message.warning('请先填写员工名称'); return; }
                      setAiDescLoading(true);
                      setTimeout(() => {
                        const isLaw  = newEmpName.includes('法务') || newEmpName.includes('合规');
                        const isCust = newEmpName.includes('客服') || newEmpName.includes('客户');
                        const isData = newEmpName.includes('数据') || newEmpName.includes('分析');
                        const isOps  = newEmpName.includes('巡检') || newEmpName.includes('运维');
                        setNewEmpDesc(`${newEmpName}的核心职责：\n1. ${isLaw ? '合同审查与法律风险识别，确保业务合规性' : isCust ? '7×24小时在线客户服务，处理咨询与投诉' : isData ? '数据采集、清洗与分析，输出可视化报告' : isOps ? '设备状态监控与异常预警研判' : '负责对应岗位的核心业务处理与分析'}\n2. 知识库检索与智能问答，提升团队工作效率\n3. 严格遵循企业规范标准，保障数据安全合规`);
                        setAiDescLoading(false);
                      }, 1200);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6366F1', cursor: 'pointer', fontWeight: 500, userSelect: 'none' }}
                  >
                    {aiDescLoading
                      ? <><span style={{ fontSize: 12 }}>⟳</span> 生成中…</>
                      : <><span style={{ fontSize: 11 }}>✦</span> AI 生成</>
                    }
                  </div>
                </div>
                <Input.TextArea
                  value={newEmpDesc}
                  onChange={e => setNewEmpDesc(e.target.value)}
                  rows={4}
                  placeholder="描述该员工的核心职责与工作范围，将用于生成系统提示词..."
                  style={{ borderRadius: 8, resize: 'none' }}
                  maxLength={500}
                  showCount
                />
              </div>
            </div>

            {/* 固定底部 */}
            <div style={{ padding: '14px 28px', borderTop: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: '#fff' }}>
              <button
                onClick={() => { setCreateWizardOpen(false); resetCreateWizard(); }}
                style={{ padding: '8px 22px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', color: '#6B7280', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}
              >
                取消
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
<button
                  onClick={handleConfirmCreate}
                  disabled={!newEmpName.trim() || !newEmpDept}
                  style={{ padding: '8px 28px', borderRadius: 8, border: 'none', background: (newEmpName.trim() && newEmpDept) ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : '#E5E7EB', color: (newEmpName.trim() && newEmpDept) ? '#fff' : '#9CA3AF', fontSize: 13, fontWeight: 600, cursor: (newEmpName.trim() && newEmpDept) ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}
                >
                  下一步
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 全页创建向导 */}
      {createModalOpen && (
        <EmployeeConfigPage
          onClose={() => { setCreateModalOpen(false); setCreateInitialData({name:'',description:'',dept:'',domain:'',role:''}); }}
          onBack={() => { setCreateModalOpen(false); setCreateWizardOpen(true); }}
          onPublish={(name) => {
            setCreateModalOpen(false);
            setCreateInitialData({name:'',description:'',dept:'',domain:'',role:''});
            setPublishEmpId('__new__');
            setPublishEmpName(name);
            setPublishVersionOpen(true);
          }}
          initialData={createInitialData.name ? { name: createInitialData.name, description: createInitialData.description, dept: createInitialData.dept, domain: createInitialData.domain, role: createInitialData.role } : undefined}
        />
      )}

      {/* 全页编辑向导 */}
      {editModalOpen && (
        <EmployeeConfigPage
          onClose={() => { setEditModalOpen(false); setEditEmployee(null); }}
          onPublish={(name) => {
            const targetId = editEmployee?.id ?? null;
            setEditModalOpen(false);
            setEditEmployee(null);
            setPublishEmpId(targetId);
            setPublishEmpName(name || editEmployee?.name || '');
            setPublishVersionOpen(true);
          }}
          initialData={{ name: editEmployee?.name ?? '', dept: editEmployee?.dept ?? '', description: editEmployee?.description ?? '', domain: editEmployee?.domain ?? '' }}
          isEdit
        />
      )}

      {/* 查看历史版本（只读） */}
      {viewVersionOpen && viewVersionData && (
        <EmployeeConfigPage
          onClose={() => { setViewVersionOpen(false); setViewVersionData(null); }}
          initialData={{ name: viewVersionData.employee.name, dept: viewVersionData.employee.dept, description: viewVersionData.employee.description, domain: viewVersionData.employee.domain }}
          readOnly
          readOnlyVersion={viewVersionData.version.version}
          readOnlyPublishedAt={viewVersionData.version.publishedAt}
          readOnlyPublishedBy={viewVersionData.version.publishedBy}
          isEdit
        />
      )}

      {/* 回滚草稿（可编辑，重新上岗） */}
      {rollbackDraftOpen && rollbackDraftData && (
        <EmployeeConfigPage
          onClose={() => { setRollbackDraftOpen(false); setRollbackDraftData(null); }}
          onPublish={(name) => {
            const targetId = rollbackDraftData.employee.id;
            setRollbackDraftOpen(false);
            setRollbackDraftData(null);
            setPublishEmpId(targetId);
            setPublishEmpName(name || rollbackDraftData.employee.name);
            setPublishVersionOpen(true);
          }}
          initialData={{ name: rollbackDraftData.employee.name, dept: rollbackDraftData.employee.dept, description: rollbackDraftData.employee.description, domain: rollbackDraftData.employee.domain }}
          isEdit
        />
      )}

      {/* 版本 Drawer */}
      <VersionDrawer
        open={versionDrawerOpen}
        onClose={() => setVersionDrawerOpen(false)}
        employee={selectedEmployee}
        onViewVersion={(ver, emp) => {
          setViewVersionData({ employee: emp, version: ver });
          setViewVersionOpen(true);
        }}
        onRollback={(ver, emp) => {
          setRollbackDraftData({ employee: emp, version: ver });
          setRollbackDraftOpen(true);
          message.success(`已回滚到 ${ver.version}，进入草稿编辑`);
        }}
      />

      {/* 备岗 Modal */}
      <PublishVersionModal
        open={publishVersionOpen}
        latestVersion=""
        onClose={() => setPublishVersionOpen(false)}
        onConfirm={(version, _changelog) => {
          if (publishEmpId && publishEmpId !== '__new__') {
            employeeStore.updateEmployee(publishEmpId, { status: 'stationed' as any });
            setLocalOverrides(prev => ({ ...prev, [publishEmpId]: { ...prev[publishEmpId], status: 'stationed' as EmployeeStatus } }));
          }
          message.success(`「${publishEmpName || '新员工'}」已备岗，版本 ${version}`);
          setPublishVersionOpen(false);
        }}
      />

      {/* 上岗 Modal */}
      <GoLiveModal
        open={goLiveOpen}
        empName={goLiveEmpName}
        empVersion={goLiveEmpVersion}
        onClose={() => setGoLiveOpen(false)}
        onSubmit={handleGoLiveSubmit}
      />

      {/* 多入口 API Drawer */}
      <Drawer title={`接入配置 · ${selectedEmployee?.name || ''}`} open={apiDrawerOpen} onClose={() => setApiDrawerOpen(false)} width={860}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* API Key 管理 */}
          <ApiKeySection />
          {[
            { mode: '飞书机器人', icon: <span style={{ fontSize: 18 }}>🪶</span>, color: '#00B96B', desc: '以飞书机器人形式在群组/会话中提供服务，支持群消息、私聊', code: `bot_id: ${selectedEmployee?.id}\nplatform: feishu\ncall_mode: bot` },
            { mode: 'REST API', icon: <ApiOutlined />, color: '#3B82F6', desc: '标准 HTTP 接口，支持外部系统集成与程序化调用', code: `POST /v1/employees/${selectedEmployee?.id}/chat\nAuthorization: Bearer {YOUR_API_KEY}` },
            { mode: 'H5 网页', icon: <DesktopOutlined />, color: '#6366F1', desc: '适配电脑/移动端，浏览器直接访问，无需安装', code: `https://emp.wanjuan.ai/h5/${selectedEmployee?.id}` },
          ].map(item => (
            <div key={item.mode} style={{ border: `1px solid ${item.color}25`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', background: `${item.color}08`, borderBottom: `1px solid ${item.color}20`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16, color: item.color }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{item.mode}</div>
                  <div style={{ fontSize: 11, color: '#999' }}>{item.desc}</div>
                </div>
              </div>
              <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <code style={{ flex: 1, fontSize: 11, color: '#555', fontFamily: 'monospace', lineHeight: 1.8, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{item.code}</code>
                <Button size="small" type="text" icon={<CopyOutlined />} style={{ color: item.color, flexShrink: 0 }} onClick={() => message.success('已复制')} />
              </div>
            </div>
          ))}
        </div>
      </Drawer>

      {/* 360画像弹窗 */}
      <Modal
        open={profile360Open}
        onCancel={() => setProfile360Open(false)}
        footer={null}
        width={960}
        style={{ top: 20 }}
        bodyStyle={{ padding: 0, maxHeight: '90vh', overflowY: 'auto' }}
        destroyOnClose
      >
        <DigitalEmployeeProfile embedded />
      </Modal>
    </div>
  );
};

export default DigitalEmployeeLibrary;
