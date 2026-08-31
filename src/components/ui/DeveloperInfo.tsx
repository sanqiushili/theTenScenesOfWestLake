import React, { useState } from 'react';
import { Info, X, Globe, Twitter, Github } from 'lucide-react';

/**
 * 开发者信息浮钮 + 弹出卡片。
 * 固定在右下角浮钮区，与声音/图册按钮并排。
 * 点击展开极简卡片，引流到 GitHub、个人网站和 Twitter（X）。
 */
export const DeveloperInfo: React.FC = () => {
  // 小红书小工具容器内不显示（外链无法跳转）
  if (typeof __MINITOOL__ !== 'undefined' && __MINITOOL__) return null;

  const [open, setOpen] = useState(false);

  return (
    <>
      {/* 触发按钮：glass-ink-panel 风格，与同排浮钮一致 */}
      <button
        onClick={() => setOpen(true)}
        className="glass-ink-panel p-3 rounded-full cursor-pointer shadow-lg hover:border-[#C5A55A] hover:scale-105 transition-all text-[#2C2C2C]"
        title="关于开发者"
      >
        <Info className="w-5 h-5" />
      </button>

      {/* 弹出卡片 */}
      {open && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-[#1A1A1A]/50 backdrop-blur-sm p-4 animate-ink-fade"
          onClick={() => setOpen(false)}
        >
          <div
            className="glass-ink-panel relative rounded-3xl border-2 border-[#C5A55A]/50 bg-[#F4F1EA]/95 p-6 sm:p-7 w-[min(90vw,22rem)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 关闭 */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-[#2C2C2C]/10 text-[#555555] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* 品牌标识 */}
            <div className="text-center mb-4">
              <img
                src="/avatar.jpeg"
                alt="三秋十李"
                className="inline-block w-16 h-16 rounded-full object-cover mb-2 ring-2 ring-[#C5A55A]/40 shadow-md"
              />
              <h3 className="text-lg font-bold tracking-widest text-[#2C2C2C]">三秋十李</h3>
              <p className="text-xs text-[#6B6B6B] tracking-wide mt-1">
                独立开发 · 数字艺术 · 体素西湖
              </p>
            </div>

            {/* 简介 */}
            <p className="text-sm text-[#555555] leading-relaxed text-center mb-5">
              用体素与水墨重构西湖十景，漫游、盖印、留影——一卷属于你的数字游历图册。
            </p>

            {/* 分割线 */}
            <div className="h-px bg-[#2C2C2C]/10 mb-4" />

            {/* 外链 */}
            <div className="flex flex-col gap-2.5">
              <a
                href="https://github.com/sanqiushili/theTenScenesOfWestLake"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#F4F1EA] text-[#2C2C2C] border border-[#2C2C2C]/15 hover:bg-[#2C2C2C] hover:text-[#F4F1EA] hover:border-[#2C2C2C] transition-colors cursor-pointer"
              >
                <Github className="w-4 h-4 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">GitHub 源码仓库</p>
                  <p className="text-xs opacity-70 truncate">sanqiushili/theTenScenesOfWestLake</p>
                </div>
              </a>
              <a
                href="https://sqsl.art"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#F4F1EA] text-[#2C2C2C] border border-[#2C2C2C]/15 hover:bg-[#2C2C2C] hover:text-[#F4F1EA] hover:border-[#2C2C2C] transition-colors cursor-pointer"
              >
                <Globe className="w-4 h-4 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">个人网站</p>
                  <p className="text-xs opacity-70 truncate">sqsl.art</p>
                </div>
              </a>
              <a
                href="https://x.com/LgyLight"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#F4F1EA] text-[#2C2C2C] border border-[#2C2C2C]/15 hover:bg-[#2C2C2C] hover:text-[#F4F1EA] hover:border-[#2C2C2C] transition-colors cursor-pointer"
              >
                <Twitter className="w-4 h-4 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Twitter / X</p>
                  <p className="text-xs opacity-70 truncate">@LgyLight</p>
                </div>
              </a>
            </div>

            {/* 底部署名 */}
            <p className="text-center text-[10px] text-[#8A8A8A] tracking-widest mt-5">
              © 2026 三秋十李 · Crafted with ♥
            </p>
          </div>
        </div>
      )}
    </>
  );
};
