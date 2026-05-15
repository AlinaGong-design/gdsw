/**
 * Dify智能体模式配置常量
 *
 * 定义了React模式和Function Call模式的元数据和默认配置
 */

import { ModeMetadata, AgentMode } from '../types/agent-config.types';

/**
 * 模式元数据映射
 */
export const MODE_METADATA: Record<AgentMode, ModeMetadata> = {
  react: {
    mode: 'react',
    label: '对话交互模式',
    description: '核心用于自然语言人机对话，智能体可以使用配置的Skills技能',
    icon: '💬',
    supportSkills: true,
  },
  function_call: {
    mode: 'function_call',
    label: '函数调用模式',
    description: '核心用于系统间自动化函数/API调用，不支持Skills配置',
    icon: '⚙️',
    supportSkills: false,
  },
};

/**
 * Function Call模式 - 最大迭代次数配置
 */
export const MAX_ITERATION_CONFIG = {
  /**
   * 默认值
   */
  DEFAULT: 10,

  /**
   * 最小值
   */
  MIN: 1,

  /**
   * 最大值
   */
  MAX: 20,

  /**
   * 标签
   */
  LABEL: '最大迭代次数',

  /**
   * 描述
   */
  DESCRIPTION: '控制智能体「思考-调用函数」的循环次数上限，防止资源过度消耗',

  /**
   * 提示信息
   */
  HINT: '建议设置在5-15之间，过低可能导致任务未完成，过高可能消耗过多资源',
} as const;

/**
 * 验证错误消息
 */
export const VALIDATION_MESSAGES = {
  // Skills相关
  SKILLS_NOT_ALLOWED_IN_FC: '函数调用模式不支持配置技能',
  SKILLS_REQUIRED_IN_REACT: 'React模式需要至少配置一个技能',
  SKILLS_INVALID_FORMAT: '技能配置格式错误，应为字符串数组',

  // max_iteration_times相关
  MAX_ITERATION_REQUIRED: '函数调用模式需要配置最大迭代次数',
  MAX_ITERATION_TOO_LOW: `最大迭代次数不能小于 ${MAX_ITERATION_CONFIG.MIN}`,
  MAX_ITERATION_TOO_HIGH: `最大迭代次数不能大于 ${MAX_ITERATION_CONFIG.MAX}`,
  MAX_ITERATION_NOT_INTEGER: '最大迭代次数必须是整数',
  MAX_ITERATION_NOT_ALLOWED_IN_REACT: 'React模式不支持配置最大迭代次数',

  // 通用
  MODE_REQUIRED: '请选择智能体运行模式',
  MODE_INVALID: '无效的智能体运行模式',
} as const;

/**
 * 默认配置
 */
export const DEFAULT_CONFIG = {
  react: {
    mode: 'react' as const,
    config: {
      skills: [],
    },
  },
  function_call: {
    mode: 'function_call' as const,
    config: {
      max_iteration_times: MAX_ITERATION_CONFIG.DEFAULT,
    },
  },
} as const;
