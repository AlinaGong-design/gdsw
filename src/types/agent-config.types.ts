/**
 * Dify智能体模式配置类型定义
 *
 * 本文件定义了Dify智能体的React模式和Function Call模式的完整类型系统
 * 符合Dify产品设计规范
 */

/**
 * 智能体运行模式
 * - react: React模式（对话交互模式），用于自然语言人机对话
 * - function_call: Function Call模式（函数调用模式），用于系统间自动化函数/API调用
 */
export type AgentMode = 'react' | 'function_call';

/**
 * React模式专属配置
 */
export interface ReactModeConfig {
  /**
   * 技能列表
   * 存储已关联的技能ID或名称
   * React模式下智能体可以调用配置的技能
   */
  skills: string[];
}

/**
 * Function Call模式专属配置
 */
export interface FunctionCallModeConfig {
  /**
   * 最大迭代次数
   *
   * 控制FC模式下智能体「思考-调用函数」的循环次数上限
   * 防止资源过度消耗
   *
   * @minimum 1
   * @maximum 20
   * @default 10
   */
  max_iteration_times: number;

  /**
   * Skills字段在FC模式下不可用
   * 设置为undefined或空数组
   */
  skills?: never;
}

/**
 * 智能体模式配置（联合类型）
 *
 * 根据mode字段的不同，自动推断可用的配置字段
 */
export type AgentModeConfig =
  | {
      mode: 'react';
      config: ReactModeConfig;
    }
  | {
      mode: 'function_call';
      config: FunctionCallModeConfig;
    };

/**
 * 完整的智能体配置（React模式）
 */
export interface ReactAgentConfiguration {
  /**
   * 智能体ID
   */
  agent_id: string;

  /**
   * 智能体名称
   */
  agent_name: string;

  /**
   * 智能体描述
   */
  description?: string;

  /**
   * 运行模式
   */
  mode: 'react';

  /**
   * React模式配置
   */
  config: ReactModeConfig;

  /**
   * 创建时间
   */
  created_at: string;

  /**
   * 更新时间
   */
  updated_at: string;
}

/**
 * 完整的智能体配置（Function Call模式）
 */
export interface FunctionCallAgentConfiguration {
  /**
   * 智能体ID
   */
  agent_id: string;

  /**
   * 智能体名称
   */
  agent_name: string;

  /**
   * 智能体描述
   */
  description?: string;

  /**
   * 运行模式
   */
  mode: 'function_call';

  /**
   * Function Call模式配置
   */
  config: FunctionCallModeConfig;

  /**
   * 创建时间
   */
  created_at: string;

  /**
   * 更新时间
   */
  updated_at: string;
}

/**
 * 完整的智能体配置（联合类型）
 */
export type AgentConfiguration = ReactAgentConfiguration | FunctionCallAgentConfiguration;

/**
 * 模式元数据（用于UI展示）
 */
export interface ModeMetadata {
  mode: AgentMode;
  label: string;
  description: string;
  icon: string;
  supportSkills: boolean;
}

/**
 * 模式配置表单数据
 */
export interface ModeConfigFormData {
  mode: AgentMode;
  skills?: string[];
  max_iteration_times?: number;
}

/**
 * 创建智能体时的表单数据（包含基础信息）
 */
export interface AgentCreateFormData extends ModeConfigFormData {
  agent_name: string;
  description?: string;
}

/**
 * 配置验证错误
 */
export interface ConfigValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * 配置验证结果
 */
export interface ConfigValidationResult {
  valid: boolean;
  errors: ConfigValidationError[];
}

/**
 * 模式切换事件
 */
export interface ModeChangeEvent {
  previousMode: AgentMode;
  newMode: AgentMode;
  timestamp: number;
}
