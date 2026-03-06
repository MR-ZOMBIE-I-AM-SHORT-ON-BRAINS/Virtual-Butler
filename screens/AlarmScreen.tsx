import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Vibration,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { StorageService, UserProfile } from '../lib/storage';
import { Colors } from '../constants/Colors';
import * as Notifications from 'expo-notifications';

const { width, height } = Dimensions.get('window');

interface AlarmScreenProps {
  route?: {
    params?: {
      type?: 'morning' | 'battery' | 'phone' | 'reminder';
      message?: string;
    };
  };
}

const AlarmScreen: React.FC<AlarmScreenProps> = ({ route }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  
  const [alarmType, setAlarmType] = useState<'morning' | 'battery' | 'phone' | 'reminder'>('morning');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isRinging, setIsRinging] = useState(true);
  const [snoozeCount, setSnoozeCount] = useState(0);
  const scaleAnim = new Animated.Value(1);

  useEffect(() => {
    const type = route?.params?.type || 'morning';
    setAlarmType(type);
    
    loadUserProfile();
    startAlarmAnimation();
    
    // Vibrate when alarm starts
    Vibration.vibrate([500, 500, 500, 500, 500], true);
    
    return () => {
      Vibration.cancel();
    };
  }, [route?.params]);

  const loadUserProfile = async () => {
    try {
      const profile = await StorageService.getUserProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const startAlarmAnimation = () => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
  };

  const handleStopAlarm = () => {
    Vibration.cancel();
    setIsRinging(false);
    
    // Navigate back or handle alarm dismissal
    if (alarmType === 'morning') {
      // Record wake up time
      console.log('User woke up at:', new Date().toISOString());
    }
  };

  const handleSnooze = () => {
    if (snoozeCount >= 3) {
      Alert.alert('Maximum Snoozes', 'You have already snoozed 3 times!');
      return;
    }
    
    Vibration.cancel();
    setSnoozeCount(snoozeCount + 1);
    
    // Schedule snooze for 5 minutes
    setTimeout(() => {
      setIsRinging(true);
      Vibration.vibrate([500, 500, 500, 500, 500], true);
    }, 5 * 60 * 1000);
  };

  const getAlarmContent = () => {
    switch (alarmType) {
      case 'morning':
        return {
          icon: 'sunny-outline',
          title: `Good morning, ${userProfile?.username || 'User'}!`,
          subtitle: `Your usual leave time is ${userProfile?.leaveHomeTime || '08:00'}`,
          color: colors.warning,
        };
      
      case 'battery':
        return {
          icon: 'battery-dead-outline',
          title: 'Battery Alert!',
          subtitle: 'Battery is too low for leaving home. Please charge your phone.',
          color: colors.error,
        };
      
      case 'phone':
        return {
          icon: 'phone-portrait-outline',
          title: 'Phone Alert!',
          subtitle: 'Are you leaving without your phone?',
          color: colors.error,
        };
      
      case 'reminder':
        return {
          icon: 'notifications-outline',
          title: 'Reminder!',
          subtitle: route?.params?.message || 'You have an important reminder.',
          color: colors.primary,
        };
      
      default:
        return {
          icon: 'alarm-outline',
          title: 'Alarm!',
          subtitle: 'Time to wake up!',
          color: colors.primary,
        };
    }
  };

  const alarmContent = getAlarmContent();

  if (!isRinging && alarmType !== 'morning') {
    // Auto-dismiss for non-morning alarms
    setTimeout(() => {
      // Auto navigate back
    }, 2000);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View
        style={[
          styles.alarmContainer,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={[styles.alarmIcon, { backgroundColor: alarmContent.color }]}>
          <Ionicons name={alarmContent.icon as keyof typeof Ionicons.glyphMap} size={80} color={colors.background} />
        </View>
        
        <Text style={[styles.alarmTitle, { color: colors.text }]}>
          {alarmContent.title}
        </Text>
        
        <Text style={[styles.alarmSubtitle, { color: colors.textSecondary }]}>
          {alarmContent.subtitle}
        </Text>
        
        <Text style={[styles.currentTime, { color: colors.text }]}>
          {new Date().toLocaleTimeString()}
        </Text>
      </Animated.View>

      <View style={styles.buttonContainer}>
        {alarmType === 'morning' && snoozeCount < 3 && (
          <TouchableOpacity
            style={[styles.snoozeButton, { backgroundColor: colors.secondary }]}
            onPress={handleSnooze}
          >
            <Ionicons name="time-outline" size={24} color={colors.background} />
            <Text style={[styles.snoozeText, { color: colors.background }]}>
              {snoozeCount > 0 ? `Snooze (${3 - snoozeCount} left)` : '5 more minutes'}
            </Text>
          </TouchableOpacity>
        )}
        
        {alarmType === 'phone' && (
          <TouchableOpacity
            style={[styles.phoneButton, { backgroundColor: colors.success }]}
            onPress={handleStopAlarm}
          >
            <Ionicons name="checkmark-outline" size={24} color={colors.background} />
            <Text style={[styles.phoneButtonText, { color: colors.background }]}>
              I have my device
            </Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.stopButton, { backgroundColor: colors.error }]}
          onPress={handleStopAlarm}
        >
          <Ionicons name="stop-outline" size={24} color={colors.background} />
          <Text style={[styles.stopText, { color: colors.background }]}>
            {alarmType === 'phone' ? 'Stop alarm' : "I'm awake"}
          </Text>
        </TouchableOpacity>
        
        {alarmType === 'morning' && (
          <TouchableOpacity
            style={[styles.skipButton, { borderColor: colors.border }]}
            onPress={() => {
              Vibration.cancel();
              // Skip today's routine
            }}
          >
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>
              Skip today
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Wake verification for morning alarm */}
      {alarmType === 'morning' && (
        <View style={styles.verificationContainer}>
          <Text style={[styles.verificationText, { color: colors.textSecondary }]}>
            Tap the button above to confirm you're awake
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  alarmContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  alarmIcon: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  alarmTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  alarmSubtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  currentTime: {
    fontSize: 48,
    fontWeight: '300',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  snoozeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 16,
    gap: 10,
  },
  snoozeText: {
    fontSize: 18,
    fontWeight: '600',
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 16,
    gap: 10,
  },
  phoneButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 16,
    gap: 10,
  },
  stopText: {
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  verificationContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  verificationText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default AlarmScreen;
