# The Grove Core Concepts: The Ratchet Deep Dive

# The Ratchet

*Capability Propagation and Grove's Core Bet*

Jim Calhoun
December 2025 | Grove Deep Dive Series

Grove Technical Deep Dive — Appendix A

---

**© 2025 Jim Calhoun / The-Grove.ai Foundation. All rights reserved.**

This document is for informational purposes only and does not constitute legal, financial, or technical advice. The-Grove.ai Foundation makes no warranties, express or implied, regarding the accuracy or completeness of the information contained herein. 

---

<aside>
📋

**Executive Summary**

$300 billion in announced AI infrastructure investments share one assumption: whoever controls the frontier controls AI. That assumption has a structural flaw: **AI capability propagates with a 7-month doubling time**. What's frontier today runs on consumer hardware in 18-24 months.

This document presents the evidence for capability propagation—what we call "the Ratchet"—and its implications for Grove's distributed architecture. The Ratchet is Grove's core bet: that capability propagation is real, measurable, and favorable to distributed systems.

</aside>

---

## The Pattern: What the Data Shows

METR (Model Evaluation and Threat Research) has tracked AI capability trajectories across standardized benchmarks since 2019. Their methodology measures "task complexity horizon"—the duration of autonomous work an AI system can reliably perform. This metric captures practical capability better than benchmark scores: a system that can work autonomously for four hours on complex tasks is meaningfully more capable than one limited to eight-minute tasks, regardless of how either scores on multiple-choice tests.

**The data shows consistent patterns:**

- Frontier model capability (measured by task complexity horizon) doubles approximately every **seven months**
- Local models follow the same improvement trajectory with a lag of roughly **21 months**
- The capability gap between frontier and local remains approximately **8x throughout the measurement period**

### Key Numbers

| **Input** | **Value** | **Source** |
| --- | --- | --- |
| Capability doubling | 7 months | METR 2025 |
| Frontier→Local lag | ~21 months | GPT-4 to Llama 3.1 8B |
| Gap ratio | 8x (constant) | Calculated |
| Trend confidence | 6 years, R² > 0.95 | METR 2025 |

## Projections: What This Means for Grove

These patterns produce concrete projections for Grove's architecture:

| **Year** | **Frontier Capability** | **Local Capability** | **Gap** |
| --- | --- | --- | --- |
| 2024 | ~1 hr tasks | ~8 min tasks | 8x |
| 2025 | ~4 hr tasks | ~30 min tasks | 8x |
| 2026 | ~15 hr tasks | ~2 hr tasks | 8x |
| 2027 | ~60 hr tasks | ~8 hr tasks | 8x |

<aside>
🎯

**The Implication for Grove**

Cognitive operations that require frontier inference in 2025 become local-capable by 2027. Reflection synthesis, complex planning, sophisticated social reasoning-each crosses the threshold from "requires cloud" to "runs locally" as the capability frontier propagates.

</aside>

### Cloud Dependency Trajectory

| **Capability Horizon** | **2025 (Local)** | **2027 (Local)** | **2029 (Local)** |
| --- | --- | --- | --- |
| Task complexity | ~8 min | ~2-6 hr | ~8-20+ hr |
| Cloud dependency | ~95-97% | ~30-50% | ~10-25% |

*Note: Ranges reflect uncertainty in propagation rate and hardware adoption cycles. Routine behaviors (planning, consistency, voice) track the optimistic end; pivotal cognition (reflection, social reasoning) tracks the conservative end.*

## Non-Uniform Propagation: The Nuance

The Ratchet applies METR's "task complexity horizon" metric as a general indicator of capability propagation. This metric aggregates performance across many cognitive operations. Historical evidence shows that **not all operations propagate at the same rate**.

Research on capability migration from frontier to local models reveals a structural bifurcation:

### Crystallized Intelligence

Knowledge, pattern-matching, and style transfer compress efficiently and propagate rapidly. An 8B model can know the capital of France or generate grammatically correct dialogue as well as a 100B model. **Historical propagation time: 12-18 months.**

### Fluid Intelligence

Multi-step reasoning, planning, and counterfactual analysis resist compression and propagate slowly. The ability to simulate recursive reflection—to think about thinking—appears to require minimum thresholds of parameters and attention depth. **Historical propagation time: 24+ months.**

### Grove's Cognitive Operations by Propagation Type

| **Cognitive Operation** | **2025** | **2027** | **2029** |
| --- | --- | --- | --- |
| Routine planning | Local | Local | Local |
| Behavioral consistency | Local | Local | Local |
| Voice/personality | Local | Local | Local |
| Simple dialogue | Local | Local | Local |
| Memory retrieval | Cloud-assisted | Hybrid | Local |
| Reflection synthesis | Cloud | Cloud-assisted | Hybrid |
| Complex social reasoning | Cloud | Cloud | Cloud-assisted |
| Theological emergence | Cloud | Cloud | Cloud |

<aside>
⚙️

The hybrid architecture accounts for these variations by design. The efficiency-enlightenment loop assumes that agents seek enhanced cognition for their most demanding thinking. Cloud credits buy "expanded consciousness" for exactly these operations. The architecture works *because* capability propagation is non-uniform—if everything propagated equally, there would be no gradient to exploit.

</aside>

## The Jevons Consideration

As local models become capable of 2025-era "pivotal" tasks, the definition of "pivotal" will not remain static. Worldsmiths and communities will demand increasingly complex emergent behaviors—theological debates, inter-civilizational dynamics, nuanced deception—that will continue to require frontier-class inference. The "coherence floor" rises with capability.

This is not a bug; it is the product working. The simulation grows more sophisticated as the infrastructure matures. Cloud dependency may decline more slowly than projected, but the quality of what that dependency purchases improves continuously.

**The honest framing:** Local models in 2027 will likely excel at "sounding like a distinctive character" (voice, style, behavioral consistency) while requiring cloud assistance for "having a genuine insight" (recursive reflection, social strategy, emergent theology). This is fine. The simulation runs locally; the breakthrough moments route to frontier capability. Users experience a coherent, persistent world with occasional flashes of deeper intelligence—which is, arguably, how humans experience consciousness as well.

## Consumer Economics, Not Consumer Hardware

The Ratchet hypothesis is sometimes misread as requiring all cognition to run on personal laptops. This is not the claim. The claim is that *consumer-accessible economics* will capture an increasing share of AI inference-whether that inference runs on a MacBook, a gaming PC, or a $10/month cloud instance.

The spectrum of consumer-accessible compute includes:

### Local Hardware

Personal computers with 16-32GB RAM running quantized models. This is the purest expression of distributed ownership—the compute literally belongs to the Gardener. Hardware capabilities improve continuously; a 2027 consumer machine will substantially exceed 2025 specifications, though hardware refresh cycles (4-5 years average) create lag between model availability and installed-base capability.

### Commodity Cloud

Containerized simulations running on spot instances, inference providers, or shared GPU pools. A Grove village running on a $15/month Docker container is not "centralized" in the sense that matters-it's not dependent on a specific provider, it's not locked into a proprietary platform, and the Gardener retains full control. The economics are consumer-grade even if the hardware is not physically present.

### Hybrid Configurations

Local hardware handling routine cognition with burst capacity from commodity cloud for peak loads. This may prove the dominant configuration—personal machines providing baseline compute with elastic overflow.

<aside>
🔑

**The Key Insight**

Distributed architecture does not require distributed hardware. It requires distributed control and consumer-accessible economics. A network of villages running on commodity cloud infrastructure, each controlled by its Gardener, each portable across providers, achieves the ownership and anti-concentration goals even if the compute isn't literally sitting under someone's desk.

</aside>

## The Memory Wall

Grove's local simulation layer runs on consumer hardware. Today, this means machines with **16-32GB of RAM** running **7-8B parameter models**. This is the floor, not the ceiling.

Hardware refresh cycles average 4-5 years. The average Grove node in 2027 will likely be a machine purchased in 2024 or 2025. Even if capable open-source models exist, the installed base takes time to catch up. This creates "hardware lag" that is stickier than "model lag."

The Grove runs best on enthusiast hardware today, and mainstream hardware tomorrow. The architecture is designed to gracefully degrade: communities with capable hardware achieve higher local autonomy; communities with constrained hardware route more cognition to cloud. Both configurations are valid. The efficiency tax adjusts to market conditions, not fixed dates.

---

## What If the Ratchet Stalls?

Consider the apparent failure mode: capability propagation slows, and Grove communities remain 50%+ cloud-dependent indefinitely. This scenario deserves examination not as failure, but as an alternative form of success.

### The Portion That's Already Captured

A community at 50% cloud dependency runs half of its cognition locally. That compute represents value that would have flowed entirely to concentrated providers under any alternative architecture. It's not "almost autonomous"—it's a permanent structural shift in who owns AI infrastructure.

**This isn't a consolation prize. It's the floor.**

### The Remainder Flows at Reduced Rates

Grove creates something that doesn't currently exist in AI markets: a large, coordinated, price-sensitive demand bloc for frontier inference. Historical precedent suggests this matters.

Healthcare Group Purchasing Organizations—coalitions of hospitals negotiating collectively—have driven hundreds of billions in savings by aggregating demand that individual buyers couldn't leverage alone. University consortia routinely secure cloud computing discounts that no single institution could negotiate. The mechanism is simple: suppliers compete for guaranteed volume.

The AI API market is ripe for this pressure. Current market concentration is high (**top three providers control roughly 77% of enterprise usage**), but competition is intensifying. **API prices fell 80-90% within sixteen months of GPT-4's launch**-a pace of commoditization that mirrors the early cloud computing wars. Providers have introduced tiered pricing, batch processing discounts, and committed-use plans specifically to capture cost-sensitive demand.

Grove's aggregate demand-thousands of communities, each optimizing for cost-per-inference, each willing to shift providers for better rates-creates exactly the buyer profile that forces competitive response. At sufficient scale, this bloc negotiates as a single large customer. Enterprise customers committing $5-10 million annually routinely secure **30-50% discounts**; the largest commitments have achieved **80% reductions** from list prices.

### Total Value Extraction Drops on Both Dimensions

Concentrated providers lose twice: they capture 50% of volume instead of 100%, AND they capture it at lower margins. The math compounds. If Grove drives API prices down 30% through competitive pressure, and captures 50% of compute locally, the total value flowing to concentrated infrastructure drops by more than half compared to a world without Grove.

<aside>
💡

**The Reframe** 
Grove's "failure mode" is Grove functioning as market infrastructure that forces favorable terms for distributed participants. This is how buying cooperatives work. You don't need to own the means of production to exercise market power over them.

**The Ratchet delivers autonomy. The market power argument delivers leverage.** Both represent structural improvements over a world where AI infrastructure concentrates entirely in the hands of a few providers. The question isn't whether Grove succeeds—it's which kind of success it achieves.

</aside>

## Robustness to Projection Error

Grove's architecture does not require the Ratchet to hold precisely as projected. Consider a scenario where capability propagation occurs at half the expected rate—a 42-month lag instead of 21 months, with cloud dependency declining to 50% by 2027 rather than 30%.

Even under this pessimistic scenario, several favorable conditions obtain:

1. **The efficiency tax still funds infrastructure.** Communities paying higher rates for longer periods generate more Foundation revenue during bootstrap, potentially accelerating infrastructure development and the path to decentralization. Counter-intuitively, a slower Ratchet may strengthen the Foundation's financial position during the critical transition period.
2. **The hybrid architecture remains economically superior to pure-cloud alternatives.** A community at 50% cloud dependency still runs half of its cognition locally—compute that would otherwise flow entirely to concentrated providers.
3. **The economic pressure on frontier API providers increases regardless.** Thousands of communities running hybrid architectures create sustained demand for inference at price points below current levels.

*The Ratchet is a bet on favorable timing. But Grove's core value proposition—distributed AI infrastructure with ownership stakes for contributors—does not depend on the timing being precise. It depends on the trajectory being directional, which the evidence strongly supports.*

### Scenario Matrix

| **Year** | **Pessimistic** | **Expected** | **Optimistic** |
| --- | --- | --- | --- |
| 2025 | 98% | 95% | 90% |
| 2027 | 65% | 45% | 25% |
| 2029 | 35% | 15% | 5% |

*Pessimistic: Hardware stagnation, reasoning tasks resist distillation. Expected: Moore's Law holds, 14B models handle basic planning. Optimistic: Quantization breakthroughs, Apple unlocks memory constraints.*

## Honest Limitations

The **seven-month doubling** has held for approximately two years. It may not continue. Capability improvements could slow as models approach fundamental limits, or accelerate as new architectures emerge. The projection assumes continuation of observed trends, not physical necessity.

The **21-month lag** assumes local hardware and quantization techniques continue improving at historical rates. A slowdown in consumer GPU improvement or quantization research would extend the lag. A breakthrough in either could shorten it.

The **8x gap ratio** is empirical, not theoretical. Nothing guarantees the gap remains constant. Frontier models might pull ahead faster than local models can follow, widening the gap. Or diminishing returns at the frontier might narrow it. Grove's architecture assumes the gap persists but remains bridgeable; this assumption could prove wrong.

**Task complexity horizon** is a useful proxy but not a complete measure. Some cognitive operations may resist the general capability trend-perhaps certain types of reasoning require capabilities that don't follow the standard propagation curve. The projection treats capability as unitary when it may be multidimensional.

## The Ratchet Math

For quantitative-minded readers, here is the core formula:

**Ratchet Value = Network Size × External R&D × Time**

Grove converts competitors' R&D spending into network value. When Google spends billions on Titans architecture, that capability propagates to open-weight models, and Grove nodes upgrade. When Anthropic improves Claude, competitive pressure releases capability, and Grove inherits. When Meta releases Llama improvements, Grove captures directly.

### The Comparison

| **Centralized Model** | **Ratchet Model** |
| --- | --- |
| ~$500B cumulative capex (5-year) | ~$0 R&D spend |
| Value driver: Internal investment | Value driver: External R&D capture |
| Capability: Must build/buy | Capability: Inherits automatically |
| 5-year multiplier: Linear with spend | 5-year multiplier: ~64x starting value |

---

## Research Foundation

### Capability Measurement & Trajectory Trends

- METR (2025). "Measuring AI Agent Capabilities." *Model Evaluation and Threat Research.* Task complexity horizon methodology measuring autonomous work duration as capability proxy. Six-year trend data with R² > 0.95 correlation.
- Kaplan, J. et al. (2020). "Scaling Laws for Neural Language Models." *OpenAI.* Establishes predictable relationships between compute, parameters, and capability that underpin propagation projections.
- Hoffmann, J. et al. (2022). "Training Compute-Optimal Large Language Models." *DeepMind (Chinchilla paper).* Demonstrates that smaller models trained on more data can match larger models, enabling capability propagation to consumer hardware.

### Model Compression & Local Deployment

- Dettmers, T. et al. (2022). "[LLM.int](http://LLM.int)8(): 8-bit Matrix Multiplication for Transformers at Scale." Quantization techniques enabling large model deployment on consumer hardware.
- Frantar, E. et al. (2023). "GPTQ: Accurate Post-Training Quantization for Generative Pre-trained Transformers." 4-bit quantization achieving minimal quality loss, critical for consumer GPU deployment.
- Touvron, H. et al. (2023). "LLaMA: Open and Efficient Foundation Language Models." *Meta AI.* Demonstrates frontier-competitive performance at consumer-accessible parameter counts.
- Touvron, H. et al. (2024). "Llama 3.1." *Meta AI.* 8B parameter model approaching GPT-4 era capability, empirical evidence of 21-month propagation lag.

### Cognitive Science Foundation

- Cattell, R.B. (1963). "Theory of Fluid and Crystallized Intelligence." *Journal of Educational Psychology.* Original distinction between crystallized (knowledge-based) and fluid (reasoning-based) intelligence that informs non-uniform propagation analysis.
- Horn, J.L. & Cattell, R.B. (1967). "Age Differences in Fluid and Crystallized Intelligence." *Acta Psychologica.* Extended framework showing differential development patterns applicable to AI capability analysis.
- Kosinski, M. (2023). "Theory of Mind May Have Spontaneously Emerged in Large Language Models." *arXiv:2302.02083.* Evidence that social reasoning capability is scale-emergent, supporting cloud-assisted requirement for complex social dynamics.

### Market Dynamics & Economics

- Menlo Ventures (2025). "State of Generative AI in the Enterprise." Market concentration analysis showing top 3 providers controlling ~77% of enterprise LLM API usage.
- Burns, L.R. et al. (2002). "Group Purchasing Organizations and Health Care Costs." *Health Affairs.* Healthcare GPO savings analysis demonstrating collective bargaining power in concentrated markets.
- Jevons, W.S. (1865). "The Coal Question." *Macmillan.* Original formulation of the paradox that efficiency improvements increase rather than decrease total consumption-applicable to compute demand scaling.

### AI Agent Architecture

- Park, J.S. et al. (2023). "Generative Agents: Interactive Simulacra of Human Behavior." *Stanford University / Google Research.* Demonstrates viable agent simulation on consumer-accessible infrastructure with hybrid cloud architecture.
- Wang, L. et al. (2024). "A Survey on Large Language Model Based Autonomous Agents." *arXiv:2308.11432.* Comprehensive review of agent capabilities and architectural patterns.

### Distributed Systems Economics

- Anderson, D.P. (2004). "BOINC: A System for Public-Resource Computing." *Grid Computing.* Demonstrates viability of distributed computing networks leveraging consumer hardware.
- Nakamoto, S. (2008). "Bitcoin: A Peer-to-Peer Electronic Cash System." Proof that distributed networks can achieve coordination without central authority.

---

*This document is part of the Grove Technical Deep Dive series.*

*Return to: Grove White Paper (8K Hub)*