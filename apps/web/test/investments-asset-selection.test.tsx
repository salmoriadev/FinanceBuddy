import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FormEvent, ReactNode } from "react";
import Investments from "@/pages/Investments";
import { InvestmentAssetSearchResult } from "@/types/finance";

const mocks = vi.hoisted(() => ({
  addAsset: { mutateAsync: vi.fn(), isPending: false },
  addTransaction: { mutateAsync: vi.fn(), isPending: false },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "user@example.com" },
    loading: false,
  }),
}));

vi.mock("@/hooks/useAssets", () => ({
  useAssets: () => ({
    assets: [],
    addAsset: mocks.addAsset,
    lookupQuote: { mutateAsync: vi.fn() },
    searchAssets: vi.fn(),
  }),
}));

vi.mock("@/hooks/usePortfolios", () => ({
  usePortfolios: () => ({
    defaultPortfolio: { id: "portfolio-1", is_default: true },
    isLoading: false,
    error: null,
  }),
  usePortfolioPositions: () => ({ positions: [], isLoading: false }),
  usePortfolioTransactions: () => ({ addTransaction: mocks.addTransaction }),
  usePortfolioQuoteRefresh: () => ({
    refreshQuotes: { mutateAsync: vi.fn(), isPending: false },
  }),
  usePortfolioDividends: () => ({
    dividends: [],
    isLoading: false,
    createDividend: { mutateAsync: vi.fn(), isPending: false },
    receiveDividend: { mutateAsync: vi.fn(), isPending: false },
  }),
  usePortfolioMonthlyReport: () => ({ report: null, isLoading: false }),
}));

vi.mock("@/hooks/useFormatter", () => ({
  useFormatter: () => ({
    formatCurrency: (value: number) => `R$ ${value}`,
    formatNumber: String,
    formatPercent: (value: number) => `${value}%`,
    formatDate: String,
  }),
}));

vi.mock("@/components/layout/AppLayout", () => ({
  AppLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/features/investments/components", () => ({
  AssetClassGroup: () => null,
  AssetDialog: () => null,
  AssetsTab: () => null,
  CalculationDialog: () => null,
  DividendDialog: () => null,
  DividendsTab: () => null,
  EmptyPanel: () => null,
  MonthlyReportTab: () => null,
  SummaryCard: () => null,
  TransactionDialog: ({
    onCreateAssetFromSearch,
    onSubmit,
    transactionForm,
  }: {
    onCreateAssetFromSearch: (result: InvestmentAssetSearchResult) => void;
    onSubmit: (event: FormEvent) => void;
    transactionForm: { unitPrice: string };
  }) => (
    <form onSubmit={onSubmit}>
      <button
        type="button"
        onClick={() =>
          onCreateAssetFromSearch({
            symbol: "HGLG11",
            name: "Pátria Log FII",
            type: "fii",
            exchange: "B3",
            currency: "BRL",
            provider: "brapi",
            price: 147.21,
          })
        }
      >
        Selecionar HGLG11
      </button>
      <output aria-label="Preço unitário selecionado">
        {transactionForm.unitPrice}
      </output>
      <button type="submit">Registrar evento de teste</button>
    </form>
  ),
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <>{children}</>,
  BarChart: ({ children }: { children: ReactNode }) => <>{children}</>,
  PieChart: ({ children }: { children: ReactNode }) => <>{children}</>,
  Bar: () => null,
  CartesianGrid: () => null,
  Cell: () => null,
  Pie: () => null,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

describe("Investments asset selection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps a searched asset pending until the portfolio event is submitted", async () => {
    mocks.addTransaction.mutateAsync.mockResolvedValue({ id: "tx-1" });
    render(<Investments />);

    fireEvent.click(screen.getByRole("button", { name: "Selecionar HGLG11" }));

    expect(mocks.addAsset.mutateAsync).not.toHaveBeenCalled();
    expect(
      screen.getByLabelText("Preço unitário selecionado"),
    ).toHaveTextContent("147.21");

    fireEvent.click(
      screen.getByRole("button", { name: "Registrar evento de teste" }),
    );

    await waitFor(() => expect(mocks.addTransaction.mutateAsync).toHaveBeenCalled());
    expect(mocks.addTransaction.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        assetId: undefined,
        asset: {
          ticker: "HGLG11",
          name: "Pátria Log FII",
          class: "fii",
          currency: "BRL",
        },
      }),
    );
    expect(mocks.addAsset.mutateAsync).not.toHaveBeenCalled();
  });
});
