import React from 'react';
import { Card } from 'antd';
import './Home.css';

const Home: React.FC = () => {
  const sections = [
    { id: 1, label: '智能体', color: '#8B5CF6', top: '10%', left: '15%' },
    { id: 2, label: '知识库', color: '#6366F1', top: '25%', left: '45%' },
    { id: 3, label: '工作流', color: '#EC4899', top: '15%', left: '75%' },
    { id: 4, label: 'API', color: '#10B981', top: '50%', left: '10%' },
    { id: 5, label: '模型', color: '#F59E0B', top: '60%', left: '65%' },
    { id: 6, label: '评测', color: '#3B82F6', top: '75%', left: '35%' },
  ];

  return (
    <div style={{ height: '100%', position: 'relative', minHeight: '600px' }}>
      <div style={{ textAlign: 'center', paddingTop: '60px', marginBottom: '80px' }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: 'bold',
          background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '8px'
        }}>
          Hi, 欢迎来到万卷
        </h1>
        <p style={{ fontSize: '16px', color: '#666' }}>
          探索智能工作流的无限可能
        </p>
      </div>

      <div style={{ position: 'relative', height: '400px', maxWidth: '900px', margin: '0 auto' }}>
        {sections.map((section) => (
          <Card
            key={section.id}
            className="floating-card"
            style={{
              position: 'absolute',
              top: section.top,
              left: section.left,
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              background: `linear-gradient(135deg, ${section.color}22 0%, ${section.color}44 100%)`,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            hoverable
          >
            <div style={{
              textAlign: 'center',
              fontSize: '18px',
              fontWeight: 600,
              color: section.color
            }}>
              {section.label}
            </div>
          </Card>
        ))}

        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 12px 40px rgba(99, 102, 241, 0.4)',
          zIndex: 10
        }}>
          <div style={{ textAlign: 'center', color: '#fff' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>万卷</div>
            <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.9 }}>AI Platform</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
