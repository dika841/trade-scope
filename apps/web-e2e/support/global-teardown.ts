import { match, P } from "ts-pattern";

const globalTeardown = async (): Promise<void> => {
	const pid = process.env.__WEB_E2E_API_PID__;

	match(pid)
		.with(P.nullish, () => undefined)
		.otherwise((found) => {
			try {
				process.kill(-Number(found));
			} catch {}
		});
};

export default globalTeardown;
