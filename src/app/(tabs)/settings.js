import Ionicons from '@expo/vector-icons/Ionicons';
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { InfoBanner } from '../../components/InfoBanner';
import { Screen } from '../../components/Screen';
import { ScreenHeader } from '../../components/ScreenHeader';
import { APP_NAME, CURRENCY } from '../../config';
import { THEME_OPTIONS, useTheme } from '../../theme/ThemeContext';
import NotificationListenerModule from '../../../modules/modules/notification-listener/src/NotificationListenerModule';

function SettingRow({ icon, title, description, action, onPress }) {
  const { colors } = useTheme();
  const content = (
    <>
      <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>{title}</Text>
        {description ? <Text style={[styles.rowDescription, { color: colors.textMuted }]}>{description}</Text> : null}
      </View>
      {action ? <View style={styles.rowAction}>{action}</View> : null}
      <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
    </>
  );

  if (!onPress) {
    return <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      {content}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();
  const handleCheckNotificationAccess = () => {
    if (Platform.OS !== 'android') {
      Alert.alert('Solo Android', 'La lectura de notificaciones bancarias solo está disponible en Android con un development build.');
      return;
    }
    try {
      if (typeof NotificationListenerModule.isEnabled !== 'function') {
        Alert.alert('Módulo no disponible', 'Este build no incluye el lector de notificaciones. Genera un nuevo development build con el módulo actualizado.');
        return;
      }
      const enabled = NotificationListenerModule.isEnabled();
      if (enabled) {
        Alert.alert('Acceso concedido', 'Pay Notifier ya tiene acceso a las notificaciones. Los cobros de Nequi, Bancolombia, Daviplata, BBVA, Davivienda y Banco de Bogotá se guardarán automáticamente.');
      } else {
        Alert.alert(
          'Acceso necesario',
          'Para leer las notificaciones de tus bancos debes activar el "Acceso a notificaciones" para Pay Notifier.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Abrir ajustes', onPress: () => NotificationListenerModule.openSettings?.() },
          ]
        );
      }
    } catch (error) {
      console.warn('Error al verificar acceso a notificaciones', error);
      NotificationListenerModule.openSettings?.();
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Ajustes" subtitle="Tema, avisos y detalles de la app" />

        <InfoBanner>
          El tema y los datos actuales son locales. En Expo Go no se leen notificaciones; usa un
          development build para detectar cobros automáticamente.
        </InfoBanner>

        <Text style={[styles.sectionTitle, { color: colors.textSubtle }]}>Apariencia</Text>
        <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {THEME_OPTIONS.map((option, index) => {
            const selected = mode === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => setMode(option.value)}
                style={({ pressed }) => [
                  styles.themeRow,
                  index < THEME_OPTIONS.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <View style={styles.themeInfo}>
                  <Ionicons
                    name={option.value === 'dark' ? 'moon-outline' : option.value === 'light' ? 'sunny-outline' : 'phone-portrait-outline'}
                    size={18}
                    color={colors.text}
                  />
                  <Text style={[styles.themeLabel, { color: colors.text }]}>{option.label}</Text>
                </View>
                {selected ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSubtle }]}>Notificaciones bancarias</Text>
        <View style={styles.group}>
          <SettingRow
            icon="notifications-outline"
            title="Acceso a notificaciones"
            description="Actívalo para detectar cobros de Nequi, Bancolombia, Daviplata, BBVA, Davivienda o Banco de Bogotá"
            onPress={handleCheckNotificationAccess}
          />
          <SettingRow
            icon="scan-circle-outline"
            title="Bancos detectados"
            description="Nequi • Bancolombia • Daviplata • BBVA • Davivienda • Banco de Bogotá"
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSubtle }]}>Acerca de</Text>
        <View style={styles.group}>
          <SettingRow icon="phone-portrait-outline" title={APP_NAME} description={`Moneda: ${CURRENCY}`} />
          <SettingRow
            icon="logo-github"
            title="Documentación"
            description="Ver README del proyecto"
            onPress={() => Linking.openURL('https://github.com/').catch(() => {})}
          />
        </View>

        <Text style={[styles.footerText, { color: colors.textSubtle }]}>Versión 1.0.0</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  group: {
    borderRadius: 16,
    overflow: 'hidden',
    gap: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowDescription: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  rowAction: {
    marginRight: 4,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  themeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  footerText: {
    textAlign: 'center',
    fontSize: 12,
  },
});
