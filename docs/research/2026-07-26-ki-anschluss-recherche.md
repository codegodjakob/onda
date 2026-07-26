# Recherche: KI-Anschluss für Etappe A (Modelle, Architektur, Patterns)

> Drei parallele Web-Recherchen vom 26.07.2026 (je mit Quellen-URLs). Grundlage für die Design-Spec `docs/superpowers/specs/2026-07-26-etappe-a-ki-anschluss-design.md`. Preise/Verfügbarkeiten sind Momentaufnahmen — vor Budget-Entscheidungen neu prüfen.

---

# Modell-Landschaft für anspruchsvolle deutsche Textarbeit — Stand 26. Juli 2026

## 1. Führende Modelle (verifiziert per Websuche + Anthropic-API-Referenz)

### Anthropic Claude (Quelle: Anthropic-API-Referenz/platform.claude.com, Cache-Stand 24.06.2026)
| Modell | ID | Preis In/Out pro 1M Tokens | Kontext |
|---|---|---|---|
| Claude Fable 5 (Topmodell) | `claude-fable-5` | $10 / $50 | 1M |
| Claude Opus 5 | `claude-opus-5` | $5 / $25 | 1M |
| Claude Sonnet 5 | `claude-sonnet-5` | $3 / $15 (Intro $2 / $10 bis 31.08.2026) | 1M |
| Claude Haiku 4.5 | `claude-haiku-4-5` | $1 / $5 | 200K |

- **Stärken Deutsch:** Deutsche Fachvergleiche 2026 sehen Claude vorn bei langen deutschen Texten — „schreibt am natürlichsten, verliert über viele Seiten nicht den roten Faden" ([vatha.de](https://www.vatha.de/chatgpt-vs-claude-vs-gemini-vergleich-2026/), [gerlinger.ai](https://gerlinger.ai/blog/ki-modell-vergleich-wissensarbeit), 2026). Fable 5 führt die Writing-Arena (Elo 1508, [benchlm.ai](https://benchlm.ai/blog/posts/best-llm-writing), Juli 2026).
- **Schwächen:** Teuerste Anbieter-Familie; Fable 5 erfordert 30-Tage-Datenaufbewahrung (kein Zero-Data-Retention).
- **Besonderheit Fable 5:** Thinking immer an, keine Prefills — für einfache Hinweis-Läufe überdimensioniert.

### OpenAI GPT-5.6 (veröffentlicht 09.07.2026; Quellen: [tldl.io](https://www.tldl.io/resources/openai-api-pricing), [aipricing.guru](https://www.aipricing.guru/openai-pricing/), Juli 2026)
| Modell | Preis In/Out | Kontext |
|---|---|---|
| GPT-5.6 Sol (Flaggschiff) | $5 / $30 | 1M |
| GPT-5.6 Terra (Standard) | $2.50 / $15 | 1M |
| GPT-5.6 Luna (Budget) | $1 / $6 | 1M |

- **Stärken:** Sol ist der direkte Fable-5-Herausforderer im Schreiben; sehr guter Allrounder, stark bei kreativen deutschen Gebrauchstexten ([omr.com](https://omr.com/de/reviews/contenthub/ki-vergleich)). **Schwächen:** Deutsche Langtexte laut DE-Vergleichen etwas hinter Claude.

### Google Gemini (Quellen: [cloudzero.com](https://www.cloudzero.com/blog/gemini-pricing/), [eesel.ai](https://www.eesel.ai/blog/google-gemini-3-pricing), Juli 2026)
| Modell | Preis In/Out | Kontext |
|---|---|---|
| Gemini 3.1 Pro | $2 / $12 | 1M |
| Gemini 3.6 Flash (neu, 21.07.2026) | $1.50 / $7.50 | 1M |

- **Stärken:** Bestes Preis-Leistungs-Verhältnis; höchster Arena-Creative-Writing-Score bei 3.1 Pro ([benchlm.ai](https://benchlm.ai/blog/posts/best-llm-writing)). **Schwächen:** DE-Vergleiche loben eher Integration/Multimodalität als deutsche Prosa-Qualität.

### Moonshot Kimi K3 — **existiert, Nutzer-Angabe bestätigt**
Veröffentlicht **16.07.2026**, 2,8-Billionen-Parameter-Open-Weight-Modell (Gewichte ab 27.07.), 1M Kontext, Always-on-Thinking ([CNBC](https://www.cnbc.com/2026/07/17/moonshot-ai-kimi-k3-model-openai-anthropic-china.html), [VentureBeat](https://venturebeat.com/technology/chinas-moonshot-ai-releases-kimi-k3-the-largest-open-source-model-ever-rivaling-top-u-s-systems), Juli 2026). Preis: **$3 / $15**, Cache-Hits $0.30 ([openrouter.ai](https://openrouter.ai/moonshotai/kimi-k3), [benchlm.ai](https://benchlm.ai/moonshot/api-pricing)). Führt EQ-Bench Creative Writing (Elo 2377, englisch). Laut Moonshot selbst insgesamt noch hinter Fable 5 / GPT-5.6 Sol. Deutsche Textqualität: **nicht verifizierbar belegt**.

### DeepSeek (Quelle: [deepseek.ai/pricing](https://deepseek.ai/pricing), verifiziert 25.07.2026)
V4-Flash: **$0.14 / $0.28** (Cache-Hit $0.0028); V4-Pro: **$0.435 / $0.87**. Ein „R2" existiert nicht als aktuelles Produkt — die Reasoning-Linie ist in V4 aufgegangen. Extrem günstig; deutsche Stilqualität gilt als deutlich schwächer als Claude/GPT (keine belastbare Quelle für DE-Qualität gefunden).

### Mistral (EU, Paris)
Mistral Large 3 (Dez. 2025). **Preis widersprüchlich:** offizielle Pricing-Seite nennt $2 / $6 ([mistral.ai/pricing](https://mistral.ai/pricing), abgerufen 26.07.2026), mehrere Tracker listen $0.50 / $1.50 ([pricepertoken.com](https://pricepertoken.com/pricing-page/model/mistral-ai-mistral-large-2512)) — vor Budgetentscheidung direkt prüfen. Stärke: EU-Sitz, GDPR-nativ, EU-Datenresidenz. Deutsche Textqualität ordentlich, aber in keinem Vergleich führend.

## 2. Strukturierte Ausgaben (JSON Schema / Tool Use) — für die Hinweis-Erzeugung
- **Claude:** Ja, nativ — `output_config.format` (JSON Schema) + `strict: true` Tool Use, garantiert schema-valide (Anthropic-Referenz, 24.06.2026). **Einschränkung:** keine rekursiven Schemas, keine min/max-Constraints.
- **OpenAI:** Structured Outputs (json_schema, strict) — etabliertes API-Feature, für GPT-5.6 nicht separat einzeln verifiziert, aber Teil des Chat-Completions-Vertrags.
- **Gemini:** `responseSchema` — etabliert, nicht separat für 3.6 verifiziert.
- **Kimi K3:** Ja, verifiziert — JSON Mode, striktes JSON Schema, Tool Calls, OpenAI-kompatible API ([apidog.com](https://apidog.com/blog/kimi-k3-api/), [kimik3.dev](https://kimik3.dev/), Juli 2026).
- **DeepSeek/Mistral:** Function Calling + JSON-Output vorhanden, Zuverlässigkeit bei strikten Schemas nicht separat verifiziert.
- **Fazit:** Alle Kandidaten können Tool Use; **garantierte** Schema-Konformität ist bei Claude und OpenAI am ausgereiftesten dokumentiert.

## 3. Datenschutz / EU (kurz)
- **Anthropic:** API-Daten werden standardmäßig NICHT trainiert ([trustscan.dev](https://trustscan.dev/blog/opt-out-llm-training-data-2026), 2026). Achtung: Fable 5 verlangt 30-Tage-Retention.
- **OpenAI:** Kein Training auf API-Daten standardmäßig ([meetily.ai](https://meetily.ai/llm-privacy)).
- **Google:** Paid Tier: Prompts werden nicht zur Produktverbesserung genutzt; in EEA gelten Paid-Bedingungen sogar für Gratis-Kontingent ([ai.google.dev/gemini-api/terms](https://ai.google.dev/gemini-api/terms)).
- **Mistral:** EU-Anbieter, GDPR-nativ, EU-Datenresidenz — sauberste EU-Option.
- **DeepSeek (direkte API):** Daten in China gespeichert, standardmäßig fürs Training genutzt (Opt-out) — für sensible Texte problematisch. Ausweg: Open-Weights über EU/US-Hoster (z. B. OpenRouter/Together).
- **Moonshot (direkte API):** China-basiert; Trainingspolitik nicht verifiziert. K3 ist ab 27.07. open-weight → Drittanbieter-Hosting möglich.

## 4. Kosten-Realität (Einzelnutzer, täglich 1–2 h)
Rechenbasis: ~15 Hinweis-Läufe/Tag über 2000-Wort-Texte (je ~8K Input / 2K Output) + ~30 Chat-Turns mit Historie + Verständnis-Updates ≈ **0,5 Mio Input / 0,05 Mio Output Tokens pro Tag**, 22 Tage/Monat → ~11M Input / 1,2M Output monatlich.

| Modell | ohne Caching | mit Prompt-Caching (Verständnis+Systemprompt gecacht) |
|---|---|---|
| Claude Opus 5 ($5/$25) | ~85 $/Monat | ~30–50 $/Monat |
| GPT-5.6 Sol ($5/$30) | ~91 $/Monat | ~35–55 $/Monat |
| Claude Sonnet 5 (Intro $2/$10) | ~34 $/Monat | ~12–20 $/Monat |
| Gemini 3.6 Flash ($1.50/$7.50) | ~26 $/Monat | ~10–15 $/Monat |
| DeepSeek V4-Pro ($0.435/$0.87) | ~6 $/Monat | ~2 $/Monat |

Größter Hebel: Prompt-Caching des Projektverständnisses (bei Claude ~0,1× für Cache-Reads) — ohne Caching zahlt man das Verständnis-Dokument bei jedem Hinweis-Lauf neu.

## 5. Empfehlung (3 Zeilen)
1. **Stark (Projektverständnis + Hinweis-Läufe): Claude Opus 5** (`claude-opus-5`, $5/$25) — beste belegte deutsche Langtext-Qualität, garantierte JSON-Schema-Ausgaben, kein Training auf API-Daten; Fable 5 nur für Spezialfälle (doppelter Preis, kaum Mehrwert für Schreib-Hinweise).
2. **Günstig (Chat + schnelle Läufe): Claude Sonnet 5** (Intro $2/$10 bis 31.08.) — gleiche API/gleiches Caching wie Opus, ein Anbieter genügt; Alternative bei Kostenfokus: Gemini 3.6 Flash ($1.50/$7.50).
3. **EU-Karte / Backup: Mistral Large 3** — falls EU-Datenresidenz Pflicht wird (Preis vorher klären: $2/$6 lt. offizieller Seite vs. $0.50/$1.50 lt. Trackern); Kimi K3 und DeepSeek nur über EU-Hoster erwägen, deutsche Stilqualität dort unbelegt.

Quellen (Kern): [Anthropic Pricing-Referenz](https://platform.claude.com/docs/en/pricing.md) (24.06.2026) · [TLDL OpenAI-Preise](https://www.tldl.io/resources/openai-api-pricing) · [CloudZero Gemini](https://www.cloudzero.com/blog/gemini-pricing/) · [CNBC Kimi K3](https://www.cnbc.com/2026/07/17/moonshot-ai-kimi-k3-model-openai-anthropic-china.html) · [OpenRouter Kimi K3](https://openrouter.ai/moonshotai/kimi-k3) · [DeepSeek Pricing](https://deepseek.ai/pricing) · [Mistral Pricing](https://mistral.ai/pricing) · [vatha.de KI-Vergleich](https://www.vatha.de/chatgpt-vs-claude-vs-gemini-vergleich-2026/) · [Gemini API Terms](https://ai.google.dev/gemini-api/terms) · [TrustScan Opt-out-Guide](https://trustscan.dev/blog/opt-out-llm-training-data-2026) — alle abgerufen 26.07.2026.

**Nicht verifizierbar:** dedizierte Deutsch-Schreibbenchmarks (existieren kaum; Einschätzungen beruhen auf DE-Fachvergleichen und englischen Writing-Arenen), Kimi-K3-Deutschqualität, Moonshot-Trainingspolitik, DeepSeek/Mistral-Zuverlässigkeit bei strikten JSON-Schemas.

---

# Anschluss-Architektur für ein lokal-first KI-Schreibwerkzeug (Einzelnutzer, kein Server) — Recherchestand 26.07.2026

## 1. Direkt aus Browser/WKWebView (CORS)

| Anbieter | Browser-Direktzugriff | Beleg (abgerufen 26.07.2026) |
|---|---|---|
| **Anthropic** | **Ja, offiziell.** Header `anthropic-dangerous-direct-browser-access: true` (seit Aug. 2024); im offiziellen TypeScript-SDK via `dangerouslyAllowBrowser: true`. SDK-README: „Web browsers: disabled by default to avoid exposing your secret API credentials … Enable browser support by explicitly setting `dangerouslyAllowBrowser` to `true`." Anthropic nennt als legitimen Fall genau euer Muster: „Bring your own API key". | [SDK-README](https://github.com/anthropics/anthropic-sdk-typescript); [Simon Willison, 23.08.2024](https://simonwillison.net/2024/Aug/23/anthropic-dangerous-direct-browser-access/) |
| **OpenAI** | Technisch ja (`dangerouslyAllowBrowser: true` im SDK), aber von OpenAI nur widerwillig; CORS-Probleme bei Teilendpunkten bleiben 2026 ein bekanntes Ärgernis. Kein „BYOK-freundliches" Signal wie bei Anthropic. | [OpenAI TS-SDK-Referenz](https://developers.openai.com/api/reference/typescript); [DEV-Artikel zu CORS bei AI-APIs](https://dev.to/swift-logic-io218/why-your-ai-api-throws-cors-errors-and-what-to-do-about-it-1mp) |
| **Google (Gemini)** | **Praktisch nein.** Google rät explizit: Schlüssel nie clientseitig, Backend-Proxy „non-negotiable"; Nutzer berichten CORS-/503-Probleme im Frontend. | [Google-Doku API-Keys](https://ai.google.dev/gemini-api/docs/api-key); [Google-AI-Forum](https://discuss.ai.google.dev/t/frequent-503-service-unavailable-cors-error-with-gemini-2-5-flash-api-in-frontend-js-paid-tier/141903) |
| **OpenRouter** | **Ja, ausdrücklich für Browser-/„local-first"-Apps gebaut.** OAuth-PKCE-Flow läuft komplett clientseitig; der Nutzer verbindet sein eigenes OpenRouter-Konto, die App bekommt einen nutzereigenen Schlüssel — kein Backend nötig. | [OpenRouter OAuth-PKCE-Doku](https://openrouter.ai/docs/use-cases/oauth-pkce) |

**Risiko „Schlüssel im Browser" bei einer rein lokalen Einzelnutzer-App:** realistisch gering. Das klassische Angriffs­szenario (Fremde stehlen den Schlüssel aus veröffentlichtem Client-Code) existiert hier nicht — es gibt keine Website, der Schlüssel ist der eigene, das Gerät ist das eigene. Restrisiken: `localStorage` ist unverschlüsselt auf der Platte (Backups, Malware mit Dateizugriff) und Prompt-Injection-artige Exfiltration, falls die App fremde Inhalte rendert. Abhilfe: Ausgabenlimit im Anbieter-Dashboard setzen + Schlüssel besser in der macOS-Keychain als in `localStorage` (siehe Punkt 3).

**WKWebView-Fallstrick (wichtig!):** WKWebView erzwingt CORS wie Safari, und Seiten, die per `loadHTMLString`/`file://`/eigenem Scheme geladen werden, haben eine „null"- bzw. Custom-Scheme-Origin. `fetch` von dort funktioniert nur, wenn der Server `Access-Control-Allow-Origin: *` sendet (tun Anthropic mit Header und OpenRouter); es gibt **keinen Schalter, um CORS in WKWebView abzuschalten**, und `WKURLSchemeHandler`-Origins gelten als „insecure" mit bekannten fetch-Einschränkungen ([WebKit-Bug 201180](https://bugs.webkit.org/show_bug.cgi?id=201180); [Apple-Forum](https://forums.developer.apple.com/forums/thread/725916); [Lösungsartikel: nativ proxien](https://zzdjk6.medium.com/wkwebview-cors-solution-da20ca1194e8)). Das ist das stärkste Argument für Punkt 3.

## 2. Router/Gateway (Stand 2026)

- **OpenRouter**: ein Schlüssel für hunderte Modelle. Kosten: **keine Token-Aufschläge**, aber **5,5 % Gebühr beim Guthaben-Aufladen** (mind. 0,80 $); BYOK (eigene Anbieter-Schlüssel durchrouten): erste 1 Mio. Requests/Monat gratis, danach 5 % ([ofox-Aufschlüsselung, 2026](https://ofox.ai/blog/openrouter-pricing-hidden-markup-breakdown-2026/); [Amnic](https://amnic.com/blogs/openrouter-pricing)). **SSE-Streaming: ja** (Achtung: `: OPENROUTER PROCESSING`-Kommentarzeilen im Stream müssen übersprungen werden — [Streaming-Doku](https://openrouter.ai/docs/api-reference/streaming)). **Strukturierte Ausgaben (`response_format: json_schema`): ja, durchgereicht**, aber Durchsetzung variiert je Provider; mit `require_parameters: true` nur auf konforme Endpunkte routen ([Structured-Outputs-Doku](https://openrouter.ai/docs/features/structured-outputs)). Browser-tauglich: ja (PKCE, s.o.).
- **Vercel AI Gateway**: 0 % Markup, 5 $/Monat Gratis-Guthaben, BYOK ohne Aufschlag ([costbench](https://costbench.com/software/llm-api-providers/vercel-ai-gateway/); [truefoundry](https://www.truefoundry.com/blog/understanding-vercel-ai-gateway-pricing)). **Aber:** primär für serverseitige Nutzung gedacht; Browser-Direktnutzung konnte ich **nicht verifizieren** — und es bindet euch an ein Vercel-Konto. Für euch kein Gewinn gegenüber OpenRouter.
- **LiteLLM (lokaler Proxy)**: OpenAI-kompatibler Proxy als lokaler Prozess, Schlüssel in Config. Funktional gut, aber ein Python-Dienst, der laufen muss — für eine Einzelnutzer-Mac-App unnötiger Betriebsaufwand, wenn es die Swift-Bridge (Punkt 3) gibt. (Einschätzung, kein Test.)

## 3. Lokaler Helfer in der Mac-App (Swift-Bridge)

Da die WKWebView-Hülle **bereits Message-Handler hat**, ist der „Helfer" kein eigener Prozess, sondern ~1–2 Swift-Dateien:

- JS ruft `webkit.messageHandlers.llm.postMessage({request…})`; Swift macht den Call per `URLSession` (Streaming via `URLSession.bytes`/delegate), reicht SSE-Chunks per `evaluateJavaScript`/`WKScriptMessage`-Callback zurück.
- **Nutzen:** (a) Schlüssel liegen in der **macOS-Keychain**, nie im JS-Kontext; (b) **CORS ist komplett irrelevant** — damit funktionieren auch Google/OpenAI/beliebige Anbieter ohne Browser-Freigabe; (c) das WKWebView-Origin-Problem aus Punkt 1 verschwindet (das ist exakt der dokumentierte Lösungsweg — [Thor Chen](https://zzdjk6.medium.com/wkwebview-cors-solution-da20ca1194e8)).
- **Aufwand:** überschaubar (Request-Weiterleitung + SSE-Chunk-Weiterreichen + Keychain-Read). Kein Server, kein Node, bleibt lokal-first.
- **Nachteil:** funktioniert nur in der Mac-App; läuft die App auch als reine Browser-Seite, braucht dieser Pfad einen Fallback (→ Direkt-CORS aus Punkt 1).

## 4. Lokale Modelle (Ollama/LM Studio, Stand 2026) — ehrliche Einschätzung

- Stand der Tools: Ollama nutzt seit 0.19 (31.03.2026) einen nativen MLX-Runner auf Apple Silicon; Referenzmodelle auf dem Mac sind derzeit MoE-Modelle wie **Qwen 3.6-35B-A3B** (~20 GB, Q4) und **Gemma 4 26B-A4B** ([Dottie-Vergleich](https://www.dottie.ai/blog/ollama-vs-lm-studio/); [InsiderLLM Mac-Guide](https://insiderllm.com/guides/best-local-llms-mac-2026/)). Beide laufen flüssig ab ~32 GB RAM.
- **Für euren Kern — Hinweise auf hohem deutschem Sprachniveau (Stilistik, Rhythmus, Registerfragen, feine Argumentationskritik) — reichen sie nicht.** Das ist meine Einschätzung, kein Benchmark: Die 2026er-Quellen loben Code/Reasoning, deutsche Prosa-Feinheit wird nirgends belegt; kleine Modelle sind im Deutschen erfahrungsgemäß deutlich schwächer als Frontier-Modelle (steifere Syntax, Anglizismen, unsicheres Register). Brauchbar als **Offline-Fallback für mechanische Checks** (Wortwiederholungen, Länge, einfache Klassifikation), nicht für die 8-Kategorien-Hinweisqualität.

## 5. Streaming in Tiptap/Vanilla-JS

- Muster: `fetch` mit `stream: true`, dann `response.body.getReader()` + `TextDecoder` — **nicht** `EventSource` (kann kein POST, keine Header). Anthropic-SSE-Eventtypen: `message_start` → `content_block_delta` → `message_stop`.
- Stolpersteine: (1) SSE-Events können **über Chunk-Grenzen zerrissen** ankommen → Zeilenpuffer nötig oder Parser wie `eventsource-parser` (von OpenRouter explizit empfohlen); (2) Kommentarzeilen (`: …`) verwerfen (OpenRouter-Keep-alives, s.o.); (3) kein Auto-Reconnect bei `fetch` — Abbruch behandeln; (4) fürs Tiptap-UI Deltas puffern/throttlen statt pro Token DOM-Updates; (5) strukturierte JSON-Hinweise **nicht** töpfchenweise parsen — entweder komplett am Stream-Ende `JSON.parse`, oder Chat-Streaming und Hinweis-JSON als getrennte, nicht-gestreamte Requests fahren.

## Empfehlung

**Zweistufig, beide Stufen ohne Server:**

1. **State of the Art für DIESE App: die Swift-URLSession-Bridge über eure vorhandenen Message-Handler** als primärer Anschlussweg. Begründung: Schlüssel in der Keychain statt im JS-Speicher, kein CORS-/Origin-Gefummel in WKWebView (dort ist Direkt-`fetch` je nach Ladeart der Seite fragil, s. Punkt 1), freie Anbieterwahl inkl. Google, sauberes SSE-Durchreichen. Aufwand klein, da die Hülle existiert.
2. **Anbieterseitig: Anthropic direkt als Primärmodell** (Claude ist für anspruchsvolle deutsche Texte die sicherste Wahl; strukturierte Ausgaben nativ via `output_config`-JSON-Schema, Streaming nativ) **plus optional OpenRouter als Zweitschlüssel** für Modellvergleiche — dort PKCE nutzen, `require_parameters: true` setzen, wenn ihr `json_schema` braucht. Die 5,5 % Aufladegebühr ist für Einzelnutzer-Volumina vernachlässigbar.
3. **Browser-Fallback** (falls die App auch ohne Mac-Hülle laufen soll): Direkt-Anthropic mit `anthropic-dangerous-direct-browser-access` bzw. OpenRouter — beides offiziell browser-tauglich; Ausgabenlimit im Dashboard setzen.
4. **Lokale Modelle nicht als Kernpfad einplanen** — höchstens als optionaler Offline-Modus für triviale Checks.

Nicht verifizierbar war: eine offizielle Anthropic-Doku-Seite speziell zu CORS (Docs-URL 404; Beleglage stützt sich auf SDK-README + Ökosystem seit 08/2024) sowie Browser-Tauglichkeit des Vercel AI Gateway.

---

# Agent-Architektur-Patterns für ein KI-Schreibwerkzeug — Recherche-Stand Juli 2026

## 1. Ein starkes Modell vs. Multi-Modell mit Router

**Befund: Router sind 2026 Mainstream — aber bei Produkten mit Millionen Requests. Die relevante Praxis für kleine Produkte ist die *feste Rollenzuteilung*, kein gelernter Router.**

- **Cursor** hat am 22.07.2026 „Cursor Router" gelauncht: automatische Modellwahl pro Anfrage, trainiert auf 600.000 echten Requests, Herstellerclaim „Frontier-Qualität bei 60 % geringeren Kosten" — nur Teams/Enterprise, **nicht unabhängig verifiziert** ([explainx.ai, Juli 2026](https://explainx.ai/blog/cursor-router-auto-model-selection-july-2026)). Vorher: manueller Auto-Modus.
- **Perplexity** routet per Intent-Klassifikation: eigenes günstiges Sonar-Modell für schnelle Erstantworten, Frontier-Modelle für komplexe Recherche ([ByteByteGo](https://blog.bytebytego.com/p/how-perplexity-built-an-ai-google), [datastudios.org, 2025](https://www.datastudios.org/post/perplexity-ai-all-available-models-modes-and-how-they-differ-in-late-2025)).
- **Raycast AI** routet gar nicht automatisch — der Nutzer wählt aus ~12 Modellen ([Raycast Blog](https://www.raycast.com/blog/more-ai-models)).
- Generische 2026-Engineering-Artikel nennen 40–85 % Ersparnis durch Routing ([Braintrust](https://www.braintrust.dev/articles/best-llm-routers-2026), [digitalapplied.com](https://www.digitalapplied.com/blog/llm-model-routing-2026-cost-quality-optimization-engineering-guide)) — das lohnt sich ab Volumen. Faustregel aus der Praxis: „das mechanische 80 % an kleine Modelle, das generative 20 % ans Frontier-Modell" ([Qolca](https://www.qolca.org/blog/model-routing-small-models-big-models)).

**Für ein Ein-Personen-Produkt:** Ein gelernter Router (Klassifikator entscheidet pro Anfrage) ist Overkill. Best Practice ist eine **statische Task→Modell-Tabelle** im Code — das ist technisch dasselbe Erweiterungsmuster, nur ohne ML. Aktuelle Preise (verifiziert über Anthropic-Modellkatalog, Stand 24.06.2026, [platform.claude.com/docs/en/pricing](https://platform.claude.com/docs/en/pricing)):

| Modell | Input/Output pro 1M Tokens | Rolle im Schreibwerkzeug |
|---|---|---|
| Claude Opus 5 | $5 / $25 | Tiefenanalyse, Hinweise, Interview |
| Claude Sonnet 5 | $3 / $15 (Intro $2/$10 bis 31.08.2026) | Alternative für Hinweise/Chat, nahe Opus-Qualität |
| Claude Haiku 4.5 | $1 / $5 | Routine: Titel, Zusammenfassungen, Klassifikation |

## 2. Strukturierte Hinweis-Erzeugung mit exakten Textankern

**Klarer Konsens 2026: JSON-Schema-erzwungene Ausgabe + wörtliche Zitate als Anker + client-seitige Verifikation. Freitext-Parsing ist obsolet.**

1. **JSON garantieren:** Anthropics Structured Outputs (`output_config.format` mit `json_schema`, `additionalProperties: false`) erzwingen schema-valides JSON serverseitig — kein Parsing-Risiko mehr. Alternativ `strict: true` bei Tool Use. (Verifiziert: [platform.claude.com/docs/en/build-with-claude/structured-outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs), API-Doku Stand Juni 2026.) Dein Hinweis-Schema (Kategorie-Enum, Textanker, Beobachtung, Relevanz, Folge, optionaler Vorschlag) passt exakt in dieses Muster.
2. **Anker = wörtliches Zitat, nie Zeichenpositionen:** Modelle können nicht zuverlässig Zeichen zählen. Stattdessen: das Schema verlangt ein *verbatim* kopiertes Zitat („kleinstmögliches exaktes Zitat, keine Paraphrase, keine Normalisierung"), das der Client per String-Suche im Tiptap-Dokument lokalisiert. Eine EU-Regulierungsstudie (2026) erreichte damit **99,1 % Match-Rate** über exaktes + Fuzzy-Matching ([arXiv 2605.30995](https://arxiv.org/pdf/2605.30995)). Googles [LangExtract](https://github.com/google/langextract) und Ironclads Grounding-System ([Mai 2026](https://ironcladapp.com/resources/articles/grounding-systems)) arbeiten nach demselben Prinzip: jede Extraktion auf exakte Quellposition mappen.
3. **Anti-Halluzinations-Regel:** Zitat nicht gefunden → erst Fuzzy-Match (Whitespace/Anführungszeichen normalisieren), dann Hinweis **verwerfen oder als „ohne Anker" degradieren** — nie raten. Das „Double-Lock"-Muster (Wert nur gültig, wenn `grounding_quote` im Quelltext nachweisbar) ist 2026 Standard ([arXiv 2603.04663](https://arxiv.org/pdf/2603.04663)).
4. **Chunking:** Bei 1M-Token-Kontextfenstern (Opus 5/Sonnet 5) ist Chunking für persönliche Texte meist unnötig — ganzes Dokument senden, cachen (Punkt 3). Nur bei Buchlänge: an Absatz-/Kapitelgrenzen chunken, Anker pro Chunk lokalisieren.
5. **Hinweis:** Anthropics Citations-API (liefert `cited_text` + Zeichenindizes serverseitig) ist mit `output_config.format` **inkompatibel** (400-Fehler) — für JSON-Hinweise also Zitat+Client-Matching nutzen; Citations eignen sich für Chat-Antworten mit Belegen.

## 3. Prompt-/Kontext-Strategie (Caching)

**Ja: jedes Mal alles senden — aber mit Prompt Caching, dann kostet es fast nichts.** Die API ist stateless; Caching macht Wiederholung billig. Anthropic-Konditionen (verifiziert, API-Doku Stand Juni 2026, [platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching); bestätigt durch [finout.io 2026](https://www.finout.io/blog/anthropic-api-pricing)):

- Cache-**Write**: 1,25× Input-Preis (5-Min-TTL) bzw. 2× (1h-TTL); Cache-**Read**: **0,1× = 90 % Rabatt**. Jeder Read verlängert die TTL.
- Caching ist **Präfix-Matching**: Reihenfolge stabil halten — `(1) System-Prompt mit Coach-Persona + 8 Kategorien-Definitionen → (2) Projektverständnis → (3) Dokumenttext → Cache-Breakpoint → (4) aktuelle Anfrage/Chatverlauf`. Kein Timestamp, keine UUID vorn im Prompt (invalidiert alles danach).
- Konkret für dein Produkt: Beim Schreiben ändert sich der Dokumenttext — dann Breakpoint nach (2) setzen, System+Projektverständnis bleiben gecacht; bei Hinweis-Läufen auf unverändertem Text zusätzlich nach (3). Mindestgröße für Caching: 1024 Tokens (Sonnet 5), 512 (Opus 5) — dein Setup liegt locker darüber.
- Äquivalente 2026: OpenAI cacht automatisch mit ~50 % Read-Rabatt (kein Write-Aufpreis), Gemini bietet implizites + explizites Caching; Anthropics 90 %-Read-Rabatt ist der tiefste, verlangt aber explizite Breakpoints ([Vergleich: usagebox.com, 2026](https://usagebox.com/articles/prompt-caching-cost-optimization-claude-gpt-gpt-gemini-2026), [tokonomics.ca](https://tokonomics.ca/blog/prompt-caching-guide-openai-anthropic)).
- Funktioniert ohne eigenen Server: Der Cache liegt bei Anthropic (org-scoped), der Client (WKWebView) sendet nur `cache_control`-Marker mit.

## 4. Verständnis-Interview

**Muster 2026: „Konversation statt Formular", technisch als Schema-Filling per Tool Use.**

- Kommerzielle Intake-Produkte (z. B. Perspective AI, 2026) ersetzen statische Formulare durch KI-geführte Interviews und berichten **3–4× höhere Abschlussraten** ([getperspective.ai](https://getperspective.ai/blog/ai-onboarding-tools-2026-buyer-comparison-by-onboarding-mode-and-customer-segment)) — Herstellerangabe.
- Anthropics eigenes dokumentiertes Onboarding-Muster (Managed-Agents-Doku, 2026) ist der beste Bauplan: **„propose, don't interrogate"** — eine offene Eingangsfrage, dann einen *Vorschlag* aus der Antwort ableiten, auf den der Nutzer reagiert; höchstens eine gebündelte Nachfrage für echte Lücken. Kein Fragenkatalog.
- Technische Umsetzung: Das Modell bekommt ein Tool `projektverstaendnis_aktualisieren` mit deinem JSON-Schema (Genre, Zielpublikum, Ton, Absicht, …). Es füllt Felder **während** des Gesprächs per Tool-Call — die UI zeigt das sich füllende Schema live (Transparenz + Korrigierbarkeit). Passt zu deiner Regel „Metastruktur ist KI-automatisch".
- Wichtigste Verfeinerung: Wenn schon Text existiert, erst einen **Entwurf des Verständnisses aus dem Text ableiten** und nur die Lücken erfragen — reduziert das Interview auf 2–3 Fragen.

## 5. Multi-Agent: wann lohnend, wann Overkill

**Für dieses Produkt: Overkill. Die Spec-Regel („intern erlaubt, nie Produktkern") ist deckungsgleich mit dem Forschungsstand.**

- Anthropic (Blog, 23.01.2026): Multi-Agent lohnt nur bei (1) Kontext-Verschmutzung, (2) echter Parallelisierbarkeit, (3) Tool-Spezialisierung — sonst übersteigen Koordinationskosten den Nutzen. Typisch **3–10× mehr Tokens**; im eigenen Research-System ~15×, wobei ~80 % des Qualitätsgewinns schlicht durch mehr Compute erklärbar war. Teams „investierten Monate in Multi-Agent-Architekturen, nur um festzustellen, dass besseres Prompting eines Single-Agents gleichwertige Ergebnisse lieferte" ([claude.com/blog](https://claude.com/blog/building-multi-agent-systems-when-and-how-to-use-them)).
- Debatten-Setups speziell: Studien 2025/26 zeigen, dass Multi-Agent-Debatte Ergebnisse **verschlechtern** kann (Konformitätsdruck statt echter Deliberation), und dass ein Single-Agent mit gleichem Token-Budget Multi-Agent auf Reasoning-Aufgaben schlägt ([arXiv 2509.05396](https://arxiv.org/pdf/2509.05396), [arXiv 2511.07784](https://arxiv.org/pdf/2511.07784), [arXiv 2604.02460](https://arxiv.org/html/2604.02460v1)).
- Zusatzargument: Aktuelle Top-Modelle (Opus-5-Klasse) verifizieren sich laut Anthropics Migrationsleitfaden selbst — explizite Verifikations-Subagents sind dort als redundant markiert. Die Anker-Verifikation (Punkt 2) gehört ohnehin in deterministischen Code, nicht in ein zweites Modell.
- Einzig vertretbare interne Ausnahme später: ein **einzelner Kritik-Durchlauf** (Evaluator-Optimizer, max. 1 Iteration) über die fertigen Hinweise, falls sich Qualitätsprobleme zeigen.

## Empfehlung: einfachstes State-of-the-Art-Setup

1. **Ein starkes Modell für alles Sichtbare** (Hinweise, Chat, Interview): Opus-5-Klasse; Sonnet 5 als kostengünstige Alternative mit nahezu Opus-Qualität (bis 31.08.2026 sogar $2/$10 Intro-Preis). Für anspruchsvolles Deutsch ist das starke Modell der Produktkern — hier nicht sparen.
2. **Haiku 4.5 fest verdrahtet für Unsichtbares**: Dokumenttitel, Chat-Zusammenfassungen, evtl. Kategorie-Vorfilter. Das ist bereits „Multi-Modell", nur ohne Router.
3. **Hinweise**: Structured Outputs mit strengem JSON-Schema, Anker als Verbatim-Zitate, client-seitige Exakt-/Fuzzy-Lokalisierung, nicht auffindbare Anker verwerfen.
4. **Kontext**: Alles pro Request senden, Prompt Caching mit stabiler Präfix-Ordnung (System → Projektverständnis → Text → Volatiles); 90 % Ersparnis auf den großen Prefix.
5. **Interview**: Gleiches starkes Modell + Schema-Filling-Tool, „propose, don't interrogate", live sichtbares Schema.
6. **Kein Multi-Agent.** Erweiterungspfad ohne Umbau: eine zentrale Funktion `callClaude(task, …)` mit Task→(Modell, Effort, Cache-Policy)-Tabelle. Ein späterer Router oder Kritik-Durchlauf ist dann ein Tabelleneintrag, keine Architekturänderung.

**Nicht verifizierbar / Vorbehalte:** Cursor-Router-Ersparnis (60 %) und Perspective-AI-Abschlussraten (3–4×) sind Herstellerangaben. Notion AI publiziert keine Details zur internen Modellaufteilung (nur die Cursor-SDK-Integration, [cursor.com/blog/notion](https://cursor.com/blog/notion)). Preise/Caching-Konditionen stammen aus Anthropics API-Dokumentation (Cache-Stand 24.06.2026) und können sich ändern.

Quellen (Auswahl, alle Juli 2026 abgerufen): [Anthropic Pricing](https://platform.claude.com/docs/en/pricing) · [Prompt Caching Docs](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) · [Structured Outputs Docs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) · [Anthropic: Multi-Agent-Systeme (23.01.2026)](https://claude.com/blog/building-multi-agent-systems-when-and-how-to-use-them) · [Cursor Router (22.07.2026)](https://explainx.ai/blog/cursor-router-auto-model-selection-july-2026) · [ByteByteGo: Perplexity-Architektur](https://blog.bytebytego.com/p/how-perplexity-built-an-ai-google) · [Raycast: One interface, many LLMs](https://www.raycast.com/blog/more-ai-models) · [LangExtract (Google)](https://github.com/google/langextract) · [EU-Konsultationsstudie, 99,1 % Anker-Match (2026)](https://arxiv.org/pdf/2605.30995) · [Ironclad Grounding (05/2026)](https://ironcladapp.com/resources/articles/grounding-systems) · [Debate-Failure-Modes (arXiv)](https://arxiv.org/pdf/2509.05396) · [Single vs. Multi-Agent bei gleichem Budget (arXiv)](https://arxiv.org/html/2604.02460v1) · [Perspective AI Intake (2026)](https://getperspective.ai/blog/ai-onboarding-tools-2026-buyer-comparison-by-onboarding-mode-and-customer-segment) · [Braintrust: LLM-Router 2026](https://www.braintrust.dev/articles/best-llm-routers-2026) · [Caching-Vergleich Anthropic/OpenAI/Gemini](https://tokonomics.ca/blog/prompt-caching-guide-openai-anthropic)
