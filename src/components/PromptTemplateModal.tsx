/**
 * Prompt模板管理Modal
 *
 * 用于导入和选择Prompt模板
 */

import React, { useState } from 'react';
import {
  Modal,
  Input,
  Button,
  List,
  Tag,
  Space,
  Empty,
  Pagination,
  message,
} from 'antd';
import {
  SearchOutlined,
  CopyOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import './PromptTemplateModal.css';

const { TextArea } = Input;

export interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  isOfficial?: boolean;
  updatedAt: string;
}

interface PromptTemplateModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (template: PromptTemplate) => void;
  onCreateNew: () => void;
}

export const PromptTemplateModal: React.FC<PromptTemplateModalProps> = ({
  visible,
  onClose,
  onSelect,
  onCreateNew,
}) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);

  // 模拟模板数据
  const mockTemplates: PromptTemplate[] = [
    {
      id: '1',
      name: '智能问答助手',
      content: `思考与回答逻辑\n请严格要求\n你是一个严谨、专业的知识库问答助手。你的唯一任务是依据资料库中的内容来回答用户的问题。\n\n1. 优先检索：当用户提问时，请务必先检索关联的知识内容。\n2. 依据事实：请严格基于检索到的信息进行回答，不要发散，不要编造知识库中不存在的事实。\n3. 无果处理：如果知识库中没有相关信息，请直接回答："抱歉，当前知识库中暂无相关内容。"`,
      updatedAt: '2026-01-28 19:17:35',
    },
    {
      id: '2',
      name: '我的Agent应用-角色指令11',
      content: `#角色设定\n作为一个____，你的任务是____。\n\n#组件能力\n你具备____能力。\n\n#要求与限制\n1.输出内容的风格要求____\n2.输出结果的格式为____\n3.输出内容的字数限制不超过____\n......`,
      updatedAt: '2026-01-28 18:44:04',
    },
    {
      id: '3',
      name: '我的Agent应用-角色指令',
      content: `#角色设定\n作为一个____，你的任务是____。\n\n#组件能力\n你具备____能力。`,
      updatedAt: '2026-01-28 01:21:37',
    },
    {
      id: '4',
      name: '自主规划Agent通用模板',
      content: `#角色设定\n作为一个____，你的任务是____。\n\n#组件能力\n你具备____能力。\n\n#要求与限制\n1.输出内容的风格要求____\n2.输出结果的格式为____\n3.输出内容的字数限制不超过____\n......`,
      isOfficial: true,
      updatedAt: '2025-05-21 00:00:00',
    },
    {
      id: '5',
      name: '多智能体协同Agent通用模版',
      content: `多智能体协同Agent通用模版内容...`,
      isOfficial: true,
      updatedAt: '2025-05-21 00:00:00',
    },
  ];

  // 过滤模板
  const filteredTemplates = mockTemplates.filter(template =>
    template.name.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  // 处理模板选择
  const handleTemplateClick = (template: PromptTemplate) => {
    setSelectedTemplate(template);
  };

  // 复制内容
  const handleCopy = () => {
    if (selectedTemplate) {
      navigator.clipboard.writeText(selectedTemplate.content);
      message.success('已复制到剪贴板');
    }
  };

  // 使用模板
  const handleUseTemplate = () => {
    if (selectedTemplate) {
      onSelect(selectedTemplate);
      onClose();
    }
  };

  return (
    <Modal
      title={
        <div className="template-modal-header">
          <span>Prompt模板</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      closeIcon={<CloseOutlined />}
      width={1200}
      className="prompt-template-modal"
      footer={
        <div className="template-modal-footer">
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={handleUseTemplate} disabled={!selectedTemplate}>
            使用模板
          </Button>
        </div>
      }
    >
      <div className="template-modal-content">
        {/* 左侧模板列表 */}
        <div className="template-list-panel">
          <div className="template-search-area">
            <Input
              placeholder="请输入Prompt模板名称"
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              allowClear
            />
            <Button type="primary" onClick={onCreateNew} style={{ marginTop: 12 }}>
              创建模板
            </Button>
          </div>

          <div className="template-list-header">
            <span>名称</span>
            <span>最近编辑时间</span>
          </div>

          <div className="template-list-body">
            {filteredTemplates.length > 0 ? (
              <List
                dataSource={filteredTemplates}
                renderItem={(template) => (
                  <div
                    key={template.id}
                    className={`template-list-item ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                    onClick={() => handleTemplateClick(template)}
                  >
                    <div className="template-item-name">
                      {template.name}
                      {template.isOfficial && (
                        <Tag color="blue" style={{ marginLeft: 8 }}>官方</Tag>
                      )}
                    </div>
                    <div className="template-item-time">{template.updatedAt}</div>
                  </div>
                )}
              />
            ) : (
              <Empty description="暂无模板" />
            )}
          </div>

          <div className="template-list-pagination">
            <Pagination
              simple
              defaultCurrent={1}
              total={filteredTemplates.length}
              pageSize={10}
              size="small"
            />
          </div>
        </div>

        {/* 右侧预览区 */}
        <div className="template-preview-panel">
          {selectedTemplate ? (
            <>
              <div className="template-preview-header">
                <span className="preview-title">{selectedTemplate.name}</span>
                <Button
                  type="text"
                  icon={<CopyOutlined />}
                  onClick={handleCopy}
                  size="small"
                />
              </div>
              <div className="template-preview-content">
                <TextArea
                  value={selectedTemplate.content}
                  readOnly
                  autoSize={{ minRows: 20, maxRows: 20 }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    resize: 'none',
                    padding: 0,
                  }}
                />
              </div>
              <div className="template-preview-footer">
                <span className="char-count">
                  {selectedTemplate.content.length} / 10000
                </span>
              </div>
            </>
          ) : (
            <Empty
              description="请选择一个模板"
              style={{ marginTop: 100 }}
            />
          )}
        </div>
      </div>
    </Modal>
  );
};
