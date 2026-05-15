import React, { useState } from 'react';
import {
  Table, Tag, Badge, Tabs, Tooltip, Select, Button,
  Space, Input, Drawer, Typography, Divider,
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, ClockCircleOutlined,
  CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined,
  RobotOutlined, ToolOutlined, BookOutlined, ThunderboltOutlined,
  BranchesOutlined, MessageOutlined, FilterOutlined,
  CodeOutlined, DatabaseOutlined, ApiOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

// ─── 类型定义 ────────────────────────────────────────────────────────────────

type SpanType = 'llm' | 'tool' | 'knowledge' | 'workflow' | 'agent' | 'message';
type StatusType = 'success' | 'failed' | 'running';
type TriggerType = 'manual' | 'api' | 'schedule' | 'webhook';

interface TraceSpan {
  spanId: string;
  parentSpanId?: string;
  traceId: string;
  name: string;
  type: SpanType;
  status: StatusType;
  startTime: number; // ms offset from trace start
  duration: number;  // ms
  depth: number;
  input?: string;
  output?: string;
  metadata?: Record<string, any>;
}

interface TraceRecord {
  traceId: string;
  agentName: string;
  trigger: TriggerType;
  status: StatusType;
  startTime: string;
  duration: number; // ms
  totalTokens: number;
  spans: TraceSpan[];
}

// ─── 颜色与图标配置 ──────────────────────────────────────────────────────────

const SPAN_CONFIG: Record<SpanType, { color: string; bgColor: string; borderColor: string; icon: React.ReactNode; label: string }> = {
  llm: {
    color: '#7C3AED', bgColor: '#EDE9FE', borderColor: '#C4B5FD',
    icon: <RobotOutlined />, label: 'LLM 调用',
  },
  tool: {
    color: '#D97706', bgColor: '#FEF3C7', borderColor: '#FCD34D',
    icon: <ToolOutlined />, label: '工具调用',
  },
  knowledge: {
    color: '#059669', bgColor: '#D1FAE5', borderColor: '#6EE7B7',
    icon: <BookOutlined />, label: '知识检索',
  },
  workflow: {
    color: '#2563EB', bgColor: '#DBEAFE', borderColor: '#93C5FD',
    icon: <ThunderboltOutlined />, label: '工作流节点',
  },
  agent: {
    color: '#4F46E5', bgColor: '#E0E7FF', borderColor: '#A5B4FC',
    icon: <BranchesOutlined />, label: '子 Agent',
  },
  message: {
    color: '#64748B', bgColor: '#F1F5F9', borderColor: '#CBD5E1',
    icon: <MessageOutlined />, label: '消息',
  },
};

const STATUS_CONFIG: Record<StatusType, { color: string; text: string; icon: React.ReactNode; tagColor: string }> = {
  success: { color: '#10B981', text: '成功', icon: <CheckCircleOutlined />, tagColor: 'success' },
  failed:  { color: '#EF4444', text: '失败', icon: <CloseCircleOutlined />, tagColor: 'error' },
  running: { color: '#6366F1', text: '运行中', icon: <LoadingOutlined />, tagColor: 'processing' },
};

const TRIGGER_CONFIG: Record<TriggerType, { text: string; color: string }> = {
  manual:   { text: '手动触发', color: 'blue' },
  api:      { text: 'API 调用', color: 'purple' },
  schedule: { text: '定时任务', color: 'orange' },
  webhook:  { text: 'Webhook', color: 'cyan' },
};

// ─── Mock 数据 ───────────────────────────────────────────────────────────────

const MOCK_TRACES: TraceRecord[] = [
  // 1. 竞品调研 Agent
  {
    traceId: 'trace-001-abc123',
    agentName: '竞品调研',
    trigger: 'manual',
    status: 'success',
    startTime: '2026-03-24 10:32:15',
    duration: 18420,
    totalTokens: 4872,
    spans: [
      {
        spanId: 's1', traceId: 'trace-001-abc123', parentSpanId: undefined,
        name: '竞品调研 Agent 启动', type: 'agent', status: 'success',
        startTime: 0, duration: 18420, depth: 0,
        input: '请帮我分析国内主要的 AI 对话产品竞争格局，重点关注 Kimi、文心一言、通义千问。',
        output: '竞品分析报告已完成，涵盖产品定位、技术特性、市场份额三个维度。',
        metadata: { agentVersion: 'v2.1.0', sessionId: 'sess-9f2a', model: 'claude-opus-4-5' },
      },
      {
        spanId: 's2', traceId: 'trace-001-abc123', parentSpanId: 's1',
        name: '用户意图理解', type: 'llm', status: 'success',
        startTime: 120, duration: 2340, depth: 1,
        input: `<system>你是一个专业的任务规划助手，请分析用户的意图并制定执行计划。</system>\n<user>请帮我分析国内主要的 AI 对话产品竞争格局，重点关注 Kimi、文心一言、通义千问。</user>`,
        output: `{
  "intent": "竞品分析",
  "targets": ["Kimi", "文心一言", "通义千问"],
  "dimensions": ["产品定位", "技术特性", "市场份额"],
  "plan": [
    "搜索各产品最新信息",
    "汇总分析数据",
    "生成对比报告"
  ]
}`,
        metadata: { model: 'claude-opus-4-5', promptTokens: 386, completionTokens: 142, totalTokens: 528, temperature: 0.3 },
      },
      {
        spanId: 's3', traceId: 'trace-001-abc123', parentSpanId: 's1',
        name: 'web_search: Kimi 产品特性', type: 'tool', status: 'success',
        startTime: 2500, duration: 3200, depth: 1,
        input: `{\n  "tool": "web_search",\n  "params": {\n    "query": "Kimi AI 对话产品 2026 技术特性 市场表现",\n    "max_results": 10\n  }\n}`,
        output: `{\n  "results": [\n    {"title": "Kimi 发布长文本理解新能力", "url": "...", "snippet": "月之暗面发布 Kimi 2.0，支持 200万 token 上下文..."},\n    {"title": "Kimi 用户规模突破 5000 万", "url": "...", "snippet": "2026年Q1 Kimi DAU 达 5000 万，增速领先..."},\n    {"title": "Kimi vs GPT-4 深度对比", "url": "...", "snippet": "在中文理解和长文档处理方面 Kimi 表现优异..."}\n  ]\n}`,
        metadata: { toolName: 'web_search', latency: 3200, resultCount: 10 },
      },
      {
        spanId: 's4', traceId: 'trace-001-abc123', parentSpanId: 's1',
        name: 'web_search: 文心一言分析', type: 'tool', status: 'success',
        startTime: 5800, duration: 2900, depth: 1,
        input: `{\n  "tool": "web_search",\n  "params": {\n    "query": "文心一言 ERNIE 4.0 2026 企业落地 竞争优势",\n    "max_results": 10\n  }\n}`,
        output: `{\n  "results": [\n    {"title": "百度文心一言 ERNIE 4.0 企业版发布", "snippet": "深度整合百度搜索、地图、文库生态..."},\n    {"title": "文心一言 B 端客户突破 10 万", "snippet": "百度智能云 AI 服务营收同比增长 48%..."}\n  ]\n}`,
        metadata: { toolName: 'web_search', latency: 2900, resultCount: 10 },
      },
      {
        spanId: 's5', traceId: 'trace-001-abc123', parentSpanId: 's1',
        name: 'web_search: 通义千问市场数据', type: 'tool', status: 'success',
        startTime: 8800, duration: 2600, depth: 1,
        input: `{\n  "tool": "web_search",\n  "params": {\n    "query": "通义千问 Qwen 3.0 2026 多模态 用户数据",\n    "max_results": 10\n  }\n}`,
        output: `{\n  "results": [\n    {"title": "阿里通义千问 Qwen 3.0 发布", "snippet": "支持图像、视频、音频多模态理解..."},\n    {"title": "通义 API 调用量突破百亿", "snippet": "企业开发者生态快速壮大..."}\n  ]\n}`,
        metadata: { toolName: 'web_search', latency: 2600, resultCount: 10 },
      },
      {
        spanId: 's6', traceId: 'trace-001-abc123', parentSpanId: 's1',
        name: '综合分析与报告生成', type: 'llm', status: 'success',
        startTime: 11600, duration: 6500, depth: 1,
        input: `基于以下搜索结果，生成一份专业的竞品分析报告：\n\n[Kimi 数据] ...\n[文心一言数据] ...\n[通义千问数据] ...\n\n请从产品定位、技术特性、市场份额三个维度进行对比分析。`,
        output: `## 国内 AI 对话产品竞争格局分析报告

### 一、产品定位对比
| 产品 | 定位 | 核心优势 |
|------|------|---------|
| Kimi | 长文本理解专家 | 200万 token 上下文，学术/法律文档 |
| 文心一言 | 企业智能助手 | 百度生态整合，B端落地能力 |
| 通义千问 | 多模态通用 | 图文音视频全模态，开发者生态 |

### 二、技术特性
- **Kimi**：全球最长上下文窗口，中文理解顶尖
- **文心一言**：知识增强，实时搜索，企业私有化部署
- **通义千问**：多模态领先，Qwen 系列开源模型

### 三、市场份额估算
- Kimi：DAU ~5000万，C端市占率约 31%
- 文心一言：企业客户 >10万，B端市占率约 38%
- 通义千问：API 调用量最大，开发者市场领先`,
        metadata: { model: 'claude-opus-4-5', promptTokens: 1842, completionTokens: 628, totalTokens: 2470, temperature: 0.7 },
      },
      {
        spanId: 's7', traceId: 'trace-001-abc123', parentSpanId: 's1',
        name: '输出消息', type: 'message', status: 'success',
        startTime: 18200, duration: 220, depth: 1,
        input: '生成最终回复',
        output: '已完成竞品分析报告，包含产品定位、技术特性和市场份额三个维度的详细对比。',
        metadata: { messageType: 'assistant', charCount: 1486 },
      },
    ],
  },

  // 2. 知识问答 RAG
  {
    traceId: 'trace-002-def456',
    agentName: '知识问答',
    trigger: 'api',
    status: 'success',
    startTime: '2026-03-24 10:15:42',
    duration: 5830,
    totalTokens: 1924,
    spans: [
      {
        spanId: 'k1', traceId: 'trace-002-def456', parentSpanId: undefined,
        name: '知识问答 RAG 流程', type: 'workflow', status: 'success',
        startTime: 0, duration: 5830, depth: 0,
        input: '万卷平台支持哪些类型的知识库文件格式？',
        output: '万卷平台支持 PDF、Word、Excel、Markdown、TXT 等格式，以及网页链接和 API 数据源。',
        metadata: { workflowId: 'wf-rag-std', version: 'v1.3' },
      },
      {
        spanId: 'k2', traceId: 'trace-002-def456', parentSpanId: 'k1',
        name: '查询改写', type: 'llm', status: 'success',
        startTime: 50, duration: 980, depth: 1,
        input: `<system>将用户问题改写为更适合向量检索的形式，保留关键实体。</system>\n<user>万卷平台支持哪些类型的知识库文件格式？</user>`,
        output: '万卷知识库 支持文件格式 类型 PDF Word Excel Markdown TXT 网页链接 API数据源',
        metadata: { model: 'claude-sonnet-4-5', promptTokens: 124, completionTokens: 38, totalTokens: 162 },
      },
      {
        spanId: 'k3', traceId: 'trace-002-def456', parentSpanId: 'k1',
        name: '向量检索: 万卷帮助文档', type: 'knowledge', status: 'success',
        startTime: 1050, duration: 1420, depth: 1,
        input: '万卷知识库 支持文件格式 类型 PDF Word Excel Markdown TXT 网页链接 API数据源',
        output: `检索到 5 个相关文档片段：
[chunk-1] 万卷平台知识库支持以下文件格式：PDF (.pdf)、Word (.docx, .doc)、Excel (.xlsx)...相关度: 0.94
[chunk-2] 除本地文件外，万卷还支持通过 URL 抓取网页内容作为知识来源...相关度: 0.87
[chunk-3] API 数据源连接器支持 REST API、GraphQL 两种接口协议...相关度: 0.82
[chunk-4] 文件大小限制：单个文件不超过 100MB，批量上传不超过 500MB...相关度: 0.76
[chunk-5] 知识库支持多语言内容，包括中文、英文、日文...相关度: 0.71`,
        metadata: { kbId: 'kb-wanjuan-docs', topK: 5, minScore: 0.7, embeddingModel: 'text-embedding-3-large' },
      },
      {
        spanId: 'k4', traceId: 'trace-002-def456', parentSpanId: 'k1',
        name: '生成回答', type: 'llm', status: 'success',
        startTime: 2510, duration: 3220, depth: 1,
        input: `基于以下参考文档，回答用户问题。

参考文档：
[chunk-1] 万卷平台知识库支持以下文件格式：PDF、Word、Excel...
[chunk-2] 除本地文件外，支持通过 URL 抓取网页内容...
[chunk-3] API 数据源支持 REST API、GraphQL...

用户问题：万卷平台支持哪些类型的知识库文件格式？`,
        output: `万卷平台支持多种知识库文件格式，具体如下：

**本地文件格式：**
- PDF (.pdf)
- Word 文档 (.docx, .doc)
- Excel 表格 (.xlsx, .xls)
- Markdown (.md)
- 纯文本 (.txt)

**在线数据源：**
- 网页链接（URL 抓取）
- REST API 接口
- GraphQL 接口

单个文件大小上限为 100MB，批量上传不超过 500MB。`,
        metadata: { model: 'claude-sonnet-4-5', promptTokens: 842, completionTokens: 186, totalTokens: 1028, temperature: 0.2 },
      },
    ],
  },

  // 3. 法务合同审查
  {
    traceId: 'trace-003-ghi789',
    agentName: '法务合同审查',
    trigger: 'api',
    status: 'success',
    startTime: '2026-03-24 09:58:03',
    duration: 34760,
    totalTokens: 9341,
    spans: [
      {
        spanId: 'l1', traceId: 'trace-003-ghi789', parentSpanId: undefined,
        name: '合同审查工作流', type: 'workflow', status: 'success',
        startTime: 0, duration: 34760, depth: 0,
        input: '请审查这份《软件开发服务协议》，重点关注违约责任条款和知识产权归属。',
        output: '审查完成，发现 3 处高风险条款，8 处需要关注的潜在风险，并提供了修改建议。',
        metadata: { workflowId: 'wf-legal-review', version: 'v2.0', fileType: 'PDF' },
      },
      {
        spanId: 'l2', traceId: 'trace-003-ghi789', parentSpanId: 'l1',
        name: 'pdf_reader: 提取合同文本', type: 'tool', status: 'success',
        startTime: 100, duration: 4200, depth: 1,
        input: `{\n  "tool": "pdf_reader",\n  "params": {\n    "file_path": "/uploads/contract-2026-0324.pdf",\n    "extract_mode": "full_text",\n    "preserve_layout": true\n  }\n}`,
        output: `{\n  "pages": 28,\n  "word_count": 8420,\n  "text": "软件开发服务协议\\n\\n甲方：XX科技有限公司\\n乙方：XX开发团队\\n\\n第一条 服务内容...第十二条 违约责任...第十五条 知识产权..."\n}`,
        metadata: { toolName: 'pdf_reader', pages: 28, wordCount: 8420, latency: 4200 },
      },
      {
        spanId: 'l3', traceId: 'trace-003-ghi789', parentSpanId: 'l1',
        name: '合同结构解析', type: 'llm', status: 'success',
        startTime: 4400, duration: 5100, depth: 1,
        input: '请解析以下合同的主要条款结构，提取关键条款编号和内容摘要：\n\n[合同全文 8420 字...]',
        output: `合同包含 18 个条款：
- 第1条：服务内容与交付物
- 第4条：项目周期与里程碑
- 第8条：费用与支付方式
- 第12条：违约责任 [重点]
- 第14条：保密条款
- 第15条：知识产权归属 [重点]
- 第17条：争议解决`,
        metadata: { model: 'claude-opus-4-5', promptTokens: 2840, completionTokens: 312, totalTokens: 3152 },
      },
      {
        spanId: 'l4', traceId: 'trace-003-ghi789', parentSpanId: 'l1',
        name: '违约责任条款审查', type: 'llm', status: 'success',
        startTime: 9600, duration: 6800, depth: 1,
        input: '请对第12条违约责任条款进行专业法律审查，识别潜在风险：\n\n第十二条 违约责任\n12.1 乙方逾期交付，每延迟一日按合同总额的1%支付违约金...\n12.2 甲方逾期付款，每延迟一日按欠付款项的0.1%支付利息...',
        output: `**风险评级：高**

发现以下问题：

1. **违约金上限缺失** [高风险]：12.1条款未设置违约金总额上限，可能导致乙方承担超额责任。建议增加"违约金总额不超过合同总价的30%"。

2. **甲乙方不对等** [中风险]：甲方逾期付款违约金(0.1%/日)远低于乙方交付违约金(1%/日)，条款明显不公平。

3. **不可抗力界定模糊** [中风险]：未明确不可抗力范围，建议参照《民法典》第180条进行明确列举。`,
        metadata: { model: 'claude-opus-4-5', promptTokens: 1680, completionTokens: 428, totalTokens: 2108 },
      },
      {
        spanId: 'l5', traceId: 'trace-003-ghi789', parentSpanId: 'l1',
        name: '知识产权条款审查', type: 'llm', status: 'success',
        startTime: 16600, duration: 7200, depth: 1,
        input: '请对第15条知识产权条款进行专业法律审查：\n\n第十五条 知识产权\n15.1 乙方在履行本协议过程中开发的所有成果，其知识产权归甲方所有...\n15.2 乙方不得将本项目成果用于其他商业项目...',
        output: `**风险评级：高**

1. **背景技术保护缺失** [高风险]：15.1条款将"所有成果"知识产权归甲方，可能覆盖乙方的预先存在技术（Pre-existing IP）。建议明确区分"项目定制成果"与"乙方既有技术"。

2. **竞业限制过宽** [高风险]：15.2条款限制乙方将"项目成果"用于"其他商业项目"，可能构成违法竞业限制。建议限定为"同类竞争项目"并明确时限（建议2年）。

3. **开源组件声明缺失** [中风险]：未声明开源许可证兼容性，建议增加开源组件清单条款。`,
        metadata: { model: 'claude-opus-4-5', promptTokens: 1560, completionTokens: 398, totalTokens: 1958 },
      },
      {
        spanId: 'l6', traceId: 'trace-003-ghi789', parentSpanId: 'l1',
        name: '知识库: 合同法律法规检索', type: 'knowledge', status: 'success',
        startTime: 23900, duration: 1680, depth: 1,
        input: '违约金上限 不可抗力界定 知识产权归属 竞业限制 民法典',
        output: `检索到 4 条相关法规：
[法规-1] 《民法典》第585条：违约金数额过高可申请减少...相关度: 0.96
[法规-2] 《民法典》第180条：不可抗力的认定标准...相关度: 0.91
[法规-3] 《著作权法》第17条：受雇创作的知识产权归属...相关度: 0.88
[法规-4] 最高法关于竞业限制时间合理性的司法解释...相关度: 0.84`,
        metadata: { kbId: 'kb-legal-laws', topK: 4, minScore: 0.8 },
      },
      {
        spanId: 'l7', traceId: 'trace-003-ghi789', parentSpanId: 'l1',
        name: '生成审查报告', type: 'llm', status: 'success',
        startTime: 25700, duration: 8800, depth: 1,
        input: '综合以上分析，生成完整的合同审查报告，包括风险清单���修改建议和优先级排序...',
        output: `# 《软件开发服务协议》审查报告

## 总体评价
合同整体结构合理，但在违约责任和知识产权条款存在较大风险，建议在签署前进行修改。

## 风险汇总
- 高风险：3 项
- 中风险：8 项
- 低风险：5 项

## 高优先级修改建议
1. 第12条：增加违约金总额上限条款（建议不超过合同总价30%）
2. 第15条：明确区分项目定制成果与乙方既有技术的知识产权归属
3. 第15条：将竞业限制范围从"其他商业项目"缩小为"同类竞争项目"，并设定2年时限

## 建议下一步行动
建议组织甲乙双方及法务顾问进行三方协商，重点针对上述3处高风险条款达成共识后再行签署。`,
        metadata: { model: 'claude-opus-4-5', promptTokens: 2486, completionTokens: 536, totalTokens: 3022 },
      },
    ],
  },

  // 4. 失败案例
  {
    traceId: 'trace-004-jkl012',
    agentName: '数据分析助手',
    trigger: 'webhook',
    status: 'failed',
    startTime: '2026-03-24 09:44:17',
    duration: 8120,
    totalTokens: 842,
    spans: [
      {
        spanId: 'f1', traceId: 'trace-004-jkl012', parentSpanId: undefined,
        name: '数据分析工作流', type: 'workflow', status: 'failed',
        startTime: 0, duration: 8120, depth: 0,
        input: '分析最近一个月的销售数据，生成趋势报告。',
        output: 'ERROR: 数据库连接超时，分析任务失败。',
        metadata: { workflowId: 'wf-data-analysis', errorCode: 'DB_TIMEOUT' },
      },
      {
        spanId: 'f2', traceId: 'trace-004-jkl012', parentSpanId: 'f1',
        name: '任务规划', type: 'llm', status: 'success',
        startTime: 80, duration: 1620, depth: 1,
        input: '分析最近一个月的销售数据，生成趋势报告。请制定分析计划。',
        output: '计划：1. 连接数据库查询销售数据 2. 计算同比环比指标 3. 生成趋势图表 4. 输出文字分析报告',
        metadata: { model: 'claude-sonnet-4-5', promptTokens: 312, completionTokens: 68, totalTokens: 380 },
      },
      {
        spanId: 'f3', traceId: 'trace-004-jkl012', parentSpanId: 'f1',
        name: 'db_query: 查询销售数据', type: 'tool', status: 'failed',
        startTime: 1780, duration: 6300, depth: 1,
        input: `{\n  "tool": "db_query",\n  "params": {\n    "connection": "mysql://prod-db-01:3306/sales",\n    "sql": "SELECT * FROM orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)",\n    "timeout": 6000\n  }\n}`,
        output: `{\n  "error": "ConnectionTimeoutError",\n  "message": "连接 prod-db-01:3306 超时，已等待 6000ms",\n  "code": "ETIMEDOUT",\n  "retries": 3\n}`,
        metadata: { toolName: 'db_query', latency: 6300, error: 'ETIMEDOUT', retries: 3 },
      },
      {
        spanId: 'f4', traceId: 'trace-004-jkl012', parentSpanId: 'f1',
        name: '错误处理', type: 'llm', status: 'success',
        startTime: 8080, duration: 40, depth: 1,
        input: '数据库连接失败，生成用户友好的错误提示。',
        output: '很抱歉，数据库服务暂时不可用（连接超时），请稍后再试或联系管理员检查数据库服务状态。',
        metadata: { model: 'claude-sonnet-4-5', promptTokens: 248, completionTokens: 58, totalTokens: 306 },
      },
    ],
  },

  // 5. 运行中的 Trace
  {
    traceId: 'trace-005-mno345',
    agentName: '市场报告生成',
    trigger: 'schedule',
    status: 'running',
    startTime: '2026-03-24 10:45:00',
    duration: 12600,
    totalTokens: 2180,
    spans: [
      {
        spanId: 'r1', traceId: 'trace-005-mno345', parentSpanId: undefined,
        name: '市场报告生成 Agent', type: 'agent', status: 'running',
        startTime: 0, duration: 12600, depth: 0,
        input: '生成 2026 年 Q1 AI 行业市场分析报告',
        output: '（运行中...）',
        metadata: { agentVersion: 'v1.5.0', reportType: 'quarterly' },
      },
      {
        spanId: 'r2', traceId: 'trace-005-mno345', parentSpanId: 'r1',
        name: '制定报告大纲', type: 'llm', status: 'success',
        startTime: 150, duration: 2100, depth: 1,
        input: '请为"2026 Q1 AI 行业市场分析报告"制定详细大纲。',
        output: '大纲包含：市场概览、主要玩家分析、融资动态、技术趋势、政策环境、Q2展望共六个章节。',
        metadata: { model: 'claude-opus-4-5', promptTokens: 286, completionTokens: 142, totalTokens: 428 },
      },
      {
        spanId: 'r3', traceId: 'trace-005-mno345', parentSpanId: 'r1',
        name: 'web_search: AI 行业 Q1 融资数据', type: 'tool', status: 'success',
        startTime: 2350, duration: 3400, depth: 1,
        input: '{\n  "tool": "web_search",\n  "query": "2026 Q1 AI 人工智能行业融资 投资 数据统计"\n}',
        output: '{\n  "results": [\n    {"title": "2026Q1 AI 赛道融资总额达 280 亿美元", "snippet": "..."},\n    {"title": "大模型基础设施投资创历史新高", "snippet": "..."}\n  ]\n}',
        metadata: { toolName: 'web_search', latency: 3400, resultCount: 15 },
      },
      {
        spanId: 'r4', traceId: 'trace-005-mno345', parentSpanId: 'r1',
        name: 'web_search: 主要厂商动态', type: 'tool', status: 'success',
        startTime: 5900, duration: 2800, depth: 1,
        input: '{\n  "tool": "web_search",\n  "query": "2026 Q1 OpenAI Anthropic Google AI 最新动态 产品发布"\n}',
        output: '{\n  "results": [\n    {"title": "OpenAI GPT-5 正式发布", "snippet": "..."},\n    {"title": "Anthropic Claude 4 系列覆盖全球 180 个国家", "snippet": "..."}\n  ]\n}',
        metadata: { toolName: 'web_search', latency: 2800, resultCount: 12 },
      },
      {
        spanId: 'r5', traceId: 'trace-005-mno345', parentSpanId: 'r1',
        name: '知识库: 行业研究报告', type: 'knowledge', status: 'success',
        startTime: 8800, duration: 1240, depth: 1,
        input: 'AI 行业 2026 市场规模 增长率 预测',
        output: '检索到 6 条相关研究报告片段，覆盖市场规模预测、竞争格局、技术成熟度等维度。',
        metadata: { kbId: 'kb-industry-research', topK: 6 },
      },
      {
        spanId: 'r6', traceId: 'trace-005-mno345', parentSpanId: 'r1',
        name: '生成报告正文（运行中）', type: 'llm', status: 'running',
        startTime: 10120, duration: 2480, depth: 1,
        input: '基于搜索结果和知识库数据，生成完整的市场分析报告...',
        output: '（生成中...）',
        metadata: { model: 'claude-opus-4-5', promptTokens: 2480, temperature: 0.6 },
      },
    ],
  },

  // 6. 快速成功案例（短 Trace）
  {
    traceId: 'trace-006-pqr678',
    agentName: '智能客服',
    trigger: 'api',
    status: 'success',
    startTime: '2026-03-24 10:38:55',
    duration: 2340,
    totalTokens: 512,
    spans: [
      {
        spanId: 'c1', traceId: 'trace-006-pqr678', parentSpanId: undefined,
        name: '智能客服 Agent', type: 'agent', status: 'success',
        startTime: 0, duration: 2340, depth: 0,
        input: '我的订单 #ORD-20260324-8891 什么时候能送到？',
        output: '您的订单 #ORD-20260324-8891 预计今天下午 16:00-18:00 送达，请保持手机畅通。',
        metadata: { agentVersion: 'v3.2.1', channel: 'web_chat' },
      },
      {
        spanId: 'c2', traceId: 'trace-006-pqr678', parentSpanId: 'c1',
        name: '意图识别', type: 'llm', status: 'success',
        startTime: 40, duration: 620, depth: 1,
        input: '<system>识别用户意图，返回 JSON 格式。</system>\n<user>我的订单 #ORD-20260324-8891 什么时候能送到？</user>',
        output: '{"intent": "order_tracking", "order_id": "ORD-20260324-8891", "confidence": 0.97}',
        metadata: { model: 'claude-sonnet-4-5', promptTokens: 98, completionTokens: 32, totalTokens: 130 },
      },
      {
        spanId: 'c3', traceId: 'trace-006-pqr678', parentSpanId: 'c1',
        name: 'order_api: 查询订单状态', type: 'tool', status: 'success',
        startTime: 700, duration: 980, depth: 1,
        input: '{\n  "tool": "order_api",\n  "params": {\n    "order_id": "ORD-20260324-8891",\n    "fields": ["status", "estimated_delivery", "courier", "tracking_number"]\n  }\n}',
        output: '{\n  "order_id": "ORD-20260324-8891",\n  "status": "in_transit",\n  "estimated_delivery": "2026-03-24 16:00-18:00",\n  "courier": "顺丰速运",\n  "tracking_number": "SF1234567890"\n}',
        metadata: { toolName: 'order_api', latency: 980, apiVersion: 'v2' },
      },
      {
        spanId: 'c4', traceId: 'trace-006-pqr678', parentSpanId: 'c1',
        name: '生成回复', type: 'llm', status: 'success',
        startTime: 1720, duration: 580, depth: 1,
        input: '用户询问订单 ORD-20260324-8891 状态。订单数据：状态=配送中，预计送达=今天16:00-18:00，快递=顺丰速运。请用友好语气回答。',
        output: '您的订单 #ORD-20260324-8891 已由顺丰速运揽收，预计今天下午 16:00-18:00 送达，请保持手机畅通。如需实时跟踪，运单号为 SF1234567890。',
        metadata: { model: 'claude-sonnet-4-5', promptTokens: 186, completionTokens: 62, totalTokens: 248 },
      },
    ],
  },

  // 7. 第二个失败案例（权限错误）
  {
    traceId: 'trace-007-stu901',
    agentName: '代码审查助手',
    trigger: 'webhook',
    status: 'failed',
    startTime: '2026-03-24 09:30:22',
    duration: 3460,
    totalTokens: 286,
    spans: [
      {
        spanId: 'e1', traceId: 'trace-007-stu901', parentSpanId: undefined,
        name: '代码审查工作流', type: 'workflow', status: 'failed',
        startTime: 0, duration: 3460, depth: 0,
        input: 'PR #442: 新增用户认证模块，请进行代码审查。',
        output: 'ERROR: 无权限访问 GitHub 仓库 acme-corp/backend。',
        metadata: { workflowId: 'wf-code-review', prId: 442 },
      },
      {
        spanId: 'e2', traceId: 'trace-007-stu901', parentSpanId: 'e1',
        name: 'github_api: 获取 PR 代码', type: 'tool', status: 'failed',
        startTime: 120, duration: 2840, depth: 1,
        input: '{\n  "tool": "github_api",\n  "params": {\n    "repo": "acme-corp/backend",\n    "pr_number": 442,\n    "action": "get_diff"\n  }\n}',
        output: '{\n  "error": "403 Forbidden",\n  "message": "Resource not accessible by integration. Token lacks repo scope.",\n  "documentation_url": "https://docs.github.com/rest"\n}',
        metadata: { toolName: 'github_api', statusCode: 403, error: 'PERMISSION_DENIED' },
      },
      {
        spanId: 'e3', traceId: 'trace-007-stu901', parentSpanId: 'e1',
        name: '错误诊断', type: 'llm', status: 'success',
        startTime: 3060, duration: 380, depth: 1,
        input: 'GitHub API 返回 403 错误，token 缺少 repo scope 权限。请生成诊断建议。',
        output: '诊断：GitHub Personal Access Token 未包含 repo 权限范围。解决方案：请在 GitHub Settings > Developer settings > Personal access tokens 中为 Token 添加 repo 权限，然后在万卷平台重新配置 GitHub 集成。',
        metadata: { model: 'claude-sonnet-4-5', promptTokens: 148, completionTokens: 82, totalTokens: 230 },
      },
    ],
  },
];

// ─── 工具函数 ────────────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}min`;
}

function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

// ─── 瀑布图组件 ──────────────────────────────────────────────────────────────

const WaterfallChart: React.FC<{
  spans: TraceSpan[];
  totalDuration: number;
  selectedSpanId: string | null;
  onSelectSpan: (span: TraceSpan) => void;
}> = ({ spans, totalDuration, selectedSpanId, onSelectSpan }) => {
  if (!spans.length) return null;

  return (
    <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
      {/* 时间刻度头部 */}
      <div style={{ display: 'flex', marginLeft: 260, marginBottom: 4, position: 'relative', height: 20 }}>
        {[0, 25, 50, 75, 100].map(pct => (
          <div
            key={pct}
            style={{
              position: 'absolute',
              left: `${pct}%`,
              color: '#94a3b8',
              fontSize: 10,
              transform: pct === 100 ? 'translateX(-100%)' : pct === 0 ? 'none' : 'translateX(-50%)',
            }}
          >
            {pct === 0 ? '0' : formatDuration(totalDuration * pct / 100)}
          </div>
        ))}
      </div>

      {/* 刻度线 */}
      <div style={{ display: 'flex', marginLeft: 260, marginBottom: 2, position: 'relative', height: 8 }}>
        {[0, 25, 50, 75, 100].map(pct => (
          <div
            key={pct}
            style={{
              position: 'absolute',
              left: `${pct}%`,
              top: 0,
              bottom: 0,
              width: 1,
              background: '#e2e8f0',
            }}
          />
        ))}
      </div>

      {/* Spans */}
      {spans.map(span => {
        const cfg = SPAN_CONFIG[span.type];
        const leftPct = totalDuration > 0 ? (span.startTime / totalDuration) * 100 : 0;
        const widthPct = totalDuration > 0 ? Math.max((span.duration / totalDuration) * 100, 0.5) : 0.5;
        const isSelected = selectedSpanId === span.spanId;

        return (
          <div
            key={span.spanId}
            onClick={() => onSelectSpan(span)}
            style={{
              display: 'flex',
              alignItems: 'center',
              height: 32,
              cursor: 'pointer',
              borderRadius: 4,
              background: isSelected ? '#f0f4ff' : 'transparent',
              border: isSelected ? '1px solid #c7d2fe' : '1px solid transparent',
              marginBottom: 2,
              transition: 'all 0.15s',
            }}
          >
            {/* 左侧：span 名称（缩进 + 图标） */}
            <div
              style={{
                width: 260,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                paddingRight: 8,
                paddingLeft: 8 + span.depth * 16,
                overflow: 'hidden',
              }}
            >
              <span
                style={{
                  color: cfg.color,
                  marginRight: 6,
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                {cfg.icon}
              </span>
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: '#334155',
                  fontSize: 12,
                  fontFamily: 'system-ui, sans-serif',
                }}
                title={span.name}
              >
                {span.name}
              </span>
            </div>

            {/* 右侧：瀑布条 */}
            <div style={{ flex: 1, position: 'relative', height: 20 }}>
              {/* 背景刻度线 */}
              {[25, 50, 75].map(pct => (
                <div
                  key={pct}
                  style={{
                    position: 'absolute',
                    left: `${pct}%`,
                    top: 0,
                    bottom: 0,
                    width: 1,
                    background: '#f1f5f9',
                    zIndex: 0,
                  }}
                />
              ))}

              {/* 瀑布条本体 */}
              <div
                style={{
                  position: 'absolute',
                  left: `${leftPct}%`,
                  width: `${widthPct}%`,
                  top: '10%',
                  height: '80%',
                  background: span.status === 'failed'
                    ? 'linear-gradient(90deg, #FEE2E2, #FECACA)'
                    : span.status === 'running'
                    ? `linear-gradient(90deg, ${cfg.bgColor}, ${cfg.color}33)`
                    : `linear-gradient(90deg, ${cfg.bgColor}, ${cfg.color}55)`,
                  borderRadius: 3,
                  border: `1.5px solid ${span.status === 'failed' ? '#FCA5A5' : cfg.borderColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: 4,
                  overflow: 'hidden',
                  zIndex: 1,
                  boxShadow: isSelected ? `0 0 0 2px ${cfg.color}44` : 'none',
                }}
              >
                <span
                  style={{
                    color: span.status === 'failed' ? '#DC2626' : cfg.color,
                    fontSize: 10,
                    whiteSpace: 'nowrap',
                    fontWeight: 600,
                    fontFamily: 'monospace',
                  }}
                >
                  {formatDuration(span.duration)}
                </span>
              </div>

              {/* 失败图标 */}
              {span.status === 'failed' && (
                <div
                  style={{
                    position: 'absolute',
                    left: `calc(${leftPct}% + ${widthPct}% + 4px)`,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#EF4444',
                    fontSize: 12,
                    zIndex: 2,
                  }}
                >
                  <CloseCircleOutlined />
                </div>
              )}

              {/* 运行中动画点 */}
              {span.status === 'running' && (
                <div
                  style={{
                    position: 'absolute',
                    left: `calc(${leftPct}% + ${widthPct}% + 4px)`,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#6366F1',
                    fontSize: 12,
                    zIndex: 2,
                  }}
                >
                  <LoadingOutlined spin />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Span 详情面板 ───────────────────────────────────────────────────────────

const SpanDetailPanel: React.FC<{ span: TraceSpan | null; onClose: () => void }> = ({ span, onClose }) => {
  const [activeTab, setActiveTab] = useState('input');

  if (!span) return null;
  const cfg = SPAN_CONFIG[span.type];

  const metaItems: Array<{ label: string; value: React.ReactNode }> = [
    { label: 'Span ID', value: <Text code copyable style={{ fontSize: 12 }}>{span.spanId}</Text> },
    { label: '类型', value: <Tag color={cfg.color} style={{ color: cfg.color, background: cfg.bgColor, borderColor: cfg.borderColor }}>{cfg.icon} {cfg.label}</Tag> },
    { label: '状态', value: <Badge status={span.status === 'success' ? 'success' : span.status === 'failed' ? 'error' : 'processing'} text={STATUS_CONFIG[span.status].text} /> },
    { label: '耗时', value: <Text strong style={{ color: cfg.color }}>{formatDuration(span.duration)}</Text> },
    { label: '开始偏移', value: `+${formatDuration(span.startTime)}` },
    { label: '嵌套深度', value: `Level ${span.depth}` },
    ...(span.parentSpanId ? [{ label: '父 Span', value: <Text code style={{ fontSize: 11 }}>{span.parentSpanId}</Text> }] : []),
    ...Object.entries(span.metadata || {}).map(([k, v]) => ({
      label: k,
      value: typeof v === 'object' ? JSON.stringify(v) : String(v),
    })),
  ];

  return (
    <div
      style={{
        borderTop: '1px solid #e2e8f0',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* 头部 */}
      <div
        style={{
          padding: '10px 16px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: cfg.color, fontSize: 16 }}>{cfg.icon}</span>
          <Text strong style={{ fontSize: 13, color: '#1e293b' }}>{span.name}</Text>
          <Tag
            style={{
              color: cfg.color,
              background: cfg.bgColor,
              borderColor: cfg.borderColor,
              fontSize: 11,
              margin: 0,
            }}
          >
            {cfg.label}
          </Tag>
          <Badge
            status={span.status === 'success' ? 'success' : span.status === 'failed' ? 'error' : 'processing'}
          />
        </div>
        <Button
          type="text"
          size="small"
          onClick={onClose}
          style={{ color: '#94a3b8', fontWeight: 600, fontSize: 16, lineHeight: 1 }}
        >
          ×
        </Button>
      </div>

      {/* Tabs */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="small"
          style={{ padding: '0 16px' }}
          tabBarStyle={{ marginBottom: 0 }}
          items={[
            {
              key: 'input',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ApiOutlined style={{ fontSize: 12 }} /> 输入
                </span>
              ),
              children: (
                <div style={{ padding: '12px 0', overflowY: 'auto', maxHeight: 280 }}>
                  {span.input ? (
                    <pre
                      style={{
                        background: '#0f172a',
                        color: '#e2e8f0',
                        padding: '12px 14px',
                        borderRadius: 8,
                        fontSize: 12,
                        lineHeight: 1.7,
                        overflowX: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        margin: 0,
                        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                      }}
                    >
                      {span.input}
                    </pre>
                  ) : (
                    <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 13 }}>（无输入内容）</div>
                  )}
                </div>
              ),
            },
            {
              key: 'output',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CodeOutlined style={{ fontSize: 12 }} /> 输出
                </span>
              ),
              children: (
                <div style={{ padding: '12px 0', overflowY: 'auto', maxHeight: 280 }}>
                  {span.output ? (
                    <pre
                      style={{
                        background: span.status === 'failed' ? '#1a0000' : '#0f172a',
                        color: span.status === 'failed' ? '#fca5a5' : '#e2e8f0',
                        padding: '12px 14px',
                        borderRadius: 8,
                        fontSize: 12,
                        lineHeight: 1.7,
                        overflowX: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        margin: 0,
                        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                        border: span.status === 'failed' ? '1px solid #7f1d1d' : 'none',
                      }}
                    >
                      {span.output}
                    </pre>
                  ) : (
                    <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 13 }}>（无输出内容）</div>
                  )}
                </div>
              ),
            },
            {
              key: 'metadata',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <DatabaseOutlined style={{ fontSize: 12 }} /> 元数据
                </span>
              ),
              children: (
                <div style={{ padding: '12px 0', overflowY: 'auto', maxHeight: 280 }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '120px 1fr',
                      gap: '6px 12px',
                      fontSize: 12,
                    }}
                  >
                    {metaItems.map((item, idx) => (
                      <React.Fragment key={idx}>
                        <span style={{ color: '#64748b', fontWeight: 500, paddingTop: 2 }}>{item.label}</span>
                        <span style={{ color: '#1e293b', wordBreak: 'break-all' }}>{item.value}</span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
};

// ─── Trace 详情抽屉 ──────────────────────────────────────────────────────────

const TraceDetailDrawer: React.FC<{
  trace: TraceRecord | null;
  open: boolean;
  onClose: () => void;
}> = ({ trace, open, onClose }) => {
  const [selectedSpan, setSelectedSpan] = useState<TraceSpan | null>(null);

  if (!trace) return null;

  const statusCfg = STATUS_CONFIG[trace.status];
  const triggerCfg = TRIGGER_CONFIG[trace.trigger];

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ClockCircleOutlined style={{ color: '#fff', fontSize: 16 }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>{trace.agentName}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{trace.traceId}</div>
          </div>
        </div>
      }
      open={open}
      onClose={() => { onClose(); setSelectedSpan(null); }}
      width={900}
      styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}
    >
      {/* 概览条 */}
      <div
        style={{
          padding: '12px 20px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          flexShrink: 0,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: statusCfg.color, fontSize: 14 }}>{statusCfg.icon}</span>
          <Text style={{ fontSize: 13, color: statusCfg.color, fontWeight: 600 }}>{statusCfg.text}</Text>
        </div>
        <Divider type="vertical" style={{ margin: 0 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ClockCircleOutlined style={{ color: '#94a3b8', fontSize: 12 }} />
          <Text style={{ fontSize: 13, color: '#475569' }}>{formatDuration(trace.duration)}</Text>
        </div>
        <Divider type="vertical" style={{ margin: 0 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>Token</span>
          <Text strong style={{ fontSize: 13, color: '#6366F1' }}>{formatTokens(trace.totalTokens)}</Text>
        </div>
        <Divider type="vertical" style={{ margin: 0 }} />
        <Tag color={triggerCfg.color} style={{ margin: 0 }}>{triggerCfg.text}</Tag>
        <Divider type="vertical" style={{ margin: 0 }} />
        <Text style={{ fontSize: 12, color: '#94a3b8' }}>{trace.startTime}</Text>
        <Divider type="vertical" style={{ margin: 0 }} />
        <Text style={{ fontSize: 12, color: '#64748b' }}>{trace.spans.length} 个 Spans</Text>
      </div>

      {/* Span 类型图例 */}
      <div
        style={{
          padding: '8px 20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          flexShrink: 0,
          background: '#fff',
        }}
      >
        {(Object.entries(SPAN_CONFIG) as [SpanType, typeof SPAN_CONFIG[SpanType]][]).map(([type, cfg]) => {
          const count = trace.spans.filter(s => s.type === type).length;
          if (count === 0) return null;
          return (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748b' }}>
              <span style={{ color: cfg.color }}>{cfg.icon}</span>
              <span>{cfg.label}</span>
              <span style={{ background: cfg.bgColor, color: cfg.color, borderRadius: 10, padding: '0 5px', fontWeight: 600, fontSize: 10 }}>
                {count}
              </span>
            </div>
          );
        })}
      </div>

      {/* 瀑布图区域 */}
      <div
        style={{
          flex: selectedSpan ? '0 0 auto' : '1 1 auto',
          overflowY: 'auto',
          padding: '12px 20px',
          borderBottom: selectedSpan ? '1px solid #e2e8f0' : 'none',
          maxHeight: selectedSpan ? '45%' : '100%',
        }}
      >
        <WaterfallChart
          spans={trace.spans}
          totalDuration={trace.duration}
          selectedSpanId={selectedSpan?.spanId || null}
          onSelectSpan={(span) => {
            setSelectedSpan(prev => prev?.spanId === span.spanId ? null : span);
          }}
        />
      </div>

      {/* Span 详情面板 */}
      {selectedSpan && (
        <div style={{ flex: '1 1 auto', overflow: 'hidden', minHeight: 0 }}>
          <SpanDetailPanel span={selectedSpan} onClose={() => setSelectedSpan(null)} />
        </div>
      )}
    </Drawer>
  );
};

// ─── 主页面组件 ──────────────────────────────────────────────────────────────

export const Trace: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusType | 'all'>('all');
  const [triggerFilter, setTriggerFilter] = useState<TriggerType | 'all'>('all');
  const [selectedTrace, setSelectedTrace] = useState<TraceRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 过滤逻辑
  const filtered = MOCK_TRACES.filter(t => {
    const matchSearch = !search ||
      t.traceId.toLowerCase().includes(search.toLowerCase()) ||
      t.agentName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchTrigger = triggerFilter === 'all' || t.trigger === triggerFilter;
    return matchSearch && matchStatus && matchTrigger;
  });

  const handleRowClick = (trace: TraceRecord) => {
    setSelectedTrace(trace);
    setDrawerOpen(true);
  };

  const columns: ColumnsType<TraceRecord> = [
    {
      title: 'Trace ID',
      dataIndex: 'traceId',
      width: 200,
      render: (id: string) => (
        <Tooltip title={id}>
          <Text
            code
            copyable={{ text: id }}
            style={{ fontSize: 11, cursor: 'pointer', color: '#6366F1' }}
          >
            {id.slice(0, 18)}…
          </Text>
        </Tooltip>
      ),
    },
    {
      title: 'Agent / 工作流',
      dataIndex: 'agentName',
      width: 160,
      render: (name: string) => (
        <Text strong style={{ color: '#1e293b', fontSize: 13 }}>{name}</Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: StatusType) => {
        const cfg = STATUS_CONFIG[status];
        return (
          <Badge
            status={status === 'success' ? 'success' : status === 'failed' ? 'error' : 'processing'}
            text={
              <span style={{ color: cfg.color, fontWeight: 500, fontSize: 12 }}>
                {cfg.text}
              </span>
            }
          />
        );
      },
    },
    {
      title: '耗时',
      dataIndex: 'duration',
      width: 100,
      sorter: (a, b) => a.duration - b.duration,
      render: (d: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ClockCircleOutlined style={{ color: '#94a3b8', fontSize: 12 }} />
          <Text style={{ fontSize: 13, color: '#475569', fontFamily: 'monospace' }}>
            {formatDuration(d)}
          </Text>
        </div>
      ),
    },
    {
      title: 'Token 用量',
      dataIndex: 'totalTokens',
      width: 110,
      sorter: (a, b) => a.totalTokens - b.totalTokens,
      render: (tokens: number) => (
        <Text style={{ fontSize: 13, color: '#6366F1', fontFamily: 'monospace', fontWeight: 600 }}>
          {formatTokens(tokens)}
        </Text>
      ),
    },
    {
      title: '触发方式',
      dataIndex: 'trigger',
      width: 120,
      render: (trigger: TriggerType) => {
        const cfg = TRIGGER_CONFIG[trigger];
        return <Tag color={cfg.color} style={{ fontSize: 11 }}>{cfg.text}</Tag>;
      },
    },
    {
      title: 'Spans',
      width: 80,
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 3 }}>
          {(['llm', 'tool', 'knowledge', 'workflow', 'agent', 'message'] as SpanType[]).map(type => {
            const count = record.spans.filter(s => s.type === type).length;
            if (count === 0) return null;
            const cfg = SPAN_CONFIG[type];
            return (
              <Tooltip key={type} title={`${cfg.label}: ${count}`}>
                <span style={{ color: cfg.color, fontSize: 12 }}>{cfg.icon}</span>
              </Tooltip>
            );
          })}
        </div>
      ),
    },
    {
      title: '时间',
      dataIndex: 'startTime',
      width: 160,
      render: (t: string) => (
        <Text style={{ fontSize: 12, color: '#94a3b8' }}>{t}</Text>
      ),
    },
    {
      title: '操作',
      width: 80,
      fixed: 'right' as const,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          style={{ color: '#6366F1', padding: 0, fontSize: 12 }}
          onClick={(e) => { e.stopPropagation(); handleRowClick(record); }}
        >
          查看详情
        </Button>
      ),
    },
  ];

  // 统计卡片数据
  const stats = {
    total: MOCK_TRACES.length,
    success: MOCK_TRACES.filter(t => t.status === 'success').length,
    failed: MOCK_TRACES.filter(t => t.status === 'failed').length,
    running: MOCK_TRACES.filter(t => t.status === 'running').length,
    avgTokens: Math.round(MOCK_TRACES.reduce((s, t) => s + t.totalTokens, 0) / MOCK_TRACES.length),
    avgDuration: Math.round(MOCK_TRACES.reduce((s, t) => s + t.duration, 0) / MOCK_TRACES.length),
  };

  return (
    <div style={{ padding: '0 0 24px' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1e293b' }}>Trace 链路追踪</h1>
        <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14 }}>
          查看 Agent / 工作流的完整执行链路，分析每个步骤的耗时、Token 用量及输入输出。
        </p>
      </div>

      {/* 统计卡片 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {[
          { label: '总执行次数', value: stats.total, color: '#6366F1', bg: '#EDE9FE', icon: <ClockCircleOutlined /> },
          { label: '成功', value: stats.success, color: '#10B981', bg: '#D1FAE5', icon: <CheckCircleOutlined /> },
          { label: '失败', value: stats.failed, color: '#EF4444', bg: '#FEE2E2', icon: <CloseCircleOutlined /> },
          { label: '运行中', value: stats.running, color: '#6366F1', bg: '#EDE9FE', icon: <LoadingOutlined /> },
          { label: '平均耗时', value: formatDuration(stats.avgDuration), color: '#D97706', bg: '#FEF3C7', icon: <ClockCircleOutlined /> },
          { label: '平均 Token', value: formatTokens(stats.avgTokens), color: '#2563EB', bg: '#DBEAFE', icon: <DatabaseOutlined /> },
        ].map((item, idx) => (
          <div
            key={idx}
            style={{
              background: '#fff',
              border: '1px solid #f0f0f0',
              borderRadius: 10,
              padding: '14px 16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>{item.label}</span>
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: item.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: item.color,
                  fontSize: 13,
                }}
              >
                {item.icon}
              </span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: item.color, fontFamily: 'monospace' }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* 过滤器 + 搜索栏 */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #f0f0f0',
          borderRadius: 10,
          padding: '14px 16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <FilterOutlined style={{ color: '#94a3b8' }} />
        <Input
          placeholder="搜索 Trace ID 或 Agent 名称"
          prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
          value={search}
          onChange={e => setSearch(e.target.value)}
          allowClear
          style={{ width: 280 }}
        />
        <Select
          value={statusFilter}
          onChange={v => setStatusFilter(v)}
          style={{ width: 120 }}
          options={[
            { value: 'all', label: '全部状态' },
            { value: 'success', label: '成功' },
            { value: 'failed', label: '失败' },
            { value: 'running', label: '运行中' },
          ]}
        />
        <Select
          value={triggerFilter}
          onChange={v => setTriggerFilter(v)}
          style={{ width: 130 }}
          options={[
            { value: 'all', label: '全部触发' },
            { value: 'manual', label: '手动触发' },
            { value: 'api', label: 'API 调用' },
            { value: 'schedule', label: '定时任务' },
            { value: 'webhook', label: 'Webhook' },
          ]}
        />
        <Button
          icon={<ReloadOutlined />}
          onClick={() => { setSearch(''); setStatusFilter('all'); setTriggerFilter('all'); }}
        >
          重置
        </Button>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#94a3b8' }}>
          共 {filtered.length} 条记录
        </div>
      </div>

      {/* Trace 列表 */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #f0f0f0',
          borderRadius: 10,
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <Table<TraceRecord>
          rowKey="traceId"
          dataSource={filtered}
          columns={columns}
          size="middle"
          scroll={{ x: 'max-content' }}
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            style: { cursor: 'pointer' },
          })}
          rowClassName={(record) =>
            selectedTrace?.traceId === record.traceId ? 'trace-row-selected' : ''
          }
          pagination={{
            pageSize: 10,
            showTotal: total => `共 ${total} 条`,
            showSizeChanger: true,
          }}
          locale={{ emptyText: '暂无 Trace 数据，请调整过滤条件。' }}
        />
      </div>

      {/* Span 类型图例说明 */}
      <div
        style={{
          marginTop: 16,
          padding: '12px 16px',
          background: '#fff',
          border: '1px solid #f0f0f0',
          borderRadius: 10,
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 12, color: '#94a3b8', flexShrink: 0 }}>Span 类型：</span>
        {(Object.entries(SPAN_CONFIG) as [SpanType, typeof SPAN_CONFIG[SpanType]][]).map(([, cfg]) => (
          <div
            key={cfg.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 12,
              padding: '3px 10px',
              borderRadius: 20,
              background: cfg.bgColor,
              color: cfg.color,
              border: `1px solid ${cfg.borderColor}`,
            }}
          >
            {cfg.icon}
            <span style={{ fontWeight: 500 }}>{cfg.label}</span>
          </div>
        ))}
      </div>

      {/* Trace 详情 Drawer */}
      <TraceDetailDrawer
        trace={selectedTrace}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedTrace(null); }}
      />

      {/* 行选中样式注入 */}
      <style>{`
        .trace-row-selected > td {
          background: #f5f3ff !important;
        }
        .ant-table-row:hover > td {
          background: #fafafe !important;
        }
      `}</style>
    </div>
  );
};

export default Trace;
