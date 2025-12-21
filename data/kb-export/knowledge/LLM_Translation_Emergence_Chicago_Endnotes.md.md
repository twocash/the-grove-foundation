# How Translation “Emerged” in LLMs — An Academic Exegesis (Chicago Notes)

## So what?

Translation became one of the first “clear proof points” that general-purpose language modeling can produce **new, usable capabilities** without being explicitly trained as a translation system. Researchers repeatedly saw the same pattern: when you (1) scale models and (2) broaden training data across languages, **cross-lingual mapping shows up as a latent structure**—and it becomes visible when an “observer” (a benchmark, prompt, or evaluation harness) asks for translation.

---

## 1) Before LLMs: neural translation required explicit supervision

**Seq2seq NMT (2014)** established that a single neural network could map an input sequence to an output sequence and achieve competitive MT results on WMT’14 (English→French) with supervised parallel data.[1]  
**Attention (2014/2015)** removed the “fixed-length bottleneck” and enabled models to learn soft alignments between source and target tokens, improving translation quality and interpretability.[2]  

**Key point:** At this stage, translation did **not** “emerge” from generic language modeling. It was *an explicit objective* trained on sentence-aligned bilingual corpora.

---

## 2) Production-scale neural MT: GNMT and subword units

Google’s GNMT system (2016) documented the practical breakthroughs required to make deep NMT work at production scale (deep LSTMs, attention + residual connections, and **wordpieces** to handle rare words efficiently).[3] GNMT also reported large reductions in translation errors vs phrase-based production MT in human evaluation.[3]

**Key point:** Still supervised MT—but the system’s internals started to look less like “phrase tables” and more like general representation learning.

---

## 3) The Transformer: a scaling-friendly architecture that unlocked multitask learning

The Transformer (2017) replaced recurrence with self-attention, dramatically improving parallelism and making it easier to scale training and model capacity.[4] It quickly became the default architecture for both MT and later LLMs.

**Why it matters for emergence:** Once translation and general language modeling share the same architecture family, it becomes plausible that a model trained broadly on text could develop translation competence as one more “mode” of language use.

---

## 4) The first major “emergence moment”: zero-shot translation from multilingual training

Johnson et al. (2016/2017) showed that **multilingual NMT** with a simple target-language token can translate between language pairs **never seen during training** (“zero-shot translation”).[5] The paper explicitly reports implicit bridging and analyzes evidence consistent with an internal “interlingua”-like representation.[5]

**This is the canonical academic origin of the “it emerged” translation story.**  
Researchers did not add an explicit Japanese↔Korean (example) parallel corpus; the capability appeared when the model was trained on multiple languages with shared parameters and then evaluated on an unseen direction.[5] Popular press coverage amplified the “universal language” framing, but the primary documentation is in the paper itself.[5]

---

## 5) A second “emergence moment”: unsupervised translation without parallel data

Lample et al. (2018) demonstrated that neural MT can be learned using **only monolingual corpora**, via techniques like denoising objectives and iterative back-translation—achieving strong BLEU scores on WMT benchmarks without any parallel sentences.[6] Related work also framed unsupervised MT as learning a shared latent space that supports translation.[7]

**Key point:** Translation appeared as a self-supervised consequence of (a) learning language modeling priors in each language and (b) forcing cycle-consistency via back-translation.

---

## 6) LLM-era emergence: translation as a byproduct of generic pretraining + prompting

OpenAI’s GPT-2 report argued that language models trained on broad web text can begin to learn tasks “without explicit supervision” when demonstrations of those tasks appear naturally in data (e.g., translated text, bilingual pages, parallel snippets).[8]  
GPT-3 then formalized **few-shot prompting**: the same model can be instructed (in-context) to perform tasks like translation from a handful of examples, without gradient updates.[9]

**Interpretation:**  
- The model is not “a translation system” in the classical pipeline sense.  
- But its learned representation contains enough cross-lingual structure that translation can be *elicited* when an observer supplies the right prompt pattern (examples, instruction style, language tags).

---

## 7) Multilingual pretraining at scale: T5→mT5 and the role of mC4

T5 (Raffel et al.) established the text-to-text framing and emphasized the role of large-scale pretraining plus task formatting.[10]  
mT5 extended this approach to **101 languages** using a new multilingual Common Crawl dataset and reported strong multilingual transfer, while also noting issues like “accidental translation” in zero-shot settings (a clue that multilingual competence is present but must be controlled).[11]

**Key point:** Large multilingual corpora increase the probability that translation-like mappings are learned implicitly—even when “translation” is not the single training objective.

---

## 8) Scaling laws and discontinuous gains: “emergent abilities” framing

Wei et al. (2022) popularized the modern definition of emergent abilities: capabilities not present in smaller models but present in larger ones, in ways that aren’t well-predicted by small-model extrapolation.[12]  
PaLM reported that scaling produced breakthrough few-shot performance across many benchmarks, including multilingual tasks, and noted discontinuous improvements on subsets of BIG-bench tasks as scale increased.[13]

**How this connects to translation:** translation often behaves like a threshold capability: below a certain scale (or multilingual coverage), performance is weak; beyond it, quality can jump sharply—especially for zero/few-shot settings.

---

## 9) Data mining and evaluation: making emergence visible at the ecosystem level

Two practical enablers made “emergent translation” easier to demonstrate and measure:

**(A) Web-scale parallel mining.** CCMatrix scaled bitext mining to billions of sentence pairs across many languages, enabling strong MT systems trained largely from mined data.[14]  
**(B) Many-to-many evaluation.** FLORES-101 provided a high-quality, professionally translated benchmark across 101 languages and enabled systematic evaluation of many-to-many multilingual translation.[15]  
Meta’s NLLB project scaled MT to ~200 languages and evaluated tens of thousands of directions using FLORES-200, documenting the engineering and data pipeline required to support the long tail.[16]

**Key point:** Emergence is partly an *observer problem*: until the community built broad benchmarks and mining pipelines, many capabilities may have existed “in latent form” but were not measured.

---

## 10) Grove metaphor: observer-enabled emergence

If you map this history into your Grove metaphor:

- **The grove** is the model’s learned representation space: a dense ecosystem of patterns learned from large-scale text.
- **The observer** is the evaluation harness (benchmarks, prompts, probes) that *selects* a path through that space.
- **Emergence** happens when a capability becomes *reliably observable and usable*—often after crossing thresholds in scale, multilingual coverage, or prompting format.[12][13]

Translation is a clean example because it has:  
1) clear success metrics (BLEU, human eval),  
2) many languages to test, and  
3) multiple documented “surprise” moments (zero-shot multilingual NMT; unsupervised MT; few-shot LLM prompting).[5][6][9]

---

# Endnotes (Chicago Notes with URLs)

1. Ilya Sutskever, Oriol Vinyals, and Quoc V. Le, “Sequence to Sequence Learning with Neural Networks,” *arXiv* (2014), https://arxiv.org/abs/1409.3215.  
2. Dzmitry Bahdanau, Kyunghyun Cho, and Yoshua Bengio, “Neural Machine Translation by Jointly Learning to Align and Translate,” *arXiv* (2014), https://arxiv.org/abs/1409.0473.  
3. Yonghui Wu et al., “Google’s Neural Machine Translation System: Bridging the Gap between Human and Machine Translation,” *arXiv* (2016), https://arxiv.org/abs/1609.08144.  
4. Ashish Vaswani et al., “Attention Is All You Need,” *arXiv* (2017), https://arxiv.org/abs/1706.03762.  
5. Melvin Johnson et al., “Google’s Multilingual Neural Machine Translation System: Enabling Zero-Shot Translation,” *Transactions of the Association for Computational Linguistics* 5 (2017), https://arxiv.org/abs/1611.04558.  
6. Guillaume Lample et al., “Phrase-Based & Neural Unsupervised Machine Translation,” in *Proceedings of EMNLP 2018* (2018), https://arxiv.org/abs/1804.07755.  
7. Guillaume Lample et al., “Unsupervised Machine Translation Using Monolingual Corpora Only,” *arXiv* (2017), https://arxiv.org/abs/1711.00043.  
8. Alec Radford et al., “Language Models are Unsupervised Multitask Learners,” OpenAI (2019), https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf.  
9. Tom B. Brown et al., “Language Models are Few-Shot Learners,” *Advances in Neural Information Processing Systems* 33 (2020), https://arxiv.org/abs/2005.14165.  
10. Colin Raffel et al., “Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer,” *Journal of Machine Learning Research* 21, no. 140 (2020), https://arxiv.org/abs/1910.10683.  
11. Linting Xue et al., “mT5: A Massively Multilingual Pre-trained Text-to-Text Transformer,” *arXiv* (2020), https://arxiv.org/abs/2010.11934.  
12. Jason Wei et al., “Emergent Abilities of Large Language Models,” *arXiv* (2022), https://arxiv.org/abs/2206.07682.  
13. Aakanksha Chowdhery et al., “PaLM: Scaling Language Modeling with Pathways,” *arXiv* (2022), https://arxiv.org/abs/2204.02311.  
14. Holger Schwenk et al., “CCMatrix: Mining Billions of High-Quality Parallel Sentences on the Web,” in *Proceedings of ACL-IJCNLP 2021* (2021), https://arxiv.org/abs/1911.04944.  
15. Naman Goyal et al., “The FLORES-101 Evaluation Benchmark for Low-Resource and Multilingual Machine Translation,” *Transactions of the Association for Computational Linguistics* 10 (2022), https://arxiv.org/abs/2106.03193.  
16. NLLB Team et al., “No Language Left Behind: Scaling Human-Centered Machine Translation,” *arXiv* (2022), https://arxiv.org/abs/2207.04672.  
