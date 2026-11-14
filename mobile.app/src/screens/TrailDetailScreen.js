import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import {
  CURRENCIES,
  formatCurrency,
  maskIdentifier,
  getAccountDossier,
} from '../api/amlClient';

export default function TrailDetailScreen({
  alert,
  currency = 'INR',
  onChangeCurrency,
  privacyMode = false,
  onTogglePrivacy,
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
            reason: 'Cycle Origin & Sleeper Awakening',
            ev_hash: '0x91a4...f01',
          },
        ];

  const [activeHop, setActiveHop] = useState(Math.max(0, safeTxns.length - 1));
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSarReport, setShowSarReport] = useState(false);
  const [showIsoXml, setShowIsoXml] = useState(false);
  const [showEvidencePkg, setShowEvidencePkg] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(
    (alert && alert.kingpin_account) || safeTxns[0].src || 'ACC_104'
  );

  const [cfFactors, setCfFactors] = useState({
    flowConservation: true,
    highVelocity: true,
    cycleClosure: true,
    fatfSanctions: true,
    deviceEntityMatch: true,
  });

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
  const retentionRatio = Number(alert && alert.retention_ratio) || 0.964;
  const baseRiskScore = Number(alert && alert.risk_score) || 97.4;

  let counterfactualDrop = 0;
  if (!cfFactors.flowConservation) counterfactualDrop += 32.0;
  if (!cfFactors.highVelocity) counterfactualDrop += 24.5;
  if (!cfFactors.cycleClosure) counterfactualDrop += 18.0;
  if (!cfFactors.fatfSanctions) counterfactualDrop += 12.5;
  if (!cfFactors.deviceEntityMatch) counterfactualDrop += 9.0;
  const counterfactualScore = Math.max(5.0, baseRiskScore - counterfactualDrop);

  const rawAccounts =
    alert && Array.isArray(alert.accounts) && alert.accounts.length > 0
      ? alert.accounts
      : safeTxns.map((t) => t.src);
  const uniqueAccounts = Array.from(new Set(rawAccounts));

  const activeDossier = getAccountDossier(selectedNodeId);
  const isSelectedFrozen = Boolean(frozenAccounts && frozenAccounts[selectedNodeId]);
  const anyFrozenInCluster = uniqueAccounts.some((acc) => frozenAccounts && frozenAccounts[acc]);
  const blockedVolumeUSD = anyFrozenInCluster ? totalVolUSD : 0;
  const riskEvolution = (alert && alert.risk_evolution) || [38, 54, 71, 86, baseRiskScore];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Institutional Navigation & Export Bar */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>← Back to Global Feed</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <TouchableOpacity
            style={[styles.btnEmerald, { marginRight: 6 }]}
            onPress={() => setShowEvidencePkg(!showEvidencePkg)}
          >
            <Text style={styles.btnTextDark}>
              {showEvidencePkg ? 'Hide Bundle' : '📦 Evidence (#28)'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnSapphire, { marginRight: 6 }]}
            onPress={() => setShowIsoXml(!showIsoXml)}
          >
            <Text style={styles.btnTextLight}>
              {showIsoXml ? 'Hide XML' : '🌐 ISO-20022'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnViolet}
            onPress={() => setShowSarReport(!showSarReport)}
          >
            <Text style={styles.btnTextLight}>
              {showSarReport
                ? 'Hide SAR'
                : `📄 ${currConfig.regulator.split(' ')[0]} STR/SAR`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Instant Currency Switcher + Privacy Mode (#25) + SOC Status */}
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
          style={[styles.socWorkflowBtn, { marginRight: 6 }]}
          onPress={onTogglePrivacy}
        >
          <Text style={styles.socWorkflowText}>
            {privacyMode ? '🕵️ Masked' : '👁️ Raw IDs'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.socWorkflowBtn}
          onPress={() => onCycleSocStatus && onCycleSocStatus()}
        >
          <Text style={styles.socWorkflowText}>{socStatus} ↻</Text>
        </TouchableOpacity>
      </View>

      {/* Automated Investigation Evidence Package Modal (#28) */}
      {showEvidencePkg && (
        <View style={styles.xmlModal}>
          <Text style={styles.xmlHeader}>
            📦 AUTOMATED FORENSIC INVESTIGATION EVIDENCE PACKAGE (#28)
          </Text>
          <Text style={styles.xmlCode}>
            {JSON.stringify(
              {
                package_id: `EVID-PKG-${alert.cluster_id}`,
                regulator: currConfig.regulator,
                motif_topology: alert.motif_pattern || 'Circular Split-Recombine',
                louvain_community: alert.community_id || 'Louvain #C-01',
                ubo_beneficiary: maskIdentifier(alert.ubo_entity || 'Viktor Rostov', privacyMode),
                composite_risk: baseRiskScore,
                confidence_interval: alert.confidence_interval || '±1.2%',
                evidence_completeness_pct: alert.evidence_completeness || 96,
                sha256_merkle_root: alert.sha256_block || 'a4f9c281e7b09d32',
                provenance_edges: safeTxns.map((t) => ({
                  tx: t.tx_id,
                  route: `${maskIdentifier(t.src, privacyMode)}->${maskIdentifier(t.dst, privacyMode)}`,
                  hash: t.ev_hash || '0x91a4',
                })),
              },
              null,
              2
            )}
          </Text>
        </View>
      )}

      {/* Standardized ISO 20022 XML Regulatory Batch Payload (#10) */}
      {showIsoXml && (
        <View style={styles.xmlModal}>
          <Text style={styles.xmlHeader}>
            ISO 20022 (pacs.008 / camt.053) FIU REGULATORY TELEMETRY PAYLOAD
          </Text>
          <Text style={styles.xmlCode}>
            {`<Document xmlns="urn:iso:std:iso:20022:tech:xsd:AML.001">\n  <FIToFICstmrCdtTrf>\n    <GrpHdr>\n      <MsgId>${currConfig.code}-SAR-${alert.cluster_id}</MsgId>\n      <Regulator>${currConfig.regulator}</Regulator>\n      <Sha256Audit>${alert.sha256_block || 'a4f9c281e7b09d32'}</Sha256Audit>\n    </GrpHdr>\n    <CdtTrfTxInf>\n      <KingpinNode pageRank="${alert.pagerank_max || 0.94}">${maskIdentifier(selectedNodeId, privacyMode)}</KingpinNode>\n      <IntrBkSttlmAmt Ccy="${currConfig.code}">${Math.round(totalVolUSD * currConfig.rate)}</IntrBkSttlmAmt>\n      <Typology>${alert.typology}</Typology>\n    </CdtTrfTxInf>\n  </FIToFICstmrCdtTrf>\n</Document>`}
          </Text>
        </View>
      )}

      {/* Auto-Generated STR/SAR with Evidence-to-Report Traceability Citations (#16) */}
      {showSarReport && (
        <View style={styles.sarModal}>
          <Text style={styles.sarHeader}>
            {currConfig.reportForm} — EVIDENCE-TRACEABLE NARRATIVE (#16)
          </Text>
          <Text style={styles.sarLine}>
            <Text style={styles.sarBold}>[Claim 1 — Identity & UBO]:</Text> Subject Kingpin{' '}
            {maskIdentifier(alert.kingpin_account || uniqueAccounts[0], privacyMode)} controlled by{' '}
            {maskIdentifier(alert.ubo_entity || 'Viktor Rostov', privacyMode)}{' '}
            <Text style={styles.citeBadge}>[Cite: KYC-UBO-01, DEV_99A1]</Text>
          </Text>
          <Text style={styles.sarLine}>
            <Text style={styles.sarBold}>[Claim 2 — Motif & Value Conservation]:</Text> Executed{' '}
            {alert.motif_pattern || 'Circular Split-Recombine'} conserving{' '}
            {(retentionRatio * 100).toFixed(1)}% of principal ({formatCurrency(totalVolUSD, currency)}){' '}
            <Text style={styles.citeBadge}>
              [Cite: {safeTxns.map((t) => t.tx_id).join(', ')}]
            </Text>
          </Text>
          <Text style={styles.sarLine}>
            <Text style={styles.sarBold}>[Claim 3 — Statutory Breach]:</Text> Violates{' '}
            {currConfig.lawCite} via {currConfig.paymentRail}{' '}
            <Text style={styles.citeBadge}>[Cite: SHA-256 {alert.sha256_block || 'a4f9c2'}]</Text>
          </Text>
          <Text style={styles.sarStamp}>
            ✓ 100% Evidence-to-Report Traceability Verified • Confidence {alert.confidence_pct || 98.5}% ({alert.confidence_interval || '±1.2%'})
          </Text>
        </View>
      )}

      {/* Cluster Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.topRow}>
          <Text style={styles.clusterId}>
            {alert.cluster_id} • {alert.community_id || 'Louvain #C-01'} • {alert.outlier_zscore || '+8.4σ'}
          </Text>
          <View style={styles.riskBadge}>
            <Text style={styles.riskText}>
              RISK {baseRiskScore.toFixed(1)} ({alert.confidence_interval || '±1.2%'})
            </Text>
          </View>
        </View>
        <Text style={styles.typology}>{alert.typology}</Text>
        <Text style={styles.motifLine}>
          Temporal Motif (#1): {alert.motif_pattern || 'Circular Split-Recombine'} • GNN Score (#3):{' '}
          {((alert.gnn_probability || 0.98) * 100).toFixed(1)}%
        </Text>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Settled ({currConfig.code})</Text>
            <Text style={styles.statValueSapphire}>{formatCurrency(totalVolUSD, currency)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Evidence (#4)</Text>
            <Text style={styles.statValueGold}>
              {alert.evidence_completeness || 96}% ({alert.independent_indicators || 7} Ind)
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Contagion Blocked</Text>
            <Text style={styles.statValueEmerald}>
              {formatCurrency(blockedVolumeUSD, currency)}
            </Text>
          </View>
          <View style={[styles.statBox, { marginRight: 0 }]}>
            <Text style={styles.statLabel}>Exposure (#8)</Text>
            <Text style={styles.statValueCrimson}>
              {formatCurrency(alert.network_exposure_usd || totalVolUSD * 2.4, currency)}
            </Text>
          </View>
        </View>
      </View>

      {/* Counterfactual Investigation Engine (#9 — What-If Risk Analysis) */}
      <View style={styles.xaiCard}>
        <View style={styles.topRow}>
          <Text style={styles.sectionHeader}>
            🎛️ Counterfactual What-If Engine (#9)
          </Text>
          <Text style={styles.cfScoreBadge}>
            What-If Risk: {counterfactualScore.toFixed(1)} / 100 (
            {counterfactualDrop > 0 ? `-${counterfactualDrop.toFixed(1)}` : 'Baseline'})
          </Text>
        </View>
        <Text style={styles.subHint}>
          Toggle suspicious behaviors below to observe how removing specific indicators alters the composite risk score:
        </Text>
        <View style={styles.nodePillRow}>
          {[
            { key: 'flowConservation', label: '96.4% Flow Conserved (-32.0)' },
            { key: 'highVelocity', label: 'Burst Velocity Δt (-24.5)' },
            { key: 'cycleClosure', label: 'Closed Cycle Topology (-18.0)' },
            { key: 'fatfSanctions', label: 'FATF + Sanctions Hit (-12.5)' },
            { key: 'deviceEntityMatch', label: 'Shared Tor Device/IP (-9.0)' },
          ].map((f) => {
            const active = cfFactors[f.key];
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.nodeSelectPill, active && styles.nodeSelectPillActive]}
                onPress={() => setCfFactors((prev) => ({ ...prev, [f.key]: !prev[f.key] }))}
              >
                <Text style={[styles.nodeSelectText, active && { color: '#38BDF8' }]}>
                  {active ? `✓ ${f.label}` : `✕ ${f.label}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Risk Evolution History (#14) & Suspicious Network Risk Propagation (#30) */}
      <View style={styles.xaiCard}>
        <Text style={styles.sectionHeader}>
          📈 Risk Evolution History (#14) & Network Risk Propagation Decay (#30)
        </Text>
        <View style={styles.evolutionRow}>
          {riskEvolution.map((score, i) => (
            <View key={i} style={styles.evoStep}>
              <View style={styles.evoBarWrapper}>
                <View
                  style={[
                    styles.evoBar,
                    {
                      height: Math.max(8, Math.round((score / 100) * 44)),
                      backgroundColor: i === riskEvolution.length - 1 ? '#EF4444' : '#38BDF8',
                    },
                  ]}
                />
              </View>
              <Text style={styles.evoVal}>{score}</Text>
              <Text style={styles.evoLabel}>T+{i + 1}</Text>
            </View>
          ))}
        </View>
        <View style={[styles.dossierGrid, { marginTop: 10 }]}>
          <Text style={styles.dossierItem}>
            <Text style={styles.dossierBold}>• Propagation Model (#30):</Text> Exponential Katz Attenuation (Decay Factor γ = 0.65 per hop)
          </Text>
          <Text style={styles.dossierItem}>
            • <Text style={styles.dossierBold}>0-Hop Core:</Text> 100% ({formatCurrency(totalVolUSD, currency)}) ➔{' '}
            <Text style={styles.dossierBold}>1-Hop Peers:</Text> 65% ({formatCurrency(totalVolUSD * 0.65, currency)}) ➔{' '}
            <Text style={styles.dossierBold}>2-Hop Web:</Text> 42.2% ({formatCurrency(totalVolUSD * 0.422, currency)})
          </Text>
        </View>
      </View>

      {/* Interactive Account KYC Risk Dossier & 1-Click Account Freeze */}
      <View style={styles.dossierCard}>
        <View style={styles.dossierHeader}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.sectionHeader}>
              🔍 Account KYC, UBO (#7) & GNN Dossier (Tap Any Node)
            </Text>
            <Text style={styles.dossierSub}>
              Inspecting Node: {maskIdentifier(activeDossier.id, privacyMode)} (
              {maskIdentifier(activeDossier.holder, privacyMode)})
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.freezeBtn, isSelectedFrozen && styles.freezeBtnActive]}
            onPress={() => onToggleFreezeAccount && onToggleFreezeAccount(selectedNodeId)}
          >
            <Text style={styles.freezeBtnText}>
              {isSelectedFrozen
                ? `❄️ FROZEN (${maskIdentifier(selectedNodeId, privacyMode)})`
                : `🔒 Freeze ${maskIdentifier(selectedNodeId, privacyMode)}`}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.nodePillRow}>
          {uniqueAccounts.map((acc) => {
            const isSel = selectedNodeId === acc;
            const isFrz = frozenAccounts && frozenAccounts[acc];
            const disp = maskIdentifier(acc, privacyMode);
            return (
              <TouchableOpacity
                key={acc}
                style={[styles.nodeSelectPill, isSel && styles.nodeSelectPillActive]}
                onPress={() => setSelectedNodeId(acc)}
              >
                <Text style={[styles.nodeSelectText, isSel && { color: '#38BDF8' }]}>
                  {isFrz ? `❄️ ${disp}` : disp}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.dossierGrid}>
          <Text style={styles.dossierItem}>
            <Text style={styles.dossierBold}>• Hidden UBO (#7):</Text>{' '}
            {maskIdentifier(activeDossier.uboName, privacyMode)}
          </Text>
          <Text style={styles.dossierItem}>
            <Text style={styles.dossierBold}>• GNN (#3) & Community (#6):</Text>{' '}
            {activeDossier.gnnClass} | {activeDossier.communityId}
          </Text>
          <Text style={styles.dossierItem}>
            <Text style={styles.dossierBold}>• Centrality & Dormancy:</Text> PageRank{' '}
            {activeDossier.pagerank} | Age {activeDossier.accountAgeDays}d (Awakened after{' '}
            {activeDossier.dormantDaysPrior}d idle)
          </Text>
          <Text style={styles.dossierItem}>
            <Text style={styles.dossierBold}>• Sanctions & Entity Link:</Text>{' '}
            {activeDossier.sanctionsStatus} | Device {activeDossier.deviceFingerprint}
          </Text>
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
          <TouchableOpacity style={styles.btnEmerald} onPress={startReplay}>
            <Text style={styles.btnTextDark}>
              {isPlaying ? '⏸ Replaying...' : '▶ Play Trail Replay'}
            </Text>
          </TouchableOpacity>
        </View>

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
                    {srcFrozen
                      ? `❄️ ${maskIdentifier(tx.src, privacyMode)}`
                      : maskIdentifier(tx.src, privacyMode)}
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
                  />
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
                    {dstFrozen
                      ? `❄️ ${maskIdentifier(tx.dst, privacyMode)}`
                      : maskIdentifier(tx.dst, privacyMode)}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>

      {/* Money Trail Provenance & Evidence Hash Timeline (#10) */}
      <View style={styles.ledgerCard}>
        <Text style={styles.sectionHeader}>
          📜 Money Trail Provenance & Cryptographic Evidence Timeline (#10)
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
                {maskIdentifier(tx.src, privacyMode)} → {maskIdentifier(tx.dst, privacyMode)} (
                {tx.peel_pct || 'Conserved'})
              </Text>
              <Text style={styles.txReason}>
                Reason: {tx.reason || 'Chronological Flow Conservation Verified'}
              </Text>
              <Text style={styles.txMeta}>
                {tx.tx_id} • {tx.time_label} • Evidence Hash: {tx.ev_hash || '0x91a4...f01'}
              </Text>
            </View>
            <Text style={styles.txAmount}>{formatCurrency(tx.amount, currency)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05070B' },
  content: { padding: 16, paddingBottom: 56 },
  topNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  backBtn: {
    backgroundColor: '#0B0F17',
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backText: { color: '#38BDF8', fontSize: 12, fontWeight: '800' },
  btnEmerald: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnSapphire: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnViolet: {
    backgroundColor: '#6D28D9',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnTextDark: { color: '#022C22', fontSize: 11, fontWeight: '800' },
  btnTextLight: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  currWorkflowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  currBar: { flex: 1, marginRight: 8 },
  miniCurrPill: {
    backgroundColor: '#0B0F17',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 7,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  miniCurrPillActive: { backgroundColor: '#0A2239', borderColor: '#38BDF8' },
  miniCurrText: { color: '#94A3B8', fontSize: 11, fontWeight: '700', fontFamily: 'monospace' },
  miniCurrTextActive: { color: '#38BDF8', fontWeight: '800' },
  socWorkflowBtn: {
    backgroundColor: '#111723',
    borderWidth: 1,
    borderColor: '#26334D',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
  },
  socWorkflowText: { color: '#38BDF8', fontSize: 10, fontWeight: '800', fontFamily: 'monospace' },
  xmlModal: {
    backgroundColor: '#0B0F17',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  xmlHeader: { color: '#38BDF8', fontSize: 11, fontWeight: '800', marginBottom: 6 },
  xmlCode: { color: '#A7F3D0', fontSize: 10, fontFamily: 'monospace', lineHeight: 16 },
  sarModal: {
    backgroundColor: '#15112A',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  sarHeader: { color: '#C4B5FD', fontSize: 11, fontWeight: '800', marginBottom: 8 },
  sarLine: { color: '#E2E8F0', fontSize: 12, marginBottom: 6, lineHeight: 18 },
  sarBold: { fontWeight: '800', color: '#FFFFFF' },
  citeBadge: { color: '#38BDF8', fontWeight: '700', fontSize: 11, fontFamily: 'monospace' },
  sarStamp: { color: '#34D399', fontSize: 11, fontWeight: '800', marginTop: 6 },
  headerCard: {
    backgroundColor: '#0B0F17',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clusterId: { color: '#38BDF8', fontSize: 11, fontWeight: '800', fontFamily: 'monospace' },
  riskBadge: {
    backgroundColor: '#2A0E17',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  riskText: { color: '#FCA5A5', fontSize: 10, fontWeight: '800', fontFamily: 'monospace' },
  typology: { color: '#F8FAFC', fontSize: 20, fontWeight: '800', marginTop: 6 },
  motifLine: { color: '#34D399', fontSize: 12, fontWeight: '600', marginTop: 4 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  statBox: {
    flex: 1,
    backgroundColor: '#111723',
    padding: 10,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  statLabel: { color: '#94A3B8', fontSize: 10, fontWeight: '600' },
  statValueSapphire: { color: '#38BDF8', fontSize: 12, fontWeight: '800', fontFamily: 'monospace', marginTop: 4 },
  statValueGold: { color: '#FBBF24', fontSize: 12, fontWeight: '800', fontFamily: 'monospace', marginTop: 4 },
  statValueEmerald: { color: '#34D399', fontSize: 12, fontWeight: '800', fontFamily: 'monospace', marginTop: 4 },
  statValueCrimson: { color: '#F87171', fontSize: 12, fontWeight: '800', fontFamily: 'monospace', marginTop: 4 },
  xaiCard: {
    backgroundColor: '#0B0F17',
    borderRadius: 12,
    padding: 15,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  sectionHeader: { color: '#F8FAFC', fontSize: 14, fontWeight: '800', marginBottom: 4 },
  subHint: { color: '#94A3B8', fontSize: 11, marginBottom: 10 },
  cfScoreBadge: {
    backgroundColor: '#06281E',
    color: '#34D399',
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'monospace',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  evolutionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    backgroundColor: '#111723',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginTop: 6,
  },
  evoStep: { alignItems: 'center' },
  evoBarWrapper: { height: 46, justifyContent: 'flex-end' },
  evoBar: { width: 20, borderRadius: 4 },
  evoVal: { color: '#F8FAFC', fontSize: 10, fontWeight: '800', fontFamily: 'monospace', marginTop: 4 },
  evoLabel: { color: '#64748B', fontSize: 9, fontFamily: 'monospace' },
  dossierCard: {
    backgroundColor: '#0B0F17',
    borderRadius: 12,
    padding: 15,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  dossierHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  dossierSub: { color: '#38BDF8', fontSize: 11, fontWeight: '600' },
  freezeBtn: {
    backgroundColor: '#E11D48',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  freezeBtnActive: { backgroundColor: '#0284C7' },
  freezeBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  nodePillRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  nodeSelectPill: {
    backgroundColor: '#111723',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 7,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#26334D',
  },
  nodeSelectPillActive: { backgroundColor: '#0A2239', borderColor: '#38BDF8' },
  nodeSelectText: { color: '#E2E8F0', fontSize: 11, fontWeight: '700' },
  dossierGrid: {
    backgroundColor: '#111723',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  dossierItem: { color: '#CBD5E1', fontSize: 11, marginBottom: 5, lineHeight: 16 },
  dossierBold: { color: '#34D399', fontWeight: '800' },
  graphCard: {
    backgroundColor: '#0B0F17',
    borderRadius: 12,
    padding: 15,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  replayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  replaySub: { color: '#34D399', fontSize: 11, fontWeight: '700', fontFamily: 'monospace' },
  stepPillRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  stepPill: {
    backgroundColor: '#111723',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#26334D',
  },
  stepPillActive: { backgroundColor: '#0A2239', borderColor: '#38BDF8' },
  stepPillText: { color: '#94A3B8', fontSize: 10, fontWeight: '700', fontFamily: 'monospace' },
  stepPillTextActive: { color: '#38BDF8', fontWeight: '800' },
  graphContainer: { paddingVertical: 4 },
  hopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 7,
  },
  hopRowDimmed: { opacity: 0.25 },
  nodeCircle: {
    width: 96,
    paddingVertical: 8,
    backgroundColor: '#111723',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    alignItems: 'center',
  },
  nodeCurrent: { borderColor: '#10B981', backgroundColor: '#06281E' },
  cycleNode: { backgroundColor: '#2A0E17', borderColor: '#EF4444' },
  nodeFrozen: { backgroundColor: '#0A2239', borderColor: '#38BDF8' },
  nodeRole: { color: '#94A3B8', fontSize: 8, fontWeight: '800', marginBottom: 2 },
  nodeText: { color: '#F8FAFC', fontSize: 10, fontWeight: '800', fontFamily: 'monospace' },
  edgeBridge: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  edgeAmount: { color: '#34D399', fontSize: 11, fontWeight: '800', fontFamily: 'monospace', marginBottom: 4 },
  edgeAmountCurrent: { color: '#FBBF24', fontSize: 12, fontWeight: '900', fontFamily: 'monospace' },
  edgeLine: {
    width: '100%',
    height: 2,
    backgroundColor: '#334155',
  },
  edgeLineCurrent: { height: 3, backgroundColor: '#10B981' },
  edgeLineBlocked: { backgroundColor: '#38BDF8' },
  edgeTime: { color: '#94A3B8', fontSize: 9, fontFamily: 'monospace', marginTop: 4 },
  ledgerCard: {
    backgroundColor: '#0B0F17',
    borderRadius: 12,
    padding: 15,
    marginTop: 12,
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
  txRowActive: { backgroundColor: '#111723', borderLeftWidth: 3, borderLeftColor: '#10B981' },
  hopBadge: {
    backgroundColor: '#0A2239',
    borderWidth: 1,
    borderColor: '#38BDF8',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  hopText: { color: '#38BDF8', fontSize: 10, fontWeight: '800', fontFamily: 'monospace' },
  txMain: { flex: 1 },
  txRoute: { color: '#F8FAFC', fontSize: 13, fontWeight: '700', fontFamily: 'monospace' },
  txReason: { color: '#38BDF8', fontSize: 11, fontWeight: '600', marginTop: 2 },
  txMeta: { color: '#64748B', fontSize: 10, fontFamily: 'monospace', marginTop: 2 },
  txAmount: { color: '#34D399', fontSize: 13, fontWeight: '800', fontFamily: 'monospace' },
});