# GCMS Data Analyzer

A web-based application for analyzing Gas Chromatography-Mass Spectrometry (GCMS) data with metabolite mapping and PubChem integration.

## Features

- Upload and parse GCMS data files (CSV format)
- Interactive chromatogram visualization
- Mass spectra analysis
- Metabolite to gene locus ID mapping
- PubChem compound information retrieval
- Metabolic pathway visualization
- Interactive network diagram
- Data export functionality

## Getting Started

1. Open `index.html` in a web browser
2. Upload a GCMS data file (CSV format)
3. View the chromatogram and mass spectra visualizations
4. Explore metabolite information, gene mappings, and pathway visualizations

## File Structure

```
gcms-analyzer/
├── index.html              # Main application page
├── css/
│   └── style.css          # Custom styles
├── js/
│   ├── main.js            # Main application logic
│   ├── fileHandler.js     # File upload and parsing
│   ├── chromatogramAnalyzer.js  # GCMS data analysis
│   ├── metaboliteMapper.js      # Gene locus mapping
│   ├── pubchemIntegration.js    # PubChem API integration
│   └── networkVisualizer.js     # Pathway visualization
├── data/
│   └── sample-data.csv    # Sample GCMS data
└── README.md              # Documentation
```

## Data Format

The application expects CSV files with the following columns:
- Metabolite: Name of the metabolite
- RetentionTime: Retention time in minutes
- Intensity: Signal intensity
- AdditionalInfo (optional): Additional information about the metabolite

## Features in Detail

### 1. Data Upload and Parsing
- Supports CSV file format
- Validates data structure and content
- Provides immediate feedback on file processing

### 2. Chromatogram Visualization
- Interactive chart showing retention time vs. intensity
- Zoom and pan capabilities
- Peak detection and highlighting

### 3. Mass Spectra Analysis
- Display of mass spectra data
- Interactive visualization
- Peak identification

### 4. Metabolite Mapping
- Maps metabolites to gene locus IDs
- Provides pathway information
- Supports fuzzy matching for metabolite names

### 5. PubChem Integration
- Retrieves compound information from PubChem
- Displays chemical structures
- Links to detailed PubChem entries

### 6. Pathway Visualization
- Interactive network diagram
- Displays metabolic pathways
- Shows relationships between metabolites and genes

## Dependencies

- Tailwind CSS (via CDN)
- Chart.js (via CDN)
- Cytoscape.js (via CDN)
- PapaParse (via CDN)

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Future Enhancements

1. Advanced Peak Detection
   - Improved algorithms for peak identification
   - Machine learning-based peak classification
   - Automated peak annotation

2. Extended Database Integration
   - Integration with additional metabolomics databases
   - Support for more compound databases
   - Enhanced pathway mapping

3. Advanced Analysis Features
   - Statistical analysis tools
   - Batch processing capabilities
   - Custom report generation
   - Data normalization options

4. Collaboration Features
   - User accounts and data saving
   - Sharing capabilities
   - Collaborative analysis tools

5. Export and Integration
   - Additional export formats
   - API integration capabilities
   - Integration with other analysis tools

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- PubChem for compound data
- Metabolic pathway databases
- Open-source community for the amazing tools and libraries

## Support

For support, please open an issue in the repository or contact the maintainers.
