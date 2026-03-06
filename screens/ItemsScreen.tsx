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
import { StorageService, ItemLocation, UserProfile } from '../lib/storage';
import { Colors } from '../constants/Colors';

const ItemsScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  
  const [itemLocations, setItemLocations] = useState<ItemLocation[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [newItem, setNewItem] = useState({ itemName: '', location: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [forgottenToday, setForgottenToday] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const locations = await StorageService.getItemLocations();
      const profile = await StorageService.getUserProfile();
      
      setItemLocations(locations);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading items data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddItem = async () => {
    if (!newItem.itemName.trim() || !newItem.location.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const itemLocation: ItemLocation = {
        id: Date.now().toString(),
        itemName: newItem.itemName.trim(),
        location: newItem.location.trim(),
        createdAt: new Date().toISOString(),
      };

      await StorageService.saveItemLocation(itemLocation);
      setNewItem({ itemName: '', location: '' });
      setShowAddModal(false);
      loadData();
      Alert.alert('Success', 'Item location saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save item location');
    }
  };

  const handleDeleteItem = async (id: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item location?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.deleteItemLocation(id);
              loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  const searchItem = () => {
    const found = itemLocations.find(
      item => item.itemName.toLowerCase() === searchQuery.toLowerCase()
    );
    
    if (found) {
      Alert.alert(
        'Item Found!',
        `${found.itemName} is located at: ${found.location}`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Item Not Found',
        `No location saved for "${searchQuery}"`,
        [
          { text: 'OK' },
          {
            text: 'Add Location',
            onPress: () => {
              setNewItem({ itemName: searchQuery, location: '' });
              setShowSearchModal(false);
              setShowAddModal(true);
            },
          },
        ]
      );
    }
  };

  const toggleForgottenItem = (item: string) => {
    setForgottenToday(prev => 
      prev.includes(item) 
        ? prev.filter(i => i !== item)
        : [...prev, item]
    );
  };

  const recordForgottenItems = async () => {
    if (forgottenToday.length === 0) {
      Alert.alert('Info', 'No items selected');
      return;
    }

    // Here you would save this to analytics
    Alert.alert(
      'Recorded',
      `Recorded ${forgottenToday.length} forgotten item(s). We'll help you remember them better next time!`
    );
    setForgottenToday([]);
  };

  const renderItemLocation = ({ item }: { item: ItemLocation }) => (
    <View style={[styles.itemCard, { backgroundColor: colors.card }]}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <View style={[styles.itemIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name="cube-outline" size={24} color={colors.background} />
          </View>
          <View style={styles.itemDetails}>
            <Text style={[styles.itemName, { color: colors.text }]}>
              {item.itemName}
            </Text>
            <Text style={[styles.itemLocation, { color: colors.textSecondary }]}>
              {item.location}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: colors.error }]}
          onPress={() => handleDeleteItem(item.id)}
        >
          <Ionicons name="trash-outline" size={16} color={colors.background} />
        </TouchableOpacity>
      </View>
      <Text style={[styles.itemDate, { color: colors.textSecondary }]}>
        Added {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowSearchModal(true)}
        >
          <Ionicons name="search" size={20} color={colors.background} />
          <Text style={[styles.actionButtonText, { color: colors.background }]}>
            Find Item
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.success }]}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={20} color={colors.background} />
          <Text style={[styles.actionButtonText, { color: colors.background }]}>
            Add Item
          </Text>
        </TouchableOpacity>
      </View>

      {/* Forgotten Items Tracker */}
      {userProfile?.forgottenItems && userProfile.forgottenItems.length > 0 && (
        <View style={[styles.forgottenSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Did you forget anything today?
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forgottenScroll}>
            {userProfile.forgottenItems.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.forgottenItem,
                  {
                    backgroundColor: forgottenToday.includes(item)
                      ? colors.error
                      : colors.background,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => toggleForgottenItem(item)}
              >
                <Text
                  style={[
                    styles.forgottenItemText,
                    {
                      color: forgottenToday.includes(item)
                        ? colors.background
                        : colors.text,
                    },
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {forgottenToday.length > 0 && (
            <TouchableOpacity
              style={[styles.recordButton, { backgroundColor: colors.primary }]}
              onPress={recordForgottenItems}
            >
              <Text style={[styles.recordButtonText, { color: colors.background }]}>
                Record {forgottenToday.length} Forgotten Item(s)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Item Locations List */}
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Saved Item Locations ({itemLocations.length})
        </Text>
        <FlatList
          data={itemLocations}
          renderItem={renderItemLocation}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No item locations saved yet
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Add your first item location to get started
              </Text>
            </View>
          }
        />
      </View>

      {/* Search Modal */}
      <Modal
        visible={showSearchModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSearchModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Where is my item?
            </Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="Enter item name..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => {
                  setShowSearchModal(false);
                  setSearchQuery('');
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, { backgroundColor: colors.primary }]}
                onPress={searchItem}
              >
                <Text style={[styles.modalButtonText, { color: colors.background }]}>Search</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Item Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Add Item Location
            </Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="Item name (e.g., Wallet)"
              placeholderTextColor={colors.textSecondary}
              value={newItem.itemName}
              onChangeText={(text) => setNewItem(prev => ({ ...prev, itemName: text }))}
            />
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="Location (e.g., Desk drawer)"
              placeholderTextColor={colors.textSecondary}
              value={newItem.location}
              onChangeText={(text) => setNewItem(prev => ({ ...prev, location: text }))}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => {
                  setShowAddModal(false);
                  setNewItem({ itemName: '', location: '' });
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, { backgroundColor: colors.primary }]}
                onPress={handleAddItem}
              >
                <Text style={[styles.modalButtonText, { color: colors.background }]}>Save</Text>
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
  quickActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  forgottenSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  forgottenScroll: {
    marginBottom: 15,
  },
  forgottenItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
  },
  forgottenItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  recordButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  recordButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  itemCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2.22,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemLocation: {
    fontSize: 14,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDate: {
    fontSize: 12,
    marginTop: 10,
    fontStyle: 'italic',
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
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
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

export default ItemsScreen;
