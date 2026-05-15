/**
 * AgentModeConfigModal 使用示例
 *
 * 展示如何在自主规划智能体配置页面中集成模式配置弹窗
 */

import React, { useState } from 'react';
import { Button, message, Card, Space, Tag, Descriptions } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { AgentModeConfigModal } from '../components/AgentModeConfigModal';
import {
  ModeConfigFormData,
  AgentConfiguration,
  ReactAgentConfiguration,
  FunctionCallAgentConfiguration,
} from '../types/agent-config.types';

/**
 * 示例页面组件
 */
export const AgentConfigUsageExample: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<AgentConfiguration | undefined>();

  // 模拟可用的技能列表
  const availableSkills = [
    { id: 'skill_001', name: '数据查询' },
    { id: 'skill_002', name: '报表生成' },
    { id: 'skill_003', name: '知识库问答' },
    { id: 'skill_004', name: '天气查询' },
    { id: 'skill_005', name: '订单查询' },
  ];

  // 处理配置保存
  const handleSaveConfig = (formData: ModeConfigFormData) => {
    console.log('收到配置数据:', formData);

    // 构建完整的配置对象
    let newConfig: AgentConfiguration;

    if (formData.mode === 'react') {
      newConfig = {
        agent_id: currentConfig?.agent_id || generateId(),
        agent_name: currentConfig?.agent_name || '新建智能体',
        description: currentConfig?.description,
        mode: 'react',
        config: {
          skills: formData.skills || [],
        },
        created_at: currentConfig?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as ReactAgentConfiguration;
    } else {
      newConfig = {
        agent_id: currentConfig?.agent_id || generateId(),
        agent_name: currentConfig?.agent_name || '新建智能体',
        description: currentConfig?.description,
        mode: 'function_call',
        config: {
          max_iteration_times: formData.max_iteration_times || 10,
        },
        created_at: currentConfig?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as FunctionCallAgentConfiguration;
    }

    // 保存配置
    setCurrentConfig(newConfig);
    setModalVisible(false);

    // 这里可以调用API保存到后端
    // await saveAgentConfig(newConfig);

    message.success('配置保存成功');
  };

  // 打开配置弹窗
  const handleOpenConfig = () => {
    setModalVisible(true);
  };

  // 取消配置
  const handleCancelConfig = () => {
    setModalVisible(false);
  };

  // 生成ID的辅助函数
  function generateId(): string {
    return `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card
          title="智能体模式配置示例"
          extra={
            <Button
              type="primary"
              icon={<SettingOutlined />}
              onClick={handleOpenConfig}
            >
              配置模式
            </Button>
          }
        >
          {currentConfig ? (
            <Descriptions bordered column={1}>
              <Descriptions.Item label="智能体ID">
                {currentConfig.agent_id}
              </Descriptions.Item>
              <Descriptions.Item label="智能体名称">
                {currentConfig.agent_name}
              </Descriptions.Item>
              <Descriptions.Item label="运行模式">
                <Tag color={currentConfig.mode === 'react' ? 'blue' : 'purple'}>
                  {currentConfig.mode === 'react'
                    ? '💬 对话交互模式'
                    : '⚙️ 函数调用模式'}
                </Tag>
              </Descriptions.Item>

              {currentConfig.mode === 'react' && (
                <Descriptions.Item label="配置的技能">
                  {currentConfig.config.skills.length > 0 ? (
                    <Space wrap>
                      {currentConfig.config.skills.map((skillId) => {
                        const skill = availableSkills.find((s) => s.id === skillId);
                        return (
                          <Tag key={skillId} color="green">
                            {skill?.name || skillId}
                          </Tag>
                        );
                      })}
                    </Space>
                  ) : (
                    <span style={{ color: '#999' }}>未配置技能</span>
                  )}
                </Descriptions.Item>
              )}

              {currentConfig.mode === 'function_call' && (
                <Descriptions.Item label="最大迭代次数">
                  <Tag color="orange">
                    {currentConfig.config.max_iteration_times} 次
                  </Tag>
                </Descriptions.Item>
              )}

              <Descriptions.Item label="创建时间">
                {new Date(currentConfig.created_at).toLocaleString('zh-CN')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {new Date(currentConfig.updated_at).toLocaleString('zh-CN')}
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              暂无配置，请点击右上角"配置模式"按钮进行配置
            </div>
          )}
        </Card>

        {/* 使用说明 */}
        <Card title="使用说明" size="small">
          <Space direction="vertical">
            <div>
              <strong>1. React模式（对话交互模式）</strong>
              <ul>
                <li>用于自然语言人机对话场景</li>
                <li>支持配置多个Skills技能</li>
                <li>智能体可以调用配置的技能来增强能力</li>
              </ul>
            </div>
            <div>
              <strong>2. Function Call模式（函数调用模式）</strong>
              <ul>
                <li>用于系统间自动化函数/API调用场景</li>
                <li>不支持Skills配置</li>
                <li>需要配置最大迭代次数（1-20），控制"思考-调用函数"的循环次数</li>
              </ul>
            </div>
          </Space>
        </Card>
      </Space>

      {/* 配置弹窗 */}
      <AgentModeConfigModal
        visible={modalVisible}
        initialConfig={currentConfig}
        availableSkills={availableSkills}
        onOk={handleSaveConfig}
        onCancel={handleCancelConfig}
      />
    </div>
  );
};

export default AgentConfigUsageExample;
