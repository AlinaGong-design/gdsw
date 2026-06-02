import React, { useState, useRef, useCallback, useEffect } from 'react';

interface FillField {
  id: string;
  label: string;
  chapter: string;
  type: 'text' | 'image';
}

const FILL_FIELDS: FillField[] = [
  { id: 'f01', label: '作业方案名称', chapter: '封面', type: 'text' },
  { id: 'f02', label: '作业编号', chapter: '封面', type: 'text' },
  { id: 'f03', label: '编制单位', chapter: '封面', type: 'text' },
  { id: 'f04', label: '编制日期', chapter: '封面', type: 'text' },
  { id: 'f05', label: '作业目的说明', chapter: '第一章 作业概述', type: 'text' },
  { id: 'f06', label: '作业范围描述', chapter: '第一章 作业概述', type: 'text' },
  { id: 'f07', label: '作业负责人', chapter: '第二章 作业人员', type: 'text' },
  { id: 'f08', label: '作业成员名单', chapter: '第二章 作业人员', type: 'text' },
  { id: 'f09', label: '作业现场平面图', chapter: '第三章 安全措施', type: 'image' },
  { id: 'f10', label: '安全防护措施说明', chapter: '第三章 安全措施', type: 'text' },
  { id: 'f11', label: '设备铭牌照片', chapter: '第四章 设备信息', type: 'image' },
  { id: 'f12', label: '设备技术参数', chapter: '第四章 设备信息', type: 'text' },
  { id: 'f13', label: '施工工序流程图', chapter: '第五章 施工工序', type: 'image' },
];

// AI 优化建议数据
const AI_SUGGESTIONS: Record<string, string> = {
  f01: '建议命名格式：「[单位简称]-[年度]-[变电站名]-年度检修作业方案」，例如：国网冀北-2025-220kV石景山变-年度检修作业方案',
  f02: '编号格式建议：ZY-YYYY-MMDD-XXX（作业类型-年-月日-序号），例如：ZY-2025-0608-001',
  f03: '填写运维单位全称，如：国家电网有限公司冀北电力有限公司北京检修公司',
  f04: '填写本作业方案编制完成日期，格式：YYYY年MM月DD日',
  f05: '建议从以下角度描述：①消除设备隐患 ②提升设备健康水平 ③保障电网可靠供电 ④满足预防性试验周期要求',
  f06: '建议明确：①设备范围（主变/断路器/保护装置等）②电压等级③区域/站场名称④具体工作内容',
  f07: '填写负责人姓名及工号，确认其持有有效高压电工特种作业证',
  f08: '按角色分列：作业负责人×1、安全监护人×1、检修人员×N、试验人员×N，并注明各自证书编号',
  f10: '必须包含：①验电接地措施 ②隔离范围设置 ③个人防护装备（绝缘手套/绝缘靴/护目镜）④与带电设备安全距离（≥3m）',
  f12: '应包含：额定电压、额定电流、额定容量、短路阻抗、冷却方式、出厂日期、出厂编号等铭牌参数',
};

// HSE 驳回建议映射到字段（关键词匹配）
const REJECTION_FIELD_HINTS: Record<string, string[]> = {
  f09: ['平面图', '现场平面', '隔离距离'],
  f10: ['防护措施', '绝缘手套', '安全防护'],
  f08: ['成员名单', '证书编号', '特种作业证'],
  f13: ['流程图', '工序流程', '验电接地'],
};

// AI 解读建议
const AI_INTERPRET_HINTS: Record<string, string> = {
  f09: '现场平面图需标注：①带电区域红色虚线边界 ②接地线位置 ③安全隔离距离（≥3m）④警示标志位置。建议使用CAD或专业绘图软件重新绘制并标注。',
  f10: '安全防护措施须逐条列出，建议格式：\n①验电接地：在XX开关出线侧验电，装设三相短路接地线\n②隔离措施：拉开隔离开关，悬挂"禁止合闸"标示牌\n③个人防护：绝缘手套（型号：YS101-01-02，检验日期：XXXX-XX）、绝缘靴、护目镜\n④安全距离：与220kV带电设备保持≥3m安全距离',
  f08: '作业成员名单建议格式：\n姓名/工号/��色/证书类型/证书编号\n例：张三/12345/作业负责人/高压电工特种作业操作证/豫（安监）特操证字[XXXX]第XXXXXX号',
  f13: '施工工序流程图需增加「停电验电」环节，建议顺序：\n办理工作票→停电倒闸→验电接地→挂安全标示牌→开始检修→完工检查→拆除接地线→恢复送电→工作票终结',
};

const OUTLINE_CHAPTERS = [
  '封面信息', '第一章 作业概述', '第二章 作业人员及分工',
  '第三章 安全措施', '第四章 设备信息', '第五章 施工工序',
  '第六章 应急处置', '第七章 附件',
];

const CHAPTER_ANCHOR_MAP: Record<string, string> = {
  '封面信息': 'f01',
  '第一章 作业概述': 'f05',
  '第二章 作业人员及分工': 'f07',
  '第三章 安全措施': 'f09',
  '第四章 设备信息': 'f11',
  '第五章 施工工序': 'f13',
};

interface Props {
  templateName: string;
  onBack: () => void;
  onSubmit?: () => void;
  rejectionData?: string;
}

const OperationPlanEditor: React.FC<Props> = ({ onBack, onSubmit, rejectionData }) => {
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [imageValues, setImageValues] = useState<Record<string, string>>({});
  const [outlineOpen, setOutlineOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, string>>({});
  const [aiInterpretId, setAiInterpretId] = useState<string | null>(null);
  const [aiInterprets, setAiInterprets] = useState<Record<string, string>>({});
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartW = useRef(300);

  const isRejected = !!rejectionData;

  // 解析驳回建议，判断哪些字段受影响
  const rejectedFieldIds = React.useMemo(() => {
    if (!rejectionData) return new Set<string>();
    const affected = new Set<string>();
    Object.entries(REJECTION_FIELD_HINTS).forEach(([fieldId, keywords]) => {
      if (keywords.some(kw => rejectionData.includes(kw))) {
        affected.add(fieldId);
      }
    });
    return affected;
  }, [rejectionData]);

  const rejectionLines = rejectionData ? rejectionData.split('\n').filter(Boolean) : [];

  // 驳回模式打开时，自动预加载所有受影响字段的 AI 优化建议
  useEffect(() => {
    if (!isRejected || rejectedFieldIds.size === 0) return;
    const fieldIds = Array.from(rejectedFieldIds);
    // 自动选中第一个受影响字段
    setSelectedFieldId(fieldIds[0]);
    fieldIds.forEach((fieldId, idx) => {
      setTimeout(() => {
        setAiInterprets(prev => ({
          ...prev,
          [fieldId]: AI_INTERPRET_HINTS[fieldId] || '建议根据 HSE 审批意见仔细核对该字段内容，确保满足安全规范要求后重新填写。',
        }));
      }, 600 + idx * 300);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRejected]);

  const completedCount = FILL_FIELDS.filter(f =>
    f.type === 'text' ? !!fieldValues[f.id] : !!imageValues[f.id]
  ).length;
  const allCompleted = completedCount === FILL_FIELDS.length;

  const handleLocate = (fieldId: string) => {
    setSelectedFieldId(fieldId);
    const el = fieldRefs.current[fieldId];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // 拖拽调整侧边栏宽度
  const onDragStart = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartW.current = sidebarWidth;
    e.preventDefault();
  }, [sidebarWidth]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = dragStartX.current - e.clientX;
      const newW = Math.min(520, Math.max(200, dragStartW.current + delta));
      setSidebarWidth(newW);
    };
    const onUp = () => { isDragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  // AI 优化（支持多次点击重新生成）
  const handleAiOptimize = (fieldId: string) => {
    if (aiLoadingId === fieldId) return;
    setAiLoadingId(fieldId);
    setAiSuggestions(prev => { const n = { ...prev }; delete n[fieldId]; return n; });
    setTimeout(() => {
      setAiSuggestions(prev => ({ ...prev, [fieldId]: AI_SUGGESTIONS[fieldId] || '该字段暂无优化建议。' }));
      setAiLoadingId(null);
    }, 1200);
  };

  const handleApplySuggestion = (fieldId: string) => {
    const suggestion = aiSuggestions[fieldId];
    if (!suggestion) return;
    const match = suggestion.match(/[「『]([^」』]+)[」』]/);
    const value = match ? match[1] : suggestion.split('，')[0].replace(/^建议[^：：]*[：：]/, '').trim();
    setFieldValues(v => ({ ...v, [fieldId]: value }));
    setAiSuggestions(prev => { const n = { ...prev }; delete n[fieldId]; return n; });
  };

  // AI 解读（驳回模式）
  const handleAiInterpret = (fieldId: string) => {
    if (aiInterpretId === fieldId) return;
    setAiInterpretId(fieldId);
    setAiInterprets(prev => { const n = { ...prev }; delete n[fieldId]; return n; });
    setTimeout(() => {
      setAiInterprets(prev => ({ ...prev, [fieldId]: AI_INTERPRET_HINTS[fieldId] || '建议根据 HSE 审批意见仔细核对该字段内容，确保满足安全规范要求后重新填写。' }));
      setAiInterpretId(null);
    }, 1000);
  };

  const InlineField = ({ field }: { field: FillField }) => {
    const isSelected = selectedFieldId === field.id;
    const val = fieldValues[field.id];
    const isRejectedField = rejectedFieldIds.has(field.id);
    return (
      <span
        ref={el => { fieldRefs.current[field.id] = el; }}
        onClick={() => setSelectedFieldId(field.id)}
        style={{
          background: isSelected ? '#e0e7ff' : isRejectedField && !val ? '#fee2e2' : val ? 'transparent' : '#fef3c7',
          color: val ? '#1a1a1a' : isRejectedField ? '#991b1b' : '#92400e',
          border: isSelected ? '1.5px solid #6366F1' : isRejectedField && !val ? '1px dashed #ef4444' : val ? 'none' : '1px dashed #f59e0b',
          borderRadius: 3,
          padding: '1px 5px',
          cursor: 'pointer',
          fontWeight: val ? 400 : 600,
          transition: 'all 0.15s',
          display: 'inline',
          fontSize: 'inherit',
        }}
      >
        {val || `【待填写：${field.label}】`}
      </span>
    );
  };

  const ImageField = ({ field }: { field: FillField }) => {
    const isSelected = selectedFieldId === field.id;
    const img = imageValues[field.id];
    const isRejectedField = rejectedFieldIds.has(field.id);
    return (
      <div
        ref={el => { fieldRefs.current[field.id] = el; }}
        onClick={() => setSelectedFieldId(field.id)}
        style={{
          margin: '8px 0',
          border: `2px dashed ${isSelected ? '#6366F1' : img ? '#10b981' : isRejectedField ? '#ef4444' : '#f59e0b'}`,
          borderRadius: 6,
          background: isSelected ? '#f0f0ff' : img ? '#f0fdf4' : isRejectedField ? '#fff1f2' : '#fffbeb',
          padding: 16,
          textAlign: 'center',
          cursor: 'pointer',
          minHeight: 100,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'all 0.2s',
        }}
      >
        {img ? (
          <img src={img} alt={field.label} style={{ maxHeight: 150, maxWidth: '100%', objectFit: 'contain' }} />
        ) : (
          <>
            <span style={{ fontSize: 28 }}>{isRejectedField ? '⚠️' : '🖼️'}</span>
            <span style={{ fontSize: 12, color: isRejectedField ? '#991b1b' : '#92400e', fontWeight: 600 }}>【待填写】{field.label}</span>
            <span style={{ fontSize: 11, color: '#aaa' }}>点击右侧面板上传图片</span>
          </>
        )}
      </div>
    );
  };

  const fieldsByChapter = FILL_FIELDS.reduce((acc, f) => {
    if (!acc[f.chapter]) acc[f.chapter] = [];
    acc[f.chapter].push(f);
    return acc;
  }, {} as Record<string, FillField[]>);

  const f = (id: string) => FILL_FIELDS.find(x => x.id === id)!;

  const BAR_BTN: React.CSSProperties = {
    width: 26, height: 26, border: '1px solid #e5e7eb', borderRadius: 4,
    background: '#fff', cursor: 'pointer', fontSize: 12, display: 'flex',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', flexDirection: 'column', background: '#f0f0f0', fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif' }}>

      {/* ── 顶栏 ── */}
      <div style={{ height: 46, background: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 13, padding: '4px 8px', borderRadius: 5 }}>
          ← 返回
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', flex: 1 }}>
          220kV变电站年度检修作业方案_待填充.docx
          {isRejected && <span style={{ marginLeft: 8, fontSize: 11, background: '#fee2e2', color: '#dc2626', padding: '1px 8px', borderRadius: 10, fontWeight: 500 }}>HSE 审批驳回</span>}
        </span>
        {/* 提交按钮：仅在全部完成且未驳回时显示 */}
        {allCompleted && !isRejected && onSubmit && (
          <button
            onClick={onSubmit}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#059669', color: '#fff', border: 'none', borderRadius: 7, padding: '7px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(5,150,105,0.25)' }}
          >
            ✓ 提交审批
          </button>
        )}
        {/* 驳回模式：重新提交按钮 */}
        {isRejected && allCompleted && onSubmit && (
          <button
            onClick={onSubmit}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 7, padding: '7px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            ↺ 修改后重新提交
          </button>
        )}
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#6366F1', color: '#fff', border: 'none', borderRadius: 7, padding: '7px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
          📄 导出
        </button>
      </div>

      {/* ── 菜单栏 ── */}
      <div style={{ height: 34, background: '#fff', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 2, flexShrink: 0 }}>
        <span style={{ fontSize: 12, color: '#9ca3af', marginRight: 8 }}>☰ 220kV变电站年度检修作业方案</span>
        {['开始', '插入', '页面', '审阅', '视图', '效率'].map((tab, i) => (
          <button key={tab} style={{ fontSize: 12, padding: '0 10px', height: 26, border: 'none', background: i === 0 ? '#f0f0ff' : 'none', color: i === 0 ? '#6366F1' : '#4b5563', borderRadius: 5, cursor: 'pointer', fontWeight: i === 0 ? 600 : 400 }}>{tab}</button>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: allCompleted ? '#059669' : '#9ca3af', marginRight: 8, fontWeight: allCompleted ? 600 : 400 }}>
          {allCompleted ? '✓ 全部填写完成' : `已填 ${completedCount}/${FILL_FIELDS.length} 项`}
        </span>
        <div style={{ width: 80, height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${(completedCount / FILL_FIELDS.length) * 100}%`, height: '100%', background: allCompleted ? '#059669' : '#6366F1', borderRadius: 3, transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* ── 工具栏 ── */}
      <div style={{ height: 36, background: '#fff', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', padding: '0 10px', gap: 3, flexShrink: 0 }}>
        {['↩', '↪', '⎘', '◻'].map((ic, i) => <button key={i} style={BAR_BTN}>{ic}</button>)}
        <div style={{ width: 1, height: 18, background: '#e5e7eb', margin: '0 3px' }} />
        <select style={{ height: 26, border: '1px solid #e5e7eb', borderRadius: 4, fontSize: 12, padding: '0 4px', color: '#374151' }}>
          <option>小四</option><option>四号</option><option>三号</option>
        </select>
        <div style={{ width: 1, height: 18, background: '#e5e7eb', margin: '0 3px' }} />
        {[
          { label: 'B', style: { fontWeight: 700 } as React.CSSProperties },
          { label: 'I', style: { fontStyle: 'italic' } as React.CSSProperties },
          { label: 'U', style: { textDecoration: 'underline' } as React.CSSProperties },
          { label: 'ab', style: { fontSize: 10 } as React.CSSProperties },
        ].map(({ label, style }, i) => (
          <button key={i} style={{ ...BAR_BTN, ...style }}>{label}</button>
        ))}
        <div style={{ width: 1, height: 18, background: '#e5e7eb', margin: '0 3px' }} />
        <button style={{ ...BAR_BTN, background: '#fef9c3', fontSize: 11 }}>A↑</button>
        <button style={{ ...BAR_BTN, color: '#2563eb', fontSize: 11 }}>A↓</button>
        <div style={{ width: 1, height: 18, background: '#e5e7eb', margin: '0 3px' }} />
        {['≡', '≡', '≡', '≡'].map((ic, i) => <button key={i} style={BAR_BTN}>{ic}</button>)}
        <div style={{ width: 1, height: 18, background: '#e5e7eb', margin: '0 3px' }} />
        {['☑', '☰', '⊞'].map((ic, i) => <button key={i} style={BAR_BTN}>{ic}</button>)}
        <div style={{ flex: 1 }} />
        <button style={{ ...BAR_BTN, width: 'auto', padding: '0 8px', fontSize: 11, gap: 3, display: 'flex', alignItems: 'center' }}>🖨 打印</button>
      </div>

      {/* ── 主体 ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* 左侧大纲 */}
        {outlineOpen && (
          <div style={{ width: 176, background: '#fff', borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid #f0f0f0' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>大纲</span>
              <button onClick={() => setOutlineOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 14, lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
              {OUTLINE_CHAPTERS.map((title, i) => (
                <div
                  key={i}
                  onClick={() => {
                    const anchor = CHAPTER_ANCHOR_MAP[title];
                    if (anchor) handleLocate(anchor);
                  }}
                  style={{ padding: '6px 12px', fontSize: 12, color: '#374151', cursor: 'pointer', borderRadius: 4, margin: '0 4px', lineHeight: 1.4 }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {title}
                </div>
              ))}
              <div style={{ padding: '6px 12px 6px 20px', fontSize: 11, color: '#9ca3af' }}>设置的标题会在此处显示</div>
            </div>
          </div>
        )}

        {/* 文档正文 */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#e8e8e8', padding: '24px 20px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 740, background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.1)', minHeight: '100%', padding: '60px 80px', fontSize: 14, lineHeight: 1.9, color: '#1a1a1a', position: 'relative' }}>
            {/* 水印 */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 0 }}>
              <div style={{ fontSize: 38, fontWeight: 900, color: '#6366F1', opacity: 0.05, transform: 'rotate(-30deg)', userSelect: 'none', letterSpacing: 6, whiteSpace: 'nowrap' }}>WPS WebOffice 万卷</div>
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>

              {/* 封面 */}
              <div style={{ textAlign: 'center', marginBottom: 48, paddingBottom: 32, borderBottom: '2px solid #e5e7eb' }}>
                <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, color: '#111827', lineHeight: 1.5 }}>
                  <InlineField field={f('f01')} />
                </div>
                <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 2.4 }}>
                  <div>作业编号：<InlineField field={f('f02')} /></div>
                  <div>编制单位：<InlineField field={f('f03')} /></div>
                  <div>编制日期：<InlineField field={f('f04')} /></div>
                </div>
              </div>

              {/* 第一章 */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: '#111827', borderLeft: '3px solid #6366F1', paddingLeft: 10 }}>第一章 作业概述</div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: '#374151' }}>1.1 作业目的</div>
                  <p style={{ margin: '0 0 8px', textIndent: '2em' }}>本次年度检修作业旨在<InlineField field={f('f05')} />，确保220kV变电站各设备处于良好运行状态，保障区域电网安全稳定运行，提升供电可靠性及设备健康水平。</p>
                </div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: '#374151' }}>1.2 作业范围</div>
                  <p style={{ margin: '0 0 8px', textIndent: '2em' }}>本次检修范围涵盖<InlineField field={f('f06')} />，主要包括220kV主变压器本体及附件检查、高压断路器及隔离开关预防性试验、保护装置校验及二次回路检查、接地系统测量等项目。</p>
                </div>
              </div>

              {/* 第二章 */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: '#111827', borderLeft: '3px solid #6366F1', paddingLeft: 10 }}>第二章 作业人员及分工</div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: '#374151' }}>2.1 作业负责人</div>
                  <p style={{ margin: '0 0 8px', textIndent: '2em' }}>作业负责人：<InlineField field={f('f07')} />，持有电力行业高压电工特种作业操作证，负责统筹协调本次检修工作，对作业安全质量全面负责。</p>
                </div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: '#374151' }}>2.2 作业成员</div>
                  <div style={{ textIndent: '2em' }}><InlineField field={f('f08')} /></div>
                </div>
              </div>

              {/* 第三章 */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: '#111827', borderLeft: '3px solid #6366F1', paddingLeft: 10 }}>第三章 安全措施</div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: '#374151' }}>3.1 作业现场平面图</div>
                  <ImageField field={f('f09')} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: '#374151' }}>3.2 安全防护措施</div>
                  <p style={{ margin: '0 0 8px', textIndent: '2em' }}>本次作业须严格执行以下安全防护措施：<InlineField field={f('f10')} />。所有作业人员须经过安全技术交底，熟知本次检修作业危险点及防控措施，严禁无证上岗及违规操作。</p>
                </div>
              </div>

              {/* 第四章 */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: '#111827', borderLeft: '3px solid #6366F1', paddingLeft: 10 }}>第四章 设备信息</div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: '#374151' }}>4.1 设备铭牌照片</div>
                  <ImageField field={f('f11')} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: '#374151' }}>4.2 设备技术参数</div>
                  <p style={{ margin: '0 0 8px', textIndent: '2em' }}>主要设备技术参数如下：<InlineField field={f('f12')} /></p>
                </div>
              </div>

              {/* 第五章 */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: '#111827', borderLeft: '3px solid #6366F1', paddingLeft: 10 }}>第五章 施工工序</div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: '#374151' }}>5.1 工序流程图</div>
                  <ImageField field={f('f13')} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: '#374151' }}>5.2 主要施工步骤</div>
                  <p style={{ margin: '0 0 6px', textIndent: '2em' }}>（一）<strong>准备阶段：</strong>完成作业票办理、安全措施布置、工器具及材料准备，召开班前会，进行安全技术交底；</p>
                  <p style={{ margin: '0 0 6px', textIndent: '2em' }}>（二）<strong>停电倒闸操作：</strong>按操作票顺序进行停电操作，验电、装设接地线，做好安全隔离措施；</p>
                  <p style={{ margin: '0 0 6px', textIndent: '2em' }}>（三）<strong>主变检查：</strong>对主变压器进行外观检查、油位检查、呼吸器更换、密封垫检查及渗漏油处理；</p>
                  <p style={{ margin: '0 0 6px', textIndent: '2em' }}>（四）<strong>断路器试验：</strong>完成SF6气体压力检查、分合闸线圈电阻测量、绝缘电阻测量、直流电阻测量等预防性试验；</p>
                  <p style={{ margin: '0 0 6px', textIndent: '2em' }}>（五）<strong>保护校验：</strong>对主变差动保护、后备保护进行全面校验，核实整定值；</p>
                  <p style={{ margin: '0 0 6px', textIndent: '2em' }}>（六）<strong>恢复送电：</strong>拆除临时接地线，按操作票逐步恢复供电，记录负荷情况；</p>
                  <p style={{ margin: '0 0 6px', textIndent: '2em' }}>（七）<strong>竣工验收：</strong>填写检修记录，整理试验数据，完成竣工报告并归档。</p>
                </div>
              </div>

              {/* 第六章 */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: '#111827', borderLeft: '3px solid #6366F1', paddingLeft: 10 }}>第六章 应急处置</div>
                <p style={{ margin: '0 0 6px', textIndent: '2em' }}>6.1 <strong>人员触电：</strong>立即拉闸断电，对触电者实施心肺复苏，同时拨打120急救电话；</p>
                <p style={{ margin: '0 0 6px', textIndent: '2em' }}>6.2 <strong>设备着火：</strong>使用CO₂灭火器进行扑救，疏散无关人员，上报上级部门；</p>
                <p style={{ margin: '0 0 6px', textIndent: '2em' }}>6.3 <strong>SF6气体泄漏：</strong>立即佩戴防毒面具，开启通风装置，撤离现场，联系专业人员处理；</p>
                <p style={{ margin: '0 0 6px', textIndent: '2em' }}>6.4 <strong>大风雷暴：</strong>立即停止户外作业，人员撤离至安全地带，待气象条件好转后方可恢复。</p>
              </div>

              {/* 第七章 */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: '#111827', borderLeft: '3px solid #6366F1', paddingLeft: 10 }}>第七章 附件</div>
                <p style={{ margin: '0 0 6px', textIndent: '2em' }}>附件一：作业票（变电检修工作票）</p>
                <p style={{ margin: '0 0 6px', textIndent: '2em' }}>附件二：操作票</p>
                <p style={{ margin: '0 0 6px', textIndent: '2em' }}>附件三：设备预防性试验记录表</p>
                <p style={{ margin: '0 0 6px', textIndent: '2em' }}>附件四：人员资质证明文件</p>
                <p style={{ margin: '0 0 6px', textIndent: '2em' }}>附件五：安全技术交底记录</p>
              </div>

              <div style={{ marginTop: 40, paddingTop: 16, borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9ca3af' }}>
                <span>页面：1/3 节：1/1 行：1 列：1 字数：约 2,800</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 拖拽分割线 */}
        <div
          onMouseDown={onDragStart}
          style={{
            width: 4, cursor: 'col-resize', background: 'transparent', flexShrink: 0,
            borderLeft: '1px solid #f0f0f0', transition: 'background 0.15s',
            zIndex: 10,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#c7d2fe')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          title="拖拽调整宽度"
        />

        {/* 右侧面板 */}
        <div style={{ width: sidebarWidth, background: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0, minWidth: 200, maxWidth: 520 }}>

          {/* ── 驳回模式：审批建议头部 ── */}
          {isRejected ? (
            <>
              <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid #f0f0f0', flexShrink: 0, background: '#fff1f2' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#dc2626' }}>⚠ HSE 审批驳回建议</span>
                </div>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>请根据以下审批意见修改方案后重新提交</div>
                <div style={{ background: '#fff', border: '1px solid #fca5a5', borderRadius: 6, padding: '8px 10px' }}>
                  {rejectionLines.map((line, i) => (
                    <div key={i} style={{ fontSize: 11, color: '#7f1d1d', lineHeight: 1.8, display: 'flex', gap: 4 }}>
                      <span style={{ flexShrink: 0, color: '#dc2626' }}>›</span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 驳回模式：受影响字段列表 */}
              <div style={{ padding: '8px 14px 6px', borderBottom: '1px solid #f0f0f0', background: '#fafafa', flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280' }}>需修改的字段</span>
                <span style={{ fontSize: 11, color: '#dc2626', marginLeft: 6 }}>{rejectedFieldIds.size} 项</span>
              </div>

              <div style={{ flex: 1, overflowY: 'auto' }}>
                {FILL_FIELDS.filter(field => rejectedFieldIds.has(field.id)).map(field => {
                  const isSelected = selectedFieldId === field.id;
                  const isDone = field.type === 'text' ? !!fieldValues[field.id] : !!imageValues[field.id];
                  const hasInterpret = !!aiInterprets[field.id];
                  const isInterpreting = aiInterpretId === field.id;

                  return (
                    <div
                      key={field.id}
                      style={{ borderBottom: '1px solid #f5f5f5', background: isSelected ? '#fff5f5' : '#fff', transition: 'background 0.15s' }}
                    >
                      <div
                        onClick={() => handleLocate(field.id)}
                        style={{ padding: '10px 14px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                        onMouseEnter={e => { if (!isSelected) (e.currentTarget.parentElement as HTMLElement).style.background = '#fffafa'; }}
                        onMouseLeave={e => { if (!isSelected) (e.currentTarget.parentElement as HTMLElement).style.background = '#fff'; }}
                      >
                        <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, background: isDone ? '#d1fae5' : '#fee2e2', color: isDone ? '#065f46' : '#dc2626', fontWeight: 600, flexShrink: 0 }}>
                          {isDone ? '已改' : '待改'}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#111827', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{field.label}</span>
                        <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 5, background: '#fee2e2', color: '#dc2626', flexShrink: 0 }}>驳回</span>
                      </div>

                      {/* 展开编辑 + AI解读 */}
                      {isSelected && (
                        <div style={{ padding: '0 14px 12px' }}>
                          {field.type === 'text' ? (
                            <>
                              <textarea
                                value={fieldValues[field.id] || ''}
                                onChange={e => setFieldValues(v => ({ ...v, [field.id]: e.target.value }))}
                                placeholder={`请根据审批建议修改${field.label}...`}
                                rows={3}
                                autoFocus
                                style={{ width: '100%', fontSize: 12, padding: '6px 8px', border: '1px solid #ef4444', borderRadius: 5, resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                              />
                            </>
                          ) : (
                            <label style={{ display: 'block', fontSize: 11, padding: '7px 10px', border: '1px dashed #ef4444', borderRadius: 5, color: '#dc2626', cursor: 'pointer', textAlign: 'center' }}>
                              📎 重新上传图片
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={e => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = ev => setImageValues(v => ({ ...v, [field.id]: ev.target?.result as string }));
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          )}

                          {/* AI 解读按钮 */}
                          {AI_INTERPRET_HINTS[field.id] && (
                            <div style={{ marginTop: 8 }}>
                              <button
                                onClick={() => handleAiInterpret(field.id)}
                                disabled={isInterpreting}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 5,
                                  fontSize: 11, padding: '4px 10px', border: '1px solid #fca5a5',
                                  borderRadius: 6, background: isInterpreting ? '#fff5f5' : '#fff1f2',
                                  color: '#dc2626', cursor: isInterpreting ? 'not-allowed' : 'pointer',
                                  fontWeight: 500,
                                }}
                              >
                                {isInterpreting ? (
                                  <>
                                    <span style={{ display: 'inline-block', width: 10, height: 10, border: '1.5px solid #dc2626', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                                    AI 解读中...
                                  </>
                                ) : (
                                  <>🔍 AI 解读{hasInterpret ? '（重新解读）' : ''}</>
                                )}
                              </button>

                              {hasInterpret && (
                                <div style={{ marginTop: 6, padding: '8px 10px', background: '#fff1f2', border: '1px solid #fca5a5', borderRadius: 7 }}>
                                  <div style={{ fontSize: 11, fontWeight: 600, color: '#dc2626', marginBottom: 5 }}>🔍 AI 解读建议</div>
                                  <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                                    {aiInterprets[field.id]}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* 其余未受影响字段 */}
                <div style={{ padding: '8px 14px 6px', borderBottom: '1px solid #f0f0f0', background: '#fafafa', borderTop: '1px solid #f0f0f0' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280' }}>其他填写项</span>
                </div>
                {FILL_FIELDS.filter(field => !rejectedFieldIds.has(field.id)).map(field => {
                  const isSelected = selectedFieldId === field.id;
                  const isDone = field.type === 'text' ? !!fieldValues[field.id] : !!imageValues[field.id];
                  return (
                    <div
                      key={field.id}
                      style={{ borderBottom: '1px solid #f5f5f5', background: isSelected ? '#f5f5ff' : '#fff' }}
                    >
                      <div
                        onClick={() => handleLocate(field.id)}
                        style={{ padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                        onMouseEnter={e => { if (!isSelected) (e.currentTarget.parentElement as HTMLElement).style.background = '#fafafe'; }}
                        onMouseLeave={e => { if (!isSelected) (e.currentTarget.parentElement as HTMLElement).style.background = '#fff'; }}
                      >
                        <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, background: isDone ? '#d1fae5' : '#fef3c7', color: isDone ? '#065f46' : '#92400e', fontWeight: 600, flexShrink: 0 }}>
                          {isDone ? '已填' : '待填'}
                        </span>
                        <span style={{ fontSize: 12, color: '#374151', flex: 1 }}>{field.label}</span>
                      </div>
                      {isSelected && (
                        <div style={{ padding: '0 14px 10px' }}>
                          {field.type === 'text' ? (
                            <textarea
                              value={fieldValues[field.id] || ''}
                              onChange={e => setFieldValues(v => ({ ...v, [field.id]: e.target.value }))}
                              placeholder={`请输入${field.label}...`}
                              rows={2}
                              autoFocus
                              style={{ width: '100%', fontSize: 12, padding: '6px 8px', border: '1px solid #6366F1', borderRadius: 5, resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                            />
                          ) : (
                            <label style={{ display: 'block', fontSize: 11, padding: '7px 10px', border: '1px dashed #6366F1', borderRadius: 5, color: '#6366F1', cursor: 'pointer', textAlign: 'center' }}>
                              📎 点击上传图片
                              <input type="file" accept="image/*" style={{ display: 'none' }}
                                onChange={e => {
                                  const file = e.target.files?.[0];
                                  if (file) { const reader = new FileReader(); reader.onload = ev => setImageValues(v => ({ ...v, [field.id]: ev.target?.result as string })); reader.readAsDataURL(file); }
                                }}
                              />
                            </label>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* ── 正常模式：待填清单 ── */
            <>
              <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 8 }}>待填清单</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[
                    { label: `全部 ${FILL_FIELDS.length}`, bg: '#f3f4f6', color: '#374151' },
                    { label: `待填 ${FILL_FIELDS.length - completedCount}`, bg: '#fef3c7', color: '#92400e' },
                    { label: `已填 ${completedCount}`, bg: '#d1fae5', color: '#065f46' },
                  ].map(({ label, bg, color }, i) => (
                    <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: bg, color, fontWeight: 500 }}>{label}</span>
                  ))}
                </div>
                {/* 全部完成提示 */}
                {allCompleted && (
                  <div style={{ marginTop: 10, padding: '8px 10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6 }}>
                    <div style={{ fontSize: 12, color: '#15803d', fontWeight: 600 }}>✓ 所有字段已填写完成</div>
                    <div style={{ fontSize: 11, color: '#166534', marginTop: 2 }}>请点击顶部「提交审批」按钮提交 HSE 审批</div>
                  </div>
                )}
              </div>

              <div style={{ flex: 1, overflowY: 'auto' }}>
                {Object.entries(fieldsByChapter).map(([chapter, fields]) => (
                  <div key={chapter}>
                    <div style={{ padding: '7px 14px 5px', fontSize: 11, fontWeight: 600, color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #f0f0f0', borderTop: '1px solid #f0f0f0' }}>
                      {chapter}
                    </div>
                    {fields.map(field => {
                      const isSelected = selectedFieldId === field.id;
                      const isDone = field.type === 'text' ? !!fieldValues[field.id] : !!imageValues[field.id];
                      const hasAiSuggestion = !!aiSuggestions[field.id];
                      const isAiLoading = aiLoadingId === field.id;

                      return (
                        <div
                          key={field.id}
                          style={{ borderBottom: '1px solid #f5f5f5', background: isSelected ? '#f5f5ff' : '#fff', transition: 'background 0.15s' }}
                        >
                          <div
                            onClick={() => handleLocate(field.id)}
                            style={{ padding: '10px 14px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                            onMouseEnter={e => { if (!isSelected) (e.currentTarget.parentElement as HTMLElement).style.background = '#fafafe'; }}
                            onMouseLeave={e => { if (!isSelected) (e.currentTarget.parentElement as HTMLElement).style.background = '#fff'; }}
                          >
                            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, background: isDone ? '#d1fae5' : '#fef3c7', color: isDone ? '#065f46' : '#92400e', fontWeight: 600, flexShrink: 0 }}>
                              {isDone ? '已填' : '待填'}
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#111827', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{field.label}</span>
                            <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 5, background: field.type === 'image' ? '#e0e7ff' : '#f0fdf4', color: field.type === 'image' ? '#4338ca' : '#047857', flexShrink: 0 }}>
                              {field.type === 'image' ? '图片' : '文字'}
                            </span>
                          </div>

                          {isSelected && (
                            <div style={{ padding: '0 14px 12px' }}>
                              {field.type === 'text' ? (
                                <>
                                  <textarea
                                    value={fieldValues[field.id] || ''}
                                    onChange={e => setFieldValues(v => ({ ...v, [field.id]: e.target.value }))}
                                    placeholder={`请输入${field.label}...`}
                                    rows={3}
                                    autoFocus
                                    style={{ width: '100%', fontSize: 12, padding: '6px 8px', border: '1px solid #6366F1', borderRadius: 5, resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                                  />
                                  {AI_SUGGESTIONS[field.id] && (
                                    <div style={{ marginTop: 6 }}>
                                      <button
                                        onClick={() => handleAiOptimize(field.id)}
                                        disabled={isAiLoading}
                                        style={{
                                          display: 'flex', alignItems: 'center', gap: 5,
                                          fontSize: 11, padding: '4px 10px', border: '1px solid #c7d2fe',
                                          borderRadius: 6, background: isAiLoading ? '#f5f3ff' : '#f0f4ff',
                                          color: '#6366F1', cursor: isAiLoading ? 'not-allowed' : 'pointer',
                                          fontWeight: 500, transition: 'all 0.15s',
                                        }}
                                      >
                                        {isAiLoading ? (
                                          <>
                                            <span style={{ display: 'inline-block', width: 10, height: 10, border: '1.5px solid #6366F1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                                            AI 生成中...
                                          </>
                                        ) : (
                                          <>✨ AI 优化{hasAiSuggestion ? '（重新生成）' : ''}</>
                                        )}
                                      </button>
                                      {hasAiSuggestion && (
                                        <div style={{ marginTop: 6, padding: '8px 10px', background: '#f0f4ff', border: '1px solid #c7d2fe', borderRadius: 7 }}>
                                          <div style={{ fontSize: 11, fontWeight: 600, color: '#6366F1', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <span>✨</span> AI 优化建议
                                          </div>
                                          <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.7, marginBottom: 8 }}>
                                            {aiSuggestions[field.id]}
                                          </div>
                                          <div style={{ display: 'flex', gap: 6 }}>
                                            <button
                                              onClick={() => handleApplySuggestion(field.id)}
                                              style={{ fontSize: 11, padding: '3px 10px', border: 'none', borderRadius: 5, background: '#6366F1', color: '#fff', cursor: 'pointer', fontWeight: 500 }}
                                            >采纳</button>
                                            <button
                                              onClick={() => setAiSuggestions(prev => { const n = { ...prev }; delete n[field.id]; return n; })}
                                              style={{ fontSize: 11, padding: '3px 10px', border: '1px solid #e5e7eb', borderRadius: 5, background: '#fff', color: '#6b7280', cursor: 'pointer' }}
                                            >忽略</button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div>
                                  <label style={{ display: 'block', fontSize: 11, padding: '7px 10px', border: '1px dashed #6366F1', borderRadius: 5, color: '#6366F1', cursor: 'pointer', textAlign: 'center' }}>
                                    📎 点击上传图片
                                    <input
                                      type="file"
                                      accept="image/*"
                                      style={{ display: 'none' }}
                                      onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onload = ev => setImageValues(v => ({ ...v, [field.id]: ev.target?.result as string }));
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                  </label>
                                  {imageValues[field.id] && (
                                    <div style={{ marginTop: 6, textAlign: 'center' }}>
                                      <img src={imageValues[field.id]} alt="preview" style={{ maxWidth: '100%', maxHeight: 80, objectFit: 'contain', borderRadius: 4 }} />
                                      <button
                                        onClick={() => setImageValues(v => { const n = { ...v }; delete n[field.id]; return n; })}
                                        style={{ display: 'block', margin: '4px auto 0', fontSize: 11, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                                      >
                                        删除图片
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default OperationPlanEditor;
