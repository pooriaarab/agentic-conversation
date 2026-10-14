# agentic-chat

Send one message to an opted-in contact.

WhatsApp, Telegram, or Messenger. Dry run is the default.

## Install

```sh
npm install agentic-chat
```

## Quick start

This previews a Telegram message. It does not send it.

```sh
npx agentic-chat send --channel telegram --contact fixture-contact \
  --message "Hello" --opted-in true
```

Add `--live` only after you configure a vendor adapter in your app. A
live call without one returns a clear error. Vendor errors are returned
unchanged.

## Three uses

### CLI

Use the command to preview one message. Pass `--live` to deliver.

```sh
agentic-chat send --channel whatsapp --contact fixture-contact \
  --message "Hello" --opted-in true
```

### Library

Use the same JSON shape in code.

```js
import { sendMessage } from "agentic-chat";

const preview = await sendMessage({
  channel: "telegram",
  contact: "fixture-contact",
  message: "Hello",
  optedIn: true,
});
```

### MCP

Start the server and call `send_message` or `log_stop`.

```sh
npx agentic-chat mcp
```

`send_message` is dry run by default. It requires `optedIn: true`.
Give it quiet hours to stop sends during that window. Use `log_stop` to
record an inbound `STOP` opt-out.

## Safety

The pack does not send to contacts that have not opted in. It honors
quiet hours. It logs STOP events. Tests use fixtures and make no network
calls.

## License

MIT
