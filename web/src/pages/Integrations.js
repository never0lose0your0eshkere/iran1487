import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Box,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Chip
} from '@mui/material';
import {
  Email,
  CheckCircle,
  Warning,
  Sync,
  Delete
} from '@mui/icons-material';
import api from '../services/api';
import toast from 'react-hot-toast';

const Integrations = () => {
  const [integrations, setIntegrations] = useState({
    email: { connected: false, provider: null, email: null, lastSync: null }
  });
  const [loading, setLoading] = useState(true);
  const [openEmailDialog, setOpenEmailDialog] = useState(false);
  const [emailForm, setEmailForm] = useState({
    email: '',
    password: '',
    provider: 'gmail'
  });
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/integrations/email/status');
      setIntegrations(prev => ({ ...prev, email: response.data }));
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectEmail = async () => {
    try {
      setSyncing(true);
      const response = await api.post('/integrations/email/connect', emailForm);
      
      if (response.data.success) {
        toast.success('Email connected successfully');
        setOpenEmailDialog(false);
        fetchIntegrations();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to connect email');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnectEmail = async () => {
    try {
      await api.post('/integrations/email/disconnect');
      toast.success('Email disconnected');
      fetchIntegrations();
    } catch (error) {
      toast.error('Failed to disconnect email');
    }
  };

  const handleSync = async () => {
    toast.success('Sync started');
    // Implement sync logic
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Интеграции
      </Typography>

      <Grid container spacing={3}>
        {/* Email Integration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center">
                  <Email sx={{ fontSize: 40, mr: 2, color: '#1976d2' }} />
                  <Box>
                    <Typography variant="h6">Email</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Импорт подписок из почты
                    </Typography>
                  </Box>
                </Box>
                <Chip 
                  label={integrations.email.connected ? 'Подключено' : 'Не подключено'}
                  color={integrations.email.connected ? 'success' : 'default'}
                />
              </Box>

              {integrations.email.connected && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Подключен: {integrations.email.email}
                  </Typography>
                  {integrations.email.lastSync && (
                    <Typography variant="body2">
                      Последняя синхронизация: {new Date(integrations.email.lastSync).toLocaleString()}
                    </Typography>
                  )}
                </Alert>
              )}
            </CardContent>
            <CardActions>
              {integrations.email.connected ? (
                <>
                  <Button 
                    size="small" 
                    startIcon={<Sync />}
                    onClick={handleSync}
                  >
                    Синхронизировать
                  </Button>
                  <Button 
                    size="small" 
                    color="error" 
                    startIcon={<Delete />}
                    onClick={handleDisconnectEmail}
                  >
                    Отключить
                  </Button>
                </>
              ) : (
                <Button 
                  size="small" 
                  variant="contained"
                  onClick={() => setOpenEmailDialog(true)}
                >
                  Подключить
                </Button>
              )}
            </CardActions>
          </Card>
        </Grid>

        {/* Payment Systems Integration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Payment sx={{ fontSize: 40, mr: 2, color: '#4caf50' }} />
                <Box>
                  <Typography variant="h6">Платежные системы</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Импорт из банков и платежных систем
                  </Typography>
                </Box>
              </Box>
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Скоро будет доступно: Сбербанк, Тинькофф, ЮMoney
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        {/* Integration Guide */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Как это работает
            </Typography>
            <Stepper activeStep={-1} orientation="vertical">
              <Step>
                <StepLabel>Подключите почту или платежную систему</StepLabel>
              </Step>
              <Step>
                <StepLabel>Система найдет все письма о подписках</StepLabel>
              </Step>
              <Step>
                <StepLabel>Подтвердите найденные подписки</StepLabel>
              </Step>
              <Step>
                <StepLabel>Отслеживайте расходы в реальном времени</StepLabel>
              </Step>
            </Stepper>
          </Paper>
        </Grid>
      </Grid>

      {/* Email Connection Dialog */}
      <Dialog open={openEmailDialog} onClose={() => setOpenEmailDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Подключение почты</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Alert severity="info">
                Ваши данные будут использоваться только для поиска писем о подписках
              </Alert>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Почтовый сервис</InputLabel>
                <Select
                  value={emailForm.provider}
                  onChange={(e) => setEmailForm({...emailForm, provider: e.target.value})}
                >
                  <MenuItem value="gmail">Gmail</MenuItem>
                  <MenuItem value="yandex">Yandex</MenuItem>
                  <MenuItem value="mailru">Mail.ru</MenuItem>
                  <MenuItem value="outlook">Outlook</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={emailForm.email}
                onChange={(e) => setEmailForm({...emailForm, email: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Пароль"
                type="password"
                value={emailForm.password}
                onChange={(e) => setEmailForm({...emailForm, password: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEmailDialog(false)}>Отмена</Button>
          <Button 
            onClick={handleConnectEmail} 
            variant="contained"
            disabled={syncing}
          >
            {syncing ? <CircularProgress size={24} /> : 'Подключить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Integrations;