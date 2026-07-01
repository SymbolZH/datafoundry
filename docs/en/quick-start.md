# Quick start

This guide is for first-time DataFoundry users. After reading it, you can start the Web workbench, configure a model service, and run a data analysis task against the built-in DuckDB demo data source.

You do not need a database for the first run. You only need Node.js, npm, and a model API key compatible with the OpenAI `/chat/completions` interface.

## Requirements

- Node.js >= 22
- npm
- Linux, macOS, or Windows
- A model API key—for example Qwen, DeepSeek, or another OpenAI-compatible service

On Windows, install and run the project in the same environment. Do not share `node_modules` between Windows and WSL.

## 1. Install dependencies

From the repository root:

```bash
node -v
npm install
```

`node -v` must report 22 or higher. The first install compiles workspace dependencies; time depends on your machine and network.

## 2. Configure the model

Copy the environment templates:

```bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
```

Edit the root `.env` and set model configuration:

```bash
LLM_PROVIDER=openai-compatible
LLM_MODEL=qwen-plus
LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
LLM_API_KEY=your-api-key
```

DeepSeek example:

```bash
LLM_PROVIDER=openai-compatible
LLM_MODEL=deepseek-chat
LLM_BASE_URL=https://api.deepseek.com
LLM_API_KEY=your-api-key
```

The frontend connects to the local backend by default:

```bash
NEXT_PUBLIC_AGENT_RUNTIME_URL=http://127.0.0.1:8787/api/copilotkit
```

If you did not change the backend port, keep the default in `apps/web/.env.local`.

## 3. Start the Web workbench

```bash
npm run dev
```

Then open:

- Web workbench: [http://127.0.0.1:3000/data-tasks](http://127.0.0.1:3000/data-tasks)
- Backend health check: [http://127.0.0.1:8787/healthz](http://127.0.0.1:8787/healthz)

You can also start services separately:

```bash
npm run dev:api
npm run dev:web
```

## 4. Run your first question

On `/data-tasks`:

1. Click **New data task**.
2. Keep the built-in DuckDB demo data source.
3. Select **Server default** or your configured model next to the input box.
4. Send your first question.

Suggested questions:

```text
List the tables in this data source and describe the main fields of each table.
```

For aggregation:

```text
Count orders and total GMV by channel in the orders table.
```

When you see schema inspection, SQL execution, and result outputs, the local path is working.

## 5. Start the TUI

With the backend running:

```bash
npm run start:tui
```

Demo mode does not require the backend:

```bash
npm run start:tui -- --demo
```

Resume the latest server session:

```bash
npm run start:tui -- --resume
```

See [TUI guide](guides/tui.md) for more commands.

## 6. Troubleshooting

### Wrong Node version

Symptom: Node version errors during `npm install` or build.

Fix:

```bash
node -v
```

Upgrade to Node.js 22 or higher, then run `npm install` again.

### Page does not load

Symptom: Browser cannot open `http://127.0.0.1:3000/data-tasks`.

Fix:

- Confirm `npm run dev` is still running.
- Check whether port 3000 is in use.
- If 3000 is taken, use the frontend port shown in terminal output.

### Backend not running

Symptom: Page loads but questions get no response, or the resource panel fails to load.

Fix:

```bash
curl http://127.0.0.1:8787/healthz
```

If the health check fails, restart:

```bash
npm run dev:api
```

### Model unavailable

Symptom: Agent run reports provider, 401, rate limit, or model not found errors.

Fix:

- Check `LLM_API_KEY` in `.env`.
- Confirm `LLM_BASE_URL` matches your provider's compatible endpoint.
- Confirm `LLM_MODEL` is available on your account.
- Run the test action in the Web workbench model configuration.

### Port conflicts

Default ports:

| Service | Port |
| --- | --- |
| Web | 3000 |
| API | 8787 |

If a port is in use, stop the occupying process or use the new port from terminal output. After changing the backend port, update `NEXT_PUBLIC_AGENT_RUNTIME_URL`.

### Database connection failures

- Server databases such as PostgreSQL and MySQL must be reachable on the network.
- SQLite, CSV, Excel, and DuckDB files must use paths accessible to the backend process.
- For first integration, prefer read-only accounts or test databases.
- Credentials are submitted only when creating or updating resources; read APIs do not return plaintext secrets.

## Next steps

- Web UI: [Web workbench guide](guides/web-workbench.md)
- Terminal UI: [TUI guide](guides/tui.md)
- Connect your data: [Data sources guide](guides/data-sources.md)
- Capability boundaries: [Capabilities](capabilities.md)
