const { fetchPools } = require('./fetchData');
// const { sendSol } = require('./sendTransaction');

(async () => {
    // Fetch Raydium pools
    await fetchPools();

    // Send 0.1 SOL to a recipient
    // await sendSol('RecipientPublicKeyHere', 0.1);
})();