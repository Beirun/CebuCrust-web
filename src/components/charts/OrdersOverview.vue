<template>
  <div class="h-64">
    <canvas ref="chartRef"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const props = defineProps<{
  data: Array<{
    month: string
    orders: number
    revenue: number
  }>
}>()

const chartRef = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

const createChart = () => {
  if (!chartRef.value) return

  const ctx = chartRef.value.getContext('2d')
  if (!ctx) return

  // Destroy existing chart
  if (chartInstance) {
    chartInstance.destroy()
  }

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: props.data.map(item => item.month),
      datasets: [
        {
          label: 'Orders',
          data: props.data.map(item => item.orders),
          borderColor: '#f97316', // orange-500
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          borderWidth: 3,
          pointBackgroundColor: '#f97316',
          pointBorderColor: '#f97316',
          pointRadius: 6,
          pointHoverRadius: 8,
          tension: 0.4,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 20
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          min: 100,
          max: 350,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          },
          ticks: {
            color: '#6b7280'
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#6b7280'
          }
        }
      },
      elements: {
        point: {
          hoverBackgroundColor: '#f97316'
        }
      }
    }
  })
}

onMounted(() => {
  nextTick(() => {
    createChart()
  })
})

watch(() => props.data, () => {
  nextTick(() => {
    createChart()
  })
}, { deep: true })
</script>
