# AML Graph Sentinel: Temporal Flow-Conservation Graphlets (TFCG)

**Author:** Cache Memory 
**Repository:** `deepeshdoddi-code/aml-graph-sentinel`

## 1. Overview & Problem Statement
Legacy rule-based Anti-Money Laundering (AML) systems inspect transactions in isolation (e.g., flagging single transfers above $10,000). Criminal syndicates bypass these static thresholds through **smurfing (structuring)**, **rapid mule pass-throughs**, and **cyclic round-tripping**. 

**AML Graph Sentinel** models financial transactions as a **Temporal, Directed, Weighted Multi-Graph** $G = (V, E, T, W)$. Using a custom C++20 graph detection engine, it identifies time-respecting topological motifs where monetary flow is conserved across hops within a bounded fee tolerance ($\epsilon \le 0.05$).

---

## 2. System Architecture

```text
+-----------------------------------------------------------------------+
|                   React Native Mobile Dashboard                       |
|  - F1 vs. Baseline Banner   - Risk-Ranked Feed   - SVG Trail Graph    |
+-----------------------------------+-----------------------------------+
                                    | REST API (JSON over HTTP)
                                    v
+-----------------------------------------------------------------------+
|                     Python FastAPI Bridge Server                      |
|  - GET /api/alerts          - POST /api/scan (Subprocess CLI Runner)  |
+-----------------------------------+-----------------------------------+
                                    | Executes Binary & Streams JSON
                                    v
+-----------------------------------------------------------------------+
|                C++20 TFCG Core Detection Engine (CMake)               |
|  - Chronological Edge Sorting       - Temporal DFS Cycle Detector     |
|  - Fan-In / Fan-Out Smurfing        - Rapid Pass-Through (Mule)       |
|  - Automated NLG Trail Summarizer   - Precision / Recall / F1 Engine  |
+-----------------------------------------------------------------------+