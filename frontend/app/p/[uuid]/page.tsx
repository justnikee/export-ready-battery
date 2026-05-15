"use client";

import { useEffect, useMemo, useState, type ComponentProps } from "react";
import { useParams, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { CertificateView } from "@/components/passport/certificate-view";
import { RequestMagicLinkModal } from "@/components/passport/request-magic-link-modal";
import { AlertCircle, Loader2, Download, Wrench, Globe } from "lucide-react";
import {
  resolveLocale,
  createTranslator,
  SUPPORTED_LOCALES,
  type Locale,
} from "@/lib/i18n/i18n";

type CertificatePassport = ComponentProps<typeof CertificateView>["passport"];

export default function PublicPassportPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [passport, setPassport] = useState<CertificatePassport | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<
    "error_not_found" | "error_generic" | null
  >(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [locale, setLocale] = useState<Locale>("en");
  const [showLangMenu, setShowLangMenu] = useState(false);

  // Resolve locale from ?lang= param or browser language
  useEffect(() => {
    setLocale(
      resolveLocale(
        searchParams ? new URLSearchParams(searchParams.toString()) : undefined,
      ),
    );
  }, [searchParams]);

  const t = useMemo(() => createTranslator(locale), [locale]);

  // Switch language by updating the URL query param
  const switchLang = (lang: Locale) => {
    setLocale(lang);
    setShowLangMenu(false);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", lang);
    window.history.replaceState({}, "", url.toString());
  };

  useEffect(() => {
    const fetchPassport = async () => {
      try {
        const response = await api.get(`/passports/${params.uuid}`);
        const data = response.data;

        // The API returns a tier-aware view (PublicPassportView, PartnerPassportView,
        // or RegulatorPassportView). When `access_tier` is present and there is no
        // nested `passport` key, reshape the flat response to the CertificateView format.
        if (data.access_tier && !data.passport) {
          const reshaped: CertificatePassport = {
            passport: {
              uuid: data.uuid,
              serial_number: data.serial_number,
              manufacture_date: data.manufacture_date,
              created_at: data.created_at,
              status: data.status,
              state_of_health: data.state_of_health,
              last_soh_update_timestamp: data.last_soh_update_timestamp,
              // Partner-tier fields (only present with access_token)
              ownership_history: data.ownership_history,
              repair_events: data.repair_events,
              replacement_events: data.replacement_events,
              recycling_date: data.recycling_date,
              recycling_status: data.recycling_status,
              recycler_epr_id: data.recycler_epr_id,
              current_owner_identifier: data.current_owner_identifier,
            },
            specs: data.specs,
            tenant: data.tenant,
            batch_name: data.batch_name,
            model_name: data.model_name,
            manufacturing_start_date: data.manufacturing_start_date,
            manufacturing_end_date: data.manufacturing_end_date,
            market_region: data.market_region,
            domestic_value_add: data.domestic_value_add,
            cell_source: data.cell_source,
            pli_compliant: data.pli_compliant,
            hsn_code: data.hsn_code,
            bill_of_entry_no: data.bill_of_entry_no,
            country_of_origin: data.country_of_origin,
            customs_date: data.customs_date,
            product_type: data.product_type,
            template_variant: data.template_variant,
          };
          setPassport(reshaped);
        } else {
          // RegulatorPassportView or legacy shape — already has nested passport key
          setPassport(data);
        }
        recordScan(params.uuid as string);
      } catch (err: unknown) {
        console.error("Failed to fetch passport", err);
        const apiError = err as { response?: { status?: number } };
        setErrorKey(
          apiError.response?.status === 404
            ? "error_not_found"
            : "error_generic",
        );
      } finally {
        setLoading(false);
      }
    };
    if (params.uuid) {
      fetchPassport();
    }
  }, [params.uuid]);

  const recordScan = async (passportId: string) => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"}/scans/record`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ passport_id: passportId }),
        },
      );
    } catch (e) {
      console.debug("Scan recording skipped", e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-6">
          <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
          <div className="text-center">
            <p className="text-foreground text-lg">{t("loading_title")}</p>
            <p className="text-muted-foreground text-sm mt-1">
              {t("loading_subtitle")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (errorKey) {
    return (
      <div className="min-h-screen bg-muted p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-card rounded-lg shadow-none border border-border p-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl text-foreground mb-2">{t("error_title")}</h2>
          <p className="text-muted-foreground mb-6">{t(errorKey)}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-background hover:bg-primary/90 text-white rounded-lg font-medium transition-colors"
          >
            {t("error_retry")}
          </button>
        </div>
      </div>
    );
  }

  if (!passport) {
    return (
      <div className="min-h-screen bg-muted p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-card rounded-lg shadow-none border border-border p-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-6">
            <AlertCircle className="h-8 w-8 text-amber-500" />
          </div>
          <h2 className="text-xl text-foreground mb-2">
            {t("unavailable_title")}
          </h2>
          <p className="text-muted-foreground mb-6">
            {t("unavailable_subtitle")}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-background hover:bg-primary/90 text-white rounded-lg font-medium transition-colors"
          >
            {t("error_retry")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted pb-24 md:pb-8">
      {/* Official Header Bar */}
      <header className="w-full bg-card border-b border-border py-3 px-4 md:px-8 sticky top-0 z-20 shadow-none print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <span className=" text-sm">ER</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-foreground text-sm tracking-tight">
                ANVAYALABS
              </p>
              <p className="text-muted-foreground text-xs">
                {t("header_registry")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1.5 px-3 py-2 bg-card hover:bg-background text-foreground font-medium text-sm rounded-lg border border-border transition-colors"
              >
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {SUPPORTED_LOCALES.find((l) => l.code === locale)?.flag}{" "}
                  {locale.toUpperCase()}
                </span>
                <span className="sm:hidden">
                  {SUPPORTED_LOCALES.find((l) => l.code === locale)?.flag}
                </span>
              </button>
              {showLangMenu && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowLangMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-none z-40 min-w-[160px] overflow-hidden">
                    {SUPPORTED_LOCALES.map(({ code, label, flag }) => (
                      <button
                        key={code}
                        onClick={() => switchLang(code)}
                        className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${locale === code ? "bg-emerald-500/10 text-emerald-500 font-medium" : "text-foreground hover:bg-background"}`}
                      >
                        <span>{flag}</span>
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Download PDF Button */}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3 py-2 bg-card hover:bg-background text-foreground font-medium text-sm rounded-lg border border-border transition-colors"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">{t("header_download")}</span>
            </button>

            {/* Desktop CTA */}
            <button
              onClick={() => setShowActionModal(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-orange-500/100 hover:bg-orange-600 text-white text-sm rounded-lg shadow-none transition-all"
            >
              <Wrench className="h-4 w-4" />
              {t("header_install")}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - The "Paper" */}
      <main className="px-4 md:px-6 pt-6 md:pt-8">
        <div className="max-w-4xl mx-auto">
          {/* The Certificate Paper */}
          <div className="bg-card rounded-lg shadow-none border border-border overflow-hidden print:shadow-none print:border-0">
            <CertificateView passport={passport} locale={locale} />
          </div>
        </div>
      </main>

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-card border-t border-border md:hidden z-30 shadow-none print:hidden">
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex-1 py-3 bg-muted hover:bg-muted text-foreground font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="h-4 w-4" />
            PDF
          </button>
          <button
            onClick={() => setShowActionModal(true)}
            className="flex-2 py-3 bg-orange-500/100 hover:bg-orange-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Wrench className="h-4 w-4" />
            {t("header_install")}
          </button>
        </div>
      </div>

      {/* Action Modal */}
      {showActionModal && (
        <RequestMagicLinkModal
          passportId={params.uuid as string}
          onClose={() => setShowActionModal(false)}
          locale={locale}
          status={passport.passport?.status}
        />
      )}
    </div>
  );
}
