import {
  ReminderLog,
  ReminderSettings,
  ReminderTemplate,
  DEFAULT_REMINDER_TEMPLATES,
  reminderLogSchema,
  reminderSettingsSchema,
} from "./reminder.schema";

const REMINDERS_STORAGE_KEY = "barmentech_reminders";
const REMINDER_SETTINGS_KEY = "barmentech_reminder_settings";
const REMINDER_TEMPLATES_KEY = "barmentech_reminder_templates";

/**
 * Generate unique ID
 */
function generateId(): string {
  return `rem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get stored reminders
 */
function getStoredReminders(): ReminderLog[] {
  try {
    const stored = localStorage.getItem(REMINDERS_STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    return parsed.map((r: any) => reminderLogSchema.parse(r));
  } catch (error) {
    console.error("[reminder.storage] Error reading reminders:", error);
    return [];
  }
}

/**
 * Save reminders
 */
function saveReminders(reminders: ReminderLog[]): void {
  try {
    localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminders));
  } catch (error) {
    console.error("[reminder.storage] Error saving reminders:", error);
  }
}

/**
 * Get reminder settings
 */
export async function getReminderSettings(): Promise<ReminderSettings> {
  try {
    const stored = localStorage.getItem(REMINDER_SETTINGS_KEY);
    if (!stored) {
      // Return default settings
      const defaults: ReminderSettings = {
        manualEnabled: true,
        scheduledEnabled: false,
        autoEnabled: false,
        rules: [],
        defaultChannel: "email",
      };
      await saveReminderSettings(defaults);
      return defaults;
    }
    
    return reminderSettingsSchema.parse(JSON.parse(stored));
  } catch (error) {
    console.error("[reminder.storage] Error reading settings:", error);
    return {
      manualEnabled: true,
      scheduledEnabled: false,
      autoEnabled: false,
      rules: [],
      defaultChannel: "email",
    };
  }
}

/**
 * Save reminder settings
 */
export async function saveReminderSettings(settings: ReminderSettings): Promise<void> {
  try {
    localStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("[reminder.storage] Error saving settings:", error);
    throw error;
  }
}

/**
 * Get reminder templates
 */
export async function getReminderTemplates(): Promise<ReminderTemplate[]> {
  try {
    const stored = localStorage.getItem(REMINDER_TEMPLATES_KEY);
    if (!stored) {
      // Initialize with default templates
      await saveReminderTemplates(DEFAULT_REMINDER_TEMPLATES);
      return DEFAULT_REMINDER_TEMPLATES;
    }
    
    return JSON.parse(stored);
  } catch (error) {
    console.error("[reminder.storage] Error reading templates:", error);
    return DEFAULT_REMINDER_TEMPLATES;
  }
}

/**
 * Save reminder templates
 */
export async function saveReminderTemplates(templates: ReminderTemplate[]): Promise<void> {
  try {
    localStorage.setItem(REMINDER_TEMPLATES_KEY, JSON.stringify(templates));
  } catch (error) {
    console.error("[reminder.storage] Error saving templates:", error);
  }
}

/**
 * Get all reminders
 */
export async function listReminders(): Promise<ReminderLog[]> {
  await new Promise(resolve => setTimeout(resolve, 100));
  return getStoredReminders();
}

/**
 * Get reminders for a specific invoice
 */
export async function getRemindersByInvoice(invoiceId: string): Promise<ReminderLog[]> {
  await new Promise(resolve => setTimeout(resolve, 100));
  const reminders = getStoredReminders();
  return reminders.filter(r => r.invoiceId === invoiceId);
}

/**
 * Create a reminder log
 */
export async function createReminderLog(
  data: Omit<ReminderLog, "id" | "createdAt">
): Promise<ReminderLog> {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const reminders = getStoredReminders();
  
  const newReminder: ReminderLog = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  
  reminders.push(newReminder);
  saveReminders(reminders);
  
  return newReminder;
}

/**
 * Update reminder log (e.g., mark as sent, opened, clicked)
 */
export async function updateReminderLog(
  id: string,
  updates: Partial<ReminderLog>
): Promise<ReminderLog> {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const reminders = getStoredReminders();
  const index = reminders.findIndex(r => r.id === id);
  
  if (index === -1) {
    throw new Error("Reminder not found");
  }
  
  reminders[index] = {
    ...reminders[index],
    ...updates,
  };
  
  saveReminders(reminders);
  return reminders[index];
}

/**
 * Get reminder statistics
 */
export async function getReminderStats(): Promise<{
  total: number;
  sent: number;
  pending: number;
  failed: number;
  thisMonth: number;
}> {
  const reminders = getStoredReminders();
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  return {
    total: reminders.length,
    sent: reminders.filter(r => r.status === "sent").length,
    pending: reminders.filter(r => r.status === "pending").length,
    failed: reminders.filter(r => r.status === "failed").length,
    thisMonth: reminders.filter(r => {
      const createdAt = new Date(r.createdAt);
      return createdAt >= firstDayOfMonth;
    }).length,
  };
}
