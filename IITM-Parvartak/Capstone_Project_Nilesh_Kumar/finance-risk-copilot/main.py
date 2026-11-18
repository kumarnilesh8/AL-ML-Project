from crew import crew

def main():
    print("\n" + "="*60)
    print("  FINANCE RISK COPILOT - Decision Support Only")
    print("="*60 + "\n")

    user_query = input("Enter your risk query: ").strip()
    risk_domain = input(
        "Risk domain (credit_risk / liquidity_risk / market_risk / operational_risk / regulatory_compliance) "
        "[press Enter to auto-detect]: "
    ).strip() or "auto"

    inputs = {
        "user_query": user_query,
        "risk_domain": risk_domain,
    }

    print("\n Running analysis pipeline...\n")
    result = crew.kickoff(inputs=inputs)

    print("\n" + "="*60)
    print("  FINAL RESPONSE")
    print("="*60)
    print(result)

if __name__ == "__main__":
    main()