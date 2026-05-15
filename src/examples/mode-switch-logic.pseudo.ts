/**
 * 模式切换逻辑伪代码
 *
 * 演示前端下拉框切换模式时，如何控制Skills和最大迭代次数配置项的显示/隐藏
 *
 * 注意：这是伪代码示例，不会被实际编译执行
 */

// 导入类型（使示例文件成为模块）
import type { AgentConfiguration, ModeConfigFormData, AgentCreateFormData } from '../types/agent-config.types';
import { MAX_ITERATION_CONFIG } from '../config/agent-mode-config';

// 声明全局变量和函数（伪代码中使用）
declare const form: any;
declare const notification: any;
declare const alertComponent: any;
declare const api: any;
declare function generateId(): string;

// ============================================================================
// 场景1: 初始化表单
// ============================================================================

export function initializeForm(initialConfig?: AgentConfiguration) {
  if (initialConfig) {
    // 从现有配置初始化
    if (initialConfig.mode === 'react') {
      // React模式：显示Skills配置，隐藏最大迭代次数
      showField('skills');
      hideField('max_iteration_times');
      setFieldValue('skills', initialConfig.config.skills);
    } else if (initialConfig.mode === 'function_call') {
      // Function Call模式：隐藏Skills配置，显示最大迭代次数
      hideField('skills');
      showField('max_iteration_times');
      setFieldValue('max_iteration_times', initialConfig.config.max_iteration_times);
    }
  } else {
    // 新建配置：默认使用React模式
    setFieldValue('mode', 'react');
    showField('skills');
    hideField('max_iteration_times');
    setFieldValue('skills', []);
  }
}

// ============================================================================
// 场景2: 用户切换模式（从React切换到Function Call）
// ============================================================================

export function onModeChange_ReactToFunctionCall() {
  // 1. 隐藏Skills配置区域
  hideField('skills');
  disableField('skills');

  // 2. 清空Skills数据（防止脏数据）
  setFieldValue('skills', undefined);

  // 3. 显示最大迭代次数配置区域
  showField('max_iteration_times');
  enableField('max_iteration_times');

  // 4. 设置默认值
  setFieldValue('max_iteration_times', MAX_ITERATION_CONFIG.DEFAULT); // 10

  // 5. 显示提示信息
  showAlert({
    type: 'info',
    message: '该模式不支持配置技能',
    description: 'Function Call模式专注于函数/API调用，不支持Skills配置',
  });

  // 6. 清除之前的验证错误
  clearValidationErrors(['skills']);
}

// ============================================================================
// 场景3: 用户切换模式（从Function Call切换到React）
// ============================================================================

export function onModeChange_FunctionCallToReact() {
  // 1. 显示Skills配置区域
  showField('skills');
  enableField('skills');

  // 2. 设置默认值（空数组）
  setFieldValue('skills', []);

  // 3. 隐藏最大迭代次数配置区域
  hideField('max_iteration_times');
  disableField('max_iteration_times');

  // 4. 清空最大迭代次数数据（防止脏数据）
  setFieldValue('max_iteration_times', undefined);

  // 5. 隐藏提示信息
  hideAlert();

  // 6. 清除之前的验证错误
  clearValidationErrors(['max_iteration_times']);
}

// ============================================================================
// 场景4: 表单提交前验证
// ============================================================================

export function onSubmit(formData: ModeConfigFormData) {
  // 1. 基础验证
  if (!formData.mode) {
    showError('请选择智能体运行模式');
    return;
  }

  // 2. 根据模式进行特定验证
  if (formData.mode === 'react') {
    // React模式验证

    // 检查是否误配置了max_iteration_times
    if (formData.max_iteration_times !== undefined) {
      showError({
        field: 'max_iteration_times',
        message: 'React模式不支持配置最大迭代次数',
      });
      return;
    }

    // 可选：检查Skills是否为空（根据业务需求）
    if (!formData.skills || formData.skills.length === 0) {
      showWarning('建议至少配置一个技能以增强智能体能力');
      // 注意：这里是警告，不阻止提交
    }

  } else if (formData.mode === 'function_call') {
    // Function Call模式验证

    // 检查是否误配置了skills
    if (formData.skills && formData.skills.length > 0) {
      showError({
        field: 'skills',
        message: '函数调用模式不支持配置技能',
      });
      return;
    }

    // 检查max_iteration_times是否存在
    if (formData.max_iteration_times === undefined) {
      showError({
        field: 'max_iteration_times',
        message: '函数调用模式需要配置最大迭代次数',
      });
      return;
    }

    // 检查max_iteration_times范围
    if (formData.max_iteration_times < MAX_ITERATION_CONFIG.MIN) {
      showError({
        field: 'max_iteration_times',
        message: `最大迭代次数不能小于 ${MAX_ITERATION_CONFIG.MIN}`,
      });
      return;
    }

    if (formData.max_iteration_times > MAX_ITERATION_CONFIG.MAX) {
      showError({
        field: 'max_iteration_times',
        message: `最大迭代次数不能大于 ${MAX_ITERATION_CONFIG.MAX}`,
      });
      return;
    }

    // 检查是否为整数
    if (!Number.isInteger(formData.max_iteration_times)) {
      showError({
        field: 'max_iteration_times',
        message: '最大迭代次数必须是整数',
      });
      return;
    }
  }

  // 3. 验证通过，提交配置
  // 注意：onSubmit函数仅处理模式配置的验证逻辑
  // 实际提交时，需要在调用处将formData与其他信息组合
  console.log('验证通过，可以提交:', formData);
}

// ============================================================================
// 场景5: 实时字段联动（输入验证）
// ============================================================================

export function onMaxIterationTimesChange(value: number) {
  // 实时验证输入
  clearFieldError('max_iteration_times');

  if (value < MAX_ITERATION_CONFIG.MIN) {
    showFieldError({
      field: 'max_iteration_times',
      message: `值不能小于 ${MAX_ITERATION_CONFIG.MIN}`,
    });
  } else if (value > MAX_ITERATION_CONFIG.MAX) {
    showFieldError({
      field: 'max_iteration_times',
      message: `值不能大于 ${MAX_ITERATION_CONFIG.MAX}`,
    });
  } else if (!Number.isInteger(value)) {
    showFieldError({
      field: 'max_iteration_times',
      message: '请输入整数',
    });
  } else {
    // 验证通过，显示提示信息
    if (value < 5) {
      showFieldWarning({
        field: 'max_iteration_times',
        message: '迭代次数较低，可能导致复杂任务未完成',
      });
    } else if (value > 15) {
      showFieldWarning({
        field: 'max_iteration_times',
        message: '迭代次数较高，可能消耗较多资源',
      });
    }
  }
}

// ============================================================================
// 辅助函数定义
// ============================================================================

function showField(fieldName: string) {
  document.querySelector(`[data-field="${fieldName}"]`)?.classList.remove('hidden');
}

function hideField(fieldName: string) {
  document.querySelector(`[data-field="${fieldName}"]`)?.classList.add('hidden');
}

function enableField(fieldName: string) {
  const field = document.querySelector(`[name="${fieldName}"]`) as HTMLInputElement;
  if (field) field.disabled = false;
}

function disableField(fieldName: string) {
  const field = document.querySelector(`[name="${fieldName}"]`) as HTMLInputElement;
  if (field) field.disabled = true;
}

function setFieldValue(fieldName: string, value: any) {
  // 使用表单库的setValue方法
  form.setValue(fieldName, value);
}

function showError(error: string | { field: string; message: string }) {
  // 显示错误提示
  notification.error(typeof error === 'string' ? error : error.message);
}

function showWarning(message: string) {
  notification.warning(message);
}

function showAlert(config: { type: string; message: string; description: string }) {
  // 显示Alert组件
  alertComponent.show(config);
}

function hideAlert() {
  alertComponent.hide();
}

function clearValidationErrors(fields: string[]) {
  fields.forEach(field => {
    form.clearErrors(field);
  });
}

function showFieldError(error: { field: string; message: string }) {
  form.setError(error.field, { type: 'manual', message: error.message });
}

function showFieldWarning(warning: { field: string; message: string }) {
  form.setWarning(warning.field, warning.message);
}

function clearFieldError(fieldName: string) {
  form.clearErrors(fieldName);
}

/**
 * 构建最终配置（用于创建新智能体）
 * 注意：此函数用于完整的智能体创建流程，包含agent_name等基础信息
 */
export function buildFinalConfig(formData: AgentCreateFormData): AgentConfiguration {
  const baseConfig = {
    agent_id: generateId(),
    agent_name: formData.agent_name || '未命名智能体',
    description: formData.description,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (formData.mode === 'react') {
    return {
      ...baseConfig,
      mode: 'react',
      config: {
        skills: formData.skills || [],
      },
    };
  } else {
    return {
      ...baseConfig,
      mode: 'function_call',
      config: {
        max_iteration_times: formData.max_iteration_times || MAX_ITERATION_CONFIG.DEFAULT,
      },
    };
  }
}

/**
 * 提交配置到后端
 * 注意：实际使用时，这里可以接收ModeConfigFormData（仅模式配置）
 * 或AgentConfiguration（完整配置）
 */
export function submitConfig(config: ModeConfigFormData | AgentConfiguration) {
  // 提交配置到后端
  api.post('/agents/config', config);
}
