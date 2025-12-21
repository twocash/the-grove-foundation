# The Grove: Distributed Systems Advances for Decentralized AI Networks

# Distributed Systems Advances for Decentralized AI Networks

Jim Calhoun
December 2025 | Grove Deep Dive Series

---

**© 2025 Jim Calhoun / The-Grove.ai Foundation. All rights reserved.**

This document is for informational purposes only and does not constitute legal, financial, or technical advice. The-Grove.ai Foundation makes no warranties, express or implied, regarding the accuracy or completeness of the information contained herein. 

---

<aside>
📋

**Executive Summary**

A decentralized AI infrastructure operating across thousands of residential nodes faces fundamental challenges: dynamic IPs, NAT traversal, intermittent connectivity, and Byzantine fault tolerance on consumer hardware. Recent breakthroughs in P2P networking from 2024-2025 offer practical solutions to each constraint, with production systems like IPFS and libp2p demonstrating viability at scale.

**The core insight: modern P2P systems achieve 70%+ direct connectivity through NAT-constrained residential networks**, with hybrid architectures providing the reliability needed for AI agent coordination. This analysis synthesizes recent academic research and production implementations relevant to building Grove's decentralized village infrastructure.

</aside>

---

## NAT Traversal Reaches Maturity with RTT-Synchronized Hole Punching

The largest empirical study of decentralized NAT traversal—spanning **4.4 million traversal attempts across 85,000+ networks in 167 countries**—establishes a baseline hole-punching success rate of **70% ± 7.1%** for residential networks (arXiv:2510.27500, 2025). When connections succeed, **97.6% succeed on the first attempt**, indicating that failures stem from fundamental NAT incompatibility rather than protocol issues.

This study challenges longstanding assumptions about UDP superiority for NAT traversal. The **libp2p DCUtR** (Direct Connection Upgrade through Relay) protocol achieves statistically indistinguishable success rates for TCP and UDP when using RTT-based synchronization. DCUtR coordinates hole-punching by measuring round-trip time through a relay, then timing simultaneous connection attempts from both peers. The protocol operates through four integrated components:

- **AutoNAT** for distributed reachability testing
- **AutoRelay** for dynamic relay discovery via Kademlia DHT
- **Circuit Relay v2** for resource-limited fallback connectivity
- The synchronization protocol itself

Tailscale's production deployment demonstrates that hybrid approaches achieve **>90% direct connection rates** by combining multiple strategies: birthday paradox probing for symmetric NATs (achieving 50% success after just 174 probes at 100 probes/second), port mapping protocols (UPnP IGD, NAT-PMP, PCP), and their DERP relay network for fallback.

<aside>
⚡

For Grove's residential deployment, **QUIC offers particular advantages**-Liang et al. (arXiv:2408.01791, 2024) show QUIC hole punching is **0.5 RTT faster** than TCP, with connection migration enabling seamless recovery when hole-punched connections fail due to network switches or NAT timeout.

</aside>

## Gossip Protocols Enable Reliable Propagation with O(n) Message Complexity

Propagating updates across unreliable residential networks requires protocols that tolerate high churn and network partitions.

### HyParView

**HyParView** (Leitão, Pereira, Rodrigues, IEEE SRDS 2007) achieves this through a two-view architecture: an active view of 5-6 TCP-connected peers for message dissemination, and a passive view of ~30 peers serving as a recovery pool. This design maintains **90% reliability even at 95% node failure rates**-orders of magnitude more resilient than single-view protocols like Cyclon or Scamp, which drop below 50% reliability at 70% failure.

### Plumtree

**Plumtree** (Epidemic Broadcast Trees, same authors, IEEE SRDS 2007) builds efficient broadcast on top of membership protocols by classifying peers as either "eager" (receiving full messages immediately) or "lazy" (receiving only IHAVE notifications). The eager peers form a spanning tree achieving near-optimal **O(n-1) messages per broadcast**, while lazy peers provide redundancy for tree repair. When a node receives a duplicate message, it demotes the sender to lazy; when it receives IHAVE for a missing message, it promotes the sender to eager and requests the full payload. This self-organization creates efficient broadcast trees that heal automatically from failures.

### GossipSub v1.1

**GossipSub v1.1**, used by Ethereum's Beacon Chain and IPFS, extends these concepts with peer scoring for attack resistance. Kumar et al. (IEEE S&P 2024) formally verified GossipSub's security properties using the ACL2s theorem prover, confirming FileCoin's configuration satisfies all security guarantees while identifying subtle attack vectors in Ethereum 2.0's configuration. The 2024 v1.2 extension adds **IDONTWANT messages** enabling peers to proactively decline duplicate messages, reducing bandwidth waste in high-traffic topics.

## DHT Innovations Address the Content Discovery Bottleneck

Standard Kademlia DHT lookups achieve **O(log n)** message complexity for peer discovery, but content providing-announcing that a node has specific content-remained expensive. IPFS's **Provide Sweep** optimization (Kubo v0.39, 2025) achieves a **97% reduction in DHT lookups** for nodes providing hundreds of thousands of content identifiers. The algorithm batches CIDs by destination DHT servers and sweeps through the keyspace systematically, enabling single nodes to announce millions of CIDs where previous limits were 5-10k.

The libp2p Kademlia implementation separates nodes into client and server modes based on AutoNAT reachability testing. Nodes behind NAT operate as clients (query-only), preventing them from polluting routing tables with unreachable addresses. The IPFS Amino DHT uses a **48-hour provider record TTL with 22-hour republish intervals**, parameters tuned through ProbeLab measurements showing median DHT server session lengths of 4-6 hours on consumer networks.

**Hyperswarm**, used by the Hypercore ecosystem, integrates hole-punching directly into DHT operations-DHT nodes serve as signaling relays for NAT traversal, eliminating the need for separate relay infrastructure. To mitigate Sybil attacks, node IDs depend on IP+port combinations, restricting DHT membership to stable addresses.

## CRDTs and Mixed Consistency Enable Coordination-Free Knowledge Sharing

Conflict-free Replicated Data Types guarantee convergence without coordination—any two nodes that have seen the same updates will have identical state, regardless of the order in which updates arrived. **Delta-state CRDTs** (Almeida, Shoker & Baquero, JPDC 2018) combine the bandwidth efficiency of operation-based CRDTs with the reliability of state-based approaches by transmitting only recent mutations rather than full state.

### Recent Production Implementations

**Loro** (2024) implements the Fugue algorithm with Eg-Walker optimizations from Joseph Gentle, processing **182,000 operations in 56ms**-roughly 2x faster than Yjs and 20x faster than Automerge for typical workloads. Loro stores simple indices rather than complex CRDT metadata, reconstructing structure only when needed during merges and avoiding tombstone accumulation that plagues other implementations.

The 2024 PaPoC workshop produced several advances relevant to Grove:

- Da & Kleppmann extended JSON CRDTs with **move operations** enabling drag-and-drop semantics
- Stewen & Kleppmann designed **undo/redo algorithms** for multi-value registers
- Jacob & Hartenstein developed logical clocks enabling **Byzantine-tolerant CRDTs** that maintain strong eventual consistency even under adversarial conditions

The **LoRe programming model** (Haas et al., ACM TOPLAS 2024) enables verified local-first applications with mixed consistency guarantees.

### Application to Grove

<aside>
🏗️

For Grove's AI agents sharing knowledge with varying consistency requirements, a **tiered approach** is recommended:

- Critical agent identity and authentication via **strong consensus**
- Knowledge graph updates via **Tree CRDTs**
- Observations via **Map CRDTs** with last-writer-wins semantics
- Collaborative metadata via **Counter and Set CRDTs**

This mirrors Azure Cosmos DB's consistency spectrum from linearizable through bounded staleness, session, consistent prefix, to eventual consistency.

</aside>

## Lightweight Consensus Reaches Sub-Second Finality at Scale

Byzantine fault tolerance traditionally required **O(n²) message complexity**, limiting practical deployments to ~100 nodes. Recent advances dramatically reduce this barrier.

**Autobahn** (Giridharan et al., SOSP 2024) separates data dissemination from ordering, achieving **latency half that of traditional BFT** while maintaining throughput. **Zaptos** (arXiv:2501.10612, 2025) demonstrates **sub-second end-to-end finality at 20,000 TPS** on a geo-distributed 100-validator network through parallel pipelined architecture.

For resource-constrained consumer networks, hierarchical consensus provides scalability. The **DLCA_R_P** approach (IET Blockchain 2024) runs PBFT within small groups while using Raft between group leaders, achieving **100x latency reduction and 10x throughput improvement** compared to flat PBFT at 100 nodes. **NG-PBFT** (ICCBN 2024) addresses dynamic membership by separating nodes into consensus and observation groups, handling joins and exits without system restart.

### The CALM Theorem

<aside>
🧠

The **CALM theorem** (Hellerstein & Alvaro, CACM 2020) provides theoretical grounding: coordination can be avoided whenever computation is logically monotonic. CRDTs implement monotonic operations (state only grows in the semilattice), while resource allocation or mutual exclusion require coordination.

For Grove, this suggests designing agent coordination around CRDTs where possible, invoking consensus only for inherently non-monotonic operations like exclusive task assignment.

</aside>

## Hybrid Architectures Balance Decentralization with Reliability

Pure P2P systems maximize decentralization but suffer from bootstrap latency and availability challenges. Production systems increasingly adopt hybrid architectures with super-peers providing stability.

**Circuit Relay v2** in libp2p introduces resource reservations preventing abuse:

- Configurable limits per peer (default **4 reservations**)
- Per IP (default **8**)
- Per ASN (default **32**)
- With connection duration (default **2 minutes**) and data caps (default **128KB per direction**)

**IPFS Cluster** coordinates pinning across multiple nodes using either CRDT-based consensus (recommended for most deployments) or Raft-based consensus for strict ordering requirements. Commercial pinning services like Pinata implement the standard Pinning Service API with multi-AZ deployment for fault tolerance.

This model-where stable infrastructure nodes provide reliability guarantees while consumer nodes participate opportunistically-maps directly to Grove's architecture where some villages might operate dedicated infrastructure while others run on intermittent residential hardware.

For Kafka-like event streaming without central brokers, the combination of **GossipSub for real-time distribution** and **Hypercore for persistent logs** provides durable event sourcing. Hypercore's append-only logs function as lightweight blockchains without consensus—signed and Merkle-tree-verified, supporting sparse replication where peers download only needed sections. The 2024 Hypercore 10 release adds built-in multi-writer support via Autobase, enabling collaborative logs from multiple agents.

---

## Synthesizing the Research into Grove's Architecture

The research converges on a practical architecture for Grove.

### Network Connectivity

Layer DCUtR-style hole-punching (achieving 70%+ success) over Circuit Relay v2 fallback, with **QUIC as the preferred transport** for connection migration benefits.

### Peer Discovery

Combine Kademlia DHT with mDNS for local networks and topic-based rendezvous for application-specific routing, using HyParView membership for village organization.

### State Synchronization

Operates at multiple levels:

- **GossipSub** distributes real-time events across the mesh with sub-100ms latency
- **Hypercore logs** provide durable, verifiable event history with sparse replication
- **Delta-state CRDTs** (Loro or Automerge) handle knowledge sharing with automatic conflict resolution

### Consensus

Invoked sparingly-hierarchical PBFT/Raft for critical coordination, CRDTs for everything else, following the CALM principle that coordination-free designs scale better.

### Key Parameters

Validated by production systems:

- Active view of **5-6 peers** for messaging
- Passive view of **~30** for recovery
- **22-hour DHT republish cycles** for churn tolerance
- Mesh degree **D=6** for GossipSub with heartbeat intervals of **700ms-1s**

These settings, refined through years of IPFS and Ethereum deployment, provide Grove a battle-tested foundation for decentralized AI coordination across thousands of residential nodes.

---

## Key Academic Citations

### NAT Traversal & Connectivity

- arXiv:2510.27500 (2025) - "Challenging Tribal Knowledge: Large Scale Measurement Campaign on Decentralized NAT Traversal"
- Liang et al., arXiv:2408.01791 (2024) - "Implementing NAT Hole Punching with QUIC"

### Gossip Protocols & Membership

- Leitão, Pereira, Rodrigues, IEEE SRDS 2007 - "HyParView" and "Epidemic Broadcast Trees"
- Kumar et al., IEEE S&P 2024 - "Formal Model-Driven Analysis of Resilience of GossipSub to Attacks from Misbehaving Peers"

### DHT & Discovery

- Maymounkov & Mazières, IPTPS 2002 - "Kademlia: A Peer-to-peer Information System Based on the XOR Metric"

### CRDTs & Consistency

- Almeida, Shoker & Baquero, JPDC 2018 - "Delta State Replicated Data Types"
- Kleppmann & Beresford, IEEE TPDS 2017 - "A Conflict-Free Replicated JSON Datatype"
- Da & Kleppmann, PaPoC 2024 - "Extending JSON CRDTs with Move Operations"
- Haas et al., ACM TOPLAS 2024 - "LoRe: A Programming Model for Verified Local-First Applications"

### Consensus & Coordination

- Giridharan et al., SOSP 2024 - "Autobahn: Seamless High Speed BFT"
- arXiv:2501.10612 (2025) - "Zaptos: Sub-Second Blockchain Latency"
- Hellerstein & Alvaro, CACM 2020 - "Keeping CALM: When Distributed Consistency Is Easy"