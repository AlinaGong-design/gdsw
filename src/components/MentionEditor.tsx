import React, { useCallback, useMemo, useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { createEditor, Descendant, Editor, Transforms, Range, Element as SlateElement, BaseEditor } from 'slate';
import { Slate, Editable, withReact, ReactEditor, RenderElementProps, RenderLeafProps } from 'slate-react';
import { withHistory } from 'slate-history';
import './MentionEditor.css';
import { Tag } from 'antd';

// 自定义类型定义
type ParagraphElement = { type: 'paragraph'; children: CustomText[] };
type MentionElement = {
  type: 'mention';
  character: string;
  agentId: string;
  agentIcon?: string;
  mentionType: 'agent' | 'skill' | 'group';  // 区分智能体、技能和群组
  children: CustomText[]
};
type CustomElement = ParagraphElement | MentionElement;
type CustomText = { text: string; bold?: boolean };

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

interface Agent {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  type?: 'agent' | 'skill' | 'group';
  category?: string;  // 添加类别字段
  lastUsed?: number;  // 添加最后使用时间
  isMultiAgent?: boolean;  // 是否为多智能体模式
  multiAgentMembers?: Agent[];  // 多智能体成员列表
}

interface MentionEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  agents?: Agent[];
  groups?: Agent[];  // 改回群组
  onSelectAgent?: (agent: Agent) => void;
  style?: React.CSSProperties;
  minRows?: number;
  maxRows?: number;
}

// 暴露给父组件的方法
export interface MentionEditorHandle {
  openMentionPanel: (buttonRect?: DOMRect) => void;  // 接收按钮位置
  focus: () => void;
}

const MentionEditor = forwardRef<MentionEditorHandle, MentionEditorProps>(({
  value,
  onChange,
  placeholder = '输入消息...',
  agents = [],
  groups = [],
  onSelectAgent,
  style,
  minRows = 3,
  maxRows = 6,
}, ref) => {
  const portalRef = useRef<HTMLDivElement>(null);
  const [target, setTarget] = useState<Range | null>(null);
  const [index, setIndex] = useState(0);
  const [search, setSearch] = useState('');
  const [agentSearch, setAgentSearch] = useState('');  // 智能体搜索
  const [manualTrigger, setManualTrigger] = useState(false);
  const [buttonPosition, setButtonPosition] = useState<DOMRect | null>(null);
  const [activeTab, setActiveTab] = useState<'agents' | 'groups'>('agents');
  const renderElement = useCallback((props: RenderElementProps) => <Element {...props} />, []);
  const renderLeaf = useCallback((props: RenderLeafProps) => <Leaf {...props} />, []);
  const editor = useMemo(() => withMentions(withReact(withHistory(createEditor()))), []);

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    openMentionPanel: (buttonRect?: DOMRect) => {
      // 聚焦编辑器
      ReactEditor.focus(editor);

      // 获取当前选区
      const { selection } = editor;
      if (selection) {
        // 设置手动触发标记
        setManualTrigger(true);
        setButtonPosition(buttonRect || null);
        setTarget(selection);
        setSearch('');
        setIndex(0);
        setActiveTab('agents'); // 默认显示智能体
      }
    },
    focus: () => {
      ReactEditor.focus(editor);
    }
  }));

  // 初始化编辑器内容
  const [slateValue, setSlateValue] = useState<Descendant[]>(() => {
    if (value) {
      return [
        {
          type: 'paragraph',
          children: [{ text: value }],
        } as ParagraphElement,
      ];
    }
    return [
      {
        type: 'paragraph',
        children: [{ text: '' }],
      } as ParagraphElement,
    ];
  });

  // 过滤和分组智能体
  const filteredAgents = agents.filter((agent) =>
    agent.name.toLowerCase().includes(agentSearch.toLowerCase())
  );

  // 按类别分组
  const groupedAgents: Record<string, Agent[]> = {};
  filteredAgents.forEach(agent => {
    const category = agent.category || '其他';
    if (!groupedAgents[category]) {
      groupedAgents[category] = [];
    }
    groupedAgents[category].push(agent);
  });

  // 群组按最后使用时间排序
  const sortedGroups = [...groups].sort((a, b) => {
    const aTime = a.lastUsed || 0;
    const bTime = b.lastUsed || 0;
    return bTime - aTime;  // 降序，最近使用的在前
  });

  // 当前列表（用于键盘导航）
  const currentList = activeTab === 'agents'
    ? filteredAgents
    : sortedGroups.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (target && currentList.length > 0) {
        switch (event.key) {
          case 'ArrowDown':
            event.preventDefault();
            setIndex((prevIndex) => (prevIndex >= currentList.length - 1 ? 0 : prevIndex + 1));
            break;
          case 'ArrowUp':
            event.preventDefault();
            setIndex((prevIndex) => (prevIndex <= 0 ? currentList.length - 1 : prevIndex - 1));
            break;
          case 'Tab':
          case 'Enter':
            event.preventDefault();
            if (currentList[index]) {
              Transforms.select(editor, target);
              insertMention(editor, currentList[index], manualTrigger);
              if (onSelectAgent) {
                onSelectAgent(currentList[index]);
              }
              setTarget(null);
              setManualTrigger(false);
              setButtonPosition(null);
            }
            break;
          case 'Escape':
            event.preventDefault();
            setTarget(null);
            setManualTrigger(false);
            setButtonPosition(null);
            break;
        }
      }
    },
    [index, target, currentList, editor, onSelectAgent, manualTrigger]
  );

  useEffect(() => {
    if (target && currentList.length > 0) {
      const el = portalRef.current;
      if (!el) return;

      if (buttonPosition) {
        // 手动触发：定位在按钮旁边
        const editorContainer = el.parentElement;
        if (editorContainer) {
          const containerRect = editorContainer.getBoundingClientRect();
          // 定位在按钮右侧或上方
          el.style.top = `${buttonPosition.top - containerRect.top - el.offsetHeight - 10}px`;
          el.style.left = `${buttonPosition.left - containerRect.left}px`;
        }
      } else {
        // 输入触发：定位在光标附近
        try {
          const domRange = ReactEditor.toDOMRange(editor, target);
          const rect = domRange.getBoundingClientRect();
          const editorContainer = el.parentElement;
          if (editorContainer) {
            const containerRect = editorContainer.getBoundingClientRect();
            // 定位在光标上方
            el.style.top = `${rect.top - containerRect.top - el.offsetHeight - 10}px`;
            el.style.left = `${rect.left - containerRect.left}px`;
          }
        } catch (error) {
          console.error('Error positioning mention panel:', error);
        }
      }
    }
  }, [currentList.length, editor, target, buttonPosition]);

  const handleChange = (newValue: Descendant[]) => {
    setSlateValue(newValue);

    // 提取纯文本内容
    const text = newValue
      .map((n) => (SlateElement.isElement(n) ? serializeNode(n) : ''))
      .join('\n');
    onChange(text);

    const { selection } = editor;

    if (selection && Range.isCollapsed(selection)) {
      const [start] = Range.edges(selection);
      const wordBefore = Editor.before(editor, start, { unit: 'word' });
      const before = wordBefore && Editor.before(editor, wordBefore);
      const beforeRange = before && Editor.range(editor, before, start);
      const beforeText = beforeRange && Editor.string(editor, beforeRange);
      const beforeMatch = beforeText && beforeText.match(/@(\w*)$/);
      const after = Editor.after(editor, start);
      const afterRange = Editor.range(editor, start, after);
      const afterText = Editor.string(editor, afterRange);
      const afterMatch = afterText.match(/^(\s|$)/);

      if (beforeMatch && afterMatch) {
        setTarget(beforeRange);
        setSearch(beforeMatch[1]);
        setIndex(0);
        return;
      }
    }

    setTarget(null);
  };

  return (
    <div style={{ position: 'relative', ...style }}>
      <Slate editor={editor} initialValue={slateValue} onChange={handleChange}>
        <Editable
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          style={{
            minHeight: `${minRows * 1.5}em`,
            maxHeight: `${maxRows * 1.5}em`,
            overflowY: 'auto',
            padding: '4px 11px',
            fontSize: '14px',
            lineHeight: '1.5',
            outline: 'none',
          }}
        />
        {target && (agents.length > 0 || groups.length > 0) && (
          <div
            ref={portalRef}
            className="mention-portal"
            style={{
              position: 'absolute',
              zIndex: 1000,
              background: '#fff',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              minWidth: '320px',
              maxHeight: '450px',
              overflow: 'hidden',
            }}
          >
            {/* 标签页 */}
            {agents.length > 0 && groups.length > 0 && (
              <div style={{
                display: 'flex',
                borderBottom: '1px solid #f0f0f0',
                padding: '8px 8px 0 8px',
              }}>
                <div
                  onClick={() => {
                    setActiveTab('agents');
                    setIndex(0);
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    textAlign: 'center',
                    borderBottom: activeTab === 'agents' ? '2px solid #6366F1' : '2px solid transparent',
                    cursor: 'pointer',
                    color: activeTab === 'agents' ? '#6366F1' : '#666',
                    transition: 'all 0.2s',
                    fontWeight: activeTab === 'agents' ? 500 : 400,
                  }}
                >
                  智能体
                </div>
                <div
                  onClick={() => {
                    setActiveTab('groups');
                    setIndex(0);
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderBottom: activeTab === 'groups' ? '2px solid #10B981' : '2px solid transparent',
                    color: activeTab === 'groups' ? '#10B981' : '#666',
                    fontWeight: activeTab === 'groups' ? 500 : 400,
                    transition: 'all 0.2s',
                  }}
                >
                  群组
                </div>
              </div>
            )}

            {/* 搜索框（仅智能体） */}
            {activeTab === 'agents' && (
              <div style={{ padding: '12px 12px 8px 12px' }}>
                <input
                  type="text"
                  placeholder="搜索智能体..."
                  value={agentSearch}
                  onChange={(e) => {
                    setAgentSearch(e.target.value);
                    setIndex(0);
                  }}
                  style={{
                    width: '100%',
                    padding: '6px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    outline: 'none',
                    fontSize: '14px',
                  }}
                  onFocus={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setAgentSearch('');
                      e.stopPropagation();
                    }
                  }}
                />
              </div>
            )}

            {/* 列表内容 */}
            <div style={{
              maxHeight: activeTab === 'agents' ? '320px' : '350px',
              overflowY: 'auto',
              padding: '8px 0',
            }}>
              {activeTab === 'agents' ? (
                // 智能体列表 - 分组显示
                Object.keys(groupedAgents).length > 0 ? (
                  Object.entries(groupedAgents).map(([category, categoryAgents]) => (
                    <div key={category} style={{ marginBottom: '12px' }}>
                      <div style={{
                        padding: '4px 16px',
                        fontSize: '12px',
                        color: '#9ca3af',
                        fontWeight: 500,
                        background: '#f9fafb',
                      }}>
                        {category}
                      </div>
                      {categoryAgents.map((agent) => {
                        const globalIndex = currentList.findIndex(a => a.id === agent.id);
                        return (
                          <div
                            key={agent.id}
                            onClick={() => {
                              Transforms.select(editor, target);
                              insertMention(editor, { ...agent, type: 'agent' }, manualTrigger);
                              if (onSelectAgent) {
                                onSelectAgent(agent);
                              }
                              setTarget(null);
                              setManualTrigger(false);
                              setButtonPosition(null);
                              setAgentSearch('');
                            }}
                            style={{
                              padding: '8px 16px 8px 24px',
                              cursor: 'pointer',
                              background: globalIndex === index ? '#f5f5f5' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                            onMouseEnter={() => setIndex(globalIndex)}
                          >
                            {agent.icon && <span style={{ fontSize: '16px' }}>{agent.icon}</span>}
                            <span>{agent.name}</span>
                            {agent.isMultiAgent && <Tag color={'#6366F1'}> 多智能体 </Tag>}
                          </div>
                        );
                      })}
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#999' }}>
                    未找到智能体
                  </div>
                )
              ) : (
                // 群组列表 - 按使用时间排序
                sortedGroups.filter(g => g.name.toLowerCase().includes(search.toLowerCase())).length > 0 ? (
                  sortedGroups
                    .filter(g => g.name.toLowerCase().includes(search.toLowerCase()))
                    .map((group, i) => (
                      <div
                        key={group.id}
                        onClick={() => {
                          Transforms.select(editor, target);
                          insertMention(editor, { ...group, type: 'group' }, manualTrigger);
                          if (onSelectAgent) {
                            onSelectAgent(group);
                          }
                          setTarget(null);
                          setManualTrigger(false);
                          setButtonPosition(null);
                        }}
                        style={{
                          padding: '8px 16px',
                          cursor: 'pointer',
                          background: i === index ? '#f5f5f5' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                        onMouseEnter={() => setIndex(i)}
                      >
                        {group.icon && <span style={{ fontSize: '16px' }}>{group.icon}</span>}
                        <div style={{ flex: 1 }}>
                          <div>{group.name}</div>
                          {group.lastUsed && (
                            <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                              最近使用
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                ) : (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#999' }}>
                    暂无群组
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </Slate>
    </div>
  );
});

MentionEditor.displayName = 'MentionEditor';

// 序列化节点为文本
const serializeNode = (node: CustomElement | CustomText): string => {
  if ('text' in node) {
    return node.text;
  }
  if (node.type === 'mention') {
    return `@${node.character}`;
  }
  if (node.children) {
    return node.children.map((n) => serializeNode(n)).join('');
  }
  return '';
};

// 插入@提及
const insertMention = (editor: Editor, agent: Agent, isManualTrigger: boolean = false) => {
  const mention: MentionElement = {
    type: 'mention',
    character: agent.name,
    agentId: agent.id,
    agentIcon: agent.icon,
    mentionType: agent.type || 'agent',  // 设置类型
    children: [{ text: '' }],
  };

  // 如果不是手动触发（是输入@触发的），需要先删除 @ 符号
  if (!isManualTrigger) {
    // 删除输入的 @ 和搜索词
    Transforms.delete(editor, {
      distance: 1,
      unit: 'word',
      reverse: true,
    });
  }

  // 插入 mention 节点
  Transforms.insertNodes(editor, mention);
  // 移动光标到 mention 后面
  Transforms.move(editor);
  // 插入空格
  Transforms.insertText(editor, ' ');
};

// 自定义 withMentions 插件
const withMentions = (editor: Editor) => {
  const { isInline, isVoid } = editor;

  editor.isInline = (element) => {
    return element.type === 'mention' ? true : isInline(element);
  };

  editor.isVoid = (element) => {
    return element.type === 'mention' ? true : isVoid(element);
  };

  return editor;
};

// 渲染元素
const Element = ({ attributes, children, element }: RenderElementProps) => {
  switch (element.type) {
    case 'mention':
      return <Mention {...attributes} element={element}>{children}</Mention>;
    default:
      return <p {...attributes}>{children}</p>;
  }
};

// Mention 组件
const Mention = ({ attributes, children, element }: any) => {
  const selected = false;
  const isGroup = element.mentionType === 'group';

  return (
    <span
      {...attributes}
      contentEditable={false}
      style={{
        padding: '2px 6px',
        margin: '0 2px',
        verticalAlign: 'baseline',
        display: 'inline-block',
        borderRadius: '4px',
        backgroundColor: selected
          ? (isGroup ? '#D1FAE5' : '#B4D5FF')
          : (isGroup ? '#ECFDF5' : '#E8F0FE'),  // 群组：浅绿色，智能体：浅蓝色
        fontSize: '0.9em',
        color: isGroup ? '#10B981' : '#1a73e8',  // 群组：绿色，智能体：蓝色
        cursor: 'pointer',
      }}
    >
      {element.agentIcon && <span style={{ marginRight: '2px' }}>{element.agentIcon}</span>}
      @{element.character}
      {children}
    </span>
  );
};

// Leaf 组件
const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }
  return <span {...attributes}>{children}</span>;
};

export default MentionEditor;
