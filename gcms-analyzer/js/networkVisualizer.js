// Network visualization module for metabolic pathways
class NetworkVisualizer {
    static cy = null;
    static layout = null;
    static initialized = false;

    /**
     * Initialize the network visualization
     * @param {string} containerId - ID of the container element
     * @returns {Object|null} - Cytoscape instance or null if initialization fails
     */
    static initialize(containerId) {
        try {
            const container = document.getElementById(containerId);
            if (!container) {
                console.error(`Container element with ID '${containerId}' not found`);
                return null;
            }

            // Check if Cytoscape is available
            if (typeof cytoscape === 'undefined') {
                console.error('Cytoscape.js library not loaded');
                this.showError(container, 'Network visualization library not loaded');
                return null;
            }

            this.cy = cytoscape({
                container: container,
                style: this.getDefaultStyle(),
                layout: {
                    name: 'cose',
                    idealEdgeLength: 100,
                    nodeOverlap: 20,
                    refresh: 20,
                    fit: true,
                    padding: 30,
                    randomize: false,
                    componentSpacing: 100,
                    nodeRepulsion: 400000,
                    edgeElasticity: 100,
                    nestingFactor: 5,
                    gravity: 80,
                    numIter: 1000,
                    initialTemp: 200,
                    coolingFactor: 0.95,
                    minTemp: 1.0
                },
                elements: []
            });

            this.initializeEventHandlers();
            this.initialized = true;
            
            // Add zoom controls
            this.addZoomControls(container);
            
            return this.cy;
        } catch (error) {
            console.error('Error initializing network visualization:', error);
            const container = document.getElementById(containerId);
            if (container) {
                this.showError(container, 'Failed to initialize network visualization');
            }
            return null;
        }
    }

    /**
     * Show error message in the container
     * @param {HTMLElement} container - Container element
     * @param {string} message - Error message
     */
    static showError(container, message) {
        container.innerHTML = `
            <div class="flex items-center justify-center h-full">
                <div class="text-red-500 text-center">
                    <i class="fas fa-exclamation-circle text-2xl mb-2"></i>
                    <p>${message}</p>
                </div>
            </div>
        `;
    }

    /**
     * Add zoom controls to the container
     * @param {HTMLElement} container - Container element
     */
    static addZoomControls(container) {
        const controls = document.createElement('div');
        controls.className = 'absolute top-2 right-2 flex flex-col gap-2';
        controls.innerHTML = `
            <button class="bg-white p-2 rounded shadow hover:bg-gray-100" onclick="NetworkVisualizer.zoomIn()">
                <i class="fas fa-plus"></i>
            </button>
            <button class="bg-white p-2 rounded shadow hover:bg-gray-100" onclick="NetworkVisualizer.zoomOut()">
                <i class="fas fa-minus"></i>
            </button>
            <button class="bg-white p-2 rounded shadow hover:bg-gray-100" onclick="NetworkVisualizer.fit()">
                <i class="fas fa-expand"></i>
            </button>
        `;
        container.style.position = 'relative';
        container.appendChild(controls);
    }

    /**
     * Get default style for the network
     * @returns {Array} - Array of style rules
     */
    static getDefaultStyle() {
        return [
            {
                selector: 'node',
                style: {
                    'background-color': '#3B82F6',
                    'label': 'data(label)',
                    'color': '#1F2937',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'font-size': '12px',
                    'width': '40px',
                    'height': '40px',
                    'text-wrap': 'wrap',
                    'text-max-width': '80px'
                }
            },
            {
                selector: 'node[type="metabolite"]',
                style: {
                    'background-color': '#10B981',
                    'shape': 'ellipse'
                }
            },
            {
                selector: 'node[type="gene"]',
                style: {
                    'background-color': '#F59E0B',
                    'shape': 'rectangle'
                }
            },
            {
                selector: 'node[type="pathway"]',
                style: {
                    'background-color': '#6366F1',
                    'shape': 'diamond'
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': 2,
                    'line-color': '#94A3B8',
                    'target-arrow-color': '#94A3B8',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier',
                    'label': 'data(label)',
                    'font-size': '10px',
                    'text-rotation': 'autorotate',
                    'text-margin-y': -10
                }
            },
            {
                selector: '.highlighted',
                style: {
                    'background-color': '#EF4444',
                    'line-color': '#EF4444',
                    'target-arrow-color': '#EF4444',
                    'transition-property': 'background-color, line-color, target-arrow-color',
                    'transition-duration': '0.5s'
                }
            },
            {
                selector: '.faded',
                style: {
                    'opacity': 0.3
                }
            }
        ];
    }

    /**
     * Initialize event handlers for the network
     */
    static initializeEventHandlers() {
        if (!this.cy) return;

        // Node hover events
        this.cy.on('mouseover', 'node', (event) => {
            const node = event.target;
            const neighborhood = node.neighborhood().add(node);
            
            this.cy.elements().addClass('faded');
            neighborhood.removeClass('faded');
        });

        this.cy.on('mouseout', 'node', () => {
            this.cy.elements().removeClass('faded');
        });

        // Node click events
        this.cy.on('click', 'node', (event) => {
            const node = event.target;
            this.highlightPathways(node);
        });
    }

    /**
     * Add a metabolite and its associated gene to the network
     * @param {string} metaboliteName - Name of the metabolite
     * @param {string} geneLocusId - Associated gene locus ID
     */
    static async addMetaboliteToPathway(metaboliteName, geneLocusId) {
        if (!this.initialized || !this.cy) {
            console.error('Network visualizer not initialized');
            return;
        }

        try {
            // Add metabolite node
            const metaboliteNode = {
                group: 'nodes',
                data: {
                    id: `m_${metaboliteName}`,
                    label: metaboliteName,
                    type: 'metabolite'
                }
            };

            // Add gene node
            const geneNode = {
                group: 'nodes',
                data: {
                    id: `g_${geneLocusId}`,
                    label: geneLocusId,
                    type: 'gene'
                }
            };

            // Add edge between metabolite and gene
            const edge = {
                group: 'edges',
                data: {
                    id: `e_${metaboliteName}_${geneLocusId}`,
                    source: `m_${metaboliteName}`,
                    target: `g_${geneLocusId}`,
                    label: 'associated with'
                }
            };

            // Add elements to the network
            this.cy.add([metaboliteNode, geneNode, edge]);

            // Get pathway information
            const pathwayInfo = await MetaboliteMapper.getPathwayInformation(metaboliteName);
            if (pathwayInfo) {
                this.addPathwayConnections(pathwayInfo);
            }

            // Run layout
            this.runLayout();
        } catch (error) {
            console.error('Error adding metabolite to pathway:', error);
        }
    }

    /**
     * Add pathway connections to the network
     * @param {Object} pathwayInfo - Pathway information
     */
    static addPathwayConnections(pathwayInfo) {
        if (!this.cy) return;

        try {
            const { metabolite, pathway, reactions } = pathwayInfo;

            if (pathway) {
                // Add pathway node if it doesn't exist
                if (!this.cy.$id(`p_${pathway}`).length) {
                    const pathwayNode = {
                        group: 'nodes',
                        data: {
                            id: `p_${pathway}`,
                            label: pathway,
                            type: 'pathway'
                        }
                    };
                    this.cy.add(pathwayNode);
                }

                // Add edge from metabolite to pathway
                this.cy.add({
                    group: 'edges',
                    data: {
                        id: `e_${metabolite}_${pathway}`,
                        source: `m_${metabolite}`,
                        target: `p_${pathway}`,
                        label: 'part of'
                    }
                });
            }

            if (reactions) {
                reactions.forEach((reaction, index) => {
                    const reactionId = `r_${metabolite}_${index}`;
                    
                    // Add reaction node
                    this.cy.add({
                        group: 'nodes',
                        data: {
                            id: reactionId,
                            label: reaction,
                            type: 'reaction'
                        }
                    });

                    // Add edge from metabolite to reaction
                    this.cy.add({
                        group: 'edges',
                        data: {
                            id: `e_${metabolite}_reaction_${index}`,
                            source: `m_${metabolite}`,
                            target: reactionId,
                            label: 'participates in'
                        }
                    });
                });
            }
        } catch (error) {
            console.error('Error adding pathway connections:', error);
        }
    }

    // Zoom controls
    static zoomIn() {
        if (this.cy) {
            this.cy.zoom({
                level: this.cy.zoom() * 1.2,
                renderedPosition: { x: this.cy.width() / 2, y: this.cy.height() / 2 }
            });
        }
    }

    static zoomOut() {
        if (this.cy) {
            this.cy.zoom({
                level: this.cy.zoom() * 0.8,
                renderedPosition: { x: this.cy.width() / 2, y: this.cy.height() / 2 }
            });
        }
    }

    static fit() {
        if (this.cy) {
            this.cy.fit();
        }
    }

    /**
     * Run the layout algorithm
     */
    static runLayout() {
        if (!this.cy) return;

        try {
            if (this.layout) {
                this.layout.stop();
            }

            this.layout = this.cy.layout({
                name: 'cose',
                animate: true,
                animationDuration: 500,
                refresh: 20,
                fit: true,
                padding: 30
            });

            this.layout.run();
        } catch (error) {
            console.error('Error running layout:', error);
        }
    }

    /**
     * Clear the network
     */
    static clear() {
        if (this.cy) {
            this.cy.elements().remove();
        }
    }

    /**
     * Check if the visualizer is initialized
     * @returns {boolean} - True if initialized
     */
    static isInitialized() {
        return this.initialized && this.cy !== null;
    }
}

// Export the NetworkVisualizer class
window.NetworkVisualizer = NetworkVisualizer;
