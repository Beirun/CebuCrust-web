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

  const revenueValues = props.data.map(item => item.revenue)
  const minRevenue = revenueValues.length ? Math.min(...revenueValues) : 0
  const maxRevenue = revenueValues.length ? Math.max(...revenueValues) : 0
  const padding =
    revenueValues.length > 1 ? Math.max((maxRevenue - minRevenue) * 0.1, maxRevenue * 0.05) : 100
  const suggestedMin = Math.max(0, minRevenue - padding)
  const suggestedMax = maxRevenue + padding

  // Destroy existing chart
  if (chartInstance) {
    chartInstance.destroy()
  }

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: props.data.map(item => item.month),
      datasets: [
        {
          label: 'Revenue (₱)',
          data: props.data.map(item => item.revenue),
          backgroundColor: '#f97316', // orange-500
          borderColor: '#f97316',
          borderWidth: 0,
          borderRadius: 4,
          borderSkipped: false
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
          min: suggestedMin,
          max: suggestedMax || 1000,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          },
          ticks: {
            color: '#6b7280',
            callback: function(value) {
              return '₱' + value.toLocaleString()
            }
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
        bar: {
          hoverBackgroundColor: '#ea580c' // orange-600 for hover
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
