import React from 'react';
import { Card, Row, Col, Button, Typography, Space, Tag, Badge } from 'antd';
import {
  CloudOutlined,
  GithubOutlined,
  SlackOutlined,
  MailOutlined,
  MessageOutlined,
  LinkOutlined,
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const Integration: React.FC = () => {
  const services = [
    {
      title: 'GitHub集成',
      description: '连接GitHub仓库，自动同步代码和管理工作流',
      icon: <GithubOutlined style={{ fontSize: 32, color: '#000' }} />,
      status: 'connected',
      actions: ['配置', '查看详情'],
    },
    {
      title: 'Slack通知',
      description: '接收系统通知和告警信息到Slack频道',
      icon: <SlackOutlined style={{ fontSize: 32, color: '#4A154B' }} />,
      status: 'connected',
      actions: ['配置频道', '测试通知'],
    },
    {
      title: '邮件服务',
      description: '配置SMTP服务器，发送系统邮件和通知',
      icon: <MailOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
      status: 'not-connected',
      actions: ['立即连接', '查看文档'],
    },
    {
      title: '云存储',
      description: '集成云存储服务，如AWS S3、阿里云OSS等',
      icon: <CloudOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
      status: 'connected',
      actions: ['管理存储桶', '查看使用量'],
    },
    {
      title: '消息队列',
      description: '集成RabbitMQ、Kafka等消息队列服务',
      icon: <MessageOutlined style={{ fontSize: 32, color: '#faad14' }} />,
      status: 'not-connected',
      actions: ['配置连接', '查看文档'],
    },
    {
      title: 'Webhook',
      description: '配置Webhook接收外部系统的事件通知',
      icon: <LinkOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
      status: 'connected',
      actions: ['管理Webhook', '查看日志'],
    },
  ];

  const getStatusTag = (status: string) => {
    if (status === 'connected') {
      return <Tag color="success">已连接</Tag>;
    }
    return <Tag color="default">未连接</Tag>;
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>集成服务</Title>
        <Paragraph type="secondary">
          集成第三方服务，扩展系统功能和提高工作效率
        </Paragraph>
        <Space style={{ marginTop: 12 }}>
          <Badge status="success" text="已连接服务" />
          <span style={{ color: '#52c41a', fontWeight: 500 }}>
            {services.filter(s => s.status === 'connected').length}
          </span>
          <Badge status="default" text="可用服务" style={{ marginLeft: 16 }} />
          <span style={{ fontWeight: 500 }}>
            {services.length}
          </span>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        {services.map((service, index) => (
          <Col xs={24} sm={12} lg={8} key={index}>
            <Card
              hoverable
              style={{ height: '100%' }}
              bodyStyle={{ padding: 24 }}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    {service.icon}
                  </div>
                  {getStatusTag(service.status)}
                </div>
                <div>
                  <Title level={4} style={{ marginBottom: 8 }}>
                    {service.title}
                  </Title>
                  <Paragraph type="secondary" style={{ marginBottom: 16 }}>
                    {service.description}
                  </Paragraph>
                </div>
                <Space>
                  {service.actions.map((action, idx) => (
                    <Button key={idx} type={idx === 0 ? 'primary' : 'default'}>
                      {action}
                    </Button>
                  ))}
                </Space>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Integration;
