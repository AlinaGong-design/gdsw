import React, { useState } from 'react';
import { Input, Button, Radio, message } from 'antd';
import { CameraOutlined } from '@ant-design/icons';

interface UserProfileProps {
  onBack?: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onBack }) => {
  const [nickname, setNickname] = useState('巩娜');
  const [position, setPosition] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('female');

  const handleSave = () => {
    message.success('保存成功');
  };

  return (
    <div style={{ display: 'flex', gap: '24px', padding: '24px', minHeight: '100%', background: '#f5f7fa' }}>
      {/* 左侧：个人信息 */}
      <div style={{
        width: '360px',
        flexShrink: 0,
        background: '#fff',
        borderRadius: '12px',
        padding: '28px 24px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
      }}>
        <div style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a1a', marginBottom: '28px' }}>个人信息</div>

        {/* 头像 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <div style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f9a8d4 0%, #c084fc 50%, #818cf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              cursor: 'pointer',
              overflow: 'hidden',
              border: '3px solid #fff',
              boxShadow: '0 2px 12px rgba(0,0,0,0.12)'
            }}>
              🧑‍🎨
            </div>
          </div>
          <Button
            icon={<CameraOutlined />}
            style={{
              borderRadius: '20px',
              fontSize: '13px',
              color: '#555',
              border: '1px solid #e0e0e0',
              height: '32px',
              padding: '0 16px'
            }}
          >
            更换头像
          </Button>
        </div>

        {/* 信息表格 */}
        <div style={{
          border: '1px solid #e8e8e8',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          {[
            { label: '用户名', value: 'gongna' },
            { label: '手机号码', value: '' },
            { label: '用户邮箱', value: '' },
            { label: '所属部门', value: '研发部门' },
            { label: '所属角色', value: '智能体架构师' },
            { label: '创建时间', value: '2026-01-22T10:53:08' },
          ].map((row, idx, arr) => (
            <div
              key={row.label}
              style={{
                display: 'flex',
                borderBottom: idx < arr.length - 1 ? '1px solid #e8e8e8' : 'none'
              }}
            >
              <div style={{
                width: '90px',
                padding: '12px 14px',
                fontSize: '13px',
                color: '#888',
                background: '#fafafa',
                borderRight: '1px solid #e8e8e8',
                flexShrink: 0
              }}>
                {row.label}
              </div>
              <div style={{
                padding: '12px 14px',
                fontSize: '13px',
                color: '#1a1a1a',
                flex: 1
              }}>
                {row.value || <span style={{ color: '#ccc' }}>—</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 右侧：基本资料表单 */}
      <div style={{
        flex: 1,
        background: '#fff',
        borderRadius: '12px',
        padding: '28px 32px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
      }}>
        <div style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a1a', marginBottom: '28px' }}>基本资料</div>

        <div style={{ maxWidth: '860px' }}>
          {/* 昵称 */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', color: '#333', marginBottom: '8px' }}>昵称</div>
            <Input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              style={{ borderRadius: '8px', height: '42px' }}
            />
          </div>

          {/* 岗位 */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', color: '#333', marginBottom: '8px' }}>岗位</div>
            <Input
              placeholder="请输入岗位"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              style={{ borderRadius: '8px', height: '42px' }}
            />
          </div>

          {/* 手机号码 */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', color: '#333', marginBottom: '8px' }}>手机号码</div>
            <Input
              placeholder="请输入手机号码"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ borderRadius: '8px', height: '42px' }}
            />
          </div>

          {/* 邮箱 */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', color: '#333', marginBottom: '8px' }}>邮箱</div>
            <Input
              placeholder="请输入邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ borderRadius: '8px', height: '42px' }}
            />
          </div>

          {/* 性别 */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ fontSize: '14px', color: '#333', marginBottom: '10px' }}>性别</div>
            <Radio.Group
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <Radio value="male">男</Radio>
              <Radio value="female">女</Radio>
            </Radio.Group>
          </div>

          {/* 按钮 */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button
              type="primary"
              onClick={handleSave}
              style={{
                background: '#6366F1',
                border: 'none',
                borderRadius: '6px',
                height: '40px',
                padding: '0 32px',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              保 存
            </Button>
            <Button
              onClick={onBack}
              style={{
                borderRadius: '6px',
                height: '40px',
                padding: '0 32px',
                fontSize: '14px'
              }}
            >
              取 消
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
