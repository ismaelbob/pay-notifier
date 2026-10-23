import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';

import { Chip } from '../../components/Chip';
import { PaymentRow } from '../../components/PaymentRow';
import { Screen } from '../../components/Screen';
import { ScreenHeader } from '../../components/ScreenHeader';
import { usePayments } from '../../context/PaymentsContext';
import { useTheme } from '../../theme/ThemeContext';
import { formatCurrency } from '../../utils/format';
import { filterByRange, groupByDay, sumAmounts } from '../../utils/payments';

const RANGES = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: '7 días' },
  { value: 'all', label: 'Todo' },
];

export default function HistoryScreen() {
  const { colors } = useTheme();
  const { payments } = usePayments();
  const [range, setRange] = useState('all');

  const filtered = useMemo(() => filterByRange(payments, range), [payments, range]);
  const sections = useMemo(() => groupByDay(filtered), [filtered]);
  const total = useMemo(() => sumAmounts(filtered), [filtered]);

  return (
    <Screen>
      <View style={styles.header}>
        <ScreenHeader eyebrow="Cobros recibidos" title="Historial" />

        <View style={styles.filters}>
          {RANGES.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              active={range === option.value}
              onPress={() => setRange(option.value)}
            />
          ))}
        </View>

        <View style={[styles.summary, { backgroundColor: colors.surfaceMuted }]}>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
            {filtered.length} {filtered.length === 1 ? 'cobro' : 'cobros'}
          </Text>
          <Text style={[styles.summaryTotal, { color: colors.text }]}>{formatCurrency(total)}</Text>
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View
            style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <PaymentRow payment={item} />
          </View>
        )}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{section.title}</Text>
            <Text style={[styles.sectionTotal, { color: colors.textSubtle }]}>
              {formatCurrency(section.total)}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceMuted }]}>
              <Ionicons name="receipt-outline" size={26} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin cobros en este período</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Prueba con otro rango de fechas o simula un cobro desde Inicio.
            </Text>
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 14,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
  },
  summaryLabel: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  summaryTotal: {
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
    flexGrow: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  sectionTotal: {
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  itemCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 48,
    gap: 8,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});
