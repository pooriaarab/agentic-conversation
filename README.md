# agentic-chat

Send one opted-in WhatsApp, Telegram, or Facebook Messenger message. Use the CLI, MCP server, or SDK. The default command is a dry run and does not use the network.

## Install

```sh
npm install agentic-chat
```

## Vendors

| Brand | Environment key | Live command |
| --- | --- | --- |
| WhatsApp | `WHATSAPP_ACCESS_TOKEN` | `agentic-chat send --channel whatsapp --contact <id> --message "Hello" --opted-in true --live` |
| Telegram | `TELEGRAM_BOT_TOKEN` | `agentic-chat send --channel telegram --contact <id> --message "Hello" --opted-in true --live` |
| Facebook Messenger | `MESSENGER_PAGE_ACCESS_TOKEN` | `agentic-chat send --channel messenger --contact <id> --message "Hello" --opted-in true --live` |

Live delivery needs the matching official adapter in your app. WhatsApp also needs a phone number ID. Do not pass `--live` until that adapter is configured.

## Quick start

This is a dry run. It exits 0 and does not use the network.

```sh
npx agentic-chat send --channel telegram --contact fixture-contact \
  --message "Hello" --opted-in true
```

## Library

```js
import { createTelegramAdapter, sendMessage } from "agentic-chat";

const adapter = createTelegramAdapter({
  accessToken: process.env.TELEGRAM_BOT_TOKEN,
});

await sendMessage({
  channel: "telegram",
  contact: "fixture-contact",
  message: "Hello",
  optedIn: true,
}, { dryRun: false, adapter });
```

## MCP

Start the server and call `send_message` or `log_stop`.

```sh
npx agentic-chat mcp
```

`send_message` is a dry run by default. It requires `optedIn: true`. Set quiet hours to block sends during that window. Use `log_stop` for an inbound `STOP` opt-out.

## Safety

The pack blocks contacts without opt-in. It honors quiet hours. It logs STOP events. Vendor errors are not reported as success.

## License

MIT
