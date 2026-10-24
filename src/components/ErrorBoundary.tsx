import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Fixed light palette: this screen sits outside ThemeProvider so that it
// still renders when theming is what broke.
import { lightPalette as c } from '../theme/tokens';
import { feedbackService } from '../services/feedback/FeedbackService';
import { reviewPromptService } from '../services/feedback/ReviewPromptService';
import { dataExportService } from '../services/core/DataExportService';

const STACK_LIMIT = 1500;
const EXPORT_FAILED = "Couldn't export. Your data is still on this device.";

/** The exact text a crash report sends. It is shown to the user first. */
export const buildCrashReport = (error: Error, componentStack: string): string =>
  `${error.name}: ${error.message}\n\n${componentStack.trim().slice(0, STACK_LIMIT)}`;

type ReportState = 'idle' | 'confirm' | 'sending' | 'sent' | 'queued' | 'failed';

const REPORT_TEXT: Partial<Record<ReportState, string>> = {
  sent: 'Report sent. Thank you.',
  queued: "Saved. It'll send when you're back online.",
  failed: "Couldn't send the report.",
};

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
  componentStack: string;
  resetKey: number;
  report: ReportState;
  exportMessage: string | null;
}

const Action: React.FC<{ label: string; onPress: () => void; primary?: boolean; disabled?: boolean }> = ({
  label,
  onPress,
  primary,
  disabled,
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityState={{ disabled: !!disabled }}
    style={({ pressed }) => ({
      height: 52,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: primary ? c.primary : c.bgPaper,
      opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
    })}
  >
    <Text style={{ color: primary ? '#FFFFFF' : c.ink, fontSize: 16, fontWeight: '600' }}>{label}</Text>
  </Pressable>
);

/**
 * Catches render errors anywhere below it. Without it, one thrown error left
 * an offline-only user on a blank screen with no way to reach their data.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, componentStack: '', resetKey: 0, report: 'idle', exportMessage: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Uncaught render error:', error, info.componentStack);
    this.setState({ componentStack: info.componentStack ?? '' });
    reviewPromptService.recordCrash().catch(() => {});
  }

  private retry = () => {
    this.setState((s) => ({
      error: null,
      componentStack: '',
      report: 'idle',
      exportMessage: null,
      resetKey: s.resetKey + 1,
    }));
  };

  private exportData = async () => {
    try {
      const result = await dataExportService.exportAllData();
      this.setState({ exportMessage: result.success ? 'Export ready.' : EXPORT_FAILED });
    } catch {
      this.setState({ exportMessage: EXPORT_FAILED });
    }
  };

  private sendReport = async () => {
    const { error, componentStack, report } = this.state;
    if (!error || report === 'sending') return;
    this.setState({ report: 'sending' });
    try {
      const outcome = await feedbackService.submit({
        category: 'bug',
        message: buildCrashReport(error, componentStack),
        includeDeviceInfo: true,
        source: 'crash_screen',
      });
      this.setState({
        report: outcome.status === 'sent' ? 'sent' : outcome.status === 'invalid' ? 'failed' : 'queued',
      });
    } catch {
      this.setState({ report: 'failed' });
    }
  };

  render() {
    const { error, componentStack, report, exportMessage, resetKey } = this.state;
    if (!error) {
      return <React.Fragment key={resetKey}>{this.props.children}</React.Fragment>;
    }

    const device = feedbackService.getDeviceInfo();

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 14 }}>
          <Text style={{ color: c.ink, fontSize: 24, fontWeight: '700', marginTop: 24 }}>Something went wrong.</Text>
          <Text style={{ color: c.ink2, fontSize: 15 }}>Your habits are safe on this device.</Text>

          <View style={{ gap: 10, marginTop: 12 }}>
            <Action label="Try again" primary onPress={this.retry} />
            <Action label="Export my data" onPress={this.exportData} />
            {exportMessage && <Text style={{ color: c.ink2, fontSize: 13 }}>{exportMessage}</Text>}
            {report === 'idle' && (
              <Action label="Send error report" onPress={() => this.setState({ report: 'confirm' })} />
            )}
          </View>

          {(report === 'confirm' || report === 'sending') && (
            <View style={{ gap: 10, marginTop: 8 }}>
              <Text style={{ color: c.ink2, fontSize: 13 }}>
                This sends the text below and your device details. No habit data.
              </Text>
              <View style={{ backgroundColor: c.bgSunken, borderRadius: 12, padding: 12, gap: 8 }}>
                <Text selectable style={{ color: c.ink, fontSize: 12, fontFamily: 'Courier' }}>
                  {buildCrashReport(error, componentStack)}
                </Text>
                <Text style={{ color: c.ink3, fontSize: 12 }}>
                  {`${device.appVersion} · ${device.platform} ${device.osVersion} · ${device.deviceModel ?? 'Unknown device'}`}
                </Text>
              </View>
              <Action label="Send report" primary disabled={report === 'sending'} onPress={this.sendReport} />
              <Action label="Cancel" onPress={() => this.setState({ report: 'idle' })} />
            </View>
          )}

          {REPORT_TEXT[report] && <Text style={{ color: c.ink2, fontSize: 13 }}>{REPORT_TEXT[report]}</Text>}
        </ScrollView>
      </SafeAreaView>
    );
  }
}
