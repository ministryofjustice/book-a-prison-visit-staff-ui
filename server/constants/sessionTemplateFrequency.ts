import { SessionSchedule } from '../data/visitSchedulerApiTypes'

const sessionTemplateFrequency: Record<SessionSchedule['sessionTemplateFrequency'], string> = {
  WEEKLY: 'Weekly',
  BI_WEEKLY: 'Fortnightly',
  ONE_OFF: 'One off',
}

export default sessionTemplateFrequency
