import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Switch } from 'react-native';
import { RootStackScreenProps } from '../../types/navigation';
import { useTheme } from '../../theme/ThemeContext';
import { Screen, AppHeader, Card, Chip, Field, Button } from '../../components/ds';
import {
  feedbackService,
  FeedbackCategory,
  SubmitOutcome,
  MAX_MESSAGE_LENGTH,
  EMAIL_PATTERN,
} from '../../services/feedback/FeedbackService';

type Props = RootStackScreenProps<'Feedback'>;

const CATEGORIES: { value: FeedbackCategory; label: string }[] = [
  { value: 'bug', label: "Something's broken" },
  { value: 'idea', label: 'I have an idea' },
  { value: 'confusing', label: "Something's confusing" },
  { value: 'praise', label: 'I love something' },
];

const RESULT_TEXT: Record<Exclude<SubmitOutcome['status'], 'invalid'>, string> = {
  sent: 'Thank you — we read every message.',
  queued: "Saved. It'll send automatically when you're back online.",
  rate_limited: 'Thanks for all the feedback today! This one will send tomorrow.',
};

export const FeedbackScreen: React.FC<Props> = ({ navigation }) => {
  const t = useTheme();
  const [category, setCategory] = useState<FeedbackCategory | null>(null);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [includeDevice, setIncludeDevice] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // State updates land after the next render, so a quick double tap would
  // otherwise get past a `sending` check and submit twice.
  const sendingRef = useRef(false);

  useEffect(() => {
    feedbackService.flushOutbox().catch(() => {});
  }, []);

  const device = feedbackService.getDeviceInfo();
  const deviceLine = `${device.appVersion} · ${device.platform} ${device.osVersion} · ${device.deviceModel ?? 'Unknown device'}`;
  const trimmedEmail = email.trim();
  const emailInvalid = trimmedEmail.length > 0 && !EMAIL_PATTERN.test(trimmedEmail);
  const canSend = category !== null && message.trim().length > 0 && !emailInvalid;

  const send = async () => {
    if (!category || !canSend || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setError(null);
    setResult(null);
    try {
      const outcome = await feedbackService.submit({
        category,
        message,
        contactEmail: trimmedEmail || undefined,
        includeDeviceInfo: includeDevice,
        source: 'profile',
      });
      if (outcome.status === 'invalid') {
        setError(`Couldn't send: ${outcome.message}`);
        return;
      }
      setResult(RESULT_TEXT[outcome.status]);
      setCategory(null);
      setMessage('');
      setEmail('');
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  return (
    <Screen>
      <AppHeader title="Send feedback" back onBack={() => navigation.goBack()} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: t.spacing.screen, paddingBottom: 48, gap: 18 }}
      >
        {result && (
          <Card variant="elevated" padding={16}>
            <Text style={{ color: t.colors.ink, fontSize: 15, fontWeight: '600' }}>{result}</Text>
          </Card>
        )}

        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: t.colors.ink3, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            What's this about?
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {CATEGORIES.map((c) => (
              <Chip key={c.value} label={c.label} active={category === c.value} onPress={() => setCategory(c.value)} />
            ))}
          </View>
        </View>

        <View style={{ gap: 6 }}>
          <Field
            label="Message"
            placeholder="What's on your mind?"
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={MAX_MESSAGE_LENGTH}
          />
          <Text style={{ color: t.colors.ink4, fontSize: 11, textAlign: 'right' }}>
            {message.length}/{MAX_MESSAGE_LENGTH}
          </Text>
        </View>

        <View style={{ gap: 6 }}>
          <Field
            label="Email (optional)"
            placeholder="Only if you'd like a reply"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {emailInvalid && (
            <Text style={{ color: t.colors.danger, fontSize: 12 }}>That email doesn't look right.</Text>
          )}
        </View>

        <Card variant="elevated" padding={16} style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: t.colors.ink, fontSize: 15 }}>Include device info</Text>
            <Switch
              value={includeDevice}
              onValueChange={setIncludeDevice}
              accessibilityLabel="Include device info"
            />
          </View>
          {includeDevice && <Text style={{ color: t.colors.ink3, fontSize: 12 }}>{deviceLine}</Text>}
        </Card>

        <Text style={{ color: t.colors.ink3, fontSize: 12, lineHeight: 17 }}>
          This sends only what you see here. Your habits stay on your device.
        </Text>

        {error && <Text style={{ color: t.colors.danger, fontSize: 13 }}>{error}</Text>}

        <Button title="Send feedback" onPress={send} disabled={!canSend} loading={sending} fullWidth />
      </ScrollView>
    </Screen>
  );
};

export default FeedbackScreen;
