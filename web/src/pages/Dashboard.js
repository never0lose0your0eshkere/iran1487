import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Add,
  NotificationsActive,
  Payment,
  Category
} from '@mui/icons-material';
import { useSubscriptions } from '../contexts/SubscriptionContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { 
    subscriptions, 
    loading, 
    getTotalMonthly, 
    getTotalYearly,
    getUpcomingBills 
  } = useSubscriptions();
  
  const [analytics, setAnalytics] = useState(null);
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

  const upcomingBills = getUpcomingBills(7);

  const monthlyTotal = getTotalMonthly();
  const yearlyTotal = getTotalYearly();

  // Chart data
  const spendingByCategory = analytics?.byCategory ? {
    labels: Object.keys(analytics.byCategory).map(key => 
      key.charAt(0).toUpperCase() + key.slice(1)
    ),
    datasets: [{
      data: Object.values(analytics.byCategory).map(cat => cat.monthlyCost),
      backgroundColor: [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0',
        '#9966FF',
        '#FF9F40'
      ]
    }]
  } : null;

  const forecastData = analytics?.yearlyForecast ? {
    labels: analytics.yearlyForecast.map(item => item.month),
    datasets: [{
      label: 'Прогноз расходов',
      data: analytics.yearlyForecast.map(item => item.total),
      borderColor: '#1976d2',
      backgroundColor: 'rgba(25, 118, 210, 0.1)',
      tension: 0.4
    }]
  } : null;

  if (loading || loadingAnalytics) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Welcome Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4" gutterBottom>
                Dashboard
              </Typography>
              <Typography variant="body1" color="textSecondary">
                У вас {subscriptions.length} активных подписок
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/subscriptions')}
            >
              Добавить подписку
            </Button>
          </Paper>
        </Grid>

        {/* Summary Cards */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Ежемесячные расходы
                  </Typography>
                  <Typography variant="h4">
                    {monthlyTotal.toFixed(2)} ₽
                  </Typography>
                </Box>
                <Payment sx={{ fontSize: 40, color: '#1976d2' }} />
              </Box>
              <Box mt={2} display="flex" alignItems="center">
                {analytics?.trends?.monthOverMonth > 0 ? (
                  <TrendingUp color="error" />
                ) : analytics?.trends?.monthOverMonth < 0 ? (
                  <TrendingDown color="success" />
                ) : (
                  <TrendingFlat color="action" />
                )}
                <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>
                  {Math.abs(analytics?.trends?.monthOverMonth || 0)}% с прошлого месяца
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Годовые расходы
                  </Typography>
                  <Typography variant="h4">
                    {yearlyTotal.toFixed(2)} ₽
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, color: '#4caf50' }} />
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                В среднем {(yearlyTotal / 12).toFixed(2)} ₽/мес
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Активные подписки
                  </Typography>
                  <Typography variant="h4">
                    {subscriptions.filter(s => s.status === 'active').length}
                  </Typography>
                </Box>
                <Category sx={{ fontSize: 40, color: '#ff9800' }} />
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                {Object.keys(analytics?.byCategory || {}).length} категорий
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Bills */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6">
                Предстоящие платежи
              </Typography>
              <NotificationsActive color="warning" />
            </Box>
            {upcomingBills.length > 0 ? (
              <List>
                {upcomingBills.map((bill) => (
                  <ListItem key={bill._id} divider>
                    <ListItemText
                      primary={bill.name}
                      secondary={`${bill.cost} ₽ • ${format(new Date(bill.nextBillingDate), 'dd MMMM', { locale: ru })}`}
                    />
                    <ListItemSecondaryAction>
                      <Chip 
                        label={format(new Date(bill.nextBillingDate), 'dd.MM')}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography color="textSecondary" align="center" py={3}>
                Нет предстоящих платежей
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Category Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Распределение по категориям
            </Typography>
            {spendingByCategory && Object.keys(analytics.byCategory).length > 0 ? (
              <Box height={250}>
                <Pie 
                  data={spendingByCategory}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }}
                />
              </Box>
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height={250}>
                <Typography color="textSecondary">
                  Нет данных для отображения
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Forecast Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Прогноз на 12 месяцев
            </Typography>
            {forecastData && (
              <Box height={300}>
                <Line 
                  data={forecastData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return value + ' ₽';
                          }
                        }
                      }
                    }
                  }}
                />
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;