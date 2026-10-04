/**
 * The practice wallet: a Solana keypair made on this device and kept in the device's
 * secure storage (Keychain / Keystore). PAYtience never sees the key. Devnet only.
 */
import { Keypair } from '@solana/web3.js';
import { Buffer } from 'buffer';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'paytience.wallet.v1';

async function read(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return globalThis.localStorage?.getItem(KEY) ?? null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(KEY);
}
async function write(v: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (v == null) globalThis.localStorage?.removeItem(KEY);
      else globalThis.localStorage?.setItem(KEY, v);
    } catch {
      /* storage unavailable */
    }
    return;
  }
  if (v == null) await SecureStore.deleteItemAsync(KEY);
  else await SecureStore.setItemAsync(KEY, v);
}

export async function loadWallet(): Promise<Keypair | null> {
  const raw = await read().catch(() => null);
  if (!raw) return null;
  try {
    return Keypair.fromSecretKey(Uint8Array.from(Buffer.from(raw, 'base64')));
  } catch {
    return null;
  }
}

export async function createWallet(): Promise<Keypair> {
  const kp = Keypair.generate();
  await write(Buffer.from(kp.secretKey).toString('base64'));
  return kp;
}

export async function deleteWallet(): Promise<void> {
  await write(null);
}
