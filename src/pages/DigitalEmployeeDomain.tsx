import React, { useState } from 'react';
import { Button, Input, Tag, Modal, message, Progress, Badge, Select, Drawer, Tabs, Switch } from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
  TeamOutlined, ThunderboltOutlined, CheckCircleOutlined,
  BarChartOutlined, SettingOutlined, LockOutlined,
  DatabaseOutlined, RiseOutlined, FallOutlined,
} from '@ant-design/icons';

// ─── 类型 ─────────────────────────────────────────────────
interface DomainItem {
  id: string; name: string; desc: string; color: string; icon: string;
  employeeCount: number; callVolume: number; completionRate: number;
  reuseRate: number; category: string; tags: string[]; status: 'active' | 'building';
  model: string; isolationLevel: string;
}

interface CreateDomainForm {
  name: string; desc: string; color: string; icon: string; category: string; tags: string; model: string;
}

// ─── Mock 数据 ────────────────────────────────────────────
const MOCK_DOMAINS: DomainItem[] = [
  { id: 'd1', name: '法务合规域', desc: '合同审查、合规检测、法律风险管理，覆盖全流程法务支撑', color: '#6366F1', icon: '⚖️', employeeCount: 3, callVolume: 4821, completionRate: 96, reuseRate: 78, category: '专业职能', tags: ['合规', '法律', '风险'], status: 'active', model: 'qwen-max', isolationLevel: 'strict' },
  { id: 'd2', name: '人力资源域', desc: '招聘筛选、培训管理、绩效考核、员工关系一站式管理', color: '#10B981', icon: '👥', employeeCount: 4, callVolume: 3256, completionRate: 92, reuseRate: 65, category: '管理支撑', tags: ['招聘', '绩效', 'HR'], status: 'active', model: 'chat-model', isolationLevel: 'standard' },
  { id: 'd3', name: '财务管理域', desc: '财务报表、预算管理、成本分析、资金监控', color: '#F59E0B', icon: '💰', employeeCount: 2, callVolume: 2890, completionRate: 98, reuseRate: 82, category: '财务管控', tags: ['财务', '预算', '报表'], status: 'active', model: 'gpt-4o', isolationLevel: 'strict' },
  { id: 'd4', name: '技术研发域', desc: '代码审查、技术文档、架构分析、DevOps 支撑', color: '#3B82F6', icon: '💻', employeeCount: 3, callVolume: 1654, completionRate: 89, reuseRate: 71, category: '技术支撑', tags: ['研发', '代码', '架构'], status: 'active', model: 'gpt-4o', isolationLevel: 'standard' },
  { id: 'd5', name: '客户服务域', desc: '客户咨询、投诉处理、满意度管理、多渠道接入', color: '#EC4899', icon: '🎯', employeeCount: 5, callVolume: 8923, completionRate: 94, reuseRate: 88, category: '市场运营', tags: ['客服', '销售', 'CRM'], status: 'active', model: 'chat-model', isolationLevel: 'standard' },
  { id: 'd6', name: '生产运营域', desc: '生产调度、质量管控、设备维护、安全监管', color: '#8B5CF6', icon: '🏭', employeeCount: 2, callVolume: 1243, completionRate: 91, reuseRate: 60, category: '生产管控', tags: ['生产', '质检', '设备'], status: 'building', model: 'qwen-max', isolationLevel: 'strict' },
  { id: 'd7', name: '管道安全域', desc: '整合光纤预警、机器视觉、无人机巡护等多源数据，支撑管道智能巡检、预警研判与工单闭环全流程', color: '#EF4444', icon: '🛡️', employeeCount: 1, callVolume: 2156, completionRate: 94, reuseRate: 72, category: '安全管控', tags: ['巡检', '预警', '工单', '管道'], status: 'active', model: 'gpt-4o', isolationLevel: 'strict' },
];

const CATEGORIES = ['专业职能', '管理支撑', '财务管控', '技术支撑', '市场运营', '生产管控', '安全管控'];
const DOMAIN_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6', '#14B8A6', '#EF4444'];
const DOMAIN_ICONS  = ['⚖️', '👥', '💰', '💻', '🎯', '🏭', '📊', '🔧', '🌐', '🛡️', '📱', '🚀'];
const MODEL_OPTIONS = [
  { value: 'chat-model', label: '通用对话模型 — 均衡推荐' },
  { value: 'gpt-4o',     label: '高性能推理模型 — 复杂场景' },
  { value: 'qwen-max',   label: '长文本处理模型 — 大文档' },
  { value: 'glm-4',      label: '国产安全模型 — 数据合规' },
];
const ISOLATION_OPTIONS = [
  { value: 'strict',   label: '严格隔离 — 数据完全隔离，需授权才可跨域访问' },
  { value: 'standard', label: '标准隔离 — 域内共享，跨域按需申请' },
  { value: 'open',     label: '开放共享 — 全平台员工均可调用本域能力' },
];

const KNOWLEDGE_BASES_DOMAIN = [
  { id: 'kb1', name: '法律法规库',   desc: '国家法律法规、行业规范文件', icon: '⚖️', access: 'read' },
  { id: 'kb2', name: '公司制度手册', desc: '内部规章制度、标准流程文档', icon: '📋', access: 'read' },
  { id: 'kb3', name: '产品知识库',   desc: '产品说明、FAQ、使用手册',   icon: '📦', access: 'write' },
  { id: 'kb4', name: '行业研报库',   desc: '行业分析报告、市场数据',    icon: '📊', access: 'read' },
  { id: 'kb5', name: '技术文档库',   desc: 'API 文档、开发规范',        icon: '💻', access: 'write' },
];

// ─── 主组件 ───────────────────────────────────────────────
const DigitalEmployeeDomain: React.FC = () => {
  const [domains, setDomains] = useState<DomainItem[]>(MOCK_DOMAINS);
  const [searchText, setSearchText] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editDomain, setEditDomain] = useState<DomainItem | null>(null);
  const [configDrawerDomain, setConfigDrawerDomain] = useState<DomainItem | null>(null);
  const [statsDrawerDomain, setStatsDrawerDomain]   = useState<DomainItem | null>(null);
  const [form, setForm] = useState<CreateDomainForm>({ name: '', desc: '', color: '#6366F1', icon: '🏢', category: '', tags: '', model: 'chat-model' });

  const filtered = domains.filter(d =>
    !searchText || d.name.includes(searchText) || d.desc.includes(searchText) || d.tags.some(t => t.includes(searchText))
  );

  const openCreate = () => {
    setEditDomain(null);
    setForm({ name: '', desc: '', color: '#6366F1', icon: '🏢', category: '', tags: '', model: 'chat-model' });
    setCreateModalOpen(true);
  };

  const openEdit = (d: DomainItem) => {
    setEditDomain(d);
    setForm({ name: d.name, desc: d.desc, color: d.color, icon: d.icon, category: d.category, tags: d.tags.join('、'), model: d.model });
    setCreateModalOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.category) { message.error('请填写域名称和分类'); return; }
    const tags = form.tags.split(/[,，、\s]+/).filter(Boolean);
    if (editDomain) {
      setDomains(prev => prev.map(d => d.id === editDomain.id ? { ...d, ...form, tags } : d));
      message.success(`业务域「${form.name}」已更新`);
    } else {
      const newDomain: DomainItem = { id: `d${Date.now()}`, ...form, tags, employeeCount: 0, callVolume: 0, completionRate: 0, reuseRate: 0, status: 'building', isolationLevel: 'standard' };
      setDomains(prev => [...prev, newDomain]);
      message.success(`业务域「${form.name}」已创建`);
    }
    setCreateModalOpen(false);
  };

  const handleDelete = (d: DomainItem) => {
    Modal.confirm({
      title: `确认删除「${d.name}」？`,
      content: `该域下 ${d.employeeCount} 个数字员工将失去所属域分类，请谨慎操作`,
      okText: '删除', okButtonProps: { danger: true }, cancelText: '取消',
      onOk: () => { setDomains(prev => prev.filter(item => item.id !== d.id)); message.success('已删除'); },
    });
  };

  // 汇总统计
  const totalEmployees  = domains.reduce((s, d) => s + d.employeeCount, 0);
  const totalCalls      = domains.reduce((s, d) => s + d.callVolume, 0);
  const avgCompletion   = Math.round(domains.reduce((s, d) => s + d.completionRate, 0) / domains.length);
  const avgReuse        = Math.round(domains.reduce((s, d) => s + d.reuseRate, 0) / domains.length);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── 汇总统计 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: '业务域总数',    value: domains.length,                                     unit: '个',   color: '#6366F1', icon: '🗂️' },
          { label: '数字员工总数',  value: totalEmployees,                                     unit: '个',   color: '#10B981', icon: '🤖' },
          { label: '累计调用量',    value: totalCalls >= 1000 ? (totalCalls / 1000).toFixed(1) + 'k' : totalCalls, unit: '', color: '#3B82F6', icon: '⚡' },
          { label: '平均完成率',    value: avgCompletion + '%',                                unit: '',     color: '#F59E0B', icon: '✅' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 30 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── 工具栏 ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Input prefix={<SearchOutlined style={{ color: '#bbb' }} />} placeholder="搜索业务域名称、标签..." value={searchText} onChange={e => setSearchText(e.target.value)} style={{ width: 280, borderRadius: 8 }} allowClear />
        <Button type="primary" icon={<PlusOutlined />} style={{ background: '#6366F1', borderColor: '#6366F1', borderRadius: 8 }} onClick={openCreate}>新建业务域</Button>
      </div>

      {/* ── 域卡片网格 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {filtered.map(d => (
          <div
            key={d.id}
            style={{ background: '#fff', borderRadius: 14, border: `1px solid ${d.color}25`, overflow: 'hidden', transition: 'all 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = `0 4px 20px ${d.color}20`; el.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; el.style.transform = ''; }}
          >
            {/* 顶部色条 */}
            <div style={{ height: 6, background: `linear-gradient(90deg, ${d.color}, ${d.color}80)` }} />
            <div style={{ padding: '18px 20px' }}>

              {/* 标题行 */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: `${d.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{d.icon}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 3 }}>{d.name}</div>
                    <Tag style={{ fontSize: 10, margin: 0, color: d.color, borderColor: `${d.color}40`, background: `${d.color}10`, borderRadius: 4 }}>{d.category}</Tag>
                  </div>
                </div>
                <Badge status={d.status === 'active' ? 'success' : 'processing'} text={<span style={{ fontSize: 11, color: '#888' }}>{d.status === 'active' ? '运行中' : '建设中'}</span>} />
              </div>

              {/* 描述 */}
              <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6, marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{d.desc}</div>

              {/* 指标卡片 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 14 }}>
                {[
                  { label: '员工数', value: d.employeeCount + '个' },
                  { label: '调用量', value: d.callVolume >= 1000 ? (d.callVolume / 1000).toFixed(1) + 'k' : d.callVolume },
                  { label: '完成率', value: d.completionRate + '%' },
                  { label: '复用率', value: d.reuseRate + '%' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center', padding: '7px 0', background: '#f9fafb', borderRadius: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: d.color }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: '#aaa' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* 完成率进度条 */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: '#aaa' }}>任务完成率</span>
                  <span style={{ fontSize: 11, color: d.completionRate >= 90 ? '#10B981' : '#F59E0B', fontWeight: 600 }}>{d.completionRate}%</span>
                </div>
                <Progress percent={d.completionRate} size="small" showInfo={false} strokeColor={d.completionRate >= 90 ? '#10B981' : '#F59E0B'} trailColor="#f0f0f0" />
              </div>

              {/* 标签 */}
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
                {d.tags.map(tag => <Tag key={tag} style={{ fontSize: 11, margin: 0, color: '#666', borderRadius: 4 }}>{tag}</Tag>)}
                <Tag icon={<LockOutlined style={{ fontSize: 10 }} />} style={{ fontSize: 10, margin: 0, color: '#999', border: '1px dashed #d9d9d9', borderRadius: 4 }}>
                  {d.isolationLevel === 'strict' ? '严格隔离' : d.isolationLevel === 'standard' ? '标准隔离' : '开放共享'}
                </Tag>
              </div>

              {/* 操作按钮 */}
              <div style={{ display: 'flex', gap: 6, borderTop: '1px solid #f5f5f5', paddingTop: 12 }}>
                <Button size="small" type="text" icon={<EditOutlined />} style={{ color: '#6366F1', fontSize: 12 }} onClick={() => openEdit(d)}>编辑</Button>
                <Button size="small" type="text" icon={<SettingOutlined />} style={{ color: '#6366F1', fontSize: 12 }} onClick={() => setConfigDrawerDomain(d)}>配置</Button>
                <Button size="small" type="text" icon={<BarChartOutlined />} style={{ color: '#6366F1', fontSize: 12 }} onClick={() => setStatsDrawerDomain(d)}>统计</Button>
                <div style={{ flex: 1 }} />
                <Button size="small" type="text" icon={<DeleteOutlined />} style={{ color: '#ff4d4f', fontSize: 12 }} onClick={() => handleDelete(d)}>删除</Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── 新建 / 编辑 Modal ── */}
      <Modal
        title={<span style={{ fontSize: 15, fontWeight: 700 }}>{editDomain ? '编辑业务域' : '新建业务域'}</span>}
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={handleSubmit}
        okText={editDomain ? '保存' : '创建'}
        okButtonProps={{ style: { background: '#6366F1', borderColor: '#6366F1' } }}
        width={540}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
          {/* 预览区 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: `${form.color}08`, borderRadius: 10, border: `1px solid ${form.color}30` }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${form.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{form.icon}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: form.color || '#1a1a1a' }}>{form.name || '域名称预览'}</div>
              <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>{form.category || '未设置分类'}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* 名称 */}
            <div>
              <div style={{ fontSize: 13, color: '#555', marginBottom: 6, fontWeight: 500 }}>域名称 <span style={{ color: '#ff4d4f' }}>*</span></div>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="如：法务合规域" style={{ borderRadius: 8 }} />
            </div>
            {/* 分类 */}
            <div>
              <div style={{ fontSize: 13, color: '#555', marginBottom: 6, fontWeight: 500 }}>分类 <span style={{ color: '#ff4d4f' }}>*</span></div>
              <Select value={form.category || undefined} onChange={v => setForm(p => ({ ...p, category: v }))} placeholder="选择域分类" style={{ width: '100%' }} options={CATEGORIES.map(c => ({ label: c, value: c }))} />
            </div>
          </div>

          {/* 图标 */}
          <div>
            <div style={{ fontSize: 13, color: '#555', marginBottom: 8, fontWeight: 500 }}>域图标</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {DOMAIN_ICONS.map(icon => (
                <div key={icon} onClick={() => setForm(p => ({ ...p, icon }))} style={{ width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, cursor: 'pointer', border: form.icon === icon ? `2px solid ${form.color}` : '1px solid #e8e8e8', background: form.icon === icon ? `${form.color}12` : '#fafafa' }}>{icon}</div>
              ))}
            </div>
          </div>

          {/* 颜色 */}
          <div>
            <div style={{ fontSize: 13, color: '#555', marginBottom: 8, fontWeight: 500 }}>域颜色</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {DOMAIN_COLORS.map(color => (
                <div key={color} onClick={() => setForm(p => ({ ...p, color }))} style={{ width: 30, height: 30, borderRadius: '50%', background: color, cursor: 'pointer', boxShadow: form.color === color ? `0 0 0 3px ${color}50` : 'none', transform: form.color === color ? 'scale(1.15)' : 'scale(1)', transition: 'all 0.15s' }} />
              ))}
            </div>
          </div>

          {/* AI 模型 */}
          <div>
            <div style={{ fontSize: 13, color: '#555', marginBottom: 6, fontWeight: 500 }}>域专属 AI 模型</div>
            <Select value={form.model} onChange={v => setForm(p => ({ ...p, model: v }))} style={{ width: '100%' }} options={MODEL_OPTIONS} />
          </div>

          {/* 描述 */}
          <div>
            <div style={{ fontSize: 13, color: '#555', marginBottom: 6, fontWeight: 500 }}>域描述</div>
            <Input.TextArea value={form.desc} onChange={e => setForm(p => ({ ...p, desc: e.target.value }))} placeholder="描述该域的核心定位与业务范围..." rows={2} style={{ borderRadius: 8, resize: 'none' }} />
          </div>

          {/* 标签 */}
          <div>
            <div style={{ fontSize: 13, color: '#555', marginBottom: 6, fontWeight: 500 }}>标签 <span style={{ fontSize: 11, color: '#bbb', fontWeight: 400 }}>用逗号或空格分隔</span></div>
            <Input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="如：合规、法律、风险" style={{ borderRadius: 8 }} />
          </div>
        </div>
      </Modal>

      {/* ── 域配置 Drawer ── */}
      <Drawer title={`域配置 · ${configDrawerDomain?.name || ''}`} open={!!configDrawerDomain} onClose={() => setConfigDrawerDomain(null)} width={480}>
        {configDrawerDomain && (
          <Tabs
            items={[
              {
                key: 'isolation', label: '能力隔离',
                children: (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>隔离级别</div>
                    {ISOLATION_OPTIONS.map(opt => (
                      <div key={opt.value} style={{ padding: '12px 14px', borderRadius: 10, border: configDrawerDomain.isolationLevel === opt.value ? '1.5px solid #6366F1' : '1px solid #e8e8e8', background: configDrawerDomain.isolationLevel === opt.value ? '#f5f4ff' : '#fafafa', cursor: 'pointer' }}
                        onClick={() => setConfigDrawerDomain({ ...configDrawerDomain, isolationLevel: opt.value })}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: configDrawerDomain.isolationLevel === opt.value ? '#6366F1' : '#1a1a1a' }}>
                          {opt.value === 'strict' ? <><LockOutlined /> 严格隔离</> : opt.value === 'standard' ? '🔐 标准隔离' : '🌐 开放共享'}
                        </div>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{opt.label.split(' — ')[1]}</div>
                      </div>
                    ))}
                    <div style={{ padding: 12, background: '#f0f9ff', borderRadius: 8, fontSize: 12, color: '#0ea5e9' }}>
                      💡 域内数字员工能力自动共享，跨域访问须由域管理员授权
                    </div>
                    <Button type="primary" style={{ background: '#6366F1', borderColor: '#6366F1' }} onClick={() => { message.success('配置已保存'); setConfigDrawerDomain(null); }}>保存配置</Button>
                  </div>
                ),
              },
              {
                key: 'resource', label: '资源调配',
                children: (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 13, color: '#555', marginBottom: 8, fontWeight: 500 }}>域专属 AI 模型</div>
                      <Select value={configDrawerDomain.model} style={{ width: '100%' }} options={MODEL_OPTIONS}
                        onChange={v => setConfigDrawerDomain({ ...configDrawerDomain, model: v })} />
                      <div style={{ fontSize: 12, color: '#aaa', marginTop: 6 }}>本域所有数字员工默认使用此模型，可在员工级别覆盖</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, color: '#555', marginBottom: 8, fontWeight: 500 }}>当前资源使用</div>
                      {[{ label: 'API 调用配额', used: 78 }, { label: '知识库存储', used: 45 }, { label: '并发连接数', used: 62 }].map(r => (
                        <div key={r.label} style={{ marginBottom: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: '#666' }}>{r.label}</span>
                            <span style={{ fontSize: 12, color: r.used > 80 ? '#ff4d4f' : '#52c41a' }}>{r.used}%</span>
                          </div>
                          <Progress percent={r.used} size="small" showInfo={false} strokeColor={r.used > 80 ? '#ff4d4f' : r.used > 60 ? '#F59E0B' : '#10B981'} />
                        </div>
                      ))}
                    </div>
                    <Button type="primary" style={{ background: '#6366F1', borderColor: '#6366F1' }} onClick={() => { message.success('资源配置已保存'); setConfigDrawerDomain(null); }}>保存配置</Button>
                  </div>
                ),
              },
              {
                key: 'knowledge', label: '知识库配置',
                children: (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ fontSize: 12, color: '#666', padding: '8px 12px', background: '#f9f8ff', borderRadius: 8, border: '1px solid #e0deff' }}>
                      💡 域级知识库配置后，本域所有数字员工默认继承访问权限，可在员工级别单独覆盖
                    </div>
                    <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, overflow: 'hidden' }}>
                      {KNOWLEDGE_BASES_DOMAIN.map((kb, idx) => (
                        <div key={kb.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderBottom: idx < KNOWLEDGE_BASES_DOMAIN.length - 1 ? '1px solid #f5f5f5' : 'none', background: '#fff' }}>
                          <span style={{ fontSize: 16 }}>{kb.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', marginBottom: 2 }}>{kb.name}</div>
                            <div style={{ fontSize: 11, color: '#bbb' }}>{kb.desc}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <Tag style={{ fontSize: 10, margin: 0, color: kb.access === 'write' ? '#10B981' : '#6366F1', borderColor: kb.access === 'write' ? '#a7f3d0' : '#c7d2fe', background: kb.access === 'write' ? '#f0fdf4' : '#eef2ff', borderRadius: 4, cursor: 'pointer' }}>
                              {kb.access === 'write' ? '读写' : '只读'}
                            </Tag>
                            <Switch size="small" defaultChecked style={{ background: '#6366F1' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button type="primary" style={{ background: '#6366F1', borderColor: '#6366F1' }} onClick={() => { message.success('知识库配置已保存'); setConfigDrawerDomain(null); }}>保存配置</Button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </Drawer>

      {/* ── 域统计 Drawer ── */}
      <Drawer title={`域统计 · ${statsDrawerDomain?.name || ''}`} open={!!statsDrawerDomain} onClose={() => setStatsDrawerDomain(null)} width={520}>
        {statsDrawerDomain && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* 时段选择 */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#aaa' }}>数据维度：</span>
              {['本日', '本周', '本月', '本季'].map((p, i) => (
                <div key={p} style={{ padding: '4px 12px', borderRadius: 16, fontSize: 12, cursor: 'pointer', background: i === 1 ? statsDrawerDomain!.color : '#f5f5f5', color: i === 1 ? '#fff' : '#666' }}>{p}</div>
              ))}
            </div>
            {/* 核心指标 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {[
                { label: '数字员工数',  value: statsDrawerDomain.employeeCount + ' 个', icon: <TeamOutlined />,         color: '#6366F1' },
                { label: '累计调用量',  value: statsDrawerDomain.callVolume >= 1000 ? (statsDrawerDomain.callVolume / 1000).toFixed(1) + 'k' : statsDrawerDomain.callVolume, icon: <ThunderboltOutlined />, color: '#3B82F6' },
                { label: '任务完成率',  value: statsDrawerDomain.completionRate + '%', icon: <CheckCircleOutlined />,   color: '#10B981' },
                { label: '能力复用率',  value: statsDrawerDomain.reuseRate + '%',       icon: <DatabaseOutlined />,      color: '#F59E0B' },
              ].map(s => (
                <div key={s.label} style={{ padding: '14px 16px', borderRadius: 10, border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: s.color, fontSize: 16 }}>{s.icon}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: '#aaa' }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* 趋势对比 */}
            <div style={{ border: '1px solid #f0f0f0', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 14 }}>近 7 天调用趋势</div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 80 }}>
                {[62, 78, 55, 91, 84, 96, 88].map((v, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: '100%', background: `${statsDrawerDomain.color}`, borderRadius: '3px 3px 0 0', height: v * 0.7, opacity: 0.7 + i * 0.04 }} />
                    <div style={{ fontSize: 10, color: '#aaa' }}>{['一', '二', '三', '四', '五', '六', '日'][i]}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 与其他域对比 */}
            <div style={{ border: '1px solid #f0f0f0', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 14 }}>域间横向对比（完成率）</div>
              {domains.sort((a, b) => b.completionRate - a.completionRate).map(d => (
                <div key={d.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: d.id === statsDrawerDomain.id ? d.color : '#666', fontWeight: d.id === statsDrawerDomain.id ? 600 : 400 }}>{d.name}</span>
                    <span style={{ fontSize: 12, color: d.completionRate >= 90 ? '#10B981' : '#F59E0B', fontWeight: 600 }}>
                      {d.completionRate >= 90 ? <RiseOutlined style={{ marginRight: 3 }} /> : <FallOutlined style={{ marginRight: 3 }} />}
                      {d.completionRate}%
                    </span>
                  </div>
                  <Progress percent={d.completionRate} size="small" showInfo={false} strokeColor={d.id === statsDrawerDomain.id ? d.color : '#e0e0e0'} />
                </div>
              ))}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default DigitalEmployeeDomain;
