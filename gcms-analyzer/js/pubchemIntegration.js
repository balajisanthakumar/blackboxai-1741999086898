// PubChem API integration module
class PubChemIntegration {
    // Base URL for PubChem REST API
    static BASE_URL = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';
    
    // Cache for API responses
    static #cache = new Map();
    
    // Rate limiting
    static #requestQueue = [];
    static #isProcessingQueue = false;
    static #requestDelay = 300; // 300ms between requests

    /**
     * Process the request queue with rate limiting
     */
    static async #processQueue() {
        if (this.#isProcessingQueue) return;
        this.#isProcessingQueue = true;

        while (this.#requestQueue.length > 0) {
            const { url, resolve, reject } = this.#requestQueue.shift();
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                resolve(response);
            } catch (error) {
                reject(error);
            }
            await new Promise(resolve => setTimeout(resolve, this.#requestDelay));
        }

        this.#isProcessingQueue = false;
    }

    /**
     * Add request to queue
     * @param {string} url - API endpoint URL
     * @returns {Promise} - Promise that resolves with the response
     */
    static #queueRequest(url) {
        return new Promise((resolve, reject) => {
            this.#requestQueue.push({ url, resolve, reject });
            this.#processQueue();
        });
    }

    /**
     * Fetch compound information from PubChem
     * @param {string} compoundName - Name of the compound
     * @returns {Promise<Object>} - Compound information
     */
    static async fetchCompoundInfo(compoundName) {
        try {
            // Check cache first
            if (this.#cache.has(compoundName)) {
                return this.#cache.get(compoundName);
            }

            // Search for compound
            const cid = await this.searchCompound(compoundName);
            if (!cid) {
                const result = { id: 'Not found', name: compoundName };
                this.#cache.set(compoundName, result);
                return result;
            }

            // Basic compound info
            const result = {
                id: cid,
                name: compoundName,
                url: `https://pubchem.ncbi.nlm.nih.gov/compound/${cid}`
            };

            // Cache the basic result immediately
            this.#cache.set(compoundName, result);

            // Fetch additional data in the background
            this.fetchAdditionalData(cid, compoundName).catch(console.error);

            return result;

        } catch (error) {
            console.error('Error fetching PubChem data:', error);
            return {
                id: 'Error',
                name: compoundName,
                error: error.message
            };
        }
    }

    /**
     * Search for a compound in PubChem
     * @param {string} name - Compound name
     * @returns {Promise<string|null>} - PubChem CID
     */
    static async searchCompound(name) {
        try {
            const response = await this.#queueRequest(
                `${this.BASE_URL}/compound/name/${encodeURIComponent(name)}/cids/JSON`
            );
            const data = await response.json();
            return data.IdentifierList?.CID[0]?.toString() || null;
        } catch (error) {
            console.error('Error searching compound:', error);
            return null;
        }
    }

    /**
     * Fetch additional compound data in the background
     * @param {string} cid - PubChem CID
     * @param {string} compoundName - Compound name
     */
    static async fetchAdditionalData(cid, compoundName) {
        try {
            const [properties, smiles] = await Promise.all([
                this.fetchProperties(cid),
                this.fetchSMILES(cid)
            ]);

            // Update cached data with additional information
            const cachedData = this.#cache.get(compoundName);
            if (cachedData) {
                const updatedData = {
                    ...cachedData,
                    properties,
                    smiles
                };
                this.#cache.set(compoundName, updatedData);

                // Dispatch event to notify UI of updated data
                const event = new CustomEvent('pubchem-data-updated', {
                    detail: { compoundName, data: updatedData }
                });
                window.dispatchEvent(event);
            }
        } catch (error) {
            console.error('Error fetching additional data:', error);
        }
    }

    /**
     * Fetch compound properties from PubChem
     * @param {string} cid - PubChem CID
     * @returns {Promise<Object>} - Compound properties
     */
    static async fetchProperties(cid) {
        try {
            const properties = [
                'MolecularFormula',
                'MolecularWeight',
                'IUPACName',
                'ExactMass'
            ];

            const response = await this.#queueRequest(
                `${this.BASE_URL}/compound/cid/${cid}/property/${properties.join(',')}/JSON`
            );

            const data = await response.json();
            return data.PropertyTable.Properties[0] || {};

        } catch (error) {
            console.error('Error fetching properties:', error);
            return {};
        }
    }

    /**
     * Fetch SMILES notation
     * @param {string} cid - PubChem CID
     * @returns {Promise<string|null>} - SMILES string
     */
    static async fetchSMILES(cid) {
        try {
            const response = await this.#queueRequest(
                `${this.BASE_URL}/compound/cid/${cid}/property/IsomericSMILES/JSON`
            );

            const data = await response.json();
            return data.PropertyTable.Properties[0].IsomericSMILES || null;

        } catch (error) {
            console.error('Error fetching SMILES:', error);
            return null;
        }
    }

    /**
     * Batch fetch compound information
     * @param {string[]} compounds - Array of compound names
     * @returns {Promise<Object>} - Object mapping compound names to their information
     */
    static async batchFetchCompoundInfo(compounds) {
        const results = {};
        const batchSize = 5; // Process 5 compounds at a time

        for (let i = 0; i < compounds.length; i += batchSize) {
            const batch = compounds.slice(i, i + batchSize);
            const promises = batch.map(compound => this.fetchCompoundInfo(compound));
            
            const batchResults = await Promise.all(promises);
            
            batch.forEach((compound, index) => {
                results[compound] = batchResults[index];
            });

            // Add delay between batches
            if (i + batchSize < compounds.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        return results;
    }

    /**
     * Clear the cache
     */
    static clearCache() {
        this.#cache.clear();
    }
}

// Export the PubChemIntegration class
window.PubChemIntegration = PubChemIntegration;

// Listen for data updates
window.addEventListener('pubchem-data-updated', (event) => {
    const { compoundName, data } = event.detail;
    // Update UI elements that display compound data
    const elements = document.querySelectorAll(`[data-compound="${compoundName}"]`);
    elements.forEach(element => {
        const property = element.dataset.property;
        if (property && data[property]) {
            element.textContent = data[property];
        }
    });
});
