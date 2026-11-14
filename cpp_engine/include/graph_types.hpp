#pragma once
#include <string>
#include <vector>
#include <unordered_map>
#include <unordered_set>

namespace aml {

struct Transaction {
    std::string tx_id;
    std::string src;
    std::string dst;
    double amount;
    long long timestamp;
    std::string time_label;
    bool is_laundering;
};

struct Alert {
    std::string cluster_id;
    std::string typology;
    double risk_score;
    double total_volume;
    int hop_count;
    long long time_span_minutes;
    double retention_ratio;
    std::string summary;
    std::vector<std::string> accounts;
    std::vector<Transaction> transactions;
};

struct MetricSet {
    int true_positives = 0;
    int false_positives = 0;
    int false_negatives = 0;
    double precision = 0.0;
    double recall = 0.0;
    double f1 = 0.0;
};

struct EvaluationReport {
    MetricSet baseline;
    MetricSet graph_engine;
};

} // namespace aml