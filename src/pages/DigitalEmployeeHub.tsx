import React, { useState, useEffect } from 'react';
import {
  DashboardOutlined, AppstoreOutlined, BlockOutlined,
  ArrowLeftOutlined, TeamOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  MenuOutlined, BarsOutlined, ClockCircleOutlined, UserOutlined,
  BranchesOutlined, ShopOutlined, SafetyCertificateOutlined, CheckCircleOutlined,
  ThunderboltOutlined, SearchOutlined, PlusOutlined,
} from '@ant-design/icons';
import { Tooltip, Input, Switch, message, Badge } from 'antd';
import DigitalEmployeeWorkbench from './DigitalEmployeeWorkbench';
import DigitalEmployeeLibrary from './DigitalEmployeeLibrary';
import DigitalEmployeeDomain from './DigitalEmployeeDomain';
import ScheduledTasks from './ScheduledTasks';
import DigitalEmployeeProfile from './DigitalEmployeeProfile';
import SkillsStore from './SkillsStore';
import { MOCK_SKILLS } from './SkillsStore';
import SecurityCenter from './SecurityCenter';
import ApprovalCenter from './ApprovalCenter';
import { DigitalEmployeePanel } from './Frontend';

// ── 页面 key ──────────────────────────────────────────────
type PageKey = 'frontend' | 'library' | 'scheduled' | 'profile' | 'security' | 'approval';

// ── 导航模式 ──────────────────────────────────────────────
type NavMode = 'sidebar' | 'topbar';

// ── 菜单项定义 ────────────────────────────────────────────
interface NavItem {
  key: PageKey;
  label: string;
  icon: React.ReactNode;
  desc: string;
  group?: string;   // 分组标题（仅侧边栏展开时显示）
}

const NAV_ITEMS: NavItem[] = [
  { key: 'frontend',  label: '数字员工', icon: <TeamOutlined />,              desc: '前台交互与任务对话' },
  { key: 'library',   label: '员工库',   icon: <AppstoreOutlined />,          desc: '员工全生命周期管理' },
  { key: 'profile',   label: '360度画像', icon: <UserOutlined />,             desc: '工作时长·任务量·绩效' },
  { key: 'scheduled', label: '定时任务', icon: <ClockCircleOutlined />,       desc: '多触发机制管理' },
  { key: 'security',  label: '管控中心', icon: <SafetyCertificateOutlined />, desc: '监控·风控·围栏',   group: '安全' },
  { key: 'approval',  label: '审批中心', icon: <CheckCircleOutlined />,       desc: '员工上岗审批' },
];

// ── hash 映射 ─────────────────────────────────────────────
const HASH_MAP: Record<string, PageKey> = {
  'digital-employee':           'frontend',
  'digital-employee-frontend':  'frontend',
  'digital-employee-library':   'library',
  'digital-employee-security':  'security',
  'digital-employee-approval':  'approval',
  'digital-employee-profile':   'profile',
  'scheduled-tasks':            'scheduled',
};

const PAGE_HASH: Record<PageKey, string> = {
  frontend:  'digital-employee',
  library:   'digital-employee-library',
  security:  'digital-employee-security',
  approval:  'digital-employee-approval',
  profile:   'digital-employee-profile',
  scheduled: 'scheduled-tasks',
};

// ── 业务流程独立页 ────────────────────────────────────────
const EMPLOYEES_LIST = [
  { id: 'de-007', name: '智能巡检助手', dept: '管道运营部', domain: '管道安全域', status: 'published' as const },
  { id: 'de-001', name: '法务合规助手', dept: '法务部',     domain: '法务域',     status: 'published' as const },
  { id: 'de-002', name: 'HR 招聘助手',  dept: '人力资源',   domain: '人力域',     status: 'published' as const },
  { id: 'de-003', name: '财务报表助手', dept: '财务部',     domain: '财务域',     status: 'testing'   as const },
  { id: 'de-005', name: '智能客服分发', dept: '客户成功',   domain: '客服域',     status: 'draft'     as const },
  { id: 'de-006', name: '运营数据助手', dept: '运营部',     domain: '运营域',     status: 'published' as const },
];

const STATUS_DOT: Record<string, { color: string; label: string }> = {
  published: { color: '#10B981', label: '运行中' },
  testing:   { color: '#F59E0B', label: '测试中' },
  draft:     { color: '#9ca3af', label: '草稿'   },
};

// NL → Flow 预设场景
interface NLFlowNode { id: string; type: 'start'|'end'|'process'|'decision'|'human'; label: string; desc?: string; x: number; y: number; }
interface NLFlowEdge { id: string; from: string; to: string; label?: string; }
interface NLFlow { nodes: NLFlowNode[]; edges: NLFlowEdge[]; }

const NL_PRESET_FLOWS: Record<string, NLFlow> = {
  巡检: {
    nodes: [
      { id:'n1', type:'start',    label:'开始',       x:40,  y:130 },
      { id:'n2', type:'process',  label:'告警接收',   desc:'汇聚光纤/视频/无人机多源告警', x:200, y:130 },
      { id:'n3', type:'process',  label:'AI 研判',    desc:'交叉验证，置信度评分', x:380, y:130 },
      { id:'n4', type:'decision', label:'高危告警?',  x:570, y:130 },
      { id:'n5', type:'human',    label:'人工复核',   desc:'管理员确认处置方案', x:570, y:270 },
      { id:'n6', type:'process',  label:'自动派单',   desc:'生成工单，分配责任人', x:760, y:130 },
      { id:'n7', type:'process',  label:'闭环归档',   desc:'处置结束，归档记录', x:940, y:130 },
      { id:'n8', type:'end',      label:'结束',       x:1110, y:130 },
    ],
    edges: [
      { id:'e1', from:'n1', to:'n2' },
      { id:'e2', from:'n2', to:'n3' },
      { id:'e3', from:'n3', to:'n4' },
      { id:'e4', from:'n4', to:'n5', label:'是' },
      { id:'e5', from:'n4', to:'n6', label:'否' },
      { id:'e6', from:'n5', to:'n6' },
      { id:'e7', from:'n6', to:'n7' },
      { id:'e8', from:'n7', to:'n8' },
    ],
  },
  审批: {
    nodes: [
      { id:'n1', type:'start',    label:'开始',     x:40,  y:130 },
      { id:'n2', type:'process',  label:'提交申请', desc:'用户填写审批表单', x:200, y:130 },
      { id:'n3', type:'human',    label:'主管审批', desc:'超时自动提醒', x:380, y:130 },
      { id:'n4', type:'decision', label:'审批通过?', x:570, y:130 },
      { id:'n5', type:'process',  label:'通知结果', desc:'发送审批通过通知', x:760, y:130 },
      { id:'n6', type:'process',  label:'退回修改', desc:'告知驳回原因', x:570, y:270 },
      { id:'n7', type:'end',      label:'结束',     x:940, y:130 },
    ],
    edges: [
      { id:'e1', from:'n1', to:'n2' },
      { id:'e2', from:'n2', to:'n3' },
      { id:'e3', from:'n3', to:'n4' },
      { id:'e4', from:'n4', to:'n5', label:'通过' },
      { id:'e5', from:'n4', to:'n6', label:'驳回' },
      { id:'e6', from:'n6', to:'n2' },
      { id:'e7', from:'n5', to:'n7' },
    ],
  },
  报表: {
    nodes: [
      { id:'n1', type:'start',    label:'开始',       x:40,  y:130 },
      { id:'n2', type:'process',  label:'定时触发',   desc:'每日 08:00 自动启动', x:200, y:130 },
      { id:'n3', type:'process',  label:'拉取数据',   desc:'从数据源拉取核心指标', x:380, y:130 },
      { id:'n4', type:'process',  label:'AI 分析',    desc:'生成趋势分析与异常检测', x:560, y:130 },
      { id:'n5', type:'decision', label:'有异常?',    x:740, y:130 },
      { id:'n6', type:'human',    label:'人工确认',   desc:'异常指标需人工确认', x:740, y:270 },
      { id:'n7', type:'process',  label:'生成报告',   desc:'输出日/周/月报 PDF', x:920, y:130 },
      { id:'n8', type:'process',  label:'推送分发',   desc:'钉钉/飞书/邮件推送', x:1100, y:130 },
      { id:'n9', type:'end',      label:'结束',       x:1280, y:130 },
    ],
    edges: [
      { id:'e1', from:'n1', to:'n2' },
      { id:'e2', from:'n2', to:'n3' },
      { id:'e3', from:'n3', to:'n4' },
      { id:'e4', from:'n4', to:'n5' },
      { id:'e5', from:'n5', to:'n6', label:'是' },
      { id:'e6', from:'n5', to:'n7', label:'否' },
      { id:'e7', from:'n6', to:'n7' },
      { id:'e8', from:'n7', to:'n8' },
      { id:'e9', from:'n8', to:'n9' },
    ],
  },
};

const DEFAULT_NL_FLOW: NLFlow = {
  nodes: [
    { id:'n1', type:'start',    label:'开始',     x:60,  y:130 },
    { id:'n2', type:'process',  label:'接收任务', desc:'解析用户意图与任务类型', x:240, y:130 },
    { id:'n3', type:'process',  label:'规划拆解', desc:'AI 自动分解为子步骤', x:420, y:130 },
    { id:'n4', type:'decision', label:'需人工?',  x:610, y:130 },
    { id:'n5', type:'human',    label:'人工复核', desc:'等待人工确认关键结果', x:610, y:270 },
    { id:'n6', type:'process',  label:'执行输出', desc:'生成并推送最终结果', x:800, y:130 },
    { id:'n7', type:'end',      label:'结束',     x:970, y:130 },
  ],
  edges: [
    { id:'e1', from:'n1', to:'n2' },
    { id:'e2', from:'n2', to:'n3' },
    { id:'e3', from:'n3', to:'n4' },
    { id:'e4', from:'n4', to:'n5', label:'是' },
    { id:'e5', from:'n4', to:'n6', label:'否' },
    { id:'e6', from:'n5', to:'n6' },
    { id:'e7', from:'n6', to:'n7' },
  ],
};

const NODE_CFG: Record<NLFlowNode['type'], { bg: string; border: string; text: string; icon: string }> = {
  start:    { bg:'#d1fae5', border:'#10B981', text:'#065f46', icon:'▶' },
  end:      { bg:'#fee2e2', border:'#EF4444', text:'#7f1d1d', icon:'⏹' },
  process:  { bg:'#eff6ff', border:'#3B82F6', text:'#1e3a8a', icon:'⚙' },
  decision: { bg:'#fef9c3', border:'#F59E0B', text:'#78350f', icon:'◆' },
  human:    { bg:'#faf5ff', border:'#8B5CF6', text:'#4c1d95', icon:'👤' },
};

const NW = 130; const NH = 58;
function nodeCenter(n: NLFlowNode) { return { cx: n.x + NW/2, cy: n.y + NH/2 }; }
function edgePath(a: NLFlowNode, b: NLFlowNode) {
  const f = nodeCenter(a), t = nodeCenter(b);
  const mx = (f.cx + t.cx) / 2;
  return `M${f.cx},${f.cy} C${mx},${f.cy} ${mx},${t.cy} ${t.cx},${t.cy}`;
}

const BusinessProcessPage: React.FC = () => {
  const [selectedId, setSelectedId]     = useState('de-007');
  const [flow, setFlow]                 = useState<NLFlow>(DEFAULT_NL_FLOW);
  const [nlMsgs, setNlMsgs]            = useState<Array<{role:'user'|'ai'; content:string; nodeCtx?: string}>>([
    { role:'ai', content:'你好！我可以帮你搭建业务流程。\n\n• 直接描述需求，生成完整流程图\n• 点击右侧画板中的节点，然后用自然语言修改该节点\n• 也可以在右侧直接拖拽、手动添加节点\n\n试试：「帮我设计一个巡检告警处置流程」' },
  ]);
  const [nlInput, setNlInput]           = useState('');
  const [nlLoading, setNlLoading]       = useState(false);
  const [draggingNodeId, setDraggingId] = useState<string|null>(null);
  const [dragOff, setDragOff]           = useState({ dx:0, dy:0 });
  const [selectedNodeId, setSelNode]    = useState<string|null>(null);
  const [editingNode, setEditNode]      = useState<NLFlowNode|null>(null);
  const [leftPct, setLeftPct]           = useState(30);
  const isDraggingDiv                   = React.useRef(false);
  const containerRef                    = React.useRef<HTMLDivElement>(null);
  const svgRef                          = React.useRef<SVGSVGElement>(null);
  const nlEndRef                        = React.useRef<HTMLDivElement>(null);
  const nodeIdRef                       = React.useRef(100);
  const nlInputRef                      = React.useRef<HTMLTextAreaElement>(null);

  const current = EMPLOYEES_LIST.find(e => e.id === selectedId) || EMPLOYEES_LIST[0];
  const selectedNode = selectedNodeId ? flow.nodes.find(n => n.id === selectedNodeId) : null;

  React.useEffect(() => { nlEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [nlMsgs]);

  // ── 分隔条拖动 ──────────────────────────────────────────
  const onDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingDiv.current = true;
    const onMove = (ev: MouseEvent) => {
      if (!isDraggingDiv.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = Math.min(55, Math.max(20, ((ev.clientX - rect.left) / rect.width) * 100));
      setLeftPct(pct);
    };
    const onUp = () => { isDraggingDiv.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // ── 点击节点 → 注入对话上下文 ───────────────────────────
  const handleNodeClick = (id: string) => {
    setSelNode(id);
    const node = flow.nodes.find(n => n.id === id);
    if (!node) return;
    const typeLabel = node.type === 'process' ? '处理' : node.type === 'decision' ? '判断' : node.type === 'human' ? '人工' : node.type === 'start' ? '开始' : '结束';
    setNlMsgs(prev => {
      // 若上一条已是节点上下文消息则替换，避免堆积
      const last = prev[prev.length - 1];
      const ctx = { role:'ai' as const, content:`已选中节点「${node.label}」（${typeLabel}类型）${node.desc ? `\n描述：${node.desc}` : ''}\n\n你可以告诉我如何修改它，例如：\n• 「把它改成判断节点」\n• 「名称改为数据校验」\n• 「描述改为校验业务数据完整性」\n• 「删除这个节点」`, nodeCtx: id };
      if (last?.nodeCtx) return [...prev.slice(0, -1), ctx];
      return [...prev, ctx];
    });
    setTimeout(() => nlInputRef.current?.focus(), 100);
  };

  // ── NL 发送 ────────────────────────────────────────────
  const handleNlSend = () => {
    const text = nlInput.trim();
    if (!text || nlLoading) return;
    setNlInput('');
    setNlMsgs(prev => [...prev, { role:'user', content: selectedNode ? `[节点「${selectedNode.label}」] ${text}` : text }]);
    setNlLoading(true);

    setTimeout(() => {
      // ── 针对选中节点的修改 ──────────────────────────────
      if (selectedNode) {
        const nid = selectedNode.id;

        // 删除节点
        if (text.includes('删除') || text.includes('移除') || text.includes('去掉')) {
          setFlow(prev => ({
            nodes: prev.nodes.filter(n => n.id !== nid),
            edges: prev.edges.filter(e => e.from !== nid && e.to !== nid),
          }));
          setSelNode(null);
          setNlMsgs(prev => [...prev, { role:'ai', content:`✅ 已删除节点「${selectedNode.label}」。` }]);
          setNlLoading(false);
          return;
        }

        // 修改节点属性
        const updated = { ...selectedNode };
        let changed: string[] = [];

        // 修改类型
        if (text.includes('判断') || text.includes('条件') || text.includes('分支')) { updated.type = 'decision'; changed.push('类型→判断节点'); }
        else if (text.includes('人工') || text.includes('审批') || text.includes('复核')) { updated.type = 'human'; changed.push('类型→人工节点'); }
        else if (text.includes('处理') || text.includes('执行') || text.includes('自动')) { updated.type = 'process'; changed.push('类型→处理节点'); }

        // 修改名称
        const nameMatch = text.match(/(?:名称|改名|叫|命名)[\s为：:]+[「『"]?([^」』"，。\n]+)[」』"]?/) ||
                          text.match(/改[为成]「?([^」，。\n]{1,12})「?/) ||
                          text.match(/[「『"]([^」』"]{1,12})[」』"]/);
        if (nameMatch && !text.includes('描述')) { updated.label = nameMatch[1].trim(); changed.push(`名称→${updated.label}`); }

        // 修改描述
        const descMatch = text.match(/描述[改为设置：:]+[「『"]?([^」』"，\n]+)/) ||
                          text.match(/(?:说明|备注)[为：:]+[「『"]?([^」』"，\n]+)/);
        if (descMatch) { updated.desc = descMatch[1].trim(); changed.push(`描述→${updated.desc}`); }

        if (changed.length > 0) {
          setFlow(prev => ({ ...prev, nodes: prev.nodes.map(n => n.id === nid ? updated : n) }));
          setNlMsgs(prev => [...prev, { role:'ai', content:`✅ 已更新节点「${selectedNode.label}」：\n${changed.map(c=>`• ${c}`).join('\n')}\n\n可继续修改，或点击其他节点进行编辑。` }]);
        } else {
          setNlMsgs(prev => [...prev, { role:'ai', content:`已理解你对节点「${selectedNode.label}」的修改需求，但未能识别具体内容。\n\n你可以更明确地说：\n• 「名称改为数据校验」\n• 「描述改为校验数据完整性」\n• 「改成判断类型」\n• 「删除这个节点」` }]);
        }
        setNlLoading(false);
        return;
      }

      // ── 全局流程生成 ──────────���─────────────────────────
      let matched: NLFlow | null = null;
      for (const [key, fd] of Object.entries(NL_PRESET_FLOWS)) {
        if (text.includes(key)) { matched = fd; break; }
      }
      if (!matched && (text.includes('巡检') || text.includes('预警') || text.includes('告警') || text.includes('光纤'))) matched = NL_PRESET_FLOWS['巡检'];
      if (!matched && (text.includes('审批') || text.includes('审核') || text.includes('工单') || text.includes('申请'))) matched = NL_PRESET_FLOWS['审批'];
      if (!matched && (text.includes('报表') || text.includes('报告') || text.includes('分析') || text.includes('数据'))) matched = NL_PRESET_FLOWS['报表'];

      if (!matched && (text.includes('增加') || text.includes('添加') || text.includes('新增') || text.includes('插入'))) {
        const isHuman    = text.includes('人工') || text.includes('审批') || text.includes('复核') || text.includes('确认');
        const isDecision = text.includes('判断') || text.includes('决策') || text.includes('条件') || text.includes('分支');
        const type: NLFlowNode['type'] = isHuman ? 'human' : isDecision ? 'decision' : 'process';
        const lm = text.match(/[「『""](.+?)[」』""]/) || text.match(/节点[：:]?\s*(.{1,8})/);
        const label = lm ? lm[1] : (isHuman ? '人工节点' : isDecision ? '判断节点' : '新节点');
        const nonEndNodes = flow.nodes.filter(n => n.type !== 'end');
        const last = nonEndNodes[nonEndNodes.length - 1];
        const endNode = flow.nodes.find(n => n.type === 'end');
        const newId = `n${++nodeIdRef.current}`;
        const newNode: NLFlowNode = { id: newId, type, label, x: (last?.x||300) + 185, y: last?.y||130 };
        setFlow(prev => ({
          nodes: [...prev.nodes.filter(n => n.type !== 'end'), newNode, ...(endNode ? [{ ...endNode, x: newNode.x + 185 }] : [])],
          edges: [...prev.edges.filter(e => endNode ? e.to !== endNode.id : true),
            { id:`e${Date.now()}`, from: last?.id||'n1', to: newId },
            ...(endNode ? [{ id:`e${Date.now()+1}`, from: newId, to: endNode.id }] : [])],
        }));
        setSelNode(newId);
        setNlMsgs(prev => [...prev, { role:'ai', content:`✅ 已添加「${label}」节点（${type==='human'?'人工':type==='decision'?'判断':'处理'}类型）。\n\n节点已在画板中高亮显示，可拖动调整位置，或点击它继续用自然语言修改。` }]);
        setNlLoading(false);
        return;
      }

      if (!matched && (text.includes('删除') || text.includes('清空') || text.includes('重置'))) {
        if (text.includes('清空') || text.includes('重置') || text.includes('全部')) {
          setFlow(DEFAULT_NL_FLOW);
          setNlMsgs(prev => [...prev, { role:'ai', content:'✅ 已重置为默认流程。' }]);
        } else {
          setNlMsgs(prev => [...prev, { role:'ai', content:'请在右侧画板中点击选中要删除的节点，然后告诉我「删除这个节点」，或点击工具栏的「删除」按钮。' }]);
        }
        setNlLoading(false);
        return;
      }

      if (matched) {
        setFlow(matched);
        const hCount = matched.nodes.filter(n=>n.type==='human').length;
        const dCount = matched.nodes.filter(n=>n.type==='decision').length;
        const tags = [hCount>0&&`${hCount}个人工节点`, dCount>0&&`${dCount}个判断分支`].filter(Boolean).join('、');
        setNlMsgs(prev => [...prev, { role:'ai', content:`✅ 已生成业务流程：\n\n• ${matched!.nodes.length} 个节点，${matched!.edges.length} 条连线${tags?`\n• 包含${tags}`:''}

你可以：
• 在右侧画板中拖动节点调整位置
• 点击某个节点，然后用自然语言修改它
• 双击节点直接编辑
• 继续告诉我需要增加或调整的内容` }]);
      } else {
        setNlMsgs(prev => [...prev, { role:'ai', content:`收到你的需求：「${text}」\n\n我支持以下操作：\n\n**生成流程**\n• 「帮我设计巡检告警处置流程」\n• 「设计一个审批工单流程」\n• 「生成报表自动分析流程」\n\n**修改流程**\n• 「增加一个人工复核节点」\n• 「增加判断分支节点」\n• 点击右侧节点后说「改成判断类型」` }]);
      }
      setNlLoading(false);
    }, 700);
  };

  // ── 节点拖动 ────────────────────────────────────────────
  const onNodeDown = (e: React.MouseEvent, id: string) => {
    if (editingNode) return;
    e.stopPropagation();
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const nd = flow.nodes.find(n => n.id === id)!;
    setDraggingId(id);
    setDragOff({ dx: e.clientX - rect.left - nd.x, dy: e.clientY - rect.top - nd.y });
  };
  const onSvgMove = (e: React.MouseEvent) => {
    if (!draggingNodeId) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const nx = Math.max(0, e.clientX - rect.left - dragOff.dx);
    const ny = Math.max(0, e.clientY - rect.top - dragOff.dy);
    setFlow(prev => ({ ...prev, nodes: prev.nodes.map(n => n.id===draggingNodeId ? {...n,x:nx,y:ny} : n) }));
  };
  const onSvgUp = () => setDraggingId(null);

  const addNode = (type: NLFlowNode['type']) => {
    const id = `n${++nodeIdRef.current}`;
    const nonEnd = flow.nodes.filter(n => n.type !== 'end');
    const last = nonEnd[nonEnd.length - 1];
    const end = flow.nodes.find(n => n.type === 'end');
    const labels: Record<string,string> = { process:'新节点', decision:'判断', human:'人工审核', start:'开始', end:'结束' };
    const newNode: NLFlowNode = { id, type, label: labels[type], x: (last?.x||200)+175, y: last?.y||130 };
    setFlow(prev => ({
      nodes: [...prev.nodes.filter(n => n.type !== 'end'), newNode, ...(end ? [{ ...end, x: newNode.x+175 }] : [])],
      edges: [...prev.edges.filter(e => end ? e.to !== end.id : true),
        { id:`e${Date.now()}`, from: last?.id||'n1', to: id },
        ...(end ? [{ id:`e${Date.now()+1}`, from: id, to: end.id }] : [])],
    }));
    setSelNode(id);
    setTimeout(() => handleNodeClick(id), 0);
  };

  const deleteNode = () => {
    if (!selectedNodeId) return;
    const node = flow.nodes.find(n => n.id === selectedNodeId);
    setFlow(prev => ({
      nodes: prev.nodes.filter(n => n.id !== selectedNodeId),
      edges: prev.edges.filter(e => e.from !== selectedNodeId && e.to !== selectedNodeId),
    }));
    setSelNode(null);
    if (node) setNlMsgs(prev => [...prev, { role:'ai', content:`✅ 已删除节点「${node.label}」。` }]);
  };

  const svgW = Math.max(800, ...flow.nodes.map(n => n.x+NW+60));
  const svgH = Math.max(380, ...flow.nodes.map(n => n.y+NH+80));
  const nodeMap = Object.fromEntries(flow.nodes.map(n => [n.id, n]));

  const HINTS = ['设计巡检告警流程','设计审批工单流程','生成报表自动分析流程','增加人工复核节点','增加判断分支'];

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#f5f6fa' }}>

      {/* ── 顶部工具栏 ── */}
      <div style={{ height:52, background:'#fff', borderBottom:'1px solid #e8e8f0', display:'flex', alignItems:'center', padding:'0 20px', gap:12, flexShrink:0, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:12, color:'#9ca3af', flexShrink:0 }}>数字员工</span>
          <div style={{ display:'flex', gap:5 }}>
            {EMPLOYEES_LIST.map(emp => {
              const isActive = emp.id === selectedId;
              return (
                <div key={emp.id} onClick={() => setSelectedId(emp.id)}
                  style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 11px', borderRadius:20, fontSize:12, cursor:'pointer', transition:'all 0.15s',
                    border: isActive ? '1.5px solid #6366F1' : '1px solid #e8e8e8',
                    background: isActive ? '#eef2ff' : '#fafafa',
                    color: isActive ? '#6366F1' : '#6b7280',
                    fontWeight: isActive ? 600 : 400,
                  }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background: STATUS_DOT[emp.status]?.color||'#9ca3af', flexShrink:0 }} />
                  {emp.name}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ flex:1 }} />

        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:11, color:'#9ca3af' }}>添加：</span>
          {([['process','处理','#3B82F6'],['decision','判断','#F59E0B'],['human','人工','#8B5CF6']] as const).map(([t,label,c]) => (
            <div key={t} onClick={() => addNode(t)}
              style={{ padding:'3px 10px', borderRadius:6, fontSize:11, fontWeight:500, cursor:'pointer', border:`1px solid ${c}40`, background:`${c}10`, color:c, transition:'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background=`${c}20`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background=`${c}10`; }}
            >＋{label}</div>
          ))}
          {selectedNodeId && (
            <>
              <div style={{ width:1, height:16, background:'#e8e8e8', margin:'0 2px' }} />
              <div onClick={() => { const n=flow.nodes.find(n=>n.id===selectedNodeId); if(n) setEditNode({...n}); }}
                style={{ padding:'3px 10px', borderRadius:6, fontSize:11, cursor:'pointer', border:'1px solid #e8e8e8', color:'#374151', background:'#f9fafb' }}>编辑</div>
              <div onClick={deleteNode}
                style={{ padding:'3px 10px', borderRadius:6, fontSize:11, cursor:'pointer', border:'1px solid #fecaca', color:'#dc2626', background:'#fef2f2' }}>删除</div>
            </>
          )}
          <div style={{ width:1, height:16, background:'#e8e8e8', margin:'0 2px' }} />
          <div onClick={() => { setFlow(DEFAULT_NL_FLOW); setSelNode(null); }}
            style={{ padding:'3px 10px', borderRadius:6, fontSize:11, cursor:'pointer', border:'1px solid #e8e8e8', color:'#9ca3af', background:'#f9fafb' }}>重置</div>
        </div>
      </div>

      {/* ── 主体：左对话 + 分隔条 + 右画板 ── */}
      <div ref={containerRef} style={{ flex:1, display:'flex', overflow:'hidden', minHeight:0 }}>

        {/* 左：自然语言对话 */}
        <div style={{ width:`${leftPct}%`, display:'flex', flexDirection:'column', background:'#fff', overflow:'hidden', flexShrink:0 }}>

          {/* 对话区头部 */}
          <div style={{ padding:'12px 16px 10px', borderBottom:'1px solid #f0f0f5', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:30, height:30, borderRadius:9, background:'linear-gradient(135deg,#6366F1,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:14 }}>⚡</div>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:'#1a1a1a' }}>AI 流程助手</div>
                <div style={{ fontSize:11, color:'#9ca3af' }}>对话生成 · 节点编辑</div>
              </div>
              <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#10B981' }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'#10B981' }} />在线
              </div>
            </div>
            {/* 当前选中节点上下文条 */}
            {selectedNode && (
              <div style={{ marginTop:8, padding:'6px 10px', borderRadius:8, background:'#f0f0ff', border:'1px solid #e0e7ff', display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background: NODE_CFG[selectedNode.type].border, flexShrink:0 }} />
                <span style={{ fontSize:11, color:'#6366F1', fontWeight:500, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  节点模式：{selectedNode.label}（{selectedNode.type==='process'?'处理':selectedNode.type==='decision'?'判断':selectedNode.type==='human'?'人工':selectedNode.type}）
                </span>
                <span onClick={() => setSelNode(null)}
                  style={{ fontSize:11, color:'#9ca3af', cursor:'pointer', flexShrink:0 }}>×</span>
              </div>
            )}
          </div>

          {/* 消息列表 */}
          <div style={{ flex:1, overflowY:'auto', padding:'14px 14px 8px', display:'flex', flexDirection:'column', gap:12, background:'#f8f9fc' }}>
            {nlMsgs.map((msg,i) => (
              <div key={i} style={{ display:'flex', flexDirection:msg.role==='user'?'row-reverse':'row', alignItems:'flex-end', gap:8 }}>
                {msg.role==='ai' && (
                  <div style={{ width:28,height:28,borderRadius:8,background:'linear-gradient(135deg,#6366F1,#8B5CF6)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:12,flexShrink:0 }}>⚡</div>
                )}
                {msg.role==='user' && (
                  <div style={{ width:28,height:28,borderRadius:8,background:'#e8e8f0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,flexShrink:0 }}>🙂</div>
                )}
                <div style={{ maxWidth:'82%', padding:'9px 12px', borderRadius:msg.role==='user'?'12px 4px 12px 12px':'4px 12px 12px 12px',
                  background: msg.role==='user' ? '#6366F1' : (msg.nodeCtx ? '#f5f3ff' : '#fff'),
                  border: msg.nodeCtx ? '1px solid #e0e7ff' : 'none',
                  color:msg.role==='user'?'#fff':'#1a1a1a', fontSize:12, lineHeight:1.7,
                  boxShadow:'0 1px 4px rgba(0,0,0,0.07)', whiteSpace:'pre-wrap' }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {nlLoading && (
              <div style={{ display:'flex',alignItems:'flex-end',gap:8 }}>
                <div style={{ width:28,height:28,borderRadius:8,background:'linear-gradient(135deg,#6366F1,#8B5CF6)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:12 }}>⚡</div>
                <div style={{ padding:'9px 14px',borderRadius:'4px 12px 12px 12px',background:'#fff',color:'#bbb',fontSize:13,boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>···</div>
              </div>
            )}
            <div ref={nlEndRef} />
          </div>

          {/* 快捷指令 */}
          <div style={{ padding:'8px 12px 4px', borderTop:'1px solid #f0f0f5', background:'#fff', display:'flex', gap:5, flexWrap:'wrap' }}>
            {(selectedNode
              ? [`改成判断类型`, `改成人工节点`, `名称改为数据校验`, `描述改为自动处理数据`, `删除这个节点`]
              : HINTS
            ).map(h => (
              <div key={h} onClick={() => setNlInput(h)}
                style={{ padding:'3px 10px',borderRadius:20,fontSize:11,cursor:'pointer',
                  border: selectedNode ? '1px solid #e0e7ff' : '1px solid #e0e7ff',
                  color:'#6366F1', background: selectedNode ? '#f0f0ff' : '#f5f3ff',
                  transition:'all 0.15s', whiteSpace:'nowrap' }}
                onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.background='#ede9fe';}}
                onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.background= selectedNode ? '#f0f0ff' : '#f5f3ff';}}
              >{h}</div>
            ))}
          </div>

          {/* 输入框 */}
          <div style={{ padding:'8px 12px 12px', background:'#fff' }}>
            <div style={{ display:'flex', alignItems:'flex-end', gap:8, border:`1.5px solid ${selectedNode?'#a5b4fc':'#e8e8e8'}`, borderRadius:12, padding:'8px 10px 8px 14px', background:'#fafafa', transition:'border-color 0.15s' }}>
              <textarea
                ref={nlInputRef}
                value={nlInput}
                onChange={e => setNlInput(e.target.value)}
                onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleNlSend();} }}
                placeholder={selectedNode
                  ? `修改节点「${selectedNode.label}」…\nEnter 发送，Shift+Enter 换行`
                  : `描述你想搭建的业务流程…\nEnter 发送，Shift+Enter 换行`}
                rows={2}
                style={{ flex:1,border:'none',outline:'none',fontSize:12,color:'#333',background:'transparent',resize:'none',lineHeight:1.6,fontFamily:'inherit' }}
              />
              <div onClick={handleNlSend}
                style={{ width:34,height:34,borderRadius:9,background:nlInput.trim()?'linear-gradient(135deg,#6366F1,#8B5CF6)':'#f0f0f0',display:'flex',alignItems:'center',justifyContent:'center',cursor:nlInput.trim()?'pointer':'default',color:nlInput.trim()?'#fff':'#ccc',fontSize:15,flexShrink:0,transition:'all 0.15s' }}>▶</div>
            </div>
          </div>
        </div>

        {/* 分隔条 */}
        <div onMouseDown={onDividerMouseDown}
          style={{ width:5,flexShrink:0,cursor:'col-resize',background:'#f0f0f5',position:'relative',userSelect:'none',transition:'background 0.15s',zIndex:10 }}
          onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.background='#ddd8ff';}}
          onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.background='#f0f0f5';}}>
          <div style={{ position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',display:'flex',flexDirection:'column',gap:3 }}>
            {[0,1,2].map(i=><div key={i} style={{ width:3,height:3,borderRadius:'50%',background:'#c4c4d4' }}/>)}
          </div>
        </div>

        {/* 右：画板 */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', background:'#f8f9fc', overflow:'hidden', minWidth:0 }}>

          {/* 画板标题栏 */}
          <div style={{ padding:'10px 16px', borderBottom:'1px solid #eaeaf5', background:'#fff', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
            <span style={{ fontSize:13, fontWeight:600, color:'#1a1a1a' }}>流程画板</span>
            <span style={{ fontSize:11, color:'#9ca3af' }}>· {current.name} · {flow.nodes.length} 节点 {flow.edges.length} 连线</span>
            {selectedNode && (
              <div style={{ display:'flex', alignItems:'center', gap:6, padding:'2px 10px', borderRadius:20, background:'#f0f0ff', border:'1px solid #e0e7ff' }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background: NODE_CFG[selectedNode.type].border }} />
                <span style={{ fontSize:11, color:'#6366F1', fontWeight:500 }}>已选中：{selectedNode.label}</span>
                <span onClick={() => setSelNode(null)} style={{ fontSize:12, color:'#9ca3af', cursor:'pointer' }}>×</span>
              </div>
            )}
            <div style={{ marginLeft:'auto', fontSize:11, color:'#9ca3af' }}>点击节点 → 左侧对话修改 · 双击直接编辑 · 拖动调整位置</div>
          </div>

          {/* SVG 画板 */}
          <div style={{ flex:1, overflow:'auto' }}>
            <svg ref={svgRef} width={svgW} height={svgH}
              style={{ display:'block', cursor:draggingNodeId?'grabbing':'default', userSelect:'none', minWidth:'100%', minHeight:'100%' }}
              onMouseMove={onSvgMove} onMouseUp={onSvgUp} onMouseLeave={onSvgUp}
              onClick={e => { if(e.target===svgRef.current||(e.target as SVGElement).tagName==='rect'&&(e.target as SVGRectElement).getAttribute('fill')==='url(#bp-grid)') setSelNode(null); }}>
              <defs>
                <pattern id="bp-grid" width={28} height={28} patternUnits="userSpaceOnUse">
                  <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#e8eaf2" strokeWidth="0.6"/>
                </pattern>
                <marker id="bp-arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="#94a3b8"/>
                </marker>
                <filter id="node-shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#6366F1" floodOpacity="0.18"/>
                </filter>
              </defs>
              <rect width="100%" height="100%" fill="url(#bp-grid)" onClick={() => setSelNode(null)}/>

              {/* 连线 */}
              {flow.edges.map(edge => {
                const fn=nodeMap[edge.from]; const tn=nodeMap[edge.to];
                if(!fn||!tn) return null;
                const path=edgePath(fn,tn);
                const fc=nodeCenter(fn); const tc=nodeCenter(tn);
                const mx=(fc.cx+tc.cx)/2; const my=(fc.cy+tc.cy)/2;
                return (
                  <g key={edge.id}>
                    <path d={path} fill="none" stroke="#94a3b8" strokeWidth={1.8} markerEnd="url(#bp-arrow)"/>
                    {edge.label && (
                      <g>
                        <rect x={mx-18} y={my-10} width={36} height={18} rx={5} fill="#fff" stroke="#e0e7ef" strokeWidth={1}/>
                        <text x={mx} y={my+5} textAnchor="middle" fontSize={10} fill="#6b7280" fontWeight={500}>{edge.label}</text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* 节点 */}
              {flow.nodes.map(node => {
                const cfg=NODE_CFG[node.type];
                const isSel=selectedNodeId===node.id;
                return (
                  <g key={node.id} transform={`translate(${node.x},${node.y})`}
                    onMouseDown={e => { onNodeDown(e, node.id); }}
                    onClick={e => { e.stopPropagation(); handleNodeClick(node.id); }}
                    onDoubleClick={e => { e.stopPropagation(); setEditNode({...node}); }}
                    style={{ cursor:'pointer' }}>
                    {/* 选中光晕 */}
                    {isSel && <rect x={-5} y={-5} width={NW+10} height={NH+10} rx={15} fill="none" stroke="#6366F1" strokeWidth={2.5} strokeDasharray="5 3" opacity={0.7}/>}
                    {node.type==='decision' ? (
                      <>
                        <polygon points={`${NW/2},4 ${NW-4},${NH/2} ${NW/2},${NH-4} 4,${NH/2}`}
                          fill={cfg.bg} stroke={isSel?'#6366F1':cfg.border} strokeWidth={isSel?2.5:1.5}
                          filter={isSel?'url(#node-shadow)':undefined}/>
                        <text x={NW/2} y={NH/2+5} textAnchor="middle" fontSize={11} fontWeight={600} fill={cfg.text}>{node.label}</text>
                      </>
                    ) : (node.type==='start'||node.type==='end') ? (
                      <>
                        <rect x={8} y={10} width={NW-16} height={NH-20} rx={20}
                          fill={cfg.bg} stroke={isSel?'#6366F1':cfg.border} strokeWidth={isSel?2.5:1.5}
                          filter={isSel?'url(#node-shadow)':undefined}/>
                        <text x={NW/2} y={NH/2+5} textAnchor="middle" fontSize={12} fontWeight={700} fill={cfg.text}>{cfg.icon} {node.label}</text>
                      </>
                    ) : (
                      <>
                        <rect x={0} y={0} width={NW} height={NH} rx={10}
                          fill={cfg.bg} stroke={isSel?'#6366F1':cfg.border} strokeWidth={isSel?2.5:1.5}
                          filter={isSel?'url(#node-shadow)':undefined}/>
                        <text x={NW/2} y={17} textAnchor="middle" fontSize={10} fill={cfg.text} opacity={0.6}>{cfg.icon}</text>
                        <text x={NW/2} y={35} textAnchor="middle" fontSize={12} fontWeight={600} fill={cfg.text}>{node.label}</text>
                        {node.desc && <text x={NW/2} y={50} textAnchor="middle" fontSize={9} fill={cfg.text} opacity={0.5}>{node.desc.length>16?node.desc.slice(0,16)+'…':node.desc}</text>}
                      </>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* 节点编辑弹窗（双击） */}
      {editingNode && (
        <div style={{ position:'fixed',inset:0,zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.4)' }} onClick={()=>setEditNode(null)}>
          <div style={{ background:'#fff',borderRadius:16,padding:28,width:340,boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontSize:15,fontWeight:700,marginBottom:18,color:'#1a1a1a' }}>编辑节点</div>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:12,color:'#6b7280',marginBottom:6 }}>节点类型</div>
              <div style={{ display:'flex',gap:6,flexWrap:'wrap' }}>
                {(['process','decision','human','start','end'] as const).map(t=>(
                  <div key={t} onClick={()=>setEditNode(prev=>prev?{...prev,type:t}:null)}
                    style={{ padding:'4px 12px',borderRadius:7,fontSize:11,cursor:'pointer',transition:'all 0.15s',
                      border:`1px solid ${editingNode.type===t?NODE_CFG[t].border:'#e8e8e8'}`,
                      background:editingNode.type===t?NODE_CFG[t].bg:'#f9fafb',
                      color:editingNode.type===t?NODE_CFG[t].text:'#6b7280',
                      fontWeight:editingNode.type===t?600:400 }}>
                    {NODE_CFG[t].icon} {t==='process'?'处理':t==='decision'?'判断':t==='human'?'人工':t==='start'?'开始':'结束'}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:12,color:'#6b7280',marginBottom:6 }}>节点名称</div>
              <input value={editingNode.label} onChange={e=>setEditNode(prev=>prev?{...prev,label:e.target.value}:null)}
                style={{ width:'100%',border:'1.5px solid #e8e8e8',borderRadius:9,padding:'8px 12px',fontSize:13,outline:'none',boxSizing:'border-box' }}
                onFocus={e=>{e.currentTarget.style.borderColor='#6366F1';}} onBlur={e=>{e.currentTarget.style.borderColor='#e8e8e8';}}/>
            </div>
            <div style={{ marginBottom:22 }}>
              <div style={{ fontSize:12,color:'#6b7280',marginBottom:6 }}>描述（可选）</div>
              <input value={editingNode.desc||''} onChange={e=>setEditNode(prev=>prev?{...prev,desc:e.target.value}:null)}
                placeholder="简要说明节点的执行内容"
                style={{ width:'100%',border:'1.5px solid #e8e8e8',borderRadius:9,padding:'8px 12px',fontSize:13,outline:'none',boxSizing:'border-box' }}
                onFocus={e=>{e.currentTarget.style.borderColor='#6366F1';}} onBlur={e=>{e.currentTarget.style.borderColor='#e8e8e8';}}/>
            </div>
            <div style={{ display:'flex',gap:10,justifyContent:'flex-end' }}>
              <div onClick={()=>setEditNode(null)}
                style={{ padding:'8px 18px',borderRadius:9,fontSize:13,cursor:'pointer',border:'1px solid #e8e8e8',color:'#6b7280' }}>取消</div>
              <div onClick={()=>{ if(!editingNode) return; setFlow(prev=>({...prev,nodes:prev.nodes.map(n=>n.id===editingNode.id?editingNode:n)})); setEditNode(null); }}
                style={{ padding:'8px 18px',borderRadius:9,fontSize:13,cursor:'pointer',background:'linear-gradient(135deg,#6366F1,#8B5CF6)',color:'#fff',fontWeight:600 }}>保存</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── 侧边栏尺寸 ────────────────────────────────────────────
const SIDEBAR_EXPANDED = 192;
const SIDEBAR_COLLAPSED = 56;

// ── Vibe Coding 数据 ──────────────────────────────────────
const VC_SKILLS = [
  { id: 'vc1', name: 'Claude Code',       icon: '⚡', desc: 'AI 原生编程助手，多语言代码生成、调试与全链路重构', tag: 'Code Agent',  tagColor: '#7C3AED', tagBg: '#F5F3FF', tagBorder: '#DDD6FE' },
  { id: 'vc2', name: 'Superpowers',       icon: '🦸', desc: '多模型 AI 超能力增强包，提升推理、规划与代码质量',  tag: 'Enhancement', tagColor: '#2563EB', tagBg: '#EFF6FF', tagBorder: '#BFDBFE' },
  { id: 'vc3', name: 'Everything Claude', icon: '🔮', desc: '全功能 Claude 套件，覆盖代码库分析与全栈研发场景',  tag: 'Full Suite',  tagColor: '#0891B2', tagBg: '#ECFEFF', tagBorder: '#A5F3FC' },
  { id: 'vc4', name: 'Browser Use',       icon: '🌐', desc: 'AI 自主操控浏览器，网页交互、表单填写与自动化测试', tag: 'Automation',  tagColor: '#059669', tagBg: '#ECFDF5', tagBorder: '#A7F3D0' },
  { id: 'vc5', name: 'Computer Use',      icon: '🖥️', desc: 'AI 直接操作桌面应用，跨软件全流程自动化工作',       tag: 'Automation',  tagColor: '#059669', tagBg: '#ECFDF5', tagBorder: '#A7F3D0' },
  { id: 'vc6', name: 'Code Sandbox',      icon: '🧪', desc: '沙箱环境安全执行代码，支持 Python / JS / Shell',    tag: 'Runtime',     tagColor: '#D97706', tagBg: '#FFFBEB', tagBorder: '#FDE68A' },
];

const VC_SKILL_LIST = [
  { id: 'sk1',    name: '网络搜索',     type: 'Skill',  icon: '🔍', desc: '实时搜索互联网信息，获取最新资讯与数据' },
  { id: 'sk2',    name: '飞书文档',     type: 'Skill',  icon: '📄', desc: '飞书文档读写与管理，支持多维表格操作' },
  { id: 'sk3',    name: 'Python 执行',  type: 'Skill',  icon: '🐍', desc: '执行 Python 代码，处理结构化数据与自动化任务' },
  { id: 'sk4',    name: 'PDF 解析',     type: 'Skill',  icon: '📃', desc: '解析 PDF 文档内容，提取文字、表格与结构化信息' },
  { id: 'sk-d1',  name: '图表生成',     type: 'Skill',  icon: '📈', desc: '将结构化数据转换为可视化图表（柱/折/饼/散点图）' },
  { id: 'sk-d2',  name: 'SQL 查询',     type: 'Skill',  icon: '🗃️', desc: '自然语言转 SQL，查询并汇总关系型数据库数据' },
  { id: 'sk-d3',  name: '图片文字提取', type: 'Skill',  icon: '✂️', desc: '从图片与扫描件中提取文字（OCR 识别）' },
  { id: 'sk-of1', name: 'Word 文档',    type: 'Office', icon: '📝', desc: '智能生成、编辑、格式化 Word 文档，支持模板与样式' },
  { id: 'sk-of2', name: 'Excel 数据',   type: 'Office', icon: '📊', desc: '读写 Excel，执行数据分析、透视表与图表生成' },
  { id: 'sk-of3', name: 'PowerPoint',   type: 'Office', icon: '📑', desc: 'AI 生成与编辑 PPT，支持主题、排版与动效配置' },
  { id: 'sk-of4', name: 'Outlook 邮件', type: 'Office', icon: '📧', desc: '收发邮件、日历管理、邮件模板智能填充与自动回复' },
  { id: 'sk5',    name: '内容审核流程', type: '工作流', icon: '⚡', desc: '多节点内容合规审查工作流' },
  { id: 'sk-w2',  name: '审批流程',     type: '工作流', icon: '✅', desc: '触发并跟踪企业内部审批流，支持多级审核与抄送' },
  { id: 'sk-w3',  name: '定时任务',     type: '工作流', icon: '⏰', desc: '设置定时触发任务，自动执行报告生成与消息推送' },
];

const VC_MCP_LIST = [
  { id: 'mcp-s1', name: 'Brave Search MCP',  desc: '隐私友好的实时联网搜索，支持网页与新闻全文检索',       icon: '🔍', cat: '搜索' },
  { id: 'mcp-s2', name: 'Google Search MCP', desc: 'Google 实时搜索，覆盖全球网页内容与知识图谱',           icon: '🌐', cat: '搜索' },
  { id: 'mcp-v1', name: '视觉理解 MCP',      desc: '图片、截图、文档图像的 AI 多模态视觉识别与内容分析',   icon: '👁️', cat: '多模态' },
  { id: 'mcp-v2', name: '语音识别 MCP',      desc: '音频与视频转录为文本，支持中英文多语种实时识别',       icon: '🎙️', cat: '多模态' },
  { id: 'mcp-f1', name: '文件系统 MCP',      desc: '读写本地与云端文件，支持批量处理与目录管理',           icon: '📁', cat: '文件' },
  { id: 'mcp-f2', name: 'Everything MCP',    desc: '集成搜索、文件、浏览器等全功能 MCP 超级套件',          icon: '🔮', cat: '文件' },
  { id: 'mcp1',   name: '数据库连接器',      desc: '连接企业内部 MySQL / Oracle / PostgreSQL',             icon: '🗄️', cat: '协作' },
  { id: 'mcp2',   name: '飞书 MCP',          desc: '读写飞书文档、日历、审批、多维表格',                   icon: '📋', cat: '协作' },
  { id: 'mcp3',   name: 'GitHub MCP',        desc: 'PR 管理、Issue 操作、代码仓库读写',                    icon: '🐙', cat: '协作' },
  { id: 'mcp-b1', name: 'Slack MCP',         desc: '发送消息、管理频道、搜索历史对话记录',                 icon: '💬', cat: '协作' },
  { id: 'mcp-b2', name: 'Notion MCP',        desc: '读写 Notion 数据库、页面与看板内容',                   icon: '📓', cat: '协作' },
  { id: 'mcp4',   name: 'CRM 连接器',        desc: '客户数据读写、商机跟踪、销售漏斗分析',                 icon: '📊', cat: '业务' },
  { id: 'mcp5',   name: 'ERP 连接器',        desc: '供应链、库存、财务数据实时同步',                       icon: '🏭', cat: '业务' },
];

const VC_TYPE_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  'Skill':  { color: '#6366F1', bg: '#eef2ff', border: '#c7d2fe' },
  'Office': { color: '#0EA5E9', bg: '#f0f9ff', border: '#bae6fd' },
  '工作流': { color: '#10B981', bg: '#f0fdf4', border: '#a7f3d0' },
};

const VibeCodingPage: React.FC = () => {
  // 技能商店中 published 的技能（联动来源）
  const storeSkills = MOCK_SKILLS.filter(s => s.status === 'published');

  const [enabledVc,    setEnabledVc]    = useState<Record<string, boolean>>({ vc1: true, vc2: false, vc3: false, vc4: false, vc5: false, vc6: true });
  // 官方预置 skills 开关
  const [enabledOfficialSk, setEnabledOfficialSk] = useState<Record<string, boolean>>({ sk1: true, sk2: true });
  // 技能商店 skills 开关（key = Skill.id）
  const [enabledStoreSk, setEnabledStoreSk] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    storeSkills.forEach(s => { init[s.id] = false; });
    return init;
  });
  const [enabledMcp,   setEnabledMcp]   = useState<Record<string, boolean>>({ 'mcp-s1': true, 'mcp-v1': true });
  const [search, setSearch]             = useState('');
  const [activeTab, setActiveTab]       = useState<'overview' | 'skills' | 'mcp'>('overview');

  const enabledVcCount       = Object.values(enabledVc).filter(Boolean).length;
  const enabledOfficialSkCnt = Object.values(enabledOfficialSk).filter(Boolean).length;
  const enabledStoreSkCnt    = Object.values(enabledStoreSk).filter(Boolean).length;
  const enabledSkCount       = enabledOfficialSkCnt + enabledStoreSkCnt;
  const enabledMcpCount      = Object.values(enabledMcp).filter(Boolean).length;

  const filterItems = <T extends { name: string; desc: string }>(items: T[]) =>
    search.trim() ? items.filter(i => i.name.includes(search.trim()) || i.desc.includes(search.trim())) : items;

  const TabBtn: React.FC<{ tab: typeof activeTab; label: string; count: number }> = ({ tab, label, count }) => (
    <div
      onClick={() => setActiveTab(tab)}
      style={{
        padding: '7px 18px', borderRadius: 8, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
        fontWeight: activeTab === tab ? 600 : 400,
        color: activeTab === tab ? '#6366F1' : '#6b7280',
        background: activeTab === tab ? '#eef2ff' : 'transparent',
        border: activeTab === tab ? '1px solid #c7d2fe' : '1px solid transparent',
        display: 'flex', alignItems: 'center', gap: 6,
      }}
    >
      {label}
      <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 10, background: activeTab === tab ? '#6366F1' : '#e5e7eb', color: activeTab === tab ? '#fff' : '#6b7280', fontWeight: 600 }}>{count}</span>
    </div>
  );

  // 技能商店 Skill 对应的分类颜色
  const CAT_CFG: Record<string, { color: string; bg: string; border: string }> = {
    '文档处��': { color: '#6366F1', bg: '#eef2ff', border: '#c7d2fe' },
    '数据分析': { color: '#3B82F6', bg: '#eff6ff', border: '#bfdbfe' },
    '通信集成': { color: '#10B981', bg: '#f0fdf4', border: '#a7f3d0' },
    '法务合规': { color: '#8B5CF6', bg: '#f5f3ff', border: '#ddd6fe' },
    '人力资源': { color: '#F59E0B', bg: '#fffbeb', border: '#fde68a' },
    '安全审计': { color: '#EF4444', bg: '#fef2f2', border: '#fecaca' },
    '代码工具': { color: '#0891B2', bg: '#ecfeff', border: '#a5f3fc' },
    '搜索检索': { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  };

  const TIER_CFG: Record<string, { label: string; color: string; bg: string }> = {
    free:       { label: '免审批', color: '#059669', bg: '#ecfdf5' },
    restricted: { label: '需审批', color: '#d97706', bg: '#fffbeb' },
    secret:     { label: '涉密',   color: '#dc2626', bg: '#fef2f2' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 页头 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)', color: '#fff', fontSize: 12, fontWeight: 700 }}>
              <ThunderboltOutlined /> Vibe Coding
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#111827' }}>AI 编程超能力中心</span>
          </div>
          <div style={{ fontSize: 13, color: '#9ca3af' }}>管理 Vibe Coding 超能力、官方预置技能与来自技能商店的已发布技能，全局启用后将作为员工创建时的默认配置</div>
        </div>
        <Input
          prefix={<SearchOutlined style={{ color: '#bbb' }} />}
          placeholder="搜索能力名称..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 220, borderRadius: 8 }}
          allowClear
        />
      </div>

      {/* 统计卡 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {[
          { label: 'Vibe Coding 超能力', count: enabledVcCount,  total: VC_SKILLS.length,                        color: '#6366F1', bg: '#eef2ff', icon: '⚡' },
          { label: 'Skills（官方+商店）', count: enabledSkCount, total: VC_SKILL_LIST.length + storeSkills.length, color: '#10B981', bg: '#f0fdf4', icon: '🛠️' },
          { label: 'MCP Server',          count: enabledMcpCount, total: VC_MCP_LIST.length,                       color: '#F59E0B', bg: '#fefce8', icon: '🔌' },
        ].map(stat => (
          <div key={stat.label} style={{ padding: '16px 20px', borderRadius: 12, background: '#fff', border: '1px solid #e8e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 20 }}>{stat.icon}</span>
              <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{stat.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: stat.color }}>{stat.count}</span>
              <span style={{ fontSize: 13, color: '#bbb' }}>/ {stat.total} 已启用</span>
            </div>
            <div style={{ marginTop: 8, height: 4, borderRadius: 4, background: '#f3f4f6' }}>
              <div style={{ height: '100%', borderRadius: 4, background: stat.color, width: `${Math.round(stat.count / Math.max(stat.total, 1) * 100)}%`, transition: 'width 0.3s' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Tab 切换 */}
      <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid #f0f0f0', paddingBottom: 12 }}>
        <TabBtn tab="overview" label="Vibe Coding 超能力" count={enabledVcCount} />
        <TabBtn tab="skills"   label="Skills / 工作流"   count={enabledSkCount} />
        <TabBtn tab="mcp"      label="MCP Server"         count={enabledMcpCount} />
      </div>

      {/* ── Overview：Vibe Coding 超能力卡 ── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
          {filterItems(VC_SKILLS).map(sk => {
            const on = !!enabledVc[sk.id];
            return (
              <div key={sk.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 12, border: on ? `1.5px solid #6366F1` : '1px solid #e8e8e8', background: on ? 'linear-gradient(135deg,#f5f4ff,#fafafe)' : '#fff', transition: 'all 0.15s', boxShadow: on ? '0 2px 8px rgba(99,102,241,0.1)' : '0 1px 3px rgba(0,0,0,0.04)' }}>
                <span style={{ fontSize: 28, flexShrink: 0 }}>{sk.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: on ? 700 : 500, color: on ? '#4338CA' : '#1a1a1a' }}>{sk.name}</span>
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, color: sk.tagColor, background: sk.tagBg, border: `1px solid ${sk.tagBorder}`, fontWeight: 600 }}>{sk.tag}</span>
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, color: '#7C3AED', background: '#f5f3ff', border: '1px solid #ddd6fe', fontWeight: 600 }}>官方</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>{sk.desc}</div>
                </div>
                <Switch
                  checked={on}
                  onChange={v => setEnabledVc(prev => ({ ...prev, [sk.id]: v }))}
                  style={{ background: on ? '#6366F1' : undefined, flexShrink: 0 }}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* ── Skills 列表（官方预置 + 技能商店联动） ── */}
      {activeTab === 'skills' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ── 官方预置 ── */}
          {(() => {
            const groups = ['Skill', 'Office', '工作流'] as const;
            const anyVisible = groups.some(grp => filterItems(VC_SKILL_LIST.filter(s => s.type === grp)).length > 0);
            if (!anyVisible) return null;
            return (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 12, background: '#f5f3ff', color: '#7C3AED', border: '1px solid #ddd6fe', fontWeight: 700 }}>官方预置</span>
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>由平台统一提供，无需审批即可启用</span>
                </div>
                {groups.map(grp => {
                  const items = filterItems(VC_SKILL_LIST.filter(s => s.type === grp));
                  if (items.length === 0) return null;
                  const cfg = VC_TYPE_COLORS[grp];
                  return (
                    <div key={grp} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontWeight: 600 }}>{grp}</span>
                        <span style={{ fontSize: 11, color: '#bbb' }}>{items.length} 项</span>
                      </div>
                      <div style={{ border: '1px solid #f0f0f0', borderRadius: 12, overflow: 'hidden' }}>
                        {items.map((sk, idx) => {
                          const on = !!enabledOfficialSk[sk.id];
                          return (
                            <div key={sk.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: idx < items.length - 1 ? '1px solid #f5f5f5' : 'none', background: '#fff' }}>
                              <span style={{ fontSize: 18, flexShrink: 0 }}>{sk.icon}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', marginBottom: 1 }}>{sk.name}</div>
                                <div style={{ fontSize: 11, color: '#9ca3af' }}>{sk.desc}</div>
                              </div>
                              <Switch checked={on} size="small" onChange={v => setEnabledOfficialSk(prev => ({ ...prev, [sk.id]: v }))} style={{ background: on ? cfg.color : undefined, flexShrink: 0 }} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* ── 来自技能商店 ── */}
          {(() => {
            const items = filterItems(storeSkills);
            if (items.length === 0) return search.trim() ? null : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#bbb', fontSize: 13, border: '1px dashed #e8e8e8', borderRadius: 10 }}>
                技能商店暂无已发布技能
              </div>
            );
            return (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 12, background: '#f0fdf4', color: '#059669', border: '1px solid #a7f3d0', fontWeight: 700 }}>来自技能商店</span>
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>已发布的技能，启用后员工可直接调用</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: '#6366F1', cursor: 'pointer', fontWeight: 500 }}
                    onClick={() => { window.location.hash = 'digital-employee-skills'; }}
                  >前往技能商店 →</span>
                </div>
                <div style={{ border: '1px solid #f0f0f0', borderRadius: 12, overflow: 'hidden' }}>
                  {items.map((sk, idx) => {
                    const on = !!enabledStoreSk[sk.id];
                    const catCfg = CAT_CFG[sk.category] ?? { color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb' };
                    const tierCfg = TIER_CFG[sk.tier] ?? { label: sk.tier, color: '#6b7280', bg: '#f3f4f6' };
                    return (
                      <div key={sk.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: idx < items.length - 1 ? '1px solid #f5f5f5' : 'none', background: on ? '#fafcff' : '#fff', transition: 'background 0.12s' }}>
                        {/* 左侧 icon 区 */}
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: catCfg.bg, border: `1px solid ${catCfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, color: catCfg.color, fontWeight: 700 }}>
                          {sk.name.charAt(0)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                            <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{sk.name}</span>
                            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: catCfg.bg, color: catCfg.color, border: `1px solid ${catCfg.border}`, fontWeight: 600 }}>{sk.category}</span>
                            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: tierCfg.bg, color: tierCfg.color, fontWeight: 600 }}>{tierCfg.label}</span>
                            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#f1f5f9', color: '#64748b', fontFamily: 'monospace' }}>{sk.protocol}</span>
                          </div>
                          <div style={{ fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sk.desc}</div>
                          <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>by {sk.author} · {sk.version} · 已挂载 {sk.mountCount} 个员工</div>
                        </div>
                        <Switch checked={on} size="small" onChange={v => setEnabledStoreSk(prev => ({ ...prev, [sk.id]: v }))} style={{ background: on ? '#10B981' : undefined, flexShrink: 0 }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── MCP Server 列表 ── */}
      {activeTab === 'mcp' && (() => {
        const cats = ['搜索', '多模态', '文件', '协作', '业务'] as const;
        const catColors: Record<string, { color: string; bg: string }> = {
          '搜索':  { color: '#6366F1', bg: '#eef2ff' },
          '多模态':{ color: '#8B5CF6', bg: '#f5f3ff' },
          '文件':  { color: '#0EA5E9', bg: '#f0f9ff' },
          '协作':  { color: '#10B981', bg: '#f0fdf4' },
          '业务':  { color: '#F59E0B', bg: '#fefce8' },
        };
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {cats.map(cat => {
              const items = filterItems(VC_MCP_LIST.filter(m => m.cat === cat));
              if (items.length === 0) return null;
              const cfg = catColors[cat];
              return (
                <div key={cat}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 12, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40`, fontWeight: 700 }}>{cat}</span>
                    <span style={{ fontSize: 12, color: '#bbb' }}>{items.length} 项</span>
                  </div>
                  <div style={{ border: '1px solid #f0f0f0', borderRadius: 12, overflow: 'hidden' }}>
                    {items.map((mcp, idx) => {
                      const on = !!enabledMcp[mcp.id];
                      return (
                        <div key={mcp.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: idx < items.length - 1 ? '1px solid #f5f5f5' : 'none', background: '#fff', transition: 'background 0.12s' }}
                          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#fafafa'}
                          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = '#fff'}
                        >
                          <span style={{ fontSize: 22, flexShrink: 0 }}>{mcp.icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', marginBottom: 2 }}>{mcp.name}</div>
                            <div style={{ fontSize: 11, color: '#9ca3af' }}>{mcp.desc}</div>
                          </div>
                          {on && <Badge status="processing" color={cfg.color} text={<span style={{ fontSize: 11, color: cfg.color }}>已启用</span>} />}
                          <Switch
                            checked={on}
                            size="small"
                            onChange={v => setEnabledMcp(prev => ({ ...prev, [mcp.id]: v }))}
                            style={{ background: on ? cfg.color : undefined, flexShrink: 0 }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
};

// ── 主题色 ────────────────────────────────────────────────
const PRIMARY = '#6366F1';
const PRIMARY_LIGHT = '#EEF2FF';

interface DigitalEmployeeHubProps {
  initialTab?: PageKey | 'workbench' | 'library' | 'domain' | 'scheduled' | 'profile' | 'process';
  onBackToAdmin?: () => void;
}

const DigitalEmployeeHub: React.FC<DigitalEmployeeHubProps> = ({ initialTab, onBackToAdmin }) => {
  const getInitialPage = (): PageKey => {
    if (initialTab && ['frontend','library','profile','scheduled','security','approval'].includes(initialTab as string))
      return initialTab as PageKey;
    const hash = window.location.hash.slice(1);
    return HASH_MAP[hash] ?? 'frontend';
  };

  const [page, setPage]         = useState<PageKey>(getInitialPage());
  const [navMode, setNavMode]   = useState<NavMode>('sidebar');   // 默认左侧菜单栏
  const [collapsed, setCollapsed] = useState(false);               // 侧边栏折叠

  // 同步 hash
  useEffect(() => {
    const sync = () => {
      const hash = window.location.hash.slice(1);
      const next = HASH_MAP[hash];
      if (next) setPage(next);
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const handleNav = (key: PageKey) => {
    setPage(key);
    window.location.hash = PAGE_HASH[key];
  };

  const sidebarW = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  // ── 活动项信息 ────────────────────────────────────────
  const activeItem = NAV_ITEMS.find(n => n.key === page)!;

  // ── 内容区 ────────────────────────────────────────────
  const renderContent = () => {
    // 数字员工前台：flex 撑满，不额外加 padding
    if (page === 'frontend') {
      return (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
          <DigitalEmployeePanel />
        </div>
      );
    }
    return (
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {page === 'library'    && <div style={{ padding: 24 }}><DigitalEmployeeLibrary /></div>}
        {page === 'security'   && <div style={{ padding: 24 }}><SecurityCenter /></div>}
        {page === 'approval'   && <div style={{ padding: 24 }}><ApprovalCenter /></div>}
        {page === 'profile'    && <DigitalEmployeeProfile embedded />}
        {page === 'scheduled'  && <ScheduledTasks />}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════
  //  模式 A：左侧菜单栏（sidebar）
  // ════════════════════════════════════════════════════════
  if (navMode === 'sidebar') {
    return (
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f5f6fa' }}>

        {/* ── 左侧菜单 ── */}
        <div style={{
          width: sidebarW,
          flexShrink: 0,
          background: '#fff',
          borderRight: '1px solid #e8e8f0',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.22s cubic-bezier(.4,0,.2,1)',
          overflow: 'hidden',
          boxShadow: '2px 0 8px rgba(99,102,241,0.06)',
          zIndex: 10,
        }}>

          {/* Logo 区 */}
          <div style={{
            height: 56,
            display: 'flex',
            alignItems: 'center',
            padding: collapsed ? '0' : '0 14px',
            justifyContent: collapsed ? 'center' : 'space-between',
            borderBottom: '1px solid #f0f0f8',
            flexShrink: 0,
          }}>
            {!collapsed && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, overflow: 'hidden' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <TeamOutlined style={{ color: '#fff', fontSize: 14 }} />
                </div>
                <div style={{ lineHeight: 1.25, overflow: 'hidden' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', whiteSpace: 'nowrap' }}>数字员工</div>
                  <div style={{ fontSize: 10, color: '#aaa', whiteSpace: 'nowrap' }}>企业 AI 员工管理中心</div>
                </div>
              </div>
            )}
            {/* 折叠按钮 */}
            <div
              onClick={() => setCollapsed(c => !c)}
              style={{
                width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#aaa', fontSize: 14,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f5f4ff'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </div>
          </div>

          {/* 返回按钮 */}
          {onBackToAdmin && (
            <div style={{ padding: collapsed ? '8px 0' : '8px 10px', borderBottom: '1px solid #f5f5f5', flexShrink: 0 }}>
              <Tooltip title={collapsed ? '返回' : ''} placement="right">
                <div
                  onClick={onBackToAdmin}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                    borderRadius: 8, cursor: 'pointer', color: '#888', fontSize: 12,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f5f5f5'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                >
                  <ArrowLeftOutlined style={{ fontSize: 13 }} />
                  {!collapsed && <span>返回主台</span>}
                </div>
              </Tooltip>
            </div>
          )}

          {/* 菜单列表 */}
          <div style={{ flex: 1, padding: collapsed ? '8px 0' : '8px 8px', overflowY: 'auto' }}>
            {NAV_ITEMS.map((item, idx) => {
              const active = page === item.key;
              // 分组标题（不折叠时、是分组首项时显示）
              const showGroup = !collapsed && item.group &&
                (idx === 0 || NAV_ITEMS[idx - 1].group !== item.group);
              return (
                <div key={item.key}>
                  {showGroup && (
                    <div style={{
                      fontSize: 10, fontWeight: 600, color: '#bbb', letterSpacing: 1,
                      padding: idx === 0 ? '6px 10px 4px' : '14px 10px 4px',
                      textTransform: 'uppercase',
                    }}>
                      {item.group}
                    </div>
                  )}
                  <Tooltip title={collapsed ? item.label : ''} placement="right">
                    <div
                      onClick={() => handleNav(item.key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: collapsed ? '10px 0' : '9px 10px',
                        borderRadius: 9,
                        cursor: 'pointer',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        background: active ? PRIMARY_LIGHT : 'transparent',
                        transition: 'all 0.15s',
                        marginBottom: 2,
                        position: 'relative',
                      }}
                      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = '#f5f4ff'; }}
                      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                    >
                      {/* 活动指示条 */}
                      {active && (
                        <div style={{
                          position: 'absolute', left: 0, top: '20%', bottom: '20%',
                          width: 3, borderRadius: 2,
                          background: 'linear-gradient(180deg, #6366F1, #8B5CF6)',
                        }} />
                      )}
                      <span style={{
                        fontSize: 16,
                        color: active ? PRIMARY : '#888',
                        flexShrink: 0,
                        transition: 'color 0.15s',
                      }}>
                        {item.icon}
                      </span>
                      {!collapsed && (
                        <div style={{ overflow: 'hidden', flex: 1 }}>
                          <div style={{
                            fontSize: 13, fontWeight: active ? 600 : 400,
                            color: active ? PRIMARY : '#333',
                            whiteSpace: 'nowrap', lineHeight: 1.3,
                          }}>
                            {item.label}
                          </div>
                          <div style={{
                            fontSize: 10, color: active ? `${PRIMARY}90` : '#bbb',
                            whiteSpace: 'nowrap', lineHeight: 1.3,
                          }}>
                            {item.desc}
                          </div>
                        </div>
                      )}
                    </div>
                  </Tooltip>
                </div>
              );
            })}
          </div>

          {/* 底部：切换模式 */}
          {!collapsed && (
            <div style={{ padding: '10px 8px', borderTop: '1px solid #f0f0f8', flexShrink: 0 }}>
              <div
                onClick={() => setNavMode('topbar')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                  borderRadius: 8, cursor: 'pointer', color: '#aaa', fontSize: 11,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f5f5f5'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
              >
                <BarsOutlined style={{ fontSize: 13 }} />
                切换为顶部标签栏
              </div>
            </div>
          )}
          {collapsed && (
            <div style={{ padding: '10px 0', borderTop: '1px solid #f0f0f8', flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
              <Tooltip title="切换为顶部标签栏" placement="right">
                <div
                  onClick={() => setNavMode('topbar')}
                  style={{
                    width: 30, height: 30, borderRadius: 7,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#bbb', fontSize: 14,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f5f5f5'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                >
                  <BarsOutlined />
                </div>
              </Tooltip>
            </div>
          )}
        </div>

        {/* ── 右侧内容 ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {renderContent()}
        </div>

      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  //  模式 B：顶部标签栏（topbar）
  // ════════════════════════════════════════════════════════
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#f5f6fa' }}>

      {/* ── 顶部导航栏 ── */}
      <div style={{
        height: 56,
        background: '#fff',
        borderBottom: '1px solid #e8e8f0',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        flexShrink: 0,
        boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
        gap: 0,
      }}>
        {/* 品牌 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginRight: 28, flexShrink: 0 }}>
          {onBackToAdmin && (
            <>
              <div
                onClick={onBackToAdmin}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 7, cursor: 'pointer',
                  fontSize: 12, color: '#888', transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f5f5f5'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
              >
                <ArrowLeftOutlined style={{ fontSize: 12 }} /> 返回
              </div>
              <div style={{ width: 1, height: 16, background: '#e8e8e8', marginRight: 8 }} />
            </>
          )}
          <div style={{
            width: 26, height: 26, borderRadius: 7,
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <TeamOutlined style={{ color: '#fff', fontSize: 13 }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.2 }}>数字员工</div>
            <div style={{ fontSize: 10, color: '#bbb', lineHeight: 1.2 }}>企业 AI 员工管理中心</div>
          </div>
        </div>

        {/* Tab 列表 */}
        <div style={{ display: 'flex', alignItems: 'center', height: '100%', gap: 2, flex: 1 }}>
          {NAV_ITEMS.map(item => {
            const active = page === item.key;
            return (
              <div
                key={item.key}
                onClick={() => handleNav(item.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '0 18px', height: '100%',
                  cursor: 'pointer', position: 'relative',
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  color: active ? PRIMARY : '#666',
                  transition: 'color 0.15s',
                }}
              >
                <span style={{ fontSize: 14 }}>{item.icon}</span>
                {item.label}
                {active && (
                  <div style={{
                    position: 'absolute', bottom: 0, left: 18, right: 18,
                    height: 2.5,
                    background: 'linear-gradient(90deg, #6366F1, #8B5CF6)',
                    borderRadius: '2px 2px 0 0',
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {/* 右侧：切换模式 */}
        <div
          onClick={() => setNavMode('sidebar')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
            fontSize: 12, color: '#888', border: '1px solid #e8e8e8',
            transition: 'all 0.15s', flexShrink: 0,
          }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.background = PRIMARY_LIGHT; el.style.borderColor = PRIMARY; el.style.color = PRIMARY; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.background = 'transparent'; el.style.borderColor = '#e8e8e8'; el.style.color = '#888'; }}
        >
          <MenuOutlined style={{ fontSize: 12 }} />
          侧边栏
        </div>
      </div>

      {/* ── 内容区 ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        {renderContent()}
      </div>

    </div>
  );
};

export default DigitalEmployeeHub;
