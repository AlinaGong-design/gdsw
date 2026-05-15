import React from 'react';
import { Card, Row, Col, Button, Typography, Space } from 'antd';
import {
  CodeOutlined,
  BugOutlined,
  ApiOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const DevTools: React.FC = () => {
  const tools = [
    {
      title: '代码编辑器',
      description: '在线代码编辑器，支持多种编程语言的语法高亮和智能提示',
      icon: <CodeOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
      actions: ['打开编辑器', '查看文档'],
    },
    {
      title: 'API调试工具',
      description: '测试和调试API接口，支持多种请求方法和参数配置',
      icon: <ApiOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
      actions: ['开始调试', '查看历史'],
    },
    {
      title: '日志查看器',
      description: '实时查看应用日志，支持搜索、过滤和导出功能',
      icon: <FileTextOutlined style={{ fontSize: 32, color: '#faad14' }} />,
      actions: ['查看日志', '配置过滤器'],
    },
    {
      title: 'SQL编辑器',
      description: '在线SQL查询编辑器，支持语法高亮和结果展示',
      icon: <DatabaseOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
      actions: ['新建查询', '查看历史'],
    },
    {
      title: '性能分析',
      description: '分析应用性能，识别瓶颈和优化建议',
      icon: <ThunderboltOutlined style={{ fontSize: 32, color: '#eb2f96' }} />,
      actions: ['开始分析', '查看报告'],
    },
    {
      title: '调试控制台',
      description: '实时调试工具，支持断点、变量监控等功能',
      icon: <BugOutlined style={{ fontSize: 32, color: '#fa541c' }} />,
      actions: ['打开控制台', '设置断点'],
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>开发工具</Title>
        <Paragraph type="secondary">
          提供一系列开发工具，帮助您更高效地进行开发和调试工作
        </Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        {tools.map((tool, index) => (
          <Col xs={24} sm={12} lg={8} key={index}>
            <Card
              hoverable
              style={{ height: '100%' }}
              bodyStyle={{ padding: 24 }}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div style={{ textAlign: 'center' }}>
                  {tool.icon}
                </div>
                <div>
                  <Title level={4} style={{ marginBottom: 8 }}>
                    {tool.title}
                  </Title>
                  <Paragraph type="secondary" style={{ marginBottom: 16 }}>
                    {tool.description}
                  </Paragraph>
                </div>
                <Space>
                  {tool.actions.map((action, idx) => (
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

export default DevTools;
