# Repository Guidelines

## Project Structure & Module Organization

This repository is a static jsPsych 8 blur-discrimination experiment. `index.html` is the main entry point and `golden-test.html` is used to verify calibration behavior. Core ES modules live in `src/`: `main.js` orchestrates the timeline, `timeline/` defines experiment phases, `task/` contains trial UI and response logic, `calibration/` contains logistic/PAVA/alpha-selection algorithms, and `data/` handles schemas, summaries, and CSV/ZIP export. Trial CSVs are in `conditions/`. Stimulus images and pilot datasets are in `assets/`; avoid reorganizing these paths without updating manifests and path helpers. Styles are in `styles/task.css`.

## Build, Test, and Development Commands

No build step is required; dependencies are loaded by CDN and browser ES modules.

- `python -m http.server 8000 --directory .`: serve the experiment locally from the repository root.
- `.\start-server.ps1`: Windows PowerShell helper for local serving.
- `start-server.bat`: Windows batch alternative.
- Open `http://localhost:8000/` for the main task and `http://localhost:8000/golden-test.html` for calibration checks.

Run from the repository root so relative paths to `src/`, `conditions/`, and `assets/` resolve correctly.

## Coding Style & Naming Conventions

Use modern JavaScript ES modules with named exports where practical. Match the existing style: two-space indentation, single quotes, no semicolons, `camelCase` for functions and variables, and descriptive module names such as `formal-generator.js` or `export-csv.js`. Keep algorithm code deterministic and side-effect-light; browser interaction should stay in timeline/task modules. Preserve existing CSV field names and exported data schemas unless the downstream data format is intentionally changed.

## Testing Guidelines

There is no automated test framework configured. Validate changes by running the local server and completing the relevant task path in a current Chrome or Edge browser. Use `golden-test.html` after edits to `src/calibration/`, `src/random.js`, condition loading, or formal trial generation. For data changes, download the generated ZIP and inspect raw, summary, calibration, and formal block CSV outputs.

## Commit & Pull Request Guidelines

Recent commits use concise, imperative summaries, for example `Add README with project overview and usage instructions`. Keep commits focused on one behavioral or documentation change. Pull requests should describe the experiment path affected, list local verification performed, link related issues when available, and include screenshots or downloaded-output notes for UI or export changes.

## Security & Configuration Tips

Do not commit participant data, generated ZIP exports, logs, or local dependency folders. Treat stimulus manifests and condition CSVs as versioned experiment inputs; document any change that can affect randomization, calibration, or exported analysis fields.
