# jsPsych 模糊辨别实验

这是从 PsychoPy 本地实验迁移到 jsPsych 8 的网页版模糊辨别实验。当前版本可在 GitHub Pages 或本地静态服务器运行，核心流程、预实验校准、正式实验生成和数据导出均在浏览器端完成。

- 在线实验：https://btgly.github.io/jsPsych-blur-experiment/
- 算法验证页：https://btgly.github.io/jsPsych-blur-experiment/golden-test.html

## 实验流程

```text
参数页 → 欢迎页 → 练习 → 预实验 → 个体化校准
→ 生成正式实验 block → 正式实验 → 数据 ZIP 下载
```

- 练习：F/K 判断，按住时长表示信心，逐题显示完整反馈。
- 预实验：3 组，每组 60 个 trial，用于估计被试个人难度水平。
- 校准：浏览器端执行 logistic 拟合、PAVA 单调校正和 D1-D6 alpha 选择。
- 正式实验：11 轮，每轮 100 个 trial，总计 1100 个 trial。
- 全屏：点击“开始实验”后自动请求浏览器全屏。
- 提前结束：按 `Esc` 会结束实验，并下载已有数据。

## 本地运行

仓库是纯静态网页，不需要构建。

```powershell
python -m http.server 8000 --directory .
```

然后用 Chrome 或 Edge 打开：

```text
http://localhost:8000/
```

算法相关改动后，打开：

```text
http://localhost:8000/golden-test.html
```

## 项目结构

```text
index.html                  实验入口
golden-test.html            校准算法验证页
conditions/                 条件 CSV
assets/                     刺激图片、练习/预实验数据集、manifest
styles/task.css             实验界面样式
src/main.js                 主流程编排、全屏、提前结束、数据导出
src/timeline/               欢迎、练习、预实验、正式实验 timeline
src/task/                   hold-response trial、反馈和指导语
src/calibration/            logistic、PAVA、alpha 选择、正式 trial 生成
src/data/                   数据 schema、summary、CSV/ZIP 导出
```

## 启动参数

参数页包含：

- `participant`：被试编号，例如 `S001`。
- `practice_count`：练习 trial 数，默认 24，可设为 0 跳过练习。
- `start_group` / `end_group`：正式实验运行轮次，范围 1-11，支持分段实验。
- `run_pretest`：是否运行预实验。

如果一个被试分多次完成正式实验，可固定同一个被试编号，并设置不同轮次范围，例如 `1-2`、`3-5`、`6-8`、`9-11`。

## 当前数据保存方式

当前版本在实验结束或按 `Esc` 提前结束时，自动在被试电脑下载一个 ZIP。GitHub Pages 只托管静态文件，不能把数据直接写回 GitHub 仓库。

ZIP 内包含：

```text
{subject}_raw_data.csv
{subject}_pretest_alpha_summary.csv
{subject}_calibration_summary.csv
{subject}_formal_block_distribution_summary.csv
{subject}_formal_block_01.csv ... {subject}_formal_block_11.csv
```

说明：

- `raw_data.csv` 保存实际作答数据，包含练习、预实验、正式实验和提前结束标记。
- `formal_block_*.csv` 保存正式实验生成出来的 block/trial 计划和抽图结果。
- `calibration_summary.csv` 和 `pretest_alpha_summary.csv` 保存预实验校准结果。

## 后端/数据库建议

如果要自动集中收集数据，建议采用“对象文件存储 + 数据库索引”的方式，而不是一开始把所有 trial 都拆进数据库。

推荐服务端目录结构：

```text
subjects/
  S001/
    sessions/
      2026-06-27_15h30m20s/
        raw/
          raw_data.csv
          practice_trials.csv
          pretest_trials.csv
          formal_trials.csv
        generated/
          formal_block_01.csv
          ...
          formal_block_11.csv
          formal_block_distribution_summary.csv
        calibration/
          pretest_alpha_summary.csv
          calibration_summary.csv
        package/
          S001_experiment_2026-06-27_15h30m20s.zip
```

数据库只保存索引和状态：

```text
subjects: subject_id, upload_code, note
sessions: session_id, subject_id, started_at, ended_at, status, abort_reason
files: session_id, file_type, storage_path, checksum, uploaded_at
```

前端接口可设计为：

```http
POST /api/sessions/start
POST /api/sessions/{session_id}/upload
POST /api/sessions/{session_id}/finish
```

上传成功后页面显示“数据已上传完成”。上传失败时仍保留本地 ZIP 下载作为兜底。正式部署时不要只依赖被试编号鉴权，建议给每个被试一个 `upload_code`，防止他人伪造上传。

## 部署

推送到 GitHub 后，在仓库 Settings → Pages 中启用 GitHub Pages，来源选择 `master` 分支根目录。

当前代码依赖 CDN 加载 jsPsych、PapaParse 和 JSZip，因此实验电脑需要能访问对应 CDN。
