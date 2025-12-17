// Chart.js configuration and helpers

// Color palette
const COLORS = {
    primary: '#2563eb',
    success: '#16a34a',
    warning: '#ea580c',
    danger: '#dc2626',
    info: '#0891b2',
    purple: '#9333ea',
    pink: '#db2777',
    amber: '#f59e0b',
};

const CHART_COLORS = [
    '#2563eb', // Blue
    '#16a34a', // Green
    '#ea580c', // Orange
    '#db2777', // Pink
    '#9333ea', // Purple
    '#0891b2', // Cyan
    '#f59e0b', // Amber
    '#dc2626', // Red
];

// Default chart options
const defaultOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
        legend: {
            display: true,
            position: 'top',
            labels: {
                padding: 15,
                font: {
                    size: 12,
                    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }
            }
        },
        tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            titleFont: {
                size: 14,
                weight: 'bold'
            },
            bodyFont: {
                size: 13
            },
            displayColors: true,
            callbacks: {}
        }
    },
    animation: {
        duration: 1000,
        easing: 'easeInOutQuart'
    }
};

/**
 * Create Bookings Trend Line Chart
 */
function createTrendChart(bookingsPerDay) {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return null;

    // Sort by date and prepare data
    const sortedData = bookingsPerDay.sort((a, b) =>
        new Date(a.booking_date) - new Date(b.booking_date)
    );

    const labels = sortedData.map(item => {
        const date = new Date(item.booking_date + 'T00:00:00');
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    });

    const data = sortedData.map(item => parseInt(item.count));

    // Create gradient
    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(37, 99, 235, 0.3)');
    gradient.addColorStop(1, 'rgba(37, 99, 235, 0.0)');

    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Bookings',
                data: data,
                borderColor: COLORS.primary,
                backgroundColor: gradient,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: COLORS.primary,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverBackgroundColor: COLORS.primary,
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 3
            }]
        },
        options: {
            ...defaultOptions,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        display: false,
                        drawBorder: false
                    }
                }
            },
            plugins: {
                ...defaultOptions.plugins,
                tooltip: {
                    ...defaultOptions.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            return `Bookings: ${context.parsed.y}`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Create Services Distribution Pie Chart
 */
function createServicesChart(bookingsByService) {
    const ctx = document.getElementById('servicesChart');
    if (!ctx) return null;

    const labels = bookingsByService.map(item => item.name);
    const data = bookingsByService.map(item => parseInt(item.count));
    const total = data.reduce((sum, val) => sum + val, 0);

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: CHART_COLORS,
                borderColor: '#fff',
                borderWidth: 3,
                hoverOffset: 10
            }]
        },
        options: {
            ...defaultOptions,
            cutout: '60%',
            plugins: {
                ...defaultOptions.plugins,
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12
                        },
                        generateLabels: function(chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => {
                                    const value = data.datasets[0].data[i];
                                    const percentage = total > 0
                                        ? ((value / total) * 100).toFixed(1)
                                        : 0;
                                    return {
                                        text: `${label}: ${value} (${percentage}%)`,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        hidden: false,
                                        index: i
                                    };
                                });
                            }
                            return [];
                        }
                    }
                },
                tooltip: {
                    ...defaultOptions.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const percentage = total > 0
                                ? ((value / total) * 100).toFixed(1)
                                : 0;
                            return `${context.label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Create Masters Performance Bar Chart
 */
function createMastersChart(bookingsByMaster) {
    const ctx = document.getElementById('mastersChart');
    if (!ctx) return null;

    // Sort by count descending
    const sortedData = bookingsByMaster.sort((a, b) =>
        parseInt(b.count) - parseInt(a.count)
    );

    const labels = sortedData.map(item => item.name);
    const data = sortedData.map(item => parseInt(item.count));

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Bookings',
                data: data,
                backgroundColor: CHART_COLORS[1], // Green
                borderColor: CHART_COLORS[1],
                borderWidth: 0,
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            ...defaultOptions,
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    }
                },
                y: {
                    ticks: {
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        display: false,
                        drawBorder: false
                    }
                }
            },
            plugins: {
                ...defaultOptions.plugins,
                legend: {
                    display: false
                },
                tooltip: {
                    ...defaultOptions.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            return `Bookings: ${context.parsed.x}`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Create Busiest Hours Bar Chart
 */
function createHoursChart(busiestHours) {
    const ctx = document.getElementById('hoursChart');
    if (!ctx) return null;

    const labels = busiestHours.map(item => item.hour);
    const data = busiestHours.map(item => parseInt(item.count));

    // Create gradient bars
    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, '#9333ea');
    gradient.addColorStop(1, '#db2777');

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Bookings',
                data: data,
                backgroundColor: gradient,
                borderRadius: 8,
                borderSkipped: false,
                hoverBackgroundColor: COLORS.purple
            }]
        },
        options: {
            ...defaultOptions,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        display: false,
                        drawBorder: false
                    }
                }
            },
            plugins: {
                ...defaultOptions.plugins,
                legend: {
                    display: false
                },
                tooltip: {
                    ...defaultOptions.plugins.tooltip,
                    callbacks: {
                        title: function(context) {
                            return `Hour: ${context[0].label}`;
                        },
                        label: function(context) {
                            return `Bookings: ${context.parsed.y}`;
                        }
                    }
                }
            }
        }
    });
}

// Helper function to destroy chart if exists
function destroyChart(chart) {
    if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
    }
}

// Helper to update chart data
function updateChartData(chart, newData) {
    if (!chart) return;

    chart.data.labels = newData.labels;
    chart.data.datasets[0].data = newData.data;
    chart.update('active');
}
