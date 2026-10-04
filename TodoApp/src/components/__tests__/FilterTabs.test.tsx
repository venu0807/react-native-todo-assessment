import React from 'react';
import {StyleSheet} from 'react-native';
import renderer from 'react-test-renderer';
import {describe, it, expect, jest} from '@jest/globals';
import {FilterTabs} from '../FilterTabs';
import {Colors} from '../../theme/colors';

describe('FilterTabs Component', () => {
  it('renders all three filter tabs: All, Active, and Done', () => {
    const onChangeMock = jest.fn();
    const tree = renderer.create(
      <FilterTabs active="all" onChange={onChangeMock} />,
    );
    const root = tree.root;

    const allText = root.findByProps({testID: 'filter-tabs-all-text'});
    const activeText = root.findByProps({testID: 'filter-tabs-active-text'});
    const completedText = root.findByProps({
      testID: 'filter-tabs-completed-text',
    });

    expect(allText.props.children).toBe('All');
    expect(activeText.props.children).toBe('Active');
    expect(completedText.props.children).toBe('Done');
  });

  it('highlights All tab when active="all"', () => {
    const onChangeMock = jest.fn();
    const tree = renderer.create(
      <FilterTabs active="all" onChange={onChangeMock} />,
    );
    const root = tree.root;

    const allTab = root.findByProps({testID: 'filter-tabs-all'});
    expect(allTab.props.accessibilityState).toEqual({selected: true});
    expect(allTab.props.style).toEqual(
      expect.arrayContaining([{backgroundColor: Colors.accent}]),
    );

    const activeTab = root.findByProps({testID: 'filter-tabs-active'});
    expect(activeTab.props.accessibilityState).toEqual({selected: false});
  });

  it('highlights Active tab when active="active"', () => {
    const onChangeMock = jest.fn();
    const tree = renderer.create(
      <FilterTabs active="active" onChange={onChangeMock} />,
    );
    const root = tree.root;

    const activeTab = root.findByProps({testID: 'filter-tabs-active'});
    expect(activeTab.props.accessibilityState).toEqual({selected: true});
    expect(activeTab.props.style).toEqual(
      expect.arrayContaining([{backgroundColor: Colors.accent}]),
    );
  });

  it('highlights Done tab when active="completed"', () => {
    const onChangeMock = jest.fn();
    const tree = renderer.create(
      <FilterTabs active="completed" onChange={onChangeMock} />,
    );
    const root = tree.root;

    const completedTab = root.findByProps({testID: 'filter-tabs-completed'});
    expect(completedTab.props.accessibilityState).toEqual({selected: true});
    expect(completedTab.props.style).toEqual(
      expect.arrayContaining([{backgroundColor: Colors.accent}]),
    );
  });

  it('calls onChange with corresponding key when tabs are pressed', () => {
    const onChangeMock = jest.fn();
    const tree = renderer.create(
      <FilterTabs active="all" onChange={onChangeMock} />,
    );
    const root = tree.root;

    const activeTab = root.findByProps({testID: 'filter-tabs-active'});
    activeTab.props.onPress();
    expect(onChangeMock).toHaveBeenCalledWith('active');

    const completedTab = root.findByProps({testID: 'filter-tabs-completed'});
    completedTab.props.onPress();
    expect(onChangeMock).toHaveBeenCalledWith('completed');

    const allTab = root.findByProps({testID: 'filter-tabs-all'});
    allTab.props.onPress();
    expect(onChangeMock).toHaveBeenCalledWith('all');

    expect(onChangeMock).toHaveBeenCalledTimes(3);
  });

  it('supports custom testID and container styles', () => {
    const onChangeMock = jest.fn();
    const customStyle = {marginVertical: 20};
    const tree = renderer.create(
      <FilterTabs
        active="all"
        onChange={onChangeMock}
        testID="custom-filter"
        style={customStyle}
      />,
    );
    const root = tree.root;

    const container = root.findByProps({testID: 'custom-filter'});
    expect(StyleSheet.flatten(container.props.style)).toMatchObject(
      customStyle,
    );

    const tab = root.findByProps({testID: 'custom-filter-all'});
    expect(tab).toBeDefined();
  });
});
