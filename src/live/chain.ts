/**
 * Client for the breezepocket program on devnet, built on @solana/web3.js alone (no
 * Anchor, which is heavy in React Native). Instruction and account layouts come from the
 * program IDL (core/target/idl/breezepocket.json); the instruction's account order and
 * flags match dashboard-breezepocket/src/lib/program.ts so the desk's byte-for-byte check
 * of the transaction passes.
 */
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import { Buffer } from 'buffer';

import type { Product } from './api';
import { RPC_URL } from './config';

export const PROGRAM_ID = new PublicKey('BeytdpJYSGP1oFRxEiBLkSRGuW6HW3Pk9dqSZCuSteQ9');
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
export const CONFIG_PDA = PublicKey.findProgramAddressSync([Buffer.from('config')], PROGRAM_ID)[0];
export const DISPUTE_WINDOW_SECS = 30 * 60;

const DISC = {
  openPosition: [135, 128, 47, 77, 15, 152, 240, 49],
  openAssetPosition: [120, 227, 20, 71, 252, 225, 87, 70],
  settle: [175, 42, 185, 87, 144, 131, 102, 212],
  settleAssetPosition: [173, 255, 36, 187, 230, 231, 70, 91],
  positionAccount: [60, 125, 250, 193, 181, 109, 238, 86],
  assetPosition: [64, 144, 148, 81, 123, 31, 96, 233],
};

let conn: Connection | null = null;
export function connection(): Connection {
  if (!conn) conn = new Connection(RPC_URL, 'confirmed');
  return conn;
}

// Little-endian 64-bit helpers on plain BigInt arithmetic, so they work on every JS engine.
const u64le = (n: bigint) => {
  const b = Buffer.alloc(8);
  let v = BigInt.asUintN(64, n);
  for (let i = 0; i < 8; i++) {
    b[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return b;
};
const i64le = (n: number | bigint) => u64le(BigInt(n));
const readU64 = (data: Uint8Array, off: number): bigint => {
  let v = 0n;
  for (let i = 7; i >= 0; i--) v = (v << 8n) | BigInt(data[off + i]);
  return v;
};
const readI64 = (data: Uint8Array, off: number): number => Number(BigInt.asIntN(64, readU64(data, off)));

export const ata = (mint: PublicKey, owner: PublicKey) =>
  PublicKey.findProgramAddressSync([owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()], ASSOCIATED_TOKEN_PROGRAM_ID)[0];

const positionPda = (user: PublicKey, mm: PublicKey, fixedPrice: bigint, expiryTs: number, nonce: bigint) =>
  PublicKey.findProgramAddressSync([Buffer.from('position'), user.toBuffer(), mm.toBuffer(), u64le(fixedPrice), i64le(expiryTs), u64le(nonce)], PROGRAM_ID)[0];
const assetPositionPda = (user: PublicKey, mm: PublicKey, mint: PublicKey, fixedPrice: bigint, expiryTs: number, nonce: bigint) =>
  PublicKey.findProgramAddressSync(
    [Buffer.from('asset_position'), user.toBuffer(), mm.toBuffer(), mint.toBuffer(), u64le(fixedPrice), i64le(expiryTs), u64le(nonce)],
    PROGRAM_ID,
  )[0];
const assetPda = (mint: PublicKey) => PublicKey.findProgramAddressSync([Buffer.from('asset'), mint.toBuffer()], PROGRAM_ID)[0];
/** SOL settlement prices are keyed by the priced asset (SOL, seed byte 0) and expiry. */
const settlementPricePda = (expiryTs: number) =>
  PublicKey.findProgramAddressSync([Buffer.from('settlement_price'), Buffer.from([0]), i64le(expiryTs)], PROGRAM_ID)[0];
const assetPricePda = (mint: PublicKey, expiryTs: number) =>
  PublicKey.findProgramAddressSync([Buffer.from('asset_price'), mint.toBuffer(), i64le(expiryTs)], PROGRAM_ID)[0];

export type OpenParams = {
  user: PublicKey;
  /** The winning market maker: fee payer of the transaction, so the user pays no gas. */
  mm: PublicKey;
  usdcMint: PublicKey;
  /** Set for a listed asset; null for SOL. */
  assetMint: PublicKey | null;
  product: Product;
  fixedPrice: bigint;
  expiryTs: number;
  amount: bigint;
  yieldAmount: bigint;
  nonce: bigint;
};

export const openedPositionPda = (p: Pick<OpenParams, 'user' | 'mm' | 'assetMint' | 'fixedPrice' | 'expiryTs' | 'nonce'>) =>
  p.assetMint ? assetPositionPda(p.user, p.mm, p.assetMint, p.fixedPrice, p.expiryTs, p.nonce) : positionPda(p.user, p.mm, p.fixedPrice, p.expiryTs, p.nonce);

const meta = (pubkey: PublicKey, isWritable = false, isSigner = false) => ({ pubkey, isWritable, isSigner });

/** Unsigned open_position (SOL) or open_asset_position transaction with the market maker as fee payer. */
export async function buildOpenPositionTx(p: OpenParams): Promise<Transaction> {
  const position = openedPositionPda(p);
  const data = Buffer.concat([
    Buffer.from(p.assetMint ? DISC.openAssetPosition : DISC.openPosition),
    Buffer.from([p.product === 'sell_sol' ? 0 : 1]),
    u64le(p.fixedPrice),
    i64le(p.expiryTs),
    u64le(p.amount),
    u64le(p.yieldAmount),
    u64le(p.nonce),
  ]);
  const mint = p.assetMint;
  const keys = mint
    ? [
        meta(p.mm, true, true),
        meta(p.user, true, true),
        meta(CONFIG_PDA),
        meta(assetPda(mint)),
        meta(mint),
        meta(p.usdcMint),
        meta(position, true),
        meta(ata(mint, position), true),
        meta(ata(p.usdcMint, position), true),
        meta(ata(mint, p.user), true),
        meta(ata(p.usdcMint, p.user), true),
        meta(ata(mint, p.mm), true),
        meta(ata(p.usdcMint, p.mm), true),
        meta(TOKEN_PROGRAM_ID),
        meta(ASSOCIATED_TOKEN_PROGRAM_ID),
        meta(SystemProgram.programId),
      ]
    : [
        meta(p.mm, true, true),
        meta(p.user, true, true),
        meta(CONFIG_PDA),
        meta(position, true),
        meta(p.usdcMint),
        meta(ata(p.usdcMint, position), true),
        meta(ata(p.usdcMint, p.user), true),
        meta(ata(p.usdcMint, p.mm), true),
        meta(TOKEN_PROGRAM_ID),
        meta(ASSOCIATED_TOKEN_PROGRAM_ID),
        meta(SystemProgram.programId),
      ];
  const tx = new Transaction();
  tx.feePayer = p.mm;
  tx.recentBlockhash = (await connection().getLatestBlockhash('confirmed')).blockhash;
  tx.add(new TransactionInstruction({ programId: PROGRAM_ID, keys, data }));
  return tx;
}

export type PositionRow = {
  address: string;
  user: string;
  marketMaker: string;
  /** null for SOL; the listed SPL mint otherwise. */
  assetMint: string | null;
  product: Product;
  /** USD × 1e6 per whole token. */
  fixedPrice: bigint;
  expiryTs: number;
  userCollateral: bigint;
  mmCollateral: bigint;
  yieldAmount: bigint;
  nonce: bigint;
  settled: boolean;
};
export type SettlementPriceRow = { price: bigint; postedTs: number; source: 'poster' | 'governance' };

const hasDisc = (data: Buffer, disc: number[]) => disc.every((b, i) => data[i] === b);
const pk = (data: Buffer, off: number) => new PublicKey(data.subarray(off, off + 32)).toBase58();

function decodePosition(address: PublicKey, data: Buffer): PositionRow | null {
  // PositionAccount: user, market_maker, product u8, token u8, then the shared tail.
  // AssetPosition:   user, market_maker, asset_mint, product u8, then the shared tail.
  let off: number;
  let assetMint: string | null = null;
  let productByte: number;
  if (hasDisc(data, DISC.positionAccount)) {
    productByte = data[72];
    off = 74;
  } else if (hasDisc(data, DISC.assetPosition)) {
    assetMint = pk(data, 72);
    productByte = data[104];
    off = 105;
  } else return null;
  return {
    address: address.toBase58(),
    user: pk(data, 8),
    marketMaker: pk(data, 40),
    assetMint,
    product: productByte === 0 ? 'sell_sol' : 'buy_sol',
    fixedPrice: readU64(data, off),
    expiryTs: readI64(data, off + 8),
    userCollateral: readU64(data, off + 16),
    mmCollateral: readU64(data, off + 24),
    yieldAmount: readU64(data, off + 32),
    nonce: readU64(data, off + 40),
    settled: data[off + 48] === 1,
  };
}

/** SOL and listed-asset positions for a user, soonest expiry first. */
export async function fetchPositions(owner: string): Promise<PositionRow[]> {
  const accounts = await connection().getProgramAccounts(PROGRAM_ID, { filters: [{ memcmp: { offset: 8, bytes: owner } }] });
  return accounts
    .map((a) => decodePosition(a.pubkey, Buffer.from(a.account.data)))
    .filter((r): r is PositionRow => r !== null)
    .sort((x, y) => x.expiryTs - y.expiryTs);
}

export async function fetchPosition(address: string): Promise<PositionRow | null> {
  const key = new PublicKey(address);
  const info = await connection().getAccountInfo(key, 'confirmed');
  return info ? decodePosition(key, Buffer.from(info.data)) : null;
}

/** Settlement prices are per asset and expiry. */
export const priceKey = (p: Pick<PositionRow, 'assetMint' | 'expiryTs'>) => `${p.assetMint ?? 'SOL'}:${p.expiryTs}`;

/** The posted prices for a set of positions, keyed by `priceKey`; null when none is posted yet. */
export async function fetchSettlementPrices(rows: PositionRow[]): Promise<Record<string, SettlementPriceRow | null>> {
  const unique = new Map(rows.map((r) => [priceKey(r), r]));
  const keys = [...unique.keys()];
  if (keys.length === 0) return {};
  const pdas = keys.map((k) => {
    const r = unique.get(k)!;
    return r.assetMint ? assetPricePda(new PublicKey(r.assetMint), r.expiryTs) : settlementPricePda(r.expiryTs);
  });
  const out: Record<string, SettlementPriceRow | null> = {};
  for (let i = 0; i < pdas.length; i += 100) {
    const infos = await connection().getMultipleAccountsInfo(pdas.slice(i, i + 100), 'confirmed');
    infos.forEach((info, j) => {
      const k = keys[i + j];
      if (!info) {
        out[k] = null;
        return;
      }
      const data = Buffer.from(info.data);
      // SettlementPrice: token u8, expiry i64, price u64, posted i64, source u8.
      // AssetSettlementPrice: asset_mint, expiry i64, price u64, posted i64, source u8.
      const off = unique.get(k)!.assetMint ? 8 + 32 + 8 : 8 + 1 + 8;
      out[k] = {
        price: readU64(data, off),
        postedTs: readI64(data, off + 8),
        source: data[off + 16] === 0 ? 'poster' : 'governance',
      };
    });
  }
  return out;
}

export type ChainBalances = { sol: number; byMint: Record<string, number> };

/** SOL plus every SPL token the wallet holds, in whole units. */
export async function fetchBalances(owner: string): Promise<ChainBalances> {
  const key = new PublicKey(owner);
  const [lamports, tokens] = await Promise.all([
    connection().getBalance(key, 'confirmed'),
    connection().getParsedTokenAccountsByOwner(key, { programId: TOKEN_PROGRAM_ID }, 'confirmed'),
  ]);
  const byMint: Record<string, number> = {};
  for (const t of tokens.value) {
    const info = (t.account.data as { parsed?: { info?: { mint?: string; tokenAmount?: { uiAmount?: number | null } } } }).parsed?.info;
    if (info?.mint) byMint[info.mint] = (byMint[info.mint] ?? 0) + Number(info.tokenAmount?.uiAmount ?? 0);
  }
  return { sol: lamports / 1e9, byMint };
}

/** Wait until a signature is confirmed; throws with the on-chain error if it failed. */
export async function confirmSignature(signature: string, timeoutMs = 60_000): Promise<void> {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    const st = (await connection().getSignatureStatuses([signature])).value[0];
    if (st?.err) throw new Error(`Transaction failed on chain: ${JSON.stringify(st.err)}`);
    if (st && (st.confirmationStatus === 'confirmed' || st.confirmationStatus === 'finalized')) return;
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error('timeout');
}

export function signPartial(tx: Transaction, signer: Keypair): string {
  tx.partialSign(signer);
  return Buffer.from(tx.serialize({ requireAllSignatures: false, verifySignatures: false })).toString('base64');
}

export async function broadcast(txBase64: string): Promise<string> {
  return connection().sendRawTransaction(Buffer.from(txBase64, 'base64'), { skipPreflight: false, preflightCommitment: 'confirmed' });
}

/** Permissionless settle, paid for by `caller`: the fallback when a deal is ready but not yet paid out. */
export async function settlePosition(caller: Keypair, usdcMint: string, pos: PositionRow): Promise<string> {
  const usdc = new PublicKey(usdcMint);
  const position = new PublicKey(pos.address);
  const user = new PublicKey(pos.user);
  const mm = new PublicKey(pos.marketMaker);
  const tail = [meta(TOKEN_PROGRAM_ID), meta(ASSOCIATED_TOKEN_PROGRAM_ID), meta(SystemProgram.programId)];
  let keys;
  let disc;
  if (pos.assetMint) {
    const mint = new PublicKey(pos.assetMint);
    disc = DISC.settleAssetPosition;
    keys = [
      meta(caller.publicKey, true, true),
      meta(CONFIG_PDA),
      meta(position, true),
      meta(assetPricePda(mint, pos.expiryTs)),
      meta(user),
      meta(mm, true),
      meta(mint),
      meta(usdc),
      meta(ata(mint, position), true),
      meta(ata(usdc, position), true),
      meta(ata(mint, user), true),
      meta(ata(usdc, user), true),
      meta(ata(mint, mm), true),
      meta(ata(usdc, mm), true),
      ...tail,
    ];
  } else {
    disc = DISC.settle;
    keys = [
      meta(caller.publicKey, true, true),
      meta(CONFIG_PDA),
      meta(position, true),
      meta(settlementPricePda(pos.expiryTs)),
      meta(user, true),
      meta(mm, true),
      meta(usdc),
      meta(ata(usdc, position), true),
      meta(ata(usdc, user), true),
      meta(ata(usdc, mm), true),
      ...tail,
    ];
  }
  const tx = new Transaction();
  tx.feePayer = caller.publicKey;
  tx.recentBlockhash = (await connection().getLatestBlockhash('confirmed')).blockhash;
  tx.add(new TransactionInstruction({ programId: PROGRAM_ID, keys, data: Buffer.from(disc) }));
  tx.sign(caller);
  const sig = await connection().sendRawTransaction(tx.serialize(), { skipPreflight: false, preflightCommitment: 'confirmed' });
  await confirmSignature(sig);
  return sig;
}

/** Random u64 nonce, part of the position address so an offer can only be used once. */
export function randomNonce(): bigint {
  const b = new Uint8Array(8);
  (globalThis.crypto as { getRandomValues: (a: Uint8Array) => Uint8Array }).getRandomValues(b);
  return readU64(b, 0);
}

export const toBase = (x: number, decimals: number) => BigInt(Math.round(x * 10 ** decimals));
export const fromBase = (n: bigint, decimals: number) => Number(n) / 10 ** decimals;
