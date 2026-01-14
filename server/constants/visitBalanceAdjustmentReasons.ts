import { PrisonerBalanceAdjustmentReason } from '../data/orchestrationApiTypes'

const visitBalanceAdjustmentReasons: Record<PrisonerBalanceAdjustmentReason, string> = {
  GOVERNOR_ADJUSTMENT: 'Governor’s adjustment',
  BALANCE_TRANSFER_FROM_PREVIOUS_PRISON: 'Transferring balances from previous establishment',
  CORRECTIVE_ACTION: 'Correcting an inaccurate balance',
  EXCHANGE_FOR_PIN_PHONE_CREDIT: 'Exchanged for PIN phone credit',
  OTHER: 'Something else',
} as const

export default visitBalanceAdjustmentReasons
