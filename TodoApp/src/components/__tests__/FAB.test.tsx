import React from 'react';
import renderer from 'react-test-renderer';
import {describe, it, expect, jest, beforeEach, afterEach} from '@jest/globals';
import {FAB} from '../FAB';
import {Colors} from '../../theme/colors';

describe('FAB Component', () => {
  let tree: renderer.ReactTestRenderer | null = null;

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    if (tree) {
      tree.unmount();
      tree = null;
    }
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('renders floating action button with + icon', () => {
    const onPressMock = jest.fn();
    tree = renderer.create(<FAB onPress={onPressMock} />);
    const root = tree.root;

    const iconNode = root.findByProps({testID: 'fab-icon'});
    expect(iconNode.props.children).toBe('+');
  });

  it('has Colors.accent background and elevation 8', () => {
    const onPressMock = jest.fn();
    tree = renderer.create(<FAB onPress={onPressMock} />);
    const root = tree.root;

    const buttonNode = root.findByProps({testID: 'fab'});
    expect(buttonNode.props.style).toEqual(
      expect.objectContaining({
        backgroundColor: Colors.accent,
        elevation: 8,
      }),
    );
  });

  it('fires onPress callback when pressed', () => {
    const onPressMock = jest.fn();
    tree = renderer.create(<FAB onPress={onPressMock} />);
    const root = tree.root;

    const buttonNode = root.findByProps({testID: 'fab'});
    buttonNode.props.onPress();
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('supports custom testID, accessibilityLabel, and custom style', () => {
    const onPressMock = jest.fn();
    const customStyle = {bottom: 50};
    tree = renderer.create(
      <FAB
        onPress={onPressMock}
        testID="custom-fab"
        accessibilityLabel="Create item"
        style={customStyle}
      />,
    );
    const root = tree.root;

    const containerNode = root.findByProps({testID: 'custom-fab-container'});
    expect(containerNode.props.style).toEqual(
      expect.arrayContaining([customStyle]),
    );

    const buttonNode = root.findByProps({testID: 'custom-fab'});
    expect(buttonNode.props.accessibilityLabel).toBe('Create item');
  });
});
