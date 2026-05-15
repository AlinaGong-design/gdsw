/**
 * Agent设置抽屉组件
 *
 * 根据UI设计实现的简洁版配置抽屉
 */

import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Slider,
  Select,
  Space,
  Tooltip,
} from 'antd';
import {
  QuestionCircleOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import type {
  AgentMode,
  ModeConfigFormData,
  AgentConfiguration,
} from '../types/agent-config.types';
import {
  MODE_METADATA,
  MAX_ITERATION_CONFIG,
} from '../config/agent-mode-config';
import './AgentSettingsDrawer.css';

const { Option } = Select;

interface AgentSettingsDrawerProps {
  visible: boolean;
  initialConfig?: AgentConfiguration;
  onClose: () => void;
  onChange?: (config: ModeConfigFormData) => void;
}

export const AgentSettingsDrawer: React.FC<AgentSettingsDrawerProps> = ({
  visible,
  initialConfig,
  onClose,
  onChange,
}) => {
  const [selectedMode, setSelectedMode] = useState<AgentMode>('function_call');
  const [maxIterationTimes, setMaxIterationTimes] = useState<number>(
    MAX_ITERATION_CONFIG.DEFAULT
  );

  // 初始化配置
  useEffect(() => {
    if (visible && initialConfig) {
      setSelectedMode(initialConfig.mode);
      if (initialConfig.mode === 'function_call') {
        setMaxIterationTimes(initialConfig.config.max_iteration_times);
      }
    } else if (visible) {
      // 默认值
      setSelectedMode('function_call');
      setMaxIterationTimes(MAX_ITERATION_CONFIG.DEFAULT);
    }
  }, [visible, initialConfig]);

  // 处理模式切换
  const handleModeChange = (mode: AgentMode) => {
    setSelectedMode(mode);

    // 实时回调配置变化
    if (onChange) {
      if (mode === 'react') {
        onChange({
          mode: 'react',
          skills: [],
        });
      } else {
        onChange({
          mode: 'function_call',
          max_iteration_times: maxIterationTimes,
        });
      }
    }
  };

  // 处理最大迭代次数变化
  const handleMaxIterationChange = (value: number) => {
    setMaxIterationTimes(value);

    // 实时回调配置变化
    if (onChange && selectedMode === 'function_call') {
      onChange({
        mode: 'function_call',
        max_iteration_times: value,
      });
    }
  };

  return (
    <Drawer
      title={
        <div className="agent-settings-drawer-header">
          <span className="drawer-title">Agent 设置</span>
        </div>
      }
      placement="right"
      width={600}
      open={visible}
      onClose={onClose}
      closeIcon={<CloseOutlined style={{ fontSize: 16 }} />}
      className="agent-settings-drawer"
      footer={null}
      styles={{
        header: {
          borderBottom: '1px solid #f0f0f0',
          padding: '20px 24px',
        },
        body: {
          padding: '24px',
          background: '#fafafa',
        },
      }}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {/* Agent Mode 配置项 */}
        <div className="settings-card">
          <div className="settings-card-content">
            <div className="settings-label">
              <Space size={12}>
                <div className="settings-icon" style={{ background: '#E6F0FF' }}>
                  <span style={{ fontSize: 20 }}>🤖</span>
                </div>
                <span className="settings-title">Agent Mode</span>
                <Tooltip title="选择智能体的运行模式">
                  <QuestionCircleOutlined style={{ color: '#bfbfbf', fontSize: 14 }} />
                </Tooltip>
              </Space>
            </div>
            <div className="settings-control">
              <Select
                value={selectedMode}
                onChange={handleModeChange}
                style={{ width: 200 }}
                bordered={false}
                suffixIcon={null}
                className="mode-select"
              >
                <Option value="react">
                  <Space>
                    <span>{MODE_METADATA.react.icon}</span>
                    <span>React</span>
                  </Space>
                </Option>
                <Option value="function_call">
                  <Space>
                    <span>{MODE_METADATA.function_call.icon}</span>
                    <span>Function Calling</span>
                  </Space>
                </Option>
              </Select>
            </div>
          </div>
        </div>

        {/* 最大迭代次数配置项 - 仅在Function Call模式下显示 */}
        {selectedMode === 'function_call' && (
          <div className="settings-card">
            <div className="settings-card-content">
              <div className="settings-label">
                <Space size={12}>
                  <div className="settings-icon" style={{ background: '#FFF4E6' }}>
                    <span style={{ fontSize: 20 }}>🔄</span>
                  </div>
                  <span className="settings-title">最大迭代次数</span>
                  <Tooltip title={MAX_ITERATION_CONFIG.DESCRIPTION}>
                    <QuestionCircleOutlined style={{ color: '#bfbfbf', fontSize: 14 }} />
                  </Tooltip>
                </Space>
              </div>
              <div className="settings-control-slider">
                <Slider
                  value={maxIterationTimes}
                  onChange={handleMaxIterationChange}
                  min={MAX_ITERATION_CONFIG.MIN}
                  max={MAX_ITERATION_CONFIG.MAX}
                  style={{ flex: 1, marginRight: 24 }}
                  tooltip={{
                    formatter: (value) => `${value}次`,
                  }}
                />
                <div className="slider-value">{maxIterationTimes}</div>
              </div>
            </div>
          </div>
        )}

        {/* React模式说明 */}
        {selectedMode === 'react' && (
          <div className="settings-info-card">
            <div className="info-icon">💬</div>
            <div className="info-content">
              <div className="info-title">对话交互模式</div>
              <div className="info-description">
                该模式下智能体将以对话形式与用户交互，可以配置Skills技能来增强能力。
              </div>
            </div>
          </div>
        )}

        {/* Function Call模式说明 */}
        {selectedMode === 'function_call' && (
          <div className="settings-info-card">
            <div className="info-icon">⚙️</div>
            <div className="info-content">
              <div className="info-title">函数调用模式</div>
              <div className="info-description">
                该模式下智能体将通过函数调用来执行任务，最大迭代次数控制"思考-调用函数"的循环次数上限。
              </div>
            </div>
          </div>
        )}
      </Space>
    </Drawer>
  );
};
