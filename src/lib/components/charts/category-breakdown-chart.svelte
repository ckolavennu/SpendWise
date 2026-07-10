<script lang="ts">
import {
	ArcElement,
	Chart,
	DoughnutController,
	Legend,
	Tooltip,
	type ChartConfiguration
} from 'chart.js';
	import { onDestroy, onMount } from 'svelte';
	import type { CategoryBreakdownItem } from '$lib/utils/category-breakdown';

	Chart.register(ArcElement, DoughnutController, Tooltip, Legend);

	interface Props {
		data: CategoryBreakdownItem[];
	}

	let { data }: Props = $props();

	let canvas: HTMLCanvasElement;
	let chart: Chart<'doughnut'> | null = null;
	let mounted = $state(false);

	const chartColors = [
		'#10b981',
		'#ef4444',
		'#3b82f6',
		'#f59e0b',
		'#8b5cf6',
		'#ec4899',
		'#14b8a6',
		'#f97316'
	];

	function renderChart(chartData: CategoryBreakdownItem[]) {
		if (!canvas || chartData.length === 0) return;

		chart?.destroy();

		const config: ChartConfiguration<'doughnut'> = {
			type: 'doughnut',
			data: {
				labels: chartData.map((item) => item.category),
				datasets: [
					{
						label: 'Expenses',
						data: chartData.map((item) => item.total),
						backgroundColor: chartData.map((_, index) => chartColors[index % chartColors.length]),
						borderColor: '#171717',
						borderWidth: 2
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				cutout: '65%',
				plugins: {
					legend: {
						position: 'bottom',
						labels: {
							color: '#e5e7eb',
							padding: 16
						}
					},
					tooltip: {
						callbacks: {
							label(context) {
								const value = Number(context.raw ?? 0);

								return new Intl.NumberFormat('en-MY', {
									style: 'currency',
									currency: 'MYR'
								}).format(value);
							}
						}
					}
				}
			}
		};

		chart = new Chart(canvas, config);
	}

	onMount(() => {
		mounted = true;
		renderChart(data);
	});

	$effect(() => {
		if (mounted) {
			renderChart(data);
		}
	});

	onDestroy(() => {
		chart?.destroy();
	});
</script>

<div class="h-80 w-full">
	<canvas bind:this={canvas} aria-label="Expense breakdown chart"></canvas>
</div>