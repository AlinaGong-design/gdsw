/**
 * Dify智能体配置验证工具
 *
 * 提供完整的配置验证逻辑
 */

import {
  AgentMode,
  ModeConfigFormData,
  ConfigValidationResult,
  ConfigValidationError,
} from '../types/agent-config.types';
import {
  MAX_ITERATION_CONFIG,
  VALIDATION_MESSAGES,
} from '../config/agent-mode-config';

/**
 * 验证模式配置
 *
 * @param formData 表单数据
 * @returns 验证结果
 */
export function validateModeConfig(
  formData: ModeConfigFormData
): ConfigValidationResult {
  const errors: ConfigValidationError[] = [];

  // 验证mode字段
  if (!formData.mode) {
    errors.push({
      field: 'mode',
      message: VALIDATION_MESSAGES.MODE_REQUIRED,
      code: 'MODE_REQUIRED',
    });
    return { valid: false, errors };
  }

  if (!['react', 'function_call'].includes(formData.mode)) {
    errors.push({
      field: 'mode',
      message: VALIDATION_MESSAGES.MODE_INVALID,
      code: 'MODE_INVALID',
    });
    return { valid: false, errors };
  }

  // 根据不同模式进行验证
  if (formData.mode === 'react') {
    validateReactMode(formData, errors);
  } else if (formData.mode === 'function_call') {
    validateFunctionCallMode(formData, errors);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 验证React模式配置
 */
function validateReactMode(
  formData: ModeConfigFormData,
  errors: ConfigValidationError[]
): void {
  // 验证skills字段
  if (!formData.skills) {
    // 可选验证：如果你的业务要求React模式必须配置至少一个技能，取消下面的注释
    // errors.push({
    //   field: 'skills',
    //   message: VALIDATION_MESSAGES.SKILLS_REQUIRED_IN_REACT,
    //   code: 'SKILLS_REQUIRED',
    // });
  } else if (!Array.isArray(formData.skills)) {
    errors.push({
      field: 'skills',
      message: VALIDATION_MESSAGES.SKILLS_INVALID_FORMAT,
      code: 'SKILLS_INVALID_FORMAT',
    });
  }

  // React模式不应该有max_iteration_times
  if (formData.max_iteration_times !== undefined) {
    errors.push({
      field: 'max_iteration_times',
      message: VALIDATION_MESSAGES.MAX_ITERATION_NOT_ALLOWED_IN_REACT,
      code: 'MAX_ITERATION_NOT_ALLOWED',
    });
  }
}

/**
 * 验证Function Call模式配置
 */
function validateFunctionCallMode(
  formData: ModeConfigFormData,
  errors: ConfigValidationError[]
): void {
  // Function Call模式不应该有skills
  if (formData.skills && formData.skills.length > 0) {
    errors.push({
      field: 'skills',
      message: VALIDATION_MESSAGES.SKILLS_NOT_ALLOWED_IN_FC,
      code: 'SKILLS_NOT_ALLOWED',
    });
  }

  // 验证max_iteration_times
  if (formData.max_iteration_times === undefined) {
    errors.push({
      field: 'max_iteration_times',
      message: VALIDATION_MESSAGES.MAX_ITERATION_REQUIRED,
      code: 'MAX_ITERATION_REQUIRED',
    });
  } else {
    // 验证是否为整数
    if (!Number.isInteger(formData.max_iteration_times)) {
      errors.push({
        field: 'max_iteration_times',
        message: VALIDATION_MESSAGES.MAX_ITERATION_NOT_INTEGER,
        code: 'MAX_ITERATION_NOT_INTEGER',
      });
    }

    // 验证范围
    if (formData.max_iteration_times < MAX_ITERATION_CONFIG.MIN) {
      errors.push({
        field: 'max_iteration_times',
        message: VALIDATION_MESSAGES.MAX_ITERATION_TOO_LOW,
        code: 'MAX_ITERATION_TOO_LOW',
      });
    }

    if (formData.max_iteration_times > MAX_ITERATION_CONFIG.MAX) {
      errors.push({
        field: 'max_iteration_times',
        message: VALIDATION_MESSAGES.MAX_ITERATION_TOO_HIGH,
        code: 'MAX_ITERATION_TOO_HIGH',
      });
    }
  }
}

/**
 * 快速验证：检查模式是否支持技能配置
 */
export function canConfigureSkills(mode: AgentMode): boolean {
  return mode === 'react';
}

/**
 * 快速验证：检查模式是否需要配置最大迭代次数
 */
export function requiresMaxIterations(mode: AgentMode): boolean {
  return mode === 'function_call';
}
