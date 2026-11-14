import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

const TYPOLOGIES = [
  'All',
  'Cyclic Round-Tripping',
  'Fan-In / Fan-Out Dispersion',
  'Rapid Pass-Through (Mule)',
];

function MetricsBanner({ evaluation }) {
  const { baseline, graph_engine } = evaluation;
  return (
    <View style={styles.bannerCard}>
      <Text style={styles.bannerTitle}>
        Benchmark vs. Legacy Rule Baseline (Tx greater than $10,000)
      </Text>
      <View style={styles.columns}>
        <View style={styles.colBaseline}>
          <Text style={styles.colHeader}>Rule Baseline</Text>
          <View style={styles.metricRow}>
            <Text style={styles.label}>Precision</Text>
            <Text style={styles.valMuted}>{(baseline.precision * 100).toFixed(0)}%</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.label}>Recall</Text>
            <Text style={styles.valMuted}>{(baseline.recall * 100).toFixed(0)}%</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.label}>F1 Score</Text>
            <Text style={styles.valLow}>{baseline.f1.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.colGraph}>
          <Text style={styles.colHeaderHighlight}>TFCG Graph Engine (C++20)</Text>
          <View style={styles.metricRow}>
            <Text style={styles.label}>Precision</Text>
            <Text style={styles.valHigh}>{(graph_engine.precision * 100).toFixed(0)}%</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.label}>Recall</Text>
            <Text style={styles.valHigh}>{(graph_engine.recall * 100).toFixed(0)}%</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.label}>F1 Score</Text>
            <Text style={styles.valF1}>{graph_engine.f1.toFixed(2)} (+233%)</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function AlertCard({ alert, onPress }) {
  const isCritical = alert.risk_score >= 90;
  return (
    <TouchableOpacity style={styles.alertCard} onPress={onPress}>
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

export default function DashboardScreen({ data, loading, onSelectAlert, onRunScan }) {
  const [selectedFilter, setSelectedFilter] = useState('All');

  if (loading || !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#38BDF8" />
        <Text style={styles.loadingText}>Running Temporal Graphlet Analysis...</Text>
      </View>
    );
  }

  const filteredAlerts =
    selectedFilter === 'All'
      ? data.alerts
      : data.alerts.filter((a) => a.typology === selectedFilter);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>AML Graph Sentinel</Text>
          <Text style={styles.subtitle}>
            TFCG C++20 Engine • {data.dataset_summary.total_transactions} Txns Analyzed
          </Text>
        </View>
        <TouchableOpacity style={styles.scanButton} onPress={onRunScan}>
          <Text style={styles.scanButtonText}>Re-Scan Graph</Text>
        </TouchableOpacity>
      </View>

      <MetricsBanner evaluation={data.evaluation} />

      <Text style={styles.sectionTitle}>Detected Laundering Typologies</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
      >
        {TYPOLOGIES.map((type) => {
          const active = selectedFilter === type;
          return (
            <TouchableOpacity
              key={type}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setSelectedFilter(type)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {type}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={styles.sectionTitle}>
        Risk-Ranked Suspicious Clusters ({filteredAlerts.length})
      </Text>
      {filteredAlerts.map((alert) => (
        <AlertCard
          key={alert.cluster_id}
          alert={alert}
          onPress={() => onSelectAlert(alert)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F19' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0F19' },
  loadingText: { color: '#94A3B8', marginTop: 12, fontSize: 14 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { color: '#F8FAFC', fontSize: 22, fontWeight: '800' },
  subtitle: { color: '#64748B', fontSize: 12, marginTop: 2 },
  scanButton: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  scanButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  sectionTitle: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 18,
    marginBottom: 10,
  },
  filterScroll: { marginBottom: 6 },
  chip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipActive: { backgroundColor: '#0EA5E9', borderColor: '#38BDF8' },
  chipText: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#0B0F19', fontWeight: '800' },
  bannerCard: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  bannerTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  columns: { flexDirection: 'row', justifyContent: 'space-between' },
  colBaseline: {
    flex: 1,
    backgroundColor: '#1E293B',
    padding: 10,
    borderRadius: 8,
    marginRight: 6,
  },
  colGraph: {
    flex: 1.2,
    backgroundColor: '#0C4A6E',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  colHeader: { color: '#94A3B8', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  colHeaderHighlight: { color: '#38BDF8', fontSize: 12, fontWeight: '800', marginBottom: 6 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 2 },
  label: { color: '#CBD5E1', fontSize: 12 },
  valMuted: { color: '#94A3B8', fontSize: 12, fontWeight: '700' },
  valLow: { color: '#F87171', fontSize: 13, fontWeight: '800' },
  valHigh: { color: '#F8FAFC', fontSize: 12, fontWeight: '700' },
  valF1: { color: '#34D399', fontSize: 13, fontWeight: '900' },
  alertCard: {
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