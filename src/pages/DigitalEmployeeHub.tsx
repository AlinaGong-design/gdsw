import React, { useState, useEffect } from 'react';
import {
  DashboardOutlined, AppstoreOutlined, BlockOutlined,
  ArrowLeftOutlined, TeamOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  MenuOutlined, BarsOutlined, ClockCircleOutlined, UserOutlined,
  BranchesOutlined, ShopOutlined, SafetyCertificateOutlined, CheckCircleOutlined,
  ThunderboltOutlined, SearchOutlined, PlusOutlined, RocketOutlined,
  ControlOutlined, ApartmentOutlined,
} from '@ant-design/icons';
import { Tooltip, Input, Switch, message, Badge } from 'antd';
import DigitalEmployeeWorkbench from './DigitalEmployeeWorkbench';
import DigitalEmployeeLibrary from './DigitalEmployeeLibrary';
import ScheduledTasks from './ScheduledTasks';
import DigitalEmployeeProfile from './DigitalEmployeeProfile';
import SecurityCenter from './SecurityCenter';
import ApprovalCenter from './ApprovalCenter';
import { DigitalEmployeePanel } from './Frontend';

// ── 页面 key ──────────────────────────────────────────────
type PageKey = 'frontend' | 'workbench' | 'library' | 'scheduled' | 'security' | 'approval';

// ── 导航模式 ──────────────────────────────────────────────
type NavMode = 'sidebar' | 'topbar';

// ── 菜单项定义 ────────────────────────────────────────────
interface NavItem {
  key: PageKey;
  label: string;
  icon: React.ReactNode;
  desc: string;
  group?: string;   // 分组标题（仅侧边栏展开时显示）
}

const NAV_ITEMS: NavItem[] = [
  { key: 'frontend',  label: '数字员工工作台', icon: <TeamOutlined />,              desc: '前台交互与任务对话' },
  { key: 'scheduled', label: '触发任务',       icon: <ThunderboltOutlined />,       desc: '定时触发与事件触发' },
  { key: 'workbench', label: '数字员工驾驶舱', icon: <DashboardOutlined />,         desc: '数据看板与运营分析', group: '运营' },
  { key: 'library',   label: '数字员工工厂',   icon: <AppstoreOutlined />,          desc: '员工全生命周期管理' },
  { key: 'security',  label: '管控中心',       icon: <SafetyCertificateOutlined />, desc: '监控·风控·审计',   group: '安全' },
  { key: 'approval',  label: '审批中心',       icon: <CheckCircleOutlined />,       desc: '员工上岗审批' },
];

// ── hash 映射 ─────────────────────────────────────────────
const HASH_MAP: Record<string, PageKey> = {
  'digital-employee':           'frontend',
  'digital-employee-frontend':  'frontend',
  'digital-employee-workbench': 'workbench',
  'digital-employee-library':   'library',
  'digital-employee-security':  'security',
  'digital-employee-approval':  'approval',
  'scheduled-tasks':            'scheduled',
  'trigger-tasks':              'scheduled',
};

const PAGE_HASH: Record<PageKey, string> = {
  frontend:  'digital-employee',
  workbench: 'digital-employee-workbench',
  library:   'digital-employee-library',
  security:  'digital-employee-security',
  approval:  'digital-employee-approval',
  scheduled: 'trigger-tasks',
};


// ── 侧边栏尺寸 ────────────────────────────────────────────
const SIDEBAR_EXPANDED = 200;
const SIDEBAR_COLLAPSED = 56;


// ── 主题色 ────────────────────────────────────────────────
const PRIMARY = '#6366F1';
const PRIMARY_LIGHT = '#EEF2FF';

interface DigitalEmployeeHubProps {
  initialTab?: PageKey | 'workbench' | 'library' | 'domain' | 'scheduled' | 'profile' | 'process';
  onBackToAdmin?: () => void;
}

const DigitalEmployeeHub: React.FC<DigitalEmployeeHubProps> = ({ initialTab, onBackToAdmin }) => {
  const getInitialPage = (): PageKey => {
    if (initialTab && ['frontend','workbench','library','scheduled','security','approval'].includes(initialTab as string))
      return initialTab as PageKey;
    const hash = window.location.hash.slice(1);
    return HASH_MAP[hash] ?? 'frontend';
  };

  const [page, setPage]         = useState<PageKey>(getInitialPage());
  const [navMode, setNavMode]   = useState<NavMode>('sidebar');   // 默认左侧菜单栏
  const [collapsed, setCollapsed] = useState(false);               // 侧边栏折叠

  // 同步 hash
  useEffect(() => {
    const sync = () => {
      const hash = window.location.hash.slice(1);
      const next = HASH_MAP[hash];
      if (next) setPage(next);
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const handleNav = (key: PageKey) => {
    setPage(key);
    window.location.hash = PAGE_HASH[key];
  };

  const sidebarW = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  // ── 活动项信息 ────────────────────────────────────────
  const activeItem = NAV_ITEMS.find(n => n.key === page)!;

  // ── 内容区 ────────────────────────────────────────────
  const renderContent = () => {
    // 数字员工工作台：flex 撑满，不额外加 padding
    if (page === 'frontend') {
      return (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
          <DigitalEmployeePanel />
        </div>
      );
    }
    return (
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {page === 'workbench'  && <div style={{ padding: 24 }}><DigitalEmployeeWorkbench /></div>}
        {page === 'library'    && <div style={{ padding: 24 }}><DigitalEmployeeLibrary /></div>}
        {page === 'security'   && <div style={{ padding: 24 }}><SecurityCenter /></div>}
        {page === 'approval'   && <div style={{ padding: 24 }}><ApprovalCenter /></div>}
        {page === 'scheduled'  && <ScheduledTasks />}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════
  //  模式 A：左侧菜单栏（sidebar）
  // ════════════════════════════════════════════════════════
  if (navMode === 'sidebar') {
    return (
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f5f6fa' }}>

        {/* ── 左侧菜单 ── */}
        <div style={{
          width: sidebarW,
          flexShrink: 0,
          background: '#fff',
          borderRight: '1px solid #e8e8f0',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.22s cubic-bezier(.4,0,.2,1)',
          overflow: 'hidden',
          boxShadow: '2px 0 8px rgba(99,102,241,0.06)',
          zIndex: 10,
        }}>

          {/* Logo 区 */}
          <div style={{
            height: 56,
            display: 'flex',
            alignItems: 'center',
            padding: collapsed ? '0' : '0 14px',
            justifyContent: collapsed ? 'center' : 'space-between',
            borderBottom: '1px solid #f0f0f8',
            flexShrink: 0,
          }}>
            {!collapsed && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, overflow: 'hidden' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <TeamOutlined style={{ color: '#fff', fontSize: 14 }} />
                </div>
                <div style={{ lineHeight: 1.25, overflow: 'hidden' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', whiteSpace: 'nowrap' }}>数字员工</div>
                  <div style={{ fontSize: 10, color: '#aaa', whiteSpace: 'nowrap' }}>企业 AI 员工管理中心</div>
                </div>
              </div>
            )}
            {/* 折叠按钮 */}
            <div
              onClick={() => setCollapsed(c => !c)}
              style={{
                width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#aaa', fontSize: 14,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f5f4ff'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </div>
          </div>

          {/* 返回按钮 */}
          {onBackToAdmin && (
            <div style={{ padding: collapsed ? '8px 0' : '8px 10px', borderBottom: '1px solid #f5f5f5', flexShrink: 0 }}>
              <Tooltip title={collapsed ? '返回' : ''} placement="right">
                <div
                  onClick={onBackToAdmin}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                    borderRadius: 8, cursor: 'pointer', color: '#888', fontSize: 12,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f5f5f5'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                >
                  <ArrowLeftOutlined style={{ fontSize: 13 }} />
                  {!collapsed && <span>返回主台</span>}
                </div>
              </Tooltip>
            </div>
          )}

          {/* 菜单列表 */}
          <div style={{ flex: 1, padding: collapsed ? '8px 0' : '8px 8px', overflowY: 'auto' }}>
            {NAV_ITEMS.map((item, idx) => {
              const active = page === item.key;
              // 分组标题（不折叠时、是分组首项时显示）
              const showGroup = !collapsed && item.group &&
                (idx === 0 || NAV_ITEMS[idx - 1].group !== item.group);
              return (
                <div key={item.key}>
                  {showGroup && (
                    <div style={{
                      fontSize: 10, fontWeight: 600, color: '#bbb', letterSpacing: 1,
                      padding: idx === 0 ? '6px 10px 4px' : '14px 10px 4px',
                      textTransform: 'uppercase',
                    }}>
                      {item.group}
                    </div>
                  )}
                  <Tooltip title={collapsed ? item.label : ''} placement="right">
                    <div
                      onClick={() => handleNav(item.key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: collapsed ? '10px 0' : '9px 10px',
                        borderRadius: 9,
                        cursor: 'pointer',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        background: active ? PRIMARY_LIGHT : 'transparent',
                        transition: 'all 0.15s',
                        marginBottom: 2,
                        position: 'relative',
                      }}
                      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = '#f5f4ff'; }}
                      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                    >
                      {/* 活动指示条 */}
                      {active && (
                        <div style={{
                          position: 'absolute', left: 0, top: '20%', bottom: '20%',
                          width: 3, borderRadius: 2,
                          background: 'linear-gradient(180deg, #6366F1, #8B5CF6)',
                        }} />
                      )}
                      <span style={{
                        fontSize: 16,
                        color: active ? PRIMARY : '#888',
                        flexShrink: 0,
                        transition: 'color 0.15s',
                      }}>
                        {item.icon}
                      </span>
                      {!collapsed && (
                        <div style={{ overflow: 'hidden', flex: 1 }}>
                          <div style={{
                            fontSize: 13, fontWeight: active ? 600 : 400,
                            color: active ? PRIMARY : '#333',
                            whiteSpace: 'nowrap', lineHeight: 1.3,
                          }}>
                            {item.label}
                          </div>
                          <div style={{
                            fontSize: 10, color: active ? `${PRIMARY}90` : '#bbb',
                            whiteSpace: 'nowrap', lineHeight: 1.3,
                          }}>
                            {item.desc}
                          </div>
                        </div>
                      )}
                    </div>
                  </Tooltip>
                </div>
              );
            })}
          </div>

          {/* 底部：切换模式 */}
          {!collapsed && (
            <div style={{ padding: '10px 8px', borderTop: '1px solid #f0f0f8', flexShrink: 0 }}>
              <div
                onClick={() => setNavMode('topbar')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                  borderRadius: 8, cursor: 'pointer', color: '#aaa', fontSize: 11,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f5f5f5'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
              >
                <BarsOutlined style={{ fontSize: 13 }} />
                切换为顶部标签栏
              </div>
            </div>
          )}
          {collapsed && (
            <div style={{ padding: '10px 0', borderTop: '1px solid #f0f0f8', flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
              <Tooltip title="切换为顶部标签栏" placement="right">
                <div
                  onClick={() => setNavMode('topbar')}
                  style={{
                    width: 30, height: 30, borderRadius: 7,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#bbb', fontSize: 14,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f5f5f5'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                >
                  <BarsOutlined />
                </div>
              </Tooltip>
            </div>
          )}
        </div>

        {/* ── 右侧内容 ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {renderContent()}
        </div>

      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  //  模式 B：顶部标签栏（topbar）
  // ════════════════════════════════════════════════════════
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#f5f6fa' }}>

      {/* ── 顶部导航栏 ── */}
      <div style={{
        height: 56,
        background: '#fff',
        borderBottom: '1px solid #e8e8f0',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        flexShrink: 0,
        boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
        gap: 0,
      }}>
        {/* 品牌 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginRight: 28, flexShrink: 0 }}>
          {onBackToAdmin && (
            <>
              <div
                onClick={onBackToAdmin}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 7, cursor: 'pointer',
                  fontSize: 12, color: '#888', transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f5f5f5'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
              >
                <ArrowLeftOutlined style={{ fontSize: 12 }} /> 返回
              </div>
              <div style={{ width: 1, height: 16, background: '#e8e8e8', marginRight: 8 }} />
            </>
          )}
          <div style={{
            width: 26, height: 26, borderRadius: 7,
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <TeamOutlined style={{ color: '#fff', fontSize: 13 }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.2 }}>数字员工</div>
            <div style={{ fontSize: 10, color: '#bbb', lineHeight: 1.2 }}>企业 AI 员工管理中心</div>
          </div>
        </div>

        {/* Tab 列表 */}
        <div style={{ display: 'flex', alignItems: 'center', height: '100%', gap: 2, flex: 1 }}>
          {NAV_ITEMS.map(item => {
            const active = page === item.key;
            return (
              <div
                key={item.key}
                onClick={() => handleNav(item.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '0 16px', height: '100%',
                  cursor: 'pointer', position: 'relative',
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  color: active ? PRIMARY : '#666',
                  transition: 'color 0.15s',
                }}
              >
                <span style={{ fontSize: 14 }}>{item.icon}</span>
                {item.label}
                {active && (
                  <div style={{
                    position: 'absolute', bottom: 0, left: 16, right: 16,
                    height: 2.5,
                    background: 'linear-gradient(90deg, #6366F1, #8B5CF6)',
                    borderRadius: '2px 2px 0 0',
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {/* 右侧：切换模式 */}
        <div
          onClick={() => setNavMode('sidebar')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
            fontSize: 12, color: '#888', border: '1px solid #e8e8e8',
            transition: 'all 0.15s', flexShrink: 0,
          }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.background = PRIMARY_LIGHT; el.style.borderColor = PRIMARY; el.style.color = PRIMARY; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.background = 'transparent'; el.style.borderColor = '#e8e8e8'; el.style.color = '#888'; }}
        >
          <MenuOutlined style={{ fontSize: 12 }} />
          侧边栏
        </div>
      </div>

      {/* ── 内容区 ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        {renderContent()}
      </div>

    </div>
  );
};

export default DigitalEmployeeHub;
