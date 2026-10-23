import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme/ThemeContext';

export function InfoBanner({ icon = 'information-circle-outline', children }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.banner, { backgroundColor: colors.surfaceMuted }]}>
      <Ionicons name={icon} size={18} color={colors.textMuted} />
      <Text style={[styles.text, { color: colors.textMuted }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 16,
  },
  text: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
  },
});
