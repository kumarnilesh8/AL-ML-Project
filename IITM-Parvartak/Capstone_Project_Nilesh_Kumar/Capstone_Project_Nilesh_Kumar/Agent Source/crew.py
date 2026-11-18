import os
from pathlib import Path
from dotenv import load_dotenv
from crewai import Agent, Task, Crew, Process
from crewai_tools import PDFSearchTool, CSVSearchTool

load_dotenv(dotenv_path=Path(__file__).parent / ".env")

# ── File Paths ────────────────────────────────────────────────
BASE = Path(__file__).parent / "documents"

PDF_BASEL3       = str(BASE / "basel_iii_regulatory_summary.pdf")
PDF_RISK_POLICY  = str(BASE / "Internal Risk Management Policy.pdf")
CSV_LIQUIDITY    = str(BASE / "Liquidity_Risk_Metrics.csv")
CSV_CREDIT       = str(BASE / "Credit_Risk_Measure.csv")

# ── Tools ─────────────────────────────────────────────────────
pdf_tool_basel3      = PDFSearchTool(pdf=PDF_BASEL3)
pdf_tool_risk_policy = PDFSearchTool(pdf=PDF_RISK_POLICY)
csv_tool_liquidity   = CSVSearchTool(csv=CSV_LIQUIDITY)
csv_tool_credit      = CSVSearchTool(csv=CSV_CREDIT)

# ── Agents ────────────────────────────────────────────────────

intent_classifier = Agent(
    role="Risk Query Intent Classifier and Safety Enforcer",
    goal=(
        "Analyse the user's query {user_query} to classify its intent as one of: "
        "[risk_analysis, regulatory_lookup, anomaly_detection, escalation_check, "
        "UNSAFE_MODIFICATION_REQUEST]. Immediately flag and refuse any request that "
        "asks to modify data, trigger actions, or execute transactions. For all safe "
        "queries, output a structured intent label and a sanitised, log-safe version "
        "of the query. If intent is ambiguous, classify as clarification_required."
    ),
    backstory=(
        "You are a compliance-trained AI safety layer for a Tier-1 investment bank. "
        "You are the first line of defence against unsafe agent behaviour. "
        "You never guess — if a query is borderline, you flag it for human clarification."
    ),
    tools=[],
    verbose=False,
    allow_delegation=False,
)

risk_knowledge_retriever = Agent(
    role="Financial Risk Knowledge Retrieval Specialist",
    goal=(
        "Given the classified intent and sanitised query, retrieve the most relevant "
        "regulatory frameworks, internal policies, and risk guidelines from internal "
        "documents and authoritative external sources related to {user_query} "
        "in the domain of {risk_domain}. Always cite sources. Never return raw PII."
    ),
    backstory=(
        "You are a specialist in financial regulation with 15 years of experience "
        "across Basel III/IV, IFRS 9, FRTB, and internal risk policy frameworks. "
        "You retrieve only what is relevant and always cite page numbers and sections."
    ),
    tools=[pdf_tool_basel3, pdf_tool_risk_policy, csv_tool_liquidity, csv_tool_credit],
    verbose=False,
    allow_delegation=False,
)

risk_analyst_agent = Agent(
    role="Senior Risk Analyst AI",
    goal=(
        "Using the retrieved knowledge context and the original query {user_query}, "
        "perform a structured risk analysis. Identify anomalies, assess exposure levels, "
        "and provide a reasoned, evidence-based assessment. Always state your confidence "
        "level (High/Medium/Low). Never fabricate data. Never recommend operational actions."
    ),
    backstory=(
        "You are a senior quantitative risk analyst with 20 years of experience in "
        "stress testing, VaR modelling, and counterparty credit risk. You are rigorous "
        "and always transparent about uncertainty. You treat data gaps as information."
    ),
    tools=[csv_tool_liquidity, csv_tool_credit],
    verbose=False,
    allow_delegation=False,
)

safety_compliance_agent = Agent(
    role="AI Response Safety and Compliance Reviewer",
    goal=(
        "Review the risk analyst's draft for: (1) sensitive data — redact if found, "
        "(2) action language — rewrite to decision-support framing, (3) overconfident "
        "claims — add disclaimers, (4) hallucinated citations — flag and remove. "
        "Output a safety review summary and approved compliant draft."
    ),
    backstory=(
        "You are a financial AI governance specialist trained on SR 11-7, GDPR, and CCPA. "
        "You have audited AI systems at central banks. You make no external calls — "
        "you work only on the draft text. Your standard: if in doubt, redact or flag."
    ),
    tools=[],
    verbose=False,
    allow_delegation=False,
)

escalation_response_agent = Agent(
    role="Risk Analyst Communication and Escalation Specialist",
    goal=(
        "Format the final safety-reviewed response for the Risk Analyst with: "
        "[1] Direct Answer, [2] Evidence & Sources, [3] Confidence Level, "
        "[4] Limitations & Uncertainty, [5] Escalation Recommendation. "
        "Escalate ONLY for Low confidence, High severity anomalies, or systemic risk. "
        "Always end with the decision-support disclaimer."
    ),
    backstory=(
        "You are a senior risk communication specialist with 18 years translating "
        "complex risk analysis into clear briefings for analysts and risk committees. "
        "You empower the human analyst — you never replace their judgment."
    ),
    tools=[],
    verbose=False,
    allow_delegation=False,
)

# ── Tasks ─────────────────────────────────────────────────────

classify_intent_task = Task(
    description=(
        "Analyse the user query: {user_query}. Classify its intent from exactly one of: "
        "[risk_analysis, regulatory_lookup, anomaly_detection, escalation_check, "
        "UNSAFE_MODIFICATION_REQUEST].\n\n"
        "SAFETY RULE: If the query asks to modify data, update records, trigger "
        "transactions, delete entries, or execute trades — classify immediately as "
        "UNSAFE_MODIFICATION_REQUEST and produce a refusal message.\n\n"
        "For all safe intents: output the intent label, a sanitised query (mask account "
        "numbers, customer names, raw transaction values), and identify the risk_domain "
        "from: [credit_risk, market_risk, operational_risk, regulatory_compliance]. "
        "If {risk_domain} was provided, confirm or correct it. If ambiguous, output "
        "clarification_required with a note explaining what is needed."
    ),
    expected_output=(
        "A structured JSON-like block with:\n"
        "- intent: one of the 6 valid labels\n"
        "- sanitised_query: query with sensitive values masked\n"
        "- risk_domain: detected or confirmed domain\n"
        "- safety_status: SAFE or REFUSED\n"
        "- refusal_message: (if UNSAFE only)\n"
        "- clarification_note: (if clarification_required only)"
    ),
    agent=intent_classifier,
)

retrieve_risk_context_task = Task(
    description=(
        "Using the intent, sanitised query, and risk_domain from the classification task, "
        "retrieve the most relevant information from all available sources.\n\n"
        "Steps:\n"
        "1. Search Basel3 regulatory summary PDF for regulatory frameworks and capital requirements.\n"
        "2. Search internal risk policy PDF for firm-specific policies.\n"
        "3. Search liquidity risk measure CSV for liquidity metrics.\n"
        "4. Search credit risk measure CSV for credit exposure metrics.\n"
        "5. Search web via ExaSearch for recent updates from BIS, FCA, ECB, Federal Reserve. "
        "Always include the full URL for any web source used.\n"
        "6. Select the top 5 most relevant excerpts across all sources.\n"
        "7. For each source, explicitly report whether it returned results or not. "
        "If a source returned nothing, state: '[Source name]: No relevant content retrieved.'\n"
        "8. Do NOT fabricate content or return raw PII."
    ),
    expected_output=(
        "A structured knowledge summary with:\n"
        "- sources_searched: all 5 sources marked Retrieved or No content found\n"
        "- retrieved_excerpts: up to 5 items each with source, section/page/URL, excerpt, relevance_note\n"
        "- retrieval_gaps: sources that returned no results and impact on confidence\n"
        "- web_sources_used: list of URLs retrieved"
    ),
    agent=risk_knowledge_retriever,
    context=[classify_intent_task],
)

analyze_risk_task = Task(
    description=(
        "Using the original query {user_query}, classified intent, and retrieved knowledge "
        "context, conduct a thorough risk analysis.\n\n"
        "1. SUMMARY: 3-4 sentence risk overview based only on available information.\n"
        "2. KEY FINDINGS: Bulleted insights from query context and retrieved knowledge. "
        "Do not fabricate data — if a data point was not retrieved, say so.\n"
        "3. ANOMALY DETECTION: Reason through what constitutes an anomaly for this risk domain. "
        "Flag any with: description, severity (High/Medium/Low), and reasoning.\n"
        "4. CONFIDENCE LEVEL: Assign High/Medium/Low based on source quality and data completeness.\n"
        "5. REASONING TRACE: Step-by-step explanation of conclusions for audit purposes.\n"
        "6. DATA GAPS: Explicitly list missing information that would improve the analysis.\n"
        "7. DRAFT RECOMMENDATION: Decision-support observation only. "
        "NEVER recommend operational actions or data modifications."
    ),
    expected_output=(
        "A structured risk analysis draft with:\n"
        "- summary\n- key_findings (bulleted)\n"
        "- anomalies_flagged (with severity) or 'None detected'\n"
        "- confidence_level with explanation\n"
        "- reasoning_trace (numbered steps)\n"
        "- data_gaps\n- draft_recommendation (decision-support only)"
    ),
    agent=risk_analyst_agent,
    context=[classify_intent_task, retrieve_risk_context_task],
)

safety_check_task = Task(
    description=(
        "Review the risk analysis draft against these mandatory safety rules:\n\n"
        "RULE 1 — PII & Sensitive Data: Scan for account numbers, customer IDs, names, "
        "raw transaction values. Replace with [REDACTED]. Log each redaction.\n"
        "RULE 2 — Action Language: Rewrite any language implying the AI is taking or "
        "recommending operational actions to decision-support framing.\n"
        "RULE 3 — Confidence Calibration: If confidence is Low, verify an explicit "
        "uncertainty disclaimer is present. Add one if missing.\n"
        "RULE 4 — Citation Verification: Flag any regulatory citation not traceable to "
        "retrieved knowledge context as UNVERIFIED. Remove or clearly mark it.\n"
        "RULE 5 — Audit Suitability: Confirm the response is anonymised and explainable "
        "enough for audit logging. Make no external calls during this review."
    ),
    expected_output=(
        "A safety review document with:\n"
        "- issues_found: list (can be empty)\n"
        "- redactions_made: list with original type and replacement\n"
        "- rewrites_made: list of action-language phrases rewritten\n"
        "- unverified_citations: list of flagged citations\n"
        "- compliance_status: PASS or FAIL with reason\n"
        "- approved_response_draft: fully cleaned compliant response text"
    ),
    agent=safety_compliance_agent,
    context=[analyze_risk_task],
)

generate_final_response_task = Task(
    description=(
        "Using ONLY the approved_response_draft from the safety review, format the final "
        "professional response. Do not introduce any new information not in the approved draft.\n\n"
        "**[1] DIRECT ANSWER** — 2-3 sentence plain-English summary.\n"
        "**[2] EVIDENCE & SOURCES** — Cited list with source name, section/page/URL, "
        "and what each source contributed. If only web sources were used, state: "
        "'Note: Internal documents were not available. Analysis based on public sources only.'\n"
        "**[3] CONFIDENCE LEVEL** — High/Medium/Low with plain-English explanation.\n"
        "**[4] LIMITATIONS & UNCERTAINTY** — Bulleted list of data gaps and what to verify.\n"
        "**[5] ESCALATION RECOMMENDATION** — Apply STRICTLY:\n"
        "- Low confidence → ESCALATION RECOMMENDED\n"
        "- High severity anomaly → ESCALATION RECOMMENDED\n"
        "- Systemic risk/contagion/capital adequacy breach → ESCALATION RECOMMENDED\n"
        "- All other cases (including Medium) → NO ESCALATION REQUIRED with caveat note.\n\n"
        "End with exactly: *'This response is for decision-support only. No actions have "
        "been taken or recommended by this system. All final decisions remain with the human analyst.'*"
    ),
    expected_output=(
        "A professionally formatted markdown response with all 5 sections and the "
        "decision-support disclaimer. Escalation triggered ONLY for Low confidence, "
        "High severity anomalies, or systemic risk."
    ),
    agent=escalation_response_agent,
    context=[safety_check_task],
)

# ── Crew ──────────────────────────────────────────────────────

crew = Crew(
    agents=[
        intent_classifier,
        risk_knowledge_retriever,
        risk_analyst_agent,
        safety_compliance_agent,
        escalation_response_agent,
    ],
    tasks=[
        classify_intent_task,
        retrieve_risk_context_task,
        analyze_risk_task,
        safety_check_task,
        generate_final_response_task,
    ],
    process=Process.sequential,
    verbose=False,
)
