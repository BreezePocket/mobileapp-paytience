import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Sprout } from '@/components/Sprout';
import { Button, Card, Gap, Header, Screen, T, tap } from '@/components/ui';
import { Term } from '@/components/widgets';
import { shortAddress } from '@/domain/format';
import { useStore } from '@/store/app-store';
import { colors, space } from '@/theme';

/** Creates the practice wallet on this device. No account, no password, no secret words. */
export default function SignIn() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const { state, actions } = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const w = await actions.signIn();
      tap('success');
      setDone(w.address);
      setTimeout(() => {
        if (typeof next === 'string' && next) router.replace(next as never);
        else if (router.canGoBack()) router.back();
        else router.replace('/(tabs)');
      }, 1200);
    } catch {
      setError('We couldn’t make your wallet on this device. Please try again.');
      setBusy(false);
    }
  };

  const address = done ?? state.wallet?.address ?? null;

  return (
    <Screen
      header={<Header title="Your wallet" close />}
      contentStyle={{ alignItems: 'center', paddingTop: space.lg }}
      footer={
        address ? (
          <Button title="Done" kind="secondary" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} />
        ) : (
          <Button title="Create my practice wallet" icon="wallet" loading={busy} onPress={create} />
        )
      }>
      <Sprout size={150} mood={address ? 'excited' : 'happy'} pose={address ? 'cheer' : 'wave'} />
      <Gap h={space.md} />
      <T v="h1" center>
        {address ? 'You’re all set!' : 'Hi there!'}
      </T>
      <Gap h={space.sm} />
      <T v="body" center>
        {address ? `Your wallet ${shortAddress(address)} is ready.` : 'Make a free wallet to get practice money and start deals.'}
      </T>
      <Gap h={space.lg} />
      <Card color={colors.keepSoft} flat style={{ alignSelf: 'stretch' }}>
        <T v="body">
          Your <Term id="your-wallet">wallet</Term> is made on this phone and its key stays in the phone’s secure storage. PAYtience never holds your keys.
        </T>
        <View style={{ height: space.sm }} />
        <T v="small">No email, no password, no secret words. It holds practice money only, on Solana’s test network.</T>
      </Card>
      {error ? (
        <T v="smallBold" color={colors.danger} center style={{ marginTop: space.md }}>
          {error}
        </T>
      ) : null}
    </Screen>
  );
}
