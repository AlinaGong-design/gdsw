import React, { useState, useRef, useEffect } from 'react';
import {
  Button, Input, Select, Badge, Table, Drawer,
  message, Switch, Tooltip, Popconfirm, Divider, Tag,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined,
  ClockCircleOutlined, ThunderboltOutlined,
  RobotOutlined, MessageOutlined, ApiOutlined,
  BellOutlined, SearchOutlined, CheckCircleOutlined,
  HistoryOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';

// ─── 类型定义 ─────────────────────────────────────────────

type TriggerType = 'scheduled' | 'event';
type TaskStatus  = 'active' | 'paused' | 'draft' | 'error';
type FreqType    = '不重复' | '每天' | '每周' | '每月';

interface ScheduledTask {
  id: string;
  name: string;
  employeeName: string;
  employeeId: string;
  triggerType: TriggerType;
  cronExpr: string;
  cronDesc: string;
  nlInput: string;
  taskContent: string;
  channel: string;
  status: TaskStatus;
  lastRunAt: string;
  nextRunAt: string;
  runCount: number;
  successCount: number;
  source: 'chat' | 'task';
}

interface TaskRunLog {
  id: string;
  taskId: string;
  runAt: string;
  status: 'success' | 'fail' | 'running';
  duration: string;
  output: string;
}

// ─── Mock 数据 ─────────────────────────────────────────────

const MOCK_TASKS: ScheduledTask[] = [
  {
    id: 'st-001', name: '每日数据晨报', employeeName: '财务报表助手', employeeId: 'de-003',
    triggerType: 'scheduled', cronExpr: '0 8 * * 1-5', cronDesc: '每天 08:00',
    nlInput: '', taskContent: '拉取昨日销售额、成本、毛利率数据，生成摘要报告并推送到elink',
    channel: 'elink', status: 'active', lastRunAt: '2026-04-02 08:00', nextRunAt: '2026-04-03 08:00',
    runCount: 43, successCount: 43, source: 'task',
  },
  {
    id: 'st-002', name: 'PR 代码审查', employeeName: '代码审查助手', employeeId: 'de-004',
    triggerType: 'event', cronExpr: '', cronDesc: '代码提交 提交时触发',
    nlInput: '', taskContent: '检测到新 PR 时自动执行代码审查，输出质量报告并评论到 PR',
    channel: 'elink', status: 'active', lastRunAt: '2026-04-02 16:32', nextRunAt: '事件触发',
    runCount: 128, successCount: 121, source: 'chat',
  },
  {
    id: 'st-003', name: '合规周报汇总', employeeName: '法务合规助手', employeeId: 'de-001',
    triggerType: 'scheduled', cronExpr: '0 17 * * 5', cronDesc: '每周星期五 17:00',
    nlInput: '', taskContent: '汇总本周合规检查记录，生成结构化周报，发送给法务负责人',
    channel: '短信', status: 'active', lastRunAt: '2026-03-28 17:00', nextRunAt: '2026-04-04 17:00',
    runCount: 12, successCount: 12, source: 'task',
  },
  {
    id: 'st-004', name: '简历筛选日报', employeeName: 'HR 招聘助手', employeeId: 'de-002',
    triggerType: 'scheduled', cronExpr: '0 18 * * *', cronDesc: '每天 18:00',
    nlInput: '', taskContent: '统计当日新增简历数量、初筛结果，生成候选人质量分析报告',
    channel: '短信', status: 'paused', lastRunAt: '2026-04-01 18:00', nextRunAt: '—',
    runCount: 31, successCount: 30, source: 'chat',
  },
  {
    id: 'st-006', name: '月度绩效汇总', employeeName: '法务合规助手', employeeId: 'de-001',
    triggerType: 'scheduled', cronExpr: '0 9 1 * *', cronDesc: '每月1日 09:00',
    nlInput: '', taskContent: '汇总上月任务完成情况、评分数据，生成绩效分析报告',
    channel: 'elink', status: 'draft', lastRunAt: '—', nextRunAt: '2026-05-01 09:00',
    runCount: 0, successCount: 0, source: 'chat',
  },
];

const MOCK_LOGS: TaskRunLog[] = [
  { id: 'log-001', taskId: 'st-001', runAt: '2026-04-02 08:00:03', status: 'success', duration: '4.2s', output: '财务晨报已生成：昨日销售额 ¥1,248,000，环比+5.2%，毛利率 42.3%。已推送至「财务组」工作群。' },
  { id: 'log-002', taskId: 'st-001', runAt: '2026-04-01 08:00:02', status: 'success', duration: '3.8s', output: '财务晨报已生成：昨日销售额 ¥1,186,000，环比-2.1%，毛利率 41.8%。已推送至「财务组」工作群。' },
  { id: 'log-003', taskId: 'st-001', runAt: '2026-03-31 08:00:05', status: 'success', duration: '5.1s', output: '财务晨报已生成：昨日销售额 ¥1,212,000，环比+1.3%，毛利率 43.1%。已推送至「财务组」工作群。' },
];

// ─── 触发类型配置 ──────────────────────────────────────────

const TRIGGER_CONFIG: Record<TriggerType, { label: string; icon: React.ReactNode; color: string; desc: string }> = {
  scheduled: { label: '定时触发', icon: <ClockCircleOutlined />, color: '#6366F1', desc: '按设定规则定时执行' },
  event:     { label: '事件触发', icon: <ThunderboltOutlined />, color: '#F59E0B', desc: '代码提交、文件变更等外部事件' },
};

const STATUS_CONFIG: Record<TaskStatus, { label: string; badge: 'success' | 'processing' | 'default' | 'error' }> = {
  active:  { label: '运行中', badge: 'success' },
  paused:  { label: '已暂停', badge: 'default' },
  draft:   { label: '草稿',   badge: 'default' },
  error:   { label: '异常',   badge: 'error' },
};

const EMPLOYEES = [
  { id: 'de-001', name: '法务合规助手' },
  { id: 'de-002', name: 'HR 招聘助手' },
  { id: 'de-003', name: '财务报表助手' },
  { id: 'de-004', name: '代码审查助手' },
];

const CHANNELS = ['elink', '短信'];

// ─── 执行时间工具 ──────────────────────────────────────────

const WEEKDAYS  = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];
const MONTH_DAYS = Array.from({ length: 28 }, (_, i) => `${i + 1}日`);

function buildCron(freq: FreqType, day: string, time: string): { cronExpr: string; cronDesc: string } {
  const [h, m] = time.split(':');
  if (freq === '不重复') {
    return { cronExpr: '', cronDesc: `不重复 ${time}` };
  }
  if (freq === '每天') {
    return { cronExpr: `${m} ${h} * * *`, cronDesc: `每天 ${time}` };
  }
  if (freq === '每周') {
    const dayMap: Record<string, number> = {
      '星期一': 1, '星期二': 2, '星期三': 3, '星期四': 4,
      '星期五': 5, '星期六': 6, '星期日': 0,
    };
    return { cronExpr: `${m} ${h} * * ${dayMap[day] ?? 1}`, cronDesc: `每周${day} ${time}` };
  }
  const d = parseInt(day) || 1;
  return { cronExpr: `${m} ${h} ${d} * *`, cronDesc: `每月${day} ${time}` };
}

function parseCronDesc(desc: string): { freq: FreqType; day: string; time: string } {
  if (desc.startsWith('不重复')) {
    const timeMatch = desc.match(/(\d{2}:\d{2})/);
    return { freq: '不重复', day: '', time: timeMatch?.[1] || '08:00' };
  }

  const weekMatch = desc.match(/每周(星期[一二三四五六日])\s+(\d{2}:\d{2})/);
  if (weekMatch) return { freq: '每周', day: weekMatch[1], time: weekMatch[2] };

  const monthMatch = desc.match(/每月(\d+日)\s+(\d{2}:\d{2})/);
  if (monthMatch) return { freq: '每月', day: monthMatch[1], time: monthMatch[2] };

  const timeMatch = desc.match(/(\d{2}:\d{2})/);
  return { freq: '每天', day: '', time: timeMatch?.[1] || '08:00' };
}

// ─── 执行时间选择器（内置星期/日期列）────────────────────────

const ScheduleTimePicker: React.FC<{
  freq: FreqType;
  day: string;
  time: string;
  onChange: (day: string, time: string) => void;
}> = ({ freq, day, time, onChange }) => {
  const showDayCol  = freq === '每周' || freq === '每月';
  const dayOptions  = freq === '每周' ? WEEKDAYS : MONTH_DAYS;
  const dayLabel    = freq === '每周' ? '星期' : '日期';

  const [open, setOpen]       = useState(false);
  const [tempDay, setTempDay] = useState(day || (freq === '每周' ? '星期一' : '1日'));
  const [tempH, setTempH]     = useState(time.split(':')[0] || '08');
  const [tempM, setTempM]     = useState(time.split(':')[1] || '00');

  const containerRef = useRef<HTMLDivElement>(null);
  const dayListRef   = useRef<HTMLDivElement>(null);
  const hourListRef  = useRef<HTMLDivElement>(null);
  const minListRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTempDay(day || (freq === '每周' ? '星期一' : freq === '每月' ? '1日' : ''));
    setTempH(time.split(':')[0] || '08');
    setTempM(time.split(':')[1] || '00');
  }, [day, time, freq]);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => {
      const R = 32;
      if (hourListRef.current) hourListRef.current.scrollTop = Math.max(0, parseInt(tempH) - 2) * R;
      if (minListRef.current)  minListRef.current.scrollTop  = Math.max(0, parseInt(tempM) - 2) * R;
      if (dayListRef.current && showDayCol) {
        const idx = dayOptions.indexOf(tempDay);
        if (idx >= 0) dayListRef.current.scrollTop = Math.max(0, idx - 2) * R;
      }
    }, 30);
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const hours   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  const displayLabel = showDayCol
    ? `${tempDay}  ${tempH}:${tempM}`
    : `${tempH}:${tempM}`;

  const gridCols = showDayCol ? '1.3fr 1fr 1fr' : '1fr 1fr';
  const panelW   = showDayCol ? 300 : 240;

  const ROW_STYLE = (active: boolean, accent = '#6366F1') => ({
    height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', fontSize: 13,
    background: active ? accent : 'transparent',
    color: active ? (accent === '#6366F1' ? '#fff' : '#6366F1') : '#333',
    fontWeight: active ? 600 : 400,
  });

  return (
    <div ref={containerRef} style={{ position: 'relative', flex: showDayCol ? 2.2 : 1.2 }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '0 11px', height: 32, borderRadius: 6,
          border: `1px solid ${open ? '#6366F1' : '#d9d9d9'}`,
          boxShadow: open ? '0 0 0 2px rgba(99,102,241,0.12)' : 'none',
          cursor: 'pointer', background: '#fff', fontSize: 14, color: '#333',
          transition: 'border-color 0.2s, box-shadow 0.2s', userSelect: 'none',
        }}
      >
        <ClockCircleOutlined style={{ color: '#aaa', fontSize: 13 }} />
        <span style={{ flex: 1 }}>{displayLabel}</span>
        <span style={{ color: '#aaa', fontSize: 10, display: 'inline-block', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0,
          width: panelW, background: '#fff', borderRadius: 8,
          border: '2px solid #6366F1',
          boxShadow: '0 6px 24px rgba(0,0,0,0.13)',
          zIndex: 1050, overflow: 'hidden',
        }}>
          {/* 列标题 */}
          <div style={{ display: 'grid', gridTemplateColumns: gridCols, borderBottom: '1px solid #f0f0f0' }}>
            {showDayCol && (
              <div style={{ textAlign: 'center', padding: '7px 0', fontSize: 12, color: '#888', borderRight: '1px solid #f0f0f0' }}>{dayLabel}</div>
            )}
            <div style={{ textAlign: 'center', padding: '7px 0', fontSize: 12, color: '#888', borderRight: '1px solid #f0f0f0' }}>小时</div>
            <div style={{ textAlign: 'center', padding: '7px 0', fontSize: 12, color: '#888' }}>分钟</div>
          </div>

          {/* 滚动列 */}
          <div style={{ display: 'grid', gridTemplateColumns: gridCols, height: 220 }}>
            {showDayCol && (
              <div ref={dayListRef} style={{ overflowY: 'auto', borderRight: '1px solid #f0f0f0' }}>
                {dayOptions.map(d => (
                  <div key={d} onClick={() => setTempDay(d)}
                    style={{ height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 12,
                      background: tempDay === d ? '#EEF2FF' : 'transparent',
                      color: tempDay === d ? '#6366F1' : '#333',
                      fontWeight: tempDay === d ? 600 : 400 }}
                  >{d}</div>
                ))}
              </div>
            )}
            <div ref={hourListRef} style={{ overflowY: 'auto', borderRight: '1px solid #f0f0f0' }}>
              {hours.map(h => (
                <div key={h} onClick={() => setTempH(h)}
                  style={{ height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 13,
                    background: tempH === h ? '#EEF2FF' : 'transparent',
                    color: tempH === h ? '#6366F1' : '#333',
                    fontWeight: tempH === h ? 600 : 400 }}
                >{h}</div>
              ))}
            </div>
            <div ref={minListRef} style={{ overflowY: 'auto' }}>
              {minutes.map(m => (
                <div key={m} onClick={() => setTempM(m)}
                  style={{ height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 13,
                    background: tempM === m ? '#6366F1' : 'transparent',
                    color: tempM === m ? '#fff' : '#333',
                    fontWeight: tempM === m ? 600 : 400 }}
                >{m}</div>
              ))}
            </div>
          </div>

          <div style={{ padding: '10px 12px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => { onChange(showDayCol ? tempDay : '', `${tempH}:${tempM}`); setOpen(false); }}
              style={{ background: '#6366F1', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 22px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
            >保存</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── 执行时间选择器组件 ────────────────────────────────────

interface TimeSchedulePickerProps {
  freq: FreqType;
  day: string;
  time: string;
  onChange: (freq: FreqType, day: string, time: string) => void;
}

const TimeSchedulePicker: React.FC<TimeSchedulePickerProps> = ({ freq, day, time, onChange }) => {
  const handleFreqChange = (v: FreqType) => {
    const defaultDay = v === '每周' ? '星期一' : v === '每月' ? '1日' : '';
    onChange(v, defaultDay, time);
  };

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <Select
        value={freq}
        onChange={handleFreqChange}
        style={{ flex: 1, minWidth: 90 }}
        options={(['不重复', '每天', '每周', '每月'] as FreqType[]).map(v => ({ label: v, value: v }))}
      />
      <ScheduleTimePicker
        freq={freq} day={day} time={time}
        onChange={(d, t) => onChange(freq, d, t)}
      />
    </div>
  );
};

// ─── 新建任务 Drawer ───────────────────────────────────────

const TaskCreateDrawer: React.FC<{
  open: boolean;
  onClose: () => void;
  onSave: (task: Partial<ScheduledTask>) => void;
}> = ({ open, onClose, onSave }) => {
  const [taskName, setTaskName]       = useState('');
  const [taskContent, setTaskContent] = useState('');
  const [employee, setEmployee]       = useState('');
  const [triggerType, setTriggerType] = useState<TriggerType>('scheduled');
  const [channel, setChannel]         = useState('elink');
  const [freq, setFreq]               = useState<FreqType>('每天');
  const [day, setDay]                 = useState('');
  const [time, setTime]               = useState('08:00');

  const handleClose = () => {
    setTaskName(''); setTaskContent(''); setEmployee('');
    setTriggerType('scheduled'); setChannel('elink');
    setFreq('每天'); setDay(''); setTime('08:00');
    onClose();
  };

  const handleSave = () => {
    if (!taskName.trim() || !employee) {
      message.warning('请填写任务名称并选择执行员工');
      return;
    }
    const emp = EMPLOYEES.find(e => e.id === employee);
    const { cronExpr, cronDesc } = triggerType === 'scheduled'
      ? buildCron(freq, day, time)
      : { cronExpr: '', cronDesc: '' };
    onSave({
      name: taskName,
      employeeName: emp?.name || '',
      employeeId: employee,
      triggerType,
      cronExpr,
      cronDesc,
      nlInput: '',
      taskContent,
      channel,
      status: 'active',
    });
    message.success('任务已创建并启动');
    handleClose();
  };

  return (
    <Drawer
      title={<span style={{ fontSize: 14, fontWeight: 700 }}>新建任务</span>}
      open={open}
      onClose={handleClose}
      width={500}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={handleClose}>取消</Button>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            style={{ background: '#6366F1', borderColor: '#6366F1' }}
            onClick={handleSave}
          >
            确认创建
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            任务名称 <span style={{ color: '#ff4d4f' }}>*</span>
          </div>
          <Input
            value={taskName}
            onChange={e => setTaskName(e.target.value)}
            placeholder="请输入任务名称"
            style={{ borderRadius: 8 }}
          />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>执行内容</div>
          <Input.TextArea
            value={taskContent}
            onChange={e => setTaskContent(e.target.value)}
            rows={3}
            placeholder="描述该任务需要执行的具体内容..."
            style={{ borderRadius: 8, resize: 'none' }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              执行员工 <span style={{ color: '#ff4d4f' }}>*</span>
            </div>
            <Select
              value={employee || undefined}
              onChange={setEmployee}
              placeholder="选择执行员工"
              style={{ width: '100%' }}
              options={EMPLOYEES.map(e => ({ label: e.name, value: e.id }))}
            />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>推送渠道</div>
            <Select
              value={channel}
              onChange={setChannel}
              style={{ width: '100%' }}
              options={CHANNELS.map(c => ({ label: c, value: c }))}
            />
          </div>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>触发类型</div>
          <Select
            value={triggerType}
            onChange={v => setTriggerType(v)}
            style={{ width: '100%' }}
            options={Object.entries(TRIGGER_CONFIG).map(([k, v]) => ({
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: v.color }}>{v.icon}</span> {v.label}
                </span>
              ),
              value: k,
            }))}
          />
        </div>
        {triggerType === 'scheduled' && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              执行时间 <span style={{ color: '#ff4d4f' }}>*</span>
            </div>
            <TimeSchedulePicker
              freq={freq} day={day} time={time}
              onChange={(f, d, t) => { setFreq(f); setDay(d); setTime(t); }}
            />
          </div>
        )}
      </div>
    </Drawer>
  );
};

// ─── 任务编辑 Drawer ───────────────────────────────────────

const TaskEditDrawer: React.FC<{
  task: ScheduledTask | null;
  open: boolean;
  onClose: () => void;
}> = ({ task, open, onClose }) => {
  const parsed   = task ? parseCronDesc(task.cronDesc) : { freq: '每天' as FreqType, day: '', time: '08:00' };
  const [freq, setFreq] = useState<FreqType>(parsed.freq);
  const [day,  setDay]  = useState(parsed.day);
  const [time, setTime] = useState(parsed.time);

  // Sync when task changes
  React.useEffect(() => {
    if (task) {
      const p = parseCronDesc(task.cronDesc);
      setFreq(p.freq); setDay(p.day); setTime(p.time);
    }
  }, [task?.id]);

  if (!task) return null;
  const tc = TRIGGER_CONFIG[task.triggerType];

  return (
    <Drawer
      title={<span style={{ fontSize: 14, fontWeight: 700 }}>编辑任务 · {task.name}</span>}
      open={open}
      onClose={onClose}
      width={500}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onClose}>取消</Button>
          <Button
            type="primary"
            style={{ background: '#6366F1', borderColor: '#6366F1' }}
            onClick={() => { message.success('任务已保存'); onClose(); }}
          >
            保存更改
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>任务名称</div>
          <Input defaultValue={task.name} style={{ borderRadius: 8 }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>执行内容</div>
          <Input.TextArea defaultValue={task.taskContent} rows={3} style={{ borderRadius: 8, resize: 'none' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>触发类型</div>
            <div style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', gap: 6, background: '#fafafa' }}>
              <span style={{ color: tc.color, fontSize: 14 }}>{tc.icon}</span>
              <span style={{ fontSize: 12, color: '#555' }}>{tc.label}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>推送渠道</div>
            <Select defaultValue={task.channel} style={{ width: '100%' }} options={CHANNELS.map(c => ({ label: c, value: c }))} />
          </div>
        </div>
        {task.triggerType === 'scheduled' && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>执行时间</div>
            <TimeSchedulePicker
              freq={freq} day={day} time={time}
              onChange={(f, d, t) => { setFreq(f); setDay(d); setTime(t); }}
            />
          </div>
        )}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <HistoryOutlined style={{ color: '#6366F1' }} /> 最近执行记录
          </div>
          <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
            {MOCK_LOGS.filter(l => l.taskId === task.id).slice(0, 3).map((log, idx, arr) => (
              <div key={log.id} style={{ padding: '10px 14px', borderBottom: idx < arr.length - 1 ? '1px solid #f5f5f5' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 14, color: log.status === 'success' ? '#10b981' : '#ef4444' }}>
                  {log.status === 'success' ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: '#333', lineHeight: 1.5 }}>{log.output.slice(0, 60)}…</div>
                  <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>{log.runAt} · 耗时 {log.duration}</div>
                </div>
              </div>
            ))}
            {MOCK_LOGS.filter(l => l.taskId === task.id).length === 0 && (
              <div style={{ padding: '16px', textAlign: 'center', color: '#bbb', fontSize: 12 }}>暂无执行记录</div>
            )}
          </div>
        </div>
      </div>
    </Drawer>
  );
};

// ─── 主页面 ───────────────────────────────────────────────

const ScheduledTasks: React.FC = () => {
  const [tasks, setTasks]                       = useState<ScheduledTask[]>(MOCK_TASKS);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen]     = useState(false);
  const [editingTask, setEditingTask]           = useState<ScheduledTask | null>(null);
  const [searchText, setSearchText]             = useState('');
  const [triggerFilter, setTriggerFilter]       = useState('');
  const [statusFilter, setStatusFilter]         = useState('');

  const filtered = tasks.filter(t => {
    const matchSearch  = !searchText    || t.name.includes(searchText) || t.employeeName.includes(searchText);
    const matchTrigger = !triggerFilter || t.triggerType === triggerFilter;
    const matchStatus  = !statusFilter  || t.status === statusFilter;
    return matchSearch && matchTrigger && matchStatus;
  });

  const handleToggle = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id
      ? { ...t, status: t.status === 'active' ? 'paused' : 'active' }
      : t
    ));
  };

  const handleDelete = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    message.success('任务已删除');
  };

  const handleCreateSave = (partial: Partial<ScheduledTask>) => {
    const newTask: ScheduledTask = {
      id:           `st-${Date.now()}`,
      name:         partial.name         || '新任务',
      employeeName: partial.employeeName || '',
      employeeId:   partial.employeeId   || '',
      triggerType:  partial.triggerType  || 'scheduled',
      cronExpr:     partial.cronExpr     || '',
      cronDesc:     partial.cronDesc     || '',
      nlInput:      partial.nlInput      || '',
      taskContent:  partial.taskContent  || '',
      channel:      partial.channel      || 'elink',
      status:       'active',
      lastRunAt:    '—',
      nextRunAt:    partial.cronDesc     || '—',
      runCount:     0,
      successCount: 0,
      source:       'task',
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const columns: any[] = [
    {
      title: '任务名称',
      key: 'name',
      width: 220,
      render: (_: any, r: ScheduledTask) => (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 2 }}>{r.name}</div>
          <div style={{ fontSize: 11, color: '#aaa', display: 'flex', alignItems: 'center', gap: 4 }}>
            <RobotOutlined /> {r.employeeName}
          </div>
        </div>
      ),
    },
    {
      title: '触发方式',
      key: 'trigger',
      width: 150,
      render: (_: any, r: ScheduledTask) => {
        const cfg = TRIGGER_CONFIG[r.triggerType];
        return (
          <Tag style={{ fontSize: 11, borderRadius: 6, color: cfg.color, borderColor: `${cfg.color}33`, background: `${cfg.color}0d`, display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content', padding: '2px 8px' }}>
            {cfg.icon} {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: '执行规则',
      key: 'rule',
      width: 180,
      render: (_: any, r: ScheduledTask) => (
        <span style={{ fontSize: 12, color: '#333' }}>{r.cronDesc || '—'}</span>
      ),
    },
    {
      title: '任务来源',
      key: 'source',
      width: 100,
      render: (_: any, r: ScheduledTask) => (
        <span style={{
          fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 500,
          background: r.source === 'chat' ? '#eff6ff' : '#f0fdf4',
          color: r.source === 'chat' ? '#3b82f6' : '#16a34a',
          border: `1px solid ${r.source === 'chat' ? '#bfdbfe' : '#bbf7d0'}`,
        }}>
          {r.source === 'chat' ? '对话创建' : '任务创建'}
        </span>
      ),
    },
    {
      title: '推送渠道',
      key: 'channel',
      width: 100,
      render: (_: any, r: ScheduledTask) => <span style={{ fontSize: 12, color: '#555' }}>{r.channel}</span>,
    },
    {
      title: '执行情况',
      key: 'stats',
      width: 140,
      render: (_: any, r: ScheduledTask) => (
        <div>
          <div style={{ fontSize: 12, color: '#333' }}>共 <strong>{r.runCount}</strong> 次 · 成功 <strong style={{ color: '#10b981' }}>{r.successCount}</strong></div>
          <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>
            {r.runCount > 0 ? `成功率 ${Math.round(r.successCount / r.runCount * 100)}%` : '尚未执行'}
          </div>
        </div>
      ),
    },
    {
      title: '下次执行',
      key: 'next',
      width: 140,
      render: (_: any, r: ScheduledTask) => (
        <span style={{ fontSize: 11, color: r.status === 'active' ? '#6366F1' : '#bbb' }}>{r.nextRunAt}</span>
      ),
    },
    {
      title: '状态',
      key: 'status',
      width: 90,
      render: (_: any, r: ScheduledTask) => {
        const cfg = STATUS_CONFIG[r.status];
        return <Badge status={cfg.badge} text={<span style={{ fontSize: 12 }}>{cfg.label}</span>} />;
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      render: (_: any, r: ScheduledTask) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Tooltip title={r.status === 'active' ? '暂停' : '启动'}>
            <Switch
              size="small"
              checked={r.status === 'active'}
              onChange={() => handleToggle(r.id)}
              style={{ background: r.status === 'active' ? '#6366F1' : undefined }}
            />
          </Tooltip>
          <Divider type="vertical" style={{ margin: '0 4px' }} />
          <Button size="small" type="text" icon={<EditOutlined />} style={{ color: '#6366F1', fontSize: 12 }}
            onClick={() => { setEditingTask(r); setEditDrawerOpen(true); }}>
            编辑
          </Button>
          <Button size="small" type="text" icon={<PlayCircleOutlined />} style={{ color: '#10b981', fontSize: 12 }}
            onClick={() => message.success(`「${r.name}」已手动触发执行`)}>
            立即执行
          </Button>
          <Popconfirm title="确认删除此任务？" onConfirm={() => handleDelete(r.id)} okText="删除" cancelText="取消" okButtonProps={{ danger: true }}>
            <Button size="small" type="text" icon={<DeleteOutlined />} style={{ color: '#ff4d4f', fontSize: 12 }} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, background: '#f7f8fc', minHeight: '100%' }}>

      {/* 页头 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>触发任务中心</div>
          <div style={{ fontSize: 13, color: '#999' }}>管理数字员工的所有自动化任务，支持定时触发、事件触发方式</div>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          style={{ background: '#6366F1', borderColor: '#6366F1', borderRadius: 8 }}
          onClick={() => setCreateDrawerOpen(true)}
        >
          新建任务
        </Button>
      </div>

      {/* 任务列表 */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <Input
            prefix={<SearchOutlined style={{ color: '#bbb' }} />}
            placeholder="搜索任务名称 / 员工..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 240, borderRadius: 8 }}
            allowClear
          />
          <Select
            placeholder="触发类型"
            allowClear
            style={{ width: 120 }}
            onChange={v => setTriggerFilter(v || '')}
            options={Object.entries(TRIGGER_CONFIG).map(([k, v]) => ({ label: v.label, value: k }))}
          />
          <Select
            placeholder="状态"
            allowClear
            style={{ width: 110 }}
            onChange={v => setStatusFilter(v || '')}
            options={Object.entries(STATUS_CONFIG).map(([k, v]) => ({ label: v.label, value: k }))}
          />
          <span style={{ marginLeft: 'auto', fontSize: 13, color: '#999' }}>
            共 <strong style={{ color: '#333' }}>{filtered.length}</strong> 个任务
          </span>
        </div>
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10, size: 'small' }}
          size="middle"
        />

        {/* 底部触发方式统计 */}
        {triggerFilter && (() => {
          const cfg = TRIGGER_CONFIG[triggerFilter as TriggerType];
          const count = filtered.filter(t => t.triggerType === triggerFilter).length;
          return (
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid #f0f0f0',
              background: '#fafafa',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <span style={{ fontSize: 11, color: '#aaa', marginRight: 6, flexShrink: 0 }}>当前筛选：</span>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 20,
                background: `${cfg.color}0d`, border: `1px solid ${cfg.color}22`,
              }}>
                <span style={{ color: cfg.color, fontSize: 12 }}>{cfg.icon}</span>
                <span style={{ fontSize: 11, color: '#555' }}>{cfg.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{count}</span>
              </div>
              {count === 0 && (
                <span style={{ fontSize: 12, color: '#bbb' }}>暂无匹配任务</span>
              )}
            </div>
          );
        })()}
      </div>

      {/* 新建任务 Drawer */}
      <TaskCreateDrawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        onSave={handleCreateSave}
      />

      {/* 编辑 Drawer */}
      <TaskEditDrawer
        task={editingTask}
        open={editDrawerOpen}
        onClose={() => { setEditDrawerOpen(false); setEditingTask(null); }}
      />
    </div>
  );
};

export default ScheduledTasks;
