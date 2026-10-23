import { describe, expect, it } from "vitest";
import { rateLimitIdentifierFrom } from "#/platform/http/rate-limit-identifier.ts";

const TRUSTED_PROXY = "127.0.0.1";
const CLIENT_IP = "203.0.113.7";
const UNTRUSTED_IP = "198.51.100.11";

describe("rateLimitIdentifierFrom", () => {
	it("uses the remote address for an untrusted peer", () => {
		expect(
			rateLimitIdentifierFrom({
				remoteAddress: UNTRUSTED_IP,
				forwardedFor: CLIENT_IP,
				trustedProxyIps: [TRUSTED_PROXY],
			}),
		).toBe(UNTRUSTED_IP);
	});

	it("uses the first forwarded address from a trusted proxy", () => {
		expect(
			rateLimitIdentifierFrom({
				remoteAddress: TRUSTED_PROXY,
				forwardedFor: `${CLIENT_IP}, ${TRUSTED_PROXY}`,
				trustedProxyIps: [TRUSTED_PROXY],
			}),
		).toBe(CLIENT_IP);
	});

	it("keeps the trusted peer address when no forwarded address exists", () => {
		expect(
			rateLimitIdentifierFrom({
				remoteAddress: TRUSTED_PROXY,
				forwardedFor: undefined,
				trustedProxyIps: [TRUSTED_PROXY],
			}),
		).toBe(TRUSTED_PROXY);
	});
});
