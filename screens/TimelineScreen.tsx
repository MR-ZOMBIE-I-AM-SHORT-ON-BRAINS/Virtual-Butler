import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { StorageService, UserProfile, Reminder, CallInteraction } from '../lib/storage';
import { Colors } from '../constants/Colors';

interface TimelineEvent {
  id: string;
  type: 'reminder' | 'call' | 'routine' | 'alert';
  title: string;
  description: string;
  time: string;
  timestamp: Date;
  icon: keyof typeof Ionicons.glyphMap;
}

const TimelineScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    try {
      const profile = await StorageService.getUserProfile();
      const reminders = await StorageService.getReminders();
      const callInteractions = await StorageService.getCallInteractions();
      
      setUserProfile(profile);
      
      const timelineEvents: TimelineEvent[] = [];
      
      // Add routine events
      if (profile) {
        timelineEvents.push({
          id: 'wake-up',
          type: 'routine',
          title: 'Wake Up Time',
          description: `Your usual wake up time is ${profile.wakeUpTime}`,
          time: profile.wakeUpTime,
          timestamp: new Date(`${selectedDate.toISOString().split('T')[0]} ${profile.wakeUpTime}`),
          icon: 'sunny-outline',
        });
        
        timelineEvents.push({
          id: 'leave-home',
          type: 'routine',
          title: 'Leave Home',
          description: `Usually leave home at ${profile.leaveHomeTime}`,
          time: profile.leaveHomeTime,
          timestamp: new Date(`${selectedDate.toISOString().split('T')[0]} ${profile.leaveHomeTime}`),
          icon: 'walk-outline',
        });
        
        timelineEvents.push({
          id: 'work-start',
          type: 'routine',
          title: 'Work/School Start',
          description: `Your ${profile.profession.toLowerCase()} starts at ${profile.workStartTime}`,
          time: profile.workStartTime,
          timestamp: new Date(`${selectedDate.toISOString().split('T')[0]} ${profile.workStartTime}`),
          icon: 'briefcase-outline',
        });
      }
      
      // Add reminders for today
      const todayReminders = reminders.filter(reminder => {
        const reminderDate = new Date(reminder.date);
        return reminderDate.toDateString() === selectedDate.toDateString() && reminder.isActive;
      });
      
      todayReminders.forEach(reminder => {
        timelineEvents.push({
          id: reminder.id,
          type: 'reminder',
          title: reminder.title,
          description: reminder.description || 'Reminder',
          time: reminder.time,
          timestamp: new Date(`${reminder.date} ${reminder.time}`),
          icon: 'notifications-outline',
        });
      });
      
      // Add recent calls
      const todayCalls = callInteractions.filter(call => {
        const callDate = new Date(call.timestamp);
        return callDate.toDateString() === selectedDate.toDateString();
      });
      
      todayCalls.forEach(call => {
        timelineEvents.push({
          id: call.id,
          type: 'call',
          title: `Call with ${call.contactName}`,
          description: `${call.type} - ${Math.floor(call.duration / 60)}m ${call.duration % 60}s`,
          time: new Date(call.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date(call.timestamp),
          icon: call.type === 'missed' ? 'call-missed' : 'call-outline',
        });
      });
      
      // Sort events by time
      const sortedEvents = timelineEvents.sort((a, b) => 
        a.timestamp.getTime() - b.timestamp.getTime()
      );
      
      setEvents(sortedEvents);
    } catch (error) {
      console.error('Error loading timeline data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getEventColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'reminder':
        return colors.primary;
      case 'call':
        return colors.success;
      case 'routine':
        return colors.secondary;
      case 'alert':
        return colors.error;
      default:
        return colors.text;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Date Selector */}
      <View style={[styles.dateSelector, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => {
            const yesterday = new Date(selectedDate);
            yesterday.setDate(yesterday.getDate() - 1);
            setSelectedDate(yesterday);
          }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        
        <Text style={[styles.selectedDate, { color: colors.text }]}>
          {selectedDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
        
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => {
            const tomorrow = new Date(selectedDate);
            tomorrow.setDate(tomorrow.getDate() + 1);
            setSelectedDate(tomorrow);
          }}
        >
          <Ionicons name="chevron-forward" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Timeline */}
      <ScrollView
        style={styles.timeline}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {events.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No events scheduled for this day
            </Text>
          </View>
        ) : (
          events.map((event, index) => (
            <View key={event.id} style={styles.eventContainer}>
              {/* Timeline Line */}
              {index < events.length - 1 && (
                <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
              )}
              
              {/* Event */}
              <View style={styles.eventRow}>
                <View style={[styles.eventIconContainer, { backgroundColor: getEventColor(event.type) }]}>
                  <Ionicons name={event.icon} size={20} color={colors.background} />
                </View>
                
                <View style={[styles.eventContent, { backgroundColor: colors.card }]}>
                  <View style={styles.eventHeader}>
                    <Text style={[styles.eventTitle, { color: colors.text }]}>
                      {event.title}
                    </Text>
                    <Text style={[styles.eventTime, { color: colors.textSecondary }]}>
                      {formatTime(event.timestamp)}
                    </Text>
                  </View>
                  <Text style={[styles.eventDescription, { color: colors.textSecondary }]}>
                    {event.description}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    margin: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dateButton: {
    padding: 8,
  },
  selectedDate: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  timeline: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
  eventContainer: {
    marginBottom: 20,
  },
  timelineLine: {
    width: 2,
    marginLeft: 19,
    height: 40,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  eventIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  eventContent: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2.22,
    elevation: 3,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 10,
  },
  eventTime: {
    fontSize: 14,
  },
  eventDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default TimelineScreen;
