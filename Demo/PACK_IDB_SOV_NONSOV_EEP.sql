create or replace PACKAGE BODY pack_idb_sov_nonsov_eep AS
/*-----------------------------------------------------------------------------------------------
-- Author    Shobhit/Neena/Sarthak
-- Created   19-02-2026
-- Purpose   SOVEREIGN/NONSOVEREIGN Classification in DIM9 of Account table for ISDB
-- Client    ISDB
-- Version   1.1

----------
Date-23-02-2026--- Logic added for attribute_16
Date-25-02-2026---addition-updating security_positions dim9
 ------------------------------------------------------------------------------------------------*/

    PROCEDURE proc_sov_nonsov IS

        v_reporting_date     DATE := pack_install.get_reporting_date;
        v_workspace_id       NUMBER := pack_install.get_workspace_id;
        v_position           NUMBER := pack_install.get_position;
        v_step               VARCHAR2(4);
        v_load_into_ctxt_id  NUMBER;
        v_partition_pk_rd_ws VARCHAR2(12);
        v_partition_pk_rd    VARCHAR2(12);
        v_rec_count          NUMBER;
        v_where_clause       VARCHAR2(300);
        v_process_name       VARCHAR2(300) := 'proc_sov_nonsov';
    BEGIN
        pack_log.log_begin(
                          v_process_name,
                          NULL,
                          NULL,
                          'BEGIN OF EEP PROCEDURE- ' || v_process_name
        );
        v_load_into_ctxt_id := pack_context.compute_context_id(
                                                              TO_DATE(v_reporting_date, 'DD-MON-RR'),
                                                              v_workspace_id,
                                                              v_position
                               );

        pack_context.contextid_open(v_load_into_ctxt_id);
        SELECT DISTINCT
            c.pk_rd_ws,
            c.pk_rd
        INTO
            v_partition_pk_rd_ws,
            v_partition_pk_rd
        FROM
            contexts       c,
            reporting_days d
        WHERE
            d.rd_id = c.rd_id
            AND d.reporting_date = TO_DATE(v_reporting_date, 'DD-MON-RR')
            AND c.workspace_id = v_workspace_id
            AND c.position = v_position
            AND c.pk_ws IS NOT NULL;

        v_step := '000';
        pack_ddl.activate_trigger(
                                 'ACCOUNT',
                                 'N'
        );
        v_where_clause := 'partition_key='
                          || ''''
                          || v_partition_pk_rd
                          || '''';
        v_step := '001';
        pack_log.log_write(
                          'I',
                          'F',
                          v_process_name,
                          v_step,
                          'IM contracts → derive from LOANDEPO'
        );
----------------------------------------------------------------------------
-- Step 1: _IM contracts → derive from LOANDEPO AND security_positions
----------------------------------------------------------------------------
     MERGE INTO account a
        USING loandepo l ON ( a.account_reference = l.contract_reference || '_IM' )
        WHEN MATCHED THEN UPDATE
        SET a.dim9 = l.dim9
        WHERE
            a.dim9 IS NULL;

	UPDATE account a
   SET a.dim9 = (
     SELECT s.dim9
       FROM security_positions sp
       JOIN security s
         ON s.security_reference = sp.security_reference
      WHERE sp.contract_reference = REGEXP_REPLACE(a.account_reference, '_IM$', '')
        AND s.dim9 IS NOT NULL
   )
WHERE a.dim9 IS NULL
  AND REGEXP_LIKE(a.account_reference, '_IM$');



        v_step := '002';
        pack_log.log_write(
                          'I',
                          'F',
                          v_process_name,
                          v_step,
                          'derive from ENTITY'
        );

------------------------------------------------------------
-- Step 2: derive from ENTITY attribute_16
------------------------------------------------------------
        MERGE INTO account a
        USING entity e ON ( a.counterparty_code = e.entity_code )
        WHEN MATCHED THEN UPDATE
        SET a.dim9 =
            CASE
           WHEN e.attribute_16 LIKE 'SOV%' THEN 'Sovereign'
            ELSE
            'Non Sovereign'
            END
        WHERE
            a.dim9 IS NULL
            AND a.dim13 IN (
       'Commodity_murabaha_liabilites_Revaluation-K2',
       'Commodity murabaha liabilites-K2_ACC',
       'Murabaha Financing Impairment Provision -D',
       'Murabaha_Financing_Revaluation-D',
       'Murabaha Financing-D_ACC',
       'Impairment Provision - Commodity Placements-B',
       'Commodity_Murabaha_Revaluation-B',
       'Impairment Provision - Cash ' || CHR(38) || ' Banks-A',
       'Local Banks-A',
       'Foreign Banks-A',
       'Revaluation - Bank Balances-A',
       'Cash and Cheques under Collection-A',
       'Revaluation - Cash ' || CHR(38) || ' Cheques-A',
       'Revaluation- Checks for collection clear account-A',
       'Revaluations Cash and Cash Equivalents -A'
     );

/*-----------------------------------------------------------------------------------------------
These COA/dim13 was part of step2 ,however needs to update when not null
 as account_reference under these dim13 are both sov and non sov but getting updated from attribute_16
 ------------------------------------------------------------------------------------------------------*/

		 UPDATE account a
         SET a.dim9 = 'Sovereign'
         WHERE a.dim13 IN ('Foreign Banks-A','Murabaha Financing Impairment Provision -D')
         AND EXISTS (
         SELECT 1
      FROM entity e
      WHERE e.entity_code = a.counterparty_code
        AND UPPER(e.attribute_16) LIKE '%SOVEREIGN%'
  );
/*----------------------------------------------------------------------------------
-- : Update SECURITY_POSITIONS.DIM9 from SECURITY.DIM9
-- Join key: SECURITY_POSITIONS.SECURITY_REFERENCE = SECURITY.SECURITY_REFERENCE
--------------------------------------------------------------------------------------------*/
MERGE INTO security_positions sp
USING (
    SELECT
        sp.security_reference,
        s.dim9 AS sec_dim9
    FROM security_positions sp
    JOIN security s
      ON s.security_reference = sp.security_reference
    WHERE s.dim9 IS NOT NULL
) src
ON (sp.security_reference = src.security_reference)
WHEN MATCHED THEN UPDATE
SET sp.dim9 = src.sec_dim9
WHERE sp.dim9 IS NULL
   OR sp.dim9 <> src.sec_dim9;

------------------------------------------------------------
-- Step 3: COA-based tagging (DIM13)
------------------------------------------------------------

        v_step := '002';
        pack_log.log_write(
                          'I',
                          'F',
                          v_process_name,
                          v_step,
                          'COA-based tagging (DIM13)'
        );
        UPDATE account a
        SET
            a.dim9 =
                CASE
    /* ---------------- NON SOVEREIGN ---------------- */
                WHEN a.dim13 IN ( 'Other Investments Impairment Provision - C3', 'Other_Investments Investment in Other Funds_Revaluation-C3'
                , 'Other Investments Investment in Other Funds-C3', 'Other_Investments - Investment in Equity Funds_Revaluation-C3', 'Other_Investments Investment in Leasing Funds_Revaluation-C3'
                , 'Other Investments Investment in Leasing Funds-C3', 'Sukuk_Investments_Revaluation-L', 'Sukuk Investments Impairment Provision -L'
                , 'Sukuk Investments-L-ACC', 'Equity Investments Impairment Provision-H', 'Investment in Associates Impairment Provision-C2'
                , 'Investment in Associates-C2_ACC', 'Investments in Assoc. - Gain/Loss Disposal-C2', 'Sukuk_Liabilities_Revaluation-K1'
                , 'Sukuk Liabilities-K1_A', 'Property, equipment and intangibles-J', 'Loans to Affiliates - I', 'Accrued Other Income - I'
                , 'Swaps Revaluation-I', 'Loans_to_Affiliates Revaluation- I', 'Interfunds-I', 'Rev. Murabaha Cost -I', 'CML - Operations Processing - I'
                , 'CML - Prepayment - I', 'CML - Clearing accounts -I', 'CML - Interfund Receipts -I', 'Staff Cost - I', 'Vendor Accounts-I'
                , 'Revaluation Fx Clearing Account -I', 'Other assets FX (Misys)-I', 'Interfund-K', 'Revaluation-Third party investments - Sukuk-K'
                , 'Revaluation-Third party investments - Commodities-K', 'Other liabilities-K','Other Liabilities-K', 'Other liabilities travel-K', 'Other liabilities funds clearing accout-K'
                , 'Other liabilities Different grant -K', 'Other Liabilities - Vendor Account-K', 'Other Liabilities - staff cost-K',
                'Other Liabilities - Pension Liability-K', 'Other Liabilities - Ijarah Differed-K', 'Deposits-K', 'Capital Installment Due-N'
                , 'Called Up Capital-N', 'Paid up Capital-N', 'Reserves and Earnings-N1', 'Sukuk Investments-L' )
                     OR a.dim13 LIKE 'Interfund%'
                     OR a.dim13 LIKE 'OCR%'
                     OR a.dim13 LIKE 'Pension%'
                     OR a.dim13 LIKE 'Third(Related) party%Sukuk Liabilities-K'
                     OR a.dim13 LIKE 'Third(Related) party%Commodity Liabilities-K'
                     OR a.dim13 LIKE 'Fair value - Third Party - Investment in Sukuk-K' THEN
                'Non Sovereign'

    /* ---------------- SOVEREIGN ---------------- */
                WHEN a.dim13 IN ( 'Impairment Provision - Loans - G', 'Loans_(Qard)_Revaluation-G', 'Unearned income - Restricted Mudaraba-O'
                , 'CML - Restricted Mudaraba Markup Receivable-O', 'Restricted Mudaraba Impairment Provision-O', 'Restricted_Mudaraba_Revaluation-O'
                , 'Depreciation Ijara Assets-E', 'Ijarah Syndication-E', 'Istisnaa assets-S-ACC', 'Instalment sale-F-ACC', 'Service_Ijahara_Revaluation-S'
                , 'Instalment_sale_Revaluation-F', 'Project_Murabaha_Revaluation-F', 'Ijarah assets Revaluation-E', 'Ijarah_Syndication_Revaluation-E'
                , 'Istisnaa_assets_Revaluation-S', 'Instalment sale Impairment Provision-F', 'Ijarah assets Impairment Provision-E', 'Istisnaa assets Impairment-S'
                , 'Service Ijahara-S_ACC', 'Project Murabaha-F-ACC', 'Istisnaa assets-S', 'Ijarah assets-E', 'Instalment sale-F', 'Project Murabaha-F'
                , 'Ijarah assets-E-ACC', 'Profit_Sharing_Revaluation-O' ) THEN
                'Sovereign'
                ELSE
                a.dim9
                END
        WHERE
            a.dim9 IS NULL;

        pack_ddl.activate_trigger(
                                 'ACCOUNT',
                                 'Y'
        );
        pack_batch.recheck_table(
                                'ACCOUNT',
                                v_where_clause
        );
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            pack_log.log_write(
                              v_log_type           => 'E',
                              v_application        => 'F',
                              v_function           => 'proc_sov_nonsov',
                              v_step               => v_step,
                              v_message            => 'Unhandled error',
                              v_parameters         => sqlerrm,
                              v_contract_reference => NULL
            );

            --dbms_output.put_line(sqlerrm);
            pack_log.log_end('proc_sov_nonsov');
            ROLLBACK;
            RAISE;
    END proc_sov_nonsov;

END pack_idb_sov_nonsov_eep;
/