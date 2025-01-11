class Configuration {
    constructor({ apiKey, basePath = "https://api.openai.com/v1", baseOptions = {} }) {
        this.apiKey = apiKey;
        this.basePath = basePath;
        this.baseOptions = baseOptions;
    }
}

module.exports = Configuration;
