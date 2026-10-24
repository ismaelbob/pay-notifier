import { SQLiteProvider } from 'expo-sqlite';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Suspense } from 'react';

import { LoadingState } from '../components/LoadingState';
import { PaymentsProvider, useBankNotificationListener } from '../context/PaymentsContext';
import { DATABASE_NAME, migrateDbIfNeeded } from '../db/database';
import { ThemeProvider, useTheme } from '../theme/ThemeContext';

function NotificationBridge() {
  useBankNotificationListener();
  return null;
}

function RootNavigator() {
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Suspense fallback={<LoadingState label="Abriendo la base de datos…" />}>
        <SQLiteProvider
          databaseName={DATABASE_NAME}
          onInit={migrateDbIfNeeded}
          useSuspense
        >
          <PaymentsProvider>
            <NotificationBridge />
            <RootNavigator />
          </PaymentsProvider>
        </SQLiteProvider>
      </Suspense>
    </ThemeProvider>
  );
}
