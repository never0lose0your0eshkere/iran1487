import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  CardActions,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Payment,
  CalendarToday
} from '@mui/icons-material';
import { useSubscriptions } from '../contexts/SubscriptionContext';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import toast from 'react-hot-toast';

const Subscriptions = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { 
    subscriptions, 
    addSubscription, 
    updateSubscription, 
    deleteSubscription 
  } = useSubscriptions();
  
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    cost: '',
    category: 'other',
    billingPeriod: 'monthly',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    nextBillingDate: format(new Date(), 'yyyy-MM-dd'),
    status: 'active',
    paymentMethod: 'card',
    notes: ''
  });

  const categories = [
    { value: 'streaming', label: 'Стриминг' },
    { value: 'software', label: 'ПО' },
    { value: 'cloud', label: 'Облако' },
    { value: 'delivery', label: 'Доставка' },
    { value: 'fitness', label: 'Фитнес' },
    { value: 'music', label: 'Музыка' },
    { value: 'other', label: 'Другое' }
  ];

  const periods = [
    { value: 'weekly', label: 'Еженедельно' },
    { value: 'monthly', label: 'Ежемесячно' },
    { value: 'quarterly', label: 'Ежеквартально' },
    { value: 'yearly', label: 'Ежегодно' }
  ];

  const handleOpen = (subscription = null) => {
    if (subscription) {
      setEditingId(subscription._id);
      setFormData({
        name: subscription.name,
        cost: subscription.cost,
        category: subscription.category,
        billingPeriod: subscription.billingPeriod,
        startDate: format(new Date(subscription.startDate), 'yyyy-MM-dd'),
        nextBillingDate: format(new Date(subscription.nextBillingDate), 'yyyy-MM-dd'),
        status: subscription.status,
        paymentMethod: subscription.paymentMethod,
        notes: subscription.notes || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        cost: '',
        category: 'other',
        billingPeriod: 'monthly',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        nextBillingDate: format(new Date(), 'yyyy-MM-dd'),
        status: 'active',
        paymentMethod: 'card',
        notes: ''
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    try {
      let success;
      if (editingId) {
        success = await updateSubscription(editingId, formData);
      } else {
        success = await addSubscription(formData);
      }
      
      if (success) {
        handleClose();
      }
    } catch (error) {
      toast.error('Ошибка при сохранении');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить эту подписку?')) {
      await deleteSubscription(id);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'success';
      case 'paused': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  if (isMobile) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5">Подписки</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpen()}
          >
            Добавить
          </Button>
        </Box>

        <Grid container spacing={2}>
          {subscriptions.map((sub) => (
            <Grid item xs={12} key={sub._id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start">
                    <Box>
                      <Typography variant="h6">{sub.name}</Typography>
                      <Typography color="textSecondary">
                        {sub.cost} ₽ / {periods.find(p => p.value === sub.billingPeriod)?.label}
                      </Typography>
                    </Box>
                    <Chip 
                      label={sub.status}
                      color={getStatusColor(sub.status)}
                      size="small"
                    />
                  </Box>
                  
                  <Box mt={2}>
                    <Typography variant="body2" display="flex" alignItems="center" gap={1}>
                      <Payment fontSize="small" />
                      Следующий платеж: {format(new Date(sub.nextBillingDate), 'dd MMMM yyyy', { locale: ru })}
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button size="small" startIcon={<Visibility />} onClick={() => {}}>
                    Детали
                  </Button>
                  <Button size="small" startIcon={<Edit />} onClick={() => handleOpen(sub)}>
                    Изменить
                  </Button>
                  <Button size="small" color="error" startIcon={<Delete />} onClick={() => handleDelete(sub._id)}>
                    Удалить
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Мобильная версия формы */}
        <Dialog open={open} onClose={handleClose} fullScreen>
          <DialogTitle>{editingId ? 'Редактировать' : 'Новая подписка'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Название"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Стоимость"
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData({...formData, cost: e.target.value})}
                  InputProps={{ endAdornment: '₽' }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Категория</InputLabel>
                  <Select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    {categories.map(cat => (
                      <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Период</InputLabel>
                  <Select
                    value={formData.billingPeriod}
                    onChange={(e) => setFormData({...formData, billingPeriod: e.target.value})}
                  >
                    {periods.map(p => (
                      <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Дата начала"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Следующий платеж"
                  type="date"
                  value={formData.nextBillingDate}
                  onChange={(e) => setFormData({...formData, nextBillingDate: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Заметки"
                  multiline
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Отмена</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editingId ? 'Сохранить' : 'Добавить'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    );
  }

  // Desktop version
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Подписки</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpen()}
        >
          Добавить подписку
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Название</TableCell>
              <TableCell>Стоимость</TableCell>
              <TableCell>Категория</TableCell>
              <TableCell>Период</TableCell>
              <TableCell>След. платеж</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {subscriptions.map((sub) => (
              <TableRow key={sub._id}>
                <TableCell>{sub.name}</TableCell>
                <TableCell>{sub.cost} ₽</TableCell>
                <TableCell>
                  {categories.find(c => c.value === sub.category)?.label}
                </TableCell>
                <TableCell>
                  {periods.find(p => p.value === sub.billingPeriod)?.label}
                </TableCell>
                <TableCell>
                  {format(new Date(sub.nextBillingDate), 'dd.MM.yyyy')}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={sub.status}
                    color={getStatusColor(sub.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpen(sub)}>
                    <Edit />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(sub._id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Desktop form dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{editingId ? 'Редактировать подписку' : 'Новая подписка'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Название"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Стоимость"
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData({...formData, cost: e.target.value})}
                InputProps={{ endAdornment: '₽' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Категория</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  {categories.map(cat => (
                    <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Период</InputLabel>
                <Select
                  value={formData.billingPeriod}
                  onChange={(e) => setFormData({...formData, billingPeriod: e.target.value})}
                >
                  {periods.map(p => (
                    <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Дата начала"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Следующий платеж"
                type="date"
                value={formData.nextBillingDate}
                onChange={(e) => setFormData({...formData, nextBillingDate: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Статус</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <MenuItem value="active">Активна</MenuItem>
                  <MenuItem value="paused">Приостановлена</MenuItem>
                  <MenuItem value="cancelled">Отменена</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Способ оплаты</InputLabel>
                <Select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                >
                  <MenuItem value="card">Банковская карта</MenuItem>
                  <MenuItem value="paypal">PayPal</MenuItem>
                  <MenuItem value="apple_pay">Apple Pay</MenuItem>
                  <MenuItem value="google_pay">Google Pay</MenuItem>
                  <MenuItem value="other">Другое</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Заметки"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Отмена</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingId ? 'Сохранить' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Subscriptions;