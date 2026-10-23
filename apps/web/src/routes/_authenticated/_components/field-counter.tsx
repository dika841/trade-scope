import type { FC, ReactElement } from "react";

type TFieldCounterProps = {
	length: number;
	max: number;
};

export const FieldCounter: FC<TFieldCounterProps> = (props): ReactElement => (
	<span
		className="text-xs tabular-nums text-muted-foreground data-[over=true]:text-destructive"
		data-over={props.length > props.max}
	>
		{props.length.toLocaleString()}/{props.max.toLocaleString()}
	</span>
);
