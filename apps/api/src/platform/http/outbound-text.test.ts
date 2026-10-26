import { describe, expect, it } from "vitest";
import { isPrivateAddress } from "./outbound-text.ts";

describe("isPrivateAddress", () => {
	it("refuses loopback, private, link-local and multicast IPv4", (): void => {
		expect(
			[
				"127.0.0.1",
				"10.1.2.3",
				"172.16.0.1",
				"192.168.1.1",
				"169.254.10.1",
				"100.64.0.1",
				"224.0.0.1",
				"0.0.0.0",
			].every(isPrivateAddress),
		).toBe(true);
	});

	it("allows public IPv4", (): void => {
		expect(isPrivateAddress("8.8.8.8")).toBe(false);
		expect(isPrivateAddress("1.1.1.1")).toBe(false);
	});

	it("refuses loopback, unique-local, link-local and mapped IPv6", (): void => {
		expect(isPrivateAddress("::1")).toBe(true);
		expect(isPrivateAddress("fd00::1")).toBe(true);
		expect(isPrivateAddress("fe80::1")).toBe(true);
		expect(isPrivateAddress("::ffff:192.168.1.1")).toBe(true);
	});

	it("allows public IPv6", (): void => {
		expect(isPrivateAddress("2606:4700:4700::1111")).toBe(false);
	});
});
