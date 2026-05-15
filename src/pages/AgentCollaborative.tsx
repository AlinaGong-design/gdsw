import React, { useState } from 'react';
import {
  Button,
  Input,
  Switch,
  Slider,
  Select,
  Collapse,
  Avatar,
  Space,
  Divider,
  Tag,
  Card,
  Tooltip,
  Modal,
  Checkbox,
  message,
  Dropdown,
  MenuProps,
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  EyeOutlined,
  FileOutlined,
  RocketOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  SendOutlined,
  SmileOutlined,
  PlusCircleOutlined,
  DeleteOutlined,
  SearchOutlined,
  FileAddOutlined,
  DownloadOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import './AgentCollaborative.css';
import { PromptTemplateModal, PromptTemplate } from '../components/PromptTemplateModal';
import { SaveTemplateModal } from '../components/SaveTemplateModal';

const { TextArea } = Input;
const { Panel } = Collapse;

interface SubAgent {
  id: string;
  name: string;
  icon: string;
  description: string;
  model: string;
  enabled: boolean;
  official?: boolean;
}

const AgentCollaborative: React.FC = () => {
  const [appName, setAppName] = useState('我的Agent应用');
  const [appIcon, setAppIcon] = useState('💠');
  const [appDescription, setAppDescription] = useState('');
  const [openingMessage, setOpeningMessage] = useState('');
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState('');

  // 主Agent配置
  const [mainAgentName, setMainAgentName] = useState('规划Agent');
  const [mainAgentDescription, setMainAgentDescription] = useState('负责规划和拆解任务，分配给子Agent执行');
  const [mainAgentModel, setMainAgentModel] = useState('DeepSeek-V3.1-250821');
  const [contextCount, setContextCount] = useState(2);
  const [mainAgentPrompt, setMainAgentPrompt] = useState('');

  // 子Agent列表
  const [subAgents, setSubAgents] = useState<SubAgent[]>([
    {
      id: '1',
      name: '网页探索Agent',
      icon: '🌐',
      description: '具有问题分析、意图理解、操作网页的能力，可主动探索网页',
      model: 'DeepSeek-V3.1-250821',
      enabled: true,
      official: true
    },
    {
      id: '2',
      name: '代码编写Agent',
      icon: '💻',
      description: '具有问题分析、意图理解、操作网页的能力，支持生成并运行Python代码',
      model: 'DeepSeek-V3.1-250821',
      enabled: false,
      official: true
    }
  ]);

  // 子Agent选择弹窗
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);

  // 创建子Agent提示弹窗
  const [showCreateAgentModal, setShowCreateAgentModal] = useState(false);

  // 模板管理相关状态
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);

  // 可选的子Agent列表（模拟数据）
  const [availableAgents] = useState<SubAgent[]>([
    {
      id: '3',
      name: '数据分析Agent',
      icon: '📊',
      description: '专业的数据分析能力，支持统计分析和可视化',
      model: 'DeepSeek-V3.1-250821',
      enabled: false,
      official: true
    },
    {
      id: '4',
      name: '文案创作Agent',
      icon: '✍️',
      description: '专业的文案撰写能力，支持多种文案类型',
      model: 'DeepSeek-V3.1-250821',
      enabled: false,
      official: true
    },
    {
      id: '5',
      name: '图像生成Agent',
      icon: '🎨',
      description: '基于文本描述生成图像的能力',
      model: 'DeepSeek-V3.1-250821',
      enabled: false,
      official: true
    },
    {
      id: '6',
      name: '知识问答Agent',
      icon: '📚',
      description: '基于知识库的专业问答能力',
      model: 'DeepSeek-V3.1-250821',
      enabled: false,
      official: true
    }
  ]);

  // 添加推荐问题
  const handleAddQuestion = () => {
    if (newQuestion.trim() && suggestedQuestions.length < 5) {
      setSuggestedQuestions([...suggestedQuestions, newQuestion.trim()]);
      setNewQuestion('');
    }
  };

  // 删除推荐问题
  const handleRemoveQuestion = (index: number) => {
    setSuggestedQuestions(suggestedQuestions.filter((_, i) => i !== index));
  };

  // 添加子Agent
  const handleAddSubAgent = (agent: SubAgent) => {
    if (!subAgents.find(a => a.id === agent.id)) {
      setSubAgents([...subAgents, { ...agent, enabled: true }]);
      message.success(`已添加 ${agent.name}`);
    }
  };

  // 删除子Agent
  const handleRemoveSubAgent = (agentId: string) => {
    setSubAgents(subAgents.filter(a => a.id !== agentId));
    message.success('已删除子Agent');
  };

  // 切换子Agent启用状态
  const handleToggleSubAgent = (agentId: string, enabled: boolean) => {
    setSubAgents(subAgents.map(a =>
      a.id === agentId ? { ...a, enabled } : a
    ));
  };

  // 保存配置
  const handleSave = () => {
    message.success('配置已保存');
  };

  // 发布
  const handlePublish = () => {
    message.success('应用已发布');
  };

  // 模板菜单项
  const templateMenuItems: MenuProps['items'] = [
    {
      key: 'import',
      label: '导入模板',
      icon: <DownloadOutlined />,
      onClick: () => setShowTemplateModal(true),
    },
    {
      key: 'save',
      label: '保存为模板',
      icon: <UploadOutlined />,
      onClick: () => setShowSaveTemplateModal(true),
    },
  ];

  // 使用模板
  const handleSelectTemplate = (template: PromptTemplate) => {
    setMainAgentPrompt(template.content);
  };

  // 保存模板
  const handleSaveTemplate = (name: string, content: string) => {
    console.log('保存模板:', { name, content });
    // 这里可以调用API保存模板
  };

  // 创建新模板（从模板列表Modal中点击"创建模板"）
  const handleCreateNewTemplate = () => {
    setShowTemplateModal(false);
    setShowSaveTemplateModal(true);
  };

  return (
    <div className="agent-collaborative-container">
      {/* 顶部导航栏 */}
      <div className="collaborative-header">
        <div className="header-left">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => window.location.hash = 'agent'}
          />
          <div className="header-title-section">
            <div className="header-title">我的Agent应用</div>
            <div className="header-meta">
              <Tag color="blue">多智能体协同Agent</Tag>
              <span className="auto-save-text">自动保存于 16:41:06</span>
            </div>
          </div>
        </div>

        <div className="header-right">
          <Space>
            <Button icon={<SaveOutlined />}>配置</Button>
            <Button icon={<EyeOutlined />}>发布</Button>
            <Button icon={<FileOutlined />} />
            <Button icon={<SaveOutlined />} />
            <Button type="primary" icon={<RocketOutlined />} onClick={handlePublish}>
              发布
            </Button>
          </Space>
        </div>
      </div>

      {/* 主体内容 */}
      <div className="collaborative-content">
        {/* 左侧配置面板 */}
        <div className="config-panel">
          <div className="panel-title">应用配置</div>

          {/* 应用设置 */}
          <Collapse
            defaultActiveKey={['basic', 'opening', 'questions']}
            bordered={false}
            expandIconPosition="end"
            className="config-collapse"
          >
            <Panel header="应用设置" key="settings" className="collapse-panel-header">
              <div style={{ padding: '0 16px' }}>设置项...</div>
            </Panel>

            {/* 基本信息 */}
            <Panel header="基本信息" key="basic" className="collapse-panel-header">
              <div className="config-section">
                <div className="config-item">
                  <div className="app-icon-input">
                    <div className="app-icon-preview" style={{ fontSize: 48 }}>
                      {appIcon}
                    </div>
                    <Input
                      value={appIcon}
                      onChange={(e) => setAppIcon(e.target.value)}
                      placeholder="输入emoji图标"
                      style={{ width: 80, textAlign: 'center' }}
                    />
                  </div>
                  <Input
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="我的Agent应用"
                    maxLength={50}
                    showCount
                    style={{ marginTop: 12 }}
                  />
                </div>

                <div className="config-item" style={{ marginTop: 16 }}>
                  <div className="config-label">
                    <SmileOutlined style={{ marginRight: 6 }} />
                    AI生成
                  </div>
                  <TextArea
                    value={appDescription}
                    onChange={(e) => setAppDescription(e.target.value)}
                    placeholder="请描述你的应用，该描述会在应用市场定展示"
                    maxLength={100}
                    showCount
                    autoSize={{ minRows: 3, maxRows: 5 }}
                  />
                </div>
              </div>
            </Panel>

            {/* 开场白 */}
            <Panel header="开场白" key="opening" className="collapse-panel-header">
              <div className="config-section">
                <TextArea
                  value={openingMessage}
                  onChange={(e) => setOpeningMessage(e.target.value)}
                  placeholder="请输入开场白"
                  autoSize={{ minRows: 3, maxRows: 5 }}
                />
              </div>
            </Panel>

            {/* 推荐问 */}
            <Panel header="推荐问" key="questions" className="collapse-panel-header">
              <div className="config-section">
                <div className="suggested-questions-list">
                  {suggestedQuestions.map((question, index) => (
                    <div key={index} className="question-item">
                      <span>{question}</span>
                      <DeleteOutlined
                        onClick={() => handleRemoveQuestion(index)}
                        style={{ color: '#ff4d4f', cursor: 'pointer' }}
                      />
                    </div>
                  ))}
                </div>
                <Input
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="请输入推荐问"
                  suffix={
                    <PlusOutlined
                      onClick={handleAddQuestion}
                      style={{ cursor: 'pointer', color: '#1890ff' }}
                    />
                  }
                  onPressEnter={handleAddQuestion}
                />
              </div>
            </Panel>
          </Collapse>
        </div>

        {/* 中间Agent配置面板 */}
        <div className="agent-config-panel">
          <div className="panel-title">
            <SettingOutlined style={{ marginRight: 8 }} />
            Agent配置
          </div>

          {/* 主Agent */}
          <div className="main-agent-section">
            <div className="section-header">主Agent</div>

            <Card className="agent-card main-agent-card">
              <div className="agent-card-header">
                <div className="agent-info">
                  <Avatar
                    size={40}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    }}
                  >
                    🤖
                  </Avatar>
                  <div className="agent-details">
                    <div className="agent-name">{mainAgentName}</div>
                    <div className="agent-desc">{mainAgentDescription}</div>
                  </div>
                </div>
                <Button
                  type="text"
                  icon={<SettingOutlined />}
                  onClick={() => {}}
                />
              </div>

              <Divider style={{ margin: '16px 0' }} />

              {/* 模型选择 */}
              <div className="agent-config-item">
                <div className="config-item-label">
                  <span>模型</span>
                  <Tooltip title="选择主Agent使用的AI模型">
                    <QuestionCircleOutlined style={{ marginLeft: 4, color: '#999' }} />
                  </Tooltip>
                </div>
                <Select
                  value={mainAgentModel}
                  onChange={setMainAgentModel}
                  style={{ width: '100%' }}
                  suffixIcon={<ReloadOutlined />}
                >
                  <Select.Option value="DeepSeek-V3.1-250821">
                    DeepSeek-V3.1-250821
                  </Select.Option>
                  <Select.Option value="GPT-4">GPT-4</Select.Option>
                  <Select.Option value="GPT-3.5">GPT-3.5</Select.Option>
                </Select>
              </div>

              {/* 参考上下文数 */}
              <div className="agent-config-item" style={{ marginTop: 16 }}>
                <div className="config-item-label">
                  <span>参考上下文数</span>
                  <Tooltip title="控制主Agent参考的历史对话轮数">
                    <QuestionCircleOutlined style={{ marginLeft: 4, color: '#999' }} />
                  </Tooltip>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <Slider
                    value={contextCount}
                    onChange={setContextCount}
                    min={1}
                    max={10}
                    style={{ flex: 1 }}
                  />
                  <span style={{ minWidth: 30, textAlign: 'center' }}>{contextCount}</span>
                </div>
              </div>

              {/* 提示词 */}
              <div className="agent-config-item" style={{ marginTop: 16 }}>
                <div className="config-item-label">
                  <span>提示词</span>
                  <Dropdown menu={{ items: templateMenuItems }} placement="bottomLeft">
                    <Button
                      className="add-template-button"
                      type="link"
                      size="small"
                      icon={<FileAddOutlined />}
                    >
                      模板
                    </Button>
                  </Dropdown>
                </div>
                <TextArea
                  value={mainAgentPrompt}
                  onChange={(e) => setMainAgentPrompt(e.target.value)}
                  placeholder="请填写应用场景说明、描述需要解析的问题、请填写执行指示示例、用于等任务拆解"
                  autoSize={{ minRows: 6, maxRows: 12 }}
                  showCount
                  maxLength={1000}
                />
              </div>
            </Card>
          </div>

          {/* 子Agent */}
          <div className="sub-agents-section">
            <div className="section-header">
              <span>
                子Agent
                <Tooltip title="子Agent是执行具体任务的Agent">
                  <QuestionCircleOutlined style={{ marginLeft: 6, color: '#999' }} />
                </Tooltip>
              </span>
              <Button
                type="link"
                icon={<PlusOutlined />}
                onClick={() => setShowAddAgentModal(true)}
              >
                添加 ({subAgents.filter(a => a.enabled).length}/10)
              </Button>
            </div>

            <div className="sub-agents-list">
              {subAgents.map((agent) => (
                <Card key={agent.id} className="agent-card sub-agent-card">
                  <div className="agent-card-header">
                    <div className="agent-info">
                      <Avatar size={36}>{agent.icon}</Avatar>
                      <div className="agent-details">
                        <div className="agent-name">
                          {agent.name}
                          {agent.official && (
                            <Tag color="blue" style={{ marginLeft: 8, fontSize: 11 }}>
                              官方
                            </Tag>
                          )}
                        </div>
                        <div className="agent-desc">{agent.description}</div>
                      </div>
                    </div>
                    <div className="agent-actions">
                      <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveSubAgent(agent.id)}
                        danger
                      />
                      <Switch
                        checked={agent.enabled}
                        onChange={(checked) => handleToggleSubAgent(agent.id, checked)}
                        size="small"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧预览面板 */}
        <div className="preview-panel">
          <div className="panel-title">
            <FileOutlined style={{ marginRight: 8 }} />
            预览与调试
          </div>

          <div className="preview-content">
            {/* 应用预览卡片 */}
            <div className="app-preview-card">
              <Avatar
                size={80}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  fontSize: 40
                }}
              >
                {appIcon}
              </Avatar>
              <div className="app-preview-name">{appName || '我的Agent应用'}</div>
            </div>

            {/* 聊天输入框 */}
            <div className="chat-input-wrapper">
              <Input
                placeholder="请输入你的问题"
                suffix={
                  <Space>
                    <SmileOutlined style={{ color: '#bfbfbf' }} />
                    <SendOutlined style={{ color: '#1890ff', cursor: 'pointer' }} />
                  </Space>
                }
                style={{
                  borderRadius: 20,
                  padding: '8px 16px'
                }}
              />
            </div>

            {/* 使用限制提示 */}
            <div className="usage-limit-text">
              当前免费使用（每日100次）今日剩余100次｜以上内容由AI生成，仅供参考
            </div>
          </div>
        </div>
      </div>

      {/* 添加子Agent弹窗 */}
      <Modal
        title="导入Agent"
        open={showAddAgentModal}
        onCancel={() => setShowAddAgentModal(false)}
        footer={null}
        width={800}
        closeIcon={<span style={{ fontSize: 20 }}>×</span>}
      >
        <div className="add-agent-modal-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Input
              placeholder="搜索关键词"
              prefix={<SearchOutlined />}
              style={{ width: 360 }}
            />
            <Button
              icon={<PlusOutlined />}
              onClick={() => setShowCreateAgentModal(true)}
            >
              创建
            </Button>
          </div>

          <div className="available-agents-list">
            {availableAgents.map((agent) => {
              const isAdded = subAgents.find(a => a.id === agent.id);
              return (
                <div
                  key={agent.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 0',
                    borderBottom: '1px solid #f0f0f0',
                    opacity: isAdded ? 0.5 : 1
                  }}
                >
                  <div style={{ display: 'flex', gap: 16, flex: 1 }}>
                    <Avatar size={56} style={{ flexShrink: 0 }}>{agent.icon}</Avatar>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4, color: '#262626' }}>
                        {agent.name}
                      </div>
                      <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 8 }}>
                        {agent.description}
                      </div>
                      <div>
                        <Tag style={{ marginRight: 8 }}>自主规划Agent</Tag>
                        <Tag>ID</Tag>
                      </div>
                    </div>
                  </div>
                  <Button
                    type="text"
                    disabled={!!isAdded}
                    onClick={() => handleAddSubAgent(agent)}
                    style={{ flexShrink: 0 }}
                  >
                    {isAdded ? '已添加' : '添加'}
                  </Button>
                </div>
              );
            })}
          </div>

          {/* 分页 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid #f0f0f0'
          }}>
            <span style={{ fontSize: 13, color: '#8c8c8c' }}>共 {availableAgents.length} 条</span>
            <Space>
              <Button size="small" disabled>&lt;</Button>
              <span style={{ fontSize: 13 }}>1</span>
              <Button size="small" disabled>&gt;</Button>
              <Select defaultValue={10} size="small" style={{ width: 100 }}>
                <Select.Option value={10}>10 条/页</Select.Option>
                <Select.Option value={20}>20 条/页</Select.Option>
                <Select.Option value={50}>50 条/页</Select.Option>
              </Select>
            </Space>
          </div>
        </div>
      </Modal>

      {/* 创建子Agent提示弹窗 */}
      <Modal
        title="创建子Agent"
        open={showCreateAgentModal}
        onCancel={() => setShowCreateAgentModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowCreateAgentModal(false)}>
            取消
          </Button>,
          <Button
            key="create"
            type="primary"
            onClick={() => {
              setShowCreateAgentModal(false);
              setShowAddAgentModal(false);
              window.location.hash = 'agent-editor?type=autonomous';
            }}
          >
            前往创建
          </Button>
        ]}
        width={500}
        centered
      >
        <div style={{ padding: '20px 0' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
            <h3 style={{ fontSize: 16, marginBottom: 12, color: '#262626' }}>
              创建自主规划Agent
            </h3>
            <p style={{ color: '#8c8c8c', fontSize: 14, lineHeight: 1.6 }}>
              子Agent需要先创建为自主规划Agent，<br />
              创建完成后可在此处添加到协同团队中。
            </p>
          </div>

          <div style={{
            background: '#f5f7fa',
            padding: '16px',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#595959',
            lineHeight: 1.6
          }}>
            <div style={{ marginBottom: 8 }}>
              <strong>提示：</strong>
            </div>
            <div>
              1. 点击"前往创建"进入Agent配置页面<br />
              2. 配置Agent的名称、提示词、Skills等<br />
              3. 保存后返回此页面，在"添加"中选择刚创建的Agent
            </div>
          </div>
        </div>
      </Modal>

      {/* Prompt模板导入Modal */}
      <PromptTemplateModal
        visible={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onSelect={handleSelectTemplate}
        onCreateNew={handleCreateNewTemplate}
      />

      {/* 保存为模板Modal */}
      <SaveTemplateModal
        visible={showSaveTemplateModal}
        initialPrompt={mainAgentPrompt}
        onClose={() => setShowSaveTemplateModal(false)}
        onSave={handleSaveTemplate}
      />
    </div>
  );
};

export default AgentCollaborative;
