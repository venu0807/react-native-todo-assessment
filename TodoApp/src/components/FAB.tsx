import React, {useEffect} from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import {Colors} from '../theme/colors';

export interface FABProps {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
}

export const FAB: React.FC<FABProps> = ({
  onPress,
  style,
  testID = 'fab',
  accessibilityLabel = 'Add new task',
}) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.08, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
    return () => {
      cancelAnimation(scale);
    };
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  return (
    <Animated.View
      style={[styles.floatingContainer, animatedStyle, style]}
      testID={`${testID}-container`}>
      <TouchableOpacity
        testID={testID}
        onPress={onPress}
        activeOpacity={0.85}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}>
        <Text style={styles.icon} testID={`${testID}-icon`}>
          +
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    zIndex: 999,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: Colors.accent,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  icon: {
    color: Colors.white,
    fontSize: 32,
    fontWeight: '300',
    lineHeight: 34,
    textAlign: 'center',
    marginTop: -2,
  },
});

export default FAB;
