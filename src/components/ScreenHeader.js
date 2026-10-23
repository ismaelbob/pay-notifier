import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme/ThemeContext';

export function ScreenHeader({ eyebrow, title, right }) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.texts}>
        {eyebrow ? (
          <Text style={[styles.eyebrow, { color: colors.textMuted }]}>{eyebrow}</Text>
        ) : null}
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  texts: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
});
