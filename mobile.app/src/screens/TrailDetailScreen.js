import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

function TrailGraphSvg({ alert }) {
  return (
    <View style={styles.graphContainer}>
      {alert.transactions.map((tx, index) => (
        <View key={tx.tx_id} style={styles.hopRow}>
          <View style={styles.nodeCircle}>
            <Text style={styles.nodeText}>{tx.src}</Text>
          </View>

          <View style={styles.edgeBridge}>
            <Text style={styles.edgeAmount}>${tx.amount.toLocaleString()}</Text>
            <View style={styles.edgeLine}>
              <View style={styles.arrowHead} />
            </View>
            <Text style={styles.edgeTime}>
              Hop #{index + 1} • {tx.time_label}
            </Text>
          </View>

          <View
            style={[
              styles.nodeCircle,
              tx.dst === alert.transactions[0].src && styles.cycleNode,
            ]}
          >
            <Text style={styles.nodeText}>{tx.dst}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export default function TrailDetailScreen({ alert, onBack }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backText}>← Back to Ranked Alerts</Text>
      </TouchableOpacity>

      <View style={styles.headerCard}>
        <View style={styles.topRow}>
          <Text style={styles.clusterId}>{alert.cluster_id}</Text>
          <View style={styles.riskBadge}>
            <Text style={styles.riskText}>RISK {alert.risk_score.toFixed(1)} / 100</Text>
          </View>
        </View>
        <Text style={styles.typology}>{alert.typology}</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Laundered Volume</Text>
            <Text style={styles.statValue}>${alert.total_volume.toLocaleString()}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Value Conserved</Text>
            <Text style={styles.statValue}>{(alert.retention_ratio * 100).toFixed(1)}%</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Duration</Text>
            <Text style={styles.statValue}>{alert.time_span_minutes} mins</Text>
          </View>
        </View>
      </View>

      <View style={styles.nlgCard}>
        <Text style={styles.sectionHeader}>Plain-Language Money Trail Summary</Text>
        <Text style={styles.nlgBody}>{alert.summary}</Text>
      </View>

      <View style={styles.graphCard}>
        <Text style={styles.sectionHeader}>Temporal Directed Graph Topology</Text>
        <TrailGraphSvg alert={alert} />
      </View>

      <View style={styles.ledgerCard}>
        <Text style={styles.sectionHeader}>Chronological Hop Ledger</Text>
        {alert.transactions.map((tx, idx) => (
          <View key={tx.tx_id} style={styles.txRow}>
            <View style={styles.hopBadge}>
              <Text style={styles.hopText}>#{idx + 1}</Text>
            </View>
            <View style={styles.txMain}>
              <Text style={styles.txRoute}>
                {tx.src} → {tx.dst}
              </Text>
              <Text style={styles.txMeta}>
                {tx.tx_id} • {tx.time_label}
              </Text>
            </View>
            <Text style={styles.txAmount}>${tx.amount.toLocaleString()}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F19' },
  content: { padding: 16, paddingBottom: 40 },
  backBtn: { marginBottom: 14 },
  backText: { color: '#38BDF8', fontSize: 14, fontWeight: '700' },
  headerCard: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clusterId: { color: '#94A3B8', fontSize: 13, fontWeight: '700' },
  riskBadge: {
    backgroundColor: '#7F1D1D',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  riskText: { color: '#FCA5A5', fontSize: 12, fontWeight: '800' },
  typology: { color: '#F8FAFC', fontSize: 20, fontWeight: '800', marginTop: 6 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  statBox: {
    flex: 1,
    backgroundColor: '#1E293B',
    padding: 10,
    borderRadius: 8,
    marginRight: 6,
  },
  statLabel: { color: '#94A3B8', fontSize: 11 },
  statValue: { color: '#38BDF8', fontSize: 15, fontWeight: '800', marginTop: 4 },
  nlgCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    marginTop: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  sectionHeader: { color: '#E2E8F0', fontSize: 14, fontWeight: '700', marginBottom: 8 },
  nlgBody: { color: '#CBD5E1', fontSize: 13, lineHeight: 20 },
  graphCard: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  ledgerCard: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  hopBadge: {
    backgroundColor: '#0284C7',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  hopText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  txMain: { flex: 1 },
  txRoute: { color: '#F8FAFC', fontSize: 14, fontWeight: '700' },
  txMeta: { color: '#64748B', fontSize: 11, marginTop: 2 },
  txAmount: { color: '#34D399', fontSize: 14, fontWeight: '800' },
  graphContainer: { paddingVertical: 8 },
  hopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  nodeCircle: {
    width: 78,
    paddingVertical: 10,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    alignItems: 'center',
  },
  cycleNode: {
    backgroundColor: '#7F1D1D',
    borderColor: '#F87171',
  },
  nodeText: { color: '#F8FAFC', fontSize: 11, fontWeight: '800' },
  edgeBridge: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  edgeAmount: { color: '#34D399', fontSize: 12, fontWeight: '800', marginBottom: 4 },
  edgeLine: {
    width: '100%',
    height: 2,
    backgroundColor: '#475569',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  arrowHead: {
    width: 8,
    height: 8,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: '#38BDF8',
    transform: [{ rotate: '45deg' }],
  },
  edgeTime: { color: '#94A3B8', fontSize: 10, marginTop: 4 },
});