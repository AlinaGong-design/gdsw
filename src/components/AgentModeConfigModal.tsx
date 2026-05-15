/**
 * Dify智能体模式配置弹窗组件
 *
 * 用于在自主规划智能体配置页面中，点击配置时弹出的模式选择和配置弹窗
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Select,
  InputNumber,
  Alert,
  Space,
  Typography,
  Divider,
  Tag,
} from 'antd';
import {
  AgentMode,
  ModeConfigFormData,
  AgentConfiguration,
} from '../types/agent-config.types';
import {
  MODE_METADATA,
  MAX_ITERATION_CONFIG,
  DEFAULT_CONFIG,
} from '../config/agent-mode-config';
import { validateModeConfig } from '../utils/agent-config-validator';

const { Option } = Select;
const { Text } = Typography;

interface AgentModeConfigModalProps {
  visible: boolean;
  initialConfig?: AgentConfiguration;
  availableSkills?: Array<{ id: string; name: string }>;
  onOk: (config: ModeConfigFormData) => void;
  onCancel: () => void;
}

export const AgentModeConfigModal: React.FC<AgentModeConfigModalProps> = ({
  visible,
  initialConfig,
  availableSkills = [],
  onOk,
  onCancel,
}) => {
  const [form] = Form.useForm<ModeConfigFormData>();
  const [selectedMode, setSelectedMode] = useState<AgentMode>('react');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // 初始化表单
  useEffect(() => {
    if (visible && initialConfig) {
      setSelectedMode(initialConfig.mode);
      form.setFieldsValue({
        mode: initialConfig.mode,
        ...(initialConfig.mode === 'react' && {
          skills: initialConfig.config.skills,
        }),
        ...(initialConfig.mode === 'function_call' && {
          max_iteration_times: initialConfig.config.max_iteration_times,
        }),
      });
    } else if (visible) {
      // 使用默认配置
      form.setFieldsValue({
        mode: 'react',
        skills: [],
      });
    }
  }, [visible, initialConfig, form]);

  // 处理模式切换
  const handleModeChange = (mode: AgentMode) => {
    setSelectedMode(mode);
    setValidationErrors([]);

    // 根据模式切换，重置相关字段
    if (mode === 'react') {
      form.setFieldsValue({
        skills: [],
        max_iteration_times: undefined,
      });
    } else if (mode === 'function_call') {
      form.setFieldsValue({
        skills: undefined,
        max_iteration_times: MAX_ITERATION_CONFIG.DEFAULT,
      });
    }
  };

  // 处理表单提交
  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      // 执行自定义验证
      const validationResult = validateModeConfig(values);

      if (!validationResult.valid) {
        setValidationErrors(validationResult.errors.map(e => e.message));
        return;
      }

      setValidationErrors([]);
      onOk(values);
      form.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 处理取消
  const handleCancel = () => {
    form.resetFields();
    setValidationErrors([]);
    onCancel();
  };

  // 获取当前模式元数据
  const currentModeMetadata = MODE_METADATA[selectedMode];

  return (
    <Modal
      title="配置智能体运行模式"
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      width={600}
      okText="确定"
      cancelText="取消"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ mode: 'react' }}
      >
        {/* 模式��择 */}
        <Form.Item
          label="运行模式"
          name="mode"
          rules={[{ required: true, message: '请选择智能体运行模式' }]}
        >
          <Select
            placeholder="请选择模式"
            onChange={handleModeChange}
            size="large"
          >
            {Object.values(MODE_METADATA).map((metadata) => (
              <Option key={metadata.mode} value={metadata.mode}>
                <Space>
                  <span>{metadata.icon}</span>
                  <span>{metadata.label}</span>
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* 模式说明 */}
        <Alert
          message={currentModeMetadata.label}
          description={currentModeMetadata.description}
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Divider />

        {/* React模式配置 */}
        {selectedMode === 'react' && (
          <>
            <Form.Item
              label={
                <Space>
                  <Text>Skills技能配置</Text>
                  <Tag color="blue">React模式专属</Tag>
                </Space>
              }
              name="skills"
              help="选择智能体可以使用的技能"
            >
              <Select
                mode="multiple"
                placeholder="请选择技能"
                allowClear
                showSearch
                filterOption={(input, option) => {
                  if (!option) return false;
                  const label = String(option.children || '');
                  return label.toLowerCase().includes(input.toLowerCase());
                }}
              >
                {availableSkills.map((skill) => (
                  <Option key={skill.id} value={skill.id}>
                    {skill.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </>
        )}

        {/* Function Call模式配置 */}
        {selectedMode === 'function_call' && (
          <>
            <Form.Item
              label={
                <Space>
                  <Text>{MAX_ITERATION_CONFIG.LABEL}</Text>
                  <Tag color="purple">Function Call模式专属</Tag>
                </Space>
              }
              name="max_iteration_times"
              rules={[
                { required: true, message: '请输入最大迭代次数' },
                {
                  type: 'number',
                  min: MAX_ITERATION_CONFIG.MIN,
                  max: MAX_ITERATION_CONFIG.MAX,
                  message: `请输入${MAX_ITERATION_CONFIG.MIN}-${MAX_ITERATION_CONFIG.MAX}之间的整数`,
                },
              ]}
              help={MAX_ITERATION_CONFIG.DESCRIPTION}
            >
              <InputNumber
                min={MAX_ITERATION_CONFIG.MIN}
                max={MAX_ITERATION_CONFIG.MAX}
                step={1}
                style={{ width: '100%' }}
                placeholder={`默认值: ${MAX_ITERATION_CONFIG.DEFAULT}`}
              />
            </Form.Item>

            <Alert
              message="提示"
              description={MAX_ITERATION_CONFIG.HINT}
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />

            {/* Skills禁用提示 */}
            <Alert
              message="该模式不支持配置技能"
              description="Function Call模式专注于函数/API调用，不支持Skills配置"
              type="info"
              showIcon
            />
          </>
        )}

        {/* 验证错误提示 */}
        {validationErrors.length > 0 && (
          <Alert
            message="配置验证失败"
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            }
            type="error"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Form>
    </Modal>
  );
};
