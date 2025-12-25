import React, { useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { FAB, Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRecords } from '../hooks/useRecords';
import { RecordItem } from '../components/RecordItem';
import { MonthlySummaryCard } from '../components/MonthlySummaryCard';
import type { Record } from '../types';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, MainTabParamList } from '../navigation/AppNavigator';

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

export function HomeScreen({ navigation }: HomeScreenProps) {
  const theme = useTheme();
  const { records, summary, loading, refreshRecords, deleteRecord, year, month } =
    useRecords();

  // 当页面获得焦点时（从其他页面返回时）自动刷新数据
  useFocusEffect(
    useCallback(() => {
      refreshRecords();
    }, [refreshRecords])
  );

  const handleAddPress = () => {
    navigation.navigate('AddRecord');
  };

  const handleRecordPress = (record: Record) => {
    navigation.navigate('AddRecord', { recordId: record.id });
  };

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await deleteRecord(id);
      } catch (error) {
        console.error('Failed to delete record:', error);
      }
    },
    [deleteRecord]
  );

  const renderItem = ({ item }: { item: Record }) => (
    <RecordItem
      record={item}
      onPress={handleRecordPress}
      onDelete={handleDelete}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text
        variant="bodyLarge"
        style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}
      >
        暂无记录
      </Text>
      <Text
        variant="bodyMedium"
        style={[styles.emptyHint, { color: theme.colors.onSurfaceVariant }]}
      >
        点击右下角按钮添加第一条记录
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <View style={styles.content}>
        <MonthlySummaryCard summary={summary} year={year} month={month} />
        {loading && records.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <FlatList
            data={records}
            renderItem={renderItem}
            keyExtractor={(item) => item.id?.toString() || `record-${item.date}`}
            contentContainerStyle={
              records.length === 0 ? styles.emptyList : undefined
            }
            ListEmptyComponent={renderEmpty}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={refreshRecords}
                colors={[theme.colors.primary]}
              />
            }
          />
        )}
      </View>
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleAddPress}
        color={theme.colors.onPrimary}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    marginBottom: 8,
  },
  emptyHint: {
    opacity: 0.7,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

