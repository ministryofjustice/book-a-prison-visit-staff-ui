/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface paths {
  '/visits/{reference}': {
    /** Retrieve visit by visit reference */
    get: operations['getVisitByReference']
    put: operations['updateVisit']
    /** Delete a visit by visit reference */
    delete: operations['deleteVisit']
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
  '/visits': {
    /** Retrieve visits with optional filters, sorted by startTimestamp ascending */
    get: operations['getVisitsByFilter']
    post: operations['createVisit']
  }
  '/visit-session-templates': {
    /** Get all session templates */
    get: operations['getSessionTemplates']
    post: operations['createSessionTemplate']
  }
  '/visits/{reference}/cancel': {
    patch: operations['cancelVisit']
  }
  '/visit-support': {
    /** Retrieve all available support types */
    get: operations['getSupportTypes']
  }
  '/visit-sessions': {
    /** Retrieve all visits for a specified prisoner */
    get: operations['getVisitSessions']
  }
  '/visit-session-templates/{templateId}': {
    /** Get all session templates */
    get: operations['getSessionTemplate']
    /** Delete a session template by id */
    delete: operations['deleteSessionTemplate']
  }
  '/queue-admin/get-dlq-messages/{dlqName}': {
    get: operations['getDlqMessages']
  }
}

export interface components {
  schemas: {
    /** @description Contact associated with the visit */
    CreateContactOnVisitRequestDto: {
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
    /** @description List of additional support associated with the visit */
    CreateSupportOnVisitRequestDto: {
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
    /** @description List of visitors associated with the visit */
    CreateVisitorOnVisitRequestDto: {
      /**
       * Format: int64
       * @description NOMIS person ID
       * @example 1234556
       */
      nomisPersonId: number
    }
    UpdateVisitRequestDto: {
      /**
       * @description Prisoner Id
       * @example AF34567G
       */
      prisonerId?: string
      /**
       * @description Prison Id
       * @example MDI
       */
      prisonId?: string
      /**
       * @description Visit Room
       * @example A1
       */
      visitRoom?: string
      /**
       * @description Visit Type
       * @example SOCIAL
       */
      visitType?: 'SOCIAL' | 'OFFICIAL' | 'FAMILY'
      /**
       * @description Visit Status
       * @example RESERVED
       */
      visitStatus?: 'RESERVED' | 'BOOKED' | 'CANCELLED'
      /**
       * @description Visit Restriction
       * @example OPEN
       */
      visitRestriction?: 'OPEN' | 'CLOSED'
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
      visitContact?: components['schemas']['CreateContactOnVisitRequestDto']
      /** @description List of visitors associated with the visit */
      visitors?: components['schemas']['CreateVisitorOnVisitRequestDto'][]
      /** @description List of additional support associated with the visit */
      visitorSupport?: components['schemas']['CreateSupportOnVisitRequestDto'][]
    }
    ErrorResponse: {
      /** Format: int32 */
      status: number
      /** Format: int32 */
      errorCode?: number
      userMessage?: string
      developerMessage?: string
    }
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
    /** @description Visit */
    VisitDto: {
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
       * @description Visit Room
       * @example A1 L3
       */
      visitRoom: string
      /**
       * @description Visit Type
       * @example SOCIAL
       */
      visitType: 'SOCIAL' | 'OFFICIAL' | 'FAMILY'
      /**
       * @description Visit Status
       * @example RESERVED
       */
      visitStatus: 'RESERVED' | 'BOOKED' | 'CANCELLED'
      /**
       * @description Visit Restriction
       * @example OPEN
       */
      visitRestriction: 'OPEN' | 'CLOSED'
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
      visitNotes: components['schemas']['VisitNoteDto'][]
      visitContact?: components['schemas']['ContactDto']
      /** @description List of visitors associated with the visit */
      visitors: components['schemas']['VisitorDto'][]
      /** @description List of additional support associated with the visit */
      visitorSupport: components['schemas']['VisitorSupportDto'][]
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
       */
      type: 'VISITOR_CONCERN' | 'VISIT_OUTCOMES' | 'VISIT_COMMENT' | 'STATUS_CHANGED_REASON'
      /**
       * @description Note text
       * @example Visitor is concerned that his mother in-law is coming!
       */
      text: string
    }
    /** @description Visitor */
    VisitorDto: {
      /**
       * Format: int64
       * @description Person ID (nomis) of the visitor
       * @example 1234
       */
      nomisPersonId: number
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
    Message: {
      messageId?: string
      receiptHandle?: string
      body?: string
      attributes?: { [key: string]: string }
      messageAttributes?: {
        [key: string]: components['schemas']['MessageAttributeValue']
      }
      md5OfMessageAttributes?: string
      md5OfBody?: string
    }
    MessageAttributeValue: {
      stringValue?: string
      binaryValue?: {
        /** Format: int32 */
        short?: number
        char?: string
        /** Format: int32 */
        int?: number
        /** Format: int64 */
        long?: number
        /** Format: float */
        float?: number
        /** Format: double */
        double?: number
        direct?: boolean
        readOnly?: boolean
      }
      stringListValues?: string[]
      binaryListValues?: {
        /** Format: int32 */
        short?: number
        char?: string
        /** Format: int32 */
        int?: number
        /** Format: int64 */
        long?: number
        /** Format: float */
        float?: number
        /** Format: double */
        double?: number
        direct?: boolean
        readOnly?: boolean
      }[]
      dataType?: string
    }
    RetryDlqResult: {
      /** Format: int32 */
      messagesFoundCount: number
      messages: components['schemas']['Message'][]
    }
    PurgeQueueResult: {
      /** Format: int32 */
      messagesFoundCount: number
    }
    /** @description Create legacy data */
    CreateLegacyDataRequestDto: {
      /**
       * Format: int64
       * @description NOMIS lead visitor ID
       * @example 1234556
       */
      leadVisitorId: number
    }
    CreateVisitRequestDto: {
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
       * @description Visit Room
       * @example A1
       */
      visitRoom: string
      /**
       * @description Visit Type
       * @example SOCIAL
       */
      visitType: 'SOCIAL' | 'OFFICIAL' | 'FAMILY'
      /**
       * @description Visit Status
       * @example RESERVED
       */
      visitStatus: 'RESERVED' | 'BOOKED' | 'CANCELLED'
      /**
       * @description Visit Restriction
       * @example OPEN
       */
      visitRestriction: 'OPEN' | 'CLOSED'
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
      legacyData?: components['schemas']['CreateLegacyDataRequestDto']
      visitContact?: components['schemas']['CreateContactOnVisitRequestDto']
      /** @description List of visitors associated with the visit */
      visitors?: components['schemas']['CreateVisitorOnVisitRequestDto'][]
      /** @description List of additional support associated with the visit */
      visitorSupport?: components['schemas']['CreateSupportOnVisitRequestDto'][]
      /** @description Visit notes */
      visitNotes?: components['schemas']['VisitNoteDto'][]
    }
    CreateSessionTemplateRequestDto: {
      /**
       * @description prisonId
       * @example MDI
       */
      prisonId: string
      startTime: components['schemas']['LocalTime']
      endTime: components['schemas']['LocalTime']
      /**
       * Format: date
       * @description The start date of the session template
       * @example 2019-12-02
       */
      startDate: string
      /**
       * Format: date
       * @description The expiry date of the session template
       * @example 2019-12-02
       */
      expiryDate?: string
      /**
       * @description visit type
       * @example SOCIAL
       */
      visitType: 'SOCIAL' | 'OFFICIAL' | 'FAMILY'
      /**
       * @description visit room
       * @example A1
       */
      visitRoom: string
      /** @description restrictions */
      restrictions?: string
      /** @description frequency */
      frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SINGLE'
      /**
       * Format: int32
       * @description closed capacity
       * @example 10
       */
      closedCapacity: number
      /**
       * Format: int32
       * @description open capacity
       * @example 50
       */
      openCapacity: number
    }
    /**
     * @description The end time of the generated visit session(s)
     * @example 13:45
     */
    LocalTime: {
      /** Format: int32 */
      hour?: number
      /** Format: int32 */
      minute?: number
      /** Format: int32 */
      second?: number
      /** Format: int32 */
      nano?: number
    }
    SessionTemplateDto: {
      /**
       * Format: int64
       * @description session id
       * @example 123
       */
      sessionTemplateId: number
      /**
       * @description prisonId
       * @example MDI
       */
      prisonId: string
      startTime: components['schemas']['LocalTime']
      endTime: components['schemas']['LocalTime']
      /**
       * Format: date
       * @description The start date of the session template
       * @example 2019-12-02
       */
      startDate: string
      /**
       * Format: date
       * @description The expiry date of the session template
       * @example 2019-12-02
       */
      expiryDate?: string
      /**
       * @description visit type
       * @example SOCIAL
       */
      visitType: 'SOCIAL' | 'OFFICIAL' | 'FAMILY'
      /**
       * @description visit room
       * @example A1
       */
      visitRoom: string
      /** @description restrictions */
      restrictions?: string
      /**
       * @description frequency
       * @example A1
       */
      frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SINGLE'
      /**
       * Format: int32
       * @description closed capacity
       * @example 10
       */
      closedCapacity: number
      /**
       * Format: int32
       * @description open capacity
       * @example 50
       */
      openCapacity: number
    }
    /** @description Visit Outcome */
    OutcomeDto: {
      /**
       * @description Outcome type
       * @example VISITOR_CANCELLED
       */
      outcome: 'VISITOR_CANCELLED' | 'ESTABLISHMENT_CANCELLED' | 'PRISONER_CANCELLED' | 'ADMINISTRATIVE_ERROR'
      /**
       * @description Outcome text
       * @example Because he got covid
       */
      text?: string
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
       * Format: int64
       * @description session id
       * @example 123
       */
      sessionTemplateId: number
      /**
       * @description The Name of the visit room in which this visit session takes place
       * @example Visit room 1
       */
      visitRoomName: string
      /**
       * @description The type of visits taking place within this session
       * @example SOCIAL
       */
      visitType: 'SOCIAL' | 'OFFICIAL' | 'FAMILY'
      /**
       * @description The prison id
       * @example LEI
       */
      prisonId: string
      /**
       * @description Description of any session restrictions
       * @example A wing only
       */
      restrictions?: string
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
    }
    DlqMessage: {
      body: { [key: string]: { [key: string]: unknown } }
      messageId: string
    }
    GetDlqResult: {
      /** Format: int32 */
      messagesFoundCount: number
      /** Format: int32 */
      messagesReturnedCount: number
      messages: components['schemas']['DlqMessage'][]
    }
  }
}

export interface operations {
  /** Retrieve visit by visit reference */
  getVisitByReference: {
    parameters: {
      path: {
        reference: string
      }
    }
    responses: {
      /** Visit Information Returned */
      200: {
        content: {
          'application/json': components['schemas']['VisitDto']
        }
      }
      /** Incorrect request to Get visits for prisoner */
      400: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** Unauthorized to access this endpoint */
      401: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** Incorrect permissions retrieve a visit */
      403: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** Visit not found */
      404: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
    }
  }
  updateVisit: {
    parameters: {
      path: {
        reference: string
      }
    }
    responses: {
      /** Visit updated */
      200: {
        content: {
          'application/json': components['schemas']['VisitDto']
        }
      }
      /** Incorrect request to update a visit */
      400: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** Unauthorized to access this endpoint */
      401: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** Incorrect permissions to update a visit */
      403: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** Visit not found */
      404: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['UpdateVisitRequestDto']
      }
    }
  }
  /** Delete a visit by visit reference */
  deleteVisit: {
    parameters: {
      path: {
        reference: string
      }
    }
    responses: {
      /** Visit deleted */
      200: unknown
      /** Unauthorized to access this endpoint */
      401: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** Incorrect permissions to delete a visit */
      403: {
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
      /** OK */
      200: {
        content: {
          '*/*': components['schemas']['RetryDlqResult']
        }
      }
    }
  }
  retryAllDlqs: {
    responses: {
      /** OK */
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
      /** OK */
      200: {
        content: {
          '*/*': components['schemas']['PurgeQueueResult']
        }
      }
    }
  }
  /** Retrieve visits with optional filters, sorted by startTimestamp ascending */
  getVisitsByFilter: {
    parameters: {
      query: {
        /** Filter results by prisoner id */
        prisonerId?: string
        /** Filter results by prison id */
        prisonId?: string
        /** Filter results by visits that start on or after the given timestamp */
        startTimestamp?: string
        /** Filter results by visits that start on or before the given timestamp */
        endTimestamp?: string
        /** Filter results by visitor (contact id) */
        nomisPersonId?: number
        /** Filter results by visit status */
        visitStatus?: 'RESERVED' | 'BOOKED' | 'CANCELLED'
      }
    }
    responses: {
      /** Visit Information Returned */
      200: {
        content: {
          'application/json': components['schemas']['VisitDto'][]
        }
      }
      /** Incorrect request to Get visits for prisoner */
      400: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** Unauthorized to access this endpoint */
      401: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** Incorrect permissions to retrieve visits */
      403: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
    }
  }
  createVisit: {
    responses: {
      /** Visit created */
      201: {
        content: {
          'application/json': components['schemas']['VisitDto']
        }
      }
      /** Incorrect request to create a visit */
      400: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** Unauthorized to access this endpoint */
      401: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** Incorrect permissions to create a visit */
      403: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['CreateVisitRequestDto']
      }
    }
  }
  /** Get all session templates */
  getSessionTemplates: {
    responses: {
      /** Session templates returned */
      200: {
        content: {
          'application/json': components['schemas']['SessionTemplateDto'][]
        }
      }
      /** Unauthorized to access this endpoint */
      401: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** Incorrect permissions to view session templates */
      403: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
    }
  }
  createSessionTemplate: {
    responses: {
      /** Session Template created */
      201: {
        content: {
          'application/json': components['schemas']['SessionTemplateDto']
        }
      }
      /** Incorrect request to create a session template */
      400: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** Unauthorized to access this endpoint */
      401: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** Incorrect permissions to create a session template */
      403: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['CreateSessionTemplateRequestDto']
      }
    }
  }
  cancelVisit: {
    parameters: {
      path: {
        reference: string
      }
    }
    responses: {
      /** Visit cancelled */
      200: {
        content: {
          'application/json': components['schemas']['VisitDto']
        }
      }
      /** Incorrect request to cancel a visit */
      400: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** Unauthorized to access this endpoint */
      401: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** Incorrect permissions to cancel a visit */
      403: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** Visit not found */
      404: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['OutcomeDto']
      }
    }
  }
  /** Retrieve all available support types */
  getSupportTypes: {
    responses: {
      /** Available Support information returned */
      200: {
        content: {
          'application/json': components['schemas']['SupportTypeDto'][]
        }
      }
      /** Incorrect request to Get Available Support */
      400: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** Unauthorized to access this endpoint */
      401: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
    }
  }
  /** Retrieve all visits for a specified prisoner */
  getVisitSessions: {
    parameters: {
      query: {
        /** Query by NOMIS Prison Identifier */
        prisonId: string
        /** Filter results by prisoner id */
        prisonerId?: string
        /** Override the default minimum number of days notice from the current date */
        min?: number
        /** Override the default maximum number of days to book-ahead from the current date */
        max?: number
      }
    }
    responses: {
      /** Visit session information returned */
      200: {
        content: {
          'application/json': components['schemas']['VisitSessionDto'][]
        }
      }
      /** Incorrect request to Get visit sessions */
      400: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** Unauthorized to access this endpoint */
      401: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
    }
  }
  /** Get all session templates */
  getSessionTemplate: {
    parameters: {
      path: {
        templateId: number
      }
    }
    responses: {
      /** Session templates returned */
      200: {
        content: {
          'application/json': components['schemas']['SessionTemplateDto']
        }
      }
      /** Unauthorized to access this endpoint */
      401: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** Incorrect permissions to view session templates */
      403: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
    }
  }
  /** Delete a session template by id */
  deleteSessionTemplate: {
    parameters: {
      path: {
        templateId: number
      }
    }
    responses: {
      /** Visit deleted */
      200: unknown
      /** Unauthorized to access this endpoint */
      401: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** Incorrect permissions to delete a session template */
      403: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
    }
  }
  getDlqMessages: {
    parameters: {
      path: {
        dlqName: string
      }
      query: {
        maxMessages?: number
      }
    }
    responses: {
      /** OK */
      200: {
        content: {
          '*/*': components['schemas']['GetDlqResult']
        }
      }
    }
  }
}

// export interface external {}
