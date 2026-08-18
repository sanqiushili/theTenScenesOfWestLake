import React, { useEffect, useState } from 'react';
import { ALIAS_SUGGESTIONS } from '../../utils/personalize';
import { X, PenLine } from 'lucide-react';

interface AliasModalProps {
  open: boolean;
  initial?: string;
  /** 标题（首次题名 / 改题名 文案不同） */
  title?: string;
  subtitle?: string;
  onConfirm: (alias: string) => void;
  onClose?: () => void;
}

/**
 * 题名弹窗（受控）。
 * - 首次盖印时询问「留下你的别号」，确认后立刻盖印；
 * - 图册内可再次打开修改题名。
 * 点选预设别号或手输，空值回退默认「西湖客」。
 */
export const AliasModal: React.FC<AliasModalProps> = ({
  open,
  initial = '',
  title = '留下你的别号',
  subtitle = '给这卷游历图册题个名，往后每张明信片都盖你的印',
  onConfirm,
  onClose
}) => {
  const [value, setValue] = useState(initial);

  useEffect(() => {
    if (open) setValue(initial);
  }, [open, initial]);

  if (!open) return null;

  const confirm = () => onConfirm(value.trim() || '西湖客');

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[#1A1A1A]/70 backdrop-blur-md p-4 animate-ink-fade pointer-events-auto">
      <div className="glass-ink-panel p-5 sm:p-7 rounded-3xl w-[min(92vw,26rem)] border-2 border-[#C5A55A] shadow-2xl relative">
        <button
          onClick={() => (onClose ? onClose() : onConfirm('西湖客'))}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-[#2C2C2C]/10 text-[#555555] cursor-pointer"
          title="跳过"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <PenLine className="w-5 h-5 text-[#B83B32]" />
          <h3 className="text-lg font-bold tracking-widest text-[#2C2C2C]">{title}</h3>
        </div>
        <p className="text-xs text-[#6B6B6B] tracking-wide mb-4 leading-relaxed">{subtitle}</p>

        <input
          autoFocus
          value={value}
          maxLength={8}
          placeholder="如：临安散人 / 西湖客"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') confirm();
          }}
          className="w-full px-4 py-3 rounded-xl border-2 border-[#2C2C2C]/15 bg-[#F7F3EA] text-[#2C2C2C] text-base tracking-widest outline-none focus:border-[#C5A55A] transition-colors"
        />

        <p className="text-[11px] text-[#8A8A8A] mt-2 mb-2 tracking-wide">快捷别号（点选即填）：</p>
        <div className="flex flex-wrap gap-2 mb-5">
          {ALIAS_SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setValue(s)}
              className={`px-3 py-1.5 rounded-full text-xs cursor-pointer transition-all border ${
                value === s
                  ? 'bg-[#B83B32] text-[#F4F1EA] border-[#B83B32]'
                  : 'bg-[#F4F1EA] text-[#555555] border-[#2C2C2C]/20 hover:border-[#C5A55A]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <button
          onClick={confirm}
          className="w-full flex items-center justify-center gap-2 rounded-full font-semibold py-3 bg-[#F4F1EA] text-[#2C2C2C] border border-[#2C2C2C]/20 hover:bg-[#2C2C2C] hover:text-[#F4F1EA] hover:border-[#2C2C2C] transition-colors cursor-pointer"
        >
          题名并继续
        </button>
      </div>
    </div>
  );
};
