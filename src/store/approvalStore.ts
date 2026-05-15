// ─── Shared Approval Store ─────────────────────────────────────────────────────
// Bridges SkillsStore (submitter) and ApprovalCenter (reviewer)

export type ApprovalType = 'employee_publish';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ApprovalItem {
  id: string;
  type: ApprovalType;
  title: string;
  requester: string;
  requesterRole: string;
  dept: string;
  reason: string;
  riskNote?: string;
  riskLevel?: 'high' | 'medium' | 'low';
  status: ApprovalStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewer?: string;
  rejectReason?: string;
  meta?: Record<string, string>;
  // employee_publish specific
  employeeId?: string;
}

type Listener = () => void;

class ApprovalStore {
  private items: ApprovalItem[] = [];
  private listeners: Listener[] = [];

  subscribe(fn: Listener): () => void {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  getAll(): ApprovalItem[] {
    return this.items;
  }


  /** Returns employee IDs with pending employee_publish approval */
  getPendingPublishEmployeeIds(): Set<string> {
    return new Set(
      this.items
        .filter(a => a.type === 'employee_publish' && a.status === 'pending' && a.employeeId)
        .map(a => a.employeeId!)
    );
  }

  /** Returns employee IDs with approved employee_publish */
  getApprovedPublishEmployeeIds(): Set<string> {
    return new Set(
      this.items
        .filter(a => a.type === 'employee_publish' && a.status === 'approved' && a.employeeId)
        .map(a => a.employeeId!)
    );
  }

  addItem(item: ApprovalItem) {
    this.items = [item, ...this.items];
    this.notify();
  }

  updateStatus(id: string, status: ApprovalStatus, reviewer: string, rejectReason?: string) {
    this.items = this.items.map(a =>
      a.id === id
        ? {
            ...a, status, reviewer,
            reviewedAt: new Date().toLocaleString('zh-CN', { hour12: false }).slice(0, 16),
            ...(rejectReason ? { rejectReason } : {}),
          }
        : a
    );
    this.notify();
  }
}

export const approvalStore = new ApprovalStore();
