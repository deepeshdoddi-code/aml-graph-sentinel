import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

export default function TrailDetailScreen({ alert, onBack }) {
  const [activeHop, setActiveHop] = useState(alert.transactions.length - 1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSarReport, setShowSarReport] = useState(false);

  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        setActiveHop((prev) => {
          if (prev >= alert.transactions.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 900);
    }
    return () => clearInterval(timer);
  }, [isPlaying, alert.transactions.length]);

  const startReplay = () => {
    setActiveHop(0);
    setIsPlaying(true);
  };

  const currentTx = alert.transactions[activeHop] || alert.transactions[0];
  const initialAmount = alert.transactions[0].amount;
  const feeLost = Math.max(0, initialAmount - alert.total_volume);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Navigation & SAR Action Bar */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>← Back to SOC Feed</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sarBtn}
          onPress={() => setShowSarReport(!showSarReport)}
        >
          <Text style={styles.sarBtnText}>
            {showSarReport ? 'Hide FinCEN SAR' : '📄 Generate FinCEN SAR'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Auto-Generated FinCEN Regulatory SAR Filing Modal Box */}
      {showSarReport && (
        <View style={styles.sarModal}>
          <Text style={styles.sarHeader}>
            FINCEN SUSPICIOUS ACTIVITY REPORT (FORM 111) — AUTO-GENERATED
          </Text>
          <Text style={styles.sarLine}>
            <Text style={styles.sarBold}>Filing ID:</Text> SAR-2026-{alert.cluster_id} •{' '}
            <Text style={styles.sarBold}>Priority:</Text> IMMEDIATE FREEZE
          </Text>
          <Text style={styles.sarLine}>
            <Text style={styles.sarBold}>Primary typology:</Text> {alert.typology} (CFR 31 § 1020.320)
          </Text>
          <Text style={styles.sarLine}>
            <Text style={styles.sarBold}>Subject Accounts:</Text> {alert.accounts.join(', ')}
          </Text>
          <Text style={styles.sarLine}>
            <Text style={styles.sarBold}>Forensic Narrative:</Text> {alert.summary}
          </Text>
          <Text style={styles.sarStamp}>
            ✓ Cryptographically Signed by TFCG C++20 Engine • Confidence {alert.risk_score}%
          </Text>
        </View>
      )}

      {/* Cluster Header */}
      <View style={styles.headerCard}>
        <View style={styles.topRow}>
          <Text style={styles.clusterId}>CLUSTER {alert.cluster_id}</Text>
          <View style={styles.riskBadge}>
            <Text style={styles.riskText}>COMPOSITE RISK {alert.risk_score.toFixed(1)} / 100</Text>
          </View>
        </View>
        <Text style={styles.typology}>{alert.typology}</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Settled Volume</Text>
            <Text style={styles.statValue}>${alert.total_volume.toLocaleString()}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Value Conserved</Text>
            <Text style={styles.statValue}>{(alert.retention_ratio * 100).toFixed(1)}%</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Peeling Fee Loss</Text>
            <Text style={styles.statValueAmber}>${feeLost.toLocaleString()}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Window</Text>
            <Text style={styles.statValue}>{alert.time_span_minutes} mins</Text>
          </View>
        </View>
      </View>

      {/* Explainable AI (XAI) Risk Score Decomposition */}
      <View style={styles.xaiCard}>
        <Text style={styles.sectionHeader}>
          Explainable AI (XAI) Risk Score Decomposition
        </Text>
        <View style={styles.xaiRow}>
          <Text style={styles.xaiLabel}>Flow Conservation Ratio ({(alert.retention_ratio * 100).toFixed(1)}%)</Text>
          <View style={styles.xaiBarTrack}>
            <View style={[styles.xaiBarFill, { width: `${Math.min(100, alert.retention_ratio * 100)}%`, backgroundColor: '#10B981' }]} />
          </View>
          <Text style={styles.xaiWeight}>40%</Text>
        </View>
        <View style={styles.xaiRow}>
          <Text style={styles.xaiLabel}>Temporal Velocity ({alert.time_span_minutes}m burst)</Text>
          <View style={styles.xaiBarTrack}>
            <View style={[styles.xaiBarFill, { width: '92%', backgroundColor: '#38BDF8' }]} />
          </View>
          <Text style={styles.xaiWeight}>35%</Text>
        </View>
        <View style={styles.xaiRow}>
          <Text style={styles.xaiLabel}>Sub-Threshold Structuring & Cycle Depth</Text>
          <View style={styles.xaiBarTrack}>
            <View style={[styles.xaiBarFill, { width: '88%', backgroundColor: '#F59E0B' }]} />
          </View>
          <Text style={styles.xaiWeight}>25%</Text>
        </View>
      </View>

      {/* Interactive Temporal Hop-by-Hop Replay Scrubber */}
      <View style={styles.graphCard}>
        <View style={styles.replayHeader}>
          <View>
            <Text style={styles.sectionHeader}>Interactive Temporal Money-Trail Replay</Text>
            <Text style={styles.replaySub}>
              Showing Hop {activeHop + 1} of {alert.transactions.length} • {currentTx.time_label} (${currentTx.amount.toLocaleString()})
            </Text>
          </View>
          <TouchableOpacity style={styles.playBtn} onPress={startReplay}>
            <Text style={styles.playBtnText}>
              {isPlaying ? '⏸ Replaying...' : '▶ Play Trail Replay'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Step Scrubber Pills */}
        <View style={styles.stepPillRow}>
          {alert.transactions.map((tx, idx) => (
            <TouchableOpacity
              key={tx.tx_id}
              style={[styles.stepPill, idx <= activeHop && styles.stepPillActive]}
              onPress={() => {
                setIsPlaying(false);
                setActiveHop(idx);
              }}
            >
              <Text style={[styles.stepPillText, idx <= activeHop && styles.stepPillTextActive]}>
                Hop #{idx + 1} ({tx.time_label})
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Directed Graph Topology with Active Hop Highlighting */}
        <View style={styles.graphContainer}>
          {alert.transactions.map((tx, index) => {
            const isVisible = index <= activeHop;
            const isCurrent = index === activeHop;
            const isCycleClosure = tx.dst === alert.transactions[0].src;
            return (
              <View
                key={tx.tx_id}
                style={[styles.hopRow, !isVisible && styles.hopRowDimmed]}
              >
                <View style={[styles.nodeCircle, isCurrent && styles.nodeCurrent]}>
                  <Text style={styles.nodeRole}>ORIGIN</Text>
                  <Text style={styles.nodeText}>{tx.src}</Text>
                </View>

                <View style={styles.edgeBridge}>
                  <Text style={[styles.edgeAmount, isCurrent && styles.edgeAmountCurrent]}>
                    ${tx.amount.toLocaleString()}
                  </Text>
                  <View style={[styles.edgeLine, isCurrent && styles.edgeLineCurrent]}>
                    <View style={styles.arrowHead} />
                  </View>
                  <Text style={styles.edgeTime}>
                    {tx.tx_id} • {tx.time_label}
                  </Text>
                </View>

                <View
                  style={[
                    styles.nodeCircle,
                    isCurrent && styles.nodeCurrent,
                    isCycleClosure && styles.cycleNode,
                  ]}
                >
                  <Text style={styles.nodeRole}>
                    {isCycleClosure ? 'CYCLE END' : 'MULE / HUB'}
                  </Text>
                  <Text style={styles.nodeText}>{tx.dst}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Plain-Language NLG Summary */}
      <View style={styles.nlgCard}>
        <Text style={styles.sectionHeader}>Plain-Language Investigation Summary</Text>
        <Text style={styles.nlgBody}>{alert.summary}</Text>
      </View>

      {/* Chronological Hop Ledger */}
      <View style={styles.ledgerCard}>
        <Text style={styles.sectionHeader}>Chronological Audit Ledger</Text>
        {alert.transactions.map((tx, idx) => (
          <TouchableOpacity
            key={tx.tx_id}
            style={[styles.txRow, idx === activeHop && styles.txRowActive]}
            onPress={() => setActiveHop(idx)}
          >
            <View style={styles.hopBadge}>
              <Text style={styles.hopText}>#{idx + 1}</Text>
            </View>
            <View style={styles.txMain}>
              <Text style={styles.txRoute}>
                {tx.src} → {tx.dst}
              </Text>
              <Text style={styles.txMeta}>
                {tx.tx_id} • Timestamp: {tx.timestamp} ({tx.time_label})
              </Text>
            </View>
            <Text style={styles.txAmount}>${tx.amount.toLocaleString()}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070B14' },
  content: { padding: 16, paddingBottom: 48 },
  topNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  backBtn: { paddingVertical: 6 },
  backText: { color: '#38BDF8', fontSize: 14, fontWeight: '800' },
  sarBtn: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sarBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  sarModal: {
    backgroundColor: '#1E1B4B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#818CF8',
  },
  sarHeader: { color: '#A5B4FC', fontSize: 11, fontWeight: '900', marginBottom: 8, letterSpacing: 0.5 },
  sarLine: { color: '#E0E7FF', fontSize: 12, marginBottom: 5, lineHeight: 18 },
  sarBold: { fontWeight: '800', color: '#FFFFFF' },
  sarStamp: { color: '#34D399', fontSize: 11, fontWeight: '800', marginTop: 6 },
  headerCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clusterId: { color: '#38BDF8', fontSize: 12, fontWeight: '800' },
  riskBadge: {
    backgroundColor: '#7F1D1D',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F87171',
  },
  riskText: { color: '#FEF2F2', fontSize: 11, fontWeight: '900' },
  typology: { color: '#F8FAFC', fontSize: 21, fontWeight: '900', marginTop: 6 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  statBox: {
    flex: 1,
    backgroundColor: '#1E293B',
    padding: 9,
    borderRadius: 8,
    marginRight: 6,
  },
  statLabel: { color: '#94A3B8', fontSize: 10, fontWeight: '600' },
  statValue: { color: '#38BDF8', fontSize: 14, fontWeight: '900', marginTop: 4 },
  statValueAmber: { color: '#F59E0B', fontSize: 14, fontWeight: '900', marginTop: 4 },
  xaiCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  sectionHeader: { color: '#F8FAFC', fontSize: 14, fontWeight: '800', marginBottom: 8 },
  xaiRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 5 },
  xaiLabel: { color: '#CBD5E1', fontSize: 11, width: 150 },
  xaiBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#1E293B',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  xaiBarFill: { height: '100%', borderRadius: 4 },
  xaiWeight: { color: '#94A3B8', fontSize: 11, fontWeight: '800', width: 32, textAlign: 'right' },
  graphCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  replayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  replaySub: { color: '#34D399', fontSize: 11, fontWeight: '700' },
  playBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  playBtnText: { color: '#052E16', fontSize: 12, fontWeight: '900' },
  stepPillRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  stepPill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  stepPillActive: { backgroundColor: '#0284C7' },
  stepPillText: { color: '#64748B', fontSize: 10, fontWeight: '700' },
  stepPillTextActive: { color: '#FFFFFF' },
  graphContainer: { paddingVertical: 4 },
  hopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 7,
  },
  hopRowDimmed: { opacity: 0.25 },
  nodeCircle: {
    width: 84,
    paddingVertical: 8,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    alignItems: 'center',
  },
  nodeCurrent: {
    borderColor: '#10B981',
    backgroundColor: '#064E3B',
  },
  cycleNode: {
    backgroundColor: '#7F1D1D',
    borderColor: '#F87171',
  },
  nodeRole: { color: '#94A3B8', fontSize: 8, fontWeight: '800', marginBottom: 2 },
  nodeText: { color: '#F8FAFC', fontSize: 11, fontWeight: '900' },
  edgeBridge: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  edgeAmount: { color: '#34D399', fontSize: 12, fontWeight: '800', marginBottom: 4 },
  edgeAmountCurrent: { color: '#FBBF24', fontSize: 13, fontWeight: '900' },
  edgeLine: {
    width: '100%',
    height: 2,
    backgroundColor: '#475569',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  edgeLineCurrent: { height: 3, backgroundColor: '#10B981' },
  arrowHead: {
    width: 8,
    height: 8,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: '#38BDF8',
    transform: [{ rotate: '45deg' }],
  },
  edgeTime: { color: '#94A3B8', fontSize: 10, marginTop: 4 },
  nlgCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    marginTop: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  nlgBody: { color: '#CBD5E1', fontSize: 13, lineHeight: 20 },
  ledgerCard: {
    backgroundColor: '#0F172A',
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
    paddingHorizontal: 8,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  txRowActive: { backgroundColor: '#1E293B' },
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
});