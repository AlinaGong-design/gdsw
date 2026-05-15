import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Drawer, Input, Button } from 'antd';
import { SendOutlined, RobotOutlined } from '@ant-design/icons';
import { employeeStore } from '../store/employeeStore';

// ─── 类型 ───────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: React.ReactNode;
  time: string;
}

// ─── 常量 ───────────────────────────────────────────────────
const getTime = () =>
  new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

const QUICK_PROMPTS = [
  { icon: '📊', label: '本周运营数据概览' },
  { icon: '⚠️', label: '有哪些员工需要关注？' },
  { icon: '📝', label: '生成本周运营周报' },
  { icon: '🏆', label: '调用量最高的员工排名' },
];

const EMPLOYEE_MOCK = [
  { name: '智能客服助手', domain: '客服域', callCount: 512, score: 4.7, status: 'published' },
  { name: '法务合规助手', domain: '法务域', callCount: 328, score: 4.8, status: 'published' },
  { name: 'HR 招聘助手',  domain: '人力域', callCount: 215, score: 4.6, status: 'published' },
  { name: '运营数据助手', domain: '运营域', callCount: 173, score: 4.3, status: 'published' },
  { name: '代码审查助手', domain: '技术域', callCount: 142, score: 4.5, status: 'paused'    },
  { name: '财务报表助手', domain: '财务域', callCount: 89,  score: 4.9, status: 'testing'   },
];

// ─── Mock 回答引擎 ──────────────────────────────────────────
function mockAnswer(input: string, activeCount: number): React.ReactNode {
  const q = input;

  /* ── 报告类 ── */
  if (q.includes('报告') || q.includes('周报') || q.includes('日报') || q.includes('月报')) {
    return (
      <div>
        <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 14, color: '#1a1a1a' }}>
          📋 数字员工运营周报
        </div>
        <div style={{ fontSize: 11, color: '#aaa', marginBottom: 12 }}>
          2026年3月23日 — 3月29日 · 集团总部 · 全部域
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          {[
            { label: '总调用量',   value: '8,432',  change: '↑ 8.7%', color: '#6366F1' },
            { label: '活跃员工',   value: String(activeCount), change: '持平',   color: '#10B981' },
            { label: '平均完成率', value: '92.3%',  change: '↑ 0.8%', color: '#3B82F6' },
            { label: '待处理事项', value: '7',      change: '↑ 2 条', color: '#F59E0B' },
          ].map(item => (
            <div key={item.label} style={{ background: '#f9fafb', borderRadius: 8, padding: '8px 10px', border: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: 10, color: '#999', marginBottom: 3 }}>{item.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: item.color, lineHeight: 1.1 }}>{item.value}</div>
              <div style={{ fontSize: 10, color: '#bbb', marginTop: 2 }}>{item.change}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>本周亮点</div>
        <ul style={{ fontSize: 12, color: '#666', paddingLeft: 16, margin: '0 0 12px', lineHeight: 2 }}>
          <li>🥇 <strong>客服域</strong> 调用量最高（2,156 次），完成率 95.2%</li>
          <li>🥈 <strong>法务域</strong> 评分最高（4.8 分），用户满意度领先</li>
          <li>⚠️ <strong>技术域</strong> 完成率 88.1%，低于健康基线（90%）</li>
        </ul>
        <div style={{ display: 'flex', gap: 6 }}>
          <Button size="small" style={{ fontSize: 11, borderRadius: 6 }}>复制文本</Button>
          <Button size="small" style={{ fontSize: 11, borderRadius: 6 }}>导出 PDF</Button>
        </div>
      </div>
    );
  }

  /* ── 调用量排名 ── */
  if (q.includes('排名') || (q.includes('调用') && (q.includes('最高') || q.includes('多少')))) {
    const sorted = [...EMPLOYEE_MOCK].sort((a, b) => b.callCount - a.callCount);
    const medals = ['🥇', '🥈', '🥉'];
    return (
      <div>
        <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 13 }}>🏆 调用量排名（本周）</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {sorted.map((emp, i) => (
            <div
              key={emp.name}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 10px',
                background: i === 0 ? '#fefce8' : '#f9fafb',
                borderRadius: 8,
                border: `1px solid ${i === 0 ? '#fde68a' : '#f0f0f0'}`,
              }}
            >
              <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>
                {medals[i] ?? <span style={{ fontSize: 12, color: '#bbb' }}>{i + 1}</span>}
              </span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>{emp.name}</span>
                <span style={{ fontSize: 10, color: '#bbb', marginLeft: 6 }}>{emp.domain}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#6366F1' }}>
                {emp.callCount.toLocaleString()}
                <span style={{ fontSize: 10, color: '#bbb', fontWeight: 400 }}> 次</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── 需要关注 / 告警 ── */
  if (q.includes('关注') || q.includes('异常') || q.includes('问题') || q.includes('告警') || q.includes('风险')) {
    return (
      <div>
        <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 13 }}>⚠️ 需要关注的员工（3 项）</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { name: '财务报表助手', issue: 'v3.0 版本待审核发布，已等待 2 小时', level: 'high',   action: '去发布' },
            { name: '智能客服分发', issue: 'API 调用异常告警，30 分钟前触发',    level: 'high',   action: '查看'   },
            { name: '代码审查助手', issue: '收到 3 条用户问题反馈，4 小时未处理', level: 'medium', action: '处理'   },
          ].map(item => {
            const isHigh = item.level === 'high';
            return (
              <div
                key={item.name}
                style={{
                  padding: '10px 12px', borderRadius: 8,
                  background: isHigh ? '#fff5f5' : '#fffbeb',
                  border: `1px solid ${isHigh ? '#fecaca' : '#fed7aa'}`,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', marginBottom: 3 }}>{item.name}</div>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>{item.issue}</div>
                <Button
                  size="small"
                  style={{
                    fontSize: 10, height: 22, borderRadius: 4,
                    color: isHigh ? '#ef4444' : '#f59e0b',
                    borderColor: isHigh ? '#fecaca' : '#fed7aa',
                  }}
                >
                  {item.action} →
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ── 评分 ── */
  if (q.includes('评分') || q.includes('分数') || q.includes('满意')) {
    const sorted = [...EMPLOYEE_MOCK].sort((a, b) => b.score - a.score);
    return (
      <div>
        <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 13 }}>⭐ 员工评分概览</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {sorted.map(emp => (
            <div
              key={emp.name}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: '#f9fafb', borderRadius: 8, border: '1px solid #f0f0f0' }}
            >
              <span style={{ fontSize: 12, flex: 1, fontWeight: 500, color: '#1a1a1a' }}>{emp.name}</span>
              <span style={{ fontSize: 10, color: '#bbb', marginRight: 4 }}>{emp.domain}</span>
              <span style={{
                fontSize: 13, fontWeight: 700,
                color: emp.score >= 4.7 ? '#10B981' : emp.score >= 4.0 ? '#6366F1' : '#F59E0B',
              }}>
                ⭐ {emp.score}
              </span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: '#aaa' }}>数据实时更新 · 来源：用户评分</div>
      </div>
    );
  }

  /* ── 运行状态 / 概览 ── */
  if (q.includes('运行') || q.includes('状态') || q.includes('概览') || q.includes('概况') || q.includes('数据')) {
    return (
      <div>
        <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 13 }}>📊 当前运营状态</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          {[
            { label: '运行中员工', value: String(activeCount), color: '#10B981', icon: '✅' },
            { label: '本周调用量', value: '8,432',             color: '#6366F1', icon: '⚡' },
            { label: '平均完成率', value: '92.3%',             color: '#3B82F6', icon: '📈' },
            { label: '待处理事项', value: '7',                 color: '#F59E0B', icon: '⏰' },
          ].map(item => (
            <div key={item.label} style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: 8, border: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: 10, color: '#999', marginBottom: 4 }}>{item.icon} {item.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: item.color, lineHeight: 1 }}>{item.value}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: '#888', background: '#f0fdf4', padding: '8px 10px', borderRadius: 8, border: '1px solid #bbf7d0' }}>
          ✅ 整体运转良好，技术域完成率略低，建议关注
        </div>
      </div>
    );
  }

  /* ── 默认 ── */
  return (
    <div>
      <p style={{ fontSize: 13, color: '#666', margin: '0 0 10px' }}>
        我暂时没有理解您的问题，可以尝试这样问：
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {QUICK_PROMPTS.map(p => (
          <div
            key={p.label}
            style={{ padding: '7px 10px', background: '#f5f4ff', borderRadius: 8, fontSize: 12, color: '#6366F1', border: '1px solid #e0deff' }}
          >
            {p.icon} {p.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 主组件 ─────────────────────────────────────────────────
const AIAssistant: React.FC = () => {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput]     = useState('');
  const [typing, setTyping]   = useState(false);
  const endRef                = useRef<HTMLDivElement>(null);

  const stats = employeeStore.getStats();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const sendMessage = useCallback((text: string) => {
    const q = text.trim();
    if (!q) return;
    setInput('');

    setMessages(prev => [...prev, {
      id: Date.now() + 'u',
      role: 'user',
      content: q,
      time: getTime(),
    }]);

    setTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 'a',
        role: 'assistant',
        content: mockAnswer(q, stats.activeCount),
        time: getTime(),
      }]);
      setTyping(false);
    }, 700 + Math.random() * 500);
  }, [stats.activeCount]);

  const handleOpen = () => {
    setOpen(true);
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        time: getTime(),
        content: (
          <div>
            <p style={{ margin: '0 0 10px', fontSize: 13, color: '#444' }}>
              你好！我是 <strong style={{ color: '#6366F1' }}>AI 管理助手</strong>，可以帮您查询数字员工运营数据、生成报告或发现异常。
            </p>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>快捷提问：</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {QUICK_PROMPTS.map(p => (
                <div
                  key={p.label}
                  onClick={() => sendMessage(p.label)}
                  style={{
                    padding: '8px 12px', background: '#f5f4ff',
                    borderRadius: 8, fontSize: 12, color: '#6366F1',
                    cursor: 'pointer', border: '1px solid #e0deff',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#eef2ff'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = '#f5f4ff'; }}
                >
                  {p.icon} {p.label}
                </div>
              ))}
            </div>
          </div>
        ),
      }]);
    }
  };

  return (
    <>
      {/* ── 悬浮按钮 ── */}
      <div
        onClick={handleOpen}
        title="AI 管理助手"
        style={{
          position: 'fixed', bottom: 36, right: 36, zIndex: 1000,
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 18px rgba(99,102,241,0.45)',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.transform = 'scale(1.1)';
          el.style.boxShadow = '0 6px 24px rgba(99,102,241,0.55)';
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.transform = 'scale(1)';
          el.style.boxShadow = '0 4px 18px rgba(99,102,241,0.45)';
        }}
      >
        <RobotOutlined style={{ color: '#fff', fontSize: 22 }} />
      </div>

      {/* ── 对话 Drawer ── */}
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        width={400}
        styles={{
          header: { borderBottom: '1px solid #f0f0f0', padding: '14px 20px' },
          body:   { padding: 0, display: 'flex', flexDirection: 'column', background: '#f9fafb', overflow: 'hidden' },
          footer: { padding: '12px 16px', borderTop: '1px solid #f0f0f0', background: '#fff' },
        }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
            }}>
              <RobotOutlined style={{ color: '#fff', fontSize: 16 }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.2 }}>AI 管理助手</div>
              <div style={{ fontSize: 11, color: '#aaa', lineHeight: 1.3 }}>集团总部 · 全部域</div>
            </div>
          </div>
        }
        footer={
          <div style={{ display: 'flex', gap: 8 }}>
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onPressEnter={() => sendMessage(input)}
              placeholder="查询运营数据、生成报告..."
              style={{ borderRadius: 8, fontSize: 13 }}
              disabled={typing}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || typing}
              style={{ background: '#6366F1', borderColor: '#6366F1', borderRadius: 8, flexShrink: 0 }}
            />
          </div>
        }
      >
        {/* 消息列表 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {messages.map(msg => (
            <div
              key={msg.id}
              style={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end' }}
            >
              {/* 助手头像 */}
              {msg.role === 'assistant' && (
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <RobotOutlined style={{ color: '#fff', fontSize: 13 }} />
                </div>
              )}

              <div style={{ maxWidth: '82%' }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  background: msg.role === 'user' ? '#6366F1' : '#fff',
                  color: msg.role === 'user' ? '#fff' : '#1a1a1a',
                  fontSize: 13, lineHeight: 1.6,
                  border: msg.role === 'assistant' ? '1px solid #ebebeb' : 'none',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}>
                  {msg.content}
                </div>
                <div style={{ fontSize: 10, color: '#ccc', marginTop: 4, textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                  {msg.time}
                </div>
              </div>
            </div>
          ))}

          {/* 打字指示器 */}
          {typing && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <RobotOutlined style={{ color: '#fff', fontSize: 13 }} />
              </div>
              <div style={{
                padding: '12px 16px', background: '#fff',
                borderRadius: '14px 14px 14px 2px',
                border: '1px solid #ebebeb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <div className="ai-typing-dot" />
                  <div className="ai-typing-dot" />
                  <div className="ai-typing-dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>
      </Drawer>
    </>
  );
};

export default AIAssistant;
