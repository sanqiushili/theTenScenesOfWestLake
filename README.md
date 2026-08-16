# 西湖十景 · 新中式数字水墨 Three.js 沉浸网站

> **项目名称：** 西湖十景 · 新中式数字水墨 3D 沉浸网站  
> **设计理念：** 融宋代水墨写意美学与现代 Shader/流体/程序化粒子于一体  
> **文档版本：** v1.0.0 规范准则开发产品文档 (PRD)

---

## 📚 开发规范文档目录 (Documentation Index)

本项目已建立完整的开发规范准则文档，分为五个核心章节：

1. [第一章：项目概述与美学规范](docs/01-项目概述与美学规范.md)
   - 核心设计原则（写意优于写实、虚实相生）
   - 宋画青绿/石青/赭石/宣纸色谱体系与昼夜/四季光照色温偏移
   - 宣纸纤维噪点 Shader、Post-Processing Edge Inking（水墨描边）
   - 八重后处理渲染管线（SSAO, SSR, DoF, Bloom, Color Grading, Film Grain, Vignette）

2. [第二章：核心交互框架与漫游动线](docs/02-交互框架与漫游动线.md)
   - 卷轴式天际俯瞰长卷（OverviewScene）与三维贝塞尔曲线俯冲运镜
   - 交互手势：GPU Instanced 墨迹拖尾粒子、水面流体涟漪扩散
   - ScrollTrigger 滚轮三维驱动（镜头、时间流转、诗词叙事）
   - 3D 空间音频（Web Audio API / Howler.js）定位与场景过渡水墨晕染

3. [第三章：十景视觉与特色交互设计](docs/03-十景视觉与特色交互设计.md)
   - **苏堤春晓**：程序化风场向量场 + 柳枝柔性摆动 Shader + 3,000 落英花瓣粒子
   - **三潭印月**：屏幕空间水面反射 (SSR) + 15 孔金光透射与多重月影折射 Shader
   - **断桥残雪**：融雪 Vertex Shader + 材质溶解 (Dissolve) 滑块控制
   - **曲院风荷**：荷叶半透光次表面散射 (SSS) Shader + 荷叶露珠物理滚动
   - **雷峰夕照**：大气散射天空盒 + 强逆光金边 Fresnel Rim Light Shader
   - **南屏晚钟**：古钟撞击 + 声波形变波纹 Shader (Audio Visualizer) + Flocking 白鹭惊飞

4. [第四章：页面内容层与 UI 设计规范](docs/04-UI与内容层规范.md)
   - 宋代刻本与拓片风格排版，竖排非对称文本流 (Vertical Writing Mode)
   - 专属篆刻印章 UI 系统与《西湖游历图册》Canvas 生成导出
   - 3D 视差悬浮诗词文本 (Parallax Poetry Overlay)
   - 页面 UI 层级架构 (Z-Index Hierarchy)

5. [第五章：技术架构与性能优化规范](docs/05-技术架构与性能优化.md)
   - React Three Fiber (R3F) + Drei + GSAP + Custom GLSL Shaders 架构
   - 模型 Draco/Meshopt 压缩、烘焙与单场景 < 2MB 预算
   - InstancedMesh 与 GPU 动画
   - 三级 LOD 策略与分块流式预加载 (Chunk Streaming)
   - 性能预算与降级清单 (FPS < 45 时的自动降级机制)

---

## 🚀 快速开始与开发建议

### 推荐技术栈
- **Node.js** ≥ 18.0.0
- **Three.js** ≥ r160
- **React Three Fiber (R3F)** ≥ 8.0
- **GSAP** ≥ 3.12

### 研发执行路线
1. **基础管线搭设**：搭建 8 重后处理管线与宣纸纤维/水墨描边 Shader（参照第 1 章）。
2. **Camera Rig & 转场**：实现长卷俯瞰与三维贝塞尔曲线俯冲运镜（参照第 2 章）。
3. **十景 Shader 开发**：依次开发苏堤春晓、三潭印月等 6 大核心场景的 GLSL Shader 与特效（参照第 3 章）。
4. **UI & 印章图册**：开发竖排诗词、篆刻印章组件及《西湖游历图册》导出功能（参照第 4 章）。
5. **性能调优与测试**：针对移动端与中低配设备进行 LOD、Instancing 与后处理降级（参照第 5 章）。
