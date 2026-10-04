import React from 'react';
import {StyleSheet} from 'react-native';
import renderer from 'react-test-renderer';
import {describe, it, expect, jest} from '@jest/globals';
import {TagChip} from '../TagChip';
import {Colors} from '../../theme/colors';

describe('TagChip Component', () => {
  it('renders tag label with prepended # if not present', () => {
    const tree = renderer.create(<TagChip label="productivity" />);
    const root = tree.root;

    const textNode = root.findByProps({testID: 'tag-chip-text'});
    expect(textNode.props.children).toBe('#productivity');
  });

  it('does not duplicate # if already provided in label', () => {
    const tree = renderer.create(<TagChip label="#urgent" />);
    const root = tree.root;

    const textNode = root.findByProps({testID: 'tag-chip-text'});
    expect(textNode.props.children).toBe('#urgent');
  });

  it('renders with soft accent color text', () => {
    const tree = renderer.create(<TagChip label="feature" />);
    const root = tree.root;

    const textNode = root.findByProps({testID: 'tag-chip-text'});
    expect(textNode.props.style).toEqual(
      expect.objectContaining({color: Colors.accentSoft}),
    );
  });

  it('renders as non-pressable view when onPress is not provided', () => {
    const tree = renderer.create(<TagChip label="design" />);
    const root = tree.root;

    const containerNode = root.findByProps({testID: 'tag-chip'});
    expect(containerNode.props.accessibilityRole).toBe('text');
    expect(containerNode.props.onPress).toBeUndefined();
  });

  it('fires onPress callback when clicked if onPress is provided', () => {
    const onPressMock = jest.fn();
    const tree = renderer.create(<TagChip label="bug" onPress={onPressMock} />);
    const root = tree.root;

    const buttonNode = root.findByProps({testID: 'tag-chip'});
    expect(buttonNode.props.accessibilityRole).toBe('button');
    buttonNode.props.onPress();
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('supports custom testID and custom styles', () => {
    const customStyle = {marginRight: 15};
    const tree = renderer.create(
      <TagChip label="custom" testID="custom-tag" style={customStyle} />,
    );
    const root = tree.root;

    const container = root.findByProps({testID: 'custom-tag'});
    expect(container).toBeDefined();
    expect(StyleSheet.flatten(container.props.style)).toMatchObject(
      customStyle,
    );

    const text = root.findByProps({testID: 'custom-tag-text'});
    expect(text.props.children).toBe('#custom');
  });
});
