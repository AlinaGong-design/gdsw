import React, { useState } from 'react';
import { Card, Button, Tag, Space, Tooltip, Row, Col, Input, Modal, message } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
  SearchOutlined,
  DeleteOutlined,
  BranchesOutlined,
} from '@ant-design/icons';

export interface OpenClawInstance {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'published' | 'draft' | 'offline';
  createTime: string;
  updateTime: string;
  isBuiltin?: boolean;
}

interface OpenClawInstancesProps {
  onCreateInstance?: () => void;
  onEditInstance?: (instanceId: string) => void;
}

const BUILTIN_INSTANCE: OpenClawInstance = {
  id: 'builtin-1',
  name: 'OpenClaw',
  description: '系统内置的 OpenClaw 实例，提供即时通讯能力，支持多渠道消息接入与智能体对话。',
  icon: '🤖',
  status: 'published',
  createTime: '2024-01-01',
  updateTime: '2024-01-01',
  isBuiltin: true,
};

const OpenClawInstances: React.FC<OpenClawInstancesProps> = ({ onCreateInstance, onEditInstance }) => {
  const [searchText, setSearchText] = useState('');
  const [instances, setInstances] = useState<OpenClawInstance[]>([BUILTIN_INSTANCE]);

  const filteredInstances = instances.filter(inst =>
    inst.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const getStatusTag = (status: string) => {
    const statusConfig = {
      published: { color: 'success', text: '已发布' },
      draft: { color: 'default', text: '草稿' },
      offline: { color: 'error', text: '已下架' },
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const handlePublish = (id: string) => {
    setInstances(instances.map(inst =>
      inst.id === id ? { ...inst, status: 'published' as const } : inst
    ));
    message.success('发布成功');
  };

  const handleOffline = (id: string) => {
    setInstances(instances.map(inst =>
      inst.id === id ? { ...inst, status: 'offline' as const } : inst
    ));
    message.success('下架成功');
  };

  const handleDelete = (id: string, name: string) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除 "${name}" 吗？删除后无法恢复。`,
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        setInstances(instances.filter(inst => inst.id !== id));
        message.success('删除成功');
      },
    });
  };

  const handleEdit = (id: string) => {
    if (onEditInstance) {
      onEditInstance(id);
    }
  };

  const handleCreate = () => {
    if (onCreateInstance) {
      onCreateInstance();
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>OpenClaw 实例</h1>
          <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
            管理您的 OpenClaw 实例，系统内置一个标准实例，您可以基于它创建自定义实例
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={handleCreate}
          style={{
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            border: 'none',
            borderRadius: '8px',
            height: '44px',
            padding: '0 24px',
            fontWeight: 500,
          }}
        >
          新建实例
        </Button>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <Space size="middle" style={{ marginBottom: 16 }}>
          <Input
            placeholder="搜索实例名称"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            allowClear
          />
          <Button onClick={() => setSearchText('')}>重置</Button>
        </Space>
        <div style={{ color: '#666', fontSize: '14px' }}>
          共 {filteredInstances.length} 个实例
        </div>
      </div>

      <Row gutter={[16, 16]}>
        {filteredInstances.map((inst) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={inst.id}>
            <Card
              hoverable
              style={{
                borderRadius: '12px',
                border: inst.isBuiltin ? '1px solid #6366F1' : '1px solid #f0f0f0',
                height: '100%',
                transition: 'all 0.3s',
              }}
              bodyStyle={{ padding: '20px' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '16px',
                }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                  }}>
                    {inst.icon}
                  </div>
                  <Space>
                    {inst.isBuiltin && <Tag color="purple">内置</Tag>}
                    {getStatusTag(inst.status)}
                  </Space>
                </div>

                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, color: '#333' }}>
                  {inst.name}
                </h3>

                <p style={{
                  margin: '0 0 16px 0',
                  fontSize: '14px',
                  color: '#666',
                  lineHeight: '1.6',
                  flex: 1,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {inst.description}
                </p>

                <div style={{
                  fontSize: '12px',
                  color: '#999',
                  marginBottom: '16px',
                  paddingTop: '12px',
                  borderTop: '1px solid #f0f0f0',
                }}>
                  <div>创建: {inst.createTime}</div>
                  <div>更新: {inst.updateTime}</div>
                </div>

                <Space size="small" style={{ width: '100%', justifyContent: 'center' }}>
                  <Tooltip title="编辑">
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(inst.id)}
                      style={{ color: '#6366F1' }}
                    />
                  </Tooltip>
                  {inst.status === 'published' ? (
                    <Tooltip title="下架">
                      <Button
                        type="text"
                        icon={<CloudDownloadOutlined />}
                        onClick={() => handleOffline(inst.id)}
                        style={{ color: '#F59E0B' }}
                        disabled={inst.isBuiltin}
                      />
                    </Tooltip>
                  ) : (
                    <Tooltip title="发布">
                      <Button
                        type="text"
                        icon={<CloudUploadOutlined />}
                        onClick={() => handlePublish(inst.id)}
                        style={{ color: '#10B981' }}
                      />
                    </Tooltip>
                  )}
                  <Tooltip title={inst.isBuiltin ? '内置实例不可删除' : '删除'}>
                    <Button
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={() => !inst.isBuiltin && handleDelete(inst.id, inst.name)}
                      style={{ color: inst.isBuiltin ? '#ccc' : '#EF4444' }}
                      disabled={inst.isBuiltin}
                    />
                  </Tooltip>
                </Space>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {filteredInstances.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: '#fafafa',
          borderRadius: '12px',
          marginTop: '20px',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>
            <BranchesOutlined style={{ color: '#ccc' }} />
          </div>
          <h3 style={{ color: '#666', marginBottom: '8px' }}>未找到相关实例</h3>
          <p style={{ color: '#999' }}>尝试修改搜索关键词</p>
        </div>
      )}
    </div>
  );
};

export default OpenClawInstances;
