/**
 * 创建/保存Prompt模板Modal
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Input,
  Button,
  message,
} from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import './SaveTemplateModal.css';

const { TextArea } = Input;

interface SaveTemplateModalProps {
  visible: boolean;
  initialPrompt?: string; // 当前的提示词内容
  onClose: () => void;
  onSave: (name: string, content: string) => void;
}

export const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({
  visible,
  initialPrompt = '',
  onClose,
  onSave,
}) => {
  const [templateName, setTemplateName] = useState('');
  const [promptContent, setPromptContent] = useState('');

  // 当弹窗打开时，初始化内容
  useEffect(() => {
    if (visible) {
      setPromptContent(initialPrompt);
      // 可以设置默认名称
      setTemplateName('我的Agent应用-角色指令');
    } else {
      // 关闭时清空
      setTemplateName('');
      setPromptContent('');
    }
  }, [visible, initialPrompt]);

  // 处理保存
  const handleSave = () => {
    if (!templateName.trim()) {
      message.warning('请输入模板名称');
      return;
    }

    if (!promptContent.trim()) {
      message.warning('请输入Prompt内容');
      return;
    }

    if (templateName.length > 64) {
      message.warning('模板名称不能超过64个字符');
      return;
    }

    if (promptContent.length > 10000) {
      message.warning('Prompt内容不能超过10000个字符');
      return;
    }

    onSave(templateName.trim(), promptContent.trim());
    message.success('模板保存成功');
    onClose();
  };

  return (
    <Modal
      title="创建Prompt模板"
      open={visible}
      onCancel={onClose}
      closeIcon={<CloseOutlined />}
      width={800}
      className="save-template-modal"
      footer={
        <div className="save-template-footer">
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={handleSave}>
            创建
          </Button>
        </div>
      }
    >
      <div className="save-template-content">
        {/* 名称输入 */}
        <div className="save-template-field">
          <div className="field-label">
            名称 <span className="required">*</span>
          </div>
          <Input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="请输入模板名称"
            maxLength={64}
            showCount
            suffix={
              <span className="char-count-suffix">
                {templateName.length} / 64
              </span>
            }
          />
        </div>

        {/* Prompt输入 */}
        <div className="save-template-field">
          <div className="field-label">
            Prompt <span className="required">*</span>
          </div>
          <div className="prompt-textarea-wrapper">
            <TextArea
              value={promptContent}
              onChange={(e) => setPromptContent(e.target.value)}
              placeholder="请输入Prompt内容"
              autoSize={{ minRows: 15, maxRows: 15 }}
              maxLength={10000}
              showCount={false}
            />
            <div className="prompt-char-count">
              {promptContent.length} / 10000
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
