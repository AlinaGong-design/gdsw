import React, { useState, useRef, useEffect } from 'react';
import { Avatar, Input, Button, Tooltip } from 'antd';
import {
  NumberOutlined,
  LockOutlined,
  PlusOutlined,
  SearchOutlined,
  SendOutlined,
  SmileOutlined,
  PaperClipOutlined,
  BoldOutlined,
  ItalicOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  LinkOutlined,
  CodeOutlined,
  BellOutlined,
  SettingOutlined,
  TeamOutlined,
  MoreOutlined,
  ThunderboltOutlined,
  MessageOutlined,
  EllipsisOutlined,
  DownOutlined,
} from '@ant-design/icons';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChannelMessage {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorColor: string;
  content: string;
  timestamp: Date;
  reactions?: Reaction[];
  threadCount?: number;
  pinned?: boolean;
  edited?: boolean;
  attachments?: Attachment[];
  botMessage?: boolean;
  botName?: string;
  botIcon?: string;
}

interface Reaction {
  emoji: string;
  count: number;
  reacted: boolean;
}

interface Attachment {
  name: string;
  type: 'image' | 'file' | 'code';
  url?: string;
  language?: string;
  code?: string;
}

interface Channel {
  id: string;
  name: string;
  type: 'public' | 'private' | 'dm' | 'bot';
  description?: string;
  memberCount?: number;
  unread?: number;
  mentioned?: boolean;
  pinned?: boolean;
  topic?: string;
  botIcon?: string;
}

interface WorkspaceSection {
  id: string;
  label: string;
  collapsed: boolean;
  channels: Channel[];
}

interface DirectMessage {
  id: string;
  name: string;
  avatarColor: string;
  status: 'online' | 'offline' | 'away' | 'dnd';
  unread?: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_DMs: DirectMessage[] = [
  { id: 'dm1', name: 'Alice Chen', avatarColor: '#6366F1', status: 'online', unread: 2 },
  { id: 'dm2', name: 'Bob Zhang', avatarColor: '#10B981', status: 'away' },
  { id: 'dm3', name: 'Carol Liu', avatarColor: '#F59E0B', status: 'offline' },
  { id: 'dm4', name: 'David Wang', avatarColor: '#EF4444', status: 'online' },
];

const MOCK_SECTIONS: WorkspaceSection[] = [
  {
    id: 'pinned',
    label: '已固定',
    collapsed: false,
    channels: [
      { id: 'general', name: 'general', type: 'public', description: '通用频道，欢迎所有人', memberCount: 24, unread: 3, topic: '欢迎来到 OpenClaw！有问题随时提问 🎉' },
      { id: 'announcements', name: 'announcements', type: 'public', description: '重要公告', memberCount: 24, pinned: true },
    ],
  },
  {
    id: 'channels',
    label: '频道',
    collapsed: false,
    channels: [
      { id: 'dingtalk-bot', name: '钉钉客服机器人', type: 'bot', description: 'Dingtalk 渠道消息', unread: 1, botIcon: '📌' },
      { id: 'feishu-bot', name: '飞书工作助手', type: 'bot', description: 'Feishu 渠道消息', botIcon: '🪁' },
      { id: 'wecom-bot', name: '企业微信通知Bot', type: 'bot', description: 'Wecom 渠道消息', botIcon: '💬' },
      { id: 'dev', name: 'dev', type: 'public', description: '开发讨论', memberCount: 8 },
      { id: 'design', name: 'design', type: 'private', description: '设计团队专属', memberCount: 4 },
      { id: 'random', name: 'random', type: 'public', description: '随便聊', memberCount: 20, unread: 12, mentioned: true },
    ],
  },
  {
    id: 'apps',
    label: 'App',
    collapsed: false,
    channels: [
      { id: 'openclaw-bot', name: 'OpenClaw', type: 'bot', description: 'AI 助手', botIcon: '🤖', unread: 0 },
    ],
  },
];

const MOCK_MESSAGES: Record<string, ChannelMessage[]> = {
  general: [
    {
      id: 'm1', authorId: 'u1', authorName: 'Alice Chen', authorColor: '#6366F1',
      content: '大家好！欢迎加入 OpenClaw 工作区 🎉 这里是我们协作的主要场所。',
      timestamp: new Date(Date.now() - 3600000 * 3),
      reactions: [{ emoji: '👋', count: 5, reacted: true }, { emoji: '🎉', count: 3, reacted: false }],
    },
    {
      id: 'm2', authorId: 'u2', authorName: 'Bob Zhang', authorColor: '#10B981',
      content: '已经把 钉钉机器人 和 飞书工作助手 接入了，大家可以在对应频道里看到转发的消息。',
      timestamp: new Date(Date.now() - 3600000 * 2),
      reactions: [{ emoji: '👍', count: 4, reacted: false }],
      threadCount: 3,
    },
    {
      id: 'm3', authorId: 'bot', authorName: 'OpenClaw', authorColor: '#8B5CF6',
      content: '已完成每日任务摘要生成。今日共处理 **47** 条来自各渠道的消息，其中 钉钉 32 条，飞书 15 条。',
      timestamp: new Date(Date.now() - 3600000),
      botMessage: true, botIcon: '🤖', botName: 'OpenClaw Bot',
      reactions: [{ emoji: '✅', count: 2, reacted: false }],
    },
    {
      id: 'm4', authorId: 'u3', authorName: 'Carol Liu', authorColor: '#F59E0B',
      content: '@Alice Chen 关于新渠道的权限配置，我这边准备好了，什么时候方便 review 一下？',
      timestamp: new Date(Date.now() - 1800000),
    },
    {
      id: 'm5', authorId: 'u1', authorName: 'Alice Chen', authorColor: '#6366F1',
      content: '下午 3 点可以，我来开个会议室。',
      timestamp: new Date(Date.now() - 900000),
      reactions: [{ emoji: '👍', count: 1, reacted: true }],
    },
    {
      id: 'm6', authorId: 'u4', authorName: 'David Wang', authorColor: '#EF4444',
      content: '顺便分享一下 OpenClaw 最新更新的 changelog，v2026.2.21 支持了 per-channel 模型配置，太好用了',
      timestamp: new Date(Date.now() - 600000),
      attachments: [{
        name: 'CHANGELOG.md',
        type: 'code',
        language: 'markdown',
        code: '## v2026.2.21\n- Per-channel model configuration\n- Enhanced Telegram streaming\n- Discord voice channel /vc commands\n- Lifecycle status emoji reactions',
      }],
    },
    {
      id: 'm7', authorId: 'u2', authorName: 'Bob Zhang', authorColor: '#10B981',
      content: '666，我正好在等这个功能！',
      timestamp: new Date(Date.now() - 300000),
      reactions: [{ emoji: '🔥', count: 3, reacted: false }],
    },
  ],
  random: [
    {
      id: 'r1', authorId: 'u3', authorName: 'Carol Liu', authorColor: '#F59E0B',
      content: '大家周末有什么安排？',
      timestamp: new Date(Date.now() - 7200000),
    },
    {
      id: 'r2', authorId: 'u4', authorName: 'David Wang', authorColor: '#EF4444',
      content: '打算去爬山 🏔️',
      timestamp: new Date(Date.now() - 7000000),
      reactions: [{ emoji: '⛰️', count: 2, reacted: false }],
    },
  ],
  'dingtalk-bot': [
    {
      id: 't1', authorId: 'bot', authorName: 'Dingtalk Bot', authorColor: '#1677ff',
      content: '[来自 钉钉] @user123：帮我查一下明天上海的天气',
      timestamp: new Date(Date.now() - 1200000),
      botMessage: true, botIcon: '📌', botName: 'Dingtalk',
    },
    {
      id: 't2', authorId: 'bot', authorName: 'OpenClaw', authorColor: '#8B5CF6',
      content: '**已回复**：明天上海天气晴，最高气温 18°C，最低气温 8°C，适合外出。',
      timestamp: new Date(Date.now() - 1190000),
      botMessage: true, botIcon: '🤖', botName: 'OpenClaw Bot',
    },
  ],
};

// ─── Helpers ──────────��───────────────────────────────────────────────────────

const statusColor: Record<string, string> = {
  online: '#22c55e',
  away: '#f59e0b',
  dnd: '#ef4444',
  offline: '#6b7280',
};

const statusLabel: Record<string, string> = {
  online: '在线',
  away: '离开',
  dnd: '勿扰',
  offline: '离线',
};

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  const today = now.toDateString() === date.toDateString();
  if (today) return `今天 ${h}:${m}`;
  return `${date.getMonth() + 1}/${date.getDate()} ${h}:${m}`;
}

function isSameAuthorAndClose(a: ChannelMessage, b: ChannelMessage): boolean {
  return a.authorId === b.authorId &&
    b.timestamp.getTime() - a.timestamp.getTime() < 5 * 60 * 1000;
}

// ─── Sub Components ───────────────────────────────────────────────────────────

const UserStatus: React.FC<{ status: DirectMessage['status']; size?: number }> = ({ status, size = 8 }) => (
  <span style={{
    display: 'inline-block',
    width: size,
    height: size,
    borderRadius: '50%',
    background: statusColor[status],
    border: '2px solid #fff',
    flexShrink: 0,
  }} />
);

const ChannelIcon: React.FC<{ channel: Channel; active?: boolean }> = ({ channel, active }) => {
  if (channel.type === 'private') return <LockOutlined style={{ fontSize: 13, color: active ? '#fff' : '#aaa', marginRight: 2 }} />;
  if (channel.type === 'bot') return <span style={{ fontSize: 13, marginRight: 2 }}>{channel.botIcon}</span>;
  return <NumberOutlined style={{ fontSize: 13, color: active ? '#fff' : '#aaa', marginRight: 2 }} />;
};

const MessageItem: React.FC<{
  msg: ChannelMessage;
  compact?: boolean;
  onReact: (msgId: string, emoji: string) => void;
}> = ({ msg, compact, onReact }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        padding: compact ? '2px 16px 2px 16px' : '8px 16px 4px 16px',
        borderRadius: 6,
        background: hovered ? '#f8f9fa' : 'transparent',
        transition: 'background 0.1s',
        position: 'relative',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar column */}
      <div style={{ width: 36, flexShrink: 0, paddingTop: compact ? 0 : 2 }}>
        {!compact ? (
          <Avatar
            size={36}
            style={{ background: msg.authorColor, fontSize: 14, fontWeight: 600, flexShrink: 0 }}
          >
            {msg.botMessage ? msg.botIcon : msg.authorName.charAt(0)}
          </Avatar>
        ) : (
          <span style={{ fontSize: 11, color: '#aaa', display: 'block', textAlign: 'right', paddingTop: 3 }}>
            {msg.timestamp.getHours().toString().padStart(2, '0')}:{msg.timestamp.getMinutes().toString().padStart(2, '0')}
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {!compact && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: msg.botMessage ? '#8B5CF6' : '#1a1a2e' }}>
              {msg.botMessage ? msg.botName : msg.authorName}
            </span>
            {msg.botMessage && (
              <span style={{ fontSize: 11, background: '#e8e6ff', color: '#6366F1', borderRadius: 3, padding: '1px 5px', fontWeight: 600 }}>
                APP
              </span>
            )}
            <span style={{ fontSize: 12, color: '#aaa' }}>{formatTime(msg.timestamp)}</span>
            {msg.edited && <span style={{ fontSize: 11, color: '#aaa' }}>(已编辑)</span>}
          </div>
        )}

        {/* Text content — simple bold/italic rendering */}
        <div style={{ fontSize: 14, color: '#1a1a2e', lineHeight: '1.5', wordBreak: 'break-word' }}>
          {msg.content.split(/(\*\*.*?\*\*)/g).map((part, i) =>
            part.startsWith('**') && part.endsWith('**')
              ? <strong key={i}>{part.slice(2, -2)}</strong>
              : <span key={i}>{part}</span>
          )}
        </div>

        {/* Code attachment */}
        {msg.attachments?.map((att, i) => (
          <div key={i} style={{
            marginTop: 8,
            borderRadius: 6,
            border: '1px solid #e8e8e8',
            overflow: 'hidden',
            maxWidth: 520,
          }}>
            <div style={{
              background: '#f5f5f5',
              padding: '6px 12px',
              fontSize: 12,
              color: '#666',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              borderBottom: '1px solid #e8e8e8',
            }}>
              <CodeOutlined />
              {att.name}
              {att.language && <span style={{ color: '#aaa' }}>· {att.language}</span>}
            </div>
            <pre style={{
              margin: 0, padding: '10px 14px',
              fontSize: 13, lineHeight: 1.6,
              background: '#fafafa', color: '#333',
              overflowX: 'auto', maxHeight: 200,
              fontFamily: 'monospace',
            }}>
              {att.code}
            </pre>
          </div>
        ))}

        {/* Reactions */}
        {msg.reactions && msg.reactions.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            {msg.reactions.map((r, i) => (
              <button
                key={i}
                onClick={() => onReact(msg.id, r.emoji)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  padding: '2px 8px', borderRadius: 12,
                  border: r.reacted ? '1px solid #6366F1' : '1px solid #e8e8e8',
                  background: r.reacted ? '#f0f0ff' : '#f8f8f8',
                  cursor: 'pointer', fontSize: 13,
                  color: r.reacted ? '#6366F1' : '#555',
                  transition: 'all 0.15s',
                }}
              >
                {r.emoji} <span style={{ fontSize: 12, fontWeight: 600 }}>{r.count}</span>
              </button>
            ))}
            <button
              onClick={() => {}}
              style={{
                padding: '2px 7px', borderRadius: 12,
                border: '1px solid #e8e8e8', background: '#f8f8f8',
                cursor: 'pointer', fontSize: 13, color: '#aaa',
              }}
            >
              +
            </button>
          </div>
        )}

        {/* Thread hint */}
        {msg.threadCount && msg.threadCount > 0 && (
          <button style={{
            marginTop: 4, padding: '3px 0',
            background: 'none', border: 'none',
            color: '#6366F1', fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <MessageOutlined />
            {msg.threadCount} 条回复
          </button>
        )}
      </div>

      {/* Hover actions */}
      {hovered && (
        <div style={{
          position: 'absolute', right: 16, top: 4,
          display: 'flex', gap: 2,
          background: '#fff',
          border: '1px solid #e8e8e8',
          borderRadius: 8,
          padding: '2px 4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          zIndex: 10,
        }}>
          {['😊', '👍', '🎉'].map(em => (
            <button key={em} onClick={() => onReact(msg.id, em)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 16, padding: '2px 5px', borderRadius: 4,
            }}>{em}</button>
          ))}
          <Tooltip title="更多操作">
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 5px', color: '#aaa', borderRadius: 4 }}>
              <EllipsisOutlined />
            </button>
          </Tooltip>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const OpenClaw: React.FC = () => {
  const [sections, setSections] = useState<WorkspaceSection[]>(MOCK_SECTIONS);
  const [activeChannelId, setActiveChannelId] = useState<string>('general');
  const [activeDmId, setActiveDmId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, ChannelMessage[]>>(MOCK_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [dmCollapsed, setDmCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChannel = sections.flatMap(s => s.channels).find(c => c.id === activeChannelId);
  const activeDm = MOCK_DMs.find(d => d.id === activeDmId);
  const currentMessages = activeChannelId ? (messages[activeChannelId] || []) : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChannelId, messages]);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;
    const channelId = activeChannelId;
    const newMsg: ChannelMessage = {
      id: `msg-${Date.now()}`,
      authorId: 'me',
      authorName: '我',
      authorColor: '#6366F1',
      content: text,
      timestamp: new Date(),
    };
    setMessages(prev => ({
      ...prev,
      [channelId]: [...(prev[channelId] || []), newMsg],
    }));
    setInputValue('');
  };

  const handleReact = (msgId: string, emoji: string) => {
    const channelId = activeChannelId;
    setMessages(prev => {
      const list = [...(prev[channelId] || [])];
      const idx = list.findIndex(m => m.id === msgId);
      if (idx === -1) return prev;
      const msg = { ...list[idx] };
      const reactions = [...(msg.reactions || [])];
      const ri = reactions.findIndex(r => r.emoji === emoji);
      if (ri === -1) {
        reactions.push({ emoji, count: 1, reacted: true });
      } else {
        const r = { ...reactions[ri] };
        r.reacted = !r.reacted;
        r.count = r.reacted ? r.count + 1 : r.count - 1;
        if (r.count <= 0) reactions.splice(ri, 1);
        else reactions[ri] = r;
      }
      msg.reactions = reactions;
      list[idx] = msg;
      return { ...prev, [channelId]: list };
    });
  };

  const toggleSection = (sectionId: string) => {
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, collapsed: !s.collapsed } : s
    ));
  };

  const handleChannelClick = (channelId: string) => {
    setActiveChannelId(channelId);
    setActiveDmId(null);
    // clear unread
    setSections(prev => prev.map(s => ({
      ...s,
      channels: s.channels.map(c =>
        c.id === channelId ? { ...c, unread: 0, mentioned: false } : c
      ),
    })));
  };

  const handleDmClick = (dmId: string) => {
    setActiveDmId(dmId);
    setActiveChannelId('');
  };

  const activeTitle = activeDm ? activeDm.name : activeChannel ? `# ${activeChannel.name}` : '';
  const activeTopic = activeDm ? statusLabel[activeDm.status] : activeChannel?.topic || activeChannel?.description || '';

  // Group messages for compact display
  const groupedMessages: Array<{ msg: ChannelMessage; compact: boolean }> = currentMessages.map((msg, i) => ({
    msg,
    compact: i > 0 && isSameAuthorAndClose(currentMessages[i - 1], msg) && !msg.botMessage,
  }));

  return (
    <div style={{ display: 'flex', height: '100%', background: '#fff', overflow: 'hidden', borderRadius: 8 }}>

      {/* ── Left Sidebar ─────────────────────────────────────────────────────── */}
      <div style={{
        width: 240,
        flexShrink: 0,
        background: '#3f0e40',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}>

        {/* Workspace Header */}
        <div style={{
          padding: '14px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: '#fff',
            }}>O</div>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, letterSpacing: 0.2, visibility: 'hidden' }}>OpenClaw</span>
            <DownOutlined style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }} />
          </div>
          <Tooltip title="新建">
            <button style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.7)', fontSize: 20, lineHeight: 1,
              display: 'flex', alignItems: 'center',
            }}><PlusOutlined /></button>
          </Tooltip>
        </div>

        {/* Search */}
        <div style={{ padding: '10px 12px', flexShrink: 0 }}>
          <Input
            prefix={<SearchOutlined style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }} />}
            placeholder="搜索…"
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            size="small"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 6,
              color: '#fff',
            }}
          />
        </div>

        {/* Sidebar scroll area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>

          {/* Sections */}
          {sections.map(section => (
            <div key={section.id} style={{ marginBottom: 4 }}>
              {/* Section header */}
              <button
                onClick={() => toggleSection(section.id)}
                style={{
                  width: '100%', background: 'none', border: 'none',
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '4px 12px',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 12, fontWeight: 700, letterSpacing: 0.5,
                  cursor: 'pointer', textTransform: 'uppercase',
                }}
              >
                <DownOutlined style={{
                  fontSize: 9,
                  transform: section.collapsed ? 'rotate(-90deg)' : 'none',
                  transition: 'transform 0.2s',
                }} />
                {section.label}
              </button>

              {!section.collapsed && section.channels.map(ch => {
                const isActive = ch.id === activeChannelId;
                return (
                  <button
                    key={ch.id}
                    onClick={() => handleChannelClick(ch.id)}
                    style={{
                      width: 'calc(100% - 16px)', background: isActive ? '#6366F1' : 'none',
                      border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '5px 12px 5px 20px',
                      borderRadius: 4, margin: '1px 8px',
                      color: isActive ? '#fff' : ch.unread ? '#fff' : 'rgba(255,255,255,0.7)',
                      fontWeight: ch.unread ? 700 : 400,
                      fontSize: 14,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => !isActive && (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                    onMouseLeave={e => !isActive && (e.currentTarget.style.background = 'none')}
                  >
                    <ChannelIcon channel={ch} active={isActive} />
                    <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ch.name}
                    </span>
                    {ch.mentioned && (
                      <span style={{ background: '#ef4444', color: '#fff', borderRadius: 10, fontSize: 11, padding: '0 5px', fontWeight: 700 }}>
                        @
                      </span>
                    )}
                    {ch.unread && !ch.mentioned && (
                      <span style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', borderRadius: 10, fontSize: 11, padding: '0 5px', fontWeight: 700 }}>
                        {ch.unread}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {/* Direct Messages */}
          <div style={{ marginBottom: 4 }}>
            <button
              onClick={() => setDmCollapsed(!dmCollapsed)}
              style={{
                width: '100%', background: 'none', border: 'none',
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 12px',
                color: 'rgba(255,255,255,0.5)',
                fontSize: 12, fontWeight: 700, letterSpacing: 0.5,
                cursor: 'pointer', textTransform: 'uppercase',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <DownOutlined style={{
                  fontSize: 9,
                  transform: dmCollapsed ? 'rotate(-90deg)' : 'none',
                  transition: 'transform 0.2s',
                }} />
                私信
              </div>
              <PlusOutlined style={{ fontSize: 11 }} />
            </button>

            {!dmCollapsed && MOCK_DMs.map(dm => {
              const isActive = dm.id === activeDmId;
              return (
                <button
                  key={dm.id}
                  onClick={() => handleDmClick(dm.id)}
                  style={{
                    width: 'calc(100% - 16px)', background: isActive ? '#6366F1' : 'none',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '5px 12px 5px 20px',
                    borderRadius: 4, margin: '1px 8px',
                    color: isActive ? '#fff' : dm.unread ? '#fff' : 'rgba(255,255,255,0.7)',
                    fontWeight: dm.unread ? 700 : 400,
                    fontSize: 14,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => !isActive && (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                  onMouseLeave={e => !isActive && (e.currentTarget.style.background = 'none')}
                >
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <Avatar size={20} style={{ background: dm.avatarColor, fontSize: 11 }}>
                      {dm.name.charAt(0)}
                    </Avatar>
                    <span style={{
                      position: 'absolute', bottom: -1, right: -1,
                      width: 8, height: 8, borderRadius: '50%',
                      background: statusColor[dm.status],
                      border: '1.5px solid #3f0e40',
                    }} />
                  </div>
                  <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {dm.name}
                  </span>
                  {dm.unread && (
                    <span style={{ background: '#ef4444', color: '#fff', borderRadius: 10, fontSize: 11, padding: '0 5px', fontWeight: 700 }}>
                      {dm.unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer — current user */}
        <div style={{
          padding: '10px 12px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', gap: 8,
          flexShrink: 0,
        }}>
          <div style={{ position: 'relative' }}>
            <Avatar size={32} style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', fontWeight: 700 }}>我</Avatar>
            <span style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 10, height: 10, borderRadius: '50%',
              background: '#22c55e', border: '2px solid #3f0e40',
            }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              管理员
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>在线</div>
          </div>
          <Tooltip title="设置">
            <SettingOutlined style={{ color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 15 }} />
          </Tooltip>
        </div>
      </div>

      {/* ── Main Chat Area ────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#fff' }}>

        {/* Channel Header */}
        <div style={{
          height: 52, flexShrink: 0,
          display: 'flex', alignItems: 'center',
          padding: '0 16px', gap: 10,
          borderBottom: '1px solid #e8e8e8',
          background: '#fff',
        }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            {activeDm ? (
              <div style={{ position: 'relative' }}>
                <Avatar size={24} style={{ background: activeDm.avatarColor, fontSize: 12 }}>{activeDm.name.charAt(0)}</Avatar>
                <span style={{
                  position: 'absolute', bottom: -1, right: -1,
                  width: 8, height: 8, borderRadius: '50%',
                  background: statusColor[activeDm.status], border: '1.5px solid #fff',
                }} />
              </div>
            ) : (
              activeChannel && <ChannelIcon channel={activeChannel} />
            )}
            <span style={{ fontWeight: 700, fontSize: 15, color: '#1a1a2e', whiteSpace: 'nowrap' }}>
              {activeDm ? activeDm.name : activeChannel ? activeChannel.name : ''}
            </span>
            {activeTopic && (
              <>
                <div style={{ width: 1, height: 16, background: '#e0e0e0', flexShrink: 0 }} />
                <span style={{
                  fontSize: 13, color: '#888',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {activeTopic}
                </span>
              </>
            )}
          </div>

          {/* Header actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            {activeChannel && (
              <Tooltip title="成员">
                <button style={headerIconStyle}>
                  <TeamOutlined />
                  {activeChannel.memberCount && (
                    <span style={{ fontSize: 12, marginLeft: 3 }}>{activeChannel.memberCount}</span>
                  )}
                </button>
              </Tooltip>
            )}
            <Tooltip title="搜索">
              <button style={headerIconStyle}><SearchOutlined /></button>
            </Tooltip>
            <Tooltip title="通知">
              <button style={headerIconStyle}><BellOutlined /></button>
            </Tooltip>
            <Tooltip title="更多">
              <button style={headerIconStyle}><MoreOutlined /></button>
            </Tooltip>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0 4px 0' }}>
          {groupedMessages.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: 80, color: '#aaa' }}>
              <NumberOutlined style={{ fontSize: 48, marginBottom: 12 }} />
              <div style={{ fontSize: 18, fontWeight: 700, color: '#333', marginBottom: 6 }}>
                {activeChannel ? `欢迎来到 #${activeChannel.name}` : '选择一个频道开始聊天'}
              </div>
              {activeChannel?.description && (
                <div style={{ fontSize: 14, color: '#888' }}>{activeChannel.description}</div>
              )}
            </div>
          ) : (
            groupedMessages.map(({ msg, compact }) => (
              <MessageItem key={msg.id} msg={msg} compact={compact} onReact={handleReact} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '8px 16px 14px', flexShrink: 0 }}>
          <div style={{
            border: '1px solid #d9d9d9',
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            background: '#fff',
          }}>
            {/* Formatting toolbar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 2,
              padding: '4px 10px',
              borderBottom: '1px solid #f0f0f0',
            }}>
              {[
                { icon: <BoldOutlined />, title: '加粗' },
                { icon: <ItalicOutlined />, title: '斜体' },
                { icon: <LinkOutlined />, title: '链接' },
                { icon: <OrderedListOutlined />, title: '有序列表' },
                { icon: <UnorderedListOutlined />, title: '无序列表' },
                { icon: <CodeOutlined />, title: '代码' },
              ].map((item, i) => (
                <Tooltip key={i} title={item.title}>
                  <button style={toolbarBtnStyle}>{item.icon}</button>
                </Tooltip>
              ))}
            </div>

            {/* Text input */}
            <Input.TextArea
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={
                activeDm
                  ? `给 ${activeDm.name} 发消息`
                  : activeChannel
                  ? `给 #${activeChannel.name} 发消息`
                  : '发消息…'
              }
              autoSize={{ minRows: 2, maxRows: 8 }}
              style={{ border: 'none', boxShadow: 'none', resize: 'none', padding: '10px 12px', fontSize: 14 }}
            />

            {/* Bottom action bar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 10px',
            }}>
              <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Tooltip title="表情">
                  <button style={toolbarBtnStyle}><SmileOutlined /></button>
                </Tooltip>
                <Tooltip title="附件">
                  <button style={toolbarBtnStyle}><PaperClipOutlined /></button>
                </Tooltip>
                <Tooltip title="@提及">
                  <button style={{ ...toolbarBtnStyle, fontWeight: 700 }}>@</button>
                </Tooltip>
                <Tooltip title="触发 Bot">
                  <button style={toolbarBtnStyle}><ThunderboltOutlined /></button>
                </Tooltip>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: '#bbb' }}>
                  <kbd style={{ background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: 3, padding: '1px 4px', fontSize: 11 }}>Enter</kbd> 发送
                </span>
                <Button
                  type="primary"
                  size="small"
                  icon={<SendOutlined />}
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  style={{ background: inputValue.trim() ? '#6366F1' : undefined, border: 'none', borderRadius: 6 }}
                >
                  发送
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Channel Info ─────────────────────────────────────────── */}
      {activeChannel && (
        <div style={{
          width: 240, flexShrink: 0,
          borderLeft: '1px solid #f0f0f0',
          background: '#fafafa',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e', marginBottom: 4 }}>
              # {activeChannel.name}
            </div>
            {activeChannel.description && (
              <div style={{ fontSize: 13, color: '#888', lineHeight: 1.5 }}>{activeChannel.description}</div>
            )}
          </div>

          {/* Channel topic */}
          {activeChannel.topic && (
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#aaa', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                频道主题
              </div>
              <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>{activeChannel.topic}</div>
            </div>
          )}

          {/* Members */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#aaa', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              成员 {activeChannel.memberCount && `· ${activeChannel.memberCount}`}
            </div>
            {MOCK_DMs.slice(0, 4).map(dm => (
              <div key={dm.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ position: 'relative' }}>
                  <Avatar size={24} style={{ background: dm.avatarColor, fontSize: 11 }}>{dm.name.charAt(0)}</Avatar>
                  <span style={{
                    position: 'absolute', bottom: -1, right: -1,
                    width: 8, height: 8, borderRadius: '50%',
                    background: statusColor[dm.status], border: '1.5px solid #fafafa',
                  }} />
                </div>
                <span style={{ fontSize: 13, color: '#555' }}>{dm.name}</span>
              </div>
            ))}
            {(activeChannel.memberCount || 0) > 4 && (
              <button style={{ fontSize: 13, color: '#6366F1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                查看全部 {activeChannel.memberCount} 人
              </button>
            )}
          </div>

          {/* Pinned / integrations for bot channels */}
          {activeChannel.type === 'bot' && (
            <div style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#aaa', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                集成
              </div>
              <div style={{
                background: '#fff', borderRadius: 8, padding: 12,
                border: '1px solid #e8e8e8',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 24 }}>{activeChannel.botIcon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{activeChannel.name}</div>
                  <div style={{ fontSize: 12, color: '#6366F1' }}>已连接</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Shared styles ─────────────────────────────────────────────────────────────

const headerIconStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: '#666', fontSize: 16,
  display: 'flex', alignItems: 'center',
  padding: '5px 7px', borderRadius: 6,
  transition: 'background 0.15s',
};

const toolbarBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: '#888', fontSize: 14,
  padding: '3px 6px', borderRadius: 4,
  display: 'flex', alignItems: 'center',
  transition: 'background 0.15s, color 0.15s',
};

export default OpenClaw;
