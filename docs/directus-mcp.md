# Directus MCP for Cursor

Connect Cursor (desktop or Cloud Agents) to the portfolio Directus so the agent can inspect schema, relations, files, and content.

## 1. Create a Directus token

1. Open `https://alexandreguichet-cms.vancouverly.ca`
2. **User Directory** → your admin (or a dedicated MCP user) → **Token** → generate
3. **Save** the user

Use Administrator (or at least full Fields/Relations/Files access) while debugging media fields.

## 2. Enable built-in MCP (Directus v11.12+ only, optional)

1. Directus → **Settings** → **AI** → **Model Context Protocol**
2. Turn **MCP Server** on → Save

Endpoint: `https://alexandreguichet-cms.vancouverly.ca/mcp`

If that settings page is missing, your Directus is older — skip this and use the local `@directus/content-mcp` config below (already in `.cursor/mcp.json`).

## 3. Cursor Desktop / IDE

1. Open this repo in Cursor
2. Edit `.cursor/mcp.json` and paste your token into `DIRECTUS_TOKEN` (do **not** commit the token)
3. Cursor → **Settings** → **MCP** → confirm **directus** is enabled
4. Restart MCP / reload window if needed
5. Ask: “What relations does `sketch_tracks.audio` have?”

## 4. Cursor Cloud Agents

Project `.cursor/mcp.json` is not enough by itself for Cloud Agents. Add the server in the dashboard:

1. Open [Cloud Agents environments](https://cursor.com/dashboard/cloud-agents/environments) → this environment
2. Add MCP server:

| Field | Value |
|-------|--------|
| Name | `directus` |
| Type | `stdio` / command |
| Command | `npx` |
| Args | `-y` `@directus/content-mcp@latest` |
| Env | `DIRECTUS_URL=https://alexandreguichet-cms.vancouverly.ca` |
| Env | `DIRECTUS_TOKEN=<your token>` |

Or, if built-in MCP is enabled (v11.12+):

| Field | Value |
|-------|--------|
| Name | `directus` |
| Type | `http` / URL |
| URL | `https://alexandreguichet-cms.vancouverly.ca/mcp` |
| Headers | `Authorization: Bearer <your token>` |

3. Save, then **start a new** Cloud Agent run (existing runs keep the old tool set)

## 5. Sanity check

In a new agent chat:

> List Directus relations for `hero.image`, `about.portrait`, `projects.image`, and `sketch_tracks.audio`.

You should see `related_collection: directus_files` (not `directus_users`).

## Security

- Prefer a dedicated MCP user over your personal admin when possible
- Never commit a filled `DIRECTUS_TOKEN` in `.cursor/mcp.json`
- Keep Directus **Allow Deletes** off unless you intentionally want the agent to delete schema/content
