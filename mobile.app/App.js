import React, { useState, useEffect } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import DashboardScreen from './src/screens/DashboardScreen';
import TrailDetailScreen from './src/screens/TrailDetailScreen';
import { fetchAMLData, triggerLiveScan } from './src/api/amlClient';

export default function App() {
  const [amlData, setAmlData] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    loadData();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />
      {selectedAlert ? (
        <TrailDetailScreen
          alert={selectedAlert}
          onBack={() => setSelectedAlert(null)}
        />
      ) : (
        <DashboardScreen
          data={amlData}
          loading={loading}
          onSelectAlert={(alert) => setSelectedAlert(alert)}
          onRunScan={handleRunScan}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
});