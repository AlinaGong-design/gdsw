import React from 'react';
import { Table } from 'antd';

const ProcessManagement: React.FC = () => {
  const columns = [
    {
      title: '流程名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
  ];

  const mockData = [
    {
      key: '1',
      name: '审批流程1',
      status: '进行中',
      createdAt: '2026-01-20',
    },
    {
      key: '2',
      name: '审批流程2',
      status: '已完成',
      createdAt: '2026-01-19',
    },
    {
      key: '3',
      name: '审批流程3',
      status: '待审核',
      createdAt: '2026-01-18',
    },
  ];

  return (
    <div>
      <h1>流程管理</h1>
      <Table columns={columns} dataSource={mockData} />
    </div>
  );
};

export default ProcessManagement;
