import React, { useState, useRef, useEffect } from 'react';
import { employeeStore, EmployeeRecord } from '../store/employeeStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  time: string;
  empId?: string;
  empName?: string;
  kind?: 'normal' | 'step' | 'tool-call' | 'human-pending';
  toolCard?: {
    toolName: string;
    request: string;
    response: string;
  };
}

interface TaskStep {
  id: string;
  name: string;
  status: 'done' | 'running' | 'waiting' | 'failed';
  desc?: string;
  time?: string;
  output?: string;
}

interface TaskItem {
  id: string;
  title: string;
  status: string;
  time: string;
  duration?: string;
  result?: string;
  steps: TaskStep[];
}

// ─── Mock Tasks (mirrors Frontend.tsx MOCK_TASKS) ─────────────────────────────
const MOCK_TASKS: Record<string, TaskItem[]> = {
  'de-001': [
    {
      id: 't1', title: '合同风险条款审查 — 供应商协议 v3.pdf', status: 'done',
      time: '10:32', duration: '2m 14s', result: '发现 3 处高风险条款，已生成审查报告',
      steps: [
        { id: 's1', name: '文档解析', status: 'done', desc: '调用 PDF 解析引擎提取全文结构', time: '10:32:01', output: '共提取 47 页，12,340 字，识别到 23 个条款段落' },
        { id: 's2', name: '合规规则匹配', status: 'done', desc: '逐条检索合规知识库规则', time: '10:32:08', output: '命中规则库 312 条，完成条款交叉映射' },
        { id: 's3', name: '风险识别', status: 'done', desc: 'AI 分析高风险语义模式，标注异常条款', time: '10:32:18', output: '识别出 3 处高风险：违约责任上限条款、单方解约权条款、数据归属模糊条款' },
        { id: 's4', name: '报告生成', status: 'done', desc: '生成结构化审查报告并写入飞书文档', time: '10:34:15', output: '审查报告已生成，含风险等级标注与修改建议，已推送给法务负责人' },
      ],
    },
    {
      id: 't2', title: '数据保护协议合规核查', status: 'running',
      time: '14:05',
      steps: [
        { id: 's1', name: '条款提取', status: 'done', desc: '提取协议全文条款', time: '14:05:10', output: '提取 28 个条款段落' },
        { id: 's2', name: '法规比对', status: 'running', desc: '与《个人信息保护法》进行比对', time: '14:05:45' },
        { id: 's3', name: '风险报告', status: 'waiting', desc: '生成合规差距报告' },
      ],
    },
  ],
  'de-002': [
    {
      id: 't1', title: '高级产品经理岗位简历筛选', status: 'done',
      time: '09:15', duration: '3m 45s', result: '筛选 23 份，高匹配 5 份',
      steps: [
        { id: 's1', name: '简历解析', status: 'done', desc: '批量解析上传简历', time: '09:15:02', output: '成功解析 23 份简历' },
        { id: 's2', name: '岗位匹配', status: 'done', desc: '与岗位要求进行多维匹配', time: '09:16:10', output: '完成技能、经验、学历三维评分' },
        { id: 's3', name: '候选人排序', status: 'done', desc: '输出排序候选人名单', time: '09:18:47', output: '高匹配 5 人，中匹配 11 人，不匹配 7 人' },
      ],
    },
  ],
  'de-007': [
    {
      id: 't-701', title: 'KM-204 光纤振动预警研判', status: 'done',
      time: '09:28', duration: '8m 32s', result: '确认为车辆过境，二级预警，工单已派发',
      steps: [
        { id: 's1', name: '信号采集', status: 'done', desc: '采集 KM-204 传感器光纤振动信号', time: '09:28:08', output: '采集到异常振动信号，频率 42Hz' },
        { id: 's2', name: '模式识别', status: 'done', desc: 'AI 分析振动特征，判断事件类型', time: '09:28:15', output: '识别为车辆穿行+伴行复合报警' },
        { id: 's3', name: '视频联动核查', status: 'done', desc: '调取 CAM-140 摄像机画面核实', time: '09:29:00', output: '视频确认为车辆过境，无施工作业' },
        { id: 's4', name: '工单派发', status: 'done', desc: '自动生成并派发巡护工单', time: '09:36:40', output: '工单 WO-2026-0422-047 已派发维修队A' },
      ],
    },
    {
      id: 't-702', title: 'B区压缩机例行巡检', status: 'running',
      time: '10:15',
      steps: [
        { id: 's1', name: '设备状态读取', status: 'done', desc: '读取压缩机实时运行参数', time: '10:15:10', output: '温度 68°C，压力 2.3MPa，均在正常范围' },
        { id: 's2', name: '异常判断', status: 'running', desc: 'AI 分析运行参数趋势', time: '10:15:45' },
        { id: 's3', name: '巡检报告', status: 'waiting', desc: '生成巡检记录并归档' },
      ],
    },
  ],
  'de-009': [
    {
      id: 't-901', title: '供应商框架协议审核 — 华为技术', status: 'running',
      time: '14:02',
      steps: [
        { id: 's1', name: '文档解析', status: 'done', desc: '解析合同 PDF 结构', time: '14:02:10', output: '18 页，31 条款，12,480 字' },
        { id: 's2', name: '规则匹配', status: 'done', desc: '检索法务规则库', time: '14:03:05', output: '命中 47 条规则，发现 2 处高风险' },
        { id: 's3', name: '人工确认', status: 'running', desc: '等待高风险条款人工确认', time: '14:04:20' },
        { id: 's4', name: '报告生成', status: 'waiting', desc: '生成完整审核报告' },
      ],
    },
    {
      id: 't-902', title: '新入职劳动合同批量审核（8份）', status: 'running',
      time: '13:30',
      steps: [
        { id: 's1', name: '批量解析', status: 'done', desc: '批量解析 8 份劳动合同', time: '13:30:15', output: '8 份解析成功' },
        { id: 's2', name: '合规分析', status: 'running', desc: '分析试用期、竞业限制等条款', time: '13:32:00' },
        { id: 's3', name: '问题汇总', status: 'waiting', desc: '汇总合规问题并生成报告' },
      ],
    },
  ],
};

// ─── Employee fallback data ───────────────────────────────────────────────────
const EMPLOYEE_META: Record<string, { avatar: string; avatarBg: string; domain: string; greeting: string }> = {
  'de-001': { avatar: '法', avatarBg: '#6366F1', domain: '法务域', greeting: '您好！我是法务合规助手，可以帮您进行合同分析、法规查询和合规风险评估。请问有什么可以帮您的？' },
  'de-002': { avatar: 'H', avatarBg: '#F59E0B', domain: '人力域', greeting: '你好！我是 HR 招聘助手，可以帮你筛选简历、安排面试、查询岗位信息。有什么需要帮忙的吗？' },
  'de-007': { avatar: '智', avatarBg: '#8B5CF6', domain: '管道安全域', greeting: '您好，我是智能巡检助手。当前所有监控设备运行正常。请问需要查询哪条管线的状态，或者需要发起巡检任务？' },
  'de-009': { avatar: '合', avatarBg: '#EF4444', domain: '法务域', greeting: '您好！我是合同审核助手，支持合同全文解析、风险条款识别与法律依据匹配。请上传需要审核的合同文件或直接描述审核需求。' },
};
const DEFAULT_META = { avatar: 'AI', avatarBg: '#6366F1', domain: '通用域', greeting: '您好！有什么可以帮您的？' };

// ─── Status config (same as DigitalEmployeePanel) ────���───────────────────────
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

// ─── Component ────────────────────────────────────────────────────────────────
interface DigitalEmployeeH5Props {
  employeeId?: string;
}

const DigitalEmployeeH5: React.FC<DigitalEmployeeH5Props> = ({ employeeId }) => {
  const empId = employeeId || 'de-009';

  // Resolve employee from store or fallback
  const allEmployees = employeeStore.getEmployees().filter((e: EmployeeRecord) => e.status === 'published');
  const storeEmp = allEmployees.find((e: EmployeeRecord) => e.id === empId);
  const meta = EMPLOYEE_META[empId] || DEFAULT_META;
  const empName = storeEmp?.name || meta.avatar;
  const empColor = meta.avatarBg;

  const getTime = () => new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  // ── Tab ────────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'chat' | 'tasks'>('chat');

  // ── Chat state ─────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'init', role: 'bot', text: meta.greeting, time: getTime(), empId, empName, kind: 'normal' },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [toolCardOpen, setToolCardOpen] = useState<Record<string, { req: boolean; res: boolean }>>({});

  // ── HITL state (de-009 agent flow) ────────────────────────────────────────
  const [agentPendingMsgId, setAgentPendingMsgId] = useState<string | null>(null);
  const [agentReviewChoice, setAgentReviewChoice] = useState('');
  const [agentReviewSupplement, setAgentReviewSupplement] = useState('');
  const agentReviewChoiceRef = useRef('');
  const agentReviewSupplementRef = useRef('');
  const agentContinueFnRef = useRef<(() => void) | null>(null);
  useEffect(() => { agentReviewChoiceRef.current = agentReviewChoice; }, [agentReviewChoice]);
  useEffect(() => { agentReviewSupplementRef.current = agentReviewSupplement; }, [agentReviewSupplement]);

  // ── Task state ─────────────────────────────────────────────────────────────
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const tasks = MOCK_TASKS[empId] ?? [];
  const selectedTask = tasks.find(t => t.id === selectedTaskId) || null;

  // ── Toggle tool card ───────────────────────────────────────────────────────
  const toggleToolCard = (msgId: string, part: 'req' | 'res') => {
    setToolCardOpen(prev => ({
      ...prev,
      [msgId]: {
        req: part === 'req' ? !prev[msgId]?.req : (prev[msgId]?.req ?? false),
        res: part === 'res' ? !prev[msgId]?.res : (prev[msgId]?.res ?? false),
      },
    }));
  };

  // ── Send message ───────────────────────────────────────────────────────────
  const handleSend = (text?: string) => {
    const msg = (text !== undefined ? text : input).trim();
    if (!msg || sending || agentPendingMsgId) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text: msg, time: getTime() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);

    // ── de-009 合同审核助手: AI Agent 逐步推理模式 ──────────────────────────
    if (empId === 'de-009') {
      let msgSeq = Date.now();
      const nextId = () => `a-${++msgSeq}`;
      const ts = getTime();
      const pushMsg = (m: ChatMessage) => setMessages(prev => [...prev, m]);

      // Step 1
      setTimeout(() => {
        pushMsg({ id: nextId(), role: 'bot', kind: 'step', text: '◉ 任务已接收，开始分析合同审核需求…', time: ts, empId, empName });
      }, 300);

      // Step 2
      setTimeout(() => {
        pushMsg({
          id: nextId(), role: 'bot', kind: 'normal', time: ts, empId, empName,
          text: `好的，我将按以下步骤完成本次合同审核：\n\n① 调用 **PDF 解析工具** 提取合同全文结构\n② 检索**法务规则库**，匹配条款风险模式\n③ 对识别到的高风险条款逐一请您确认\n④ 汇总生成完整审核报告\n\n开始执行…`,
        });
      }, 800);

      // Step 3
      setTimeout(() => {
        pushMsg({ id: nextId(), role: 'bot', kind: 'step', text: '◉ 正在调用 PDF 解析工具，提取合同文本结构…', time: ts, empId, empName });
      }, 1500);

      // Step 4: PDF tool-call
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

      // Step 5
      setTimeout(() => {
        pushMsg({ id: nextId(), role: 'bot', kind: 'step', text: '◉ PDF 解析完成：共 18 页、31 个条款、12,480 字。开始检索法务规则库…', time: ts, empId, empName });
      }, 3400);

      // Step 6: Legal tool-call
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

      // Step 7
      setTimeout(() => {
        pushMsg({
          id: nextId(), role: 'bot', kind: 'normal', time: ts, empId, empName,
          text: '法务规则库检索完成，共匹配 47 条规则。\n\n发现 **2 处高风险条款**，需要您逐一确认后，我才会继续推进审核。\n\n请先处理第一处风险：',
        });
      }, 5400);

      // Step 8: HITL #1
      const hp1Id = nextId();
      setTimeout(() => {
        setAgentPendingMsgId(hp1Id);
        pushMsg({
          id: hp1Id, role: 'bot', kind: 'human-pending', time: ts, empId, empName,
          text: '⚠️ **高风险条款 · 第8条 违约责任**\n\n> 原文：「乙方违约时，赔偿金额不超过合同总金额的 **5%**」\n\n**风险说明**：赔偿上限仅为合同金额的 5%，远低于行业基准（通常为 20%–30%）。若乙方违约，甲方实际损失可能远超可获赔偿，存在重大利益损失风险。\n\n**建议修改**：将赔偿上限调整至合同总金额的 **30%**，并增加「因欺诈或故意违约不受此限」的兜底条款。\n\n请确认您对此条款的处理方式：',
        });
        agentContinueFnRef.current = () => {
          setAgentPendingMsgId(null);
          const confirmText = agentReviewChoiceRef.current
            ? agentReviewChoiceRef.current + (agentReviewSupplementRef.current ? '：' + agentReviewSupplementRef.current : '')
            : '已确认';
          setMessages(prev => prev.map(m => m.id === hp1Id
            ? { ...m, kind: 'normal' as const, text: `✓ 第8条违约责任 — ${confirmText}` }
            : m
          ));
          setAgentReviewChoice('');
          setAgentReviewSupplement('');

          setTimeout(() => {
            pushMsg({ id: nextId(), role: 'bot', kind: 'step', text: '◉ 已记录您的确认意见，继续分析第二处高风险条款…', time: getTime(), empId, empName });
          }, 400);

          const hp2Id = nextId();
          setTimeout(() => {
            setAgentPendingMsgId(hp2Id);
            pushMsg({
              id: hp2Id, role: 'bot', kind: 'human-pending', time: getTime(), empId, empName,
              text: '⚠️ **高风险条款 · 第12条 单方解约权**\n\n> 原文：「乙方有权在提前 **7日** 书面通知后单方解除本合同，无需承担违约责任」\n\n**风险说明**：乙方享有几乎无条件的单方解约权，且解约后无需赔偿。若乙方在项目关键节点解约，甲方将面临严重履约风险。\n\n**建议修改**：① 解约提前通知期延长至 **30日**；② 解约须支付不低于合同金额 **15%** 的违约金；③ 项目关键阶段禁止解约。\n\n请确认您对此条款的处理方式：',
            });
            agentContinueFnRef.current = () => {
              setAgentPendingMsgId(null);
              const confirmText2 = agentReviewChoiceRef.current
                ? agentReviewChoiceRef.current + (agentReviewSupplementRef.current ? '：' + agentReviewSupplementRef.current : '')
                : '已确认';
              setMessages(prev => prev.map(m => m.id === hp2Id
                ? { ...m, kind: 'normal' as const, text: `✓ 第12条单方解约权 — ${confirmText2}` }
                : m
              ));
              setAgentReviewChoice('');
              setAgentReviewSupplement('');
              agentContinueFnRef.current = null;

              setTimeout(() => {
                pushMsg({ id: nextId(), role: 'bot', kind: 'step', text: '◉ 所有风险条款已确认，正在生成完整审核报告…', time: getTime(), empId, empName });
              }, 400);
              setTimeout(() => {
                pushMsg({
                  id: nextId(), role: 'bot', kind: 'normal', time: getTime(), empId, empName,
                  text: `✅ **合同审核完成**\n\n**文件**：供应商合同_2026Q2.pdf（18页，31条款）\n\n**审核结论**：\n• 高风险条款 2 项 ⚠️（已由您逐一确认）\n• 中风险条款 5 项（建议法务复查）\n• 低风险条款 8 项（可接受）\n\n**已确认处理方式**：\n• 第8条违约责任：${confirmText}\n• 第12条单方解约权：${confirmText2}\n\n审核报告已生成，包含风险标注、修改建议与法律依据引用，可直接导出或同步至飞书文档。`,
                });
                setSending(false);
              }, 1800);
            };
          }, 1400);
        };
      }, 6200);
      return;
    }

    // ── 通用 bot 回复 ──────────────────────────────────────────────────────
    setTimeout(() => {
      const replies = [
        `好的，我已收到您的任务：「${msg}」，正在处理中，稍后会将结果反馈给您。`,
        `明白了，我将立即开始处理：${msg}，预计完成时间 2-3 分钟，完成后会通知您。`,
        `任务已接收！我会按照您的要求完成「${msg}」，完成后主动告知结果。`,
      ];
      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`, role: 'bot',
        text: replies[Math.floor(Math.random() * replies.length)],
        time: getTime(), empId, empName, kind: 'normal',
      };
      setMessages(prev => [...prev, botMsg]);
      setSending(false);
    }, 800 + Math.random() * 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Render single message ──────────────────────────────────────────────────
  const renderMessage = (msg: ChatMessage) => {
    // Step
    if (msg.kind === 'step') {
      return (
        <div key={msg.id} style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 6, padding: '2px 4px' }}>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#d1d5db', flexShrink: 0 }} />
          {msg.text}
        </div>
      );
    }

    // Tool-call card
    if (msg.kind === 'tool-call' && msg.toolCard) {
      const isReqOpen = toolCardOpen[msg.id]?.req ?? false;
      const isResOpen = toolCardOpen[msg.id]?.res ?? false;
      return (
        <div key={msg.id} style={{ background: '#1e1e2e', borderRadius: 10, overflow: 'hidden', border: '1px solid #374151', fontSize: 12, maxWidth: '92%' }}>
          <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #374151' }}>
            <span style={{ fontSize: 13 }}>🔧</span>
            <span style={{ color: '#a5b4fc', fontWeight: 600, fontFamily: 'monospace', fontSize: 12 }}>{msg.toolCard.toolName}</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#6b7280' }}>工具调用</span>
          </div>
          <div>
            <div onClick={() => toggleToolCard(msg.id, 'req')} style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#94a3b8', fontSize: 11, borderBottom: '1px solid #2d2d3d' }}>
              <span style={{ fontSize: 9, transition: 'transform 0.15s', display: 'inline-block', transform: isReqOpen ? 'rotate(90deg)' : 'rotate(0)' }}>▶</span>
              请求参数
            </div>
            {isReqOpen && (
              <pre style={{ margin: 0, padding: '8px 14px', fontSize: 11, color: '#86efac', fontFamily: 'monospace', lineHeight: 1.7, overflowX: 'auto', borderBottom: '1px solid #2d2d3d', background: '#161622' }}>{msg.toolCard.request}</pre>
            )}
          </div>
          <div>
            <div onClick={() => toggleToolCard(msg.id, 'res')} style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#94a3b8', fontSize: 11 }}>
              <span style={{ fontSize: 9, transition: 'transform 0.15s', display: 'inline-block', transform: isResOpen ? 'rotate(90deg)' : 'rotate(0)' }}>▶</span>
              返回结果
            </div>
            {isResOpen && (
              <pre style={{ margin: 0, padding: '8px 14px', fontSize: 11, color: '#fbbf24', fontFamily: 'monospace', lineHeight: 1.7, overflowX: 'auto', background: '#161622' }}>{msg.toolCard.response}</pre>
            )}
          </div>
        </div>
      );
    }

    // HITL human-pending
    if (msg.kind === 'human-pending') {
      const isPending = agentPendingMsgId === msg.id;
      return (
        <div key={msg.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: empColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
            {meta.avatar}
          </div>
          <div style={{
            background: '#fff', borderRadius: '4px 12px 12px 12px',
            border: `1.5px solid ${isPending ? '#c7d2fe' : '#bbf7d0'}`,
            padding: '12px 14px', maxWidth: 'calc(100% - 50px)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 13 }}>{isPending ? '⏸' : '✅'}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: isPending ? '#4338CA' : '#166534' }}>
                {isPending ? '等待人工确认' : '已完成人工确认'}
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#374151', marginBottom: isPending ? 10 : 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{msg.text}</div>
            {isPending && (
              <div>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>请选择处理方式：</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                  {['✓ 接受修改建议', '↩ 保留原条款并备注风险', '✏️ 自定义处理方式'].map(opt => (
                    <div
                      key={opt}
                      onClick={() => setAgentReviewChoice(agentReviewChoice === opt ? '' : opt)}
                      style={{
                        padding: '8px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                        background: agentReviewChoice === opt ? '#EEF2FF' : '#f9fafb',
                        border: `1px solid ${agentReviewChoice === opt ? '#6366F1' : '#e5e7eb'}`,
                        color: agentReviewChoice === opt ? '#4F46E5' : '#374151',
                        fontWeight: agentReviewChoice === opt ? 600 : 400,
                        transition: 'all 0.15s',
                      }}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
                <textarea
                  value={agentReviewSupplement}
                  onChange={e => setAgentReviewSupplement(e.target.value)}
                  placeholder="补充说明（可选）..."
                  rows={2}
                  style={{
                    width: '100%', border: '1px solid #e5e7eb', borderRadius: 8,
                    padding: '8px 10px', fontSize: 12, outline: 'none', resize: 'none',
                    boxSizing: 'border-box', fontFamily: 'inherit', color: '#374151',
                    background: '#fafbff', marginBottom: 8, lineHeight: 1.5,
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#6366F1')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
                />
                <button
                  onClick={() => { if (agentContinueFnRef.current) agentContinueFnRef.current(); }}
                  style={{
                    width: '100%', padding: '9px 0', borderRadius: 8, border: 'none',
                    background: `linear-gradient(135deg, ${empColor}, ${empColor}cc)`,
                    color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  确认并继续
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Bot normal message
    if (msg.role === 'bot') {
      return (
        <div key={msg.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: empColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
            {meta.avatar}
          </div>
          <div style={{ maxWidth: 'calc(100% - 50px)' }}>
            <div style={{ background: '#fff', borderRadius: '4px 12px 12px 12px', padding: '10px 13px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', fontSize: 13, color: '#1f2937', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {msg.text}
            </div>
            <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 4, paddingLeft: 4 }}>{msg.time}</div>
          </div>
        </div>
      );
    }

    // User message
    return (
      <div key={msg.id} style={{ display: 'flex', flexDirection: 'row-reverse', gap: 8, alignItems: 'flex-end' }}>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
          A
        </div>
        <div style={{ maxWidth: 'calc(100% - 50px)' }}>
          <div style={{ background: empColor, borderRadius: '12px 4px 12px 12px', padding: '10px 14px', color: '#fff', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
            {msg.text}
          </div>
          <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 4, textAlign: 'right', paddingRight: 4 }}>{msg.time}</div>
        </div>
      </div>
    );
  };

  // ── Render task detail ─────────────────────────────────────────────────────
  const renderTaskDetail = (task: TaskItem) => {
    const cfg = taskStatusCfg[task.status] ?? taskStatusCfg.waiting;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ padding: '14px 16px', background: '#f8f7ff', borderBottom: '1px solid #ede9fe', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.5, marginBottom: 5 }}>{task.title}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 10, background: cfg.bg, color: cfg.color, fontWeight: 600, border: `1px solid ${cfg.color}30` }}>{cfg.label}</span>
                <span style={{ fontSize: 11, color: '#888' }}>🕐 {task.time}</span>
                {task.duration && <span style={{ fontSize: 11, color: '#888' }}>⏱ {task.duration}</span>}
              </div>
            </div>
            <button onClick={() => setSelectedTaskId(null)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e0deff', background: '#fff', color: '#6366F1', fontSize: 11, cursor: 'pointer', fontWeight: 500, flexShrink: 0 }}>← 返回</button>
          </div>
          {task.result && (
            <div style={{ marginTop: 8, padding: '6px 10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 7, fontSize: 12, color: '#166534' }}>💡 {task.result}</div>
          )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6366F1', marginBottom: 14 }}>执行步骤</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {task.steps.map((step, idx) => (
              <div key={step.id} style={{ display: 'flex', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: stepBg[step.status], border: `2px solid ${stepDot[step.status]}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: stepDot[step.status] }} />
                  </div>
                  {idx < task.steps.length - 1 && (
                    <div style={{ width: 2, flex: 1, minHeight: 28, background: '#e5e7eb', margin: '4px 0' }} />
                  )}
                </div>
                <div style={{ flex: 1, paddingBottom: idx < task.steps.length - 1 ? 16 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{step.name}</span>
                    <span style={{ fontSize: 10, color: stepClr[step.status], fontWeight: 500 }}>{stepLbl[step.status]}</span>
                  </div>
                  {step.desc && <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{step.desc}</div>}
                  {step.output && (
                    <div style={{ fontSize: 11, color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '5px 8px', lineHeight: 1.5, marginBottom: 4 }}>{step.output}</div>
                  )}
                  {step.time && <div style={{ fontSize: 10, color: '#9ca3af' }}>{step.time}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const runningCount = tasks.filter(t => t.status === 'running').length;

  return (
    <div style={{
      width: '100%', height: '100vh',
      display: 'flex', flexDirection: 'column',
      background: '#F3F4F6',
      fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif',
    }}>

      {/* ── Header ── */}
      <div style={{
        background: `linear-gradient(135deg, ${empColor} 0%, ${empColor}cc 100%)`,
        padding: '0 16px', flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 60 }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0, position: 'relative',
          }}>
            {meta.avatar}
            <span style={{ position: 'absolute', bottom: 0, right: 0, width: 9, height: 9, borderRadius: '50%', background: '#4ade80', border: '2px solid rgba(255,255,255,0.8)' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>{empName}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
              在线 · {meta.domain}
            </div>
          </div>
          {runningCount > 0 && (
            <div style={{ fontSize: 11, padding: '3px 10px', borderRadius: 12, background: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 500, flexShrink: 0 }}>
              {runningCount} 任务执行中
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          {([{ key: 'chat', label: '💬 对话' }, { key: 'tasks', label: '📋 任务状态' }] as const).map(tab => (
            <div
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); if (tab.key === 'tasks') setSelectedTaskId(null); }}
              style={{
                flex: 1, textAlign: 'center', padding: '10px 0', cursor: 'pointer',
                fontSize: 13, fontWeight: activeTab === tab.key ? 700 : 400,
                color: activeTab === tab.key ? '#fff' : 'rgba(255,255,255,0.6)',
                borderBottom: activeTab === tab.key ? '2px solid #fff' : '2px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Chat Tab ── */}
      {activeTab === 'chat' && (
        <>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {messages.map(msg => renderMessage(msg))}

            {/* Typing indicator */}
            {sending && agentPendingMsgId === null && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: empColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                  {meta.avatar}
                </div>
                <div style={{ background: '#fff', borderRadius: '4px 12px 12px 12px', padding: '10px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#9ca3af', animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div style={{ background: '#fff', borderTop: '1px solid #f0f0f0', padding: '10px 12px', flexShrink: 0, boxShadow: '0 -2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, background: '#f9fafb', borderRadius: 24, border: '1px solid #e5e7eb', padding: '6px 6px 6px 14px' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={agentPendingMsgId ? '请在上方处理待确认项后继续…' : `发送消息给 ${empName}...`}
                disabled={!!agentPendingMsgId}
                rows={1}
                style={{
                  flex: 1, border: 'none', background: 'transparent',
                  outline: 'none', resize: 'none', fontSize: 14,
                  color: '#1f2937', lineHeight: 1.6, maxHeight: 120,
                  overflowY: 'auto', fontFamily: 'inherit',
                  opacity: agentPendingMsgId ? 0.5 : 1,
                }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || sending || !!agentPendingMsgId}
                style={{
                  width: 36, height: 36, borderRadius: '50%', border: 'none',
                  background: input.trim() && !sending && !agentPendingMsgId ? empColor : '#e5e7eb',
                  cursor: input.trim() && !sending && !agentPendingMsgId ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'background 0.2s',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div style={{ textAlign: 'center', fontSize: 10, color: '#d1d5db', marginTop: 6 }}>内容由 AI 生成，仅供参考</div>
          </div>
        </>
      )}

      {/* ── Tasks Tab ── */}
      {activeTab === 'tasks' && (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {selectedTask ? renderTaskDetail(selectedTask) : (
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
              {tasks.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9ca3af', padding: '60px 20px' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>暂无执行中的任务</div>
                  <div style={{ fontSize: 12, marginTop: 6 }}>切换到对话标签，发送任务给员工</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>共 {tasks.length} 个任务</div>
                  {tasks.map(task => {
                    const cfg = taskStatusCfg[task.status] ?? taskStatusCfg.waiting;
                    const doneSteps = task.steps.filter(s => s.status === 'done').length;
                    const progress = Math.round((doneSteps / task.steps.length) * 100);
                    return (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', cursor: 'pointer', border: '1px solid #f0f0f0', transition: 'all 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(99,102,241,0.15)')}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)')}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                          <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.5 }}>{task.title}</div>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: cfg.bg, color: cfg.color, fontWeight: 600, flexShrink: 0 }}>{cfg.label}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontSize: 11, color: '#9ca3af' }}>🕐 {task.time}</span>
                          {task.duration && <span style={{ fontSize: 11, color: '#9ca3af' }}>⏱ {task.duration}</span>}
                          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#6366F1', fontWeight: 500 }}>{task.steps.length} 个步骤 →</span>
                        </div>
                        {task.result && (
                          <div style={{ fontSize: 11, color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '4px 8px', marginBottom: 8 }}>💡 {task.result}</div>
                        )}
                        <div style={{ height: 3, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 3, background: cfg.color, width: `${progress}%`, transition: 'width 0.3s' }} />
                        </div>
                        <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 4, textAlign: 'right' }}>{doneSteps}/{task.steps.length} 步骤完成</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default DigitalEmployeeH5;
