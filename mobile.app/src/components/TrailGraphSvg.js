import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TrailGraphSvg({ alert }) {
  return (
    <View style={styles.graphContainer}>
      {alert.transactions.map((tx, index) => (
        <View key={tx.tx_id} style={styles.hopRow}>
          {/* Source Account Node */}
          <View style={styles.nodeCircle}>
            <Text style={styles.nodeText}>{tx.src}</Text>
          </View>

          {/* Directed Weighted Edge */}
          <View style={styles.edgeBridge}>
            <Text style={styles.edgeAmount}>${tx.amount.toLocaleString()}</Text>
            <View style={styles.edgeLine}>
              <View style={styles.arrowHead} />
            </View>
            <Text style={styles.edgeTime}>
              Hop #{index + 1} • {tx.time_label}
            </Text>
          </View>

          {/* Destination Account Node */}
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

const styles = StyleSheet.create({
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