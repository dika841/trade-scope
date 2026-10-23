import { A, D } from "@mobily/ts-belt";
import { match, P } from "ts-pattern";
import {
	AREA,
	COMPOSITION_ROOT,
	ENTRYPOINT,
	LAYER,
	LAYER_MAY_IMPORT,
	MODULE,
	MODULE_MAY_IMPORT,
	MODULE_SURFACE,
	type TArea,
	type TLayer,
	type TModule,
} from "./architecture-rules.ts";

export type TViolation = {
	file: string;
	line: number;
	rule: string;
	edge: string;
	specifier: string;
	remedy: string;
};

type TViolationSite = Pick<TViolation, "file" | "line" | "specifier">;

export const PLACE_KIND = {
	MODULE: "module",
	AREA: "area",
	ENTRYPOINT: "entrypoint",
	UNKNOWN: "unknown",
} as const;

export const RULE = {
	UNCLASSIFIED_PATH: "unclassified-path",
	MODULE_LAYER: "module-layer",
	LAYER_BOUNDARY: "layer-boundary",
	MODULE_ISOLATION: "module-isolation",
	AREA_BOUNDARY: "area-boundary",
	RELATIVE_ESCAPE: "relative-escape",
} as const;

type TModulePlace = {
	kind: typeof PLACE_KIND.MODULE;
	module: TModule;
	layer: TLayer | null;
};

type TAreaPlace = {
	kind: typeof PLACE_KIND.AREA;
	area: TArea;
};

type TEntrypointPlace = {
	kind: typeof PLACE_KIND.ENTRYPOINT;
	path: string;
};

type TUnknownPlace = {
	kind: typeof PLACE_KIND.UNKNOWN;
	name: string;
};

export type TPlace =
	| TModulePlace
	| TAreaPlace
	| TEntrypointPlace
	| TUnknownPlace;

const MODULES: readonly string[] = D.values(MODULE);
const AREAS: readonly string[] = D.values(AREA);
const LAYERS: readonly string[] = D.values(LAYER);

const FIRST_LINE = 1;
const MODULE_ROOT_DEPTH = 2;

const SPECIFIER_PATTERNS: readonly RegExp[] = [
	/\bfrom\s*["']#\/([^"']+)["']/g,
	/\bimport\s*\(\s*["']#\/([^"']+)["']/g,
	/\bimport\s+["']#\/([^"']+)["']/g,
	/\brequire\s*\(\s*["']#\/([^"']+)["']/g,
];

export type TImportSite = { line: number; target: string };

const isModule = (value: string): value is TModule =>
	A.includes(MODULES, value);

const isArea = (value: string): value is TArea => A.includes(AREAS, value);

const isLayer = (value: string): value is TLayer => A.includes(LAYERS, value);

export const importsOf = (source: string): readonly TImportSite[] =>
	A.flat(
		A.mapWithIndex(source.split("\n"), (index, line) =>
			A.flat(
				A.map(SPECIFIER_PATTERNS, (pattern) =>
					A.filterMap([...line.matchAll(new RegExp(pattern))], (m) =>
						m[1] === undefined ? undefined : { line: index + 1, target: m[1] },
					),
				),
			),
		),
	);

const layerOf = (segment: string): TLayer | null =>
	isLayer(segment) ? segment : null;

export const placeOf = (path: string): TPlace => {
	const segments = path.split("/");
	const head = segments[0] ?? "";

	return match(head)
		.when(
			(): boolean => A.includes(ENTRYPOINT, path),
			(): TPlace => ({ kind: PLACE_KIND.ENTRYPOINT, path }),
		)
		.when(
			isModule,
			(module): TPlace => ({
				kind: PLACE_KIND.MODULE,
				module,
				layer: layerOf(segments[1] ?? ""),
			}),
		)
		.when(isArea, (area): TPlace => ({ kind: PLACE_KIND.AREA, area }))
		.otherwise((name): TPlace => ({ kind: PLACE_KIND.UNKNOWN, name }));
};

const nameOf = (place: TPlace): string =>
	match(place)
		.with({ kind: PLACE_KIND.MODULE }, (found): string => found.module)
		.with({ kind: PLACE_KIND.AREA }, (found): string => found.area)
		.with({ kind: PLACE_KIND.ENTRYPOINT }, (found): string => found.path)
		.with({ kind: PLACE_KIND.UNKNOWN }, (found): string => found.name)
		.exhaustive();

const isModuleSurface = (file: string): boolean => {
	const segments = file.split("/");
	return (
		segments.length === MODULE_ROOT_DEPTH && segments[1] === MODULE_SURFACE
	);
};

const unclassifiedViolation = (
	from: TPlace,
	file: string,
): TViolation | undefined =>
	match(from)
		.with(
			{ kind: PLACE_KIND.UNKNOWN },
			(found): TViolation => ({
				file,
				line: FIRST_LINE,
				rule: RULE.UNCLASSIFIED_PATH,
				edge: found.name,
				specifier: file,
				remedy: `add "${found.name}" to MODULE or AREA in scripts/architecture-rules.ts, or move the file`,
			}),
		)
		.otherwise((): undefined => undefined);

const surfaceViolation = (from: TPlace, file: string): TViolation | undefined =>
	match(from)
		.with(
			{ kind: PLACE_KIND.MODULE, layer: null },
			(found): TViolation | undefined =>
				isModuleSurface(file)
					? undefined
					: {
							file,
							line: FIRST_LINE,
							rule: RULE.MODULE_LAYER,
							edge: found.module,
							specifier: file,
							remedy: `every file in "${found.module}" belongs to one of ${A.join(LAYERS, ", ")}; only "${found.module}/${MODULE_SURFACE}" may sit at the module root`,
						},
		)
		.otherwise((): undefined => undefined);

const layerViolation = (
	from: TPlace,
	to: TPlace,
	site: TViolationSite,
): TViolation | undefined =>
	match({ from, to })
		.with(
			{
				from: { kind: PLACE_KIND.MODULE, layer: P.string },
				to: { kind: PLACE_KIND.MODULE, layer: P.string },
			},
			({ from: source, to: target }): TViolation | undefined =>
				source.module === target.module &&
				!A.includes(LAYER_MAY_IMPORT[source.layer], target.layer)
					? {
							...site,
							rule: RULE.LAYER_BOUNDARY,
							edge: `${source.layer} -> ${target.layer}`,
							remedy: `${source.layer} may import ${A.join(LAYER_MAY_IMPORT[source.layer], ", ")}. Move the dependency behind a port`,
						}
					: undefined,
		)
		.otherwise((): undefined => undefined);

const moduleViolation = (
	from: TPlace,
	to: TPlace,
	target: string,
	site: TViolationSite,
): TViolation | undefined =>
	match({ from, to })
		.with(
			{ from: { kind: PLACE_KIND.MODULE }, to: { kind: PLACE_KIND.MODULE } },
			({ from: source, to: destination }): TViolation | undefined =>
				source.module !== destination.module &&
				(!A.includes(MODULE_MAY_IMPORT[source.module], destination.module) ||
					target !== `${destination.module}/${MODULE_SURFACE}`)
					? {
							...site,
							rule: RULE.MODULE_ISOLATION,
							edge: `${source.module} -> ${destination.module}`,
							remedy: `cross-module access goes through "#/${destination.module}/${MODULE_SURFACE}", and the edge must be listed in MODULE_MAY_IMPORT`,
						}
					: undefined,
		)
		.otherwise((): undefined => undefined);

const areaCrossesBoundary = (
	from: TAreaPlace,
	to: TPlace,
	file: string,
): boolean =>
	match(from.area)
		.with(
			AREA.SHARED,
			(): boolean => !(to.kind === PLACE_KIND.AREA && to.area === AREA.SHARED),
		)
		.with(AREA.PLATFORM, (): boolean => to.kind === PLACE_KIND.MODULE)
		.with(
			AREA.BOOTSTRAP,
			(): boolean =>
				to.kind === PLACE_KIND.MODULE && !A.includes(COMPOSITION_ROOT, file),
		)
		.otherwise((): boolean => false);

const areaViolation = (
	from: TPlace,
	to: TPlace,
	file: string,
	site: TViolationSite,
): TViolation | undefined =>
	match(from)
		.with({ kind: PLACE_KIND.AREA }, (source): TViolation | undefined =>
			areaCrossesBoundary(source, to, file)
				? {
						...site,
						rule: RULE.AREA_BOUNDARY,
						edge: `${source.area} -> ${nameOf(to)}`,
						remedy: `${source.area} may not depend on ${nameOf(to)}`,
					}
				: undefined,
		)
		.otherwise((): undefined => undefined);

const escapeViolations = (
	file: string,
	source: string,
): readonly TViolation[] =>
	A.filterMap(source.split("\n"), (line, index) =>
		line.includes('from "../') || line.includes("from '../")
			? {
					file,
					line: index + 1,
					rule: RULE.RELATIVE_ESCAPE,
					edge: file.split("/")[0] ?? file,
					specifier: line.trim(),
					remedy: 'use an absolute "#/" specifier so the boundary is checkable',
				}
			: undefined,
	);

export const violationsFor = (
	file: string,
	source: string,
): readonly TViolation[] => {
	const from = placeOf(file);

	const edges = A.filterMap(importsOf(source), ({ line, target }) => {
		const to = placeOf(target);
		const site: TViolationSite = { file, line, specifier: `#/${target}` };

		return (
			layerViolation(from, to, site) ??
			moduleViolation(from, to, target, site) ??
			areaViolation(from, to, file, site)
		);
	});

	return A.filterMap(
		[
			unclassifiedViolation(from, file),
			surfaceViolation(from, file),
			...edges,
			...escapeViolations(file, source),
		],
		(violation) => violation,
	);
};
