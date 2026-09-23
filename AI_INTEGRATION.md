# ChatGPT / OpenAI Integration Boundary

The active Wearwise GitHub Pages application is intentionally **not connected to OpenAI or ChatGPT**. A static public website cannot protect an API key: any key embedded in browser JavaScript, page settings, or repository files can be extracted and abused.

The current local-first edition therefore uses deterministic recommendations based on weather, occasion, garment category, and laundry availability. It sends no garment metadata, local photo, plan, history entry, or API key to an AI provider.

## What a future secure ChatGPT upgrade needs

A direct ChatGPT/OpenAI implementation requires a separate server-side API and private data store. The server, not the browser, would hold the key and submit only the required clean-closet context to OpenAI.

| Requirement | Purpose |
| --- | --- |
| `OPENAI_API_KEY` secret | Stored only in a server-side secret manager; never in Git, GitHub Pages, browser code, or chat. |
| OpenAI API billing | API usage is separate from a ChatGPT web subscription. |
| Secure API endpoint | Authenticates the person using Wearwise and proxies requests without exposing the OpenAI key. |
| Private per-user database | Enables optional cross-device synchronization for garments, laundry, and history. |
| Model choice | For example, an economical routine styling model or a higher-capability model for more detailed advice. |

## Upgrade path from the current app

The Pages application exports `wearwise.local-backup/v1` JSON. A future server can accept that backup as an import, preserving stable garment IDs and planned-outfit history. Until that server exists, ChatGPT is deliberately disabled rather than implemented insecurely.

> Any OpenAI key that has been pasted into a chat, committed to a repository, or embedded in a web page should be revoked and replaced in the OpenAI API dashboard.
