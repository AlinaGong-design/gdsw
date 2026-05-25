import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Layout,
  Input,
  Button,
  Dropdown,
  Tag,
  Modal,
  TreeSelect,
  Avatar,
  Badge,
  Spin,
  message,
  Select,
  Popover,
  Switch,
  Tooltip,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SmileOutlined,
  SendOutlined,
  ReloadOutlined,
  SearchOutlined,
  TeamOutlined,
  ToolOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  BulbOutlined,
  DatabaseOutlined,
  UserOutlined,
  PaperClipOutlined,
  EditOutlined,
  LikeOutlined,
  DislikeOutlined,
  SyncOutlined,
  PushpinOutlined,
  DeleteOutlined,
  EllipsisOutlined,
  LinkOutlined,
  PrinterOutlined,
  HistoryOutlined,
  KeyOutlined,
  FormOutlined,
  FileAddOutlined,
  ExclamationCircleOutlined,
  QuestionCircleOutlined,
  FileTextOutlined,
  CloseOutlined,
  UndoOutlined,
  RedoOutlined,
  CopyOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  MessageOutlined,
  OrderedListOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { SkillItem } from './Skill';
import MentionEditor, { MentionEditorHandle } from '../components/MentionEditor';
import html2canvas from 'html2canvas';
import SessionRatingModal from '../components/SessionRatingModal';
import { employeeStore, EmployeeRecord } from '../store/employeeStore';
import OpenClawDashboard from './OpenClawDashboard';
import OpenClaw from './OpenClaw';
import OperationPlanEditor from './OperationPlanEditor';
import './Frontend.css';

const { Sider, Content } = Layout;

interface ChatHistory {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  isMultiAgent?: boolean; // 是否为多智能体对话
}

interface Skill {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface FavoriteFile {
  id: string;
  name: string;
  type: 'file';
}

interface Agent {
  id: string;
  name: string;
  icon: string;
  color: string;
  category: string;
  isMultiAgent?: boolean; // 是否为多智能体协作模式
  multiAgentMembers?: Agent[]; // 多智能体成员
}

interface AgentGroup {
  id: string;
  name: string;
  members: Agent[];
  coordinator?: Agent; // 主智能体（协调者）
  createTime: string;
  pinned?: boolean;
}

interface SubTask {
  id: string;
  taskName: string;
  agentId: string;
  agentName: string;
  agentIcon?: string;
  status: 'pending' | 'dispatched' | 'executing' | 'completed';
  result?: string;
  toolCalls?: ToolCall[];
}

interface CollaborationPlan {
  id: string;
  description: string;
  subTasks: SubTask[];
}

interface ClarificationItem {
  id: string;
  question: string;
  type: 'select' | 'input';
  options?: string[];
  selectedOption?: string;
  inputValue?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'clarification';
  content: string;
  agentId?: string;
  agentName?: string;
  agentIcon?: string;
  timestamp: string;
  thinking?: string;
  toolCalls?: ToolCall[];
  skillCalls?: string[];
  status?: 'thinking' | 'calling' | 'completed' | 'waiting_clarification' | 'planning' | 'dispatching' | 'executing' | 'integrating';
  clarificationQuestion?: string;
  clarificationOptions?: string[];
  // 结构化需求澄清
  clarificationItems?: ClarificationItem[];
  clarificationConfirmed?: boolean;
  // 多智能体协作相关
  collaborationPlan?: CollaborationPlan;
  subTaskResults?: SubTask[];
  isCollaborationResult?: boolean;
}

interface ToolCall {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed';
  result?: string;
}

interface Conversation {
  id: string;
  title: string;
  type: 'agent' | 'group' | 'mixed';
  agents?: Agent[];
  group?: AgentGroup;
  messages: Message[];
  createTime: string;
  deepThinking?: boolean;
  knowledgeBase?: string[];
  uploadedFiles?: UploadedFile[];
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

interface DocPanel {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  sourceMessageId?: string;
}

// ─── 数字员工任务状态 Mock 数据 ──────────────────────────────
const TASK_STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  running:   { bg: '#f0fdf4', color: '#16a34a', label: '执行中' },
  done:      { bg: '#f0f9ff', color: '#0284c7', label: '已完成' },
  failed:    { bg: '#fff1f2', color: '#e11d48', label: '失败' },
  waiting:   { bg: '#fefce8', color: '#ca8a04', label: '等待中' },
};

interface TaskStep {
  id: string;
  name: string;
  status: 'done' | 'running' | 'waiting' | 'failed';
  desc: string;
  time?: string;
  output?: string;
  type?: 'auto' | 'human';    // 自动 or 人工节点
  subtitle?: string;          // 步骤副标题（如"预警研判"）
  icon?: string;              // 步骤图标
}
interface TaskItem {
  id: string;
  title: string;
  status: string;
  time: string;
  startDate?: string;    // e.g. "2026/05/13"
  completedAt?: string;  // e.g. "05/13 18:15:51"
  duration?: string;
  result?: string;
  steps: TaskStep[];
  // 扩展字段 — 用于更丰富的任务卡片 & 详情展示
  meta?: Record<string, string>;  // 结构化元数据（告警编号、位置等）
  priority?: 'high' | 'medium' | 'low';
  progress?: number;              // 0-100
  currentNode?: string;           // 当前所在节点名称
  taskType?: 'scheduled' | 'fixed' | 'chat'; // 定时任务 | 固定流程 | 对话模式
}

const STEP_COLORS: Record<string, { bg: string; color: string; dot: string }> = {
  done:    { bg: '#f0f9ff', color: '#0284c7', dot: '#0284c7' },
  running: { bg: '#f0fdf4', color: '#16a34a', dot: '#16a34a' },
  waiting: { bg: '#fafafa', color: '#9ca3af', dot: '#d1d5db' },
  failed:  { bg: '#fff1f2', color: '#e11d48', dot: '#e11d48' },
};

const MOCK_TASKS: Record<string, TaskItem[]> = {
  'de-012': [
    { id: 'op-t1', title: '220kV变电站年度检修作业方案生成', status: 'done', time: '09:15', startDate: '2026/05/22', completedAt: '05/22 09:17:32', duration: '2m 32s', result: '已匹配方案模板，待填写 13 项内容', taskType: 'chat',
      steps: [
        { id: 's1', name: '材料解析', status: 'done', desc: '解析上传的变电站设计方案文件', time: '09:15:01', output: '共提取 12 页，识别变电站类型：220kV，作业类型：年度检修' },
        { id: 's2', name: '意图识别', status: 'done', desc: 'AI 识别作业场景与类型', time: '09:15:08', output: '识别结果：变电站年度检修，置信度 96%' },
        { id: 's3', name: '模板匹配', status: 'done', desc: '检索能源行业方案模板库', time: '09:15:20', output: '匹配到 3 套模板，推荐：220kV变电站年度检修标准模板 v2.3' },
        { id: 's4', name: '文档生成', status: 'done', desc: '生成可填写的作业方案文档', time: '09:17:32', output: '文档已生成，共 13 处人工待填项，含 3 处图片上传' },
      ],
    },
    { id: 'op-t2', title: '110kV输电线路巡视作业方案生成', status: 'done', time: '16:40', startDate: '2026/05/21', completedAt: '05/21 16:42:10', duration: '2m 10s', result: '方案已生成，用户已完成全部填写', taskType: 'chat',
      steps: [
        { id: 's1', name: '材料解析', status: 'done', desc: '解析巡视路线设计文件', time: '16:40:00', output: '识别输电线路：110kV，巡视类型：定期巡视' },
        { id: 's2', name: '意图识别', status: 'done', desc: 'AI 识别作业类型', time: '16:40:12', output: '作业类型：输电线路巡视，置信度 94%' },
        { id: 's3', name: '模板匹配', status: 'done', desc: '匹配巡视作业方案模板', time: '16:40:30', output: '匹配：110kV输电线路巡视标准方案模板 v1.5' },
        { id: 's4', name: '文档生成', status: 'done', desc: '生成作业方案文档', time: '16:42:10', output: '用户已完成 11 项填写，文档已导出' },
      ],
    },
  ],
  'de-001': [
    { id: 't1', title: '合同风险条款审查 — 供应商协议 v3.pdf', status: 'done', time: '10:32', startDate: '2026/05/13', completedAt: '05/13 10:34:46', duration: '2m 14s', result: '发现 3 处高风险条款，已生成审查报告', taskType: 'fixed',
      steps: [
        { id: 's1', name: '文档解析', status: 'done', desc: '调用 PDF 解析引擎提取全文结构', time: '10:32:01', output: '共提取 47 页，12,340 字，识别到 23 个条款段落' },
        { id: 's2', name: '合规规则匹配', status: 'done', desc: '逐条检索合规知识库规则', time: '10:32:08', output: '命中规则库 312 条，完成条款交叉映射' },
        { id: 's3', name: '风险识别', status: 'done', desc: 'AI 分析高风险语义模式，标注异常条款', time: '10:32:18', output: '识别出 3 处高风险：违约责任上限条款、单方解约权条款、数据归属模糊条款' },
        { id: 's4', name: '报告生成', status: 'done', desc: '生成结构化审查报告并写入在线文档', time: '10:34:15', output: '审查报告已生成，含风险等级标注与修改建议，已推送给法务负责人' },
      ],
    },
    { id: 't2', title: '劳动合同模板合规性校验', status: 'done', time: '09:18', startDate: '2026/05/13', completedAt: '05/13 09:19:05', duration: '1m 05s', result: '合规，无异常项', taskType: 'chat',
      steps: [
        { id: 's1', name: '模板解析', status: 'done', desc: '解析劳动合同模板文档结构', time: '09:18:00', output: '解析完成，共 8 个核心条款段落' },
        { id: 's2', name: '劳动法规则匹配', status: 'done', desc: '对照劳动法、劳动合同法等法规逐条验证', time: '09:18:22', output: '全部条款符合现行法规要求' },
        { id: 's3', name: '校验报告输出', status: 'done', desc: '生成合规校验结论', time: '09:19:05', output: '结论：合规，无异常项，可直接使用' },
      ],
    },
    { id: 't3', title: '公司章程修订合规检查', status: 'running', time: '11:05', startDate: '2026/05/13', taskType: 'scheduled',
      steps: [
        { id: 's1', name: '文档解析', status: 'done', desc: '解析修订版章程文档', time: '11:05:00', output: '解析完成，检测到 15 处修订标记' },
        { id: 's2', name: '修订差异分析', status: 'running', desc: '对比原版与修订版，识别变更影响范围', time: '11:05:30' },
        { id: 's3', name: '公司法合规验证', status: 'waiting', desc: '对照公司法、监管要求验证修订合法性' },
        { id: 's4', name: '报告生成', status: 'waiting', desc: '输出合规检查报告' },
      ],
    },
    { id: 't4', title: '数据安全协议条款提取与风险评估', status: 'waiting', time: '11:06', startDate: '2026/05/13', taskType: 'chat',
      steps: [
        { id: 's1', name: '文档接收', status: 'waiting', desc: '等待用户上传数据安全协议文档' },
        { id: 's2', name: '条款提取', status: 'waiting', desc: '提取数据处理、存储、传输相关条款' },
        { id: 's3', name: '数据安全法规比对', status: 'waiting', desc: '对照数据安全法、个人信息保护法评估风险' },
        { id: 's4', name: '风险报告输出', status: 'waiting', desc: '输出风险等级评估与整改建议' },
      ],
    },
  ],
  'de-002': [
    { id: 't1', title: '批量简历筛选 — Java 高级工程师 (32份)', status: 'done', time: '09:00', startDate: '2026/05/13', completedAt: '05/13 09:04:28', duration: '4m 28s', result: '筛选出 8 份入围，生成候选人对比表', taskType: 'fixed',
      steps: [
        { id: 's1', name: '简历解析', status: 'done', desc: '批量解析 32 份简历文件，提取结构化信息', time: '09:00:00', output: '解析完成：32 份，成功 31 份，1 份格式异常已跳过' },
        { id: 's2', name: 'JD 匹配度打分', status: 'done', desc: '对照岗位要求对每份简历进��多维度评分', time: '09:01:30', output: '平均匹配度 61%，最高 94%（候选人：王某），最低 28%' },
        { id: 's3', name: '筛选与排名', status: 'done', desc: '按匹配度排序，筛选阈值 ≥ 75%', time: '09:03:45', output: '入围 8 人：匹配度 94% / 91% / 88% / 86% / 83% / 81% / 79% / 77%' },
        { id: 's4', name: '对比表生成', status: 'done', desc: '生成候选人多维对比表并写入在线表格', time: '09:04:28', output: '对比表已生成，含技能评分、工作年限、期望薪资、优劣势总结' },
      ],
    },
    { id: 't2', title: '面试时间协调 — 张某某 & 李某某', status: 'done', time: '10:15', startDate: '2026/05/13', completedAt: '05/13 10:15:43', duration: '0m 43s', result: '已同步至系统日历', taskType: 'chat',
      steps: [
        { id: 's1', name: '日历可用性查询', status: 'done', desc: '读取面试官与候选人系统日历空闲时段', time: '10:15:00', output: '检测到 3 个共同空闲时段：3月31日 14:00/15:00/16:00' },
        { id: 's2', name: '时间确认', status: 'done', desc: '发送时间选择消息给候选人，等待确认', time: '10:15:20', output: '候选人张某某选择 14:00，李某某选择 15:30' },
        { id: 's3', name: '日历写入', status: 'done', desc: '创建系统日历事件并发送邀请', time: '10:15:43', output: '日历事件已创建，面试官、候选人均已收到邀请' },
      ],
    },
    { id: 't3', title: '薪酬 Benchmark 报告生成 — 产品经理', status: 'running', time: '11:02', startDate: '2026/05/13', taskType: 'scheduled',
      steps: [
        { id: 's1', name: '市场数据采集', status: 'done', desc: '从薪酬数据库采集产品经理市场薪资数据', time: '11:02:00', output: '采集完成，覆盖 3 个城市、5个行业、2800+ 数据点' },
        { id: 's2', name: '分位数分析', status: 'running', desc: '按城市、行业、工作年限计算薪资分位数', time: '11:02:45' },
        { id: 's3', name: 'Benchmark 报告生成', status: 'waiting', desc: '生成结构化薪酬对标报告' },
      ],
    },
  ],
  'de-006': [
    { id: 't1', title: '日报生成 — 3月29日运营核心指标', status: 'done', time: '08:00', startDate: '2026/05/13', completedAt: '05/13 08:01:12', duration: '1m 12s', result: '已推送工作群', taskType: 'scheduled',
      steps: [
        { id: 's1', name: '数据拉取', status: 'done', desc: '从数仓拉取昨日运营核心指标', time: '08:00:00', output: 'DAU、GMV、转化率、留存率等 18 项指标拉取完成' },
        { id: 's2', name: 'AI 分析', status: 'done', desc: '对异常波动指标进行智能解读', time: '08:00:38', output: '发现 DAU 环比下降 3.2%，AI 判断原因：节假日效应，属正常波动' },
        { id: 's3', name: '报告生成与推送', status: 'done', desc: '生成日报文档，推送至运营工作群', time: '08:01:12', output: '日报已推送，@相关负责人' },
      ],
    },
    { id: 't2', title: '周报生成 — 第13周', status: 'done', time: '08:01', startDate: '2026/05/13', completedAt: '05/13 08:04:07', duration: '3m 07s', result: '已推送邮件订阅列表', taskType: 'scheduled',
      steps: [
        { id: 's1', name: '周数据汇总', status: 'done', desc: '汇总第13周全量运营数据', time: '08:01:00', output: '7天数据汇总完成，含趋势、环比、同比' },
        { id: 's2', name: '亮点 & 问题识别', status: 'done', desc: 'AI 自动识别本周亮点与需关注问题', time: '08:02:10', output: '亮点：新用户增长+12%；问题：付费转化率连续3天下滑' },
        { id: 's3', name: '周报生成', status: 'done', desc: '生成图文周报，含趋势图表', time: '08:03:50', output: '周报生成完成，共 8 页' },
        { id: 's4', name: '邮件推送', status: 'done', desc: '推送至邮件订阅列表（共 23 人）', time: '08:04:07', output: '推送成功，23 人已收到' },
      ],
    },
    { id: 't3', title: '月活用户异常波动预警分析', status: 'failed', time: '10:50', result: '数据源连接超时，已重试 3 次', taskType: 'fixed',
      steps: [
        { id: 's1', name: '数据源连接', status: 'failed', desc: '连接���户行为数仓', time: '10:50:00', output: '连接超时（30s），已自动重试 3 次，均失败。请检查数仓服务状态' },
        { id: 's2', name: '异常检测', status: 'waiting', desc: '等待数据就绪后执行波动检测算法' },
        { id: 's3', name: '预警报告', status: 'waiting', desc: '生成波动原因分析报告' },
      ],
    },
    { id: 't4', title: '竞品流量对比报告', status: 'waiting', time: '11:10', taskType: 'chat',
      steps: [
        { id: 's1', name: '竞品数据采集', status: 'waiting', desc: '从第三方流量平台拉取竞品流量数据' },
        { id: 's2', name: '对比分析', status: 'waiting', desc: '多维度对比本产品与竞品流量结构' },
        { id: 's3', name: '报告生成', status: 'waiting', desc: '输出竞品流量对比分析报告' },
      ],
    },
  ],
  'de-009': [
    {
      id: 't-901', title: '供应商框架协议合同审核 — 华为技术有限公司.pdf', status: 'done', time: '10:15', startDate: '2026/05/13', completedAt: '05/13 10:18:42', duration: '3m 42s', taskType: 'fixed' as const,
      result: '发现 2 处高风险条款，已生成审核报告并触发人工确认',
      steps: [
        { id: 's1', name: '文档解析', status: 'done', desc: '调用 PDF 解析引擎提取合同全文结构', time: '10:15:01', output: '共提取 28 页，8,640 字，识别到 18 个核心条款段落' },
        { id: 's2', name: '法律规则匹配', status: 'done', desc: '检索法律法规库，完成条款交叉映射', time: '10:15:18', output: '命中合规规则 203 条，涉及民法典、合同法、数据安全法' },
        { id: 's3', name: '风险条款识别', status: 'done', desc: 'AI 多步推理识别高风险语义模式', time: '10:15:44', output: '识别到 2 处高风险：第11条「违约赔偿上限」、第16条「数据归属权」' },
        { id: 's4', name: '人工确认 · 风险条款1', status: 'done', desc: '等待法务人员确认第11条处置方案', time: '10:16:30', output: '法务已确认：建议修改违约赔偿上限为合同总价30%，对方接受' },
        { id: 's5', name: '人工确认 · 风险条款2', status: 'done', desc: '等待法务人员确认第16条处置方案', time: '10:17:05', output: '法务已确认：增加数据归属权补充协议，需对方法务盖章' },
        { id: 's6', name: '审核报告生成', status: 'done', desc: '汇总审核结论，生成结构化报告', time: '10:18:43', output: '审核报告已生成，含风险说明与修改建议，已推送至在线文档' },
      ],
    },
    {
      id: 't-902', title: '劳动合同批量审核 — 新入职员工（8份）', status: 'running', time: '11:05', taskType: 'chat' as const,
      steps: [
        { id: 's1', name: '批量文档解析', status: 'done', desc: '批量解析8份劳动合同，提取关键条款', time: '11:05:00', output: '8份文档解析完成，共提取薪酬、试用期、竞业限制等核心条款' },
        { id: 's2', name: '劳动法规则匹配', status: 'done', desc: '对照劳动法、劳动合同法逐条核验', time: '11:05:40', output: '发现1处疑似问题：合同#5试用期约定超过法定上限' },
        { id: 's3', name: '风险条款识别', status: 'running', desc: 'AI 分析竞业限制条款合规性', time: '11:06:10' },
        { id: 's4', name: '人工确认', status: 'waiting', desc: '待AI识别完成后触发人工复核' },
        { id: 's5', name: '审核报告生成', status: 'waiting', desc: '汇总所有合同审核结论输出报告' },
      ],
    },
    {
      id: 't-903', title: '数据安全协议条款提取与风险评估 — 某云服务商', status: 'waiting', time: '11:20', taskType: 'chat' as const,
      steps: [
        { id: 's1', name: '文档接收', status: 'waiting', desc: '等待用户上传数据安全协议文档' },
        { id: 's2', name: '数据条款提取', status: 'waiting', desc: '提取数据处理、存储、传输等关键条款' },
        { id: 's3', name: '数据安全法规比对', status: 'waiting', desc: '对照数据安全法、个人信息保护法评估风险' },
        { id: 's4', name: '人工确认高风险条款', status: 'waiting', desc: 'AI识别高风险条款后触发人工确认' },
        { id: 's5', name: '风险评估报告输出', status: 'waiting', desc: '输出风险等级评估与整改建议' },
      ],
    },
  ],
};

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #6366F1, #8B5CF6)',
  'linear-gradient(135deg, #3B82F6, #06B6D4)',
  'linear-gradient(135deg, #10B981, #34d399)',
  'linear-gradient(135deg, #F59E0B, #FBBF24)',
  'linear-gradient(135deg, #EF4444, #F87171)',
  'linear-gradient(135deg, #8B5CF6, #EC4899)',
];
function empGradient(name: string) {
  let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_GRADIENTS[Math.abs(h) % AVATAR_GRADIENTS.length];
}


// ─── 动态执行流：阶段定义 ──────────────────────────────────
interface PipeStage {
  id: string; label: string; icon: string; type: 'auto' | 'human';
  desc: string; logs: Array<{ text: string; kind: 'info' | 'ok' | 'warn' | 'data' }>;
}

const INSPECT_PIPE: PipeStage[] = [
  { id: 'trigger',  label: '预警接收', icon: '🔔', type: 'auto',
    desc: '多源传感器告警聚合上报',
    logs: [
      { text: '[光纤] K42+300 振动强度 3.8g，持续 42s，超阈', kind: 'warn' },
      { text: '[视觉] 摄像头 #12 热成像异常帧 ×8',             kind: 'warn' },
      { text: '[无人机] UAV-031 发现疑似机械作业',              kind: 'warn' },
      { text: '预警事件已聚合，编号 EVT-007-0329',              kind: 'ok'   },
    ],
  },
  { id: 'pickup',   label: '员工接单', icon: '🤖', type: 'auto',
    desc: '智能巡检助手自动接收任务并初始化',
    logs: [
      { text: '智能巡检助手已接单',                             kind: 'ok'   },
      { text: '任务 ID: T-2026-0329-007 已创建',               kind: 'info' },
      { text: '初始化多源数据接口...',                          kind: 'info' },
    ],
  },
  { id: 'collect',  label: '多源采集', icon: '📡', type: 'auto',
    desc: '整合光纤 / 机器视觉 / 无人机三路实时数据',
    logs: [
      { text: '光纤振动序列已接入 (近10min 原始波形) ✓',       kind: 'ok'   },
      { text: '机器视觉 8 帧异常图像已接入 ✓',                 kind: 'ok'   },
      { text: '无人机实时坐标流已接入 ✓',                      kind: 'ok'   },
      { text: '三路数据时间戳对齐完成',                         kind: 'data' },
    ],
  },
  { id: 'validate', label: '交叉验证', icon: '🔄', type: 'auto',
    desc: 'AI 模型对三路数据交叉比对，判断一致性',
    logs: [
      { text: '模型 A (光纤)   → 置信度 88.4%',               kind: 'data' },
      { text: '模型 B (视觉)   → 置信度 91.2%',               kind: 'data' },
      { text: '模型 C (无人机) → 置信度 79.6%',               kind: 'data' },
      { text: '综合置信度 86.4% > 阈值 75%，预警属实',         kind: 'ok'   },
    ],
  },
  { id: 'human',    label: '人工复核', icon: '👤', type: 'human',
    desc: '二级预警触发人工复核机制，等待值班人员确认',
    logs: [
      { text: '⚠️ 预警达到二级阈值，启动人工复核',             kind: 'warn' },
      { text: '已推送至值班人员 [张工]',                        kind: 'info' },
      { text: '等待人工确认中...',                              kind: 'info' },
      { text: '✅ 张工已确认，预警属实，继续处理',              kind: 'ok'   },
    ],
  },
  { id: 'judge',    label: '研判登记', icon: '🧠', type: 'auto',
    desc: '综合评级 + 历史比对 + 知识库沉淀',
    logs: [
      { text: '风险等级评定: 二级（中度风险）',                 kind: 'data' },
      { text: '匹配历史相似事件 3 条',                          kind: 'data' },
      { text: '研判结论已写入知识库',                           kind: 'ok'   },
      { text: '当前置信度样本已沉淀为训练数据',                 kind: 'info' },
    ],
  },
  { id: 'rule',     label: '派单规则', icon: '📋', type: 'auto',
    desc: '规则引擎匹配区域/等级/时段最优派单策略',
    logs: [
      { text: '规则匹配开始（共 24 条活跃规则）',               kind: 'info' },
      { text: '命中 R-017: 二级预警 → 维修队 A',               kind: 'data' },
      { text: '命中 R-022: 光纤异常 → 光纤专项组',             kind: 'data' },
      { text: '派单方案: 维修队 A + 光纤专项组联合响应',        kind: 'ok'   },
    ],
  },
  { id: 'dispatch', label: '工单派发', icon: '📤', type: 'auto',
    desc: '生成工单并推送给相关人员，同步监管平台',
    logs: [
      { text: '工单 WO-2026-0329-112 已生成',                  kind: 'ok'   },
      { text: '通知维修队 A (李队长) ✓',                       kind: 'ok'   },
      { text: '通知光纤专项组 ✓',                              kind: 'ok'   },
      { text: '上报监管平台 ✓  |  工单状态: 已派发',           kind: 'ok'   },
    ],
  },
];

const PATROL_DEMO_PIPE: PipeStage[] = [
  { id: 'trigger',  label: '隐患感知', icon: '🛰️', type: 'auto',
    desc: '多源传感器+AI巡护模型实时监测管道沿线',
    logs: [
      { text: '[卫星遥感] 第三方施工变化检测，发现 2 处新增地物', kind: 'warn' },
      { text: '[光纤DAS] K85+200 段异常振动事件，频率特征匹配挖掘', kind: 'warn' },
      { text: '[无人机] UAV-056 航拍识别到疑似管道占压区域',        kind: 'warn' },
      { text: '隐患事件已聚合，编号 HZD-008-0410',                 kind: 'ok'   },
    ],
  },
  { id: 'pickup',   label: '助手接管', icon: '🤖', type: 'auto',
    desc: '智能巡检demo自动接管隐患事件并初始化处理流程',
    logs: [
      { text: '智能巡检demo已接管事件 HZD-008-0410',            kind: 'ok'   },
      { text: '调用巡护知识库加载该区段历史隐患记录...',             kind: 'info' },
      { text: '历史隐患 3 条已关联，风险趋势分析启动',              kind: 'data' },
    ],
  },
  { id: 'assess',   label: '风险评估', icon: '📊', type: 'auto',
    desc: 'AI模型综合地质、管道参数、施工距离等因素评估风险等级',
    logs: [
      { text: '管道埋深 1.8m，壁厚 14.6mm，防腐层状态良好',        kind: 'data' },
      { text: '施工点距管道中心线 4.2m，低于安全距离 5m',           kind: 'warn' },
      { text: '地质评估：粉质粘土，承载力中等',                     kind: 'data' },
      { text: '综合风险等级：三级（中度风险），建议现场核查',        kind: 'ok'   },
    ],
  },
  { id: 'route',    label: '路线规划', icon: '🗺️', type: 'auto',
    desc: '基于GIS与实时路况为巡护队规划最优到达路线',
    logs: [
      { text: 'GIS 数据加载完成，管段 K84~K87 路网解析中',         kind: 'info' },
      { text: '最优路线：站场A→G304国道→乡道X023，全程 12.8km',    kind: 'data' },
      { text: '预计到达时间 22min（实时路况已计入）',               kind: 'data' },
      { text: '路线已推送至巡护队张队长终端',                       kind: 'ok'   },
    ],
  },
  { id: 'human',    label: '调度确认', icon: '👤', type: 'human',
    desc: '调度中心确认派单方案与巡护资源分配',
    logs: [
      { text: '⚠️ 三级隐患需调度中心确认后派单',                   kind: 'warn' },
      { text: '已推送至调度中心 [王主任]',                          kind: 'info' },
      { text: '等待调度确认中...',                                  kind: 'info' },
      { text: '✅ 王主任已确认，授权派出巡护一队',                  kind: 'ok'   },
    ],
  },
  { id: 'dispatch', label: '任务下达', icon: '📤', type: 'auto',
    desc: '生成巡护工单并同步至各相关系统',
    logs: [
      { text: '巡护工单 PT-2026-0410-018 已生成',                   kind: 'ok'   },
      { text: '通知巡护一队（张队长 + 2名队员）✓',                 kind: 'ok'   },
      { text: '无人机复飞任务已下达 UAV-056 ✓',                    kind: 'ok'   },
      { text: '监管平台已同步 ✓  |  工单状态：已派发',             kind: 'ok'   },
    ],
  },
  { id: 'track',    label: '闭环追踪', icon: '🔄', type: 'auto',
    desc: '持续追踪现场处置进展直至工单闭环',
    logs: [
      { text: '巡护队已出发，实时定位追踪中...',                    kind: 'info' },
      { text: '到达现场，开始核查（照片/视频实时回传）',            kind: 'data' },
      { text: '现场确认：第三方施工，已要求停工整改',               kind: 'ok'   },
      { text: '工单闭环 ✓ | 隐患数据已沉淀至知识库',              kind: 'ok'   },
    ],
  },
];

const GENERIC_PIPE: PipeStage[] = [
  { id: 'trigger',  label: '任务触发', icon: '📋', type: 'auto',
    desc: '任务请求已接收，识别类型并分配员工',
    logs: [
      { text: '任务请求已接收',                                 kind: 'info' },
      { text: '任务类型识别完成',                               kind: 'data' },
      { text: '已分配至对应数字员工',                           kind: 'ok'   },
    ],
  },
  { id: 'pickup',   label: '员工接单', icon: '🤖', type: 'auto',
    desc: '数字员工确认接单，初始化执行上下文',
    logs: [
      { text: '员工接单确认',                                   kind: 'ok'   },
      { text: '执行上下文初始化完成',                           kind: 'info' },
      { text: '开始任务执行',                                   kind: 'info' },
    ],
  },
  { id: 'execute',  label: '任务执行', icon: '⚙️', type: 'auto',
    desc: '按步骤执行核心任务逻辑',
    logs: [
      { text: '步骤 1/3: 数据准备完成',                        kind: 'ok'   },
      { text: '步骤 2/3: 核心处理执行中...',                   kind: 'info' },
      { text: '步骤 3/3: 结果整理中...',                       kind: 'info' },
      { text: '核心逻辑执行完成，准确率 96.3%',                kind: 'data' },
    ],
  },
  { id: 'validate', label: '结果校验', icon: '🔍', type: 'auto',
    desc: '自动校验输出结果的准确性与完整性',
    logs: [
      { text: '格式校验通过',                                   kind: 'ok'   },
      { text: '数据完整性校验通过',                             kind: 'ok'   },
      { text: '质量评分 96.3 / 100',                           kind: 'data' },
    ],
  },
  { id: 'human',    label: '人工确认', icon: '👤', type: 'human',
    desc: '关键结果需负责人审核确认后方可交付',
    logs: [
      { text: '⚠️ 需人工确认后交付',                           kind: 'warn' },
      { text: '已推送至负责人',                                 kind: 'info' },
      { text: '等待确认中...',                                  kind: 'info' },
      { text: '✅ 负责人已确认，准予交付',                      kind: 'ok'   },
    ],
  },
  { id: 'deliver',  label: '输出交付', icon: '✅', type: 'auto',
    desc: '结果交付至目标系统，任务完成归档',
    logs: [
      { text: '结果已交付至目标系统',                           kind: 'ok'   },
      { text: '任务归档完成',                                   kind: 'info' },
      { text: '执行数据已沉淀',                                 kind: 'info' },
    ],
  },
];

// ─── 动态执行流组件 ────────────────────────────────────────
const LiveExecutionFlow: React.FC<{ task: TaskItem; isInspect: boolean; pipeType?: 'inspect' | 'patrol-demo' | 'generic' }> = ({ task, isInspect, pipeType }) => {
  const stages = pipeType === 'patrol-demo' ? PATROL_DEMO_PIPE : isInspect ? INSPECT_PIPE : GENERIC_PIPE;

  // 根据任务状态确定初始已完成阶段数
  const initDone = React.useMemo(() => {
    if (task.status === 'done')    return stages.length;
    if (task.status === 'running') return Math.max(1, Math.floor(stages.length * 0.45));
    return 0;
  }, [task.id, task.status, stages.length]);

  const [doneCount,  setDoneCount]  = React.useState(initDone);
  const [activeIdx,  setActiveIdx]  = React.useState(task.status === 'done' ? -1 : initDone);
  const [logs,       setLogs]       = React.useState<Array<{ text: string; kind: string; ts: string }>>([]);
  const [humanOk,   setHumanOk]    = React.useState(task.status === 'done');
  const [paused,    setPaused]      = React.useState(false);
  const [reviewChoice, setReviewChoice] = React.useState('');
  const [reviewSupplement, setReviewSupplement] = React.useState('');
  const logRef  = React.useRef<HTMLDivElement>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const getTs = () => new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const pushLogs = React.useCallback((stageIdx: number) => {
    const s = stages[stageIdx];
    if (!s) return;
    s.logs.forEach((l, i) => {
      setTimeout(() => {
        setLogs(prev => [...prev.slice(-60), { text: l.text, kind: l.kind, ts: getTs() }]);
      }, i * 340);
    });
  }, [stages]);

  // 初始化：已完成阶段的日志一次性填入
  React.useEffect(() => {
    const allLogs: Array<{ text: string; kind: string; ts: string }> = [];
    const cnt = task.status === 'done' ? stages.length : initDone;
    for (let i = 0; i < cnt; i++) {
      stages[i].logs.forEach(l => allLogs.push({ text: l.text, kind: l.kind, ts: getTs() }));
    }
    setLogs(allLogs);
    setDoneCount(initDone);
    setActiveIdx(task.status === 'done' ? -1 : initDone);
    setHumanOk(task.status === 'done');
    setPaused(false);
  }, [task.id]);

  // 自动推进（仅 running / waiting 任务）
  React.useEffect(() => {
    if (task.status === 'done' || paused) return;
    if (activeIdx < 0 || activeIdx >= stages.length) return;

    const cur = stages[activeIdx];
    if (!cur) return;

    // 人工节点：等待用户操作
    if (cur.type === 'human' && !humanOk) return;

    const delay = cur.type === 'human' ? 400 : 1800 + Math.random() * 800;
    timerRef.current = setTimeout(() => {
      pushLogs(activeIdx);
      setTimeout(() => {
        setDoneCount(d => d + 1);
        setActiveIdx(a => a + 1);
      }, cur.logs.length * 340 + 200);
    }, delay);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [activeIdx, humanOk, paused, task.status]);

  // 滚动日志到底部
  React.useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const nodeColor = (idx: number) => {
    if (idx < doneCount)      return '#16a34a';
    if (idx === activeIdx)    return stages[idx]?.type === 'human' ? '#d97706' : '#6366F1';
    return '#d1d5db';
  };
  const nodeBg = (idx: number) => {
    if (idx < doneCount)      return '#f0fdf4';
    if (idx === activeIdx)    return stages[idx]?.type === 'human' ? '#fefce8' : '#EEF2FF';
    return '#f9fafb';
  };
  const logColor = (kind: string) => ({
    ok:   '#4ade80', warn: '#fbbf24', data: '#818cf8', info: '#94a3b8',
  }[kind] ?? '#94a3b8');

  const curStage = activeIdx >= 0 && activeIdx < stages.length ? stages[activeIdx] : null;
  const isHumanPending = curStage?.type === 'human' && !humanOk;

  return (
    <div style={{ padding: '14px 18px', background: '#fff', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
      {/* 标题行 */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>执行流程</span>
        {task.status === 'done' ? (
          <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 20, fontWeight: 600, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>已完成</span>
        ) : task.status === 'running' ? (
          <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 20, fontWeight: 600, background: '#fff7ed', color: '#d97706', border: '1px solid #fed7aa' }}>执行中</span>
        ) : (
          <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 20, fontWeight: 600, background: '#f3f4f6', color: '#9ca3af', border: '1px solid #e5e7eb' }}>待执行</span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {task.status !== 'done' && (
            <button
              onClick={() => setPaused(p => !p)}
              style={{ padding: '2px 10px', borderRadius: 5, border: '1px solid #e0deff', background: '#f5f4ff', color: '#6366F1', fontSize: 11, cursor: 'pointer', fontWeight: 500 }}
            >
              {paused ? '▶ 继续' : '⏸ 暂停'}
            </button>
          )}
        </div>
      </div>

      {/* ── 节点管道（参考设计：渐变线 + 圆点 + 箭头当前节点） ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 4, gap: 0 }}>
        {stages.map((stage, idx) => {
          const done    = idx < doneCount;
          const active  = idx === activeIdx;
          const isLast  = idx === stages.length - 1;
          const isHuman = stage.type === 'human';
          const activeColor = isHuman && !humanOk ? '#d97706' : '#4F46E5';
          // 连接线：done→done 用渐变蓝，done→active 用蓝色，其余灰色
          const lineColor = done
            ? 'linear-gradient(90deg, #818cf8 0%, #4338ca 100%)'
            : '#e5e7eb';
          return (
            <React.Fragment key={stage.id}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, minWidth: 52 }}>
                {/* 节点 */}
                {active ? (
                  // 当前节点：实心右箭头（pentagon 形状）
                  <div
                    className={isHuman && !humanOk ? 'pipe-node-human' : 'pipe-node-active'}
                    style={{
                      width: 22, height: 16,
                      background: activeColor,
                      clipPath: 'polygon(0% 0%, 72% 0%, 100% 50%, 72% 100%, 0% 100%)',
                      transition: 'all 0.3s',
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  // 已完成：实心蓝圆；待执行：灰色空圆
                  <div style={{
                    width: 12, height: 12, borderRadius: '50%',
                    background: done ? '#4F46E5' : 'transparent',
                    border: `2px solid ${done ? '#4F46E5' : '#d1d5db'}`,
                    flexShrink: 0,
                    transition: 'all 0.3s',
                  }} />
                )}
                {/* 步骤标签 */}
                <div style={{
                  fontSize: 11, marginTop: 8,
                  color: active ? activeColor : done ? '#374151' : '#9ca3af',
                  fontWeight: active ? 700 : done ? 500 : 400,
                  textAlign: 'center', lineHeight: 1.3,
                  whiteSpace: 'nowrap',
                }}>
                  {stage.label}
                </div>
              </div>

              {/* 连接线 */}
              {!isLast && (
                <div style={{
                  flex: 1, height: 3, minWidth: 14,
                  marginBottom: 28,  // 对齐节点中心（label 高度补偿）
                  background: lineColor,
                  borderRadius: 2,
                  transition: 'background 0.3s',
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ── 当前阶段说明 + 人工复核表单 ── */}
      {curStage && (
        <div style={{ marginTop: 10 }}>
          {!isHumanPending ? (
            <div style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e0deff', background: '#f5f4ff' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#4338CA' }}>▶ {curStage.label} 执行中</span>
              <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{curStage.desc}</div>
            </div>
          ) : (
            /* ── Cursor 对话式人工复核卡片 ── */
            <div style={{ borderRadius: 10, border: '1px solid #e8e8f0', background: '#fff', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              {/* 头部：像 AI 消息发送者 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid #f3f4f6', background: '#fafafa' }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg,#d97706,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 700, flexShrink: 0 }}>⏸</div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>需要你的确认</span>
                <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 2 }}>· Human-in-the-loop</span>
              </div>

              {/* 消息体：阶段描述 */}
              <div style={{ padding: '12px 14px 10px', fontSize: 12, color: '#4b5563', lineHeight: 1.7 }}>
                {curStage.desc}
              </div>

              {/* 操作 chip 行 */}
              <div style={{ padding: '0 14px 12px', display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                {[
                  { label: '✓ 确认通过', value: 'approve', bg: '#f0fdf4', border: '#86efac', activeBg: '#16a34a', activeColor: '#fff', defaultColor: '#15803d' },
                  { label: '↩ 需要调整', value: 'adjust',  bg: '#fff7ed', border: '#fed7aa', activeBg: '#d97706', activeColor: '#fff', defaultColor: '#b45309' },
                  { label: '⬇ 降级跟踪', value: 'downgrade', bg: '#f8fafc', border: '#e2e8f0', activeBg: '#475569', activeColor: '#fff', defaultColor: '#64748b' },
                ].map(({ label, value, bg, border, activeBg, activeColor, defaultColor }) => {
                  const active = reviewChoice === value;
                  return (
                    <button
                      key={value}
                      onClick={() => setReviewChoice(active ? '' : value)}
                      style={{
                        padding: '5px 13px', borderRadius: 20, fontSize: 12, fontWeight: active ? 600 : 500, cursor: 'pointer', transition: 'all 0.15s',
                        background: active ? activeBg : bg,
                        border: `1.5px solid ${active ? activeBg : border}`,
                        color: active ? activeColor : defaultColor,
                        boxShadow: active ? '0 2px 6px rgba(0,0,0,0.12)' : 'none',
                      }}
                    >{label}</button>
                  );
                })}
              </div>

              {/* 补充输入（选中后滑出） */}
              {reviewChoice && (
                <div style={{ padding: '0 14px 12px', animation: 'fadeSlideIn 0.15s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 10px 6px 12px' }}>
                    <input
                      autoFocus
                      value={reviewSupplement}
                      onChange={e => setReviewSupplement(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          setHumanOk(true); setReviewChoice(''); setReviewSupplement('');
                        }
                      }}
                      placeholder="补充说明（可选，Enter 提交）..."
                      style={{ flex: 1, border: 'none', outline: 'none', fontSize: 12, background: 'transparent', color: '#374151', fontFamily: 'inherit' }}
                    />
                    <button
                      onClick={() => { setHumanOk(true); setReviewChoice(''); setReviewSupplement(''); }}
                      style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                    >↑</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

// ─── 数字员工前台面板：Feishu 风格 IM 界面 ────────────────────
// kind: normal=普通气泡 step=行内步骤文字 tool-call=工具调用卡片 human-pending=人工确认卡片
interface ToolCard {
  toolName: string;
  request: string;   // JSON string shown in 请求参数 block
  response: string;  // JSON string shown in 返回结果 block
  requestOpen?: boolean;
  responseOpen?: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  time: string;
  empId?: string;
  empName?: string;
  kind?: 'normal' | 'step' | 'tool-call' | 'human-pending' | 'op-template-select';
  toolCard?: ToolCard;
}

interface IMConversation {
  id: string;
  type: 'single' | 'group';
  empIds: string[];
  name: string;
  messages: ChatMessage[];
  pinned: boolean;
  lastTime: string;
  lastText: string;
}

interface UploadedDoc {
  id: string;
  name: string;
  size: number;
}

const IM_GRADIENTS = [
  'linear-gradient(135deg,#6366F1,#8B5CF6)',
  'linear-gradient(135deg,#3B82F6,#06B6D4)',
  'linear-gradient(135deg,#10B981,#34d399)',
  'linear-gradient(135deg,#F59E0B,#FBBF24)',
  'linear-gradient(135deg,#EF4444,#F87171)',
  'linear-gradient(135deg,#8B5CF6,#EC4899)',
];

function imEmpGradient(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return IM_GRADIENTS[Math.abs(h) % IM_GRADIENTS.length];
}

const INIT_CONVERSATIONS: IMConversation[] = [
  {
    id: 'conv-1', type: 'single', empIds: ['de-001'], name: '法务合规助手',
    pinned: true, lastTime: '11:32', lastText: '合同审查任务已完成',
    messages: [
      { id: 'm1', role: 'bot', text: '您好！我是法务合规助手，请问有什么可以帮您？', time: '10:00', empId: 'de-001', empName: '法务合规助手' },
      { id: 'm2', role: 'user', text: '帮我审查一份供应商合同', time: '11:30' },
      { id: 'm3', role: 'bot', text: '好的，合同审查任务已完成，发现 3 处风险条款，已标注说明。可以在左侧任务列表查看详细报告。', time: '11:32', empId: 'de-001', empName: '法务合规助手' },
    ],
  },
  {
    id: 'conv-2', type: 'single', empIds: ['de-002'], name: 'HR 招聘助手',
    pinned: false, lastTime: '10:15', lastText: '面试时间已同步至系统日历',
    messages: [
      { id: 'm4', role: 'bot', text: '您好！我是 HR 招聘助手，支持简历筛选、面试安排和薪酬对标，请问有什么可以帮您？', time: '09:00', empId: 'de-002', empName: 'HR 招聘助手' },
      { id: 'm5', role: 'user', text: '帮我安排两位候选人的面试时间', time: '10:10' },
      { id: 'm6', role: 'bot', text: '面试时间已协调完成，已同步至系统日历，面试官和候选人均已收到邀请。', time: '10:15', empId: 'de-002', empName: 'HR 招聘助手' },
    ],
  },
  {
    id: 'conv-3', type: 'single', empIds: ['de-006'], name: '运营数据助手',
    pinned: false, lastTime: '08:01', lastText: '日报已推送至运营工作群',
    messages: [
      { id: 'm7', role: 'bot', text: '您好！我是运营数据助手，负责日报、周报自动生成和运营指标监控，请问有什么需要？', time: '08:00', empId: 'de-006', empName: '运营数据助手' },
      { id: 'm8', role: 'user', text: '今天的日报生成了吗？', time: '08:00' },
      { id: 'm9', role: 'bot', text: '今日日报已生成并推送至运营工作群，本日 DAU 环比昨日持平，可在左侧任务列表查看详情。', time: '08:01', empId: 'de-006', empName: '运营数据助手' },
    ],
  },
  {
    id: 'conv-4', type: 'single', empIds: ['de-009'], name: '合同审核助手',
    pinned: true, lastTime: '14:05', lastText: '合同已完成 AI 审核，发现 2 处高风险条款',
    messages: [
      { id: 'c1', role: 'bot', text: '您好！我是合同审核助手，支持合同全文解析、风险条款识别与法律依据匹配。审核过程会在关键节点请您确认，确保结论准确可靠。请上传需要审核的合同文件或直接描述审核需求。', time: '13:50', empId: 'de-009', empName: '合同审核助手', kind: 'normal' },
    ],
  },
  {
    id: 'conv-5', type: 'single', empIds: ['de-012'], name: '作业方案助手',
    pinned: false, lastTime: '09:15', lastText: '已为您匹配 3 套方案模板，请选择',
    messages: [
      { id: 'op-m1', role: 'bot', kind: 'normal', text: '您好！我是作业方案助手，专注于能源行业作业方案生成。\n\n请上传背景材料或设计方案（支持 PDF / Word / 图片），我将自动识别作业类型并为您匹配对应的方案模板。', time: '09:00', empId: 'de-012', empName: '作业方案助手' },
    ],
  },
];

// ── 技能透明展示 ──────────────────────────────────────────
const AGENT_SKILLS: Record<string, { name: string; icon: string; desc: string }[]> = {
  '法务合规助手': [
    { name: '法律法规检索', icon: '⚖️', desc: '检索相关法律法规条文' },
    { name: 'PDF 解析',    icon: '📄', desc: '解析文件内容' },
    { name: '消息推送',    icon: '🔔', desc: '发送通知至消息渠道' },
  ],
  '合同审核助手': [
    { name: 'PDF 解析',      icon: '📄', desc: '解析合同文件' },
    { name: '法律法规检索',  icon: '⚖️', desc: '检索相关法律条文' },
    { name: '合同风险识别',  icon: '🔍', desc: '识别合同中的风险条款' },
  ],
  'HR 招聘助手': [
    { name: '简历解析',    icon: '📋', desc: '结构化解析候选人简历' },
    { name: '日程预约',    icon: '📅', desc: '自动安排面试日程' },
    { name: '消息推送',    icon: '🔔', desc: '面试通知发送至消息渠道' },
  ],
  '智能客服分发': [
    { name: '意图识别',    icon: '🎯', desc: '分析用户意图并路由' },
    { name: '知识库检索',  icon: '🔎', desc: '检索产品与服务知识库' },
    { name: '工单创建',    icon: '📝', desc: '自动生成客服工单' },
  ],
  '运营数据助手': [
    { name: '数据报表生成', icon: '📊', desc: '生成运营分析报表' },
    { name: '知识库检索',  icon: '🔎', desc: '检索运营知识库' },
    { name: '消息推送',    icon: '🔔', desc: '推送报表至工作群' },
  ],
  '作业方案助手': [
    { name: '意图识别',   icon: '🎯', desc: '识别上传材料的作业类型与场景' },
    { name: '模板匹配',   icon: '📋', desc: '匹配对应的能源行业方案模板' },
    { name: '文档生成',   icon: '📝', desc: '生成可在线填写的作业方案文档' },
    { name: 'WPS 集成',  icon: '📄', desc: '在线文档编辑与人工待填项引导' },
  ],
};

// ── 通讯录统一联系人条目 ────────────────────────────────────
type ContactEntryType = 'single' | 'group';

interface ContactEntry {
  id: string;                      // 单员工 → empId；群聊 → 'cg-x'
  type: ContactEntryType;
  name: string;
  empIds: string[];                // 单员工只有一个 id
  // 群聊专属
  groupStatus?: 'active' | 'idle' | 'meeting' | 'busy';
  groupAvatar?: string;            // 自定义头像 emoji
  lastText: string;
  lastTime: string;
  unread?: number;
  sortOrder: number;               // 创建顺序
}

// 初始通讯录：仅单员工
const INIT_CONTACT_LIST: ContactEntry[] = [
  { id: 'de-001', type: 'single', name: '法务合规助手', empIds: ['de-001'],
    lastText: '合同审查任务已完成，发现 3 处风险条款', lastTime: '11:32', sortOrder: 1 },
  { id: 'de-009', type: 'single', name: '合同审核助手', empIds: ['de-009'],
    lastText: '合同已完成 AI 审核，发现 2 处高风险条款', lastTime: '14:05', sortOrder: 2 },
  { id: 'de-002', type: 'single', name: 'HR 招聘助手', empIds: ['de-002'],
    lastText: '薪酬 Benchmark 报告生成中', lastTime: '11:08', sortOrder: 3 },
  { id: 'de-006', type: 'single', name: '运营数据助手', empIds: ['de-006'],
    lastText: '本周周报已推送至邮件列表（23人）', lastTime: '09:00', sortOrder: 4 },
  { id: 'de-010', type: 'single', name: '公文处理助手', empIds: ['de-010'],
    lastText: '公文草稿已生成，请确认后发送', lastTime: '10:20', sortOrder: 5 },
  { id: 'de-011', type: 'single', name: '会议纪要助手', empIds: ['de-011'],
    lastText: '本次会议纪要已整理完毕', lastTime: '15:30', sortOrder: 6 },
  { id: 'de-012', type: 'single', name: '作业方案助手', empIds: ['de-012'],
    lastText: '已为您匹配 3 套方案模板，请选择', lastTime: '09:15', sortOrder: 7 },
];

export const DigitalEmployeePanel: React.FC = () => {
  // ── 状态变量 ──
  const [search, setSearch] = React.useState('');
  const [convSearch, setConvSearch] = React.useState('');
  // 统一通讯录列表（群聊 + 单员工混合）
  const [contactList, setContactList] = React.useState<ContactEntry[]>(INIT_CONTACT_LIST);
  const [extraTasks, setExtraTasks] = React.useState<Record<string, TaskItem[]>>({});
  const [followedUpNotifs, setFollowedUpNotifs] = React.useState<Set<string>>(new Set());
  const [taskDateFrom, setTaskDateFrom] = React.useState('');
  const [taskDateTo, setTaskDateTo] = React.useState('');
  const [taskFilterOpen, setTaskFilterOpen] = React.useState(false);
  // 通讯录右键菜单
  const [contactMenuId, setContactMenuId] = React.useState<string | null>(null);
  const [conversations, setConversations] = React.useState<IMConversation[]>(INIT_CONVERSATIONS);
  const [activeConvId, setActiveConvId] = React.useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);
  const [taskFilter, setTaskFilter] = React.useState<'all' | 'running' | 'overtime' | 'done'>('all');
  const [taskTypeFilter, setTaskTypeFilter] = React.useState<'all' | 'scheduled' | 'fixed' | 'chat'>('all');
  const [taskSearch, setTaskSearch] = React.useState('');
  const [chatInput, setChatInput] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [deepThink, setDeepThink] = React.useState(false);
  const [uploadedDocs, setUploadedDocs] = React.useState<UploadedDoc[]>([]);
  const [contextMenuConvId, setContextMenuConvId] = React.useState<string | null>(null);
  const [ratingOpen, setRatingOpen] = React.useState(false);
  const [hoverRating, setHoverRating] = React.useState(0);
  const [submittedRating, setSubmittedRating] = React.useState(0);
  const [openedFromContacts, setOpenedFromContacts] = React.useState(false);
  // ── 通知中心 ──
  const [notifPanelOpen, setNotifPanelOpen] = React.useState(false);
  const [readNotifIds, setReadNotifIds] = React.useState<Set<string>>(new Set());
  // ── 右侧任务面板展开/收起 ──
  // ── WPS 作业方案编辑器 ──
  const [showOpPlanEditor, setShowOpPlanEditor] = React.useState(false);
  const [opPlanTemplate, setOpPlanTemplate] = React.useState('');
  const [rightPanelCollapsed, setRightPanelCollapsed] = React.useState(false);
  const [rightPanelWidth, setRightPanelWidth] = React.useState(290);

  // ── Agent（de-009 合同审核）状态 ──
  const [agentPendingMsgId, setAgentPendingMsgId] = React.useState<string | null>(null);
  const [agentReviewChoice, setAgentReviewChoice] = React.useState('');
  const [agentReviewSupplement, setAgentReviewSupplement] = React.useState('');
  const agentReviewChoiceRef = React.useRef('');
  const agentReviewSupplementRef = React.useRef('');
  const agentContinueFnRef = React.useRef<(() => void) | null>(null);
  // tool-call 折叠状态：msgId -> { req: bool, res: bool }
  const [toolCardOpen, setToolCardOpen] = React.useState<Record<string, { req: boolean; res: boolean }>>({});
  // 同步 state → ref
  React.useEffect(() => { agentReviewChoiceRef.current = agentReviewChoice; }, [agentReviewChoice]);
  React.useEffect(() => { agentReviewSupplementRef.current = agentReviewSupplement; }, [agentReviewSupplement]);

  // @mention 状态
  const [mentionOpen, setMentionOpen] = React.useState(false);
  const [mentionFilter, setMentionFilter] = React.useState('');
  const [mentionStart, setMentionStart] = React.useState(-1);

  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  const allEmployees = employeeStore.getEmployees().filter((e: EmployeeRecord) => e.status === 'published');
  const getEmployee = (empId: string) => allEmployees.find(e => e.id === empId) || null;

  const activeConv = conversations.find(c => c.id === activeConvId) || null;
  const activeEmp = activeConv && activeConv.type === 'single' ? getEmployee(activeConv.empIds[0]) : null;
  const tasks = activeEmp ? [...(MOCK_TASKS[activeEmp.id] ?? []), ...(extraTasks[activeEmp.id] ?? [])] : [];
  const selectedTask = tasks.find(t => t.id === selectedTaskId) || null;

  React.useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [activeConv?.messages, sending]);

  const getTime = () => new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  // ── 步骤状态色 ──
  const stepDot: Record<string, string> = { done: '#0284c7', running: '#16a34a', waiting: '#d1d5db', failed: '#e11d48' };
  const stepBg:  Record<string, string> = { done: '#f0f9ff', running: '#f0fdf4', waiting: '#fafafa', failed: '#fff1f2' };
  const stepClr: Record<string, string> = { done: '#0284c7', running: '#16a34a', waiting: '#9ca3af', failed: '#e11d48' };
  const stepLbl: Record<string, string> = { done: '✓ 完成', running: '⟳ 进行中', waiting: '○ 待执行', failed: '✗ 失败' };
  const taskStatusCfg: Record<string, { bg: string; color: string; label: string }> = {
    running:  { bg: '#f0fdf4', color: '#16a34a', label: '执行中' },
    done:     { bg: '#f0f9ff', color: '#0284c7', label: '已完成' },
    failed:   { bg: '#fff1f2', color: '#e11d48', label: '失败'   },
    waiting:  { bg: '#fefce8', color: '#ca8a04', label: '等待中' },
    overtime: { bg: '#fff1f2', color: '#dc2626', label: '超时'   },
  };

  // ── 打开对话（从通讯录点击） ──
  const openConversation = (empId: string, fromContacts = false) => {
    setOpenedFromContacts(fromContacts);
    const existing = conversations.find(c => c.type === 'single' && c.empIds[0] === empId);
    if (existing) {
      setActiveConvId(existing.id);
      setSelectedTaskId(null);
      return;
    }
    const emp = getEmployee(empId);
    if (!emp) return;
    const newConv: IMConversation = {
      id: `conv-${Date.now()}`,
      type: 'single',
      empIds: [empId],
      name: emp.name,
      pinned: false,
      lastTime: getTime(),
      lastText: '新对话',
      messages: [
        { id: `m-${Date.now()}`, role: 'bot', text: `您好！我是${emp.name}，请问有什么可以帮您？`, time: getTime(), empId: emp.id, empName: emp.name },
      ],
    };
    setConversations(prev => [...prev, newConv]);
    setActiveConvId(newConv.id);
    setSelectedTaskId(null);
  };

  // ── 输入监控（@mention） ──
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setChatInput(val);
    const pos = e.target.selectionStart;
    const before = val.slice(0, pos);
    const lastAt = before.lastIndexOf('@');
    if (lastAt >= 0 && (lastAt === 0 || /\s/.test(before[lastAt - 1]))) {
      const after = val.slice(lastAt + 1, pos);
      if (!/\s/.test(after)) {
        setMentionFilter(after);
        setMentionStart(lastAt);
        setMentionOpen(true);
        return;
      }
    }
    setMentionOpen(false);
  };

  const insertMention = (empName: string) => {
    if (mentionStart < 0) return;
    const before = chatInput.slice(0, mentionStart);
    const after = chatInput.slice(inputRef.current?.selectionStart || chatInput.length);
    const newVal = before + `@${empName} ` + after;
    setChatInput(newVal);
    setMentionOpen(false);
    inputRef.current?.focus();
  };

  // ── 发送消息 ──
  const handleSend = () => {
    const text = chatInput.trim();
    if (!text || !activeConv || sending) return;
    const prefix = '';
    const userMsg: ChatMessage = { id: `m-${Date.now()}`, role: 'user', text: prefix + text, time: getTime() };
    setConversations(prev => prev.map(c => c.id === activeConvId ? {
      ...c,
      messages: [...c.messages, userMsg],
      lastTime: userMsg.time,
      lastText: text.slice(0, 20),
    } : c));
    setChatInput('');
    setSending(true);

    // de-012 作业方案助手：意图识别 → 模板匹配 → 选择模板
    if (activeConv.type === 'single' && activeConv.empIds[0] === 'de-012') {
      const convId = activeConvId;
      const empId = 'de-012';
      const empName = '作业方案助手';
      let seq = Date.now();
      const nid = () => `op-${++seq}`;
      const ts = getTime();
      const push = (msg: ChatMessage) => setConversations(prev => prev.map(c =>
        c.id === convId ? { ...c, messages: [...c.messages, msg], lastTime: msg.time, lastText: msg.text.slice(0, 20) } : c
      ));

      setTimeout(() => push({ id: nid(), role: 'bot', kind: 'step', text: '◉ 材料已接收，正在解析文档内容...', time: ts, empId, empName }), 400);
      setTimeout(() => push({ id: nid(), role: 'bot', kind: 'step', text: '◉ 正在调用意图识别模型，分析作业类型...', time: ts, empId, empName }), 1200);
      setTimeout(() => push({
        id: nid(), role: 'bot', kind: 'tool-call', time: ts, empId, empName,
        text: '意图识别',
        toolCard: {
          toolName: 'intent_classifier',
          request: JSON.stringify({ input: text, model: 'energy-intent-v2', industry: '能源电力' }, null, 2),
          response: JSON.stringify({ intent: '变电站年度检修', confidence: 0.96, sub_type: '220kV', suggested_templates: 3 }, null, 2),
        },
      }), 2200);
      setTimeout(() => push({ id: nid(), role: 'bot', kind: 'step', text: '◉ 识别完成：变电站年度检修（置信度 96%），正在检索方案模板库...', time: ts, empId, empName }), 3200);
      setTimeout(() => push({
        id: nid(), role: 'bot', kind: 'op-template-select', time: ts, empId, empName,
        text: '已为您匹配以下 3 套方案模板，请选择后点击「进入方案编辑」：',
      }), 4400);
      setTimeout(() => setSending(false), 4500);
      return;
    }

    // de-009 合同审核助手：AI Agent 逐步推理模式
    if (activeConv.type === 'single' && activeConv.empIds[0] === 'de-009') {
      const convId = activeConvId;
      const empId = 'de-009';
      const empName = '合同审核助手';
      let msgSeq = Date.now();
      const nextId = () => `a-${++msgSeq}`;
      const ts = getTime();

      const pushMsg = (msg: ChatMessage) => {
        setConversations(prev => prev.map(c => c.id === convId ? {
          ...c, messages: [...c.messages, msg],
          lastTime: msg.time, lastText: msg.text.slice(0, 20),
        } : c));
      };

      const runAgentFlow = () => {
        // Step 1: 规划 (300ms)
        setTimeout(() => {
          pushMsg({ id: nextId(), role: 'bot', kind: 'step', text: '◉ 任务已接收，开始分析合同审核需求…', time: ts, empId, empName });
        }, 300);

        // Step 2: 规划完成 (800ms)
        setTimeout(() => {
          pushMsg({ id: nextId(), role: 'bot', kind: 'normal', time: ts, empId, empName,
            text: `好的，我将按以下步骤完成本次合同审核：\n\n① 调用 **PDF 解析工具** 提取合同全文结构\n② 检索**法务规则库**，匹配条款风险模式\n③ 对识别到的高风险条款逐一请您确认\n④ 汇总生成完整审核报告\n\n开始执行…` });
        }, 800);

        // Step 3: 调用 PDF 解析（1.5s）
        setTimeout(() => {
          pushMsg({ id: nextId(), role: 'bot', kind: 'step', text: '◉ 正在调用 PDF 解析工具，提取合同文本结构…', time: ts, empId, empName });
        }, 1500);

        // Step 4: PDF 解析 tool-call 卡片 (2.6s)
        const pdfToolId = nextId();
        setTimeout(() => {
          pushMsg({
            id: pdfToolId, role: 'bot', kind: 'tool-call', time: ts, empId, empName,
            text: 'PDF 解析工具',
            toolCard: {
              toolName: 'pdf_parser',
              request: JSON.stringify({ file: '供应商合同_2026Q2.pdf', mode: 'full_text', extract_clauses: true, lang: 'zh-CN' }, null, 2),
              response: JSON.stringify({ status: 'success', pages: 18, clause_count: 31, word_count: 12480, sections: ['甲乙双方信息', '合同标的', '付款条款', '违约责任', '保密协议', '争议解决', '附件'] }, null, 2),
            },
          });
        }, 2600);

        // Step 5: 解析完成提示 (3.4s)
        setTimeout(() => {
          pushMsg({ id: nextId(), role: 'bot', kind: 'step', text: '◉ PDF 解析完成：共 18 页、31 个条款、12,480 字。开始检索法务规则库…', time: ts, empId, empName });
        }, 3400);

        // Step 6: 法务规则库 tool-call 卡片 (4.5s)
        const legalToolId = nextId();
        setTimeout(() => {
          pushMsg({
            id: legalToolId, role: 'bot', kind: 'tool-call', time: ts, empId, empName,
            text: '法务规则库检索',
            toolCard: {
              toolName: 'legal_rule_search',
              request: JSON.stringify({ clauses: ['违约责任', '付款条款', '单方解约权', '保密期限', '争议管辖'], rule_version: 'v3.2.1', risk_level_threshold: 'medium' }, null, 2),
              response: JSON.stringify({ matched_rules: 47, high_risk: 2, medium_risk: 5, low_risk: 8, top_risks: [{ clause: '第8条 违约责任', risk: '高', desc: '赔偿上限设定过低（合同金额的5%），远低于行业基准30%' }, { clause: '第12条 单方解约权', risk: '高', desc: '乙方享有无条件单方解约权，甲方利益保障不足' }] }, null, 2),
            },
          });
        }, 4500);

        // Step 7: 发现风险说明 (5.4s)
        setTimeout(() => {
          pushMsg({ id: nextId(), role: 'bot', kind: 'normal', time: ts, empId, empName,
            text: '法务规则库检索完成，共匹配 47 条规则。\n\n发现 **2 处高风险条款**，需要您逐一确认后，我才会继续推进审核。\n\n请先处理第一处风险：' });
        }, 5400);

        // Step 8: 第一个 human-pending (6.2s)
        const hp1Id = nextId();
        setTimeout(() => {
          setAgentPendingMsgId(hp1Id);
          pushMsg({ id: hp1Id, role: 'bot', kind: 'human-pending', time: ts, empId, empName,
            text: '⚠️ **高风险条款 · 第8条 违约责任**\n\n> 原文：「乙方违约时，赔偿金额不超过合同总金额的 **5%**」\n\n**风险说明**：赔偿上限仅为合同金额的 5%，远低于行业基准（通常为 20%–30%）。若乙方违约，甲方实际损失可能远超可获赔偿，存在重大利益损失风险。\n\n**建议修改**：将赔偿上限调整至合同总金额的 **30%**，并增加"因欺诈或故意违约不受此限"的兜底条款。\n\n请确认您对此条款的处理方式：' });
          // 注册继续函数
          agentContinueFnRef.current = () => {
            setAgentPendingMsgId(null);
            const confirmText = agentReviewChoiceRef.current
              ? agentReviewChoiceRef.current + (agentReviewSupplementRef.current ? '：' + agentReviewSupplementRef.current : '')
              : '已确认';

            // 更新 hp1 消息文本为已确认状态
            setConversations(prev => prev.map(c => c.id === convId ? {
              ...c,
              messages: c.messages.map(m => m.id === hp1Id
                ? { ...m, kind: 'normal' as const, text: `✓ 第8条违约责任 — ${confirmText}` }
                : m
              ),
            } : c));

            setAgentReviewChoice('');
            setAgentReviewSupplement('');

            // 继续 step 9 (第二个风险)
            setTimeout(() => {
              pushMsg({ id: nextId(), role: 'bot', kind: 'step', text: '◉ 已记录您的确认意见，继续分析第二处高风险条款…', time: getTime(), empId, empName });
            }, 400);

            // hp2
            const hp2Id = nextId();
            setTimeout(() => {
              setAgentPendingMsgId(hp2Id);
              pushMsg({ id: hp2Id, role: 'bot', kind: 'human-pending', time: getTime(), empId, empName,
                text: '⚠️ **高风险条款 · 第12条 单方解约权**\n\n> 原文：「乙方有权在提前 **7日** 书面通知后单方解除本合同，无需承担违约责任」\n\n**风险说明**：乙方享有几乎无条件的单方解约权，且解约后无需赔偿。若乙方在项目关键节点解约，甲方将面临严重的履约风险，且无法获得充分的补偿。\n\n**建议修改**：删除乙方的无条件解约权；若保留，需补充：① 解约提前通知期延长至 **30日**；② 解约须支付不低于合同金额 **15%** 的违约金；③ 项目关键阶段（如上线前60日内）禁止解约。\n\n请确认您对此条款的处理方式：' });
              agentContinueFnRef.current = () => {
                setAgentPendingMsgId(null);
                const confirmText2 = agentReviewChoiceRef.current
                  ? agentReviewChoiceRef.current + (agentReviewSupplementRef.current ? '：' + agentReviewSupplementRef.current : '')
                  : '已确认';

                setConversations(prev => prev.map(c => c.id === convId ? {
                  ...c,
                  messages: c.messages.map(m => m.id === hp2Id
                    ? { ...m, kind: 'normal' as const, text: `✓ 第12条单方解约权 — ${confirmText2}` }
                    : m
                  ),
                } : c));

                setAgentReviewChoice('');
                setAgentReviewSupplement('');
                agentContinueFnRef.current = null;

                // 最终报告
                setTimeout(() => {
                  pushMsg({ id: nextId(), role: 'bot', kind: 'step', text: '◉ 所有风险条款已确认，正在生成完整审核报告…', time: getTime(), empId, empName });
                }, 400);
                setTimeout(() => {
                  pushMsg({ id: nextId(), role: 'bot', kind: 'normal', time: getTime(), empId, empName,
                    text: `✅ **合同审核完成**\n\n**文件**：供应商合同_2026Q2.pdf（18页，31条款）\n\n**审核结论**：\n• 高风险条款 2 项 ⚠️（已由您逐一确认）\n• 中风险条款 5 项（建议法务复查）\n• 低风险条款 8 项（可接受）\n\n**已确认处理方式**：\n• 第8条违约责任：${confirmText}\n• 第12条单方解约权：${confirmText2}\n\n审核报告已生成，包含风险标注、修改建议与法律依据引用，可直接导出或同步至在线文档。` });
                  setSending(false);
                }, 1800);
              };
            }, 1400);
          };
        }, 6200);
      };

      runAgentFlow();
      return; // 不走下面的通用逻辑
    }

    setTimeout(() => {
      if (activeConv.type === 'single') {
        const emp = getEmployee(activeConv.empIds[0]);
        if (!emp) return;
        const replies = [
          `好的，我已收到您的任务：「${text}」，正在处理中，稍后会将结果反馈给您。`,
          `明白了，我将立即开始处理：${text}，预计完成时间 2-3 分钟，完成后会通知您。`,
          `任务已接收！我会按照您的要求完成「${text}」，完成后主动告知结果。`,
        ];
        const botMsg: ChatMessage = { id: `m-${Date.now()}`, role: 'bot', text: replies[Math.floor(Math.random() * replies.length)], time: getTime(), empId: emp.id, empName: emp.name };
        setConversations(prev => prev.map(c => c.id === activeConvId ? {
          ...c,
          messages: [...c.messages, botMsg],
          lastTime: botMsg.time,
          lastText: botMsg.text.slice(0, 20),
        } : c));
      } else {
        // 群聊：每个成员依次回复
        activeConv.empIds.forEach((empId, idx) => {
          setTimeout(() => {
            const emp = getEmployee(empId);
            if (!emp) return;
            const botMsg: ChatMessage = { id: `m-${Date.now()}-${idx}`, role: 'bot', text: `[${emp.name}] 收到！我会协助处理「${text}」相关内容。`, time: getTime(), empId: emp.id, empName: emp.name };
            setConversations(prev => prev.map(c => c.id === activeConvId ? {
              ...c,
              messages: [...c.messages, botMsg],
              lastTime: botMsg.time,
              lastText: botMsg.text.slice(0, 20),
            } : c));
          }, idx * 600);
        });
      }
      setSending(false);
    }, 800 + Math.random() * 600);
  };

  // ── 固定/取消固定对话 ──
  const togglePin = (convId: string) => {
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, pinned: !c.pinned } : c));
  };

  // ── 删除对话 ──
  const deleteConv = (convId: string) => {
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (activeConvId === convId) setActiveConvId(null);
  };

  // ─────────────────────────────────────────────
  //  合同审核助手：AI Agent 风格任务详情
  // ─────────────────────────────────────────────
  const ContractAgentTaskDetail: React.FC<{ task: TaskItem; onBack: () => void }> = ({ task, onBack }) => {
    const cfg = taskStatusCfg[task.status] ?? taskStatusCfg.waiting;

    // 根据任务预设对话式消息流
    interface AgentMsg {
      id: string;
      kind: 'step' | 'tool-call' | 'normal' | 'human-pending' | 'human-done';
      text?: string;
      toolName?: string;
      toolReq?: string;
      toolRes?: string;
      chips?: string[];
      chipChoice?: string;
    }

    const MSG_FLOWS: Record<string, AgentMsg[]> = {
      't-901': [
        { id: 'm1', kind: 'step', text: '任务已接收 · 合同审核助手开始处理' },
        { id: 'm2', kind: 'normal', text: '我来处理这份供应商框架协议的审核。\n\n**审核计划**\n1. PDF 文档解析 → 提取条款结构\n2. 法律规则匹配 → 检索合规规则库\n3. AI 多步推理 → 识别高风险条款\n4. 关键风险节点 → 触发人工确认\n5. 输出结构化审核报告' },
        { id: 'm3', kind: 'step', text: '调用 PDF 解析引擎...' },
        { id: 'm4', kind: 'tool-call', toolName: 'pdf_parser', toolReq: '{\n  "file": "华为技术有限公司_供应商框架协议.pdf",\n  "mode": "structured",\n  "extract": ["clauses", "parties", "dates", "amounts"]\n}', toolRes: '{\n  "pages": 28,\n  "chars": 8640,\n  "clauses": 18,\n  "parties": ["甲方: 本公司", "乙方: 华为技术有限公司"],\n  "key_dates": {"签约日": "2026-04-15", "有效期": "2年"},\n  "status": "ok"\n}' },
        { id: 'm5', kind: 'step', text: '文档解析完成，共识别 18 个核心条款段落' },
        { id: 'm6', kind: 'tool-call', toolName: 'legal_rules_search', toolReq: '{\n  "clauses": ["第11条 违约责任", "第16条 数据权属"],\n  "law_refs": ["民法典", "合同法", "数据安全法"],\n  "risk_level": "high"\n}', toolRes: '{\n  "matched_rules": 203,\n  "high_risk": [\n    {\n      "clause": "第11条 违约责任上限",\n      "risk": "HIGH",\n      "reason": "违约赔偿上限仅约定为10万元，低于合同总价5%，存在利益失衡"\n    },\n    {\n      "clause": "第16条 数据归属权",\n      "risk": "HIGH",\n      "reason": "数据归属权表述模糊，未明确区分原始数据与衍生数据权属"\n    }\n  ],\n  "status": "ok"\n}' },
        { id: 'm7', kind: 'normal', text: '审查发现 **2 处高风险条款**，需要您逐项确认处置方案：\n\n⚠️ **第11条 · 违约责任上限**\n当前约定赔偿上限为10万元，低于合同总价的5%，存在利益失衡风险。\n\n**建议修改为**：违约赔偿上限不低于合同总价的30%（约150万元）\n\n请选择处理方式：' },
        { id: 'm8', kind: 'human-pending', text: '第11条「违约赔偿上限」处置方案', chips: ['✓ 接受修改建议，按30%重新谈判', '↩ 保留原条款，补充风险备注'], chipChoice: '✓ 接受修改建议，按30%重新谈判' },
        { id: 'm9', kind: 'step', text: '第11条确认完成，继续审核第16条...' },
        { id: 'm10', kind: 'normal', text: '⚠️ **第16条 · 数据归属权**\n协议对"原始数据"与"基于原始数据产生的衍生数据"归属权表述模糊，存在数据权益纠纷风险。\n\n**建议**：增加补充协议，明确：原始数据归属甲方，衍生分析数据由双方协商共享比例。\n\n请选择处理方式：' },
        { id: 'm11', kind: 'human-pending', text: '第16条「数据归属权」处置方案', chips: ['✓ 同意增加补充协议', '↩ 保持原文，标注风险提示'], chipChoice: '✓ 同意增加补充协议' },
        { id: 'm12', kind: 'step', text: '全部高风险条款确认完成，生成审核报告...' },
        { id: 'm13', kind: 'normal', text: '✅ **审核完成**\n\n**审核结论**：发现 2 处高风险条款，已完成人工确认，建议签署前完成以下操作：\n\n1. 第11条：重新谈判违约赔偿上限至30%\n2. 第16条：签署数据归属权补充协议\n\n📄 详细审核报告已生成并推送至在线文档，请法务负责人复核后归档。' },
      ],
      't-902': [
        { id: 'm1', kind: 'step', text: '批量审核任务已接收 · 正在处理 8 份劳动合同' },
        { id: 'm2', kind: 'normal', text: '已收到 8 份新入职劳动合同，开始批量审核。\n\n**审核重点**\n- 试用期约定是否符合法定上限\n- 竞业限制条款合规性\n- 薪酬条款是否存在违规表述' },
        { id: 'm3', kind: 'step', text: '批量调用 PDF 解析引擎...' },
        { id: 'm4', kind: 'tool-call', toolName: 'pdf_batch_parser', toolReq: '{\n  "files": ["合同01.pdf", "合同02.pdf", "...合同08.pdf"],\n  "batch_mode": true,\n  "focus_fields": ["试用期", "竞业限制", "薪酬"]\n}', toolRes: '{\n  "processed": 8,\n  "success": 8,\n  "issues_detected": 1,\n  "details": {\n    "合同05": {\n      "field": "试用期",\n      "value": "6个月",\n      "risk": "HIGH",\n      "reason": "月薪10001元以上职位试用期最长不得超过6个月，当前约定恰好触边，需确认"\n    }\n  },\n  "status": "ok"\n}' },
        { id: 'm5', kind: 'step', text: '文档解析完成，正在进行竞业限制条款合规性分析...' },
        { id: 'm6', kind: 'normal', text: '**进行中** ⟳ 竞业限制条款合规性分析正在执行中...\n\n已完成7份，合同#8分析中。发现合同#5存在试用期时长边界问题，等待分析完成后触发人工确认。' },
      ],
      't-903': [
        { id: 'm1', kind: 'step', text: '任务已创建 · 等待文档上传' },
        { id: 'm2', kind: 'normal', text: '数据安全协议审核任务已就绪。\n\n**请上传**：与某云服务商签署的数据安全协议文档（支持 PDF / Word 格式）\n\n上传后将自动开始：数据条款提取 → 数据安全法规比对 → 风险识别 → 人工确认 → 报告输出' },
      ],
    };

    const msgs = MSG_FLOWS[task.id] ?? [
      { id: 'm1', kind: 'step' as const, text: '任务已接收' },
      { id: 'm2', kind: 'normal' as const, text: '暂无执行详情' },
    ];

    const [openTools, setOpenTools] = React.useState<Record<string, { req: boolean; res: boolean }>>({});
    const [formInputs, setFormInputs] = React.useState<Record<string, string>>({});
    const [formSubmitted, setFormSubmitted] = React.useState<Record<string, string>>({});
    const toggleTool = (id: string, part: 'req' | 'res') =>
      setOpenTools(prev => ({ ...prev, [id]: { ...prev[id], req: part === 'req' ? !prev[id]?.req : (prev[id]?.req ?? false), res: part === 'res' ? !prev[id]?.res : (prev[id]?.res ?? false) } }));

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* 头部 */}
        <div style={{ padding: '14px 18px', background: 'linear-gradient(135deg,#f8f7ff,#f0f9ff)', borderBottom: '1px solid #e8e8f0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.5, marginBottom: 5 }}>{task.title}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as const }}>
                <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 10, background: cfg.bg, color: cfg.color, fontWeight: 600, border: `1px solid ${cfg.color}30` }}>{cfg.label}</span>
                <span style={{ fontSize: 11, color: '#888' }}>🕐 {task.startDate ?? task.time}</span>
                {task.completedAt && <span style={{ fontSize: 11, color: '#059669' }}>✓ {task.completedAt}</span>}
                {!task.completedAt && task.duration && <span style={{ fontSize: 11, color: '#888' }}>⏱ {task.duration}</span>}
              </div>
            </div>
            <button onClick={onBack} style={{ flexShrink: 0, padding: '5px 12px', borderRadius: 7, border: '1px solid #e0deff', background: '#fff', color: '#6366F1', fontSize: 11, cursor: 'pointer', fontWeight: 500 }}>← 返回</button>
          </div>
          {task.result && (
            <div style={{ marginTop: 8, padding: '6px 11px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 7, fontSize: 12, color: '#166534' }}>💡 {task.result}</div>
          )}
        </div>

        {/* 消息流 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10, background: '#f5f6fa' }}>
          {msgs.map(msg => {
            if (msg.kind === 'step') {
              return (
                <div key={msg.id} style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#d1d5db', flexShrink: 0 }} />
                  {msg.text}
                </div>
              );
            }

            if (msg.kind === 'tool-call') {
              const isReqOpen = openTools[msg.id]?.req ?? false;
              const isResOpen = openTools[msg.id]?.res ?? false;
              return (
                <div key={msg.id} style={{ background: '#1e1e2e', borderRadius: 10, overflow: 'hidden', border: '1px solid #374151', fontSize: 12, maxWidth: '92%' }}>
                  <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #374151' }}>
                    <span style={{ fontSize: 13 }}>🔧</span>
                    <span style={{ color: '#a5b4fc', fontWeight: 600, fontFamily: 'monospace', fontSize: 12 }}>{msg.toolName}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: '#6b7280' }}>工具调用</span>
                  </div>
                  {/* 请求参数 */}
                  <div>
                    <div
                      onClick={() => toggleTool(msg.id, 'req')}
                      style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#94a3b8', fontSize: 11, borderBottom: '1px solid #2d2d3d' }}
                    >
                      <span style={{ fontSize: 9, transition: 'transform 0.15s', display: 'inline-block', transform: isReqOpen ? 'rotate(90deg)' : 'rotate(0)' }}>▶</span>
                      请求参数
                    </div>
                    {isReqOpen && (
                      <pre style={{ margin: 0, padding: '8px 14px', fontSize: 11, color: '#86efac', fontFamily: 'monospace', lineHeight: 1.7, overflowX: 'auto', borderBottom: '1px solid #2d2d3d', background: '#161622' }}>{msg.toolReq}</pre>
                    )}
                  </div>
                  {/* 返回结果 */}
                  <div>
                    <div
                      onClick={() => toggleTool(msg.id, 'res')}
                      style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#94a3b8', fontSize: 11 }}
                    >
                      <span style={{ fontSize: 9, transition: 'transform 0.15s', display: 'inline-block', transform: isResOpen ? 'rotate(90deg)' : 'rotate(0)' }}>▶</span>
                      返回结果
                    </div>
                    {isResOpen && (
                      <pre style={{ margin: 0, padding: '8px 14px', fontSize: 11, color: '#fbbf24', fontFamily: 'monospace', lineHeight: 1.7, overflowX: 'auto', background: '#161622' }}>{msg.toolRes}</pre>
                    )}
                  </div>
                </div>
              );
            }

            if (msg.kind === 'human-pending' || msg.kind === 'human-done') {
              const isDone = msg.kind === 'human-done' || task.status === 'done';
              const submitted = formSubmitted[msg.id];
              const isSubmitted = isDone || !!submitted;
              const submittedText = submitted || msg.chipChoice || '';
              return (
                <div key={msg.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>审</div>
                  <div style={{ background: '#fff', borderRadius: '4px 12px 12px 12px', border: isSubmitted ? '1.5px solid #bbf7d0' : '1.5px solid #c7d2fe', padding: '12px 14px', maxWidth: '88%', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', minWidth: 260 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <span style={{ fontSize: 13 }}>{isSubmitted ? '✅' : '⏸'}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: isSubmitted ? '#166534' : '#4338CA' }}>
                        {isSubmitted ? '已完成人工确认' : '等待人工确认'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#374151', marginBottom: 10, lineHeight: 1.6 }}>{msg.text}</div>
                    {isSubmitted ? (
                      <div style={{ padding: '9px 12px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 12, color: '#166534', lineHeight: 1.6 }}>
                        <span style={{ fontSize: 11, color: '#86efac', marginRight: 6 }}>✓ 已提交</span>
                        {submittedText || '（无补充说明）'}
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 5 }}>请填写处理意见或澄清说明：</div>
                        <textarea
                          value={formInputs[msg.id] ?? ''}
                          onChange={e => setFormInputs(prev => ({ ...prev, [msg.id]: e.target.value }))}
                          placeholder="请在此输入你的处理意见、修改要求或澄清说明..."
                          rows={3}
                          style={{ width: '100%', border: '1px solid #c7d2fe', borderRadius: 8, padding: '8px 10px', fontSize: 12, outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: '#374151', lineHeight: 1.6, background: '#fafbff' }}
                          onFocus={e => (e.currentTarget.style.borderColor = '#6366F1')}
                          onBlur={e => (e.currentTarget.style.borderColor = '#c7d2fe')}
                        />
                        <button
                          onClick={() => {
                            const val = (formInputs[msg.id] ?? '').trim();
                            setFormSubmitted(prev => ({ ...prev, [msg.id]: val || '已确认' }));
                          }}
                          style={{ marginTop: 8, width: '100%', padding: '7px 0', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                        >
                          提交确认
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            // normal
            return (
              <div key={msg.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>审</div>
                <div style={{ background: '#fff', borderRadius: '4px 12px 12px 12px', padding: '10px 13px', maxWidth: '88%', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', fontSize: 13, color: '#1a1a1a', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {msg.text}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────
  //  任务详情渲染（通用 + 智能巡检专属）
  // ─────────────────────────────────────────────
  const renderTaskDetail = (task: TaskItem) => {
    const cfg = taskStatusCfg[task.status] ?? taskStatusCfg.waiting;
    const isInspect = activeEmp?.id === 'de-007';
    const isPatrolDemo = activeEmp?.id === 'de-008';
    const isContractAgent = activeEmp?.id === 'de-009';

    // ══════════════════════════════════════════════
    //  合同审核助手：AI Agent 风格
    // ══════════════════════════════════════════════
    if (isContractAgent) {
      return <ContractAgentTaskDetail task={task} onBack={() => setSelectedTaskId(null)} />;
    }

    // ── 通用任务头部 ──────────────────────────────
    const TaskHeader = () => (
      <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg,#f8f7ff,#f0f9ff)', borderBottom: '1px solid #e8e8f0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ flex: 1, marginRight: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.5, marginBottom: 6 }}>{task.title}</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 10, background: cfg.bg, color: cfg.color, fontWeight: 600, border: `1px solid ${cfg.color}30` }}>{cfg.label}</span>
              <span style={{ fontSize: 11, color: '#888' }}>🕐 {task.startDate ?? task.time}</span>
              {task.completedAt && <span style={{ fontSize: 11, color: '#059669' }}>✓ {task.completedAt}</span>}
              {!task.completedAt && task.duration && <span style={{ fontSize: 11, color: '#888' }}>⏱ {task.duration}</span>}
            </div>
          </div>
          <button onClick={() => setSelectedTaskId(null)} style={{ flexShrink: 0, padding: '5px 12px', borderRadius: 7, border: '1px solid #e0deff', background: '#fff', color: '#6366F1', fontSize: 11, cursor: 'pointer', fontWeight: 500 }}>← 返回</button>
        </div>
        {task.result && (
          <div style={{ padding: '7px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 12, color: '#166534' }}>💡 {task.result}</div>
        )}
      </div>
    );

    // ══════════════════════════════════════════════
    //  智能巡检助手专属可视化
    // ══════════════════════════════════════════════
    if (isInspect) {

      // ── t-701 光纤预警研判：瀑布图 + 视频监控复核 ──────────────
      if (task.id === 't-701') {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, overflowY: 'auto' }}>
            <TaskHeader />
            <LiveExecutionFlow task={task} isInspect={isInspect} />
            {/* 瀑布图复核画面 */}
            <div style={{ padding: '16px 20px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                📊 光纤瀑布图 · 车辆穿行/伴行报警复核
                <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#fef2f2', color: '#dc2626', fontWeight: 600 }}>⚠ 二级预警触发</span>
              </div>
              <div style={{ fontSize: 11, color: '#aaa', marginBottom: 12 }}>传感器 KM-204 · 里程桩 K13530~K13928 · 时间段 09:28:08–09:38:07</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ borderRadius: 10, overflow: 'hidden', border: '1.5px solid #ef444440' }}>
                  <img src="/inspect/waterfall1.png" alt="瀑布图1" style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
                  <div style={{ padding: '7px 10px', background: '#0f172a', fontSize: 11, fontWeight: 600, color: '#f87171' }}>
                    穿行 & 伴行复合报警
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 400, marginTop: 2 }}>K13530–K13928 · 09:28–09:38</div>
                  </div>
                </div>
                <div style={{ borderRadius: 10, overflow: 'hidden', border: '1.5px solid #f59e0b40' }}>
                  <img src="/inspect/waterfall2.png" alt="瀑布图2" style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
                  <div style={{ padding: '7px 10px', background: '#0f172a', fontSize: 11, fontWeight: 600, color: '#fbbf24' }}>
                    伴行告警细节
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 400, marginTop: 2 }}>信号增强段 · 高频振动特征</div>
                  </div>
                </div>
              </div>
            </div>
            {/* 视频监控复核 */}
            <div style={{ padding: '16px 20px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                📹 视频监控复核 · 光纤车辆经过报警验证
                <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#f0fdf4', color: '#16a34a', fontWeight: 600 }}>已确认车辆过境</span>
              </div>
              <div style={{ fontSize: 11, color: '#aaa', marginBottom: 12 }}>摄像机 CAM-140+150 · 鲁皖二期 · 2025年12月28日 06:16:20</div>
              <div style={{ borderRadius: 10, overflow: 'hidden', border: '1.5px solid #3b82f640' }}>
                <img src="/inspect/cctv.png" alt="视频监控复核" style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: 200 }} />
                <div style={{ padding: '8px 12px', background: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>📍 鲁皖二期-潍城区亮接口街办贾家村</span>
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: '#22d3ee', fontWeight: 600 }}>里程 K140+150</span>
                </div>
              </div>
            </div>
            {/* 告警汇总 */}
            <div style={{ padding: '14px 20px', background: '#fff' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 10 }}>🚨 多源告警汇总</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[
                  { icon:'🔔', label:'光纤告警', value:'3 条', sub:'穿行+伴行复合触发', color:'#EF4444' },
                  { icon:'📡', label:'预警级别', value:'二级', sub:'视频监控已确认', color:'#F59E0B' },
                  { icon:'📋', label:'工单状态', value:'已派发', sub:'维修队A · 15min前', color:'#10B981' },
                ].map(d => (
                  <div key={d.label} style={{ padding: '10px 12px', background: `${d.color}08`, borderRadius: 10, border: `1px solid ${d.color}20` }}>
                    <div style={{ fontSize: 20, marginBottom: 5 }}>{d.icon}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: d.color, marginBottom: 2 }}>{d.value}</div>
                    <div style={{ fontSize: 11, color: '#555', fontWeight: 500, marginBottom: 2 }}>{d.label}</div>
                    <div style={{ fontSize: 10, color: '#aaa' }}>{d.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      // ── t-702 无人机巡护：真实航拍图像 ──────────────
      if (task.id === 't-702') {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, overflowY: 'auto' }}>
            <TaskHeader />
            <LiveExecutionFlow task={task} isInspect={isInspect} />
            {/* 无人机航拍图像 */}
            <div style={{ padding: '16px 20px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                🚁 无人机复核 · 车辆经过报警画面
                <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#fef2f2', color: '#dc2626', fontWeight: 600 }}>目标已识别</span>
              </div>
              <div style={{ fontSize: 11, color: '#aaa', marginBottom: 12 }}>无人机编号 UAV-031 · 飞行高度 80m · 航速 12m/s · AI置信度 94.3%</div>
              <div style={{ borderRadius: 10, overflow: 'hidden', border: '1.5px solid #3b82f640' }}>
                <img src="/inspect/drone.png" alt="无人机复核画面" style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
                <div style={{ padding: '9px 14px', background: '#0f172a', display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span style={{ fontSize: 10, color: '#4ade80', fontWeight: 600, padding: '2px 8px', borderRadius: 4, border: '1px solid #4ade80' }}>小汽车 ×2</span>
                    <span style={{ fontSize: 10, color: '#60a5fa', fontWeight: 600, padding: '2px 8px', borderRadius: 4, border: '1px solid #60a5fa' }}>大货车 ×1</span>
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: '#94a3b8' }}>📍 K147+320 · 确认车辆过境</span>
                </div>
              </div>
            </div>
            {/* 检测统计 */}
            <div style={{ padding: '14px 20px', background: '#fff' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 10 }}>📊 巡护检测统计</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: '扫描里程', value: '12.4 km', bar: 82, color: '#6366F1' },
                  { label: '图像帧数', value: '3,847 帧', bar: 100, color: '#10B981' },
                  { label: '目标识别', value: '3 辆车', bar: 60, color: '#F59E0B' },
                  { label: '检测置信度', value: '94.3%', bar: 94, color: '#3B82F6' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 64, fontSize: 11, color: '#666', flexShrink: 0 }}>{r.label}</span>
                    <div style={{ flex: 1, height: 7, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${r.bar}%`, height: '100%', background: r.color, borderRadius: 4 }} />
                    </div>
                    <span style={{ width: 62, fontSize: 11, fontWeight: 600, color: r.color, textAlign: 'right', flexShrink: 0 }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      // ── t-703 工单闭环 ────────────────────────────
      if (task.id === 't-703') {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, overflowY: 'auto' }}>
            <TaskHeader />
            <LiveExecutionFlow task={task} isInspect={isInspect} />
            <div style={{ padding: '16px 20px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 12 }}>📋 工单执行状态</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                {[
                  { label: '工单编号', value: 'WO-20260320-047', color: '#6366F1' },
                  { label: '当前状态', value: '现场核查中', color: '#F59E0B' },
                  { label: '派单时间', value: '11:08:32', color: '#3B82F6' },
                  { label: '响应时效', value: '18 分钟', color: '#10B981' },
                  { label: '执行队组', value: '维修队 A·3人', color: '#8B5CF6' },
                  { label: '闭环率', value: '62%', color: '#EF4444' },
                ].map(d => (
                  <div key={d.label} style={{ padding: '9px 12px', background: '#f9fafb', borderRadius: 9, border: '1px solid #f0f0f0' }}>
                    <div style={{ fontSize: 10, color: '#aaa', marginBottom: 3 }}>{d.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: d.color }}>{d.value}</div>
                  </div>
                ))}
              </div>
              {/* 工单流转时间线 */}
              <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 10 }}>工单流转记录</div>
              {[
                { time: '10:52', event: '光纤预警触发，系统自动生成工单', status: 'done', icon: '🔔' },
                { time: '11:08', event: '工单派发至维修队 A，队长张工接单', status: 'done', icon: '📤' },
                { time: '11:26', event: '队员抵达现场 K147+320，开始核查', status: 'running', icon: '🔧' },
                { time: '—', event: '现场核查结论待上传', status: 'waiting', icon: '📝' },
                { time: '—', event: '工单闭环确认', status: 'waiting', icon: '✅' },
              ].map((ev, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 10, marginBottom: idx < 4 ? 8 : 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20, flexShrink: 0 }}>
                    <div style={{ width: 9, height: 9, borderRadius: '50%', background: ev.status==='done'?'#10B981':ev.status==='running'?'#F59E0B':'#e5e7eb', marginTop: 3, boxShadow: ev.status==='running'?'0 0 0 3px #F59E0B30':'none' }} />
                    {idx < 4 && <div style={{ width: 1, flex: 1, background: '#e5e7eb', marginTop: 2, marginBottom: 2, minHeight: 12 }} />}
                  </div>
                  <div style={{ flex: 1, paddingBottom: 2 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 10, color: '#aaa', width: 36, flexShrink: 0 }}>{ev.time}</span>
                      <span style={{ fontSize: 11, color: ev.status==='done'?'#374151':ev.status==='running'?'#d97706':'#9ca3af' }}>{ev.icon} {ev.event}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      // ── t-705 经验沉淀 ────────────────────────────
      if (task.id === 't-705') {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, overflowY: 'auto' }}>
            <TaskHeader />
            <LiveExecutionFlow task={task} isInspect={isInspect} />
            <div style={{ padding: '16px 20px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 12 }}>📚 知识库沉淀</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {[
                  { tag: '规律', content: '每周一、四为告警高发日，凌晨 2–4 时为高风险时段', color: '#6366F1' },
                  { tag: '预警', content: '光纤振动强度 > 0.8g 且持续 >3s，阈值调整后误报率降低 40%', color: '#EF4444' },
                  { tag: '优化', content: 'AI 模型迭代后复合型预警准确率提升至 91.2%', color: '#10B981' },
                  { tag: '经验', content: '机械施工振动主频集中 70–90Hz，可与地质沉降特征有效区分', color: '#F59E0B' },
                ].map(k => (
                  <div key={k.tag} style={{ display: 'flex', gap: 10, padding: '10px 13px', background: '#fafafa', borderRadius: 9, border: `1px solid ${k.color}20` }}>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 5, background: `${k.color}15`, color: k.color, fontWeight: 700, flexShrink: 0, height: 'fit-content', marginTop: 2 }}>{k.tag}</span>
                    <span style={{ fontSize: 12, color: '#374151', lineHeight: 1.7 }}>{k.content}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* 历史复盘柱状图 */}
            <div style={{ padding: '14px 20px', background: '#fff' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 10 }}>月度告警复盘（近6月）</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 60 }}>
                {[18,24,15,31,27,22].map((v,i)=>(
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: '100%', background: i===3?'#EF4444':'#6366F1', opacity: 0.7+(i===3?0.2:0), borderRadius: '4px 4px 0 0', height: v*1.8 }} />
                    <div style={{ fontSize: 9, color: '#bbb' }}>{['10','11','12','1','2','3'][i]}月</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      // ── 通用任务详情（对话+执行流程模式）────────────────
      return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <TaskHeader />
          {/* 水平执行流程（仅 fixed/scheduled 展示） */}
          {task.taskType !== 'chat' && task.steps && task.steps.length > 0 && (
            <div style={{ padding: '12px 20px', background: '#fff', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 10 }}>执行流程</div>
              <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
                {/* 连线 */}
                <div style={{ position: 'absolute', top: 8, left: 8, right: 8, height: 2, background: 'linear-gradient(90deg, #6366F1, #a5b4fc)', borderRadius: 1, zIndex: 0 }} />
                {task.steps.map((step) => {
                  const dotColor = step.status === 'done' ? '#6366F1' : step.status === 'running' ? '#16a34a' : '#d1d5db';
                  return (
                    <div key={step.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: dotColor, border: '2px solid #fff', boxShadow: `0 0 0 2px ${dotColor}`, marginBottom: 6, flexShrink: 0 }} />
                      <div style={{ fontSize: 10, color: step.status === 'waiting' ? '#bbb' : '#374151', textAlign: 'center', lineHeight: 1.4, maxWidth: 72, fontWeight: step.status === 'running' ? 600 : 400 }}>{step.name}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* 对话消息流 */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10, background: '#f5f6fa' }}>
            {task.steps && task.steps.filter(s => s.status === 'done' || s.status === 'running').map(step => (
              <div key={step.id}>
                {step.output && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: activeEmp ? imEmpGradient(activeEmp.name) : 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{activeEmp?.name.charAt(0) ?? 'AI'}</div>
                    <div style={{ maxWidth: '80%' }}>
                      <div style={{ fontSize: 10, color: '#bbb', marginBottom: 3 }}>{step.name} {step.time && `· ${step.time}`}</div>
                      {/* 工具调用卡片 */}
                      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e8e8f0', overflow: 'hidden', marginBottom: 4 }}>
                        <div style={{ padding: '7px 12px', background: '#f8f8ff', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#6366F1', fontWeight: 600 }}>{step.name}</span>
                          <span style={{ marginLeft: 'auto', fontSize: 10, padding: '1px 7px', borderRadius: 8, background: '#ecfdf5', color: '#059669', fontWeight: 600 }}>已完成</span>
                        </div>
                        <div style={{ padding: '8px 12px', fontSize: 11, color: '#374151', lineHeight: 1.65 }}>{step.output}</div>
                      </div>
                      {step.desc && <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.5 }}>{step.desc}</div>}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }
    // ══════════════════════════════════════════════
    if (isPatrolDemo) {
      const doneSteps = task.steps.filter(s => s.status === 'done').length;
      const totalSteps = task.steps.length;
      const progressPct = task.progress ?? Math.round((doneSteps / totalSteps) * 100);
      const humanStep = task.steps.find(s => s.type === 'human' && s.status === 'running');
      const pipeStepColor = (s: TaskStep) => {
        if (s.status === 'done') return '#16a34a';
        if (s.status === 'running') return s.type === 'human' ? '#d97706' : '#6366F1';
        return '#d1d5db';
      };
      const statusLabel = (s: string) => ({ done: '已完成', running: '进行中', waiting: '未开始', failed: '失败' }[s] ?? s);
      const statusColor = (s: string) => ({ done: '#0284c7', running: '#16a34a', waiting: '#9ca3af', failed: '#e11d48' }[s] ?? '#9ca3af');
      const statusBg = (s: string) => ({ done: '#f0f9ff', running: '#f0fdf4', waiting: '#f5f5f5', failed: '#fff1f2' }[s] ?? '#f5f5f5');

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, overflowY: 'auto' }}>
          {/* ── 任务头部 ── */}
          <div style={{ padding: '16px 20px', background: '#fff', borderBottom: '1px solid #e8e8f0', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 6 }}>{task.title}</div>
                <div style={{ fontSize: 11, color: '#999', lineHeight: 1.6 }}>
                  智能巡检demo · {task.meta?.['告警编号'] ?? task.id} · {task.status === 'overtime' ? '超时' : cfg.label} · 当前节点：{task.currentNode ?? '—'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid #e0e0e0', background: '#fff', color: '#555', fontSize: 11, cursor: 'pointer' }}>流程图</button>
                <button onClick={() => setSelectedTaskId(null)} style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid #6366F1', background: '#6366F1', color: '#fff', fontSize: 11, cursor: 'pointer' }}>← 返回</button>
              </div>
            </div>
          </div>

          {/* ── 元数据网格 ── */}
          {task.meta && (
            <div style={{ padding: '14px 20px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px 20px' }}>
                {Object.entries(task.meta).map(([key, val]) => (
                  <div key={key}>
                    <div style={{ fontSize: 10, color: '#999', marginBottom: 3 }}>{key}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: key === '告警等级' && val.includes('高') ? '#dc2626' : key === '状态' && val === '超时' ? '#dc2626' : '#1a1a1a' }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 管线步骤图标 ── */}
          <div style={{ padding: '16px 20px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
              {task.steps.map((step, idx) => {
                const color = pipeStepColor(step);
                const isDone = step.status === 'done';
                const isActive = step.status === 'running';
                return (
                  <React.Fragment key={step.id}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 56 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isDone ? '#f0fdf4' : isActive ? (step.type === 'human' ? '#fefce8' : '#EEF2FF') : '#f9fafb',
                        border: `2px solid ${color}`,
                        boxShadow: isActive ? `0 0 0 3px ${color}25` : 'none',
                      }}>
                        {isDone ? (
                          <span style={{ color: '#16a34a', fontSize: 14, fontWeight: 700 }}>✓</span>
                        ) : (
                          <span style={{ fontSize: 14 }}>{step.icon ?? (step.type === 'human' ? '👤' : '⚙️')}</span>
                        )}
                      </div>
                      <span style={{ fontSize: 10, color: isDone ? '#16a34a' : isActive ? color : '#bbb', fontWeight: isActive ? 600 : 400, textAlign: 'center', lineHeight: 1.3, whiteSpace: 'nowrap' }}>
                        {step.subtitle ?? step.name}
                      </span>
                    </div>
                    {idx < task.steps.length - 1 && (
                      <div style={{ flex: 1, height: 2, background: idx < doneSteps - 1 ? '#16a34a' : (idx === doneSteps - 1 && task.steps[idx + 1]?.status !== 'waiting') ? 'linear-gradient(90deg,#16a34a,#d1d5db)' : '#e5e7eb', minWidth: 12, marginBottom: 22 }} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* ── 编号步骤列表 ── */}
          <div style={{ padding: '16px 20px', background: '#fff', flex: 1 }}>
            {task.steps.map((step, idx) => {
              const sColor = statusColor(step.status);
              const sBg = statusBg(step.status);
              const isHumanRunning = step.type === 'human' && step.status === 'running';
              return (
                <div key={step.id} style={{ marginBottom: idx < task.steps.length - 1 ? 18 : 0, borderBottom: idx < task.steps.length - 1 ? '1px solid #f5f5f5' : 'none', paddingBottom: idx < task.steps.length - 1 ? 18 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 20, height: 20, borderRadius: '50%', background: step.status === 'done' ? '#6366F1' : step.status === 'running' ? '#10B981' : '#e5e7eb', color: step.status === 'waiting' ? '#999' : '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{idx + 1}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', flex: 1 }}>
                      {step.name}{step.subtitle && step.subtitle !== step.name ? ` · ${step.subtitle}` : ''}
                    </span>
                    {step.type === 'human' && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#fef3c7', color: '#d97706', fontWeight: 600, border: '1px solid #fde68a' }}>人工</span>}
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: sBg, color: sColor, fontWeight: 600 }}>{statusLabel(step.status)}</span>
                  </div>
                  <div style={{ paddingLeft: 28, fontSize: 12, color: '#6b7280', lineHeight: 1.65, marginBottom: step.output || isHumanRunning ? 8 : 0 }}>{step.desc}</div>
                  {step.output && (
                    <div style={{ paddingLeft: 28, fontSize: 11, color: sColor, background: sBg, padding: '7px 12px 7px 28px', borderRadius: 7, lineHeight: 1.65, borderLeft: `3px solid ${sColor}` }}>
                      {step.output}
                    </div>
                  )}
                  {/* 人工复核表单（Cursor 风格） */}
                  {isHumanRunning && (
                    <div style={{ paddingLeft: 28, marginTop: 8 }}>
                      <div style={{ padding: '14px 16px', background: '#fff', border: '1.5px solid #fde68a', borderRadius: 10, boxShadow: '0 2px 8px rgba(217,119,6,0.08)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                          <span style={{ fontSize: 14 }}>⏸</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#92400e' }}>等待人工复核</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#a16207', marginBottom: 10 }}>请确认现场情况后选择处理方式</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                          {['确认通过，继续执行后续流程', '需要调整，返回上一步修改', '降级处理，转人工持续跟踪'].map(opt => (
                            <div
                              key={opt}
                              onClick={(e) => { e.stopPropagation(); }}
                              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 7, border: '1px solid #fde68a', cursor: 'pointer', background: '#fefce8', transition: 'all 0.12s', fontSize: 12, color: '#78350f' }}
                              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#fef08a30'}
                            >
                              <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #d97706', flexShrink: 0 }} />
                              {opt}
                            </div>
                          ))}
                        </div>
                        <textarea
                          placeholder="补充说明（可选）..."
                          onClick={e => e.stopPropagation()}
                          style={{ width: '100%', border: '1px solid #fde68a', borderRadius: 7, padding: '7px 10px', fontSize: 11, outline: 'none', resize: 'none', boxSizing: 'border-box', height: 48, fontFamily: 'inherit', color: '#374151', lineHeight: 1.6, background: '#fefce8' }}
                        />
                        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); message.success('已确认，流程继续执行'); }}
                            style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: 'none', background: '#d97706', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                          >提交复核结果</button>
                          <button
                            onClick={(e) => { e.stopPropagation(); message.warning('已驳回，工单将回退至跟踪处置'); }}
                            style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #dc2626', background: '#fff', color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
                          >驳回</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // ══════════════════════════════════════════════
    //  通用任务详情（对话+执行流程模式）
    // ══════════════════════════════════════════════
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <TaskHeader />
        {/* 水平执行流程（仅 fixed/scheduled 展示） */}
        {task.taskType !== 'chat' && task.steps && task.steps.length > 0 && (
          <div style={{ padding: '12px 20px', background: '#fff', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 10 }}>执行流程</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
              {/* 连线 */}
              <div style={{ position: 'absolute', top: 8, left: 8, right: 8, height: 2, background: 'linear-gradient(90deg, #6366F1, #a5b4fc)', borderRadius: 1, zIndex: 0 }} />
              {task.steps.map((step) => {
                const dotColor = step.status === 'done' ? '#6366F1' : step.status === 'running' ? '#16a34a' : '#d1d5db';
                return (
                  <div key={step.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: dotColor, border: '2px solid #fff', boxShadow: `0 0 0 2px ${dotColor}`, marginBottom: 6, flexShrink: 0 }} />
                    <div style={{ fontSize: 10, color: step.status === 'waiting' ? '#bbb' : '#374151', textAlign: 'center', lineHeight: 1.4, maxWidth: 72, fontWeight: step.status === 'running' ? 600 : 400 }}>{step.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* 对话消息流 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10, background: '#f5f6fa' }}>
          {task.steps && task.steps.filter(s => s.status === 'done' || s.status === 'running').map(step => {
            const isHumanRunning = step.type === 'human' && step.status === 'running';
            if (isHumanRunning) {
              return (
                <div key={step.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#d97706,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>审</div>
                  <div style={{ background: '#fff', borderRadius: '4px 12px 12px 12px', border: '1.5px solid #fde68a', padding: '12px 14px', maxWidth: '88%', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', minWidth: 240 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <span style={{ fontSize: 13 }}>⏸</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#92400e' }}>等待人工确认</span>
                      <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 2 }}>· Human-in-the-loop</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#4b5563', marginBottom: 10, lineHeight: 1.7 }}>{step.desc}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: 8 }}>
                      {['✓ 确认通过', '↩ 需要调整', '⬇ 降级跟踪'].map(opt => (
                        <button
                          key={opt}
                          onClick={() => message.success('已确认，流程继续执行')}
                          style={{ padding: '5px 13px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', background: '#f0fdf4', border: '1.5px solid #86efac', color: '#15803d', transition: 'all 0.15s' }}
                        >{opt}</button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <div key={step.id}>
                {step.output && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: activeEmp ? imEmpGradient(activeEmp.name) : 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{activeEmp?.name.charAt(0) ?? 'AI'}</div>
                    <div style={{ maxWidth: '80%' }}>
                      <div style={{ fontSize: 10, color: '#bbb', marginBottom: 3 }}>{step.name} {step.time && `· ${step.time}`}</div>
                      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e8e8f0', overflow: 'hidden', marginBottom: 4 }}>
                        <div style={{ padding: '7px 12px', background: '#f8f8ff', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#6366F1', fontWeight: 600 }}>{step.name}</span>
                          <span style={{ marginLeft: 'auto', fontSize: 10, padding: '1px 7px', borderRadius: 8, background: '#ecfdf5', color: '#059669', fontWeight: 600 }}>已完成</span>
                        </div>
                        <div style={{ padding: '8px 12px', fontSize: 11, color: '#374151', lineHeight: 1.65 }}>{step.output}</div>
                      </div>
                      {step.desc && <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.5 }}>{step.desc}</div>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };



  // ── 过滤员工（用于 @mention 等） ──
  const filteredContacts = allEmployees.filter(e =>
    !search || e.name.includes(search) || e.dept.includes(search) || e.domain.includes(search)
  );

  const mentionCandidates = allEmployees;
  const filteredMentions = mentionCandidates.filter(e => e.name.includes(mentionFilter));

  // ── 通讯录：过滤 + 排序（按 sortOrder） ──
  const filteredContactList = contactList.filter(entry =>
    !search || entry.name.includes(search)
  );
  const sortedContactList = [...filteredContactList].sort((a, b) => a.sortOrder - b.sortOrder);

  // ── 通知中心：收集所有已完成任务作为通知 ──
  interface NotifItem {
    id: string;       // empId + taskId
    empId: string;
    empName: string;
    taskTitle: string;
    result: string;
    time: string;
    duration?: string;
  }
  const allNotifs: NotifItem[] = React.useMemo(() => {
    const list: NotifItem[] = [];
    Object.entries(MOCK_TASKS).forEach(([empId, tasks]) => {
      const emp = allEmployees.find(e => e.id === empId);
      tasks.filter(t => t.status === 'done').forEach(t => {
        list.push({
          id: `${empId}-${t.id}`,
          empId,
          empName: emp?.name || empId,
          taskTitle: t.title,
          result: t.result || '任务已完成',
          time: t.time,
          duration: t.duration,
        });
      });
    });
    // 按时间倒序（简单字符串比较，格式 HH:mm 足够）
    return list.sort((a, b) => b.time.localeCompare(a.time));
  }, [allEmployees]);
  const unreadCount = allNotifs.filter(n => !readNotifIds.has(n.id)).length;


  // ── 渲染单条通讯录条目（单员工 or 群聊统一） ──
  const renderEntry = (entry: ContactEntry) => {
    const isActive = activeConvId === entry.id || (activeConv?.type === 'single' && activeConv.empIds[0] === entry.id);
    const menuOpen = contactMenuId === entry.id;

    // 头像
    let avatarContent: React.ReactNode;
    let avatarBg: string;
    let statusDot: React.ReactNode = null;

    const empTasks = MOCK_TASKS[entry.id] ?? [];
    const running = empTasks.filter(t => t.status === 'running').length;
    avatarBg = imEmpGradient(entry.name);
    avatarContent = entry.name.charAt(0);
    if (running > 0) {
      statusDot = (
        <span style={{ position: 'absolute', bottom: -1, right: -1, width: 9, height: 9, borderRadius: '50%', background: '#22c55e', border: '2px solid #fff' }} />
      );
    }

    // 副标题
    let subtitle: React.ReactNode;
    const emp = allEmployees.find(e => e.id === entry.id);
    subtitle = <span style={{ fontSize: 11, color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp?.domain || entry.lastText}</span>;

    const handleClick = () => {
      setContactMenuId(null);
      openConversation(entry.id, true);
    };

    return (
      <div
        key={entry.id}
        onClick={handleClick}
        onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setContactMenuId(entry.id); }}
        style={{
          padding: '9px 14px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5',
          background: isActive ? 'linear-gradient(135deg, #EEF2FF, #F5F3FF)' : 'transparent',
          borderLeft: isActive ? '3px solid #6366F1' : '3px solid transparent',
          transition: 'background 0.15s', position: 'relative',
        }}
        onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = '#fafbff'; }}
        onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* 头像 */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, fontWeight: 700 }}>
              {avatarContent}
            </div>
            {statusDot}
          </div>
          {/* 内容 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {entry.name}
              </span>
              {(entry.unread ?? 0) > 0 && (
                <span style={{ fontSize: 10, minWidth: 16, height: 16, borderRadius: 8, background: '#EF4444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, padding: '0 4px', flexShrink: 0 }}>
                  {entry.unread}
                </span>
              )}
              <span style={{ fontSize: 10, color: '#bbb', flexShrink: 0 }}>{entry.lastTime}</span>
            </div>
            {subtitle}
          </div>
        </div>

      </div>
    );
  };

  return (
    <>
      {showOpPlanEditor && (
        <OperationPlanEditor
          templateName={opPlanTemplate}
          onBack={() => setShowOpPlanEditor(false)}
        />
      )}
    <div style={{ width: '100%', display: 'flex', gap: 0, height: '100%', alignSelf: 'stretch', flex: 1, minHeight: 0 }}>

      {/* ────────────────────────────────────────────────────────── */}
      {/* ── 左侧边栏：通讯录 ── */}
      {/* ────────────────────────────────────────────────────────── */}
      <div
        style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#fff', borderRight: '1px solid #f0f0f0', position: 'relative' }}
        onClick={() => setContactMenuId(null)}
      >
        {/* 顶部标题 */}
        <div style={{ padding: '13px 16px 12px', borderBottom: '1px solid #f0f0f0', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>通讯录</span>
          <span style={{ fontSize: 11, color: '#bbb', marginLeft: 2 }}>{sortedContactList.length} 个联系人</span>
          {/* 通知铃铛 */}
          <div
            onClick={() => setNotifPanelOpen(v => !v)}
            style={{ marginLeft: 'auto', position: 'relative', width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: notifPanelOpen ? '#EEF2FF' : 'transparent', transition: 'background 0.15s' }}
            onMouseEnter={e => { if (!notifPanelOpen) (e.currentTarget as HTMLDivElement).style.background = '#f5f4ff'; }}
            onMouseLeave={e => { if (!notifPanelOpen) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
            title="任务完成通知"
          >
            <span style={{ fontSize: 16 }}>🔔</span>
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: 2, right: 2,
                minWidth: 16, height: 16, borderRadius: 8,
                background: '#EF4444', color: '#fff',
                fontSize: 9, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 3px', lineHeight: 1,
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
        </div>

        {/* 搜索框 */}
        <div style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: 9, fontSize: 13, color: '#bbb', pointerEvents: 'none', lineHeight: 1 }}>🔍</span>
            <input
              placeholder="搜索员工名称..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '7px 10px 7px 30px', borderRadius: 7, border: '1px solid #e8e8e8', fontSize: 12, outline: 'none', boxSizing: 'border-box', background: '#fafafa' }}
            />
          </div>
        </div>

        {/* 通知面板（覆盖在联系人列表上方） */}
        {notifPanelOpen && (
          <div
            style={{
              position: 'absolute', top: 54, left: 0, right: 0, bottom: 0,
              background: '#fff', zIndex: 10,
              display: 'flex', flexDirection: 'column',
              borderTop: '1px solid #f0f0f0',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* 面��头 */}
            <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #f5f5f5', flexShrink: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a', flex: 1 }}>任务完成通知</span>
              {unreadCount > 0 && (
                <span
                  onClick={() => setReadNotifIds(new Set(allNotifs.map(n => n.id)))}
                  style={{ fontSize: 11, color: '#6366F1', cursor: 'pointer', fontWeight: 500 }}
                >
                  全部已读
                </span>
              )}
              <div
                onClick={() => setNotifPanelOpen(false)}
                style={{ width: 22, height: 22, borderRadius: 6, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 13, color: '#999', flexShrink: 0 }}
              >×</div>
            </div>

            {/* 通知列表 */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {allNotifs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#bbb', fontSize: 12 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🔔</div>
                  暂无任务通知
                </div>
              ) : allNotifs.map(n => {
                const isRead = readNotifIds.has(n.id);
                return (
                  <div
                    key={n.id}
                    onClick={() => setReadNotifIds(prev => { const s = new Set(prev); s.add(n.id); return s; })}
                    style={{
                      padding: '11px 14px',
                      borderBottom: '1px solid #f7f7f7',
                      cursor: 'pointer',
                      background: isRead ? '#fff' : '#FAFAFF',
                      transition: 'background 0.15s',
                      position: 'relative',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f5f4ff'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = isRead ? '#fff' : '#FAFAFF'}
                  >
                    {/* 未读蓝点 */}
                    {!isRead && (
                      <span style={{
                        position: 'absolute', left: 5, top: '50%', transform: 'translateY(-50%)',
                        width: 5, height: 5, borderRadius: '50%', background: '#6366F1',
                      }} />
                    )}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, paddingLeft: 6 }}>
                      {/* 图标 */}
                      <div style={{
                        width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                        background: 'linear-gradient(135deg,#22c55e,#16a34a)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 15,
                      }}>
                        ✅
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* 员工名 + 时间 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>{n.empName}</span>
                          <span style={{ fontSize: 10, color: '#d1d5db', marginLeft: 'auto', flexShrink: 0 }}>{n.time}</span>
                        </div>
                        {/* 任务标题 */}
                        <div style={{ fontSize: 11, color: '#1a1a1a', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>
                          {n.taskTitle}
                        </div>
                        {/* 结果 */}
                        <div style={{ fontSize: 10, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {n.result}
                        </div>
                        {/* 耗时 */}
                        {n.duration && (
                          <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 3 }}>
                            耗时 {n.duration}
                          </div>
                        )}
                        {/* 继续追问按钮 */}
                        <div style={{ marginTop: 7, display: 'flex', justifyContent: 'flex-end' }}>
                          {followedUpNotifs.has(n.id) ? (
                            <span style={{ fontSize: 10, color: '#059669', fontWeight: 500 }}>✓ 已加入任务列表</span>
                          ) : (
                            <div
                              onClick={e => {
                                e.stopPropagation();
                                setFollowedUpNotifs(prev => { const s = new Set(prev); s.add(n.id); return s; });
                                setReadNotifIds(prev => { const s = new Set(prev); s.add(n.id); return s; });
                                const newTask: TaskItem = {
                                  id: `followup-${n.id}`,
                                  title: `继续追问：${n.taskTitle}`,
                                  status: 'waiting' as const,
                                  time: new Date().toTimeString().slice(0,5),
                                  taskType: 'scheduled' as const,
                                  steps: [],
                                };
                                setExtraTasks(prev => ({
                                  ...prev,
                                  [n.empId]: [...(prev[n.empId] ?? []), newTask],
                                }));
                                // 跳转到该员工的会话
                                openConversation(n.empId, true);
                                setNotifPanelOpen(false);
                              }}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '3px 9px', borderRadius: 6,
                                border: '1px solid #c7d2fe',
                                background: '#f0f0ff',
                                color: '#6366F1',
                                fontSize: 10, fontWeight: 600,
                                cursor: 'pointer',
                              }}
                              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#e0e7ff'}
                              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = '#f0f0ff'}
                            >
                              💬 继续追问
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 统一通讯录列表 — 分组展开收起 */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {sortedContactList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#bbb', fontSize: 12 }}>暂无结果</div>
          ) : sortedContactList.map(entry => renderEntry(entry))}
        </div>
      </div>


      {/* ────────────────────────────────────────────────────────── */}
      {/* ── 右侧：聊天 + 任务详情 ── */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeConv ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f7f8fc', minHeight: 0 }}>

          {/* ── 头部：对话信息 + 按钮 ── */}
          <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', flexShrink: 0, padding: '14px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* 员工头像 */}
            <div style={{ width: 44, height: 44, borderRadius: 11, flexShrink: 0, background: activeEmp ? imEmpGradient(activeEmp.name) : '#bbb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 700 }}>
              {activeEmp?.name.charAt(0) || '?'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{activeConv.name}</div>
              {activeEmp && (
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{activeEmp.domain}</div>
              )}
            </div>
            {tasks.length > 0 && (
              <Tooltip title={rightPanelCollapsed ? '展开任务栏' : '收起任务栏'}>
                <button
                  onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
                  style={{ display: 'flex', alignItems: 'center', padding: '5px 8px', borderRadius: 7, border: '1px solid #e5e7eb', background: rightPanelCollapsed ? '#f0f0ff' : '#fff', color: rightPanelCollapsed ? '#6366F1' : '#6b7280', fontSize: 14, cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' }}
                >
                  {rightPanelCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                </button>
              </Tooltip>
            )}
            </div>
            {/* 已装配技能 */}
            {(() => {
              const skills = AGENT_SKILLS[activeConv.name] ?? [];
              if (!skills.length) return null;
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: '#aaa', flexShrink: 0 }}>已装配技能</span>
                  {skills.slice(0, 4).map(skill => (
                    <Tooltip key={skill.name} title={skill.desc}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#f0f0ff', color: '#6366F1', border: '1px solid #e0e7ff', cursor: 'default', userSelect: 'none' }}>
                        {skill.icon} {skill.name}
                      </span>
                    </Tooltip>
                  ))}
                  {skills.length > 4 && <span style={{ fontSize: 11, color: '#bbb' }}>+{skills.length - 4} 项</span>}
                </div>
              );
            })()}
          </div>

          {/* ── 内容区：任务详情 OR 聊天消息 ── */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {selectedTask ? (
              /* 任务详情：全屏展示，无对话 */
              renderTaskDetail(selectedTask)
            ) : (
              /* 聊天消息 */
              <div style={{ flex: 1, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activeConv.messages.length === 0 && (
                <div style={{ textAlign: 'center', color: '#bbb', padding: '32px 0' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
                  <div style={{ fontSize: 13, marginBottom: 16, color: '#bbb' }}>
                    {`向 ${activeConv.name} 发送任务或提问`}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7, textAlign: 'left', maxWidth: 280, margin: '0 auto' }}>
                    {(activeConv.empIds[0] === 'de-009'
                      ? ['帮我审核这份供应商合同', '检查合同中的违约责任条款', '识别合同里的风险条款']
                      : ['帮我生成今日工作汇报', '当前有哪些任务在执行？', '最近一次任务的结果是什么？']
                    ).map(tip => (
                      <div key={tip} onClick={() => setChatInput(tip)} style={{ padding: '8px 13px', borderRadius: 8, background: '#f5f4ff', color: '#6366F1', fontSize: 12, cursor: 'pointer', border: '1px solid #e0deff' }}>{tip}</div>
                    ))}
                  </div>
                </div>
              )}
              {activeConv.messages.map((msg, i) => {
                const empAvatar = msg.empId ? imEmpGradient(getEmployee(msg.empId)?.name || '') : '#bbb';
                const empChar   = msg.empId ? (getEmployee(msg.empId)?.name.charAt(0) || '?') : '?';

                // ── step：行内进度提示，无气泡 ──
                if (msg.kind === 'step') {
                  return (
                    <div key={msg.id} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '3px 0', animation: 'fadeSlideIn 0.2s ease' }}>
                      <div style={{ width: 28, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic', lineHeight: 1.5 }}>{msg.text}</span>
                    </div>
                  );
                }

                // ── tool-call：工具调用卡片 ──
                if (msg.kind === 'tool-call' && msg.toolCard) {
                  const tc = msg.toolCard;
                  const open = toolCardOpen[msg.id] ?? { req: false, res: false };
                  const toggleReq = () => setToolCardOpen(prev => ({ ...prev, [msg.id]: { ...open, req: !open.req } }));
                  const toggleRes = () => setToolCardOpen(prev => ({ ...prev, [msg.id]: { ...open, res: !open.res } }));
                  return (
                    <div key={msg.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', animation: 'fadeSlideIn 0.2s ease' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: empAvatar, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>{empChar}</div>
                      <div style={{ maxWidth: '82%', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                        {/* 卡头 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#f9fafb', borderBottom: '1px solid #f0f0f0' }}>
                          <span style={{ fontSize: 13 }}>🔧</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{msg.text}</span>
                          <code style={{ fontSize: 10, color: '#6366F1', background: '#eef2ff', padding: '1px 6px', borderRadius: 4, marginLeft: 2 }}>{tc.toolName}</code>
                        </div>
                        {/* 请求参数 */}
                        <div style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <div onClick={toggleReq} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', cursor: 'pointer', userSelect: 'none' }}>
                            <span style={{ fontSize: 10, color: '#6b7280', fontWeight: 600 }}>请求参数</span>
                            <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 'auto' }}>{open.req ? '∧' : '∨'}</span>
                          </div>
                          {open.req && (
                            <div style={{ position: 'relative', background: '#1e1e2e', overflow: 'auto' }}>
                              <pre style={{ margin: 0, padding: '10px 14px', fontSize: 11, color: '#a6e3a1', fontFamily: 'monospace', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{tc.request}</pre>
                            </div>
                          )}
                        </div>
                        {/* 返回结果 */}
                        <div>
                          <div onClick={toggleRes} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', cursor: 'pointer', userSelect: 'none' }}>
                            <span style={{ fontSize: 10, color: '#6b7280', fontWeight: 600 }}>返回结果</span>
                            <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 'auto' }}>{open.res ? '∧' : '∨'}</span>
                          </div>
                          {open.res && (
                            <div style={{ background: '#1e1e2e', overflow: 'auto' }}>
                              <pre style={{ margin: 0, padding: '10px 14px', fontSize: 11, color: '#89dceb', fontFamily: 'monospace', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{tc.response}</pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                // ── human-pending：Cursor 风格人工确认卡片 ──
                if (msg.kind === 'human-pending' && msg.id === agentPendingMsgId) {
                  return (
                    <div key={msg.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', animation: 'fadeSlideIn 0.2s ease' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: empAvatar, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>{empChar}</div>
                      <div style={{ maxWidth: '84%', border: '1.5px solid #e0e7ff', borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: '0 2px 8px rgba(99,102,241,0.08)' }}>
                        {/* 卡头 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg,#d97706,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>⏸</div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>需要你的确认</span>
                          <span style={{ fontSize: 11, color: '#9ca3af' }}>· Human-in-the-loop</span>
                        </div>
                        {/* 风险详情 */}
                        <div style={{ padding: '12px 14px 10px', fontSize: 12, color: '#4b5563', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                        {/* Chip 按钮 */}
                        <div style={{ padding: '0 14px 10px', display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                          {([
                            { label: '✓ 接受建议修改', value: 'accept', bg: '#f0fdf4', border: '#86efac', activeBg: '#16a34a', activeColor: '#fff', defaultColor: '#15803d' },
                            { label: '↩ 保留原文，标注风险', value: 'keep', bg: '#fff7ed', border: '#fed7aa', activeBg: '#d97706', activeColor: '#fff', defaultColor: '#b45309' },
                            { label: '✎ 自定义处理方案', value: 'custom', bg: '#f0f9ff', border: '#bae6fd', activeBg: '#0284c7', activeColor: '#fff', defaultColor: '#0369a1' },
                          ] as const).map(({ label, value, bg, border, activeBg, activeColor, defaultColor }) => {
                            const active = agentReviewChoice === value;
                            return (
                              <button key={value} onClick={() => setAgentReviewChoice(active ? '' : value)}
                                style={{ padding: '5px 13px', borderRadius: 20, fontSize: 12, fontWeight: active ? 600 : 500, cursor: 'pointer', transition: 'all 0.15s',
                                  background: active ? activeBg : bg, border: `1.5px solid ${active ? activeBg : border}`,
                                  color: active ? activeColor : defaultColor, boxShadow: active ? '0 2px 6px rgba(0,0,0,0.12)' : 'none' }}
                              >{label}</button>
                            );
                          })}
                        </div>
                        {/* 选中后滑入输入框 */}
                        {agentReviewChoice && (
                          <div style={{ padding: '0 14px 12px', animation: 'fadeSlideIn 0.15s ease' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 10px 6px 12px' }}>
                              <input
                                autoFocus
                                value={agentReviewSupplement}
                                onChange={e => setAgentReviewSupplement(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    if (agentContinueFnRef.current) agentContinueFnRef.current();
                                  }
                                }}
                                placeholder="补充说明（可选，Enter 提交）…"
                                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 12, background: 'transparent', color: '#374151', fontFamily: 'inherit' }}
                              />
                              <button
                                onClick={() => { if (agentContinueFnRef.current) agentContinueFnRef.current(); }}
                                style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                              >↑</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                // ── normal（包括已确认后的 human-pending）：标准气泡 ──

                // ── op-template-select：方案模板选择卡片 ──
                if (msg.kind === 'op-template-select') {
                  const templates = [
                    { name: '220kV变电站年度检修标准模板', tag: '推荐', desc: '适用于220kV及以上变电站年度预防性试验与设备检修，含13项人工待填项', fills: 13, icon: '⚡' },
                    { name: '变电站专项消缺作业模板', tag: '', desc: '适用于设备缺陷消除及专项整治作业，含10项人工待填项', fills: 10, icon: '🔧' },
                    { name: '新设备投运检修方案模板', tag: '', desc: '适用于新设备首次投运前的调试与验收检修，含15项人工待填项', fills: 15, icon: '📋' },
                  ];
                  return (
                    <div key={msg.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: empAvatar, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>{empChar}</div>
                      <div style={{ maxWidth: '88%' }}>
                        <div style={{ padding: '9px 13px', fontSize: 13, lineHeight: 1.6, borderRadius: '14px 14px 14px 2px', background: '#fff', color: '#1a1a1a', border: '1px solid #ebebeb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 10 }}>
                          {msg.text}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {templates.map((tpl, ti) => (
                            <div key={ti} style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                              <span style={{ fontSize: 22, flexShrink: 0 }}>{tpl.icon}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{tpl.name}</span>
                                  {tpl.tag && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, background: '#fef3c7', color: '#92400e', fontWeight: 600 }}>{tpl.tag}</span>}
                                </div>
                                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{tpl.desc}</div>
                                <span style={{ fontSize: 11, color: '#9ca3af' }}>待填项：{tpl.fills} 项</span>
                              </div>
                              <button
                                onClick={() => { setOpPlanTemplate(tpl.name); setShowOpPlanEditor(true); }}
                                style={{ flexShrink: 0, padding: '6px 14px', background: '#6366F1', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}
                              >
                                进入方案编辑
                              </button>
                            </div>
                          ))}
                        </div>
                        <div style={{ fontSize: 10, color: '#ccc', marginTop: 6 }}>{msg.time}</div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end' }}>
                    {msg.role === 'bot' && (
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: empAvatar, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                        {empChar}
                      </div>
                    )}
                    <div style={{ maxWidth: '80%' }}>
                      <div style={{ padding: '9px 13px', fontSize: 13, lineHeight: 1.6, borderRadius: msg.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px', background: msg.role === 'user' ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : '#fff', color: msg.role === 'user' ? '#fff' : '#1a1a1a', border: msg.role === 'bot' ? '1px solid #ebebeb' : 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', whiteSpace: 'pre-wrap' }}>
                        {msg.text}
                      </div>
                      <div style={{ fontSize: 10, color: '#ccc', marginTop: 3, textAlign: msg.role === 'user' ? 'right' : 'left' }}>{msg.time}</div>
                    </div>
                  </div>
                );
              })}
              {sending && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: activeEmp ? imEmpGradient(activeEmp.name) : '#bbb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>
                    {activeEmp?.name.charAt(0) || '?'}
                  </div>
                  <div style={{ padding: '11px 15px', background: '#fff', borderRadius: '14px 14px 14px 2px', border: '1px solid #ebebeb' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <div className="ai-typing-dot" /><div className="ai-typing-dot" /><div className="ai-typing-dot" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            )}
          </div>

          {/* ── 对话评分面板 ── */}
          {!selectedTask && ratingOpen && (
            <div style={{ padding: '14px 16px', background: '#FFFBEB', borderTop: '1px solid #FDE68A', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#92400E' }}>为本次对话评分</span>
                <span onClick={() => setRatingOpen(false)} style={{ fontSize: 12, color: '#bbb', cursor: 'pointer' }}>✕</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <span key={i} onMouseEnter={() => setHoverRating(i)} onMouseLeave={() => setHoverRating(0)} onClick={() => { setSubmittedRating(i); }} style={{ fontSize: 28, cursor: 'pointer', color: i <= (hoverRating || submittedRating) ? '#F59E0B' : '#E5E7EB', transition: 'color 0.1s', lineHeight: 1 }}>★</span>
                ))}
                {(hoverRating || submittedRating) > 0 && (
                  <span style={{ fontSize: 12, color: '#B45309', fontWeight: 600, marginLeft: 6 }}>
                    {['', '很差', '较差', '一般', '较好', '非常好'][hoverRating || submittedRating]}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setRatingOpen(false)} style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: '1px solid #e8e8e8', background: '#fff', fontSize: 12, color: '#888', cursor: 'pointer' }}>取消</button>
                <button disabled={submittedRating === 0} onClick={() => { if (activeEmp && submittedRating > 0) { employeeStore.submitRating({ employeeId: activeEmp.id, sessionId: `session-${Date.now()}`, score: submittedRating, tags: [], comment: '', timestamp: new Date().toISOString() }); } setRatingOpen(false); }} style={{ flex: 2, padding: '7px 0', borderRadius: 8, border: 'none', background: submittedRating > 0 ? 'linear-gradient(135deg, #F59E0B, #FBBF24)' : '#e8e8e8', fontSize: 12, fontWeight: 600, color: submittedRating > 0 ? '#fff' : '#bbb', cursor: submittedRating > 0 ? 'pointer' : 'not-allowed' }}>提交评分</button>
              </div>
            </div>
          )}

          {/* ── 输入框 ── */}
          {<div style={{ padding: '10px 12px 12px', borderTop: '1px solid #f0f0f0', background: '#fff', flexShrink: 0, position: 'relative' }}>
            {/* 统一输入容器：边框包裹 textarea + 工具栏 */}
            <div style={{ border: '1px solid #e2e2e8', borderRadius: 12, background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'visible', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', transition: 'border-color 0.15s' }}
              onFocusCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#a5b4fc'; }}
              onBlurCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e2e2e8'; }}
            >
              {/* 已上传文件 chips（有文件时在 textarea 上方） */}
              {uploadedDocs.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '8px 12px 0' }}>
                  {uploadedDocs.map(doc => (
                    <div key={doc.id} style={{ padding: '3px 9px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 20, fontSize: 11, color: '#2563EB', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: 12 }}>📎</span>
                      <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</span>
                      <span onClick={() => setUploadedDocs(prev => prev.filter(d => d.id !== doc.id))} style={{ cursor: 'pointer', color: '#93C5FD', fontSize: 11, lineHeight: 1 }}>✕</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Textarea：无边框，融入容器 */}
              <textarea
                ref={inputRef}
                value={chatInput}
                onChange={handleInputChange}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={`给 ${activeConv.name} 发送任务或提问...`}
                disabled={sending}
                rows={3}
                style={{ width: '100%', padding: '12px 14px 6px', border: 'none', outline: 'none', fontSize: 13, background: 'transparent', resize: 'none', fontFamily: 'inherit', lineHeight: 1.65, boxSizing: 'border-box', color: '#1a1a1a' }}
              />

              {/* 工具栏 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px 9px' }}>

                {/* + 新任务 */}
                <button
                  title="新建任务"
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 20, border: '1px solid #e0deff', background: '#EEF2FF', color: '#6366F1', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' }}
                  onMouseEnter={e => { const el = e.currentTarget; el.style.background = '#6366F1'; el.style.color = '#fff'; }}
                  onMouseLeave={e => { const el = e.currentTarget; el.style.background = '#EEF2FF'; el.style.color = '#6366F1'; }}
                >
                  <span style={{ fontSize: 14, lineHeight: 1 }}>+</span> 新任务
                </button>

                {/* 隐藏 file input */}
                <input type="file" ref={fileInputRef} onChange={e => { const files = e.target.files; if (files) Array.from(files).forEach(file => setUploadedDocs(prev => [...prev, { id: `doc-${Date.now()}-${file.name}`, name: file.name, size: file.size }])); (e.target as HTMLInputElement).value = ''; }} style={{ display: 'none' }} multiple />

                {/* 📎 上传文件：仅图标方块 */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="上传文件"
                  style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6B7280', fontSize: 16, flexShrink: 0, transition: 'all 0.15s' }}
                  onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = '#A5B4FC'; el.style.color = '#6366F1'; el.style.background = '#F5F3FF'; }}
                  onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = '#E5E7EB'; el.style.color = '#6B7280'; el.style.background = '#fff'; }}
                >
                  📎
                </button>

                {/* 右侧发送 */}
                <button
                  onClick={handleSend}
                  disabled={!chatInput.trim() || sending}
                  style={{ marginLeft: 'auto', padding: '6px 20px', borderRadius: 20, border: 'none', fontSize: 13, fontWeight: 600, cursor: chatInput.trim() && !sending ? 'pointer' : 'not-allowed', background: chatInput.trim() && !sending ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : '#E5E7EB', color: chatInput.trim() && !sending ? '#fff' : '#9CA3AF', transition: 'all 0.15s', flexShrink: 0 }}
                >
                  {sending ? '发送中…' : '发送'}
                </button>
              </div>
            </div>

            {/* @mention 下拉（容器外，定位在输入框上方） */}
            {mentionOpen && filteredMentions.length > 0 && (
              <div style={{ position: 'absolute', bottom: 'calc(100% - 6px)', left: 12, right: 12, background: '#fff', boxShadow: '0 -4px 20px rgba(0,0,0,0.1)', borderRadius: 12, overflow: 'hidden', zIndex: 300, maxHeight: 230, overflowY: 'auto', border: '1px solid #e8e8f0' }}>
                <div style={{ padding: '7px 14px 5px', fontSize: 10, color: '#9CA3AF', fontWeight: 600, letterSpacing: 0.5, borderBottom: '1px solid #F3F4F6' }}>选择要 @ 的员工</div>
                {filteredMentions.map(emp => (
                  <div
                    key={emp.id}
                    onClick={() => insertMention(emp.name)}
                    style={{ padding: '8px 14px', fontSize: 13, cursor: 'pointer', borderBottom: '1px solid #F9FAFB', display: 'flex', alignItems: 'center', gap: 10, transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#F5F3FF'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                  >
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: imEmpGradient(emp.name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{emp.name}</div>
                      <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>{emp.domain}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>}
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafbff' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 10 }}>👋 欢迎使用数字员工，期待与您高效协作</div>
            <div style={{ fontSize: 13, color: '#9ca3af' }}>点击任意数字员工可查看任务执行进度并进行对话</div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* ── 右侧任务面板（可拖动调整宽度） ── */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeConv && activeEmp && tasks.length > 0 && !rightPanelCollapsed && (() => {
        const isPatrolList = activeEmp?.id === 'de-008';

        // 任务类型图标配置
        const TASK_TYPE_CFG: Record<string, { icon: string; label: string; color: string; bg: string }> = {
          scheduled: { icon: '⏰', label: '定时任务', color: '#7C3AED', bg: '#EDE9FE' },
          fixed:     { icon: '🔄', label: '固定流程', color: '#1D4ED8', bg: '#DBEAFE' },
          chat:      { icon: '💬', label: '对话模式', color: '#0F766E', bg: '#CCFBF1' },
        };




        const filteredTasks = tasks.filter(t => {
          const searchOk = !taskSearch || t.title.includes(taskSearch);
          const dateOk = !taskDateFrom || (t.time >= taskDateFrom.slice(11) || taskDateFrom === '');
          return searchOk;
        });
        const dateFilterActive = !!(taskDateFrom || taskDateTo);

        return (
          <div style={{ width: rightPanelWidth, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff', position: 'relative' }}>
            {/* 左侧拖动条 */}
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                const startX = e.clientX;
                const startWidth = rightPanelWidth;
                const onMove = (ev: MouseEvent) => {
                  const delta = startX - ev.clientX;
                  const newWidth = Math.min(500, Math.max(290, startWidth + delta));
                  setRightPanelWidth(newWidth);
                };
                const onUp = () => {
                  document.removeEventListener('mousemove', onMove);
                  document.removeEventListener('mouseup', onUp);
                };
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
              }}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 4,
                cursor: 'col-resize',
                background: 'transparent',
                zIndex: 10,
                transition: 'background 0.15s'
              }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#6366F1'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
            />

            {/* 任务列表头部 */}
            <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid #f0f0f0', borderLeft: '1px solid #f0f0f0', background: '#fff', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>任务</span>
                <span style={{ fontSize: 11, color: '#bbb', fontWeight: 400 }}>近期 {tasks.length} 条</span>
              </div>
              {/* 搜索框 + 漏斗筛选 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: 8, fontSize: 12, color: '#ccc', pointerEvents: 'none' }}>🔍</span>
                  <input
                    placeholder="请输入搜索内容"
                    value={taskSearch}
                    onChange={e => setTaskSearch(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px 6px 26px', borderRadius: 7, border: `1.5px solid ${taskSearch ? '#6366F1' : '#e8e8e8'}`, fontSize: 11, outline: 'none', boxSizing: 'border-box', background: '#fafafa', color: '#333' }}
                  />
                </div>
                {/* 漏斗图标 */}
                <div
                  onClick={() => setTaskFilterOpen(v => !v)}
                  style={{
                    width: 32, height: 32, borderRadius: 7, flexShrink: 0,
                    border: `1.5px solid ${taskFilterOpen || dateFilterActive ? '#6366F1' : '#e8e8e8'}`,
                    background: taskFilterOpen || dateFilterActive ? '#f0f0ff' : '#fafafa',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', position: 'relative',
                  }}
                >
                  <span style={{ fontSize: 14, color: taskFilterOpen || dateFilterActive ? '#6366F1' : '#999' }}>⊟</span>
                  {dateFilterActive && (
                    <span style={{
                      position: 'absolute', top: -4, right: -4,
                      width: 14, height: 14, borderRadius: '50%',
                      background: '#6366F1', color: '#fff',
                      fontSize: 9, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      lineHeight: 1,
                    }}>1</span>
                  )}
                </div>
              </div>
              {/* 日期筛选下拉 */}
              {taskFilterOpen && (
                <div style={{ marginTop: 8, padding: '8px 0', background: '#fff', borderRadius: 8, border: '1px solid #e8e8e8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px' }}>
                    <input
                      type="date"
                      value={taskDateFrom}
                      onChange={e => setTaskDateFrom(e.target.value)}
                      placeholder="创建开始日期"
                      style={{ flex: 1, padding: '5px 6px', borderRadius: 6, border: '1px solid #e8e8e8', fontSize: 10, color: taskDateFrom ? '#333' : '#bbb', outline: 'none', background: '#fafafa', minWidth: 0 }}
                    />
                    <span style={{ fontSize: 10, color: '#bbb', flexShrink: 0 }}>—</span>
                    <input
                      type="date"
                      value={taskDateTo}
                      onChange={e => setTaskDateTo(e.target.value)}
                      placeholder="创建结束日期"
                      style={{ flex: 1, padding: '5px 6px', borderRadius: 6, border: '1px solid #e8e8e8', fontSize: 10, color: taskDateTo ? '#333' : '#bbb', outline: 'none', background: '#fafafa', minWidth: 0 }}
                    />
                    <span style={{ fontSize: 11, color: '#bbb', cursor: 'pointer', flexShrink: 0 }} onClick={() => { setTaskDateFrom(''); setTaskDateTo(''); }}>✕</span>
                  </div>
                </div>
              )}
            </div>

            {/* 任务列表内容 */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: 7, borderLeft: '1px solid #f0f0f0' }}>
              {filteredTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#bbb', fontSize: 13 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>暂无任务记录
                </div>
              ) : filteredTasks.map(task => {
                const cfg = taskStatusCfg[task.status] ?? taskStatusCfg.waiting;
                const isSelected = selectedTaskId === task.id;
                const hasHumanNode = task.steps.some(s =>
                  s.type === 'human' ? s.status !== 'done' : (s.name?.includes('人工') || s.desc?.includes('人工')) && s.status !== 'done'
                );
                const priorityCfg: Record<string, { label: string; color: string; bg: string; border: string }> = {
                  high:   { label: '高', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
                  medium: { label: '中', color: '#d97706', bg: '#fefce8', border: '#fde68a' },
                  low:    { label: '低', color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb' },
                };
                const pri = task.priority ? priorityCfg[task.priority] : null;

                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(isSelected ? null : task.id)}
                    style={{
                      background: isSelected ? 'linear-gradient(135deg,#EEF2FF,#F5F3FF)' : '#fafafa',
                      borderRadius: 9,
                      border: isSelected ? `1.5px solid #6366F1` : task.status === 'overtime' ? '1px solid #fecaca' : hasHumanNode ? '1px solid #fde68a' : `1px solid ${cfg.color}28`,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      padding: '10px 12px',
                    }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = '#f0f0fa'; }}
                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = '#fafafa'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 6 }}>
                      {/* 任务类型小图标 */}
                      {task.taskType && TASK_TYPE_CFG[task.taskType] && (
                        <span
                          title={TASK_TYPE_CFG[task.taskType].label}
                          style={{ fontSize: 13, flexShrink: 0, marginTop: 1, lineHeight: 1 }}
                        >
                          {TASK_TYPE_CFG[task.taskType].icon}
                        </span>
                      )}
                      <div style={{ flex: 1, fontSize: 12, color: isSelected ? '#4338CA' : '#333', lineHeight: 1.5, fontWeight: isSelected ? 600 : 500 }}>{task.title}</div>
                      <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 7, background: cfg.bg, color: cfg.color, fontWeight: 600, flexShrink: 0, marginTop: 1 }}>{cfg.label}</span>
                      {pri && isPatrolList && (
                        <span style={{ flexShrink: 0, fontSize: 9, padding: '1px 5px', borderRadius: 4, background: pri.bg, color: pri.color, fontWeight: 600, border: `1px solid ${pri.border}`, marginTop: 1 }}>P{pri.label}</span>
                      )}
                      {hasHumanNode && (
                        <span title="含人工复核节点" style={{ flexShrink: 0, fontSize: 10, padding: '1px 5px', borderRadius: 6, background: '#fef3c7', color: '#d97706', fontWeight: 600, border: '1px solid #fde68a', marginTop: 1 }}>👤</span>
                      )}
                    </div>
                    {task.result && !isSelected && (
                      <div style={{ fontSize: 10, color: '#666', marginBottom: 5, lineHeight: 1.4, padding: '4px 7px', background: '#fff', borderRadius: 5 }}>💡 {task.result}</div>
                    )}
                    {/* 巡护演示：进度条 */}
                    {isPatrolList && task.progress != null && (
                      <div style={{ marginBottom: 5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontSize: 10, color: '#999' }}>{task.currentNode ?? ''}</span>
                          <span style={{ fontSize: 10, color: cfg.color, fontWeight: 600 }}>{task.progress}%</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 2, background: '#f0f0f0', overflow: 'hidden' }}>
                          <div style={{ width: `${task.progress}%`, height: '100%', borderRadius: 2, background: task.status === 'overtime' ? '#dc2626' : task.status === 'done' ? '#0284c7' : '#16a34a', transition: 'width 0.3s' }} />
                        </div>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8, fontSize: 10, color: '#bbb', alignItems: 'center' }}>
                      <span>🕐 {task.startDate ?? task.time}</span>
                      {task.completedAt && <span>✓ {task.completedAt}</span>}
                      {!task.completedAt && task.duration && <span>⏱ {task.duration}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

    </div>
    </>
  );
};



interface FrontendProps {
  onBackToAdmin?: () => void;
  selectedSkill?: SkillItem | null;
}

const Frontend: React.FC<FrontendProps> = ({ onBackToAdmin, selectedSkill }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showSkillsPanel, setShowSkillsPanel] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const editorRef = useRef<MentionEditorHandle>(null);
  const conversationEditorRef = useRef<MentionEditorHandle>(null);

  // 群组相关状态
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);

  // 初始化2个静态群组示例
  const [agentGroups, setAgentGroups] = useState<AgentGroup[]>([
    {
      id: 'group-demo-1',
      name: '行业分析团队',
      members: [
        { id: '1', name: '互联网行业洞察', icon: '🌐', color: '#6366F1', category: '行业分析' },
        { id: '2', name: '石油行业知识问答小助手', icon: '📚', color: '#8B5CF6', category: '行业分析' },
      ],
      createTime: new Date(Date.now() - 86400000).toISOString(),
      pinned: false,
    },
    {
      id: 'group-demo-2',
      name: '编程开发小组',
      members: [
        { id: '3', name: 'Python编程助手', icon: '🐍', color: '#3B82F6', category: '编程开发' },
        { id: '4', name: 'JavaScript专家', icon: '💛', color: '#F59E0B', category: '编程开发' },
        { id: '5', name: '数据分析师', icon: '📊', color: '#10B981', category: '数据分析' },
      ],
      createTime: new Date(Date.now() - 172800000).toISOString(),
      pinned: false,
    }
  ]);

  const [showAllGroups, setShowAllGroups] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<AgentGroup | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [mentionedAgents, setMentionedAgents] = useState<Agent[]>([]);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');

  // 对话管理相关状态
  const mockAgent: Agent = { id: '5', name: '文案助手', icon: '✍️', color: '#F59E0B', category: '内容创作', isMultiAgent: false };
  const mockConversationId = 'mock-conv-001';
  const mockMessages: Message[] = [
    {
      id: 'mock-msg-1',
      role: 'user',
      content: '帮我写一篇100字的科技类作文',
      timestamp: new Date(Date.now() - 60000 * 5).toISOString(),
    },
    {
      id: 'mock-msg-2',
      role: 'assistant',
      content: `# 科技改变世界\n\n科技是人类文明进步的强大引擎。从蒸汽机的轰鸣到互联网的普及，每一次技术革命都深刻改变了人类的生产与生活方式。\n\n如今，人工智能方兴未艾，大数据赋能千行百业，新能源汽车驶向绿色未来。科技不仅让信息传递更便捷，更让医疗、教育触手可及。\n\n展望未来，科技将持续突破边界，让世界更智慧、更美好。`,
      agentId: '5',
      agentName: '文案助手',
      agentIcon: '✍️',
      timestamp: new Date(Date.now() - 60000 * 4).toISOString(),
      status: 'completed',
    },
  ];
  const mockConversation: Conversation = {
    id: mockConversationId,
    title: '帮我写一篇100字的科技类作文',
    type: 'agent',
    agents: [mockAgent],
    messages: mockMessages,
    createTime: new Date(Date.now() - 60000 * 5).toISOString(),
  };
  const [conversations, setConversations] = useState<Conversation[]>([mockConversation]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(mockConversation);
  const [showMentionPanel, setShowMentionPanel] = useState(false);
  // const [mentionType, setMentionType] = useState<'agent' | 'group' | 'mixed'>('agent');  // 已移除群组选择
  // const [selectedGroups, setSelectedGroups] = useState<AgentGroup[]>([]);  // 已移除群组选择
  const [agentReplyQueue, setAgentReplyQueue] = useState<Agent[]>([]);
  const [currentReplyingAgent, setCurrentReplyingAgent] = useState<Agent | null>(null);
  const [expandedCollaborations, setExpandedCollaborations] = useState<Set<string>>(new Set());
  // 思考折叠状态（msgId → 是否展开）
  const [thinkingExpanded, setThinkingExpanded] = useState<Record<string, boolean>>({});

  // 新建对话相关状态
  const [deepThinking, setDeepThinking] = useState(false);
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // 文档编辑器状态
  const [docPanel, setDocPanel] = useState<DocPanel | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const [docHistory, setDocHistory] = useState<{ title: string; content: string }[]>([]);
  const [docHistoryIndex, setDocHistoryIndex] = useState(-1);
  const [docUpdatedAt, setDocUpdatedAt] = useState('');
  const [showDocComments, setShowDocComments] = useState(false);
  const [docCopied, setDocCopied] = useState(false);
  // 已转为文档的消息id集合
  const [convertedMsgIds, setConvertedMsgIds] = useState<Set<string>>(new Set());
  const [likedMsgIds, setLikedMsgIds] = useState<Set<string>>(new Set());
  const [dislikedMsgIds, setDislikedMsgIds] = useState<Set<string>>(new Set());
  const [copiedMsgIds, setCopiedMsgIds] = useState<Set<string>>(new Set());
  // 文档编辑器扩展状态
  const [docFullScreen, setDocFullScreen] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [selectionToolbar, setSelectionToolbar] = useState<{visible: boolean; x: number; y: number}>({visible: false, x: 0, y: 0});
  // 评论相关状态
  interface DocComment { id: string; selectedText: string; commentText: string; author: string; avatar: string; time: string; }
  const [docComments, setDocComments] = useState<DocComment[]>([]);
  const [pendingComment, setPendingComment] = useState<{ selectedText: string } | null>(null);
  const [commentInput, setCommentInput] = useState('');
  // 文档面板宽度（可拖拽）
  const [docPanelWidth, setDocPanelWidth] = useState(480);
  const docResizingRef = useRef(false);
  const docResizeStartX = useRef(0);
  const docResizeStartWidth = useRef(480);
  // 更多菜单相关状态
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  // 需求澄清：存储每条消息的澄清项（msgId → ClarificationItem[]）
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<string, ClarificationItem[]>>({});
  // 等待澄清确认的 resolver（msgId → resolve fn）
  const clarificationResolvers = useRef<Record<string, () => void>>({});
  const [showConvShareModal, setShowConvShareModal] = useState(false);
  const [convShareExpiry, setConvShareExpiry] = useState<'7d' | '30d' | '90d' | 'forever'>('90d');
  const [showShareImagePreview, setShowShareImagePreview] = useState(false);
  const [shareImageDataUrl, setShareImageDataUrl] = useState<string | null>(null);
  // 分享：已选消息 id 集合
  const [shareSelectedMsgIds, setShareSelectedMsgIds] = useState<Set<string>>(new Set());
  // 分享：图片生成中
  const [shareImageLoading, setShareImageLoading] = useState(false);
  // 分享：消息预览区 ref
  const sharePreviewRef = useRef<HTMLDivElement>(null);
  // 分享：允许他人访问聊天中的文件
  const [shareAllowFileAccess, setShareAllowFileAccess] = useState(true);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [findResult, setFindResult] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
  const docEditorRef = React.useRef<HTMLDivElement>(null);

  // 对话模式：agent 或 chat
  const [chatMode, setChatMode] = useState<'agent' | 'chat'>('agent');
  // 搜索模式（chat模式下）：normal单轮搜索 / advanced高级搜索
  const [searchMode, setSearchMode] = useState<'normal' | 'advanced' | null>(null);
  // 联网状态（chat模式下）
  const [webSearch, setWebSearch] = useState(false);
  // 联网按钮hover弹窗
  const [showSearchPopover, setShowSearchPopover] = useState(false);
  // 当前场景分类（agent/chat分别维护）
  const [agentSceneCategory, setAgentSceneCategory] = useState('深度写作');
  const [chatSceneCategory, setChatSceneCategory] = useState('知识问答');
  // 当前选中的场景
  const [selectedScene, setSelectedScene] = useState<{ icon: string; name: string; desc: string } | null>(null);

  // 智能体中心相关状态
  const [showAgentCenter, setShowAgentCenter] = useState(false);
  const [agentCenterCategory, setAgentCenterCategory] = useState('全部');
  const [agentCenterSearch, setAgentCenterSearch] = useState('');
  const [showManageDisplay, setShowManageDisplay] = useState(false);
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [squarePinnedAgentIds, setSquarePinnedAgentIds] = useState<string[]>(['1', '2', '3', '4']);
  const [pinnedAgentIds, setPinnedAgentIds] = useState<string[]>(['1', '3', '5', '4', '7']); // 默认固定5个智能体
  const [showOpenClaw, setShowOpenClaw] = useState(false);
  const [openClawTab, setOpenClawTab] = useState<'chat' | 'dashboard'>('chat');
  const [showOpenClawDeployModal, setShowOpenClawDeployModal] = useState(false);
  const [showOpenClawCopyModal, setShowOpenClawCopyModal] = useState(false);
  const [openClawCopyName, setOpenClawCopyName] = useState('OpenClaw助手(副本)');
  const [openClawCopyDesc, setOpenClawCopyDesc] = useState('OpenClaw智能代理：提供多场景AI服务，自动化处理任务，提升工作效率。');
  const isOpenClawDeployed = false; // mock：未部署状态
  const [agentCenterSceneFilter, setAgentCenterSceneFilter] = useState('全部'); // 场景筛选
  const [agentCenterTypeFilter, setAgentCenterTypeFilter] = useState('全部'); // 类型筛选：全部/单智能体/多智能体

  // 所有智能体数据（按类别分组）
  const allAgents: Agent[] = [
    {
      id: '1',
      name: '互联网行业洞察',
      icon: '🌐',
      color: '#6366F1',
      category: '行业分析',
      isMultiAgent: true,
      multiAgentMembers: [
        { id: '1-1', name: '市场分析专家', icon: '📈', color: '#6366F1', category: '行业分析' },
        { id: '1-2', name: '趋势预测专家', icon: '🔮', color: '#6366F1', category: '行业分析' },
        { id: '1-3', name: '竞品分析师', icon: '🎯', color: '#6366F1', category: '行业分析' }
      ]
    },
    { id: '2', name: '石油行业知识问答小助手', icon: '📚', color: '#8B5CF6', category: '行业分析', isMultiAgent: false },
    {
      id: '3',
      name: 'Python编程助手',
      icon: '🐍',
      color: '#3B82F6',
      category: '编程开发',
      isMultiAgent: true,
      multiAgentMembers: [
        { id: '3-1', name: '代码审查专家', icon: '🔍', color: '#3B82F6', category: '编程开发' },
        { id: '3-2', name: '调试专家', icon: '🐛', color: '#3B82F6', category: '编程开发' },
        { id: '3-3', name: '性能优化师', icon: '⚡', color: '#3B82F6', category: '编程开发' }
      ]
    },
    { id: '4', name: 'JavaScript专家', icon: '💛', color: '#F59E0B', category: '编程开发', isMultiAgent: false },
    {
      id: '5',
      name: '数据分析师',
      icon: '📊',
      color: '#10B981',
      category: '数据分析',
      isMultiAgent: true,
      multiAgentMembers: [
        { id: '5-1', name: '数据清洗专家', icon: '🧹', color: '#10B981', category: '数据分析' },
        { id: '5-2', name: '统计分析师', icon: '📐', color: '#10B981', category: '数据分析' },
        { id: '5-3', name: '可视化专家', icon: '📊', color: '#10B981', category: '数据分析' }
      ]
    },
    { id: '6', name: 'SQL优化专家', icon: '🗄️', color: '#06B6D4', category: '数据分析', isMultiAgent: false },
    { id: '7', name: '文案写作助手', icon: '✏️', color: '#EC4899', category: '内容创作', isMultiAgent: false },
    { id: '8', name: '翻译助手', icon: '🌍', color: '#8B5CF6', category: '内容创作', isMultiAgent: false },
  ];

  // 删除旧的agents数组，已改用allAgents
  // const agents = [...]

  const mySkills: Skill[] = [
    { id: '1', name: '写作', icon: '✏️', color: '#F59E0B' },
    { id: '2', name: 'PPT', icon: '📊', color: '#EF4444' },
    { id: '3', name: '视频', icon: '🎬', color: '#F97316' },
    { id: '4', name: '设计', icon: '🎨', color: '#EC4899' },
  ];

  const favoriteFiles: FavoriteFile[] = [
    { id: '1', name: '开启你和AI共用的收藏夹.md', type: 'file' },
  ];

  // 构建树形选择器数据
  const getAgentTreeData = () => {
    const categories = Array.from(new Set(allAgents.map(a => a.category)));
    return categories.map(category => ({
      title: category,
      value: `category-${category}`,
      selectable: false,
      children: allAgents
        .filter(a => a.category === category)
        .map(agent => ({
          title: (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{agent.icon}</span>
              <span>{agent.name}</span>
            </div>
          ),
          value: agent.id,
        }))
    }));
  };

  // 生成群组的主智能体（协调者）
  const createCoordinatorAgent = (groupName: string, members: Agent[]): Agent => {
    const coordinatorNames = [
      '智能协调助手',
      '任务调度器',
      '协作管理员',
      '项目协调员',
      '团队指挥官'
    ];

    const name = coordinatorNames[Math.floor(Math.random() * coordinatorNames.length)];

    return {
      id: `coordinator-${Date.now()}`,
      name: `${name} (${groupName})`,
      icon: '🎯',
      color: '#EC4899', // 粉红色，区别于其他智能体
      category: '协调管理',
    };
  };

  // 创建群组
  const handleCreateGroup = () => {
    if (selectedAgents.length === 0) {
      return;
    }

    const members = allAgents.filter(a => selectedAgents.includes(a.id));
    const coordinator = createCoordinatorAgent(groupName || `群组${agentGroups.length + 1}`, members);

    const newGroup: AgentGroup = {
      id: `group-${Date.now()}`,
      name: groupName || `群组${agentGroups.length + 1}`,
      members,
      coordinator,
      createTime: new Date().toISOString(),
      pinned: false,
    };

    setAgentGroups([...agentGroups, newGroup]);
    setShowGroupModal(false);
    setGroupName('');
    setSelectedAgents([]);

    // 新建完群组直接进入群组聊天
    handleEnterGroup(newGroup);
    message.success('群组创建成功');
  };

  // 进入群组对话
  const handleEnterGroup = (group: AgentGroup) => {
    setCurrentGroup(group);
    setCurrentConversation(null);
    setMessages([]);
    setAgentReplyQueue([]);
    setCurrentReplyingAgent(null);
  };

  // 重命名群组
  const handleRenameGroup = (groupId: string, newName: string) => {
    if (!newName.trim()) {
      message.warning('群组名称不能为空');
      return;
    }

    setAgentGroups(prev => prev.map(g =>
      g.id === groupId ? { ...g, name: newName.trim() } : g
    ));

    if (currentGroup?.id === groupId) {
      setCurrentGroup(prev => prev ? { ...prev, name: newName.trim() } : null);
    }

    setEditingGroupId(null);
    setEditingGroupName('');
    message.success('群组名称已修改');
  };

  // 置顶/取消置顶群组
  const handleTogglePinGroup = (groupId: string) => {
    setAgentGroups(prev => {
      const updated = prev.map(g =>
        g.id === groupId ? { ...g, pinned: !g.pinned } : g
      );
      // 排序：置顶的在前
      return updated.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return 0;
      });
    });

    const group = agentGroups.find(g => g.id === groupId);
    message.success(group?.pinned ? '已取消置顶' : '已置顶');
  };

  // 删除群组
  const handleDeleteGroup = (groupId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个群组吗？删除后无法恢复。',
      okText: '确认',
      cancelText: '取消',
      okButtonProps: {
        danger: true,
      },
      onOk: () => {
        setAgentGroups(prev => prev.filter(g => g.id !== groupId));

        if (currentGroup?.id === groupId) {
          setCurrentGroup(null);
          setMessages([]);
        }

        message.success('群组已删除');
      },
    });
  };

  // 模拟智能体回复（串行版本）
  const simulateAgentReply = async (agent: Agent, userMessage: string, isLastInQueue: boolean = false) => {
    // Thinking阶段
    const thinkingMsg: Message = {
      id: `msg-${Date.now()}-${agent.id}`,
      role: 'assistant',
      content: '',
      agentId: agent.id,
      agentName: agent.name,
      agentIcon: agent.icon,
      timestamp: new Date().toISOString(),
      thinking: '正在深度思考问题...',
      status: 'thinking',
    };
    setMessages(prev => [...prev, thinkingMsg]);

    // 等待1-2秒（模拟thinking时间）
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 偶尔需要澄清（约20%概率）
    const needsClarification = Math.random() < 0.2;

    if (needsClarification) {
      // 显示澄清请求
      setMessages(prev => prev.map(msg =>
        msg.id === thinkingMsg.id
          ? {
              ...msg,
              status: 'waiting_clarification',
              clarificationQuestion: '为了更好地回答您的问题，我需要确认一下：',
              clarificationOptions: [
                '您希望了解更详细的技术细节',
                '您希望了解实际应用场景',
                '您希望获得最佳实践建议'
              ]
            }
          : msg
      ));

      // 这里实际应该等待用户输入，现在模拟自动选择
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Tool调用阶段
    setMessages(prev => prev.map(msg =>
      msg.id === thinkingMsg.id
        ? {
            ...msg,
            status: 'calling',
            thinking: '正在调用工具...',
            toolCalls: [
              { id: 'tool-1', name: 'web_search', status: 'running' },
              { id: 'tool-2', name: 'read_file', status: 'running' }
            ]
          }
        : msg
    ));

    // 等待2-3秒（模拟工具调用时间）
    await new Promise(resolve => setTimeout(resolve, 2500));

    // 完成阶段
    setMessages(prev => prev.map(msg =>
      msg.id === thinkingMsg.id
        ? {
            ...msg,
            status: 'completed',
            content: `我是${agent.name}。针对您的问题"${userMessage}"，经过深度思考和工具调用，我的回答是：\n\n这是一个详细的回答内容，包含了对问题的分析和建议。我已经考虑了多个方面，包括技术实现、最佳实践以及潜在的注意事项。`,
            toolCalls: msg.toolCalls?.map(t => ({ ...t, status: 'completed' as const }))
          }
        : msg
    ));
  };

  // 处理串行回复队列
  const processAgentReplyQueue = async (agents: Agent[], userMessage: string, coordinator?: Agent) => {
    console.log('=== processAgentReplyQueue 被调用 ===');
    console.log('智能体数量:', agents.length);
    console.log('智能体列表:', agents.map(a => a.name));
    console.log('协调者:', coordinator?.name);

    setAgentReplyQueue(agents);

    // 如果有多个智能体，使用协作模式
    if (agents.length > 1) {
      console.log('✅ 多智能体协作模式 - 调用simulateCollaboration');
      // 使用提供的coordinator或从currentGroup获取
      const mainAgent = coordinator || currentGroup?.coordinator;
      if (mainAgent) {
        await simulateCollaboration(agents, userMessage, mainAgent);
      } else {
        // 如果没有主智能体，使用第一个智能体作为协调者
        await simulateCollaboration(agents, userMessage, agents[0]);
      }
    } else {
      console.log('❌ 单智能体模式 - 调用simulateAgentReply');
      // 单个智能体，使用原有逻辑
      setCurrentReplyingAgent(agents[0]);
      await simulateAgentReply(agents[0], userMessage, true);
    }

    setAgentReplyQueue([]);
    setCurrentReplyingAgent(null);
  };

  // 多智能体协作流程模拟（主群组页面）- 完整流程模式
  const simulateCollaboration = async (agents: Agent[], userMessage: string, coordinator: Agent) => {
    console.log('🎯 === simulateCollaboration 开始执行 ===');
    console.log('协调者:', coordinator.name);
    console.log('团队成员:', agents.map(a => a.name));
    console.log('用户消息:', userMessage);

    // 使用主智能体作为协调者

    // 1. init_plan - 主智能体初始化计划
    const initPlanMsg: Message = {
      id: `msg-${Date.now()}-init-plan`,
      role: 'assistant',
      content: '',
      agentId: coordinator.id,
      agentName: coordinator.name,
      agentIcon: coordinator.icon,
      timestamp: new Date().toISOString(),
      status: 'thinking',
      thinking: '📋 正在初始化协作计划...',
    };

    setMessages(prev => [...prev, initPlanMsg]);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const totalPlans = Math.min(agents.length, 3); // 最多3轮plan
    setMessages(prev => prev.map(msg =>
      msg.id === initPlanMsg.id
        ? {
            ...msg,
            status: 'completed',
            thinking: undefined,
            content: `📋 **协作计划初始化完成**\n\n我是${coordinator.name}，将协调 ${agents.length} 个专业智能体完成任务。\n\n团队成员：\n${agents.map((a, i) => `${i + 1}. ${a.icon} ${a.name} - ${a.category}`).join('\n')}\n\n将执行 ${totalPlans} 轮协作计划。`,
          }
        : msg
    ));

    await new Promise(resolve => setTimeout(resolve, 800));

    // 执行多轮plan
    for (let planIndex = 0; planIndex < totalPlans; planIndex++) {
      await executePlanRound(agents, userMessage, planIndex, totalPlans, coordinator);

      // plan之间的间隔
      if (planIndex < totalPlans - 1) {
        await new Promise(resolve => setTimeout(resolve, 600));
      }
    }

    await new Promise(resolve => setTimeout(resolve, 800));

    // 最终summary - 由主智能体发出
    const summaryMsg: Message = {
      id: `msg-${Date.now()}-final-summary`,
      role: 'assistant',
      content: '',
      agentId: coordinator.id,
      agentName: coordinator.name,
      agentIcon: coordinator.icon,
      timestamp: new Date().toISOString(),
      status: 'thinking',
      thinking: '🎯 正在生成最终总结...',
    };

    setMessages(prev => [...prev, summaryMsg]);
    await new Promise(resolve => setTimeout(resolve, 1800));

    const finalSummary = `🎯 **最终协作总结**\n\n我是${coordinator.name}，经过 ${totalPlans} 轮协作计划的执行，团队完成了以下工作：\n\n${agents.map((agent, idx) =>
      `**${idx + 1}. ${agent.icon} ${agent.name}**\n   ${generateAgentSummary(agent, userMessage)}`
    ).join('\n\n')}\n\n✨ 所有任务已完成，我已完成协调工作。建议您根据以上分析采取行动。`;

    setMessages(prev => prev.map(msg =>
      msg.id === summaryMsg.id
        ? {
            ...msg,
            status: 'completed',
            thinking: undefined,
            content: finalSummary,
          }
        : msg
    ));
  };

  // 执行单轮plan
  const executePlanRound = async (
    agents: Agent[],
    userMessage: string,
    planIndex: number,
    totalPlans: number,
    thinker: Agent
  ) => {
    // 2. thinker - 思考阶段
    const thinkerMsg: Message = {
      id: `msg-${Date.now()}-thinker-${planIndex}`,
      role: 'assistant',
      content: '',
      agentId: thinker.id,
      agentName: thinker.name,
      agentIcon: thinker.icon,
      timestamp: new Date().toISOString(),
      status: 'thinking',
      thinking: `🤔 正在思考第 ${planIndex + 1}/${totalPlans} 轮计划...`,
    };

    setMessages(prev => [...prev, thinkerMsg]);
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 确定这一轮需要哪些sub_agent
    const subAgentsForThisRound = agents.slice(
      planIndex % agents.length,
      Math.min((planIndex % agents.length) + 2, agents.length)
    );
    if (subAgentsForThisRound.length === 0) {
      subAgentsForThisRound.push(agents[planIndex % agents.length]);
    }

    // 生成更详细的思考内容
    const thinkingDetails = [
      `📌 **问题分析**：收到用户需求"${userMessage.substring(0, 30)}${userMessage.length > 30 ? '...' : ''}"`,
      `🎯 **任务拆解**：本轮计划将任务分解为${subAgentsForThisRound.length}个并行子任务`,
      `👥 **智能体分配**：`,
      ...subAgentsForThisRound.map((agent, idx) =>
        `   ${idx + 1}. @${agent.name} - 负责${agent.category}相关工作`
      ),
      ``,
      `✅ 开始执行第 ${planIndex + 1}/${totalPlans} 轮协作！`
    ];

    const planContent = thinkingDetails.join('\n');

    setMessages(prev => prev.map(msg =>
      msg.id === thinkerMsg.id
        ? {
            ...msg,
            status: 'completed',
            thinking: undefined,
            content: planContent,
          }
        : msg
    ));

    await new Promise(resolve => setTimeout(resolve, 800));

    // 3 & 4. sub_agent 和 sub_agent_summary - 串行执行
    for (let i = 0; i < subAgentsForThisRound.length; i++) {
      const subAgent = subAgentsForThisRound[i];

      // sub_agent 执行
      await executeSubAgent(subAgent, userMessage, planIndex, i);

      await new Promise(resolve => setTimeout(resolve, 500));

      // sub_agent_summary
      await executeSubAgentSummary(subAgent, userMessage, planIndex, i);

      // 子智能体之间的间隔
      if (i < subAgentsForThisRound.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 600));
      }
    }

    await new Promise(resolve => setTimeout(resolve, 800));

    // 5. 当前plan执行完成检查
    const planCompleteMsg: Message = {
      id: `msg-${Date.now()}-plan-complete-${planIndex}`,
      role: 'assistant',
      content: '',
      agentId: thinker.id,
      agentName: thinker.name,
      agentIcon: thinker.icon,
      timestamp: new Date().toISOString(),
      status: 'thinking',
      thinking: '✅ 检查当前plan执行状态...',
    };

    setMessages(prev => [...prev, planCompleteMsg]);
    await new Promise(resolve => setTimeout(resolve, 1000));

    setMessages(prev => prev.map(msg =>
      msg.id === planCompleteMsg.id
        ? {
            ...msg,
            status: 'completed',
            thinking: undefined,
            content: `✅ **第 ${planIndex + 1} 轮计划执行完成**\n\n已完成 ${subAgentsForThisRound.length} 个子任务。`,
          }
        : msg
    ));

    await new Promise(resolve => setTimeout(resolve, 600));

    // 6. plan_status - 检查整体进度
    const planStatusMsg: Message = {
      id: `msg-${Date.now()}-plan-status-${planIndex}`,
      role: 'assistant',
      content: '',
      agentId: thinker.id,
      agentName: thinker.name,
      agentIcon: thinker.icon,
      timestamp: new Date().toISOString(),
      status: 'thinking',
      thinking: '📊 正在检查整体计划状态...',
    };

    setMessages(prev => [...prev, planStatusMsg]);
    await new Promise(resolve => setTimeout(resolve, 1200));

    const progress = Math.round(((planIndex + 1) / totalPlans) * 100);
    const isAllComplete = planIndex === totalPlans - 1;

    setMessages(prev => prev.map(msg =>
      msg.id === planStatusMsg.id
        ? {
            ...msg,
            status: 'completed',
            thinking: undefined,
            content: `📊 **整体进度：${progress}%**\n\n已完成 ${planIndex + 1}/${totalPlans} 轮计划\n${isAllComplete ? '✅ 所有计划已执行完成！' : '⏳ 继续执行下一轮...'}`,
          }
        : msg
    ));
  };

  // 执行sub_agent
  const executeSubAgent = async (
    agent: Agent,
    userMessage: string,
    planIndex: number,
    subIndex: number
  ) => {
    const subAgentMsg: Message = {
      id: `msg-${Date.now()}-subagent-${planIndex}-${subIndex}`,
      role: 'assistant',
      content: '',
      agentId: agent.id,
      agentName: agent.name,
      agentIcon: agent.icon,
      timestamp: new Date().toISOString(),
      status: 'thinking',
      thinking: `🔧 正在执行子任务...`,
    };

    setMessages(prev => [...prev, subAgentMsg]);
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Tool调用
    const toolCalls: ToolCall[] = [
      { id: `tool-${subAgentMsg.id}`, name: getRandomTool(agent.name), status: 'running' },
    ];

    setMessages(prev => prev.map(msg =>
      msg.id === subAgentMsg.id
        ? {
            ...msg,
            status: 'calling',
            thinking: '🛠️ 调用工具中...',
            toolCalls,
          }
        : msg
    ));

    await new Promise(resolve => setTimeout(resolve, 1500));

    const result = generateSubTaskResult(agent, userMessage);
    const completedToolCalls = toolCalls.map(t => ({ ...t, status: 'completed' as const }));

    setMessages(prev => prev.map(msg =>
      msg.id === subAgentMsg.id
        ? {
            ...msg,
            status: 'completed',
            thinking: undefined,
            content: `🔧 **子任务执行结果**\n\n${result}`,
            toolCalls: completedToolCalls,
          }
        : msg
    ));
  };

  // 执行sub_agent_summary
  const executeSubAgentSummary = async (
    agent: Agent,
    userMessage: string,
    planIndex: number,
    subIndex: number
  ) => {
    const summaryMsg: Message = {
      id: `msg-${Date.now()}-subagent-summary-${planIndex}-${subIndex}`,
      role: 'assistant',
      content: '',
      agentId: agent.id,
      agentName: agent.name,
      agentIcon: agent.icon,
      timestamp: new Date().toISOString(),
      status: 'thinking',
      thinking: '📝 正在总结分析结果...',
    };

    setMessages(prev => [...prev, summaryMsg]);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const summary = `📝 **我的分析总结**\n\n${generateAgentSummary(agent, userMessage)}\n\n关键发现已记录，供后续决策参考。`;

    setMessages(prev => prev.map(msg =>
      msg.id === summaryMsg.id
        ? {
            ...msg,
            status: 'completed',
            thinking: undefined,
            content: summary,
          }
        : msg
    ));
  };

  // 发送消息
  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString(),
    };

    // 更新当前对话的消息
    if (currentConversation) {
      setCurrentConversation({
        ...currentConversation,
        messages: [...currentConversation.messages, userMsg]
      });
      setConversations(prev => prev.map(conv =>
        conv.id === currentConversation.id
          ? { ...conv, messages: [...conv.messages, userMsg] }
          : conv
      ));

      // 让被@的智能体串行回复
      const agentsToReply = mentionedAgents.length > 0
        ? mentionedAgents
        : currentConversation.agents || currentConversation.group?.members.slice(0, 1) || [];

      // 使用串行回复处理
      processAgentReplyQueueInConversation(agentsToReply, inputValue, currentConversation.id);
    } else if (currentGroup) {
      // 在群组中发送消息
      setMessages(prev => [...prev, userMsg]);

      // 让被@的智能体串行回复
      const agentsToReply = mentionedAgents.length > 0
        ? mentionedAgents
        : currentGroup?.members.slice(0, 1) || [];

      // 使用异步串行处理
      processAgentReplyQueue(agentsToReply, inputValue);
    } else {
      // 新建对话场景：根据@的智能体自动创建
      const allMentionedAgents = [...mentionedAgents];

      if (allMentionedAgents.length === 0) {
        message.warning('请先@智能体');
        return;
      }

      const agent = allMentionedAgents[0];

      console.log('=== 发送消息 Debug Info ===');
      console.log('选中的智能体:', agent.name);
      console.log('isMultiAgent:', agent.isMultiAgent);
      console.log('multiAgentMembers:', agent.multiAgentMembers);
      console.log('multiAgentMembers长度:', agent.multiAgentMembers?.length);

      // 检查智能体是否有多智能体标签
      if (agent.isMultiAgent && agent.multiAgentMembers && agent.multiAgentMembers.length > 0) {
        console.log('✅ 触发多智能体协作模式');
        // 多智能体协作模式，进入群组聊天
        const groupName = agent.name;
        const members = agent.multiAgentMembers;

        const coordinator = createCoordinatorAgent(groupName, members);
        console.log('创建的协调者:', coordinator);

        const newGroup: AgentGroup = {
          id: `group-${Date.now()}`,
          name: groupName,
          members: members,
          coordinator,
          createTime: new Date().toISOString(),
          pinned: false,
        };

        setAgentGroups(prev => [...prev, newGroup]);
        setCurrentGroup(newGroup);
        setMessages([userMsg]);
        setAgentReplyQueue([]);
        setCurrentReplyingAgent(null);

        processAgentReplyQueue(members, inputValue, coordinator);

        message.success(`已进入"${newGroup.name}"多智能体协作模式`);
      } else {
        console.log('❌ 普通单智能体模式');
        // 普通单个智能体，创建单聊对话
        const newConversation: Conversation = {
          id: `conv-${Date.now()}`,
          title: `与${agent.name}的���话`,
          type: 'agent',
          agents: [agent],
          messages: [userMsg],
          createTime: new Date().toISOString(),
        };

        setConversations(prev => [...prev, newConversation]);
        setCurrentConversation(newConversation);

        simulateAgentReplyInConversation(agent, inputValue, newConversation.id);

        message.success(`已创建与${agent.name}的对话`);
      }
    }

    setInputValue('');
    setMentionedAgents([]);
    // setSelectedGroups([]);  // 已移除群组选择功能
  };

  // 处理对话中的串行回复队列
  const processAgentReplyQueueInConversation = async (agents: Agent[], userMessage: string, conversationId: string) => {
    // 如果有多个智能体，使用协作模式
    if (agents.length > 1) {
      await simulateCollaborationInConversation(agents, userMessage, conversationId);
    } else {
      // 单个智能体，使用原有逻辑
      await simulateAgentReplyInConversation(agents[0], userMessage, conversationId);
    }
  };

  // 多智能体协作流程模拟 - 完整流程模式（对话场景）
  const simulateCollaborationInConversation = async (agents: Agent[], userMessage: string, conversationId: string) => {
    const thinker = agents[0];

    const updateConversation = (updater: (messages: Message[]) => Message[]) => {
      setConversations(prev => prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, messages: updater(conv.messages) }
          : conv
      ));
      setCurrentConversation(prev => prev ? {
        ...prev,
        messages: updater(prev.messages)
      } : null);
    };

    // 1. init_plan
    const initPlanMsg: Message = {
      id: `msg-${Date.now()}-init-plan`,
      role: 'assistant',
      content: '',
      agentId: thinker.id,
      agentName: thinker.name,
      agentIcon: thinker.icon,
      timestamp: new Date().toISOString(),
      status: 'thinking',
      thinking: '📋 正在初始化协作计划...',
    };

    updateConversation(msgs => [...msgs, initPlanMsg]);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const totalPlans = Math.min(agents.length, 3);
    updateConversation(msgs => msgs.map(msg =>
      msg.id === initPlanMsg.id
        ? {
            ...msg,
            status: 'completed',
            thinking: undefined,
            content: `📋 **协作计划初始化完成**\n\n将执行 ${totalPlans} 轮协作计划，每轮由不同智能体负责特定任务。`,
          }
        : msg
    ));

    await new Promise(resolve => setTimeout(resolve, 800));

    // 执行多轮plan
    for (let planIndex = 0; planIndex < totalPlans; planIndex++) {
      await executePlanRoundInConversation(agents, userMessage, planIndex, totalPlans, thinker, conversationId);

      if (planIndex < totalPlans - 1) {
        await new Promise(resolve => setTimeout(resolve, 600));
      }
    }

    await new Promise(resolve => setTimeout(resolve, 800));

    // 最终summary
    const summaryMsg: Message = {
      id: `msg-${Date.now()}-final-summary`,
      role: 'assistant',
      content: '',
      agentId: thinker.id,
      agentName: thinker.name,
      agentIcon: thinker.icon,
      timestamp: new Date().toISOString(),
      status: 'thinking',
      thinking: '🎯 正在生成最终总结...',
    };

    updateConversation(msgs => [...msgs, summaryMsg]);
    await new Promise(resolve => setTimeout(resolve, 1800));

    const finalSummary = `🎯 **最终协作总结**\n\n经过 ${totalPlans} 轮协作计划的执行，团队完成了以下工作：\n\n${agents.map((agent, idx) =>
      `**${idx + 1}. ${agent.name}**\n   ${generateAgentSummary(agent, userMessage)}`
    ).join('\n\n')}\n\n✨ 所有任务已完成，建议您根据以上分析采取行动。`;

    updateConversation(msgs => msgs.map(msg =>
      msg.id === summaryMsg.id
        ? {
            ...msg,
            status: 'completed',
            thinking: undefined,
            content: finalSummary,
          }
        : msg
    ));
  };

  // 执行单轮plan（对话场景）
  const executePlanRoundInConversation = async (
    agents: Agent[],
    userMessage: string,
    planIndex: number,
    totalPlans: number,
    thinker: Agent,
    conversationId: string
  ) => {
    const updateConversation = (updater: (messages: Message[]) => Message[]) => {
      setConversations(prev => prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, messages: updater(conv.messages) }
          : conv
      ));
      setCurrentConversation(prev => prev ? {
        ...prev,
        messages: updater(prev.messages)
      } : null);
    };

    // thinker
    const thinkerMsg: Message = {
      id: `msg-${Date.now()}-thinker-${planIndex}`,
      role: 'assistant',
      content: '',
      agentId: thinker.id,
      agentName: thinker.name,
      agentIcon: thinker.icon,
      timestamp: new Date().toISOString(),
      status: 'thinking',
      thinking: `🤔 正在思考第 ${planIndex + 1}/${totalPlans} 轮计划...`,
    };

    updateConversation(msgs => [...msgs, thinkerMsg]);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const subAgentsForThisRound = agents.slice(
      planIndex % agents.length,
      Math.min((planIndex % agents.length) + 2, agents.length)
    );
    if (subAgentsForThisRound.length === 0) {
      subAgentsForThisRound.push(agents[planIndex % agents.length]);
    }

    // 生成更详细的思考内容
    const thinkingDetails = [
      `📌 **问题分析**：收到用户需求"${userMessage.substring(0, 30)}${userMessage.length > 30 ? '...' : ''}"`,
      `🎯 **任务拆解**：本轮计划将任务分解为${subAgentsForThisRound.length}个并行子任务`,
      `👥 **智能体分配**：`,
      ...subAgentsForThisRound.map((agent, idx) =>
        `   ${idx + 1}. @${agent.name} - 负责${agent.category}相关工作`
      ),
      ``,
      `✅ 开始执行第 ${planIndex + 1}/${totalPlans} 轮协作！`
    ];

    const planContent = thinkingDetails.join('\n');

    updateConversation(msgs => msgs.map(msg =>
      msg.id === thinkerMsg.id
        ? {
            ...msg,
            status: 'completed',
            thinking: undefined,
            content: planContent,
          }
        : msg
    ));

    await new Promise(resolve => setTimeout(resolve, 800));

    // sub_agent 和 sub_agent_summary
    for (let i = 0; i < subAgentsForThisRound.length; i++) {
      const subAgent = subAgentsForThisRound[i];

      await executeSubAgentInConversation(subAgent, userMessage, planIndex, i, conversationId);
      await new Promise(resolve => setTimeout(resolve, 500));
      await executeSubAgentSummaryInConversation(subAgent, userMessage, planIndex, i, conversationId);

      if (i < subAgentsForThisRound.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 600));
      }
    }

    await new Promise(resolve => setTimeout(resolve, 800));

    // plan完成检查
    const planCompleteMsg: Message = {
      id: `msg-${Date.now()}-plan-complete-${planIndex}`,
      role: 'assistant',
      content: '',
      agentId: thinker.id,
      agentName: thinker.name,
      agentIcon: thinker.icon,
      timestamp: new Date().toISOString(),
      status: 'thinking',
      thinking: '✅ 检查当前plan执行状态...',
    };

    updateConversation(msgs => [...msgs, planCompleteMsg]);
    await new Promise(resolve => setTimeout(resolve, 1000));

    updateConversation(msgs => msgs.map(msg =>
      msg.id === planCompleteMsg.id
        ? {
            ...msg,
            status: 'completed',
            thinking: undefined,
            content: `✅ **第 ${planIndex + 1} 轮计划执行完成**\n\n已完成 ${subAgentsForThisRound.length} 个子任务。`,
          }
        : msg
    ));

    await new Promise(resolve => setTimeout(resolve, 600));

    // plan_status
    const planStatusMsg: Message = {
      id: `msg-${Date.now()}-plan-status-${planIndex}`,
      role: 'assistant',
      content: '',
      agentId: thinker.id,
      agentName: thinker.name,
      agentIcon: thinker.icon,
      timestamp: new Date().toISOString(),
      status: 'thinking',
      thinking: '📊 正在检查整体计划状态...',
    };

    updateConversation(msgs => [...msgs, planStatusMsg]);
    await new Promise(resolve => setTimeout(resolve, 1200));

    const progress = Math.round(((planIndex + 1) / totalPlans) * 100);
    const isAllComplete = planIndex === totalPlans - 1;

    updateConversation(msgs => msgs.map(msg =>
      msg.id === planStatusMsg.id
        ? {
            ...msg,
            status: 'completed',
            thinking: undefined,
            content: `📊 **整体进度：${progress}%**\n\n已完成 ${planIndex + 1}/${totalPlans} 轮计划\n${isAllComplete ? '✅ 所有计划已执行完成！' : '⏳ 继续执行下一轮...'}`,
          }
        : msg
    ));
  };

  // 执行sub_agent（对话场景）
  const executeSubAgentInConversation = async (
    agent: Agent,
    userMessage: string,
    planIndex: number,
    subIndex: number,
    conversationId: string
  ) => {
    const updateConversation = (updater: (messages: Message[]) => Message[]) => {
      setConversations(prev => prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, messages: updater(conv.messages) }
          : conv
      ));
      setCurrentConversation(prev => prev ? {
        ...prev,
        messages: updater(prev.messages)
      } : null);
    };

    const subAgentMsg: Message = {
      id: `msg-${Date.now()}-subagent-${planIndex}-${subIndex}`,
      role: 'assistant',
      content: '',
      agentId: agent.id,
      agentName: agent.name,
      agentIcon: agent.icon,
      timestamp: new Date().toISOString(),
      status: 'thinking',
      thinking: `🔧 正在执行子任务...`,
    };

    updateConversation(msgs => [...msgs, subAgentMsg]);
    await new Promise(resolve => setTimeout(resolve, 1200));

    const toolCalls: ToolCall[] = [
      { id: `tool-${subAgentMsg.id}`, name: getRandomTool(agent.name), status: 'running' },
    ];

    updateConversation(msgs => msgs.map(msg =>
      msg.id === subAgentMsg.id
        ? {
            ...msg,
            status: 'calling',
            thinking: '🛠️ 调用工具中...',
            toolCalls,
          }
        : msg
    ));

    await new Promise(resolve => setTimeout(resolve, 1500));

    const result = generateSubTaskResult(agent, userMessage);
    const completedToolCalls = toolCalls.map(t => ({ ...t, status: 'completed' as const }));

    updateConversation(msgs => msgs.map(msg =>
      msg.id === subAgentMsg.id
        ? {
            ...msg,
            status: 'completed',
            thinking: undefined,
            content: `🔧 **子任务执行结果**\n\n${result}`,
            toolCalls: completedToolCalls,
          }
        : msg
    ));
  };

  // 执行sub_agent_summary（对话场景）
  const executeSubAgentSummaryInConversation = async (
    agent: Agent,
    userMessage: string,
    planIndex: number,
    subIndex: number,
    conversationId: string
  ) => {
    const updateConversation = (updater: (messages: Message[]) => Message[]) => {
      setConversations(prev => prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, messages: updater(conv.messages) }
          : conv
      ));
      setCurrentConversation(prev => prev ? {
        ...prev,
        messages: updater(prev.messages)
      } : null);
    };

    const summaryMsg: Message = {
      id: `msg-${Date.now()}-subagent-summary-${planIndex}-${subIndex}`,
      role: 'assistant',
      content: '',
      agentId: agent.id,
      agentName: agent.name,
      agentIcon: agent.icon,
      timestamp: new Date().toISOString(),
      status: 'thinking',
      thinking: '📝 正在总结分析结果...',
    };

    updateConversation(msgs => [...msgs, summaryMsg]);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const summary = `📝 **我的分析总结**\n\n${generateAgentSummary(agent, userMessage)}\n\n关键发现已记录，供后续决策参考。`;

    updateConversation(msgs => msgs.map(msg =>
      msg.id === summaryMsg.id
        ? {
            ...msg,
            status: 'completed',
            thinking: undefined,
            content: summary,
          }
        : msg
    ));
  };

  // 生成子任务结果
  const generateSubTaskResult = (agent: Agent, userMessage: string): string => {
    const results: Record<string, string[]> = {
      '数据分析师': [
        '📊 数据分析结果：\n- Q3用户活跃度提升12%\n- 付费转化率达到8.5%\n- 用户平均停留时长增加至25分钟',
        '📈 关键指标分析：\n- 新增用户量：15,234人（环比+18%）\n- 流失率降低至3.2%\n- 核心功能使用率提升至67%',
        '🎯 数据洞察：\n- 主要增长来源：社交媒体推广\n- 高价值用户占比上升至23%\n- 周末活跃度明显高于工作日'
      ],
      '文案助手': [
        '✍️ 文案方案A：\n「数据会说话！Q3成绩单来了📊 用户活跃度飙升12%，你还不来体验？限时福利等你拿！」',
        '💡 创意文案B：\n「这个季度，我们一起创造了奇迹✨ 15,000+新伙伴加入，付费转化率破新高！感谢有你🙏」',
        '🎨 营销建议：\n- 标题突出数据亮点\n- 配图使用对比图表\n- CTA设置限时优惠'
      ],
      'Python编程助手': [
        '🐍 代码实现方案：\n```python\ndef analyze_user_data():\n    # 数据清洗\n    df = clean_data(raw_data)\n    # 统计分析\n    return df.groupby("date").agg(metrics)\n```',
        '⚡ 性能优化建议：\n- 使用pandas进行批量处理\n- 采用异步IO提升效率\n- 缓存中间结果减少重复计算',
        '🔧 技术方案：\n- 数据库：PostgreSQL\n- 分析工具：Pandas + NumPy\n- 可视化：Matplotlib'
      ],
      'JavaScript专家': [
        '💛 前端实现方案：\n```js\nconst fetchData = async () => {\n  const res = await api.get("/analytics")\n  return processChartData(res.data)\n}\n```',
        '🚀 性能优化：\n- 使用React.memo减少重渲染\n- 实现虚拟滚动提升列表性能\n- 代码分割降低首屏加载时间',
        '🎯 用户体验优化：\n- 添加骨架屏加载\n- 实现数据实时更新\n- 优化移动端适配'
      ],
      '互联网行业洞察': [
        '🌐 行业趋势分析：\n- AI驱动成为主流\n- 垂直领域深耕成趋势\n- 用户体验成核心竞争力',
        '📱 市场机会：\n- 短视频+电商融合\n- 企业数字化转型加速\n- 下沉市场潜力巨大',
        '💼 竞争格局：\n- 头部平台占据70%市场\n- 细分赛道涌现新玩家\n- 技术壁垒愈发重要'
      ],
      '石油行业知识问答小助手': [
        '🛢️ 行业知识：\n- 原油价格受地缘政治影响大\n- 新能源转型加速行业变革\n- 炼化一体化成发展方向',
        '📊 市场分析：\n- 国际油价震荡区间：70-90美元/桶\n- 国内成品油需求稳中有升\n- 天然气消费量持续增长',
        '⚙️ 技术进展：\n- 页岩油开采技术成熟\n- 碳捕捉技术商业化探索\n- 智慧油田建设加速'
      ],
    };

    const agentResults = results[agent.name] || [
      `✅ 完成了${agent.category}领域的专业分析`,
      `📋 针对"${userMessage}"提供了详细建议`,
      `🎯 输出了可执行的行动方案`
    ];

    // 随机选择一个结果
    return agentResults[Math.floor(Math.random() * agentResults.length)];
  };

  // 生成智能体总结
  const generateAgentSummary = (agent: Agent, userMessage: string): string => {
    const summaries: Record<string, string[]> = {
      '数据分析师': [
        '完成数据清洗与分析，识别出3个关键增长指标，为决策提供数据支撑',
        '��过多维度数据对比，发现用户行为的核心规律，输出可视化报告',
        '建立了数据监控看板，实现关键指标的实时追踪与预警'
      ],
      '文案助手': [
        '撰写了3版营销文案，覆盖不同渠道和用户群体，预期转化率提升15%',
        '优化了品牌传播话术，突出数据亮点，增强用户信任感',
        '制定了内容营销日历，规划了未来30天的传播节奏'
      ],
      'Python编程助手': [
        '实现了自动化数据处理脚本，将分析效率提升80%',
        '搭建了数据分析pipeline，支持增量数据的实时处理',
        '优化了算法性能，将计算时间从5分钟缩短至30秒'
      ],
      'JavaScript专家': [
        '完成前端数据可视化组件，支持交互式图表展示',
        '优化了页面加载性能，首屏渲染时间降低至1.2秒',
        '实现了响应式设计，确保移动端用户体验'
      ],
      '互联网行业洞察': [
        '分析了行业top10竞品策略，找到3个差异化机会点',
        '预测了未来6个月的市场趋势，为产品规划提供方向',
        '识别了2个高潜力细分市场，建议优先布局'
      ],
      '石油行业知识问答小助手': [
        '提供了行业专业知识支持，解答了技术难点',
        '分析了油价波动因素，给出了成本优化建议',
        '梳理了行业政策变化，识别合规风险点'
      ],
    };

    const agentSummaries = summaries[agent.name] || [
      `完成了${agent.category}领域的深度分析`,
      `为"${userMessage.substring(0, 20)}..."提供了专业建议`,
      `输出了可落地的执行方案`
    ];

    return agentSummaries[Math.floor(Math.random() * agentSummaries.length)];
  };

  // 获取随机工具名称（智能体特定）
  const getRandomTool = (agentName?: string): string => {
    const toolsByAgent: Record<string, string[]> = {
      '数据分析师': ['database_query', 'data_analysis', 'sql_execute', 'excel_processor'],
      '文案助手': ['web_search', 'content_analyzer', 'trend_monitor', 'keyword_extractor'],
      'Python编程助手': ['code_execution', 'pip_install', 'jupyter_notebook', 'pytest_runner'],
      'JavaScript专家': ['npm_install', 'webpack_build', 'eslint_check', 'browser_test'],
      '互联网行业洞察': ['web_search', 'news_aggregator', 'market_analyzer', 'competitor_tracker'],
      '石油行业知识问答小助手': ['knowledge_base', 'industry_report', 'price_monitor', 'regulatory_check'],
    };

    const agentTools = agentName && toolsByAgent[agentName]
      ? toolsByAgent[agentName]
      : ['web_search', 'read_file', 'database_query', 'api_call', 'data_analysis', 'code_execution'];

    return agentTools[Math.floor(Math.random() * agentTools.length)];
  };

  // 在对话中模拟智能体回复（异步串行版本）
  const simulateAgentReplyInConversation = async (agent: Agent, userMessage: string, conversationId: string) => {
    const msgId = `msg-${Date.now()}-${agent.id}`;

    // ── 生成与用户需求相关的澄清问题 ────────────────────────
    const buildClarificationItems = (text: string): ClarificationItem[] => {
      const items: ClarificationItem[] = [
        {
          id: 'q1',
          question: '期望的输出形式',
          type: 'select',
          options: ['结构化报告', '简洁摘要', '分步骤说明', '对话式解答'],
          selectedOption: '结构化报告',
        },
        {
          id: 'q2',
          question: '内容深度要求',
          type: 'select',
          options: ['快速概览（300字内）', '标准分析（500~800字）', '深度报告（1000字以上）'],
          selectedOption: '标准分析（500~800字）',
        },
        {
          id: 'q3',
          question: '补充背景信息（可选）',
          type: 'input',
          inputValue: '',
        },
      ];
      // 根据关键词动态追加一条场景问题
      if (/数据|分析|报表|统计/.test(text)) {
        items.splice(1, 0, {
          id: 'q0',
          question: '数据来源',
          type: 'select',
          options: ['已有数据集', '需要联网搜索', '知识库内部数据'],
          selectedOption: '需要联网搜索',
        });
      } else if (/代码|开发|程序|bug|fix/.test(text)) {
        items.splice(1, 0, {
          id: 'q0',
          question: '编程语言 / 技术栈',
          type: 'select',
          options: ['Python', 'JavaScript / TypeScript', 'Java', '其他'],
          selectedOption: 'Python',
        });
      } else if (/文案|写作|营销|内容/.test(text)) {
        items.splice(1, 0, {
          id: 'q0',
          question: '目标受众',
          type: 'select',
          options: ['普通用户', '专业人士', 'B端决策者', '青少年'],
          selectedOption: '普通用户',
        });
      }
      return items;
    };

    const initItems = buildClarificationItems(userMessage);

    // ── Step 1：短暂思考后展示澄清卡片 ─────────────────────
    const clarifyMsg: Message = {
      id: msgId,
      role: 'assistant',
      content: '',
      agentId: agent.id,
      agentName: agent.name,
      agentIcon: agent.icon,
      timestamp: new Date().toISOString(),
      thinking: '正在分析需求...',
      status: 'thinking',
    };

    setConversations(prev => prev.map(conv =>
      conv.id === conversationId
        ? { ...conv, messages: [...conv.messages, clarifyMsg] }
        : conv
    ));
    setCurrentConversation(prev => prev ? { ...prev, messages: [...prev.messages, clarifyMsg] } : null);

    await new Promise(resolve => setTimeout(resolve, 900));

    // 切换到 waiting_clarification，挂载澄清项
    const toClarifying = (msg: Message) =>
      msg.id === msgId
        ? { ...msg, status: 'waiting_clarification' as const, thinking: undefined, clarificationItems: initItems }
        : msg;

    setConversations(prev => prev.map(conv =>
      conv.id === conversationId ? { ...conv, messages: conv.messages.map(toClarifying) } : conv
    ));
    setCurrentConversation(prev => prev ? { ...prev, messages: prev.messages.map(toClarifying) } : null);

    // 初始化 clarificationAnswers 状态
    setClarificationAnswers(prev => ({ ...prev, [msgId]: initItems }));

    // ── Step 2：等待用户点击"确认执行" ──────────────────────
    await new Promise<void>(resolve => {
      clarificationResolvers.current[msgId] = resolve;
    });

    // 标记已确认
    const toConfirmed = (msg: Message) =>
      msg.id === msgId
        ? { ...msg, clarificationConfirmed: true, thinking: '需求已确认，正在规划任务...' }
        : msg;

    setConversations(prev => prev.map(conv =>
      conv.id === conversationId ? { ...conv, messages: conv.messages.map(toConfirmed) } : conv
    ));
    setCurrentConversation(prev => prev ? { ...prev, messages: prev.messages.map(toConfirmed) } : null);

    await new Promise(resolve => setTimeout(resolve, 800));

    // ── Step 3：工具调用阶段 ──────────────────────────────
    const tool1 = getRandomTool(agent.name);
    const tool2 = getRandomTool(agent.name);
    const updateWithToolCalls = (msg: Message) =>
      msg.id === msgId
        ? {
            ...msg,
            status: 'calling' as const,
            thinking: '正在调用工具执行任务...',
            toolCalls: [
              { id: 'tool-1', name: tool1, status: 'running' as const },
              { id: 'tool-2', name: tool2, status: 'running' as const },
            ],
          }
        : msg;

    setConversations(prev => prev.map(conv =>
      conv.id === conversationId ? { ...conv, messages: conv.messages.map(updateWithToolCalls) } : conv
    ));
    setCurrentConversation(prev => prev ? { ...prev, messages: prev.messages.map(updateWithToolCalls) } : null);

    await new Promise(resolve => setTimeout(resolve, 2500));

    // ── Step 4：输出结果 ────────────────────────────────────
    const isWritingScene = agent.category === '内容创作' || agent.id === 'scene-assistant' ||
      ['研究报告', '长文写作', '营销文案', '内容优化', '作文', '文章', '写作', '科技', '科学'].some(k => agent.name.includes(k) || userMessage.includes(k));

    const wordCountMatch = userMessage.match(/(\d+)\s*字/);
    const requestedWords = wordCountMatch ? parseInt(wordCountMatch[1]) : 0;
    const isSciTech = ['科技', '科学', '技术', '人工智能', 'AI', '数字', '智能'].some(k => userMessage.includes(k));

    const shortEssayContent = requestedWords > 0 && requestedWords <= 200 ?
      (isSciTech ?
        `# 科技改变世界\n\n科技是人类文明进步的强大引擎。从蒸汽机的轰鸣到互联网的普及，每一次技术革命都深刻改变了人类的生产与生活方式。\n\n如今，人工智能方兴未艾，大数据赋能千行百业，新能源汽车驶向绿色未来。科技不仅让信息传递更便捷，更让医疗、教育触手可及。\n\n展望未来，科技将持续突破边界，让世界更智慧、更美好。`
        : `# ${userMessage.slice(0, 20)}\n\n${userMessage}是一个值得深入探讨的主题。它与我们的生活息息相关，影响着每一个人的成长与发展。\n\n通过不断学习与实践，我们能更深刻地理解其中的意义与价值。每一步探索都是向未来迈进的坚实脚印。\n\n让我们以开放的心态，勇于尝试，在实践中收获成长，共同创造更美好的明天。`)
      : null;

    const articleContent = isWritingScene
      ? (shortEssayContent ?? `# ${userMessage.slice(0, 30)}${userMessage.length > 30 ? '……' : ''}

## 引言

在当今快速变化的时代，这一议题正变得愈发重要。无论是从学术研究的角度，还是从实践应用的层面来看，深入理解这一主题都具有重要的现实意义。本文将从多个维度加以分析，探讨其背后的核心逻辑与价值所在。

## 背景与现状

纵观近年来的发展脉络，我们可以清晰地看到这一领域正在经历深刻变革。相关数据显示，越来越多的人开始关注并参与到这一议题的讨论中来。与此同时，技术的进步与社会的演变也为我们提供了全新的视角和工具，使得对这一主题的探索更加深入和全面。

## 核心观点

**第一，** 理念先行是根本。任何实质性的进展都需要建立在清晰的理念基础之上，只有明确目标与方向，才能在实践中少走弯路，事半功倍。

**第二，** 方法论的创新至关重要。传统的思维框架在面对新问题时往往捉襟见肘，我们需要勇于突破固有模式，探索更具���应性的解决方案。

**第三，** 实践检验真理。再好的理论也需要通过实践来验证和完善，在不断试错与迭代的过程中，才能找到真正有效的路径。

## 展望与建议

面向未来，我们应当以更加开放和包容的心态迎接变化，同时保持对核心价值的坚守。建议从以下几个方面着手：一是加强基础研究，夯实理论根基；二是注重跨领域合作，汇聚多方智慧；三是关注实际效果，及时调整策略；四是培养长期思维，避免短视行为。

## 结语

综上所述，这一课题既充满挑战，也蕴藏着巨大的机遇。只要我们以科学的态度、务实的精神去面对，相信必将取得令人满意的成果。让我们共同期待并推动这一领域迈向更加美好的未来。`)
      : `我是${agent.name}。针对您的需求「${userMessage}」，经过需求确认与工具调用，以下是执行结果：\n\n**分析摘要**\n已从多个维度对您的需求进行拆解，识别出核心目标与约束条件，制定了最优执行路径。\n\n**执行过程**\n1. 调用 \`${tool1}\` 完成数据检索与信息聚合\n2. 调用 \`${tool2}\` 对结果进行深度处理与验证\n3. 整合多源信息，生成结构化输出\n\n**结果输出**\n基于以上分析，建议您从以下角度切入：首先明确核心目标，其次制定分阶段执行计划，最后设置关键指标对结果进行持续监控与优化。如需进一步细化某个环节，欢迎继续提问。`;

    const updateWithCompletion = (msg: Message) =>
      msg.id === msgId
        ? {
            ...msg,
            status: 'completed' as const,
            thinking: undefined,
            content: articleContent,
            toolCalls: msg.toolCalls?.map(t => ({ ...t, status: 'completed' as const })),
          }
        : msg;

    setConversations(prev => prev.map(conv =>
      conv.id === conversationId ? { ...conv, messages: conv.messages.map(updateWithCompletion) } : conv
    ));
    setCurrentConversation(prev => prev ? { ...prev, messages: prev.messages.map(updateWithCompletion) } : null);

    // 清理 resolver
    delete clarificationResolvers.current[msgId];
    setClarificationAnswers(prev => { const n = { ...prev }; delete n[msgId]; return n; });
  };

  // 用户确认需求澄清 → 触发继续执行
  const handleClarificationConfirm = (msgId: string) => {
    const resolver = clarificationResolvers.current[msgId];
    if (resolver) {
      // 将用户在 UI 修改的选项同步回消息状态
      const items = clarificationAnswers[msgId];
      if (items) {
        const syncItems = (msg: Message) =>
          msg.id === msgId ? { ...msg, clarificationItems: items } : msg;
        setConversations(prev => prev.map(conv => ({
          ...conv, messages: conv.messages.map(syncItems),
        })));
        setCurrentConversation(prev => prev ? {
          ...prev, messages: prev.messages.map(syncItems),
        } : null);
      }
      resolver();
    }
  };

  // 创建新对话（从欢迎界面）
  const handleCreateConversation = () => {
    console.log('🎬 handleCreateConversation 被调用');
    console.log('mentionedAgents:', mentionedAgents);

    if (!inputValue.trim()) return;

    // 如果没有@智能体但有场景，根据场景自动选择合适的智能体；若无场景，使用第一个可用智能体作为默认
    const defaultSceneAgent: Agent = selectedScene ? {
      id: 'scene-assistant',
      name: selectedScene.name + '助手',
      icon: selectedScene.icon,
      color: '#6366F1',
      category: '内容创作',
      isMultiAgent: false,
    } : (allAgents.find(a => !a.isMultiAgent) || allAgents[0]);

    const agent = mentionedAgents.length > 0 ? mentionedAgents[0] : defaultSceneAgent;
    console.log('选中的智能体:', agent);
    console.log('isMultiAgent:', agent.isMultiAgent);

    // 检查是否为多智能体模式
    if (agent.isMultiAgent && agent.multiAgentMembers && agent.multiAgentMembers.length > 0) {
      console.log('✅ 多智能体模式 - 创建群组聊天');

      // 多智能体协作模式，创建群组
      const groupName = agent.name;
      const members = agent.multiAgentMembers;

      // 创建协调者
      const coordinator = createCoordinatorAgent(groupName, members);
      console.log('创建的协调者:', coordinator);

      // 创建用户消息
      const userMsg: Message = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: inputValue,
        timestamp: new Date().toISOString(),
      };

      // 创建群组
      const newGroup: AgentGroup = {
        id: `group-${Date.now()}`,
        name: groupName,
        members: members,
        coordinator,
        createTime: new Date().toISOString(),
        pinned: false,
      };

      setAgentGroups(prev => [...prev, newGroup]);
      setCurrentGroup(newGroup);
      setCurrentConversation(null); // 清空当前对话
      setMessages([userMsg]);
      setAgentReplyQueue([]);
      setCurrentReplyingAgent(null);

      // 启动多智能体协作流程
      processAgentReplyQueue(members, inputValue, coordinator);

      message.success(`已进入"${newGroup.name}"多智能体协作模式`);
    } else {
      console.log('❌ 普通智能体模式 - 创建单聊对话');

      // 普通单智能体，创建对话
      const conversationAgents = mentionedAgents.length > 0 ? mentionedAgents : [agent];

      const newConversation: Conversation = {
        id: `conv-${Date.now()}`,
        title: inputValue.slice(0, 30) + (inputValue.length > 30 ? '...' : ''),
        type: 'agent',
        agents: conversationAgents,
        group: undefined,
        messages: [],
        createTime: new Date().toISOString(),
        deepThinking,
        knowledgeBase: selectedKnowledgeBase,
        uploadedFiles
      };

      setConversations(prev => [newConversation, ...prev]);
      setCurrentConversation(newConversation);

      // 发送第一条消息
      const userMsg: Message = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: inputValue,
        timestamp: new Date().toISOString(),
      };

      newConversation.messages.push(userMsg);
      setConversations(prev => prev.map(conv =>
        conv.id === newConversation.id ? newConversation : conv
      ));

      // 让被@的智能体回复
      const agentsToReply = conversationAgents.slice(0, 10);
      agentsToReply.forEach((agent, index) => {
        setTimeout(() => {
          simulateAgentReplyInConversation(agent, inputValue, newConversation.id);
        }, index * 500);
      });
    }

    // 重置状态
    setInputValue('');
    setMentionedAgents([]);
    setDeepThinking(false);
    setSelectedKnowledgeBase([]);
    setUploadedFiles([]);
  };

  // 新建对话按钮处理
  const handleNewConversation = () => {
    // 将当前对话保存到历史记录（如有内容）
    if (currentConversation && currentConversation.messages.length > 0) {
      setConversations(prev => {
        const exists = prev.find(c => c.id === currentConversation.id);
        if (exists) return prev;
        return [currentConversation, ...prev];
      });
    } else if (currentGroup && messages.length > 0) {
      // 群组对话也保存
      const groupConv: Conversation = {
        id: `conv-group-${Date.now()}`,
        title: currentGroup.name,
        type: 'group',
        group: currentGroup,
        messages: [...messages],
        createTime: new Date().toISOString(),
      };
      setConversations(prev => [groupConv, ...prev]);
    }
    setCurrentConversation(null);
    setCurrentGroup(null);
    setMessages([]);
    setMentionedAgents([]);
    setInputValue('');
    setShowAgentCenter(false);
    setShowOpenClaw(false);
  };

  // 文件上传处理
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles: UploadedFile[] = Array.from(files).map(file => ({
        id: `file-${Date.now()}-${Math.random()}`,
        name: file.name,
        size: file.size,
        type: file.type,
      }));
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  // 文档编辑器操作
  const handleConvertToDoc = useCallback((msg: Message) => {
    const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const title = msg.content.split('\n')[0].replace(/^#+\s*/, '').slice(0, 40) || '未命名文档';
    const content = msg.content;
    const panel: DocPanel = {
      id: `doc-${Date.now()}`,
      title,
      content,
      createdAt: now,
      updatedAt: now,
      sourceMessageId: msg.id,
    };
    setDocPanel(panel);
    setDocTitle(title);
    setDocContent(content);
    setDocUpdatedAt(now);
    setDocHistory([{ title, content }]);
    setDocHistoryIndex(0);
    setConvertedMsgIds(prev => { const s = new Set(prev); s.add(msg.id); return s; });
  }, []);

  const handleDocChange = useCallback((newTitle: string, newContent: string) => {
    const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    setDocTitle(newTitle);
    setDocContent(newContent);
    setDocUpdatedAt(now);
    setDocHistory(prev => {
      const truncated = prev.slice(0, docHistoryIndex + 1);
      return [...truncated, { title: newTitle, content: newContent }];
    });
    setDocHistoryIndex(prev => prev + 1);
  }, [docHistoryIndex]);

  const handleDocUndo = useCallback(() => {
    if (docHistoryIndex > 0) {
      const idx = docHistoryIndex - 1;
      setDocHistoryIndex(idx);
      setDocTitle(docHistory[idx].title);
      setDocContent(docHistory[idx].content);
    }
  }, [docHistoryIndex, docHistory]);

  const handleDocRedo = useCallback(() => {
    if (docHistoryIndex < docHistory.length - 1) {
      const idx = docHistoryIndex + 1;
      setDocHistoryIndex(idx);
      setDocTitle(docHistory[idx].title);
      setDocContent(docHistory[idx].content);
    }
  }, [docHistoryIndex, docHistory]);

  const handleDocCopy = useCallback(() => {
    navigator.clipboard.writeText(`${docTitle}\n\n${docContent}`).then(() => {
      setDocCopied(true);
      setTimeout(() => setDocCopied(false), 2000);
    });
  }, [docTitle, docContent]);

  const handleDocDownload = useCallback(() => {
    const blob = new Blob([`${docTitle}\n\n${docContent}`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docTitle || '文档'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('已下载');
  }, [docTitle, docContent]);

  const handleDocShare = useCallback(() => {
    const link = `${window.location.origin}/share/doc-${docPanel?.id ?? 'xxxx'}`;
    navigator.clipboard.writeText(link).then(() => {
      message.success('文档链接已复制');
    });
  }, [docPanel?.id]);

  const handleCloseDoc = useCallback(() => {
    setDocPanel(null);
    setDocTitle('');
    setDocContent('');
    setDocHistory([]);
    setDocHistoryIndex(-1);
    setShowDocComments(false);
    setDocComments([]);
    setPendingComment(null);
    setCommentInput('');
    setDocPanelWidth(480);
  }, []);

  // 文档下载（按格式）
  const handleDocDownloadFormat = React.useCallback((format: 'word' | 'pdf' | 'markdown') => {
    setShowDownloadMenu(false);
    if (format === 'markdown') {
      const blob = new Blob([`# ${docTitle}\n\n${docContent}`], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${docTitle || '文档'}.md`; a.click();
      URL.revokeObjectURL(url);
      message.success('已下载 Markdown');
    } else if (format === 'word') {
      const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'><head><meta charset='utf-8'></head><body><h1>${docTitle}</h1><p>${docContent.replace(/\n/g, '</p><p>')}</p></body></html>`;
      const blob = new Blob([html], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${docTitle || '文档'}.doc`; a.click();
      URL.revokeObjectURL(url);
      message.success('已下载 Word');
    } else if (format === 'pdf') {
      message.info('PDF导出功能开发中');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docTitle, docContent]);

  // 查找下一个
  const handleFindNext = React.useCallback(() => {
    if (!findText) return;
    const found = (window as any).find(findText, false, false, true, false, false, false);
    setFindResult(found ? '' : '未找到匹配内容');
  }, [findText]);

  // 查找上一个
  const handleFindPrev = React.useCallback(() => {
    if (!findText) return;
    const found = (window as any).find(findText, false, true, true, false, false, false);
    setFindResult(found ? '' : '未找到匹配内容');
  }, [findText]);

  // 全部替换
  const handleReplaceAll = React.useCallback(() => {
    if (!findText || !docEditorRef.current) return;
    const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    const matches = (docEditorRef.current.innerText.match(regex) || []).length;
    if (matches === 0) { setFindResult('未找到匹配内容'); return; }
    const newHtml = docEditorRef.current.innerHTML.replace(regex, replaceText);
    docEditorRef.current.innerHTML = newHtml;
    const text = docEditorRef.current.innerText;
    setDocContent(text);
    const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    setDocUpdatedAt(now);
    setFindResult(`已替换 ${matches} 处`);
    message.success(`已替换 ${matches} 处匹配内容`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [findText, replaceText]);

  // 复制文档链接
  const handleCopyDocLink = React.useCallback(() => {
    const link = `${window.location.origin}${window.location.pathname}#doc-${docPanel?.id}`;
    navigator.clipboard.writeText(link).then(() => message.success('链接已复制到剪贴板'));
    setShowMoreMenu(false);
  }, [docPanel?.id]);

  // 创建副本
  const handleCreateDocCopy = React.useCallback(() => {
    const copyTitle = `${docTitle}（副本）`;
    const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    message.success(`已创建副本"${copyTitle}"`);
    setShowMoreMenu(false);
  }, [docTitle]);

  // 打印
  const handlePrintDoc = React.useCallback(() => {
    setShowMoreMenu(false);
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>${docTitle}</title><style>body{font-family:sans-serif;padding:40px;max-width:800px;margin:0 auto}h1{font-size:28px;margin-bottom:24px}p{font-size:15px;line-height:1.8;margin-bottom:12px}@media print{body{padding:0}}</style></head><body><h1>${docTitle}</h1>${docEditorRef.current?.innerHTML || ''}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  }, [docTitle]);

  // 删除文档
  const handleDeleteDoc = React.useCallback(() => {
    setShowMoreMenu(false);
    Modal.confirm({
      title: '确认删除文档',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: `确定要删除"${docTitle || '未命名文档'}"吗？此操作不可恢复。`,
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        handleCloseDoc();
        setDocFullScreen(false);
        message.success('文档已删除');
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docTitle]);

  // 选中文字时浮动工具栏
  // 时间问候语
  const getGreeting = (): string => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return '早上好';
    if (h >= 12 && h < 14) return '中午好';
    if (h >= 14 && h < 18) return '下午好';
    if (h >= 18 && h < 23) return '晚上好';
    return '夜深了';
  };
  const [greeting] = useState(getGreeting);

  const handleEditorMouseUp = React.useCallback(() => {
    setTimeout(() => {
      const sel = window.getSelection();
      if (sel && sel.toString().length > 0 && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectionToolbar({ visible: true, x: rect.left + rect.width / 2, y: rect.top - 52 });
      } else {
        setSelectionToolbar({ visible: false, x: 0, y: 0 });
      }
    }, 10);
  }, []);

  // 应用文字格式
  const applyFormat = React.useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    docEditorRef.current?.focus();
  }, []);

  // 选择群组 - 已废弃，群组选择功能已移除
  // const handleSelectGroup = (group: AgentGroup) => {
  //   if (!selectedGroups.find(g => g.id === group.id)) {
  //     setSelectedGroups([...selectedGroups, group]);
  //   }
  //   setShowMentionPanel(false);
  // };

  // 选择智能体（新建对话）- 改为单选模式
  const handleSelectAgent = (agent: Agent) => {
    // 单选模式，清空之前的选择，只保留当前选中的智能体
    setMentionedAgents([agent]);
    setShowMentionPanel(false);
  };

  const handleSkillSelect = (skillName: string) => {
    const beforeAt = inputValue.substring(0, inputValue.lastIndexOf('@'));
    const newValue = beforeAt + '@' + skillName + ' ';

    setInputValue(newValue);
    setShowSkillsPanel(false);

    // Focus back to editor
    setTimeout(() => {
      editorRef.current?.focus();
    }, 100);
  };

  const handleFileSelect = (fileName: string) => {
    const beforeAt = inputValue.substring(0, inputValue.lastIndexOf('@'));
    const newValue = beforeAt + '@' + fileName + ' ';

    setInputValue(newValue);
    setShowSkillsPanel(false);

    setTimeout(() => {
      editorRef.current?.focus();
    }, 100);
  };

  const chatHistory: ChatHistory[] = [
    { id: '1', title: '你好', subtitle: '互联网行业洞察', time: '2小时', isMultiAgent: true },
    { id: '2', title: '你好', subtitle: '互联网行业洞察', time: '2小时', isMultiAgent: true },
    { id: '3', title: '你好，你能帮我干什么', subtitle: '系统内置自定义智能体', time: '2小时', isMultiAgent: false },
    { id: '4', title: '文档中内容', subtitle: '系统内置自定义智能体', time: '昨天', isMultiAgent: false },
    { id: '5', title: '天气小知识', subtitle: 'gzlxcz我找', time: '昨天', isMultiAgent: false },
    { id: '6', title: '图片中内容', subtitle: '系统内置自定义智能体', time: '昨天', isMultiAgent: false },
    { id: '7', title: '图片中内容', subtitle: '系统内置自定义智能体', time: '昨天', isMultiAgent: false },
    { id: '8', title: '新会话', subtitle: '系统内置自定义智能体', time: '昨天', isMultiAgent: false },
    { id: '9', title: '你好', subtitle: '', time: '', isMultiAgent: false },
  ];

  // 初始化 contentEditable 内容
  React.useEffect(() => {
    if (docEditorRef.current && docPanel) {
      const html = docContent
        .split('\n')
        .map(line => line.trim() ? `<p style="margin:0 0 8px 0">${line.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/^## (.+)$/, '<h2 style="font-size:18px;font-weight:700;margin:16px 0 8px">$1</h2>').replace(/^# (.+)$/, '<h1 style="font-size:24px;font-weight:700;margin:20px 0 12px">$1</h1>')}</p>` : '<p style="margin:0 0 8px 0"><br></p>')
        .join('');
      docEditorRef.current.innerHTML = html;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docPanel?.id]);

  // undo/redo 时同步 contentEditable
  React.useEffect(() => {
    if (docEditorRef.current) {
      const current = docEditorRef.current.innerText;
      if (current !== docContent) {
        const html = docContent
          .split('\n')
          .map(line => line.trim() ? `<p style="margin:0 0 8px 0">${line.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/^## (.+)$/, '<h2 style="font-size:18px;font-weight:700;margin:16px 0 8px">$1</h2>').replace(/^# (.+)$/, '<h1 style="font-size:24px;font-weight:700;margin:20px 0 12px">$1</h1>')}</p>` : '<p style="margin:0 0 8px 0"><br></p>')
          .join('');
        docEditorRef.current.innerHTML = html;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docHistoryIndex]);

  const modelMenuItems: MenuProps['items'] = [
    {
      key: '1',
      label: 'GLM-4-Flash-250414',
    },
    {
      key: '2',
      label: 'GPT-4',
    },
  ];

  return (
    <>
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <Sider
        collapsible
        collapsed={collapsed || !!docPanel}
        onCollapse={setCollapsed}
        trigger={null}
        width={260}
        collapsedWidth={0}
        style={{
          background: '#fff',
          borderRight: '1px solid #f0f0f0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* 顶部 Logo + 折叠按钮 */}
        <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '16px'
            }}>
              Q
            </div>
            {!(collapsed || !!docPanel) && <span style={{ fontSize: '18px', fontWeight: 'bold' }}>万卷</span>}
          </div>
          {!docPanel && (
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ padding: '4px' }}
          />
          )}
        </div>

        {/* 主导航区 */}
        {!(collapsed || !!docPanel) && (
          <div style={{ padding: '0 12px', flexShrink: 0 }}>
            {/* 新建对话 */}
            <div
              onClick={handleNewConversation}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                marginBottom: '4px',
                borderRadius: '8px',
                cursor: 'pointer',
                background: (!showAgentCenter && !showOpenClaw && !currentGroup && !currentConversation) ? '#EEF2FF' : 'transparent',
                color: (!showAgentCenter && !showOpenClaw && !currentGroup && !currentConversation) ? '#6366F1' : '#333',
                fontWeight: (!showAgentCenter && !showOpenClaw && !currentGroup && !currentConversation) ? 600 : 400,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { if (showAgentCenter || showOpenClaw || currentGroup || currentConversation) e.currentTarget.style.background = '#f5f5f5'; }}
              onMouseLeave={(e) => { if (showAgentCenter || showOpenClaw || currentGroup || currentConversation) e.currentTarget.style.background = 'transparent'; }}
            >
              <PlusOutlined style={{ fontSize: '16px' }} />
              <span style={{ fontSize: '14px' }}>新建对话</span>
            </div>

            {/* 智能体广场 */}
            <div
              onClick={() => { setShowAgentCenter(true); setShowOpenClaw(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                marginBottom: '4px',
                borderRadius: '8px',
                cursor: 'pointer',
                background: showAgentCenter ? '#EEF2FF' : 'transparent',
                color: showAgentCenter ? '#6366F1' : '#333',
                fontWeight: showAgentCenter ? 600 : 400,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { if (!showAgentCenter) e.currentTarget.style.background = '#f5f5f5'; }}
              onMouseLeave={(e) => { if (!showAgentCenter) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: '16px' }}>🏪</span>
              <span style={{ fontSize: '14px' }}>智能体广场</span>
            </div>

            {/* OpenClaw */}
            <div
              onClick={() => { window.location.hash = 'openclaw'; }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', marginBottom: '4px', borderRadius: '8px', cursor: 'pointer',
                background: 'transparent',
                color: '#333',
                fontWeight: 400, transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f5f5'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: '16px' }}>🦞</span>
              <span style={{ fontSize: '14px' }}>OpenClaw</span>
            </div>

            {/* 数字员工 */}
            <div
              onClick={() => { window.location.hash = 'digital-employee'; }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', marginBottom: '4px', borderRadius: '8px', cursor: 'pointer',
                background: 'transparent',
                color: '#333',
                fontWeight: 400, transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f5f5'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: '16px' }}>🤖</span>
              <span style={{ fontSize: '14px' }}>数字员工</span>
            </div>

            <div style={{ borderTop: '1px solid #f0f0f0', marginBottom: '12px' }} />
          </div>
        )}

        {/* 历史记录列表（flex 撑满中间） */}
        {!(collapsed || !!docPanel) && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
              padding: '0 4px'
            }}>
              <span style={{ fontSize: '12px', color: '#999' }}>历史记录</span>
              <ReloadOutlined style={{ fontSize: '12px', color: '#bbb', cursor: 'pointer' }} />
            </div>
            {chatHistory.map(chat => (
              <div
                key={chat.id}
                style={{
                  padding: '10px 8px',
                  borderRadius: '8px',
                  marginBottom: '2px',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  fontSize: '13px',
                  color: '#333',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {chat.title}
                </div>
                {chat.subtitle && (
                  <div style={{ fontSize: '11px', color: '#bbb', marginTop: '2px' }}>
                    {chat.time && `${chat.time} · `}{chat.subtitle}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 底部个人中心 */}
        <Popover
          open={showPersonalModal}
          onOpenChange={setShowPersonalModal}
          trigger="click"
          placement="topLeft"
          overlayInnerStyle={{ padding: 0, borderRadius: '12px', overflow: 'hidden', minWidth: '220px' }}
          content={
            <div>
              <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '18px', fontWeight: 'bold', position: 'relative', flexShrink: 0 }}>
                  A
                  <span style={{ position: 'absolute', bottom: '1px', right: '1px', width: '8px', height: '8px', background: '#52c41a', borderRadius: '50%', border: '1.5px solid #fff' }} />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a1a' }}>Alina</div>
                  <div style={{ fontSize: '12px', color: '#999' }}>alina@example.com</div>
                </div>
              </div>
              <div style={{ padding: '8px' }}>
                <div
                  onClick={() => { setShowPersonalModal(false); window.location.hash = 'profile'; }}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: '14px', color: '#333' }}>个人中心</span>
                </div>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: '14px', color: '#333' }}>锁定屏幕</span>
                  <span style={{ fontSize: '12px', color: '#bbb' }}>⌥L</span>
                </div>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', color: '#ff4d4f', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#fff1f0'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ fontSize: '14px' }}>退出登录</span>
                  <span style={{ fontSize: '12px', color: '#ffb3b3' }}>⌥Q</span>
                </div>
              </div>
            </div>
          }
        >
        <div style={{ borderTop: '1px solid #f0f0f0', flexShrink: 0 }}>
          <div
            style={{
              padding: '12px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 'bold',
              flexShrink: 0,
              position: 'relative'
            }}>
              A
              <span style={{
                position: 'absolute',
                bottom: '1px',
                right: '1px',
                width: '8px',
                height: '8px',
                background: '#52c41a',
                borderRadius: '50%',
                border: '1.5px solid #fff'
              }} />
            </div>
            {!(collapsed || !!docPanel) && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#333', lineHeight: '1.3' }}>Alina</div>
                <div style={{ fontSize: '11px', color: '#999' }}>个人设置 · 进入后台</div>
              </div>
            )}
          </div>
        </div>
        </Popover>
      </Sider>

      <Layout style={{ background: '#fafafa' }}>
        {collapsed && (
          <Button
            type="text"
            icon={<MenuUnfoldOutlined />}
            onClick={() => setCollapsed(false)}
            style={{
              position: 'fixed',
              left: '16px',
              top: '16px',
              zIndex: 1000
            }}
          />
        )}

        <Content style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: (currentGroup || currentConversation || showOpenClaw || showAgentCenter) ? 'flex-start' : 'center',
          padding: '24px',
          minHeight: '100vh'
        }}>
          {/* OpenClaw 面板 */}
          {showOpenClaw ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* OpenClaw 顶部标签栏 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🦞</div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.2 }}>OpenClaw</div>
                    <div style={{ fontSize: 11, color: '#aaa' }}>即时通讯与 AI 网关</div>
                  </div>
                  <div style={{ display: 'flex', gap: 2, marginLeft: 16 }}>
                    {(['chat', 'dashboard'] as const).map(tab => (
                      <div
                        key={tab}
                        onClick={() => setOpenClawTab(tab)}
                        style={{
                          padding: '5px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13,
                          background: openClawTab === tab ? '#ef4444' : '#f5f5f5',
                          color: openClawTab === tab ? '#fff' : '#666',
                          fontWeight: openClawTab === tab ? 600 : 400,
                          transition: 'all 0.15s',
                        }}
                      >
                        {tab === 'chat' ? '聊天' : '控制台'}
                      </div>
                    ))}
                  </div>
                </div>
                <Button
                  type="text"
                  icon={<span style={{ fontSize: '18px' }}>✕</span>}
                  onClick={() => setShowOpenClaw(false)}
                  style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '16px', color: '#666' }}
                />
              </div>
              {/* 内容区 */}
              <div style={{ flex: 1, overflow: 'hidden', borderRadius: 12, border: '1px solid #f0f0f0' }}>
                {openClawTab === 'chat' ? <OpenClaw /> : <OpenClawDashboard />}
              </div>
            </div>
          ) : null}

          {/* 智能体广场界面 */}
          {showAgentCenter ? (
            <div style={{ width: '100%', maxWidth: '1400px' }}>
              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>智能体广场</h2>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <Button
                    icon={<UserOutlined />}
                    onClick={() => setShowManageDisplay(true)}
                    style={{ borderRadius: '6px' }}
                  >
                    管理显示
                  </Button>
                  <Button
                    type="text"
                    icon={<span style={{ fontSize: '18px' }}>✕</span>}
                    onClick={() => setShowAgentCenter(false)}
                    style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '16px', color: '#666' }}
                  />
                </div>
              </div>

              {/* 搜索和类型筛选 */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <Input
                  placeholder="搜索智能体"
                  prefix={<SearchOutlined style={{ color: '#bbb' }} />}
                  style={{ width: '220px', borderRadius: '8px' }}
                  value={agentCenterSearch}
                  onChange={(e) => setAgentCenterSearch(e.target.value)}
                  allowClear
                />
                <Select
                  value={agentCenterTypeFilter}
                  onChange={setAgentCenterTypeFilter}
                  style={{ width: 140, borderRadius: '8px' }}
                  placeholder="智能体类型"
                >
                  <Select.Option value="全部">全部类型</Select.Option>
                  <Select.Option value="单智能体">单智能体</Select.Option>
                  <Select.Option value="多智能体">多智能体</Select.Option>
                  <Select.Option value="RAG">RAG</Select.Option>
                  <Select.Option value="自主规划">自主规划</Select.Option>
                </Select>
              </div>

              {/* 分类 Tab */}
              <div style={{
                display: 'flex',
                gap: '4px',
                marginBottom: '24px'
              }}>
                {['全部', '开发', '创��', '办公', '生活'].map(cat => (
                  <div
                    key={cat}
                    onClick={() => setAgentCenterCategory(cat)}
                    style={{
                      padding: '6px 18px',
                      borderRadius: '20px',
                      background: agentCenterCategory === cat ? '#1a1a1a' : 'transparent',
                      color: agentCenterCategory === cat ? '#fff' : '#555',
                      fontSize: '14px',
                      fontWeight: agentCenterCategory === cat ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      userSelect: 'none' as const
                    }}
                    onMouseEnter={(e) => { if (agentCenterCategory !== cat) e.currentTarget.style.background = '#f0f0f0'; }}
                    onMouseLeave={(e) => { if (agentCenterCategory !== cat) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {cat}
                  </div>
                ))}
              </div>

              {/* 智能体卡片 Grid - 4列 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px'
              }}>
                {allAgents
                  .filter(agent => {
                    const matchSearch = agentCenterSearch === '' ||
                      agent.name.toLowerCase().includes(agentCenterSearch.toLowerCase()) ||
                      agent.category.toLowerCase().includes(agentCenterSearch.toLowerCase());
                    const matchType =
                      agentCenterTypeFilter === '全部' ||
                      (agentCenterTypeFilter === '单智能体' && !agent.isMultiAgent) ||
                      (agentCenterTypeFilter === '多智能体' && agent.isMultiAgent) ||
                      (agentCenterTypeFilter === 'RAG' && !agent.isMultiAgent) ||
                      (agentCenterTypeFilter === '自主规划' && agent.isMultiAgent);
                    const matchCat = agentCenterCategory === '全部' ||
                      (agentCenterCategory === '开发' && ['编程开发', '数据分析'].includes(agent.category)) ||
                      (agentCenterCategory === '创作' && ['内容创作'].includes(agent.category)) ||
                      (agentCenterCategory === '办公' && ['行业分析'].includes(agent.category)) ||
                      (agentCenterCategory === '生活' && !['行业分析','编程开发','数据分析','内容创作'].includes(agent.category));
                    return matchSearch && matchType && matchCat;
                  })
                  .map(agent => {
                    const isPinned = squarePinnedAgentIds.includes(agent.id);
                    const agentTypeLabel = agent.isMultiAgent ? '自主规划' : 'RAG';
                    return (
                      <div
                        key={agent.id}
                        style={{
                          background: '#fff',
                          borderRadius: '12px',
                          border: `1px solid ${isPinned ? '#6366F1' : '#eee'}`,
                          padding: '16px',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all 0.2s',
                          boxShadow: isPinned ? '0 0 0 1.5px #6366F1' : 'none'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = isPinned
                            ? '0 0 0 1.5px #6366F1, 0 4px 12px rgba(99,102,241,0.15)'
                            : '0 4px 12px rgba(0,0,0,0.08)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = isPinned ? '0 0 0 1.5px #6366F1' : 'none';
                        }}
                        onClick={() => {
                          setShowAgentCenter(false);
                          setMentionedAgents([agent]);
                        }}
                      >
                        {/* 置顶标记 */}
                        {isPinned && (
                          <div style={{
                            position: 'absolute',
                            top: '0',
                            right: '0',
                            padding: '2px 8px',
                            background: '#EEF2FF',
                            color: '#6366F1',
                            fontSize: '11px',
                            fontWeight: 600,
                            borderRadius: '0 12px 0 6px'
                          }}>置顶</div>
                        )}

                        {/* 图标 + 名称 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            background: `${agent.color}22`,
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '22px',
                            flexShrink: 0
                          }}>
                            {agent.icon}
                          </div>
                          <span style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a1a', lineHeight: '1.3' }}>
                            {agent.name}
                          </span>
                        </div>

                        {/* 描述 */}
                        <p style={{
                          fontSize: '13px',
                          color: '#666',
                          margin: '0 0 12px 0',
                          lineHeight: '1.5',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical' as const,
                          overflow: 'hidden'
                        }}>
                          {agent.category} — {agent.isMultiAgent
                            ? '支持多智能体协同，处理复杂任务，提供深度分析与决策支持。'
                            : '基于知识库问答，快速检索专业知识，提供精准解答。'}
                        </p>

                        {/* 底部类型标签 + 置顶操作 */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{
                            fontSize: '12px',
                            color: '#888',
                            padding: '2px 0'
                          }}>
                            {agentTypeLabel}
                          </span>
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setSquarePinnedAgentIds(prev =>
                                prev.includes(agent.id)
                                  ? prev.filter(id => id !== agent.id)
                                  : [...prev, agent.id]
                              );
                            }}
                            style={{
                              fontSize: '11px',
                              color: isPinned ? '#6366F1' : '#bbb',
                              cursor: 'pointer',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            {isPinned ? '取消置顶' : '置顶'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* 无结果提示 */}
              {allAgents.filter(agent => {
                const matchSearch = agentCenterSearch === '' ||
                  agent.name.toLowerCase().includes(agentCenterSearch.toLowerCase()) ||
                  agent.category.toLowerCase().includes(agentCenterSearch.toLowerCase());
                const matchType =
                  agentCenterTypeFilter === '全部' ||
                  (agentCenterTypeFilter === '单智能体' && !agent.isMultiAgent) ||
                  (agentCenterTypeFilter === '多智能体' && agent.isMultiAgent);
                return matchSearch && matchType;
              }).length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
                  <div>未找到相关智能体，请修改搜索条件</div>
                </div>
              )}
            </div>

          ) : (!showOpenClaw && (currentGroup || currentConversation)) ? (
            <div style={{ width: '100%', maxWidth: docPanel ? '100%' : '1000px', height: '100%', display: 'flex', flexDirection: 'row', gap: 0, transition: 'all 0.3s' }}>
              {/* 左侧对话区 */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', transition: 'all 0.3s' }}>
              {/* 对话头部 */}
              <div style={{
                padding: '16px',
                background: '#fff',
                borderRadius: '12px',
                marginBottom: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                {showConvShareModal ? (
                  /* ── 分享模式头部 ── */
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a' }}>选择对话</div>
                    <button
                      onClick={() => { setShowConvShareModal(false); setShareSelectedMsgIds(new Set()); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: '#666', padding: '4px 8px', borderRadius: 6 }}
                    >取消</button>
                  </div>
                ) : (
                  /* ── 正常模式头部 ── */
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {currentGroup || currentConversation?.type === 'group' ? (
                          <>
                            <TeamOutlined style={{ fontSize: '24px', color: '#6366F1' }} />
                            <div>
                              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                {currentGroup?.name || currentConversation?.group?.name}
                                {currentGroup?.pinned && (
                                  <PushpinOutlined style={{ marginLeft: '8px', fontSize: '14px', color: '#6366F1' }} />
                                )}
                              </div>
                              <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                                {(currentGroup?.members.length || currentConversation?.group?.members.length || 0)} 个成员
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{
                              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                              background: `${currentConversation?.agents?.[0]?.color ?? '#6366F1'}22`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 20,
                            }}>
                              {currentConversation?.agents?.[0]?.icon ?? '🤖'}
                            </div>
                            <div>
                              <div style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a1a' }}>
                                {currentConversation?.agents?.[0]?.name || currentConversation?.title || '对话'}
                              </div>
                              <div style={{ fontSize: '12px', color: '#10B981', marginTop: '2px', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                                在线
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {currentGroup && (
                          <Dropdown
                            menu={{
                              items: [
                                {
                                  key: 'rename',
                                  icon: <EditOutlined />,
                                  label: '重命名群组',
                                  onClick: () => {
                                    Modal.confirm({
                                      title: '重命名群组',
                                      content: (
                                        <Input
                                          placeholder="输入新的群组名称"
                                          defaultValue={currentGroup.name}
                                          id="rename-group-input"
                                        />
                                      ),
                                      okText: '确认',
                                      cancelText: '取消',
                                      onOk: () => {
                                        const input = document.getElementById('rename-group-input') as HTMLInputElement;
                                        if (input?.value.trim()) {
                                          handleRenameGroup(currentGroup.id, input.value);
                                        }
                                      }
                                    });
                                  }
                                },
                                {
                                  key: 'pin',
                                  icon: <PushpinOutlined />,
                                  label: currentGroup.pinned ? '取消置顶' : '置顶群组',
                                  onClick: () => handleTogglePinGroup(currentGroup.id)
                                },
                                { type: 'divider' },
                                {
                                  key: 'delete',
                                  icon: <DeleteOutlined />,
                                  label: '删除群组',
                                  danger: true,
                                  onClick: () => handleDeleteGroup(currentGroup.id)
                                }
                              ]
                            }}
                            trigger={['click']}
                          >
                            <Button icon={<EllipsisOutlined />}>管理</Button>
                          </Dropdown>
                        )}
                        <Tooltip title="分享对话">
                          <Button
                            type="text"
                            icon={<ShareAltOutlined />}
                            onClick={() => {
                              setShareSelectedMsgIds(new Set());
                              setShowConvShareModal(true);
                            }}
                            style={{ color: '#555' }}
                          />
                        </Tooltip>
                      </div>
                    </div>
                    {/* 仅群组对话显示成员标签 */}
                    {(currentGroup || currentConversation?.type === 'group') && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                        {(currentGroup?.members || currentConversation?.agents || currentConversation?.group?.members || []).map(member => (
                          <Tag key={member.id} style={{ padding: '4px 12px', borderRadius: '12px' }}>
                            <span style={{ marginRight: '4px' }}>{member.icon}</span>
                            {member.name}
                          </Tag>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* 消息列表 */}
              <div style={{
                flex: 1,
                background: '#fff',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '16px',
                overflowY: 'auto',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                {(currentConversation?.messages || messages).length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#999', paddingTop: '60px' }}>
                    <TeamOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                    <div>开始对话吧</div>
                    <div style={{ fontSize: '12px', marginTop: '8px' }}>输入 @ 来提及智能体</div>
                  </div>
                ) : (
                  <>
                    {/* 显示回复队列指示器 */}
                    {agentReplyQueue.length > 0 && (
                      <div style={{
                        padding: '12px',
                        background: '#F0F0FF',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        border: '1px solid #6366F1'
                      }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                          群组回复队列 ({agentReplyQueue.indexOf(currentReplyingAgent!) + 1}/{agentReplyQueue.length})
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          {agentReplyQueue.map((agent, idx) => (
                            <Tag
                              key={agent.id}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '12px',
                                background: currentReplyingAgent?.id === agent.id ? `${agent.color}` : `${agent.color}22`,
                                border: `1px solid ${agent.color}`,
                                color: currentReplyingAgent?.id === agent.id ? '#fff' : agent.color,
                                fontSize: '12px'
                              }}
                            >
                              <span style={{ marginRight: '4px' }}>{agent.icon}</span>
                              {agent.name}
                              {currentReplyingAgent?.id === agent.id && (
                                <LoadingOutlined style={{ marginLeft: '6px' }} />
                              )}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    )}

                    {(currentConversation?.messages || messages).map(msg => {
                      const isShareSelected = shareSelectedMsgIds.has(msg.id);
                      const toggleShare = () => {
                        setShareSelectedMsgIds(prev => {
                          const next = new Set(prev);
                          next.has(msg.id) ? next.delete(msg.id) : next.add(msg.id);
                          return next;
                        });
                      };
                    return (
                    <div
                      key={msg.id}
                      style={{ marginBottom: '24px', position: 'relative' }}
                      onClick={showConvShareModal ? toggleShare : undefined}
                    >
                      {msg.role === 'user' ? (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', gap: 8 }}>
                          {/* 分享模式：左侧勾选框 */}
                          {showConvShareModal && (
                            <div style={{
                              width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 4,
                              border: `2px solid ${isShareSelected ? '#1677ff' : '#d9d9d9'}`,
                              background: isShareSelected ? '#1677ff' : '#fff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', transition: 'all 0.12s',
                            }}>
                              {isShareSelected && <CheckOutlined style={{ color: '#fff', fontSize: 11 }} />}
                            </div>
                          )}
                          {/* 正常模式：... 菜单 */}
                          {!showConvShareModal && (
                          <Dropdown
                            trigger={['click']}
                            menu={{
                              items: [
                                {
                                  key: 'report',
                                  icon: <ExclamationCircleOutlined style={{ color: '#f59e0b' }} />,
                                  label: '反馈与举报',
                                  onClick: () => { setShowFeedbackModal(true); },
                                },
                                { type: 'divider' },
                                {
                                  key: 'delete',
                                  icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
                                  label: <span style={{ color: '#ff4d4f' }}>删除</span>,
                                  onClick: () => {
                                    const updater = (prev: Conversation | null) => prev ? {
                                      ...prev,
                                      messages: prev.messages.filter(m => m.id !== msg.id),
                                    } : null;
                                    setCurrentConversation(updater);
                                    setConversations(prev => prev.map(c => c.id === currentConversation?.id ? {
                                      ...c, messages: c.messages.filter(m => m.id !== msg.id)
                                    } : c));
                                  },
                                },
                              ],
                            }}
                          >
                            <Button type="text" size="small" icon={<EllipsisOutlined />}
                              style={{ color: '#bbb', padding: '0 4px', marginBottom: 2 }} />
                          </Dropdown>
                          )}
                          <div style={{
                            maxWidth: '70%',
                            padding: '12px 16px',
                            background: showConvShareModal
                              ? (isShareSelected ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' : '#e8e8e8')
                              : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                            color: showConvShareModal && !isShareSelected ? '#555' : '#fff',
                            borderRadius: '12px',
                            fontSize: '14px',
                            cursor: showConvShareModal ? 'pointer' : 'default',
                            transition: 'all 0.15s',
                          }}>
                            {msg.content}
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                          <Avatar style={{ background: msg.agentId ? allAgents.find(a => a.id === msg.agentId)?.color : '#999' }}>
                            {msg.agentIcon}
                          </Avatar>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '12px', color: '#999', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span>{msg.agentName}</span>
                              <Dropdown
                                trigger={['click']}
                                placement="bottomRight"
                                menu={{
                                  items: [
                                    {
                                      key: 'report',
                                      icon: <ExclamationCircleOutlined style={{ color: '#f59e0b' }} />,
                                      label: '反馈与举报',
                                      onClick: () => setShowFeedbackModal(true),
                                    },
                                    { type: 'divider' },
                                    {
                                      key: 'delete',
                                      icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
                                      label: <span style={{ color: '#ff4d4f' }}>删除</span>,
                                      onClick: () => {
                                        const updater = (prev: Conversation | null) => prev ? {
                                          ...prev,
                                          messages: prev.messages.filter(m => m.id !== msg.id),
                                        } : null;
                                        setCurrentConversation(updater);
                                        setConversations(prev => prev.map(c => c.id === currentConversation?.id ? {
                                          ...c, messages: c.messages.filter(m => m.id !== msg.id)
                                        } : c));
                                      },
                                    },
                                  ],
                                }}
                              >
                                <Button type="text" size="small" icon={<EllipsisOutlined />}
                                  style={{ color: '#ccc', padding: '0 4px' }} />
                              </Dropdown>
                            </div>

                            {/* Thinking 状态 */}
                            {msg.status === 'thinking' && (
                              <div style={{
                                padding: '12px',
                                background: '#F3F4F6',
                                borderRadius: '8px',
                                fontSize: '14px',
                                color: '#666',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}>
                                <Spin indicator={<LoadingOutlined style={{ fontSize: 16 }} spin />} />
                                <span style={{ fontStyle: 'italic' }}>{msg.thinking}</span>
                              </div>
                            )}

                            {/* 协作计划状态 */}
                            {(msg.status === 'planning' || msg.status === 'dispatching') && (
                              <div style={{
                                padding: '12px',
                                background: '#EEF2FF',
                                borderRadius: '8px',
                                fontSize: '14px',
                                color: '#666',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}>
                                <Spin indicator={<LoadingOutlined style={{ fontSize: 16 }} spin />} />
                                <span style={{ fontStyle: 'italic' }}>{msg.thinking}</span>
                              </div>
                            )}

                            {/* 显示协作计划 */}
                            {msg.collaborationPlan && (
                              <div style={{
                                marginTop: '12px',
                                padding: '16px',
                                background: '#F9FAFB',
                                borderRadius: '12px',
                                border: '1px solid #E5E7EB'
                              }}>
                                <div style={{
                                  fontSize: '14px',
                                  fontWeight: 500,
                                  marginBottom: '12px',
                                  color: '#374151',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}>
                                  📋 协作计划
                                </div>
                                <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '12px' }}>
                                  {msg.collaborationPlan.description}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {msg.collaborationPlan.subTasks.map((task, idx) => (
                                    <div key={task.id} style={{
                                      padding: '10px 12px',
                                      background: '#fff',
                                      borderRadius: '8px',
                                      border: '1px solid #E5E7EB',
                                      fontSize: '13px'
                                    }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                        <span style={{ fontWeight: 500 }}>
                                          子任务 {idx + 1}
                                        </span>
                                        <span>
                                          {task.agentIcon} @{task.agentName}
                                        </span>
                                        {task.status === 'pending' && (
                                          <Tag color="default" style={{ marginLeft: 'auto' }}>待派发</Tag>
                                        )}
                                        {task.status === 'dispatched' && (
                                          <Tag color="blue" style={{ marginLeft: 'auto' }}>🚀 已派发</Tag>
                                        )}
                                        {task.status === 'executing' && (
                                          <Tag color="orange" style={{ marginLeft: 'auto' }}>
                                            <Spin size="small" style={{ marginRight: 4 }} />
                                            执行中
                                          </Tag>
                                        )}
                                        {task.status === 'completed' && (
                                          <Tag color="success" style={{ marginLeft: 'auto' }}>✅ 已完成</Tag>
                                        )}
                                      </div>
                                      {task.toolCalls && task.toolCalls.length > 0 && (
                                        <div style={{ marginTop: '6px', fontSize: '12px', color: '#6B7280' }}>
                                          🛠️ 调用工具: {task.toolCalls.map(t => t.name).join(', ')}
                                        </div>
                                      )}
                                      {task.result && (
                                        <div style={{
                                          marginTop: '8px',
                                          paddingTop: '8px',
                                          borderTop: '1px solid #E5E7EB',
                                          color: '#374151'
                                        }}>
                                          {task.result}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* 执行中状态 */}
                            {msg.status === 'executing' && (
                              <div style={{
                                padding: '12px',
                                background: '#FEF3C7',
                                borderRadius: '8px',
                                fontSize: '14px',
                                color: '#92400E',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginTop: '8px'
                              }}>
                                <Spin indicator={<LoadingOutlined style={{ fontSize: 16, color: '#F59E0B' }} spin />} />
                                <span style={{ fontStyle: 'italic' }}>{msg.thinking}</span>
                              </div>
                            )}

                            {/* 整合中状态 */}
                            {msg.status === 'integrating' && (
                              <div style={{
                                padding: '12px',
                                background: '#DBEAFE',
                                borderRadius: '8px',
                                fontSize: '14px',
                                color: '#1E40AF',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginTop: '8px'
                              }}>
                                <Spin indicator={<LoadingOutlined style={{ fontSize: 16, color: '#3B82F6' }} spin />} />
                                <span style={{ fontStyle: 'italic' }}>{msg.thinking}</span>
                              </div>
                            )}

                            {/* 等待澄清状态 */}
                            {msg.status === 'waiting_clarification' && (
                              <div style={{
                                padding: '12px',
                                background: '#FEF3C7',
                                borderRadius: '8px',
                                fontSize: '14px',
                                marginTop: '8px',
                                border: '1px solid #FCD34D'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                  <QuestionCircleOutlined style={{ color: '#F59E0B', fontSize: '16px' }} />
                                  <span style={{ fontWeight: 500, color: '#92400E' }}>
                                    {msg.clarificationQuestion}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {msg.clarificationOptions?.map((option, idx) => (
                                    <div
                                      key={idx}
                                      style={{
                                        padding: '8px 12px',
                                        background: '#fff',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        border: '1px solid #E5E7EB'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = '#F59E0B';
                                        e.currentTarget.style.background = '#FFFBEB';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = '#E5E7EB';
                                        e.currentTarget.style.background = '#fff';
                                      }}
                                    >
                                      {option}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Tool Calls 状态 */}
                            {msg.status === 'calling' && msg.toolCalls && (
                              <div style={{ marginTop: '8px' }}>
                                {msg.toolCalls.map(tool => (
                                  <div key={tool.id} style={{
                                    padding: '10px 12px',
                                    background: '#FEF3C7',
                                    borderRadius: '8px',
                                    marginBottom: '6px',
                                    fontSize: '13px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                  }}>
                                    <ToolOutlined style={{ color: '#F59E0B' }} />
                                    <span>调用工具: {tool.name}</span>
                                    {tool.status === 'running' && (
                                      <Spin size="small" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* 最终回复 */}
                            {msg.status === 'completed' && msg.content && (
                              <div style={{
                                padding: '12px 16px',
                                background: msg.isCollaborationResult ? '#F0F9FF' : '#F9FAFB',
                                borderRadius: '12px',
                                fontSize: '14px',
                                marginTop: '8px',
                                border: msg.isCollaborationResult ? '1px solid #BAE6FD' : '1px solid #E5E7EB'
                              }}>
                                {/* 若该消息已转为文档，显示文档卡片 */}
                                {convertedMsgIds.has(msg.id) ? (
                                  <div
                                    onClick={() => {
                                      if (!docPanel || docPanel.sourceMessageId !== msg.id) {
                                        handleConvertToDoc(msg);
                                      }
                                    }}
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: 12,
                                      padding: '12px 14px', borderRadius: 10,
                                      border: '1.5px solid #6366F1', background: '#fafbff',
                                      cursor: 'pointer', marginBottom: 8, transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(99,102,241,0.15)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
                                  >
                                    <div style={{
                                      width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                                      background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                      <FileTextOutlined style={{ color: '#fff', fontSize: 16 }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {msg.content.split('\n')[0].replace(/^#+\s*/, '').slice(0, 40) || '未命名文档'}
                                      </div>
                                      <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                                        文档 · 点击查看编辑
                                      </div>
                                    </div>
                                    <FileTextOutlined style={{ color: '#6366F1', fontSize: 20, flexShrink: 0 }} />
                                  </div>
                                ) : (
                                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                                )}

                                {/* 协作结果展开按钮 */}
                                {msg.isCollaborationResult && msg.subTaskResults && (
                                  <div style={{ marginTop: '12px' }}>
                                    <Button
                                      type="link"
                                      size="small"
                                      onClick={() => {
                                        const newExpanded = new Set(expandedCollaborations);
                                        if (newExpanded.has(msg.id)) {
                                          newExpanded.delete(msg.id);
                                        } else {
                                          newExpanded.add(msg.id);
                                        }
                                        setExpandedCollaborations(newExpanded);
                                      }}
                                      style={{ padding: 0, fontSize: '13px' }}
                                    >
                                      {expandedCollaborations.has(msg.id) ? '▼ 收起子任务详情' : '▶ 展开子任务详情'}
                                    </Button>

                                    {/* 展开的子任务详情 */}
                                    {expandedCollaborations.has(msg.id) && (
                                      <div style={{
                                        marginTop: '12px',
                                        paddingTop: '12px',
                                        borderTop: '1px solid #BAE6FD'
                                      }}>
                                        {msg.subTaskResults.map((task, idx) => (
                                          <div key={task.id} style={{
                                            marginBottom: '12px',
                                            padding: '12px',
                                            background: '#fff',
                                            borderRadius: '8px',
                                            border: '1px solid #E5E7EB'
                                          }}>
                                            <div style={{
                                              fontWeight: 500,
                                              marginBottom: '8px',
                                              color: '#374151',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '8px'
                                            }}>
                                              <span>{task.agentIcon}</span>
                                              <span>{task.agentName}</span>
                                              <Tag color="success" style={{ marginLeft: 'auto' }}>已完成</Tag>
                                            </div>
                                            <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>
                                              {task.taskName}
                                            </div>
                                            {task.toolCalls && task.toolCalls.length > 0 && (
                                              <div style={{
                                                fontSize: '12px',
                                                color: '#9CA3AF',
                                                marginBottom: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                              }}>
                                                <ToolOutlined />
                                                <span>工具调用: {task.toolCalls.map(t => t.name).join(', ')}</span>
                                              </div>
                                            )}
                                            <div style={{
                                              paddingTop: '8px',
                                              borderTop: '1px solid #F3F4F6',
                                              color: '#374151',
                                              fontSize: '13px'
                                            }}>
                                              {task.result}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {msg.toolCalls && msg.toolCalls.length > 0 && !msg.isCollaborationResult && (
                                  <div style={{
                                    marginTop: '12px',
                                    paddingTop: '12px',
                                    borderTop: '1px solid #E5E7EB',
                                    fontSize: '12px',
                                    color: '#666'
                                  }}>
                                    <div style={{ marginBottom: '6px', fontWeight: 500 }}>使用的工具:</div>
                                    {msg.toolCalls.map(tool => (
                                      <div key={tool.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                        <CheckCircleOutlined style={{ color: '#10B981' }} />
                                        <span>{tool.name}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* 生成文档 按钮（仅已完成且未转换时显示） */}
                                {!convertedMsgIds.has(msg.id) && (
                                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Button
                                      size="small"
                                      icon={<FileTextOutlined />}
                                      onClick={() => handleConvertToDoc(msg)}
                                      style={{ borderRadius: 6, fontSize: 12, color: '#6366F1', borderColor: '#c7d2fe', background: '#f5f3ff', fontWeight: 500 }}
                                    >
                                      生成文档
                                    </Button>
                                    <span style={{ fontSize: 12, color: '#bbb' }}>将内容生成为可编辑文档</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* ── 消息操作栏：重新生成 / 点赞 / 点踩 / 复制 / 分享 ── */}
                            {msg.status === 'completed' && !showConvShareModal && (
                              <div style={{
                                display: 'flex', alignItems: 'center', gap: 2,
                                marginTop: 10, paddingTop: 10, borderTop: '1px solid #f0f0f0',
                              }}>
                                <Tooltip title="重新生成">
                                  <Button type="text" size="small"
                                    icon={<SyncOutlined style={{ fontSize: 14, color: '#bbb' }} />}
                                    style={{ padding: '0 6px' }}
                                    onClick={() => {
                                      const msgs = currentConversation?.messages || messages;
                                      const prevUser = msgs.slice(0, msgs.findIndex(m => m.id === msg.id)).reverse().find(m => m.role === 'user');
                                      if (prevUser) { setInputValue(prevUser.content); setTimeout(() => handleSendMessage(), 0); }
                                    }}
                                  />
                                </Tooltip>
                                <div style={{ width: 1, height: 14, background: '#e8e8e8', margin: '0 2px' }} />
                                <Tooltip title="点赞">
                                  <Button type="text" size="small"
                                    icon={<LikeOutlined style={{ fontSize: 14, color: likedMsgIds.has(msg.id) ? '#6366F1' : '#bbb' }} />}
                                    style={{ padding: '0 6px' }}
                                    onClick={() => setLikedMsgIds(prev => {
                                      const s = new Set(prev);
                                      if (s.has(msg.id)) { s.delete(msg.id); } else { s.add(msg.id); setDislikedMsgIds(d => { const ds = new Set(d); ds.delete(msg.id); return ds; }); }
                                      return s;
                                    })}
                                  />
                                </Tooltip>
                                <Tooltip title="点踩">
                                  <Button type="text" size="small"
                                    icon={<DislikeOutlined style={{ fontSize: 14, color: dislikedMsgIds.has(msg.id) ? '#ef4444' : '#bbb' }} />}
                                    style={{ padding: '0 6px' }}
                                    onClick={() => setDislikedMsgIds(prev => {
                                      const s = new Set(prev);
                                      if (s.has(msg.id)) { s.delete(msg.id); } else { s.add(msg.id); setLikedMsgIds(d => { const ds = new Set(d); ds.delete(msg.id); return ds; }); }
                                      return s;
                                    })}
                                  />
                                </Tooltip>
                                <Tooltip title={copiedMsgIds.has(msg.id) ? '已复制' : '复制'}>
                                  <Button type="text" size="small"
                                    icon={copiedMsgIds.has(msg.id)
                                      ? <CheckOutlined style={{ fontSize: 14, color: '#10B981' }} />
                                      : <CopyOutlined style={{ fontSize: 14, color: '#bbb' }} />}
                                    style={{ padding: '0 6px' }}
                                    onClick={() => {
                                      navigator.clipboard.writeText(msg.content).then(() => {
                                        setCopiedMsgIds(prev => { const s = new Set(prev); s.add(msg.id); return s; });
                                        setTimeout(() => setCopiedMsgIds(prev => { const s = new Set(prev); s.delete(msg.id); return s; }), 2000);
                                      });
                                    }}
                                  />
                                </Tooltip>
                                <Tooltip title="分享">
                                  <Button type="text" size="small"
                                    icon={<ShareAltOutlined style={{ fontSize: 14, color: '#bbb' }} />}
                                    style={{ padding: '0 6px' }}
                                    onClick={() => {
                                      setShareSelectedMsgIds(new Set([msg.id]));
                                      setShowConvShareModal(true);
                                    }}
                                  />
                                </Tooltip>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    ); })}

                </>
              )}
              </div>

              {/* 输入框区域 / 分享工具栏 */}
              {showConvShareModal ? (() => {
                const allMsgs = currentConversation?.messages ?? messages;
                const visibleMsgs = allMsgs.filter(m => m.role === 'user' || m.role === 'assistant');
                const allSelected = visibleMsgs.length > 0 && visibleMsgs.every(m => shareSelectedMsgIds.has(m.id));
                const expiryOptions: Array<[string, string]> = [['7d','7天有效'],['30d','30天有效'],['90d','90天有效'],['forever','永久有效']];
                return (
                  <div style={{
                    background: '#fff',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}>
                    {/* 全选 */}
                    <div
                      onClick={() => {
                        if (allSelected) setShareSelectedMsgIds(new Set());
                        else setShareSelectedMsgIds(new Set(visibleMsgs.map(m => m.id)));
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none', flexShrink: 0 }}
                    >
                      <div style={{
                        width: 18, height: 18, borderRadius: 4,
                        border: `2px solid ${allSelected ? '#6366F1' : '#d9d9d9'}`,
                        background: allSelected ? '#6366F1' : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {allSelected && <CheckOutlined style={{ color: '#fff', fontSize: 10 }} />}
                      </div>
                      <span style={{ fontSize: 13, color: '#333' }}>全选</span>
                    </div>


                    {/* 允许其他用户访问聊天中的文件 */}
                    <div
                      onClick={() => shareSelectedMsgIds.size > 0 && setShareAllowFileAccess(v => !v)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: shareSelectedMsgIds.size > 0 ? 'pointer' : 'not-allowed', userSelect: 'none', flexShrink: 0, opacity: shareSelectedMsgIds.size > 0 ? 1 : 0.4 }}
                    >
                      <div style={{
                        width: 18, height: 18, borderRadius: 4,
                        border: `2px solid ${shareAllowFileAccess && shareSelectedMsgIds.size > 0 ? '#6366F1' : '#d9d9d9'}`,
                        background: shareAllowFileAccess && shareSelectedMsgIds.size > 0 ? '#6366F1' : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {shareAllowFileAccess && shareSelectedMsgIds.size > 0 && <CheckOutlined style={{ color: '#fff', fontSize: 10 }} />}
                      </div>
                      <span style={{ fontSize: 13, color: shareSelectedMsgIds.size > 0 ? '#333' : '#aaa' }}>允许其他用户访问聊天中的文件</span>
                    </div>

                    <div style={{ flex: 1 }} />

                    {/* 更多操作：反馈与举报 / 删除 */}
                    <Dropdown
                      trigger={['click']}
                      placement="topRight"
                      menu={{
                        items: [
                          {
                            key: 'report',
                            icon: <ExclamationCircleOutlined style={{ color: '#F59E0B' }} />,
                            label: '反馈与举报',
                            onClick: () => {
                              Modal.confirm({
                                title: '反馈与举报',
                                icon: <ExclamationCircleOutlined style={{ color: '#F59E0B' }} />,
                                content: (
                                  <div style={{ paddingTop: 8 }}>
                                    <div style={{ fontSize: 13, color: '#555', marginBottom: 12 }}>请选择举报原因：</div>
                                    {['内容不准确 / 有误导性', '涉及违法违规内容', '存在隐私泄露风险', '重复或无意义内容', '其他问题'].map(reason => (
                                      <div
                                        key={reason}
                                        style={{
                                          padding: '8px 12px', borderRadius: 6, marginBottom: 6,
                                          border: '1px solid #e8e8e8', cursor: 'pointer', fontSize: 13, color: '#333',
                                          transition: 'all 0.15s',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.background = '#EEF2FF'; e.currentTarget.style.color = '#6366F1'; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8e8e8'; e.currentTarget.style.background = ''; e.currentTarget.style.color = '#333'; }}
                                        onClick={() => { Modal.destroyAll(); message.success('感谢您的反馈，我们会尽快处理'); }}
                                      >
                                        {reason}
                                      </div>
                                    ))}
                                  </div>
                                ),
                                footer: null,
                                width: 400,
                              });
                            },
                          },
                          { type: 'divider' },
                          {
                            key: 'delete',
                            icon: <DeleteOutlined style={{ color: '#ef4444' }} />,
                            label: <span style={{ color: '#ef4444' }}>删除</span>,
                            disabled: shareSelectedMsgIds.size === 0,
                            onClick: () => {
                              Modal.confirm({
                                title: '确认删除',
                                icon: <ExclamationCircleOutlined style={{ color: '#ef4444' }} />,
                                content: `确定删除选中的 ${shareSelectedMsgIds.size} 条消息？此操作不可撤销。`,
                                okText: '删除',
                                cancelText: '取消',
                                okButtonProps: { danger: true },
                                onOk: () => {
                                  const idsToDelete = new Set(shareSelectedMsgIds);
                                  if (currentConversation) {
                                    setCurrentConversation(prev => prev ? {
                                      ...prev,
                                      messages: prev.messages.filter(m => !idsToDelete.has(m.id)),
                                    } : null);
                                    setConversations(prev => prev.map(conv =>
                                      conv.id === currentConversation.id
                                        ? { ...conv, messages: conv.messages.filter(m => !idsToDelete.has(m.id)) }
                                        : conv
                                    ));
                                  } else {
                                    setMessages(prev => prev.filter(m => !idsToDelete.has(m.id)));
                                  }
                                  setShareSelectedMsgIds(new Set());
                                  message.success('已删除选中消息');
                                },
                              });
                            },
                          },
                        ],
                      }}
                    >
                      <Button
                        size="small"
                        icon={<EllipsisOutlined />}
                        style={{ borderRadius: 8 }}
                      />
                    </Dropdown>

                    {/* 分享图片 */}
                    <Button
                      size="small"
                      disabled={shareSelectedMsgIds.size === 0}
                      loading={shareImageLoading}
                      icon={<span style={{ fontSize: 13 }}>🖼️</span>}
                      style={{ borderRadius: 8, fontWeight: 500 }}
                      onClick={async () => {
                        if (!sharePreviewRef.current) return;
                        setShareImageLoading(true);
                        try {
                          const canvas = await html2canvas(sharePreviewRef.current, {
                            scale: 2, backgroundColor: '#fff', useCORS: true, logging: false,
                          });
                          const url = canvas.toDataURL('image/png');
                          setShareImageDataUrl(url);
                          setShowShareImagePreview(true);
                        } catch {
                          message.error('图片生成失败，请重试');
                        } finally {
                          setShareImageLoading(false);
                        }
                      }}
                    >
                      分享图片
                    </Button>

                    {/* 复制链接 + 时效 Popover */}
                    <Popover
                      trigger="click"
                      placement="topRight"
                      content={
                        <div style={{ minWidth: 140 }}>
                          {expiryOptions.map(([key, label]) => (
                            <div
                              key={key}
                              onClick={() => {
                                setConvShareExpiry(key as typeof convShareExpiry);
                                const link = `${window.location.origin}/share/conv-${currentConversation?.id ?? 'demo'}?exp=${key}&msgs=${shareSelectedMsgIds.size}&files=${shareAllowFileAccess ? 1 : 0}`;
                                navigator.clipboard.writeText(link).then(() => {
                                  message.success(`链接已复制（${label}）`);
                                  setShowConvShareModal(false);
                                  setShareSelectedMsgIds(new Set());
                                });
                              }}
                              style={{
                                padding: '8px 12px', cursor: 'pointer', borderRadius: 6,
                                fontSize: 13, color: convShareExpiry === key ? '#6366F1' : '#333',
                                fontWeight: convShareExpiry === key ? 600 : 400,
                                background: convShareExpiry === key ? '#EEF2FF' : 'transparent',
                                transition: 'background 0.15s',
                              }}
                            >
                              {label}
                            </div>
                          ))}
                        </div>
                      }
                    >
                      <Button
                        type="primary"
                        size="small"
                        disabled={shareSelectedMsgIds.size === 0}
                        icon={<CopyOutlined />}
                        style={{ borderRadius: 8, background: '#6366F1', borderColor: '#6366F1', fontWeight: 600 }}
                      >
                        复制链接
                      </Button>
                    </Popover>

                    {/* 隐藏截图区域 */}
                    <div
                      ref={sharePreviewRef}
                      style={{
                        position: 'fixed', left: -9999, top: 0,
                        width: 560, background: '#fff',
                        padding: '28px 28px 20px',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🤖</div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a' }}>{currentConversation?.title ?? 'AI 对话'}</div>
                          <div style={{ fontSize: 12, color: '#aaa' }}>智能助手平台</div>
                        </div>
                      </div>
                      <div style={{ height: 1, background: '#f0f0f0', marginBottom: 18 }} />
                      {(currentConversation?.messages ?? messages)
                        .filter(m => shareSelectedMsgIds.has(m.id))
                        .map(msg => {
                          const isUser = msg.role === 'user';
                          return (
                            <div key={msg.id} style={{ marginBottom: 14 }}>
                              {!isUser ? (
                                <div style={{ background: '#fafafa', border: '1px solid #eeecfd', borderRadius: 10, padding: '14px 16px' }}>
                                  {msg.content.split('\n')[0] && (
                                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a', marginBottom: 6 }}>
                                      {msg.content.split('\n')[0].replace(/^#+\s*/, '')}
                                    </div>
                                  )}
                                  <div style={{ fontSize: 13, color: '#444', lineHeight: 1.8, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                    {msg.content.split('\n').slice(1).join('\n') || msg.content}
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                  <div style={{ background: '#6366F1', color: '#fff', borderRadius: '14px 14px 4px 14px', padding: '10px 14px', fontSize: 13, lineHeight: 1.65, maxWidth: '76%', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                    {msg.content}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 16, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                        <span style={{ fontSize: 11, color: '#ccc' }}>由</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#6366F1' }}>智能助手平台</span>
                        <span style={{ fontSize: 11, color: '#ccc' }}>生成</span>
                      </div>
                    </div>
                  </div>
                );
              })() : (
              <div style={{
                background: '#fff',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                padding: '16px'
              }}>
                <div style={{ position: 'relative' }}>
                  <MentionEditor
                    ref={conversationEditorRef}
                    value={inputValue}
                    onChange={(value) => setInputValue(value)}
                    placeholder="输入消息... (输入 @ 提及智能体)"
                    agents={(currentGroup?.members || currentConversation?.agents || currentConversation?.group?.members || []).filter(a => a.id !== 'all')}
                    groups={[]}
                    onSelectAgent={(agent) => {
                      const agentData = (currentGroup?.members || currentConversation?.agents || currentConversation?.group?.members || [])
                        .find(a => a.id === agent.id);
                      if (agentData && !mentionedAgents.find(a => a.id === agent.id)) {
                        if (mentionedAgents.length < 10) {
                          setMentionedAgents([...mentionedAgents, agentData]);
                        }
                      }
                    }}
                    minRows={3}
                    maxRows={6}
                    style={{
                      fontSize: '14px',
                      border: 'none',
                      width: '100%'
                    }}
                  />
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid #f0f0f0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      {mentionedAgents.length > 0 ? `已选择 ${mentionedAgents.length} 个智能体` : '输入 @ 选择智能体'}
                    </div>
                    <Button
                      type="default"
                      size="small"
                      icon={<span style={{ fontSize: '14px', fontWeight: 'bold' }}>@</span>}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        conversationEditorRef.current?.openMentionPanel(rect);
                      }}
                    />
                    {/* 群组对话时移除上传文件和深度思考按钮，保持界面一致 */}
                    <Button
                      type="default"
                      size="small"
                      icon={<PaperClipOutlined />}
                      style={{ borderRadius: '6px' }}
                    />
                    <Button
                      type="default"
                      size="small"
                      icon={<BulbOutlined />}
                      style={{ borderRadius: '6px' }}
                    />
                  </div>
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSendMessage}
                    style={{
                      background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                      border: 'none',
                      borderRadius: '6px'
                    }}
                    disabled={!inputValue.trim()}
                  >
                    发送
                  </Button>
                </div>
              </div>
              )}
            </div>
            {/* 右侧：文档编辑器面板 */}
            {docPanel && (
              <div style={{
                ...(docFullScreen ? {
                  position: 'fixed' as const, inset: 0, zIndex: 9999,
                  width: '100vw', height: '100vh', borderRadius: 0,
                } : {
                  width: docPanelWidth, flexShrink: 0, height: '100%',
                  borderRadius: '0 12px 12px 0',
                }),
                borderLeft: '1px solid #e8e8e8', background: '#fff',
                display: 'flex', flexDirection: 'column',
                boxShadow: '-2px 0 12px rgba(0,0,0,0.06)', overflow: 'hidden',
                position: 'relative' as const,
              }}>
                {/* 拖拽调整宽度的把手 */}
                {!docFullScreen && (
                  <div
                    onMouseDown={e => {
                      docResizingRef.current = true;
                      docResizeStartX.current = e.clientX;
                      docResizeStartWidth.current = docPanelWidth;
                      const onMove = (ev: MouseEvent) => {
                        if (!docResizingRef.current) return;
                        const delta = docResizeStartX.current - ev.clientX;
                        setDocPanelWidth(Math.max(320, Math.min(800, docResizeStartWidth.current + delta)));
                      };
                      const onUp = () => {
                        docResizingRef.current = false;
                        window.removeEventListener('mousemove', onMove);
                        window.removeEventListener('mouseup', onUp);
                      };
                      window.addEventListener('mousemove', onMove);
                      window.addEventListener('mouseup', onUp);
                    }}
                    style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0, width: 5,
                      cursor: 'col-resize', zIndex: 10,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <div style={{ width: 3, height: 40, borderRadius: 2, background: '#d1d5db', transition: 'background 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#6366F1')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#d1d5db')}
                    />
                  </div>
                )}
                {/* 顶部工具栏 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #f0f0f0', background: '#fafafa', flexShrink: 0 }}>
                  {/* 左侧：时间 + undo/redo */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileTextOutlined style={{ fontSize: 15, color: '#6366F1' }} />
                    <span style={{ fontSize: 12, color: '#999' }}>修改于 {docUpdatedAt}</span>
                    <div style={{ width: 1, height: 14, background: '#e8e8e8', margin: '0 2px' }} />
                    <Tooltip title={`撤销${docHistoryIndex <= 0 ? '（无可撤销）' : ''}`}>
                      <Button type="text" size="small" icon={<UndoOutlined />} disabled={docHistoryIndex <= 0} onClick={handleDocUndo} style={{ padding: '0 6px', color: docHistoryIndex <= 0 ? '#ccc' : '#555' }} />
                    </Tooltip>
                    <Tooltip title={`重做${docHistoryIndex >= docHistory.length - 1 ? '（无可重做）' : ''}`}>
                      <Button type="text" size="small" icon={<RedoOutlined />} disabled={docHistoryIndex >= docHistory.length - 1} onClick={handleDocRedo} style={{ padding: '0 6px', color: docHistoryIndex >= docHistory.length - 1 ? '#ccc' : '#555' }} />
                    </Tooltip>
                  </div>
                  {/* 右侧操作 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Tooltip title={docCopied ? '已复制' : '复制'}>
                      <Button type="text" size="small" icon={docCopied ? <CheckOutlined style={{ color: '#10B981' }} /> : <CopyOutlined />} onClick={handleDocCopy} style={{ padding: '0 7px', color: '#555' }} />
                    </Tooltip>
                    {/* 下载下拉菜单 */}
                    <Dropdown
                      open={showDownloadMenu}
                      onOpenChange={setShowDownloadMenu}
                      trigger={['click']}
                      placement="bottomRight"
                      menu={{
                        items: [
                          {
                            key: 'word',
                            label: (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
                                <div style={{ width: 28, height: 28, borderRadius: 6, background: '#2b579a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>W</div>
                                <span style={{ fontSize: 14 }}>Word</span>
                              </div>
                            ),
                            onClick: () => handleDocDownloadFormat('word'),
                          },
                          {
                            key: 'pdf',
                            label: (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
                                <div style={{ width: 28, height: 28, borderRadius: 6, background: '#d93025', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>P</div>
                                <span style={{ fontSize: 14 }}>PDF</span>
                              </div>
                            ),
                            onClick: () => handleDocDownloadFormat('pdf'),
                          },
                          {
                            key: 'markdown',
                            label: (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
                                <div style={{ width: 28, height: 28, borderRadius: 6, background: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>MD</div>
                                <span style={{ fontSize: 14 }}>Markdown</span>
                              </div>
                            ),
                            onClick: () => handleDocDownloadFormat('markdown'),
                          },
                        ],
                        style: { minWidth: 160, padding: '4px' },
                      }}
                    >
                      <Tooltip title="下载">
                        <Button type="text" size="small" icon={<DownloadOutlined />} style={{ padding: '0 7px', color: '#555' }} />
                      </Tooltip>
                    </Dropdown>
                    <Tooltip title="分享">
                      <Button type="text" size="small" icon={<ShareAltOutlined />} onClick={handleDocShare} style={{ padding: '0 7px', color: '#555' }} />
                    </Tooltip>
                    <Tooltip title="评论">
                      <Button type="text" size="small" icon={<MessageOutlined />} onClick={() => setShowDocComments(v => !v)}
                        style={{ padding: '0 7px', color: showDocComments ? '#6366F1' : '#555', background: showDocComments ? '#EEF2FF' : 'transparent', borderRadius: 4 }} />
                    </Tooltip>
                    {/* 更多菜单 */}
                    <Dropdown
                      open={showMoreMenu}
                      onOpenChange={setShowMoreMenu}
                      trigger={['click']}
                      placement="bottomRight"
                      menu={{
                        style: { minWidth: 200, padding: '4px 0', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.12)' },
                        items: [
                          {
                            key: 'find',
                            label: (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '2px 0' }}>
                                <SearchOutlined style={{ fontSize: 15, color: '#555' }} />
                                <span>查找和替换</span>
                              </div>
                            ),
                            onClick: () => { setShowFindReplace(true); setShowMoreMenu(false); },
                          },
                          { type: 'divider' },
                          {
                            key: 'copylink',
                            label: (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '2px 0' }}>
                                <LinkOutlined style={{ fontSize: 15, color: '#555' }} />
                                <span>复制链接</span>
                              </div>
                            ),
                            onClick: handleCopyDocLink,
                          },
                          {
                            key: 'copy',
                            label: (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '2px 0' }}>
                                <FileAddOutlined style={{ fontSize: 15, color: '#555' }} />
                                <span>创建副本</span>
                              </div>
                            ),
                            onClick: handleCreateDocCopy,
                          },
                          {
                            key: 'print',
                            label: (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '2px 0' }}>
                                <PrinterOutlined style={{ fontSize: 15, color: '#555' }} />
                                <span>打印</span>
                              </div>
                            ),
                            onClick: handlePrintDoc,
                          },
                          { type: 'divider' },
                          {
                            key: 'history',
                            label: (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '2px 0' }}>
                                <HistoryOutlined style={{ fontSize: 15, color: '#555' }} />
                                <span>历史记录</span>
                              </div>
                            ),
                            onClick: () => { setShowHistoryModal(true); setShowMoreMenu(false); },
                          },
                          {
                            key: 'comments-history',
                            label: (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '2px 0' }}>
                                <MessageOutlined style={{ fontSize: 15, color: '#555' }} />
                                <span>历史评论</span>
                              </div>
                            ),
                            onClick: () => { setShowDocComments(true); setShowMoreMenu(false); },
                          },
                          {
                            key: 'shortcuts',
                            label: (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '2px 0' }}>
                                <KeyOutlined style={{ fontSize: 15, color: '#555' }} />
                                <span>快捷键列表</span>
                              </div>
                            ),
                            onClick: () => { setShowShortcutsModal(true); setShowMoreMenu(false); },
                          },
                          {
                            key: 'feedback',
                            label: (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '2px 0' }}>
                                <FormOutlined style={{ fontSize: 15, color: '#555' }} />
                                <span>提交反馈</span>
                              </div>
                            ),
                            onClick: () => { setShowFeedbackModal(true); setShowMoreMenu(false); },
                          },
                          { type: 'divider' },
                          {
                            key: 'delete',
                            label: (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '2px 0' }}>
                                <DeleteOutlined style={{ fontSize: 15, color: '#ff4d4f' }} />
                                <span style={{ color: '#ff4d4f' }}>删除</span>
                              </div>
                            ),
                            onClick: handleDeleteDoc,
                          },
                        ],
                      }}
                    >
                      <Tooltip title="更多">
                        <Button type="text" size="small" icon={<EllipsisOutlined />}
                          style={{ padding: '0 7px', color: showMoreMenu ? '#6366F1' : '#555', background: showMoreMenu ? '#EEF2FF' : 'transparent', borderRadius: 4 }} />
                      </Tooltip>
                    </Dropdown>
                    <div style={{ width: 1, height: 14, background: '#e8e8e8', margin: '0 4px' }} />
                    <Tooltip title={docFullScreen ? '退出全屏' : '打开全屏编辑'}>
                      <Button type="text" size="small"
                        icon={<span style={{ fontSize: 15, lineHeight: 1 }}>{docFullScreen ? '⊡' : '⤢'}</span>}
                        onClick={() => setDocFullScreen(v => !v)}
                        style={{ padding: '0 7px', color: '#555' }} />
                    </Tooltip>
                    <Tooltip title="关闭文档">
                      <Button type="text" size="small" icon={<CloseOutlined />} onClick={() => { handleCloseDoc(); setDocFullScreen(false); }} style={{ padding: '0 7px', color: '#999' }} />
                    </Tooltip>
                  </div>
                </div>

                {/* 主体内容区（编辑 + 评论） */}
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                  {/* 文档编辑区 */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: docFullScreen ? '48px 96px' : '24px 28px', display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
                    {/* 查找和替换面板 */}
                    {showFindReplace && (
                      <div style={{
                        position: 'sticky', top: 0, zIndex: 50,
                        background: '#fff', border: '1px solid #e8e8e8',
                        borderRadius: 10, padding: '14px 16px',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                        marginBottom: 8,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>查找和替换</span>
                          <CloseOutlined onClick={() => { setShowFindReplace(false); setFindText(''); setReplaceText(''); setFindResult(''); }} style={{ cursor: 'pointer', color: '#999', fontSize: 12 }} />
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                          <input
                            value={findText}
                            onChange={e => { setFindText(e.target.value); setFindResult(''); }}
                            onKeyDown={e => { if (e.key === 'Enter') handleFindNext(); }}
                            placeholder="查找"
                            style={{ flex: 1, padding: '6px 10px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 13, outline: 'none' }}
                          />
                          <button onClick={handleFindPrev}
                            style={{ padding: '6px 10px', border: '1px solid #d9d9d9', borderRadius: 6, background: '#fafafa', cursor: 'pointer', fontSize: 12, color: '#555' }}>↑</button>
                          <button onClick={handleFindNext}
                            style={{ padding: '6px 10px', border: '1px solid #d9d9d9', borderRadius: 6, background: '#fafafa', cursor: 'pointer', fontSize: 12, color: '#555' }}>↓</button>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            value={replaceText}
                            onChange={e => setReplaceText(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleReplaceAll(); }}
                            placeholder="替换为"
                            style={{ flex: 1, padding: '6px 10px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 13, outline: 'none' }}
                          />
                          <button onClick={handleReplaceAll}
                            style={{ padding: '6px 12px', border: 'none', borderRadius: 6, background: '#6366F1', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                            全部替换
                          </button>
                        </div>
                        {findResult && <div style={{ marginTop: 8, fontSize: 12, color: findResult.startsWith('已替换') ? '#10B981' : '#f59e0b' }}>{findResult}</div>}
                      </div>
                    )}
                    {/* 标题 */}
                    <input
                      value={docTitle}
                      onChange={e => handleDocChange(e.target.value, docContent)}
                      placeholder="文档标题"
                      style={{ fontSize: docFullScreen ? 30 : 22, fontWeight: 700, color: '#1a1a1a', border: 'none', outline: 'none', width: '100%', background: 'transparent', padding: 0, lineHeight: 1.4 }}
                    />
                    <div style={{ height: 1, background: '#f0f0f0' }} />
                    {/* 正文 contentEditable */}
                    <div
                      ref={docEditorRef}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={(e) => {
                        const text = (e.currentTarget as HTMLDivElement).innerText;
                        const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
                        setDocContent(text);
                        setDocUpdatedAt(now);
                        setDocHistory(prev => {
                          const truncated = prev.slice(0, docHistoryIndex + 1);
                          return [...truncated, { title: docTitle, content: text }];
                        });
                        setDocHistoryIndex(prev => prev + 1);
                      }}
                      onMouseUp={handleEditorMouseUp}
                      onKeyDown={() => setSelectionToolbar({ visible: false, x: 0, y: 0 })}
                      onClick={() => {
                        const sel = window.getSelection();
                        if (!sel || sel.toString().length === 0) setSelectionToolbar({ visible: false, x: 0, y: 0 });
                      }}
                      data-placeholder="开始编写文档内容..."
                      style={{
                        flex: 1, minHeight: docFullScreen ? 600 : 320,
                        fontSize: docFullScreen ? 16 : 14, lineHeight: 1.9, color: '#333',
                        outline: 'none', width: '100%', fontFamily: 'inherit',
                      }}
                    />
                  </div>

                  {/* 评论栏 */}
                  {showDocComments && (
                    <div style={{ width: 240, borderLeft: '1px solid #e8e8e8', display: 'flex', flexDirection: 'column', flexShrink: 0, background: '#fafafa' }}>
                      <div style={{ padding: '12px 14px', borderBottom: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>评论 ({docComments.length})</span>
                        <CloseOutlined onClick={() => { setShowDocComments(false); setPendingComment(null); setCommentInput(''); }} style={{ fontSize: 12, color: '#999', cursor: 'pointer' }} />
                      </div>
                      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 0' }}>
                        {/* 待提交的评论输入框 */}
                        {pendingComment && (
                          <div style={{ marginBottom: 12, border: '1px solid #e0deff', borderRadius: 10, background: '#fff', overflow: 'hidden', boxShadow: '0 2px 8px rgba(99,102,241,0.08)' }}>
                            {pendingComment.selectedText && (
                              <div style={{ padding: '8px 12px', borderLeft: '3px solid #F59E0B', background: '#FFFBEB', fontSize: 12, color: '#92400e', lineHeight: 1.5, borderBottom: '1px solid #f0f0f0' }}>
                                <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                                  {pendingComment.selectedText}
                                </span>
                              </div>
                            )}
                            <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Avatar size={24} style={{ background: 'linear-gradient(135deg, #f472b6, #c084fc)', flexShrink: 0, fontSize: 11, fontWeight: 700 }}>A</Avatar>
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>Alina</span>
                            </div>
                            <div style={{ padding: '0 12px 10px' }}>
                              <input
                                value={commentInput}
                                onChange={e => setCommentInput(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter' && !e.shiftKey && commentInput.trim()) {
                                    const newComment: DocComment = {
                                      id: `c${Date.now()}`,
                                      selectedText: pendingComment.selectedText,
                                      commentText: commentInput.trim(),
                                      author: 'Alina',
                                      avatar: 'A',
                                      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                                    };
                                    setDocComments(prev => [...prev, newComment]);
                                    setPendingComment(null);
                                    setCommentInput('');
                                  }
                                  if (e.key === 'Escape') { setPendingComment(null); setCommentInput(''); }
                                }}
                                placeholder="输入评论，Enter 发送"
                                autoFocus
                                style={{ width: '100%', border: '1px solid #e8e8e8', borderRadius: 6, padding: '6px 10px', fontSize: 12, outline: 'none', boxSizing: 'border-box', lineHeight: 1.5 }}
                              />
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 8 }}>
                                <button onClick={() => { setPendingComment(null); setCommentInput(''); }}
                                  style={{ padding: '3px 10px', border: '1px solid #e8e8e8', borderRadius: 6, background: '#fff', fontSize: 12, cursor: 'pointer', color: '#666' }}>取消</button>
                                <button
                                  onClick={() => {
                                    if (!commentInput.trim()) return;
                                    const newComment: DocComment = {
                                      id: `c${Date.now()}`,
                                      selectedText: pendingComment.selectedText,
                                      commentText: commentInput.trim(),
                                      author: 'Alina',
                                      avatar: 'A',
                                      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                                    };
                                    setDocComments(prev => [...prev, newComment]);
                                    setPendingComment(null);
                                    setCommentInput('');
                                  }}
                                  style={{ padding: '3px 12px', border: 'none', borderRadius: 6, background: commentInput.trim() ? '#6366F1' : '#e0e0e0', color: '#fff', fontSize: 12, cursor: commentInput.trim() ? 'pointer' : 'default', fontWeight: 500 }}>发送</button>
                              </div>
                            </div>
                          </div>
                        )}
                        {/* 已有评论列表 */}
                        {docComments.length === 0 && !pendingComment && (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', gap: 8 }}>
                            <div style={{ fontSize: 28 }}>💬</div>
                            <div style={{ fontSize: 13, color: '#999', textAlign: 'center' }}>暂无评论</div>
                            <div style={{ fontSize: 12, color: '#bbb', textAlign: 'center' }}>选中文档内容后点击浮动工具栏的 💬 添加评论</div>
                          </div>
                        )}
                        {docComments.map(c => (
                          <div key={c.id} style={{ marginBottom: 12, border: '1px solid #e8e8e8', borderRadius: 10, background: '#fff', overflow: 'hidden' }}>
                            {c.selectedText && (
                              <div style={{ padding: '7px 12px', borderLeft: '3px solid #F59E0B', background: '#FFFBEB', fontSize: 12, color: '#92400e', lineHeight: 1.5, borderBottom: '1px solid #f0f0f0' }}>
                                <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{c.selectedText}</span>
                              </div>
                            )}
                            <div style={{ padding: '10px 12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <Avatar size={22} style={{ background: 'linear-gradient(135deg, #f472b6, #c084fc)', flexShrink: 0, fontSize: 10, fontWeight: 700 }}>{c.avatar}</Avatar>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>{c.author}</span>
                                <span style={{ fontSize: 11, color: '#bbb', marginLeft: 'auto' }}>{c.time}</span>
                              </div>
                              <div style={{ fontSize: 12, color: '#555', lineHeight: 1.6 }}>{c.commentText}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 底部信息 */}
                <div style={{ padding: '10px 16px', borderTop: '1px solid #f0f0f0', fontSize: 11, color: '#bbb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                  <span>以上内容为AI生成，请注意核实</span>
                  <span>{docContent.length} 字</span>
                </div>
              </div>
            )}
          </div>
          ) : (!showOpenClaw) ? (
            /* 欢迎界面 */
            <>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 style={{
              fontSize: '48px',
              fontWeight: 'bold',
              background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px'
            }}>
              {greeting}，Alina
            </h1>
          </div>

          {/* 新建对话主区域 */}
          <div style={{ width: '100%', maxWidth: '800px', position: 'relative' }}>

            {/* 模式标题提示 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px'
            }}>
              {chatMode === 'agent' ? (
                <>
                  <span style={{
                    padding: '2px 8px',
                    border: '1.5px dashed #6366F1',
                    borderRadius: '4px',
                    color: '#6366F1',
                    fontSize: '12px',
                    fontWeight: 600
                  }}>Beta</span>
                  <span style={{ fontSize: '14px', color: '#555', fontWeight: 500 }}>
                    Agent 模式：多样工具，多种技能，直接交付结果
                  </span>
                </>
              ) : (
                <span style={{ fontSize: '14px', color: '#555', fontWeight: 500 }}>
                  对话模式：聊天问答，快速响应，轻量化交付
                </span>
              )}
            </div>

            {/* 输入卡片 */}
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              padding: '16px'
            }}>
              {/* 已选择的智能体标签 */}
              {mentionedAgents.length > 0 && (
                <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {mentionedAgents.map(agent => (
                    <Tag
                      key={agent.id}
                      closable
                      onClose={() => setMentionedAgents(mentionedAgents.filter(a => a.id !== agent.id))}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        background: `${agent.color}22`,
                        border: `1px solid ${agent.color}`,
                        color: agent.color,
                        fontSize: '13px'
                      }}
                    >
                      <span style={{ marginRight: '4px' }}>{agent.icon}</span>
                      @{agent.name}
                    </Tag>
                  ))}
                </div>
              )}

              {/* 上传的文件标签 */}
              {uploadedFiles.length > 0 && (
                <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {uploadedFiles.map(file => (
                    <Tag
                      key={file.id}
                      closable
                      onClose={() => setUploadedFiles(uploadedFiles.filter(f => f.id !== file.id))}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        background: '#FEF3C7',
                        border: '1px solid #F59E0B',
                        color: '#92400E',
                        fontSize: '13px'
                      }}
                    >
                      📎 {file.name}
                    </Tag>
                  ))}
                </div>
              )}

              {/* 场景引用标签 */}
              {selectedScene && (
                <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    background: '#EEF2FF',
                    border: '1px solid #6366F1',
                    fontSize: '13px',
                    color: '#6366F1',
                    fontWeight: 500
                  }}>
                    <span>{selectedScene.icon}</span>
                    <span>{selectedScene.name}</span>
                    <span
                      onClick={() => setSelectedScene(null)}
                      style={{ cursor: 'pointer', marginLeft: '2px', fontSize: '14px', lineHeight: 1, opacity: 0.6 }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                    >×</span>
                  </div>
                </div>
              )}

              {/* 文本输入区 */}
              <MentionEditor
                ref={editorRef}
                value={inputValue}
                onChange={(value) => setInputValue(value)}
                placeholder="有什么我能帮您的？"
                agents={allAgents}
                groups={[]}
                onSelectAgent={(agent) => {
                  const agentData = allAgents.find(a => a.id === agent.id);
                  if (agentData) setMentionedAgents([agentData]);
                }}
                minRows={4}
                maxRows={8}
                style={{ fontSize: '15px', border: 'none', width: '100%' }}
              />

              {/* 底部工具栏 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '12px',
                paddingTop: '12px',
                // borderTop: '1px solid #f0f0f0'
              }}>
                {/* 左侧工具 */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {/* 上传文件（两种模式都支持） */}
                  <Button
                    type="text"
                    icon={<PaperClipOutlined style={{ fontSize: '18px', color: '#555' }} />}
                    style={{ borderRadius: '6px', padding: '4px 8px' }}
                    title="上传文件"
                    onClick={() => document.getElementById('welcome-file-upload')?.click()}
                  />
                  <input
                    id="welcome-file-upload"
                    type="file"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />

                  {/* Chat 模式专属工具 */}
                  {chatMode === 'chat' && (
                    <>
                      {/* 联网搜索 - hover显示搜索选项弹窗 */}
                      <Popover
                        open={showSearchPopover}
                        onOpenChange={(v) => setShowSearchPopover(v)}
                        trigger="hover"
                        placement="top"
                        overlayInnerStyle={{
                          background: '#1a1a1a',
                          borderRadius: '10px',
                          padding: '0',
                          minWidth: '200px'
                        }}
                        overlayStyle={{ '--antd-arrow-background-color': '#1a1a1a' } as React.CSSProperties}
                        content={
                          <div style={{ color: '#fff' }}>
                            {/* 搜索 - 单轮 */}
                            <div
                              onClick={() => {
                                setWebSearch(true);
                                setSearchMode('normal');
                                setShowSearchPopover(false);
                              }}
                              style={{
                                padding: '12px 16px',
                                cursor: 'pointer',
                                borderBottom: '1px solid rgba(255,255,255,0.1)'
                              }}
                            >
                              <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>搜索</div>
                              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>单轮搜索，快速获取信息</div>
                            </div>
                            {/* 高级搜索 - 多轮 + 开关 */}
                            <div style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                                <span style={{ fontWeight: 600, fontSize: '14px' }}>高级搜索</span>
                                <Switch
                                  size="small"
                                  checked={searchMode === 'advanced'}
                                  onChange={(checked) => {
                                    setWebSearch(true);
                                    setSearchMode(checked ? 'advanced' : 'normal');
                                    if (checked) setDeepThinking(true);
                                    setShowSearchPopover(false);
                                  }}
                                  style={{ background: searchMode === 'advanced' ? '#6366F1' : undefined }}
                                />
                              </div>
                              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>多轮搜索，深入研究分析</div>
                            </div>
                          </div>
                        }
                      >
                        <Button
                          type="text"
                          icon={<span style={{ fontSize: '18px' }}>🌐</span>}
                          style={{
                            borderRadius: '6px',
                            padding: '4px 8px',
                            color: webSearch ? '#6366F1' : '#555',
                            background: webSearch ? '#EEF2FF' : 'transparent',
                            outline: webSearch ? '2px solid #6366F1' : 'none',
                            outlineOffset: '-1px'
                          }}
                          onClick={() => {
                            if (webSearch) {
                              setWebSearch(false);
                              setSearchMode(null);
                            } else {
                              setWebSearch(true);
                              if (!searchMode) setSearchMode('normal');
                            }
                          }}
                        />
                      </Popover>

                      {/* 深度思考 */}
                      <Button
                        type="text"
                        icon={<BulbOutlined style={{ fontSize: '18px', color: deepThinking ? '#6366F1' : '#555' }} />}
                        title={deepThinking ? '关闭深度思考' : '开启深度思考'}
                        style={{
                          borderRadius: '6px',
                          padding: '4px 8px',
                          background: deepThinking ? '#EEF2FF' : 'transparent'
                        }}
                        onClick={() => setDeepThinking(!deepThinking)}
                      />
                    </>
                  )}
                </div>

                {/* 右侧：模式切换 + 发送 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Agent / Chat 模式切换 */}
                  <div style={{
                    display: 'flex',
                    background: '#f0f0f0',
                    borderRadius: '8px',
                    padding: '2px'
                  }}>
                    <div
                      onClick={() => setChatMode('agent')}
                      style={{
                        padding: '4px 14px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: chatMode === 'agent' ? 600 : 400,
                        background: chatMode === 'agent' ? '#fff' : 'transparent',
                        color: chatMode === 'agent' ? '#1a1a1a' : '#888',
                        boxShadow: chatMode === 'agent' ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                        transition: 'all 0.2s',
                        userSelect: 'none' as const
                      }}
                    >
                      Agent
                    </div>
                    <div
                      onClick={() => setChatMode('chat')}
                      style={{
                        padding: '4px 14px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: chatMode === 'chat' ? 600 : 400,
                        background: chatMode === 'chat' ? '#fff' : 'transparent',
                        color: chatMode === 'chat' ? '#1a1a1a' : '#888',
                        boxShadow: chatMode === 'chat' ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                        transition: 'all 0.2s',
                        userSelect: 'none' as const
                      }}
                    >
                      Chat
                    </div>
                  </div>

                  {/* 发送按钮 */}
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    style={{
                      background: inputValue.trim()
                        ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
                        : '#e0e0e0',
                      border: 'none',
                      borderRadius: '8px',
                      width: '40px',
                      height: '40px'
                    }}
                    disabled={!inputValue.trim()}
                    onClick={handleCreateConversation}
                  />
                </div>
              </div>
            </div>

            {/* 场景预设区 */}
            {chatMode === 'agent' ? (
              <div style={{ marginTop: '28px' }}>
                {/* Agent 场景分类 tab */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  {['深度写作', 'AI幻灯片', '数据分析', '全栈开发'].map(cat => (
                    <div
                      key={cat}
                      onClick={() => { setAgentSceneCategory(cat); setSelectedScene(null); }}
                      style={{
                        padding: '6px 18px',
                        borderRadius: '20px',
                        border: `1px solid ${agentSceneCategory === cat ? '#6366F1' : '#e0e0e0'}`,
                        background: agentSceneCategory === cat ? '#EEF2FF' : '#fff',
                        color: agentSceneCategory === cat ? '#6366F1' : '#555',
                        fontSize: '13px',
                        fontWeight: agentSceneCategory === cat ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        userSelect: 'none' as const
                      }}
                    >
                      {cat}
                    </div>
                  ))}
                </div>

                {/* Agent 场景卡片 */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {(agentSceneCategory === '深度写作' ? [
                    { icon: '📝', name: '研究报告', desc: '基于多方资料，深度调研并生成专业研究报告' },
                    { icon: '✍️', name: '长文写作', desc: '撰写高质量的长篇文章与深度内容分析' },
                    { icon: '📣', name: '营销文案', desc: '创作有吸引力的营销文案与品牌内容' },
                    { icon: '🔍', name: '内容优化', desc: '优化现有文案表达，提升内容逻辑与说服力' },
                  ] : agentSceneCategory === 'AI幻灯片' ? [
                    { icon: '🎞️', name: '一键生成PPT', desc: '描述主题，自动生成完整演示文稿' },
                    { icon: '🎨', name: '风格定制', desc: '按品牌色彩与风格定制幻灯片主题' },
                    { icon: '📈', name: '数据图表', desc: '将数据自动转化为可视化图表页面' },
                    { icon: '🎤', name: '演讲稿生成', desc: '生成配套演讲稿与每页讲解要点' },
                  ] : agentSceneCategory === '数据分析' ? [
                    { icon: '📊', name: '数据洞察', desc: '上传数据，自动发现关键趋势与规律' },
                    { icon: '📉', name: '销售分析', desc: '分析销售趋势，识别增长机会与风险' },
                    { icon: '🧩', name: '用户行为', desc: '挖掘用户路径与转化漏斗关键节点' },
                    { icon: '🌍', name: '竞品对比', desc: '多维度竞品数据比对与市场分析' },
                  ] : [
                    { icon: '💻', name: '代码生成', desc: '自然语言描述需求，生成完整可运行代码' },
                    { icon: '🐛', name: '智能调试', desc: '自动定位并修复代码Bug与性能问题' },
                    { icon: '🏗️', name: '架构设计', desc: '生成系统架构图与详细技术方案' },
                    { icon: '🧪', name: '单测生成', desc: '自动生成完整的单元测试用例' },
                  ]).map(scene => (
                    <div
                      key={scene.name}
                      onClick={() => {
                        setSelectedScene(scene);
                        editorRef.current?.focus();
                      }}
                      style={{
                        flex: '1 1 160px',
                        maxWidth: '200px',
                        padding: '14px 16px',
                        background: selectedScene?.name === scene.name ? '#EEF2FF' : '#fff',
                        borderRadius: '10px',
                        border: `1px solid ${selectedScene?.name === scene.name ? '#6366F1' : '#e8e8e8'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: selectedScene?.name === scene.name ? '0 2px 8px rgba(99,102,241,0.15)' : '0 1px 4px rgba(0,0,0,0.04)'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedScene?.name !== scene.name) {
                          e.currentTarget.style.borderColor = '#6366F1';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(99,102,241,0.12)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedScene?.name !== scene.name) {
                          e.currentTarget.style.borderColor = '#e8e8e8';
                          e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
                        }
                      }}
                    >
                      <div style={{ fontSize: '22px', marginBottom: '6px' }}>{scene.icon}</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a', marginBottom: '4px' }}>{scene.name}</div>
                      <div style={{ fontSize: '12px', color: '#888', lineHeight: 1.4 }}>{scene.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ marginTop: '28px' }}>
                {/* Chat 场景分类 tab */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  {['知识问答', '智能写作', '文档处理', '语言翻译', '创意灵感'].map(cat => (
                    <div
                      key={cat}
                      onClick={() => setChatSceneCategory(cat)}
                      style={{
                        padding: '6px 18px',
                        borderRadius: '20px',
                        border: `1px solid ${chatSceneCategory === cat ? '#6366F1' : '#e0e0e0'}`,
                        background: chatSceneCategory === cat ? '#EEF2FF' : '#fff',
                        color: chatSceneCategory === cat ? '#6366F1' : '#555',
                        fontSize: '13px',
                        fontWeight: chatSceneCategory === cat ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        userSelect: 'none' as const
                      }}
                    >
                      {cat}
                    </div>
                  ))}
                </div>

                {/* Chat 场景卡片 */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {(chatSceneCategory === '知识问答' ? [
                    { icon: '📚', name: '知识库问答', desc: '从知识库中精准检索，回答专业问题' },
                    { icon: '🔬', name: '学术研究助手', desc: '辅助文献调研与学术写作' },
                    { icon: '💡', name: '百科解答', desc: '快速解答各类知识性问题' },
                    { icon: '🏭', name: '行业专家咨询', desc: '行业知识问答与专家建议' },
                  ] : chatSceneCategory === '智能写作' ? [
                    { icon: '✍️', name: '营销文案', desc: '生成吸引眼球的广告与营销文案' },
                    { icon: '📰', name: '新闻稿撰写', desc: '快速生成专业新闻稿件' },
                    { icon: '📧', name: '商务邮件', desc: '一键生成正式商务邮件' },
                    { icon: '📝', name: '文章润色', desc: '优化文章逻辑与表达' },
                  ] : chatSceneCategory === '文档处理' ? [
                    { icon: '📄', name: '文档摘要', desc: '快速提取文档核心要点' },
                    { icon: '🔍', name: '智能提取', desc: '从文档中提取结构化信息' },
                    { icon: '📋', name: '合同审阅', desc: '自动审阅合同条款与风险' },
                    { icon: '🗂️', name: '报告生成', desc: '基于文档内容生成分析报告' },
                  ] : chatSceneCategory === '语言翻译' ? [
                    { icon: '🌏', name: '中英互译', desc: '专业准确的中英文互译' },
                    { icon: '🇯🇵', name: '日韩翻译', desc: '日语、韩语精准翻译' },
                    { icon: '📖', name: '文学翻译', desc: '保留原文风格的文学翻译' },
                    { icon: '🔤', name: '术语翻译', desc: '专业术语精准对照翻译' },
                  ] : [
                    { icon: '🎨', name: '创意写作', desc: '激发创意，生成有趣故事与脚本' },
                    { icon: '💭', name: '头脑风暴', desc: '帮你快速产生大量创意想法' },
                    { icon: '🎭', name: '角色扮演', desc: '沉浸式情景对话体验' },
                    { icon: '🌈', name: '灵感画板', desc: '视觉化呈现创意与概念' },
                  ]).map(scene => (
                    <div
                      key={scene.name}
                      onClick={() => {
                        setInputValue(scene.desc);
                        editorRef.current?.focus();
                      }}
                      style={{
                        flex: '1 1 160px',
                        maxWidth: '200px',
                        padding: '14px 16px',
                        background: '#fff',
                        borderRadius: '10px',
                        border: '1px solid #e8e8e8',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#6366F1';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(99,102,241,0.12)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e8e8e8';
                        e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
                      }}
                    >
                      <div style={{ fontSize: '22px', marginBottom: '6px' }}>{scene.icon}</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a', marginBottom: '4px' }}>{scene.name}</div>
                      <div style={{ fontSize: '12px', color: '#888', lineHeight: 1.4 }}>{scene.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{
            marginTop: '24px',
            fontSize: '12px',
            color: '#999',
            textAlign: 'center'
          }}>
            以上内容为AI生成，不代表开发者立场，请勿删除或改变本段文本标识
          </div>
          </>
          ) : null}
        </Content>
      </Layout>

      {/* 新建群组Modal */}
      <Modal
        title="新建群组"
        open={showGroupModal}
        onOk={handleCreateGroup}
        onCancel={() => {
          setShowGroupModal(false);
          setGroupName('');
          setSelectedAgents([]);
        }}
        okText="创建"
        cancelText="取消"
        width={600}
        okButtonProps={{
          disabled: selectedAgents.length === 0,
          style: {
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            border: 'none'
          }
        }}
      >
        <div style={{ padding: '20px 0' }}>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
              群组名称
            </div>
            <Input
              placeholder="输入群名称（选填）"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              style={{ borderRadius: '8px' }}
              size="large"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
              智能体成员 <span style={{ color: '#ff4d4f' }}>*</span>
            </div>
            <TreeSelect
              showSearch
              treeCheckable
              placeholder="搜索并选择智能体（支持多选）"
              value={selectedAgents}
              onChange={setSelectedAgents}
              treeData={getAgentTreeData()}
              style={{ width: '100%' }}
              size="large"
              maxTagCount={3}
              treeDefaultExpandAll
              filterTreeNode={(input, treeNode) => {
                const title = treeNode.title as any;
                if (typeof title === 'string') {
                  return title.toLowerCase().includes(input.toLowerCase());
                }
                return false;
              }}
            />
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
              已选择 {selectedAgents.length} 个智能体
            </div>
          </div>

          {/* 已选择的智能体预览 */}
          {selectedAgents.length > 0 && (
            <div style={{
              padding: '16px',
              background: '#F9FAFB',
              borderRadius: '8px',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
                已选择的智能体:
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {selectedAgents.map(agentId => {
                  const agent = allAgents.find(a => a.id === agentId);
                  return agent ? (
                    <Tag
                      key={agent.id}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '12px',
                        background: `${agent.color}22`,
                        border: `1px solid ${agent.color}`,
                        color: agent.color,
                        fontSize: '13px'
                      }}
                    >
                      <span style={{ marginRight: '6px' }}>{agent.icon}</span>
                      {agent.name}
                    </Tag>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* 管理显示 Modal */}
      <Modal
        title="管理侧边栏显示"
        open={showManageDisplay}
        onCancel={() => setShowManageDisplay(false)}
        onOk={() => setShowManageDisplay(false)}
        width={600}
      >
        <div style={{ marginBottom: '16px' }}>
          <p style={{ color: '#666', marginBottom: '16px' }}>
            选择最多5个智能体显示在侧边栏快捷入口
          </p>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {allAgents.map(agent => (
              <div
                key={agent.id}
                onClick={() => {
                  if (pinnedAgentIds.includes(agent.id)) {
                    setPinnedAgentIds(pinnedAgentIds.filter(id => id !== agent.id));
                  } else if (pinnedAgentIds.length < 5) {
                    setPinnedAgentIds([...pinnedAgentIds, agent.id]);
                  } else {
                    message.warning('最多只能选择5个智能体');
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: `1px solid ${pinnedAgentIds.includes(agent.id) ? agent.color : '#f0f0f0'}`,
                  background: pinnedAgentIds.includes(agent.id) ? `${agent.color}10` : '#fff',
                  transition: 'all 0.3s'
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  background: `${agent.color}22`,
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}>
                  {agent.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{agent.name}</div>
                  <div style={{ fontSize: '12px', color: '#999' }}>{agent.category}</div>
                </div>
                {agent.isMultiAgent && (
                  <Tag color="#6366F1" style={{ margin: 0 }}>多智能体</Tag>
                )}
                {pinnedAgentIds.includes(agent.id) && (
                  <CheckCircleOutlined style={{ color: agent.color, fontSize: '20px' }} />
                )}
              </div>
            ))}
          </div>
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: '#f5f5f5',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#666'
          }}>
            已选择 {pinnedAgentIds.length}/5 个智能体
          </div>
        </div>
      </Modal>

      {/* OpenClaw 部署引导 Modal */}
      <Modal
        open={showOpenClawDeployModal}
        onCancel={() => setShowOpenClawDeployModal(false)}
        footer={null}
        width={480}
        centered
        closable={false}
        bodyStyle={{ padding: 0 }}
        style={{ borderRadius: '20px', overflow: 'hidden' }}
      >
        <div style={{
          background: 'linear-gradient(160deg, #1a1033 0%, #2d1b69 40%, #1e3a5f 100%)',
          padding: '0',
          borderRadius: '16px',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {/* 关闭按钮 */}
          <div
            onClick={() => setShowOpenClawDeployModal(false)}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff',
              fontSize: '14px',
              zIndex: 10,
            }}
          >
            ✕
          </div>

          {/* 顶部装饰光晕 */}
          <div style={{
            position: 'absolute',
            top: '-60px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* 主内容 */}
          <div style={{ padding: '48px 40px 40px', position: 'relative' }}>
            {/* 图标 */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '72px',
                height: '72px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                fontSize: '36px',
                boxShadow: '0 8px 32px rgba(99,102,241,0.5)',
                marginBottom: '4px',
              }}>
                🦞
              </div>
            </div>

            {/* 标题 */}
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                OpenClaw 部署指南
              </div>
            </div>

            {/* 分割线 */}
            <div style={{
              height: '1px',
              background: 'rgba(255,255,255,0.1)',
              margin: '24px 0',
            }} />

            {/* 部署步骤 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
              {[
                {
                  step: 'Step 1',
                  title: '选择模板',
                  desc: '点击下方「一键部署」，或在万卷后台 OpenClaw 中创建实例复制 OpenClaw 应用模板',
                },
                {
                  step: 'Step 2',
                  title: '开启对话',
                  desc: '在配置页右侧通过自然语言对话，测试 OpenClaw 连通性',
                },
                {
                  step: 'Step 3',
                  title: '一键部署上线',
                  desc: '按需进行消息渠道配置，完成上线',
                },
              ].map((item) => (
                <div key={item.step} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{
                    flexShrink: 0,
                    width: 'auto',
                    padding: '0 10px',
                    height: '26px',
                    borderRadius: '6px',
                    background: 'rgba(99,102,241,0.3)',
                    border: '1px solid rgba(99,102,241,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#a5b4fc',
                    letterSpacing: '0.5px',
                    whiteSpace: 'nowrap',
                  }}>
                    {item.step}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '2px' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.5' }}>
                      {item.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 行动按钮 */}
            <Button
              type="primary"
              block
              size="large"
              onClick={() => {
                setShowOpenClawDeployModal(false);
                setShowOpenClawCopyModal(true);
              }}
              style={{
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                border: 'none',
                fontSize: '15px',
                fontWeight: 600,
                boxShadow: '0 4px 20px rgba(99,102,241,0.5)',
              }}
            >
              一键部署你的 OpenClaw
            </Button>

            <div style={{
              textAlign: 'center',
              marginTop: '14px',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.3)',
            }}>
              部署完成后刷新页面即可使用
            </div>
          </div>
        </div>
      </Modal>

      {/* 创建副本 Modal */}
      <Modal
        open={showOpenClawCopyModal}
        onCancel={() => setShowOpenClawCopyModal(false)}
        footer={null}
        width={520}
        centered
        title={<span style={{ fontSize: '18px', fontWeight: 600 }}>创建副本</span>}
        closeIcon={<span style={{ fontSize: '16px', color: '#999' }}>×</span>}
      >
        {/* 提示说明 */}
        <div style={{
          background: '#f7f7f7',
          borderRadius: '10px',
          padding: '14px 16px',
          marginBottom: '24px',
          fontSize: '13px',
          color: '#999',
          lineHeight: '1.6',
        }}>
          提示：副本创建范围包含代码、压缩后的上下文、数据库/存储/变量的结构定义。不含具体数据及环境变量值。
        </div>

        {/* 应用名称 */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 500, color: '#333', marginBottom: '8px' }}>应用名称</div>
          <Input
            value={openClawCopyName}
            onChange={(e) => setOpenClawCopyName(e.target.value)}
            style={{ borderRadius: '10px', height: '42px', fontSize: '14px' }}
          />
        </div>

        {/* 应用介绍 */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '14px', fontWeight: 500, color: '#333', marginBottom: '8px' }}>应用介绍</div>
          <Input.TextArea
            value={openClawCopyDesc}
            onChange={(e) => setOpenClawCopyDesc(e.target.value)}
            rows={3}
            style={{ borderRadius: '10px', fontSize: '14px', resize: 'vertical' }}
          />
        </div>

        {/* 图标 */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '14px', fontWeight: 500, color: '#333', marginBottom: '12px' }}>图标</div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              cursor: 'pointer',
              border: '2px solid #6366F1',
            }}>
              🦞
            </div>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              border: '1.5px dashed #d9d9d9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#999',
              fontSize: '22px',
            }}>
              ✨
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button
            size="large"
            onClick={() => setShowOpenClawCopyModal(false)}
            style={{ borderRadius: '10px', minWidth: '88px' }}
          >
            取消
          </Button>
          <Button
            type="primary"
            size="large"
            onClick={() => {
              setShowOpenClawCopyModal(false);
              window.location.hash = 'openclaw-editor?mode=create';
            }}
            style={{
              borderRadius: '10px',
              minWidth: '88px',
              background: '#1a1a1a',
              borderColor: '#1a1a1a',
              fontWeight: 600,
            }}
          >
            确认
          </Button>
        </div>
      </Modal>


    </Layout>


      {/* 分享图片预览弹窗 */}
      {showShareImagePreview && shareImageDataUrl && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setShowShareImagePreview(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
          <div style={{
            position: 'relative', background: '#fff', borderRadius: 16,
            width: 560, maxWidth: '92vw',
            maxHeight: '88vh',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            overflow: 'hidden',
          }}>
            {/* 标题栏 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>分享图片预览</span>
              <button
                onClick={() => setShowShareImagePreview(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, color: '#999', cursor: 'pointer', lineHeight: 1, padding: '2px 6px' }}
              >×</button>
            </div>
            {/* 图片内容 */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              <img
                src={shareImageDataUrl}
                alt="分享预览"
                style={{ width: '100%', borderRadius: 10, border: '1px solid #f0f0f0', display: 'block' }}
              />
            </div>
            {/* 底部按钮 */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 10, flexShrink: 0 }}>
              <Button
                style={{ flex: 1, borderRadius: 10, height: 44, fontWeight: 500, fontSize: 14 }}
                icon={<CopyOutlined />}
                onClick={async () => {
                  try {
                    const res = await fetch(shareImageDataUrl);
                    const blob = await res.blob();
                    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                    message.success('图片已复制到剪贴板');
                  } catch {
                    message.warning('复制失败，请手动保存图片');
                  }
                }}
              >
                复制图片
              </Button>
              <Button
                type="primary"
                style={{ flex: 1, borderRadius: 10, height: 44, fontWeight: 600, fontSize: 14, background: '#1677ff', borderColor: '#1677ff' }}
                icon={<DownloadOutlined />}
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = shareImageDataUrl;
                  a.download = `对话分享_${Date.now()}.png`;
                  a.click();
                  message.success('图片已下载');
                }}
              >
                下载图片
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* 全局选中文字浮动工具栏 */}
      {selectionToolbar.visible && (
        <div
          style={{
            position: 'fixed',
            left: selectionToolbar.x,
            top: selectionToolbar.y,
            transform: 'translateX(-50%)',
            background: '#1a1a1a',
            borderRadius: 8,
            padding: '5px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            zIndex: 10000,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
          onMouseDown={e => e.preventDefault()}
        >
          {/* AI改写 */}
          <button
            onClick={() => { message.info('AI改写功能开发中'); setSelectionToolbar({visible:false,x:0,y:0}); }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: 'transparent', border: 'none', color: '#a78bfa', cursor: 'pointer', fontSize: 12, fontWeight: 600, borderRadius: 4 }}
          >
            ✦ AI改写
          </button>
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.15)', margin: '0 2px' }} />
          {/* T 文字样式 */}
          <Tooltip title="标题"><button onClick={() => applyFormat('formatBlock', 'h2')} style={{ padding: '3px 6px', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, borderRadius: 4 }}>T</button></Tooltip>
          {/* 对齐 */}
          <Tooltip title="居中对齐"><button onClick={() => applyFormat('justifyCenter')} style={{ padding: '3px 6px', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14, borderRadius: 4 }}>≡</button></Tooltip>
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.15)', margin: '0 2px' }} />
          {/* B 加粗 */}
          <Tooltip title="加粗"><button onClick={() => applyFormat('bold')} style={{ padding: '3px 6px', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, borderRadius: 4 }}>B</button></Tooltip>
          {/* S 删除线 */}
          <Tooltip title="删除线"><button onClick={() => applyFormat('strikeThrough')} style={{ padding: '3px 6px', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, borderRadius: 4, textDecoration: 'line-through' }}>S</button></Tooltip>
          {/* I 斜体 */}
          <Tooltip title="斜体"><button onClick={() => applyFormat('italic')} style={{ padding: '3px 6px', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, fontStyle: 'italic', borderRadius: 4 }}>I</button></Tooltip>
          {/* U 下划线 */}
          <Tooltip title="下划线"><button onClick={() => applyFormat('underline')} style={{ padding: '3px 6px', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, textDecoration: 'underline', borderRadius: 4 }}>U</button></Tooltip>
          {/* 链接 */}
          <Tooltip title="插入链接"><button onClick={() => { const url = prompt('输入链接 URL：'); if (url) applyFormat('createLink', url); }} style={{ padding: '3px 6px', background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: 13, borderRadius: 4 }}>🔗</button></Tooltip>
          {/* 代码 */}
          <Tooltip title="行内代码"><button onClick={() => applyFormat('formatBlock', 'pre')} style={{ padding: '3px 6px', background: 'transparent', border: 'none', color: '#34d399', cursor: 'pointer', fontSize: 11, fontFamily: 'monospace', borderRadius: 4 }}>{`</>`}</button></Tooltip>
          {/* A 文字颜色 */}
          <Tooltip title="高亮"><button onClick={() => applyFormat('backColor', '#FDE68A')} style={{ padding: '3px 6px', background: 'transparent', border: 'none', color: '#FBBF24', cursor: 'pointer', fontSize: 13, fontWeight: 700, borderRadius: 4 }}>A</button></Tooltip>
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.15)', margin: '0 2px' }} />
          {/* 复制 */}
          <Tooltip title="复制">
            <button
              onClick={() => {
                const sel = window.getSelection();
                if (sel) navigator.clipboard.writeText(sel.toString()).then(() => message.success('已复制'));
                setSelectionToolbar({visible:false,x:0,y:0});
              }}
              style={{ padding: '3px 7px', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12, borderRadius: 4 }}
            >
              复制
            </button>
          </Tooltip>
          {/* 评论 */}
          <Tooltip title="添加评论">
            <button
              onClick={() => {
                const sel = window.getSelection();
                const selectedText = sel ? sel.toString().trim() : '';
                if (selectedText) {
                  document.execCommand('backColor', false, '#FEF3C7');
                }
                setPendingComment({ selectedText });
                setShowDocComments(true);
                setSelectionToolbar({visible:false,x:0,y:0});
                setCommentInput('');
              }}
              style={{ padding: '3px 6px', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, borderRadius: 4 }}
            >
              💬
            </button>
          </Tooltip>
        </div>
      )}

      {/* 历史记录 Modal */}
      <Modal
        title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><HistoryOutlined style={{ color: '#6366F1' }} /><span>历史记录</span></div>}
        open={showHistoryModal}
        onCancel={() => setShowHistoryModal(false)}
        footer={null}
        width={480}
      >
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {docHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>暂无历史记录</div>
          ) : (
            [...docHistory].reverse().map((item, i) => {
              const idx = docHistory.length - 1 - i;
              const isCurrent = idx === docHistoryIndex;
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #f0f0f0', borderRadius: isCurrent ? 8 : 0, background: isCurrent ? '#F0F9FF' : 'transparent' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: isCurrent ? 600 : 400, color: '#1a1a1a' }}>{item.title || '未命名文档'}</div>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>版本 {idx + 1} · {item.content.length} 字{isCurrent ? ' · 当前版本' : ''}</div>
                  </div>
                  {isCurrent ? (
                    <span style={{ fontSize: 12, color: '#6366F1', background: '#EEF2FF', padding: '2px 8px', borderRadius: 10, fontWeight: 500 }}>当前</span>
                  ) : (
                    <Button size="small" onClick={() => {
                      setDocHistoryIndex(idx);
                      setDocTitle(item.title);
                      setDocContent(item.content);
                      setShowHistoryModal(false);
                      message.success('已恢复到该版本');
                    }} style={{ borderRadius: 6, fontSize: 12 }}>
                      恢复
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Modal>

      {/* 快捷键列表 Modal */}
      <Modal
        title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><KeyOutlined style={{ color: '#6366F1' }} /><span>快捷键列表</span></div>}
        open={showShortcutsModal}
        onCancel={() => setShowShortcutsModal(false)}
        footer={null}
        width={460}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {[
            { group: '文字格式', shortcuts: [
              { keys: ['Ctrl', 'B'], desc: '加粗' },
              { keys: ['Ctrl', 'I'], desc: '斜体' },
              { keys: ['Ctrl', 'U'], desc: '下划线' },
              { keys: ['Alt', 'Shift', 'S'], desc: '删除线' },
            ]},
            { group: '编辑操作', shortcuts: [
              { keys: ['Ctrl', 'Z'], desc: '撤销' },
              { keys: ['Ctrl', 'Y'], desc: '重做' },
              { keys: ['Ctrl', 'A'], desc: '全选' },
              { keys: ['Ctrl', 'C'], desc: '复制' },
              { keys: ['Ctrl', 'X'], desc: '剪切' },
              { keys: ['Ctrl', 'V'], desc: '粘贴' },
            ]},
            { group: '文档操作', shortcuts: [
              { keys: ['Ctrl', 'F'], desc: '查找和替换' },
              { keys: ['Ctrl', 'P'], desc: '打印' },
              { keys: ['Ctrl', 'S'], desc: '保存' },
            ]},
          ].map(group => (
            <div key={group.group} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>{group.group}</div>
              {group.shortcuts.map(s => (
                <div key={s.desc} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <span style={{ fontSize: 14, color: '#333' }}>{s.desc}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {s.keys.map((k, ki) => (
                      <span key={k}>
                        <kbd style={{ padding: '2px 8px', background: '#f5f5f5', borderRadius: 5, fontSize: 12, color: '#555', border: '1px solid #e0e0e0', fontFamily: 'inherit', boxShadow: '0 1px 0 #ccc' }}>{k}</kbd>
                        {ki < s.keys.length - 1 && <span style={{ margin: '0 2px', color: '#bbb', fontSize: 11 }}>+</span>}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Modal>

      {/* 提交反馈 Modal */}
      <Modal
        title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FormOutlined style={{ color: '#6366F1' }} /><span>提交反馈</span></div>}
        open={showFeedbackModal}
        onCancel={() => { setShowFeedbackModal(false); setFeedbackText(''); setFeedbackRating(null); }}
        onOk={() => {
          if (!feedbackText.trim()) { message.warning('请填写反馈内容'); return; }
          message.success('感谢您的反馈，我们会持续改进！');
          setShowFeedbackModal(false);
          setFeedbackText('');
          setFeedbackRating(null);
        }}
        okText="提交"
        cancelText="取消"
        okButtonProps={{ style: { background: '#6366F1', borderColor: '#6366F1' } }}
        width={460}
      >
        <div style={{ padding: '8px 0' }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 10 }}>您对文档编辑体验的评价</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['😞', '😐', '🙂', '😊', '🤩'].map((emoji, i) => (
                <button key={i} onClick={() => setFeedbackRating(i + 1)}
                  style={{ width: 44, height: 44, borderRadius: 8, border: feedbackRating === i + 1 ? '2px solid #6366F1' : '1px solid #e8e8e8', background: feedbackRating === i + 1 ? '#EEF2FF' : '#fafafa', fontSize: 22, cursor: 'pointer', transition: 'all 0.15s' }}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 4, fontSize: 13, color: '#666' }}>问题描述或建议</div>
          <textarea
            value={feedbackText}
            onChange={e => setFeedbackText(e.target.value)}
            placeholder="请描述您遇到的问题或改进建议..."
            style={{ width: '100%', height: 100, padding: '10px 12px', border: '1px solid #d9d9d9', borderRadius: 8, fontSize: 13, resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box' }}
          />
          <div style={{ fontSize: 12, color: '#bbb', textAlign: 'right', marginTop: 4 }}>{feedbackText.length}/500</div>
        </div>
      </Modal>

    </>
  );
};

export default Frontend;