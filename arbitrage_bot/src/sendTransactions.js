const { Connection, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL, sendAndConfirmTransaction, PublicKey } = require('@solana/web3.js');
require('dotenv').config();

const connection = new Connection(process.env.RPC_URL, 'confirmed');
const privateKey = new Uint8Array(JSON.parse(process.env.PRIVATE_KEY));
const wallet = Keypair.fromSecretKey(privateKey);

async function sendSol(toPublicKey, amountInSol) {
    const toPubkey = new PublicKey(toPublicKey);
    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: toPubkey,
            lamports: amountInSol * LAMPORTS_PER_SOL,
        })
    );

    try {
        const signature = await sendAndConfirmTransaction(connection, transaction, [wallet]);
        console.log('Transaction successful with signature:', signature);
    } catch (error) {
        console.error('Error sending transaction:', error);
    }
}

module.exports = { sendSol };