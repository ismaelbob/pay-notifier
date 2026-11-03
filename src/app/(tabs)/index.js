import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { PaymentRow } from '../../components/PaymentRow';
import { Screen } from '../../components/Screen';
import { ScreenHeader } from '../../components/ScreenHeader';
import { usePayments } from '../../context/PaymentsContext';
import { useTheme } from '../../theme/ThemeContext';
import { formatMoney } from '../../utils/money';
import { getTotals } from '../../utils/payments';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { payments, isLoading, error, reload } = usePayments();
  const totals = useMemo(() => getTotals(payments), [payments]);
  const recent = payments.slice(0, 4);

  if (isLoading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ErrorState message={error} onRetry={reload} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader eyebrow={`${getGreeting()} 👋`} title="Cobros recibidos" />

        <View
          style={[
            styles.hero,
            {
              backgroundColor: colors.hero,
              shadowColor: colors.shadow,
              shadowOpacity: isDark ? 0 : 0.18,
            },
          ]}
        >
          <View style={styles.heroTop}>
            <Text style={[styles.heroLabel, { color: colors.heroMuted }]}>Recibido hoy</Text>
            <View style={[styles.heroBadge, { backgroundColor: colors.heroOverlay }]}>
              <Ionicons name="arrow-down" size={12} color={colors.heroText} />
              <Text style={[styles.heroBadgeText, { color: colors.heroText }]}>
                {totals.countToday} {totals.countToday === 1 ? 'cobro' : 'cobros'}
              </Text>
            </View>
          </View>

          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[styles.heroAmount, { color: colors.heroText }]}
          >
            {formatMoney(totals.today)}
          </Text>

          <View style={[styles.heroDivider, { backgroundColor: colors.heroOverlay }]} />

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatLabel, { color: colors.heroMuted }]}>Últimos 7 días</Text>
              <Text style={[styles.heroStatValue, { color: colors.heroText }]}>
                {formatMoney(totals.week)}
              </Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatLabel, { color: colors.heroMuted }]}>Total cobros</Text>
              <Text style={[styles.heroStatValue, { color: colors.heroText }]}>{payments.length}</Text>
            </View>
          </View>
        </View>

        <View>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Últimos cobros</Text>
            <Link href="/history" asChild>
              <Pressable hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                <Text style={[styles.link, { color: colors.primary }]}>Ver todo</Text>
              </Pressable>
            </Link>
          </View>

          <View
            style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            {recent.length > 0 ? (
              recent.map((payment, index) => (
                <PaymentRow
                  key={payment.id}
                  payment={payment}
                  showDivider={index < recent.length - 1}
                />
              ))
            ) : (
              <View style={styles.empty}>
                <Ionicons name="receipt-outline" size={24} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin cobros todavía</Text>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  Cuando recibas un pago, aparecerá aquí.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 20,
  },
  hero: {
    borderRadius: 24,
    padding: 20,
    gap: 12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  heroBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  heroAmount: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1.2,
    fontVariant: ['tabular-nums'],
  },
  heroDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 2,
  },
  heroStats: {
    flexDirection: 'row',
    gap: 24,
  },
  heroStat: {
    gap: 2,
  },
  heroStatLabel: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  heroStatValue: {
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  link: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  listCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  empty: {
    alignItems: 'center',
    padding: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
});
