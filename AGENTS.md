# agentic-chat agent guide

Send one opted-in message by WhatsApp, Telegram, or Messenger.

## Three faces

- SDK: `sendMessage(input)`
- CLI: `agentic-chat send ...`
- MCP: `send_message` and `log_stop`

Dry run is the default. Do not use live delivery without an adapter.
Honor opt-in and quiet-hour guard denials. Log inbound STOP with
`logStop`. Never present a vendor error as success.
