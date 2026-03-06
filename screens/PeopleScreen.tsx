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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { StorageService, CallInteraction } from '../lib/storage';
import { Colors } from '../constants/Colors';

const PeopleScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  
  const [callInteractions, setCallInteractions] = useState<CallInteraction[]>([]);
  const [filteredInteractions, setFilteredInteractions] = useState<CallInteraction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '' });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterInteractions();
  }, [callInteractions, searchQuery]);

  const loadData = async () => {
    try {
      const interactions = await StorageService.getCallInteractions();
      setCallInteractions(interactions);
    } catch (error) {
      console.error('Error loading call interactions:', error);
    }
  };

  const filterInteractions = () => {
    if (!searchQuery) {
      setFilteredInteractions(callInteractions);
    } else {
      const filtered = callInteractions.filter(interaction =>
        interaction.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        interaction.phoneNumber.includes(searchQuery)
      );
      setFilteredInteractions(filtered);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getInteractionStats = () => {
    const contactStats: { [key: string]: { count: number; totalDuration: number; lastCall: string } } = {};
    
    callInteractions.forEach(interaction => {
      if (!contactStats[interaction.contactName]) {
        contactStats[interaction.contactName] = {
          count: 0,
          totalDuration: 0,
          lastCall: interaction.timestamp,
        };
      }
      contactStats[interaction.contactName].count++;
      contactStats[interaction.contactName].totalDuration += interaction.duration;
      if (new Date(interaction.timestamp) > new Date(contactStats[interaction.contactName].lastCall)) {
        contactStats[interaction.contactName].lastCall = interaction.timestamp;
      }
    });
    
    return Object.entries(contactStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.count - a.count);
  };

  const getCallIcon = (type: string) => {
    switch (type) {
      case 'incoming':
        return 'call-outline';
      case 'outgoing':
        return 'call-outline';
      case 'missed':
        return 'call-missed';
      default:
        return 'call-outline';
    }
  };

  const getCallColor = (type: string) => {
    switch (type) {
      case 'missed':
        return colors.error;
      case 'incoming':
        return colors.success;
      case 'outgoing':
        return colors.primary;
      default:
        return colors.text;
    }
  };

  const renderCallItem = ({ item }: { item: CallInteraction }) => (
    <View style={[styles.callItem, { backgroundColor: colors.card }]}>
      <View style={styles.callHeader}>
        <View style={styles.callInfo}>
          <View style={[styles.callIconContainer, { backgroundColor: getCallColor(item.type) }]}>
            <Ionicons name={getCallIcon(item.type)} size={20} color={colors.background} />
          </View>
          <View style={styles.contactInfo}>
            <Text style={[styles.contactName, { color: colors.text }]}>
              {item.contactName}
            </Text>
            <Text style={[styles.phoneNumber, { color: colors.textSecondary }]}>
              {item.phoneNumber}
            </Text>
          </View>
        </View>
        <View style={styles.callDetails}>
          <Text style={[styles.callDuration, { color: colors.textSecondary }]}>
            {formatDuration(item.duration)}
          </Text>
          <Text style={[styles.callTime, { color: colors.textSecondary }]}>
            {formatDate(item.timestamp)}
          </Text>
        </View>
      </View>
    </View>
  );

  const contactStats = getInteractionStats();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search contacts or phone numbers..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Contact Stats Summary */}
      {contactStats.length > 0 && (
        <View style={styles.statsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Most Contacted</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
            {contactStats.slice(0, 5).map((contact, index) => (
              <View key={contact.name} style={[styles.statCard, { backgroundColor: colors.card }]}>
                <View style={[styles.rankBadge, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.rankText, { color: colors.background }]}>{index + 1}</Text>
                </View>
                <Text style={[styles.statName, { color: colors.text }]}>{contact.name}</Text>
                <Text style={[styles.statCount, { color: colors.textSecondary }]}>
                  {contact.count} calls
                </Text>
                <Text style={[styles.statDuration, { color: colors.textSecondary }]}>
                  {formatDuration(contact.totalDuration)}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Call History */}
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Recent Calls ({filteredInteractions.length})
        </Text>
        <FlatList
          data={filteredInteractions}
          renderItem={renderCallItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="call-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {searchQuery ? 'No calls found matching your search' : 'No call history available'}
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  statsScroll: {
    flexDirection: 'row',
  },
  statCard: {
    width: 120,
    padding: 15,
    borderRadius: 12,
    marginRight: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'relative',
  },
  rankBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
    textAlign: 'center',
  },
  statCount: {
    fontSize: 12,
    marginBottom: 2,
  },
  statDuration: {
    fontSize: 12,
  },
  sectionContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  callItem: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2.22,
    elevation: 3,
  },
  callHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  callInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  callIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  phoneNumber: {
    fontSize: 14,
  },
  callDetails: {
    alignItems: 'flex-end',
  },
  callDuration: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  callTime: {
    fontSize: 12,
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
});

export default PeopleScreen;
