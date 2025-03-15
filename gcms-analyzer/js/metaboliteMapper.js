// Metabolite to gene locus mapping module
class MetaboliteMapper {
    // Cache for mapping results
    static #mappingCache = new Map();

    /**
     * Map metabolite to gene locus ID
     * @param {string} metaboliteName - Name of the metabolite
     * @returns {Promise<string>} - Gene locus ID
     */
    static async mapToGeneLocusID(metaboliteName) {
        try {
            // Check cache first
            if (this.#mappingCache.has(metaboliteName)) {
                return this.#mappingCache.get(metaboliteName);
            }

            // Simulate API call to metabolite database
            // In a real application, this would be an actual API call
            const geneLocusId = await this.#simulateMapping(metaboliteName);
            
            // Cache the result
            this.#mappingCache.set(metaboliteName, geneLocusId);
            
            return geneLocusId;
        } catch (error) {
            console.error('Error mapping metabolite:', error);
            return 'Not found';
        }
    }

    /**
     * Get pathway information for a metabolite
     * @param {string} metaboliteName - Name of the metabolite
     * @returns {Promise<Object>} - Pathway information
     */
    static async getPathwayInformation(metaboliteName) {
        try {
            // Simulate API call to pathway database
            const pathwayInfo = await this.#simulatePathwayLookup(metaboliteName);
            return pathwayInfo;
        } catch (error) {
            console.error('Error getting pathway information:', error);
            return null;
        }
    }

    /**
     * Simulate metabolite to gene locus mapping
     * @param {string} metaboliteName - Name of the metabolite
     * @returns {Promise<string>} - Gene locus ID
     */
    static async #simulateMapping(metaboliteName) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Example mapping logic based on common metabolic pathways
        const mappings = {
            'Glucose': 'GLK1',
            'Fructose': 'PFK1',
            'Pyruvate': 'PDC1',
            'Citrate': 'CIT1',
            'Malate': 'MDH1',
            'Lactate': 'LDH1',
            'Succinate': 'SDH1',
            'Fumarate': 'FUM1',
            'Alpha-Ketoglutarate': 'KGD1',
            'Oxaloacetate': 'OAA1',
            'Alanine': 'ALT1',
            'Glutamate': 'GDH1',
            'Aspartate': 'ASP1',
            'Glycine': 'GLY1',
            'Serine': 'SER1'
        };

        return mappings[metaboliteName] || 'Not found';
    }

    /**
     * Simulate pathway lookup
     * @param {string} metaboliteName - Name of the metabolite
     * @returns {Promise<Object>} - Pathway information
     */
    static async #simulatePathwayLookup(metaboliteName) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Example pathway information based on common metabolic pathways
        const pathways = {
            'Glucose': {
                metabolite: 'Glucose',
                pathway: 'Glycolysis',
                reactions: ['Glucose → Glucose-6P', 'Glucose-6P → Fructose-6P']
            },
            'Fructose': {
                metabolite: 'Fructose',
                pathway: 'Glycolysis',
                reactions: ['Fructose → Fructose-6P', 'Fructose-6P → Fructose-1,6BP']
            },
            'Pyruvate': {
                metabolite: 'Pyruvate',
                pathway: 'TCA Cycle',
                reactions: ['Pyruvate → Acetyl-CoA', 'Acetyl-CoA + Oxaloacetate → Citrate']
            },
            'Citrate': {
                metabolite: 'Citrate',
                pathway: 'TCA Cycle',
                reactions: ['Citrate → Isocitrate', 'Isocitrate → α-Ketoglutarate']
            },
            'Malate': {
                metabolite: 'Malate',
                pathway: 'TCA Cycle',
                reactions: ['Malate → Oxaloacetate', 'Oxaloacetate + Acetyl-CoA → Citrate']
            },
            'Lactate': {
                metabolite: 'Lactate',
                pathway: 'Fermentation',
                reactions: ['Pyruvate → Lactate']
            },
            'Succinate': {
                metabolite: 'Succinate',
                pathway: 'TCA Cycle',
                reactions: ['Succinate → Fumarate', 'Fumarate → Malate']
            },
            'Fumarate': {
                metabolite: 'Fumarate',
                pathway: 'TCA Cycle',
                reactions: ['Fumarate → Malate', 'Malate → Oxaloacetate']
            },
            'Alpha-Ketoglutarate': {
                metabolite: 'Alpha-Ketoglutarate',
                pathway: 'TCA Cycle',
                reactions: ['α-Ketoglutarate → Succinyl-CoA', 'Succinyl-CoA → Succinate']
            },
            'Oxaloacetate': {
                metabolite: 'Oxaloacetate',
                pathway: 'TCA Cycle',
                reactions: ['Oxaloacetate + Acetyl-CoA → Citrate']
            },
            'Alanine': {
                metabolite: 'Alanine',
                pathway: 'Amino Acid Metabolism',
                reactions: ['Pyruvate + Glutamate ↔ Alanine + α-Ketoglutarate']
            },
            'Glutamate': {
                metabolite: 'Glutamate',
                pathway: 'Amino Acid Metabolism',
                reactions: ['α-Ketoglutarate + NH4+ ↔ Glutamate']
            },
            'Aspartate': {
                metabolite: 'Aspartate',
                pathway: 'Amino Acid Metabolism',
                reactions: ['Oxaloacetate + Glutamate ↔ Aspartate + α-Ketoglutarate']
            },
            'Glycine': {
                metabolite: 'Glycine',
                pathway: 'Amino Acid Metabolism',
                reactions: ['Serine → Glycine + CH2=THF']
            },
            'Serine': {
                metabolite: 'Serine',
                pathway: 'Amino Acid Metabolism',
                reactions: ['3-Phosphoglycerate → 3-Phosphoserine → Serine']
            }
        };

        return pathways[metaboliteName] || null;
    }

    /**
     * Clear the mapping cache
     */
    static clearCache() {
        this.#mappingCache.clear();
    }
}

// Export the MetaboliteMapper class
window.MetaboliteMapper = MetaboliteMapper;
