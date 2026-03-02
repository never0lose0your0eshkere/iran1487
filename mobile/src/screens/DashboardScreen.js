import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  List,
  Chip,
  Button,
  ActivityIndicator,
  Text
} from 'react-native-paper';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { useSubscriptions } from '../contexts/SubscriptionContext';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import api from '../services/api';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const { 
    subscriptions, 
    loading, 
    getTotalMonthly, 
    getUpcomingBills,
    refresh 
  } = useSubscriptions();
  
  const [analytics, setAnalytics] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const response = await api.get('/analytics/spending');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    await fetchAnalytics();
    setRefreshing(false);
  };

  const upcomingBills = getUpcomingBills(7);
  const monthlyTotal = getTotalMonthly();

  const chartData = {
    labels: analytics?.yearlyForecast?.map(item => item.month.substring(0, 3)) || [],
    datasets: [{
      data: analytics?.yearlyForecast?.map(item => item.total) || []
    }]
  };

  const pieData = analytics?.byCategory 
    ? Object.entries(analytics.byCategory).map(([key, value], index) => ({
        name: key,
        population: value.monthlyCost,
        color: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'][index % 5],
        legendFontColor: '#7F7F7F',
        legendFontSize: 12
      }))
    : [];

  if (loading || loadingAnalytics) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Title>Dashboard</Title>
        <Paragraph>У вас {subscriptions.length} активных подписок</Paragraph>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.row}>
            <View>
              <Paragraph style={styles.label}>Ежемесячные расходы</Paragraph>
              <Title style={styles.amount}>{monthlyTotal.toFixed(2)} ₽</Title>
            </View>
            <Chip icon="trending-up" mode="outlined">
              {analytics?.trends?.monthOverMonth > 0 ? '+' : ''}
              {analytics?.trends?.monthOverMonth?.toFixed(1)}%
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {upcomingBills.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.row}>
              <Title style={styles.sectionTitle}>Предстоящие платежи</Title>
              <Chip icon="bell" selectedColor="#ff9800"></Chip>
                            <Chip icon="bell" selectedColor="#ff9800">{upcomingBills.length}</Chip>
            </View>
            
            {upcomingBills.map((bill) => (
              <List.Item
                key={bill._id}
                title={bill.name}
                description={`${bill.cost} ₽ • ${format(new Date(bill.nextBillingDate), 'dd MMMM', { locale: ru })}`}
                left={props => <List.Icon {...props} icon="calendar" />}
                right={props => (
                  <Chip mode="outlined">
                    {format(new Date(bill.nextBillingDate), 'dd.MM')}
                  </Chip>
                )}
              />
            ))}
          </Card.Content>
        </Card>
      )}

      {pieData.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Расходы по категориям</Title>
            <PieChart
              data={pieData}
              width={width - 40}
              height={200}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </Card.Content>
        </Card>
      )}

      {chartData.datasets[0].data.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Прогноз на 12 месяцев</Title>
            <LineChart
              data={chartData}
              width={width - 40}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(25, 118, 210, ${opacity})`,
                style: {
                  borderRadius: 16
                }
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16
              }}
              formatYLabel={(value) => `${value} ₽`}
            />
          </Card.Content>
        </Card>
      )}

      <Button
        mode="contained"
        onPress={() => navigation.navigate('AddEditSubscription')}
        style={styles.addButton}
        icon="plus"
      >
        Добавить подписку
      </Button>
    </ScrollView>
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
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  card: {
    margin: 10,
    elevation: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  addButton: {
    margin: 20,
    paddingVertical: 8,
  },
});

export default DashboardScreen;