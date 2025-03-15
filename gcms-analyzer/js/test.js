// Function to programmatically load the sample data
function loadSampleData() {
    // Create a new File object from the sample data
    fetch('/gcms-analyzer/data/sample-data.csv')
        .then(response => response.text())
        .then(content => {
            const file = new File([content], 'sample-data.csv', { type: 'text/csv' });
            
            // Create a DataTransfer object to simulate file drop
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            
            // Get the file input element
            const fileInput = document.getElementById('fileInput');
            
            // Set the files
            fileInput.files = dataTransfer.files;
            
            // Trigger the change event
            const event = new Event('change', { bubbles: true });
            fileInput.dispatchEvent(event);
        })
        .catch(error => {
            console.error('Error loading sample data:', error);
            const uploadStatus = document.getElementById('uploadStatus');
            uploadStatus.innerHTML = `
                <div class="border rounded-lg p-4 bg-red-100 text-red-700 border-red-500">
                    Error loading sample data: ${error.message}
                </div>
            `;
        });
}
