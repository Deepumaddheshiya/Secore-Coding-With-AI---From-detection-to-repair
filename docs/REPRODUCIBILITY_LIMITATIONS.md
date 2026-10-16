# Reproducibility Limitations and Threats to Validity

In adherence to strict scientific reproducibility standards, this document articulates the boundary between what can be reproduced locally without external services versus external dependencies evaluated in the original published research paper.

---

## 1. Cloud AI and Closed-Source LLMs (Strict Non-Use Policy)

The published research paper evaluated four proprietary commercial cloud LLMs:
1. **GPT-4o** (October 2024 via OpenAI API)
2. **GPT-4.1** (September 2025 via OpenAI API, checkpoint `2025-04-14`)
3. **GPT-5** (September 2025 via OpenAI API, checkpoint `2025-08-07`)
4. **Claude Opus 4.1** (September 2025 via Anthropic API, checkpoint `2025-08-05`)

### Strict Constraints Applied in this Project:
- **No Paid APIs or API Keys:** The system neither requires nor stores any cloud API keys.
- **No Cloud AI Invocations:** Zero network requests are made to OpenAI, Anthropic, Google, or any external LLM endpoint.
- **Historical vs Local Separation:** The published model scores (e.g. GPT-4.1's 82.14% detection rate) are strictly presented under a clearly marked banner:
  > **"RESEARCH PAPER REPORTED RESULTS — NOT LOCAL EXECUTION RESULTS"**
- **Local Alternative:** The local system uses either an offline local model via **Ollama** (e.g., `qwen2.5-coder:1.5b`) running strictly on localhost, or deterministic **rule-based semantic security repair routines**.

---

## 2. Static Application Security Testing (SAST) Scanner Dependencies

The paper utilized four static analysis tools:
1. **Flawfinder (v2.0.19):** Open-source Python package. Supported and executable locally.
2. **Semgrep (v1.87.0):** CLI available locally if installed via pip/binary.
3. **Cppcheck (v2.14.0):** Open-source C/C++ engine available if installed.
4. **Snyk (v1.1294.0):** CLI tool that typically mandates an account/auth token. In this offline system, Snyk is handled gracefully: if unauthenticated or not installed, its execution is marked as `Unavailable / Requires Authentication` rather than fabricating output or substituting another scanner's findings.

---

## 3. Dataset Size & Download Constraints

- Full DevGPT archives span gigabytes across multiple snapshots.
- When the complete multi-gigabyte dataset is not locally mounted, the application operates on representative C/C++/C# code samples extracted directly from the paper's listings and issue files.
- The UI transparently presents the exact number of files processed locally versus the 2,315 files analyzed in the historical paper.

---

## 4. Threats to Validity Documented in the Paper

As detailed by the authors (Section 7 of the paper):
1. **Internal Validity (False Negatives):** Static analysis tools miss certain vulnerability classes (e.g., complex race conditions or higher-order business logic flaws). Triangulation across multiple scanners mitigates but does not eliminate this.
2. **Subjective Manual Annotation:** Manual review of 114 files by three authors involves human judgment, which may introduce subtle categorization biases.
3. **External Validity (Sample Size):** 56 confirmed vulnerabilities across 48 files represents a curated subset; extrapolation to all AI-generated software must be made with care.
4. **Data Contamination / Leakage:** The authors note that the marked improvement from October 2024 (53–56%) to September 2025 (75–82%) may partially reflect training data contamination, as preprints and the public DevGPT repository were available online between the two experimental dates.
5. **Construct Validity (Non-Determinism):** LLM outputs can vary across repeated sampling with non-zero temperatures.
