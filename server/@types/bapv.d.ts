export type PrisonerDetailsItem = { classes: string } & (
  | { html: string; text?: never }
  | { html?: never; text: string }
)

export type SystemToken = (arg0?: string) => Promise<string>
