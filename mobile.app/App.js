import React, { useState, useEffect } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import DashboardScreen from './src/screens/DashboardScreen';
import TrailDetailScreen from './src/screens/TrailDetailScreen';
import {
  fetchAMLData,
  triggerLiveScan,
  buildInjectedAlert,
  parseCustomCsvToAlert,
  CURRENCIES,
} from './src/api/amlClient';

export default function App() {
  const [amlData, setAmlData] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('INR');
  const [socStatuses, setSocStatuses] = useState({});
  const [frozenAccounts, setFrozenAccounts] = useState({});

  const loadData = async () => {
    setLoading(true);
    const data = await fetchAMLData();
    setAmlData(data);
    setLoading(false);
  };

  const handleRunScan = async () => {
    setLoading(true);
    const data = await triggerLiveScan();
    setAmlData(data);
    setLoading(false);
  };

  const handleInjectRing = (customAmountInSelectedCurrency, originAcc, isRedTeam = false) => {
    const rate = (CURRENCIES[currency] || CURRENCIES.USD).rate;
    const amountUSD = customAmountInSelectedCurrency
      ? Number(customAmountInSelectedCurrency) / rate
      : 65000;
    const newAlert = buildInjectedAlert(amountUSD, originAcc || 'ACC_777', isRedTeam);

    setAmlData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        dataset_summary: {
          ...prev.dataset_summary,
          total_transactions: (prev.dataset_summary.total_transactions || 5000) + 3,
        },
        alerts: [newAlert, ...prev.alerts],
      };
    });
  };

  const handleIngestCsvText = (csvText) => {
    const rate = (CURRENCIES[currency] || CURRENCIES.USD).rate;
    const csvAlert = parseCustomCsvToAlert(csvText, rate);

    setAmlData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        dataset_summary: {
          ...prev.dataset_summary,
          total_transactions:
            (prev.dataset_summary.total_transactions || 5000) + csvAlert.transactions.length,
        },
        alerts: [csvAlert, ...prev.alerts],
      };
    });
  };

  const handleCycleSocStatus = (clusterId) => {
    const order = ['L1 TRIAGE', 'L2 FORENSICS', 'ACCOUNTS FROZEN', 'SAR FILED ✓'];
    const curr = socStatuses[clusterId] || 'L1 TRIAGE';
    const next = order[(order.indexOf(curr) + 1) % order.length];
    setSocStatuses((prev) => ({ ...prev, [clusterId]: next }));
  };

  const handleToggleFreezeAccount = (accId) => {
    setFrozenAccounts((prev) => ({ ...prev, [accId]: !prev[accId] }));
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070B14" />
      {selectedAlert ? (
        <TrailDetailScreen
          alert={selectedAlert}
          currency={currency}
          onChangeCurrency={setCurrency}
          socStatus={socStatuses[selectedAlert.cluster_id] || 'L1 TRIAGE'}
          onCycleSocStatus={() => handleCycleSocStatus(selectedAlert.cluster_id)}
          frozenAccounts={frozenAccounts}
          onToggleFreezeAccount={handleToggleFreezeAccount}
          onBack={() => setSelectedAlert(null)}
        />
      ) : (
        <DashboardScreen
          data={amlData}
          loading={loading}
          currency={currency}
          onChangeCurrency={setCurrency}
          socStatuses={socStatuses}
          onCycleSocStatus={handleCycleSocStatus}
          frozenAccounts={frozenAccounts}
          onSelectAlert={(alert) => setSelectedAlert(alert)}
          onRunScan={handleRunScan}
          onInjectRing={handleInjectRing}
          onIngestCsv={handleIngestCsvText}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070B14',
  },
});