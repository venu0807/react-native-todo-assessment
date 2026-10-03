/**
 * @format
 */

import 'react-native';
import React from 'react';
import App from '../App';
import {it, expect, beforeEach, afterEach, jest} from '@jest/globals';
import renderer, {act} from 'react-test-renderer';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

it('renders correctly', async () => {
  let tree: renderer.ReactTestRenderer | undefined;
  await act(async () => {
    tree = renderer.create(<App />);
    jest.runOnlyPendingTimers();
  });
  expect(tree).toBeDefined();
});
