# App contribution examples

These independently packaged Mail and Calendar Apps show the proposed contribution format and provide local business tests that do not require platform source or credentials.

| Example | Business workflows | Local commands from its directory |
| --- | --- | --- |
| [Mail](mail/) | Search/read, drafts/send, flags/folders, incoming events, text-email message conversion | `npm test`; `npm run example` |
| [Calendar](calendar/) | List/read, free/busy, create/reschedule/cancel, ICS export, incoming updates | `npm test`; `npm run example` |

Start with [the App contribution guide](../../docs/app-contribution.md). Add future reference examples as sibling directories with the same documentation and local-test expectations.

The sample packages retain the reference format (App/Core API 1.2.0, contribution revision 0.4.0, email wire schema 2). This is a proposed interface for review, not an announcement that PALE's first infrastructure release has adopted it.

Local tests exercise App functions and domain errors using synthetic data. `service.cjs` is the platform launch bridge and requires the internal host when assembled under `apps/<id>/`. Full MCP, permission, reset, persistence and routing validation is performed on the platform. This folder does not distribute the Core, Infra, Router implementation or live run state.
