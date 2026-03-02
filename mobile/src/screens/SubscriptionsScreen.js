import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Alert
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  FAB,
  Chip,
  Searchbar,
  Menu,
  IconButton,
  ActivityIndicator
} from 'react-native-paper';
import { useSubscriptions } from '../contexts/SubscriptionContext';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const SubscriptionsScreen = ({ navigation }) => {
  const { subscriptions, loading, deleteSubscription } = useSubscriptions();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return '#4caf50';
      case 'paused': return '#ff9800';
      case 'cancelled': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const getPeriodLabel = (period) => {
    const periods = {
      weekly: 'Еженедельно',
      monthly: 'Ежемесячно',
      quarterly: 'Ежеквартально',
      yearly: 'Ежегодно'
    };
    return periods[period] || period;
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || sub.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const handleDelete = (id, name) => {
    Alert.alert(
      'Удаление подписки',
      `Вы уверены, что хотите удалить "${name}"?`,
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Удалить', 
          onPress: () => deleteSubscription(id),
          style: 'destructive'
        }
      ]
    );
  };

  const renderSubscription = ({ item }) => (
    <Card 
      style={styles.card}
      onPress={() => navigation.navigate('SubscriptionDetail', { id: item._id })}
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Title style={styles.title}>{item.name}</Title>
            <Chip 
              mode="outlined"
              style={[styles.statusChip, { borderColor: getStatusColor(item.status) }]}
              textStyle={{ color: getStatusColor(item.status) }}
            >
              {item.status}
            </Chip>
          </View>
          <View style={styles.cardActions}>
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => navigation.navigate('AddEditSubscription', { id: item._id })}
            />
            <IconButton
              icon="delete"
              size={20}
              onPress={() => handleDelete(item._id, item.name)}
            />
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Paragraph style={styles.label}>Стоимость:</Paragraph>
            <Paragraph style={styles.value}>{item.cost} ₽</Paragraph>
          </View>
          
          <View style={styles.detailRow}>
            <Paragraph style={styles.label}>Период:</Paragraph>
            <Paragraph style={styles.value}>{getPeriodLabel(item.billingPeriod)}</Paragraph>
          </View>
          
          <View style={styles.detailRow}>
            <Paragraph style={styles.label}>Следующий платеж:</Paragraph>
            <Paragraph style={styles.value}>
              {format(new Date(item.nextBillingDate), 'dd MMMM yyyy', { locale: ru })}
            </Paragraph>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Поиск подписок"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        <Menu
          visible={filterMenuVisible}
          onDismiss={() => setFilterMenuVisible(false)}
          anchor={
            <Button 
              mode="outlined" 
              onPress={() => setFilterMenuVisible(true)}
              icon="filter"
              style={styles.filterButton}
            >
              {selectedFilter === 'all' ? 'Все' : selectedFilter}
            </Button>
          }
        >
          <Menu.Item 
            onPress={() => { setSelectedFilter('all'); setFilterMenuVisible(false); }} 
            title="Все" 
          />
          <Menu.Item 
            onPress={() => { setSelectedFilter('active'); setFilterMenuVisible(false); }} 
            title="Активные" 
          />
          <Menu.Item 
            onPress={() => { setSelectedFilter('paused'); setFilterMenuVisible(false); }} 
            title="Приостановленные" 
          />
          <Menu.Item 
            onPress={() => { setSelectedFilter('cancelled'); setFilterMenuVisible(false); }} 
            title="Отмененные" 
          />
        </Menu>
      </View>

      <FlatList
        data={filteredSubscriptions}
        renderItem={renderSubscription}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Paragraph style={styles.emptyText}>
              {searchQuery ? 'Ничего не найдено' : 'У вас пока нет подписок'}
            </Paragraph>
          </View>
        }
      />

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('AddEditSubscription')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
    elevation: 4,
  },
  searchBar: {
    flex: 1,
    marginRight: 10,
  },
  filterButton: {
    marginLeft: 'auto',
  },
  list: {
    padding: 10,
  },
  card: {
    marginBottom: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 18,
    marginRight: 10,
  },
  statusChip: {
    height: 24,
  },
  cardActions: {
    flexDirection: 'row',
  },
  detailsContainer: {
    marginTop: 5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  label: {
    color: '#666',
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
});

export default SubscriptionsScreen;