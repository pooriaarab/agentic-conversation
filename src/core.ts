export type Channel = "whatsapp" | "telegram" | "messenger";
export interface SendMessageInput { channel: Channel; contact: string; message: string; optedIn: boolean; quietHours?: { startHour: number; endHour: number; timezone?: string }; }
export interface SendMessageResult { dryRun: boolean; channel: Channel; contact: string; message: string; status: "preview" | "sent"; id?: string; sentAt?: string; }
export class GuardError extends Error { constructor(message: string) { super(message); this.name = "GuardError"; } }
export class VendorError extends Error { constructor(message: string, readonly status?: number) { super(message); this.name = "VendorError"; } }
export interface ChatAdapter { readonly channel: Channel; send(input: SendMessageInput): Promise<{ id: string; sentAt: string }>; }
export type FetchLike = (input: string | URL, init?: RequestInit) => Promise<{ ok: boolean; status: number; json(): Promise<unknown>; text(): Promise<string> }>;

function inQuietHours(hours: NonNullable<SendMessageInput["quietHours"]>, now: Date): boolean { const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: hours.timezone ?? "UTC" }).format(now)); return hours.startHour <= hours.endHour ? hour >= hours.startHour && hour < hours.endHour : hour >= hours.startHour || hour < hours.endHour; }
export function validateMessage(input: SendMessageInput, now = new Date()): void { if (!input.optedIn) throw new GuardError("contact has not opted in"); if (!input.contact.trim()) throw new GuardError("contact is required"); if (!input.message.trim()) throw new GuardError("message is required"); if (input.quietHours && inQuietHours(input.quietHours, now)) throw new GuardError("quiet hours are active for this contact"); }
export function createDryRunResult(input: SendMessageInput): SendMessageResult { return { dryRun: true, channel: input.channel, contact: input.contact, message: input.message, status: "preview" }; }
export interface SendOptions { dryRun?: boolean; adapter?: ChatAdapter; now?: Date; logger?: (event: Record<string, unknown>) => void; }
export async function sendMessage(input: SendMessageInput, options: SendOptions = {}): Promise<SendMessageResult> { validateMessage(input, options.now); const result = options.dryRun !== false ? createDryRunResult(input) : await sendLive(input, options.adapter); options.logger?.({ event: "message", ...result }); return result; }
async function sendLive(input: SendMessageInput, adapter?: ChatAdapter): Promise<SendMessageResult> { if (!adapter) throw new VendorError(`live ${input.channel} delivery needs a configured ${input.channel} adapter`); if (adapter.channel !== input.channel) throw new VendorError(`adapter channel ${adapter.channel} does not match ${input.channel}`); const receipt = await adapter.send(input); return { dryRun: false, channel: input.channel, contact: input.contact, message: input.message, status: "sent", ...receipt }; }

export interface VendorAdapterOptions { accessToken: string; fetch?: FetchLike; phoneNumberId?: string; }
const receipt = (value: unknown): { id: string; sentAt: string } => {
  const body = value as { messages?: Array<{ id?: unknown }>; message_id?: unknown; id?: unknown };
  const id = body.messages?.[0]?.id ?? body.message_id ?? body.id;
  if (typeof id !== "string" || !id) throw new VendorError("vendor response did not include a message id");
  return { id, sentAt: new Date().toISOString() };
};
async function post(fetcher: FetchLike, url: string, accessToken: string, body: unknown): Promise<{ id: string; sentAt: string }> {
  const response = await fetcher(url, { method: "POST", headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!response.ok) throw new VendorError(await response.text(), response.status);
  return receipt(await response.json());
}
export function createWhatsAppAdapter(options: VendorAdapterOptions): ChatAdapter {
  if (!options.phoneNumberId) throw new VendorError("WhatsApp needs a phone number ID");
  const fetcher = options.fetch ?? fetch as unknown as FetchLike;
  return { channel: "whatsapp", send: (input) => post(fetcher, `https://graph.facebook.com/v21.0/${encodeURIComponent(options.phoneNumberId!)}/messages`, options.accessToken, { messaging_product: "whatsapp", to: input.contact, type: "text", text: { body: input.message } }) };
}
export function createTelegramAdapter(options: VendorAdapterOptions): ChatAdapter {
  const fetcher = options.fetch ?? fetch as unknown as FetchLike;
  return { channel: "telegram", send: (input) => post(fetcher, `https://api.telegram.org/bot${encodeURIComponent(options.accessToken)}/sendMessage`, options.accessToken, { chat_id: input.contact, text: input.message }) };
}
export function createMessengerAdapter(options: VendorAdapterOptions): ChatAdapter {
  const fetcher = options.fetch ?? fetch as unknown as FetchLike;
  return { channel: "messenger", send: (input) => post(fetcher, "https://graph.facebook.com/v21.0/me/messages", options.accessToken, { recipient: { id: input.contact }, message: { text: input.message } }) };
}
export interface StopEvent { contact: string; channel?: Channel; receivedAt?: string; text: string; }
export interface StopLog { contact: string; channel?: Channel; receivedAt: string; text: string; action: "opt_out_logged"; }
export function logStop(event: StopEvent): StopLog { if (event.text.trim().toUpperCase() !== "STOP") throw new GuardError("STOP log needs text exactly STOP"); if (!event.contact.trim()) throw new GuardError("contact is required"); return { contact: event.contact, channel: event.channel, receivedAt: event.receivedAt ?? new Date().toISOString(), text: "STOP", action: "opt_out_logged" }; }
