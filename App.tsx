import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Platform } from 'react-native';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Notifications from 'expo-notifications';

import AppNavigator from './navigation/AppNavigator';
import { NotificationService } from './lib/notifications';

// Configure notifications\nNotifications.setNotificationHandler({\n  handleNotification: async () => ({\n    shouldShowAlert: true,\n    shouldPlaySound: true,\n    shouldSetBadge: true,\n  }),\n});\n\nexport default function App() {\n  // Preload icon fonts for web - required for icons to display correctly\n  const [fontsLoaded] = useFonts({\n    ...Ionicons.font,\n  });\n\n  useEffect(() => {\n    // Initialize notification service\n    if (Platform.OS !== 'web') {\n      NotificationService.initialize();\n    }\n  }, []);\n\n  if (!fontsLoaded) {\n    return (\n      <View style={styles.loadingContainer}>\n        <StatusBar style=\"auto\" />\n      </View>\n    );\n  }\n\n  return (\n    <View style={styles.container}>\n      <AppNavigator />\n      <StatusBar style=\"auto\" />\n    </View>\n  );\n}\n\nconst styles = StyleSheet.create({\n  container: {\n    flex: 1,\n    backgroundColor: '#fff',\n  },\n  loadingContainer: {\n    flex: 1,\n    backgroundColor: '#fff',\n  },\n});
