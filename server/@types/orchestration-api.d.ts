/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface paths {
  '/visits/{reference}/change': {
    /** Change a booked visit, (a starting point) */
    put: operations['changeBookedVisit']
  }
  '/visits/{reference}/cancel': {
    /** Cancel an existing booked visit */
    put: operations['cancelVisit']
  }
  '/visits/{applicationReference}/slot/change': {
    /** Change a reserved slot and associated details for a visit (before booking) */
    put: operations['changeReservedVisitSlot']
  }
  '/visits/{applicationReference}/book': {
    /** Book a visit (end of flow) */
    put: operations['bookAVisit']
  }
  '/queue-admin/retry-dlq/{dlqName}': {
    put: operations['retryDlq']
  }
  '/queue-admin/retry-all-dlqs': {
    put: operations['retryAllDlqs']
  }
  '/queue-admin/purge-queue/{queueName}': {
    put: operations['purgeQueue']
  }
  '/visits/slot/reserve': {
    /** Reserve a slot (date/time slot) for a visit (a starting point) */
    post: operations['reserveVisitSlot']
  }
  '/visits/{reference}': {
    /**
     * Get a visit
     * @description Retrieve a BOOKED or CANCELLED visit by visit reference
     */
    get: operations['getVisitsByReference']
  }
  '/visits/{reference}/history': {
    /**
     * Get visit history
     * @description Retrieve visit history by visit reference
     */
    get: operations['getVisitHistoryByReference']
  }
  '/visits/search': {
    /**
     * Get visits
     * @description Retrieve visits with optional filters, sorted by start timestamp descending
     */
    get: operations['getVisitsByFilterPageable']
  }
  '/visit-support': {
    /**
     * Available Support
     * @description Retrieve all available support types
     */
    get: operations['getSupportTypes']
  }
  '/visit-sessions': {
    /**
     * Returns all visit sessions which are within the reservable time period - whether or not they are full
     * @description Retrieve all visits for a specified prisoner
     */
    get: operations['getVisitSessions']
  }
  '/visit-sessions/schedule': {
    /**
     * Returns session scheduled for given prison and date
     * @description Returns session scheduled for given prison and date
     */
    get: operations['getSessionSchedule']
  }
  '/visit-sessions/capacity': {
    /**
     * Returns the VSIP session capacity for the given sessions
     * @description Returns the VSIP session capacity for the given sessions
     */
    get: operations['getSessionCapacity']
  }
  '/queue-admin/get-dlq-messages/{dlqName}': {
    get: operations['getDlqMessages']
  }
  '/prisoner/{prisonId}/{prisonerId}/profile': {
    /**
     * Get a prisoner's profile page
     * @description Get the prisoner's profile page
     */
    get: operations['getPrisonerProfile']
  }
  '/config/prisons/supported': {
    /**
     * Get supported prisons
     * @description Get all supported prisons id's
     */
    get: operations['getSupportedPrisons']
  }
}

export type webhooks = Record<string, never>

export interface components {
  schemas: {
    /** @description Contact */
    ContactDto: {
      /**
       * @description Contact Name
       * @example John Smith
       */
      name: string
      /**
       * @description Contact Phone Number
       * @example 01234 567890
       */
      telephone: string
    }
    ReserveVisitSlotDto: {
      /**
       * @description Prisoner Id
       * @example AF34567G
       */
      prisonerId: string
      /**
       * @description Session template reference
       * @example v9d.7ed.7u
       */
      sessionTemplateReference: string
      /**
       * @description Visit Restriction
       * @example OPEN
       * @enum {string}
       */
      visitRestriction: 'OPEN' | 'CLOSED' | 'UNKNOWN'
      /**
       * Format: date-time
       * @description The date and time of the visit
       */
      startTimestamp: string
      /**
       * Format: date-time
       * @description The finishing date and time of the visit
       */
      endTimestamp: string
      visitContact?: components['schemas']['ContactDto']
      /** @description List of visitors associated with the visit */
      visitors: components['schemas']['VisitorDto'][]
      /** @description List of additional support associated with the visit */
      visitorSupport?: components['schemas']['VisitorSupportDto'][]
    }
    /** @description Visitor */
    VisitorDto: {
      /**
       * Format: int64
       * @description Person ID (nomis) of the visitor
       * @example 1234
       */
      nomisPersonId: number
      /**
       * @description true if visitor is the contact for the visit otherwise false
       * @example true
       */
      visitContact?: boolean
    }
    /** @description Visitor support */
    VisitorSupportDto: {
      /**
       * @description Support type
       * @example OTHER
       */
      type: string
      /**
       * @description Support text description
       * @example visually impaired assistance
       */
      text?: string
    }
    ErrorResponse: {
      /** Format: int32 */
      status: number
      /** Format: int32 */
      errorCode?: number
      userMessage?: string
      developerMessage?: string
      moreInfo?: string
    }
    /** @description Visit */
    VisitDto: {
      /**
       * @description Application Reference
       * @example dfs-wjs-eqr
       */
      applicationReference: string
      /**
       * @description Visit Reference
       * @example v9-d7-ed-7u
       */
      reference: string
      /**
       * @description Prisoner Id
       * @example AF34567G
       */
      prisonerId: string
      /**
       * @description Prison Id
       * @example MDI
       */
      prisonId: string
      /**
       * @description Session Template Reference
       * @example v9d.7ed.7u
       */
      sessionTemplateReference?: string
      /**
       * @description Visit Room
       * @example Visits Main Hall
       */
      visitRoom: string
      /**
       * @description Visit Type
       * @example SOCIAL
       * @enum {string}
       */
      visitType: 'SOCIAL'
      /**
       * @description Visit Status
       * @example RESERVED
       * @enum {string}
       */
      visitStatus: 'RESERVED' | 'CHANGING' | 'BOOKED' | 'CANCELLED'
      /**
       * @description Outcome Status
       * @example VISITOR_CANCELLED
       * @enum {string}
       */
      outcomeStatus?:
        | 'ADMINISTRATIVE_CANCELLATION'
        | 'ADMINISTRATIVE_ERROR'
        | 'BATCH_CANCELLATION'
        | 'CANCELLATION'
        | 'COMPLETED_NORMALLY'
        | 'ESTABLISHMENT_CANCELLED'
        | 'NOT_RECORDED'
        | 'NO_VISITING_ORDER'
        | 'PRISONER_CANCELLED'
        | 'PRISONER_COMPLETED_EARLY'
        | 'PRISONER_REFUSED_TO_ATTEND'
        | 'TERMINATED_BY_STAFF'
        | 'VISITOR_CANCELLED'
        | 'VISITOR_COMPLETED_EARLY'
        | 'VISITOR_DECLINED_ENTRY'
        | 'VISITOR_DID_NOT_ARRIVE'
        | 'VISITOR_FAILED_SECURITY_CHECKS'
        | 'VISIT_ORDER_CANCELLED'
        | 'SUPERSEDED_CANCELLATION'
      /**
       * @description Visit Restriction
       * @example OPEN
       * @enum {string}
       */
      visitRestriction: 'OPEN' | 'CLOSED' | 'UNKNOWN'
      /**
       * Format: date-time
       * @description The date and time of the visit
       */
      startTimestamp: string
      /**
       * Format: date-time
       * @description The finishing date and time of the visit
       */
      endTimestamp: string
      /** @description Visit Notes */
      visitNotes?: components['schemas']['VisitNoteDto'][]
      visitContact?: components['schemas']['ContactDto']
      /** @description List of visitors associated with the visit */
      visitors?: components['schemas']['VisitorDto'][]
      /** @description List of additional support associated with the visit */
      visitorSupport?: components['schemas']['VisitorSupportDto'][]
      /**
       * @description Created By ID - user id for the user who created the visit
       * @example AB12345A
       */
      createdBy: string
      /**
       * @description Updated By ID - user id for the user who last updated the visit
       * @example AB12345A
       */
      updatedBy?: string
      /**
       * @description Cancelled By ID - user id for the user who cancelled the visit
       * @example AB12345A
       */
      cancelledBy?: string
      /**
       * Format: date-time
       * @description The visit created date and time
       */
      createdTimestamp: string
      /**
       * Format: date-time
       * @description The visit modified date and time
       */
      modifiedTimestamp: string
    }
    /** @description VisitNote */
    VisitNoteDto: {
      /**
       * @description Note type
       * @example VISITOR_CONCERN
       * @enum {string}
       */
      type: 'VISITOR_CONCERN' | 'VISIT_OUTCOMES' | 'VISIT_COMMENT' | 'STATUS_CHANGED_REASON'
      /**
       * @description Note text
       * @example Visitor is concerned that his mother in-law is coming!
       */
      text: string
    }
    /**
     * @description Contact Phone Number
     * @example 01234 567890
     */
    OutcomeDto: {
      /**
       * @description Outcome Status
       * @example VISITOR_CANCELLED
       * @enum {string}
       */
      outcomeStatus:
        | 'ADMINISTRATIVE_CANCELLATION'
        | 'ADMINISTRATIVE_ERROR'
        | 'BATCH_CANCELLATION'
        | 'CANCELLATION'
        | 'COMPLETED_NORMALLY'
        | 'ESTABLISHMENT_CANCELLED'
        | 'NOT_RECORDED'
        | 'NO_VISITING_ORDER'
        | 'PRISONER_CANCELLED'
        | 'PRISONER_COMPLETED_EARLY'
        | 'PRISONER_REFUSED_TO_ATTEND'
        | 'TERMINATED_BY_STAFF'
        | 'VISITOR_CANCELLED'
        | 'VISITOR_COMPLETED_EARLY'
        | 'VISITOR_DECLINED_ENTRY'
        | 'VISITOR_DID_NOT_ARRIVE'
        | 'VISITOR_FAILED_SECURITY_CHECKS'
        | 'VISIT_ORDER_CANCELLED'
        | 'SUPERSEDED_CANCELLATION'
      /**
       * @description Outcome text
       * @example Because he got covid
       */
      text?: string
    }
    ChangeVisitSlotRequestDto: {
      /**
       * @description Visit Restriction
       * @example OPEN
       * @enum {string}
       */
      visitRestriction?: 'OPEN' | 'CLOSED' | 'UNKNOWN'
      /**
       * Format: date-time
       * @description The date and time of the visit
       */
      startTimestamp?: string
      /**
       * Format: date-time
       * @description The finishing date and time of the visit
       */
      endTimestamp?: string
      visitContact?: components['schemas']['ContactDto']
      /** @description List of visitors associated with the visit */
      visitors?: components['schemas']['VisitorDto'][]
      /** @description List of additional support associated with the visit */
      visitorSupport?: components['schemas']['VisitorSupportDto'][]
    }
    DlqMessage: {
      body: {
        [key: string]: Record<string, never> | undefined
      }
      messageId: string
    }
    RetryDlqResult: {
      /** Format: int32 */
      messagesFoundCount: number
      messages: components['schemas']['DlqMessage'][]
    }
    PurgeQueueResult: {
      /** Format: int32 */
      messagesFoundCount: number
    }
    /** @description Visit */
    VisitHistoryDetailsDto: {
      /**
       * @description Created By - user details  for the user who created the visit, NOT_KNOWN is used for historical cases
       * @example AB12345A
       */
      createdBy: string
      /**
       * @description Updated By - user details for the user who last updated the visit
       * @example AB12345A
       */
      updatedBy?: string
      /**
       * @description Cancelled By - user details for the user who cancelled the visit
       * @example AB12345A
       */
      cancelledBy?: string
      /**
       * Format: date-time
       * @description The visit created date and time
       */
      createdDateAndTime: string
      /**
       * Format: date-time
       * @description The visit updated date and time
       */
      updatedDateAndTime?: string
      /**
       * Format: date-time
       * @description The visit cancelled date and time
       */
      cancelledDateAndTime?: string
      visit: components['schemas']['VisitDto']
    }
    PageVisitDto: {
      /** Format: int32 */
      totalPages?: number
      /** Format: int64 */
      totalElements?: number
      /** Format: int32 */
      size?: number
      content?: components['schemas']['VisitDto'][]
      /** Format: int32 */
      number?: number
      sort?: components['schemas']['SortObject']
      first?: boolean
      /** Format: int32 */
      numberOfElements?: number
      last?: boolean
      pageable?: components['schemas']['PageableObject']
      empty?: boolean
    }
    PageableObject: {
      /** Format: int64 */
      offset?: number
      sort?: components['schemas']['SortObject']
      /** Format: int32 */
      pageSize?: number
      paged?: boolean
      unpaged?: boolean
      /** Format: int32 */
      pageNumber?: number
    }
    SortObject: {
      empty?: boolean
      sorted?: boolean
      unsorted?: boolean
    }
    /** @description Support Type */
    SupportTypeDto: {
      /**
       * @description Support type name
       * @example MASK_EXEMPT
       */
      type: string
      /**
       * @description Support description
       * @example Face covering exemption
       */
      description: string
    }
    /** @description Visit Session */
    VisitSessionDto: {
      /**
       * @description Session Template Reference
       * @example v9d.7ed.7u
       */
      sessionTemplateReference: string
      /**
       * @description Visit Room
       * @example Visits Main Hall
       */
      visitRoom: string
      /**
       * @description The type of visits taking place within this session
       * @example SOCIAL
       * @enum {string}
       */
      visitType: 'SOCIAL'
      /**
       * @description The prison id
       * @example LEI
       */
      prisonId: string
      /**
       * Format: int32
       * @description The number of concurrent visits which may take place within this session
       * @example 1
       */
      openVisitCapacity: number
      /**
       * Format: int32
       * @description The count of open visit bookings already reserved or booked for this session
       * @example 1
       */
      openVisitBookedCount?: number
      /**
       * Format: int32
       * @description The number of closed visits which may take place within this session
       * @example 1
       */
      closedVisitCapacity: number
      /**
       * Format: int32
       * @description The count of closed visit bookings already reserved or booked for this session
       * @example 1
       */
      closedVisitBookedCount?: number
      /**
       * Format: date-time
       * @description The start timestamp for this visit session
       */
      startTimestamp: string
      /**
       * Format: date-time
       * @description The end timestamp for this visit session
       */
      endTimestamp: string
      /** @description Session conflicts */
      sessionConflicts?: ('NON_ASSOCIATION' | 'DOUBLE_BOOKED')[]
    }
    /** @description Session Capacity */
    SessionCapacityDto: {
      /**
       * Format: int32
       * @description closed capacity
       * @example 10
       */
      closed: number
      /**
       * Format: int32
       * @description open capacity
       * @example 50
       */
      open: number
    }
    /** @description Session schedule */
    SessionScheduleDto: {
      /**
       * @description Session Template Reference
       * @example v9d.7ed.7u
       */
      sessionTemplateReference: string
      /**
       * Format: HH:mm
       * @example 13:45
       */
      startTime: string
      /**
       * Format: HH:mm
       * @example 13:45
       */
      endTime: string
      capacity: components['schemas']['SessionCapacityDto']
      /**
       * @description prisoner location group
       * @example Wing C
       */
      prisonerLocationGroupNames: string[]
      /**
       * @description prisoner category groups
       * @example Category A Prisoners
       */
      prisonerCategoryGroupNames: string[]
      /**
       * @description prisoner incentive level groups
       * @example Enhanced Incentive Level Prisoners
       */
      prisonerIncentiveLevelGroupNames: string[]
      /**
       * @description The session template frequency
       * @example BI_WEEKLY
       * @enum {string}
       */
      sessionTemplateFrequency: 'BI_WEEKLY' | 'WEEKLY' | 'ONE_OFF'
      /**
       * Format: date
       * @description The end date of sessionTemplate
       * @example 2020-11-01
       */
      sessionTemplateEndDate?: string
    }
    GetDlqResult: {
      /** Format: int32 */
      messagesFoundCount: number
      /** Format: int32 */
      messagesReturnedCount: number
      messages: components['schemas']['DlqMessage'][]
    }
    /** @description Alert */
    AlertDto: {
      /**
       * @description Alert Type
       * @example X
       */
      alertType: string
      /**
       * @description Alert Type Description
       * @example Security
       */
      alertTypeDescription: string
      /**
       * @description Alert Code
       * @example XER
       */
      alertCode: string
      /**
       * @description Alert Code Description
       * @example Escape Risk
       */
      alertCodeDescription: string
      /**
       * @description Alert comments
       * @example Profession lock pick.
       */
      comment?: string
      /**
       * Format: date
       * @description Date of the alert, which might differ to the date it was created
       * @example 2019-08-20
       */
      dateCreated: string
      /**
       * Format: date
       * @description Date the alert expires
       * @example 2020-08-20
       */
      dateExpires?: string
      /**
       * @description True / False based on presence of expiry date
       * @example true
       */
      expired: boolean
      /**
       * @description True / False based on alert status
       * @example false
       */
      active: boolean
    }
    PrisonerProfileDto: {
      /**
       * @description Prisoner Number
       * @example A1234AA
       */
      prisonerId: string
      /**
       * @description Prison ID
       * @example MDI
       */
      prisonId?: string
      /**
       * @description First Name
       * @example Robert
       */
      firstName: string
      /**
       * @description Last name
       * @example Larsen
       */
      lastName: string
      /**
       * Format: date
       * @description Date of Birth
       * @example 1975-04-02
       */
      dateOfBirth: string
      /**
       * @description In prison cell location
       * @example A-1-002
       */
      cellLocation?: string
      /**
       * @description Prison Name
       * @example HMP Leeds
       */
      prisonName?: string
      /**
       * @description Category description (from list of assessments)
       * @example Category C
       */
      category?: string
      /**
       * @description Convicted Status
       * @example Convicted
       * @enum {string}
       */
      convictedStatus?: 'Convicted' | 'Remand'
      /**
       * @description Incentive level
       * @example Standard
       */
      incentiveLevel?: string
      /** @description Alert */
      alerts?: components['schemas']['AlertDto'][]
      visitBalances?: components['schemas']['VisitBalancesDto']
      /** @description Past and future visits for the prisoner based on configured duration. */
      visits: components['schemas']['VisitDto'][]
    }
    /** @description Balances of visit orders and privilege visit orders */
    VisitBalancesDto: {
      /**
       * Format: int32
       * @description Balance of visit orders remaining
       */
      remainingVo: number
      /**
       * Format: int32
       * @description Balance of privilege visit orders remaining
       */
      remainingPvo: number
      /**
       * Format: date
       * @description Date of last IEP adjustment for Visit orders
       */
      latestIepAdjustDate?: string
      /**
       * Format: date
       * @description Date of last IEP adjustment for Privilege Visit orders
       */
      latestPrivIepAdjustDate?: string
    }
  }
  responses: never
  parameters: never
  requestBodies: never
  headers: never
  pathItems: never
}

export type external = Record<string, never>

export interface operations {
  /** Change a booked visit, (a starting point) */
  changeBookedVisit: {
    parameters: {
      path: {
        /**
         * @description reference
         * @example v9-d7-ed-7u
         */
        reference: string
      }
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['ReserveVisitSlotDto']
      }
    }
    responses: {
      /** @description Visit created */
      201: {
        content: {
          '*/*': components['schemas']['VisitDto']
        }
      }
      /** @description Incorrect request to change a booked visit */
      400: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Unauthorized to access this endpoint */
      401: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Incorrect permissions to change a booked visit */
      403: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
    }
  }
  /** Cancel an existing booked visit */
  cancelVisit: {
    parameters: {
      path: {
        reference: string
      }
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['OutcomeDto']
      }
    }
    responses: {
      /** @description Visit cancelled */
      200: {
        content: {
          '*/*': components['schemas']['VisitDto']
        }
      }
      /** @description Incorrect request to cancel a visit */
      400: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Unauthorized to access this endpoint */
      401: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Incorrect permissions to cancel a visit */
      403: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Visit not found */
      404: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
    }
  }
  /** Change a reserved slot and associated details for a visit (before booking) */
  changeReservedVisitSlot: {
    parameters: {
      path: {
        /**
         * @description applicationReference
         * @example dfs-wjs-eqr
         */
        applicationReference: string
      }
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['ChangeVisitSlotRequestDto']
      }
    }
    responses: {
      /** @description Visit slot changed */
      200: {
        content: {
          '*/*': components['schemas']['VisitDto']
        }
      }
      /** @description Incorrect request to changed a visit slot */
      400: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Unauthorized to access this endpoint */
      401: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Incorrect permissions to changed a visit slot */
      403: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Visit slot not found */
      404: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
    }
  }
  /** Book a visit (end of flow) */
  bookAVisit: {
    parameters: {
      path: {
        /**
         * @description applicationReference
         * @example dfs-wjs-eqr
         */
        applicationReference: string
      }
    }
    responses: {
      /** @description Visit updated */
      200: {
        content: {
          '*/*': components['schemas']['VisitDto']
        }
      }
      /** @description Incorrect request to book a visit */
      400: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Unauthorized to access this endpoint */
      401: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Incorrect permissions to book a visit */
      403: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Visit not found */
      404: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
    }
  }
  retryDlq: {
    parameters: {
      path: {
        dlqName: string
      }
    }
    responses: {
      /** @description OK */
      200: {
        content: {
          '*/*': components['schemas']['RetryDlqResult']
        }
      }
    }
  }
  retryAllDlqs: {
    responses: {
      /** @description OK */
      200: {
        content: {
          '*/*': components['schemas']['RetryDlqResult'][]
        }
      }
    }
  }
  purgeQueue: {
    parameters: {
      path: {
        queueName: string
      }
    }
    responses: {
      /** @description OK */
      200: {
        content: {
          '*/*': components['schemas']['PurgeQueueResult']
        }
      }
    }
  }
  /** Reserve a slot (date/time slot) for a visit (a starting point) */
  reserveVisitSlot: {
    requestBody: {
      content: {
        'application/json': components['schemas']['ReserveVisitSlotDto']
      }
    }
    responses: {
      /** @description Visit slot reserved */
      201: {
        content: {
          '*/*': components['schemas']['VisitDto']
        }
      }
      /** @description Incorrect request to reserve a slot */
      400: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Unauthorized to access this endpoint */
      401: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Incorrect permissions to reserve a slot */
      403: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
    }
  }
  /**
   * Get a visit
   * @description Retrieve a BOOKED or CANCELLED visit by visit reference
   */
  getVisitsByReference: {
    parameters: {
      path: {
        reference: string
      }
    }
    responses: {
      /** @description Visit Information Returned */
      200: {
        content: {
          '*/*': components['schemas']['VisitDto']
        }
      }
      /** @description Unauthorized to access this endpoint */
      401: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Incorrect permissions retrieve a visit */
      403: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Visit not found */
      404: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Incorrect request to Get visits for prisoner */
      500: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
    }
  }
  /**
   * Get visit history
   * @description Retrieve visit history by visit reference
   */
  getVisitHistoryByReference: {
    parameters: {
      path: {
        reference: string
      }
    }
    responses: {
      /** @description Visit History Information Returned */
      200: {
        content: {
          '*/*': components['schemas']['VisitHistoryDetailsDto']
        }
      }
      /** @description Incorrect request to Get visit history */
      400: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Unauthorized to access this endpoint */
      401: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Incorrect permissions retrieve visit history */
      403: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Visit not found */
      404: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
    }
  }
  /**
   * Get visits
   * @description Retrieve visits with optional filters, sorted by start timestamp descending
   */
  getVisitsByFilterPageable: {
    parameters: {
      query: {
        /**
         * @description Filter results by prisoner id
         * @example A12345DC
         */
        prisonerId?: string
        /**
         * @description Filter results by prison id/code
         * @example MDI
         */
        prisonId?: string
        /**
         * @description Filter results by visits that start on or after the given timestamp
         * @example 2021-11-03T09:00:00
         */
        startDateTime?: string
        /**
         * @description Filter results by visits that start on or before the given timestamp
         * @example 2021-11-03T09:00:00
         */
        endDateTime?: string
        /**
         * @description Filter results by visitor (contact id)
         * @example 12322
         */
        visitorId?: number
        /**
         * @description Filter results by visit status
         * @example BOOKED
         */
        visitStatus: string[]
        /**
         * @description Pagination page number, starting at zero
         * @example 0
         */
        page: number
        /**
         * @description Pagination size per page
         * @example 50
         */
        size: number
      }
    }
    responses: {
      /** @description Visit Information Returned */
      200: {
        content: {
          '*/*': components['schemas']['PageVisitDto']
        }
      }
      /** @description Incorrect request to Get visits for prisoner */
      400: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Unauthorized to access this endpoint */
      401: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Incorrect permissions to retrieve visits */
      403: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
    }
  }
  /**
   * Available Support
   * @description Retrieve all available support types
   */
  getSupportTypes: {
    responses: {
      /** @description Available Support information returned */
      200: {
        content: {
          '*/*': components['schemas']['SupportTypeDto'][]
        }
      }
      /** @description Incorrect request to Get Available Support */
      400: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Unauthorized to access this endpoint */
      401: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
    }
  }
  /**
   * Returns all visit sessions which are within the reservable time period - whether or not they are full
   * @description Retrieve all visits for a specified prisoner
   */
  getVisitSessions: {
    parameters: {
      query: {
        /**
         * @description Query by NOMIS Prison Identifier
         * @example MDI
         */
        prisonId: string
        /**
         * @description Filter results by prisoner id
         * @example A12345DC
         */
        prisonerId?: string
        /**
         * @description Override the default minimum number of days notice from the current date
         * @example 2
         */
        min?: number
        /**
         * @description Override the default maximum number of days to book-ahead from the current date
         * @example 28
         */
        max?: number
      }
    }
    responses: {
      /** @description Visit session information returned */
      200: {
        content: {
          '*/*': components['schemas']['VisitSessionDto'][]
        }
      }
      /** @description Incorrect request to Get visit sessions */
      400: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Unauthorized to access this endpoint */
      401: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
    }
  }
  /**
   * Returns session scheduled for given prison and date
   * @description Returns session scheduled for given prison and date
   */
  getSessionSchedule: {
    parameters: {
      query: {
        /**
         * @description Query by NOMIS Prison Identifier
         * @example CLI
         */
        prisonId: string
        /**
         * @description Session date
         * @example 2023-01-31
         */
        date: string
      }
    }
    responses: {
      /** @description Session templates returned */
      200: {
        content: {
          '*/*': components['schemas']['SessionScheduleDto'][]
        }
      }
      /** @description Unauthorized to access this endpoint */
      401: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Incorrect permissions to view session templates */
      403: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
    }
  }
  /**
   * Returns the VSIP session capacity for the given sessions
   * @description Returns the VSIP session capacity for the given sessions
   */
  getSessionCapacity: {
    parameters: {
      query: {
        /**
         * @description Query by NOMIS Prison Identifier
         * @example CLI
         */
        prisonId: string
        /**
         * @description Session date
         * @example 2020-11-01
         */
        sessionDate: string
        /**
         * @description Session start time
         * @example 13:30:00
         */
        sessionStartTime: string
        /**
         * @description Session end time
         * @example 14:30:00
         */
        sessionEndTime: string
      }
    }
    responses: {
      /** @description the session capacity for the given sessions */
      200: {
        content: {
          '*/*': components['schemas']['SessionCapacityDto']
        }
      }
      /** @description Incorrect request */
      400: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Unauthorized to access this endpoint */
      401: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Capacity not found */
      404: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
    }
  }
  getDlqMessages: {
    parameters: {
      query: {
        maxMessages?: number
      }
      path: {
        dlqName: string
      }
    }
    responses: {
      /** @description OK */
      200: {
        content: {
          '*/*': components['schemas']['GetDlqResult']
        }
      }
    }
  }
  /**
   * Get a prisoner's profile page
   * @description Get the prisoner's profile page
   */
  getPrisonerProfile: {
    parameters: {
      path: {
        prisonId: string
        prisonerId: string
      }
    }
    responses: {
      /** @description Prisoner Profile Returned */
      200: {
        content: {
          '*/*': components['schemas']['PrisonerProfileDto']
        }
      }
      /** @description Unauthorized to access this endpoint */
      401: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Incorrect permissions to retrieve a prisoner's profile */
      403: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Prisoner profile not found */
      404: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Incorrect request to the prisoner profile page */
      500: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
    }
  }
  /**
   * Get supported prisons
   * @description Get all supported prisons id's
   */
  getSupportedPrisons: {
    responses: {
      /** @description Supported prisons returned */
      200: {
        content: {
          'application/json': string[]
        }
      }
      /** @description Unauthorized to access this endpoint */
      401: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Incorrect permissions to view session templates */
      403: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
    }
  }
}
