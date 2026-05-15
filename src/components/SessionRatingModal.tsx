import React, { useState } from 'react';
import { Modal, Button, Input, message } from 'antd';
import { StarFilled, StarOutlined } from '@ant-design/icons';
import { employeeStore, EmployeeRecord, SessionRating } from '../store/employeeStore';

// ─── 评分快捷标签 ──────────────────────────────────────────
const RATING_TAGS: Record<number, string[]> = {
  5: ['回答准确', '效率极高', '非常有帮助', '超出预期'],
  4: ['回答准确', '较有帮助', '表达清晰', '基本满足需求'],
  3: ['基本可用', '部分准确', '有待改进'],
  2: ['回答偏差', '理解有误', '需要人工接管'],
  1: ['完全无用', '答非所问', '误导信息'],
};

interface SessionRatingModalProps {
  open: boolean;
  employee: EmployeeRecord;
  sessionId: string;
  onClose: () => void;
}

const SessionRatingModal: React.FC<SessionRatingModalProps> = ({ open, employee, sessionId, onClose }) => {
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const tags = selectedStar > 0 ? RATING_TAGS[selectedStar] : [];

  const handleSubmit = () => {
    if (selectedStar === 0) {
      message.warning('请先选择星级');
      return;
    }
    const rating: SessionRating = {
      employeeId: employee.id,
      sessionId,
      score: selectedStar,
      tags: selectedTags,
      comment: comment.trim(),
      timestamp: new Date().toISOString(),
    };
    employeeStore.submitRating(rating);
    setSubmitted(true);
  };

  const handleClose = () => {
    // 重置状态
    setHoveredStar(0);
    setSelectedStar(0);
    setSelectedTags([]);
    setComment('');
    setSubmitted(false);
    onClose();
  };

  const starLabels = ['', '很差', '较差', '一般', '满意', '非常满意'];

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      width={420}
      centered
      closable={!submitted}
      maskClosable={false}
    >
      {submitted ? (
        // ── 提交成功状态 ──
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>感谢您的反馈！</div>
          <div style={{ fontSize: 13, color: '#999', marginBottom: 6 }}>
            您对「{employee.name}」的评分已记录
          </div>
          <div style={{ display: 'inline-flex', gap: 4, marginBottom: 20 }}>
            {[1,2,3,4,5].map(i => (
              <StarFilled key={i} style={{ color: i <= selectedStar ? '#F59E0B' : '#e8e8e8', fontSize: 22 }} />
            ))}
          </div>
          <div style={{ fontSize: 12, color: '#bbb', marginBottom: 24 }}>
            当前综合评分将根据所有用户反馈实时更新
          </div>
          <Button
            type="primary"
            style={{ background: '#6366F1', borderColor: '#6366F1', borderRadius: 8, width: 120 }}
            onClick={handleClose}
          >
            完成
          </Button>
        </div>
      ) : (
        // ── 评分表单 ──
        <div style={{ padding: '8px 0' }}>
          {/* 员工信息 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 11, flexShrink: 0,
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 18, fontWeight: 700,
            }}>
              {employee.name.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{employee.name}</div>
              <div style={{ fontSize: 12, color: '#999' }}>{employee.dept} · 本次对话体验如何？</div>
            </div>
          </div>

          {/* 星级选择 */}
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <div style={{ display: 'inline-flex', gap: 8, marginBottom: 6 }}>
              {[1,2,3,4,5].map(i => (
                <div
                  key={i}
                  onMouseEnter={() => setHoveredStar(i)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => { setSelectedStar(i); setSelectedTags([]); }}
                  style={{ cursor: 'pointer', transition: 'transform 0.1s', transform: (hoveredStar || selectedStar) >= i ? 'scale(1.2)' : 'scale(1)' }}
                >
                  {(hoveredStar || selectedStar) >= i
                    ? <StarFilled style={{ color: '#F59E0B', fontSize: 32 }} />
                    : <StarOutlined style={{ color: '#d9d9d9', fontSize: 32 }} />
                  }
                </div>
              ))}
            </div>
            <div style={{ fontSize: 13, color: selectedStar > 0 ? '#F59E0B' : '#bbb', fontWeight: selectedStar > 0 ? 600 : 400, minHeight: 20 }}>
              {hoveredStar > 0 ? starLabels[hoveredStar] : (selectedStar > 0 ? starLabels[selectedStar] : '点击星星评分')}
            </div>
          </div>

          {/* 快捷标签 */}
          {selectedStar > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>选择标签（可多选）</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {tags.map(tag => {
                  const active = selectedTags.includes(tag);
                  return (
                    <div
                      key={tag}
                      onClick={() => setSelectedTags(prev => active ? prev.filter(t => t !== tag) : [...prev, tag])}
                      style={{
                        padding: '4px 12px', borderRadius: 16, fontSize: 12, cursor: 'pointer',
                        background: active ? '#6366F1' : '#f5f5f5',
                        color: active ? '#fff' : '#555',
                        border: active ? '1px solid #6366F1' : '1px solid #e8e8e8',
                        transition: 'all 0.15s',
                      }}
                    >{tag}</div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 文字评价 */}
          {selectedStar > 0 && (
            <div style={{ marginBottom: 20 }}>
              <Input.TextArea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="补充说明（选填）"
                rows={2}
                maxLength={200}
                showCount
                style={{ borderRadius: 8, resize: 'none', fontSize: 13 }}
              />
            </div>
          )}

          {/* 操作按钮 */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button style={{ borderRadius: 8 }} onClick={handleClose}>跳过</Button>
            <Button
              type="primary"
              disabled={selectedStar === 0}
              style={{ background: '#6366F1', borderColor: '#6366F1', borderRadius: 8 }}
              onClick={handleSubmit}
            >
              提交评分
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default SessionRatingModal;
