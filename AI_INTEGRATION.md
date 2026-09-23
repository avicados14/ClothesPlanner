# Wearwise AI Integration

Wearwise already uses a **server-side AI stylist** for two private workflows. When an image is added, the stylist identifies the garment and proposes a practical name, category, color, season, and formality. When a user asks for a look, it evaluates the selected occasion, Golden-area weather in Fahrenheit, and only the garments currently marked **clean**. The browser never receives AI credentials or a full provider token.

## Current provider behavior

The application uses the managed model service built into the project. It automatically prefers an available efficient model and can select `gpt-5-mini` when that model is available. This is sufficient for the garment-cataloging and clean-only outfit-planning flows now in the product, with no user API key required.

## Using OpenAI / ChatGPT specifically

A direct OpenAI integration requires an **OpenAI Platform API key**, created at the [OpenAI API platform](https://platform.openai.com/api-keys). A ChatGPT Plus or Pro subscription by itself does **not** provide an API key or API usage balance. The key must be saved as the server-side project secret `OPENAI_API_KEY`; it must never be placed in GitHub, browser JavaScript, or an uploaded file.

The implementation would also need your model choice, such as `gpt-4.1-mini` for economical routine styling or a higher-capability model for deeper wardrobe advice. If your organization uses a particular OpenAI project or organization, its identifier may also be required for accounting and access control. Once the key is supplied securely, Wearwise can direct the same existing structured garment analysis and outfit-planning calls to that provider without changing the user experience.

| Item | Required | Why it is needed |
| --- | --- | --- |
| `OPENAI_API_KEY` | Yes, for direct OpenAI calls | Authenticates server-side requests to the OpenAI API. |
| OpenAI API billing / usage balance | Yes | Covers model usage; this is separate from a ChatGPT web subscription. |
| Preferred model | Recommended | Lets the app balance recommendation quality, speed, and per-request cost. |
| OpenAI project or organization ID | Optional | Needed only when the OpenAI account requires it for routing or reporting. |

The GitHub Pages companion remains a static local interface, so it cannot safely host any secret or make private AI calls. Its lightweight recommendations are deterministic; the private Wearwise app is where secure AI features run.
