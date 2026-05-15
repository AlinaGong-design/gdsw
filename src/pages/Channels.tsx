import React, { useState } from 'react';
import {
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Tooltip,
  Badge,
  Typography,
  Divider,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface ChannelItem {
  id: string;
  name: string;
  type: 'dingtalk' | 'feishu' | 'wecom' | 'qq' | 'wechat' | 'telegram';
  status: 'connected' | 'disconnected' | 'error';
  model?: string;
  allowedUsers?: string;
  createdAt: string;
}

const channelTypeConfig: Record<string, { label: string; color: string; icon: string }> = {
  dingtalk: { label: 'Dingtalk', color: 'blue', icon: '📌' },
  feishu: { label: 'Feishu', color: 'cyan', icon: '🪁' },
  wecom: { label: 'Wecom', color: 'green', icon: '💬' },
  qq: { label: 'QQ', color: 'purple', icon: '🐧' },
  wechat: { label: 'Wechat', color: 'lime', icon: '🟢' },
  telegram: { label: 'Telegram', color: 'geekblue', icon: '✈️' },
};

const mockChannels: ChannelItem[] = [
  {
    id: '1',
    name: '钉钉客服机器人',
    type: 'dingtalk',
    status: 'connected',
    model: 'gpt-4o',
    allowedUsers: 'user001,user002',
    createdAt: '2026-01-15',
  },
  {
    id: '2',
    name: '飞书工作助手',
    type: 'feishu',
    status: 'connected',
    model: 'claude-3-5-sonnet',
    allowedUsers: '',
    createdAt: '2026-01-20',
  },
  {
    id: '3',
    name: '企业微信通知Bot',
    type: 'wecom',
    status: 'error',
    model: 'gpt-4o-mini',
    createdAt: '2026-02-01',
  },
];

const TelegramFields: React.FC = () => (
  <>
    <Form.Item
      label={
        <span>
          Bot Token&nbsp;
          <Tooltip title="从 Telegram @BotFather 处获取的 API Token">
            <QuestionCircleOutlined style={{ color: '#aaa' }} />
          </Tooltip>
        </span>
      }
      name="botToken"
      rules={[{ required: true, message: '请输入 Bot Token' }]}
    >
      <Input.Password placeholder="110201543:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw" />
    </Form.Item>
    <Form.Item
      label={
        <span>
          允许用户 ID&nbsp;
          <Tooltip title="允许使用该 Bot 的用户 ID，多个用逗号分隔。留空则不限制（不推荐）">
            <QuestionCircleOutlined style={{ color: '#aaa' }} />
          </Tooltip>
        </span>
      }
      name="allowedUserIds"
    >
      <Input placeholder="123456789,987654321" />
    </Form.Item>
    <Form.Item
      label={
        <span>
          流式输出&nbsp;
          <Tooltip title="是否启用流式输出，开启后消息逐字出现">
            <QuestionCircleOutlined style={{ color: '#aaa' }} />
          </Tooltip>
        </span>
      }
      name="streaming"
      valuePropName="checked"
    >
      <Switch defaultChecked />
    </Form.Item>
    <Alert
      type="info"
      showIcon
      style={{ marginBottom: 16 }}
      message="安全提示"
      description="强烈建议配置允许用户 ID 以限制访问权限，防止陌生人控制您的系统。"
    />
  </>
);

const DingTalkFields: React.FC = () => (
  <>
    <Form.Item
      label="App Key"
      name="appKey"
      rules={[{ required: true, message: '请输入 App Key' }]}
    >
      <Input placeholder="dingXXXXXX" />
    </Form.Item>
    <Form.Item
      label="App Secret"
      name="appSecret"
      rules={[{ required: true, message: '请输入 App Secret' }]}
    >
      <Input.Password />
    </Form.Item>
    <Form.Item
      label={
        <span>
          WebSocket 长连接&nbsp;
          <Tooltip title="使用 WebSocket 长连接接收消息，无需公网 IP">
            <QuestionCircleOutlined style={{ color: '#aaa' }} />
          </Tooltip>
        </span>
      }
      name="websocket"
      valuePropName="checked"
    >
      <Switch defaultChecked />
    </Form.Item>
    <Alert
      type="info"
      showIcon
      style={{ marginBottom: 16 }}
      message="配置说明"
      description="钉钉渠道通过企业内部应用实现，需在钉钉开放平台创建企业内部应用并获取 App Key 与 App Secret。"
    />
  </>
);

const FeishuFields: React.FC = () => (
  <>
    <Form.Item
      label="App ID"
      name="appId"
      rules={[{ required: true, message: '请输入 App ID' }]}
    >
      <Input placeholder="cli_XXXXXXXXXXXXXXXX" />
    </Form.Item>
    <Form.Item
      label="App Secret"
      name="appSecret"
      rules={[{ required: true, message: '请输入 App Secret' }]}
    >
      <Input.Password />
    </Form.Item>
    <Form.Item
      label={
        <span>
          Verification Token&nbsp;
          <Tooltip title="飞书开放平台事件订阅的验证令牌">
            <QuestionCircleOutlined style={{ color: '#aaa' }} />
          </Tooltip>
        </span>
      }
      name="verificationToken"
    >
      <Input.Password />
    </Form.Item>
    <Form.Item
      label={
        <span>
          加密密钥 (Encrypt Key)&nbsp;
          <Tooltip title="开启事件加密时填写，可选">
            <QuestionCircleOutlined style={{ color: '#aaa' }} />
          </Tooltip>
        </span>
      }
      name="encryptKey"
    >
      <Input.Password />
    </Form.Item>
    <Alert
      type="info"
      showIcon
      style={{ marginBottom: 16 }}
      message="配置说明"
      description="飞书渠道通过飞书开放平台自建应用实现，需订阅「接收消息」事件并配置 Webhook 地址。"
    />
  </>
);

const WeComFields: React.FC = () => (
  <>
    <Form.Item
      label="企业 ID (Corp ID)"
      name="corpId"
      rules={[{ required: true, message: '请输入企业 ID' }]}
    >
      <Input placeholder="ww..." />
    </Form.Item>
    <Form.Item
      label="应用 Secret"
      name="agentSecret"
      rules={[{ required: true, message: '请输入应用 Secret' }]}
    >
      <Input.Password />
    </Form.Item>
    <Form.Item
      label={
        <span>
          AgentId&nbsp;
          <Tooltip title="企业微信应用的 AgentId，在应用详情页获取">
            <QuestionCircleOutlined style={{ color: '#aaa' }} />
          </Tooltip>
        </span>
      }
      name="agentId"
      rules={[{ required: true, message: '请输入 AgentId' }]}
    >
      <Input placeholder="1000001" />
    </Form.Item>
    <Form.Item
      label={
        <span>
          消息接收 Token&nbsp;
          <Tooltip title="企业微信接收消息时用于验证的 Token">
            <QuestionCircleOutlined style={{ color: '#aaa' }} />
          </Tooltip>
        </span>
      }
      name="token"
    >
      <Input.Password />
    </Form.Item>
    <Alert
      type="info"
      showIcon
      style={{ marginBottom: 16 }}
      message="配置说明"
      description="企业微信渠道通过自建应用实现，需在企业微信管理后台创建应用并开启接收消息功能。"
    />
  </>
);

const QQFields: React.FC = () => (
  <>
    <Form.Item
      label={
        <span>
          接入方式&nbsp;
          <Tooltip title="选择 QQ 机器人的接入方式">
            <QuestionCircleOutlined style={{ color: '#aaa' }} />
          </Tooltip>
        </span>
      }
      name="qqMode"
    >
      <Select defaultValue="official">
        <Option value="official">QQ 开放平台（官方 Bot）</Option>
        <Option value="webhook">Webhook 回调</Option>
      </Select>
    </Form.Item>
    <Form.Item
      label="App ID"
      name="appId"
      rules={[{ required: true, message: '请输入 App ID' }]}
    >
      <Input placeholder="12345678" />
    </Form.Item>
    <Form.Item
      label="App Secret"
      name="appSecret"
      rules={[{ required: true, message: '请输入 App Secret' }]}
    >
      <Input.Password />
    </Form.Item>
    <Form.Item
      label={
        <span>
          沙盒模式&nbsp;
          <Tooltip title="开启后仅在沙盒环境中测试，不影响正式频道">
            <QuestionCircleOutlined style={{ color: '#aaa' }} />
          </Tooltip>
        </span>
      }
      name="sandbox"
      valuePropName="checked"
    >
      <Switch />
    </Form.Item>
    <Alert
      type="info"
      showIcon
      style={{ marginBottom: 16 }}
      message="配置说明"
      description="QQ 渠道通过 QQ 开放平台机器人实现，需在 QQ 开放平台申请机器人权限并获取 App ID 与 App Secret。"
    />
  </>
);

const WeChatFields: React.FC = () => (
  <>
    <Form.Item
      label="App ID"
      name="appId"
      rules={[{ required: true, message: '请输入 App ID' }]}
    >
      <Input placeholder="wx..." />
    </Form.Item>
    <Form.Item
      label="App Secret"
      name="appSecret"
      rules={[{ required: true, message: '请输入 App Secret' }]}
    >
      <Input.Password />
    </Form.Item>
    <Form.Item
      label="Token"
      name="token"
      rules={[{ required: true, message: '请输入 Token' }]}
    >
      <Input />
    </Form.Item>
    <Form.Item label="EncodingAESKey" name="encodingAESKey">
      <Input.Password />
    </Form.Item>
  </>
);

const fieldsByType: Record<string, React.ReactNode> = {
  dingtalk: <DingTalkFields />,
  feishu: <FeishuFields />,
  wecom: <WeComFields />,
  qq: <QQFields />,
  wechat: <WeChatFields />,
  telegram: <TelegramFields />,
};

const Channels: React.FC = () => {
  const [channels, setChannels] = useState<ChannelItem[]>(mockChannels);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<ChannelItem | null>(null);
  const [selectedType, setSelectedType] = useState<string>('dingtalk');
  const [form] = Form.useForm();

  const openCreate = () => {
    setEditingChannel(null);
    setSelectedType('dingtalk');
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (channel: ChannelItem) => {
    setEditingChannel(channel);
    setSelectedType(channel.type);
    form.setFieldsValue({ name: channel.name, type: channel.type, model: channel.model });
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后该渠道将停止接收消息，无法恢复。',
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => setChannels((prev) => prev.filter((c) => c.id !== id)),
    });
  };

  const handleSave = () => {
    form.validateFields().then((values) => {
      if (editingChannel) {
        setChannels((prev) =>
          prev.map((c) => (c.id === editingChannel.id ? { ...c, ...values } : c))
        );
      } else {
        const newChannel: ChannelItem = {
          id: String(Date.now()),
          name: values.name,
          type: values.type,
          status: 'disconnected',
          model: values.model,
          createdAt: new Date().toISOString().split('T')[0],
        };
        setChannels((prev) => [...prev, newChannel]);
      }
      setModalOpen(false);
    });
  };

  const columns = [
    {
      title: '渠道名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: ChannelItem) => (
        <Space>
          <span style={{ fontSize: 18 }}>{channelTypeConfig[record.type]?.icon}</span>
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={channelTypeConfig[type]?.color}>{channelTypeConfig[type]?.label ?? type}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = {
          connected: { color: 'success', text: '已连接' },
          disconnected: { color: 'default', text: '未连接' },
          error: { color: 'error', text: '异常' },
        }[status] ?? { color: 'default', text: status };
        return (
          <Badge
            status={config.color as any}
            text={
              <span style={{ color: status === 'error' ? '#ff4d4f' : status === 'connected' ? '#52c41a' : '#999' }}>
                {config.text}
              </span>
            }
          />
        );
      },
    },
    {
      title: '绑定模型',
      dataIndex: 'model',
      key: 'model',
      render: (model: string) =>
        model ? <Tag>{model}</Tag> : <Text type="secondary">默认</Text>,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ChannelItem) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Title level={4} style={{ margin: 0 }}>Channels</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          添加渠道
        </Button>
      </div>
      <Paragraph type="secondary" style={{ marginBottom: 24 }}>
        Channels 是 AI 智能体的"耳朵"与"嘴巴"，负责接收用户的自然语言指令并返回执行结果。支持钉钉、飞书、企业微信、QQ、微信等主流国内平台接入。OpenClaw 通过单一 Gateway 进程连接多个聊天应用。
      </Paragraph>

      <Alert
        type="warning"
        showIcon
        closable
        style={{ marginBottom: 20 }}
        message="安全提示"
        description="Channels 赋予外部访问者控制系统的权限，请务必配置 Allowed User IDs 或等效的用户过滤机制，防止未经授权的操作。"
      />

      <Table
        dataSource={channels}
        columns={columns}
        rowKey="id"
        pagination={false}
        bordered={false}
        style={{ background: '#fff' }}
      />

      <Modal
        title={editingChannel ? '编辑渠道' : '添加渠道'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText="保存"
        cancelText="取消"
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="渠道名称"
            name="name"
            rules={[{ required: true, message: '请输入渠道名称' }]}
          >
            <Input placeholder="如：主 Telegram Bot" />
          </Form.Item>

          <Form.Item
            label="渠道类型"
            name="type"
            initialValue="dingtalk"
            rules={[{ required: true }]}
          >
            <Select onChange={(v) => setSelectedType(v)}>
              {Object.entries(channelTypeConfig).map(([value, cfg]) => (
                <Option key={value} value={value}>
                  {cfg.icon} {cfg.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={
              <span>
                绑定模型&nbsp;
                <Tooltip title="为该渠道单独指定 AI 模型，留空则使用系统默认模型">
                  <QuestionCircleOutlined style={{ color: '#aaa' }} />
                </Tooltip>
              </span>
            }
            name="model"
          >
            <Select allowClear placeholder="使用系统默认模型">
              <Option value="gpt-4o">GPT-4o</Option>
              <Option value="gpt-4o-mini">GPT-4o Mini</Option>
              <Option value="claude-3-5-sonnet">Claude 3.5 Sonnet</Option>
              <Option value="claude-3-haiku">Claude 3 Haiku</Option>
              <Option value="gemini-1.5-pro">Gemini 1.5 Pro</Option>
            </Select>
          </Form.Item>

          <Divider style={{ fontSize: 13, color: '#888' }}>
            {channelTypeConfig[selectedType]?.label ?? selectedType} 配置
          </Divider>

          {fieldsByType[selectedType] ?? null}
        </Form>
      </Modal>
    </div>
  );
};

export default Channels;
