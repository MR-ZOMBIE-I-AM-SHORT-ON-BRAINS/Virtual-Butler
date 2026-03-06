import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { Platform } from 'react-native';
import { NotificationService } from './notifications';
import { StorageService } from './storage';

const BACKGROUND_SYNC_TASK = 'BACKGROUND_SYNC_TASK';
const LOCATION_TRACK_TASK = 'LOCATION_TRACK_TASK';

export class BackgroundTaskService {
  static async initialize() {
    if (Platform.OS === 'web') return;

    await this.registerTasks();
    await this.startBackgroundTasks();
  }

  static async registerTasks() {
    // Background sync task
    TaskManager.defineTask(BACKGROUND_SYNC_TASK, async ({ data, error }) => {
      if (error) {
        console.error('Background sync task error:', error);
        return;
      }
      
      try {
        await this.performBackgroundSync();
      } catch (syncError) {
        console.error('Background sync failed:', syncError);
      }
      
      return BackgroundFetch.BackgroundFetchResult.NewData;
    });

    // Location tracking task
    TaskManager.defineTask(LOCATION_TRACK_TASK, async ({ data, error }) => {
      if (error) {
        console.error('Location track task error:', error);
        return;
      }
      
      try {
        await this.trackLocation(data);
      } catch (locationError) {
        console.error('Location tracking failed:', locationError);
      }
      
      return BackgroundFetch.BackgroundFetchResult.NewData;
    });
  }

  static async startBackgroundTasks() {
    try {
      // Start background sync
      await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
        minimumInterval: 60 * 60, // 1 hour
        stopOnTerminate: false,
        startOnBoot: true,
      });

      console.log('Background tasks registered successfully');
    } catch (error) {
      console.error('Error starting background tasks:', error);
    }
  }

  static async performBackgroundSync() {
    try {
      // Sync any pending data
      const userProfile = await StorageService.getUserProfile();
      
      if (userProfile) {
        // Check for routine alerts
        await NotificationService.checkRoutineAlerts();
        
        // Check battery status
        await NotificationService.checkBatteryStatus();
        
        // Update analytics
        await this.updateAnalytics();
      }
      
      console.log('Background sync completed');
    } catch (error) {
      console.error('Background sync error:', error);
    }
  }

  static async trackLocation(data: any) {
    // This would integrate with location services
    // For now, we'll simulate location tracking
    console.log('Location tracking:', data);
    
    // Could check if user is leaving a known location
    // and trigger "Did you forget anything?" notifications
  }

  static async updateAnalytics() {
    try {
      const analytics = await StorageService.getAnalytics();
      
      if (!analytics) {
        // Initialize analytics if not exists
        const initialAnalytics = {
          forgottenItemsCount: 0,
          wakeUpConsistency: 85,
          mostContactedPerson: 'None',
          routineScore: 75,
          weeklyReport: {
            weekStart: new Date().toISOString(),
            forgottenItems: [],
            wakeUpTimes: [],
            interactions: [],
          },
          monthlyReport: {
            month: new Date().toISOString(),
            mostForgottenItems: [],
            mostContactedPeople: [],
          },
        };
        
        await StorageService.saveAnalytics(initialAnalytics);
      }
    } catch (error) {
      console.error('Error updating analytics:', error);
    }
  }

  static async stopAllTasks() {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
      await BackgroundFetch.unregisterTaskAsync(LOCATION_TRACK_TASK);
      console.log('Background tasks stopped');
    } catch (error) {
      console.error('Error stopping background tasks:', error);
    }
  }
}

export default BackgroundTaskService;