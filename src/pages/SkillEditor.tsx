import React, { useState } from 'react';
import { SkillImportContent } from './Skill';
import {
  Layout,
  Button,
  Input,
  Tree,
  Space,
  Avatar,
  message,
  Modal,
  Tooltip,
  Switch,
  Tabs,
  Dropdown,
  Select,
  Drawer,
  Timeline,
  Tag,
  Divider,
} from 'antd';
import {
  SendOutlined,
  FolderOutlined,
  FileOutlined,
  CloudUploadOutlined,
  UserOutlined,
  RobotOutlined,
  CloseOutlined,
  ArrowLeftOutlined,
  CodeOutlined,
  EyeOutlined,
  PaperClipOutlined,
  SettingOutlined,
  FolderOpenOutlined,
  ToolOutlined,
  GlobalOutlined,
  FolderViewOutlined,
  EditOutlined,
  BulbOutlined,
  PlusOutlined,
  EllipsisOutlined,
  CopyOutlined,
  EyeInvisibleOutlined,
  DeleteOutlined,
  SaveOutlined,
  HistoryOutlined,
  TagOutlined,
  RollbackOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import './SkillEditor.css';

const { TextArea } = Input;

// ─── 版本控制类型 ─────────────────────────────────────────────────────────────

type VisibilityScope = 'private' | 'team' | 'public';

interface SkillVersion {
  versionId: string;
  version: string;
  changelog: string;
  publishedAt: string;
  publishedBy: string;
  scope: VisibilityScope;
  snapshot: {
    name: string;
    desc: string;
  };
}

interface SkillHistoryEvent {
  id: string;
  kind: 'save' | 'publish';
  time: string;
  user: string;
  desc: string;
  version?: SkillVersion;
}

function nextSkillVersion(last: string, bump: 'patch' | 'minor' | 'major'): string {
  const m = last.match(/^v?(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return 'v1.0.0';
  let [, maj, min, pat] = m.map(Number);
  if (bump === 'major') { maj++; min = 0; pat = 0; }
  else if (bump === 'minor') { min++; pat = 0; }
  else { pat++; }
  return `v${maj}.${min}.${pat}`;
}

const nowStr = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

const SCOPE_LABELS: Record<VisibilityScope, string> = {
  private: '仅自己',
  team: '团队内',
  public: '公开',
};

// 初始演示历史（edit 模式）
const DEMO_SKILL_HISTORY: SkillHistoryEvent[] = [
  {
    id: 'h1', kind: 'publish', time: '2026-01-10 10:00:00', user: '系统', desc: 'v1.0.0',
    version: {
      versionId: 'v1.0.0', version: 'v1.0.0', changelog: '首次发布',
      publishedAt: '2026-01-10 10:00', publishedBy: '系统', scope: 'team',
      snapshot: { name: '写作助手', desc: '智能写作辅助技能' },
    },
  },
  { id: 'h2', kind: 'save', time: '2026-01-15 14:00:00', user: '系统', desc: '优化提示词配置' },
  {
    id: 'h3', kind: 'publish', time: '2026-01-20 11:00:00', user: '系统', desc: 'v1.1.0',
    version: {
      versionId: 'v1.1.0', version: 'v1.1.0', changelog: '新增多语言支持',
      publishedAt: '2026-01-20 11:00', publishedBy: '系统', scope: 'team',
      snapshot: { name: '写作助手', desc: '多语言智能写作辅助技能' },
    },
  },
];

// ─── 历史版本抽屉 ─────────────────────────────────────────────────────────────

const SkillHistoryDrawer: React.FC<{
  open: boolean;
  onClose: () => void;
  history: SkillHistoryEvent[];
  previewVersion: SkillVersion | null;
  onEnterPreview: (ver: SkillVersion) => void;
  onExitPreview: () => void;
}> = ({ open, onClose, history, previewVersion, onEnterPreview, onExitPreview }) => {
  const [rollbackTarget, setRollbackTarget] = useState<SkillVersion | null>(null);
  const isPreview = !!previewVersion;

  const handleRollbackConfirm = () => {
    if (!rollbackTarget) return;
    message.success(`已回滚至 ${rollbackTarget.version}`);
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
        {/* 草稿入口 */}
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
                      <Tag style={{ fontSize: 11, margin: 0 }}>{SCOPE_LABELS[ev.version.scope]}</Tag>
                    </div>
                    <Space size={6}>
                      <Button
                        size="small"
                        icon={<EyeOutlined />}
                        type={isPreview && previewVersion?.versionId === ev.version.versionId ? 'primary' : 'default'}
                        onClick={() => { onEnterPreview(ev.version!); onClose(); }}
                      >
                        查看版本
                      </Button>
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

      {/* 回滚确认弹窗 */}
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
        width={480}
      >
        {rollbackTarget && (
          <div style={{ padding: '4px 0 8px' }}>
            <div style={{ border: '1px solid #e8e8e8', borderRadius: 8, padding: '14px 16px', marginBottom: 20, background: '#fafafa' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>回滚版本 {rollbackTarget.version}</span>
                <span style={{ fontSize: 13, color: '#999' }}>{rollbackTarget.publishedBy} · {rollbackTarget.publishedAt}</span>
              </div>
              <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
                {rollbackTarget.changelog || `将技能恢复至 ${rollbackTarget.version} 版本配置。`}
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#111', marginBottom: 10 }}>此操作会：</div>
              <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>技能配置恢复至选中的 {rollbackTarget.version} 版本状态</li>
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

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface FileNode {
  key: string;
  title: string;
  isLeaf?: boolean;
  children?: FileNode[];
  content?: string;
}

interface EnvVariable {
  id: string;
  key: string;
  value: string;
  visible: boolean;
}

interface SkillEditorProps {
  skillId?: string;
  mode?: 'create' | 'edit';
  importFileName?: string;
  onBack?: () => void;
  onTrySkill?: (skillId: string, skillName: string, skillIcon: string) => void;
  onImportSkill?: (fileName: string) => void;
  context?: 'skill' | 'openclaw';
}

const SkillEditor: React.FC<SkillEditorProps> = ({ skillId, mode = 'create', importFileName: importFileNameProp = '', onBack, onTrySkill, onImportSkill, context = 'skill' }) => {
  // 对话历史
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '你好！我是技能创建助手，请告诉我你想创建什么样的技能！例如：写作助手、数据分析、代码审查等。您也可以上传 Skill 文件包进行技能创建！',
      timestamp: '10:00'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  // 文件树和编辑器状态
  const [fileTree] = useState<FileNode[]>([
    {
      key: 'SKILL.md',
      title: 'SKILL.md',
      isLeaf: true,
      content: `---
name: 写作助手
description: 智能写作技能，支持多种文体和风格的内容创作
version: 1.0.0
author: Alina
icon: ✏️
tags:
  - 写作
  - 内容生成
  - AI助手
triggers:
  keywords:
    - 写作
    - 文章
    - 报告
    - 邮件
    - 总结
  intents:
    - 写作需求
    - 内容创作
    - 文案撰写
---

# 写作助手技能说明书

## 技能概述

写作助手是一个专业的AI写作技能，旨在帮助用户完成各类写作任务。它能够根据用户的需求，生成高质量的文章、报告、邮件、通知和总结等多种文体的内容。

## 核心能力

### 1. 多文体支持
- **文章写作**：技术文章、科普文章、新闻报道等
- **商务报告**：工作报告、项目总结、分析报告等
- **邮件撰写**：商务邮件、通知邮件、客户沟通等
- **通知公告**：企业通知、活动公告、政策说明等
- **内容总结**：会议总结、工作总结、学习总结等

### 2. 多风格适配
- **正式风格**：适用于商务场合、正式文档
- **轻松风格**：适用于日常沟通、营销文案
- **学术风格**：适用于学术论文、研究报告
- **商务风格**：适用于商业计划、市场分析

### 3. 字数精确控制
- 支持50-5000字的灵活字数设置
- 自动根据内容类型调整合适长度
- 智能控制输出篇幅，避免冗余

## 标准操作程序 (SOP)

### 步骤 1: 需求理解
1. 接收用户输入的写作需求
2. 解析关键信息：
   - 内容类型（文章/报告/邮件等）
   - 主题或话题
   - 写作风格要求
   - 目标字数
3. 验证输入有效性

### 步骤 2: 内容规划
1. 根据内容类型选择合适的结构模板
2. 规划文章大纲：
   - 确定开头方式
   - 规划主体段落
   - 设计结尾方式
3. 分配各部分字数比例

### 步骤 3: 内容生成
1. 调用AI模型生成内容
2. 应用指定的写作风格
3. 控制输出长度在目标范围内
4. 确保内容逻辑连贯、结构清晰

### 步骤 4: 质量检查
1. 检查内容完整性
2. 验证字数是否符合要求（±30%容差）
3. 确保语言规范、无明显错误
4. 检查是否符合用户指定的风格

### 步骤 5: 输出返回
1. 格式化输出内容
2. 附加元数据：
   - 实际字数
   - 内容类型
   - 使用的风格
3. 返回完整结果给用户

## 参数说明

### content_type（必需）
- 类型：string
- 可选值：文章、报告、邮件、通知、总结
- 说明：指定要生成的内容类型

### style（可选）
- 类型：string
- 可选值：正式、轻松、学术、商务
- 默认值：通用
- 说明：指定写作风格

### length（可选）
- 类型：integer
- 取值范围：50-5000
- 默认值：500
- 说明：目标字数

## 使用示例

### 示例 1：撰写技术文章
\`\`\`
用户：@写作助手 帮我写一篇关于人工智能发展的文章，正式风格，800字左右

AI：好的，我将为您创作一篇关于人工智能发展的正式文章...
[生成800字左右的技术文章]
\`\`\`

### 示例 2：商务邮件
\`\`\`
用户：@写作助手 写一封通知客户项目延期的邮件，正式风格，300字

AI：我已为您撰写了项目延期通知邮件...
[生成300字左右的正式邮件]
\`\`\`

### 示例 3：工作总结
\`\`\`
用户：@写作助手 生成本月工作总结，包含完成的项目和下月计划

AI：我将为您生成本月工作总结...
[生成包含项目回顾和计划的��结]
\`\`\`

## 触发机制

### 关键词自动触发
当用户输入包含以下关键词时，技能自动激活：
- 写作、文章、报告
- 邮件、通知、总结
- 撰写、编写、创作

### 显式调用
用户可以通过 @写作助手 显式调用该技能

### 意图识别
系统识别到以下意图时自动触发：
- 写作需求
- 内容创作
- 文案撰写

## 技术规格

- **AI模型**：GPT-4
- **Temperature**：0.7
- **Max Tokens**：根据目标字数动态计算
- **Token计算**：中文约1.5 token/字，预留20%余量

## 错误处理

1. **输入为空**：返回友好提示，引导用户提供写作需求
2. **参数无效**：返回参数错误信息，说明有效取值范围
3. **生成失败**：捕获异常，返回错误信息并建议重试

## 版本历史

- v1.0.0 (2024-01-20)：初始版本发布
  - 支持5种文体类型
  - 支持4种写作风格
  - 字数控制功能
  - 关键词触发机制`
    },
    {
      key: 'scripts',
      title: 'scripts',
      children: [
        {
          key: 'scripts/execute.py',
          title: 'execute.py',
          isLeaf: true,
          content: `#!/usr/bin/env python3
"""
写作助手技能执行脚本
"""
import sys
import json
from typing import Dict, Any

def execute_skill(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    执行写作任务

    Args:
        context: 包含用户输入和参数的上下文

    Returns:
        执行结果
    """
    try:
        # 提取参数
        user_input = context.get('input', '')
        content_type = context.get('content_type', '文章')
        style = context.get('style', '通用')
        length = context.get('length', 500)

        # 验证输入
        if not user_input:
            return {
                "success": False,
                "error": "输入不能为空"
            }

        # 调用AI生成内容（这里是模拟）
        result = generate_content(user_input, content_type, style, length)

        return {
            "success": True,
            "output": result['content'],
            "metadata": {
                "word_count": len(result['content']),
                "content_type": content_type,
                "style": style
            }
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def generate_content(topic: str, content_type: str, style: str, length: int) -> Dict[str, Any]:
    """
    生成写作内容
    """
    # 这里应该调用实际的AI模型
    # 目前返回示例内容
    return {
        "content": f"# {topic}\\n\\n这是一篇关于{topic}的{content_type}，采用{style}风格...",
        "tokens_used": 100
    }

if __name__ == "__main__":
    # 从标准输入读取JSON
    context = json.loads(sys.stdin.read())
    result = execute_skill(context)
    print(json.dumps(result, ensure_ascii=False, indent=2))`
        },
        {
          key: 'scripts/validate.py',
          title: 'validate.py',
          isLeaf: true,
          content: `#!/usr/bin/env python3
"""
输入验证脚本
"""
import sys
import json
from typing import Dict, Any, Tuple

def validate_input(context: Dict[str, Any]) -> Tuple[bool, str]:
    """
    验证用户输入和参数

    Returns:
        (is_valid, error_message)
    """
    user_input = context.get('input', '').strip()

    # 检查输入是否为空
    if not user_input:
        return False, "请提供写作主题或需求"

    # 检查content_type
    content_type = context.get('content_type')
    if content_type:
        valid_types = ['文章', '报告', '邮件', '通知', '总结']
        if content_type not in valid_types:
            return False, f"content_type必须是以下之一：{', '.join(valid_types)}"

    # 检查style
    style = context.get('style')
    if style:
        valid_styles = ['正式', '轻松', '学术', '商务']
        if style not in valid_styles:
            return False, f"style必须是以下之一：{', '.join(valid_styles)}"

    # 检查length
    length = context.get('length')
    if length:
        if not isinstance(length, int) or length < 50 or length > 5000:
            return False, "length必须是50-5000之间的整数"

    return True, ""

if __name__ == "__main__":
    context = json.loads(sys.stdin.read())
    is_valid, error_msg = validate_input(context)

    result = {
        "valid": is_valid,
        "error": error_msg if not is_valid else None
    }

    print(json.dumps(result, ensure_ascii=False, indent=2))`
        }
      ]
    },
    {
      key: 'references',
      title: 'references',
      children: [
        {
          key: 'references/article_framework.md',
          title: 'article_framework.md',
          isLeaf: true,
          content: `# {title}

## 引言

{introduction}

## 主体内容

### 第一部分：{section1_title}

{section1_content}

### 第二部分：{section2_title}

{section2_content}

### 第三部分：{section3_title}

{section3_content}

## 结论

{conclusion}

---
*字数：{word_count}字*`
        },
        {
          key: 'references/email_framework.md',
          title: 'email_framework.md',
          isLeaf: true,
          content: `**主题：{subject}**

{salutation}，

{opening}

**{section_title}：**
{main_content}

{closing}

{signature}

---
*此邮件由AI写作助手生成*`
        },
        {
          key: 'references/report_framework.md',
          title: 'report_framework.md',
          isLeaf: true,
          content: `# {report_title}

## 摘要

{summary}

## 背景

{background}

## 详细内容

### {detail_section1}
{detail_content1}

### {detail_section2}
{detail_content2}

## 数据分析

{data_analysis}

## 结论与建议

{conclusion}

---
**报告日期：**{date}
**撰写：**{author}`
        }
      ]
    },
    {
      key: 'assets',
      title: 'assets',
      children: [
        {
          key: 'assets/style_guide.md',
          title: 'style_guide.md',
          isLeaf: true,
          content: `# 写作风格指南

## 正式风格

### 特点
- 使用规范的书面语
- 避免口语化表达
- 采用客观、严谨的语气
- 结构清晰、逻辑严密

### 适用场景
- 商务文档
- 正式报告
- 政府公文
- 学术论文

### 示例
> 根据最新市场调研数据显示，该项目具有良好的市场前景和投资价值。

## 轻松风格

### 特点
- 语言活泼、亲切
- 适当使用口语化表达
- 增加趣味性和可读性
- 贴近日常交流

### 适用场景
- 营销文案
- 社交媒体
- 博客文章
- 内部通讯

### 示例
> 嘿！告诉你个好消息，我们的新产品真的超级棒！

## 学术风格

### 特点
- 严谨的论证逻辑
- 引用权威文献
- 使用专业术语
- 客观中立的表述

### 适用场景
- 学术论文
- 研究报告
- 技术文档
- 行业分析

### 示例
> 根据Smith等人(2023)的研究，该理论在实践中得到了广泛验证。

## 商务风格

### 特点
- 专业且易懂
- 重点突出
- 数据支撑
- 面向结果

### 适用场景
- 商业计划书
- 项目提案
- 市场分析
- 客户报告

### 示例
> 本季度销售额同比增长25%，市场占有率提升至15%，超额完成既定目标。`
        },
        {
          key: 'assets/examples.json',
          title: 'examples.json',
          isLeaf: true,
          content: `{
  "examples": [
    {
      "scenario": "技术文章",
      "input": {
        "topic": "人工智能在医疗领域的应用",
        "content_type": "文章",
        "style": "学术",
        "length": 800
      },
      "output": {
        "title": "人工智能在医疗领域的应用与展望",
        "word_count": 823,
        "preview": "人工智能（AI）技术正在深刻改变医疗行业..."
      }
    },
    {
      "scenario": "商务邮件",
      "input": {
        "topic": "项目进度更新",
        "content_type": "邮件",
        "style": "正式",
        "length": 300
      },
      "output": {
        "subject": "XX项目进度更新通知",
        "word_count": 287,
        "preview": "尊敬的客户，关于XX项目的最新进展..."
      }
    },
    {
      "scenario": "工作总结",
      "input": {
        "topic": "Q1季度工作总结",
        "content_type": "总结",
        "style": "商务",
        "length": 600
      },
      "output": {
        "title": "2024年第一季度工作总结",
        "word_count": 615,
        "preview": "本季度在全体团队的共同努力下..."
      }
    }
  ]
}`
        }
      ]
    },
    {
      key: 'README.md',
      title: 'README.md',
      isLeaf: true,
      content: `# 写作助手技能包

## 📝 简介

写作助手是一个智能AI技能，能够帮助用户完成各类写作任务，支持多种文体和风格。

## 🗂️ 文件结构

\`\`\`
writing-assistant/
├── SKILL.md              # 核心技能说明书（包含YAML元数据和SOP）
├── scripts/              # 可执行脚本
│   ├── execute.py       # 主执行脚本
│   └── validate.py      # 输入验证脚本
├── templates/           # 内容模板
│   ├── article_template.md
│   ├── email_template.md
│   └── report_template.md
├── assets/              # 资源文件
│   ├── style_guide.md   # 写作风格指南
│   └── examples.json    # 使用示例
└── README.md            # 本文件
\`\`\`

## 🚀 快速开始

### 基础调用

\`\`\`
@写作助手 帮我写一篇关于AI的文章
\`\`\`

### 指定参数

\`\`\`
@写作助手 写一篇关于人工智能的文章，正式风格，800字
\`\`\`

## 📖 核心文件说明

### SKILL.md
- **YAML元数据**：定义技能的基本信息（名称、描述、触发器等）
- **SOP说明**：详细的任务执行标准操作程序

### scripts/
- **execute.py**：主要的执行逻辑，AI调用此脚本处理写作任务
- **validate.py**：输入验证，确保参数符合规范

### templates/
- 预定义的内容模板
- 用于不同类型的写作任务
- 确保输出格式规范统一

### assets/
- **style_guide.md**：详细的写作风格指南
- **examples.json**：使用示例和测试用例

## 🎯 支持的功能

- ✍️ **多文体**：文章、报告、邮件、通知、总结
- 🎨 **多风格**：正式、轻松、学术、商务
- 📏 **字数控制**：50-5000字灵活调整
- 🎯 **智能识别**：自动识别写作意图

## 📋 参数说明

| 参数 | 类型 | 必需 | 说明 | 默认值 |
|------|------|------|------|--------|
| content_type | string | 是 | 内容类型 | - |
| style | string | 否 | 写作风格 | 通用 |
| length | integer | 否 | 目标字数 | 500 |

## 🔧 技术规格

- **模型**：GPT-4
- **Temperature**：0.7
- **语言**：中文
- **Token计算**：约1.5 token/字

## 📄 许可证

MIT License

## 👨‍💻 作者

Alina

## 🆘 支持

遇到问题？欢迎提交Issue。`
    }
  ]);

  const [openFiles, setOpenFiles] = useState<Array<{ key: string; title: string; content: string }>>([
    {
      key: 'preview',
      title: '预览',
      content: ''
    },
    ...(mode === 'edit' ? [{
      key: 'SKILL.md',
      title: 'SKILL.md',
      content: fileTree[0].content || ''
    }] : [])
  ]);
  const [activeFileKey, setActiveFileKey] = useState(mode === 'create' ? 'preview' : 'SKILL.md');
  const [fileContents, setFileContents] = useState<Record<string, string>>({
    'SKILL.md': fileTree[0].content || ''
  });

  // 部署相关状态
  const [showDeployConfirm, setShowDeployConfirm] = useState(false);
  const [showDeploySuccess, setShowDeploySuccess] = useState(false);
  const [deployedSkillId, setDeployedSkillId] = useState<string>('');
  const [deployedSkillName, setDeployedSkillName] = useState<string>('写作助手');

  // 版本历史与预览
  const [skillHistory, setSkillHistory] = useState<SkillHistoryEvent[]>(mode === 'edit' ? DEMO_SKILL_HISTORY : []);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<SkillVersion | null>(null);
  const isPreview = !!previewVersion;

  // 已发布状态管理
  const [isPublished, setIsPublished] = useState(mode === 'edit');
  const [isDirtyAfterPublish, setIsDirtyAfterPublish] = useState(false);

  // 版本发布弹窗状态
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishVersionNum, setPublishVersionNum] = useState('v1.0.0');
  const [publishChangelog, setPublishChangelog] = useState('');
  const [publishScope, setPublishScope] = useState<string | undefined>(undefined);

  // 终端相关状态
  const [showTerminal, setShowTerminal] = useState(false);
  const [showFileExplorer, setShowFileExplorer] = useState(true);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    '$ Welcome to Skill Editor Terminal',
    '$ Type "help" for available commands'
  ]);
  const [terminalInput, setTerminalInput] = useState('');

  // 沙盒预览相关状态
  const [sandboxLogs, setSandboxLogs] = useState<Array<{ time: string; icon: string; message: string }>>([]);
  const [sandboxProgress, setSandboxProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(mode === 'create');
  const [showPreviewChat, setShowPreviewChat] = useState(mode === 'edit');
  const [previewMessages, setPreviewMessages] = useState<Message[]>(
    mode === 'edit' ? [
      {
        id: 'welcome-1',
        role: 'assistant',
        content: '🎉 技能环境已准备就绪！让我为您介绍一下这个技能的使用方法...',
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      },
      {
        id: 'guide-1',
        role: 'assistant',
        content: `# 📚 写作助手技能使用指南

## 功能概述
写作助手是一个智能写作技能，能够帮助您完成各类写作任务，支持多种文体和风格。

## 主要功能
- ✍️ **多文体支持**：文章、报告、邮件、通知、总结
- 🎨 **多风格适配**：正式、轻松、学术、商务
- 📏 **字数控制**：灵活控制输出长度（50-5000字）
- 🎯 **智能理解**：准确把握用户意图

## 使用方法

### 1. 基础用法
直接描述您的写作需求，例如：
- "帮我写一篇关于AI技术的文章"
- "写一封项目进度更新邮件"
- "生成一份季度工作总结"

### 2. 指定参数
您可以通过 @写作助手 来明确调用，并指定参数：
- **内容类型**：文章、报告、邮件、通知、总结
- **写作风格**：正式、轻松、学术、商务
- **目标字数**：50-5000字（默认500字）

### 3. 示例对话

**示例1：写作文章**
> 用户：@写作助手 帮我写一篇关于人工智能发展的正式文章，800字左右

**示例2：商务邮件**
> 用户：@写作助手 写一封通知客户项目延期的邮件，正式风格，300字

**示例3：工作总结**
> 用户：@写作助手 生成本月工作总结，包含完成的项目和下月计划

## 触发关键词
当您的输入包含以下关键词时，技能会自动激活：
- 写作、文章、报告
- 邮件、通知、总结
- 撰写、编写、创作

## 技术参数
- **模型**：GPT-4
- **Temperature**：0.7（平衡创造性和准确性）
- **最大Token**：根据目标字数自动调整

---

💡 **提示**：您可以随时在对话中调整需求，我会根据反馈优化内容！

现在就试试和我对话，开始创作吧！👇`,
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      }
    ] : []
  );
  const sandboxLogRef = React.useRef<HTMLDivElement>(null);

  // 新增功能状态
  const [internetSearch, setInternetSearch] = useState(false);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const skillPkgInputRef = React.useRef<HTMLInputElement>(null);

  // 可调整宽度相关状态
  const [leftPanelWidth, setLeftPanelWidth] = useState(400);
  const [middlePanelWidth, setMiddlePanelWidth] = useState(250);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingMiddle, setIsResizingMiddle] = useState(false);

  // Markdown编辑预览状态
  const [isMarkdownPreview, setIsMarkdownPreview] = useState(false);

  // 标签页状态
  const [activeTab, setActiveTab] = useState('preview');

  // 环境变量状态
  const [envEnvironment, setEnvEnvironment] = useState<'development' | 'production'>('development');
  const [devEnvVars, setDevEnvVars] = useState<EnvVariable[]>([]);
  const [prodEnvVars, setProdEnvVars] = useState<EnvVariable[]>([]);
  const [isAddingEnvVar, setIsAddingEnvVar] = useState(false);
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvValue, setNewEnvValue] = useState('');
  const [newEnvVisible, setNewEnvVisible] = useState(false);

  // 移除导航页Modal状态，使用activeTab来控制

  // 处理拖动调整宽度
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft) {
        const newWidth = e.clientX;
        if (newWidth >= 300 && newWidth <= 600) {
          setLeftPanelWidth(newWidth);
        }
      }
      if (isResizingMiddle) {
        const newWidth = e.clientX - leftPanelWidth;
        if (newWidth >= 200 && newWidth <= 400) {
          setMiddlePanelWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingMiddle(false);
    };

    if (isResizingLeft || isResizingMiddle) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingLeft, isResizingMiddle, leftPanelWidth]);


  // 模拟技能生成过程
  React.useEffect(() => {
    if (mode === 'create' && isGenerating) {
      const steps = [
        { delay: 500, icon: '🔄', message: '正在初始化云端沙箱...' },
        { delay: 1000, icon: '🔐', message: '认证通过，令牌：******************' },
        { delay: 1500, icon: '📦', message: '正在分配虚拟资源...' },
        { delay: 2000, icon: '💻', message: 'vCPU: 1 核 | 内存: 2048 MB | GPU: N/A' },
        { delay: 2500, icon: '🌐', message: '正在配置安全网络环境...' },
        { delay: 3000, icon: '🔧', message: '正在拉取运行环境: coze-code:1.0.0' },
        { delay: 3200, icon: '⏬', message: '下载中: [进度条] 10%', progress: 10 },
        { delay: 3600, icon: '⏬', message: '下载中: [进度条] 35%', progress: 35 },
        { delay: 4200, icon: '⏬', message: '下载中: [进度条] 68%', progress: 68 },
        { delay: 4800, icon: '⏬', message: '下载中: [进度条] 100%', progress: 100 },
        { delay: 5200, icon: '✅', message: '环境准备完成' },
        { delay: 5700, icon: '🚀', message: '正在启动技能生成器...' },
        { delay: 6200, icon: '✨', message: '沙盒环境已就绪，开始生成技能代码' },
      ];

      steps.forEach(step => {
        setTimeout(() => {
          const now = new Date();
          const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

          setSandboxLogs(prev => [...prev, {
            time: `[${time}]`,
            icon: step.icon,
            message: step.message
          }]);

          if (step.progress !== undefined) {
            setSandboxProgress(step.progress);
          }

          // 最后一步，标记生成完成
          if (step.delay === 6200) {
            setTimeout(() => {
              setIsGenerating(false);
              // 1秒后转换为CUI界面
              setTimeout(() => {
                setShowPreviewChat(true);
                // 自动发送欢迎消息
                const welcomeMsg: Message = {
                  id: 'welcome-1',
                  role: 'assistant',
                  content: '🎉 技能环境已准备就绪！让我为您介绍一下这个技能的使用方法...',
                  timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
                };
                setPreviewMessages([welcomeMsg]);

                // 2秒后发送技能使用说明
                setTimeout(() => {
                  const guideMsg: Message = {
                    id: 'guide-1',
                    role: 'assistant',
                    content: `# 📚 写作助手技能使用指南

## 功能概述
写作助手是一个智能写作技能，能够帮助您完成各类写作任务，支持多种文体和风格。

## 主要功能
- ✍️ **多文体支持**：文章、报告、邮件、通知、总结
- 🎨 **多风格适配**：正式、轻松、学术、商务
- 📏 **字数控制**：灵活控制输出长度（50-5000字）
- 🎯 **智能理解**：准确把握用户意图

## 使用方法

### 1. 基础用法
直接描述您的写作需求，例如：
- "帮我写一篇关于AI技术的文章"
- "写一封项目进度更新邮件"
- "生成一份季度工作总结"

### 2. 指定参数
您可以通过 @写作助手 来明确调用，并指定参数：
- **内容类型**：文章、报告、邮件、通知、总结
- **写作风格**：正式、轻松、学术、商务
- **目标字数**：50-5000字（默认500字）

### 3. 示例对话

**示例1：写作文章**
> 用户：@写作助手 帮我写一篇关于人工智能发展的正式文章，800字左右

**示例2：商务邮件**
> 用户：@写作助手 写一封通知客户项目延期的邮件，正式风格，300字

**示例3：工作总结**
> 用户：@写作助手 生成本月工作总结，包含完成的项目和下月计划

## 触发关键词
当您的输入包含以下关键词时，技能会自动激活：
- 写作、文章、报告
- 邮件、通知、总结
- 撰写、编写、创作

## 技术参数
- **模型**：GPT-4
- **Temperature**：0.7（平衡创造性和准确性）
- **最大Token**：根据目标字数自动调整

---

💡 **提示**：您可以随时在对话中调整需求，我会根据反馈优化内容！

现在就试试和我对话，开始创作吧！👇`,
                    timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
                  };
                  setPreviewMessages(prev => [...prev, guideMsg]);
                }, 2000);
              }, 1000);
            }, 1000);
          }
        }, step.delay);
      });
    }
  }, [mode, isGenerating]);

  // 自动滚动到日志底部
  React.useEffect(() => {
    if (sandboxLogRef.current) {
      sandboxLogRef.current.scrollTop = sandboxLogRef.current.scrollHeight;
    }
  }, [sandboxLogs]);

  // 发送消息
  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, userMessage]);
    setInputMessage('');

    // Mock AI 回复
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateMockResponse(inputMessage),
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  // Mock AI 回复生成
  const generateMockResponse = (input: string): string => {
    const responses = [
      '好的，我已经为你创建了基础的技能结构。你可以在右侧编辑器中查看和修改代码文件。',
      '我理解了你的需求。我已经在 main.py 中添加了相应的功能实现，你可以查看并根据需要调整。',
      '技能配置已更新。请检查 skill.json 文件，确认配置信息是否正确。',
      '代码结构已经生成完毕。建议你先测试基础功能，然后再添加更多特性。'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  // 文件树选择
  const handleFileSelect = (selectedKeys: React.Key[]) => {
    const key = selectedKeys[0] as string;
    const file = findFileByKey(fileTree, key);

    if (file && file.isLeaf && file.content !== undefined) {
      // 检查文件是否已打开
      const isOpen = openFiles.some(f => f.key === key);
      if (!isOpen) {
        setOpenFiles([...openFiles, { key, title: file.title, content: file.content }]);
        setFileContents({ ...fileContents, [key]: file.content });
      }
      setActiveFileKey(key);
    }
  };

  // 查找文件节点
  const findFileByKey = (nodes: FileNode[], key: string): FileNode | null => {
    for (const node of nodes) {
      if (node.key === key) return node;
      if (node.children) {
        const found = findFileByKey(node.children, key);
        if (found) return found;
      }
    }
    return null;
  };

  // 转换为 Tree 组件需要的数据格式
  const convertToTreeData = (nodes: FileNode[]): DataNode[] => {
    return nodes.map(node => ({
      key: node.key,
      title: node.title,
      icon: node.isLeaf ? <FileOutlined /> : <FolderOutlined />,
      children: node.children ? convertToTreeData(node.children) : undefined
    }));
  };

  // 关闭文件标签
  const handleCloseTab = (targetKey: string) => {
    // 预览标签不可关闭
    if (targetKey === 'preview') return;

    const newOpenFiles = openFiles.filter(f => f.key !== targetKey);
    setOpenFiles(newOpenFiles);

    if (activeFileKey === targetKey && newOpenFiles.length > 0) {
      setActiveFileKey(newOpenFiles[newOpenFiles.length - 1].key);
    }
  };

  // 编辑文件内容 - 实时自动保存
  const handleContentChange = (value: string) => {
    setFileContents({
      ...fileContents,
      [activeFileKey]: value
    });
    // 实时自动保存提示
    message.success({ content: '已自动保存为草稿', duration: 1, key: 'autosave' });
    // 已发布后修改，自动变为草稿状态
    if (isPublished && !isDirtyAfterPublish) {
      setIsDirtyAfterPublish(true);
    }
  };

  // 环境变量相关函数
  const getCurrentEnvVars = () => {
    return envEnvironment === 'development' ? devEnvVars : prodEnvVars;
  };

  const setCurrentEnvVars = (vars: EnvVariable[]) => {
    if (envEnvironment === 'development') {
      setDevEnvVars(vars);
    } else {
      setProdEnvVars(vars);
    }
  };

  // 添加环境变量
  const handleAddEnvVar = () => {
    if (!newEnvKey.trim()) {
      message.warning('请输入Key');
      return;
    }
    if (!newEnvValue.trim()) {
      message.warning('请输入Value');
      return;
    }

    const newVar: EnvVariable = {
      id: `env-${Date.now()}`,
      key: newEnvKey.trim(),
      value: newEnvValue.trim(),
      visible: newEnvVisible
    };

    setCurrentEnvVars([...getCurrentEnvVars(), newVar]);
    setIsAddingEnvVar(false);
    setNewEnvKey('');
    setNewEnvValue('');
    setNewEnvVisible(false);
    message.success('环境变量添加成功');
  };

  // 删除环境变量
  const handleDeleteEnvVar = (id: string) => {
    setCurrentEnvVars(getCurrentEnvVars().filter(v => v.id !== id));
    message.success('环境变量已删除');
  };

  // 切换环境变量可见性
  const handleToggleEnvVisible = (id: string) => {
    setCurrentEnvVars(
      getCurrentEnvVars().map(v =>
        v.id === id ? { ...v, visible: !v.visible } : v
      )
    );
  };

  // 取消添加环境变量
  const handleCancelAddEnvVar = () => {
    setIsAddingEnvVar(false);
    setNewEnvKey('');
    setNewEnvValue('');
    setNewEnvVisible(false);
  };

  // 部署 - 打开单步发布弹窗
  const handleDeploy = () => {
    setPublishChangelog('');
    setPublishScope(undefined);
    // 自动计算下一个版本号
    const lastPublish = [...skillHistory].reverse().find(h => h.kind === 'publish');
    if (lastPublish?.version?.version) {
      const parts = lastPublish.version.version.replace('v', '').split('.').map(Number);
      parts[2] = (parts[2] || 0) + 1;
      setPublishVersionNum(`v${parts.join('.')}`);
    } else {
      setPublishVersionNum('v1.0.0');
    }
    setShowPublishModal(true);
  };

  // 确认发布
  const handleConfirmPublish = () => {
    if (!publishVersionNum.trim()) {
      message.warning('请填写版本号');
      return;
    }
    setShowPublishModal(false);
    handleConfirmDeploy();
  };

  // 确认部署
  const handleConfirmDeploy = () => {
    setShowDeployConfirm(false);
    setIsPublished(true);
    setIsDirtyAfterPublish(false);

    // 模拟部署过程
    const deployId = skillId || `skill-${Date.now()}`;
    setDeployedSkillId(deployId);

    // 尝试从skill.json中提取技能名称
    try {
      const skillJsonContent = fileContents['skill.json'];
      if (skillJsonContent) {
        const skillConfig = JSON.parse(skillJsonContent);
        setDeployedSkillName(skillConfig.name || '写作助手');
      }
    } catch (e) {
      // 使用默认名称
    }

    setTimeout(() => {
      message.success({ content: '发布成功！', duration: 3, key: 'publish-success' });
    }, 500);
  };

  // 试一下
  const handleTrySkill = () => {
    setShowDeploySuccess(false);
    if (onTrySkill) {
      onTrySkill(deployedSkillId, deployedSkillName, '✏️');
    }
  };

  // 处理终端命令
  const handleTerminalCommand = () => {
    if (!terminalInput.trim()) return;

    const output = [...terminalOutput, `$ ${terminalInput}`];
    const command = terminalInput.trim().toLowerCase();

    // 模拟命令执行
    if (command === 'help') {
      output.push('Available commands:');
      output.push('  help       - Show this help message');
      output.push('  test       - Run tests');
      output.push('  install    - Install dependencies');
      output.push('  build      - Build the skill');
      output.push('  clear      - Clear terminal');
    } else if (command === 'test') {
      output.push('Running tests...');
      output.push('✓ All tests passed (3/3)');
    } else if (command === 'install') {
      output.push('Installing dependencies...');
      output.push('✓ Dependencies installed successfully');
    } else if (command === 'build') {
      output.push('Building skill...');
      output.push('✓ Build completed successfully');
    } else if (command === 'clear') {
      setTerminalOutput(['$ Terminal cleared']);
      setTerminalInput('');
      return;
    } else {
      output.push(`Command not found: ${terminalInput}`);
      output.push('Type "help" for available commands');
    }

    setTerminalOutput(output);
    setTerminalInput('');
  };

  // 预览CUI发送消息
  const handlePreviewSendMessage = (message: string) => {
    if (!message.trim()) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    };

    setPreviewMessages(prev => [...prev, userMsg]);

    // 模拟AI回复
    setTimeout(() => {
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: generateSkillResponse(message),
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      };
      setPreviewMessages(prev => [...prev, aiMsg]);
    }, 1000);
  };

  // 生成技能模拟回复
  const generateSkillResponse = (input: string): string => {
    if (input.includes('文章') || input.includes('写作')) {
      return `好的，我将为您创作一篇文章。

# 人工智能：重塑未来的科技力量

## 引言
人工智能（Artificial Intelligence, AI）作为21世纪最具革命性的技术之一，正在深刻改变着我们的生活方式、工作模式和社会结构。

## AI的发展历程
从1956年达特茅斯会议提出AI概念，到今天ChatGPT等大语言模型的出现，AI技术经历了多次起伏...

## 当前应用领域
- **医疗健康**：辅助诊断、药物研发
- **金融服务**：风险评估、智能投顾
- **教育培训**：个性化学习、智能辅导
- **交通出行**：自动驾驶、路线优化

## 未来展望
随着技术的不断进步，AI将在更多领域发挥作用，成为推动社会发展的重要力量。

---
*字数：约500字*`;
    } else if (input.includes('邮件')) {
      return `我已为您撰写了一封邮件：

**主题：项目进度更新通知**

尊敬的客户，

您好！

感谢您一直以来对我们项目的关注与支持。现向您汇报本周项目进展情况：

**已完成工作：**
1. 完成系统架构设计文档
2. 完成核心功能模块开发（进度80%）
3. 完成初步测试方案制定

**下周计划：**
1. 完成剩余功能开发
2. 开展系统集成测试
3. 准备用户验收测试

如有任何疑问，欢迎随时与我们联系。

此致
敬礼

---
*��件已生成，您可以根据实际情况修改*`;
    } else {
      return `我理解您的需求是："${input}"

作为写作助手，我可以帮您：
- 📝 撰写各类文章（技术、商务、科普等）
- 📧 编写专业邮件
- 📊 生成工作报告和总结
- 📢 创作通知公告

请告诉我更具体的写作需求，比如：
- 文章主题和类型
- 目标字数
- 写作风格（正式/轻松/学术/商务）

我会为您创作高质量的内容！`;
    }
  };

  // 简单的Markdown渲染函数
  const renderMarkdown = (content: string): string => {
    let html = content;

    // 标题
    html = html.replace(/^### (.*$)/gim, '<h3 style="margin-top: 20px; margin-bottom: 10px; font-size: 18px; font-weight: 600;">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 style="margin-top: 24px; margin-bottom: 12px; font-size: 24px; font-weight: 600;">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 style="margin-top: 28px; margin-bottom: 14px; font-size: 32px; font-weight: 600;">$1</h1>');

    // 粗体
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');

    // 斜体
    html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

    // 代码块
    html = html.replace(/```([\s\S]*?)```/gim, '<pre style="background: #f5f5f5; padding: 12px; border-radius: 4px; overflow-x: auto; font-family: Monaco, Consolas, monospace; font-size: 13px;"><code>$1</code></pre>');

    // 行内代码
    html = html.replace(/`(.*?)`/gim, '<code style="background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-family: Monaco, Consolas, monospace; font-size: 13px;">$1</code>');

    // 链接
    html = html.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" style="color: #6366F1; text-decoration: none;">$1</a>');

    // 无序列表
    html = html.replace(/^\- (.*$)/gim, '<li style="margin-left: 20px;">$1</li>');

    // 分割线
    html = html.replace(/^---$/gim, '<hr style="border: none; border-top: 1px solid #e8e8e8; margin: 20px 0;" />');

    // 换行
    html = html.replace(/\n/gim, '<br />');

    return html;
  };

  // 处理文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      message.success(`文件 ${file.name} 上传成功`);
      // TODO: 实现文件上传逻辑
    }
  };

  // 生成配置
  const handleGenerateConfig = () => {
    setShowConfigPanel(!showConfigPanel);
    if (!showConfigPanel) {
      message.success('配置面板已打开');
    }
  };

  return (
    <div className="skill-editor">
      {/* 顶部状态栏 */}
      <div className="status-bar">
        <div className="status-bar-left">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={onBack}
            style={{ marginRight: '16px' }}
          >
            返回
          </Button>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
            {mode === 'create' ? '创建新技能' : '编辑技能'}
          </h2>
          <span style={{ color: '#999', fontSize: '14px', marginLeft: '16px' }}>
            {skillId || '未命名技能'}
          </span>
        </div>
        <div className="status-bar-right">
          <Space size="middle">
            {skillHistory.length > 0 && (
              <Button icon={<HistoryOutlined />} onClick={() => setHistoryOpen(true)} size="small">
                历史版本
              </Button>
            )}
            {!isPreview && (
              <>
                <Tooltip title="切换文件目录">
                  <Button
                    icon={<FolderViewOutlined />}
                    onClick={() => setShowFileExplorer(!showFileExplorer)}
                    style={{
                      background: showFileExplorer ? '#f0f0f0' : 'transparent'
                    }}
                  />
                </Tooltip>
                <Tooltip title="环境变量">
                  <Button
                    icon={<GlobalOutlined />}
                    onClick={() => setActiveTab('env')}
                    style={{
                      background: activeTab === 'env' ? '#f0f0f0' : 'transparent'
                    }}
                  />
                </Tooltip>
                <Button
                  icon={<CodeOutlined />}
                  onClick={() => setShowTerminal(!showTerminal)}
                  style={{
                    background: showTerminal ? '#f0f0f0' : 'transparent'
                  }}
                >
                  终端
                </Button>
                <Button
                  type="primary"
                  icon={<CloudUploadOutlined />}
                  onClick={handleDeploy}
                  disabled={isPublished && !isDirtyAfterPublish}
                  style={{
                    background: (isPublished && !isDirtyAfterPublish) ? undefined : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                    border: 'none'
                  }}
                >
                  {isPublished && !isDirtyAfterPublish ? '已发布' : isDirtyAfterPublish ? '发布新版本' : '发布'}
                </Button>
              </>
            )}
          </Space>
        </div>
      </div>

      {/* 历史版本预览 Banner */}
      {isPreview && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 24px', background: '#fef3c7', border: '1px solid #fcd34d',
          borderBottom: '1px solid #fcd34d', fontSize: 13, flexShrink: 0,
        }}>
          <Space>
            <EyeOutlined style={{ color: '#d97706' }} />
            <span style={{ color: '#92400e', fontWeight: 500 }}>
              当前浏览的是历史版本{' '}
              <Tag color="orange" style={{ fontFamily: 'monospace' }}>{previewVersion!.version}</Tag>
              发布于 {previewVersion!.publishedAt}，由 {previewVersion!.publishedBy} 提交
            </span>
          </Space>
          <Button icon={<CloseOutlined />} onClick={() => setPreviewVersion(null)} size="small">退出预览</Button>
        </div>
      )}

      {/* 主体区域 */}
      <Layout style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'row' }}>
        {importFileNameProp ? (
          /* ── 导入模式：全宽展示导入可视化 ── */
          <SkillImportContent
            fileName={importFileNameProp}
            onImported={(skillName) => { message.success(`「${skillName}」已导入草稿箱`); }}
          />
        ) : (
        <>
          {/* 预览页面的原有内容 */}
        <div style={{ position: 'relative', width: leftPanelWidth, background: '#fafafa', borderRight: '1px solid #e8e8e8', display: 'flex', flexShrink: 0 }}>
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* 对话头部 */}
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #e8e8e8',
              background: '#fff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Avatar
                  icon={<RobotOutlined />}
                  style={{
                    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
                  }}
                />
                <div>
                  <div style={{ fontWeight: 600 }}>技能创建助手</div>
                  <div style={{ fontSize: '12px', color: '#999' }}>在线</div>
                </div>
              </div>
            </div>

            {/* 对话消息列表 */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              background: '#fafafa'
            }}>
              {messages.map(msg => (
                <div
                  key={msg.id}
                  style={{
                    marginBottom: '16px',
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{
                    maxWidth: '80%',
                    display: 'flex',
                    gap: '8px',
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                  }}>
                    <Avatar
                      size="small"
                      icon={msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                      style={{
                        background: msg.role === 'user' ? '#6366F1' : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                        flexShrink: 0
                      }}
                    />
                    <div>
                      <div style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: msg.role === 'user' ? '#6366F1' : '#fff',
                        color: msg.role === 'user' ? '#fff' : '#333',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                      }}>
                        {msg.id === '1' && msg.role === 'assistant' ? (
                          <span>
                            你好！我是技能创建助手，请告诉我你想创建什么样的技能！例如：写作助手、数据分析、代码审查等。您也可以
                            <span
                              onClick={() => skillPkgInputRef.current?.click()}
                              style={{
                                color: '#6366F1',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                              onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                              onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                            >
                              上传 Skill 文件包
                            </span>
                            {' '}进行技能创建！
                          </span>
                        ) : msg.content}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#999',
                        marginTop: '4px',
                        textAlign: msg.role === 'user' ? 'right' : 'left'
                      }}>
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 输入框 */}
            <div style={{
              padding: '16px',
              borderTop: '1px solid #e8e8e8',
              background: '#fff',
              position: 'relative'
            }}>
              {/* 配置面板 - 悬浮在输入框上方 */}
              {showConfigPanel && (
                <div style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '16px',
                  right: '16px',
                  marginBottom: '8px',
                  padding: '12px',
                  background: '#fff',
                  borderRadius: '8px',
                  border: '1px solid #e8e8e8',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  zIndex: 1000
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      color: '#666',
                      fontWeight: 500
                    }}>
                      <ToolOutlined style={{ fontSize: '14px' }} />
                      <span>工具</span>
                    </div>
                    <CloseOutlined
                      style={{ fontSize: '12px', color: '#999', cursor: 'pointer' }}
                      onClick={() => setShowConfigPanel(false)}
                    />
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingLeft: '22px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      color: '#333'
                    }}>
                      <GlobalOutlined style={{ fontSize: '14px', color: '#6366F1' }} />
                      <span>联网搜索</span>
                    </div>
                    <Switch
                      size="small"
                      checked={internetSearch}
                      onChange={(checked) => setInternetSearch(checked)}
                    />
                  </div>
                </div>
              )}

              {/* 输入框区域 */}
              <div style={{
                position: 'relative',
                border: '1px solid #d9d9d9',
                borderRadius: '8px',
                padding: '12px',
                paddingBottom: '56px',
                background: '#fff'
              }}>
                <TextArea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onPressEnter={(e) => {
                    if (!e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="描述你想创建的技能，比如：一个帮助写作的助手、数据分析工具等..."
                  autoSize={{ minRows: 2, maxRows: 6 }}
                  bordered={false}
                  style={{
                    resize: 'none',
                    padding: 0
                  }}
                />

                {/* 底部功能按钮区域 */}
                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '12px',
                  right: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  {/* 左侧功能按钮 */}
                  <div style={{
                    display: 'flex',
                    gap: '8px'
                  }}>
                    <Tooltip title="上传文件">
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          border: '1px solid #e0e0e0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.3s',
                          background: '#fff'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#6366F1';
                          e.currentTarget.style.color = '#6366F1';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e0e0e0';
                          e.currentTarget.style.color = '#000';
                        }}
                      >
                        <PaperClipOutlined style={{ fontSize: '16px' }} />
                      </div>
                    </Tooltip>

                    <Tooltip title="生成配置">
                      <div
                        onClick={handleGenerateConfig}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          border: '1px solid #e0e0e0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.3s',
                          background: showConfigPanel ? '#6366F1' : '#fff',
                          color: showConfigPanel ? '#fff' : '#000'
                        }}
                        onMouseEnter={(e) => {
                          if (!showConfigPanel) {
                            e.currentTarget.style.borderColor = '#6366F1';
                            e.currentTarget.style.color = '#6366F1';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!showConfigPanel) {
                            e.currentTarget.style.borderColor = '#e0e0e0';
                            e.currentTarget.style.color = '#000';
                          }
                        }}
                      >
                        <SettingOutlined style={{ fontSize: '16px' }} />
                      </div>
                    </Tooltip>

                  </div>

                  {/* 右侧发送按钮 */}
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim()}
                    style={{
                      background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  />
                </div>
              </div>

              {/* 隐藏的文件输入 */}
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              {/* 欢迎语「上传 Skill 文件包」隐藏输入 */}
              <input
                ref={skillPkgInputRef}
                type="file"
                accept=".zip,.skill"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const ext = file.name.substring(file.name.lastIndexOf('.'));
                    if (['.zip', '.skill'].includes(ext)) {
                      if (onImportSkill) onImportSkill(file.name);
                    } else {
                      message.error('请上传 .zip 或 .skill 格式的文件');
                    }
                  }
                  e.target.value = '';
                }}
              />
            </div>
          </div>

          {/* 左侧拖动分隔条 */}
          <div
            onMouseDown={() => setIsResizingLeft(true)}
            style={{
              width: '4px',
              cursor: 'col-resize',
              background: 'transparent',
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              zIndex: 10,
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#6366F1'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          />
        </div>

        {/* 右侧编辑器区域 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
          {showFileExplorer && (
            <div style={{ position: 'relative', width: middlePanelWidth, background: '#f5f5f5', borderRight: '1px solid #e8e8e8', display: 'flex', flexShrink: 0 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '12px', borderBottom: '1px solid #e8e8e8', background: '#fff' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>文件目录</h3>
                </div>
                <div style={{ padding: '8px', overflowY: 'auto', height: 'calc(100% - 48px)' }}>
                  <Tree
                    showIcon
                    defaultExpandAll
                    treeData={convertToTreeData(fileTree)}
                    onSelect={handleFileSelect}
                    selectedKeys={[activeFileKey]}
                  />
                </div>
              </div>

              {/* 中间拖动分隔条 */}
              <div
                onMouseDown={() => setIsResizingMiddle(true)}
                style={{
                  width: '4px',
                  cursor: 'col-resize',
                  background: 'transparent',
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  bottom: 0,
                  zIndex: 10,
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#6366F1'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              />
            </div>
          )}

           {/* 编辑器内部页签区域 */}
          <div className="editor-tabs-container" style={{ flex: 1, background: '#fff', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {openFiles.length > 0 ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* 文件标签页 */}
                <div style={{
                  borderBottom: '1px solid #e8e8e8',
                  background: '#fafafa',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', overflowX: 'auto', flex: 1 }}>
                    {/* 系统常驻标签 */}
                    <div
                      onClick={() => setActiveTab('preview')}
                      style={{
                        padding: '8px 16px',
                        cursor: 'pointer',
                        background: activeTab === 'preview' ? '#fff' : 'transparent',
                        borderRight: '1px solid #e8e8e8',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        minWidth: '80px',
                        fontWeight: activeTab === 'preview' ? 500 : 'normal'
                      }}
                    >
                      <EyeOutlined style={{ fontSize: '12px', color: '#6366F1' }} />
                      <span style={{ fontSize: '13px' }}>预览</span>
                    </div>
                    <div
                      onClick={() => setActiveTab('env')}
                      style={{
                        padding: '8px 16px',
                        cursor: 'pointer',
                        background: activeTab === 'env' ? '#fff' : 'transparent',
                        borderRight: '1px solid #e8e8e8',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        minWidth: '120px',
                        fontWeight: activeTab === 'env' ? 500 : 'normal'
                      }}
                    >
                      <GlobalOutlined style={{ fontSize: '12px', color: '#52c41a' }} />
                      <span style={{ fontSize: '13px' }}>环境变量</span>
                    </div>
                    <div
                      onClick={() => setActiveTab('navigator')}
                      style={{
                        padding: '8px 16px',
                        cursor: 'pointer',
                        background: activeTab === 'navigator' ? '#fff' : 'transparent',
                        borderRight: '1px solid #e8e8e8',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        minWidth: '120px',
                        fontWeight: activeTab === 'navigator' ? 500 : 'normal'
                      }}
                    >
                      <PlusOutlined style={{ fontSize: '12px', color: '#8c8c8c' }} />
                      {/* <span style={{ fontSize: '13px' }}>导航</span> */}
                    </div>

                    {/* 动态文件标签 - 仅在预览模式下显示 */}
                    {activeTab === 'preview' && openFiles.filter(f => f.key !== 'preview').map(file => (
                      <div
                        key={file.key}
                        onClick={() => setActiveFileKey(file.key)}
                        style={{
                          padding: '8px 16px',
                          cursor: 'pointer',
                          background: activeFileKey === file.key ? '#fff' : 'transparent',
                          borderRight: '1px solid #e8e8e8',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          minWidth: '120px',
                          position: 'relative'
                        }}
                      >
                        <FileOutlined style={{ fontSize: '12px' }} />
                        <span style={{ fontSize: '13px' }}>{file.title}</span>
                        <CloseOutlined
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCloseTab(file.key);
                          }}
                          style={{
                            fontSize: '10px',
                            color: '#999',
                            marginLeft: 'auto'
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* 预览/编辑切换按钮 - 只在预览模式且是md文件时显示 */}
                  {activeTab === 'preview' && activeFileKey !== 'preview' && activeFileKey.endsWith('.md') && (
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      padding: '8px 16px',
                      borderLeft: '1px solid #e8e8e8'
                    }}>
                      <Tooltip title="预览">
                        <Button
                          type={isMarkdownPreview ? 'primary' : 'text'}
                          icon={<EyeOutlined />}
                          size="small"
                          onClick={() => setIsMarkdownPreview(true)}
                          style={{
                            background: isMarkdownPreview ? '#f0f0f0' : 'transparent',
                            border: 'none',
                            color: isMarkdownPreview ? '#6366F1' : '#666'
                          }}
                        />
                      </Tooltip>
                      <Tooltip title="编辑">
                        <Button
                          type={!isMarkdownPreview ? 'primary' : 'text'}
                          icon={<EditOutlined />}
                          size="small"
                          onClick={() => setIsMarkdownPreview(false)}
                          style={{
                            background: !isMarkdownPreview ? '#f0f0f0' : 'transparent',
                            border: 'none',
                            color: !isMarkdownPreview ? '#6366F1' : '#666'
                          }}
                        />
                      </Tooltip>
                    </div>
                  )}
                </div>

                {/* 内容区域 */}
                <div style={{ flex: 1, overflow: 'auto', height: showTerminal ? 'calc(100% - 250px)' : '100%' }}>
                  {activeTab === 'navigator' ? (
                    /* 导航页 */
                    <div style={{
                      height: '100%',
                      background: '#fafafa',
                      overflow: 'auto',
                      padding: '40px'
                    }}>
                      <div>
                        {/* 开发工具部分 */}
                        <div style={{ marginBottom: '48px' }}>
                          <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '12px' }}>开发工具</h2>
                          <div style={{ fontSize: '14px', color: '#8c8c8c', marginBottom: '24px' }}>
                            提供代码编辑、实时预览与调试能力，支持全流程的开发与版本管理
                          </div>

                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '16px'
                          }}>
                            {/* 预览卡片 */}
                            <div style={{
                              padding: '12px',
                              border: '1px solid #e8e8e8',
                              borderRadius: '12px',
                              background: '#fff',
                              cursor: 'pointer',
                              transition: 'all 0.3s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
                            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                            onClick={() => setActiveTab('preview')}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                  <div style={{ fontSize: '20px', marginBottom: '12px' }}>📱</div>
                                  <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>预览</h3>
                                  <p style={{ fontSize: '14px', color: '#8c8c8c', margin: 0 }}>
                                    实时预览运行效果，并进行代码调试
                                  </p>
                                </div>
                                <Button
                                  type="text"
                                  icon={<PlusOutlined />}
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    border: '1px solid #e8e8e8',
                                    borderRadius: '50%'
                                  }}
                                />
                              </div>
                            </div>

                            {/* 编辑器卡片 */}
                            <div style={{
                              padding: '12px',
                              border: '1px solid #e8e8e8',
                              borderRadius: '12px',
                              background: '#fff',
                              cursor: 'pointer',
                              transition: 'all 0.3s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
                            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                            onClick={() => {
                              setActiveTab('preview');
                              setActiveFileKey('SKILL.md');
                            }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                  <div style={{ fontSize: '20px', marginBottom: '12px' }}>📝</div>
                                  <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>编辑器</h3>
                                  <p style={{ fontSize: '14px', color: '#8c8c8c', margin: 0 }}>
                                    浏览、编写和修改项目的源代码文件
                                  </p>
                                </div>
                                <Button
                                  type="text"
                                  icon={<PlusOutlined />}
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    border: '1px solid #e8e8e8',
                                    borderRadius: '50%'
                                  }}
                                />
                              </div>
                            </div>

                            {/* 终端卡片 */}
                            <div style={{
                              padding: '12px',
                              border: '1px solid #e8e8e8',
                              borderRadius: '12px',
                              background: '#f5f5f5',
                              cursor: 'pointer',
                              transition: 'all 0.3s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
                            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                            onClick={() => setShowTerminal(true)}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                  <div style={{ fontSize: '20px', marginBottom: '12px' }}>💻</div>
                                  <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>终端</h3>
                                  <p style={{ fontSize: '14px', color: '#8c8c8c', margin: 0 }}>
                                    访问系统命令行，执行脚本或安装依赖包
                                  </p>
                                </div>
                                <Button
                                  type="primary"
                                  icon={<PlusOutlined />}
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    background: 'white',
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: '50%'
                                  }}
                                />
                              </div>
                            </div>

                            {/* 版本控制卡片 */}
                            <div style={{
                              padding: '12px',
                              border: '1px solid #e8e8e8',
                              borderRadius: '12px',
                              background: '#fff',
                              cursor: 'pointer',
                              transition: 'all 0.3s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
                            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                  <div style={{ fontSize: '20px', marginBottom: '12px' }}>🔄</div>
                                  <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>版本控制</h3>
                                  <p style={{ fontSize: '14px', color: '#8c8c8c', margin: 0 }}>
                                    管理代码版本，查看具体的代码变更差异和提交记录
                                  </p>
                                </div>
                                <Button
                                  type="text"
                                  icon={<PlusOutlined />}
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    border: '1px solid #e8e8e8',
                                    borderRadius: '50%'
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 集成服务部分 */}
                        <div style={{ marginBottom: '48px' }}>
                          <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '12px' }}>集成服务</h2>
                          <div style={{ fontSize: '14px', color: '#8c8c8c', marginBottom: '24px' }}>
                            快速配置数据库、身份验证及存储等后端设施，为应用赋予底层能力
                          </div>

                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '16px'
                          }}>
                            {/* 环境变量卡片 */}
                            <div style={{
                              padding: '12px',
                              border: '1px solid #e8e8e8',
                              borderRadius: '12px',
                              background: '#fff',
                              cursor: 'pointer',
                              transition: 'all 0.3s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
                            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                            onClick={() => setActiveTab('env')}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                  <div style={{ fontSize: '20px', marginBottom: '12px' }}>🔐</div>
                                  <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>环境变量</h3>
                                  <p style={{ fontSize: '14px', color: '#8c8c8c', margin: 0 }}>
                                    安全存储 API Key 等配置信息
                                  </p>
                                </div>
                                <Button
                                  type="text"
                                  icon={<PlusOutlined />}
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    border: '1px solid #e8e8e8',
                                    borderRadius: '50%'
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 部署运维部分 */}
                        <div>
                          <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '12px' }}>发布</h2>
                          <div style={{ fontSize: '14px', color: '#8c8c8c', marginBottom: '24px' }}>
                            一键将应用发布至生产环境，并提供实时的数据监控与日志排查服务
                          </div>

                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '16px'
                          }}>
                            {/* 部署卡片 */}
                            <div style={{
                              padding: '12px',
                              border: '1px solid #e8e8e8',
                              borderRadius: '12px',
                              background: '#fff',
                              cursor: 'pointer',
                              transition: 'all 0.3s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
                            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                            onClick={() => handleDeploy()}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                  <div style={{ fontSize: '20px', marginBottom: '12px' }}>🚀</div>
                                  <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>发布</h3>
                                  <p style={{ fontSize: '14px', color: '#8c8c8c', margin: 0 }}>
                                    项目一站式发布至技能中心
                                  </p>
                                </div>
                                <Button
                                  type="text"
                                  icon={<PlusOutlined />}
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    border: '1px solid #e8e8e8',
                                    borderRadius: '50%'
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : activeTab === 'env' ? (
                    /* 环境变量页面 */
                    <div className="env-variables-page" style={{
                      height: '100%',
                      background: '#fafafa',
                      overflow: 'auto'
                    }}>
                      <div style={{
                        maxWidth: '1200px',
                        margin: '0 auto',
                        padding: '40px 24px'
                      }}>
                        {/* 环境切换Tab */}
                        <Tabs
                          activeKey={envEnvironment}
                          onChange={(key) => setEnvEnvironment(key as 'development' | 'production')}
                          style={{ marginBottom: '32px' }}
                          items={[
                            {
                              key: 'development',
                              label: '开发环境'
                            },
                            {
                              key: 'production',
                              label: '生产环境'
                            }
                          ]}
                        />

                        {/* 环境变量列表 */}
                        <div style={{
                          background: '#fff',
                          borderRadius: '8px',
                          padding: '24px'
                        }}>
                          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>
                            {envEnvironment === 'development' ? '开发环境变量' : '生产环境变量'}
                          </h3>

                          {/* 现有环境变量列表 */}
                          {getCurrentEnvVars().map((envVar) => (
                            <div key={envVar.id} style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr auto',
                              gap: '16px',
                              marginBottom: '16px',
                              padding: '16px',
                              background: '#f5f5f5',
                              borderRadius: '8px'
                            }}>
                              <div>
                                <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>Key</div>
                                <Input
                                  value={envVar.key}
                                  disabled
                                  style={{ background: '#fff' }}
                                  suffix={
                                    <Tooltip title="复制">
                                      <CopyOutlined
                                        style={{ color: '#999', cursor: 'pointer' }}
                                        onClick={() => {
                                          navigator.clipboard.writeText(envVar.key);
                                          message.success('已复制');
                                        }}
                                      />
                                    </Tooltip>
                                  }
                                />
                              </div>
                              <div>
                                <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>Value</div>
                                <Input
                                  value={envVar.visible ? envVar.value : '••••••••'}
                                  disabled
                                  style={{ background: '#fff' }}
                                  suffix={
                                    <Tooltip title={envVar.visible ? '隐藏' : '显示'}>
                                      {envVar.visible ? (
                                        <EyeOutlined
                                          style={{ color: '#999', cursor: 'pointer' }}
                                          onClick={() => handleToggleEnvVisible(envVar.id)}
                                        />
                                      ) : (
                                        <EyeInvisibleOutlined
                                          style={{ color: '#999', cursor: 'pointer' }}
                                          onClick={() => handleToggleEnvVisible(envVar.id)}
                                        />
                                      )}
                                    </Tooltip>
                                  }
                                />
                              </div>
                              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <Dropdown
                                  menu={{
                                    items: [
                                      {
                                        key: 'delete',
                                        label: '删除',
                                        icon: <DeleteOutlined />,
                                        danger: true,
                                        onClick: () => handleDeleteEnvVar(envVar.id)
                                      }
                                    ]
                                  }}
                                  trigger={['click']}
                                >
                                  <Button icon={<EllipsisOutlined />} />
                                </Dropdown>
                              </div>
                            </div>
                          ))}

                          {/* 添加新环境变量表单 */}
                          {isAddingEnvVar && (
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr auto',
                              gap: '16px',
                              marginBottom: '16px',
                              padding: '16px',
                              background: '#f5f5f5',
                              borderRadius: '8px'
                            }}>
                              <div>
                                <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>Key</div>
                                <Input
                                  placeholder="请输入Key，最多63个字符"
                                  value={newEnvKey}
                                  onChange={(e) => setNewEnvKey(e.target.value)}
                                  maxLength={63}
                                  suffix={
                                    <Tooltip title="复制">
                                      <CopyOutlined style={{ color: '#d9d9d9' }} />
                                    </Tooltip>
                                  }
                                />
                              </div>
                              <div>
                                <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>Value</div>
                                <Input
                                  placeholder="请输入Value"
                                  value={newEnvValue}
                                  onChange={(e) => setNewEnvValue(e.target.value)}
                                  suffix={
                                    <Tooltip title={newEnvVisible ? '隐藏' : '显示'}>
                                      {newEnvVisible ? (
                                        <EyeOutlined
                                          style={{ color: '#999', cursor: 'pointer' }}
                                          onClick={() => setNewEnvVisible(false)}
                                        />
                                      ) : (
                                        <EyeInvisibleOutlined
                                          style={{ color: '#999', cursor: 'pointer' }}
                                          onClick={() => setNewEnvVisible(true)}
                                        />
                                      )}
                                    </Tooltip>
                                  }
                                />
                              </div>
                              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <Button icon={<EllipsisOutlined />} disabled />
                              </div>
                            </div>
                          )}

                          {/* 添加按钮区域 */}
                          {isAddingEnvVar ? (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                              <Button onClick={handleCancelAddEnvVar}>取消</Button>
                              <Button
                                type="primary"
                                onClick={handleAddEnvVar}
                                style={{
                                  background: '#000',
                                  border: 'none'
                                }}
                              >
                                确认
                              </Button>
                            </div>
                          ) : (
                            <Button
                              type="default"
                              icon={<PlusOutlined />}
                              onClick={() => setIsAddingEnvVar(true)}
                              style={{
                                marginTop: '16px',
                                background: '#8c8c8c',
                                color: '#fff',
                                border: 'none'
                              }}
                            >
                              新建变量
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : activeTab === 'preview' && activeFileKey === 'preview' ? (
                    context === 'openclaw' ? (
                      // OpenClaw 实例预览 - 服务预览留白 mock
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#fafafa',
                        padding: '48px 32px',
                      }}>
                        <div style={{
                          width: '100%',
                          maxWidth: '520px',
                          background: '#fff',
                          borderRadius: '16px',
                          border: '1.5px dashed #c7c7ff',
                          padding: '48px 40px',
                          textAlign: 'center',
                          boxShadow: '0 2px 12px rgba(99,102,241,0.06)',
                        }}>
                          <div style={{ fontSize: '56px', marginBottom: '20px' }}>🤖</div>
                          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1a1a1a', marginBottom: '12px' }}>
                            OpenClaw 服务预览
                          </h2>
                          <p style={{ fontSize: '14px', color: '#888', lineHeight: '1.8', marginBottom: '32px' }}>
                            此处将展示 OpenClaw 实例对应的服务页面。<br />
                            OpenClaw 服务提供即时通讯能力，支持多渠道消息接入、<br />
                            智能体对话及多 Bot 管理。
                          </p>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                            textAlign: 'left',
                            background: '#f5f5ff',
                            borderRadius: '10px',
                            padding: '20px 24px',
                            marginBottom: '24px',
                          }}>
                            <div style={{ fontSize: '13px', color: '#6366F1', fontWeight: 600, marginBottom: '6px' }}>
                              功能说明（Mock）
                            </div>
                            {[
                              '📡  多渠道接入：支持钉钉、飞书、企业微信、Telegram 等',
                              '🤖  多 Bot 管理：绑定不同智能体到不同渠道',
                              '💬  实时对话：提供即时通讯 IM 界面',
                              '🔐  权限管理：支持按用户/群组配置访问权限',
                            ].map((item, idx) => (
                              <div key={idx} style={{ fontSize: '13px', color: '#555', padding: '4px 0' }}>
                                {item}
                              </div>
                            ))}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: '#bbb',
                            background: '#f9f9f9',
                            borderRadius: '6px',
                            padding: '10px 16px',
                          }}>
                            实际服务页面将在 OpenClaw 部署后可用
                          </div>
                        </div>
                      </div>
                    ) : showPreviewChat ? (
                      // 预览CUI对话界面
                      <div style={{
                        width: '100%',
                        height: '100%',
                        background: '#fafafa',
                        display: 'flex',
                        flexDirection: 'column'
                      }}>
                        {/* CUI头部 */}
                        <div style={{
                          padding: '20px 32px',
                          background: '#fff',
                          borderBottom: '1px solid #e8e8e8'
                        }}>
                          <div style={{
                            fontSize: '16px',
                            fontWeight: 600,
                            color: '#333'
                          }}>
                            预览
                          </div>
                        </div>

                        {/* 技能标题 */}
                        <div style={{
                          padding: '32px 32px 24px',
                          background: '#fff'
                        }}>
                          <h2 style={{
                            margin: 0,
                            fontSize: '24px',
                            fontWeight: 600,
                            color: '#1a1a1a'
                          }}>
                            {deployedSkillName || '技能预览'}
                          </h2>
                        </div>

                        {/* 消息列表 */}
                        <div style={{
                          flex: 1,
                          overflowY: 'auto',
                          padding: '0 32px 24px',
                          background: '#fff'
                        }}>
                          {previewMessages.map(msg => (
                            <div
                              key={msg.id}
                              style={{
                                marginBottom: '32px'
                              }}
                            >
                              {msg.role === 'user' ? (
                                // 用户消息
                                <div style={{
                                  background: '#f5f5f5',
                                  padding: '12px 16px',
                                  borderRadius: '8px',
                                  fontSize: '14px',
                                  lineHeight: '1.6',
                                  color: '#333'
                                }}>
                                  <div style={{
                                    fontSize: '12px',
                                    color: '#666',
                                    marginBottom: '6px',
                                    fontWeight: 500
                                  }}>
                                    竞品调研技能
                                  </div>
                                  {msg.content}
                                </div>
                              ) : (
                                // AI助手消息
                                <div>
                                  <h3 style={{
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    marginBottom: '12px',
                                    color: '#1a1a1a'
                                  }}>
                                    技能功能与触发方式
                                  </h3>
                                  <div style={{
                                    fontSize: '14px',
                                    lineHeight: '1.8',
                                    color: '#333',
                                    whiteSpace: 'pre-wrap'
                                  }}>
                                    {msg.content}
                                  </div>
                                  <div style={{
                                    marginTop: '16px',
                                    display: 'flex',
                                    gap: '12px',
                                    alignItems: 'center'
                                  }}>
                                    <Button
                                      type="text"
                                      size="small"
                                      icon={<span style={{ fontSize: '16px' }}>✓</span>}
                                      style={{ color: '#666', padding: '4px 8px' }}
                                    >
                                      已完成
                                    </Button>
                                    <Button
                                      type="text"
                                      size="small"
                                      icon={<span style={{ fontSize: '16px' }}>👍</span>}
                                      style={{ color: '#666', padding: '4px 8px' }}
                                    />
                                    <Button
                                      type="text"
                                      size="small"
                                      icon={<span style={{ fontSize: '16px' }}>👎</span>}
                                      style={{ color: '#666', padding: '4px 8px' }}
                                    />
                                    <Button
                                      type="text"
                                      size="small"
                                      icon={<span style={{ fontSize: '16px' }}>📋</span>}
                                      style={{ color: '#666', padding: '4px 8px' }}
                                    />
                                    <Button
                                      type="text"
                                      size="small"
                                      icon={<span style={{ fontSize: '16px' }}>💬</span>}
                                      style={{ color: '#666', padding: '4px 8px' }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}

                          {/* 你可能想问 */}
                          <div style={{ marginTop: '32px' }}>
                            <div style={{
                              fontSize: '13px',
                              color: '#999',
                              marginBottom: '12px',
                              fontWeight: 500
                            }}>
                              你可能想问
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <Button
                                type="text"
                                style={{
                                  textAlign: 'left',
                                  height: 'auto',
                                  padding: '12px',
                                  border: '1px solid #e8e8e8',
                                  borderRadius: '8px',
                                  fontSize: '14px',
                                  color: '#333',
                                  background: '#fafafa'
                                }}
                                onClick={(e) => {
                                  const question = e.currentTarget.textContent || '';
                                  handlePreviewSendMessage(question);
                                }}
                              >
                                <span style={{ marginRight: '8px' }}>😊</span>
                                生成竞品分析报告时，能自动对比哪些具体维度呢
                              </Button>
                              <Button
                                type="text"
                                style={{
                                  textAlign: 'left',
                                  height: 'auto',
                                  padding: '12px',
                                  border: '1px solid #e8e8e8',
                                  borderRadius: '8px',
                                  fontSize: '14px',
                                  color: '#333',
                                  background: '#fafafa'
                                }}
                                onClick={(e) => {
                                  const question = e.currentTarget.textContent || '';
                                  handlePreviewSendMessage(question);
                                }}
                              >
                                <span style={{ marginRight: '8px' }}>😊</span>
                                怎么快速导入需要分析的竞品列表和数据呢
                              </Button>
                              <Button
                                type="text"
                                style={{
                                  textAlign: 'left',
                                  height: 'auto',
                                  padding: '12px',
                                  border: '1px solid #e8e8e8',
                                  borderRadius: '8px',
                                  fontSize: '14px',
                                  color: '#333',
                                  background: '#fafafa'
                                }}
                                onClick={(e) => {
                                  const question = e.currentTarget.textContent || '';
                                  handlePreviewSendMessage(question);
                                }}
                              >
                                <span style={{ marginRight: '8px' }}>📊</span>
                                生成的报告能直接导出成Excel表格吗
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* 输入框 */}
                        <div style={{
                          padding: '20px 24px',
                          background: '#fff',
                          borderTop: '1px solid #e8e8e8'
                        }}>
                          <div style={{
                            border: '1px solid #e0e0e0',
                            borderRadius: '12px',
                            padding: '12px 16px',
                            background: '#fafafa',
                            transition: 'all 0.3s'
                          }}>
                            <TextArea
                              placeholder="发送消息..."
                              autoSize={{ minRows: 1, maxRows: 4 }}
                              bordered={false}
                              style={{
                                background: 'transparent',
                                fontSize: '14px',
                                padding: 0,
                                marginBottom: '8px'
                              }}
                              onPressEnter={(e) => {
                                if (!e.shiftKey && e.currentTarget.value) {
                                  handlePreviewSendMessage(e.currentTarget.value);
                                  e.currentTarget.value = '';
                                  e.preventDefault();
                                }
                              }}
                            />
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <div style={{ display: 'flex', gap: '12px' }}>
                                <Tooltip title="附件">
                                  <Button
                                    type="text"
                                    icon={<PaperClipOutlined />}
                                    size="small"
                                    style={{ color: '#666' }}
                                  />
                                </Tooltip>
                                <Tooltip title="深度思考">
                                  <Button
                                    type="text"
                                    icon={<BulbOutlined />}
                                    size="small"
                                    style={{ color: '#666' }}
                                  />
                                </Tooltip>
                              </div>
                              <Button
                                type="text"
                                icon={<SendOutlined />}
                                size="small"
                                style={{
                                  color: '#6366F1',
                                  fontWeight: 500
                                }}
                                onClick={(e) => {
                                  const input = e.currentTarget.parentElement?.parentElement?.querySelector('textarea');
                                  if (input && input.value) {
                                    handlePreviewSendMessage(input.value);
                                    input.value = '';
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </div>

                      </div>
                    ) : (
                      // 沙盒预览界面
                    <div style={{
                      width: '100%',
                      height: '100%',
                      background: '#f5f5f5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '40px'
                    }}>
                      <div style={{
                        width: '100%',
                        maxWidth: '900px',
                        background: '#fff',
                        borderRadius: '12px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        overflow: 'hidden'
                      }}>
                        {/* 窗口标题栏 */}
                        <div style={{
                          background: 'linear-gradient(to bottom, #e8e8e8, #d0d0d0)',
                          padding: '12px 16px',
                          borderBottom: '1px solid #c0c0c0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56' }}></div>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }}></div>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f' }}></div>
                          </div>
                          <span style={{ fontSize: '13px', color: '#666', marginLeft: '8px' }}>沙盒环境初始化</span>
                        </div>

                        {/* 日志输出区域 */}
                        <div
                          ref={sandboxLogRef}
                          style={{
                            background: '#fefefe',
                            padding: '12px',
                            minHeight: '400px',
                            maxHeight: '500px',
                            overflowY: 'auto',
                            fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                            fontSize: '13px',
                            lineHeight: '1.8'
                          }}
                        >
                          {sandboxLogs.map((log, index) => (
                            <div key={index} style={{
                              marginBottom: '8px',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '12px'
                            }}>
                              <span style={{ color: '#999', fontWeight: 500, minWidth: '85px' }}>{log.time}</span>
                              <span style={{ fontSize: '16px' }}>{log.icon}</span>
                              <span style={{ color: '#333', flex: 1 }}>
                                {log.message.includes('[进度条]') ? (
                                  <>
                                    {log.message.split('[进度条]')[0]}
                                    <div style={{
                                      display: 'inline-block',
                                      width: '200px',
                                      height: '8px',
                                      background: '#e0e0e0',
                                      borderRadius: '4px',
                                      marginLeft: '8px',
                                      marginRight: '8px',
                                      verticalAlign: 'middle',
                                      position: 'relative',
                                      overflow: 'hidden'
                                    }}>
                                      <div style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: 0,
                                        height: '100%',
                                        width: `${sandboxProgress}%`,
                                        background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)',
                                        borderRadius: '4px',
                                        transition: 'width 0.3s ease'
                                      }}></div>
                                    </div>
                                    {log.message.split('[进度条]')[1]}
                                  </>
                                ) : log.message}
                              </span>
                            </div>
                          ))}

                          {/* 加载动画 */}
                          {isGenerating && (
                            <div style={{
                              marginTop: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              color: '#6366F1'
                            }}>
                              <div className="loading-spinner" style={{
                                width: '16px',
                                height: '16px',
                                border: '2px solid #e0e0e0',
                                borderTopColor: '#6366F1',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                              }}></div>
                              <span style={{ fontSize: '13px' }}>正在准备环境...</span>
                            </div>
                          )}

                          {/* 完成提示 */}
                          {!isGenerating && sandboxLogs.length > 0 && (
                            <div style={{
                              marginTop: '24px',
                              padding: '16px',
                              background: '#f0fdf4',
                              border: '1px solid #86efac',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px'
                            }}>
                              <span style={{ fontSize: '24px' }}>🎉</span>
                              <div>
                                <div style={{ fontWeight: 600, color: '#16a34a', marginBottom: '4px' }}>环境准备完成！</div>
                                <div style={{ fontSize: '12px', color: '#15803d' }}>现在可以开始与AI助手对话，创建您的技能了</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <style>{`
                        @keyframes spin {
                          to { transform: rotate(360deg); }
                        }
                      `}</style>
                    </div>
                    )
                  ) : activeTab === 'preview' && activeFileKey.endsWith('.md') && isMarkdownPreview ? (
                    // Markdown 预览模式
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        padding: '24px 32px',
                        overflowY: 'auto',
                        background: '#fff',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                        lineHeight: '1.8',
                        color: '#333'
                      }}
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdown(fileContents[activeFileKey] || '')
                      }}
                    />
                  ) : activeTab === 'preview' ? (
                    // 正常的代码编辑器 - 仅在预览模式下
                    <TextArea
                      value={fileContents[activeFileKey] || ''}
                      onChange={(e) => handleContentChange(e.target.value)}
                      disabled={isPreview}
                      style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        padding: '16px',
                        resize: 'none',
                        background: isPreview ? '#fafafa' : '#fff',
                      }}
                    />
                  ) : null}
                </div>

                {/* 终端区域 */}
                {showTerminal && (
                  <div style={{
                    height: '250px',
                    borderTop: '2px solid #e8e8e8',
                    background: '#1e1e1e',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 16px',
                      background: '#2d2d2d',
                      borderBottom: '1px solid #3e3e3e'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CodeOutlined style={{ color: '#fff', fontSize: '16px' }} />
                        <span style={{ color: '#fff', fontSize: '14px', fontWeight: 500 }}>终端</span>
                      </div>
                      <Button
                        type="text"
                        icon={<CloseOutlined />}
                        onClick={() => setShowTerminal(false)}
                        style={{ color: '#fff' }}
                        size="small"
                      />
                    </div>
                    <div style={{
                      flex: 1,
                      overflowY: 'auto',
                      padding: '12px',
                      fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                      fontSize: '13px',
                      color: '#d4d4d4'
                    }}>
                      {terminalOutput.map((line, index) => (
                        <div key={index} style={{ marginBottom: '4px' }}>
                          {line}
                        </div>
                      ))}
                    </div>
                    <div style={{
                      padding: '8px 12px',
                      borderTop: '1px solid #3e3e3e',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ color: '#4EC9B0' }}>$</span>
                      <Input
                        value={terminalInput}
                        onChange={(e) => setTerminalInput(e.target.value)}
                        onPressEnter={handleTerminalCommand}
                        placeholder="输入命令..."
                        bordered={false}
                        style={{
                          flex: 1,
                          background: 'transparent',
                          color: '#d4d4d4',
                          fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                          fontSize: '13px'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <FileOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                  <div>选择一个文件开始编辑</div>
                </div>
              </div>
            )}
          </div>
        </div>
        </>
        )}
      </Layout>

      {/* 发布新版本弹窗 */}
      <Modal
        open={showPublishModal}
        onCancel={() => setShowPublishModal(false)}
        footer={null}
        width={520}
        closable
        destroyOnClose
      >
        {/* 标题区域 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '28px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
            background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <CloudUploadOutlined style={{ fontSize: '22px', color: '#7C3AED' }} />
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#111', marginBottom: '4px' }}>发布新版本</div>
            <div style={{ fontSize: '13px', color: '#888' }}>发布后将生成不可变的快照。请确保代码已通过调试验证。</div>
          </div>
        </div>

        {/* 版本号 */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '8px', color: '#111' }}>
            版本号 <span style={{ color: '#ef4444' }}>*</span>
          </div>
          <Input
            value={publishVersionNum}
            onChange={(e) => setPublishVersionNum(e.target.value)}
            size="large"
            style={{ borderRadius: '8px', fontSize: '15px' }}
          />
          <div style={{ fontSize: '12px', color: '#6366F1', marginTop: '6px' }}>
            格式示例: v1.0.0, v2.1.3
          </div>
        </div>

        {/* 版本说明 */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '8px', color: '#111' }}>
            版本说明 / 变更日志
          </div>
          <Input.TextArea
            value={publishChangelog}
            onChange={(e) => setPublishChangelog(e.target.value)}
            placeholder="简要描述本次更新的内容..."
            rows={4}
            style={{ borderRadius: '8px', fontSize: '14px', resize: 'none' }}
          />
        </div>

        {/* 公开范围 */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px', color: '#111' }}>
            公开范围 <span style={{ fontWeight: 400, color: '#888', fontSize: '13px' }}>（为空则仅本人可见）</span>
          </div>
          <Select
            value={publishScope}
            onChange={setPublishScope}
            allowClear
            placeholder="请选择公开范围"
            size="large"
            style={{ width: '100%', marginTop: '8px' }}
          >
            <Select.Option value="team">团队内可见</Select.Option>
            <Select.Option value="public">公开（所有人可见）</Select.Option>
          </Select>
        </div>

        {/* 按钮 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button size="large" onClick={() => setShowPublishModal(false)} style={{ minWidth: '88px' }}>取 消</Button>
          <Button
            type="primary"
            size="large"
            onClick={handleConfirmPublish}
            style={{
              minWidth: '108px',
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              border: 'none', borderRadius: '8px', fontWeight: 500
            }}
          >
            确认发布
          </Button>
        </div>
      </Modal>

      {/* 发布成功对话框 */}
      <Modal
        title="发布成功"
        open={showDeploySuccess}
        onCancel={() => setShowDeploySuccess(false)}
        footer={[
          <Button key="back" onClick={() => setShowDeploySuccess(false)}>
            关闭
          </Button>,
          <Button key="list" onClick={() => {
            setShowDeploySuccess(false);
            if (onBack) onBack();
          }}>
            返回列表
          </Button>,
          <Button
            key="try"
            type="primary"
            onClick={handleTrySkill}
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              border: 'none'
            }}
          >
            试一下
          </Button>
        ]}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
          <h3 style={{ marginBottom: '8px' }}>技能发布成功！</h3>
          <p style={{ color: '#666' }}>
            <strong>{deployedSkillName}</strong> 已发布成功，现在可以在智能体中进行配置了。
          </p>
        </div>
      </Modal>

      {/* 历史版本抽屉 */}
      <SkillHistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={skillHistory}
        previewVersion={previewVersion}
        onEnterPreview={(ver) => setPreviewVersion(ver)}
        onExitPreview={() => setPreviewVersion(null)}
      />
    </div>
  );
};

export default SkillEditor;
