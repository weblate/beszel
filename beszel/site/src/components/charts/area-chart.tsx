import { Area, AreaChart, CartesianGrid, YAxis } from "recharts"

import { ChartContainer, ChartTooltip, ChartTooltipContent, xAxis } from "@/components/ui/chart"
import {
	useYAxisWidth,
	cn,
	formatShortDate,
	toFixedWithoutTrailingZeros,
	decimalString,
	chartMargin,
} from "@/lib/utils"
// import Spinner from '../spinner'
import { ChartData } from "@/types"
import { memo, useMemo } from "react"
import { useTranslation } from "react-i18next"

/** [label, key, color, opacity] */
type DataKeys = [string, string, number, number]

const getNestedValue = (path: string, max = false, data: any): number | null => {
	// fallback value (obj?.stats?.cpum ? 0 : null) should only come into play when viewing
	// a max value which doesn't exist, or the value was zero and omitted from the stats object.
	// so we check if cpum is present. if so, return 0 to make sure the zero value is displayed.
	// if not, return null - there is no max data so do not display anything.
	return `stats.${path}${max ? "m" : ""}`
		.split(".")
		.reduce((acc: any, key: string) => acc?.[key] ?? (data.stats?.cpum ? 0 : null), data)
}

export default memo(function AreaChartDefault({
	maxToggled = false,
	unit = " MB/s",
	chartName,
	chartData,
}: {
	maxToggled?: boolean
	unit?: string
	chartName: string
	chartData: ChartData
}) {
	const { yAxisWidth, updateYAxisWidth } = useYAxisWidth()
	const { t } = useTranslation()

	const { chartTime } = chartData

	const showMax = chartTime !== "1h" && maxToggled

	const dataKeys: DataKeys[] = useMemo(() => {
		// [label, key, color, opacity]
		if (chartName === t("alerts.info.cpu_usage")) {
			return [[chartName, "cpu", 1, 0.4]]
		} else if (chartName === "dio") {
			return [
				[t("monitor.write"), "dw", 3, 0.3],
				[t("monitor.read"), "dr", 1, 0.3],
			]
		} else if (chartName === "bw") {
			return [
				[t("monitor.sent"), "ns", 5, 0.2],
				[t("monitor.received"), "nr", 2, 0.2],
			]
		} else if (chartName.startsWith("efs")) {
			return [
				[t("monitor.write"), `${chartName}.w`, 3, 0.3],
				[t("monitor.read"), `${chartName}.r`, 1, 0.3],
			]
		}
		return []
	}, [t])

	// console.log('Rendered at', new Date())

	if (chartData.systemStats.length === 0) {
		return null
	}

	return (
		<div>
			<ChartContainer
				className={cn("h-full w-full absolute aspect-auto bg-card opacity-0 transition-opacity", {
					"opacity-100": yAxisWidth,
				})}
			>
				<AreaChart accessibilityLayer data={chartData.systemStats} margin={chartMargin}>
					<CartesianGrid vertical={false} />
					<YAxis
						direction="ltr"
						orientation={chartData.orientation}
						className="tracking-tighter"
						width={yAxisWidth}
						tickFormatter={(value) => {
							const val = toFixedWithoutTrailingZeros(value, 2) + unit
							return updateYAxisWidth(val)
						}}
						tickLine={false}
						axisLine={false}
					/>
					{xAxis(chartData)}
					<ChartTooltip
						animationEasing="ease-out"
						animationDuration={150}
						content={
							<ChartTooltipContent
								labelFormatter={(_, data) => formatShortDate(data[0].payload.created)}
								contentFormatter={(item) => decimalString(item.value) + unit}
								// indicator="line"
							/>
						}
					/>
					{dataKeys.map((key, i) => {
						const color = `hsl(var(--chart-${key[2]}))`
						return (
							<Area
								key={i}
								dataKey={getNestedValue.bind(null, key[1], showMax)}
								name={key[0]}
								type="monotoneX"
								fill={color}
								fillOpacity={key[3]}
								stroke={color}
								isAnimationActive={false}
							/>
						)
					})}
					{/* <ChartLegend content={<ChartLegendContent />} /> */}
				</AreaChart>
			</ChartContainer>
		</div>
	)
})
