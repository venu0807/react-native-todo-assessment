import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import {Colors} from '../theme/colors';

export type FilterType = 'all' | 'active' | 'completed';

export interface FilterTabsProps {
  active: FilterType;
  onChange: (filter: FilterType) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

interface TabItem {
  key: FilterType;
  label: string;
}

const TABS: TabItem[] = [
  {key: 'all', label: 'All'},
  {key: 'active', label: 'Active'},
  {key: 'completed', label: 'Done'},
];

export const FilterTabs: React.FC<FilterTabsProps> = ({
  active,
  onChange,
  style,
  testID = 'filter-tabs',
}) => {
  return (
    <View style={[styles.container, style]} testID={testID}>
      {TABS.map(tab => {
        const isActive = active === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={[styles.tab, isActive && styles.activeTab]}
            testID={`${testID}-${tab.key}`}
            accessibilityRole="tab"
            accessibilityState={{selected: isActive}}
            accessibilityLabel={`${tab.label} tasks`}
            activeOpacity={0.7}>
            <Text
              style={[styles.tabText, isActive && styles.activeTabText]}
              testID={`${testID}-${tab.key}-text`}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.cardElevated,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: Colors.accent,
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.white,
    fontWeight: '700',
  },
});

export default FilterTabs;
