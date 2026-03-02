import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { SubscriptionProvider } from './src/contexts/SubscriptionContext';
import AppNavigator from './src/navigation/AppNavigator';
import { theme } from './src/theme';
import { initNotifications } from './src/services/notifications';

export default function App() {
  useEffect(() => {
    initNotifications();
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <SubscriptionProvider>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </SubscriptionProvider>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}