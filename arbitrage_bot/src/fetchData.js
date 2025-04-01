const axios = require('axios');

async function fetchPools() {
    const url = 'https://api-v3.raydium.io/main/version';
    try {
        const response = await axios.get(url);
        console.log('Pools:', response.data);
    } catch (error) {
        console.error('Error fetching pools:', error);
    }
}

module.exports = { fetchPools };