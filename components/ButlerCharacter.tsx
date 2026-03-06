import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';

interface ButlerCharacterProps {
  size?: number;
  mood?: 'happy' | 'thinking' | 'sleeping' | 'alert' | 'waving';
  animated?: boolean;
}

const ButlerCharacter: React.FC<ButlerCharacterProps> = ({
  size = 80,
  mood = 'happy',
  animated = true,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!animated) return;

    const animate = () => {
      switch (mood) {
        case 'happy':
          Animated.sequence([
            Animated.timing(bounceAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(bounceAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]).start(animate);
          break;
        
        case 'waving':
          Animated.loop(
            Animated.sequence([
              Animated.timing(rotateAnim, {
                toValue: 0.2,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.timing(rotateAnim, {
                toValue: -0.2,
                duration: 200,
                useNativeDriver: true,
              }),
            ])
          ).start();
          break;
        
        case 'thinking':
          Animated.loop(
            Animated.sequence([
              Animated.timing(scaleAnim, {
                toValue: 1.1,
                duration: 1500,
                useNativeDriver: true,
              }),
              Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 1500,
                useNativeDriver: true,
              }),
            ])
          ).start();
          break;
        
        case 'alert':
          Animated.loop(
            Animated.sequence([
              Animated.timing(scaleAnim, {
                toValue: 1.2,
                duration: 500,
                useNativeDriver: true,
              }),
              Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
              }),
            ])
          ).start();
          break;
        
        case 'sleeping':
          Animated.loop(
            Animated.sequence([
              Animated.timing(bounceAnim, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: true,
              }),
              Animated.timing(bounceAnim, {
                toValue: 0,
                duration: 2000,
                useNativeDriver: true,
              }),
            ])
          ).start();
          break;
      }
    };

    animate();
  }, [mood, animated]);

  const getButlerIcon = () => {
    switch (mood) {
      case 'happy':
        return 'happy-outline';
      case 'thinking':
        return 'help-circle-outline';
      case 'sleeping':
        return 'moon-outline';
      case 'alert':
        return 'alert-circle-outline';
      case 'waving':
        return 'hand-left-outline';
      default:
        return 'happy-outline';
    }
  };

  const getButlerColor = () => {
    switch (mood) {
      case 'alert':
        return colors.error;
      case 'thinking':
        return colors.secondary;
      default:
        return colors.butlerPrimary;
    }
  };

  const bounceTransform = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.butlerContainer,
          {
            transform: [
              { translateY: bounceTransform },
              { rotate: rotateAnim.interpolate({
                inputRange: [-1, 1],
                outputRange: ['-10deg', '10deg'],
              })},
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        <View
          style={[
            styles.butlerBody,
            {
              width: size * 0.8,
              height: size * 0.8,
              backgroundColor: getButlerColor(),
            },
          ]}
        >
          <Ionicons
            name={getButlerIcon()}
            size={size * 0.4}
            color={colors.background}
          />
        </View>
        
        {/* Butler hat */}
        <View
          style={[
            styles.butlerHat,
            {
              width: size * 0.6,
              height: size * 0.2,
              backgroundColor: colors.butlerSecondary,
              top: -size * 0.1,
            },
          ]}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  butlerContainer: {
    position: 'relative',
  },
  butlerBody: {
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  butlerHat: {
    position: 'absolute',
    left: '20%',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
});

export default ButlerCharacter;
