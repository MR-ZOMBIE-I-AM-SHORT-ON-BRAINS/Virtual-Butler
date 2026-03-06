import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { StorageService, Reminder } from '../lib/storage';
import { Colors } from '../constants/Colors';

const RemindersScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    type: 'custom' as Reminder['type'],
  });

  const reminderTypes = [
    { value: 'meeting', label: 'Meeting', icon: 'people-outline' },
    { value: 'birthday', label: 'Birthday', icon: 'gift-outline' },
    { value: 'deadline', label: 'Deadline', icon: 'alert-circle-outline' },
    { value: 'custom', label: 'Custom', icon: 'notifications-outline' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userReminders = await StorageService.getReminders();
      setReminders(userReminders);
    } catch (error) {
      console.error('Error loading reminders:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddReminder = async () => {
    if (!newReminder.title.trim() || !newReminder.date || !newReminder.time) {
      Alert.alert('Error', 'Please fill in title, date, and time');
      return;
    }

    try {
      const reminder: Reminder = {
        id: Date.now().toString(),
        title: newReminder.title.trim(),
        description: newReminder.description.trim(),
        date: newReminder.date,
        time: newReminder.time,
        type: newReminder.type,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      await StorageService.saveReminder(reminder);
      setNewReminder({
        title: '',
        description: '',
        date: '',
        time: '',
        type: 'custom',
      });
      setShowAddModal(false);
      loadData();
      Alert.alert('Success', 'Reminder added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add reminder');
    }
  };

  const toggleReminder = async (id: string, isActive: boolean) => {
    try {
      await StorageService.updateReminder(id, { isActive });
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update reminder');
    }
  };

  const deleteReminder = async (id: string) => {
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to delete this reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.deleteReminder(id);
              loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete reminder');
            }
          },
        },
      ]
    );
  };

  const getReminderIcon = (type: Reminder['type']) => {
    const typeInfo = reminderTypes.find(t => t.value === type);
    return typeInfo?.icon || 'notifications-outline';
  };

  const getReminderColor = (type: Reminder['type']) => {
    switch (type) {
      case 'meeting':
        return colors.primary;
      case 'birthday':
        return colors.success;
      case 'deadline':
        return colors.error;
      default:
        return colors.secondary;
    }
  };

  const formatDateTime = (date: string, time: string) => {
    const reminderDate = new Date(`${date} ${time}`);
    const now = new Date();
    const diffTime = reminderDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Today at ${time}`;
    } else if (diffDays === 1) {
      return `Tomorrow at ${time}`;
    } else if (diffDays === -1) {
      return `Yesterday at ${time}`;
    } else if (diffDays > 1 && diffDays <= 7) {
      return `In ${diffDays} days at ${time}`;
    } else {
      return `${date} at ${time}`;
    }
  };

  const getTodayReminders = () => {
    const today = new Date().toISOString().split('T')[0];
    return reminders.filter(r => r.date === today && r.isActive);
  };

  const getUpcomingReminders = () => {
    const now = new Date();
    return reminders
      .filter(r => {
        const reminderDate = new Date(`${r.date} ${r.time}`);
        return r.isActive && reminderDate > now;
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });
  };

  const renderReminder = ({ item }: { item: Reminder }) => (
    <View style={[styles.reminderCard, { backgroundColor: colors.card }]}>
      <View style={styles.reminderHeader}>
        <View style={styles.reminderInfo}>
          <View style={[styles.reminderIcon, { backgroundColor: getReminderColor(item.type) }]}>
            <Ionicons name={getReminderIcon(item.type)} size={20} color={colors.background} />
          </View>
          <View style={styles.reminderDetails}>
            <Text style={[styles.reminderTitle, { color: colors.text }]}>
              {item.title}
            </Text>
            {item.description && (
              <Text style={[styles.reminderDescription, { color: colors.textSecondary }]}>
                {item.description}
              </Text>
            )}
            <Text style={[styles.reminderDateTime, { color: colors.textSecondary }]}>
              {formatDateTime(item.date, item.time)}
            </Text>
          </View>
        </View>
        <View style={styles.reminderActions}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              {
                backgroundColor: item.isActive ? colors.success : colors.border,
              },
            ]}
            onPress={() => toggleReminder(item.id, !item.isActive)}
          >
            <Ionicons
              name={item.isActive ? 'checkmark' : 'close'}
              size={16}
              color={item.isActive ? colors.background : colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: colors.error }]}
            onPress={() => deleteReminder(item.id)}
          >
            <Ionicons name="trash-outline" size={16} color={colors.background} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const todayReminders = getTodayReminders();
  const upcomingReminders = getUpcomingReminders();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Add Reminder Button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={20} color={colors.background} />
          <Text style={[styles.addButtonText, { color: colors.background }]}>Add Reminder</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Today's Reminders */}
        {todayReminders.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Today ({todayReminders.length})
            </Text>
            {todayReminders.map((reminder) => (
              <View key={reminder.id}>
                {renderReminder({ item: reminder })}
              </View>
            ))}
          </View>
        )}

        {/* Upcoming Reminders */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Upcoming ({upcomingReminders.length})
          </Text>
          {upcomingReminders.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No upcoming reminders
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Add a reminder to get started
              </Text>
            </View>
          ) : (
            upcomingReminders.map((reminder) => (
              <View key={reminder.id}>
                {renderReminder({ item: reminder })}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Reminder Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Add New Reminder
            </Text>
            
            <Text style={[styles.label, { color: colors.text }]}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
              {reminderTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeOption,
                    {
                      backgroundColor: newReminder.type === type.value
                        ? colors.primary
                        : colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setNewReminder(prev => ({ ...prev, type: type.value as Reminder['type'] }))}
                >
                  <Ionicons
                    name={type.icon as keyof typeof Ionicons.glyphMap}
                    size={20}
                    color={newReminder.type === type.value ? colors.background : colors.text}
                  />
                  <Text
                    style={[
                      styles.typeText,
                      {
                        color: newReminder.type === type.value
                          ? colors.background
                          : colors.text,
                      },
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.label, { color: colors.text }]}>Title</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="Reminder title"
              placeholderTextColor={colors.textSecondary}
              value={newReminder.title}
              onChangeText={(text) => setNewReminder(prev => ({ ...prev, title: text }))}
            />

            <Text style={[styles.label, { color: colors.text }]}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.border }]}
              placeholder="Add more details..."
              placeholderTextColor={colors.textSecondary}
              value={newReminder.description}
              onChangeText={(text) => setNewReminder(prev => ({ ...prev, description: text }))}
              multiline
            />

            <Text style={[styles.label, { color: colors.text }]}>Date</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textSecondary}
              value={newReminder.date}
              onChangeText={(text) => setNewReminder(prev => ({ ...prev, date: text }))}
            />

            <Text style={[styles.label, { color: colors.text }]}>Time</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="HH:MM"
              placeholderTextColor={colors.textSecondary}
              value={newReminder.time}
              onChangeText={(text) => setNewReminder(prev => ({ ...prev, time: text }))}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => {
                  setShowAddModal(false);
                  setNewReminder({
                    title: '',
                    description: '',
                    date: '',
                    time: '',
                    type: 'custom',
                  });
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, { backgroundColor: colors.primary }]}
                onPress={handleAddReminder}
              >
                <Text style={[styles.modalButtonText, { color: colors.background }]}>Add Reminder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  reminderCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2.22,
    elevation: 3,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reminderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reminderDetails: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  reminderDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  reminderDateTime: {
    fontSize: 12,
  },
  reminderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    padding: 25,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  typeScroll: {
    marginBottom: 20,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 10,
    gap: 8,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  confirmButton: {
    flex: 2,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RemindersScreen;
