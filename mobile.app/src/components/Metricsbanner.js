import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MetricsBanner({ evaluation }) {
  const { baseline, graph_engine } = evaluation;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>
        Benchmark vs. Legacy Rule Baseline (Tx greater than $10,000)
      </Text>

      <View style={styles.columns}>
        {/* Baseline Column */}
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

        {/* TFCG Graph Column */}
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  cardTitle: {
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
});