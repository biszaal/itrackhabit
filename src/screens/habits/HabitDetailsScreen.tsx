import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../../components";
import { NeumorphCard, NeumorphInput, ColorPicker, NeumorphismColors } from "../../components/neumorphism";
import { HabitWithStats, HabitProgress, HabitProgressStatus } from "../../types";
import { RootStackScreenProps } from "../../types/navigation";
import { theme } from "../../theme";

type HabitDetailsScreenProps = RootStackScreenProps<"HabitDetails">;

interface ProgressEntry extends HabitProgress {
  daysSinceCreation: number;
}

const mockHabit: HabitWithStats = {
  id: "1",
  userId: "user1",
  title: "Drink 8 glasses of water",
  notes: "Stay hydrated throughout the day for better health and energy",
  frequency: "daily",
  isShared: false,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-15T00:00:00Z",
  pending: false,
  type: "manual",
  currentStreak: 5,
  longestStreak: 12,
  completionRate: 85,
  isDoneToday: true,
  totalCompletions: 45,
};

const mockProgressData = [
  { date: "2024-01-10", status: "done" as HabitProgressStatus },
  { date: "2024-01-11", status: "done" as HabitProgressStatus },
  { date: "2024-01-12", status: "skip" as HabitProgressStatus },
  { date: "2024-01-13", status: "done" as HabitProgressStatus },
  { date: "2024-01-14", status: "done" as HabitProgressStatus },
  { date: "2024-01-15", status: "done" as HabitProgressStatus },
];

const mockRecentEntries: ProgressEntry[] = [
  {
    id: "1",
    habitId: "1",
    date: "2024-01-15",
    status: "done",
    notes: "Felt great today, had extra energy!",
    updatedAt: "2024-01-15T20:00:00Z",
    pending: false,
    daysSinceCreation: 15,
  },
  {
    id: "2",
    habitId: "1",
    date: "2024-01-14",
    status: "done",
    updatedAt: "2024-01-14T19:30:00Z",
    pending: false,
    daysSinceCreation: 14,
  },
  {
    id: "3",
    habitId: "1",
    date: "2024-01-13",
    status: "done",
    notes: "Almost forgot but got it done before bed",
    updatedAt: "2024-01-13T23:45:00Z",
    pending: false,
    daysSinceCreation: 13,
  },
];

export const HabitDetailsScreen: React.FC<HabitDetailsScreenProps> = ({
  navigation,
  route,
}) => {
  const { habitId } = route.params;
  const [habit, setHabit] = useState<HabitWithStats>(mockHabit);
  const [progressData, setProgressData] = useState(mockProgressData);
  const [recentEntries, setRecentEntries] =
    useState<ProgressEntry[]>(mockRecentEntries);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [noteText, setNoteText] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: habit.title,
      headerRight: () => (
        <TouchableOpacity onPress={handleMenuPress}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#333" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, habit.title]);

  const handleMenuPress = () => {
    Alert.alert("Habit Options", `Options for "${habit.title}"`, [
      {
        text: "Edit",
        onPress: () => navigation.navigate("EditHabit", { habitId }),
      },
      {
        text: "Share",
        onPress: handleShare,
      },
      {
        text: "Create Challenge",
        onPress: () => navigation.navigate("CreateChallenge", { habitId }),
      },
      {
        text: "Export Data",
        onPress: handleExport,
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const handleShare = () => {
    // TODO: Implement sharing
    Alert.alert("Share Habit", "Sharing functionality coming soon!");
  };

  const handleExport = () => {
    // TODO: Implement export
    Alert.alert("Export Data", "Export functionality coming soon!");
  };

  const handleDatePress = (date: string) => {
    Alert.alert(
      "Update Progress",
      `Update your progress for ${new Date(date).toLocaleDateString()}`,
      [
        {
          text: "Mark Done",
          onPress: () => updateProgress(date, "done"),
        },
        {
          text: "Mark Skipped",
          onPress: () => updateProgress(date, "skip"),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const updateProgress = (date: string, status: HabitProgressStatus) => {
    setProgressData((prev) => {
      const existing = prev.find((p) => p.date === date);
      if (existing) {
        return prev.map((p) => (p.date === date ? { ...p, status } : p));
      } else {
        return [...prev, { date, status }];
      }
    });

    // Update habit stats
    setHabit((prev: any) => ({
      ...prev,
      isDoneToday:
        date === new Date().toISOString().split("T")[0] && status === "done",
    }));
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;

    const today = new Date().toISOString().split("T")[0];
    const newEntry: ProgressEntry = {
      id: Date.now().toString(),
      habitId,
      date: today,
      status: "done",
      notes: noteText.trim(),
      updatedAt: new Date().toISOString(),
      pending: false,
      daysSinceCreation: Math.floor(
        (Date.now() - new Date(habit.createdAt).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
    };

    setRecentEntries((prev) => [newEntry, ...prev]);
    setNoteText("");
    setIsAddingNote(false);
  };

  const previousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const formatEntryDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: HabitProgressStatus) => {
    return status === "done" ? theme.colors.success : theme.colors.warning;
  };

  const getStatusIcon = (status: HabitProgressStatus) => {
    return status === "done" ? "checkmark-circle" : "close-circle";
  };

  const renderRecentEntry = ({ item }: { item: ProgressEntry }) => (
    <NeumorphCard
      variant="subtle"
      colorType={item.status === "done" ? "successGlass" : "warningGlass"}
      style={styles.entryCard}
      animated={true}
    >
      <View style={styles.entryHeader}>
        <View style={styles.entryDate}>
          <Ionicons
            name={getStatusIcon(item.status)}
            size={20}
            color={getStatusColor(item.status)}
          />
          <Text style={styles.entryDateText}>{formatEntryDate(item.date)}</Text>
          <Text style={styles.entryDayText}>Day {item.daysSinceCreation}</Text>
        </View>
      </View>
      {item.notes && <Text style={styles.entryNotes}>{item.notes}</Text>}
    </NeumorphCard>
  );

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <View style={[styles.container, { backgroundColor: "#F8FAFC" }]}>
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Stats Overview */}
          <View style={styles.statsContainer}>
            <NeumorphCard
              variant="medium"
              colorType="primaryGlass"
              style={styles.statCard}
              animated={true}
            >
              <Text style={styles.statValue}>{habit.currentStreak}</Text>
              <Text style={styles.statLabel}>Current Streak</Text>
            </NeumorphCard>
            <NeumorphCard
              variant="medium"
              colorType="successGlass"
              style={styles.statCard}
              animated={true}
            >
              <Text style={styles.statValue}>{habit.longestStreak}</Text>
              <Text style={styles.statLabel}>Best Streak</Text>
            </NeumorphCard>
            <NeumorphCard
              variant="medium"
              colorType="warningGlass"
              style={styles.statCard}
              animated={true}
            >
              <Text style={styles.statValue}>{habit.completionRate}%</Text>
              <Text style={styles.statLabel}>Success Rate</Text>
            </NeumorphCard>
          </View>

          {/* Calendar */}
          <NeumorphCard
            variant="light"
            colorType="whiteGlass"
            style={styles.calendarSection}
            animated={true}
          >
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={previousMonth}>
                <Ionicons
                  name="chevron-back"
                  size={24}
                  color={theme.colors.text}
                />
              </TouchableOpacity>
              <Text style={styles.monthTitle}>
                {monthNames[currentMonth]} {currentYear}
              </Text>
              <TouchableOpacity onPress={nextMonth}>
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={theme.colors.text}
                />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: theme.colors.textSecondary }}>
                Calendar view coming soon
              </Text>
            </View>
          </NeumorphCard>

          {/* Add Note Section */}
          <View style={styles.noteSection}>
            {isAddingNote ? (
              <NeumorphCard
                variant="light"
                colorType="whiteGlass"
                style={styles.noteInputCard}
                animated={true}
              >
                <NeumorphInput
                  placeholder="Add a note about today's progress..."
                  value={noteText}
                  onChangeText={setNoteText}
                  multiline
                  autoFocus
                  glassIntensity="subtle"
                  style={styles.noteTextInput}
                />
                <View style={styles.noteButtons}>
                  <Button
                    title="Cancel"
                    variant="text"
                    size="small"
                    onPress={() => {
                      setIsAddingNote(false);
                      setNoteText("");
                    }}
                  />
                  <Button
                    title="Add Note"
                    size="small"
                    onPress={handleAddNote}
                    disabled={!noteText.trim()}
                  />
                </View>
              </NeumorphCard>
            ) : (
              <NeumorphCard
                variant="subtle"
                colorType="whiteGlass"
                style={styles.addNoteButton}
                onPress={() => setIsAddingNote(true)}
                animated={true}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text style={styles.addNoteText}>Add a note</Text>
              </NeumorphCard>
            )}
          </View>

          {/* Health Insights (for health-based habits) */}
          {habit.type === "health" && habit.healthConfig && (
            <NeumorphCard
              variant="light"
              colorType="primaryGlass"
              style={styles.healthInsightsSection}
              animated={true}
            >
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: theme.colors.textSecondary }}>
                  Health insights coming soon
                </Text>
              </View>
            </NeumorphCard>
          )}

          {/* Recent Entries */}
          <NeumorphCard
            variant="light"
            colorType="whiteGlass"
            style={styles.entriesSection}
            animated={true}
          >
            <Text style={styles.sectionTitle}>Recent Progress</Text>
            <FlatList
              data={recentEntries}
              keyExtractor={(item) => item.id}
              renderItem={renderRecentEntry}
              scrollEnabled={false}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No progress entries yet</Text>
              }
            />
          </NeumorphCard>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: "row",
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: theme.spacing.xs,
  },
  statValue: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  calendarSection: {
    margin: theme.spacing.lg,
    marginTop: 0,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  monthTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  noteSection: {
    margin: theme.spacing.lg,
    marginTop: 0,
  },
  addNoteButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.md,
  },
  addNoteText: {
    marginLeft: theme.spacing.xs,
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
  },
  noteInputCard: {
    padding: theme.spacing.md,
  },
  noteTextInput: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    minHeight: 60,
    textAlignVertical: "top",
    marginBottom: theme.spacing.sm,
  },
  noteButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  healthInsightsSection: {
    margin: theme.spacing.lg,
    marginTop: 0,
  },
  entriesSection: {
    margin: theme.spacing.lg,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  entryCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  entryDate: {
    flexDirection: "row",
    alignItems: "center",
  },
  entryDateText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginLeft: theme.spacing.xs,
  },
  entryDayText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  entryNotes: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  emptyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    textAlign: "center",
    fontStyle: "italic",
    paddingVertical: theme.spacing.lg,
  },
});
