import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { InfoBanner } from '../../components/InfoBanner';
import { Screen } from '../../components/Screen';
import { ScreenHeader } from '../../components/ScreenHeader';
import { CURRENCY } from '../../config';
import { THEME_OPTIONS, useTheme } from '../../theme/ThemeContext';

const appVersion = Constants.expoConfig?.version ?? '1.0.0';

export default function SettingsScreen() {
  const { colors, mode, scheme, setMode } = useTheme();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader eyebrow="Preferencias" title="Ajustes" />

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Apariencia</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {THEME_OPTIONS.map((option, index) => {
              const active = mode === option.value;

              return (
                <Pressable
                  key={option.value}
                  onPress={() => setMode(option.value)}
                  style={({ pressed }) => [
                    styles.option,
                    index > 0 && {
                      borderTopWidth: StyleSheet.hairlineWidth,
                      borderTopColor: colors.border,
                    },
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <View
                    style={[
                      styles.optionIcon,
                      { backgroundColor: active ? colors.primarySoft : colors.surfaceMuted },
                    ]}
                  >
                    <Ionicons
                      name={option.icon}
                      size={18}
                      color={active ? colors.primary : colors.textMuted}
                    />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={[styles.optionLabel, { color: colors.text }]}>{option.label}</Text>
                    {option.value === 'system' ? (
                      <Text style={[styles.optionHint, { color: colors.textMuted }]}>
                        Sigue el tema del teléfono
                      </Text>
                    ) : null}
                  </View>
                  {active ? (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Cobros</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.option}>
              <View style={[styles.optionIcon, { backgroundColor: colors.surfaceMuted }]}>
                <Ionicons name="notifications-outline" size={18} color={colors.textMuted} />
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionLabel, { color: colors.text }]}>Avisos de cobros</Text>
                <Text style={[styles.optionHint, { color: colors.textMuted }]}>
                  Lectura de notificaciones del banco
                </Text>
              </View>
              <View style={[styles.pill, { backgroundColor: colors.surfaceMuted }]}>
                <Text style={[styles.pillText, { color: colors.textMuted }]}>PRONTO</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Acerca de</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.option}>
              <View style={[styles.optionIcon, { backgroundColor: colors.surfaceMuted }]}>
                <Ionicons name="phone-portrait-outline" size={18} color={colors.textMuted} />
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionLabel, { color: colors.text }]}>Pay Notifier</Text>
                <Text style={[styles.optionHint, { color: colors.textMuted }]}>
                  Versión {appVersion}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.option,
                { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
              ]}
            >
              <View style={[styles.optionIcon, { backgroundColor: colors.surfaceMuted }]}>
                <Ionicons name="cash-outline" size={18} color={colors.textMuted} />
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionLabel, { color: colors.text }]}>Moneda</Text>
                <Text style={[styles.optionHint, { color: colors.textMuted }]}>{CURRENCY}</Text>
              </View>
            </View>
          </View>
        </View>

        <InfoBanner icon="construct-outline">
          Para leer las notificaciones bancarias reales hace falta un development build con un
          NotificationListenerService en Android. El tema y los datos actuales son locales.
        </InfoBanner>

        <Text style={[styles.footer, { color: colors.textSubtle }]}>
          Tema activo: {scheme === 'dark' ? 'oscuro' : 'claro'} · Expo + React Native
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 22,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    paddingLeft: 4,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  optionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  optionHint: {
    fontSize: 12,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  footer: {
    fontSize: 11.5,
    textAlign: 'center',
  },
});
