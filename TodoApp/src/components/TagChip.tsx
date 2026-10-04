import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
  TouchableOpacity,
} from 'react-native';
import {Colors} from '../theme/colors';

export interface TagChipProps {
  label: string;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  testID?: string;
}

export const TagChip: React.FC<TagChipProps> = ({
  label,
  style,
  onPress,
  testID = 'tag-chip',
}) => {
  const formattedLabel = label.startsWith('#') ? label : `#${label}`;

  const content = (
    <Text style={styles.text} testID={`${testID}-text`}>
      {formattedLabel}
    </Text>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        testID={testID}
        onPress={onPress}
        activeOpacity={0.7}
        style={[styles.container, style]}
        accessibilityRole="button"
        accessibilityLabel={`Tag ${formattedLabel}`}>
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View
      testID={testID}
      style={[styles.container, style]}
      accessibilityRole="text"
      accessibilityLabel={`Tag ${formattedLabel}`}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(233, 69, 96, 0.15)',
    borderColor: 'rgba(255, 107, 129, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    color: Colors.accentSoft,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

export default TagChip;
