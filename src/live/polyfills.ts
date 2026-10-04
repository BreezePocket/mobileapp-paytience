// Globals @solana/web3.js expects. Imported first from the root layout.
import { Buffer } from 'buffer';
import * as ExpoCrypto from 'expo-crypto';

const g = globalThis as unknown as { Buffer?: typeof Buffer; crypto?: { getRandomValues?: unknown } };
if (!g.Buffer) g.Buffer = Buffer;
if (!g.crypto) g.crypto = {};
if (typeof g.crypto.getRandomValues !== 'function') g.crypto.getRandomValues = ExpoCrypto.getRandomValues;
