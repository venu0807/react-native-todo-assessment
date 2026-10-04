import React from 'react';
import {StyleSheet} from 'react-native';
import renderer from 'react-test-renderer';
import {describe, it, expect} from '@jest/globals';
import {PriorityBadge, PRIORITY_COLOR_MAP} from '../PriorityBadge';
import {Colors} from '../../theme/colors';

describe('PriorityBadge Component', () => {
  it('renders high priority badge with danger color and label', () => {
    const tree = renderer.create(<PriorityBadge priority="high" />);
    const root = tree.root;

    const labelNode = root.findByProps({testID: 'priority-badge-label'});
    expect(labelNode.props.children).toBe('HIGH');
    expect(labelNode.props.style).toEqual(
      expect.arrayContaining([{color: Colors.danger}]),
    );

    const dotNode = root.findByProps({testID: 'priority-badge-dot'});
    expect(dotNode.props.style).toEqual(
      expect.arrayContaining([{backgroundColor: Colors.danger}]),
    );

    const badgeNode = root.findByProps({testID: 'priority-badge'});
    expect(badgeNode.props.accessibilityLabel).toBe('Priority high');
  });

  it('renders medium priority badge with warning color and label', () => {
    const tree = renderer.create(<PriorityBadge priority="medium" />);
    const root = tree.root;

    const labelNode = root.findByProps({testID: 'priority-badge-label'});
    expect(labelNode.props.children).toBe('MEDIUM');
    expect(labelNode.props.style).toEqual(
      expect.arrayContaining([{color: Colors.warning}]),
    );

    const dotNode = root.findByProps({testID: 'priority-badge-dot'});
    expect(dotNode.props.style).toEqual(
      expect.arrayContaining([{backgroundColor: Colors.warning}]),
    );
  });

  it('renders low priority badge with success color and label', () => {
    const tree = renderer.create(<PriorityBadge priority="low" />);
    const root = tree.root;

    const labelNode = root.findByProps({testID: 'priority-badge-label'});
    expect(labelNode.props.children).toBe('LOW');
    expect(labelNode.props.style).toEqual(
      expect.arrayContaining([{color: Colors.success}]),
    );

    const dotNode = root.findByProps({testID: 'priority-badge-dot'});
    expect(dotNode.props.style).toEqual(
      expect.arrayContaining([{backgroundColor: Colors.success}]),
    );
  });

  it('uses default fallback color if unexpected priority provided', () => {
    // @ts-expect-error testing invalid priority fallback
    const tree = renderer.create(<PriorityBadge priority="unknown" />);
    const root = tree.root;
    const labelNode = root.findByProps({testID: 'priority-badge-label'});
    expect(labelNode.props.children).toBe('UNKNOWN');
  });

  it('supports custom testID and custom style', () => {
    const customStyle = {margin: 10};
    const tree = renderer.create(
      <PriorityBadge
        priority="high"
        testID="custom-badge"
        style={customStyle}
      />,
    );
    const root = tree.root;

    const badgeNode = root.findByProps({testID: 'custom-badge'});
    expect(badgeNode).toBeDefined();
    expect(StyleSheet.flatten(badgeNode.props.style)).toMatchObject(
      customStyle,
    );

    const dotNode = root.findByProps({testID: 'custom-badge-dot'});
    expect(dotNode).toBeDefined();
  });

  it('exports PRIORITY_COLOR_MAP with high, medium, and low keys', () => {
    expect(PRIORITY_COLOR_MAP.high).toBe(Colors.danger);
    expect(PRIORITY_COLOR_MAP.medium).toBe(Colors.warning);
    expect(PRIORITY_COLOR_MAP.low).toBe(Colors.success);
  });
});
