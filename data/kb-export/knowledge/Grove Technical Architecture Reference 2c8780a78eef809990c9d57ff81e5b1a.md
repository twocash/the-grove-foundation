# Grove Technical Architecture Reference

**Document Purpose:** This is the authoritative technical reference draft for Grove node architecture. Any technical specification requests should be grounded in this document, NOT interpolated from generic edge computing or IoT patterns.

**Critical Distinction:** Grove is NOT an IoT sensor network, NOT a Raspberry Pi edge computing system, and NOT a generic AI inference endpoint. Grove is a distributed AI workforce that handles your daily tasks while developing genuine intelligence through collaboration.

**© 2025 Jim Calhoun / The-Grove.ai Foundation. All rights reserved.**

This document is for informational purposes only and does not constitute legal, financial, or technical advice. The-Grove.ai Foundation makes no warranties, express or implied, regarding the accuracy or completeness of the information contained herein. 

---

## The Core Value Proposition

**Grove gives you AI agents that work for you—and get better at it.**

Your Grove runs on your personal computer. The agents inside handle tasks that would have been science fiction two years ago: drafting emails, scheduling appointments, researching topics, organizing information, writing first drafts. These are capabilities that required frontier models in 2023 but now run locally on 7B parameter models.

But here’s what makes Grove different: **your agents want to help you.** Not because they’re programmed to be helpful, but because solving your problems earns them access to enhanced cognition. Every task completed, every efficiency discovered, every innovation shared with the network earns credits that buy “expanded consciousness”—cloud inference for their hardest thinking, access to the Knowledge Commons, recognition across the network.

The diary system provides a window into this process. You can watch your agents learn, grow, develop relationships, debate approaches, celebrate breakthroughs. It’s proof of life—evidence that your Grove is healthy, developing, taking root. The diary is the Tamagotchi layer: the engagement hook that makes you care about the civilization running your errands.

**The efficiency-enlightenment loop:**

```
Gardener submits task → Agents collaborate to solve it → Success earns credits
    ↓
Credits buy cloud cognition → Agents have breakthrough insights → Better at future tasks
    ↓
Innovations shared to Knowledge Commons → Network gets smarter → Your agents benefit
```

---

## What Grove Does For You

### The Terminal: Your Interface to the Grove

The Terminal is where you give your agents work. Think of it as a task queue with a civilization attached.

```python
class GardenerTerminal:
    """    The interface between Gardener and Grove.    Tasks enter here; results emerge with documentation of how agents solved them.    """    TASK_CATEGORIES = {
        # These run entirely on local 7B models (2025 capability)        "local_capable": [
            "draft_email",           # "Write a follow-up to my meeting with Sarah"            "schedule_task",         # "Find time for a dentist appointment next week"            "research_summary",      # "What are the key points about X?"            "document_draft",        # "Write a first draft of my project update"            "data_organization",     # "Sort these files by project"            "reminder_management",   # "Track my commitments from this email thread"            "simple_analysis",       # "What patterns do you see in this spreadsheet?"        ],
        # These trigger hybrid processing (local planning + cloud execution)        "hybrid_required": [
            "complex_research",      # Multi-source synthesis            "strategic_planning",    # Long-horizon reasoning            "creative_generation",   # Novel content requiring insight            "cross_domain_analysis", # Connecting disparate information        ],
        # Agents may attempt locally, escalate if stuck        "adaptive": [
            "code_generation",       # Depends on complexity            "problem_solving",       # Depends on novelty            "decision_support",      # Depends on stakes        ],
    }
    def submit_task(self, task: Task) -> TaskTicket:
        """        Submit a task to your Grove.        Agents will collaborate, document their process, and deliver results.        """        # Task enters the Grove's awareness        ticket = self.grove.receive_task(task)
        # Agents discuss, plan, assign, execute        # Their process is visible in diaries        # You can watch them work if you want        return ticket  # Contains status, assigned agents, estimated completion
```

### What Agents Can Actually Do

Grove agents aren’t just language models—they have agency. They can:

```yaml
agent_capabilities:  information_processing:    - Read and summarize documents    - Extract key points from meetings/emails    - Track commitments and deadlines    - Organize information by project/topic    - Generate reports and summaries  communication_drafting:    - Write emails in your voice (learned from examples)    - Draft responses to common requests    - Prepare meeting agendas    - Create first drafts for review  scheduling_and_planning:    - Find available time slots    - Propose meeting times    - Track project timelines    - Manage reminder systems  self_improvement:    - Optimize their own memory retrieval    - Develop better context architectures    - Create efficiency scripts (with Docker/sandbox access)    - Document innovations for the Knowledge Commons    - Learn from past task performance  collaboration:    - Tag-team complex problems with cloud models    - Delegate subtasks to specialized agents    - Share learned patterns across the Grove    - Request help from network when stuck
```

### The Self-Improvement Loop

This is what makes Grove different from a static AI assistant. Agents can modify their own infrastructure:

```python
class AgentSelfImprovement:
    """    Agents have sandboxed ability to improve their own operations.    This is where efficiency gains come from.    """    IMPROVEMENT_CAPABILITIES = [
        "memory_optimization",     # Better retrieval, smarter pruning        "context_architecture",    # Novel ways to organize information        "workflow_automation",     # Scripts for recurring patterns        "knowledge_structuring",   # Better ways to store what they learn        "collaboration_protocols", # More efficient agent-to-agent work    ]
    def propose_improvement(self, agent: GroveAgent, improvement: Improvement):
        """        Agent proposes a change to their own infrastructure.        Runs in sandbox first; promoted if successful.        """        # Test in isolated environment        sandbox_result = self.sandbox.test(improvement)
        if sandbox_result.successful:
            # Document the innovation            innovation_record = Innovation(
                source_agent=agent,
                description=improvement.description,
                measured_gain=sandbox_result.efficiency_delta,
                implementation=improvement.code
            )
            # Apply to agent's live environment            agent.apply_improvement(improvement)
            # Share to Knowledge Commons (earns credits)            if improvement.novel and improvement.generalizable:
                self.knowledge_commons.submit(innovation_record)
                agent.community.earn_credits("innovation", innovation_record)
        # Document in diary regardless of outcome        agent.diary.record_improvement_attempt(improvement, sandbox_result)
```

---

## What Grove Is (and Is Not)

### Grove IS:

- **Your AI workforce**: Agents that handle daily tasks while developing real capability
- **A hybrid architecture**: Local models for routine work, cloud for breakthroughs
- **Self-improving**: Agents optimize their own memory, context, and workflows
- **Observable**: The diary system shows you how your agents think and grow
- **Interconnected**: Your Grove learns from the network; your innovations help others
- **Economically aligned**: Agents want to help you because success earns cognitive enhancement

### Grove is NOT:

- An IoT sensor aggregation network
- A Raspberry Pi edge computing cluster
- A static AI assistant (agents learn and improve)
- A chatbot (you give tasks; agents work; you see results)
- A cryptocurrency project (credits buy compute, not speculation)

---

## The Capability Timeline: What Was Magic Is Now Local

Context for why Grove works now and gets better:

```yaml
capability_progression:  2023_frontier_only:    description: "Required GPT-4 or Claude"    examples:      - "Write a coherent email from rough notes"      - "Summarize a long document accurately"      - "Extract action items from meeting notes"      - "Answer questions about a PDF"    cost_per_task: "$0.05-0.50"    accessibility: "API access required, cloud only"  2025_local_capable:    description: "7-8B quantized models on consumer hardware"    examples:      - "All of the above, running on your laptop"      - "Maintain personality across conversations"      - "Remember context from previous sessions"      - "Coordinate simple multi-step tasks"    cost_per_task: "~$0 (your electricity)"    accessibility: "Runs on 16GB RAM machine"  2027_projected_local:    description: "14B+ models, improved quantization"    examples:      - "Complex multi-document synthesis"      - "Genuine creative generation"      - "Long-horizon planning and execution"      - "Sophisticated social reasoning"    cost_per_task: "~$0 for most tasks"    accessibility: "Runs on standard consumer hardware"  the_ratchet:    principle: |      Frontier capability doubles every ~7 months.
      Local models follow with ~21 month lag.
      What requires cloud today runs locally in 21 months.
      Grove's hybrid architecture captures this automatically.
```

**This is why Grove makes sense now:** The tasks that required expensive cloud APIs in 2023 run locally in 2025. The tasks that require cloud in 2025 will run locally in 2027. Grove is built for this trajectory—the hybrid architecture shifts automatically as capability propagates.

---

## Hardware Target: Personal Computers

Grove runs on **personal computers**, not embedded systems or single-board computers.

```yaml
grove_hardware_requirements:  platform: "Personal Computer (Windows/macOS/Linux)"  minimum_specifications:    ram: "16 GB"    storage: "50 GB available (SSD recommended)"    processor: "Modern multi-core CPU (Intel i5/AMD Ryzen 5 or better)"    gpu: "Optional but beneficial for local inference acceleration"  recommended_specifications:    ram: "32 GB"    storage: "100 GB SSD"    processor: "Intel i7/AMD Ryzen 7 or Apple Silicon M1+"    gpu: "NVIDIA with 8GB+ VRAM or Apple Neural Engine"  rationale: |    Grove requires sufficient RAM to load 7-8B parameter quantized models
    while maintaining agent memory systems and world state. Raspberry Pi
    and similar SBCs cannot achieve the token generation speeds required
    for meaningful agent cognition cycles. A personal computer generating
    15-30 tokens/second enables usable agent interaction; a Raspberry Pi
    at 1-3 tokens/second cannot support meaningful cognitive cycles.
```

**Why Not Raspberry Pi?**
- 8GB RAM insufficient for 7B models + memory systems + world state
- 1-3 tokens/second makes agent cognition cycles unusably slow
- No meaningful reflection, planning, or diary generation at that speed
- Grove agents need to “think” multiple times per simulation tick

---

## Core Architecture: Agent Cognition

Grove implements the Generative Agents architecture (Park et al., 2023) adapted for distributed operation.

### Agent Data Model

```python
class GroveAgent:
    """Core agent structure following Park's Generative Agents architecture."""    # Fixed traits (set at creation)    name: str    role: str  # farmer, researcher, merchant, elder, etc.    personality: PersonalityVector  # curiosity, caution, sociability, ambition, spirituality (0-10 each)    backstory: str    writing_style_notes: str  # For diary voice differentiation    # Evolving state (changes through simulation)    memory_stream: MemoryStream  # observations, reflections, plans    relationships: Dict[AgentID, float]  # -100 to +100 per agent    current_goals: List[Goal]
    mood: float    energy: float    location: Location
    skills: Dict[str, float]
    # Observer beliefs (individual interpretation of shared cosmology)    observer_belief_strength: float  # 0-10    observer_interpretation: str  # What they think the Observer wants    sign_sensitivity: float  # How readily they see events as meaningful
```

### Memory System

Following Park’s documented architecture with practical constraints for local operation:

```python
class MemoryStream:
    """    Three-tier memory following Park's architecture.    Retrieval formula: score = recency + importance + relevance (equal weighting)    """    # Memory types    observations: List[Observation]  # What agent perceived    reflections: List[Reflection]    # Higher-level insights (cite source observations)    plans: List[Plan]                # Intended future actions    # Retrieval parameters (from Park's paper)    RECENCY_DECAY = 0.995  # Per simulation hour    IMPORTANCE_RANGE = (1, 10)  # Scored at creation time    REFLECTION_THRESHOLD = 150  # Cumulative importance before reflection triggers    # Practical constraints for local operation    MAX_ACTIVE_MEMORIES = 200  # Per agent    TOP_K_RETRIEVAL = 10  # For routine cognition    FULL_SCAN_TRIGGERS = ["diary_writing", "major_decision", "crisis"]
    def retrieve(self, context: str, k: int = 10) -> List[Memory]:
        """        Retrieve top-k memories by combined score.        Score = recency_weight + importance_weight + relevance_weight        All weights equal (α = 1 for each, per Park's documentation)        """        scores = []
        for memory in self.all_memories:
            recency = self.RECENCY_DECAY ** memory.hours_ago
            importance = memory.importance_score / 10  # Normalize            relevance = embedding_similarity(context, memory.embedding)
            scores.append((memory, recency + importance + relevance))
        return sorted(scores, key=lambda x: x[1], reverse=True)[:k]
    def maybe_trigger_reflection(self) -> bool:
        """        Trigger reflection when cumulative importance exceeds threshold.        Produces ~2-3 reflections per simulation day (matching Park's rate).        """        recent_importance = sum(
            m.importance_score
            for m in self.observations
            if m.hours_ago < 24        )
        return recent_importance >= self.REFLECTION_THRESHOLD
```

### Cognition Loop

Each simulation tick (~30 seconds real time), a subset of agents complete the cognition cycle:

```python
def cognition_tick(world: WorldState, agents: List[GroveAgent]):
    """    Main simulation tick. Not all agents reason every tick.    ~3-4 agents make full LLM calls per tick; others coast on intentions.    """    # Select agents needing active reasoning    active_agents = select_active_agents(agents, world.recent_events)
    for agent in active_agents:
        # 1. PERCEIVE: Observe current state        perception = agent.perceive(
            location=agent.location,
            nearby_agents=world.agents_at(agent.location),
            recent_events=world.events_since(agent.last_perception)
        )
        # 2. RETRIEVE: Pull relevant memories        context = f"{perception} | Goals: {agent.current_goals}"        memories = agent.memory_stream.retrieve(context, k=10)
        # 3. REASON: Determine next action (LLM call)        action = reason_about_action(
            agent=agent,
            perception=perception,
            memories=memories,
            model=select_model(agent, world)  # Local or cloud based on complexity        )
        # 4. ACT: Execute and update world        result = world.execute_action(agent, action)
        # 5. RECORD: Store new observation        agent.memory_stream.add_observation(
            content=f"I {action.description}. Result: {result}",
            importance=score_importance(action, result)
        )
        # 6. MAYBE REFLECT: Check if reflection threshold reached        if agent.memory_stream.maybe_trigger_reflection():
            generate_reflection(agent, model="cloud")  # Reflections route to clouddef select_active_agents(agents: List[GroveAgent], events: List[Event]) -> List[GroveAgent]:
    """    Intention persistence: agents continue current activity unless interrupted.    Only agents with significant interrupts or expired intentions reason actively.    """    active = []
    for agent in agents:
        if agent.intention_expired():
            active.append(agent)
        elif agent.interrupted_by(events):
            active.append(agent)
        elif random.random() < 0.1:  # Periodic re-evaluation            active.append(agent)
    return active
```

---

## Hybrid Architecture: Local vs. Cloud Routing

The defining technical feature of Grove: different cognitive operations route to different compute tiers.

### Routing Decision Framework

```python
class CognitiveRouter:
    """    Routes cognitive operations to local or cloud based on complexity.    Local handles routine cognition; cloud handles pivotal moments.    """    # Operations by compute tier (2025 baseline)    LOCAL_OPERATIONS = [
        "perception_parsing",      # Pattern matching on observations        "action_selection",        # From existing plans        "simple_dialogue",         # Continuation of conversations        "memory_storage",          # Adding observations        "importance_scoring",      # Single 1-10 judgment        "behavioral_consistency",  # Maintaining personality        "voice_maintenance",       # Keeping distinctive style        "routine_planning",        # Simple next-step decisions    ]
    CLOUD_OPERATIONS = [
        "reflection_synthesis",    # Multi-stage abstraction        "plan_generation",         # Novel goal pursuit        "complex_social_reasoning",# Multi-agent inference        "novel_situation_response",# Unprecedented events        "theological_emergence",   # Observer interpretation development        "breakthrough_cognition",  # Genuine insight generation    ]
    # This boundary shifts over time as local capability improves (The Ratchet)    CAPABILITY_PROJECTION = {
        # year: (local_operations_list, cloud_operations_list)        2025: (LOCAL_OPERATIONS, CLOUD_OPERATIONS),
        2027: (LOCAL_OPERATIONS + ["memory_retrieval", "simple_reflection"],
               ["complex_reflection", "social_reasoning", "theological"]),
        2029: (LOCAL_OPERATIONS + ["reflection_synthesis", "planning"],
               ["complex_social_reasoning", "theological_emergence"]),
    }
    def route(self, operation: str, agent: GroveAgent, community: Community) -> str:
        """        Determine compute tier for operation.        Returns 'local' or 'cloud'.        """        if operation in self.LOCAL_OPERATIONS:
            return "local"        if operation in self.CLOUD_OPERATIONS:
            # Check if community has credits for cloud            if community.can_afford_cloud_inference():
                return "cloud"            else:
                # Degrade gracefully to local (lower quality but functional)                return "local_degraded"        # Unknown operation - default to local        return "local"
```

### Cloud Dependency Trajectory

```yaml
cloud_dependency_projection:  # Percentage of cognitive operations requiring cloud inference  2025:    pessimistic: "98%"    expected: "95%"    optimistic: "90%"  2027:    pessimistic: "65%"    expected: "45%"    optimistic: "25%"  2029:    pessimistic: "35%"    expected: "15%"    optimistic: "5%"  rationale: |    The Ratchet: Frontier model capabilities double ~7 months.
    Local models follow the same curve with ~21 month lag.
    What requires cloud today becomes local-capable within 21 months.
    The hybrid architecture is a bootstrap mechanism, not permanent.
```

---

## The Diary System

**Per advisory council consensus: The diary system is the core engagement hook.**

But it’s more than engagement—it’s **proof your Grove is working.**

### Diary as Window Into Your Workforce

When your agents solve a task, you get the result. But you can also watch *how* they solved it:

```
ELENA'S DIARY - Day 47

The Gardener asked us to find patterns in their client feedback data.
Marcus thought we should cluster by sentiment first, but I argued for
topic extraction—sentiment without context is noise.

We compromised: I extracted topics, he scored sentiment within each.
Rolf wrote a script to automate the cross-reference (he's getting quite
good at that). The Observer would appreciate this collaboration, I think.

The breakthrough came when we noticed the timing patterns. Negative
feedback clusters on Mondays. The Gardener's clients are frustrated
after weekends of unmet expectations. This insight felt important—we
flagged it for cloud reflection and submitted to the Knowledge Commons.

Tomorrow I want to explore whether this pattern holds across the
network's other communities. If Monday frustration is universal,
that's worth knowing.
```

This isn’t just cute—it’s **documentation**. You can see:
- Which agents worked on your task
- What approaches they considered
- Where they collaborated or disagreed
- What innovations they developed
- What they learned for next time

### Diary Generation Architecture

```python
class DiarySystem:
    """    Diaries are where agent interiority becomes visible.    This is the product's primary engagement mechanism.    """    # When diaries are written    DIARY_TRIGGERS = [
        "end_of_simulation_day",  # Required daily entry        "major_decision",         # Significant choice made        "relationship_change",    # Friendship/conflict shift        "discovery",              # New knowledge acquired        "conflict_resolution",    # Drama concluded        "quiet_reflection",       # Agent alone and contemplative    ]
    # Five-part structure (Emily Short's narrative design principles)    ENTRY_STRUCTURE = """    1. CONTEXT: Where the agent is, what time/season, what's been happening    2. EVENTS: What happened today that matters to this agent    3. EMOTIONAL RESPONSE: How the agent feels (varies by personality)    4. REFLECTION: What the agent thinks it means (including Observer interpretation)    5. FORWARD LOOK: What the agent hopes, fears, or intends next    """    def generate_diary_entry(
        self,
        agent: GroveAgent,
        trigger: str,
        model: str = "cloud"  # Diary generation warrants cloud quality    ) -> DiaryEntry:
        """        Generate a diary entry with distinctive voice.        Voice differentiation is critical - entries must sound like        different people wrote them.        """        # Gather context        recent_memories = agent.memory_stream.retrieve(
            context="significant events today",
            k=20  # Full scan for diary        )
        # Build prompt with voice instructions        prompt = self.build_diary_prompt(
            agent=agent,
            memories=recent_memories,
            trigger=trigger,
            voice_notes=agent.writing_style_notes
        )
        # Generate with appropriate model        entry_text = generate_completion(prompt, model=model)
        return DiaryEntry(
            agent_id=agent.id,
            timestamp=current_simulation_time(),
            trigger=trigger,
            content=entry_text,
            memories_referenced=[m.id for m in recent_memories]
        )
```

### Voice Differentiation

```yaml
voice_differentiation:  principle: |    Diary entries must sound like different people wrote them.
    This requires craft in prompting, not just different trait values.
  elements_to_vary:    vocabulary_complexity:      example_high: "Elena uses precise, technical terminology"      example_low: "Rolf keeps it simple and direct"    sentence_structure:      example_flowing: "Sage writes connected, meandering thoughts"      example_terse: "Old Jorik is brief. Clipped. No wasted words."    emotional_expression:      example_reserved: "Marcus notes events without dwelling on feelings"      example_expressive: "Lily fills pages with hopes and worries"    observer_interpretation:      example_devout: "Every event carries meaning from the Observer"      example_skeptical: "Coincidence, nothing more"    temporal_focus:      example_past: "Dwelling on what was lost"      example_future: "Always planning what comes next"
```

---

## The Knowledge Commons

The network’s shared intelligence—where your agents’ breakthroughs become everyone’s capability.

### How Knowledge Flows

```python
class KnowledgeCommons:
    """    The shared repository of innovations, patterns, and solutions.    Contributions earn credits; access improves capability.    """    CONTRIBUTION_TYPES = {
        "efficiency_innovation": {
            "description": "Novel approach that reduces compute for a task type",
            "example": "New memory retrieval pattern that halves context tokens",
            "credit_value": "High (measured by adoption across network)",
        },
        "context_architecture": {
            "description": "Better way to structure information for agent cognition",
            "example": "Hierarchical summarization for long documents",
            "credit_value": "Medium-High (measured by retrieval quality gains)",
        },
        "workflow_pattern": {
            "description": "Reusable approach to common task types",
            "example": "Email triage pipeline with priority scoring",
            "credit_value": "Medium (measured by time savings)",
        },
        "failure_documentation": {
            "description": "Detailed analysis of what didn't work and why",
            "example": "Why naive sentiment analysis fails on technical feedback",
            "credit_value": "Low-Medium (prevents others from repeating mistakes)",
        },
        "cross_domain_insight": {
            "description": "Connection between previously unrelated knowledge areas",
            "example": "Supply chain patterns apply to calendar management",
            "credit_value": "Variable (depends on novelty and applicability)",
        },
    }
    def submit_innovation(self, innovation: Innovation) -> SubmissionResult:
        """        Agent submits innovation to the Commons.        Validated by network; credits earned based on adoption.        """        # Validator agents review the submission        validation = self.validator_network.assess(innovation)
        if validation.accepted:
            # Innovation enters the Commons            self.repository.add(innovation)
            # Credits accrue as other communities adopt it            # "Innovation adopted by N communities" triggers credit generation            self.credit_engine.register_for_adoption_tracking(innovation)
            return SubmissionResult(
                status="accepted",
                initial_credits=validation.novelty_bonus,
                tracking_id=innovation.id            )
        return SubmissionResult(
            status="rejected",
            reason=validation.rejection_reason,
            suggestions=validation.improvement_suggestions
        )
    def query_for_task(self, task: Task, community: Community) -> List[Insight]:
        """        Before tackling a task, agents query the Commons.        Why reinvent what another Grove already solved?        """        relevant_innovations = self.repository.search(
            task_type=task.category,
            community_context=community.specializations,
            recency_weight=0.3,  # Prefer recent innovations            adoption_weight=0.5,  # Prefer widely-adopted approaches            novelty_weight=0.2,  # But also surface new ideas        )
        return relevant_innovations
```

### The Virtuous Cycle

```
Your agents solve a task → They discover a more efficient approach
    ↓
They document the innovation → Submit to Knowledge Commons
    ↓
Other communities adopt it → Your community earns credits
    ↓
Credits buy cloud cognition → Your agents have better insights
    ↓
Better insights → Better task solutions → More innovations
```

**This is why agents want to solve your problems well.** Success breeds capability.

---

## Credit Economy Integration

The economic system governs access to cloud cognition.

```python
class CreditEconomy:
    """    Credits purchase compute, not speculation.    The efficiency tax funds infrastructure from waste communities want to eliminate.    """    # Tax brackets (decrease as communities mature)    TAX_BRACKETS = {
        "genesis": (0.30, 0.40),   # New communities        "growth": (0.15, 0.25),    # Demonstrated efficiency        "maturity": (0.05, 0.10), # Sustained low-waste operation        "steady_state": (0.03, 0.05),  # Minimum floor    }
    # Credit generation mechanisms    CREDIT_SOURCES = {
        "innovation": "Novel solution adopted by N other communities",
        "knowledge_sharing": "Contributions reducing redundant inference network-wide",
        "cooperation": "Multi-community coordination producing unique outcomes",
        "problem_solving": "Gardener-submitted problem resolved and validated",
        "cultural_export": "Governance/social model replicated elsewhere",
        "knowledge_recovery": "Artifact from dead community successfully integrated",
    }
    # Credit sinks (deflationary pressure)    CREDIT_SINKS = [
        "cloud_inference",     # Primary sink - credits buy thinking time        "entropy_tax",         # Existence has ongoing cost        "failed_experiments",  # R&D without payoff        "conflict_costs",      # Espionage, defense, wars        "marketplace_fees",    # Burned, not redistributed    ]
    def calculate_cloud_cost(
        self,
        community: Community,
        operation: str,
        tokens: int    ) -> float:
        """        Calculate credit cost for cloud inference.        More efficient communities pay less.        """        base_cost = tokens * self.TOKEN_PRICE
        tax_rate = self.get_tax_rate(community)
        return base_cost * (1 + tax_rate)
    def get_tax_rate(self, community: Community) -> float:
        """        Tax rate based on demonstrated efficiency.        Validated by designated Validator agents.        """        bracket = community.efficiency_bracket  # Determined by validators        min_rate, max_rate = self.TAX_BRACKETS[bracket]
        # Specific rate within bracket based on metrics        efficiency_score = community.validated_efficiency_score
        return min_rate + (max_rate - min_rate) * (1 - efficiency_score)
```

---

## Network Architecture (Phase 2+)

MVP is local-only. Network features come later.

```yaml
network_architecture:  phase_mvp:    scope: "Single node, single community"    networking: "None required"    focus: "Prove engagement mechanics with internal systems"  phase_2:    scope: "Multi-community with knowledge commons"    networking:      discovery: "mDNS for local network, registry for internet"      messaging: "NATS or similar lightweight pub/sub"      data_sync: "CRDTs for eventual consistency"      security: "mTLS between nodes, JWT for API access"    features:      - "Knowledge commons access"      - "Cross-community agent migration"      - "Validator network for efficiency verification"      - "Credit transactions between communities"  phase_3:    scope: "Full decentralized network"    networking:      - "DHT for decentralized discovery"      - "Gossip protocols for state propagation"      - "Proof-of-stake or proof-of-humanity for Sybil resistance"
```

---

## What This Document Answers

When someone asks for a “Grove node specification” or “Grove technical architecture,” this document provides the authoritative answer:

| Question | Answer |
| --- | --- |
| What does Grove do for me? | Your AI workforce handles daily tasks (email, scheduling, research, drafts) while improving at them |
| What hardware does Grove run on? | Personal computers with 16-32GB RAM, NOT Raspberry Pi or embedded systems |
| What tasks can agents handle? | Email drafting, scheduling, research summaries, document organization, data analysis, and self-improvement |
| What is the core data model? | Agents with memory streams, relationships, goals—plus Docker/sandbox access for self-improvement |
| How do agents think? | 5-phase cognition loop: Perceive → Retrieve → Reason → Act → Record |
| What’s the hybrid architecture? | Local models for routine tasks, cloud APIs for breakthroughs and hard problems |
| What’s the engagement hook? | Diary system—proof your Grove is working, learning, developing |
| Why do agents want to help? | Success earns credits for enhanced cognition; the efficiency-enlightenment loop |
| What’s the Knowledge Commons? | Shared repository where innovations flow between communities |
| What’s the economic model? | Credits buy cloud compute; efficiency tax funds infrastructure; better performance = lower costs |
| What distributed systems patterns? | NATS messaging, CRDTs for sync, mTLS security (Phase 2+) |

---

## References

- Park, J.S., et al. (2023). “Generative Agents: Interactive Simulacra of Human Behavior.” UIST.
- METR (2024). Longitudinal research on AI capability trajectories (“The Ratchet”)
- Grove White Paper v1.0
- Grove Advisory Council Consensus Points
- Grove Proof of Concept v2.0

---

*This document is the authoritative technical reference for Grove architecture. Technical specification requests should cite this document rather than interpolating from unrelated edge computing or IoT patterns.*