// Main application controller
class GCMSAnalyzer {
    constructor() {
        this.fileInput = document.getElementById('fileInput');
        this.uploadStatus = document.getElementById('uploadStatus');
        this.resultsTableBody = document.getElementById('resultsTableBody');
        this.chromatogramChart = null;
        this.massSpectraChart = null;
        this.pathwayVisualizer = null;
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // File input change handler
        this.fileInput.addEventListener('change', (event) => this.handleFileUpload(event));

        // Drag and drop handlers
        const dropZone = this.fileInput.parentElement;
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            
            if (e.dataTransfer.files.length) {
                this.fileInput.files = e.dataTransfer.files;
                this.handleFileUpload({ target: this.fileInput });
            }
        });

        // Listen for PubChem data updates
        window.addEventListener('pubchem-data-updated', (event) => {
            const { compoundName, data } = event.detail;
            this.updateCompoundInfo(compoundName, data);
        });
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            // Show loading state
            this.showStatus('Loading file...', 'loading');

            // Parse the CSV file
            const parsedData = await FileHandler.parseFile(file);
            
            // Process the GCMS data
            const processedData = await ChromatogramAnalyzer.processData(parsedData);
            
            // Update visualizations
            this.updateVisualizations(processedData);
            
            // Process metabolites
            await this.processMetabolites(processedData.metabolites);

            this.showStatus('File processed successfully!', 'success');
        } catch (error) {
            console.error('Error processing file:', error);
            this.showStatus(`Error: ${error.message}`, 'error');
        }
    }

    async processMetabolites(metabolites) {
        try {
            // Clear existing results
            this.resultsTableBody.innerHTML = '';

            // Process metabolites in batches
            const batchSize = 5;
            for (let i = 0; i < metabolites.length; i += batchSize) {
                const batch = metabolites.slice(i, i + batchSize);
                
                // Create rows with loading state
                batch.forEach(metabolite => {
                    const row = this.createTableRow(metabolite);
                    this.resultsTableBody.appendChild(row);
                });

                // Process batch in parallel
                await Promise.all(batch.map(async metabolite => {
                    try {
                        // Get gene locus ID
                        const geneLocusId = await MetaboliteMapper.mapToGeneLocusID(metabolite.name);
                        
                        // Get PubChem data
                        const pubchemData = await PubChemIntegration.fetchCompoundInfo(metabolite.name);

                        // Update row with fetched data
                        this.updateTableRow(metabolite.name, {
                            ...metabolite,
                            geneLocusId,
                            pubchemId: pubchemData.id
                        });

                        // Update pathway visualization if available
                        if (geneLocusId !== 'Not found') {
                            await NetworkVisualizer.addMetaboliteToPathway(metabolite.name, geneLocusId);
                        }
                    } catch (error) {
                        console.error(`Error processing metabolite ${metabolite.name}:`, error);
                    }
                }));

                // Add delay between batches
                if (i + batchSize < metabolites.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        } catch (error) {
            console.error('Error processing metabolites:', error);
            this.showStatus('Error processing metabolites', 'error');
        }
    }

    createTableRow(metabolite) {
        const row = document.createElement('tr');
        row.id = `row-${metabolite.name.replace(/\s+/g, '-')}`;
        row.className = 'hover:bg-gray-50';
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">${metabolite.name}</td>
            <td class="px-6 py-4 whitespace-nowrap">${metabolite.retentionTime.toFixed(2)}</td>
            <td class="px-6 py-4 whitespace-nowrap">${metabolite.intensity.toFixed(0)}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="loading-spinner"></div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="loading-spinner"></div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div data-compound="${metabolite.name}" data-property="properties" class="text-sm"></div>
            </td>
        `;
        return row;
    }

    updateTableRow(metaboliteName, data) {
        const row = document.getElementById(`row-${metaboliteName.replace(/\s+/g, '-')}`);
        if (!row) return;

        const cells = row.getElementsByTagName('td');
        
        // Update gene locus ID
        cells[3].innerHTML = data.geneLocusId;
        cells[3].className = data.geneLocusId === 'Not found' ? 
            'px-6 py-4 whitespace-nowrap text-gray-500' :
            'px-6 py-4 whitespace-nowrap text-blue-600';

        // Update PubChem ID
        cells[4].innerHTML = data.pubchemId !== 'Not found' ? 
            `<a href="https://pubchem.ncbi.nlm.nih.gov/compound/${data.pubchemId}" 
                target="_blank" 
                class="text-blue-600 hover:text-blue-800">${data.pubchemId}</a>` :
            '<span class="text-gray-500">Not found</span>';
    }

    updateCompoundInfo(compoundName, data) {
        const row = document.getElementById(`row-${compoundName.replace(/\s+/g, '-')}`);
        if (!row) return;

        const propertiesCell = row.querySelector('[data-property="properties"]');
        if (propertiesCell && data.properties) {
            const { MolecularFormula, MolecularWeight } = data.properties;
            propertiesCell.innerHTML = MolecularFormula && MolecularWeight ?
                `${MolecularFormula} (MW: ${parseFloat(MolecularWeight).toFixed(2)})` :
                '';
        }
    }

    updateVisualizations(data) {
        // Update chromatogram
        this.updateChromatogramChart(data.chromatogramData);
        
        // Update mass spectra
        this.updateMassSpectraChart(data.massSpectraData);
        
        // Initialize or update pathway visualization
        this.initializePathwayVisualization();
    }

    updateChromatogramChart(data) {
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
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Chromatogram'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Retention Time (min)'
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

    updateMassSpectraChart(data) {
        const ctx = document.getElementById('massSpectraChart').getContext('2d');
        
        if (this.massSpectraChart) {
            this.massSpectraChart.destroy();
        }

        this.massSpectraChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.mzValues,
                datasets: [{
                    label: 'Intensity',
                    data: data.intensities,
                    backgroundColor: '#3B82F6'
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
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'm/z'
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

    initializePathwayVisualization() {
        if (!this.pathwayVisualizer) {
            this.pathwayVisualizer = NetworkVisualizer.initialize('pathwayVisualization');
        }
    }

    showStatus(message, type = 'info') {
        const statusClasses = {
            info: 'bg-blue-100 text-blue-700 border-blue-500',
            success: 'bg-green-100 text-green-700 border-green-500',
            error: 'bg-red-100 text-red-700 border-red-500',
            loading: 'bg-gray-100 text-gray-700 border-gray-500'
        };

        this.uploadStatus.innerHTML = `
            <div class="border rounded-lg p-4 ${statusClasses[type]}">
                ${type === 'loading' ? '<div class="loading-spinner mr-2 inline-block"></div>' : ''}
                ${message}
            </div>
        `;
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gcmsAnalyzer = new GCMSAnalyzer();
});
