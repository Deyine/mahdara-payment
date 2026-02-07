import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

const STATUS_CONFIG = {
  active: { label: 'Disponible', bg: '#dcfce7', color: '#166534' },
  sold: { label: 'Vendu', bg: '#fef3c7', color: '#92400e' },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.active;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
});
