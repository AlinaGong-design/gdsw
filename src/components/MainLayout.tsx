import React, { useState, useEffect } from 'react';
import { Layout, Menu, Badge, Breadcrumb } from 'antd';
import {
  HomeOutlined,
  ToolOutlined,
  RobotOutlined,
  DatabaseOutlined,
  ThunderboltOutlined,
  ApartmentOutlined,
  ApiOutlined,
  AppstoreOutlined,
  ExperimentOutlined,
  BarChartOutlined,
  SettingOutlined,
  BellOutlined,
  CloudServerOutlined,
  OrderedListOutlined,
  FolderOpenOutlined,
  SafetyCertificateOutlined,
  SmileOutlined,
  TeamOutlined as TeamIconOutlined,
  AimOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

const items: MenuItem[] = [
  {
    key: 'home',
    icon: <HomeOutlined />,
    label: '首页',
  },
  // { key: 'digital-avatar', icon: <SmileOutlined />, label: '数字分身' },
  {
    key: 'agent',
    icon: <RobotOutlined />,
    label: '智能体',
  },
  {
    key: 'knowledge',
    icon: <DatabaseOutlined />,
    label: '知识库',
  },
  {
    key: 'tools',
    icon: <ToolOutlined />,
    label: '工具',
    children: [
      {
        key: 'skill',
        icon: <ThunderboltOutlined />,
        label: 'Skills',
      },
      {
        key: 'workflow',
        icon: <ApartmentOutlined />,
        label: '工作流',
      },
      {
        key: 'mcp',
        icon: <CloudServerOutlined />,
        label: 'MCP',
      },
      {
        key: 'api',
        icon: <ApiOutlined />,
        label: 'API',
      },
      {
        key: 'components',
        icon: <AppstoreOutlined />,
        label: '处理组件',
      },
    ],
  },
  {
    key: 'model',
    icon: <ExperimentOutlined />,
    label: '模型',
  },
  {
    key: 'evaluation',
    icon: <BarChartOutlined />,
    label: '评测',
    children: [
      {
        key: 'evaluation-tasks',
        icon: <OrderedListOutlined />,
        label: '评测任务',
      },
      {
        key: 'evaluation-data',
        icon: <FolderOpenOutlined />,
        label: '评测集',
      },
      {
        key: 'evaluation-rules',
        icon: <SafetyCertificateOutlined />,
        label: '评估器',
      },
    ],
  },
  {
    key: 'trace',
    icon: <AimOutlined />,
    label: 'Trace',
  },
  {
    key: 'system',
    icon: <SettingOutlined />,
    label: '系统管理',
  },
];

interface MainLayoutProps {
  children?: React.ReactNode;
  currentPage?: string;
  onMenuClick?: (key: string) => void;
  onFrontendClick?: () => void;
  onOpenClawClick?: () => void;
  profileTab?: { open: boolean; onClose: () => void };
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, currentPage = 'home', onMenuClick, onFrontendClick, onOpenClawClick, profileTab }) => {
  const [selectedKey, setSelectedKey] = useState(currentPage);

  const getDefaultOpenKeys = (page: string): string[] => {
    if (['skill', 'workflow', 'mcp', 'api', 'components'].includes(page)) return ['tools'];
    if (['evaluation-tasks', 'evaluation-data', 'evaluation-rules'].includes(page)) return ['evaluation'];
    if (['digital-employee-workbench', 'digital-employee-library', 'digital-employee-domain'].includes(page)) return ['digital-employee'];
    return [];
  };

  const [openKeys, setOpenKeys] = useState<string[]>(getDefaultOpenKeys(currentPage));

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    setSelectedKey(e.key);
    if (e.key === 'digital-employee') {
      if (onMenuClick) onMenuClick('digital-employee');
      return;
    }
    if (onMenuClick) {
      onMenuClick(e.key);
    }
  };

  useEffect(() => {
    setSelectedKey(currentPage);
    const newOpenKeys = getDefaultOpenKeys(currentPage);
    if (newOpenKeys.length > 0) {
      setOpenKeys(prev => Array.from(new Set([...prev, ...newOpenKeys])));
    }
  }, [currentPage]);

  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={220}
        style={{
          background: 'linear-gradient(180deg, #6366F1 0%, #8B5CF6 100%)',
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#fff',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          万卷
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          openKeys={openKeys}
          onClick={handleMenuClick}
          onOpenChange={handleOpenChange}
          style={{
            height: 'calc(100% - 64px)',
            borderRight: 0,
            background: 'transparent',
            color: '#fff'
          }}
          theme="dark"
          items={items}
        />
      </Sider>
      <Layout>
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Breadcrumb
              items={[
                { title: '首页' },
              ]}
            />
            {profileTab?.open && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: '#999', fontSize: '13px' }}>/</span>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 10px',
                  background: '#EEF2FF',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#6366F1',
                  fontWeight: 500
                }}>
                  <span>个人中心</span>
                  <span
                    onClick={profileTab.onClose}
                    style={{ cursor: 'pointer', fontSize: '12px', color: '#6366F1', lineHeight: 1, opacity: 0.7 }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
                  >×</span>
                </div>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <span
              onClick={onFrontendClick}
              style={{
                cursor: 'pointer',
                color: '#6366F1',
                fontWeight: 500,
                fontSize: '14px',
                transition: 'color 0.3s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#8B5CF6'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#6366F1'}
            >
              前台管理入口
            </span>
            <Badge count={5}>
              <BellOutlined style={{ fontSize: '18px', cursor: 'pointer' }} />
            </Badge>
          </div>
        </Header>
        <Layout style={{ padding: '24px', background: '#f5f5f5' }}>
          <Content
            style={{
              background: '#fff',
              padding: 24,
              margin: 0,
              minHeight: 280,
              borderRadius: '8px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
          >
            {children}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
