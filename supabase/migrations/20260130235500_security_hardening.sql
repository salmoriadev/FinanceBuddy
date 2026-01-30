-- Security hardening: constraints and stricter RLS policies

-- Numeric constraints
ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_amount_positive CHECK (amount > 0);

ALTER TABLE public.budgets
  ADD CONSTRAINT budgets_amount_positive CHECK (amount > 0);

ALTER TABLE public.savings_goals
  ADD CONSTRAINT savings_goals_target_positive CHECK (target_amount > 0),
  ADD CONSTRAINT savings_goals_current_nonnegative CHECK (current_amount >= 0);

ALTER TABLE public.investments
  ADD CONSTRAINT investments_invested_nonnegative CHECK (invested_amount >= 0),
  ADD CONSTRAINT investments_current_nonnegative CHECK (current_value >= 0);

-- Recreate policies with stricter checks
-- Categories
DROP POLICY IF EXISTS "Users can view their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can create their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON public.categories;

CREATE POLICY "Users can view their own categories" ON public.categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categories" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" ON public.categories
  FOR DELETE USING (auth.uid() = user_id);

-- Transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;

CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions" ON public.transactions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND (
      category_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.categories c
        WHERE c.id = category_id AND c.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their own transactions" ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      category_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.categories c
        WHERE c.id = category_id AND c.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete their own transactions" ON public.transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Budgets
DROP POLICY IF EXISTS "Users can view their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can create their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete their own budgets" ON public.budgets;

CREATE POLICY "Users can view their own budgets" ON public.budgets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own budgets" ON public.budgets
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND (
      category_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.categories c
        WHERE c.id = category_id AND c.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their own budgets" ON public.budgets
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      category_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.categories c
        WHERE c.id = category_id AND c.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete their own budgets" ON public.budgets
  FOR DELETE USING (auth.uid() = user_id);

-- Savings goals
DROP POLICY IF EXISTS "Users can view their own savings goals" ON public.savings_goals;
DROP POLICY IF EXISTS "Users can create their own savings goals" ON public.savings_goals;
DROP POLICY IF EXISTS "Users can update their own savings goals" ON public.savings_goals;
DROP POLICY IF EXISTS "Users can delete their own savings goals" ON public.savings_goals;

CREATE POLICY "Users can view their own savings goals" ON public.savings_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own savings goals" ON public.savings_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own savings goals" ON public.savings_goals
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own savings goals" ON public.savings_goals
  FOR DELETE USING (auth.uid() = user_id);

-- Investments
DROP POLICY IF EXISTS "Users can view their own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can create their own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can update their own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can delete their own investments" ON public.investments;

CREATE POLICY "Users can view their own investments" ON public.investments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own investments" ON public.investments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investments" ON public.investments
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investments" ON public.investments
  FOR DELETE USING (auth.uid() = user_id);
