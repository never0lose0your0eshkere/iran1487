import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import {
  TextInput,
  Button,
  Title,
  ActivityIndicator,
  Snackbar,
  RadioButton,
  HelperText
} from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSubscriptions } from '../contexts/SubscriptionContext';

const AddEditSubscriptionScreen = ({ navigation, route }) => {
  const { id } = route.params || {};
  const { addSubscription, updateSubscription, getSubscriptionById } = useSubscriptions();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateField, setDateField] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    cost: '',
    category: 'other',
    billingPeriod: 'monthly',
    startDate: new Date(),
    nextBillingDate: new Date(),
    status: 'active',
    paymentMethod: 'card',
    notes: ''
  });

  useEffect(() => {
    if (id) {
      loadSubscription();
    }
  }, [id]);

  const loadSubscription = async () => {
    const subscription = await getSubscriptionById(id);
    if (subscription) {
      setFormData({
        name: subscription.name,
        cost: subscription.cost.toString(),
        category: subscription.category,
        billingPeriod: subscription.billingPeriod,
        startDate: new Date(subscription.startDate),
        nextBillingDate: new Date(subscription.nextBillingDate),
        status: subscription.status,
        paymentMethod: subscription.paymentMethod,
        notes: subscription.notes || ''
      });
    }
  };

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

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Введите название подписки');
      return false;
    }
    if (!formData.cost || parseFloat(formData.cost) <= 0) {
      setError('Введите корректную стоимость');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    let success;
    
    const dataToSend = {
      ...formData,
      cost: parseFloat(formData.cost)
    };

    if (id) {
      success = await updateSubscription(id, dataToSend);
    } else {
      success = await addSubscription(dataToSend);
    }

    setLoading(false);
    
    if (success) {
      navigation.goBack();
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate && dateField) {
      setFormData({ ...formData, [dateField]: selectedDate });
    }
  };

  const showDatepicker = (field) => {
    setDateField(field);
    setShowDatePicker(true);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Title style={styles.title}>
            {id ? 'Редактировать подписку' : 'Новая подписка'}
          </Title>

          <TextInput
            label="Название *"
            value={formData.name}
            onChangeText={(text) => setFormData({...formData, name: text})}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Стоимость *"
            value={formData.cost}
            onChangeText={(text) => setFormData({...formData, cost: text})}
            mode="outlined"
            keyboardType="numeric"
            right={<TextInput.Affix text="₽" />}
            style={styles.input}
          />

          <View style={styles.pickerContainer}>
            <HelperText type="info">Категория</HelperText>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={formData.category}
                onValueChange={(value) => setFormData({...formData, category: value})}
              >
                {categories.map(cat => (
                  <Picker.Item key={cat.value} label={cat.label} value={cat.value} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.pickerContainer}>
            <HelperText type="info">Период оплаты</HelperText>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={formData.billingPeriod}
                onValueChange={(value) => setFormData({...formData, billingPeriod: value})}
              >
                {periods.map(p => (
                  <Picker.Item key={p.value} label={p.label} value={p.value} />
                ))}
              </Picker>
            </View>
          </View>

          <Button
            mode="outlined"
            onPress={() => showDatepicker('startDate')}
            style={styles.dateButton}
            icon="calendar"
          >
            Дата начала: {formData.startDate.toLocaleDateString()}
          </Button>

          <Button
            mode="outlined"
            onPress={() => showDatepicker('nextBillingDate')}
            style={styles.dateButton}
            icon="calendar"
          >
            След. платеж: {formData.nextBillingDate.toLocaleDateString()}
          </Button>

          <View style={styles.radioGroup}>
            <HelperText type="info">Статус</HelperText>
            <RadioButton.Group
              onValueChange={(value) => setFormData({...formData, status: value})}
              value={formData.status}
            >
              <View style={styles.radioRow}>
                <RadioButton value="active" />
                <HelperText type="info">Активна</HelperText>
              </View>
              <View style={styles.radioRow}>
                <RadioButton value="paused" />
                <HelperText type="info">Приостановлена</HelperText>
              </View>
              <View style={styles.radioRow}>
                <RadioButton value="cancelled" />
                <HelperText type="info">Отменена</HelperText>
              </View>
            </RadioButton.Group>
          </View>

          <TextInput
            label="Заметки"
            value={formData.notes}
            onChangeText={(text) => setFormData({...formData, notes: text})}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}
            >
              {id ? 'Сохранить' : 'Добавить'}
            </Button>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.cancelButton}
            >
              Отмена
            </Button>
          </View>
        </View>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={formData[dateField] || new Date()}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      <Snackbar
        visible={!!error}
        onDismiss={() => setError('')}
        action={{ label: 'OK', onPress: () => setError('') }}
      >
        {error}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  dateButton: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  radioGroup: {
    marginBottom: 16,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  buttonContainer: {
    marginTop: 20,
  },
  submitButton: {
    marginBottom: 10,
    paddingVertical: 8,
  },
  cancelButton: {
    paddingVertical: 8,
  },
});

export default AddEditSubscriptionScreen;