import { describe, expect, test } from "vitest";
import { logStop, sendMessage, VendorError } from "./core.js";
import { runCli } from "./cli.js";
describe("chat", () => {
 test("defaults to a dry run", async () => expect(await sendMessage({ channel: "telegram", contact: "fixture-contact", message: "Hello", optedIn: true })).toMatchObject({ dryRun: true, status: "preview" }));
 test("denies contacts without opt in", async () => await expect(sendMessage({ channel: "whatsapp", contact: "fixture", message: "Hi", optedIn: false })).rejects.toThrow("opted in"));
 test("honors quiet hours", async () => await expect(sendMessage({ channel: "messenger", contact: "fixture", message: "Hi", optedIn: true, quietHours: { startHour: 1, endHour: 5 } }, { now: new Date("2026-01-01T03:00:00Z") })).rejects.toThrow("quiet hours"));
 test("requires an adapter for live delivery", async () => await expect(sendMessage({ channel: "telegram", contact: "fixture", message: "Hi", optedIn: true }, { dryRun: false })).rejects.toBeInstanceOf(VendorError));
 test("logs STOP", () => expect(logStop({ contact: "fixture", channel: "telegram", text: "STOP", receivedAt: "2026-01-01T00:00:00Z" })).toMatchObject({ action: "opt_out_logged" }));
 test("CLI dry run is default", async () => { const lines: string[] = []; await runCli(["send", "--channel", "telegram", "--contact", "fixture", "--message", "Hi", "--opted-in", "true"], { out: (line) => lines.push(line), err: () => {}, send: (input, live) => sendMessage(input, { dryRun: !live }) }); expect(JSON.parse(lines[0])).toMatchObject({ dryRun: true }); });
});

describe("live vendor adapters", () => {
 const input = { contact: "fixture-contact", message: "Hello", optedIn: true };
 const fakeFetch = (calls: string[]) => async (url: string | URL) => { calls.push(String(url)); return { ok: true, status: 200, json: async () => ({ messages: [{ id: "vendor-id" }] }), text: async () => "" }; };
 test("WhatsApp calls the official Graph API", async () => { const calls: string[] = []; const { createWhatsAppAdapter } = await import("./core.js"); await sendMessage({ channel: "whatsapp", ...input }, { dryRun: false, adapter: createWhatsAppAdapter({ accessToken: "test-token", phoneNumberId: "phone-id", fetch: fakeFetch(calls) }) }); expect(calls[0]).toBe("https://graph.facebook.com/v21.0/phone-id/messages"); });
 test("Telegram calls the official Bot API", async () => { const calls: string[] = []; const { createTelegramAdapter } = await import("./core.js"); await sendMessage({ channel: "telegram", ...input }, { dryRun: false, adapter: createTelegramAdapter({ accessToken: "test-token", fetch: fakeFetch(calls) }) }); expect(calls[0]).toBe("https://api.telegram.org/bottest-token/sendMessage"); });
 test("Facebook Messenger calls the official Graph API", async () => { const calls: string[] = []; const { createMessengerAdapter } = await import("./core.js"); await sendMessage({ channel: "messenger", ...input }, { dryRun: false, adapter: createMessengerAdapter({ accessToken: "test-token", fetch: fakeFetch(calls) }) }); expect(calls[0]).toBe("https://graph.facebook.com/v21.0/me/messages"); });
});
