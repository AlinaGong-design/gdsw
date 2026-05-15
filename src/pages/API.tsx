import React, { useState } from 'react';
import {
  Button, Input, Table, Space, Form, Radio, message, Select,
  Popconfirm, Drawer, Typography, Tag, Modal, Timeline, Divider
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
  ReloadOutlined, RobotOutlined, HistoryOutlined, SaveOutlined,
  CloudUploadOutlined, TagOutlined, RollbackOutlined, EyeOutlined,
  FileTextOutlined, ArrowLeftOutlined,
  CheckCircleFilled, ExclamationCircleFilled,
  GlobalOutlined, LockOutlined, TeamOutlined, CloseOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { TextArea } = Input;
const { Text } = Typography;

// ─── 类型定义 ────────────────────────────────────────────────────────────────

type ApiHistoryEventKind = 'save' | 'publish';
type VisibilityScope = 'private' | 'team' | 'public';

interface ToolParam {
  name: string;
  type: string;
  required: boolean;
  in: string;
  description: string;
}

interface ParsedTool {
  name: string;
  description: string;
  method: string;
  path: string;
  parameters: ToolParam[];
}

interface ApiPlugin {
  id: number;
  name: string;
  desc: string;
  authMethod: 'None' | 'API key' | 'OAuth';
  schema: string;
  privacy: string;
  creator: string;
  time: string;
  currentVersion?: string;
  savedStatus?: 'saved' | 'draft' | 'published';
  history?: ApiHistoryEvent[];
}

interface ApiVersion {
  versionId: string;
  version: string;
  changelog: string;
  publishedAt: string;
  publishedBy: string;
  scope: VisibilityScope;
  snapshot: {
    name: string;
    desc: string;
    authMethod: string;
    schema: string;
  };
}

interface ApiHistoryEvent {
  id: string;
  kind: ApiHistoryEventKind;
  time: string;
  user: string;
  desc: string;
  version?: ApiVersion;
}

// ─── 工具函数 ────────────────────────────────────────────────────────────────

const now = () =>
  new Date().toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).replace(/\//g, '-');

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

let idSeq = 4;

const INIT_LIST: ApiPlugin[] = [
  {
    id: 1, name: '获取知识库列表-get', desc: '获取知识库列表-get', authMethod: 'None', schema: '', privacy: '',
    creator: '超级管理员', time: '2025-12-25 16:56:04',
    currentVersion: 'v1.1.0', savedStatus: 'published',
    history: [
      { id: 'h1', kind: 'publish', time: '2025-12-20 10:00:00', user: '超级管理员', desc: 'v1.0.0',
        version: { versionId: 'v1.0.0', version: 'v1.0.0', changelog: '首次发布', publishedAt: '2025-12-20 10:00', publishedBy: '超级管理员', scope: 'team', snapshot: { name: '获取知识库列表-get', desc: '获取知识库列表-get', authMethod: 'None', schema: '' } } },
      { id: 'h2', kind: 'save', time: '2025-12-22 14:00:00', user: '超级管理员', desc: '调整接口路径配置' },
      { id: 'h3', kind: 'publish', time: '2025-12-25 16:56:04', user: '超级管理员', desc: 'v1.1.0',
        version: { versionId: 'v1.1.0', version: 'v1.1.0', changelog: '新增分页参数支持', publishedAt: '2025-12-25 16:56', publishedBy: '超级管理员', scope: 'team', snapshot: { name: '获取知识库列表-get', desc: '获取知识库列表-get', authMethod: 'None', schema: '' } } },
    ],
  },
  {
    id: 2, name: '生成随机数测试', desc: '生成随机数测试', authMethod: 'None', schema: '', privacy: '',
    creator: '超级管理员', time: '2025-12-25 16:51:17',
    currentVersion: 'v1.0.0', savedStatus: 'published',
    history: [
      { id: 'h1', kind: 'publish', time: '2025-12-25 16:51:00', user: '超级管理员', desc: 'v1.0.0',
        version: { versionId: 'v1.0.0', version: 'v1.0.0', changelog: '首次发布', publishedAt: '2025-12-25 16:51', publishedBy: '超级管理员', scope: 'team', snapshot: { name: '生成随机数测试', desc: '生成随机数测试', authMethod: 'None', schema: '' } } },
    ],
  },
  {
    id: 3, name: 'curl测试', desc: '测试', authMethod: 'None', schema: '', privacy: '',
    creator: '超级管理员', time: '2025-12-25 16:36:27',
    savedStatus: 'draft',
    history: [],
  },
];

const EXAMPLE_SCHEMA = JSON.stringify({
  openapi: '3.0.0',
  info: { title: 'Pet Store API', version: '1.0.0' },
  paths: {
    '/pets': {
      get: {
        operationId: 'listPets',
        summary: '列出所有宠物',
        parameters: [
          { name: 'limit', in: 'query', description: '返回结果的数量限制', required: false, schema: { type: 'integer' } }
        ],
        responses: { '200': { description: '成功返回宠物列表' } }
      },
      post: {
        operationId: 'createPet',
        summary: '创建新宠物',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', description: '宠物名称' },
                  age: { type: 'integer', description: '宠物年龄' }
                }
              }
            }
          }
        },
        responses: { '201': { description: '宠物创建成功' } }
      }
    }
  }
}, null, 2);

function parseSchema(schemaStr: string): ParsedTool[] {
  try {
    const schema = JSON.parse(schemaStr);
    const tools: ParsedTool[] = [];
    if (!schema.paths) return tools;

    Object.keys(schema.paths).forEach(path => {
      const pathItem = schema.paths[path];
      ['get', 'post', 'put', 'delete', 'patch'].forEach(method => {
        if (pathItem[method]) {
          const op = pathItem[method];
          const operationId = op.operationId || `${method}_${path.replace(/\//g, '_')}`;
          const parameters: ToolParam[] = [];

          if (op.parameters) {
            op.parameters.forEach((param: any) => {
              parameters.push({
                name: param.name,
                type: param.schema?.type || param.type || 'string',
                required: param.required || false,
                in: param.in || 'query',
                description: param.description || ''
              });
            });
          }

          if (op.requestBody) {
            const content = op.requestBody.content;
            if (content?.['application/json']) {
              const bodySchema = content['application/json'].schema;
              if (bodySchema?.properties) {
                Object.keys(bodySchema.properties).forEach(propName => {
                  const prop = bodySchema.properties[propName];
                  parameters.push({
                    name: propName,
                    type: prop.type || 'string',
                    required: bodySchema.required?.includes(propName) || false,
                    in: 'body',
                    description: prop.description || ''
                  });
                });
              }
            }
          }

          tools.push({
            name: operationId,
            description: op.summary || op.description || '无描述',
            method: method.toUpperCase(),
            path,
            parameters
          });
        }
      });
    });
    return tools;
  } catch {
    return [];
  }
}

function getPlaceholder(type: string): string {
  const map: Record<string, string> = {
    integer: '请输入整数', number: '请输入数字',
    boolean: '请输入 true 或 false', string: '请输入文本',
    array: '请输入数组（JSON格式）', object: '请输入对象（JSON格式）'
  };
  return map[type] || '请输入参数值';
}

function validateParamValue(type: string, value: string): string {
  if (!value) return '';
  switch (type) {
    case 'integer': return /^-?\d+$/.test(value) ? '' : '请输入有效的整数';
    case 'number': return isNaN(Number(value)) ? '请输入有效的数字' : '';
    case 'boolean': return (value === 'true' || value === 'false') ? '' : '请输入 true 或 false';
    case 'array':
      try { return Array.isArray(JSON.parse(value)) ? '' : '请输入有效的数组格式'; }
      catch { return '数组格式错误，请输入有效的JSON数组'; }
    case 'object':
      try {
        const p = JSON.parse(value);
        return (typeof p === 'object' && !Array.isArray(p)) ? '' : '请输入有效的对象格式';
      } catch { return '对象格式错误，请输入有效的JSON对象'; }
    default: return '';
  }
}

// ─── API 历史版本抽屉 ─────────────────────────────────────────────────────────

const ApiHistoryDrawer: React.FC<{
  plugin: ApiPlugin | null;
  open: boolean;
  onClose: () => void;
  onRollback: (plugin: ApiPlugin, ver: ApiVersion) => void;
  previewVersion: ApiVersion | null;
  onPreviewVersion: (ver: ApiVersion) => void;
  onExitPreview: () => void;
}> = ({ plugin, open, onClose, onRollback, previewVersion, onPreviewVersion, onExitPreview }) => {
  const [rollbackTarget, setRollbackTarget] = useState<ApiVersion | null>(null);

  if (!plugin) return null;
  const history = plugin.history || [];
  const isPreview = !!previewVersion;

  const handleRollbackConfirm = () => {
    if (!rollbackTarget) return;
    onRollback(plugin, rollbackTarget);
    setRollbackTarget(null);
    onClose();
  };

  return (
    <>
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
        open={open}
        onClose={onClose}
        styles={{ body: { padding: '16px 20px' } }}
      >
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
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{ev.user} · {ev.time}</div>
                {ev.kind === 'publish' && ev.version && (
                  <>
                    {ev.version.changelog && (
                      <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic', marginBottom: 4, paddingLeft: 8, borderLeft: '2px solid #e2e8f0', lineHeight: 1.5 }}>
                        {ev.version.changelog}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>公开范围：</span>
                      <Tag style={{ fontSize: 11, margin: 0 }}>{SCOPE_LABELS[ev.version.scope].label}</Tag>
                    </div>
                    <Space size={6}>
                      <Button
                        size="small" icon={<EyeOutlined />}
                        type={isPreview && previewVersion?.versionId === ev.version.versionId ? 'primary' : 'default'}
                        onClick={() => onPreviewVersion(ev.version!)}
                      >查看版本</Button>
                      <Button size="small" icon={<RollbackOutlined />} onClick={() => setRollbackTarget(ev.version!)}>
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

      <Modal
        title={`回滚至 ${rollbackTarget?.version} 版本`}
        open={!!rollbackTarget}
        onCancel={() => setRollbackTarget(null)}
        footer={
          <Space>
            <Button onClick={() => setRollbackTarget(null)}>取消</Button>
            <Button type="primary" onClick={handleRollbackConfirm}
              style={{ background: '#1a1a1a', borderColor: '#1a1a1a', borderRadius: 8 }}>
              回滚
            </Button>
          </Space>
        }
        width={520}
      >
        {rollbackTarget && (
          <div style={{ padding: '4px 0 8px' }}>
            <div style={{ border: '1px solid #e8e8e8', borderRadius: 8, padding: '14px 16px', marginBottom: 20, background: '#fafafa' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>回滚版本 {rollbackTarget.version}</span>
                <span style={{ fontSize: 13, color: '#999' }}>{rollbackTarget.publishedBy} · {rollbackTarget.publishedAt}</span>
              </div>
              <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
                {rollbackTarget.changelog || `将插件「${plugin?.name}」恢复至 ${rollbackTarget.version} 版本的 Schema 及配置。`}
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#111', marginBottom: 10 }}>此操作会：</div>
              <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>插件配置恢复至选中的 {rollbackTarget.version} 版本状态</li>
                <li style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>撤销该版本之后的所有未发布更改</li>
                <li style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>历史记录会保留，可随时回滚到其他版本</li>
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

// ─── 发布版本 Modal ───────────────────────────────────────────────────────────

const PublishApiModal: React.FC<{
  open: boolean;
  latestVersion: string;
  onClose: () => void;
  onPublish: (version: string, changelog: string, scope: VisibilityScope) => void;
}> = ({ open, latestVersion, onClose, onPublish }) => {
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
    if (!/^v\d+\.\d+\.\d+$/.test(version)) { message.error('版本号格式不正确，需为 vX.Y.Z'); return; }
    onPublish(version, changelog, (scope || 'private') as VisibilityScope);
    onClose();
  };

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
            <div style={{ fontWeight: 400, fontSize: 13, color: '#888', marginTop: 2 }}>
              发布后将生成不可变的快照。请确保接口已通过调试验证。
            </div>
          </div>
        </div>
      }
      open={open} onCancel={onClose}
      footer={
        <Space>
          <Button onClick={onClose} style={{ minWidth: 72 }}>取消</Button>
          <Button type="primary" onClick={handleConfirm}
            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', border: 'none', minWidth: 96 }}>
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
          <Input value={version} onChange={e => setVersion(e.target.value)} placeholder="v1.0.0"
            style={{ fontSize: 14, borderRadius: 8 }} />
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>格式示例: v1.0.0, v2.1.3</div>
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

// ─── 测试面板 ────────────────────────────────────────────────────────────────

const TestPanel: React.FC<{ tool: ParsedTool | null }> = ({ tool }) => {
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [paramErrors, setParamErrors] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<{ status: 'success' | 'error'; data: object } | null>(null);

  React.useEffect(() => {
    setParamValues({});
    setParamErrors({});
    setTestResult(null);
  }, [tool]);

  if (!tool) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
        <div>暂无数据</div>
      </div>
    );
  }

  const handleChange = (name: string, value: string) => {
    setParamValues(prev => ({ ...prev, [name]: value }));
    const param = tool.parameters.find(p => p.name === name);
    if (param) {
      const err = param.required && !value ? '此参数为必填项' : validateParamValue(param.type, value);
      setParamErrors(prev => ({ ...prev, [name]: err }));
    }
  };

  const handleTest = () => {
    const errors: Record<string, string> = {};
    let allValid = true;
    tool.parameters.forEach(param => {
      const value = (paramValues[param.name] || '').trim();
      const err = param.required && !value ? '此参数为必填项' : validateParamValue(param.type, value);
      if (err) { errors[param.name] = err; allValid = false; }
    });
    setParamErrors(errors);

    if (!allValid) {
      setTestResult({ status: 'error', data: { error: '参数验证失败', message: '请先修正输入错误' } });
      return;
    }

    const params: Record<string, any> = {};
    tool.parameters.forEach(param => {
      const value = (paramValues[param.name] || '').trim();
      if (value) {
        if (param.type === 'integer') params[param.name] = parseInt(value, 10);
        else if (param.type === 'number') params[param.name] = parseFloat(value);
        else if (param.type === 'boolean') params[param.name] = value === 'true';
        else if (param.type === 'array' || param.type === 'object') {
          try { params[param.name] = JSON.parse(value); } catch { params[param.name] = value; }
        } else params[param.name] = value;
      }
    });

    setTestResult({
      status: 'success',
      data: {
        code: 200, message: 'Success',
        data: {
          requestInfo: { method: tool.method, path: tool.path, operationId: tool.name, parameters: params },
          timestamp: new Date().toISOString(),
          note: '这是模拟的返回结果'
        }
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
        <Text strong>输入参数</Text>
        <Button type="primary" onClick={handleTest} style={{ background: '#3b82f6', borderColor: '#3b82f6' }}>测 试</Button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {tool.parameters.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60, color: '#999' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>ℹ️</div>
            <div>该工具无需参数</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #f0f0f0', width: '25%' }}>参数名</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #f0f0f0', width: '25%' }}>参数类型</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>请输入参数值</th>
              </tr>
            </thead>
            <tbody>
              {tool.parameters.map(param => (
                <tr key={param.name}>
                  <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                    <span style={{ fontWeight: 500 }}>{param.name}</span>
                    {param.required && <span style={{ color: '#ef4444', fontSize: 11, marginLeft: 4 }}>(必填)</span>}
                  </td>
                  <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                    <Tag color="blue" style={{ fontSize: 11 }}>{param.type}</Tag>
                  </td>
                  <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                    <Input
                      value={paramValues[param.name] || ''}
                      onChange={e => handleChange(param.name, e.target.value)}
                      placeholder={getPlaceholder(param.type)}
                      status={paramErrors[param.name] ? 'error' : undefined}
                      size="small"
                    />
                    {paramErrors[param.name] && (
                      <div style={{ color: '#ef4444', fontSize: 11, marginTop: 2 }}>{paramErrors[param.name]}</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {testResult && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Text strong style={{ fontSize: 13 }}>返回值</Text>
              <Tag color={testResult.status === 'success' ? 'success' : 'error'}>
                {testResult.status === 'success' ? '成功' : '失败'}
              </Tag>
            </div>
            <div style={{ background: '#1e293b', borderRadius: 6, padding: 12, overflowX: 'auto' }}>
              <pre style={{ margin: 0, color: '#e2e8f0', fontSize: 12, lineHeight: 1.6 }}>
                {JSON.stringify(testResult.data, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── 配置助手 Modal ──────────────────────────────────────────────────────────

const AssistantModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onUse: (schema: string) => void;
}> = ({ open, onClose, onUse }) => {
  const [input, setInput] = useState('');
  const [generated, setGenerated] = useState('');

  const handleGenerate = () => {
    if (!input.trim()) {
      setGenerated('');
      message.warning('请先输入API文档或CURL命令');
      return;
    }
    const schema = {
      openapi: '3.0.0',
      info: { title: 'Generated API', version: '1.0.0', description: '根据输入自动生成的API Schema' },
      paths: {
        '/api/example': {
          get: {
            operationId: 'getExample',
            summary: '示例接口',
            description: '这是根据您的输入生成的示例接口',
            parameters: [
              { name: 'id', in: 'query', description: 'ID参数', required: false, schema: { type: 'string' } }
            ],
            responses: { '200': { description: '成功', content: { 'application/json': { schema: { type: 'object', properties: { code: { type: 'integer' }, message: { type: 'string' }, data: { type: 'object' } } } } } } }
          }
        }
      }
    };
    setGenerated(JSON.stringify(schema, null, 2));
  };

  const handleCopy = () => {
    if (!generated) { message.warning('请先生成 Schema'); return; }
    navigator.clipboard.writeText(generated).then(() => message.success('已复制')).catch(() => message.error('复制失败'));
  };

  const handleUse = () => {
    if (!generated) { message.warning('请先生成 Schema'); return; }
    onUse(generated);
    onClose();
  };

  const handleClose = () => {
    setInput('');
    setGenerated('');
    onClose();
  };

  return (
    <Modal
      title="配置助手"
      open={open}
      onCancel={handleClose}
      footer={null}
      width={860}
    >
      <div style={{ color: '#666', fontSize: 13, marginBottom: 12 }}>
        请输入API接口文档信息，配置助手自动生成Schema
      </div>
      <div style={{ display: 'flex', gap: 12, height: 360 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>输入API文档或CURL命令</div>
          <TextArea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="请输入API文档或CURL命令"
            style={{ flex: 1, resize: 'none', fontSize: 13, fontFamily: 'monospace' }}
          />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>生成的 Schema</div>
          <div style={{ flex: 1, background: '#1e293b', borderRadius: 6, padding: 12, overflowY: 'auto', border: '1px solid #f0f0f0' }}>
            {generated ? (
              <pre style={{ margin: 0, color: '#e2e8f0', fontSize: 12, lineHeight: 1.6 }}>{generated}</pre>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#475569', fontSize: 13 }}>
                生成的 Schema 将在此处显示
              </div>
            )}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
        <Button onClick={handleGenerate} type="primary" style={{ background: '#4f46e5', borderColor: '#4f46e5' }}>生成</Button>
        <Space>
          <Button onClick={handleCopy}>复制</Button>
          <Button onClick={handleUse} type="primary" style={{ background: '#4f46e5', borderColor: '#4f46e5' }}>使用此Schema</Button>
        </Space>
      </div>
    </Modal>
  );
};

// ─── 插件详情页 ───────────────────────────────────────────────────────────────

const PluginDetail: React.FC<{
  plugin: ApiPlugin | null; // null = 新建
  onBack: () => void;
  onSave: (id: number | null, values: Partial<ApiPlugin>, asDraft: boolean) => void;
  onPublish: (id: number, version: string, changelog: string, scope: VisibilityScope) => void;
  onRollback: (plugin: ApiPlugin, ver: ApiVersion) => void;
}> = ({ plugin, onBack, onSave, onPublish, onRollback }) => {
  const [form] = Form.useForm();
  const [schemaText, setSchemaText] = useState('');
  const [parsedTools, setParsedTools] = useState<ParsedTool[]>([]);
  const [testingTool, setTestingTool] = useState<ParsedTool | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);

  // 保存状态（detail内部跟踪是否有未保存改动）
  const [dirty, setDirty] = useState(false);

  // 历史版本
  const [historyOpen, setHistoryOpen] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<ApiVersion | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);

  const isNew = !plugin;
  const history = plugin?.history || [];

  React.useEffect(() => {
    if (plugin) {
      form.setFieldsValue({ name: plugin.name, desc: plugin.desc, authMethod: plugin.authMethod, privacy: plugin.privacy });
      const s = plugin.schema || '';
      setSchemaText(s);
      setParsedTools(s ? parseSchema(s) : []);
    } else {
      form.resetFields();
      form.setFieldsValue({ authMethod: 'None' });
      setSchemaText('');
      setParsedTools([]);
    }
    setDirty(false);
    setTestingTool(null);
    setPreviewVersion(null);
  }, [plugin, form]);

  // 进入/退出版本预览时，同步表单和 schema 为快照或草稿内容
  React.useEffect(() => {
    if (previewVersion) {
      const snap = previewVersion.snapshot;
      form.setFieldsValue({ name: snap.name, desc: snap.desc, authMethod: snap.authMethod, privacy: '' });
      const s = snap.schema || '';
      setSchemaText(s);
      setParsedTools(s ? parseSchema(s) : []);
      setTestingTool(null);
    } else if (plugin) {
      // 退出预览，恢复草稿
      form.setFieldsValue({ name: plugin.name, desc: plugin.desc, authMethod: plugin.authMethod, privacy: plugin.privacy });
      const s = plugin.schema || '';
      setSchemaText(s);
      setParsedTools(s ? parseSchema(s) : []);
      setTestingTool(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewVersion]);

  const markDirty = () => setDirty(true);

  const handleValidate = () => {
    if (!schemaText.trim()) { message.warning('请先填写 Schema'); return; }
    const tools = parseSchema(schemaText);
    if (tools.length === 0) {
      message.warning('未在Schema中找到任何API路径，请确认格式是否正确');
    } else {
      message.success(`解析成功，共 ${tools.length} 个工具`);
    }
    setParsedTools(tools);
    setTestingTool(null);
  };

  const handleExample = () => {
    setSchemaText(EXAMPLE_SCHEMA);
    setParsedTools(parseSchema(EXAMPLE_SCHEMA));
    setTestingTool(null);
    markDirty();
  };

  const handleSave = () => {
    form.validateFields().then(values => {
      if (!schemaText.trim()) { message.warning('请输入 Schema'); return; }
      onSave(plugin?.id ?? null, { ...values, schema: schemaText }, true);
      setDirty(false);
    });
  };

  const getLatestVersion = (): string => {
    const last = [...history].reverse().find(h => h.kind === 'publish');
    return last?.desc || 'v1.0.0';
  };

  // 保存状态显示（新增/编辑页：未保存 / 已保存 / 已发布，不显示草稿）
  const savedStatus = plugin?.savedStatus;
  const statusTag = (() => {
    if (isNew || dirty) return <Tag icon={<ExclamationCircleFilled />} color="warning" style={{ fontSize: 12 }}>未保存</Tag>;
    if (savedStatus === 'published') return <Tag icon={<CheckCircleFilled />} color="success" style={{ fontSize: 12 }}>已发布</Tag>;
    if (savedStatus === 'saved') return <Tag icon={<CheckCircleFilled />} color="processing" style={{ fontSize: 12 }}>已保存</Tag>;
    // savedStatus === 'draft'：首次进入编辑时也视为未保存
    return <Tag icon={<ExclamationCircleFilled />} color="warning" style={{ fontSize: 12 }}>未保存</Tag>;
  })();

  const methodColor: Record<string, string> = { GET: 'green', POST: 'blue', PUT: 'orange', DELETE: 'red', PATCH: 'purple' };
  const showRight = !!testingTool;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* ── 顶部栏 ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 24px', background: '#fff', borderBottom: '1px solid #f0f0f0',
        flexShrink: 0,
      }}>
        <Space size={8}>
          <Button type="link" icon={<ArrowLeftOutlined />} onClick={onBack} style={{ padding: 0 }}>返回</Button>
          <span style={{ color: '#d9d9d9' }}>|</span>
          <span style={{ fontSize: 16, fontWeight: 600 }}>{isNew ? '新增插件' : plugin.name}</span>
          {!isNew && plugin.currentVersion && (
            <Tag icon={<TagOutlined />} color="purple" style={{ fontFamily: 'monospace', fontSize: 11 }}>
              {plugin.currentVersion}
            </Tag>
          )}
          {statusTag}
        </Space>
        {!isNew && (
          <Button icon={<HistoryOutlined />} size="small" onClick={() => setHistoryOpen(true)}>
            历史版本
          </Button>
        )}
      </div>

      {/* ── 版本预览 Banner ── */}
      {previewVersion && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 24px', background: '#fef3c7', border: '1px solid #fcd34d',
          fontSize: 13, flexShrink: 0,
        }}>
          <Space>
            <EyeOutlined style={{ color: '#d97706' }} />
            <span style={{ color: '#92400e', fontWeight: 500 }}>
              预览版本 <Tag color="orange" style={{ fontFamily: 'monospace' }}>{previewVersion.version}</Tag>
              发布于 {previewVersion.publishedAt}，由 {previewVersion.publishedBy} 提交
            </span>
          </Space>
          <Button icon={<CloseOutlined />} size="small" onClick={() => setPreviewVersion(null)}>退出预览</Button>
        </div>
      )}

      {/* ── 正文 ── */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', minHeight: 0 }}>
        {/* 左侧表单 */}
        <div style={{
          width: showRight ? 560 : '100%', overflowY: 'auto', padding: '24px',
          borderRight: showRight ? '1px solid #f0f0f0' : 'none', flexShrink: 0,
        }}>
          {/* 版本快照内容（预览模式） */}
          {previewVersion && (
            <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '16px 20px', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: '#92400e' }}>版本快照内容</span>
                <Tag color="orange" style={{ fontFamily: 'monospace', fontSize: 12, margin: 0 }}>{previewVersion.version}</Tag>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px 16px', fontSize: 13, color: '#555' }}>
                <span style={{ color: '#92400e', fontWeight: 500 }}>插件名称</span>
                <span>{previewVersion.snapshot.name}</span>
                <span style={{ color: '#92400e', fontWeight: 500 }}>插件说明</span>
                <span>{previewVersion.snapshot.desc || '—'}</span>
                <span style={{ color: '#92400e', fontWeight: 500 }}>认证方式</span>
                <span><Tag style={{ margin: 0 }}>{previewVersion.snapshot.authMethod}</Tag></span>
                <span style={{ color: '#92400e', fontWeight: 500 }}>提交人</span>
                <span>{previewVersion.publishedBy}</span>
                <span style={{ color: '#92400e', fontWeight: 500 }}>发布时间</span>
                <span>{previewVersion.publishedAt}</span>
                <span style={{ color: '#92400e', fontWeight: 500 }}>权限范围</span>
                <span><Tag style={{ margin: 0 }}>{SCOPE_LABELS[previewVersion.scope].label}</Tag></span>
                <span style={{ color: '#92400e', fontWeight: 500 }}>版本说明</span>
                <span style={{ color: previewVersion.changelog ? '#555' : '#aaa', fontStyle: previewVersion.changelog ? 'normal' : 'italic' }}>
                  {previewVersion.changelog || '（无）'}
                </span>
              </div>
            </div>
          )}

          <Form form={form} layout="vertical" onValuesChange={markDirty}>
            <Form.Item label="插件名称" name="name" rules={[{ required: true, message: '请输入插件名称' }]}>
              <Input placeholder="请输入插件名称" maxLength={100} disabled={!!previewVersion} />
            </Form.Item>
            <Form.Item label="插件说明" name="desc">
              <Input placeholder="请输入插件说明" maxLength={200} disabled={!!previewVersion} />
            </Form.Item>
            <Form.Item label="API身份认证" name="authMethod" initialValue="None">
              <Radio.Group disabled={!!previewVersion}>
                <Radio value="None">无</Radio>
                <Radio value="API key">API key</Radio>
                <Radio value="OAuth">OAuth</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item label={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span>Schema 结构 <span style={{ color: '#ff4d4f' }}>*</span></span>
                <Space size={4}>
                  {!previewVersion && (
                    <Button type="link" size="small" style={{ padding: '0 4px' }} onClick={handleExample}>示例</Button>
                  )}
                  <Button type="link" size="small" style={{ padding: '0 4px' }} onClick={handleValidate}>校验代码</Button>
                  {!previewVersion && (
                    <Button size="small" icon={<RobotOutlined />} onClick={() => setAssistantOpen(true)}
                      style={{ borderColor: '#6366F1', color: '#6366F1', fontSize: 12 }}>
                      配置助手
                    </Button>
                  )}
                </Space>
              </div>
            }>
              <TextArea
                value={schemaText}
                onChange={e => {
                  setSchemaText(e.target.value);
                  if (!previewVersion) markDirty();
                }}
                placeholder="请输入 OpenAPI 3.0 Schema..."
                rows={10}
                style={{ fontFamily: 'monospace', fontSize: 12 }}
              />
            </Form.Item>

            {/* 可用工具 */}
            <Form.Item label="可用工具">
              <div style={{ border: '1px solid #f0f0f0', borderRadius: 6, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead style={{ background: '#fafafa' }}>
                    <tr>
                      <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #f0f0f0', width: '22%' }}>名称</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #f0f0f0', width: '28%' }}>描述</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #f0f0f0', width: '14%' }}>方法</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #f0f0f0', width: '26%' }}>路径</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedTools.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', color: '#6b7280', padding: 16 }}>
                          暂无解析出的工具，请填写 Schema 并点击"校验代码"
                        </td>
                      </tr>
                    ) : parsedTools.map((tool, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f9f9f9' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tool.name}</td>
                        <td style={{ padding: '8px 10px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tool.description}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <Tag color={methodColor[tool.method] || 'default'} style={{ fontSize: 11 }}>{tool.method}</Tag>
                        </td>
                        <td style={{ padding: '8px 10px', color: '#666', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tool.path}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <Button type="link" size="small" onClick={() => setTestingTool(tool)}>测试</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Form.Item>

            <Form.Item label="隐私政策" name="privacy">
              <Input placeholder="请输入隐私政策" disabled={!!previewVersion} />
            </Form.Item>
          </Form>
        </div>

        {/* 右侧测试面板 */}
        {showRight && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <TestPanel tool={testingTool} />
          </div>
        )}
      </div>

      {/* ── 底部操作栏 ── */}
      {!previewVersion && (
        <div style={{
          display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
          gap: 8, padding: '12px 24px',
          background: '#fff', borderTop: '1px solid #f0f0f0', flexShrink: 0,
        }}>
          <Button onClick={onBack}>取消</Button>
          <Button icon={<SaveOutlined />} onClick={handleSave}>保存</Button>
          <Button
            type="primary"
            icon={<CloudUploadOutlined />}
            disabled={isNew || dirty || savedStatus === 'draft'}
            title={isNew ? '请先保存插件，再发布版本' : (dirty || savedStatus === 'draft') ? '请先保存，再发布版本' : ''}
            onClick={() => setPublishOpen(true)}
            style={!(isNew || dirty || savedStatus === 'draft')
              ? { background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', border: 'none' }
              : {}
            }
          >
            发布
          </Button>
        </div>
      )}

      {/* ── 历史版本抽屉 ── */}
      {plugin && (
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
          {/* 草稿入口 */}
          <div
            onClick={previewVersion ? () => { setPreviewVersion(null); setHistoryOpen(false); } : undefined}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 8, padding: '10px 14px', marginBottom: 4, borderRadius: 8,
              cursor: previewVersion ? 'pointer' : 'default',
              background: !previewVersion ? '#f0fdf4' : '#f0f9ff',
              border: !previewVersion ? '1.5px solid #86efac' : '1px solid #bae6fd',
            }}
          >
            <Space size={6}>
              <FileTextOutlined style={{ color: previewVersion ? '#0ea5e9' : '#16a34a' }} />
              <span style={{ fontSize: 13, color: previewVersion ? '#0369a1' : '#15803d', fontWeight: 500 }}>
                草稿（当前编辑版本）
              </span>
            </Space>
            {!previewVersion
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
                <div style={{ marginBottom: 8 }}>
                  {ev.kind === 'publish' ? (
                    // ── 发布事件：完整版本信息卡片 ──
                    <div style={{ border: '1px solid #ede9fe', borderRadius: 8, padding: '12px 14px', background: '#fafafa' }}>
                      {/* 版本号 + 标签 */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                        <Tag color="purple" style={{ margin: 0, fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>
                          {ev.version?.version || ev.desc}
                        </Tag>
                        <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>正式发布</Tag>
                      </div>
                      {/* 提交人 + 时间 */}
                      <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: '4px 8px', fontSize: 12, marginBottom: 8 }}>
                        <span style={{ color: '#94a3b8' }}>提交人</span>
                        <span style={{ color: '#374151', fontWeight: 500 }}>{ev.version?.publishedBy || ev.user}</span>
                        <span style={{ color: '#94a3b8' }}>发布时间</span>
                        <span style={{ color: '#374151' }}>{ev.version?.publishedAt || ev.time}</span>
                        <span style={{ color: '#94a3b8' }}>权限范围</span>
                        <span style={{ color: '#374151' }}>
                          {ev.version ? (
                            <Tag style={{ fontSize: 11, margin: 0 }}>{SCOPE_LABELS[ev.version.scope].label}</Tag>
                          ) : '—'}
                        </span>
                      </div>
                      {/* 版本说明 */}
                      {ev.version?.changelog ? (
                        <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, padding: '8px 10px', background: '#f1f5f9', borderRadius: 6, marginBottom: 10 }}>
                          <span style={{ color: '#94a3b8', marginRight: 4 }}>版本说明</span>
                          {ev.version.changelog}
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: '#cbd5e1', fontStyle: 'italic', marginBottom: 10 }}>无版本说明</div>
                      )}
                      {/* 操作按钮 */}
                      {ev.version && (
                        <Space size={6}>
                          <Button
                            size="small" icon={<EyeOutlined />}
                            type={previewVersion?.versionId === ev.version.versionId ? 'primary' : 'default'}
                            onClick={() => { setPreviewVersion(ev.version!); setHistoryOpen(false); }}
                          >查看版本</Button>
                          <RollbackButton
                            version={ev.version}
                            plugin={plugin}
                            onRollback={(ver) => { onRollback(plugin, ver); setHistoryOpen(false); }}
                          />
                        </Space>
                      )}
                    </div>
                  ) : (
                    // ── 保存事件：简洁行 ──
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div>
                        <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{ev.desc}</span>
                        <Tag style={{ marginLeft: 6, fontSize: 11, color: '#64748b', borderColor: '#cbd5e1', background: '#f8fafc' }}>草稿保存</Tag>
                      </div>
                      <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>{ev.user} · {ev.time}</span>
                    </div>
                  )}
                </div>
              ),
            }))}
          />
        </Drawer>
      )}

      {/* ── 发布版本 Modal ── */}
      {plugin && (
        <PublishApiModal
          open={publishOpen}
          latestVersion={getLatestVersion()}
          onClose={() => setPublishOpen(false)}
          onPublish={(version, changelog, scope) => {
            onPublish(plugin.id, version, changelog, scope);
            setPublishOpen(false);
          }}
        />
      )}

      <AssistantModal
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        onUse={schema => {
          setSchemaText(schema);
          setParsedTools(parseSchema(schema));
          setTestingTool(null);
          markDirty();
          message.success('Schema 已填入');
        }}
      />
    </div>
  );
};

// 回滚按钮（带确认弹窗）
const RollbackButton: React.FC<{
  version: ApiVersion;
  plugin: ApiPlugin;
  onRollback: (ver: ApiVersion) => void;
}> = ({ version, plugin, onRollback }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="small" icon={<RollbackOutlined />} onClick={() => setOpen(true)}>回滚</Button>
      <Modal
        title={`回滚至 ${version.version} 版本`}
        open={open}
        onCancel={() => setOpen(false)}
        footer={
          <Space>
            <Button onClick={() => setOpen(false)}>取消</Button>
            <Button type="primary" onClick={() => { onRollback(version); setOpen(false); }}
              style={{ background: '#1a1a1a', borderColor: '#1a1a1a', borderRadius: 8 }}>
              回滚
            </Button>
          </Space>
        }
        width={520}
      >
        <div style={{ padding: '4px 0 8px' }}>
          <div style={{ border: '1px solid #e8e8e8', borderRadius: 8, padding: '14px 16px', marginBottom: 20, background: '#fafafa' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>回滚版本 {version.version}</span>
              <span style={{ fontSize: 13, color: '#999' }}>{version.publishedBy} · {version.publishedAt}</span>
            </div>
            <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
              {version.changelog || `将插件「${plugin.name}」恢复至 ${version.version} 版本的 Schema 及配置。`}
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#111', marginBottom: 10 }}>此操作会：</div>
            <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>插件配置恢复至选中的 {version.version} 版本状态</li>
              <li style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>撤销该版本之后的所有未发布更改</li>
              <li style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>历史记录会保留，可随时回滚到其他版本</li>
            </ul>
          </div>
        </div>
      </Modal>
    </>
  );
};

// ─── 主组件 ──────────────────────────────────────────────────────────────────

const API: React.FC = () => {
  const [list, setList] = useState<ApiPlugin[]>(INIT_LIST);
  const [searchName, setSearchName] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  // 详情页状态：null=列表, null plugin=新建, plugin=编辑
  const [detailPlugin, setDetailPlugin] = useState<ApiPlugin | null | 'new'>('list' as any);
  const [showDetail, setShowDetail] = useState(false);
  const [editingPlugin, setEditingPlugin] = useState<ApiPlugin | null>(null);

  const filtered = list.filter(item => {
    if (searchName && !item.name.includes(searchName)) return false;
    if (dateStart && item.time < dateStart) return false;
    if (dateEnd && item.time > dateEnd + ' 23:59:59') return false;
    return true;
  });

  const handleReset = () => { setSearchName(''); setDateStart(''); setDateEnd(''); };

  const openCreate = () => { setEditingPlugin(null); setShowDetail(true); };
  const openEdit = (plugin: ApiPlugin) => { setEditingPlugin(plugin); setShowDetail(true); };
  const handleBack = () => { setShowDetail(false); setEditingPlugin(null); };

  const handleDelete = (id: number) => { setList(prev => prev.filter(p => p.id !== id)); message.success('删除成功'); };

  const handleSave = (id: number | null, values: Partial<ApiPlugin>, _asDraft: boolean) => {
    if (id !== null) {
      setList(prev => prev.map(p => p.id === id
        ? { ...p, ...values, time: now(), savedStatus: 'saved' as const }
        : p
      ));
      // update editingPlugin so detail page reflects new state
      setEditingPlugin(prev => prev ? { ...prev, ...values, time: now(), savedStatus: 'saved' as const } : prev);
      message.success('保存成功');
    } else {
      const newPlugin: ApiPlugin = {
        id: idSeq++, name: values.name || '', desc: values.desc || '',
        authMethod: values.authMethod || 'None', schema: values.schema || '',
        privacy: values.privacy || '', creator: '超级管理员', time: now(),
        savedStatus: 'saved', history: [
          { id: `h${Date.now()}`, kind: 'save', time: now(), user: '当前用户', desc: `新建插件（${values.name || ''}）` }
        ],
      };
      setList(prev => [newPlugin, ...prev]);
      setEditingPlugin(newPlugin);
      message.success('保存成功');
    }
  };

  const handlePublishVersion = (id: number, version: string, changelog: string, scope: VisibilityScope) => {
    const plugin = list.find(p => p.id === id);
    if (!plugin) return;
    const ver: ApiVersion = {
      versionId: version, version, changelog, publishedAt: now(), publishedBy: '当前用户', scope,
      snapshot: { name: plugin.name, desc: plugin.desc, authMethod: plugin.authMethod, schema: plugin.schema },
    };
    const ev: ApiHistoryEvent = {
      id: `h${Date.now()}`, kind: 'publish', time: now(), user: '当前用户',
      desc: version, version: ver,
    };
    const updated = { ...plugin, currentVersion: version, savedStatus: 'published' as const, history: [...(plugin.history || []), ev] };
    setList(prev => prev.map(p => p.id === id ? updated : p));
    setEditingPlugin(updated);
    message.success(`版本 ${version} 发布成功`);
  };

  const handleRollback = (plugin: ApiPlugin, ver: ApiVersion) => {
    const updated = { ...plugin, name: ver.snapshot.name, desc: ver.snapshot.desc, authMethod: ver.snapshot.authMethod as any, schema: ver.snapshot.schema, savedStatus: 'draft' as const, currentVersion: ver.version };
    setList(prev => prev.map(p => p.id === plugin.id ? updated : p));
    setEditingPlugin(updated);
    message.success(`已回滚至 ${ver.version}`);
  };

  const columns: ColumnsType<ApiPlugin> = [
    { title: '序号', width: 70, render: (_, __, idx) => idx + 1 },
    { title: '插件名称', dataIndex: 'name', width: 200 },
    { title: '插件说明', dataIndex: 'desc', width: 240, ellipsis: true },
    {
      title: '状态', width: 100,
      render: (_, record) => {
        if (record.savedStatus === 'published') return <Tag color="success" style={{ fontSize: 11 }}>已发布</Tag>;
        if (record.savedStatus === 'saved') return <Tag color="processing" style={{ fontSize: 11 }}>已保存</Tag>;
        return <Tag color="warning" style={{ fontSize: 11 }}>草稿</Tag>;
      }
    },
    { title: '创建人', dataIndex: 'creator', width: 120 },
    { title: '创建时间', dataIndex: 'time', width: 180 },
    {
      title: '操作', width: 220, fixed: 'right',
      render: (_, record) => (
        <Space size={2}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
          {record.savedStatus === 'published' && (
            <Button type="link" size="small" style={{ color: '#F59E0B' }}
              onClick={() => {
                setList(prev => prev.map(p => p.id === record.id ? { ...p, savedStatus: 'saved' as const } : p));
                message.success('已下架');
              }}
            >下架</Button>
          )}
          <Popconfirm title={`确定要删除插件"${record.name}"吗？`} onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    },
  ];

  // 详情页
  if (showDetail) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <PluginDetail
          plugin={editingPlugin}
          onBack={handleBack}
          onSave={handleSave}
          onPublish={handlePublishVersion}
          onRollback={handleRollback}
        />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>API</h1>
        <p style={{ margin: '6px 0 0', color: '#666', fontSize: 14 }}>管理API插件，配置工具接口与身份认证</p>
      </div>

      {/* 搜索筛选区 */}
      <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 10, padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <Space wrap>
            <Space>
              <span style={{ fontSize: 13, color: '#555' }}>插件名称</span>
              <Input value={searchName} onChange={e => setSearchName(e.target.value)} placeholder="请输入插件名称"
                prefix={<SearchOutlined />} style={{ width: 200 }} allowClear />
            </Space>
            <Space>
              <span style={{ fontSize: 13, color: '#555' }}>创建时间</span>
              <Input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} style={{ width: 140 }} />
              <span style={{ color: '#aaa' }}>→</span>
              <Input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} style={{ width: 140 }} />
            </Space>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
            <Button type="primary" icon={<SearchOutlined />} onClick={() => {}}>查询</Button>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}
            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', border: 'none' }}>
            新增插件
          </Button>
        </div>
      </div>

      {/* 表格 */}
      <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 10, overflow: 'hidden' }}>
        <Table rowKey="id" dataSource={filtered} columns={columns}
          pagination={{ pageSize: 10, showTotal: total => `共 ${total} 条` }} size="middle" scroll={{ x: 'max-content' }} />
      </div>
    </div>
  );
};

export default API;
