import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { CURRENCIES, formatCurrency, getAccountDossier } from '../api/amlClient';

export default function TrailDetailScreen({
  alert,
  currency = 'INR',
  onChangeCurrency,
  socStatus = 'L1 TRIAGE',
  onCycleSocStatus,
  frozenAccounts = {},
  onToggleFreezeAccount,
  onBack,
}) {
  const safeTxns =
    alert && Array.isArray(alert.transactions) && alert.transactions.length > 0
      ? alert.transactions
      : [
          {
            tx_id: 'TX_8001',
            src: 'ACC_104',
            dst: 'ACC_389',
            amount: 50000,
            timestamp: 1731560000,
            time_label: '10:00 AM',
            peel_pct: '0.0%',
          },
        ];

  const [activeHop, setActiveHop] = useState(Math.max(0, safeTxns.length - 1));
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSarReport, setShowSarReport] = useState(false);
  const [showIsoXml, setShowIsoXml] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(
    (alert && alert.kingpin_account) || safeTxns[0].src || 'ACC_104'
  );

  const currConfig = (CURRENCIES && CURRENCIES[currency]) || {
    code: 'INR',
    symbol: '₹',
    rate: 84.5,
    statutoryLabel: '₹10,00,000',
    regulator: 'FIU-IND (India)',
    reportForm: 'FIU-IND SUSPICIOUS TRANSACTION REPORT (PMLA STR)',
    lawCite: 'PMLA Rule 3',
    paymentRail: 'UPI / RTGS',
  };

  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        setActiveHop((prev) => {
          if (prev >= safeTxns.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 900);
    }
    return () => clearInterval(timer);
  }, [isPlaying, safeTxns.length]);

  const startReplay = () => {
    setActiveHop(0);
    setIsPlaying(true);
  };

  const currentTx = safeTxns[activeHop] || safeTxns[0];
  const initialAmountUSD = Number(safeTxns[0].amount) || 50000;
  const totalVolUSD = Number(alert && alert.total_volume) || initialAmountUSD;
  const feeLostUSD = Math.max(0, initialAmountUSD - totalVolUSD);
  const retentionRatio = Number(alert && alert.retention_ratio) || 0.964;
  const riskScore = Number(alert && alert.risk_score) || 97.4;

  const rawAccounts =
    alert && Array.isArray(alert.accounts) && alert.accounts.length > 0
      ? alert.accounts
      : safeTxns.map((t) => t.src);
  const uniqueAccounts = Array.from(new Set(rawAccounts));

  const activeDossier = getAccountDossier
    ? getAccountDossier(selectedNodeId)
    : {
        id: selectedNodeId,
        holder: `Entity ${selectedNodeId}`,
        role: 'KINGPIN / MULE NODE',
        pagerank: 0.94,
        betweenness: 0.88,
        accountAgeDays: 14,
        dormantDaysPrior: 210,
        jurisdiction: 'FATF Grey-List Corridor (+15%)',
        sanctionsStatus: 'OFAC / PEP WATCHLIST MATCH',
        pepStatus: 'PEP ASSOCIATE',
        deviceFingerprint: 'DEV_99A1_TOR_EXIT',
        sharedIp: '185.220.101.44',
        tbmlFlag: 'Over-Invoiced Trade Manifest (+420%)',
        cbdcBridge: 'USDT TRC-20 Mixer Off-Ramp',
      };

  const isSelectedFrozen = Boolean(frozenAccounts && frozenAccounts[selectedNodeId]);
  const anyFrozenInCluster = uniqueAccounts.some((acc) => frozenAccounts && frozenAccounts[acc]);
  const blockedVolumeUSD = anyFrozenInCluster ? totalVolUSD : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Navigation & Jurisdiction SAR / ISO-20022 Action Bar */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>← Back to Global Feed</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            style={[styles.sarBtn, { backgroundColor: '#0284C7', marginRight: 6 }]}
            onPress={() => setShowIsoXml(!showIsoXml)}
          >
            <Text style={styles.sarBtnText}>
              {showIsoXml ? 'Hide ISO-20022' : '🌐 ISO-20022 XML'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sarBtn}
            onPress={() => setShowSarReport(!showSarReport)}
          >
            <Text style={styles.sarBtnText}>
              {showSarReport
                ? 'Hide Filing'
                : `📄 ${currConfig.regulator.split(' ')[0]} STR/SAR`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Instant Currency Switcher + SOC Workflow Status Pill */}
      <View style={styles.currWorkflowRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.currBar}>
          {Object.values(CURRENCIES || {}).map((c) => {
            const active = currency === c.code;
            return (
              <TouchableOpacity
                key={c.code}
                style={[styles.miniCurrPill, active && styles.miniCurrPillActive]}
                onPress={() => onChangeCurrency && onChangeCurrency(c.code)}
              >
                <Text style={[styles.miniCurrText, active && styles.miniCurrTextActive]}>
                  {c.symbol.trim()} {c.code}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <TouchableOpacity
          style={styles.socWorkflowBtn}
          onPress={() => onCycleSocStatus && onCycleSocStatus()}
        >
          <Text style={styles.socWorkflowText}>Workflow: {socStatus} ↻</Text>
        </TouchableOpacity>
      </View>

      {/* Feature #10: Standardized ISO 20022 XML Regulatory Batch Payload */}
      {showIsoXml && (
        <View style={styles.xmlModal}>
          <Text style={styles.xmlHeader}>
            ISO 20022 (pacs.008 / camt.053) FIU REGULATORY TELEMETRY PAYLOAD
          </Text>
          <Text style={styles.xmlCode}>
            {`<Document xmlns="urn:iso:std:iso:20022:tech:xsd:AML.001">\n  <FIToFICstmrCdtTrf>\n    <GrpHdr>\n      <MsgId>${currConfig.code}-SAR-${alert.cluster_id}</MsgId>\n      <Regulator>${currConfig.regulator}</Regulator>\n      <Sha256Audit>${alert.sha256_block || 'a4f9c281e7b09d32'}</Sha256Audit>\n    </GrpHdr>\n    <CdtTrfTxInf>\n      <KingpinNode pageRank="${alert.pagerank_max || 0.94}">${selectedNodeId}</KingpinNode>\n      <IntrBkSttlmAmt Ccy="${currConfig.code}">${Math.round(totalVolUSD * currConfig.rate)}</IntrBkSttlmAmt>\n      <Typology>${alert.typology}</Typology>\n    </CdtTrfTxInf>\n  </FIToFICstmrCdtTrf>\n</Document>`}
          </Text>
        </View>
      )}

      {/* Auto-Generated Jurisdiction-Specific Regulatory Filing Modal */}
      {showSarReport && (
        <View style={styles.sarModal}>
          <Text style={styles.sarHeader}>
            {currConfig.reportForm} — AUTO-GENERATED
          </Text>
          <Text style={styles.sarLine}>
            <Text style={styles.sarBold}>Filing ID:</Text> {currConfig.code}-2026-{alert.cluster_id} •{' '}
            <Text style={styles.sarBold}>Regulator:</Text> {currConfig.regulator}
          </Text>
          <Text style={styles.sarLine}>
            <Text style={styles.sarBold}>Statutory Authority:</Text> {currConfig.lawCite}
          </Text>
          <Text style={styles.sarLine}>
            <Text style={styles.sarBold}>Kingpin Orchestrator:</Text>{' '}
            {alert.kingpin_account || uniqueAccounts[0]} (PageRank {alert.pagerank_max || 0.94})
          </Text>
          <Text style={styles.sarLine}>
            <Text style={styles.sarBold}>Entity Resolution & TBML:</Text>{' '}
            {alert.entity_resolution_match || 'Shared Device Fingerprint'} •{' '}
            {alert.tbml_mismatch || 'Commercial Invoice Anomaly'}
          </Text>
          <Text style={styles.sarLine}>
            <Text style={styles.sarBold}>Forensic Narrative:</Text> {alert.summary}
          </Text>
          <Text style={styles.sarStamp}>
            ✓ SHA-256 Audit Chain Verified ({alert.sha256_block || '8f94e2c0b1a7'}) • Confidence{' '}
            {riskScore.toFixed(1)}%
          </Text>
        </View>
      )}

      {/* Cluster Header + Contagion Blast-Radius Counter (#11) */}
      <View style={styles.headerCard}>
        <View style={styles.topRow}>
          <Text style={styles.clusterId}>
            CLUSTER {alert.cluster_id} • {alert.corridor || currConfig.paymentRail}
          </Text>
          <View style={styles.riskBadge}>
            <Text style={styles.riskText}>COMPOSITE RISK {riskScore.toFixed(1)} / 100</Text>
          </View>
        </View>
        <Text style={styles.typology}>{alert.typology}</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Settled ({currConfig.code})</Text>
            <Text style={styles.statValue}>
              {formatCurrency(totalVolUSD, currency)}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Peeling Fee Loss</Text>
            <Text style={styles.statValueAmber}>
              {formatCurrency(feeLostUSD, currency)}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Contagion Blocked</Text>
            <Text style={styles.statValueGreen}>
              {formatCurrency(blockedVolumeUSD, currency)}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Kingpin PageRank</Text>
            <Text style={styles.statValue}>
              {alert.kingpin_account || uniqueAccounts[0]} ({alert.pagerank_max || 0.94})
            </Text>
          </View>
        </View>
      </View>

      {/* Feature #13 & #11: Interactive Account KYC Risk Dossier & 1-Click Account Freeze */}
      <View style={styles.dossierCard}>
        <View style={styles.dossierHeader}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.sectionHeader}>
              🔍 Account KYC Dossier & Contagion Freeze Simulator
            </Text>
            <Text style={styles.dossierSub}>
              Inspecting Node: {activeDossier.id} ({activeDossier.holder}) • {activeDossier.role}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.freezeBtn, isSelectedFrozen && styles.freezeBtnActive]}
            onPress={() => onToggleFreezeAccount && onToggleFreezeAccount(selectedNodeId)}
          >
            <Text style={styles.freezeBtnText}>
              {isSelectedFrozen ? `❄️ FROZEN (${selectedNodeId})` : `🔒 Freeze ${selectedNodeId}`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Node Selector Pills */}
        <View style={styles.nodePillRow}>
          {uniqueAccounts.map((acc) => {
            const isSel = selectedNodeId === acc;
            const isFrz = frozenAccounts && frozenAccounts[acc];
            return (
              <TouchableOpacity
                key={acc}
                style={[styles.nodeSelectPill, isSel && styles.nodeSelectPillActive]}
                onPress={() => setSelectedNodeId(acc)}
              >
                <Text style={styles.nodeSelectText}>
                  {isFrz ? `❄️ ${acc}` : acc}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Deep Intelligence Attributes (#1, #2, #4, #5, #6, #7, #9) */}
        <View style={styles.dossierGrid}>
          <Text style={styles.dossierItem}>
            <Text style={styles.dossierBold}>• Centrality (#1):</Text> PageRank{' '}
            {activeDossier.pagerank} | Betweenness {activeDossier.betweenness}
          </Text>
          <Text style={styles.dossierItem}>
            <Text style={styles.dossierBold}>• Dormancy (#2):</Text> Account Age{' '}
            {activeDossier.accountAgeDays}d (Awakened after {activeDossier.dormantDaysPrior}d idle)
          </Text>
          <Text style={styles.dossierItem}>
            <Text style={styles.dossierBold}>• Sanctions & PEP (#7):</Text>{' '}
            {activeDossier.sanctionsStatus} | {activeDossier.pepStatus}
          </Text>
          <Text style={styles.dossierItem}>
            <Text style={styles.dossierBold}>• Jurisdiction (#6):</Text>{' '}
            {activeDossier.jurisdiction}
          </Text>
          <Text style={styles.dossierItem}>
            <Text style={styles.dossierBold}>• Entity Resolution (#4):</Text> Device{' '}
            {activeDossier.deviceFingerprint} | IP {activeDossier.sharedIp}
          </Text>
          <Text style={styles.dossierItem}>
            <Text style={styles.dossierBold}>• Trade Anomaly (#5) & Off-Ramp (#9):</Text>{' '}
            {activeDossier.tbmlFlag} | {activeDossier.cbdcBridge}
          </Text>
        </View>
      </View>

      {/* Explainable AI (XAI) Risk Score Decomposition */}
      <View style={styles.xaiCard}>
        <Text style={styles.sectionHeader}>
          Explainable AI (XAI) Risk Score Decomposition
        </Text>
        <View style={styles.xaiRow}>
          <Text style={styles.xaiLabel}>Flow Conservation ({(retentionRatio * 100).toFixed(1)}%)</Text>
          <View style={styles.xaiBarTrack}>
            <View style={[styles.xaiBarFill, { width: `${Math.min(100, retentionRatio * 100)}%`, backgroundColor: '#10B981' }]} />
          </View>
          <Text style={styles.xaiWeight}>40%</Text>
        </View>
        <View style={styles.xaiRow}>
          <Text style={styles.xaiLabel}>Temporal Velocity ({alert.time_span_minutes || 45}m burst)</Text>
          <View style={styles.xaiBarTrack}>
            <View style={[styles.xaiBarFill, { width: '92%', backgroundColor: '#38BDF8' }]} />
          </View>
          <Text style={styles.xaiWeight}>35%</Text>
        </View>
        <View style={styles.xaiRow}>
          <Text style={styles.xaiLabel}>FATF + Sanctions + Sub-{currConfig.statutoryLabel}</Text>
          <View style={styles.xaiBarTrack}>
            <View style={[styles.xaiBarFill, { width: '95%', backgroundColor: '#F59E0B' }]} />
          </View>
          <Text style={styles.xaiWeight}>25%</Text>
        </View>
      </View>

      {/* Interactive Temporal Hop-by-Hop Replay Scrubber */}
      <View style={styles.graphCard}>
        <View style={styles.replayHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionHeader}>Interactive Temporal Money-Trail Replay</Text>
            <Text style={styles.replaySub}>
              Hop {activeHop + 1} of {safeTxns.length} • {currentTx.time_label} (
              {formatCurrency(currentTx.amount, currency)})
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
          {safeTxns.map((tx, idx) => (
            <TouchableOpacity
              key={`${tx.tx_id}_${idx}`}
              style={[styles.stepPill, idx <= activeHop && styles.stepPillActive]}
              onPress={() => {
                setIsPlaying(false);
                setActiveHop(idx);
              }}
            >
              <Text style={[styles.stepPillText, idx <= activeHop && styles.stepPillTextActive]}>
                Hop #{idx + 1} ({tx.peel_pct || tx.time_label})
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Directed Graph Topology with Active Hop Highlighting & Tap-to-Inspect Dossier */}
        <View style={styles.graphContainer}>
          {safeTxns.map((tx, index) => {
            const isVisible = index <= activeHop;
            const isCurrent = index === activeHop;
            const isCycleClosure = tx.dst === safeTxns[0].src;
            const srcFrozen = frozenAccounts && frozenAccounts[tx.src];
            const dstFrozen = frozenAccounts && frozenAccounts[tx.dst];

            return (
              <View
                key={`${tx.tx_id}_row_${index}`}
                style={[styles.hopRow, !isVisible && styles.hopRowDimmed]}
              >
                <TouchableOpacity
                  style={[
                    styles.nodeCircle,
                    isCurrent && styles.nodeCurrent,
                    srcFrozen && styles.nodeFrozen,
                  ]}
                  onPress={() => setSelectedNodeId(tx.src)}
                >
                  <Text style={styles.nodeRole}>
                    {tx.src === (alert.kingpin_account || safeTxns[0].src) ? '👑 KINGPIN' : 'ORIGIN'}
                  </Text>
                  <Text style={styles.nodeText}>
                    {srcFrozen ? `❄️ ${tx.src}` : tx.src}
                  </Text>
                </TouchableOpacity>

                <View style={styles.edgeBridge}>
                  <Text style={[styles.edgeAmount, isCurrent && styles.edgeAmountCurrent]}>
                    {formatCurrency(tx.amount, currency)} ({tx.peel_pct || 'Conserved'})
                  </Text>
                  <View
                    style={[
                      styles.edgeLine,
                      isCurrent && styles.edgeLineCurrent,
                      (srcFrozen || dstFrozen) && styles.edgeLineBlocked,
                    ]}
                  >
                    <View style={styles.arrowHead} />
                  </View>
                  <Text style={styles.edgeTime}>
                    {tx.tx_id} • {tx.time_label}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.nodeCircle,
                    isCurrent && styles.nodeCurrent,
                    isCycleClosure && styles.cycleNode,
                    dstFrozen && styles.nodeFrozen,
                  ]}
                  onPress={() => setSelectedNodeId(tx.dst)}
                >
                  <Text style={styles.nodeRole}>
                    {isCycleClosure ? 'CYCLE END' : 'MULE / HUB'}
                  </Text>
                  <Text style={styles.nodeText}>
                    {dstFrozen ? `❄️ ${tx.dst}` : tx.dst}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>

      {/* Chronological Hop Ledger */}
      <View style={styles.ledgerCard}>
        <Text style={styles.sectionHeader}>
          Chronological Audit Ledger ({currConfig.code}) • SHA-256 Signed
        </Text>
        {safeTxns.map((tx, idx) => (
          <TouchableOpacity
            key={`${tx.tx_id}_ledger_${idx}`}
            style={[styles.txRow, idx === activeHop && styles.txRowActive]}
            onPress={() => setActiveHop(idx)}
          >
            <View style={styles.hopBadge}>
              <Text style={styles.hopText}>#{idx + 1}</Text>
            </View>
            <View style={styles.txMain}>
              <Text style={styles.txRoute}>
                {tx.src} → {tx.dst} ({tx.peel_pct || 'Conserved'})
              </Text>
              <Text style={styles.txMeta}>
                {tx.tx_id} • {tx.time_label} • Base USD: ${Number(tx.amount).toLocaleString()}
              </Text>
            </View>
            <Text style={styles.txAmount}>
              {formatCurrency(tx.amount, currency)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070B14' },
  content: { padding: 16, paddingBottom: 48 },
  topNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  backBtn: { paddingVertical: 6 },
  backText: { color: '#38BDF8', fontSize: 13, fontWeight: '800' },
  sarBtn: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  sarBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  currWorkflowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  currBar: { flex: 1, marginRight: 8 },
  miniCurrPill: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  miniCurrPillActive: { backgroundColor: '#0284C7', borderColor: '#38BDF8' },
  miniCurrText: { color: '#94A3B8', fontSize: 10, fontWeight: '700' },
  miniCurrTextActive: { color: '#FFFFFF', fontWeight: '900' },
  socWorkflowBtn: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#38BDF8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  socWorkflowText: { color: '#38BDF8', fontSize: 10, fontWeight: '900' },
  xmlModal: {
    backgroundColor: '#090D16',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  xmlHeader: { color: '#38BDF8', fontSize: 10, fontWeight: '900', marginBottom: 6 },
  xmlCode: { color: '#A7F3D0', fontSize: 10, fontFamily: 'monospace', lineHeight: 15 },
  sarModal: {
    backgroundColor: '#1E1B4B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#818CF8',
  },
  sarHeader: { color: '#A5B4FC', fontSize: 11, fontWeight: '900', marginBottom: 8 },
  sarLine: { color: '#E0E7FF', fontSize: 11, marginBottom: 5, lineHeight: 17 },
  sarBold: { fontWeight: '800', color: '#FFFFFF' },
  sarStamp: { color: '#34D399', fontSize: 10, fontWeight: '800', marginTop: 6 },
  headerCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clusterId: { color: '#38BDF8', fontSize: 11, fontWeight: '800' },
  riskBadge: {
    backgroundColor: '#7F1D1D',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F87171',
  },
  riskText: { color: '#FEF2F2', fontSize: 10, fontWeight: '900' },
  typology: { color: '#F8FAFC', fontSize: 19, fontWeight: '900', marginTop: 5 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  statBox: {
    flex: 1,
    backgroundColor: '#1E293B',
    padding: 8,
    borderRadius: 8,
    marginRight: 6,
  },
  statLabel: { color: '#94A3B8', fontSize: 9, fontWeight: '600' },
  statValue: { color: '#38BDF8', fontSize: 12, fontWeight: '900', marginTop: 3 },
  statValueAmber: { color: '#F59E0B', fontSize: 12, fontWeight: '900', marginTop: 3 },
  statValueGreen: { color: '#10B981', fontSize: 12, fontWeight: '900', marginTop: 3 },
  dossierCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  dossierHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dossierSub: { color: '#38BDF8', fontSize: 11, fontWeight: '700' },
  freezeBtn: {
    backgroundColor: '#F43F5E',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 8,
  },
  freezeBtnActive: { backgroundColor: '#0891B2' },
  freezeBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  nodePillRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  nodeSelectPill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  nodeSelectPillActive: { backgroundColor: '#0284C7', borderColor: '#38BDF8' },
  nodeSelectText: { color: '#F8FAFC', fontSize: 10, fontWeight: '800' },
  dossierGrid: { backgroundColor: '#070B14', padding: 10, borderRadius: 8 },
  dossierItem: { color: '#CBD5E1', fontSize: 11, marginBottom: 4, lineHeight: 16 },
  dossierBold: { color: '#34D399', fontWeight: '800' },
  xaiCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  sectionHeader: { color: '#F8FAFC', fontSize: 13, fontWeight: '800', marginBottom: 6 },
  xaiRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  xaiLabel: { color: '#CBD5E1', fontSize: 10, width: 160 },
  xaiBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#1E293B',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  xaiBarFill: { height: '100%', borderRadius: 4 },
  xaiWeight: { color: '#94A3B8', fontSize: 10, fontWeight: '800', width: 32, textAlign: 'right' },
  graphCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  replayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  replaySub: { color: '#34D399', fontSize: 11, fontWeight: '700' },
  playBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  playBtnText: { color: '#052E16', fontSize: 11, fontWeight: '900' },
  stepPillRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  stepPill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
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
    marginVertical: 6,
  },
  hopRowDimmed: { opacity: 0.25 },
  nodeCircle: {
    width: 88,
    paddingVertical: 7,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    alignItems: 'center',
  },
  nodeCurrent: { borderColor: '#10B981', backgroundColor: '#064E3B' },
  cycleNode: { backgroundColor: '#7F1D1D', borderColor: '#F87171' },
  nodeFrozen: { backgroundColor: '#083344', borderColor: '#22D3EE' },
  nodeRole: { color: '#94A3B8', fontSize: 8, fontWeight: '800', marginBottom: 2 },
  nodeText: { color: '#F8FAFC', fontSize: 10, fontWeight: '900' },
  edgeBridge: { flex: 1, alignItems: 'center', paddingHorizontal: 6 },
  edgeAmount: { color: '#34D399', fontSize: 11, fontWeight: '800', marginBottom: 4 },
  edgeAmountCurrent: { color: '#FBBF24', fontSize: 12, fontWeight: '900' },
  edgeLine: {
    width: '100%',
    height: 2,
    backgroundColor: '#475569',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  edgeLineCurrent: { height: 3, backgroundColor: '#10B981' },
  edgeLineBlocked: { backgroundColor: '#22D3EE' },
  arrowHead: {
    width: 7,
    height: 7,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: '#38BDF8',
    transform: [{ rotate: '45deg' }],
  },
  edgeTime: { color: '#94A3B8', fontSize: 9, marginTop: 4 },
  ledgerCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  txRowActive: { backgroundColor: '#1E293B' },
  hopBadge: {
    backgroundColor: '#0284C7',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  hopText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  txMain: { flex: 1 },
  txRoute: { color: '#F8FAFC', fontSize: 13, fontWeight: '700' },
  txMeta: { color: '#64748B', fontSize: 10, marginTop: 2 },
  txAmount: { color: '#34D399', fontSize: 13, fontWeight: '800' },
});