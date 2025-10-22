> Edited for use in IDX on 07/09/12

# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

#### Android

Android previews are defined as a `workspace.onStart` hook and started as a vscode task when the workspace is opened/started.

Note, if you can't find the task, either:
- Rebuild the environment (using command palette: `IDX: Rebuild Environment`), or
- Run `npm run android -- --tunnel` command manually run android and see the output in your terminal. The device should pick up this new command and switch to start displaying the output from it.

In the output of this command/task, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You'll also find options to open the app's developer menu, reload the app, and more.

#### Web

Web previews will be started and managred automatically. Use the toolbar to manually refresh.

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

---

## Five-phase tapering plan

The quitting assistant now generates a structured, five-phase tapering plan that combines behavioral guidance with daily nicotine ceilings. The end-to-end workflow is handled inside the onboarding flow when the user confirms their inputs.

High-level flow:

1. The user’s product usage, pace preference, and demographics are collected during onboarding.
2. [`calculateCurrentNicotine()`](app/(onboarding)/creating-plan.tsx:511) consolidates all products into a single daily intake estimate (mg).
3. [`generatePlan()`](app/(onboarding)/creating-plan.tsx:436) builds a Gemini prompt describing the mandated five-phase scaffold, validates the JSON payload, and normalizes the response.
4. If the generation request fails, the user sees a friendly retry message—no non-personalized plan is injected.
5. The resulting schedule and metadata are merged into global state so downstream screens (success, dashboard, profile) render consistent insights.

### TaperingPhase schema

Each plan phase is persisted as:

```ts
type TaperingPhase = {
  phase: number;                // 1 – 5
  phaseName: string;            // localized label e.g. “Adaptação inicial”
  psychologicalRole: string;    // behavioral focus for the stage
  durationDays: number;         // strictly > 0
  nicotineGoalMg: number;       // final daily ceiling for that phase
  totalReductionPercent: number;// per-phase reduction ratio (0.0–1.0)
  dailyTargetsMg: number[];     // length === durationDays, monotone decreasing
  notes?: string | null;        // optional coaching message
};
```

All five phases are always present. Phase 5 is a stabilization block where `dailyTargetsMg` is an array of zeros and `totalReductionPercent` equals 0. Phase 4 is capped at ≤ 5 mg/day to guarantee near-zero intake before consolidation.

### Phase blueprint

| Phase | Behavioral role                    | Default percent range | Guidance |
|-------|------------------------------------|-----------------------|----------|
| 1     | Adaptação inicial                  | 10–20 %               | Stabilize routines and build awareness. |
| 2     | Ajustar ao desmame                 | 10–25 %               | Swap habits, layer gentle substitutions. |
| 3     | Reforço de controlo                | 15–25 %               | Reinforce coping scripts and support. |
| 4     | Quase livre                        | 20–30 %               | Intensive reduction finishing ≤ 5 mg/day. |
| 5     | Consolidação sem nicotina          | 0 %                   | Maintain nicotine-free identity. |

The literal defaults vary with `quittingPace` (slow, standard, fast) via deterministic guard-rail percentages and durations that keep the AI output within safe bounds.

### Plan metadata

The onboarding context now stores additional descriptors:

| Field              | Description |
|--------------------|-------------|
| `planFramework`    | Always `"five-phase-structured"` for the current generator. |
| `planGeneratedAt`  | ISO timestamp when Gemini (or fallback) produced the plan. |
| `planStartDate`    | Anchor date for phase calculations (defaults to generation timestamp). |
| `planCurrency`     | ISO currency code or symbol used in savings projections. |
| `totalDuration`    | Sum of `durationDays` across the five phases. |
| `estimatedSavings` | Currency-normalized savings for the full tapering journey. |

These values surface in the onboarding success screen and the profile dashboard so the user can track progress alongside the daily quota logic.

### Consumption tracking integration

The dashboard and profile experiences consume `dailyTargetsMg` to compute the current allowable limit. When the plan includes per-day targets, the UI selects the correct index relative to `planStartDate`; otherwise it falls back to each phase’s `nicotineGoalMg`. This ensures that gradual reductions, not just phase endpoints, are always honored.

### Prompt and validation guardrails

Key safeguards in [`buildPlanPrompt()`](app/(onboarding)/creating-plan.tsx:197) and [`normalizePlanResponse()`](app/(onboarding)/creating-plan.tsx:330):

- Enforce plain JSON responses (`markdown` fences stripped before parsing).
- Require nulls for missing values instead of prose placeholders.
- Clamp durations, phase counts, and percentage ranges per blueprint.
- Rebuild `dailyTargetsMg` arrays whenever Gemini returns inconsistent data.
- Surface a clear retry prompt if plan generation fails so the user is never given a generic plan.

When modifying or extending the schema, update the shared types in [`context/AppContext.tsx`](context/AppContext.tsx:11) and [`types/types.ts`](types/types.ts:21) alongside the prompt and parsing logic.
