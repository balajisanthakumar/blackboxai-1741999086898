// File handling and parsing module
class FileHandler {
    static async parseFile(file) {
        // Validate file type
        if (!FileHandler.validateFileType(file)) {
            throw new Error('Invalid file type. Please upload a CSV file.');
        }

        // Parse CSV file
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: (results) => {
                    try {
                        if (results.errors.length > 0) {
                            throw new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`);
                        }
                        const validatedData = FileHandler.validateData(results.data);
                        resolve(validatedData);
                    } catch (error) {
                        reject(error);
                    }
                },
                error: (error) => {
                    reject(new Error(`Error parsing CSV file: ${error.message}`));
                },
                beforeFirstChunk: () => {
                    const event = new CustomEvent('file-processing-status', {
                        detail: { status: 'parsing', message: 'Parsing CSV file...' }
                    });
                    window.dispatchEvent(event);
                }
            });
        });
    }

    static validateFileType(file) {
        const validTypes = ['text/csv', 'application/vnd.ms-excel'];
        return validTypes.includes(file.type) || file.name.endsWith('.csv');
    }

    static validateData(data) {
        if (!data || data.length === 0) {
            throw new Error('The file appears to be empty.');
        }

        // Check for required columns
        const requiredColumns = ['Metabolite', 'RetentionTime', 'Intensity'];
        const headers = Object.keys(data[0]);
        
        // Case-insensitive column matching
        const normalizedHeaders = headers.map(h => h.toLowerCase());
        const missingColumns = requiredColumns.filter(col => 
            !normalizedHeaders.includes(col.toLowerCase())
        );

        if (missingColumns.length > 0) {
            throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
        }

        // Find the actual column names (preserving original case)
        const columnMapping = {
            Metabolite: headers.find(h => h.toLowerCase() === 'metabolite'),
            RetentionTime: headers.find(h => h.toLowerCase() === 'retentiontime'),
            Intensity: headers.find(h => h.toLowerCase() === 'intensity')
        };

        // Normalize and validate data structure
        return data.map((row, index) => {
            try {
                // Validate retention time
                const retentionTime = parseFloat(row[columnMapping.RetentionTime]);
                if (isNaN(retentionTime)) {
                    throw new Error(`Invalid retention time at row ${index + 1}`);
                }

                // Validate intensity
                const intensity = parseFloat(row[columnMapping.Intensity]);
                if (isNaN(intensity)) {
                    throw new Error(`Invalid intensity value at row ${index + 1}`);
                }

                // Validate metabolite name
                const metaboliteName = row[columnMapping.Metabolite];
                if (!metaboliteName || typeof metaboliteName !== 'string') {
                    throw new Error(`Invalid or missing metabolite name at row ${index + 1}`);
                }

                // Return normalized row data
                return {
                    name: metaboliteName.trim(),
                    retentionTime: retentionTime,
                    intensity: intensity,
                    // Store any additional columns that might be present
                    additionalData: Object.entries(row)
                        .filter(([key]) => !Object.values(columnMapping).includes(key))
                        .reduce((acc, [key, value]) => {
                            acc[key] = value;
                            return acc;
                        }, {})
                };
            } catch (error) {
                // Add row number to error message
                error.message = `Row ${index + 1}: ${error.message}`;
                throw error;
            }
        });
    }

    static extractChromatogramData(data) {
        // Sort data by retention time
        const sortedData = [...data].sort((a, b) => a.retentionTime - b.retentionTime);

        // Emit processing status
        window.dispatchEvent(new CustomEvent('file-processing-status', {
            detail: { 
                status: 'processing',
                message: 'Generating chromatogram...',
                progress: 33
            }
        }));

        return {
            times: sortedData.map(row => row.retentionTime),
            intensities: sortedData.map(row => row.intensity)
        };
    }

    static extractMassSpectraData(data) {
        // Group intensities by retention time
        const spectraMap = new Map();
        
        data.forEach(row => {
            if (!spectraMap.has(row.retentionTime)) {
                spectraMap.set(row.retentionTime, []);
            }
            spectraMap.get(row.retentionTime).push(row.intensity);
        });

        // Emit processing status
        window.dispatchEvent(new CustomEvent('file-processing-status', {
            detail: { 
                status: 'processing',
                message: 'Analyzing mass spectra...',
                progress: 66
            }
        }));

        // Calculate average spectra
        const mzValues = Array.from({ length: 100 }, (_, i) => i + 1); // Example m/z range
        const intensities = Array.from(spectraMap.values())
            .reduce((acc, intensities) => {
                intensities.forEach((intensity, i) => {
                    acc[i] = (acc[i] || 0) + intensity;
                });
                return acc;
            }, [])
            .map(sum => sum / spectraMap.size);

        return {
            mzValues,
            intensities
        };
    }

    static async loadSampleData() {
        try {
            // Emit start status
            window.dispatchEvent(new CustomEvent('file-processing-status', {
                detail: { 
                    status: 'loading',
                    message: 'Loading sample data...',
                    progress: 0
                }
            }));

            const response = await fetch('/gcms-analyzer/data/sample-data.csv');
            if (!response.ok) {
                throw new Error('Failed to load sample data');
            }

            const text = await response.text();
            const file = new File([text], 'sample-data.csv', { type: 'text/csv' });
            
            // Parse the file
            const data = await this.parseFile(file);

            // Emit completion status
            window.dispatchEvent(new CustomEvent('file-processing-status', {
                detail: { 
                    status: 'complete',
                    message: 'Sample data loaded successfully',
                    progress: 100
                }
            }));

            return data;
        } catch (error) {
            // Emit error status
            window.dispatchEvent(new CustomEvent('file-processing-status', {
                detail: { 
                    status: 'error',
                    message: error.message,
                    progress: 0
                }
            }));
            throw error;
        }
    }
}

// Export the FileHandler class
window.FileHandler = FileHandler;

// Listen for file processing status events
window.addEventListener('file-processing-status', (event) => {
    const { status, message, progress } = event.detail;
    const uploadStatus = document.getElementById('uploadStatus');
    
    if (uploadStatus) {
        let statusClass = '';
        let icon = '';
        
        switch (status) {
            case 'loading':
            case 'parsing':
            case 'processing':
                statusClass = 'bg-blue-100 text-blue-700 border-blue-500';
                icon = '<div class="loading-spinner mr-2 inline-block"></div>';
                break;
            case 'complete':
                statusClass = 'bg-green-100 text-green-700 border-green-500';
                icon = '<i class="fas fa-check-circle mr-2"></i>';
                break;
            case 'error':
                statusClass = 'bg-red-100 text-red-700 border-red-500';
                icon = '<i class="fas fa-exclamation-circle mr-2"></i>';
                break;
        }

        uploadStatus.innerHTML = `
            <div class="border rounded-lg p-4 ${statusClass} flex items-center">
                ${icon}
                <span>${message}</span>
                ${progress ? `<div class="ml-auto">${progress}%</div>` : ''}
            </div>
        `;
    }
});
