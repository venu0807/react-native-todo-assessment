import React from 'react';
import {View, Text, StyleSheet, ViewStyle, StyleProp} from 'react-native';
import {Priority} from '../types';
import {Colors} from '../theme/colors';

export interface PriorityBadgeProps {
  priority: Priority;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const PRIORITY_COLOR_MAP: Record<Priority, string> = {
  high: Colors.danger,
  medium: Colors.warning,
  low: Colors.success,
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  style,
  testID = 'priority-badge',
}) => {
  const color = PRIORITY_COLOR_MAP[priority] || Colors.success;
  const label = priority ? priority.toUpperCase() : 'LOW';

  return (
    <View
      style={[
        styles.badge,
        {
          borderColor: `${color}4D`,
          backgroundColor: `${color}1A`,
        },
        style,
      ]}
      testID={testID}
      accessibilityRole="text"
      accessibilityLabel={`Priority ${priority}`}>
      <View
        style={[styles.dot, {backgroundColor: color}]}
        testID={`${testID}-dot`}
      />
      <Text style={[styles.label, {color}]} testID={`${testID}-label`}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default PriorityBadge;
