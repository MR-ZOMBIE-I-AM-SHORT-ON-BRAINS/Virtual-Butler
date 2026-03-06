import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import ButlerCharacter from '../components/ButlerCharacter';
import { StorageService, UserProfile } from '../lib/storage';
import { Colors } from '../constants/Colors';

const { width, height } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState<Partial<UserProfile>>({
    forgottenItems: ['Wallet', 'Charger', 'Keys'],
  });

  const professions = [
    'Student',
    'Corporate Professional',
    'Freelancer',
    'Business Owner',
    'Government Employee',
    'Homemaker',
    'Other',
  ];

  const weeklyOffDays = [
    'Saturday',
    'Sunday',
    'Custom',
    'Random / irregular schedule',
  ];

  const commonForgottenItems = [
    'Wallet',
    'Charger',
    'Keys',
    'Laptop',
    'ID card',
    'Water bottle',
    'Earphones',
    'Documents',
  ];

  const handleNext = () => {
    if (currentStep < 9) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      const profile: UserProfile = {
        username: userData.username || 'User',
        age: userData.age || 25,
        profession: userData.profession || 'Other',
        wakeUpTime: userData.wakeUpTime || '07:00',
        leaveHomeTime: userData.leaveHomeTime || '08:00',
        workStartTime: userData.workStartTime || '09:00',
        weeklyOffDay: userData.weeklyOffDay || 'Sunday',
        minBatteryPercent: userData.minBatteryPercent || 40,
        emergencyContact: userData.emergencyContact,
        forgottenItems: userData.forgottenItems || [],
        createdAt: new Date().toISOString(),
      };

      await StorageService.saveUserProfile(profile);
      onComplete();
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
  };

  const toggleForgottenItem = (item: string) => {
    setUserData(prev => ({
      ...prev,
      forgottenItems: prev.forgottenItems?.includes(item)
        ? prev.forgottenItems.filter(i => i !== item)
        : [...(prev.forgottenItems || []), item],
    }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Welcome to e-Butler!</Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
              Your personal AI assistant that helps manage your daily life intelligently.
            </Text>
            <View style={styles.butlerContainer}>
              <ButlerCharacter size={120} mood="waving" />
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>What's your name?</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="Enter your name"
              placeholderTextColor={colors.textSecondary}
              value={userData.username}
              onChangeText={(text) => setUserData(prev => ({ ...prev, username: text }))}
            />
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>How old are you?</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="Enter your age"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={userData.age?.toString()}
              onChangeText={(text) => setUserData(prev => ({ ...prev, age: parseInt(text) || 0 }))}
            />
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>What's your profession?</Text>
            <ScrollView style={styles.optionsContainer}>
              {professions.map((profession) => (
                <TouchableOpacity
                  key={profession}
                  style={[
                    styles.option,
                    {
                      backgroundColor: userData.profession === profession ? colors.primary : colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setUserData(prev => ({ ...prev, profession }))}
                >
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: userData.profession === profession ? colors.background : colors.text,
                      },
                    ]}
                  >
                    {profession}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>When do you usually wake up?</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="e.g., 07:00"
              placeholderTextColor={colors.textSecondary}
              value={userData.wakeUpTime}
              onChangeText={(text) => setUserData(prev => ({ ...prev, wakeUpTime: text }))}
            />
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>When do you usually leave home?</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="e.g., 08:00"
              placeholderTextColor={colors.textSecondary}
              value={userData.leaveHomeTime}
              onChangeText={(text) => setUserData(prev => ({ ...prev, leaveHomeTime: text }))}
            />
          </View>
        );

      case 6:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>When does your work/school start?</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="e.g., 09:00"
              placeholderTextColor={colors.textSecondary}
              value={userData.workStartTime}
              onChangeText={(text) => setUserData(prev => ({ ...prev, workStartTime: text }))}
            />
          </View>
        );

      case 7:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>What's your weekly off day?</Text>
            <ScrollView style={styles.optionsContainer}>
              {weeklyOffDays.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.option,
                    {
                      backgroundColor: userData.weeklyOffDay === day ? colors.primary : colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setUserData(prev => ({ ...prev, weeklyOffDay: day }))}
                >
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: userData.weeklyOffDay === day ? colors.background : colors.text,
                      },
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 8:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Minimum battery % before leaving?</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="e.g., 40"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={userData.minBatteryPercent?.toString()}
              onChangeText={(text) => setUserData(prev => ({ ...prev, minBatteryPercent: parseInt(text) || 40 }))}
            />
            <Text style={[styles.helperText, { color: colors.textSecondary }]}>
              We'll alert you if battery is below this level when it's time to leave
            </Text>
          </View>
        );

      case 9:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Items you often forget?</Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
              Select items you frequently forget to take with you
            </Text>
            <ScrollView style={styles.optionsContainer}>
              {commonForgottenItems.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.option,
                    {
                      backgroundColor: userData.forgottenItems?.includes(item) ? colors.primary : colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => toggleForgottenItem(item)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: userData.forgottenItems?.includes(item) ? colors.background : colors.text,
                      },
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${((currentStep + 1) / 10) * 100}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            Step {currentStep + 1} of 10
          </Text>
        </View>

        {renderStep()}

        <View style={styles.buttonContainer}>
          {currentStep > 0 && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton, { borderColor: colors.border }]}
              onPress={handlePrevious}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>Previous</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={handleNext}
          >
            <Text style={[styles.buttonText, { color: colors.background }]}>
              {currentStep === 9 ? 'Complete' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
  },
  progressContainer: {
    marginBottom: 40,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    minHeight: height * 0.5,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  stepDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  butlerContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
  },
  helperText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: -10,
    marginBottom: 20,
  },
  optionsContainer: {
    maxHeight: 300,
  },
  option: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  optionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    flex: currentStep === 0 ? 1 : 2,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OnboardingScreen;
