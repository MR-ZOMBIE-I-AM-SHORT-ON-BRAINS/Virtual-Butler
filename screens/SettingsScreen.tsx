import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { StorageService, UserProfile } from '../lib/storage';
import { Colors } from '../constants/Colors';

const SettingsScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState(true);
  const [alarmSounds, setAlarmSounds] = useState(true);
  const [locationTracking, setLocationTracking] = useState(false);
  const [callTracking, setCallTracking] = useState(true);
  const [batteryAlerts, setBatteryAlerts] = useState(true);
  const [smartReminders, setSmartReminders] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const profile = await StorageService.getUserProfile();
      setUserProfile(profile);
      
      const settings = await Promise.all([
        StorageService.getSetting('notifications'),
        StorageService.getSetting('alarmSounds'),
        StorageService.getSetting('locationTracking'),
        StorageService.getSetting('callTracking'),
        StorageService.getSetting('batteryAlerts'),
        StorageService.getSetting('smartReminders'),
      ]);
      
      setNotifications(settings[0] ?? true);
      setAlarmSounds(settings[1] ?? true);
      setLocationTracking(settings[2] ?? false);
      setCallTracking(settings[3] ?? true);
      setBatteryAlerts(settings[4] ?? true);
      setSmartReminders(settings[5] ?? true);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    try {
      await StorageService.saveSetting(key, value);
    } catch (error) {
      console.error('Error saving setting:', error);
    }
  };

  const handleResetOnboarding = async () => {
    Alert.alert(
      'Reset Onboarding',
      'This will clear all your data and take you back to the setup screen. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.clearAllData();
              Alert.alert(
                'Reset Complete',
                'All data has been cleared. Please restart the app to set up again.'
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to reset data');
            }
          },
        },
      ]
    );
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    value,
    onToggle,
    onPress,
    type = 'toggle',
  }: any) => (
    <TouchableOpacity
      style={[styles.settingItem, { backgroundColor: colors.card }]}
      onPress={onPress}
      disabled={type === 'toggle'}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, { backgroundColor: colors.primary }]}>
          <Ionicons name={icon} size={20} color={colors.background} />
        </View>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {type === 'toggle' && (
        <Switch
          value={value}
          onValueChange={(newValue) => {
            onToggle(newValue);
          }}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.background}
        />
      )}
      {type === 'arrow' && (
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Profile Section */}
      {userProfile && (
        <View style={[styles.profileSection, { backgroundColor: colors.card }]}>
          <View style={styles.profileHeader}>
            <View style={[styles.profileAvatar, { backgroundColor: colors.butlerPrimary }]}>
              <Ionicons name="person-outline" size={32} color={colors.background} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>
                {userProfile.username}
              </Text>
              <Text style={[styles.profileDetails, { color: colors.textSecondary }]}>
                {userProfile.profession} • Age {userProfile.age}
              </Text>
            </View>
          </View>
          
          <View style={styles.profileStats}>
            <View style={styles.profileStat}>
              <Text style={[styles.profileStatValue, { color: colors.primary }]}>
                {userProfile.wakeUpTime}
              </Text>
              <Text style={[styles.profileStatLabel, { color: colors.textSecondary }]}>
                Wake Up
              </Text>
            </View>
            <View style={styles.profileStat}>
              <Text style={[styles.profileStatValue, { color: colors.primary }]}>
                {userProfile.leaveHomeTime}
              </Text>
              <Text style={[styles.profileStatLabel, { color: colors.textSecondary }]}>
                Leave Home
              </Text>
            </View>
            <View style={styles.profileStat}>
              <Text style={[styles.profileStatValue, { color: colors.primary }]}>
                {userProfile.minBatteryPercent}%
              </Text>
              <Text style={[styles.profileStatLabel, { color: colors.textSecondary }]}>
                Min Battery
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
        
        <SettingItem
          icon="notifications-outline"
          title="Push Notifications"
          subtitle="Receive notifications for reminders and alerts"
          value={notifications}
          onToggle={(value) => {
            setNotifications(value);
            updateSetting('notifications', value);
          }}
        />
        
        <SettingItem
          icon="volume-high-outline"
          title="Alarm Sounds"
          subtitle="Play sounds for alarms and urgent alerts"
          value={alarmSounds}
          onToggle={(value) => {
            setAlarmSounds(value);
            updateSetting('alarmSounds', value);
          }}
        />
        
        <SettingItem
          icon="battery-charging-outline"
          title="Battery Alerts"
          subtitle="Alert when battery is low before leaving"
          value={batteryAlerts}
          onToggle={(value) => {
            setBatteryAlerts(value);
            updateSetting('batteryAlerts', value);
          }}
        />
      </View>

      {/* Tracking Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Tracking</Text>
        
        <SettingItem
          icon="location-outline"
          title="Location Tracking"
          subtitle="Track common locations for smart reminders"
          value={locationTracking}
          onToggle={(value) => {
            setLocationTracking(value);
            updateSetting('locationTracking', value);
          }}
        />
        
        <SettingItem
          icon="call-outline"
          title="Call Tracking"
          subtitle="Track call interactions for insights"
          value={callTracking}
          onToggle={(value) => {
            setCallTracking(value);
            updateSetting('callTracking', value);
          }}
        />
      </View>

      {/* Smart Features */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Smart Features</Text>
        
        <SettingItem
          icon="bulb-outline"
          title="Smart Reminders"
          subtitle="AI-powered reminder suggestions"
          value={smartReminders}
          onToggle={(value) => {
            setSmartReminders(value);
            updateSetting('smartReminders', value);
          }}
        />
      </View>

      {/* App Info Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
        
        <SettingItem
          icon="information-circle-outline"
          title="App Version"
          subtitle="e-Butler v1.0.0"
          type="arrow"
        />
        
        <SettingItem
          icon="shield-checkmark-outline"
          title="Privacy Policy"
          subtitle="How we protect your data"
          type="arrow"
          onPress={() => {
            Alert.alert(
              'Privacy Policy',
              'e-Butler stores all data locally on your device. We do not collect or transmit any personal information to external servers. Your privacy is our priority.'
            );
          }}
        />
        
        <SettingItem
          icon="help-circle-outline"
          title="Help & Support"
          subtitle="Get help with the app"
          type="arrow"
          onPress={() => {
            Alert.alert(
              'Help & Support',
              'For support, please check the app documentation or contact our support team. e-Butler is designed to work offline and store all data locally on your device.'
            );
          }}
        />
      </View>

      {/* Danger Zone */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Data Management</Text>
        
        <TouchableOpacity
          style={[styles.dangerButton, { backgroundColor: colors.error }]}
          onPress={handleResetOnboarding}
        >
          <Ionicons name="refresh-outline" size={20} color={colors.background} />
          <Text style={[styles.dangerButtonText, { color: colors.background }]}>
            Reset All Data
          </Text>
        </TouchableOpacity>
        
        <Text style={[styles.dangerWarning, { color: colors.textSecondary }]}>
          This will permanently delete all your data and settings
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  profileSection: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  profileDetails: {
    fontSize: 14,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  profileStat: {
    alignItems: 'center',
  },
  profileStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  profileStatLabel: {
    fontSize: 12,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2.22,
    elevation: 3,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    gap: 8,
    marginBottom: 10,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dangerWarning: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default SettingsScreen;
