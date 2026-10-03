import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Colors} from '../theme/colors';
import type {AppStackScreenProps} from '../navigation/types';

export const HomeScreen: React.FC<AppStackScreenProps<'Home'>> = () => {
  return (
    <View style={styles.container} testID="home-screen">
      <Text style={styles.title}>Home Tasks</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
