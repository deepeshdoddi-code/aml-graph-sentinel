import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function AlertCard({ alert, onPress }) {
  const isCritical = alert.risk_score >= 90;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.topRow}>
        <View style={styles.tagBox}>
          <Text style={styles.clusterId}>{alert.cluster_id}</Text>
          <Text style={styles.typology}>{alert.typology}</Text>
        </View>
        <View style={[styles.scoreBadge, isCritical ? styles.scoreCrit : styles.scoreHigh]}>
          <Text style={styles.scoreText}>Risk {alert.risk_score.toFixed(1)}</Text>
        </View>
      </View>

      <Text style={styles.summary} numberOfLines={2}>
        {alert.summary}
      </Text>

      <View style={styles.footerRow}>
        <Text style={styles.meta}>
          Volume: <Text style={styles.metaBold}>${alert.total_volume.toLocaleString()}</Text>
        </Text>
        <Text style={styles.meta}>
          Hops: <Text style={styles.metaBold}>{alert.hop_count}</Text>
        </Text>
        <Text style={styles.meta}>
          Conserved: <Text style={styles.metaBold}>{(alert.retention_ratio * 100).toFixed(1)}%</Text>
        </Text>
        <Text style={styles.inspectLink}>Inspect Trail →</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  tagBox: { flex: 1 },
  clusterId: { color: '#38BDF8', fontSize: 11, fontWeight: '700' },
  typology: { color: '#F8FAFC', fontSize: 16, fontWeight: '800', marginTop: 2 },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  scoreCrit: { backgroundColor: '#7F1D1D' },
  scoreHigh: { backgroundColor: '#78350F' },
  scoreText: { color: '#FEF2F2', fontSize: 12, fontWeight: '800' },
  summary: { color: '#94A3B8', fontSize: 12, marginTop: 8, lineHeight: 18 },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  meta: { color: '#64748B', fontSize: 11 },
  metaBold: { color: '#E2E8F0', fontWeight: '700' },
  inspectLink: { color: '#38BDF8', fontSize: 12, fontWeight: '700' },
});