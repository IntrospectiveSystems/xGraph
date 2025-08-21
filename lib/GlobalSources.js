const fs = require('fs');
const path = require('path');
const os = require('os');

class GlobalSources {
    constructor() {
        this.configDir = path.join(os.homedir(), '.xgraph');
        this.configPath = path.join(this.configDir, 'sources.json');
    }

    _ensureConfigExists() {
        // Ensure the .xgraph directory exists
        if (!fs.existsSync(this.configDir)) {
            fs.mkdirSync(this.configDir, { recursive: true });
        }
        
        // Ensure the sources.json file exists
        if (!fs.existsSync(this.configPath)) {
            const defaultConfig = {
                sources: {}
            };
            fs.writeFileSync(this.configPath, JSON.stringify(defaultConfig, null, 2));
        }
    }

    _readConfig() {
        this._ensureConfigExists();
        try {
            const content = fs.readFileSync(this.configPath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            return { sources: {} };
        }
    }

    _writeConfig(config) {
        fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    }

    addSource(name, sourcePath) {
        if (!name || !sourcePath) {
            throw new Error('Both name and source path are required');
        }

        const absolutePath = path.resolve(sourcePath);
        
        if (!fs.existsSync(absolutePath)) {
            throw new Error(`Source directory does not exist: ${absolutePath}`);
        }

        const config = this._readConfig();
        config.sources[name] = absolutePath;
        this._writeConfig(config);
        
        return absolutePath;
    }

    removeSource(name) {
        if (!name) {
            throw new Error('Source name is required');
        }

        const config = this._readConfig();
        
        if (!(name in config.sources)) {
            throw new Error(`Source '${name}' does not exist`);
        }

        delete config.sources[name];
        this._writeConfig(config);
    }

    listSources() {
        const config = this._readConfig();
        return config.sources;
    }

    getGlobalSources() {
        return this.listSources();
    }

    sourceExists(name) {
        const config = this._readConfig();
        return name in config.sources;
    }
}

module.exports = GlobalSources;