// Chromatogram analysis and visualization module
class ChromatogramAnalyzer {
    static chromatogramChart = null;
    static massSpectraChart = null;

    /**
     * Process GCMS data
     * @param {Array} data - Array of parsed GCMS data points
     * @returns {Object} - Processed data for visualization
     */
    static processData(data) {
        try {
            // Extract chromatogram data
            const chromatogramData = this.extractChromatogramData(data);
            
            // Extract mass spectra data
            const massSpectraData = this.extractMassSpectraData(data);
            
            // Get metabolites list
            const metabolites = this.extractMetabolites(data);

            return {
                chromatogramData,
                massSpectraData,
                metabolites
            };
        } catch (error) {
            console.error('Error processing GCMS data:', error);
            throw error;
        }
    }

    /**
     * Extract chromatogram data from GCMS data
     * @param {Array} data - Array of data points
     * @returns {Object} - Chromatogram data
     */
    static extractChromatogramData(data) {
        // Sort data by retention time
        const sortedData = [...data].sort((a, b) => a.retentionTime - b.retentionTime);

        return {
            times: sortedData.map(row => row.retentionTime),
            intensities: sortedData.map(row => row.intensity),
            labels: sortedData.map(row => row.name)
        };
    }

    /**
     * Extract mass spectra data
     * @param {Array} data - Array of data points
     * @returns {Object} - Mass spectra data
     */
    static extractMassSpectraData(data) {
        // Calculate average intensities for each metabolite
        const intensityMap = new Map();
        data.forEach(row => {
            if (!intensityMap.has(row.name)) {
                intensityMap.set(row.name, []);
            }
            intensityMap.get(row.name).push(row.intensity);
        });

        const metabolites = Array.from(intensityMap.keys());
        const intensities = Array.from(intensityMap.values())
            .map(intensities => 
                intensities.reduce((sum, val) => sum + val, 0) / intensities.length
            );

        return {
            metabolites,
            intensities
        };
    }

    /**
     * Extract unique metabolites from data
     * @param {Array} data - Array of data points
     * @returns {Array} - Array of metabolite objects
     */
    static extractMetabolites(data) {
        const metaboliteMap = new Map();
        
        data.forEach(row => {
            if (!metaboliteMap.has(row.name)) {
                metaboliteMap.set(row.name, {
                    name: row.name,
                    retentionTime: row.retentionTime,
                    intensity: row.intensity,
                    additionalData: row.additionalData || {}
                });
            }
        });

        return Array.from(metaboliteMap.values());
    }

    /**
     * Update chromatogram visualization
     * @param {Object} data - Chromatogram data
     */
    static updateChromatogram(data) {
        const ctx = document.getElementById('chromatogramChart').getContext('2d');
        
        if (this.chromatogramChart) {
            this.chromatogramChart.destroy();
        }

        this.chromatogramChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.times,
                datasets: [{
                    label: 'Intensity',
                    data: data.intensities,
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Chromatogram'
                    },
                    tooltip: {
                        callbacks: {
                            title: (context) => {
                                const index = context[0].dataIndex;
                                return `Retention Time: ${data.times[index].toFixed(2)} min`;
                            },
                            label: (context) => {
                                const index = context.dataIndex;
                                return [
                                    `Intensity: ${data.intensities[index].toFixed(0)}`,
                                    `Metabolite: ${data.labels[index]}`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Retention Time (min)'
                        },
                        ticks: {
                            callback: (value) => value.toFixed(1)
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Intensity'
                        },
                        beginAtZero: true
                    }
                }
            }
        });
    }

    /**
     * Update mass spectra visualization
     * @param {Object} data - Mass spectra data
     */
    static updateMassSpectra(data) {
        const ctx = document.getElementById('massSpectraChart').getContext('2d');
        
        if (this.massSpectraChart) {
            this.massSpectraChart.destroy();
        }

        this.massSpectraChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.metabolites,
                datasets: [{
                    label: 'Average Intensity',
                    data: data.intensities,
                    backgroundColor: '#3B82F6',
                    borderColor: '#2563EB',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Mass Spectra'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `Intensity: ${context.raw.toFixed(0)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Metabolite'
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Average Intensity'
                        },
                        beginAtZero: true
                    }
                }
            }
        });
    }

    /**
     * Find peaks in chromatogram data
     * @param {Array} intensities - Array of intensity values
     * @param {number} threshold - Peak detection threshold
     * @returns {Array} - Array of peak indices
     */
    static findPeaks(intensities, threshold = 0.1) {
        const peaks = [];
        const maxIntensity = Math.max(...intensities);
        const minPeakHeight = maxIntensity * threshold;

        for (let i = 1; i < intensities.length - 1; i++) {
            if (intensities[i] > minPeakHeight &&
                intensities[i] > intensities[i - 1] &&
                intensities[i] > intensities[i + 1]) {
                peaks.push(i);
            }
        }

        return peaks;
    }

    /**
     * Calculate area under curve
     * @param {Array} times - Array of retention times
     * @param {Array} intensities - Array of intensity values
     * @returns {number} - Area under curve
     */
    static calculateArea(times, intensities) {
        let area = 0;
        for (let i = 1; i < times.length; i++) {
            const dt = times[i] - times[i - 1];
            const avgIntensity = (intensities[i] + intensities[i - 1]) / 2;
            area += dt * avgIntensity;
        }
        return area;
    }

    /**
     * Clear all charts
     */
    static clearCharts() {
        if (this.chromatogramChart) {
            this.chromatogramChart.destroy();
            this.chromatogramChart = null;
        }
        if (this.massSpectraChart) {
            this.massSpectraChart.destroy();
            this.massSpectraChart = null;
        }
    }
}

// Export the ChromatogramAnalyzer class
window.ChromatogramAnalyzer = ChromatogramAnalyzer;
