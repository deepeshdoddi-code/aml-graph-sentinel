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
    std::string typology;       // "Cyclic Round-Tripping", "Fan-In / Fan-Out Dispersion", "Rapid Pass-Through (Mule)"
    double risk_score;          // 0.0 to 100.0
    double total_volume;
    int hop_count;
    long long time_span_minutes;
    double retention_ratio;
    std::vector<std::string> accounts;
    std::vector<Transaction> transactions;
    std::string summary;
};

struct MetricSet {
    double precision = 0.0;
    double recall = 0.0;
    double f1 = 0.0;
    int true_positives = 0;
    int false_positives = 0;
    int false_negatives = 0;
};

struct EvaluationReport {
    MetricSet baseline;
    MetricSet graph_engine;
};

class TemporalAMLGraph {
public:
    // Hyperparameters for Temporal Flow-Conservation Graphlets (TFCG)
    static constexpr long long MULE_WINDOW_SEC = 86400;         // 24 hours
    static constexpr long long CYCLE_WINDOW_SEC = 86400 * 7;    // 7 days
    static constexpr double FEE_TOLERANCE = 0.05;               // 5% max peeling drop-off
    static constexpr double BASELINE_THRESHOLD = 10000.0;       // Legacy $10k rule

    void addTransaction(const Transaction& tx) {
        all_transactions_.push_back(tx);
        out_edges_[tx.src].push_back(tx);
        in_edges_[tx.dst].push_back(tx);
        accounts_.insert(tx.src);
        accounts_.insert(tx.dst);
        if (tx.is_laundering) {
            ground_truth_illicit_.insert(tx.tx_id);
        }
    }

    size_t numTransactions() const { return all_transactions_.size(); }
    size_t numAccounts() const { return accounts_.size(); }

private:
    std::vector<Transaction> all_transactions_;
    std::unordered_map<std::string, std::vector<Transaction>> out_edges_;
    std::unordered_map<std::string, std::vector<Transaction>> in_edges_;
    std::unordered_set<std::string> accounts_;
    std::unordered_set<std::string> ground_truth_illicit_;
};

} // namespace aml