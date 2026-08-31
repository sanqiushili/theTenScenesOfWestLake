# 西湖十景 · 新中式数字水墨 3D 沉浸漫游

<div align="center">

[![Live Demo](https://img.shields.io/badge/Live_Demo-xihu10.sqsl.art-blue?style=for-the-badge&logo=cloudflare&logoColor=white)](https://xihu10.sqsl.art)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r168-black?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

<p align="center">
  <b>融宋代水墨写意美学与现代 Shader/流体/体素算法于一体的三维数字山水空间</b>
</p>

[在线体验 (Live Demo)](https://xihu10.sqsl.art) · [开发规范准则 (PRD Docs)](#-开发规范文档目录) · [快速上手](#-快速上手)

</div>

---

## 📖 项目简介 (Introduction)

**西湖十景 (The Ten Scenes of West Lake)** 是一个基于 **Three.js (React Three Fiber)** 与 **Voxel 体素算法** 构建的新中式数字水墨 3D 沉浸漫游 Web 空间。

项目打破传统「静态图文 + 旋转 3D 模型」的陈旧展示形式，将**宋代青绿/水墨写意美学**与**现代着色器（Shaders）、程序化粒子系统、空间音频模拟**深度融合，呈现一个可自由穿梭、交互盖印、感知时空流转的数字西湖。

---

## ✨ 核心特色 (Core Features)

### 1. 🏞️ 西湖十景 3D 沉浸空间
- **总览长卷与三维俯冲**：自西湖天际俯瞰长卷（OverviewScene）起，通过三维贝塞尔曲线平滑运镜俯冲至各景点。
- **十景特色交互与 Shader 意境**：
  - **苏堤春晓**：风场向量驱动柳枝柔性摆动与落英花瓣粒子。
  - **三潭印月**：屏幕空间水面反射 (SSR) 与月影折射光晕。
  - **断桥残雪**：积雪消融 Vertex Shader 动态过渡。
  - **曲院风荷**：荷叶半透光次表面散射 (SSS) 与露珠滚动。
  - **雷峰夕照**：强逆光金边 Fresnel Rim Light 与落日余晖。
  - **南屏晚钟**：古钟撞击声波涟漪 Shader 与白鹭惊飞群聚算法。
  - **柳浪闻莺**、**花港观鱼**、**双峰插云**、**灵峰探梅** 等沉浸场景。

### 2. 📜 个性化游历手札与盖印打卡
- **专属题名与落款**：首次盖印可定制游历题名（如「西湖客」），手写体定格于明信片之上。
- **古典篆刻印章**：每个景点均配有专属印章交互，盖印时伴随沉浸音效与镜头特写。
- **《西湖游历图册》高清导出**：
  - 支持 **3:4（竖版）**、**1:1（正方）**、**16:9（横版）** 多种画卷比例。
  - 高分辨率矢量装裱生成，支持一键保存至系统相册或下载。

### 3. 🎨 纯代码程序化构建（零外部 3D 资产依赖）
- 场景内所有山水、亭台、宝塔、拱桥与舟船均由 **Voxel 算法程序化生成**，无须下载臃肿的外部 GLTF/OBJ 模型包，首屏极速加载。
- 内置宣纸纤维噪点、水墨描边后处理（Post-Processing Inking）与四季动态粒子。

### 4. 🎵 Web Audio API 程序化乐音合成
- 摆脱静态音频文件依赖，使用纯 Web Audio 振荡器（Oscillator）实时物理建模合成：
  - 南屏晚钟低沉回荡钟声
  - 湖面晨露水滴声
  - 柳浪黄莺空灵啼鸣
  - 金石篆刻盖印音效

---

## 🛠️ 技术栈 (Tech Stack)

- **核心框架**：React 18 + TypeScript + Vite 5
- **3D 渲染**：Three.js + React Three Fiber (`@react-three/fiber`) + Drei (`@react-three/drei`)
- **后期效果**：`@react-three/postprocessing` (Edge Inking / Bloom / ToneMapping)
- **动效管线**：GSAP (GreenSock) + Canvas 2D 矢量图册渲染
- **音频系统**：Web Audio API (Procedural Synthesizer)
- **样式工程**：Tailwind CSS + 经典宋代宋体/楷书排版体系

---

## 🚀 快速上手 (Quick Start)

### 环境要求
- Node.js ≥ 18.0.0
- npm / pnpm / yarn

### 安装与运行

```bash
# 1. 克隆仓库
git clone https://github.com/sanqiushili/theTenScenesOfWestLake.git
cd theTenScenesOfWestLake

# 2. 安装依赖
npm install

# 3. 启动本地开发服务
npm run dev
```

本地服务启动后，浏览器访问 `http://localhost:5173` 即可开启游历。

### 项目构建

```bash
# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

### 小红书「小工具」离线打包（可选）

本项目内置了针对特定轻量级容器（如小红书小工具）的 IIFE 隔离打包流水线：

```bash
node minitool/build.mjs
```
该命令会自动完成离线字体子集化、CSP 合规扫描、无外部依赖打包并生成 `minitool.zip`。

---

## 📂 项目结构 (Project Structure)

```text
├── docs/                       # 完整的开发规范与美学准则 PRD 文档
│   ├── 01-项目概述与美学规范.md
│   ├── 02-交互框架与漫游动线.md
│   ├── 03-十景视觉与特色交互设计.md
│   ├── 04-UI与内容层规范.md
│   └── 05-技术架构与性能优化.md
├── public/                     # 公共静态资源（Favicon、字体等）
├── src/
│   ├── audio/                  # Web Audio 程序化音效引擎
│   ├── components/
│   │   ├── canvas/             # 3D 场景、相机运镜、后处理与粒子
│   │   ├── scenes/             # 西湖十景各自的独立 3D 场景组件
│   │   └── ui/                 # 诗词悬浮层、印章交互、游历图册、导航栏
│   ├── store/                  # Zustand 全局状态管理
│   ├── utils/                  # 图册渲染、个性化短句与截图算法
│   └── voxel/                  # 体素调色板、体素模型生成器与粒子
├── minitool/                   # 小工具专项打包与字体子集化脚本
└── wrangler.toml               # Cloudflare Pages 部署配置
```

---

## 📚 开发规范文档目录

本项目配有详尽的美学与技术设计规范，欢迎查阅深入了解：

1. 📜 [第一章：项目概述与美学规范](docs/01-项目概述与美学规范.md)
2. 🌊 [第二章：核心交互框架与漫游动线](docs/02-交互框架与漫游动线.md)
3. 🏯 [第三章：十景视觉与特色交互设计](docs/03-十景视觉与特色交互设计.md)
4. 🏮 [第四章：页面内容层与 UI 设计规范](docs/04-UI与内容层规范.md)
5. ⚡ [第五章：技术架构与性能优化规范](docs/05-技术架构与性能优化.md)

---

## 📄 开源许可 (License)

本项目基于 [MIT 许可证](LICENSE) 开源。

*注：项目内引用的中文字体（Ma Shan Zheng、Noto Serif SC）遵循 [SIL Open Font License 1.1](https://openfontlicense.org/) 许可。*

---

<div align="center">
  <sub>Made with ♥ by <a href="https://sqsl.art">三秋十李</a></sub>
</div>
