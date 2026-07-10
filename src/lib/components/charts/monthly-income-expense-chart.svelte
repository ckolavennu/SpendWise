<script lang="ts">
	import {
		BarController,
		BarElement,
		CategoryScale,
		Chart,
		Legend,
		LinearScale,
		Tooltip,
		type ChartConfiguration
	} from 'chart.js';
	import { onDestroy, onMount } from 'svelte';
	import type { MonthlyReportItem } from '$lib/utils/reports';

	Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

	interface Props {
		data: MonthlyReportItem[];
	}

	let { data }: Props = $props();

	let canvas: HTMLCanvasElement;
	let chart: Chart<'bar'> | null = null;
	let mounted = $state(false);

	function renderChart(chartData: MonthlyReportItem[]) {
		if (!canvas || chartData.length === 0) return;

		chart?.destroy();

		const config: ChartConfiguration<'bar'> = {
			type: 'bar',
			data: {
				labels: chartData.map((item) => item.month),
				datasets: [
					{
						label: 'Income',
						data: chartData.map((item) => item.income),
						backgroundColor: '#10b981'
					},
					{
						label: 'Expenses',
						data: chartData.map((item) => item.expenses),
						backgroundColor: '#ef4444'
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						position: 'bottom',
						labels: {
							color: '#e5e7eb'
						}
					},
					tooltip: {
						callbacks: {
							label(context) {
								const value = Number(context.raw ?? 0);

								return `${context.dataset.label}: ${new Intl.NumberFormat('en-MY', {
									style: 'currency',
									currency: 'MYR'
								}).format(value)}`;
							}
						}
					}
				},
				scales: {
					x: {
						ticks: {
							color: '#9ca3af'
						},
						grid: {
							color: '#262626'
						}
					},
					y: {
						ticks: {
							color: '#9ca3af',
							callback(value) {
								return new Intl.NumberFormat('en-MY', {
									style: 'currency',
									currency: 'MYR',
									maximumFractionDigits: 0
								}).format(Number(value));
							}
						},
						grid: {
							color: '#262626'
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
	<canvas bind:this={canvas} aria-label="Monthly income and expenses chart"></canvas>
</div>