import { describe, expect, it } from "vitest";
import {
  assetClassMeta,
  quoteStatusLabels,
} from "@/features/investments/constants";
import { getErrorMessage } from "@/features/investments/utils";
import { normalizeLocale } from "@/hooks/usePreferences";
import { DEFAULT_LOCALE, translate } from "@/lib/i18n";

describe("Brazilian Portuguese interface", () => {
  it("uses pt-BR for new and existing profiles", () => {
    expect(DEFAULT_LOCALE).toBe("pt-BR");
    expect(normalizeLocale()).toBe("pt-BR");
    expect(normalizeLocale("en")).toBe("pt-BR");
    expect(normalizeLocale("pt-BR")).toBe("pt-BR");
  });

  it("keeps primary navigation and investment copy in Portuguese", () => {
    expect(translate("pt-BR", "nav.dashboard")).toBe("Painel");
    expect(translate("pt-BR", "nav.transactions")).toBe("Transações");
    expect(translate("pt-BR", "nav.reports")).toBe("Relatórios");
    expect(assetClassMeta.stock.label).toBe("Ações");
    expect(quoteStatusLabels.incomplete).toBe("Sem cotação");
  });

  it("does not expose common server errors in English", () => {
    expect(
      getErrorMessage(new Error("Internal server error"), "Falha inesperada"),
    ).toBe("Ocorreu um erro interno. Tente novamente.");
    expect(getErrorMessage(new Error("Unauthorized"), "Falha inesperada")).toBe(
      "Sua sessão expirou. Entre novamente.",
    );
    expect(
      getErrorMessage(new Error("Unexpected provider failure"), "Falha inesperada"),
    ).toBe("Falha inesperada");
  });
});
