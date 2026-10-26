import { match, P } from "ts-pattern";

const globalTeardown = async (): Promise<void> => {
	const pids = [
		process.env.__WEB_E2E_WORKER_PID__,
		process.env.__WEB_E2E_API_PID__,
	];

	for (const pid of pids) {
		match(pid)
			.with(P.nullish, () => undefined)
			.otherwise((found) => {
				try {
					process.kill(-Number(found));
				} catch {}
			});
	}
};

export default globalTeardown;
