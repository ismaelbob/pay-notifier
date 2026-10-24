import { StyleSheet, Text, View } from 'react-native';

import { BANK_COLORS } from '../data/payments';
import { useTheme } from '../theme/ThemeContext';
import { formatTime } from '../utils/format';
import { formatMoney } from '../utils/money';

export function PaymentRow({ payment, showDivider = false }) {
  const { colors, isDark } = useTheme();
  const bankColor = BANK_COLORS[payment.bank] ?? { light: colors.primary, dark: colors.primary };
  const color = isDark ? bankColor.dark : bankColor.light;

  return (
    <View
      style={[
        styles.row,
        showDivider && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
      ]}
    >
      <View style={[styles.avatar, { backgroundColor: `${color}24` }]}>
        <Text style={[styles.initial, { color }]}>{payment.sender.charAt(0).toUpperCase()}</Text>
      </View>

      <View style={styles.info}>
        <Text numberOfLines={1} style={[styles.sender, { color: colors.text }]}>
          {payment.sender}
        </Text>
        <Text numberOfLines={1} style={[styles.meta, { color: colors.textMuted }]}>
          {payment.bank} · {formatTime(payment.receivedAt)}
        </Text>
      </View>

      <View style={styles.amountBox}>
        <Text style={[styles.amount, { color: colors.positive }]}>
          +{formatMoney(payment.amount)}
        </Text>
        {payment.reference ? (
          <Text style={[styles.reference, { color: colors.textSubtle }]}>
            Ref. {payment.reference}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontSize: 17,
    fontWeight: '800',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  sender: {
    fontSize: 15,
    fontWeight: '600',
  },
  meta: {
    fontSize: 12.5,
  },
  amountBox: {
    alignItems: 'flex-end',
    gap: 2,
  },
  amount: {
    fontSize: 15,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  reference: {
    fontSize: 11,
  },
});
