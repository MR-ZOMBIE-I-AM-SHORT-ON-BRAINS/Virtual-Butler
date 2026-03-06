import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import ButlerCharacter from '../components/ButlerCharacter';
import { StorageService, UserProfile, Reminder } from '../lib/storage';
import { Colors } from '../constants/Colors';
import { StackNavigationProp } from '@react-navigation/native-stack';

const { width, height } = Dimensions.get('window');

type HomeScreenNavigationProp = StackNavigationProp<any, any>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [currentMood, setCurrentMood] = useState<'happy' | 'thinking' | 'alert' | 'waving'>('happy');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    updateButlerMood();
  }, [currentTime, userProfile, reminders]);

  const loadData = async () => {
    try {
      const profile = await StorageService.getUserProfile();
      const userReminders = await StorageService.getReminders();
      
      setUserProfile(profile);
      setReminders(userReminders);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const updateButlerMood = () => {
    const hour = currentTime.getHours();
    
    if (hour >= 6 && hour < 12) {
      setCurrentMood('waving');
    } else if (hour >= 12 && hour < 17) {
      setCurrentMood('happy');
    } else if (hour >= 17 && hour < 22) {
      setCurrentMood('thinking');
    } else {
      setCurrentMood('sleeping');
    }

    // Check for urgent reminders
    const urgentReminders = reminders.filter(r => {
      const reminderTime = new Date(`${r.date} ${r.time}`);
      const timeDiff = reminderTime.getTime() - currentTime.getTime();
      return timeDiff > 0 && timeDiff < 2 * 60 * 60 * 1000; // Within 2 hours
    });

    if (urgentReminders.length > 0) {
      setCurrentMood('alert');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getNextReminder = () => {
    const activeReminders = reminders.filter(r => r.isActive);
    const sortedReminders = activeReminders.sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`);
      const dateB = new Date(`${b.date} ${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });

    return sortedReminders.find(r => {
      const reminderTime = new Date(`${r.date} ${r.time}`);
      return reminderTime.getTime() > currentTime.getTime();
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const nextReminder = getNextReminder();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header with Butler */}
      <View style={styles.header}>
        <View style={styles.greetingContainer}>
          <Text style={[styles.greeting, { color: colors.text }]}>
            {getGreeting()}, {userProfile?.username || 'User'}!
          </Text>
          <Text style={[styles.time, { color: colors.textSecondary }]}>
            {currentTime.toLocaleTimeString()}
          </Text>
        </View>
        <ButlerCharacter size={80} mood={currentMood} />
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Ionicons name="notifications-outline" size={24} color={colors.primary} />
          <Text style={[styles.statNumber, { color: colors.text }]}>
            {reminders.filter(r => r.isActive).length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active Reminders</Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Ionicons name="briefcase-outline" size={24} color={colors.primary} />
          <Text style={[styles.statNumber, { color: colors.text }]}>
            {userProfile?.forgottenItems?.length || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Tracked Items</Text>
        </View>
      </View>

      {/* Next Reminder Card */}
      {nextReminder && (
        <TouchableOpacity
          style={[styles.nextReminderCard, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate('Reminders')}
        >
          <View style={styles.reminderHeader}>
            <Ionicons name="time-outline" size={20} color={colors.primary} />
            <Text style={[styles.reminderTitle, { color: colors.text }]}>Next Reminder</Text>
          </View>
          <Text style={[styles.reminderName, { color: colors.text }]}>
            {nextReminder.title}
          </Text>
          <Text style={[styles.reminderTime, { color: colors.textSecondary }]}>
            {nextReminder.date} at {formatTime(nextReminder.time)}
          </Text>
        </TouchableOpacity>
      )}

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('Items')}
          >
            <Ionicons name="help-circle-outline" size={32} color={colors.primary} />
            <Text style={[styles.actionTitle, { color: colors.text }]}>Where is my item?</Text>
            <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
              Find your belongings
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('Reminders')}
          >
            <Ionicons name="add-circle-outline" size={32} color={colors.primary} />
            <Text style={[styles.actionTitle, { color: colors.text }]}>Add Reminder</Text>
            <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
              Set a new reminder
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('People')}
          >
            <Ionicons name="call-outline" size={32} color={colors.primary} />
            <Text style={[styles.actionTitle, { color: colors.text }]}>Recent Calls</Text>
            <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
              View call history
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('Timeline')}
          >
            <Ionicons name="calendar-outline" size={32} color={colors.primary} />
            <Text style={[styles.actionTitle, { color: colors.text }]}>Timeline</Text>
            <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
              View your day
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Butler Message */}
      <View style={[styles.messageCard, { backgroundColor: colors.butlerPrimary }]}>
        <Text style={[styles.messageText, { color: colors.background }]}>
          {currentMood === 'waving' && `Ready to start your day, ${userProfile?.username || 'User'}?`}
          {currentMood === 'happy' && "Hope your day is going well!"}
          {currentMood === 'thinking' && "Don't forget to take breaks and stay hydrated."}
          {currentMood === 'sleeping' && "Time to rest soon. Have a peaceful evening!"}
          {currentMood === 'alert' && "You have upcoming reminders. Stay prepared!"}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  time: {
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 15,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  nextReminderCard: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  reminderName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  reminderTime: {
    fontSize: 14,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  actionCard: {
    width: (width - 55) / 2,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 5,
    textAlign: 'center',
  },
  actionDescription: {
    fontSize: 12,
    textAlign: 'center',
  },
  messageCard: {
    marginHorizontal: 20,
    marginVertical: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
});

export default HomeScreen;
