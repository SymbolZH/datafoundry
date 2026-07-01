# REST API reference

This reference is for client developers and integrators. After reading it, you can find the local API base URL, response format, auth headers, resource endpoints, session endpoints, and artifact endpoints.

Default service address:

```text
http://127.0.0.1:8787
```

## General conventions

Most JSON endpoints return an envelope:

```json
{
  "success": true,
  "data": {}
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "resource not found"
  }
}
```

File downloads and artifact downloads return binary responses; upload endpoints use `multipart/form-data`.

## Local development auth

Local development supports these headers:

```text
Authorization: Bearer <dev_token>
X-Dev-Token: <dev_token>
X-Workspace-Id: <workspace_id>
```

When headers are omitted, the backend uses the development default identity and default workspace. Production deployment needs a formal identity system.

## Health and capabilities

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/healthz` | Check whether the backend is running. |
| GET | `/api/v1/capabilities` | Read backend capability switches. |

```bash
curl http://127.0.0.1:8787/healthz
curl http://127.0.0.1:8787/api/v1/capabilities
```

## Agent Runtime

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/copilotkit` | Start an agent run; returns AG-UI event stream. |
| POST | `/api/v1/runs/:id/cancel` | Cancel a running agent run. |

`POST /api/copilotkit` uses CopilotKit / AG-UI `RunAgentInput`. See [Agent Runtime and AG-UI reference](agent-runtime.md).

## Sessions

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/sessions` | List server sessions. Supports `limit`, `cursor`. |
| PATCH | `/api/v1/sessions/:sessionId` | Update session title. |
| GET | `/api/v1/sessions/:sessionId/conversation` | Read authoritative server conversation history. Supports `limit`. |

Session APIs restore history for Web/TUI, display titles, and read tool-call pairings.

## Workspace configuration

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/workspace-config` | Read workspace resource defaults. |
| PATCH | `/api/v1/workspace-config` | Update default enablement. |
| GET | `/api/v1/run-defaults` | Read run default configuration. |

## Data sources

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/datasource-types` | Discover supported data source types and field schema. |
| GET | `/api/v1/datasources` | List data sources. |
| POST | `/api/v1/datasources` | Create a data source. |
| GET | `/api/v1/datasources/:id` | Read data source details. |
| PATCH | `/api/v1/datasources/:id` | Update a data source. |
| DELETE | `/api/v1/datasources/:id` | Delete a data source. |
| POST | `/api/v1/datasources/:id/test` | Test connection. |
| POST | `/api/v1/datasources/:id/introspect` | Fetch schema; returns a job. |
| GET | `/api/v1/datasources/:id/schema` | Read schema snapshot. Supports `q`, `includeStats`. |
| GET | `/api/v1/datasources/:id/tables/:table/preview` | Preview table data. Supports `schema`, `limit`, `offset`, `orderBy`. |

The backend does not expose arbitrary SQL REST endpoints. SQL analysis runs through agent tools.

## Models

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/model-profiles` | List model profiles. |
| POST | `/api/v1/model-profiles` | Create a model profile. |
| GET | `/api/v1/model-profiles/:id` | Read a model profile. |
| PATCH | `/api/v1/model-profiles/:id` | Update a model profile. |
| DELETE | `/api/v1/model-profiles/:id` | Delete a model profile. |
| POST | `/api/v1/model-profiles/:id/test` | Test provider. |

## Knowledge bases

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/knowledge-bases` | List knowledge bases. |
| POST | `/api/v1/knowledge-bases` | Create a knowledge base. |
| GET | `/api/v1/knowledge-bases/:id` | Read a knowledge base. |
| PATCH | `/api/v1/knowledge-bases/:id` | Update a knowledge base. |
| DELETE | `/api/v1/knowledge-bases/:id` | Delete a knowledge base. |
| POST | `/api/v1/knowledge-bases/:id/test` | Validate configuration. |
| POST | `/api/v1/knowledge-bases/:id/files` | Upload documents. |
| POST | `/api/v1/knowledge-bases/:id/files/import` | Import from FileAssetRef. |
| POST | `/api/v1/knowledge-bases/:id/search` | Retrieval debug. |
| POST | `/api/v1/knowledge-bases/:id/reindex` | Rebuild index; returns a job. |

## MCP and Skills

| Method | Path | Purpose |
| --- | --- | --- |
| GET / POST | `/api/v1/mcp-servers` | List or create MCP servers. |
| GET / PATCH / DELETE | `/api/v1/mcp-servers/:id` | Read, update, or delete MCP servers. |
| POST | `/api/v1/mcp-servers/:id/test` | Test MCP server. |
| GET | `/api/v1/mcp-servers/:id/tools` | Fetch tools manifest. |
| GET / POST | `/api/v1/skills` | List or upload Skills. |
| POST | `/api/v1/skills/select` | Preview Skill filtering for a run. |
| GET / PATCH / DELETE | `/api/v1/skills/:id` | Read, update, or delete Skills. |
| POST | `/api/v1/skills/:id/test` | Test Skill. |
| POST | `/api/v1/skills/:id/validate` | Validate Skill. |
| POST | `/api/v1/skills/:id/replace` | Replace Skill package. |

## Files

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/files` | List file assets. Supports `scope`, `origin`, `source`, `sessionId`. |
| POST | `/api/v1/files` | Batch upload files. Session id required in multipart field or header. |
| GET | `/api/v1/files/:id` | Read file reference. |
| POST | `/api/v1/files/:id/promote` | Promote session-scoped file to cross-session workspace file. |
| DELETE | `/api/v1/files/:id` | Delete file reference. |
| GET | `/api/v1/files/:id/download` | Download file content. |
| POST | `/api/v1/chat/uploads` | Upload chat attachments for the current conversation. |

## Artifacts

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/artifacts?sessionId=:sessionId` | List outputs for a session. |
| GET | `/api/v1/artifacts/:id` | Read artifact details. |
| GET | `/api/v1/artifacts/:id/preview` | Read preview JSON. |
| GET | `/api/v1/artifacts/:id/content` | Read inline content. |
| GET | `/api/v1/artifacts/:id/download` | Download artifact. Optional `format`. |
| POST | `/api/v1/artifacts/:id/promote` | Add file artifact to workspace files. |
| POST | `/api/v1/artifacts/:id/export` | Export specified format; returns a job. |

## Query history

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/query-history` | List SQL query history. Supports `sessionId`, `datasourceId`, `favorite`, `limit`. |
| POST | `/api/v1/query-history/:id/favorite` | Favorite a query. |
| POST | `/api/v1/query-history/:id/unfavorite` | Remove favorite. |
| PATCH | `/api/v1/query-history/:id` | Update favorite with `{ "favorite": true \| false }`. |

## Jobs

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/jobs/:id` | Query async job status. |
| POST | `/api/v1/jobs/:id/cancel` | Cancel async job. |

## Write conventions

- Default JSON body limit is 1 MiB.
- `PATCH` supports optimistic concurrency with `revision` or `If-Match`.
- Schema fetch, index rebuild, and artifact export may use `Idempotency-Key`.
- Credentials are submitted only when creating or updating resources.
- Read APIs do not return plaintext passwords, tokens, or full connection strings.

## Further reading

- Resource and model boundaries: [Configuration API reference](configuration-api.md)
- Data source connection: [Data sources guide](../guides/data-sources.md)
- Agent runs: [Agent Runtime and AG-UI reference](agent-runtime.md)
