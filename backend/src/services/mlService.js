const axios = require('axios');
const logger = require('../utils/logger');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// calls the FastAPI ML service to get wellness predictions
// took a while to get the feature format right between Node and Python
const predictWellness = async (features) => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/predict`, features, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  } catch (error) {
    logger.error('ML service prediction failed', {
      error: error.message,
      url: ML_SERVICE_URL,
    });
    // fallback to basic calculation if ML service is down
    return {
      score: null,
      risk_flag: 'unknown',
      confidence: 0,
      error: 'ML service unavailable',
    };
  }
};

// check if ML service is healthy
const healthCheck = async () => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 5000 });
    return response.data;
  } catch (error) {
    return { status: 'error', model_loaded: false, error: error.message };
  }
};

// get model info
const getModelInfo = async () => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/model-info`, { timeout: 5000 });
    return response.data;
  } catch (error) {
    logger.warn('Failed to get ML model info', { error: error.message });
    return null;
  }
};

module.exports = { predictWellness, healthCheck, getModelInfo };
