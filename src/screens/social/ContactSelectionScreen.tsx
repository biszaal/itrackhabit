import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator, Linking, Share, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import { useTheme } from '../../theme/ThemeContext';
import { Screen, AppHeader, Card, Button, Field } from '../../components/ds';

interface Props {
  navigation: any;
}

interface Contact {
  id: string;
  name: string;
  phoneNumbers?: { number: string; label?: string }[];
  emails?: { email: string; label?: string }[];
}

interface SelectedContact extends Contact {
  invitationType: 'sms' | 'email';
}

const initials = (name: string) =>
  String(name || '?')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const colorFor = (id: string, palette: string[]): string => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 100000;
  return palette[hash % palette.length];
};

export const ContactSelectionScreen: React.FC<Props> = ({ navigation }) => {
  const t = useTheme();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<SelectedContact[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState<boolean | null>(null);

  const request = useCallback(async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      setPermission(status === 'granted');
      if (status === 'granted') {
        setLoading(true);
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
        });
        const valid: Contact[] = data
          .filter(
            (c) =>
              c.name &&
              ((c.phoneNumbers && c.phoneNumbers.length > 0) ||
                (c.emails && c.emails.length > 0))
          )
          .map((c) => ({
            id: c.id ?? `${c.name}-${Math.random()}`,
            name: c.name as string,
            phoneNumbers: c.phoneNumbers?.map((p) => ({ number: p.number ?? '', label: p.label })),
            emails: c.emails?.map((e) => ({ email: e.email ?? '', label: e.label })),
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setContacts(valid);
        setLoading(false);
      }
    } catch {
      setPermission(false);
    }
  }, []);

  useEffect(() => { request(); }, [request]);

  const toggle = (c: Contact) => {
    const i = selected.findIndex((s) => s.id === c.id);
    if (i >= 0) setSelected(selected.filter((s) => s.id !== c.id));
    else {
      const type: 'sms' | 'email' = c.phoneNumbers?.length ? 'sms' : 'email';
      setSelected([...selected, { ...c, invitationType: type }]);
    }
  };

  const send = async () => {
    if (selected.length === 0) {
      Alert.alert('Pick someone', 'Select at least one contact to invite.');
      return;
    }
    const msg = `Hey! 👋 I'm using iTrackHabit to build better habits — I think you'd love it too. Get it here: https://itrackhabit.app`;
    try {
      let sent = 0;
      const smsList = selected.filter((c) => c.invitationType === 'sms');
      for (const c of smsList) {
        const num = c.phoneNumbers?.[0]?.number;
        if (num) {
          const url = `sms:${num}?body=${encodeURIComponent(msg)}`;
          if (await Linking.canOpenURL(url)) {
            await Linking.openURL(url);
            sent++;
          }
        }
      }
      const emails = selected.filter((c) => c.invitationType === 'email').map((c) => c.emails?.[0]?.email).filter(Boolean) as string[];
      if (emails.length) {
        await Share.share({ message: `${msg}\n\nTo: ${emails.join(', ')}`, title: 'Join me on iTrackHabit' });
        sent += emails.length;
      }
      if (sent > 0) {
        Alert.alert('Sent', `Sent ${sent} invitation${sent === 1 ? '' : 's'}.`, [{ text: 'Done', onPress: () => navigation.goBack() }]);
      } else {
        Alert.alert('Nothing sent', 'Could not send invitations.');
      }
    } catch {
      Alert.alert('Could not send', 'Try again.');
    }
  };

  const filtered = contacts.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  if (permission === false) {
    return (
      <Screen>
        <AppHeader title="Invite friends" back onBack={() => navigation.goBack()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 }}>
          <Text style={{ fontSize: 48 }}>📇</Text>
          <Text style={{ color: t.colors.ink, fontSize: 20, fontWeight: '700', letterSpacing: -0.3, textAlign: 'center' }}>
            Contacts access needed
          </Text>
          <Text style={{ color: t.colors.ink2, fontSize: 14, textAlign: 'center', maxWidth: 300 }}>
            Allow access to your contacts so we can help you invite friends.
          </Text>
          <Button title="Grant access" style={{ marginTop: 12 }} onPress={request} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader
        title="Invite friends"
        subtitle={selected.length > 0 ? `${selected.length} selected` : 'Pick from your contacts'}
        back
        onBack={() => navigation.goBack()}
        action={
          selected.length > 0 ? (
            <Pressable onPress={send} hitSlop={8}>
              <Text style={{ color: t.colors.primary, fontSize: 14, fontWeight: '700' }}>Send</Text>
            </Pressable>
          ) : undefined
        }
      />

      <View style={{ paddingHorizontal: t.spacing.screen, paddingBottom: 8 }}>
        <Field
          placeholder="Search contacts"
          value={search}
          onChangeText={setSearch}
          left={<Ionicons name="search" size={18} color={t.colors.ink3} />}
        />
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={t.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: t.spacing.screen, paddingBottom: 120 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => {
            const sel = selected.find((s) => s.id === item.id);
            const c = colorFor(item.id, t.habitColors);
            return (
              <Pressable onPress={() => toggle(item)}>
                <Card variant="elevated" padding={12} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: c,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>{initials(item.name)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: t.colors.ink, fontSize: 14, fontWeight: '600' }} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={{ color: t.colors.ink3, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                      {item.phoneNumbers?.[0]?.number ?? item.emails?.[0]?.email ?? ''}
                    </Text>
                  </View>
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: sel ? t.colors.primary : 'transparent',
                      borderWidth: sel ? 0 : 1.5,
                      borderColor: t.colors.line,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {sel && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                  </View>
                </Card>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <Text style={{ color: t.colors.ink3, fontSize: 13, textAlign: 'center', paddingTop: 40 }}>
              No contacts match.
            </Text>
          }
        />
      )}

      {selected.length > 0 && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            padding: 16,
            paddingBottom: 32,
            backgroundColor: t.colors.bg,
            borderTopWidth: 1,
            borderTopColor: t.colors.lineSoft,
          }}
        >
          <Button title={`Invite ${selected.length}`} fullWidth onPress={send} />
        </View>
      )}
    </Screen>
  );
};
