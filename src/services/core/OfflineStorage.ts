// Offline Storage Service using SQLite
// Handles local data storage for offline-first functionality

import * as SQLite from "expo-sqlite";
import { v4 as uuidv4 } from "uuid";
import { Habit, HabitProgress, User } from "../../types";

interface SyncQueueItem {
  id: string;
  action: "create" | "update" | "delete";
  table: "habits" | "progress" | "users";
  data: any;
  timestamp: string;
  retryCount: number;
}

class OfflineStorageService {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized && this.db) return;

    try {
      console.log("🗄️ Opening SQLite database...");

      // Close existing database if it exists
      if (this.db) {
        try {
          await this.db.closeAsync();
        } catch (closeError) {
          console.warn(
            "Warning: Could not close existing database:",
            closeError
          );
        }
      }

      this.db = await SQLite.openDatabaseAsync("itrackhabit.db");
      console.log("✅ Database opened successfully");

      console.log("📊 Creating database tables...");
      await this.createTables();
      console.log("✅ Database tables created successfully");

      // Check and fix schema issues
      await this.checkAndFixSchema();

      this.isInitialized = true;
      console.log("🎉 Offline storage initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize offline storage:", error);
      this.db = null;
      this.isInitialized = false;
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      try {
        await this.db.closeAsync();
        console.log("✅ Database closed successfully");
      } catch (error) {
        console.warn("Warning: Could not close database:", error);
      }
      this.db = null;
      this.isInitialized = false;
    }
  }

  async clearDatabase(): Promise<void> {
    try {
      await this.close();
      console.log("🗑️ Clearing database cache...");
      // The database will be recreated on next initialization
      this.isInitialized = false;
      console.log("✅ Database cache cleared");
    } catch (error) {
      console.error("❌ Failed to clear database:", error);
      throw error;
    }
  }

  async forceReinitialize(): Promise<void> {
    console.log("🔄 Force reinitializing database...");
    this.isInitialized = false;
    this.db = null;
    await this.initialize();
    console.log("✅ Database force reinitialized");
  }

  private ensureHabitFields(habit: Habit): Habit {
    // Create a copy of the habit with all required fields
    const ensuredHabit: Habit = {
      id: habit.id || uuidv4(),
      userId: habit.userId || "offline_user",
      title: habit.title || "Untitled Habit",
      notes: habit.notes || "",
      frequency: habit.frequency || "daily",
      isShared: habit.isShared || false,
      type: habit.type || "manual",
      healthConfig: habit.healthConfig,
      targetConfig: habit.targetConfig,
      color: habit.color || "#4CAF50",
      createdAt: habit.createdAt || new Date().toISOString(),
      updatedAt: habit.updatedAt || new Date().toISOString(),
      deletedAt: habit.deletedAt,
      pending: habit.pending || false,
      serverId: habit.serverId,
    };

    console.log("🔧 Ensured habit fields:", {
      id: ensuredHabit.id,
      userId: ensuredHabit.userId,
      title: ensuredHabit.title,
      frequency: ensuredHabit.frequency,
      type: ensuredHabit.type,
    });

    return ensuredHabit;
  }

  private async checkAndFixSchema(): Promise<void> {
    if (!this.db) return;

    try {
      // Check if habit_progress table has the correct columns
      const result = await this.db.getAllAsync(
        "PRAGMA table_info(habit_progress)"
      );
      const columns = result.map((row: any) => row.name);

      console.log("📋 Current habit_progress columns:", columns);

      if (!columns.includes("currentValue")) {
        console.log(
          "⚠️ Column currentValue missing, checking for current_value..."
        );
        if (columns.includes("current_value")) {
          console.log(
            "🔄 Found current_value column, adding currentValue alias..."
          );
          // We can handle this at the query level
        } else {
          console.log("🆕 Adding currentValue column...");
          await this.db.execAsync(
            "ALTER TABLE habit_progress ADD COLUMN currentValue REAL"
          );
        }
      }

      if (!columns.includes("targetValue")) {
        console.log("🆕 Adding targetValue column...");
        await this.db.execAsync(
          "ALTER TABLE habit_progress ADD COLUMN targetValue REAL"
        );
      }

      if (!columns.includes("unit")) {
        console.log("🆕 Adding unit column...");
        await this.db.execAsync(
          "ALTER TABLE habit_progress ADD COLUMN unit TEXT"
        );
      }

      // Check if habits table has missing columns
      const habitResult = await this.db.getAllAsync(
        "PRAGMA table_info(habits)"
      );
      const habitColumns = habitResult.map((row: any) => row.name);

      console.log("📋 Current habits columns:", habitColumns);

      if (!habitColumns.includes("color")) {
        console.log("🎨 Adding color column to habits table...");
        await this.db.execAsync("ALTER TABLE habits ADD COLUMN color TEXT");
      }

      if (!habitColumns.includes("targetConfig")) {
        console.log("🎯 Adding targetConfig column to habits table...");
        await this.db.execAsync(
          "ALTER TABLE habits ADD COLUMN targetConfig TEXT"
        );
      }
    } catch (error) {
      console.log("📝 Schema check completed with minor issues:", error);
      // Non-critical errors can be ignored
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    console.log("📋 Creating users table...");
    // Users table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        avatarUrl TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        pending INTEGER DEFAULT 0,
        serverId TEXT
      );
    `);

    console.log("📝 Creating habits table...");
    // Habits table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS habits (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        title TEXT NOT NULL,
        notes TEXT,
        frequency TEXT NOT NULL,
        isShared INTEGER DEFAULT 0,
        type TEXT DEFAULT 'manual',
        healthConfig TEXT,
        targetConfig TEXT,
        color TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT,
        pending INTEGER DEFAULT 0,
        serverId TEXT,
        FOREIGN KEY (userId) REFERENCES users (id)
      );
    `);

    console.log("📊 Creating habit_progress table...");
    // Habit Progress table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS habit_progress (
        id TEXT PRIMARY KEY,
        habitId TEXT NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL,
        currentValue REAL,
        targetValue REAL,
        unit TEXT,
        notes TEXT,
        updatedAt TEXT NOT NULL,
        pending INTEGER DEFAULT 0,
        serverId TEXT,
        FOREIGN KEY (habitId) REFERENCES habits (id),
        UNIQUE(habitId, date)
      );
    `);

    console.log("🔄 Creating sync_queue table...");
    // Sync Queue table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        tableName TEXT NOT NULL,
        data TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        retryCount INTEGER DEFAULT 0,
        lastAttempt TEXT
      );
    `);

    console.log("🏷️ Creating metadata table...");
    // Metadata table for sync status
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);

    console.log("✅ All database tables created successfully");
  }

  // ===== HABIT OPERATIONS =====

  async saveHabit(habit: Habit): Promise<void> {
    // Ensure database is initialized
    if (!this.isInitialized || !this.db) {
      console.log("🔄 Database not initialized, initializing now...");
      await this.initialize();
    }

    if (!this.db) {
      console.error("❌ Database still not available after initialization");
      throw new Error("Database not initialized");
    }

    console.log("💾 OfflineStorage.saveHabit called with habit:", {
      id: habit.id,
      userId: habit.userId,
      title: habit.title,
      color: habit.color,
      frequency: habit.frequency,
      type: habit.type,
      targetConfig: habit.targetConfig,
    });

    // Ensure all required fields are properly set
    const ensuredHabit = this.ensureHabitFields(habit);

    const healthConfigJson = ensuredHabit.healthConfig
      ? JSON.stringify(ensuredHabit.healthConfig)
      : null;
    const targetConfigJson = ensuredHabit.targetConfig
      ? JSON.stringify(ensuredHabit.targetConfig)
      : null;

    console.log("🔄 About to execute database INSERT OR REPLACE...");

    try {
      // Simple database operation without transaction wrapper
      await this.db.runAsync(
        `INSERT OR REPLACE INTO habits 
         (id, userId, title, notes, frequency, isShared, type, healthConfig, targetConfig, color, createdAt, updatedAt, deletedAt, pending, serverId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ensuredHabit.id,
          ensuredHabit.userId,
          ensuredHabit.title,
          ensuredHabit.notes || null,
          ensuredHabit.frequency,
          ensuredHabit.isShared ? 1 : 0,
          ensuredHabit.type,
          healthConfigJson,
          targetConfigJson,
          ensuredHabit.color || null,
          ensuredHabit.createdAt,
          ensuredHabit.updatedAt,
          ensuredHabit.deletedAt || null,
          ensuredHabit.pending ? 1 : 0,
          ensuredHabit.serverId || null,
        ]
      );

      console.log("✅ Database INSERT OR REPLACE completed successfully");
    } catch (error) {
      console.error("❌ Database INSERT OR REPLACE failed:", error);

      // Try to reinitialize database if finalizeAsync error
      if (
        error instanceof Error &&
        (error.message.includes("finalizeAsync") ||
          error.message.includes("runAsync"))
      ) {
        console.log("🔄 Attempting to reinitialize database...");
        try {
          await this.initialize();
          // Retry the operation once
          await this.db!.runAsync(
            `INSERT OR REPLACE INTO habits 
             (id, userId, title, notes, frequency, isShared, type, healthConfig, targetConfig, color, createdAt, updatedAt, deletedAt, pending, serverId)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              ensuredHabit.id,
              ensuredHabit.userId,
              ensuredHabit.title,
              ensuredHabit.notes || null,
              ensuredHabit.frequency,
              ensuredHabit.isShared ? 1 : 0,
              ensuredHabit.type,
              healthConfigJson,
              targetConfigJson,
              ensuredHabit.color || null,
              ensuredHabit.createdAt,
              ensuredHabit.updatedAt,
              ensuredHabit.deletedAt || null,
              ensuredHabit.pending ? 1 : 0,
              ensuredHabit.serverId || null,
            ]
          );
          console.log("✅ Database operation succeeded after reinitialization");
        } catch (retryError) {
          console.error("❌ Database retry also failed:", retryError);
          throw retryError;
        }
      } else {
        throw error;
      }
    }

    // Add to sync queue if pending
    if (ensuredHabit.pending) {
      console.log("🔄 Adding to sync queue...");
      await this.addToSyncQueue("create", "habits", ensuredHabit);
      console.log("✅ Added to sync queue");
    }

    console.log("✅ OfflineStorage.saveHabit completed successfully");
  }

  async getHabits(userId: string): Promise<Habit[]> {
    // Ensure database is initialized
    if (!this.isInitialized || !this.db) {
      console.log("🔄 Database not initialized, initializing now...");
      await this.initialize();
    }

    if (!this.db) {
      console.error("❌ Database still not available after initialization");
      throw new Error("Database not initialized");
    }

    console.log("🔍 OfflineStorage: Getting habits for userId:", userId);
    const result = await this.db.getAllAsync(
      `SELECT * FROM habits WHERE userId = ? AND deletedAt IS NULL ORDER BY createdAt DESC`,
      [userId]
    );

    console.log("📊 OfflineStorage: Found habits in database:", result.length);
    const habits = result.map((row) => this.mapRowToHabit(row as any));
    console.log(
      "📊 OfflineStorage: Mapped habits:",
      habits.map((h) => ({ id: h.id, title: h.title }))
    );
    return habits;
  }

  // Get all habits including deleted ones (for historical data display)
  async getAllHabits(userId: string): Promise<Habit[]> {
    if (!this.db) throw new Error("Database not initialized");

    console.log(
      "🔍 OfflineStorage: Getting ALL habits (including deleted) for userId:",
      userId
    );
    const result = await this.db.getAllAsync(
      `SELECT * FROM habits WHERE userId = ? ORDER BY createdAt DESC`,
      [userId]
    );

    console.log(
      "📊 OfflineStorage: Found all habits in database:",
      result.length
    );
    const habits = result.map((row) => this.mapRowToHabit(row as any));
    return habits;
  }

  async getHabitById(
    habitId: string,
    includeDeleted: boolean = false
  ): Promise<Habit | null> {
    if (!this.db) throw new Error("Database not initialized");

    const whereClause = includeDeleted
      ? `id = ?`
      : `id = ? AND deletedAt IS NULL`;
    const result = await this.db.getFirstAsync(
      `SELECT * FROM habits WHERE ${whereClause}`,
      [habitId]
    );

    return result ? this.mapRowToHabit(result as any) : null;
  }

  async updateHabit(habit: Habit): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    console.log("💾 OfflineStorage.updateHabit called with:", {
      id: habit.id,
      title: habit.title,
      color: habit.color,
      targetConfig: habit.targetConfig,
    });

    habit.updatedAt = new Date().toISOString();
    habit.pending = true;

    console.log("🔄 About to call saveHabit...");
    await this.saveHabit(habit);
    console.log("✅ saveHabit completed, adding to sync queue...");

    await this.addToSyncQueue("update", "habits", habit);
    console.log("✅ OfflineStorage.updateHabit completed successfully");
  }

  async deleteHabit(habitId: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    console.log("🗑️ OfflineStorage.deleteHabit called for habitId:", habitId);

    // Check habit before deletion
    const habitBefore = await this.getHabitById(habitId);
    console.log(
      "📊 Habit before deletion:",
      habitBefore ? habitBefore.title : "NOT FOUND"
    );

    const now = new Date().toISOString();
    console.log("🔄 Setting deletedAt to:", now);

    await this.db.runAsync(
      `UPDATE habits SET deletedAt = ?, updatedAt = ?, pending = 1 WHERE id = ?`,
      [now, now, habitId]
    );

    // Check habit after deletion
    const habitAfter = await this.getAllHabits("offline_user");
    console.log(
      "📊 Total habits after soft delete (including deleted):",
      habitAfter.length
    );

    const activeHabits = await this.getHabits("offline_user");
    console.log("📊 Active habits after soft delete:", activeHabits.length);

    await this.addToSyncQueue("delete", "habits", {
      id: habitId,
      deletedAt: now,
    });
  }

  private mapRowToHabit(row: any): Habit {
    return {
      id: row.id,
      userId: row.userId,
      title: row.title,
      notes: row.notes,
      frequency: row.frequency,
      isShared: row.isShared === 1,
      type: row.type || "manual",
      healthConfig: row.healthConfig ? JSON.parse(row.healthConfig) : undefined,
      targetConfig: row.targetConfig ? JSON.parse(row.targetConfig) : undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
      pending: row.pending === 1,
      serverId: row.serverId,
      color: row.color,
    } as any;
  }

  // ===== HABIT PROGRESS OPERATIONS =====

  // Alias for saveHabitProgress - for compatibility with DataService
  async saveProgress(progress: HabitProgress): Promise<void> {
    return this.saveHabitProgress(progress);
  }

  async saveHabitProgress(progress: HabitProgress): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.runAsync(
      `INSERT OR REPLACE INTO habit_progress 
       (id, habitId, date, status, currentValue, targetValue, unit, notes, updatedAt, pending, serverId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        progress.id,
        progress.habitId,
        progress.date,
        progress.status,
        progress.currentValue || null,
        progress.targetValue || null,
        progress.unit || null,
        progress.notes || null,
        progress.updatedAt,
        progress.pending ? 1 : 0,
        progress.serverId || null,
      ]
    );

    // Add to sync queue if pending
    if (progress.pending) {
      await this.addToSyncQueue("create", "progress", progress);
    }
  }

  async getHabitProgress(
    habitId: string,
    startDate?: string,
    endDate?: string
  ): Promise<HabitProgress[]> {
    if (!this.db) throw new Error("Database not initialized");

    let query = `SELECT * FROM habit_progress WHERE habitId = ?`;
    const params: any[] = [habitId];

    if (startDate) {
      query += ` AND date >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND date <= ?`;
      params.push(endDate);
    }

    query += ` ORDER BY date DESC`;

    console.log("🔍 getHabitProgress query:", query, "params:", params);
    const result = await this.db.getAllAsync(query, params);
    console.log(
      "📊 getHabitProgress found",
      result.length,
      "entries for habit",
      habitId
    );

    return result.map((row) => this.mapRowToHabitProgress(row as any));
  }

  async updateHabitProgress(progress: HabitProgress): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    progress.updatedAt = new Date().toISOString();
    progress.pending = true;

    await this.saveHabitProgress(progress);
    await this.addToSyncQueue("update", "progress", progress);
  }

  // ===== SYNC QUEUE OPERATIONS =====

  async addToSyncQueue(
    action: "create" | "update" | "delete",
    table: "habits" | "progress" | "users",
    data: any
  ): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const queueItem: SyncQueueItem = {
      id: uuidv4(),
      action,
      table,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };

    await this.db.runAsync(
      `INSERT INTO sync_queue (id, action, tableName, data, timestamp, retryCount)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        queueItem.id,
        queueItem.action,
        queueItem.table,
        JSON.stringify(queueItem.data),
        queueItem.timestamp,
        queueItem.retryCount,
      ]
    );
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.getAllAsync(
      `SELECT * FROM sync_queue ORDER BY timestamp ASC`
    );

    return result.map((row) => ({
      id: (row as any).id,
      action: (row as any).action,
      table: (row as any).tableName,
      data: JSON.parse((row as any).data),
      timestamp: (row as any).timestamp,
      retryCount: (row as any).retryCount,
    }));
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.runAsync(`DELETE FROM sync_queue WHERE id = ?`, [id]);
  }

  async updateSyncQueueItemRetry(id: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.runAsync(
      `UPDATE sync_queue SET retryCount = retryCount + 1, lastAttempt = ? WHERE id = ?`,
      [new Date().toISOString(), id]
    );
  }

  async clearSyncQueue(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.runAsync(`DELETE FROM sync_queue`);
  }

  // ===== METADATA OPERATIONS =====

  async setMetadata(key: string, value: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.runAsync(
      `INSERT OR REPLACE INTO metadata (key, value, updatedAt) VALUES (?, ?, ?)`,
      [key, value, new Date().toISOString()]
    );
  }

  async getMetadata(key: string): Promise<string | null> {
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.getFirstAsync(
      `SELECT value FROM metadata WHERE key = ?`,
      [key]
    );

    return result ? (result as any).value : null;
  }

  // ===== UTILITY OPERATIONS =====

  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.runAsync(`DELETE FROM habits`);
    await this.db.runAsync(`DELETE FROM habit_progress`);
    await this.db.runAsync(`DELETE FROM users`);
    await this.db.runAsync(`DELETE FROM sync_queue`);
    await this.db.runAsync(`DELETE FROM metadata`);
  }

  async getStats(): Promise<{
    totalHabits: number;
    totalProgress: number;
    pendingSync: number;
  }> {
    if (!this.db) throw new Error("Database not initialized");

    const habitsResult = await this.db.getFirstAsync(
      `SELECT COUNT(*) as count FROM habits WHERE deletedAt IS NULL`
    );

    const progressResult = await this.db.getFirstAsync(
      `SELECT COUNT(*) as count FROM habit_progress`
    );

    const syncResult = await this.db.getFirstAsync(
      `SELECT COUNT(*) as count FROM sync_queue`
    );

    return {
      totalHabits: (habitsResult as any)?.count || 0,
      totalProgress: (progressResult as any)?.count || 0,
      pendingSync: (syncResult as any)?.count || 0,
    };
  }

  // ===== ADDITIONAL METHODS FOR SUPABASE INTEGRATION =====

  async getHabit(habitId: string): Promise<Habit | null> {
    if (!this.db) throw new Error("Database not initialized");
    const result = await this.db.getFirstAsync(
      `SELECT * FROM habits WHERE id = ? AND deletedAt IS NULL`,
      [habitId]
    );
    return result ? this.mapRowToHabit(result as any) : null;
  }

  async getPendingHabits(userId: string): Promise<Habit[]> {
    if (!this.db) throw new Error("Database not initialized");
    const result = await this.db.getAllAsync(
      `SELECT * FROM habits WHERE userId = ? AND pending = 1 AND deletedAt IS NULL ORDER BY createdAt DESC`,
      [userId]
    );
    return result.map((row) => this.mapRowToHabit(row as any));
  }

  async getPendingProgress(userId: string): Promise<HabitProgress[]> {
    if (!this.db) throw new Error("Database not initialized");
    const result = await this.db.getAllAsync(
      `SELECT hp.* FROM habit_progress hp 
       JOIN habits h ON hp.habitId = h.id 
       WHERE h.userId = ? AND hp.pending = 1 
       ORDER BY hp.date DESC`,
      [userId]
    );
    return result.map((row) => this.mapRowToHabitProgress(row as any));
  }

  async getHabitProgressById(
    progressId: string
  ): Promise<HabitProgress | null> {
    if (!this.db) throw new Error("Database not initialized");
    const result = await this.db.getFirstAsync(
      `SELECT * FROM habit_progress WHERE id = ?`,
      [progressId]
    );
    return result ? this.mapRowToHabitProgress(result as any) : null;
  }

  async getHabitProgressForDate(
    habitId: string,
    date: string
  ): Promise<HabitProgress | null> {
    if (!this.db) throw new Error("Database not initialized");
    const result = await this.db.getFirstAsync(
      `SELECT * FROM habit_progress WHERE habitId = ? AND date = ?`,
      [habitId, date]
    );
    return result ? this.mapRowToHabitProgress(result as any) : null;
  }

  private mapRowToHabitProgress(row: any): HabitProgress {
    return {
      id: row.id,
      habitId: row.habitId,
      date: row.date,
      status: row.status,
      currentValue: row.currentValue,
      targetValue: row.targetValue,
      unit: row.unit,
      notes: row.notes,
      updatedAt: row.updatedAt,
      pending: row.pending === 1,
    };
  }

  // ===== DATA MANAGEMENT METHODS =====

  async getAllHabitProgress(userId: string): Promise<HabitProgress[]> {
    if (!this.db) throw new Error("Database not initialized");
    const result = await this.db.getAllAsync(
      `SELECT hp.* FROM habit_progress hp 
       JOIN habits h ON hp.habitId = h.id 
       WHERE h.userId = ? 
       ORDER BY hp.date DESC`,
      [userId]
    );
    return result.map((row) => this.mapRowToHabitProgress(row as any));
  }

  async clearUserData(userId: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    try {
      // Delete habit progress for user's habits
      await this.db.runAsync(
        `DELETE FROM habit_progress WHERE habitId IN (
          SELECT id FROM habits WHERE userId = ?
        )`,
        [userId]
      );

      // Delete user's habits
      await this.db.runAsync(`DELETE FROM habits WHERE userId = ?`, [userId]);

      // Clear sync queue for this user
      await this.db.runAsync(`DELETE FROM sync_queue WHERE data LIKE ?`, [
        `%"userId":"${userId}"%`,
      ]);

      // Clear metadata for this user
      await this.db.runAsync(`DELETE FROM metadata WHERE key LIKE ?`, [
        `${userId}_%`,
      ]);

      console.log(`✅ Cleared all data for user: ${userId}`);
    } catch (error) {
      console.error("Failed to clear user data:", error);
      throw error;
    }
  }
}

export const offlineStorage = new OfflineStorageService();
