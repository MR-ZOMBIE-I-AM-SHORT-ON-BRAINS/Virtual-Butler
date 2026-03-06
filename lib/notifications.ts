import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { Platform } from 'react-native';
import { StorageService, UserProfile } from './storage';

const BACKGROUND_ALARM_TASK = 'BACKGROUND_ALARM_TASK';
const BATTERY_CHECK_TASK = 'BATTERY_CHECK_TASK';
const ROUTINE_CHECK_TASK = 'ROUTINE_CHECK_TASK';

export class NotificationService {
  static async initialize() {
    if (Platform.OS === 'web') return;

    // Request permissions
    await this.requestPermissions();
    
    // Register background tasks
    await this.registerBackgroundTasks();
    
    // Set up notification listeners
    this.setupNotificationListeners();
  }

  static async requestPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permissions not granted');
      return false;
    }
    return true;
  }

  static async registerBackgroundTasks() {
    try {
      // Register alarm task
      TaskManager.defineTask(BACKGROUND_ALARM_TASK, ({ data, error }) => {
        if (error) {
          console.error('Background alarm task error:', error);
          return;
        }
        if (data) {
          this.handleAlarmTrigger(data.type, data.message);
        }
      });

      // Register battery check task
      TaskManager.defineTask(BATTERY_CHECK_TASK, async ({ data, error }) => {
        if (error) {
          console.error('Battery check task error:', error);
          return;
        }
        await this.checkBatteryStatus();
      });

      // Register routine check task
      TaskManager.defineTask(ROUTINE_CHECK_TASK, async ({ data, error }) => {
        if (error) {
          console.error('Routine check task error:', error);
          return;
        }
        await this.checkRoutineAlerts();
      });

      // Start background fetch
      await BackgroundFetch.registerTaskAsync(BATTERY_CHECK_TASK, {
        minimumInterval: 15 * 60, // 15 minutes
        stopOnTerminate: false,
        startOnBoot: true,
      });

      await BackgroundFetch.registerTaskAsync(ROUTINE_CHECK_TASK, {
        minimumInterval: 30 * 60, // 30 minutes
        stopOnTerminate: false,
        startOnBoot: true,
      });
    } catch (error) {
      console.error('Error registering background tasks:', error);
    }
  }

  static setupNotificationListeners() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Handle notification interactions
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response.notification);
      // Handle navigation to appropriate screen
    });
  }

  static async scheduleMorningAlarm(userProfile: UserProfile) {
    if (!userProfile.wakeUpTime) return;

    const [hours, minutes] = userProfile.wakeUpTime.split(':').map(Number);
    const now = new Date();
    const alarmTime = new Date();
    alarmTime.setHours(hours, minutes, 0, 0);

    // If alarm time has passed, schedule for tomorrow
    if (alarmTime <= now) {
      alarmTime.setDate(alarmTime.getDate() + 1);
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Good morning, ${userProfile.username}!`,
        body: `Your usual leave time is ${userProfile.leaveHomeTime}`,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        categoryIdentifier: 'morning-alarm',
      },
      trigger: {
        date: alarmTime,
        repeats: true,
      },
    });
  }

  static async scheduleReminder(title: string, description: string, date: string, time: string) {
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    
    const reminderTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
    
    // Don't schedule if time is in the past
    if (reminderTime <= new Date()) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body: description || 'You have a reminder',
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
      },
      trigger: {
        date: reminderTime,
      },
    });
  }

  static async checkBatteryStatus() {
    try {
      const userProfile = await StorageService.getUserProfile();
      if (!userProfile || !userProfile.minBatteryPercent) return;

      // Get battery level (this would require a battery API)
      // For now, we'll simulate this
      const batteryLevel = 0.35; // 35%
      
      if (batteryLevel * 100 < userProfile.minBatteryPercent) {
        // Check if it's close to leave time
        const now = new Date();
        const [leaveHours, leaveMinutes] = userProfile.leaveHomeTime.split(':').map(Number);
        const leaveTime = new Date();
        leaveTime.setHours(leaveHours, leaveMinutes, 0, 0);
        
        const timeDiff = leaveTime.getTime() - now.getTime();
        const minutesDiff = timeDiff / (1000 * 60);
        
        if (minutesDiff > 0 && minutesDiff <= 30) {
          await this.triggerAlarm('battery', 'Battery is too low for leaving home. Please charge your phone.');
        }
      }
    } catch (error) {
      console.error('Error checking battery status:', error);
    }
  }

  static async checkRoutineAlerts() {
    try {
      const userProfile = await StorageService.getUserProfile();
      if (!userProfile) return;

      const now = new Date();
      const [leaveHours, leaveMinutes] = userProfile.leaveHomeTime.split(':').map(Number);
      const leaveTime = new Date();
      leaveTime.setHours(leaveHours, leaveMinutes, 0, 0);
      
      const timeDiff = leaveTime.getTime() - now.getTime();
      const minutesDiff = timeDiff / (1000 * 60);
      
      // Alert 10 minutes before leaving
      if (minutesDiff > 0 && minutesDiff <= 10) {
        await this.sendNotification({
          title: 'Time to Leave Soon',
          body: `You usually leave at ${userProfile.leaveHomeTime}. Don't forget your essentials!`,
          sound: 'default',
        });
      }
      
      // Check for forgotten items
      if (minutesDiff > 0 && minutesDiff <= 5) {
        const forgottenItems = userProfile.forgottenItems || [];
        if (forgottenItems.length > 0) {
          await this.sendNotification({
            title: 'Before You Leave',
            body: `Quick check: ${forgottenItems.slice(0, 3).join(', ')}`,
            sound: 'default',
          });
        }
      }
    } catch (error) {
      console.error('Error checking routine alerts:', error);
    }
  }

  static async triggerAlarm(type: 'morning' | 'battery' | 'phone' | 'reminder', message?: string) {
    await this.sendNotification({
      title: type === 'morning' ? 'Wake Up Alarm' : type === 'battery' ? 'Battery Alert' : 'Alert',
      body: message || 'Important alert from e-Butler',
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.HIGH,
      categoryIdentifier: 'alarm',
    });

    // Also trigger vibration
    if (Platform.OS !== 'web') {
      // This would need to be handled in the app when the notification is received
    }
  }

  static async sendNotification({ title, body, sound = 'default', priority = Notifications.AndroidNotificationPriority.DEFAULT }) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound,
        priority,
      },
      trigger: null, // Show immediately
    });
  }

  static async scheduleBirthdayReminder(contactName: string, birthday: string) {
    const [year, month, day] = birthday.split('-').map(Number);
    const reminderDate = new Date(year, month - 1, day - 1, 20, 0, 0, 0); // Day before at 8 PM
    
    if (reminderDate <= new Date()) {
      reminderDate.setFullYear(reminderDate.getFullYear() + 1);
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Birthday Reminder',
        body: `Tomorrow is ${contactName}'s birthday!`,
        sound: 'default',
      },
      trigger: {
        date: reminderDate,
        repeats: true,
      },
    });
  }

  static async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  static async getScheduledNotifications() {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  private static handleAlarmTrigger(type: string, message: string) {
    console.log(`Alarm triggered: ${type} - ${message}`);
    // Handle alarm trigger in background
  }
}

export default NotificationService;