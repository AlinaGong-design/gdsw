import React, { useState } from 'react';
import {
  Button, Input, Table, Space, Form,
  Select, Tag, Drawer, message, Tooltip, Typography, Popconfirm,
  Timeline, Modal, Radio, Divider, Upload, Tabs
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
  ExportOutlined, ArrowLeftOutlined, ReloadOutlined,
  HistoryOutlined, TagOutlined, FileTextOutlined, EyeOutlined,
  RollbackOutlined, CloseOutlined, GlobalOutlined, LockOutlined, TeamOutlined,
  SaveOutlined, CloudUploadOutlined, CheckCircleFilled, ExclamationCircleFilled,
  UploadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { TextArea } = Input;
const { Text } = Typography;

// ─── 类型定义 ────────────────────────────────────────────────────────────────

interface ColumnMeta {
  name: string;
  type: 'String' | 'Integer' | 'Float' | 'Boolean' | 'Object' | 'Array';
  required: boolean;
  desc: string;
}

interface Dataset {
  id: number;
  name: string;
  columns: string[];
  columnsMeta: ColumnMeta[];
  desc: string;
  items: number;
  updatedBy: string;
  createdBy: string;
  updatedAt: string;
  createdAt: string;
}

interface DataItem {
  id: number;
  fields: Record<string, string>;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

interface Evaluator {
  id: number;
  name: string;
  type: 'LLM' | 'Code';
  desc: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  currentVersion?: string;
  savedStatus?: 'saved' | 'unsaved' | 'published' | 'unpublished';
  evlHistory?: EvlHistoryEvent[];
}

interface EvlVersion {
  versionId: string;
  version: string;
  changelog: string;
  publishedAt: string;
  publishedBy: string;
  scope: VisibilityScope;
  snapshot: {
    name: string;
    type: 'LLM' | 'Code';
    desc: string;
  };
}

interface EvlHistoryEvent {
  id: string;
  kind: 'save' | 'publish';
  time: string;
  user: string;
  desc: string;
  version?: EvlVersion;
}

interface EvalTask {
  id: number;
  name: string;
  datasetName: string;
  evaluatorName: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  scope: VisibilityScope;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// 版本相关类型
type HistoryEventKind = 'save' | 'publish';
type VisibilityScope = 'private' | 'team' | 'public';

interface DatasetVersion {
  versionId: string;
  version: string;          // vX.Y.Z
  changelog: string;
  publishedAt: string;
  publishedBy: string;
  scope: VisibilityScope;
  snapshot: DataItem[];     // 不可变快照
}

interface HistoryEvent {
  id: string;
  kind: HistoryEventKind;
  time: string;
  user: string;
  desc: string;             // 修改摘要 or 版本号
  version?: DatasetVersion; // 仅 publish 事件有
  snapshot?: DataItem[];    // save 事件的数据快照
}

// ─── 工具函数 ────────────────────────────────────────────────────────────────

const now = () => new Date().toISOString().slice(0, 19).replace('T', ' ');
const CURRENT_USER = '当前用户';
let dsIdSeq = 1;
let evlIdSeq = 1;
let taskIdSeq = 1;

function initDatasets(): Dataset[] {
  const u = ['张三', '李四', '王五', '赵六', '钱七', '孙八'];
  const list: Dataset[] = [];
  const add = (name: string, columns: string[], desc: string, items: number, updatedBy: string, createdBy: string) => {
    const meta: ColumnMeta[] = columns.map(n => ({ name: n, type: 'String', required: false, desc: '' }));
    list.push({ id: dsIdSeq++, name, columns, columnsMeta: meta, desc, items, updatedBy, createdBy, updatedAt: now(), createdAt: now() });
  };
  add('FAQ评测集A', ['question', 'answer', 'tag', 'intent'], '用于FAQ问答评估的样本集合，覆盖常见问题与场景，便于模型对话准确率评估。', 128, u[0], u[1]);
  add('图谱评测集B', ['entity', 'relation', 'confidence'], '面向知识图谱的关系抽取与推理评测集。', 256, u[2], u[3]);
  add('工作流评测集C', ['input', 'expected', 'step', 'remark'], '用于验证工作流节点在复杂路径下的稳定性与回归。', 64, u[4], u[5]);
  for (let i = 1; i <= 5; i++) {
    add('评测集' + i, ['colA', 'colB', 'colC'], '示例描述 ' + i, 30 + i, u[i % u.length], u[(i + 1) % u.length]);
  }
  return list;
}

function initEvaluators(): Evaluator[] {
  return [
    {
      id: evlIdSeq++, name: '通用一致性评估', type: 'LLM', desc: '基于LLM对回答与参考结果进行一致性判断',
      createdBy: '系统', createdAt: now(), updatedBy: '系统', updatedAt: now(),
      currentVersion: 'v1.1.0', savedStatus: 'published',
      evlHistory: [
        { id: 'h1', kind: 'publish', time: '2025-12-10 09:00:00', user: '系统', desc: 'v1.0.0',
          version: { versionId: 'v1.0.0', version: 'v1.0.0', changelog: '首次发布', publishedAt: '2025-12-10 09:00', publishedBy: '系统', scope: 'team', snapshot: { name: '通用一致性评估', type: 'LLM', desc: '基于LLM进行一致性判断' } } },
        { id: 'h2', kind: 'save', time: '2025-12-15 10:00:00', user: '系统', desc: '优化评估提示词' },
        { id: 'h3', kind: 'publish', time: '2025-12-20 11:00:00', user: '系统', desc: 'v1.1.0',
          version: { versionId: 'v1.1.0', version: 'v1.1.0', changelog: '提升多轮对话评估准确率', publishedAt: '2025-12-20 11:00', publishedBy: '系统', scope: 'team', snapshot: { name: '通用一致性评估', type: 'LLM', desc: '基于LLM对回答与参考结果进行一致性判断' } } },
      ],
    },
    {
      id: evlIdSeq++, name: '代码质量评分', type: 'Code', desc: '根据AST与lint结果进行评分',
      createdBy: '系统', createdAt: now(), updatedBy: '系统', updatedAt: now(),
      currentVersion: 'v1.0.0', savedStatus: 'published',
      evlHistory: [
        { id: 'h1', kind: 'publish', time: '2025-12-12 10:00:00', user: '系统', desc: 'v1.0.0',
          version: { versionId: 'v1.0.0', version: 'v1.0.0', changelog: '首次发布', publishedAt: '2025-12-12 10:00', publishedBy: '系统', scope: 'team', snapshot: { name: '代码质量评分', type: 'Code', desc: '根据AST与lint结果进行评分' } } },
      ],
    },
  ];
}

function initTasks(): EvalTask[] {
  return [
    { id: taskIdSeq++, name: 'FAQ基准测试-001', datasetName: 'FAQ评测集A', evaluatorName: '通用一致性评估', status: 'done', scope: 'team', createdBy: '张三', createdAt: now(), updatedAt: now() },
    { id: taskIdSeq++, name: '图谱推理评测', datasetName: '图谱评测集B', evaluatorName: '代码质量评分', status: 'running', scope: 'public', createdBy: '李四', createdAt: now(), updatedAt: now() },
    { id: taskIdSeq++, name: '工作流回归测试', datasetName: '工作流评测集C', evaluatorName: '通用一致性评估', status: 'pending', scope: 'private', createdBy: CURRENT_USER, createdAt: now(), updatedAt: now() },
  ];
}

const STATUS_MAP = {
  pending: { color: 'default', text: '待执行' },
  running: { color: 'processing', text: '运行中' },
  done: { color: 'success', text: '已完成' },
  failed: { color: 'error', text: '失败' },
} as const;

const TASK_SCOPE_CONFIG: Record<VisibilityScope, { label: string; tagColor: string; icon: React.ReactNode }> = {
  private: { label: '仅自己', tagColor: 'default', icon: <LockOutlined /> },
  team:    { label: '团队内', tagColor: 'blue',    icon: <TeamOutlined /> },
  public:  { label: '公开',   tagColor: 'green',   icon: <GlobalOutlined /> },
};

// ─── 评测任务 Tab ────────────────────────────────────────────────────────────

const TasksTab: React.FC<{ datasets: Dataset[]; evaluators: Evaluator[] }> = ({ datasets, evaluators }) => {
  const [tasks, setTasks] = useState<EvalTask[]>(initTasks());
  const [search, setSearch] = useState('');
  const [scopeTab, setScopeTab] = useState<'mine' | 'team' | 'public'>('mine');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<EvalTask | null>(null);
  const [form] = Form.useForm();

  // 权限：只有创建人才能编辑/删除
  const canOperate = (task: EvalTask) => task.createdBy === CURRENT_USER;

  // 按 tab 过滤任务
  const scopeFiltered = tasks.filter(t => {
    if (scopeTab === 'mine') return t.createdBy === CURRENT_USER;
    if (scopeTab === 'team') return t.scope === 'team' || t.scope === 'public';
    return t.scope === 'public';
  });

  const filtered = scopeFiltered.filter(t =>
    !search || t.name.includes(search) || t.datasetName.includes(search)
  );

  const openCreate = () => {
    setEditingTask(null);
    form.resetFields();
    form.setFieldsValue({ scope: 'team' });
    setDrawerOpen(true);
  };

  const openEdit = (task: EvalTask) => {
    setEditingTask(task);
    form.setFieldsValue({ name: task.name, datasetName: task.datasetName, evaluatorName: task.evaluatorName, scope: task.scope });
    setDrawerOpen(true);
  };

  const handleSave = () => {
    form.validateFields().then(values => {
      if (editingTask) {
        setTasks(tasks.map(t => t.id === editingTask.id ? { ...t, ...values, updatedAt: now() } : t));
        message.success('编辑成功');
      } else {
        setTasks([...tasks, { id: taskIdSeq++, ...values, status: 'pending', createdBy: CURRENT_USER, createdAt: now(), updatedAt: now() }]);
        message.success('创建成功');
      }
      setDrawerOpen(false);
    });
  };

  const handleDelete = (id: number) => {
    setTasks(tasks.filter(t => t.id !== id));
    message.success('删除成功');
  };

  const columns: ColumnsType<EvalTask> = [
    { title: '任务名称', dataIndex: 'name', width: 200 },
    { title: '评测集', dataIndex: 'datasetName', width: 160 },
    { title: '评估器', dataIndex: 'evaluatorName', width: 160 },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (s: EvalTask['status']) => <Tag color={STATUS_MAP[s].color}>{STATUS_MAP[s].text}</Tag>
    },
    {
      title: '可见范围', dataIndex: 'scope', width: 100,
      render: (s: VisibilityScope) => (
        <Tag color={TASK_SCOPE_CONFIG[s].tagColor} icon={TASK_SCOPE_CONFIG[s].icon}>
          {TASK_SCOPE_CONFIG[s].label}
        </Tag>
      ),
    },
    { title: '创建人', dataIndex: 'createdBy', width: 100 },
    { title: '创建时间', dataIndex: 'createdAt', width: 160 },
    {
      title: '操作', width: 160, fixed: 'right',
      render: (_, record) => {
        const operable = canOperate(record);
        return (
          <Space>
            <Tooltip title={operable ? '' : '仅创建人可编辑'}>
              <Button
                type="link" size="small" icon={<EditOutlined />}
                disabled={!operable}
                onClick={() => operable && openEdit(record)}
              >编辑</Button>
            </Tooltip>
            <Tooltip title={operable ? '' : '仅创建人可删除'}>
              <Popconfirm
                title="确认删除该任务？"
                onConfirm={() => handleDelete(record.id)}
                disabled={!operable}
              >
                <Button type="link" size="small" danger icon={<DeleteOutlined />} disabled={!operable}>删除</Button>
              </Popconfirm>
            </Tooltip>
          </Space>
        );
      }
    },
  ];

  const tabItems = [
    { key: 'mine',   label: `我的任务（${tasks.filter(t => t.createdBy === CURRENT_USER).length}）` },
    { key: 'team',   label: `团队任务（${tasks.filter(t => t.scope === 'team' || t.scope === 'public').length}）` },
    { key: 'public', label: `公开任务（${tasks.filter(t => t.scope === 'public').length}）` },
  ];

  return (
    <div>
      <Tabs
        activeKey={scopeTab}
        onChange={k => setScopeTab(k as typeof scopeTab)}
        items={tabItems}
        style={{ marginBottom: 16 }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Space>
          <Input placeholder="搜索任务名称或评测集" prefix={<SearchOutlined />} value={search} onChange={e => setSearch(e.target.value)} style={{ width: 280 }} allowClear />
          <Button onClick={() => setSearch('')} icon={<ReloadOutlined />}>重置</Button>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}
          style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', border: 'none' }}>
          新建评测任务
        </Button>
      </div>
      <Table rowKey="id" dataSource={filtered} columns={columns} pagination={{ pageSize: 10, showTotal: total => `共 ${total} 条` }} size="middle" />

      <Drawer
        title={editingTask ? '编辑评测任务' : '新建评测任务'}
        width={520}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        footer={
          <Space style={{ float: 'right' }}>
            <Button onClick={() => setDrawerOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleSave}>保存</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item label="任务名称" name="name" rules={[{ required: true, message: '请输入任务名称' }]}>
            <Input placeholder="请输入任务名称" maxLength={50} />
          </Form.Item>
          <Form.Item label="评测集" name="datasetName" rules={[{ required: true, message: '请选择评测集' }]}>
            <Select placeholder="请选择评测集">
              {datasets.map(d => <Select.Option key={d.id} value={d.name}>{d.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="评估器" name="evaluatorName" rules={[{ required: true, message: '请选择评估器' }]}>
            <Select placeholder="请选择评估器">
              {evaluators.map(e => <Select.Option key={e.id} value={e.name}>{e.name}（{e.type}）</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item
            label={
              <Space size={4}>
                <span>可见范围</span>
                <Tooltip title="控制谁可以看到该评测任务">
                  <span style={{ color: '#94a3b8', cursor: 'help', fontSize: 13 }}>？</span>
                </Tooltip>
              </Space>
            }
            name="scope"
            rules={[{ required: true, message: '请选择可见范围' }]}
          >
            <Radio.Group>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                {(Object.keys(TASK_SCOPE_CONFIG) as VisibilityScope[]).map(s => (
                  <Radio key={s} value={s}>
                    <Space size={6}>
                      {TASK_SCOPE_CONFIG[s].icon}
                      <span style={{ fontWeight: 500 }}>{TASK_SCOPE_CONFIG[s].label}</span>
                      <span style={{ color: '#94a3b8', fontSize: 12 }}>
                        {s === 'private' ? '——仅你自己可见' : s === 'team' ? '——团队成员可见' : '——所有人可见'}
                      </span>
                    </Space>
                  </Radio>
                ))}
              </div>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

// ─── 评测集详情 ──────────────────────────────────────────────────────────────

function nextVersion(last: string, bump: 'patch' | 'minor' | 'major'): string {
  const m = last.match(/^v?(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return 'v1.0.0';
  let [, maj, min, pat] = m.map(Number);
  if (bump === 'major') { maj++; min = 0; pat = 0; }
  else if (bump === 'minor') { min++; pat = 0; }
  else { pat++; }
  return `v${maj}.${min}.${pat}`;
}

const SCOPE_LABELS: Record<VisibilityScope, { label: string; icon: React.ReactNode; color: string }> = {
  private: { label: '仅自己', icon: <LockOutlined />, color: '#666' },
  team:    { label: '团队内', icon: <TeamOutlined />, color: '#6366F1' },
  public:  { label: '公开',   icon: <GlobalOutlined />, color: '#10b981' },
};

const DatasetDetail: React.FC<{ dataset: Dataset; onBack: () => void }> = ({ dataset, onBack }) => {
  // ── 数据状态 ──────────────────────────────────────────────────────────────
  const [items, setItems] = useState<DataItem[]>(() => {
    const list: DataItem[] = [];
    for (let i = 1; i <= 6; i++) {
      const fields: Record<string, string> = {};
      dataset.columns.forEach(c => { fields[c] = `${c}_值${i}`; });
      list.push({ id: i, fields, createdBy: '系统', createdAt: now(), updatedBy: '系统', updatedAt: now() });
    }
    return list;
  });

  // ── 草稿保存状态 ──────────────────────────────────────────────────────────
  const [savedStatus, setSavedStatus] = useState<'unsaved' | 'saved'>('saved');

  // ── 历史版本 ──────────────────────────────────────────────────────────────
  const [history, setHistory] = useState<HistoryEvent[]>([
    {
      id: 'h0', kind: 'publish', time: '2025-12-20 10:00:00', user: '系统',
      desc: 'v1.0.0',
      version: {
        versionId: 'v1.0.0', version: 'v1.0.0', changelog: '初始版本',
        publishedAt: '2025-12-20 10:00:00', publishedBy: '系统', scope: 'team',
        snapshot: [],
      },
      snapshot: [],
    },
  ]);

  // 最新发布版本号
  const latestVersion = (() => {
    const pub = [...history].reverse().find(h => h.kind === 'publish');
    return pub?.version?.version || 'v1.0.0';
  })();

  // ── 历史版本抽屉 ──────────────────────────────────────────────────────────
  const [historyOpen, setHistoryOpen] = useState(false);

  // ── 预览历史版本模式 ──────────────────────────────────────────────────────
  const [previewVersion, setPreviewVersion] = useState<DatasetVersion | null>(null);
  const [previewItems, setPreviewItems] = useState<DataItem[]>([]);

  // ── 发布弹窗 ──────────────────────────────────────────────────────────────
  const [publishOpen, setPublishOpen] = useState(false);
  const [pubVersion, setPubVersion] = useState('');
  const [pubChangelog, setPubChangelog] = useState('');
  const [pubScope, setPubScope] = useState<VisibilityScope | ''>('');

  // ── 回滚确认弹窗 ──────────────────────────────────────────────────────────
  const [rollbackTarget, setRollbackTarget] = useState<DatasetVersion | null>(null);

  // ── 数据��编辑抽屉 ────────────────────────────────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DataItem | null>(null);
  const [form] = Form.useForm();

  const isPreview = !!previewVersion;
  const displayItems = isPreview ? previewItems : items;

  // ── 草稿保存 ──────────────────────────────────────────────────────────────
  const handleDraftSave = () => {
    const ev: HistoryEvent = {
      id: `h${Date.now()}`, kind: 'save', time: now(), user: '当前用户',
      desc: `保存草稿（${items.length} 条数据）`,
      snapshot: JSON.parse(JSON.stringify(items)),
    };
    setHistory(prev => [...prev, ev]);
    setSavedStatus('saved');
    message.success('草稿已保存');
  };

  // ── 打开发布弹窗 ──────────────────────────────────────────────────────────
  const openPublish = () => {
    setPubVersion(nextVersion(latestVersion, 'patch'));
    setPubChangelog('');
    setPubScope('');
    setPublishOpen(true);
  };

  // ── 执行发布 ──────────────────────────────────────────────────────────────
  const handlePublish = () => {
    if (!/^v\d+\.\d+\.\d+$/.test(pubVersion)) {
      message.error('版本号格式不正确，需为 vX.Y.Z');
      return;
    }
    const ver: DatasetVersion = {
      versionId: pubVersion, version: pubVersion,
      changelog: pubChangelog, publishedAt: now(),
      publishedBy: '当前用户', scope: (pubScope || 'private') as VisibilityScope,
      snapshot: JSON.parse(JSON.stringify(items)),
    };
    const ev: HistoryEvent = {
      id: `h${Date.now()}`, kind: 'publish', time: now(),
      user: '当前用户', desc: pubVersion, version: ver, snapshot: ver.snapshot,
    };
    setHistory(prev => [...prev, ev]);
    setPublishOpen(false);
    message.success(`版本 ${pubVersion} 发布成功`);
  };

  // ── 执行回滚 ──────────────────────────────────────────────────────────────
  const handleRollback = () => {
    if (!rollbackTarget) return;
    setItems(JSON.parse(JSON.stringify(rollbackTarget.snapshot)));
    setSavedStatus('unsaved');
    setRollbackTarget(null);
    setHistoryOpen(false);
    message.success(`已回滚至 ${rollbackTarget.version}`);
  };

  // ── 进入历史版本预览 ──────────────────────────────────────────────────────
  const enterPreview = (ver: DatasetVersion) => {
    setPreviewVersion(ver);
    setPreviewItems(JSON.parse(JSON.stringify(ver.snapshot)));
    setHistoryOpen(false);
  };

  // ── 退出预览 ──────────────────────────────────────────────────────────────
  const exitPreview = () => {
    setPreviewVersion(null);
    setPreviewItems([]);
  };

  // ── 数据行 CRUD ───────────────────────────────────────────────────────────
  // ── 本地导入状态 ──────────────────────────────────────────────────────────
  const [importMode, setImportMode] = useState<'manual' | 'import'>('manual');
  const [importPreview, setImportPreview] = useState<DataItem[]>([]);
  const [importError, setImportError] = useState('');

  const parseImportFile = (file: File) => {
    setImportError('');
    setImportPreview([]);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        let rows: DataItem[] = [];
        const baseId = items.length ? Math.max(...items.map(r => r.id)) + 1 : 1;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          const arr = Array.isArray(parsed) ? parsed : [parsed];
          rows = arr.map((obj: any, i: number) => {
            const fields: Record<string, string> = {};
            dataset.columns.forEach(c => { fields[c] = String(obj[c] ?? ''); });
            return { id: baseId + i, fields, createdBy: '当前用户', createdAt: now(), updatedBy: '当前用户', updatedAt: now() };
          });
        } else {
          // CSV
          const lines = text.trim().split('\n');
          const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
          rows = lines.slice(1).filter(l => l.trim()).map((line, i) => {
            const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const fields: Record<string, string> = {};
            dataset.columns.forEach(c => {
              const idx = headers.indexOf(c);
              fields[c] = idx >= 0 ? (vals[idx] || '') : '';
            });
            return { id: baseId + i, fields, createdBy: '当前用户', createdAt: now(), updatedBy: '当前用户', updatedAt: now() };
          });
        }
        if (rows.length === 0) { setImportError('文件内容为空或格式不正确'); return; }
        setImportPreview(rows);
      } catch {
        setImportError('文件解析失败，请检查格式是否正确');
      }
    };
    reader.readAsText(file, 'utf-8');
    return false; // prevent auto upload
  };

  const handleImportConfirm = () => {
    if (!importPreview.length) return;
    setItems(prev => [...prev, ...importPreview]);
    setSavedStatus('unsaved');
    setImportPreview([]);
    setImportError('');
    setDrawerOpen(false);
    message.success(`已导入 ${importPreview.length} 条数据`);
  };

  const openAdd = () => {
    if (isPreview) return;
    setEditingItem(null);
    setImportMode('manual');
    setImportPreview([]);
    setImportError('');
    form.resetFields();
    setDrawerOpen(true);
  };

  const openEdit = (item: DataItem) => {
    if (isPreview) return;
    setEditingItem(item);
    form.setFieldsValue(item.fields);
    setDrawerOpen(true);
  };

  const handleItemSave = () => {
    form.validateFields().then(values => {
      if (editingItem) {
        setItems(prev => prev.map(it =>
          it.id === editingItem.id ? { ...it, fields: values, updatedBy: '当前用户', updatedAt: now() } : it
        ));
      } else {
        const nextId = items.length ? Math.max(...items.map(r => r.id)) + 1 : 1;
        setItems(prev => [...prev, { id: nextId, fields: values, createdBy: '当前用户', createdAt: now(), updatedBy: '当前用户', updatedAt: now() }]);
      }
      setDrawerOpen(false);
      setSavedStatus('unsaved');
      message.success('保存成功');
    });
  };

  const handleDelete = (id: number) => {
    if (isPreview) return;
    setItems(prev => prev.filter(it => it.id !== id));
    setSavedStatus('unsaved');
    message.success('删除成功');
  };

  const handleExport = () => {
    const header = dataset.columns.join(',');
    const rows = displayItems.map(r => dataset.columns.map(c => r.fields[c] || '').join(',')).join('\n');
    const blob = new Blob([header + '\n' + rows], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = dataset.name + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // ── 同步版本号建议 ─────────────────────────────────────────────────────────

  const dynamicColumns: ColumnsType<DataItem> = [
    { title: '数据编号', dataIndex: 'id', width: 90 },
    ...dataset.columns.map(c => ({
      title: c, dataIndex: ['fields', c], width: 140, ellipsis: true,
    })),
    { title: '更新人', dataIndex: 'updatedBy', width: 90 },
    { title: '更新时间', dataIndex: 'updatedAt', width: 160 },
    { title: '创建人', dataIndex: 'createdBy', width: 90 },
    { title: '创建时间', dataIndex: 'createdAt', width: 160 },
    ...(!isPreview ? [{
      title: '操作', width: 120, fixed: 'right' as const,
      render: (_: any, record: DataItem) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除该数据项？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    }] : []),
  ];

  // ── 历史时间轴（抽屉内复用） ──────────────────────────────────────────────
  const HistoryTimeline = () => (
    <Timeline
      items={[...history].reverse().map(ev => ({
        dot: ev.kind === 'publish'
          ? <TagOutlined style={{ color: '#6366F1', fontSize: 14 }} />
          : <SaveOutlined style={{ color: '#94a3b8', fontSize: 12 }} />,
        color: ev.kind === 'publish' ? '#6366F1' : '#cbd5e1',
        children: (
          <div style={{ marginBottom: 4 }}>
            {/* 标识行 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
              {ev.kind === 'publish' ? (
                <>
                  <Tag
                    color="purple"
                    style={{ margin: 0, fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}
                  >
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

            {/* 提交人 & 时间 */}
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
              {ev.user} · {ev.time}
            </div>

            {/* 发布专属信息 */}
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
                    onClick={() => enterPreview(ev.version!)}
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
  );

  return (
    <div>
      {/* ── 历史版本预览 Banner ─────────────────────────────────────────── */}
      {isPreview && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 20px', background: '#fef3c7', border: '1px solid #fcd34d',
          borderRadius: 8, marginBottom: 16, fontSize: 13,
        }}>
          <Space>
            <EyeOutlined style={{ color: '#d97706' }} />
            <span style={{ color: '#92400e', fontWeight: 500 }}>
              当前浏览的是历史版本 <Tag color="orange" style={{ fontFamily: 'monospace' }}>{previewVersion!.version}</Tag>
              发布于 {previewVersion!.publishedAt}，由 {previewVersion!.publishedBy} 提交
            </span>
          </Space>
          <Button icon={<CloseOutlined />} onClick={exitPreview} size="small">退出预览</Button>
        </div>
      )}

      {/* ── 顶部操作栏 ──────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16, padding: '12px 16px',
        background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0',
      }}>
        {/* 左侧：返回 + 名称 + 状态 */}
        <Space size={8} wrap>
          <Button type="link" icon={<ArrowLeftOutlined />} onClick={onBack} style={{ padding: 0 }}>返回</Button>
          <span style={{ color: '#d9d9d9' }}>|</span>
          <span style={{ fontSize: 16, fontWeight: 600 }}>{dataset.name}</span>
          <span style={{ color: '#999', fontSize: 13 }}>ID: {dataset.id}</span>

          {/* 最新版本号标签 */}
          <Tag color="blue" style={{ fontFamily: 'monospace' }}>{latestVersion}</Tag>

          {/* 保存状态 —— 仅草稿编辑模式显示 */}
          {!isPreview && (
            savedStatus === 'saved' ? (
              <Tag icon={<CheckCircleFilled />} color="success" style={{ fontSize: 12 }}>
                已保存
              </Tag>
            ) : (
              <Tag icon={<ExclamationCircleFilled />} color="warning" style={{ fontSize: 12 }}>
                未保存
              </Tag>
            )
          )}
        </Space>

        {/* 右侧：历史版本按钮 */}
        <Button icon={<HistoryOutlined />} onClick={() => setHistoryOpen(true)} size="small">
          历史版本
        </Button>
      </div>

      {/* ── 基本信息 ─────────────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0', padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 15 }}>基本信息</div>
        <div style={{ fontSize: 13, color: '#555', marginBottom: 6 }}>描述：{dataset.desc || '—'}</div>
        <Space size="large" style={{ fontSize: 13, color: '#888' }}>
          <span>数据项：<Text strong style={{ color: '#333' }}>{displayItems.length}</Text></span>
          <span>创建人：{dataset.createdBy}</span>
          <span>创建时间：{dataset.createdAt}</span>
          <span>更新人：{dataset.updatedBy}</span>
          <span>更新时间：{dataset.updatedAt}</span>
        </Space>
      </div>

      {/* ── 数据列表 ─────────────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0', padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12, gap: 8 }}>
          {!isPreview && <Button icon={<PlusOutlined />} onClick={openAdd}>新增数据</Button>}
          <Button icon={<ExportOutlined />} onClick={handleExport}>导出</Button>
        </div>
        <Table
          rowKey="id"
          dataSource={displayItems}
          columns={dynamicColumns}
          scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 10, showTotal: total => `共 ${total} 条` }}
          size="middle"
        />
      </div>

      {/* ── 底部操作按钮（预览模式下全部隐藏） ────────────────────────── */}
      {!isPreview && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, padding: '12px 0' }}>
          <Button icon={<SaveOutlined />} onClick={handleDraftSave}>
            保存
          </Button>
          <Button
            type="primary"
            icon={<CloudUploadOutlined />}
            onClick={openPublish}
            disabled={savedStatus === 'unsaved'}
            title={savedStatus === 'unsaved' ? '请先保存，再发布版本' : ''}
            style={savedStatus !== 'unsaved'
              ? { background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', border: 'none' }
              : {}
            }
          >
            发布
          </Button>
        </div>
      )}

      {/* ── 数据行编辑抽屉 ──────────────────────────────────────────────── */}
      <Drawer
        title={editingItem ? '编辑数据' : '新增数据'}
        width={560}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        footer={
          <Space style={{ float: 'right' }}>
            <Button onClick={() => setDrawerOpen(false)}>取消</Button>
            {!editingItem && importMode === 'import' ? (
              <Button
                type="primary"
                onClick={handleImportConfirm}
                disabled={!importPreview.length}
              >
                导入 {importPreview.length > 0 ? `${importPreview.length} 条` : ''}
              </Button>
            ) : (
              <Button type="primary" onClick={handleItemSave}>保存</Button>
            )}
          </Space>
        }
      >
        {editingItem ? (
          /* 编辑模式：直接显示表单 */
          <Form form={form} layout="vertical">
            {dataset.columnsMeta.map(cm => (
              <Form.Item
                key={cm.name}
                label={<span>{cm.name} <Tag>{cm.type}</Tag>{cm.required && <span style={{ color: 'red' }}>*</span>}</span>}
                name={cm.name}
                rules={cm.required ? [{ required: true, message: `${cm.name} 为必填项` }] : []}
              >
                <Input placeholder={`请输入 ${cm.name}`} />
              </Form.Item>
            ))}
          </Form>
        ) : (
          /* 新增模式：手动填写 / 本地导入 */
          <Tabs
            activeKey={importMode}
            onChange={k => { setImportMode(k as 'manual' | 'import'); setImportPreview([]); setImportError(''); }}
            items={[
              {
                key: 'manual',
                label: '手动填写',
                children: (
                  <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
                    {dataset.columnsMeta.map(cm => (
                      <Form.Item
                        key={cm.name}
                        label={<span>{cm.name} <Tag>{cm.type}</Tag>{cm.required && <span style={{ color: 'red' }}>*</span>}</span>}
                        name={cm.name}
                        rules={cm.required ? [{ required: true, message: `${cm.name} 为必填项` }] : []}
                      >
                        <Input placeholder={`请输入 ${cm.name}`} />
                      </Form.Item>
                    ))}
                  </Form>
                ),
              },
              {
                key: 'import',
                label: '本地导入',
                children: (
                  <div style={{ marginTop: 8 }}>
                    {/* 字段说明 */}
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: 500 }}>当前评测集字段：</div>
                      <Space wrap size={6}>
                        {dataset.columns.map(c => <Tag key={c} style={{ fontFamily: 'monospace' }}>{c}</Tag>)}
                      </Space>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
                        支持 CSV / JSON 格式，CSV 首行需为字段名，JSON 为对象数组
                      </div>
                    </div>

                    {/* 上传区域 */}
                    <Upload.Dragger
                      accept=".csv,.json"
                      beforeUpload={parseImportFile}
                      showUploadList={false}
                      maxCount={1}
                      style={{ marginBottom: 16 }}
                    >
                      <div style={{ padding: '16px 0' }}>
                        <UploadOutlined style={{ fontSize: 28, color: '#6366F1', marginBottom: 8 }} />
                        <div style={{ fontSize: 14, color: '#333', marginBottom: 4 }}>点击或拖拽文件到此区域</div>
                        <div style={{ fontSize: 12, color: '#999' }}>支持 .csv、.json 文件</div>
                      </div>
                    </Upload.Dragger>

                    {/* 错误提示 */}
                    {importError && (
                      <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>
                        ⚠ {importError}
                      </div>
                    )}

                    {/* 预览表格 */}
                    {importPreview.length > 0 && (
                      <div>
                        <div style={{ fontSize: 13, color: '#555', marginBottom: 8, fontWeight: 500 }}>
                          预览（共 {importPreview.length} 条，将追加至现有数据）
                        </div>
                        <Table
                          rowKey="id"
                          size="small"
                          dataSource={importPreview.slice(0, 5)}
                          pagination={false}
                          scroll={{ x: 'max-content' }}
                          columns={dataset.columns.map(c => ({
                            title: c, dataIndex: ['fields', c], width: 120, ellipsis: true,
                          }))}
                          footer={() => importPreview.length > 5
                            ? <span style={{ fontSize: 12, color: '#999' }}>仅展示前 5 条…</span>
                            : null
                          }
                        />
                      </div>
                    )}
                  </div>
                ),
              },
            ]}
          />
        )}
      </Drawer>

      {/* ── 历史版本抽屉（右侧滑出） ────────────────────────────────────── */}
      <Drawer
        title={
          <Space>
            <HistoryOutlined />
            <span>历史版本</span>
            <Tag style={{ fontSize: 11, margin: 0 }}>{history.length} 条记录</Tag>
          </Space>
        }
        placement="right"
        width={440}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        styles={{ body: { padding: '16px 20px' } }}
      >
        {/* 草稿入口 —— 始终显示，预览模式下可点击返回草稿 */}
        <div
          onClick={isPreview ? () => { exitPreview(); setHistoryOpen(false); } : undefined}
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
            <span style={{
              fontSize: 13,
              color: isPreview ? '#0369a1' : '#15803d',
              fontWeight: 500,
            }}>
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

        <HistoryTimeline />
      </Drawer>

      {/* ── 发布正式版本弹窗 ────────────────────────────────────────────── */}
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
              <div style={{ fontWeight: 400, fontSize: 13, color: '#888', marginTop: 2 }}>
                发布后将生成不可变的快照。请确保数据已完整校验。
              </div>
            </div>
          </div>
        }
        open={publishOpen}
        onCancel={() => setPublishOpen(false)}
        footer={
          <Space>
            <Button onClick={() => setPublishOpen(false)} style={{ minWidth: 72 }}>取消</Button>
            <Button
              type="primary"
              onClick={handlePublish}
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
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
              版本号 <span style={{ color: '#ff4d4f' }}>*</span>
            </div>
            <Input
              value={pubVersion}
              onChange={e => setPubVersion(e.target.value)}
              placeholder="v1.0.0"
              style={{ fontSize: 14, borderRadius: 8 }}
            />
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>格式示例: v1.0.0, v2.1.3</div>
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>版本说明 / 变更日志</div>
            <TextArea
              value={pubChangelog}
              onChange={e => setPubChangelog(e.target.value)}
              rows={4}
              placeholder="简要描述本次更新的内容..."
              maxLength={500}
              style={{ borderRadius: 8, resize: 'none' }}
            />
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
              公开范围 <span style={{ color: '#888', fontWeight: 400, fontSize: 13 }}>（为空则仅本人可见）</span>
            </div>
            <Select
              value={pubScope || undefined}
              onChange={v => setPubScope(v)}
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

      {/* ── 回滚确认弹窗 ────────────────────────────────────────────────── */}
      <Modal
        title={`回滚至 ${rollbackTarget?.version} 版本`}
        open={!!rollbackTarget}
        onCancel={() => setRollbackTarget(null)}
        footer={
          <Space>
            <Button onClick={() => setRollbackTarget(null)}>取消</Button>
            <Button
              type="primary"
              onClick={handleRollback}
              style={{ background: '#1a1a1a', borderColor: '#1a1a1a', borderRadius: 8 }}
            >
              回滚
            </Button>
          </Space>
        }
        width={560}
      >
        {rollbackTarget && (
          <div style={{ padding: '4px 0 8px' }}>
            {/* 版本信息卡片 */}
            <div style={{
              border: '1px solid #e8e8e8', borderRadius: 8,
              padding: '14px 16px', marginBottom: 20, background: '#fafafa',
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>
                  回滚版本 {rollbackTarget.version}
                </span>
                <span style={{ fontSize: 13, color: '#999' }}>
                  {rollbackTarget.publishedBy} · {rollbackTarget.publishedAt}
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
                {rollbackTarget.changelog
                  ? rollbackTarget.changelog
                  : `将评测集「${dataset.name}」的数据恢复至 ${rollbackTarget.version} 版本快照，共 ${rollbackTarget.snapshot.length} 条数据记录。`
                }
              </div>
            </div>

            {/* 此操作会 */}
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#111', marginBottom: 10 }}>
                此操作会：
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>
                  工作区数据恢复至选中的 {rollbackTarget.version} 版本状态
                </li>
                <li style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>
                  撤销该版本之后的所有未发布更改
                </li>
                <li style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>
                  历史记录会保留，可随时回滚到其他版本
                </li>
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ─── 评测集 Tab ──────────────────────────────────────────────────────────────

const DataTab: React.FC<{ datasets: Dataset[]; setDatasets: React.Dispatch<React.SetStateAction<Dataset[]>>; onViewDetail: (ds: Dataset) => void }> = ({ datasets, setDatasets, onViewDetail }) => {
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingDs, setEditingDs] = useState<Dataset | null>(null);
  const [colMetas, setColMetas] = useState<ColumnMeta[]>([
    { name: 'input', type: 'String', required: false, desc: '作为输入投递给评测对象' },
    { name: 'reference_output', type: 'String', required: false, desc: '预期理想输出，可作为评估参考标准' },
  ]);
  const [form] = Form.useForm();

  const filtered = datasets.filter(d =>
    !search || d.name.includes(search) || d.desc.includes(search)
  );

  const openCreate = () => {
    setEditingDs(null);
    form.resetFields();
    setColMetas([
      { name: 'input', type: 'String', required: false, desc: '' },
      { name: 'reference_output', type: 'String', required: false, desc: '' },
    ]);
    setDrawerOpen(true);
  };

  const openEdit = (ds: Dataset) => {
    setEditingDs(ds);
    form.setFieldsValue({ name: ds.name, desc: ds.desc });
    setColMetas(ds.columnsMeta);
    setDrawerOpen(true);
  };

  const handleSave = () => {
    form.validateFields().then(values => {
      const validCols = colMetas.filter(c => c.name.trim());
      if (!validCols.length) { message.warning('请至少添加一列'); return; }
      if (editingDs) {
        setDatasets(datasets.map(d => d.id === editingDs.id
          ? { ...d, name: values.name, desc: values.desc || '', columns: validCols.map(c => c.name), columnsMeta: validCols, updatedAt: now(), updatedBy: '当前用户' }
          : d
        ));
        message.success('编辑成功');
      } else {
        const newDs: Dataset = {
          id: dsIdSeq++,
          name: values.name,
          desc: values.desc || '',
          columns: validCols.map(c => c.name),
          columnsMeta: validCols,
          items: 0,
          updatedBy: '当前用户',
          createdBy: '当前用户',
          updatedAt: now(),
          createdAt: now(),
        };
        setDatasets([newDs, ...datasets]);
        message.success('创建成功');
      }
      setDrawerOpen(false);
    });
  };

  const handleDelete = (ds: Dataset) => {
    setDatasets(datasets.filter(d => d.id !== ds.id));
    message.success('删除成功');
  };

  const updateCol = (idx: number, key: keyof ColumnMeta, value: string | boolean) => {
    setColMetas(prev => prev.map((c, i) => i === idx ? { ...c, [key]: value } : c));
  };

  const addCol = () => setColMetas(prev => [...prev, { name: '', type: 'String', required: false, desc: '' }]);
  const removeCol = (idx: number) => setColMetas(prev => prev.filter((_, i) => i !== idx));

  const columns: ColumnsType<Dataset> = [
    {
      title: '名称', dataIndex: 'name', width: 160,
      render: (name, record) => <Button type="link" style={{ padding: 0 }} onClick={() => onViewDetail(record)}>{name}</Button>
    },
    {
      title: '列名', dataIndex: 'columns', width: 180,
      render: (cols: string[]) => {
        const preview = cols.slice(0, 3).join(', ') + (cols.length > 3 ? ' …' : '');
        return <Tooltip title={cols.join(', ')}><span>{preview}</span></Tooltip>;
      }
    },
    { title: '描述', dataIndex: 'desc', width: 220, ellipsis: true },
    { title: '数据项', dataIndex: 'items', width: 80 },
    { title: '更新人', dataIndex: 'updatedBy', width: 90 },
    { title: '更新时间', dataIndex: 'updatedAt', width: 160 },
    { title: '创建人', dataIndex: 'createdBy', width: 90 },
    { title: '创建时间', dataIndex: 'createdAt', width: 160 },
    {
      title: '操作', width: 160, fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除该评测集？" onConfirm={() => handleDelete(record)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    },
  ];

  const typeOptions = ['String', 'Integer', 'Float', 'Boolean', 'Object', 'Array'];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Space>
          <Input placeholder="按名称和描述搜索" prefix={<SearchOutlined />} value={search} onChange={e => setSearch(e.target.value)} style={{ width: 280 }} allowClear />
          <Button icon={<ReloadOutlined />} onClick={() => setSearch('')}>重置</Button>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}
          style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', border: 'none' }}>
          新建评测集
        </Button>
      </div>
      <Table rowKey="id" dataSource={filtered} columns={columns} scroll={{ x: 'max-content' }} pagination={{ pageSize: 10, showTotal: total => `共 ${total} 条` }} size="middle" />

      <Drawer
        title={editingDs ? '编辑评测集' : '新建评测集'}
        width={620}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        footer={
          <Space style={{ float: 'right' }}>
            <Button onClick={() => setDrawerOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleSave}>保存</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>基本信息</div>
          <Form.Item label="名称" name="name" rules={[{ required: true, message: '请输入评测集名称' }]}>
            <Input placeholder="请输入评测集名称" maxLength={50} />
          </Form.Item>
          <Form.Item label="描述" name="desc">
            <TextArea rows={3} maxLength={200} placeholder="请输入评测集描述" showCount />
          </Form.Item>
        </Form>

        <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>配置列</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {colMetas.map((col, idx) => (
            <div key={idx} style={{ background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ minWidth: 32, color: '#888', fontSize: 13 }}>名称<span style={{ color: 'red' }}>*</span></span>
                <Input value={col.name} onChange={e => updateCol(idx, 'name', e.target.value)} style={{ width: 140 }} placeholder="列名" maxLength={50} />
                <span style={{ color: '#888', fontSize: 13 }}>数据类型<span style={{ color: 'red' }}>*</span></span>
                <Select value={col.type} onChange={v => updateCol(idx, 'type', v)} style={{ width: 130 }}>
                  {typeOptions.map(t => <Select.Option key={t} value={t}>{t}</Select.Option>)}
                </Select>
                <span style={{ color: '#888', fontSize: 13 }}>必填</span>
                <Select value={col.required ? '1' : '0'} onChange={v => updateCol(idx, 'required', v === '1')} style={{ width: 80 }}>
                  <Select.Option value="0">否</Select.Option>
                  <Select.Option value="1">是</Select.Option>
                </Select>
                <Button type="link" danger onClick={() => removeCol(idx)} style={{ padding: 0 }}>删除</Button>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ minWidth: 32, color: '#888', fontSize: 13 }}>描述</span>
                <Input value={col.desc} onChange={e => updateCol(idx, 'desc', e.target.value)} style={{ flex: 1 }} placeholder="请输入列描述" maxLength={200} />
              </div>
            </div>
          ))}
          <Button type="dashed" icon={<PlusOutlined />} onClick={addCol} block>添加列</Button>
        </div>
      </Drawer>
    </div>
  );
};

// ─── 评估器 Tab ──────────────────────────────────────────────────────────────

const RulesTab: React.FC<{
  evaluators: Evaluator[];
  setEvaluators: React.Dispatch<React.SetStateAction<Evaluator[]>>;
  onCreateEvaluator?: (type: 'LLM' | 'Code') => void;
  onEditEvaluator?: (evaluatorId: string, type: 'LLM' | 'Code') => void;
}> = ({ evaluators, setEvaluators, onCreateEvaluator, onEditEvaluator }) => {
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingEvl, setEditingEvl] = useState<Evaluator | null>(null);
  const [form] = Form.useForm();

  // 版本控制状态
  const [historyEvl, setHistoryEvl] = useState<Evaluator | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [publishEvlId, setPublishEvlId] = useState<number | null>(null);
  const [pubVersion, setPubVersion] = useState('');
  const [pubBump, setPubBump] = useState<'patch' | 'minor' | 'major'>('patch');
  const [pubChangelog, setPubChangelog] = useState('');
  const [pubScope, setPubScope] = useState<VisibilityScope>('team');
  const [publishOpen, setPublishOpen] = useState(false);
  const [historyRollbackTarget, setHistoryRollbackTarget] = useState<EvlVersion | null>(null);
  const [previewEvlVersion, setPreviewEvlVersion] = useState<EvlVersion | null>(null);
  const [previewEvlId, setPreviewEvlId] = useState<number | null>(null);

  const filtered = evaluators.filter(e =>
    !search || e.name.includes(search) || e.desc.includes(search)
  );

  const getLatestEvlVersion = (evl: Evaluator): string => {
    const hist = evl.evlHistory || [];
    const last = [...hist].reverse().find(h => h.kind === 'publish');
    return last?.desc || 'v1.0.0';
  };

  const openCreate = (type: 'LLM' | 'Code') => {
    if (onCreateEvaluator) {
      onCreateEvaluator(type);
    } else {
      setEditingEvl(null);
      form.resetFields();
      form.setFieldValue('type', type);
      setDrawerOpen(true);
    }
  };

  const openEdit = (evl: Evaluator) => {
    if (onEditEvaluator) {
      onEditEvaluator(String(evl.id), evl.type);
    } else {
      setEditingEvl(evl);
      form.setFieldsValue({ name: evl.name, type: evl.type, desc: evl.desc });
      setDrawerOpen(true);
    }
  };

  const handleSave = () => {
    form.validateFields().then(values => {
      if (editingEvl) {
        setEvaluators(evaluators.map(e => e.id === editingEvl.id
          ? { ...e, ...values, updatedAt: now(), updatedBy: '当前用户', savedStatus: 'unsaved' as const }
          : e
        ));
        message.success('编辑成功');
      } else {
        setEvaluators([...evaluators, {
          id: evlIdSeq++, ...values,
          createdBy: '当前用户', createdAt: now(),
          updatedBy: '当前用户', updatedAt: now(),
          savedStatus: 'unsaved' as const, evlHistory: [],
        }]);
        message.success('创建成功');
      }
      setDrawerOpen(false);
    });
  };

  const handleDelete = (id: number) => {
    setEvaluators(evaluators.filter(e => e.id !== id));
    message.success('删除成功');
  };

  const handleDraftSave = (id: number) => {
    const evl = evaluators.find(e => e.id === id);
    if (!evl) return;
    const ev: EvlHistoryEvent = {
      id: `h${Date.now()}`, kind: 'save', time: now(), user: '当前用户',
      desc: `保存草稿（${evl.name}）`,
    };
    setEvaluators(evaluators.map(e => e.id === id
      ? { ...e, savedStatus: 'saved', evlHistory: [...(e.evlHistory || []), ev], updatedAt: now(), updatedBy: '当前用户' }
      : e
    ));
    message.success('草稿已保存');
  };

  const openPublishModal = (id: number) => {
    const evl = evaluators.find(e => e.id === id);
    if (!evl) return;
    const lv = getLatestEvlVersion(evl);
    setPubBump('patch');
    setPubVersion(nextVersion(lv, 'patch'));
    setPubChangelog('');
    setPubScope('team');
    setPublishEvlId(id);
    setPublishOpen(true);
  };

  const handlePublishVersion = () => {
    if (!/^v\d+\.\d+\.\d+$/.test(pubVersion)) { message.error('版本号格式不正确，需为 vX.Y.Z'); return; }
    if (!publishEvlId) return;
    const evl = evaluators.find(e => e.id === publishEvlId);
    if (!evl) return;
    const ver: EvlVersion = {
      versionId: pubVersion, version: pubVersion,
      changelog: pubChangelog, publishedAt: now(), publishedBy: '当前用户', scope: pubScope,
      snapshot: { name: evl.name, type: evl.type, desc: evl.desc },
    };
    const ev: EvlHistoryEvent = {
      id: `h${Date.now()}`, kind: 'publish', time: now(), user: '当前用户',
      desc: pubVersion, version: ver,
    };
    setEvaluators(evaluators.map(e => e.id === publishEvlId
      ? { ...e, currentVersion: pubVersion, evlHistory: [...(e.evlHistory || []), ev], updatedAt: now(), updatedBy: '当前用户' }
      : e
    ));
    message.success(`版本 ${pubVersion} 发布成功`);
    setPublishOpen(false);
    setPublishEvlId(null);
  };

  const handleRollback = () => {
    if (!historyRollbackTarget || !historyEvl) return;
    setEvaluators(evaluators.map(e => e.id === historyEvl.id
      ? {
          ...e,
          name: historyRollbackTarget.snapshot.name,
          type: historyRollbackTarget.snapshot.type,
          desc: historyRollbackTarget.snapshot.desc,
          savedStatus: 'unsaved',
          currentVersion: historyRollbackTarget.version,
          updatedAt: now(), updatedBy: '当前用户',
        }
      : e
    ));
    setHistoryRollbackTarget(null);
    setPreviewEvlVersion(null);
    setHistoryOpen(false);
    message.success(`已回滚至 ${historyRollbackTarget.version}`);
  };

  const columns: ColumnsType<Evaluator> = [
    { title: '名称', dataIndex: 'name', width: 180 },
    {
      title: '类型', dataIndex: 'type', width: 90,
      render: (t: string) => <Tag color={t === 'LLM' ? 'blue' : 'green'}>{t}</Tag>
    },
    { title: '描述', dataIndex: 'desc', width: 220, ellipsis: true },
    {
      title: '状态', width: 110,
      render: (_, record) => {
        const s = record.savedStatus;
        if (s === 'published') return <Tag color="success" style={{ fontSize: 11 }}>已发布</Tag>;
        if (s === 'unpublished') return <Tag color="default" style={{ fontSize: 11 }}>未发布</Tag>;
        if (s === 'saved') return <Tag icon={<CheckCircleFilled />} color="processing" style={{ fontSize: 11 }}>已保存</Tag>;
        return <Tag icon={<ExclamationCircleFilled />} color="warning" style={{ fontSize: 11 }}>未保存</Tag>;
      }
    },
    { title: '更新人', dataIndex: 'updatedBy', width: 100 },
    { title: '更新时间', dataIndex: 'updatedAt', width: 160 },
    {
      title: '操作', width: 120, fixed: 'right',
      render: (_, record) => (
        <Space size={2}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除该评估器？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    },
  ];

  const publishEvl = evaluators.find(e => e.id === publishEvlId);

  return (
    <div>
      {/* 历史版本预览 Banner */}
      {previewEvlVersion && (() => {
        const previewEvl = evaluators.find(e => e.id === previewEvlId);
        return (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 20px', background: '#fef3c7', border: '1px solid #fcd34d',
              borderRadius: 8, marginBottom: 12, fontSize: 13,
            }}>
              <Space>
                <EyeOutlined style={{ color: '#d97706' }} />
                <span style={{ color: '#92400e', fontWeight: 500 }}>
                  当前浏览的是「{previewEvl?.name}」历史版本{' '}
                  <Tag color="orange" style={{ fontFamily: 'monospace' }}>{previewEvlVersion.version}</Tag>
                  发布于 {previewEvlVersion.publishedAt}，由 {previewEvlVersion.publishedBy} 提交
                </span>
              </Space>
              <Button icon={<CloseOutlined />} onClick={() => { setPreviewEvlVersion(null); setPreviewEvlId(null); }} size="small">退出预览</Button>
            </div>
            <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '16px 20px', marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#92400e', marginBottom: 12 }}>版本快照内容</div>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px 16px', fontSize: 13, color: '#555' }}>
                <span style={{ color: '#92400e', fontWeight: 500 }}>评估器名称</span>
                <span>{previewEvlVersion.snapshot.name}</span>
                <span style={{ color: '#92400e', fontWeight: 500 }}>类型</span>
                <span>
                  <Tag color={previewEvlVersion.snapshot.type === 'LLM' ? 'blue' : 'green'}>{previewEvlVersion.snapshot.type}</Tag>
                </span>
                <span style={{ color: '#92400e', fontWeight: 500 }}>描述</span>
                <span>{previewEvlVersion.snapshot.desc || '—'}</span>
                <span style={{ color: '#92400e', fontWeight: 500 }}>更新日志</span>
                <span style={{ color: previewEvlVersion.changelog ? '#555' : '#aaa', fontStyle: previewEvlVersion.changelog ? 'normal' : 'italic' }}>
                  {previewEvlVersion.changelog || '（无）'}
                </span>
              </div>
            </div>
          </>
        );
      })()}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Space>
          <Input placeholder="按名称或描述搜索评估器" prefix={<SearchOutlined />} value={search} onChange={e => setSearch(e.target.value)} style={{ width: 280 }} allowClear />
          <Button icon={<ReloadOutlined />} onClick={() => setSearch('')}>重置</Button>
        </Space>
        <Space>
          <Button icon={<PlusOutlined />} onClick={() => openCreate('LLM')}
            style={{ borderColor: '#6366F1', color: '#6366F1' }}>
            新建 LLM 评估器
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreate('Code')}
            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', border: 'none' }}>
            新建 Code 评估器
          </Button>
        </Space>
      </div>
      <Table rowKey="id" dataSource={filtered} columns={columns} scroll={{ x: 'max-content' }} pagination={{ pageSize: 10, showTotal: total => `共 ${total} 条` }} size="middle" />

      {/* 编辑/新建抽屉 */}
      <Drawer
        title={editingEvl ? '编辑评估器' : '新建评估器'}
        width={520}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        footer={
          <Space style={{ float: 'right' }}>
            <Button onClick={() => setDrawerOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleSave}>保存</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item label="名称" name="name" rules={[{ required: true, message: '请输入评估器名称' }]}>
            <Input placeholder="请输入评估器名称" maxLength={50} />
          </Form.Item>
          <Form.Item label="类型" name="type" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="LLM">LLM</Select.Option>
              <Select.Option value="Code">Code</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="描述" name="desc">
            <TextArea rows={3} maxLength={200} placeholder="请输入描述" showCount />
          </Form.Item>
        </Form>
      </Drawer>

      {/* 历史版本抽屉 */}
      <Drawer
        title={
          <Space>
            <HistoryOutlined />
            <span>历史版本</span>
            <Tag style={{ fontSize: 11, margin: 0 }}>{(historyEvl?.evlHistory || []).length} 条记录</Tag>
          </Space>
        }
        placement="right"
        width={440}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        styles={{ body: { padding: '16px 20px' } }}
      >
        <div
          onClick={previewEvlVersion ? () => { setPreviewEvlVersion(null); setPreviewEvlId(null); setHistoryOpen(false); } : undefined}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 8, padding: '10px 14px', marginBottom: 4, borderRadius: 8,
            cursor: previewEvlVersion ? 'pointer' : 'default',
            background: !previewEvlVersion ? '#f0fdf4' : '#f0f9ff',
            border: !previewEvlVersion ? '1.5px solid #86efac' : '1px solid #bae6fd',
          }}
        >
          <Space size={6}>
            <FileTextOutlined style={{ color: previewEvlVersion ? '#0ea5e9' : '#16a34a' }} />
            <span style={{ fontSize: 13, color: previewEvlVersion ? '#0369a1' : '#15803d', fontWeight: 500 }}>
              草稿（当前编辑版本）
            </span>
          </Space>
          {!previewEvlVersion
            ? <Tag color="green" style={{ fontSize: 11, margin: 0 }}>当前</Tag>
            : <span style={{ fontSize: 12, color: '#0369a1' }}>点击返回草稿</span>
          }
        </div>
        <Divider style={{ margin: '12px 0 16px', fontSize: 12, color: '#94a3b8' }}>
          {(historyEvl?.evlHistory || []).length} 条历史记录
        </Divider>
        <Timeline
          items={[...(historyEvl?.evlHistory || [])].reverse().map(ev => ({
            dot: ev.kind === 'publish'
              ? <TagOutlined style={{ color: '#6366F1', fontSize: 14 }} />
              : <SaveOutlined style={{ color: '#94a3b8', fontSize: 12 }} />,
            color: ev.kind === 'publish' ? '#6366F1' : '#cbd5e1',
            children: (
              <div style={{ marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                  {ev.kind === 'publish' ? (
                    <>
                      <Tag color="purple" style={{ margin: 0, fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>{ev.desc}</Tag>
                      <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>正式发布</Tag>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{ev.desc}</span>
                      <Tag style={{ margin: 0, fontSize: 11, color: '#64748b', borderColor: '#cbd5e1', background: '#f8fafc' }}>草稿保存</Tag>
                    </>
                  )}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{ev.user} · {ev.time}</div>
                {ev.kind === 'publish' && ev.version && (
                  <>
                    {ev.version.changelog && (
                      <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic', marginBottom: 4, paddingLeft: 8, borderLeft: '2px solid #e2e8f0', lineHeight: 1.5 }}>
                        {ev.version.changelog}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>评估器类型：</span>
                      <Tag color={ev.version.snapshot.type === 'LLM' ? 'blue' : 'green'} style={{ fontSize: 11, margin: 0 }}>{ev.version.snapshot.type}</Tag>
                    </div>
                    <Space size={6}>
                      <Button size="small" icon={<EyeOutlined />}
                        type={previewEvlVersion?.versionId === ev.version.versionId ? 'primary' : 'default'}
                        onClick={() => {
                          setPreviewEvlVersion(ev.version!);
                          setPreviewEvlId(historyEvl?.id ?? null);
                          setHistoryOpen(false);
                        }}
                      >查看版本</Button>
                      <Button size="small" icon={<RollbackOutlined />} onClick={() => setHistoryRollbackTarget(ev.version!)}>
                        回滚
                      </Button>
                    </Space>
                    {previewEvlVersion?.versionId === ev.version.versionId && (
                      <div style={{ marginTop: 10, padding: '10px', background: '#fff', borderRadius: 6, border: '1px solid #e8e8e8', fontSize: 12 }}>
                        <div style={{ fontWeight: 600, marginBottom: 6, color: '#555' }}>版本快照</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '4px', color: '#666' }}>
                          <span>名称</span><span style={{ color: '#333' }}>{ev.version.snapshot.name}</span>
                          <span>类型</span><span style={{ color: '#333' }}>{ev.version.snapshot.type}</span>
                          <span>描述</span><span style={{ color: '#333' }}>{ev.version.snapshot.desc}</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ),
          }))}
        />
      </Drawer>

      {/* 发布版本弹窗 */}
      <Modal
        title={<Space><CloudUploadOutlined style={{ color: '#6366F1' }} /><span>发布正式版本</span></Space>}
        open={publishOpen}
        onCancel={() => setPublishOpen(false)}
        footer={
          <Space>
            <Button onClick={() => setPublishOpen(false)}>取消</Button>
            <Button type="primary" icon={<CloudUploadOutlined />} onClick={handlePublishVersion}
              style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', border: 'none' }}>
              确认发布
            </Button>
          </Space>
        }
        width={500}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: '8px 0' }}>
          <div>
            <div style={{ fontWeight: 500, marginBottom: 8, fontSize: 13 }}>版本升级类型</div>
            <Radio.Group value={pubBump} onChange={e => { setPubBump(e.target.value); setPubVersion(nextVersion(publishEvl ? getLatestEvlVersion(publishEvl) : 'v1.0.0', e.target.value)); }} style={{ width: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(['patch', 'minor', 'major'] as const).map(b => (
                  <Radio key={b} value={b} style={{ padding: '6px 10px', borderRadius: 6, background: pubBump === b ? '#f5f3ff' : 'transparent', border: pubBump === b ? '1px solid #c4b5fd' : '1px solid transparent' }}>
                    <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{b}</span>
                    <span style={{ color: '#999', fontSize: 12, marginLeft: 8 }}>
                      {b === 'patch' ? '评估逻辑微调（x.x.+1）' : b === 'minor' ? '新增评估维度（x.+1.0）' : '重大变更（+1.0.0）'}
                    </span>
                  </Radio>
                ))}
              </div>
            </Radio.Group>
          </div>
          <div>
            <div style={{ fontWeight: 500, marginBottom: 6, fontSize: 13 }}>
              版本号 <span style={{ color: '#ff4d4f' }}>*</span>
              <span style={{ color: '#999', fontSize: 12, marginLeft: 8 }}>
                上次版本：<Tag style={{ fontFamily: 'monospace', margin: 0 }}>{publishEvl ? getLatestEvlVersion(publishEvl) : 'v1.0.0'}</Tag>
              </span>
            </div>
            <Input value={pubVersion} onChange={e => setPubVersion(e.target.value)} placeholder="vX.Y.Z"
              style={{ fontFamily: 'monospace', fontSize: 14 }} prefix={<TagOutlined style={{ color: '#6366F1' }} />} />
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>已根据上次版本自动生成建议版本号，可手动修改，格式须为 vX.Y.Z</div>
          </div>
          <div>
            <div style={{ fontWeight: 500, marginBottom: 6, fontSize: 13 }}>更新日志 <span style={{ color: '#94a3b8', fontWeight: 400 }}>（可选）</span></div>
            <TextArea value={pubChangelog} onChange={e => setPubChangelog(e.target.value)} rows={3} placeholder="描述本次版本的变更内容…" maxLength={500} showCount />
          </div>
          <div>
            <div style={{ fontWeight: 500, marginBottom: 8, fontSize: 13 }}>公开范围</div>
            <Radio.Group value={pubScope} onChange={e => setPubScope(e.target.value)} style={{ width: '100%' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {(Object.keys(SCOPE_LABELS) as VisibilityScope[]).map(s => (
                  <Radio.Button key={s} value={s} style={{ flex: 1, textAlign: 'center', borderColor: pubScope === s ? '#6366F1' : undefined, color: pubScope === s ? '#6366F1' : undefined }}>
                    <Space size={4}>{SCOPE_LABELS[s].icon}<span>{SCOPE_LABELS[s].label}</span></Space>
                  </Radio.Button>
                ))}
              </div>
            </Radio.Group>
          </div>
        </div>
      </Modal>

      {/* 回滚确认弹窗 */}
      <Modal
        title={`回滚至 ${historyRollbackTarget?.version} 版本`}
        open={!!historyRollbackTarget}
        onCancel={() => setHistoryRollbackTarget(null)}
        footer={
          <Space>
            <Button onClick={() => setHistoryRollbackTarget(null)}>取消</Button>
            <Button type="primary" onClick={handleRollback}
              style={{ background: '#1a1a1a', borderColor: '#1a1a1a', borderRadius: 8 }}>
              回滚
            </Button>
          </Space>
        }
        width={520}
      >
        {historyRollbackTarget && (
          <div style={{ padding: '4px 0 8px' }}>
            <div style={{ border: '1px solid #e8e8e8', borderRadius: 8, padding: '14px 16px', marginBottom: 20, background: '#fafafa' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>回滚版本 {historyRollbackTarget.version}</span>
                <span style={{ fontSize: 13, color: '#999' }}>{historyRollbackTarget.publishedBy} · {historyRollbackTarget.publishedAt}</span>
              </div>
              <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
                {historyRollbackTarget.changelog || `将评估器「${historyEvl?.name}」恢复至 ${historyRollbackTarget.version} 版本配置。`}
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#111', marginBottom: 10 }}>此操作会：</div>
              <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>评估器配置恢复至选中的 {historyRollbackTarget.version} 版本状态</li>
                <li style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>撤销该版本之后的所有未发布更改</li>
                <li style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>历史记录会保留，可随时回滚到其他版本</li>
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ─── 独立页面组件 ────────────────────────────────────────────────────────────

export const EvaluationTasks: React.FC = () => {
  const [datasets] = useState<Dataset[]>(initDatasets);
  const [evaluators] = useState<Evaluator[]>(initEvaluators);
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>评测任务</h1>
        <p style={{ margin: '6px 0 0', color: '#666', fontSize: 14 }}>管理评测任务</p>
      </div>
      <TasksTab datasets={datasets} evaluators={evaluators} />
    </div>
  );
};

export const EvaluationData: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>(initDatasets);
  const [detailDataset, setDetailDataset] = useState<Dataset | null>(null);

  if (detailDataset) {
    return <DatasetDetail dataset={detailDataset} onBack={() => setDetailDataset(null)} />;
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>评测集</h1>
        <p style={{ margin: '6px 0 0', color: '#666', fontSize: 14 }}>管理评测数据集</p>
      </div>
      <DataTab datasets={datasets} setDatasets={setDatasets} onViewDetail={setDetailDataset} />
    </div>
  );
};

export const EvaluationRules: React.FC<{
  onCreateEvaluator?: (type: 'LLM' | 'Code') => void;
  onEditEvaluator?: (evaluatorId: string, type: 'LLM' | 'Code') => void;
}> = ({ onCreateEvaluator, onEditEvaluator }) => {
  const [evaluators, setEvaluators] = useState<Evaluator[]>(initEvaluators);
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>评估器</h1>
        <p style={{ margin: '6px 0 0', color: '#666', fontSize: 14 }}>管理评估器</p>
      </div>
      <RulesTab
        evaluators={evaluators}
        setEvaluators={setEvaluators}
        onCreateEvaluator={onCreateEvaluator}
        onEditEvaluator={onEditEvaluator}
      />
    </div>
  );
};

// ─── 主组件（保留兼容） ───────────────────────────────────────────────────────

const Evaluation: React.FC = () => {
  return <EvaluationTasks />;
};

export default Evaluation;
