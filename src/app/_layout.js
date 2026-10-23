import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { PaymentsProvider } from '../context/PaymentsContext';
import { ThemeProvider, useTheme } from '../theme/ThemeContext';

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
      <PaymentsProvider>
        <RootNavigator />
      </PaymentsProvider>
    </ThemeProvider>
  );
}
