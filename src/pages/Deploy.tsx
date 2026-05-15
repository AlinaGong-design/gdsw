import React from 'react';
import { Card, Row, Col, Button, Typography, Space, Timeline, Tag, Progress } from 'antd';
import {
  RocketOutlined,
  CloudServerOutlined,
  MonitorOutlined,
  SafetyOutlined,
  DeploymentUnitOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const Deploy: React.FC = () => {
  const features = [
    {
      title: '快速部署',
      description: '一键部署应用到生产环境，支持多种部署策略',
      icon: <RocketOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
      actions: ['开始部署', '配置策略'],
    },
    {
      title: '容器管理',
      description: '管理Docker容器和Kubernetes集群',
      icon: <DeploymentUnitOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
      actions: ['查看容器', '创建集群'],
    },
    {
      title: '服务监控',
      description: '实时监控服务状态和性能指标',
      icon: <MonitorOutlined style={{ fontSize: 32, color: '#faad14' }} />,
      actions: ['查看监控', '配置告警'],
    },
    {
      title: '云服务器',
      description: '管理云服务器实例和网络配置',
      icon: <CloudServerOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
      actions: ['管理实例', '配置网络'],
    },
    {
      title: '安全管理',
      description: '配置SSL证书、防火墙和访问控制',
      icon: <SafetyOutlined style={{ fontSize: 32, color: '#eb2f96' }} />,
      actions: ['安全扫描', '配置规则'],
    },
    {
      title: '部署历史',
      description: '查看历史部署记录和版本回滚',
      icon: <HistoryOutlined style={{ fontSize: 32, color: '#fa541c' }} />,
      actions: ['查看历史', '版本回滚'],
    },
  ];

  const deployments = [
    {
      project: '前端应用 v2.3.1',
      status: 'success',
      time: '2小时前',
      duration: '3分15秒',
    },
    {
      project: 'API服务 v1.8.0',
      status: 'processing',
      time: '进行中',
      duration: '1分30秒',
      progress: 65,
    },
    {
      project: '数据库迁移',
      status: 'wait',
      time: '等待中',
      duration: '-',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'processing':
        return <SyncOutlined spin style={{ color: '#1890ff' }} />;
      case 'wait':
        return <ClockCircleOutlined style={{ color: '#d9d9d9' }} />;
      default:
        return null;
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'success':
        return <Tag color="success">成功</Tag>;
      case 'processing':
        return <Tag color="processing">进行中</Tag>;
      case 'wait':
        return <Tag color="default">等待中</Tag>;
      default:
        return null;
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>发布运维</Title>
        <Paragraph type="secondary">
          管理应用部署、服务器和运维监控，确保系统稳定运行
        </Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Row gutter={[16, 16]}>
            {features.map((feature, index) => (
              <Col xs={24} sm={12} key={index}>
                <Card
                  hoverable
                  style={{ height: '100%' }}
                  bodyStyle={{ padding: 20 }}
                >
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <div style={{ textAlign: 'center' }}>
                      {feature.icon}
                    </div>
                    <div>
                      <Title level={5} style={{ marginBottom: 8 }}>
                        {feature.title}
                      </Title>
                      <Paragraph type="secondary" style={{ marginBottom: 12, fontSize: 13 }}>
                        {feature.description}
                      </Paragraph>
                    </div>
                    <Space size="small">
                      {feature.actions.map((action, idx) => (
                        <Button key={idx} type={idx === 0 ? 'primary' : 'default'} size="small">
                          {action}
                        </Button>
                      ))}
                    </Space>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title="最近部署"
            extra={<Button type="link">查看全部</Button>}
            bodyStyle={{ padding: '16px 24px' }}
          >
            <Timeline
              items={deployments.map((deploy, index) => ({
                dot: getStatusIcon(deploy.status),
                children: (
                  <div key={index}>
                    <div style={{ marginBottom: 4 }}>
                      <Text strong>{deploy.project}</Text>
                      <div style={{ marginTop: 4 }}>
                        {getStatusTag(deploy.status)}
                      </div>
                    </div>
                    {deploy.status === 'processing' && deploy.progress && (
                      <Progress
                        percent={deploy.progress}
                        size="small"
                        style={{ marginTop: 8, marginBottom: 8 }}
                      />
                    )}
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                      <Space split="|">
                        <span>{deploy.time}</span>
                        <span>耗时: {deploy.duration}</span>
                      </Space>
                    </div>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Deploy;
