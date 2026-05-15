import React, { useState, useEffect } from 'react';
import MainLayout from './components/MainLayout';
import Home from './pages/Home';
import Agent from './pages/Agent';
import AgentList from './pages/AgentList';
import AgentCollaborative from './pages/AgentCollaborative';
import Knowledge from './pages/Knowledge';
import Skill, { SkillItem } from './pages/Skill';
import SkillEditor from './pages/SkillEditor';
import Workflow from './pages/Workflow';
import MCP from './pages/MCP';
import API from './pages/API';
import Components from './pages/Components';
import Model from './pages/Model';
import { EvaluationTasks, EvaluationData, EvaluationRules } from './pages/Evaluation';
import Trace from './pages/Trace';
import EvaluatorEditor from './pages/EvaluatorEditor';
import System from './pages/System';
import Frontend from './pages/Frontend';
import Channels from './pages/Channels';
import OpenClawIM from './pages/OpenClaw';
import OpenClawDashboard from './pages/OpenClawDashboard';
import OpenClawInstances from './pages/OpenClawInstances';
import DigitalAvatar from './pages/DigitalAvatar';
import DigitalEmployee from './pages/DigitalEmployee';
import DigitalEmployeeHub from './pages/DigitalEmployeeHub';
import DigitalEmployeeH5 from './pages/DigitalEmployeeH5';
import ScheduledTasks from './pages/ScheduledTasks';
import DigitalEmployeeProfile from './pages/DigitalEmployeeProfile';
import UserProfile from './pages/UserProfile';
import './App.css';

type PageType =
  | 'home'
  | 'agent'
  | 'agent-list'
  | 'agent-editor'
  | 'knowledge'
  | 'skill'
  | 'skill-editor'
  | 'workflow'
  | 'mcp'
  | 'api'
  | 'components'
  | 'model'
  | 'evaluation'
  | 'evaluation-tasks'
  | 'evaluation-data'
  | 'evaluation-rules'
  | 'trace'
  | 'system'
  | 'frontend'
  | 'channels'
  | 'openclaw'
  | 'openclaw-instances'
  | 'openclaw-editor'
  | 'evaluator-editor'
  | 'digital-avatar'
  | 'digital-employee'
  | 'digital-employee-workbench'
  | 'digital-employee-library'
  | 'digital-employee-domain'
  | 'scheduled-tasks'
  | 'digital-employee-profile'
  | 'h5-chat'
  | 'profile';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null);
  const [editingSkillId, setEditingSkillId] = useState<string | undefined>(undefined);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [agentType, setAgentType] = useState<'autonomous' | 'collaborative'>('autonomous');
  const [editingAgentId, setEditingAgentId] = useState<string | undefined>(undefined);
  const [editingOpenClawId, setEditingOpenClawId] = useState<string | undefined>(undefined);
  const [openClawEditorMode, setOpenClawEditorMode] = useState<'create' | 'edit'>('create');
  const [evaluatorType, setEvaluatorType] = useState<'LLM' | 'Code'>('LLM');
  const [evaluatorEditorMode, setEvaluatorEditorMode] = useState<'create' | 'edit'>('create');
  const [editingEvaluatorId, setEditingEvaluatorId] = useState<string | undefined>(undefined);
  const [importFileName, setImportFileName] = useState<string>('');
  const [h5EmployeeId, setH5EmployeeId] = useState<string | undefined>(undefined);

  // 监听 hash 变化
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // 去掉 #
      if (hash) {
        const [path, params] = hash.split('?');

        // 解析路由
        if (path === 'frontend') {
          setCurrentPage('frontend');
        } else if (path === 'agent-list') {
          setCurrentPage('agent-list');
        } else if (path === 'agent-collaborative') {
          setCurrentPage('agent-editor');
        } else if (path === 'agent-editor') {
          const searchParams = new URLSearchParams(params);
          const type = searchParams.get('type') as 'autonomous' | 'collaborative' || 'autonomous';
          const agentId = searchParams.get('id') || undefined;

          setAgentType(type);
          setEditingAgentId(agentId);
          setCurrentPage('agent-editor');
        } else if (path === 'skill-editor') {
          const searchParams = new URLSearchParams(params);
          const mode = searchParams.get('mode') as 'create' | 'edit' || 'create';
          const skillId = searchParams.get('id') || undefined;

          setEditorMode(mode);
          setEditingSkillId(skillId);
          setCurrentPage('skill-editor');
        } else if (path === 'openclaw-editor') {
          const searchParams = new URLSearchParams(params);
          const mode = searchParams.get('mode') as 'create' | 'edit' || 'create';
          const instanceId = searchParams.get('id') || undefined;

          setOpenClawEditorMode(mode);
          setEditingOpenClawId(instanceId);
          setCurrentPage('openclaw-editor');
        } else if (path === 'evaluator-editor') {
          const searchParams = new URLSearchParams(params);
          const type = searchParams.get('type') as 'LLM' | 'Code' || 'LLM';
          const mode = searchParams.get('mode') as 'create' | 'edit' || 'create';
          const evaluatorId = searchParams.get('id') || undefined;

          setEvaluatorType(type);
          setEvaluatorEditorMode(mode);
          setEditingEvaluatorId(evaluatorId);
          setCurrentPage('evaluator-editor');
        } else if (path === 'h5-chat') {
          const searchParams = new URLSearchParams(params);
          const empId = searchParams.get('id') || undefined;
          setH5EmployeeId(empId);
          setCurrentPage('h5-chat');
        } else if (['home', 'agent', 'knowledge', 'skill', 'workflow', 'mcp', 'api', 'components', 'model', 'evaluation', 'evaluation-tasks', 'evaluation-data', 'evaluation-rules', 'trace', 'system', 'channels', 'openclaw', 'openclaw-instances', 'digital-avatar', 'digital-employee', 'digital-employee-workbench', 'digital-employee-library', 'digital-employee-domain', 'scheduled-tasks', 'digital-employee-profile', 'profile'].includes(path)) {
          setCurrentPage(path as PageType);
        }
      }
    };

    // 初始化
    handleHashChange();

    // 监听 hash 变化
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handlePageChange = (key: string) => {
    window.location.hash = key;
  };

  const handleFrontendClick = () => {
    window.location.hash = 'frontend';
  };

  const handleBackToAdmin = () => {
    window.location.hash = 'home';
  };

  const handlePreviewSkill = (skill: SkillItem) => {
    setSelectedSkill(skill);
    window.location.hash = 'frontend';
  };

  const handleCreateSkill = () => {
    setImportFileName('');
    window.location.hash = 'skill-editor?mode=create';
  };

  const handleImportSkill = (fileName: string) => {
    setImportFileName(fileName);
    window.location.hash = 'skill-editor?mode=create';
  };

  const handleEditSkill = (skillId: string) => {
    window.location.hash = `skill-editor?mode=edit&id=${skillId}`;
  };

  const handleBackToSkillList = () => {
    window.location.hash = 'skill';
  };

  const handleCreateOpenClawInstance = () => {
    window.location.hash = 'openclaw-editor?mode=create';
  };

  const handleEditOpenClawInstance = (instanceId: string) => {
    window.location.hash = `openclaw-editor?mode=edit&id=${instanceId}`;
  };

  const handleBackToOpenClawInstances = () => {
    window.location.hash = 'openclaw-instances';
  };

  const handleCreateEvaluator = (type: 'LLM' | 'Code') => {
    window.location.hash = `evaluator-editor?type=${type}&mode=create`;
  };

  const handleEditEvaluator = (evaluatorId: string, type: 'LLM' | 'Code') => {
    window.location.hash = `evaluator-editor?type=${type}&mode=edit&id=${evaluatorId}`;
  };

  const handleBackToEvaluationRules = () => {
    window.location.hash = 'evaluation-rules';
  };

  const handleTrySkill = (skillId: string, skillName: string, skillIcon: string) => {
    // 创建一个临时的SkillItem用于前台预览
    const tempSkill: SkillItem = {
      id: skillId,
      name: skillName,
      description: '正在体验的技能',
      icon: skillIcon,
      status: 'published',
      category: '内容创作',
      createTime: new Date().toISOString().split('T')[0],
      updateTime: new Date().toISOString().split('T')[0]
    };
    setSelectedSkill(tempSkill);
    window.location.hash = 'frontend';
  };

  // Agent相关的处理函数
  const handleCreateAgent = (type: 'rag' | 'autonomous' | 'collaborative') => {
    if (type === 'collaborative') {
      window.location.hash = `agent-collaborative`;
    } else {
      window.location.hash = `agent-editor?type=${type}`;
    }
  };

  const handleEditAgent = (agentId: string) => {
    window.location.hash = `agent-editor?type=autonomous&id=${agentId}`;
  };

  const handleDeleteAgent = (agentId: string) => {
    console.log('Delete agent:', agentId);
  };

  const handlePublishAgent = (agentId: string) => {
    console.log('Publish agent:', agentId);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home />;
      case 'agent':
        return (
          <AgentList
            onCreateAgent={handleCreateAgent}
            onEditAgent={handleEditAgent}
            onDeleteAgent={handleDeleteAgent}
            onPublishAgent={handlePublishAgent}
          />
        );
      case 'knowledge':
        return <Knowledge />;
      case 'skill':
        return (
          <Skill
            onPreviewSkill={handlePreviewSkill}
            onCreateSkill={handleCreateSkill}
            onEditSkill={handleEditSkill}
            onImportSkill={handleImportSkill}
          />
        );
      case 'workflow':
        return <Workflow />;
      case 'mcp':
        return <MCP />;
      case 'api':
        return <API />;
      case 'components':
        return <Components />;
      case 'model':
        return <Model />;
      case 'evaluation':
      case 'evaluation-tasks':
        return <EvaluationTasks />;
      case 'evaluation-data':
        return <EvaluationData />;
      case 'evaluation-rules':
        return (
          <EvaluationRules
            onCreateEvaluator={handleCreateEvaluator}
            onEditEvaluator={handleEditEvaluator}
          />
        );
      case 'trace':
        return <Trace />;
      case 'system':
        return <System />;
      case 'channels':
        return <Channels />;
      case 'digital-avatar':
        return <DigitalAvatar />;
      case 'digital-employee-workbench':
        return <DigitalEmployeeHub initialTab="workbench" />;
      case 'digital-employee-library':
        return <DigitalEmployeeHub initialTab="library" />;
      case 'digital-employee-domain':
        return <DigitalEmployeeHub initialTab="domain" />;
      case 'profile':
        return <UserProfile onBack={() => { window.location.hash = 'home'; }} />;
      case 'openclaw-instances':
        return (
          <OpenClawInstances
            onCreateInstance={handleCreateOpenClawInstance}
            onEditInstance={handleEditOpenClawInstance}
          />
        );
      case 'frontend':
        return <Frontend />;
      default:
        return <Home />;
    }
  };

  if (currentPage === 'h5-chat') {
    return <DigitalEmployeeH5 employeeId={h5EmployeeId} />;
  }

  if (currentPage === 'frontend') {
    return <Frontend onBackToAdmin={handleBackToAdmin} selectedSkill={selectedSkill} />;
  }

  if (currentPage === 'profile') {
    return (
      <MainLayout
        currentPage="home"
        onMenuClick={handlePageChange}
        onFrontendClick={handleFrontendClick}
        onOpenClawClick={() => { window.location.hash = 'openclaw'; }}
        profileTab={{ open: true, onClose: () => { window.location.hash = 'home'; } }}
      >
        <UserProfile onBack={() => { window.location.hash = 'home'; }} />
      </MainLayout>
    );
  }

  if (currentPage === 'openclaw') {
    return <OpenClawDashboard />;
  }

  if (currentPage === 'digital-employee' || currentPage === 'digital-employee-workbench' || currentPage === 'digital-employee-library' || currentPage === 'digital-employee-domain' || currentPage === 'scheduled-tasks' || currentPage === 'digital-employee-profile') {
    const tabMap: Record<string, 'frontend' | 'workbench' | 'library' | 'domain' | 'scheduled' | 'profile'> = {
      'digital-employee':          'frontend',
      'digital-employee-workbench':'workbench',
      'digital-employee-library':  'library',
      'digital-employee-domain':   'domain',
      'scheduled-tasks':           'scheduled',
      'digital-employee-profile':  'profile',
    };
    return (
      <DigitalEmployeeHub
        initialTab={tabMap[currentPage]}
        onBackToAdmin={() => { window.location.hash = 'frontend'; }}
      />
    );
  }

  if (currentPage === 'agent-editor') {
    // 判断是否是多智能体协同
    const hash = window.location.hash;
    if (hash.includes('agent-collaborative')) {
      return (
        <div style={{ height: '100vh', background: '#f5f5f5' }}>
          <AgentCollaborative />
        </div>
      );
    }

    return (
      <div style={{ height: '100vh', background: '#fff' }}>
        <Agent />
      </div>
    );
  }

  if (currentPage === 'skill-editor') {
    return (
      <div style={{ height: '100vh', background: '#fff' }}>
        <SkillEditor
          skillId={editingSkillId}
          mode={editorMode}
          importFileName={importFileName}
          onBack={handleBackToSkillList}
          onTrySkill={handleTrySkill}
          onImportSkill={handleImportSkill}
        />
      </div>
    );
  }

  if (currentPage === 'openclaw-editor') {
    return (
      <div style={{ height: '100vh', background: '#fff' }}>
        <SkillEditor
          skillId={editingOpenClawId}
          mode={openClawEditorMode}
          onBack={handleBackToOpenClawInstances}
          context="openclaw"
        />
      </div>
    );
  }

  if (currentPage === 'evaluator-editor') {
    return (
      <div style={{ height: '100vh', background: '#fff' }}>
        <EvaluatorEditor
          type={evaluatorType}
          mode={evaluatorEditorMode}
          evaluatorId={editingEvaluatorId}
          onBack={handleBackToEvaluationRules}
        />
      </div>
    );
  }

  return (
    <MainLayout
      currentPage={currentPage}
      onMenuClick={handlePageChange}
      onFrontendClick={handleFrontendClick}
      onOpenClawClick={() => { window.location.hash = 'openclaw'; }}
    >
      {renderPage()}
    </MainLayout>
  );
}

export default App;
