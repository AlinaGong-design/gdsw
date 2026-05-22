// ─── 数字员工共享数据 Store ───────────────────────────────
// 前台对话评分 → 写入此 Store → 后台管理台实时读取
import { useState, useEffect } from 'react';

export interface EmployeeRecord {
  id: string;
  name: string;
  dept: string;
  domain: string;
  description: string;
  status: 'draft' | 'stationed' | 'approving' | 'published' | 'paused' | 'archived';
  version: string;
  scope: 'private' | 'dept' | 'company';
  updateTime: string;
  callCount: number;
  score: number;          // 用户评分均值 (1-5)
  heat: number;           // 热度 0-100，近7天调用/峰值
  type: '通用款' | '定制款' | '升级款';
  // 评分明细
  ratingCount: number;    // 评分总人次
  ratingSum: number;      // 评分总和（用于计算均值）
  recentCalls: number[];  // 近7天每日调用量
}

export interface SessionRating {
  employeeId: string;
  sessionId: string;
  score: number;           // 1-5 星
  tags: string[];          // 快捷标签：准确、高效、有帮助…
  comment: string;         // 可选文字
  timestamp: string;
}

// ─── 初始数据 ──────────────────────────────────────────────
const initialEmployees: EmployeeRecord[] = [
  {
    id: 'de-001', name: '法务合规助手', dept: '法务部', domain: '法务域',
    description: '合同审查、合规检查、法律风险评估，支持多种合同模板自动识别与条款提取',
    status: 'published', version: 'v2.1.0', scope: 'company',
    updateTime: '2026-03-10', callCount: 4821, score: 4.8, heat: 95, type: '通用款',
    ratingCount: 312, ratingSum: 1497.6, recentCalls: [62, 78, 55, 91, 84, 96, 88],
  },
  {
    id: 'de-004', name: '代码审查助手', dept: '技术部', domain: '技术域',
    description: 'PR 触发自动代码审查，安全漏洞扫描，输出审查建议并评论到 GitLab/GitHub',
    status: 'paused', version: 'v1.1.0', scope: 'dept',
    updateTime: '2026-02-28', callCount: 1654, score: 4.5, heat: 62, type: '升级款',
    ratingCount: 124, ratingSum: 558.0, recentCalls: [22, 18, 25, 30, 28, 15, 10],
  },
  {
    id: 'de-006', name: '运营数据助手', dept: '运营部', domain: '运营域',
    description: '自动汇总运营核心指标，生成日/周/月报告，支持钉钉/飞书推送',
    status: 'published', version: 'v1.2.0', scope: 'company',
    updateTime: '2026-03-12', callCount: 1243, score: 4.3, heat: 55, type: '定制款',
    ratingCount: 76, ratingSum: 326.8, recentCalls: [18, 22, 16, 28, 24, 14, 10],
  },
  {
    id: 'de-002', name: 'HR 招聘助手', dept: '人力资源', domain: '人力域',
    description: '简历智能筛选、面试时间协调、薪酬 benchmark 参考，接入飞书日历',
    status: 'published', version: 'v1.3.2', scope: 'dept',
    updateTime: '2026-03-05', callCount: 3256, score: 4.6, heat: 78, type: '定制款',
    ratingCount: 198, ratingSum: 910.8, recentCalls: [48, 52, 45, 68, 61, 40, 28],
  },
  {
    id: 'de-003', name: '财务报表助手', dept: '财务部', domain: '财务域',
    description: '定时拉取业务数据，AI 生成分析报告，异常数据预警推送',
    status: 'stationed', version: 'v3.0.0-beta', scope: 'dept',
    updateTime: '2026-03-14', callCount: 2890, score: 4.9, heat: 88, type: '通用款',
    ratingCount: 87, ratingSum: 426.3, recentCalls: [35, 42, 38, 55, 48, 32, 20],
  },
  {
    id: 'de-005', name: '智能客服分发', dept: '客户成功', domain: '客服域',
    description: '意图识别、多轮路由分发、自动记录工单，支持人工接管',
    status: 'draft', version: 'v0.1.0', scope: 'private',
    updateTime: '2026-03-15', callCount: 8923, score: 4.7, heat: 91, type: '通用款',
    ratingCount: 0, ratingSum: 0, recentCalls: [0, 0, 0, 0, 0, 0, 0],
  },
  {
    id: 'de-009', name: '合同审核助手', dept: '法务部', domain: '法务域',
    description: '通用合同智能审核助手，运用 AI Agent 多步推理能力，自动解析合同文本、识别风险条款、匹配法律依据，并在关键风险节点触发人工确认，确保审核结论准确可靠',
    status: 'published', version: 'v1.0.0', scope: 'company',
    updateTime: '2026-04-15', callCount: 1024, score: 4.8, heat: 79, type: '通用款',
    ratingCount: 88, ratingSum: 422.4, recentCalls: [20, 28, 24, 32, 30, 26, 22],
  },
];

// ─── Store 实现（发布-订阅模式） ──────────────────────────
type Listener = () => void;

class EmployeeStore {
  private employees: EmployeeRecord[] = [...initialEmployees];
  private ratings: SessionRating[] = [];
  private listeners: Set<Listener> = new Set();

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  getEmployees(): EmployeeRecord[] {
    return this.employees;
  }

  getEmployee(id: string): EmployeeRecord | undefined {
    return this.employees.find(e => e.id === id);
  }

  getRatings(): SessionRating[] {
    return this.ratings;
  }

  // 前台：提交一次会话评分
  submitRating(rating: SessionRating) {
    this.ratings.push(rating);

    this.employees = this.employees.map(emp => {
      if (emp.id !== rating.employeeId) return emp;

      const newRatingCount = emp.ratingCount + 1;
      const newRatingSum   = emp.ratingSum + rating.score;
      const newScore       = Math.round((newRatingSum / newRatingCount) * 10) / 10;

      // 调用量 +1，同时更新今日（最后一个）数据
      const recentCalls = [...emp.recentCalls];
      recentCalls[recentCalls.length - 1] = (recentCalls[recentCalls.length - 1] || 0) + 1;
      const newCallCount = emp.callCount + 1;
      const maxCalls     = Math.max(...recentCalls);
      const weekSum      = recentCalls.reduce((a, b) => a + b, 0);
      const peakDay      = Math.max(maxCalls, 1);
      // heat = 近7天均值 / 历史调用均值 * 100，简化为峰值比
      const newHeat = Math.min(100, Math.round((recentCalls[recentCalls.length - 1] / peakDay) * 100));

      return {
        ...emp,
        ratingCount: newRatingCount,
        ratingSum: newRatingSum,
        score: newScore,
        callCount: newCallCount,
        heat: newHeat,
        recentCalls,
      };
    });

    this.notify();
  }

  // 后台：更新员工状态
  updateEmployee(id: string, patch: Partial<EmployeeRecord>) {
    this.employees = this.employees.map(e => e.id === id ? { ...e, ...patch } : e);
    this.notify();
  }

  // 后台：删除员工（仅草稿状态允许）
  deleteEmployee(id: string) {
    this.employees = this.employees.filter(e => e.id !== id);
    this.notify();
  }

  // 聚合统计：供工作台使用
  getStats() {
    const emps = this.employees;
    return {
      totalCalls:  emps.reduce((s, e) => s + e.callCount, 0),
      activeCount: emps.filter(e => e.status === 'published').length,
      avgScore:    emps.length ? Math.round(emps.reduce((s, e) => s + e.score, 0) / emps.length * 10) / 10 : 0,
      totalRatings: this.ratings.length,
    };
  }
}

export const employeeStore = new EmployeeStore();

// ─── React Hook：订阅 Store 变化 ──────────────────────────

export function useEmployeeStore() {
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const unsub = employeeStore.subscribe(() => forceUpdate(n => n + 1));
    return () => { unsub(); };
  }, []);
  return employeeStore;
}
