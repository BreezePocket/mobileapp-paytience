/** Service endpoints. Everything points at Solana devnet, where the program is deployed. */
export const API_URL: string = (process.env.EXPO_PUBLIC_API_URL || 'https://api.paytience.app').replace(/\/+$/, '');
export const RPC_URL: string = process.env.EXPO_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com';
export const CLUSTER = 'devnet';
export const explorerTx = (sig: string) => `https://explorer.solana.com/tx/${sig}?cluster=${CLUSTER}`;
export const explorerAddr = (addr: string) => `https://explorer.solana.com/address/${addr}?cluster=${CLUSTER}`;
