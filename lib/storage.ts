import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  username: string;
  age: number;
  profession: string;
  wakeUpTime: string;
  leaveHomeTime: string;
  workStartTime: string;
  weeklyOffDay: string;
  minBatteryPercent: number;
  emergencyContact?: {
    name: string;
    phone: string;
  };
  forgottenItems: string[];
  createdAt: string;
}

export interface ItemLocation {
  id: string;
  itemName: string;
  location: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  type: 'meeting' | 'birthday' | 'deadline' | 'custom';
  isActive: boolean;
  createdAt: string;
}

export interface CallInteraction {
  id: string;
  contactName: string;
  phoneNumber: string;
  duration: number;
  timestamp: string;
  type: 'incoming' | 'outgoing' | 'missed';
}

export interface Analytics {
  forgottenItemsCount: number;
  wakeUpConsistency: number;
  mostContactedPerson: string;
  routineScore: number;
  weeklyReport: {
    weekStart: string;
    forgottenItems: string[];
    wakeUpTimes: string[];
    interactions: CallInteraction[];
  };
  monthlyReport: {
    month: string;
    mostForgottenItems: { item: string; count: number }[];
    mostContactedPeople: { person: string; count: number }[];
  };
}

class StorageService {
  private static instance: StorageService;

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // User Profile
  async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      await SecureStore.setItemAsync('userProfile', JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving user profile:', error);
      throw error;
    }
  }

  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const profile = await SecureStore.getItemAsync('userProfile');
      return profile ? JSON.parse(profile) : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  // Item Locations
  async saveItemLocation(itemLocation: ItemLocation): Promise<void> {
    try {
      const existing = await this.getItemLocations();
      const updated = [...existing, itemLocation];
      await AsyncStorage.setItem('itemLocations', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving item location:', error);
      throw error;
    }
  }

  async getItemLocations(): Promise<ItemLocation[]> {
    try {
      const locations = await AsyncStorage.getItem('itemLocations');
      return locations ? JSON.parse(locations) : [];
    } catch (error) {
      console.error('Error getting item locations:', error);
      return [];
    }
  }

  async deleteItemLocation(id: string): Promise<void> {
    try {
      const existing = await this.getItemLocations();
      const updated = existing.filter(item => item.id !== id);
      await AsyncStorage.setItem('itemLocations', JSON.stringify(updated));
    } catch (error) {
      console.error('Error deleting item location:', error);
      throw error;
    }
  }

  // Reminders
  async saveReminder(reminder: Reminder): Promise<void> {
    try {
      const existing = await this.getReminders();
      const updated = [...existing, reminder];
      await AsyncStorage.setItem('reminders', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving reminder:', error);
      throw error;
    }
  }

  async getReminders(): Promise<Reminder[]> {
    try {
      const reminders = await AsyncStorage.getItem('reminders');
      return reminders ? JSON.parse(reminders) : [];
    } catch (error) {
      console.error('Error getting reminders:', error);
      return [];
    }
  }

  async updateReminder(id: string, updates: Partial<Reminder>): Promise<void> {
    try {
      const existing = await this.getReminders();
      const updated = existing.map(reminder => 
        reminder.id === id ? { ...reminder, ...updates } : reminder
      );
      await AsyncStorage.setItem('reminders', JSON.stringify(updated));
    } catch (error) {
      console.error('Error updating reminder:', error);
      throw error;
    }
  }

  async deleteReminder(id: string): Promise<void> {
    try {
      const existing = await this.getReminders();
      const updated = existing.filter(reminder => reminder.id !== id);
      await AsyncStorage.setItem('reminders', JSON.stringify(updated));
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw error;
    }
  }

  // Call Interactions
  async saveCallInteraction(interaction: CallInteraction): Promise<void> {
    try {
      const existing = await this.getCallInteractions();
      const updated = [...existing, interaction];
      await AsyncStorage.setItem('callInteractions', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving call interaction:', error);
      throw error;
    }
  }

  async getCallInteractions(): Promise<CallInteraction[]> {
    try {
      const interactions = await AsyncStorage.getItem('callInteractions');
      return interactions ? JSON.parse(interactions) : [];
    } catch (error) {
      console.error('Error getting call interactions:', error);
      return [];
    }
  }

  // Analytics
  async saveAnalytics(analytics: Analytics): Promise<void> {
    try {
      await AsyncStorage.setItem('analytics', JSON.stringify(analytics));
    } catch (error) {
      console.error('Error saving analytics:', error);
      throw error;
    }
  }

  async getAnalytics(): Promise<Analytics | null> {
    try {
      const analytics = await AsyncStorage.getItem('analytics');
      return analytics ? JSON.parse(analytics) : null;
    } catch (error) {
      console.error('Error getting analytics:', error);
      return null;
    }
  }

  // Settings
  async saveSetting(key: string, value: any): Promise<void> {
    try {
      await AsyncStorage.setItem(`setting_${key}`, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving setting:', error);
      throw error;
    }
  }

  async getSetting(key: string): Promise<any> {
    try {
      const setting = await AsyncStorage.getItem(`setting_${key}`);
      return setting ? JSON.parse(setting) : null;
    } catch (error) {
      console.error('Error getting setting:', error);
      return null;
    }
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('userProfile');
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }
}

export const StorageService = StorageService.getInstance();
